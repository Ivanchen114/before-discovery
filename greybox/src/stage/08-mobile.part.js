  /* ---------- 輸入:點擊與鍵盤 ---------- */
  $("stage").addEventListener("click", function (ev) {
    if (!$("fxJump").hidden) return; /* 幕間蒙太奇:整張畫面自己接手逐幕點擊 */
    if (!$("notebook").hidden) return;
    if (!$("prologueCard").hidden) return; /* 題詞卡:按「啟程」走,誤點舞台不推進 */
    if (!$("apparatusSurvey").hidden) return;
    if (!$("labIntro").hidden) return;
    if (!$("debIntro").hidden) return;
    if (ev.target.closest("button, select, input, textarea, label, a, #panelWrap, #notebook, #title-screen, #hud, #hudTip, #repToast, #nextCard")) return;
    if (advanceIntent()) return;
    idleAdvance();
  });
  document.addEventListener("keydown", function (ev) {
    if (ev.key !== " " && ev.key !== "Enter") return;
    if (!$("fxJump").hidden) { /* 蒙太奇:每次鍵盤操作只前進一幕；無跳過入口 */
      ev.preventDefault(); ev.stopPropagation(); advanceSceneFx(); return;
    }
    if (!$("notebook").hidden) return; /* 筆記開啟:不推進(Esc 另管) */
    if (!$("prologueCard").hidden) { /* 序幕:Enter/Space=下一拍;焦點在跳過鈕時交還原生 */
      if (ev.target && ev.target.closest && ev.target.closest("button")) return;
      ev.preventDefault(); ev.stopPropagation();
      mzNext();
      return;
    }
    if (!$("apparatusSurvey").hidden) return; /* 器材踏查只接受其可見按鈕，禁止鍵盤穿透到底層劇情 */
    if (!$("labIntro").hidden) return; /* 備忘卡開啟:交還原生(按鈕 Enter 即關閉) */
    if (!$("debIntro").hidden) return;
    if (typing || waiting || ackPending) { /* 演出未完/待收隊:先消化演出,不觸底層按鈕 */
      ev.preventDefault(); ev.stopPropagation();
      advanceIntent();
      return;
    }
    if (ev.target && ev.target.closest && ev.target.closest("button, select, input, textarea, a")) return; /* 交還原生 */
    if (idleAdvance()) ev.preventDefault();
  }, true);

  /* ---------- 行動裝置：能力優先的全螢幕＋開場建議(GB-ADR-014 補記) ----------
     iOS 已有部分版本支援 Fullscreen API，不再以裝置名稱猜能力。
     沒有 API 且未以主畫面 Web App 開啟時，才給 Apple 行動裝置加入主畫面指引。 */
  (function () {
    var root = document.documentElement;
    var PX = window.BDPlayExperience;
    var ADVICE_KEY = "bd_play_advice_dismissed";
    var supported = !!(root.requestFullscreen || root.webkitRequestFullscreen);
    function fsOn() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
    function standalone() {
      try {
        return navigator.standalone === true ||
          !!(window.matchMedia && (window.matchMedia("(display-mode: standalone)").matches ||
            window.matchMedia("(display-mode: fullscreen)").matches));
      } catch (e) { return false; }
    }
    function dismissed() {
      try { return sessionStorage.getItem(ADVICE_KEY) === "1"; } catch (e) { return false; }
    }
    function rememberDismissed() {
      try { sessionStorage.setItem(ADVICE_KEY, "1"); } catch (e) {}
    }
    function lockLandscape() {
      try {
        if (screen.orientation && screen.orientation.lock) {
          var lock = screen.orientation.lock("landscape");
          if (lock && lock.catch) lock.catch(function () {});
        }
      } catch (e) {}
    }
    function setAdviceStatus(text) {
      var status = $("playAdviceStatus");
      if (status) status.textContent = text || "";
    }
    function focusStart() {
      var target = $("continueWrap") && $("continueWrap").style.display !== "none"
        ? $("btnContinue") : $("btnNew");
      if (target && target.focus) target.focus();
    }
    function hideAdvice(shouldFocus) {
      rememberDismissed();
      var advice = $("playAdvice");
      if (advice) advice.hidden = true;
      if (shouldFocus) focusStart();
    }
    function enter(fromAdvice) {
      var request;
      try {
        request = root.requestFullscreen
          ? root.requestFullscreen({ navigationUI: "hide" })
          : root.webkitRequestFullscreen();
      } catch (error) {
        setAdviceStatus("無法進入全螢幕，你仍可繼續遊玩。");
        return Promise.reject(error);
      }
      return Promise.resolve(request).then(function () {
        lockLandscape();
        if (fromAdvice) hideAdvice(false);
      }, function (error) {
        setAdviceStatus("無法進入全螢幕，你仍可繼續遊玩。");
        throw error;
      });
    }
    function exit() {
      var method = document.exitFullscreen || document.webkitExitFullscreen;
      if (method) method.call(document);
    }
    function syncAdvice() {
      var advice = $("playAdvice");
      if (!advice || !PX) return;
      var kind = PX.adviceKind({
        dismissed: dismissed(),
        standalone: standalone(),
        fullscreen: fsOn(),
        supportsFullscreen: supported,
        appleMobile: PX.isAppleMobile(navigator),
        http: location.protocol === "http:" || location.protocol === "https:"
      });
      advice.hidden = kind === "hidden";
      $("playAdviceGeneral").hidden = kind !== "fullscreen";
      $("playAdviceIos").hidden = kind !== "ios-install";
      $("btnAdviceFull").hidden = kind !== "fullscreen";
      if (kind !== "hidden") setAdviceStatus("");
    }
    function sync() {
      var on = fsOn();
      $("btnFull").textContent = on ? "視窗" : "全螢幕";
      $("btnFull").setAttribute("aria-pressed", on ? "true" : "false");
      syncAdvice();
    }
    if (!supported || standalone()) $("btnFull").style.display = "none";
    $("btnFull").onclick = function () {
      if (fsOn()) exit();
      else enter(false).catch(function () {});
    };
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    $("btnAdviceFull").onclick = function () { enter(true).catch(function () {}); };
    $("btnAdviceDismiss").onclick = function () { hideAdvice(true); };
    [$("btnNew"), $("btnContinue")].forEach(function (button) {
      if (button) button.addEventListener("click", function () { hideAdvice(false); });
    });
    sync();
  })();
