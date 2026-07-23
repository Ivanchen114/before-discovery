/* src/sanitize.js — 書信碼匯入淨化(Sol 巡查 A-1)。雙載體:module.exports+root.GB.Sanitize。
   職責:對「跨機貼入」的 state 做深層白名單檢查——通過=原樣放行,違規=整包拒絕(不修補、不覆蓋本機存檔)。
   防線分工:本檔擋結構/型別/enum/長度/原型污染;chapter-ui 的 DOM-safe 渲染擋殘餘字串(雙層防禦)。
   引擎與 loadSave 零改動(R-SAV-02 四分類不變;本檢查是其後的第五道匯入閘,僅 btnImport 路徑)。 */
(function (root) {
  "use strict";
  var BAD_KEYS = ["__proto__", "constructor", "prototype"]; /* 陣列而非字面量:字面量的 __proto__ 不會成為自有鍵 */
  /* transcript 的章別白名單明確允許 3000 筆；通用深掃不得先用較小上限誤殺合法長局。
     各高風險清單(runs/claims/series)仍在章別 sanitizer 內維持 100/300 筆的窄限。 */
  var LIMITS = { maxNodes: 20000, maxStr: 4000, maxArr: 3000, maxKey: 64, maxDepth: 12 };

  function fail(reason) { return { ok: false, reason: reason }; }

  /* 通用深掃:僅容 plain object/array/string/finite number/boolean/null;鍵與長度受限 */
  function scrub(v, depth, budget) {
    if (depth > LIMITS.maxDepth) return "存檔資料層級過深";
    if (budget.n-- <= 0) return "存檔資料項目過多";
    var t = typeof v;
    if (v === null || t === "boolean") return null;
    if (t === "number") return isFinite(v) ? null : "存檔含無法辨識的數值";
    if (t === "string") return v.length <= LIMITS.maxStr ? null : "存檔文字過長";
    if (Array.isArray(v)) {
      if (v.length > LIMITS.maxArr) return "存檔清單過長";
      for (var i = 0; i < v.length; i++) {
        var r = scrub(v[i], depth + 1, budget);
        if (r) return r;
      }
      return null;
    }
    if (t === "object") {
      var keys = Object.keys(v);
      for (var j = 0; j < keys.length; j++) {
        var k = keys[j];
        if (BAD_KEYS.indexOf(k) >= 0) return "存檔含不允許的欄位";
        if (k.length > LIMITS.maxKey) return "存檔欄位名稱過長";
        var r2 = scrub(v[k], depth + 1, budget);
        if (r2) return r2;
      }
      return null;
    }
    return "存檔含無法辨識的資料型態";
  }

  function isInt(x) { return typeof x === "number" && isFinite(x) && Math.floor(x) === x; }

  /* 關鍵欄位白名單(需要 patterns/scenes 資料提供 enum) */
  function sanitizeImport(state, patterns, scenes) {
    if (!state || typeof state !== "object") return fail("存檔內容格式錯誤");
    var generic = scrub(state, 0, { n: LIMITS.maxNodes });
    if (generic) return fail(generic);

    if (state.mode !== "explore" && state.mode !== "scholar") return fail("遊戲模式無法辨識");
    if (!isInt(state.rep) || state.rep < 0 || state.rep > 5) return fail("信譽數值錯誤");

    var sceneIds = {};
    (scenes && scenes.scenes || []).forEach(function (s) { sceneIds[s.id] = 1; });
    if (!state.cursor || !sceneIds[state.cursor.scene]) return fail("存檔中的故事位置無法辨識");

    var lab = state.lab;
    if (!lab || typeof lab !== "object") return fail("實驗紀錄缺失");
    if (!isInt(lab.days) || lab.days < 0 || lab.days > 9999) return fail("天數紀錄錯誤");

    var runs = lab.evidence && lab.evidence.runs;
    if (!Array.isArray(runs) || runs.length > 300) return fail("實驗紀錄格式錯誤");
    var DIM_KEYS = { ball: "ball", surface: "surface", incline: "incline", timer: "timer" };
    for (var i = 0; i < runs.length; i++) {
      var r = runs[i];
      if (!r || !isInt(r.id) || !isInt(r.day) || !r.config) return fail("第 " + (i + 1) + " 筆實驗紀錄格式錯誤");
      for (var dk in DIM_KEYS) {
        var val = r.config[dk];
        if (typeof val !== "string" || !patterns || !patterns[dk] || !(val in patterns[dk]))
          return fail("第 " + (i + 1) + " 筆實驗的器材配置無法辨識");
      }
      if (!Array.isArray(r.readings) || r.readings.length > 8) return fail("第 " + (i + 1) + " 筆實驗的讀值格式錯誤");
      for (var j = 0; j < r.readings.length; j++)
        if (typeof r.readings[j] !== "number" || !isFinite(r.readings[j])) return fail("第 " + (i + 1) + " 筆實驗含無法辨識的讀值");
    }
    var claims = lab.inference && lab.inference.claims;
    if (!Array.isArray(claims) || claims.length > 300) return fail("主張紀錄格式錯誤");
    for (var c = 0; c < claims.length; c++) {
      var cl = claims[c];
      if (!cl || !isInt(cl.id) || !cl.config) return fail("第 " + (c + 1) + " 筆主張紀錄格式錯誤");
      if (typeof cl.prediction !== "number" || !isFinite(cl.prediction)) return fail("第 " + (c + 1) + " 筆主張的預測值錯誤");
      for (var dk2 in DIM_KEYS) {
        var v2 = cl.config[dk2];
        if (typeof v2 !== "string" || !(v2 in patterns[dk2])) return fail("第 " + (c + 1) + " 筆主張的器材配置無法辨識");
      }
    }
    if (!Array.isArray(state.transcript) || state.transcript.length > 3000) return fail("對話紀錄格式錯誤");
    for (var t = 0; t < state.transcript.length; t++) {
      var line = state.transcript[t];
      if (!line || typeof line !== "object") return fail("對話紀錄中有一筆格式錯誤");
      if (line.scene && !sceneIds[line.scene]) return fail("對話紀錄中的故事位置無法辨識");
      if (typeof line.text !== "string" || line.text.length > 2000) return fail("對話紀錄中有一筆文字格式錯誤");
      if (line.speaker != null && (typeof line.speaker !== "string" || line.speaker.length > 40))
        return fail("對話紀錄中有一筆講者格式錯誤");
    }
    return { ok: true, state: state };
  }

  /* 第二章白名單：工坊資料與第一章 runs/claims 形狀不同，禁止拿第一章 sanitizer 硬套。
     這裡驗結構與 enum；fixture 成敗仍由 Engine2 重算，不相信匯入檔自稱 accepted。 */
  function sanitizeImport2(state, scenes, engine2) {
    if (!state || typeof state !== "object") return fail("存檔內容格式錯誤");
    var generic = scrub(state, 0, { n: LIMITS.maxNodes });
    if (generic) return fail(generic);
    if (state.schemaVersion !== 1 || state.chapter !== "ch2") return fail("存檔版本或章節不相容");
    if (state.mode !== "explore" && state.mode !== "scholar") return fail("遊戲模式無法辨識");
    if (!isInt(state.rep) || state.rep < 0 || state.rep > 5) return fail("信譽數值錯誤");

    var sceneIds = {}, nodeIds = {};
    (scenes && scenes.scenes || []).forEach(function (s) {
      sceneIds[s.id] = 1; nodeIds[s.id] = {};
      (s.nodes || []).forEach(function (n) { nodeIds[s.id][n.id] = 1; });
    });
    if (!state.cursor || !sceneIds[state.cursor.scene] || !nodeIds[state.cursor.scene][state.cursor.node])
      return fail("存檔中的故事位置無法辨識");

    var lab = state.lab, parts = engine2 && engine2._PARTS || {}, slots = engine2 && engine2._SLOTS || [];
    if (!lab || typeof lab !== "object") return fail("實驗紀錄缺失");
    if (!isInt(lab.days) || lab.days < 0 || lab.days > 9999) return fail("天數紀錄錯誤");
    if (!lab.slots || !lab.calib || !Array.isArray(lab.series)) return fail("工坊紀錄格式錯誤");
    if (lab.series.length > 300) return fail("工坊測量紀錄過多");
    for (var si = 0; si < slots.length; si++) {
      var slot = slots[si], pid = lab.slots[slot];
      if (pid !== null && (!parts[pid] || parts[pid].slot !== slot)) return fail("工坊中有一件零件裝錯位置");
    }
    if (typeof lab.calib.releaseZero !== "boolean" || typeof lab.calib.rangeScale !== "boolean")
      return fail("工坊校準紀錄格式錯誤");
    if (!lab.evidence || !lab.evidence.f2 || typeof lab.evidence.f2.law !== "boolean" ||
        typeof lab.evidence.f2.ball !== "boolean") return fail("彈射實驗的證據狀態格式錯誤");
    if (lab.evidence.f2.lawSource != null && !isInt(lab.evidence.f2.lawSource))
      return fail("彈射實驗的斷言來源無法辨識");
    if (lab.evidence.f2.lawConcept != null && lab.evidence.f2.lawConcept !== "sqrtScale")
      return fail("彈射實驗的斷言內容無法辨識");
    var profiles = { clean: 1, directionScatter: 1, speedDrift: 1, coarseRead: 1 };
    for (var i = 0; i < lab.series.length; i++) {
      var sr = lab.series[i];
      if (!sr || !isInt(sr.id) || ["open", "complete", "abandoned"].indexOf(sr.status) < 0)
        return fail("第 " + (i + 1) + " 組彈射測量格式錯誤");
      if (sr.ball !== "copper" && sr.ball !== "wood") return fail("彈射測量的球種無法辨識");
      if (!profiles[sr.profile] || !isInt(sr.cycle) || sr.cycle < 0 || sr.cycle > 2) return fail("彈射測量的裝置狀態格式錯誤");
      var readings = sr.readings || {}, hs = [4, 9, 16, 25];
      for (var hi = 0; hi < hs.length; hi++) if (hs[hi] in readings) {
        var rd = readings[hs[hi]];
        if (typeof rd === "number") { if (!isFinite(rd)) return fail("彈射測量含無法辨識的讀值"); }
        else if (!Array.isArray(rd) || rd.length !== 2 || !isFinite(rd[0]) || !isFinite(rd[1]) || rd[0] > rd[1])
          return fail("彈射測量的讀值範圍格式錯誤");
      }
      if (sr.prediction !== null && (typeof sr.prediction !== "number" || !isFinite(sr.prediction)))
        return fail("彈射測量的預測值格式錯誤");
    }
    if (!Array.isArray(state.transcript) || state.transcript.length > 3000) return fail("對話紀錄格式錯誤");
    for (var t = 0; t < state.transcript.length; t++) {
      var line = state.transcript[t];
      if (!line || !sceneIds[line.scene] || typeof line.text !== "string" || line.text.length > 2000)
        return fail("對話紀錄中有一筆格式錯誤");
    }
    return { ok: true, state: state };
  }

  /* 第三章白名單：船桅 fixture 與雙紙帶狀態。結果欄仍由 Engine3 動作產生；
     匯入只接受封閉列舉與有限數值，拒絕玩家自稱已取得不存在的場景游標。 */
  function sanitizeImport3(state, scenes) {
    if (!state || typeof state !== "object") return fail("存檔內容格式錯誤");
    var generic = scrub(state, 0, { n: LIMITS.maxNodes });
    if (generic) return fail(generic);
    if (state.schemaVersion !== 1 || state.chapter !== "ch3") return fail("存檔版本或章節不相容");
    if (state.mode !== "explore" && state.mode !== "scholar") return fail("遊戲模式無法辨識");
    if (!isInt(state.rep) || state.rep < 0 || state.rep > 5) return fail("信譽數值錯誤");
    var sceneIds = {}, nodeIds = {};
    (scenes && scenes.scenes || []).forEach(function (s) {
      sceneIds[s.id] = 1; nodeIds[s.id] = {};
      (s.nodes || []).forEach(function (n) { nodeIds[s.id][n.id] = 1; });
    });
    if (!state.cursor || !sceneIds[state.cursor.scene] || !nodeIds[state.cursor.scene][state.cursor.node])
      return fail("存檔中的故事位置無法辨識");
    var lab = state.lab;
    if (!lab || !isInt(lab.days) || lab.days < 0 || lab.days > 9999) return fail("航船實驗紀錄格式錯誤");
    if ([null, "hand", "string", "latch"].indexOf(lab.release) < 0 || typeof lab.plumbCalibrated !== "boolean")
      return fail("航船實驗的釋放方式或鉛垂校準格式錯誤");
    if (!Array.isArray(lab.baselineRuns) || !Array.isArray(lab.mastRuns) ||
        lab.baselineRuns.length > 100 || lab.mastRuns.length > 100) return fail("落石紀錄格式錯誤");
    var checkRuns = lab.baselineRuns.concat(lab.mastRuns);
    for (var i = 0; i < checkRuns.length; i++) {
      var rr = checkRuns[i];
      if (!rr || typeof rr.offset !== "number" || !isFinite(rr.offset)) return fail("落石紀錄含無法辨識的落點");
    }
    if (!lab.cabin || !lab.predictions || !lab.speedRuns || !lab.overlay || !lab.publicDemo || !lab.audit || !lab.evidence)
      return fail("航船實驗有必要紀錄缺失");
    if (typeof lab.overlay.aligned !== "boolean" || typeof lab.overlay.transformed !== "boolean" ||
        ["shore", "ship"].indexOf(lab.overlay.activeReference) < 0 ||
        (lab.overlay.preview != null &&
          ["initial", "inspection", "endpoints", "sameBeats", "scaleOnly", "subtractMast"].indexOf(lab.overlay.preview) < 0) ||
        (lab.overlay.inspectionBeat != null &&
          (!isInt(lab.overlay.inspectionBeat) || lab.overlay.inspectionBeat < -1 || lab.overlay.inspectionBeat > 3)) ||
        (lab.overlay.inspected != null && typeof lab.overlay.inspected !== "boolean"))
      return fail("雙紙帶操作紀錄格式錯誤");
    for (var speedKind of ["accelerating", "decelerating"]) {
      /* v1 單筆物件與 v1.2 可重做陣列都接受；進引擎後統一遷移為陣列。 */
      var speedCell = lab.speedRuns[speedKind];
      var speedRows = speedCell == null ? [] : (Array.isArray(speedCell) ? speedCell : [speedCell]);
      if (speedRows.length > 100) return fail("變速比較紀錄筆數異常");
      for (var sr = 0; sr < speedRows.length; sr++) {
        var speedRun = speedRows[sr];
        if (!speedRun || speedRun.state !== speedKind ||
            typeof speedRun.offset !== "number" || !isFinite(speedRun.offset) ||
            ["behind", "foot", "ahead"].indexOf(speedRun.predicted) < 0 ||
            ["behind", "ahead"].indexOf(speedRun.outcome) < 0 ||
            typeof speedRun.matched !== "boolean")
          return fail("變速比較紀錄含無法辨識的讀值");
      }
    }
    var publicOrder = ["baseline", "stable-window", "no-push", "seal-prediction", "repeat"];
    var legacyPublicOrder = ["baseline", "stable-window", "no-push", "repeat"];
    var publicProcedure = lab.publicDemo.procedure;
    var validPublicPrefix = Array.isArray(publicProcedure) && publicProcedure.length <= publicOrder.length &&
      publicProcedure.every(function (step, index) { return step === publicOrder[index]; });
    var validLegacyPublic = Array.isArray(publicProcedure) &&
      publicProcedure.length === legacyPublicOrder.length &&
      publicProcedure.every(function (step, index) { return step === legacyPublicOrder[index]; });
    if ((!validPublicPrefix && !validLegacyPublic) || !isInt(lab.publicDemo.runs) ||
        lab.publicDemo.runs < 0 || lab.publicDemo.runs > 3 ||
        typeof lab.publicDemo.complete !== "boolean" ||
        (lab.publicDemo.predictionsSealed != null && typeof lab.publicDemo.predictionsSealed !== "boolean"))
      return fail("公開演示程序紀錄格式錯誤");
    /* v1.1 追加欄位採可選驗證，讓 v1 舊存檔仍可匯入；引擎第一次相關動作會補齊。 */
    if (lab.cabinResults != null) {
      for (var vessel of ["dock", "steady"]) for (var test of ["drip", "toss"]) {
        var cell = lab.cabinResults[vessel] && lab.cabinResults[vessel][test];
        /* v1.2 改為每格可重做、保存多筆；仍接受 v1.1 的單一彙整物件。 */
        var cells = cell == null ? [] : (Array.isArray(cell) ? cell : [cell]);
        if (cells.length > 100) return fail("船艙比較紀錄筆數異常");
        for (var cr = 0; cr < cells.length; cr++) {
          var cabinRun = cells[cr];
          if (!cabinRun || typeof cabinRun.offset !== "number" || !isFinite(cabinRun.offset) ||
              typeof cabinRun.spread !== "number" || !isFinite(cabinRun.spread) ||
              cabinRun.spread < 0 || cabinRun.spread > 10)
            return fail("船艙比較紀錄含無法辨識的讀值");
        }
      }
    }
    if (lab.claims != null) {
      var allowedConcepts = {
        g1: ["mast-pulls-stone", "steady-shares-motion", "weight-finds-foot"],
        g2: ["air-is-gone", "ship-too-slow", "steady-matches-dock"],
        g3: ["speed-change-breaks-shared-motion", "stone-loses-force", "wind-reverses"],
        g4: ["one-record-false", "same-event-different-reference", "paper-distorts-path"]
      };
      for (var claimId of ["g1", "g2", "g3", "g4"]) {
        var claimRows = lab.claims[claimId];
        if (!Array.isArray(claimRows) || claimRows.length > 100) return fail("航船斷言紀錄格式錯誤");
        for (var ci = 0; ci < claimRows.length; ci++) {
          var claim = claimRows[ci];
          if (!claim || !Array.isArray(claim.sources) || claim.sources.length > 20 ||
              claim.sources.some(function (source) { return typeof source !== "string" || source.length > 120; }) ||
              allowedConcepts[claimId].indexOf(claim.concept) < 0 || typeof claim.ok !== "boolean")
            return fail("航船斷言紀錄含無法辨識的資料");
        }
      }
    }
    if (!Array.isArray(state.transcript) || state.transcript.length > 3000) return fail("對話紀錄格式錯誤");
    for (var t = 0; t < state.transcript.length; t++) {
      var line = state.transcript[t];
      if (!line || !sceneIds[line.scene] || typeof line.text !== "string" || line.text.length > 2000)
        return fail("對話紀錄中有一筆格式錯誤");
    }
    return { ok: true, state: state };
  }

  var api = { sanitizeImport: sanitizeImport, sanitizeImport2: sanitizeImport2,
    sanitizeImport3: sanitizeImport3, _scrub: scrub, LIMITS: LIMITS };
  if (typeof module === "object" && module.exports) { module.exports = api; }
  else { root.GB = root.GB || {}; root.GB.Sanitize = api; }
})(typeof self !== "undefined" ? self : this);
