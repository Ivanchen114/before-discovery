  /* ---------- 序幕 P0-0「螢幕前」(v03 六板,文字直生於圖;00:49 固定入圖,程式不疊可見 UI) ----------
     點擊或 Enter/Space=下一拍;「跳過 ▸」與 Esc=整段跳過(原則 #19);
     地磁風暴=系列電磁線環形伏筆,可神祕者為異常增幅非成因。 */
  var mzBeat = -1, mzTimers = [];
  /* v03 六板(Sol 20260720,文字直生於圖):拍→板映射 n1-n2→1/n3→2/n4-n5→3/n6→4/n7→5/n8-n9→6;
     程式僅交叉淡化+字幕+題詞+無障礙文字——禁再疊可見文章/新聞/通知/游標/動態時鐘(00:49 已入圖) */
  var MZ_PLATE = [1, 1, 2, 3, 3, 4, 5, 6, 6];
  var mzPlateActive = "B", mzPlateCur = 0; /* 首板落 A 槽 */
  function mzSetPlate(n) {
    if (n === mzPlateCur) return;
    mzPlateCur = n;
    var map = ASSETS && ASSETS.prologuePlates;
    var e = map ? assetEntry(map[String(n)]) : null;
    var showEl = $("mzPlate" + (mzPlateActive === "A" ? "B" : "A"));
    var hideEl = $("mzPlate" + mzPlateActive);
    if (!e) { showEl.classList.remove("on"); hideEl.classList.remove("on"); return; }
    showEl.src = assetUrl(e);
    showEl.classList.add("on");
    hideEl.classList.remove("on");
    mzPlateActive = (mzPlateActive === "A" ? "B" : "A");
  }
  function mzSay(t) { $("mzSr").textContent = displayText(t); } /* 單一隱藏 live region:只播關鍵內容,通知不逐條搶讀 */
  function mzCap(t) {
    var el = $("mzCaption");
    el.style.animation = "none"; void el.offsetWidth; el.style.animation = "";
    el.textContent = displayText(t);
  }
  function mzReset() {
    mzBeat = -1;
    mzTimers.forEach(clearTimeout); mzTimers = [];
    mzPlateCur = 0; mzPlateActive = "B";
    $("mzPlateA").classList.remove("on"); $("mzPlateB").classList.remove("on");
    $("mzSr").textContent = "";
    $("mzTitleLines").hidden = true;
    $("mzCaption").textContent = "";
    $("btnPrologueGo").textContent = "跳過 ▸";
  }
  var MZ = [
    function () { mzCap("深夜,零點四十九分。房間裡,只剩平板的光。"); },
    function () {
      mzCap("文章停在那座斜塔——「那兩顆球,真的落下過嗎?」");
      mzSay("平板畫面:物理史專題,時間零點四十九分。文章標題:比薩斜塔上,他真的丟過那兩顆球嗎?內文:通俗故事常這樣開場:直到伽利略登上斜塔。可那兩顆球,真的落下過嗎?");
    },
    function () {
      mzCap("整面畫面,被突發新聞接管。窗簾縫,滲進第一縷不該有的顏色。");
      mzSay("突發新聞:罕見強烈地磁風暴抵達地球。低緯度地區出現極光,多地通訊異常。監測單位:本次強度遠超預報,異常增幅原因待查。新聞畫面為地球磁層與極光環監測示意圖。");
    },
    function () { mzCap("你抬起頭。新聞裡的事,正在你的窗外發生——極光,在 101 後方炸開。"); },
    function () { mzCap("家電哀鳴。燈,熄了。只剩你,和手裡那塊發光的玻璃。"); },
    function () { mzCap("暗下來的玻璃上,新聞消失了。只剩——那座發著光的斜塔。你的右手,自己抬了起來。"); },
    function () { mzCap("指尖碰到玻璃的瞬間——玻璃,不見了。平板的另一頭,有晨光。"); },
    function () { mzCap("台北被抽走。四百年,從你身邊墜過。風裡有鐘聲,和一句聽不懂的話——像是,義大利語。"); },
    function () { mzCap(""); $("mzTitleLines").hidden = false; $("btnPrologueGo").textContent = "啟程"; }
  ];
  function mzNext() {
    mzBeat++;
    if (mzBeat >= MZ.length) { dismissPrologue(); return; }
    MZ[mzBeat]();
    mzSetPlate(MZ_PLATE[mzBeat]);
  }
  function mzShow() {
    mzReset();
    BGM.play("storm"); /* 序幕:風暴低鳴(手勢解鎖前靜默,首次點擊自動補播) */
    if (ASSETS && ASSETS.prologuePlates) { /* 四板先暖 */
      Object.keys(ASSETS.prologuePlates).forEach(function (k) {
        preloadEntry(assetEntry(ASSETS.prologuePlates[k]));
      });
    }
    $("prologueCard").hidden = false;
    mzNext();
    setTimeout(function () { $("prologueCard").focus(); }, 30);
  }
  function dismissPrologue() {
    if ($("prologueCard").hidden) return;
    mzTimers.forEach(clearTimeout); mzTimers = [];
    $("prologueCard").hidden = true;
    if (needKickoff) { /* 序幕收場才開演 */
      needKickoff = false;
      var btns = $("controls").querySelectorAll("button");
      if (btns.length === 1 && !typing && !waiting && !queue.length) btns[0].click();
    } else { /* 焦點交回舞台可操作控制 */
      setTimeout(function () {
        var b = $("controls").querySelector("button");
        if (b) b.focus(); else $("btnDrawer").focus();
      }, 0);
    }
  }
  $("btnPrologueGo").addEventListener("click", dismissPrologue);
  $("prologueCard").addEventListener("click", function (ev) {
    if (ev.target.closest("button")) return;
    mzNext();
  });
