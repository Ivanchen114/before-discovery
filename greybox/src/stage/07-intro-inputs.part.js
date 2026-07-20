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
  function fillLabIntroProps() {
    var box = $("liProps");
    if (!box || box.children.length) return;
    ["prop_water_clock", "prop_ball_groove"].forEach(function (id) {
      var e = assetEntry(id);
      if (!e) return;
      var img = document.createElement("img");
      img.src = assetUrl(e); img.alt = "";
      box.appendChild(img);
    });
  }
  function showLabIntro() {
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
