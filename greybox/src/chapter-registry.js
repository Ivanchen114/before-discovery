/* src/chapter-registry.js — 章別 runtime metadata 的唯一 accessor。
   正本只在 data/series.json；本模組驗證並投影，不另維護章表。 */
(function (root, factory) {
  "use strict";
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("../data/series.js"));
  } else {
    root.GB = root.GB || {};
    root.GB.ChapterRegistry = factory(root.GB.DATA && root.GB.DATA.series);
  }
})(typeof self !== "undefined" ? self : this, function (SERIES) {
  "use strict";

  var REQUIRED_RUNTIME = [
    "scenesKey", "histfactsKey", "debateKey", "engineKey", "saveKey",
    "saveSchema", "saveEncoding", "sanitizerKey", "initialRep", "repairScene"
  ];

  function fail(message) { throw new Error("chapter registry: " + message); }
  function own(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
  }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function freezeDeep(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.keys(value).forEach(function (key) { freezeDeep(value[key]); });
    return Object.freeze(value);
  }

  function validate(series) {
    if (!series || series.schemaVersion !== 1 || !Array.isArray(series.chapters))
      fail("series.json schemaVersion/chapters 無效");
    if (!series.chapters.length) fail("chapters 不得為空");
    var ids = {}, routes = {}, saveKeys = {};
    series.chapters.forEach(function (chapter, index) {
      if (!chapter || typeof chapter !== "object") fail("chapter[" + index + "] 無效");
      if (!/^ch[1-9][0-9]*$/.test(chapter.id || "")) fail("非法 id: " + chapter.id);
      if (!/^ch[0-9]{2,}$/.test(chapter.route || "")) fail("非法 route: " + chapter.route);
      if (ids[chapter.id]) fail("重複 id: " + chapter.id);
      if (routes[chapter.route]) fail("重複 route: " + chapter.route);
      ids[chapter.id] = true;
      routes[chapter.route] = true;
      if (!chapter.runtime || typeof chapter.runtime !== "object")
        fail(chapter.id + " 缺 runtime metadata");
      REQUIRED_RUNTIME.forEach(function (key) {
        if (!own(chapter.runtime, key)) fail(chapter.id + " runtime 缺 " + key);
      });
      if (typeof chapter.runtime.scenesKey !== "string" ||
          typeof chapter.runtime.histfactsKey !== "string" ||
          typeof chapter.runtime.engineKey !== "string" ||
          typeof chapter.runtime.saveKey !== "string" ||
          typeof chapter.runtime.sanitizerKey !== "string" ||
          typeof chapter.runtime.repairScene !== "string")
        fail(chapter.id + " runtime 字串欄位無效");
      if (chapter.runtime.debateKey !== null && typeof chapter.runtime.debateKey !== "string")
        fail(chapter.id + " debateKey 必須是字串或 null");
      if (!Number.isInteger(chapter.runtime.saveSchema) || chapter.runtime.saveSchema < 1)
        fail(chapter.id + " saveSchema 無效");
      if (["legacy-raw", "letter-envelope"].indexOf(chapter.runtime.saveEncoding) < 0)
        fail(chapter.id + " saveEncoding 無效");
      if (!Number.isInteger(chapter.runtime.initialRep) ||
          chapter.runtime.initialRep < 0 || chapter.runtime.initialRep > 5)
        fail(chapter.id + " initialRep 無效");
      if (saveKeys[chapter.runtime.saveKey]) fail("重複 saveKey: " + chapter.runtime.saveKey);
      saveKeys[chapter.runtime.saveKey] = true;
    });
    return true;
  }

  function create(series) {
    validate(series);
    var snapshot = freezeDeep(clone(series));
    var byIdMap = {}, byRouteMap = {};
    snapshot.chapters.forEach(function (chapter) {
      byIdMap[chapter.id] = chapter;
      byRouteMap[chapter.route] = chapter;
    });
    function byId(id) { return byIdMap[id] || null; }
    function byRoute(route) { return byRouteMap[route] || null; }
    function nextOf(id) {
      var index = snapshot.chapters.findIndex(function (chapter) { return chapter.id === id; });
      return index >= 0 && snapshot.chapters[index + 1] ? snapshot.chapters[index + 1] : null;
    }
    function isSupported(value) { return !!(byId(value) || byRoute(value)); }
    return freezeDeep({
      schemaVersion: snapshot.schemaVersion,
      chapters: snapshot.chapters,
      byId: byId,
      byRoute: byRoute,
      nextOf: nextOf,
      isSupported: isSupported,
      validate: validate,
      create: create
    });
  }

  return create(SERIES);
});
