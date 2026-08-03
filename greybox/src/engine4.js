/* src/engine4.js — 第四章軌道／跨尺度／出版引擎（規格 v0.1）。
   純函式、零 RNG、零 DOM。所有數值皆為可重做的教學 fixture，不冒充 Newton 原始手稿。 */
(function (root) {
  "use strict";

  var TEACHING = { earthRadiusRatio: 60, surfaceOneSecondFallM: 4.9, moonSixtySecondSagM: 4.9 };
  var MODERN = { meanMoonDistanceKm: 384400, earthRadiusKm: 6371, ratio: 60.34, moonSagBandM: [4.7, 5.1] };
  /* D1 的「改向尺」只比較同一半徑附近的局部幾何，不預先假定 D2 才要檢驗的
     距離律。每拍以同一個 dt 更新速度與位置；方向、箭長與初速一旦封存便不再
     由玩家逐拍干預。short/medium/long 分別配 slow/medium/fast，可形成三組
     近圓解，避免把「中間那格」偽裝成唯一正解。 */
  var ORBIT_SPEEDS = { slow: 0.82, medium: 1, fast: 1.18 };
  var ORBIT_STRENGTHS = { short: 0.67, medium: 1, long: 1.39 };
  var ORBIT_AIM_PATTERN_ID = "staggered-v1";
  /* 三拍刻意從不同側、不同幅度偏離正確方向，避免玩家不看圖只背
     「每拍固定按三次逆時針」也能過關。數值不是 6 度按鍵的整數倍。 */
  var ORBIT_AIM_OFFSETS = [0.47, -0.41, 0.53];
  var ORBIT_TARGETS = ["same-vector", "ink-mark", "earth-center"];
  var ORBIT_PREDICTIONS = ["parabola", "wrong-center", "outer-band", "inner-band", "near-circle"];
  /* v0.8 的封存紙使用玩家可讀的五種形狀。舊 outcome enum 仍保留給 schema 1
     遷移與既有圖層，但新證據一律依這張封存紙與三拍紀錄成立。 */
  var ORBIT_SHAPES = ["line", "away", "circle", "ellipse", "crash", "wrong-center"];
  var SCALE_PREDICTIONS = ["same", "one-sixtieth", "one-over-3600", "almost-none"];
  var LEDGER_STAMPS = ["matches", "story", "mismatch"];
  var PLANETS = {
    earth: { radiusRatio: 1, periodRatio: 1 },
    mars: { radiusRatio: 1.52, periodRatio: 1.88 },
    jupiter: { radiusRatio: 5.20, periodRatio: 11.86 }
  };
  /* 玩家先押一個約略週期，再讓同一條距離律算出精確預測。押錯不扣證據：
     K3 要驗的是「先承諾、後看觀測」，不是猜數字的運氣。 */
  var PLANET_BANDS = {
    mars: {
      short: { value: 1.5, label: "約 1.5 年" },
      middle: { value: 1.9, label: "約 1.9 年" },
      long: { value: 2.3, label: "約 2.3 年" }
    },
    jupiter: {
      short: { value: 5, label: "約 5 年" },
      middle: { value: 8, label: "約 8 年" },
      long: { value: 12, label: "約 12 年" }
    }
  };
  var CASES = ["moon", "planets", "comet"];
  var MODELS = ["inverseSquare", "simpleVortex"];
  var ARCHIVE_IDS = ["K1", "K2", "K3", "K4", "K5"];
  var PROOF_EXPECT = {
    inertia: ["M2", "M3"],
    inward: ["K1"],
    distance: ["K2"],
    withheld: ["K3"],
    model: ["K4"],
    shell: ["SHELL"]
  };
  var PROOF_SOURCES = unique([].concat.apply([], Object.keys(PROOF_EXPECT)
    .map(function (slot) { return PROOF_EXPECT[slot]; })));
  var CREDIT_EXPECT = {
    direction: "Hooke",
    publication: "Halley",
    observations: "Flamsteed",
    proof: "Newton"
  };
  var HOOKE_SCOPE_EXPECT = "precise-scope";
  var MAX_SHORT_HISTORY = 30;
  var MAX_LONG_HISTORY = 100;
  var TRANSITION_CARDS = [
    "1665-to-1679",
    "1679-to-1684",
    "1684-to-1686"
  ];

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function err(state, code) { return { state: state, error: code }; }
  function full(rows, limit) {
    return Array.isArray(rows) && rows.length >= limit;
  }
  function completedOrArchived(state) {
    return !!(state && state.evidence && state.evidence.k5) ||
      !!(state && state.archiveLab &&
        Array.isArray(state.archiveLab.clipAttempts) &&
        state.archiveLab.clipAttempts.length);
  }
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
  function recordClaim(s, id, sources, concept, ok, action, at) {
    var rows = s.claims[id];
    if (!finite(at)) at = tick(s);
    rows.push({
      id: rows.length + 1,
      sources: clone(sources || []),
      concept: concept || null,
      ok: !!ok,
      at: at,
      action: action,
      source: "player-assertion"
    });
  }
  function allTrue(obj) { return Object.keys(obj).every(function (k) { return !!obj[k]; }); }
  function tick(s) {
    s.sequence = finite(s.sequence) && s.sequence >= 0 ? Math.floor(s.sequence) + 1 : 1;
    return s.sequence;
  }
  function revokeEvidence(s, ids) {
    if (!s.evidence) return;
    ids.forEach(function (id) {
      if (id === "k5" && s.proof && s.proof.press &&
          Array.isArray(s.proof.press.proofs)) {
        s.proof.press.proofs.forEach(function (record) {
          if (record && record.kind === "complete" &&
              record.complete === true && record.superseded !== true)
            record.superseded = true;
        });
      }
      s.evidence[id] = false;
      if (s.archiveLab && Array.isArray(s.archiveLab.clipped))
        s.archiveLab.clipped = [];
      if (s.archiveLab && Array.isArray(s.archiveLab.clipAttempts))
        s.archiveLab.clipAttempts = [];
    });
    if (s.archiveLab && Array.isArray(s.archiveLab.clipped))
      s.archiveLab.complete = ARCHIVE_IDS.every(function (id) {
        return s.archiveLab.clipped.indexOf(id) >= 0;
      });
  }

  function initialState() {
    return {
      days: 0,
      sequence: 0,
      scene: "D0-1",
      transition: { cardIndex: 0, acknowledged: [] },
      sourceLab: {
        tangentPrediction: { choice: null, sealed: false, sealedAt: null },
        attempts: []
      },
      orbitLab: {
        attempt: 0, step: 0, path: [], velocityVectors: [], deflectionVectors: [],
        consequence: null, tangentRecord: null, closedRecord: null,
        ruleRepeatReady: false, complete: false,
        position: { x: 1, y: 0 }, velocity: { x: 0, y: 0.24 },
        ruleRuns: [], activeRule: null,
        ruleSeal: null, aimAngle: null, manualBeats: [], manualAttempts: [],
        firstStepAt: null, manualComplete: false, continuedAt: null
      },
      scaleLab: {
        earthRadiusRatio: 60, timeRatio: 60, exponent: null,
        trials: [], lawLocked: null, moonObservationRevealed: false, moonMatch: false,
        scaleHistory: [{ distanceRatio: 60, timeRatio: 60, source: "observed-comparison-window" }],
        actualCoordinates: { earthX: 0, moonX: 60, displayMoonX: 82 },
        scalePrediction: null, predictionAttempts: [], conversionAttempts: [],
        ratioAttempts: [], relationAttempts: [], moonOneSecondSagMm: null,
        conversionCorrect: false, ratioCorrect: false, relationCorrect: false
      },
      planetLab: {
        predictions: [], revealed: { mars: false, jupiter: false },
        residuals: { mars: null, jupiter: null }, crossScalePass: false
      },
      modelLab: {
        runs: [], gravityComplete: false, vortexComplete: false,
        selectedRecords: [], comparisonClaim: null,
        protocolAttempts: [], protocolLocked: false, protocol: null,
        predictions: {},
        rowOrder: [], completedRows: [], rowStage: {}, stampAttempts: [],
        loans: [], loanDecisions: {}, loanDecisionAt: {}, comparisonSealed: false,
        comparisonAttempts: [], comparisonSealedAt: null, evidencePackage: null
      },
      cometLab: {
        attempts: [], selectedConnection: null, joined: false
      },
      archiveLab: {
        clipped: [], clipAttempts: [], complete: false
      },
      proof: {
        slots: [], attribution: {}, hookeScope: null, hookeScopeAttempts: [],
        slotAttempts: [], attributionAttempts: [], boundaryAttempts: [],
        boundaryChoice: null, overclaimTried: false,
        shellPageReady: false, shellPagePlaced: false,
        authorField: { names: ["Newton", "Traveler"], travelerRemoved: false },
        press: {
          window: 1, reservedWindows: 3, openingChoice: null,
          status: "open", proofs: [], delays: [], rushTried: false,
          scheduleLost: false, priorityRecord: null
        }
      },
      claims: { k1: [], k2: [], k3: [], k4: [], k5: [] },
      evidence: { k1: false, k2: false, k3: false, k4: false, k5: false }
    };
  }

  function advanceTransition(state0, cardId) {
    if (TRANSITION_CARDS.indexOf(cardId) < 0)
      return err(state0, "bad-transition-card");
    if (completedOrArchived(state0))
      return err(state0, "completed-chapter-locked");
    var s = clone(state0);
    if (s.transition.acknowledged.indexOf(cardId) < 0) {
      s.transition.acknowledged.push(cardId);
      s.transition.cardIndex += 1;
    }
    return { state: s, acknowledged: cardId };
  }

  function ensureSourceFields(s) {
    s.sourceLab = s.sourceLab || {};
    s.sourceLab.tangentPrediction = s.sourceLab.tangentPrediction || {
      choice: null, sealed: false, sealedAt: null
    };
    if (!Array.isArray(s.sourceLab.attempts)) s.sourceLab.attempts = [];
    return s;
  }

  /* K0 是玩家封存的來源紙，不是本章第六份證據。錯選只留下判讀紀錄，
     引擎不替玩家改成 tangent，也不把答案預先寫進狀態。 */
  function sealTangentPrediction(state0, choice) {
    if (["arc", "fall", "tangent"].indexOf(choice) < 0)
      return err(state0, "bad-tangent-prediction");
    if (full(state0.sourceLab && state0.sourceLab.attempts, MAX_SHORT_HISTORY))
      return err(state0, "source-attempt-limit");
    var s = ensureSourceFields(clone(state0)), source = s.sourceLab.tangentPrediction;
    if (source.sealed) return err(state0, "tangent-prediction-already-sealed");
    var ok = choice === "tangent", at = tick(s);
    s.sourceLab.attempts.push({ choice: choice, ok: ok, at: at });
    if (!ok) return { state: s, ok: false, consequence: "tangent-prediction-mismatch" };
    source.choice = choice;
    source.sealed = true;
    source.sealedAt = at;
    s.orbitLab.tangentRecord = {
      id: "tangent", kind: "tangent", source: "player-sealed-k0",
      path: consequencePath("tangent", { x: 1, y: 0 }, { x: 0, y: 0.24 }),
      note: "玩家在作圖前封存：沒有拉扯時沿當下方向直行"
    };
    return { state: s, ok: true, source: "K0" };
  }

  function startOrbitAttempt(state0) {
    var s = clone(state0);
    if (!s.orbitLab.tangentRecord) {
      s.orbitLab.tangentRecord = {
        id: "tangent",
        kind: "tangent",
        path: consequencePath("tangent", { x: 1, y: 0 }, { x: 0, y: 0.24 }),
        note: "在操作前封存的無作用切線預測"
      };
    }
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

  function ensureOrbitRuleFields(s) {
    s.orbitLab = s.orbitLab || {};
    if (!Array.isArray(s.orbitLab.ruleRuns)) s.orbitLab.ruleRuns = [];
    if (!("activeRule" in s.orbitLab)) s.orbitLab.activeRule = null;
    if (!("ruleSeal" in s.orbitLab)) s.orbitLab.ruleSeal = null;
    if (!("aimAngle" in s.orbitLab)) s.orbitLab.aimAngle = null;
    if (!Array.isArray(s.orbitLab.manualBeats)) s.orbitLab.manualBeats = [];
    if (!Array.isArray(s.orbitLab.manualAttempts)) s.orbitLab.manualAttempts = [];
    if (!("firstStepAt" in s.orbitLab)) s.orbitLab.firstStepAt = null;
    if (!("manualComplete" in s.orbitLab)) s.orbitLab.manualComplete = false;
    if (!("continuedAt" in s.orbitLab)) s.orbitLab.continuedAt = null;
    return s;
  }

  function orbitRuleOutcome(target, minRadius, maxRadius, hitEarth) {
    if (target === "same-vector") return "parabola";
    if (target === "ink-mark") return "wrong-center";
    if (hitEarth || minRadius < 0.72) return "inner-band";
    if (maxRadius > 1.18) return "outer-band";
    if (maxRadius - minRadius <= 0.08 && Math.abs((maxRadius + minRadius) / 2 - 1) <= 0.05)
      return "near-circle";
    return maxRadius - 1 >= 1 - minRadius ? "outer-band" : "inner-band";
  }

  function simulateOrbitRule(target, speedKey, strengthKey) {
    var speed = ORBIT_SPEEDS[speedKey], strength = ORBIT_STRENGTHS[strengthKey];
    var dt = 0.02, steps = Math.round(2 * Math.PI / (speed * dt));
    var x = 1, y = 0, vx = 0, vy = speed;
    var path = [{ x: 1, y: 0 }], minRadius = 1, maxRadius = 1, hitEarth = false;
    var ink = { x: 0, y: 0.55 };
    for (var i = 0; i < steps; i++) {
      var ax, ay;
      if (target === "same-vector") {
        ax = -strength; ay = 0;
      } else {
        var tx = target === "ink-mark" ? ink.x : 0;
        var ty = target === "ink-mark" ? ink.y : 0;
        var dx = tx - x, dy = ty - y, dm = Math.sqrt(dx * dx + dy * dy) || 1;
        ax = strength * dx / dm; ay = strength * dy / dm;
      }
      /* 半隱式 Euler：同一封存規則逐拍更新，不替玩家偷偷修正路徑。 */
      vx += ax * dt; vy += ay * dt;
      x += vx * dt; y += vy * dt;
      var radius = Math.sqrt(x * x + y * y);
      minRadius = Math.min(minRadius, radius);
      maxRadius = Math.max(maxRadius, radius);
      if (radius < 0.28) hitEarth = true;
      if (i % 4 === 3) path.push({ x: round(x), y: round(y) });
      if (Math.abs(x) > 2.45 || Math.abs(y) > 2.45 || hitEarth) break;
    }
    if (path[path.length - 1].x !== round(x) || path[path.length - 1].y !== round(y))
      path.push({ x: round(x), y: round(y), impact: hitEarth });
    return {
      path: path,
      outcome: orbitRuleOutcome(target, minRadius, maxRadius, hitEarth),
      minRadius: round(minRadius, 3), maxRadius: round(maxRadius, 3),
      finalPosition: { x: round(x), y: round(y) },
      finalVelocity: { x: round(vx), y: round(vy) },
      inkMark: clone(ink)
    };
  }

  function orbitTargetAngle(target, position) {
    if (target === "same-vector") return Math.PI;
    var tx = target === "ink-mark" ? 0 : 0;
    var ty = target === "ink-mark" ? 0.55 : 0;
    return Math.atan2(ty - position.y, tx - position.x);
  }

  function orbitAimOffset(seal, stepIndex) {
    /* 沒有版本欄位的是既有 schema-2 存檔；維持舊 0.6 rad，讓進行中的
       三拍與幽靈紙仍可重播。新封存紙才採逐拍交錯偏角。 */
    if (!seal || seal.aimPattern !== ORBIT_AIM_PATTERN_ID) return 0.6;
    return ORBIT_AIM_OFFSETS[Math.max(0, Math.min(2, Number(stepIndex) || 0))];
  }

  function normalizeAngle(a) {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  }

  function sealOrbitRule(state0, config, prediction) {
    config = config || {};
    var downstreamPredictions = state0.planetLab &&
      state0.planetLab.predictions || [];
    var migratedK1Recovery = !(state0.evidence && state0.evidence.k1) &&
      downstreamPredictions.length > 0 &&
      downstreamPredictions.every(function (row) {
        return row && row.source === "schema1-validated-k3";
      });
    if ((!migratedK1Recovery && downstreamPredictions.length) ||
        (state0.evidence &&
          ((!migratedK1Recovery && state0.evidence.k3) ||
            state0.evidence.k4 || state0.evidence.k5)))
      return err(state0, "downstream-records-locked");
    if (!state0.sourceLab || !state0.sourceLab.tangentPrediction ||
        !state0.sourceLab.tangentPrediction.sealed)
      return err(state0, "k0-source-required");
    if (!state0.evidence || !state0.evidence.k2) return err(state0, "k2-required");
    if (ORBIT_TARGETS.indexOf(config.target) < 0) return err(state0, "bad-orbit-target");
    if (!ORBIT_SPEEDS[config.speed]) return err(state0, "bad-orbit-speed");
    if (!ORBIT_STRENGTHS[config.strength]) return err(state0, "bad-orbit-strength");
    if (ORBIT_SHAPES.indexOf(prediction) < 0) return err(state0, "bad-orbit-prediction");
    var s = ensureOrbitRuleFields(clone(state0)), o = s.orbitLab;
    if (o.ruleSeal && !o.continuedAt) return err(state0, "orbit-rule-already-sealed");
    /* 重新封一組設定會使舊 K1 與所有依賴它的出版證據失效。舊紙仍留在
       ruleRuns／claims，不能再被當成目前有效結果。 */
    revokeEvidence(s, migratedK1Recovery
      ? ["k1", "k4", "k5"]
      : ["k1", "k3", "k4", "k5"]);
    var sealedAt = tick(s);
    o.ruleSeal = {
      target: config.target, speed: config.speed, strength: config.strength,
      prediction: prediction, sealedAt: sealedAt,
      aimPattern: ORBIT_AIM_PATTERN_ID
    };
    o.activeRule = clone(o.ruleSeal);
    o.attempt += 1;
    o.step = 0;
    o.path = [{ x: 1, y: 0 }];
    o.position = { x: 1, y: 0 };
    o.velocity = { x: 0, y: round(ORBIT_SPEEDS[config.speed] * 0.19) };
    o.velocityVectors = [clone(o.velocity)];
    o.deflectionVectors = [];
    o.manualBeats = [];
    o.firstStepAt = null;
    o.manualComplete = false;
    o.continuedAt = null;
    o.complete = false;
    o.closedRecord = null;
    o.aimAngle = orbitTargetAngle(config.target, o.position) +
      orbitAimOffset(o.ruleSeal, 0);
    return { state: s, ok: true, seal: clone(o.ruleSeal) };
  }

  function nudgeOrbitAim(state0, delta) {
    var o0 = state0.orbitLab || {};
    if (!o0.ruleSeal) return err(state0, "orbit-rule-required");
    if ((o0.manualBeats || []).length >= 3) return err(state0, "three-vectors-complete");
    delta = Number(delta);
    if (!finite(delta) || Math.abs(delta) > Math.PI / 2) return err(state0, "bad-orbit-nudge");
    var s = ensureOrbitRuleFields(clone(state0));
    s.orbitLab.aimAngle = normalizeAngle(Number(s.orbitLab.aimAngle || 0) + delta);
    return { state: s, ok: true, aimAngle: s.orbitLab.aimAngle };
  }

  function commitOrbitBeat(state0) {
    var o0 = state0.orbitLab || {};
    if (!o0.ruleSeal) return err(state0, "orbit-rule-required");
    if (!finite(o0.aimAngle)) return err(state0, "orbit-aim-required");
    if ((o0.manualBeats || []).length >= 3) return err(state0, "three-vectors-complete");
    var s = ensureOrbitRuleFields(clone(state0)), o = s.orbitLab;
    var before = clone(o.position), aim = o.aimAngle;
    var expected = orbitTargetAngle(o.ruleSeal.target, before);
    var currentError = Math.abs(normalizeAngle(aim - expected)) * 180 / Math.PI;
    var priorPosition = o.manualBeats.length
      ? o.manualBeats[o.manualBeats.length - 1].before
      : before;
    var previousEarthAngle = Math.atan2(-priorPosition.y, -priorPosition.x);
    var previousError = Math.abs(normalizeAngle(aim - previousEarthAngle)) * 180 / Math.PI;
    var valid = currentError <= 18;
    var strength = ORBIT_STRENGTHS[o.ruleSeal.strength] * 0.045;
    var dx = Math.cos(aim) * strength, dy = Math.sin(aim) * strength;
    o.velocity = { x: round(o.velocity.x + dx), y: round(o.velocity.y + dy) };
    o.position = { x: round(before.x + o.velocity.x), y: round(before.y + o.velocity.y) };
    var at = tick(s);
    if (o.firstStepAt == null) o.firstStepAt = at;
    var beat = {
      step: o.manualBeats.length + 1, at: at, before: before, after: clone(o.position),
      aimAngle: round(aim, 5), expectedAngle: round(expected, 5),
      angleCurrentDeg: round(currentError, 1), anglePreviousDeg: round(previousError, 1),
      matchedPreviousEarth: o.ruleSeal.target === "earth-center" &&
        currentError > 18 && previousError <= 18,
      valid: valid
    };
    o.manualBeats.push(beat);
    o.deflectionVectors.push({
      step: beat.step, dx: round(dx), dy: round(dy),
      angleDeg: beat.angleCurrentDeg, valid: valid
    });
    o.path.push(clone(o.position));
    o.velocityVectors.push(clone(o.velocity));
    o.step = o.manualBeats.length;
    o.aimAngle = o.step < 3
      ? orbitTargetAngle(o.ruleSeal.target, o.position) +
        orbitAimOffset(o.ruleSeal, o.step)
      : null;
    if (o.step === 3) {
      o.manualComplete = o.manualBeats.every(function (row) { return row.valid; });
      o.ruleRepeatReady = o.manualComplete;
    }
    return {
      state: s, ok: valid, beat: clone(beat), step: o.step,
      manualComplete: o.manualComplete,
      consequence: valid ? null : (beat.matchedPreviousEarth ? "aimed-at-previous-earth" : "aim-off-rule")
    };
  }

  function resetOrbitBeats(state0) {
    var o0 = state0.orbitLab || {};
    if (!o0.ruleSeal) return err(state0, "orbit-rule-required");
    if (o0.continuedAt || (state0.evidence && state0.evidence.k1))
      return err(state0, "completed-orbit-record-locked");
    if (o0.manualBeats && o0.manualBeats.length &&
        full(o0.manualAttempts, MAX_LONG_HISTORY))
      return err(state0, "orbit-attempt-limit");
    var s = ensureOrbitRuleFields(clone(state0)), o = s.orbitLab;
    if (o.manualBeats.length) {
      o.manualAttempts.push({
        seal: clone(o.ruleSeal), beats: clone(o.manualBeats),
        complete: o.manualComplete, resetAt: tick(s)
      });
    }
    o.step = 0;
    o.path = [{ x: 1, y: 0 }];
    o.position = { x: 1, y: 0 };
    o.velocity = { x: 0, y: round(ORBIT_SPEEDS[o.ruleSeal.speed] * 0.19) };
    o.velocityVectors = [clone(o.velocity)];
    o.deflectionVectors = [];
    o.manualBeats = [];
    o.firstStepAt = null;
    o.manualComplete = false;
    o.ruleRepeatReady = false;
    o.aimAngle = orbitTargetAngle(o.ruleSeal.target, o.position) +
      orbitAimOffset(o.ruleSeal, 0);
    return { state: s, ok: true, ghosts: o.manualAttempts.length };
  }

  function canonicalOrbitShape(target, speed, strength) {
    if (target === "same-vector") return "line";
    if (target === "ink-mark") return "wrong-center";
    var key = speed + ":" + strength;
    if (["slow:short", "medium:medium", "fast:long"].indexOf(key) >= 0) return "circle";
    if (key === "fast:short") return "away";
    return "ellipse";
  }

  /* 新紀錄的形狀必須由玩家三拍接出的實際路徑判讀，不能再用設定查表。
     canonical 表只保留給沒有 classificationSource 的舊存檔做相容驗證。 */
  function orbitShapeFromSimulation(target, sim) {
    if (target === "same-vector") return "line";
    if (target === "ink-mark") return "wrong-center";
    if (sim.minRadius < 0.28) return "crash";
    /* 粗紙帶是離散作圖，不以最後一點單獨命名；整條路都留在窄環帶
       才叫近圓。向外越過外帶才叫逃離，其餘仍是可閉合的橢圓族。 */
    if (sim.minRadius >= 0.82 && sim.maxRadius <= 1.08) return "circle";
    if (sim.maxRadius > 1.18) return "away";
    return "ellipse";
  }

  function orbitShapeForRun(seal, sim, run) {
    return run && run.classificationSource === "simulated-path-v1"
      ? orbitShapeFromSimulation(seal.target, sim)
      : canonicalOrbitShape(seal.target, seal.speed, seal.strength);
  }

  function closeNumber(a, b, epsilon) {
    return finite(a) && finite(b) && Math.abs(a - b) <= (epsilon == null ? 0.002 : epsilon);
  }

  /* 匯入時重播玩家三拍與牛頓續畫，避免只把 valid/pass 布林翻成 true
     就偽造出證據。這不是另一套物理；它重用同一組 canonical fixture。 */
  function orbitRecordAudit(lab) {
    try {
      var o = lab.orbitLab, seal = o.ruleSeal, beats = o.manualBeats || [];
      if (!seal || beats.length !== 3 || !o.manualComplete) return false;
      if (!ORBIT_SPEEDS[seal.speed] || !ORBIT_STRENGTHS[seal.strength] ||
          ORBIT_TARGETS.indexOf(seal.target) < 0 ||
          ORBIT_SHAPES.indexOf(seal.prediction) < 0 ||
          (seal.aimPattern != null && seal.aimPattern !== ORBIT_AIM_PATTERN_ID))
        return false;
      var position = { x: 1, y: 0 };
      var velocity = { x: 0, y: round(ORBIT_SPEEDS[seal.speed] * 0.19) };
      var expectedDeflections = [];
      var previousAt = seal.sealedAt;
      for (var i = 0; i < beats.length; i++) {
        var beat = beats[i], before = clone(position);
        if (!beat || beat.step !== i + 1 || !isFinite(beat.aimAngle) ||
            !closeNumber(beat.before.x, before.x) ||
            !closeNumber(beat.before.y, before.y) ||
            !finite(beat.at) || Math.floor(beat.at) !== beat.at ||
            beat.at <= previousAt) return false;
        var expected = orbitTargetAngle(seal.target, before);
        var currentError = Math.abs(normalizeAngle(beat.aimAngle - expected)) * 180 / Math.PI;
        var priorPosition = i ? beats[i - 1].before : before;
        var previousEarthAngle = Math.atan2(-priorPosition.y, -priorPosition.x);
        var previousError = Math.abs(normalizeAngle(beat.aimAngle - previousEarthAngle)) * 180 / Math.PI;
        var valid = currentError <= 18;
        var matchedPrevious = seal.target === "earth-center" &&
          currentError > 18 && previousError <= 18;
        if (!closeNumber(beat.expectedAngle, round(expected, 5), 0.00002) ||
            !closeNumber(beat.angleCurrentDeg, round(currentError, 1), 0.051) ||
            !closeNumber(beat.anglePreviousDeg, round(previousError, 1), 0.051) ||
            beat.valid !== valid || beat.matchedPreviousEarth !== matchedPrevious)
          return false;
        var magnitude = ORBIT_STRENGTHS[seal.strength] * 0.045;
        var rawDx = Math.cos(beat.aimAngle) * magnitude;
        var rawDy = Math.sin(beat.aimAngle) * magnitude;
        velocity = {
          x: round(velocity.x + rawDx),
          y: round(velocity.y + rawDy)
        };
        expectedDeflections.push({
          step: beat.step, dx: round(rawDx), dy: round(rawDy),
          angleDeg: round(currentError, 1), valid: valid
        });
        position = {
          x: round(before.x + velocity.x),
          y: round(before.y + velocity.y)
        };
        if (!closeNumber(beat.after.x, position.x) ||
            !closeNumber(beat.after.y, position.y)) return false;
        previousAt = beat.at;
      }
      if (o.firstStepAt !== beats[0].at || !(o.continuedAt > beats[2].at)) return false;
      var run = (o.ruleRuns || []).find(function (row) {
        return row && row.continuedAt === o.continuedAt;
      });
      if (!run || run.target !== seal.target || run.speed !== seal.speed ||
          run.strength !== seal.strength || run.prediction !== seal.prediction ||
          (run.aimPattern || null) !== (seal.aimPattern || null) ||
          run.sealedAt !== seal.sealedAt || run.firstStepAt !== o.firstStepAt ||
          JSON.stringify(run.playerBeats) !== JSON.stringify(beats))
        return false;
      var sim = orbitSimulationForRun(seal, beats, run);
      if (!sim) return false;
      var actualShape = orbitShapeForRun(seal, sim, run);
      var expectedClosedNote = actualShape === "circle"
        ? "玩家三拍後，牛頓沿同一封存規則續畫成近圓窄帶"
        : "玩家三拍後，牛頓沿同一封存規則續畫成閉合橢圓";
      var expectedOutcome = actualShape === "line" ? "parabola" :
        (actualShape === "wrong-center" ? "wrong-center" :
          (actualShape === "circle" ? "near-circle" :
            (actualShape === "away" ? "outer-band" :
              (sim.minRadius < 0.75 ? "inner-band" : "outer-band"))));
      if (run.actualShape !== actualShape || run.outcome !== expectedOutcome ||
          run.predictionMatched !== (seal.prediction === actualShape) ||
          run.minRadius !== sim.minRadius || run.maxRadius !== sim.maxRadius ||
          JSON.stringify(run.inkMark) !== JSON.stringify(sim.inkMark) ||
          run.continuedBeats !== (run.continuationSource === "player-three-beats+newton-27"
            ? sim.continuedBeats : Math.max(0, sim.path.length - 3)) ||
          JSON.stringify(run.path) !== JSON.stringify(sim.path) ||
          o.step !== 3 || o.complete !==
            (["circle", "ellipse"].indexOf(actualShape) >= 0 &&
              seal.target === "earth-center") ||
          o.ruleRepeatReady !== true || o.aimAngle !== null ||
          JSON.stringify(o.activeRule) !== JSON.stringify(run) ||
          JSON.stringify(o.path) !== JSON.stringify(sim.path) ||
          JSON.stringify(o.deflectionVectors) !== JSON.stringify(expectedDeflections) ||
          !closeNumber(o.position && o.position.x, sim.finalPosition.x) ||
          !closeNumber(o.position && o.position.y, sim.finalPosition.y) ||
          !closeNumber(o.velocity && o.velocity.x, sim.finalVelocity.x) ||
          !closeNumber(o.velocity && o.velocity.y, sim.finalVelocity.y) ||
          !o.closedRecord || o.closedRecord.id !== "closed" ||
          o.closedRecord.kind !== actualShape ||
          o.closedRecord.note !== expectedClosedNote ||
          JSON.stringify(o.closedRecord.path) !== JSON.stringify(sim.path))
        return false;
      return true;
    } catch (e) {
      return false;
    }
  }

  function orbitRunAudit(run) {
    if (!run || !ORBIT_SPEEDS[run.speed] || !ORBIT_STRENGTHS[run.strength] ||
        ORBIT_TARGETS.indexOf(run.target) < 0 ||
        ORBIT_SHAPES.indexOf(run.prediction) < 0 ||
        (run.continuationSource != null &&
          run.continuationSource !== "player-three-beats+newton-27") ||
        (run.aimPattern != null && run.aimPattern !== ORBIT_AIM_PATTERN_ID) ||
        !finite(run.sealedAt) || !finite(run.firstStepAt) ||
        !finite(run.continuedAt) ||
        !(run.sealedAt < run.firstStepAt &&
          run.firstStepAt < run.continuedAt) ||
        !Array.isArray(run.playerBeats) || run.playerBeats.length !== 3)
      return false;
    if (!orbitAttemptAudit({
      seal: {
        target: run.target,
        speed: run.speed,
        strength: run.strength,
        prediction: run.prediction,
        sealedAt: run.sealedAt,
        aimPattern: run.aimPattern || null
      },
      beats: run.playerBeats,
      complete: true,
      resetAt: run.continuedAt
    })) return false;
    var seal = {
      target: run.target, speed: run.speed, strength: run.strength,
      prediction: run.prediction, sealedAt: run.sealedAt,
      aimPattern: run.aimPattern || null
    };
    var sim = orbitSimulationForRun(seal, run.playerBeats, run);
    if (!sim) return false;
    if (run.classificationSource != null &&
        run.classificationSource !== "simulated-path-v1") return false;
    var actualShape = orbitShapeForRun(seal, sim, run);
    var expectedOutcome = actualShape === "line" ? "parabola" :
      (actualShape === "wrong-center" ? "wrong-center" :
        (actualShape === "circle" ? "near-circle" :
          (actualShape === "away" ? "outer-band" :
            (sim.minRadius < 0.75 ? "inner-band" : "outer-band"))));
    return run.actualShape === actualShape &&
      run.predictionMatched === (run.prediction === actualShape) &&
      run.outcome === expectedOutcome &&
      run.minRadius === sim.minRadius && run.maxRadius === sim.maxRadius &&
      JSON.stringify(run.inkMark) === JSON.stringify(sim.inkMark) &&
      JSON.stringify(run.path) === JSON.stringify(sim.path) &&
      run.continuedBeats === (run.continuationSource === "player-three-beats+newton-27"
        ? sim.continuedBeats : Math.max(0, sim.path.length - 3)) &&
      run.playerBeats[0].at === run.firstStepAt &&
      run.playerBeats[2].at < run.continuedAt;
  }

  function orbitBeatReplay(seal, beats) {
    try {
      if (!seal || !Array.isArray(beats) || beats.length > 3 ||
          !ORBIT_SPEEDS[seal.speed] || !ORBIT_STRENGTHS[seal.strength] ||
          ORBIT_TARGETS.indexOf(seal.target) < 0 ||
          ORBIT_SHAPES.indexOf(seal.prediction) < 0 ||
          !finite(seal.sealedAt) || Math.floor(seal.sealedAt) !== seal.sealedAt)
        return null;
      var position = { x: 1, y: 0 };
      var velocity = { x: 0, y: round(ORBIT_SPEEDS[seal.speed] * 0.19) };
      var path = [clone(position)];
      var velocityVectors = [clone(velocity)];
      var deflectionVectors = [];
      var previousAt = seal.sealedAt;
      for (var i = 0; i < beats.length; i++) {
        var beat = beats[i], before = clone(position);
        if (!beat || beat.step !== i + 1 || !finite(beat.aimAngle) ||
            !finite(beat.at) || Math.floor(beat.at) !== beat.at ||
            beat.at <= previousAt ||
            !closeNumber(beat.before && beat.before.x, before.x) ||
            !closeNumber(beat.before && beat.before.y, before.y))
          return null;
        var expected = orbitTargetAngle(seal.target, before);
        var currentError =
          Math.abs(normalizeAngle(beat.aimAngle - expected)) * 180 / Math.PI;
        var priorPosition = i ? beats[i - 1].before : before;
        var previousEarthAngle =
          Math.atan2(-priorPosition.y, -priorPosition.x);
        var previousError =
          Math.abs(normalizeAngle(beat.aimAngle - previousEarthAngle)) *
            180 / Math.PI;
        var valid = currentError <= 18;
        var matchedPrevious = seal.target === "earth-center" &&
          currentError > 18 && previousError <= 18;
        if (!closeNumber(beat.expectedAngle, round(expected, 5), 0.00002) ||
            !closeNumber(beat.angleCurrentDeg, round(currentError, 1), 0.051) ||
            !closeNumber(beat.anglePreviousDeg, round(previousError, 1), 0.051) ||
            beat.valid !== valid ||
            beat.matchedPreviousEarth !== matchedPrevious)
          return null;
        var magnitude = ORBIT_STRENGTHS[seal.strength] * 0.045;
        var dx = Math.cos(beat.aimAngle) * magnitude;
        var dy = Math.sin(beat.aimAngle) * magnitude;
        velocity = {
          x: round(velocity.x + dx),
          y: round(velocity.y + dy)
        };
        position = {
          x: round(before.x + velocity.x),
          y: round(before.y + velocity.y)
        };
        if (!closeNumber(beat.after && beat.after.x, position.x) ||
            !closeNumber(beat.after && beat.after.y, position.y))
          return null;
        deflectionVectors.push({
          step: beat.step,
          dx: round(dx),
          dy: round(dy),
          angleDeg: round(currentError, 1),
          valid: valid
        });
        path.push(clone(position));
        velocityVectors.push(clone(velocity));
        previousAt = beat.at;
      }
      var complete = beats.length === 3 && beats.every(function (row) {
        return row.valid === true;
      });
      return {
        position: position,
        velocity: velocity,
        path: path,
        velocityVectors: velocityVectors,
        deflectionVectors: deflectionVectors,
        firstStepAt: beats.length ? beats[0].at : null,
        lastAt: previousAt,
        step: beats.length,
        complete: complete,
        ruleRepeatReady: complete,
        aimAngle: beats.length < 3
          ? orbitTargetAngle(seal.target, position) +
            orbitAimOffset(seal, beats.length)
          : null
      };
    } catch (e) {
      return null;
    }
  }

  /* 玩家畫完前三拍後，牛頓必須從紙上最後一點接著畫，不能另起一張
     canonical 軌道偷換起點。這裡沿用同一個離散規則補完最多二十七拍；
     因而畫面上的第四拍一定承接玩家的第三拍，錯誤也會留在同一路徑。 */
  function continueOrbitFromPlayer(seal, beats) {
    var replay = orbitBeatReplay(seal, beats);
    if (!replay || !replay.complete) return null;
    var position = clone(replay.position), velocity = clone(replay.velocity);
    var path = clone(replay.path), ink = { x: 0, y: 0.55 };
    var minRadius = 1, maxRadius = 1, hitEarth = false, continuedBeats = 0;
    path.forEach(function (point) {
      var radius = Math.sqrt(point.x * point.x + point.y * point.y);
      minRadius = Math.min(minRadius, radius);
      maxRadius = Math.max(maxRadius, radius);
    });
    for (var i = 0; i < 27; i++) {
      var angle = orbitTargetAngle(seal.target, position);
      var magnitude = ORBIT_STRENGTHS[seal.strength] * 0.045;
      velocity = {
        x: round(velocity.x + Math.cos(angle) * magnitude),
        y: round(velocity.y + Math.sin(angle) * magnitude)
      };
      position = {
        x: round(position.x + velocity.x),
        y: round(position.y + velocity.y)
      };
      path.push(clone(position));
      continuedBeats += 1;
      var radius = Math.sqrt(position.x * position.x + position.y * position.y);
      minRadius = Math.min(minRadius, radius);
      maxRadius = Math.max(maxRadius, radius);
      if (radius < 0.28) { hitEarth = true; break; }
      if (Math.abs(position.x) > 2.45 || Math.abs(position.y) > 2.45) break;
    }
    return {
      path: path,
      outcome: orbitRuleOutcome(seal.target, minRadius, maxRadius, hitEarth),
      minRadius: round(minRadius, 3), maxRadius: round(maxRadius, 3),
      finalPosition: clone(position), finalVelocity: clone(velocity),
      inkMark: clone(ink), continuedBeats: continuedBeats
    };
  }

  function orbitSimulationForRun(seal, beats, run) {
    return run && run.continuationSource === "player-three-beats+newton-27"
      ? continueOrbitFromPlayer(seal, beats)
      : simulateOrbitRule(seal.target, seal.speed, seal.strength);
  }

  /* reset 前留下的幽靈紙也會被舞台畫出來，因此不能只驗座標是有限數。 */
  function orbitAttemptAudit(attempt) {
    var replay = orbitBeatReplay(
      attempt && attempt.seal,
      attempt && attempt.beats
    );
    return !!(replay && replay.step >= 1 &&
      finite(attempt.resetAt) &&
      Math.floor(attempt.resetAt) === attempt.resetAt &&
      attempt.resetAt > replay.lastAt &&
      attempt.complete === replay.complete);
  }

  function orbitPartialAudit(lab) {
    try {
      var orbit = lab && lab.orbitLab;
      if (!orbit || !orbit.ruleSeal || orbit.continuedAt != null) return false;
      var replay = orbitBeatReplay(orbit.ruleSeal, orbit.manualBeats || []);
      return !!(replay &&
        orbit.step === replay.step &&
        orbit.firstStepAt === replay.firstStepAt &&
        orbit.manualComplete === replay.complete &&
        orbit.ruleRepeatReady === replay.ruleRepeatReady &&
        ((replay.aimAngle == null && orbit.aimAngle == null) ||
          closeNumber(orbit.aimAngle, replay.aimAngle, 0.00002)) &&
        JSON.stringify(orbit.path) === JSON.stringify(replay.path) &&
        JSON.stringify(orbit.velocityVectors) ===
          JSON.stringify(replay.velocityVectors) &&
        JSON.stringify(orbit.deflectionVectors) ===
          JSON.stringify(replay.deflectionVectors) &&
        closeNumber(orbit.position && orbit.position.x, replay.position.x) &&
        closeNumber(orbit.position && orbit.position.y, replay.position.y) &&
        closeNumber(orbit.velocity && orbit.velocity.x, replay.velocity.x) &&
        closeNumber(orbit.velocity && orbit.velocity.y, replay.velocity.y) &&
        orbit.complete === false && orbit.closedRecord == null &&
        JSON.stringify(orbit.activeRule) === JSON.stringify(orbit.ruleSeal));
    } catch (e) {
      return false;
    }
  }

  function planetPredictionAudit(row) {
    if (!row || !PLANETS[row.planet] || !finite(row.exponent) ||
        row.sealed !== true || typeof row.revealedAfterSeal !== "boolean" ||
        !finite(row.sealedAt) || Math.floor(row.sealedAt) !== row.sealedAt ||
        !(row.revealedAfterSeal
          ? finite(row.openedAt) && Math.floor(row.openedAt) === row.openedAt &&
            row.openedAt > row.sealedAt
          : row.openedAt == null) ||
        row.superseded !== false ||
        (row.source != null && row.source !== "schema1-validated-k3"))
      return false;
    if (row.playerBand != null) {
      var bands = PLANET_BANDS[row.planet] || {};
      var band = bands[row.playerBand];
      if (!band || row.playerBandValue !== band.value ||
          row.playerBandLabel !== band.label ||
          row.playerBandMatched !==
            (Math.abs(band.value - PLANETS[row.planet].periodRatio) <=
              (row.planet === "mars" ? 0.25 : 1.5))) return false;
    }
    var actual = PLANETS[row.planet].periodRatio;
    var prediction = round(Math.pow(PLANETS[row.planet].radiusRatio,
      (row.exponent + 1) / 2), 3);
    var residual = round(Math.abs(prediction - actual) / actual * 100, 2);
    return row.actual === actual && row.prediction === prediction &&
      row.residualPct === residual && row.pass === (residual <= 3);
  }

  function tangentRecordAudit(record) {
    if (!record) return false;
    var runtime = record.source === "player-sealed-k0" &&
      record.note === "玩家在作圖前封存：沒有拉扯時沿當下方向直行";
    var migrated = record.source === "schema1-player-choice" &&
      record.note === "由舊對話紀錄確認：玩家選擇無拉扯時沿當下方向直行";
    return record.id === "tangent" && record.kind === "tangent" &&
      (runtime || migrated) &&
      JSON.stringify(record.path) === JSON.stringify(
        consequencePath("tangent", { x: 1, y: 0 }, { x: 0, y: 0.24 })
      );
  }

  function modelRunAudit(run) {
    if (!run || MODELS.indexOf(run.model) < 0 || CASES.indexOf(run.caseId) < 0 ||
        run.raw !== true || Object.prototype.hasOwnProperty.call(run, "patches"))
      return false;
    var expected = modelOutcome(run.model, run.caseId);
    return Object.keys(expected).every(function (key) {
      return JSON.stringify(run[key]) === JSON.stringify(expected[key]);
    });
  }

  function modelLoanAudit(loan) {
    if (!loan) return false;
    if (loan.caseId === "planets")
      return loan.kind === "separate-jupiter-flow" &&
        loan.text === "木星那一層另設流速";
    if (loan.caseId === "comet")
      return loan.kind === "comet-crosses-flow" &&
        loan.text === "彗星可以穿過流（未量過）";
    return false;
  }

  function continueOrbitRule(state0) {
    var o0 = state0.orbitLab || {};
    if (!o0.ruleSeal) return err(state0, "orbit-rule-required");
    if (o0.continuedAt != null || (state0.evidence && state0.evidence.k1))
      return err(state0, "completed-orbit-record-locked");
    if (!o0.manualComplete || (o0.manualBeats || []).length !== 3)
      return err(state0, "three-valid-vectors-required");
    if (!(o0.firstStepAt > o0.ruleSeal.sealedAt))
      return err(state0, "prediction-order-invalid");
    if (full(o0.ruleRuns, MAX_LONG_HISTORY))
      return err(state0, "orbit-run-limit");
    if (!orbitPartialAudit(state0))
      return err(state0, "invalid-orbit-record");
    var s = ensureOrbitRuleFields(clone(state0)), o = s.orbitLab, seal = o.ruleSeal;
    var sim = continueOrbitFromPlayer(seal, o.manualBeats);
    if (!sim) return err(state0, "invalid-orbit-continuation");
    var actualShape = orbitShapeFromSimulation(seal.target, sim);
    var compatibleOutcome = actualShape === "line" ? "parabola" :
      (actualShape === "wrong-center" ? "wrong-center" :
        (actualShape === "circle" ? "near-circle" :
          (actualShape === "away" ? "outer-band" :
            (sim.minRadius < 0.75 ? "inner-band" : "outer-band"))));
    var continuedAt = tick(s);
    var run = {
      id: o.ruleRuns.length + 1,
      target: seal.target, speed: seal.speed, strength: seal.strength,
      prediction: seal.prediction, actualShape: actualShape,
      predictionMatched: seal.prediction === actualShape,
      outcome: compatibleOutcome, path: clone(sim.path),
      minRadius: sim.minRadius, maxRadius: sim.maxRadius,
      inkMark: clone(sim.inkMark), sealedAt: seal.sealedAt,
      firstStepAt: o.firstStepAt, continuedAt: continuedAt,
      playerBeats: clone(o.manualBeats), continuedBeats: sim.continuedBeats,
      continuationSource: "player-three-beats+newton-27",
      classificationSource: "simulated-path-v1",
      aimPattern: seal.aimPattern || null
    };
    o.ruleRuns.push(run);
    o.activeRule = clone(run);
    o.path = clone(sim.path);
    o.position = clone(sim.finalPosition);
    o.velocity = clone(sim.finalVelocity);
    o.continuedAt = continuedAt;
    o.complete = ["circle", "ellipse"].indexOf(actualShape) >= 0 &&
      seal.target === "earth-center";
    if (o.complete) {
      o.closedRecord = {
        id: "closed", kind: actualShape, path: clone(sim.path),
        note: actualShape === "circle"
          ? "玩家三拍後，牛頓沿同一封存規則續畫成近圓窄帶"
          : "玩家三拍後，牛頓沿同一封存規則續畫成閉合橢圓"
      };
      s.days += 1;
    }
    return { state: s, ok: true, run: clone(run), complete: o.complete };
  }

  function runOrbitRule(state0, config, prediction) {
    config = config || {};
    if (ORBIT_TARGETS.indexOf(config.target) < 0) return err(state0, "bad-orbit-target");
    if (!ORBIT_SPEEDS[config.speed]) return err(state0, "bad-orbit-speed");
    if (!ORBIT_STRENGTHS[config.strength]) return err(state0, "bad-orbit-strength");
    if (ORBIT_PREDICTIONS.indexOf(prediction) < 0) return err(state0, "bad-orbit-prediction");
    var s = ensureOrbitRuleFields(clone(state0)), o = s.orbitLab;
    if (!o.tangentRecord) {
      o.tangentRecord = {
        id: "tangent", kind: "tangent",
        path: consequencePath("tangent", { x: 1, y: 0 }, { x: 0, y: 0.24 }),
        note: "在操作前封存的無作用切線預測"
      };
    }
    var sim = simulateOrbitRule(config.target, config.speed, config.strength);
    var run = {
      id: o.ruleRuns.length + 1,
      target: config.target, speed: config.speed, strength: config.strength,
      prediction: prediction, outcome: sim.outcome,
      predictionMatched: prediction === sim.outcome,
      path: clone(sim.path), minRadius: sim.minRadius, maxRadius: sim.maxRadius,
      inkMark: clone(sim.inkMark)
    };
    o.ruleRuns.push(run);
    o.activeRule = clone(run);
    o.attempt += 1;
    o.path = clone(sim.path);
    o.position = clone(sim.finalPosition);
    o.velocity = clone(sim.finalVelocity);
    o.consequence = null;
    o.ruleRepeatReady = false;
    if (sim.outcome === "near-circle") {
      o.closedRecord = {
        id: "closed", kind: "closed", path: clone(sim.path),
        note: "封存的方向、箭長與初速自行跑完後，維持在近圓窄帶"
      };
      if (!o.complete) s.days += 1;
      o.complete = true;
    }
    return { state: s, ok: true, run: clone(run), complete: o.complete };
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
    if (completedOrArchived(state0))
      return err(state0, "completed-chapter-locked");
    if (full(state0.claims && state0.claims.k1, MAX_LONG_HISTORY))
      return err(state0, "claim-attempt-limit");
    var s = clone(state0), picked = unique(records).sort();
    var source = s.sourceLab && s.sourceLab.tangentPrediction;
    var seal = s.orbitLab && s.orbitLab.ruleSeal;
    var ok = !!(source && source.sealed && source.choice === "tangent" &&
      s.orbitLab.tangentRecord && s.orbitLab.closedRecord &&
      seal && seal.target === "earth-center" &&
      s.orbitLab.manualComplete && s.orbitLab.continuedAt &&
      s.orbitLab.firstStepAt > seal.sealedAt) &&
      JSON.stringify(picked) === JSON.stringify(["closed", "tangent"]) &&
      concept === "forward-plus-inward-turn";
    recordClaim(s, "k1", picked, concept, ok, "assertK1", tick(s));
    if (ok) s.evidence.k1 = true;
    return { state: s, ok: ok, evidence: ok ? "K1" : null, reason: ok ? null : "claim-mismatch" };
  }

  function ensureScaleFields(s) {
    s.scaleLab = s.scaleLab || {};
    if (!("scalePrediction" in s.scaleLab)) s.scaleLab.scalePrediction = null;
    if (!Array.isArray(s.scaleLab.predictionAttempts)) s.scaleLab.predictionAttempts = [];
    if (!Array.isArray(s.scaleLab.conversionAttempts)) s.scaleLab.conversionAttempts = [];
    if (!Array.isArray(s.scaleLab.ratioAttempts)) s.scaleLab.ratioAttempts = [];
    if (!Array.isArray(s.scaleLab.relationAttempts)) s.scaleLab.relationAttempts = [];
    if (!("moonOneSecondSagMm" in s.scaleLab)) s.scaleLab.moonOneSecondSagMm = null;
    if (!("conversionCorrect" in s.scaleLab)) s.scaleLab.conversionCorrect = false;
    if (!("ratioCorrect" in s.scaleLab)) s.scaleLab.ratioCorrect = false;
    if (!("relationCorrect" in s.scaleLab)) s.scaleLab.relationCorrect = false;
    if (!Array.isArray(s.scaleLab.trials)) s.scaleLab.trials = [];
    return s;
  }

  function sealScalePrediction(state0, choice) {
    if (state0.evidence && state0.evidence.k2)
      return err(state0, "completed-scale-record-locked");
    if (SCALE_PREDICTIONS.indexOf(choice) < 0) return err(state0, "bad-scale-prediction");
    if (full(state0.scaleLab && state0.scaleLab.predictionAttempts,
        MAX_SHORT_HISTORY))
      return err(state0, "scale-attempt-limit");
    if (!state0.sourceLab || !state0.sourceLab.tangentPrediction ||
        !state0.sourceLab.tangentPrediction.sealed)
      return err(state0, "k0-source-required");
    var s = ensureScaleFields(clone(state0)), sc = s.scaleLab;
    if (sc.scalePrediction && sc.scalePrediction.sealed)
      return err(state0, "scale-prediction-already-sealed");
    var at = tick(s);
    sc.scalePrediction = { choice: choice, sealed: true, sealedAt: at, openedAt: null, matched: null };
    sc.predictionAttempts.push({ choice: choice, sealedAt: at });
    return { state: s, ok: true, prediction: clone(sc.scalePrediction) };
  }

  function convertMoonTime(state0, choice) {
    if (state0.evidence && state0.evidence.k2)
      return err(state0, "completed-scale-record-locked");
    if (["divide-60", "divide-3600"].indexOf(choice) < 0)
      return err(state0, "bad-time-conversion");
    if (full(state0.scaleLab && state0.scaleLab.conversionAttempts,
        MAX_SHORT_HISTORY))
      return err(state0, "scale-attempt-limit");
    var sc0 = state0.scaleLab || {};
    if (!sc0.scalePrediction || !sc0.scalePrediction.sealed)
      return err(state0, "scale-prediction-required");
    if (sc0.conversionCorrect) return err(state0, "completed-scale-conversion-locked");
    var s = ensureScaleFields(clone(state0)), sc = s.scaleLab;
    var ok = choice === "divide-3600", at = tick(s);
    sc.conversionAttempts.push({ choice: choice, ok: ok, at: at });
    if (sc.scalePrediction.openedAt == null) {
      sc.scalePrediction.openedAt = at;
      sc.scalePrediction.matched = sc.scalePrediction.choice === "one-over-3600";
    }
    if (ok) {
      sc.conversionCorrect = true;
      sc.moonOneSecondSagMm = round(TEACHING.moonSixtySecondSagM * 1000 / 3600, 1);
      sc.moonObservationRevealed = true;
    }
    return {
      state: s, ok: ok, divisor: choice === "divide-3600" ? 3600 : 60,
      moonOneSecondSagMm: ok ? sc.moonOneSecondSagMm : null,
      consequence: ok ? null : "time-not-squared"
    };
  }

  function judgeScaleRatio(state0, choice) {
    if (state0.evidence && state0.evidence.k2)
      return err(state0, "completed-scale-record-locked");
    var value = Number(choice);
    if ([60, 360, 3600, 36000].indexOf(value) < 0) return err(state0, "bad-scale-ratio");
    if (full(state0.scaleLab && state0.scaleLab.ratioAttempts,
        MAX_SHORT_HISTORY))
      return err(state0, "scale-attempt-limit");
    if (!state0.scaleLab || !state0.scaleLab.conversionCorrect)
      return err(state0, "time-conversion-required");
    if (state0.scaleLab.ratioCorrect)
      return err(state0, "completed-scale-ratio-locked");
    var s = ensureScaleFields(clone(state0)), sc = s.scaleLab;
    var ok = value === 3600;
    sc.ratioAttempts.push({ choice: value, ok: ok, at: tick(s) });
    if (ok) sc.ratioCorrect = true;
    return { state: s, ok: ok, ratio: value, consequence: ok ? null : "ratio-mismatch" };
  }

  function judgeScaleRelation(state0, choice) {
    if (state0.evidence && state0.evidence.k2)
      return err(state0, "completed-scale-record-locked");
    if (["add", "multiply", "unknown"].indexOf(choice) < 0)
      return err(state0, "bad-scale-relation");
    if (full(state0.scaleLab && state0.scaleLab.relationAttempts,
        MAX_SHORT_HISTORY))
      return err(state0, "scale-attempt-limit");
    if (choice === "multiply" &&
        full(state0.claims && state0.claims.k2, MAX_LONG_HISTORY))
      return err(state0, "claim-attempt-limit");
    if (!state0.scaleLab || !state0.scaleLab.ratioCorrect)
      return err(state0, "scale-ratio-required");
    if (state0.scaleLab.relationCorrect ||
        (state0.evidence && state0.evidence.k2))
      return err(state0, "completed-scale-record-locked");
    var s = ensureScaleFields(clone(state0)), sc = s.scaleLab;
    var ok = choice === "multiply";
    var relationAt = tick(s);
    sc.relationAttempts.push({ choice: choice, ok: ok, at: relationAt });
    if (ok) {
      sc.relationCorrect = true;
      sc.earthRadiusRatio = 60;
      sc.timeRatio = 60;
      sc.exponent = 2;
      sc.lawLocked = 2;
      sc.moonMatch = true;
      var trial = lawTrial(2, 60, 60);
      trial.id = sc.trials.length + 1;
      trial.sealed = true;
      trial.source = "player-scale-judgments";
      trial.revealedAfterSeal = true;
      sc.trials.push(trial);
      if (!s.evidence.k2) {
        s.evidence.k2 = true;
        recordClaim(s, "k2", ["earth-fall", "moon-sag", "scale-60-60"],
          "inverse-square-cross-scale", true, "judgeScaleRelation", relationAt);
      }
    }
    return {
      state: s, ok: ok, evidence: ok ? "K2" : null,
      consequence: ok ? null : "relation-mismatch"
    };
  }

  function setScale(state0, distanceRatio, timeRatio) {
    distanceRatio = Number(distanceRatio); timeRatio = Number(timeRatio);
    if (!finite(distanceRatio) || !finite(timeRatio) || distanceRatio < 1 || distanceRatio > 100 ||
        timeRatio < 1 || timeRatio > 120) return err(state0, "bad-scale");
    var s = clone(state0);
    if (round(distanceRatio, 1) !== s.scaleLab.earthRadiusRatio ||
        round(timeRatio, 1) !== s.scaleLab.timeRatio)
      revokeEvidence(s, ["k2", "k3", "k4", "k5"]);
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

  function scaleTrialAudit(trial) {
    if (!trial || trial.exponent !== 2 || trial.sealed !== true ||
        trial.revealedAfterSeal !== true ||
        ["player-scale-judgments", "schema1-validated-k2"].indexOf(trial.source) < 0)
      return false;
    var expected = lawTrial(2, 60, 60);
    return trial.moonSagM === expected.moonSagM &&
      trial.moonErrorPct === expected.moonErrorPct &&
      JSON.stringify(trial.periods) === JSON.stringify(expected.periods);
  }

  function tryDistanceLaw(state0, exponent) {
    exponent = Number(exponent);
    if (!finite(exponent) || exponent < 0 || exponent > 3 || Math.abs(exponent * 10 - Math.round(exponent * 10)) > 1e-8)
      return err(state0, "bad-exponent");
    var s = clone(state0), sc = s.scaleLab;
    if (sc.exponent !== round(exponent, 1))
      revokeEvidence(s, ["k2", "k3", "k4", "k5"]);
    var trial = lawTrial(exponent, sc.earthRadiusRatio, sc.timeRatio);
    trial.id = sc.trials.length + 1;
    sc.exponent = round(exponent, 1);
    sc.trials.push(trial);
    sc.moonMatch = trial.moonSagM >= MODERN.moonSagBandM[0] && trial.moonSagM <= MODERN.moonSagBandM[1];
    return { state: s, trial: clone(trial), moonMatch: sc.moonMatch };
  }

  function sealDistanceLaw(state0, exponent) {
    if (state0.scaleLab.lawLocked != null) return err(state0, "distance-law-already-sealed");
    exponent = Number(exponent);
    if ([0, 1, 2, 3].indexOf(exponent) < 0) return err(state0, "bad-exponent");
    var s = clone(state0), sc = s.scaleLab;
    revokeEvidence(s, ["k2", "k3", "k4", "k5"]);
    var trial = lawTrial(exponent, 60, 60);
    trial.id = sc.trials.length + 1;
    trial.sealed = true;
    trial.revealedAfterSeal = true;
    sc.earthRadiusRatio = 60;
    sc.timeRatio = 60;
    sc.exponent = exponent;
    sc.lawLocked = exponent;
    sc.trials.push(trial);
    sc.moonObservationRevealed = true;
    sc.moonMatch = trial.moonSagM >= MODERN.moonSagBandM[0] && trial.moonSagM <= MODERN.moonSagBandM[1];
    return { state: s, ok: true, trial: clone(trial), moonMatch: sc.moonMatch };
  }

  function reopenScalePrediction(state0) {
    if (state0.scaleLab.lawLocked == null) return { state: state0, noop: true };
    if (state0.planetLab && (state0.planetLab.revealed.mars || state0.planetLab.revealed.jupiter))
      return err(state0, "planet-observations-already-open");
    var s = clone(state0);
    revokeEvidence(s, ["k2", "k3", "k4", "k5"]);
    s.scaleLab.lawLocked = null;
    s.scaleLab.exponent = null;
    s.scaleLab.moonObservationRevealed = false;
    s.scaleLab.moonMatch = false;
    return { state: s };
  }

  function lockDistanceLaw(state0, exponent) {
    exponent = round(Number(exponent), 1);
    if (!finite(exponent)) return err(state0, "bad-exponent");
    var distinct = unique((state0.scaleLab.trials || []).map(function (t) { return t.exponent; }));
    if (distinct.length < 2) return err(state0, "two-trials-required");
    if (distinct.indexOf(exponent) < 0) return err(state0, "trial-required-before-lock");
    var s = clone(state0);
    if (s.scaleLab.lawLocked !== exponent)
      revokeEvidence(s, ["k2", "k3", "k4", "k5"]);
    s.scaleLab.lawLocked = exponent;
    return { state: s, locked: exponent };
  }

  function unlockDistanceLaw(state0) {
    if (state0.scaleLab.lawLocked == null) return { state: state0, noop: true };
    var s = clone(state0), old = s.scaleLab.lawLocked;
    revokeEvidence(s, ["k2", "k3", "k4", "k5"]);
    s.scaleLab.lawLocked = null;
    s.planetLab.predictions.forEach(function (p) { if (p.exponent === old) p.superseded = true; });
    return { state: s, unlocked: old };
  }

  function predictPlanet(state0, id) {
    if (!state0.evidence || !state0.evidence.k1 || !state0.evidence.k2)
      return err(state0, "k1-k2-required");
    if (state0.scaleLab.lawLocked == null) return err(state0, "law-lock-required");
    if (id !== "mars" && id !== "jupiter") return err(state0, "unknown-planet");
    if (state0.planetLab.revealed[id]) return err(state0, "observation-already-revealed");
    var s = clone(state0), exponent = s.scaleLab.lawLocked;
    var prediction = Math.pow(PLANETS[id].radiusRatio, (exponent + 1) / 2);
    var actual = PLANETS[id].periodRatio;
    var residualPct = Math.abs(prediction - actual) / actual * 100;
    var sealedAt = tick(s);
    var row = {
      id: s.planetLab.predictions.length + 1, planet: id, exponent: exponent,
      prediction: round(prediction, 3), sealed: true, sealedAt: sealedAt,
      openedAt: null, revealedAfterSeal: false,
      actual: actual, residualPct: round(residualPct, 2), pass: residualPct <= 3,
      superseded: false
    };
    row.openedAt = tick(s);
    row.revealedAfterSeal = row.openedAt > row.sealedAt;
    s.planetLab.predictions.push(row);
    s.planetLab.revealed[id] = true;
    s.planetLab.residuals[id] = row.residualPct;
    s.planetLab.crossScalePass = ["mars", "jupiter"].every(function (p) {
      return s.planetLab.predictions.some(function (r) { return r.planet === p && r.pass && !r.superseded; });
    });
    return { state: s, prediction: clone(row) };
  }

  function sealPlanetPrediction(state0, id, bandId) {
    if (!state0.evidence || !state0.evidence.k1 || !state0.evidence.k2)
      return err(state0, "k1-k2-required");
    if (state0.scaleLab.lawLocked == null) return err(state0, "law-lock-required");
    if (id !== "mars" && id !== "jupiter") return err(state0, "unknown-planet");
    var band = PLANET_BANDS[id] && PLANET_BANDS[id][bandId];
    if (!band) return err(state0, "unknown-planet-band");
    if (state0.planetLab.revealed[id]) return err(state0, "observation-already-revealed");
    if ((state0.planetLab.predictions || []).some(function (row) {
      return row.planet === id && row.superseded !== true;
    })) return err(state0, "planet-prediction-already-sealed");
    var s = clone(state0), exponent = s.scaleLab.lawLocked;
    var prediction = Math.pow(PLANETS[id].radiusRatio, (exponent + 1) / 2);
    var actual = PLANETS[id].periodRatio;
    var residualPct = Math.abs(prediction - actual) / actual * 100;
    var row = {
      id: s.planetLab.predictions.length + 1, planet: id, exponent: exponent,
      prediction: round(prediction, 3), sealed: true, sealedAt: tick(s),
      openedAt: null, revealedAfterSeal: false,
      actual: actual, residualPct: round(residualPct, 2), pass: residualPct <= 3,
      playerBand: bandId, playerBandValue: band.value,
      playerBandLabel: band.label,
      playerBandMatched: Math.abs(band.value - actual) <= (id === "mars" ? 0.25 : 1.5),
      superseded: false
    };
    s.planetLab.predictions.push(row);
    return { state: s, ok: true, prediction: clone(row) };
  }

  function revealPlanetPredictions(state0) {
    if (state0.planetLab.revealed.mars || state0.planetLab.revealed.jupiter)
      return err(state0, "planet-observations-already-open");
    var current = {};
    (state0.planetLab.predictions || []).forEach(function (row) {
      if (row && row.superseded !== true) current[row.planet] = row;
    });
    if (!(current.mars && current.jupiter))
      return err(state0, "two-planet-predictions-required");
    if (current.mars.revealedAfterSeal || current.jupiter.revealedAfterSeal)
      return err(state0, "planet-observations-already-open");
    var s = clone(state0);
    s.planetLab.predictions.forEach(function (row) {
      if (row.superseded === true) return;
      row.openedAt = tick(s);
      row.revealedAfterSeal = true;
      s.planetLab.revealed[row.planet] = true;
      s.planetLab.residuals[row.planet] = row.residualPct;
    });
    s.planetLab.crossScalePass = ["mars", "jupiter"].every(function (id) {
      return s.planetLab.predictions.some(function (row) {
        return row.planet === id && row.pass && row.revealedAfterSeal &&
          !row.superseded;
      });
    });
    return { state: s, ok: true, predictions: clone(s.planetLab.predictions) };
  }

  function resetPlanetReveals(state0) {
    if (state0.scaleLab.lawLocked != null) return err(state0, "unlock-law-first");
    var s = clone(state0);
    revokeEvidence(s, ["k3", "k4", "k5"]);
    s.planetLab.revealed = { mars: false, jupiter: false };
    s.planetLab.residuals = { mars: null, jupiter: null };
    s.planetLab.crossScalePass = false;
    return { state: s };
  }

  function assertK2(state0, records, concept) {
    if (completedOrArchived(state0))
      return err(state0, "completed-chapter-locked");
    if (full(state0.claims && state0.claims.k2, MAX_LONG_HISTORY))
      return err(state0, "claim-attempt-limit");
    var s = clone(state0), picked = unique(records).sort();
    var correctSources = JSON.stringify(picked) === JSON.stringify(["earth-fall", "moon-sag", "scale-60-60"]);
    var matchingTrial = s.scaleLab.trials.some(function (t) {
      return t.exponent === 2 && t.moonSagM >= MODERN.moonSagBandM[0] && t.moonSagM <= MODERN.moonSagBandM[1];
    });
    var ok = correctSources && s.scaleLab.relationCorrect === true &&
      s.scaleLab.conversionCorrect === true && s.scaleLab.ratioCorrect === true &&
      s.scaleLab.earthRadiusRatio === 60 && s.scaleLab.timeRatio === 60 &&
      s.scaleLab.lawLocked === 2 && s.scaleLab.moonObservationRevealed &&
      matchingTrial && concept === "inverse-square-cross-scale";
    recordClaim(s, "k2", picked, concept, ok, "assertK2", tick(s));
    if (ok) s.evidence.k2 = true;
    return { state: s, ok: ok, evidence: ok ? "K2" : null, reason: ok ? null : "claim-mismatch" };
  }

  function assertK3(state0, records, concept) {
    if (completedOrArchived(state0))
      return err(state0, "completed-chapter-locked");
    if (full(state0.claims && state0.claims.k3, MAX_LONG_HISTORY))
      return err(state0, "claim-attempt-limit");
    var s = clone(state0), picked = unique(records).sort();
    var ok = JSON.stringify(picked) === JSON.stringify(["jupiter-sealed", "mars-sealed"]) &&
      s.evidence.k1 && s.evidence.k2 && s.planetLab.crossScalePass &&
      concept === "withheld-data-prediction";
    recordClaim(s, "k3", picked, concept, ok, "assertK3", tick(s));
    if (ok) s.evidence.k3 = true;
    return { state: s, ok: ok, evidence: ok ? "K3" : null, reason: ok ? null : "claim-mismatch" };
  }

  function ensureCometFields(s) {
    s.cometLab = s.cometLab || {};
    if (!Array.isArray(s.cometLab.attempts)) s.cometLab.attempts = [];
    if (!("selectedConnection" in s.cometLab)) s.cometLab.selectedConnection = null;
    if (!("joined" in s.cometLab)) s.cometLab.joined = false;
    return s;
  }

  function connectCometTracks(state0, mode) {
    if (!(state0.evidence.k1 && state0.evidence.k2 && state0.evidence.k3))
      return err(state0, "k1-k3-required");
    if (!state0.proof || !state0.proof.press ||
        ["partial", "defer"].indexOf(state0.proof.press.openingChoice) < 0 ||
        !state0.proof.press.priorityRecord)
      return err(state0, "press-opening-choice-required");
    if (["hard-kink", "same-orbit"].indexOf(mode) < 0) return err(state0, "unknown-comet-connection");
    if (state0.cometLab && state0.cometLab.joined)
      return err(state0, "comet-connection-locked");
    if (full(state0.cometLab && state0.cometLab.attempts,
        MAX_LONG_HISTORY))
      return err(state0, "comet-attempt-limit");
    var s = ensureCometFields(clone(state0));
    var ok = mode === "same-orbit";
    var attempt = {
      id: s.cometLab.attempts.length + 1,
      mode: mode,
      ok: ok,
      at: tick(s),
      note: ok
        ? "十一月入向與十二月出向按日期、星位接成同一條高傾角軌道"
        : "只把兩張紙的最近端點硬接，接縫留下觀測不支持的折角"
    };
    s.cometLab.attempts.push(attempt);
    s.cometLab.selectedConnection = mode;
    if (ok) s.cometLab.joined = true;
    return {
      state: s,
      ok: ok,
      attempt: clone(attempt),
      consequence: ok ? null : "comet-kink"
    };
  }

  function modelOutcome(model, caseId) {
    var table = {
      inverseSquare: {
        moon: { fit: "matches", residual: 0.8, note: "同一距離律通過月球量級" },
        planets: { fit: "matches", residual: 1.6, note: "同一規則通過兩個行星週期" },
        comet: { fit: "matches", residual: 2.2, note: "同一中心規則通過逐夜星位" }
      },
      simpleVortex: {
        moon: { fit: "story", residual: null, note: "地球的小渦旋可定性帶月亮轉，沒有交出可核對數字" },
        planets: {
          fit: "mismatch", residual: 46.2, predictedYears: 6.4, observedYears: 11.9,
          note: "同一張流速表由火星推到木星時對不上"
        },
        comet: {
          fit: "mismatch", residual: null, direction: "opposes-fixed-flow",
          note: "高傾角且逆向的逐夜路徑與固定流面、流向衝突"
        }
      }
    };
    return clone(table[model][caseId]);
  }

  function ensureModelProtocolFields(s) {
    s.modelLab = s.modelLab || {};
    if (!Array.isArray(s.modelLab.runs)) s.modelLab.runs = [];
    if (!Array.isArray(s.modelLab.protocolAttempts)) s.modelLab.protocolAttempts = [];
    if (!s.modelLab.predictions || typeof s.modelLab.predictions !== "object")
      s.modelLab.predictions = {};
    if (!("protocolLocked" in s.modelLab)) s.modelLab.protocolLocked = false;
    if (!("protocol" in s.modelLab)) s.modelLab.protocol = null;
    if (!Array.isArray(s.modelLab.rowOrder)) s.modelLab.rowOrder = [];
    if (!Array.isArray(s.modelLab.completedRows)) s.modelLab.completedRows = [];
    if (!s.modelLab.rowStage || typeof s.modelLab.rowStage !== "object")
      s.modelLab.rowStage = {};
    if (!Array.isArray(s.modelLab.stampAttempts)) s.modelLab.stampAttempts = [];
    if (!Array.isArray(s.modelLab.loans)) s.modelLab.loans = [];
    if (!s.modelLab.loanDecisions || typeof s.modelLab.loanDecisions !== "object")
      s.modelLab.loanDecisions = {};
    if (!s.modelLab.loanDecisionAt || typeof s.modelLab.loanDecisionAt !== "object")
      s.modelLab.loanDecisionAt = {};
    if (!("comparisonSealed" in s.modelLab)) s.modelLab.comparisonSealed = false;
    if (!Array.isArray(s.modelLab.comparisonAttempts)) s.modelLab.comparisonAttempts = [];
    if (!("comparisonSealedAt" in s.modelLab)) s.modelLab.comparisonSealedAt = null;
    if (!("evidencePackage" in s.modelLab)) s.modelLab.evidencePackage = null;
    return s;
  }

  function beginLedgerRow(state0, caseId) {
    if (!(state0.evidence && state0.evidence.k1 && state0.evidence.k2 && state0.evidence.k3))
      return err(state0, "k1-k3-required");
    if (!state0.proof || !state0.proof.press ||
        ["partial", "defer"].indexOf(state0.proof.press.openingChoice) < 0 ||
        !state0.proof.press.priorityRecord)
      return err(state0, "press-opening-choice-required");
    if (CASES.indexOf(caseId) < 0) return err(state0, "unknown-model-case");
    if (caseId === "comet" &&
        (!state0.cometLab || state0.cometLab.joined !== true))
      return err(state0, "comet-join-required");
    var s = ensureModelProtocolFields(clone(state0)), ml = s.modelLab;
    if (ml.completedRows.indexOf(caseId) >= 0) return err(state0, "ledger-row-complete");
    if (!ml.rowStage[caseId]) {
      ml.rowOrder.push(caseId);
      ml.rowStage[caseId] = {
        openedAt: tick(s), forceStamp: null, vortexStamp: null,
        complete: false, completedAt: null
      };
      MODELS.forEach(function (model) {
        var run = { id: ml.runs.length + 1, model: model, caseId: caseId, raw: true };
        var outcome = modelOutcome(model, caseId);
        Object.keys(outcome).forEach(function (key) { run[key] = outcome[key]; });
        ml.runs.push(run);
      });
    }
    return {
      state: s, ok: true, row: clone(ml.rowStage[caseId]),
      thoughtSuccess: caseId === "moon"
    };
  }

  function ledgerExpectedStamp(model, caseId) {
    if (model === "inverseSquare") return "matches";
    return caseId === "moon" ? "story" : "mismatch";
  }

  function finishLedgerRow(s, caseId) {
    var ml = s.modelLab, row = ml.rowStage[caseId];
    if (!row || row.complete) return;
    if (!(row.forceStamp && row.vortexStamp)) return;
    if (caseId !== "moon" && !ml.loanDecisions[caseId]) return;
    row.complete = true;
    row.completedAt = tick(s);
    ml.completedRows.push(caseId);
    ml.gravityComplete = CASES.every(function (id) {
      return ml.completedRows.indexOf(id) >= 0 &&
        ml.rowStage[id] && ml.rowStage[id].forceStamp === "matches";
    });
    ml.vortexComplete = CASES.every(function (id) {
      return ml.completedRows.indexOf(id) >= 0 && ml.rowStage[id] &&
        ml.rowStage[id].vortexStamp === ledgerExpectedStamp("simpleVortex", id);
    });
  }

  function stampLedgerCell(state0, caseId, model, stamp) {
    if (CASES.indexOf(caseId) < 0 || MODELS.indexOf(model) < 0)
      return err(state0, "unknown-ledger-cell");
    if (LEDGER_STAMPS.indexOf(stamp) < 0) return err(state0, "unknown-ledger-stamp");
    if (full(state0.modelLab && state0.modelLab.stampAttempts,
        MAX_LONG_HISTORY))
      return err(state0, "stamp-attempt-limit");
    var stage0 = state0.modelLab && state0.modelLab.rowStage &&
      state0.modelLab.rowStage[caseId];
    if (!stage0) return err(state0, "ledger-row-required");
    if (stage0.complete) return err(state0, "ledger-row-complete");
    if ((model === "inverseSquare" && stage0.forceStamp) ||
        (model === "simpleVortex" && stage0.vortexStamp))
      return err(state0, "ledger-cell-already-stamped");
    if (caseId === "comet" && (!state0.cometLab || !state0.cometLab.joined))
      return err(state0, "comet-join-required");
    var s = ensureModelProtocolFields(clone(state0)), ml = s.modelLab;
    var expected = ledgerExpectedStamp(model, caseId), ok = stamp === expected;
    ml.stampAttempts.push({
      id: ml.stampAttempts.length + 1,
      caseId: caseId, model: model, stamp: stamp, expected: expected,
      ok: ok, at: tick(s)
    });
    if (ok) {
      if (model === "inverseSquare") ml.rowStage[caseId].forceStamp = stamp;
      else ml.rowStage[caseId].vortexStamp = stamp;
      finishLedgerRow(s, caseId);
    }
    return {
      state: s, ok: ok, expected: expected,
      row: clone(ml.rowStage[caseId]),
      awaitsLoan: ok && caseId !== "moon" &&
        ml.rowStage[caseId].forceStamp && ml.rowStage[caseId].vortexStamp &&
        !ml.loanDecisions[caseId],
      consequence: ok ? null : "stamp-bounced"
    };
  }

  function addModelLoan(state0, caseId) {
    if (["planets", "comet"].indexOf(caseId) < 0) return err(state0, "loan-not-available");
    var row0 = state0.modelLab && state0.modelLab.rowStage &&
      state0.modelLab.rowStage[caseId];
    if (!row0 || row0.forceStamp !== "matches" || row0.vortexStamp !== "mismatch")
      return err(state0, "ledger-stamps-required");
    if (state0.modelLab.loanDecisions && state0.modelLab.loanDecisions[caseId])
      return err(state0, "loan-decision-locked");
    var s = ensureModelProtocolFields(clone(state0)), ml = s.modelLab;
    var loan = caseId === "planets"
      ? { id: ml.loans.length + 1, caseId: caseId, kind: "separate-jupiter-flow",
          text: "木星那一層另設流速", at: tick(s) }
      : { id: ml.loans.length + 1, caseId: caseId, kind: "comet-crosses-flow",
          text: "彗星可以穿過流（未量過）", at: tick(s) };
    ml.loans.push(loan);
    ml.loanDecisions[caseId] = "loan";
    ml.loanDecisionAt[caseId] = loan.at;
    finishLedgerRow(s, caseId);
    return { state: s, ok: true, loan: clone(loan), rowComplete: true };
  }

  function declineModelLoan(state0, caseId) {
    if (["planets", "comet"].indexOf(caseId) < 0) return err(state0, "loan-not-available");
    var row0 = state0.modelLab && state0.modelLab.rowStage &&
      state0.modelLab.rowStage[caseId];
    if (!row0 || row0.forceStamp !== "matches" || row0.vortexStamp !== "mismatch")
      return err(state0, "ledger-stamps-required");
    if (state0.modelLab.loanDecisions && state0.modelLab.loanDecisions[caseId])
      return err(state0, "loan-decision-locked");
    var s = ensureModelProtocolFields(clone(state0));
    s.modelLab.loanDecisions[caseId] = "no-loan";
    s.modelLab.loanDecisionAt[caseId] = tick(s);
    finishLedgerRow(s, caseId);
    return { state: s, ok: true, rowComplete: true };
  }

  function ledgerClaimText(modelLab) {
    var planetLoan = (modelLab.loans || []).some(function (x) { return x.caseId === "planets"; });
    var cometLoan = (modelLab.loans || []).some(function (x) { return x.caseId === "comet"; });
    if (!planetLoan && !cometLoan)
      return "三份資料、兩套寫死的規矩：拉力帳三格都有數，而且都對得上；漩渦帳一格只有說法，另外兩格對不上。";
    if (planetLoan && !cometLoan)
      return "拉力帳三格都有數。漩渦帳的行星格是改了流速表才對上的，那張借條還在帳上；彗星格對不上。";
    if (!planetLoan && cometLoan)
      return "拉力帳三格都有數。漩渦帳的彗星格靠一個沒人量過的假設才講得通；行星格對不上。";
    return "拉力帳三格都有數。漩渦帳原先兩格都對不上；每次改成講得通，代價都留在借條上。";
  }

  function sealModelComparison(state0, claim) {
    if (["same", "all-vortices", "actual-ledger"].indexOf(claim) < 0)
      return err(state0, "unknown-model-claim");
    if (!(state0.evidence && state0.evidence.k1 &&
        state0.evidence.k2 && state0.evidence.k3))
      return err(state0, "k1-k3-required");
    if (!state0.proof || !state0.proof.press ||
        ["partial", "defer"].indexOf(state0.proof.press.openingChoice) < 0 ||
        !state0.proof.press.priorityRecord)
      return err(state0, "press-opening-choice-required");
    var ml0 = state0.modelLab || {};
    if (full(ml0.comparisonAttempts, MAX_SHORT_HISTORY))
      return err(state0, "comparison-attempt-limit");
    if (claim === "actual-ledger" &&
        full(state0.claims && state0.claims.k4, MAX_LONG_HISTORY))
      return err(state0, "claim-attempt-limit");
    if (ml0.comparisonSealed)
      return err(state0, "model-comparison-already-sealed");
    if (!CASES.every(function (id) {
      return (ml0.completedRows || []).indexOf(id) >= 0;
    })) return err(state0, "three-ledger-rows-required");
    var s = ensureModelProtocolFields(clone(state0)), ml = s.modelLab;
    var ok = claim === "actual-ledger";
    var at = tick(s);
    ml.comparisonAttempts.push({
      id: ml.comparisonAttempts.length + 1,
      claim: claim, ok: ok, at: at
    });
    ml.comparisonClaim = claim;
    if (ok) {
      ml.comparisonSealed = true;
      ml.comparisonSealedAt = at;
      ml.evidencePackage = {
        rowOrder: ml.rowOrder.slice(),
        stamps: CASES.map(function (id) {
          return {
            caseId: id,
            inverseSquare: ml.rowStage[id].forceStamp,
            vortex: ml.rowStage[id].vortexStamp,
            loanDecision: ml.loanDecisions[id] || null
          };
        }),
        loans: clone(ml.loans),
        claimText: ledgerClaimText(ml)
      };
      s.evidence.k4 = true;
      recordClaim(s, "k4",
        CASES.map(function (id) { return "ledger:" + id; })
          .concat(ml.loans.map(function (loan) { return "loan:" + loan.caseId; })),
        "same-rule-fewer-player-recorded-loans", true,
        "sealModelComparison", at);
    }
    return {
      state: s, ok: ok, evidence: ok ? "K4" : null,
      claimText: ok ? ml.evidencePackage.claimText : null,
      evidencePackage: ok ? clone(ml.evidencePackage) : null,
      reason: ok ? null : "comparison-overclaim"
    };
  }

  function setModelProtocol(state0, protocol) {
    if (!(state0.evidence.k2 && state0.evidence.k3)) return err(state0, "k2-k3-required");
    if (["shared-law-observed-initials", "same-start-all", "retune-law-per-body"].indexOf(protocol) < 0)
      return err(state0, "unknown-model-protocol");
    var s = ensureModelProtocolFields(clone(state0));
    var ok = protocol === "shared-law-observed-initials";
    var note = ok
      ? "同一條力學定律保持不變；月亮、行星、彗星各使用觀測到的初始位置與速度"
      : (protocol === "same-start-all"
        ? "把三種天體硬塞進同一個起點與速度，抹掉了本來要解釋的觀測資料"
        : "每遇到一種天體就重調定律，結果只能回述資料，不能算同一條規則的反驗");
    s.modelLab.protocolAttempts.push({
      id: s.modelLab.protocolAttempts.length + 1,
      protocol: protocol, ok: ok, note: note,
      patchTags: protocol === "retune-law-per-body" ? 3 : 0
    });
    if (ok) {
      s.modelLab.protocol = protocol;
      s.modelLab.protocolLocked = true;
    }
    return { state: s, ok: ok, protocol: protocol, note: note };
  }

  function sealModelPrediction(state0, model, prediction) {
    if (MODELS.indexOf(model) < 0) return err(state0, "unknown-model");
    if (!state0.modelLab.protocolLocked) return err(state0, "model-protocol-required");
    if (["one-law-three-skies", "moon-only", "patches-beyond-moon"].indexOf(prediction) < 0)
      return err(state0, "unknown-model-prediction");
    var s = ensureModelProtocolFields(clone(state0));
    if (s.modelLab.predictions[model]) return err(state0, "model-prediction-already-sealed");
    s.modelLab.predictions[model] = {
      model: model, prediction: prediction, sealed: true,
      beforeRuns: !s.modelLab.runs.some(function (r) { return r.model === model; })
    };
    return { state: s, ok: true, prediction: clone(s.modelLab.predictions[model]) };
  }

  function runModelSuite(state0, model) {
    if (MODELS.indexOf(model) < 0) return err(state0, "unknown-model");
    if (!state0.modelLab.protocolLocked) return err(state0, "model-protocol-required");
    if (!state0.modelLab.predictions || !state0.modelLab.predictions[model])
      return err(state0, "model-prediction-required");
    var s = ensureModelProtocolFields(clone(state0)), fresh = [];
    CASES.forEach(function (caseId) {
      if (s.modelLab.runs.some(function (r) { return r.model === model && r.caseId === caseId; })) return;
      var run = {
        id: s.modelLab.runs.length + 1,
        model: model, caseId: caseId,
        initialConditions: "observed-position-and-velocity",
        lawParametersChanged: false
      };
      var outcome = modelOutcome(model, caseId);
      Object.keys(outcome).forEach(function (k) { run[k] = outcome[k]; });
      s.modelLab.runs.push(run);
      fresh.push(clone(run));
    });
    s.modelLab.gravityComplete = CASES.every(function (c) {
      return s.modelLab.runs.some(function (r) { return r.model === "inverseSquare" && r.caseId === c; });
    });
    s.modelLab.vortexComplete = CASES.every(function (c) {
      return s.modelLab.runs.some(function (r) { return r.model === "simpleVortex" && r.caseId === c; });
    });
    return { state: s, ok: true, runs: fresh, complete: model === "inverseSquare" ? s.modelLab.gravityComplete : s.modelLab.vortexComplete };
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
    if (completedOrArchived(state0))
      return err(state0, "completed-chapter-locked");
    if (full(state0.claims && state0.claims.k4, MAX_LONG_HISTORY))
      return err(state0, "claim-attempt-limit");
    var s = clone(state0), picked = unique(records);
    /* schema 1 的整批自動跑表不再能兌換 K4。新版 K4 只能由逐格蓋章、
       玩家明確選擇是否貼借條、再封條的 append-only 路徑取得。 */
    var ok = !!(s.modelLab && s.modelLab.comparisonSealed &&
      s.modelLab.evidencePackage && s.evidence.k4 &&
      claim === "same-rule-fewer-patches");
    s.modelLab.selectedRecords = picked;
    s.modelLab.comparisonClaim = claim;
    recordClaim(s, "k4", picked, claim, ok, "assertK4", tick(s));
    return { state: s, ok: ok, evidence: ok ? "K4" : null, reason: ok ? null : "comparison-overclaim" };
  }

  function placeProofLink(state0, slot, evidenceId) {
    if (state0.archiveLab && state0.archiveLab.clipAttempts &&
        state0.archiveLab.clipAttempts.length)
      return err(state0, "archive-records-locked");
    if (!state0.evidence || !state0.evidence.k4) return err(state0, "k4-required");
    if (!PROOF_EXPECT[slot]) return err(state0, "unknown-proof-slot");
    if (typeof evidenceId !== "string" || PROOF_SOURCES.indexOf(evidenceId) < 0)
      return err(state0, "unknown-proof-source");
    if (full(state0.proof && state0.proof.slotAttempts,
        MAX_LONG_HISTORY))
      return err(state0, "proof-attempt-limit");
    if (/^K[1-4]$/.test(evidenceId) &&
        !(state0.evidence && state0.evidence[evidenceId.toLowerCase()]))
      return err(state0, "proof-evidence-required");
    if (slot === "shell" && (!state0.proof || !state0.proof.shellPageReady))
      return err(state0, "shell-page-not-ready");
    var s = ensureProofFields(clone(state0)), found = false, previous = null;
    var at = tick(s);
    s.proof.slots = s.proof.slots.map(function (r) {
      if (r.slot === slot) {
        found = true; previous = r.evidenceId;
        return { slot: slot, evidenceId: evidenceId, placedAt: at };
      }
      return r;
    });
    if (!found) s.proof.slots.push({ slot: slot, evidenceId: evidenceId, placedAt: at });
    s.proof.slotAttempts.push({
      id: s.proof.slotAttempts.length + 1,
      slot: slot, evidenceId: evidenceId,
      ok: PROOF_EXPECT[slot].indexOf(evidenceId) >= 0,
      at: at
    });
    if (previous !== evidenceId || (s.evidence && s.evidence.k5))
      revokeEvidence(s, ["k5"]);
    var ok = PROOF_EXPECT[slot].indexOf(evidenceId) >= 0;
    return { state: s, ok: ok, consequence: ok ? null : "geometry-break", slot: slot };
  }

  function assignCredit(state0, contribution, person) {
    if (state0.archiveLab && state0.archiveLab.clipAttempts &&
        state0.archiveLab.clipAttempts.length)
      return err(state0, "archive-records-locked");
    if (!CREDIT_EXPECT[contribution]) return err(state0, "unknown-contribution");
    if (["Hooke", "Halley", "Flamsteed", "Newton"].indexOf(person) < 0) return err(state0, "unknown-person");
    if (full(state0.proof && state0.proof.attributionAttempts,
        MAX_LONG_HISTORY))
      return err(state0, "proof-attempt-limit");
    if (!state0.proof || state0.proof.hookeScope !== HOOKE_SCOPE_EXPECT)
      return err(state0, "hooke-scope-required");
    var s = ensureProofFields(clone(state0));
    if (s.proof.attribution[contribution] !== person ||
        (s.evidence && s.evidence.k5)) revokeEvidence(s, ["k5"]);
    s.proof.attribution[contribution] = person;
    s.proof.attributionAttempts.push({
      id: s.proof.attributionAttempts.length + 1,
      contribution: contribution, person: person,
      ok: CREDIT_EXPECT[contribution] === person,
      at: tick(s)
    });
    return { state: s, ok: CREDIT_EXPECT[contribution] === person };
  }

  function ensureProofFields(s) {
    s.proof = s.proof || {};
    if (!Array.isArray(s.proof.hookeScopeAttempts)) s.proof.hookeScopeAttempts = [];
    if (!Array.isArray(s.proof.slotAttempts)) s.proof.slotAttempts = [];
    if (!Array.isArray(s.proof.attributionAttempts)) s.proof.attributionAttempts = [];
    if (!Array.isArray(s.proof.boundaryAttempts)) s.proof.boundaryAttempts = [];
    if (!("hookeScope" in s.proof)) s.proof.hookeScope = null;
    s.proof.press = s.proof.press || {};
    if (!("priorityRecord" in s.proof.press)) s.proof.press.priorityRecord = null;
    if (!("shellPageReady" in s.proof)) s.proof.shellPageReady = false;
    if (!("shellPagePlaced" in s.proof)) s.proof.shellPagePlaced = false;
    if (!s.proof.authorField || typeof s.proof.authorField !== "object")
      s.proof.authorField = { names: ["Newton", "Traveler"], travelerRemoved: false };
    if (!Array.isArray(s.proof.authorField.names))
      s.proof.authorField.names = ["Newton", "Traveler"];
    if (!("travelerRemoved" in s.proof.authorField))
      s.proof.authorField.travelerRemoved = s.proof.authorField.names.indexOf("Traveler") < 0;
    return s;
  }

  function revealShellPage(state0) {
    if (!state0.evidence || !["k1", "k2", "k3", "k4"].every(function (id) {
      return state0.evidence[id];
    })) return err(state0, "k1-k4-required");
    var s = ensureProofFields(clone(state0));
    if (!s.proof.shellPageReady) {
      s.proof.shellPageReady = true;
      s.proof.shellPageRevealedAt = tick(s);
    }
    return { state: s, ok: true, ready: true };
  }

  function placeShellPage(state0) {
    if (!state0.proof || !state0.proof.shellPageReady)
      return err(state0, "shell-page-not-ready");
    if (state0.proof.shellPagePlaced)
      return err(state0, "shell-page-already-placed");
    var r = placeProofLink(state0, "shell", "SHELL");
    if (r.error) return r;
    var s = ensureProofFields(r.state);
    s.proof.shellPagePlaced = true;
    s.proof.shellPagePlacedAt = tick(s);
    return { state: s, ok: true, slot: "shell", evidenceId: "SHELL" };
  }

  function removeTravelerFromAuthorField(state0) {
    if (!state0.proof || state0.proof.hookeScope !== HOOKE_SCOPE_EXPECT)
      return err(state0, "hooke-scope-required");
    if (!state0.proof.shellPagePlaced)
      return err(state0, "shell-page-placement-required");
    var s = ensureProofFields(clone(state0)), field = s.proof.authorField;
    if (field.travelerRemoved) return { state: s, ok: true, noop: true };
    field.names = field.names.filter(function (name) { return name !== "Traveler"; });
    if (field.names.indexOf("Newton") < 0) field.names.push("Newton");
    field.travelerRemoved = true;
    field.removedAt = tick(s);
    return {
      state: s,
      ok: true,
      names: field.names.slice(),
      repDelta: 1,
      repReason: "主動退出沒有完成之作品的作者欄，沒有把參與操作冒充成作者身分"
    };
  }

  function setHookeScope(state0, choice) {
    if (state0.archiveLab && state0.archiveLab.clipAttempts &&
        state0.archiveLab.clipAttempts.length)
      return err(state0, "archive-records-locked");
    if (!state0.evidence.k4) return err(state0, "k4-required");
    if (["hookeComplete", "newtonAlone", HOOKE_SCOPE_EXPECT].indexOf(choice) < 0)
      return err(state0, "unknown-hooke-scope");
    if (full(state0.proof && state0.proof.hookeScopeAttempts,
        MAX_LONG_HISTORY))
      return err(state0, "proof-attempt-limit");
    var s = ensureProofFields(clone(state0));
    var firstScopeAttempt = !s.proof.hookeScopeAttempts.some(function (row) {
      return row && row.choice === choice;
    });
    if (s.proof.hookeScope !== choice || (s.evidence && s.evidence.k5))
      revokeEvidence(s, ["k5"]);
    s.proof.hookeScope = choice;
    s.proof.hookeScopeAttempts.push({
      id: s.proof.hookeScopeAttempts.length + 1,
      choice: choice, ok: choice === HOOKE_SCOPE_EXPECT, at: tick(s)
    });
    var out = {
      state: s,
      ok: choice === HOOKE_SCOPE_EXPECT,
      consequence: choice === "hookeComplete" ? "hooke-overcredit" :
        (choice === "newtonAlone" ? "hooke-erasure" : null)
    };
    if (firstScopeAttempt && choice === "hookeComplete") {
      out.repDelta = -1;
      out.repReason = "把虎克的一封信擴張成整套證明，超過來源能支持的範圍";
    } else if (firstScopeAttempt && choice === "newtonAlone") {
      out.repDelta = -1;
      out.repReason = "把虎克已留下的問題方向從來源線抹去";
    }
    return out;
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
    if (!(state0.evidence.k1 && state0.evidence.k2 && state0.evidence.k3))
      return err(state0, "k1-k3-required");
    if (state0.evidence.k4) return err(state0, "partial-window-passed");
    if (state0.proof.press.openingChoice) return err(state0, "opening-choice-locked");
    if (scope !== "moon-planets") return err(state0, "dishonest-partial-scope");
    if (full(state0.proof && state0.proof.press &&
        state0.proof.press.proofs, MAX_LONG_HISTORY))
      return err(state0, "press-attempt-limit");
    var s = ensureProofFields(clone(state0));
    var openingAt = tick(s);
    s.proof.press.openingChoice = "partial";
    s.proof.press.priorityRecord = {
      route: "raised-early",
      source: "hooke-letter-1679",
      return: "署名爭議在完整排版前浮上桌",
      at: openingAt
    };
    consumeWindow(s, "proof", {
      kind: "partial", complete: false, supported: ["moon", "planets"],
      missing: ["comet", "model-comparison"], at: openingAt
    });
    return { state: s, ok: true, partial: true };
  }

  function deferPress(state0, reason) {
    if (!(state0.evidence.k1 && state0.evidence.k2 && state0.evidence.k3))
      return err(state0, "k1-k3-required");
    if (typeof reason !== "string" || !reason.trim() || reason.trim().length > 240)
      return err(state0, "delay-reason-required");
    if (full(state0.proof && state0.proof.press &&
        state0.proof.press.delays, MAX_LONG_HISTORY))
      return err(state0, "press-attempt-limit");
    if ((state0.evidence && state0.evidence.k5) ||
        (state0.proof && state0.proof.press &&
          state0.proof.press.proofs.some(function (record) {
            return record && record.kind === "complete" &&
              record.complete === true && record.superseded !== true;
          })))
      return err(state0, "completed-proof-locked");
    if (state0.proof && state0.proof.press &&
        state0.proof.press.status === "schedule-lost")
      return err(state0, "press-window-closed");
    var s = ensureProofFields(clone(state0));
    var delayAt = tick(s);
    if (!s.proof.press.openingChoice) {
      s.proof.press.openingChoice = "defer";
      s.proof.press.priorityRecord = {
        route: "raised-at-press",
        source: "hooke-letter-1679",
        return: "保留完整反驗時間，署名爭議延至印刷台",
        at: delayAt
      };
    }
    consumeWindow(s, "delay", { kind: "delay", reason: reason.trim(), at: delayAt });
    return { state: s, ok: true, delayed: true };
  }

  function setBoundary(state0, choice) {
    if (state0.archiveLab && state0.archiveLab.clipAttempts &&
        state0.archiveLab.clipAttempts.length)
      return err(state0, "archive-records-locked");
    if (!state0.evidence.k4) return err(state0, "k4-required");
    if (["mechanismSolved", "newtonAlone", "ruleEstablished"].indexOf(choice) < 0)
      return err(state0, "unknown-boundary-choice");
    if (full(state0.proof && state0.proof.boundaryAttempts,
        MAX_LONG_HISTORY))
      return err(state0, "proof-attempt-limit");
    var s = ensureProofFields(clone(state0));
    var firstBoundaryAttempt = !s.proof.boundaryAttempts.some(function (row) {
      return row && row.choice === choice;
    });
    if (s.proof.boundaryChoice !== choice || (s.evidence && s.evidence.k5))
      revokeEvidence(s, ["k5"]);
    s.proof.boundaryChoice = choice;
    s.proof.boundaryAttempts.push({
      id: s.proof.boundaryAttempts.length + 1,
      choice: choice, ok: choice === "ruleEstablished", at: tick(s)
    });
    if (choice !== "ruleEstablished") s.proof.overclaimTried = true;
    var out = {
      state: s, ok: choice === "ruleEstablished",
      consequence: choice === "mechanismSolved" ? "mechanism-slot-empty" :
        (choice === "newtonAlone" ? "credit-lines-break" : null)
    };
    if (firstBoundaryAttempt && choice === "mechanismSolved") {
      out.repDelta = -1;
      out.repReason = "把這批資料沒有量到的作用機制寫成已經證明";
    } else if (firstBoundaryAttempt && choice === "newtonAlone") {
      out.repDelta = -1;
      out.repReason = "把多人留下的概念、觀測與出版來源改寫成牛頓一人完成";
    }
    return out;
  }

  function proofAudit(state) {
    var proof = state && state.proof && typeof state.proof === "object"
      ? state.proof : {};
    var slots = {}, missing = [], wrong = [], creditWrong = [];
    (Array.isArray(proof.slots) ? proof.slots : []).forEach(function (r) {
      if (r && typeof r.slot === "string" && typeof r.evidenceId === "string")
        slots[r.slot] = r.evidenceId;
    });
    Object.keys(PROOF_EXPECT).forEach(function (slot) {
      if (!slots[slot]) missing.push(slot);
      else if (PROOF_EXPECT[slot].indexOf(slots[slot]) < 0) wrong.push(slot);
    });
    Object.keys(CREDIT_EXPECT).forEach(function (c) {
      if (!proof.attribution || proof.attribution[c] !== CREDIT_EXPECT[c]) creditWrong.push(c);
    });
    var hookeScopeOk = proof.hookeScope === HOOKE_SCOPE_EXPECT;
    var boundaryOk = proof.boundaryChoice === "ruleEstablished";
    var shellOk = proof.shellPageReady === true && proof.shellPagePlaced === true &&
      slots.shell === "SHELL";
    var author = proof.authorField || {};
    var authorOk = author.travelerRemoved === true && Array.isArray(author.names) &&
      author.names.length === 1 && author.names[0] === "Newton";
    var evidenceOk = !!(state.evidence && ["k1", "k2", "k3", "k4"].every(function (id) {
      return state.evidence[id];
    }));
    return {
      complete: !missing.length && !wrong.length && !creditWrong.length &&
        hookeScopeOk && boundaryOk && shellOk && authorOk && evidenceOk,
      missing: missing, wrong: wrong, creditWrong: creditWrong,
      hookeScope: proof.hookeScope || null, hookeScopeOk: hookeScopeOk,
      boundary: proof.boundaryChoice, boundaryOk: boundaryOk,
      shellOk: shellOk, authorOk: authorOk, evidenceOk: evidenceOk
    };
  }

  function previewProof(state0) {
    if (!state0.evidence.k4) return err(state0, "k4-required");
    return { state: state0, preview: proofAudit(state0) };
  }

  function submitProof(state0) {
    if (!state0.evidence || !["k1", "k2", "k3", "k4"].every(function (id) {
      return state0.evidence[id];
    })) return err(state0, "k1-k4-required");
    if (full(state0.proof && state0.proof.press &&
        state0.proof.press.proofs, MAX_LONG_HISTORY))
      return err(state0, "press-attempt-limit");
    if (full(state0.claims && state0.claims.k5, MAX_LONG_HISTORY))
      return err(state0, "claim-attempt-limit");
    if ((state0.evidence && state0.evidence.k5) ||
        (state0.proof && state0.proof.press &&
          state0.proof.press.proofs.some(function (record) {
            return record && record.kind === "complete" &&
              record.complete === true && record.superseded !== true;
          })))
      return err(state0, "completed-proof-locked");
    var s = ensureProofFields(clone(state0)), audit = proofAudit(s);
    var submittedAt = tick(s);
    var snapshot = {
      kind: audit.complete ? "complete" : "wrong-proof",
      complete: audit.complete, audit: clone(audit),
      superseded: false,
      submittedAt: submittedAt,
      openingChoice: s.proof.press.openingChoice,
      priorityRecord: clone(s.proof.press.priorityRecord),
      slots: clone(s.proof.slots), attribution: clone(s.proof.attribution),
      hookeScope: s.proof.hookeScope,
      boundaryChoice: s.proof.boundaryChoice,
      shellPagePlaced: s.proof.shellPagePlaced,
      authorField: clone(s.proof.authorField)
    };
    if (s.proof.press.status === "schedule-lost") {
      snapshot.window = null;
      snapshot.rescheduled = true;
      s.proof.press.proofs.push(snapshot);
    } else {
      snapshot.rescheduled = false;
      consumeWindow(s, "proof", snapshot);
    }
    if (!audit.complete) {
      s.proof.press.rushTried = true;
      return { state: s, ok: false, proof: clone(snapshot), consequence: "printed-broken-proof" };
    }
    s.evidence.k5 = true;
    recordClaim(s, "k5", ["K1", "K2", "K3", "K4", "SHELL"],
      "sources-and-rule-scoped", true, "submitProof", submittedAt);
    return { state: s, ok: true, evidence: "K5", proof: clone(snapshot) };
  }

  function ensureArchiveFields(s) {
    s.archiveLab = s.archiveLab || {};
    if (!Array.isArray(s.archiveLab.clipped)) s.archiveLab.clipped = [];
    if (!Array.isArray(s.archiveLab.clipAttempts)) s.archiveLab.clipAttempts = [];
    if (!("complete" in s.archiveLab)) s.archiveLab.complete = false;
    return s;
  }

  function clipEvidence(state0, evidenceId) {
    if (ARCHIVE_IDS.indexOf(evidenceId) < 0) return err(state0, "unknown-archive-evidence");
    if (!state0.evidence || !state0.evidence.k5 ||
        !state0.proof || !state0.proof.press ||
        !state0.proof.press.proofs.some(function (record) {
          return record && record.kind === "complete" &&
            record.complete === true && record.superseded !== true;
        }))
      return err(state0, "completed-proof-required");
    var key = evidenceId.toLowerCase();
    if (!state0.evidence || !state0.evidence[key]) return err(state0, "archive-evidence-required");
    if (state0.archiveLab && Array.isArray(state0.archiveLab.clipped) &&
        state0.archiveLab.clipped.indexOf(evidenceId) >= 0)
      return err(state0, "archive-evidence-already-clipped");
    var s = ensureArchiveFields(clone(state0));
    s.archiveLab.clipped.push(evidenceId);
    s.archiveLab.clipAttempts.push({
      id: s.archiveLab.clipAttempts.length + 1,
      evidenceId: evidenceId,
      at: tick(s)
    });
    s.archiveLab.complete = ARCHIVE_IDS.every(function (id) {
      return s.archiveLab.clipped.indexOf(id) >= 0;
    });
    return {
      state: s,
      ok: true,
      clipped: evidenceId,
      count: s.archiveLab.clipped.length,
      complete: s.archiveLab.complete
    };
  }

  /* ENGINE-CR-033：歸檔是一次有意義的玩家決策，不是五次沒有新推論的 UI 點擊。
     仍沿用 clipEvidence，保留 K1→K5 的 append-only 紀錄與既有章末守衛。 */
  function archiveEvidenceSet(state0) {
    var hasCompleteProof = !!(state0.evidence && state0.evidence.k5 &&
      state0.proof && state0.proof.press &&
      state0.proof.press.proofs.some(function (record) {
        return record && record.kind === "complete" &&
          record.complete === true && record.superseded !== true;
      }));
    if (!hasCompleteProof) return {
      state: state0,
      error: "completed-proof-required",
      userMessage: "完整校樣還沒完成，現在不能把五張證據收進筆記。"
    };
    var missing = ARCHIVE_IDS.filter(function (evidenceId) {
      return !(state0.evidence && state0.evidence[evidenceId.toLowerCase()]);
    });
    if (missing.length) return {
      state: state0,
      error: "archive-evidence-set-incomplete",
      userMessage: "還有證據沒完成：" + missing.join("、") + "。",
      missing: missing
    };
    var s = state0, added = [];
    for (var i = 0; i < ARCHIVE_IDS.length; i += 1) {
      var evidenceId = ARCHIVE_IDS[i];
      if (s.archiveLab && Array.isArray(s.archiveLab.clipped) &&
          s.archiveLab.clipped.indexOf(evidenceId) >= 0) continue;
      var r = clipEvidence(s, evidenceId);
      if (r.error) return {
        state: state0,
        error: r.error,
        userMessage: "這組證據還不能歸檔；請回頭檢查未完成的紙。",
        failedAt: evidenceId
      };
      s = r.state;
      added.push(evidenceId);
    }
    return {
      state: s,
      ok: true,
      archived: ARCHIVE_IDS.slice(),
      added: added,
      complete: !!(s.archiveLab && s.archiveLab.complete)
    };
  }

  var api = {
    initialState: initialState,
    advanceTransition: advanceTransition,
    sealTangentPrediction: sealTangentPrediction,
    sealOrbitRule: sealOrbitRule, nudgeOrbitAim: nudgeOrbitAim,
    commitOrbitBeat: commitOrbitBeat, resetOrbitBeats: resetOrbitBeats,
    continueOrbitRule: continueOrbitRule,
    assertK1: assertK1,
    sealScalePrediction: sealScalePrediction, convertMoonTime: convertMoonTime,
    judgeScaleRatio: judgeScaleRatio, judgeScaleRelation: judgeScaleRelation,
    resetPlanetReveals: resetPlanetReveals,
    predictPlanet: predictPlanet,
    sealPlanetPrediction: sealPlanetPrediction,
    revealPlanetPredictions: revealPlanetPredictions,
    assertK2: assertK2, assertK3: assertK3,
    connectCometTracks: connectCometTracks,
    beginLedgerRow: beginLedgerRow, stampLedgerCell: stampLedgerCell,
    addModelLoan: addModelLoan, declineModelLoan: declineModelLoan,
    sealModelComparison: sealModelComparison,
    placeProofLink: placeProofLink, assignCredit: assignCredit, setHookeScope: setHookeScope,
    revealShellPage: revealShellPage, placeShellPage: placeShellPage,
    removeTravelerFromAuthorField: removeTravelerFromAuthorField,
    submitPartialProof: submitPartialProof, setBoundary: setBoundary,
    previewProof: previewProof, submitProof: submitProof, deferPress: deferPress,
    clipEvidence: clipEvidence, archiveEvidenceSet: archiveEvidenceSet,
    _FIXTURE: { teaching: TEACHING, modernCheck: MODERN, planets: PLANETS },
    _PLANET_BANDS: clone(PLANET_BANDS),
    _ORBIT_RULES: {
      speeds: clone(ORBIT_SPEEDS), strengths: clone(ORBIT_STRENGTHS),
      targets: ORBIT_TARGETS.slice(), predictions: ORBIT_PREDICTIONS.slice(),
      shapes: ORBIT_SHAPES.slice(), aimPattern: ORBIT_AIM_PATTERN_ID,
      aimOffsets: ORBIT_AIM_OFFSETS.slice()
    },
    _CASES: CASES.slice(), _MODELS: MODELS.slice(),
    _ARCHIVE_IDS: ARCHIVE_IDS.slice(),
    _PROOF_EXPECT: clone(PROOF_EXPECT), _CREDIT_EXPECT: clone(CREDIT_EXPECT),
    _HOOKE_SCOPE_EXPECT: HOOKE_SCOPE_EXPECT,
    _ledgerClaimText: ledgerClaimText,
    _proofAudit: proofAudit,
    _orbitRecordAudit: orbitRecordAudit,
    _orbitRunAudit: orbitRunAudit,
    _orbitAttemptAudit: orbitAttemptAudit,
    _orbitPartialAudit: orbitPartialAudit,
    _orbitShapeFromSimulation: orbitShapeFromSimulation,
    _tangentRecordAudit: tangentRecordAudit,
    _scaleTrialAudit: scaleTrialAudit,
    _planetPredictionAudit: planetPredictionAudit,
    _modelRunAudit: modelRunAudit,
    _modelLoanAudit: modelLoanAudit
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.GB = root.GB || {}; root.GB.Engine4 = api;
})(typeof window !== "undefined" ? window : globalThis);
