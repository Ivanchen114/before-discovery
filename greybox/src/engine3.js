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
  /* CH3-CR-018：正式劇情改走同一份航次卷宗。舊 API 暫留給舊存檔遷移，
     但新場景只使用下列確定性資料；數字是教學模型，不冒充 1640 原始測量。 */
  var CASE_STAGES = ["v1", "v2", "v3", "wind", "cabin", "v4", "dual", "public"];
  var CASE_RUNS = {
    v2: {
      vessel: "accelerating", repeats: 3, offsets: [-0.72, -0.66, -0.75],
      shoreGaps: [1.0, 1.6, 2.3], landing: "aft"
    },
    v3: {
      vessel: "steady", repeats: 3, offsets: [-0.04, 0.05, 0.02],
      shoreGaps: [1.5, 1.5, 1.5], landing: "foot"
    },
    wind: {
      vessel: "steady", repeats: 6,
      outward: { relativeWind: "from-aft", offsets: [-0.05, 0.03, 0.04] },
      return: { relativeWind: "from-fore", offsets: [0.02, -0.04, 0.05] },
      landing: "foot"
    },
    cabin: {
      hiddenStates: ["dock", "steady"],
      traces: [
        { water: "level", ball: "under-hand" },
        { water: "level", ball: "under-hand" }
      ]
    },
    v4: {
      vessel: "decelerating", repeats: 3, offsets: [0.69, 0.63, 0.71],
      shoreGaps: [2.3, 1.6, 1.0], landing: "fore"
    },
    dual: {
      vessel: "steady", repeats: 3,
      beats: [0, 1, 2, 3], mastX: [0, 1, 2, 3],
      shoreStoneX: [0, 1, 2, 3], y: [0, 1, 4, 9],
      shipStoneX: [0, 0, 0, 0]
    },
    public: {
      vessel: "steady", repeats: 3, offsets: [-0.03, 0.04, 0.01],
      shoreGaps: [1.5, 1.5, 1.5], landing: "foot"
    }
  };
  var DOSSIER_STAGES = ["dock", "steady", "depart", "brake"];
  var DOSSIER_RELEASES = ["hand", "latch"];
  var DOSSIER_SPEED_RECORDS = ["none", "beats"];
  var DOSSIER_POSITION_RECORDS = ["mast", "dual"];
  var DOSSIER_REPEATS = [1, 3];
  var DOSSIER_FIXTURES = {
    dock: { vessel: "dock", classification: "停泊", offsets: [-0.03, 0.02, 0.01], shoreGaps: [0, 0, 0], landing: "foot" },
    steady: { vessel: "steady", classification: "近似穩速", offsets: [-0.04, 0.05, 0.02], shoreGaps: [1.5, 1.5, 1.5], landing: "foot" },
    depart: { vessel: "accelerating", classification: "正在變快", offsets: [-0.72, -0.66, -0.75], shoreGaps: [1.0, 1.6, 2.3], landing: "aft" },
    brake: { vessel: "decelerating", classification: "正在變慢", offsets: [0.69, 0.63, 0.71], shoreGaps: [2.3, 1.6, 1.0], landing: "fore" }
  };

  function makeDossier() {
    return {
      page: "lab",
      draft: {
        stage: "steady", release: "hand", speedRecord: "none",
        positionRecord: "mast", repeats: 1, sameStone: true, sameHeight: true
      },
      records: [],
      nextRecordId: 1,
      candidates: {},
      assertions: { A1: false, A2: false, A3: false, A6: true, S1: false, S4: false, A4: false, A5: false },
      scopeAttempts: [],
      blind: { ran: false, judgment: null, unsealed: false, scope: false, attempts: [] },
      debate: {
        active: false, rep: 5, current: null, lastReply: "",
        pins: [], attempts: [],
        pillars: { p1: false, p2: false, p3: false },
        p1: { concept: false, steady: false, cabin: false, wind: false },
        p2: { question: false, concept: false, steady: false, depart: false, old: false, boundary: false },
        p3: { question: false, concept: false, aligned: false, transformed: false, alignAttempts: [], transformAttempts: [] },
        boundary: null
      },
      complete: false
    };
  }

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
    if (!s.caseFile || typeof s.caseFile !== "object") s.caseFile = {};
    if (["release", "speed", "wind"].indexOf(s.caseFile.firstControl) < 0) s.caseFile.firstControl = null;
    if (typeof s.caseFile.crewConfirmed !== "boolean") s.caseFile.crewConfirmed = false;
    if (!s.caseFile.voyages || typeof s.caseFile.voyages !== "object") s.caseFile.voyages = {};
    CASE_STAGES.forEach(function (stage) {
      if (!s.caseFile.voyages[stage] || typeof s.caseFile.voyages[stage] !== "object")
        s.caseFile.voyages[stage] = null;
    });
    if (!Array.isArray(s.caseFile.attempts)) s.caseFile.attempts = [];
    if (!Array.isArray(s.caseFile.fingerprintAttempts)) s.caseFile.fingerprintAttempts = [];
    if (!Array.isArray(s.caseFile.dualAttempts)) s.caseFile.dualAttempts = [];
    if (!Array.isArray(s.caseFile.boundaryAttempts)) s.caseFile.boundaryAttempts = [];
    if (s.caseFile.windJudgment !== "wind-not-systematic") s.caseFile.windJudgment = null;
    if (s.caseFile.cabinJudgment !== "indistinguishable") s.caseFile.cabinJudgment = null;
    if (["fore", "aft", "foot"].indexOf(s.caseFile.decelPrediction) < 0) s.caseFile.decelPrediction = null;
    if (typeof s.caseFile.fingerprintComplete !== "boolean") s.caseFile.fingerprintComplete = false;
    if (typeof s.caseFile.transformProgress !== "number" || !isFinite(s.caseFile.transformProgress))
      s.caseFile.transformProgress = 0;
    s.caseFile.transformProgress = Math.max(0, Math.min(1, s.caseFile.transformProgress));
    if (typeof s.caseFile.dualNamed !== "boolean") s.caseFile.dualNamed = false;
    if (typeof s.caseFile.publicCriteriaConfirmed !== "boolean") s.caseFile.publicCriteriaConfirmed = false;
    if (typeof s.caseFile.publicComplete !== "boolean") s.caseFile.publicComplete = false;
    if (s.caseFile.boundary !== "honest") s.caseFile.boundary = null;
    if (!s.caseFile.dossier || typeof s.caseFile.dossier !== "object") s.caseFile.dossier = makeDossier();
    var d = s.caseFile.dossier, defaults = makeDossier();
    if (["lab", "debate"].indexOf(d.page) < 0) d.page = "lab";
    if (!d.draft || typeof d.draft !== "object") d.draft = clone(defaults.draft);
    if (DOSSIER_STAGES.indexOf(d.draft.stage) < 0) d.draft.stage = defaults.draft.stage;
    if (DOSSIER_RELEASES.indexOf(d.draft.release) < 0) d.draft.release = defaults.draft.release;
    if (DOSSIER_SPEED_RECORDS.indexOf(d.draft.speedRecord) < 0) d.draft.speedRecord = defaults.draft.speedRecord;
    if (DOSSIER_POSITION_RECORDS.indexOf(d.draft.positionRecord) < 0) d.draft.positionRecord = defaults.draft.positionRecord;
    if (DOSSIER_REPEATS.indexOf(Number(d.draft.repeats)) < 0) d.draft.repeats = defaults.draft.repeats;
    if (typeof d.draft.sameStone !== "boolean") d.draft.sameStone = true;
    if (typeof d.draft.sameHeight !== "boolean") d.draft.sameHeight = true;
    if (!Array.isArray(d.records)) d.records = [];
    if (!Number.isInteger(d.nextRecordId) || d.nextRecordId < 1) d.nextRecordId = d.records.length + 1;
    if (!d.candidates || typeof d.candidates !== "object") d.candidates = {};
    if (!d.assertions || typeof d.assertions !== "object") d.assertions = clone(defaults.assertions);
    Object.keys(defaults.assertions).forEach(function (id) {
      if (typeof d.assertions[id] !== "boolean") d.assertions[id] = defaults.assertions[id];
    });
    if (!Array.isArray(d.scopeAttempts)) d.scopeAttempts = [];
    if (!d.blind || typeof d.blind !== "object") d.blind = clone(defaults.blind);
    if (!Array.isArray(d.blind.attempts)) d.blind.attempts = [];
    if (typeof d.blind.ran !== "boolean") d.blind.ran = false;
    if (typeof d.blind.unsealed !== "boolean") d.blind.unsealed = false;
    if (typeof d.blind.scope !== "boolean") d.blind.scope = false;
    if (!d.debate || typeof d.debate !== "object") d.debate = clone(defaults.debate);
    if (!Array.isArray(d.debate.pins)) d.debate.pins = [];
    if (!Array.isArray(d.debate.attempts)) d.debate.attempts = [];
    if (!d.debate.pillars) d.debate.pillars = clone(defaults.debate.pillars);
    if (!d.debate.p1) d.debate.p1 = clone(defaults.debate.p1);
    if (!d.debate.p2) d.debate.p2 = clone(defaults.debate.p2);
    if (!d.debate.p3) d.debate.p3 = clone(defaults.debate.p3);
    if (!Array.isArray(d.debate.p3.alignAttempts)) d.debate.p3.alignAttempts = [];
    if (!Array.isArray(d.debate.p3.transformAttempts)) d.debate.p3.transformAttempts = [];
    if (typeof d.complete !== "boolean") d.complete = false;
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
      evidence: { g1: false, g2: false, g3: false, g4: false, g5: false },
      caseFile: {
        firstControl: null,
        crewConfirmed: false,
        voyages: { v1: null, v2: null, v3: null, wind: null, cabin: null, v4: null, dual: null, public: null },
        attempts: [], fingerprintAttempts: [], dualAttempts: [], boundaryAttempts: [],
        windJudgment: null, cabinJudgment: null, decelPrediction: null,
        fingerprintComplete: false, transformProgress: 0, dualNamed: false,
        publicCriteriaConfirmed: false, publicComplete: false, boundary: null,
        dossier: makeDossier()
      }
    };
  }

  /* 舊版第三章本機存檔可能還沒有自由實驗卷宗。
     UI 在第一次顯示前先走這個純函式，避免直接讀取缺欄位而中斷。 */
  function migrateLabState(state0) {
    return ensureNewFields(clone(state0));
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

  /* ---------- CH3-CR-018：單一航次卷宗 ---------- */
  function caseVoyageReady(s, stage) {
    var cf = s.caseFile;
    if (stage === "v1") return true;
    if (stage === "v2") return !!cf.crewConfirmed;
    if (stage === "v3") return !!cf.voyages.v2;
    if (stage === "wind") return !!cf.voyages.v3;
    if (stage === "cabin") return !!(cf.voyages.wind && cf.windJudgment);
    if (stage === "v4") return !!(cf.voyages.cabin && cf.cabinJudgment && cf.decelPrediction);
    if (stage === "dual") return !!cf.fingerprintComplete;
    if (stage === "public") return !!(cf.voyages.dual && cf.dualNamed && cf.publicCriteriaConfirmed);
    return false;
  }
  function runCaseVoyage(state0, stage, args0) {
    if (CASE_STAGES.indexOf(stage) < 0) return err(state0, "unknown-case-stage");
    var s = ensureNewFields(clone(state0)), args = args0 || {}, cf = s.caseFile;
    if (stage === "v1") {
      var focus = args.focus || cf.firstControl;
      if (["release", "speed", "wind"].indexOf(focus) < 0) return err(state0, "case-control-required");
      cf.firstControl = focus;
      cf.voyages.v1 = {
        stage: "v1", focus: focus, repeats: 1, landing: "aft", offset: -0.58,
        release: focus === "release" ? "latch" : "uncontrolled",
        vessel: focus === "speed" ? "accelerating" : "unclassified",
        wind: focus === "wind" ? "recorded-one-heading" : "unmeasured",
        missing: ["release", "speed", "repeat", "wind"].filter(function (id) {
          return id !== focus && !(focus === "wind" && id === "wind");
        })
      };
    } else {
      if (stage === "v4" && ["fore", "aft", "foot"].indexOf(args.prediction) >= 0)
        cf.decelPrediction = args.prediction;
      if (!caseVoyageReady(s, stage)) return err(state0, "case-stage-not-ready");
      cf.voyages[stage] = clone(CASE_RUNS[stage]);
      cf.voyages[stage].stage = stage;
    }
    cf.attempts.push({ stage: stage, at: cf.attempts.length + 1 });
    if (stage === "v3") s.evidence.g1 = true;
    if (stage === "public") {
      cf.publicComplete = true;
      s.publicDemo.complete = true;
      s.publicDemo.runs = 3;
    }
    s.days += 1;
    return {
      state: s, ok: true, stage: stage, record: clone(cf.voyages[stage]),
      predictionMatched: stage === "v4" ? cf.decelPrediction === "fore" : null
    };
  }
  function confirmCaseCrew(state0) {
    var s = ensureNewFields(clone(state0));
    if (!s.caseFile.voyages.v1) return err(state0, "case-v1-required");
    s.caseFile.crewConfirmed = true;
    return { state: s, ok: true };
  }
  function interpretCaseWind(state0, choice) {
    var s = ensureNewFields(clone(state0));
    if (!s.caseFile.voyages.wind) return err(state0, "case-wind-required");
    if (choice !== "wind-not-systematic") {
      s.caseFile.attempts.push({ stage: "wind-judgment", choice: choice, ok: false });
      return { state: s, ok: false, reason: "wind-overread" };
    }
    s.caseFile.windJudgment = choice;
    s.caseFile.attempts.push({ stage: "wind-judgment", choice: choice, ok: true });
    return { state: s, ok: true };
  }
  function judgeCaseCabin(state0, choice) {
    var s = ensureNewFields(clone(state0));
    if (!s.caseFile.voyages.cabin) return err(state0, "case-cabin-required");
    if (choice !== "indistinguishable") {
      s.caseFile.attempts.push({ stage: "cabin-judgment", choice: choice, ok: false });
      return { state: s, ok: false, reason: "local-traces-overread" };
    }
    s.caseFile.cabinJudgment = choice;
    s.caseFile.attempts.push({ stage: "cabin-judgment", choice: choice, ok: true });
    s.evidence.g2 = true;
    return { state: s, ok: true, evidence: "G2" };
  }
  function setCasePrediction(state0, choice) {
    if (["fore", "aft", "foot"].indexOf(choice) < 0) return err(state0, "unknown-case-prediction");
    var s = ensureNewFields(clone(state0));
    if (!s.caseFile.cabinJudgment) return err(state0, "case-cabin-required");
    if (s.caseFile.voyages.v4) return err(state0, "prediction-already-revealed");
    s.caseFile.decelPrediction = choice;
    return { state: s, ok: true, prediction: choice };
  }
  function assertCaseFingerprint(state0, choice) {
    var s = ensureNewFields(clone(state0)), cf = s.caseFile;
    if (!cf.voyages.v2 || !cf.voyages.v3 || !cf.voyages.v4) return err(state0, "case-three-states-required");
    var ok = choice === "accel-aft-steady-foot-decel-fore";
    cf.fingerprintAttempts.push({ choice: choice, ok: ok });
    if (!ok) return { state: s, ok: false, reason: "fingerprint-mismatch" };
    cf.fingerprintComplete = true;
    s.evidence.g3 = true;
    return { state: s, ok: true, evidence: "G3" };
  }
  function setCaseTransform(state0, progress0) {
    var s = ensureNewFields(clone(state0)), progress = Number(progress0);
    if (!s.caseFile.voyages.dual) return err(state0, "case-dual-required");
    if (!isFinite(progress)) return err(state0, "invalid-transform-progress");
    s.caseFile.transformProgress = Math.max(0, Math.min(1, progress));
    return {
      state: s, ok: true, progress: s.caseFile.transformProgress,
      transformed: s.caseFile.transformProgress >= 0.999
    };
  }
  function assertCaseDual(state0, choice) {
    var s = ensureNewFields(clone(state0)), cf = s.caseFile;
    if (!cf.voyages.dual || cf.transformProgress < 0.999) return err(state0, "case-transform-required");
    var ok = choice === "same-event-different-reference";
    cf.dualAttempts.push({ choice: choice, ok: ok });
    if (!ok) return { state: s, ok: false, reason: "dual-claim-mismatch" };
    cf.dualNamed = true;
    s.evidence.g4 = true;
    return { state: s, ok: true, evidence: "G4" };
  }
  function confirmCaseCriteria(state0) {
    var s = ensureNewFields(clone(state0));
    if (!s.caseFile.dualNamed) return err(state0, "case-dual-claim-required");
    s.caseFile.publicCriteriaConfirmed = true;
    return { state: s, ok: true };
  }
  function setCaseBoundary(state0, choice) {
    var s = ensureNewFields(clone(state0)), cf = s.caseFile;
    if (!cf.publicComplete) return err(state0, "case-public-required");
    if (choice !== "overclaim" && choice !== "honest") return err(state0, "unknown-boundary-choice");
    var ok = choice === "honest";
    cf.boundaryAttempts.push({ choice: choice, ok: ok });
    if (!ok) {
      s.audit.overclaimTried = true;
      return { state: s, ok: false, reason: "overclaim" };
    }
    cf.boundary = "honest";
    s.audit.boundary = true;
    s.evidence.g5 = true;
    return { state: s, ok: true, evidence: "G5" };
  }

  /* ---------- CH3 v0.7.1：自由實驗卷宗＋三柱碼頭辯論 ---------- */
  function dossierHasDual(d) {
    return d.records.some(function (r) { return r.dualPapers; });
  }
  function refreshDossierCandidates(d) {
    function ids(test) { return d.records.filter(test).map(function (r) { return r.id; }); }
    var hand = ids(function (r) { return r.release === "hand" && r.repeats >= 3; });
    var steady = ids(function (r) {
      return r.stage === "steady" && r.release === "latch" && r.speedRecord === "beats" &&
        r.repeats >= 3 && r.sameStone && r.sameHeight;
    });
    var depart = ids(function (r) {
      return r.stage === "depart" && r.release === "latch" && r.speedRecord === "beats" &&
        r.sameStone && r.sameHeight;
    });
    var brake = ids(function (r) {
      return r.stage === "brake" && r.release === "latch" && r.speedRecord === "beats" &&
        r.sameStone && r.sameHeight;
    });
    if (hand.length && !d.assertions.S1) d.candidates.S1 = { records: hand };
    if (steady.length && !d.assertions.A1) d.candidates.A1 = { records: steady };
    if (depart.length && d.assertions.A1 && !d.assertions.A3) d.candidates.A3 = { records: depart };
    if (brake.length && d.assertions.A1 && d.assertions.A3 && !d.assertions.S4)
      d.candidates.S4 = { records: steady.concat(depart, brake) };
    if (d.blind.ran && d.blind.judgment === "indistinguishable" && d.blind.unsealed && !d.assertions.A2)
      d.candidates.A2 = { records: ["blind-A", "blind-B"] };
  }
  function setDossierDraft(state0, field, value) {
    var s = ensureNewFields(clone(state0)), d = s.caseFile.dossier;
    if (field === "stage" && DOSSIER_STAGES.indexOf(value) >= 0) d.draft.stage = value;
    else if (field === "release" && DOSSIER_RELEASES.indexOf(value) >= 0) d.draft.release = value;
    else if (field === "speedRecord" && DOSSIER_SPEED_RECORDS.indexOf(value) >= 0) d.draft.speedRecord = value;
    else if (field === "positionRecord" && DOSSIER_POSITION_RECORDS.indexOf(value) >= 0) d.draft.positionRecord = value;
    else if (field === "repeats" && DOSSIER_REPEATS.indexOf(Number(value)) >= 0) d.draft.repeats = Number(value);
    else if ((field === "sameStone" || field === "sameHeight") && typeof value === "boolean") d.draft[field] = value;
    else return err(state0, "unknown-dossier-setting");
    return { state: s, ok: true, draft: clone(d.draft) };
  }
  function copyDossierRecord(state0, recordId) {
    var s = ensureNewFields(clone(state0)), d = s.caseFile.dossier;
    var row = d.records.find(function (r) { return r.id === Number(recordId); });
    if (!row) return err(state0, "unknown-dossier-record");
    ["stage", "release", "speedRecord", "positionRecord", "repeats", "sameStone", "sameHeight"].forEach(function (key) {
      d.draft[key] = row[key];
    });
    d.page = "lab";
    return { state: s, ok: true, draft: clone(d.draft) };
  }
  function runDossierExperiment(state0) {
    var s = ensureNewFields(clone(state0)), d = s.caseFile.dossier, draft = clone(d.draft);
    var fixture = DOSSIER_FIXTURES[draft.stage];
    if (!fixture) return err(state0, "unknown-dossier-stage");
    var offsets = draft.release === "hand" ? [-0.31, 0.27, -0.16] : fixture.offsets.slice();
    offsets = offsets.slice(0, draft.repeats);
    var row = {
      id: d.nextRecordId++, stage: draft.stage, release: draft.release,
      speedRecord: draft.speedRecord, positionRecord: draft.positionRecord,
      repeats: draft.repeats, sameStone: draft.sameStone, sameHeight: draft.sameHeight,
      classification: draft.speedRecord === "beats" ? fixture.classification : "未分類",
      vessel: draft.speedRecord === "beats" ? fixture.vessel : "unclassified",
      offsets: offsets, shoreGaps: draft.speedRecord === "beats" ? fixture.shoreGaps.slice() : null,
      landing: draft.release === "hand" ? "spread" : fixture.landing,
      dualPapers: draft.positionRecord === "dual" && draft.release === "latch" && draft.speedRecord === "beats"
    };
    d.records.push(row);
    /* 舊視覺載體同步保存，不讓新規則另造一套錯誤物理圖。 */
    var visualStage = draft.stage === "steady" || draft.stage === "dock" ? "v3" :
      (draft.stage === "depart" ? "v2" : "v4");
    s.caseFile.voyages[visualStage] = {
      stage: visualStage,
      vessel: row.vessel, repeats: row.repeats, offsets: row.offsets.slice(),
      shoreGaps: row.shoreGaps ? row.shoreGaps.slice() : null,
      landing: row.landing === "spread" ? "foot" : row.landing
    };
    if (row.dualPapers) {
      s.caseFile.voyages.dual = clone(CASE_RUNS.dual);
      s.caseFile.voyages.dual.stage = "dual";
    }
    refreshDossierCandidates(d);
    s.days += 1;
    return { state: s, ok: true, record: clone(row), candidates: clone(d.candidates) };
  }
  function setDossierScope(state0, assertionId, choice) {
    var s = ensureNewFields(clone(state0)), d = s.caseFile.dossier;
    refreshDossierCandidates(d);
    if (!d.candidates[assertionId]) return err(state0, "dossier-candidate-required");
    var correct = {
      S1: "sample-only", A1: "controlled-three", A2: "local-only",
      A3: "today-comparison", S4: "today-three-states"
    }[assertionId];
    if (!correct) return err(state0, "unknown-dossier-assertion");
    var ok = choice === correct;
    d.scopeAttempts.push({ assertion: assertionId, choice: choice, ok: ok });
    if (!ok) return { state: s, ok: false, reason: "dossier-scope-overread" };
    d.assertions[assertionId] = true;
    delete d.candidates[assertionId];
    refreshDossierCandidates(d);
    if (assertionId === "A1") s.evidence.g1 = true;
    if (assertionId === "A2") s.evidence.g2 = true;
    if (assertionId === "A3" || assertionId === "S4") s.evidence.g3 = true;
    return { state: s, ok: true, assertion: assertionId };
  }
  function runDossierBlind(state0) {
    var s = ensureNewFields(clone(state0)), d = s.caseFile.dossier;
    d.blind.ran = true;
    d.blind.judgment = null;
    d.blind.unsealed = false;
    d.blind.scope = false;
    s.caseFile.voyages.cabin = clone(CASE_RUNS.cabin);
    s.caseFile.voyages.cabin.stage = "cabin";
    s.days += 1;
    return { state: s, ok: true, traces: clone(CASE_RUNS.cabin.traces) };
  }
  function judgeDossierBlind(state0, choice) {
    var s = ensureNewFields(clone(state0)), d = s.caseFile.dossier;
    if (!d.blind.ran) return err(state0, "dossier-blind-required");
    var ok = choice === "indistinguishable";
    d.blind.attempts.push({ kind: "judgment", choice: choice, ok: ok });
    if (!ok) return { state: s, ok: false, reason: "local-traces-overread" };
    d.blind.judgment = choice;
    d.blind.unsealed = true;
    refreshDossierCandidates(d);
    return { state: s, ok: true, unsealed: true };
  }
  function dossierExperimentalAssertion(d) {
    return ["A1", "A2", "A3", "S1", "S4"].some(function (id) { return d.assertions[id]; });
  }
  function enterDossierDebate(state0) {
    var s = ensureNewFields(clone(state0)), d = s.caseFile.dossier;
    if (!dossierExperimentalAssertion(d)) return err(state0, "dossier-assertion-required");
    d.page = "debate";
    d.debate.active = true;
    d.debate.current = null;
    if (d.debate.rep <= 0) d.debate.rep = 5;
    d.debate.lastReply = "艦長：「先挑一個說法。你帶來的紙，得回答我正在問的那一件事。」";
    return { state: s, ok: true };
  }
  function leaveDossierDebate(state0, pin) {
    var s = ensureNewFields(clone(state0)), d = s.caseFile.dossier;
    if (pin && d.debate.pins.indexOf(pin) < 0) d.debate.pins.push(pin);
    d.debate.active = false;
    d.debate.current = null;
    d.page = "lab";
    d.debate.lastReply = "艦長：「知道缺哪張紙，比拿錯紙硬撐有用。去吧。」";
    return { state: s, ok: true };
  }
  function selectDossierPillar(state0, pillar) {
    var s = ensureNewFields(clone(state0)), d = s.caseFile.dossier;
    if (["p1", "p2", "p3"].indexOf(pillar) < 0) return err(state0, "unknown-dossier-pillar");
    if (d.debate.pillars[pillar]) return err(state0, "dossier-pillar-complete");
    d.page = "debate";
    d.debate.active = true;
    d.debate.current = pillar;
    if (pillar === "p2" && d.assertions.S4) d.debate.p2.question = true;
    d.debate.lastReply = {
      p1: "艦長：「船往前，石頭往下。沒有東西推它，它當然落在後面。」",
      p2: "艦長：（按住舊紙）「我看見的落後是真的。你憑什麼說它不能代表所有船？」",
      p3: "艦長：（分開兩張紙）「岸上畫彎，船上畫直。同一顆石頭，不可能走兩條路。」"
    }[pillar];
    return { state: s, ok: true, pillar: pillar };
  }
  function dossierFailDebate(s, pillar, step, choice, reason, reply) {
    var d = s.caseFile.dossier, db = d.debate;
    db.attempts.push({ pillar: pillar, step: step, choice: choice, ok: false, reason: reason });
    db.rep = Math.max(0, db.rep - 1);
    db.lastReply = reply;
    if (db.rep === 0) {
      var pin = "先看「" + step + "」缺的是哪一欄";
      if (db.pins.indexOf(pin) < 0) db.pins.push(pin);
      db.active = false;
      db.current = null;
      d.page = "lab";
    }
    return { state: s, ok: false, reason: reason, rep: db.rep, withdrew: db.rep === 0 };
  }
  function dossierMissing(s, id, reply) {
    var d = s.caseFile.dossier;
    if (d.debate.pins.indexOf(id) < 0) d.debate.pins.push(id);
    d.debate.lastReply = reply;
    return { state: s, ok: false, reason: "dossier-evidence-missing", missing: id, rep: d.debate.rep };
  }
  function answerDossierDebate(state0, pillar, step, choice) {
    var s = ensureNewFields(clone(state0)), d = s.caseFile.dossier, db = d.debate;
    if (!db.active || db.current !== pillar) return err(state0, "dossier-debate-not-active");
    if (pillar === "p1") {
      if (step === "concept") {
        if (choice !== "shared-motion") return dossierFailDebate(s, pillar, step, choice, "concept-mismatch",
          "艦長：「你又添了一股推力。我問的是：鬆手那一刻，原先的前行去了哪裡？」");
        db.p1.concept = true;
        db.lastReply = "艦長：「一句話不算數。把走穩那組拿來。」";
      } else if (step === "steady") {
        if (!d.assertions.A1) return dossierMissing(s, "需要 A1：三回乾淨走穩紀錄",
          "艦長：「一回、手放或沒記船速，都不能替『走穩』作證。」");
        if (choice !== "A1") return dossierFailDebate(s, pillar, step, choice, "evidence-mismatch",
          "商人：「那張紙回答的不是走穩時落在哪裡。」");
        db.p1.steady = true;
        db.lastReply = "槳手：「甲板上有風。你怎麼知道不是風把石頭推回桅腳？」";
      } else if (step === "cabin") {
        if (!d.assertions.A2) return dossierMissing(s, "風把石頭推回桅腳了嗎？",
          "槳手：「你還沒有一筆完全關掉甲板風的對照。」");
        if (choice !== "A2") return dossierFailDebate(s, pillar, step, choice, "evidence-mismatch",
          "槳手：「那張紙沒有關掉甲板風。」");
        db.p1.cabin = true;
        db.lastReply = "艦長：「所以就算沒有風，它也不會被留在後面。」";
      } else if (step === "wind") {
        if (choice !== "limited-wind") return dossierFailDebate(s, pillar, step, choice, "overclaim",
          "槳手：「船艙只能證明沒有風也能發生，不能替甲板上的風判無罪。」");
        db.p1.wind = true;
        db.pillars.p1 = true;
        db.current = null;
        db.lastReply = "槳手：「……那我這個問題，算問完了。」";
      } else return err(state0, "unknown-dossier-debate-step");
    } else if (pillar === "p2") {
      if (step === "question") {
        if (choice !== "speed-change") return dossierFailDebate(s, pillar, step, choice, "question-mismatch",
          "艦長：（指落點）「落後我已經寫了。缺的是那時船怎麼走。」");
        db.p2.question = true;
        db.lastReply = "艦長：「沒有記。那又怎樣？」";
      } else if (step === "concept") {
        if (choice !== "motion-vs-change") return dossierFailDebate(s, pillar, step, choice, "concept-mismatch",
          "艦長：「正在往前，和往前的速度正在改，不是一句話。」");
        db.p2.concept = true;
        db.lastReply = "艦長：「把今天的三張紙放進各自的位置。」";
      } else if (step === "steady") {
        if (!d.assertions.A1) return dossierMissing(s, "需要 A1：走穩對照",
          "艦長：「你給了我一艘變快的船，還沒有一艘走穩的船。」");
        if (choice !== "steady") return dossierFailDebate(s, pillar, step, choice, "classification-mismatch",
          "艾蒂安：「岸標間距近乎一樣，這張才是走穩。」");
        db.p2.steady = true;
      } else if (step === "depart") {
        if (!d.assertions.A3) return dossierMissing(s, "需要 A3：解纜起步完整紀錄",
          "艦長：「你還沒拿出一筆當趟證明『正在變快』的後偏。」");
        if (choice !== "accelerating") return dossierFailDebate(s, pillar, step, choice, "classification-mismatch",
          "艾蒂安：「岸標間距逐拍拉開。這張記的是正在變快。」");
        db.p2.depart = true;
      } else if (step === "old") {
        if (!d.assertions.A6) return dossierMissing(s, "需要 A6：先說清舊紙射程",
          "艦長：「先別替舊紙補字。它只有落點。」");
        if (choice !== "unclassified") return dossierFailDebate(s, pillar, step, choice, "old-paper-overread",
          "馬蒂厄：（指空欄）「這裡沒有人記船速。今天不能替八年前補上。」");
        db.p2.old = true;
      } else if (step === "boundary") {
        if (choice !== "same-pattern-not-proof") return dossierFailDebate(s, pillar, step, choice, "old-paper-overread",
          "艦長：「相像不是證明。我的舊紙沒有當趟船速。」");
        db.p2.boundary = true;
        db.pillars.p2 = true;
        db.current = null;
        db.lastReply = "艦長：「我看見落後沒有錯。錯的是讓一個空欄替所有船況說話。」";
      } else return err(state0, "unknown-dossier-debate-step");
    } else return err(state0, "dossier-p3-uses-paper-actions");
    db.attempts.push({ pillar: pillar, step: step, choice: choice, ok: true });
    return { state: s, ok: true, pillarComplete: !!db.pillars[pillar], rep: db.rep };
  }
  function alignDossierPapers(state0, choice) {
    var s = ensureNewFields(clone(state0)), d = s.caseFile.dossier, p3 = d.debate.p3;
    if (!d.debate.active || d.debate.current !== "p3") return err(state0, "dossier-debate-not-active");
    if (!dossierHasDual(d)) return dossierMissing(s, "需要同一事件的岸上紙與船上紙",
      "艾蒂安：「你還沒有一組同時從岸上與船上記下的原紙。」");
    if (!p3.question || !p3.concept) return err(state0, "dossier-p3-premise-required");
    var ok = choice === "same-beats";
    var repeatedWrong = !ok && p3.alignAttempts.some(function (a) { return a.choice === choice && !a.ok; });
    p3.alignAttempts.push({ choice: choice, ok: ok });
    if (!ok) {
      if (repeatedWrong) d.debate.rep = Math.max(0, d.debate.rep - 1);
      d.debate.lastReply = choice === "endpoints"
        ? "艦長：「你把不同時刻的終點硬疊在一起了。中間鼓號全錯位。」"
        : "艦長：「同一高度不是同一時刻。先找兩張紙共用的鐘。」";
      if (d.debate.rep === 0) { d.debate.active = false; d.debate.current = null; d.page = "lab"; }
      return { state: s, ok: false, reason: "beats-mismatch", rep: d.debate.rep };
    }
    p3.aligned = true;
    d.assertions.A4 = true;
    s.overlay.aligned = true;
    s.overlay.preview = "sameBeats";
    d.debate.lastReply = "艦長：「鼓號已經對上了。剩下換尺。」";
    return { state: s, ok: true, assertion: "A4" };
  }
  function transformDossierPapers(state0, choice) {
    var s = ensureNewFields(clone(state0)), d = s.caseFile.dossier, p3 = d.debate.p3;
    if (!d.debate.active || d.debate.current !== "p3" || !p3.aligned)
      return err(state0, "dossier-alignment-required");
    var ok = choice === "subtract-each-beat";
    var repeatedWrong = !ok && p3.transformAttempts.some(function (a) { return a.choice === choice && !a.ok; });
    p3.transformAttempts.push({ choice: choice, ok: ok });
    if (!ok) {
      if (repeatedWrong) d.debate.rep = Math.max(0, d.debate.rep - 1);
      d.debate.lastReply = choice === "translate-once"
        ? "艦長：「只搬一次，後面的桅杆仍然離開零點。你的尺沒有跟著走。」"
        : "商人：「把紙轉直，只會連鼓點順序和距離一起扭壞。」";
      if (d.debate.rep === 0) { d.debate.active = false; d.debate.current = null; d.page = "lab"; }
      return { state: s, ok: false, reason: "wrong-transform", rep: d.debate.rep };
    }
    p3.transformed = true;
    d.assertions.A5 = true;
    d.debate.pillars.p3 = true;
    d.debate.current = null;
    s.overlay.transformed = true;
    s.overlay.preview = "subtractMast";
    s.caseFile.transformProgress = 1;
    s.evidence.g4 = true;
    d.debate.lastReply = "艦長：「不是兩條路。是同一條路，從兩個地方量。」";
    return { state: s, ok: true, assertion: "A5", pillarComplete: true };
  }
  function setDossierP3Premise(state0, step, choice) {
    var s = ensureNewFields(clone(state0)), d = s.caseFile.dossier, p3 = d.debate.p3;
    if (!d.debate.active || d.debate.current !== "p3") return err(state0, "dossier-debate-not-active");
    var correct = step === "question" ? "same-time-transform" : (step === "concept" ? "reference" : null);
    if (!correct) return err(state0, "unknown-dossier-p3-step");
    if (choice !== correct) return dossierFailDebate(s, "p3", step, choice, "p3-premise-mismatch",
      step === "question"
        ? "艦長：「別先挑誰可靠。先證明兩張紙記的是同一時刻。」"
        : "商人：「改紙的角度不會改變你站在哪裡量。」");
    p3[step] = true;
    d.debate.lastReply = step === "question"
      ? "艦長：「那就說清楚：兩張紙改的是什麼？」"
      : "商人：「好。現在當著我們的面，把它們對上。」";
    return { state: s, ok: true };
  }
  function setDossierFinalBoundary(state0, choice) {
    var s = ensureNewFields(clone(state0)), d = s.caseFile.dossier, db = d.debate;
    if (!(db.pillars.p1 && db.pillars.p2 && db.pillars.p3)) return err(state0, "dossier-pillars-required");
    if (choice !== "honest" && choice !== "overclaim" && choice !== "all-motion-hidden")
      return err(state0, "unknown-boundary-choice");
    if (choice !== "honest") {
      db.lastReply = choice === "overclaim"
        ? "伽桑狄：「停。我們沒有量地球。」"
        : "艦長：「加速與減速都在船上，明明分得出來。」";
      db.attempts.push({ pillar: "final", step: "boundary", choice: choice, ok: false });
      return { state: s, ok: false, reason: "overclaim" };
    }
    db.boundary = "honest";
    d.complete = true;
    s.audit.boundary = true;
    s.evidence.g5 = true;
    s.publicDemo.complete = true;
    db.lastReply = "艦長：「那就讓他們記得真的。」";
    return { state: s, ok: true, evidence: "G5", complete: true };
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
    initialState: initialState, migrateLabState: migrateLabState,
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
    runCaseVoyage: runCaseVoyage, confirmCaseCrew: confirmCaseCrew,
    interpretCaseWind: interpretCaseWind, judgeCaseCabin: judgeCaseCabin,
    setCasePrediction: setCasePrediction, assertCaseFingerprint: assertCaseFingerprint,
    setCaseTransform: setCaseTransform, assertCaseDual: assertCaseDual,
    confirmCaseCriteria: confirmCaseCriteria, setCaseBoundary: setCaseBoundary,
    setDossierDraft: setDossierDraft, copyDossierRecord: copyDossierRecord,
    runDossierExperiment: runDossierExperiment, setDossierScope: setDossierScope,
    runDossierBlind: runDossierBlind, judgeDossierBlind: judgeDossierBlind,
    enterDossierDebate: enterDossierDebate, leaveDossierDebate: leaveDossierDebate,
    selectDossierPillar: selectDossierPillar, answerDossierDebate: answerDossierDebate,
    setDossierP3Premise: setDossierP3Premise, alignDossierPapers: alignDossierPapers,
    transformDossierPapers: transformDossierPapers, setDossierFinalBoundary: setDossierFinalBoundary,
    answerAudit: answerAudit, setBoundary: setBoundary,
    baselineReady: baselineReady,
    _FIXTURE: {
      baseline: BASE, mast: MAST, cabin: CABIN, paper: PAPER,
      pilot: PILOT, wind: WIND_RUNS, publicRecords: PUBLIC_RECORDS,
      caseRuns: CASE_RUNS, dossier: DOSSIER_FIXTURES
    },
    _AUDIT: AUDIT, _PUBLIC_STEPS: PUBLIC_STEPS.slice()
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.GB = root.GB || {}; root.GB.Engine3 = api;
})(typeof window !== "undefined" ? window : globalThis);
