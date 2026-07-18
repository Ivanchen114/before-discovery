/* tests/suite.js — 共用測試套件(瀏覽器 tests.html 與 node 皆可執行)
   鏡像一致性測試(R-DATA-05)需檔案系統,收於 run-node.mjs(npm test 涵蓋全部)。 */
(function (root, factory) {
  "use strict";
  if (typeof module === "object" && module.exports) { module.exports = factory; }
  else { root.GB = root.GB || {}; root.GB.buildSuite = factory; }
})(typeof self !== "undefined" ? self : this, function (Engine, PATTERNS, DEBATE) {
  "use strict";
  var tests = [];
  function t(name, fn) { tests.push({ name: name, fn: fn }); }
  function ok(v, m) { if (!v) throw new Error(m || "斷言失敗"); }
  function eq(a, b, m) {
    var ja = JSON.stringify(a), jb = JSON.stringify(b);
    if (ja !== jb) throw new Error((m || "") + " 期望 " + jb + " 實得 " + ja);
  }

  var BALLS = ["銅大", "銅小", "木球"], SURFS = ["打磨", "原木"], INCS = ["緩", "中", "陡"], TIMERS = ["水鐘", "脈搏", "音格"];

  /* §3.2 通過矩陣(規範)之期望值 */
  function expectCell(cfg) {
    if (cfg.ball === "木球" || cfg.surface === "原木") return [false, false];
    var M = {
      "緩|水鐘": [true, true], "緩|音格": [true, true], "中|水鐘": [true, true],
      "中|音格": [true, true], "陡|音格": [true, true],
      "緩|脈搏": [false, true],
      "陡|水鐘": [false, false], "陡|脈搏": [false, false], "中|脈搏": [false, false]
    };
    return M[cfg.incline + "|" + cfg.timer];
  }

  function nthRunState(cfg, n) { /* 執行 n 次,回 {state, lastRun} */
    var s = Engine.initialState(), last = null;
    for (var i = 0; i < n; i++) { var r = Engine.runExperiment(s, cfg); s = r.state; last = r.run; }
    return { state: s, lastRun: last };
  }
  function singleClaim(cfg, runIdx) { /* 第 runIdx+1 次執行之單次判定(預測=9·Δ1,命中) */
    var x = nthRunState(cfg, runIdx + 1);
    var res = Engine.judge(x.state, [x.lastRun.id], 9 * x.lastRun.readings[0]);
    return res.claim;
  }
  function avgClaim(cfg) { /* 三次平均判定 */
    var s = Engine.initialState(), ids = [];
    for (var i = 0; i < 3; i++) { var r = Engine.runExperiment(s, cfg); s = r.state; ids.push(r.run.id); }
    var a1 = 0;
    s.evidence.runs.forEach(function (r) { if (ids.indexOf(r.id) >= 0) a1 += r.readings[0]; });
    var res = Engine.judge(s, ids, 9 * a1 / 3);
    return res.claim;
  }

  t("R-DATA-03|矩陣一致性:54 配置全枚舉(單次×3 run+三次平均=216 判定點)", function () {
    BALLS.forEach(function (ball) { SURFS.forEach(function (surface) { INCS.forEach(function (incline) { TIMERS.forEach(function (timer) {
      var cfg = { ball: ball, surface: surface, incline: incline, timer: timer };
      var e = expectCell(cfg), label = ball + "|" + surface + "|" + incline + "|" + timer;
      for (var r = 0; r < 3; r++) {
        var c = singleClaim(cfg, r);
        ok(c.ok === e[0], label + " run" + (r + 1) + " 單次=" + c.ok + " 規範=" + e[0]);
      }
      var ca = avgClaim(cfg);
      ok(ca.ok === e[1], label + " 三平均=" + ca.ok + " 規範=" + e[1]);
    }); }); }); });
  });

  t("附錄A|安全邊際:通過格偏差 ≤11.5%、不通過格 ≥12.5%", function () {
    BALLS.forEach(function (ball) { SURFS.forEach(function (surface) { INCS.forEach(function (incline) { TIMERS.forEach(function (timer) {
      var cfg = { ball: ball, surface: surface, incline: incline, timer: timer };
      var e = expectCell(cfg), label = ball + "|" + surface + "|" + incline + "|" + timer;
      var claims = [singleClaim(cfg, 0), singleClaim(cfg, 1), singleClaim(cfg, 2)];
      claims.forEach(function (c, i) {
        if (e[0]) ok(c.maxDev <= 0.115, label + " run" + (i + 1) + " 邊際不足(過):" + c.maxDev);
        else ok(c.maxDev >= 0.125, label + " run" + (i + 1) + " 邊際不足(不過):" + c.maxDev);
      });
      var ca = avgClaim(cfg);
      if (e[1]) ok(ca.maxDev <= 0.115, label + " 三平均邊際不足(過):" + ca.maxDev);
      else ok(ca.maxDev >= 0.125, label + " 三平均邊際不足(不過):" + ca.maxDev);
    }); }); }); });
  });

  t("R-DATA-01|下限夾制:全部讀值 ≥1", function () {
    BALLS.forEach(function (ball) { SURFS.forEach(function (surface) { INCS.forEach(function (incline) { TIMERS.forEach(function (timer) {
      for (var p = 0; p < 3; p++) {
        Engine.computeReadings({ ball: ball, surface: surface, incline: incline, timer: timer }, p)
          .forEach(function (v) { ok(v >= 1, "讀值 <1"); });
      }
    }); }); }); });
  });

  t("R-EXP-03|同配置樣式輪替 1→2→3→1,且確定性可重現", function () {
    var cfg = { ball: "銅大", surface: "打磨", incline: "緩", timer: "水鐘" };
    var s = Engine.initialState(), runs = [];
    for (var i = 0; i < 4; i++) { var r = Engine.runExperiment(s, cfg); s = r.state; runs.push(r.run); }
    eq(runs.map(function (r) { return r.patternIndex; }), [0, 1, 2, 0], "輪替序");
    eq(runs[3].readings, runs[0].readings, "第4次=第1次樣式");
    var s2 = Engine.initialState();
    var r2 = Engine.runExperiment(s2, cfg);
    eq(r2.run.readings, runs[0].readings, "跨 session 重現");
  });

  t("R-EXP-01|天數成本:脈搏+1/水鐘+2/音格+3", function () {
    var s = Engine.initialState();
    s = Engine.runExperiment(s, { ball: "銅大", surface: "打磨", incline: "緩", timer: "脈搏" }).state;
    eq(s.days, 1, "脈搏");
    s = Engine.runExperiment(s, { ball: "銅大", surface: "打磨", incline: "緩", timer: "水鐘" }).state;
    eq(s.days, 3, "水鐘");
    s = Engine.runExperiment(s, { ball: "銅大", surface: "打磨", incline: "緩", timer: "音格" }).state;
    eq(s.days, 6, "音格");
  });

  t("R-JUD-01|選集守衛為四維:混計時工具遭拒且列出「計時」;claims 不追加", function () {
    var s = Engine.initialState();
    s = Engine.runExperiment(s, { ball: "銅大", surface: "打磨", incline: "緩", timer: "水鐘" }).state;
    s = Engine.runExperiment(s, { ball: "銅大", surface: "打磨", incline: "緩", timer: "脈搏" }).state;
    var res = Engine.judge(s, [1, 2], 100);
    ok(res.rejected, "應遭拒");
    eq(res.rejected.diff, ["計時"], "相異變因清單");
    eq(res.state.inference.claims.length, 0, "不記 claim");
  });

  t("R-JUD-03/04|預測未中:成敗皆記,回饋僅含類型與偏差", function () {
    var x = nthRunState({ ball: "銅大", surface: "打磨", incline: "緩", timer: "水鐘" }, 1);
    var res = Engine.judge(x.state, [x.lastRun.id], 9 * x.lastRun.readings[0] * 2); /* 預測值離譜 */
    ok(!res.claim.ok && !res.claim.predHit && res.claim.consistent, "預測未中但選集一致");
    ok(res.state.inference.claims.length === 1, "失敗主張仍入紀錄");
    ok(typeof res.claim.predDev === "number" && typeof res.claim.maxDev === "number", "偏差幅度存在");
  });

  t("R-JUD-05|斷言b:銅大×銅小(餘三維全同)→E3.b;混計時遭拒列「計時」", function () {
    var s = Engine.initialState(), ids = { A: [], B: [], C: [] };
    var cfgA = { ball: "銅大", surface: "打磨", incline: "緩", timer: "水鐘" };
    var cfgB = { ball: "銅小", surface: "打磨", incline: "緩", timer: "水鐘" };
    var cfgC = { ball: "銅小", surface: "打磨", incline: "緩", timer: "音格" };
    [cfgA, cfgB, cfgC].forEach(function (cfg, k) {
      var key = ["A", "B", "C"][k];
      var r = Engine.runExperiment(s, cfg); s = r.state; ids[key].push(r.run.id);
    });
    var cA = Engine.judge(s, ids.A, 9 * s.evidence.runs[ids.A[0] - 1].readings[0]); s = cA.state;
    var cB = Engine.judge(s, ids.B, 9 * s.evidence.runs[ids.B[0] - 1].readings[0]); s = cB.state;
    var cC = Engine.judge(s, ids.C, 9 * s.evidence.runs[ids.C[0] - 1].readings[0]); s = cC.state;
    ok(cA.claim.ok && cB.claim.ok && cC.claim.ok, "三主張皆成立");
    var bad = Engine.assertE3(s, "b", [cA.claim.id, cC.claim.id]); s = bad.state;
    ok(!bad.assertion.ok, "混計時斷言應拒");
    eq(bad.assertion.diff, ["球", "計時"], "列出實際相異變因");
    ok(!s.evidence.e3.b, "E3.b 未點亮");
    var good = Engine.assertE3(s, "b", [cA.claim.id, cB.claim.id]); s = good.state;
    ok(good.assertion.ok && s.evidence.e3.b, "E3.b 點亮");
  });

  t("R-JUD-05|斷言c:僅傾角相異(緩×中)→E3.c", function () {
    var s = Engine.initialState();
    var r1 = Engine.runExperiment(s, { ball: "銅大", surface: "打磨", incline: "緩", timer: "水鐘" }); s = r1.state;
    var r2 = Engine.runExperiment(s, { ball: "銅大", surface: "打磨", incline: "中", timer: "水鐘" }); s = r2.state;
    var c1 = Engine.judge(s, [r1.run.id], 9 * r1.run.readings[0]); s = c1.state;
    var c2 = Engine.judge(s, [r2.run.id], 9 * r2.run.readings[0]); s = c2.state;
    var as = Engine.assertE3(s, "c", [c1.claim.id, c2.claim.id]); s = as.state;
    ok(as.assertion.ok && s.evidence.e3.c, "E3.c 點亮");
  });

  t("R-DEB-05/06/07/08+R-STA-04|不足/錯誤/中止/再入/空手", function () {
    /* 空手入場:錯誤出示 −1 */
    var s = Engine.initialState();
    var p = Engine.present(s, { evidence: "E1", subitem: null, target: "s2" }); s = p.state;
    eq(p.outcome, "wrong"); eq(s.belief.P3.persuasion, 4);
    /* (E3,b,s2) 而 b 未亮 → 錯誤出示 */
    p = Engine.present(s, { evidence: "E3", subitem: "b", target: "s2" }); s = p.state;
    eq(p.outcome, "wrong"); eq(s.belief.P3.persuasion, 3);
    /* 建立 E3.a(單次可判配置) */
    var r = Engine.runExperiment(s, { ball: "銅大", surface: "打磨", incline: "緩", timer: "水鐘" }); s = r.state;
    var c = Engine.judge(s, [r.run.id], 9 * r.run.readings[0]); s = c.state;
    ok(s.evidence.e3.a, "E3.a");
    /* 方向對但不足:量表不減、需求旗標 */
    p = Engine.present(s, { evidence: "E3", subitem: "a", target: "s2" }); s = p.state;
    eq(p.outcome, "insufficient"); eq(s.belief.P3.persuasion, 3); ok(s.belief.P3.s2NeedFlag, "需求旗標");
    /* 連錯至歸零 → suspended;中止時出示被擋 */
    p = Engine.present(s, { evidence: "S1", subitem: null, target: "s1" }); s = p.state;
    p = Engine.present(s, { evidence: "S1", subitem: null, target: "s2" }); s = p.state;
    p = Engine.present(s, { evidence: "S1", subitem: null, target: "s3" }); s = p.state;
    eq(p.outcome, "suspended"); eq(s.belief.P3.status, "suspended"); eq(s.belief.P3.persuasion, 0);
    eq(Engine.present(s, { evidence: "E3", subitem: "a", target: "s2" }).outcome, "suspended_block");
    /* 再入:量表重置、證詞保留 */
    var re = Engine.reenterDebate(s); s = re.state;
    eq(s.belief.P3.persuasion, 5); eq(s.belief.P3.status, "pending");
    eq(s.belief.P3.statements, { s1: "intact", s2: "intact", s3: "intact" }, "證詞狀態保留");
  });

  t("R-DEB-02|s2 追問文含「重量」線索;追問不改量表", function () {
    ok(Engine.press("s2").indexOf("重量") >= 0, "重量線索");
    var s = Engine.initialState();
    Engine.press("s1");
    eq(s.belief.P3.persuasion, 5, "量表不變");
  });

  t("整合流|緩+水鐘:銅大×1+銅小×1 → E3.a∧b → (E3,b,s2) 擊破 P3;天數=4", function () {
    var s = Engine.initialState();
    var rA = Engine.runExperiment(s, { ball: "銅大", surface: "打磨", incline: "緩", timer: "水鐘" }); s = rA.state;
    var rB = Engine.runExperiment(s, { ball: "銅小", surface: "打磨", incline: "緩", timer: "水鐘" }); s = rB.state;
    var cA = Engine.judge(s, [rA.run.id], 9 * rA.run.readings[0]); s = cA.state;
    var cB = Engine.judge(s, [rB.run.id], 9 * rB.run.readings[0]); s = cB.state;
    var as = Engine.assertE3(s, "b", [cA.claim.id, cB.claim.id]); s = as.state;
    ok(Engine.e3Established(s), "E3 確立(a∧b)");
    var p = Engine.present(s, { evidence: "E3", subitem: "b", target: "s2" }); s = p.state;
    eq(p.outcome, "correct");
    eq(s.belief.P3.statements.s2, "broken");
    eq(s.belief.P3.status, "broken");
    eq(s.days, 4, "水鐘×2=4天");
    eq(Engine.present(s, { evidence: "E1", subitem: null, target: "s1" }).outcome, "already_broken");
  });

  t("整合流|廉價路徑:緩+脈搏 單次不可判、三次平均可判(銅大)", function () {
    var cfg = { ball: "銅大", surface: "打磨", incline: "緩", timer: "脈搏" };
    ok(!singleClaim(cfg, 0).ok && !singleClaim(cfg, 1).ok && !singleClaim(cfg, 2).ok, "單次皆不可判");
    ok(avgClaim(cfg).ok, "三次平均可判");
  });

  t("R-STA-05|純函式:輸入狀態不被變異", function () {
    var s0 = Engine.initialState();
    var frozen = JSON.stringify(s0);
    Engine.runExperiment(s0, { ball: "銅大", surface: "打磨", incline: "緩", timer: "水鐘" });
    Engine.present(s0, { evidence: "E1", subitem: null, target: "s1" });
    eq(JSON.stringify(s0), frozen, "原狀態不變");
  });

  return tests;
});
