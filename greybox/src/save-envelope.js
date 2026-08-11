/* src/save-envelope.js — 系列書信碼封套（R-SAV2-01）。
   只負責封套結構與章別路由；章內 schema、游標與深層白名單仍由 Narrative + Sanitize 驗證。 */
(function (root) {
  "use strict";
  var REGISTRY = typeof module === "object" && module.exports
    ? require("./chapter-registry.js")
    : (root.GB && root.GB.ChapterRegistry);

  var FORMAT = "before-discovery-letter";
  var VERSION = 1;

  function encode(chapter, state) {
    var meta = REGISTRY && REGISTRY.byId ? REGISTRY.byId(chapter) : null;
    if (!meta || !meta.runtime) throw new Error("未登錄章別:" + String(chapter || "(空白)"));
    if (meta.runtime.saveEncoding === "legacy-raw") return JSON.stringify(state);
    return JSON.stringify({
      format: FORMAT,
      envelopeVersion: VERSION,
      chapter: chapter,
      payload: state
    });
  }

  function decode(text) {
    if (!text) return { empty: true };
    var value;
    try { value = JSON.parse(text); }
    catch (e) { return { error: "badjson" }; }
    if (!value || typeof value !== "object" || Array.isArray(value)) return { error: "format" };
    if (!("format" in value)) return { legacy: true, value: value };
    if (value.format !== FORMAT) return { error: "format" };
    if (value.envelopeVersion !== VERSION) return { error: "envelope-version" };
    var meta = REGISTRY && REGISTRY.byId ? REGISTRY.byId(value.chapter) : null;
    if (!meta || !meta.runtime) return { error: "chapter" };
    if (!value.payload || typeof value.payload !== "object" || Array.isArray(value.payload)) return { error: "payload" };
    return { envelope: true, chapter: value.chapter, payload: value.payload };
  }

  var api = { FORMAT: FORMAT, VERSION: VERSION, encode: encode, decode: decode };
  if (typeof module === "object" && module.exports) module.exports = api;
  else { root.GB = root.GB || {}; root.GB.SaveEnvelope = api; }
})(typeof self !== "undefined" ? self : this);
