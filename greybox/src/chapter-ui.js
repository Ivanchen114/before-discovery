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
  var CHAPTER_ID = N.CHAPTER_ID || (/^ch[1234]$/.test(SCENES.chapter) ? SCENES.chapter : "ch1");
  var KEY = window.BD_SAVE_KEY || "bd_ch1_save"; /* R-SAV2:chapter2.html 覆寫為 bd_ch2_save;未設=第一章原值,灰盒零差異 */
  var SERIES_KEY = "bd_series_progress_v1";
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
  function sceneTitleText(value) {
    if (TEXT && TEXT.playerSceneTitle) return TEXT.playerSceneTitle(value);
    return String(value || "故事進行中")
      .replace(/^死路\s*[A-ZＡ-Ｚ]\s*[：:]\s*/, "")
      .replace(/^修復\s*[：:]\s*/, "");
  }
  function fmt(v) { return (Math.round(v * 10) / 10).toFixed(1); }
  function cfgLabel(c) { return c.ball + "·" + c.surface + "·" + c.incline + "·" + c.timer; }

  /* ---------- 表現層事件掛點(§5.9 延伸:純發佈,無監聽者時零行為差異) ----------
     stage.html 的舞台殼(stage-ui.js)訂閱這些事件做打字機/背景/立繪;
     chapter.html 無訂閱者,灰盒行為不變。 */
  var replaying = false;
  var pendingEvidence = [];
  var pendingEvidenceTimer = null;
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
    if (!window.GB.Sanitize) return { ok: false, reason: "進度檢查功能未就緒" };
    if (CHAPTER_ID === "ch2") return window.GB.Sanitize.sanitizeImport2(s, SCENES, window.GB.Engine2);
    if (CHAPTER_ID === "ch3") return window.GB.Sanitize.sanitizeImport3(s, SCENES, window.GB.Engine3);
    if (CHAPTER_ID === "ch4") return window.GB.Sanitize.sanitizeImport4(s, SCENES, window.GB.Engine4);
    return window.GB.Sanitize.sanitizeImport(s, PATTERNS, SCENES);
  }
  function showNewWarn(text) {
    var warn = $("newWarn");
    if (!warn) return;
    warn.style.display = "";
    warn.textContent = displayText(text);
  }
  function inspectSaveText(text) {
    if (!text) return { empty: true };
    var migrated = migrateLegacyCh2(text);
    var r = N.loadSave(migrated || text);
    if (r.empty) return { empty: true };
    if (r.error) return { error: r.error === "schema" ? "版本不符" : "檔案損壞" };
    var chk = sanitizeLoaded(r.state);
    if (!chk.ok) return { error: chk.reason };
    return { state: chk.state, migrated: !!migrated };
  }
  function restoreBackup() {
    var backup = null;
    try { backup = localStorage.getItem(KEY + "_corrupt"); } catch (e) { return null; }
    var checked = inspectSaveText(backup);
    if (!checked.state) return null; /* 真壞檔仍留作人工診斷，不冒險匯入。 */
    try { localStorage.setItem(KEY, N.serialize(checked.state)); } catch (e2) {}
    showNewWarn("已恢復先前被誤判並備份的進度，可以繼續遊戲。");
    return checked.state;
  }
  function tryLoad() { /* B-3/R-SAV-02:壞檔備份+一次性非阻塞提示 */
    var text = null;
    try { text = localStorage.getItem(KEY); } catch (e) { return null; }
    if (!text) return restoreBackup();
    var checked = inspectSaveText(text);
    if (checked.empty) return restoreBackup();
    if (checked.error) {
      try { localStorage.setItem(KEY + "_corrupt", text); localStorage.removeItem(KEY); } catch (e2) {}
      showNewWarn("偵測到無法安全讀取的舊進度（" + checked.error + "），已備份；請開新遊戲。");
      return null;
    }
    if (checked.migrated) {
      try { localStorage.setItem(KEY, N.serialize(checked.state)); } catch (e3) {}
    }
    return checked.state;
  }
  function readSeriesProgress() {
    var empty = { schemaVersion: 1, chapters: {} };
    try {
      var parsed = JSON.parse(localStorage.getItem(SERIES_KEY) || "null");
      if (!parsed || parsed.schemaVersion !== 1 || !parsed.chapters || typeof parsed.chapters !== "object") return empty;
      ["ch1", "ch2", "ch3", "ch4"].forEach(function (id) {
        var v = parsed.chapters[id];
        if (!v || v.completed !== true) delete parsed.chapters[id];
      });
      return parsed;
    } catch (e) { return empty; }
  }
  function markChapterComplete(s) {
    if (!s || !s.ended) return;
    var progress = readSeriesProgress();
    var prev = progress.chapters[CHAPTER_ID] || {};
    progress.chapters[CHAPTER_ID] = {
      completed: true,
      completedAt: prev.completedAt || new Date().toISOString(),
      mode: s.mode,
      days: s.lab && typeof s.lab.days === "number" ? s.lab.days : 0
    };
    try { localStorage.setItem(SERIES_KEY, JSON.stringify(progress)); } catch (e) {}
  }
  function collectNewEvidence(before, after) {
    var old = before && before.evidence || {};
    var now = after && after.evidence || {};
    var names = SCENES.evidenceNames || {};
    var sourceScene = before && before.cursor ? before.cursor.scene : (after.cursor && after.cursor.scene);
    Object.keys(now).forEach(function (code) {
      if (now[code] && !old[code]) pendingEvidence.push({
        code: code,
        name: names[code] || "新證據",
        sceneId: sourceScene
      });
    });
    /* 實驗取得證據時不一定有取得台詞：等本次事件堆疊完成後才補發。
       若後續 addLine 已把證據附在取得台詞上，此 timer 會自然變成 no-op。 */
    if (pendingEvidence.length && !pendingEvidenceTimer) {
      pendingEvidenceTimer = setTimeout(function () {
        pendingEvidenceTimer = null;
        takePendingEvidence().forEach(function (item) { emit("bd:evidence", item); });
      }, 0);
    }
  }
  function takePendingEvidence() {
    if (!pendingEvidence.length) return [];
    var items = pendingEvidence.slice();
    pendingEvidence.length = 0;
    return items;
  }
  function setState(s) {
    var before = state;
    state = s;
    var rd = N.redirectIfLocked(state);
    if (rd.redirected) {
      state = rd.state;
      addLine("system", "(信譽歸零——關鍵人物暫時拒絕與你交談。)", "system");
      lastSceneShown = null;
    }
    markChapterComplete(state);
    save();
    collectNewEvidence(before, state);
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
      img.src = assetUrl(e); img.alt = alt || "角色立繪"; img.className = "portrait";
      img.loading = "lazy";
      return img;
    }
    var wrap = document.createElement("span");
    wrap.className = "composite";
    wrap.style.position = "relative"; wrap.style.display = "inline-block";
    var base = document.createElement("img");
    base.src = assetUrl(e); base.alt = alt || "角色立繪";
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
  function addLine(speaker, text, cls, sceneId) {
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
    emit("bd:line", {
      speaker: speaker || null,
      text: shownText,
      cls: cls || "",
      scene: sceneId || (state && state.cursor ? state.cursor.scene : null),
      evidence: replaying ? [] : takePendingEvidence(),
      replay: replaying
    });
  }
  function classFor(speaker) {
    if (speaker === "stage") return "stage";
    if (speaker === "system") return "system";
    if (speaker === "旅人(你)") return "player";
    return "";
  }
  function playerSceneTitle(sceneId) {
    var sc = null;
    SCENES.scenes.forEach(function (s) { if (s.id === sceneId) sc = s; });
    return sc && sc.title ? sceneTitleText(sc.title) : "故事進行中";
  }
  function sceneHeading(sceneId) {
    emit("bd:scene", { sceneId: sceneId });
    if (sceneId === lastSceneShown) return;
    lastSceneShown = sceneId;
    var sc = null;
    SCENES.scenes.forEach(function (s) { if (s.id === sceneId) sc = s; });
    var div = document.createElement("div");
    div.className = "scene-title";
    div.textContent = "◆ " + (sc && sc.title ? sceneTitleText(sc.title) : "故事進行中");
    $("log").appendChild(div);
    if (ASSETS && ASSETS.sceneBg) { /* 場景橫幅:資產落地即顯示 */
      var bg = assetEntry(ASSETS.sceneBg[CHAPTER_ID + ":" + sceneId] || ASSETS.sceneBg[sceneId]);
      if (bg) {
        var img = document.createElement("img");
        img.src = assetUrl(bg); img.alt = (sc && sc.title ? sceneTitleText(sc.title) : "故事") + "場景";
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
      addLine(e.speaker, e.text, classFor(e.speaker), e.scene);
    });
    replaying = false;
  }
  function syncNewTranscript(prevLen) {
    for (var i = prevLen; i < state.transcript.length; i++) {
      var e = state.transcript[i];
      sceneHeading(e.scene);
      addLine(e.speaker, e.text, classFor(e.speaker), e.scene);
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
        " 對照" + (g.g4 ? "●" : "○") + " 邊界" + (g.g5 ? "●" : "○");
      $("e3Val").title = "第三章的五步證據鏈：穩速桅落、封閉船艙、加減速對照、雙參考物對照、證據邊界。";
      $("dayVal").parentElement.title = "天數記錄校準、重複測量與公開驗證所花的時間。";
    } else if (CHAPTER_ID === "ch4") {
      var k4 = state.lab.evidence || {};
      $("e3Val").textContent = "月地模型：改向" + (k4.k1 ? "●" : "○") +
        " 縮放" + (k4.k2 ? "●" : "○") + " 預測" + (k4.k3 ? "●" : "○") +
        " 反驗" + (k4.k4 ? "●" : "○") + " 邊界" + (k4.k5 ? "●" : "○");
      $("e3Val").title = "第四章的五步證據鏈：逐拍改向、地月縮放、未揭露預測、雙模型反驗、出版邊界。";
      $("dayVal").parentElement.title = "天數只記錄可重做的模型工作；出版壓力另由送樣／延後行動推進，不按閱讀時間倒數。";
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
    } else if (CHAPTER_ID === "ch4") {
      var press = state.lab.proof && state.lab.proof.press;
      $("perVal").textContent = press
        ? (press.scheduleLost ? "出版：重新排程" : "校樣窗口：" + press.window + "/" + press.reservedWindows)
        : "";
    } else $("perVal").textContent = state.debate ? ("說服力：" + state.debate.persuasion + "/5") : "";
    $("modeVal").textContent = "模式：" + (state.mode === "scholar" ? "學者" : "探索");
    $("sceneVal").textContent = "場景：" + playerSceneTitle(state.cursor.scene);
    var names = SCENES.evidenceNames || {};
    var got = Object.keys(state.evidence).filter(function (k) { return state.evidence[k]; });
    var evidenceItems = got.map(function (k) {
      return { code: k, name: names[k] || "未命名證據" };
    });
    $("evidenceList").textContent = evidenceItems.length
      ? evidenceItems.map(function (item) { return item.name; }).join("、")
      : "(尚無)";
    /* 顯示文字可以翻譯、改名；資產解析只能吃穩定 ID，禁止從中文名稱反推資料鍵。 */
    $("evidenceList").dataset.items = JSON.stringify(evidenceItems);
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
        cb.setAttribute("aria-label", "選取實驗紀錄 #" + r.id + "（" + cfgLabel(r.config) + "）");
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
        return "實驗紀錄 #" + res.run.id + " 完成（" + cfgLabel(res.run.config) + "，第 " + res.run.seq + " 次）：" +
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
        if (a.ok) return type === "b"
          ? "斷言成立：只換球重，量到的規律沒有改變。"
          : "斷言成立：換了傾角，規律的形式仍然不變。";
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
    return names[code] || "未命名證據";
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
      var title = document.createElement("b"); title.textContent = (p.title || "未命名支柱").replace(/^第.支柱:/, "");
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
      /* 防版位猜題：兩章的可反證證詞在資料層皆為 s2，但畫面不固定放中間。
         只改呈現次序，證詞 id、判定與既有存檔完全不動。 */
      var statementDisplayOrder = { P1: [1, 0, 2], P2: [0, 2, 1], P3: [0, 1, 2] };
      var pillarOrder = d.pillar && statementDisplayOrder[d.pillar.id];
      var displayedStatements = pillarOrder && d.statements.length === 3
        ? pillarOrder.map(function (i) { return d.statements[i]; })
        : d.statements;
      displayedStatements.forEach(function (st) {
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
        slotP.textContent = "已選：" + d.fr.slots.length + "／3";
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
    if (!before.full && after.full) out.push("◆ 合成完整證據：桌緣彈射・平方根律。");
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
    var text = map[code] || "這一步目前無法完成，請檢查眼前的裝置與任務條件。";
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
    if (v.nodeId === "e3") return "▶ 收下完整證據，繼續劇情";
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
      var img = document.createElement("img"); img.src = assetUrl(e); img.alt = alt || "實驗器材圖";
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
      sel.setAttribute("aria-label", (slotNames[slot] || "裝置部位") + "零件");
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
    if (f2Claims.full) el("strong", "◆ 完整證據已收入旅人筆記", claims, "catClaimComplete");
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
  var ship3ClaimDraft = {}; /* 純 UI 草稿：錯答重繪後保留勾選，不偷寫進實驗紀錄。 */
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
      "same-direction": "加速與減速若都記成同一方向，就沒有真正比較兩種速度改變。",
      "g3-required": "先完成加速／減速對照，才會取得岸上與船上兩份紀錄。",
      "records-unread": "先逐拍讀完 0、1、2、3 號鼓點，確認每張紙各自在記什麼。",
      "alignment-required": "兩張紙必須先把同號鼓點配成同一時刻，不能只看終點。",
      "g4-required": "先把船上與岸上紀錄轉成可以互相對照的兩張圖。",
      "wrong-public-order": "公開驗證不能跳步：基準、穩速窗口、無額外推力、封存預測、重複三次。",
      "public-demo-required": "先完成公開驗證，再回答質詢。",
      "evidence-not-owned": "這張證據尚未取得，不能拿來回答。",
      "audit-incomplete": "三道質詢尚未全部封存。"
    };
    return map[code] || "這一步目前無法完成，請檢查眼前的實驗條件。";
  }
  function doShip(action, args, okText, failText) {
    var before = JSON.stringify(state.lab.evidence || {});
    var r = N.labAction(state, action, args || {});
    if (r.error) ship3Msg = "✕ " + ship3Error(r.error);
    else {
      setState(r.state);
      var rr = r.result || {};
      var delayedOverlayFeedback = null;
      if (rr.ok === false) {
        var why = {
          "beats-mismatch": "終點雖然重合了，但同一編號的鼓點仍錯開；你比較到的不是同一時刻。",
          "wrong-transform": "縮放只會改變圖的大小，不能改變參考物。請逐拍算『石頭相對岸的位置－桅杆相對岸的位置』。",
          "evidence-mismatch": "這張證據沒有直接回答這道質詢。換一張真正做過相應對照的紀錄。",
          "claim-mismatch": "這組紀錄還不足以支持你選的說法。檢查是否混入受干擾的紀錄，或把現象解釋成了資料沒有測量的原因。",
          "overclaim": "這場實驗排除一個反對，卻沒有直接量到地球正在運動。把結論收回證據邊界。"
        };
        var tailored = typeof failText === "function" ? failText(rr) : failText;
        var feedback = tailored || why[rr.reason] || "這一步還不能成立。";
        if ((action === "alignRecords" || action === "transformRecords") && rr.preview) {
          /* G4 的錯誤先在紙帶上完整演出，再補診斷；避免提示搶在可觀察後果之前。 */
          ship3Msg = "";
          delayedOverlayFeedback = { preview: rr.preview, text: "✕ " + feedback };
        } else ship3Msg = "✕ " + feedback;
      } else ship3Msg = typeof okText === "function" ? okText(rr) : (okText || "✓ 已記錄。");
      var visualKinds = {
        runBaseline: "mast-dock",
        runMast: args && args.window === "stable" ? "mast-steady" : "mast-accelerating",
        runCabin: "cabin-" + ((args && args.vesselState) || "dock") + "-" + ((args && args.test) || "drip"),
        runSpeedChange: "speed-" + ((args && args.kind) || "accelerating"),
        inspectRecordBeat: "tapes-read",
        alignRecords: args && args.pair === "sameBeats" ? "tapes-beats" : "tapes-endpoints",
        transformRecords: args && args.kind === "scaleOnly" ? "tapes-scale" : "tapes-subtract",
        resetOverlay: "tapes-reset",
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
          if (!old[k] && after[k]) ship3Msg = "◆ 取得證據：" + (SCENES.evidenceNames[k.toUpperCase()] || "新證據") + "\n" + ship3Msg;
        });
      }
      if (delayedOverlayFeedback) {
        renderAll();
        var pendingFeedback = delayedOverlayFeedback;
        var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.setTimeout(function () {
          var overlay = state.lab && state.lab.overlay;
          if (overlay && overlay.preview === pendingFeedback.preview) {
            ship3Msg = pendingFeedback.text;
            renderAll();
          }
        }, reduced ? 0 : 720);
        return;
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
      "speed-change": ["讓船改變速度", "先封存預測；加速與減速至少各做一次，之後可自由重做、比較平均落點。"],
      overlay: ["讓兩張紙相認", "先分開讀岸上與船上紀錄，再配對同一時刻，最後換成相對桅杆的位置。"],
      "public-demo": ["把程序公開", "按可重做的順序公布基準、穩速窗口、釋放方法與重複結果。"],
      audit: ["三道公開質詢", "每一問選一張真正做過相應對照的證據。"],
      boundary: ["最後的證據邊界", "指出這場公開驗證排除了什麼，又沒有直接證明什麼。"]
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
  function ship3ClaimPanel(parent, cfg) {
    var draft = ship3ClaimDraft[cfg.key] || { picked: {}, concept: cfg.concepts[0][0] };
    ship3ClaimDraft[cfg.key] = draft;
    var panel = ship3El("section", null, parent, "shipClaimPanel");
    ship3El("h4", cfg.title, panel);
    ship3El("p", cfg.instruction || "先勾選真正支持主張的紀錄，再選你認為成立的解釋。", panel, "shipNote");
    var sourceList = ship3El("div", null, panel, "shipClaimSources");
    var selectionStatus = cfg.selectionStatus ? ship3El("p", "", panel, "shipNote shipSelectionStatus") : null;
    if (selectionStatus) selectionStatus.setAttribute("aria-live", "polite");
    function pickedIds() {
      return Object.keys(draft.picked).filter(function (id) { return draft.picked[id]; });
    }
    function updateSelectionStatus() {
      if (selectionStatus) selectionStatus.textContent = cfg.selectionStatus(pickedIds());
    }
    cfg.sources.forEach(function (src) {
      var label = ship3El("label", null, sourceList, "shipClaimSource");
      var cb = document.createElement("input"); cb.type = "checkbox"; cb.checked = !!draft.picked[src.id];
      cb.onchange = function () { draft.picked[src.id] = cb.checked; updateSelectionStatus(); };
      label.appendChild(cb); label.appendChild(document.createTextNode(" " + displayText(src.label)));
    });
    updateSelectionStatus();
    var conceptRow = ship3El("div", null, panel, "shipClaimConcept");
    ship3El("label", "這組資料比較支持：", conceptRow);
    var concept = ship3Select(conceptRow, cfg.concepts.map(function (x) { return x[0]; }),
      Object.fromEntries(cfg.concepts), draft.concept);
    concept.onchange = function () { draft.concept = concept.value; };
    ship3Btn(conceptRow, "用所選紀錄提出斷言", function () {
      var picked = pickedIds();
      if (!picked.length) { ship3Msg = "✕ 先勾選你要引用的紀錄。斷言必須指出自己的證據來源。"; renderAll(); return; }
      if (cfg.selectionReady && !cfg.selectionReady(picked)) {
        ship3Msg = typeof cfg.incomplete === "function" ? cfg.incomplete(picked) :
          (cfg.incomplete || "✕ 這組資料還沒有形成可比較的證據。再檢查一次條件與重複紀錄。");
        renderAll(); return;
      }
      doShip(cfg.action, cfg.args(picked, concept.value), cfg.success);
    }, "shipAction primary");
    return panel;
  }
  function ship3VisualId(phase) {
    /* G4 必須由目前操作狀態即時繪製；靜態完成圖只留在資產庫，不進互動主畫面。 */
    if (phase === "overlay") return null;
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
    function draw(tag, cls, attrs, text, parentNode) {
      var n = document.createElementNS(ns, tag); if (cls) n.setAttribute("class", cls);
      Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
      if (text != null) n.textContent = text; (parentNode || svg).appendChild(n); return n;
    }

    if (phase === "baseline" || phase === "first-failure" || phase === "steady-mast") {
      /* 停船底板的桅頂石球與沙盤基準位於 x≈450；穩速底板另有自己的桅心。 */
      var dock = phase === "baseline", x = dock ? 450 : (phase === "steady-mast" ? 376 : 300);
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
      function speedRunList(k) {
        var raw = lab.speedRuns && lab.speedRuns[k];
        return Array.isArray(raw) ? raw : (raw ? [raw] : []);
      }
      var acceleratingRuns = speedRunList("accelerating"), deceleratingRuns = speedRunList("decelerating");
      var kind = speedKind ? speedKind[1] : (deceleratingRuns.length ? "decelerating" : "accelerating");
      var shownRuns = kind === "accelerating" ? acceleratingRuns : deceleratingRuns;
      var latestSpeedRun = shownRuns.slice(-1)[0];
      var sx = 410, resultDx = latestSpeedRun
        ? Math.max(-145, Math.min(145, latestSpeedRun.offset * 170))
        : (kind === "accelerating" ? -120 : 120);
      draw("line", "shipSimDeckAxis", { x1: 180, y1: 458, x2: 740, y2: 458 });
      draw("line", "shipSimPlumb", { x1: sx, y1: 104, x2: sx, y2: 458 });
      draw("circle", "shipSimTarget", { cx: sx, cy: 458, r: 25 });
      var movingStone = draw("circle", "shipSimStone" + (speedKind ? " running" : ""), { cx: sx, cy: 105, r: 15 });
      movingStone.style.setProperty("--ship-dx", resultDx + "px"); movingStone.style.setProperty("--ship-dy", "353px");
      shownRuns.slice(0, -1).forEach(function (r) {
        draw("circle", "shipSimLandingHistory", {
          cx: sx + Math.max(-145, Math.min(145, r.offset * 170)), cy: 458, r: 7
        });
      });
      if (speedKind || shownRuns.length) draw("circle", "shipSimLanding", { cx: sx + resultDx, cy: 458, r: 11 });
      draw("text", "shipSimAxisText", { x: 206, y: 501 }, "船尾"); draw("text", "shipSimAxisText", { x: sx - 25, y: 501 }, "桅腳"); draw("text", "shipSimAxisText", { x: 680, y: 501 }, "船頭");
      draw("text", "shipSimState", { x: 790, y: 76, "text-anchor": "end" },
        (kind === "accelerating" ? "加槳：船加速" : "收槳：船減速") +
        (shownRuns.length ? "｜第 " + shownRuns.length + " 次" : ""));
    } else if (phase === "overlay") {
      /* 先把兩份紀錄上下分開，建立閱讀順序；玩家讀完共同鼓點後，
         才做時間配對與「岸上位置－同拍桅杆位置」的換尺。 */
      var overlay = lab.overlay || {};
      var preview = overlay.preview || (overlay.transformed ? "subtractMast" : (overlay.aligned ? "sameBeats" : "initial"));
      var beats = [0, 1, 2, 3];
      var shoreX = [230, 380, 530, 680], shoreY = [116, 128, 160, 216];
      var shipX = 490, shipY = shoreY.map(function (y) { return y + 276; });
      var inspectedBeat = Number.isInteger(overlay.inspectionBeat) ? overlay.inspectionBeat : -1;
      var focusShore = overlay.activeReference === "ship" && overlay.transformed ? " dim" : "";
      var focusShip = overlay.activeReference === "shore" && overlay.transformed ? " dim" : "";

      fig.classList.add("shipTapeTool", "preview-" + preview);
      fig.setAttribute("aria-label", "雙紙帶操作：" + ({
        initial: "岸上紀錄在上，船上紀錄在下，等待逐拍閱讀。",
        inspection: "同一個鼓點正在兩張分開的紙上同時亮起。",
        endpoints: "只比較終點，仍把不同鼓點當成同一時刻。",
        sameBeats: "相同編號鼓點已配成同一時刻。",
        scaleOnly: "紙張大小改變，但量位置的起點沒有改變。",
        subtractMast: "岸上石頭位置逐拍扣除桅杆位置，得到船上直落記錄。"
      }[preview] || "雙紙帶等待操作。"));

      var defs = draw("defs");
      var arrow = draw("marker", "shipPaperArrowMarker", {
        id: "ship-paper-arrow", viewBox: "0 0 10 10", refX: 8, refY: 5,
        markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse"
      }, null, defs);
      draw("path", "", { d: "M 0 0 L 10 5 L 0 10 z" }, null, arrow);

      var shoreSheet = draw("g", "shipPaperSheetLayer shore" + focusShore);
      draw("rect", "shipPaperSheet shore", { x: 52, y: 28, width: 896, height: 236, rx: 12 }, null, shoreSheet);
      draw("text", "shipPaperLabel shore", { x: 76, y: 59 }, "上｜岸上紀錄：尺固定在碼頭", shoreSheet);
      draw("text", "shipPaperNote", { x: 76, y: 84 }, "每聲鼓：記石頭與桅杆各自離碼頭多遠", shoreSheet);
      draw("line", "shipPaperMastTrack", { x1: 190, y1: 238, x2: 760, y2: 238 }, null, shoreSheet);
      draw("path", "shipPaperPath shore", {
        d: "M" + shoreX.map(function (x, i) { return x + " " + shoreY[i]; }).join(" L")
      }, null, shoreSheet);
      beats.forEach(function (b, i) {
        var focused = inspectedBeat === i ? " focused" : "";
        draw("line", "shipPaperSameX" + focused, { x1: shoreX[i], y1: shoreY[i], x2: shoreX[i], y2: 238 }, null, shoreSheet);
        draw("circle", "shipPaperBeat shore" + focused, { cx: shoreX[i], cy: 99, r: 13 }, null, shoreSheet);
        draw("text", "shipPaperBeatLabel", { x: shoreX[i], y: 104, "text-anchor": "middle" }, String(b), shoreSheet);
        draw("circle", "shipPaperPosition shore" + focused, { cx: shoreX[i], cy: shoreY[i], r: 9 }, null, shoreSheet);
        draw("path", "shipPaperMastMarker" + focused, {
          d: "M" + (shoreX[i] - 10) + " 238 L" + shoreX[i] + " 215 L" + (shoreX[i] + 10) + " 238"
        }, null, shoreSheet);
      });

      var shipSheet = draw("g", "shipPaperSheetLayer ship " + preview + focusShip);
      draw("rect", "shipPaperSheet ship", { x: 52, y: 304, width: 896, height: 224, rx: 12 }, null, shipSheet);
      draw("text", "shipPaperLabel ship", { x: 76, y: 335 }, "下｜船上紀錄：尺固定在桅杆（桅杆＝0）", shipSheet);
      draw("text", "shipPaperNote", { x: 76, y: 360 }, "每聲鼓：只記石頭離桅杆的位置", shipSheet);
      draw("line", "shipPaperFixedMast", { x1: shipX, y1: 374, x2: shipX, y2: 508 }, null, shipSheet);
      draw("path", "shipPaperPath ship revealed", {
        d: "M" + shipY.map(function (y) { return shipX + " " + y; }).join(" L")
      }, null, shipSheet);
      beats.forEach(function (b, i) {
        var focused = inspectedBeat === i ? " focused" : "";
        draw("circle", "shipPaperBeat ship" + focused, { cx: 430, cy: shipY[i], r: 13 }, null, shipSheet);
        draw("text", "shipPaperBeatLabel", { x: 430, y: shipY[i] + 5, "text-anchor": "middle" }, String(b), shipSheet);
        draw("circle", "shipPaperPosition ship" + focused, { cx: shipX, cy: shipY[i], r: 9 }, null, shipSheet);
      });

      if (preview === "endpoints") {
        draw("text", "shipPaperPairBadge wrong", { x: 500, y: 292, "text-anchor": "middle" }, "只看終點：2 號 ≠ 3 號，時刻配錯");
      }
      if (preview === "sameBeats" || preview === "scaleOnly" || preview === "subtractMast") {
        draw("text", "shipPaperPairBadge right", { x: 500, y: 292, "text-anchor": "middle" }, "同一時刻：0↔0　1↔1　2↔2　3↔3");
      }
      if (preview === "scaleOnly") {
        draw("rect", "shipPaperScaledOutline", { x: 654, y: 376, width: 218, height: 110, rx: 8 });
        draw("path", "shipPaperPath ship scaled", { d: "M760 393 L760 402 L760 426 L760 470" });
        draw("text", "shipPaperCallout", { x: 763, y: 510, "text-anchor": "middle" }, "紙變小，桅杆＝0 沒有改");
      }
      if (overlay.transformed) {
        /* 岸上每拍的石頭與桅杆 x 相同；相減後四個 x 都回到桅杆的 0。 */
        draw("rect", "shipPaperConvertedPanel", { x: 778, y: 92, width: 142, height: 146, rx: 8 });
        draw("text", "shipPaperCallout converted", { x: 849, y: 113, "text-anchor": "middle" }, "換成桅杆＝0");
        beats.forEach(function (b, i) {
          draw("line", "shipPaperTransformArrow", {
            x1: shoreX[i], y1: shoreY[i], x2: 849, y2: shoreY[i],
            "marker-end": "url(#ship-paper-arrow)"
          });
          draw("circle", "shipPaperPosition converted", { cx: 849, cy: shoreY[i], r: 7 });
        });
        draw("path", "shipPaperPath converted revealed", {
          d: "M" + shoreY.map(function (y) { return "849 " + y; }).join(" L")
        });
      }

      var stepText = {
        initial: "先分開讀：上面以碼頭為起點，下面以桅杆為起點",
        inspection: inspectedBeat >= 0
          ? "鼓點 " + inspectedBeat + "：同一顆石頭、同一時刻，量位置的起點不同"
          : "逐拍讀兩張紙",
        endpoints: "只看終點會把不同時刻混在一起",
        sameBeats: "同號鼓點已配對；現在比較的是同一時刻",
        scaleOnly: "改紙張大小，沒有改變位置相對誰",
        subtractMast: "石頭離岸 − 桅杆離岸 ＝ 石頭離桅杆；兩份紀錄相符"
      };
      draw("text", "shipPaperStepLabel", { x: 500, y: 554, "text-anchor": "middle" }, stepText[preview]);
    } else {
      [228, 350, 472, 594, 716].forEach(function (x, i) {
        var got = !!lab.evidence["g" + (i + 1)];
        draw("circle", "shipEvidenceSeal " + (got ? "got" : ""), { cx: x, cy: 394, r: 28 });
        draw("text", "shipEvidenceSealText", { x: x, y: 402, "text-anchor": "middle" }, "G" + (i + 1));
      });
    }
    var cap = ship3El("figcaption", null, fig);
    if (phase === "cabin") {
      cap.textContent = "停船與近似穩速四種條件各至少一筆即可比較；任何一格都能自由重做。";
    } else if (phase === "speed-change") {
      cap.textContent = "每次落點都會保留；重做可看出方向是否穩定，不會覆蓋前一筆。";
    } else if (phase === "overlay") {
      var overlayPreview = lab.overlay.preview || (lab.overlay.transformed ? "subtractMast" : (lab.overlay.aligned ? "sameBeats" : "initial"));
      cap.textContent = ({
        initial: "上面是岸上紀錄，下面是船上紀錄。先逐拍看兩張紙各自在量什麼。",
        inspection: "亮起的是同一個鼓點：事件與時刻相同，量位置的起點不同。",
        endpoints: "只看終點仍會混用時刻；紙不需要疊在一起，鼓點才是配對依據。",
        sameBeats: "0、1、2、3 號鼓點已逐一配對；下一步要換的是量位置的起點。",
        scaleOnly: "紙張大小改了，『相對碼頭』與『相對桅杆』仍沒有互換。",
        subtractMast: lab.overlay.activeReference === "ship"
          ? "目前讀船上紀錄：桅杆固定為 0，石頭近乎直落。"
          : "目前讀岸上紀錄：桅杆每拍前進一格，石頭同時向前並下落。"
      })[overlayPreview] || "比較兩張紙帶上的同一事件。";
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
    var evidenceSteps = { G1: "落石", G2: "船艙", G3: "變速", G4: "雙視角", G5: "邊界" };
    ["G1", "G2", "G3", "G4", "G5"].forEach(function (id) {
      ship3El("span", (ev[id.toLowerCase()] ? "✓ " : "○ ") + evidenceSteps[id], chips, ev[id.toLowerCase()] ? "got" : "");
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
      if (!ev.g1 && (lab.mastRuns || []).filter(function (r) { return r.state === "steady"; }).length >= 3) {
        var g1Sources = (lab.baselineRuns || []).map(function (r) {
          return { id: "b" + r.id, label: "停船 #" + r.id + "｜" + (r.offset > 0 ? "+" : "") + r.offset.toFixed(2) + " 掌寬｜" + (r.clean ? "可用" : "手放擾動") };
        }).concat((lab.mastRuns || []).map(function (r) {
          return { id: "m" + r.id, label: (r.state === "steady" ? "穩速" : "加速") + " #" + r.id + "｜" + (r.offset > 0 ? "+" : "") + r.offset.toFixed(2) + " 掌寬" };
        }));
        function g1SelectionCounts(picked) {
          var baseIds = picked.filter(function (x) { return x[0] === "b"; }).map(function (x) { return parseInt(x.slice(1), 10); });
          var mastIds = picked.filter(function (x) { return x[0] === "m"; }).map(function (x) { return parseInt(x.slice(1), 10); });
          var baseline = (lab.baselineRuns || []).filter(function (r) { return r.clean && baseIds.indexOf(r.id) >= 0; }).length;
          var steady = (lab.mastRuns || []).filter(function (r) { return r.state === "steady" && mastIds.indexOf(r.id) >= 0; }).length;
          return { baseline: baseline, steady: steady, disturbed: picked.length - baseline - steady };
        }
        function g1SelectionClue(picked) {
          var count = g1SelectionCounts(picked);
          if (count.disturbed) return "選集中有條件改變的紀錄。它適合追查例外，不適合拿來做這次的公平比較。";
          if (!count.baseline && count.steady) return "你已描述行船時的落點，但還無法回答它『和什麼相同』。少了一種可以對照的船況。";
          if (count.baseline && !count.steady) return "你手上只有沒有前進時的基準；還缺真正要檢驗的行船情況。";
          if (!count.baseline && !count.steady) return "思考題：要判斷石頭是否保有船的前行，單看行船紀錄夠嗎？";
          if (count.baseline < 3 || count.steady < 3) return "兩種船況都有了，但其中一組仍只是零星結果。一次接近可能只是巧合。";
          return "兩組可重複、條件乾淨的紀錄已經成形。現在判斷它們共同支持哪一種解釋。";
        }
        ship3ClaimPanel(work, { key: "g1", title: "提出第一項主張：船近似穩速時，石頭落在哪裡？", sources: g1Sources,
          instruction: "先用紀錄組成一個公平比較，再選擇最能解釋結果的說法。別只找最接近零的數字；想想哪些船況應該互相比。",
          selectionStatus: g1SelectionClue,
          selectionReady: function (picked) {
            var count = g1SelectionCounts(picked);
            return count.baseline >= 3 && count.steady >= 3 && count.disturbed === 0;
          },
          incomplete: function (picked) { return "✕ " + g1SelectionClue(picked) + " 這次不記為斷言失敗。"; },
          concepts: [["mast-pulls-stone", "桅杆把石頭拉回來"], ["steady-shares-motion", "石頭離手後仍保有船原先的前行"], ["weight-finds-foot", "石頭會主動尋找桅腳"]],
          action: "assertG1", args: function (picked, concept) { return {
            baselineIds: picked.filter(function (x) { return x[0] === "b"; }).map(function (x) { return parseInt(x.slice(1), 10); }),
            mastIds: picked.filter(function (x) { return x[0] === "m"; }).map(function (x) { return parseInt(x.slice(1), 10); }), concept: concept
          }; }, success: "◆ 第一項主張成立：停船與近似穩速的乾淨紀錄都聚在桅腳附近。" });
      }
    }
    if (v.phase === "cabin") {
      ship3El("h3", "四、封閉船艙四格", work);
      ship3El("p", "先讓四種條件各留下一筆，便能開始比較；若你懷疑某一格只是巧合，可以隨時重做。", work, "shipNote shipStepPrompt");
      function cabinRuns(vessel, test) {
        var cell = lab.cabinResults && lab.cabinResults[vessel] && lab.cabinResults[vessel][test];
        if (Array.isArray(cell)) return cell;
        return cell ? [cell] : [];
      }
      function cabinMean(rows, key) {
        return rows.reduce(function (sum, row) { return sum + row[key]; }, 0) / rows.length;
      }
      [["dock", "停船"], ["steady", "近似穩速"]].forEach(function (vs) {
        var card = ship3El("div", null, work, "shipCabinCard"); ship3El("b", vs[1], card);
        [["drip", "滴水入碗"], ["toss", "向上拋接"]].forEach(function (t) {
          var count = cabinRuns(vs[0], t[0]).length;
          var label = count ? "再做「" + t[1] + "」（已有 " + count + " 筆）" : t[1];
          ship3Btn(card, label, function () {
            var next = cabinRuns(vs[0], t[0]).length + 1;
            doShip("runCabin", { vesselState: vs[0], test: t[0] },
              "✓ " + vs[1] + "・" + t[1] + "第 " + next + " 筆已記錄；仍可重做。");
          }, "shipAction", false);
        });
      });
      var cabinRows = [];
      [["dock", "停船"], ["steady", "近似穩速"]].forEach(function (vs) {
        [["drip", "滴水"], ["toss", "拋接"]].forEach(function (t) {
          var rows = cabinRuns(vs[0], t[0]);
          if (rows.length) {
            var offset = cabinMean(rows, "offset");
            var spread = cabinMean(rows, "spread");
            cabinRows.push([vs[1], t[1], rows.length,
              (offset > 0 ? "+" : "") + offset.toFixed(2), spread.toFixed(2)]);
          }
        });
      });
      if (cabinRows.length) ship3Table(work, ["船況", "操作", "筆數", "平均偏移（掌寬）", "平均散布"], cabinRows);
      if (!ev.g2 && cabinRows.length === 4) ship3ClaimPanel(work, { key: "g2", title: "提出第二項主張：停船與穩速船艙能否分辨？",
        sources: [["dock:drip", "停船・滴水"], ["dock:toss", "停船・拋接"], ["steady:drip", "穩速・滴水"], ["steady:toss", "穩速・拋接"]].map(function (x) { return { id: x[0], label: x[1] }; }),
        concepts: [["air-is-gone", "船艙裡沒有空氣，所以結果相同"], ["ship-too-slow", "船走得太慢，差異還沒出現"], ["steady-matches-dock", "在這些局部操作裡，停船與近似穩速的結果相近"]],
        action: "assertG2", args: function (picked, concept) { return { cells: picked, concept: concept }; },
        success: "◆ 第二項主張成立：四格資料沒有提供分辨停船與近似穩速的可靠差異。" });
    }
    if (v.phase === "speed-change") {
      ship3El("h3", "五、先封存加速與減速預測", work);
      function speedRuns(kind) {
        var raw = lab.speedRuns && lab.speedRuns[kind];
        return Array.isArray(raw) ? raw : (raw ? [raw] : []);
      }
      function speedMean(rows) {
        return rows.reduce(function (sum, r) { return sum + r.offset; }, 0) / rows.length;
      }
      if (!lab.predictions.locked) {
        var pr = ship3El("div", null, work, "shipPredict");
        ship3El("label", "放手後船加速：", pr); var pa = ship3Select(pr, ["behind", "foot", "ahead"], { behind: "偏向船尾", foot: "桅腳附近", ahead: "偏向船頭" }, "behind");
        ship3El("label", "放手後船減速：", pr); var pd = ship3Select(pr, ["behind", "foot", "ahead"], { behind: "偏向船尾", foot: "桅腳附近", ahead: "偏向船頭" }, "ahead");
        ship3Btn(pr, "用墨封存預測", function () { doShip("setSpeedPrediction", { accelerating: pa.value, decelerating: pd.value }, "✓ 預測已封存；現在才看結果。"); });
      } else {
        ship3El("p", "你的預測｜加速：" + ({ behind: "船尾", foot: "桅腳", ahead: "船頭" }[lab.predictions.accelerating]) + "；減速：" + ({ behind: "船尾", foot: "桅腳", ahead: "船頭" }[lab.predictions.decelerating]), work, "shipNote");
        var accelCount = speedRuns("accelerating").length, decelCount = speedRuns("decelerating").length;
        ship3Btn(work, accelCount ? "再做「放手後加槳」（已有 " + accelCount + " 筆）" : "放手後加槳", function () {
          doShip("runSpeedChange", { kind: "accelerating" }, function (rr) {
            return "第 " + rr.run.id + " 筆加速結果：石頭相對船偏後；紀錄已保留，仍可重做。";
          });
        });
        ship3Btn(work, decelCount ? "再做「放手後收槳」（已有 " + decelCount + " 筆）" : "放手後收槳", function () {
          doShip("runSpeedChange", { kind: "decelerating" }, function (rr) {
            return "第 " + rr.run.id + " 筆減速結果：石頭相對船偏前；紀錄已保留，仍可重做。";
          });
        });
      }
      var speedRows = ["accelerating", "decelerating"].filter(function (k) { return speedRuns(k).length > 0; }).map(function (k) {
        var rows = speedRuns(k), avg = speedMean(rows), latest = rows[rows.length - 1];
        return [k === "accelerating" ? "放手後加速" : "放手後減速", rows.length,
          (avg > 0 ? "+" : "") + avg.toFixed(2),
          avg < 0 ? "偏船尾" : "偏船頭", latest.matched ? "符合封存預測" : "不符封存預測"];
      });
      if (speedRows.length) ship3Table(work, ["船況", "筆數", "平均相對桅腳", "方向", "預測"], speedRows);
      if (!ev.g3 && speedRows.length === 2) ship3ClaimPanel(work, { key: "g3", title: "提出第三項主張：為什麼加速與減速留下相反偏移？",
        sources: [{ id: "accelerating", label: "放手後加速的全部紀錄：平均偏船尾" }, { id: "decelerating", label: "放手後減速的全部紀錄：平均偏船頭" }],
        concepts: [["speed-change-breaks-shared-motion", "石頭保留離手時的速度；船後來變速，才拉開相對位置"], ["stone-loses-force", "石頭的推力先耗盡，所以落後"], ["wind-reverses", "風向在兩次實驗中恰好相反"]],
        action: "assertG3", args: function (picked, concept) { return { kinds: picked, concept: concept }; },
        success: "◆ 第三項主張成立：改變共同運動，才會留下有方向的相對偏移。" });
    }
    if (v.phase === "overlay") {
      ship3El("h3", "六、同一事件，兩張紙", work);
      if (!lab.overlay.inspected) {
        var nextBeat = lab.overlay.inspectionBeat >= 3 ? 0 : lab.overlay.inspectionBeat + 1;
        ship3El("p", "第一步｜先別疊紙。上面用碼頭當起點，下面用桅杆當起點；按鼓點逐拍看同一顆石頭。", work, "shipNote shipStepPrompt");
        ship3Btn(work, "讀第 " + nextBeat + " 號鼓點", function () {
          doShip("inspectRecordBeat", {}, function (rr) {
            return rr.inspected
              ? "✓ 四個鼓點都讀過了；現在可以決定哪些標記代表同一時刻。"
              : "鼓點 " + rr.beat + " 已在上下兩張紙同時亮起。";
          });
        }, "shipAction primary");
      } else if (!lab.overlay.aligned) {
        ship3El("p", "第二步｜兩張紙不用疊在一起。鼓點是時間標記：哪種配法才是在比較同一時刻？", work, "shipNote shipStepPrompt");
        ship3Btn(work, "只拿兩張紙最後一點當成同一時刻", function () { doShip("alignRecords", { pair: "endpoints" }); });
        ship3Btn(work, "把同號鼓點配成同一時刻", function () { doShip("alignRecords", { pair: "sameBeats" }, "✓ 同號鼓點已配對；事件和時刻相同，接著只換量位置的起點。"); });
        ship3Btn(work, "重播逐拍閱讀", function () { doShip("inspectRecordBeat", {}, "再從 0 號鼓點開始逐拍看。"); });
      } else if (!lab.overlay.transformed) {
        ship3El("p", "第三步｜岸上紙同時記了石頭與桅杆離碼頭的位置。要改成『石頭離桅杆多遠』，該改紙張大小，還是改量位置的起點？", work, "shipNote shipStepPrompt");
        ship3Btn(work, "把船上紙等比例縮小", function () { doShip("transformRecords", { kind: "scaleOnly" }); });
        ship3Btn(work, "每一拍：石頭離岸 − 桅杆離岸", function () { doShip("transformRecords", { kind: "subtractMast" }, "✓ 每拍都換成從桅杆量起；上面的換算結果與下面的船上紀錄相符。"); });
      } else {
        ship3El("p", "第四步｜切換量位置的起點檢查兩張紙，再用兩份紀錄提出主張。", work, "shipNote shipStepPrompt");
        var refs = ship3El("div", null, work, "shipRefToggle");
        ship3Btn(refs, "以岸為參考", function () { doShip("setReference", { ref: "shore" }, "現在看岸上紙：石頭向前且下落。"); }, "shipAction " + (lab.overlay.activeReference === "shore" ? "active" : ""));
        ship3Btn(refs, "以船為參考", function () { doShip("setReference", { ref: "ship" }, "現在看船上紙：石頭相對桅杆近乎直落。"); }, "shipAction " + (lab.overlay.activeReference === "ship" ? "active" : ""));
        var paper = window.GB.Engine3._FIXTURE.paper;
        var paperRows = (paper.beats || []).map(function (beat, i) {
          return [beat, paper.shoreStoneX[i] + " − " + paper.mastX[i], paper.shipStoneX[i]];
        });
        ship3Table(work, ["鼓點", "岸上紙換算：石頭 − 桅杆", "船上紙讀值"], paperRows);
        var math = ship3El("details", null, work, "shipMathOptional");
        ship3El("summary", "想看數學寫法（選讀，不影響過關）", math);
        ship3El("p", "以第 2 拍為例：石頭離岸 2 格 − 桅杆離岸 2 格 ＝ 石頭離桅杆 0 格。", math);
        ship3El("p", "一般寫成：x（石頭相對船）＝x（石頭相對岸）−x（船相對岸）。", math);
        if (!ev.g4) ship3ClaimPanel(work, { key: "g4", title: "提出第四項主張：為什麼一張彎、一張直，卻都能成立？",
          instruction: "勾選兩張紙，再選出能同時解釋兩份紀錄的說法。",
          sources: [{ id: "shore", label: "岸上紙：石頭一邊向前、一邊下落" }, { id: "ship", label: "船上紙：石頭相對桅杆近乎直落" }],
          concepts: [["one-record-false", "只有其中一張圖是真的"], ["same-event-different-reference", "參考物不同，同一事件會留下不同路徑"], ["paper-distorts-path", "紙帶比例改變了石頭真正的路"]],
          action: "assertG4", args: function (picked, concept) { return { records: picked, concept: concept }; },
          success: "◆ 第四項主張成立：兩張紙不是互相否定，而是在回答『相對誰』。" });
      }
      if ((lab.overlay.preview || "initial") !== "initial") {
        var retry = ship3El("div", null, work, "shipTapeRetry");
        ship3Btn(retry, "兩張紙分開，從頭再讀", function () {
          doShip("resetOverlay", {}, "↺ 兩張紙已上下分開；逐拍閱讀、配對與換算都可以重做。");
        }, "shipAction");
      }
    }
    if (v.phase === "public-demo") {
      ship3El("h3", "七、公開驗證：先把條件鎖死", work);
      var publicDemo = SCENES.publicDemo || {};
      ship3El("p", publicDemo.purpose || "反對者要在結果出現前檢查程序，才能排除事後挑條件或改口。", work, "shipNote");
      var steps = publicDemo.steps || [];
      steps.forEach(function (st, i) {
        var done = lab.publicDemo.procedure.indexOf(st.id) >= 0;
        var active = i === lab.publicDemo.procedure.length;
        var card = ship3El("section", null, work, "shipCrossExam " + (done ? "resolved" : (active ? "active" : "pending")));
        ship3El("span", done ? "已回答" : "第 " + (i + 1) + " 問", card, "shipCrossExamStep");
        ship3El("b", (st.speaker || "艦長") + "：「" + st.question + "」", card, "shipCrossExamQuote");
        if (done) ship3El("p", st.reply, card, "shipCrossExamReply");
        else ship3Btn(card, st.action, function () {
          doShip("runPublicStep", { step: st.id }, "✓ 程序已公開，質疑與回答一起留在桌上。");
        }, "shipAction primary", !active);
      });
    }
    if (v.phase === "audit") {
      ship3El("h3", "八、三道公開質詢", work);
      ship3El("p", "每一張紀錄只能回答它真正測過的問題。選錯不會抹掉紀錄，提問者會指出缺口。", work, "shipNote");
      var questions = [
        ["wind", "商人", "甲板有風。怎麼知道不是風把石頭帶回桅腳？", "艦長：封閉船艙裡也得到相同結果。這一問我接受，不能只拿甲板風解釋。", "商人：那一筆就在甲板上，風也在；不能替自己排除風。"],
        ["acceleration", "槳手", "既然穩速船艙裡看不出差別，第一回為什麼仍落在桅後？", "艦長：我第一回看見的落後沒有錯；錯的是把加速結果說成所有船況。", "槳手：船艙只比停船和穩速，回答不了船速正在改變。"],
        ["paths", "艾蒂安", "船上看見直落，岸上看見彎曲。到底哪一張才是真的？", "艾蒂安：兩張紙記的是同一顆石頭；參考物不同，畫出的路徑就不同。", "艾蒂安：這份紀錄沒有把船上與岸上的位置放到同一組時刻裡。"]
      ];
      questions.forEach(function (q) {
        var card = ship3El("section", null, work, "shipAuditCard shipCrossExam " + (lab.audit[q[0]] ? "resolved" : "active"));
        ship3El("span", q[1] + "的質詢", card, "shipCrossExamStep");
        ship3El("b", "「" + q[2] + "」", card, "shipCrossExamQuote");
        if (lab.audit[q[0]]) ship3El("p", q[3], card, "shipCrossExamReply");
        if (!lab.audit[q[0]]) {
          var owned = ["G1", "G2", "G3", "G4"].filter(function (id) { return state.evidence[id]; });
          var labels = {}; owned.forEach(function (id) { labels[id] = SCENES.evidenceNames[id]; });
          var pick = ship3Select(card, owned, labels, owned[0]);
          ship3Btn(card, "出示這份紀錄", function () { doShip("answerAudit", { questionId: q[0], evidenceId: pick.value }, "✓ 這份紀錄回答了質詢。", q[4]); }, "shipAction primary");
        }
      });
    }
    if (v.phase === "boundary") {
      ship3El("h3", "九、最後一問：勝利能不能比證據走得更遠？", work);
      var official = ship3El("section", null, work, "shipCrossExam active");
      ship3El("span", "官員的提議", official, "shipCrossExamStep");
      ship3El("b", "「就寫：今天在馬賽，我們證明了地球正在運動。」", official, "shipCrossExamQuote");
      ship3El("p", "這句話最像勝利，也最容易越過證據。", official, "shipCrossExamReply");
      ship3Btn(work, "順勢宣告：這證明地球正在運動", function () { doShip("setBoundary", { choice: "overclaim" }); }, "shipAction danger");
      ship3Btn(work, "收住結論：它只排除了『船動，石頭就一定落後』", function () { doShip("setBoundary", { choice: "honest" }, "✓ 艦長願意簽下這個有邊界的結論：船只替今天量到的事作證。"); }, "shipAction primary");
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

  /* ---------- 第四章軌道／跨尺度／校樣工作台 ---------- */
  var orbit4Msg = "";
  var orbit4EmbedKey = "";
  var orbit4LastResult = null;
  function orbit4Error(code) {
    var map = {
      "orbit-attempt-required": "先把月亮放回同一個起點。",
      "consequence-required": "這條錯路還沒走完。先看完後果，提示才會出現。",
      "three-vectors-complete": "三拍偏折已完成；請讓同一規則續跑一圈。",
      "three-valid-vectors-required": "還需要三支方向、大小都站得住的偏折箭頭。",
      "no-consequence": "目前沒有待播放的錯誤路徑。",
      "k1-required": "先用切線逃逸與閉合軌道建立『一直改向的路』。",
      "bad-scale": "距離與時間倍率必須落在工作台可顯示的範圍。",
      "bad-exponent": "距離律指數限 0.0～3.0，且每次以 0.1 調整。",
      "two-trials-required": "至少先試過兩種不同的距離律，才能封存其中一種。",
      "trial-required-before-lock": "這個指數還沒真正試算過，不能直接封存。",
      "law-lock-required": "先把一條距離律封存，觀測紙才會翻面。",
      "observation-already-revealed": "這張觀測紙已經揭露；若要改律，舊預測會保留劃線，不能假裝沒看過。",
      "unlock-law-first": "先解開目前封存的距離律。",
      "k2-k3-required": "月球跨尺度與兩顆行星的封存預測都成立後，才能公平比較模型。",
      "k4-required": "先讓兩個模型都跑完三種天空，再整理證明。",
      "partial-window-passed": "完整模型比較已完成，現在不能把它假裝成早先的局部短稿。",
      "delay-reason-required": "延後不是空白按鈕；請留下可檢查的理由。",
      "dishonest-partial-scope": "短稿只能說月球與行星目前支持的範圍，不能偷帶尚未完成的彗星比較。"
    };
    return map[code] || "這一步目前不能成立；請檢查眼前的紀錄與先後順序。";
  }
  function doOrbit(action, args, okText) {
    var oldEvidence = JSON.stringify(state.lab.evidence || {});
    var r = N.labAction(state, action, args || {});
    if (r.error) {
      orbit4Msg = "✕ " + orbit4Error(r.error);
      renderAll();
      return;
    }
    setState(r.state);
    orbit4LastResult = { action: action, result: r.result || {}, stamp: Date.now() };
    var rr = r.result || {};
    if (action === "commitDeflection" && rr.ok === false && rr.consequence) {
      orbit4Msg = "路徑已經偏離。先讓它走完，再判斷是哪裡出了問題。";
    } else if (action === "runConsequence") {
      var kind = rr.consequence && rr.consequence.kind;
      orbit4Msg = {
        tangent: "後果看完：沒有偏折，月亮沿切線越走越遠。下一次請找出指向地心的方向。",
        outward: "後果看完：箭頭朝外，月亮比切線幽靈路徑離得更快。比較箭頭與地心的位置。",
        impact: "後果看完：方向向內，但改得太多，路徑穿進地球。把箭頭縮短。",
        unstable: "後果看完：方向或大小偏離容忍帶，軌道忽近忽遠。讓箭頭更接近地心方向，長度約一格。"
      }[kind] || "後果已完整保留；現在可以調整後重試。";
    } else if (rr.ok === false) {
      orbit4Msg = "✕ " + ({
        "claim-mismatch": "資料與結論沒有接上。先看哪兩筆紀錄真的比較了同一件事。",
        "comparison-overclaim": "只看月球不足以裁決；也不能把簡單渦旋的失配寫成所有介質模型都被否定。",
        "geometry-break": "來源放錯後，證明圖上的相應幾何真的斷開了；可自由換回正確來源。",
        "mechanism-slot-empty": "規則算出了作用與運動的關係，但機制槽沒有任何資料可填。",
        "credit-lines-break": "把概念、觀測、證明與出版全給一人，四條史料接口會斷開。",
        "printed-broken-proof": "印刷機已壓出這張斷鏈校樣。錯稿保留、窗口前進，所有證據仍可重排。"
      }[rr.reason || rr.consequence] || "這個主張還沒有被目前紀錄支持。");
    } else {
      orbit4Msg = typeof okText === "function" ? okText(rr) : (okText || "✓ 已留下可檢查的紀錄。");
    }
    var after = state.lab.evidence || {};
    if (oldEvidence !== JSON.stringify(after)) {
      var before = JSON.parse(oldEvidence || "{}");
      ["k1", "k2", "k3", "k4", "k5"].forEach(function (k) {
        if (!before[k] && after[k])
          orbit4Msg = "◆ 取得證據：" + (SCENES.evidenceNames[k.toUpperCase()] || "新證據") + "\n" + orbit4Msg;
      });
    }
    renderAll();
  }
  function orbit4Mission(phase) {
    return {
      tangent: ["先讓直線走完", "拿掉所有偏折，觀察月亮原有速度會把它帶去哪裡。"],
      vectors: ["每一拍，往裡改一點", "調整箭頭方向與長度；錯誤會先演成路徑，之後才提示。"],
      claim: ["讓規則自己走", "比較無偏折與閉合軌道，選出資料真正支持的說法。"],
      scale: ["地上與天上的同一把尺", "實際縮放距離與時間，至少試兩種距離律，再看月球量級。"],
      planets: ["先寫答案，再拆蠟封", "封存一條律，再揭露 Mars 與 Jupiter；改律不會刪掉舊預測。"],
      "press-opening": ["第一輪校樣先到了", "送誠實短稿或明列理由延後；停留與閱讀不會消耗窗口。"],
      models: ["一條規則穿過三種天空", "兩模型都跑 Moon、Planets、Comet，再比較殘差與補丁。"],
      proof: ["把證明送進印刷台", "接好證明、分配信用、守住末句；錯送會留下真正的錯稿。"]
    }[phase] || ["第四章工作台", "讓每一步都留下可重做、可追查的紀錄。"];
  }
  function orbit4Svg(parent, lab, phase) {
    var fig = ship3El("figure", null, parent, "orbitDiagram");
    fig.setAttribute("aria-label", "第四章「" + orbit4Mission(phase)[0] + "」可操作模型");
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 640 400");
    svg.setAttribute("role", "img");
    fig.appendChild(svg);
    function draw(tag, attrs, text) {
      var n = document.createElementNS("http://www.w3.org/2000/svg", tag);
      Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
      if (text != null) n.textContent = displayText(text);
      svg.appendChild(n); return n;
    }
    draw("rect", { x: 0, y: 0, width: 640, height: 400, class: "orbitSky" });
    [[70,45],[555,62],[120,330],[510,300],[380,48],[590,190]].forEach(function (p) {
      draw("circle", { cx:p[0], cy:p[1], r:2, class:"orbitStar" });
    });
    var o = lab.orbitLab || {}, scale = 128, cx = 310, cy = 205;
    if (phase === "scale" || phase === "planets") {
      draw("circle", { cx: 115, cy: 205, r: 58, class:"orbitEarth" });
      draw("line", { x1:173, y1:205, x2:540, y2:205, class:"orbitScaleLine" });
      draw("circle", { cx:540, cy:205, r:12, class:"orbitMoon" });
      draw("text", { x:115, y:286, "text-anchor":"middle", class:"orbitLabel" }, "地表：1 秒落下 4.9 m");
      draw("text", { x:540, y:286, "text-anchor":"middle", class:"orbitLabel" }, "月球：60 秒偏離切線");
      draw("text", { x:356, y:183, "text-anchor":"middle", class:"orbitScaleText" },
        (lab.scaleLab.earthRadiusRatio || 60) + " 個地球半徑");
    } else if (phase === "models") {
      draw("path", { d:"M85 205 C160 90 255 90 320 205 S480 320 560 205", class:"orbitModelPath gravity" });
      draw("path", { d:"M85 205 C180 130 245 285 320 205 S470 140 560 205", class:"orbitModelPath vortex" });
      draw("text", { x:145,y:55,class:"orbitLabel" }, "同一距離律");
      draw("text", { x:405,y:355,class:"orbitLabel" }, "簡單共轉渦旋");
    } else if (phase === "proof" || phase === "press-opening") {
      var labels = ["原有前進","向內改向","距離律","封存預測","模型比較"];
      labels.forEach(function (t, i) {
        var x = 72 + i * 120;
        draw("circle", { cx:x, cy:190, r:30, class:"orbitProofNode " + (lab.evidence["k" + (i + 1)] ? "got" : "") });
        draw("text", { x:x, y:247, "text-anchor":"middle", class:"orbitLabel" }, t);
        if (i < labels.length - 1) draw("line", { x1:x+31,y1:190,x2:x+89,y2:190,class:"orbitProofLink" });
      });
      draw("text", { x:320,y:90,"text-anchor":"middle",class:"orbitPressStamp" },
        lab.proof.press.scheduleLost ? "原排程已錯過・仍可完成" :
          "校樣窗口 " + lab.proof.press.window + "／" + lab.proof.press.reservedWindows);
    } else {
      draw("circle", { cx:cx, cy:cy, r:58, class:"orbitEarth" });
      draw("circle", { cx:cx, cy:cy, r:136, class:"orbitGuide" });
      var path = (o.consequence ? o.consequence.path :
        (o.path && o.path.length ? o.path : [{x:1,y:0}]));
      if (path.length > 1) {
        var d = path.map(function (p, i) {
          return (i ? "L" : "M") + (cx + p.x * scale) + " " + (cy - p.y * scale);
        }).join(" ");
        draw("path", { d:d, class:"orbitPath " + (o.consequence ? "consequence" : "") });
      }
      var last = path[path.length - 1] || {x:1,y:0};
      draw("circle", { cx:cx+last.x*scale, cy:cy-last.y*scale, r:11, class:"orbitMoon" });
      if (o.velocity) {
        var px = cx + (o.position ? o.position.x : 1) * scale;
        var py = cy - (o.position ? o.position.y : 0) * scale;
        draw("line", { x1:px,y1:py,x2:px+(o.velocity.x||0)*260,y2:py-(o.velocity.y||0)*260,class:"orbitVelocity" });
      }
    }
    var cap = ship3El("figcaption", null, fig);
    cap.textContent = phase === "vectors" && o.consequence
      ? "錯誤路徑會完整留下；看完後果才會顯示診斷。"
      : (phase === "scale" ? "畫面座標會跟著倍率真的改變；數學細節可展開，不妨礙操作主線。"
      : (phase === "proof" ? "送樣才消耗窗口；閱讀、換來源、重排與預覽都免費。" : orbit4Mission(phase)[1]));
    return fig;
  }
  function orbit4Table(parent, heads, rows) {
    if (!rows.length) return;
    ship3Table(parent, heads, rows);
  }
  function orbit4Select(parent, values, labels, current) {
    return ship3Select(parent, values, labels, current);
  }
  function renderOrbit(v, box) {
    var ek = v.scene + "/" + v.nodeId;
    if (ek !== orbit4EmbedKey) { orbit4EmbedKey = ek; orbit4Msg = ""; orbit4LastResult = null; }
    var lab = state.lab, ev = lab.evidence || {}, mission = orbit4Mission(v.phase);
    box.className = "orbitLab";
    var head = ship3El("header", null, box, "orbitHead");
    ship3El("small", "第四章・軌道與出版工作台", head);
    ship3El("h2", mission[0], head);
    ship3El("p", mission[1], head);
    var chips = ship3El("div", null, head, "orbitEvidenceChips");
    [["K1","改向"],["K2","縮放"],["K3","預測"],["K4","反驗"],["K5","邊界"]].forEach(function (p) {
      ship3El("span", (ev[p[0].toLowerCase()] ? "✓ " : "○ ") + p[1], chips, ev[p[0].toLowerCase()] ? "got" : "");
    });
    var body = ship3El("div", null, box, "orbitBody");
    var visual = ship3El("section", null, body, "orbitVisual");
    orbit4Svg(visual, lab, v.phase);
    var work = ship3El("section", null, body, "orbitWork");
    var o = lab.orbitLab, sc = lab.scaleLab, pl = lab.planetLab, ml = lab.modelLab, proof = lab.proof;

    if (v.phase === "tangent") {
      ship3El("h3", "一、先拿掉所有偏折", work);
      ship3El("p", "按下後，月亮至少走四拍；工作台不會在它離開前搶先給答案。", work, "orbitNote");
      ship3Btn(work, "不改方向，讓月亮走下一拍", function () {
        var start = N.labAction(state, "startOrbitAttempt", {});
        if (start.error) { orbit4Msg = "✕ " + orbit4Error(start.error); renderAll(); return; }
        setState(start.state);
        var commit = N.labAction(state, "commitDeflection", { vector:{dx:0,dy:0} });
        if (commit.error) { orbit4Msg = "✕ " + orbit4Error(commit.error); renderAll(); return; }
        setState(commit.state);
        orbit4Msg = "切線路徑已出現。先讓它走完。";
        renderAll();
      }, "orbitAction primary", !!(o.consequence && !o.consequence.played));
      if (o.consequence && !o.consequence.played)
        ship3Btn(work, "▶ 看完這條路的後果", function () { doOrbit("runConsequence", {}); }, "orbitAction consequence");
    }
    if (v.phase === "vectors") {
      ship3El("h3", "二、畫三拍偏折", work);
      if (!o.attempt || o.complete || (o.consequence && o.consequence.played))
        ship3Btn(work, "把月亮放回同一個起點", function () { doOrbit("startOrbitAttempt", {}, "✓ 起點、原速度與切線幽靈線已復原。"); }, "orbitAction");
      if (o.attempt && !(o.consequence && !o.consequence.played) && o.step < 3) {
        var px = o.position ? o.position.x : 1, py = o.position ? o.position.y : 0;
        var inwardDeg = Math.atan2(-py, -px) * 180 / Math.PI;
        var controls = ship3El("div", null, work, "orbitVectorControls");
        var angleLab = ship3El("label", "箭頭方向 ", controls);
        var angle = ship3El("input", null, angleLab); angle.type = "range"; angle.min = "-180"; angle.max = "180"; angle.step = "1"; angle.value = String(Math.round(inwardDeg));
        var angleOut = ship3El("output", Math.round(inwardDeg) + "°", angleLab);
        angle.oninput = function () { angleOut.textContent = angle.value + "°"; };
        var strengthLab = ship3El("label", "箭頭長度 ", controls);
        var strength = ship3El("input", null, strengthLab); strength.type = "range"; strength.min = "0"; strength.max = "3"; strength.step = "0.05"; strength.value = "1";
        var strengthOut = ship3El("output", "1.00 格", strengthLab);
        strength.oninput = function () { strengthOut.textContent = Number(strength.value).toFixed(2) + " 格"; };
        ship3Btn(controls, "畫下第 " + (o.step + 1) + " 支箭頭", function () {
          var a = Number(angle.value) * Math.PI / 180, mag = 0.058 * Number(strength.value);
          doOrbit("commitDeflection", { vector:{dx:Math.cos(a)*mag,dy:Math.sin(a)*mag} },
            "✓ 這一拍的速度已由原速度與向內偏折真正合成。");
        }, "orbitAction primary");
      }
      if (o.consequence && !o.consequence.played)
        ship3Btn(work, "▶ 先看完錯誤路徑", function () { doOrbit("runConsequence", {}); }, "orbitAction consequence");
      if (o.ruleRepeatReady && !o.complete)
        ship3Btn(work, "沿同一規則續跑一圈", function () { doOrbit("repeatOrbitRule", {}, "✓ 規則跑完一圈；小幅誤差帶保留在圖上。"); }, "orbitAction primary");
      orbit4Table(work, ["拍","偏折 x","偏折 y","與地心夾角"], (o.deflectionVectors || []).map(function (r) {
        return [r.step + 1, r.dx.toFixed(3), r.dy.toFixed(3), r.angleDeg.toFixed(1) + "°"];
      }));
    }
    if (v.phase === "claim") {
      ship3El("h3", "三、哪一句真的來自兩筆紀錄？", work);
      ship3El("p", "來源：無偏折的切線逃逸＋逐拍向內偏折的閉合軌道。", work, "orbitNote");
      [
        ["forward-push","月亮需要一股沿圓周向前推的力"],
        ["forward-plus-inward-turn","月亮保留前進；指向地球的作用持續改變速度方向"],
        ["stop-restart","月亮每一拍先停下，再朝地球重新出發"]
      ].forEach(function (c) {
        ship3Btn(work, c[1], function () {
          doOrbit("assertK1", { records:["tangent","closed"], concept:c[0] },
            "✓ 向前的部分原本就有；可見的新作用只負責持續改向。");
        }, "orbitAction " + (c[0] === "forward-plus-inward-turn" ? "primary" : ""));
      });
    }
    if (v.phase === "scale") {
      ship3El("h3", "四、把同一模型真的拉到月亮", work);
      var sr = ship3El("div", null, work, "orbitScaleControls");
      var dl = ship3El("label", "距離：", sr); var dist = ship3El("input", null, dl);
      dist.type="range"; dist.min="1"; dist.max="100"; dist.step="1"; dist.value=String(sc.earthRadiusRatio);
      var dOut=ship3El("output",sc.earthRadiusRatio+" R⊕",dl); dist.oninput=function(){dOut.textContent=dist.value+" R⊕";};
      var tl = ship3El("label", "時間：", sr); var time = ship3El("input", null, tl);
      time.type="range"; time.min="1"; time.max="120"; time.step="1"; time.value=String(sc.timeRatio);
      var tOut=ship3El("output",sc.timeRatio+" s",tl); time.oninput=function(){tOut.textContent=time.value+" s";};
      ship3Btn(sr, "套用這個尺度", function () { doOrbit("setScale", {distanceRatio:Number(dist.value),timeRatio:Number(time.value)}, "✓ 地球與月球的畫面座標已按新尺度重排。"); }, "orbitAction");
      var er = ship3El("div", null, work, "orbitLawControls");
      var elab = ship3El("label", "距離律 n＝", er); var exponent = ship3El("input", null, elab);
      exponent.type="range"; exponent.min="0"; exponent.max="3"; exponent.step=".1"; exponent.value=String(sc.exponent == null ? 1 : sc.exponent);
      var eOut=ship3El("output",Number(exponent.value).toFixed(1),elab); exponent.oninput=function(){eOut.textContent=Number(exponent.value).toFixed(1);};
      ship3Btn(er, "試算這條律", function () { doOrbit("tryDistanceLaw", {exponent:Number(exponent.value)}, function (rr) {
        return "已試算：月球 60 秒偏離切線 " + rr.trial.moonSagM.toFixed(2) + " m。";
      }); }, "orbitAction primary");
      orbit4Table(work, ["試算","n","月球偏折","與 4.9 m 誤差"], (sc.trials || []).map(function (t) {
        return [t.id,t.exponent.toFixed(1),t.moonSagM.toFixed(2)+" m",t.moonErrorPct.toFixed(1)+"%"];
      }));
      if ((sc.trials || []).length) {
        var exps = Array.from(new Set(sc.trials.map(function(t){return String(t.exponent);})));
        var labels={}; exps.forEach(function(x){labels[x]="n＝"+Number(x).toFixed(1);});
        var lockRow=ship3El("div",null,work,"orbitRow");
        var lock=orbit4Select(lockRow,exps,labels,String(sc.lawLocked == null ? exps[exps.length-1] : sc.lawLocked));
        ship3Btn(lockRow,sc.lawLocked==null?"封存這條律":"改封存律",function(){doOrbit("lockDistanceLaw",{exponent:Number(lock.value)},"✓ 距離律已先封存；之後揭露的資料不能倒過來改寫它。");},"orbitAction");
      }
      if (!ev.k2 && sc.trials.length >= 2)
        ship3Btn(work,"用地表落體、月球偏折與 60／60 尺度提出斷言",function(){
          doOrbit("assertK2",{records:["earth-fall","moon-sag","scale-60-60"],concept:"inverse-square-cross-scale"},
            "✓ 反平方在 60／60 尺度上把地上與天上的量級接起來。");
        },"orbitAction primary");
      var math=ship3El("details",null,work,"orbitMathOptional");
      ship3El("summary","展開數學：這裡究竟算了什麼？",math);
      ship3El("p","工作台使用 a(r) ∝ 1/rⁿ。教學 fixture 中，地表 1 秒落下 4.9 m；距離 60 倍、時間 60 秒時，n＝0 得 17,640 m，n＝1 得 294 m，n＝2 得 4.9 m。公式是檢查工具，不是操作門票。",math);
    }
    if (v.phase === "planets") {
      ship3El("h3", "五、讓規則在看答案前先冒險", work);
      ship3El("p","觀測紙只有在預測存檔後才翻面。若解鎖改律，舊預測會保留並劃線。",work,"orbitNote");
      ["mars","jupiter"].forEach(function(id){
        var row=ship3El("section",null,work,"orbitPlanetCard");
        ship3El("b",id==="mars"?"Mars｜距離 1.52":"Jupiter｜距離 5.20",row);
        var prior=pl.predictions.filter(function(p){return p.planet===id;});
        if (!pl.revealed[id]) ship3Btn(row,"封存預測，再揭露觀測",function(){doOrbit("predictPlanet",{id:id},function(rr){
          return "✓ 預測 " + rr.prediction.prediction.toFixed(3) + " 已先封存；觀測 " + rr.prediction.actual.toFixed(2) + " 現在才揭露。";
        });},"orbitAction primary");
        prior.forEach(function(p){ship3El("p",(p.superseded?"（舊律，保留） ":"")+"預測 "+p.prediction.toFixed(3)+"｜觀測 "+p.actual.toFixed(2)+"｜殘差 "+p.residualPct.toFixed(2)+"%",row,p.superseded?"superseded":"");});
      });
      var change=ship3El("div",null,work,"orbitRow");
      ship3Btn(change,"解鎖距離律（保留舊預測）",function(){doOrbit("unlockDistanceLaw",{},"距離律已解鎖；舊預測仍在桌上，不會被洗掉。");},"orbitAction");
      if (sc.lawLocked==null) {
        var tried=Array.from(new Set(sc.trials.map(function(t){return String(t.exponent);}))), labs={};tried.forEach(function(x){labs[x]="n＝"+Number(x).toFixed(1);});
        if (tried.length) {
          var relock=orbit4Select(change,tried,labs,tried[tried.length-1]);
          ship3Btn(change,"重新封存",function(){doOrbit("lockDistanceLaw",{exponent:Number(relock.value)},"✓ 新律已封存。若要重新預測，先重置未揭露資料；舊紀錄仍保留。");},"orbitAction");
          ship3Btn(change,"另開未揭露副本",function(){doOrbit("resetPlanetReveals",{},"✓ 新觀測副本仍封著；舊預測保留為歷史紀錄。");},"orbitAction");
        }
      }
      if (!ev.k3 && pl.crossScalePass)
        ship3Btn(work,"用兩張封存預測提出斷言",function(){doOrbit("assertK3",{records:["mars-sealed","jupiter-sealed"],concept:"withheld-data-prediction"},"✓ 兩個週期都在揭露前留下預測，並通過殘差帶。");},"orbitAction primary");
    }
    if (v.phase === "press-opening") {
      ship3El("h3","六、彗星比較尚未完成，第一輪位置已到",work);
      var pressBox=ship3El("section",null,work,"orbitPressBox");
      ship3El("b","目前能支持：月球＋行星。尚缺：彗星＋替代模型比較。",pressBox);
      ship3Btn(pressBox,"送出範圍較小的誠實短稿",function(){doOrbit("submitPartialProof",{scope:"moon-planets"},"✓ 短稿已送：支持範圍與尚未完成欄同時印出。");},"orbitAction primary");
      ship3Btn(pressBox,"放掉本輪，等待完整反驗",function(){doOrbit("deferPress",{reason:"等待彗星與替代模型比較"},"✓ 本輪未印錯稿；延後理由與排程成本已保留。");},"orbitAction");
    }
    if (v.phase === "models") {
      ship3El("h3","七、同一組天空，兩個模型都得跑",work);
      var matrix=ship3El("div",null,work,"orbitModelGrid");
      [["inverseSquare","反平方"],["simpleVortex","簡單共轉渦旋"]].forEach(function(m){
        ["moon","planets","comet"].forEach(function(c){
          var exists=ml.runs.some(function(r){return r.model===m[0]&&r.caseId===c;});
          ship3Btn(matrix,(exists?"✓ ":"")+m[1]+" × "+({moon:"Moon",planets:"Planets",comet:"Comet"}[c]),function(){
            doOrbit("runModel",{model:m[0],caseId:c},function(rr){return "已跑："+rr.run.note+"｜殘差 "+rr.run.residual.toFixed(1)+"%｜補丁 "+rr.run.patches;});
          },"orbitAction",exists);
        });
      });
      orbit4Table(work,["模型","天空","殘差","補丁","結果"],ml.runs.map(function(r){
        return [r.model==="inverseSquare"?"反平方":"簡單渦旋",r.caseId,r.residual.toFixed(1)+"%",r.patches,r.fit==="pass"?"通過":"需補丁"];
      }));
      if (!ev.k4 && ml.gravityComplete && ml.vortexComplete) {
        [
          ["moon-only","月球一格相合，已足以裁決所有模型"],
          ["same-rule-fewer-patches","反平方用同一條規則跨過三種天空；簡單渦旋需加入較多補丁"],
          ["all-vortices-refuted","這證明所有渦旋與介質模型永遠不可能成立"]
        ].forEach(function(c){
          ship3Btn(work,c[1],function(){
            var records=[];["inverseSquare","simpleVortex"].forEach(function(m){["moon","planets","comet"].forEach(function(k){records.push(m+":"+k);});});
            doOrbit("assertK4",{records:records,claim:c[0]},"✓ 這個比較只涵蓋本章明列的兩個模型版本，結論沒有越界。");
          },"orbitAction "+(c[0]==="same-rule-fewer-patches"?"primary":""));
        });
      }
    }
    if (v.phase === "proof") {
      ship3El("h3","八、接鏈、署名、末句",work);
      var status=ship3El("p",(proof.press.scheduleLost?"原排程已錯過；完整稿仍可重新排入。":"目前校樣窗口："+proof.press.window+"／"+proof.press.reservedWindows),work,"orbitPressStatus");
      status.setAttribute("role","status");
      var slotDefs=[
        ["inertia","原有運動",["M2","M3","K1"]],
        ["inward","向內改向",["K1","K2","K4"]],
        ["distance","距離律",["K2","K3","K1"]],
        ["withheld","未揭露預測",["K3","K2","K4"]],
        ["model","模型比較",["K4","K3","K2"]]
      ];
      slotDefs.forEach(function(d){
        var row=ship3El("div",null,work,"orbitProofRow");ship3El("label",d[1]+"：",row);
        var labels={
          M2:"前章：拋體保留原有前進",
          M3:"前章：共同運動不因鬆手消失",
          K1:"一直改向的路",
          K2:"地上與天上的同一把尺",
          K3:"沒看答案前的兩個週期",
          K4:"一條規則穿過三種天空"
        };
        var cur=(proof.slots.find(function(r){return r.slot===d[0];})||{}).evidenceId||d[2][0];
        var pick=orbit4Select(row,d[2],labels,cur);
        ship3Btn(row,"放入",function(){doOrbit("placeProofLink",{slot:d[0],evidenceId:pick.value},"✓ 來源已放入；可繼續換，不耗窗口。");},"orbitAction");
      });
      var credits=[
        ["direction","切線／直接運動與向中心吸引","Hooke"],
        ["publication","1684 追問與出版推動","Halley"],
        ["observations","行星、衛星與彗星觀測","Flamsteed"],
        ["proof","數學證明與跨天體整合","Newton"]
      ];
      credits.forEach(function(d){
        var row=ship3El("div",null,work,"orbitCreditRow");ship3El("label",d[1]+"：",row);
        var people=["Hooke","Halley","Flamsteed","Newton"],labels={};people.forEach(function(p){labels[p]=p;});
        var pick=orbit4Select(row,people,labels,proof.attribution[d[0]]||"Newton");
        ship3Btn(row,"署名",function(){doOrbit("assignCredit",{contribution:d[0],person:pick.value},"信用線已重接；送樣前仍可修改。");},"orbitAction");
      });
      ship3El("h4","末句：這本書究竟證明到哪裡？",work);
      [
        ["mechanismSolved","我們已證明引力如何穿過空間作用"],
        ["newtonAlone","Newton 一人完成概念、觀測、證明與出版"],
        ["ruleEstablished","我們建立可跨地表與天空反驗的規則；引力如何作用，仍未決"]
      ].forEach(function(c){
        ship3Btn(work,(proof.boundaryChoice===c[0]?"✓ ":"")+c[1],function(){doOrbit("setProofBoundary",{choice:c[0]},"末句已放入預覽；尚未送印，也沒有消耗窗口。");},"orbitAction "+(c[0]==="ruleEstablished"?"primary":""));
      });
      var actions=ship3El("div",null,work,"orbitProofActions");
      ship3Btn(actions,"免費預覽校樣",function(){doOrbit("previewProof",{},function(rr){
        var p=rr.preview;return p.complete?"✓ 預覽完整；仍須親手送出才取得完成證據。":"預覽發現：缺槽 "+p.missing.join("、")+"；錯槽 "+p.wrong.join("、")+"；署名待修 "+p.creditWrong.join("、")+"。";
      });},"orbitAction");
      ship3Btn(actions,"送出本輪校樣",function(){doOrbit("submitProof",{},"✓ 完整校樣已壓下，錯稿與延後紀錄都沒有被成功畫面洗掉。");},"orbitAction primary");
      ship3Btn(actions,"放掉本輪，再檢查一次",function(){doOrbit("deferPress",{reason:"再核對證明來源、信用與末句"},"本輪已明列理由延後；證據與目前排版全部保留。");},"orbitAction");
      if (proof.press.proofs.length || proof.press.delays.length) {
        var history=ship3El("details",null,work,"orbitPressHistory");ship3El("summary","查看所有錯稿與延後紀錄",history);
        proof.press.proofs.forEach(function(p,i){ship3El("p","校樣 "+(i+1)+"｜"+(p.complete?"完整":"不完整")+"｜"+(p.kind||""),history,p.complete?"complete":"wrong");});
        proof.press.delays.forEach(function(d,i){ship3El("p","延後 "+(i+1)+"｜"+d.reason,history,"delay");});
      }
    }
    var msg=ship3El("p",orbit4Msg||"每個操作都可重做；錯誤先留下可見後果，再出現提示。",work,"orbitMessage");
    msg.setAttribute("role","status");
    if (N.embedReady(state)) {
      ship3Btn(work,"▶ 收好紀錄，回到故事",function(){
        var r=N.embedComplete(state);
        if(r.error){orbit4Msg="✕ "+r.error;renderAll();return;}
        setState(r.state);orbit4Msg="";renderAll();
      },"orbitGate primary");
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
    if (v.type === "embed" && v.system === "orbit") {
      renderOrbit(v, box);
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
      mkBtn(box, CHAPTER_ID === "ch4" ? "封存第四章" : (CHAPTER_ID === "ch3" ? "封存第三章" : (CHAPTER_ID === "ch2" ? "封存第二章" : "封存第一章")), function () {
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
          var sourceScene = state.cursor && state.cursor.scene;
          var r = N.choose(state, o.id);
          if (r.error) { addLine("system", r.error, "system"); return; }
          setState(r.state);
          addLine("旅人(你)", o.text, "player", sourceScene);
          renderAll();
        });
      });
    } else {
      var btn = mkBtn(box, "▶ 繼續", function () {
        var sourceScene = state.cursor && state.cursor.scene;
        var r = N.advance(state);
        if (r.error) { addLine("system", r.error, "system"); return; }
        setState(r.state);
        if (r.node) addLine(r.node.speaker, r.node.text, classFor(r.node.speaker), sourceScene);
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

  function chapterLabel() {
    return CHAPTER_ID === "ch4" ? "第四章" :
      (CHAPTER_ID === "ch3" ? "第三章" : (CHAPTER_ID === "ch2" ? "第二章" : "第一章"));
  }
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
    document.title = CHAPTER_ID === "ch4"
      ? "《發現之前》第四章：月亮一直在掉（舞台版）"
      : (CHAPTER_ID === "ch3"
      ? "《發現之前》第三章：船艙裡的靜止（舞台版）"
      : (CHAPTER_ID === "ch2" ? "《發現之前》第二章：第一寸的弧線（舞台版）"
        : "《發現之前》第一章：重物的渴望（舞台版）"));
    var progress = readSeriesProgress();
    var completedCount = ["ch1", "ch2", "ch3", "ch4"].filter(function (id) { return progress.chapters[id]; }).length;
    var status = document.querySelector(".chapterStatusText span");
    if (status) status.textContent = "系列進度 " + completedCount + "/4";
    var meta = document.querySelector(".chapterStatusText strong");
    if (meta) meta.textContent = CHAPTER_ID === "ch4" ? "第四章・月亮一直在掉" :
      (CHAPTER_ID === "ch3" ? "第三章・船艙裡的靜止" : (CHAPTER_ID === "ch2" ? "第二章・第一寸的弧線" : "第一章・重物的渴望"));
    var legend = document.querySelector("#titleCard fieldset legend");
    if (legend) legend.textContent = "從" + chapterLabel() + "開始・選擇模式（中途不可換）";
    $("btnNew").textContent = "開始" + chapterLabel();
    $("btnContinue").textContent = "繼續" + chapterLabel();
    Array.prototype.forEach.call(document.querySelectorAll(".chapterPick"), function (b) {
      var mine = b.getAttribute("data-chapter") === ("ch0" + CHAPTER_ID.slice(2));
      b.disabled = false;
      b.classList.toggle("isActive", mine);
      var id = "ch" + String(parseInt(b.getAttribute("data-chapter").slice(2), 10));
      var complete = !!progress.chapters[id];
      b.classList.toggle("isComplete", complete);
      if (mine) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
      var sm = b.querySelector("small"); if (sm) sm.textContent = complete ? "✓ 已完成" : "可玩";
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
    if (loaded && loaded.ended) { markChapterComplete(loaded); configureSeriesTitle(); }
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
        showNewWarn("注意：開始新遊戲將覆蓋本章存檔，但不會刪除首頁的通關章印。再按一次確認。");
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
        var chapterFileLabel = CHAPTER_ID === "ch4" ? "第四章" :
          (CHAPTER_ID === "ch3" ? "第三章" : (CHAPTER_ID === "ch2" ? "第二章" : "第一章"));
        a.download = "發現之前_" + chapterFileLabel + "_書信碼_" + new Date().toISOString().slice(0, 10) + ".txt";
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
