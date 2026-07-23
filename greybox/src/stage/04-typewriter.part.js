  /* ---------- 打字機:分頁+標點停頓 ---------- */
  var queue = [], pages = [], pageIdx = 0, curPage = "", pos = 0;
  var typing = false, waiting = false, timer = null, paused = false;
  /* 收隊確認:在對話框會讓位的視圖(辯論/實驗台等),最後一句演完先亮 ▼ 等玩家點掉——
     打字完成≠讀完(總監實玩)。narration 視圖對話框常駐,不需確認。 */
  var ackPending = false;
  var lastLineScene = null;
  /* 任何會讓對話框退場、把畫面交給大型互動的視圖，都必須等玩家親手收掉最後一句。
     ship 曾漏列，造成第三章台詞一播完就自動切進航船實驗。 */
  var YIELD_VIEWS = { debate: 1, lab: 1, ship: 1, orbit: 1, review: 1, histfacts: 1 };
  function syncFlags() {
    var active = typing || waiting || queue.length > 0 || ackPending;
    body.classList.toggle("held", active);
    body.classList.toggle("queue-active", active);
    /* 對話真正播完才把鍵盤焦點交給轉場鈕；不得只在進場瞬間猜一次時機。 */
    if (!active && body.classList.contains("embarkGate") && !$("btnEmbark").hidden) {
      setTimeout(function () {
        if (!body.classList.contains("held") && body.classList.contains("embarkGate")) $("btnEmbark").focus();
      }, 0);
    }
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
    else if (YIELD_VIEWS[body.getAttribute("data-view")]) {
      waiting = false; ackPending = true; showCue(true); /* 讀完自己點,對話框才讓位 */
    }
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
    /* 特寫跟「玩家此刻真的看到的台詞」同步，不跟尚未播放的事件佇列搶跑。 */
    if (item.scene && item.scene !== lastLineScene) {
      clearFocusVisual();
      lastLineScene = item.scene;
    }
    showFocusVisualForLine(item.text, item.scene);
    /* 取得圖必須等這句真正開演，且等同一次操作的換場完成後再入鏡。
       否則圖會在事件佇列時搶跑，緊接著被 setScene 清掉。 */
    if (item.evidence && item.evidence.length) {
      setTimeout(function () { showEvidenceFocusList(item.evidence); }, 0);
    }
    var np = $("nameplate");
    var isNarr = item.cls === "stage", isSys = item.cls === "system";
    var showName = item.speaker && !isNarr && !isSys;
    np.style.display = showName ? "" : "none";
    np.textContent = showName ? (TEXT ? TEXT.normalizeZhPunctuation(item.speaker) : item.speaker) : "";
    /* 誰在說話・雙線索:旅人=靛藍名牌+對手立繪壓暗;角色=棕名牌+立繪亮(色彩外仍有文字+明暗) */
    np.className = (TRAVELER[item.speaker] || item.cls === "player") ? "np-player" : "";
    $("dialogue").dataset.speaker = item.speaker || ""; /* 字體三聲部:CSS 據此讓「旅人筆記」句用手寫楷體 */
    var gainHit = isSys && /^(取得(?:證據| [A-Z]\d)|旅人筆記解鎖|E\d)/.test(item.text);
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
    if (ackPending) { /* 收隊確認:點掉最後一句,對話框讓位給面板 */
      ackPending = false;
      showCue(false);
      syncFlags();
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
