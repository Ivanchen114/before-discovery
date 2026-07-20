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
    if (depth > LIMITS.maxDepth) return "深度超限";
    if (budget.n-- <= 0) return "節點數超限";
    var t = typeof v;
    if (v === null || t === "boolean") return null;
    if (t === "number") return isFinite(v) ? null : "非有限數值";
    if (t === "string") return v.length <= LIMITS.maxStr ? null : "字串超長";
    if (Array.isArray(v)) {
      if (v.length > LIMITS.maxArr) return "陣列超長";
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
        if (BAD_KEYS.indexOf(k) >= 0) return "非法鍵:" + k;
        if (k.length > LIMITS.maxKey) return "鍵名超長";
        var r2 = scrub(v[k], depth + 1, budget);
        if (r2) return r2;
      }
      return null;
    }
    return "非法型別:" + t;
  }

  function isInt(x) { return typeof x === "number" && isFinite(x) && Math.floor(x) === x; }

  /* 關鍵欄位白名單(需要 patterns/scenes 資料提供 enum) */
  function sanitizeImport(state, patterns, scenes) {
    if (!state || typeof state !== "object") return fail("state 非物件");
    var generic = scrub(state, 0, { n: LIMITS.maxNodes });
    if (generic) return fail(generic);

    if (state.mode !== "explore" && state.mode !== "scholar") return fail("mode 非法");
    if (!isInt(state.rep) || state.rep < 0 || state.rep > 5) return fail("rep 非法");

    var sceneIds = {};
    (scenes && scenes.scenes || []).forEach(function (s) { sceneIds[s.id] = 1; });
    if (!state.cursor || !sceneIds[state.cursor.scene]) return fail("cursor.scene 非法");

    var lab = state.lab;
    if (!lab || typeof lab !== "object") return fail("lab 缺失");
    if (!isInt(lab.days) || lab.days < 0 || lab.days > 9999) return fail("days 非法");

    var runs = lab.evidence && lab.evidence.runs;
    if (!Array.isArray(runs) || runs.length > 300) return fail("runs 非法");
    var DIM_KEYS = { ball: "ball", surface: "surface", incline: "incline", timer: "timer" };
    for (var i = 0; i < runs.length; i++) {
      var r = runs[i];
      if (!r || !isInt(r.id) || !isInt(r.day) || !r.config) return fail("run #" + i + " 結構非法");
      for (var dk in DIM_KEYS) {
        var val = r.config[dk];
        if (typeof val !== "string" || !patterns || !patterns[dk] || !(val in patterns[dk]))
          return fail("run 配置 enum 非法:" + dk);
      }
      if (!Array.isArray(r.readings) || r.readings.length > 8) return fail("readings 非法");
      for (var j = 0; j < r.readings.length; j++)
        if (typeof r.readings[j] !== "number" || !isFinite(r.readings[j])) return fail("readings 數值非法");
    }
    var claims = lab.inference && lab.inference.claims;
    if (!Array.isArray(claims) || claims.length > 300) return fail("claims 非法");
    for (var c = 0; c < claims.length; c++) {
      var cl = claims[c];
      if (!cl || !isInt(cl.id) || !cl.config) return fail("claim #" + c + " 結構非法");
      if (typeof cl.prediction !== "number" || !isFinite(cl.prediction)) return fail("prediction 非法");
      for (var dk2 in DIM_KEYS) {
        var v2 = cl.config[dk2];
        if (typeof v2 !== "string" || !(v2 in patterns[dk2])) return fail("claim 配置 enum 非法:" + dk2);
      }
    }
    if (!Array.isArray(state.transcript) || state.transcript.length > 3000) return fail("transcript 非法");
    for (var t = 0; t < state.transcript.length; t++) {
      var line = state.transcript[t];
      if (!line || typeof line !== "object") return fail("transcript 行非法");
      if (line.scene && !sceneIds[line.scene]) return fail("transcript 場景非法");
      if (typeof line.text !== "string" || line.text.length > 2000) return fail("transcript 文字非法");
      if (line.speaker != null && (typeof line.speaker !== "string" || line.speaker.length > 40))
        return fail("transcript 講者非法");
    }
    return { ok: true, state: state };
  }

  var api = { sanitizeImport: sanitizeImport, _scrub: scrub, LIMITS: LIMITS };
  if (typeof module === "object" && module.exports) { module.exports = api; }
  else { root.GB = root.GB || {}; root.GB.Sanitize = api; }
})(typeof self !== "undefined" ? self : this);
