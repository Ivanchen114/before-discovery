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
  var CHAPTER_ID = N.CHAPTER_ID || (/^ch[123]$/.test(SCENES.chapter) ? SCENES.chapter : "ch1");
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
    if (CHAPTER_ID === "ch2") return window.GB.Sanitize.sanitizeImport2(s, SCENES, window.GB.Engine2);
    if (CHAPTER_ID === "ch3") return window.GB.Sanitize.sanitizeImport3(s, SCENES, window.GB.Engine3);
    return window.GB.Sanitize.sanitizeImport(s, PATTERNS, SCENES);
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
      var bg = assetEntry(ASSETS.sceneBg[CHAPTER_ID + ":" + sceneId] || ASSETS.sceneBg[sceneId]);
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
    } else if (CHAPTER_ID === "ch3") {
      var g = state.lab.evidence || {};
      $("e3Val").textContent = "共同運動：桅落" + (g.g1 ? "●" : "○") +
        " 船艙" + (g.g2 ? "●" : "○") + " 變速" + (g.g3 ? "●" : "○") +
        " 疊圖" + (g.g4 ? "●" : "○") + " 邊界" + (g.g5 ? "●" : "○");
      $("e3Val").title = "第三章的五步證據鏈：穩速桅落、封閉船艙、加減速對照、雙參考物疊圖、證據邊界。";
      $("dayVal").parentElement.title = "天數記錄校準、重複測量與公開演示所花的時間。";
    } else {
    var e3 = state.lab.evidence.e3;
    /* 進度揭露(原則 #2:名詞是戰利品):未動過實驗台前不顯示;白話標籤取代 E3:aObOcO 密碼 */
    var e3Started = state.lab.evidence.runs.length > 0 || e3.a || e3.b || e3.c;
    $("e3Val").textContent = e3Started
      ? "斜面主張：規律" + (e3.a ? "●" : "○") + " 重量" + (e3.b ? "●" : "○") + " 傾角" + (e3.c ? "●" : "○")
      : "";
    $("e3Val").title = "你要在斜面上親手立起的三個主張:規律成立/與球重無關/隨傾角形式不變。●=已認證——三顆全亮,終辯才有火力。";
    }
    if (CHAPTER_ID === "ch3") {
      var audit = state.lab.audit || {};
      var sealed = ["wind", "acceleration", "paths"].filter(function (k) { return audit[k]; }).length;
      $("perVal").textContent = sealed ? ("公開質詢：" + sealed + "/3") : "";
    } else $("perVal").textContent = state.debate ? ("說服力：" + state.debate.persuasion + "/5") : "";
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
  var cat2PartFocus = "latchRelease";
  function cat2EvidenceFlags(s) {
    var f2 = s && s.lab && s.lab.evidence && s.lab.evidence.f2;
    return { law: !!(f2 && f2.law), lawSource: f2 && f2.lawSource,
      ball: !!(f2 && f2.ball), full: !!(s && s.evidence && s.evidence.F2) };
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
  function cat2LawFailure(reason) {
    if (reason === "concept-mismatch")
      return "這句和所選數據對不上。比較下落高度 4 → 16 格與射程約 2 → 4 尺：兩邊各放大了幾倍？";
    return "這組數據還不能支持這項斷言。";
  }
  function cat2ErrorText(code, result) {
    var map = {
      "not-assembled": "裝置還沒組完整：固定骨架之外，三個可選部位都要裝好。",
      "fixed-slot": "這是唯一必要的固定骨架，不需要更換；請把判斷留給真正有差異的零件。",
      "series-open": "目前這組還沒結束；請先完成或明確放棄，再換零件或開新組。",
      "no-open-series": "先選一顆球，開始一組連續測量。",
      "wrong-order": "高度要依 4 → 9 → 16 → 25 格進行，才能形成可比較的一組紀錄。",
      "prediction-required": "25 格是驗證題：先押射程，再放球。",
      "too-early": "先完成 4、9、16 格，才有足夠線索預測 25 格。",
      "bad-prediction": "請輸入一個有效的射程數字。",
      "dependency-missing": "這項校準缺少對應零件，先把裝置組好。",
      "series-not-found": "找不到那組紀錄，請重新選擇。",
      "series-not-complete": "這組紀錄還沒完成 4、9、16、25 格，不能拿來斷言。",
      "series-not-accepted": "這組紀錄沒有同時通過形狀與預測門檻；請選標示為「可用」的紀錄，或改善裝置後重做。",
      "law-source-ball": "斷言一要引用本輪的銅球基準；木球紀錄留給下一步檢驗重量。",
      "unknown-law-concept": "先選擇這組數據支持的物理關係。"
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
        ? "✕ " + (action === "assertLaw" ? cat2LawFailure(r.result.reason) : cat2CompareFailure(r.result.diffs))
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
      text: "先押出 25 格射程並放球；結果出來後，親自選一組數據與它支持的概念，提出斷言。"
    };
    if (v.nodeId === "e3") return {
      step: "第三步｜只換球",
      text: "裝置和校準全部不變，改用同徑木球完成整組；最後比較一組銅球和一組木球。"
    };
    return { step: "這一輪要完成", text: v.hint || "完成一筆乾淨紀錄。" };
  }
  function cat2GateLabel(v) {
    if (v.nodeId === "e1") return "▶ 回到故事，說出你看到的規律";
    if (v.nodeId === "e2") return "▶ 帶著押中的規律回去";
    if (v.nodeId === "e3") return "▶ 收下 F2 證據，繼續劇情";
    return v.scene === "SC-R1" ? "▶ 帶著乾淨紀錄回去" : "▶ 收好數據，回到故事";
  }
  function cat2DefaultMessage(v, lab2, open, done) {
    if (N.embedReady(state)) return "本段目標已完成。按上方的「收好數據，回到故事」繼續。";
    if (v.nodeId === "e1") return open
      ? "目前只要完成銅球的 4、9、16 格；25 格會在你先說出規律後再開放。"
      : "踏查已說明每個部位控制什麼；現在真正要選的是各部位的做法。先比較它們的脾氣，再完成兩項校準。";
    if (v.nodeId === "e2") return open
      ? "讀完前三個高度後，先鎖定 25 格預測；看到結果前不能改答案。"
      : (done.some(function (s) { return s.status === "complete"; })
        ? "結果只是一組可引用的紀錄。請在紀錄簿選數據、選概念，再由你提出斷言。"
        : "選擇剛才尚未完成的銅球紀錄，或以同一裝置重做一組乾淨銅球紀錄。");
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
      el("p", "本段目標已完成。先回到故事，下一個問題會在對話後開放。", gate);
      btn(cat2GateLabel(v), function () {
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
    var partBrief = document.createElement("aside");
    partBrief.className = "catPartBrief";
    var partBriefTitle = document.createElement("strong");
    var partBriefText = document.createElement("p");
    var partBriefCoach = document.createElement("blockquote");
    partBrief.appendChild(partBriefTitle);
    partBrief.appendChild(partBriefText);
    partBrief.appendChild(partBriefCoach);
    function showPartBrief(pid) {
      var guides = ASSETS && ASSETS.workshopPartGuide || {};
      var g = guides[pid];
      var p = E2._PARTS[pid];
      if (!g || !p) return;
      cat2PartFocus = pid;
      partBriefTitle.textContent = "目前查看｜" + p.label;
      partBriefText.textContent = g.detail;
      partBriefCoach.textContent = "伽利略：「" + g.coach + "」";
    }
    E2._SLOTS.forEach(function (slot) {
      var fixed = E2._FIXED_SLOTS && E2._FIXED_SLOTS[slot];
      var cur = lab2.slots[slot] || fixed;
      var row = el("article", "", slots, "catSlot " + (cur ? "isFilled" : "isEmpty") + (fixed ? " isFixed" : ""));
      var partAsset = cur && ASSETS && ASSETS.workshopPartAsset ? ASSETS.workshopPartAsset[cur] : null;
      if (partAsset) art(partAsset, "", row, "catPartArt");
      var copy = el("div", "", row, "catSlotCopy");
      el("small", slotNames[slot] || slot, copy);
      el("b", cur ? E2._PARTS[cur].label : "尚未裝入", copy);
      if (fixed) {
        el("span", "已固定｜無須更換", copy, "catFixedTag");
        return;
      }
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
      sel.addEventListener("focus", function () { showPartBrief(sel.value); });
      sel.addEventListener("change", function () { showPartBrief(sel.value); });
      btn(cur ? "更換零件" : "裝上零件", function () {
        doLab2(cur ? "replacePart" : "place", { slot: slot, part: sel.value });
      }, copy, "catPartBtn");
    });
    slots.appendChild(partBrief);
    var guides = ASSETS && ASSETS.workshopPartGuide || {};
    showPartBrief(guides[cat2PartFocus] ? cat2PartFocus : "latchRelease");
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
    el("span", f2Claims.law ? "高度 ×4，射程約 ×2" +
      (f2Claims.lawSource != null ? "（引用 #" + f2Claims.lawSource + "）" : "") : "選一組可用數據＋概念後取得", lawClaim);
    var ballClaim = el("div", "", claims, "catClaim " + (f2Claims.ball ? "earned" : "locked"));
    el("b", (f2Claims.ball ? "✓" : "○") + " 斷言二", ballClaim);
    el("span", f2Claims.ball ? "只換球重，規律不變" : "完成銅球／木球比較後取得", ballClaim);
    if (f2Claims.full) el("strong", "◆ F2 完整證據已收入旅人筆記", claims, "catClaimComplete");
    catapultGate(sv); /* 完成出口固定在目標旁，不再藏在長紀錄簿底端。 */
    mountCatapultReplay(sv);
    var stageReady = N.embedReady(state);
    if (stageReady) {
      el("p", "這一步已收束；額外操作暫停，避免越過下一個劇情提問。", sv, "catStagePause");
    } else if (!open) {
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
          return s.accepted ? "這組紀錄可用：形狀偏差 " + (s.shapeError * 100).toFixed(1) + "% ✓｜預測偏差 " + (s.predictionError * 100).toFixed(1) + "% ✓。接著選數據與概念，提出你的斷言。"
            : "這組紀錄不可用：形狀偏差 " + (s.shapeError * 100).toFixed(1) + "% " + (s.shapeError <= 0.12 ? "✓" : "✕") +
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
          "｜" + (s.status === "abandoned" ? "已放棄" : (s.accepted ? "可用 ✓" : "不可用")), tv, "catRecord");
      });
      var comp = done.filter(function (s) { return s.status === "complete"; });
      if (comp.length && v.nodeId === "e2" && !f2Claims.law && !stageReady) {
        var lr = el("div", "", tv, "catCompare catLawAssert");
        el("b", "從數據提出斷言一", lr);
        var sourceSel = document.createElement("select");
        var sourcePlaceholder = document.createElement("option");
        sourcePlaceholder.value = ""; sourcePlaceholder.textContent = "選一組完整紀錄"; sourceSel.appendChild(sourcePlaceholder);
        comp.forEach(function (s) {
          var o = document.createElement("option"); o.value = s.id;
          o.textContent = "#" + s.id + "・" + (s.ball === "copper" ? "銅球" : "木球") + "・" + (s.accepted ? "可用" : "不可用");
          sourceSel.appendChild(o);
        });
        var conceptSel = document.createElement("select");
        var conceptPlaceholder = document.createElement("option");
        conceptPlaceholder.value = ""; conceptPlaceholder.textContent = "選擇數據支持的概念"; conceptSel.appendChild(conceptPlaceholder);
        (SCENES.lab2LawConcepts || []).forEach(function (c) {
          var o = document.createElement("option"); o.value = c.id; o.textContent = c.label; conceptSel.appendChild(o);
        });
        lr.appendChild(sourceSel); lr.appendChild(conceptSel);
        var lawHint = el("small", "先選你要引用的完整紀錄，再判斷它支持哪一種關係。", lr, "catCompareHint");
        function updateLawHint() {
          var picked = comp.find(function (s) { return s.id === parseInt(sourceSel.value, 10); });
          if (!picked) lawHint.textContent = "先選你要引用的完整紀錄，再判斷它支持哪一種關係。";
          else if (picked.ball !== "copper") lawHint.textContent = "這是木球紀錄；斷言一先引用銅球基準，木球留給斷言二。";
          else if (!picked.accepted) lawHint.textContent = "這組沒有通過兩道資料門檻，不能拿來支持物理斷言。";
          else lawHint.textContent = "✓ 這組數據可引用。現在選出它真正支持的物理關係。";
        }
        sourceSel.onchange = updateLawHint; updateLawHint();
        btn("用這組數據提出斷言", function () {
          doLab2("assertLaw", { seriesId: parseInt(sourceSel.value, 10), conceptId: conceptSel.value });
        }, lr, "catPrimary");
      }
      if (comp.length >= 2 && !stageReady) {
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

  /* ---------- 第三章航船實驗(R-SHIP3;穩速共同運動／變速邊界／雙參考物) ---------- */
  var ship3Msg = "";
  var ship3EmbedKey = "";
  var ship3VisualRun = null; /* 純表現層：最近一次實驗動畫，不入存檔、不改 fixture。 */
  function ship3El(tag, text, parent, cls) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = displayText(text);
    if (parent) parent.appendChild(node);
    return node;
  }
  function ship3Btn(parent, text, fn, cls, disabled) {
    var b = ship3El("button", text, parent, cls || "shipAction");
    b.type = "button"; b.disabled = !!disabled; b.onclick = fn;
    return b;
  }
  function ship3Select(parent, values, labels, value) {
    var s = ship3El("select", null, parent, "shipSelect");
    values.forEach(function (v) {
      var o = document.createElement("option"); o.value = v; o.textContent = labels[v] || v;
      s.appendChild(o);
    });
    if (value != null) s.value = value;
    return s;
  }
  function ship3Error(code) {
    var map = {
      "plumb-required": "先校準鉛垂線，否則連桅腳基準在哪裡都不確定。",
      "release-required": "先選擇怎麼放開石球。手放可能額外推到它；繩扣與門閂較乾淨。",
      "baseline-required": "停船基準還不夠乾淨。請校準後用繩扣或門閂連做三次。",
      "g1-required": "先完成三次近似穩速的桅頂落石。",
      "g2-required": "先完成停船與穩速船艙的四格對照。",
      "prediction-required": "先把加速與減速的落點預測鎖定，再看結果。",
      "prediction-locked": "預測已經用墨封存，結果出來前不能改。",
      "same-direction": "加速與減速若押同一方向，就沒有真正比較兩種速度改變。",
      "g3-required": "先完成加速／減速對照，才有兩種參考物可疊。",
      "alignment-required": "兩張紙必須先用同一串鼓點對齊，不能只把端點硬湊在一起。",
      "g4-required": "先把船上與岸上紀錄轉成可以互相對照的兩張圖。",
      "wrong-public-order": "公開演示的程序不能跳步：基準、穩速窗口、無額外推力、重複三次。",
      "public-demo-required": "先完成公開演示，再回答質詢。",
      "evidence-not-owned": "這張證據尚未取得，不能拿來回答。",
      "audit-incomplete": "三道質詢尚未全部封存。"
    };
    return map[code] || code;
  }
  function doShip(action, args, okText) {
    var before = JSON.stringify(state.lab.evidence || {});
    var r = N.labAction(state, action, args || {});
    if (r.error) ship3Msg = "✕ " + ship3Error(r.error);
    else {
      setState(r.state);
      var rr = r.result || {};
      if (rr.ok === false) {
        var why = {
          "beats-mismatch": "兩張紙沒有對齊同一聲鼓。先讓同一時刻相認。",
          "wrong-transform": "只拉大或縮小圖形不能換參考物；要扣除每一拍桅杆向前的位移。",
          "evidence-mismatch": "這張證據沒有直接回答這道質詢。換一張真正做過相應對照的紀錄。",
          "overclaim": "這場實驗排除一個反對，卻沒有直接量到地球正在運動。把結論收回證據邊界。"
        };
        ship3Msg = "✕ " + (why[rr.reason] || "這一步還不能成立。");
      } else ship3Msg = typeof okText === "function" ? okText(rr) : (okText || "✓ 已記錄。");
      var visualKinds = {
        runBaseline: "mast-dock",
        runMast: args && args.window === "stable" ? "mast-steady" : "mast-accelerating",
        runCabin: "cabin-" + ((args && args.vesselState) || "dock") + "-" + ((args && args.test) || "drip"),
        runSpeedChange: "speed-" + ((args && args.kind) || "accelerating"),
        alignRecords: "tapes-align",
        transformRecords: "tapes-transform",
        setReference: "tapes-reference-" + ((args && args.ref) || "shore"),
        runPublicStep: "public-" + ((args && args.step) || "baseline"),
        setBoundary: "boundary-" + ((args && args.choice) || "honest")
      };
      if (visualKinds[action]) ship3VisualRun = {
        kind: visualKinds[action],
        offset: rr.run && typeof rr.run.offset === "number" ? rr.run.offset : 0,
        stamp: Date.now()
      };
      var after = state.lab.evidence || {};
      if (before !== JSON.stringify(after)) {
        ["g1", "g2", "g3", "g4", "g5"].forEach(function (k) {
          var old = JSON.parse(before || "{}");
          if (!old[k] && after[k]) ship3Msg = "◆ 取得 " + k.toUpperCase() + "：" + (SCENES.evidenceNames[k.toUpperCase()] || "新證據") + "\n" + ship3Msg;
        });
      }
    }
    renderAll();
  }
  function ship3Mission(phase) {
    var m = {
      baseline: ["停船基準", "校準鉛垂線，選一種不額外推石頭的釋放法，取得三次乾淨落點。"],
      "first-failure": ["故意保留一次失敗", "在船剛離岸、仍加速時放手；別刪掉異常，先看它跟哪個條件一起出現。"],
      "steady-mast": ["等船近似穩速", "用鼓點與岸標挑出穩定窗口，完成三次桅頂落石。"],
      cabin: ["把風留在甲板外", "停船與穩速時，各做滴水與拋接；四格都完成才能比較。"],
      "speed-change": ["讓船改變速度", "先押加速與減速的落點，再各做一次；預測必須先封存。"],
      overlay: ["讓兩張紙相認", "先用同一串鼓點對齊，再切換參考物，解釋兩條看似不同的路。"],
      "public-demo": ["把程序公開", "按可重做的順序公布基準、穩速窗口、釋放方法與重複結果。"],
      audit: ["三道公開質詢", "每一問選一張真正做過相應對照的證據。"],
      boundary: ["最後的證據邊界", "指出這場演示排除了什麼，又沒有直接證明什麼。"]
    };
    return m[phase] || ["航船實驗", "完成眼前的比較。"];
  }
  function ship3Table(parent, headers, rows) {
    var table = ship3El("table", null, parent, "shipTable");
    var trh = document.createElement("tr");
    headers.forEach(function (h) { ship3El("th", h, trh); }); table.appendChild(trh);
    rows.forEach(function (row) {
      var tr = document.createElement("tr"); row.forEach(function (x) { ship3El("td", x, tr); }); table.appendChild(tr);
    });
    return table;
  }
  function ship3VisualId(phase) {
    var map = ASSETS && ASSETS.shipExperimentVisuals;
    if (!map) return null;
    var spec = map[phase];
    if (typeof spec === "string") return spec;
    if (spec && phase === "speed-change") {
      var k = ship3VisualRun && /^speed-(accelerating|decelerating)$/.exec(ship3VisualRun.kind);
      return spec[k ? k[1] : "default"] || spec.default;
    }
    return null;
  }
  function ship3Diagram(parent, lab, phase) {
    var anim = ship3VisualRun && ship3VisualRun.kind || "idle";
    var fig = ship3El("figure", null, parent, "shipDiagram shipSceneVisual " + phase + " " + anim);
    fig.setAttribute("aria-label", "第三章「" + ship3Mission(phase)[0] + "」互動模擬");
    var entry = assetEntry(ship3VisualId(phase));
    if (entry) {
      var plate = document.createElement("img");
      plate.className = "shipScenePlate"; plate.src = assetUrl(entry); plate.alt = ""; plate.setAttribute("aria-hidden", "true");
      fig.appendChild(plate);
    }
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 1000 563"); svg.setAttribute("aria-hidden", "true"); svg.setAttribute("class", "shipSimLayer"); fig.appendChild(svg);
    function draw(tag, cls, attrs, text) {
      var n = document.createElementNS(ns, tag); if (cls) n.setAttribute("class", cls);
      Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
      if (text != null) n.textContent = text; svg.appendChild(n); return n;
    }

    if (phase === "baseline" || phase === "first-failure" || phase === "steady-mast") {
      var dock = phase === "baseline", x = dock ? 300 : (phase === "steady-mast" ? 376 : 300);
      var drop = ship3VisualRun && /^mast-/.test(anim);
      var dx = drop ? Math.max(-58, Math.min(58, (ship3VisualRun.offset || 0) * 72)) : 0;
      draw("line", "shipSimPlumb", { x1: x, y1: 70, x2: x, y2: 462 });
      draw("circle", "shipSimTarget", { cx: x, cy: 463, r: 28 });
      var stone = draw("circle", "shipSimStone" + (drop ? " running" : ""), { cx: x, cy: 75, r: 15 });
      stone.style.setProperty("--ship-dx", dx + "px"); stone.style.setProperty("--ship-dy", "388px");
      if (drop || (lab.mastRuns || []).length || (lab.baselineRuns || []).length) {
        var last = phase === "baseline" ? (lab.baselineRuns || []).slice(-1)[0] : (lab.mastRuns || []).slice(-1)[0];
        var off = last && typeof last.offset === "number" ? Math.max(-58, Math.min(58, last.offset * 72)) : dx;
        draw("circle", "shipSimLanding", { cx: x + off, cy: 463, r: 10 });
      }
      draw("text", "shipSimLabel", { x: x + 38, y: 94 }, phase === "steady-mast" ? "穩速窗口" : (phase === "first-failure" ? "離岸加速" : "停船基準"));
    } else if (phase === "cabin") {
      draw("line", "shipSimGuide", { x1: 154, y1: 129, x2: 154, y2: 386 });
      draw("ellipse", "shipSimBowl", { cx: 154, cy: 402, rx: 55, ry: 16 });
      draw("path", "shipSimTossArc", { d: "M790 410 Q790 165 790 410" });
      var cabinKind = /cabin-(dock|steady)-(drip|toss)/.exec(anim);
      if (cabinKind && cabinKind[2] === "drip") draw("circle", "shipSimDrop running", { cx: 154, cy: 146, r: 9 });
      if (cabinKind && cabinKind[2] === "toss") draw("circle", "shipSimTossBall running", { cx: 790, cy: 410, r: 15 });
      [["dock", "停船", 344], ["steady", "近似穩速", 692]].forEach(function (v) {
        var done = lab.cabin[v[0]].drip && lab.cabin[v[0]].toss;
        draw("rect", "shipSimBadge " + (done ? "done" : ""), { x: v[2], y: 474, width: 160, height: 42, rx: 8 });
        draw("text", "shipSimBadgeText", { x: v[2] + 80, y: 501, "text-anchor": "middle" }, (done ? "✓ " : "") + v[1]);
      });
    } else if (phase === "speed-change") {
      var speedKind = /speed-(accelerating|decelerating)/.exec(anim);
      var kind = speedKind ? speedKind[1] : (lab.speedRuns.decelerating ? "decelerating" : "accelerating");
      var sx = 410, resultDx = kind === "accelerating" ? -120 : 120;
      draw("line", "shipSimDeckAxis", { x1: 180, y1: 458, x2: 740, y2: 458 });
      draw("line", "shipSimPlumb", { x1: sx, y1: 104, x2: sx, y2: 458 });
      draw("circle", "shipSimTarget", { cx: sx, cy: 458, r: 25 });
      var movingStone = draw("circle", "shipSimStone" + (speedKind ? " running" : ""), { cx: sx, cy: 105, r: 15 });
      movingStone.style.setProperty("--ship-dx", resultDx + "px"); movingStone.style.setProperty("--ship-dy", "353px");
      if (speedKind || lab.speedRuns[kind]) draw("circle", "shipSimLanding", { cx: sx + resultDx, cy: 458, r: 11 });
      draw("text", "shipSimAxisText", { x: 206, y: 501 }, "船尾"); draw("text", "shipSimAxisText", { x: sx - 25, y: 501 }, "桅腳"); draw("text", "shipSimAxisText", { x: 680, y: 501 }, "船頭");
      draw("text", "shipSimState", { x: 760, y: 76, "text-anchor": "end" }, kind === "accelerating" ? "加槳：船加速" : "收槳：船減速");
    } else if (phase === "overlay") {
      var beats = [0, 1, 2, 3], xs = [210, 395, 580, 765], shoreY = [292, 302, 327, 371], shipY = [375, 385, 410, 454];
      draw("path", "shipPaperPath shore", { d: "M" + xs.map(function (x, i) { return x + " " + shoreY[i]; }).join(" L") });
      draw("path", "shipPaperPath ship " + (lab.overlay.transformed ? "revealed" : ""), { d: "M" + xs.map(function (x, i) { return (lab.overlay.transformed ? 505 : x) + " " + shipY[i]; }).join(" L") });
      beats.forEach(function (b, i) {
        draw("circle", "shipPaperBeat " + (lab.overlay.aligned ? "aligned" : ""), { cx: xs[i], cy: shoreY[i], r: 8 });
        draw("circle", "shipPaperBeat " + (lab.overlay.aligned ? "aligned" : ""), { cx: lab.overlay.transformed ? 505 : xs[i], cy: shipY[i], r: 8 });
      });
      draw("text", "shipPaperLabel", { x: 830, y: 308, "text-anchor": "end" }, "岸上紀錄");
      draw("text", "shipPaperLabel", { x: 830, y: 393, "text-anchor": "end" }, lab.overlay.transformed ? "船上紀錄（已換參考物）" : "待對齊的第二張紙");
    } else {
      [228, 350, 472, 594, 716].forEach(function (x, i) {
        var got = !!lab.evidence["g" + (i + 1)];
        draw("circle", "shipEvidenceSeal " + (got ? "got" : ""), { cx: x, cy: 394, r: 28 });
        draw("text", "shipEvidenceSealText", { x: x, y: 402, "text-anchor": "middle" }, "G" + (i + 1));
      });
    }
    var cap = ship3El("figcaption", null, fig);
    if (phase === "cabin") {
      cap.textContent = "親手按下滴水或拋接：停船與近似穩速要各做一次，結果才有資格比較。";
    } else if (phase === "speed-change") {
      cap.textContent = "石頭離手後保留原先速度；船再加速或減速，才改變它相對桅腳的落點。";
    } else if (phase === "overlay" && lab.overlay.transformed) {
      cap.textContent = lab.overlay.activeReference === "ship"
        ? "目前以船為參考：扣除桅杆位移後，石頭相對桅杆近乎直落。"
        : "目前以岸為參考：石頭保有前行，同時向下加速。";
    } else if (phase === "public-demo" || phase === "audit" || phase === "boundary") {
      cap.textContent = "把五張證據分開擺好：它們共同支持模型，但每張只能回答自己真正測過的問題。";
    } else cap.textContent = "按下放手後，石頭與落點會依這次船況實際演出；失敗紀錄同樣保留。";
    return fig;
  }
  function renderShip(v, box) {
    var ek = v.scene + "/" + v.nodeId;
    if (ek !== ship3EmbedKey) { ship3EmbedKey = ek; ship3Msg = ""; }
    var lab = state.lab, ev = lab.evidence || {}, mission = ship3Mission(v.phase);
    box.className = "shipLab";
    var head = ship3El("header", null, box, "shipHead");
    ship3El("small", "第三章・共同運動實驗", head);
    ship3El("h2", mission[0], head);
    ship3El("p", mission[1], head);
    var chips = ship3El("div", null, head, "shipEvidenceChips");
    ["G1", "G2", "G3", "G4", "G5"].forEach(function (id) {
      ship3El("span", (ev[id.toLowerCase()] ? "✓ " : "○ ") + id, chips, ev[id.toLowerCase()] ? "got" : "");
    });
    var body = ship3El("div", null, box, "shipBody");
    var visual = ship3El("section", null, body, "shipVisual");
    ship3Diagram(visual, lab, v.phase);
    var work = ship3El("section", null, body, "shipWork");

    if (v.phase === "baseline") {
      ship3El("h3", "一、先知道『正下方』在哪裡", work);
      var row = ship3El("div", null, work, "shipRow");
      var release = ship3Select(row, ["hand", "string", "latch"], {
        hand: "直接手放（容易多推一下）", string: "剪斷細繩", latch: "抽開門閂"
      }, lab.release || "hand");
      ship3Btn(row, "採用這種釋放法", function () { doShip("setRelease", { mode: release.value }, "✓ 釋放方法已固定；接下來每次都照同一種做。"); });
      ship3Btn(work, lab.plumbCalibrated ? "✓ 鉛垂線已校準" : "校準鉛垂線・1 天", function () {
        doShip("calibratePlumb", {}, "✓ 桅腳正下方已在沙盤上標出。");
      }, "shipAction", lab.plumbCalibrated);
      ship3Btn(work, "放手，記一次停船落點", function () {
        doShip("runBaseline", {}, function (rr) {
          return rr.ready ? "✓ 三次乾淨基準已聚在桅腳附近。" : (rr.run && rr.run.clean ? "已留下乾淨落點；還需要三次成組。" : "這次手放帶入額外推力，保留紀錄，但不能當乾淨基準。");
        });
      });
      ship3Table(work, ["#", "釋放", "相對桅腳", "可用"], (lab.baselineRuns || []).map(function (r) {
        return [r.id, { hand: "手放", string: "剪繩", latch: "門閂" }[r.release], (r.offset > 0 ? "+" : "") + r.offset.toFixed(2), r.clean ? "✓" : "—"];
      }));
    }
    if (v.phase === "first-failure") {
      ship3El("h3", "二、船剛離岸時", work);
      ship3El("p", "鼓點仍在加快；這次故意把條件不穩的結果留下。", work, "shipNote");
      ship3Btn(work, "在離岸加速時放手", function () {
        doShip("runMast", { window: "depart" }, function (rr) { return "落點偏後 " + Math.abs(rr.run.offset).toFixed(2) + " 格。先別叫它失敗——記下船還在加速。"; });
      });
    }
    if (v.phase === "steady-mast") {
      ship3El("h3", "三、挑對放手窗口", work);
      var wr = ship3El("div", null, work, "shipChoiceGrid");
      ship3Btn(wr, "離岸立刻放（仍加速）", function () { doShip("runMast", { window: "depart" }, "這一筆偏後；船速還沒穩定。"); });
      ship3Btn(wr, "只聽一拍鼓（資訊不足）", function () { doShip("runMast", { window: "drumOnly" }, "只聽一拍抓不到速度是否穩定，落點仍偏後。"); });
      ship3Btn(wr, "連續岸標等距後放手", function () { doShip("runMast", { window: "stable" }, "✓ 穩速窗口落點已記錄。"); });
      ship3Table(work, ["#", "窗口", "船況", "相對桅腳"], (lab.mastRuns || []).map(function (r) {
        return [r.id, r.window === "stable" ? "岸標等距" : (r.window === "depart" ? "離岸" : "單拍鼓"), r.state === "steady" ? "近似穩速" : "加速", (r.offset > 0 ? "+" : "") + r.offset.toFixed(2)];
      }));
    }
    if (v.phase === "cabin") {
      ship3El("h3", "四、封閉船艙四格", work);
      [["dock", "停船"], ["steady", "近似穩速"]].forEach(function (vs) {
        var card = ship3El("div", null, work, "shipCabinCard"); ship3El("b", vs[1], card);
        [["drip", "滴水入碗"], ["toss", "向上拋接"]].forEach(function (t) {
          ship3Btn(card, (lab.cabin[vs[0]][t[0]] ? "✓ " : "") + t[1], function () {
            doShip("runCabin", { vesselState: vs[0], test: t[0] }, "✓ " + vs[1] + "・" + t[1] + "已記錄。");
          }, "shipAction", lab.cabin[vs[0]][t[0]]);
        });
      });
    }
    if (v.phase === "speed-change") {
      ship3El("h3", "五、先押加速與減速", work);
      if (!lab.predictions.locked) {
        var pr = ship3El("div", null, work, "shipPredict");
        ship3El("label", "放手後船加速：", pr); var pa = ship3Select(pr, ["behind", "foot", "ahead"], { behind: "偏向船尾", foot: "桅腳附近", ahead: "偏向船頭" }, "behind");
        ship3El("label", "放手後船減速：", pr); var pd = ship3Select(pr, ["behind", "foot", "ahead"], { behind: "偏向船尾", foot: "桅腳附近", ahead: "偏向船頭" }, "ahead");
        ship3Btn(pr, "用墨封存預測", function () { doShip("setSpeedPrediction", { accelerating: pa.value, decelerating: pd.value }, "✓ 預測已封存；現在才看結果。"); });
      } else {
        ship3El("p", "你的預測｜加速：" + ({ behind: "船尾", foot: "桅腳", ahead: "船頭" }[lab.predictions.accelerating]) + "；減速：" + ({ behind: "船尾", foot: "桅腳", ahead: "船頭" }[lab.predictions.decelerating]), work, "shipNote");
        ship3Btn(work, (lab.speedRuns.accelerating ? "✓ " : "") + "放手後加槳", function () { doShip("runSpeedChange", { kind: "accelerating" }, "加速結果已揭曉：石頭相對船偏後。"); }, "shipAction", !!lab.speedRuns.accelerating);
        ship3Btn(work, (lab.speedRuns.decelerating ? "✓ " : "") + "放手後收槳", function () { doShip("runSpeedChange", { kind: "decelerating" }, "減速結果已揭曉：石頭相對船偏前。"); }, "shipAction", !!lab.speedRuns.decelerating);
      }
    }
    if (v.phase === "overlay") {
      ship3El("h3", "六、同一事件，兩張紙", work);
      if (!lab.overlay.aligned) {
        ship3Btn(work, "只把兩張紙的終點疊在一起", function () { doShip("alignRecords", { pair: "thirdFourth" }); });
        ship3Btn(work, "用同一串鼓點逐拍對齊", function () { doShip("alignRecords", { pair: "sameBeats" }, "✓ 同一聲鼓代表同一時刻；兩張紙現在可以比較。"); });
      } else if (!lab.overlay.transformed) {
        ship3Btn(work, "把其中一張等比例縮放", function () { doShip("transformRecords", { kind: "scaleOnly" }); });
        ship3Btn(work, "每一拍都扣除桅杆向前的位移", function () { doShip("transformRecords", { kind: "subtractMast" }, "✓ 岸上彎路轉成船上直落；兩張圖描述的是同一事件。"); });
      } else {
        var refs = ship3El("div", null, work, "shipRefToggle");
        ship3Btn(refs, "以岸為參考", function () { doShip("setReference", { ref: "shore" }, "現在看岸上紙：石頭向前且下落。"); }, "shipAction " + (lab.overlay.activeReference === "shore" ? "active" : ""));
        ship3Btn(refs, "以船為參考", function () { doShip("setReference", { ref: "ship" }, "現在看船上紙：石頭相對桅杆近乎直落。"); }, "shipAction " + (lab.overlay.activeReference === "ship" ? "active" : ""));
      }
    }
    if (v.phase === "public-demo") {
      ship3El("h3", "七、公開可重做的程序", work);
      var steps = [["baseline", "公布停船基準"], ["stable-window", "公布穩速窗口"], ["no-push", "公布無額外推力的釋放法"], ["repeat", "連做三次並保留預測"]];
      steps.forEach(function (st, i) {
        var done = lab.publicDemo.procedure.indexOf(st[0]) >= 0;
        ship3Btn(work, (done ? "✓ " : (i + 1) + "．") + st[1], function () { doShip("runPublicStep", { step: st[0] }, done ? "" : "✓ 程序第 " + (i + 1) + " 步已公開。"); }, "shipAction", done || i !== lab.publicDemo.procedure.length);
      });
    }
    if (v.phase === "audit") {
      ship3El("h3", "八、讓證據各守一個問題", work);
      var questions = [
        ["wind", "甲板有風，怎麼知道不是風把石頭帶回桅腳？"],
        ["acceleration", "船艙裡分不出，第一回為什麼仍落在桅後？"],
        ["paths", "船上直落、岸上彎下，哪一張才是真的？"]
      ];
      questions.forEach(function (q) {
        var card = ship3El("div", null, work, "shipAuditCard");
        ship3El("b", (lab.audit[q[0]] ? "✓ " : "") + q[1], card);
        if (!lab.audit[q[0]]) {
          var owned = ["G1", "G2", "G3", "G4"].filter(function (id) { return state.evidence[id]; });
          var labels = {}; owned.forEach(function (id) { labels[id] = id + "・" + SCENES.evidenceNames[id]; });
          var pick = ship3Select(card, owned, labels, owned[0]);
          ship3Btn(card, "用這張證據回答", function () { doShip("answerAudit", { questionId: q[0], evidenceId: pick.value }, "✓ 這道質詢已有可追查的回答。"); });
        }
      });
    }
    if (v.phase === "boundary") {
      ship3El("h3", "九、勝利不能比證據走得更遠", work);
      ship3Btn(work, "宣告：這已證明地球正在運動", function () { doShip("setBoundary", { choice: "overclaim" }); }, "shipAction danger");
      ship3Btn(work, "宣告：它排除了『船動則石落後』，但沒有直接量到地球在動", function () { doShip("setBoundary", { choice: "honest" }, "✓ 結論停在證據真正走到的地方。"); }, "shipAction primary");
    }

    var msg = ship3El("p", ship3Msg || "先完成本段目的；所有失敗紀錄都會保留，不必重開遊戲。", work, "shipMessage");
    msg.setAttribute("role", "status");
    if (N.embedReady(state)) {
      ship3Btn(work, "▶ 收好紀錄，回到故事", function () {
        var r = N.embedComplete(state);
        if (r.error) { ship3Msg = "✕ " + r.error; renderAll(); return; }
        setState(r.state); ship3Msg = ""; renderAll();
      }, "shipGate primary");
    }
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
    if (v.type === "embed" && v.system === "ship") {
      renderShip(v, box);
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
      mkBtn(box, CHAPTER_ID === "ch3" ? "封存第三章" : (CHAPTER_ID === "ch2" ? "封存第二章" : "封存第一章"), function () {
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

  function chapterLabel() { return CHAPTER_ID === "ch3" ? "第三章" : (CHAPTER_ID === "ch2" ? "第二章" : "第一章"); }
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
    document.title = CHAPTER_ID === "ch3"
      ? "《發現之前》第三章：船艙裡的靜止（舞台版）"
      : (CHAPTER_ID === "ch2" ? "《發現之前》第二章：第一寸的弧線（舞台版）"
        : "《發現之前》第一章：重物的渴望（舞台版）");
    var meta = document.querySelector(".chapterStatusText strong");
    if (meta) meta.textContent = CHAPTER_ID === "ch3" ? "第三章・船艙裡的靜止" : (CHAPTER_ID === "ch2" ? "第二章・第一寸的弧線" : "第一章・重物的渴望");
    var legend = document.querySelector("#titleCard fieldset legend");
    if (legend) legend.textContent = "從" + chapterLabel() + "開始・選擇模式（中途不可換）";
    $("btnNew").textContent = "開始" + chapterLabel();
    $("btnContinue").textContent = "繼續" + chapterLabel();
    Array.prototype.forEach.call(document.querySelectorAll(".chapterPick"), function (b) {
      var mine = b.getAttribute("data-chapter") === ("ch0" + CHAPTER_ID.slice(2));
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
