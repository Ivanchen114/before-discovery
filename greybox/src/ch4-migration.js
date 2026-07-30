/* src/ch4-migration.js — 第四章 schema 1 → 2 純函式遷移。
   這一層只驗證、轉換並回傳原文備份；localStorage／匯入碼的實際備份與覆寫
   必須由呼叫端在 Narrative.loadSave 之前完成。K0 是來源紀錄，不是第六份證據。 */
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else {
    root.GB = root.GB || {};
    root.GB.Ch4Migration = api;
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var NOTICE =
    "第四章已更新。舊版由自動模擬取得的「一直改向的路」已改列為已知方法，" +
    "請從 1679 年的作圖步驟重新完成。可由舊操作紀錄驗證的證據與對話均已保留；" +
    "新版才新增的逐格蓋章、球殼頁與作者欄不會由遷移程式代做。";
  var BAD_KEYS = ["__proto__", "constructor", "prototype"];
  var EVIDENCE = ["K1", "K2", "K3", "K4", "K5"];
  var PLANET_V2 = {
    mars: { radiusRatio: 1.52, actual: 1.88 },
    jupiter: { radiusRatio: 5.20, actual: 11.86 }
  };
  var V1_NODE_IDS = {
    "D0-1": ["n1", "n2", "n2a", "n2b", "n3", "n4", "n5", "n6", "c1", "n7", "n8", "n9", "g1"],
    "D0-2": ["a1", "a2", "a3", "n1", "n2", "n3", "n4", "n5", "n6", "n7", "n8", "n9", "n10", "n11", "n12", "n13", "n14", "n15", "n16", "n17", "g1"],
    "D1-1": ["n1", "n2", "c1", "w1", "w2", "w3", "w4", "ok1", "ok2", "ok3", "e1", "n3", "n4", "n5", "n6", "n7", "g1"],
    "D1-2": ["n1", "n2", "n3", "n4", "n5", "n6", "n7", "n8", "e1", "n9", "n10", "g1"],
    "D1-3": ["e1", "n1", "n2", "n3", "n4", "n5", "n5a", "n5b", "n5c", "n5d", "c1", "r1", "r2", "n5e", "n5f", "n5g", "n5h", "n6", "g1"],
    "D2-1": ["c1", "n1", "n2", "n2a", "n3", "n4", "n5", "n6", "n7", "n8", "n8a", "n8b", "n9", "n10", "g1"],
    "D2-2": ["n0", "n0a", "n0h", "n1", "e1", "n2", "n3", "n4", "n5", "g1"],
    "D2-3": ["c1", "n1", "n1a", "n1b", "n1c", "n1d", "n1e", "n1f", "n2", "n3", "n4", "n4a", "n4b", "e1", "n5", "n6", "n7", "n8", "g1"],
    "D3-1": ["n1", "n1a", "n1b", "e0", "n1c", "n2", "n3", "e1", "n4p", "n4d", "n4", "g1"],
    "D3-2": ["n1", "n2", "n3", "e1", "n4", "n5", "n6", "n7", "n8", "g1"],
    "D3-3": ["n1", "n2", "n3", "n3a", "n4", "n5", "n6", "n7", "n7a", "n7f", "e1", "n8", "n8a", "n8b", "n8c", "n8d", "n8e", "n8f", "n8g", "g1"],
    "D3-4": ["n1", "n2", "n3", "n3a", "c1", "s1", "n4", "g1"],
    "DE-1": ["c1", "n1", "n2", "n2p", "n2d", "n3", "n4", "n5", "n6", "n7", "n8", "n9", "n10", "n11", "n12", "e1", "g1"],
    "DE-2": ["n1", "r1", "n2", "n3", "n4", "n5", "n6", "c1", "n7", "h1", "s1", "end"]
  };
  var V1_TO_V2_SCENE = {
    "D0-1": "D0-1",
    "D0-2": "D0-2",
    "D1-1": "D1-1",
    "D1-2": "D1-2",
    "D1-3": "D1-2",
    "D2-1": "D2-1",
    "D2-2": "D1-2",
    "D2-3": "D3-1",
    "D3-1": "D4-1",
    "D3-2": "D4-1",
    "D3-3": "D4-2",
    "D3-4": "D4-2",
    "DE-1": "DE-1",
    "DE-2": "DE-2"
  };
  var TRANSCRIPT_SCENE = {
    "D0-1": "D0-1",
    "D0-2": "D0-2",
    "D1-1": "D1-1",
    "D1-2": "D2-1",
    "D1-3": "D2-1",
    "D2-1": "D2-1",
    "D2-2": "D1-2",
    "D2-3": "D3-1",
    "D3-1": "D4-1",
    "D3-2": "D4-1",
    "D3-3": "D4-2",
    "D3-4": "D4-2",
    "DE-1": "DE-1",
    "DE-2": "DE-2"
  };

  function own(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }
  function plain(obj) {
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return false;
    var proto = Object.getPrototypeOf(obj);
    return proto === Object.prototype || proto === null;
  }
  function finite(n) {
    return typeof n === "number" && isFinite(n);
  }
  function integer(n) {
    return finite(n) && Math.floor(n) === n;
  }
  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }
  function round(value, places) {
    var power = Math.pow(10, places);
    return Math.round(value * power) / power;
  }
  function fail(code, message, backupText) {
    var out = { ok: false, error: code, message: message };
    if (typeof backupText === "string") out.backupText = backupText;
    return out;
  }
  function scan(value, depth, budget) {
    if (depth > 14) return "資料層級過深";
    if (budget.nodes-- <= 0) return "資料項目過多";
    if (value === null || typeof value === "boolean") return null;
    if (typeof value === "number") return isFinite(value) ? null : "含無法辨識的數值";
    if (typeof value === "string") return value.length <= 4000 ? null : "文字過長";
    if (Array.isArray(value)) {
      if (value.length > 3000) return "清單過長";
      for (var i = 0; i < value.length; i++) {
        var arrayError = scan(value[i], depth + 1, budget);
        if (arrayError) return arrayError;
      }
      return null;
    }
    if (!plain(value)) return "含非純資料物件";
    var keys = Object.keys(value);
    for (var j = 0; j < keys.length; j++) {
      var key = keys[j];
      if (BAD_KEYS.indexOf(key) >= 0) return "含不允許的欄位";
      if (key.length > 64) return "欄位名稱過長";
      var objectError = scan(value[key], depth + 1, budget);
      if (objectError) return objectError;
    }
    return null;
  }
  function validCursor(cursor) {
    return plain(cursor) && typeof cursor.scene === "string" &&
      typeof cursor.node === "string" &&
      own(V1_NODE_IDS, cursor.scene) &&
      V1_NODE_IDS[cursor.scene].indexOf(cursor.node) >= 0;
  }
  function validateTranscript(rows) {
    if (!Array.isArray(rows) || rows.length > 3000) return false;
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      if (!plain(row) || !own(V1_NODE_IDS, row.scene) ||
          typeof row.text !== "string" || row.text.length > 2000 ||
          (row.node != null && typeof row.node !== "string") ||
          (row.speaker != null && typeof row.speaker !== "string"))
        return false;
    }
    return true;
  }
  function validateEvidence(state) {
    if (!plain(state.evidence) || !plain(state.lab.evidence)) return "證據容器格式錯誤";
    for (var i = 0; i < EVIDENCE.length; i++) {
      var upper = EVIDENCE[i], lower = upper.toLowerCase();
      if (typeof state.lab.evidence[lower] !== "boolean")
        return "引擎證據狀態格式錯誤";
      if (own(state.evidence, upper) && typeof state.evidence[upper] !== "boolean")
        return "敘事證據狀態格式錯誤";
      var top = own(state.evidence, upper) ? state.evidence[upper] : false;
      if (top !== state.lab.evidence[lower])
        return "雙層證據狀態不一致";
    }
    var e = state.lab.evidence;
    if ((e.k2 && !e.k1) || (e.k3 && !e.k2) ||
        (e.k4 && !(e.k2 && e.k3)) || (e.k5 && !e.k4))
      return "證據取得順序不可能成立";
    if (state.ended && !EVIDENCE.every(function (id) {
      return state.lab.evidence[id.toLowerCase()];
    })) return "完章狀態缺少必要證據";
    return null;
  }
  function validateLab(lab) {
    if (!plain(lab) || !integer(lab.days) || lab.days < 0 || lab.days > 9999 ||
        !plain(lab.transition) || !integer(lab.transition.cardIndex) ||
        lab.transition.cardIndex < 0 || lab.transition.cardIndex > 100 ||
        !Array.isArray(lab.transition.acknowledged) ||
        lab.transition.acknowledged.length > 100 ||
        lab.transition.acknowledged.some(function (id) {
          return typeof id !== "string" || !id || id.length > 80;
        }) ||
        !plain(lab.orbitLab) || !plain(lab.scaleLab) || !plain(lab.planetLab) ||
        !plain(lab.modelLab) || !plain(lab.proof) || !plain(lab.evidence) ||
        (lab.cometLab != null && !plain(lab.cometLab)) ||
        (lab.archiveLab != null && !plain(lab.archiveLab)) ||
        (lab.claims != null && !plain(lab.claims)))
      return "第四章工作紀錄格式錯誤";
    var orbit = lab.orbitLab;
    if (!integer(orbit.attempt) || orbit.attempt < 0 || orbit.attempt > 999 ||
        !integer(orbit.step) || orbit.step < 0 || orbit.step > 3 ||
        !Array.isArray(orbit.path) || orbit.path.length > 200 ||
        !Array.isArray(orbit.velocityVectors) || orbit.velocityVectors.length > 200 ||
        !Array.isArray(orbit.deflectionVectors) || orbit.deflectionVectors.length > 3 ||
        (orbit.ruleRuns != null &&
          (!Array.isArray(orbit.ruleRuns) || orbit.ruleRuns.length > 100)))
      return "軌道工作紀錄格式錯誤";
    for (var oi = 0; oi < orbit.path.length; oi++) {
      if (!plain(orbit.path[oi]) || !finite(orbit.path[oi].x) || !finite(orbit.path[oi].y))
        return "軌道路徑含無法辨識的座標";
    }
    var orbitRuns = orbit.ruleRuns || [];
    for (var ri = 0; ri < orbitRuns.length; ri++) {
      var run = orbitRuns[ri];
      if (!plain(run) ||
          ["same-vector", "ink-mark", "earth-center"].indexOf(run.target) < 0 ||
          ["slow", "medium", "fast"].indexOf(run.speed) < 0 ||
          ["short", "medium", "long"].indexOf(run.strength) < 0 ||
          ["parabola", "wrong-center", "outer-band", "inner-band", "near-circle"].indexOf(run.prediction) < 0 ||
          ["parabola", "wrong-center", "outer-band", "inner-band", "near-circle"].indexOf(run.outcome) < 0 ||
          !Array.isArray(run.path) || run.path.length > 200)
        return "改向規則紀錄格式錯誤";
    }
    var scale = lab.scaleLab;
    if (!finite(scale.earthRadiusRatio) || scale.earthRadiusRatio < 1 ||
        scale.earthRadiusRatio > 100 || !finite(scale.timeRatio) ||
        scale.timeRatio < 1 || scale.timeRatio > 120 ||
        !Array.isArray(scale.trials) || scale.trials.length > 100 ||
        (scale.lawLocked !== null &&
          (!finite(scale.lawLocked) || scale.lawLocked < 0 || scale.lawLocked > 3)))
      return "同尺紙紀錄格式錯誤";
    for (var si = 0; si < scale.trials.length; si++) {
      var trial = scale.trials[si];
      if (!plain(trial) || !finite(trial.exponent) || trial.exponent < 0 ||
          trial.exponent > 3 || !finite(trial.moonSagM))
        return "同尺紙試算格式錯誤";
    }
    var planets = lab.planetLab;
    if (!Array.isArray(planets.predictions) || planets.predictions.length > 100 ||
        !plain(planets.revealed) || !plain(planets.residuals))
      return "行星封存紀錄格式錯誤";
    for (var pi = 0; pi < planets.predictions.length; pi++) {
      var prediction = planets.predictions[pi];
      if (!plain(prediction) || ["mars", "jupiter"].indexOf(prediction.planet) < 0 ||
          !finite(prediction.prediction) || !finite(prediction.residualPct) ||
          typeof prediction.sealed !== "boolean" || typeof prediction.pass !== "boolean")
        return "行星封存內容格式錯誤";
    }
    var models = lab.modelLab;
    if (!Array.isArray(models.runs) || models.runs.length > 100)
      return "模型對帳紀錄格式錯誤";
    for (var mi = 0; mi < models.runs.length; mi++) {
      var modelRun = models.runs[mi];
      if (!plain(modelRun) ||
          ["inverseSquare", "simpleVortex"].indexOf(modelRun.model) < 0 ||
          ["moon", "planets", "comet"].indexOf(modelRun.caseId) < 0 ||
          !finite(modelRun.residual) || !integer(modelRun.patches) || modelRun.patches < 0)
        return "模型對帳內容格式錯誤";
    }
    if (lab.cometLab != null &&
        (!Array.isArray(lab.cometLab.attempts) || lab.cometLab.attempts.length > 100))
      return "彗星紀錄格式錯誤";
    if (lab.archiveLab != null &&
        (!Array.isArray(lab.archiveLab.clipped) || lab.archiveLab.clipped.length > 5 ||
          typeof lab.archiveLab.complete !== "boolean"))
      return "旅人筆記紀錄格式錯誤";
    var allowedClips = EVIDENCE;
    var seenClips = {};
    var clipped = lab.archiveLab ? lab.archiveLab.clipped : [];
    for (var ai = 0; ai < clipped.length; ai++) {
      var clip = clipped[ai];
      if (allowedClips.indexOf(clip) < 0 || seenClips[clip])
        return "旅人筆記夾頁格式錯誤";
      seenClips[clip] = true;
    }
    if (lab.archiveLab && lab.archiveLab.complete !== EVIDENCE.every(function (id) { return !!seenClips[id]; }))
      return "旅人筆記完成狀態不一致";
    if (!plain(lab.proof.press) || !integer(lab.proof.press.window) ||
        lab.proof.press.window < 1 || lab.proof.press.window > 3 ||
        lab.proof.press.reservedWindows !== 3 ||
        ["open", "schedule-lost"].indexOf(lab.proof.press.status) < 0 ||
        !Array.isArray(lab.proof.press.proofs) || !Array.isArray(lab.proof.press.delays))
      return "印刷校樣紀錄格式錯誤";
    if (lab.claims != null) {
      for (var ci = 0; ci < EVIDENCE.length; ci++) {
        var claimKey = EVIDENCE[ci].toLowerCase();
        if (!Array.isArray(lab.claims[claimKey]) || lab.claims[claimKey].length > 100)
          return "斷言紀錄格式錯誤";
      }
    }
    return null;
  }
  function cursorPastMilestone(cursor, gateScene, gateNode) {
    var scenes = Object.keys(V1_NODE_IDS);
    var currentScene = scenes.indexOf(cursor.scene);
    var gateSceneIndex = scenes.indexOf(gateScene);
    if (currentScene > gateSceneIndex) return true;
    if (currentScene < gateSceneIndex) return false;
    return V1_NODE_IDS[gateScene].indexOf(cursor.node) >
      V1_NODE_IDS[gateScene].indexOf(gateNode);
  }
  function cursorPastChoice(cursor) {
    return cursorPastMilestone(cursor, "D1-1", "c1");
  }
  function proveK0(state) {
    /* 對話／eventLog 是可附加欄位，不能單獨把尚未走到選項的舊存檔
       升格成已封存。游標必須真的越過 c1，且兩種紀錄若同時存在必須一致。 */
    if (!cursorPastChoice(state.cursor))
      return { sealed: false, choice: null, sealedAt: null, via: null };
    var records = [];
    for (var i = 0; i < state.transcript.length; i++) {
      var row = state.transcript[i];
      if (row.scene === "D1-1" && /^c1\.(arc|fall|tangent)$/.test(row.node || "")) {
        records.push({
          choice: row.node.slice(3), at: i + 1, via: "transcript"
        });
      }
    }
    for (var j = 0; j < state.eventLog.length; j++) {
      var event = state.eventLog[j];
      if (plain(event) && event.t === "choice" && event.at === "D1-1/c1" &&
          ["arc", "fall", "tangent"].indexOf(event.pick) >= 0) {
        records.push({
          choice: event.pick,
          at: state.transcript.length + j + 1,
          via: "eventLog"
        });
      }
    }
    var choices = Array.from(new Set(records.map(function (row) { return row.choice; })));
    if (!records.length || choices.length !== 1 || choices[0] !== "tangent")
      return { sealed: false, choice: null, sealedAt: null, via: null };
    records.sort(function (a, b) { return a.at - b.at; });
    return {
      sealed: true, choice: "tangent", sealedAt: records[0].at,
      via: Array.from(new Set(records.map(function (row) { return row.via; }))).join("+")
    };
  }
  function tangentRecordFromK0(k0) {
    if (!k0.sealed) return null;
    return {
      id: "tangent",
      kind: "tangent",
      source: "schema1-player-choice",
      path: [
        { x: 1, y: 0 },
        { x: 1, y: 0.24 },
        { x: 1, y: 0.48 },
        { x: 1, y: 0.72 },
        { x: 1, y: 0.96 },
        { x: 1, y: 1.2 }
      ],
      note: "由舊對話紀錄確認：玩家選擇無拉扯時沿當下方向直行"
    };
  }
  function validateV1(raw) {
    var backupText = typeof raw === "string" ? raw : null;
    if (backupText != null && backupText.length > 4000000)
      return fail("too-large", "舊存檔超過可遷移大小", backupText);
    var state;
    try {
      state = backupText != null ? JSON.parse(backupText) : clone(raw);
    } catch (error) {
      return fail("bad-json", "舊存檔不是有效 JSON", backupText);
    }
    var scanError = scan(state, 0, { nodes: 30000 });
    if (scanError) return fail("unsafe-v1", "舊存檔" + scanError, backupText);
    if (!plain(state) || state.schemaVersion !== 1 || state.chapter !== "ch4")
      return fail("wrong-version", "這不是第四章 schema 1 存檔", backupText);
    if (state.mode !== "explore" && state.mode !== "scholar")
      return fail("bad-mode", "舊存檔的遊戲模式無法辨識", backupText);
    if (!integer(state.rep) || state.rep < 0 || state.rep > 5 ||
        !plain(state.flags) || !plain(state.review) ||
        typeof state.review.q1 !== "string" || state.review.q1.length > 2000 ||
        typeof state.review.q2 !== "string" || state.review.q2.length > 2000 ||
        (state.debate !== null && !plain(state.debate)) ||
        !Array.isArray(state.eventLog) || state.eventLog.length > 3000 ||
        typeof state.ended !== "boolean")
      return fail("bad-top-level", "舊存檔的章節狀態格式錯誤", backupText);
    var flagKeys = Object.keys(state.flags);
    for (var fi = 0; fi < flagKeys.length; fi++) {
      if (typeof state.flags[flagKeys[fi]] !== "string" ||
          state.flags[flagKeys[fi]].length > 240)
        return fail("bad-flags", "舊存檔旗標格式錯誤", backupText);
    }
    if (!validCursor(state.cursor))
      return fail("bad-cursor", "舊存檔中的故事位置無法辨識", backupText);
    if (!validateTranscript(state.transcript))
      return fail("bad-transcript", "舊存檔的對話紀錄格式錯誤", backupText);
    var labError = validateLab(state.lab);
    if (labError) return fail("bad-lab", labError, backupText);
    var evidenceError = validateEvidence(state);
    if (evidenceError) return fail("bad-evidence", evidenceError, backupText);
    return { ok: true, state: state, backupText: backupText };
  }
  function targetStarts(targetScenes) {
    var out = {};
    var list = targetScenes && targetScenes.scenes;
    if (!Array.isArray(list)) return out;
    list.forEach(function (scene) {
      if (plain(scene) && typeof scene.id === "string" &&
          Array.isArray(scene.nodes) && scene.nodes[0] &&
          typeof scene.nodes[0].id === "string")
        out[scene.id] = scene.nodes[0].id;
    });
    return out;
  }
  function mergeObject(base, old) {
    var result = plain(base) ? clone(base) : {};
    Object.keys(old || {}).forEach(function (key) { result[key] = clone(old[key]); });
    return result;
  }
  function copyTranscript(rows, starts) {
    return rows.map(function (row) {
      var converted = clone(row);
      var oldScene = row.scene, oldNode = row.node;
      converted.scene = TRANSCRIPT_SCENE[oldScene];
      if (oldNode != null) delete converted.node;
      converted.legacyScene = oldScene;
      if (oldNode != null) converted.legacyNode = oldNode;
      converted.legacy = true;
      /* scene 必須是新版合法場；node 留在 legacyNode，避免把舊節點冒充新版節點。 */
      if (!starts[converted.scene]) throw new Error("missing-transcript-target:" + converted.scene);
      return converted;
    });
  }
  function validClaim(claims, key, sources, concept) {
    var rows = claims && claims[key];
    if (!Array.isArray(rows)) return false;
    var expected = sources.slice().sort();
    return rows.some(function (row) {
      if (!plain(row) || row.ok !== true || row.concept !== concept ||
          !Array.isArray(row.sources)) return false;
      var actual = Array.from(new Set(row.sources)).sort();
      return JSON.stringify(actual) === JSON.stringify(expected);
    });
  }
  function evidenceDecision(v1, k0) {
    var old = v1.lab.evidence, scale = v1.lab.scaleLab, planets = v1.lab.planetLab;
    var matchingScaleTrials = (scale.trials || []).filter(function (row) {
      return row && row.exponent === 2 && row.moonSagM === 4.9 &&
        row.moonErrorPct === 0 && row.sealed === true &&
        row.revealedAfterSeal === true && plain(row.periods) &&
        row.periods.mars === 1.874 && row.periods.jupiter === 11.858;
    });
    var keepK2 = !!(k0 && k0.sealed &&
      cursorPastMilestone(v1.cursor, "D2-2", "e1") &&
      old.k2 && scale.earthRadiusRatio === 60 &&
      scale.timeRatio === 60 && scale.lawLocked === 2 &&
      scale.exponent === 2 &&
      scale.moonObservationRevealed === true && scale.moonMatch === true &&
      matchingScaleTrials.length === 1 &&
      validClaim(v1.lab.claims, "k2",
        ["earth-fall", "moon-sag", "scale-60-60"],
        "inverse-square-cross-scale"));
    var expectedPlanets = {
      mars: { id: 1, prediction: 1.874, actual: 1.88, residualPct: 0.32 },
      jupiter: { id: 2, prediction: 11.858, actual: 11.86, residualPct: 0.02 }
    };
    var exactPlanetRows = Array.isArray(planets.predictions) &&
      planets.predictions.length === 2 &&
      Object.keys(expectedPlanets).every(function (planet) {
        var rows = planets.predictions.filter(function (row) {
          return row && row.planet === planet;
        });
        if (rows.length !== 1) return false;
        var row = rows[0], expected = expectedPlanets[planet];
        return row.id === expected.id && row.exponent === 2 &&
          row.prediction === expected.prediction &&
          row.actual === expected.actual &&
          row.residualPct === expected.residualPct &&
          row.sealed === true && row.revealedAfterSeal === true &&
          row.pass === true && row.superseded === false;
      }) &&
      planets.revealed.mars === true && planets.revealed.jupiter === true &&
      planets.residuals.mars === expectedPlanets.mars.residualPct &&
      planets.residuals.jupiter === expectedPlanets.jupiter.residualPct;
    var keepK3 = !!(cursorPastMilestone(v1.cursor, "D2-3", "e1") &&
      old.k3 && keepK2 && planets.crossScalePass === true &&
      exactPlanetRows &&
      validClaim(v1.lab.claims, "k3",
        ["jupiter-sealed", "mars-sealed"],
        "withheld-data-prediction"));
    var carry = {
      K1: false,
      K2: keepK2,
      K3: keepK3,
      /* 新版 K4/K5 的玩家動作在 schema 1 根本不存在，禁止合成假蓋章／假署名。 */
      K4: false,
      K5: false
    };
    var reacquire = EVIDENCE.filter(function (id) {
      return !!old[id.toLowerCase()] && !carry[id];
    });
    return { carry: carry, reacquire: reacquire };
  }
  function selectTargetScene(v1, k0, decision) {
    var carry = decision.carry;
    if (!k0.sealed && v1.lab.evidence && v1.lab.evidence.k1)
      return "D1-1";
    var scene = V1_TO_V2_SCENE[v1.cursor.scene];
    var redoOrder = [
      ["K2", "D1-2"],
      ["K1", "D2-1"],
      ["K3", "D3-1"],
      ["K4", "D4-1"],
      ["K5", "D4-2"]
    ];
    for (var redoIndex = 0; redoIndex < redoOrder.length; redoIndex++) {
      if (decision.reacquire.indexOf(redoOrder[redoIndex][0]) >= 0) {
        scene = redoOrder[redoIndex][1];
        break;
      }
    }
    var v2Order = [
      "D0-1", "D0-2", "D1-1", "D1-2", "D-INT-1", "D2-1",
      "D2-2", "D3-1", "D4-1", "D4-2", "DE-1", "DE-2"
    ];
    var sceneIndex = v2Order.indexOf(scene);
    var gates = [
      { evidence: "K0", scene: "D1-1", ok: k0.sealed },
      { evidence: "K2", scene: "D1-2", ok: carry.K2 },
      { evidence: "K1", scene: "D2-1", ok: carry.K1 },
      { evidence: "K3", scene: "D3-1", ok: carry.K3 },
      { evidence: "K4", scene: "D4-1", ok: carry.K4 },
      { evidence: "K5", scene: "D4-2", ok: carry.K5 }
    ];
    for (var i = 0; i < gates.length; i++) {
      var gateIndex = v2Order.indexOf(gates[i].scene);
      if (sceneIndex > gateIndex && !gates[i].ok) return gates[i].scene;
    }
    return scene;
  }
  function canonicalEvidence(decision, output) {
    output.evidence = output.evidence && plain(output.evidence) ? output.evidence : {};
    output.lab.evidence = output.lab.evidence && plain(output.lab.evidence) ?
      output.lab.evidence : {};
    EVIDENCE.forEach(function (upper) {
      var lower = upper.toLowerCase();
      var value = !!decision.carry[upper];
      output.evidence[upper] = value;
      output.lab.evidence[lower] = value;
    });
  }
  function migrateV1ToV2(raw, options) {
    options = options || {};
    var checked = validateV1(raw);
    if (!checked.ok) return checked;
    var v1 = checked.state;
    var starts = targetStarts(options.targetScenes);
    var seed = options.initialState;
    var seedScan = scan(seed, 0, { nodes: 30000 });
    if (seedScan || !plain(seed) || seed.schemaVersion !== 2 || seed.chapter !== "ch4" ||
        !plain(seed.lab))
      return fail(
        "bad-v2-seed",
        "遷移需要由新版引擎產生的第四章 schema 2 初始狀態",
        checked.backupText
      );
    var k0 = proveK0(v1);
    var decision = evidenceDecision(v1, k0);
    var targetScene = selectTargetScene(v1, k0, decision);
    var targetNode = options.redoNodes && options.redoNodes[targetScene] ||
      starts[targetScene];
    if (!targetNode)
      return fail(
        "missing-v2-target",
        "新版場景缺少安全遷移入口：" + targetScene,
        checked.backupText
      );
    var output = clone(seed);
    output.schemaVersion = 2;
    output.chapter = "ch4";
    output.mode = v1.mode;
    output.rep = v1.rep;
    output.flags = clone(v1.flags);
    output.review = clone(v1.review);
    output.debate = v1.debate == null ? null : clone(v1.debate);
    output.eventLog = clone(v1.eventLog);
    output.cursor = { scene: targetScene, node: targetNode };
    output.ended = decision.reacquire.length ? false : v1.ended;
    output.migrationNotice = NOTICE;
    output.migration = {
      fromSchema: 1,
      toSchema: 2,
      originalCursor: clone(v1.cursor),
      targetCursor: clone(output.cursor),
      sourceEvidence: EVIDENCE.reduce(function (acc, id) {
        acc[id] = !!(v1.lab.evidence && v1.lab.evidence[id.toLowerCase()]);
        return acc;
      }, {}),
      k0ProvenBy: k0.via,
      reacquire: decision.reacquire.slice(),
      backupRequired: true
    };
    try {
      output.transcript = copyTranscript(v1.transcript, starts);
    } catch (error) {
      return fail(
        "missing-v2-transcript-target",
        "新版場景缺少舊對話紀錄的安全去向",
        checked.backupText
      );
    }
    output.eventLog.push({
      t: "migration",
      fromSchema: 1,
      toSchema: 2,
      from: v1.cursor.scene + "/" + v1.cursor.node,
      to: output.cursor.scene + "/" + output.cursor.node,
      sourceEvidence: clone(output.migration.sourceEvidence),
      reacquire: decision.reacquire.slice()
    });

    output.lab.days = v1.lab.days;
    output.lab.sequence = Math.max(
      integer(output.lab.sequence) ? output.lab.sequence : 0,
      integer(k0.sealedAt) ? k0.sealedAt : 0
    );
    output.lab.scene = targetScene;
    output.lab.transition = clone(v1.lab.transition);
    output.lab.claims = { k1: [], k2: [], k3: [], k4: [], k5: [] };
    if (decision.carry.K2) {
      /* 只轉成一筆可重算的 canonical 舊證據；舊 trial 的自由欄位留在備份，
         不能進入新版 UI 冒充物理數字。 */
      output.lab.scaleLab.earthRadiusRatio = 60;
      output.lab.scaleLab.timeRatio = 60;
      output.lab.scaleLab.conversionCorrect = true;
      output.lab.scaleLab.ratioCorrect = true;
      output.lab.scaleLab.relationCorrect = true;
      output.lab.scaleLab.moonOneSecondSagMm = 1.4;
      output.lab.scaleLab.exponent = 2;
      output.lab.scaleLab.lawLocked = 2;
      output.lab.scaleLab.moonObservationRevealed = true;
      output.lab.scaleLab.moonMatch = true;
      output.lab.scaleLab.trials = [{
        id: 1,
        exponent: 2,
        moonSagM: 4.9,
        moonErrorPct: 0,
        periods: { mars: 1.874, jupiter: 11.858 },
        sealed: true,
        revealedAfterSeal: true,
        source: "schema1-validated-k2"
      }];
      output.lab.claims.k2.push({
        id: 1,
        sources: ["earth-fall", "moon-sag", "scale-60-60"],
        concept: "inverse-square-cross-scale",
        ok: true,
        at: ++output.lab.sequence,
        action: "migrationCarryK2",
        source: "schema1-validated-claim"
      });
    }
    /* schema 1 的行星列沒有可驗證的封蠟／開蠟時序。只有 K3 的兩筆
       封存、通過、成功斷言全部同時成立時，才轉成新版 canonical 列；
       其餘舊列只留在逐字備份，不能成為 schema 2 的半真紀錄。 */
    if (decision.carry.K3) {
      var orderedPlanetIds = [];
      (v1.lab.planetLab.predictions || []).forEach(function (row) {
        if (row && PLANET_V2[row.planet] && row.sealed === true &&
            row.pass === true && orderedPlanetIds.indexOf(row.planet) < 0)
          orderedPlanetIds.push(row.planet);
      });
      output.lab.planetLab.predictions = orderedPlanetIds.map(function (planet, index) {
        var fixture = PLANET_V2[planet];
        var prediction = round(Math.pow(fixture.radiusRatio, 1.5), 3);
        var residualPct = round(
          Math.abs(prediction - fixture.actual) / fixture.actual * 100,
          2
        );
        var sealedAt = ++output.lab.sequence;
        var openedAt = ++output.lab.sequence;
        return {
          id: index + 1,
          planet: planet,
          exponent: 2,
          prediction: prediction,
          sealed: true,
          sealedAt: sealedAt,
          openedAt: openedAt,
          revealedAfterSeal: true,
          actual: fixture.actual,
          residualPct: residualPct,
          pass: residualPct <= 3,
          superseded: false,
          source: "schema1-validated-k3"
        };
      });
      output.lab.planetLab.revealed.mars = true;
      output.lab.planetLab.revealed.jupiter = true;
      output.lab.planetLab.residuals.mars =
        output.lab.planetLab.predictions.find(function (row) {
          return row.planet === "mars";
        }).residualPct;
      output.lab.planetLab.residuals.jupiter =
        output.lab.planetLab.predictions.find(function (row) {
          return row.planet === "jupiter";
        }).residualPct;
      output.lab.planetLab.crossScalePass = true;
      output.lab.claims.k3.push({
        id: 1,
        sources: ["jupiter-sealed", "mars-sealed"],
        concept: "withheld-data-prediction",
        ok: true,
        at: ++output.lab.sequence,
        action: "migrationCarryK3",
        source: "schema1-validated-claim"
      });
    }
    /* schema 1 的 modelLab.runs 帶有系統寫死的 patches；新版又把蓋章與借條
       改成玩家操作。整個主動對帳狀態沿用 v2 初始值，舊原文由 backupText 保存。 */
    /* 彗星接軌、出版窗口與六槽都是 schema 2 才有的玩家操作。
       舊欄位只留在逐字備份，不能合併成新版的假操作歷史。 */
    output.lab.archiveLab.clipped = [];
    output.lab.archiveLab.clipAttempts = [];
    output.lab.archiveLab.complete = false;

    output.lab.sourceLab = plain(output.lab.sourceLab) ? output.lab.sourceLab : {};
    output.lab.sourceLab.tangentPrediction = {
      choice: k0.choice,
      sealed: k0.sealed,
      sealedAt: k0.sealedAt
    };
    output.lab.sourceLab.attempts = k0.sealed ? [{
      choice: "tangent",
      ok: true,
      at: k0.sealedAt
    }] : [];
    output.lab.orbitLab.tangentRecord = tangentRecordFromK0(k0);
    if (v1.lab.evidence.k1) output.flags.legacyKnownOrbitMethod = "1";
    canonicalEvidence(decision, output);
    output.migration.baseSequence = output.lab.sequence;
    output.eventLog[output.eventLog.length - 1].baseSequence =
      output.migration.baseSequence;

    return {
      ok: true,
      state: output,
      serialized: JSON.stringify(output),
      backupText: checked.backupText,
      migrationNotice: NOTICE,
      fromCursor: clone(v1.cursor),
      toCursor: clone(output.cursor),
      reacquire: decision.reacquire.slice()
    };
  }
  function makeV2Seed(v1, engine4) {
    if (!engine4 || typeof engine4.initialState !== "function") return null;
    var lab;
    try { lab = engine4.initialState(); } catch (error) { return null; }
    if (!plain(lab)) return null;
    return {
      schemaVersion: 2,
      chapter: "ch4",
      mode: v1.mode,
      rep: 3,
      flags: {},
      evidence: {},
      lab: lab,
      debate: null,
      review: { q1: "", q2: "" },
      cursor: { scene: "D0-1", node: "" },
      transcript: [],
      eventLog: [],
      ended: false
    };
  }
  /* Browser/runtime convenience API：可安全地對「未知是 v1 或 v2」的文字先呼叫。
     成功遷移時 report.backupText 是呼叫端必須先另存的逐字原文。 */
  function migrateText(text, scenes4, engine4, options) {
    options = options || {};
    if (typeof text !== "string")
      return { error: "bad-json", message: "第四章存檔必須是文字" };
    var header;
    try { header = JSON.parse(text); } catch (error) {
      return { error: "bad-json", message: "第四章存檔不是有效 JSON" };
    }
    if (plain(header) && header.schemaVersion === 2 && header.chapter === "ch4")
      return { text: text, migrated: false, report: null };
    if (!plain(header) || header.schemaVersion !== 1 || header.chapter !== "ch4")
      return { error: "wrong-version", message: "這不是可遷移的第四章存檔" };
    var seed = options.initialState || makeV2Seed(header, engine4);
    var result = migrateV1ToV2(text, {
      targetScenes: scenes4,
      initialState: seed,
      redoNodes: options.redoNodes || null
    });
    if (!result.ok) {
      return {
        error: result.error,
        message: result.message,
        report: { backupText: text, failed: true }
      };
    }
    return {
      text: result.serialized,
      migrated: true,
      report: {
        backupText: text,
        notice: result.migrationNotice,
        fromCursor: result.fromCursor,
        toCursor: result.toCursor,
        reacquire: result.reacquire
      }
    };
  }
  function legacyCursorKeys() {
    var out = [];
    Object.keys(V1_NODE_IDS).forEach(function (scene) {
      V1_NODE_IDS[scene].forEach(function (node) { out.push(scene + "/" + node); });
    });
    return out;
  }

  return {
    migrateText: migrateText,
    migrateV1ToV2: migrateV1ToV2,
    validateV1: validateV1,
    legacyCursorKeys: legacyCursorKeys,
    NOTICE: NOTICE,
    V1_TO_V2_SCENE: clone(V1_TO_V2_SCENE),
    TRANSCRIPT_SCENE: clone(TRANSCRIPT_SCENE)
  };
});
