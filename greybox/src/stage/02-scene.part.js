  /* ---------- 場景背景 ---------- */
  var curBgId = null, curSceneId = null;
  function sceneInfo(id) {
    var sc = null;
    SCENES.scenes.forEach(function (s) { if (s.id === id) sc = s; });
    return sc;
  }
  function setScene(sceneId) {
    if (sceneId === curSceneId) return;
    clearFocusVisual();
    curSceneId = sceneId;
    preloadScene(sceneId);
    var sc = sceneInfo(sceneId);
    $("sceneChip").textContent = sceneId + (sc && sc.title ? "｜" + displayText(sc.title) : "");
    var e = (ASSETS && ASSETS.sceneBg) ? assetEntry(ASSETS.sceneBg[CHAPTER_ID + ":" + sceneId] || ASSETS.sceneBg[sceneId]) : null;
    var img = $("bgImg"), fb = $("bgFallback");
    if (e) {
      if (curBgId !== e.id) {
        curBgId = e.id;
        img.style.opacity = 0;
        img.onload = function () { img.style.opacity = 1; };
        img.src = assetUrl(e);
        img.alt = e.label || "";
        if (img.complete) img.style.opacity = 1;
      }
      img.style.display = "";
      fb.classList.add("off");
    } else {
      curBgId = null;
      img.style.display = "none";
      img.removeAttribute("src");
      fb.classList.remove("off");
      $("fbTitle").textContent = (sc && sc.title) ? sc.title : sceneId;
    }
  }
