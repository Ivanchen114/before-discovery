/* src/narrative.js — 章節敘事引擎(純函式,R-STA-05 語意)
   法源:第一章功能規格 v0.1(R-NAR/R-REP/R-SAV/R-HOOK);資料:data/scenes.js;內嵌:src/engine.js(斜面實驗台)。
   無 DOM、無亂數、無副作用;每個轉移:給定狀態+事件 → 唯一後繼狀態。
   M2:embed/return 節點、state.lab(切片引擎狀態)、labAction 包裝、SC-R1 修復迴路。存檔 schema=2。 */
(function (root, factory) {
  "use strict";
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("../data/scenes.js"), require("./engine.js"));
  } else {
    root.GB = root.GB || {};
    root.GB.Narrative = factory(root.GB.DATA.scenes, root.GB.Engine);
  }
})(typeof self !== "undefined" ? self : this, function (SCENES, Engine) {
  "use strict";

  var SAVE_SCHEMA = 2;
  var REP_MIN = 0, REP_MAX = 5;
  var REPAIR_SCENE = "SC-R1";

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
      lab: Engine.initialState(),                        /* 切片引擎全狀態(runs/claims/E3/辯論) */
      cursor: { scene: SCENES.startScene, node: firstNodeId(SCENES.startScene) },
      transcript: [],
      eventLog: [],                                      /* R-NAR-06 */
      ended: false
    };
  }

  function firstNodeId(sceneId) { return sceneMap[sceneId].def.nodes[0].id; }
  function getNode(state) {
    var sc = sceneMap[state.cursor.scene];
    return sc ? sc.nodes[state.cursor.node] : null;
  }

  /* 守衛(R-NAR-03):flag/flagAbsent/evidence/flags(全部符合) */
  function passRequire(state, req) {
    if (!req) return true;
    if (req.flag) return state.flags[req.flag[0]] === req.flag[1];
    if (req.flagAbsent) return !(req.flagAbsent in state.flags);
    if (req.evidence) return !!state.evidence[req.evidence];
    if (req.flags) return req.flags.every(function (p) { return state.flags[p[0]] === p[1]; });
    return true;
  }
  function passMode(state, node) {
    return !node.mode || node.mode === "all" || node.mode === state.mode;
  }
  function visible(state, x) { return passMode(state, x) && passRequire(state, x.require); }

  /* 效果原語(R-NAR-02)+R-REP-02 歸零掛鎖 */
  function applyEffects(state, effects, sourceId) {
    (effects || []).forEach(function (e) {
      if ("rep" in e) {
        var before = state.rep;
        state.rep = Math.min(REP_MAX, Math.max(REP_MIN, state.rep + e.rep));
        state.eventLog.push({ t: "rep", d: e.rep, from: before, to: state.rep, at: sourceId });
        if (state.rep === 0 && e.rep < 0) {
          state.flags.repLocked = "1";
          state.eventLog.push({ t: "repLock", at: sourceId });
        }
      }
      if (e.evidence) {
        state.evidence[e.evidence] = true;
        state.eventLog.push({ t: "evidence", id: e.evidence, at: sourceId });
      }
      if (e.flag) {
        state.flags[e.flag[0]] = e.flag[1];
        state.eventLog.push({ t: "flag", k: e.flag[0], v: e.flag[1], at: sourceId });
      }
      if (e.flagClear) {
        delete state.flags[e.flagClear];
        state.eventLog.push({ t: "flagClear", k: e.flagClear, at: sourceId });
      }
    });
  }

  function record(state, node) {
    state.transcript.push({ scene: state.cursor.scene, node: node.id, speaker: node.speaker || "", text: node.text || "" });
  }
  function moveTo(state, sceneId, nodeId) {
    state.cursor = { scene: sceneId, node: nodeId || firstNodeId(sceneId) };
  }

  function skipInvisible(state) {
    var guard = 0;
    for (;;) {
      if (guard++ > 500) throw new Error("節點跳過迴圈過深:" + state.cursor.scene + "/" + state.cursor.node);
      var node = getNode(state);
      if (!node) throw new Error("節點不存在:" + state.cursor.scene + "/" + state.cursor.node);
      if (node.type === "goto") { moveTo(state, node.scene); continue; }
      if (node.type === "return") { /* SC-R1 收尾:跳回進場前游標 */
        var rs = state.flags.returnScene, rn = state.flags.returnNode;
        if (!rs) throw new Error("return 節點無返回游標");
        delete state.flags.returnScene; delete state.flags.returnNode; delete state.flags.scr1_baseline;
        moveTo(state, rs, rn); continue;
      }
      if ((node.type === "line" || node.type === "system") && !visible(state, node)) {
        state.cursor.node = node.next; continue;
      }
      if ((node.type === "choice" || node.type === "embed") && !visible(state, node)) {
        if (!node.next) throw new Error("不可見 " + node.type + " 缺跳過路徑:" + state.cursor.scene + "/" + node.id);
        state.cursor.node = node.next; continue;
      }
      return node;
    }
  }

  /* embed 完成條件(章規格 R-HOOK/R-REP-03) */
  function untilMet(state, until) {
    if (!until) return true;
    if (until.e3) {
      var e3 = state.lab.evidence.e3;
      if (until.e3 === "established") return e3.a && e3.b;
      return !!e3[until.e3];
    }
    if (until.repairRun) {
      var base = parseInt(state.flags.scr1_baseline || "0", 10);
      return state.lab.evidence.runs.length > base;
    }
    return true;
  }

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
    } else if (node.type === "embed") {
      v.system = node.system; v.hint = node.hint || ""; v.preset = node.preset || null;
      v.ready = untilMet(state, node.until);
    }
    return v;
  }

  function advance(state0) {
    var state = clone(state0);
    var node = skipInvisible(state);
    if (node.type === "end") { state.ended = true; return { state: state, done: true }; }
    if (node.type === "choice") return { state: state0, error: "此節點需要選擇" };
    if (node.type === "embed") return { state: state0, error: "此節點為實驗台,請以 embedComplete 收束" };
    record(state, node);
    if (node.type === "system") applyEffects(state, node.effects, state.cursor.scene + "/" + node.id);
    state.cursor.node = node.next;
    var nxt = skipInvisible(state);
    if (nxt.type === "end") state.ended = true;
    return { state: state, node: node };
  }

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

  /* ---- 實驗台包裝(R-HOOK):所有 lab 變更經此,同步章節證據與事件log ---- */
  function labAction(state0, action, args) {
    var state = clone(state0);
    var r;
    if (action === "run") r = Engine.runExperiment(state.lab, args.config);
    else if (action === "judge") r = Engine.judge(state.lab, args.runIds, args.prediction);
    else if (action === "assert") r = Engine.assertE3(state.lab, args.type, args.claimIds);
    else if (action === "compare") r = Engine.compareRuns(state.lab, args.runIds);
    else return { state: state0, error: "未知實驗台動作:" + action };
    state.lab = r.state;
    /* 同步:E3 確立(a∧b)→ 章節證據 E3;失敗主張→hadFailure 旗標(死路B 回述掛點) */
    var e3 = state.lab.evidence.e3;
    if (e3.a && e3.b && !state.evidence.E3) {
      state.evidence.E3 = true;
      state.eventLog.push({ t: "evidence", id: "E3", at: "lab" });
    }
    if (action === "judge" && r.claim && !r.claim.ok) state.flags.hadFailure = "1";
    if (action === "judge" && r.rejected) state.flags.hadFailure = "1";
    state.eventLog.push({ t: "lab", action: action, at: state.cursor.scene + "/" + state.cursor.node });
    return { state: state, result: r };
  }

  function embedReady(state) {
    var node = getNode(state) || {};
    if (node.type !== "embed") { var s2 = clone(state); node = skipInvisible(s2); }
    return node.type === "embed" ? untilMet(state, node.until) : false;
  }

  function embedComplete(state0) {
    var state = clone(state0);
    var node = skipInvisible(state);
    if (node.type !== "embed") return { state: state0, error: "目前節點非實驗台" };
    if (!untilMet(state, node.until)) return { state: state0, error: "完成條件未達:" + (node.hint || "") };
    state.transcript.push({ scene: state.cursor.scene, node: node.id, speaker: "system", text: "(實驗台段落完成)" });
    state.eventLog.push({ t: "embedDone", at: state.cursor.scene + "/" + node.id });
    state.cursor.node = node.next;
    return { state: state };
  }

  /* R-REP-02/03:信譽歸零→導入修復事件;由 UI 於每次狀態變更後呼叫 */
  function redirectIfLocked(state0) {
    if (!state0.flags || state0.flags.repLocked !== "1") return { state: state0, redirected: false };
    if (state0.cursor.scene === REPAIR_SCENE) return { state: state0, redirected: false };
    var state = clone(state0);
    state.flags.returnScene = state.cursor.scene;
    state.flags.returnNode = state.cursor.node;
    state.flags.scr1_baseline = String(state.lab.evidence.runs.length);
    state.eventLog.push({ t: "repairEnter", from: state.cursor.scene + "/" + state.cursor.node });
    moveTo(state, REPAIR_SCENE);
    return { state: state, redirected: true };
  }

  /* R-SAV */
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
    labAction: labAction,
    embedReady: embedReady,
    embedComplete: embedComplete,
    redirectIfLocked: redirectIfLocked,
    serialize: serialize,
    deserialize: deserialize,
    SAVE_SCHEMA: SAVE_SCHEMA,
    _sceneMap: sceneMap
  };
});
