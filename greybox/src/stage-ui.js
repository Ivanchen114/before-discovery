/* src/stage-ui.js — 滿版舞台表現層 v2(僅 stage.html 載入;chapter.html 不載本檔=灰盒不變)。
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
  var TYPE_MS = 40;                    /* 逐字基速 */
  var PAUSE_SHORT = 90, PAUSE_LONG = 240; /* 標點附加停頓 */
  var SHORT_P = "、,,;;::·—", LONG_P = "。.?!?!…";
  function $(id) { return document.getElementById(id); }
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
      if (ASSETS.sceneBg) preloadEntry(assetEntry(ASSETS.sceneBg[sid]));
      var m = ASSETS.sceneDialoguePortrait && ASSETS.sceneDialoguePortrait[sid];
      if (m) Object.keys(m).forEach(function (sp) { preloadEntry(assetEntry(m[sp])); });
    });
    var def = ASSETS.speakerDialoguePortrait || {};
    Object.keys(def).forEach(function (sp) { preloadEntry(assetEntry(def[sp])); });
    var ts = ASSETS.travelerSilhouette || {};
    Object.keys(ts).forEach(function (k) { preloadEntry(assetEntry(ts[k])); });
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
    preloadScene(sceneId);
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

  /* ---------- 對話框左側半身像 ---------- */
  var curBustId = null;
  function buildBustImg(e, alt) { /* ART-ADR-001 混合制;高度貼容器,不裁不鏡像 */
    if (!e.layers || !e.layers.length) {
      var img = document.createElement("img");
      img.src = assetUrl(e); img.alt = alt || e.label || e.id;
      return img;
    }
    var wrap = document.createElement("span");
    wrap.style.position = "relative"; wrap.style.display = "inline-block"; wrap.style.height = "100%";
    var base = document.createElement("img");
    base.src = assetUrl(e); base.alt = alt || e.label || e.id;
    base.style.height = "100%"; base.style.width = "auto"; base.style.display = "block";
    wrap.appendChild(base);
    e.layers.forEach(function (L) {
      if (!L.path) return;
      var li = document.createElement("img");
      li.src = ASSETS.basePath + L.path; li.alt = "";
      li.style.position = "absolute";
      li.style.left = (100 * L.anchorX / e.w) + "%";
      li.style.top = (100 * L.anchorY / e.h) + "%";
      li.style.width = (100 * L.w / e.w) + "%";
      li.style.height = "auto";
      wrap.appendChild(li);
    });
    return wrap;
  }
  /* 左右雙肖像槽(Sol 審核 20260720):站位由 assets.speakerSide 決定(依原圖朝向,永不鏡像);
     旅人=無臉中性剪影,站對手相反側,按側選圖(travelerSilhouette 資料);
     發言者亮/對方暗;旁白系統=雙暗;預設開啟,?travelerBust=0 一鍵撤回(A/B)。 */
  var TRAVELER = { "旅人": 1, "旅人(你)": 1 };
  var travelerOn = true;
  try { travelerOn = !/[?&]travelerBust=0/.test(window.location.search); } catch (e) {}
  var SLOT_ID = { left: "bustLeft", right: "bustRight" };
  var slotEntry = { left: null, right: null };
  var npcSide = null;
  function otherSide(s) { return s === "left" ? "right" : "left"; }
  function sideOf(speaker) {
    var m = ASSETS && ASSETS.speakerSide;
    return (m && m[speaker]) || "right";
  }
  function fillSlot(side, entry, alt, masked) {
    var box = $(SLOT_ID[side]);
    if (slotEntry[side] !== entry.id) {
      slotEntry[side] = entry.id;
      box.innerHTML = "";
      box.appendChild(buildBustImg(entry, alt));
    }
    box.classList.toggle("masked", !!masked);
    $("dialogue").classList.add(side === "left" ? "has-l" : "has-r");
  }
  function clearSlot(side) {
    slotEntry[side] = null;
    $(SLOT_ID[side]).innerHTML = "";
    $("dialogue").classList.remove(side === "left" ? "has-l" : "has-r");
  }
  function setLit(side) { /* side="left"|"right"|"none":發言側亮,其餘暗 */
    ["left", "right"].forEach(function (s) {
      var b = $(SLOT_ID[s]);
      b.classList.toggle("lit", s === side);
      b.classList.toggle("dim", s !== side);
    });
    $("dialogue").setAttribute("data-active", side);
  }
  function ensureTraveler() { /* 旅人剪影站對手相反側;無對手時預設左 */
    if (!travelerOn) return null;
    var side = npcSide ? otherSide(npcSide) : "left";
    var map = ASSETS && ASSETS.travelerSilhouette;
    var e = map ? assetEntry(map[side]) : null;
    if (!e) return null;
    fillSlot(side, e, "旅人", false);
    return side;
  }
  function lineOverride(speaker, text) { /* 台詞級表情覆寫(資料驅動;Sol:用未上場表情,不重複生圖) */
    var rules = ASSETS && ASSETS.lineDialoguePortrait;
    if (!rules || !text) return null;
    for (var i = 0; i < rules.length; i++) {
      var r = rules[i];
      if (r.scene === curSceneId && r.speaker === speaker && text.indexOf(r.match) >= 0)
        return assetEntry(r.asset);
    }
    return null;
  }
  function setBust(speaker, cls, text) {
    if (cls === "stage" || cls === "system") { setLit("none"); return; } /* 旁白/系統:雙暗,不指定發言者 */
    if (TRAVELER[speaker] || cls === "player") {
      var tside = ensureTraveler();
      setLit(tside || "none"); /* 撤回剪影時=舊行為:對手壓暗 */
      return;
    }
    /* NPC:四層解析(台詞覆寫→場景覆寫→對話預設→舊筆記頭像遮罩;年代由資料層+測試保證) */
    var entry = lineOverride(speaker, text), masked = false;
    if (!entry && ASSETS && ASSETS.sceneDialoguePortrait && ASSETS.sceneDialoguePortrait[curSceneId])
      entry = assetEntry(ASSETS.sceneDialoguePortrait[curSceneId][speaker]);
    if (!entry && ASSETS && ASSETS.speakerDialoguePortrait)
      entry = assetEntry(ASSETS.speakerDialoguePortrait[speaker]);
    if (!entry && ASSETS && ASSETS.speakerPortrait) {
      entry = assetEntry(ASSETS.speakerPortrait[speaker]);
      masked = !!entry;
    }
    if (!entry) { setLit("none"); return; } /* 無圖角色:不假裝,雙暗 */
    var side = sideOf(speaker);
    if (npcSide && npcSide !== side) clearSlot(npcSide); /* 對手換側:舊側清場 */
    npcSide = side;
    fillSlot(side, entry, speaker, masked);
    if (travelerOn) ensureTraveler(); else clearSlot(otherSide(side));
    setLit(side);
  }

  /* ---------- 打字機:分頁+標點停頓 ---------- */
  var queue = [], pages = [], pageIdx = 0, curPage = "", pos = 0;
  var typing = false, waiting = false, timer = null, paused = false;
  function syncFlags() {
    var active = typing || waiting || queue.length > 0;
    body.classList.toggle("held", active);
    body.classList.toggle("queue-active", active);
  }
  function charDelay(ch) {
    if (LONG_P.indexOf(ch) >= 0) return TYPE_MS + PAUSE_LONG;
    if (SHORT_P.indexOf(ch) >= 0) return TYPE_MS + PAUSE_SHORT;
    return TYPE_MS;
  }
  /* 以容器實寬估每行字數,超過約三行則分頁(斷點優先找標點;jsdom/未布局時不分頁) */
  function paginate(text) {
    var tx = $("dlgText");
    var w = tx.clientWidth, fs = parseFloat(getComputedStyle(tx).fontSize);
    if (!w || !fs || w < fs * 4) return [text];
    var cpl = Math.max(8, Math.floor(w / fs));
    var budget = cpl * 3;
    if (text.length <= budget) return [text];
    var out = [], rest = text, PUNCT = LONG_P + SHORT_P;
    while (rest.length > budget) {
      var cut = -1;
      for (var i = budget; i >= Math.floor(budget * 0.55); i--) {
        if (PUNCT.indexOf(rest.charAt(i - 1)) >= 0) { cut = i; break; }
      }
      if (cut < 0) cut = budget;
      out.push(rest.slice(0, cut));
      rest = rest.slice(cut);
    }
    if (rest) out.push(rest);
    return out;
  }
  function showCue(on) { $("dlgCue").style.display = on ? "" : "none"; }
  function pageDone() {
    typing = false;
    if (pageIdx < pages.length - 1) { waiting = true; showCue(true); }
    else if (queue.length) { waiting = true; showCue(true); }
    else { waiting = false; showCue(false); }
    syncFlags();
  }
  function step() {
    if (paused) return;
    pos++;
    $("dlgText").textContent = curPage.slice(0, pos);
    if (pos >= curPage.length) { pageDone(); return; }
    timer = setTimeout(step, charDelay(curPage.charAt(pos - 1)));
  }
  var curInstantMode = false;
  function startPage(instant) {
    curPage = pages[pageIdx];
    showCue(false);
    var tx = $("dlgText");
    if (curInstantMode || instant || reduced) {
      tx.style.animation = "none"; void tx.offsetWidth; tx.style.animation = "";
      tx.textContent = curPage;
      typing = false;
      pageDone();
      return;
    }
    tx.textContent = ""; pos = 0; typing = true; syncFlags();
    timer = setTimeout(step, TYPE_MS);
  }
  function startLine(item, instant) {
    var np = $("nameplate");
    var isNarr = item.cls === "stage", isSys = item.cls === "system";
    var showName = item.speaker && !isNarr && !isSys;
    np.style.display = showName ? "" : "none";
    np.textContent = showName ? item.speaker : "";
    /* 誰在說話・雙線索:旅人=靛藍名牌+對手立繪壓暗;角色=棕名牌+立繪亮(色彩外仍有文字+明暗) */
    np.className = (TRAVELER[item.speaker] || item.cls === "player") ? "np-player" : "";
    var gainHit = isSys && /^(取得證據|旅人筆記解鎖|E\d)/.test(item.text);
    $("dlgText").className = isNarr ? "narr"
      : (isSys ? ("sys" + (gainHit ? " gain" : ""))
      : (item.cls === "player" ? "pl" : ""));
    if (gainHit && !instant) { /* 戰利品時刻:脈動+雙音(SFX 於檔尾定義,事件觸發時必已就緒) */
      SFX.chime();
      var dl = $("dialogue");
      dl.classList.remove("fx-gain"); void dl.offsetWidth; dl.classList.add("fx-gain");
    }
    setBust(item.speaker, item.cls, item.text);
    pages = paginate(item.text);
    curInstantMode = isNarr || isSys; /* 旁白/系統:整頁淡入不逐字 */
    if (instant) { pageIdx = pages.length - 1; startPage(true); return; } /* 讀檔即顯:直接停最後一頁 */
    pageIdx = 0;
    startPage(false);
  }
  function next() { waiting = false; startLine(queue.shift()); }
  function enqueue(item) {
    queue.push(item);
    syncFlags();
    if (!typing && !waiting) next();
  }
  function pauseTyping() { paused = true; if (timer) clearTimeout(timer); }
  function resumeTyping() { if (!paused) return; paused = false; if (typing) timer = setTimeout(step, TYPE_MS); }
  /* 回傳 true=本次輸入已被表現層消化(跳完本頁或翻下一頁/句) */
  function advanceIntent() {
    if (typing) {
      if (timer) clearTimeout(timer);
      $("dlgText").textContent = curPage;
      typing = false;
      pageDone();
      return true;
    }
    if (waiting) {
      waiting = false;
      if (pageIdx < pages.length - 1) { pageIdx++; startPage(false); }
      else if (queue.length) { next(); }
      else { syncFlags(); }
      return true;
    }
    return false;
  }
  /* 句子顯示完畢+閒置:Enter/Space/點擊觸發唯一「繼續」 */
  function idleAdvance() {
    if (!$("notebook").hidden) return false;
    var view = body.getAttribute("data-view");
    if (view !== "narration" && view !== "end") return false;
    var btns = $("controls").querySelectorAll("button");
    if (btns.length === 1) { btns[0].click(); return true; }
    return false;
  }

  /* ---------- 事件訂閱 ---------- */
  document.addEventListener("bd:scene", function (ev) { setScene(ev.detail.sceneId); });
  var lastReplay = null;
  document.addEventListener("bd:line", function (ev) {
    var d = ev.detail;
    if (d.replay) { lastReplay = d; return; } /* 回放進筆記(chapter-ui 寫入 #log),不重演 */
    /* A-2 讀屏主線:永不隱藏的 sr-only log,每個完整邏輯句播一次「講者:全文」,不隨打字機洗版 */
    $("srLine").textContent =
      (d.speaker && d.cls !== "stage" && d.cls !== "system" ? d.speaker + ":" : "") + d.text;
    enqueue(d);
  });
  var needKickoff = false;
  document.addEventListener("bd:view", function (ev) {
    var d = ev.detail, view;
    if (d.type === "embed") view = (d.system === "incline") ? "lab" : "debate";
    else if (d.type === "review" || d.type === "histfacts" || d.type === "choice" || d.type === "end") view = d.type;
    else view = "narration";
    body.setAttribute("data-view", view);
    if (needKickoff && view === "narration" && $("prologueCard").hidden) {
      /* 全新開局:題詞卡收掉後,代玩家按一次繼續,首句自動開演 */
      needKickoff = false;
      setTimeout(function () {
        var btns = $("controls").querySelectorAll("button");
        if (btns.length === 1 && !typing && !waiting && !queue.length) btns[0].click();
      }, 0);
    }
    /* 進實驗台確認閘:從敘事/選項流進 embed 時,先停在對話,玩家按「前往」才換場(讀完再走) */
    if (view === "lab" && prevView !== "lab" && (prevView === "narration" || prevView === "choice")) {
      body.classList.add("embarkGate");
      $("btnEmbark").hidden = false;
      setTimeout(function () { if (!body.classList.contains("held")) $("btnEmbark").focus(); }, 30);
    } else if (view === "lab" && !labIntroSeen && !body.classList.contains("embarkGate")) {
      labIntroSeen = true; /* 非閘道路徑(讀檔直落實驗台):照舊直接給備忘卡 */
      setTimeout(showLabIntro, 0);
    }
    if (view !== "lab") { body.classList.remove("embarkGate"); $("btnEmbark").hidden = true; }
    if (view === "debate" && !debIntroSeen) { /* 首次進辯論廳:說服力與規則在這裡自我介紹(just-in-time) */
      debIntroSeen = true;
      setTimeout(function () { $("debIntro").hidden = false; $("btnDebIntroGo").focus(); }, 0);
    }
    prevView = view;
  });
  var prevView = null;
  $("btnEmbark").addEventListener("click", function () {
    body.classList.remove("embarkGate");
    $("btnEmbark").hidden = true;
    if (!labIntroSeen) { labIntroSeen = true; showLabIntro(); }
    else { var b = $("labRun"); if (b) b.focus(); }
  });
  document.addEventListener("bd:start", function () {
    queue = []; pages = []; pageIdx = 0; typing = false; waiting = false; paused = false;
    if (timer) clearTimeout(timer);
    curBustId = null;
    labIntroSeen = false;
    debIntroSeen = false;
    repHinted = false; repPrev = null;
    $("labIntro").hidden = true;
    $("debIntro").hidden = true;
    $("repToast").hidden = true;
    clearSlot("left"); clearSlot("right");
    npcSide = null;
    $("dialogue").setAttribute("data-active", "none");
    $("dlgText").textContent = ""; $("nameplate").style.display = "none";
    closeNotebook(true);
    syncFlags();
    /* 開場語境:讀檔→最後一句即顯(不重播序幕);全新開局→P0-0「螢幕前」cinematic,收場後 kickoff */
    if (lastReplay) {
      $("prologueCard").hidden = true;
      startLine(lastReplay, true); lastReplay = null; needKickoff = false;
    } else {
      needKickoff = true;
      mzShow();
    }
  });

  /* ---------- 序幕 P0-0「螢幕前」(v03 六板,文字直生於圖;00:49 固定入圖,程式不疊可見 UI) ----------
     點擊或 Enter/Space=下一拍;「跳過 ▸」與 Esc=整段跳過(原則 #19);
     地磁風暴=系列電磁線環形伏筆,可神祕者為異常增幅非成因。 */
  var mzBeat = -1, mzTimers = [];
  /* v03 六板(Sol 20260720,文字直生於圖):拍→板映射 n1-n2→1/n3→2/n4-n5→3/n6→4/n7→5/n8-n9→6;
     程式僅交叉淡化+字幕+題詞+無障礙文字——禁再疊可見文章/新聞/通知/游標/動態時鐘(00:49 已入圖) */
  var MZ_PLATE = [1, 1, 2, 3, 3, 4, 5, 6, 6];
  var mzPlateActive = "B", mzPlateCur = 0; /* 首板落 A 槽 */
  function mzSetPlate(n) {
    if (n === mzPlateCur) return;
    mzPlateCur = n;
    var map = ASSETS && ASSETS.prologuePlates;
    var e = map ? assetEntry(map[String(n)]) : null;
    var showEl = $("mzPlate" + (mzPlateActive === "A" ? "B" : "A"));
    var hideEl = $("mzPlate" + mzPlateActive);
    if (!e) { showEl.classList.remove("on"); hideEl.classList.remove("on"); return; }
    showEl.src = assetUrl(e);
    showEl.classList.add("on");
    hideEl.classList.remove("on");
    mzPlateActive = (mzPlateActive === "A" ? "B" : "A");
  }
  function mzSay(t) { $("mzSr").textContent = t; } /* 單一隱藏 live region:只播關鍵內容,通知不逐條搶讀 */
  function mzCap(t) {
    var el = $("mzCaption");
    el.style.animation = "none"; void el.offsetWidth; el.style.animation = "";
    el.textContent = t;
  }
  function mzReset() {
    mzBeat = -1;
    mzTimers.forEach(clearTimeout); mzTimers = [];
    mzPlateCur = 0; mzPlateActive = "B";
    $("mzPlateA").classList.remove("on"); $("mzPlateB").classList.remove("on");
    $("mzSr").textContent = "";
    $("mzTitleLines").hidden = true;
    $("mzCaption").textContent = "";
    $("btnPrologueGo").textContent = "跳過 ▸";
  }
  var MZ = [
    function () { mzCap("深夜,零點四十九分。房間裡,只剩平板的光。"); },
    function () {
      mzCap("文章停在那座斜塔——「那兩顆球,真的落下過嗎?」");
      mzSay("平板畫面:物理史專題,時間零點四十九分。文章標題:比薩斜塔上,他真的丟過那兩顆球嗎?內文:通俗故事常這樣開場:直到伽利略登上斜塔。可那兩顆球,真的落下過嗎?");
    },
    function () {
      mzCap("整面畫面,被突發新聞接管。窗簾縫,滲進第一縷不該有的顏色。");
      mzSay("突發新聞:罕見強烈地磁風暴抵達地球。低緯度地區出現極光,多地通訊異常。監測單位:本次強度遠超預報,異常增幅原因待查。新聞畫面為地球磁層與極光環監測示意圖。");
    },
    function () { mzCap("你抬起頭。新聞裡的事,正在你的窗外發生——極光,在 101 後方炸開。"); },
    function () { mzCap("家電哀鳴。燈,熄了。只剩你,和手裡那塊發光的玻璃。"); },
    function () { mzCap("暗下來的玻璃上,新聞消失了。只剩——那座發著光的斜塔。你的右手,自己抬了起來。"); },
    function () { mzCap("指尖碰到玻璃的瞬間——玻璃,不見了。平板的另一頭,有晨光。"); },
    function () { mzCap("台北被抽走。四百年,從你身邊墜過。風裡有鐘聲,和一句聽不懂的話——像是,義大利語。"); },
    function () { mzCap(""); $("mzTitleLines").hidden = false; $("btnPrologueGo").textContent = "啟程"; }
  ];
  function mzNext() {
    mzBeat++;
    if (mzBeat >= MZ.length) { dismissPrologue(); return; }
    MZ[mzBeat]();
    mzSetPlate(MZ_PLATE[mzBeat]);
  }
  function mzShow() {
    mzReset();
    BGM.play("storm"); /* 序幕:風暴低鳴(手勢解鎖前靜默,首次點擊自動補播) */
    if (ASSETS && ASSETS.prologuePlates) { /* 四板先暖 */
      Object.keys(ASSETS.prologuePlates).forEach(function (k) {
        preloadEntry(assetEntry(ASSETS.prologuePlates[k]));
      });
    }
    $("prologueCard").hidden = false;
    mzNext();
    setTimeout(function () { $("prologueCard").focus(); }, 30);
  }
  function dismissPrologue() {
    if ($("prologueCard").hidden) return;
    mzTimers.forEach(clearTimeout); mzTimers = [];
    $("prologueCard").hidden = true;
    if (needKickoff) { /* 序幕收場才開演 */
      needKickoff = false;
      var btns = $("controls").querySelectorAll("button");
      if (btns.length === 1 && !typing && !waiting && !queue.length) btns[0].click();
    } else { /* 焦點交回舞台可操作控制 */
      setTimeout(function () {
        var b = $("controls").querySelector("button");
        if (b) b.focus(); else $("btnDrawer").focus();
      }, 0);
    }
  }
  $("btnPrologueGo").addEventListener("click", dismissPrologue);
  $("prologueCard").addEventListener("click", function (ev) {
    if (ev.target.closest("button")) return;
    mzNext();
  });

  /* ---------- 辯論備忘卡(首次進辯論廳;? 鈕重看)+信譽首動提示 ---------- */
  var debIntroSeen = false;
  $("btnDebIntroGo").addEventListener("click", function () {
    $("debIntro").hidden = true;
    $("btnDebHelp").focus();
  });
  (function mountDebHelp() {
    var b = document.createElement("button");
    b.id = "btnDebHelp"; b.type = "button";
    b.setAttribute("aria-label", "重看辯論備忘");
    b.textContent = "?";
    b.addEventListener("click", function () { $("debIntro").hidden = false; $("btnDebIntroGo").focus(); });
    $("panelWrap").appendChild(b);
  })();
  /* 量表說明=點/觸碰即顯(hover title 僅桌機加菜;雙線索原則,手機平板不靠懸停) */
  var hudTipTimer = null;
  function showHudTip(text) {
    var tip = $("hudTip");
    tip.textContent = text;
    tip.hidden = false;
    if (hudTipTimer) clearTimeout(hudTipTimer);
    hudTipTimer = setTimeout(function () { tip.hidden = true; }, 7000);
  }
  document.getElementById("hud").addEventListener("click", function (ev) {
    var chip = ev.target.closest(".chip");
    if (!chip || !chip.title) return;
    if (!$("hudTip").hidden && $("hudTip").textContent === chip.title) { $("hudTip").hidden = true; return; }
    showHudTip(chip.title);
  });
  document.getElementById("hud").addEventListener("keydown", function (ev) {
    if (ev.key !== "Enter" && ev.key !== " ") return;
    var chip = ev.target.closest ? ev.target.closest(".chip") : null;
    if (!chip || !chip.title) return;
    ev.preventDefault();
    showHudTip(chip.title);
  });
  var repHinted = false, repPrev = null;
  try {
    new MutationObserver(function () {
      var v = $("repVal").textContent;
      if (repPrev === null) { repPrev = v; return; }
      if (v !== repPrev && !repHinted) { /* 信譽第一次變動:一次性提示(just-in-time,不是開場說明書) */
        repHinted = true;
        $("repToast").hidden = false;
        setTimeout(function () { $("repToast").hidden = true; }, 5000);
      }
      repPrev = v;
    }).observe($("repVal"), { childList: true, characterData: true, subtree: true });
  } catch (e) {}

  /* ---------- 實驗備忘卡(首次進實驗台自動彈;? 鈕可重看)+同配置聚焦 ---------- */
  var labIntroSeen = false;
  function fillLabIntroProps() {
    var box = $("liProps");
    if (!box || box.children.length) return;
    ["prop_water_clock", "prop_ball_groove"].forEach(function (id) {
      var e = assetEntry(id);
      if (!e) return;
      var img = document.createElement("img");
      img.src = assetUrl(e); img.alt = "";
      box.appendChild(img);
    });
  }
  function showLabIntro() {
    fillLabIntroProps();
    $("labIntro").hidden = false;
    $("btnLabIntroGo").focus();
  }
  $("btnLabIntroGo").addEventListener("click", function () {
    $("labIntro").hidden = true;
    $("btnLabHelp").focus();
  });
  $("btnLabHelp").addEventListener("click", function () { showLabIntro(); });
  /* 勾選後視圖聚焦同配置(判定選集本就要求同配置);資料一筆不刪——筆記簿倫理 */
  function applyRunFocus() {
    var tbody = $("labRunsBody");
    if (!tbody) return;
    var rows = Array.prototype.slice.call(tbody.querySelectorAll("tr"));
    var cfgs = [];
    rows.forEach(function (r) {
      if (r.querySelector("input:checked") && r.cells[2]) cfgs.push(r.cells[2].textContent);
    });
    rows.forEach(function (r) {
      var cfg = r.cells[2] ? r.cells[2].textContent : "";
      r.classList.toggle("offconfig", cfgs.length > 0 && cfgs.indexOf(cfg) < 0);
    });
  }
  $("labRunsBody").addEventListener("change", applyRunFocus);
  try { new MutationObserver(applyRunFocus).observe($("labRunsBody"), { childList: true }); } catch (e) {}

  /* ---------- 輸入:點擊與鍵盤 ---------- */
  $("stage").addEventListener("click", function (ev) {
    if (!$("fxJump").hidden) return; /* 幕間蒙太奇:交給 fxJump 自己的快轉 */
    if (!$("notebook").hidden) return;
    if (!$("prologueCard").hidden) return; /* 題詞卡:按「啟程」走,誤點舞台不推進 */
    if (!$("labIntro").hidden) return;
    if (!$("debIntro").hidden) return;
    if (ev.target.closest("button, select, input, textarea, label, a, #panelWrap, #notebook, #title-screen, #hud, #hudTip, #repToast")) return;
    if (advanceIntent()) return;
    idleAdvance();
  });
  document.addEventListener("keydown", function (ev) {
    if (ev.key !== " " && ev.key !== "Enter") return;
    if (!$("fxJump").hidden) { ev.preventDefault(); ev.stopPropagation(); endSceneFx(); return; } /* 蒙太奇:鍵盤也能跳 */
    if (!$("notebook").hidden) return; /* 筆記開啟:不推進(Esc 另管) */
    if (!$("prologueCard").hidden) { /* 序幕:Enter/Space=下一拍;焦點在跳過鈕時交還原生 */
      if (ev.target && ev.target.closest && ev.target.closest("button")) return;
      ev.preventDefault(); ev.stopPropagation();
      mzNext();
      return;
    }
    if (!$("labIntro").hidden) return; /* 備忘卡開啟:交還原生(按鈕 Enter 即關閉) */
    if (!$("debIntro").hidden) return;
    if (typing || waiting) {           /* 演出未完:先消化演出,不觸底層按鈕 */
      ev.preventDefault(); ev.stopPropagation();
      advanceIntent();
      return;
    }
    if (ev.target && ev.target.closest && ev.target.closest("button, select, input, textarea, a")) return; /* 交還原生 */
    if (idleAdvance()) ev.preventDefault();
  }, true);

  /* ---------- 旅人筆記(全畫面筆記本模式) ---------- */
  function stripIds(root) {
    var withId = root.querySelectorAll("[id]");
    for (var i = 0; i < withId.length; i++) withId[i].removeAttribute("id");
  }
  function snapshotLab() { /* 靜態快照:克隆去 id、控件停用——不與實驗台活表格撞 id */
    var snap = $("nbLabSnap");
    var parts = [["run 紀錄", $("labRunsBody")], ["主張紀錄", $("labClaimsBody")]];
    var any = false;
    snap.innerHTML = "";
    parts.forEach(function (p) {
      var tbody = p[1];
      if (!tbody || !tbody.children.length) return;
      any = true;
      var head = document.createElement("p");
      head.style.margin = "8px 0 2px"; head.style.fontWeight = "bold";
      head.textContent = p[0];
      var tbl = tbody.closest("table").cloneNode(true);
      stripIds(tbl);
      var inputs = tbl.querySelectorAll("input");
      for (var i = 0; i < inputs.length; i++) inputs[i].disabled = true;
      var btns = tbl.querySelectorAll("button"); /* 快照共用 grouping:凍結摺疊狀態,不再 clone 無限長全表 */
      for (var j = 0; j < btns.length; j++) btns[j].disabled = true;
      snap.appendChild(head);
      snap.appendChild(tbl);
    });
    if (!any) snap.innerHTML = '<p class="hint" style="color:var(--color-ink-secondary)">(尚無實驗紀錄)</p>';
  }
  function applyNotebookBg() { /* 筆記本底圖:鎖 16:9 貼齊,內容排進紙面安全區(nb-art) */
    var e = assetEntry("bg_notebook");
    if (e) {
      var sheet = $("nbSheet");
      sheet.classList.add("nb-art");
      sheet.style.backgroundImage = "url(" + assetUrl(e) + ")";
      sheet.style.backgroundSize = "100% 100%";
      sheet.style.backgroundPosition = "center";
    }
  }
  /* 證據卡:card_template/S1/S2 當材質底,標題文字一律 HTML 疊加(E1–E5 物理內容不畫死) */
  function renderEvidenceCards() {
    var wrap = $("nbCards");
    if (!wrap) return;
    wrap.innerHTML = "";
    var listText = $("evidenceList").textContent || "";
    if (!listText.trim() || listText.indexOf("尚無") >= 0) return;
    var tpl = assetEntry("card_template");
    listText.split("、").forEach(function (item) {
      item = item.trim();
      if (!item) return;
      var code = item.split(" ")[0];
      var name = item.slice(code.length).trim();
      var bgE = assetEntry("card_" + code) || tpl; /* Batch03:card_<code> 優先,缺圖回退共用底(E2 恆回退+SVG) */
      var card = document.createElement("div");
      card.className = "evcard";
      if (bgE) card.style.backgroundImage = "url(" + assetUrl(bgE) + ")";
      var b = document.createElement("b"); b.textContent = code;
      var s = document.createElement("span"); s.textContent = name;
      card.appendChild(b); card.appendChild(s);
      if (code === "E2") { /* 綁縛悖論示意圖:HTML/SVG 鐵律(點陣不承載物理資訊) */
        card.insertAdjacentHTML("beforeend",
          '<svg viewBox="0 0 200 96" xmlns="http://www.w3.org/2000/svg" aria-label="綁縛悖論示意:大小二石以鏈相繫">' +
          '<circle cx="60" cy="40" r="24" fill="#5a4638"/>' +
          '<circle cx="112" cy="52" r="12" fill="#8a7658"/>' +
          '<path d="M 82 46 Q 92 42 100 49" stroke="#241b16" stroke-width="3" fill="none" stroke-dasharray="4 3"/>' +
          '<text x="60" y="80" font-size="11" text-anchor="middle" fill="#241b16">重石</text>' +
          '<text x="112" y="80" font-size="11" text-anchor="middle" fill="#241b16">輕石</text>' +
          '<text x="158" y="34" font-size="11" fill="#8a4f14">拖慢它?</text>' +
          '<text x="158" y="58" font-size="11" fill="#244a63">合體更快?</text>' +
          '<path d="M 150 30 L 128 42" stroke="#8a4f14" stroke-width="1.5" fill="none"/>' +
          '<path d="M 150 54 L 130 54" stroke="#244a63" stroke-width="1.5" fill="none"/>' +
          "</svg>");
      }
      wrap.appendChild(card);
    });
  }
  /* 器材圖:實驗台主視覺(水鐘+銅球木槽);辯論面板角落《物理學》評注本。 */
  function mountDecor() {
    var strip = document.createElement("div");
    strip.id = "labProps";
    [["prop_water_clock", "水鐘與天平"], ["prop_ball_groove", "斜槽、銅球與墊木"]].forEach(function (p) {
      var e = assetEntry(p[0]);
      if (!e) return;
      var fig = document.createElement("figure");
      var img = document.createElement("img");
      img.src = assetUrl(e); img.alt = p[1]; img.loading = "lazy";
      var cap = document.createElement("figcaption");
      cap.textContent = p[1];
      fig.appendChild(img); fig.appendChild(cap); strip.appendChild(fig);
    });
    if (strip.children.length) {
      var host = $("benchProps") || $("lab"); /* 工作桌構件區(B-2:器材上主舞台) */
      host.appendChild(strip);
    }
    var tome = assetEntry("prop_physics_tome");
    if (tome) {
      var t = document.createElement("img");
      t.id = "tomeDecor"; t.src = assetUrl(tome); t.alt = ""; t.setAttribute("aria-hidden", "true");
      $("panelWrap").insertBefore(t, $("panelWrap").firstChild);
    }
    var hb = assetEntry("histfacts_banner"); /* Batch03:史實頁橫幅(傳說→查證→實驗) */
    if (hb) {
      var bimg = document.createElement("img");
      bimg.id = "histBanner"; bimg.src = assetUrl(hb); bimg.alt = ""; bimg.setAttribute("aria-hidden", "true");
      $("panelWrap").insertBefore(bimg, $("panelWrap").firstChild);
    }
    var tbg = assetEntry("title_background"); /* Batch03:標題主視覺(中央 34% 暗部留給 titleCard) */
    if (tbg) {
      var ts = $("title-screen");
      ts.classList.add("title-art");
      ts.style.backgroundImage = "url(" + assetUrl(tbg) + ")";
    }
  }
  mountDecor();
  function openNotebook() {
    snapshotLab();
    renderEvidenceCards();
    applyNotebookBg();
    $("notebook").hidden = false;
    $("btnDrawer").setAttribute("aria-expanded", "true");
    pauseTyping();
    var log = $("log"); log.scrollTop = log.scrollHeight;
    $("btnDrawerClose").focus();
  }
  function closeNotebook(silent) {
    if ($("notebook").hidden) return;
    $("notebook").hidden = true;
    $("btnDrawer").setAttribute("aria-expanded", "false");
    resumeTyping();
    if (!silent) $("btnDrawer").focus(); /* 焦點歸還 */
  }
  $("btnDrawer").addEventListener("click", function () {
    if ($("notebook").hidden) openNotebook(); else closeNotebook();
  });
  $("btnDrawerClose").addEventListener("click", function () { closeNotebook(); });
  document.addEventListener("keydown", function (ev) {
    if (ev.key !== "Escape") return;
    if (!$("fxJump").hidden) { ev.preventDefault(); endSceneFx(); return; }
    if (!$("notebook").hidden) { ev.preventDefault(); closeNotebook(); return; }
    if (!$("prologueCard").hidden) { ev.preventDefault(); dismissPrologue(); return; }
    if (!$("labIntro").hidden) { ev.preventDefault(); $("labIntro").hidden = true; $("btnLabHelp").focus(); return; }
    if (!$("debIntro").hidden) { ev.preventDefault(); $("debIntro").hidden = true; $("btnDebHelp").focus(); }
  });
  document.addEventListener("focusin", function (ev) { /* 焦點不得逃出 modal(筆記+序幕皆圍欄) */
    var nb = $("notebook");
    if (!nb.hidden && !nb.contains(ev.target)) { $("btnDrawerClose").focus(); return; }
    var pc = $("prologueCard");
    if (!pc.hidden && !pc.contains(ev.target)) pc.focus();
  });
  function selectTab(which) {
    $("notebook").setAttribute("data-tab", which);
    $("nbTabEvidence").setAttribute("aria-selected", which === "evidence" ? "true" : "false");
    $("nbTabLog").setAttribute("aria-selected", which === "log" ? "true" : "false");
  }
  $("nbTabEvidence").addEventListener("click", function () { selectTab("evidence"); });
  $("nbTabLog").addEventListener("click", function () { selectTab("log"); });

  /* ==================== 體感層(總監 20260720:全開) ====================
     音效=Web Audio 合成(零資產;BGM 掛點留待音訊分工裁決);偏好存 sessionStorage(非存檔);
     斜面動畫=bd:run 重播(等時距×遞增距離,點擊跳完,reduced 直出結果幀);
     時間跳躍=sceneFx 資料驅動,僅活戲;支柱破裂=bd:debate 差分;取得證據=脈動+雙音。 */
  var SFX = (function () {
    var ctx = null, on = true;
    try { on = (sessionStorage.getItem("bd_sfx") || "on") === "on"; } catch (e) {}
    function ac() {
      if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
      return ctx;
    }
    function tone(freq, dur, type, gain) {
      if (!on) return;
      var c = ac(); if (!c) return;
      var o = c.createOscillator(), g = c.createGain();
      o.type = type || "sine"; o.frequency.value = freq;
      g.gain.setValueAtTime(gain || 0.08, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
      o.connect(g); g.connect(c.destination);
      o.start(); o.stop(c.currentTime + dur);
    }
    return {
      toggle: function () { on = !on; try { sessionStorage.setItem("bd_sfx", on ? "on" : "off"); } catch (e) {} return on; },
      isOn: function () { return on; },
      ctx: ac,
      drop: function () { tone(840, 0.05, "sine", 0.035); },
      blip: function () { tone(660, 0.05, "square", 0.03); },
      chime: function () { tone(880, 0.22, "sine", 0.06); setTimeout(function () { tone(1318, 0.3, "sine", 0.05); }, 90); },
      thud: function () { tone(88, 0.35, "sine", 0.2); tone(55, 0.5, "sine", 0.12); },
      paper: function () { /* 紙頁掠過/落定:一次短促帶通噪音 */
        if (!on) return;
        var c = ac(); if (!c) return;
        var b = c.createBuffer(1, c.sampleRate * 0.16, c.sampleRate), d = b.getChannelData(0);
        for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) * 0.3;
        var s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter();
        f.type = "bandpass"; f.frequency.value = 2600; g.gain.value = 0.1;
        s.buffer = b; s.connect(f); f.connect(g); g.connect(c.destination); s.start();
      },
      whoosh: function () {
        if (!on) return;
        var c = ac(); if (!c) return;
        var b = c.createBuffer(1, c.sampleRate * 0.9, c.sampleRate), d = b.getChannelData(0);
        for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) * 0.25;
        var s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter();
        f.type = "lowpass"; f.frequency.value = 520; g.gain.value = 0.22;
        s.buffer = b; s.connect(f); f.connect(g); g.connect(c.destination); s.start();
      }
    };
  })();
  /* ---------- 程序化環境音樂(BGM):Web Audio 即席合成,零資產零版權 ----------
     音訊分工裁決(總監 20260720):v1=程式合成;真實錄音/生成音樂=未來選項(掛點相容)。
     每個 mood=低音 drone+調式撥弦(隨機稀疏)+環境噪音層;場景切換交叉淡入;非確定性=氛圍非 fixture。 */
  var BGM = (function () {
    var cur = null, master = null, layers = [], timers = [];
    /* 撥弦層已停用(總監試玩:合成撥弦=丁丁丁風鈴,出戲)——只留鋪底 drone+環境噪音+辯論脈搏;
       真音樂(Gemini 生成/bgmFiles)落地即整組讓位。pluckMs:null=不排撥弦。 */
    var MOODS = {
      storm:    { drone: [55, 82.5],     scale: [],  gain: 0.05,  pluckMs: null, noise: "rumble" },
      pisa:     { drone: [110, 165],     scale: [],  gain: 0.05,  pluckMs: null, noise: null },
      study:    { drone: [98, 147],      scale: [],  gain: 0.045, pluckMs: null, noise: null },
      rain:     { drone: [87.3, 130.8],  scale: [],  gain: 0.05,  pluckMs: null, noise: "rain" },
      workshop: { drone: [103.8, 155.6], scale: [],  gain: 0.05,  pluckMs: null, noise: "drip" },
      hall:     { drone: [73.4, 110],    scale: [],  gain: 0.055, pluckMs: null, noise: null, pulse: true },
      dusk:     { drone: [130.8, 196],   scale: [],  gain: 0.04,  pluckMs: null, noise: null }
    };
    function noiseBuf(c, secs) {
      var b = c.createBuffer(1, c.sampleRate * secs, c.sampleRate), d = b.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      return b;
    }
    function stopAll(fade) {
      timers.forEach(clearTimeout); timers = [];
      var c = SFX.ctx();
      if (master && c) {
        var m = master;
        try { m.gain.setTargetAtTime(0.0001, c.currentTime, fade ? 0.5 : 0.05); } catch (e) {}
        setTimeout(function () { try { m.disconnect(); } catch (e) {} }, 1400);
      }
      layers.forEach(function (n) { try { if (n.stop) n.stop(c ? c.currentTime + 1.3 : 0); } catch (e) {} });
      layers = []; master = null;
    }
    function pluck(c, freq, M) {
      if (!master) return;
      [0, 3].forEach(function (detune) {
        var o = c.createOscillator(), g = c.createGain();
        o.type = "triangle"; o.frequency.value = freq; o.detune.value = detune;
        g.gain.setValueAtTime(0.22, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 1.1);
        o.connect(g); g.connect(master);
        o.start(); o.stop(c.currentTime + 1.2);
      });
    }
    /* 真音樂檔模式:bgmFiles[mood] 有檔名→HTMLAudio 循環+交叉淡入;無檔→程序化合成 fallback */
    var fileCur = null, fileTimer = null;
    function stopFile(fast) {
      if (fileTimer) { clearInterval(fileTimer); fileTimer = null; }
      if (!fileCur) return;
      var a = fileCur; fileCur = null;
      var t = setInterval(function () {
        a.volume = Math.max(0, a.volume - (fast ? 0.08 : 0.02));
        if (a.volume <= 0.01) { clearInterval(t); a.pause(); }
      }, 60);
    }
    function playFile(url) {
      stopAll(false); stopFile(false);
      var a = new Audio(url);
      a.loop = true; a.volume = 0;
      var p = a.play();
      if (p && p.catch) p.catch(function () {}); /* 手勢前被擋:unlockAudio 會 refresh 補播 */
      fileCur = a;
      fileTimer = setInterval(function () {
        if (!fileCur) return;
        fileCur.volume = Math.min(0.24, fileCur.volume + 0.015);
        if (fileCur.volume >= 0.24) { clearInterval(fileTimer); fileTimer = null; }
      }, 60);
    }
    function play(mood) {
      cur = mood;
      if (!SFX.isOn()) return;
      var files = ASSETS && ASSETS.bgmFiles;
      if (files && files[mood]) { playFile(ASSETS.audioBasePath + files[mood]); return; }
      stopFile(false);
      var c = SFX.ctx(); if (!c) return;
      try { if (c.state === "suspended") c.resume(); } catch (e) {}
      stopAll(true);
      cur = mood;
      var M = MOODS[mood]; if (!M) return;
      master = c.createGain();
      master.gain.setValueAtTime(0.0001, c.currentTime);
      master.gain.setTargetAtTime(M.gain, c.currentTime, 1.2);
      master.connect(c.destination);
      M.drone.forEach(function (f, i) {
        var o = c.createOscillator(), g = c.createGain();
        o.type = "sine"; o.frequency.value = f; g.gain.value = i ? 0.5 : 0.8;
        o.connect(g); g.connect(master); o.start(); layers.push(o);
      });
      if (M.noise) {
        var s = c.createBufferSource(), f2 = c.createBiquadFilter(), g2 = c.createGain();
        s.buffer = noiseBuf(c, 2); s.loop = true;
        f2.type = "lowpass";
        f2.frequency.value = M.noise === "rain" ? 900 : (M.noise === "rumble" ? 170 : 500);
        g2.gain.value = M.noise === "rain" ? 0.5 : 0.3;
        s.connect(f2); f2.connect(g2); g2.connect(master);
        s.start(); layers.push(s);
        if (M.noise === "drip") (function drip() { /* 低頻悶滴,稀疏——不再是丁 */
          timers.push(setTimeout(function () {
            if (!master) return;
            var o = c.createOscillator(), g = c.createGain();
            o.type = "sine"; o.frequency.value = 620 + Math.random() * 180;
            g.gain.setValueAtTime(0.045, c.currentTime);
            g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.12);
            o.connect(g); g.connect(master); o.start(); o.stop(c.currentTime + 0.13);
            drip();
          }, 7000 + Math.random() * 7000));
        })();
      }
      if (M.pulse) (function beat() { /* 辯論廳:55Hz 低頻脈搏,緊張感的物理學 */
        timers.push(setTimeout(function () {
          if (!master) return;
          var o = c.createOscillator(), g = c.createGain();
          o.type = "sine"; o.frequency.value = 55;
          g.gain.setValueAtTime(0.5, c.currentTime);
          g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.28);
          o.connect(g); g.connect(master); o.start(); o.stop(c.currentTime + 0.3);
          beat();
        }, 1150));
      })();
      if (M.pluckMs && M.scale.length) (function stroll() { /* 撥弦漫步(現停用;真曲進場前不再排) */
        timers.push(setTimeout(function () {
          if (!master) return;
          pluck(c, M.scale[Math.floor(Math.random() * M.scale.length)], M);
          stroll();
        }, M.pluckMs[0] + Math.random() * (M.pluckMs[1] - M.pluckMs[0])));
      })();
    }
    return {
      play: play,
      stop: function (fade) { stopAll(fade); stopFile(true); },
      current: function () { return cur; },
      refresh: function () { if (cur) play(cur); }
    };
  })();
  function syncSfxBtn() {
    $("btnSfx").textContent = "聲音:" + (SFX.isOn() ? "開" : "關");
    $("btnSfx").setAttribute("aria-pressed", SFX.isOn() ? "true" : "false");
  }
  $("btnSfx").addEventListener("click", function () {
    var on = SFX.toggle();
    syncSfxBtn();
    if (on) BGM.refresh(); else BGM.stop(false);
  });
  syncSfxBtn();
  function unlockAudioOnce() { /* 首次手勢(滑鼠或鍵盤皆可,B-3):解鎖 AudioContext,補播當前 mood */
    document.removeEventListener("pointerdown", unlockAudioOnce);
    document.removeEventListener("keydown", unlockAudioOnce);
    var c = SFX.ctx();
    try { if (c && c.state === "suspended") c.resume(); } catch (e) {}
    BGM.refresh();
  }
  document.addEventListener("pointerdown", unlockAudioOnce);
  document.addEventListener("keydown", unlockAudioOnce);
  document.addEventListener("visibilitychange", function () { /* 背景頁暫停/回前景恢復 */
    if (document.hidden) BGM.stop(false); else BGM.refresh();
  });
  document.addEventListener("bd:scene", function (ev) { /* 場景→mood(資料驅動),同 mood 不重啟 */
    var map = ASSETS && ASSETS.sceneBgm;
    var mood = map && map[ev.detail.sceneId];
    if (mood && mood !== BGM.current()) BGM.play(mood);
  });

  /* ---------- 斜面滾球重播(bd:run) ---------- */
  var animRaf = null, animSkip = null;
  function ensureLabAnim() {
    var el = $("labAnim");
    if (el) return el;
    el = document.createElement("div");
    el.id = "labAnim";
    el.setAttribute("role", "img");
    el.setAttribute("aria-label", "斜面滾球重播動畫(數據以紀錄簿為準)");
    el.title = "點擊跳過重播";
    var slot = $("labAnimSlot");
    if (slot) slot.appendChild(el); else $("lab").insertBefore(el, $("labMsg"));
    el.addEventListener("click", function () { if (animSkip) animSkip(); });
    return el;
  }
  var INCLINE_DEG = { "緩": 12, "中": 20, "陡": 30 };
  document.addEventListener("bd:run", function (ev) {
    var run = ev.detail.run;
    if (!run || !run.readings) return;
    var el = ensureLabAnim();
    el.classList.add("on");
    if (animRaf) cancelAnimationFrame(animRaf);
    var deg = INCLINE_DEG[run.config.incline] || 20;
    var W = 640, H = 150, x0 = 30, y0 = 26;
    var rad = deg * Math.PI / 180;
    var trackLen = (W - 70) / Math.cos(rad);
    if (y0 + trackLen * Math.sin(rad) > H - 18) trackLen = (H - 18 - y0) / Math.sin(rad);
    var cum = [], t = 0;
    run.readings.forEach(function (v) { t += v; cum.push(t); });
    var total = cum[cum.length - 1];
    function pt(dist) {
      var l = trackLen * (dist / total);
      return [x0 + l * Math.cos(rad), y0 + l * Math.sin(rad)];
    }
    var svg = ['<svg viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg">'];
    var pEnd = pt(total);
    svg.push('<line x1="' + x0 + '" y1="' + y0 + '" x2="' + pEnd[0] + '" y2="' + pEnd[1] + '" stroke="#5a4638" stroke-width="6" stroke-linecap="round"/>');
    cum.forEach(function (c, i) {
      var p = pt(c);
      svg.push('<line x1="' + p[0] + '" y1="' + (p[1] - 9) + '" x2="' + p[0] + '" y2="' + (p[1] + 9) + '" stroke="#7a4b2a" stroke-width="2" id="tick' + i + '" opacity="0.25"/>');
      svg.push('<text x="' + p[0] + '" y="' + (p[1] + 24) + '" font-size="12" text-anchor="middle" fill="#5a4638" id="lbl' + i + '" opacity="0">第' + (i + 1) + "段 " + run.readings[i].toFixed(1) + "</text>");
    });
    svg.push('<text x="' + (W - 8) + '" y="16" font-size="12" text-anchor="end" fill="#8a4f14">重播:' + run.config.ball + "・" + run.config.incline + "・" + run.config.timer + "(點擊跳過)</text>");
    svg.push('<circle id="ballDot" cx="' + x0 + '" cy="' + (y0 - 8) + '" r="9" fill="#7a4b2a" stroke="#241b16" stroke-width="1.5"/>');
    svg.push("</svg>");
    el.innerHTML = svg.join("");
    var ball = el.querySelector("#ballDot");
    var SEG_MS = 800, segs = run.readings.length;
    function showSeg(i) {
      var tk = el.querySelector("#tick" + i), lb = el.querySelector("#lbl" + i);
      if (tk) tk.setAttribute("opacity", "1");
      if (lb) lb.setAttribute("opacity", "1");
      if (run.config.timer === "水鐘") SFX.drop(); else SFX.blip();
    }
    function finish() {
      if (animRaf) cancelAnimationFrame(animRaf);
      animRaf = null; animSkip = null;
      var p = pt(total);
      ball.setAttribute("cx", p[0]); ball.setAttribute("cy", p[1] - 8);
      for (var i = 0; i < segs; i++) {
        var tk = el.querySelector("#tick" + i), lb = el.querySelector("#lbl" + i);
        if (tk) tk.setAttribute("opacity", "1");
        if (lb) lb.setAttribute("opacity", "1");
      }
    }
    animSkip = finish;
    if (reduced) { finish(); return; }
    var start = null, shown = {};
    function step(ts) {
      if (start === null) start = ts;
      var el2 = ts - start;
      var seg = Math.min(Math.floor(el2 / SEG_MS), segs - 1);
      var frac = Math.min((el2 - seg * SEG_MS) / SEG_MS, 1);
      var d0 = seg === 0 ? 0 : cum[seg - 1];
      var dist = d0 + (cum[seg] - d0) * frac;
      var p = pt(dist);
      ball.setAttribute("cx", p[0]); ball.setAttribute("cy", p[1] - 8);
      for (var i = 0; i < segs; i++) {
        if (!shown[i] && el2 >= (i + 1) * SEG_MS) { shown[i] = true; showSeg(i); }
      }
      if (el2 < segs * SEG_MS) animRaf = requestAnimationFrame(step);
      else finish();
    }
    animRaf = requestAnimationFrame(step);
  });

  /* ---------- 時間跳躍(sceneFx,僅活戲) ---------- */
  var liveStarted = false;
  document.addEventListener("bd:start", function () { liveStarted = true; });
  /* 三板偽影片(Sol 交接 §2 節奏表):0-0.65 板1/0.65-1.2 溶板2/停/1.8-2.55 溶板3/停穩/3.15-3.4 收。
     年份=四個劇情里程碑 HTML 淡換(1592/1597/1602/1603),不逐年計數。
     音三拍:板2 現身=紙頁掠過;兩地溶接=低沉氣流;板3 落定=柔和紙面聲。 */
  var fxTimers = [], fxClosing = false;
  function fxYearShow(y) {
    var el = $("fxYear");
    el.style.animation = "none"; void el.offsetWidth; el.style.animation = "";
    el.textContent = String(y);
  }
  function fxPlateShow(slot, entryId) {
    var e = assetEntry(entryId);
    if (!e) return false;
    var showEl = $(slot === "A" ? "fxPlateA" : "fxPlateB");
    var hideEl = $(slot === "A" ? "fxPlateB" : "fxPlateA");
    showEl.src = assetUrl(e);
    showEl.classList.add("on");
    hideEl.classList.remove("on");
    return true;
  }
  function fxClear() {
    fxTimers.forEach(clearTimeout); fxTimers = [];
    $("fxPlateA").classList.remove("on"); $("fxPlateB").classList.remove("on");
    fxClosing = false;
  }
  function endSceneFx() { /* 跳過=直達板3+1603,短停後離開(單次完成,同既有跳過規則) */
    if ($("fxJump").hidden || fxClosing) return;
    fxClosing = true;
    fxTimers.forEach(clearTimeout); fxTimers = [];
    var fx = ASSETS.sceneFx["INT-1"];
    var years = (fx && fx.years) || [];
    var plates = (fx && fx.plates) || [];
    if (plates.length) fxPlateShow("A", plates[plates.length - 1]);
    if (years.length) fxYearShow(years[years.length - 1]);
    fxTimers.push(setTimeout(function () {
      $("fxJump").hidden = true;
      fxClear();
      resumeTyping();
    }, 700));
  }
  function playSceneFx(sceneId) {
    var fx = ASSETS && ASSETS.sceneFx && ASSETS.sceneFx[sceneId];
    if (!fx || fx.fx !== "timejump" || !liveStarted || !$("prologueCard").hidden) return;
    var box = $("fxJump");
    var years = fx.years || [], plates = fx.plates || [];
    (plates || []).forEach(function (id) { preloadEntry(assetEntry(id)); });
    box.hidden = false;
    fxClear();
    pauseTyping(); /* 蒙太奇播放時,台詞停一拍——動畫管情緒,台詞管答案 */
    var hasArt = plates.length === 3 && !!assetEntry(plates[0]);
    if (reduced || !hasArt) { /* 減少動態或無資產:落頁板(或素底)+末年份,約 700ms */
      if (hasArt) fxPlateShow("A", plates[2]);
      if (years.length) fxYearShow(years[years.length - 1]);
      fxTimers.push(setTimeout(function () {
        $("fxJump").hidden = true; fxClear(); resumeTyping();
      }, 900));
      return;
    }
    fxPlateShow("A", plates[0]); fxYearShow(years[0]);                     /* 0s 板1・1592 */
    fxTimers.push(setTimeout(function () {
      fxPlateShow("B", plates[1]); fxYearShow(years[1]); SFX.paper();     /* 0.65s 溶板2・1597・紙頁掠過 */
    }, 650));
    fxTimers.push(setTimeout(function () { fxYearShow(years[2]); }, 1200)); /* 1.2s 板2 停留・1602 */
    fxTimers.push(setTimeout(function () {
      fxPlateShow("A", plates[2]); fxYearShow(years[3]); SFX.whoosh();    /* 1.8s 溶板3・1603・低沉氣流 */
    }, 1800));
    fxTimers.push(setTimeout(function () { SFX.paper(); }, 2550));         /* 2.55s 板3 落定・紙面聲 */
    fxTimers.push(setTimeout(function () {
      $("fxJump").hidden = true; fxClear(); resumeTyping();                /* 3.15-3.4s 收,露出帕多瓦 */
    }, 3400));
  }
  $("fxJump").addEventListener("click", endSceneFx); /* 點擊快轉(原則 #19:演出永遠可跳) */
  var lastFxScene = null; /* 蒙太奇只在「場景切換」那一刻放一次——bd:scene 每句都廣播,不去重會逐句重播 */
  document.addEventListener("bd:scene", function (ev) {
    var sid = ev.detail.sceneId;
    if (sid === lastFxScene) return;
    lastFxScene = sid;
    playSceneFx(sid);
  });

  /* ---------- 支柱破裂(bd:debate 差分) ---------- */
  var prevBroken = {};
  document.addEventListener("bd:debate", function (ev) {
    var d = ev.detail, hit = false;
    (d.broken || []).forEach(function (id) { if (!prevBroken[id]) { prevBroken[id] = true; hit = true; } });
    if (!hit) return;
    SFX.thud();
    var p = $("panelWrap");
    p.classList.remove("fx-shake"); void p.offsetWidth; p.classList.add("fx-shake");
  });
  document.addEventListener("bd:start", function () { prevBroken = {}; });
})();
