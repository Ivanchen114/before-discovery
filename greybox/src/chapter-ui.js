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
  var SERIES = window.GB.DATA.series || { chapters: [] };
  var SERIES_CHAPTERS = Array.isArray(SERIES.chapters) ? SERIES.chapters : [];
  var CHAPTER_ID = N.CHAPTER_ID || (SERIES_CHAPTERS.some(function (ch) {
    return ch.id === SCENES.chapter;
  }) ? SCENES.chapter : "ch1");
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
  function chapterMeta(id) {
    var found = SERIES_CHAPTERS.find(function (ch) { return ch.id === id; });
    if (found) return found;
    if (typeof console !== "undefined" && console.warn) {
      console.warn("[發現之前] 找不到章別資料：" + String(id || "(空白)"));
    }
    return {
      id: id || "ch1",
      route: "",
      number: "--",
      label: "（章別未載入）",
      title: SCENES.title || "章節資料未載入",
      years: "",
      question: ""
    };
  }
  function displayText(value) {
    return TEXT ? (TEXT.playerText ? TEXT.playerText(value) : TEXT.normalizeZhPunctuation(value)) : value;
  }
  function sceneTitleText(value) {
    if (TEXT && TEXT.playerSceneTitle) return TEXT.playerSceneTitle(value);
    return String(value || "故事進行中")
      .replace(/^死路\s*[A-ZＡ-Ｚ]\s*[：:]\s*/, "")
      .replace(/^修復\s*[：:]\s*/, "");
  }
  function fmt(v) { return (Math.round(v * 10) / 10).toFixed(1); }
  function cfgLabel(c) { return c.ball + "·" + c.surface + "·" + c.incline + "·" + c.timer; }
  function claimObservedFifth(c) {
    if (typeof c.observedFifth === "number" && isFinite(c.observedFifth)) return c.observedFifth;
    var runs = state.lab.evidence.runs.filter(function (run) { return (c.runIds || []).indexOf(run.id) >= 0; });
    if (!runs.length) return NaN;
    return runs.reduce(function (sum, run) {
      if (typeof run.readings[4] === "number") return sum + run.readings[4];
      var pi = typeof run.patternIndex === "number" ? run.patternIndex : Math.max(0, ((run.seq || 1) - 1) % 3);
      return sum + window.GB.Engine.computeReadings(run.config, pi)[4];
    }, 0) / runs.length;
  }

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
  function migrateLegacyCh4(text) {
    if (CHAPTER_ID !== "ch4" || !text) return null;
    var migration = window.GB && window.GB.Ch4Migration;
    if (!migration || typeof migration.migrateText !== "function")
      return { error: "第四章存檔遷移功能未就緒" };
    return migration.migrateText(text, SCENES, window.GB.Engine4);
  }
  function preserveCh4MigrationBackup(report) {
    if (CHAPTER_ID !== "ch4" || !report || typeof report.backupText !== "string") return;
    try {
      localStorage.setItem(KEY + "_schema1_backup", report.backupText);
    } catch (e) {
      showNewWarn("舊版第四章進度已轉換，但瀏覽器無法另存原始備份；請先匯出書信碼。");
    }
  }
  function sanitizeLoaded(s) {
    if (!window.GB.Sanitize) return { ok: false, reason: "進度檢查功能未就緒" };
    if (CHAPTER_ID === "ch2") return window.GB.Sanitize.sanitizeImport2(s, SCENES, window.GB.Engine2);
    if (CHAPTER_ID === "ch3") return window.GB.Sanitize.sanitizeImport3(s, SCENES, window.GB.Engine3);
    if (CHAPTER_ID === "ch4") return window.GB.Sanitize.sanitizeImport4(s, SCENES, window.GB.Engine4);
    if (CHAPTER_ID === "ch5") return window.GB.Sanitize.sanitizeImport5(s, SCENES, window.GB.Engine5);
    if (CHAPTER_ID === "ch6") return window.GB.Sanitize.sanitizeImport6(s, SCENES, window.GB.Engine6);
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
    var ch4Migration = migrateLegacyCh4(text);
    if (ch4Migration && ch4Migration.error)
      return { error: ch4Migration.message || ch4Migration.error };
    var prepared = ch4Migration ? ch4Migration.text : (migrated || text);
    var r = N.loadSave(prepared);
    if (r.empty) return { empty: true };
    if (r.error) return { error: r.error === "schema" ? "版本不符" : "檔案損壞" };
    var chk = sanitizeLoaded(r.state);
    if (!chk.ok) return { error: chk.reason };
    return {
      state: chk.state,
      migrated: !!migrated || !!(ch4Migration && ch4Migration.migrated),
      migrationReport: ch4Migration && ch4Migration.migrated ? ch4Migration.report : null
    };
  }
  function restoreBackup() {
    var backup = null;
    try { backup = localStorage.getItem(KEY + "_corrupt"); } catch (e) { return null; }
    var checked = inspectSaveText(backup);
    if (!checked.state) return null; /* 真壞檔仍留作人工診斷，不冒險匯入。 */
    preserveCh4MigrationBackup(checked.migrationReport);
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
      preserveCh4MigrationBackup(checked.migrationReport);
      try { localStorage.setItem(KEY, N.serialize(checked.state)); } catch (e3) {}
      if (checked.migrationReport && checked.migrationReport.notice)
        showNewWarn(checked.migrationReport.notice);
    }
    return checked.state;
  }
  function readSeriesProgress() {
    var empty = { schemaVersion: 1, chapters: {} };
    try {
      var parsed = JSON.parse(localStorage.getItem(SERIES_KEY) || "null");
      if (!parsed || parsed.schemaVersion !== 1 || !parsed.chapters || typeof parsed.chapters !== "object") return empty;
      SERIES_CHAPTERS.forEach(function (chapter) {
        var id = chapter.id;
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
  function visibleSpeakerName(speaker) {
    return speaker === "旅人" || speaker === "旅人(你)" || speaker === "旅人・心聲"
      ? "旅人（你）" : displayText(speaker);
  }
  function accessibleSpeakerName(speaker) {
    if (speaker === "旅人・心聲") return "旅人心裡想";
    if (speaker === "旅人" || speaker === "旅人(你)") return "旅人說";
    return displayText(speaker);
  }
  function addLine(speaker, text, cls, sceneId) {
    var shownText = displayText(text);
    var div = document.createElement("div");
    div.className = "line " + (cls || "");
    if (speaker && cls !== "stage" && cls !== "system") {
      if (ASSETS && ASSETS.speakerPortrait) {
        var pe = assetEntry(ASSETS.speakerPortrait[speaker]);
        if (pe) div.appendChild(buildPortrait(pe, speaker));
      }
      var b = document.createElement("span"); b.className = "spk";
      b.textContent = visibleSpeakerName(speaker) + "：";
      b.setAttribute("aria-label", accessibleSpeakerName(speaker));
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
    if (speaker === "旅人・心聲") return "player inner";
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
    var latestRepEvent = null;
    for (var repEventIndex = state.eventLog.length - 1; repEventIndex >= 0; repEventIndex--) {
      if (state.eventLog[repEventIndex].t === "rep") {
        latestRepEvent = state.eventLog[repEventIndex];
        break;
      }
    }
    $("repVal").setAttribute("data-rep-reason",
      latestRepEvent && latestRepEvent.reason ? latestRepEvent.reason : "");
    $("repVal").textContent = state.rep;
    $("dayVal").textContent = state.lab.days;
    if (CHAPTER_ID === "ch2") {
      var f2 = state.lab.evidence && state.lab.evidence.f2 || { law: false, ball: false };
      $("e3Val").textContent = "彈射主張：開方律" + (f2.law ? "●" : "○") + " 重量" + (f2.ball ? "●" : "○");
      $("e3Val").title = "第二章的兩項核心主張：射程隨下落高度開方、同裝置下與球重無關。";
      $("dayVal").parentElement.title = "天數=工坊與實驗成本：組裝不花天；校準與每次連結測量會推進日程。天數記錄你為可靠證據付出的時間。";
    } else if (CHAPTER_ID === "ch3") {
      var dossier = state.lab.caseFile && state.lab.caseFile.dossier;
      var assertionIds = ["A1", "A2", "A3", "A6", "S1", "S4"];
      var assertionCount = dossier ? assertionIds.filter(function (id) { return dossier.assertions[id]; }).length : 0;
      var pillarCount = dossier ? ["p1", "p2", "p3"].filter(function (id) { return dossier.debate.pillars[id]; }).length : 0;
      var paperCount = dossier
        ? dossier.records.length + ((dossier.blind && dossier.blind.records || []).length) + 1
        : 0;
      $("e3Val").textContent = "卷宗：原紙" + paperCount +
        " 斷言" + assertionCount + " 支柱" + pillarCount + "/3 邊界" + (dossier && dossier.complete ? "●" : "○");
      $("e3Val").title = "第三章：先設計實驗留下原紙，再從原紙寫出斷言；也可以提早去碼頭，帶著質疑回船補做。";
      $("dayVal").parentElement.title = "天數記錄校準、重複測量與公開驗證所花的時間。";
    } else if (CHAPTER_ID === "ch4") {
      var k4 = state.lab.evidence || {};
      var k4Pages = [
        ["k1", "改向紙"], ["k2", "地月紙"], ["k3", "封口預測"],
        ["k4", "模型比較"], ["k5", "出版校樣"]
      ].filter(function (p) { return k4[p[0]]; });
      $("e3Val").textContent = k4Pages.length
        ? ("旅人筆記：" + k4Pages.length + " 張紙")
        : "旅人筆記：尚未取得證據";
      $("e3Val").title = k4Pages.length
        ? ("已夾入：" + k4Pages.map(function (p) { return p[1]; }).join("、"))
        : "只有完成並留下邊界的證據，才會夾進旅人筆記。";
      $("dayVal").parentElement.title = "天數只記錄可重做的模型工作；出版壓力另由送樣／延後行動推進，不按閱讀時間倒數。";
    } else if (CHAPTER_ID === "ch5") {
      var j5 = state.lab.evidence || {};
      var phase5 = state.lab.phase || "momentum";
      var progress5 = {
        momentum: ["帳冊：這一輪追動量帳○", "先比較鋼頭與油灰兩種碰法，看看帶方向的帳能不能對平。"],
        "vis-viva": ["帳冊：動量✓｜這一輪重算活力○", "不做新實驗；只把剛才同一批紀錄換一本帳重算。"],
        followup: ["帳冊：動量✓｜活力✓｜再追一筆○", "換成不等重的油灰碰撞，檢查「一半」能不能寫成規矩。"],
        clay: ["帳冊：前兩帳✓｜這一輪量黏土○", "用三種速度留下壓痕，檢查坑深跟速度平方的尺度。"],
        complete: ["帳冊：動量✓｜活力✓｜黏土✓", "三張斷言已齊，可以把兩本帳帶上辯論桌。"]
      }[phase5] || ["帳冊：尚未開始", "先完成眼前這一輪。"];
      $("e3Val").textContent = progress5[0];
      $("e3Val").title = progress5[1];
      $("dayVal").parentElement.title = "每次放手只留一筆；輪二重算舊紀錄，不增加天數。";
    } else if (CHAPTER_ID === "ch6") {
      var t6 = state.lab.evidence || {};
      var acquired6 = ["t1", "t2", "t3", "t4", "t5"].filter(function (id) { return t6[id]; });
      var target6 = {
        "source-ledger": "封存兩模型來源帳", chips: "比較碎屑與實心金屬",
        friction: "拆開接觸與運動", dry: "留下乾式連續紙帶", air: "做密合／開放對照",
        water: "對齊水箱起點", "finite-predictions": "封存四個終點帶",
        "continuous-run": "讓長紙走完", "finite-verdict": "逐張判讀裂封",
        audit: "對回來源與原紙", "joint-page": "完成共同驗證頁", complete: "共同頁已封存"
      }[state.lab.phase] || "完成眼前這一筆";
      $("e3Val").textContent = acquired6.length
        ? ("來源卷：" + acquired6.map(function (id) { return id.toUpperCase(); }).join("・"))
        : "來源卷：尚未取得 T 證據";
      $("e3Val").title = "現在只做：" + target6 + "。證據只有在玩家完成相應判讀後才入卷。";
      $("dayVal").parentElement.title = "天數記錄每次實際比較、校準與長時段分段；讀紙和作答本身不加天。";
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
      $("perVal").title = "公開質詢只計算已共同檢查並封存的程序：風、船況與雙紙紀錄。";
    } else if (CHAPTER_ID === "ch4") {
      var press = state.lab.proof && state.lab.proof.press;
      $("perVal").textContent = press
        ? (press.scheduleLost ? "出版：重新排程" : "校樣窗口：" + press.window + "/" + press.reservedWindows)
        : "";
      $("perVal").title = "校樣窗口不按閱讀時間倒數；只有送出校樣或主動延後，才推進一個窗口。";
    } else if (CHAPTER_ID === "ch5") {
      $("perVal").textContent = state.debate ? ("論證對位｜" + state.debate.persuasion + "/5") : "";
      $("perVal").title = "看證據有沒有咬住主張；配錯會退回，歸零先複盤。帳與已破支柱都保留。";
    } else {
      $("perVal").textContent = state.debate ? ("論證對位｜" + state.debate.persuasion + "/5") : "";
      $("perVal").title = "看證據有沒有咬住主張；配錯會退回，歸零先複盤。";
    }
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
        [("#" + r.id), cfgLabel(r.config)].concat(r.readings.slice(0, 4).map(fmt)).concat([String(r.day)])
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
      ["#" + c.id, cfgLabel(c.config), "押 " + fmt(c.prediction) + "／實測 " + fmt(claimObservedFifth(c)), (c.ok ? "成立" : "不成立"), String(c.day)]
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
          res.run.readings.slice(0, 4).map(fmt).join(" / ");
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
          "第五段揭曉：你押 " + fmt(c.prediction) + "，實測 " + fmt(c.observedFifth) + "。\n" +
          "前四段形狀偏差 " + (c.maxDev * 100).toFixed(1) + "% ✓｜第五段預測偏差 " + (c.predDev * 100).toFixed(1) + "% ✓";
        return "主張 #" + c.id + " 未成立。\n" +
          "第五段揭曉：你押 " + fmt(c.prediction) + "，實測 " + fmt(c.observedFifth) + "。\n" +
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
    var arranged = fn === "debateFr" && typeof args[0] === "string" &&
      args[0].indexOf("arrange:") === 0;
    setState(r.state);
    syncNewTranscript(prevLen);
    renderAll();
    if (arranged) {
      var focusTarget = r.outcome === "resolved"
        ? document.querySelector(".annotationResolved h3")
        : document.querySelector(".annotationPaper select");
      if (focusTarget) {
        if (focusTarget.tagName !== "SELECT") focusTarget.setAttribute("tabindex", "-1");
        focusTarget.focus();
      }
    }
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
    if (CHAPTER_ID === "ch2" || CHAPTER_ID === "ch5") {
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
    meter.setAttribute("aria-label", "論證對位 " + d.persuasion + " / 5");
    var mb = document.createElement("b"); mb.textContent = "論證對位";
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
  function renderResolvedAnnotation(d, box) {
    if (!d.arrange) return;
    var board = document.createElement("section");
    board.className = "annotationBoard annotationResolved";
    var title = document.createElement("h3");
    title.textContent = "三張原紙已歸位";
    board.appendChild(title);
    if (!d.arrange.lastLayout) {
      var legacy = document.createElement("p");
      legacy.className = "annotationTrace";
      legacy.textContent = "這份存檔完成於三紙對位上線前；原有通關記錄已保留。";
      board.appendChild(legacy); box.appendChild(board); return;
    }
    var oldNote = document.createElement("blockquote");
    oldNote.className = "annotationOriginalNote";
    oldNote.setAttribute("aria-label", "辛普里奧已劃掉方法性批註，原文仍可讀：" + displayText(d.arrange.originalNote));
    var noteLead = document.createElement("span");
    noteLead.textContent = "已劃掉的方法性批註｜";
    var noteText = document.createElement("del");
    noteText.textContent = displayText(d.arrange.originalNote);
    oldNote.appendChild(noteLead); oldNote.appendChild(noteText); board.appendChild(oldNote);
    var labels = {};
    d.arrange.dispositions.forEach(function (item) { labels[item.id] = item.label; });
    var cards = document.createElement("div");
    cards.className = "annotationCards";
    d.arrange.cards.forEach(function (card) {
      var paper = document.createElement("article");
      paper.className = "annotationPaper annotationPaperResolved";
      var source = document.createElement("small"); source.textContent = displayText(card.source);
      var text = document.createElement("p"); text.textContent = displayText(card.text);
      var placement = document.createElement("strong");
      placement.className = "annotationPlacement";
      placement.textContent = "歸位｜" + displayText(labels[d.arrange.lastLayout[card.id]] || "未辨識");
      paper.appendChild(source); paper.appendChild(text); paper.appendChild(placement); cards.appendChild(paper);
    });
    board.appendChild(cards); box.appendChild(board);
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
      var suspendCoach = DEBATE.chapter && DEBATE.chapter.speakers &&
        DEBATE.chapter.speakers.coach || "伽利略";
      var suspendLabel = suspendCoach === "伽利略" ? "與伽利略複盤" : "與" + suspendCoach + "複盤";
      mkBtn(box, suspendLabel, function () {
        doDebate("debateExitSuspended", []);
      });
      return;
    }
    if (d.status === "won" || d.phase === "won") {
      renderResolvedAnnotation(d, box);
      var pW = document.createElement("p");
      pW.textContent = d.arrange
        ? "三張原紙已對位，方法性批註的墨線仍留在紙上——收束辯論。"
        : "支柱盡破,最後反撲已破——收束辯論。";
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
      if (d.reason) {
        var reasonCard = document.createElement("section");
        reasonCard.className = "pressChoice debateReason";
        var reasonPrompt = document.createElement("h3");
        reasonPrompt.textContent = displayText(d.reason.prompt);
        reasonCard.appendChild(reasonPrompt);
        var reasonHint = document.createElement("p");
        reasonHint.textContent = "證據已對上。現在由你決定，這張紙究竟能把話說到哪裡。";
        reasonCard.appendChild(reasonHint);
        d.reason.options.forEach(function (option) {
          mkBtn(reasonCard, option.text, function () { doDebate("debateReason", [option.id]); });
        });
        box.appendChild(reasonCard);
        return;
      }
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
        if (!sum && SCENES.evidenceSummaries) sum = SCENES.evidenceSummaries[sumKey];
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
    if (d.phase === "arrange") {
      var board = document.createElement("section");
      board.className = "annotationBoard";
      var arrangeTitle = document.createElement("h3");
      arrangeTitle.textContent = "把三張原紙重新排好";
      board.appendChild(arrangeTitle);
      var arrangePrompt = document.createElement("p");
      arrangePrompt.textContent = displayText(d.arrange.prompt);
      board.appendChild(arrangePrompt);
      var oldNote = document.createElement("blockquote");
      oldNote.className = "annotationOriginalNote";
      oldNote.textContent = "原批註｜" + displayText(d.arrange.originalNote);
      board.appendChild(oldNote);
      var slotKey = document.createElement("p");
      slotKey.className = "annotationSlotKey";
      slotKey.textContent = d.arrange.slots.map(function (slot) { return slot.label; }).join(" ／ ");
      board.appendChild(slotKey);
      var selected = {};
      if (d.arrange.lastLayout) Object.keys(d.arrange.lastLayout).forEach(function (id) {
        selected[id] = d.arrange.lastLayout[id];
      });
      var cards = document.createElement("div");
      cards.className = "annotationCards";
      var submit = document.createElement("button");
      submit.type = "button";
      submit.className = "annotationSubmit";
      submit.textContent = "把這一版推回講台";
      function updateArrangeSubmit() {
        submit.disabled = d.arrange.cards.some(function (card) { return !selected[card.id]; });
      }
      d.arrange.cards.forEach(function (card) {
        var paper = document.createElement("article");
        paper.className = "annotationPaper";
        var source = document.createElement("small");
        source.textContent = displayText(card.source);
        paper.appendChild(source);
        var text = document.createElement("p");
        text.textContent = displayText(card.text);
        paper.appendChild(text);
        var label = document.createElement("label");
        label.textContent = "這張紙要放在哪裡？";
        var select = document.createElement("select");
        select.setAttribute("aria-label", displayText(card.source) + "的放置位置");
        var placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = "先讀紙，再選位置";
        select.appendChild(placeholder);
        d.arrange.dispositions.forEach(function (item) {
          var option = document.createElement("option");
          option.value = item.id;
          option.textContent = displayText(item.label);
          select.appendChild(option);
        });
        select.value = selected[card.id] || "";
        select.onchange = function () {
          if (select.value) selected[card.id] = select.value;
          else delete selected[card.id];
          updateArrangeSubmit();
        };
        label.appendChild(select);
        paper.appendChild(label);
        cards.appendChild(paper);
      });
      board.appendChild(cards);
      if (d.arrange.attempts > 0) {
        var trace = document.createElement("p");
        trace.className = "annotationTrace";
        trace.textContent = "上一版排法仍留在三張紙上；改動任何一欄，再整版送出。";
        board.appendChild(trace);
      }
      submit.onclick = function () {
        var encoded = "arrange:" + d.arrange.cards.map(function (card) {
          return card.id + "=" + selected[card.id];
        }).join(",");
        doDebate("debateFr", [encoded]);
      };
      updateArrangeSubmit();
      board.appendChild(submit);
      box.appendChild(board);
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
    var coach = DEBATE.chapter && DEBATE.chapter.speakers &&
      DEBATE.chapter.speakers.coach || "伽利略";
    var debriefLabel = coach === "伽利略" ? "與伽利略複盤" : "與" + coach + "複盤";
    var h = document.createElement("h2"); h.textContent = debriefLabel; box.appendChild(h);
    var lead = document.createElement("p");
    lead.textContent = "你不缺證據。先看剛才把哪些證據放進了不相干的句子；已破的支柱會原樣保留。";
    box.appendChild(lead);
    var mistakes = d && d.mistakes ? d.mistakes : [];
    var list = document.createElement("ol"); list.className = "debriefList";
    if (!mistakes.length) {
      var none = document.createElement("li"); none.textContent = "沒有可列出的配對；回想最後一個讓論證對位歸零的選擇。"; list.appendChild(none);
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
      "series-open": "目前這組還沒結束；請先完成或明確放棄，再換零件、校準或開新組。",
      "no-open-series": "先選一顆球，開始一組連續測量。",
      "wrong-order": "高度要依 4 → 9 → 16 → 25 格進行，才能形成可比較的一組紀錄。",
      "prediction-required": "25 格是驗證題：先押射程，再放球。",
      "prediction-locked": "預測已經封存；第 25 格結果揭曉前不能再改。",
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
        [sa, sb].forEach(function (sel2, index) {
          var placeholder = document.createElement("option");
          placeholder.value = "";
          placeholder.textContent = index === 0 ? "先選銅球紀錄" : "再選木球紀錄";
          placeholder.disabled = true; placeholder.selected = true;
          sel2.appendChild(placeholder);
        });
        comp.forEach(function (s) {
          [sa, sb].forEach(function (sel2) {
            var o = document.createElement("option"); o.value = s.id;
            o.textContent = "#" + s.id + "・" + (s.ball === "copper" ? "銅球" : "木球") +
              (s.accepted ? "・可引用" : "・不可引用");
            o.disabled = !s.accepted;
            sel2.appendChild(o);
          });
        });
        cr.appendChild(sa); cr.appendChild(sb);
        var compareHint = el("small", "", cr, "catCompareHint");
        var claimLabel = el("label", "", cr, "catCompareClaim");
        var claimCheck = document.createElement("input"); claimCheck.type = "checkbox";
        claimLabel.appendChild(claimCheck);
        claimLabel.appendChild(document.createTextNode("我主張：兩組只換了球，裝置、校準與資料門檻都相同。"));
        var compareButton = btn("比較兩組・提出斷言", function () {
          doLab2("compareBalls", { a: parseInt(sa.value, 10), b: parseInt(sb.value, 10) }, function (res) {
            return res.ok ? "同一副骨架——與球重無關,成立。" : "";
          });
        }, cr, "catPrimary");
        function comparePair() {
          return {
            a: comp.find(function (s) { return s.id === parseInt(sa.value, 10); }),
            b: comp.find(function (s) { return s.id === parseInt(sb.value, 10); })
          };
        }
        function updateCompareHint() {
          var pair = comparePair(), a = pair.a, b = pair.b, valid = false;
          if (!a || !b || !a.accepted || !b.accepted)
            compareHint.textContent = "先親自選一組銅球與一組木球；只有通過兩道門檻的紀錄能作證。";
          else if (a.id === b.id || a.ball === b.ball)
            compareHint.textContent = "請選一組銅球＋一組木球；同球重測不能回答重量。";
          else if (a.fingerprint !== b.fingerprint)
            compareHint.textContent = "這兩組連裝置或校準也不同；請找只換球的一組。";
          else if (a.apparatusRevision !== b.apparatusRevision)
            compareHint.textContent = "兩組之間曾拆裝器材；外觀看似相同，也不能宣稱只換了球。";
          else { compareHint.textContent = "✓ 差異清單只剩球種。請確認你的主張，再送出比較。"; valid = true; }
          claimCheck.disabled = !valid;
          if (!valid) claimCheck.checked = false;
          compareButton.disabled = !valid || !claimCheck.checked;
        }
        sa.onchange = updateCompareHint; sb.onchange = updateCompareHint;
        claimCheck.onchange = updateCompareHint; updateCompareHint();
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
  var ship3PerspectiveIntroSeen = {}; /* G4 純 UI 前導：照片退場後仍可重看，不改實驗存檔。 */
  var ship3TransformDraft = 0; /* CH3-CR-018 雙紙帶滑桿草稿；放手才寫進卷宗。 */
  var ship3DossierTab = "mast"; /* v0.7.1 單一卷宗的純 UI 頁籤；不影響實驗證據。 */
  var ship3DossierScrollTop = 0; /* 調整下拉選單時保留工作頁位置，避免每次重繪跳回頂端。 */
  var ship3DossierPendingReturnTop = null; /* 看完當次動畫並收卷後，回到下一回的執行位置。 */
  var ship3DossierHintOpen = false; /* 學者模式主動展開提示後，重繪仍保留。 */
  var ship3DossierHintMissionId = "";
  var ship3DossierDiagnosis = ""; /* 學者模式先呈現中性退件，再由玩家展開完整診斷。 */
  var ship3DossierDiagnosisReason = "";
  var ship3DossierDiagnosisRepeats = 0;
  var ship3LastSeriesIds = []; /* 純表現層：最近完成／重播的原紙組，不寫入存檔。 */
  var ship3ReplayRecordId = null;
  var ship3ReplayNotice = false;
  var ship3PendingMissionBridge = null; /* 先讓玩家看完雙視角動畫，再把場面交回對話框。 */
  var ship3P3BeatDraft = { beat: null, value: 0 }; /* 當拍滑桿草稿；按下套用後才進存檔。 */
  function ship3ExploreMode() { return !state || state.mode !== "scholar"; }
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
      var o = document.createElement("option"); o.value = v; o.textContent = displayText(labels[v] || v);
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
      "g2-required": "先完成停泊與平駛的船艙對照。",
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
      ,"pilot-focus-required": "人手只夠先顧一件事。請先決定這趟要優先查放手、船速，還是重複性。"
      ,"pilot-required": "先讓你的試航方案真正跑一次，才能從紀錄找缺口。"
      ,"pilot-diagnosis-required": "先指出試航還漏掉哪一種解釋，再安排完整分工。"
      ,"protocol-locked": "這份分工已經封存；結果出來後不能換人補洞。"
      ,"protocol-required": "先讓每個人只有一件工作，並封存分工。"
      ,"investigation-order-required": "先決定下一個要排除的是變速還是風。"
      ,"investigations-required": "變速與風的兩條調查都要收完，才能安排雙視角紀錄。"
      ,"dual-design-required": "先安排岸上與船上各自量什麼、由誰記，再讀兩張紙。"
      ,"public-criteria-required": "先在看見落點前封存採信標準。"
      ,"public-screen-required": "先依封存標準把六筆紀錄逐一收下或退回。"
      ,"dossier-paper-pending": "這張原紙還沒簽名收卷。先收好它，才能改下一組方案。"
      ,"dossier-paper-required": "先執行一組實驗，讓觀察者留下原紙。"
      ,"dossier-series-complete": "這組三回原紙已經收齊；可展開查看或重播，不必再做相同操作。"
      ,"dossier-cabin-series-complete": "這一種船況的三回艙內原紙已經收齊；請改做另一種船況，或查看既有紀錄。"
      ,"cabin-instrument-required": "先踏查船艙，選吊壺滴水或直拋石球；停泊與走穩都要沿用同一種。"
      ,"cabin-instrument-locked": "第一張船艙原紙已經收卷。為了讓兩組能比較，器材不能中途更換。"
      ,"dossier-location-fixed": "船艙對照是一組獨立觀察，不是桅頂落石的可調地點。請依船艙任務進行。"
      ,"dossier-fixed-control": "這一輪固定使用同一顆石頭與同一桅頂；目前沒有能真正改變這兩項物理條件的實驗。"
      ,"dossier-shore-speed-paper-required": "你安排了等拍鼓，卻只留下船上紙；船上的格紙看不出船相對碼頭怎麼走。請改成岸上記錄或岸、船各記一張。"
      ,"dossier-use-existing-comparison": "起步與走穩兩組原紙已經收齊。這一步不再執行新實驗，請在右頁勾選兩邊各三張原紙，寫下比較斷言。"
      ,"cabin-comparison-required": "先替船艙的停泊、平駛各留下三張原紙，再用兩組資料寫斷言。"
      ,"steady-assertion-required": "先用甲板原紙寫出第一句斷言，再把實驗搬進船艙。"
      ,"speed-assertion-required": "先把解纜起步與走穩兩組原紙放在一起，寫下船速改變與落點的比較，再進船艙。"
      ,"dossier-assertion-order-required": "先用上一輪的原紙寫完斷言，再開始下一個問題。"
      ,"dossier-p3-source-required": "先選定同一趟的岸紙與船紙。"
      ,"dossier-p3-question-required": "先說明兩張紙要比較同一事件與同一時刻。"
      ,"dossier-p3-concept-required": "先辨認岸紙以碼頭為起點、船紙以桅杆為起點。"
      ,"dossier-p3-boundary-required": "同號鼓點只先證明同一事件與時刻。先把這句話的範圍寫清楚，再換位置的尺。"
      ,"dossier-transform-method-required": "先選定逐拍移尺的方法，再處理每個鼓點。"
      ,"dossier-transform-beat-order": "換尺紙要照鼓號順序寫；前一拍完成後才能動下一拍。"
    };
    return map[code] || "這一步還不能做。請先完成畫面上提示的條件。";
  }
  function ship3DossierFailure(reason, fullText) {
    if (ship3ExploreMode() || String(reason || "").indexOf("dossier-") !== 0) {
      ship3DossierDiagnosis = "";
      ship3DossierDiagnosisReason = "";
      ship3DossierDiagnosisRepeats = 0;
      return fullText;
    }
    if (ship3DossierDiagnosisReason === reason) ship3DossierDiagnosisRepeats += 1;
    else {
      ship3DossierDiagnosisReason = reason;
      ship3DossierDiagnosisRepeats = 1;
    }
    ship3DossierDiagnosis = fullText;
    return {
      "dossier-scope-overread": "卷宗退回：這句斷言超出了所選原紙的範圍。",
      "dossier-source-mismatch": "卷宗退回：所選原紙沒有共同回答同一個問題。",
      "dossier-too-few-records": "卷宗退回：同一組可比較的原紙數量不足。",
      "dossier-dirty-release": "卷宗退回：所選原紙的放手方法不一致。",
      "dossier-speed-paper-missing": "卷宗退回：有原紙無法由可見資料判斷當趟船況。",
      "dossier-variable-mismatch": "卷宗退回：所選原紙的條件欄不一致。",
      "dossier-comparison-missing": "卷宗退回：比較所需的其中一組原紙不完整。"
    }[reason] || "卷宗退回：資料與斷言之間仍有一處不一致。";
  }
  /* ── 工作台對話框化(WB-CR-025)────────────────────────────────
     總監 2026-07-28:「實驗室/工作台中的對話也要用對話框顯示(有立繪那個)。」
     設計:對話框=演出層(bd:line→立繪+打字機+ack),工作台 blockquote=留檔層,
     兩層並存──對話框播完即退場(既有 queue-active 機制),工作台恆常可讀,
     滿足「被質疑的那張紙與那句話同屏可見」;讀檔中途不重播(只在 doShip 動作時發話)。 */
  var SPOKEN_RE = /^([\u4e00-\u9fff·・A-Za-z]{1,8})：(?:（([^）]*)）)?\s*「([\s\S]*?)」\s*$/;
  function parseSpokenLine(raw) {
    /* 一整條字串可能含多行(\n 接多位講者);逐行拆,拆不動的行原樣回傳(cls stage)。 */
    return String(raw || "").split("\n").filter(function (t) { return t.trim(); })
      .map(function (t) {
        var m = t.match(SPOKEN_RE);
        return m ? { speaker: m[1], action: m[2] || "", text: m[3] }
                 : { speaker: null, action: "", text: t };
      });
  }
  function sayIntoDialogue(parsed, cls, sceneId) {
    parsed.forEach(function (it) {
      if (!it.text) return;
      var shown = it.action ? "（" + it.action + "）" + it.text : it.text;
      emit("bd:line", {
        speaker: it.speaker || (cls === "player" ? "旅人(你)" : "stage"),
        text: shown,
        cls: it.speaker ? (cls || "") : (cls || "stage"),
        scene: sceneId || (state && state.cursor ? state.cursor.scene : null),
        evidence: [], replay: false
      });
    });
  }
  var DEBATE_SAY_ACTIONS = {
    enterDossierDebate: 1, selectDossierPillar: 1, answerDossierDebate: 1,
    setDossierP3Premise: 1, alignDossierPapers: 1, transformDossierPapers: 1,
    transformDossierPaperBeat: 1,
    setDossierFinalBoundary: 1
  };
  function sayDebateBeat(prevDb, action) {
    /* 只在辯論動作後發話;比對前後值,只播「這次動作新產生」的話。 */
    if (!DEBATE_SAY_ACTIONS[action]) return;
    var db = state.lab && state.lab.caseFile && state.lab.caseFile.dossier &&
      state.lab.caseFile.dossier.debate;
    if (!db) return;
    var scene = state.cursor ? state.cursor.scene : null;
    var pl = typeof db.lastPlayerLine === "string" ? db.lastPlayerLine : "";
    if (pl && pl !== prevDb.pl)
      sayIntoDialogue([{ speaker: "旅人(你)", action: "", text: pl }], "player", scene);
    if (db.lastReply && db.lastReply !== prevDb.reply)
      sayIntoDialogue(parseSpokenLine(db.lastReply), "", scene);
    if (db.lastOS && db.lastOS !== prevDb.os)
      sayIntoDialogue([{ speaker: "旅人・心聲", action: "", text: db.lastOS }], "", scene);
  }
  function ship3SayAssertionBeat(assertionId) {
    var activeDossier = state && state.lab && state.lab.caseFile && state.lab.caseFile.dossier;
    var cabinBeat = ship3DossierCabinInstrument(activeDossier) === "drip"
      ? "停泊三回、平駛三回，水滴都落在碗裡的圈內。"
      : (ship3DossierCabinInstrument(activeDossier) === "toss"
        ? "停泊三回、平駛三回，石球都落回手邊。"
        : "停泊三回、平駛三回，水面和落球都差不多。");
    var beats = {
      A1: [
        { speaker: "旅人(你)", text: "三回都落在桅腳附近。同一顆石頭、同一個高度、同一個門閂。" },
        { speaker: "艾蒂安", action: "在岸紙上補一行", text: "三回的船位間距我也記了。一樣。" },
        { speaker: null, text: "馬蒂厄把封蠟壓上。蠟還熱著，印子有點歪。" },
        { speaker: "馬蒂厄", text: "歪的沒關係。日期看得見就行。" }
      ],
      A3: [
        { speaker: "旅人(你)", text: "起步那組偏後，走穩那組沒有。差別不在船，不在石頭，不在放手的人。" },
        { speaker: "維達爾船長", text: "那在哪。" },
        { speaker: "旅人(你)", text: "在船速還在不在變。" },
        { speaker: "維達爾船長", action: "很久", text: "……我那張紙沒有這一欄。" },
        { speaker: "旅人(你)", text: "對。所以船況那一欄只能寫「不知道」。" },
        { speaker: "維達爾船長", action: "把舊紙推過來", text: "那就寫「不知道」。" }
      ],
      A2: [
        { speaker: "旅人(你)", text: "關起來的艙裡，" + cabinBeat },
        { speaker: "伽桑狄", text: "這句只到艙門為止。" },
        { speaker: "旅人(你)", text: "我知道。我沒有說風不重要——我說的是，沒有甲板風，它照樣這樣落。" },
        { speaker: "伽桑狄", action: "在紙角寫了兩個字，推回來", text: "那就這樣寫。" },
        { speaker: null, text: "紙角寫著：「艙內」。" }
      ],
      S1: [
        { speaker: "旅人(你)", text: "這三回落點散開了。放手的方式沒有固定。" },
        { speaker: "馬蒂厄", text: "每回都是我鬆手。" },
        { speaker: "馬蒂厄", action: "看著自己的手", text: "但我的手沒有每次都一樣。" },
        { speaker: "旅人(你)", text: "所以這組不能替乾淨落點作證。" },
        { speaker: "馬蒂厄", action: "把紙抽走，另外壓一枚蠟", text: "不作證，不代表丟掉。它證明的是門閂有用。" }
      ],
      S4: [
        { speaker: "旅人(你)", text: "今天量到三種船況：偏後、桅腳、偏前。" },
        { speaker: "伽桑狄", text: "三種。不是全部。" },
        { speaker: "旅人(你)", text: "我只寫這三種，和這一艘船。" },
        { speaker: "維達爾船長", action: "在單子上畫一筆", text: "那就少賠一點錢。" }
      ]
    };
    var lines = beats[assertionId];
    if (lines) sayIntoDialogue(lines, "", state.cursor ? state.cursor.scene : null);
  }
  function ship3SayMissionBridge(beforeId, afterId) {
    if (!afterId || beforeId === afterId) return;
    var key = String(beforeId || "") + ">" + afterId;
    var bridges = {
      "reproduce>steady": [
        { speaker: "艾蒂安", action: "把岸紙壓在舊紙旁", text: "舊紙那個落點重做出來了。可你看這幾個岸標——每一拍都拉得更開。" },
        { speaker: "馬蒂厄", text: "所以這一趟不只往前，還越走越快。石頭落在桅後，到底是哪一件事造成的？" },
        { speaker: "維達爾船長", action: "沒有伸手去拿紙", text: "八年前我只做過解纜這一種。那張紙回答不了。" },
        { speaker: "旅人(你)", text: "下一趟我只查一件事：等船走穩後，石頭還會不會落在桅後？" }
      ],
      "steady>speed": [
        { speaker: "伽桑狄", action: "把兩列岸紙並排", text: "兩組船都往前。只有左邊這組，鼓點間距一直變；落點卻一組在桅後，一組回到桅腳。" },
        { speaker: "維達爾船長", text: "兩組都是我的船，也都在往前。你要把哪件事分開？" },
        { speaker: "旅人(你)", text: "船正在往前，和船每一拍走得比上一拍更遠，是兩件事。" },
        { speaker: null, text: "馬蒂厄把墨水瓶放在一塊鬆木板上，兩手按住木板兩端。" },
        { speaker: "馬蒂厄", text: "這塊板當船。瓶子一放手，我再把板猛推或猛收——瓶子相對木板會往哪裡？先寫下來，別等我動手。" },
        { speaker: "馬蒂厄", action: "把兩疊紙推到旅人面前", text: "那就別再跑。用這兩組原紙，把這句話寫到它們真的量過的地方。" }
      ],
      "speed>cabin": [
        { speaker: null, text: "一陣側風把攤在桶上的紙掀起一角。馬蒂厄用封蠟壓住。" },
        { speaker: "維達爾船長", text: "桅頂不是密室。甲板上的風也跟船一起走。你拿什麼把它跟石頭原來的前行分開？" },
        { speaker: "伽桑狄", action: "看向艙門", text: "把外頭的風隔開，再比較停船和走穩。但先說清楚：這只能查甲板風是不是必要，不能證明風永遠沒影響。" }
      ],
      "cabin>dual": [
        { speaker: null, text: "艾蒂安從岸上下來，手裡拿著一張紙，走得很快。" },
        { speaker: "艾蒂安", action: "按著岸紙", text: "我每一拍都照岸標記。石頭確實一面往前、一面往下。" },
        { speaker: "馬蒂厄", action: "把船上那張推過去", text: "我畫的是直的。" },
        { speaker: "艾蒂安", text: "同一顆石頭。" },
        { speaker: "馬蒂厄", text: "同一顆石頭。" },
        { speaker: null, text: "兩張紙並排。一張向前彎下去，一張筆直落下。" },
        { speaker: "維達爾船長", action: "沒有看紙，看著兩個人", text: "同一顆石頭、同一趟落下，不能靠撕掉一張來解決。你們兩個，誰站錯地方了？" },
        { speaker: "艾蒂安", text: "我沒有離開過岸。" },
        { speaker: "馬蒂厄", text: "我沒有離開過船。" },
        { speaker: "旅人・心聲", osPurpose: "private_hypothesis", text: "兩張紙都沒有漏拍。那個差別，也許不是誰畫錯了。" },
        { speaker: "伽桑狄", action: "沒有動兩張紙", text: "先都留著。到碼頭讓旅人把兩張紙怎麼對得上，做給大家看。" }
      ],
      "dual>explore": [
        { speaker: "馬蒂厄", action: "把最後一份封起來", text: "今天的紙，齊了。" },
        { speaker: "維達爾船長", action: "翻著卷宗，翻得很慢", text: "我那張還是缺一欄。" },
        { speaker: "旅人(你)", text: "那一欄補不回來了。" },
        { speaker: "維達爾船長", action: "停手", text: "……嗯。" },
        { speaker: "旅人(你)", text: "可是能寫清楚它缺什麼。這樣它還能用。" },
        { speaker: null, text: "他把八年前那張紙，放回卷宗最上面。" },
        { speaker: "伽桑狄", text: "把這些紙帶上碼頭。明天輪到你回答。" }
      ]
    };
    if (bridges[key]) sayIntoDialogue(bridges[key], "", state.cursor ? state.cursor.scene : null);
  }
  var SHIP3_CABIN_WIND_OPTIONS = [
    {
      id: "wait-calm", label: "等一個自認無風的日子",
      feedback: "沒有量風，就不能確認兩趟的甲板條件相同。",
      reply: [{ speaker: "維達爾船長", text: "你在馬賽等無風的日子。我可以等，一天照算錢。" }]
    },
    {
      id: "close-cabin", correct: true, label: "搬進船艙，只比較關艙後",
      feedback: "承諾已寫下：隔開甲板風，但結論只限關艙後的比較。",
      reply: [
        { speaker: "伽桑狄", text: "剛才船已經開了，你只看著杯水沒有察覺。現在把窗關上，看滴水或直拋的球，會不會留下同樣『艙內看不出前行』的痕跡。" },
        { speaker: "旅人(你)", text: "這裡沒有桅頂，也不是同一個落石。我只想把甲板風隔開，看封閉艙裡停船和平駛會不會留下可分辨的差別。" },
        { speaker: "伽桑狄", action: "推開艙門，指了指吊壺與石球", text: "進去先選一樣。讓水滴落進碗，或把石球直直拋起。停泊和平駛，都用同一樣。" },
        { speaker: "艾蒂安", text: "我留在岸上。等我確認船走穩，才升白旗讓你們開始。" }
      ]
    },
    {
      id: "windbreak", label: "在甲板立擋風板",
      feedback: "擋風板仍留在甲板風裡，殘留風也沒有被量清楚。",
      reply: [{ speaker: "馬蒂厄", text: "擋不乾淨的東西，紙上就寫不清楚。" }]
    }
  ];
  function ship3OpenIntermission(token, label, choices) {
    document.dispatchEvent(new CustomEvent("bd:workbench-intermission", {
      detail: {
        token: token, view: "ship",
        scene: state && state.cursor ? state.cursor.scene : null,
        label: label,
        choices: choices || []
      }
    }));
  }
  function ship3StartAssertionIntermission(assertionId, beforeId, afterId) {
    var configs = {
      A1: { token: "ch3-after-a1", label: "▸ 回到實驗簿，比較兩輪原紙" },
      A3: {
        token: "ch3-cabin-wind",
        choices: SHIP3_CABIN_WIND_OPTIONS.map(function (option) {
          return { id: option.id, label: option.label };
        })
      },
      A2: { token: "ch3-after-a2", label: "▸ 進入雙視角實驗" }
    };
    var config = configs[assertionId];
    if (!config) return false;
    ship3OpenIntermission(config.token, config.label, config.choices);
    ship3SayAssertionBeat(assertionId);
    ship3SayMissionBridge(beforeId, afterId);
    return true;
  }
  document.addEventListener("bd:workbench-intermission-choice", function (event) {
    var detail = event.detail || {};
    if (CHAPTER_ID !== "ch3" || detail.token !== "ch3-cabin-wind") return;
    var option = SHIP3_CABIN_WIND_OPTIONS.find(function (item) {
      return item.id === detail.choice;
    });
    if (!option) return;
    var result = doShip("commitDossierCabinWindPlan", { choice: option.id },
      "✓ " + option.feedback, option.feedback);
    if (!result || result.error) return;
    if (option.reply) sayIntoDialogue(option.reply, "", state.cursor ? state.cursor.scene : null);
    if (result.result && result.result.ok) {
      ship3OpenIntermission("ch3-after-wind-choice", "▸ 進入船艙實驗");
    }
  });
  function doShip(action, args, okText, failText) {
    var scrollWork = document.querySelector(".shipDossierWork");
    var preserveDossierScroll = !!scrollWork &&
      ["enterDossierDebate", "leaveDossierDebate"].indexOf(action) < 0;
    var windowScrollX = window.scrollX || 0;
    var windowScrollY = window.scrollY || 0;
    var activeNode = preserveDossierScroll ? document.activeElement : null;
    var activeKey = activeNode && (activeNode.getAttribute("data-ship-focus") ||
      activeNode.getAttribute("aria-label"));
    var activeTop = activeNode && activeNode.getBoundingClientRect
      ? activeNode.getBoundingClientRect().top : null;
    if (preserveDossierScroll && scrollWork) ship3DossierScrollTop = scrollWork.scrollTop;
    var before = JSON.stringify(state.lab.evidence || {});
    var missionBefore = state.lab && state.lab.caseFile && state.lab.caseFile.dossier
      ? ship3DossierMissionState(state.lab.caseFile.dossier).id : null;
    var dbPrev = (function () { /* 對話框化:記下動作前的三句,供 sayDebateBeat 去重 */
      var db = state.lab && state.lab.caseFile && state.lab.caseFile.dossier &&
        state.lab.caseFile.dossier.debate;
      return db ? { pl: db.lastPlayerLine || "", reply: db.lastReply || "", os: db.lastOS || "" }
                : { pl: "", reply: "", os: "" };
    })();
    var r = N.labAction(state, action, args || {});
    if (r.error) {
      ship3DossierDiagnosis = "";
      ship3Msg = "✕ " + ship3Error(r.error);
    }
    else {
      setState(r.state);
      var rr = r.result || {};
      sayDebateBeat(dbPrev, action);
      if (action === "runSpeedChange" && rr.run && (rr.run.id === 1 || !rr.run.matched)) {
        var directionNames = { behind:"偏船尾", foot:"仍在桅腳", ahead:"偏船頭" };
        var speedChangeName = rr.run.state === "accelerating" ? "加槳後變快" : "收槳後變慢";
        var speedResultReply = rr.run.matched
          ? "你先押「"+directionNames[rr.run.predicted]+"」，紙上也是「"+directionNames[rr.run.outcome]+"」。先別擦；等另一種船況做完，再看偏移會不會跟著船速改變反向。"
          : "你先押「"+directionNames[rr.run.predicted]+"」，紙上卻是「"+directionNames[rr.run.outcome]+"」。錯押留下；它正好逼我們重想「"+speedChangeName+"」時，船和石頭誰改了速度。";
        sayIntoDialogue([{ speaker:"維達爾船長", action:"把預測紙和落點紙並排", text:speedResultReply }],
          "", state.cursor ? state.cursor.scene : null);
      }
      var dossierAfter = state.lab && state.lab.caseFile && state.lab.caseFile.dossier;
      var missionAfter = dossierAfter ? ship3DossierMissionState(dossierAfter).id : null;
      var deferMissionBridge = action === "runDossierSeries" &&
        missionBefore === "dual" && missionAfter === "explore" &&
        Array.isArray(rr.records) && rr.records.length > 0;
      var assertionIntermission = action === "setDossierScope" && rr.ok !== false && rr.assertion &&
        ship3StartAssertionIntermission(rr.assertion, missionBefore, missionAfter);
      if (assertionIntermission) {
        /* 斷言成立後由舞台對話接手，不讓人物隔著工作台念完。 */
      } else if (deferMissionBridge)
        ship3PendingMissionBridge = { from: missionBefore, to: missionAfter };
      else ship3SayMissionBridge(missionBefore, missionAfter);
      if (action === "setDossierScope" && rr.ok !== false && rr.assertion && !assertionIntermission)
        ship3SayAssertionBeat(rr.assertion);
      if ((action === "runDossierSeries" || action === "runDossierCabinSeries") &&
          Array.isArray(rr.records)) {
        ship3LastSeriesIds = rr.records.map(function (record) {
          return action === "runDossierCabinSeries" ? record.id : "R" + record.id;
        });
        ship3ReplayRecordId = ship3LastSeriesIds[0] || null;
        ship3ReplayNotice = false;
      }
      if (action === "runDossierExperiment" && scrollWork)
        ship3DossierPendingReturnTop = scrollWork.scrollTop;
      var delayedOverlayFeedback = null;
      if (rr.ok === false) {
        var why = {
          "beats-mismatch": "終點雖然重合了，但同一編號的鼓點仍錯開；你比較到的不是同一時刻。",
          "wrong-transform": "縮放只會改變圖的大小，不能改變參考物。請逐拍算『石頭相對岸的位置－桅杆相對岸的位置』。",
          "move-too-short": "尺還沒移到同拍桅杆記號；紅點會留在圖上，和船紙比較後再調整。",
          "move-too-far": "尺越過同拍桅杆記號；紅點會留在圖上，和船紙比較後再調整。",
          "evidence-mismatch": "這張證據沒有直接回答這道質詢。換一張真正做過相應對照的紀錄。",
          "claim-mismatch": "這組紀錄還不足以支持你選的說法。檢查是否混入受干擾的紀錄，或把現象解釋成了資料沒有測量的原因。",
          "gap-already-covered": "你選的項目正是這趟已經顧到的部分；試著找紀錄中仍無法排除的另一個解釋。",
          "protocol-incomplete": "還有工作沒有人負責。只要有一欄空著，這趟就不能追溯。",
          "role-conflict": "同一個人被安排在兩個位置；放手、敲鼓與觀察不能靠分身同時完成。",
          "role-mismatch": "這份分工讓人站錯位置或做錯專長。先想清楚誰必須在桅頂、岸上與舵邊。",
          "local-traces-overread": "兩條局部痕跡幾乎一樣。硬把 A 或 B 指成停船，只是在替未知答案貼標籤。",
          "wind-design-ambiguous": "只跑單一航向，或只記岸上的風向，會把船自己造成的相對風混進來。",
          "dual-design-mismatch": "岸上要以碼頭量，船上要以桅杆量；兩邊還必須共用鼓點，且不能讓抽閂者兼任觀察。",
          "criteria-too-weak": "維達爾船長退回這份標準：它容許變速、手推、單份紀錄或一次巧合混進來。請在揭曉前重新封存。",
          "screening-incomplete": "六筆紀錄都必須在看見落點前判定收或不收。",
          "screening-mismatch": "你的判定沒有一致照封存標準執行。維達爾船長只指出編號，不會先揭露落點。",
          "too-few-public-records": "照這份標準留下的合格紀錄不足以完成你自己要求的重複次數。",
          "wind-overread": "兩趟的風不一樣，落點卻沒有跟著固定偏向同一邊。這些紀錄只能說：這次沒有看見風造成一致的偏移。",
          "fingerprint-mismatch": "三張紙的方向沒有排對：加速時船追到石頭前面，減速時船反而落到石頭後面。",
          "dual-claim-mismatch": "兩張紙記的是同一事件與同一組鼓點；差別不是哪張錯，而是哪一把尺被當作不動。",
          "dossier-scope-overread": "這句話超過了資料能支持的範圍。只說今天在這些條件下量到的事。",
          "dossier-source-mismatch": "這些原紙沒有一起回答同一個問題，或還少一組對照。請重新挑選。",
          "dossier-too-few-records": "同一組條件還不到三張原紙。照原來的做法再執行，至少留下三次獨立紀錄。",
          "dossier-dirty-release": "勾選的原紙混入了不同的放手方法。先只比較用同一方法放手的紀錄。",
          "dossier-speed-paper-missing": "其中有原紙沒有逐拍船位，無法確認放手時船怎麼走。改勾有岸上船速紙的紀錄。",
          "dossier-variable-mismatch": "這些原紙同時改了不只一項條件。先勾選船、石頭、放手高度與記錄方式相同的資料。",
          "dossier-comparison-missing": "這句話需要兩組各三張原紙。檢查是否少了停泊／平駛，或平駛／解纜起步其中一組。",
          "wind-wait-unmeasured": "沒有量風，就不能把兩趟的甲板風當成相同條件。",
          "windbreak-incomplete": "擋風板仍在甲板風裡，不能確認殘留風已被隔開。",
          "unknown-dossier-source": "這張原紙不在目前的卷宗裡。",
          "dossier-evidence-missing": "這一柱問的是你還沒測過的條件。先回船補做；原紙和已答完的柱都會保留。",
          "concept-mismatch": "這個說法沒有回答船長的追問。先看他問的是共同前行、船速改變，還是量位置的起點。",
          "question-mismatch": "你回答了落點，卻沒有補上舊紙真正缺少的船速欄。",
          "classification-mismatch": "岸標間距不支持這個船況。請照當趟岸紙判斷：走穩、變快，或船況不明。",
          "old-paper-overread": "今天的資料不能補寫八年前沒記的船速。舊紙只能標成「船速未記」。",
          "p3-premise-mismatch": "先證明兩張紙記的是同一事件，再問如何換尺；不能先挑一張看起來順眼的。",
          "overclaim": "伽桑狄：（手掌壓住紙，墨在掌下暈開）「停。我們量的是船上的落石，不是地球有沒有動。」"
        };
        var tailored = typeof failText === "function" ? failText(rr) : failText;
        var feedback = tailored || why[rr.reason] || "這一步還不能成立。";
        if ((action === "alignRecords" || action === "transformRecords") && rr.preview) {
          /* G4 的錯誤先在紙帶上完整演出，再補診斷；避免提示搶在可觀察後果之前。 */
          ship3Msg = "";
          delayedOverlayFeedback = {
            preview: rr.preview,
            text: "✕ " + feedback,
            reply: rr.preview === "endpoints"
              ? [{ speaker: "艾蒂安", text: "你把我的第三拍接到他的第四拍了。終點貼上，不代表時刻貼上。" }]
              : [{ speaker: "馬蒂厄", action: "按住原來的墨點", text: "紙縮小了，原來的點也離開刻痕。我不替這張換過大小的紙簽名。" }]
          };
        } else ship3Msg = "✕ " + ship3DossierFailure(rr.reason, feedback);
      } else {
        ship3DossierDiagnosis = "";
        ship3DossierDiagnosisReason = "";
        ship3DossierDiagnosisRepeats = 0;
        ship3Msg = typeof okText === "function" ? okText(rr) : (okText || "✓ 已記錄。");
      }
      var visualKinds = {
        runPilot: "pilot-run",
        runDesignedProtocol: "protocol-run",
        runCabinBlindPair: "cabin-blind",
        runWindAudit: "wind-audit",
        runBaseline: "mast-dock",
        runMast: args && args.window === "stable" ? "mast-steady" : "mast-accelerating",
        runCabin: "cabin-" + ((args && args.vesselState) || "dock") + "-" + ((args && args.test) || "drip"),
        runSpeedChange: "speed-" + ((args && args.kind) || "accelerating"),
        inspectRecordBeat: "tapes-read",
        alignRecords: args && args.pair === "sameBeats" ? "tapes-beats" : "tapes-endpoints",
        transformRecords: args && args.kind === "scaleOnly" ? "tapes-scale" : "tapes-subtract",
        resetOverlay: "tapes-reset",
        setReference: "tapes-reference-" + ((args && args.ref) || "shore"),
        sealPublicCriteria: "public-criteria",
        finalizePublicScreen: "public-screen",
        revealPublicResults: "public-reveal",
        runPublicStep: "public-" + ((args && args.step) || "baseline"),
        setBoundary: "boundary-" + ((args && args.choice) || "honest")
      };
      if (action === "runCaseVoyage") visualKinds[action] = "case-" + ((args && args.stage) || "voyage");
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
            if (pendingFeedback.reply)
              sayIntoDialogue(pendingFeedback.reply, "", state.cursor ? state.cursor.scene : null);
            renderAll();
          }
        }, reduced ? 0 : 720);
        return r;
      }
    }
    renderAll();
    if ((action === "runDossierExperiment" || action === "runDossierSeries") && !r.error) {
      window.requestAnimationFrame(function () {
        window.scrollTo(windowScrollX, windowScrollY);
        var nextWork = document.querySelector(".shipDossierWork");
        var runStage = nextWork && nextWork.querySelector(action === "runDossierSeries"
          ? ".shipDossierSeriesResult .shipDossierRunStage"
          : ".shipDossierRunStage");
        if (nextWork && runStage) {
          var workRect = nextWork.getBoundingClientRect();
          var runRect = runStage.getBoundingClientRect();
          nextWork.scrollTop += runRect.top - workRect.top - 10;
          ship3DossierScrollTop = nextWork.scrollTop;
        }
        window.scrollTo(windowScrollX, windowScrollY);
      });
    } else if (action === "fileDossierRecord" && !r.error) {
      var pendingReturnTop = ship3DossierPendingReturnTop;
      ship3DossierPendingReturnTop = null;
      window.requestAnimationFrame(function () {
        window.scrollTo(windowScrollX, windowScrollY);
        var nextWork = document.querySelector(".shipDossierWork");
        var nextRunButton = nextWork &&
          nextWork.querySelector('[data-ship-focus="run-deck-record"]:not(:disabled)');
        if (nextWork) {
          if (pendingReturnTop != null) nextWork.scrollTop = pendingReturnTop;
          if (nextRunButton) {
            var workRect = nextWork.getBoundingClientRect();
            var buttonRect = nextRunButton.getBoundingClientRect();
            if (buttonRect.top < workRect.top + 10)
              nextWork.scrollTop -= workRect.top + 10 - buttonRect.top;
            else if (buttonRect.bottom > workRect.bottom - 10)
              nextWork.scrollTop += buttonRect.bottom - (workRect.bottom - 10);
          }
          ship3DossierScrollTop = nextWork.scrollTop;
        }
        if (nextRunButton) {
          try { nextRunButton.focus({ preventScroll: true }); } catch (e) { nextRunButton.focus(); }
        }
        window.scrollTo(windowScrollX, windowScrollY);
      });
    } else if (preserveDossierScroll) {
      window.requestAnimationFrame(function () {
        window.scrollTo(windowScrollX, windowScrollY);
        var nextWork = document.querySelector(".shipDossierWork");
        if (nextWork) nextWork.scrollTop = ship3DossierScrollTop;
        if (activeKey && nextWork) {
          var focusables = nextWork.querySelectorAll("[data-ship-focus],[aria-label]");
          Array.prototype.some.call(focusables, function (node) {
            var key = node.getAttribute("data-ship-focus") || node.getAttribute("aria-label");
            if (key !== activeKey) return false;
            try { node.focus({ preventScroll: true }); } catch (e) { node.focus(); }
            if (activeTop != null) {
              var delta = node.getBoundingClientRect().top - activeTop;
              if (Math.abs(delta) > 1) nextWork.scrollTop += delta;
            }
            /*
             * 保留原位置後，下拉選單雖然還在畫面內，整張設定卡的標題
             * 可能剛好卡在工作頁上緣。再以設定卡為單位收進可視範圍。
             */
            var focusCard = node.closest && node.closest(".shipDossierSetting");
            if (focusCard) {
              var workRect = nextWork.getBoundingClientRect();
              var cardRect = focusCard.getBoundingClientRect();
              if (cardRect.top < workRect.top + 10)
                nextWork.scrollTop -= workRect.top + 10 - cardRect.top;
              else if (cardRect.bottom > workRect.bottom - 10)
                nextWork.scrollTop += cardRect.bottom - (workRect.bottom - 10);
            }
            return true;
          });
        }
      });
    }
    return r;
  }
  function ship3Mission(phase) {
    var m = {
      "pilot-design": ["先決定這趟要查什麼", "人手只夠先顧一件事。三種方案都合理，也都會留下可診斷的缺口。"],
      protocol: ["把漏洞變成分工", "安排放手、計時、岸上觀察、船上觀察與船況控制；一個人不能同時站兩處。"],
      investigations: ["追查變速與風", "先選調查順序，再用指紋分清系統性偏移與實驗散布。"],
      "dual-design": ["自己設計兩個觀察位置", "決定每張紙從哪裡量、共用哪一個時鐘，以及誰負責船上紀錄。"],
      "public-criteria": ["結果揭曉前，先封採信標準", "先決定什麼紀錄才算數；封存後只看操作條件，不偷看落點。"],
      "public-screen": ["用自己的標準審紀錄", "六筆資料先遮住落點。逐筆收下或退回，完成後才一起揭曉。"],
      baseline: ["停船基準", "校準鉛垂線，選一種不額外推石頭的釋放法，取得三次乾淨落點。"],
      "first-failure": ["故意保留一次失敗", "在船剛離岸、仍加速時放手；別刪掉異常，先看它跟哪個條件一起出現。"],
      "steady-mast": ["等船近似穩速", "用鼓點與岸標挑出穩定窗口，完成三次桅頂落石。"],
      cabin: ["把甲板風隔在艙外", "停泊與平駛各做三回；每回記水面和落球，六張紙都齊了才能比較。"],
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
  function ship3PerspectiveIntro(parent) {
    var map = ASSETS && ASSETS.shipPerspectiveIntro || {};
    var intro = ship3El("section", null, parent, "shipPerspectiveIntro");
    ship3El("p", "先看同一顆石頭的兩個位置", intro, "shipPerspectiveEyebrow");
    var grid = ship3El("div", null, intro, "shipPerspectiveGrid");
    var specs = [
      {
        kind: "shore", id: map.shore,
        badge: "鏡頭在碼頭", title: "岸上看｜碼頭不動",
        note: "船穩速向前；石頭向前等距、向下越落越多，連成向前彎下的路。",
        alt: "從馬賽港碼頭望向穩速前進的實驗船；桅頂石頭一面向前、一面加快下落，軌跡向前彎下。"
      },
      {
        kind: "ship", id: map.ship,
        badge: "鏡頭在甲板", title: "船上看｜桅杆不動",
        note: "跟著船一起看，石頭相對桅杆近乎直落。",
        alt: "站在實驗船甲板望向中央桅杆；桅頂釋放架與桅腳位於同一直線。"
      }
    ];
    specs.forEach(function (spec) {
      var card = ship3El("figure", null, grid, "shipPerspectiveCard " + spec.kind);
      var frame = ship3El("div", null, card, "shipPerspectiveFrame");
      var entry = assetEntry(spec.id);
      if (entry) {
        var image = document.createElement("img");
        image.src = assetUrl(entry); image.alt = spec.alt;
        image.className = "shipPerspectiveImage";
        frame.appendChild(image);
      }
      ship3El("span", spec.badge, frame, "shipPerspectiveBadge");
      var ns = "http://www.w3.org/2000/svg";
      var svg = document.createElementNS(ns, "svg");
      svg.setAttribute("viewBox", "0 0 1000 563");
      svg.setAttribute("aria-hidden", "true");
      svg.setAttribute("class", "shipPerspectiveTrace " + spec.kind);
      frame.appendChild(svg);
      var path = document.createElementNS(ns, "path");
      path.setAttribute("class", "shipPerspectivePath");
      path.setAttribute("d", spec.kind === "shore"
        ? "M510 86 Q551 86 592 425"
        : "M505 68 C503 180 506 332 505 466");
      svg.appendChild(path);
      var points = spec.kind === "shore"
        ? [[510,86],[537,124],[565,237],[592,425]]
        : [[505,68],[504,194],[506,329],[505,466]];
      points.forEach(function (point, i) {
        var dot = document.createElementNS(ns, "circle");
        dot.setAttribute("class", "shipPerspectiveStone p" + i);
        dot.setAttribute("cx", point[0]); dot.setAttribute("cy", point[1]); dot.setAttribute("r", i === 0 ? 13 : 10);
        svg.appendChild(dot);
      });
      var cap = ship3El("figcaption", null, card);
      ship3El("b", spec.title, cap);
      ship3El("span", spec.note, cap);
    });
    ship3El("p", "不是兩顆石頭，也不是兩次實驗：只是觀察者站的位置不同。", intro, "shipPerspectiveKey");
    return intro;
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
    } else if (phase === "pilot-design") {
      var pilotD = lab.design && lab.design.pilot || {};
      draw("text", "shipSimState", { x: 500, y: 58, "text-anchor": "middle" }, "維達爾船長的舊紀錄：加速時偏向船尾");
      draw("line", "shipSimDeckAxis", { x1: 165, y1: 385, x2: 835, y2: 385 });
      draw("line", "shipSimPlumb", { x1: 500, y1: 105, x2: 500, y2: 385 });
      draw("circle", "shipSimTarget", { cx: 500, cy: 385, r: 27 });
      draw("circle", "shipSimLandingHistory", { cx: 375, cy: 385, r: 13 });
      draw("text", "shipSimAxisText", { x: 315, y: 430 }, "舊落點");
      draw("text", "shipSimAxisText", { x: 465, y: 430 }, "桅腳");
      [["release", "放手", 245], ["speed", "船速", 500], ["repeat", "重複", 755]].forEach(function (itemD) {
        var chosenD = pilotD.focus === itemD[0];
        draw("rect", "shipSimBadge " + (chosenD ? "done" : ""), { x: itemD[2] - 82, y: 476, width: 164, height: 44, rx: 8 });
        draw("text", "shipSimBadgeText", { x: itemD[2], y: 504, "text-anchor": "middle" }, (chosenD ? "✓ " : "") + itemD[1]);
      });
    } else if (phase === "protocol") {
      var aD = lab.design && lab.design.protocol && lab.design.protocol.assignments || {};
      var protocolAttemptsD = lab.design && lab.design.protocol && lab.design.protocol.attempts || [];
      var latestProtocolD = protocolAttemptsD.length ? protocolAttemptsD[protocolAttemptsD.length - 1] : null;
      var wrongProtocolD = latestProtocolD && !latestProtocolD.ok ? latestProtocolD.wrong || [] : [];
      var protocolNamesD = {
        mathieu: "馬蒂厄", sailor: "水手", etienne: "艾蒂安",
        gassendi: "伽桑狄", traveler: "旅人", captain: "維達爾船長"
      };
      var protocolNodesD = [
        ["release", "桅頂抽閂", 500, 92],
        ["clock", "甲板敲鼓", 300, 252],
        ["shore", "岸上記位", 145, 438],
        ["ship", "船上記錄", 690, 252],
        ["vessel", "維達爾船長控船", 855, 438]
      ];
      draw("line", "shipSimDeckAxis", { x1: 245, y1: 362, x2: 910, y2: 362 });
      draw("line", "shipSimPlumb", { x1: 500, y1: 56, x2: 500, y2: 362 });
      draw("text", "shipSimState", { x: 108, y: 510, "text-anchor": "middle" }, "碼頭／岸上");
      draw("text", "shipSimState", { x: 755, y: 510, "text-anchor": "middle" }, "船上甲板");
      protocolNodesD.forEach(function (nD) {
        var wrongD = wrongProtocolD.indexOf(nD[0]) >= 0;
        draw("line", "shipSimGuide", { x1: 500, y1: 294, x2: nD[2], y2: nD[3] });
        draw("circle", "shipEvidenceSeal " + (wrongD ? "wrong" : (aD[nD[0]] ? "got" : "")), { cx: nD[2], cy: nD[3], r: 58 });
        draw("text", "shipEvidenceSealText", { x: nD[2], y: nD[3] - 4, "text-anchor": "middle" }, nD[1]);
        draw("text", "shipSimAxisText", { x: nD[2], y: nD[3] + 22, "text-anchor": "middle" },
          wrongD ? "位置不合" : (protocolNamesD[aD[nD[0]]] || "待安排"));
      });
      draw("circle", "shipSimTarget", { cx: 500, cy: 294, r: 38 });
      draw("text", "shipSimBadgeText", { x: 500, y: 300, "text-anchor": "middle" }, "同一趟");
    } else if (phase === "investigations") {
      var designD = lab.design || {}, windD = designD.wind || {}, blindD = designD.cabinBlind || {};
      draw("text", "shipSimState", { x: 500, y: 56, "text-anchor": "middle" }, "資料指紋：方向是否跟船況一起反轉？");
      draw("line", "shipSimDeckAxis", { x1: 120, y1: 290, x2: 880, y2: 290 });
      draw("line", "shipSimPlumb", { x1: 500, y1: 115, x2: 500, y2: 290 });
      draw("circle", "shipSimTarget", { cx: 500, cy: 290, r: 25 });
      if (lab.evidence.g3) {
        draw("circle", "shipSimLanding", { cx: 330, cy: 290, r: 13 });
        draw("circle", "shipSimLanding", { cx: 670, cy: 290, r: 13 });
        draw("text", "shipSimAxisText", { x: 330, y: 330, "text-anchor": "middle" }, "加速偏尾");
        draw("text", "shipSimAxisText", { x: 670, y: 330, "text-anchor": "middle" }, "減速偏頭");
      }
      [["盲測", !!blindD.complete, 275], ["往返風向", windD.plan === "relative-roundtrip", 500], ["變速指紋", !!lab.evidence.g3, 725]].forEach(function (badgeD) {
        draw("rect", "shipSimBadge " + (badgeD[1] ? "done" : ""), { x: badgeD[2] - 90, y: 430, width: 180, height: 48, rx: 8 });
        draw("text", "shipSimBadgeText", { x: badgeD[2], y: 460, "text-anchor": "middle" }, (badgeD[1] ? "✓ " : "") + badgeD[0]);
      });
    } else if (phase === "public-criteria" || phase === "public-screen") {
      var demoD = lab.publicDemo || {}, decisionsD = demoD.decisions || {};
      draw("text", "shipSimState", { x: 500, y: 58, "text-anchor": "middle" },
        demoD.revealed ? "落點已揭曉" : "落點遮住：只看操作條件");
      (demoD.records || []).forEach(function (rD, iD) {
        var xD = 135 + iD * 145, acceptedD = decisionsD[rD.id];
        draw("rect", "shipPaperSheet " + (acceptedD === true ? "shore" : "ship"), { x: xD - 50, y: 150, width: 100, height: 230, rx: 10 });
        draw("text", "shipPaperLabel", { x: xD, y: 186, "text-anchor": "middle" }, rD.id);
        draw("text", "shipPaperNote", { x: xD, y: 232, "text-anchor": "middle" }, rD.equalSegments + " 段");
        draw("text", "shipPaperNote", { x: xD, y: 268, "text-anchor": "middle" }, rD.release === "latch" ? "門閂" : "手放");
        draw("text", "shipPaperNote", { x: xD, y: 304, "text-anchor": "middle" }, rD.dual ? "雙紀錄" : "單紀錄");
        draw("text", "shipPaperPairBadge " + (acceptedD === true ? "right" : "wrong"),
          { x: xD, y: 420, "text-anchor": "middle" },
          demoD.revealed ? ((rD.offset > 0 ? "+" : "") + rD.offset.toFixed(2)) :
            (acceptedD === true ? "收" : (acceptedD === false ? "退" : "未判")));
      });
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
        d: "M230 116 Q455 116 680 216"
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
        d: "M490 392 Q490 392 490 492"
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
    } else if (phase === "protocol") {
      cap.textContent = "左圖不是裝飾：桅頂、岸上與船上是不同位置；紅色站位表示分工演練無法執行。";
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
    } else if (phase === "public-demo" || phase === "public-criteria" || phase === "public-screen" || phase === "audit" || phase === "boundary") {
      cap.textContent = "把五張證據分開擺好：它們共同支持模型，但每張只能回答自己真正測過的問題。";
    } else cap.textContent = "按下放手後，石頭與落點會依這次船況實際演出；失敗紀錄同樣保留。";
    return fig;
  }

  function ship3CaseMission(v) {
    var preset = v.preset || "";
    var missions = {
      v1: ["先補一項，讓缺口現形", "你在對話裡選的控制已經放上甲板；這一趟只看它能回答什麼、還缺什麼。"],
      crew: ["一張紙，五個負責人", "分工不是配對題。位置已由工作決定；你只要確認每筆紀錄都能問回負責的人。"],
      v2: ["重新解纜，這次補齊紀錄", "同一種操作階段自動做三回；落點必須和當趟船速、放手方式一起留下。"],
      v3: ["只改一件事：等船走穩", "分工與釋放不變，只把船況改成近似穩速，再做三回。"],
      wind: ["相反航向，各做三回", "當趟岸標證明船近似穩速；比較風向分量換邊後，落點是否跟著一致換邊。"],
      cabin: ["兩筆未知船況", "維達爾船長秘密選停泊或近似穩速；你只能讀艙內的水面與落球。"],
      v4: ["先看封存預測，再收槳", "減速三回會保留原預測；最後由你把三種船況寫成一條可檢查的指紋。"],
      dual: ["同一事件，兩張紙", "先同時記錄，再逐拍扣掉桅杆當時的位置；這不是把整張紙平移。"],
      public: ["用昨天的標準公開重做", "標準先鎖住，結果後揭曉；最後只讓告示寫到證據真正支持的地方。"]
    };
    return missions[preset] || (v.phase === "case-dual" ? missions.dual : missions.public);
  }
  function ship3CaseVisual(parent, v, lab) {
    var cf = lab.caseFile || {}, preset = v.preset || (v.phase === "case-dual" ? "dual" : "public");
    var fig = ship3El("figure", null, parent, "shipDiagram shipCaseDiagram");
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 640 390");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "第三章航次卷宗視覺");
    fig.appendChild(svg);
    function draw(tag, attrs, text) {
      var n = document.createElementNS("http://www.w3.org/2000/svg", tag);
      Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
      if (text != null) n.textContent = text;
      svg.appendChild(n); return n;
    }
    draw("rect", { x:0, y:0, width:640, height:390, class:"shipCaseBg" });
    if (preset === "crew") {
      draw("text", { x:320, y:45, "text-anchor":"middle", class:"shipCaseTitle" }, "每個人只站一個位置");
      var roles = [
        [150,105,"桅頂","馬蒂厄｜抽門閂"], [490,105,"岸上","艾蒂安｜記岸標"],
        [115,250,"鼓旁","水手｜維持等節拍"], [525,250,"船上","伽桑狄｜落點與風向"],
        [320,315,"舵邊","維達爾船長｜只控船況"]
      ];
      roles.forEach(function (r) {
        draw("line", { x1:320,y1:190,x2:r[0],y2:r[1],class:"shipCaseLink" });
        draw("circle", { cx:r[0],cy:r[1],r:42,class:"shipCaseRole" });
        draw("text", { x:r[0],y:r[1]-4,"text-anchor":"middle",class:"shipCaseRolePlace" }, r[2]);
        draw("text", { x:r[0],y:r[1]+17,"text-anchor":"middle",class:"shipCaseRoleName" }, r[3]);
      });
      draw("circle", { cx:320,cy:190,r:48,class:"shipCaseRole center" });
      draw("text", { x:320,y:186,"text-anchor":"middle",class:"shipCaseRolePlace" }, "同一趟");
      draw("text", { x:320,y:207,"text-anchor":"middle",class:"shipCaseRoleName" }, "可逐筆追問");
    } else if (preset === "cabin") {
      draw("text", { x:320,y:42,"text-anchor":"middle",class:"shipCaseTitle" }, "維達爾船長不公開 A、B 的船況");
      [0,1].forEach(function (i) {
        var x = 45 + i * 305, trace = cf.voyages && cf.voyages.cabin && cf.voyages.cabin.traces[i];
        draw("rect", { x:x,y:72,width:250,height:245,rx:12,class:"shipCasePaper" });
        draw("text", { x:x+22,y:106,class:"shipCasePaperTitle" }, "未知紀錄 " + (i ? "B" : "A"));
        draw("path", { d:"M"+(x+35)+" 175 Q"+(x+125)+" 170 "+(x+215)+" 175",class:"shipCaseWater" });
        draw("circle", { cx:x+125,cy:145,r:12,class:"shipCaseStone" });
        draw("line", { x1:x+125,y1:145,x2:x+125,y2:247,class:"shipCaseDrop" });
        draw("circle", { cx:x+125,cy:252,r:10,class:"shipCaseLanding" });
        draw("text", { x:x+125,y:290,"text-anchor":"middle",class:"shipCaseNote" },
          trace ? "水面平｜球落在手下" : "尚未觀察");
      });
    } else if (preset === "dual") {
      var p = typeof cf.transformProgress === "number" ? cf.transformProgress : 0;
      draw("text", { x:22,y:30,class:"shipCasePaperTitle" }, "上｜岸上紀錄：碼頭固定");
      draw("rect", { x:24,y:42,width:592,height:135,rx:9,class:"shipCasePaper shore" });
      draw("text", { x:22,y:214,class:"shipCasePaperTitle" }, "下｜把尺逐拍換成相對桅杆");
      draw("rect", { x:24,y:226,width:592,height:135,rx:9,class:"shipCasePaper ship" });
      var beats = [0,1,2,3], ys = [0,1,4,9];
      var topPts = [], bottomPts = [];
      beats.forEach(function (beat, i) {
        var tx = 105 + i*125, ty = 65 + ys[i]*9.5;
        var bx = 105 + (i - p*i)*125, by = 249 + ys[i]*9.5;
        topPts.push([tx,ty]); bottomPts.push([bx,by]);
        draw("line", { x1:tx,y1:54,x2:tx,y2:160,class:"shipCaseBeatLine" });
        draw("circle", { cx:tx,cy:ty,r:9,class:"shipCasePoint shore" });
        var bp = draw("circle", { cx:bx,cy:by,r:9,class:"shipCasePoint ship" });
        bp.dataset.beat = String(i); bp.dataset.y = String(by);
        draw("text", { x:tx,y:165,"text-anchor":"middle",class:"shipCaseBeatText" }, String(beat));
      });
      draw("polyline", { points:topPts.map(function(q){return q.join(",");}).join(" "),class:"shipCasePath shore" });
      var movingPath = draw("polyline", { points:bottomPts.map(function(q){return q.join(",");}).join(" "),class:"shipCasePath ship" });
      movingPath.setAttribute("id", "shipCaseMovingPath");
      draw("text", { x:600,y:214,"text-anchor":"end",class:"shipCaseFormula" }, "x石 − x桅杆（每一拍）");
    } else if (preset === "wind") {
      draw("text", { x:320,y:40,"text-anchor":"middle",class:"shipCaseTitle" }, "相反航向，各三回");
      [["去程","風從船尾方向來"],["回程","風從船頭方向來"]].forEach(function (row,i) {
        var y=82+i*145;
        draw("rect",{x:42,y:y,width:556,height:112,rx:10,class:"shipCasePaper"});
        draw("text",{x:66,y:y+32,class:"shipCasePaperTitle"},row[0]+"｜"+row[1]);
        draw("line",{x1:96,y1:y+77,x2:544,y2:y+77,class:"shipCaseDeck"});
        [285,320,353].forEach(function(x){draw("circle",{cx:x,cy:y+77,r:10,class:"shipCaseLanding"});});
        draw("text",{x:530,y:y+32,"text-anchor":"end",class:"shipCaseNote"},cf.voyages&&cf.voyages.wind?"三回｜桅腳附近":"尚未執行");
      });
    } else {
      var rec = cf.voyages && cf.voyages[preset];
      draw("text", { x:320,y:42,"text-anchor":"middle",class:"shipCaseTitle" },
        preset === "public" ? "公開複驗｜落點先遮住" : "桅頂落石｜每筆都帶著當趟船況");
      draw("line", { x1:52,y1:315,x2:588,y2:315,class:"shipCaseDeck" });
      draw("path", { d:"M160 315 L205 255 L445 255 L500 315 Z",class:"shipCaseHull" });
      draw("line", { x1:330,y1:255,x2:330,y2:78,class:"shipCaseMast" });
      draw("circle", { cx:330,cy:80,r:12,class:"shipCaseStone" });
      draw("path", { d:"M330 92 Q330 190 330 300",class:"shipCaseDrop" });
      var landing = rec && rec.landing || "foot";
      var lx = landing === "aft" ? 272 : (landing === "fore" ? 388 : 330);
      if (rec) [-16,0,16].slice(0,rec.repeats === 1 ? 1 : 3).forEach(function(dx) {
        draw("circle",{cx:lx+dx,cy:304,r:10,class:"shipCaseLanding"});
      });
      if (!rec) draw("text",{x:330,y:188,"text-anchor":"middle",class:"shipCaseQuestion"},"?");
      if (rec && rec.shoreGaps) {
        rec.shoreGaps.forEach(function(g,i) {
          draw("rect",{x:74+i*52,y:282-g*28,width:30,height:g*28,class:"shipCaseGap "+rec.vessel});
        });
        draw("text",{x:74,y:345,class:"shipCaseNote"},"岸標間距");
      }
      if (preset === "public" && !rec) draw("rect",{x:246,y:282,width:170,height:38,rx:5,class:"shipCaseCover"});
    }
    var cap = ship3El("figcaption", "", fig);
    cap.textContent = ({
      v1:"只補一項，缺口會留在紙上；這不是失敗，而是下一趟的設計依據。",
      crew:"分工由位置與任務決定，不需要猜誰適合哪一欄。",
      v2:"岸標間距逐段拉開，落點同時偏後：這一趟屬於加速中的船。",
      v3:"岸標間距近似相等，三個落點都在桅腳附近。",
      wind:"風的前後分量換邊；落點沒有跟著形成同方向的系統變化。",
      cabin:"兩筆局部痕跡相同；『分不出來』也是一項可寫下的結果。",
      v4:"岸標間距逐段縮短，三個落點偏向船頭。",
      dual:"上、下是同一事件。滑桿只改量位置的起點，垂直落下量不變。",
      public:"昨天的門檻先鎖住；今天的三回不能因落點漂亮才被收下。"
    })[preset] || "";
    return fig;
  }
  function renderShipCase(v, box) {
    var ek = v.scene + "/" + v.nodeId;
    if (ek !== ship3EmbedKey) {
      ship3EmbedKey = ek; ship3Msg = "";
      ship3TransformDraft = state.lab && state.lab.caseFile ? state.lab.caseFile.transformProgress || 0 : 0;
    }
    var lab = state.lab, cf = lab.caseFile || {}, voyages = cf.voyages || {};
    var mission = ship3CaseMission(v), preset = v.preset || (v.phase === "case-dual" ? "dual" : "public");
    box.className = "shipLab shipCaseLab";
    var head = ship3El("header", null, box, "shipHead");
    ship3El("small", "第三章・航次卷宗", head);
    ship3El("h2", mission[0], head);
    ship3El("p", mission[1], head);
    var chips = ship3El("div", null, head, "shipEvidenceChips shipDossierChips");
    [
      ["舊紙",true],["船況",!!voyages.v3],["風／艙",!!lab.evidence.g2],
      ["三態",!!lab.evidence.g3],["兩張紙",!!lab.evidence.g4],["公開",!!lab.evidence.g5]
    ].forEach(function (item) { ship3El("span",(item[1]?"✓ ":"○ ")+item[0],chips,item[1]?"got":""); });
    var body = ship3El("div", null, box, "shipBody");
    var visual = ship3El("section", null, body, "shipVisual");
    ship3CaseVisual(visual, v, lab);
    var work = ship3El("section", null, body, "shipWork shipCaseWork");
    function result(text, speaker) {
      var card = ship3El("div", null, work, "shipCaseResult");
      if (speaker) ship3El("b", speaker, card);
      ship3El("p", text, card);
      return card;
    }
    if (preset === "v1") {
      var focus = state.flags.firstControl || cf.firstControl;
      var focusText = {
        release:"門閂放手已就位；船速與重複仍未測。",
        speed:"岸標記船速已就位；放手與重複仍未控制。",
        wind:"放手時的相對風向已記；船速與重複仍未測。"
      }[focus] || "先回到對話選擇要補的控制。";
      ship3El("p","本趟設計｜"+focusText,work,"shipNote shipStepPrompt");
      if (!voyages.v1) ship3Btn(work,"執行這趟試航",function(){
        doShip("runCaseVoyage",{stage:"v1",focus:focus},"✓ 一筆不完整、但可診斷的紀錄已留下。");
      },"shipAction primary");
      else result({
        release:"門閂是你們的人抽的，這點我不吵。可我還是不知道那時船走多快。",
        speed:"間距拉開了，所以這一段船在變快。可放手的是我的水手，你怎麼知道他沒多推一下？",
        wind:"風你記了。可你連船那時走多快都沒有。"
      }[voyages.v1.focus],"維達爾船長");
    } else if (preset === "crew") {
      ship3El("p","馬蒂厄抽門閂｜水手敲等節拍鼓｜艾蒂安守岸標｜伽桑狄記船上落點與放手時風向｜維達爾船長只控船況",work,"shipNote shipStepPrompt");
      if (!cf.crewConfirmed) ship3Btn(work,"確認這份分工",function(){
        doShip("confirmCaseCrew",{},"✓ 五個位置已固定；沒有人同時站兩處。");
      },"shipAction primary");
      else result("誰做了什麼、在哪一拍做，都能沿紙問回去。","卷宗");
    } else if (preset === "v2" || preset === "v3") {
      if (!voyages[preset]) ship3Btn(work,preset==="v2"?"重新解纜，自動做三回":"等船走穩，自動做三回",function(){
        doShip("runCaseVoyage",{stage:preset},"✓ 三回都已留下當趟船況與落點。");
      },"shipAction primary");
      else if (preset === "v2") {
        result("三段間距，一段比一段長。","艾蒂安");
        result("落後重現了。但這一回，船也確實還在變快。等它走穩了，再看一次。","維達爾船長");
      } else {
        result("三段間距，幾乎一樣長。","艾蒂安");
        result("……三回都在桅腳附近。","維達爾船長");
      }
    } else if (preset === "wind") {
      if (!voyages.wind) ship3Btn(work,"去程、回程，各自動做三回",function(){
        doShip("runCaseVoyage",{stage:"wind"},"✓ 六筆都帶著當趟岸標與放手時的相對風向。");
      },"shipAction primary");
      else {
        result("去程時，風從船尾方向來；回程時，風從船頭方向來。兩個方向各做三回，落點都還在桅腳附近。","伽桑狄");
        if (!cf.windJudgment) {
          ship3El("p","看完這六筆，你能寫下哪一句？",work,"shipNote shipStepPrompt");
          ship3Btn(work,"風向改變，落點沒有形成一致變化",function(){
            doShip("interpretCaseWind",{choice:"wind-not-systematic"},"✓ 判讀封存：本次未見風造成主要系統偏移。");
          },"shipAction primary");
          ship3Btn(work,"所以風完全沒有影響",function(){
            doShip("interpretCaseWind",{choice:"wind-does-not-exist"},null,"這句超過資料：只能說本次精度與散布內未見一致偏移。");
          },"shipAction danger");
        } else result("在今天的精度與散布裡，沒有看到風造成一致的偏移；不是說風不存在。","卷宗邊界");
      }
    } else if (preset === "cabin") {
      if (!voyages.cabin) ship3Btn(work,"請維達爾船長秘密安排兩筆船況",function(){
        doShip("runCaseVoyage",{stage:"cabin"},"✓ A、B 兩筆局部痕跡已留下；真實船況仍遮住。");
      },"shipAction primary");
      else {
        result("第一筆：水面是平的，球落在手下。第二筆……一樣。","旅人（你）");
        if (!cf.cabinJudgment) {
          ship3El("p","只憑這碗水與這顆球，能判哪一筆停泊嗎？",work,"shipNote shipStepPrompt");
          [["a-dock","A 停泊，B 在走"],["b-dock","B 停泊，A 在走"],["indistinguishable","無法可靠分辨"]].forEach(function(o){
            ship3Btn(work,o[1],function(){doShip("judgeCaseCabin",{choice:o[0]},
              o[0]==="indistinguishable"?"✓ 『分不出來』已寫進卷宗。":null);
            },"shipAction"+(o[0]==="indistinguishable"?" primary":""));
          });
        } else result("只憑這組局部普通機械觀察，分不出停泊和近似穩速。","卷宗邊界");
      }
    } else if (preset === "v4") {
      var pred = state.flags.decelPrediction || cf.decelPrediction;
      ship3El("p","封存預測｜"+({fore:"偏向船頭",aft:"偏向船尾",foot:"仍在桅腳"}[pred]||"尚未留下"),work,"shipNote shipStepPrompt");
      if (!voyages.v4) ship3Btn(work,"收槳減速，自動做三回",function(){
        doShip("runCaseVoyage",{stage:"v4",prediction:pred},"✓ 減速三回完成；原預測保留在結果旁。");
      },"shipAction primary",!pred);
      else {
        result("間距一段比一段短。落點偏前，三回都偏前。","艾蒂安／伽桑狄");
        if (pred === "fore") result("往前了。石頭沒有慢下來，是船慢下來了。你封的那一句，和紙上一樣。","維達爾船長／伽桑狄");
        else result(pred === "aft"
          ? "你封的是偏後，紙上是偏前。先別改主張：剛才是什麼在變慢？"
          : "桅腳是走穩那組的樣子。這一趟，船在變慢；再看一次間距。","伽桑狄");
        if (!cf.fingerprintComplete) {
          ship3El("p","把三張紙排成一條船況指紋。",work,"shipNote shipStepPrompt");
          [
            ["accel-aft-steady-foot-decel-fore","加速偏後／穩速桅腳／減速偏前"],
            ["moving-always-aft","只要船往前，就一律偏後"],
            ["wind-decides-all","落點方向完全由風決定"]
          ].forEach(function(o){ship3Btn(work,o[1],function(){
            doShip("assertCaseFingerprint",{choice:o[0]},o[0].indexOf("accel-")===0?"◆ 三態指紋成立；舊紙只標成『與加速同型』。":null);
          },"shipAction"+(o[0].indexOf("accel-")===0?" primary":""));});
        }
      }
    } else if (preset === "dual") {
      if (!voyages.dual) ship3Btn(work,"同時取得岸上紙與船上紙",function(){
        doShip("runCaseVoyage",{stage:"dual"},"✓ 同一組鼓點已寫在兩張紙上。");
      },"shipAction primary");
      else {
        result("我的石頭一邊往前，一邊往下。","艾蒂安");
        result("我從桅杆量，它幾乎直直落下。","伽桑狄");
        if (cf.transformProgress < 0.999) {
          var label=ship3El("label","尺跟著桅杆走｜0%",work,"shipCaseSliderLabel");
          var slider=document.createElement("input");
          slider.type="range"; slider.min="0"; slider.max="100"; slider.value=String(Math.round(ship3TransformDraft*100));
          slider.className="shipCaseSlider"; work.appendChild(slider);
          slider.oninput=function(){
            var p=Number(slider.value)/100; ship3TransformDraft=p; label.textContent="尺跟著桅杆走｜"+Math.round(p*100)+"%";
            var pts=[], nodes=visual.querySelectorAll(".shipCasePoint.ship");
            nodes.forEach(function(n){
              var beat=Number(n.dataset.beat), x=105+(beat-p*beat)*125, y=Number(n.dataset.y);
              n.setAttribute("cx",String(x)); pts.push(x+","+y);
            });
            var path=visual.querySelector("#shipCaseMovingPath"); if(path)path.setAttribute("points",pts.join(" "));
          };
          slider.onchange=function(){doShip("setCaseTransform",{progress:Number(slider.value)/100},
            Number(slider.value)>=100?"✓ 每一拍都扣掉桅杆當時的位置。":"尺還沒有完全跟上桅杆。");};
        } else if (!cf.dualNamed) {
          ship3El("p","兩張紙為什麼能同時成立？",work,"shipNote shipStepPrompt");
          [
            ["same-event-different-reference","同一事件，量位置的參考物不同"],
            ["shore-paper-false","岸上那張紙畫錯了"],
            ["ship-paper-false","船上那張紙畫錯了"]
          ].forEach(function(o){ship3Btn(work,o[1],function(){
            doShip("assertCaseDual",{choice:o[0]},o[0]==="same-event-different-reference"?"◆ 兩張紙相認：換的是參考物，不是事件。":null);
          },"shipAction"+(o[0]==="same-event-different-reference"?" primary":""));});
        } else result("兩張紙記同一事件；差別只在各自把什麼當作不動。","卷宗");
      }
    } else if (preset === "public") {
      ship3El("div","採信標準｜連續三段岸標近似等距｜門閂放手｜岸上與船上同拍記錄｜同一做法三回",work,"shipCaseCriteria");
      if (!cf.publicCriteriaConfirmed) ship3Btn(work,"沿用昨天的門檻，不加不減",function(){
        doShip("confirmCaseCriteria",{},"✓ 標準已在揭曉前封存。");
      },"shipAction primary");
      else if (!voyages.public) ship3Btn(work,"公開重做三回，再揭開落點",function(){
        doShip("runCaseVoyage",{stage:"public"},"✓ 三回都照標準收下；漂亮不漂亮，都收。");
      },"shipAction primary");
      else if (!cf.boundary) {
        result("三回都照收。漂亮不漂亮，都收。","維達爾船長");
        var overTried=(cf.boundaryAttempts||[]).some(function(a){return !a.ok;});
        var official=ship3El("div",null,work,"shipCaseOfficial "+(overTried?"ink":""));
        ship3El("b",overTried?"墨已落下":"官員的告示草稿",official);
        ship3El("p",overTried?"「馬賽港，落石實驗，證——」":"「馬賽港，落石實驗，證明地球運動。」",official);
        if(overTried)ship3El("small","伽桑狄按住紙面；這次越界沒有被擦掉。",official);
        ship3Btn(work,"照原句印：證明地球運動",function(){
          doShip("setCaseBoundary",{choice:"overclaim"},null,
            "伽桑狄：（手掌壓上紙面，墨在掌下暈開）「……停。」船沒有直接量到地球運動。");
        },"shipAction danger");
        ship3Btn(work,"改成：排除『船動，落石必落後』這個反對",function(){
          doShip("setCaseBoundary",{choice:"honest"},"◆ 告示收住了；維達爾船長願意在這句下面簽名。");
        },"shipAction primary");
      }
    }
    var msg=ship3El("p",ship3Msg||"每一步都會留在同一份卷宗；錯誤判讀可以重試，但不會被擦掉。",work,"shipMessage");
    msg.setAttribute("role","status");
    if (N.embedReady(state)) ship3Btn(work,"▶ 收好這一頁，回到故事",function(){
      var r=N.embedComplete(state);
      if(r.error){ship3Msg="✕ "+r.error;renderAll();return;}
      setState(r.state);ship3Msg="";renderAll();
    },"shipGate primary");
  }
  function ship3DossierVisual(parent, lab, d) {
    if (d.page === "debate" && d.debate.current === "p3" && d.records.some(function (r) { return r.dualPapers; })) {
      ship3CaseVisual(parent, { preset: "dual" }, lab);
      return;
    }
    var card = ship3El("figure", null, parent, "shipDossierVisual");
    if (ship3DossierTab === "cabin") {
      ship3El("div", "封閉船艙・停泊與平駛對照", card, "shipDossierVisualTitle");
      var pair = ship3El("div", null, card, "shipBlindPair");
      [
        ["停泊對照", "岸標位置：0、0、0 格", "水面不偏；落球正下方 3／3"],
        ["出港平駛對照", "相鄰兩拍的船位差：1.5、1.5、1.5 格", "水面不偏；落球正下方 3／3"]
      ].forEach(function (row) {
        var paper = ship3El("div", null, pair, "shipBlindPaper " + (d.blind.ran ? "open" : "sealed"));
        ship3El("b", row[0], paper);
        ship3El("span", d.blind.ran ? row[2] : "尚未執行", paper);
        ship3El("small", d.blind.ran ? row[1] : "岸上與艙內都還沒有紀錄", paper);
      });
      ship3El("figcaption", d.blind.ran
        ? "岸紙確認其中三回是平駛。關上艙門只隔開甲板風，艙裡仍有空氣。"
        : "艾蒂安在岸上逐回記船位；伽桑狄在艙內把停泊三回、平駛三回的水面與落球分別記下。", card);
      return;
    }
    if (d.page === "debate") {
      ship3El("div", "馬賽碼頭・公開辯論", card, "shipDossierVisualTitle");
      var pillars = ship3El("div", null, card, "shipDossierPillars");
      SHIP3_DOSSIER_PILLARS.forEach(function (pillar) {
        var p = ship3El("div", null, pillars, "shipDossierPillar " +
          (d.debate.pillars[pillar.id] ? "done" : (d.debate.current === pillar.id ? "active" : "")));
        ship3El("span", d.debate.pillars[pillar.id] ? "✓" : "○", p);
        ship3El("b", pillar.title, p);
      });
      ship3El("blockquote", d.debate.lastReply || "維達爾船長等著你把卷宗攤開。", card, "shipDossierOpponent");
      ship3El("figcaption", "這輪就算沒說服他們，原紙也不會消失；沒答完的問題會帶回船上。", card);
      return;
    }
    var stageLabels = { dock: "停泊", steady: "出港平駛", depart: "解纜起步", brake: "收槳" };
    ship3El("div", "桅杆落石・" + stageLabels[d.draft.stage], card, "shipDossierVisualTitle");
    var sketch = ship3El("div", null, card, "shipDossierSketch");
    ship3El("div", "●", sketch, "shipDossierStone");
    ship3El("div", "", sketch, "shipDossierMast");
    ship3El("div", "船", sketch, "shipDossierHull");
    var canSeeShoreSpeed = d.draft.speedRecord === "beats" &&
      (d.draft.positionRecord === "shore" || d.draft.positionRecord === "dual");
    ship3El("div", canSeeShoreSpeed ? "岸上：等拍記船位" :
      (d.draft.speedRecord === "beats" ? "只有船上紙：看不到岸上船位" : "岸上：未記船速"),
      sketch, "shipDossierShore");
    var latest = d.records[d.records.length - 1];
    if (latest) {
      ship3El("div", "最近一筆｜" + ship3DossierClassification(latest) + "｜" +
        (latest.landing === "aft" ? "偏桅後" : latest.landing === "fore" ? "偏桅前" :
          latest.landing === "spread" ? "落點散開" : "桅腳附近"), card, "shipDossierLatest");
    }
    ship3El("figcaption", "「解纜起步」和「收槳」只寫船員做了什麼；船速是否改變，要看岸紙上的船位。", card);
  }
  function ship3DossierCabinInstrument(d) {
    return d && d.designCommitments && d.designCommitments.cabinInstrument || "combined";
  }
  function ship3DossierCabinObservation(d) {
    var instrument = ship3DossierCabinInstrument(d);
    if (instrument === "drip") return "水滴都落在碗內標記附近";
    if (instrument === "toss") return "石球直上拋起後都落回手邊附近";
    return "水面與落球結果仍很接近";
  }
  function ship3DossierScopeOptions(assertionId, d) {
    return {
      S1: [
        ["all-hand-aft", "這組徒手紀錄多半偏後，所以徒手放石頭會造成後偏"],
        ["sample-only", "這組徒手紀錄散得很開，方向也隨手勢改變；不能拿來判斷乾淨落點"],
        ["latch-solves-all", "門閂那組比較集中，所以改用門閂後，其他條件可以不記"]
      ],
      A1: [
        ["all-moving", "這三回都在桅腳附近，所以船只要往前，落點就會一樣"],
        ["controlled-three", "這次用同一顆石頭、同一高度與門閂放手；岸紙確認船走穩，三回都在桅腳附近"],
        ["earth-moves", "這三回都在桅腳附近，所以塔頂落石的反對已經被推翻"]
      ],
      A2: [
        ["all-motion-hidden", "停泊和平駛在艙內看起來相同，所以封閉船艙裡連加速、減速也都分不出來"],
        ["local-only", "這六回都在封閉船艙裡做；停泊三回與平駛三回，" +
          ship3DossierCabinObservation(d)],
        ["wind-never-matters", "兩趟結果很接近，所以甲板那一趟的風也沒有影響"]
      ],
      A3: [
        ["old-was-accelerating", "舊紙也偏後，和今天的起步紙很像，所以舊航次也在變快"],
        ["today-comparison", "今天船變快時偏後、走穩時接近桅腳；一次後偏不能代表所有前進船況"],
        ["aft-reveals-all", "今天船變快時偏後，所以看到後偏就能判斷船正在變快"]
      ],
      S4: [
        ["infer-old", "今天三種船況留下後、中、前三種樣子，所以舊航次可以直接歸進其中一種"],
        ["today-three-states", "今天三組只改船的狀態，落點分別偏後、接近桅腳與偏前"],
        ["universal-three-dots", "今天三組排成後、中、前，所以別的風浪也會排成同樣順序"]
      ]
    }[assertionId] || [];
  }
  function ship3DossierAssertionText(id, dossier) {
    var activeDossier = dossier || (state && state.lab && state.lab.caseFile &&
      state.lab.caseFile.dossier) || null;
    return {
      A1: "在這組條件下，船走穩時，石頭三次都落在桅腳附近",
      A2: "隔開甲板風後，停泊和平駛各做三回，" +
        ship3DossierCabinObservation(activeDossier),
      A3: "船走穩時落在桅腳附近；解纜起步時偏後，不能把兩種船況混在一起",
      A6: "舊紙確實記到後偏，但沒記船速，只能標成「船況不明」",
      S1: "徒手放石頭時，手勢會讓落點散開",
      S4: "今天三種船況分別留下偏後、接近桅腳與偏前的落點",
      A4: "同號鼓點把兩張紙對到同一時刻",
      A5: "把每一拍都改成從桅杆量，岸紙上的路徑就會和船紙相符"
    }[id] || id;
  }
  function ship3DossierHasVisibleShore(record) {
    if (!record || record.speedRecord !== "beats") return false;
    var papers = record.papers || {};
    return !!papers.shore ||
      (!Object.keys(papers).length &&
        (record.positionRecord === "shore" || record.positionRecord === "dual"));
  }
  function ship3DossierClassification(record) {
    if (!record) return "船況未分類";
    if (record.speedRecord === "beats" && !ship3DossierHasVisibleShore(record))
      return "有等拍鼓點・缺岸上船位・未分類";
    return record.classification || "船況未分類";
  }
  function ship3DossierSourceRows(d) {
    var rows = [{
      id: "OLD", title: "維達爾船長的舊紙",
      detail: "解纜後第一段｜落在桅後｜船速欄空白"
    }];
    (d.records || []).forEach(function (r) {
      var paperNames = [];
      if (r.papers && r.papers.shore) paperNames.push("岸紙");
      if (r.papers && r.papers.ship) paperNames.push("船紙");
      if (!paperNames.length)
        paperNames.push(r.positionRecord === "dual" ? "岸紙＋船紙" : (r.positionRecord === "shore" ? "岸紙" : "船紙"));
      rows.push({
        id: "R" + r.id,
        title: "原紙 R" + r.id + "｜" +
          ({ dock:"停泊", steady:"出港平駛", depart:"解纜起步", brake:"收槳" }[r.stage] || r.stage),
        detail: ({ hand:"徒手", string:"剪繩", latch:"門閂" }[r.release] || r.release) +
          "｜" + paperNames.join("＋") + "｜" + ship3DossierClassification(r) + "｜" +
          (r.landing === "aft" ? "桅後" : r.landing === "fore" ? "桅前" :
            r.landing === "spread" ? "落點散開" : "桅腳附近")
      });
    });
    if (d.blind && d.blind.ran) {
      (d.blind.records || []).forEach(function (row) {
        var cabinResult = row.instrument === "drip" ? row.water :
          (row.instrument === "toss" ? row.ball : row.water + "｜" + row.ball);
        rows.push({
          id: row.id,
          title: "船艙原紙 " + row.id + "｜" + row.stageLabel,
          detail: row.classification + "｜" + cabinResult
        });
      });
    }
    return rows;
  }
  function ship3DossierRecordFingerprint(row) {
    return [
      row.stage, row.vesselId || "captain", row.release, row.speedRecord,
      row.positionRecord, row.speedBand || "mid", row.forceBand || "hard",
      row.beatBand || "mid", row.sameStone !== false, row.sameHeight !== false
    ].join("|");
  }
  function ship3DossierSourceGroups(d) {
    var groups = [{
      id: "old", sourceIds: ["OLD"], title: "舊紙｜八年前的一次後偏",
      detail: "船速與觀察位置未記；只能保留為「船況不明」",
      raw: ["OLD｜解纜後第一段｜落在桅後"]
    }];
    var current = null;
    (d.records || []).forEach(function (row) {
      var fingerprint = ship3DossierRecordFingerprint(row);
      var dual = !!row.dualPapers;
      if (!current || current.fingerprint !== fingerprint ||
          current.sourceIds.length >= 3 || current.dual || dual) {
        current = {
          id: "deck-" + row.id, fingerprint: fingerprint, dual: dual,
          sourceIds: [], records: [], raw: []
        };
        groups.push(current);
      }
      current.sourceIds.push("R" + row.id);
      current.records.push(row);
      current.raw.push(
        "R" + row.id + "｜" + ship3DossierClassification(row) + "｜" +
        (row.landing === "aft" ? "桅後" : row.landing === "fore" ? "桅前" :
          row.landing === "spread" ? "落點散開" : "桅腳附近")
      );
      var stageLabel = {
        dock:"停泊", steady:"出港平駛", depart:"解纜起步", brake:"收槳"
      }[row.stage] || row.stage;
      current.title = (dual ? "同步雙紙" : "資料組") + "｜" + stageLabel + "｜" +
        current.sourceIds.join("、");
      current.detail = (
        { hand:"徒手", string:"剪繩", latch:"門閂" }[row.release] || row.release
      ) + "｜" + (row.positionRecord === "dual" ? "岸紙＋船紙" :
        (row.positionRecord === "shore" ? "岸紙" : "船紙")) +
        "｜" + ship3DossierClassification(row);
    });
    var cabinGroups = {};
    (d.blind && d.blind.records || []).forEach(function (row) {
      var stage = row.stage === "dock" ? "dock" : "steady";
      var instrument = row.instrument || "combined";
      var groupKey = stage + "-" + instrument;
      var index = cabinGroups[groupKey] || 0;
      var batch = Math.floor(index / 3);
      cabinGroups[groupKey] = index + 1;
      var key = "cabin-" + stage + "-" + instrument + "-" + batch;
      var group = groups.find(function (item) { return item.id === key; });
      if (!group) {
        group = {
          id: key, sourceIds: [], records: [], raw: [],
          title: "船艙資料組｜" + (stage === "dock" ? "繫纜停泊" : "出港平駛"),
          detail: row.classification + "｜" +
            (instrument === "drip" ? "吊壺滴水" :
              (instrument === "toss" ? "直拋石球" : "既有雙項對照"))
        };
        groups.push(group);
      }
      group.sourceIds.push(row.id);
      group.records.push(row);
      group.raw.push(row.id + "｜" + (instrument === "drip" ? row.water :
        (instrument === "toss" ? row.ball : row.water + "｜" + row.ball)));
      group.title = "船艙資料組｜" + (stage === "dock" ? "繫纜停泊" : "出港平駛") +
        "｜" + group.sourceIds.join("、");
    });
    return groups;
  }
  document.addEventListener("bd:notebook-snapshot", function (ev) {
    if (CHAPTER_ID !== "ch3" || !state || !ev.detail || !ev.detail.target) return;
    var d = state.lab && state.lab.caseFile && state.lab.caseFile.dossier;
    if (!d) return;
    var target = ev.detail.target;
    target.innerHTML = "";
    ev.detail.handled = true;
    ship3El("p", "第三章實驗資料組", target, "shipNotebookSnapshotTitle");
    var groups = ship3DossierSourceGroups(d).filter(function (group) {
      return group.sourceIds[0] !== "OLD";
    });
    if (!groups.length) {
      ship3El("p", "尚無實驗紀錄。", target, "hint");
      return;
    }
    groups.forEach(function (group) {
      var card = ship3El("section", null, target, "shipNotebookSnapshotGroup");
      ship3El("b", group.title, card);
      ship3El("p", group.detail, card);
      var raw = ship3El("details", null, card);
      ship3El("summary", "查看原始紀錄", raw);
      var list = ship3El("ul", null, raw);
      group.raw.forEach(function (line) { ship3El("li", line, list); });
      var replayIds = group.sourceIds.filter(function (id) { return /^[RC]\d+$/.test(id); });
      if (replayIds.length) {
        var replay = ship3Btn(card, "重播這組既有紀錄", function () {
          ship3LastSeriesIds = replayIds.slice();
          ship3ReplayRecordId = replayIds[0];
          ship3ReplayNotice = true;
          document.dispatchEvent(new CustomEvent("bd:notebook-close"));
          renderAll();
          ship3ScrollToReplayAnimation();
        }, "shipAction shipNotebookReplay");
        replay.setAttribute("aria-label", "重播" + group.title + "，不新增實驗");
      }
    });
    var assertionIds = ["A1", "A3", "A2", "S1", "S4"].filter(function (id) {
      return d.assertions && d.assertions[id];
    });
    if (assertionIds.length) {
      var claims = ship3El("section", null, target, "shipNotebookSnapshotClaims");
      ship3El("b", "已成立斷言", claims);
      var claimList = ship3El("ul", null, claims);
      assertionIds.forEach(function (id) {
        ship3El("li", ship3DossierAssertionText(id) + "｜引用：" +
          (ship3DossierPacketSourceIds(d, id).join("、") || "尚未綁定"), claimList);
      });
    }
  });
  function ship3DossierCurrentAssertionId(d, missionId) {
    if (missionId === "steady")
      return !d.assertions.A1 && d.candidates && d.candidates.A1 ? "A1" : null;
    if (missionId === "speed")
      return !d.assertions.A3 && d.candidates && d.candidates.A3 ? "A3" : null;
    if (missionId === "cabin")
      return !d.assertions.A2 && d.candidates && d.candidates.A2 ? "A2" : null;
    if (missionId === "explore") {
      if (d.candidates && d.candidates.S1 && !d.assertions.S1) return "S1";
      if (d.candidates && d.candidates.S4 && !d.assertions.S4) return "S4";
    }
    return null;
  }
  function renderShipDossierLedger(work, d, assertionId) {
    var section = ship3El("section", null, work, "shipDossierLedger");
    ship3El("h4", "原紙資料簿", section);
    var proposed = assertionId && d.proposedScopes && d.proposedScopes[assertionId];
    ship3El("p", proposed
      ? "斷言已選好。現在勾能支撐它的資料組；每組仍可展開核對三張原紙，未勾選的紙也會留在卷宗裡。"
      : (assertionId
        ? "先在上方選一句要主張的話，才能開始勾原紙。"
        : "所有原紙都會保留。完成目前的觀察後，這裡會讓你勾選資料組。"),
      section, "shipNote");
    var table = ship3El("table", null, section, "shipTable shipDossierLedgerTable");
    var head = ship3El("thead", null, table);
    var hr = ship3El("tr", null, head);
    ["選", "資料組", "條件、結果與原紙"].forEach(function (label) { ship3El("th", label, hr); });
    var body = ship3El("tbody", null, table);
    var selected = assertionId && d.claimSelections && d.claimSelections[assertionId] || [];
    ship3DossierSourceGroups(d).forEach(function (source) {
      var allSelected = source.sourceIds.every(function (id) { return selected.indexOf(id) >= 0; });
      var someSelected = source.sourceIds.some(function (id) { return selected.indexOf(id) >= 0; });
      var tr = ship3El("tr", null, body, someSelected ? "selected" : "");
      var pick = ship3El("td", null, tr, "shipDossierLedgerPick");
      var checkbox = ship3El("input", null, pick);
      checkbox.type = "checkbox";
      checkbox.checked = allSelected;
      checkbox.indeterminate = someSelected && !allSelected;
      checkbox.disabled = !assertionId || !proposed || !d.candidates || !d.candidates[assertionId];
      checkbox.setAttribute("aria-label", "選取" + source.title);
      checkbox.setAttribute("data-ship-focus", "source-group-" + source.id);
      checkbox.onchange = function () {
        doShip("setDossierSourceGroup", {
          assertionId: assertionId, sourceIds: source.sourceIds, selected: checkbox.checked
        }, checkbox.checked
          ? "已勾選資料組 " + source.sourceIds.join("、") + "。"
          : "已取消資料組 " + source.sourceIds.join("、") + "。");
      };
      ship3El("th", source.title, tr);
      var detailCell = ship3El("td", null, tr);
      ship3El("span", source.detail, detailCell);
      var details = ship3El("details", null, detailCell, "shipDossierRawDetails");
      ship3El("summary", "查看 " + source.sourceIds.length + " 張原紙", details);
      var rawList = ship3El("ul", null, details);
      source.raw.forEach(function (line) { ship3El("li", line, rawList); });
    });
    return section;
  }
  function renderShipDossierCandidates(work, d, missionId) {
    var id = ship3DossierCurrentAssertionId(d, missionId);
    if (!id) return;
    var ready = !!(d.candidates && d.candidates[id]);
    var proposed = d.proposedScopes && d.proposedScopes[id];
    var card = ship3El("section", null, work, "shipCandidateCard");
    ship3El("small", ready ? "第一步｜先選斷言" : "原紙還不夠，斷言暫時不能提交", card);
    ship3El("h4", "把這輪可能的主張攤開", card);
    ship3El("p", "先選一句你打算成立的話。下一步再到原紙資料簿，勾出真正能支撐它的紀錄。",
      card, "shipNote");
    ship3DossierScopeOptions(id, d).forEach(function (option) {
      var button = ship3Btn(card, option[1], function () {
        doShip("setDossierProposedScope", { assertionId: id, choice: option[0] },
          "已選定要主張的句子。接著勾選原紙。", null);
      }, "shipAction" + (proposed === option[0] ? " active" : ""), !ready);
      button.setAttribute("data-ship-focus", "write-assertion-" + id + "-" + option[0]);
    });
    if (proposed)
      ship3El("p", "✓ 斷言已選。請往下勾原紙，再提交。", card,
        "shipDossierHint shipDossierClaimChosen");
  }
  function renderShipDossierClaimSubmit(work, d, missionId) {
    var id = ship3DossierCurrentAssertionId(d, missionId);
    var choice = id && d.proposedScopes && d.proposedScopes[id];
    if (!id || !choice) return;
    var submit = ship3Btn(work, "用所選原紙提交這句斷言", function () {
      doShip("setDossierScope", { assertionId: id, choice: choice },
        "◆ 斷言成立：" + ship3DossierAssertionText(id, d), function (rr) {
          if (id === "A2" && choice === "all-motion-hidden" &&
              rr.reason === "dossier-scope-overread")
            return "這六回只比較「停泊」和「近似平駛」。加速、減速會留下不同結果，所以不能擴大成「所有運動都分不出來」。";
          if (id === "A2" && choice === "wind-never-matters" &&
              rr.reason === "dossier-scope-overread")
            return "這組只隔開甲板風，沒有量甲板那一趟受了多少風，不能替另一個場景下結論。";
          return null;
        });
    }, "shipAction primary");
    submit.setAttribute("data-ship-focus", "submit-assertion-" + id);
  }
  function ship3DossierChoiceRow(work, label, field, values, labels, value, helps) {
    var row = ship3El("div", null, work, "shipDossierSetting shipDossierChoiceSetting");
    var controlId = "ship-dossier-" + field;
    var fieldLabel = ship3El("label", label, row, "shipDossierSettingLabel");
    fieldLabel.setAttribute("for", controlId);
    var selectLabels = {};
    values.forEach(function (rawValue) {
      var optionValue = field === "repeats" ? Number(rawValue) :
        ((field === "sameStone" || field === "sameHeight") ? rawValue === "true" : rawValue);
      selectLabels[String(rawValue)] = labels[rawValue] || labels[optionValue] || String(rawValue);
    });
    var select = ship3Select(row, values.map(String), selectLabels, String(value));
    select.id = controlId;
    select.setAttribute("aria-label", label);
    select.setAttribute("data-ship-focus", "draft-" + field);
    select.onchange = function () {
      var optionValue = field === "repeats" ? Number(select.value) :
        ((field === "sameStone" || field === "sameHeight") ? select.value === "true" : select.value);
      doShip("setDossierDraft", { field: field, value: optionValue },
        "方案已更新。已收卷的原紙不會被改動。");
    };
    var helpKey = String(value);
    if (ship3ExploreMode() && helps && helps[helpKey])
      ship3El("small", helps[helpKey], row, "shipDossierSettingHelp");
    return row;
  }
  function ship3DossierSvg(parent, tag, attrs, text) {
    var node = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.keys(attrs || {}).forEach(function (key) { node.setAttribute(key, attrs[key]); });
    if (text != null) node.textContent = displayText(text);
    parent.appendChild(node);
    return node;
  }
  function ship3DossierVesselSpec(vesselId) {
    return {
      small: { name: "港內小艇", height: 7 },
      captain: { name: "維達爾船長的船", height: 12 },
      large: { name: "隔壁大貨船", height: 18 }
    }[vesselId] || { name: "維達爾船長的船", height: 12 };
  }
  function ship3DossierPaperPlot(parent, paper, title, record) {
    var card = ship3El("figure", null, parent, "shipRawPaper");
    ship3El("b", title, card);
    ship3El("small", paper.observer + "的紀錄｜位置從「" + paper.origin + "」量起", card);
    if (record) {
      var meta = ship3El("dl", null, card, "shipRawPaperMeta");
      var speedLabels = {
        slow: "慢槳", mid: "半槳", fast: "滿槳"
      };
      var forceLabels = record.stage === "brake"
        ? { soft: "輕收槳", hard: "全力收槳" }
        : { soft: "輕加槳", hard: "全力加槳" };
      var stageLabels = {
        dock: "繫纜停泊",
        steady: "出港平駛",
        depart: "解纜起步",
        brake: "收槳滑行"
      };
      var clockText = record.speedRecord === "beats"
        ? "等拍鼓｜" + ({ slow:"慢拍", mid:"中拍", fast:"快拍" }[record.beatBand || "mid"])
        : (record.speedRecord === "verbal" ? "只有舵手口述" : "未記船速");
      var positionText = {
        deck: "船上紙｜從桅腳量",
        shore: "岸上紙｜從碼頭量",
        dual: "岸、船各一張｜共用鼓號"
      }[record.positionRecord] || "未記";
      [
        ["船", record.vesselName || ship3DossierVesselSpec(record.vesselId).name],
        ["桅高", "約 " + (record.mastHeight || ship3DossierVesselSpec(record.vesselId).height) + " 公尺"],
        ["船況", stageLabels[record.stage] || record.stage],
        ["放手前船速", record.stage === "dock" ? "繫纜不動" :
          (speedLabels[record.speedBand || "mid"] || "未記")],
        ["加減槳力", (record.stage === "depart" || record.stage === "brake")
          ? (forceLabels[record.forceBand || "hard"] || "未記")
          : "本趟沒有加槳或收槳"],
        ["放手", (record.releaseOperator || "馬蒂厄") + "｜" +
          ({ hand:"徒手鬆開", string:"剪斷細繩", latch:"抽開門閂" }[record.release] || record.release)],
        ["計時方法", clockText],
        ["位置原紙", positionText],
        ["操船／記錄", (record.rowingCrew || "未記") + "｜" + (record.rowingMethod || "未記")]
      ].forEach(function (row) {
        ship3El("dt", row[0], meta);
        ship3El("dd", row[1], meta);
      });
    }
    var svg = ship3DossierSvg(card, "svg", {
      viewBox: "0 0 540 220", role: "img",
      "aria-label": title + "：觀察者在每一聲鼓響時畫下石頭的位置"
    });
    ship3DossierSvg(svg, "rect", { x: 1, y: 1, width: 538, height: 218, rx: 8, class: "shipPaperSheet" });
    for (var gx = 50; gx < 540; gx += 50)
      ship3DossierSvg(svg, "line", { x1: gx, y1: 12, x2: gx, y2: 208, class: "shipPaperGrid" });
    for (var gy = 28; gy < 220; gy += 36)
      ship3DossierSvg(svg, "line", { x1: 12, y1: gy, x2: 528, y2: gy, class: "shipPaperGrid" });
    var beats = paper.beats || [];
    if (beats.length) {
      var xs = [];
      beats.forEach(function (beat) { xs.push(beat.stoneX, beat.mastX); });
      var minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs);
      /*
       * 原紙上的點保留觀察誤差，但不能把幾公分的讀值抖動自動放大成
       * 橫跨整張紙的「蛇行」。小範圍資料至少用 3 公尺的共同紙尺，
       * 讓點的偏差維持它在真實尺度上的份量。
       */
      if (maxX - minX < 3) {
        var paperCenterX = (minX + maxX) / 2;
        minX = paperCenterX - 1.5;
        maxX = paperCenterX + 1.5;
      }
      var mapX = function (x) { return 52 + (x - minX) / (maxX - minX) * 436; };
      var paperHeight = record && record.mastHeight || 12;
      var mapY = function (y) { return 184 - y / paperHeight * 142; };
      var stonePath = beats.map(function (beat, i) {
        return (i ? "L" : "M") + mapX(beat.stoneX).toFixed(1) + " " + mapY(beat.y).toFixed(1);
      }).join(" ");
      var mastPath = beats.map(function (beat, i) {
        return (i ? "L" : "M") + mapX(beat.mastX).toFixed(1) + " 184";
      }).join(" ");
      ship3DossierSvg(svg, "path", { d: stonePath, class: "shipPaperStonePath" });
      ship3DossierSvg(svg, "path", { d: mastPath, class: "shipPaperMastPath" });
      beats.forEach(function (beat, i) {
        ship3DossierSvg(svg, "circle", {
          cx: mapX(beat.stoneX), cy: mapY(beat.y), r: 6,
          class: "shipPaperBeatDot", style: "animation-delay:" + (i * 0.17) + "s"
        });
        ship3DossierSvg(svg, "text", {
          x: mapX(beat.stoneX) + 9, y: mapY(beat.y) - 7,
          class: "shipPaperBeatLabel"
        }, String(beat.beat));
        ship3DossierSvg(svg, "circle", {
          cx: mapX(beat.mastX), cy: 184, r: 4, class: "shipPaperMastDot"
        });
      });
      ship3DossierSvg(svg, "text", { x: 18, y: 207, class: "shipPaperLegend" },
        "● 石頭　○ 桅杆｜數字是同一聲鼓的編號");
    } else {
      ship3DossierSvg(svg, "text", { x: 270, y: 92, "text-anchor": "middle", class: "shipPaperEmpty" },
        "沒有共用鼓點，只能畫下落點");
      ship3DossierSvg(svg, "text", { x: 270, y: 128, "text-anchor": "middle", class: "shipPaperEmptySmall" },
        "這張紙不能用來逐拍比較兩個位置");
    }
    ship3El("figcaption",
      paper.beats.length
        ? "圓點是當時記下的位置；連線只幫你看先後。這張紙留下 " + paper.beatCount +
          " 個位置點、" + paper.intervalCount + " 段間隔；" + paper.quality + "。"
        : "只留下 " + paper.landings.length + " 回落點；沒有共同的時刻標記。",
      card);
    return card;
  }
  function ship3DossierP3Eligible(record) {
    if (!record) return false;
    if (window.GB && window.GB.Engine3 &&
        typeof window.GB.Engine3.isDossierP3Record === "function")
      return window.GB.Engine3.isDossierP3Record(record);
    return !!(record.filed === true &&
      record.stage === "steady" && record.classification === "近似穩速" &&
      record.release === "latch" && record.speedRecord === "beats" &&
      (record.beatBand || "mid") === "mid" && record.positionRecord === "dual" &&
      record.sameStone !== false && record.sameHeight !== false &&
      record.papers && record.papers.shore && record.papers.ship &&
      record.papers.shore.beats && record.papers.shore.beats.length >= 4);
  }
  function ship3DossierP3Record(d) {
    var p3 = d && d.debate && d.debate.p3 || {};
    var sourceId = p3.sourceRecordId;
    if (typeof sourceId === "string") sourceId = sourceId.replace(/^R/i, "");
    var dualRecords = (d.records || []).filter(function (record) {
      return ship3DossierP3Eligible(record);
    });
    var selected = dualRecords.find(function (record) {
      return sourceId != null && String(record.id) === String(sourceId);
    });
    /*
     * 舊存檔沒有 sourceRecordId。只在第三柱已選定「同趟雙紙」後，
     * 退回最後一筆合格雙紙，避免在玩家挑證據前搶先替他選。
     */
    if (!selected && p3.source === "dual-papers") selected = dualRecords[dualRecords.length - 1];
    if (!selected && d.assertions && (d.assertions.A4 || d.assertions.A5))
      selected = dualRecords[dualRecords.length - 1];
    return selected || null;
  }
  function ship3DossierNumber(value) {
    var n = Number(value);
    if (!isFinite(n)) return "—";
    if (Math.abs(n) < 0.005) n = 0;
    return n.toFixed(2);
  }
  function ship3DossierP3LastAttempt(p3, kind, sourceId) {
    var attempts = p3 && p3.transformAttempts || [];
    for (var i = attempts.length - 1; i >= 0; i -= 1) {
      var attempt = attempts[i];
      if (attempt && attempt.kind === kind && String(attempt.sourceRecordId) === String(sourceId))
        return attempt;
    }
    return null;
  }
  function ship3DossierP3TransformBoard(parent, record, p3) {
    var shoreBeats = record.papers.shore.beats || [];
    var shipBeats = record.papers.ship.beats || [];
    var accepted = p3.transformedPoints || [];
    var lastMethod = ship3DossierP3LastAttempt(p3, "method", record.id);
    var lastBeat = ship3DossierP3LastAttempt(p3, "beat", record.id);
    var activeWrongBeat = lastBeat && !lastBeat.ok && lastBeat.beat === accepted.length ? lastBeat : null;
    var activeWrongMethod = lastMethod && !lastMethod.ok && !p3.transformMode ? lastMethod : null;
    var card = ship3El("section", null, parent, "shipP3TransformBoard");
    ship3El("h5", "逐拍換尺紙", card);
    if (activeWrongMethod) ship3El("p", activeWrongMethod.choice === "translate-once"
      ? "只搬一次：零號鼓點或許碰得上，後面桅杆仍在往前，兩條線會逐拍分開。"
      : "旋轉紙：線看起來換了方向，但碼頭與桅杆兩個位置起點沒有互換。",
      card, "shipNote warning");

    var rows = shoreBeats.map(function (shore, index) {
      var acceptedPoint = accepted[index];
      var wrongPoint = activeWrongBeat && Number(activeWrongBeat.beat) === Number(shore.beat)
        ? activeWrongBeat : null;
      var methodPoint = null;
      if (activeWrongMethod) {
        var once = activeWrongMethod.choice === "translate-once"
          ? Number(shoreBeats[0].mastX) : 0;
        methodPoint = {
          appliedMastX: once,
          shoreRelativeX: Number(shore.stoneX) - once,
          ok: false
        };
      }
      var shown = acceptedPoint || wrongPoint || methodPoint;
      var applied = acceptedPoint ? shore.mastX : (shown ? shown.appliedMastX : null);
      return [
        String(shore.beat), ship3DossierNumber(shore.stoneX),
        applied == null ? "尚未移尺" : "－ " + ship3DossierNumber(applied),
        shown ? ship3DossierNumber(shown.shoreRelativeX) : "—",
        shipBeats[index] ? ship3DossierNumber(shipBeats[index].stoneX) : "—",
        acceptedPoint ? "✓ 已對上" : ((wrongPoint || methodPoint) ? "✕ 未重合" : "等待")
      ];
    });
    ship3Table(card, ["鼓點", "岸紙石頭", "移尺", "換尺後", "船紙", "結果"], rows);

    var previewValues = shoreBeats.map(function (shore, index) {
      if (accepted[index]) return Number(accepted[index].shoreRelativeX);
      if (activeWrongBeat && Number(activeWrongBeat.beat) === Number(shore.beat))
        return Number(activeWrongBeat.shoreRelativeX);
      if (activeWrongMethod) {
        var once = activeWrongMethod.choice === "translate-once" ? Number(shoreBeats[0].mastX) : 0;
        return Number(shore.stoneX) - once;
      }
      return null;
    });
    var targetValues = shipBeats.map(function (point) { return Number(point.stoneX); });
    var finiteValues = targetValues.concat(previewValues.filter(function (n) { return isFinite(n); }));
    var minValue = Math.min.apply(null, finiteValues), maxValue = Math.max.apply(null, finiteValues);
    if (!isFinite(minValue) || !isFinite(maxValue)) { minValue = -1; maxValue = 1; }
    if (maxValue - minValue < 0.5) { minValue -= 0.25; maxValue += 0.25; }
    var svg = ship3DossierSvg(card, "svg", {
      viewBox: "0 0 560 190", role: "img", class: "shipP3TransformPlot",
      "aria-label": "藍線是船紙讀值；逐拍移尺後的岸紙點應與它重合"
    });
    var mapX = function (index) { return 70 + index * (420 / Math.max(1, shoreBeats.length - 1)); };
    var mapY = function (value) { return 142 - (value - minValue) / (maxValue - minValue) * 92; };
    ship3DossierSvg(svg, "line", { x1: 48, y1: 150, x2: 520, y2: 150, class: "shipP3Axis" });
    var targetPath = targetValues.map(function (value, index) {
      return (index ? "L" : "M") + mapX(index).toFixed(1) + " " + mapY(value).toFixed(1);
    }).join(" ");
    ship3DossierSvg(svg, "path", { d: targetPath, class: "shipP3TargetPath" });
    var previewPath = "";
    previewValues.forEach(function (value, index) {
      if (!isFinite(value)) return;
      previewPath += (previewPath ? " L" : "M") + mapX(index).toFixed(1) + " " + mapY(value).toFixed(1);
    });
    if (previewPath) ship3DossierSvg(svg, "path", {
      d: previewPath, class: "shipP3MovedPath" + ((activeWrongBeat || activeWrongMethod) ? " wrong" : "")
    });
    shoreBeats.forEach(function (shore, index) {
      ship3DossierSvg(svg, "circle", {
        cx: mapX(index), cy: mapY(targetValues[index]), r: 5, class: "shipP3TargetDot"
      });
      if (isFinite(previewValues[index])) ship3DossierSvg(svg, "circle", {
        cx: mapX(index), cy: mapY(previewValues[index]), r: 6,
        class: "shipP3MovedDot" + ((activeWrongBeat && index === accepted.length) || activeWrongMethod ? " wrong" : "")
      });
      ship3DossierSvg(svg, "text", { x: mapX(index), y: 173, "text-anchor": "middle", class: "shipP3BeatLabel" },
        String(shore.beat));
    });
    ship3DossierSvg(svg, "text", { x: 70, y: 22, class: "shipP3Legend" },
      "藍＝船紙　黃＝換尺後岸紙　紅＝這次未重合");
  }
  function ship3DossierP3PaperMath(parent, d, showTransform) {
    var record = ship3DossierP3Record(d);
    if (!record) return;
    var p3 = d.debate && d.debate.p3 || {};
    var shore = record.papers.shore, ship = record.papers.ship;
    var section = ship3El("section", null, parent, "shipClaimPanel shipDossierP3Papers");
    ship3El("h4", "本柱引用｜原紙 R" + record.id, section);
    ship3El("p",
      "同一趟、同一組鼓點。先讀兩張原紙自己的數字，再決定怎麼讓它們使用同一把尺。",
      section, "shipNote");
    var plots = ship3El("div", null, section, "shipRawPaperGrid");
    ship3DossierPaperPlot(plots, shore, "岸上原紙｜以碼頭為起點", record);
    ship3DossierPaperPlot(plots, ship, "船上原紙｜以桅腳為起點", record);

    var shoreBeats = shore.beats || [], shipBeats = ship.beats || [];
    if (!p3.aligned && !showTransform) {
      var lastAlign = (p3.alignAttempts || []).slice().reverse().find(function (attempt) {
        return attempt && !attempt.ok && String(attempt.sourceRecordId) === String(record.id);
      });
      if (lastAlign) ship3El("p", lastAlign.choice === "endpoints"
        ? "這次只釘住終點；中間鼓號沒有逐一配對，不能證明每一點都是同一時刻。"
        : "這次把相同高度配成一對；鼓號順序交叉了，同一高度不等於同一時刻。",
        section, "shipNote warning");
      ship3El("p",
        "岸紙與船紙各留下 " + Math.min(shoreBeats.length, shipBeats.length) +
        " 個同號鼓點；目前仍各用自己的起點，還不能逐點互相比。",
        section, "shipNote shipDossierP3Summary");
      return;
    }

    var shipByBeat = {};
    shipBeats.forEach(function (beat) { shipByBeat[String(beat.beat)] = beat; });
    var comparisons = shoreBeats.map(function (shoreBeat) {
      var shipBeat = shipByBeat[String(shoreBeat.beat)];
      if (!shipBeat) return null;
      var fromMast = Number(shoreBeat.stoneX) - Number(shoreBeat.mastX);
      var residual = fromMast - Number(shipBeat.stoneX);
      return { beat: shoreBeat.beat, fromMast: fromMast, residual: residual };
    }).filter(Boolean);
    var transformed = showTransform || p3.transformed || (d.assertions && d.assertions.A5);
    var maxResidual = comparisons.length
      ? Math.max.apply(null, comparisons.map(function (row) { return Math.abs(row.residual); }))
      : NaN;
    ship3El("p", transformed
      ? "已逐拍用「岸紙石頭位置－同拍桅杆位置」換成從桅杆量。兩紙最大讀值差為 " +
        ship3DossierNumber(maxResidual) + " 格；圖上的小差距保留原紙讀值誤差。"
      : "同號鼓點已對齊，兩張紙現在指向同一時刻；下一步仍要把位置改成使用同一個起點。",
      section, "shipNote shipDossierP3Summary");
    if (p3.transformMode || (p3.transformAttempts || []).length)
      ship3DossierP3TransformBoard(section, record, p3);
  }
  function ship3DossierRunView(parent, record, perspective) {
    var figure = ship3El("figure", null, parent, "shipRunView");
    var isShipView = perspective === "ship";
    ship3El("b", isShipView ? "船上視角｜桅杆留在原地" : "岸上視角｜碼頭留在原地",
      figure, "shipRunViewTitle");
    ship3El("small", isShipView
      ? "伽桑狄站在甲板，以桅腳當作位置的起點。"
      : "艾蒂安站在碼頭，以岸標當作位置的起點。",
      figure);
    var svg = ship3DossierSvg(figure, "svg", {
      viewBox: "0 0 900 330", class: "shipRunSvg", role: "img",
      "aria-label": isShipView
        ? "船上觀察：桅杆固定，石頭相對桅杆落下"
        : "岸上觀察：船與桅杆向前移動，石頭沿岸上座標落下"
    });
    ship3DossierSvg(svg, "rect", { x: 0, y: 0, width: 900, height: 330, class: "shipRunSky" });
    ship3DossierSvg(svg, "line", { x1: 30, y1: 278, x2: 870, y2: 278, class: "shipRunWater" });
    var points = record.animation && record.animation.path || [];
    if (!points.length) return figure;
    var xs = [];
    points.forEach(function (point) {
      if (isShipView) xs.push(point.relativeX, 0);
      else xs.push(point.mastX, point.stoneX);
    });
    var minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs);
    if (isShipView) {
      /*
       * 相對偏移是公尺量級；若每次都把最遠落點撐滿整張圖，
       * 0.7 公尺會被誇張成「石頭飛出船外」。船上視角固定保留
       * 約 8 公尺的甲板尺度，讓加速／減速只呈現桅後／桅前的小偏移。
       */
      var relativeSpan = Math.max(4, Math.abs(minX), Math.abs(maxX));
      minX = -relativeSpan; maxX = relativeSpan;
    } else if (maxX - minX < 1) {
      minX -= 0.5; maxX += 0.5;
    }
    var mapX = function (x) { return 115 + (x - minX) / (maxX - minX) * 650; };
    var runHeight = record.mastHeight || record.animation.height || 12;
    var mapY = function (y) { return 270 - y / runHeight * 190; };
    var stonePath = points.map(function (point, i) {
      var x = isShipView ? point.relativeX : point.stoneX;
      return (i ? "L" : "M") + mapX(x).toFixed(1) + " " + mapY(point.y).toFixed(1);
    }).join(" ");
    if (!isShipView) {
      var mastPath = points.map(function (point, i) {
        return (i ? "L" : "M") + mapX(point.mastX).toFixed(1) + " 270";
      }).join(" ");
      ship3DossierSvg(svg, "path", { d: mastPath, class: "shipRunMastTrace" });
    }
    ship3DossierSvg(svg, "path", { d: stonePath, class: "shipRunStoneTrace", pathLength: 1 });
    var ship = ship3DossierSvg(svg, "g", { class: "shipRunShip" });
    ship3DossierSvg(ship, "path", {
      d: "M -72 0 Q 0 34 72 0 L 58 26 Q 0 54 -58 26 Z", class: "shipRunHull"
    });
    ship3DossierSvg(ship, "line", {
      x1: 0, y1: 0, x2: 0, y2: -Math.min(210, 120 + runHeight * 5), class: "shipRunMast"
    });
    var shipXs = points.map(function (point) {
      return isShipView ? mapX(0).toFixed(1) : mapX(point.mastX).toFixed(1);
    });
    ship.setAttribute("transform", "translate(" + shipXs[0] + " 270)");
    if (!isShipView) {
      ship3DossierSvg(ship, "animateTransform", {
        attributeName: "transform", type: "translate", dur: "2.2s",
        fill: "freeze", begin: "0.15s", calcMode: "linear",
        values: shipXs.map(function (x) { return x + " 270"; }).join(";")
      });
    }
    var stoneXs = points.map(function (point) {
      return mapX(isShipView ? point.relativeX : point.stoneX).toFixed(1);
    });
    var stone = ship3DossierSvg(svg, "circle", {
      cx: stoneXs[0], cy: mapY(points[0].y), r: 11, class: "shipRunStone"
    });
    ship3DossierSvg(stone, "animate", {
      attributeName: "cx", dur: "2.2s", fill: "freeze", begin: "0.15s", calcMode: "linear",
      values: stoneXs.join(";")
    });
    ship3DossierSvg(stone, "animate", {
      attributeName: "cy", dur: "2.2s", fill: "freeze", begin: "0.15s", calcMode: "linear",
      values: points.map(function (point) { return mapY(point.y).toFixed(1); }).join(";")
    });
    var recordPapers = record.papers || {};
    var viewPaper = isShipView ? recordPapers.ship : recordPapers.shore;
    (viewPaper && viewPaper.beats || []).forEach(function (beat, i) {
      /*
       * 動畫顯示物體的運動；觀察者點歪的量測誤差只留在原紙。
       * 鼓點標記依時間在理想路徑上內插，避免把讀值誤差演成石頭轉彎。
       */
      var ideal = points[points.length - 1];
      for (var pathIndex = 1; pathIndex < points.length; pathIndex += 1) {
        if (points[pathIndex].t >= beat.t) {
          var before = points[pathIndex - 1];
          var after = points[pathIndex];
          var duration = after.t - before.t;
          var ratio = duration > 0 ? (beat.t - before.t) / duration : 0;
          ideal = {
            stoneX: before.stoneX + (after.stoneX - before.stoneX) * ratio,
            relativeX: before.relativeX + (after.relativeX - before.relativeX) * ratio,
            y: before.y + (after.y - before.y) * ratio
          };
          break;
        }
      }
      var pointX = mapX(isShipView ? ideal.relativeX : ideal.stoneX);
      var pointY = mapY(ideal.y);
      var fallTime = record.animation && record.animation.fallTime || 1;
      var delay = 0.15 + Math.max(0, Math.min(1, beat.t / fallTime)) * 2.2;
      ship3DossierSvg(svg, "circle", {
        cx: pointX, cy: pointY, r: 5,
        class: "shipRunBeatFlash", style: "animation-delay:" + delay.toFixed(2) + "s"
      });
      ship3DossierSvg(svg, "text", {
        x: pointX + 9, y: pointY - 7,
        class: "shipRunBeatLabel", style: "animation-delay:" + delay.toFixed(2) + "s"
      }, String(beat.beat));
    });
    ship3El("figcaption", isShipView
      ? "船與觀察者一起前進；畫紙只記石頭相對桅杆的位置。"
      : "碼頭不動；畫面會同時顯示船、桅杆與石頭相對岸標的移動。",
      figure);
    return figure;
  }
  function ship3DossierRunAnimation(parent, record) {
    var stage = ship3El("section", null, parent, "shipDossierRunStage");
    ship3El("div", "觀察者正在把這一趟記在紙上", stage, "shipDossierRunTitle");
    var recordPapers = record.papers || {};
    var recorderText = recordPapers.shore && recordPapers.ship
      ? "岸上和船上的記錄者各在紙上點一次。"
      : (recordPapers.shore
        ? "岸上的記錄者在紙上點一次。"
        : (recordPapers.ship ? "船上的記錄者在紙上點一次。" : "這一趟沒有位置記錄者。"));
    ship3El("p", record.speedRecord === "beats"
      ? "水手照固定節拍敲鼓。每響一聲，" + recorderText
      : "觀察者看著石頭落下，但沒有共用的時刻記號；紙上只能留下落點。",
      stage, "shipNote");
    var views = ship3El("div", null, stage, "shipRunViews");
    if (recordPapers.shore) ship3DossierRunView(views, record, "shore");
    if (recordPapers.ship) ship3DossierRunView(views, record, "ship");
    if (!recordPapers.shore && !recordPapers.ship)
      ship3DossierRunView(views, record, record.positionRecord === "deck" ? "ship" : "shore");
    ship3El("small",
      "上面重播石頭怎麼落，下面是觀察者當時畫下的原紙。人站在哪裡，位置就從哪裡量起。",
      stage);
    return stage;
  }
  function renderShipDossierPending(work, d, paperTarget) {
    var record = d.pendingRecord;
    var recordPapers = record.papers || {};
    ship3DossierRunAnimation(work, record);
    var paperPage = paperTarget || work;
    ship3El("h3", "這一趟留下的原紙", paperPage);
    ship3El("p", "每個人只記自己所在位置看見、量到的東西。兩張紙現在還沒有互相換算。", paperPage,
      "shipNote shipStepPrompt");
    var papers = ship3El("div", null, paperPage, "shipRawPaperGrid");
    if (recordPapers.shore)
      ship3DossierPaperPlot(papers, recordPapers.shore, "岸上原紙｜以碼頭為起點", record);
    if (recordPapers.ship)
      ship3DossierPaperPlot(papers, recordPapers.ship, "船上原紙｜以桅腳為起點", record);
    if (!recordPapers.shore && !recordPapers.ship)
      ship3El("p", "這一趟沒安排位置觀察者，因此沒有可收卷的落點紙。", papers, "shipNote warning");
    var seal = ship3El("section", null, paperPage, "shipDossierSeal");
    ship3El("b", "原紙 R" + record.id + "｜尚未收入卷宗", seal);
    ship3El("p", "簽名表示：這就是當時留下的紀錄，之後不能補畫。", seal);
    ship3El("p", "先把每張原紙都收進卷宗。要寫斷言時，再挑真正能回答問題的那幾張。", seal,
      "shipNote");
    var sealButton = ship3Btn(seal, "簽名收卷", function () {
      doShip("fileDossierRecord", {}, function (rr) {
        return "◆ 原紙 R" + rr.record.id + " 已簽名收卷。" +
          (Object.keys(rr.candidates || {}).length
            ? " 這些原紙已足夠讓你提出一項斷言。"
            : " 它目前還不足以支持斷言，但仍會留在卷宗裡。");
      });
    }, "shipAction primary shipDossierSealButton");
    sealButton.setAttribute("data-ship-focus", "file-pending-record");
  }
  function ship3DossierRecordForReplay(d, sourceId) {
    var id = String(sourceId || "");
    if (/^R\d+$/.test(id)) {
      var numeric = Number(id.slice(1));
      return (d.records || []).find(function (row) { return row.id === numeric; }) || null;
    }
    if (/^C\d+$/.test(id))
      return (d.blind && d.blind.records || []).find(function (row) { return row.id === id; }) || null;
    return null;
  }
  function renderShipDossierLastSeries(parent, d, missionId) {
    var ids = ship3LastSeriesIds.filter(function (id) {
      return !!ship3DossierRecordForReplay(d, id);
    });
    if (!ids.length) return;
    if (!ship3ReplayRecordId || ids.indexOf(ship3ReplayRecordId) < 0)
      ship3ReplayRecordId = ids[0];
    var currentPrefix = missionId === "cabin" ? "C" : "R";
    var belongsToEarlierPhase = !ship3PendingMissionBridge && !ship3ReplayNotice &&
      ids.every(function (id) { return id.charAt(0) !== currentPrefix; });
    var holder = parent;
    if (belongsToEarlierPhase) {
      holder = ship3El("details", null, parent, "shipDossierPastSeries");
      ship3El("summary", "前一輪原紙仍在卷宗｜展開重播 " + ids.join("、"), holder);
    }
    var section = ship3El("section", null, holder, "shipDossierSeriesResult");
    ship3El("small", ship3ReplayNotice ? "重播既有紀錄｜不新增實驗" : "本組已收卷", section);
    ship3El("h3", (ids.length > 1 ? "這組包含 " + ids.length + " 張原紙：" : "這次同步事件：") +
      ids.join("、"), section);
    var row = ship3El("div", null, section, "shipDossierReplayButtons");
    ids.forEach(function (id) {
      ship3Btn(row, "重播 " + id, function () {
        ship3ReplayRecordId = id;
        ship3ReplayNotice = true;
        renderAll();
        ship3ScrollToReplayAnimation();
      }, "shipAction" + (id === ship3ReplayRecordId ? " active" : ""));
    });
    var record = ship3DossierRecordForReplay(d, ship3ReplayRecordId);
    if (!record) return;
    if (/^R/.test(ship3ReplayRecordId)) {
      ship3DossierRunAnimation(section, record);
      var raw = ship3El("details", null, section, "shipDossierRawDetails");
      ship3El("summary", "查看 " + ship3ReplayRecordId + " 的原紙", raw);
      var papers = ship3El("div", null, raw, "shipRawPaperGrid");
      if (record.papers && record.papers.shore)
        ship3DossierPaperPlot(papers, record.papers.shore, "岸上原紙｜以碼頭為起點", record);
      if (record.papers && record.papers.ship)
        ship3DossierPaperPlot(papers, record.papers.ship, "船上原紙｜以桅腳為起點", record);
      if (ship3PendingMissionBridge) {
        ship3El("p", "先看完岸上與船上的同一趟落石，再把兩張紙帶回卷宗。",
          section, "shipNote shipStepPrompt");
        var continueButton = ship3Btn(section, "看完動畫，收好兩張紙", function () {
          var bridge = ship3PendingMissionBridge;
          ship3PendingMissionBridge = null;
          renderAll();
          ship3OpenIntermission("ch3-dual-complete", "▸ 把卷宗帶上碼頭");
          ship3SayMissionBridge(bridge.from, bridge.to);
        }, "shipAction primary");
        continueButton.setAttribute("data-ship-focus", "continue-dual-bridge");
      }
    } else {
      ship3El("p", record.stageLabel + "｜" + record.classification, section, "shipNote shipStepPrompt");
      var replayInstrument = record.instrument === "drip" ? "吊壺滴水" :
        (record.instrument === "toss" ? "直拋石球" : "既有雙項對照");
      var replayResult = record.instrument === "drip" ? record.water :
        (record.instrument === "toss" ? record.ball : record.water + "；" + record.ball);
      ship3Table(section, ["原紙", "本輪器材", "艙內紀錄"], [[
        record.id, replayInstrument, replayResult
      ]]);
    }
  }
  function ship3ScrollToReplayAnimation() {
    var windowX = window.scrollX || 0;
    var windowY = window.scrollY || 0;
    window.requestAnimationFrame(function () {
      window.scrollTo(windowX, windowY);
      var work = document.querySelector(".shipDossierWork");
      var stage = work && work.querySelector(".shipDossierSeriesResult .shipDossierRunStage");
      if (work && stage) {
        var workRect = work.getBoundingClientRect();
        var stageRect = stage.getBoundingClientRect();
        work.scrollTop += stageRect.top - workRect.top - 10;
        ship3DossierScrollTop = work.scrollTop;
      }
      window.scrollTo(windowX, windowY);
    });
  }
  function ship3DossierPlacePreview(work, d, draftOverride) {
    var area = ship3El("section", null, work, "shipDossierPlacePreview");
    var draft = draftOverride || d.draft;
    var specs;
    if (draft.location === "cabin") {
      specs = [{
        id: "bg_ch03_enclosed_cabin", badge: "船艙裡",
        title: "封閉船艙｜岸上的人看不見艙內落點",
        alt: "十七世紀木船的封閉船艙，桌上放著水碗與小球。"
      }];
    } else {
      var deckAsset = draft.stage === "dock" ? "bg_ch03_moored_mast_deck" :
        (draft.stage === "steady" ? "bg_ch03_steady_sailing_deck" : "bg_ch03_speed_change_deck");
      var deckSpec = {
        id: deckAsset, badge: "船上",
        title: "船上觀察｜位置從桅腳量起",
        alt: "站在十七世紀實驗船的甲板上，看向中央桅杆與放手裝置。"
      };
      var shoreSpec = {
        id: "bg_ch03_marseille_harbor_dawn", badge: "岸上",
        title: "岸上觀察｜位置從碼頭岸標量起",
        alt: "從馬賽港碼頭望向港內的帆船與岸標。"
      };
      specs = draft.positionRecord === "dual" ? [shoreSpec, deckSpec] :
        (draft.positionRecord === "shore" ? [shoreSpec] : [deckSpec]);
    }
    specs.forEach(function (spec) {
      var figure = ship3El("figure", null, area, "shipDossierPlaceCard");
      var entry = assetEntry(spec.id);
      if (entry) {
        var image = document.createElement("img");
        image.src = assetUrl(entry); image.alt = spec.alt;
        figure.appendChild(image);
      }
      ship3El("span", spec.badge, figure, "shipDossierPlaceBadge");
      ship3El("figcaption", spec.title, figure);
    });
    return area;
  }
  function ship3DossierReproductionCount(d) {
    var groups = {};
    (d.records || []).forEach(function (row) {
      if (row.stage !== "depart" || (row.vesselId || "captain") !== "captain" ||
          row.release !== "latch" || !ship3DossierHasVisibleShore(row) ||
          !row.sameStone || !row.sameHeight || row.landing !== "aft" ||
          row.classification !== "正在變快") return;
      var key = JSON.stringify([
        row.vesselId || "captain", row.release, row.speedRecord, row.positionRecord,
        row.speedBand || "mid", row.forceBand || "hard", row.beatBand || "mid",
        row.sameStone !== false, row.sameHeight !== false
      ]);
      groups[key] = (groups[key] || 0) + 1;
    });
    return Object.keys(groups).reduce(function (best, key) {
      return Math.max(best, groups[key]);
    }, 0);
  }
  function ship3DossierMissionState(d) {
    var hasDual = d.records.some(function (r) { return r.dualPapers; });
    var reproduced = ship3DossierReproductionCount(d);
    if (!d.assertions.A3 && reproduced < 3) return {
      id: "reproduce", number: "一", title: "重做舊紙記下的第一段",
      dialogue: "舊紙只寫「解纜後第一段，石頭落在桅後」。今天重做同一種操作階段，並把舊紙漏掉的船速欄補進新原紙。",
      goal: "船況固定為解纜後第一段；你要決定的是怎麼放手、怎麼記船速。留下可判讀船速的原紙，同一做法重現三回。目前合格重現 " +
        reproduced + "／3 張。",
      hint: "舊紙記的是「解纜後第一段」。鼓點只提供共用時刻；還要有人從岸上記船位，才看得出那一趟是走穩還是正在改變速度。"
    };
    if (!d.assertions.A1) return {
      id: "steady", number: "二", title: "只改船況，留下走穩原紙",
      dialogue: "第一輪不只重現後偏，岸標還顯示船越走越快。現在要分清：造成差別的是『船往前』，還是『船速正在變』。",
      goal: "留下三張可確認近似走穩的原紙，再由你選資料、寫下這一組能支持的斷言。",
      hint: "把第一輪和這一輪的條件欄逐項對照；除了船的狀態，其餘欄位應維持相同。"
    };
    if (!d.assertions.A3) return {
      id: "speed", number: "三", title: "把起步與走穩兩輪並排",
      dialogue: "兩組船都往前，只有解纜那組的鼓點間距一直變。不同落點究竟跟『往前』還是『越走越快』有關，要由兩疊原紙回答。",
      goal: "兩種船況各選三張條件相同的原紙，再選一句沒有超出資料的比較斷言。",
      hint: "先看每張紙的船速分類，再核對船、石頭、放手方法、鼓拍與量位置的起點是否一致。"
    };
    if (!d.assertions.A2) return {
      id: "cabin", number: "四", title: "關艙後，再做停泊／平駛對照",
      dialogue: "船長質疑甲板風可能把石頭往前推。這不是重做桅頂落石；先踏查吊壺、接水碗與石球，用封閉船艙只查甲板風是不是必要條件。",
      goal: "選一種艙內觀察，停泊與平駛各做三回；再從六張紙中挑出能支撐斷言的資料。",
      hint: "艙內的人不看岸。岸紙只確認船況；艙內紙只記你選的滴水或拋球結果。"
    };
    if (!hasDual) return {
      id: "dual", number: "五", title: "同一趟落石，留下岸紙與船紙",
      dialogue: "同一趟落石，請艾蒂安留在岸上、伽桑狄站在船上。兩人都照同一聲鼓標位置，但先不要互相換算。",
      goal: "先讓岸上和船上各留一張原紙。怎麼對上同一時刻、怎麼改成從桅杆量，留到碼頭上當眾做。",
      hint: "這一趟需要兩位位置記錄者，也需要共用的鼓點；只留一張紙，就沒有第二個參考位置可比較。"
    };
    return {
      id: "explore", number: "完成", title: "卷宗齊了：把紙帶上碼頭",
      dialogue: "核心五輪已完成。這裡不再要求額外補做，接下來要公開回答這些紙能證明什麼。",
      goal: "帶現有卷宗上碼頭，用原紙支撐你的主張。",
      hint: "舊紙當年沒有記下的船速不能補寫；在碼頭上把它的邊界說清楚。"
    };
  }
  function renderShipDossierMissionCard(parent, mission) {
    if (ship3DossierHintMissionId !== mission.id) {
      ship3DossierHintMissionId = mission.id;
      ship3DossierHintOpen = false;
    }
    var card = ship3El("section", null, parent, "shipDossierMissionCard");
    ship3El("small", (mission.number === "完成" ? "實驗卷宗已齊" : "實驗" + mission.number) +
      "｜" + (ship3ExploreMode() ? "探索模式・檢核已展開" : "學者模式・提示可主動展開"), card);
    ship3El("h3", mission.title, card);
    ship3El("p", mission.dialogue, card, "shipDossierMissionDialogue");
    ship3El("b", "這次要做到", card);
    ship3El("p", mission.goal, card);
    var support = ship3El("details", null, card, "shipDossierModeSupport");
    support.open = ship3ExploreMode() || ship3DossierHintOpen;
    support.ontoggle = function () { ship3DossierHintOpen = support.open; };
    ship3El("summary", ship3ExploreMode() ? "本輪檢核" : "需要提示時展開本輪檢核", support);
    ship3El("p", mission.hint, support, "shipNote");
    return card;
  }
  function renderShipDossierDesignDecision(parent, config) {
    var card = ship3El("section", null, parent, "shipDossierDesignDecision");
    ship3El("small", "先決定怎麼查", card);
    ship3El("h3", config.title, card);
    ship3El("p", config.prompt, card, "shipNote shipStepPrompt");
    var choices = ship3El("div", null, card, "shipDossierDesignChoices");
    config.options.forEach(function (option) {
      var button = ship3Btn(choices, option.label, function () {
        if (config.action) {
          if (option.reply)
            sayIntoDialogue(option.reply, "", state.cursor ? state.cursor.scene : null);
          doShip(config.action, { choice: option.id },
            "✓ " + option.feedback, option.feedback);
          return;
        }
        if (!option.correct) {
          ship3Msg = "✕ " + option.feedback;
          if (option.reply) sayIntoDialogue(option.reply, "", state.cursor ? state.cursor.scene : null);
          renderAll();
          return;
        }
        config.accept();
        ship3Msg = "✓ " + option.feedback;
        if (option.reply) sayIntoDialogue(option.reply, "", state.cursor ? state.cursor.scene : null);
        renderAll();
      }, "shipAction");
      button.setAttribute("data-ship-focus", "design-" + config.id + "-" + option.id);
    });
    return card;
  }
  function renderShipDossierNotebookIndex(book, d) {
    ship3El("small", "II 旅人實驗簿", book, "shipNotebookEyebrow");
    ship3El("h3", "先選斷言，再找原紙", book);
    ship3El("p",
      "每一輪先把可能的斷言攤開。選一句，再勾能支撐它的原紙；資料不夠，這句話就不能寫進卷宗。",
      book, "shipNote shipStepPrompt");
    var index = ship3El("section", null, book, "shipNotebookIndex");
    ship3El("b", "已成立的斷言", index);
    ["A6", "A1", "A3", "A2", "S1", "S4"].forEach(function (id) {
      if (!d.assertions[id]) return;
      var row = ship3El("article", null, index, "shipNotebookRow");
      ship3El("strong", "✓ " + ship3DossierAssertionText(id), row);
      ship3El("small", "引用：" +
        (ship3DossierPacketSourceIds(d, id).join("、") || "尚未綁定"), row);
    });
    if (!["A6", "A1", "A2", "A3", "S1", "S4"].some(function (id) { return d.assertions[id]; }))
      ship3El("p", "還沒有斷言。先在左頁完成實驗；重複系列會一次執行、逐回留下三張原紙。",
        index, "shipNotebookEmpty");
  }
  function renderShipDossierLab(work, d) {
    var tabs = ship3El("div", null, work, "shipDossierTabs");
    ship3Btn(tabs, "設計實驗", function () { ship3Msg = ""; renderAll(); }, "shipAction active");
    var canDebate = d.records.length > 0 || d.blind.ran ||
      ["A1", "A2", "A3", "S1", "S4"].some(function (id) { return d.assertions[id]; });
    ship3Btn(tabs, "去碼頭辯論", function () {
      doShip("enterDossierDebate", {}, "卷宗已帶上碼頭。船長會問：這些紙現在能證明什麼？");
    }, "shipAction debate", !canDebate || !!d.pendingRecord || !!ship3PendingMissionBridge);
    if (d.debate && Array.isArray(d.debate.pins) && d.debate.pins.length) {
      var pinLabels = {
        p1: "共同前行：鬆手前，石頭也在往前；鬆手後呢？",
        p2: "前進與變速：舊紙缺少哪一個關鍵條件？",
        p3: "兩張原紙：怎麼確認它們畫的是同一事件、同一時刻？"
      };
      var pins = ship3El("section", null, work, "shipDossierPins");
      ship3El("b", "碼頭留下的質疑", pins);
      var pinList = ship3El("ul", null, pins);
      d.debate.pins.slice(-5).forEach(function (pin) {
        var label = String(pin || "");
        label = label.replace(/^尚未回答：(p1|p2|p3)$/, function (_, id) {
          return pinLabels[id];
        });
        label = label.replace(/「(concept|steady|cabin|wind|question|depart|old|boundary|scope|scope-diagnosis)」/g,
          function (_, step) {
            return "這一步";
          });
        ship3El("li", label, pinList);
      });
      ship3El("small", "原紙、已寫下的斷言和答過的問題都會保留。補到能回答，再回碼頭。", pins);
    }
    var spread = ship3El("div", null, work, "shipDossierNotebookSpread");
    var apparatusPage = ship3El("section", null, spread, "shipDossierApparatusPage");
    var notebookPage = ship3El("section", null, spread, "shipDossierNotebookPage");
    var mission = ship3DossierMissionState(d);
    ship3El("small", mission.id === "cabin" ? "I 船艙裝置" : "I 航船實驗",
      apparatusPage, "shipNotebookEyebrow");
    renderShipDossierNotebookIndex(notebookPage, d);
    work = apparatusPage;
    renderShipDossierMissionCard(notebookPage, mission);
    var missionDraft = Object.assign({}, d.draft);
    if (mission.id !== "explore") missionDraft.location = mission.id === "cabin" ? "cabin" : "deck";
    if (mission.id === "reproduce") missionDraft.stage = "depart";
    if (mission.id === "steady") missionDraft.stage = "steady";
    if (mission.id === "steady" && missionDraft.positionRecord === "dual")
      missionDraft.positionRecord = "shore";
    if (mission.id === "speed" && ["steady", "depart"].indexOf(missionDraft.stage) < 0)
      missionDraft.stage = "steady";
    if (mission.id === "dual") {
      missionDraft.stage = "steady";
      missionDraft.release = "latch";
      missionDraft.speedRecord = "beats";
      missionDraft.positionRecord = "dual";
    }
    ship3DossierPlacePreview(work, d, missionDraft);
    /* 重播屬工作台共用層：不能綁在某一任務分支，否則玩家進到下一題後，
       從旅人筆記點「重播」只會關掉筆記，卻沒有地方呈現既有動畫。 */
    renderShipDossierLastSeries(work, d, mission.id);
    if (mission.id === "explore" && !ship3PendingMissionBridge) {
      ship3El("h3", "卷宗已齊", work);
      ship3El("p",
        "核心實驗已經完成。現在把原紙帶上碼頭，回答它們能證明什麼。",
        work, "shipNote shipStepPrompt");
      var debateButton = ship3Btn(work, "把卷宗帶上碼頭", function () {
        doShip("enterDossierDebate", {}, "卷宗已帶上碼頭。船長會問：這些紙現在能證明什麼？");
      }, "shipAction primary");
      debateButton.setAttribute("data-ship-focus", "enter-dossier-debate");
      renderShipDossierLedger(notebookPage, d, null);
      return;
    }
    if (mission.id === "speed") {
      ship3El("h3", "把起步與走穩兩組原紙並排", work);
      ship3El("p",
        "這一步不再新增實驗。請到右頁勾選解纜起步與出港平駛各三張，再判斷兩組資料最多能支持哪一句。",
        work, "shipNote shipStepPrompt");
      var comparisonRows = d.records.filter(function (row) {
        return row.stage === "depart" || row.stage === "steady";
      });
      ship3Table(work, ["原紙", "船況", "船速分類", "落點"], comparisonRows.map(function (row) {
        return [
          "R" + row.id,
          row.stage === "depart" ? "解纜起步" : "出港平駛",
          ship3DossierClassification(row),
          row.landing === "aft" ? "桅後" : (row.landing === "fore" ? "桅前" :
            (row.landing === "spread" ? "落點散開" : "桅腳附近"))
        ];
      }));
      var compareAssertion = ship3DossierCurrentAssertionId(d, mission.id);
      renderShipDossierCandidates(notebookPage, d, mission.id);
      renderShipDossierLedger(notebookPage, d, compareAssertion);
      renderShipDossierClaimSubmit(notebookPage, d, mission.id);
      return;
    }
    if (mission.id === "cabin") {
      ship3El("h3", "船艙對照｜把甲板風隔在外面", work);
      var cabinWindCommitted = d.designCommitments &&
        d.designCommitments.cabinWind === "close-cabin";
      var legacyCabinInProgress = d.blind && d.blind.records && d.blind.records.length;
      if (!cabinWindCommitted && !legacyCabinInProgress) {
        renderShipDossierDesignDecision(work, {
          id: "cabin-wind",
          narrativeChoice: "ch3",
          action: "commitDossierCabinWindPlan",
          title: "船長追問：外頭的風，怎麼和石頭原本的前行分開？",
          prompt: "桅頂不是密室。先決定怎麼隔開甲板風，再進船艙比較停泊與平駛；這一步不能替所有風下結論。",
          options: SHIP3_CABIN_WIND_OPTIONS
        });
        renderShipDossierLedger(notebookPage, d, null);
        return;
      }
      var cabinInstrument = ship3DossierCabinInstrument(d);
      var cabinInstrumentCommitted = ["drip", "toss", "combined"].indexOf(cabinInstrument) >= 0 &&
        (cabinInstrument !== "combined" || legacyCabinInProgress);
      if (!cabinInstrumentCommitted) {
        renderShipDossierDesignDecision(work, {
          id: "cabin-instrument",
          action: "commitDossierCabinInstrument",
          title: "先踏查船艙：這輪用哪一樣留下痕跡？",
          prompt: "桌上有吊壺、接水碗和一顆小石球。選一種動作；停泊與走穩兩組都要沿用同一種，原紙才比得起來。",
          options: [
            {
              id: "drip", label: "吊壺滴水｜看水滴是否仍落進碗內標記",
              feedback: "已選滴水。停泊三回、走穩三回都沿用同一吊壺、同一碗與同一高度。",
              reply: [
                { speaker: "伽桑狄", action: "把吊壺掛上樑鉤，在碗底畫一個圈", text: "我不看岸。每回只記水滴落在圈內，還是偏到圈外。" },
                { speaker: "艾蒂安", text: "我在岸上記船位。白旗升起，才算艙內那回開始。" }
              ]
            },
            {
              id: "toss", label: "直拋石球｜看石球是否仍落回手邊",
              feedback: "已選石球。停泊三回、走穩三回都由同一人、在同一位置直上拋接。",
              reply: [
                { speaker: "伽桑狄", action: "站到艙板上的粉筆圈裡，掂了掂石球", text: "我不看岸。每回只把球直直拋起，看它落回哪裡。" },
                { speaker: "艾蒂安", text: "我只替原紙確認船是停著，還是已經走穩。" }
              ]
            }
          ]
        });
        renderShipDossierLedger(notebookPage, d, null);
        return;
      }
      ship3El("p",
        "已選「" + (cabinInstrument === "drip" ? "吊壺滴水" :
          (cabinInstrument === "toss" ? "直拋石球" : "既有雙項對照")) +
        "」。每個船況按一次，連做三回、留下三張艙內原紙；艾蒂安在岸上逐回另記船位。",
        work, "shipNote shipStepPrompt");
      ship3El("p",
        "兩組做完後，再判斷這六張紙能支持哪一句話。不要把停泊／走穩擴大成加速／減速，也不要替甲板風下結論。",
        work, "shipNote");
      var cabinSettings = ship3El("div", null, work, "shipDossierSettings shipDossierLocationSettings");
      ship3DossierChoiceRow(cabinSettings, "這一回的船況", "stage", ["dock", "steady"], {
        dock: "繫纜停泊｜船位不變",
        steady: "出港平駛｜先等岸標間距近乎相同"
      }, d.draft.stage === "dock" ? "dock" : "steady", {
        dock: "纜繩繫著，艾蒂安的岸紙會記到船位不變。",
        steady: "艾蒂安先確認岸標間距近乎相同，再發白旗請艙內開始觀察。"
      });
      var dockCount = (d.blind.records || []).filter(function (row) { return row.stage === "dock"; }).length;
      var steadyCount = (d.blind.records || []).filter(function (row) { return row.stage === "steady"; }).length;
      ship3El("p", "目前：停泊 " + dockCount + "／3 張，平駛 " + steadyCount + "／3 張。", work,
        "shipNote shipDossierFixedConditions");
      var selectedCabinCount = d.draft.stage === "dock" ? dockCount : steadyCount;
      var cabinRun = ship3Btn(work,
        selectedCabinCount >= 3
          ? (d.draft.stage === "dock" ? "停泊三回已完成" : "平駛三回已完成")
          : "執行" + (d.draft.stage === "dock" ? "停泊" : "平駛") + "三回並收卷",
        function () {
        doShip("runDossierCabinSeries", {}, function (rr) {
          return "◆ 已連做 " + rr.count + " 回並收卷：" +
            rr.records.map(function (row) { return row.id; }).join("、") +
            "。目前停泊 " + rr.dockCount + " 張，平駛 " + rr.steadyCount + " 張。";
        });
      }, "shipAction primary", selectedCabinCount >= 3);
      cabinRun.setAttribute("data-ship-focus", "run-cabin-record");
      if (d.blind.records && d.blind.records.length) {
        ship3Table(work,
          ["原紙", "船況", "岸上船速紙", "本輪器材", "艙內紀錄"],
          d.blind.records.slice().reverse().map(function (row) {
            var instrumentLabel = row.instrument === "drip" ? "吊壺滴水" :
              (row.instrument === "toss" ? "直拋石球" : "既有雙項對照");
            var resultText = row.instrument === "drip" ? row.water :
              (row.instrument === "toss" ? row.ball : row.water + "；" + row.ball);
            return [row.id, row.stageLabel, row.classification, instrumentLabel, resultText];
          }));
      }
      var cabinAssertion = ship3DossierCurrentAssertionId(d, mission.id);
      renderShipDossierCandidates(notebookPage, d, mission.id);
      renderShipDossierLedger(notebookPage, d, cabinAssertion);
      renderShipDossierClaimSubmit(notebookPage, d, mission.id);
      return;
    }
    if (mission.id === "dual" && !(lab.design && lab.design.dual && lab.design.dual.locked)) {
      renderShipDossierDesignDecision(work, {
        id: "dual-reference",
        title: "要比較岸紙和船紙，怎麼保證它們畫的是同一件事？",
        prompt: "岸上從碼頭量，船上從桅杆量。除了同一顆石頭，還缺哪一組安排，才能在碼頭逐拍對帳？",
        accept: function () {
          doShip("setDualDesign", { setup: {
            shoreOrigin: "quay", shipOrigin: "mast",
            clock: "shared-drum", shipObserver: "gassendi"
          } }, "✓ 雙視角安排已寫進卷宗；重整頁面後也不會消失。");
        },
        options: [
          {
            id: "two-drops", label: "岸上先扔一次、船上再扔一次，各畫得清楚就好",
            feedback: "兩次落石不能逐拍相減；差異可能來自船況、放手或時刻，而不是參考物。",
            reply: [{ speaker: "艾蒂安", text: "兩張漂亮的紙若不是同一件事，對得再整齊也只是兩趟。" }]
          },
          {
            id: "one-runner", label: "同一顆石頭；由一人先記岸上，再跑上船補記",
            feedback: "落石只發生一次；一個人不可能同時站在碼頭與甲板，也不能事後補畫。",
            reply: [{ speaker: "維達爾船長", text: "船不會停下來等他跑。位置不同，就得各有一雙眼睛。" }]
          },
          {
            id: "same-event", correct: true,
            label: "同一趟落石、同號鼓點；岸上與船上各一位觀察者",
            feedback: "兩張紙共享事件與時刻，只改量位置的起點，之後才有資格逐拍換尺。",
            reply: [
              { speaker: "旅人(你)", text: "只做同一趟。艾蒂安從碼頭量，伽桑狄從桅杆量；兩張紙都寫同一號鼓點。" },
              { speaker: "維達爾船長", text: "我讓鼓手守住節拍，放手的人不兼任觀察。這次留下的是一個事件、兩張紙。" }
            ]
          }
        ]
      });
      renderShipDossierLedger(notebookPage, d, null);
      return;
    }
    ship3El("h3", mission.id === "explore" ? "補做一組桅杆落石" :
      (mission.id === "reproduce" ? "重做舊紙記的第一段" :
        (mission.id === "steady" ? "沿用第一輪，只等船走穩" :
          (mission.id === "dual" ? "同一趟，岸上與船上各留一張紙" :
            "只決定這一輪要改的條件"))), work);
    ship3El("p", mission.id === "explore"
      ? "一次只改一項。已收卷的原紙不會跟著改字。"
      : (mission.id === "reproduce"
        ? "船況固定為解纜後第一段；你要決定怎麼放手、怎麼記船速，以及從哪裡量位置。"
        : (mission.id === "steady"
          ? "第一輪的條件全部沿用；這次只等船走穩，再讓馬蒂厄放手。"
          : (mission.id === "dual"
            ? "船況、放手和鼓拍都已固定；這次只確認兩位觀察者會同時留下岸紙與船紙。"
            : "其他條件已固定。這一輪，只選會影響紀錄是否可靠的項目。"))),
      work, "shipNote shipStepPrompt");
    var settings = ship3El("div", null, work, "shipDossierSettings");
    if (mission.id === "explore") ship3DossierChoiceRow(settings, "用哪一艘船", "vesselId", ["small", "captain", "large"], {
      small: "港內小艇｜桅高約 7 公尺",
      captain: "維達爾船長的船｜桅高約 12 公尺",
      large: "隔壁大貨船｜桅高約 18 公尺"
    }, d.draft.vesselId || "captain", {
      small: "第一次借用多花一天。船較輕，改變船速時由兩名港內水手划短槳。",
      captain: "現成可用；由四名維達爾號水手照原定操法划常槳。",
      large: "第一次借用多花一天。船較重，改變船速時由六名貨船水手划長槳。"
    });
    if (mission.id === "explore") ship3El("p",
      "換船後，把不同原紙上的船名、桅高、船員與槳法逐欄比較，再決定這些資料能支持多大的主張。",
      settings, "shipNote");
    var stageValues = mission.id === "speed" ? ["steady", "depart"] :
      (mission.id === "explore" ? ["dock", "steady", "depart", "brake"] : []);
    if (stageValues.length) ship3DossierChoiceRow(settings, "船的狀態", "stage", stageValues, {
      dock: "停泊（繫纜不動）",
      steady: "出港平駛（先等船走穩）",
      depart: "解纜後第一段（離岸後放手）",
      brake: "收槳滑行（放手後收槳）"
    }, missionDraft.stage, {
      dock: "船沒有前進，作為停泊對照。",
      steady: "先等岸標間距近乎相同，再發白旗請桅頂放手。",
      depart: "這只是操作名稱；船是否正在變快，要等岸紙出來再分類。",
      brake: "放手後由舵手收槳；船是否正在變慢，要等岸紙出來再分類。"
    });
    if (mission.id === "explore" && d.draft.stage !== "dock")
      ship3DossierChoiceRow(settings, "放手前船走多快", "speedBand", ["slow", "mid", "fast"], {
        slow: "慢槳｜岸標間距較短",
        mid: "半槳｜一般航速",
        fast: "滿槳｜岸標間距較長"
      }, d.draft.speedBand, {
        slow: "改船速，是要看相同結果會不會也出現在不同船速下。",
        mid: "先用一般航速取得一組乾淨紙；之後可複製方案，只改船速。",
        fast: "若慢、半、滿槳都得到同樣方向的結果，才能說這句話在三種船速下都成立。"
      });
    if (mission.id === "explore" && (d.draft.stage === "depart" || d.draft.stage === "brake")) {
      var forceLabels = d.draft.stage === "depart"
        ? { soft: "輕加槳", hard: "全力加槳" }
        : { soft: "輕收槳", hard: "全力收槳" };
      ship3DossierChoiceRow(settings,
        d.draft.stage === "depart" ? "怎麼加槳" : "怎麼收槳",
        "forceBand", ["soft", "hard"], forceLabels, d.draft.forceBand, {
          soft: "船速改變得較慢，落點偏得較少，但仍看得出偏向哪一邊。",
          hard: "船速改變得較快，落點偏移較明顯。"
        });
    }
    if (mission.id === "reproduce" || mission.id === "explore")
      ship3DossierChoiceRow(settings, "怎麼放手", "release", ["hand", "string", "latch"], {
      hand: "徒手鬆開｜手可能多推一下",
      string: "剪斷細繩｜手不碰石頭，但石頭可能先晃",
      latch: "抽開門閂｜手不碰石頭，也不拉繩"
    }, d.draft.release, {
      hand: "馬蒂厄直接用手鬆開石頭；最快，但最容易混入手勢。",
      string: "馬蒂厄剪斷吊住石頭的細繩；減少手推，仍要留意繩上的擺動。",
      latch: "馬蒂厄只抽開托板門閂；石頭由自身重量開始下落。"
    });
    if (mission.id === "reproduce" || mission.id === "explore")
      ship3DossierChoiceRow(settings, "船速怎麼記", "speedRecord", ["none", "verbal", "beats"], {
      none: "不記船速",
      verbal: "舵手只用嘴說「差不多／有變」",
      beats: "水手等拍敲鼓；若安排岸上記錄，艾蒂安每拍點一次船位"
    }, d.draft.speedRecord, {
      none: "紙上只會留下落點，之後無法判斷放手時船怎麼走。",
      verbal: "只留下口頭判斷，沒有逐拍位置；辯論時只能當線索。",
      beats: "水手每隔相同時間敲一下鼓，提供共用時刻；還要選岸上或雙視角記錄，紙上才會留下相對碼頭的船位。"
    });
    if (mission.id === "explore" && d.draft.speedRecord === "beats")
      ship3DossierChoiceRow(settings, "鼓打多快", "beatBand", ["slow", "mid", "fast"], {
        slow: "慢拍｜點得準，但留下的點少",
        mid: "中拍｜點數與準確度較平衡",
        fast: "快拍｜點較密，但岸上容易點歪"
      }, d.draft.beatBand, {
        slow: "同號鼓點仍能對時，但點太少，路徑不容易看清，也難把岸紙和船紙逐點對起來。",
        mid: "水手維持固定節拍；岸上與船上都有時間把同號位置點清楚。",
        fast: "不是時間不等，而是觀察者來不及每次都把位置點得準。"
      });
    if (mission.id === "reproduce" || mission.id === "explore") {
      var positionValues = mission.id === "reproduce"
        ? ["deck", "shore"] : ["deck", "shore", "dual"];
      ship3DossierChoiceRow(settings, "位置由誰記？從哪裡量？", "positionRecord", positionValues, {
      deck: "船上記｜伽桑狄從桅腳量起",
      shore: "岸上記｜艾蒂安從碼頭繫船柱量起",
      dual: "岸、船各記一張紙｜共用同一號鼓點"
    }, d.draft.positionRecord, {
      deck: "船上的伽桑狄以桅腳為零點，用粉筆圈住落點，再量出距離。",
      shore: "岸上的艾蒂安以碼頭繫船柱為零點；每聲鼓都把石頭與桅杆的位置畫在格紙上。",
      dual: "艾蒂安留岸上、伽桑狄留船上；兩張紙都標同一號鼓點，之後才能對在一起。"
    });
      if (d.draft.speedRecord === "beats" && d.draft.positionRecord === "deck")
        ship3El("p",
          "目前只有船上紙：鼓點有記，但看不到船相對碼頭的逐拍位置；這一回仍可收卷，船況會維持未分類。",
          settings, "shipNote warning");
    }
    if (mission.id === "speed") {
      ship3El("p",
        "這一輪只改船的狀態。船、石頭、放手方法、鼓拍和記錄方式都不變；平駛、解纜起步各做三回。",
        settings,
        "shipNote shipDossierFixedConditions");
    } else if (mission.id === "dual") {
      ship3El("p",
        "已固定｜維達爾號出港平駛、門閂放手、中拍鼓、同一顆石頭、同一高度。岸上由艾蒂安、船上由伽桑狄各留一張原紙，兩張都標同號鼓點。",
        settings,
        "shipNote shipDossierFixedConditions");
    } else if (mission.id === "steady") {
      ship3El("p",
        "已固定｜只改船的狀態：保留第一輪的船、石頭、放手方式、鼓拍與岸紙，等船走穩後再放一次。",
        settings,
        "shipNote shipDossierFixedConditions");
    } else if (mission.id === "reproduce") {
      ship3El("p",
        "已固定｜維達爾號、解纜後第一段、依出港號令加槳、中等節拍、同一顆石頭、同一桅頂。要重現舊結果，還要讓船速欄可由原紙判讀。",
        settings,
        "shipNote shipDossierFixedConditions");
    } else if (mission.id !== "explore") {
      ship3El("p",
        "已固定：維達爾號、一般航速、中等節拍、同一顆石頭、同一高度。每按一次執行，就做一回、留一張原紙。相同條件至少要有三張，才能寫斷言。",
        settings,
        "shipNote shipDossierFixedConditions");
    }
    if (mission.id === "explore")
      ship3El("p",
        "已固定｜同一顆石頭、同一桅頂。這一輪只比較船況、槳力、船速、鼓拍與觀察位置。",
        settings, "shipNote shipDossierFixedConditions");
    if (d.pendingRecord) {
      Array.prototype.forEach.call(apparatusPage.querySelectorAll("select"), function (select) {
        select.disabled = true;
      });
      var finishedButton = ship3Btn(work, "這一回已完成｜動畫與原紙如下", function () {},
        "shipAction primary", true);
      finishedButton.setAttribute("data-ship-focus", "run-deck-record");
      renderShipDossierPending(work, d, notebookPage);
    } else {
      var guidedSeriesComplete = mission.id === "steady" && !!(d.candidates && d.candidates.A1);
      var runButton = ship3Btn(work, mission.id === "reproduce" ? "重做舊紙記的第一段（三回）" :
        (mission.id === "steady" ? (guidedSeriesComplete ? "走穩三回已完成" : "執行走穩實驗（三回）") :
        (mission.id === "speed" ? "執行船況對照（三回）" :
          (mission.id === "dual" ? "執行雙視角紀錄" : "執行實驗"))), function () {
        doShip("runDossierSeries", {}, function (rr) {
          return (rr.borrowedNow ? "先談妥借船，多用一天。 " : "") +
            (rr.count === 1
              ? "同一趟雙視角紀錄已完成並收卷：R" + rr.record.id + "。"
              : "已依同一方案連做 " + rr.count + " 回並收卷：" +
                rr.records.map(function (row) { return "R" + row.id; }).join("、") + "。");
        });
      }, "shipAction primary", guidedSeriesComplete);
      runButton.setAttribute("data-ship-focus", "run-deck-record");
    }
    if (d.records.length) {
      var scopeProgress = window.GB && window.GB.Engine3 &&
        typeof window.GB.Engine3.getDossierScopeProgress === "function"
        ? window.GB.Engine3.getDossierScopeProgress(d)
        : { speedBands: [], vesselIds: [] };
      var testedSpeeds = scopeProgress.speedBands || [];
      if (testedSpeeds.length) {
        var scope = ship3El("section", null, notebookPage, "shipDossierScopeTracker");
        ship3El("b", "這個結果已在哪些船速下重現？", scope);
        ["slow", "mid", "fast"].forEach(function (speedBand) {
          ship3El("span", (testedSpeeds.indexOf(speedBand) >= 0 ? "✓ " : "○ ") +
            ({ slow:"慢槳", mid:"半槳", fast:"滿槳" }[speedBand]), scope,
            testedSpeeds.indexOf(speedBand) >= 0 ? "got" : "");
        });
        ship3El("small", "多試一種船速，只能讓這句話多涵蓋一種船速；不會讓落點改到另一邊。", scope);
      }
      var testedVessels = scopeProgress.vesselIds || [];
      if (testedVessels.length) {
        var vesselScope = ship3El("section", null, notebookPage, "shipDossierScopeTracker");
        ship3El("b", "哪些船做過完整的解纜起步實驗？", vesselScope);
        ["small", "captain", "large"].forEach(function (vesselId) {
          ship3El("span", (testedVessels.indexOf(vesselId) >= 0 ? "✓ " : "○ ") +
            ship3DossierVesselSpec(vesselId).name, vesselScope,
            testedVessels.indexOf(vesselId) >= 0 ? "got" : "");
        });
        ship3El("small",
          "每艘船的原紙都會留下船名、桅高、船員和槳法。把做過的船逐欄比較，再決定主張寫到哪裡。",
          vesselScope);
      }
    }
    var currentAssertion = ship3DossierCurrentAssertionId(d, mission.id);
    renderShipDossierCandidates(notebookPage, d, mission.id);
    renderShipDossierLedger(notebookPage, d, currentAssertion);
    renderShipDossierClaimSubmit(notebookPage, d, mission.id);
  }
  var SHIP3_DOSSIER_PILLARS = [
    { id: "p1", ordinal: "第一柱", title: "共同前行", purpose: "走穩時為何不落後" },
    { id: "p2", ordinal: "第二柱", title: "前進與變速", purpose: "舊紙能說到哪裡" },
    { id: "p3", ordinal: "第三柱", title: "同石兩紙", purpose: "兩個原點如何換算" }
  ];
  function ship3DossierAllPillarsDone(db) {
    return SHIP3_DOSSIER_PILLARS.every(function (pillar) {
      return !!(db.pillars && db.pillars[pillar.id]);
    });
  }
  function ship3DossierNextPillar(db) {
    return SHIP3_DOSSIER_PILLARS.find(function (pillar) {
      return !(db.pillars && db.pillars[pillar.id]);
    }) || null;
  }
  function ship3DossierEvidenceOwned(d, id) {
    if (id === "dual-papers" || /^dual-papers:\d+$/.test(id || ""))
      return d.records.some(ship3DossierP3Eligible);
    if (id === "old-paper") return true;
    if (id === "cabin-pair") return !!(d.blind && d.blind.ran);
    return !!(d.assertions && d.assertions[id]);
  }
  function ship3DossierPacketSourceIds(d, id) {
    var stored = d.assertionSources && d.assertionSources[id] ||
      d.claimSelections && d.claimSelections[id] || [];
    if (stored.length) return stored.map(String);
    if (id === "A2")
      return (d.blind && d.blind.records || []).map(function (row) { return row.id; });
    if (id === "A6") return ["舊紙"];
    /*
     * Fail closed：斷言成立不等於 UI 可以重猜它當初用了哪幾張紙。
     * 舊存檔若缺 assertionSources／claimSelections，明示「尚未綁定」；
     * 不得按 stage 把同類所有原紙冒充成這一題的來源。
     */
    return [];
  }
  function ship3DossierDebateEvidenceCatalog(d) {
    var packets = window.GB && window.GB.Engine3 &&
      window.GB.Engine3.getDossierEvidenceCatalog
      ? window.GB.Engine3.getDossierEvidenceCatalog(d) : [];
    return packets.map(function (packet) {
      var sourceId = packet.id.indexOf("dual-papers:") === 0 ? null : packet.id;
      var ids = sourceId ? ship3DossierPacketSourceIds(d, sourceId) : [];
      packet.paperIds = ids.length ? "所含原紙：" + ids.join("、") : "";
      return packet;
    });
  }
  function ship3DossierFindPacket(d, id) {
    var normalized = id === "dual-papers" ? "dual-papers:" : id;
    return ship3DossierDebateEvidenceCatalog(d).find(function (packet) {
      return normalized === "dual-papers:"
        ? packet.id.indexOf(normalized) === 0
        : packet.id === normalized;
    }) || null;
  }
  function ship3DossierPacketVisualCode(id) {
    if (String(id || "").indexOf("dual-papers") === 0) return "G4";
    return { A1:"G1", A2:"G2", A3:"G3", A6:"S5", S4:"G3" }[id] || null;
  }
  function ship3DossierFillPacketCard(card, packet) {
    var visualCode = ship3DossierPacketVisualCode(packet.id);
    var visual = visualCode && ASSETS && ASSETS.evidenceVisual &&
      ASSETS.evidenceVisual[visualCode];
    var visualItem = visual && visual.items && visual.items[0];
    var visualEntry = visualItem && visualItem.asset && assetEntry(visualItem.asset);
    if (visualEntry) {
      var image = document.createElement("img");
      image.className = "shipDossierEvidenceThumb";
      image.src = assetUrl(visualEntry);
      image.alt = visualItem.alt || packet.title;
      image.loading = "lazy";
      card.appendChild(image);
    }
    ship3El("small", packet.kicker, card);
    ship3El("b", packet.title, card);
    ship3El("span", packet.condition, card, "shipDossierEvidenceCondition");
    ship3El("span", packet.scope, card, "shipDossierEvidenceScope");
  }
  function ship3DossierAppendPacketDetails(parent, packet) {
    var details = ship3El("details", null, parent, "shipDossierEvidenceDetails");
    ship3El("summary", "查看條件與原紙", details);
    ship3El("span", packet.variables, details, "shipDossierEvidenceVariables");
    if (packet.paperIds)
      ship3El("span", packet.paperIds, details, "shipDossierEvidenceIds");
  }
  function renderShipDossierEvidenceChoices(work, d, onchoose) {
    ship3El("p", "卷宗裡目前可用的資料全部攤開。先看條件與範圍，再選真正回答這一問的那組紙。",
      work, "shipNote shipDossierEvidenceInstruction");
    var hand = ship3El("div", null, work, "evidenceHand shipDossierEvidenceHand");
    ship3DossierDebateEvidenceCatalog(d).forEach(function (packet) {
      var option = ship3El("div", null, hand, "shipDossierEvidenceOption");
      var button = ship3Btn(option, "", function () { onchoose(packet.id); },
        "evidenceCard shipDossierEvidenceCard");
      button.setAttribute("aria-label",
        packet.title + "；" + packet.condition + "；" + packet.variables + "；" + packet.scope);
      button.setAttribute("data-ship-focus", "debate-evidence-" + packet.id);
      ship3DossierFillPacketCard(button, packet);
      ship3DossierAppendPacketDetails(option, packet);
    });
  }
  function renderShipDossierActiveEvidence(work, d, id, label) {
    var packet = ship3DossierFindPacket(d, id);
    if (!packet) return;
    var section = ship3El("section", null, work, "shipDossierActiveEvidence");
    ship3El("small", label || "本題正在引用", section);
    var card = ship3El("div", null, section, "shipDossierEvidenceCard isCurrent");
    ship3DossierFillPacketCard(card, packet);
    ship3DossierAppendPacketDetails(section, packet);
  }
  function ship3DossierRecordsForQuestion(d, stage, assertionId) {
    var ids = ship3DossierPacketSourceIds(d, assertionId).map(function (id) {
      return String(id).replace(/^R/i, "");
    });
    if (!ids.length) return [];
    return (d.records || []).filter(function (record) {
      if (!record.filed || record.stage !== stage) return false;
      return ids.indexOf(String(record.id)) >= 0;
    });
  }
  function renderShipDossierQuestionPapers(work, d, kind) {
    var section = ship3El("section", null, work, "shipDossierQuestionPapers");
    ship3El("small", "現在判讀的紙", section);
    if (kind === "old") {
      ship3El("h4", "維達爾船長的舊紙｜八年前的一次落點", section);
      var oldCard = ship3El("div", null, section, "shipDossierQuestionPaper");
      ship3El("b", "舊紙｜只記落在桅後", oldCard);
      ship3El("span", "船況：未記｜觀察位置：未記｜船速欄：空白", oldCard);
      ship3El("span", "這張紙不能被今天的資料補寫，只能保留在「船況不明」。", oldCard);
      return section;
    }
    var assertionId = kind === "steady" ? "A1" : "A3";
    var records = ship3DossierRecordsForQuestion(d, kind, assertionId);
    ship3El("h4", kind === "steady"
      ? "走穩岸紙｜看相鄰鼓點的岸標間距"
      : "解纜起步岸紙｜看相鄰鼓點的岸標間距", section);
    var list = ship3El("div", null, section, "shipDossierQuestionPaperList");
    if (!records.length) {
      ship3El("p", "這一題的原紙尚未綁定，請先在卷宗選紙。", list,
        "shipNote warning");
      return section;
    }
    records.forEach(function (record) {
      var card = ship3El("div", null, list, "shipDossierQuestionPaper");
      ship3El("b", "原紙 R" + record.id + "｜" +
        (kind === "steady" ? "出港平駛" : "解纜起步"), card);
      ship3El("span", "觀察位置：岸上｜放手：門閂｜同石、同高", card);
      ship3El("span", "岸標間距：" +
        ((record.shoreGaps || []).map(ship3DossierNumber).join(" → ") || "未記"), card);
      ship3El("span", "落點：" +
        (record.landing === "aft" ? "桅後" : record.landing === "fore" ? "桅前" : "桅腳附近"), card);
    });
    return section;
  }
  function renderShipDossierDebateTrack(work, db) {
    var track = ship3El("div", null, work, "debatePillars shipDossierDebateTrack");
    SHIP3_DOSSIER_PILLARS.forEach(function (pillarDef, index, pillars) {
      var unlocked = index === 0 || db.pillars[pillars[index - 1].id];
      var pillar = ship3El("div", null, track,
        "debatePillar " + (db.pillars[pillarDef.id] ? "isBroken" :
          (db.current === pillarDef.id ? "isCurrent" : (!unlocked ? "isLocked" : ""))));
      ship3El("span", pillarDef.ordinal + (!unlocked ? "・尚未解鎖" : ""), pillar);
      ship3El("b", pillarDef.title, pillar);
      ship3El("small", pillarDef.purpose, pillar);
    });
    var meter = ship3El("div", null, track, "debateMeter");
    ship3El("b", "論證對位", meter);
    ship3El("span", "●".repeat(db.rep) + "○".repeat(Math.max(0, 5 - db.rep)), meter);
  }
  function renderShipDossierDebate(work, d) {
    var db = d.debate;
    work.classList.add("debateBoard", "shipDossierDebateBoard");
    renderShipDossierDebateTrack(work, db);
    var head = ship3El("div", null, work, "shipDebateBar");
    ship3El("b", "每柱只做會改變推論的事：選紙、收邊界，或親手換算。", head);
    ship3Btn(head, "辯論備忘", function () {
      emit("bd:open-debate-help", { chapter: "ch3" });
    }, "shipAction");
    ship3Btn(head, "先回船上補證據", function () {
      doShip("leaveDossierDebate", { pin: db.current ? "尚未回答：" + db.current : null },
        "✓ 已回到船上；原紙、斷言和已答完的柱都會保留。");
      ship3DossierTab = "mast";
    }, "shipAction");
    if (db.visits === 1 && !db.attempts.length &&
        !SHIP3_DOSSIER_PILLARS.some(function (pillar) { return db.pillars[pillar.id]; })) {
      var intro = ship3El("section", null, work, "shipDebateIntro");
      ship3El("p", "船靠回石碼頭。馬蒂厄把封好的原紙一張張掛上木板；商人和槳手已在舊紙前爭了起來。", intro);
      ship3El("p", "商人：「第一張明明落在後面。」", intro);
      ship3El("p", "槳手：「後來那幾張又在桅腳。總不能都算對吧？」", intro);
      ship3El("p", "維達爾船長：（把舊紙壓在木板中央）「這幾天我留在岸上，也沒先看結果。今天你說的每一句，我都會追問。」", intro);
      ship3El("p", "伽桑狄：（把卷宗交回旅人）「紙都在。照他的問題，一張一張拿紙回答。」", intro);
    }
    if (db.lastPlayerLine) {
      var playerLine = ship3El("div", null, work, "shipDossierPlayerLine");
      var playerSpeaker = ship3El("b", "旅人（你）", playerLine);
      playerSpeaker.setAttribute("aria-label", "旅人說");
      ship3El("p", "「" + db.lastPlayerLine + "」", playerLine);
    }
    var reply = ship3El("blockquote", db.lastReply || "維達爾船長等著你的回答。", work, "shipDossierReply");
    reply.setAttribute("aria-live", "polite");
    if (db.lastOS) {
      var osBox = ship3El("div", null, work, "shipDossierOS");
      var osSpeaker = ship3El("b", "旅人（你）", osBox);
      osSpeaker.setAttribute("aria-label", "旅人心裡想");
      ship3El("p", db.lastOS, osBox);
      osBox.setAttribute("aria-live", "polite");
    }
    if (db.entryBlocked) {
      ship3El("h3", "這次辯論先停在這裡", work);
      ship3El("p", db.entryBlocked === "one-run"
        ? "一回可以留下紀錄，卻還不能說它會反覆出現。"
        : (db.entryBlocked === "two-runs"
          ? "二回已經看見相同結果，但還少一回來檢查它是不是巧合。"
          : "原紙已經留下，但還不足以證明你想說的那句話。"), work, "shipNote warning");
      ship3Btn(work, "帶著這個問題回船上", function () {
        doShip("leaveDossierDebate", { pin: "重複次數或斷言仍不足" },
          "維達爾船長：「知道缺哪張紙，比拿錯紙硬撐有用。去吧。」");
      }, "shipAction primary");
      return;
    }
    if (!db.current) {
      if (ship3DossierAllPillarsDone(db)) {
        ship3DossierP3PaperMath(work, d, true);
        ship3El("h3", "結果欄｜這艘船到底量到哪裡？", work);
        [
          ["overclaim", "這次落石沒有落後，所以這場實驗也證明地球正在運動"],
          ["honest", "這場實驗排除了「船一前進，落石就一定落後」；它沒有直接量到地球運動"],
          ["all-motion-hidden", "停泊和平駛在船艙裡看起來相同，所以船上連加速、減速也都分不出來"]
        ].forEach(function (o) {
          ship3Btn(work, o[1], function () {
            doShip("setDossierFinalBoundary", { choice: o[0] },
              o[0] === "honest" ? "◆ 結果欄已改好；船長願意在這句下面簽名。" : null,
              o[0] === "overclaim" ? "伽桑狄：「停。我們量的是船上的落石，不是地球有沒有動。」" :
                "維達爾船長：「加速與減速都在船上，明明分得出來。」");
          }, "shipAction");
        });
      } else {
        var nextDef = ship3DossierNextPillar(db);
        var next = nextDef && nextDef.id;
        ship3El("h3", "下一柱已排好", work);
        ship3El("p", "先把這一柱答完，下一柱才接得上。", work, "shipNote shipStepPrompt");
        ship3Btn(work, "繼續" + nextDef.ordinal, function () {
          doShip("selectDossierPillar", { pillar: next }, "✓ 下一柱已推到木板中央。");
        }, "shipAction primary");
      }
      return;
    }
    if (db.current === "p1") {
      ship3El("h3", "第一柱｜共同前行", work);
      if (!db.p1.source) {
        ship3El("p", "哪組紙記到：船走穩時，石頭鬆手後沒有落在桅後？", work, "shipNote shipStepPrompt");
        renderShipDossierEvidenceChoices(work, d, function (id) {
          doShip("answerDossierDebate", { pillar: "p1", step: "source", choice: id });
        });
      } else if (!db.p1.concept) {
        renderShipDossierActiveEvidence(work, d, "A1", "已引用｜走穩三回岸紙");
        ship3El("p", "門閂打開時，哪一樣被拿掉？哪一樣沒有被擦掉？", work,
          "shipNote shipStepPrompt");
        [
          ["motion-resets", "門閂一開，石頭所有運動都重新從零開始"],
          ["stone-chases", "石頭離手後，會自己追著往前的桅杆"],
          ["shared-motion", "門閂只撤掉托住石頭的東西；石頭原先跟船共有的前行沒有被擦掉"]
        ].forEach(function (option) {
          ship3Btn(work, option[1], function () {
            doShip("answerDossierDebate", { pillar: "p1", step: "concept", choice: option[0] });
          }, "shipAction");
        });
      } else if (!db.p1.cabin) {
        renderShipDossierActiveEvidence(work, d, "A1", "已回答｜門閂沒有抹掉原有前行");
        ship3El("p", "槳手追問：哪組紙把甲板風隔開，仍能比較停泊與平駛？", work, "shipNote shipStepPrompt");
        renderShipDossierEvidenceChoices(work, d, function (id) {
          doShip("answerDossierDebate", { pillar: "p1", step: "cabin", choice: id });
        });
      } else if (!db.p1.wind && !(d.designCommitments &&
          d.designCommitments.cabinWind === "close-cabin")) {
        renderShipDossierActiveEvidence(work, d, "A2", "現在引用｜封閉船艙六回對照");
        ship3El("p", "這組紙隔開了甲板風；你最多能把結論寫到哪裡？", work,
          "shipNote shipStepPrompt");
        [
          ["limited-wind", "甲板風影響多少還不能說；但隔開它後，石頭仍不一定落後"],
          ["wind-never-matters", "甲板風在這類落石裡永遠不會改變結果"],
          ["wind-proved-false", "這六回已經徹底排除風的影響"]
        ].forEach(function (option) {
          ship3Btn(work, option[1], function () {
            doShip("answerDossierDebate", {
              pillar: "p1", step: "wind", choice: option[0]
            });
          }, "shipAction");
        });
      }
    } else if (db.current === "p2") {
      ship3El("h3", "第二柱｜前進與變速", work);
      if (!db.p2.source) {
        ship3El("p", "先挑一張同時寫了船速變化與落點的原紙。", work, "shipNote shipStepPrompt");
        renderShipDossierEvidenceChoices(work, d, function (id) {
          doShip("answerDossierDebate", { pillar: "p2", step: "source", choice: id });
        });
      } else if (!db.p2.boundary) {
        renderShipDossierActiveEvidence(work, d, "A3", "今天的對照紙｜只能回答今天");
        renderShipDossierQuestionPapers(work, d, "old");
        ship3El("p", "今天的資料，能不能補上舊紙缺的船速？", work, "shipNote shipStepPrompt");
        [
          ["prove-old-accelerating", "今天的變快紙和舊紙都偏後，所以舊航次可以放進「變快」"],
          ["discard-old", "舊紙少了船速，不能和今天的資料比較，應該從卷宗拿掉"],
          ["same-pattern-not-proof", "它和今天的變快紙很像；但船速沒記，只能保留在「船況不明」"]
        ].forEach(function (o) { ship3Btn(work, o[1], function () {
          doShip("answerDossierDebate", { pillar: "p2", step: "boundary", choice: o[0] });
        }, "shipAction"); });
      } else {
        if (db.p2.scopeDiagnosis === "required") {
          ship3El("p", "從三張原紙的條件欄選出：除了桅高，還有哪些也跟著換了？",
            work, "shipNote shipStepPrompt");
          [
            ["height-only", "只有桅高；其他條件都一樣"],
            ["vessel-crew-method", "船本身、操船的人和槳法"],
            ["release-stone-repeats", "放手的人、石頭和重複回數"]
          ].forEach(function (o) { ship3Btn(work, o[1], function () {
            doShip("answerDossierDebate", {
              pillar: "p2", step: "scope-diagnosis", choice: o[0]
            });
          }, "shipAction"); });
        } else {
          ship3El("p", "槳手把幾張原紙並排，指著條件欄：「你到底試過哪幾艘？這句話最多能說到哪裡？」",
            work, "shipNote shipStepPrompt");
          var scopeChoices = window.GB.Engine3.getDossierScopeOptions(d);
          scopeChoices.forEach(function (o) { ship3Btn(work, o.text, function () {
            doShip("answerDossierDebate", { pillar: "p2", step: "scope", choice: o.choice }, null,
              function (rr) {
                if (rr.reason === "confounded")
                  return "這句因果還不能成立。回到原紙條件欄，看看除了桅高，還有哪些項目也一起變了。";
                if (rr.reason === "overclaim")
                  return "這句話寫到了卷宗以外；先把範圍收回實際做過的船。";
                return null;
              });
          }, "shipAction"); });
        }
      }
    } else if (db.current === "p3") {
      ship3El("h3", "第三柱｜同一顆石頭，兩張紙", work);
      if (db.p3.source) ship3DossierP3PaperMath(work, d, false);
      if (!d.records.some(function (r) { return r.dualPapers; }))
        ship3El("p", "你還沒有一組岸上與船上同步原紙。可以先讓質疑留下，再回船補做。", work, "shipNote warning");
      if (!db.p3.source) {
        ship3El("p", "先挑出要在群眾面前一起檢查的兩張原紙。", work, "shipNote shipStepPrompt");
        renderShipDossierEvidenceChoices(work, d, function (id) {
          doShip("setDossierP3Premise", { step: "source", choice: id });
        });
      } else if (!db.p3.question) {
        ship3El("p", "兩張紙看起來不同。比較之前，第一件該確認什麼？", work,
          "shipNote shipStepPrompt");
        [
          ["trust-recorder", "先決定岸上或船上的紀錄者誰比較可靠"],
          ["pick-straight", "先選看起來比較直、比較順的那條線"],
          ["same-time-transform", "先確認兩張紙記的是同一事件、同一時刻"]
        ].forEach(function (option) { ship3Btn(work, option[1], function () {
          doShip("setDossierP3Premise", { step: "question", choice: option[0] });
        }, "shipAction"); });
      } else if (!db.p3.concept) {
        var rulerClue = ship3El("section", null, work, "shipNote shipP3RulerClue");
        ship3El("p", "艾蒂安：『我的尺從碼頭柱量起。』", rulerClue);
        ship3El("p", "馬蒂厄：『我的尺從桅腳量起；船走到哪裡，零點就跟到哪裡。』", rulerClue);
        ship3El("p", "同一趟、同一號鼓點都確認了。兩張線仍不同，真正換掉的是什麼？", work,
          "shipNote shipStepPrompt");
        [
          ["paper-angle", "只是兩張紙擺放的角度不同"],
          ["force", "石頭在岸上紙和船上紙受到不同的力"],
          ["reference", "量位置的起點不同：岸上用碼頭，船上用桅杆"]
        ].forEach(function (option) { ship3Btn(work, option[1], function () {
          doShip("setDossierP3Premise", { step: "concept", choice: option[0] });
        }, "shipAction"); });
      } else if (!db.p3.aligned) {
        ship3El("p", "先把兩張原紙上的同一時刻對在一起。", work, "shipNote shipStepPrompt");
        [
          ["endpoints", "各自終點對終點"], ["same-height", "相同高度對齊"],
          ["same-beats", "同號鼓點對齊"]
        ].forEach(function (o) { ship3Btn(work, o[1], function () {
          doShip("alignDossierPapers", { choice: o[0] }, o[0] === "same-beats" ? "◆ 同號鼓點已對上；兩張紙現在指向同一時刻。" : null);
        }, "shipAction"); });
      } else if (!db.p3.scope) {
        ship3El("p", "同號鼓點已對上。這一步現在能證明到哪裡？", work,
          "shipNote shipStepPrompt");
        [
          ["same-path-proved", "同號鼓點對上，就已經證明兩張紙畫的是同一條路"],
          ["shore-paper-wins", "同號鼓點對上，所以岸紙比船紙可靠"],
          ["same-event-time-only", "只證明兩張紙記的是同一事件、同一時刻；還沒說明位置怎麼互換"]
        ].forEach(function (option) { ship3Btn(work, option[1], function () {
          doShip("setDossierP3Premise", { step: "scope", choice: option[0] });
        }, "shipAction"); });
      } else if (!db.p3.transformMode) {
        ship3El("p", ship3ExploreMode()
          ? "同號鼓點已經對上。哪一種做法真的能把岸紙改成從桅杆量？"
          : "同號鼓點已經對上。要怎麼把岸紙改成和船紙使用同一個位置起點？",
          work, "shipNote shipStepPrompt");
        [
          ["translate-once", "整張紙只平移一次"],
          ["subtract-each-beat", "每拍扣掉桅杆當拍的位置"],
          ["rotate-paper", "把紙旋轉到彎線看起來垂直"]
        ].forEach(function (o) { ship3Btn(work, o[1], function () {
          doShip("transformDossierPapers", { choice: o[0] }, o[0] === "subtract-each-beat"
            ? "✓ 方法已選定。現在逐拍移尺，四拍都對上才成立。" : null);
        }, "shipAction"); });
      } else if (!db.p3.transformed) {
        var p3Record = ship3DossierP3Record(d);
        var p3ShoreBeats = p3Record && p3Record.papers && p3Record.papers.shore.beats || [];
        var p3Index = (db.p3.transformedPoints || []).length;
        var p3Point = p3ShoreBeats[p3Index];
        if (p3Point) {
          if (ship3P3BeatDraft.beat !== p3Point.beat) {
            ship3P3BeatDraft.beat = p3Point.beat;
            ship3P3BeatDraft.value = 0;
          }
          ship3El("p", "現在只做第 " + (p3Index + 1) + "／" + p3ShoreBeats.length +
            " 拍。岸紙石頭在 " + ship3DossierNumber(p3Point.stoneX) +
            " 格；把岸紙的零點移到同拍桅杆記號。", work, "shipNote shipStepPrompt");
          var p3Control = ship3El("section", null, work, "shipP3BeatControl");
          var p3Label = ship3El("label", "尺往回移幾格？", p3Control);
          var p3Slider = document.createElement("input");
          var mastXs = p3ShoreBeats.map(function (point) { return Number(point.mastX); });
          p3Slider.type = "range";
          p3Slider.min = String(Math.floor(Math.min.apply(null, mastXs) - 1));
          p3Slider.max = String(Math.ceil(Math.max.apply(null, mastXs) + 1));
          p3Slider.step = "0.01";
          p3Slider.value = String(ship3P3BeatDraft.value);
          p3Slider.className = "shipP3BeatSlider";
          p3Slider.setAttribute("aria-label", "第 " + p3Point.beat + " 號鼓點，尺往回移的格數");
          p3Control.appendChild(p3Slider);
          var p3Readout = ship3El("output", null, p3Control, "shipP3BeatReadout");
          var updateP3Readout = function () {
            ship3P3BeatDraft.value = Number(p3Slider.value);
            p3Readout.textContent = "岸紙石頭 " + ship3DossierNumber(p3Point.stoneX) +
              " － 移尺 " + ship3DossierNumber(ship3P3BeatDraft.value) +
              " ＝ " + ship3DossierNumber(Number(p3Point.stoneX) - ship3P3BeatDraft.value) + " 格";
          };
          p3Slider.oninput = updateP3Readout;
          updateP3Readout();
          var p3Apply = ship3Btn(p3Control, "把這一拍寫到換尺紙", function () {
            doShip("transformDossierPaperBeat", {
              beat: p3Point.beat, appliedMastX: Number(p3Slider.value)
            }, function (rr) {
              return rr.completed
                ? "◆ 四拍都對上：同一事件換了位置起點，沒有換成另一條路。"
                : "✓ 第 " + p3Point.beat + " 號鼓點已對上；前一拍留在紙上，繼續下一拍。";
            });
          }, "shipAction primary");
          p3Apply.setAttribute("data-ship-focus", "p3-transform-beat-" + p3Point.beat);
        }
      }
    } else {
      ship3El("h3", "這一柱尚未定義", work);
      ship3El("p", "柱列可以隨劇情增加，但每一柱仍須先定義追問、可用證據與失敗回饋。",
        work, "shipNote warning");
    }
  }
  function renderShipDossier(v, box) {
    var ek = v.scene + "/" + v.nodeId;
    if (ek !== ship3EmbedKey) {
      ship3EmbedKey = ek; ship3Msg = ""; ship3DossierTab = "mast";
      ship3DossierHintOpen = false; ship3DossierHintMissionId = ""; ship3DossierDiagnosis = "";
      ship3DossierDiagnosisReason = ""; ship3DossierDiagnosisRepeats = 0;
    }
    var lab = state.lab, d = lab.caseFile.dossier;
    box.className = "shipLab shipCaseLab shipDossierLab";
    var head = ship3El("header", null, box, "shipHead");
    ship3El("small", "第三章・航船實驗卷宗", head);
    ship3El("h2", d.page === "debate" ? "把紙帶上碼頭" : "讓原紙替斷言說話", head);
    ship3El("p", d.page === "debate"
      ? "三問各做一件事：用原紙說明共同前行、替舊紙守住證據邊界、把同一事件的兩個參考原點換算回來。"
      : "對白會留下疑問。進工作台後，先設計並收紙；再選一句斷言，拿可追溯的原紙支持它。", head);
    var chips = ship3El("div", null, head, "shipEvidenceChips shipDossierChips");
    var paperCount = d.records.length + ((d.blind && d.blind.records || []).length) + 1;
    var assertionCount = ["A1", "A2", "A3", "A6", "S1", "S4"].filter(function (id) {
      return d.assertions[id];
    }).length;
    ship3El("span", "原紙 " + paperCount + " 張", chips, paperCount > 1 ? "got" : "");
    ship3El("span", "斷言 " + assertionCount + " 句", chips, assertionCount > 1 ? "got" : "");
    ship3El("span",
      "碼頭待辦：" + (d.assertions.A4 ? "✓ 對齊時刻" : "○ 對齊時刻") +
      "・" + (d.assertions.A5 ? "✓ 逐拍改用桅杆量" : "○ 逐拍改用桅杆量"),
      chips, d.assertions.A4 && d.assertions.A5 ? "got" : "");
    var body = ship3El("div", null, box, "shipBody shipDossierBodyWide");
    var work = ship3El("section", null, body, "shipWork shipCaseWork shipDossierWork");
    if (d.page === "debate") renderShipDossierDebate(work, d);
    else renderShipDossierLab(work, d);
    var msg = ship3El("p", ship3Msg || (d.page === "debate"
      ? "可以先回船補做；已答完的柱和卷宗裡的紙都會保留。"
      : "條件沒控制好，原紙也會留下。看清缺口，再改下一趟。"), work, "shipMessage");
    msg.setAttribute("role", "status");
    if (!ship3ExploreMode() && ship3DossierDiagnosis) {
      var diagnosis = ship3El("details", null, work, "shipDossierDiagnosis");
      diagnosis.open = ship3DossierDiagnosisRepeats > 1;
      ship3El("summary", "查看卷宗診斷", diagnosis);
      ship3El("p", ship3DossierDiagnosis, diagnosis, "shipNote");
    }
    if (N.embedReady(state)) ship3Btn(work, "▶ 收好卷宗，回到故事", function () {
      var r = N.embedComplete(state);
      if (r.error) { ship3Msg = "✕ " + r.error; renderAll(); return; }
      setState(r.state); ship3Msg = ""; renderAll();
    }, "shipGate primary");
  }
  function renderShip(v, box) {
    if (v.phase === "dossier") {
      renderShipDossier(v, box);
      return;
    }
    if (v.phase === "case-voyage" || v.phase === "case-dual" || v.phase === "case-public") {
      renderShipCase(v, box);
      return;
    }
    var ek = v.scene + "/" + v.nodeId;
    if (ek !== ship3EmbedKey) { ship3EmbedKey = ek; ship3Msg = ""; }
    var lab = state.lab, ev = lab.evidence || {}, mission = ship3Mission(v.phase);
    var showPerspectiveIntro = v.phase === "overlay" && !ship3PerspectiveIntroSeen[ek];
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
    if (showPerspectiveIntro || v.phase === "dual-design") ship3PerspectiveIntro(visual);
    else ship3Diagram(visual, lab, v.phase);
    var work = ship3El("section", null, body, "shipWork");

    if (showPerspectiveIntro) {
      ship3El("h3", "六、同一顆石頭，先站到兩個位置", work);
      ship3El("p", "先別急著看紙帶。比較左、右兩張圖：哪一樣東西在你的畫面裡被當成不動？", work, "shipNote shipStepPrompt");
      ship3El("p", "岸上的人用碼頭量位置；船上的人用桅杆量位置。下一幕會把兩人的觀察各抄成一張紙。", work, "shipNote");
      ship3Btn(work, "開始對照兩張紙", function () {
        ship3PerspectiveIntroSeen[ek] = true;
        ship3Msg = "";
        renderAll();
      }, "shipAction primary");
    }

    if (v.phase === "pilot-design") {
      ship3El("h3", "一、第一趟只能先顧一件事", work);
      ship3El("p", "維達爾船長桌上已有一筆「石頭落在桅後」的舊紀錄。今天人手有限，你不能一次把所有疑點都消掉。先決定最想排除哪一個解釋。", work, "shipNote shipStepPrompt");
      var pilot = lab.design.pilot;
      var pilotChoices = [
        ["release", "顧放手｜用門閂，先排除手推"],
        ["speed", "顧船速｜把每拍船位記下來"],
        ["repeat", "顧重複｜同一做法連跑三次"]
      ];
      var pilotGrid = ship3El("div", null, work, "shipChoiceGrid");
      pilotChoices.forEach(function (choice) {
        ship3Btn(pilotGrid, (pilot.focus === choice[0] ? "✓ " : "") + choice[1], function () {
          doShip("choosePilotFocus", { focus: choice[0] }, "已把有限人手放在這一項；現在讓方案真正跑一次。");
        }, "shipAction " + (pilot.focus === choice[0] ? "active" : ""), false);
      });
      if (pilot.focus) ship3Btn(work, "執行這趟試航", function () {
        doShip("runPilot", {}, function (rr) {
          return "試航留下 " + rr.rows.length + " 筆紀錄。它不是失敗；缺口會告訴你下一趟該補什麼。";
        });
      }, "shipAction primary", !!pilot.rows.length);
      if (pilot.rows.length) {
        ship3Table(work, ["紀錄", "放手", "船速", "相對桅腳", "可回答的事"], pilot.rows.map(function (r) {
          return [r.id, r.release === "latch" ? "門閂" : "手放",
            r.speed === "accelerating" ? "正在加速" : "未量",
            (r.offset > 0 ? "+" : "") + r.offset.toFixed(2),
            r.clean ? "放手乾淨" : "放手仍可能擾動"];
        }));
        ship3El("p", "哪一個解釋仍然不能靠這趟紀錄排除？", work, "shipNote shipStepPrompt");
        var gapGrid = ship3El("div", null, work, "shipChoiceGrid");
        [["release", "可能是放手多推了一下"], ["speed", "可能是船速仍在改變"], ["repeat", "可能只是一次巧合"]].forEach(function (gap) {
          ship3Btn(gapGrid, gap[1], function () {
            doShip("diagnosePilot", { gap: gap[0] }, "✓ 你找到仍沒被排除的解釋。下一趟要把這個缺口寫進分工。");
          });
        });
      }
    }

    if (v.phase === "protocol") {
      ship3El("h3", "二、五件工作，五個位置", work);
      ship3El("p", "先看每個人能站哪裡、能做什麼，再安排五件工作。重點不是猜名字，而是讓放手、計時、兩邊觀察與船況彼此獨立。", work, "shipNote shipStepPrompt");
      var protocol = lab.design.protocol;
      var persons = ["mathieu", "sailor", "etienne", "gassendi", "traveler", "captain"];
      var personLabels = {
        mathieu: "馬蒂厄", sailor: "水手", etienne: "艾蒂安",
        gassendi: "伽桑狄", traveler: "旅人（你）", captain: "維達爾船長"
      };
      var crewBrief = ship3El("div", null, work, "shipCrewBrief");
      [
        ["馬蒂厄", "留在桅頂，只操作門閂並報放手時刻。"],
        ["水手", "守在甲板，能維持等節拍鼓。"],
        ["艾蒂安", "帶岸標紙留在碼頭，記每拍船位。"],
        ["伽桑狄／旅人", "其中一人留船上，記石頭相對桅杆的落點。"],
        ["維達爾船長", "掌舵並下加槳、收槳命令，控制船況。"]
      ].forEach(function (crew) {
        var card = ship3El("div", null, crewBrief, "shipCrewCard");
        ship3El("b", crew[0], card);
        ship3El("span", crew[1], card);
      });
      var slots = [
        ["release", "桅頂抽閂"],
        ["clock", "甲板敲等節拍鼓"],
        ["shore", "岸上記每拍船位"],
        ["ship", "船上記落點"],
        ["vessel", "控制船況"]
      ];
      var slotLabels = {
        release: "桅頂抽閂", clock: "甲板敲等節拍鼓", shore: "岸上記每拍船位",
        ship: "船上記落點", vessel: "控制船況"
      };
      var roleFailures = {
        release: "抽閂者必須留在桅頂；這件事已交給馬蒂厄。",
        clock: "等節拍鼓要由能守在甲板的水手負責。",
        shore: "岸標紙在碼頭，必須由留在岸上的艾蒂安記。",
        ship: "船上落點要由伽桑狄或旅人記，不能讓桅頂或岸上的人兼任。",
        vessel: "只有維達爾船長能持續掌舵並控制加槳、收槳。"
      };
      var assignmentsBox = ship3El("div", null, work, "shipProtocolAssignments");
      slots.forEach(function (slot) {
        var rowP = ship3El("div", null, assignmentsBox, "shipRow shipProtocolRow");
        ship3El("label", slot[1], rowP);
        var choicesP = [""].concat(persons);
        var labelsP = Object.assign({ "": "選一位" }, personLabels);
        var pickP = ship3Select(rowP, choicesP, labelsP, protocol.assignments[slot[0]] || "");
        pickP.setAttribute("aria-label", slot[1] + "負責人");
        var assignP = ship3Btn(rowP, protocol.assignments[slot[0]] ? "更換" : "安排", function () {
          doShip("setProtocolAssignment", { slot: slot[0], person: pickP.value },
            "已記下分工；封存前仍可調整。");
        }, "shipAction", !pickP.value);
        pickP.onchange = function () { assignP.disabled = !pickP.value; };
      });
      if (!protocol.locked) ship3Btn(work, "集合點名：試走並封存分工", function () {
        doShip("lockProtocol", {}, "✓ 沒有人分身，每個觀察位置都有獨立紀錄者。");
      }, "shipAction primary");
      if (protocol.attempts.length) {
        var latestProtocol = protocol.attempts[protocol.attempts.length - 1];
        var attemptBox = ship3El("div", null, work, "shipNote shipProtocolAttempt " + (latestProtocol.ok ? "ok" : "error"));
        ship3El("b", latestProtocol.ok ? "分工演練通過" : "分工演練發現問題", attemptBox);
        if (!latestProtocol.ok) {
          var issues = ship3El("ul", null, attemptBox);
          if (latestProtocol.duplicated) {
            var used = {};
            Object.keys(latestProtocol.assignments || {}).forEach(function (slotId) {
              var personId = latestProtocol.assignments[slotId];
              if (!used[personId]) used[personId] = [];
              used[personId].push(slotLabels[slotId]);
            });
            Object.keys(used).forEach(function (personId) {
              if (used[personId].length > 1)
                ship3El("li", personLabels[personId] + "同時被派去「" + used[personId].join("」和「") + "」，無法分身。", issues);
            });
          }
          (latestProtocol.wrong || []).forEach(function (slotId) {
            ship3El("li", slotLabels[slotId] + "： " + roleFailures[slotId], issues);
          });
          ship3El("p", "這次停在分工演練，沒有浪費一天，也沒有產生假紀錄。調整後再點名一次。", attemptBox);
        } else {
          ship3El("span", "每個人只站一處，五份紀錄可以互相追溯。", attemptBox);
        }
      }
      if (protocol.locked && !protocol.ran) ship3Btn(work, "照封存分工完成三次穩速落石", function () {
        doShip("runDesignedProtocol", {}, "✓ 等節拍鼓沒有改變，岸上每拍船位也近乎等距；三筆穩速落點已留下。");
      }, "shipAction primary");
      if (protocol.ran) {
        ship3Table(work, ["紀錄", "船況", "相對桅腳", "用途"], (lab.mastRuns || []).map(function (r) {
          return [r.id, r.state === "steady" ? "近似穩速" : "加速",
            (r.offset > 0 ? "+" : "") + r.offset.toFixed(2),
            r.prior ? "維達爾船長舊紀錄" : "本次獨立分工"];
        }));
        if (!ev.g1) {
          ship3El("p", "三次穩速落點都靠近桅腳。哪一種說法沒有超出紀錄？", work, "shipNote shipStepPrompt");
          [["steady-shares-motion", "石頭離手時，已經和船一起向前"],
           ["mast-pulls-stone", "桅杆把石頭拉回桅腳"],
           ["weight-finds-foot", "石頭會自己尋找桅腳"]].forEach(function (claim) {
            ship3Btn(work, claim[1], function () {
              doShip("assertG1Designed", { concept: claim[0] },
                "◆ 第一項主張成立：近似穩速時，離手的石頭仍保有原先的前行。");
            });
          });
        }
      }
    }

    if (v.phase === "investigations") {
      ship3El("h3", "三、你要先追哪一條？", work);
      var design = lab.design;
      if (!design.investigationOrder) {
        ship3El("p", "舊紀錄偏後，還有兩種合理懷疑：船在變速，或甲板上的風。先選一條，另一條不會消失。", work, "shipNote shipStepPrompt");
        ship3Btn(work, "先查變速｜做加速／減速反驗", function () {
          doShip("chooseInvestigationOrder", { order: "speed" }, "✓ 調查順序已記下：先建立變速指紋。");
        }, "shipAction primary");
        ship3Btn(work, "先查風｜做往返航向與船艙盲測", function () {
          doShip("chooseInvestigationOrder", { order: "wind" }, "✓ 調查順序已記下：先查風，但未分類的偏移會先保留。");
        });
      } else {
        ship3El("p", "你選擇先查「" + (design.investigationOrder === "speed" ? "變速" : "風") +
          "」。兩條都必須完成；順序只改變你何時有資格解讀那筆異常。", work, "shipNote");
        function speedRows3(kind) {
          var raw = lab.speedRuns && lab.speedRuns[kind];
          return Array.isArray(raw) ? raw : (raw ? [raw] : []);
        }
        var speedComplete3 = speedRows3("accelerating").length && speedRows3("decelerating").length;
        var windPrepared3 = design.cabinBlind.complete &&
          design.wind.plan === "relative-roundtrip" && design.wind.runs.length === 4;
        var activeSpeed3 = !ev.g3 && (design.investigationOrder === "speed" || windPrepared3);
        var activeWind3 = !ev.g2 && (!activeSpeed3 || ev.g3);

        if (activeSpeed3) {
          ship3El("h4", "A｜建立變速的方向指紋", work);
          if (!lab.predictions.locked) {
            var pred3 = ship3El("div", null, work, "shipPredict");
            ship3El("label", "放手後船加速：", pred3);
            var acc3 = ship3Select(pred3, ["behind", "foot", "ahead"], { behind: "石頭相對偏船尾", foot: "仍在桅腳", ahead: "相對偏船頭" }, "behind");
            ship3El("label", "放手後船減速：", pred3);
            var dec3 = ship3Select(pred3, ["behind", "foot", "ahead"], { behind: "石頭相對偏船尾", foot: "仍在桅腳", ahead: "相對偏船頭" }, "ahead");
            ship3Btn(pred3, "封存兩個預測", function () {
              doShip("setSpeedPrediction", { accelerating: acc3.value, decelerating: dec3.value },
                "✓ 預測先留在紙上；現在才讓船變速。");
            }, "shipAction primary");
          } else {
            ship3Btn(work, "抽閂後加槳", function () {
              doShip("runSpeedChange", { kind: "accelerating" }, "加速留下向船尾偏移的指紋。");
            }, "shipAction", !!speedRows3("accelerating").length);
            ship3Btn(work, "抽閂後收槳", function () {
              doShip("runSpeedChange", { kind: "decelerating" }, "減速留下向船頭偏移的指紋。");
            }, "shipAction", !!speedRows3("decelerating").length);
          }
          if (speedRows3("accelerating").length || speedRows3("decelerating").length) {
            var rows3 = [];
            ["accelerating", "decelerating"].forEach(function (kind3) {
              speedRows3(kind3).forEach(function (r3) {
                rows3.push([kind3 === "accelerating" ? "加速" : "減速",
                  (r3.offset > 0 ? "+" : "") + r3.offset.toFixed(2),
                  r3.offset < 0 ? "船尾" : "船頭"]);
              });
            });
            ship3Table(work, ["船況", "相對桅腳", "方向指紋"], rows3);
          }
          if (speedComplete3 && !ev.g3) {
            [["speed-change-breaks-shared-motion", "石頭保留離手速度；船後來變速，才拉開相對位置"],
             ["stone-loses-force", "石頭原先的向前推力用完了"],
             ["wind-reverses", "兩次剛好遇到相反風向"]].forEach(function (claim3) {
              ship3Btn(work, claim3[1], function () {
                doShip("assertG3", { kinds: ["accelerating", "decelerating"], concept: claim3[0] },
                  "◆ 取得變速指紋：加速偏尾、減速偏頭；維達爾船長的舊紀錄可以重新分類了。");
              });
            });
          }
        } else if (activeWind3) {
          ship3El("h4", "B｜把風與局部共同運動分開", work);
          if (!design.cabinBlind.traces.length) {
            ship3El("p", "維達爾船長會秘密選擇停船或穩速。你只能看兩份局部痕跡，不能靠槳聲或窗外猜。", work, "shipNote shipStepPrompt");
            ship3Btn(work, "用滴水入碗做兩次盲測", function () {
              doShip("runCabinBlindPair", { test: "drip" }, "兩條滴水痕跡已編成 A、B；船況仍遮住。");
            });
            ship3Btn(work, "用落球做停泊／平駛對照", function () {
              doShip("runCabinBlindPair", { test: "toss" }, "兩組落球紀錄已編成 A、B；船況仍遮住。");
            });
          } else if (!design.cabinBlind.complete) {
            ship3Table(work, ["盲測", "平均偏移", "散布"], design.cabinBlind.traces.map(function (trace3) {
              return [trace3.id, (trace3.offset > 0 ? "+" : "") + trace3.offset.toFixed(2), trace3.spread.toFixed(2)];
            }));
            ship3El("p", "光憑這兩條痕跡，能指出哪一趟是停船嗎？", work, "shipNote shipStepPrompt");
            ship3Btn(work, "A 是停船、B 是穩速", function () { doShip("judgeCabinBlind", { choice: "a-dock" }); });
            ship3Btn(work, "B 是停船、A 是穩速", function () { doShip("judgeCabinBlind", { choice: "b-dock" }); });
            ship3Btn(work, "不能可靠分辨", function () {
              doShip("judgeCabinBlind", { choice: "indistinguishable" },
                "✓ 只憑這些局部、普通的機械痕跡，停船與近似穩速無法可靠區分。");
            }, "shipAction primary");
          }
          if (design.cabinBlind.complete && design.wind.plan !== "relative-roundtrip") {
            ship3El("p", "甲板仍有風。怎麼安排航向，才不會把『岸上的風』和『船感受到的相對風』混在一起？", work, "shipNote shipStepPrompt");
            ship3Btn(work, "只跑一次單一航向", function () {
              doShip("runWindAudit", { plan: "single-heading" });
            });
            ship3Btn(work, "只抄岸上旗子的風向", function () {
              doShip("runWindAudit", { plan: "shore-wind-only" });
            });
            ship3Btn(work, "往返航行，逐趟記相對船的風向與船況", function () {
              doShip("runWindAudit", { plan: "relative-roundtrip" },
                "✓ 往返航向完成；穩速筆的偏移落在實驗散布內，異常筆暫依已有指紋分類。");
            }, "shipAction primary");
          }
          if (design.wind.runs.length) {
            ship3Table(work, ["紀錄", "相對船風向", "船況分類", "相對桅腳"], design.wind.runs.map(function (wr3) {
              var stateLabel3 = wr3.shipState === "steady" ? "近似穩速" :
                (wr3.shipState === "accelerating" ? "加速" :
                  (wr3.shipState === "unclassified" ? "尚無指紋可分類" : "未量"));
              return [wr3.id, wr3.relativeWind, stateLabel3,
                (wr3.offset > 0 ? "+" : "") + wr3.offset.toFixed(2)];
            }));
          }
          if (windPrepared3 && !ev.g3) ship3El("p",
            "W3 明顯偏後，但你還沒有變速的方向指紋。先把它標成『未分類』，接著查變速；不能先替它取名字。",
            work, "shipNote");
          if (windPrepared3 && ev.g3 && !ev.g2) {
            ship3El("p", "現在回看盲測與往返紀錄。哪一句既不否認風，也沒有超出本次精度？", work, "shipNote shipStepPrompt");
            [["local-common-motion-wind-below-spread", "在這些局部操作中停船與穩速分不出；風的影響未形成超出散布的系統偏移"],
             ["wind-has-no-effect", "風對落石完全沒有任何影響"],
             ["no-experiment-detects-motion", "任何實驗都永遠測不出運動"]].forEach(function (g2c) {
              ship3Btn(work, g2c[1], function () {
                doShip("assertG2Designed", { concept: g2c[0] },
                  "◆ 取得局部共同運動證據：本次精度內，風不是穩速落點的系統性主因。");
              });
            });
          }
        }
        if (ev.g2 && ev.g3) ship3El("p", "✓ 兩條調查已合卷：舊的落後筆屬於加速指紋；穩速結果未顯示超出散布的風向偏移。", work, "shipNote");
      }
    }

    if (v.phase === "dual-design") {
      ship3El("h3", "四、同一顆石頭，安排兩張獨立紀錄", work);
      ship3El("p", "兩邊不是畫同一張圖的副本，而是從不同參考物量同一事件。請先把觀察位置與共同時鐘安排好。", work, "shipNote shipStepPrompt");
      var dual = lab.design.dual;
      var dualForm = ship3El("div", null, work, "shipProtocolForm");
      ship3El("label", "岸上紙的位置起點", dualForm);
      var shoreOrigin4 = ship3Select(dualForm, ["quay", "ship", "mast"], { quay: "碼頭固定點", ship: "船頭", mast: "桅杆" }, dual.setup ? dual.setup.shoreOrigin : "quay");
      ship3El("label", "船上紙的位置起點", dualForm);
      var shipOrigin4 = ship3Select(dualForm, ["mast", "quay"], { mast: "桅杆", quay: "碼頭" }, dual.setup ? dual.setup.shipOrigin : "mast");
      ship3El("label", "兩張紙如何認出同一時刻", dualForm);
      var clock4 = ship3Select(dualForm, ["shared-drum", "separate-clocks"], { "shared-drum": "共用同一組鼓點", "separate-clocks": "各自憑感覺記時" }, dual.setup ? dual.setup.clock : "shared-drum");
      ship3El("label", "船上紀錄者", dualForm);
      var observer4 = ship3Select(dualForm, ["gassendi", "traveler", "mathieu"], { gassendi: "伽桑狄", traveler: "旅人（你）", mathieu: "馬蒂厄（同時在桅頂抽閂）" }, dual.setup ? dual.setup.shipObserver : "gassendi");
      if (!dual.locked) ship3Btn(work, "檢查並封存雙視角方案", function () {
        doShip("setDualDesign", { setup: {
          shoreOrigin: shoreOrigin4.value, shipOrigin: shipOrigin4.value,
          clock: clock4.value, shipObserver: observer4.value
        } }, "✓ 艾蒂安在岸上、伽桑狄或你在船上；兩邊共用鼓點，馬蒂厄只負責抽閂。");
      }, "shipAction primary");
      if (dual.attempts.length && !dual.locked) ship3El("p",
        "最近一次方案無法把兩張紙追溯到同一事件。檢查起點、時鐘與是否有人分身。",
        work, "shipNote");
      if (dual.locked) ship3El("p", "✓ 雙視角方案已封存。下一段會把艾蒂安與船上紀錄各抄成一張紙。", work, "shipNote");
    }

    if (v.phase === "public-criteria") {
      ship3El("h3", "五、先封標準，再看公開結果", work);
      ship3El("p", "維達爾船長把六筆紀錄的落點蓋住。你先寫下『什麼條件的紀錄才算數』，不能看完漂亮數字才挑資料。", work, "shipNote shipStepPrompt");
      var critForm = ship3El("div", null, work, "shipProtocolForm");
      ship3El("label", "至少連續幾段岸標等距", critForm);
      var seg5 = ship3Select(critForm, ["2", "3", "4"], { "2": "2 段", "3": "3 段", "4": "4 段" }, "3");
      ship3El("label", "至少要有幾筆合格重複", critForm);
      var rep5 = ship3Select(critForm, ["2", "3"], { "2": "2 筆", "3": "3 筆" }, "3");
      ship3El("label", "釋放方式", critForm);
      var rel5 = ship3Select(critForm, ["hand", "latch"], { hand: "手放也收", latch: "只收門閂無推放手" }, "latch");
      ship3El("label", "是否要求岸／船雙紀錄", critForm);
      var dual5 = ship3Select(critForm, ["yes", "no"], { yes: "要，兩張紙都齊", no: "不用，一張也收" }, "yes");
      ship3Btn(work, lab.publicDemo.criteria ? "修改並重新封存（舊版留痕）" : "用蠟封住這份採信標準", function () {
        doShip("sealPublicCriteria", { criteria: {
          equalSegments: Number(seg5.value), repeats: Number(rep5.value),
          release: rel5.value, requireDual: dual5.value === "yes"
        } }, "✓ 標準已封存，舊版本若有修改也會留在卷宗裡。");
      }, "shipAction primary");
    }

    if (v.phase === "public-screen") {
      ship3El("h3", "六、落點仍遮住：只審操作紀錄", work);
      var pd5 = lab.publicDemo;
      var c5 = pd5.criteria;
      if (c5) ship3El("p", "封存標準｜等距 ≥ " + c5.equalSegments + " 段；合格重複 ≥ " +
        c5.repeats + "；" + (c5.release === "latch" ? "門閂放手" : "手放可收") + "；" +
        (c5.requireDual ? "必須有雙紀錄" : "單份紀錄也收"), work, "shipNote shipStepPrompt");
      var publicRows5 = (pd5.records || []).map(function (rec5) {
        return [rec5.id, rec5.equalSegments + " 段", rec5.release === "latch" ? "門閂" : "手放",
          rec5.dual ? "岸／船俱全" : "只剩一份", pd5.revealed ? ((rec5.offset > 0 ? "+" : "") + rec5.offset.toFixed(2)) : "遮住"];
      });
      ship3Table(work, ["編號", "等距岸標", "放手", "紀錄", "落點"], publicRows5);
      if (!pd5.screened) {
        (pd5.records || []).forEach(function (rec5) {
          var row5 = ship3El("div", null, work, "shipRow");
          ship3El("b", "紀錄 " + rec5.id, row5);
          var decision5 = pd5.decisions[rec5.id];
          ship3Btn(row5, (decision5 === true ? "✓ " : "") + "收下", function () {
            doShip("screenPublicRecord", { recordId: rec5.id, accept: true }, "已依操作條件暫收紀錄 " + rec5.id + "。");
          }, "shipAction " + (decision5 === true ? "active" : ""));
          ship3Btn(row5, (decision5 === false ? "✓ " : "") + "退回", function () {
            doShip("screenPublicRecord", { recordId: rec5.id, accept: false }, "已依操作條件退回紀錄 " + rec5.id + "。");
          }, "shipAction " + (decision5 === false ? "active" : ""));
        });
        ship3Btn(work, "封存六筆判定，請維達爾船長核對", function () {
          doShip("finalizePublicScreen", {}, "✓ 判定逐筆符合你先封存的標準；現在才可以揭開落點。",
            function (rr5) {
              if (rr5.reason === "screening-mismatch")
                return "維達爾船長只推回編號 " + rr5.mismatch.join("、") + "：你的收退沒有一致照標準。落點仍遮住。";
              return null;
            });
        }, "shipAction primary");
      } else if (!pd5.revealed) {
        ship3Btn(work, "一起揭開合格紀錄的落點", function () {
          doShip("revealPublicResults", {}, function (rr5) {
            return "✓ 合格的 " + rr5.accepted.length + " 筆都聚在桅腳附近；被退回的異常沒有被刪除。";
          });
        }, "shipAction primary");
      } else {
        ship3El("p", "✓ 你不是挑了最好看的落點；你先守住標準，再接受符合條件的結果。維達爾船長願意讓名字出現在操作紀錄旁。", work, "shipNote");
      }
    }

    if (v.phase === "baseline") {
      ship3El("h3", "一、先知道『正下方』在哪裡", work);
      var row = ship3El("div", null, work, "shipRow");
      var release = ship3Select(row, ["hand", "string", "latch"], {
        hand: "直接手放（容易多推一下）", string: "剪斷細繩", latch: "抽開門閂"
      }, lab.release || "hand");
      ship3Btn(row, "交代馬蒂厄採用這種釋放法", function () { doShip("setRelease", { mode: release.value }, "✓ 馬蒂厄已固定釋放方法；接下來每次都照同一種做。"); });
      ship3Btn(work, lab.plumbCalibrated ? "✓ 鉛垂線已校準" : "校準鉛垂線・1 天", function () {
        doShip("calibratePlumb", {}, "✓ 桅腳正下方已在沙盤上標出。");
      }, "shipAction", lab.plumbCalibrated);
      ship3Btn(work, "請馬蒂厄放手，記一次停船落點", function () {
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
      ship3Btn(work, "請馬蒂厄在離岸加速時抽閂", function () {
        doShip("runMast", { window: "depart" }, function (rr) { return "落點偏後 " + Math.abs(rr.run.offset).toFixed(2) + " 格。先別叫它失敗——記下船還在加速。"; });
      });
    }
    if (v.phase === "steady-mast") {
      ship3El("h3", "三、挑對放手窗口", work);
      var wr = ship3El("div", null, work, "shipChoiceGrid");
      ship3Btn(wr, "離岸立刻請馬蒂厄抽閂（仍加速）", function () { doShip("runMast", { window: "depart" }, "這一筆偏後；船速還沒穩定。"); });
      ship3Btn(wr, "只聽一拍鼓就請他抽閂（資訊不足）", function () { doShip("runMast", { window: "drumOnly" }, "只聽一拍抓不到速度是否穩定，落點仍偏後。"); });
      ship3Btn(wr, "連續岸標等距後請他抽閂", function () { doShip("runMast", { window: "stable" }, "✓ 穩速窗口落點已記錄。"); });
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
      ship3El("h3", "四、封閉船艙六回對照", work);
      ship3El("p", "停船做三回，近似穩速也做三回；每回只觀察水面與落球。六張紙都齊了再比較。", work, "shipNote shipStepPrompt");
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
        [["drip", "觀察水面"], ["toss", "觀察落球"]].forEach(function (t) {
          var count = cabinRuns(vs[0], t[0]).length;
          var label = count ? "請馬蒂厄再做「" + t[1] + "」（已有 " + count + " 筆）" : "請馬蒂厄做「" + t[1] + "」";
          ship3Btn(card, label, function () {
            var next = cabinRuns(vs[0], t[0]).length + 1;
            doShip("runCabin", { vesselState: vs[0], test: t[0] },
              "✓ " + vs[1] + "・" + t[1] + "第 " + next + " 筆已記錄；仍可重做。");
          }, "shipAction", false);
        });
      });
      var cabinRows = [];
      [["dock", "停船"], ["steady", "近似穩速"]].forEach(function (vs) {
        [["drip", "水面"], ["toss", "落球"]].forEach(function (t) {
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
        sources: [["dock:drip", "停船・水面"], ["dock:toss", "停船・落球"], ["steady:drip", "穩速・水面"], ["steady:toss", "穩速・落球"]].map(function (x) { return { id: x[0], label: x[1] }; }),
        concepts: [["air-is-gone", "船艙裡沒有空氣，所以結果相同"], ["ship-too-slow", "船走得太慢，差異還沒出現"], ["steady-matches-dock", "在這些局部操作裡，停船與近似穩速的結果相近"]],
        action: "assertG2", args: function (picked, concept) { return { cells: picked, concept: concept }; },
        success: "◆ 第二項主張成立：停船三回與近似穩速三回，都沒有留下可可靠分辨兩者的差異。" });
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
        ship3Btn(work, accelCount ? "再請馬蒂厄抽閂，接著加槳（已有 " + accelCount + " 筆）" : "請馬蒂厄抽閂，接著加槳", function () {
          doShip("runSpeedChange", { kind: "accelerating" }, function (rr) {
            return "第 " + rr.run.id + " 筆加速結果：石頭相對船偏後；紀錄已保留，仍可重做。";
          });
        });
        ship3Btn(work, decelCount ? "再請馬蒂厄抽閂，接著收槳（已有 " + decelCount + " 筆）" : "請馬蒂厄抽閂，接著收槳", function () {
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
    if (v.phase === "overlay" && !showPerspectiveIntro) {
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
      var revisit = ship3El("div", null, work, "shipPerspectiveReplay");
      ship3Btn(revisit, "重看岸上／船上視角", function () {
        ship3PerspectiveIntroSeen[ek] = false;
        ship3Msg = "";
        renderAll();
      }, "shipAction");
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
        ship3El("b", (st.speaker || "維達爾船長") + "：「" + st.question + "」", card, "shipCrossExamQuote");
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
        ["wind", "商人", "甲板有風。怎麼知道不是風把石頭帶回桅腳？", "維達爾船長：封閉船艙裡也得到相同結果。這一問我接受，不能只拿甲板風解釋。", "商人：那一筆就在甲板上，風也在；不能替自己排除風。"],
        ["acceleration", "槳手", "既然穩速船艙裡看不出差別，第一回為什麼仍落在桅後？", "維達爾船長：這一問，昨天是我問的。（把兩張方向相反的落點紙轉向他）答案也在這裡。", "槳手：船艙只比停船和穩速，回答不了船速正在改變。"],
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
      ship3El("h3", "九、最後一行怎麼寫？", work);
      var overclaimWritten = !!lab.audit.overclaimTried;
      var official = ship3El("section", null, work, "shipCrossExam active");
      ship3El("span", overclaimWritten ? "墨已落下" : "明日告示的最後一行", official, "shipCrossExamStep");
      ship3El("b", overclaimWritten
        ? "「馬賽港，落石實驗，證——」"
        : "「馬賽港，落石實驗，證明地球運動。」", official, "shipCrossExamQuote");
      ship3El("p", overclaimWritten
        ? "伽桑狄的手掌壓住紙面，墨已經在紙上暈開。"
        : "官員等著把這句送去排字，只問眾人：這樣夠清楚了吧？", official, "shipCrossExamReply");
      if (!overclaimWritten) ship3Btn(work, "照告示寫下：證明地球運動", function () {
        doShip("setBoundary", { choice: "overclaim" }, null,
          "伽桑狄：（手掌壓上紙面，墨在掌下暈開）「……停。」這場實驗沒有直接量到地球正在運動。");
      }, "shipAction danger");
      ship3Btn(work, "收住結論：它只排除了『船動，石頭就一定落後』", function () { doShip("setBoundary", { choice: "honest" }, "✓ 維達爾船長願意簽下這個有邊界的結論：船只替今天量到的事作證。"); }, "shipAction primary");
    }

    var defaultShipMsg = showPerspectiveIntro
      ? "照片先幫你找出觀察位置；進入紙帶後，剛才的兩張圖會退場。"
      : "先完成本段目的；所有失敗紀錄都會保留，不必重開遊戲。";
    var msg = ship3El("p", ship3Msg || defaultShipMsg, work, "shipMessage");
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
  var orbit4ClaimDraft = {}; /* 純 UI 草稿：勾紙與斷言在送出前不寫進實驗紀錄。 */
  var orbit4WorkScrollTop = 0;
  /* WB-CR-025b：第四章工作台的「紙上留檔」與「立繪演出」並存。
     這兩個值只記本頁演出，不進 engine／save；重整或讀檔後會重新說明當前目標。 */
  var orbit4CoachSpokenKey = "";
  var orbit4PendingCoach = null;
  var ORBIT4_COACH_PHASES = {
    tangent: 1, vectors: 1, scale: 1, planets: 1, models: 1, proof: 1, archive: 1
  };
  function orbit4SayCoach(embedKey, phase, rawLine, scene) {
    if (!ORBIT4_COACH_PHASES[phase] || !rawLine || orbit4CoachSpokenKey === embedKey) return;
    var pending = { embedKey: embedKey, rawLine: rawLine, scene: scene };
    /* D1-2 首次進場有舞台殼 embark gate；先把台詞扣住，不能隔著閘門搶說。 */
    if (document.body && document.body.classList.contains("embarkGate")) {
      orbit4PendingCoach = pending;
      return;
    }
    orbit4CoachSpokenKey = embedKey;
    orbit4PendingCoach = null;
    sayIntoDialogue(parseSpokenLine(rawLine), "", scene);
  }
  function orbit4FlushPendingCoach(detail) {
    var pending = orbit4PendingCoach;
    if (!pending || orbit4CoachSpokenKey === pending.embedKey) return;
    if (detail && detail.view && detail.view !== "orbit") return;
    if (detail && detail.scene && detail.scene !== pending.scene) return;
    if (!state || !state.cursor ||
        state.cursor.scene + "/" + state.cursor.node !== pending.embedKey) return;
    orbit4CoachSpokenKey = pending.embedKey;
    orbit4PendingCoach = null;
    sayIntoDialogue(parseSpokenLine(pending.rawLine), "", pending.scene);
  }
  document.addEventListener("bd:embark", function (event) {
    var detail = event && event.detail || {};
    if (CHAPTER_ID === "ch3" && detail.intermission === "ch3-dual-complete") {
      doShip("enterDossierDebate", {},
        "卷宗已帶上碼頭。船長會問：這些紙現在能證明什麼？");
      return;
    }
    orbit4FlushPendingCoach(detail);
  });
  function orbit4FocusKey(node) {
    if (!node) return "";
    var explicit = node.getAttribute && (node.getAttribute("data-orbit-focus") || node.getAttribute("aria-label"));
    if (explicit) return "explicit:" + explicit;
    if (node.tagName === "BUTTON")
      return "button:" + String(node.textContent || "").replace(/^✓\s*/, "").trim();
    if (node.tagName === "SELECT") return "select:" + String(node.value || "");
    if (node.tagName === "INPUT") return "input:" + String(node.value || "");
    return "";
  }
  function orbit4CaptureViewport() {
    var work = document.querySelector(".orbitWork");
    var active = document.activeElement;
    if (work) orbit4WorkScrollTop = work.scrollTop;
    return {
      embedKey: orbit4EmbedKey,
      workTop: work ? work.scrollTop : orbit4WorkScrollTop,
      windowX: window.scrollX || 0,
      windowY: window.scrollY || 0,
      focusKey: orbit4FocusKey(active),
      activeTop: active && active.getBoundingClientRect ? active.getBoundingClientRect().top : null
    };
  }
  function orbit4RenderPreserving(snapshot) {
    renderAll();
    if (!snapshot || snapshot.embedKey !== orbit4EmbedKey) return;
    requestAnimationFrame(function () {
      var work = document.querySelector(".orbitWork");
      if (work) work.scrollTop = snapshot.workTop || 0;
      window.scrollTo(snapshot.windowX || 0, snapshot.windowY || 0);
      if (!snapshot.focusKey) return;
      var controls = document.querySelectorAll(".orbitWork button,.orbitWork select,.orbitWork input,.orbitWork [data-orbit-focus]");
      var target = Array.prototype.find.call(controls, function (node) {
        return orbit4FocusKey(node) === snapshot.focusKey;
      });
      if (!target) return;
      target.focus({ preventScroll:true });
      if (work && snapshot.activeTop != null) {
        var nextTop = target.getBoundingClientRect().top;
        work.scrollTop += nextTop - snapshot.activeTop;
        orbit4WorkScrollTop = work.scrollTop;
      }
      window.scrollTo(snapshot.windowX || 0, snapshot.windowY || 0);
    });
  }
  function orbit4Error(code) {
    var map = {
      "bad-tangent-prediction": "先在三個去向裡選一個，再封存。",
      "tangent-prediction-already-sealed": "這張入場預測已經封存；它是來源紙，不是可改寫的答案。",
      "k0-source-required": "先封存「沒有拉扯時會去哪裡」的來源紙。",
      "k2-required": "先完成 1665 年的同尺紙，再把它帶回 1679 年的作圖桌。",
      "orbit-rule-required": "先把方向、初速、箭長與路徑預測四項封存。",
      "orbit-rule-already-sealed": "這組規則還沒走完；先完成三拍，或讓錯拍留下紀錄後重置。",
      "orbit-aim-required": "先轉動這一拍的箭頭，再落筆。",
      "bad-orbit-nudge": "這次轉動超出作圖尺可用的角度。",
      "prediction-order-invalid": "預測必須早於第一拍；這張紙的時間順序不成立。",
      "orbit-attempt-required": "先把月亮放回同一個起點。",
      "bad-orbit-target": "先選每一拍朝哪裡改向：固定方向、紙上的標記，或地心。",
      "bad-orbit-speed": "請先封存一個可辨識的初速。",
      "bad-orbit-strength": "請先封存每拍改向箭頭的長度。",
      "bad-orbit-prediction": "先寫下這套規則會留下哪一種路徑。",
      "consequence-required": "這條錯路還沒走完。先看完後果，提示才會出現。",
      "three-vectors-complete": "三拍偏折已完成；請讓同一規則續跑一圈。",
      "three-valid-vectors-required": "還需要三支方向、大小都站得住的偏折箭頭。",
      "bad-scale-prediction": "先在四個量級裡選一個，再封存。",
      "scale-prediction-required": "先封存月球一秒偏折的量級預測。",
      "scale-prediction-already-sealed": "量級預測已封存；接下來只能換算與核對。",
      "bad-time-conversion": "這個換算不在兩張紙可比較的範圍內。",
      "time-conversion-required": "先把六十秒的月球偏折換成一秒。",
      "bad-scale-ratio": "先選兩張一秒紙相差的量級。",
      "scale-ratio-required": "先判斷兩張一秒紙相差多少倍。",
      "bad-scale-relation": "先判斷六十與三千六百之間是哪一種關係。",
      "no-consequence": "目前沒有待播放的錯誤路徑。",
      "k1-required": "先用切線逃逸與閉合軌道建立『一直改向的路』。",
      "bad-scale": "距離與時間倍率必須落在工作台可顯示的範圍。",
      "bad-exponent": "距離律指數限 0.0～3.0，且每次以 0.1 調整。",
      "two-trials-required": "至少先試過兩種不同的距離律，才能封存其中一種。",
      "trial-required-before-lock": "這個指數還沒真正試算過，不能直接封存。",
      "distance-law-already-sealed": "這張預測已封口；先看完結果，再決定是否保留它並另開一張。",
      "planet-observations-already-open": "火星或木星資料已經揭露，不能把月球那一步偽裝成仍未看過。",
      "law-lock-required": "先把一條距離律封存，觀測紙才會翻面。",
      "observation-already-revealed": "這張觀測紙已經揭露；若要改律，舊預測會保留劃線，不能假裝沒看過。",
      "unlock-law-first": "先解開目前封存的距離律。",
      "k2-k3-required": "月球跨尺度與兩顆行星的封存預測都成立後，才能公平比較模型。",
      "k1-k3-required": "改向紙、同尺紙與封口行星預測都完成後，才能開對帳桌。",
      "unknown-model-case": "這份觀測不在月亮、行星與彗星三列之中。",
      "ledger-row-complete": "這一列已經蓋章封存，不能倒回去換結論。",
      "unknown-ledger-cell": "這一格不在兩本帳的六格之中。",
      "ledger-row-required": "先親手選一列觀測，才有可蓋章的原始結果。",
      "unknown-ledger-stamp": "這顆章不在「對得上／只有說法／對不上」三種判讀裡。",
      "comet-join-required": "彗星兩疊星圖還沒依日期與星位接成同一條路。",
      "loan-not-available": "月亮列沒有可加的借條；借條只處理行星或彗星的失配。",
      "ledger-stamps-required": "兩格都要由你蓋章後，才能決定要不要加借條。",
      "loan-decision-locked": "借條決定已經封存；有加就留著，沒有加也不能事後補寫。",
      "three-ledger-rows-required": "三列觀測都要由你蓋完兩格章，才能封存總結。",
      "unknown-model-claim": "這句總結不在對帳桌可核對的三種範圍內。",
      "unknown-comet-connection": "這種接法不在兩疊星圖可比較的範圍內。",
      "unknown-model-protocol": "這個比較標準無法分清定律與初始資料。",
      "model-protocol-required": "先封存一條公平標準：同一條定律不變，各天體使用自己的觀測初始資料。",
      "unknown-model-prediction": "先預測這個模型能否用同一條定律跨過三種天空。",
      "model-prediction-required": "這個模型還沒有留下揭曉前的預測。",
      "model-prediction-already-sealed": "這個模型的預測已經封存，不能在看完結果後換句話。",
      "k4-required": "先讓兩個模型都跑完三種天空，再整理證明。",
      "partial-window-passed": "完整模型比較已完成，現在不能把它假裝成早先的局部短稿。",
      "opening-choice-locked": "第一輪決定已經留下紀錄；收好它，再往模型比較走。",
      "unknown-hooke-scope": "這句話不在可核對的三種貢獻範圍內。",
      "hooke-scope-required": "先把 Hooke 的貢獻句寫到精確，才能分配各人的工作。",
      "shell-page-not-ready": "先翻出球殼定理頁，再親手把它放進第六槽。",
      "delay-reason-required": "延後不是空白按鈕；請留下可檢查的理由。",
      "dishonest-partial-scope": "短稿只能說月球與行星目前支持的範圍，不能偷帶尚未完成的彗星比較。",
      "unknown-archive-evidence": "這張紙不屬於本章的五份證據。",
      "archive-evidence-required": "這份證據還沒有取得，不能先夾進完成的筆記。",
      "archive-evidence-set-incomplete": "還有證據沒完成；先回到尚未完成的工作。",
      "completed-proof-required": "完整校樣還沒完成，現在不能把五張證據收進筆記。"
    };
    return map[code] || "這一步目前不能成立；請檢查眼前的紀錄與先後順序。";
  }
  function doOrbit(action, args, okText) {
    var viewport = orbit4CaptureViewport();
    var oldEvidence = JSON.stringify(state.lab.evidence || {});
    var spokenRunResult = null;
    var r = N.labAction(state, action, args || {});
    if (r.error) {
      orbit4Msg = "✕ " + orbit4Error(r.error);
      orbit4RenderPreserving(viewport);
      return;
    }
    setState(r.state);
    orbit4LastResult = { action: action, result: r.result || {}, stamp: Date.now() };
    var rr = r.result || {};
    if (action === "commitOrbitBeat" && rr.ok === false) {
      orbit4Msg = rr.consequence === "aimed-at-previous-earth"
        ? "✕ 這支箭指向上一拍的地球位置。墨點已留下；下一拍要重新看現在的位置。"
        : "✕ 這支箭沒有指回這一拍規則指定的中心。墨點不會被擦掉。";
    } else if (action === "commitDeflection" && rr.ok === false && rr.consequence) {
      orbit4Msg = "牛頓沒有攔住這條路。先看它完整走完，再判斷你剛才加了什麼。";
    } else if (action === "runConsequence") {
      var consequence = rr.consequence || {};
      var kind = consequence.kind;
      var unstableReply = consequence.angleDeg > 15
        ? "這一拍沒有朝向地心。它歪出去了。"
        : (consequence.magnitudeRatio < 0.75
          ? "這一拍太輕。它幾乎沒有被拉住。"
          : "這一拍太重。它一下切得太深。");
      var consequenceReply = {
        tangent: "這是沒有作用的那張紙。你又把它畫了一次。",
        outward: "往外推。那不是拉，是丟。",
        impact: "太多。它沒有繞，它撞上來了。",
        unstable: unstableReply
      }[kind];
      if (consequenceReply) {
        orbit4Msg = "牛頓：「" + consequenceReply + "」";
        spokenRunResult = { speaker: "牛頓", action: "", text: consequenceReply };
      } else {
        orbit4Msg = "後果已完整保留；現在可以調整後重試。";
      }
    } else if (action === "convertMoonTime" && rr.ok) {
      var sealedScaleChoice = state.lab && state.lab.scaleLab &&
        state.lab.scaleLab.scalePrediction && state.lab.scaleLab.scalePrediction.choice;
      var sealedScaleLabel = ({
        same:"幾乎不變", "one-sixtieth":"約剩原來的 1／60",
        "one-over-3600":"約剩原來的 1／3600",
        "almost-none":"換成一秒後小到幾乎看不見"
      })[sealedScaleChoice] || "這個量級";
      var scaleReply = "你先押「" + sealedScaleLabel + "」。換算後約是一點三六毫米。蠟封留著；猜測和結果合不合，現在看得見了。";
      orbit4Msg = "牛頓：「" + scaleReply + "」";
      spokenRunResult = { speaker: "牛頓", action: "", text: scaleReply };
    } else if (action === "revealPlanetPredictions" && rr.ok) {
      var planetReply = "兩張一起翻。猜中或猜偏的封口都釘回去；它們會告訴我們，同一條規矩跨到不同距離時，差了多少。";
      orbit4Msg = "哈雷：「" + planetReply + "」";
      spokenRunResult = { speaker: "哈雷", action: "", text: planetReply };
    } else if ((action === "runOrbitRule" || action === "continueOrbitRule") && rr.run) {
      var actualShape = rr.run.actualShape || rr.run.outcome;
      var closedShape = actualShape === "circle" || actualShape === "ellipse";
      var orbitOutcome = {
        line: "它沿近直線離開；沒有持續指回中心。",
        "wrong-center": "它繞了。繞的是紙上那個點，不是地球。",
        away: "它一圈比一圈遠，沒有留下來。",
        circle: "留下來了；它落進近圓窄帶。",
        ellipse: "留下來了；它閉合成橢圓，不必只有一種圓。",
        crash: "它切得太深，撞進地球。",
        parabola: "固定一個方向，就只折彎一次。它離開了，不是繞著走。",
        "outer-band": "拉得太少，或它跑太快。它一圈比一圈遠。",
        "inner-band": "拉得太多，或它跑太慢。它正在往裡栽。",
        "near-circle": "留下來了。方向對，量也配上了速度。"
      }[actualShape] || "這條封存規則已完整留下路徑。";
      var predictedResult = rr.run.predictionMatched
        ? (closedShape
          ? "你先寫下它會留下來，它就留下來了。這一張可以拿去比。"
          : "你料中它留不住。那就別亂改——只換一件，再封一次。")
        : (closedShape
          ? "它留下了，卻不是你先寫的那條。先記著；再跑一次，看是不是碰巧。"
          : "它沒有照你寫的走。先別動箭長——說清楚你剛才以為會發生什麼。");
      orbit4Msg = "牛頓：「" + orbitOutcome + "\n" + predictedResult + "」";
      /* runtime 只讓 continueOrbitRule 可達；兩段判讀以同一個牛頓事件送進立繪框，
         不用通用 parser 拆開內嵌換行，也不在後續 render 重播。 */
      if (action === "continueOrbitRule")
        spokenRunResult = { speaker: "牛頓", action: "", text: orbitOutcome + "\n" + predictedResult };
    } else if (rr.ok === false) {
      var visibleFailure = ({
        "claim-mismatch": "資料與結論沒有接上。先看哪兩筆紀錄真的比較了同一件事。",
        "geometry-break": "來源放錯後，證明圖上的相應幾何真的斷開了；可自由換回正確來源。",
        "mechanism-slot-empty": "規則算出了作用與運動的關係，但機制槽沒有任何資料可填。",
        "credit-lines-break": "把概念、觀測、證明與出版全給一人，四條史料接口會斷開。",
        "hooke-overcredit": "這句把一封信擴張成完整定律與三百頁證明；Newton 的證明頁被它蓋掉了。",
        "hooke-erasure": "1679 年書信從來源線脫落。三百頁證明不能讓這封信不存在。",
        "comet-kink": "兩張紙雖然碰到了，接縫卻多出觀測沒有留下的急轉彎。折角會保留，請改用日期與星位續算。",
        "printed-broken-proof": "印刷機已壓出這張斷鏈校樣。錯稿保留、窗口前進，所有證據仍可重排。"
        ,"tangent-prediction-mismatch": "這個去向需要額外作用，不能成為「沒有拉扯」的來源紙；退件保留，不會替你改。"
        ,"time-not-squared": "紙上會得到約 81.7 毫米，但那只把六十秒平均切開。斜面紙帶顯示落距跟時間的平方一起變；這張退件留下，再換一次。"
        ,"ratio-mismatch": "兩張一秒紙的刻痕量級沒有對上；請重新比較公尺與毫米。"
        ,"relation-mismatch": "量級雖然對上了，但你替六十與三千六百寫的關係不成立；退件保留，請重判。"
        ,"stamp-bounced": "這顆章與眼前原始結果不合，章痕留在退件紀錄；原始結果沒有被改寫。"
        ,"comparison-overclaim": "這句不是帳上實際留下的總結：只看一列太窄，否定所有渦旋說又太寬。"
      }[rr.reason || rr.consequence]);
      if (!visibleFailure && typeof okText === "function") visibleFailure = okText(rr);
      orbit4Msg = "✕ " + (visibleFailure || "這個主張還沒有被目前紀錄支持。");
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
    orbit4RenderPreserving(viewport);
    if (spokenRunResult)
      sayIntoDialogue([spokenRunResult], "", state.cursor ? state.cursor.scene : null);
  }
  function orbit4PhaseKey(phase) {
    return {
      "tangent-seal": "tangent",
      "orbit-rule": "vectors"
    }[phase] || phase;
  }
  function orbit4DisplayNote(note) {
    /* Engine notes are persisted and sanitizer-checked. Translate their old third-person
       runtime label only at the display boundary so schema-2 saves remain compatible. */
    return String(note || "").replace(/玩家/g, "旅人");
  }
  function orbit4ProofPreviewText(preview) {
    var p = preview || {};
    var sourceBreaks = (p.missing || []).length + (p.wrong || []).length +
      (p.shellOk ? 0 : 1);
    var creditBreaks = (p.creditWrong || []).length +
      (p.hookeScopeOk ? 0 : 1) + (p.authorOk ? 0 : 1);
    var boundaryBreaks = p.boundaryOk ? 0 : 1;
    var marks = [];
    if (sourceBreaks) marks.push("來源墨線有 " + sourceBreaks + " 處斷開");
    if (creditBreaks) marks.push("署名墨線有 " + creditBreaks + " 處接不上");
    if (boundaryBreaks) marks.push("頁末邊界還有 1 處不穩");
    if (!marks.length)
      return "透光看不見明顯斷墨；這不等於內容正確。要留下結果，仍得親手送印。";
    return "透光只看見版面異常：" + marks.join("；") +
      "。它不會告訴你該換哪張紙、哪個名字或哪一句。";
  }
  function orbit4Mission(phase) {
    phase = orbit4PhaseKey(phase);
    /* RUNTIME-CR-019:每相位=[標題,副標,目的,台詞]。目的卡回答「為什麼做這個」;
       vectors 引用玩家在第三章末頁親手寫下的問題(交棒句),不另造動機。 */
    return {
      tangent: ["把「沒有作用」留在紙上", "先拿掉所有偏折，讓月亮原有的速度把下一步走完。",
        "先看月亮沒有被拉時會往哪裡，才知道後面那股作用究竟改變了什麼。",
        "牛頓：「先讓它走給你看。」"],
      vectors: ["和牛頓把規則寫死", "方向、初速、箭長與路徑預測一次封存；前三拍由你轉箭，後面二十七拍由牛頓照同一規則續畫。",
        "你判斷前三拍的方向和大小；牛頓只代畫後面重複的二十七拍。",
        "牛頓：「規則先寫死。每一拍都重新看現在的位置。」"],
      claim: ["兩張紙，只能支持一句話", "把切線預測與閉合軌道並排，說清楚弧線究竟多了什麼。",
        "把直走紙和繞住紙並排，找出兩條路真正差在哪裡。",
        "牛頓：「不用推它前進。要管的只有轉彎。」"],
      scale: ["先把兩張紙換成同一秒", "先猜：月球 60 秒的偏折，換成 1 秒會剩原來的多少。",
        "一張記一秒，一張記六十秒。先換成同一秒，才可以比較。",
        "牛頓：「先別替它命名。把兩張紙換成同一把尺。」"],
      planets: ["哈雷不先拆封", "牛頓先留下火星與木星的預測；資料揭露後，舊答案不能消失。",
        "先押火星和木星各要走幾年，再拆觀測；這樣才能分清預測和事後改口。",
        "牛頓：「先寫下來再看答案。反過來，就不是預測了。」"],
      comet: ["兩疊星圖，是不是同一位來客？", "跟著日期與參考星續算；紙邊碰上，不代表天空中的路真的接起來。",
        "把兩疊獨立星圖接起來，看日期和星位能不能連成同一條路。",
        "牛頓：「它從那麼遠來。若它也照這條律走，這條律就不是月亮的私法。」"],
      "press-opening": ["書還沒算完，排程先到了", "送出誠實的局部結果，或留下理由延後；兩個選擇都會進出版帳。",
        "印刷位置不等人。要先交局部結果，或明說還缺什麼並延後。",
        "牛頓：「印出去的每一句，都要擔得起追問。」"],
      models: ["三列觀測，兩本帳，借條不能藏", "月亮、行星、彗星由你決定先看哪一列；每格原始結果出現後，再親手蓋章。",
        "兩套說法都看同一批資料。哪一套要多借假設，借條就留在哪一本帳上。",
        "牛頓：「先對帳。要借一句話，就把借條留在桌上。」"],
      proof: ["把每一段工作接回正確的人", "六段來源、四項信用、球殼頁與作者欄都要由你親手處理。",
        "把每段證明接回來源與做事的人；接不回去的句子不能送印。",
        "牛頓：「每一句都要接得回一張紙。接不回的，不進書。」"],
      archive: ["旅人把能帶走的紙夾回筆記", "逐張翻看：它支持什麼，又有哪一句仍不能替你說。",
        "收好五張證據，也把來源、退件和還沒證明的地方一起留下。",
        "牛頓：「畫的是猜，量的是帳。別混。」"]
    }[phase] || ["牛頓桌上的下一個問題", "只處理眼前這張紙真正能回答的事。"];
  }
  function orbit4ContextLabel(phase) {
    phase = orbit4PhaseKey(phase);
    return {
      tangent: "1665｜伍爾索普・牛頓的紙桌",
      vectors: "1679｜劍橋・虎克來信後的作圖紙",
      claim: "1679｜劍橋・兩張剛留下的路徑紙",
      scale: "1665｜伍爾索普・同尺紙",
      planets: "1684｜哈雷帶來的封口木匣",
      comet: "1685–1686｜佛蘭斯蒂德的兩疊星圖",
      "press-opening": "1685–1686｜哈雷送來的印刷排程",
      models: "1686｜同一張比較規矩",
      proof: "1686–1687｜倫敦印刷台",
      archive: "旅人筆記｜這一章真正留下的紙"
    }[phase] || "第四章｜月亮的無盡墜落";
  }
  function orbit4ScaleSheets(parent) {
    var wrap = ship3El("div", null, parent, "orbitScaleSheets");
    [
      {
        id:"ch04_prop_cross_scale_surface_sheet_v02",
        title:"地表｜1 秒",
        note:"約下落 4.9 公尺",
        alt:"教學重建圖：地表物體在一秒內約下落 4.9 公尺"
      },
      {
        id:"ch04_prop_cross_scale_moon_sheet_v02",
        title:"月球｜60 秒",
        note:"距地心約 60 個地球半徑；短箭頭向地球偏",
        alt:"教學重建圖：月球在六十秒內沿切線前進，同時向地球方向偏折"
      }
    ].forEach(function (sheet) {
      var fig = ship3El("figure", null, wrap, "orbitScaleSheet");
      var entry = assetEntry(sheet.id);
      if (entry) {
        var img = ship3El("img", null, fig);
        img.src = assetUrl(entry);
        img.alt = sheet.alt;
        img.decoding = "async";
      }
      var caption = ship3El("figcaption", null, fig);
      ship3El("b", sheet.title, caption);
      ship3El("span", sheet.note, caption);
      ship3El("em", "教學重建", caption);
    });
    return wrap;
  }
  function orbit4Svg(parent, lab, phase) {
    phase = orbit4PhaseKey(phase);
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
    if (phase === "planets") {
      var predictions = lab.planetLab && lab.planetLab.predictions || [];
      draw("text", { x:320, y:58, "text-anchor":"middle", class:"orbitMatrixHead" },
        "先把預測封存，觀測才翻面");
      [["mars","火星",1.52,70],["jupiter","木星",5.20,345]].forEach(function (p) {
        var row = null;
        for (var pi = predictions.length - 1; pi >= 0; pi--) {
          if (predictions[pi].planet === p[0] && !predictions[pi].superseded) { row = predictions[pi]; break; }
        }
        var cls = "orbitCaseCard " + (!row || !row.revealedAfterSeal
          ? "pending" : (row.pass ? "pass" : "patched"));
        draw("rect", { x:p[3], y:92, width:225, height:218, rx:14, class:cls });
        draw("text", { x:p[3]+18, y:127, class:"orbitCaseTitle" }, p[1]);
        draw("text", { x:p[3]+18, y:154, class:"orbitCaseMeta" }, "距離比 " + p[2].toFixed(2));
        if (!row) {
          draw("text", { x:p[3]+18, y:202, class:"orbitCaseValue" }, "預測：尚未封存");
          draw("text", { x:p[3]+18, y:236, class:"orbitCaseMeta" }, "觀測：仍在蠟封後");
          draw("text", { x:p[3]+18, y:276, class:"orbitCaseMeta" }, "封存後才能翻面");
        } else if (!row.revealedAfterSeal) {
          draw("text", { x:p[3]+18, y:190, class:"orbitCaseValue" },
            "你押 " + (row.playerBandLabel || "已封存"));
          draw("text", { x:p[3]+18, y:224, class:"orbitCaseMeta" },
            "規則算出 " + row.prediction.toFixed(3));
          draw("text", { x:p[3]+18, y:266, class:"orbitCaseMeta" },
            "觀測仍在蠟封後");
          draw("text", { x:p[3]+18, y:296, class:"orbitCaseValue" }, "等待另一張封口");
        } else {
          var domainMax = p[0] === "mars" ? 2.5 : 13;
          var x0 = p[3]+22, x1 = p[3]+203, axisY = 225;
          draw("line", { x1:x0,y1:axisY,x2:x1,y2:axisY,class:"orbitPlanetTick" });
          for (var tickIndex=0;tickIndex<=5;tickIndex++) {
            var tickX=x0+(x1-x0)*tickIndex/5;
            draw("line",{x1:tickX,y1:axisY-6,x2:tickX,y2:axisY+6,class:"orbitPlanetTick"});
          }
          var playerValue = Number(row.playerBandValue || row.prediction);
          var playerX=x0+(x1-x0)*playerValue/domainMax;
          var observedX=x0+(x1-x0)*row.actual/domainMax;
          draw("line",{x1:playerX,y1:axisY-22,x2:playerX,y2:axisY+18,class:"orbitPlanetTickMark"});
          draw("line",{x1:observedX,y1:axisY-18,x2:observedX,y2:axisY+22,class:"orbitPlanetTickObserved"});
          draw("text", { x:p[3]+18, y:178, class:"orbitCaseValue" },
            "封口 " + (row.playerBandLabel || row.prediction.toFixed(3)));
          draw("text", { x:p[3]+18, y:272, class:"orbitCaseMeta" },
            "觀測 " + row.actual.toFixed(2) + "｜殘差 " + row.residualPct.toFixed(2) + "%");
          draw("text", { x:p[3]+18, y:298, class:"orbitCaseValue" },
            row.pass ? "✓ 先封後看，程序成立" : "規則仍需重查");
        }
      });
      draw("text", { x:320, y:352, "text-anchor":"middle", class:"orbitCaseMeta" },
        "舊律的預測會保留並劃線，不會在看到答案後消失");
    } else if (phase === "comet") {
      var comet = lab.cometLab || { attempts:[], selectedConnection:null, joined:false };
      var hadKink = (comet.attempts || []).some(function (a) { return a.mode === "hard-kink"; });
      draw("rect", { x:38,y:48,width:250,height:286,rx:12,class:"orbitCometPaper" });
      draw("rect", { x:352,y:48,width:250,height:286,rx:12,class:"orbitCometPaper" });
      draw("text", { x:58,y:80,class:"orbitPaperTitle" }, "十一月｜入向");
      draw("text", { x:372,y:80,class:"orbitPaperTitle" }, "十二月｜出向");
      draw("path", { d:"M78 292 C124 252,178 191,268 145",class:"orbitCometTrack inbound" });
      draw("path", { d:"M372 145 C458 183,514 246,562 296",class:"orbitCometTrack outbound" });
      [[78,292],[124,252],[178,191],[268,145],[372,145],[458,183],[514,246],[562,296]].forEach(function (p, i) {
        draw("circle", { cx:p[0],cy:p[1],r:6,class:"orbitCometPoint "+(i < 4 ? "inbound" : "outbound") });
      });
      if (hadKink) {
        draw("path", { d:"M268 145 L320 226 L372 145",class:"orbitCometJoin kink" });
        draw("text", { x:320,y:247,"text-anchor":"middle",class:"orbitCometWarn" }, "紙碰到了，軌道卻折斷");
      }
      if (comet.joined) {
        draw("path", { d:"M268 145 C305 125,335 125,372 145",class:"orbitCometJoin joined" });
        draw("text", { x:320,y:112,"text-anchor":"middle",class:"orbitCometOk" }, "同一條高傾角軌道");
      } else if (!hadKink) {
        draw("line", { x1:286,y1:145,x2:352,y2:145,class:"orbitCometGap" });
        draw("text", { x:320,y:125,"text-anchor":"middle",class:"orbitCaseMeta" }, "接縫待算");
      }
      draw("text", { x:320,y:365,"text-anchor":"middle",class:"orbitCaseMeta" },
        comet.joined ? "日期與星位在接縫前後連續" : "先選接法；錯誤折角不會被刪掉");
    } else if (phase === "archive") {
      var archive = lab.archiveLab || { clipped:[], complete:false };
      draw("path", { d:"M56 68 Q180 42 310 82 L310 342 Q184 310 56 334 Z",class:"orbitNotebookPage" });
      draw("path", { d:"M330 82 Q460 42 584 68 L584 334 Q456 310 330 342 Z",class:"orbitNotebookPage" });
      draw("line", { x1:320,y1:76,x2:320,y2:344,class:"orbitNotebookFold" });
      [["K1","改向紙",102,112],["K2","地月紙",220,112],["K3","封口預測",370,112],["K4","模型比較",488,112],["K5","出版校樣",252,238]].forEach(function (row) {
        var clipped = archive.clipped.indexOf(row[0]) >= 0;
        draw("rect", { x:row[2],y:row[3],width:104,height:76,rx:7,class:"orbitArchiveSlip "+(clipped?"clipped":"") });
        draw("text", { x:row[2]+52,y:row[3]+30,"text-anchor":"middle",class:"orbitArchiveId" }, row[1]);
        draw("text", { x:row[2]+52,y:row[3]+55,"text-anchor":"middle",class:"orbitArchiveLabel" }, clipped ? "已夾回" : "待收");
        if (clipped) draw("path", { d:"M"+(row[2]+79)+" "+(row[3]-4)+" q18 12 0 28",class:"orbitArchiveClip" });
      });
      draw("text", { x:320,y:374,"text-anchor":"middle",class:"orbitCaseMeta" },
        archive.complete ? "五份證據都回到旅人筆記；錯路與邊界仍可翻查" :
          "已夾回 "+archive.clipped.length+"／5；每張紙仍保留它的證明邊界");
    } else if (phase === "models") {
      var ledger = lab.modelLab || { rowStage:{}, completedRows:[] };
      var ledgerCases = [["moon","月亮"],["planets","行星"],["comet","彗星"]];
      var stampNames = { matches:"對得上", story:"只有說法", mismatch:"對不上" };
      draw("text", { x:320, y:42, "text-anchor":"middle", class:"orbitMatrixHead" },
        "原始結果先出現，章與借條只能由你留下");
      draw("text", { x:315, y:74, "text-anchor":"middle", class:"orbitMatrixHead" }, "拉力帳");
      draw("text", { x:485, y:74, "text-anchor":"middle", class:"orbitMatrixHead" }, "渦旋帳");
      ledgerCases.forEach(function (c, ci) {
        var row = ledger.rowStage && ledger.rowStage[c[0]];
        var y = 92 + ci * 84;
        var done = (ledger.completedRows || []).indexOf(c[0]) >= 0;
        draw("text", { x:92, y:y+34, "text-anchor":"middle", class:"orbitCaseTitle" }, c[1]);
        [0,1].forEach(function (mi) {
          var x = mi ? 400 : 230;
          draw("rect", { x:x, y:y, width:154, height:64, rx:9,
            class:"orbitCaseCard " + (!row ? "pending" : (done ? "pass" : "")) });
          var stamp = row && (mi ? row.vortexStamp : row.forceStamp);
          var raw = !row ? "尚未開列" :
            (mi
              ? ({ moon:"無核對數字", planets:"6.4 年／11.9 年", comet:"方向與流向衝突" }[c[0]])
              : ({ moon:"殘差 0.8%", planets:"殘差 1.6%", comet:"殘差 2.2%" }[c[0]]));
          draw("text", { x:x+77, y:y+26, "text-anchor":"middle", class:"orbitCaseMeta" }, raw);
          draw("text", { x:x+77, y:y+51, "text-anchor":"middle", class:"orbitCaseValue" },
            stamp ? "章："+stampNames[stamp] : "章：等你判讀");
        });
      });
      draw("text", { x:320, y:367, "text-anchor":"middle", class:"orbitCaseMeta" },
        "已完成 "+(ledger.completedRows || []).length+"／3 列；借條數 "+(ledger.loans || []).length);
    } else if (phase === "proof" || phase === "press-opening") {
      var proofSlots = {};
      (lab.proof.slots || []).forEach(function (row) { proofSlots[row.slot] = row.evidenceId; });
      var labels = [
        ["一","原有前進","inertia",["M2","M3"]],
        ["二","向內改向","inward",["K1"]],
        ["三","同尺","distance",["K2"]],
        ["四","封存預測","withheld",["K3"]],
        ["五","模型對帳","model",["K4"]],
        ["六","球殼頁","shell",["SHELL"]]
      ];
      labels.forEach(function (t, i) {
        var x = 54 + i * 106;
        var source = proofSlots[t[2]], slotOk = source && t[3].indexOf(source) >= 0;
        draw("circle", { cx:x, cy:190, r:27, class:"orbitProofNode " + (slotOk ? "got" : "") });
        draw("text", { x:x, y:185, "text-anchor":"middle", class:"orbitCaseValue" }, t[0]);
        draw("text", { x:x, y:243, "text-anchor":"middle", class:"orbitLabel" }, t[1]);
        if (i < labels.length - 1) draw("line", { x1:x+31,y1:190,x2:x+89,y2:190,class:"orbitProofLink" });
      });
      draw("text", { x:320,y:90,"text-anchor":"middle",class:"orbitPressStamp" },
        lab.proof.press.scheduleLost ? "原排程已錯過・仍可完成" :
          "校樣窗口 " + lab.proof.press.window + "／" + lab.proof.press.reservedWindows);
      if (phase === "proof") {
        var scopeLabel = {
          hookeComplete: "Hooke：寫過頭",
          newtonAlone: "Hooke：被抹除",
          "precise-scope": "Hooke：範圍精確"
        }[lab.proof.hookeScope] || "Hooke：尚未簽句";
        draw("text", { x:320,y:325,"text-anchor":"middle",class:"orbitPressStamp" }, scopeLabel);
        draw("text", { x:320,y:360,"text-anchor":"middle",class:"orbitCaseMeta" },
          lab.proof.boundaryChoice === "ruleEstablished"
            ? "末句已限定在這批證明能支持的範圍"
            : (lab.proof.overclaimTried
              ? "剛才的末句多出一格，桌上沒有來源能接"
              : "最後一句尚未寫入校樣"));
      }
    } else {
      draw("circle", { cx:cx, cy:cy, r:58, class:"orbitEarth" });
      draw("circle", { cx:cx, cy:cy, r:136, class:"orbitGuide" });
      if (phase === "vectors") {
        draw("rect", { x:22,y:20,width:178,height:104,rx:10,class:"orbitStringDemo" });
        draw("circle", { cx:72,cy:70,r:8,class:"orbitStringHand" });
        draw("circle", { cx:142,cy:70,r:10,class:"orbitStringBall" });
        draw("line", { x1:80,y1:70,x2:132,y2:70,class:"orbitStringRope" });
        draw("path", { d:"M116 35 A48 48 0 0 1 164 70",class:"orbitStringArc" });
        draw("line", { x1:142,y1:70,x2:142,y2:112,class:"orbitStringTangent" });
        draw("text", { x:111,y:38,"text-anchor":"middle",class:"orbitStringLabel" }, "拉住：彎");
        draw("text", { x:147,y:119,"text-anchor":"middle",class:"orbitStringLabel" }, "放手：直");
        if (o.activeRule && o.activeRule.target === "ink-mark") {
          draw("circle", { cx:cx, cy:cy-0.55*scale, r:8, class:"orbitInkMark" });
          draw("text", { x:cx+13, y:cy-0.55*scale-8, class:"orbitStringLabel" }, "紙上墨點");
        }
        (o.manualAttempts || []).forEach(function (attempt) {
          var ghostPoints = [];
          (attempt.beats || []).forEach(function (beat, index) {
            if (index === 0) ghostPoints.push(beat.before);
            ghostPoints.push(beat.after);
          });
          if (ghostPoints.length > 1) {
            draw("path", {
              d:ghostPoints.map(function (point, index) {
                return (index ? "L" : "M")+(cx+point.x*scale)+" "+(cy-point.y*scale);
              }).join(" "),
              class:"orbitPath consequence", opacity:"0.28"
            });
          }
        });
      }
      var path = (phase === "tangent" && o.tangentRecord ? o.tangentRecord.path :
        (o.consequence ? o.consequence.path :
          (o.path && o.path.length ? o.path : [{x:1,y:0}])));
      if (path.length > 1) {
        var d = path.map(function (p, i) {
          return (i ? "L" : "M") + (cx + p.x * scale) + " " + (cy - p.y * scale);
        }).join(" ");
        draw("path", { d:d, class:"orbitPath " + (o.consequence ? "consequence" : "") });
      }
      if ((o.deflectionVectors || []).length || isFinite(o.aimAngle)) {
        var defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        var marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
        marker.setAttribute("id", "orbit-inward-arrow");
        marker.setAttribute("markerWidth", "8");
        marker.setAttribute("markerHeight", "8");
        marker.setAttribute("refX", "7");
        marker.setAttribute("refY", "4");
        marker.setAttribute("orient", "auto");
        var head = document.createElementNS("http://www.w3.org/2000/svg", "path");
        head.setAttribute("d", "M0,0 L8,4 L0,8 Z");
        head.setAttribute("class", "orbitDeflectionHead");
        marker.appendChild(head);
        defs.appendChild(marker);
        svg.appendChild(defs);
        (o.deflectionVectors || []).forEach(function (r, i) {
          var base = (o.path && o.path[i]) || { x:1, y:0 };
          draw("line", {
            x1:cx+base.x*scale, y1:cy-base.y*scale,
            x2:cx+base.x*scale+r.dx*1050, y2:cy-base.y*scale-r.dy*1050,
            class:"orbitDeflection", "marker-end":"url(#orbit-inward-arrow)"
          });
        });
        if (isFinite(o.aimAngle)) {
          var aimX = cx + (o.position ? o.position.x : 1) * scale;
          var aimY = cy - (o.position ? o.position.y : 0) * scale;
          draw("line", {
            x1:aimX, y1:aimY,
            x2:aimX+Math.cos(o.aimAngle)*72,
            y2:aimY-Math.sin(o.aimAngle)*72,
            class:"orbitDeflection", "marker-end":"url(#orbit-inward-arrow)"
          });
          draw("text", { x:aimX+8, y:aimY-13, class:"orbitStringLabel" }, "本拍待落筆");
        }
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
    cap.textContent = phase === "vectors" && o.activeRule
      ? ({
          parabola:"固定向左的作用每拍累積，路徑成為拋物線。",
          "wrong-center":"方向每拍改變，但中心指向紙上墨點，不是地球。",
          "outer-band":"改向量相對初速太小，路徑離開原本圓帶。",
          "inner-band":"改向量相對初速太大，路徑切進原本圓帶。",
          "near-circle":"方向與改向量都和初速相配，路徑留在近圓窄帶。"
        }[o.activeRule.outcome] || (o.ruleSeal && !o.continuedAt
          ? "橘箭是本拍尚未落筆的方向；每一拍都會刻意重設成錯角度。"
          : "封存規則已依旅人前三拍與牛頓續畫留下路徑。"))
      : (phase === "comet" ? "相鄰端點不是唯一線索；日期與參考星必須讓接縫前後的方向連續。"
      : (phase === "archive" ? "夾回筆記不是頒獎畫面；每張紙的失敗紀錄與不能證明之處都一起留下。"
      : (phase === "proof" ? "送樣才消耗窗口；閱讀、換來源、重排與預覽都免費。" : orbit4Mission(phase)[1])));
    return fig;
  }
  function orbit4Table(parent, heads, rows) {
    if (!rows.length) return;
    ship3Table(parent, heads, rows);
  }
  function orbit4Select(parent, values, labels, current) {
    return ship3Select(parent, values, labels, current);
  }
  function orbit4BlankSelect(parent, choices, placeholder, focusKey) {
    var select = ship3El("select", null, parent, "shipSelect");
    var blank = document.createElement("option");
    blank.value = "";
    blank.textContent = displayText(placeholder);
    blank.disabled = true;
    blank.selected = true;
    select.appendChild(blank);
    choices.forEach(function (choice) {
      var option = document.createElement("option");
      option.value = choice[0];
      option.textContent = displayText(choice[1]);
      select.appendChild(option);
    });
    if (focusKey) select.setAttribute("data-orbit-focus", focusKey);
    return select;
  }
  function orbit4ClaimPanel(parent, cfg) {
    var draft = orbit4ClaimDraft[cfg.key] || { picked:{}, claim:"" };
    orbit4ClaimDraft[cfg.key] = draft;
    var panel = ship3El("section", null, parent, "orbitClaimPanel");
    ship3El("h4", cfg.title, panel);
    ship3El("p", cfg.prompt || "先勾選要引用的原紙，再決定這些紙能支持哪一句話。", panel, "orbitNote");
    var sourceList = ship3El("div", null, panel, "orbitClaimSources");
    cfg.sources.forEach(function (src) {
      var label = ship3El("label", null, sourceList, "orbitClaimSource" + (src.available ? "" : " unavailable"));
      var cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = !!draft.picked[src.id];
      cb.disabled = !src.available;
      cb.setAttribute("data-orbit-focus", cfg.key + "-source-" + src.id);
      cb.onchange = function () { draft.picked[src.id] = cb.checked; };
      label.appendChild(cb);
      var copy = ship3El("span", null, label);
      ship3El("b", src.label, copy);
      ship3El("small", src.available ? src.detail : "尚未取得", copy);
    });
    var claimRow = ship3El("div", null, panel, "orbitClaimChoice");
    ship3El("label", "這些紙比較支持：", claimRow);
    var claim = orbit4BlankSelect(claimRow, cfg.claims, "結論尚未預選", cfg.key + "-claim");
    if (draft.claim) claim.value = draft.claim;
    claim.setAttribute("data-orbit-focus", cfg.key + "-claim");
    claim.onchange = function () { draft.claim = claim.value; };
    var submit = ship3Btn(claimRow, "用所選原紙寫斷言", function () {
      var picked = Object.keys(draft.picked).filter(function (id) { return draft.picked[id]; });
      if (!picked.length) {
        var viewport = orbit4CaptureViewport();
        orbit4Msg = "✕ 先勾選要引用的原紙。斷言必須留下自己的資料來源。";
        orbit4RenderPreserving(viewport);
        return;
      }
      if (!claim.value) {
        var viewport2 = orbit4CaptureViewport();
        orbit4Msg = "✕ 結論仍是空白；原紙選好後，還要親手決定能寫到哪裡。";
        orbit4RenderPreserving(viewport2);
        return;
      }
      doOrbit(cfg.action, cfg.args(picked, claim.value), cfg.success);
    }, "orbitAction primary");
    submit.setAttribute("data-orbit-focus", cfg.key + "-submit");
    return panel;
  }
  function renderOrbit(v, box) {
    var ek = v.scene + "/" + v.nodeId;
    if (ek !== orbit4EmbedKey) { orbit4EmbedKey = ek; orbit4Msg = ""; orbit4LastResult = null; }
    var phase = orbit4PhaseKey(v.phase);
    var lab = state.lab, ev = lab.evidence || {}, mission = orbit4Mission(phase);
    box.className = "orbitLab";
    box.dataset.phase = phase;
    var head = ship3El("header", null, box, "orbitHead");
    ship3El("small", orbit4ContextLabel(phase), head);
    ship3El("h2", mission[0], head);
    var headTools = ship3El("div", null, head, "orbitHeadTools");
    var help = ship3Btn(headTools, "?", function () {
      if (typeof window.BD_showLabIntro === "function") window.BD_showLabIntro();
    }, "orbitHelp");
    help.setAttribute("aria-label", "查看這一頁怎麼做");
    help.title = "查看這一頁怎麼做";
    var chips = ship3El("div", null, headTools, "orbitEvidenceChips");
    /* RUNTIME-CR-019:已取得=✓;另亮「這一輪追的那一張」(僅當前,附取得條件)。
       未來證據不列——既有契約測試禁止把未來證據演成打勾清單(進度感來自筆記變厚)。 */
    var PAPERS = [
      ["K1","改向紙","找到能讓墨點繞而不逃的規則後取得"],
      ["K2","地月紙","先封存距離律，再對月球六十秒的偏折後取得"],
      ["K3","封口預測","火星與木星的週期預測，封存並經開封核對後取得"],
      ["K4","模型比較","兩個模型用同一份公平標準跑完三組初值後取得"],
      ["K5","出版校樣","五段證明接回來源、信用歸戶、送印後取得"]];
    var PHASE_TARGET = { tangent:null, vectors:"K1", claim:"K1", scale:"K2",
      planets:"K3", comet:"K4", "press-opening":"K5", models:"K4", proof:"K5" };
    var acquiredPapers = PAPERS.filter(function (p) { return ev[p[0].toLowerCase()]; });
    ship3El("b", "旅人筆記", chips, "orbitNotebookLabel");
    ship3El("span", acquiredPapers.length + "／5", chips, "orbitNotebookCount");
    if (!acquiredPapers.length) ship3El("span", "還沒有能夾回去的紙", chips, "empty");
    acquiredPapers.forEach(function (p) {
      var chip = ship3El("span", "✓ " + p[1], chips, "got");
      chip.title = p[0] + "｜已夾回筆記";
    });
    var targetId = PHASE_TARGET[phase];
    var target = targetId && PAPERS.filter(function (p) { return p[0] === targetId && !ev[p[0].toLowerCase()]; })[0];
    if (target) {
      var pursuing = ship3El("span", "這一輪追：" + target[1], chips, "todo");
      pursuing.title = target[2];
    }
    var body = ship3El("div", null, box, "orbitBody");
    var visual = ship3El("section", null, body, "orbitVisual");
    visual.setAttribute("aria-label", "書桌推演");
    ship3El("small", "I　書桌推演", visual, "orbitPaneKicker");
    if (phase === "scale") orbit4ScaleSheets(visual);
    else orbit4Svg(visual, lab, phase);
    var work = ship3El("section", null, body, "orbitWork");
    work.setAttribute("aria-label", "旅人筆記");
    ship3El("small", "II　旅人筆記", work, "orbitPaneKicker");
    var purposeCard = ship3El("div", null, work, "orbitPurposeCard");
    ship3El("small", "為什麼現在做這一步", purposeCard);
    ship3El("b", mission[2], purposeCard);
    var roundGoal = ship3El("div", null, work, "orbitRoundGoal");
    ship3El("small", "現在只做一件事", roundGoal);
    ship3El("b", mission[1], roundGoal);
    var o = lab.orbitLab, sc = lab.scaleLab, pl = lab.planetLab, ml = lab.modelLab, proof = lab.proof;
    var comet = lab.cometLab || { attempts:[], selectedConnection:null, joined:false };
    var archive = lab.archiveLab || { clipped:[], complete:false };

    function renderK1Claim() {
      ship3El("h3", "兩張紙真正多出的是什麼？", work);
      orbit4ClaimPanel(work, {
        key:"k1",
        title:"先決定要引用哪兩張路徑紙",
        prompt:"勾紙不是形式：一張記下沒有偏折時怎麼走，另一張記下規則自行跑完後怎麼走。",
        sources:[
          { id:"tangent", label:"切線路徑紙", available:!!o.tangentRecord,
            detail:o.tangentRecord ? orbit4DisplayNote(o.tangentRecord.note) : "" },
          { id:"closed", label:"近圓規則紙", available:!!o.closedRecord,
            detail:o.closedRecord ? orbit4DisplayNote(o.closedRecord.note) : "" }
        ],
        claims:[
          ["forward-push","月亮需要一股沿圓周向前推的力"],
          ["forward-plus-inward-turn","月亮保留前進；作用須持續指向地心，改向量還要和它跑多快相配"],
          ["stop-restart","月亮每一拍先停下，再朝地球重新出發"]
        ],
        action:"assertK1",
        args:function (records, concept) { return { records:records, concept:concept }; },
        success:"✓ 向前的部分原本就有；新的作用持續指向地心，改向量還必須和原有速度相配。"
      });
    }
    if (phase === "tangent") {
      var source = lab.sourceLab && lab.sourceLab.tangentPrediction;
      ship3El("h3", "沒有任何拉扯時，下一拍會去哪裡？", work);
      ship3El("p", "這是 K0 來源紙：它決定後面拿什麼和作圖紙比較，但不算本章第六份證據。選錯只留下退件，不會有人替你改成正解。", work, "orbitNote");
      if (source && source.sealed) {
        ship3El("p", "✓ 已封存：沿當下方向直行。來源紙留在桌上，作者仍是旅人。", work, "orbitSealStatus");
      } else {
        var tangentBox = ship3El("div", null, work, "orbitRuleDesigner");
        var tangentChoice = orbit4BlankSelect(tangentBox, [
          ["arc","沿著原本的圓弧繼續走"],
          ["fall","立刻朝地心直落"],
          ["tangent","沿當下方向直行"]
        ], "先選一個去向（尚未預選）", "tangent-choice");
        ship3Btn(tangentBox, "把這個去向封進來源紙", function () {
          if (!tangentChoice.value) {
            var viewport = orbit4CaptureViewport();
            orbit4Msg = "✕ 三個去向都還是空白；請先選一個，再親手封存。";
            orbit4RenderPreserving(viewport);
            return;
          }
          doOrbit("sealTangentPrediction", { choice:tangentChoice.value },
            "✓ 切線來源紙已封存。它不是證據，之後仍須由同尺紙與改向紙各自成立。");
        }, "orbitAction primary");
      }
      if (lab.sourceLab && (lab.sourceLab.attempts || []).length) {
        orbit4Table(work, ["封存嘗試","結果"], lab.sourceLab.attempts.map(function (attempt) {
          return [
            { arc:"沿圓弧", fall:"直落地心", tangent:"沿當下方向直行" }[attempt.choice],
            attempt.ok ? "✓ 成為來源紙" : "✕ 與無作用作圖不合；退件保留"
          ];
        }));
      }
    }
    if (phase === "vectors") {
      ship3El("h3", "先寫規則，再另紙押下整條路", work);
      ship3El("p", "規則紙決定月亮每拍怎麼走；預測紙只記你認為三十拍後會撞回來、逃出去，還是繞住。兩張都封好後，前三拍由你落筆，牛頓只照同一規則續畫。", work, "orbitNote");
      var targetLabels = {
        "same-vector":"每拍都沿紙面向左",
        "ink-mark":"每拍指向地球上方的墨點",
        "earth-center":"每拍重新指向當下地心"
      };
      var speedLabels = { slow:"慢（4／5 格）", medium:"中（1 格）", fast:"快（6／5 格）" };
      var strengthLabels = { short:"短（0.67 格）", medium:"中（1.00 格）", long:"長（1.39 格）" };
      var shapeLabels = {
        line:"近直線離開", "wrong-center":"繞錯中心", away:"向外張開", circle:"近圓窄帶",
        ellipse:"閉合橢圓", crash:"切入地球"
      };
      if (!o.ruleSeal || o.continuedAt) {
        var ruleBox = ship3El("div", null, work, "orbitRuleDesigner");
        var rulePaper = ship3El("section", null, ruleBox, "orbitRulePaper");
        ship3El("h4", "規則紙｜這三項會改變路徑", rulePaper);
        var targetSelect = orbit4BlankSelect(rulePaper, [
          ["same-vector",targetLabels["same-vector"]],
          ["ink-mark",targetLabels["ink-mark"]],
          ["earth-center",targetLabels["earth-center"]]
        ], "1｜選每拍指向（未預選）", "orbit-rule-target");
        var speedSelect = orbit4BlankSelect(rulePaper, [
          ["slow",speedLabels.slow],["medium",speedLabels.medium],["fast",speedLabels.fast]
        ], "2｜選初速（未預選）", "orbit-rule-speed");
        var strengthSelect = orbit4BlankSelect(rulePaper, [
          ["short",strengthLabels.short],["medium",strengthLabels.medium],["long",strengthLabels.long]
        ], "3｜選箭長（未預選）", "orbit-rule-strength");
        var predictionPaper = ship3El("section", null, ruleBox, "orbitPredictionPaper");
        ship3El("h4", "預測紙｜不改變路徑，只留下你事前的判斷", predictionPaper);
        var predictionSelect = orbit4BlankSelect(predictionPaper, [
          ["line",shapeLabels.line],["wrong-center",shapeLabels["wrong-center"]],
          ["away",shapeLabels.away],["circle",shapeLabels.circle],
          ["ellipse",shapeLabels.ellipse]
        ], "4｜先預測路徑（未預選）", "orbit-rule-prediction");
        ship3Btn(ruleBox, o.continuedAt ? "另封一張規則紙與預測紙" : "把兩張紙一起封存", function () {
          if (!(targetSelect.value && speedSelect.value && strengthSelect.value && predictionSelect.value)) {
            var viewport = orbit4CaptureViewport();
            orbit4Msg = "✕ 四項都要由你選定；目前仍有空白，沒有任何預設答案。";
            orbit4RenderPreserving(viewport);
            return;
          }
          doOrbit("sealOrbitRule", {
            config:{ target:targetSelect.value, speed:speedSelect.value, strength:strengthSelect.value },
            prediction:predictionSelect.value
          }, "✓ 四項已封存。第一拍箭頭故意偏開；請轉到你判斷的位置再落筆。");
        }, "orbitAction primary");
      }
      if (o.ruleSeal && !o.continuedAt) {
        ship3El("p", "已封存｜"+targetLabels[o.ruleSeal.target]+"｜初速 "+speedLabels[o.ruleSeal.speed]+
          "｜箭長 "+strengthLabels[o.ruleSeal.strength]+"｜預測 "+shapeLabels[o.ruleSeal.prediction], work, "orbitSealStatus");
        if ((o.manualBeats || []).length < 3) {
          var aimPanel = ship3El("section", null, work, "orbitPressBox");
          aimPanel.tabIndex = 0;
          aimPanel.setAttribute("data-orbit-focus", "orbit-aim-keyboard");
          aimPanel.setAttribute("aria-label", "第 "+((o.manualBeats || []).length+1)+" 拍箭頭。左右方向鍵旋轉，Enter 落筆。");
          ship3El("b", "第 "+((o.manualBeats || []).length+1)+"／3 拍｜重新判斷現在的中心", aimPanel);
          ship3El("p", "橘箭是尚未落筆的方向。按左右方向鍵或下方轉鍵微調；Enter 才會把這一拍寫進紙上。", aimPanel, "orbitNote");
          var turnRow = ship3El("div", null, aimPanel, "orbitRow");
          ship3Btn(turnRow, "↶ 逆時針 6°", function () {
            doOrbit("nudgeOrbitAim", { delta:-Math.PI/30 }, "箭頭已逆時針轉 6°；尚未落筆。");
          }, "orbitAction").setAttribute("data-orbit-focus", "orbit-aim-left");
          ship3Btn(turnRow, "↷ 順時針 6°", function () {
            doOrbit("nudgeOrbitAim", { delta:Math.PI/30 }, "箭頭已順時針轉 6°；尚未落筆。");
          }, "orbitAction").setAttribute("data-orbit-focus", "orbit-aim-right");
          ship3Btn(turnRow, "落下這一拍的箭", function () {
            doOrbit("commitOrbitBeat", {}, function (rr) {
              return rr.manualComplete
                ? "✓ 三拍方向都站得住。現在才可以請牛頓照同一封存規則續畫二十七拍。"
                : "✓ 第 "+rr.step+" 拍已落筆。下一拍箭頭已重新偏開，不能沿用上一拍方向。";
            });
          }, "orbitAction primary").setAttribute("data-orbit-focus", "orbit-aim-commit");
          aimPanel.onkeydown = function (event) {
            if (event.target !== aimPanel) return; /* 按鈕保留原生 Enter，避免冒泡後同時落筆。 */
            if (event.key === "ArrowLeft" || event.key === "ArrowRight" || event.key === "Enter") {
              event.preventDefault();
              if (event.key === "ArrowLeft") doOrbit("nudgeOrbitAim", { delta:-Math.PI/30 }, "箭頭已逆時針轉 6°；尚未落筆。");
              else if (event.key === "ArrowRight") doOrbit("nudgeOrbitAim", { delta:Math.PI/30 }, "箭頭已順時針轉 6°；尚未落筆。");
              else doOrbit("commitOrbitBeat", {});
            }
          };
        }
        if ((o.manualBeats || []).length) {
          orbit4Table(work, ["拍","指向本拍中心的誤差","判讀"], o.manualBeats.map(function (beat) {
            return [
              String(beat.step),
              beat.angleCurrentDeg.toFixed(1)+"°",
              beat.valid ? "✓ 本拍站得住" : (beat.matchedPreviousEarth ? "✕ 指向上一拍的位置" : "✕ 偏離本拍規則")
            ];
          }));
        }
        if ((o.manualBeats || []).length === 3 && !o.manualComplete) {
          ship3El("p", "三拍已寫滿，但至少一拍不合封存規則。錯線保留成幽靈紙；必須重置三拍，不能直接讓牛頓續畫。", work, "orbitNote");
          ship3Btn(work, "保留錯線，重置三拍", function () {
            doOrbit("resetOrbitBeats", {}, function (rr) {
              return "✓ 錯線已收進幽靈紙（共 "+rr.ghosts+" 張）；新紙從第一拍重新判斷。";
            });
          }, "orbitAction consequence");
        }
        if (o.manualComplete && (o.manualBeats || []).length === 3) {
          ship3Btn(work, "請牛頓照同一規則續畫二十七拍", function () {
            doOrbit("continueOrbitRule", {});
          }, "orbitAction primary");
        }
      }
      if ((o.manualAttempts || []).length) {
        ship3El("p", "幽靈紙 "+o.manualAttempts.length+" 張仍在；它們記下錯拍，沒有被重置動作刪除。", work, "orbitNote");
      }
      if ((o.ruleRuns || []).length) {
        orbit4Table(work, ["封存規則","預測","實際"], o.ruleRuns.map(function (run) {
          return [
            targetLabels[run.target]+"｜"+speedLabels[run.speed]+"｜"+strengthLabels[run.strength],
            shapeLabels[run.prediction] || run.prediction,
            (run.predictionMatched ? "✓ " : "")+(shapeLabels[run.actualShape] || run.actualShape)
          ];
        }));
      }
      if (o.complete && !ev.k1) renderK1Claim();
      if (!o.complete && o.continuedAt)
        ship3El("p", "這條路已完整留下，但沒有形成可拿去主張的閉合紙。改變四項設定時，舊路徑仍保留在紀錄表。三組速度／箭長配對都可能形成近圓，不只有中間那格。", work, "orbitNote");
    }
    if (phase === "claim") renderK1Claim();
    if (phase === "scale") {
      ship3El("h3", "兩條路分開算，最後再疊起來", work);
      var scaleSources = ship3El("details", null, work, "orbitSourceNote");
      ship3El("summary", "這兩張紙從哪裡來？", scaleSources);
      ship3El("p", "地表 1 秒約 4.9 公尺，是依牛頓晚年回憶整理的教學重建，不是牛頓手稿。", scaleSources);
      ship3El("p", "月球距離約為 60 個地球半徑，來自當時已有的天文資料。兩張紙先分開，換成同一秒後才比較。", scaleSources);
      var scalePredictionLabels = {
        same:"幾乎不變",
        "one-sixtieth":"約剩原來的 1／60",
        "one-over-3600":"約剩原來的 1／3600",
        "almost-none":"換成一秒後小到幾乎看不見"
      };
      var timePaper = ship3El("section", null, work, "orbitScalePath time");
      ship3El("small", "藍紙｜時間換尺", timePaper);
      ship3El("b", "月球 60 秒偏折約 4.9 公尺；換成 1 秒會剩多少？", timePaper);
      ship3El("p", "這一張只改時間，不談月球離地球多遠。", timePaper);
      if (!sc.scalePrediction) {
        ship3El("h4", "第 1 步｜先把藍紙的答案封住", timePaper);
        var scaleBox = ship3El("div", null, timePaper, "orbitRuleDesigner");
        var scalePrediction = orbit4BlankSelect(scaleBox, [
          ["same",scalePredictionLabels.same],
          ["one-sixtieth",scalePredictionLabels["one-sixtieth"]],
          ["one-over-3600",scalePredictionLabels["one-over-3600"]],
          ["almost-none",scalePredictionLabels["almost-none"]]
        ], "先選一個大約範圍", "scale-prediction");
        ship3Btn(scaleBox, "封存這個答案", function () {
          if (!scalePrediction.value) {
            var viewport = orbit4CaptureViewport();
            orbit4Msg = "先選一個範圍，再封存。";
            orbit4RenderPreserving(viewport);
            return;
          }
          doOrbit("sealScalePrediction", { choice:scalePrediction.value },
            "答案已封存。現在再換算，不能回頭改答案。");
        }, "orbitAction primary");
      } else {
        ship3El("p", "你先猜｜"+scalePredictionLabels[sc.scalePrediction.choice]+
          (sc.scalePrediction.matched === false ? "（與後來換算不合，原預測仍保留）" : ""), timePaper, "orbitSealStatus");
      }
      if (sc.scalePrediction && !sc.conversionCorrect) {
        ship3El("h4", "第 2 步｜把 60 秒縮成 1 秒", timePaper);
        var conversionRow = ship3El("div", null, timePaper, "orbitRow");
        ship3Btn(conversionRow, "只除一次 60", function () {
          doOrbit("convertMoonTime", { choice:"divide-60" }, function (rr) {
            if (rr.ok) return "✓ 已換成一秒。";
            return orbit4Error(rr.reason || rr.consequence);
          });
        }, "orbitAction");
        ship3Btn(conversionRow, "時間 ÷60；偏折 ÷(60×60)", function () {
          doOrbit("convertMoonTime", { choice:"divide-3600" },
            "✓ 藍紙完成：時間縮短 60 倍，偏折依時間平方縮小，得到約 "+(4.9*1000/3600).toFixed(2)+" 毫米。");
        }, "orbitAction");
      }
      if (sc.conversionCorrect) {
        ship3El("div", "60 秒：4.9 公尺　→　1 秒：約 "+
          Number(sc.moonOneSecondSagMm).toFixed(2)+" 毫米", timePaper, "orbitScaleStrip matched");
      }
      if (sc.conversionCorrect && !sc.ratioCorrect) {
        var distancePaper = ship3El("section", null, work, "orbitScalePath distance");
        ship3El("small", "金紙｜距離比較", distancePaper);
        ship3El("b", "地表離地心約 1 個地球半徑，月球約 60 個。兩張『一秒紙』的偏折相差多少？", distancePaper);
        ship3El("p", "這一張只並排距離與一秒偏折，暫時不替它命名成哪一條律。", distancePaper);
        ship3El("h4", "第 3 步｜從兩張一秒紙選出相差的量級", distancePaper);
        var ratioBox = ship3El("div", null, distancePaper, "orbitRuleDesigner");
        var ratioChoice = orbit4BlankSelect(ratioBox, [
          ["60","約相差 60 倍"],
          ["360","約相差 360 倍"],
          ["3600","約相差 3600 倍"],
          ["36000","約相差 36000 倍"]
        ], "先選一個量級", "scale-ratio");
        ship3Btn(ratioBox, "把金紙放上疊合台", function () {
          if (!ratioChoice.value) {
            var viewport = orbit4CaptureViewport();
            orbit4Msg = "先選一個倍率，再確認。";
            orbit4RenderPreserving(viewport);
            return;
          }
          doOrbit("judgeScaleRatio", { choice:Number(ratioChoice.value) },
            "✓ 金紙的量級對上了。現在決定兩個 60 應該相加，還是相乘。");
        }, "orbitAction primary");
      }
      if (sc.ratioCorrect && !sc.relationCorrect) {
        var overlayBench = ship3El("section", null, work, "orbitScaleOverlay");
        ship3El("small", "疊合台｜兩條獨立路徑", overlayBench);
        ship3El("div", "藍紙：時間 ÷60，偏折依時間平方改變", overlayBench, "orbitScaleStrip time");
        ship3El("div", "金紙：距離 ×60；兩張一秒紙的偏折相差 3600 倍", overlayBench, "orbitScaleStrip distance");
        ship3El("h4", "第 4 步｜兩個 60 要怎麼組合，兩張紙才會對齊？", overlayBench);
        var relationBox = ship3El("div", null, overlayBench, "orbitRuleDesigner");
        var relationChoice = orbit4BlankSelect(relationBox, [
          ["add","相加：60＋60＝120"],
          ["multiply","相乘：60×60＝3600"],
          ["unknown","先不把兩張紙連起來"]
        ], "選擇疊合方式", "scale-relation");
        ship3Btn(relationBox, "疊起來核對", function () {
          if (!relationChoice.value) {
            var viewport = orbit4CaptureViewport();
            orbit4Msg = "先選一個關係，再確認。";
            orbit4RenderPreserving(viewport);
            return;
          }
          doOrbit("judgeScaleRelation", { choice:relationChoice.value },
            "✓ 兩張紙對齊：一條從時間平方換算，一條從距離平方建模，各自得到 1／3600。");
        }, "orbitAction primary");
      }
      if (sc.relationCorrect) {
        var matchedOverlay = ship3El("section", null, work, "orbitScaleOverlay complete");
        ship3El("small", "疊合完成", matchedOverlay);
        ship3El("div", "藍紙｜60 秒 → 1 秒：偏折剩 1／3600", matchedOverlay, "orbitScaleStrip time matched");
        ship3El("div", "金紙｜距離 1 → 60；一秒偏折相差 3600 倍", matchedOverlay, "orbitScaleStrip distance matched");
        ship3El("b", "兩個 3600 不是同一步重算：一個來自時間換尺，一個來自兩張一秒紙的比較。它們在這裡對上，才支持距離平方關係。", matchedOverlay);
        ship3El("p", "✓ 同尺紙完成｜月球的一秒偏折，和地表的一秒下落，可以放在同一把尺上比較。", matchedOverlay, "orbitSealStatus");
        var math=ship3El("details",null,work,"orbitMathOptional");
        ship3El("summary","想看公式，再展開",math);
        ship3El("p","月球 60 秒約偏 4.9 m；依 s ∝ t² 換成 1 秒約 1.36 mm。地表 1 秒約 4.9 m，兩者相差約 3600 倍。",math);
      }
    }
    if (phase === "planets") {
      ship3El("h3", "先押週期，再一起拆封", work);
      ship3El("p","先替火星、木星各選一個大約週期。兩張都封好以前，哈雷不會翻開任何觀測紙；押錯也保留，不會擋住後面的核對。",work,"orbitNote");
      var bandOptions = {
        mars:[["short","約 1.5 年"],["middle","約 1.9 年"],["long","約 2.3 年"]],
        jupiter:[["short","約 5 年"],["middle","約 8 年"],["long","約 12 年"]]
      };
      ["mars","jupiter"].forEach(function(id){
        var row=ship3El("section",null,work,"orbitPlanetCard");
        ship3El("b",id==="mars"?"火星｜距離 1.52":"木星｜距離 5.20",row);
        var prior=pl.predictions.filter(function(p){return p.planet===id;});
        var current = prior.filter(function(p){return !p.superseded;})[0];
        if (!current) {
          var sealRow = ship3El("div",null,row,"orbitPlanetSealRow");
          var bandChoice = orbit4BlankSelect(sealRow, bandOptions[id],
            "先押一個大約週期", "planet-band-"+id);
          ship3Btn(sealRow,"封住這張紙",function(){
            if(!bandChoice.value){
              var viewport=orbit4CaptureViewport();
              orbit4Msg="先選一個大約週期，再封住紙角。";
              orbit4RenderPreserving(viewport);return;
            }
            doOrbit("sealPlanetPrediction",{id:id,bandId:bandChoice.value},function(rr){
              return "✓ "+(id==="mars"?"火星":"木星")+"已封存：你押 "+rr.prediction.playerBandLabel+"。觀測紙仍未拆。";
            });
          },"orbitAction primary");
        }
        prior.forEach(function(p){
          var prefix=p.superseded?"（舊律，保留） ":"";
          var sealedText=p.playerBandLabel
            ? "你先押 "+p.playerBandLabel+"｜規則算出 "+p.prediction.toFixed(3)
            : "規則預測 "+p.prediction.toFixed(3);
          var visibleText=p.revealedAfterSeal
            ? sealedText+"｜觀測 "+p.actual.toFixed(2)+"｜殘差 "+p.residualPct.toFixed(2)+"%"
            : sealedText+"｜觀測仍在蠟封後";
          ship3El("p",prefix+visibleText,row,p.superseded?"superseded":"");
        });
      });
      var currentPlanetRows=(pl.predictions||[]).filter(function(p){return !p.superseded;});
      var bothSealed=["mars","jupiter"].every(function(id){
        return currentPlanetRows.some(function(p){return p.planet===id;});
      });
      var anyRevealed=pl.revealed.mars||pl.revealed.jupiter;
      if(bothSealed&&!anyRevealed) ship3Btn(work,"兩張都封好了，請哈雷一起拆開",function(){
        doOrbit("revealPlanetPredictions",{},"✓ 兩張觀測同時翻開。你原先押的刻痕、規則算出的數字和實際週期都留在紙上。");
      },"orbitAction primary");
      ship3El("p","K3 看的是程序：是不是先留下承諾，再看答案。大約週期押錯不扣證據；看完才改，才會失去資格。",work,"orbitNote");
      if (!ev.k3 && pl.crossScalePass) {
        var currentPrediction = {};
        (pl.predictions || []).forEach(function (prediction) {
          if (!prediction.superseded) currentPrediction[prediction.planet] = prediction;
        });
        function planetPredictionDetail(id) {
          var prediction = currentPrediction[id];
          return prediction
            ? "預測 " + prediction.prediction.toFixed(3) + "｜觀測 " +
              prediction.actual.toFixed(2) + "｜殘差 " + prediction.residualPct.toFixed(2) + "%"
            : "";
        }
        orbit4ClaimPanel(work, {
          key:"k3",
          title:"揭露之後，核對哪兩張預測真的是事前留下的",
          prompt:"先看蠟封預測，再看揭露後的殘差。相合只屬於做過的火星與木星，不能替其他行星作答。",
          sources:[
            { id:"mars-sealed", label:"火星封存預測紙",
              available:!!(currentPrediction.mars && currentPrediction.mars.pass),
              detail:planetPredictionDetail("mars") },
            { id:"jupiter-sealed", label:"木星封存預測紙",
              available:!!(currentPrediction.jupiter && currentPrediction.jupiter.pass),
              detail:planetPredictionDetail("jupiter") }
          ],
          claims:[
            ["withheld-data-prediction","這句話寫到火星與木星：兩筆預測都先封存，揭露後落進殘差帶"],
            ["after-the-fact-fit","這句話寫到火星與木星：觀測揭露後再調整距離律，兩筆才落進殘差帶"],
            ["all-planets-proved","這句話寫到行星全體：火星與木星的兩筆相合，足以替其他行星作答"]
          ],
          action:"assertK3",
          args:function (records, concept) { return { records:records, concept:concept }; },
          success:"✓ 兩個週期都在揭露前留下預測，並通過殘差帶。"
        });
      }
    }
    if (phase === "comet") {
      ship3El("h3","兩疊星圖，是同一位來客嗎？",work);
      ship3El("p","十一月與十二月的星圖各自可靠；問題在於接縫。請讓日期順序與相對星位一起決定路徑。",work,"orbitNote");
      var cometChoices=ship3El("div",null,work,"orbitCometChoices");
      ship3Btn(cometChoices,"把兩張紙最近的端點直接連起來",function(){
        doOrbit("connectCometTracks",{mode:"hard-kink"});
      },"orbitAction",comet.joined);
      ship3Btn(cometChoices,"依日期與星位，讓方向在接縫前後連續",function(){
        doOrbit("connectCometTracks",{mode:"same-orbit"},"✓ 兩疊星點接成一條高傾角路徑；原先「兩顆」的判斷仍留在桌邊。");
      },"orbitAction",comet.joined);
      if ((comet.attempts || []).length) {
        var cometHistory=ship3El("section",null,work,"orbitCometHistory");
        ship3El("b","接軌紀錄",cometHistory);
        (comet.attempts || []).forEach(function(attempt){
          ship3El("p",(attempt.ok?"✓ ":"✕ ")+attempt.note,cometHistory,attempt.ok?"complete":"wrong");
        });
      }
    }
    if (phase === "press-opening") {
      ship3El("h3","彗星還沒算完，第一輪位置先到了",work);
      var pressBox=ship3El("section",null,work,"orbitPressBox");
      ship3El("b","目前能支持：月球＋行星。尚缺：彗星＋替代模型比較。",pressBox);
      ship3Btn(pressBox,"送出範圍較小的誠實短稿",function(){doOrbit("submitPartialProof",{scope:"moon-planets"},"✓ 短稿花掉一輪；回報是署名爭議提早浮上桌，1679 年書信與回應已收入來源袋。");},"orbitAction",!!proof.press.openingChoice);
      ship3Btn(pressBox,"放掉本輪，等待完整反驗",function(){doOrbit("deferPress",{reason:"等待彗星與替代模型比較"},"✓ 延後保住完整反驗時間；1679 年書信仍在，署名爭議留到印刷台處理。");},"orbitAction",!!proof.press.openingChoice);
      if (proof.press.priorityRecord) {
        var priority = ship3El("section",null,work,"orbitPressBox");
        ship3El("b",proof.press.priorityRecord.route==="raised-early"?"短稿的回報":"延後的取捨",priority);
        ship3El("p",proof.press.priorityRecord.return+"；來源仍是可查的 1679 年書信。",priority,"orbitNote");
      }
    }
    if (phase === "models") {
      ship3El("h3","先處理印刷排程，再逐列對帳",work);
      if (!proof.press.openingChoice) {
        var modelPress = ship3El("section",null,work,"orbitPressBox");
        ship3El("b","第一輪印刷位置到了；目前只有月球、行星與改向紙，彗星和兩本帳還沒完成。",modelPress);
        ship3El("p","這個選擇只做一次，會留下可查的排程與署名路線。做完才開對帳桌。",modelPress,"orbitNote");
        ship3Btn(modelPress,"送出只寫到月球與行星的誠實短稿",function(){
          doOrbit("submitPartialProof",{scope:"moon-planets"},
            "✓ 短稿用掉第一輪；署名爭議提早浮上桌，1679 年書信仍留在來源袋。");
        },"orbitAction");
        ship3Btn(modelPress,"明列理由延後，保留完整反驗",function(){
          doOrbit("deferPress",{reason:"等待彗星接軌與兩本帳完成"},
            "✓ 延後理由已入帳；第一輪不會被假裝成已送稿。");
        },"orbitAction");
      } else {
        ship3El("p", proof.press.openingChoice==="partial"
          ? "✓ 第一輪已送誠實短稿；署名爭議提前回到桌上。"
          : "✓ 第一輪已明列理由延後；完整反驗保留。", work, "orbitSealStatus");
        ship3El("p","公平標準已固定：兩本帳都讀同一批月亮、行星、彗星觀測；原始結果不因你加借條而改寫。",work,"orbitNote");
        var caseNames = { moon:"月亮", planets:"行星", comet:"彗星" };
        var activeCase = (ml.rowOrder || []).find(function (caseId) {
          return (ml.completedRows || []).indexOf(caseId) < 0;
        });
        if (!activeCase && (ml.completedRows || []).length < 3) {
          ship3El("h4","下一列先看誰？",work);
          if (!comet.joined && (ml.completedRows || []).indexOf("comet") < 0) {
            var cometPrep=ship3El("section",null,work,"orbitPressBox");
            ship3El("b","彗星列尚未可用｜先把兩疊獨立星圖接成一份觀測",cometPrep);
            ship3El("p","接軌不會替你決定三列順序；它只讓彗星成為可過帳的原始資料。",cometPrep,"orbitNote");
            var cometPrepChoices=ship3El("div",null,cometPrep,"orbitCometChoices");
            ship3Btn(cometPrepChoices,"只把最近端點硬接",function(){
              doOrbit("connectCometTracks",{mode:"hard-kink"});
            },"orbitAction");
            ship3Btn(cometPrepChoices,"依日期與參考星讓方向連續",function(){
              doOrbit("connectCometTracks",{mode:"same-orbit"},
                "✓ 彗星觀測已接續；現在由你決定何時把它過帳。");
            },"orbitAction primary");
          }
          var rowChoices = ship3El("div",null,work,"orbitSourceChoices");
          ["moon","planets","comet"].forEach(function(caseId){
            var already = (ml.completedRows || []).indexOf(caseId) >= 0;
            ship3Btn(rowChoices,(already?"✓ ":"")+caseNames[caseId],function(){
              doOrbit("beginLedgerRow",{caseId:caseId},function(rr){
                return rr.thoughtSuccess
                  ? "月亮這一列看來兩種說法都能過——我們一度以為成功了。先別裁決，還有行星與彗星。"
                  : "✓ "+caseNames[caseId]+"原始結果已開列；現在才輪到你蓋章。";
              });
            },"orbitAction",already||(caseId==="comet"&&!comet.joined));
          });
        }
        if (activeCase) {
          var activeStage = ml.rowStage[activeCase];
          ship3El("h4","正在對帳｜"+caseNames[activeCase],work);
          if (activeCase==="comet" && !comet.joined) {
            ship3El("p","兩疊彗星星圖尚未接成同一條路；先處理接縫，才有可蓋章的彗星列。",work,"orbitNote");
            var joinChoices = ship3El("div",null,work,"orbitCometChoices");
            ship3Btn(joinChoices,"只把最近端點硬接",function(){
              doOrbit("connectCometTracks",{mode:"hard-kink"});
            },"orbitAction");
            ship3Btn(joinChoices,"依日期與參考星讓方向連續",function(){
              doOrbit("connectCometTracks",{mode:"same-orbit"},
                "✓ 兩疊星點接成同一條高傾角路徑；錯誤折角仍留在接軌紀錄。");
            },"orbitAction primary");
          }
          function latestLedgerRun(model) {
            for (var i = ml.runs.length - 1; i >= 0; i--) {
              if (ml.runs[i].caseId===activeCase && ml.runs[i].model===model) return ml.runs[i];
            }
            return null;
          }
          function rawLedgerText(model, run) {
            if (!run) return "尚未開列";
            if (model==="inverseSquare")
              return "同一規則的殘差 "+Number(run.residual).toFixed(1)+"%。";
            if (activeCase==="moon") return "能定性說月亮隨流轉，但沒有交出可核對數字。";
            if (activeCase==="planets")
              return "同一張流速表推得木星 "+run.predictedYears+" 年；觀測約 "+run.observedYears+" 年。";
            return "逐夜路徑的方向與固定流面、流向衝突。";
          }
          function rowCompletionText(caseId, loanText) {
            if ((state.lab.modelLab.completedRows || []).length === 3)
              return "✓ "+caseNames[caseId]+"列封存。第三列剛剛合上，現在才有資格看整張桌，不會提前用兩列代替三列。"+(loanText||"");
            return "✓ "+caseNames[caseId]+"列已封存。還有列未完成，整張桌暫不裁決。"+(loanText||"");
          }
          [["inverseSquare","拉力帳"],["simpleVortex","渦旋帳"]].forEach(function(modelDef){
            var model = modelDef[0], run = latestLedgerRun(model);
            var stamp = model==="inverseSquare" ? activeStage.forceStamp : activeStage.vortexStamp;
            var card = ship3El("section",null,work,"orbitModelSuite");
            ship3El("b",modelDef[1]+"｜原始結果",card);
            ship3El("p",rawLedgerText(model,run),card,"orbitNote");
            if (stamp) {
              ship3El("p","✓ 你蓋的章："+({matches:"對得上",story:"只有說法",mismatch:"對不上"}[stamp]),card,"orbitSealStatus");
            } else if (activeCase!=="comet" || comet.joined) {
              ship3El("p","這一格要蓋哪顆章？錯章會彈回，原始結果不會被改寫。",card,"orbitNote");
              var stampRow = ship3El("div",null,card,"orbitRow");
              [["matches","對得上"],["story","只有說法"],["mismatch","對不上"]].forEach(function(stampDef){
                ship3Btn(stampRow,stampDef[1],function(){
                  doOrbit("stampLedgerCell",{caseId:activeCase,model:model,stamp:stampDef[0]},function(rr){
                    if (rr.row && rr.row.complete) return rowCompletionText(activeCase,"");
                    if (rr.awaitsLoan) return "✓ 兩格章都已落下；現在由你決定是否留下借條。";
                    return "✓ 這顆章與原始結果相合；另一格仍等你判讀。";
                  });
                },"orbitAction");
              });
            }
          });
          var readyForLoan = activeCase!=="moon" && activeStage.forceStamp==="matches" &&
            activeStage.vortexStamp==="mismatch" && !ml.loanDecisions[activeCase];
          if (readyForLoan) {
            var loanBox = ship3El("section",null,work,"orbitPressBox");
            ship3El("b","失配已蓋章。要不要借一個新假設替渦旋帳補說法？",loanBox);
            ship3El("p",activeCase==="planets"
              ?"借條內容：木星所在那一層另設流速。"
              :"借條內容：彗星可以穿過流（未量過）。",loanBox,"orbitNote");
            ship3Btn(loanBox,"親手加借條（之後不可刪）",function(){
              doOrbit("addModelLoan",{caseId:activeCase},function(){
                return rowCompletionText(activeCase," 借條已永久留在帳上。");
              });
            },"orbitAction consequence");
            ship3Btn(loanBox,"不加借條，保留失配",function(){
              doOrbit("declineModelLoan",{caseId:activeCase},function(){
                return rowCompletionText(activeCase," 本列沒有借條，失配原樣保留。");
              });
            },"orbitAction primary");
          }
        }
        if ((ml.completedRows || []).length) {
          orbit4Table(work,["完成次序","觀測列","拉力帳章","渦旋帳章","借條"],(ml.completedRows || []).map(function(caseId,index){
            var stage=ml.rowStage[caseId]||{};
            return [
              String(index+1),caseNames[caseId],
              {matches:"對得上",story:"只有說法",mismatch:"對不上"}[stage.forceStamp]||"—",
              {matches:"對得上",story:"只有說法",mismatch:"對不上"}[stage.vortexStamp]||"—",
              ml.loanDecisions[caseId]==="loan"?"有（不可刪）":(ml.loanDecisions[caseId]==="no-loan"?"無":"—")
            ];
          }));
        }
        if ((ml.completedRows || []).length===3 && !ml.comparisonSealed) {
          var planetLoan=(ml.loans||[]).some(function(loan){return loan.caseId==="planets";});
          var cometLoan=(ml.loans||[]).some(function(loan){return loan.caseId==="comet";});
          var actualClaimText=!planetLoan&&!cometLoan
            ?"拉力帳三格都有數且對得上；渦旋帳一格只有說法，另外兩格對不上。"
            :(planetLoan&&!cometLoan
              ?"拉力帳三格都有數；渦旋帳的行星格靠另設流速的借條才說得通，彗星格仍對不上。"
              :(!planetLoan&&cometLoan
                ?"拉力帳三格都有數；渦旋帳的彗星格靠未量過的穿流假設才說得通，行星格仍對不上。"
                :"拉力帳三格都有數；渦旋帳兩個失配各靠一張旅人留下的借條才改成說得通。"));
          ship3El("h4","三列都完成。總結必須把實際借條一起寫進去",work);
          var compareBox=ship3El("div",null,work,"orbitRuleDesigner");
          var compareChoice=orbit4BlankSelect(compareBox,[
            ["same","三列結果顯示兩本帳同樣完整，沒有差別"],
            ["all-vortices","這一本渦旋帳對不上，所以所有渦旋或介質模型都已被否定"],
            ["actual-ledger",actualClaimText]
          ],"先選總結範圍（尚未預選）","model-comparison");
          ship3Btn(compareBox,"封存對帳總結",function(){
            if(!compareChoice.value){
              var viewport=orbit4CaptureViewport();
              orbit4Msg="✕ 總結仍是空白；請把三列與實際借條一起讀完。";
              orbit4RenderPreserving(viewport);return;
            }
            doOrbit("sealModelComparison",{claim:compareChoice.value},function(rr){
              return "✓ K4 對帳紙成立｜"+rr.claimText;
            });
          },"orbitAction primary");
        }
        if (ml.comparisonSealed && ml.evidencePackage)
          ship3El("p","✓ 已封存｜"+ml.evidencePackage.claimText,work,"orbitSealStatus");
      }
    }
    if (phase === "proof") {
      ship3El("h3","把每一段證明接回它的來源",work);
      var status=ship3El("p",(proof.press.scheduleLost?"原排程已錯過；完整稿仍可重新排入。":"目前校樣窗口："+proof.press.window+"／"+proof.press.reservedWindows),work,"orbitPressStatus");
      status.setAttribute("role","status");
      if (proof.press.priorityRecord) ship3El("p",
        (proof.press.priorityRecord.route==="raised-early"?"短稿已讓署名爭議提早出現。":"署名爭議直到印刷台才處理。")+
        "兩條路都保留 1679 年書信，不因分支抹掉來源。",work,"orbitNote");
      var slotDefs=[
        ["inertia","原有前進",["M3","K1","K2"],["M2","M3"]],
        ["inward","逐拍向內改向",["K1","K2","K4"],["K1"]],
        ["distance","地上與天上的同尺比較",["K2","K3","K1"],["K2"]],
        ["withheld","先封存、後揭露的行星預測",["K3","K2","K4"],["K3"]],
        ["model","月亮、行星、彗星的反驗",["K4","K3","K2"],["K4"]],
        ["shell","球殼內外如何合成",["SHELL"],["SHELL"]]
      ];
      var sourceLabels={
        M2:"拋體紙：前進與下墜同時存在",
        M3:"船上紙：鬆手不清除原有前進",
        K1:"逐拍改向後留下的閉合軌道",
        K2:"地表與月球的同尺比較",
        K3:"火星、木星的封存預測",
        K4:"三列觀測與兩本帳的旅人蓋章紀錄",
        SHELL:"球殼定理頁：第一卷命題 70、71、74"
      };
      var slotState={};
      (proof.slots || []).forEach(function(r){slotState[r.slot]=r.evidenceId;});
      var chain=ship3El("div",null,work,"orbitProofTrack");
      chain.style.gridTemplateColumns="repeat(3,minmax(0,1fr))";
      slotDefs.forEach(function(d,i){
        var picked=slotState[d[0]];
        var ok=picked&&d[3].indexOf(picked)>=0;
        var chip=ship3El("section",null,chain,"orbitProofStep "+(ok?"done":(picked?"wrong":"pending")));
        ship3El("small","第 "+(i+1)+" 段",chip);
        ship3El("b",d[1],chip);
        ship3El("span",picked?(ok?"✓ "+sourceLabels[picked]:"斷在："+sourceLabels[picked]):"尚未放入來源",chip);
      });
      var openSlot=slotDefs.slice(0,5).find(function(d){
        return !slotState[d[0]]||d[3].indexOf(slotState[d[0]])<0;
      });
      var baseChainReady=!openSlot;
      if (openSlot) {
        ship3El("h4","替「"+openSlot[1]+"」放入哪一份已取得的紙？",work);
        var sourceChoices=ship3El("div",null,work,"orbitSourceChoices");
        openSlot[2].forEach(function(source){
          ship3Btn(sourceChoices,sourceLabels[source],function(){
            doOrbit("placeProofLink",{slot:openSlot[0],evidenceId:source},
              openSlot[3].indexOf(source)>=0
                ?"✓ 這一段接上了。下一個缺口已移到版框中央。"
                :null);
          },"orbitAction");
        });
      }
      if (baseChainReady && !proof.shellPageReady) {
        ship3El("h4","五段來源接好了；第六槽仍然是空的",work);
        ship3El("p","球殼頁不是 K1–K5 的新證據，而是讓外部天體可按球心處理的數學證明頁。先由你把它翻出來。",work,"orbitNote");
        ship3Btn(work,"翻出球殼定理頁",function(){
          doOrbit("revealShellPage",{},
            "✓ 球殼定理頁已翻到桌上；它還沒有自己跳進第六槽。");
        },"orbitAction primary");
      }
      if (baseChainReady && proof.shellPageReady && !proof.shellPagePlaced) {
        var shellCard=ship3El("section",null,work,"orbitPressBox");
        ship3El("b","球殼定理頁｜第一卷命題 70、71、74",shellCard);
        ship3El("p","頁面已在桌上；必須由你親手放進「球殼內外如何合成」的第六槽。",shellCard,"orbitNote");
        ship3Btn(shellCard,"把球殼頁放進第六槽",function(){
          doOrbit("placeShellPage",{},
            "✓ 第六槽由你放入球殼頁；沒有人代放。");
        },"orbitAction primary");
      }
      var chainReady=baseChainReady&&proof.shellPageReady&&proof.shellPagePlaced&&slotState.shell==="SHELL";
      var credits=[
        ["direction","把切線運動與向中心吸引放進同一個問題","Hooke"],
        ["publication","追問、封存、推動出版","Halley"],
        ["observations","帶日期、星位與儀器來源的觀測","Flamsteed"],
        ["proof","數學證明與跨天體整合","Newton"]
      ];
      var peopleLabels={Hooke:"虎克",Halley:"哈雷",Flamsteed:"佛蘭斯蒂德",Newton:"牛頓"};
      if (chainReady && proof.hookeScope!=="precise-scope") {
        ship3El("h4","證明接起來了。虎克應該被寫到哪裡？",work);
        [
          ["hookeComplete","虎克把切線運動與向中心吸引放進同一個問題，也完成了這套定律的證明；牛頓將它整理成書"],
          ["newtonAlone","牛頓獨立提出這套概念，完成數學證明與跨天體整合；虎克的信只是旁證"],
          ["precise-scope","虎克在 1679 年把切線運動與向中心吸引放進同一個問題，1680 年又提出平方反比猜想；牛頓完成數學證明、球體處理與跨天體整合"]
        ].forEach(function(c){
          ship3Btn(work,(proof.hookeScope===c[0]?"✓ ":"")+c[1],function(){
            doOrbit("setHookeScope",{choice:c[0]},c[0]==="precise-scope"
              ?"✓ 虎克的線停在問題方向；牛頓的線從數學證明延伸到跨天體整合。"
              :null);
          },"orbitAction");
        });
        if (proof.hookeScope) {
          var scopeResult=ship3El("section",null,work,"orbitPressBox");
          if (proof.hookeScope==="hookeComplete") {
            ship3El("b","可見後果：一封信蓋過三百頁",scopeResult);
            ship3El("p","虎克的署名線伸過整套證明，牛頓的計算頁失去作者。這句寫得太多。",scopeResult,"orbitNote");
          } else if (proof.hookeScope==="newtonAlone") {
            ship3El("b","可見後果：1679 年書信脫落",scopeResult);
            ship3El("p","兩支箭仍在證明裡，提出問題的來源卻被切斷。這句寫得太少。",scopeResult,"orbitNote");
          }
        }
      }
      var openCredit=credits.find(function(d){return proof.attribution[d[0]]!==d[2];});
      if (chainReady && proof.hookeScope==="precise-scope" && openCredit) {
        ship3El("h4","把這一種工作接回名字",work);
        var creditCard=ship3El("section",null,work,"orbitCreditStage");
        ship3El("b",openCredit[1],creditCard);
        ship3El("span","這條來源線應該接到誰？",creditCard);
        var peopleRow=ship3El("div",null,creditCard,"orbitPeopleChoices");
        ["Hooke","Halley","Flamsteed","Newton"].forEach(function(person){
          ship3Btn(peopleRow,peopleLabels[person],function(){
            doOrbit("assignCredit",{contribution:openCredit[0],person:person},
              person===openCredit[2]
                ?"✓ 來源線接回 "+peopleLabels[person]+"；下一種工作翻到桌面。"
                :"這個名字接上後，另一份實際做過的工作從頁面脫落了。");
          },"orbitAction");
        });
      }
      var creditReady=chainReady&&proof.hookeScope==="precise-scope"&&credits.every(function(d){
        return proof.attribution[d[0]]===d[2];
      });
      if (creditReady) {
        var creditSummary=ship3El("div",null,work,"orbitCreditSummary");
        credits.forEach(function(d){ship3El("span","✓ "+peopleLabels[d[2]]+"｜"+d[1],creditSummary);});
        var authorField=proof.authorField||{names:["Newton","Traveler"],travelerRemoved:false};
        var authorCard=ship3El("section",null,work,"orbitPressBox");
        ship3El("b","作者欄｜"+(authorField.names||[]).map(function(name){
          return name==="Newton"?"牛頓":(name==="Traveler"?"旅人":name);
        }).join("、"),authorCard);
        if (!authorField.travelerRemoved) {
          ship3El("p","旅人參與操作與保管來源，但沒有完成《原理》的數學證明，也不預知作者欄。這個名字不會自己從欄裡消失。",authorCard,"orbitNote");
          ship3Btn(authorCard,"旅人親手退出作者欄",function(){
            doOrbit("removeTravelerFromAuthorField",{},
              "✓ 作者欄只留牛頓；旅人的操作紀錄仍留在來源與筆記裡。");
          },"orbitAction primary");
        } else {
          ship3El("p","✓ 旅人已退出作者欄；封面只留牛頓。來源紀錄沒有因此被刪除。",authorCard,"orbitSealStatus");
        }
      }
      var authorReady=creditReady&&proof.authorField&&proof.authorField.travelerRemoved===true&&
        Array.isArray(proof.authorField.names)&&proof.authorField.names.length===1&&proof.authorField.names[0]==="Newton";
      if (authorReady) {
        ship3El("h4","版面只剩最後一格：這本書究竟證明到哪裡？",work);
        ship3El("p","六槽、四條信用線與作者欄都接回去了。現在替整份證明寫最後一句；你可以透光看紙面，但沒有人會替你指出正解。",work,"orbitNote");
        [
          ["mechanismSolved","這份證明建立了能跨地表與天空反驗的規則，也說明了引力如何穿過空間作用"],
          ["ruleEstablished","這份證明建立了能跨地表與天空反驗的規則；它如何穿過空間作用，這批資料沒有回答"]
        ].forEach(function(c){
          ship3Btn(work,(proof.boundaryChoice===c[0]?"✓ ":"")+c[1],function(){doOrbit("setProofBoundary",{choice:c[0]},"末句已放入預覽；尚未送印，也沒有消耗窗口。");},"orbitAction");
        });
      }
      var actions=ship3El("div",null,work,"orbitProofActions");
      ship3Btn(actions,"透光檢查校樣",function(){doOrbit("previewProof",{},function(rr){
        return orbit4ProofPreviewText(rr.preview);
      });},"orbitAction");
      ship3Btn(actions,"親手壓下目前校樣",function(){
        doOrbit("submitProof",{},function(rr){
          return rr.ok
            ? "✓ 校樣已壓下並收入出版帳；錯稿與延後紀錄也都保留。"
            : null;
        });
      },"orbitAction consequence");
      ship3Btn(actions,"放掉本輪，再檢查一次",function(){doOrbit("deferPress",{reason:"再核對證明來源、信用與末句"},"本輪已明列理由延後；證據與目前排版全部保留。");},"orbitAction");
      if (proof.press.proofs.length || proof.press.delays.length) {
        var history=ship3El("details",null,work,"orbitPressHistory");ship3El("summary","查看所有錯稿與延後紀錄",history);
        proof.press.proofs.forEach(function(p,i){
          var note="";
          if(p.audit&&!p.audit.hookeScopeOk)note+="｜Hooke 貢獻句失準";
          if(p.audit&&p.audit.creditWrong&&p.audit.creditWrong.length)note+="｜署名斷線";
          if(p.audit&&!p.audit.shellOk)note+="｜第六槽缺球殼頁";
          if(p.audit&&!p.audit.authorOk)note+="｜作者欄仍有旅人";
          if(p.audit&&!p.audit.boundaryOk)note+="｜機制末句越界";
          ship3El("p","校樣 "+(i+1)+"｜"+(p.complete?"完整":"缺口已印出")+note,history,p.complete?"complete":"wrong");
        });
        proof.press.delays.forEach(function(d,i){ship3El("p","延後 "+(i+1)+"｜"+d.reason,history,"delay");});
      }
    }
    if (phase === "archive") {
      ship3El("h3","把證據連同邊界一起收好",work);
      ship3El("p","封面只寫一個作者；這五張紙記的是一條規則如何被做出來。請逐張翻看，再夾回旅人筆記。",work,"orbitNote");
      var archiveDefs=[
        ["K1","一直改向的路","支持：原有前進與持續向內改向可以同時存在。","不能證明：讓月亮改向的作用究竟是什麼。"],
        ["K2","地上與天上的同一把尺","支持：反平方縮弱讓近地落下與月球偏折的量級相認。","不能證明：一次相合就完成整套理論。"],
        ["K3","沒看答案前的兩個週期","支持：同一條律通過事先封存的火星與木星預測。","不能證明：其他天體不必再驗。"],
        ["K4","三列天空，兩本帳","支持：本章明列的拉力帳三列都有數且對得上；渦旋帳的說法、失配與旅人借條全部留存。","不能證明：其他尚未比較的渦旋或介質模型也必然如此。"],
        ["K5","名字與空白都要留下","支持：證明、觀測、概念與出版來源可被精確接回。","不能證明：已經知道引力的作用機制。"]
      ];
      var archiveGrid=ship3El("div",null,work,"orbitArchiveGrid");
      archiveDefs.forEach(function(def){
        var isClipped=archive.clipped.indexOf(def[0])>=0;
        var card=ship3El("section",null,archiveGrid,"orbitArchiveCard "+(isClipped?"clipped":""));
        ship3El("b",(isClipped?"✓ ":"")+def[1],card);
        var details=ship3El("details",null,card,"orbitArchiveReview");
        ship3El("summary","翻看這張紙",details);
        ship3El("p",def[2],details,"supports");
        ship3El("p",def[3],details,"limits");
        ship3Btn(card,isClipped?"已夾回旅人筆記":"夾回旅人筆記",function(){
          doOrbit("clipEvidence",{evidenceId:def[0]},function(rr){
            return rr.complete
              ? "✓ 五份證據都已收回；每份紙的錯路與邊界仍可翻查。"
              : "✓ 已夾回 "+rr.count+"／5。下一張紙仍要親手確認。";
          });
        },"orbitAction"+(isClipped?"":" primary"),isClipped);
      });
    }
    var defaultOrbitMsg = phase === "scale"
      ? "選錯沒關係，原答案會留在紙上；看提示後再試一次。"
      : "每個操作都可重做；錯誤先留下可見後果，再出現提示。";
    var msg=ship3El("p",orbit4Msg||defaultOrbitMsg,work,"orbitMessage");
    msg.setAttribute("role","status");
    if (N.embedReady(state)) {
      ship3Btn(work,"▶ 收好紀錄，回到故事",function(){
        var r=N.embedComplete(state);
        if(r.error){orbit4Msg="✕ "+r.error;renderAll();return;}
        setState(r.state);orbit4Msg="";renderAll();
      },"orbitGate primary");
    }
    /* 每個 canonical embed 只在本頁第一次 render 說一次；工作台目的卡仍原樣留著。 */
    orbit4SayCoach(ek, phase, mission[3], v.scene);
  }

  /* ---------- 第五章：兩本帳工作台 ---------- */
  var collision5Msg = "";
  function collision5RestoreFocus(focusKey) {
    if (!focusKey) return;
    window.requestAnimationFrame(function () {
      var next = document.querySelector('[data-c5-focus="' + focusKey + '"]');
      if (next) {
        try { next.focus({ preventScroll: true }); } catch (e) { next.focus(); }
      }
    });
  }
  function collision5Error(code, result) {
    var map = {
      "unknown-setting": "這個設定不在器材清單裡。",
      "masses-locked": "先用等重完成兩本帳；斷言二成立後才解鎖 4／8。",
      "round2-no-new-experiment": "這一輪不做新實驗。請勾回第一輪同一批紀錄，換活力帳重算。",
      "collision-round-complete": "碰撞台的必經紀錄已完成；下一輪改用黏土盤。",
      "followup-putty-4-8-required": "追一筆固定用 4／8 砝碼與油灰頭，才能檢查「總是少一半」。",
      "round1-equal-masses-required": "輪一先固定兩邊等重，別把碰法與重量混在一起。",
      "too-few-records": "這句話要能重現。你只勾了 " + ((result && result.count) || 0) + " 筆；鋼頭、油灰頭各至少三筆。",
      "both-heads-required": "只勾一種碰撞頭不夠。鋼頭與油灰頭都要各有三筆。",
      "mixed-masses": "這幾筆的砝碼不一樣。混在一起，就分不出是碰法還是重量。",
      "mixed-speeds": "這幾筆的撞前速度不同。先勾同一速度，讓兩種碰法正面比較。",
      "same-records-required": "輪二必須原封不動勾回斷言一那批紀錄；不是換資料湊結論。",
      "both-ledger-outcomes-required": "要同時看見鋼頭閉合與油灰短少，才能寫下斷言二。",
      "judgment-required": "原紙選好了，還差一步：請先選這批資料代表什麼。",
      "j1-concept-mismatch": "再看兩種碰法的動量欄：別只看其中一種，也別把油灰當成例外。",
      "j2-concept-mismatch": "這是同一批紙。請分開看鋼頭與油灰的活力欄，兩種收場沒有一起對平。",
      "j3-concept-mismatch": "把速度 2、4、6 和坑深並排；要比較的是一次方還是平方。",
      "square-relation-not-supported": "這三筆坑深目前不像速度平方。請確認沒有混球，也沒有勾錯原紙。",
      "followup-prediction-required": "先把你的預測封存：換成 4／8 後，短少仍是一半，還是會改變？",
      "unknown-selection-kind": "這筆原紙不屬於目前的資料簿。",
      "unknown-record": "找不到這張原紙；請重新確認紀錄。",
      "unknown-judgment": "這個判讀不在本輪候選裡。",
      "followup-required": "先完成 4／8 油灰追一筆，再進黏土。",
      "too-few-clay-records": "這句至少要三筆，而且要涵蓋三種速度。",
      "mixed-ball-masses": "先鎖住同一顆球。質量交叉驗證可以另做，不混進這張斷言。",
      "three-speeds-required": "兩個點連得出一條線，但看不出它是直的還是彎的。請勾三種速度。"
    };
    return map[code] || "這一步還不能成立。請檢查所選紀錄與本輪任務。";
  }
  function collision5Do(action, args, okText, explicitFocusKey) {
    var active = document.activeElement;
    var focusKey = explicitFocusKey ||
      active && active.getAttribute && active.getAttribute("data-c5-focus");
    var r = N.labAction(state, action, args || {});
    if (r.error) collision5Msg = "✕ " + collision5Error(r.error, r.result);
    else {
      setState(r.state);
      collision5Msg = typeof okText === "function" ? okText(r.result || {}) :
        (okText === undefined ? "✓ 已記錄。" : okText);
    }
    renderAll();
    collision5RestoreFocus(focusKey);
  }
  function collision5Select(parent, labelText, field, options, disabled) {
    var label = ship3El("label", null, parent, "collision5Setting");
    ship3El("span", labelText, label);
    var select = ship3El("select", null, label);
    select.setAttribute("data-c5-focus", field);
    options.forEach(function (opt) {
      var node = ship3El("option", opt[1], select);
      node.value = opt[0];
    });
    select.value = state.lab.draft[field];
    select.disabled = !!disabled;
    select.onchange = function () {
      collision5Do("setCollisionDraft", { field: field, value: select.value }, "", field);
    };
    return select;
  }
  function collision5Claims(parent, displayPhase) {
    var claims = [
      ["j1", "斷言一", "帶方向的 mv，撞前撞後總和不變",
        "取得條件：鋼頭、油灰頭各勾三筆同速紀錄。"],
      ["j2", "斷言二", "mv² 在彈性閉合、非彈性短少",
        "取得條件：勾回斷言一的同一批紀錄，重算 mv²。"],
      ["j3", "斷言三", "坑深跟著速度的平方走",
        "取得條件：同一顆球的三種速度各勾一筆黏土紀錄。"]
    ];
    var phase = displayPhase || state.lab.phase;
    var visibleCount = phase === "momentum" ? 1 :
      (phase === "vis-viva" || phase === "followup" || phase === "followup-result" ? 2 : 3);
    var grid = ship3El("div", null, parent, "collision5Claims");
    claims.slice(0, visibleCount).forEach(function (row) {
      var a = state.lab.assertions[row[0]];
      var card = ship3El("section", null, grid, "collision5Claim " + (a.done ? "done" : ""));
      ship3El("b", (a.done ? "✓ " : "○ ") + row[1], card);
      ship3El("p", a.done ? row[2] : row[3], card);
      if (a.done) ship3El("small", "引用紀錄 #" + a.sources.join("、#"), card);
    });
  }
  function collision5RecordTable(parent) {
    var rows = state.lab.collisionRuns.concat(state.lab.clayRuns);
    var showVisViva = !!state.lab.evidence.j1;
    var selectedCollision = state.lab.selections && state.lab.selections.collision || [];
    var selectedClay = state.lab.selections && state.lab.selections.clay || [];
    var wrap = ship3El("div", null, parent, "collision5TableWrap");
    var table = ship3El("table", null, wrap, "collision5Table");
    var head = ship3El("thead", null, table);
    var hr = ship3El("tr", null, head);
    var headings = ["選", "#", "配置", "撞前／速度", "撞後速度", "動量帳"];
    if (showVisViva) headings.push("活力帳／坑深");
    headings.forEach(function (text) {
      ship3El("th", text, hr);
    });
    var body = ship3El("tbody", null, table);
    rows.forEach(function (row) {
      var chosen = (row.kind === "collision" ? selectedCollision : selectedClay).indexOf(row.id) >= 0;
      var tr = ship3El("tr", null, body, chosen ? "selected" : "");
      var pickCell = ship3El("td", null, tr);
      var pick = ship3El("input", null, pickCell);
      pick.type = "checkbox";
      pick.checked = chosen;
      pick.setAttribute("aria-label", "勾選紀錄 " + row.id);
      pick.setAttribute("data-c5-focus", "record-" + row.id);
      pick.onchange = function () {
        collision5Do("setCollisionSelection", {
          kind: row.kind === "collision" ? "collision" : "clay",
          id: row.id,
          selected: pick.checked
        }, pick.checked ? "✓ 已勾選原紙 #" + row.id + "。" : "已取消原紙 #" + row.id + "。",
        "record-" + row.id);
      };
      ship3El("td", String(row.id), tr);
      if (row.kind === "collision") {
        ship3El("td", (row.head === "steel" ? "鋼頭" : "油灰") + "・" + row.masses, tr);
        ship3El("td", "A " + row.before.a + "，B " + row.before.b + " 尺／拍", tr);
        ship3El("td", "A " + row.after.a + "，B " + row.after.b + " 尺／拍", tr);
        ship3El("td", row.momentum.before + " → " + row.momentum.after + " ✓", tr);
        if (showVisViva) ship3El("td", row.visViva.before + " → " + row.visViva.after +
          (row.visViva.deficit ? "（短少 " + row.visViva.deficit + "）" : " ✓"), tr);
      } else {
        ship3El("td", (row.ballMass === "light" ? "輕球" : "重球") + "・" + row.height + " 格", tr);
        ship3El("td", row.speed + " 尺／拍", tr);
        ship3El("td", "—", tr);
        ship3El("td", "—", tr);
        if (showVisViva) ship3El("td", row.depth.toFixed(1) + " 分", tr);
      }
    });
    if (!rows.length) {
      var empty = ship3El("tr", null, body);
      var td = ship3El("td", "尚無紀錄。每按一次執行，只新增一筆。", empty);
      td.colSpan = headings.length;
    }
  }
  function collision5SelectedIds(kind) {
    var selections = state.lab.selections && state.lab.selections[kind] || [];
    return selections.slice();
  }
  function collision5Judgment(parent, key, prompt, options) {
    var wrap = ship3El("section", null, parent, "collision5Judgment");
    ship3El("b", prompt, wrap);
    var selected = state.lab.judgments && state.lab.judgments[key];
    options.forEach(function (option) {
      var button = ship3Btn(wrap, option[1], function () {
        collision5Do("setCollisionJudgment", { key: key, value: option[0] },
          "已封存你的判讀。現在可以連同原紙一起提交。", "judgment-" + key + "-" + option[0]);
      }, "collision5JudgmentOption" + (selected === option[0] ? " selected" : ""));
      button.setAttribute("aria-pressed", selected === option[0] ? "true" : "false");
      button.setAttribute("data-c5-focus", "judgment-" + key + "-" + option[0]);
    });
  }
  function renderCollision5(v, box) {
    box.className = "collision5Workbench";
    var phase = v.nodeId === "lab2b" && state.lab.evidence.followup
      ? "followup-result" : state.lab.phase;
    var spread = ship3El("div", null, box, "collision5Spread");
    var apparatus = ship3El("section", null, spread, "collision5Page collision5Apparatus");
    ship3El("small", phase === "clay" || phase === "complete"
      ? "I　黏土台與校準" : "I　碰撞台與校準", apparatus, "collision5Kicker");
    ship3El("h2", "同一張桌，兩本帳", apparatus);
    var sketch = ship3El("div", null, apparatus, "collision5Sketch");
    var visualPhase = phase === "followup-result" ? "followup" : phase;
    var visualId = ASSETS && ASSETS.collision5Visual && ASSETS.collision5Visual[visualPhase];
    var visual = assetEntry(visualId);
    if (visual) {
      var visualImage = document.createElement("img");
      visualImage.src = assetUrl(visual);
      visualImage.alt = phase === "followup" || phase === "followup-result"
        ? "不等重的兩台滑車裝上油灰頭，空白帳頁等待再追一筆"
        : (phase === "clay" || phase === "complete"
          ? "三段釋放高度、金屬球與重新拍平的黏土盤"
          : "兩台滑車、鋼頭、油灰頭、砝碼與鈴齒計時裝置");
      visualImage.style.width = "100%";
      visualImage.style.height = "auto";
      visualImage.style.maxHeight = "240px";
      visualImage.style.objectFit = "contain";
      visualImage.style.borderRadius = "4px";
      visualImage.style.flexBasis = "100%";
      sketch.appendChild(visualImage);
    }
    if (phase === "clay" || phase === "complete") {
      ship3El("strong", "這一輪：落球 → 黏土", sketch);
      ship3El("small", "確切高度、速度與坑深由下方設定與紀錄給出", sketch);
    } else if (phase === "followup" || phase === "followup-result") {
      ship3El("strong", "「總是少一半」？", sketch);
      ship3El("small", phase === "followup-result" ? "封存預測與 4／8 結果已並排" : "先封存預測，再換砝碼追一筆", sketch);
    } else {
      ship3El("span", "A 車　→", sketch);
      ship3El("strong", state.lab.draft.head === "steel" ? "鋼頭" : "油灰", sketch);
      ship3El("span", "←　B 車", sketch);
      ship3El("small", "軌道｜已固定｜確切配置看下方設定", sketch);
    }
    if (phase === "clay" || phase === "complete") {
      ship3El("p", "「這回換個問法。不問撞完剩下多少，問它花掉的力氣留下了什麼。」", apparatus, "collision5Coach");
      collision5Select(apparatus, "落下高度", "clayHeight",
        [["h1", "一格（v=2）"], ["h4", "四格（v=4）"], ["h9", "九格（v=6）"]]);
      collision5Select(apparatus, "球的質量", "ballMass",
        [["light", "輕球"], ["heavy", "重球"]], state.mode !== "scholar");
      ship3El("p", "黏土盤｜已固定｜每次重新拍平", apparatus, "collision5Fixed");
      ship3El("p", "量深方式｜已固定｜同一支深度尺", apparatus, "collision5Fixed");
      ship3Btn(apparatus, "放球入黏土（一次一筆）", function () {
        collision5Do("runClay", {}, function (r) {
          return "✓ #" + r.record.id + "：速度 " + r.record.speed +
            "，坑深 " + r.record.depth.toFixed(1) + " 分。";
        });
      }, "collision5Action primary");
    } else {
      collision5Select(apparatus, "碰撞頭", "head",
        [["steel", "鋼頭（會彈開）"], ["putty", "油灰頭（黏成一團）"]],
        phase === "vis-viva" || phase === "followup" || phase === "followup-result");
      collision5Select(apparatus, "撞前速度", "speed",
        [["low", "低刻度（2 尺／拍）"], ["mid", "中刻度（4 尺／拍）"], ["high", "高刻度（6 尺／拍）"]],
        phase === "vis-viva" || phase === "followup" || phase === "followup-result");
      collision5Select(apparatus, "滑車砝碼", "masses",
        [["4/4", "4／4（等重）"], ["4/8", "4／8"]],
        !state.lab.evidence.j2 || phase === "vis-viva" || phase === "followup-result");
      ship3El("p", "量速方式｜已固定｜鈴齒計時", apparatus, "collision5Fixed");
      ship3El("p", "方向｜已固定｜向右為正、向左為負", apparatus, "collision5Fixed");
      if (phase === "momentum") {
        ship3El("p", "「先把院士的帳親手做一遍。兩種碰法都要。」", apparatus, "collision5Coach");
        ship3Btn(apparatus, "放手撞一次（一次一筆）", function () {
          collision5Do("runCollision", {}, function (r) {
            return "✓ #" + r.record.id + "：" + (r.record.head === "steel" ? "鋼頭" : "油灰") +
              "，動量帳 " + r.record.momentum.before + " → " + r.record.momentum.after + "。";
          });
        }, "collision5Action primary");
      } else if (phase === "vis-viva") {
        ship3El("p", "「別再撞了。同樣那幾次，換這本帳重記一遍。」", apparatus, "collision5Coach");
        ship3El("p", "本輪不動裝置｜已固定", apparatus, "collision5Fixed");
      } else if (phase === "followup") {
        ship3El("p", "「先別急著把『一半』寫成規矩。換一邊的砝碼，再撞一次油灰。」", apparatus, "collision5Coach");
        ship3Btn(apparatus, "4／8 油灰追一筆", function () {
          collision5Do("runCollision", {}, function (r) {
            return "✓ 動量帳 24 → 24；活力帳 144 → 48，短少 96（三分之二）。";
          });
        }, "collision5Action primary", !(state.lab.judgments && state.lab.judgments.followup));
      } else if (phase === "followup-result") {
        var followupRow = state.lab.collisionRuns.filter(function (row) {
          return row.masses === "4/8" && row.head === "putty";
        }).slice(-1)[0];
        ship3El("p", "封存預測｜" + ({
          "always-half": "仍會短少一半",
          "changes-with-mass": "短少比例會隨砝碼改變",
          "same-amount": "仍會短少同樣的數量"
        }[followupRow && followupRow.followupPrediction] || "舊存檔未留預測"), apparatus, "collision5Fixed");
        if (followupRow) ship3El("p", "揭曉｜活力帳 " + followupRow.visViva.before + " → " +
          followupRow.visViva.after + "，短少 " + followupRow.visViva.deficit + "（三分之二）。",
        apparatus, "collision5Coach");
      }
    }
    var parts = ship3El("details", null, apparatus, "collision5Survey");
    ship3El("summary", "器材踏查（四個部位）", parts);
    [
      ["滑車與砝碼", "兩台滑車在同一條軌上相撞；砝碼決定各自多重。", "重量先別動。你要問的是碰法，不是誰比較重。"],
      ["碰撞頭", "鋼頭會彈開；油灰頭會黏成一團。", "這一顆換下去，撞完就是兩種完全不同的收場。"],
      ["釋放架", "從多高放手，決定撞之前跑多快。", "同一個刻度放，速度才對得上。"],
      ["鈴齒計時", "兩聲之間就是一段時間，讓快慢留下數字。", "沒有它，你只能說「比較快」。"]
    ].forEach(function (item) {
      var p = ship3El("p", null, parts);
      ship3El("b", item[0] + "｜", p);
      p.appendChild(document.createTextNode(item[1] + " 杜夏特萊：「" + item[2] + "」"));
    });

    var notebook = ship3El("section", null, spread, "collision5Page collision5Notebook");
    ship3El("small", "II　旅人實驗簿", notebook, "collision5Kicker");
    ship3El("h2", {
      momentum: "第一輪：先查動量帳",
      "vis-viva": "第二輪：同紙重算活力帳",
      followup: "追一筆：檢查「一半」",
      "followup-result": "追一筆：預測與反例並排",
      clay: "第三輪：用黏土留下尺度",
      complete: "對帳：三張斷言已齊"
    }[phase], notebook);
    var mission = {
      momentum: {
        purpose: "這一輪要回答：院士的動量帳，鋼頭與油灰兩種碰法都能對平嗎？",
        procedure: "做法：兩種碰撞頭各留三筆；勾同速紀錄，結算帶方向的 mv。"
      },
      "vis-viva": {
        purpose: "這一輪要回答：同一批紀錄換算 mv²，兩種碰法還會一起對平嗎？",
        procedure: "做法：零次新實驗；勾回斷言一的同一批紀錄，改算 mv²。"
      },
      followup: {
        purpose: "這一輪要回答：油灰碰撞的短少，真的總是固定一半嗎？",
        procedure: "做法：先押一個預測並封存，再換成 4／8 不等重配置追一筆。"
      },
      "followup-result": {
        purpose: "結果已揭曉：等重時少一半，4／8 時少三分之二。",
        procedure: "先前預測仍留在紙上；現在回到故事，說出哪個假規律被推翻。"
      },
      clay: {
        purpose: "這一輪要回答：黏土坑深能不能替可見運動的短少提供一把可量的尺？",
        procedure: "做法：同一顆球用三種速度各留一筆，勾選後比較坑深與 v²。"
      },
      complete: {
        purpose: "這一輪已回答：兩本帳各自有用，黏土只提供可量的痕跡。",
        procedure: "三張斷言已齊；完整去向仍未對平，可以回故事進入辯論。"
      }
    }[phase];
    var missionCard = ship3El("section", null, notebook, "collision5Mission");
    ship3El("b", mission.purpose, missionCard);
    ship3El("p", mission.procedure, missionCard);
    collision5Claims(notebook, phase);
    collision5RecordTable(notebook);
    var actions = ship3El("div", null, notebook, "collision5AssertionActions");
    if (phase === "momentum") {
      collision5Judgment(actions, "j1", "你勾的這批紙，支持哪一句？", [
        ["both-close", "鋼頭與油灰的帶方向 mv 都閉合"],
        ["steel-only", "只有鋼頭的帶方向 mv 閉合"],
        ["putty-breaks", "油灰一黏住，動量帳就失效"]
      ]);
      ship3Btn(actions, "用勾選紀錄提出斷言一", function () {
        collision5Do("assertJ1", { runIds: collision5SelectedIds("collision"), concept: state.lab.judgments && state.lab.judgments.j1 },
          "✓ J1 入卷：兩種碰法的帶方向 mv 都閉合。");
      }, "collision5Action");
    } else if (phase === "vis-viva") {
      collision5Judgment(actions, "j2", "同一批紙換算 mv² 後，支持哪一句？", [
        ["steel-close-putty-short", "鋼頭閉合；油灰從可見運動短少"],
        ["both-close", "鋼頭與油灰仍然一起閉合"],
        ["both-short", "鋼頭與油灰都短少"]
      ]);
      ship3Btn(actions, "用同一批紀錄重算活力帳", function () {
        collision5Do("assertJ2", { runIds: collision5SelectedIds("collision"), concept: state.lab.judgments && state.lab.judgments.j2 },
          "✓ J2 入卷：鋼頭閉合，油灰從可見運動短少。");
      }, "collision5Action");
    } else if (phase === "followup") {
      collision5Judgment(actions, "followup", "換成 4／8 前，先押一個預測：", [
        ["always-half", "油灰仍會固定短少一半"],
        ["changes-with-mass", "短少比例會隨砝碼改變"],
        ["same-amount", "短少比例也許變，但數量仍是 72"]
      ]);
    } else if (phase === "clay") {
      collision5Judgment(actions, "j3", "三種速度與坑深，最接近哪一種關係？", [
        ["speed-squared", "坑深跟著速度的平方走"],
        ["speed-linear", "坑深只跟著速度本身走"],
        ["height-independent", "坑深與速度沒有穩定關係"]
      ]);
      ship3Btn(actions, "用勾選紀錄提出斷言三", function () {
        collision5Do("assertJ3", { runIds: collision5SelectedIds("clay"), concept: state.lab.judgments && state.lab.judgments.j3 },
          "✓ J3 入卷：坑深與速度平方吻合；完整去向仍未對平。");
      }, "collision5Action");
    }
    var msg = ship3El("p", collision5Msg || "勾選會在重繪後保留；每次執行只新增一筆。", notebook, "collision5Message");
    msg.setAttribute("role", "status");
    if (N.embedReady(state)) {
      ship3Btn(notebook, "▶ 收好本輪紀錄，回到故事", function () {
        var r = N.embedComplete(state);
        if (r.error) { collision5Msg = "✕ " + r.error; renderAll(); return; }
        setState(r.state);
        collision5Msg = "";
        renderAll();
      }, "collision5Gate primary");
    }
  }

  /* ---------- 第六章：來源追債台 ---------- */
  var heat6Msg = "";
  var HEAT6_SOURCE = { chips: "金屬碎屑", cannon: "炮身存量", air: "外界空氣", water: "水中存量" };
  var HEAT6_BAND = { soon: "很快應變弱", "within-shift": "本班內應變弱", "no-endpoint": "目前無法標出終點" };

  function heat6El(tag, text, parent, cls) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text != null) el.textContent = displayText(text);
    if (parent) parent.appendChild(el);
    return el;
  }
  function heat6Select(parent, label, options, value) {
    var wrap = heat6El("label", label + " ", parent, "heat6Field");
    var select = document.createElement("select");
    var blank = document.createElement("option");
    blank.value = ""; blank.textContent = "— 請判斷 —";
    select.appendChild(blank);
    options.forEach(function (pair) {
      var option = document.createElement("option");
      option.value = pair[0]; option.textContent = pair[1];
      select.appendChild(option);
    });
    select.value = value || "";
    wrap.appendChild(select);
    return select;
  }
  function heat6Error(code) {
    var map = {
      "source-ledger-entry-incomplete": "來源位置與可見後果都要先選定。",
      "source-ledger-mismatch": "這張來源紙與實物位置或可見後果對不上；回到炮圖重新配對。",
      "four-sources-required": "四張來源紙都要先掛回實物，不能略過。",
      "two-model-predictions-required": "兩套模型都要留下可核對的預測。",
      "invalid-chip-setting": "質量、水量或溫度超出這組器材能安全比較的範圍。",
      "clean-chip-comparison-required": "目前只有混入差異的紙；把兩邊質量、初溫與水量對齊後再做。",
      "chip-judgment-mismatch": "這句超出眼前兩條曲線。回到相同質量與初溫的比較。",
      "three-friction-conditions-required": "三種條件還沒有全部留下原紙。",
      "friction-judgment-mismatch": "只看哪一條真的持續升溫：轉而不壓、壓而不轉，還是接觸且運動。",
      "friction-judgment-required": "先在故事裡判讀三張接觸條件紙，才能放行長紙帶。",
      "clean-dry-strip-required": "紙帶有漏拍或條件改變；先留下一張可逐拍核對的乾淨紙。",
      "dry-judgment-mismatch": "紙帶只支持量到的範圍，不能替未量到的時間作保。",
      "air-prediction-required": "先封存密合後會怎樣，才能開兩組對照。",
      "open-and-sealed-required": "開放與密合各需要一張乾淨紙。",
      "air-judgment-mismatch": "比較兩條曲線：密合後升溫是否按來源預測消失或變慢？",
      "unknown-temperature-target": "要先指定讀水溫或炮頭溫度。",
      "two-starting-temperatures-required": "水溫與炮頭溫度都要親手讀過，才能靜置對齊。",
      "water-box-not-ready": "水溫、炮頭溫度、密合、檢漏與取樣位置還沒有同時對齊。",
      "water-box-already-ready": "這張乾淨起點已封存，不能重複增加同一筆準備紀錄。",
      "four-prediction-bands-required": "四個有限來源都要先放進終點帶。",
      "source-prediction-band-mismatch": "這個來源版本不能用這張終點帶逃避可否證的後果。",
      "finite-predictions-required": "終點帶尚未封存，長時段機器保持鎖定。",
      "long-run-required": "長紙還沒走完，現在不足以判讀封條。",
      "source-verdict-mismatch": "把封存帶與曲線並排：這個有限來源預測的變弱是否真的出現？",
      "audit-placement-mismatch": "這張原紙查的不是這個來源；把來源問題與實際操作重新對回。",
      "audit-evidence-required": "先把五張原紙放回正確來源槽，再判斷反例能說到哪裡。",
      "latent-disposition-mismatch": "反例能讓有限來源版本退下，不能單獨證明運動說，也不能刪掉未查現象。",
      "audit-board-incomplete": "來源、條件紙與未決邊界還沒有全部對回。",
      "unknown-joint-column": "責任放錯欄；人物只能簽自己實際操作、讀取或主張的部分。",
      "joint-page-draft-incomplete": "四欄與『範圍未決』都要保留，暫稿才成立。"
    };
    return map[code] || ("這一步尚未成立（" + code + "）。");
  }
  function heat6Do(action, args, okText) {
    var r = N.labAction(state, action, args || {});
    if (r.error) { heat6Msg = "✕ " + heat6Error(r.error); renderAll(); return false; }
    setState(r.state);
    heat6Msg = "✓ " + (okText || "原紙已更新。舊紀錄仍留在卷內。");
    renderAll();
    return true;
  }
  function heat6Gate(parent, v) {
    var gate = heat6El("div", null, parent, "heat6Gate");
    if (!N.embedReady(state)) {
      heat6El("p", "本段還缺關鍵判讀。完成眼前的物件與原紙後才能回到故事。", gate, "hint");
      return;
    }
    ship3Btn(gate, "▶ 收好本段原紙，回到故事", function () {
      var r = N.embedComplete(state);
      if (r.error) { heat6Msg = "✕ " + r.error; renderAll(); return; }
      setState(r.state); heat6Msg = ""; renderAll();
    }, "heat6Primary");
  }
  function heat6Records(parent, kinds) {
    var rows = state.lab.records.filter(function (row) { return kinds.indexOf(row.kind) >= 0; });
    if (!rows.length) return;
    var table = document.createElement("table"), body = document.createElement("tbody");
    rows.forEach(function (row) {
      var detail = row.kind === "chip-comparison"
        ? ("碎屑 " + row.chipCurve.join(" → ") + "｜薄片 " + row.plateCurve.join(" → ") +
          (row.clean ? "｜條件對齊" : "｜條件未對齊"))
        : row.curve ? row.curve.map(function (n) { return n == null ? "—" : n; }).join(" → ")
        : (row.temperature != null ? (row.minutes + " 分｜" + row.temperature + "°") : (row.clean ? "乾淨" : "有差異"));
      var tr = document.createElement("tr");
      ["#" + row.id, row.kind, detail].forEach(function (text) { heat6El("td", String(text), tr); });
      body.appendChild(tr);
    });
    table.appendChild(body); parent.appendChild(table);
  }
  function heat6VisualId(phase, lab) {
    if (phase === "continuous-run-bench" && lab.continuousRun.complete)
      return "ch06_lab_water_box_boiling";
    return ASSETS && ASSETS.heat6Visual ? ASSETS.heat6Visual[phase] : null;
  }
  function heat6MountVisual(parent, phase, lab) {
    var visual = assetEntry(heat6VisualId(phase, lab));
    if (!visual) return;
    var copy = {
      "heat-source-ledger": ["四個實物來源區與四張空白來源紙", "圖面只標出要追查的實物；來源位置與後果由你寫入。"],
      "chip-capacity-bench": ["兩只相同水杯、黃銅碎屑、實心薄片與四支無數字溫度計", "器材提供等質量、等初溫的比較情境；曲線由原紙產生。"],
      "friction-condition-bench": ["旋轉炮身、固定鈍鑽與三種接觸條件的工作台", "正在工作的鑽具是鈍鑽；持續升溫要由三條條件紙比較。"],
      "dry-strip-bench": ["固定鈍鑽、無數字取樣鼓與等待記錄的空白紙帶", "圖面不預寫趨勢；十六拍讀數與斷點由工作台留下。"],
      "airtight-bench": ["同一鑽炮裝置的開放接縫與密合皮圈、活塞配置", "先封存密合預測，再讓兩組曲線回答空氣是否必要。"],
      "water-box-bench": ["短炮段、固定鈍鑽、木製水箱與三支無數字溫度計", "這是長時段實驗的乾淨起點；先檢漏、取樣並封存終點帶。"],
      "finite-source-prediction-bands": ["四個來源區與等待放入的空白預測帶", "終點帶要由玩家選定、封存；圖面不替任何來源押答案。"],
      "continuous-run-bench": ["木製水箱裡的旋轉短炮段與固定鈍鑽", "長紙逐格延伸；確切分鐘與溫度仍以原紙為準。"],
      "source-prediction-verdict": ["持續鑽削後已明顯沸騰的水箱，四張原預測仍留在桌上", "沸騰是可見結果；每張有限來源封條仍須逐一判讀。"],
      "model-audit-board": ["分成四區的稽核板、封存袋與未填答案的原紙", "把每張原紙放回它真正查過的來源問題。"],
      "joint-verification-page": ["共同驗證頁以三條分隔線形成四欄，四周放著獨立原紙", "四欄各負其責；共同頁不把未決機制冒充共同結論。"]
    }[phase] || [visual.label || "第六章實驗器材", "圖面承載器材；數值、曲線與判讀由工作台產生。"];
    if (phase === "continuous-run-bench" && lab.continuousRun.complete)
      copy = ["長時段鑽削後水箱已達沸騰，原紙與器材仍在原位", "可見結果已出現；下一步仍要把曲線與四張封存帶逐一並排。"];
    var figure = heat6El("figure", null, parent, "heat6Visual");
    var image = document.createElement("img");
    image.src = assetUrl(visual);
    image.alt = copy[0];
    image.loading = "lazy";
    figure.appendChild(image);
    heat6El("figcaption", copy[1], figure);
  }
  function renderHeat6(v, box) {
    var lab = state.lab, phase = v.phase;
    box.className = "heat6Lab";
    box.setAttribute("data-phase", phase || "");
    heat6El("h2", "四種來源追債台", box);
    heat6El("p", v.hint || "把預測、操作與讀數留在同一張可追查的紙上。", box, "heat6Goal");
    heat6MountVisual(box, phase, lab);
    if (heat6Msg) {
      var message = heat6El("p", heat6Msg, box, "labmsg heat6Message");
      message.setAttribute("role", "status");
    }

    if (phase === "heat-source-ledger") {
      var ledger = lab.sourceLedger;
      var sourceRules = window.GB.Engine6.SOURCE_RULES;
      var positions = Object.keys(sourceRules).map(function (key) {
        return [sourceRules[key].position, sourceRules[key].position];
      });
      var consequences = Object.keys(sourceRules).map(function (key) {
        return [sourceRules[key].consequence, sourceRules[key].consequence];
      });
      Object.keys(HEAT6_SOURCE).forEach(function (source) {
        var card = heat6El("section", null, box, "heat6Card");
        card.setAttribute("data-source", source);
        heat6El("h3", HEAT6_SOURCE[source], card);
        if (ledger.placements[source]) {
          heat6El("p", "位置：" + ledger.placements[source] + "｜若真是來源：" + ledger.consequences[source], card);
          return;
        }
        var position = heat6Select(card, "掛到", positions);
        var consequence = heat6Select(card, "若為來源，應看見", consequences);
        ship3Btn(card, "掛上來源紙", function () {
          if (!position.value || !consequence.value) { heat6Msg = "✕ 位置與可見後果都要寫清楚。"; renderAll(); return; }
          heat6Do("setSourceLedger", { source: source, position: position.value, consequence: consequence.value }, "這張來源紙已掛回實物。 ");
        });
      });
      if (!ledger.sealed && Object.keys(HEAT6_SOURCE).every(function (source) { return !!ledger.placements[source]; })) {
        var models = heat6El("section", null, box, "heat6Card");
        heat6El("h3", "封存兩套模型的預測", models);
        var caloric = heat6Select(models, "熱質說", [["finite-sources", "熱來自可耗盡的物質來源"], ["no-visible-cost", "不要求任何來源留下變化"]]);
        var motion = heat6Select(models, "運動說", [["continued-motion", "接觸運動持續，升溫可持續"], ["single-impact", "只在第一次接觸時升溫"]]);
        ship3Btn(models, "封蠟，不再改寫", function () {
          if (!caloric.value || !motion.value) { heat6Msg = "✕ 兩套模型都要先留下預測。"; renderAll(); return; }
          heat6Do("sealModels", { caloric: caloric.value, motion: motion.value }, "兩套模型已封存；文字仍可查，但不能抽換。 ");
        }, "heat6Primary");
      }
    } else if (phase === "chip-capacity-bench") {
      heat6El("p", "開場封條：" + lab.sourceLedger.consequences.chips, box, "heat6Bands");
      heat6El("p", "兩邊目前質量：碎屑 " + lab.chipBench.draft.chipMass + "、實心片 " + lab.chipBench.draft.plateMass + "；初溫與水量也必須相同。", box);
      ship3Btn(box, "故意少放一半碎屑", function () { heat6Do("setChipDraft", { field: "chipMass", value: 2 }, "差異已留在配置上；跑出的紙不能冒充乾淨對照。 "); });
      ship3Btn(box, "恢復等質量", function () { heat6Do("setChipDraft", { field: "chipMass", value: 4 }, "兩邊質量已對齊。 "); });
      ship3Btn(box, "浸入兩杯水，記曲線", function () { heat6Do("runChipComparison", {}, "兩條回溫曲線已留紙。 "); }, "heat6Primary");
      heat6Records(box, ["chip-comparison"]);
      if (lab.chipBench.cleanRecordIds.length) {
        heat6El("p", "乾淨原紙已取得。收好原紙，回到故事中判斷它最多能支持哪一句。", box, "ready");
      }
    } else if (phase === "friction-condition-bench") {
      [["rotation-only", "只轉動，不壓緊"], ["pressure-only", "只壓緊，不轉動"], ["contact-motion", "壓緊並持續轉動"]].forEach(function (item) {
        ship3Btn(box, lab.frictionBench.sealed[item[0]] ? ("✓ " + item[1]) : item[1], function () {
          heat6Do("runFrictionCondition", { condition: item[0] }, "這一種條件已留下獨立曲線。 ");
        }, "", !!lab.frictionBench.sealed[item[0]]);
      });
      heat6Records(box, ["friction-condition"]);
      if (["rotation-only", "pressure-only", "contact-motion"].every(function (id) { return lab.frictionBench.sealed[id]; })) {
        heat6El("p", "三種條件紙已齊。回到故事，讓人物針對同一批紙提出唯一一次判讀。", box, "ready");
      }
    } else if (phase === "dry-strip-bench") {
      var dry = lab.dryBench.draft;
      heat6El("p", "馬速：" + dry.horsePace + "｜壓力：" + dry.pressure + "｜取樣：" + dry.sampling, box);
      ship3Btn(box, "中途改變壓力", function () { heat6Do("setDryDraft", { field: "pressure", value: "changed" }, "壓力變動已標在配置上。 "); });
      ship3Btn(box, "固定壓力", function () { heat6Do("setDryDraft", { field: "pressure", value: "fixed" }, "壓力已固定。 "); });
      ship3Btn(box, "讓紙帶走十六拍", function () { heat6Do("runDryStrip", {}, "乾式紙帶已留下；斷點不會被剪掉。 "); }, "heat6Primary");
      heat6Records(box, ["dry-strip"]);
      if (lab.dryBench.cleanRecordId) {
        heat6El("p", "乾式紙帶已完整留下。回到故事，決定史坦格最多能替哪一句署名。", box, "ready");
      }
    } else if (phase === "airtight-bench") {
      if (!lab.airBench.sealed) {
        heat6El("p", "故事中的密合預測尚未封存；請先回到上一句完成預測。", box, "hint");
      } else {
        heat6El("p", "封存預測仍在：" + (lab.airBench.prediction === "slower-when-sealed" ? "密合後應變慢" : "密合後應變快"), box, "heat6Bands");
        var airConditions = lab.records.filter(function (row) { return row.kind === "air-comparison" && row.clean; }).map(function (row) { return row.condition; });
        [["open", "開放進氣"], ["sealed", "扣緊皮圈密合"]].forEach(function (item) {
          ship3Btn(box, airConditions.indexOf(item[0]) >= 0 ? ("✓ " + item[1]) : item[1], function () {
            heat6Do("runAirComparison", { condition: item[0], clean: true }, "這一組密合狀態已留下曲線。 ");
          }, "", airConditions.indexOf(item[0]) >= 0);
        });
        heat6Records(box, ["air-comparison"]);
        if (airConditions.indexOf("open") >= 0 && airConditions.indexOf("sealed") >= 0) {
          heat6El("p", "兩張對照紙已齊。回到故事，再決定原封條應命中、撤回或保留未決。", box, "ready");
        }
      }
    } else if (phase === "water-box-bench") {
      var water = lab.waterBench.draft;
      heat6El("p", "開場封條：" + lab.sourceLedger.consequences.water + "｜" + lab.sourceLedger.consequences.cannon, box, "heat6Bands");
      heat6El("p", "水溫 " + water.water + "°" + (water.waterRead ? " ✓已讀" : "") + "｜炮頭 " + water.cannon + "°" + (water.cannonRead ? " ✓已讀" : "") + "｜初溫對齊 " + (water.equilibrated ? "✓" : "○") + "｜密合 " + (water.sealed ? "✓" : "○") + "｜檢漏 " + (water.leakChecked ? "✓" : "○") + "｜三點取樣 " + (water.sampling ? "✓" : "○"), box);
      ship3Btn(box, water.waterRead ? "✓ 已讀水溫" : "讀取水溫", function () { heat6Do("readWaterTemperature", { target: "water" }, "水溫已記在起點紙。 "); }, "", water.waterRead);
      ship3Btn(box, water.cannonRead ? "✓ 已讀炮頭溫度" : "讀取炮頭溫度", function () { heat6Do("readWaterTemperature", { target: "cannon" }, "炮頭溫度已記在起點紙。 "); }, "", water.cannonRead);
      ship3Btn(box, water.equilibrated ? "✓ 初溫已對齊" : "靜置到兩者接近", function () { heat6Do("equilibrateWaterBox", {}, "水與炮頭已靜置到同一小格內。 "); }, "", water.equilibrated);
      ship3Btn(box, "扣緊水箱皮圈", function () { heat6Do("setWaterDraft", { field: "sealed", value: true }, "水箱已密合。 "); }, "", water.sealed);
      ship3Btn(box, "靜置檢漏", function () { heat6Do("setWaterDraft", { field: "leakChecked", value: true }, "水位刻線沒有下降。 "); }, "", water.leakChecked);
      ship3Btn(box, "放好三支溫度計", function () { heat6Do("setWaterDraft", { field: "sampling", value: true }, "摩擦處、箱壁與水面都已能讀數。 "); }, "", water.sampling);
      ship3Btn(box, lab.waterBench.ready ? "✓ 起點已封存" : "封存乾淨起點", function () { heat6Do("prepareWaterBox", {}, "水箱起點已封存；可以開始押終點帶。 "); }, "heat6Primary", lab.waterBench.ready);
    } else if (phase === "finite-source-prediction-bands") {
      var finite = lab.finiteSources;
      Object.keys(HEAT6_SOURCE).forEach(function (source) {
        var card = heat6El("section", null, box, "heat6Card " + finite.sealState[source]);
        card.setAttribute("data-source", source);
        heat6El("h3", HEAT6_SOURCE[source], card);
        heat6El("p", "原先寫下的後果：" + lab.sourceLedger.consequences[source], card);
        var choices = window.GB.Engine6.SOURCE_RULES[source].bands.map(function (bandId) {
          return [bandId, HEAT6_BAND[bandId]];
        });
        var band = heat6Select(card, "終點帶", choices, finite.bands[source]);
        band.disabled = finite.sealed;
        ship3Btn(card, finite.bands[source] ? "改放這張帶" : "放入預測帶", function () {
          if (!band.value) { heat6Msg = "✕ 每張來源紙都要選一個時段。"; renderAll(); return; }
          heat6Do("setFinitePrediction", { source: source, band: band.value }, "預測帶已放好，封蠟前仍可調整。 ");
        }, "", finite.sealed);
      });
      ship3Btn(box, "封住四張終點帶", function () { heat6Do("sealFinitePredictions", {}, "四張預測帶已封蠟；長時段機器解鎖。 "); }, "heat6Primary", finite.sealed);
    } else if (phase === "continuous-run-bench") {
      heat6El("p", "長紙 " + lab.continuousRun.segments.length + "／6 格｜馬速穩定｜壓力固定｜水位刻線可見", box);
      heat6El("p", "封存終點帶：" + Object.keys(HEAT6_SOURCE).map(function (source) {
        return HEAT6_SOURCE[source] + "＝" + HEAT6_BAND[lab.finiteSources.bands[source]];
      }).join("｜"), box, "heat6Bands");
      heat6Records(box, ["continuous-segment"]);
      if (!lab.continuousRun.complete) {
        ship3Btn(box, "記下一個半小時", function () { heat6Do("runContinuousSegment", { action: "record-next" }, "馬速、壓力、水位與溫度一起多出一格。 "); }, "heat6Primary");
      } else heat6El("p", "水已達沸點；四張封存帶仍壓在曲線下方，等待你逐一判讀。", box, "ready");
    } else if (phase === "source-prediction-verdict") {
      var curve6 = lab.records.filter(function (row) { return row.kind === "continuous-segment"; })
        .map(function (row) { return row.minutes + "分 " + row.temperature + "°"; });
      heat6El("p", "長時段曲線：" + curve6.join(" → "), box, "heat6Curve");
      Object.keys(HEAT6_SOURCE).forEach(function (source) {
        var seal = lab.finiteSources.sealState[source], verdict = lab.finiteSources.verdicts[source];
        var card = heat6El("section", null, box, "heat6Card heat6Seal " + seal);
        card.setAttribute("data-source", source);
        heat6El("h3", HEAT6_SOURCE[source] + "｜" + HEAT6_BAND[lab.finiteSources.bands[source]], card);
        heat6El("p", verdict === "insufficient" ? "本輪不足以走到這張紙自行設定的終點；封蠟保持完整。" :
          (seal === "cracked" ? "封蠟已裂；原預測仍留在原位。" : "封蠟完整，尚未提交判讀。"), card);
        if (!verdict) {
          [["not-fulfilled", "預測未兌現"], ["insufficient", "本輪尚未走到終點"], ["fulfilled", "預測已命中"]].forEach(function (item) {
            ship3Btn(card, item[1], function () { heat6Do("judgeFiniteSource", { source: source, verdict: item[0] }, "這張封條的判讀已落紙；封條只裂，不消失。 "); });
          });
        }
      });
    } else if (phase === "model-audit-board") {
      var audit = lab.auditBoard;
      var evidencePapers = [
        ["T1", "等重金屬在等量水中的回溫紙"],
        ["T2", "三種接觸與轉動條件紙"],
        ["T3", "開放與密合兩組升溫紙"],
        ["T4", "長時段水箱曲線與封存帶"]
      ];
      [["chips", "碎屑容量版本"], ["air", "空氣必要來源版本"], ["cannon", "炮身有限存量版本"], ["water", "水中有限存量版本"], ["condition", "持續升溫的操作條件"]].forEach(function (item) {
        var auditCard = heat6El("section", null, box, "heat6Card heat6AuditSlot");
        var paper = heat6Select(auditCard, item[1], evidencePapers, audit.placements[item[0]]);
        ship3Btn(auditCard, audit.placements[item[0]] ? "✓ 已放入" : "放入這個來源槽", function () {
          if (!paper.value) { heat6Msg = "✕ 先選一張原紙。"; renderAll(); return; }
          heat6Do("placeAuditEvidence", { slot: item[0], evidence: paper.value }, "原紙已放回它實際查過的問題旁。 ");
        }, "", !!audit.placements[item[0]]);
      });
      heat6El("h3", "這些反例對運動說能說到哪裡？", box);
      ship3Btn(box, "有限來源版本退下；運動說仍未證明", function () { heat6Do("setLatentDisposition", { disposition: "motion-unresolved" }, "未決邊界已留在板上。 "); }, "", !!audit.latentDisposition);
      ship3Btn(box, "反例已經證明熱就是運動", function () { heat6Do("setLatentDisposition", { disposition: "proves-motion" }); });
      ship3Btn(box, "這批反例什麼都不能排除", function () { heat6Do("setLatentDisposition", { disposition: "evidence-useless" }); });
      ship3Btn(box, "封存模型稽核板", function () { heat6Do("completeAudit", {}, "來源、原紙與未決邊界已完成對帳。 "); }, "heat6Primary", audit.complete);
    } else if (phase === "joint-verification-page") {
      var joint = lab.jointPage, values = window.GB.Engine6.JOINT_VALUES;
      var responsibilities = [
        ["operation", "操作責任", [[values.operation, "史坦格：裝置與操作"], [values.readings, "凱斯勒：量熱讀數"]]],
        ["readings", "讀數責任", [[values.readings, "凱斯勒：量熱讀數與來源反例"], [values.motion, "朗福德：運動說解讀"]]],
        ["caloric", "熱質說欄", [[values.caloric, "凱斯勒：撤回範圍與保留現象"], [values.operation, "史坦格：裝置與操作"]]],
        ["motion", "運動說欄", [[values.motion, "朗福德：個人解讀，自負其責"], [values.caloric, "凱斯勒：撤回範圍"]]]
      ];
      responsibilities.forEach(function (row) {
        var responsibilityCard = heat6El("section", null, box, "heat6Card heat6Responsibility");
        responsibilityCard.setAttribute("data-column", row[0]);
        var field = heat6Select(responsibilityCard, row[1], row[2], joint.columns[row[0]]);
        ship3Btn(responsibilityCard, joint.columns[row[0]] ? "✓ 已放入" : "放入這一欄", function () {
          if (!field.value) { heat6Msg = "✕ 先選擇由誰為這一欄負責。"; renderAll(); return; }
          heat6Do("setJointColumn", { column: row[0], text: field.value }, "責任欄已落紙；還沒有任何人簽共同結論。 ");
        }, "", !!joint.columns[row[0]]);
      });
      heat6El("p", "範圍未決：" + (joint.scopeDebt === "scope-unresolved" ? "✓ 已保留" : "尚未由故事中的邊界選擇寫入"), box);
    }
    heat6Gate(box, v);
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
    if (v.type === "embed" && v.system === "collision") {
      renderCollision5(v, box);
      return;
    }
    if (v.type === "embed" && v.system === "heat") {
      renderHeat6(v, box);
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
      mkBtn(box, CHAPTER_ID === "ch6" ? "封存第六章" : (CHAPTER_ID === "ch5" ? "封存第五章" : (CHAPTER_ID === "ch4" ? "封存第四章" : (CHAPTER_ID === "ch3" ? "封存第三章" : (CHAPTER_ID === "ch2" ? "封存第二章" : "封存第一章")))), function () {
        /* 舊章存檔維持 q1/q2 schema；三題以上時將第二題起以題目標籤合併入 q2。 */
        var q2 = tas.slice(1).map(function (ta, index) {
          return displayText(v.prompts[index + 1]) + "\n" + ta.value;
        }).join("\n\n");
        var r = N.setReview(state, tas[0].value, q2);
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
    if (CHAPTER_ID === "ch3" && window.GB.Engine3 && window.GB.Engine3.migrateLabState) {
      fromState = JSON.parse(JSON.stringify(fromState));
      fromState.lab = window.GB.Engine3.migrateLabState(fromState.lab);
    }
    state = fromState;
    $("title-screen").style.display = "none";
    $("game-screen").style.display = "";
    initLabSelects();
    bindLabButtons();
    rebuildLog();
    lastEmbedKey = null;
    orbit4CoachSpokenKey = "";
    orbit4PendingCoach = null;
    var rd = N.redirectIfLocked(state);
    if (rd.redirected) { state = rd.state; save(); }
    else if (CHAPTER_ID === "ch3") save();
    emit("bd:start", { mode: state.mode });
    renderAll();
  }

  function chapterLabel() {
    return chapterMeta(CHAPTER_ID).label;
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
  function setChapterStep(button, chapter, emptyLabel) {
    if (!button) return;
    var label = button.querySelector("span");
    var title = button.querySelector("b");
    if (!chapter) {
      button.disabled = true;
      if (title) title.textContent = emptyLabel;
      return;
    }
    button.disabled = false;
    if (label) label.textContent = button.classList.contains("prev") ? "上一章" : "下一章";
    if (title) title.textContent = chapter.label + "・" + chapter.title;
    button.onclick = function () { routeToChapter(chapter.route); };
  }
  function renderChapterDirectory(progress, current) {
    var rail = $("chapterRail");
    if (!rail) return;
    rail.textContent = "";
    SERIES_CHAPTERS.forEach(function (chapter) {
      var complete = !!progress.chapters[chapter.id];
      var button = document.createElement("button");
      button.type = "button";
      button.className = "chapterPick" +
        (chapter.id === current.id ? " isActive" : "") +
        (complete ? " isComplete" : "");
      button.setAttribute("data-chapter", chapter.route);
      if (chapter.id === current.id) button.setAttribute("aria-current", "page");

      var number = document.createElement("span");
      number.className = "chNo";
      number.textContent = chapter.number;
      var title = document.createElement("b");
      title.textContent = chapter.title;
      var question = document.createElement("small");
      question.className = "chQuestion";
      question.textContent = chapter.years + "・" + chapter.question;
      var status = document.createElement("small");
      status.className = "chState";
      status.textContent = complete ? "✓ 已完成" : (chapter.id === current.id ? "目前" : "可玩");

      button.appendChild(number);
      button.appendChild(title);
      button.appendChild(question);
      button.appendChild(status);
      button.onclick = function () {
        if (chapter.id === current.id) {
          var directory = $("chapterDirectory");
          if (directory) directory.open = false;
          return;
        }
        routeToChapter(chapter.route);
      };
      rail.appendChild(button);
    });
  }
  function configureSeriesTitle() {
    var current = chapterMeta(CHAPTER_ID);
    document.title = "《發現之前》" + current.label + "：" + current.title + "｜互動物理史遊戲";
    var progress = readSeriesProgress();
    var completedCount = SERIES_CHAPTERS.filter(function (chapter) {
      return progress.chapters[chapter.id];
    }).length;
    var status = document.querySelector(".chapterStatusText span");
    if (status) status.textContent = completedCount ? "已完成 " + completedCount + " 章" : "旅程尚未留下章印";
    var meta = document.querySelector(".chapterStatusText strong");
    if (meta) meta.textContent = current.label + "・" + current.title;
    var directoryMeta = $("chapterDirectoryMeta");
    if (directoryMeta) directoryMeta.textContent = SERIES_CHAPTERS.length + " 章可玩";
    var currentIndex = SERIES_CHAPTERS.findIndex(function (chapter) { return chapter.id === current.id; });
    setChapterStep($("btnPrevChapter"), currentIndex > 0 ? SERIES_CHAPTERS[currentIndex - 1] : null, "這是旅程起點");
    setChapterStep($("btnNextChapter"),
      currentIndex >= 0 && currentIndex < SERIES_CHAPTERS.length - 1 ? SERIES_CHAPTERS[currentIndex + 1] : null,
      "下一章尚未公開");
    renderChapterDirectory(progress, current);
    var legend = document.querySelector("#titleCard fieldset legend");
    if (legend) legend.textContent = "從" + chapterLabel() + "開始・選擇模式（中途不可換）";
    $("btnNew").textContent = "開始" + chapterLabel();
    $("btnContinue").textContent = "繼續" + chapterLabel();
  }
  function importCurrentChapter(rawText) {
    var checked = inspectSaveText(rawText);
    if (!checked.state)
      return { error: "sanitize", reason: checked.error || "存檔內容無法辨識" };
    /* 匯入按鈕本身保留最後一道淨化閘；inspectSaveText 的遷移前置不能
       取代這個既有契約，否則未來重構 inspect 時會靜默繞過 A1。 */
    var r = checked;
    var chk = sanitizeLoaded(r.state);
    if (!chk.ok) return { error: "sanitize", reason: chk.reason };
    if (!checked.migrationReport) return { state: chk.state };
    return {
      state: chk.state,
      migrated: !!checked.migrated,
      migrationReport: checked.migrationReport || null
    };
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
        ? "已自動儲存｜已完成・共 " + loaded.lab.days + " 天"
        : "已自動儲存｜" + (loaded.mode === "scholar" ? "學者模式" : "探索模式") +
          "・第 " + loaded.lab.days + " 天";
      var titleStatus = document.querySelector(".chapterStatusText span");
      if (titleStatus && !loaded.ended)
        titleStatus.textContent = "旅程進度・" + chapterLabel() + "有未完成進度";
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
        var chapterFileLabel = chapterLabel();
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
      var imported = importCurrentChapter(candidate);
      if (!imported.error) {
        preserveCh4MigrationBackup(imported.migrationReport);
        if (imported.migrationReport && imported.migrationReport.notice)
          showNewWarn(imported.migrationReport.notice);
        startGame(imported.state); save(); return;
      }

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
