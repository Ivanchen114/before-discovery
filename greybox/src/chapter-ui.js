/* src/chapter-ui.js — 章節表現層(M2:含實驗台 embed)。
   狀態變更一律經 Narrative/labAction 純函式;本檔只管輸入與渲染。
   存檔:localStorage 鍵 bd_ch1_save(schema 2);每步自動存;信譽歸零由 redirectIfLocked 導入 SC-R1。 */
(function () {
  "use strict";
  var N = window.GB.Narrative;
  var SCENES = window.GB.DATA.scenes;
  var PATTERNS = window.GB.DATA.patterns;
  var KEY = "bd_ch1_save";
  var state = null;
  var lastSceneShown = null;
  var lastEmbedKey = null;
  var newConfirm = false;

  function $(id) { return document.getElementById(id); }
  function fmt(v) { return (Math.round(v * 10) / 10).toFixed(1); }
  function cfgLabel(c) { return c.ball + "·" + c.surface + "·" + c.incline + "·" + c.timer; }

  /* ---------- 存檔 ---------- */
  function save() {
    try { localStorage.setItem(KEY, N.serialize(state)); } catch (e) {}
  }
  function tryLoad() {
    var text = null;
    try { text = localStorage.getItem(KEY); } catch (e) { return null; }
    if (!text) return null;
    try { return N.deserialize(text); }
    catch (e) {
      try { localStorage.setItem(KEY + "_corrupt", text); localStorage.removeItem(KEY); } catch (e2) {}
      return null;
    }
  }

  /* ---------- 中央狀態更新(含 R-REP-02 導流) ---------- */
  function setState(s) {
    state = s;
    var rd = N.redirectIfLocked(state);
    if (rd.redirected) {
      state = rd.state;
      addLine("system", "(信譽歸零——關鍵人物暫時拒絕與你交談。)", "system");
    }
    save();
  }

  /* ---------- 敘事渲染 ---------- */
  function addLine(speaker, text, cls) {
    var div = document.createElement("div");
    div.className = "line " + (cls || "");
    if (speaker && cls !== "stage" && cls !== "system") {
      var b = document.createElement("span"); b.className = "spk"; b.textContent = speaker + ":";
      div.appendChild(b);
    }
    var t = document.createElement("span"); t.textContent = text;
    div.appendChild(t);
    $("log").appendChild(div);
    div.scrollIntoView({ block: "nearest" });
  }
  function classFor(speaker) {
    if (speaker === "stage") return "stage";
    if (speaker === "system") return "system";
    if (speaker === "旅人(你)") return "player";
    return "";
  }
  function sceneHeading(sceneId) {
    if (sceneId === lastSceneShown) return;
    lastSceneShown = sceneId;
    var sc = null;
    SCENES.scenes.forEach(function (s) { if (s.id === sceneId) sc = s; });
    var div = document.createElement("div");
    div.className = "scene-title";
    div.textContent = "◆ " + sceneId + (sc && sc.title ? "|" + sc.title : "");
    $("log").appendChild(div);
  }
  function rebuildLog() {
    $("log").innerHTML = "";
    lastSceneShown = null;
    state.transcript.forEach(function (e) {
      sceneHeading(e.scene);
      addLine(e.speaker, e.text, classFor(e.speaker));
    });
  }
  function renderStatus() {
    $("repVal").textContent = state.rep;
    $("dayVal").textContent = state.lab.days;
    var e3 = state.lab.evidence.e3;
    $("e3Val").textContent = "E3:a" + (e3.a ? "●" : "○") + "b" + (e3.b ? "●" : "○") + "c" + (e3.c ? "●" : "○");
    $("modeVal").textContent = "模式:" + (state.mode === "scholar" ? "學者" : "探索");
    $("sceneVal").textContent = "場景:" + state.cursor.scene;
    var names = SCENES.evidenceNames || {};
    var got = Object.keys(state.evidence).filter(function (k) { return state.evidence[k]; });
    $("evidenceList").textContent = got.length
      ? got.map(function (k) { return k + " " + (names[k] || ""); }).join("、")
      : "(尚無)";
  }

  /* ---------- 實驗台(embed)渲染 ---------- */
  function fillSelect(id, keys, labelFn, filterFn) {
    var sel = $(id);
    sel.innerHTML = "";
    keys.filter(function (k) { return !filterFn || filterFn(k); }).forEach(function (k) {
      var o = document.createElement("option");
      o.value = k; o.textContent = labelFn ? labelFn(k) : k;
      sel.appendChild(o);
    });
  }
  function initLabSelects() {
    fillSelect("labBall", Object.keys(PATTERNS.ball));
    fillSelect("labSurface", Object.keys(PATTERNS.surface));
    fillSelect("labIncline", Object.keys(PATTERNS.base));
    fillSelect("labTimer", Object.keys(PATTERNS.timer), function (t) {
      return t + "(" + PATTERNS.dayCost[t] + " 天/次)";
    }, function (t) {
      /* R-MODE-02:音格=學者模式限定,探索模式不出現於選單 */
      return state.mode === "scholar" || t !== "音格";
    });
    $("labAssertC").style.display = (state.mode === "scholar") ? "" : "none";
  }
  function checkedIds(cls) {
    return Array.prototype.map.call(document.querySelectorAll("." + cls + ":checked"), function (el) {
      return parseInt(el.dataset.id, 10);
    });
  }
  function snapshotChecked(cls) {
    var keep = {};
    Array.prototype.forEach.call(document.querySelectorAll("." + cls), function (el) {
      if (el.checked) keep[el.dataset.id] = true;
    });
    return keep;
  }
  function renderLabTables() {
    var keepR = snapshotChecked("labRunSel");
    var tb = $("labRunsBody"); tb.innerHTML = "";
    state.lab.evidence.runs.forEach(function (r) {
      var tr = document.createElement("tr");
      var name = "選取 run #" + r.id + "(" + cfgLabel(r.config) + ")";
      tr.innerHTML = "<td><input type='checkbox' class='labRunSel' data-id='" + r.id + "' aria-label='" + name + "'></td>" +
        "<td>#" + r.id + "</td><td>" + cfgLabel(r.config) + "</td>" +
        r.readings.map(function (v) { return "<td>" + fmt(v) + "</td>"; }).join("") +
        "<td>" + r.day + "</td>";
      tb.appendChild(tr);
      tr.querySelector("input").checked = !!keepR[r.id];
    });
    var keepC = snapshotChecked("labClaimSel");
    var tc = $("labClaimsBody"); tc.innerHTML = "";
    state.lab.inference.claims.forEach(function (c) {
      var tr = document.createElement("tr");
      var name = "選取主張 #" + c.id + "(" + cfgLabel(c.config) + "," + (c.ok ? "成立" : "不成立") + ")";
      tr.innerHTML = "<td><input type='checkbox' class='labClaimSel' data-id='" + c.id + "' aria-label='" + name + "'></td>" +
        "<td>#" + c.id + "</td><td>" + cfgLabel(c.config) + "</td>" +
        "<td>" + fmt(c.prediction) + "</td><td>" + (c.ok ? "成立" : "不成立") + "</td><td>" + c.day + "</td>";
      tc.appendChild(tr);
      tr.querySelector("input").checked = !!keepC[c.id];
    });
  }
  function renderEmbedGate(v) {
    var gate = $("embedGate");
    gate.innerHTML = "";
    var ready = N.embedReady(state);
    var btn = document.createElement("button");
    btn.textContent = ready ? "▶ 繼續劇情" : "(未達成:" + (v.hint || "完成實驗台目標") + ")";
    btn.disabled = !ready;
    btn.onclick = function () {
      var r = N.embedComplete(state);
      if (r.error) { $("labMsg").textContent = r.error; return; }
      setState(r.state);
      addLine("system", "(實驗台段落完成)", "system");
      renderAll();
    };
    gate.appendChild(btn);
  }
  function doLab(action, args, msgEl, okMsg) {
    var r = N.labAction(state, action, args);
    if (r.error) { $(msgEl).textContent = r.error; return null; }
    setState(r.state);
    if (okMsg) $(msgEl).textContent = okMsg(r.result);
    renderStatus(); renderLabTables();
    var v = N.view(state);
    if (v.type === "embed") renderEmbedGate(v);
    else renderAll(); /* SC-R1 導流等情形 */
    return r.result;
  }
  function bindLabButtons() {
    $("labRun").onclick = function () {
      var config = { ball: $("labBall").value, surface: $("labSurface").value, incline: $("labIncline").value, timer: $("labTimer").value };
      doLab("run", { config: config }, "labMsg", function (res) {
        return "run #" + res.run.id + " 完成(" + cfgLabel(res.run.config) + ",第 " + res.run.seq + " 次):" +
          res.run.readings.map(fmt).join(" / ");
      });
    };
    $("labJudge").onclick = function () {
      var ids = checkedIds("labRunSel");
      var pred = parseFloat($("labPred").value);
      if (!ids.length) { $("judgeMsg").textContent = "請先勾選 1–3 筆 run。"; return; }
      if (isNaN(pred)) { $("judgeMsg").textContent = "請輸入第五段增量之預測值。"; return; }
      doLab("judge", { runIds: ids, prediction: pred }, "judgeMsg", function (res) {
        if (res.rejected) return res.rejected.reason + (res.rejected.diff.length ? "——相異變因:" + res.rejected.diff.join("、") : "");
        var c = res.claim;
        if (c.ok) return "主張 #" + c.id + " 成立(" + cfgLabel(c.config) + ")。";
        var parts = [];
        if (!c.predHit) parts.push("預測未中(偏差 " + (c.predDev * 100).toFixed(1) + "%)");
        if (!c.consistent) parts.push("選集內部不一致(最大偏差 " + (c.maxDev * 100).toFixed(1) + "%)");
        return "主張 #" + c.id + " 不成立:" + parts.join(";") + "。";
      });
    };
    function doAssert(type) {
      var ids = checkedIds("labClaimSel");
      if (ids.length !== 2) { $("assertMsg").textContent = "請恰好勾選兩筆主張。"; return; }
      doLab("assert", { type: type, claimIds: ids }, "assertMsg", function (res) {
        var a = res.assertion;
        if (a.ok) return "斷言成立:E3." + type + " 點亮。";
        return "斷言不成立:" + a.reason + (a.diff.length ? "——實際相異變因:" + a.diff.join("、") : "");
      });
    }
    $("labAssertB").onclick = function () { doAssert("b"); };
    $("labAssertC").onclick = function () { doAssert("c"); };
  }

  /* ---------- 主渲染 ---------- */
  function renderAll() {
    renderStatus();
    var v = N.view(state);
    sceneHeading(v.scene);
    var box = $("controls");
    box.innerHTML = "";
    if (v.type === "embed") {
      $("lab").style.display = "";
      $("labHint").textContent = v.hint || "";
      var ek = v.scene + "/" + v.nodeId;
      if (ek !== lastEmbedKey) { /* R-HOOK-01 預選(僅入場時,不鎖自由度) */
        lastEmbedKey = ek;
        if (v.preset) {
          Object.keys(v.preset).forEach(function (k) {
            var map = { ball: "labBall", surface: "labSurface", incline: "labIncline", timer: "labTimer" };
            if (map[k]) $(map[k]).value = v.preset[k];
          });
        }
      }
      renderLabTables();
      renderEmbedGate(v);
      return;
    }
    $("lab").style.display = "none";
    if (v.type === "end" || state.ended) {
      addLine("system", "——本段落結束(M2:第二幕終)。第三幕辯論於 M3 接上;進度已存。", "system");
      save();
      return;
    }
    if (v.type === "choice") {
      var p = document.createElement("p");
      p.textContent = v.prompt;
      box.appendChild(p);
      v.options.forEach(function (o) {
        var b = document.createElement("button");
        b.textContent = o.text;
        b.onclick = function () {
          var r = N.choose(state, o.id);
          if (r.error) { addLine("system", r.error, "system"); return; }
          setState(r.state);
          addLine("旅人(你)", o.text, "player");
          renderAll();
        };
        box.appendChild(b);
      });
    } else {
      var btn = document.createElement("button");
      btn.textContent = "▶ 繼續";
      btn.onclick = function () {
        var r = N.advance(state);
        if (r.error) { addLine("system", r.error, "system"); return; }
        setState(r.state);
        if (r.node) addLine(r.node.speaker, r.node.text, classFor(r.node.speaker));
        renderAll();
      };
      box.appendChild(btn);
      btn.focus();
    }
  }

  function startGame(fromState) {
    state = fromState;
    $("title-screen").style.display = "none";
    $("game-screen").style.display = "";
    initLabSelects();
    bindLabButtons();
    rebuildLog();
    lastEmbedKey = null;
    var rd = N.redirectIfLocked(state);
    if (rd.redirected) { state = rd.state; save(); }
    renderAll();
  }

  /* ---------- 標題畫面 ---------- */
  function initTitle() {
    var loaded = tryLoad();
    $("continueWrap").style.display = loaded ? "" : "none";
    if (loaded) $("btnContinue").onclick = function () { startGame(loaded); };
    $("btnNew").onclick = function () {
      if (loaded && !newConfirm) {
        newConfirm = true;
        $("newWarn").style.display = "";
        return;
      }
      var mode = document.querySelector("input[name=mode]:checked").value;
      startGame(N.initialState(mode));
      save();
    };
    $("btnBackTitle").onclick = function () { save(); location.reload(); };
  }

  initTitle();
})();
