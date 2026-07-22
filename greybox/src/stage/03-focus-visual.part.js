  /* ---------- 台詞情境特寫：角色說「看這張圖」時，鏡頭真的給玩家看 ---------- */
  function clearFocusVisual() {
    var fig = $("sceneFocus");
    if (!fig) return;
    fig.classList.remove("on", "multi", "quad");
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
  function showFocusVisualForLine(text, sceneId) {
    var rule = focusRuleForLine(text, sceneId);
    if (!rule) return; /* 同一場景保留，直到下一個特寫取代或換場清除。 */
    var fig = $("sceneFocus"), media = $("sceneFocusMedia");
    if (!fig || !media) return;
    media.innerHTML = "";
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
