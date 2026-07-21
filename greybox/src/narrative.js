/* src/narrative.js — 章節敘事引擎(純函式,R-STA-05 語意)
   法源:第一章功能規格 v0.1;資料:data/scenes.js、data/debate.js(chapter);內嵌:src/engine.js。
   M3:全章辯論(R-DEB-09~13:P1/P2/P3 支柱序列+追問內嵌選項+FR 組鏈+trap+中止再入)、
   review 兩題(R-UI-02)、histfacts(R-END-02)。存檔 schema=3。 */
(function (root, factory) {
  "use strict";
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("../data/scenes.js"), require("./engine.js"), require("../data/debate.js"));
    module.exports._factory = factory; /* M1:測試可用第二章資料另建實例(瀏覽器端 ch2 走 chapter2.html 重指 DATA.scenes,本行不影響) */
  } else {
    root.GB = root.GB || {};
    root.GB.Narrative = factory(root.GB.DATA.scenes, root.GB.Engine, root.GB.DATA.debate);
  }
})(typeof self !== "undefined" ? self : this, function (SCENES, Engine, DEBATE) {
  "use strict";

  /* 每章各自擁有 schema：第一章既有值=3；第二章依 R-STA2/R-SAV2 自 1 起。
     不能只靠 localStorage key 隔離，否則 ch1 raw code 會被 ch2 誤認成自己的進度。 */
  var CHAPTER_ID = SCENES.chapter === "ch2" ? "ch2" : "ch1";
  var SAVE_SCHEMA = CHAPTER_ID === "ch2" ? 1 : 3;
  var REP_MIN = 0, REP_MAX = 5;
  var REPAIR_SCENE = "SC-R1";
  var CH = DEBATE.chapter;

  var sceneMap = {};
  SCENES.scenes.forEach(function (s) {
    var nodeMap = {};
    s.nodes.forEach(function (n) { nodeMap[n.id] = n; });
    sceneMap[s.id] = { def: s, nodes: nodeMap };
  });

  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  /* R-XCH-02(M3a 結構版):第一章 schema 3 唯讀投影;sanitize 整合與瀏覽器端接線列 M3b */
  function projectCh1(raw) {
    var invalid = { source: "ch1-schema3", certified: false, invalid: true };
    try {
      var s = JSON.parse(raw);
      if (!s || s.schemaVersion !== 3 || !s.lab || !s.lab.evidence || !s.lab.evidence.e3) return invalid;
      var e3 = s.lab.evidence.e3;
      return {
        source: "ch1-schema3",
        certified: s.ended === true && e3.a === true && e3.b === true && e3.c === true,
        e3: { a: !!e3.a, b: !!e3.b, c: !!e3.c },
        limitation: "vertical-not-directly-measured"
      };
    } catch (e) { return invalid; }
  }

  function initialState(mode, xch) {
    var st = initialStateBase(mode);
    if (xch) st.crossChapter = xch; /* 只在明確提供時掛載(第二章);ch1 狀態形狀零改動 */
    return st;
  }
  function initialStateBase(mode) {
    var out = {
      schemaVersion: SAVE_SCHEMA,
      mode: mode === "scholar" ? "scholar" : "explore",
      rep: 3,
      flags: {},
      evidence: {},
      lab: Engine.initialState(),
      debate: null,                     /* A3-1 之 {"debate":"init"} 建立 */
      review: { q1: "", q2: "" },
      cursor: { scene: SCENES.startScene, node: firstNodeId(SCENES.startScene) },
      transcript: [],
      eventLog: [],
      ended: false
    };
    if (CHAPTER_ID === "ch2") {
      out.chapter = "ch2";
      out.reveals = { sqrt: false, parabola: false };
    }
    return out;
  }

  function firstNodeId(sceneId) { return sceneMap[sceneId].def.nodes[0].id; }
  function getNode(state) {
    var sc = sceneMap[state.cursor.scene];
    return sc ? sc.nodes[state.cursor.node] : null;
  }
  function say(state, speaker, text) {
    state.transcript.push({ scene: state.cursor.scene, node: state.cursor.node, speaker: speaker, text: text });
  }

  /* ---------- 守衛與效果 ---------- */
  function passRequire(state, req) {
    if (!req) return true;
    if (req.flag) return state.flags[req.flag[0]] === req.flag[1];
    if (req.flagAbsent) return !(req.flagAbsent in state.flags);
    if (req.evidence) return !!state.evidence[req.evidence];
    if (req.flags) return req.flags.every(function (p) { return state.flags[p[0]] === p[1]; });
    return true;
  }
  function passMode(state, node) { return !node.mode || node.mode === "all" || node.mode === state.mode; }
  function visible(state, x) { return passMode(state, x) && passRequire(state, x.require); }

  function applyRep(state, delta, sourceId) {
    var before = state.rep;
    state.rep = Math.min(REP_MAX, Math.max(REP_MIN, state.rep + delta));
    state.eventLog.push({ t: "rep", d: delta, from: before, to: state.rep, at: sourceId });
    if (state.rep === 0 && delta < 0) {
      state.flags.repLocked = "1";
      state.eventLog.push({ t: "repLock", at: sourceId });
    }
  }
  function grantEvidence(state, id, at) {
    if (!state.evidence[id]) {
      state.evidence[id] = true;
      state.eventLog.push({ t: "evidence", id: id, at: at });
    }
  }
  function applyEffects(state, effects, sourceId) {
    (effects || []).forEach(function (e) {
      if ("rep" in e) applyRep(state, e.rep, sourceId);
      if (e.evidence) grantEvidence(state, e.evidence, sourceId);
      if (e.flag) {
        state.flags[e.flag[0]] = e.flag[1];
        if (state.reveals && e.flag[0] === "revealSqrt") state.reveals.sqrt = e.flag[1] === "1";
        if (state.reveals && e.flag[0] === "revealParabola") state.reveals.parabola = e.flag[1] === "1";
        state.eventLog.push({ t: "flag", k: e.flag[0], v: e.flag[1], at: sourceId });
      }
      if (e.flagClear) { delete state.flags[e.flagClear]; state.eventLog.push({ t: "flagClear", k: e.flagClear, at: sourceId }); }
      if (e.debate === "init") debateInit(state);
      if (e.debate === "reenter") debateReenter(state);
    });
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
      if (node.type === "return") {
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

  /* ---------- 辯論引擎(R-DEB-09~13) ---------- */
  function pillarDef(pid) { return CH.pillars[pid]; }
  function pillarStatements(pid) {
    if (pillarDef(pid).useLegacy) return DEBATE.statements;
    return pillarDef(pid).statements;
  }
  function debateInit(state) {
    var pillars = {};
    ["P1", "P2", "P3"].forEach(function (pid) {
      var st = {};
      pillarStatements(pid).forEach(function (s) { st[s.id] = "intact"; });
      pillars[pid] = { broken: false, s: st };
    });
    state.debate = {
      persuasion: DEBATE.persuasion, idx: 0, pillars: pillars,
      p3NeedFlag: false, pressChoice: null,
      fr: { opened: false, step: 0, slots: [], trapPending: false, resolved: false },
      mistakes: [],
      status: "pending"
    };
    if (CH.fr.enemy) { /* 第二章 FR(R-DEB2-06):兩步敵方判讀→claim→F5 組裝 */
      state.debate.fr.enemyStep = "slope";
      state.debate.fr.enemySlopeRead = false;
      state.debate.fr.enemyClassified = false;
      state.debate.fr.claimDone = false;
      state.debate.fr.overTried = false;
    }
    state.eventLog.push({ t: "debateInit" });
  }
  function debateReenter(state) {
    if (!state.debate) return;
    state.debate.persuasion = DEBATE.persuasion;
    if (state.debate.status === "suspended") state.debate.status = "pending";
    state.debate.mistakes = [];
    if (state.flags) delete state.flags.pendingDebrief;
    state.eventLog.push({ t: "debateReenter" });
  }
  function curPillarId(d) { return CH.order[d.idx]; }
  function debatePersuasion(state, delta, at) {
    var d = state.debate;
    d.persuasion = Math.max(0, d.persuasion + delta);
    state.eventLog.push({ t: "persuasion", d: delta, to: d.persuasion, at: at });
    if (d.persuasion === 0) {
      d.status = "suspended";
      state.flags.pendingDebrief = "1";
      say(state, "system", CH.texts.suspend);
      state.eventLog.push({ t: "debateSuspend", at: at });
    }
  }
  function findStmt(pid, sid) {
    var hit = null;
    pillarStatements(pid).forEach(function (s) { if (s.id === sid) hit = s; });
    return hit;
  }
  function guardDebate(state) {
    var d = state.debate;
    if (!d) return "辯論尚未開始";
    if (d.status !== "pending") return "辯論非進行狀態";
    return null;
  }
  function rememberMistake(d, rec) {
    if (!d.mistakes) d.mistakes = [];
    d.mistakes.push(rec);
    if (d.mistakes.length > 6) d.mistakes.shift();
  }

  /* B-1:證據所有權單一語義——引擎與 UI 共用(E3 依子項查 lab;其餘查章節證據) */
  function ownsEvidence(state, evidence, subitem) {
    if (evidence === "E3") {
      if (!subitem) return false;
      return !!state.lab.evidence.e3[subitem];
    }
    return !!state.evidence[evidence];
  }

  function debatePress(state0, sid) {
    var state = clone(state0);
    var d = state.debate;
    var g = guardDebate(state); if (g) return { state: state0, error: g };
    if (d.pressChoice) return { state: state0, error: "先回應教授的反問" };
    if (d.idx >= 3) return { state: state0, error: "支柱已盡,面對最後反撲" };
    var stmt = findStmt(curPillarId(d), sid);
    if (!stmt) return { state: state0, error: "無此證詞" };
    var pid = curPillarId(d);
    if (d.pillars[pid].s[sid] === "pressed") return { state: state0, error: "這句已經問清了" };
    say(state, "旅人(你)", "【追問】" + stmt.text);
    say(state, "辛普里奧", stmt.press || "(不答。)");
    d.pillars[pid].s[sid] = "pressed";
    if (stmt.insight) say(state, "旅人筆記", "【問清之後】" + stmt.insight);
    if (stmt.pressChoice) {
      d.pressChoice = { sid: sid };
      return { state: state, choice: stmt.pressChoice };
    }
    return { state: state };
  }

  function debatePressChoice(state0, optionId) {
    var state = clone(state0);
    var d = state.debate;
    if (!d || !d.pressChoice) return { state: state0, error: "目前無反問待答" };
    var stmt = findStmt(curPillarId(d), d.pressChoice.sid);
    var opt = null;
    stmt.pressChoice.options.forEach(function (o) { if (o.id === optionId) opt = o; });
    if (!opt) return { state: state0, error: "選項不存在" };
    say(state, "旅人(你)", opt.text);
    say(state, "辛普里奧", opt.reply || "");
    if (opt.penalty) {
      rememberMistake(d, { kind: "answer", label: "你用『未來的物理學』交換權威,反而走進了他的規則。" });
      if (opt.penalty.rep) applyRep(state, opt.penalty.rep, "debate.pressChoice");
      if (opt.penalty.persuasion) debatePersuasion(state, opt.penalty.persuasion, "debate.pressChoice");
    }
    if (!opt.retry) d.pressChoice = null;
    return { state: state };
  }

  function debatePresent(state0, p) {
    var state = clone(state0);
    var d = state.debate;
    var g = guardDebate(state); if (g) return { state: state0, error: g };
    if (d.pressChoice) return { state: state0, error: "先回應教授的反問" };
    if (d.idx >= 3) return { state: state0, error: "支柱已盡——用論證回應最後反撲" };
    var pid = curPillarId(d);
    var stmt = findStmt(pid, p.target);
    if (!stmt) return { state: state0, error: "無此證詞" };
    if (!ownsEvidence(state, p.evidence, p.subitem)) {
      return { state: state0, error: "未持有之證據不得出示:" + p.evidence + (p.subitem ? "." + p.subitem : "") };
    }
    say(state, "旅人(你)", "【出示】" + p.evidence + (p.subitem ? "." + p.subitem : "") + " → " + stmt.text.slice(0, 12) + "…");
    var e3 = state.lab.evidence.e3;
    var outcome;
    /* 特殊回應表(R-DEB-10) */
    var special = null;
    (stmt.special || []).forEach(function (sp) { if (sp.evidence === p.evidence) special = sp; });
    var weak = stmt.weakTo;
    var isCorrect = weak && weak.evidence === p.evidence &&
      (p.evidence !== "E3" || (p.subitem === (weak.subitem || "b") && e3.b));
    var isInsufficientP3 = pid === "P3" && p.evidence === "E3" && p.subitem === "a" &&
      p.target === "s2" && e3.a && !e3.b;
    if (isCorrect) {
      say(state, "旅人(你)", pillarDef(pid).playerCorrect);
      say(state, "辛普里奧", pillarDef(pid).breakReply);
      d.pillars[pid].s[p.target] = "broken";
      d.pillars[pid].broken = true;
      d.idx += 1;
      outcome = "correct";
      state.eventLog.push({ t: "pillarBroken", pid: pid });
      if (d.idx === 3) {
        d.fr.opened = true;
        say(state, "system", CH.texts.frUnlocked);
        say(state, "辛普里奧", CH.fr.open);
      }
    } else if (isInsufficientP3) {
      d.p3NeedFlag = true;
      say(state, "辛普里奧", DEBATE.statements[1].insufficient.reply);
      outcome = "insufficient";
    } else if (special) {
      say(state, "辛普里奧", special.reply);
      if (special.note) say(state, "system", special.note);
      outcome = "special";
    } else {
      say(state, "辛普里奧", CH.texts.wrong);
      rememberMistake(d, {
        kind: "present", pillar: pid, evidence: p.evidence, subitem: p.subitem || null,
        target: p.target, targetText: stmt.text
      });
      if (pid === "P1" && !d.firstMissUsed) {
        /* GB-ADR-010:第一支柱首次誤擊=免扣試射(教規則,不教答案);僅一次,再入不重置 */
        d.firstMissUsed = true;
        say(state, "旅人筆記", "【試射】這張牌沒有咬住他的話——講堂容你一次失準,下一次就要算數了。");
        outcome = "wrongFree";
      } else {
        debatePersuasion(state, -1, "debate.present");
        outcome = d.status === "suspended" ? "suspended" : "wrong";
      }
    }
    return { state: state, outcome: outcome };
  }

  function frChainDone(state) {
    var d = state.debate;
    say(state, "旅人(你)", CH.fr.assertion);
    say(state, "辛普里奧", CH.fr.trap.prompt);
    d.fr.trapPending = true;
  }
  function frResolveHonest(state) {
    var d = state.debate;
    say(state, "旅人(你)", CH.fr.trap.honestText);
    say(state, "辛普里奧", CH.fr.trap.closeReply);
    d.fr.trapPending = false;
    d.fr.resolved = true;
    d.status = "won";
    grantEvidence(state, CH.fr.grant || "E5", "debate.fr");
    state.eventLog.push({ t: "debateWon" });
  }

  /* ---------- 第二章 FR(CH2-CR-001/R-DEB2-06):slope→classify→claim(over/honest)→F5 組裝 ---------- */
  function frResolve2(state) {
    var d = state.debate;
    say(state, "辛普里奧", CH.fr.closeReply);
    d.fr.resolved = true;
    d.status = "won";
    grantEvidence(state, CH.fr.grant || "E5", "debate.fr");
    state.eventLog.push({ t: "debateWon" });
    return { state: state, outcome: "resolved" };
  }
  function scholarCorrect2(state) {
    var x = state.crossChapter && state.crossChapter.ch1;
    return (x && x.certified) ? CH.fr.scholar.correctInherited : CH.fr.scholar.correctLocal;
  }
  function exploreSteps2(state) {
    var x = state.crossChapter && state.crossChapter.ch1;
    return (x && x.certified) ? CH.fr.explore.stepsInherited : CH.fr.explore.stepsLocal;
  }
  function debateFr2(state, state0, optionId) {
    var d = state.debate;
    for (var i = 0; i < CH.fr.requires.length; i++)
      if (!state.evidence[CH.fr.requires[i]])
        return { state: state0, error: "證據未齊:" + CH.fr.requires[i] };
    var E = CH.fr.enemy;
    if (d.fr.enemyStep === "slope" || d.fr.enemyStep === "classify") {
      var stepDef = d.fr.enemyStep === "slope" ? E.slope : E.classify;
      var opt = null;
      stepDef.options.forEach(function (o) { if (o.id === optionId) opt = o; });
      if (!opt) return { state: state0, error: "選項不存在" };
      say(state, "旅人(你)", opt.text);
      if (!opt.correct) { /* FR 錯選不豁免(R-DEB2-06):−1,留原步 */
        say(state, "system", opt.reply);
        rememberMistake(d, { kind: "enemy", label: stepDef.mistake });
        debatePersuasion(state, -1, "debate.fr2." + d.fr.enemyStep);
        return { state: state, outcome: d.status === "suspended" ? "suspended" : "retry" };
      }
      if (d.fr.enemyStep === "slope") {
        d.fr.enemySlopeRead = true;
        d.fr.enemyStep = "classify";
        say(state, "system", E.slope.doneNote);
        return { state: state, outcome: "step" };
      }
      d.fr.enemyClassified = true;
      d.fr.enemyStep = null;
      say(state, "辛普里奧", E.reask);
      d.fr.trapPending = true;
      return { state: state, outcome: "step" };
    }
    if (d.fr.trapPending) { /* claim:over/honest(over 強制轉 honest,代價照 CH2-CR-001) */
      var t = null;
      CH.fr.claim.options.forEach(function (o) { if (o.id === optionId) t = o; });
      if (!t) return { state: state0, error: "選項不存在" };
      say(state, "旅人(你)", t.text);
      if (t.id === "over") {
        if (d.fr.overTried) return { state: state0, error: "誇大的回答已被駁回——只能回到證據邊界" };
        d.fr.overTried = true;
        rememberMistake(d, { kind: "boundary", label: CH.fr.claim.overMistake });
        say(state, "辛普里奧", t.reply);
        if (t.penalty.rep) applyRep(state, t.penalty.rep, "debate.fr2.over");
        if (t.penalty.persuasion) debatePersuasion(state, t.penalty.persuasion, "debate.fr2.over");
        if (d.status !== "pending") return { state: state, outcome: "suspended" };
      }
      say(state, "旅人(你)", CH.fr.claim.honestText);
      d.fr.trapPending = false;
      d.fr.claimDone = true;
      say(state, "system", CH.texts.frUnlocked);
      return { state: state, outcome: t.id === "over" ? "forcedHonest" : "honest" };
    }
    if (!d.fr.claimDone) return { state: state0, error: "先完成敵方資料判讀" };
    if (state.mode === "explore") {
      var steps = exploreSteps2(state);
      var stp = steps[d.fr.step];
      var op = null;
      stp.options.forEach(function (o) { if (o.id === optionId) op = o; });
      if (!op) return { state: state0, error: "選項不存在" };
      say(state, "旅人(你)", op.text);
      if (!op.correct) { say(state, "system", op.reply); return { state: state, outcome: "retry" }; }
      d.fr.step += 1;
      if (d.fr.step >= steps.length) return frResolve2(state);
      return { state: state, outcome: "step" };
    }
    var correct = scholarCorrect2(state);
    var sch = CH.fr.scholar;
    var pc = null, pd2 = null;
    correct.forEach(function (o) { if (o.id === optionId) pc = o; });
    sch.distractors.forEach(function (o) { if (o.id === optionId) pd2 = o; });
    if (!pc && !pd2) return { state: state0, error: "選項不存在" };
    if (pd2) {
      say(state, "旅人(你)", pd2.text);
      say(state, "system", sch.distractorReply);
      rememberMistake(d, { kind: "chain", label: "論證鏈選入『" + pd2.text + "』,這一環撐不住。" });
      debatePersuasion(state, -1, "debate.fr2.distractor");
      return { state: state, outcome: d.status === "suspended" ? "suspended" : "distractor" };
    }
    if (d.fr.slots.indexOf(optionId) >= 0) return { state: state0, error: "此環已入鏈" };
    if (optionId !== correct[d.fr.slots.length].id) {
      say(state, "system", sch.wrongOrderReply);
      return { state: state, outcome: "wrongOrder" };
    }
    d.fr.slots.push(optionId);
    say(state, "旅人(你)", "【論證第 " + d.fr.slots.length + " 環】" + pc.text);
    if (d.fr.slots.length === correct.length) return frResolve2(state);
    return { state: state, outcome: "slot" };
  }

  function debateFr(state0, optionId) {
    var state = clone(state0);
    var d = state.debate;
    var g = guardDebate(state); if (g) return { state: state0, error: g };
    if (!d.fr.opened || d.fr.resolved) return { state: state0, error: "尚未進入最後反撲" };
    if (CH.fr.enemy) return debateFr2(state, state0, optionId); /* 第二章 FR 全流程 */
    /* A-1:外推論證之前提=玩家親手驗過「隨傾角形式不變」(E3.c);未持有不得組鏈 */
    if (!state.lab.evidence.e3.c) {
      return { state: state0, error: "缺 E3.c(隨傾角形式不變)——沒親手驗過變傾角,這條鏈不能組" };
    }
    if (d.fr.trapPending) {
      var t = null;
      CH.fr.trap.options.forEach(function (o) { if (o.id === optionId) t = o; });
      if (!t) return { state: state0, error: "選項不存在" };
      say(state, "旅人(你)", t.text);
      if (t.id === "lied") {
        rememberMistake(d, { kind: "boundary", label: "你聲稱量過垂直落下,卻拿不出任何紀錄。" });
        say(state, "辛普里奧", t.reply);
        if (t.penalty.rep) applyRep(state, t.penalty.rep, "debate.trap");
        if (t.penalty.persuasion) debatePersuasion(state, t.penalty.persuasion, "debate.trap");
        if (d.status === "pending") frResolveHonest(state); /* 強制轉誠實 */
        return { state: state, outcome: d.status === "won" ? "resolvedAfterLie" : "suspended" };
      }
      frResolveHonest(state);
      return { state: state, outcome: "resolved" };
    }
    if (state.mode === "explore") {
      var step = CH.fr.explore.steps[d.fr.step];
      var opt = null;
      step.options.forEach(function (o) { if (o.id === optionId) opt = o; });
      if (!opt) return { state: state0, error: "選項不存在" };
      say(state, "旅人(你)", opt.text);
      if (!opt.correct) { say(state, "system", opt.reply); return { state: state, outcome: "retry" }; }
      d.fr.step += 1;
      if (d.fr.step >= CH.fr.explore.steps.length) frChainDone(state);
      return { state: state, outcome: "step" };
    }
    /* 學者:三槽組鏈 */
    var sch = CH.fr.scholar;
    var pickCorrect = null, pickDistract = null;
    sch.correct.forEach(function (o) { if (o.id === optionId) pickCorrect = o; });
    sch.distractors.forEach(function (o) { if (o.id === optionId) pickDistract = o; });
    if (!pickCorrect && !pickDistract) return { state: state0, error: "選項不存在" };
    if (pickDistract) {
      say(state, "旅人(你)", pickDistract.text);
      say(state, "system", sch.distractorReply);
      rememberMistake(d, { kind: "chain", label: "論證鏈選入『" + pickDistract.text + "』,但這一環撐不住追問。" });
      debatePersuasion(state, -1, "debate.fr.distractor");
      return { state: state, outcome: d.status === "suspended" ? "suspended" : "distractor" };
    }
    if (d.fr.slots.indexOf(optionId) >= 0) return { state: state0, error: "此環已入鏈" };
    var expect = sch.correct[d.fr.slots.length].id;
    if (optionId !== expect) { say(state, "system", sch.wrongOrderReply); return { state: state, outcome: "wrongOrder" }; }
    d.fr.slots.push(optionId);
    say(state, "旅人(你)", "【論證第 " + d.fr.slots.length + " 環】" + pickCorrect.text);
    if (d.fr.slots.length === sch.correct.length) frChainDone(state);
    return { state: state, outcome: "slot" };
  }

  function debateExitSuspended(state0) {
    var state = clone(state0);
    var node = skipInvisible(state);
    if (node.type !== "embed" || node.system !== "debate") return { state: state0, error: "非辯論節點" };
    if (!state.debate || state.debate.status !== "suspended") return { state: state0, error: "辯論未中止" };
    if (!node.suspendNext) return { state: state0, error: "辯論節點缺 suspendNext" };
    state.cursor.node = node.suspendNext;
    return { state: state };
  }

  function debateView(state) {
    var d = state.debate;
    if (!d) return null;
    var v = { persuasion: d.persuasion, status: d.status, pressChoice: null, phase: null,
              mistakes: (d.mistakes || []).slice() };
    v.pillarSummary = ["P1", "P2", "P3"].map(function (pid) {
      return { id: pid, title: pillarDef(pid).title, broken: d.pillars[pid].broken };
    });
    if (d.idx < 3) {
      var pid = curPillarId(d);
      v.phase = "pillars";
      v.pillar = { id: pid, title: pillarDef(pid).title };
      v.statements = pillarStatements(pid).map(function (s) {
        var status = d.pillars[pid].s[s.id];
        return { id: s.id, text: s.text, status: status,
                 pressed: status === "pressed", insight: status === "pressed" ? (s.insight || "") : "" };
      });
      if (d.pressChoice) {
        var stmt = findStmt(pid, d.pressChoice.sid);
        v.pressChoice = { prompt: stmt.pressChoice.prompt, options: stmt.pressChoice.options.map(function (o) { return { id: o.id, text: o.text }; }) };
      }
    } else if (!d.fr.resolved) {
      if (CH.fr.enemy && (d.fr.enemyStep === "slope" || d.fr.enemyStep === "classify")) {
        var Ed = d.fr.enemyStep === "slope" ? CH.fr.enemy.slope : CH.fr.enemy.classify;
        v.phase = "enemy";
        v.enemy = { step: d.fr.enemyStep, card: CH.fr.enemy.card, prompt: Ed.prompt,
                    options: Ed.options.map(function (o) { return { id: o.id, text: o.text }; }) };
      } else if (d.fr.trapPending) {
        var TP = CH.fr.enemy ? CH.fr.claim : CH.fr.trap;
        v.phase = "trap";
        v.trap = { prompt: TP.prompt, options: TP.options
          .filter(function (o) { return !(CH.fr.enemy && d.fr.overTried && o.id === "over"); })
          .map(function (o) { return { id: o.id, text: o.text }; }) };
      } else if (state.mode === "explore") {
        var steps0 = CH.fr.enemy ? exploreSteps2(state) : CH.fr.explore.steps;
        var st = steps0[d.fr.step];
        v.phase = "fr";
        v.fr = { kind: "explore", prompt: st.prompt, options: st.options.map(function (o) { return { id: o.id, text: o.text }; }) };
      } else {
        var corr0 = CH.fr.enemy ? scholarCorrect2(state) : CH.fr.scholar.correct;
        v.phase = "fr";
        v.fr = { kind: "scholar", prompt: CH.fr.scholar.slotPrompt, slots: d.fr.slots.slice(),
                 pool: corr0.concat(CH.fr.scholar.distractors).map(function (o) { return { id: o.id, text: o.text }; }) };
      }
    } else { v.phase = "won"; }
    return v;
  }

  /* ---------- embed 完成條件 ---------- */
  function untilMet(state, until) {
    if (!until) return true;
    if (until.e3) {
      var e3 = state.lab.evidence.e3;
      if (until.e3 === "established") return e3.a && e3.b;
      return !!e3[until.e3];
    }
    if (until.repairRun) {
      var base = parseInt(state.flags.scr1_baseline || "0", 10);
      if (state.lab.series) { /* 第二章:乾淨 profile series 之讀值數超過基線=一次乾淨的球 */
        var cnt2 = 0;
        state.lab.series.forEach(function (sr) {
          if (sr.profile === "clean") cnt2 += Object.keys(sr.readings).length;
        });
        return cnt2 > base;
      }
      return state.lab.evidence.runs.length > base;
    }
    if (until.debateWon) return !!(state.debate && state.debate.status === "won");
    /* 第二章(規格 v0.1.1):cat=threeH=存在未放棄的乾淨銅球 series 已測 4/9/16(劇情提問門)。
       完成 25 格者仍算達標：玩家超前操作不得反而失去出口(GB-ADR-021 補記)。 */
    if (until.cat === "threeH") {
      var ok3 = false;
      (state.lab.series || []).forEach(function (sr) {
        if (sr.status !== "abandoned" && sr.profile === "clean" && sr.ball === "copper" &&
            typeof sr.readings[4] === "number" && typeof sr.readings[9] === "number" &&
            typeof sr.readings[16] === "number") ok3 = true;
      });
      return ok3;
    }
    if (until.f2) {
      var f2u = state.lab.evidence && state.lab.evidence.f2;
      return !!(f2u && f2u[until.f2]);
    }
    return true;
  }

  /* ---------- 核心流程 ---------- */
  function view(state0) {
    var state = clone(state0);
    var node = skipInvisible(state);
    var v = { scene: state.cursor.scene, sceneTitle: sceneMap[state.cursor.scene].def.title || "", nodeId: node.id, type: node.type };
    if (node.type === "line" || node.type === "system") { v.speaker = node.speaker; v.text = node.text; }
    else if (node.type === "choice") {
      v.prompt = node.text;
      v.options = node.options.filter(function (o) { return visible(state, o); })
        .map(function (o) { return { id: o.id, text: o.text }; });
    } else if (node.type === "embed") {
      v.system = node.system; v.hint = node.hint || ""; v.preset = node.preset || null;
      v.ready = untilMet(state, node.until);
      if (node.system === "debate" || node.system === "debrief") v.debate = debateView(state);
    } else if (node.type === "review") {
      v.prompts = node.prompts;
    }
    return v;
  }

  function advance(state0) {
    var state = clone(state0);
    var node = skipInvisible(state);
    if (node.type === "end") { state.ended = true; return { state: state, done: true }; }
    if (node.type === "choice") return { state: state0, error: "此節點需要選擇" };
    if (node.type === "embed") return { state: state0, error: "此節點為互動段落,請以 embedComplete 收束" };
    if (node.type === "review") return { state: state0, error: "此節點需要 setReview" };
    if (node.type === "histfacts") {
      state.transcript.push({ scene: state.cursor.scene, node: node.id, speaker: "system", text: "(史實與虛構頁——見資料表)" });
      state.cursor.node = node.next;
      var n2 = skipInvisible(state);
      if (n2.type === "end") state.ended = true;
      return { state: state, node: node };
    }
    state.transcript.push({ scene: state.cursor.scene, node: node.id, speaker: node.speaker || "", text: node.text || "" });
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

  function setReview(state0, q1, q2) {
    var state = clone(state0);
    var node = skipInvisible(state);
    if (node.type !== "review") return { state: state0, error: "此節點非章末回顧" };
    state.review = { q1: q1 || "", q2: q2 || "" };
    say(state, "system", "旅人在筆記上寫下自己的答案。(已存檔,不評分)");
    state.eventLog.push({ t: "review" });
    state.cursor.node = node.next;
    return { state: state };
  }

  /* GB-ADR-011 斷言分段的唯一事實源(手冊原則 10:UI 亮牌與引擎守衛同源;Sol 驗證 B-1)。
     stage a=只認證;b=只開「與球重無關」;c=只開「隨傾角形式不變」(雙模式必經);
     repairRun(SC-R1)=兩者皆關;無 until 的自由段=B 開放、C 依學者。 */
  function assertStage(until, mode) {
    until = until || {};
    var stage = until.e3 || null;
    return {
      b: stage === "b" || (stage === null && !until.repairRun),
      c: stage === "c" || (stage === null && !until.repairRun && mode === "scholar")
    };
  }

  function labAction(state0, action, args) {
    var state = clone(state0);
    var r;
    if (action === "run") r = Engine.runExperiment(state.lab, args.config);
    else if (action === "judge") r = Engine.judge(state.lab, args.runIds, args.prediction);
    else if (action === "assert") {
      /* 敘事層守衛:搶跑斷言在引擎就擋下,不只藏按鈕(Sol B-1) */
      var nd = skipInvisible(state);
      var allow = assertStage(nd && nd.type === "embed" ? nd.until : null, state.mode);
      if ((args.type === "b" && !allow.b) || (args.type === "c" && !allow.c))
        return { state: state0, error: "這個斷言劇情還沒問到——先回對話,讓問題被問出口。" };
      r = Engine.assertE3(state.lab, args.type, args.claimIds);
    }
    else if (action === "compare") r = Engine.compareRuns(state.lab, args.runIds);
    /* 第二章彈射工坊(R-WS2/R-LAB2):依引擎能力分派,ch1 引擎無此方法=維持未知動作拒絕 */
    else if (action === "place" && Engine.place) r = Engine.place(state.lab, args.slot, args.part);
    else if (action === "replacePart" && Engine.replacePart) r = Engine.replacePart(state.lab, args.slot, args.part);
    else if (action === "calibrate" && Engine.calibrate) r = Engine.calibrate(state.lab, args.kind);
    else if (action === "beginSeries" && Engine.beginSeries) r = Engine.beginSeries(state.lab, args.ball);
    else if (action === "runHeight" && Engine.runHeight) r = Engine.runHeight(state.lab, args.H);
    else if (action === "predictSeries" && Engine.predict) r = Engine.predict(state.lab, args.value);
    else if (action === "assertLaw" && Engine.assertLaw) r = Engine.assertLaw(state.lab, args.seriesId, args.conceptId);
    else if (action === "abandonSeries" && Engine.abandonSeries) r = Engine.abandonSeries(state.lab);
    else if (action === "compareBalls" && Engine.compareBalls) r = Engine.compareBalls(state.lab, args.a, args.b);
    else return { state: state0, error: "未知實驗台動作:" + action };
    if (r.error) return { state: state0, error: r.error, result: r };
    state.lab = r.state;
    var e3 = state.lab.evidence.e3;
    if (e3 && e3.a && e3.b && !state.evidence.E3) grantEvidence(state, "E3", "lab");
    var f2g = state.lab.evidence.f2;
    if (f2g && f2g.law && f2g.ball && !state.evidence.F2) grantEvidence(state, "F2", "lab2");
    if (action === "judge") {
      if ((r.claim && !r.claim.ok) || r.rejected) {
        state.flags.hadFailure = "1";
        state.flags.labFailStreak = String(parseInt(state.flags.labFailStreak || "0", 10) + 1);
      } else if (r.claim && r.claim.ok) {
        state.flags.labFailStreak = "0";
      }
    }
    state.eventLog.push({ t: "lab", action: action, at: state.cursor.scene + "/" + state.cursor.node });
    return { state: state, result: r };
  }

  function embedReady(state) {
    var s2 = clone(state);
    var node = skipInvisible(s2);
    return node.type === "embed" ? untilMet(state, node.until) : false;
  }
  function embedComplete(state0) {
    var state = clone(state0);
    var node = skipInvisible(state);
    if (node.type !== "embed") return { state: state0, error: "目前節點非互動段落" };
    if (!untilMet(state, node.until)) return { state: state0, error: "完成條件未達:" + (node.hint || "") };
    state.transcript.push({ scene: state.cursor.scene, node: node.id, speaker: "system", text: "(互動段落完成)" });
    state.eventLog.push({ t: "embedDone", at: state.cursor.scene + "/" + node.id });
    state.cursor.node = node.next;
    return { state: state };
  }

  function redirectIfLocked(state0) {
    if (!state0.flags || state0.flags.repLocked !== "1") return { state: state0, redirected: false };
    if (state0.cursor.scene === REPAIR_SCENE) return { state: state0, redirected: false };
    var state = clone(state0);
    state.flags.returnScene = state.cursor.scene;
    state.flags.returnNode = state.cursor.node;
    state.flags.scr1_baseline = String(state.lab.series
      ? state.lab.series.reduce(function (a, sr) { return a + (sr.profile === "clean" ? Object.keys(sr.readings).length : 0); }, 0)
      : state.lab.evidence.runs.length);
    state.eventLog.push({ t: "repairEnter", from: state.cursor.scene + "/" + state.cursor.node });
    moveTo(state, REPAIR_SCENE);
    return { state: state, redirected: true };
  }

  function serialize(state) { return JSON.stringify(state); }
  function deserialize(text) {
    var s = JSON.parse(text);
    if (!s || s.schemaVersion !== SAVE_SCHEMA) throw new Error("存檔版本不符");
    if (CHAPTER_ID === "ch2" && s.chapter !== "ch2") throw new Error("存檔章別不符");
    if (!sceneMap[s.cursor.scene] || !sceneMap[s.cursor.scene].nodes[s.cursor.node]) throw new Error("存檔游標無效");
    return s;
  }
  /* B-3/R-SAV-02:載入結果分類(純函式;備份與提示由 UI 執行) */
  function loadSave(text) {
    if (!text) return { empty: true };
    var s;
    try { s = JSON.parse(text); } catch (e) { return { error: "badjson" }; }
    if (!s || s.schemaVersion !== SAVE_SCHEMA) return { error: "schema" };
    if (CHAPTER_ID === "ch2" && s.chapter !== "ch2") return { error: "chapter" };
    if (!sceneMap[s.cursor.scene] || !sceneMap[s.cursor.scene].nodes[s.cursor.node]) return { error: "cursor" };
    return { state: s };
  }

  return {
    initialState: initialState,
    view: view, advance: advance, choose: choose, setReview: setReview,
    labAction: labAction, embedReady: embedReady, embedComplete: embedComplete,
    assertStage: assertStage,
    debatePress: debatePress, debatePressChoice: debatePressChoice,
    debatePresent: debatePresent, debateFr: debateFr,
    debateExitSuspended: debateExitSuspended, debateView: debateView,
    ownsEvidence: ownsEvidence, projectCh1: projectCh1,
    redirectIfLocked: redirectIfLocked,
    serialize: serialize, deserialize: deserialize, loadSave: loadSave,
    SAVE_SCHEMA: SAVE_SCHEMA, CHAPTER_ID: CHAPTER_ID, _sceneMap: sceneMap
  };
});
