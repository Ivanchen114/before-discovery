/* 標題頁遊玩體驗建議：純函式平台判定，由 stage-ui 接 DOM。 */
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.BDPlayExperience = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  function adviceKind(input) {
    var value = input || {};
    if (value.dismissed || value.standalone || value.fullscreen) return "hidden";
    if (value.supportsFullscreen) return "fullscreen";
    if (value.appleMobile && value.http) return "ios-install";
    return "hidden";
  }

  function isAppleMobile(navigatorLike) {
    var nav = navigatorLike || {};
    var ua = String(nav.userAgent || "");
    var platform = String(nav.platform || "");
    return /iPhone|iPad|iPod/i.test(ua) ||
      (platform === "MacIntel" && Number(nav.maxTouchPoints || 0) > 1);
  }

  return {
    adviceKind: adviceKind,
    isAppleMobile: isAppleMobile
  };
});
