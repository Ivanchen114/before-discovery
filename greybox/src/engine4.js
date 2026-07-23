/* src/engine4.js — 第四章軌道／跨尺度／出版引擎（規格 v0.1）。
   純函式、零 RNG、零 DOM。所有數值皆為可重做的教學 fixture，不冒充 Newton 原始手稿。 */
(function (root) {
  "use strict";

  var TEACHING = { earthRadiusRatio: 60, surfaceOneSecondFallM: 4.9, moonSixtySecondSagM: 4.9 };
  var MODERN = { meanMoonDistanceKm: 384400, earthRadiusKm: 6371, ratio: 60.34, moonSagBandM: [4.7, 5.1] };
  var PLANETS = {
    earth: { radiusRatio: 1, periodRatio: 1 },
    mars: { radiusRatio: 1.52, periodRatio: 1.88 },
    jupiter: { radiusRatio: 5.20, periodRatio: 11.86 }
  };
  var CASES = ["moon", "planets", "comet"];
  var MODELS = ["inverseSquare", "simpleVortex"];
  var PROOF_EXPECT = {
    inertia: ["M2", "M3"],
    inward: ["K1"],
    distance: ["K2"],
    withheld: ["K3"],
    model: ["K4"]
  };
  var CREDIT_EXPECT = {
    direction: "Hooke",
    publication: "Halley",
    observations: "Flamsteed",
    proof: "Newton"
  };

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function err(state, code) { return { state: state, error: code }; }
  function finite(x) { return typeof x === "number" && isFinite(x); }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function round(x, places) {
    var p = Math.pow(10, places == null ? 3 : places);
    return Math.round(x * p) / p;
  }
  function unique(xs) { return Array.from(new Set(xs || [])); }
  function angleDeg(ax, ay, bx, by) {
    var am = Math.sqrt(ax * ax + ay * ay), bm = Math.sqrt(bx * bx + by * by);
    if (!am || !bm) return 180;
    return Math.acos(clamp((ax * bx + ay * by) / (am * bm), -1, 1)) * 180 / Math.PI;
  }
  function recordClaim(s, id, sources, concept, ok) {
    s.claims[id].push({ sources: clone(sources || []), concept: concept || null, ok: !!ok });
  }
  function allTrue(obj) { return Object.keys(obj).every(function (k) { return !!obj[k]; }); }

  function initialState() {
    return {
      days: 0,
      scene: "D0-1",
      transition: { cardIndex: 0, acknowledged: [] },
      orbitLab: {
        attempt: 0, step: 0, path: [], velocityVectors: [], deflectionVectors: [],
        consequence: null, tangentRecord: null, closedRecord: null,
        ruleRepeatReady: false, complete: false,
        position: { x: 1, y: 0 }, velocity: { x: 0, y: 0.24 }
      },
      scaleLab: {
        earthRadiusRatio: 60, timeRatio: 60, exponent: null,
        trials: [], lawLocked: null, moonObservationRevealed: true, moonMatch: false,
        scaleHistory: [], actualCoordinates: { earthX: 0, moonX: 60 }
      },
      planetLab: {
        predictions: [], revealed: { mars: false, jupiter: false },
        residuals: { mars: null, jupiter: null }, crossScalePass: false
      },
      modelLab: {
        runs: [], gravityComplete: false, vortexComplete: false,
        selectedRecords: [], comparisonClaim: null
      },
      proof: {
        slots: [], attribution: {}, boundaryChoice: null, overclaimTried: false,
        press: {
          window: 1, reservedWindows: 3, openingChoice: null,
          status: "open", proofs: [], delays: [], rushTried: false,
          scheduleLost: false
        }
      },
      claims: { k1: [], k2: [], k3: [], k4: [], k5: [] },
      evidence: { k1: false, k2: false, k3: false, k4: false, k5: false }
    };
  }

  function advanceTransition(state0, cardId) {
    if (typeof cardId !== "string" || !cardId) return err(state0, "bad-transition-card");
    var s = clone(state0);
    if (s.transition.acknowledged.indexOf(cardId) < 0) {
      s.transition.acknowledged.push(cardId);
      s.transition.cardIndex += 1;
    }
    return { state: s, acknowledged: cardId };
  }

  function startOrbitAttempt(state0) {
    var s = clone(state0);
    s.orbitLab.attempt += 1;
    s.orbitLab.step = 0;
    s.orbitLab.path = [{ x: 1, y: 0 }];
    s.orbitLab.velocityVectors = [{ x: 0, y: 0.24 }];
    s.orbitLab.deflectionVectors = [];
    s.orbitLab.consequence = null;
    s.orbitLab.ruleRepeatReady = false;
    s.orbitLab.position = { x: 1, y: 0 };
    s.orbitLab.velocity = { x: 0, y: 0.24 };
    return { state: s };
  }

  function consequencePath(kind, p, v) {
    var out = [{ x: round(p.x), y: round(p.y) }];
    var i, x = p.x, y = p.y, vx = v.x, vy = v.y;
    if (kind === "tangent") {
      for (i = 0; i < 5; i++) { x += vx; y += vy; out.push({ x: round(x), y: round(y) }); }
    } else if (kind === "outward") {
      for (i = 0; i < 5; i++) {
        vx += p.x * 0.045; vy += p.y * 0.045; x += vx; y += vy;
        out.push({ x: round(x), y: round(y) });
      }
    } else if (kind === "impact") {
      for (i = 0; i < 5; i++) {
        vx -= x * 0.19; vy -= y * 0.19; x += vx; y += vy;
        out.push({ x: round(x), y: round(y), impact: Math.sqrt(x * x + y * y) < 0.42 });
      }
    } else {
      for (i = 0; i < 8; i++) {
        vx -= x * 0.105; vy -= y * 0.105; x += vx; y += vy;
        out.push({ x: round(x), y: round(y) });
      }
    }
    return out;
  }

  function commitDeflection(state0, vector) {
    var o0 = state0.orbitLab;
    if (!o0.attempt) return err(state0, "orbit-attempt-required");
    if (o0.consequence && !o0.consequence.played) return err(state0, "consequence-required");
    if (o0.step >= 3) return err(state0, "three-vectors-complete");
    var dx = vector && Number(vector.dx), dy = vector && Number(vector.dy);
    if (!finite(dx) || !finite(dy)) return err(state0, "bad-vector");
    var s = clone(state0), o = s.orbitLab, p = o.position, v = o.velocity;
    var inwardX = -p.x, inwardY = -p.y;
    var magnitude = Math.sqrt(dx * dx + dy * dy);
    var expected = 0.058;
    var angle = angleDeg(dx, dy, inwardX, inwardY);
    var kind = null;
    if (magnitude < 0.006) kind = "tangent";
    else if (angle > 90) kind = "outward";
    else if (magnitude / expected > 1.25) kind = magnitude / expected > 2.2 ? "impact" : "unstable";
    else if (angle > 15 || magnitude / expected < 0.75) kind = "unstable";
    if (kind) {
      o.consequence = {
        kind: kind, played: false, angleDeg: round(angle, 1),
        magnitudeRatio: round(magnitude / expected, 2),
        path: consequencePath(kind, p, v)
      };
      return { state: s, ok: false, consequence: clone(o.consequence) };
    }
    o.deflectionVectors.push({ step: o.step, dx: round(dx), dy: round(dy), angleDeg: round(angle, 1) });
    o.velocity = { x: round(v.x + dx), y: round(v.y + dy) };
    o.position = { x: round(p.x + o.velocity.x), y: round(p.y + o.velocity.y) };
    o.path.push(clone(o.position));
    o.velocityVectors.push(clone(o.velocity));
    o.step += 1;
    o.consequence = null;
    if (o.step === 3) o.ruleRepeatReady = true;
    return { state: s, ok: true, step: o.step, ruleRepeatReady: o.ruleRepeatReady };
  }

  function runConsequence(state0) {
    if (!state0.orbitLab.consequence) return err(state0, "no-consequence");
    var s = clone(state0);
    s.orbitLab.consequence.played = true;
    if (s.orbitLab.consequence.kind === "tangent") {
      s.orbitLab.tangentRecord = {
        id: "tangent", kind: "tangent", path: clone(s.orbitLab.consequence.path),
        note: "無偏折時沿切線遠離"
      };
    }
    return { state: s, consequence: clone(s.orbitLab.consequence) };
  }

  function repeatOrbitRule(state0) {
    if (!state0.orbitLab.ruleRepeatReady || state0.orbitLab.deflectionVectors.length < 3)
      return err(state0, "three-valid-vectors-required");
    var s = clone(state0), path = [], i;
    for (i = 0; i <= 32; i++) {
      var a = i * Math.PI * 2 / 32;
      var wobble = 1 + 0.018 * Math.sin(i * 0.9);
      path.push({ x: round(Math.cos(a) * wobble), y: round(Math.sin(a) * wobble) });
    }
    s.orbitLab.path = path;
    s.orbitLab.closedRecord = {
      id: "closed", kind: "closed", path: clone(path),
      note: "離散步進形成閉合軌道帶；細小誤差來自步長"
    };
    s.orbitLab.complete = true;
    s.days += 1;
    return { state: s, record: clone(s.orbitLab.closedRecord) };
  }

  function assertK1(state0, records, concept) {
    var s = clone(state0), picked = unique(records).sort();
    var ok = !!(s.orbitLab.tangentRecord && s.orbitLab.closedRecord) &&
      JSON.stringify(picked) === JSON.stringify(["closed", "tangent"]) &&
      concept === "forward-plus-inward-turn";
    recordClaim(s, "k1", picked, concept, ok);
    if (ok) s.evidence.k1 = true;
    return { state: s, ok: ok, evidence: ok ? "K1" : null, reason: ok ? null : "claim-mismatch" };
  }

  function setScale(state0, distanceRatio, timeRatio) {
    if (!state0.evidence.k1) return err(state0, "k1-required");
    distanceRatio = Number(distanceRatio); timeRatio = Number(timeRatio);
    if (!finite(distanceRatio) || !finite(timeRatio) || distanceRatio < 1 || distanceRatio > 100 ||
        timeRatio < 1 || timeRatio > 120) return err(state0, "bad-scale");
    var s = clone(state0);
    s.scaleLab.earthRadiusRatio = round(distanceRatio, 1);
    s.scaleLab.timeRatio = round(timeRatio, 1);
    s.scaleLab.actualCoordinates = {
      earthX: 0, moonX: round(distanceRatio, 1),
      displayMoonX: round(8 + 84 * Math.log(distanceRatio) / Math.log(100), 1)
    };
    s.scaleLab.scaleHistory.push({
      distanceRatio: s.scaleLab.earthRadiusRatio, timeRatio: s.scaleLab.timeRatio,
      coordinates: clone(s.scaleLab.actualCoordinates)
    });
    return { state: s, coordinates: clone(s.scaleLab.actualCoordinates) };
  }

  function lawTrial(exponent, distanceRatio, timeRatio) {
    var sag = TEACHING.surfaceOneSecondFallM * Math.pow(distanceRatio, 2 - exponent) *
      Math.pow(timeRatio / distanceRatio, 2);
    var mars = Math.pow(PLANETS.mars.radiusRatio, (exponent + 1) / 2);
    var jupiter = Math.pow(PLANETS.jupiter.radiusRatio, (exponent + 1) / 2);
    return {
      exponent: round(exponent, 1), moonSagM: round(sag, 2),
      moonErrorPct: round(Math.abs(sag - TEACHING.moonSixtySecondSagM) / TEACHING.moonSixtySecondSagM * 100, 1),
      periods: { mars: round(mars, 3), jupiter: round(jupiter, 3) }
    };
  }

  function tryDistanceLaw(state0, exponent) {
    if (!state0.evidence.k1) return err(state0, "k1-required");
    exponent = Number(exponent);
    if (!finite(exponent) || exponent < 0 || exponent > 3 || Math.abs(exponent * 10 - Math.round(exponent * 10)) > 1e-8)
      return err(state0, "bad-exponent");
    var s = clone(state0), sc = s.scaleLab;
    var trial = lawTrial(exponent, sc.earthRadiusRatio, sc.timeRatio);
    trial.id = sc.trials.length + 1;
    sc.exponent = round(exponent, 1);
    sc.trials.push(trial);
    sc.moonMatch = trial.moonSagM >= MODERN.moonSagBandM[0] && trial.moonSagM <= MODERN.moonSagBandM[1];
    return { state: s, trial: clone(trial), moonMatch: sc.moonMatch };
  }

  function lockDistanceLaw(state0, exponent) {
    exponent = round(Number(exponent), 1);
    if (!finite(exponent)) return err(state0, "bad-exponent");
    var distinct = unique((state0.scaleLab.trials || []).map(function (t) { return t.exponent; }));
    if (distinct.length < 2) return err(state0, "two-trials-required");
    if (distinct.indexOf(exponent) < 0) return err(state0, "trial-required-before-lock");
    var s = clone(state0);
    s.scaleLab.lawLocked = exponent;
    return { state: s, locked: exponent };
  }

  function unlockDistanceLaw(state0) {
    if (state0.scaleLab.lawLocked == null) return { state: state0, noop: true };
    var s = clone(state0), old = s.scaleLab.lawLocked;
    s.scaleLab.lawLocked = null;
    s.planetLab.predictions.forEach(function (p) { if (p.exponent === old) p.superseded = true; });
    return { state: s, unlocked: old };
  }

  function predictPlanet(state0, id) {
    if (state0.scaleLab.lawLocked == null) return err(state0, "law-lock-required");
    if (id !== "mars" && id !== "jupiter") return err(state0, "unknown-planet");
    if (state0.planetLab.revealed[id]) return err(state0, "observation-already-revealed");
    var s = clone(state0), exponent = s.scaleLab.lawLocked;
    var prediction = Math.pow(PLANETS[id].radiusRatio, (exponent + 1) / 2);
    var actual = PLANETS[id].periodRatio;
    var residualPct = Math.abs(prediction - actual) / actual * 100;
    var row = {
      id: s.planetLab.predictions.length + 1, planet: id, exponent: exponent,
      prediction: round(prediction, 3), sealed: true, revealedAfterSeal: true,
      actual: actual, residualPct: round(residualPct, 2), pass: residualPct <= 3,
      superseded: false
    };
    s.planetLab.predictions.push(row);
    s.planetLab.revealed[id] = true;
    s.planetLab.residuals[id] = row.residualPct;
    s.planetLab.crossScalePass = ["mars", "jupiter"].every(function (p) {
      return s.planetLab.predictions.some(function (r) { return r.planet === p && r.pass && !r.superseded; });
    });
    return { state: s, prediction: clone(row) };
  }

  function resetPlanetReveals(state0) {
    if (state0.scaleLab.lawLocked != null) return err(state0, "unlock-law-first");
    var s = clone(state0);
    s.planetLab.revealed = { mars: false, jupiter: false };
    s.planetLab.residuals = { mars: null, jupiter: null };
    s.planetLab.crossScalePass = false;
    return { state: s };
  }

  function assertK2(state0, records, concept) {
    var s = clone(state0), picked = unique(records).sort();
    var correctSources = JSON.stringify(picked) === JSON.stringify(["earth-fall", "moon-sag", "scale-60-60"]);
    var matchingTrial = s.scaleLab.trials.some(function (t) {
      return t.exponent === 2 && t.moonSagM >= MODERN.moonSagBandM[0] && t.moonSagM <= MODERN.moonSagBandM[1];
    });
    var ok = correctSources && s.scaleLab.earthRadiusRatio === 60 && s.scaleLab.timeRatio === 60 &&
      matchingTrial && concept === "inverse-square-cross-scale";
    recordClaim(s, "k2", picked, concept, ok);
    if (ok) s.evidence.k2 = true;
    return { state: s, ok: ok, evidence: ok ? "K2" : null, reason: ok ? null : "claim-mismatch" };
  }

  function assertK3(state0, records, concept) {
    var s = clone(state0), picked = unique(records).sort();
    var ok = JSON.stringify(picked) === JSON.stringify(["jupiter-sealed", "mars-sealed"]) &&
      s.planetLab.crossScalePass && concept === "withheld-data-prediction";
    recordClaim(s, "k3", picked, concept, ok);
    if (ok) s.evidence.k3 = true;
    return { state: s, ok: ok, evidence: ok ? "K3" : null, reason: ok ? null : "claim-mismatch" };
  }

  function modelOutcome(model, caseId) {
    var table = {
      inverseSquare: {
        moon: { fit: "pass", residual: 0.8, patches: 0, note: "同一距離律通過月球量級" },
        planets: { fit: "pass", residual: 1.6, patches: 0, note: "同一規則通過兩個行星週期" },
        comet: { fit: "pass", residual: 2.2, patches: 0, note: "同一中心規則容許跨區域長軌道" }
      },
      simpleVortex: {
        moon: { fit: "pass", residual: 3.8, patches: 0, note: "簡單共轉渦旋也能定性說明近圓運動" },
        planets: { fit: "patched", residual: 12.4, patches: 2, note: "不同距離需另加渦層速度" },
        comet: { fit: "patched", residual: 28.0, patches: 2, note: "穿越行星區域需另加穿透與流向補丁" }
      }
    };
    return clone(table[model][caseId]);
  }

  function runModel(state0, model, caseId) {
    if (!(state0.evidence.k2 && state0.evidence.k3)) return err(state0, "k2-k3-required");
    if (MODELS.indexOf(model) < 0) return err(state0, "unknown-model");
    if (CASES.indexOf(caseId) < 0) return err(state0, "unknown-model-case");
    var s = clone(state0);
    var run = { id: s.modelLab.runs.length + 1, model: model, caseId: caseId };
    var outcome = modelOutcome(model, caseId);
    Object.keys(outcome).forEach(function (k) { run[k] = outcome[k]; });
    s.modelLab.runs.push(run);
    s.modelLab.gravityComplete = CASES.every(function (c) {
      return s.modelLab.runs.some(function (r) { return r.model === "inverseSquare" && r.caseId === c; });
    });
    s.modelLab.vortexComplete = CASES.every(function (c) {
      return s.modelLab.runs.some(function (r) { return r.model === "simpleVortex" && r.caseId === c; });
    });
    return { state: s, run: clone(run) };
  }

  function assertK4(state0, records, claim) {
    var s = clone(state0), picked = unique(records);
    var allRuns = MODELS.every(function (m) {
      return CASES.every(function (c) {
        return s.modelLab.runs.some(function (r) {
          return r.model === m && r.caseId === c && picked.indexOf(m + ":" + c) >= 0;
        });
      });
    });
    var ok = s.modelLab.gravityComplete && s.modelLab.vortexComplete && allRuns &&
      claim === "same-rule-fewer-patches";
    s.modelLab.selectedRecords = picked;
    s.modelLab.comparisonClaim = claim;
    recordClaim(s, "k4", picked, claim, ok);
    if (ok) s.evidence.k4 = true;
    return { state: s, ok: ok, evidence: ok ? "K4" : null, reason: ok ? null : "comparison-overclaim" };
  }

  function placeProofLink(state0, slot, evidenceId) {
    if (!PROOF_EXPECT[slot]) return err(state0, "unknown-proof-slot");
    if (typeof evidenceId !== "string") return err(state0, "unknown-proof-source");
    var s = clone(state0), found = false;
    s.proof.slots = s.proof.slots.map(function (r) {
      if (r.slot === slot) { found = true; return { slot: slot, evidenceId: evidenceId }; }
      return r;
    });
    if (!found) s.proof.slots.push({ slot: slot, evidenceId: evidenceId });
    var ok = PROOF_EXPECT[slot].indexOf(evidenceId) >= 0;
    return { state: s, ok: ok, consequence: ok ? null : "geometry-break", slot: slot };
  }

  function assignCredit(state0, contribution, person) {
    if (!CREDIT_EXPECT[contribution]) return err(state0, "unknown-contribution");
    if (["Hooke", "Halley", "Flamsteed", "Newton"].indexOf(person) < 0) return err(state0, "unknown-person");
    var s = clone(state0);
    s.proof.attribution[contribution] = person;
    return { state: s, ok: CREDIT_EXPECT[contribution] === person };
  }

  function consumeWindow(s, kind, record) {
    var p = s.proof.press;
    if (p.status === "schedule-lost") return;
    record.window = p.window;
    if (kind === "proof") p.proofs.push(record); else p.delays.push(record);
    if (p.window >= p.reservedWindows) {
      p.status = "schedule-lost"; p.scheduleLost = true;
    } else {
      p.window += 1; p.status = "open";
    }
  }

  function submitPartialProof(state0, scope) {
    if (!(state0.evidence.k2 && state0.evidence.k3)) return err(state0, "k2-k3-required");
    if (state0.evidence.k4) return err(state0, "partial-window-passed");
    if (scope !== "moon-planets") return err(state0, "dishonest-partial-scope");
    var s = clone(state0);
    s.proof.press.openingChoice = "partial";
    consumeWindow(s, "proof", {
      kind: "partial", complete: false, supported: ["moon", "planets"],
      missing: ["comet", "model-comparison"]
    });
    return { state: s, ok: true, partial: true };
  }

  function deferPress(state0, reason) {
    if (!(state0.evidence.k2 && state0.evidence.k3)) return err(state0, "k2-k3-required");
    if (typeof reason !== "string" || !reason.trim()) return err(state0, "delay-reason-required");
    var s = clone(state0);
    if (!s.proof.press.openingChoice) s.proof.press.openingChoice = "defer";
    consumeWindow(s, "delay", { kind: "delay", reason: reason.trim() });
    return { state: s, ok: true, delayed: true };
  }

  function setBoundary(state0, choice) {
    if (!state0.evidence.k4) return err(state0, "k4-required");
    if (["mechanismSolved", "newtonAlone", "ruleEstablished"].indexOf(choice) < 0)
      return err(state0, "unknown-boundary-choice");
    var s = clone(state0);
    s.proof.boundaryChoice = choice;
    if (choice !== "ruleEstablished") s.proof.overclaimTried = true;
    return {
      state: s, ok: choice === "ruleEstablished",
      consequence: choice === "mechanismSolved" ? "mechanism-slot-empty" :
        (choice === "newtonAlone" ? "credit-lines-break" : null)
    };
  }

  function proofAudit(state) {
    var slots = {}, missing = [], wrong = [], creditWrong = [];
    (state.proof.slots || []).forEach(function (r) { slots[r.slot] = r.evidenceId; });
    Object.keys(PROOF_EXPECT).forEach(function (slot) {
      if (!slots[slot]) missing.push(slot);
      else if (PROOF_EXPECT[slot].indexOf(slots[slot]) < 0) wrong.push(slot);
    });
    Object.keys(CREDIT_EXPECT).forEach(function (c) {
      if (state.proof.attribution[c] !== CREDIT_EXPECT[c]) creditWrong.push(c);
    });
    var boundaryOk = state.proof.boundaryChoice === "ruleEstablished";
    return {
      complete: !missing.length && !wrong.length && !creditWrong.length && boundaryOk,
      missing: missing, wrong: wrong, creditWrong: creditWrong,
      boundary: state.proof.boundaryChoice, boundaryOk: boundaryOk
    };
  }

  function previewProof(state0) {
    if (!state0.evidence.k4) return err(state0, "k4-required");
    return { state: state0, preview: proofAudit(state0) };
  }

  function submitProof(state0) {
    if (!state0.evidence.k4) return err(state0, "k4-required");
    var s = clone(state0), audit = proofAudit(s);
    var snapshot = {
      kind: audit.complete ? "complete" : "wrong-proof",
      complete: audit.complete, audit: clone(audit),
      slots: clone(s.proof.slots), attribution: clone(s.proof.attribution),
      boundaryChoice: s.proof.boundaryChoice
    };
    if (s.proof.press.status === "schedule-lost") s.proof.press.proofs.push(snapshot);
    else consumeWindow(s, "proof", snapshot);
    if (!audit.complete) {
      s.proof.press.rushTried = true;
      return { state: s, ok: false, proof: clone(snapshot), consequence: "printed-broken-proof" };
    }
    s.evidence.k5 = true;
    recordClaim(s, "k5", ["K1", "K2", "K3", "K4"], "rule-established-boundary-open", true);
    return { state: s, ok: true, evidence: "K5", proof: clone(snapshot) };
  }

  var api = {
    initialState: initialState,
    advanceTransition: advanceTransition,
    startOrbitAttempt: startOrbitAttempt, commitDeflection: commitDeflection,
    runConsequence: runConsequence, repeatOrbitRule: repeatOrbitRule, assertK1: assertK1,
    setScale: setScale, tryDistanceLaw: tryDistanceLaw, lockDistanceLaw: lockDistanceLaw,
    unlockDistanceLaw: unlockDistanceLaw, resetPlanetReveals: resetPlanetReveals,
    predictPlanet: predictPlanet, assertK2: assertK2, assertK3: assertK3,
    runModel: runModel, assertK4: assertK4,
    placeProofLink: placeProofLink, assignCredit: assignCredit,
    submitPartialProof: submitPartialProof, setBoundary: setBoundary,
    previewProof: previewProof, submitProof: submitProof, deferPress: deferPress,
    _FIXTURE: { teaching: TEACHING, modernCheck: MODERN, planets: PLANETS },
    _CASES: CASES.slice(), _MODELS: MODELS.slice(),
    _PROOF_EXPECT: clone(PROOF_EXPECT), _CREDIT_EXPECT: clone(CREDIT_EXPECT),
    _proofAudit: proofAudit
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.GB = root.GB || {}; root.GB.Engine4 = api;
})(typeof window !== "undefined" ? window : globalThis);
