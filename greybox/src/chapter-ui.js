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
  var TEXT = window.GB.TextFormat || null;
  var ENVELOPE = window.GB.SaveEnvelope || null;
  var CHAPTER_ID = N.CHAPTER_ID || (SCENES.chapter === "ch2" ? "ch2" : "ch1");
  var KEY = window.BD_SAVE_KEY || "bd_ch1_save"; /* R-SAV2:chapter2.html 覆寫為 bd_ch2_save;未設=第一章原值,灰盒零差異 */
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
  var COMPACT_LAB_QUERY = "(max-height: 520px) and (min-width: 701px)";

  function $(id) { return document.getElementById(id); }
  function displayText(value) { return TEXT ? TEXT.normalizeZhPunctuation(value) : value; }
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
  function migrateLegacyCh2(text) {
    if (CHAPTER_ID !== "ch2" || !text) return null;
    try {
      var old = JSON.parse(text);
      if (!old || old.chapter === "ch2" || old.schemaVersion !== 3 || !old.cursor || !/^B|^SC-R1/.test(old.cursor.scene || "")) return null;
      old.schemaVersion = 1; old.chapter = "ch2";
      old.reveals = old.reveals || { sqrt: old.flags && old.flags.revealSqrt === "1", parabola: old.flags && old.flags.revealParabola === "1" };
      return JSON.stringify(old);
    } catch (e) { return null; }
  }
  function sanitizeLoaded(s) {
    if (!window.GB.Sanitize) return { ok: false, reason: "sanitizer 缺失" };
    return CHAPTER_ID === "ch2"
      ? window.GB.Sanitize.sanitizeImport2(s, SCENES, window.GB.Engine2)
      : window.GB.Sanitize.sanitizeImport(s, PATTERNS, SCENES);
  }
  function tryLoad() { /* B-3/R-SAV-02:壞檔備份+一次性非阻塞提示 */
    var text = null;
    try { text = localStorage.getItem(KEY); } catch (e) { return null; }
    var migrated = migrateLegacyCh2(text);
    var r = N.loadSave(migrated || text);
    if (r.empty) return null;
    if (r.error) {
      try { localStorage.setItem(KEY + "_corrupt", text); localStorage.removeItem(KEY); } catch (e2) {}
      var warn = $("newWarn");
      warn.style.display = "";
      warn.textContent = "偵測到無法讀取的舊進度(" + (r.error === "schema" ? "版本不符" : "檔案損壞") + "),已備份;請開新遊戲。";
      return null;
    }
    var chk = sanitizeLoaded(r.state);
    if (!chk.ok) {
      try { localStorage.setItem(KEY + "_corrupt", text); localStorage.removeItem(KEY); } catch (e3) {}
      var warn2 = $("newWarn");
      warn2.style.display = "";
      warn2.textContent = "偵測到不合法的進度(" + chk.reason + "),已備份；請開新遊戲。";
      return null;
    }
    if (migrated) {
      try { localStorage.setItem(KEY, N.serialize(chk.state)); } catch (e4) {}
    }
    return chk.state;
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
    var shownText = displayText(text);
    var div = document.createElement("div");
    div.className = "line " + (cls || "");
    if (speaker && cls !== "stage" && cls !== "system") {
      if (ASSETS && ASSETS.speakerPortrait) {
        var pe = assetEntry(ASSETS.speakerPortrait[speaker]);
        if (pe) div.appendChild(buildPortrait(pe, speaker));
      }
      var b = document.createElement("span"); b.className = "spk"; b.textContent = displayText(speaker) + "：";
      div.appendChild(b);
    }
    var t = document.createElement("span"); t.textContent = shownText;
    div.appendChild(t);
    $("log").appendChild(div);
    div.scrollIntoView({ block: "nearest" });
    emit("bd:line", { speaker: speaker || null, text: shownText, cls: cls || "", replay: replaying });
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
    div.textContent = "◆ " + sceneId + (sc && sc.title ? "｜" + sc.title : "");
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
    if (CHAPTER_ID === "ch2") {
      var f2 = state.lab.evidence && state.lab.evidence.f2 || { law: false, ball: false };
      $("e3Val").textContent = "彈射主張：開方律" + (f2.law ? "●" : "○") + " 重量" + (f2.ball ? "●" : "○");
      $("e3Val").title = "第二章的兩項核心主張：射程隨下落高度開方、同裝置下與球重無關。";
      $("dayVal").parentElement.title = "天數=工坊與實驗成本：組裝不花天；校準與每次連結測量會推進日程。天數記錄你為可靠證據付出的時間。";
    } else {
    var e3 = state.lab.evidence.e3;
    /* 進度揭露(原則 #2:名詞是戰利品):未動過實驗台前不顯示;白話標籤取代 E3:aObOcO 密碼 */
    var e3Started = state.lab.evidence.runs.length > 0 || e3.a || e3.b || e3.c;
    $("e3Val").textContent = e3Started
      ? "斜面主張：規律" + (e3.a ? "●" : "○") + " 重量" + (e3.b ? "●" : "○") + " 傾角" + (e3.c ? "●" : "○")
      : "";
    $("e3Val").title = "你要在斜面上親手立起的三個主張:規律成立/與球重無關/隨傾角形式不變。●=已認證——三顆全亮,終辯才有火力。";
    }
    $("perVal").textContent = state.debate ? ("說服力：" + state.debate.persuasion + "/5") : "";
    $("modeVal").textContent = "模式：" + (state.mode === "scholar" ? "學者" : "探索");
    $("sceneVal").textContent = "場景：" + state.cursor.scene;
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
  function compactLabOn() {
    try { return !!(window.matchMedia && window.matchMedia(COMPACT_LAB_QUERY).matches); }
    catch (e) { return false; }
  }
  function timerOptionLabel(timer, compact) {
    return compact ? (timer + "・" + PATTERNS.dayCost[timer] + "天")
      : (timer + "（" + TIMER_PROFILE[timer].short + "）");
  }
  function syncLabTimerLabels() {
    var sel = $("labTimer");
    if (!sel || !sel.options) return;
    var compact = compactLabOn();
    Array.prototype.forEach.call(sel.options, function (o) {
      o.textContent = timerOptionLabel(o.value, compact);
    });
  }
  function initLabSelects() {
    fillSelect("labBall", Object.keys(PATTERNS.ball));
    fillSelect("labSurface", Object.keys(PATTERNS.surface));
    fillSelect("labIncline", Object.keys(PATTERNS.base));
    fillSelect("labTimer", Object.keys(PATTERNS.timer), function (t) {
      return timerOptionLabel(t, compactLabOn());
    }, function (t) { return state.mode === "scholar" || t !== "音格"; });
    syncLabTimerLabels();
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

  /* 轉向或進入／退出全螢幕時，只換選單顯示短名；值與實驗狀態不變。 */
  try {
    var compactLabMedia = window.matchMedia && window.matchMedia(COMPACT_LAB_QUERY);
    if (compactLabMedia) {
      if (compactLabMedia.addEventListener) compactLabMedia.addEventListener("change", syncLabTimerLabels);
      else if (compactLabMedia.addListener) compactLabMedia.addListener(syncLabTimerLabels);
    }
  } catch (e) {}
  function updateAssertButtons(v) { /* GB-ADR-011 斷言分段:亮牌規則=引擎 assertStage 單一事實源(原則 10),UI 不自帶平行邏輯 */
    var nodeDef = N._sceneMap[v.scene] && N._sceneMap[v.scene].nodes[v.nodeId];
    var allow = N.assertStage(nodeDef && nodeDef.until, state.mode);
    $("labAssertB").style.display = allow.b ? "" : "none";
    $("labAssertC").style.display = allow.c ? "" : "none";
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
  function friendlyLabGoal(v) { /* 凍結 hint 保留於資料層；玩家只看白話任務。
       第一人稱自筆語氣(Sol 字體驗證 B-3):便條套楷體=玩家親筆,文案不得像系統下指令。 */
    var nodeDef = N._sceneMap[v.scene] && N._sceneMap[v.scene].nodes[v.nodeId];
    var until = (nodeDef && nodeDef.until) || {};
    if (until.e3 === "a") return "我要從四段數字找出規律，押中第五段——這會是我的第一筆主張。";
    if (until.e3 === "b") return "我只換球的大小，做出兩筆成立紀錄，看重量會不會改變規律。";
    if (until.e3 === "c") return "我只改斜面的傾角，再做一筆成立紀錄，看規律的形狀變不變。";
    if (until.repairRun) return "我要重新做一次乾淨的實驗，把新紀錄帶回去。";
    return "翻翻我的實驗簿，想想下一步。";
  }
  function judgeAskText(v) { /* 押注三問(總監裁決 20260720):三次預測不是重複勞動,是三個不同的問題——
       a=看見規律的證明;b=賭「換球數字不變」=與球重無關的押注;c=用同一形式算新數字=遷移。
       機制不動(每筆主張仍先押後看),只讓提問顯形。 */
    var nodeDef = N._sceneMap[v.scene] && N._sceneMap[v.scene].nodes[v.nodeId];
    var until = (nodeDef && nodeDef.until) || {};
    if (until.e3 === "a") return "若你看出了規律——押第五段會滾幾格:";
    if (until.e3 === "b") return "換了球。你賭:第五段還是同一個數字嗎?押幾格:";
    if (until.e3 === "c") return "傾角變了,數字全新——用同一條規律,算出新的第五段:";
    if (until.repairRun) return "乾淨地做一次,像第一次那樣——押第五段:";
    return "若你看出了規律——押第五段會滾幾格:";
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
    b.textContent = displayText(text);
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
    if (CHAPTER_ID === "ch2") {
      Object.keys(SCENES.evidenceNames || {}).forEach(function (code) {
        if (state.evidence[code]) out.push({ evidence: code, subitem: null, label: evidenceLabel(code) });
      });
      return out;
    }
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
  function renderEnemyDataCard(enemy, box) {
    var card = document.createElement("section");
    card.className = "enemyDataCard";
    card.setAttribute("aria-label", "辛普里奧提出的遠砲軌跡資料");
    var head = document.createElement("header");
    var eyebrow = document.createElement("small"); eyebrow.textContent = "對手提出的資料｜先讀，再答";
    var title = document.createElement("h3"); title.textContent = "遠砲軌跡抄錄";
    head.appendChild(eyebrow); head.appendChild(title); card.appendChild(head);

    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 600 270");
    svg.setAttribute("role", "img");
    var st = document.createElementNS(ns, "title"); st.textContent = "遠砲高度隨水平位置變化圖";
    var sd = document.createElementNS(ns, "desc"); sd.textContent = enemy.card.a11y;
    svg.appendChild(st); svg.appendChild(sd);
    for (var g = 0; g <= 10; g++) {
      var gx = 42 + g * 51;
      var ln = document.createElementNS(ns, "line");
      ln.setAttribute("x1", gx); ln.setAttribute("x2", gx); ln.setAttribute("y1", 24); ln.setAttribute("y2", 232);
      ln.setAttribute("class", "enemyGrid"); svg.appendChild(ln);
    }
    for (var gy = 0; gy <= 4; gy++) {
      var yy = 232 - gy * 50;
      var gl = document.createElementNS(ns, "line");
      gl.setAttribute("x1", 42); gl.setAttribute("x2", 552); gl.setAttribute("y1", yy); gl.setAttribute("y2", yy);
      gl.setAttribute("class", "enemyGrid"); svg.appendChild(gl);
    }
    var pts = enemy.card.x.map(function (x, i) { return (42 + x * 51) + "," + (232 - enemy.card.y[i] * 50); }).join(" ");
    var path = document.createElementNS(ns, "polyline");
    path.setAttribute("points", pts); path.setAttribute("class", "enemyCurve"); svg.appendChild(path);
    enemy.card.x.forEach(function (x, i) {
      var dot = document.createElementNS(ns, "circle");
      dot.setAttribute("cx", 42 + x * 51); dot.setAttribute("cy", 232 - enemy.card.y[i] * 50); dot.setAttribute("r", 4);
      dot.setAttribute("class", "enemyPoint"); svg.appendChild(dot);
    });
    if (state.mode === "explore") {
      [["初段｜斜率 1.3", 75, 145], ["末段｜斜率 1.8", 408, 177]].forEach(function (m) {
        var tx = document.createElementNS(ns, "text"); tx.textContent = m[0]; tx.setAttribute("x", m[1]); tx.setAttribute("y", m[2]);
        tx.setAttribute("class", "enemySlopeLabel"); svg.appendChild(tx);
      });
    }
    card.appendChild(svg);
    var data = document.createElement("p");
    data.className = "enemyNumbers";
    data.textContent = "x：" + enemy.card.x.join("・") + "｜高度：" + enemy.card.y.join("・");
    card.appendChild(data); box.appendChild(card);
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
      pT.textContent = displayText(d.pillar.title);
      box.appendChild(pT);
      var stmtGrid = document.createElement("div");
      stmtGrid.className = "statementGrid";
      var selectedTarget = null, selectedEvidence = null;
      var targetButtons = [], evidenceButtons = [];
      d.statements.forEach(function (st) {
        var row = document.createElement("article");
        row.className = "statementCard" + (st.pressed ? " isPressed" : "");
        var quote = document.createElement("blockquote");
        quote.textContent = "「" + displayText(st.text) + "」";
        row.appendChild(quote);
        if (st.insight) {
          var insight = document.createElement("p");
          insight.className = "statementInsight";
          insight.textContent = "問清之後｜" + displayText(st.insight);
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
        pc.textContent = displayText(d.pressChoice.prompt);
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
          sm.textContent = displayText(sum);
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
        preview.textContent = displayText("出示「" + selectedEvidence.label + "」——反駁「" + selectedTarget.text + "」");
      }
      return;
    }
    if (d.phase === "trap") {
      var pTr = document.createElement("p");
      pTr.textContent = displayText(d.trap.prompt);
      box.appendChild(pTr);
      d.trap.options.forEach(function (o) {
        mkBtn(box, o.text, function () { doDebate("debateFr", [o.id]); });
      });
      return;
    }
    if (d.phase === "enemy") {
      renderEnemyDataCard(d.enemy, box);
      var ep = document.createElement("p"); ep.className = "enemyPrompt"; ep.textContent = displayText(d.enemy.prompt); box.appendChild(ep);
      d.enemy.options.forEach(function (o) {
        mkBtn(box, o.text, function () { doDebate("debateFr", [o.id]); });
      });
      return;
    }
    if (d.phase === "fr") {
      var pF = document.createElement("p");
      pF.textContent = displayText(d.fr.prompt);
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

  /* ---------- 第二章彈射工坊面板(R-WS2/R-LAB2;僅 system="catapult" 時渲染,ch1 零觸發) ---------- */
  var cat2Msg = "";
  var cat2Replay = null;
  var cat2EmbedKey = "";
  function cat2EvidenceFlags(s) {
    var f2 = s && s.lab && s.lab.evidence && s.lab.evidence.f2;
    return { law: !!(f2 && f2.law), ball: !!(f2 && f2.ball), full: !!(s && s.evidence && s.evidence.F2) };
  }
  function cat2ClaimGain(before, after) {
    var out = [];
    if (!before.law && after.law) out.push("◆ 取得斷言一：下落高度變成 4 倍，射程約變成 2 倍。");
    if (!before.ball && after.ball) out.push("◆ 取得斷言二：只換球重，射程規律不變。");
    if (!before.full && after.full) out.push("◆ 合成完整證據：F2 桌緣彈射・平方根律。");
    return out.join("\n");
  }
  function cat2CompareFailure(diffs) {
    diffs = diffs || [];
    if (diffs.indexOf("球種須一銅一木") >= 0)
      return "還不能比較重量：這兩組是同一種球。請選一組銅球和一組木球。";
    if (diffs.indexOf("裝置指紋(零件/校準)不同") >= 0)
      return "你換球時也換了零件或校準，無法只把差異歸給重量。請選裝置與校準完全相同的一銅一木。";
    if (diffs.indexOf("series 未完成") >= 0)
      return "至少有一組還沒測完 4、9、16、25 格；完整收完兩組再比較。";
    if (diffs.indexOf("含區間讀值") >= 0)
      return "至少一組只留下模糊區間，還不能逐點比對。請改善量法後重做。";
    if (diffs.indexOf("形狀誤差超限") >= 0)
      return "至少一組本身還沒有穩定呈現同一條規律，不能拿來判斷球重。";
    if (diffs.indexOf("兩球讀值差超過 3%") >= 0)
      return "兩球的射程差超過容許範圍；先檢查是否真的只換了球。";
    return diffs.length ? "這兩組還不能形成乾淨比較：" + diffs.join("、") : "這兩組還不能形成乾淨比較。";
  }
  function cat2ErrorText(code, result) {
    var map = {
      "not-assembled": "裝置還沒組完整：五個槽位都要有零件。",
      "series-open": "目前這組還沒結束；請先完成或明確放棄，再換零件或開新組。",
      "no-open-series": "先選一顆球，開始一組連續測量。",
      "wrong-order": "高度要依 4 → 9 → 16 → 25 格進行，才能形成可比較的一組紀錄。",
      "prediction-required": "25 格是驗證題：先押射程，再放球。",
      "too-early": "先完成 4、9、16 格，才有足夠線索預測 25 格。",
      "bad-prediction": "請輸入一個有效的射程數字。",
      "dependency-missing": "這項校準缺少對應零件，先把裝置組好。",
      "series-not-found": "找不到那組紀錄，請重新選擇。"
    };
    var text = map[code] || code;
    if (result && result.diffs && result.diffs.length) text += "——" + cat2CompareFailure(result.diffs);
    return "✕ " + text;
  }
  function doLab2(action, args, okText) {
    var beforeClaims = cat2EvidenceFlags(state);
    var r = N.labAction(state, action, args);
    if (r.error) { cat2Msg = cat2ErrorText(r.error, r.result); }
    else {
      setState(r.state);
      if (action === "runHeight" && r.result && r.result.series) {
        var rd = r.result.series.readings[args.H];
        cat2Replay = { H: args.H, reading: rd, ball: r.result.series.ball };
      }
      var feedback = r.result && r.result.ok === false
        ? "✕ " + cat2CompareFailure(r.result.diffs)
        : (okText ? okText(r.result) : "");
      var gain = cat2ClaimGain(beforeClaims, cat2EvidenceFlags(r.state));
      cat2Msg = gain ? gain + (feedback ? "\n" + feedback : "") : feedback;
    }
    renderAll();
  }
  function cat2Mission(v) {
    if (v.nodeId === "e1") return {
      step: "第一步｜建立銅球基準",
      text: "組好裝置並完成兩項校準，再用同一顆銅球依序測量 4、9、16 格。"
    };
    if (v.nodeId === "e2") return {
      step: "第二步｜先押再看",
      text: "根據 4、9、16 格的紀錄，先押出 25 格的射程，再放球檢驗你的規律。"
    };
    if (v.nodeId === "e3") return {
      step: "第三步｜只換球",
      text: "裝置和校準全部不變，改用同徑木球完成整組；最後比較一組銅球和一組木球。"
    };
    return { step: "這一輪要完成", text: v.hint || "完成一筆乾淨紀錄。" };
  }
  function cat2DefaultMessage(v, lab2, open, done) {
    if (N.embedReady(state)) return "本段目標已完成。按上方的「收好數據，回到故事」繼續。";
    if (v.nodeId === "e1") return open
      ? "目前只要完成銅球的 4、9、16 格；25 格會在你先說出規律後再開放。"
      : "先組滿五個槽位並校準發射零位、沙盤標尺，再用銅球開始。";
    if (v.nodeId === "e2") return open
      ? "讀完前三個高度後，先鎖定 25 格預測；看到結果前不能改答案。"
      : "選擇剛才尚未完成的銅球紀錄，或以同一裝置重做一組乾淨銅球紀錄。";
    if (v.nodeId === "e3") {
      var hasWood = done.some(function (s) { return s.status === "complete" && s.ball === "wood"; });
      if (!hasWood && !open) return "保持零件與校準不變，選木球開始一組完整測量。";
      if (open) return "木球也要走完 4、9、16、押注、25；中途不要換零件。";
      return "最後一步：在「換球比較」選一組銅球＋一組木球；兩組裝置與校準必須相同。";
    }
    return "完成上方任務後，就能回到故事。";
  }
  function mountCatapultReplay(parent) {
    if (!cat2Replay) return;
    var replay = cat2Replay;
    cat2Replay = null; /* 每次放球只演一次；後續重繪不重播。 */
    var raw = replay.reading;
    var range = typeof raw === "number" ? raw : ((raw[0] + raw[1]) / 2);
    var endX = Math.round(Math.max(390, Math.min(535, 350 + range * 36)));
    var endY = Math.round(78 + replay.H * 2.05);
    var path = "M 72 42 L 226 42 Q " + Math.round((226 + endX) / 2) + " 43 " + endX + " " + endY;
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var fig = document.createElement("figure");
    fig.className = "catReplay";
    fig.setAttribute("aria-label", (replay.ball === "copper" ? "銅球" : "木球") +
      "從高度架釋放，飛離桌緣後落入沙盤的實驗重播");
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 600 155");
    svg.setAttribute("aria-hidden", "true");
    function svgNode(tag, cls, attrs, text, parent2) {
      var node = document.createElementNS("http://www.w3.org/2000/svg", tag);
      if (cls) node.setAttribute("class", cls);
      Object.keys(attrs || {}).forEach(function (key) { node.setAttribute(key, String(attrs[key])); });
      if (text != null) node.textContent = text;
      (parent2 || svg).appendChild(node);
      return node;
    }
    svgNode("path", "catReplayGroove", { d: "M 48 24 L 72 42 L 226 42" });
    svgNode("path", "catReplayTrajectory", { d: path });
    svgNode("line", "catReplaySand", { x1: 245, y1: endY, x2: 570, y2: endY });
    svgNode("path", "catReplayMeasure", { d: "M 238 45 L 238 " + endY + " M 232 45 L 244 45 M 232 " + endY + " L 244 " + endY });
    svgNode("path", "catReplayMeasure", { d: "M 226 " + (endY + 12) + " L " + endX + " " + (endY + 12) });
    svgNode("text", "catReplayH", { x: 248, y: Math.round((45 + endY) / 2) }, "H=" + replay.H);
    svgNode("text", "catReplayR", { x: Math.round((226 + endX) / 2), y: Math.min(150, endY + 28) }, "射程 " +
      (typeof raw === "number" ? raw.toFixed(1) : raw[0].toFixed(1) + "–" + raw[1].toFixed(1)) + " 尺");
    var ball = svgNode("circle", "catReplayBall " + replay.ball,
      { r: 8, cx: reduced ? endX : 0, cy: reduced ? endY : 0 });
    if (!reduced) svgNode("animateMotion", "", { dur: "1.7s", path: path, fill: "freeze",
      keyTimes: "0;0.36;1", keyPoints: "0;0.36;1", calcMode: "spline",
      keySplines: ".3 0 .7 1;.2 .05 .8 1" }, null, ball);
    svgNode("circle", "catReplayMark", { cx: endX, cy: endY, r: 13 });
    fig.appendChild(svg);
    var cap = document.createElement("figcaption");
    cap.textContent = (replay.ball === "copper" ? "銅球" : "木球") + "｜下落高度 " + replay.H + " 格｜沙痕射程 " +
      (typeof raw === "number" ? raw.toFixed(1) : raw[0].toFixed(1) + "–" + raw[1].toFixed(1)) + " 尺";
    fig.appendChild(cap);
    parent.appendChild(fig);
  }
  function renderCatapult(v, box) {
    var E2 = window.GB.Engine2, lab2 = state.lab;
    var embedKey = v.scene + "/" + v.nodeId;
    if (embedKey !== cat2EmbedKey) { cat2EmbedKey = embedKey; cat2Msg = ""; cat2Replay = null; }
    var open = null;
    (lab2.series || []).forEach(function (s) { if (s.status === "open") open = s; });
    function el(tag, txt, parent, cls) {
      var e = document.createElement(tag); if (txt) e.textContent = displayText(txt);
      if (cls) e.className = cls; (parent || box).appendChild(e); return e;
    }
    function btn(txt, fn, parent, cls) { var b = el("button", txt, parent, cls); b.type = "button"; b.onclick = fn; return b; }
    function art(id, alt, parent, cls) {
      var e = assetEntry(id); if (!e) return null;
      var img = document.createElement("img"); img.src = assetUrl(e); img.alt = alt || e.label || "";
      if (cls) img.className = cls; (parent || box).appendChild(img); return img;
    }
    function catapultGate(parent) {
      if (!N.embedReady(state)) return;
      var gate = el("section", "", parent, "catGate ready");
      el("p", "本段完成，故事可以繼續。", gate);
      btn(v.scene === "SC-R1" ? "▶ 帶著乾淨紀錄回去" : "▶ 收好數據，回到故事", function () {
        var r = N.embedComplete(state);
        if (r.error) { cat2Msg = "✕ " + r.error; renderAll(); return; }
        setState(r.state); addLine("system", "(互動段落完成)", "system"); renderAll();
      }, gate, "catGateGo");
    }

    box.className = "catapultWorkshop";
    var head = el("header", "", box, "catHead");
    var headCopy = el("div", "", head);
    el("small", "第二章・核心實驗", headCopy);
    el("h2", "彈射工坊", headCopy);
    el("p", v.hint || "組裝置 → 校準 → 連結測量", headCopy);
    var dayBadge = el("div", "第 " + lab2.days + " 天", head, "catDay");
    dayBadge.setAttribute("aria-label", "工坊目前第 " + lab2.days + " 天");

    /* 左頁：裝置必須持續可見；零件圖只表現所選實物，不貼好壞標籤。 */
    var dv = el("section", "", box, "catApparatus");
    var dh = el("div", "", dv, "catSectionHead");
    el("h3", "I　裝置與校準", dh);
    el("span", E2.profileOf(lab2) === "notRunnable" ? "尚未組好" : "可以放球", dh, "catReadyTag");
    var master = el("figure", "", dv, "catMaster");
    art((ASSETS && ASSETS.workshopApparatusAsset) || "workshop2_projectile_apparatus_master", "桌緣彈射裝置", master);
    el("figcaption", "短斜槽、桌沿與升降沙盤——你選的零件會決定數據的脾氣。", master);
    var slotNames = { launcher: "發射槽", release: "釋放", edge: "桌沿", rangeBed: "落點", heightRig: "高度架" };
    var slots = el("div", "", dv, "catSlots");
    E2._SLOTS.forEach(function (slot) {
      var row = el("article", "", slots, "catSlot " + (lab2.slots[slot] ? "isFilled" : "isEmpty"));
      var cur = lab2.slots[slot];
      var partAsset = cur && ASSETS && ASSETS.workshopPartAsset ? ASSETS.workshopPartAsset[cur] : null;
      if (partAsset) art(partAsset, "", row, "catPartArt");
      var copy = el("div", "", row, "catSlotCopy");
      el("small", slotNames[slot] || slot, copy);
      el("b", cur ? E2._PARTS[cur].label : "尚未裝入", copy);
      var sel = document.createElement("select");
      sel.setAttribute("aria-label", (slotNames[slot] || slot) + "零件");
      Object.keys(E2._PARTS).forEach(function (pid) {
        var p = E2._PARTS[pid];
        if (p.slot !== slot) return;
        if (p.scholar && state.mode !== "scholar") return;
        var o = document.createElement("option"); o.value = pid; o.textContent = p.label; sel.appendChild(o);
      });
      if (cur) sel.value = cur;
      copy.appendChild(sel);
      btn(cur ? "更換零件" : "裝上零件", function () {
        doLab2(cur ? "replacePart" : "place", { slot: slot, part: sel.value });
      }, copy, "catPartBtn");
    });
    var cal = el("div", "", dv, "catCalibrations");
    [["releaseZero", "發射零位(同刻度三放重疊)"], ["rangeScale", "沙盤標尺"]].forEach(function (c) {
      var row = el("div", "", cal, "catCal " + (lab2.calib[c[0]] ? "isDone" : ""));
      el("span", lab2.calib[c[0]] ? "✓" : "○", row);
      el("b", c[1], row);
      if (!lab2.calib[c[0]]) btn("校準・1 天", function () { doLab2("calibrate", { kind: c[0] }); }, row);
      else el("em", "已校準", row);
    });

    /* 右頁：測量、押注與不可刪紀錄。 */
    var sv = el("section", "", box, "catBook");
    var sh = el("div", "", sv, "catSectionHead");
    el("h3", "II　旅人實驗簿", sh);
    el("span", "4 → 9 → 16 → 押注 → 25", sh, "catSequence");
    var missionCopy = cat2Mission(v);
    var mission = el("div", "", sv, "catMission");
    el("small", missionCopy.step, mission);
    el("p", missionCopy.text, mission);
    var f2Claims = cat2EvidenceFlags(state);
    var claims = el("div", "", mission, "catClaims");
    claims.setAttribute("aria-label", "本實驗可取得的兩項斷言");
    var lawClaim = el("div", "", claims, "catClaim " + (f2Claims.law ? "earned" : "locked"));
    el("b", (f2Claims.law ? "✓" : "○") + " 斷言一", lawClaim);
    el("span", f2Claims.law ? "高度 ×4，射程約 ×2" : "押中 25 格後取得", lawClaim);
    var ballClaim = el("div", "", claims, "catClaim " + (f2Claims.ball ? "earned" : "locked"));
    el("b", (f2Claims.ball ? "✓" : "○") + " 斷言二", ballClaim);
    el("span", f2Claims.ball ? "只換球重，規律不變" : "完成銅球／木球比較後取得", ballClaim);
    if (f2Claims.full) el("strong", "◆ F2 完整證據已收入旅人筆記", claims, "catClaimComplete");
    catapultGate(sv); /* 完成出口固定在目標旁，不再藏在長紀錄簿底端。 */
    mountCatapultReplay(sv);
    if (!open) {
      var row0 = el("div", "", sv, "catStartSeries");
      var bs = document.createElement("select");
      [["copper", "同徑實心銅球"], ["wood", "同徑實心木球"]].forEach(function (b2) {
        var o = document.createElement("option"); o.value = b2[0]; o.textContent = b2[1]; bs.appendChild(o);
      });
      bs.value = v.nodeId === "e3" ? "wood" : "copper"; /* 換球階段預選任務所需球，仍保留玩家自由。 */
      row0.appendChild(bs);
      btn("開始一組連結測量", function () { doLab2("beginSeries", { ball: bs.value }); }, row0, "catPrimary");
    } else {
      var progress = el("div", "", sv, "catProgress");
      [4, 9, 16, 25].forEach(function (h) {
        var rd = open.readings[h], step = el("div", "", progress, "catStep " + (rd != null ? "isDone" : ""));
        el("small", "高度 " + h, step);
        el("b", rd == null ? "待測" : (typeof rd === "number" ? rd.toFixed(1) + " 尺" : rd[0] + "–" + rd[1] + " 尺"), step);
      });
      var nh = [4, 9, 16, 25].filter(function (h) { return !(h in open.readings); })[0];
      var act = el("div", "", sv, "catMeasureAction");
      if (nh && nh < 25) btn("放球・下落高度 " + nh + " 格（1 天）", function () { doLab2("runHeight", { H: nh }); }, act, "catPrimary");
      else if (nh === 25 && (typeof open.prediction !== "number")) {
        el("label", "25 格下落高度——你押射程幾尺？", act);
        var inp = document.createElement("input"); inp.type = "number"; inp.step = "0.1"; inp.inputMode = "decimal";
        inp.setAttribute("aria-label", "預測 25 格下落高度的射程");
        act.appendChild(inp);
        btn("鎖定預測", function () { doLab2("predictSeries", { value: parseFloat(inp.value) }); }, act, "catPrimary");
      } else if (nh === 25) btn("放球・25 格——見真章（1 天）", function () {
        doLab2("runHeight", { H: 25 }, function (res) {
          var s = res.series;
          if (s.rejectReason === "non-scalar") return "這個範圍太寬,還不能押一個數——量法得再講究。";
          return s.accepted ? "主張成立:形狀偏差 " + (s.shapeError * 100).toFixed(1) + "% ✓|預測偏差 " + (s.predictionError * 100).toFixed(1) + "% ✓"
            : "未成立:形狀偏差 " + (s.shapeError * 100).toFixed(1) + "% " + (s.shapeError <= 0.12 ? "✓" : "✕") +
              "|預測偏差 " + (s.predictionError * 100).toFixed(1) + "% " + (s.predictionError <= 0.12 ? "✓" : "✕");
        });
      }, act, "catPrimary");
      btn("放棄這組（紀錄保留）", function () { doLab2("abandonSeries", {}); }, act, "catQuiet");
    }
    /* 完成紀錄+換球比較 */
    var done = (lab2.series || []).filter(function (s) { return s.status !== "open"; });
    if (done.length) {
      var tv = el("details", "", sv, "catRecords"); tv.open = true;
      el("summary", "紀錄簿・" + done.length + " 組（不可刪）", tv);
      done.forEach(function (s) {
        el("div", "#" + s.id + "｜" + (s.ball === "copper" ? "銅球" : "木球") + "｜" +
          [4, 9, 16, 25].map(function (h) { var rd = s.readings[h]; return typeof rd === "number" ? rd.toFixed(1) : (rd ? "[" + rd[0] + "-" + rd[1] + "]" : "—"); }).join("/") +
          "｜" + (s.status === "abandoned" ? "已放棄" : (s.accepted ? "成立 ✓" : "未成立")), tv, "catRecord");
      });
      var comp = done.filter(function (s) { return s.status === "complete"; });
      if (comp.length >= 2) {
        var cr = el("div", "", tv, "catCompare");
        el("b", "換球比較", cr);
        var sa = document.createElement("select"), sb = document.createElement("select");
        comp.forEach(function (s) {
          [sa, sb].forEach(function (sel2) {
            var o = document.createElement("option"); o.value = s.id;
            o.textContent = "#" + s.id + "・" + (s.ball === "copper" ? "銅球" : "木球");
            sel2.appendChild(o);
          });
        });
        var firstCopper = comp.find(function (s) { return s.ball === "copper"; });
        var firstWood = comp.find(function (s) { return s.ball === "wood"; });
        if (firstCopper && firstWood) { sa.value = firstCopper.id; sb.value = firstWood.id; }
        cr.appendChild(sa); cr.appendChild(sb);
        var compareHint = el("small", "", cr, "catCompareHint");
        function updateCompareHint() {
          var a = comp.find(function (s) { return s.id === parseInt(sa.value, 10); });
          var b = comp.find(function (s) { return s.id === parseInt(sb.value, 10); });
          if (!a || !b || a.id === b.id || a.ball === b.ball)
            compareHint.textContent = "請選一組銅球＋一組木球；同球重測不能回答重量。";
          else if (a.fingerprint !== b.fingerprint)
            compareHint.textContent = "這兩組連裝置或校準也不同；請找只換球的一組。";
          else compareHint.textContent = "✓ 只換了球，可以檢驗重量是否改變規律。";
        }
        sa.onchange = updateCompareHint; sb.onchange = updateCompareHint; updateCompareHint();
        btn("比較兩組・提出斷言", function () {
          doLab2("compareBalls", { a: parseInt(sa.value, 10), b: parseInt(sb.value, 10) }, function (res) {
            return res.ok ? "同一副骨架——與球重無關,成立。" : "";
          });
        }, cr, "catPrimary");
      }
    }
    var mp = el("p", cat2Msg || cat2DefaultMessage(v, lab2, open, done), sv, "catMessage");
    if (/^◆/.test(cat2Msg)) mp.classList.add("gain");
    mp.setAttribute("role", "status");
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
      $("labHint").textContent = displayText(friendlyLabGoal(v));
      $("judgeAsk").textContent = displayText(judgeAskText(v));
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
    if (v.type === "embed" && v.system === "catapult") {
      renderCatapult(v, box);
      return;
    }
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
        lab.appendChild(document.createTextNode(displayText(q)));
        var ta = document.createElement("textarea");
        ta.rows = 2; ta.style.width = "95%";
        lab.appendChild(document.createElement("br"));
        lab.appendChild(ta);
        box.appendChild(lab);
        return ta;
      });
      mkBtn(box, CHAPTER_ID === "ch2" ? "封存第二章" : "封存第一章", function () {
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
          td.textContent = displayText(cell);
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
      pc.textContent = displayText(v.prompt);
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

  function chapterLabel() { return CHAPTER_ID === "ch2" ? "第二章" : "第一章"; }
  function readProjection() {
    if (CHAPTER_ID !== "ch2") return null;
    try {
      var p = JSON.parse(localStorage.getItem("bd_ch2_ch1_ref") || "null");
      return p && p.source === "ch1-schema3" ? p : null;
    } catch (e) { return null; }
  }
  function routeToChapter(chapter, pendingLetter) {
    try { if (pendingLetter) sessionStorage.setItem("bd_pending_letter", pendingLetter); } catch (e) {}
    var u = new URL(location.href);
    u.searchParams.set("chapter", chapter);
    location.href = u.href;
  }
  function configureSeriesTitle() {
    document.title = CHAPTER_ID === "ch2"
      ? "《發現之前》第二章：拋出去的東西（舞台版）"
      : "《發現之前》第一章：重物的渴望（舞台版）";
    var meta = document.querySelector(".chapterStatusText strong");
    if (meta) meta.textContent = CHAPTER_ID === "ch2" ? "第二章・拋出去的東西" : "第一章・重物的渴望";
    var legend = document.querySelector("#titleCard fieldset legend");
    if (legend) legend.textContent = "從" + chapterLabel() + "開始・選擇模式（中途不可換）";
    $("btnNew").textContent = "開始" + chapterLabel();
    $("btnContinue").textContent = "繼續" + chapterLabel();
    Array.prototype.forEach.call(document.querySelectorAll(".chapterPick"), function (b) {
      var mine = b.getAttribute("data-chapter") === CHAPTER_ID;
      b.disabled = false;
      b.classList.toggle("isActive", mine);
      if (mine) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
      var sm = b.querySelector("small"); if (sm) sm.textContent = "可玩";
      b.onclick = function () { if (!mine) routeToChapter(b.getAttribute("data-chapter")); };
    });
  }
  function importCurrentChapter(rawText) {
    var r = N.loadSave(rawText);
    if (r.error) return { error: r.error };
    var chk = sanitizeLoaded(r.state);
    if (!chk.ok) return { error: "sanitize", reason: chk.reason };
    return { state: chk.state };
  }

  function initTitle() {
    if (TEXT) TEXT.normalizeTextNodes(document.getElementById("stage"));
    configureSeriesTitle();
    var loaded = tryLoad();
    var projection = readProjection();
    try {
      var pending = sessionStorage.getItem("bd_pending_letter");
      if (pending) { $("letterCode").value = pending; sessionStorage.removeItem("bd_pending_letter"); }
    } catch (e0) {}
    $("continueWrap").style.display = loaded ? "" : "none";
    if (loaded) {
      $("continueMeta").textContent = loaded.ended
        ? "已完成・共 " + loaded.lab.days + " 天"
        : (loaded.mode === "scholar" ? "學者模式" : "探索模式") + "・第 " + loaded.lab.days + " 天";
      $("btnContinue").onclick = function () { startGame(loaded); };
    }
    $("btnNew").onclick = function () {
      if (loaded && !newConfirm) {
        newConfirm = true;
        $("newWarn").style.display = "";
        return;
      }
      var mode = document.querySelector("input[name=mode]:checked").value;
      startGame(N.initialState(mode, CHAPTER_ID === "ch2" && projection ? { ch1: projection } : null));
      save();
    };
    $("btnBackTitle").onclick = function () { save(); location.reload(); };

    $("btnExport").style.display = loaded ? "" : "none";
    $("btnExport").onclick = function () {
      var raw = null;
      try { raw = localStorage.getItem(KEY); } catch (e) {}
      if (!raw) { $("letterMsg").textContent = "沒有可匯出的進度。"; return; }
      var parsed;
      try { parsed = JSON.parse(raw); } catch (e1) { $("letterMsg").textContent = "本機進度損壞，無法匯出。"; return; }
      var text = ENVELOPE ? ENVELOPE.encode(CHAPTER_ID, parsed) : raw;
      var ta = $("letterCode");
      ta.value = text; ta.focus(); ta.select();
      var copied = false;
      try { copied = document.execCommand("copy"); } catch (e2) {}
      try {
        var blob = new Blob([text], { type: "application/json" });
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "發現之前_" + CHAPTER_ID + "_書信碼_" + new Date().toISOString().slice(0, 10) + ".txt";
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(function () { try { URL.revokeObjectURL(a.href); } catch (e3) {} }, 3000);
      } catch (e4) {}
      $("letterMsg").textContent = copied ? "書信碼已複製並下載。" : "書信碼已填入欄位並下載，請手動複製保存。";
    };
    $("btnImport").onclick = function () {
      var text = ($("letterCode").value || "").trim();
      if (!text) { $("letterMsg").textContent = "請先把書信碼貼進欄位。"; return; }
      var dec = ENVELOPE ? ENVELOPE.decode(text) : { legacy: true, value: null };
      if (dec.error || dec.empty) {
        $("letterMsg").textContent = "書信碼無法讀取（" + (dec.error || "空白") + "）——本機進度未受影響。"; return;
      }
      if (dec.envelope && dec.chapter !== CHAPTER_ID) {
        routeToChapter(dec.chapter, text); return;
      }
      var candidate = dec.envelope ? JSON.stringify(dec.payload) : text;
      var migrated = migrateLegacyCh2(candidate);
      var imported = importCurrentChapter(migrated || candidate);
      if (!imported.error) { startGame(imported.state); save(); return; }

      /* R-SAV2 向後相容：在第二章貼第一章 raw code，只取經淨化的投影，不覆寫第一章。 */
      if (CHAPTER_ID === "ch2" && dec.legacy) {
        var rawObj = dec.value;
        var ch1Scenes = window.GB.DATA.scenes1;
        var ch1Chk = window.GB.Sanitize.sanitizeImport(rawObj, PATTERNS, ch1Scenes);
        if (ch1Chk.ok) {
          projection = N.projectCh1(JSON.stringify(ch1Chk.state));
          try { localStorage.setItem("bd_ch2_ch1_ref", JSON.stringify(projection)); } catch (e5) {}
          $("letterMsg").textContent = projection.certified
            ? "第一章筆記已驗證；開始第二章時會啟用跨章論證聲部。"
            : "第一章筆記已讀取，但尚未完成認證；第二章仍可直接開始。";
          return;
        }
      }
      $("letterMsg").textContent = "書信碼含非法內容（" + (imported.reason || imported.error) + "），已拒絕——本機進度未受影響。";
    };
  }

  initTitle();
})();
