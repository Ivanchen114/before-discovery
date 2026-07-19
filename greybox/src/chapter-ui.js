/* src/chapter-ui.js — 章節表現層。狀態變更一律經 Narrative 純函式;本檔只管輸入與渲染。
   存檔:localStorage 鍵 bd_ch1_save(R-SAV-01~03);每步自動存。 */
(function () {
  "use strict";
  var N = window.GB.Narrative;
  var SCENES = window.GB.DATA.scenes;
  var KEY = "bd_ch1_save";
  var state = null;
  var lastSceneShown = null;
  var newConfirm = false;

  function $(id) { return document.getElementById(id); }

  /* ---------- 存檔(R-SAV) ---------- */
  function save() {
    try { localStorage.setItem(KEY, N.serialize(state)); } catch (e) { /* 隱私模式等:不阻斷遊玩 */ }
  }
  function tryLoad() {
    var text = null;
    try { text = localStorage.getItem(KEY); } catch (e) { return null; }
    if (!text) return null;
    try { return N.deserialize(text); }
    catch (e) {
      try { localStorage.setItem(KEY + "_corrupt", text); localStorage.removeItem(KEY); } catch (e2) {}
      return null; /* R-SAV-02:壞檔改鍵備份,不靜默覆蓋 */
    }
  }

  /* ---------- 渲染 ---------- */
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
  function renderStatus() {
    $("repVal").textContent = state.rep;
    $("modeVal").textContent = "模式:" + (state.mode === "scholar" ? "學者" : "探索");
    $("sceneVal").textContent = "場景:" + state.cursor.scene;
    var names = SCENES.evidenceNames || {};
    var got = Object.keys(state.evidence).filter(function (k) { return state.evidence[k]; });
    $("evidenceList").textContent = got.length
      ? got.map(function (k) { return k + " " + (names[k] || ""); }).join("、")
      : "(尚無)";
  }
  function rebuildLog() {
    $("log").innerHTML = "";
    lastSceneShown = null;
    state.transcript.forEach(function (e) {
      sceneHeading(e.scene);
      addLine(e.speaker, e.text, classFor(e.speaker));
    });
  }

  function renderControls() {
    var box = $("controls");
    box.innerHTML = "";
    var v = N.view(state);
    sceneHeading(v.scene);
    if (v.type === "end" || state.ended) {
      addLine("system", "——本段落結束。感謝試玩 M1;請回標題或關閉頁面(進度已存)。", "system");
      save();
      renderStatus();
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
          state = r.state;
          addLine("旅人(你)", o.text, "player");
          save(); renderStatus(); renderControls();
        };
        box.appendChild(b);
      });
    } else {
      var btn = document.createElement("button");
      btn.textContent = "▶ 繼續";
      btn.onclick = function () {
        var r = N.advance(state);
        if (r.error) { addLine("system", r.error, "system"); return; }
        state = r.state;
        if (r.node) addLine(r.node.speaker, r.node.text, classFor(r.node.speaker));
        save(); renderStatus(); renderControls();
      };
      box.appendChild(btn);
      btn.focus();
    }
    renderStatus();
  }

  function startGame(fromState) {
    state = fromState;
    $("title-screen").style.display = "none";
    $("game-screen").style.display = "";
    rebuildLog();
    renderControls();
  }

  /* ---------- 標題畫面 ---------- */
  function initTitle() {
    var loaded = tryLoad();
    $("continueWrap").style.display = loaded ? "" : "none";
    if (loaded) {
      $("btnContinue").onclick = function () { startGame(loaded); };
    }
    $("btnNew").onclick = function () {
      if (loaded && !newConfirm) { /* R-SAV-03 二次確認 */
        newConfirm = true;
        $("newWarn").style.display = "";
        return;
      }
      var mode = document.querySelector("input[name=mode]:checked").value;
      startGame(N.initialState(mode));
      save();
    };
    $("btnBackTitle").onclick = function () {
      save();
      location.reload();
    };
  }

  initTitle();
})();
