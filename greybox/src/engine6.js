/* src/engine6.js — 第六章《熱從哪裡來？》來源追債引擎。
   純函式、零 DOM、零 RNG；法源：第六章功能規格 v0.1、GB-ADR-042。 */
(function (root) {
  "use strict";

  var SOURCES = ["chips", "cannon", "air", "water"];
  var BANDS = ["soon", "within-shift", "no-endpoint"];
  var VERDICTS = ["fulfilled", "not-fulfilled", "insufficient"];
  var FRICTION = ["rotation-only", "pressure-only", "contact-motion"];
  var JOINT_COLUMNS = ["operation", "readings", "caloric", "motion"];
  var JOINT_VALUES = {
    operation: "stang-operation",
    readings: "kessler-readings",
    caloric: "kessler-caloric-boundary",
    motion: "rumford-personal-interpretation"
  };

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function fail(state0, error, extra) {
    var out = { state: state0, error: error };
    if (extra) Object.keys(extra).forEach(function (key) { out[key] = extra[key]; });
    return out;
  }
  function has(list, value) { return list.indexOf(value) >= 0; }
  function allSources(obj, predicate) {
    return SOURCES.every(function (source) { return predicate(obj[source], source); });
  }
  function addRecord(state, kind, fields) {
    var row = Object.assign({ id: ++state.recordSeq, kind: kind, day: state.days }, fields || {});
    state.records.push(row);
    return row;
  }
  function grant(state, key) {
    if (state.evidence[key]) return false;
    state.evidence[key] = true;
    return true;
  }

  function initialState() {
    return {
      phase: "source-ledger",
      days: 0,
      recordSeq: 0,
      records: [],
      sourceLedger: {
        placements: { chips: null, cannon: null, air: null, water: null },
        consequences: { chips: null, cannon: null, air: null, water: null },
        modelPredictions: { caloric: null, motion: null },
        sealed: false
      },
      chipBench: {
        draft: { chipMass: 4, plateMass: 4, chipTemp: 60, plateTemp: 60, waterA: 8, waterB: 8, waterTempA: 18, waterTempB: 18 },
        attempts: [], cleanRecordIds: [], judged: false
      },
      frictionBench: { sealed: {}, recordIds: [], judged: false },
      dryBench: {
        draft: { horsePace: "steady", pressure: "fixed", sampling: "sixteen-beats" },
        attempts: [], cleanRecordId: null, judged: false
      },
      airBench: { prediction: null, sealed: false, attempts: [], cleanRecordIds: [], judged: false },
      waterBench: { draft: { water: 18, sealed: false, leakChecked: false, sampling: false }, attempts: [], ready: false },
      finiteSources: {
        bands: { chips: null, cannon: null, air: null, water: null },
        sealed: false,
        sealState: { chips: "intact", cannon: "intact", air: "intact", water: "intact" },
        verdicts: { chips: null, cannon: null, air: null, water: null },
        complete: false
      },
      continuousRun: { segments: [], complete: false, reachedBoiling: false },
      auditBoard: { placements: {}, latentDisposition: null, complete: false },
      jointPage: {
        columns: { operation: null, readings: null, caloric: null, motion: null },
        scopeDebt: null,
        rateDebt: null,
        signedBy: { stang: false, kessler: false, rumford: false, traveler: false },
        complete: false
      },
      evidence: { s8: false, t1: false, t2: false, t3: false, t4: false, t5: false }
    };
  }

  function setSourceLedger(state0, args) {
    args = args || {};
    if (!has(SOURCES, args.source)) return fail(state0, "unknown-source");
    if (state0.sourceLedger.sealed) return fail(state0, "source-ledger-sealed");
    if (typeof args.position !== "string" || !args.position || typeof args.consequence !== "string" || !args.consequence)
      return fail(state0, "source-ledger-entry-incomplete");
    var state = clone(state0);
    state.sourceLedger.placements[args.source] = args.position;
    state.sourceLedger.consequences[args.source] = args.consequence;
    return { state: state, ok: true };
  }

  function sealModels(state0, args) {
    args = args || {};
    if (state0.sourceLedger.sealed) return fail(state0, "source-ledger-sealed");
    if (!allSources(state0.sourceLedger.placements, function (value) { return typeof value === "string" && !!value; }) ||
        !allSources(state0.sourceLedger.consequences, function (value) { return typeof value === "string" && !!value; }))
      return fail(state0, "four-sources-required");
    if (typeof args.caloric !== "string" || !args.caloric || typeof args.motion !== "string" || !args.motion)
      return fail(state0, "two-model-predictions-required");
    var state = clone(state0);
    state.sourceLedger.modelPredictions.caloric = args.caloric;
    state.sourceLedger.modelPredictions.motion = args.motion;
    state.sourceLedger.sealed = true;
    state.phase = "chips";
    return { state: state, ok: true };
  }

  function setChipDraft(state0, args) {
    args = args || {};
    var allowed = ["chipMass", "plateMass", "chipTemp", "plateTemp", "waterA", "waterB", "waterTempA", "waterTempB"];
    if (!has(allowed, args.field) || typeof args.value !== "number" || !isFinite(args.value))
      return fail(state0, "unknown-chip-setting");
    var state = clone(state0);
    state.chipBench.draft[args.field] = args.value;
    return { state: state, ok: true };
  }

  function runChipComparison(state0) {
    if (!state0.sourceLedger.sealed) return fail(state0, "source-ledger-required");
    var state = clone(state0), draft = state.chipBench.draft;
    var clean = draft.chipMass === draft.plateMass && draft.chipTemp === draft.plateTemp &&
      draft.waterA === draft.waterB && draft.waterTempA === draft.waterTempB;
    state.days += 1;
    var row = addRecord(state, "chip-comparison", {
      clean: clean, conditions: clone(draft),
      chipCurve: [draft.waterTempA, 26, 31, 34],
      plateCurve: [draft.waterTempB, 25.8, 30.9, 34.1]
    });
    state.chipBench.attempts.push(row.id);
    if (clean) state.chipBench.cleanRecordIds.push(row.id);
    return { state: state, ok: true, record: clone(row), clean: clean };
  }

  function judgeChipComparison(state0, args) {
    args = args || {};
    if (!state0.chipBench.cleanRecordIds.length) return fail(state0, "clean-chip-comparison-required");
    if (args.concept !== "chips-not-lower-capacity") return fail(state0, "chip-judgment-mismatch");
    var state = clone(state0);
    state.chipBench.judged = true;
    state.phase = "friction";
    return { state: state, ok: true, evidence: grant(state, "t1") ? "T1" : null };
  }

  function runFrictionCondition(state0, args) {
    args = args || {};
    if (!state0.evidence.t1) return fail(state0, "t1-required");
    if (!has(FRICTION, args.condition)) return fail(state0, "unknown-friction-condition");
    if (state0.frictionBench.sealed[args.condition]) return fail(state0, "friction-condition-already-run");
    var state = clone(state0);
    var curves = {
      "rotation-only": [18, 18.1, 18, 18.1],
      "pressure-only": [18, 18.2, 18.2, 18.3],
      "contact-motion": [18, 23, 29, 36]
    };
    state.days += 1;
    var row = addRecord(state, "friction-condition", { condition: args.condition, curve: curves[args.condition] });
    state.frictionBench.sealed[args.condition] = true;
    state.frictionBench.recordIds.push(row.id);
    return { state: state, ok: true, record: clone(row) };
  }

  function judgeFrictionConditions(state0, args) {
    args = args || {};
    if (!FRICTION.every(function (condition) { return !!state0.frictionBench.sealed[condition]; }))
      return fail(state0, "three-friction-conditions-required");
    if (args.concept !== "contact-and-motion") return fail(state0, "friction-judgment-mismatch");
    var state = clone(state0);
    state.frictionBench.judged = true;
    state.phase = "dry";
    return { state: state, ok: true, evidence: grant(state, "t2") ? "T2" : null };
  }

  function setDryDraft(state0, args) {
    args = args || {};
    var allowed = {
      horsePace: ["steady", "changed"], pressure: ["fixed", "changed"],
      sampling: ["sixteen-beats", "missed"]
    };
    if (!allowed[args.field] || !has(allowed[args.field], args.value)) return fail(state0, "unknown-dry-setting");
    var state = clone(state0);
    state.dryBench.draft[args.field] = args.value;
    return { state: state, ok: true };
  }

  function runDryStrip(state0) {
    if (!state0.evidence.t2) return fail(state0, "t2-required");
    var state = clone(state0), draft = state.dryBench.draft;
    var clean = draft.horsePace === "steady" && draft.pressure === "fixed" && draft.sampling === "sixteen-beats";
    state.days += 1;
    var row = addRecord(state, "dry-strip", {
      clean: clean, conditions: clone(draft),
      curve: clean ? [18, 24, 31, 39, 48] : [18, 25, null, 28, 41],
      gaps: clean ? [] : ["conditions-changed"]
    });
    state.dryBench.attempts.push(row.id);
    if (clean) state.dryBench.cleanRecordId = row.id;
    return { state: state, ok: true, record: clone(row), clean: clean };
  }

  function judgeDryStrip(state0, args) {
    args = args || {};
    if (!state0.dryBench.cleanRecordId) return fail(state0, "clean-dry-strip-required");
    if (args.concept !== "observed-range-only") return fail(state0, "dry-judgment-mismatch");
    var state = clone(state0);
    state.dryBench.judged = true;
    state.phase = "air";
    return { state: state, ok: true };
  }

  function sealAirPrediction(state0, args) {
    args = args || {};
    if (!state0.dryBench.judged) return fail(state0, "dry-judgment-required");
    if (state0.airBench.sealed) return fail(state0, "air-prediction-sealed");
    if (!has(["slower-when-sealed", "any-change", "faster-when-sealed"], args.prediction))
      return fail(state0, "unknown-air-prediction");
    var state = clone(state0);
    state.airBench.prediction = args.prediction;
    state.airBench.sealed = true;
    return { state: state, ok: true };
  }

  function runAirComparison(state0, args) {
    args = args || {};
    if (!state0.airBench.sealed) return fail(state0, "air-prediction-required");
    if (!has(["open", "sealed"], args.condition)) return fail(state0, "unknown-air-condition");
    if (state0.airBench.attempts.some(function (id) {
      return state0.records.some(function (row) { return row.id === id && row.condition === args.condition && row.clean; });
    })) return fail(state0, "air-condition-already-run");
    var state = clone(state0);
    state.days += 1;
    var clean = args.clean !== false;
    var row = addRecord(state, "air-comparison", {
      condition: args.condition, clean: clean,
      curve: args.condition === "open" ? [18, 25, 33, 42] : [18, 25.1, 33.2, 42.1]
    });
    state.airBench.attempts.push(row.id);
    if (clean) state.airBench.cleanRecordIds.push(row.id);
    return { state: state, ok: true, record: clone(row), clean: clean };
  }

  function judgeAirComparison(state0, args) {
    args = args || {};
    var rows = state0.records.filter(function (row) {
      return row.kind === "air-comparison" && row.clean && has(state0.airBench.cleanRecordIds, row.id);
    });
    if (!rows.some(function (row) { return row.condition === "open"; }) ||
        !rows.some(function (row) { return row.condition === "sealed"; }))
      return fail(state0, "open-and-sealed-required");
    if (args.concept !== "air-not-necessary") return fail(state0, "air-judgment-mismatch");
    var state = clone(state0);
    state.airBench.judged = true;
    state.phase = "water";
    return { state: state, ok: true, evidence: grant(state, "t3") ? "T3" : null };
  }

  function setWaterDraft(state0, args) {
    args = args || {};
    var allowed = { water: "number", sealed: "boolean", leakChecked: "boolean", sampling: "boolean" };
    if (!allowed[args.field] || typeof args.value !== allowed[args.field]) return fail(state0, "unknown-water-setting");
    if (typeof args.value === "number" && (!isFinite(args.value) || args.value <= 0)) return fail(state0, "invalid-water-value");
    var state = clone(state0);
    state.waterBench.draft[args.field] = args.value;
    return { state: state, ok: true };
  }

  function prepareWaterBox(state0) {
    if (!state0.evidence.t3) return fail(state0, "t3-required");
    var draft = state0.waterBench.draft;
    if (!(draft.water === 18 && draft.sealed && draft.leakChecked && draft.sampling))
      return fail(state0, "water-box-not-ready");
    var state = clone(state0);
    state.days += 1;
    var row = addRecord(state, "water-box-preparation", { conditions: clone(draft), clean: true });
    state.waterBench.attempts.push(row.id);
    state.waterBench.ready = true;
    state.phase = "finite-predictions";
    return { state: state, ok: true, record: clone(row) };
  }

  function setFinitePrediction(state0, args) {
    args = args || {};
    if (!state0.waterBench.ready) return fail(state0, "water-box-required");
    if (state0.finiteSources.sealed) return fail(state0, "finite-predictions-sealed");
    if (!has(SOURCES, args.source)) return fail(state0, "unknown-source");
    if (!has(BANDS, args.band)) return fail(state0, "unknown-prediction-band");
    var state = clone(state0);
    state.finiteSources.bands[args.source] = args.band;
    return { state: state, ok: true };
  }

  function sealFinitePredictions(state0) {
    if (state0.finiteSources.sealed) return fail(state0, "finite-predictions-sealed");
    if (!allSources(state0.finiteSources.bands, function (band) { return has(BANDS, band); }))
      return fail(state0, "four-prediction-bands-required");
    var state = clone(state0);
    state.finiteSources.sealed = true;
    state.phase = "continuous-run";
    return { state: state, ok: true };
  }

  function runContinuousSegment(state0, args) {
    args = args || {};
    /* R-CH6-01：實驗鍵本身 fail closed，不依賴 UI 是否顯示。 */
    if (!state0.finiteSources.sealed) return fail(state0, "finite-predictions-required");
    if (state0.continuousRun.complete) return fail(state0, "continuous-run-complete");
    if (!has(["continue", "calibrate", "repair-leak"], args.action)) return fail(state0, "unknown-run-action");
    var state = clone(state0);
    var index = state.continuousRun.segments.length;
    var temperatures = [31, 47, 65, 83, 96, 100];
    state.days += 1;
    var row = addRecord(state, "continuous-segment", {
      segment: index + 1, action: args.action, minutes: (index + 1) * 30,
      temperature: temperatures[index], horsePace: "steady", pressure: "fixed",
      leak: args.action === "repair-leak" ? "repaired" : "none"
    });
    state.continuousRun.segments.push(row.id);
    if (state.continuousRun.segments.length >= temperatures.length) {
      state.continuousRun.complete = true;
      state.continuousRun.reachedBoiling = true;
      state.phase = "finite-verdict";
    }
    return { state: state, ok: true, record: clone(row), complete: state.continuousRun.complete };
  }

  function judgeFiniteSource(state0, args) {
    args = args || {};
    if (!state0.finiteSources.sealed) return fail(state0, "finite-predictions-required");
    if (!state0.continuousRun.complete) return fail(state0, "long-run-required");
    if (!has(SOURCES, args.source)) return fail(state0, "unknown-source");
    if (!has(VERDICTS, args.verdict)) return fail(state0, "unknown-source-verdict");
    if (state0.finiteSources.verdicts[args.source]) return fail(state0, "source-already-judged");
    if (args.verdict !== "not-fulfilled") return fail(state0, "source-verdict-mismatch");
    var state = clone(state0);
    state.finiteSources.verdicts[args.source] = args.verdict;
    /* 封條裂而不消失：只有玩家提交判讀才可轉態。 */
    state.finiteSources.sealState[args.source] = "cracked";
    state.finiteSources.complete = allSources(state.finiteSources.verdicts, function (verdict) {
      return verdict === "not-fulfilled";
    });
    var evidence = null;
    if (state.finiteSources.complete) {
      evidence = grant(state, "t4") ? "T4" : null;
      state.phase = "audit";
    }
    return { state: state, ok: true, evidence: evidence, complete: state.finiteSources.complete };
  }

  function placeAuditEvidence(state0, args) {
    args = args || {};
    if (!state0.evidence.t4) return fail(state0, "t4-required");
    var allowed = { chips: ["T1"], air: ["T3"], cannon: ["T4"], water: ["T4"], condition: ["T2"] };
    if (!allowed[args.slot] || !has(allowed[args.slot], args.evidence)) return fail(state0, "audit-placement-mismatch");
    var state = clone(state0);
    state.auditBoard.placements[args.slot] = args.evidence;
    return { state: state, ok: true };
  }

  function setLatentDisposition(state0, args) {
    args = args || {};
    if (!has(["motion-unresolved", "discard-caloric", "proves-motion"], args.disposition))
      return fail(state0, "unknown-latent-disposition");
    if (args.disposition !== "motion-unresolved") return fail(state0, "latent-disposition-mismatch");
    var state = clone(state0);
    state.auditBoard.latentDisposition = args.disposition;
    return { state: state, ok: true };
  }

  function completeAudit(state0) {
    var required = { chips: "T1", air: "T3", cannon: "T4", water: "T4", condition: "T2" };
    if (!Object.keys(required).every(function (slot) { return state0.auditBoard.placements[slot] === required[slot]; }) ||
        state0.auditBoard.latentDisposition !== "motion-unresolved")
      return fail(state0, "audit-board-incomplete");
    var state = clone(state0);
    state.auditBoard.complete = true;
    state.phase = "joint-page";
    return { state: state, ok: true };
  }

  function setJointColumn(state0, args) {
    args = args || {};
    if (!state0.auditBoard.complete) return fail(state0, "audit-required");
    if (!has(JOINT_COLUMNS, args.column) || args.text !== JOINT_VALUES[args.column])
      return fail(state0, "unknown-joint-column");
    if (state0.jointPage.complete) return fail(state0, "joint-page-complete");
    var state = clone(state0);
    state.jointPage.columns[args.column] = args.text;
    return { state: state, ok: true };
  }

  function writeScopeDebt(state0, args) {
    args = args || {};
    if (!state0.auditBoard.complete) return fail(state0, "audit-required");
    if (args.debt !== "scope-unresolved") return fail(state0, "scope-debt-mismatch");
    var state = clone(state0);
    state.jointPage.scopeDebt = args.debt;
    return { state: state, ok: true };
  }

  function prepareJointPage(state0) {
    if (!state0.auditBoard.complete) return fail(state0, "audit-required");
    if (!JOINT_COLUMNS.every(function (key) { return state0.jointPage.columns[key] === JOINT_VALUES[key]; }) ||
        state0.jointPage.scopeDebt !== "scope-unresolved")
      return fail(state0, "joint-page-draft-incomplete");
    /* R-CH6-03：此 action 只確認暫稿；旅人不簽名、不授 T5、不完章。 */
    return { state: clone(state0), ok: true, draftReady: true };
  }

  function finalizeJointPage(state0, args) {
    args = args || {};
    if (!state0.auditBoard.complete || !state0.evidence.t4) return fail(state0, "audit-required");
    if (!JOINT_COLUMNS.every(function (key) { return state0.jointPage.columns[key] === JOINT_VALUES[key]; }) ||
        state0.jointPage.scopeDebt !== "scope-unresolved")
      return fail(state0, "joint-page-draft-incomplete");
    if (args.rateDebt !== "conversion-rate-unmeasured") return fail(state0, "rate-debt-mismatch");
    var state = clone(state0);
    /* x_final 原子成立：第二筆債、四方署名、T5 與 complete 不留半成品。 */
    state.jointPage.rateDebt = args.rateDebt;
    state.jointPage.signedBy = { stang: true, kessler: true, rumford: true, traveler: true };
    state.jointPage.complete = true;
    state.phase = "complete";
    return { state: state, ok: true, evidence: grant(state, "t5") ? "T5" : null, complete: true };
  }

  function gate(state, key) {
    if (key === "source-ledger") return !!state.sourceLedger.sealed;
    if (key === "chips") return !!state.evidence.t1;
    if (key === "friction") return !!state.evidence.t2;
    if (key === "dry") return !!state.dryBench.judged;
    if (key === "air") return !!state.evidence.t3;
    if (key === "water") return !!state.waterBench.ready;
    if (key === "finite-predictions") return !!state.finiteSources.sealed;
    if (key === "continuous-run") return !!state.continuousRun.complete;
    if (key === "finite-verdict") return !!(state.finiteSources.complete && state.evidence.t4);
    if (key === "audit") return !!state.auditBoard.complete;
    if (key === "joint-draft") return !!(state.jointPage.scopeDebt &&
      JOINT_COLUMNS.every(function (column) { return state.jointPage.columns[column] === JOINT_VALUES[column]; }));
    if (key === "complete") return !!(state.jointPage.complete && state.evidence.t5);
    return false;
  }

  var api = {
    initialState: initialState,
    setSourceLedger: setSourceLedger,
    sealModels: sealModels,
    setChipDraft: setChipDraft,
    runChipComparison: runChipComparison,
    judgeChipComparison: judgeChipComparison,
    runFrictionCondition: runFrictionCondition,
    judgeFrictionConditions: judgeFrictionConditions,
    setDryDraft: setDryDraft,
    runDryStrip: runDryStrip,
    judgeDryStrip: judgeDryStrip,
    sealAirPrediction: sealAirPrediction,
    runAirComparison: runAirComparison,
    judgeAirComparison: judgeAirComparison,
    setWaterDraft: setWaterDraft,
    prepareWaterBox: prepareWaterBox,
    setFinitePrediction: setFinitePrediction,
    sealFinitePredictions: sealFinitePredictions,
    runContinuousSegment: runContinuousSegment,
    judgeFiniteSource: judgeFiniteSource,
    placeAuditEvidence: placeAuditEvidence,
    setLatentDisposition: setLatentDisposition,
    completeAudit: completeAudit,
    setJointColumn: setJointColumn,
    writeScopeDebt: writeScopeDebt,
    prepareJointPage: prepareJointPage,
    finalizeJointPage: finalizeJointPage,
    gate: gate,
    SOURCES: SOURCES.slice(),
    BANDS: BANDS.slice(),
    VERDICTS: VERDICTS.slice()
    ,JOINT_VALUES: clone(JOINT_VALUES)
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.GB = root.GB || {};
  root.GB.Engine6 = api;
})(typeof window !== "undefined" ? window : globalThis);
