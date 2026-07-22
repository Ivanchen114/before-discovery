/* src/ui.js — 表現層。所有狀態變更一律經由 Engine 純函式;本檔僅負責讀取輸入與渲染。
   v0.1.2:選單改由資料生成(審查 B-5)、重繪保留勾選(B-2)、可存取名稱與頁籤狀態(B-1)。 */
(function () {
  "use strict";
  var Engine = window.GB.Engine;
  var DEBATE = window.GB.DATA.debate;
  var PATTERNS = window.GB.DATA.patterns;
  var state = Engine.initialState();
  var viewMode = "inc";

  function $(id) { return document.getElementById(id); }
  function fmt(v) { return (Math.round(v * 10) / 10).toFixed(1); } /* 顯示至 0.1;內部保持精確值 */
  function cfgLabel(c) { return c.ball + "·" + c.surface + "·" + c.incline + "·" + c.timer; }

  /* ---------- 選單由資料生成(B-5:新增計時工具僅需改 data 層與測試期望集) ---------- */
  function fillSelect(id, keys, labelFn) {
    var sel = $(id);
    sel.innerHTML = "";
    keys.forEach(function (k) {
      var o = document.createElement("option");
      o.value = k;
      o.textContent = labelFn ? labelFn(k) : k;
      sel.appendChild(o);
    });
  }
  fillSelect("selBall", Object.keys(PATTERNS.ball));
  fillSelect("selSurface", Object.keys(PATTERNS.surface));
  fillSelect("selIncline", Object.keys(PATTERNS.base));
  fillSelect("selTimer", Object.keys(PATTERNS.timer), function (t) {
    return t + "(" + PATTERNS.dayCost[t] + " 天/次)";
  });

  /* ---------- 面板切換(B-1:aria-selected 與視覺同步) ---------- */
  Array.prototype.forEach.call(document.querySelectorAll(".tabbtn"), function (btn) {
    btn.onclick = function () {
      Array.prototype.forEach.call(document.querySelectorAll(".tabbtn"), function (b) {
        b.setAttribute("aria-selected", b === btn ? "true" : "false");
      });
      Array.prototype.forEach.call(document.querySelectorAll("section.panel"), function (p) { p.classList.remove("active"); });
      $("panel-" + btn.dataset.panel).classList.add("active");
    };
  });

  /* ---------- 勾選保留工具(B-2:重繪不得改變玩家的選取狀態) ---------- */
  function snapshotChecked(cls) {
    var keep = {};
    Array.prototype.forEach.call(document.querySelectorAll("." + cls), function (el) {
      if (el.checked) keep[el.dataset.id] = true;
    });
    return keep;
  }

  /* ---------- 共用渲染 ---------- */
  function renderHeader() {
    $("dayCount").textContent = state.days;
    var e3 = state.evidence.e3;
    $("e3State").textContent = "斜面主張：規律" + (e3.a ? "●" : "○") + " 重量" + (e3.b ? "●" : "○") + " 傾角" + (e3.c ? "●" : "○") + (Engine.e3Established(state) ? "（確立）" : "");
    var P3 = state.belief.P3;
    $("persuasion").textContent = "說服力:" + Array(P3.persuasion + 1).join("●") + Array(5 - P3.persuasion + 1).join("○");
    $("p3Status").textContent = "目的論支柱：" + ({ pending: "未決", suspended: "辯論中止", broken: "已破裂" })[P3.status];
  }

  function renderRuns() {
    var keep = snapshotChecked("runSel");
    var tbody = $("runsBody");
    tbody.innerHTML = "";
    state.evidence.runs.forEach(function (r) {
      var vals = viewMode === "inc" ? r.readings : Engine.cumulative(r.readings);
      var tr = document.createElement("tr");
      var name = "選取實驗紀錄 #" + r.id + "（" + cfgLabel(r.config) + "）";
      tr.innerHTML = "<td><input type='checkbox' class='runSel' data-id='" + r.id + "' aria-label='" + name + "'></td>" +
        "<td>#" + r.id + "</td><td>" + cfgLabel(r.config) + "</td>" +
        vals.map(function (v) { return "<td>" + fmt(v) + "</td>"; }).join("") +
        "<td>" + r.day + "</td>";
      tbody.appendChild(tr);
      tr.querySelector("input").checked = !!keep[r.id];
    });
  }

  function renderClaims() {
    var keep = snapshotChecked("claimSel");
    var tbody = $("claimsBody");
    tbody.innerHTML = "";
    state.inference.claims.forEach(function (c) {
      var tr = document.createElement("tr");
      var name = "選取主張 #" + c.id + "(" + cfgLabel(c.config) + "," + (c.ok ? "成立" : "不成立") + ")";
      tr.innerHTML = "<td><input type='checkbox' class='claimSel' data-id='" + c.id + "' aria-label='" + name + "'></td>" +
        "<td>#" + c.id + "</td><td>" + cfgLabel(c.config) + "</td>" +
        "<td>" + fmt(c.prediction) + "</td><td>" + (c.ok ? "成立" : "不成立") + "</td><td>" + c.day + "</td>";
      tbody.appendChild(tr);
      tr.querySelector("input").checked = !!keep[c.id];
    });
  }

  function renderStatements() {
    var box = $("statements");
    box.innerHTML = "";
    DEBATE.statements.forEach(function (st, idx) {
      var stateTag = state.belief.P3.statements[st.id];
      var div = document.createElement("div");
      var extra = (st.id === "s2" && state.belief.P3.s2NeedFlag && stateTag !== "broken")
        ? "<div class='hint'>(證詞追加)" + st.insufficient.reply + "</div>" : "";
      div.innerHTML = "<p class='" + (stateTag === "broken" ? "broken" : "") + "'><b>證詞 " + (idx + 1) + "</b> " + st.text +
        " <button class='pressBtn' data-id='" + st.id + "' data-no='" + (idx + 1) + "' aria-label='追問第 " + (idx + 1) + " 句證詞'>追問</button></p>" + extra;
      box.appendChild(div);
    });
    Array.prototype.forEach.call(document.querySelectorAll(".pressBtn"), function (b) {
      b.onclick = function () { log("【追問第 " + b.dataset.no + " 句】" + Engine.press(b.dataset.id)); };
    });
  }

  function renderDebateControls() {
    var P3 = state.belief.P3;
    $("btnPresent").disabled = (P3.status !== "pending");
    $("btnReenter").style.display = (P3.status === "suspended") ? "" : "none";
    if (P3.status === "broken" && $("victory").style.display === "none") {
      $("victory").style.display = "";
      $("victory").innerHTML = "<p>" + DEBATE.texts.victory + "</p>" +
        "<p><b>目的論支柱破裂——本切片結束。總耗天數：" + state.days + " 天。</b></p>" +
        "<p><label>你改了什麼讓數據變好?<br><textarea id='q1' rows='2'></textarea></label></p>" +
        "<p><label>這組證據還不能證明什麼?<br><textarea id='q2' rows='2'></textarea></label></p>" +
        "<p class='hint'>(自由作答,僅存於本次記憶體,不評分——供形成性試玩之因果回述觀察)</p>";
      $("q1").onchange = function () { state.review.q1 = this.value; };
      $("q2").onchange = function () { state.review.q2 = this.value; };
    }
  }

  function renderAll() {
    renderHeader(); renderRuns(); renderClaims(); renderStatements(); renderDebateControls();
  }

  function log(msg) {
    var el = $("debateLog");
    el.textContent += (el.textContent ? "\n" : "") + msg;
    el.scrollTop = el.scrollHeight;
  }

  function checkedIds(cls) {
    return Array.prototype.map.call(document.querySelectorAll("." + cls + ":checked"), function (el) {
      return parseInt(el.dataset.id, 10);
    });
  }

  /* ---------- 實驗台 ---------- */
  $("btnRun").onclick = function () {
    var config = { ball: $("selBall").value, surface: $("selSurface").value, incline: $("selIncline").value, timer: $("selTimer").value };
    var res = Engine.runExperiment(state, config);
    state = res.state;
    var r = res.run;
    $("labMsg").textContent = "實驗紀錄 #" + r.id + " 完成（" + cfgLabel(r.config) + "，第 " + r.seq + " 次）。讀值已存入旅人筆記。";
    $("lastRun").innerHTML = "<table><thead><tr><th>四段等時距</th><th>Δ1</th><th>Δ2</th><th>Δ3</th><th>Δ4</th></tr></thead>" +
      "<tbody><tr><td>增量讀值(刻度)</td>" + r.readings.map(function (v) { return "<td>" + fmt(v) + "</td>"; }).join("") + "</tr></tbody></table>";
    renderAll();
  };

  /* ---------- 筆記 ---------- */
  Array.prototype.forEach.call(document.querySelectorAll("input[name=viewMode]"), function (radio) {
    radio.onchange = function () { viewMode = this.value; renderRuns(); }; /* renderRuns 內建勾選保留(B-2) */
  });

  $("btnCompare").onclick = function () {
    var ids = checkedIds("runSel");
    if (ids.length !== 2) { $("compareMsg").textContent = "請恰好勾選兩筆實驗紀錄。"; return; }
    var res = Engine.compareRuns(state, ids);
    if (res.error) { $("compareMsg").textContent = res.error; return; }
    state = res.state;
    $("compareMsg").textContent = "實驗紀錄 #" + ids[0] + " 與 #" + ids[1] + " 的相異變因：" +
      (res.comparison.diff.length ? res.comparison.diff.join("、") : "無(配置完全相同)");
  };

  $("btnJudge").onclick = function () {
    var ids = checkedIds("runSel");
    var pred = parseFloat($("prediction").value);
    if (!ids.length) { $("judgeMsg").textContent = "請先勾選 1–3 筆實驗紀錄作為判定依據。"; return; }
    if (isNaN(pred)) { $("judgeMsg").textContent = "請輸入第五段增量之預測值。"; return; }
    var res = Engine.judge(state, ids, pred);
    if (res.rejected) {
      $("judgeMsg").textContent = res.rejected.reason + (res.rejected.diff.length ? "——相異變因:" + res.rejected.diff.join("、") : "");
      return;
    }
    state = res.state;
    var c = res.claim;
    if (c.ok) {
      $("judgeMsg").textContent = "主張 #" + c.id + " 成立(" + cfgLabel(c.config) + ")。已入主張紀錄。";
    } else {
      var parts = [];
      parts.push("前四段形狀偏差 " + (c.maxDev * 100).toFixed(1) + "% " + (c.consistent ? "✓" : "✕"));
      parts.push("第五段預測偏差 " + (c.predDev * 100).toFixed(1) + "% " + (c.predHit ? "✓" : "✕"));
      $("judgeMsg").textContent = "主張 #" + c.id + " 未成立:" + parts.join(";") + "。認證門檻:兩項皆須 ≤12.0%。";
    }
    renderAll();
  };

  function doAssert(type) {
    var ids = checkedIds("claimSel");
    if (ids.length !== 2) { $("assertMsg").textContent = "請恰好勾選兩筆主張。"; return; }
    var res = Engine.assertE3(state, type, ids);
    state = res.state;
    var a = res.assertion;
    if (a.ok) {
      $("assertMsg").textContent = type === "b"
        ? "斷言成立：只換球重，規律仍然不變。"
        : "斷言成立：換了傾角，規律的形式仍然不變。";
    } else {
      $("assertMsg").textContent = "斷言不成立:" + a.reason + (a.diff.length ? "——實際相異變因:" + a.diff.join("、") : "");
    }
    renderAll();
  }
  $("btnAssertB").onclick = function () { doAssert("b"); };
  $("btnAssertC").onclick = function () { doAssert("c"); };

  /* ---------- 辯論廳 ---------- */
  $("selEvidence").onchange = function () {
    $("subitemWrap").style.display = (this.value === "E3") ? "" : "none";
  };

  $("btnPresent").onclick = function () {
    var ev = $("selEvidence").value;
    var sub = (ev === "E3") ? $("selSubitem").value : null;
    var target = $("selTarget").value;
    var res = Engine.present(state, { evidence: ev, subitem: sub, target: target });
    state = res.state;
    var evidenceName = $("selEvidence").options[$("selEvidence").selectedIndex].textContent;
    var subName = sub ? $("selSubitem").options[$("selSubitem").selectedIndex].textContent.replace(/^[abc]\s+/, "") : "";
    var targetName = $("selTarget").options[$("selTarget").selectedIndex].textContent;
    var label = "【出示】" + evidenceName + (subName ? "・" + subName : "") + " → " + targetName + "：";
    switch (res.outcome) {
      case "correct":
        log(label + " 命中要害。第二句證詞被擊破，目的論支柱崩塌。");
        break;
      case "insufficient":
        log(label + " 方向對,但不足。" + DEBATE.statements[1].insufficient.reply + "(量表不減)");
        break;
      case "wrong":
        log(label + " " + DEBATE.texts.absorb + "(說服力 −1)");
        break;
      case "suspended":
        log(label + " " + DEBATE.texts.absorb + "(說服力 −1)\n【辯論中止】" + DEBATE.texts.suspendHint + "\n(證據與主張完整保留,回實驗台補強後可再入辯論)");
        break;
      case "suspended_block":
        log("(辯論已中止——請先按「再入辯論」)");
        break;
      case "already_broken":
        log("(支柱已破裂,辯論結束)");
        break;
    }
    renderAll();
  };

  $("btnReenter").onclick = function () {
    var res = Engine.reenterDebate(state);
    if (res.error) { log("(" + res.error + ")"); return; }
    state = res.state;
    log("【再入辯論】說服力重置為 5;證詞狀態保留。");
    renderAll();
  };

  renderAll();
})();
