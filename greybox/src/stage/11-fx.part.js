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
    svg.push('<text x="' + (W - 8) + '" y="16" font-size="12" text-anchor="end" fill="#8a4f14">重播：' + run.config.ball + "・" + run.config.incline + "・" + run.config.timer + "（點擊跳過）</text>");
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
