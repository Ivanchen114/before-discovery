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

  /* 便利:自動前進至下一個 choice/end;回傳所有經過節點 */
  function run(state) {
    var passed = [];
    for (var i = 0; i < 500; i++) {
      var v = Narrative.view(state);
      if (v.type === "choice" || v.type === "end") return { state: state, view: v, passed: passed };
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
        (n.options || []).forEach(function (o) {
          ok(ids[s.id][o.next], s.id + "/" + n.id + "." + o.id + " 目標缺:" + o.next);
        });
      });
    });
    /* 可達性:自 startScene 沿全部邊 BFS(忽略守衛) */
    var reach = {}, queue = [SCENES.startScene];
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

  t("R-NAR-05|結論詞彙 lint:禁詞僅得出現於白名單之 NPC 節點;玩家選項豁免", function () {
    var banned = SCENES.lint.bannedWords;
    var wl = {};
    SCENES.lint.whitelist.forEach(function (w) { wl[w.scene + "/" + w.node] = w; });
    var violations = [];
    SCENES.scenes.forEach(function (s) {
      s.nodes.forEach(function (n) {
        if (n.type !== "line" && n.type !== "system") return; /* choice 選項=玩家認知,豁免 */
        if (n.speaker === "旅人") return; /* 玩家台詞豁免(其結論性另由劇本審稿把關) */
        var text = n.text || "";
        banned.forEach(function (w) {
          if (text.indexOf(w) >= 0 && !wl[s.id + "/" + n.id]) {
            violations.push(s.id + "/" + n.id + " 含禁詞「" + w + "」且不在白名單");
          }
        });
      });
    });
    eq(violations, [], "lint 違規");
    /* 白名單條目必須真實存在且附 reason */
    SCENES.lint.whitelist.forEach(function (w) {
      var sc = SCENES.scenes.filter(function (s) { return s.id === w.scene; })[0];
      ok(sc, "白名單場景缺:" + w.scene);
      ok(sc.nodes.filter(function (n) { return n.id === w.node; }).length === 1, "白名單節點缺:" + w.scene + "/" + w.node);
      ok(w.reason && w["class"], "白名單須附 class 與 reason:" + w.scene + "/" + w.node);
    });
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
    s = pick(s, "a"); r = run(s); s = r.state;      /* q2 */
    s = pick(s, "a"); r = run(s); s = r.state;      /* q3 */
    s = pick(s, "b"); r = run(s); s = r.state;      /* w=assistant → 塔 → A1-5(含助手插入) */
    ok(s.flags.w === "assistant", "w 旗標");
    var texts = r.passed.map(function (n) { return n.text; }).join("|");
    ok(texts.indexOf("屬實更好") >= 0, "w=assistant 插入台詞出現");
    eq(r.view.scene, "A1-7");
    s = pick(s, "a"); r = run(s); s = r.state;      /* 綁縛 a 支 */
    s = pick(s, "a"); r = run(s); s = r.state;      /* 更重 → 匯流;探索模式跳過學者加問 → INT-1 q1 */
    eq(r.view.scene, "INT-1");
    s = pick(s, "b"); r = run(s); s = r.state;      /* +1 */
    eq(s.rep, 4, "INT-1.b 信譽+1");
    ok(s.ended || r.view.type === "end", "抵達 M1 終點");
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
    s = pick(s, "b"); r = run(s); s = r.state;       /* q2=b */
    s = pick(s, "c"); r = run(s); s = r.state;       /* w=none */
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
    ok(s.ended || r.view.type === "end", "抵達終點");
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

  return tests;
});
