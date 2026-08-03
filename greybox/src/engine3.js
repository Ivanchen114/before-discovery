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
  var DOSSIER_LOCATIONS = ["deck", "cabin"];
  var DOSSIER_STAGES = ["dock", "steady", "depart", "brake"];
  var DOSSIER_RELEASES = ["hand", "string", "latch"];
  var DOSSIER_SPEED_RECORDS = ["none", "verbal", "beats"];
  var DOSSIER_POSITION_RECORDS = ["deck", "shore", "dual"];
  var DOSSIER_REPEATS = [1, 2, 3];
  var DOSSIER_SPEED_BANDS = ["slow", "mid", "fast"];
  var DOSSIER_FORCE_BANDS = ["soft", "hard"];
  var DOSSIER_BEAT_BANDS = ["slow", "mid", "fast"];
  var DOSSIER_VESSEL_IDS = ["small", "captain", "large"];
  var DOSSIER_VESSELS = {
    small: {
      id: "small", name: "港內小艇", mastHeight: 7,
      hardAcceleration: 0.70, rowingCrew: "兩名港內水手", rowingMethod: "短槳",
      borrowDays: 1
    },
    captain: {
      id: "captain", name: "維達爾船長的船", mastHeight: 12,
      hardAcceleration: 0.57, rowingCrew: "四名維達爾號水手", rowingMethod: "常槳",
      borrowDays: 0
    },
    large: {
      id: "large", name: "隔壁大貨船", mastHeight: 18,
      hardAcceleration: 0.50, rowingCrew: "六名貨船水手", rowingMethod: "長槳",
      borrowDays: 1
    }
  };
  var DOSSIER_SPEED_VALUES = { slow: 1.8, mid: 3.0, fast: 4.2 };
  var DOSSIER_BEAT_VALUES = {
    slow: { dt: 0.70, error: 0.02, quality: "點較少，只能看出大致走向" },
    /*
     * 中拍必須讓最短的 7 公尺桅杆也留下至少 4 個位置（3 段間距），
     * 否則玩家明明選了「較平衡」，卻會因換成小艇而在未告知的情況下
     * 失去船況分類資格。慢拍仍刻意保留「點太少」的診斷後果。
     */
    mid: { dt: 0.39, error: 0.02, quality: "點數與讀值清楚度較平衡" },
    fast: {
      dt: 0.35, error: 0.12,
      quality: "點較密，但岸上來不及點準；單張原紙不足以判斷船速趨勢"
    }
  };
  var DOSSIER_RELEASE_DV = {
    latch: [0, 0.01, -0.008],
    string: [0.03, -0.04, 0.02],
    hand: [0.28, -0.22, 0.05]
  };
  /*
   * 三位記錄者各用一組固定、近零均值的讀值誤差。原紙編號會輪替起點：
   * 同一設定重做仍可重現，但不會三回都得到完全相同的筆誤。
   */
  var DOSSIER_READ_ERROR = [0, 1, -1, 0.5, -0.5, 1, -1, 0.25, -0.25];
  var DOSSIER_STONE_READ_ERROR = [0, -0.75, 0.5, 1, -0.5, 0.25, -1, 0.75, -0.25];
  var DOSSIER_SHIP_READ_ERROR = [0, 0.5, -1, 0.75, -0.25, 1, -0.5, 0.25, -0.75];
  var DOSSIER_FIXTURES = {
    dock: { vessel: "dock", classification: "停泊", offsets: [-0.03, 0.02, 0.01], shoreGaps: [0, 0, 0], landing: "foot" },
    steady: { vessel: "steady", classification: "近似穩速", offsets: [-0.04, 0.05, 0.02], shoreGaps: [1.5, 1.5, 1.5], landing: "foot" },
    depart: { vessel: "accelerating", classification: "正在變快", offsets: [-0.72, -0.66, -0.75], shoreGaps: [1.0, 1.6, 2.3], landing: "aft" },
    brake: { vessel: "decelerating", classification: "正在變慢", offsets: [0.69, 0.63, 0.71], shoreGaps: [2.3, 1.6, 1.0], landing: "fore" }
  };
  var DOSSIER_CABIN_RECORDS = [
    {
      id: "C-dock", stage: "dock", label: "停泊對照",
      speedPaper: "岸標位置：0、0、0 格（停泊）",
      water: "水面偏斜：0、0、0 格",
      local: "水面沒有固定偏向 3／3；落球正下方 3／3"
    },
    {
      id: "C-steady", stage: "steady", label: "出港平駛對照",
      speedPaper: "每拍前進：1.5、1.5、1.5 格（近似走穩）",
      water: "水面偏斜：0、0、0 格",
      local: "水面沒有固定偏向 3／3；落球正下方 3／3"
    }
  ];

  function dossierRound(value) {
    return Math.round(Number(value) * 1000) / 1000;
  }
  function dossierBeatTimes(dt, fallTime) {
    var xs = [], i = 0;
    while (i * dt <= fallTime + 1e-9 && xs.length < 12) {
      xs.push(dossierRound(i * dt));
      i += 1;
    }
    return xs;
  }
  function dossierVessel(vesselId) {
    return DOSSIER_VESSELS[vesselId] || DOSSIER_VESSELS.captain;
  }
  function dossierAcceleration(vesselId, forceBand) {
    var hard = dossierVessel(vesselId).hardAcceleration;
    return forceBand === "soft" ? hard * 0.58 : hard;
  }
  function dossierMotion(stage, vesselId, speedBand, forceBand, releaseVelocity, t) {
    var selectedV0 = DOSSIER_SPEED_VALUES[speedBand] || DOSSIER_SPEED_VALUES.mid;
    var v0 = 0, a = 0;
    if (stage === "steady") v0 = selectedV0;
    if (stage === "depart") {
      a = dossierAcceleration(vesselId, forceBand);
      /*
       * 導引中的「解纜後第一段」與下一輪「出港平駛」必須在放手時
       * 具有同一向前速度，才能真的只比較放手後船速是否繼續改變。
       * 石頭因此帶著一般航速前進；船在它離手後繼續變快而超過它。
       * 若放手初速為 0，岸紙會畫成石頭垂直下落；若改成 2a，則又會
       * 同時改變初速與加速度，兩種都破壞原紙要支持的單變因比較。
       * 相對偏移 stoneX − mastX = −½at² 與初速無關，落點與斷言判定不變。
       */
      v0 = selectedV0;
    }
    if (stage === "brake") {
      /* 收槳發生在巡航中：放手初速沿用出港平駛的一般航速。 */
      v0 = selectedV0;
      a = -dossierAcceleration(vesselId, forceBand);
    }
    var mastX = v0 * t + 0.5 * a * t * t;
    var stoneX = (v0 + releaseVelocity) * t;
    return {
      mastX: dossierRound(mastX),
      stoneX: dossierRound(stoneX),
      relativeX: dossierRound(stoneX - mastX)
    };
  }
  function dossierReadError(sequence, beatIndex, recordId) {
    var shift = Math.max(0, (Number(recordId) || 1) - 1);
    return sequence[(beatIndex + shift) % sequence.length];
  }
  function dossierClassificationFromGaps(gaps, readingError) {
    var unclassified = {
      classification: "船速無法判讀・未分類",
      vessel: "unclassified"
    };
    if (!Array.isArray(gaps) || gaps.length < 3 ||
        gaps.some(function (gap) { return typeof gap !== "number" || !isFinite(gap); }))
      return unclassified;
    var error = typeof readingError === "number" && isFinite(readingError)
      ? Math.max(0, readingError) : 0;
    /*
     * 快鼓雖然留下較多點，但觀察者的讀值誤差已大到足以遮住本章
     * 加速／減速的逐拍差異。這時只能保留原紙為「未分類」；
     * 不可因閾值跟著誤差放寬，反把正在改變速度的船誤判成穩速。
     */
    if (error > 0.08) return unclassified;
    var maxAbs = Math.max.apply(null, gaps.map(function (gap) { return Math.abs(gap); }));
    if (maxAbs <= Math.max(0.06, error * 3)) return {
      classification: "停泊", vessel: "dock"
    };
    var deltas = [];
    for (var i = 1; i < gaps.length; i += 1) deltas.push(gaps[i] - gaps[i - 1]);
    var net = gaps[gaps.length - 1] - gaps[0];
    var deltaTolerance = Math.max(0.025, error * 2);
    var netThreshold = Math.max(0.12, error * 4);
    var increasing = deltas.every(function (delta) { return delta >= -deltaTolerance; });
    var decreasing = deltas.every(function (delta) { return delta <= deltaTolerance; });
    if (net >= netThreshold && increasing) return {
      classification: "正在變快", vessel: "accelerating"
    };
    if (net <= -netThreshold && decreasing) return {
      classification: "正在變慢", vessel: "decelerating"
    };
    var spread = Math.max.apply(null, gaps) - Math.min.apply(null, gaps);
    /*
     * 「近似穩速」也必須是保守判讀。中拍的確定性讀值抖動最多約
     * 0.07 公尺；門檻若放到 0.10，弱加減速會被錯收成穩速。
     * 無法在本紙精度內分清時寧可未分類，不替玩家補答案。
     */
    if (spread <= Math.max(0.08, error * 3) && Math.abs(net) < netThreshold) return {
      classification: "近似穩速", vessel: "steady"
    };
    return unclassified;
  }
  function dossierGapsFromShorePaper(record) {
    var shore = record && record.papers && record.papers.shore;
    var beats = shore && Array.isArray(shore.beats) ? shore.beats : [];
    if (beats.length < 2) {
      var legacyGaps = record && Array.isArray(record.shoreGaps) ? record.shoreGaps : null;
      return legacyGaps && legacyGaps.length >= 3 ? legacyGaps.slice() : null;
    }
    var gaps = [];
    for (var i = 1; i < beats.length; i += 1) {
      if (!beats[i] || !beats[i - 1] ||
          typeof beats[i].mastX !== "number" || !isFinite(beats[i].mastX) ||
          typeof beats[i - 1].mastX !== "number" || !isFinite(beats[i - 1].mastX))
        return null;
      gaps.push(dossierRound(beats[i].mastX - beats[i - 1].mastX));
    }
    return gaps;
  }
  function dossierReclassifyRecord(record) {
    var hasShorePaper = !!(record && record.speedRecord === "beats" &&
      dossierHasVisibleShoreSpeedPaper(record));
    if (hasShorePaper) {
      var shoreGaps = dossierGapsFromShorePaper(record);
      var paperError = record.papers && record.papers.shore
        ? record.papers.shore.readingError : null;
      if (!(typeof paperError === "number" && isFinite(paperError))) {
        var beatSpec = DOSSIER_BEAT_VALUES[record.beatBand] || DOSSIER_BEAT_VALUES.mid;
        paperError = beatSpec.error;
      }
      var result = dossierClassificationFromGaps(shoreGaps, paperError);
      record.shoreGaps = shoreGaps;
      record.classification = result.classification;
      record.vessel = result.vessel;
      return result;
    }
    record.shoreGaps = null;
    record.vessel = "unclassified";
    record.classification = record.speedRecord === "verbal"
      ? "只有口頭判斷・未分類"
      : (record.speedRecord === "beats"
        ? "有等拍鼓點・缺岸上船位・未分類"
        : "未記船速・未分類");
    return { classification: record.classification, vessel: record.vessel };
  }
  function dossierCabinRowMatchesStage(row, stage) {
    var instrument = row && row.instrument;
    if (!instrument && row && row.water === "水面沒有固定偏向" &&
        row.ball === "小球落在放手點正下方") instrument = "combined";
    if (!row || row.stage !== stage ||
        ["drip", "toss", "combined"].indexOf(instrument) < 0 ||
        !Array.isArray(row.shoreGaps) || row.shoreGaps.length !== 3 ||
        row.shoreGaps.some(function (gap) {
          return typeof gap !== "number" || !isFinite(gap);
        }))
      return false;
    var observationMatches = instrument === "drip"
      ? row.water === "水滴落在碗內標記附近" && row.ball === "本輪未使用石球"
      : (instrument === "toss"
        ? row.water === "本輪未使用滴水壺" && row.ball === "石球直上拋起後落回手邊附近"
        : row.water === "水面沒有固定偏向" && row.ball === "小球落在放手點正下方");
    if (!observationMatches) return false;
    if (stage === "dock") {
      return row.classification === "岸標位置不變" &&
        row.shoreGaps.every(function (gap) { return Math.abs(gap) <= 0.05; });
    }
    if (stage === "steady") {
      var maxGap = Math.max.apply(null, row.shoreGaps);
      var minGap = Math.min.apply(null, row.shoreGaps);
      var meanGap = row.shoreGaps.reduce(function (sum, gap) { return sum + gap; }, 0) /
        row.shoreGaps.length;
      return row.classification === "岸標間距近乎相同" &&
        meanGap > 0.5 && maxGap - minGap <= 0.08;
    }
    return false;
  }
  function dossierClose(a, b, tolerance) {
    return typeof a === "number" && isFinite(a) &&
      typeof b === "number" && isFinite(b) &&
      Math.abs(a - b) <= tolerance;
  }
  function dossierDualAlignmentData(record) {
    var shore = record && record.papers && record.papers.shore;
    var ship = record && record.papers && record.papers.ship;
    var shoreBeats = shore && Array.isArray(shore.beats) ? shore.beats : [];
    var shipBeats = ship && Array.isArray(ship.beats) ? ship.beats : [];
    if (record && record.filed === false) return { ok: false, reason: "paper-not-filed" };
    if (!shore || !ship || shoreBeats.length < 4 || shoreBeats.length !== shipBeats.length)
      return { ok: false, reason: "dual-paper-missing" };
    for (var i = 0; i < shoreBeats.length; i += 1) {
      var shorePoint = shoreBeats[i], shipPoint = shipBeats[i];
      if (!shorePoint || !shipPoint ||
          shorePoint.beat !== shipPoint.beat ||
          !dossierClose(shorePoint.t, shipPoint.t, 0.002) ||
          !dossierClose(shorePoint.y, shipPoint.y, 0.002) ||
          !dossierClose(shipPoint.mastX, 0, 0.002))
        return { ok: false, reason: "beats-mismatch" };
    }
    return { ok: true, shoreBeats: shoreBeats, shipBeats: shipBeats };
  }
  function dossierDualTransformData(record) {
    var aligned = dossierDualAlignmentData(record);
    if (!aligned.ok) return aligned;
    var animationPath = record && record.animation && Array.isArray(record.animation.path)
      ? record.animation.path : [];
    if (animationPath.some(function (point) {
      return !point || !dossierClose(
        point.relativeX, Number(point.stoneX) - Number(point.mastX), 0.003
      );
    })) return { ok: false, reason: "animation-transform-mismatch" };
    var shoreError = Number(record.papers.shore.readingError) || 0;
    var shipError = Number(record.papers.ship.readingError) || 0;
    var tolerance = Math.max(0.006, Math.max(Math.abs(shoreError), Math.abs(shipError)) * 2.6);
    var points = aligned.shoreBeats.map(function (shorePoint, index) {
      var shipPoint = aligned.shipBeats[index];
      var shoreRelativeX = dossierRound(shorePoint.stoneX - shorePoint.mastX);
      var shipX = dossierRound(shipPoint.stoneX);
      return {
        beat: shorePoint.beat,
        t: shorePoint.t,
        y: shorePoint.y,
        shoreRelativeX: shoreRelativeX,
        shipX: shipX,
        residual: dossierRound(shoreRelativeX - shipX)
      };
    });
    var maxResidual = Math.max.apply(null, points.map(function (point) {
      return Math.abs(point.residual);
    }));
    if (maxResidual > tolerance)
      return {
        ok: false, reason: "paper-transform-mismatch", points: points,
        tolerance: tolerance, maxResidual: maxResidual
      };
    return {
      ok: true, points: points, tolerance: dossierRound(tolerance),
      maxResidual: dossierRound(maxResidual)
    };
  }
  function dossierIsP3Record(record) {
    /*
     * 第三柱不是「只要同時畫了兩張紙就能用」。
     * 它要回答的是走穩時同一顆石頭為何在岸紙畫彎、船紙近乎直落，
     * 因此船況、放手、時鐘、觀察位置與收卷狀態都必須同時合格。
     */
    return !!(record && record.filed === true &&
      record.stage === "steady" && record.classification === "近似穩速" &&
      record.release === "latch" && record.speedRecord === "beats" &&
      (record.beatBand || "mid") === "mid" && record.positionRecord === "dual" &&
      record.sameStone !== false && record.sameHeight !== false &&
      dossierDualTransformData(record).ok);
  }
  function dossierValidDualRecords(d) {
    return d && Array.isArray(d.records) ? d.records.filter(function (record) {
      return dossierIsP3Record(record);
    }) : [];
  }
  function dossierFindDualRecord(d, recordId) {
    var id = Number(recordId);
    if (!Number.isInteger(id)) return null;
    return dossierValidDualRecords(d).find(function (record) { return record.id === id; }) || null;
  }
  function dossierPaper(observer, origin, beats, landings, beatSpec) {
    return {
      observer: observer,
      origin: origin,
      beats: beats,
      landings: landings.slice(),
      beatCount: beats.length,
      intervalCount: Math.max(0, beats.length - 1),
      readingError: beatSpec ? beatSpec.error : null,
      quality: beatSpec ? beatSpec.quality : "只記落點，沒有共用時刻"
    };
  }
  function dossierHasVisibleShoreSpeedPaper(record) {
    if (!record || record.speedRecord !== "beats") return false;
    /*
     * 新卷宗以實際生成的 papers.shore 為準；舊存檔若尚無 papers 欄位，
     * 或載入時已被正規化成空物件，才沿用既有 positionRecord 判斷，
     * 避免合法的岸紙／雙紙紀錄失效。
     */
    if (record.papers && typeof record.papers === "object" &&
        Object.keys(record.papers).length > 0) return !!record.papers.shore;
    return record.positionRecord === "shore" || record.positionRecord === "dual";
  }
  function dossierEffectiveSpeedBand(row) {
    if (!row || row.stage === "dock") return "mid";
    return DOSSIER_SPEED_BANDS.indexOf(row.speedBand) >= 0 ? row.speedBand : "mid";
  }
  function dossierEffectiveForceBand(row) {
    if (!row || (row.stage !== "depart" && row.stage !== "brake")) return "hard";
    return DOSSIER_FORCE_BANDS.indexOf(row.forceBand) >= 0 ? row.forceBand : "hard";
  }
  function dossierEffectiveBeatBand(row) {
    if (!row || row.speedRecord !== "beats") return "mid";
    return DOSSIER_BEAT_BANDS.indexOf(row.beatBand) >= 0 ? row.beatBand : "mid";
  }
  function dossierNormalizeSettings(row) {
    if (!row || typeof row !== "object") return row;
    row.speedBand = dossierEffectiveSpeedBand(row);
    row.forceBand = dossierEffectiveForceBand(row);
    row.beatBand = dossierEffectiveBeatBand(row);
    return row;
  }
  function dossierTrialFingerprint(row) {
    return [
      row.stage, row.vesselId || "captain", row.release,
      row.speedRecord, row.positionRecord,
      dossierEffectiveSpeedBand(row), dossierEffectiveForceBand(row),
      dossierEffectiveBeatBand(row)
    ].join("|");
  }
  function buildDossierRecord(draft, id, sameSetupTrial) {
    var vesselSpec = dossierVessel(draft.vesselId);
    var height = vesselSpec.mastHeight, gravity = 9.8, fallTime = Math.sqrt(2 * height / gravity);
    var releaseVelocities = DOSSIER_RELEASE_DV[draft.release] || DOSSIER_RELEASE_DV.latch;
    /*
     * 單張原紙雖然只記一回，重做時仍須看得見徒手放石頭的差異。
     * 用原紙編號循環固定序列，不使用亂數：同一存檔重播會得到同一結果，
     * 但玩家連做三回時不會把三張徒手紙誤看成完全相同。
     */
    var trialNumber = Math.max(1, Number(sameSetupTrial) || Number(id) || 1);
    var releaseVelocity = releaseVelocities[(trialNumber - 1) % releaseVelocities.length];
    /*
     * 這裡仍只生成「一回、一張原紙」。CH3-CR-027 的系列 action
     * 會呼叫本函式三次；因此 UI 可以一次執行固定三回，原始散布與
     * 每張紙的編號卻不會被平均值吃掉。
     */
    var offsets = [dossierMotion(
      draft.stage, vesselSpec.id, draft.speedBand, draft.forceBand,
      releaseVelocity, fallTime
    ).relativeX];
    var meanOffset = mean(offsets);
    var spread = Math.max.apply(null, offsets) - Math.min.apply(null, offsets);
    var landing = draft.release === "hand" && spread > 0.20 ? "spread" :
      (meanOffset < -0.12 ? "aft" : (meanOffset > 0.12 ? "fore" : "foot"));
    var beatSpec = draft.speedRecord === "beats"
      ? DOSSIER_BEAT_VALUES[draft.beatBand] || DOSSIER_BEAT_VALUES.mid
      : null;
    var beatTimes = beatSpec ? dossierBeatTimes(beatSpec.dt, fallTime) : [];
    var shoreBeats = [], shipBeats = [];
    beatTimes.forEach(function (t, index) {
      var motion = dossierMotion(
        draft.stage, vesselSpec.id, draft.speedBand, draft.forceBand,
        releaseVelocity, t
      );
      var y = dossierRound(Math.max(0, height - 0.5 * gravity * t * t));
      var mastError = dossierReadError(DOSSIER_READ_ERROR, index, id) * beatSpec.error;
      var stoneError = dossierReadError(DOSSIER_STONE_READ_ERROR, index, id) * beatSpec.error;
      var shipError = dossierReadError(DOSSIER_SHIP_READ_ERROR, index, id) * beatSpec.error * 0.5;
      shoreBeats.push({
        beat: index, t: t, mastX: dossierRound(motion.mastX + mastError),
        stoneX: dossierRound(motion.stoneX + stoneError), y: y
      });
      shipBeats.push({
        beat: index, t: t, mastX: 0,
        stoneX: dossierRound(motion.relativeX + shipError), y: y
      });
    });
    var shoreGaps = null;
    if (beatSpec && shoreBeats.length > 1) {
      shoreGaps = [];
      for (var gapIndex = 1; gapIndex < shoreBeats.length; gapIndex += 1)
        shoreGaps.push(dossierRound(shoreBeats[gapIndex].mastX - shoreBeats[gapIndex - 1].mastX));
    }
    var path = [];
    for (var step = 0; step <= 20; step += 1) {
      var pathTime = fallTime * step / 20;
      var pathMotion = dossierMotion(
        draft.stage, vesselSpec.id, draft.speedBand, draft.forceBand,
        releaseVelocity, pathTime
      );
      path.push({
        t: dossierRound(pathTime), mastX: pathMotion.mastX,
        stoneX: pathMotion.stoneX,
        relativeX: pathMotion.relativeX,
        y: dossierRound(Math.max(0, height - 0.5 * gravity * pathTime * pathTime))
      });
    }
    var papers = {};
    if (draft.positionRecord === "shore" || draft.positionRecord === "dual")
      papers.shore = dossierPaper("艾蒂安", "岸上繫船柱", shoreBeats, offsets, beatSpec);
    if (draft.positionRecord === "deck" || draft.positionRecord === "dual")
      papers.ship = dossierPaper("伽桑狄", "桅腳", shipBeats, offsets, beatSpec);
    var hasVisibleShoreSpeedPaper = draft.speedRecord === "beats" && !!papers.shore;
    var record = {
      id: id, location: "deck", stage: draft.stage, release: draft.release,
      vesselId: vesselSpec.id, vesselName: vesselSpec.name, mastHeight: vesselSpec.mastHeight,
      releaseOperator: "馬蒂厄",
      rowingCrew: draft.stage === "dock" ? "繫纜停泊，無人划槳" : vesselSpec.rowingCrew,
      rowingMethod: draft.stage === "dock" ? "繫纜不動" : vesselSpec.rowingMethod,
      speedRecord: draft.speedRecord, positionRecord: draft.positionRecord,
      repeats: 1, sameStone: draft.sameStone, sameHeight: draft.sameHeight,
      speedBand: draft.speedBand, forceBand: draft.forceBand, beatBand: draft.beatBand,
      sameSetupTrial: trialNumber,
      classification: "未記船速・未分類",
      vessel: "unclassified",
      offsets: offsets, shoreGaps: hasVisibleShoreSpeedPaper ? shoreGaps : null,
      landing: landing,
      dualPapers: !!(papers.shore && papers.ship && draft.release === "latch" && draft.speedRecord === "beats"),
      animation: {
        height: height, fallTime: dossierRound(fallTime), path: path,
        vesselId: vesselSpec.id, vesselName: vesselSpec.name
      },
      papers: papers,
      filed: false
    };
    dossierReclassifyRecord(record);
    return record;
  }

  function makeDossier() {
    return {
      page: "lab",
      draft: {
        location: "deck", stage: "steady", release: "hand", speedRecord: "none",
        positionRecord: "deck", repeats: 1, sameStone: true, sameHeight: true,
        speedBand: "mid", forceBand: "hard", beatBand: "mid", vesselId: "captain"
      },
      records: [],
      pendingRecord: null,
      borrowedVessels: ["captain"],
      nextRecordId: 1,
      candidates: {},
      assertions: { A1: false, A2: false, A3: false, A6: true, S1: false, S4: false, A4: false, A5: false },
      claimSelections: { A1: [], A2: [], A3: [], S1: [], S4: [] },
      proposedScopes: { A1: null, A2: null, A3: null, S1: null, S4: null },
      assertionSources: {},
      sourceAttempts: [],
      scopeAttempts: [],
      designCommitments: {
        cabinWind: null,
        cabinWindAttempts: [],
        cabinInstrument: null,
        cabinInstrumentAttempts: []
      },
      /* blind 保留作舊存檔欄位名；玩家流程已改為公開船況的船艙對照。 */
      blind: { ran: false, judgment: null, unsealed: false, scope: false, attempts: [], records: [] },
      debate: {
        active: false, rep: 5, current: null, lastReply: "",
        lastPlayerLine: "", lastOS: "", osFired: [], entryBlocked: null, visits: 0,
        pins: [], attempts: [],
        pillars: { p1: false, p2: false, p3: false },
        p1: { source: null, concept: false, steady: false, cabin: false, wind: false },
        p2: {
          source: null, question: false, concept: false, steady: false, depart: false,
          old: false, boundary: false, scope: false, scopeDiagnosis: "not-required"
        },
        p3: {
          source: null, sourceRecordId: null, question: false, concept: false, aligned: false,
          scope: false,
          transformMode: null, transformed: false, transformedPoints: [], transformTolerance: null,
          maxResidual: null, alignAttempts: [], transformAttempts: []
        },
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
    if (!d.designCommitments || typeof d.designCommitments !== "object")
      d.designCommitments = clone(defaults.designCommitments);
    if (d.designCommitments.cabinWind !== "close-cabin")
      d.designCommitments.cabinWind = null;
    if (!Array.isArray(d.designCommitments.cabinWindAttempts))
      d.designCommitments.cabinWindAttempts = [];
    if (["drip", "toss", "combined"].indexOf(d.designCommitments.cabinInstrument) < 0)
      d.designCommitments.cabinInstrument = null;
    if (!Array.isArray(d.designCommitments.cabinInstrumentAttempts))
      d.designCommitments.cabinInstrumentAttempts = [];
    if (["lab", "debate"].indexOf(d.page) < 0) d.page = "lab";
    if (!d.draft || typeof d.draft !== "object") d.draft = clone(defaults.draft);
    if (DOSSIER_LOCATIONS.indexOf(d.draft.location) < 0) d.draft.location = defaults.draft.location;
    if (DOSSIER_VESSEL_IDS.indexOf(d.draft.vesselId) < 0) d.draft.vesselId = defaults.draft.vesselId;
    if (DOSSIER_STAGES.indexOf(d.draft.stage) < 0) d.draft.stage = defaults.draft.stage;
    if (DOSSIER_RELEASES.indexOf(d.draft.release) < 0) d.draft.release = defaults.draft.release;
    if (DOSSIER_SPEED_RECORDS.indexOf(d.draft.speedRecord) < 0) d.draft.speedRecord = defaults.draft.speedRecord;
    if (DOSSIER_POSITION_RECORDS.indexOf(d.draft.positionRecord) < 0) d.draft.positionRecord = defaults.draft.positionRecord;
    if (DOSSIER_REPEATS.indexOf(Number(d.draft.repeats)) < 0) d.draft.repeats = defaults.draft.repeats;
    if (DOSSIER_SPEED_BANDS.indexOf(d.draft.speedBand) < 0) d.draft.speedBand = defaults.draft.speedBand;
    if (DOSSIER_FORCE_BANDS.indexOf(d.draft.forceBand) < 0) d.draft.forceBand = defaults.draft.forceBand;
    if (DOSSIER_BEAT_BANDS.indexOf(d.draft.beatBand) < 0) d.draft.beatBand = defaults.draft.beatBand;
    dossierNormalizeSettings(d.draft);
    /*
     * 船艙是另一組觀察流程，不是桅頂落石的可調地點；石頭與放手高度
     * 也沒有對應的替換物理模型。舊存檔可載入，但下一次設計一律正規化
     * 為露天甲板、同一顆石頭、同一桅頂，避免留下「按了卻沒有物理後果」
     * 的假變因。
     */
    d.draft.location = "deck";
    d.draft.sameStone = true;
    d.draft.sameHeight = true;
    if (!Array.isArray(d.borrowedVessels)) d.borrowedVessels = ["captain"];
    d.borrowedVessels = unique(d.borrowedVessels.filter(function (vesselId) {
      return DOSSIER_VESSEL_IDS.indexOf(vesselId) >= 0;
    }));
    if (d.borrowedVessels.indexOf("captain") < 0) d.borrowedVessels.unshift("captain");
    if (!Array.isArray(d.records)) d.records = [];
    d.records.forEach(function (row) {
      if (DOSSIER_VESSEL_IDS.indexOf(row.vesselId) < 0) row.vesselId = "captain";
      var rowVessel = dossierVessel(row.vesselId);
      if (typeof row.vesselName !== "string") row.vesselName = rowVessel.name;
      if (typeof row.mastHeight !== "number" || !isFinite(row.mastHeight)) row.mastHeight = rowVessel.mastHeight;
      if (typeof row.releaseOperator !== "string") row.releaseOperator = "馬蒂厄";
      if (typeof row.rowingCrew !== "string")
        row.rowingCrew = row.stage === "dock" ? "繫纜停泊，無人划槳" : rowVessel.rowingCrew;
      if (typeof row.rowingMethod !== "string")
        row.rowingMethod = row.stage === "dock" ? "繫纜不動" : rowVessel.rowingMethod;
      if (DOSSIER_SPEED_BANDS.indexOf(row.speedBand) < 0) row.speedBand = "mid";
      if (DOSSIER_FORCE_BANDS.indexOf(row.forceBand) < 0) row.forceBand = "hard";
      if (DOSSIER_BEAT_BANDS.indexOf(row.beatBand) < 0) row.beatBand = "mid";
      dossierNormalizeSettings(row);
      if (!row.papers || typeof row.papers !== "object") row.papers = {};
      if (typeof row.filed !== "boolean") row.filed = true;
      dossierReclassifyRecord(row);
      row.dualPapers = dossierIsP3Record(row);
    });
    if (!d.pendingRecord || typeof d.pendingRecord !== "object") d.pendingRecord = null;
    else {
      if (DOSSIER_VESSEL_IDS.indexOf(d.pendingRecord.vesselId) < 0) d.pendingRecord.vesselId = "captain";
      var pendingVessel = dossierVessel(d.pendingRecord.vesselId);
      if (typeof d.pendingRecord.vesselName !== "string") d.pendingRecord.vesselName = pendingVessel.name;
      if (typeof d.pendingRecord.mastHeight !== "number" || !isFinite(d.pendingRecord.mastHeight))
        d.pendingRecord.mastHeight = pendingVessel.mastHeight;
      if (typeof d.pendingRecord.releaseOperator !== "string") d.pendingRecord.releaseOperator = "馬蒂厄";
      if (typeof d.pendingRecord.rowingCrew !== "string")
        d.pendingRecord.rowingCrew = d.pendingRecord.stage === "dock"
          ? "繫纜停泊，無人划槳" : pendingVessel.rowingCrew;
      if (typeof d.pendingRecord.rowingMethod !== "string")
        d.pendingRecord.rowingMethod = d.pendingRecord.stage === "dock"
          ? "繫纜不動" : pendingVessel.rowingMethod;
      if (DOSSIER_SPEED_BANDS.indexOf(d.pendingRecord.speedBand) < 0) d.pendingRecord.speedBand = "mid";
      if (DOSSIER_FORCE_BANDS.indexOf(d.pendingRecord.forceBand) < 0) d.pendingRecord.forceBand = "hard";
      if (DOSSIER_BEAT_BANDS.indexOf(d.pendingRecord.beatBand) < 0) d.pendingRecord.beatBand = "mid";
      dossierNormalizeSettings(d.pendingRecord);
      if (!d.pendingRecord.papers || typeof d.pendingRecord.papers !== "object") d.pendingRecord.papers = {};
      d.pendingRecord.filed = false;
      dossierReclassifyRecord(d.pendingRecord);
      d.pendingRecord.dualPapers = false;
    }
    if (!Number.isInteger(d.nextRecordId) || d.nextRecordId < 1) d.nextRecordId = d.records.length + 1;
    if (!d.candidates || typeof d.candidates !== "object") d.candidates = {};
    if (!d.assertions || typeof d.assertions !== "object") d.assertions = clone(defaults.assertions);
    Object.keys(defaults.assertions).forEach(function (id) {
      if (typeof d.assertions[id] !== "boolean") d.assertions[id] = defaults.assertions[id];
    });
    if (!d.claimSelections || typeof d.claimSelections !== "object") d.claimSelections = clone(defaults.claimSelections);
    Object.keys(defaults.claimSelections).forEach(function (id) {
      if (!Array.isArray(d.claimSelections[id])) d.claimSelections[id] = [];
      d.claimSelections[id] = unique(d.claimSelections[id].filter(function (sourceId) {
        return typeof sourceId === "string" && sourceId.length <= 40;
      })).slice(0, 30);
    });
    if (!d.proposedScopes || typeof d.proposedScopes !== "object")
      d.proposedScopes = clone(defaults.proposedScopes);
    var allowedProposedScopes = {
      S1: ["all-hand-aft", "sample-only", "latch-solves-all"],
      A1: ["all-moving", "controlled-three", "earth-moves"],
      A2: ["all-motion-hidden", "local-only", "wind-never-matters"],
      A3: ["old-was-accelerating", "today-comparison", "aft-reveals-all"],
      S4: ["infer-old", "today-three-states", "universal-three-dots"]
    };
    Object.keys(defaults.proposedScopes).forEach(function (id) {
      if (allowedProposedScopes[id].indexOf(d.proposedScopes[id]) < 0)
        d.proposedScopes[id] = null;
    });
    if (!d.assertionSources || typeof d.assertionSources !== "object") d.assertionSources = {};
    Object.keys(d.assertionSources).forEach(function (id) {
      if (!Array.isArray(d.assertionSources[id])) delete d.assertionSources[id];
    });
    if (!Array.isArray(d.sourceAttempts)) d.sourceAttempts = [];
    if (!Array.isArray(d.scopeAttempts)) d.scopeAttempts = [];
    /*
     * 舊存檔的斷言可能是在「選了哪個操作階段」時直接授予。載入後先用
     * 重建出的原紙分類再驗一次；未分類紙不可藉舊旗標繼續充當證據。
     */
    ["S1", "A1", "A3", "S4"].forEach(function (assertionId) {
      if (!d.assertions[assertionId]) return;
      var savedSources = Array.isArray(d.assertionSources[assertionId])
        ? d.assertionSources[assertionId].slice()
        : (d.claimSelections[assertionId] || []).slice();
      if (!savedSources.length) {
        /*
         * 早期存檔只留下斷言旗標，沒有來源 ID。這種舊資料無法回溯驗證，
         * 但也不能在載入時直接抹掉玩家進度；新格式只要帶來源，就一律
         * 接受下方的原紙重驗。
         */
        return;
      }
      d.claimSelections[assertionId] = savedSources;
      if (!dossierSelectedSourcesCheck(d, assertionId).ok)
        d.assertions[assertionId] = false;
    });
    if (!d.assertions.A1) {
      d.assertions.A3 = false;
      d.assertions.A2 = false;
      d.assertions.S4 = false;
    } else if (!d.assertions.A3) {
      d.assertions.A2 = false;
      d.assertions.S4 = false;
    }
    s.evidence.g1 = !!d.assertions.A1;
    s.evidence.g2 = !!d.assertions.A2;
    s.evidence.g3 = !!(d.assertions.A3 || d.assertions.S4);
    if (!d.blind || typeof d.blind !== "object") d.blind = clone(defaults.blind);
    if (!Array.isArray(d.blind.attempts)) d.blind.attempts = [];
    if (!Array.isArray(d.blind.records)) d.blind.records = [];
    /*
     * 舊存檔曾把船艙對照存成兩張彙總紙。轉成六張獨立原紙，
     * 讓「三回」成為真的三次操作，而不是單張紙上的回數。
     */
    if (d.blind.ran && d.blind.records.length &&
        !d.blind.records.every(function (row) { return row && /^C\d+$/.test(row.id || ""); })) {
      d.blind.records = [];
      ["dock", "dock", "dock", "steady", "steady", "steady"].forEach(function (stage, index) {
        d.blind.records.push({
          id: "C" + (index + 1),
          stage: stage,
          instrument: "combined",
          stageLabel: stage === "dock" ? "繫纜停泊" : "出港平駛",
          observer: "船艙內由伽桑狄記水面與落球；岸上由艾蒂安記船位",
          classification: stage === "dock" ? "岸標位置不變" : "岸標間距近乎相同",
          shoreGaps: stage === "dock" ? [0, 0, 0] : [1.5, 1.5, 1.5],
          water: "水面沒有固定偏向",
          ball: "小球落在放手點正下方"
        });
      });
    }
    d.blind.records.forEach(function (row) {
      if (!row || ["drip", "toss", "combined"].indexOf(row.instrument) >= 0) return;
      row.instrument = "combined";
    });
    if (!d.designCommitments.cabinInstrument && d.blind.records.length) {
      var savedInstruments = unique(d.blind.records.map(function (row) { return row.instrument; }));
      if (savedInstruments.length === 1)
        d.designCommitments.cabinInstrument = savedInstruments[0];
    }
    if (typeof d.blind.ran !== "boolean") d.blind.ran = false;
    if (typeof d.blind.unsealed !== "boolean") d.blind.unsealed = false;
    if (typeof d.blind.scope !== "boolean") d.blind.scope = false;
    if (d.blind.ran && d.blind.records.length >= 6)
      d.blind.judgment = "comparison-recorded";
    else if (d.blind.ran && d.blind.judgment === "indistinguishable")
      d.blind.judgment = "comparison-recorded";
    if (!d.debate || typeof d.debate !== "object") d.debate = clone(defaults.debate);
    if (!Array.isArray(d.debate.pins)) d.debate.pins = [];
    if (!Array.isArray(d.debate.attempts)) d.debate.attempts = [];
    if (!d.debate.pillars) d.debate.pillars = clone(defaults.debate.pillars);
    if (!d.debate.p1) d.debate.p1 = clone(defaults.debate.p1);
    if (!d.debate.p2) d.debate.p2 = clone(defaults.debate.p2);
    if (!d.debate.p3) d.debate.p3 = clone(defaults.debate.p3);
    if (typeof d.debate.active !== "boolean") d.debate.active = false;
    if (!Number.isInteger(d.debate.rep) || d.debate.rep < 0 || d.debate.rep > 5) d.debate.rep = 5;
    if (["p1", "p2", "p3", null].indexOf(d.debate.current) < 0) d.debate.current = null;
    ["p1", "p2", "p3"].forEach(function (pillarId) {
      if (typeof d.debate.pillars[pillarId] !== "boolean") d.debate.pillars[pillarId] = false;
    });
    if (["A1", null].indexOf(d.debate.p1.source) < 0) d.debate.p1.source = null;
    if (d.debate.p1.steady && !d.debate.p1.source) d.debate.p1.source = "A1";
    if (["A3", null].indexOf(d.debate.p2.source) < 0) d.debate.p2.source = null;
    if (d.debate.p2.depart && !d.debate.p2.source) d.debate.p2.source = "A3";
    if (["dual-papers", null].indexOf(d.debate.p3.source) < 0) d.debate.p3.source = null;
    if ((d.debate.p3.question || d.debate.p3.aligned || d.debate.p3.transformed) && !d.debate.p3.source)
      d.debate.p3.source = "dual-papers";
    if (typeof d.debate.lastPlayerLine !== "string") d.debate.lastPlayerLine = "";
    if (typeof d.debate.lastOS !== "string") d.debate.lastOS = "";
    if (!Array.isArray(d.debate.osFired)) d.debate.osFired = [];
    if (typeof d.debate.entryBlocked !== "string") d.debate.entryBlocked = null;
    if (!Number.isInteger(d.debate.visits) || d.debate.visits < 0) d.debate.visits = 0;
    if (!Array.isArray(d.debate.p3.alignAttempts)) d.debate.p3.alignAttempts = [];
    if (!Array.isArray(d.debate.p3.transformAttempts)) d.debate.p3.transformAttempts = [];
    if (typeof d.debate.p3.scope !== "boolean")
      d.debate.p3.scope = !!(d.debate.p3.aligned || d.debate.p3.transformed ||
        d.assertions.A4 || d.assertions.A5);
    if ([null, "subtract-each-beat"].indexOf(d.debate.p3.transformMode) < 0)
      d.debate.p3.transformMode = null;
    if (d.debate.p3.transformed && !d.debate.p3.transformMode)
      d.debate.p3.transformMode = "subtract-each-beat";
    if (d.debate.p3.sourceRecordId === null ||
        !Number.isInteger(Number(d.debate.p3.sourceRecordId)))
      d.debate.p3.sourceRecordId = null;
    else d.debate.p3.sourceRecordId = Number(d.debate.p3.sourceRecordId);
    if (!Array.isArray(d.debate.p3.transformedPoints)) d.debate.p3.transformedPoints = [];
    if (typeof d.debate.p3.transformTolerance !== "number" ||
        !isFinite(d.debate.p3.transformTolerance)) d.debate.p3.transformTolerance = null;
    if (typeof d.debate.p3.maxResidual !== "number" ||
        !isFinite(d.debate.p3.maxResidual)) d.debate.p3.maxResidual = null;
    var validDualRows = dossierValidDualRecords(d);
    if (d.debate.p3.source === "dual-papers" && d.debate.p3.sourceRecordId === null &&
        validDualRows.length &&
        (d.debate.p3.question || d.debate.p3.aligned || d.debate.p3.transformed ||
          d.assertions.A4 || d.assertions.A5))
      d.debate.p3.sourceRecordId = validDualRows[validDualRows.length - 1].id;
    var savedDualSource = dossierFindDualRecord(d, d.debate.p3.sourceRecordId);
    if (d.debate.p3.sourceRecordId !== null && !savedDualSource) {
      d.debate.p3.source = null;
      d.debate.p3.sourceRecordId = null;
      d.debate.p3.question = false;
      d.debate.p3.concept = false;
      d.debate.p3.aligned = false;
      d.debate.p3.scope = false;
      d.debate.p3.transformMode = null;
      d.debate.p3.transformed = false;
      d.debate.p3.transformedPoints = [];
      d.debate.p3.transformTolerance = null;
      d.debate.p3.maxResidual = null;
      d.assertions.A4 = false;
      d.assertions.A5 = false;
      d.debate.pillars.p3 = false;
      s.overlay.aligned = false;
      s.overlay.transformed = false;
      s.overlay.preview = "initial";
      s.caseFile.transformProgress = 0;
      s.evidence.g4 = false;
    } else if (savedDualSource && d.debate.p3.transformed) {
      var savedTransform = dossierDualTransformData(savedDualSource);
      d.debate.p3.transformedPoints = clone(savedTransform.points);
      d.debate.p3.transformTolerance = savedTransform.tolerance;
      d.debate.p3.maxResidual = savedTransform.maxResidual;
    }
    if (typeof d.debate.p2.scope !== "boolean") d.debate.p2.scope = false;
    if (["not-required", "required", "complete"].indexOf(d.debate.p2.scopeDiagnosis) < 0)
      d.debate.p2.scopeDiagnosis = "not-required";
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

  /* 舊版第三章本機存檔可能還沒有航船實驗卷宗。
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
       揭曉前被維達爾船長退回，玩家可修改後重新封存。 */
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

  /* ---------- CH3：分段證據任務＋自由補強＋三柱碼頭辯論 ---------- */
  function dossierHasDual(d) {
    return dossierValidDualRecords(d).length > 0;
  }
  /*
   * 辯論原紙目錄是「玩家剛才說了哪張紙」的唯一來源。
   * UI 卡片、旅人公開發言與 NPC 回應都必須從同一份 metadata 取名，
   * 否則選了 A1，對話框卻可能仍回應「舊紙和船艙紙」。
   */
  var DOSSIER_EVIDENCE_PACKET_BASE = [
    {
      id: "A1", kicker: "原紙組 A1", title: "走穩三回岸紙",
      condition: "船況：出港平駛｜觀察：岸上逐拍記船位與落點",
      variables: "固定：同船、同石、同高、門閂放手、中拍鼓",
      scope: "能支持：本船在這組條件下，石頭落在桅腳附近"
    },
    {
      id: "A2", kicker: "原紙組 A2", title: "封閉船艙六回對照",
      condition: "船況：停泊 3 回＋近似平駛 3 回｜觀察：艙內水面與落球；岸紙另記船況",
      variables: "改變：停泊／平駛｜固定：封閉艙室、同一放手位置與做法",
      scope: "能支持：這六回的艙內結果相近；不能推到加速、減速或甲板風"
    },
    {
      id: "A3", kicker: "原紙組 A3", title: "走穩與解纜起步對照",
      condition: "船況：近似平駛＋正在變快｜觀察：岸上逐拍記船位與落點",
      variables: "只改：放手後船速是否繼續增加｜其餘沿用同一組條件",
      scope: "能支持：本船這兩種船況不能混為一談"
    },
    {
      id: "A6", kicker: "舊紙 A6", title: "八年前的一次後偏",
      condition: "船況：未記｜觀察：只留下石頭落在桅後",
      variables: "缺口：船速、岸標、共同鼓點；正面沒有署名",
      scope: "能支持：那一次確實後偏；目前只能標成「船況不明」"
    },
    {
      id: "S1", kicker: "補充原紙 S1", title: "徒手放石的散布",
      condition: "船況：依各原紙｜觀察：落點方向分散",
      variables: "改變：徒手鬆開，可能混入額外推動",
      scope: "能支持：徒手資料不適合替乾淨落點作證"
    },
    {
      id: "S4", kicker: "補充原紙 S4", title: "三種船速變化的落點",
      condition: "船況：變快、走穩、變慢｜觀察：岸上船位與落點",
      variables: "只比較船速如何改變；其餘條件按各組原紙核對",
      scope: "能支持：只到實際測過的船與條件，不能推成所有船"
    }
  ];
  function dossierEvidenceOwned(d, id) {
    if (id === "dual-papers" || /^dual-papers:\d+$/.test(id || ""))
      return dossierHasDual(d);
    if (id === "A6") return true;
    if (id === "A2") return !!(d.blind && d.blind.ran && d.assertions && d.assertions.A2);
    return !!(d.assertions && d.assertions[id]);
  }
  function getDossierEvidenceCatalog(d) {
    var packets = clone(DOSSIER_EVIDENCE_PACKET_BASE);
    dossierValidDualRecords(d).forEach(function (record) {
      packets.push({
        id: "dual-papers:" + record.id,
        kicker: "同步原紙 R" + record.id, title: "同一趟岸紙＋船紙",
        condition: "船況：近似平駛｜觀察：岸上從碼頭量，船上從桅杆量",
        variables: "固定：同石、同高、門閂、中拍鼓；兩位觀察者共用同號鼓點",
        scope: "能支持：同一事件可從兩個參考物留下不同路徑"
      });
    });
    return packets.filter(function (packet) {
      return dossierEvidenceOwned(d, packet.id);
    });
  }
  function dossierEvidencePacket(d, id) {
    var normalized = id === "old-paper" ? "A6" :
      (id === "cabin-pair" ? "A2" : id);
    if (normalized === "dual-papers") {
      var duals = getDossierEvidenceCatalog(d).filter(function (packet) {
        return packet.id.indexOf("dual-papers:") === 0;
      });
      return duals.length ? duals[duals.length - 1] : null;
    }
    return getDossierEvidenceCatalog(d).find(function (packet) {
      return packet.id === normalized;
    }) || null;
  }
  function dossierEvidencePlayerLine(d, id) {
    var packet = dossierEvidencePacket(d, id);
    return packet ? "我先出示「" + packet.title + "」。" : "";
  }
  function dossierReproductionRows(d) {
    return d.records.filter(function (row) {
      return row.stage === "depart" && row.classification === "正在變快" &&
        (row.vesselId || "captain") === "captain" &&
        row.release === "latch" && dossierHasVisibleShoreSpeedPaper(row) &&
        row.sameStone && row.sameHeight && row.landing === "aft";
    });
  }
  function dossierHasReproducedOldResult(d) {
    /*
     * 第一輪先重做維達爾船長舊紙的「解纜後第一段、落在桅後」。
     * 只有同一套可見、可追溯的條件累積到三張，才算真的重現；
     * 髒紙或只有船上紙不能靠筆數誤闖下一輪。
     */
    var groups = {};
    dossierReproductionRows(d).forEach(function (row) {
      var key = dossierComparableFingerprint(row);
      groups[key] = (groups[key] || 0) + 1;
    });
    return Object.keys(groups).some(function (key) { return groups[key] >= 3; });
  }
  function dossierMissionId(d) {
    /*
     * 尚未完成起步／走穩比較的存檔，都必須先備齊維達爾船長那一趟的重現資料。
     * 這也讓已成立 A1、但沒有起步原紙的舊存檔能補回缺口，不會卡在比較頁。
     */
    if (!d.assertions.A3 && !dossierHasReproducedOldResult(d)) return "reproduce";
    if (!d.assertions.A1) return "steady";
    if (!d.assertions.A3) return "speed";
    if (!d.assertions.A2) return "cabin";
    if (!dossierHasDual(d)) return "dual";
    return "explore";
  }
  function dossierApplyGuidedLocks(d, draft) {
    var mission = dossierMissionId(d);
    if (mission === "explore") return draft;
    draft.location = "deck";
    draft.vesselId = "captain";
    draft.sameStone = true;
    draft.sameHeight = true;
    draft.speedBand = "mid";
    draft.forceBand = "hard";
    if (mission === "reproduce") {
      draft.stage = "depart";
      /*
       * 舊／中間版存檔可能把快拍或慢拍留在 draft；本輪 UI 已明文固定中拍，
       * 執行端也必須鎖回同一條件，不能讓隱藏值改變玩家實際取得的原紙。
       */
      draft.beatBand = "mid";
      if (draft.positionRecord === "dual") draft.positionRecord = "shore";
    }
    if (mission === "steady") {
      draft.stage = "steady";
      if (draft.positionRecord === "dual") draft.positionRecord = "shore";
    }
    if (mission === "speed" || mission === "dual") {
      draft.release = "latch";
      draft.speedRecord = "beats";
      draft.repeats = 1;
    }
    if (mission === "speed") {
      if (["steady", "depart"].indexOf(draft.stage) < 0) draft.stage = "steady";
      draft.positionRecord = "shore";
    }
    if (mission === "dual") {
      draft.stage = "steady";
      draft.positionRecord = "dual";
      draft.beatBand = "mid";
    }
    return draft;
  }
  function dossierPrepareNextMission(d) {
    var mission = dossierMissionId(d);
    if (mission === "speed" || mission === "dual") {
      d.draft.location = "deck";
      d.draft.vesselId = "captain";
      d.draft.stage = "steady";
      d.draft.release = "latch";
      d.draft.speedRecord = "beats";
      d.draft.positionRecord = mission === "dual" ? "dual" : "shore";
      d.draft.repeats = 1;
      d.draft.sameStone = true;
      d.draft.sameHeight = true;
      d.draft.speedBand = "mid";
      d.draft.forceBand = "hard";
      d.draft.beatBand = "mid";
    }
  }
  function refreshDossierCandidates(d) {
    /* 候選由現有原紙與已完成任務重新推導，避免舊存檔殘留跨輪候選。 */
    d.candidates = {};
    function ids(test) { return d.records.filter(test).map(function (r) { return r.id; }); }
    var hand = ids(function (r) { return r.release === "hand"; });
    var steady = ids(function (r) {
      return r.stage === "steady" && r.classification === "近似穩速" &&
        r.landing === "foot" &&
        r.release === "latch" && dossierHasVisibleShoreSpeedPaper(r) &&
        r.sameStone && r.sameHeight;
    });
    var depart = ids(function (r) {
      return r.stage === "depart" && r.classification === "正在變快" &&
        r.landing === "aft" &&
        r.release === "latch" && dossierHasVisibleShoreSpeedPaper(r) &&
        r.sameStone && r.sameHeight;
    });
    var brake = ids(function (r) {
      return r.stage === "brake" && r.classification === "正在變慢" &&
        r.landing === "fore" &&
        r.release === "latch" && dossierHasVisibleShoreSpeedPaper(r) &&
        r.sameStone && r.sameHeight;
    });
    /*
     * 候選斷言在第一張相關原紙出現後就浮出來；是否真的達到三筆、
     * 是否混入錯誤變因，留給玩家勾紙提交時診斷。
     */
    if (hand.length && !d.assertions.S1) d.candidates.S1 = { records: hand };
    if (steady.length && !d.assertions.A1) d.candidates.A1 = { records: steady };
    if ((depart.length || steady.length) && d.assertions.A1 && !d.assertions.A3)
      d.candidates.A3 = { records: steady.concat(depart) };
    /*
     * S4 是「三種船況」的複合斷言。尚未真的做出減速原紙前，
     * 不得只因玩家已有起步／走穩紀錄，就把完整三態結論提前端出來。
     * 第一張合格減速原紙出現後才顯示候選；是否已重做三回仍由提交閘診斷。
     */
    if (brake.length &&
        d.assertions.A1 && d.assertions.A3 && !d.assertions.S4)
      d.candidates.S4 = { records: steady.concat(depart, brake) };
    var cabinDock = d.blind.records.filter(function (row) { return row.stage === "dock"; });
    var cabinSteady = d.blind.records.filter(function (row) { return row.stage === "steady"; });
    if (d.assertions.A1 && d.assertions.A3 && d.blind.records.length &&
        d.blind.unsealed && !d.assertions.A2)
      d.candidates.A2 = { records: cabinDock.concat(cabinSteady).map(function (row) { return row.id; }) };
  }
  function dossierAvailableSourceIds(d) {
    var ids = ["OLD"].concat(d.records.map(function (r) { return "R" + r.id; }));
    if (d.blind.ran) ids = ids.concat(d.blind.records.map(function (row) { return row.id; }));
    return ids;
  }
  function dossierComparableFingerprint(row) {
    return [
      row.vesselId || "captain", row.release, row.speedRecord, row.positionRecord,
      dossierEffectiveSpeedBand(row), dossierEffectiveForceBand(row),
      dossierEffectiveBeatBand(row),
      row.sameStone !== false ? "same-stone" : "changed-stone",
      row.sameHeight !== false ? "same-height" : "changed-height"
    ].join("|");
  }
  function dossierSelectedSourcesCheck(d, assertionId) {
    var picked = unique((d.claimSelections[assertionId] || []).slice());
    if (!picked.length || picked.some(function (id) {
      return dossierAvailableSourceIds(d).indexOf(id) < 0;
    })) return { ok: false, reason: "dossier-source-mismatch" };
    var rows = picked.map(function (id) {
      if (id.charAt(0) !== "R") return null;
      var n = Number(id.slice(1));
      return d.records.find(function (r) { return r.id === n; }) || null;
    }).filter(Boolean);
    function cleanRows(stage, classification, landing) {
      return rows.filter(function (r) {
        return r.stage === stage && r.classification === classification &&
          r.landing === landing &&
          r.release === "latch" && dossierHasVisibleShoreSpeedPaper(r) &&
          r.sameStone && r.sameHeight;
      });
    }
    function sameSetupAcrossMotion() {
      if (!rows.length) return false;
      var first = dossierComparableFingerprint(rows[0]);
      return rows.every(function (row) {
        return dossierComparableFingerprint(row) === first;
      });
    }
    function sameHandSetup() {
      if (!rows.length) return false;
      var first = rows[0];
      return rows.every(function (row) {
        return row.stage === first.stage &&
          (row.vesselId || "captain") === (first.vesselId || "captain") &&
          row.release === "hand" &&
          row.speedRecord === first.speedRecord &&
          row.positionRecord === first.positionRecord &&
          dossierEffectiveSpeedBand(row) === dossierEffectiveSpeedBand(first) &&
          dossierEffectiveForceBand(row) === dossierEffectiveForceBand(first) &&
          dossierEffectiveBeatBand(row) === dossierEffectiveBeatBand(first) &&
          row.sameStone === first.sameStone &&
          row.sameHeight === first.sameHeight;
      });
    }
    if (assertionId === "A2") {
      if (picked.length < 6) return { ok: false, reason: "dossier-too-few-records" };
      if (picked.some(function (id) { return !/^C\d+$/.test(id); }))
        return { ok: false, reason: "dossier-source-mismatch" };
      var cabinRows = picked.map(function (id) {
        return d.blind.records.find(function (row) { return row.id === id; }) || null;
      }).filter(Boolean);
      if (cabinRows.length !== picked.length ||
          cabinRows.some(function (row) {
            return !dossierCabinRowMatchesStage(row, row.stage);
          }))
        return { ok: false, reason: "dossier-cabin-paper-mismatch" };
      var cabinInstruments = unique(cabinRows.map(function (row) {
        return row.instrument || "combined";
      }));
      if (cabinInstruments.length !== 1 ||
          (d.designCommitments.cabinInstrument &&
            cabinInstruments[0] !== d.designCommitments.cabinInstrument))
        return { ok: false, reason: "dossier-variable-mismatch" };
      var cabinDock = cabinRows.filter(function (row) {
        return dossierCabinRowMatchesStage(row, "dock");
      });
      var cabinSteady = cabinRows.filter(function (row) {
        return dossierCabinRowMatchesStage(row, "steady");
      });
      if (cabinDock.length < 3 || cabinSteady.length < 3)
        return { ok: false, reason: "dossier-comparison-missing" };
      return { ok: true };
    }
    if (picked.some(function (id) { return id === "OLD" || id.indexOf("C") === 0; }))
      return { ok: false, reason: "dossier-source-mismatch" };
    if (rows.length < 3) return { ok: false, reason: "dossier-too-few-records" };
    if (rows.some(function (r) { return r.release !== (assertionId === "S1" ? "hand" : "latch"); }))
      return { ok: false, reason: "dossier-dirty-release" };
    if (assertionId !== "S1" && rows.some(function (r) { return !dossierHasVisibleShoreSpeedPaper(r); }))
      return { ok: false, reason: "dossier-speed-paper-missing" };
    if (rows.some(function (r) { return !r.sameStone || !r.sameHeight; }))
      return { ok: false, reason: "dossier-variable-mismatch" };
    if (assertionId === "S1") {
      if (!sameHandSetup()) return { ok: false, reason: "dossier-variable-mismatch" };
      var handOffsets = [];
      rows.forEach(function (row) {
        (Array.isArray(row.offsets) ? row.offsets : []).forEach(function (offset) {
          if (typeof offset === "number" && isFinite(offset)) handOffsets.push(offset);
        });
      });
      if (handOffsets.length < 3 ||
          Math.max.apply(null, handOffsets) - Math.min.apply(null, handOffsets) < 0.20)
        return { ok: false, reason: "dossier-spread-too-small" };
      return { ok: true };
    }
    if (!sameSetupAcrossMotion())
      return { ok: false, reason: "dossier-variable-mismatch" };
    if (assertionId === "A1") {
      var allSteady = rows.every(function (r) {
        return r.stage === "steady" && r.classification === "近似穩速" &&
          r.landing === "foot" &&
          r.release === "latch" && dossierHasVisibleShoreSpeedPaper(r) &&
          r.sameStone && r.sameHeight;
      });
      return allSteady ? { ok: true } : { ok: false, reason: "dossier-source-mismatch" };
    }
    if (assertionId === "A3") {
      if (cleanRows("steady", "近似穩速", "foot").length < 3 ||
          cleanRows("depart", "正在變快", "aft").length < 3)
        return { ok: false, reason: "dossier-comparison-missing" };
      return rows.every(function (r) {
        return (r.stage === "steady" && r.classification === "近似穩速" && r.landing === "foot") ||
          (r.stage === "depart" && r.classification === "正在變快" && r.landing === "aft");
      }) ? { ok: true } : { ok: false, reason: "dossier-source-mismatch" };
    }
    if (assertionId === "S4") {
      if (cleanRows("steady", "近似穩速", "foot").length < 3 ||
          cleanRows("depart", "正在變快", "aft").length < 3 ||
          cleanRows("brake", "正在變慢", "fore").length < 3)
        return { ok: false, reason: "dossier-comparison-missing" };
      return rows.every(function (r) {
        return (r.stage === "steady" && r.classification === "近似穩速" && r.landing === "foot") ||
          (r.stage === "depart" && r.classification === "正在變快" && r.landing === "aft") ||
          (r.stage === "brake" && r.classification === "正在變慢" && r.landing === "fore");
      }) ? { ok: true } : { ok: false, reason: "dossier-source-mismatch" };
    }
    return { ok: false, reason: "dossier-source-mismatch" };
  }
  function selectDossierSource(state0, assertionId, sourceId) {
    var s = ensureNewFields(clone(state0)), d = s.caseFile.dossier;
    refreshDossierCandidates(d);
    if (!d.candidates[assertionId]) return err(state0, "dossier-candidate-required");
    if (dossierAvailableSourceIds(d).indexOf(sourceId) < 0) return err(state0, "unknown-dossier-source");
    var xs = d.claimSelections[assertionId] || (d.claimSelections[assertionId] = []);
    var at = xs.indexOf(sourceId);
    if (at >= 0) xs.splice(at, 1);
    else if (xs.length < 30) xs.push(sourceId);
    return { state: s, ok: true, assertion: assertionId, selected: xs.slice() };
  }
  function setDossierSourceGroup(state0, assertionId, sourceIds, selected) {
    var s = ensureNewFields(clone(state0)), d = s.caseFile.dossier;
    refreshDossierCandidates(d);
    if (!d.candidates[assertionId]) return err(state0, "dossier-candidate-required");
    var available = dossierAvailableSourceIds(d);
    var ids = Array.isArray(sourceIds) ? sourceIds.map(String) : [];
    if (!ids.length || ids.some(function (id) { return available.indexOf(id) < 0; }))
      return err(state0, "unknown-dossier-source");
    var xs = d.claimSelections[assertionId] || (d.claimSelections[assertionId] = []);
    ids.forEach(function (id) {
      var at = xs.indexOf(id);
      if (selected && at < 0 && xs.length < 30) xs.push(id);
      if (!selected && at >= 0) xs.splice(at, 1);
    });
    return {
      state: s, ok: true, assertion: assertionId,
      selected: xs.slice(), group: ids.slice()
    };
  }
  function setDossierProposedScope(state0, assertionId, choice) {
    var s = ensureNewFields(clone(state0)), d = s.caseFile.dossier;
    refreshDossierCandidates(d);
    if (!d.candidates[assertionId]) return err(state0, "dossier-candidate-required");
    var allowed = {
      S1: ["all-hand-aft", "sample-only", "latch-solves-all"],
      A1: ["all-moving", "controlled-three", "earth-moves"],
      A2: ["all-motion-hidden", "local-only", "wind-never-matters"],
      A3: ["old-was-accelerating", "today-comparison", "aft-reveals-all"],
      S4: ["infer-old", "today-three-states", "universal-three-dots"]
    }[assertionId] || [];
    if (allowed.indexOf(choice) < 0) return err(state0, "unknown-dossier-scope");
    d.proposedScopes[assertionId] = choice;
    return { state: s, ok: true, assertion: assertionId, choice: choice };
  }
  function setDossierDraft(state0, field, value) {
    var s = ensureNewFields(clone(state0)), d = s.caseFile.dossier;
    if (d.pendingRecord) return err(state0, "dossier-paper-pending");
    if (field === "location" && value === "deck") d.draft.location = "deck";
    else if (field === "location" && value === "cabin")
      return err(state0, "dossier-location-fixed");
    else if (field === "vesselId" && DOSSIER_VESSEL_IDS.indexOf(value) >= 0) d.draft.vesselId = value;
    else if (field === "stage" && DOSSIER_STAGES.indexOf(value) >= 0) d.draft.stage = value;
    else if (field === "release" && DOSSIER_RELEASES.indexOf(value) >= 0) d.draft.release = value;
    else if (field === "speedRecord" && DOSSIER_SPEED_RECORDS.indexOf(value) >= 0) d.draft.speedRecord = value;
    else if (field === "positionRecord" && DOSSIER_POSITION_RECORDS.indexOf(value) >= 0) d.draft.positionRecord = value;
    else if (field === "repeats" && DOSSIER_REPEATS.indexOf(Number(value)) >= 0) d.draft.repeats = Number(value);
    else if (field === "speedBand" && DOSSIER_SPEED_BANDS.indexOf(value) >= 0) d.draft.speedBand = value;
    else if (field === "forceBand" && DOSSIER_FORCE_BANDS.indexOf(value) >= 0) d.draft.forceBand = value;
    else if (field === "beatBand" && DOSSIER_BEAT_BANDS.indexOf(value) >= 0) d.draft.beatBand = value;
    else if ((field === "sameStone" || field === "sameHeight") && value === true)
      d.draft[field] = true;
    else if ((field === "sameStone" || field === "sameHeight") && value === false)
      return err(state0, "dossier-fixed-control");
    else return err(state0, "unknown-dossier-setting");
    dossierNormalizeSettings(d.draft);
    return { state: s, ok: true, draft: clone(d.draft) };
  }
  function copyDossierRecord(state0, recordId) {
    var s = ensureNewFields(clone(state0)), d = s.caseFile.dossier;
    if (d.pendingRecord) return err(state0, "dossier-paper-pending");
    var row = d.records.find(function (r) { return r.id === Number(recordId); });
    if (!row) return err(state0, "unknown-dossier-record");
    [
      "vesselId", "stage", "release", "speedRecord", "positionRecord",
      "speedBand", "forceBand", "beatBand"
    ].forEach(function (key) {
      d.draft[key] = row[key];
    });
    d.draft.location = "deck";
    d.draft.sameStone = true;
    d.draft.sameHeight = true;
    dossierNormalizeSettings(d.draft);
    d.page = "lab";
    return { state: s, ok: true, draft: clone(d.draft) };
  }
  function runDossierExperiment(state0) {
    var s = ensureNewFields(clone(state0)), d = s.caseFile.dossier;
    var mission = dossierMissionId(d);
    if (mission === "cabin") return err(state0, "cabin-comparison-required");
    if (mission === "speed") return err(state0, "dossier-use-existing-comparison");
    if (mission === "dual" && !(s.design.dual && s.design.dual.locked))
      return err(state0, "dual-design-required");
    var draft = dossierNormalizeSettings(dossierApplyGuidedLocks(d, clone(d.draft)));
    if (draft.location === "cabin") return err(state0, "deck-experiment-required");
    if (d.pendingRecord) return err(state0, "dossier-paper-pending");
    if (draft.location !== "deck") return err(state0, "deck-experiment-required");
    if (!DOSSIER_FIXTURES[draft.stage]) return err(state0, "unknown-dossier-stage");
    if (DOSSIER_VESSEL_IDS.indexOf(draft.vesselId) < 0) return err(state0, "unknown-dossier-vessel");
    d.draft = clone(draft);
    var borrowedNow = d.borrowedVessels.indexOf(draft.vesselId) < 0;
    if (borrowedNow) d.borrowedVessels.push(draft.vesselId);
    var trialFingerprint = dossierTrialFingerprint(draft);
    var sameSetupTrial = d.records.filter(function (record) {
      return dossierTrialFingerprint(record) === trialFingerprint;
    }).length + 1;
    var row = buildDossierRecord(draft, d.nextRecordId, sameSetupTrial);
    row.borrowDays = borrowedNow ? dossierVessel(draft.vesselId).borrowDays : 0;
    d.pendingRecord = row;
    s.days += 1 + row.borrowDays;
    return {
      state: s, ok: true, pending: true, record: clone(row),
      borrowedNow: borrowedNow, dayCost: 1 + row.borrowDays
    };
  }
  function dossierAppendFiledRecord(s, d, record) {
    var row = clone(record);
    row.filed = true;
    row.dualPapers = dossierIsP3Record(row);
    d.records.push(row);
    d.nextRecordId = Math.max(d.nextRecordId, row.id + 1);
    /* 舊視覺載體同步保存，不讓新規則另造一套錯誤物理圖。 */
    var visualStage = row.classification === "停泊" || row.classification === "近似穩速" ? "v3" :
      (row.classification === "正在變快" ? "v2" :
        (row.classification === "正在變慢" ? "v4" : null));
    if (visualStage) {
      s.caseFile.voyages[visualStage] = {
        stage: visualStage,
        vessel: row.vessel, repeats: row.repeats, offsets: row.offsets.slice(),
        shoreGaps: row.shoreGaps ? row.shoreGaps.slice() : null,
        landing: row.landing === "spread" ? "foot" : row.landing
      };
    }
    if (row.dualPapers) {
      s.caseFile.voyages.dual = clone(CASE_RUNS.dual);
      s.caseFile.voyages.dual.stage = "dual";
    }
    return row;
  }
  function fileDossierRecord(state0) {
    var s = ensureNewFields(clone(state0)), d = s.caseFile.dossier;
    if (!d.pendingRecord) return err(state0, "dossier-paper-required");
    var row = dossierAppendFiledRecord(s, d, d.pendingRecord);
    d.pendingRecord = null;
    refreshDossierCandidates(d);
    return { state: s, ok: true, filed: true, record: clone(row), candidates: clone(d.candidates) };
  }
  function runDossierSeries(state0) {
    var s = ensureNewFields(clone(state0)), d = s.caseFile.dossier;
    var mission = dossierMissionId(d);
    if (mission === "cabin") return err(state0, "cabin-comparison-required");
    if (mission === "speed") return err(state0, "dossier-use-existing-comparison");
    if (mission === "dual" && !(s.design.dual && s.design.dual.locked))
      return err(state0, "dual-design-required");
    if (d.pendingRecord) return err(state0, "dossier-paper-pending");
    var draft = dossierNormalizeSettings(dossierApplyGuidedLocks(d, clone(d.draft)));
    if (draft.location !== "deck") return err(state0, "deck-experiment-required");
    if (!DOSSIER_FIXTURES[draft.stage]) return err(state0, "unknown-dossier-stage");
    if (DOSSIER_VESSEL_IDS.indexOf(draft.vesselId) < 0) return err(state0, "unknown-dossier-vessel");
    d.draft = clone(draft);
    var borrowedNow = d.borrowedVessels.indexOf(draft.vesselId) < 0;
    if (borrowedNow) d.borrowedVessels.push(draft.vesselId);
    var fingerprint = dossierTrialFingerprint(draft);
    var priorCount = d.records.filter(function (record) {
      return dossierTrialFingerprint(record) === fingerprint;
    }).length;
    /*
     * 引導任務補足到三回，接住舊存檔中已完成一／兩回的進度；
     * 自由補強的每次新決策固定再產生一組三回。雙視角是一個同步
     * 事件，只產生一對岸紙／船紙，不硬湊三回。
     */
    var count = mission === "dual" ? 1 :
      (mission === "explore" ? 3 : Math.max(0, 3 - priorCount));
    if (count < 1) return err(state0, "dossier-series-complete");
    var rows = [];
    for (var i = 0; i < count; i += 1) {
      var row = buildDossierRecord(draft, d.nextRecordId, priorCount + i + 1);
      row.borrowDays = i === 0 && borrowedNow ? dossierVessel(draft.vesselId).borrowDays : 0;
      rows.push(dossierAppendFiledRecord(s, d, row));
    }
    refreshDossierCandidates(d);
    var borrowDays = borrowedNow ? dossierVessel(draft.vesselId).borrowDays : 0;
    s.days += count + borrowDays;
    return {
      state: s, ok: true, filed: true, records: clone(rows),
      record: clone(rows[rows.length - 1]), count: count,
      borrowedNow: borrowedNow, dayCost: count + borrowDays,
      candidates: clone(d.candidates)
    };
  }
  function setDossierScope(state0, assertionId, choice) {
    var s = ensureNewFields(clone(state0)), d = s.caseFile.dossier;
    refreshDossierCandidates(d);
    var prerequisites = {
      A3: ["A1"],
      A2: ["A1", "A3"],
      /*
       * S4 的證據內容是三種船況的甲板原紙；A2 船艙對照是正常流程中
       * 先完成的任務，但不是這句斷言本身的物理前提。
       */
      S4: ["A1", "A3"]
    }[assertionId] || [];
    if (prerequisites.some(function (id) { return !d.assertions[id]; }))
      return err(state0, "dossier-assertion-order-required");
    if (!d.candidates[assertionId]) return err(state0, "dossier-candidate-required");
    var correct = {
      S1: "sample-only", A1: "controlled-three", A2: "local-only",
      A3: "today-comparison", S4: "today-three-states"
    }[assertionId];
    if (!correct) return err(state0, "unknown-dossier-assertion");
    var sourceCheck = dossierSelectedSourcesCheck(d, assertionId);
    d.sourceAttempts.push({
      assertion: assertionId,
      sources: (d.claimSelections[assertionId] || []).slice(),
      ok: sourceCheck.ok,
      reason: sourceCheck.reason || null
    });
    if (!sourceCheck.ok) return { state: s, ok: false, reason: sourceCheck.reason };
    var ok = choice === correct;
    d.scopeAttempts.push({ assertion: assertionId, choice: choice, ok: ok });
    if (!ok) return { state: s, ok: false, reason: "dossier-scope-overread" };
    d.assertions[assertionId] = true;
    d.assertionSources[assertionId] = (d.claimSelections[assertionId] || []).slice();
    d.proposedScopes[assertionId] = null;
    delete d.candidates[assertionId];
    refreshDossierCandidates(d);
    if (assertionId === "A1") s.evidence.g1 = true;
    if (assertionId === "A2") s.evidence.g2 = true;
    if (assertionId === "A3" || assertionId === "S4") s.evidence.g3 = true;
    dossierPrepareNextMission(d);
    return { state: s, ok: true, assertion: assertionId };
  }
  function runDossierCabinComparison(state0) {
    var s = ensureNewFields(clone(state0)), d = s.caseFile.dossier;
    if (!d.assertions.A1) return err(state0, "steady-assertion-required");
    if (!d.assertions.A3) return err(state0, "speed-assertion-required");
    if (dossierMissionId(d) !== "cabin") return err(state0, "cabin-comparison-required");
    /* 舊版單回 API 仍可由存檔或測試呼叫，也必須服從新版踏查閘門；
       只有已經持有 combined 舊原紙的進度可以沿用舊格式續做。 */
    if (!d.designCommitments.cabinWind && !d.blind.records.length)
      return err(state0, "cabin-wind-plan-required");
    if (!d.designCommitments.cabinInstrument && !d.blind.records.length)
      return err(state0, "cabin-instrument-required");
    var stage = d.draft.stage === "dock" ? "dock" : "steady";
    var serial = d.blind.records.length + 1;
    var instrument = d.designCommitments.cabinInstrument || "combined";
    var row = {
      id: "C" + serial,
      stage: stage,
      instrument: instrument,
      stageLabel: stage === "dock" ? "繫纜停泊" : "出港平駛",
      observer: "船艙內由伽桑狄記" + (instrument === "drip" ? "滴水落點" :
        (instrument === "toss" ? "石球拋接" : "水面與落球")) + "；岸上由艾蒂安記船位",
      classification: stage === "dock" ? "岸標位置不變" : "岸標間距近乎相同",
      shoreGaps: stage === "dock" ? [0, 0, 0] : [1.5, 1.5, 1.5],
      water: instrument === "drip" ? "水滴落在碗內標記附近" :
        (instrument === "toss" ? "本輪未使用滴水壺" : "水面沒有固定偏向"),
      ball: instrument === "toss" ? "石球直上拋起後落回手邊附近" :
        (instrument === "drip" ? "本輪未使用石球" : "小球落在放手點正下方")
    };
    d.blind.records.push(row);
    d.blind.ran = true;
    d.blind.unsealed = true;
    d.blind.scope = false;
    var dockCount = d.blind.records.filter(function (item) { return item.stage === "dock"; }).length;
    var steadyCount = d.blind.records.filter(function (item) { return item.stage === "steady"; }).length;
    d.blind.judgment = dockCount >= 3 && steadyCount >= 3 ? "comparison-recorded" : null;
    s.caseFile.voyages.cabin = clone(CASE_RUNS.cabin);
    s.caseFile.voyages.cabin.stage = "cabin";
    refreshDossierCandidates(d);
    s.days += 1;
    return {
      state: s, ok: true, record: clone(row), records: clone(d.blind.records),
      dockCount: dockCount, steadyCount: steadyCount
    };
  }
  function runDossierCabinSeries(state0) {
    var s = ensureNewFields(clone(state0)), d = s.caseFile.dossier;
    if (!d.assertions.A1) return err(state0, "steady-assertion-required");
    if (!d.assertions.A3) return err(state0, "speed-assertion-required");
    if (dossierMissionId(d) !== "cabin") return err(state0, "cabin-comparison-required");
    if (!d.designCommitments.cabinWind && !d.blind.records.length)
      return err(state0, "cabin-wind-plan-required");
    if (!d.designCommitments.cabinInstrument && !d.blind.records.length)
      return err(state0, "cabin-instrument-required");
    var stage = d.draft.stage === "dock" ? "dock" : "steady";
    var existing = d.blind.records.filter(function (item) { return item.stage === stage; }).length;
    var count = Math.max(0, 3 - existing);
    if (!count) return err(state0, "dossier-cabin-series-complete");
    var rows = [];
    for (var i = 0; i < count; i += 1) {
      var serial = d.blind.records.length + 1;
      var instrument = d.designCommitments.cabinInstrument || "combined";
      var row = {
        id: "C" + serial,
        stage: stage,
        instrument: instrument,
        stageLabel: stage === "dock" ? "繫纜停泊" : "出港平駛",
        observer: "船艙內由伽桑狄記" + (instrument === "drip" ? "滴水落點" :
          (instrument === "toss" ? "石球拋接" : "水面與落球")) + "；岸上由艾蒂安記船位",
        classification: stage === "dock" ? "岸標位置不變" : "岸標間距近乎相同",
        shoreGaps: stage === "dock" ? [0, 0, 0] : [1.5, 1.5, 1.5],
        water: instrument === "drip" ? "水滴落在碗內標記附近" :
          (instrument === "toss" ? "本輪未使用滴水壺" : "水面沒有固定偏向"),
        ball: instrument === "toss" ? "石球直上拋起後落回手邊附近" :
          (instrument === "drip" ? "本輪未使用石球" : "小球落在放手點正下方")
      };
      d.blind.records.push(row);
      rows.push(row);
    }
    d.blind.ran = true;
    d.blind.unsealed = true;
    d.blind.scope = false;
    var dockCount = d.blind.records.filter(function (item) { return item.stage === "dock"; }).length;
    var steadyCount = d.blind.records.filter(function (item) { return item.stage === "steady"; }).length;
    d.blind.judgment = dockCount >= 3 && steadyCount >= 3 ? "comparison-recorded" : null;
    s.caseFile.voyages.cabin = clone(CASE_RUNS.cabin);
    s.caseFile.voyages.cabin.stage = "cabin";
    refreshDossierCandidates(d);
    s.days += count;
    return {
      state: s, ok: true, records: clone(rows), record: clone(rows[rows.length - 1]),
      count: count, dockCount: dockCount, steadyCount: steadyCount
    };
  }
  function commitDossierCabinWindPlan(state0, choice) {
    var s = ensureNewFields(clone(state0)), d = s.caseFile.dossier;
    if (!d.assertions.A1) return err(state0, "steady-assertion-required");
    if (!d.assertions.A3) return err(state0, "speed-assertion-required");
    if (dossierMissionId(d) !== "cabin") return err(state0, "cabin-comparison-required");
    var allowed = ["wait-calm", "windbreak", "close-cabin"];
    if (allowed.indexOf(choice) < 0) return err(state0, "unknown-cabin-wind-plan");
    var ok = choice === "close-cabin";
    var reason = choice === "wait-calm"
      ? "wind-wait-unmeasured"
      : (choice === "windbreak" ? "windbreak-incomplete" : null);
    d.designCommitments.cabinWindAttempts.push({ choice: choice, ok: ok });
    if (ok) d.designCommitments.cabinWind = choice;
    return { state: s, ok: ok, reason: reason, choice: choice };
  }
  function commitDossierCabinInstrument(state0, choice) {
    var s = ensureNewFields(clone(state0)), d = s.caseFile.dossier;
    if (!d.assertions.A1) return err(state0, "steady-assertion-required");
    if (!d.assertions.A3) return err(state0, "speed-assertion-required");
    if (dossierMissionId(d) !== "cabin") return err(state0, "cabin-comparison-required");
    if (d.designCommitments.cabinWind !== "close-cabin")
      return err(state0, "cabin-wind-plan-required");
    if (d.blind.records.length) return err(state0, "cabin-instrument-locked");
    if (["drip", "toss"].indexOf(choice) < 0)
      return err(state0, "unknown-cabin-instrument");
    d.designCommitments.cabinInstrumentAttempts.push(choice);
    d.designCommitments.cabinInstrument = choice;
    return { state: s, ok: true, choice: choice };
  }
  function runDossierBlind(state0) {
    return runDossierCabinComparison(state0);
  }
  function judgeDossierBlind(state0, choice) {
    var s = ensureNewFields(clone(state0)), d = s.caseFile.dossier;
    if (!d.blind.ran) return err(state0, "dossier-blind-required");
    if (!Array.isArray(d.blind.records) || d.blind.records.length < 6)
      return err(state0, "cabin-records-incomplete");
    var ok = choice === "indistinguishable";
    d.blind.attempts.push({ kind: "judgment", choice: choice, ok: ok });
    if (!ok) return { state: s, ok: false, reason: "local-traces-overread" };
    /* 舊 API 只相容判讀現存原紙；不得再用兩張彙總 fixture 覆寫六回紀錄。 */
    d.blind.judgment = "comparison-recorded";
    d.blind.unsealed = true;
    refreshDossierCandidates(d);
    return { state: s, ok: true, unsealed: true };
  }
  function dossierExperimentalAssertion(d) {
    return ["A1", "A2", "A3", "S1", "S4"].some(function (id) { return d.assertions[id]; });
  }
  /* ── 旅人心聲層(E-2b,A⁺ 最低有效劑量)────────────────────────────
     篩選規則:OS 只在「沒有第二個人能講這句話」的時候上。
     對手台詞、動作指示或系統訊息已經表達過的,一律不寫。
     每句只播一次(osFired),否則玩家重試時會重複出現,讀起來像 bug。 */
  var DOSSIER_OS = {
    "p1-bad":  "……他沒有說我錯。他說我那張紙沒有回答他問的事。這兩件事不一樣，而且第二件比較難救。",
    "p1-done": "我剛剛親口說了一句「我還不能說」。在比薩的時候，我最怕的就是這句。",
    "p2-mine": "「我的」。（頓）早上他說的是「以前也有人做過」。",
    "p2-done": "我把話改小了一圈，他就說「我認」。（頓）早上我還以為，要把話講大才算贏。",
    "p3-align":"同一時刻要先講好——這件事我從來沒想過。我原本待的地方，每個人口袋裡都有同一個鐘。",
    "p3-done": "那條彎線。（頓）如果我把它一直畫下去，它會走到哪裡？",
    "blocked": "要回船上再做一趟。他沒有趕我走，他只是把紙推回來。（頓）這比被罵難受——被罵我至少可以生氣。"
  };
  function dossierOS(d, key) {
    if (!key || !DOSSIER_OS[key]) return;
    if (d.debate.osFired.indexOf(key) >= 0) return;   /* 只播一次 */
    d.debate.osFired.push(key);
    d.debate.lastOS = DOSSIER_OS[key];
  }
  function dossierNextPillar(db) {
    if (!db.pillars.p1) return "p1";
    if (!db.pillars.p2) return "p2";
    if (!db.pillars.p3) return "p3";
    return null;
  }
  function dossierPillarOpening(pillar, dossier) {
    return {
      p1: "維達爾船長：「船往前，石頭往下。沒有東西推它，它當然落在後面。」",
      p2: "維達爾船長：（按住舊紙）「我看見的落後是真的。你憑什麼說它不能代表所有船？」",
      p3: dossier && dossierHasDual(dossier)
        ? "維達爾船長：（分開兩張紙）「岸上畫彎，船上畫直。同一顆石頭，不可能走兩條路。」"
        : "維達爾船長：「前兩問答完了。最後一問需要同一趟的岸紙和船紙；你現在還沒有。」"
    }[pillar] || "";
  }
  function enterDossierDebate(state0) {
    var s = ensureNewFields(clone(state0)), d = s.caseFile.dossier;
    if (!dossierExperimentalAssertion(d) && !d.records.length && !d.blind.ran)
      return err(state0, "dossier-record-required");
    d.page = "debate";
    d.debate.visits += 1;
    d.debate.current = dossierNextPillar(d.debate);
    d.debate.lastPlayerLine = "";
    d.debate.entryBlocked = null;
    if (d.debate.rep <= 0) d.debate.rep = 5;
    if (!dossierExperimentalAssertion(d)) {
      var groups = {};
      d.records.forEach(function (row) {
        var key = row.classification + "|" + dossierComparableFingerprint(row);
        groups[key] = (groups[key] || 0) + 1;
      });
      var best = Object.keys(groups).reduce(function (n, key) {
        return Math.max(n, groups[key]);
      }, 0);
      d.debate.active = false;
      d.debate.entryBlocked = best === 1 ? "one-run" : (best === 2 ? "two-runs" : "no-assertion");
      d.debate.lastReply = best === 1
        ? "維達爾船長：「一回只能告訴我那一回發生了什麼。換一回還會不會一樣，你沒有紙可以回答。」"
        : (best === 2
          ? "維達爾船長：「兩回比一回好，但還看不出是規律，還是兩次剛好相同。再做一回。」"
          : "維達爾船長：「紙帶來了，可你還沒寫出一句敢讓我問的話。先回去讀清楚。」");
      dossierOS(d, "blocked");
      return { state: s, ok: true, blocked: true, reason: d.debate.entryBlocked };
    }
    d.debate.active = true;
    d.debate.lastReply = dossierPillarOpening(d.debate.current, d);
    return { state: s, ok: true };
  }
  function leaveDossierDebate(state0, pin) {
    var s = ensureNewFields(clone(state0)), d = s.caseFile.dossier;
    if (pin && d.debate.pins.indexOf(pin) < 0) d.debate.pins.push(pin);
    d.debate.active = false;
    d.debate.current = null;
    d.debate.entryBlocked = null;
    d.page = "lab";
    d.debate.lastReply = "維達爾船長：「知道缺哪張紙，比拿錯紙硬撐有用。去吧。」";
    return { state: s, ok: true };
  }
  function selectDossierPillar(state0, pillar) {
    var s = ensureNewFields(clone(state0)), d = s.caseFile.dossier;
    if (["p1", "p2", "p3"].indexOf(pillar) < 0) return err(state0, "unknown-dossier-pillar");
    if (d.debate.pillars[pillar]) return err(state0, "dossier-pillar-complete");
    if (pillar !== dossierNextPillar(d.debate)) return err(state0, "dossier-pillar-locked");
    d.page = "debate";
    d.debate.active = true;
    d.debate.current = pillar;
    d.debate.lastPlayerLine = "";
    if (pillar === "p2" && d.assertions.S4) d.debate.p2.question = true;
    d.debate.lastReply = dossierPillarOpening(pillar, d);
    return { state: s, ok: true, pillar: pillar };
  }
  function dossierFailDebate(s, pillar, step, choice, reason, reply) {
    var d = s.caseFile.dossier, db = d.debate;
    db.attempts.push({ pillar: pillar, step: step, choice: choice, ok: false, reason: reason });
    db.rep = Math.max(0, db.rep - 1);
    db.lastReply = reply;
    if (db.rep === 0) {
      var stepNames = {
        source: "證據",
        concept: "說法",
        steady: "走穩紀錄",
        cabin: "船艙對照",
        wind: "風的結論",
        question: "舊紙缺口",
        depart: "解纜起步紀錄",
        old: "舊紙分類",
        boundary: "舊紙能說到哪裡",
        scope: "這句話能說到哪些船",
        "scope-diagnosis": "換船時一起改變的條件"
      };
      var pin = "回船補做：「" + (stepNames[step] || "這一步") + "」還缺能回答的原紙";
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
  function dossierCleanDepartRows(d) {
    return d.records.filter(function (row) {
      return row.filed && row.location === "deck" &&
        row.stage === "depart" && row.landing === "aft" &&
        row.classification === "正在變快" &&
        row.release === "latch" && dossierHasVisibleShoreSpeedPaper(row) &&
        row.sameStone && row.sameHeight;
    });
  }
  function dossierCleanSteadyRows(d) {
    return d.records.filter(function (row) {
      return row.filed && row.location === "deck" &&
        row.stage === "steady" && row.landing === "foot" &&
        row.classification === "近似穩速" &&
        row.release === "latch" && dossierHasVisibleShoreSpeedPaper(row) &&
        row.sameStone && row.sameHeight;
    });
  }
  function dossierTestedSpeedBands(d) {
    var groups = {};
    dossierCleanSteadyRows(d).forEach(function (row) {
      var speedBand = dossierEffectiveSpeedBand(row);
      var key = speedBand + "|" + dossierComparableFingerprint(row);
      groups[key] = (groups[key] || 0) + 1;
    });
    return unique(Object.keys(groups).filter(function (key) {
      return groups[key] >= 3;
    }).map(function (key) { return key.split("|")[0]; }));
  }
  function dossierTestedVesselIds(d) {
    var groups = {};
    dossierCleanDepartRows(d).forEach(function (row) {
      var vesselId = row.vesselId || "captain";
      var key = vesselId + "|" + dossierComparableFingerprint(row);
      groups[key] = (groups[key] || 0) + 1;
    });
    return unique(Object.keys(groups).filter(function (key) {
      return groups[key] >= 3;
    }).map(function (key) { return key.split("|")[0]; }));
  }
  function getDossierScopeProgress(stateOrDossier) {
    var d = stateOrDossier && stateOrDossier.caseFile
      ? stateOrDossier.caseFile.dossier : stateOrDossier;
    if (!d || !Array.isArray(d.records))
      return { speedBands: [], vesselIds: [] };
    return {
      speedBands: dossierTestedSpeedBands(d),
      vesselIds: dossierTestedVesselIds(d)
    };
  }
  function dossierVesselNames(ids) {
    return ids.map(function (id) { return dossierVessel(id).name; });
  }
  function dossierLatestDepartRows(d) {
    var latest = {};
    var tested = dossierTestedVesselIds(d);
    dossierCleanDepartRows(d).forEach(function (row) {
      var vesselId = row.vesselId || "captain";
      if (tested.indexOf(vesselId) >= 0) latest[vesselId] = row;
    });
    return Object.keys(latest).map(function (id) { return latest[id]; });
  }
  function dossierShowsHeightOffsetTrend(d) {
    var rows = dossierLatestDepartRows(d).map(function (row) {
      var offsets = Array.isArray(row.offsets) ? row.offsets.filter(function (value) {
        return typeof value === "number" && Number.isFinite(value);
      }) : [];
      return {
        height: Number(row.mastHeight),
        offset: offsets.length ? Math.abs(mean(offsets)) : NaN
      };
    }).filter(function (row) {
      return Number.isFinite(row.height) && Number.isFinite(row.offset);
    }).sort(function (a, b) { return a.height - b.height; });
    if (rows.length < 2) return false;
    return rows.every(function (row, index) {
      return index === 0 ||
        (row.height > rows[index - 1].height && row.offset > rows[index - 1].offset);
    });
  }
  function getDossierScopeOptions(stateOrDossier) {
    var d = stateOrDossier && stateOrDossier.caseFile
      ? stateOrDossier.caseFile.dossier : stateOrDossier;
    if (!d || !Array.isArray(d.records)) return [];
    var testedVessels = dossierTestedVesselIds(d);
    var testedNames = dossierVesselNames(testedVessels);
    var options = [];
    if (testedNames.length > 1) options.push({
      choice: "one-tested-vessel",
      text: "這句話寫在" + testedNames[0] + "上：這批人照這套操法解纜起步，落點偏到桅後。"
    });
    options.push({
      choice: "tested-vessels-only",
      text: testedNames.length > 1
        ? "這句話寫在卷宗裡做過的船上：換了船和人，解纜起步的落點仍偏到桅後。"
        : "這句話寫在" + testedNames[0] + "上：這批人照這套操法解纜起步，落點偏到桅後。"
    });
    if (testedNames.length > 1 && dossierShowsHeightOffsetTrend(d)) options.push({
      choice: "height-causes-offset",
      text: "這句話寫在桅高上：小艇偏得較少，大船偏得較多，所以偏移大小由桅高決定。"
    });
    options.push({
      choice: "all-vessels",
      text: "這句話寫在所有船上：解纜起步的落點會偏到桅後，跟換哪一艘船無關。"
    });
    return options;
  }
  function dossierP2ScopeReady(p2) {
    return !!(p2 && p2.question && p2.concept && p2.steady && p2.depart &&
      p2.old && p2.boundary);
  }
  function answerDossierDebate(state0, pillar, step, choice) {
    var s = ensureNewFields(clone(state0)), d = s.caseFile.dossier, db = d.debate;
    if (!db.active || db.current !== pillar) return err(state0, "dossier-debate-not-active");
    var playerLines = {
      p1: {
        source: {
          A1: "我先出示走穩三回的岸紙。岸紙確認船速近乎不變，三回落點都在桅腳附近。",
          A3: "我先用解纜起步的後偏原紙回答。",
          S1: "我先用徒手放石頭的散布原紙回答。"
        },
        concept: {
          "shared-motion": "門閂只撤掉托住石頭的東西；石頭原先跟船共有的前行沒有被擦掉。",
          "motion-resets": "門閂一開，石頭所有運動都重新從零開始。",
          "stone-chases": "石頭離手後，會自己追著往前的桅杆。"
        },
        steady: {
          A1: "走穩的三回都用同一顆石頭、同一高度和門閂放手；岸紙也確認船速近乎不變。落點都在桅腳附近。",
          A3: "解纜起步那組落在桅後。",
          S1: "徒手放下的三回，落點散開了。"
        },
        cabin: {
          A2: "停泊三回、平駛三回；六回都有岸紙。封閉船艙隔開甲板風後，水面與落球結果仍相近；這只能回答甲板風不是必要條件。",
          A1: "甲板上的走穩三回都落在桅腳附近。",
          A3: "解纜起步那組落在桅後。"
        },
        wind: {
          "limited-wind": "甲板那一趟的風影響多少，我還不能說；但把甲板風隔開後，石頭仍不一定落後。",
          "wind-never-matters": "甲板風在這類落石裡不會改變結果。",
          "wind-proved-false": "這兩趟足以排除風的影響。"
        }
      },
      p2: {
        source: {
          A3: "我先把今天解纜起步、船速逐拍增加的原紙放上來。",
          A2: "我先把封閉船艙停泊三回、平駛三回的六張對照紙放上來。",
          A1: "我先把走穩三回、落在桅腳附近的原紙放上來。"
        },
        question: {
          landing: "舊紙缺的是落點。",
          "speed-change": "舊紙沒記放手時船速有沒有還在改變。",
          authorship: "舊紙缺的是維達爾船長親筆簽名。"
        },
        concept: {
          "motion-vs-change": "船正在向前，和船速正在改變，是兩件不同的事。",
          "old-is-fake": "少了船速欄，這張舊紙就是假的。",
          "stone-heavier": "船加速時，石頭會突然變重。"
        },
        steady: {
          steady: "岸標間距近乎一樣。這張放進「近似走穩」。",
          accelerating: "這張放進「正在變快」。",
          unclassified: "這張先不分類。"
        },
        depart: {
          steady: "解纜起步這張放進「近似走穩」。",
          accelerating: "岸標間距一拍比一拍長。這張是「正在變快」。",
          unclassified: "解纜起步這張先不分類。"
        },
        old: {
          steady: "舊紙記的是近似走穩。",
          accelerating: "舊紙記的是正在變快。",
          unclassified: "它只有落點，沒有岸標。船速這一欄只能空著。"
        },
        boundary: {
          "prove-old-accelerating": "今天三種船況的落點，已經足以判定舊航次記到的也是變快。",
          "discard-old": "舊紙缺了船速，不能再拿來用。",
          "same-pattern-not-proof": "它和今天變快那組很像；但沒有當趟船速，只能保留為未分類。"
        },
        "scope-diagnosis": {
          "height-only": "不同的是桅高；其餘欄位可以視為相同。",
          "vessel-crew-method": "船本身、操船的人和槳法。",
          "release-stone-repeats": "放手的人、石頭和重複回數。"
        }
      }
    };
    db.lastPlayerLine = playerLines[pillar] && playerLines[pillar][step] &&
      playerLines[pillar][step][choice] || "";
    if (!db.lastPlayerLine && (step === "source" || step === "cabin")) {
      db.lastPlayerLine = {
        A1: "我出示走穩三回的岸紙。",
        A2: "我出示封閉船艙停泊三回、平駛三回的六張對照紙。",
        A3: "我出示今天走穩與解纜起步的對照原紙。",
        A6: "我出示八年前那張只記了後偏的舊紙。",
        S1: "我出示徒手放石時落點散開的原紙。",
        S4: "我出示變快、走穩與變慢三組原紙。"
      }[choice] || (/^dual-papers(?::\d+)?$/.test(choice || "")
        ? "我出示同一趟由岸上和船上各自留下、共用鼓號的兩張原紙。"
        : "");
    }
    db.lastOS = "";
    if (pillar === "p1") {
      if (step === "source") {
        if (!d.assertions.A1) return dossierMissing(s, "第一柱需要走穩三回的原紙",
          "維達爾船長：「你還沒有一張同時寫明走穩、門閂放手與三回落點的紙。」");
        if (choice !== "A1") { dossierOS(d, "p1-bad"); return dossierFailDebate(s, pillar, step, choice, "evidence-mismatch",
          "商人：「那張紙有資料，可它沒有回答走穩時為什麼不落後。」"); }
        db.p1.source = "A1";
        db.p1.steady = true;
        db.p1.concept = false;
        db.lastReply = "維達爾船長：（指著門閂欄）「這張紙我收。門閂打開時，哪一樣被拿掉，哪一樣沒有消失？」";
      } else if (step === "concept") {
        if (choice !== "shared-motion") return dossierFailDebate(s, pillar, step, choice, "concept-mismatch",
          "維達爾船長：（指著門閂欄）「門閂只碰了托板。你說石頭歸零或追船，記在哪一欄？」");
        db.p1.concept = true;
        db.lastReply = "維達爾船長：「好，原來的前行沒有被門閂抹掉。可桅頂不是密室；甲板上的風也跟船一起走。你怎麼把兩件事分開？」";
      } else if (step === "steady") {
        if (!d.assertions.A1) return dossierMissing(s, "需要三回乾淨的走穩紀錄",
          "維達爾船長：「一回、手放或沒記船速，都不能替『走穩』作證。」");
        if (choice !== "A1") return dossierFailDebate(s, pillar, step, choice, "evidence-mismatch",
          "商人：「那張紙回答的不是走穩時落在哪裡。」");
        db.p1.steady = true;
        db.lastReply = "槳手：「甲板上有風。你怎麼知道不是風把石頭推回桅腳？」";
      } else if (step === "cabin") {
        if (!d.assertions.A2) return dossierMissing(s, "甲板風是必要條件嗎？",
          "槳手：「你還沒有把甲板風隔開，再比較停泊和走穩。」");
        if (choice !== "A2") return dossierFailDebate(s, pillar, step, choice, "evidence-mismatch",
          "槳手：（指紙角）「這張是在甲板上畫的。你拿哪一張隔開甲板風？」");
        db.p1.cabin = true;
        db.p1.concept = true;
        db.p1.steady = true;
        if (d.designCommitments.cabinWind === "close-cabin") {
          db.p1.wind = true;
          db.pillars.p1 = true;
          db.current = "p2";
          db.lastReply = "伽桑狄：（把自己簽名的六張船艙紙攤開）「停泊三回，平駛三回。隔開甲板風後，兩組結果仍相近。」\n槳手：「你在動手前已把話寫小：這組只回答關艙後的比較。好，下一問，船長那張舊紙。」";
          dossierOS(d, "p1-done");
        } else {
          db.lastReply = "伽桑狄：（把自己簽名的六張船艙紙攤開）「停泊三回，平駛三回。隔開甲板風後，兩組結果仍相近。」\n槳手：「好。可這只隔開了甲板風——你最多敢把結論寫到哪裡？」";
        }
      } else if (step === "wind") {
        if (choice !== "limited-wind") return dossierFailDebate(s, pillar, step, choice, "overclaim",
          "槳手：（指著兩組標題）「船艙隔開的是甲板風。你憑哪一欄，替甲板那一趟的風下結論？」");
        db.p1.wind = true;
        db.pillars.p1 = true;
        db.current = "p2";
        db.lastReply = "槳手：「這一問過了。下一問，船長那張舊紙。」";
        dossierOS(d, "p1-done");
      } else return err(state0, "unknown-dossier-debate-step");
    } else if (pillar === "p2") {
      if (step === "source") {
        if (!d.assertions.A3) return dossierMissing(s, "第二柱需要一張有當趟船速的起步原紙",
          "維達爾船長：「你要分前進和變速，先拿出一張當趟記了船速變化的紙。」");
        if (choice !== "A3") return dossierFailDebate(s, pillar, step, choice, "evidence-mismatch",
          "維達爾船長：「那張紙沒有同時回答『船速正在改』和『落點在哪裡』。」");
        db.p2.source = "A3";
        db.p2.question = true;
        db.p2.concept = true;
        db.p2.steady = true;
        db.p2.depart = true;
        db.p2.old = true;
        db.lastReply = "維達爾船長：（把今天的起步原紙壓在舊紙旁）「今天這張同時記了船愈走愈快和落點後偏；舊紙只記後偏，沒有當趟船速。你最多敢替舊紙說到哪裡？」";
        dossierOS(d, "p2-mine");
      } else if (step === "question") {
        if (choice !== "speed-change") return dossierFailDebate(s, pillar, step, choice, "question-mismatch",
          "維達爾船長：（指落點）「落後我已經寫了。缺的是那時船怎麼走。」");
        db.p2.question = true;
        db.lastReply = "維達爾船長：「沒有記。那又怎樣？」";
      } else if (step === "concept") {
        if (choice !== "motion-vs-change") return dossierFailDebate(s, pillar, step, choice, "concept-mismatch",
          "維達爾船長：（指著『船速』欄）「你剛才說的，是船在往前，還是船愈走愈快？」");
        db.p2.concept = true;
        db.lastReply = "維達爾船長：「把今天的三張紙分一分。」";
      } else if (step === "steady") {
        if (!d.assertions.A1) return dossierMissing(s, "需要岸紙確認的走穩對照",
          "維達爾船長：「你給了我一艘變快的船，還沒有一艘走穩的船。」");
        if (choice !== "steady") return dossierFailDebate(s, pillar, step, choice, "classification-mismatch",
          "艾蒂安：（指岸標紙）「三段間距我都畫在這裡。你再看一次，它們怎麼變？」");
        db.p2.steady = true;
        db.lastReply = "艾蒂安：「岸標間距近乎一樣。這張我能確認。」";
      } else if (step === "depart") {
        if (!d.assertions.A3) return dossierMissing(s, "需要解纜起步的完整船速與落點紀錄",
          "維達爾船長：「你還缺一張同一趟記下『船愈走愈快』和『石頭落到桅後』的紙。」");
        if (choice !== "accelerating") return dossierFailDebate(s, pillar, step, choice, "classification-mismatch",
          "艾蒂安：（指岸標紙）「每拍位置都在這裡。你再看一次，間距是一樣，還是拉開？」");
        db.p2.depart = true;
        db.lastReply = "艾蒂安：「落點在桅後；岸標間距也確實一拍比一拍長。」";
      } else if (step === "old") {
        if (!d.assertions.A6) return dossierMissing(s, "先說清舊紙能證明到哪裡",
          "維達爾船長：「先別替舊紙猜。它只記了落點。」");
        if (choice !== "unclassified") return dossierFailDebate(s, pillar, step, choice, "old-paper-overread",
          "馬蒂厄：（指空欄）「這裡沒有人記船速。今天不能替八年前補上。」");
        db.p2.old = true;
        db.lastReply = "馬蒂厄：（指空欄）「今天不能替八年前填。」";
      } else if (step === "boundary") {
        if (!d.assertions.A6) return dossierMissing(s, "先把八年前只記落點後偏的舊紙放回桌上",
          "維達爾船長：「你還沒拿到我的舊紙，不能替那一趟補船況。」");
        if (choice !== "same-pattern-not-proof") return dossierFailDebate(s, pillar, step, choice, "old-paper-overread",
          "維達爾船長：（指著舊紙的船速空欄）「你說它是哪種船況。這一格的數字在哪裡？」");
        db.p2.question = true;
        db.p2.concept = true;
        db.p2.steady = true;
        db.p2.depart = true;
        db.p2.old = true;
        db.p2.boundary = true;
        db.lastReply = "槳手：（翻到原紙的條件欄）「最後一問。你這句話，究竟是在幾艘船上驗過的？」";
      } else if (step === "scope-diagnosis") {
        if (!dossierP2ScopeReady(db.p2)) return err(state0, "dossier-p2-scope-premise-required");
        if (db.p2.scopeDiagnosis !== "required") return err(state0, "dossier-scope-diagnosis-not-required");
        if (choice !== "vessel-crew-method") {
          db.attempts.push({
            pillar: pillar, step: step, choice: choice, ok: false,
            reason: "scope-diagnosis-mismatch"
          });
          db.lastReply = "槳手：（把三張條件欄並排）「船、放手、操船。逐欄讀一次，哪幾欄真的相同？」";
          return { state: s, ok: false, reason: "scope-diagnosis-mismatch", rep: db.rep };
        }
        db.p2.scopeDiagnosis = "complete";
        db.lastReply = "槳手：「現在重寫。做過幾艘，就說到幾艘。」";
      } else if (step === "scope") {
        if (!dossierP2ScopeReady(db.p2)) return err(state0, "dossier-p2-scope-premise-required");
        if (db.p2.scopeDiagnosis === "required") return err(state0, "dossier-scope-diagnosis-required");
        var testedVessels = dossierTestedVesselIds(d);
        if (!testedVessels.length) return dossierMissing(s, "需要至少一艘船的完整解纜起步紀錄",
          "槳手：「先拿出一張同時寫了船、桅高、操作者、槳法和船速的原紙。」");
        var testedNames = dossierVesselNames(testedVessels);
        var scopeOption = getDossierScopeOptions(d).find(function (option) {
          return option.choice === choice;
        });
        if (!scopeOption) return err(state0, "dossier-scope-choice-unavailable");
        db.lastPlayerLine = scopeOption.text;
        if (choice === "height-causes-offset") {
          db.p2.scopeDiagnosis = "required";
          return dossierFailDebate(s, pillar, step, choice, "confounded",
            "槳手：（把原紙並排，手壓在條件欄）「先別換結論。除了桅高，還有哪些也跟著換了？」");
        }
        if (choice === "all-vessels") return dossierFailDebate(s, pillar, step, choice, "overclaim",
          "商人：（點著船名欄）「卷宗只寫了" + testedNames.join("、") + "。卷宗以外那句，是哪張紙給你的？」");
        if (choice !== "tested-vessels-only" && choice !== "one-tested-vessel")
          return err(state0, "unknown-dossier-scope-choice");
        db.p2.scope = true;
        db.pillars.p2 = true;
        db.current = "p3";
        dossierOS(d, "p2-done");
        db.lastReply = (choice === "one-tested-vessel"
          ? "維達爾船長：「這句沒有超過你做過的那艘。我認。」"
          : "維達爾船長：「船換了，人也換了；你說到卷宗裡做過的船就停。這句我認。」") +
          (dossierHasDual(d)
            ? "\n商人：「還有最後兩張紙。岸上畫彎，船上畫直，你得當眾把它們對起來。」"
            : "\n商人：「前兩問過了。最後一問要同一趟的岸紙和船紙；你得回船把兩個位置都記下來。」");
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
    if (!p3.source) return err(state0, "dossier-p3-premise-required");
    if (!p3.question) return err(state0, "dossier-p3-question-required");
    if (!p3.concept) return err(state0, "dossier-p3-concept-required");
    var sourceRecord = dossierFindDualRecord(d, p3.sourceRecordId);
    if (!sourceRecord) return dossierMissing(s, "第三柱引用的雙視角原紙已失效",
      "艾蒂安：「先重新選一筆同一趟的岸紙和船紙。這兩張現在對不上卷宗編號。」");
    var alignment = dossierDualAlignmentData(sourceRecord);
    var ok = choice === "same-beats" && alignment.ok;
    d.debate.lastPlayerLine = {
      endpoints: "先把兩張紙的最後一點疊在一起。",
      "same-beats": "先對同一號鼓點。相同的鼓號，才是同一時刻。",
      "same-height": "先找兩張紙上高度一樣的點。"
    }[choice] || "";
    var repeatedWrong = !ok && p3.alignAttempts.some(function (a) { return a.choice === choice && !a.ok; });
    p3.alignAttempts.push({
      choice: choice, sourceRecordId: sourceRecord.id, ok: ok,
      reason: ok ? null : (alignment.reason || "beats-mismatch")
    });
    if (!ok) {
      if (repeatedWrong) d.debate.rep = Math.max(0, d.debate.rep - 1);
      d.debate.lastReply = !alignment.ok
        ? "艾蒂安：（逐號比對兩張原紙）「這兩張的鼓號、時刻或高度沒有逐拍對上，不能拿來做這一步。」"
        : (choice === "endpoints"
        ? "維達爾船長：「最後一點不是同一時刻。你看，中間的鼓號全對不上。」"
        : "維達爾船長：「同一高度不等於同一時刻。兩張紙共用的鐘在哪裡？」");
      if (d.debate.rep === 0) { d.debate.active = false; d.debate.current = null; d.page = "lab"; }
      return {
        state: s, ok: false, reason: alignment.reason || "beats-mismatch",
        sourceRecordId: sourceRecord.id, rep: d.debate.rep
      };
    }
    p3.aligned = true;
    p3.scope = false;
    p3.transformMode = null;
    p3.transformed = false;
    p3.transformedPoints = [];
    d.assertions.A4 = false;
    s.overlay.aligned = true;
    s.overlay.preview = "sameBeats";
    d.debate.lastReply = "維達爾船長：「同號鼓點對上了。這一步現在證明了什麼，又還沒證明什麼？」";
    dossierOS(d, "p3-align");
    return { state: s, ok: true, assertion: "A4", sourceRecordId: sourceRecord.id };
  }
  function transformDossierPapers(state0, choice) {
    var s = ensureNewFields(clone(state0)), d = s.caseFile.dossier, p3 = d.debate.p3;
    if (!d.debate.active || d.debate.current !== "p3" || !p3.aligned)
      return err(state0, "dossier-alignment-required");
    if (!p3.scope) return err(state0, "dossier-p3-boundary-required");
    if (["translate-once", "subtract-each-beat", "rotate-paper"].indexOf(choice) < 0)
      return err(state0, "unknown-dossier-transform");
    var sourceRecord = dossierFindDualRecord(d, p3.sourceRecordId);
    if (!sourceRecord) return dossierMissing(s, "第三柱引用的雙視角原紙已失效",
      "艾蒂安：「這兩張紙已經對不上卷宗編號。先回到原紙，重新選一筆。」");
    var transformed = dossierDualTransformData(sourceRecord);
    var ok = choice === "subtract-each-beat" && transformed.ok;
    d.debate.lastPlayerLine = {
      "translate-once": "把整張岸紙平移一次，讓桅杆回到零點。",
      "subtract-each-beat": "每一拍都扣掉桅杆當時的位置，讓桅杆在每一拍都是零點。",
      "rotate-paper": "把岸紙旋轉，讓彎線看起來垂直。"
    }[choice] || "";
    var repeatedWrong = !ok && p3.transformAttempts.some(function (a) {
      return a.kind === "method" && a.choice === choice && !a.ok;
    });
    p3.transformAttempts.push({
      kind: "method", choice: choice, sourceRecordId: sourceRecord.id, ok: ok,
      reason: ok ? null : (transformed.reason || "wrong-transform")
    });
    if (!ok) {
      if (repeatedWrong) d.debate.rep = Math.max(0, d.debate.rep - 1);
      d.debate.lastReply = !transformed.ok
        ? "艾蒂安：（逐拍重算）「岸紙扣掉桅杆位置後，沒有在讀值誤差內對上船紙。這組原紙不能通過。」"
        : (choice === "translate-once"
        ? "維達爾船長：「只搬一次，後面的桅杆仍然離開零點。你的尺沒有跟著走。」"
        : "商人：「把紙轉直，只會連鼓點順序和距離一起扭壞。」");
      if (d.debate.rep === 0) { d.debate.active = false; d.debate.current = null; d.page = "lab"; }
      return {
        state: s, ok: false, reason: transformed.reason || "wrong-transform",
        sourceRecordId: sourceRecord.id, rep: d.debate.rep
      };
    }
    p3.transformMode = "subtract-each-beat";
    p3.transformed = false;
    p3.transformTolerance = null;
    p3.maxResidual = null;
    s.overlay.transformed = false;
    s.overlay.preview = "sameBeats";
    s.caseFile.transformProgress = p3.transformedPoints.length / transformed.points.length;
    d.debate.lastReply = "維達爾船長：「對。別讓引擎替你一口氣算完。從零號鼓點開始，把岸紙的尺逐拍移到桅杆。」";
    return {
      state: s, ok: true, ready: true, completed: false,
      sourceRecordId: sourceRecord.id,
      nextBeat: transformed.points[p3.transformedPoints.length].beat,
      totalBeats: transformed.points.length
    };
  }
  function transformDossierPaperBeat(state0, beat0, appliedMastX0) {
    var s = ensureNewFields(clone(state0)), d = s.caseFile.dossier, p3 = d.debate.p3;
    if (!d.debate.active || d.debate.current !== "p3" || !p3.aligned)
      return err(state0, "dossier-alignment-required");
    if (p3.transformMode !== "subtract-each-beat")
      return err(state0, "dossier-transform-method-required");
    var sourceRecord = dossierFindDualRecord(d, p3.sourceRecordId);
    if (!sourceRecord) return dossierMissing(s, "第三柱引用的雙視角原紙已失效",
      "艾蒂安：「這兩張紙已經對不上卷宗編號。先回到原紙，重新選一筆。」");
    var transformed = dossierDualTransformData(sourceRecord);
    if (!transformed.ok) return dossierMissing(s, "逐拍換尺資料無法互相核對",
      "艾蒂安：「原紙上的鼓號、桅杆位置或石頭位置對不上，這組不能繼續算。」");
    var index = p3.transformedPoints.length;
    if (index >= transformed.points.length)
      return { state: s, ok: true, noop: true, completed: !!p3.transformed };
    var expectedPoint = transformed.points[index];
    var beat = Number(beat0), appliedMastX = Number(appliedMastX0);
    if (!Number.isInteger(beat) || beat !== expectedPoint.beat)
      return err(state0, "dossier-transform-beat-order");
    if (!isFinite(appliedMastX) || Math.abs(appliedMastX) > 100)
      return err(state0, "invalid-dossier-transform-distance");
    var shorePoint = sourceRecord.papers.shore.beats[index];
    var expectedMastX = Number(shorePoint.mastX);
    var shoreRelativeX = dossierRound(Number(shorePoint.stoneX) - appliedMastX);
    var shipX = Number(expectedPoint.shipX);
    var residual = dossierRound(shoreRelativeX - shipX);
    var ok = Math.abs(appliedMastX - expectedMastX) <= 0.015 &&
      Math.abs(residual) <= transformed.tolerance;
    var repeatedWrong = !ok && p3.transformAttempts.some(function (attempt) {
      return attempt.kind === "beat" && attempt.beat === beat && !attempt.ok &&
        Math.abs(Number(attempt.appliedMastX) - appliedMastX) <= 0.005;
    });
    var attempt = {
      kind: "beat", beat: beat, appliedMastX: dossierRound(appliedMastX),
      expectedMastX: dossierRound(expectedMastX), shoreRelativeX: shoreRelativeX,
      shipX: shipX, residual: residual, sourceRecordId: sourceRecord.id, ok: ok,
      reason: ok ? null : (appliedMastX < expectedMastX ? "move-too-short" : "move-too-far")
    };
    p3.transformAttempts.push(attempt);
    d.debate.lastPlayerLine = "第 " + beat + " 號鼓點：岸紙的尺往回移 " +
      dossierRound(appliedMastX) + " 格。";
    if (!ok) {
      if (repeatedWrong) d.debate.rep = Math.max(0, d.debate.rep - 1);
      d.debate.lastReply = appliedMastX < expectedMastX
        ? "艾蒂安：「桅杆還沒有回到零點；岸紙上的點仍偏在船紙一側。」"
        : "艾蒂安：「尺移過頭了；岸紙上的點越過了船紙。」";
      if (d.debate.rep === 0) { d.debate.active = false; d.debate.current = null; d.page = "lab"; }
      return {
        state: s, ok: false, reason: attempt.reason, preview: clone(attempt),
        nextBeat: beat, completedBeats: index, totalBeats: transformed.points.length,
        rep: d.debate.rep
      };
    }
    p3.transformedPoints.push(clone(expectedPoint));
    s.caseFile.transformProgress = p3.transformedPoints.length / transformed.points.length;
    var complete = p3.transformedPoints.length === transformed.points.length;
    if (!complete) {
      d.debate.lastReply = "艾蒂安：「這一拍對上了。保留這個點，換下一個鼓號。」";
      return {
        state: s, ok: true, stepComplete: true, completed: false,
        completedBeats: p3.transformedPoints.length, totalBeats: transformed.points.length,
        nextBeat: transformed.points[p3.transformedPoints.length].beat
      };
    }
    p3.transformed = true;
    p3.transformTolerance = transformed.tolerance;
    p3.maxResidual = transformed.maxResidual;
    d.assertions.A5 = true;
    d.debate.pillars.p3 = true;
    d.debate.current = null;
    s.overlay.transformed = true;
    s.overlay.preview = "subtractMast";
    s.caseFile.transformProgress = 1;
    s.evidence.g4 = true;
    d.debate.lastReply = "艾蒂安：「這幾個點還是我記的，一個也沒改。」\n" +
      "馬蒂厄：「只是每一拍把零點從碼頭搬到桅腳。現在它和船紙疊上了。」\n" +
      "維達爾船長：（把兩張紙拿走）「帶回碼頭。這一問，我要當著所有人收。」";
    dossierOS(d, "p3-done");
    return {
      state: s, ok: true, assertion: "A5", sourceRecordId: sourceRecord.id,
      transformedPoints: clone(p3.transformedPoints),
      transformTolerance: transformed.tolerance, maxResidual: transformed.maxResidual,
      completedBeats: p3.transformedPoints.length, totalBeats: transformed.points.length,
      completed: true, pillarComplete: true
    };
  }
  function setDossierP3Premise(state0, step, choice) {
    var s = ensureNewFields(clone(state0)), d = s.caseFile.dossier, p3 = d.debate.p3;
    if (!d.debate.active || d.debate.current !== "p3") return err(state0, "dossier-debate-not-active");
    var sourceChoice = choice === "dual-papers" || /^dual-papers:\d+$/.test(choice || "");
    var correct = step === "source" ? "dual-papers" :
      (step === "question" ? "same-time-transform" :
        (step === "concept" ? "reference" : (step === "scope" ? "same-event-time-only" : null)));
    if (!correct) return err(state0, "unknown-dossier-p3-step");
    d.debate.lastPlayerLine = step === "source"
      ? dossierEvidencePlayerLine(d, choice)
      : (step === "question"
      ? ({
        "same-time-transform": "先確定兩張紙記的是同一事件、同一時刻，再比較位置。",
        "trust-recorder": "先決定岸上和船上哪一個人比較可靠。",
        "pick-straight": "先選看起來比較平順的那條路。"
      }[choice] || "")
      : (step === "concept" ? ({
        reference: "兩張紙量的是同一顆石頭；不同的是各自拿碼頭或桅杆當起點。",
        "paper-angle": "兩張紙只是擺放角度不同。",
        force: "兩張紙上的石頭受了不同的力。"
      }[choice] || "") : ({
        "same-event-time-only": "同號鼓點只證明兩張紙記的是同一事件、同一時刻；還沒說明位置怎麼互換。",
        "same-path-proved": "同號鼓點對上，就已經證明兩張紙畫的是同一條路。",
        "shore-paper-wins": "同號鼓點對上，所以岸紙比船紙可靠。"
      }[choice] || "")));
    if (step === "source" && !sourceChoice) {
      var wrongPacket = dossierEvidencePacket(d, choice);
      var wrongTitle = wrongPacket ? "「" + wrongPacket.title + "」" : "你選的材料";
      return dossierFailDebate(s, "p3", step, choice, "p3-premise-mismatch",
        "商人：「你拿的是" + wrongTitle + "。它不是同一趟、由兩個位置各自畫下的原紙。」");
    }
    if (step === "source" && !dossierHasDual(d)) return dossierMissing(s,
      "第三柱需要同一趟、同一鼓號的岸上與船上原紙",
      "艾蒂安：「先讓岸上和船上各畫一張同趟、共用鼓號的原紙。」");
    if (step === "question" && !p3.source)
      return err(state0, "dossier-p3-source-required");
    if (step === "concept" && (!p3.source || !p3.question))
      return err(state0, "dossier-p3-question-required");
    if (step === "scope" && (!p3.source || !p3.question || !p3.concept || !p3.aligned))
      return err(state0, "dossier-alignment-required");
    if (step !== "source" && choice !== correct)
      return dossierFailDebate(s, "p3", step, choice, "p3-premise-mismatch",
      step === "question"
        ? "維達爾船長：「別先挑誰可靠。先證明兩張紙記的是同一時刻。」"
        : (step === "concept"
          ? "商人：（指著兩張條件欄）「石頭、放手和船況都相同。你說的差別，記在哪一欄？」"
          : "維達爾船長：「對上時刻不等於已經換好位置。你多說了哪一步？」"));
    if (step === "source") {
      var requestedId = choice.indexOf(":") >= 0 ? Number(choice.split(":")[1]) : null;
      var sourceRecord = requestedId === null
        ? dossierValidDualRecords(d).slice(-1)[0]
        : dossierFindDualRecord(d, requestedId);
      if (!sourceRecord) return dossierMissing(s,
        "選中的雙視角原紙無法逐拍對讀",
        "艾蒂安：「這一筆缺了岸紙、船紙或共同鼓號。換一筆完整的原紙。」");
      p3.source = "dual-papers";
      p3.sourceRecordId = sourceRecord.id;
      p3.question = false;
      p3.concept = false;
      p3.aligned = false;
      p3.scope = false;
      p3.transformMode = null;
      p3.transformed = false;
      p3.transformedPoints = [];
      p3.transformTolerance = null;
      p3.maxResidual = null;
      d.assertions.A4 = false;
      d.assertions.A5 = false;
      d.debate.pillars.p3 = false;
      s.overlay.aligned = false;
      s.overlay.transformed = false;
      s.overlay.preview = "initial";
      s.caseFile.transformProgress = 0;
      s.evidence.g4 = false;
    } else {
      p3[step] = true;
      if (step === "scope") d.assertions.A4 = true;
    }
    d.debate.lastReply = step === "source"
      ? "維達爾船長：「兩張都收。別先挑哪張比較像；你第一件要確認的是什麼？」"
      : (step === "question"
      ? "維達爾船長：「同一時刻先對上。現在告訴我：岸上和船上的人，各從哪裡開始量？」"
      : (step === "concept"
        ? "艾蒂安：「我的尺從碼頭柱量起。」\n馬蒂厄：「我的尺從桅腳量起；船走到哪裡，零點就跟到哪裡。」\n商人：「好。現在當著我們的面，把同號鼓點對上。」"
        : "維達爾船長：「界線寫清楚了。現在才來回答：怎麼把岸紙的位置換成從桅杆量。」"));
    return {
      state: s, ok: true,
      sourceRecordId: step === "source" ? p3.sourceRecordId : undefined
    };
  }
  function setDossierFinalBoundary(state0, choice) {
    var s = ensureNewFields(clone(state0)), d = s.caseFile.dossier, db = d.debate;
    if (!(db.pillars.p1 && db.pillars.p2 && db.pillars.p3)) return err(state0, "dossier-pillars-required");
    if (choice !== "honest" && choice !== "overclaim" && choice !== "all-motion-hidden")
      return err(state0, "unknown-boundary-choice");
    db.lastPlayerLine = {
      overclaim: "這次落石沒有落後，所以這場實驗也證明地球正在運動。",
      honest: "這場實驗排除了「船一前進，落石就一定落後」；但沒有直接量到地球運動。",
      "all-motion-hidden": "船艙裡分不出停泊與走穩，所以船上連加速、減速也都分不出來。"
    }[choice] || "";
    if (choice !== "honest") {
      var repeatedBoundary = db.attempts.some(function (attempt) {
        return attempt.pillar === "final" && attempt.step === "boundary" &&
          attempt.choice === choice && attempt.ok === false;
      });
      db.lastReply = choice === "overclaim"
        ? "伽桑狄：「停。我們沒有量地球。」"
        : "維達爾船長：「你在船上已經分出起步和收槳。這句把自己的紙也抹掉了。」";
      db.attempts.push({ pillar: "final", step: "boundary", choice: choice, ok: false });
      var failed = { state: s, ok: false, reason: "overclaim" };
      if (!repeatedBoundary) {
        failed.repDelta = -1;
        failed.repReason = choice === "overclaim"
          ? "把沒有量到的地球運動說成已經證明"
          : "把船艙對照擴大到沒有測過的變速船況";
      }
      return failed;
    }
    db.boundary = "honest";
    d.complete = true;
    s.audit.boundary = true;
    s.evidence.g5 = true;
    s.publicDemo.complete = true;
    db.lastReply = "官員：「這句話收得這麼窄，誰會記得？」\n維達爾船長：「記得真的就夠。把這句掛上去，我簽。」";
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
    /*
     * 舊公開演示相容入口；目前 canonical 只走 setDossierFinalBoundary。
     * 不再由這條舊路徑改動全域信譽，避免同一個「證明地球運動」
     * 越界在新、舊 API 各扣一次。
     */
    var redesignedComplete = !!(state0.publicDemo && state0.publicDemo.complete &&
      state0.publicDemo.screened && state0.publicDemo.revealed);
    var legacyComplete = !!(state0.audit.wind && state0.audit.acceleration && state0.audit.paths);
    if (!(redesignedComplete || legacyComplete)) return err(state0, "audit-incomplete");
    if (choice !== "overclaim" && choice !== "honest") return err(state0, "unknown-boundary-choice");
    if (choice === "overclaim") {
      var bad = clone(state0); bad.audit.overclaimTried = true;
      return { state: bad, ok: false, reason: "overclaim" };
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
    runDossierExperiment: runDossierExperiment, runDossierSeries: runDossierSeries,
    fileDossierRecord: fileDossierRecord, selectDossierSource: selectDossierSource,
    setDossierSourceGroup: setDossierSourceGroup,
    setDossierProposedScope: setDossierProposedScope,
    setDossierScope: setDossierScope,
    isDossierP3Record: dossierIsP3Record,
    getDossierScopeProgress: getDossierScopeProgress,
    getDossierScopeOptions: getDossierScopeOptions,
    getDossierEvidenceCatalog: getDossierEvidenceCatalog,
    runDossierCabinComparison: runDossierCabinComparison,
    runDossierCabinSeries: runDossierCabinSeries,
    commitDossierCabinWindPlan: commitDossierCabinWindPlan,
    commitDossierCabinInstrument: commitDossierCabinInstrument,
    runDossierBlind: runDossierBlind, judgeDossierBlind: judgeDossierBlind,
    enterDossierDebate: enterDossierDebate, leaveDossierDebate: leaveDossierDebate,
    selectDossierPillar: selectDossierPillar, answerDossierDebate: answerDossierDebate,
    setDossierP3Premise: setDossierP3Premise, alignDossierPapers: alignDossierPapers,
    transformDossierPapers: transformDossierPapers,
    transformDossierPaperBeat: transformDossierPaperBeat,
    setDossierFinalBoundary: setDossierFinalBoundary,
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
