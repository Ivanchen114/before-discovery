/* src/engine5.js — 第五章《兩本帳》工作台引擎。
   純函式、零 DOM、零 RNG；數字依第五章規格 v0.1.1 §七。 */
(function (root) {
  "use strict";

  var SPEEDS = { low: 2, mid: 4, high: 6 };
  var HEIGHTS = { h1: { h: 1, v: 2 }, h4: { h: 4, v: 4 }, h9: { h: 9, v: 6 } };
  var ERRORS = [0, 0.1, -0.1];

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function err(state0, code, extra) {
    var out = { state: state0, error: code };
    if (extra) Object.keys(extra).forEach(function (k) { out[k] = extra[k]; });
    return out;
  }
  function round1Fixture(head, speed) {
    if (head === "steel") return { aAfter: 0, bAfter: speed };
    return { aAfter: speed / 2, bAfter: speed / 2 };
  }
  function followupFixture(head, speed) {
    if (head === "steel") return { aAfter: -speed / 3, bAfter: speed * 2 / 3 };
    return { aAfter: speed / 3, bAfter: speed / 3 };
  }
  function totals(mA, mB, beforeA, beforeB, afterA, afterB) {
    var pBefore = mA * beforeA + mB * beforeB;
    var pAfter = mA * afterA + mB * afterB;
    var vvBefore = mA * beforeA * beforeA + mB * beforeB * beforeB;
    var vvAfter = mA * afterA * afterA + mB * afterB * afterB;
    return {
      momentum: { before: pBefore, after: pAfter },
      visViva: { before: vvBefore, after: vvAfter, deficit: vvBefore - vvAfter }
    };
  }
  function initialState() {
    return {
      days: 0,
      phase: "momentum",
      draft: {
        head: "steel",
        speed: "high",
        masses: "4/4",
        clayHeight: "h1",
        ballMass: "light"
      },
      collisionRuns: [],
      clayRuns: [],
      runSeq: 0,
      claySeq: 0,
      assertions: {
        j1: { done: false, sources: [] },
        j2: { done: false, sources: [] },
        j3: { done: false, sources: [] }
      },
      evidence: { j1: false, j2: false, followup: false, j3: false }
    };
  }
  function setDraft(state0, field, value) {
    var allowed = {
      head: ["steel", "putty"],
      speed: ["low", "mid", "high"],
      masses: ["4/4", "4/8"],
      clayHeight: ["h1", "h4", "h9"],
      ballMass: ["light", "heavy"]
    };
    if (!allowed[field] || allowed[field].indexOf(value) < 0) return err(state0, "unknown-setting");
    if (field === "masses" && value === "4/8" && !state0.evidence.j2)
      return err(state0, "masses-locked");
    var s = clone(state0);
    s.draft[field] = value;
    return { state: s, ok: true };
  }
  function runCollision(state0) {
    if (state0.evidence.j1 && !state0.evidence.j2)
      return err(state0, "round2-no-new-experiment");
    if (state0.evidence.followup) return err(state0, "collision-round-complete");
    if (state0.evidence.j2 &&
        (state0.draft.masses !== "4/8" || state0.draft.head !== "putty"))
      return err(state0, "followup-putty-4-8-required");
    if (!state0.evidence.j2 && state0.draft.masses !== "4/4")
      return err(state0, "round1-equal-masses-required");

    var s = clone(state0);
    var speed = SPEEDS[s.draft.speed];
    var mA = 4, mB = s.draft.masses === "4/8" ? 8 : 4;
    var outcome = mB === 4
      ? round1Fixture(s.draft.head, speed)
      : followupFixture(s.draft.head, speed);
    var sums = totals(mA, mB, speed, 0, outcome.aAfter, outcome.bAfter);
    var row = {
      id: ++s.runSeq,
      kind: "collision",
      head: s.draft.head,
      speedBand: s.draft.speed,
      masses: s.draft.masses,
      mA: mA,
      mB: mB,
      before: { a: speed, b: 0 },
      after: { a: outcome.aAfter, b: outcome.bAfter },
      momentum: sums.momentum,
      visViva: sums.visViva,
      unitMass: "磅",
      unitSpeed: "尺／拍",
      day: ++s.days
    };
    s.collisionRuns.push(row);
    if (s.evidence.j2 && row.masses === "4/8" && row.head === "putty") {
      s.evidence.followup = true;
      s.phase = "clay";
    }
    return { state: s, ok: true, record: clone(row), followup: s.evidence.followup };
  }
  function selectedCollision(state0, ids) {
    var wanted = {};
    (ids || []).forEach(function (id) { wanted[String(id)] = true; });
    return state0.collisionRuns.filter(function (row) { return wanted[String(row.id)]; });
  }
  function assertJ1(state0, ids) {
    var rows = selectedCollision(state0, ids);
    if (rows.length < 6) return err(state0, "too-few-records", { count: rows.length });
    var steel = rows.filter(function (r) { return r.head === "steel"; });
    var putty = rows.filter(function (r) { return r.head === "putty"; });
    if (steel.length < 3 || putty.length < 3) return err(state0, "both-heads-required");
    if (rows.some(function (r) { return r.masses !== "4/4"; }))
      return err(state0, "mixed-masses");
    var speeds = {};
    rows.forEach(function (r) { speeds[r.speedBand] = true; });
    if (Object.keys(speeds).length !== 1) return err(state0, "mixed-speeds");
    if (rows.some(function (r) { return r.momentum.before !== r.momentum.after; }))
      return err(state0, "momentum-not-closed");
    var s = clone(state0);
    s.assertions.j1 = { done: true, sources: rows.map(function (r) { return r.id; }) };
    s.evidence.j1 = true;
    s.phase = "vis-viva";
    return { state: s, ok: true, evidence: "J1", sources: s.assertions.j1.sources.slice() };
  }
  function assertJ2(state0, ids) {
    if (!state0.evidence.j1) return err(state0, "j1-required");
    var wanted = (ids || []).map(Number).sort(function (a, b) { return a - b; });
    var original = state0.assertions.j1.sources.slice().sort(function (a, b) { return a - b; });
    if (wanted.length !== original.length ||
        wanted.some(function (id, i) { return id !== original[i]; }))
      return err(state0, "same-records-required");
    var rows = selectedCollision(state0, wanted);
    if (!rows.some(function (r) { return r.head === "steel" && r.visViva.deficit === 0; }) ||
        !rows.some(function (r) { return r.head === "putty" && r.visViva.deficit > 0; }))
      return err(state0, "both-ledger-outcomes-required");
    var s = clone(state0);
    s.assertions.j2 = { done: true, sources: wanted.slice() };
    s.evidence.j2 = true;
    s.phase = "followup";
    s.draft.head = "putty";
    s.draft.speed = "high";
    s.draft.masses = "4/8";
    return { state: s, ok: true, evidence: "J2", sources: wanted.slice() };
  }
  function runClay(state0) {
    if (!state0.evidence.followup) return err(state0, "followup-required");
    var def = HEIGHTS[state0.draft.clayHeight];
    if (!def) return err(state0, "unknown-height");
    var s = clone(state0);
    var massFactor = s.draft.ballMass === "heavy" ? 2 : 1;
    var ideal = massFactor * def.v * def.v / 8;
    var readingError = ERRORS[s.claySeq % ERRORS.length];
    var row = {
      id: ++s.runSeq,
      kind: "clay",
      height: def.h,
      speed: def.v,
      ballMass: s.draft.ballMass,
      idealDepth: ideal,
      readingError: readingError,
      depth: Math.round((ideal + readingError) * 10) / 10,
      unitDepth: "分",
      day: ++s.days
    };
    s.claySeq += 1;
    s.clayRuns.push(row);
    return { state: s, ok: true, record: clone(row) };
  }
  function assertJ3(state0, ids) {
    var wanted = {};
    (ids || []).forEach(function (id) { wanted[String(id)] = true; });
    var rows = state0.clayRuns.filter(function (r) { return wanted[String(r.id)]; });
    if (rows.length < 3) return err(state0, "too-few-clay-records", { count: rows.length });
    var masses = {}, speeds = {};
    rows.forEach(function (r) { masses[r.ballMass] = true; speeds[r.speed] = true; });
    if (Object.keys(masses).length !== 1) return err(state0, "mixed-ball-masses");
    if (Object.keys(speeds).length < 3) return err(state0, "three-speeds-required");
    var s = clone(state0);
    s.assertions.j3 = { done: true, sources: rows.map(function (r) { return r.id; }) };
    s.evidence.j3 = true;
    s.phase = "complete";
    return { state: s, ok: true, evidence: "J3", sources: s.assertions.j3.sources.slice() };
  }

  var api = {
    initialState: initialState,
    setDraft: setDraft,
    runCollision: runCollision,
    assertJ1: assertJ1,
    assertJ2: assertJ2,
    runClay: runClay,
    assertJ3: assertJ3,
    _FIXTURE: {
      speeds: clone(SPEEDS),
      heights: clone(HEIGHTS),
      errors: ERRORS.slice(),
      collisionAtSix: {
        equalSteel: totals(4, 4, 6, 0, 0, 6),
        equalPutty: totals(4, 4, 6, 0, 3, 3),
        unequalSteel: totals(4, 8, 6, 0, -2, 4),
        unequalPutty: totals(4, 8, 6, 0, 2, 2)
      }
    }
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.GB = root.GB || {};
  root.GB.Engine5 = api;
})(typeof window !== "undefined" ? window : globalThis);
