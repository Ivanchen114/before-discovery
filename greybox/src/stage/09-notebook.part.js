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
      var specificBg = assetEntry("card_" + code);
      var bgE = specificBg || tpl; /* card_<code> 優先,缺圖回退共用底；E2 另保留 SVG 降級。 */
      var card = document.createElement("div");
      card.className = "evcard";
      if (bgE) card.style.backgroundImage = "url(" + assetUrl(bgE) + ")";
      var b = document.createElement("b"); b.textContent = code;
      var s = document.createElement("span"); s.textContent = name;
      card.appendChild(b); card.appendChild(s);
      if (code === "E2" && !specificBg) { /* 生圖底板缺席時，仍以 SVG 保住完整語意。 */
        card.insertAdjacentHTML("beforeend", e2DiagramMarkup());
        card.lastElementChild.setAttribute("aria-label", "綁縛悖論示意：大小二石以鏈相繫");
        card.lastElementChild.removeAttribute("aria-hidden");
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
    if (!$("apparatusSurvey").hidden) {
      /* 必要器材不能靠 Esc 跳過；把焦點送回尚未檢查的亮點。 */
      ev.preventDefault();
      var next = $("asHotspots").querySelector("button:not(.visited)") || $("btnApparatusGo");
      if (next) next.focus();
      return;
    }
    if (!$("labIntro").hidden) { ev.preventDefault(); $("labIntro").hidden = true; $("btnLabHelp").focus(); return; }
    if (!$("debIntro").hidden) { ev.preventDefault(); $("debIntro").hidden = true; $("btnDebHelp").focus(); }
  });
  document.addEventListener("focusin", function (ev) { /* 焦點不得逃出 modal(筆記+序幕皆圍欄) */
    var nb = $("notebook");
    if (!nb.hidden && !nb.contains(ev.target)) { $("btnDrawerClose").focus(); return; }
    var pc = $("prologueCard");
    if (!pc.hidden && !pc.contains(ev.target)) { pc.focus(); return; }
    var survey = $("apparatusSurvey");
    if (!survey.hidden && !survey.contains(ev.target)) {
      var first = $("asHotspots").querySelector("button") || $("btnApparatusGo");
      if (first) first.focus();
    }
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
