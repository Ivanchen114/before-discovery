/* src/engine5.js — 第五章《兩本帳》工作台引擎。
   純函式、零 DOM、零 RNG；數字依第五章規格 v0.1.1 §七。 */
(function (root) {
  "use strict";

  var SPEEDS = { low: 2, mid: 4, high: 6 };
  var HEIGHTS = { h1: { h: 1, v: 2 }, h4: { h: 4, v: 4 }, h9: { h: 9, v: 6 } };
  var ERRORS = [0, 0.1, -0.1];
  var CLAY_PREDICTION_BANDS = {
    "band-low": { min: 2.8, max: 3.6 },
    "band-middle": { min: 4.0, max: 4.8 },
    "band-high": { min: 5.2, max: 6.0 }
  };

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
      clayProtocol: "predict-third-v1",
      clayPrediction: null,
      runSeq: 0,
      claySeq: 0,
      assertions: {
        j1: { done: false, sources: [] },
        j2: { done: false, sources: [] },
        j3: { done: false, sources: [] }
      },
      selections: { collision: [], clay: [] },
      judgments: { j1: null, j2: null, j3: null, followup: null },
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
    if (field === "ballMass" && state0.clayProtocol === "predict-third-v1" &&
        state0.clayRuns && state0.clayRuns.length)
      return err(state0, "clay-ball-locked");
    var s = clone(state0);
    s.draft[field] = value;
    return { state: s, ok: true };
  }
  function setSelection(state0, kind, id, selected) {
    if (kind !== "collision" && kind !== "clay") return err(state0, "unknown-selection-kind");
    id = Number(id);
    var source = kind === "collision" ? state0.collisionRuns : state0.clayRuns;
    if (!source.some(function (row) { return row.id === id; }))
      return err(state0, "unknown-record");
    var s = clone(state0);
    if (!s.selections) s.selections = { collision: [], clay: [] };
    var ids = (s.selections[kind] || []).filter(function (rowId) { return rowId !== id; });
    if (selected) ids.push(id);
    ids.sort(function (a, b) { return a - b; });
    s.selections[kind] = ids;
    return { state: s, ok: true };
  }
  function setJudgment(state0, key, value) {
    var allowed = {
      j1: ["both-close", "steel-only", "putty-breaks"],
      j2: ["steel-close-putty-short", "both-close", "both-short"],
      j3: ["speed-squared", "speed-linear", "height-independent"],
      followup: ["always-half", "changes-with-mass", "same-amount"]
    };
    if (!allowed[key] || allowed[key].indexOf(value) < 0)
      return err(state0, "unknown-judgment");
    var s = clone(state0);
    if (!s.judgments) s.judgments = { j1: null, j2: null, j3: null, followup: null };
    s.judgments[key] = value;
    return { state: s, ok: true };
  }
  function runCollision(state0) {
    if (state0.evidence.j1 && !state0.evidence.j2)
      return err(state0, "round2-no-new-experiment");
    if (state0.evidence.followup) return err(state0, "collision-round-complete");
    if (state0.evidence.j2 && !(state0.judgments && state0.judgments.followup))
      return err(state0, "followup-prediction-required");
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
      row.followupPrediction = s.judgments.followup;
      row.predictionMatched = s.judgments.followup === "changes-with-mass";
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
  function assertJ1(state0, ids, concept) {
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
    if (!concept) return err(state0, "judgment-required");
    if (concept !== "both-close") return err(state0, "j1-concept-mismatch");
    var s = clone(state0);
    s.judgments.j1 = concept;
    s.assertions.j1 = { done: true, sources: rows.map(function (r) { return r.id; }) };
    s.evidence.j1 = true;
    s.phase = "vis-viva";
    return { state: s, ok: true, evidence: "J1", sources: s.assertions.j1.sources.slice() };
  }
  function assertJ2(state0, ids, concept) {
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
    if (!concept) return err(state0, "judgment-required");
    if (concept !== "steel-close-putty-short") return err(state0, "j2-concept-mismatch");
    var s = clone(state0);
    s.judgments.j2 = concept;
    s.assertions.j2 = { done: true, sources: wanted.slice() };
    s.evidence.j2 = true;
    s.phase = "followup";
    s.draft.head = "putty";
    s.draft.speed = "high";
    return { state: s, ok: true, evidence: "J2", sources: wanted.slice() };
  }
  function runClay(state0) {
    if (!state0.evidence.followup) return err(state0, "followup-required");
    var protocol = state0.clayProtocol || "legacy-free-v0";
    var heightKey = state0.draft.clayHeight;
    if (protocol === "predict-third-v1") {
      var expected = ["h1", "h4", "h9"][state0.clayRuns.length];
      if (!expected) return err(state0, "clay-series-complete");
      heightKey = expected;
      if (state0.clayRuns.length && state0.clayRuns[0].ballMass !== state0.draft.ballMass)
        return err(state0, "clay-ball-locked");
      if (state0.clayRuns.length === 2 && !state0.clayPrediction)
        return err(state0, "clay-prediction-required");
    }
    var def = HEIGHTS[heightKey];
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
    if (protocol === "predict-third-v1") {
      s.draft.clayHeight = ["h4", "h9", "h9"][s.clayRuns.length - 1];
      if (s.clayRuns.length === 3) {
        s.clayPrediction.revealed = true;
        s.clayPrediction.actualDepth = row.depth;
        s.clayPrediction.recordId = row.id;
        s.clayPrediction.matched = row.depth >= s.clayPrediction.min &&
          row.depth <= s.clayPrediction.max;
      }
    }
    return { state: s, ok: true, record: clone(row) };
  }
  function clayPredictionRange(ballMass, band) {
    var base = CLAY_PREDICTION_BANDS[band];
    if (!base) return null;
    var factor = ballMass === "heavy" ? 2 : 1;
    return { min: base.min * factor, max: base.max * factor };
  }
  function sealClayPrediction(state0, band) {
    if (!state0.evidence.followup) return err(state0, "followup-required");
    if ((state0.clayProtocol || "legacy-free-v0") !== "predict-third-v1")
      return err(state0, "clay-prediction-not-applicable");
    if (state0.clayPrediction) return err(state0, "clay-prediction-sealed");
    if (!CLAY_PREDICTION_BANDS[band]) return err(state0, "unknown-clay-prediction");
    if (state0.clayRuns.length !== 2 || state0.clayRuns[0].height !== 1 ||
        state0.clayRuns[1].height !== 4)
      return err(state0, "clay-two-records-required");
    if (state0.clayRuns[0].ballMass !== state0.clayRuns[1].ballMass)
      return err(state0, "mixed-ball-masses");
    var range = clayPredictionRange(state0.clayRuns[0].ballMass, band);
    var s = clone(state0);
    s.clayPrediction = {
      band: band,
      min: range.min,
      max: range.max,
      ballMass: state0.clayRuns[0].ballMass,
      sealedAfter: state0.clayRuns.map(function (row) { return row.id; }),
      revealed: false,
      actualDepth: null,
      recordId: null,
      matched: null
    };
    return { state: s, ok: true, prediction: clone(s.clayPrediction) };
  }
  function proportionalSpread(rows, power) {
    var ratios = rows.map(function (row) {
      return row.depth / Math.pow(row.speed, power);
    });
    var mean = ratios.reduce(function (sum, value) { return sum + value; }, 0) / ratios.length;
    if (!(mean > 0)) return Infinity;
    return Math.max.apply(Math, ratios.map(function (value) {
      return Math.abs(value - mean) / mean;
    }));
  }
  function assertJ3(state0, ids, concept) {
    var wanted = {};
    (ids || []).forEach(function (id) { wanted[String(id)] = true; });
    var rows = state0.clayRuns.filter(function (r) { return wanted[String(r.id)]; });
    if (rows.length < 3) return err(state0, "too-few-clay-records", { count: rows.length });
    var masses = {}, speeds = {};
    rows.forEach(function (r) { masses[r.ballMass] = true; speeds[r.speed] = true; });
    if (Object.keys(masses).length !== 1) return err(state0, "mixed-ball-masses");
    if (Object.keys(speeds).length < 3) return err(state0, "three-speeds-required");
    if (!concept) return err(state0, "judgment-required");
    if (concept !== "speed-squared") return err(state0, "j3-concept-mismatch");
    var squareSpread = proportionalSpread(rows, 2);
    var linearSpread = proportionalSpread(rows, 1);
    if (squareSpread > 0.08 || squareSpread >= linearSpread)
      return err(state0, "square-relation-not-supported", {
        squareSpread: squareSpread, linearSpread: linearSpread
      });
    var s = clone(state0);
    s.judgments.j3 = concept;
    s.assertions.j3 = { done: true, sources: rows.map(function (r) { return r.id; }) };
    s.evidence.j3 = true;
    s.phase = "complete";
    return { state: s, ok: true, evidence: "J3", sources: s.assertions.j3.sources.slice() };
  }

  var api = {
    initialState: initialState,
    setDraft: setDraft,
    setSelection: setSelection,
    setJudgment: setJudgment,
    runCollision: runCollision,
    assertJ1: assertJ1,
    assertJ2: assertJ2,
    runClay: runClay,
    sealClayPrediction: sealClayPrediction,
    assertJ3: assertJ3,
    _FIXTURE: {
      speeds: clone(SPEEDS),
      heights: clone(HEIGHTS),
      errors: ERRORS.slice(),
      clayPredictionBands: clone(CLAY_PREDICTION_BANDS),
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
