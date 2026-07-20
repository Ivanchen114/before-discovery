  /* ---------- 事件訂閱 ---------- */
  document.addEventListener("bd:scene", function (ev) { setScene(ev.detail.sceneId); });
  var lastReplay = null;
  document.addEventListener("bd:line", function (ev) {
    var d = ev.detail;
    if (d.replay) { lastReplay = d; return; } /* 回放進筆記(chapter-ui 寫入 #log),不重演 */
    /* A-2 讀屏主線:永不隱藏的 sr-only log,每個完整邏輯句播一次「講者:全文」,不隨打字機洗版 */
    $("srLine").textContent =
      (d.speaker && d.cls !== "stage" && d.cls !== "system" ? displayText(d.speaker) + "：" : "") + displayText(d.text);
    enqueue(d);
  });
  var needKickoff = false;
  document.addEventListener("bd:view", function (ev) {
    var d = ev.detail, view;
    if (d.type === "embed") view = (d.system === "incline") ? "lab" : "debate";
    else if (d.type === "review" || d.type === "histfacts" || d.type === "choice" || d.type === "end") view = d.type;
    else view = "narration";
    body.setAttribute("data-view", view);
    if (view === "end") { /* 終幕預告卡(GB-ADR-013):戲劇卡+角落系統行,只在真結局亮 */
      var nc = $("nextCard");
      if (nc.hidden) {
        nc.hidden = false;
        requestAnimationFrame(function () { nc.classList.add("on"); });
        $("ncTitleBtn").onclick = function () { location.reload(); };
        setTimeout(function () { try { $("ncTitleBtn").focus(); } catch (e) {} }, 950);
      }
    }
    if (needKickoff && view === "narration" && $("prologueCard").hidden) {
      /* 全新開局:題詞卡收掉後,代玩家按一次繼續,首句自動開演 */
      needKickoff = false;
      setTimeout(function () {
        var btns = $("controls").querySelectorAll("button");
        if (btns.length === 1 && !typing && !waiting && !queue.length) btns[0].click();
      }, 0);
    }
    /* 大型互動轉場確認閘：主實驗首次進場、信譽修復、首次辯論。
       A2-3/e2/e3c 是同一工作階段的連續任務，不重複把玩家趕出再請進來。 */
    var fromStory = prevView === "narration" || prevView === "choice";
    var gateLab = view === "lab" && fromStory &&
      (d.scene === "A2-2" || d.scene === "SC-R1");
    var gateDebate = view === "debate" && fromStory && !debIntroSeen;
    if (gateLab || gateDebate) {
      pendingEmbarkView = view;
      body.classList.add("embarkGate");
      $("btnEmbark").textContent = gateDebate ? "▸ 步入辯論會"
        : (d.scene === "SC-R1" ? "▸ 用一筆乾淨紀錄道歉" : "▸ 前往實驗台");
      $("btnEmbark").hidden = false;
      syncFlags();
    } else if (view === "lab" && !labIntroSeen && !body.classList.contains("embarkGate")) {
      labIntroSeen = true; /* 非閘道路徑(讀檔直落實驗台):照舊直接給備忘卡 */
      setTimeout(showLabIntro, 0);
    }
    if (view !== "lab" && view !== "debate") {
      pendingEmbarkView = null; body.classList.remove("embarkGate"); $("btnEmbark").hidden = true;
    }
    if (view === "debate" && !debIntroSeen && !body.classList.contains("embarkGate")) { /* 讀檔直落辯論 */
      debIntroSeen = true;
      setTimeout(function () { $("debIntro").hidden = false; $("btnDebIntroGo").focus(); }, 0);
    }
    prevView = view;
  });
  var prevView = null, pendingEmbarkView = null;
  $("btnEmbark").addEventListener("click", function () {
    var target = pendingEmbarkView;
    pendingEmbarkView = null;
    body.classList.remove("embarkGate");
    $("btnEmbark").hidden = true;
    if (target === "debate") {
      if (!debIntroSeen) { debIntroSeen = true; $("debIntro").hidden = false; $("btnDebIntroGo").focus(); }
      else { var db = $("controls").querySelector("button"); if (db) db.focus(); }
    } else if (!labIntroSeen) { labIntroSeen = true; showLabIntro(); }
    else { var b = $("labRun"); if (b) b.focus(); }
  });
  document.addEventListener("bd:start", function () {
    queue = []; pages = []; pageIdx = 0; typing = false; waiting = false; paused = false; ackPending = false;
    if (timer) clearTimeout(timer);
    curBustId = null;
    labIntroSeen = false;
    debIntroSeen = false;
    pendingEmbarkView = null;
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
