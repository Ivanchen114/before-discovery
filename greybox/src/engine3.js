/* src/engine3.js — 第三章船桅／共同運動引擎（規格 v0.1）。
   純函式、零 RNG、零 DOM；所有讀值為確定性教學 fixture，不冒充 1640 原始數據。 */
(function (root) {
  "use strict";

  var RELEASES = ["hand", "string", "latch"];
  var WINDOWS = ["depart", "drumOnly", "stable"];
  var BASE = {
    hand: [-0.34, 0.29, -0.21],
    string: [-0.06, 0.03, 0.04],
    latch: [-0.06, 0.03, 0.04]
  };
  var MAST = {
    accelerating: [-0.72, -0.66, -0.75],
    steady: [-0.04, 0.05, 0.02],
    decelerating: [0.69, 0.63, 0.71]
  };
  var CABIN = {
    dock: { drip: { offset: 0.03, spread: 0.06 }, toss: { offset: -0.04, spread: 0.09 } },
    steady: { drip: { offset: 0.05, spread: 0.07 }, toss: { offset: -0.03, spread: 0.08 } }
  };
  var AUDIT = {
    wind: { correct: "G2", prompt: "甲板有風，怎麼知道不是風把石頭帶回桅腳？" },
    acceleration: { correct: "G3", prompt: "既然船艙裡分不出，第一回為什麼落在桅後？" },
    paths: { correct: "G4", prompt: "船上直落、岸上向前彎下，究竟哪一張才是真的？" }
  };
  var PAPER = {
    beats: [0, 1, 2, 3],
    mastX: [0, 1, 2, 3],
    shoreStoneX: [0, 1, 2, 3],
    y: [0, 1, 4, 9],
    shipStoneX: [0, 0, 0, 0]
  };

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function err(state, code) { return { state: state, error: code }; }
  function mean(xs) { return xs.reduce(function (a, b) { return a + b; }, 0) / xs.length; }
  function unique(xs) { return Array.from(new Set(xs)); }
  function selected(rows, ids) {
    var wanted = unique((ids || []).map(Number));
    return rows.filter(function (r) { return wanted.indexOf(r.id) >= 0; });
  }
  function nearFoot(rows) {
    return rows.length >= 3 && Math.abs(mean(rows.map(function (r) { return r.offset; }))) <= 0.15 &&
      Math.max.apply(null, rows.map(function (r) { return Math.abs(r.offset); })) <= 0.20;
  }
  function ensureNewFields(s) {
    if (!s.cabinResults) s.cabinResults = { dock: { drip: null, toss: null }, steady: { drip: null, toss: null } };
    if (!s.claims) s.claims = { g1: [], g2: [], g3: [], g4: [] };
    ["g1", "g2", "g3", "g4"].forEach(function (id) { if (!Array.isArray(s.claims[id])) s.claims[id] = []; });
    return s;
  }
  function recordClaim(s, id, payload, ok) {
    ensureNewFields(s);
    s.claims[id].push({ sources: clone(payload.sources || []), concept: payload.concept || null, ok: !!ok });
  }
  function baselineReady(s) {
    var xs = s.baselineRuns.slice(-3);
    if (xs.length < 3 || xs.some(function (r) { return !r.clean; })) return false;
    return Math.abs(mean(xs.map(function (r) { return r.offset; }))) <= 0.15 &&
      Math.max.apply(null, xs.map(function (r) { return Math.abs(r.offset); })) <= 0.20;
  }
  function countRuns(s, stateName) {
    return s.mastRuns.filter(function (r) { return r.state === stateName; }).length;
  }
  function initialState() {
    return {
      days: 0,
      release: null,
      plumbCalibrated: false,
      baselineRuns: [],
      mastRuns: [],
      cabin: { dock: { drip: false, toss: false }, steady: { drip: false, toss: false } },
      cabinResults: { dock: { drip: null, toss: null }, steady: { drip: null, toss: null } },
      predictions: { accelerating: null, decelerating: null, locked: false },
      speedRuns: { accelerating: null, decelerating: null },
      overlay: { aligned: false, transformed: false, activeReference: "shore" },
      publicDemo: { procedure: [], runs: 0, complete: false },
      audit: { wind: false, acceleration: false, paths: false, boundary: false, overclaimTried: false },
      claims: { g1: [], g2: [], g3: [], g4: [] },
      evidence: { g1: false, g2: false, g3: false, g4: false, g5: false }
    };
  }

  function setRelease(state0, mode) {
    if (RELEASES.indexOf(mode) < 0) return err(state0, "unknown-release");
    if (state0.release === mode) return { state: state0, noop: true };
    var s = clone(state0);
    s.release = mode;
    if (!s.evidence.g1) s.baselineRuns = [];
    return { state: s };
  }
  function calibratePlumb(state0) {
    if (state0.plumbCalibrated) return { state: state0, noop: true };
    var s = clone(state0); s.plumbCalibrated = true; s.days += 1;
    return { state: s };
  }
  function runBaseline(state0) {
    if (!state0.plumbCalibrated) return err(state0, "plumb-required");
    if (!state0.release) return err(state0, "release-required");
    var s = clone(state0), seq = s.baselineRuns.length;
    var vals = BASE[s.release], v = vals[seq % vals.length];
    s.days += 1;
    s.baselineRuns.push({ id: seq + 1, release: s.release, offset: v, clean: s.release !== "hand", day: s.days });
    return { state: s, run: clone(s.baselineRuns[s.baselineRuns.length - 1]), ready: baselineReady(s) };
  }
  function runMast(state0, windowName) {
    if (!baselineReady(state0)) return err(state0, "baseline-required");
    if (WINDOWS.indexOf(windowName) < 0) return err(state0, "unknown-window");
    var stateName = windowName === "stable" ? "steady" : "accelerating";
    var s = clone(state0), idx = countRuns(s, stateName), vals = MAST[stateName];
    s.days += 1;
    var run = { id: s.mastRuns.length + 1, window: windowName, state: stateName,
      offset: vals[idx % vals.length], day: s.days };
    s.mastRuns.push(run);
    return { state: s, run: clone(run), claimReady: countRuns(s, "steady") >= 3 };
  }
  function assertG1(state0, baselineIds, mastIds, concept) {
    var s = ensureNewFields(clone(state0));
    var wantedBase = unique(baselineIds || []), wantedMast = unique(mastIds || []);
    var base = selected(s.baselineRuns, wantedBase);
    var mast = selected(s.mastRuns, wantedMast);
    var sourcesValid = base.length === wantedBase.length && mast.length === wantedMast.length &&
      base.every(function (r) { return r.clean; }) && mast.every(function (r) { return r.state === "steady"; });
    var ok = sourcesValid && nearFoot(base) && nearFoot(mast) && concept === "steady-shares-motion";
    recordClaim(s, "g1", { sources: ["baseline:" + (baselineIds || []).join(","), "steady:" + (mastIds || []).join(",")], concept: concept }, ok);
    if (ok) s.evidence.g1 = true;
    return { state: s, ok: ok, reason: ok ? null : "claim-mismatch", evidence: ok ? "G1" : null };
  }
  function runCabin(state0, vesselState, test) {
    if (!state0.evidence.g1) return err(state0, "g1-required");
    if (vesselState !== "dock" && vesselState !== "steady") return err(state0, "unknown-vessel-state");
    if (test !== "drip" && test !== "toss") return err(state0, "unknown-cabin-test");
    if (state0.cabin[vesselState][test]) return { state: state0, noop: true };
    var s = ensureNewFields(clone(state0)); s.cabin[vesselState][test] = true; s.days += 1;
    s.cabinResults[vesselState][test] = clone(CABIN[vesselState][test]);
    var complete = ["dock", "steady"].every(function (v) {
      return s.cabin[v].drip && s.cabin[v].toss;
    });
    return { state: s, result: { near: true, vesselState: vesselState, test: test,
      offset: CABIN[vesselState][test].offset, spread: CABIN[vesselState][test].spread }, claimReady: complete };
  }
  function assertG2(state0, cells, concept) {
    var s = ensureNewFields(clone(state0));
    var required = ["dock:drip", "dock:toss", "steady:drip", "steady:toss"];
    var picked = unique(cells || []).sort();
    var complete = required.every(function (key) {
      var p = key.split(":"); return !!(s.cabinResults[p[0]] && s.cabinResults[p[0]][p[1]]);
    });
    var ok = complete && JSON.stringify(picked) === JSON.stringify(required.slice().sort()) && concept === "steady-matches-dock";
    recordClaim(s, "g2", { sources: picked, concept: concept }, ok);
    if (ok) s.evidence.g2 = true;
    return { state: s, ok: ok, reason: ok ? null : "claim-mismatch", evidence: ok ? "G2" : null };
  }
  function setSpeedPrediction(state0, accelerating, decelerating) {
    if (!state0.evidence.g2) return err(state0, "g2-required");
    var allowed = ["behind", "foot", "ahead"];
    if (allowed.indexOf(accelerating) < 0 || allowed.indexOf(decelerating) < 0)
      return err(state0, "bad-prediction");
    if (accelerating === decelerating) return err(state0, "same-direction");
    if (state0.predictions.locked) return err(state0, "prediction-locked");
    var s = clone(state0);
    s.predictions = { accelerating: accelerating, decelerating: decelerating, locked: true };
    return { state: s };
  }
  function runSpeedChange(state0, kind) {
    if (!state0.predictions.locked) return err(state0, "prediction-required");
    if (kind !== "accelerating" && kind !== "decelerating") return err(state0, "unknown-speed-state");
    if (state0.speedRuns[kind]) return { state: state0, noop: true };
    var s = clone(state0), vals = MAST[kind], expected = kind === "accelerating" ? "behind" : "ahead";
    s.days += 1;
    s.speedRuns[kind] = { state: kind, offset: vals[0], predicted: s.predictions[kind],
      outcome: expected, matched: s.predictions[kind] === expected, day: s.days };
    var complete = !!(s.speedRuns.accelerating && s.speedRuns.decelerating);
    return { state: s, run: clone(s.speedRuns[kind]), claimReady: complete };
  }
  function assertG3(state0, kinds, concept) {
    var s = ensureNewFields(clone(state0));
    var picked = unique(kinds || []).sort();
    var complete = !!(s.speedRuns.accelerating && s.speedRuns.decelerating);
    var signs = complete && s.speedRuns.accelerating.offset < 0 && s.speedRuns.decelerating.offset > 0;
    var ok = signs && JSON.stringify(picked) === JSON.stringify(["accelerating", "decelerating"]) &&
      concept === "speed-change-breaks-shared-motion";
    recordClaim(s, "g3", { sources: picked, concept: concept }, ok);
    if (ok) s.evidence.g3 = true;
    return { state: s, ok: ok, reason: ok ? null : "claim-mismatch", evidence: ok ? "G3" : null };
  }
  function alignRecords(state0, pair) {
    if (!state0.evidence.g3) return err(state0, "g3-required");
    if (pair !== "sameBeats") return { state: state0, ok: false, reason: "beats-mismatch" };
    var s = clone(state0); s.overlay.aligned = true;
    return { state: s, ok: true };
  }
  function transformRecords(state0, kind) {
    if (!state0.overlay.aligned) return err(state0, "alignment-required");
    if (kind !== "subtractMast") return { state: state0, ok: false, reason: "wrong-transform" };
    var s = clone(state0); s.overlay.transformed = true; s.overlay.activeReference = "ship";
    return { state: s, ok: true, paper: clone(PAPER), claimReady: true };
  }
  function assertG4(state0, records, concept) {
    var s = ensureNewFields(clone(state0));
    var picked = unique(records || []).sort();
    var ok = s.overlay.aligned && s.overlay.transformed &&
      JSON.stringify(picked) === JSON.stringify(["ship", "shore"]) && concept === "same-event-different-reference";
    recordClaim(s, "g4", { sources: picked, concept: concept }, ok);
    if (ok) s.evidence.g4 = true;
    return { state: s, ok: ok, reason: ok ? null : "claim-mismatch", evidence: ok ? "G4" : null };
  }
  function setReference(state0, ref) {
    if (ref !== "shore" && ref !== "ship") return err(state0, "unknown-reference");
    var s = clone(state0); s.overlay.activeReference = ref;
    return { state: s };
  }
  function runPublicStep(state0, step) {
    if (!state0.evidence.g4) return err(state0, "g4-required");
    var order = ["baseline", "stable-window", "no-push", "repeat"];
    var expect = order[state0.publicDemo.procedure.length];
    if (step !== expect) return err(state0, "wrong-public-order");
    var s = clone(state0); s.publicDemo.procedure.push(step);
    if (step === "repeat") { s.publicDemo.runs = 3; s.publicDemo.complete = true; s.days += 3; }
    return { state: s, complete: s.publicDemo.complete };
  }
  function answerAudit(state0, questionId, evidenceId) {
    if (!state0.publicDemo.complete) return err(state0, "public-demo-required");
    var q = AUDIT[questionId];
    if (!q) return err(state0, "unknown-question");
    if (!state0.evidence[String(evidenceId || "").toLowerCase()]) return err(state0, "evidence-not-owned");
    if (evidenceId !== q.correct) return { state: state0, ok: false, reason: "evidence-mismatch", expected: q.correct };
    var s = clone(state0); s.audit[questionId] = true;
    return { state: s, ok: true, sealed: questionId };
  }
  function setBoundary(state0, choice) {
    if (!(state0.audit.wind && state0.audit.acceleration && state0.audit.paths))
      return err(state0, "audit-incomplete");
    if (choice !== "overclaim" && choice !== "honest") return err(state0, "unknown-boundary-choice");
    if (choice === "overclaim") {
      var bad = clone(state0); bad.audit.overclaimTried = true;
      return { state: bad, ok: false, repDelta: -1, reason: "overclaim" };
    }
    var s = clone(state0); s.audit.boundary = true; s.evidence.g5 = true;
    return { state: s, ok: true, evidence: "G5" };
  }

  var api = {
    initialState: initialState,
    setRelease: setRelease, calibratePlumb: calibratePlumb, runBaseline: runBaseline,
    runMast: runMast, runCabin: runCabin, setSpeedPrediction: setSpeedPrediction,
    assertG1: assertG1, assertG2: assertG2, assertG3: assertG3, assertG4: assertG4,
    runSpeedChange: runSpeedChange, alignRecords: alignRecords,
    transformRecords: transformRecords, setReference: setReference,
    runPublicStep: runPublicStep, answerAudit: answerAudit, setBoundary: setBoundary,
    baselineReady: baselineReady,
    _FIXTURE: { baseline: BASE, mast: MAST, cabin: CABIN, paper: PAPER }, _AUDIT: AUDIT
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.GB = root.GB || {}; root.GB.Engine3 = api;
})(typeof window !== "undefined" ? window : globalThis);
