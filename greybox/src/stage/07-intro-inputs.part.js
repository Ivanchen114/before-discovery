  /* ---------- 辯論備忘卡(首次進辯論廳;? 鈕重看)+信譽首動提示 ---------- */
  var debIntroSeen = false;
  $("btnDebIntroGo").addEventListener("click", function () {
    $("debIntro").hidden = true;
    $("btnDebHelp").focus();
  });
  (function mountDebHelp() {
    var b = document.createElement("button");
    b.id = "btnDebHelp"; b.type = "button";
    b.setAttribute("aria-label", "重看辯論備忘");
    b.textContent = "?";
    b.addEventListener("click", function () { $("debIntro").hidden = false; $("btnDebIntroGo").focus(); });
    $("panelWrap").appendChild(b);
  })();
  /* 量表說明=點/觸碰即顯(hover title 僅桌機加菜;雙線索原則,手機平板不靠懸停) */
  var hudTipTimer = null;
  function showHudTip(text) {
    var tip = $("hudTip");
    tip.textContent = text;
    tip.hidden = false;
    if (hudTipTimer) clearTimeout(hudTipTimer);
    hudTipTimer = setTimeout(function () { tip.hidden = true; }, 7000);
  }
  document.getElementById("hud").addEventListener("click", function (ev) {
    var chip = ev.target.closest(".chip");
    if (!chip || !chip.title) return;
    if (!$("hudTip").hidden && $("hudTip").textContent === chip.title) { $("hudTip").hidden = true; return; }
    showHudTip(chip.title);
  });
  document.getElementById("hud").addEventListener("keydown", function (ev) {
    if (ev.key !== "Enter" && ev.key !== " ") return;
    var chip = ev.target.closest ? ev.target.closest(".chip") : null;
    if (!chip || !chip.title) return;
    ev.preventDefault();
    showHudTip(chip.title);
  });
  var repHinted = false, repPrev = null;
  try {
    new MutationObserver(function () {
      var v = $("repVal").textContent;
      if (repPrev === null) { repPrev = v; return; }
      if (v !== repPrev && !repHinted) { /* 信譽第一次變動:一次性提示(just-in-time,不是開場說明書) */
        repHinted = true;
        $("repToast").hidden = false;
        setTimeout(function () { $("repToast").hidden = true; }, 5000);
      }
      repPrev = v;
    }).observe($("repVal"), { childList: true, characterData: true, subtree: true });
  } catch (e) {}

  /* ---------- 實驗備忘卡(首次進實驗台自動彈;? 鈕可重看)+同配置聚焦 ---------- */
  var labIntroSeen = false;
  var apparatusSurveySeen = {}, apparatusSurveyActive = null, apparatusSurveyDone = null;
  function apparatusBriefing(sceneId) {
    var map = ASSETS && ASSETS.apparatusBriefings;
    return map && (map[CHAPTER_ID + ":" + sceneId] || map[sceneId]) || null;
  }
  function apparatusBriefingKey(sceneId) { return CHAPTER_ID + ":" + sceneId; }
  function updateApparatusSurvey() {
    var cfg = apparatusSurveyActive;
    if (!cfg) return;
    var found = cfg.found || {};
    var n = cfg.items.filter(function (item) { return !!found[item.id]; }).length;
    $("asCount").textContent = n + " / " + cfg.items.length;
    var tray = $("asTray");
    while (tray.firstChild) tray.removeChild(tray.firstChild);
    cfg.items.forEach(function (item) {
      var tag = document.createElement("span");
      tag.className = "asTrayItem" + (found[item.id] ? " found" : "");
      tag.textContent = (found[item.id] ? "✓ " : "○ ") + displayText(item.label);
      tray.appendChild(tag);
    });
    var go = $("btnApparatusGo");
    go.disabled = n !== cfg.items.length;
    go.textContent = go.disabled ? "還有 " + (cfg.items.length - n) + " 件器材未檢查" : displayText(cfg.enterLabel || "器材齊了，開始實驗");
  }
  function inspectApparatus(item, button) {
    var cfg = apparatusSurveyActive;
    if (!cfg) return;
    cfg.found[item.id] = true;
    button.classList.add("visited");
    button.textContent = "✓";
    button.setAttribute("aria-label", displayText(item.label) + "，已檢查");
    $("asItemName").textContent = displayText(item.label);
    $("asFunction").textContent = displayText(item.function);
    $("asLine").textContent = displayText((cfg.speaker || "科學家") + "：「" + item.line + "」");
    var artEntry = assetEntry(item.asset);
    if (artEntry) {
      $("asArt").src = assetUrl(artEntry);
      $("asArt").alt = displayText(item.label);
      $("asArtWrap").hidden = false;
    } else {
      $("asArt").removeAttribute("src");
      $("asArt").alt = "";
      $("asArtWrap").hidden = true;
    }
    updateApparatusSurvey();
  }
  function showApparatusSurvey(sceneId, done) {
    var source = apparatusBriefing(sceneId);
    if (!source) { if (done) done(); return; }
    var cfg = {
      key: apparatusBriefingKey(sceneId), title: source.title, subtitle: source.subtitle,
      speaker: source.speaker, enterLabel: source.enterLabel, plateAsset: source.plateAsset,
      platePosition: source.platePosition,
      items: source.items || [], found: {}
    };
    apparatusSurveyActive = cfg;
    apparatusSurveyDone = done || null;
    $("asTitle").textContent = displayText(cfg.title || "器材踏查");
    $("asSubtitle").textContent = displayText(cfg.subtitle || "先看懂器材，再開始實驗。");
    $("asPrompt").textContent = "點選場景中的亮點，" + displayText(cfg.speaker || "科學家") + "會說明這件器材負責什麼。";
    $("asItemName").textContent = "器材尚未檢查";
    $("asFunction").textContent = "必要器材不會藏在陰影裡；請逐一點開。";
    $("asLine").textContent = "";
    $("asArtWrap").hidden = true;
    var plate = assetEntry(cfg.plateAsset);
    $("asPlate").style.objectPosition = cfg.platePosition || "center center";
    if (plate) $("asPlate").src = assetUrl(plate); else $("asPlate").removeAttribute("src");
    var hs = $("asHotspots");
    while (hs.firstChild) hs.removeChild(hs.firstChild);
    cfg.items.forEach(function (item, idx) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "asHotspot"; b.textContent = String(idx + 1);
      b.style.left = Number(item.x) + "%"; b.style.top = Number(item.y) + "%";
      b.setAttribute("aria-label", "檢查器材 " + displayText(item.label));
      b.addEventListener("click", function () { inspectApparatus(item, b); });
      hs.appendChild(b);
    });
    updateApparatusSurvey();
    $("apparatusSurvey").hidden = false;
    setTimeout(function () { var first = hs.querySelector("button"); if (first) first.focus(); }, 0);
  }
  function closeApparatusSurvey() {
    if (!apparatusSurveyActive) return;
    apparatusSurveySeen[apparatusSurveyActive.key] = true;
    apparatusSurveyActive = null;
    $("apparatusSurvey").hidden = true;
    var done = apparatusSurveyDone; apparatusSurveyDone = null;
    if (done) done();
  }
  $("btnApparatusGo").addEventListener("click", function () {
    if (!this.disabled) closeApparatusSurvey();
  });
  function configureLabIntroCopy() {
    var sheet = $("liSheet"), title = sheet.querySelector("h2"), list = sheet.querySelector("ol");
    var lines;
    if (CHAPTER_ID === "ch2") {
      title.textContent = "旅人筆記・彈射工坊備忘";
      lines = [
        "先理解，再組裝——短斜槽與升降沙盤是固定骨架；釋放、桌沿與落點量法，才是你真正要選的三件。",
        "器材會留下指紋——手放、毛邊與粗量法造成的異常不同。不要只換數字，要找異常跟著哪個零件走。",
        "校準也算實驗——發射零位與沙盤標尺各花一天；更換相依零件後，舊校準可能失效。",
        "連結測量——同一裝置、同一顆球，依序測 4、9、16 格；看過前三筆後，先押 25 格射程再放球。",
        "兩道門檻——前三筆的形狀與第 25 格預測都須在容許範圍內；失敗紀錄不刪，拿來診斷裝置。",
        "換球比較——要主張與重量無關，兩組紀錄只能換球；裝置、校準與誤差指紋必須相同。"
      ];
      $("btnLabIntroGo").textContent = "開始組裝";
    } else if (CHAPTER_ID === "ch3") {
      title.textContent = "旅人筆記・共同運動實驗備忘";
      lines = [
        "先分船況——停船、近似穩速、加速與減速不是同一個條件；每次放手前，先確認船正在怎麼走。",
        "桅頂落石——標定桅腳正下方，用不額外推石頭的方式釋放；落點看散布，不宣稱每次絕對同點。",
        "封閉船艙——停船與穩速各做滴水、拋接；比較的是相對船內器材的結果有沒有改變。",
        "變速邊界——放手後再加槳或收槳；落點偏移是在告訴你，共同運動的哪個條件破掉了。",
        "雙紙帶——先讓同一聲鼓相認，再切換參考物；船上直落與岸上向前彎下可以同時正確。",
        "最後只說證據夠重的話——淘汰『必落船尾』的反對，不等於直接證成地球正在運動。"
      ];
      $("btnLabIntroGo").textContent = "登上實驗船";
    } else {
      return;
    }
    while (list.firstChild) list.removeChild(list.firstChild);
    lines.forEach(function (text) { var li = document.createElement("li"); li.textContent = text; list.appendChild(li); });
  }
  function fillLabIntroProps() {
    var box = $("liProps");
    if (!box || box.children.length) return;
    var ids = CHAPTER_ID === "ch2" ? ["workshop2_projectile_apparatus_master"] :
      CHAPTER_ID === "ch3" ? ["ship3_g1_mast_dock", "ship3_g2_cabin"] :
      ["prop_water_clock", "prop_ball_groove"];
    ids.forEach(function (id) {
      var e = assetEntry(id);
      if (!e) return;
      var img = document.createElement("img");
      img.src = assetUrl(e); img.alt = "";
      box.appendChild(img);
    });
  }
  function showLabIntro() {
    configureLabIntroCopy();
    fillLabIntroProps();
    $("labIntro").hidden = false;
    $("btnLabIntroGo").focus();
  }
  $("btnLabIntroGo").addEventListener("click", function () {
    $("labIntro").hidden = true;
    $("btnLabHelp").focus();
  });
  $("btnLabHelp").addEventListener("click", function () { showLabIntro(); });
  /* 勾選後視圖聚焦同配置(判定選集本就要求同配置);資料一筆不刪——筆記簿倫理 */
  function applyRunFocus() {
    var tbody = $("labRunsBody");
    if (!tbody) return;
    var rows = Array.prototype.slice.call(tbody.querySelectorAll("tr"));
    var cfgs = [];
    rows.forEach(function (r) {
      if (r.querySelector("input:checked") && r.cells[2]) cfgs.push(r.cells[2].textContent);
    });
    rows.forEach(function (r) {
      var cfg = r.cells[2] ? r.cells[2].textContent : "";
      r.classList.toggle("offconfig", cfgs.length > 0 && cfgs.indexOf(cfg) < 0);
    });
  }
  $("labRunsBody").addEventListener("change", applyRunFocus);
  try { new MutationObserver(applyRunFocus).observe($("labRunsBody"), { childList: true }); } catch (e) {}
