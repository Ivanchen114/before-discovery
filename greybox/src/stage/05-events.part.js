  /* ---------- 事件訂閱 ---------- */
  document.addEventListener("bd:scene", function (ev) { setScene(ev.detail.sceneId); });
  document.addEventListener("bd:evidence", function (ev) {
    var d = ev.detail || {};
    showEvidenceFocus(d.code, d.name || "新證據", d.visualKey, d.overlay, d.disposition);
    /* 實驗引擎直接入卷、沒有取得台詞時，也要和有台詞的證據得到同一套視聽回饋。 */
    playEvidenceGain($("sceneFocus"));
  });
  var lastReplay = null;
  document.addEventListener("bd:line", function (ev) {
    var d = normalizeTravelerLine(ev.detail);
    if (d.replay) { lastReplay = d; return; } /* 回放進筆記(chapter-ui 寫入 #log),不重演 */
    /* A-2 讀屏主線:永不隱藏的 sr-only log,每個完整邏輯句播一次「講者:全文」,不隨打字機洗版 */
    $("srLine").textContent =
      (d.speaker && d.cls !== "stage" && d.cls !== "system"
        ? travelerVoiceAccessibleName(d.speaker, d.cls) + "：" : "") + displayText(d.text);
    enqueue(d);
  });
  var needKickoff = false;
  function kickoffStoryFromExplicitTransition() {
    if (!needKickoff) return false;
    var btns = $("controls").querySelectorAll("button");
    if (btns.length !== 1 || typing || waiting || queue.length) return false;
    needKickoff = false;
    btns[0].click();
    return true;
  }
  /* 沒有轉場資產的未來章節仍可由玩家自己按控制列開始；一旦親手操作，就取消待啟動旗標。 */
  $("controls").addEventListener("click", function () { if (needKickoff) needKickoff = false; }, true);
  document.addEventListener("bd:view", function (ev) {
    var d = ev.detail, view;
    if (d.type === "embed") view = d.system === "ship" ? "ship"
      : (d.system === "orbit" ? "orbit"
      : ((d.system === "incline" || d.system === "catapult" || d.system === "collision" || d.system === "heat" || d.system === "em1") ? "lab" : "debate"));
    else if (d.type === "review" || d.type === "histfacts" || d.type === "choice" || d.type === "end") view = d.type;
    else view = "narration";
    body.setAttribute("data-view", view);
    /* K2 地心判讀同時保留左側來源紙；手機橫屏只替這一拍收窄選項，
       不犧牲其他場景的選項寬度，也不把焦點圖縮到無法判讀。 */
    body.classList.toggle("choice-focus-split",
      CHAPTER_ID === "ch4" && d.scene === "D1-2" && d.nodeId === "c_center_reason");
    /* 互動選項不是台詞事件：操作前的裝置圖、判讀前的結果圖要由節點主動叫回。
       讀檔直接落在選項時也成立，不依賴玩家曾經看過前一行台詞。 */
    showFocusVisualForView(d.scene, d.nodeId);
    /* 紙上推演也可以需要「先看物件、再作判斷」，不必為了三份來源紙
       硬升成完整工作台。配置 triggerNode 的踏查會在該選項前攔一次；
       讀檔直落同一節點仍會補看，完成後才把焦點交回玩家的判斷。 */
    var storySurvey = apparatusBriefing(d.scene);
    if (storySurvey && storySurvey.triggerNode === d.nodeId &&
        !apparatusSurveySeen[apparatusBriefingKey(d.scene)] && !apparatusSurveyActive) {
      setTimeout(function () {
        if (apparatusSurveyActive || apparatusSurveySeen[apparatusBriefingKey(d.scene)]) return;
        showApparatusSurvey(d.scene, function () {
          var firstChoice = $("controls").querySelector("button");
          if (firstChoice) firstChoice.focus({ preventScroll: true });
        });
      }, 0);
    }
    if (view === "end") { /* 終幕預告卡(GB-ADR-013):戲劇卡+角落系統行,只在真結局亮 */
      var nc = $("nextCard");
      if (nc.hidden) {
        var nextBtn = $("ncNextBtn");
        var currentMeta = window.GB.ChapterRegistry.byId(CHAPTER_ID);
        var nextMeta = window.GB.ChapterRegistry.nextOf(CHAPTER_ID);
        var card = currentMeta.endCard || {};
        var nextHref = nextMeta ? "stage.html?chapter=" + nextMeta.route : null;
        nc.querySelector(".ncSealed").textContent = currentMeta.label + "《" + currentMeta.title + "》——已封存";
        nc.querySelector(".ncNext").textContent = card.nextLabel || (nextMeta ? "下一章" : "旅程暫歇");
        nc.querySelector(".ncTitle").textContent = card.nextTitle || (nextMeta ? nextMeta.title : "返回旅程目錄");
        nc.querySelector(".ncHook").textContent = card.hook || "這一頁已封存；下一個問題仍在等候登錄。";
        nc.querySelector(".ncSys").textContent = nextMeta
          ? nextMeta.label + "現已開放。" + currentMeta.label + "進度與筆記已封存於這台裝置。"
          : currentMeta.label + "進度與筆記已封存於這台裝置。";
        nextBtn.textContent = nextMeta ? "進入" + nextMeta.label : "";
        nextBtn.hidden = !nextHref;
        nextBtn.onclick = nextHref ? function () { location.href = nextHref; } : null;
        nc.hidden = false;
        requestAnimationFrame(function () { nc.classList.add("on"); });
        $("ncTitleBtn").onclick = function () { location.href = "stage.html"; };
        setTimeout(function () { try { (nextHref ? nextBtn : $("ncTitleBtn")).focus(); } catch (e) {} }, 950);
      }
    }
    /* 全新章節的第一句不在 bd:view 自動代按；只由序章「啟程」或蒙太奇「進入故事」的
       明確玩家操作呼叫 kickoffStoryFromExplicitTransition。 */
    /* 大型互動轉場確認閘：主實驗首次進場、信譽修復、首次辯論。
       A2-3/e2/e3c 是同一工作階段的連續任務，不重複把玩家趕出再請進來。 */
    var fromStory = prevView === "narration" || prevView === "choice";
    var gateLab = (view === "lab" || view === "ship" || view === "orbit") && fromStory &&
      ((d.scene === "A2-2" && d.nodeId === "e1") ||
       (d.scene === "B2-3" && d.nodeId === "e1") ||
       (d.scene === "C1-1" && d.nodeId === "e1") ||
       (d.scene === "H0-3" && d.nodeId === "e1") ||
       (d.scene === "E1-2" && d.nodeId === "lab1") ||
       /* D1-1/e1 的 K0 封存刻意維持短操作；第四章大型工作台轉場
          放在 D1-2/e1 的同尺紙，避免切線紙剛封好就被整章備忘蓋住。 */
       (d.scene === "D1-2" && d.nodeId === "e1") ||
       (d.scene === "EM7-2" && d.nodeId === "e_matrix") ||
       d.scene === "SC-R1" || d.scene === "SC6-R1" || d.scene === "SC7-R1");
    var gateDebate = view === "debate" && fromStory && !debIntroSeen;
    if (gateLab || gateDebate) {
      pendingEmbarkView = view;
      pendingEmbarkScene = d.scene || null;
      body.classList.add("embarkGate");
      $("btnEmbark").textContent = gateDebate ? "▸ 步入辯論會"
        : ((d.scene === "SC-R1" || d.scene === "SC6-R1" || d.scene === "SC7-R1") ? "▸ 把原紙放回桌上"
        : (CHAPTER_ID === "ch7" ? "▸ 攤開複驗矩陣"
        : (CHAPTER_ID === "ch6" ? "▸ 攤開四種來源的帳"
        : (CHAPTER_ID === "ch5" ? "▸ 攤開兩本帳"
        : (CHAPTER_ID === "ch4" ? "▸ 攤開兩張紙開始對帳"
        : (CHAPTER_ID === "ch3" ? "▸ 登上實驗船" : (CHAPTER_ID === "ch2" ? "▸ 走進彈射工坊" : "▸ 前往實驗台")))))));
      $("btnEmbark").hidden = false;
      syncFlags();
    } else if ((view === "lab" || view === "ship" || view === "orbit") && !labIntroSeen && !body.classList.contains("embarkGate")) {
      labIntroSeen = true;
      /* 第四章的長備忘改為 ? 查閱；讀檔回到眼前這張紙，不再先被整章規則蓋住。 */
      /* 第三章續讀時直接回到卷宗，不重播教學備忘；只有從劇情第一次
         交棒進實驗台時才顯示。 */
      if (CHAPTER_ID !== "ch4" && !(CHAPTER_ID === "ch3" && !fromStory)) {
        setTimeout(showLabIntro, 0);
      }
    }
    if (view !== "lab" && view !== "ship" && view !== "orbit" && view !== "debate") {
      pendingEmbarkView = null; pendingEmbarkScene = null; pendingIntermissionToken = null;
      body.classList.remove("embarkGate"); body.classList.remove("workbenchIntermission");
      $("btnEmbark").hidden = true;
      $("intermissionChoices").hidden = true;
      $("intermissionChoices").innerHTML = "";
    }
    if (view === "debate" && !debIntroSeen && !body.classList.contains("embarkGate")) { /* 讀檔直落辯論 */
      debIntroSeen = true;
      setTimeout(function () { $("debIntro").hidden = false; $("btnDebIntroGo").focus(); }, 0);
    }
    prevView = view;
  });
  var prevView = null, pendingEmbarkView = null, pendingEmbarkScene = null;
  var pendingIntermissionToken = null;
  function clearWorkbenchIntermission() {
    pendingIntermissionToken = null;
    body.classList.remove("workbenchIntermission");
    $("intermissionChoices").hidden = true;
    $("intermissionChoices").innerHTML = "";
  }
  /* 同一個 embed 內的敘事接縫：暫時收起工作台，讓人物對話和研究決定
     發生在舞台上；玩家明確按下一步後才回到工作台。 */
  document.addEventListener("bd:workbench-intermission", function (event) {
    var d = event.detail || {};
    var choices = Array.isArray(d.choices) ? d.choices : [];
    pendingEmbarkView = d.view || body.getAttribute("data-view") || null;
    pendingEmbarkScene = d.scene || null;
    pendingIntermissionToken = d.token || null;
    body.classList.add("embarkGate");
    body.classList.add("workbenchIntermission");
    $("btnEmbark").textContent = d.label || "▸ 進入下一階段";
    $("btnEmbark").hidden = choices.length > 0;
    var tray = $("intermissionChoices");
    tray.innerHTML = "";
    tray.hidden = choices.length === 0;
    choices.forEach(function (choice) {
      var button = document.createElement("button");
      button.type = "button";
      button.textContent = choice.label;
      if (choice.ariaLabel) button.setAttribute("aria-label", choice.ariaLabel);
      button.addEventListener("click", function () {
        document.dispatchEvent(new CustomEvent("bd:workbench-intermission-choice", {
          detail: { token: pendingIntermissionToken, choice: choice.id }
        }));
      });
      tray.appendChild(button);
    });
    syncFlags();
  });
  $("btnEmbark").addEventListener("click", function () {
    var target = pendingEmbarkView;
    var targetScene = pendingEmbarkScene;
    var intermissionToken = pendingIntermissionToken;
    pendingEmbarkView = null;
    pendingEmbarkScene = null;
    clearWorkbenchIntermission();
    body.classList.remove("embarkGate");
    $("btnEmbark").hidden = true;
    if (target === "debate") {
      if (!debIntroSeen) { debIntroSeen = true; $("debIntro").hidden = false; $("btnDebIntroGo").focus(); }
      else { var db = $("controls").querySelector("button"); if (db) db.focus(); }
    } else if (CHAPTER_ID === "ch4" && targetScene === "D1-2") {
      /* 第四章先讓玩家接住牛頓眼前的問題；六條整章備忘留在 ?，不再充當開場。 */
      labIntroSeen = true;
      var ch4First = $("controls").querySelector("button, select");
      if (ch4First) ch4First.focus();
    } else if (
      targetScene &&
      apparatusBriefing(targetScene) &&
      !apparatusSurveySeen[apparatusBriefingKey(targetScene)]
    ) {
      /* 首次進主實驗先做器材踏查；踏查本身取代自動彈出的長備忘卡，? 仍可重看。 */
      showApparatusSurvey(targetScene, function () {
        labIntroSeen = true;
        var b = CHAPTER_ID === "ch1" ? $("labRun") : $("controls").querySelector("button");
        if (b) b.focus({ preventScroll: true });
      });
    } else if (!labIntroSeen) { labIntroSeen = true; showLabIntro(); }
    else {
      var b = CHAPTER_ID === "ch1" ? $("labRun") : $("controls").querySelector("button");
      if (b) b.focus();
    }
    /* WB-CR-025b：讓工作台表現層在玩家親手跨過閘門、完成焦點交接後，
       才播放入場教練句；bd:line 會再把焦點交給對話框的 ack。 */
    document.dispatchEvent(new CustomEvent("bd:embark", {
      detail: { view: target, scene: targetScene, intermission: intermissionToken }
    }));
  });
  document.addEventListener("bd:start", function () {
    queue = []; pages = []; pageIdx = 0; typing = false; waiting = false; paused = false; ackPending = false;
    currentLineYieldToken = null;
    if (timer) clearTimeout(timer);
    curBustId = null;
    labIntroSeen = false;
    debIntroSeen = false;
    pendingEmbarkView = null;
    pendingEmbarkScene = null;
    clearWorkbenchIntermission();
    body.classList.remove("embarkGate");
    $("btnEmbark").hidden = true;
    apparatusSurveySeen = {}; apparatusSurveyActive = null; apparatusSurveyDone = null;
    repPrev = null;
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
