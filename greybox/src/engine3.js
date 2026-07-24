/* src/engine3.js — 第三章船桅／共同運動引擎（重構規格 v0.2）。
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
  /* 每格保留三筆可循環重做的確定性 fixture。重做不是刷答案：它讓玩家
     檢查結果是否可重複；四格各一筆只負責解鎖推論。 */
  var CABIN = {
    dock: {
      drip: [{ offset: 0.03, spread: 0.06 }, { offset: -0.02, spread: 0.07 }, { offset: 0.04, spread: 0.05 }],
      toss: [{ offset: -0.04, spread: 0.09 }, { offset: 0.05, spread: 0.08 }, { offset: -0.02, spread: 0.10 }]
    },
    steady: {
      drip: [{ offset: 0.05, spread: 0.07 }, { offset: -0.03, spread: 0.06 }, { offset: 0.02, spread: 0.08 }],
      toss: [{ offset: -0.03, spread: 0.08 }, { offset: 0.04, spread: 0.09 }, { offset: -0.02, spread: 0.07 }]
    }
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
  var OVERLAY_PREVIEWS = ["initial", "inspection", "endpoints", "sameBeats", "scaleOnly", "subtractMast"];
  var PUBLIC_STEPS = ["baseline", "stable-window", "no-push", "seal-prediction", "repeat"];
  var PILOT_FOCI = ["release", "speed", "repeat"];
  var PILOT = {
    release: {
      label: "先把放手做乾淨",
      missing: ["speed", "repeat"],
      rows: [{ id: "P1", release: "latch", speed: "unmeasured", offset: -0.05, clean: true }]
    },
    speed: {
      label: "先把船速記下來",
      missing: ["release", "repeat"],
      rows: [{ id: "P1", release: "hand", speed: "accelerating", offset: -0.58, clean: false }]
    },
    repeat: {
      label: "先多跑幾趟看散布",
      missing: ["release", "speed"],
      rows: [
        { id: "P1", release: "hand", speed: "unmeasured", offset: -0.31, clean: false },
        { id: "P2", release: "hand", speed: "unmeasured", offset: 0.27, clean: false },
        { id: "P3", release: "hand", speed: "unmeasured", offset: -0.16, clean: false }
      ]
    }
  };
  var PROTOCOL_REQUIRED = {
    release: ["mathieu"],
    clock: ["sailor"],
    shore: ["etienne"],
    ship: ["gassendi", "traveler"],
    vessel: ["captain"]
  };
  var WIND_RUNS = [
    { id: "W1", relativeWind: "迎風", shipState: "steady", offset: -0.06 },
    { id: "W2", relativeWind: "順風", shipState: "steady", offset: 0.04 },
    { id: "W3", relativeWind: "側風", shipState: "accelerating", offset: -0.70 },
    { id: "W4", relativeWind: "反向側風", shipState: "steady", offset: 0.02 }
  ];
  var PUBLIC_RECORDS = [
    { id: "A", equalSegments: 3, release: "latch", dual: true, offset: 0.03 },
    { id: "B", equalSegments: 2, release: "latch", dual: true, offset: -0.71 },
    { id: "C", equalSegments: 3, release: "hand", dual: true, offset: 0.24 },
    { id: "D", equalSegments: 4, release: "latch", dual: true, offset: 0.05 },
    { id: "E", equalSegments: 3, release: "latch", dual: false, offset: 0.02 },
    { id: "F", equalSegments: 3, release: "latch", dual: true, offset: -0.04 }
  ];

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
    if (!s.design) s.design = {};
    if (!s.design.pilot) s.design.pilot = { focus: null, rows: [], missing: [], diagnosed: null, history: [] };
    if (!Array.isArray(s.design.pilot.rows)) s.design.pilot.rows = [];
    if (!Array.isArray(s.design.pilot.missing)) s.design.pilot.missing = [];
    if (!Array.isArray(s.design.pilot.history)) s.design.pilot.history = [];
    if (!s.design.protocol) s.design.protocol = { assignments: {}, attempts: [], locked: false, ran: false };
    if (!s.design.protocol.assignments) s.design.protocol.assignments = {};
    if (!Array.isArray(s.design.protocol.attempts)) s.design.protocol.attempts = [];
    if (typeof s.design.protocol.locked !== "boolean") s.design.protocol.locked = false;
    if (typeof s.design.protocol.ran !== "boolean") s.design.protocol.ran = false;
    if (["speed", "wind"].indexOf(s.design.investigationOrder) < 0) s.design.investigationOrder = null;
    if (!s.design.cabinBlind) s.design.cabinBlind = { test: null, traces: [], judgments: [], complete: false };
    if (!Array.isArray(s.design.cabinBlind.traces)) s.design.cabinBlind.traces = [];
    if (!Array.isArray(s.design.cabinBlind.judgments)) s.design.cabinBlind.judgments = [];
    if (typeof s.design.cabinBlind.complete !== "boolean") s.design.cabinBlind.complete = false;
    if (!s.design.wind) s.design.wind = { plan: null, attempts: [], runs: [], interpreted: false };
    if (!Array.isArray(s.design.wind.attempts)) s.design.wind.attempts = [];
    if (!Array.isArray(s.design.wind.runs)) s.design.wind.runs = [];
    if (typeof s.design.wind.interpreted !== "boolean") s.design.wind.interpreted = false;
    if (!s.design.dual) s.design.dual = { attempts: [], locked: false, setup: null };
    if (!Array.isArray(s.design.dual.attempts)) s.design.dual.attempts = [];
    if (typeof s.design.dual.locked !== "boolean") s.design.dual.locked = false;
    if (!s.cabin) s.cabin = { dock: { drip: false, toss: false }, steady: { drip: false, toss: false } };
    if (!s.cabinResults) s.cabinResults = { dock: { drip: [], toss: [] }, steady: { drip: [], toss: [] } };
    ["dock", "steady"].forEach(function (vessel) {
      if (!s.cabin[vessel]) s.cabin[vessel] = { drip: false, toss: false };
      if (!s.cabinResults[vessel]) s.cabinResults[vessel] = { drip: [], toss: [] };
      ["drip", "toss"].forEach(function (test) {
        var old = s.cabinResults[vessel][test];
        if (!Array.isArray(old)) {
          /* 舊存檔每格只有一個彙整物件；轉成第一筆原始紀錄。若只有完成旗標，
             用既有 fixture 補回該筆，避免已完成的四格被重置。 */
          old = old && typeof old.offset === "number" ? [old] :
            (s.cabin[vessel][test] ? [clone(CABIN[vessel][test][0])] : []);
          s.cabinResults[vessel][test] = old;
        }
        s.cabin[vessel][test] = old.length > 0;
      });
    });
    if (!s.speedRuns) s.speedRuns = { accelerating: [], decelerating: [] };
    ["accelerating", "decelerating"].forEach(function (kind) {
      var old = s.speedRuns[kind];
      /* v1 每種變速船況只能保存一筆；轉成可追加陣列，保留既有進度。 */
      if (!Array.isArray(old)) s.speedRuns[kind] = old ? [old] : [];
    });
    if (!s.claims) s.claims = { g1: [], g2: [], g3: [], g4: [] };
    ["g1", "g2", "g3", "g4"].forEach(function (id) { if (!Array.isArray(s.claims[id])) s.claims[id] = []; });
    if (!s.overlay) s.overlay = {
      aligned: false, transformed: false, activeReference: "shore",
      preview: "initial", inspectionBeat: -1, inspected: false
    };
    if (typeof s.overlay.aligned !== "boolean") s.overlay.aligned = false;
    if (typeof s.overlay.transformed !== "boolean") s.overlay.transformed = false;
    if (s.overlay.activeReference !== "shore" && s.overlay.activeReference !== "ship") s.overlay.activeReference = "shore";
    if (OVERLAY_PREVIEWS.indexOf(s.overlay.preview) < 0) {
      s.overlay.preview = s.overlay.transformed ? "subtractMast" : (s.overlay.aligned ? "sameBeats" : "initial");
    }
    if (!Number.isInteger(s.overlay.inspectionBeat) || s.overlay.inspectionBeat < -1 || s.overlay.inspectionBeat > 3)
      s.overlay.inspectionBeat = -1;
    if (typeof s.overlay.inspected !== "boolean")
      s.overlay.inspected = !!(s.overlay.aligned || s.overlay.transformed);
    if (!s.publicDemo) s.publicDemo = { procedure: [], runs: 0, predictionsSealed: false, complete: false };
    if (!Array.isArray(s.publicDemo.procedure)) s.publicDemo.procedure = [];
    if (typeof s.publicDemo.predictionsSealed !== "boolean") {
      /* v1 舊存檔把「先留預測」包在 repeat 裡；完整舊程序視為已封存。 */
      s.publicDemo.predictionsSealed = s.publicDemo.procedure.indexOf("repeat") >= 0;
    }
    if (!Array.isArray(s.publicDemo.criteriaHistory)) s.publicDemo.criteriaHistory = [];
    if (!s.publicDemo.decisions || typeof s.publicDemo.decisions !== "object") s.publicDemo.decisions = {};
    if (!Array.isArray(s.publicDemo.records) || !s.publicDemo.records.length)
      s.publicDemo.records = clone(PUBLIC_RECORDS);
    if (typeof s.publicDemo.screened !== "boolean") s.publicDemo.screened = false;
    if (typeof s.publicDemo.revealed !== "boolean") s.publicDemo.revealed = false;
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
      design: {
        pilot: { focus: null, rows: [], missing: [], diagnosed: null, history: [] },
        protocol: { assignments: {}, attempts: [], locked: false, ran: false },
        investigationOrder: null,
        cabinBlind: { test: null, traces: [], judgments: [], complete: false },
        wind: { plan: null, attempts: [], runs: [], interpreted: false },
        dual: { attempts: [], locked: false, setup: null }
      },
      release: null,
      plumbCalibrated: false,
      baselineRuns: [],
      mastRuns: [],
      cabin: { dock: { drip: false, toss: false }, steady: { drip: false, toss: false } },
      cabinResults: { dock: { drip: [], toss: [] }, steady: { drip: [], toss: [] } },
      predictions: { accelerating: null, decelerating: null, locked: false },
      speedRuns: { accelerating: [], decelerating: [] },
      overlay: {
        aligned: false, transformed: false, activeReference: "shore",
        preview: "initial", inspectionBeat: -1, inspected: false
      },
      publicDemo: {
        procedure: [], runs: 0, predictionsSealed: false, complete: false,
        criteria: null, criteriaHistory: [], records: clone(PUBLIC_RECORDS),
        decisions: {}, screened: false, revealed: false
      },
      audit: { wind: false, acceleration: false, paths: false, boundary: false, overclaimTried: false },
      claims: { g1: [], g2: [], g3: [], g4: [] },
      evidence: { g1: false, g2: false, g3: false, g4: false, g5: false }
    };
  }

  function choosePilotFocus(state0, focus) {
    if (PILOT_FOCI.indexOf(focus) < 0) return err(state0, "unknown-pilot-focus");
    var s = ensureNewFields(clone(state0));
    if (s.design.protocol.locked) return err(state0, "protocol-locked");
    s.design.pilot.focus = focus;
    s.design.pilot.rows = [];
    s.design.pilot.missing = [];
    s.design.pilot.diagnosed = null;
    return { state: s };
  }
  function runPilot(state0) {
    var s = ensureNewFields(clone(state0));
    var focus = s.design.pilot.focus;
    if (PILOT_FOCI.indexOf(focus) < 0) return err(state0, "pilot-focus-required");
    var spec = PILOT[focus];
    s.design.pilot.rows = clone(spec.rows);
    s.design.pilot.missing = spec.missing.slice();
    s.design.pilot.history.push({ focus: focus, rows: clone(spec.rows), missing: spec.missing.slice() });
    s.days += spec.rows.length;
    return { state: s, ok: true, rows: clone(spec.rows), missing: spec.missing.slice() };
  }
  function diagnosePilot(state0, gap) {
    var s = ensureNewFields(clone(state0));
    if (!s.design.pilot.rows.length) return err(state0, "pilot-required");
    if (["release", "speed", "repeat"].indexOf(gap) < 0) return err(state0, "unknown-pilot-gap");
    var ok = s.design.pilot.missing.indexOf(gap) >= 0;
    if (ok) s.design.pilot.diagnosed = gap;
    return { state: s, ok: ok, reason: ok ? null : "gap-already-covered", gap: gap };
  }
  function setProtocolAssignment(state0, slot, person) {
    if (!PROTOCOL_REQUIRED[slot]) return err(state0, "unknown-protocol-slot");
    if (["mathieu", "sailor", "etienne", "gassendi", "traveler", "captain"].indexOf(person) < 0)
      return err(state0, "unknown-protocol-person");
    var s = ensureNewFields(clone(state0));
    if (!s.design.pilot.diagnosed) return err(state0, "pilot-diagnosis-required");
    if (s.design.protocol.locked) return err(state0, "protocol-locked");
    s.design.protocol.assignments[slot] = person;
    return { state: s };
  }
  function lockProtocol(state0) {
    var s = ensureNewFields(clone(state0)), a = s.design.protocol.assignments;
    if (!s.design.pilot.diagnosed) return err(state0, "pilot-diagnosis-required");
    var missing = Object.keys(PROTOCOL_REQUIRED).filter(function (slot) { return !a[slot]; });
    if (missing.length) return { state: s, ok: false, reason: "protocol-incomplete", missing: missing };
    var people = Object.keys(PROTOCOL_REQUIRED).map(function (slot) { return a[slot]; });
    var duplicated = unique(people).length !== people.length;
    var wrong = Object.keys(PROTOCOL_REQUIRED).filter(function (slot) {
      return PROTOCOL_REQUIRED[slot].indexOf(a[slot]) < 0;
    });
    var ok = !duplicated && !wrong.length;
    s.design.protocol.attempts.push({ assignments: clone(a), ok: ok, duplicated: duplicated, wrong: wrong.slice() });
    if (ok) s.design.protocol.locked = true;
    return { state: s, ok: ok, reason: ok ? null : (duplicated ? "role-conflict" : "role-mismatch"), wrong: wrong };
  }
  function runDesignedProtocol(state0) {
    var s = ensureNewFields(clone(state0));
    if (!s.design.protocol.locked) return err(state0, "protocol-required");
    if (s.design.protocol.ran) return { state: s, noop: true, rows: clone(s.mastRuns) };
    s.release = "latch";
    s.plumbCalibrated = true;
    s.baselineRuns = [
      { id: 1, release: "latch", offset: -0.06, clean: true, day: s.days + 1 },
      { id: 2, release: "latch", offset: 0.03, clean: true, day: s.days + 1 },
      { id: 3, release: "latch", offset: 0.04, clean: true, day: s.days + 1 }
    ];
    s.mastRuns = [
      { id: 1, window: "old-observation", state: "accelerating", offset: -0.72, day: 0, prior: true },
      { id: 2, window: "stable", state: "steady", offset: -0.04, day: s.days + 2 },
      { id: 3, window: "stable", state: "steady", offset: 0.05, day: s.days + 3 },
      { id: 4, window: "stable", state: "steady", offset: 0.02, day: s.days + 4 }
    ];
    s.days += 4;
    s.design.protocol.ran = true;
    return { state: s, ok: true, rows: clone(s.mastRuns) };
  }
  function assertG1Designed(state0, concept) {
    var s = ensureNewFields(clone(state0));
    var steady = s.mastRuns.filter(function (r) { return r.state === "steady"; });
    var ok = s.design.protocol.ran && steady.length >= 3 && nearFoot(steady) &&
      concept === "steady-shares-motion";
    recordClaim(s, "g1", { sources: ["protocol:independent-release", "speed:three-equal-segments", "steady:2,3,4"], concept: concept }, ok);
    if (ok) s.evidence.g1 = true;
    return { state: s, ok: ok, reason: ok ? null : "claim-mismatch", evidence: ok ? "G1" : null };
  }
  function chooseInvestigationOrder(state0, order) {
    if (order !== "speed" && order !== "wind") return err(state0, "unknown-investigation-order");
    var s = ensureNewFields(clone(state0));
    if (!s.evidence.g1) return err(state0, "g1-required");
    if (s.design.investigationOrder && s.design.investigationOrder !== order)
      return err(state0, "investigation-order-locked");
    s.design.investigationOrder = order;
    return { state: s };
  }
  function runCabinBlindPair(state0, test) {
    if (test !== "drip" && test !== "toss") return err(state0, "unknown-cabin-test");
    var s = ensureNewFields(clone(state0));
    if (!s.evidence.g1) return err(state0, "g1-required");
    s.design.cabinBlind.test = test;
    s.design.cabinBlind.traces = test === "drip"
      ? [{ id: "A", offset: 0.03, spread: 0.06 }, { id: "B", offset: 0.05, spread: 0.07 }]
      : [{ id: "A", offset: -0.04, spread: 0.09 }, { id: "B", offset: -0.03, spread: 0.08 }];
    s.design.cabinBlind.complete = false;
    s.days += 2;
    return { state: s, ok: true, traces: clone(s.design.cabinBlind.traces) };
  }
  function judgeCabinBlind(state0, choice) {
    var s = ensureNewFields(clone(state0));
    if (!s.design.cabinBlind.traces.length) return err(state0, "cabin-pair-required");
    if (["a-dock", "b-dock", "indistinguishable"].indexOf(choice) < 0)
      return err(state0, "unknown-cabin-judgment");
    var ok = choice === "indistinguishable";
    s.design.cabinBlind.judgments.push({ choice: choice, ok: ok });
    if (ok) s.design.cabinBlind.complete = true;
    return { state: s, ok: ok, reason: ok ? null : "local-traces-overread" };
  }
  function runWindAudit(state0, plan) {
    if (["single-heading", "shore-wind-only", "relative-roundtrip"].indexOf(plan) < 0)
      return err(state0, "unknown-wind-plan");
    var s = ensureNewFields(clone(state0));
    if (!s.evidence.g1) return err(state0, "g1-required");
    var ok = plan === "relative-roundtrip";
    s.design.wind.plan = plan;
    s.design.wind.attempts.push({ plan: plan, ok: ok });
    s.design.wind.runs = ok ? clone(WIND_RUNS) :
      [{ id: "W?", relativeWind: plan === "single-heading" ? "單一航向" : "只記岸上風向",
        shipState: "unknown", offset: -0.18 }];
    /* 先查風時，W3 的偏移只能先列為「船況未分類」；玩家完成變速反驗後，
       才有資格把它辨認為加速指紋。這讓調查順序真正改變可讀出的資料。 */
    if (ok && !s.evidence.g3) {
      s.design.wind.runs = s.design.wind.runs.map(function (row) {
        if (row.id !== "W3") return row;
        row.shipState = "unclassified";
        return row;
      });
    }
    s.design.wind.interpreted = false;
    s.days += ok ? 4 : 1;
    return { state: s, ok: ok, reason: ok ? null : "wind-design-ambiguous", runs: clone(s.design.wind.runs) };
  }
  function assertG2Designed(state0, concept) {
    var s = ensureNewFields(clone(state0));
    var robust = s.design.wind.plan === "relative-roundtrip" && s.design.wind.runs.length === 4;
    var ok = s.design.cabinBlind.complete && robust && s.evidence.g3 &&
      concept === "local-common-motion-wind-below-spread";
    recordClaim(s, "g2", { sources: ["cabin:blind-pair", "wind:relative-roundtrip", "speed:classified"], concept: concept }, ok);
    if (ok) {
      s.design.wind.interpreted = true;
      s.evidence.g2 = true;
    }
    return { state: s, ok: ok, reason: ok ? null : "claim-mismatch", evidence: ok ? "G2" : null };
  }
  function setDualDesign(state0, setup) {
    var s = ensureNewFields(clone(state0));
    if (!(s.evidence.g2 && s.evidence.g3)) return err(state0, "investigations-required");
    setup = setup || {};
    var ok = setup.shoreOrigin === "quay" && setup.shipOrigin === "mast" &&
      setup.clock === "shared-drum" && ["gassendi", "traveler"].indexOf(setup.shipObserver) >= 0;
    s.design.dual.attempts.push({ setup: clone(setup), ok: ok });
    if (ok) {
      s.design.dual.setup = clone(setup);
      s.design.dual.locked = true;
    }
    return { state: s, ok: ok, reason: ok ? null : "dual-design-mismatch" };
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
    var s = ensureNewFields(clone(state0));
    var runs = s.cabinResults[vesselState][test];
    var fixture = CABIN[vesselState][test][runs.length % CABIN[vesselState][test].length];
    s.cabin[vesselState][test] = true; s.days += 1;
    var result = { id: runs.length + 1, near: true, vesselState: vesselState, test: test,
      offset: fixture.offset, spread: fixture.spread, day: s.days };
    runs.push(result);
    var complete = ["dock", "steady"].every(function (v) {
      return s.cabinResults[v].drip.length > 0 && s.cabinResults[v].toss.length > 0;
    });
    return { state: s, result: clone(result), claimReady: complete };
  }
  function assertG2(state0, cells, concept) {
    var s = ensureNewFields(clone(state0));
    var required = ["dock:drip", "dock:toss", "steady:drip", "steady:toss"];
    var picked = unique(cells || []).sort();
    var complete = required.every(function (key) {
      var p = key.split(":"); return !!(s.cabinResults[p[0]] &&
        Array.isArray(s.cabinResults[p[0]][p[1]]) && s.cabinResults[p[0]][p[1]].length);
    });
    var ok = complete && JSON.stringify(picked) === JSON.stringify(required.slice().sort()) && concept === "steady-matches-dock";
    recordClaim(s, "g2", { sources: picked, concept: concept }, ok);
    if (ok) s.evidence.g2 = true;
    return { state: s, ok: ok, reason: ok ? null : "claim-mismatch", evidence: ok ? "G2" : null };
  }
  function setSpeedPrediction(state0, accelerating, decelerating) {
    if (!state0.evidence.g1) return err(state0, "g1-required");
    if (!state0.design || !state0.design.investigationOrder)
      return err(state0, "investigation-order-required");
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
    var s = ensureNewFields(clone(state0)), vals = MAST[kind];
    var runs = s.speedRuns[kind], expected = kind === "accelerating" ? "behind" : "ahead";
    s.days += 1;
    var run = { id: runs.length + 1, state: kind, offset: vals[runs.length % vals.length],
      predicted: s.predictions[kind], outcome: expected,
      matched: s.predictions[kind] === expected, day: s.days };
    runs.push(run);
    var complete = s.speedRuns.accelerating.length > 0 && s.speedRuns.decelerating.length > 0;
    return { state: s, run: clone(run), claimReady: complete };
  }
  function assertG3(state0, kinds, concept) {
    var s = ensureNewFields(clone(state0));
    var picked = unique(kinds || []).sort();
    var complete = s.speedRuns.accelerating.length > 0 && s.speedRuns.decelerating.length > 0;
    var signs = complete &&
      mean(s.speedRuns.accelerating.map(function (r) { return r.offset; })) < 0 &&
      mean(s.speedRuns.decelerating.map(function (r) { return r.offset; })) > 0;
    var ok = signs && JSON.stringify(picked) === JSON.stringify(["accelerating", "decelerating"]) &&
      concept === "speed-change-breaks-shared-motion";
    recordClaim(s, "g3", { sources: picked, concept: concept }, ok);
    if (ok) {
      s.evidence.g3 = true;
      /* 風先行路線先留下「未分類」的 W3。取得變速指紋後才補上船況，
         資料沒有被改寫，只有分類依據被補齊。 */
      if (s.design.wind && Array.isArray(s.design.wind.runs)) {
        s.design.wind.runs = s.design.wind.runs.map(function (row) {
          if (row.id !== "W3" || row.shipState !== "unclassified") return row;
          row.shipState = "accelerating";
          row.classifiedAfterG3 = true;
          return row;
        });
      }
    }
    return { state: s, ok: ok, reason: ok ? null : "claim-mismatch", evidence: ok ? "G3" : null };
  }
  function inspectRecordBeat(state0) {
    if (!(state0.evidence.g2 && state0.evidence.g3))
      return err(state0, "investigations-required");
    if (!state0.design || !state0.design.dual || !state0.design.dual.locked)
      return err(state0, "dual-design-required");
    var s = ensureNewFields(clone(state0));
    var next = s.overlay.inspectionBeat >= PAPER.beats.length - 1 ? 0 : s.overlay.inspectionBeat + 1;
    s.overlay.inspectionBeat = next;
    s.overlay.preview = "inspection";
    if (next === PAPER.beats.length - 1) s.overlay.inspected = true;
    return { state: s, ok: true, beat: next, inspected: s.overlay.inspected, preview: "inspection" };
  }
  function alignRecords(state0, pair) {
    if (!(state0.evidence.g2 && state0.evidence.g3))
      return err(state0, "investigations-required");
    if (!state0.design || !state0.design.dual || !state0.design.dual.locked)
      return err(state0, "dual-design-required");
    var s = ensureNewFields(clone(state0));
    if (!s.overlay.inspected) return err(state0, "records-unread");
    if (pair === "endpoints" || pair === "thirdFourth") {
      s.overlay.aligned = false; s.overlay.transformed = false; s.overlay.preview = "endpoints";
      return { state: s, ok: false, reason: "beats-mismatch", preview: "endpoints" };
    }
    if (pair !== "sameBeats") return err(state0, "unknown-alignment");
    s.overlay.aligned = true; s.overlay.transformed = false; s.overlay.preview = "sameBeats";
    return { state: s, ok: true, preview: "sameBeats" };
  }
  function transformRecords(state0, kind) {
    if (!state0.overlay.aligned) return err(state0, "alignment-required");
    var s = ensureNewFields(clone(state0));
    if (kind === "scaleOnly") {
      s.overlay.transformed = false; s.overlay.preview = "scaleOnly";
      return { state: s, ok: false, reason: "wrong-transform", preview: "scaleOnly" };
    }
    if (kind !== "subtractMast") return err(state0, "unknown-transform");
    s.overlay.transformed = true; s.overlay.activeReference = "ship"; s.overlay.preview = "subtractMast";
    return { state: s, ok: true, preview: "subtractMast", paper: clone(PAPER), claimReady: true };
  }
  function resetOverlay(state0) {
    if (!(state0.evidence.g2 && state0.evidence.g3))
      return err(state0, "investigations-required");
    if (!state0.design || !state0.design.dual || !state0.design.dual.locked)
      return err(state0, "dual-design-required");
    var s = ensureNewFields(clone(state0));
    s.overlay = {
      aligned: false, transformed: false, activeReference: "shore",
      preview: "initial", inspectionBeat: -1, inspected: false
    };
    return { state: s, ok: true, preview: "initial" };
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
    var base = ensureNewFields(clone(state0));
    var expect = PUBLIC_STEPS[base.publicDemo.procedure.length];
    if (step !== expect) return err(state0, "wrong-public-order");
    var s = base; s.publicDemo.procedure.push(step);
    if (step === "seal-prediction") s.publicDemo.predictionsSealed = true;
    if (step === "repeat") { s.publicDemo.runs = 3; s.publicDemo.complete = true; s.days += 3; }
    return { state: s, complete: s.publicDemo.complete };
  }
  function sealPublicCriteria(state0, criteria0) {
    var s = ensureNewFields(clone(state0));
    if (!s.evidence.g4) return err(state0, "g4-required");
    var criteria = criteria0 || {};
    if ([2, 3, 4].indexOf(Number(criteria.equalSegments)) < 0 ||
        [2, 3].indexOf(Number(criteria.repeats)) < 0 ||
        ["hand", "latch"].indexOf(criteria.release) < 0 ||
        typeof criteria.requireDual !== "boolean")
      return err(state0, "bad-public-criteria");
    if (s.publicDemo.criteria) s.publicDemo.criteriaHistory.push(clone(s.publicDemo.criteria));
    s.publicDemo.criteria = {
      equalSegments: Number(criteria.equalSegments),
      repeats: Number(criteria.repeats),
      release: criteria.release,
      requireDual: criteria.requireDual
    };
    s.publicDemo.decisions = {};
    s.publicDemo.screened = false;
    s.publicDemo.revealed = false;
    s.publicDemo.complete = false;
    s.publicDemo.runs = 0;
    return { state: s, ok: true, criteria: clone(s.publicDemo.criteria) };
  }
  function screenPublicRecord(state0, recordId, accept) {
    var s = ensureNewFields(clone(state0));
    if (!s.publicDemo.criteria) return err(state0, "public-criteria-required");
    if (s.publicDemo.revealed) return err(state0, "public-results-revealed");
    if (!PUBLIC_RECORDS.some(function (r) { return r.id === recordId; }))
      return err(state0, "unknown-public-record");
    if (typeof accept !== "boolean") return err(state0, "bad-public-decision");
    s.publicDemo.decisions[recordId] = accept;
    return { state: s, ok: true };
  }
  function publicEligible(record, criteria) {
    return record.equalSegments >= criteria.equalSegments &&
      record.release === criteria.release &&
      (!criteria.requireDual || record.dual);
  }
  function finalizePublicScreen(state0) {
    var s = ensureNewFields(clone(state0));
    var criteria = s.publicDemo.criteria;
    if (!criteria) return err(state0, "public-criteria-required");
    var missing = PUBLIC_RECORDS.filter(function (r) {
      return typeof s.publicDemo.decisions[r.id] !== "boolean";
    }).map(function (r) { return r.id; });
    if (missing.length) return { state: s, ok: false, reason: "screening-incomplete", missing: missing };
    /* 這不是替玩家暗藏一組唯一數值答案，而是物理與可追溯性的最低護欄：
       三段穩速、三次重複、無推放手、雙紀錄缺一不可。較寬的標準會在
       揭曉前被艦長退回，玩家可修改後重新封存。 */
    var safe = criteria.equalSegments >= 3 && criteria.repeats >= 3 &&
      criteria.release === "latch" && criteria.requireDual;
    if (!safe) return { state: s, ok: false, reason: "criteria-too-weak" };
    var mismatch = PUBLIC_RECORDS.filter(function (r) {
      return s.publicDemo.decisions[r.id] !== publicEligible(r, criteria);
    }).map(function (r) { return r.id; });
    if (mismatch.length)
      return { state: s, ok: false, reason: "screening-mismatch", mismatch: mismatch };
    var accepted = PUBLIC_RECORDS.filter(function (r) { return !!s.publicDemo.decisions[r.id]; });
    if (accepted.length < criteria.repeats)
      return { state: s, ok: false, reason: "too-few-public-records" };
    s.publicDemo.screened = true;
    return { state: s, ok: true, accepted: accepted.map(function (r) { return r.id; }) };
  }
  function revealPublicResults(state0) {
    var s = ensureNewFields(clone(state0));
    if (!s.publicDemo.screened) return err(state0, "public-screen-required");
    var accepted = PUBLIC_RECORDS.filter(function (r) { return !!s.publicDemo.decisions[r.id]; });
    s.publicDemo.revealed = true;
    s.publicDemo.complete = true;
    s.publicDemo.runs = accepted.length;
    s.days += accepted.length;
    return {
      state: s, ok: true, complete: true,
      accepted: accepted.map(function (r) { return clone(r); })
    };
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
    var redesignedComplete = !!(state0.publicDemo && state0.publicDemo.complete &&
      state0.publicDemo.screened && state0.publicDemo.revealed);
    var legacyComplete = !!(state0.audit.wind && state0.audit.acceleration && state0.audit.paths);
    if (!(redesignedComplete || legacyComplete)) return err(state0, "audit-incomplete");
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
    choosePilotFocus: choosePilotFocus, runPilot: runPilot, diagnosePilot: diagnosePilot,
    setProtocolAssignment: setProtocolAssignment, lockProtocol: lockProtocol,
    runDesignedProtocol: runDesignedProtocol, assertG1Designed: assertG1Designed,
    chooseInvestigationOrder: chooseInvestigationOrder,
    runCabinBlindPair: runCabinBlindPair, judgeCabinBlind: judgeCabinBlind,
    runWindAudit: runWindAudit, assertG2Designed: assertG2Designed,
    setDualDesign: setDualDesign,
    setRelease: setRelease, calibratePlumb: calibratePlumb, runBaseline: runBaseline,
    runMast: runMast, runCabin: runCabin, setSpeedPrediction: setSpeedPrediction,
    assertG1: assertG1, assertG2: assertG2, assertG3: assertG3, assertG4: assertG4,
    runSpeedChange: runSpeedChange, inspectRecordBeat: inspectRecordBeat, alignRecords: alignRecords,
    transformRecords: transformRecords, resetOverlay: resetOverlay, setReference: setReference,
    runPublicStep: runPublicStep, sealPublicCriteria: sealPublicCriteria,
    screenPublicRecord: screenPublicRecord, finalizePublicScreen: finalizePublicScreen,
    revealPublicResults: revealPublicResults,
    answerAudit: answerAudit, setBoundary: setBoundary,
    baselineReady: baselineReady,
    _FIXTURE: {
      baseline: BASE, mast: MAST, cabin: CABIN, paper: PAPER,
      pilot: PILOT, wind: WIND_RUNS, publicRecords: PUBLIC_RECORDS
    },
    _AUDIT: AUDIT, _PUBLIC_STEPS: PUBLIC_STEPS.slice()
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.GB = root.GB || {}; root.GB.Engine3 = api;
})(typeof window !== "undefined" ? window : globalThis);
