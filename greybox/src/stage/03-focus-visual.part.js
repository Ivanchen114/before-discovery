  /* ---------- 台詞情境特寫：角色說「看這張圖」時，鏡頭真的給玩家看 ---------- */
  function clearFocusVisual() {
    var fig = $("sceneFocus");
    if (!fig) return;
    fig.classList.remove("on", "multi", "quad", "epilogue", "future-echo", "question-handoff", "evidence-acquired");
    fig.hidden = true;
    $("sceneFocusMedia").innerHTML = "";
    $("sceneFocusCaption").textContent = "";
  }
  function focusRuleForLine(text, sceneId) {
    var rules = ASSETS && ASSETS.lineFocusVisual;
    if (!rules || !text) return null;
    var sid = sceneId || curSceneId;
    for (var i = 0; i < rules.length; i++) {
      var r = rules[i];
      if (r.scene === sid && text.indexOf(r.match) >= 0) return r;
    }
    return null;
  }
  function e2DiagramMarkup() {
    return '<svg viewBox="0 0 200 96" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<circle cx="60" cy="40" r="24" fill="#5a4638"/>' +
      '<circle cx="112" cy="52" r="12" fill="#8a7658"/>' +
      '<path d="M 82 46 Q 92 42 100 49" stroke="#241b16" stroke-width="3" fill="none" stroke-dasharray="4 3"/>' +
      '<text x="60" y="80" font-size="11" text-anchor="middle" fill="#241b16">重石</text>' +
      '<text x="112" y="80" font-size="11" text-anchor="middle" fill="#241b16">輕石</text>' +
      '<text x="158" y="34" font-size="11" fill="#8a4f14">拖慢它？</text>' +
      '<text x="158" y="58" font-size="11" fill="#244a63">合體更快？</text>' +
      '<path d="M 150 30 L 128 42" stroke="#8a4f14" stroke-width="1.5" fill="none"/>' +
      '<path d="M 150 54 L 130 54" stroke="#244a63" stroke-width="1.5" fill="none"/>' +
      '</svg>';
  }
  function mountE2FocusVisual(diagram) {
    var art = assetEntry("card_E2");
    if (!art) {
      diagram.innerHTML = e2DiagramMarkup();
      return;
    }
    diagram.classList.add("scene-focus-e2-art");
    var img = document.createElement("img");
    img.src = assetUrl(art);
    img.alt = "";
    img.setAttribute("aria-hidden", "true");
    diagram.appendChild(img);

    var overlay = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    overlay.setAttribute("class", "e2-argument-arrows");
    overlay.setAttribute("viewBox", "0 0 800 500");
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = '<path class="slow" d="M 610 184 C 565 187 526 206 474 231"/>' +
      '<path class="fast" d="M 610 307 C 560 295 525 281 475 260"/>';
    diagram.appendChild(overlay);

    [["heavy", "重石"], ["light", "輕石"], ["slow", "拖慢大石？"],
      ["fast", "合在一起更快？"]].forEach(function (pair) {
      var label = document.createElement("span");
      label.className = "e2-label " + pair[0];
      label.textContent = pair[1];
      diagram.appendChild(label);
    });
  }
  function mountCannonFocusVisual(item, art) {
    var diagram = document.createElement("div");
    diagram.className = "scene-focus-cannon";
    diagram.setAttribute("role", "img");
    diagram.setAttribute("aria-label", item.alt || "山頂大砲與三種引擎繪製的拋射路徑");
    var img = document.createElement("img");
    img.src = assetUrl(art);
    img.alt = "";
    img.loading = "eager";
    img.setAttribute("aria-hidden", "true");
    diagram.appendChild(img);
    var overlay = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    overlay.setAttribute("class", "cannon-trajectory-overlay");
    overlay.setAttribute("viewBox", "0 0 1672 941");
    overlay.setAttribute("preserveAspectRatio", "xMidYMid meet");
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML =
      '<path class="near" d="M 650 495 C 790 470 875 548 985 690"/>' +
      '<path class="far" d="M 650 495 C 875 385 1150 430 1415 655"/>' +
      '<path class="orbiting" d="M 650 495 C 930 250 1350 258 1660 510"/>' +
      '<circle class="impact near" cx="985" cy="690" r="8"/>' +
      '<circle class="impact far" cx="1415" cy="655" r="8"/>';
    diagram.appendChild(overlay);
    return diagram;
  }
  function mountOrbitGeometryFocusVisual(item, art) {
    var state = item.overlay || "orbit-base";
    var diagram = document.createElement("div");
    diagram.className = "scene-focus-orbit-geometry " + state;
    diagram.setAttribute("role", "img");
    diagram.setAttribute("aria-label", item.alt || "月球短圓弧、切線與實際端點差距的分步幾何圖");
    var img = document.createElement("img");
    img.src = assetUrl(art);
    img.alt = "";
    img.loading = "eager";
    img.setAttribute("aria-hidden", "true");
    diagram.appendChild(img);
    var overlay = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    overlay.setAttribute("class", "orbit-geometry-overlay");
    // Keep overlay geometry in the 1200 x 800 runtime-asset coordinate space.
    // `slice` mirrors the base image's object-fit: cover at every viewport size.
    overlay.setAttribute("viewBox", "0 0 1200 800");
    overlay.setAttribute("preserveAspectRatio", "xMidYMid slice");
    overlay.setAttribute("aria-hidden", "true");
    if (state !== "orbit-base") {
      overlay.innerHTML =
        '<path class="tangent" d="M 627.2 276.6 L 712 390.3"/>' +
        '<circle class="tangent-end" cx="712" cy="390.3" r="6"/>';
      if (state === "orbit-gap") {
        overlay.innerHTML +=
          '<path class="actual" d="M 627.2 276.6 A 335.9 358.1 0 0 1 688.5 405.6"/>' +
          '<circle class="actual-end" cx="688.5" cy="405.6" r="6"/>' +
          '<path class="gap" d="M 712 390.3 L 688.5 405.6"/>' +
          '<path class="gap-tick" d="M 708.2 383.9 L 715.8 396.8 M 684.7 399.2 L 692.3 412.1"/>';
      }
    }
    diagram.appendChild(overlay);
    return diagram;
  }
  function mountShellTheoremFocusVisual(item, art) {
    var diagram = document.createElement("div");
    diagram.className = "scene-focus-shell-theorem";
    diagram.setAttribute("role", "img");
    diagram.setAttribute("aria-label", item.alt || "均勻球殼、球心與殼外點的引擎繪製幾何圖");
    var img = document.createElement("img");
    img.src = assetUrl(art);
    img.alt = "";
    img.loading = "eager";
    img.setAttribute("aria-hidden", "true");
    diagram.appendChild(img);
    var overlay = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    overlay.setAttribute("class", "shell-theorem-overlay");
    overlay.setAttribute("viewBox", "0 0 1672 941");
    overlay.setAttribute("preserveAspectRatio", "xMidYMid meet");
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML =
      '<circle class="shell outer" cx="780" cy="500" r="275"/>' +
      '<circle class="shell middle" cx="780" cy="500" r="190"/>' +
      '<circle class="shell inner" cx="780" cy="500" r="105"/>' +
      '<line class="radius" x1="780" y1="500" x2="1245" y2="500"/>' +
      '<circle class="center" cx="780" cy="500" r="11"/>' +
      '<circle class="external" cx="1245" cy="500" r="15"/>';
    diagram.appendChild(overlay);
    return diagram;
  }
  function showFocusVisual(rule) {
    if (!rule) return;
    var fig = $("sceneFocus"), media = $("sceneFocusMedia");
    if (!fig || !media) return;
    media.innerHTML = "";
    fig.classList.remove("evidence-acquired");
    fig.classList.toggle("epilogue", !!rule.epilogue);
    fig.classList.toggle("future-echo", rule.epilogueLayer === "future-echo");
    fig.classList.toggle("question-handoff", rule.epilogueLayer === "question-handoff");
    var shown = 0;
    (rule.items || []).forEach(function (item) {
      if (item.evidence === "E2") {
        var diagram = document.createElement("div");
        diagram.className = "scene-focus-evidence";
        diagram.setAttribute("role", "img");
        diagram.setAttribute("aria-label", item.alt || "綁縛悖論示意圖");
        mountE2FocusVisual(diagram);
        media.appendChild(diagram);
        shown++;
        return;
      }
      var e = assetEntry(item.asset);
      if (!e) return;
      if (["orbit-base", "orbit-tangent", "orbit-gap"].indexOf(item.overlay) >= 0) {
        media.appendChild(mountOrbitGeometryFocusVisual(item, e));
        shown++;
        return;
      }
      if (item.overlay === "cannon-trajectories") {
        media.appendChild(mountCannonFocusVisual(item, e));
        shown++;
        return;
      }
      if (item.overlay === "shell-theorem") {
        media.appendChild(mountShellTheoremFocusVisual(item, e));
        shown++;
        return;
      }
      var img = document.createElement("img");
      img.src = assetUrl(e);
      img.alt = item.alt || "證據圖";
      img.loading = "eager";
      media.appendChild(img);
      shown++;
    });
    if (!shown) { clearFocusVisual(); return; }
    fig.classList.toggle("multi", shown > 1);
    fig.classList.toggle("quad", shown > 2);
    $("sceneFocusCaption").textContent = displayText(rule.caption || "");
    fig.hidden = false;
    requestAnimationFrame(function () { fig.classList.add("on"); });
  }
  function showFocusVisualForLine(text, sceneId) {
    var rule = focusRuleForLine(text, sceneId);
    if (!rule) return; /* 同一場景保留，直到下一個特寫取代或換場清除。 */
    showFocusVisual(rule);
  }
  function showFocusVisualForView(sceneId, nodeId) {
    var views = ASSETS && ASSETS.viewFocusVisual;
    if (!views || !sceneId || !nodeId) return;
    for (var i = 0; i < views.length; i++) {
      var view = views[i];
      if (view.scene !== sceneId || (view.nodeIds || []).indexOf(nodeId) < 0) continue;
      /* match 指向既有 lineFocusVisual：同一張圖、說明與替代文字只維護一份。 */
      var rule = focusRuleForLine(view.match, sceneId);
      if (rule) showFocusVisual(rule);
      return;
    }
  }
  /* CH4-CR-014：舞台只解析 chapter-ui 投影出的具名 visualKey。
     有 variants 而 key 不合法時，退回中性圖並明示無法安全還原；固定卡的 null 正常。 */
  function resolveEvidenceVisual(code, visualKey, overlay, disposition) {
    var rule = ASSETS && ASSETS.evidenceVisual && ASSETS.evidenceVisual[code];
    if (!rule) return null;
    var withheld = disposition && disposition.status === "withheld";
    var variant = null, fallback = false;
    if (rule.variants && !withheld) {
      variant = typeof visualKey === "string" ? rule.variants[visualKey] : null;
      fallback = !variant;
      if (fallback && typeof console !== "undefined" && console.warn)
        console.warn("[CH4-CR-014] 證據圖狀態無法安全還原，已使用中性圖：" + code);
    }
    var caption = withheld ? (disposition.label || "原紙已離桌，待修復") :
      ((variant && variant.caption) || rule.caption || "");
    /* 暫扣時連文字等價內容也必須一起離桌；否則圖片雖藏起來，
       讀圖器仍會把原配置與觀測完整念出來。 */
    var accessible = withheld
      ? [disposition.reason || "這張原紙目前不可讀；修復後恢復內容。"]
      : (rule.accessibleText || []).concat(variant && variant.accessibleText || []);
    if (!accessible.length) {
      var summary = ASSETS && ASSETS.evidenceSummary && ASSETS.evidenceSummary[code];
      accessible.push(summary || caption || ("證據代號 " + code));
    }
    return {
      code: code,
      visualKey: variant ? visualKey : null,
      items: withheld ? [] : ((variant && variant.items) || rule.items || []),
      caption: caption,
      readerTitle: withheld ? "內容暫扣" :
        ((variant && variant.readerTitle) || rule.readerTitle || ""),
      accessibleText: accessible,
      overlay: overlay || null,
      disposition: disposition || { status:"available" },
      projectionOnly: !!rule.projectionOnly,
      neutralBase: !!rule.neutralBase,
      identity: rule.identity || null,
      fallback: fallback,
      fallbackNotice: fallback ? (rule.fallbackNotice || "證據圖狀態無法安全還原。") : ""
    };
  }
  /* projectionOnly 是整份證據的邊界；neutralBase 可在整份或單張 item
     宣告。多圖證據逐張判斷，避免一張安全底圖放行同組的預製答案圖，
     也避免安全的第二張原紙被整組總閘門吃掉。 */
  function visibleEvidenceItems(rule) {
    if (!rule || rule.disposition && rule.disposition.status === "withheld") return [];
    var items = rule.items || [];
    if (!rule.projectionOnly || rule.neutralBase) return items.slice();
    return items.filter(function (item) { return item && item.neutralBase === true; });
  }
  function showEvidenceFocus(code, name, visualKey, overlay, disposition) {
    var rule = resolveEvidenceVisual(code, visualKey, overlay, disposition);
    if (!rule) return;
    var caption = rule.caption || ("取得證據：" + name);
    if (rule.fallbackNotice) caption += "｜" + rule.fallbackNotice;
    /* 動態證據只准顯示玩家實際狀態投影；固定底圖不得在取得瞬間偷渡預製答案。 */
    var visibleItems = visibleEvidenceItems(rule);
    if (visibleItems.length) showFocusVisual({ items: visibleItems, caption: caption });
    var fig = $("sceneFocus");
    if (fig && !fig.hidden) fig.classList.add("evidence-acquired");
  }
  function showEvidenceFocusList(list) {
    if (!list || !list.length) return;
    var items = [], captions = [];
    list.forEach(function (evidence) {
      var rule = resolveEvidenceVisual(evidence.code, evidence.visualKey,
        evidence.overlay, evidence.disposition);
      if (!rule) return;
      visibleEvidenceItems(rule).forEach(function (item) { items.push(item); });
      var caption = rule.caption || ("取得證據：" + evidence.name);
      if (rule.fallbackNotice) caption += "｜" + rule.fallbackNotice;
      captions.push(caption);
    });
    if (!items.length) return;
    showFocusVisual({ items: items, caption: captions.join("｜") });
    var fig = $("sceneFocus");
    if (fig && !fig.hidden) fig.classList.add("evidence-acquired");
  }
