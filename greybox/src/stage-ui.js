/* src/stage-ui.js — 滿版舞台表現層(僅 stage.html 載入;chapter.html 不載本檔=灰盒不變)。
   職責:訂閱 chapter-ui.js 的 bd:* 事件,做打字機/旁白淡入/場景背景/立繪/回顧抽屜。
   鐵律:不碰引擎、不碰狀態、不碰存檔——只消費事件與唯讀資料(scenes/assets)。
   總監裁決(2026-07-19):對話逐字、旁白與系統行淡入;點擊跳完;reduced-motion 全顯。 */
(function () {
  "use strict";
  var SCENES = window.GB.DATA.scenes;
  var ASSETS = window.GB.DATA.assets || null;
  var TYPE_MS = 30; /* 逐字間隔;約 33 字/秒 */
  function $(id) { return document.getElementById(id); }

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
  function preloadAll() {
    if (!ASSETS) return;
    ASSETS.entries.forEach(function (e) {
      if (e.path) { var im = new Image(); im.src = assetUrl(e); }
      (e.layers || []).forEach(function (L) {
        if (L.path) { var im2 = new Image(); im2.src = ASSETS.basePath + L.path; }
      });
    });
  }

  /* ---------- 場景背景 ---------- */
  var curBgId = null, curSceneId = null;
  function sceneInfo(id) {
    var sc = null;
    SCENES.scenes.forEach(function (s) { if (s.id === id) sc = s; });
    return sc;
  }
  function setScene(sceneId) {
    if (sceneId === curSceneId) return;
    curSceneId = sceneId;
    var sc = sceneInfo(sceneId);
    $("sceneChip").textContent = sceneId + (sc && sc.title ? "|" + sc.title : "");
    var e = (ASSETS && ASSETS.sceneBg) ? assetEntry(ASSETS.sceneBg[sceneId]) : null;
    var img = $("bgImg"), fb = $("bgFallback");
    if (e) {
      if (curBgId !== e.id) {
        curBgId = e.id;
        img.style.opacity = 0;
        img.onload = function () { img.style.opacity = 1; };
        img.src = assetUrl(e);
        img.alt = e.label || "";
        if (img.complete) img.style.opacity = 1; /* 快取即載:onload 可能不觸發 */
      }
      img.style.display = "";
      fb.classList.add("off");
    } else {
      curBgId = null;
      img.style.display = "none";
      fb.classList.remove("off");
      $("fbTitle").textContent = (sc && sc.title) ? sc.title : sceneId;
    }
  }

  /* ---------- 立繪 ---------- */
  var curPortraitId = null;
  function buildStagePortrait(e, alt) { /* ART-ADR-001 混合制,同 chapter-ui 縮放語義 */
    if (!e.layers || !e.layers.length) {
      var img = document.createElement("img");
      img.src = assetUrl(e); img.alt = alt || e.label || e.id;
      return img;
    }
    var wrap = document.createElement("span");
    wrap.className = "composite";
    var base = document.createElement("img");
    base.src = assetUrl(e); base.alt = alt || e.label || e.id;
    base.style.display = "block"; base.style.maxHeight = "100%";
    wrap.appendChild(base);
    e.layers.forEach(function (L) {
      if (!L.path) return;
      var li = document.createElement("img");
      li.src = ASSETS.basePath + L.path; li.alt = ""; li.className = "layer";
      li.style.left = (100 * L.anchorX / e.w) + "%";
      li.style.top = (100 * L.anchorY / e.h) + "%";
      li.style.width = (100 * L.w / e.w) + "%";
      wrap.appendChild(li);
    });
    return wrap;
  }
  function setPortrait(speaker, cls) {
    var box = $("portraitBox");
    if (cls === "stage" || cls === "system") return; /* 旁白/系統:立繪不動 */
    if (cls === "player") { box.classList.add("dim"); return; } /* 你說話:對方立繪壓暗 */
    var key = (ASSETS && ASSETS.speakerPortrait) ? ASSETS.speakerPortrait[speaker] : null;
    var e = assetEntry(key);
    if (!e) { box.classList.remove("on"); curPortraitId = null; return; } /* 無圖角色:清場 */
    if (curPortraitId !== e.id) {
      curPortraitId = e.id;
      box.innerHTML = "";
      box.appendChild(buildStagePortrait(e, speaker));
    }
    box.classList.add("on");
    box.classList.remove("dim");
  }

  /* ---------- 打字機佇列 ---------- */
  var queue = [], typing = false, waiting = false, timer = null, curFull = "";
  var body = document.body;
  function syncFlags() {
    var active = typing || waiting || queue.length > 0;
    body.classList.toggle("held", active);
    body.classList.toggle("queue-active", active);
  }
  function lineDone() {
    typing = false;
    if (queue.length) { waiting = true; $("dlgCue").style.display = ""; }
    else { waiting = false; $("dlgCue").style.display = "none"; }
    syncFlags();
  }
  function startLine(item, instant) {
    var np = $("nameplate"), tx = $("dlgText");
    $("dlgCue").style.display = "none";
    var isNarr = item.cls === "stage", isSys = item.cls === "system";
    var showName = item.speaker && !isNarr && !isSys;
    np.style.display = showName ? "" : "none";
    np.textContent = showName ? item.speaker : "";
    tx.className = isNarr ? "narr" : (isSys ? "sys" : (item.cls === "player" ? "pl" : ""));
    setPortrait(item.speaker, item.cls);
    if (isNarr || isSys) { /* 旁白/系統:整句淡入(CSS 動畫重觸發) */
      tx.style.animation = "none"; void tx.offsetWidth; tx.style.animation = "";
      tx.textContent = item.text;
      lineDone(); return;
    }
    if (reduced || instant) { tx.textContent = item.text; lineDone(); return; }
    tx.textContent = ""; curFull = item.text; typing = true; syncFlags();
    var pos = 0;
    timer = setInterval(function () {
      pos++;
      tx.textContent = curFull.slice(0, pos);
      if (pos >= curFull.length) { clearInterval(timer); lineDone(); }
    }, TYPE_MS);
  }
  function next() { waiting = false; startLine(queue.shift()); }
  function enqueue(item) {
    queue.push(item);
    syncFlags();
    if (!typing && !waiting) next();
  }
  /* 回傳 true=本次輸入已被表現層消化(跳完或翻下一句) */
  function advanceIntent() {
    if (typing) { clearInterval(timer); $("dlgText").textContent = curFull; lineDone(); return true; }
    if (waiting && queue.length) { next(); return true; }
    return false;
  }

  /* ---------- 事件訂閱 ---------- */
  document.addEventListener("bd:scene", function (ev) { setScene(ev.detail.sceneId); });
  var lastReplay = null;
  document.addEventListener("bd:line", function (ev) {
    var d = ev.detail;
    if (d.replay) { lastReplay = d; return; } /* 回放進回顧抽屜,不重演;記住最後一句當開場語境 */
    enqueue(d);
  });
  var needKickoff = false;
  document.addEventListener("bd:view", function (ev) {
    var d = ev.detail, view;
    if (d.type === "embed") view = (d.system === "incline") ? "lab" : "debate";
    else if (d.type === "review" || d.type === "histfacts" || d.type === "choice" || d.type === "end") view = d.type;
    else view = "narration";
    body.setAttribute("data-view", view);
    if (needKickoff && view === "narration") { /* 全新開局:代玩家按一次繼續,首句自動開演 */
      needKickoff = false;
      setTimeout(function () {
        var btns = $("controls").querySelectorAll("button");
        if (btns.length === 1 && !typing && !waiting && !queue.length) btns[0].click();
      }, 0);
    }
  });
  document.addEventListener("bd:start", function () {
    queue = []; typing = false; waiting = false;
    if (timer) clearInterval(timer);
    curPortraitId = null;
    $("portraitBox").classList.remove("on");
    $("dlgText").textContent = ""; $("nameplate").style.display = "none";
    body.classList.remove("drawer-open");
    $("btnDrawer").setAttribute("aria-expanded", "false");
    syncFlags();
    /* 開場語境:讀檔→最後一句即顯;全新開局(transcript 空)→標記 kickoff,由 bd:view 代按首次繼續 */
    if (lastReplay) { startLine(lastReplay, true); lastReplay = null; needKickoff = false; }
    else needKickoff = true;
  });

  /* ---------- 輸入:點擊與鍵盤 ---------- */
  $("stage").addEventListener("click", function (ev) {
    if (body.classList.contains("drawer-open")) return;
    if (ev.target.closest("button, select, input, textarea, label, a, #panelWrap, #drawer, #title-screen")) return;
    if (advanceIntent()) return;
    var view = body.getAttribute("data-view");
    if (view === "narration" || view === "end") {
      var btns = $("controls").querySelectorAll("button");
      if (btns.length === 1) btns[0].click();
    }
  });
  document.addEventListener("keydown", function (ev) {
    if (ev.key !== " " && ev.key !== "Enter") return;
    if (typing || waiting) { /* 演出未完:任何 Enter/Space 先消化演出,不觸發底層按鈕 */
      ev.preventDefault(); ev.stopPropagation();
      advanceIntent();
    }
  }, true);

  /* ---------- 旅人筆記抽屜 ---------- */
  function toggleDrawer(open) {
    body.classList.toggle("drawer-open", open);
    $("btnDrawer").setAttribute("aria-expanded", open ? "true" : "false");
    if (open) { var log = $("log"); log.scrollTop = log.scrollHeight; }
  }
  $("btnDrawer").addEventListener("click", function () {
    toggleDrawer(!body.classList.contains("drawer-open"));
  });
  $("btnDrawerClose").addEventListener("click", function () { toggleDrawer(false); });
  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape" && body.classList.contains("drawer-open")) toggleDrawer(false);
  });

  preloadAll();
})();
