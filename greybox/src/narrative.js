/* src/narrative.js — 章節敘事引擎(純函式,R-STA-05 語意)
   法源:第一章功能規格 v0.1(R-NAR/R-REP/R-SAV);資料:data/scenes.js。
   無 DOM、無亂數、無副作用;每個轉移:給定狀態+事件 → 唯一後繼狀態。 */
(function (root, factory) {
  "use strict";
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("../data/scenes.js"));
  } else {
    root.GB = root.GB || {};
    root.GB.Narrative = factory(root.GB.DATA.scenes);
  }
})(typeof self !== "undefined" ? self : this, function (SCENES) {
  "use strict";

  var SAVE_SCHEMA = 1;
  var REP_MIN = 0, REP_MAX = 5;

  var sceneMap = {};
  SCENES.scenes.forEach(function (s) {
    var nodeMap = {};
    s.nodes.forEach(function (n) { nodeMap[n.id] = n; });
    sceneMap[s.id] = { def: s, nodes: nodeMap };
  });

  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  function initialState(mode) {
    return {
      schemaVersion: SAVE_SCHEMA,
      mode: mode === "scholar" ? "scholar" : "explore", /* R-MODE-01 */
      rep: 3,                                            /* R-REP-01 */
      flags: {},
      evidence: {},
      cursor: { scene: SCENES.startScene, node: firstNodeId(SCENES.startScene) },
      transcript: [],   /* 已呈現節點紀錄(供 UI 重建與存檔還原) */
      eventLog: [],     /* R-NAR-06 埋點 */
      ended: false
    };
  }

  function firstNodeId(sceneId) { return sceneMap[sceneId].def.nodes[0].id; }

  function getNode(state) {
    var sc = sceneMap[state.cursor.scene];
    return sc ? sc.nodes[state.cursor.node] : null;
  }

  /* 守衛評估(R-NAR-03) */
  function passRequire(state, req) {
    if (!req) return true;
    if (req.flag) return state.flags[req.flag[0]] === req.flag[1];
    if (req.flagAbsent) return !(req.flagAbsent in state.flags);
    if (req.evidence) return !!state.evidence[req.evidence];
    return true;
  }
  function passMode(state, node) {
    return !node.mode || node.mode === "all" || node.mode === state.mode;
  }
  function visible(state, nodeOrOption) {
    return passMode(state, nodeOrOption) && passRequire(state, nodeOrOption.require);
  }

  /* 效果原語(R-NAR-02);rep 夾制 0–5(R-REP-01) */
  function applyEffects(state, effects, sourceId) {
    (effects || []).forEach(function (e) {
      if ("rep" in e) {
        var before = state.rep;
        state.rep = Math.min(REP_MAX, Math.max(REP_MIN, state.rep + e.rep));
        state.eventLog.push({ t: "rep", d: e.rep, from: before, to: state.rep, at: sourceId });
      }
      if (e.evidence) {
        state.evidence[e.evidence] = true;
        state.eventLog.push({ t: "evidence", id: e.evidence, at: sourceId });
      }
      if (e.flag) {
        state.flags[e.flag[0]] = e.flag[1];
        state.eventLog.push({ t: "flag", k: e.flag[0], v: e.flag[1], at: sourceId });
      }
    });
  }

  function record(state, node) {
    state.transcript.push({ scene: state.cursor.scene, node: node.id, speaker: node.speaker || "", text: node.text || "" });
  }

  function moveTo(state, sceneId, nodeId) {
    state.cursor = { scene: sceneId, node: nodeId || firstNodeId(sceneId) };
  }

  /* 略過不可見節點(mode/require 不符者依 next 鏈前進) */
  function skipInvisible(state) {
    var guard = 0;
    for (;;) {
      if (guard++ > 500) throw new Error("節點跳過迴圈過深:" + state.cursor.scene + "/" + state.cursor.node);
      var node = getNode(state);
      if (!node) throw new Error("節點不存在:" + state.cursor.scene + "/" + state.cursor.node);
      if (node.type === "goto") { moveTo(state, node.scene); continue; }
      if ((node.type === "line" || node.type === "system") && !visible(state, node)) {
        state.cursor.node = node.next; continue;
      }
      if (node.type === "choice" && !visible(state, node)) {
        if (!node.next) throw new Error("不可見 choice 缺跳過路徑:" + state.cursor.scene + "/" + node.id);
        state.cursor.node = node.next; continue;
      }
      return node;
    }
  }

  /* 對外:目前視圖(不改狀態) */
  function view(state0) {
    var state = clone(state0);
    var node = skipInvisible(state);
    var v = { scene: state.cursor.scene, sceneTitle: sceneMap[state.cursor.scene].def.title || "", nodeId: node.id, type: node.type };
    if (node.type === "line" || node.type === "system") {
      v.speaker = node.speaker; v.text = node.text;
    } else if (node.type === "choice") {
      v.prompt = node.text;
      v.options = node.options.filter(function (o) { return visible(state, o); })
        .map(function (o) { return { id: o.id, text: o.text }; });
    }
    return v;
  }

  /* 對外:前進一步(line/system 節點) */
  function advance(state0) {
    var state = clone(state0);
    var node = skipInvisible(state);
    if (node.type === "end") { state.ended = true; return { state: state, done: true }; }
    if (node.type === "choice") return { state: state0, error: "此節點需要選擇" };
    record(state, node);
    if (node.type === "system") applyEffects(state, node.effects, state.cursor.scene + "/" + node.id);
    state.cursor.node = node.next;
    /* 若下一步即 end,標記結束 */
    var nxt = skipInvisible(state);
    if (nxt.type === "end") state.ended = true;
    return { state: state, node: node };
  }

  /* 對外:選擇(choice 節點) */
  function choose(state0, optionId) {
    var state = clone(state0);
    var node = skipInvisible(state);
    if (node.type !== "choice") return { state: state0, error: "此節點不是選項" };
    var opt = null;
    node.options.forEach(function (o) { if (o.id === optionId && visible(state, o)) opt = o; });
    if (!opt) return { state: state0, error: "選項不存在或不可用" };
    state.transcript.push({ scene: state.cursor.scene, node: node.id + "." + opt.id, speaker: "旅人(你)", text: opt.text });
    state.eventLog.push({ t: "choice", at: state.cursor.scene + "/" + node.id, pick: opt.id });
    applyEffects(state, opt.effects, state.cursor.scene + "/" + node.id + "." + opt.id);
    state.cursor.node = opt.next;
    return { state: state, option: opt };
  }

  /* R-SAV:序列化/還原(storage 無關,UI 端接 localStorage) */
  function serialize(state) { return JSON.stringify(state); }
  function deserialize(text) {
    var s = JSON.parse(text);
    if (!s || s.schemaVersion !== SAVE_SCHEMA) throw new Error("存檔版本不符");
    if (!sceneMap[s.cursor.scene] || !sceneMap[s.cursor.scene].nodes[s.cursor.node]) throw new Error("存檔游標無效");
    return s;
  }

  return {
    initialState: initialState,
    view: view,
    advance: advance,
    choose: choose,
    serialize: serialize,
    deserialize: deserialize,
    SAVE_SCHEMA: SAVE_SCHEMA,
    _sceneMap: sceneMap /* 供測試(圖整合性檢查)使用 */
  };
});
