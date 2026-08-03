  /* ---------- 辯論備忘卡(首次進辯論廳;? 鈕重看)+信譽首動提示 ---------- */
  var debIntroSeen = false;
  var debIntroReturnFocus = null;
  var defaultDebateLines = Array.prototype.map.call($("debIntro").querySelectorAll("ol li"), function (li) {
    return li.textContent;
  });
  function debateMemo(chapterId) {
    if (chapterId === "ch3") return {
      title: "旅人筆記・碼頭辯論備忘",
      action: "回到木板",
      lines: [
        "三問不是三次小考——第一問用原紙說明共同前行；第二問替舊紙守住證據邊界；第三問把同一事件的兩個參考原點換算回來。",
        "先選真正回答當前問題的證據。卡面只放判斷所需摘要；固定、改變與原紙編號可在「查看條件與原紙」展開。",
        "已在實驗簿完成的分類不重考。只有出現新的反例、干擾變因或適用範圍時，船長才會追問。",
        "岸紙與船紙不是兩次實驗。兩人記同一趟、共用鼓點；先對同號鼓點，再把岸紙每拍扣掉桅杆位置。",
        "論證對位歸零會回船複盤，原紙與已答完的柱仍保留。缺紙時可以先離場補做。"
      ]
    };
    if (chapterId === "ch4") return {
      title: "旅人筆記・出版校樣備忘",
      action: "回到印刷台",
      lines: [
        "這章不是三柱辯論。你的對手是同一條律必須同時接回互相獨立的資料。",
        "每一頁先確認它回答哪個缺口，再把計算、封存、對帳或署名接回正確來源。",
        "錯接不會被系統擦掉；壞校樣留下，讓你看見信用與證據歸屬錯在哪裡。",
        "旅人退出作者欄。你協助程序成立，不替歷史人物取得發現。"
      ]
    };
    if (chapterId === "ch5") return {
      title: "旅人筆記・兩本帳辯論備忘",
      action: "上場",
      lines: [
        "三問依序上桌——院士先亮他最強的帳，再追問短少，最後主張兩本其實相同。",
        "先問清，再配對——點「問到底」只會把前提說滿；支柱仍要由你選證詞、選證據親手擊破。",
        "第一個勝利是承認對手——J1 證明院士的帳沒有錯；你要說的是它沒有記到全部問題。",
        "配錯不刪紙——第一次失準免扣；之後論證對位下降，歸零就和杜夏特萊複盤，已破支柱照舊保留。",
        "最後不是選贏家——重讀同一批帳，再決定題目究竟該怎麼問。"
      ]
    };
    return {
      title: "旅人筆記・辯論備忘",
      action: "上場",
      lines: defaultDebateLines
    };
  }
  function applyDebateMemo(chapterId) {
    var memo = debateMemo(chapterId || CHAPTER_ID);
    var list = $("debIntro").querySelector("ol");
    $("debIntro").setAttribute("aria-label", memo.title);
    $("debIntroTitle").textContent = memo.title;
    $("btnDebIntroGo").textContent = memo.action;
    while (list.firstChild) list.removeChild(list.firstChild);
    memo.lines.forEach(function (line) {
      var li = document.createElement("li");
      li.textContent = line;
      list.appendChild(li);
    });
    return memo;
  }
  function showDebateMemo(chapterId) {
    applyDebateMemo(chapterId);
    debIntroReturnFocus = document.activeElement;
    $("debIntro").hidden = false;
    $("btnDebIntroGo").focus();
  }
  $("btnDebIntroGo").addEventListener("click", function () {
    $("debIntro").hidden = true;
    if (debIntroReturnFocus && typeof debIntroReturnFocus.focus === "function")
      debIntroReturnFocus.focus();
    else $("btnDebHelp").focus();
  });
  (function mountDebHelp() {
    var b = document.createElement("button");
    b.id = "btnDebHelp"; b.type = "button";
    b.setAttribute("aria-label", "重看辯論備忘");
    b.textContent = "?";
    b.addEventListener("click", function () { showDebateMemo(CHAPTER_ID); });
    $("panelWrap").appendChild(b);
  })();
  document.addEventListener("bd:open-debate-help", function (event) {
    showDebateMemo(event && event.detail && event.detail.chapter || CHAPTER_ID);
  });
  applyDebateMemo(CHAPTER_ID);
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
  var repPrev = $("repVal").textContent, repToastTimer = null;
  try {
    new MutationObserver(function () {
      var v = $("repVal").textContent;
      if (repPrev === null) { repPrev = v; return; }
      if (v !== repPrev) {
        var latestReason = $("repVal").getAttribute("data-rep-reason");
        var delta = Number(v) - Number(repPrev);
        var label = delta > 0 ? "信譽 +" + delta : "信譽 " + delta;
        $("repToast").textContent = label + "｜" +
          (latestReason || "人物正在根據你怎麼使用證據，調整對你的信任。");
        $("repToast").hidden = false;
        if (repToastTimer) clearTimeout(repToastTimer);
        repToastTimer = setTimeout(function () { $("repToast").hidden = true; }, 5000);
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
      title.textContent = "旅人筆記・航船實驗卷宗";
      lines = [
        "一題一題做——先查走穩，再做船艙對照、變速比較與雙視角紀錄；每一輪只開放真正需要的條件。",
        "先留原紙，再寫斷言——動畫、鼓點與原紙共用同一組數據；簽名收卷後，親手挑出能回答本題的紙。",
        "核心問題做完才自由補強——想換船、改航速或留一組失敗資料，都要一次只改一項。",
        "帶自己的證據去辯論——三柱依序回答；答不完就把質疑帶回船上，原紙與已完成進度都會保留。"
      ];
      $("btnLabIntroGo").textContent = "開始第一輪";
    } else if (CHAPTER_ID === "ch4") {
      title.textContent = "這一頁怎麼做？";
      var orbitBox = document.querySelector("#controls.orbitLab");
      var orbitPhase = orbitBox ? orbitBox.getAttribute("data-phase") : "";
      if (orbitPhase === "scale") {
        lines = [
          "先看兩張紙：地表記 1 秒，月球記 60 秒。",
          "先猜月球的 60 秒換成 1 秒後，會剩原來的多少，再封存答案。",
          "接著只做兩個比較：要除多少，以及兩張一秒紙相差幾倍。"
        ];
        $("btnLabIntroGo").textContent = "知道了，開始換算";
      } else {
        lines = [
          "先看右頁的「現在只做一件事」，不用預讀後面的步驟。",
          "需要預測時先封存，資料才會揭開；原答案不會被刪掉。",
          "做錯會留在紙上。看提示、調整，再試一次即可。"
        ];
        $("btnLabIntroGo").textContent = "知道了，回到工作台";
      }
    } else if (CHAPTER_ID === "ch5") {
      title.textContent = "旅人筆記・兩本帳工作台";
      lines = [
        "一次一筆——每按一次放手，只新增一筆紀錄；要重複幾回，由你決定。",
        "輪一先記動量帳——鋼頭、油灰頭各三筆，砝碼與速度要能正面比較。",
        "輪二不做新實驗——勾回輪一同一批紀錄，只把算法換成 mv²。",
        "追一筆殺掉假規律——4／8 油灰短少三分之二，不是固定一半。",
        "黏土只給一把尺——坑深隨 v² 可量；短少的完整去向仍沒有對平。",
        "資料不因失手消失——勾選、已破支柱與所有原紀錄都會保留。"
      ];
      $("btnLabIntroGo").textContent = "開始記第一本帳";
    } else if (CHAPTER_ID === "ch6") {
      title.textContent = "旅人筆記・四種來源追債台";
      lines = [
        "先封存，再揭示——四種有限來源都要先押下終點帶；未封存時，長時間實驗不會啟動。",
        "一次只查一件事——熱容量、接觸運動、空氣與水箱各有自己的對照；失敗紀錄保留，但不能冒充乾淨證據。",
        "封條只會裂，不會消失——長時間曲線出現後，你要逐一判讀四張預測；只有判讀完成，T4 才會入卷。",
        "反例有邊界——資料能逼來源說退下，不能自動證明運動說，也不能抹掉潛熱等未查現象。",
        "最後一頁分責任——操作、讀數、兩種解讀與未決債務分欄；四方署名只在最後交棒一次成立。"
      ];
      $("btnLabIntroGo").textContent = "開始追第一筆來源";
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
      (CHAPTER_ID === "ch4" || CHAPTER_ID === "ch6") ? [] : ["prop_water_clock", "prop_ball_groove"];
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
  /* 第四章的備忘入口由軌道抬頭動態建立；共用同一張卡，不複製規則文字。 */
  window.BD_showLabIntro = showLabIntro;
  $("btnLabIntroGo").addEventListener("click", function () {
    $("labIntro").hidden = true;
    var returnTarget = CHAPTER_ID === "ch4"
      ? document.querySelector(".orbitHelp")
      : $("btnLabHelp");
    if (returnTarget) returnTarget.focus();
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
