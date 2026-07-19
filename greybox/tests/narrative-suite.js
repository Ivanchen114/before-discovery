/* tests/narrative-suite.js — M1 敘事層測試(瀏覽器+node 共用) */
(function (root, factory) {
  "use strict";
  if (typeof module === "object" && module.exports) { module.exports = factory; }
  else { root.GB = root.GB || {}; root.GB.buildNarrativeSuite = factory; }
})(typeof self !== "undefined" ? self : this, function (Narrative, SCENES) {
  "use strict";
  var tests = [];
  function t(name, fn) { tests.push({ name: name, fn: fn }); }
  function ok(v, m) { if (!v) throw new Error(m || "斷言失敗"); }
  function eq(a, b, m) {
    var ja = JSON.stringify(a), jb = JSON.stringify(b);
    if (ja !== jb) throw new Error((m || "") + " 期望 " + jb + " 實得 " + ja);
  }

  /* 便利:自動前進至下一個 choice/embed/review/end;回傳所有經過節點 */
  function run(state) {
    var passed = [];
    for (var i = 0; i < 500; i++) {
      var v = Narrative.view(state);
      if (v.type === "choice" || v.type === "end" || v.type === "embed" || v.type === "review") return { state: state, view: v, passed: passed };
      var r = Narrative.advance(state);
      if (r.error) throw new Error(r.error);
      passed.push(r.node);
      state = r.state;
      if (r.done || state.ended) return { state: state, view: Narrative.view(state), passed: passed };
    }
    throw new Error("run() 未收斂");
  }
  function pick(state, id) {
    var r = Narrative.choose(state, id);
    if (r.error) throw new Error("choose " + id + ":" + r.error);
    return r.state;
  }

  t("R-NAR-01|圖整合性:所有 next/goto/option.next 目標存在;全場景可達", function () {
    var ids = {};
    SCENES.scenes.forEach(function (s) { ids[s.id] = {}; s.nodes.forEach(function (n) { ids[s.id][n.id] = n; }); });
    SCENES.scenes.forEach(function (s) {
      s.nodes.forEach(function (n) {
        if (n.next) ok(ids[s.id][n.next], s.id + "/" + n.id + " next 目標缺:" + n.next);
        if (n.type === "goto") ok(ids[n.scene], s.id + "/" + n.id + " goto 場景缺:" + n.scene);
        if (n.suspendNext) ok(ids[s.id][n.suspendNext], s.id + "/" + n.id + " suspendNext 目標缺:" + n.suspendNext);
        (n.options || []).forEach(function (o) {
          ok(ids[s.id][o.next], s.id + "/" + n.id + "." + o.id + " 目標缺:" + o.next);
        });
      });
    });
    /* 可達性:自 startScene 沿全部邊 BFS(忽略守衛);SC-R1 由引擎 redirectIfLocked 導入(R-REP-02),列為額外入口 */
    var reach = {}, queue = [SCENES.startScene, "SC-R1"];
    while (queue.length) {
      var sid = queue.shift();
      if (reach[sid]) continue;
      reach[sid] = true;
      SCENES.scenes.filter(function (s) { return s.id === sid; })[0].nodes.forEach(function (n) {
        if (n.type === "goto" && !reach[n.scene]) queue.push(n.scene);
      });
    }
    SCENES.scenes.forEach(function (s) { ok(reach[s.id], "場景不可達:" + s.id); });
  });

  /* R-NAR-05 驗證器(章規格 v0.1.1:class 封閉列舉;未知 class 必敗;
     character-hypothesis 須 reason+refutedBy(指向可達之玩家互動節點,且不得用於 system/stage);
     post-reveal 須 afterPlayerNode 存在且位於前方)。lint=防回歸工具,不取代人工語義審稿。 */
  var LEGAL_CLASSES = ["character-hypothesis", "post-reveal"];
  function validateLint(data) {
    var banned = data.lint.bannedWords;
    var classes = data.lint.classes || [];
    classes.forEach(function (c) {
      if (LEGAL_CLASSES.indexOf(c) < 0) throw new Error("lint.classes 含非法類別:" + c);
    });
    var wl = {};
    data.lint.whitelist.forEach(function (w) { wl[w.scene + "/" + w.node] = w; });
    var sceneIdx = {};
    data.scenes.forEach(function (s) { sceneIdx[s.id] = s; });
    data.scenes.forEach(function (s) {
      s.nodes.forEach(function (n) {
        if (n.type !== "line" && n.type !== "system") return; /* choice 選項=玩家認知,豁免 */
        if (n.speaker === "旅人") return;
        var text = n.text || "";
        banned.forEach(function (w) {
          if (text.indexOf(w) >= 0 && !wl[s.id + "/" + n.id]) {
            throw new Error(s.id + "/" + n.id + " 含禁詞「" + w + "」且不在白名單");
          }
        });
      });
    });
    data.lint.whitelist.forEach(function (w) {
      if (classes.indexOf(w["class"]) < 0) throw new Error("白名單 class 非封閉列舉成員:" + w.scene + "/" + w.node + " class=" + w["class"]);
      if (!w.reason) throw new Error("白名單缺 reason:" + w.scene + "/" + w.node);
      var sc = sceneIdx[w.scene];
      if (!sc) throw new Error("白名單場景缺:" + w.scene);
      var idx = -1, after = -1, target = null;
      sc.nodes.forEach(function (n, i) {
        if (n.id === w.node) { idx = i; target = n; }
        if (w.afterPlayerNode && n.id === w.afterPlayerNode) after = i;
      });
      if (idx < 0) throw new Error("白名單節點缺:" + w.scene + "/" + w.node);
      if (w["class"] === "post-reveal") {
        if (after < 0) throw new Error("post-reveal 須指定存在的 afterPlayerNode:" + w.scene + "/" + w.node);
        if (idx <= after) throw new Error("post-reveal 節點須位於玩家操作節點之後:" + w.scene + "/" + w.node);
      }
      if (w["class"] === "character-hypothesis") {
        if (target && (target.speaker === "system" || target.speaker === "stage")) {
          throw new Error("character-hypothesis 不得用於 system/stage 正典結論:" + w.scene + "/" + w.node);
        }
        var rb = w.refutedBy;
        if (!rb || !rb.scene || !rb.node) throw new Error("character-hypothesis 缺 refutedBy:" + w.scene + "/" + w.node);
        var rsc = sceneIdx[rb.scene];
        if (!rsc) throw new Error("refutedBy 場景缺:" + rb.scene);
        var rnode = null;
        rsc.nodes.forEach(function (n) { if (n.id === rb.node) rnode = n; });
        if (!rnode) throw new Error("refutedBy 節點缺:" + rb.scene + "/" + rb.node);
        if (rnode.type !== "embed" && rnode.type !== "choice") {
          throw new Error("refutedBy 須指向玩家互動節點(embed/choice):" + rb.scene + "/" + rb.node);
        }
      }
    });
    return true;
  }

  t("R-NAR-05|結論詞彙 lint:真實資料通過封閉列舉驗證器", function () {
    ok(validateLint(SCENES) === true);
  });

  t("A-2 負向|未知 class/缺 refutedBy/無效 refutedBy/缺 afterPlayerNode 皆必敗", function () {
    function mutated(fn) {
      var copy = JSON.parse(JSON.stringify(SCENES));
      fn(copy);
      var threw = false;
      try { validateLint(copy); } catch (e) { threw = true; }
      return threw;
    }
    ok(mutated(function (c) { c.lint.whitelist[0]["class"] = "pre-discovery"; }), "舊類別名必敗");
    ok(mutated(function (c) { c.lint.whitelist[0]["class"] = "post-revea1"; }), "錯字 class 必敗");
    ok(mutated(function (c) { c.lint.classes.push("free-pass"); }), "擅增類別必敗");
    ok(mutated(function (c) { delete c.lint.whitelist[0].refutedBy; }), "character-hypothesis 缺 refutedBy 必敗");
    ok(mutated(function (c) { c.lint.whitelist[0].refutedBy = { scene: "A2-2", node: "沒這節點" }; }), "refutedBy 無效節點必敗");
    ok(mutated(function (c) { c.lint.whitelist[0].refutedBy = { scene: "A1-1", node: "n2" }; }), "refutedBy 指向非互動節點必敗");
    ok(mutated(function (c) { delete c.lint.whitelist[1].afterPlayerNode; }), "post-reveal 缺 afterPlayerNode 必敗");
    ok(mutated(function (c) { c.lint.whitelist[1].afterPlayerNode = "n5"; }), "afterPlayerNode 在後方必敗");
  });

  t("主線通關|路徑A(探索):P0→INT-1 終點;證據 S2/S1/E1/E2 齊;信譽帳正確", function () {
    var s = Narrative.initialState("explore");
    var r = run(s); s = r.state;                    /* P0-1 q1 */
    eq(r.view.nodeId, "q1");
    s = pick(s, "b"); r = run(s); s = r.state;      /* +1 → P0-2 q1 */
    eq(s.rep, 4, "P0-1.b 信譽+1");
    s = pick(s, "a"); r = run(s); s = r.state;      /* 脫口而出 −1 */
    eq(s.rep, 3, "P0-2.a 信譽−1");
    /* A1-3 三選單:先踩鉛+木勸阻 */
    eq(r.view.scene, "A1-3");
    s = pick(s, "b"); r = run(s); s = r.state;      /* 勸阻 → 回 q1,B 已隱藏 */
    eq(r.view.nodeId, "q1");
    var optIds = r.view.options.map(function (o) { return o.id; });
    eq(optIds, ["a"], "R-TWR-02:勸阻後 B 隱藏");
    s = pick(s, "a"); r = run(s); s = r.state;      /* q1=a → q3(場地由敘事決定,q2 已刪) */
    s = pick(s, "b"); r = run(s); s = r.state;      /* w=assistant → 塔 → A1-5(含助手插入) */
    ok(s.flags.w === "assistant", "w 旗標");
    var texts = r.passed.map(function (n) { return n.text; }).join("|");
    ok(texts.indexOf("屬實更好") >= 0, "w=assistant 插入台詞出現");
    eq(r.view.scene, "A1-7");
    s = pick(s, "a"); r = run(s); s = r.state;      /* 綁縛 a 支 */
    s = pick(s, "a"); r = run(s); s = r.state;      /* 更重 → 匯流;探索模式跳過學者加問 → INT-1 q1 */
    eq(r.view.scene, "INT-1");
    s = pick(s, "b"); r = run(s); s = r.state;      /* +1 → 幕間收束,接第二幕 */
    eq(s.rep, 4, "INT-1.b 信譽+1");
    eq(r.view.scene, "A2-1", "幕間接第二幕(M2)");
    eq([!!s.evidence.S2, !!s.evidence.S1, !!s.evidence.E1, !!s.evidence.E2], [true, true, true, true], "四證據入袋");
  });

  t("主線通關|路徑B(學者):綁縛 b 支鏡像+學者加問可見;w=none 無助手台詞", function () {
    var s = Narrative.initialState("scholar");
    var r = run(s); s = pick(r.state, "a"); r = run(s); s = r.state;   /* P0-1.a 無效果 */
    eq(s.rep, 3);
    s = pick(s, "b"); r = run(s); s = r.state;       /* P0-2.b → qB */
    eq(r.view.nodeId, "qB");
    s = pick(s, "b1"); r = run(s); s = r.state;      /* +1=4 */
    eq(s.rep, 4, "b1 信譽+1");
    s = pick(s, "a"); r = run(s); s = r.state;       /* q1=a 直走 */
    s = pick(s, "c"); r = run(s); s = r.state;       /* q3:w=none(q2 已刪) */
    var texts = r.passed.map(function (n) { return n.text; }).join("|");
    ok(texts.indexOf("屬實更好") < 0, "w=none 不出現助手台詞");
    eq(r.view.scene, "A1-7");
    s = pick(s, "b"); r = run(s); s = r.state;       /* 鏡像支 */
    s = pick(s, "a"); r = run(s); s = r.state;       /* 會拖慢 → 匯流 → 學者加問 qS */
    eq(r.view.nodeId, "qS", "學者加問可見");
    s = pick(s, "a"); r = run(s); s = r.state;
    eq(r.view.scene, "INT-1");
    s = pick(s, "a"); r = run(s); s = r.state;       /* 玩笑選項,無效果 */
    eq(s.rep, 4, "INT-1.a 無信譽變動");
    eq(r.view.scene, "A2-1", "幕間接第二幕");
  });

  /* ===== M2:第二幕 ===== */

  function toActTwo(mode) { /* 快轉:序幕+第一幕 → A2-2 embed e1 */
    var s = Narrative.initialState(mode || "explore");
    var r = run(s); s = pick(r.state, "a");
    r = run(s); s = pick(r.state, "a");              /* P0-2.a(−1) */
    r = run(s); s = pick(r.state, "a");              /* A1-3 q1=a */
    r = run(s); s = pick(r.state, "c");              /* q3 w=none(q2 已刪) */
    r = run(s); s = pick(r.state, "a");              /* A1-7 a */
    r = run(s); s = pick(r.state, "a");              /* qA2 */
    r = run(s); s = r.state;
    if (Narrative.view(s).nodeId === "qS") { s = pick(s, "a"); r = run(s); s = r.state; } /* 學者加問 */
    s = pick(s, "a"); r = run(s); s = r.state;       /* INT-1.a */
    /* A2-1:先走錯的「更高」再走對的 */
    eq(r.view.scene, "A2-1", "抵達 A2-1");
    s = pick(s, "a"); r = run(s); s = r.state;       /* 駁回,回選單 */
    eq(r.view.nodeId, "q1", "A2-1.a 駁回重選");
    s = pick(s, "b"); r = run(s); s = r.state;       /* → A2-2 embed */
    eq(r.view.type, "embed", "抵達實驗台 embed");
    eq(r.view.scene, "A2-2");
    return s;
  }
  function lab(s, action, args) {
    var r = Narrative.labAction(s, action, args);
    if (r.error) throw new Error(r.error);
    return r;
  }
  var CFG_BIG = { ball: "銅大", surface: "打磨", incline: "緩", timer: "水鐘" };
  var CFG_SMALL = { ball: "銅小", surface: "打磨", incline: "緩", timer: "水鐘" };

  t("M2|嵌入門檻:條件未達時 advance/embedComplete 皆擋", function () {
    var s = toActTwo("explore");
    ok(Narrative.advance(s).error, "embed 不可 advance");
    ok(Narrative.embedComplete(s).error, "條件未達不可收束");
    ok(!Narrative.embedReady(s), "ready=false");
  });

  t("M2|黃金路徑(探索):E3.a→換球 E3.b→E4 兩實驗→A2-5 終點;天數與證據同步", function () {
    var s = toActTwo("explore");
    var r = lab(s, "run", { config: CFG_BIG }); s = r.state;
    var run1 = r.result.run;
    r = lab(s, "judge", { runIds: [run1.id], prediction: 9 * run1.readings[0] }); s = r.state;
    ok(r.result.claim.ok, "主張成立");
    ok(Narrative.embedReady(s), "E3.a 達標");
    var c = Narrative.embedComplete(s); s = c.state;
    var rr = run(s); s = rr.state;                    /* c1 被跳過(無 hadFailure)→ n3~n5 → A2-3 q1 */
    var texts = rr.passed.map(function (n) { return n.text; }).join("|");
    ok(texts.indexOf("作廢的紀錄") < 0, "無失敗時不出現死路B回述");
    eq(rr.view.scene, "A2-3");
    s = pick(s, "b"); rr = run(s); s = rr.state;      /* 吵渴望 → 駁回 */
    eq(rr.view.nodeId, "q1", "A2-3.b 駁回");
    s = pick(s, "a"); rr = run(s); s = rr.state;      /* 換球 → embed e2 */
    eq(rr.view.type, "embed");
    eq(rr.view.preset && rr.view.preset.ball, "銅小", "R-HOOK-01 預選銅小");
    r = lab(s, "run", { config: CFG_SMALL }); s = r.state;
    var run2 = r.result.run;
    r = lab(s, "judge", { runIds: [run2.id], prediction: 9 * run2.readings[0] }); s = r.state;
    ok(r.result.claim.ok, "銅小主張成立");
    ok(!Narrative.embedReady(s), "尚未斷言,b 未亮");
    r = lab(s, "assert", { type: "b", claimIds: [1, 2] }); s = r.state;
    ok(r.result.assertion.ok, "斷言 b 成立");
    ok(s.evidence.E3, "章節證據 E3 同步(a∧b)");
    c = Narrative.embedComplete(s); s = c.state;
    rr = run(s); s = rr.state;                        /* n5→c0→e3c(變傾角必經,雙模式) */
    eq(rr.view.nodeId, "e3c", "E3.c 必經 embed");
    ok(rr.view.preset && rr.view.preset.incline === "中", "引導預選中傾角");
    r = lab(s, "run", { config: { ball: "銅大", surface: "打磨", incline: "中", timer: "水鐘" } }); s = r.state;
    r = lab(s, "judge", { runIds: [3], prediction: 9 * r.result.run.readings[0] }); s = r.state;
    r = lab(s, "assert", { type: "c", claimIds: [1, 3] }); s = r.state;
    ok(r.result.assertion.ok, "斷言 c 成立");
    ok(s.lab.evidence.e3.c, "E3.c 點亮(探索模式必經)");
    c = Narrative.embedComplete(s); s = c.state;
    rr = run(s); s = rr.state;                        /* nsch→n6→A2-4 qP */
    eq(rr.view.scene, "A2-4");
    eq(rr.view.nodeId, "qP");
    ["flat", "crum", "scale"].forEach(function (op) {
      s = pick(s, op); var x = run(s); s = x.state;
      eq(x.view.nodeId, "qP", "操作後回 hub:" + op);
    });
    s = pick(s, "done"); rr = run(s); s = rr.state;
    s = pick(s, "b"); rr = run(s); s = rr.state;      /* 錯誤結論:重量 → 駁回 */
    eq(rr.view.nodeId, "qPc", "天平駁回後重選");
    s = pick(s, "a"); rr = run(s); s = rr.state;      /* 形狀 ✓ → 球 hub */
    eq(rr.view.nodeId, "qB");
    ["air", "water"].forEach(function (op) {
      s = pick(s, op); var x = run(s); s = x.state;
    });
    s = pick(s, "done"); rr = run(s); s = rr.state;
    s = pick(s, "a"); rr = run(s); s = rr.state;      /* 介質 ✓ → E4 → A2-5 → 第三幕辯論 embed */
    ok(s.evidence.E4, "E4 入袋");
    eq(rr.view.scene, "A3-D", "第二幕收束後進辯論");
    eq(rr.view.system, "debate", "辯論 embed");
    ok(s.debate && s.debate.status === "pending", "辯論已初始化");
    eq(s.lab.days, 6, "天數:水鐘×3=6(R-EXP-01 同步;含 E3.c 必經複驗)");
  });

  t("M2|hadFailure:失敗判定觸發旗標,死路B回述於 embed 後出現", function () {
    var s = toActTwo("explore");
    var r = lab(s, "run", { config: { ball: "銅大", surface: "原木", incline: "緩", timer: "水鐘" } }); s = r.state;
    r = lab(s, "judge", { runIds: [1], prediction: 9 * r.result.run.readings[0] }); s = r.state;
    ok(!r.result.claim.ok, "原木配置不可判定");
    eq(s.flags.hadFailure, "1", "hadFailure 旗標");
    r = lab(s, "run", { config: CFG_BIG }); s = r.state;
    r = lab(s, "judge", { runIds: [2], prediction: 9 * r.result.run.readings[0] }); s = r.state;
    ok(r.result.claim.ok);
    var c = Narrative.embedComplete(s); s = c.state;
    var rr = run(s); s = rr.state;
    var texts = rr.passed.map(function (n) { return n.text; }).join("|");
    ok(texts.indexOf("作廢的紀錄") >= 0, "死路B回述出現(c1)");
  });

  t("M2|E3.c 雙模式必經:學者模式同走 e3c(可自由改配置)", function () {
    var s = toActTwo("scholar");
    var r = lab(s, "run", { config: CFG_BIG }); s = r.state;
    r = lab(s, "judge", { runIds: [1], prediction: 9 * r.result.run.readings[0] }); s = r.state;
    s = Narrative.embedComplete(s).state;
    var rr = run(s); s = rr.state;
    s = pick(s, "a"); rr = run(s); s = rr.state;      /* 換球 → e2 */
    r = lab(s, "run", { config: CFG_SMALL }); s = r.state;
    r = lab(s, "judge", { runIds: [2], prediction: 9 * r.result.run.readings[0] }); s = r.state;
    r = lab(s, "assert", { type: "b", claimIds: [1, 2] }); s = r.state;
    s = Narrative.embedComplete(s).state;
    rr = run(s); s = rr.state;
    eq(rr.view.nodeId, "e3c", "學者亦必經 e3c");
    /* 學者自由配置:改用音格對(緩×陡),僅傾角相異 */
    r = lab(s, "run", { config: { ball: "銅大", surface: "打磨", incline: "緩", timer: "音格" } }); s = r.state;
    r = lab(s, "judge", { runIds: [3], prediction: 9 * r.result.run.readings[0] }); s = r.state;
    ok(r.result.claim.ok, "緩+音格可判定");
    r = lab(s, "run", { config: { ball: "銅大", surface: "打磨", incline: "陡", timer: "音格" } }); s = r.state;
    r = lab(s, "judge", { runIds: [4], prediction: 9 * r.result.run.readings[0] }); s = r.state;
    ok(r.result.claim.ok, "陡+音格可判定(學者限定工具)");
    r = lab(s, "assert", { type: "c", claimIds: [3, 4] }); s = r.state;
    ok(r.result.assertion.ok && s.lab.evidence.e3.c, "自由配置完成 E3.c(僅傾角相異)");
    s = Narrative.embedComplete(s).state;
    rr = run(s); s = rr.state;
    eq(rr.view.scene, "A2-4", "續接 E4");
  });

  t("SC-R1|信譽歸零→導入修復→做一次實驗→信譽1→返回原游標", function () {
    var s = toActTwo("explore");
    var origin = JSON.parse(JSON.stringify(s.cursor));
    s.rep = 0; s.flags.repLocked = "1";               /* 注入:歸零狀態(M3 前無自然觸發點) */
    var rd = Narrative.redirectIfLocked(s);
    ok(rd.redirected, "應導入修復");
    s = rd.state;
    eq(s.cursor.scene, "SC-R1");
    var rr = run(s); s = rr.state;                    /* n1,n2 → e1 embed */
    eq(rr.view.type, "embed");
    ok(!Narrative.embedReady(s), "尚未做實驗");
    var r = lab(s, "run", { config: CFG_BIG }); s = r.state;
    ok(Narrative.embedReady(s), "已做一次實驗");
    s = Narrative.embedComplete(s).state;
    rr = run(s); s = rr.state;                        /* n3(rep+1,解鎖)→ return → 回原點 */
    eq(s.rep, 1, "信譽回復至 1");
    ok(!("repLocked" in s.flags), "解除鎖定");
    ok(!("returnScene" in s.flags), "返回游標已清");
    eq(s.cursor, origin, "回到原游標(A2-2 embed)");
  });

  t("R-MODE|學者加問於探索模式不可見(node+option 雙層過濾)", function () {
    var s = Narrative.initialState("explore");
    /* 直接把游標放到 A1-7 m2(學者節點),探索模式應自動跳過至 m3 */
    s.cursor = { scene: "A1-7", node: "m2" };
    var v = Narrative.view(s);
    eq(v.nodeId, "m3", "探索模式跳過 scholar 節點");
  });

  t("R-REP-01|信譽夾制 0–5:連續加減不越界", function () {
    var s = Narrative.initialState("explore");
    s.rep = 5;
    s.cursor = { scene: "P0-1", node: "nb2" };  /* +1 節點 */
    var r = Narrative.advance(s);
    eq(r.state.rep, 5, "上限夾制");
    var s2 = Narrative.initialState("explore");
    s2.rep = 0;
    s2.cursor = { scene: "P0-2", node: "nA4" }; /* −1 節點 */
    var r2 = Narrative.advance(s2);
    eq(r2.state.rep, 0, "下限夾制");
  });

  t("R-SAV-04|存檔往返:serialize→deserialize 深度相等;壞檔/版本不符擲錯", function () {
    var s = Narrative.initialState("scholar");
    var r = run(s); s = pick(r.state, "b"); r = run(s); s = r.state;
    var text = Narrative.serialize(s);
    var back = Narrative.deserialize(text);
    eq(back, s, "往返相等");
    var threw = false;
    try { Narrative.deserialize("{bad json"); } catch (e) { threw = true; }
    ok(threw, "壞檔擲錯");
    threw = false;
    var wrong = JSON.parse(text); wrong.schemaVersion = 99;
    try { Narrative.deserialize(JSON.stringify(wrong)); } catch (e) { threw = true; }
    ok(threw, "版本不符擲錯");
  });

  t("R-STA-05|純函式:view/advance/choose 不變異輸入狀態", function () {
    var s = Narrative.initialState("explore");
    var frozen = JSON.stringify(s);
    Narrative.view(s);
    Narrative.advance(s);
    eq(JSON.stringify(s), frozen, "原狀態不變");
  });

  t("R-NAR-06|事件log:rep/evidence/flag/choice 皆留痕", function () {
    var s = Narrative.initialState("explore");
    var r = run(s); s = pick(r.state, "b"); r = run(s); s = r.state;
    var kinds = {};
    s.eventLog.forEach(function (e) { kinds[e.t] = 1; });
    ok(kinds.rep && kinds.choice, "rep/choice 事件在log");
    s = pick(s, "b"); r = run(s); s = r.state; /* P0-2.b → qB */
    s = pick(s, "b1"); r = run(s); s = r.state; /* 進第一幕取證 */
    var hasEvidence = s.eventLog.some(function (e) { return e.t === "evidence" && e.id === "S2"; });
    ok(hasEvidence, "evidence 事件在log");
  });

  /* ===== M3:第三幕辯論+尾聲 ===== */

  function toDebate(mode) { /* 快轉至 A3-D 辯論 embed(含 E3.c 必經) */
    var s = toActTwo(mode);
    var r = lab(s, "run", { config: CFG_BIG }); s = r.state;
    r = lab(s, "judge", { runIds: [1], prediction: 9 * r.result.run.readings[0] }); s = r.state;
    s = Narrative.embedComplete(s).state;
    var rr = run(s); s = rr.state;
    s = pick(s, "a"); rr = run(s); s = rr.state;
    r = lab(s, "run", { config: CFG_SMALL }); s = r.state;
    r = lab(s, "judge", { runIds: [2], prediction: 9 * r.result.run.readings[0] }); s = r.state;
    r = lab(s, "assert", { type: "b", claimIds: [1, 2] }); s = r.state;
    s = Narrative.embedComplete(s).state;
    rr = run(s); s = rr.state;                       /* e3c:變傾角必經(雙模式) */
    r = lab(s, "run", { config: { ball: "銅大", surface: "打磨", incline: "中", timer: "水鐘" } }); s = r.state;
    r = lab(s, "judge", { runIds: [3], prediction: 9 * r.result.run.readings[0] }); s = r.state;
    r = lab(s, "assert", { type: "c", claimIds: [1, 3] }); s = r.state;
    s = Narrative.embedComplete(s).state;
    rr = run(s); s = rr.state;
    ok(s.lab.evidence.e3.c === true, "必補測試1:入辯論前 E3.c=true");
    ["flat", "crum", "scale"].forEach(function (op) { s = pick(s, op); s = run(s).state; });
    s = pick(s, "done"); s = run(s).state;
    s = pick(s, "a"); s = run(s).state;
    ["air", "water"].forEach(function (op) { s = pick(s, op); s = run(s).state; });
    s = pick(s, "done"); s = run(s).state;
    s = pick(s, "a"); rr = run(s); s = rr.state;
    eq(rr.view.scene, "A3-D"); eq(rr.view.system, "debate");
    return s;
  }
  function deb(s, fn, args) {
    var r = Narrative[fn].apply(null, [s].concat(args));
    if (r.error) throw new Error(fn + ":" + r.error);
    return r;
  }

  t("M3|辯論黃金路徑(探索):E1 特殊回應→三支柱→反問選項→FR→trap 說謊代價→勝利→尾聲兩題→史實頁→終", function () {
    var s = toDebate("explore");
    var r = deb(s, "debatePress", ["p1s2"]); s = r.state;
    eq(s.debate.persuasion, 5, "追問不扣量表");
    r = deb(s, "debatePresent", [{ evidence: "E1", subitem: null, target: "p1s2" }]); s = r.state;
    eq(r.outcome, "special", "E1 又是幾乎——不扣分");
    eq(s.debate.persuasion, 5);
    r = deb(s, "debatePresent", [{ evidence: "E4", subitem: null, target: "p1s2" }]); s = r.state;
    eq(r.outcome, "correct"); ok(s.debate.pillars.P1.broken, "P1 破");
    r = deb(s, "debatePress", ["p2s3"]); s = r.state;
    ok(r.choice, "反問選項出現");
    r = deb(s, "debatePressChoice", ["a"]); s = r.state;
    eq(s.debate.persuasion, 4, "住在明天:說服力−1");
    eq(s.rep, 1, "信譽−1(2→1)");
    r = deb(s, "debatePressChoice", ["b"]); s = r.state;
    r = deb(s, "debatePresent", [{ evidence: "E2", subitem: null, target: "p2s2" }]); s = r.state;
    eq(r.outcome, "correct"); ok(s.debate.pillars.P2.broken, "P2 破");
    r = deb(s, "debatePresent", [{ evidence: "E3", subitem: "a", target: "s2" }]); s = r.state;
    eq(r.outcome, "wrong", "E3 確立後 a 出示=其餘三元組(依規格)");
    eq(s.debate.persuasion, 3);
    r = deb(s, "debatePresent", [{ evidence: "E3", subitem: "b", target: "s2" }]); s = r.state;
    eq(r.outcome, "correct"); ok(s.debate.fr.opened, "三柱皆破→FR");
    r = deb(s, "debateFr", ["b"]); s = r.state; eq(r.outcome, "retry", "引導步答錯僅重選");
    r = deb(s, "debateFr", ["a"]); s = r.state;
    r = deb(s, "debateFr", ["a"]); s = r.state;
    ok(s.debate.fr.trapPending, "trap 抉擇");
    r = deb(s, "debateFr", ["lied"]); s = r.state;
    eq(r.outcome, "resolvedAfterLie", "說謊被戳破後強制轉誠實");
    eq(s.debate.persuasion, 1, "3−2=1");
    eq(s.rep, 0, "信譽 1−1=0(觸發修復鎖)");
    ok(s.evidence.E5, "E5 入袋");
    eq(s.debate.status, "won", "辯論勝利");
    var rd = Narrative.redirectIfLocked(s);
    ok(rd.redirected, "歸零導入 SC-R1"); s = rd.state;
    var rr = run(s); s = rr.state;
    r = lab(s, "run", { config: CFG_BIG }); s = r.state;
    s = Narrative.embedComplete(s).state;
    rr = run(s); s = rr.state;
    eq(s.rep, 1); eq(rr.view.scene, "A3-D");
    ok(Narrative.embedReady(s), "debateWon → embed 可收束");
    s = Narrative.embedComplete(s).state;
    rr = run(s); s = rr.state;
    eq(rr.view.type, "review", "章末兩題");
    var texts = rr.passed.map(function (n) { return n.text; }).join("|");
    ok(texts.indexOf("厚了一頁") >= 0, "判定場:數據紙夾進《物理學》");
    r = deb(s, "setReview", ["因為快慢與重量無關", "把太快的過程拉長到量得到"]); s = r.state;
    rr = run(s); s = rr.state;
    eq(s.review.q1, "因為快慢與重量無關", "回顧已存");
    ok(s.ended, "第一章完");
  });

  t("M3|中止與再入:錯誤出示×5→中止→離場→補實驗→再入(量表重置,已破支柱保留)", function () {
    var s = toDebate("explore");
    var r = deb(s, "debatePresent", [{ evidence: "E4", subitem: null, target: "p1s2" }]); s = r.state;
    for (var i = 0; i < 5; i++) {
      r = deb(s, "debatePresent", [{ evidence: "S1", subitem: null, target: "p2s1" }]); s = r.state;
    }
    eq(s.debate.status, "suspended", "歸零中止");
    ok(!Narrative.embedReady(s), "中止時不可收束");
    r = deb(s, "debateExitSuspended", []); s = r.state;
    var rr = run(s); s = rr.state;
    eq(rr.view.scene, "A3-F"); eq(rr.view.system, "incline", "回實驗台自由補證");
    ok(Narrative.embedReady(s), "A3-F 無門檻,隨時可重返");
    var l = lab(s, "run", { config: CFG_BIG }); s = l.state;
    s = Narrative.embedComplete(s).state;
    rr = run(s); s = rr.state;
    eq(rr.view.scene, "A3-D");
    eq(s.debate.status, "pending"); eq(s.debate.persuasion, 5, "量表重置");
    ok(s.debate.pillars.P1.broken, "已破支柱保留");
    eq(s.debate.idx, 1, "從第二柱續戰");
  });

  t("M3|學者 FR:干擾項−1、亂序不罰、三環組鏈→trap 誠實(零代價)→勝", function () {
    var s = toDebate("scholar");
    var r = deb(s, "debatePresent", [{ evidence: "E4", subitem: null, target: "p1s2" }]); s = r.state;
    r = deb(s, "debatePresent", [{ evidence: "E2", subitem: null, target: "p2s2" }]); s = r.state;
    r = deb(s, "debatePresent", [{ evidence: "E3", subitem: "b", target: "s2" }]); s = r.state;
    ok(s.debate.fr.opened);
    r = deb(s, "debateFr", ["d2"]); s = r.state;
    eq(r.outcome, "distractor"); eq(s.debate.persuasion, 4, "干擾項−1");
    r = deb(s, "debateFr", ["c2"]); s = r.state;
    eq(r.outcome, "wrongOrder", "亂序不罰"); eq(s.debate.persuasion, 4);
    ["c1", "c2", "c3"].forEach(function (cid) { r = deb(s, "debateFr", [cid]); s = r.state; });
    ok(s.debate.fr.trapPending);
    var repBefore = s.rep, perBefore = s.debate.persuasion;
    r = deb(s, "debateFr", ["honest"]); s = r.state;
    eq(r.outcome, "resolved");
    eq(s.rep, repBefore, "誠實零信譽代價");
    eq(s.debate.persuasion, perBefore, "誠實零量表代價");
    eq(s.debate.status, "won");
    ok(s.evidence.E5);
  });

  /* ===== M3 外科修正:必補負向測試(修正包 2/4/5/6) ===== */

  t("A-1 負向|E3.c=false 不得推進 FR;state 不變", function () {
    var s = toDebate("explore");
    var r = deb(s, "debatePresent", [{ evidence: "E4", subitem: null, target: "p1s2" }]); s = r.state;
    r = deb(s, "debatePresent", [{ evidence: "E2", subitem: null, target: "p2s2" }]); s = r.state;
    r = deb(s, "debatePresent", [{ evidence: "E3", subitem: "b", target: "s2" }]); s = r.state;
    ok(s.debate.fr.opened, "FR 已開");
    var s2 = JSON.parse(JSON.stringify(s));
    s2.lab.evidence.e3.c = false;                     /* 竄改:移除 E3.c */
    var frozen = JSON.stringify(s2);
    var rr = Narrative.debateFr(s2, "a");
    ok(rr.error && rr.error.indexOf("E3.c") >= 0, "缺 E3.c 必拒");
    eq(JSON.stringify(rr.state), frozen, "state 不變");
  });

  t("B-1 負向|未持有證據不得出示(E4 遭刪/E3 子項未亮),state 不變", function () {
    var s = toDebate("explore");
    var s2 = JSON.parse(JSON.stringify(s));
    delete s2.evidence.E4;                            /* 竄改:移除 E4 */
    var frozen = JSON.stringify(s2);
    var r = Narrative.debatePresent(s2, { evidence: "E4", subitem: null, target: "p1s2" });
    ok(r.error && r.error.indexOf("未持有") >= 0, "E4 未持有必拒");
    eq(JSON.stringify(r.state), frozen, "state 不變");
    var s3 = JSON.parse(JSON.stringify(s));
    s3.lab.evidence.e3.b = false;                     /* 竄改:E3.b 未亮 */
    var frozen3 = JSON.stringify(s3);
    var r3 = Narrative.debatePresent(s3, { evidence: "E3", subitem: "b", target: "p1s2" });
    ok(r3.error && r3.error.indexOf("未持有") >= 0, "E3.b 未亮必拒");
    eq(JSON.stringify(r3.state), frozen3, "state 不變");
    ok(Narrative.ownsEvidence(s, "E4") === true && Narrative.ownsEvidence(s3, "E3", "b") === false, "ownsEvidence 單一語義");
  });

  t("B-5|trap 雙歸零:lied→中止+修復→再入 FR→honest→完章", function () {
    var s = toDebate("explore");
    /* 壓量表:P1 期間錯誤出示×3(5→2) */
    var r;
    for (var i = 0; i < 3; i++) { r = deb(s, "debatePresent", [{ evidence: "S1", subitem: null, target: "p1s1" }]); s = r.state; }
    eq(s.debate.persuasion, 2);
    r = deb(s, "debatePresent", [{ evidence: "E4", subitem: null, target: "p1s2" }]); s = r.state;
    r = deb(s, "debatePress", ["p2s3"]); s = r.state;
    r = deb(s, "debatePressChoice", ["a"]); s = r.state;   /* 說服力 2→1;信譽 2→1 */
    eq(s.debate.persuasion, 1); eq(s.rep, 1);
    r = deb(s, "debatePressChoice", ["b"]); s = r.state;
    r = deb(s, "debatePresent", [{ evidence: "E2", subitem: null, target: "p2s2" }]); s = r.state;
    r = deb(s, "debatePresent", [{ evidence: "E3", subitem: "b", target: "s2" }]); s = r.state;
    r = deb(s, "debateFr", ["a"]); s = r.state;
    r = deb(s, "debateFr", ["a"]); s = r.state;
    ok(s.debate.fr.trapPending, "trap 就位(說服力1/信譽1)");
    r = deb(s, "debateFr", ["lied"]); s = r.state;         /* −2/−1:雙歸零 */
    eq(s.debate.status, "suspended", "辯論中止");
    eq(s.rep, 0, "信譽歸零");
    ok(s.debate.fr.trapPending, "trap 狀態保留");
    var rd = Narrative.redirectIfLocked(s); ok(rd.redirected); s = rd.state;
    var rr = run(s); s = rr.state;                          /* SC-R1 → e1 */
    r = lab(s, "run", { config: CFG_BIG }); s = r.state;
    s = Narrative.embedComplete(s).state;
    rr = run(s); s = rr.state;                              /* rep=1,回 A3-D(仍中止) */
    eq(s.rep, 1); eq(rr.view.scene, "A3-D");
    r = deb(s, "debateExitSuspended", []); s = r.state;
    rr = run(s); s = rr.state;                              /* A3-F 補實驗 embed */
    s = Narrative.embedComplete(s).state;
    rr = run(s); s = rr.state;                              /* reenter → A3-D */
    eq(s.debate.status, "pending"); eq(s.debate.persuasion, 5, "量表重置");
    ok(s.debate.fr.trapPending, "再入後仍停在 FR trap");
    r = deb(s, "debateFr", ["honest"]); s = r.state;
    eq(s.debate.status, "won", "誠實完成");
    s = Narrative.embedComplete(s).state;
    rr = run(s); s = rr.state;
    eq(rr.view.type, "review");
    r = deb(s, "setReview", ["答一", "答二"]); s = r.state;
    rr = run(s); s = rr.state;
    ok(s.ended, "完章");
  });

  t("B-3/R-SAV-02|loadSave 分類:empty/badjson/schema/cursor 與正常往返", function () {
    ok(Narrative.loadSave(null).empty, "空=empty");
    eq(Narrative.loadSave("{bad").error, "badjson", "壞 JSON");
    var s = Narrative.initialState("explore");
    var old = JSON.parse(Narrative.serialize(s)); old.schemaVersion = 2;
    eq(Narrative.loadSave(JSON.stringify(old)).error, "schema", "舊 schema");
    var bad = JSON.parse(Narrative.serialize(s)); bad.cursor = { scene: "沒這場", node: "n1" };
    eq(Narrative.loadSave(JSON.stringify(bad)).error, "cursor", "壞游標");
    var okr = Narrative.loadSave(Narrative.serialize(s));
    eq(okr.state, s, "正常載入相等");
  });

  return tests;
});
