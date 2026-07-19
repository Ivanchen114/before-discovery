/* src/chapter-ui.js — 章節表現層(M3:實驗台+辯論廳+章末回顧+史實頁)。
   狀態變更一律經 Narrative 純函式;本檔只管輸入與渲染。存檔鍵 bd_ch1_save(schema 3)。 */
(function () {
  "use strict";
  var N = window.GB.Narrative;
  var SCENES = window.GB.DATA.scenes;
  var PATTERNS = window.GB.DATA.patterns;
  var HIST = window.GB.DATA.histfacts;
  var ASSETS = window.GB.DATA.assets || null;
  var KEY = "bd_ch1_save";
  var state = null;
  var lastSceneShown = null;
  var lastEmbedKey = null;
  var newConfirm = false;

  function $(id) { return document.getElementById(id); }
  function fmt(v) { return (Math.round(v * 10) / 10).toFixed(1); }
  function cfgLabel(c) { return c.ball + "·" + c.surface + "·" + c.incline + "·" + c.timer; }

  /* ---------- 存檔 ---------- */
  function save() { try { localStorage.setItem(KEY, N.serialize(state)); } catch (e) {} }
  function tryLoad() { /* B-3/R-SAV-02:壞檔備份+一次性非阻塞提示 */
    var text = null;
    try { text = localStorage.getItem(KEY); } catch (e) { return null; }
    var r = N.loadSave(text);
    if (r.empty) return null;
    if (r.error) {
      try { localStorage.setItem(KEY + "_corrupt", text); localStorage.removeItem(KEY); } catch (e2) {}
      var warn = $("newWarn");
      warn.style.display = "";
      warn.textContent = "偵測到無法讀取的舊進度(" + (r.error === "schema" ? "版本不符" : "檔案損壞") + "),已備份;請開新遊戲。";
      return null;
    }
    return r.state;
  }
  function setState(s) {
    state = s;
    var rd = N.redirectIfLocked(state);
    if (rd.redirected) {
      state = rd.state;
      addLine("system", "(信譽歸零——關鍵人物暫時拒絕與你交談。)", "system");
      lastSceneShown = null;
    }
    save();
  }

  /* ---------- 美術資產掛點(§5.9;path=null 全面 fallback,灰盒不變) ---------- */
  function assetEntry(id) {
    if (!ASSETS || !id) return null;
    var hit = null;
    ASSETS.entries.forEach(function (e) { if (e.id === id) hit = e; });
    return (hit && hit.path) ? hit : null;
  }
  function assetUrl(e) { return ASSETS.basePath + e.path; }
  function buildPortrait(e, alt) { /* ART-ADR-001 混合制:base+臉層(母版座標→百分比定位) */
    if (!e.layers || !e.layers.length) {
      var img = document.createElement("img");
      img.src = assetUrl(e); img.alt = alt || e.label || e.id; img.className = "portrait";
      img.loading = "lazy";
      return img;
    }
    var wrap = document.createElement("span");
    wrap.className = "composite";
    wrap.style.position = "relative"; wrap.style.display = "inline-block";
    var base = document.createElement("img");
    base.src = assetUrl(e); base.alt = alt || e.label || e.id;
    base.style.display = "block"; base.style.width = "100%";
    wrap.appendChild(base);
    e.layers.forEach(function (L) {
      if (!L.path) return;
      var li = document.createElement("img");
      li.src = ASSETS.basePath + L.path; li.alt = "";
      li.style.position = "absolute";
      li.style.left = (100 * L.anchorX / e.w) + "%";
      li.style.top = (100 * L.anchorY / e.h) + "%";
      li.style.width = (100 * L.w / e.w) + "%";
      wrap.appendChild(li);
    });
    return wrap;
  }

  /* ---------- 敘事渲染 ---------- */
  function addLine(speaker, text, cls) {
    var div = document.createElement("div");
    div.className = "line " + (cls || "");
    if (speaker && cls !== "stage" && cls !== "system") {
      if (ASSETS && ASSETS.speakerPortrait) {
        var pe = assetEntry(ASSETS.speakerPortrait[speaker]);
        if (pe) div.appendChild(buildPortrait(pe, speaker));
      }
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
    if (ASSETS && ASSETS.sceneBg) { /* 場景橫幅:資產落地即顯示 */
      var bg = assetEntry(ASSETS.sceneBg[sceneId]);
      if (bg) {
        var img = document.createElement("img");
        img.src = assetUrl(bg); img.alt = bg.label || "";
        img.className = "scene-banner";
        img.loading = "lazy";
        $("log").appendChild(img);
      }
    }
  }
  function rebuildLog() {
    $("log").innerHTML = "";
    lastSceneShown = null;
    state.transcript.forEach(function (e) {
      sceneHeading(e.scene);
      addLine(e.speaker, e.text, classFor(e.speaker));
    });
  }
  function syncNewTranscript(prevLen) {
    for (var i = prevLen; i < state.transcript.length; i++) {
      var e = state.transcript[i];
      sceneHeading(e.scene);
      addLine(e.speaker, e.text, classFor(e.speaker));
    }
  }
  function renderStatus() {
    $("repVal").textContent = state.rep;
    $("dayVal").textContent = state.lab.days;
    var e3 = state.lab.evidence.e3;
    $("e3Val").textContent = "E3:a" + (e3.a ? "●" : "○") + "b" + (e3.b ? "●" : "○") + "c" + (e3.c ? "●" : "○");
    $("perVal").textContent = state.debate ? ("說服力:" + state.debate.persuasion + "/5") : "";
    $("modeVal").textContent = "模式:" + (state.mode === "scholar" ? "學者" : "探索");
    $("sceneVal").textContent = "場景:" + state.cursor.scene;
    var names = SCENES.evidenceNames || {};
    var got = Object.keys(state.evidence).filter(function (k) { return state.evidence[k]; });
    $("evidenceList").textContent = got.length
      ? got.map(function (k) { return k + " " + (names[k] || ""); }).join("、")
      : "(尚無)";
  }

  /* ---------- 實驗台 ---------- */
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
    }, function (t) { return state.mode === "scholar" || t !== "音格"; });
    /* 斷言按鈕可見性改由當前 embed 需求決定(verification A 級):見 renderAll 之 incline 分支 */
  }
  function updateAssertButtons(v) { /* 依 embed until 決定,不看模式(E3.c 雙模式必經) */
    var nodeDef = N._sceneMap[v.scene] && N._sceneMap[v.scene].nodes[v.nodeId];
    var until = (nodeDef && nodeDef.until) || {};
    var needC = until.e3 === "c";
    $("labAssertC").style.display = (needC || state.mode === "scholar") ? "" : "none";
    $("labAssertB").style.display = needC ? "none" : ""; /* C 階段隱藏 B,避免選錯工具 */
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
      addLine("system", "(互動段落完成)", "system");
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
    if (v.type === "embed" && v.system === "incline") renderEmbedGate(v);
    else renderAll();
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

  /* ---------- 辯論廳 ---------- */
  function doDebate(fn, args) {
    var prevLen = state.transcript.length;
    var r = N[fn].apply(null, [state].concat(args));
    if (r.error) { addLine("system", "(" + r.error + ")", "system"); return; }
    setState(r.state);
    syncNewTranscript(prevLen);
    renderAll();
  }
  function mkBtn(box, text, onclick, disabled) {
    var b = document.createElement("button");
    b.textContent = text;
    if (disabled) b.disabled = true;
    b.onclick = onclick;
    box.appendChild(b);
    return b;
  }
  function renderDebate(v, box) {
    var d = v.debate;
    if (!d) { box.textContent = "(辯論尚未初始化)"; return; }
    var head = document.createElement("p");
    head.textContent = "支柱:" + d.pillarSummary.map(function (p) {
      return p.id + (p.broken ? "✕(已破)" : "○");
    }).join(" ") + "|說服力:" + "●".repeat(d.persuasion) + "○".repeat(Math.max(0, 5 - d.persuasion));
    box.appendChild(head);

    if (d.status === "suspended") {
      var pS = document.createElement("p");
      pS.textContent = "辯論已中止——證據與已破支柱保留。";
      box.appendChild(pS);
      mkBtn(box, "離場(回實驗室補證據)", function () { doDebate("debateExitSuspended", []); });
      return;
    }
    if (d.status === "won" || d.phase === "won") {
      var pW = document.createElement("p");
      pW.textContent = "支柱盡破,最後反撲已破——收束辯論。";
      box.appendChild(pW);
      mkBtn(box, "▶ 繼續劇情(判定)", function () {
        var r = N.embedComplete(state);
        if (r.error) { addLine("system", r.error, "system"); return; }
        setState(r.state);
        renderAll();
      });
      return;
    }
    if (d.phase === "pillars") {
      var pT = document.createElement("p");
      pT.textContent = "當前:" + d.pillar.title;
      box.appendChild(pT);
      d.statements.forEach(function (st) {
        var row = document.createElement("div");
        row.className = "line" + (st.status === "broken" ? " broken" : "");
        var span = document.createElement("span");
        span.textContent = st.id + " " + st.text + " ";
        row.appendChild(span);
        if (st.status !== "broken" && !d.pressChoice) {
          mkBtn(row, "追問", function () { doDebate("debatePress", [st.id]); });
        }
        box.appendChild(row);
      });
      if (d.pressChoice) {
        var pc = document.createElement("p");
        pc.textContent = d.pressChoice.prompt;
        box.appendChild(pc);
        d.pressChoice.options.forEach(function (o) {
          mkBtn(box, o.text, function () { doDebate("debatePressChoice", [o.id]); });
        });
        return;
      }
      /* 出示表單 */
      var form = document.createElement("p");
      form.appendChild(document.createTextNode("出示:"));
      var evSel = document.createElement("select");
      ["E1", "E2", "E3", "E4", "S1", "S2"].forEach(function (ev) {
        if (ev === "E3" || state.evidence[ev]) {
          var o = document.createElement("option"); o.value = ev; o.textContent = ev; evSel.appendChild(o);
        }
      });
      evSel.setAttribute("aria-label", "選擇證據");
      var subSel = document.createElement("select");
      var e3lit = state.lab.evidence.e3; /* A-1:只列已取得子項(所有權=引擎 ownsEvidence 同語義) */
      [["a", "a 規律成立"], ["b", "b 與球重無關"], ["c", "c 隨傾角形式不變"]].forEach(function (p) {
        if (!e3lit[p[0]]) return;
        var o = document.createElement("option"); o.value = p[0]; o.textContent = p[1]; subSel.appendChild(o);
      });
      subSel.setAttribute("aria-label", "E3 子項");
      subSel.style.display = "";
      evSel.onchange = function () { subSel.style.display = (evSel.value === "E3") ? "" : "none"; };
      var tgSel = document.createElement("select");
      d.statements.forEach(function (st) {
        if (st.status !== "broken") {
          var o = document.createElement("option"); o.value = st.id; o.textContent = "→ " + st.id; tgSel.appendChild(o);
        }
      });
      tgSel.setAttribute("aria-label", "目標證詞");
      form.appendChild(evSel); form.appendChild(subSel); form.appendChild(tgSel);
      box.appendChild(form);
      mkBtn(box, "出示", function () {
        var sub = (evSel.value === "E3") ? subSel.value : null;
        doDebate("debatePresent", [{ evidence: evSel.value, subitem: sub, target: tgSel.value }]);
      });
      return;
    }
    if (d.phase === "trap") {
      var pTr = document.createElement("p");
      pTr.textContent = d.trap.prompt;
      box.appendChild(pTr);
      d.trap.options.forEach(function (o) {
        mkBtn(box, o.text, function () { doDebate("debateFr", [o.id]); });
      });
      return;
    }
    if (d.phase === "fr") {
      var pF = document.createElement("p");
      pF.textContent = d.fr.prompt;
      box.appendChild(pF);
      if (d.fr.kind === "explore") {
        d.fr.options.forEach(function (o) {
          mkBtn(box, o.text, function () { doDebate("debateFr", [o.id]); });
        });
      } else {
        var slotP = document.createElement("p");
        slotP.textContent = "已組:" + (d.fr.slots.length ? d.fr.slots.join(" → ") : "(空)") + "/3";
        box.appendChild(slotP);
        d.fr.pool.forEach(function (o) {
          mkBtn(box, o.text, function () { doDebate("debateFr", [o.id]); }, d.fr.slots.indexOf(o.id) >= 0);
        });
      }
    }
  }

  /* ---------- 主渲染 ---------- */
  function renderAll() {
    renderStatus();
    var v = N.view(state);
    sceneHeading(v.scene);
    var box = $("controls");
    box.innerHTML = "";
    if (v.type === "embed" && v.system === "incline") {
      $("lab").style.display = "";
      $("labHint").textContent = v.hint || "";
      var ek = v.scene + "/" + v.nodeId;
      if (ek !== lastEmbedKey) {
        lastEmbedKey = ek;
        if (v.preset) {
          Object.keys(v.preset).forEach(function (k) {
            var map = { ball: "labBall", surface: "labSurface", incline: "labIncline", timer: "labTimer" };
            if (map[k]) $(map[k]).value = v.preset[k];
          });
        }
      }
      updateAssertButtons(v);
      renderLabTables();
      renderEmbedGate(v);
      return;
    }
    $("lab").style.display = "none";
    if (v.type === "embed" && v.system === "debate") {
      renderDebate(v, box);
      return;
    }
    if (v.type === "review") {
      var p = document.createElement("p");
      p.textContent = "旅人筆記・回顧(自由作答,只存檔,不評分):";
      box.appendChild(p);
      var tas = v.prompts.map(function (q) {
        var lab = document.createElement("label");
        lab.style.display = "block";
        lab.appendChild(document.createTextNode(q));
        var ta = document.createElement("textarea");
        ta.rows = 2; ta.style.width = "95%";
        lab.appendChild(document.createElement("br"));
        lab.appendChild(ta);
        box.appendChild(lab);
        return ta;
      });
      mkBtn(box, "寫入筆記", function () {
        var r = N.setReview(state, tas[0].value, tas[1].value);
        if (r.error) { addLine("system", r.error, "system"); return; }
        setState(r.state);
        addLine("system", "旅人在筆記上寫下自己的答案。", "system");
        renderAll();
      });
      return;
    }
    if (v.type === "histfacts") {
      var h = document.createElement("p");
      h.innerHTML = "<b>" + HIST.title + "</b>(透明揭露:哪些是史實、哪些是傳說或改編)";
      box.appendChild(h);
      var tbl = document.createElement("table");
      HIST.rows.forEach(function (row) { /* R-END-02:{item,label,note},label ∈ enum */
        var tr = document.createElement("tr");
        [row.label, row.item, row.note || ""].forEach(function (cell, ci) {
          var td = document.createElement("td");
          td.style.textAlign = "left";
          if (ci === 0) td.style.fontWeight = "bold";
          td.textContent = cell;
          tr.appendChild(td);
        });
        tbl.appendChild(tr);
      });
      box.appendChild(tbl);
      mkBtn(box, "▶ 繼續", function () {
        var r = N.advance(state);
        if (r.error) { addLine("system", r.error, "system"); return; }
        setState(r.state);
        renderAll();
      });
      return;
    }
    if (v.type === "end" || state.ended) { /* B-4:終幕文字由 scenes 資料單一來源輸出,UI 僅補狀態行 */
      addLine("system", "(進度已存。總耗天數:" + state.lab.days + " 天。)", "system");
      save();
      return;
    }
    if (v.type === "choice") {
      var pc = document.createElement("p");
      pc.textContent = v.prompt;
      box.appendChild(pc);
      v.options.forEach(function (o) {
        mkBtn(box, o.text, function () {
          var r = N.choose(state, o.id);
          if (r.error) { addLine("system", r.error, "system"); return; }
          setState(r.state);
          addLine("旅人(你)", o.text, "player");
          renderAll();
        });
      });
    } else {
      var btn = mkBtn(box, "▶ 繼續", function () {
        var r = N.advance(state);
        if (r.error) { addLine("system", r.error, "system"); return; }
        setState(r.state);
        if (r.node) addLine(r.node.speaker, r.node.text, classFor(r.node.speaker));
        renderAll();
      });
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
