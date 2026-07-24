/* src/stage-ui.js — 滿版舞台表現層 v2(僅 stage.html 載入;chapter.html 不載本檔=灰盒不變)。
   ⚠ 本檔為生成物(GB-ADR-015 C-2 拆分):源碼在 src/stage/*.part.js,改 part 後執行
   `node tools/build-stage.mjs` 重建;直接改本檔=白改且落後檢測會紅。
   職責:訂閱 chapter-ui.js 的 bd:* 事件,做打字機/半身像/場景背景/筆記本模式。
   鐵律:不碰引擎、不碰狀態、不碰存檔——只消費事件、唯讀資料(scenes/assets)與 DOM。
   v2(總監裁決 2026-07-19 第一輪視覺修正):
   - 對話肖像=對話框左側半身像;接口鏈 speakerDialoguePortrait→speakerPortrait(遮罩 fallback);
     不做 CSS 鏡像(角色特徵不可翻面);普通對話不用大型立繪(stageSprite 留高潮演出,未實裝)。
   - 打字機 40ms 基速+標點停頓(逗短/句長);超過約三行=表現層分頁(不出捲軸,不改劇本文字)。
   - 句子顯示完畢後 Enter/Space 觸發唯一「繼續」;表單/選項/筆記開啟不誤觸。
   - 旅人筆記=全畫面筆記本 modal(桌機雙頁/低高度視窗分頁);Esc 關閉,焦點歸還;舞台暫停。
   - 預載改場景範圍(當前+下一場景背景+對話肖像),不隨美術量產一次抓全章。 */
(function () {
  "use strict";
  var SCENES = window.GB.DATA.scenes;
  var ASSETS = window.GB.DATA.assets || null;
  var TEXT = window.GB.TextFormat || null;
  var CHAPTER_ID = /^ch[1234]$/.test(SCENES.chapter || "") ? SCENES.chapter : "ch1";
  var TYPE_MS = 40;                    /* 逐字基速 */
  var PAUSE_SHORT = 90, PAUSE_LONG = 240; /* 標點附加停頓 */
  var SHORT_P = "、，,；;：:·—", LONG_P = "。．.？！?!…";
  function $(id) { return document.getElementById(id); }
  function displayText(value) {
    return TEXT ? (TEXT.playerText ? TEXT.playerText(value) : TEXT.normalizeZhPunctuation(value)) : value;
  }
  var body = document.body;

  var reduced = false;
  try { reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

  /* ---------- 資產(唯讀,語義同 chapter-ui.assetEntry) ---------- */
  function assetEntry(id) {
    if (!ASSETS || !id) return null;
    var hit = null;
    ASSETS.entries.forEach(function (e) { if (e.id === id) hit = e; });
    return (hit && hit.path) ? hit : null;
  }
  function assetUrl(e) { return ASSETS.basePath + e.path; }
  function preloadEntry(e) {
    if (!e || !e.path) return;
    var im = new Image(); im.src = assetUrl(e);
    (e.layers || []).forEach(function (L) {
      if (L.path) { var i2 = new Image(); i2.src = ASSETS.basePath + L.path; }
    });
  }
  /* 場景範圍預載:當前+下一場景的背景與該場景對話肖像;禁止全 manifest 預載(首屏 3MB 預算) */
  function preloadScene(sceneId) {
    if (!ASSETS) return;
    var idx = -1;
    SCENES.scenes.forEach(function (s, i) { if (s.id === sceneId) idx = i; });
    var nextId = (idx >= 0 && SCENES.scenes[idx + 1]) ? SCENES.scenes[idx + 1].id : null;
    [sceneId, nextId].forEach(function (sid) {
      if (!sid) return;
      if (ASSETS.sceneBg) preloadEntry(assetEntry(ASSETS.sceneBg[CHAPTER_ID + ":" + sid] || ASSETS.sceneBg[sid]));
      var m = ASSETS.sceneDialoguePortrait && ASSETS.sceneDialoguePortrait[sid];
      if (m) Object.keys(m).forEach(function (sp) { preloadEntry(assetEntry(m[sp])); });
      (ASSETS.lineFocusVisual || []).forEach(function (r) {
        if (r.scene !== sid) return;
        (r.items || []).forEach(function (item) { preloadEntry(assetEntry(item.asset)); });
      });
      var briefs = ASSETS.apparatusBriefings || {};
      var brief = briefs[CHAPTER_ID + ":" + sid] || briefs[sid];
      if (brief) {
        preloadEntry(assetEntry(brief.plateAsset));
        (brief.items || []).forEach(function (item) { preloadEntry(assetEntry(item.asset)); });
      }
    });
    var def = ASSETS.speakerDialoguePortrait || {};
    Object.keys(def).forEach(function (sp) { preloadEntry(assetEntry(def[sp])); });
    var ts = ASSETS.travelerSilhouette || {};
    Object.keys(ts).forEach(function (k) { preloadEntry(assetEntry(ts[k])); });
  }
