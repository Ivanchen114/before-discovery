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
  function setBust(speaker, cls) {
    if (cls === "stage" || cls === "system") { setLit("none"); return; } /* 旁白/系統:雙暗,不指定發言者 */
    if (TRAVELER[speaker] || cls === "player") {
      var tside = ensureTraveler();
      setLit(tside || "none"); /* 撤回剪影時=舊行為:對手壓暗 */
      return;
    }
    /* NPC:三層解析(場景覆寫→對話預設→舊筆記頭像遮罩;年代由場景層+測試保證) */
    var entry = null, masked = false;
    if (ASSETS && ASSETS.sceneDialoguePortrait && ASSETS.sceneDialoguePortrait[curSceneId])
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
    $("dlgText").className = isNarr ? "narr"
      : (isSys ? ("sys" + (/^(取得證據|旅人筆記解鎖|E\d)/.test(item.text) ? " gain" : ""))
      : (item.cls === "player" ? "pl" : ""));
    setBust(item.speaker, item.cls);
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
    if (view === "lab" && !labIntroSeen) { /* 首次上實驗台:先給備忘卡,緩住「跳太快」 */
      labIntroSeen = true;
      setTimeout(showLabIntro, 0);
    }
  });
  document.addEventListener("bd:start", function () {
    queue = []; pages = []; pageIdx = 0; typing = false; waiting = false; paused = false;
    if (timer) clearTimeout(timer);
    curBustId = null;
    labIntroSeen = false;
    $("labIntro").hidden = true;
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

  /* ---------- 序幕 P0-0「螢幕前」(A 案 cinematic;劇本草案 04_劇本/…P0-0…20260720,總監核) ----------
     真實時鐘=玩家系統時間;裝置感知:滑鼠=游標自移/觸控=頁面自捲;點擊或 Enter/Space=下一拍;
     「跳過 ▸」與 Esc=整段跳過(原則 #19 演出永遠可跳);電磁風暴=系列電磁線環形伏筆,不解釋成因。 */
  var mzBeat = -1, mzTimers = [];
  var mzCoarse = false;
  try { mzCoarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches; } catch (e) {}
  function mzClass(c, on) { $("prologueCard").classList.toggle(c, on); }
  /* 四連板(Sol 20260720):拍→板映射;交叉淡化雙 img;無資產=退純 CSS 景(灰盒 fallback) */
  var MZ_PLATE = [1, 1, 1, 1, 2, 2, 3, 4, 4];
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
    ["aurora", "reach", "whiteout", "cursorMove", "scrolled", "bare"].forEach(function (c) { mzClass(c, false); });
    mzPlateCur = 0; mzPlateActive = "B";
    $("mzPlateA").classList.remove("on"); $("mzPlateB").classList.remove("on");
    $("mzSr").textContent = "";
    $("mzPush").hidden = true;
    $("mzCursor").hidden = true;
    $("mzNotifs").innerHTML = "";
    $("mzTitleLines").hidden = true;
    $("mzCaption").textContent = "";
    $("btnPrologueGo").textContent = "跳過 ▸";
    var d = new Date();
    $("mzClock").textContent = ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
  }
  var MZ = [
    function () { mzCap("深夜。房間裡只有螢幕的光。"); },
    function () {
      mzCap("你在讀一篇文章,停在那座斜塔的插圖上。");
      mzSay("文章標題:比薩斜塔上,他真的丟過那兩顆球嗎?內文:通俗故事常這樣開場——亞里斯多德錯了一千九百年,直到伽利略登上斜塔。可那兩顆球,真的落下過嗎?");
    },
    function () {
      $("mzPush").hidden = false;
      mzCap("一則突發推播,跳了出來。");
      mzSay("突發推播:罕見強烈地磁風暴抵達地球——低緯度地區出現極光,多地通訊異常。監測單位表示:本次強度遠超預報,異常增幅原因待查。");
    },
    function () {
      if (mzCoarse) { mzClass("scrolled", true); mzCap("頁面自己,往下捲了一行。又一行。像有誰替你讀。"); }
      else { $("mzCursor").hidden = false; setTimeout(function () { mzClass("cursorMove", true); }, 60);
             mzCap("游標——在你沒有碰它的情況下——慢慢地,移向那座斜塔。"); }
    },
    function () { mzClass("aurora", true); mzCap("窗簾縫隙滲進顏色。綠的,紫的。不該出現在這個緯度的顏色。"); },
    function () {
      mzCap("通知一則接一則彈出,又消失,快得像有人在替你翻頁。");
      ["通訊異常", "極光警報:低緯度", "GPS 訊號中斷", "航班大面積延誤", "(無法載入)"].forEach(function (t, i) {
        mzTimers.push(setTimeout(function () {
          var n = document.createElement("div");
          n.className = "mzn"; n.textContent = t;
          $("mzNotifs").appendChild(n);
        }, 180 * (i + 1)));
      });
    },
    function () { mzClass("bare", true); mzCap("你伸手去關螢幕。指尖碰到玻璃的瞬間——玻璃,不見了。"); },
    function () { mzClass("whiteout", true); mzCap("白光。墜落感。風裡有鐘聲,和一句聽不懂的話——像是,義大利語。"); },
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
    if (!$("notebook").hidden) return;
    if (!$("prologueCard").hidden) return; /* 題詞卡:按「啟程」走,誤點舞台不推進 */
    if (!$("labIntro").hidden) return;
    if (ev.target.closest("button, select, input, textarea, label, a, #panelWrap, #notebook, #title-screen")) return;
    if (advanceIntent()) return;
    idleAdvance();
  });
  document.addEventListener("keydown", function (ev) {
    if (ev.key !== " " && ev.key !== "Enter") return;
    if (!$("notebook").hidden) return; /* 筆記開啟:不推進(Esc 另管) */
    if (!$("prologueCard").hidden) { /* 序幕:Enter/Space=下一拍;焦點在跳過鈕時交還原生 */
      if (ev.target && ev.target.closest && ev.target.closest("button")) return;
      ev.preventDefault(); ev.stopPropagation();
      mzNext();
      return;
    }
    if (!$("labIntro").hidden) return; /* 備忘卡開啟:交還原生(按鈕 Enter 即關閉) */
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
  function applyNotebookBg() { /* notebookBackground 資產掛點:Sol 交底圖(id=bg_notebook)即生效 */
    var e = assetEntry("bg_notebook");
    if (e) {
      var sheet = $("nbSheet");
      sheet.style.backgroundImage = "url(" + assetUrl(e) + ")";
      sheet.style.backgroundSize = "cover";
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
      var bgE = (code === "S1") ? (assetEntry("card_S1") || tpl)
              : (code === "S2") ? (assetEntry("card_S2") || tpl)
              : tpl;
      var card = document.createElement("div");
      card.className = "evcard";
      if (bgE) card.style.backgroundImage = "url(" + assetUrl(bgE) + ")";
      var b = document.createElement("b"); b.textContent = code;
      var s = document.createElement("span"); s.textContent = name;
      card.appendChild(b); card.appendChild(s);
      wrap.appendChild(card);
    });
  }
  /* 器材圖:實驗台上緣裝飾條(水鐘+銅球木槽);辯論面板角落《物理學》評注本——皆裝飾層,aria-hidden */
  function mountDecor() {
    var strip = document.createElement("div");
    strip.id = "labProps"; strip.setAttribute("aria-hidden", "true");
    [["prop_water_clock", "水鐘"], ["prop_ball_groove", "銅球與木槽"]].forEach(function (p) {
      var e = assetEntry(p[0]);
      if (!e) return;
      var img = document.createElement("img");
      img.src = assetUrl(e); img.alt = ""; img.loading = "lazy";
      strip.appendChild(img);
    });
    if (strip.children.length) $("lab").insertBefore(strip, $("lab").firstChild);
    var tome = assetEntry("prop_physics_tome");
    if (tome) {
      var t = document.createElement("img");
      t.id = "tomeDecor"; t.src = assetUrl(tome); t.alt = ""; t.setAttribute("aria-hidden", "true");
      $("panelWrap").insertBefore(t, $("panelWrap").firstChild);
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
    if (!$("notebook").hidden) { ev.preventDefault(); closeNotebook(); return; }
    if (!$("prologueCard").hidden) { ev.preventDefault(); dismissPrologue(); return; }
    if (!$("labIntro").hidden) { ev.preventDefault(); $("labIntro").hidden = true; $("btnLabHelp").focus(); }
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
})();
