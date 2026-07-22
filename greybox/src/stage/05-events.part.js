  /* ---------- 事件訂閱 ---------- */
  document.addEventListener("bd:scene", function (ev) { setScene(ev.detail.sceneId); });
  document.addEventListener("bd:evidence", function (ev) {
    var d = ev.detail || {};
    showEvidenceFocus(d.code, d.name || "新證據");
  });
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
    if (d.type === "embed") view = d.system === "ship" ? "ship" : ((d.system === "incline" || d.system === "catapult") ? "lab" : "debate");
    else if (d.type === "review" || d.type === "histfacts" || d.type === "choice" || d.type === "end") view = d.type;
    else view = "narration";
    body.setAttribute("data-view", view);
    if (view === "end") { /* 終幕預告卡(GB-ADR-013):戲劇卡+角落系統行,只在真結局亮 */
      var nc = $("nextCard");
      if (nc.hidden) {
        if (CHAPTER_ID === "ch2") {
          nc.querySelector(".ncSealed").textContent = "第二章《第一寸的弧線》——已封存";
          nc.querySelector(".ncNext").textContent = "旅程將繼續";
          nc.querySelector(".ncTitle").textContent = "下一頁，仍未寫定";
          nc.querySelector(".ncHook").textContent = "你已讓兩種運動在同一條墨線上相遇。物理史還有更多看似理所當然的答案，等著重新取得證據。";
          nc.querySelector(".ncSys").textContent = "第二章進度與筆記已封存於這台裝置。你可回到系列首頁重玩任一章，或匯出旅人書信碼。";
        } else if (CHAPTER_ID === "ch3") {
          nc.querySelector(".ncSealed").textContent = "第三章《船艙裡的靜止》——已封存";
          nc.querySelector(".ncNext").textContent = "旅程將繼續";
          nc.querySelector(".ncTitle").textContent = "下一頁，仍未寫定";
          nc.querySelector(".ncHook").textContent = "你已讓船上與岸上的兩條路彼此相認。下一次，世界將不只改變位置，還會改變速度。";
          nc.querySelector(".ncSys").textContent = "第三章進度與筆記已封存於這台裝置。";
        }
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
    var gateLab = (view === "lab" || view === "ship") && fromStory &&
      ((d.scene === "A2-2" && d.nodeId === "e1") ||
       (d.scene === "B2-3" && d.nodeId === "e1") ||
       (d.scene === "C1-1" && d.nodeId === "e1") || d.scene === "SC-R1");
    var gateDebate = view === "debate" && fromStory && !debIntroSeen;
    if (gateLab || gateDebate) {
      pendingEmbarkView = view;
      pendingEmbarkScene = d.scene || null;
      body.classList.add("embarkGate");
      $("btnEmbark").textContent = gateDebate ? "▸ 步入辯論會"
        : (d.scene === "SC-R1" ? "▸ 用一筆乾淨紀錄道歉"
        : (CHAPTER_ID === "ch3" ? "▸ 登上實驗船" : (CHAPTER_ID === "ch2" ? "▸ 走進彈射工坊" : "▸ 前往實驗台")));
      $("btnEmbark").hidden = false;
      syncFlags();
    } else if ((view === "lab" || view === "ship") && !labIntroSeen && !body.classList.contains("embarkGate")) {
      labIntroSeen = true; /* 非閘道路徑(讀檔直落實驗台):照舊直接給備忘卡 */
      setTimeout(showLabIntro, 0);
    }
    if (view !== "lab" && view !== "ship" && view !== "debate") {
      pendingEmbarkView = null; pendingEmbarkScene = null; body.classList.remove("embarkGate"); $("btnEmbark").hidden = true;
    }
    if (view === "debate" && !debIntroSeen && !body.classList.contains("embarkGate")) { /* 讀檔直落辯論 */
      debIntroSeen = true;
      setTimeout(function () { $("debIntro").hidden = false; $("btnDebIntroGo").focus(); }, 0);
    }
    prevView = view;
  });
  var prevView = null, pendingEmbarkView = null, pendingEmbarkScene = null;
  $("btnEmbark").addEventListener("click", function () {
    var target = pendingEmbarkView;
    var targetScene = pendingEmbarkScene;
    pendingEmbarkView = null;
    pendingEmbarkScene = null;
    body.classList.remove("embarkGate");
    $("btnEmbark").hidden = true;
    if (target === "debate") {
      if (!debIntroSeen) { debIntroSeen = true; $("debIntro").hidden = false; $("btnDebIntroGo").focus(); }
      else { var db = $("controls").querySelector("button"); if (db) db.focus(); }
    } else if (targetScene && apparatusBriefing(targetScene) && !apparatusSurveySeen[apparatusBriefingKey(targetScene)]) {
      /* 首次進主實驗先做器材踏查；踏查本身取代自動彈出的長備忘卡，? 仍可重看。 */
      showApparatusSurvey(targetScene, function () {
        labIntroSeen = true;
        var b = CHAPTER_ID === "ch1" ? $("labRun") : $("controls").querySelector("button");
        if (b) b.focus();
      });
    } else if (!labIntroSeen) { labIntroSeen = true; showLabIntro(); }
    else {
      var b = CHAPTER_ID === "ch1" ? $("labRun") : $("controls").querySelector("button");
      if (b) b.focus();
    }
  });
  document.addEventListener("bd:start", function () {
    queue = []; pages = []; pageIdx = 0; typing = false; waiting = false; paused = false; ackPending = false;
    if (timer) clearTimeout(timer);
    curBustId = null;
    labIntroSeen = false;
    debIntroSeen = false;
    pendingEmbarkView = null;
    pendingEmbarkScene = null;
    apparatusSurveySeen = {}; apparatusSurveyActive = null; apparatusSurveyDone = null;
    repHinted = false; repPrev = null;
    lastLineScene = null;
    $("labIntro").hidden = true;
    $("apparatusSurvey").hidden = true;
    $("debIntro").hidden = true;
    $("repToast").hidden = true;
    clearFocusVisual();
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
    } else if (CHAPTER_ID !== "ch1") {
      /* 現代穿越只演一次：從系列首頁直接進後續章節，不重播第一章序幕。 */
      $("prologueCard").hidden = true;
      needKickoff = true;
    } else {
      needKickoff = true;
      mzShow();
    }
  });
