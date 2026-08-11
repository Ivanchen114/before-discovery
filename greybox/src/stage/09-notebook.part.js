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
    var custom = { target: snap, handled: false };
    document.dispatchEvent(new CustomEvent("bd:notebook-snapshot", { detail: custom }));
    if (custom.handled) return;
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
    if (!any) snap.innerHTML = '<p class="hint" style="color:var(--color-ink-secondary)">(尚無研究紀錄)</p>';
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
  var evidenceReaderReturnFocus = null;
  function closeEvidenceReader(silent) {
    var reader = $("evidenceReader");
    if (!reader || reader.hidden) return;
    reader.hidden = true;
    $("nbSheet").removeAttribute("aria-hidden");
    var image = $("evidenceReaderImage");
    if (image) image.removeAttribute("src");
    if (!silent && evidenceReaderReturnFocus && typeof evidenceReaderReturnFocus.focus === "function")
      evidenceReaderReturnFocus.focus();
    evidenceReaderReturnFocus = null;
  }
  function renderEvidenceOverlay(host, overlay, compact) {
    host.innerHTML = "";
    if (!overlay) { host.hidden = true; return false; }
    host.hidden = false;
    host.classList.add("evProjection");
    var title = document.createElement("b");
    title.textContent = overlay.title || "本局資料";
    host.appendChild(title);
    if (overlay.kind === "orbit-trials" && (overlay.trials || []).length) {
      var ns = "http://www.w3.org/2000/svg";
      var svg = document.createElementNS(ns, "svg");
      svg.setAttribute("viewBox", "0 0 120 120");
      svg.setAttribute("role", "img");
      svg.setAttribute("aria-label", "本局選入斷言的紙上軌道路徑");
      var earth = document.createElementNS(ns, "circle");
      earth.setAttribute("cx", "60"); earth.setAttribute("cy", "60"); earth.setAttribute("r", "14");
      earth.setAttribute("fill", "#356c88"); earth.setAttribute("stroke", "#b6d4e4");
      svg.appendChild(earth);
      var colors = ["#f0ca72", "#8fc9d8", "#d99573"];
      (overlay.trials || []).forEach(function (trial, index) {
        var poly = document.createElementNS(ns, "polyline");
        poly.setAttribute("fill", "none"); poly.setAttribute("stroke", colors[index % colors.length]);
        poly.setAttribute("stroke-width", "1.8"); poly.setAttribute("vector-effect", "non-scaling-stroke");
        poly.setAttribute("points", (trial.path || []).map(function (point) {
          return (60 + point.x * 34).toFixed(2) + "," + (60 - point.y * 34).toFixed(2);
        }).join(" "));
        svg.appendChild(poly);
      });
      host.appendChild(svg);
    }
    var lines = (overlay.lines || []).slice();
    if (overlay.trials) lines = lines.concat(overlay.trials.map(function (trial) { return trial.label; }));
    if (compact) lines = lines.slice(0, 3);
    if (lines.length) {
      var ul = document.createElement("ul");
      lines.forEach(function (line) {
        var li = document.createElement("li"); li.textContent = line; ul.appendChild(li);
      });
      host.appendChild(ul);
    }
    return true;
  }
  function openEvidenceReader(item, name, resolved, trigger) {
    var reader = $("evidenceReader");
    if (!reader || !resolved) return;
    evidenceReaderReturnFocus = trigger;
    $("evidenceReaderTitle").textContent = resolved.readerTitle || name;
    var media = $("evidenceReaderMedia");
    media.innerHTML = "";
    var visibleItems = visibleEvidenceItems(resolved).filter(function (entry) {
      return entry && assetEntry(entry.asset);
    });
    visibleItems.forEach(function (entry, index) {
      var art = assetEntry(entry.asset);
      var figure = document.createElement("figure");
      var img = document.createElement("img");
      if (index === 0) img.id = "evidenceReaderImage";
      img.src = assetUrl(art);
      img.alt = entry.alt || (name + "證據圖第 " + (index + 1) + " 張");
      var caption = document.createElement("figcaption");
      if (index === 0) caption.id = "evidenceReaderCaption";
      caption.textContent = entry.caption ||
        (visibleItems.length > 1 ? (name + "｜第 " + (index + 1) + " 張") : (resolved.caption || name));
      figure.appendChild(img); figure.appendChild(caption); media.appendChild(figure);
    });
    media.hidden = !visibleItems.length;
    renderEvidenceOverlay($("evidenceReaderProjection"), resolved.overlay, false);
    var warning = $("evidenceReaderWarning");
    warning.textContent = resolved.fallbackNotice || "";
    warning.hidden = !resolved.fallback;
    var textList = $("evidenceReaderText");
    textList.innerHTML = "";
    (resolved.accessibleText || []).forEach(function (line) {
      var li = document.createElement("li");
      li.textContent = line;
      textList.appendChild(li);
    });
    $("evidenceReaderTranscript").hidden = !textList.children.length;
    $("nbSheet").setAttribute("aria-hidden", "true");
    reader.hidden = false;
    $("btnEvidenceReaderClose").focus();
  }
  /* 證據卡:穩定 code 找圖、白話 name 顯示；不得從翻譯後名稱反推 ID。 */
  function renderEvidenceCards() {
    var wrap = $("nbCards");
    if (!wrap) return;
    wrap.innerHTML = "";
    var items = [];
    try { items = JSON.parse($("evidenceList").dataset.items || "[]"); }
    catch (e) { items = []; }
    if (!items.length) return;
    var tpl = assetEntry("card_template");
    items.forEach(function (item) {
      var code = item && item.code;
      var name = item && item.name || "未命名證據";
      if (!code) return;
      var specificBg = assetEntry("card_" + code);
      var resolved = resolveEvidenceVisual(code, item.visualKey, item.overlay, item.disposition);
      var readableItems = visibleEvidenceItems(resolved);
      var visualAsset = readableItems[0] && readableItems[0].asset;
      /* 狀態圖必須先過 resolver；禁止靜態 card_K4 蓋過封存世界線。 */
      var isWithheld = !!(resolved && resolved.disposition && resolved.disposition.status === "withheld");
      var bgE = isWithheld ? tpl : (assetEntry(visualAsset) ||
        (!resolved || !resolved.projectionOnly ? specificBg : null) || tpl);
      var canRead = !!(resolved && ((resolved.items || []).some(function (entry) {
        return entry && assetEntry(entry.asset);
      }) || resolved.overlay || (resolved.accessibleText || []).length));
      var card = document.createElement(canRead ? "button" : "div");
      card.className = "evcard";
      if (resolved && resolved.disposition && resolved.disposition.status === "withheld")
        card.classList.add("withheld");
      card.dataset.evidenceCode = code;
      if (canRead) {
        card.type = "button";
        card.setAttribute("aria-label", "放大閱讀「" + name + "」證據圖");
      } else {
        card.setAttribute("role", "img");
        card.setAttribute("aria-label", name + "證據圖");
      }
      if (bgE) card.style.backgroundImage = "url(" + assetUrl(bgE) + ")";
      var b = document.createElement("b"); b.textContent = name;
      card.appendChild(b);
      if (resolved && resolved.identity) {
        var identity = document.createElement("span");
        identity.textContent = resolved.identity.label || "教學重建";
        card.appendChild(identity);
      }
      if (resolved && resolved.overlay) {
        var projection = document.createElement("div");
        renderEvidenceOverlay(projection, resolved.overlay, true);
        card.appendChild(projection);
      }
      if (code === "E2" && !specificBg) { /* 生圖底板缺席時，仍以 SVG 保住完整語意。 */
        card.insertAdjacentHTML("beforeend", e2DiagramMarkup());
        card.lastElementChild.setAttribute("aria-label", "綁縛悖論示意：大小二石以鏈相繫");
        card.lastElementChild.removeAttribute("aria-hidden");
      }
      if (canRead) card.addEventListener("click", function () {
        openEvidenceReader(item, name, resolved, card);
      });
      if (canRead) card.addEventListener("keydown", function (ev) {
        if (ev.key !== "Enter" && ev.key !== " " && ev.key !== "Spacebar") return;
        ev.preventDefault(); /* 明示鍵盤啟動；阻止原生 keyup 再送一次 click。 */
        openEvidenceReader(item, name, resolved, card);
      });
      wrap.appendChild(card);
    });
  }
  function renderHistoricalReferences() {
    var section = $("nbHistorical"), wrap = $("nbHistoricalCards");
    if (!section || !wrap) return;
    wrap.innerHTML = "";
    var rules = ASSETS && ASSETS.historicalReference && ASSETS.historicalReference[CHAPTER_ID] || [];
    var seenText = $("log") ? $("log").textContent : "";
    rules.filter(function (rule) {
      return !rule.unlockText || seenText.indexOf(rule.unlockText) >= 0;
    }).forEach(function (rule) {
      var entry = rule.items && rule.items[0];
      if (!entry || !assetEntry(entry.asset)) return;
      var card = document.createElement("button");
      card.type = "button"; card.className = "evcard historical";
      card.style.backgroundImage = "url(" + assetUrl(assetEntry(entry.asset)) + ")";
      card.setAttribute("aria-label", "放大閱讀歷史參考「" + rule.name + "」");
      var title = document.createElement("b"); title.textContent = rule.name; card.appendChild(title);
      var identity = document.createElement("span"); identity.textContent = rule.identity || "歷史參考"; card.appendChild(identity);
      card.addEventListener("click", function () {
        openEvidenceReader(null, rule.name, {
          items:rule.items, caption:rule.caption, readerTitle:rule.readerTitle || rule.name,
          accessibleText:rule.accessibleText || [], identity:{ label:rule.identity },
          projectionOnly:false, neutralBase:false, overlay:null, disposition:{ status:"available" }
        }, card);
      });
      wrap.appendChild(card);
    });
    section.hidden = !wrap.children.length;
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
    renderHistoricalReferences();
    applyNotebookBg();
    $("notebook").hidden = false;
    $("btnDrawer").setAttribute("aria-expanded", "true");
    pauseTyping();
    var log = $("log"); log.scrollTop = log.scrollHeight;
    $("btnDrawerClose").focus();
  }
  function closeNotebook(silent) {
    if ($("notebook").hidden) return;
    closeEvidenceReader(true);
    $("notebook").hidden = true;
    $("btnDrawer").setAttribute("aria-expanded", "false");
    resumeTyping();
    if (!silent) $("btnDrawer").focus(); /* 焦點歸還 */
  }
  document.addEventListener("bd:notebook-close", function () { closeNotebook(true); });
  $("btnDrawer").addEventListener("click", function () {
    if ($("notebook").hidden) openNotebook(); else closeNotebook();
  });
  $("btnDrawerClose").addEventListener("click", function () { closeNotebook(); });
  $("btnEvidenceReaderClose").addEventListener("click", function () { closeEvidenceReader(); });
  $("evidenceReader").addEventListener("click", function (ev) {
    if (ev.target === $("evidenceReader")) closeEvidenceReader();
  });
  document.addEventListener("keydown", function (ev) {
    var reader = $("evidenceReader");
    if (!reader.hidden && ev.key === "Tab") {
      var controls = reader.querySelectorAll("button:not([disabled]), details summary, [tabindex]:not([tabindex='-1'])");
      if (!controls.length) return;
      var first = controls[0], last = controls[controls.length - 1];
      if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
      else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
      return;
    }
    if (ev.key !== "Escape") return;
    if (!$("fxJump").hidden) { ev.preventDefault(); return; } /* 時代轉場必須逐幕看完，Esc 不得跳過 */
    if (!reader.hidden) { ev.preventDefault(); closeEvidenceReader(); return; }
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
    var fx = $("fxJump");
    if (!fx.hidden && !fx.contains(ev.target)) { fx.focus(); return; }
    var nb = $("notebook");
    var reader = $("evidenceReader");
    if (!reader.hidden && !reader.contains(ev.target)) { $("btnEvidenceReaderClose").focus(); return; }
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
