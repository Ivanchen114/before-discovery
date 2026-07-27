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
    /* CH3-CR-018 只刪除了三個舊場景殼；舊游標安全送到意義最接近的新場，
       不嘗試替玩家偽造已完成的實驗狀態。 */
    var legacySceneRedirect = { "C2-2B": "C2-3", "C3-3": "C3-1", "C3-4": "C3-2" };
    if (state.cursor && legacySceneRedirect[state.cursor.scene]) {
      state.cursor.scene = legacySceneRedirect[state.cursor.scene];
      state.cursor.node = (scenes.scenes.find(function (s) { return s.id === state.cursor.scene; }).nodes[0] || {}).id;
    }
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
    if (lab.design != null) {
      var design = lab.design;
      if (!design.pilot || !design.protocol || !design.cabinBlind || !design.wind || !design.dual ||
          [null, "release", "speed", "repeat"].indexOf(design.pilot.focus) < 0 ||
          [null, "release", "speed", "repeat"].indexOf(design.pilot.diagnosed) < 0 ||
          !Array.isArray(design.pilot.rows) || design.pilot.rows.length > 20 ||
          !Array.isArray(design.pilot.missing) || design.pilot.missing.length > 3 ||
          !Array.isArray(design.pilot.history) || design.pilot.history.length > 20 ||
          !design.protocol.assignments || !Array.isArray(design.protocol.attempts) ||
          design.protocol.attempts.length > 50 ||
          typeof design.protocol.locked !== "boolean" || typeof design.protocol.ran !== "boolean" ||
          [null, "speed", "wind"].indexOf(design.investigationOrder) < 0 ||
          !Array.isArray(design.cabinBlind.traces) || design.cabinBlind.traces.length > 4 ||
          !Array.isArray(design.cabinBlind.judgments) || design.cabinBlind.judgments.length > 20 ||
          typeof design.cabinBlind.complete !== "boolean" ||
          !Array.isArray(design.wind.attempts) || design.wind.attempts.length > 20 ||
          !Array.isArray(design.wind.runs) || design.wind.runs.length > 20 ||
          typeof design.wind.interpreted !== "boolean" ||
          !Array.isArray(design.dual.attempts) || design.dual.attempts.length > 20 ||
          typeof design.dual.locked !== "boolean")
        return fail("第三章實驗設計卷宗格式錯誤");
      var assignedPeople = ["mathieu", "sailor", "etienne", "gassendi", "traveler", "captain"];
      for (var protocolSlot of Object.keys(design.protocol.assignments)) {
        if (["release", "clock", "shore", "ship", "vessel"].indexOf(protocolSlot) < 0 ||
            assignedPeople.indexOf(design.protocol.assignments[protocolSlot]) < 0)
          return fail("第三章分工表含無法辨識的角色");
      }
      for (var pilotRow of design.pilot.rows) {
        if (!pilotRow || typeof pilotRow.offset !== "number" || !isFinite(pilotRow.offset))
          return fail("第三章試航紀錄含無法辨識的讀值");
      }
      for (var blindTrace of design.cabinBlind.traces) {
        if (!blindTrace || typeof blindTrace.offset !== "number" || !isFinite(blindTrace.offset) ||
            typeof blindTrace.spread !== "number" || !isFinite(blindTrace.spread))
          return fail("第三章船艙盲測含無法辨識的讀值");
      }
      for (var windRow of design.wind.runs) {
        if (!windRow || typeof windRow.offset !== "number" || !isFinite(windRow.offset) ||
            ["steady", "accelerating", "unclassified", "unknown"].indexOf(windRow.shipState) < 0)
          return fail("第三章風向紀錄含無法辨識的讀值");
      }
    }
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
    if (lab.publicDemo.criteria != null) {
      var crit = lab.publicDemo.criteria;
      if (!crit || [2, 3, 4].indexOf(crit.equalSegments) < 0 ||
          [2, 3].indexOf(crit.repeats) < 0 ||
          ["hand", "latch"].indexOf(crit.release) < 0 ||
          typeof crit.requireDual !== "boolean" ||
          !Array.isArray(lab.publicDemo.criteriaHistory) || lab.publicDemo.criteriaHistory.length > 30 ||
          !lab.publicDemo.decisions || typeof lab.publicDemo.decisions !== "object" ||
          typeof lab.publicDemo.screened !== "boolean" ||
          typeof lab.publicDemo.revealed !== "boolean" ||
          !Array.isArray(lab.publicDemo.records) || lab.publicDemo.records.length > 20)
        return fail("公開複驗的採信標準格式錯誤");
      for (var decisionId of Object.keys(lab.publicDemo.decisions)) {
        if (!/^[A-F]$/.test(decisionId) || typeof lab.publicDemo.decisions[decisionId] !== "boolean")
          return fail("公開複驗的收退判定格式錯誤");
      }
      for (var publicRow of lab.publicDemo.records) {
        if (!publicRow || !/^[A-F]$/.test(publicRow.id) ||
            [2, 3, 4].indexOf(publicRow.equalSegments) < 0 ||
            ["hand", "latch"].indexOf(publicRow.release) < 0 ||
            typeof publicRow.dual !== "boolean" ||
            typeof publicRow.offset !== "number" || !isFinite(publicRow.offset))
          return fail("公開複驗紀錄格式錯誤");
      }
    }
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
        g2: ["air-is-gone", "ship-too-slow", "steady-matches-dock",
          "local-common-motion-wind-below-spread"],
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
    if (lab.caseFile != null) {
      var cf = lab.caseFile;
      var validCaseStage = ["v1", "v2", "v3", "wind", "cabin", "v4", "dual", "public"];
      if (!cf || [null, "release", "speed", "wind"].indexOf(cf.firstControl) < 0 ||
          typeof cf.crewConfirmed !== "boolean" || !cf.voyages || !Array.isArray(cf.attempts) ||
          !Array.isArray(cf.fingerprintAttempts) || !Array.isArray(cf.dualAttempts) ||
          !Array.isArray(cf.boundaryAttempts) || cf.attempts.length > 100 ||
          cf.fingerprintAttempts.length > 30 || cf.dualAttempts.length > 30 ||
          cf.boundaryAttempts.length > 30 ||
          [null, "wind-not-systematic"].indexOf(cf.windJudgment) < 0 ||
          [null, "indistinguishable"].indexOf(cf.cabinJudgment) < 0 ||
          [null, "fore", "aft", "foot"].indexOf(cf.decelPrediction) < 0 ||
          typeof cf.fingerprintComplete !== "boolean" ||
          typeof cf.transformProgress !== "number" || !isFinite(cf.transformProgress) ||
          cf.transformProgress < 0 || cf.transformProgress > 1 ||
          typeof cf.dualNamed !== "boolean" ||
          typeof cf.publicCriteriaConfirmed !== "boolean" ||
          typeof cf.publicComplete !== "boolean" ||
          [null, "honest"].indexOf(cf.boundary) < 0)
        return fail("第三章航次卷宗格式錯誤");
      for (var caseStage of validCaseStage) {
        var caseRun = cf.voyages[caseStage];
        if (caseRun != null && (!caseRun || caseRun.stage !== caseStage))
          return fail("第三章航次卷宗含無法辨識的航次");
      }
      for (var caseAttempt of cf.attempts) {
        if (!caseAttempt || typeof caseAttempt.stage !== "string" || caseAttempt.stage.length > 40)
          return fail("第三章航次卷宗含無法辨識的操作紀錄");
      }
      if (cf.dossier != null) {
        var dossier = cf.dossier;
        if (!dossier || ["lab", "debate"].indexOf(dossier.page) < 0 || !dossier.draft ||
            (dossier.draft.location != null && ["deck", "cabin"].indexOf(dossier.draft.location) < 0) ||
            (dossier.draft.vesselId != null && ["small", "captain", "large"].indexOf(dossier.draft.vesselId) < 0) ||
            ["dock", "steady", "depart", "brake"].indexOf(dossier.draft.stage) < 0 ||
            ["hand", "string", "latch"].indexOf(dossier.draft.release) < 0 ||
            ["none", "verbal", "beats"].indexOf(dossier.draft.speedRecord) < 0 ||
            ["mast", "deck", "shore", "dual"].indexOf(dossier.draft.positionRecord) < 0 ||
            [1, 2, 3].indexOf(Number(dossier.draft.repeats)) < 0 ||
            (dossier.draft.speedBand != null && ["slow", "mid", "fast"].indexOf(dossier.draft.speedBand) < 0) ||
            (dossier.draft.forceBand != null && ["soft", "hard"].indexOf(dossier.draft.forceBand) < 0) ||
            (dossier.draft.beatBand != null && ["slow", "mid", "fast"].indexOf(dossier.draft.beatBand) < 0) ||
            typeof dossier.draft.sameStone !== "boolean" ||
            typeof dossier.draft.sameHeight !== "boolean" ||
            (dossier.borrowedVessels != null && (!Array.isArray(dossier.borrowedVessels) ||
              dossier.borrowedVessels.length > 3 ||
              dossier.borrowedVessels.some(function (id) {
                return ["small", "captain", "large"].indexOf(id) < 0;
              }))) ||
            !Array.isArray(dossier.records) || dossier.records.length > 100 ||
            (dossier.pendingRecord != null && typeof dossier.pendingRecord !== "object") ||
            !dossier.assertions || !dossier.candidates ||
            (dossier.claimSelections != null && (!dossier.claimSelections ||
              typeof dossier.claimSelections !== "object")) ||
            (dossier.assertionSources != null && (!dossier.assertionSources ||
              typeof dossier.assertionSources !== "object")) ||
            (dossier.sourceAttempts != null && (!Array.isArray(dossier.sourceAttempts) ||
              dossier.sourceAttempts.length > 200)) ||
            !Array.isArray(dossier.scopeAttempts) || dossier.scopeAttempts.length > 100 ||
            !dossier.blind || !Array.isArray(dossier.blind.attempts) ||
            (dossier.blind.records != null && (!Array.isArray(dossier.blind.records) ||
              dossier.blind.records.length > 60)) ||
            dossier.blind.attempts.length > 50 || !dossier.debate ||
            typeof dossier.debate.active !== "boolean" ||
            !isInt(dossier.debate.rep) || dossier.debate.rep < 0 || dossier.debate.rep > 5 ||
            [null, "p1", "p2", "p3"].indexOf(dossier.debate.current) < 0 ||
            !Array.isArray(dossier.debate.pins) || dossier.debate.pins.length > 50 ||
            !Array.isArray(dossier.debate.attempts) || dossier.debate.attempts.length > 200 ||
            !dossier.debate.pillars || !dossier.debate.p1 || !dossier.debate.p2 || !dossier.debate.p3 ||
            ["p1", "p2", "p3"].some(function (pillarId) {
              return typeof dossier.debate.pillars[pillarId] !== "boolean";
            }) ||
            (dossier.debate.p1.source != null && dossier.debate.p1.source !== "A1") ||
            (dossier.debate.p2.source != null && dossier.debate.p2.source !== "A3") ||
            (dossier.debate.p3.source != null && dossier.debate.p3.source !== "dual-papers") ||
            (dossier.debate.p2.scope != null && typeof dossier.debate.p2.scope !== "boolean") ||
            (dossier.debate.p2.scopeDiagnosis != null &&
              ["not-required", "required", "complete"].indexOf(dossier.debate.p2.scopeDiagnosis) < 0) ||
            !Array.isArray(dossier.debate.p3.alignAttempts) ||
            !Array.isArray(dossier.debate.p3.transformAttempts) ||
            typeof dossier.complete !== "boolean")
          return fail("第三章自由實驗卷宗格式錯誤");
        /*
         * C1、C2… 是目前逐回船艙原紙；C-dock／C-steady 是舊存檔
         * 在遷移前留下的兩組合併代號。兩者都須可安全匯入。
         */
        var sourcePattern = /^(OLD|R[1-9][0-9]*|C[1-9][0-9]*|C-(dock|steady))$/;
        for (var selectionMap of [dossier.claimSelections, dossier.assertionSources]) {
          if (selectionMap == null) continue;
          for (var assertionId in selectionMap) {
            var sourceIds = selectionMap[assertionId];
            if (!Array.isArray(sourceIds) || sourceIds.length > 30 ||
                sourceIds.some(function (sourceId) {
                  return typeof sourceId !== "string" || !sourcePattern.test(sourceId);
                }))
              return fail("第三章斷言含無法辨識的原始資料");
          }
        }
        var dossierRows = dossier.records.slice();
        if (dossier.pendingRecord != null) dossierRows.push(dossier.pendingRecord);
        for (var dr of dossierRows) {
          if (!dr || !isInt(dr.id) || dr.id < 1 ||
              (dr.location != null && dr.location !== "deck") ||
              (dr.vesselId != null && ["small", "captain", "large"].indexOf(dr.vesselId) < 0) ||
              (dr.vesselName != null && (typeof dr.vesselName !== "string" || dr.vesselName.length > 80)) ||
              (dr.mastHeight != null && (typeof dr.mastHeight !== "number" || !isFinite(dr.mastHeight) ||
                dr.mastHeight < 1 || dr.mastHeight > 50)) ||
              (dr.releaseOperator != null && (typeof dr.releaseOperator !== "string" || dr.releaseOperator.length > 80)) ||
              (dr.rowingCrew != null && (typeof dr.rowingCrew !== "string" || dr.rowingCrew.length > 120)) ||
              (dr.rowingMethod != null && (typeof dr.rowingMethod !== "string" || dr.rowingMethod.length > 80)) ||
              (dr.borrowDays != null && (!isInt(dr.borrowDays) || dr.borrowDays < 0 || dr.borrowDays > 2)) ||
              ["dock", "steady", "depart", "brake"].indexOf(dr.stage) < 0 ||
              ["hand", "string", "latch"].indexOf(dr.release) < 0 ||
              ["none", "verbal", "beats"].indexOf(dr.speedRecord) < 0 ||
              ["mast", "deck", "shore", "dual"].indexOf(dr.positionRecord) < 0 ||
              [1, 2, 3].indexOf(Number(dr.repeats)) < 0 ||
              (dr.speedBand != null && ["slow", "mid", "fast"].indexOf(dr.speedBand) < 0) ||
              (dr.forceBand != null && ["soft", "hard"].indexOf(dr.forceBand) < 0) ||
              (dr.beatBand != null && ["slow", "mid", "fast"].indexOf(dr.beatBand) < 0) ||
              !Array.isArray(dr.offsets) || dr.offsets.length < 1 || dr.offsets.length > 3 ||
              dr.offsets.some(function (n) { return typeof n !== "number" || !isFinite(n) || Math.abs(n) > 10; }))
            return fail("第三章自由實驗卷宗含無法辨識的原始紀錄");
          if (dr.papers != null) {
            if (!dr.papers || typeof dr.papers !== "object") return fail("第三章觀察原紙格式錯誤");
            for (var paperKey of ["shore", "ship"]) {
              var paper = dr.papers[paperKey];
              if (paper == null) continue;
              if (!paper || typeof paper.observer !== "string" || paper.observer.length > 40 ||
                  typeof paper.origin !== "string" || paper.origin.length > 80 ||
                  !Array.isArray(paper.beats) || paper.beats.length > 20 ||
                  !Array.isArray(paper.landings) || paper.landings.length > 3 ||
                  paper.landings.some(function (n) {
                    return typeof n !== "number" || !isFinite(n) || Math.abs(n) > 10;
                  }))
                return fail("第三章觀察原紙格式錯誤");
              for (var beat of paper.beats) {
                if (!beat || !isInt(beat.beat) || beat.beat < 0 || beat.beat > 20 ||
                    typeof beat.t !== "number" || !isFinite(beat.t) || beat.t < 0 || beat.t > 10 ||
                    typeof beat.mastX !== "number" || !isFinite(beat.mastX) || Math.abs(beat.mastX) > 100 ||
                    typeof beat.stoneX !== "number" || !isFinite(beat.stoneX) || Math.abs(beat.stoneX) > 100 ||
                    typeof beat.y !== "number" || !isFinite(beat.y) || beat.y < 0 || beat.y > 100)
                  return fail("第三章觀察原紙含無法辨識的鼓點");
              }
            }
          }
          if (dr.animation != null) {
            if (!dr.animation || !Array.isArray(dr.animation.path) || dr.animation.path.length > 40)
              return fail("第三章落石動畫格式錯誤");
            for (var point of dr.animation.path) {
              if (!point || typeof point.t !== "number" || !isFinite(point.t) ||
                  typeof point.mastX !== "number" || !isFinite(point.mastX) ||
                  typeof point.stoneX !== "number" || !isFinite(point.stoneX) ||
                  typeof point.relativeX !== "number" || !isFinite(point.relativeX) ||
                  typeof point.y !== "number" || !isFinite(point.y))
                return fail("第三章落石動畫含無法辨識的座標");
            }
          }
        }
        for (var cabinRow of dossier.blind.records || []) {
          if (!cabinRow || !/^C[1-9][0-9]*$/.test(cabinRow.id || "") ||
              ["dock", "steady"].indexOf(cabinRow.stage) < 0 ||
              typeof cabinRow.stageLabel !== "string" || cabinRow.stageLabel.length > 40 ||
              typeof cabinRow.observer !== "string" || cabinRow.observer.length > 160 ||
              typeof cabinRow.classification !== "string" || cabinRow.classification.length > 80 ||
              !Array.isArray(cabinRow.shoreGaps) || cabinRow.shoreGaps.length !== 3 ||
              cabinRow.shoreGaps.some(function (n) {
                return typeof n !== "number" || !isFinite(n) || Math.abs(n) > 20;
              }) ||
              typeof cabinRow.water !== "string" || cabinRow.water.length > 80 ||
              typeof cabinRow.ball !== "string" || cabinRow.ball.length > 80)
            return fail("第三章船艙原紙格式錯誤");
        }
        if (dossier.blind.judgment === "comparison-recorded") {
          var blindDockCount = dossier.blind.records.filter(function (row) {
            return row.stage === "dock";
          }).length;
          var blindSteadyCount = dossier.blind.records.filter(function (row) {
            return row.stage === "steady";
          }).length;
          if (blindDockCount < 3 || blindSteadyCount < 3)
            return fail("第三章船艙對照回數不足");
        }
      }
    }
    if (!Array.isArray(state.transcript) || state.transcript.length > 3000) return fail("對話紀錄格式錯誤");
    var legacyTranscriptScenes = { "C2-2B": 1, "C3-3": 1, "C3-4": 1 };
    for (var t = 0; t < state.transcript.length; t++) {
      var line = state.transcript[t];
      if (!line || (!sceneIds[line.scene] && !legacyTranscriptScenes[line.scene]) ||
          typeof line.text !== "string" || line.text.length > 2000)
        return fail("對話紀錄中有一筆格式錯誤");
    }
    return { ok: true, state: state };
  }

  /* 第四章白名單：軌道向量、跨尺度預測、模型比較與校樣窗口。
     匯入檔只能攜帶有限的數值／列舉；證據仍須能由引擎動作路徑重建。 */
  function sanitizeImport4(state, scenes, engine4) {
    if (!state || typeof state !== "object") return fail("存檔內容格式錯誤");
    var generic = scrub(state, 0, { n: LIMITS.maxNodes });
    if (generic) return fail(generic);
    if (state.schemaVersion !== 1 || state.chapter !== "ch4") return fail("存檔版本或章節不相容");
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
    if (!lab || !isInt(lab.days) || lab.days < 0 || lab.days > 9999 ||
        !lab.orbitLab || !lab.scaleLab || !lab.planetLab || !lab.modelLab || !lab.proof || !lab.evidence)
      return fail("第四章實驗紀錄格式錯誤");
    if (!isInt(lab.orbitLab.attempt) || lab.orbitLab.attempt < 0 || lab.orbitLab.attempt > 999 ||
        !isInt(lab.orbitLab.step) || lab.orbitLab.step < 0 || lab.orbitLab.step > 3 ||
        !Array.isArray(lab.orbitLab.path) || lab.orbitLab.path.length > 200 ||
        !Array.isArray(lab.orbitLab.deflectionVectors) || lab.orbitLab.deflectionVectors.length > 3)
      return fail("軌道路徑紀錄格式錯誤");
    for (var pi = 0; pi < lab.orbitLab.path.length; pi++) {
      var point = lab.orbitLab.path[pi];
      if (!point || !isFinite(point.x) || !isFinite(point.y)) return fail("軌道路徑含無法辨識的座標");
    }
    if (lab.orbitLab.ruleRuns != null) {
      if (!Array.isArray(lab.orbitLab.ruleRuns) || lab.orbitLab.ruleRuns.length > 100)
        return fail("改向規則紀錄格式錯誤");
      for (var ori = 0; ori < lab.orbitLab.ruleRuns.length; ori++) {
        var orbitRun = lab.orbitLab.ruleRuns[ori];
        if (!orbitRun ||
            ["same-vector", "ink-mark", "earth-center"].indexOf(orbitRun.target) < 0 ||
            ["slow", "medium", "fast"].indexOf(orbitRun.speed) < 0 ||
            ["short", "medium", "long"].indexOf(orbitRun.strength) < 0 ||
            ["parabola", "wrong-center", "outer-band", "inner-band", "near-circle"].indexOf(orbitRun.prediction) < 0 ||
            ["parabola", "wrong-center", "outer-band", "inner-band", "near-circle"].indexOf(orbitRun.outcome) < 0 ||
            !Array.isArray(orbitRun.path) || orbitRun.path.length > 200)
          return fail("改向規則含無法辨識的設定");
      }
    }
    if (!isFinite(lab.scaleLab.earthRadiusRatio) || lab.scaleLab.earthRadiusRatio < 1 ||
        lab.scaleLab.earthRadiusRatio > 100 || !isFinite(lab.scaleLab.timeRatio) ||
        lab.scaleLab.timeRatio < 1 || lab.scaleLab.timeRatio > 120 ||
        !Array.isArray(lab.scaleLab.trials) || lab.scaleLab.trials.length > 100)
      return fail("跨尺度工作台紀錄格式錯誤");
    for (var ti = 0; ti < lab.scaleLab.trials.length; ti++) {
      var trial = lab.scaleLab.trials[ti];
      if (!trial || !isFinite(trial.exponent) || trial.exponent < 0 || trial.exponent > 3 ||
          !isFinite(trial.moonSagM)) return fail("距離律試算紀錄格式錯誤");
    }
    if (lab.scaleLab.lawLocked !== null &&
        (!isFinite(lab.scaleLab.lawLocked) || lab.scaleLab.lawLocked < 0 || lab.scaleLab.lawLocked > 3))
      return fail("封存距離律格式錯誤");
    if (!Array.isArray(lab.planetLab.predictions) || lab.planetLab.predictions.length > 100 ||
        !lab.planetLab.revealed || !lab.planetLab.residuals) return fail("行星預測紀錄格式錯誤");
    for (var pr = 0; pr < lab.planetLab.predictions.length; pr++) {
      var pred = lab.planetLab.predictions[pr];
      if (!pred || ["mars", "jupiter"].indexOf(pred.planet) < 0 ||
          !isFinite(pred.prediction) || !isFinite(pred.residualPct) ||
          typeof pred.sealed !== "boolean" || typeof pred.pass !== "boolean")
        return fail("行星預測含無法辨識的資料");
    }
    if (!Array.isArray(lab.modelLab.runs) || lab.modelLab.runs.length > 100)
      return fail("模型比較紀錄格式錯誤");
    for (var mr = 0; mr < lab.modelLab.runs.length; mr++) {
      var run = lab.modelLab.runs[mr];
      if (!run || ["inverseSquare", "simpleVortex"].indexOf(run.model) < 0 ||
          ["moon", "planets", "comet"].indexOf(run.caseId) < 0 ||
          !isFinite(run.residual) || !isInt(run.patches) || run.patches < 0)
        return fail("模型比較含無法辨識的資料");
    }
    if (lab.modelLab.protocolAttempts != null) {
      if (!Array.isArray(lab.modelLab.protocolAttempts) || lab.modelLab.protocolAttempts.length > 30)
        return fail("模型比較標準紀錄格式錯誤");
      for (var mpa = 0; mpa < lab.modelLab.protocolAttempts.length; mpa++) {
        var protocolAttempt = lab.modelLab.protocolAttempts[mpa];
        if (!protocolAttempt ||
            ["shared-law-observed-initials", "same-start-all", "retune-law-per-body"].indexOf(protocolAttempt.protocol) < 0 ||
            typeof protocolAttempt.ok !== "boolean")
          return fail("模型比較標準含無法辨識的資料");
      }
    }
    if (lab.modelLab.protocolLocked &&
        lab.modelLab.protocol !== "shared-law-observed-initials")
      return fail("模型比較完成狀態與公平標準不一致");
    if (lab.cometLab != null) {
      if (!Array.isArray(lab.cometLab.attempts) || lab.cometLab.attempts.length > 100 ||
          typeof lab.cometLab.joined !== "boolean" ||
          (lab.cometLab.selectedConnection != null &&
            ["hard-kink", "same-orbit"].indexOf(lab.cometLab.selectedConnection) < 0))
        return fail("彗星接軌紀錄格式錯誤");
      for (var ca = 0; ca < lab.cometLab.attempts.length; ca++) {
        var cometAttempt = lab.cometLab.attempts[ca];
        if (!cometAttempt || ["hard-kink", "same-orbit"].indexOf(cometAttempt.mode) < 0 ||
            typeof cometAttempt.ok !== "boolean" || typeof cometAttempt.note !== "string" ||
            cometAttempt.note.length > 240)
          return fail("彗星接軌含無法辨識的資料");
      }
      if (lab.cometLab.joined &&
          !lab.cometLab.attempts.some(function (a) { return a.mode === "same-orbit" && a.ok; }))
        return fail("彗星接軌完成狀態與紀錄不一致");
    }
    if (lab.archiveLab != null) {
      if (!Array.isArray(lab.archiveLab.clipped) || lab.archiveLab.clipped.length > 5 ||
          typeof lab.archiveLab.complete !== "boolean")
        return fail("旅人筆記回收紀錄格式錯誤");
      var allowedArchive = ["K1", "K2", "K3", "K4", "K5"];
      var uniqueArchive = Array.from(new Set(lab.archiveLab.clipped));
      if (uniqueArchive.length !== lab.archiveLab.clipped.length ||
          uniqueArchive.some(function (id) { return allowedArchive.indexOf(id) < 0; }) ||
          lab.archiveLab.complete !== allowedArchive.every(function (id) {
            return uniqueArchive.indexOf(id) >= 0;
          }))
        return fail("旅人筆記回收狀態與紀錄不一致");
    }
    var press = lab.proof.press;
    if (!press || !isInt(press.window) || press.window < 1 || press.window > 3 ||
        press.reservedWindows !== 3 || ["open", "schedule-lost"].indexOf(press.status) < 0 ||
        typeof press.scheduleLost !== "boolean" || !Array.isArray(press.proofs) ||
        !Array.isArray(press.delays) || press.proofs.length > 100 || press.delays.length > 100)
      return fail("校樣窗口紀錄格式錯誤");
    var hookeChoices = ["hookeComplete", "newtonAlone", "precise-scope"];
    if (lab.proof.hookeScope != null && hookeChoices.indexOf(lab.proof.hookeScope) < 0)
      return fail("Hooke 貢獻句格式錯誤");
    if (lab.proof.hookeScopeAttempts != null) {
      if (!Array.isArray(lab.proof.hookeScopeAttempts) || lab.proof.hookeScopeAttempts.length > 100)
        return fail("Hooke 貢獻句嘗試紀錄格式錯誤");
      for (var hs = 0; hs < lab.proof.hookeScopeAttempts.length; hs++) {
        var scopeTry = lab.proof.hookeScopeAttempts[hs];
        if (!scopeTry || hookeChoices.indexOf(scopeTry.choice) < 0 || typeof scopeTry.ok !== "boolean")
          return fail("Hooke 貢獻句嘗試含無法辨識的資料");
      }
    }
    if (press.priorityRecord != null) {
      var priority = press.priorityRecord;
      if (!priority || ["raised-early", "raised-at-press"].indexOf(priority.route) < 0 ||
          priority.source !== "hooke-letter-1679" || typeof priority.return !== "string" ||
          !priority.return || priority.return.length > 240)
        return fail("署名爭議分支紀錄格式錯誤");
    }
    var evidenceIds = ["k1", "k2", "k3", "k4", "k5"];
    for (var ei = 0; ei < evidenceIds.length; ei++)
      if (typeof lab.evidence[evidenceIds[ei]] !== "boolean") return fail("第四章證據狀態格式錯誤");
    if (lab.claims != null) {
      if (!lab.claims || typeof lab.claims !== "object" || Array.isArray(lab.claims) ||
          Object.keys(lab.claims).some(function (id) { return evidenceIds.indexOf(id) < 0; }))
        return fail("第四章斷言紀錄格式錯誤");
      for (var claimKey of evidenceIds) {
        var claimRows = lab.claims[claimKey];
        if (!Array.isArray(claimRows) || claimRows.length > 100)
          return fail("第四章斷言紀錄格式錯誤");
        for (var cri = 0; cri < claimRows.length; cri++) {
          var claimRow = claimRows[cri];
          if (!claimRow || !Array.isArray(claimRow.sources) || claimRow.sources.length > 8 ||
              claimRow.sources.some(function (source) {
                return typeof source !== "string" || source.length > 80;
              }) ||
              (claimRow.concept != null &&
                (typeof claimRow.concept !== "string" || claimRow.concept.length > 80)) ||
              typeof claimRow.ok !== "boolean")
            return fail("第四章斷言紀錄含無法辨識的資料");
        }
      }
    }
    if (engine4 && lab.evidence.k5 && !engine4._proofAudit(lab).complete) {
      /* CH4-CR-004 新增署名範圍欄位；既有完章存檔無法憑空補出玩家選擇。
         只在舊欄位本來就完整、且唯一缺口確為新欄位時祖父條款放行。 */
      var legacy = JSON.parse(JSON.stringify(lab));
      if (legacy.proof.hookeScope != null) return fail("完成證據與校樣內容不一致");
      legacy.proof.hookeScope = "precise-scope";
      if (!engine4._proofAudit(legacy).complete) return fail("完成證據與校樣內容不一致");
    }
    if (!Array.isArray(state.transcript) || state.transcript.length > 3000) return fail("對話紀錄格式錯誤");
    for (var t = 0; t < state.transcript.length; t++) {
      var line = state.transcript[t];
      if (!line || !sceneIds[line.scene] || typeof line.text !== "string" || line.text.length > 2000)
        return fail("對話紀錄中有一筆格式錯誤");
    }
    return { ok: true, state: state };
  }

  /* 第五章白名單：碰撞紀錄、同批重算來源、追一筆與黏土深度。 */
  function sanitizeImport5(state, scenes) {
    if (!state || typeof state !== "object") return fail("存檔內容格式錯誤");
    var generic = scrub(state, 0, { n: LIMITS.maxNodes });
    if (generic) return fail(generic);
    if (state.schemaVersion !== 1 || state.chapter !== "ch5") return fail("存檔版本或章節不相容");
    if (state.mode !== "explore" && state.mode !== "scholar") return fail("遊戲模式無法辨識");
    if (!isInt(state.rep) || state.rep < 0 || state.rep > 5) return fail("信譽數值錯誤");
    var sceneIds = {}, nodeIds = {};
    (scenes && scenes.scenes || []).forEach(function (scene) {
      sceneIds[scene.id] = 1;
      nodeIds[scene.id] = {};
      (scene.nodes || []).forEach(function (node) { nodeIds[scene.id][node.id] = 1; });
    });
    if (!state.cursor || !sceneIds[state.cursor.scene] || !nodeIds[state.cursor.scene][state.cursor.node])
      return fail("存檔中的故事位置無法辨識");
    var lab = state.lab;
    if (!lab || !isInt(lab.days) || lab.days < 0 || lab.days > 9999 ||
        !lab.draft || !Array.isArray(lab.collisionRuns) || !Array.isArray(lab.clayRuns) ||
        !lab.assertions || !lab.evidence)
      return fail("第五章工作台紀錄格式錯誤");
    if (lab.collisionRuns.length > 300 || lab.clayRuns.length > 300)
      return fail("第五章實驗紀錄過多");
    if (["steel", "putty"].indexOf(lab.draft.head) < 0 ||
        ["low", "mid", "high"].indexOf(lab.draft.speed) < 0 ||
        ["4/4", "4/8"].indexOf(lab.draft.masses) < 0 ||
        ["h1", "h4", "h9"].indexOf(lab.draft.clayHeight) < 0 ||
        ["light", "heavy"].indexOf(lab.draft.ballMass) < 0)
      return fail("第五章工作台設定無法辨識");
    for (var i = 0; i < lab.collisionRuns.length; i++) {
      var row = lab.collisionRuns[i];
      if (!row || !isInt(row.id) || row.kind !== "collision" ||
          ["steel", "putty"].indexOf(row.head) < 0 ||
          ["low", "mid", "high"].indexOf(row.speedBand) < 0 ||
          ["4/4", "4/8"].indexOf(row.masses) < 0 ||
          !row.momentum || !row.visViva ||
          !isFinite(row.momentum.before) || !isFinite(row.momentum.after) ||
          !isFinite(row.visViva.before) || !isFinite(row.visViva.after) ||
          !isFinite(row.visViva.deficit))
        return fail("第五章碰撞紀錄格式錯誤");
    }
    for (var j = 0; j < lab.clayRuns.length; j++) {
      var clay = lab.clayRuns[j];
      if (!clay || !isInt(clay.id) || clay.kind !== "clay" ||
          [1, 4, 9].indexOf(clay.height) < 0 || [2, 4, 6].indexOf(clay.speed) < 0 ||
          ["light", "heavy"].indexOf(clay.ballMass) < 0 ||
          !isFinite(clay.depth) || !isFinite(clay.readingError))
        return fail("第五章黏土紀錄格式錯誤");
    }
    var assertionKeys = ["j1", "j2", "j3"];
    for (var ak = 0; ak < assertionKeys.length; ak++) {
      var assertion = lab.assertions[assertionKeys[ak]];
      if (!assertion || typeof assertion.done !== "boolean" || !Array.isArray(assertion.sources))
        return fail("第五章斷言紀錄格式錯誤");
    }
    try {
      var collisionIds = {};
      lab.collisionRuns.forEach(function (row) { collisionIds[row.id] = true; });
      var clayIds = {};
      lab.clayRuns.forEach(function (row) { clayIds[row.id] = true; });
      if (lab.assertions.j1.sources.some(function (id) { return !collisionIds[id]; }) ||
          lab.assertions.j2.sources.some(function (id) { return !collisionIds[id]; }) ||
          lab.assertions.j3.sources.some(function (id) { return !clayIds[id]; }))
        return fail("第五章斷言引用了不存在的紀錄");
    } catch (e) {
      return fail("第五章斷言紀錄格式錯誤");
    }
    if (lab.evidence.j1 !== lab.assertions.j1.done ||
        lab.evidence.j2 !== lab.assertions.j2.done ||
        lab.evidence.j3 !== lab.assertions.j3.done)
      return fail("第五章證據狀態與斷言不一致");
    if (lab.evidence.followup &&
        !lab.collisionRuns.some(function (row) {
          return row.masses === "4/8" && row.head === "putty" &&
            row.momentum.before === 24 && row.momentum.after === 24 &&
            row.visViva.before === 144 && row.visViva.after === 48;
        }))
      return fail("第五章追一筆狀態與紀錄不一致");
    if (!Array.isArray(state.transcript) || state.transcript.length > 3000)
      return fail("對話紀錄格式錯誤");
    for (var t = 0; t < state.transcript.length; t++) {
      var line = state.transcript[t];
      if (!line || !sceneIds[line.scene] || typeof line.text !== "string" || line.text.length > 2400)
        return fail("對話紀錄中有一筆格式錯誤");
    }
    return { ok: true, state: state };
  }

  var api = { sanitizeImport: sanitizeImport, sanitizeImport2: sanitizeImport2,
    sanitizeImport3: sanitizeImport3, sanitizeImport4: sanitizeImport4,
    sanitizeImport5: sanitizeImport5,
    _scrub: scrub, LIMITS: LIMITS };
  if (typeof module === "object" && module.exports) { module.exports = api; }
  else { root.GB = root.GB || {}; root.GB.Sanitize = api; }
})(typeof self !== "undefined" ? self : this);
