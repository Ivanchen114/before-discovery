/* src/chapter-ui.js — 章節表現層(M3:實驗台+辯論廳+章末回顧+史實頁)。
   狀態變更一律經 Narrative 純函式;本檔只管輸入與渲染。存檔鍵 bd_ch1_save(schema 3)。 */
(function () {
  "use strict";
  var N = window.GB.Narrative;
  var SCENES = window.GB.DATA.scenes;
  var PATTERNS = window.GB.DATA.patterns;
  var HIST = window.GB.DATA.histfacts;
  var ASSETS = window.GB.DATA.assets || null;
  var DEBATE = window.GB.DATA.debate || {};
  var KEY = "bd_ch1_save";
  var state = null;
  var lastSceneShown = null;
  var lastEmbedKey = null;
  var newConfirm = false;
  var expandedRuns = {}; /* run 分組展開狀態(UI 記憶,不入存檔;資料保存性與可見密度分離) */
  var labCoachSeen = {}; /* 器材初見台詞:每次遊玩 session 各說一次,不污染科學狀態。 */

  var TIMER_PROFILE = {
    "脈搏": { short: "1 天｜抖動大", detail: "便宜，但人的心跳會亂；只有過程夠慢時，多測幾次才可能把亂跳平均掉。",
      coach: "我的心跳？激動時它也跟著跑。便宜——但你得多聽幾次。" },
    "水鐘": { short: "2 天｜較穩", detail: "緩坡與中坡可靠；過程太快時會產生固定方向的偏差，重複測量也洗不掉。",
      coach: "穩。只是坡太陡，短得只夠幾滴；那種偏差，多測幾次也不會自己消失。" },
    "音格": { short: "3 天｜最精確", detail: "以等距音點分割時間；成本最高，但能分辨陡坡的短促過程。",
      coach: "三天。歌要唱得勻，錢要花得狠——可陡坡需要這雙耳朵。" }
  };
  var BALL_COACH = { "木球": "你要跟一塊會喝水的木頭講道理？先想想，它和銅球只差重量嗎？" };

  function $(id) { return document.getElementById(id); }
  function fmt(v) { return (Math.round(v * 10) / 10).toFixed(1); }
  function cfgLabel(c) { return c.ball + "·" + c.surface + "·" + c.incline + "·" + c.timer; }

  /* ---------- 表現層事件掛點(§5.9 延伸:純發佈,無監聽者時零行為差異) ----------
     stage.html 的舞台殼(stage-ui.js)訂閱這些事件做打字機/背景/立繪;
     chapter.html 無訂閱者,灰盒行為不變。 */
  var replaying = false;
  function emit(name, detail) {
    try { document.dispatchEvent(new CustomEvent(name, { detail: detail })); } catch (e) {}
  }

  /* ---------- 存檔(B-4:失敗不得靜默——持續警示,提示改用書信碼) ---------- */
  function save() {
    var warn = $("saveWarn");
    try {
      localStorage.setItem(KEY, N.serialize(state));
      if (warn) warn.hidden = true;
    } catch (e) {
      if (warn) warn.hidden = false;
    }
  }
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
    emit("bd:line", { speaker: speaker || null, text: text, cls: cls || "", replay: replaying });
  }
  function classFor(speaker) {
    if (speaker === "stage") return "stage";
    if (speaker === "system") return "system";
    if (speaker === "旅人(你)") return "player";
    return "";
  }
  function sceneHeading(sceneId) {
    emit("bd:scene", { sceneId: sceneId });
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
    replaying = true;
    state.transcript.forEach(function (e) {
      sceneHeading(e.scene);
      addLine(e.speaker, e.text, classFor(e.speaker));
    });
    replaying = false;
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
    /* 進度揭露(原則 #2:名詞是戰利品):未動過實驗台前不顯示;白話標籤取代 E3:aObOcO 密碼 */
    var e3Started = state.lab.evidence.runs.length > 0 || e3.a || e3.b || e3.c;
    $("e3Val").textContent = e3Started
      ? "斜面主張:規律" + (e3.a ? "●" : "○") + " 重量" + (e3.b ? "●" : "○") + " 傾角" + (e3.c ? "●" : "○")
      : "";
    $("e3Val").title = "你要在斜面上親手立起的三個主張:規律成立/與球重無關/隨傾角形式不變。●=已認證——三顆全亮,終辯才有火力。";
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
      return t + "（" + TIMER_PROFILE[t].short + "）";
    }, function (t) { return state.mode === "scholar" || t !== "音格"; });
    updateLabToolProfile(false);
    /* 斷言按鈕可見性改由當前 embed 需求決定(verification A 級):見 renderAll 之 incline 分支 */
  }
  function showLabCoach(key, text) {
    var el = document.getElementById("labCoach");
    if (!el) return;
    if (labCoachSeen[key]) { el.hidden = true; return; }
    labCoachSeen[key] = true;
    el.textContent = text;
    el.hidden = false;
  }
  function updateLabToolProfile(speak) {
    var timer = $("labTimer").value;
    var p = TIMER_PROFILE[timer];
    var el = document.getElementById("labToolProfile");
    if (el && p) {
      el.textContent = "";
      var b = document.createElement("b");
      b.textContent = timer + "｜" + p.short + "。";
      el.appendChild(b);
      el.appendChild(document.createTextNode(p.detail));
    }
    if (speak && p) showLabCoach("timer:" + timer, p.coach);
  }
  function updateBallCoach() {
    var ball = $("labBall").value;
    if (BALL_COACH[ball]) showLabCoach("ball:" + ball, BALL_COACH[ball]);
    else {
      var el = document.getElementById("labCoach");
      if (el) el.hidden = true;
    }
  }
  function updateAssertButtons(v) { /* GB-ADR-011 斷言分段:實驗自由,斷言=劇情里程碑,等劇情提問才亮。
       stage a=只認證;b=亮「與球重無關」;c=亮「隨傾角形式不變」(雙模式必經,E3.c 契約不變);
       repairRun(SC-R1)=兩者皆隱;無 until 的自由段=B 開放、C 依學者。 */
    var nodeDef = N._sceneMap[v.scene] && N._sceneMap[v.scene].nodes[v.nodeId];
    var until = (nodeDef && nodeDef.until) || {};
    var stage = until.e3 || null;
    var showB = stage === "b" || (stage === null && !until.repairRun);
    var showC = stage === "c" || (stage === null && !until.repairRun && state.mode === "scholar");
    $("labAssertB").style.display = showB ? "" : "none";
    $("labAssertC").style.display = showC ? "" : "none";
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
    /* 依配置分組摺疊(Sol 審核 B-2):紀錄不可刪,但可見密度受控——
       未認證配置預設顯示最新 3 筆;已認證預設摺疊只留最後 1 筆;勾選永遠可見;
       摺疊=display 隱藏不動 DOM/state,judge/assert 守衛(讀勾選)零影響。 */
    var keepR = snapshotChecked("labRunSel");
    var tb = $("labRunsBody"); tb.innerHTML = "";
    var certified = {};
    state.lab.inference.claims.forEach(function (c) { if (c.ok) certified[cfgLabel(c.config)] = true; });
    var order = [], byCfg = {};
    state.lab.evidence.runs.forEach(function (r) {
      var k = cfgLabel(r.config);
      if (!byCfg[k]) { byCfg[k] = []; order.push(k); }
      byCfg[k].push(r);
    });
    order.forEach(function (k) {
      var list = byCfg[k];
      var isCert = !!certified[k];
      var open = !!expandedRuns[k];
      var defVis = isCert ? 1 : 3;
      var trH = document.createElement("tr");
      trH.className = "grphead";
      var td = document.createElement("td");
      td.colSpan = 8;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "grpToggle";
      btn.dataset.grp = k;
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.textContent = (open ? "▾ " : "▸ ") + k + "|共 " + list.length + " 筆|" +
        (isCert ? "已認證" : "未認證") +
        (open ? "|收合" : (list.length > defVis ? "|展開全部 " + list.length + " 筆" : ""));
      btn.onclick = function () {
        expandedRuns[k] = !open;
        renderLabTables();
        var nb = tbFind(k);
        if (nb) nb.focus(); /* 重繪後焦點回同組(鍵盤可操作) */
      };
      td.appendChild(btn); trH.appendChild(td); tb.appendChild(trH);
      list.forEach(function (r, i) {
        /* A-1:動態列一律 createElement+textContent,禁字串拼 innerHTML(匯入值不可信) */
        var tr = document.createElement("tr");
        var tdSel = document.createElement("td");
        var cb = document.createElement("input");
        cb.type = "checkbox"; cb.className = "labRunSel";
        cb.dataset.id = String(r.id);
        cb.setAttribute("aria-label", "選取 run #" + r.id + "(" + cfgLabel(r.config) + ")");
        tdSel.appendChild(cb); tr.appendChild(tdSel);
        [("#" + r.id), cfgLabel(r.config)].concat(r.readings.map(fmt)).concat([String(r.day)])
          .forEach(function (cell) {
            var td = document.createElement("td");
            td.textContent = cell;
            tr.appendChild(td);
          });
        tr.title = "第 " + r.day + " 天完成";
        var show = open || (i >= list.length - defVis) || !!keepR[r.id]; /* 勾選永遠可見 */
        if (!show) tr.style.display = "none";
        tb.appendChild(tr);
        tr.querySelector("input").checked = !!keepR[r.id];
      });
    });
    function tbFind(k) {
      var btns = tb.querySelectorAll("button.grpToggle");
      for (var i = 0; i < btns.length; i++) if (btns[i].dataset.grp === k) return btns[i];
      return null;
    }
    var keepC = snapshotChecked("labClaimSel");
    var tc = $("labClaimsBody"); tc.innerHTML = "";
    state.lab.inference.claims.forEach(function (c) {
      var tr = document.createElement("tr");
      var tdSel = document.createElement("td");
      var cb = document.createElement("input");
      cb.type = "checkbox"; cb.className = "labClaimSel";
      cb.dataset.id = String(c.id);
      cb.setAttribute("aria-label", "選取主張 #" + c.id + "(" + cfgLabel(c.config) + "," + (c.ok ? "成立" : "不成立") + ")");
      tdSel.appendChild(cb); tr.appendChild(tdSel);
      ["#" + c.id, cfgLabel(c.config), fmt(c.prediction), (c.ok ? "成立" : "不成立"), String(c.day)]
        .forEach(function (cell) {
          var td = document.createElement("td");
          td.textContent = cell;
          tr.appendChild(td);
        });
      tc.appendChild(tr);
      tr.querySelector("input").checked = !!keepC[c.id];
    });
    /* 舞台版漸進揭露；灰盒殼沒有這些容器，故全部為可選掛點。 */
    var secRuns = document.getElementById("secRuns");
    var secClaims = document.getElementById("secClaims");
    var empty = document.getElementById("labEmpty");
    if (secRuns) secRuns.hidden = state.lab.evidence.runs.length === 0;
    if (secClaims) secClaims.hidden = state.lab.inference.claims.length === 0;
    if (empty) empty.hidden = state.lab.evidence.runs.length > 0;
  }
  function friendlyLabGoal(v) { /* 凍結 hint 保留於資料層；玩家只看白話任務。 */
    var nodeDef = N._sceneMap[v.scene] && N._sceneMap[v.scene].nodes[v.nodeId];
    var until = (nodeDef && nodeDef.until) || {};
    if (until.e3 === "a") return "從四段數字找出規律，押中第五段，讓它成為你的第一筆主張。";
    if (until.e3 === "b") return "只換球的大小，做出兩筆成立紀錄，看看重量有沒有改變規律。";
    if (until.e3 === "c") return "只改斜面的傾角，再做一筆成立紀錄，看看規律的形狀會不會變。";
    if (until.repairRun) return "做完任意一次乾淨的實驗，把新紀錄帶回去。";
    return "自由檢查你的實驗簿。";
  }
  function lastFailedClaim() {
    var cs = state.lab.inference.claims;
    for (var i = cs.length - 1; i >= 0; i--) if (!cs[i].ok) return cs[i];
    return null;
  }
  function neutralLabObservation(c) {
    if (!c) return "把失敗拆開看：是前四段的數字不夠規整，還是第五段的預測沒有接上？";
    if (!c.consistent && !c.predHit) return "兩道門都沒過。先分開看數字本身的形狀，再看你的第五段預測。";
    if (!c.consistent) return "你的預測接得上，但前四段本身不夠規整。誤差是來回亂跳，還是次次往同一邊偏？";
    return "前四段站得住；問題只在第五段。你延伸的是整條規律，還是最後一段看起來增加了多少？";
  }
  function strongLabQuestion(c) {
    if (!c) return neutralLabObservation(c);
    var timer = c.config && c.config.timer;
    var incline = c.config && c.config.incline;
    if (!c.consistent && timer === "水鐘" && incline === "陡")
      return "伽利略：『陡坡只給水鐘幾滴。若每次都往同一邊歪，多測幾次救得了嗎？你要放緩斜面，還是換一把分得更細的鐘？』";
    if (!c.consistent)
      return "伽利略：『同一配置再看幾筆。若偏差忽左忽右，可以平均；若次次同向，就該換器材或改變時間尺度。你看到哪一種？』";
    return "伽利略：『把第一段當一份。第二、三、四段各有幾份？下一段該接的是這個形狀，不是最後一次增加的格數。』";
  }
  function renderLabAssist() {
    var wrap = document.getElementById("labAssist");
    var textEl = document.getElementById("labAssistText");
    var btn = document.getElementById("btnLabDiscuss");
    if (!wrap || !textEl || !btn) return;
    var streak = parseInt(state.flags.labFailStreak || "0", 10);
    var c = lastFailedClaim();
    wrap.hidden = streak < 2;
    if (streak < 2) return;
    var strong = streak >= 3 && state.mode === "explore";
    textEl.textContent = strong ? strongLabQuestion(c) : neutralLabObservation(c);
    btn.hidden = strong;
    btn.onclick = function () {
      textEl.textContent = strongLabQuestion(c);
      btn.hidden = true;
    };
  }
  function renderEmbedGate(v) {
    var gate = $("embedGate");
    gate.innerHTML = "";
    var ready = N.embedReady(state);
    gate.className = ready ? "ready" : "pending";
    if (!ready) {
      var status = document.createElement("div");
      status.className = "gateStatus";
      status.textContent = "實驗簿還缺關鍵的一筆——完成上方目標後，就能繼續。";
      gate.appendChild(status);
      return;
    }
    var btn = document.createElement("button");
    btn.textContent = v.scene === "SC-R1" ? "▶ 帶著新紀錄回去"
      : (v.nodeId === "e1" ? "▶ 讓伽利略看看這筆規律"
      : (v.nodeId === "e2" ? "▶ 把換球的結論說給他聽"
      : (v.nodeId === "e3c" ? "▶ 收好實驗簿，離開工作室" : "▶ 帶著主張繼續")));
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
    if (v.type === "embed" && v.system === "incline") { renderEmbedGate(v); renderLabAssist(); }
    else renderAll();
    return r.result;
  }
  function bindLabButtons() {
    $("labTimer").onchange = function () { updateLabToolProfile(true); };
    $("labBall").onchange = updateBallCoach;
    $("labRun").onclick = function () {
      var config = { ball: $("labBall").value, surface: $("labSurface").value, incline: $("labIncline").value, timer: $("labTimer").value };
      var out = doLab("run", { config: config }, "labMsg", function (res) {
        return "run #" + res.run.id + " 完成(" + cfgLabel(res.run.config) + ",第 " + res.run.seq + " 次):" +
          res.run.readings.map(fmt).join(" / ");
      });
      if (out && out.run) emit("bd:run", { run: out.run }); /* 表現層重播動畫掛點(無訂閱者=灰盒不變) */
    };
    $("labJudge").onclick = function () {
      var ids = checkedIds("labRunSel");
      var pred = parseFloat($("labPred").value);
      if (!ids.length) { $("judgeMsg").textContent = "請先勾選 1–3 筆 run。"; return; }
      if (isNaN(pred)) { $("judgeMsg").textContent = "請輸入第五段增量之預測值。"; return; }
      doLab("judge", { runIds: ids, prediction: pred }, "judgeMsg", function (res) {
        if (res.rejected) return res.rejected.reason + (res.rejected.diff.length ? "——相異變因:" + res.rejected.diff.join("、") : "");
        var c = res.claim;
        if (c.ok) return "主張 #" + c.id + " 成立（" + cfgLabel(c.config) + "）。\n" +
          "前四段形狀偏差 " + (c.maxDev * 100).toFixed(1) + "% ✓｜第五段預測偏差 " + (c.predDev * 100).toFixed(1) + "% ✓";
        return "主張 #" + c.id + " 未成立。\n" +
          "前四段形狀偏差 " + (c.maxDev * 100).toFixed(1) + "% " + (c.consistent ? "✓" : "✕") + "｜" +
          "第五段預測偏差 " + (c.predDev * 100).toFixed(1) + "% " + (c.predHit ? "✓" : "✕") + "\n" +
          "認證門檻：兩項皆須 ≤ 12.0%。";
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
  function evidenceLabel(code, subitem) {
    var names = SCENES.evidenceNames || {};
    if (code === "E3") {
      var subs = { a: "規律成立", b: "與球重無關", c: "隨傾角形式不變" };
      return (names.E3 || "斜面奇數律") + "・" + (subs[subitem] || subitem || "");
    }
    return names[code] || code;
  }
  function availableEvidenceCards() {
    var out = [];
    ["E1", "E2", "E4", "S1", "S2"].forEach(function (code) {
      if (state.evidence[code]) out.push({ evidence: code, subitem: null, label: evidenceLabel(code) });
    });
    ["a", "b", "c"].forEach(function (sub) {
      if (state.lab.evidence.e3[sub]) out.push({ evidence: "E3", subitem: sub, label: evidenceLabel("E3", sub) });
    });
    return out;
  }
  function renderPillarTrack(d, box) {
    var track = document.createElement("div");
    track.className = "debatePillars";
    track.setAttribute("aria-label", "理論的三根支柱");
    d.pillarSummary.forEach(function (p, i) {
      var el = document.createElement("div");
      el.className = "debatePillar " + (p.broken ? "isBroken" : (d.pillar && d.pillar.id === p.id ? "isCurrent" : ""));
      var no = document.createElement("span"); no.textContent = "第" + (i + 1) + "柱";
      var title = document.createElement("b"); title.textContent = (p.title || p.id).replace(/^第.支柱:/, "");
      el.appendChild(no); el.appendChild(title); track.appendChild(el);
    });
    var meter = document.createElement("div");
    meter.className = "debateMeter";
    meter.setAttribute("aria-label", "說服力 " + d.persuasion + " / 5");
    var mb = document.createElement("b"); mb.textContent = "說服力";
    var dots = document.createElement("span"); dots.textContent = "●".repeat(d.persuasion) + "○".repeat(Math.max(0, 5 - d.persuasion));
    meter.appendChild(mb); meter.appendChild(dots); track.appendChild(meter);
    box.appendChild(track);
  }
  function stmtHasGap(sid) { /* 探索模式「此句有隙」:資料層 weakTo 存在=可被證據檢驗;學者不標(Sol 分層案) */
    var CH = DEBATE.chapter || {};
    var pools = [];
    Object.keys(CH.pillars || {}).forEach(function (k) {
      if (CH.pillars[k].statements) pools.push(CH.pillars[k].statements);
    });
    pools.push(DEBATE.statements || []);
    for (var i = 0; i < pools.length; i++)
      for (var j = 0; j < pools[i].length; j++)
        if (pools[i][j].id === sid) return !!pools[i][j].weakTo;
    return false;
  }
  function renderDebate(v, box) {
    var d = v.debate;
    if (!d) { box.textContent = "(辯論尚未初始化)"; return; }
    emit("bd:debate", { /* 支柱破裂 FX 掛點(無訂閱者=灰盒不變) */
      broken: d.pillarSummary.filter(function (p) { return p.broken; }).map(function (p) { return p.id; }),
      persuasion: d.persuasion, status: d.status, phase: d.phase
    });
    box.className = "debateBoard";
    renderPillarTrack(d, box);

    if (d.status === "suspended") {
      var pS = document.createElement("p");
      pS.className = "debateSuspend";
      pS.textContent = "今日辯論中止。證據沒有消失，已破的支柱也不會復原；先把失手的配對攤開。";
      box.appendChild(pS);
      mkBtn(box, "與伽利略複盤", function () { doDebate("debateExitSuspended", []); });
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
      var pT = document.createElement("h3");
      pT.className = "debateCurrent";
      pT.textContent = d.pillar.title;
      box.appendChild(pT);
      var stmtGrid = document.createElement("div");
      stmtGrid.className = "statementGrid";
      var selectedTarget = null, selectedEvidence = null;
      var targetButtons = [], evidenceButtons = [];
      d.statements.forEach(function (st) {
        var row = document.createElement("article");
        row.className = "statementCard" + (st.pressed ? " isPressed" : "");
        var quote = document.createElement("blockquote");
        quote.textContent = "「" + st.text + "」";
        row.appendChild(quote);
        if (st.insight) {
          var insight = document.createElement("p");
          insight.className = "statementInsight";
          insight.textContent = "問清之後｜" + st.insight;
          row.appendChild(insight);
        }
        if (state.mode === "explore" && st.pressed && st.status !== "broken" && stmtHasGap(st.id)) {
          var gap = document.createElement("span");
          gap.className = "gapBadge";
          gap.textContent = "此句有隙";
          row.appendChild(gap);
        }
        var actions = document.createElement("div"); actions.className = "statementActions";
        if (st.status !== "broken" && !d.pressChoice) {
          var press = mkBtn(actions, st.pressed ? "已問清" : "問到底——讓他把前提說滿", function () {
            doDebate("debatePress", [st.id]);
          }, st.pressed);
          press.className = "pressBtn";
          var target = mkBtn(actions, "用證據回擊這一句", function () {
            selectedTarget = st;
            targetButtons.forEach(function (b) { b.setAttribute("aria-pressed", b === target ? "true" : "false"); });
            updateAction();
          });
          target.className = "targetBtn"; target.setAttribute("aria-pressed", "false"); targetButtons.push(target);
        }
        row.appendChild(actions); stmtGrid.appendChild(row);
      });
      box.appendChild(stmtGrid);
      if (d.pressChoice) {
        var pc = document.createElement("section");
        pc.className = "pressChoice";
        pc.textContent = d.pressChoice.prompt;
        box.appendChild(pc);
        d.pressChoice.options.forEach(function (o) {
          mkBtn(box, o.text, function () { doDebate("debatePressChoice", [o.id]); });
        });
        return;
      }
      var handTitle = document.createElement("h3"); handTitle.textContent = "你的證據"; box.appendChild(handTitle);
      var hand = document.createElement("div"); hand.className = "evidenceHand";
      availableEvidenceCards().forEach(function (ev) {
        var card = document.createElement("button");
        card.type = "button"; card.className = "evidenceCard"; card.setAttribute("aria-pressed", "false");
        var art = assetEntry("card_" + ev.evidence);
        if (art) card.style.backgroundImage = "linear-gradient(rgba(247,240,223,.78),rgba(247,240,223,.9)),url(" + assetUrl(art) + ")";
        var code = document.createElement("small");
        code.textContent = ev.evidence === "E3" ? "斜面實驗・子結論" : "旅人筆記・證據";
        var label = document.createElement("b"); label.textContent = ev.label;
        card.appendChild(code); card.appendChild(label);
        var sumKey = ev.evidence + (ev.subitem || "");
        var sum = ASSETS && ASSETS.evidenceSummary ? ASSETS.evidenceSummary[sumKey] : null;
        if (sum) { /* 白話摘要:說清楚這張牌「證明了什麼」,不標正解(Sol 第一優先) */
          var sm = document.createElement("span");
          sm.className = "evSummary";
          sm.textContent = sum;
          card.appendChild(sm);
        }
        card.onclick = function () {
          selectedEvidence = ev;
          evidenceButtons.forEach(function (b) { b.setAttribute("aria-pressed", b === card ? "true" : "false"); });
          updateAction();
        };
        evidenceButtons.push(card); hand.appendChild(card);
      });
      box.appendChild(hand);
      var preview = document.createElement("button");
      preview.type = "button"; preview.className = "presentAction"; preview.disabled = true;
      preview.textContent = "先選一句證詞與一張證據";
      preview.onclick = function () {
        if (!selectedEvidence || !selectedTarget) return;
        doDebate("debatePresent", [{ evidence: selectedEvidence.evidence, subitem: selectedEvidence.subitem, target: selectedTarget.id }]);
      };
      box.appendChild(preview);
      function updateAction() {
        if (!selectedEvidence || !selectedTarget) {
          preview.disabled = true; preview.textContent = "先選一句證詞與一張證據"; return;
        }
        preview.disabled = false;
        preview.textContent = "出示「" + selectedEvidence.label + "」——反駁「" + selectedTarget.text + "」";
      }
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
  function renderDebrief(v, box) {
    var d = v.debate;
    box.className = "debateDebrief";
    var h = document.createElement("h2"); h.textContent = "與伽利略複盤"; box.appendChild(h);
    var lead = document.createElement("p");
    lead.textContent = "你不缺證據。先看剛才把哪些證據放進了不相干的句子；已破的支柱會原樣保留。";
    box.appendChild(lead);
    var mistakes = d && d.mistakes ? d.mistakes : [];
    var list = document.createElement("ol"); list.className = "debriefList";
    if (!mistakes.length) {
      var none = document.createElement("li"); none.textContent = "沒有可列出的配對；回想最後一個讓說服力歸零的選擇。"; list.appendChild(none);
    }
    mistakes.forEach(function (m) {
      var li = document.createElement("li");
      li.textContent = m.kind === "present"
        ? "你用「" + evidenceLabel(m.evidence, m.subitem) + "」回擊「" + m.targetText + "」——兩者沒有咬合。"
        : m.label;
      list.appendChild(li);
    });
    box.appendChild(list);
    var clueTitle = document.createElement("h3"); clueTitle.textContent = "已問清的前提"; box.appendChild(clueTitle);
    var anyInsight = false;
    (d && d.statements || []).forEach(function (st) {
      if (!st.insight) return;
      anyInsight = true;
      var p = document.createElement("p"); p.className = "debriefInsight"; p.textContent = st.insight; box.appendChild(p);
    });
    if (!anyInsight) {
      var p0 = document.createElement("p"); p0.className = "debriefInsight";
      p0.textContent = d && d.phase === "pillars"
        ? "你還沒有把當前證詞問清。重返後可先『問到底』，再決定證據要打哪一句。"
        : "你已走到最後反撲。回看上面的失手：是哪一步越過了手上證據真正量到的邊界？";
      box.appendChild(p0);
    }
    mkBtn(box, "整理好了，重返辯論", function () {
      var r = N.embedComplete(state);
      if (r.error) { addLine("system", r.error, "system"); return; }
      setState(r.state); renderAll();
    });
  }

  /* ---------- 主渲染 ---------- */
  function renderAll() {
    renderStatus();
    var v = N.view(state);
    sceneHeading(v.scene);
    emit("bd:view", { type: v.type, system: v.system || null, scene: v.scene, nodeId: v.nodeId, ended: !!state.ended });
    var box = $("controls");
    box.innerHTML = "";
    box.className = "";
    if (v.type === "embed" && v.system === "incline") {
      $("lab").style.display = "";
      $("labHint").textContent = friendlyLabGoal(v);
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
      updateLabToolProfile(false);
      if (v.scene === "A2-2" && v.nodeId === "e1") {
        var p0 = TIMER_PROFILE[$("labTimer").value];
        if (p0) showLabCoach("timer:" + $("labTimer").value, p0.coach);
      }
      renderLabTables();
      renderLabAssist();
      renderEmbedGate(v);
      return;
    }
    $("lab").style.display = "none";
    if (v.type === "embed" && v.system === "debrief") {
      renderDebrief(v, box);
      return;
    }
    if (v.type === "embed" && v.system === "debate") {
      renderDebate(v, box);
      return;
    }
    if (v.type === "review") {
      var p = document.createElement("p");
      p.className = "reviewHead";
      p.textContent = "旅人筆記・末頁(自由作答,只存檔,不評分)";
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
      mkBtn(box, "封存第一章", function () {
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
      var hb = document.createElement("b");
      hb.textContent = HIST.title;
      h.appendChild(hb);
      h.appendChild(document.createTextNode("(透明揭露:哪些是史實、哪些是傳說或改編)"));
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
    emit("bd:start", { mode: state.mode });
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

    /* R-SAV-05 書信碼(CR-001):匯出=serialize 原文;匯入唯一入口=loadSave 四分類 */
    $("btnExport").style.display = loaded ? "" : "none";
    $("btnExport").onclick = function () {
      var text = null;
      try { text = localStorage.getItem(KEY); } catch (e) {}
      if (!text) { $("letterMsg").textContent = "沒有可匯出的進度。"; return; }
      var ta = $("letterCode");
      ta.value = text;
      ta.focus(); ta.select();
      var copied = false;
      try { copied = document.execCommand("copy"); } catch (e) {}
      try { /* 下載 .txt(file:// 可用;失敗不阻斷) */
        var blob = new Blob([text], { type: "application/json" });
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "發現之前_書信碼_" + new Date().toISOString().slice(0, 10) + ".txt";
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(function () { try { URL.revokeObjectURL(a.href); } catch (e3) {} }, 3000); /* C-1 */
      } catch (e2) {}
      $("letterMsg").textContent = copied
        ? "書信碼已複製並下載為檔案——到任何機器貼入「貼碼續玩」即可接續。"
        : "書信碼已填入欄位並下載為檔案——請手動複製保存。";
    };
    $("btnImport").onclick = function () {
      var text = ($("letterCode").value || "").trim();
      if (!text) { $("letterMsg").textContent = "請先把書信碼貼進欄位。"; return; }
      var r = N.loadSave(text);
      if (r.empty) { $("letterMsg").textContent = "書信碼是空的。"; return; }
      if (r.error) {
        $("letterMsg").textContent = "書信碼無法讀取(" + (r.error === "schema" ? "版本不符" : "格式損壞") + ")——本機既有進度未受影響。";
        return;
      }
      /* A-1 匯入閘:跨機貼入必經深層白名單;違規=整包拒絕,本機存檔不動(Sanitize 雙載體,測試涵蓋負向) */
      var chk = window.GB.Sanitize.sanitizeImport(r.state, PATTERNS, SCENES);
      if (!chk.ok) {
        $("letterMsg").textContent = "書信碼含非法內容(" + chk.reason + "),已拒絕——本機既有進度未受影響。";
        return;
      }
      startGame(chk.state);
      save();
    };
  }

  initTitle();
})();
