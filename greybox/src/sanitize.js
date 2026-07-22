/* src/sanitize.js — 書信碼匯入淨化(Sol 巡查 A-1)。雙載體:module.exports+root.GB.Sanitize。
   職責:對「跨機貼入」的 state 做深層白名單檢查——通過=原樣放行,違規=整包拒絕(不修補、不覆蓋本機存檔)。
   防線分工:本檔擋結構/型別/enum/長度/原型污染;chapter-ui 的 DOM-safe 渲染擋殘餘字串(雙層防禦)。
   引擎與 loadSave 零改動(R-SAV-02 四分類不變;本檢查是其後的第五道匯入閘,僅 btnImport 路徑)。 */
(function (root) {
  "use strict";
  var BAD_KEYS = ["__proto__", "constructor", "prototype"]; /* 陣列而非字面量:字面量的 __proto__ 不會成為自有鍵 */
  var LIMITS = { maxNodes: 20000, maxStr: 4000, maxArr: 600, maxKey: 64, maxDepth: 12 };

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
