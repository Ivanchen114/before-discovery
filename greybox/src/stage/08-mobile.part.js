  /* ---------- 輸入:點擊與鍵盤 ---------- */
  $("stage").addEventListener("click", function (ev) {
    if (!$("fxJump").hidden) return; /* 幕間蒙太奇:交給 fxJump 自己的快轉 */
    if (!$("notebook").hidden) return;
    if (!$("prologueCard").hidden) return; /* 題詞卡:按「啟程」走,誤點舞台不推進 */
    if (!$("apparatusSurvey").hidden) return;
    if (!$("labIntro").hidden) return;
    if (!$("debIntro").hidden) return;
    if (ev.target.closest("button, select, input, textarea, label, a, #panelWrap, #notebook, #title-screen, #hud, #hudTip, #repToast, #nextCard, #rotateHint")) return;
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

  /* ---------- 行動裝置:全螢幕+橫屏鎖定(GB-ADR-014) ----------
     Android Chrome=requestFullscreen(手勢內)+screen.orientation.lock("landscape");
     iPhone Safari 不支援元素全螢幕與鎖向 → 藏按鈕,rotateHint 引導轉橫+加入主畫面(manifest)。 */
  (function () {
    var root = document.documentElement;
    var supported = !!(root.requestFullscreen || root.webkitRequestFullscreen);
    function fsOn() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
    function lockLandscape() {
      try {
        if (screen.orientation && screen.orientation.lock)
          screen.orientation.lock("landscape").catch(function () {});
      } catch (e) {}
    }
    function enter() {
      var r = root.requestFullscreen ? root.requestFullscreen({ navigationUI: "hide" })
        : root.webkitRequestFullscreen();
      if (r && r.then) r.then(lockLandscape, function () {}); else lockLandscape();
    }
    function exit() { (document.exitFullscreen || document.webkitExitFullscreen).call(document); }
    function sync() {
      var on = fsOn();
      $("btnFull").textContent = on ? "視窗" : "全螢幕";
      $("btnFull").setAttribute("aria-pressed", on ? "true" : "false");
    }
    if (!supported) { $("btnFull").style.display = "none"; $("btnRotFull").style.display = "none"; }
    $("btnFull").onclick = function () { if (fsOn()) exit(); else enter(); };
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    function rotOk() { body.classList.add("rotOk"); try { sessionStorage.setItem("bd_rotOk", "1"); } catch (e) {} }
    try { if (sessionStorage.getItem("bd_rotOk") === "1") body.classList.add("rotOk"); } catch (e) {}
    $("btnRotFull").onclick = function () { enter(); rotOk(); };
    $("btnRotDismiss").onclick = rotOk;
  })();
