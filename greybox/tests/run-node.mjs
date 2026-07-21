/* tests/run-node.mjs — `npm test` 進入點(零外部依賴)
   執行:共用套件全部測試 + R-DATA-05 鏡像一致性(需檔案系統,node 限定) */
import { createRequire } from "module";
import { readFileSync, existsSync, readdirSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));

const patterns = require("../data/patterns.js");
const debate = require("../data/debate.js");
const scenes = require("../data/scenes.js");
const Engine = require("../src/engine.js");
const Narrative = require("../src/narrative.js");
const TextFormat = require("../src/text-format.js");
const buildSuite = require("./suite.js");
const buildNarrativeSuite = require("./narrative-suite.js");

const tests = buildSuite(Engine, patterns, debate).concat(buildNarrativeSuite(Narrative, scenes));

tests.push({
  name: "中文顯示標點|中文語境全形化，數字比例／拉丁文／代碼保持原樣",
  fn: () => {
    const sample = "(把玩兩顆鉛球)亞里斯多德說:十倍重,十倍快!";
    const shown = TextFormat.normalizeZhPunctuation(sample);
    if (shown !== "（把玩兩顆鉛球）亞里斯多德說：十倍重，十倍快！")
      throw new Error("中文標點正規化失敗:" + shown);
    const technical = "等時距 1:3:5:7；E3.a；(De Motu)";
    if (TextFormat.normalizeZhPunctuation(technical) !== technical)
      throw new Error("技術字串遭誤改");
  }
});

/* R-DATA-05|鏡像一致性:.js 執行載體 與 .json 規範鏡像 深度相等 */
tests.push({
  name: "R-DATA-05|patterns.js ≡ patterns.json",
  fn: () => {
    const json = JSON.parse(readFileSync(path.join(here, "../data/patterns.json"), "utf-8"));
    if (JSON.stringify(patterns) !== JSON.stringify(json)) throw new Error("patterns 鏡像漂移");
  }
});
tests.push({
  name: "R-DATA-05|debate.js ≡ debate.json",
  fn: () => {
    const json = JSON.parse(readFileSync(path.join(here, "../data/debate.json"), "utf-8"));
    if (JSON.stringify(debate) !== JSON.stringify(json)) throw new Error("debate 鏡像漂移");
  }
});
tests.push({
  name: "R-END-02|histfacts.js ≡ histfacts.json;每列 label ∈ 宣告 enum",
  fn: () => {
    const hf = require("../data/histfacts.js");
    const json = JSON.parse(readFileSync(path.join(here, "../data/histfacts.json"), "utf-8"));
    if (JSON.stringify(hf) !== JSON.stringify(json)) throw new Error("histfacts 鏡像漂移");
    if (!Array.isArray(hf.labels) || !hf.labels.length) throw new Error("histfacts 缺 labels enum");
    hf.rows.forEach((r) => {
      if (!r.item || !r.label) throw new Error("histfacts 列缺 item/label");
      if (hf.labels.indexOf(r.label) < 0) throw new Error("label 不在 enum:" + r.label);
    });
  }
});
tests.push({
  name: "R-DATA-06|scenes.js ≡ scenes.json",
  fn: () => {
    const json = JSON.parse(readFileSync(path.join(here, "../data/scenes.json"), "utf-8"));
    if (JSON.stringify(scenes) !== JSON.stringify(json)) throw new Error("scenes 鏡像漂移");
  }
});
tests.push({
  name: "§5.9|assets.js ≡ assets.json;schema+場景映射完備性",
  fn: () => {
    const assets = require("../data/assets.js");
    const json = JSON.parse(readFileSync(path.join(here, "../data/assets.json"), "utf-8"));
    if (JSON.stringify(assets) !== JSON.stringify(json)) throw new Error("assets 鏡像漂移");
    const KINDS = ["bg", "portrait", "card", "prop", "cg", "fx"];
    const ids = new Set();
    assets.entries.forEach((e) => {
      if (ids.has(e.id)) throw new Error("資產 id 重複:" + e.id);
      ids.add(e.id);
      if (KINDS.indexOf(e.kind) < 0) throw new Error("kind 非法:" + e.id);
      if (!("path" in e) || !("firstScreen" in e)) throw new Error("缺 path/firstScreen:" + e.id);
      (e.layers || []).forEach((L) => {
        if (typeof L.anchorX !== "number" || typeof L.anchorY !== "number" || typeof L.w !== "number")
          throw new Error("layers 錨點欄位非數值:" + e.id);
      });
    });
    Object.values(assets.sceneBg).forEach((id) => {
      if (!ids.has(id)) throw new Error("sceneBg 指向不存在資產:" + id);
    });
    Object.values(assets.speakerPortrait).forEach((id) => {
      if (!ids.has(id)) throw new Error("speakerPortrait 指向不存在資產:" + id);
    });
    /* 完備性:scenes.js 每個場景都要有背景槽位(path 可 null,槽位不可缺) */
    scenes.scenes.forEach((s) => {
      if (!(s.id in assets.sceneBg)) throw new Error("場景缺背景槽位:" + s.id);
    });
    /* 已填 path 的資產,檔案必須實際存在(防 manifest 先行於檔案) */
    assets.entries.forEach((e) => {
      if (e.path) {
        const p = path.join(here, "..", assets.basePath, e.path);
        try { readFileSync(p); } catch (err) { throw new Error("path 已填但檔案不存在:" + e.id + " → " + e.path); }
      }
    });
  }
});
tests.push({
  name: "§5.7|tokens 生成器:驗證通過+落後檢測(committed css ≡ 再生結果)",
  fn: async () => {
    const { validateTokens, generateCss } = await import("../tools/gen_tokens.mjs");
    const srcReal = path.join(here, "../../art/style/tokens.json");
    const srcEx = path.join(here, "../data/tokens.example.json");
    let srcPath = srcEx;
    try { readFileSync(srcReal); srcPath = srcReal; } catch (e) {}
    const text = readFileSync(srcPath, "utf-8");
    const data = JSON.parse(text);
    data._source = path.basename(srcPath) + (srcPath === srcEx ? "(example)" : "");
    validateTokens(data);
    const css = generateCss(data, text);
    const committed = readFileSync(path.join(here, "../../public/assets/global/tokens.css"), "utf-8");
    if (committed !== css) throw new Error("tokens.css 落後於來源——請重跑 tools/gen_tokens.mjs");
    /* 負向:缺必要 token 必敗 */
    const bad = JSON.parse(text);
    delete bad.tokens["color-focus"];
    let threw = false;
    try { validateTokens(bad); } catch (e) { threw = true; }
    if (!threw) throw new Error("缺必要 token 未被攔截");
  }
});

tests.push({
  name: "舞台殼|stage.html DOM 契約:chapter-ui 引用之 id 全數存在;stage-ui 純表現層",
  fn: () => {
    const ui = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
    const ids = [...new Set([...ui.matchAll(/\$\("([A-Za-z-]+)"\)/g)].map((m) => m[1]))];
    if (ids.length < 25) throw new Error("id 萃取異常(僅 " + ids.length + " 個)——正規式或檔案結構變動");
    for (const page of ["stage.html", "chapter.html"]) {
      const html = readFileSync(path.join(here, "..", page), "utf-8");
      const missing = ids.filter((id) => !html.includes('id="' + id + '"'));
      if (missing.length) throw new Error(page + " 缺 id:" + missing.join("、"));
      if (!html.includes('name="mode"')) throw new Error(page + " 缺模式選擇 radio(name=mode)");
    }
    const stageHtml = readFileSync(path.join(here, "../stage.html"), "utf-8");
    if (!(stageHtml.indexOf("src/chapter-ui.js") < stageHtml.indexOf("src/stage-ui.js")))
      throw new Error("stage.html 載入順序錯誤:chapter-ui.js 必須先於 stage-ui.js");
    /* stage-ui = 純表現層:禁碰引擎與存檔(事件單向訂閱) */
    const sui = readFileSync(path.join(here, "../src/stage-ui.js"), "utf-8");
    if (/GB\.Narrative|GB\.Engine|localStorage/.test(sui))
      throw new Error("stage-ui.js 越權:出現引擎或存檔存取——表現層只准訂閱 bd:* 事件");
    /* chapter-ui 掛點存在(stage 依賴的事件名) */
    for (const evName of ["bd:line", "bd:scene", "bd:view", "bd:start"]) {
      if (!ui.includes('"' + evName + '"')) throw new Error("chapter-ui.js 缺事件掛點:" + evName);
      if (!sui.includes('"' + evName + '"')) throw new Error("stage-ui.js 未訂閱:" + evName);
    }
  }
});

tests.push({
  name: "舞台殼 v2|視覺修正契約:筆記本模式/半身像 fallback/idle 推進/場景範圍預載",
  fn: () => {
    const stageHtml = readFileSync(path.join(here, "../stage.html"), "utf-8");
    const sui = readFileSync(path.join(here, "../src/stage-ui.js"), "utf-8");
    /* 一、筆記本模式:modal 語義+分頁+44px 觸控+焦點歸還 */
    for (const frag of ['id="notebook"', 'role="dialog"', 'aria-modal="true"',
      'id="nbTabEvidence"', 'id="nbTabLog"', 'id="nbLabSnap"',
      'id="labIntro"', 'id="btnLabHelp"', ">第1段<", "紀錄不可刪",
      'id="prologueCard"', "推進物理史",
      'id="debIntro"', 'id="repToast"', 'id="hudTip"']) {
      if (!stageHtml.includes(frag)) throw new Error("stage.html 缺筆記本/實驗台要素:" + frag);
    }
    if (!stageHtml.includes("min-height: 44px")) throw new Error("觸控區 44px 規則缺失");
    if (!/btnDrawer"\)\.focus\(\)/.test(sui)) throw new Error("筆記關閉後焦點未歸還 btnDrawer");
    if (!sui.includes("focusin")) throw new Error("modal 焦點圍欄缺失");
    /* 二、半身像:左右雙槽+遮罩 fallback+禁鏡像 */
    if (!stageHtml.includes('id="bustLeft"') || !stageHtml.includes('id="bustRight"') || !stageHtml.includes("mask-image"))
      throw new Error("雙肖像槽或柔邊遮罩 fallback 缺失");
    if (!sui.includes("speakerDialoguePortrait")) throw new Error("speakerDialoguePortrait 接口鏈缺失");
    if (/scaleX\(\s*-1\s*\)/.test(sui) || /scaleX\(\s*-1\s*\)/.test(stageHtml))
      throw new Error("偵測到 CSS 水平鏡像——角色特徵不可翻面");
    /* 三、字級:對話 clamp 下限 ≥24px(桌機),分頁函式存在(不出捲軸) */
    if (!/#dlgText\s*\{[^}]*clamp\(2[4-9]px/.test(stageHtml)) throw new Error("對話字級 clamp 下限低於 24px");
    if (!sui.includes("function paginate")) throw new Error("對話分頁缺失(長台詞會溢出或出捲軸)");
    if (/#dlgText\s*\{[^}]*overflow-y/.test(stageHtml)) throw new Error("對話框出現捲軸樣式——應以分頁處理");
    /* 四、idle 推進+標點停頓+場景範圍預載(禁全 manifest) */
    if (!sui.includes("function idleAdvance")) throw new Error("句完 Enter/Space 觸發繼續(idleAdvance)缺失");
    if (!sui.includes("charDelay")) throw new Error("標點停頓(charDelay)缺失");
    if (!sui.includes("function preloadScene")) throw new Error("場景範圍預載缺失");
    if (/function preloadAll/.test(sui)) throw new Error("禁止全 manifest 預載(preloadAll)——首屏 3MB 預算");
  }
});

tests.push({
  name: "整合包|scene-aware 肖像:映射完備+年代守衛(1590≠39/72,1603+≠26/58)+旅人無肖像",
  fn: () => {
    const assets = JSON.parse(readFileSync(path.join(here, "../data/assets.json"), "utf-8"));
    const ids = new Set(assets.entries.map((e) => e.id));
    const sceneIds = new Set(scenes.scenes.map((s) => s.id));
    const sdp = assets.sceneDialoguePortrait || {};
    const EARLY = /^(P0-|A1-)/;                 /* 1590:26 歲伽利略/58 歲辛普里奧 */
    for (const [sc, m] of Object.entries(sdp)) {
      if (!sceneIds.has(sc)) throw new Error("sceneDialoguePortrait 指向不存在場景:" + sc);
      for (const [sp, aid] of Object.entries(m)) {
        if (!ids.has(aid)) throw new Error("肖像映射指向不存在資產:" + sc + "/" + sp + "→" + aid);
        if (sp === "旅人" || sp === "旅人(你)") throw new Error("旅人不得入對話肖像映射(驗收6):" + sc);
        if (EARLY.test(sc) && /39|72/.test(aid)) throw new Error("年代錯置:1590 場景用了老年肖像:" + sc + "→" + aid);
        if (!EARLY.test(sc) && /26|58/.test(aid)) throw new Error("年代錯置:1603+ 場景用了青年肖像:" + sc + "→" + aid);
      }
    }
    /* 每個場景都要有 scene-aware 覆寫列(伽利略/辛普里奧年代安全的前提) */
    scenes.scenes.forEach((s) => {
      if (!(s.id in sdp)) throw new Error("場景缺對話肖像覆寫列:" + s.id);
    });
    const spd = assets.speakerDialoguePortrait || {};
    for (const [sp, aid] of Object.entries(spd)) {
      if (!ids.has(aid)) throw new Error("speakerDialoguePortrait 指向不存在資產:" + sp);
      if (sp === "伽利略" || sp === "辛普里奧") throw new Error("跨年代角色禁設對話預設(年代安全):" + sp);
      if (sp === "旅人" || sp === "旅人(你)") throw new Error("旅人不得設對話預設(驗收6)");
    }
    /* 解析順序:台詞覆寫→場景覆寫→對話預設→筆記頭像 */
    const sui = readFileSync(path.join(here, "../src/stage-ui.js"), "utf-8");
    const a0 = sui.indexOf("lineOverride(speaker, text)");
    const a = sui.indexOf("sceneDialoguePortrait[curSceneId]");
    const b = sui.indexOf("speakerDialoguePortrait[speaker]");
    const c = sui.indexOf("speakerPortrait[speaker]");
    if (!(a0 >= 0 && a > a0 && b > a && c > b)) throw new Error("肖像四層解析順序錯誤(應:台詞→場景→預設→筆記頭像)");
    /* 台詞級覆寫:目標存在+match 真的出現在該場景/辯論文本+年代守衛 */
    const ldp = assets.lineDialoguePortrait || [];
    const scenesText = readFileSync(path.join(here, "../data/scenes.json"), "utf-8");
    const debateText = readFileSync(path.join(here, "../data/debate.json"), "utf-8");
    for (const r of ldp) {
      if (!ids.has(r.asset)) throw new Error("台詞覆寫指向不存在資產:" + r.asset);
      if (!sceneIds.has(r.scene)) throw new Error("台詞覆寫指向不存在場景:" + r.scene);
      if (!r.match || (!scenesText.includes(r.match) && !debateText.includes(r.match)))
        throw new Error("台詞覆寫 match 字串不存在於任何文本:" + r.match);
      if (EARLY.test(r.scene) && /39|72/.test(r.asset)) throw new Error("台詞覆寫年代錯置:" + r.scene);
      if (!EARLY.test(r.scene) && /26|58/.test(r.asset)) throw new Error("台詞覆寫年代錯置:" + r.scene);
      if (r.speaker === "旅人" || r.speaker === "旅人(你)") throw new Error("旅人不得入台詞覆寫");
    }
  }
});

tests.push({
  name: "雙槽+資料密度|站位資料驅動/剪影按側/20 筆保留/分組不動守衛(Sol 審核 20260720)",
  fn: () => {
    const assets = JSON.parse(readFileSync(path.join(here, "../data/assets.json"), "utf-8"));
    const ids = new Set(assets.entries.map((e) => e.id));
    /* 站位=資料來源,值域受控;依原圖朝向:伽利略朝左→站右、辛普里奧朝右→站左 */
    const side = assets.speakerSide || {};
    for (const [sp, v] of Object.entries(side))
      if (v !== "left" && v !== "right") throw new Error("speakerSide 值非法:" + sp + "→" + v);
    if (side["伽利略"] !== "right" || side["辛普里奧"] !== "left")
      throw new Error("站位違反原圖朝向資料(伽利略=right/辛普里奧=left)");
    /* 旅人剪影:兩側各自資產(重新構圖,非鏡像),預設開啟、?travelerBust=0 撤回 */
    const ts = assets.travelerSilhouette || {};
    for (const s of ["left", "right"]) {
      if (!ts[s] || !ids.has(ts[s])) throw new Error("travelerSilhouette 缺 " + s + " 側資產");
    }
    const sui = readFileSync(path.join(here, "../src/stage-ui.js"), "utf-8");
    if (!sui.includes("speakerSide") || !sui.includes("travelerSilhouette"))
      throw new Error("stage-ui 未使用資料驅動站位/剪影(疑似硬編碼)");
    if (!sui.includes("travelerBust=0")) throw new Error("剪影撤回參數(?travelerBust=0)缺失");
    if (!sui.includes('setLit("none")')) throw new Error("旁白/系統雙暗(setLit none)缺失");
    if (!sui.includes('classList.toggle("voice-no-portrait", noPortraitVoice)'))
      throw new Error("旁白/系統未切換無肖像版面");
    const stageHtml = readFileSync(path.join(here, "../stage.html"), "utf-8");
    for (const frag of ["#dialogue.voice-no-portrait .bslot", "#dialogue.voice-no-portrait #dlgText"])
      if (!stageHtml.includes(frag)) throw new Error("無肖像聲部未退場或未歸還文字寬度:" + frag);
    if (/scaleX\(\s*-1\s*\)/.test(sui)) throw new Error("偵測到鏡像");
    /* 引擎:連跑 20 次,state 保留 20 筆且 JSON 往返無損(紀錄不可刪的程式面) */
    let s = Engine.initialState();
    const cfg = { ball: "銅大", surface: "打磨", incline: "陡", timer: "水鐘" };
    for (let i = 0; i < 20; i++) {
      const r = Engine.runExperiment(s, cfg);
      s = r.state || r; /* 兼容回傳形狀 */
    }
    if (s.evidence.runs.length !== 20) throw new Error("20 次後 runs=" + s.evidence.runs.length);
    const back = JSON.parse(JSON.stringify(s));
    if (JSON.stringify(back) !== JSON.stringify(s)) throw new Error("serialize 往返漂移");
    if (back.evidence.runs.length !== 20) throw new Error("往返後筆數丟失");
    /* 分組=純 view:chapter-ui 具 grpToggle/aria-expanded/勾選永見;不碰引擎守衛 */
    const cui = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
    for (const frag of ["grpToggle", "aria-expanded", "expandedRuns", "勾選永遠可見"])
      if (!cui.includes(frag)) throw new Error("chapter-ui 分組要素缺失:" + frag);
    if (!/style\.display\s*=\s*"none"/.test(cui)) throw new Error("摺疊應為 display 隱藏(不刪 DOM/state)");
  }
});

tests.push({
  name: "序幕 v03 六板|映射+舊版未引用+禁可見疊層+固定時間+可及性(Sol 交接 20260720)",
  fn: () => {
    const assetsText = readFileSync(path.join(here, "../data/assets.json"), "utf-8");
    const assets = JSON.parse(assetsText);
    const ids = new Set(assets.entries.map((e) => e.id));
    const pp = assets.prologuePlates || {};
    for (const k of ["1", "2", "3", "4", "5", "6"])
      if (!pp[k] || !ids.has(pp[k]) || !pp[k].includes("v03")) throw new Error("prologuePlates 缺 v03 板 " + k);
    /* 舊版未引用:v01/v02 廢案禁止出現在 manifest */
    for (const old of ["p0_0_plate01_dark_room", "p0_0_plate02_aurora_intrusion",
      "p0_0_plate03_reach_glass", "p0_0_plate04_whitefall", "ch01/prologue/p0_0_plate"])
      if (assetsText.includes(old)) throw new Error("廢案仍被引用:" + old);
    /* 禁可見疊層:文字已直生於圖,程式不得再畫文章/新聞/通知/游標/動態時鐘/白層 */
    const stageHtml = readFileSync(path.join(here, "../stage.html"), "utf-8");
    for (const banned of ['id="mzScreen"', 'id="mzArticle"', 'id="mzPush"', 'id="mzCursor"',
      'id="mzNotifs"', 'id="mzClock"', 'id="mzWhite"', 'id="mzAurora"'])
      if (stageHtml.includes(banned)) throw new Error("v03 禁令:可見疊層仍存在 " + banned);
    for (const frag of ['id="mzPlateA"', 'id="mzPlateB"', 'id="mzSr"', 'aria-live="polite"', 'id="mzTitleLines"'])
      if (!stageHtml.includes(frag)) throw new Error("序幕要素缺失:" + frag);
    const sui = readFileSync(path.join(here, "../src/stage-ui.js"), "utf-8");
    /* 固定時間 00:49 已入圖:程式不得輸出動態時鐘 */
    if (/new Date\(/.test(sui)) throw new Error("固定時間契約:stage-ui 不得再有 new Date() 可見時鐘");
    /* 拍→板映射(n1-n2→1/n3→2/n4-n5→3/n6→4/n7→5/n8-n9→6) */
    if (!sui.includes("MZ_PLATE = [1, 1, 2, 3, 3, 4, 5, 6, 6]")) throw new Error("六板拍映射不符交接規格");
    /* 可及性:文章/新聞完整內容經隱藏 live region 送出;科學措辭鎖定 */
    if (!/mzSay\("平板畫面:/.test(sui) || !/mzSay\("突發新聞:/.test(sui))
      throw new Error("文章/新聞關鍵內容未經可及性文字送出");
    for (const frag of ["地磁風暴", "異常增幅原因待查", "通俗故事常這樣開場", "那兩顆球"])
      if (!sui.includes(frag)) throw new Error("可及性文字缺關鍵內容:" + frag);
    for (const banned of ["電磁風暴", "成因尚不清楚"])
      if (sui.includes(banned) || stageHtml.includes(banned)) throw new Error("違反科學措辭:" + banned);
    if (!/pc\.hidden && !pc\.contains\(ev\.target\)/.test(sui)) throw new Error("序幕焦點圍欄缺失");
  }
});

tests.push({
  name: "體感層|滾球重播/時間跳躍/支柱破裂/音效掛點/E2 示意圖(總監 20260720 全開)",
  fn: () => {
    const cui = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
    const sui = readFileSync(path.join(here, "../src/stage-ui.js"), "utf-8");
    const stageHtml = readFileSync(path.join(here, "../stage.html"), "utf-8");
    const assets = JSON.parse(readFileSync(path.join(here, "../data/assets.json"), "utf-8"));
    /* 掛點兩端對齊(chapter-ui 發佈=無訂閱者零行為;stage-ui 訂閱) */
    for (const evName of ["bd:run", "bd:debate"]) {
      if (!cui.includes('"' + evName + '"')) throw new Error("chapter-ui 缺掛點:" + evName);
      if (!sui.includes('"' + evName + '"')) throw new Error("stage-ui 未訂閱:" + evName);
    }
    /* sceneFx 三板偽影片(Sol 交接 20260720):場景存在/三板資產齊/尺寸 1920×1080/四里程碑年份 */
    const sceneIds = new Set(scenes.scenes.map((s) => s.id));
    const entryById = Object.fromEntries(assets.entries.map((e) => [e.id, e]));
    for (const [sc, fx] of Object.entries(assets.sceneFx || {})) {
      if (!sceneIds.has(sc)) throw new Error("sceneFx 指向不存在場景:" + sc);
      if (fx.fx !== "timejump") throw new Error("sceneFx 未知效果:" + fx.fx);
      if (!Array.isArray(fx.years) || !fx.years.every((y) => typeof y === "number"))
        throw new Error("timejump 年份里程碑非法");
      if (!Array.isArray(fx.plates) || fx.plates.length !== 3) throw new Error("timejump 需三板");
      for (const pid of fx.plates) {
        const e = entryById[pid];
        if (!e) throw new Error("板圖不存在:" + pid);
        if (e.w !== 1920 || e.h !== 1080) throw new Error("板圖尺寸非 1920×1080:" + pid);
      }
    }
    const int1 = assets.sceneFx && assets.sceneFx["INT-1"];
    if (!int1) throw new Error("INT-1 十一年跳躍未註冊");
    if (JSON.stringify(int1.years) !== JSON.stringify([1592, 1597, 1602, 1603]))
      throw new Error("INT-1 年份應為四里程碑 1592/1597/1602/1603(不逐年計數)");
    /* 禁四頁 CSS 假翻頁與逐年計數回歸 */
    if (stageHtml.includes("fxPages") || stageHtml.includes("bdFlip"))
      throw new Error("四頁 CSS 假翻頁應已退場");
    if (sui.includes("Math.round(from + span")) throw new Error("逐年計數應已移除");
    for (const frag of ['id="fxPlateA"', 'id="fxPlateB"'])
      if (!stageHtml.includes(frag)) throw new Error("三板溶接槽缺失:" + frag);
    for (const frag of ["SFX.paper", "endSceneFx", "fx.years"])
      if (!sui.includes(frag)) throw new Error("蒙太奇要素缺失:" + frag);
    /* 音效=合成零資產;偏好走 sessionStorage(存檔純度不破);HUD 有開關 */
    if (!sui.includes("AudioContext")) throw new Error("音效合成器缺失");
    if (!sui.includes("sessionStorage")) throw new Error("音效偏好未持久化(sessionStorage)");
    if (!stageHtml.includes('id="btnSfx"')) throw new Error("HUD 音效開關缺失");
    /* 滾球重播:吃真實讀值+可跳過+reduced 直出;破裂 FX;E2 SVG */
    for (const frag of ["labAnim", "run.readings", "animSkip", "fx-shake", 'code === "E2"'])
      if (!sui.includes(frag)) throw new Error("體感層要素缺失:" + frag);
    /* BGM v2:cue 值域受控+23 場景全覆蓋+場景驅動+總開關 */
    const BGM_MOODS = ["pisa", "study", "rain", "workshop", "hall", "dusk",
      "timePassage", "challenge", "debrief", "travelerMoon", "silence"];
    const bgm = assets.sceneBgm || {};
    scenes.scenes.forEach((s) => {
      if (!(s.id in bgm)) throw new Error("場景缺 BGM mood:" + s.id);
      if (!BGM_MOODS.includes(bgm[s.id])) throw new Error("未知 mood:" + s.id + "→" + bgm[s.id]);
    });
    for (const frag of ["sceneBgm", "BGM.refresh", 'play("storm")', 'play("travelerTitle")'])
      if (!sui.includes(frag)) throw new Error("BGM 要素缺失:" + frag);
    /* 真音樂檔:once/milestone schema+實檔存在;storm 恆 null;30 秒素材禁止硬循環 */
    if (assets.bgmVersion !== 2) throw new Error("BGM schema 應為 v2");
    for (const [mood, raw] of Object.entries(assets.bgmFiles || {})) {
      if (raw === null) continue;
      const spec = typeof raw === "string" ? { mode: "once", clips: [raw] } : raw;
      if (!["once", "milestone", "silence"].includes(spec.mode))
        throw new Error("bgmFiles mode 非法:" + mood + "→" + spec.mode);
      if (!Array.isArray(spec.clips)) throw new Error("bgmFiles clips 非陣列:" + mood);
      if (spec.mode === "silence" && spec.clips.length) throw new Error("silence 不得掛音樂檔");
      for (const f of spec.clips) {
        try { readFileSync(path.join(here, "..", assets.audioBasePath, f)); }
        catch (e) { throw new Error("bgmFiles 檔案不存在:" + mood + "→" + f); }
      }
    }
    if ((assets.bgmFiles || {}).storm !== null) throw new Error("storm 應維持合成(null)");
    if ((assets.bgmFiles.workshop.clips || []).length !== 3 || assets.bgmFiles.workshop.mode !== "milestone")
      throw new Error("workshop 應為 A/B/C 三段 milestone");
    if ((assets.bgmFiles.hall.clips || []).length !== 3 || assets.bgmFiles.hall.mode !== "milestone")
      throw new Error("hall 應為 A/B/C 三段 milestone");
    if (!sui.includes("a.loop = false") || sui.includes("a.loop = true"))
      throw new Error("Gemini 30 秒素材不得無限硬循環");
    for (const frag of ['d.scene === "A2-2"', 'd.scene === "A2-3"', 'd.scene === "A2-4"',
      'd.phase === "fr"', "BGM.variant(1)", "BGM.variant(2)"])
      if (!sui.includes(frag)) throw new Error("BGM milestone 掛點缺失:" + frag);
    if (!stageHtml.includes("fx-gain") || !stageHtml.includes('id="fxJump"'))
      throw new Error("FX 樣式/容器缺失");
  }
});

tests.push({
  name: "竣工修正|A1 匯入淨化+DOM-safe+A2 讀屏主線+Batch03+工作桌+可靠性(Sol 巡查 20260720)",
  fn: () => {
    const S = require("../src/sanitize.js");
    const N2 = require("../src/narrative.js");
    /* 合法往返必過 */
    const good = JSON.parse(N2.serialize(N2.initialState("scholar")));
    if (!S.sanitizeImport(good, patterns, scenes).ok) throw new Error("合法 state 被誤拒");
    /* 惡意/畸形必拒(A-1 負向) */
    const cases = [
      (s) => { s.lab.evidence.runs = [{ id: 1, day: 1, seq: 1, config: { ball: "<img src=x onerror=alert(1)>", surface: "打磨", incline: "陡", timer: "水鐘" }, readings: [1, 2, 3, 4] }]; },
      (s) => { s.lab.evidence.runs = [{ id: "x' autofocus onfocus='alert(1)", day: 1, seq: 1, config: { ball: "銅大", surface: "打磨", incline: "陡", timer: "水鐘" }, readings: [1, 2, 3, 4] }]; },
      (s) => { s.lab.evidence.runs = new Array(301).fill({ id: 1, day: 1, seq: 1, config: { ball: "銅大", surface: "打磨", incline: "陡", timer: "水鐘" }, readings: [1, 2, 3, 4] }); },
      (s) => { s.lab.evidence.runs = [{ id: 1, day: 1, seq: 1, config: { ball: "銅大", surface: "打磨", incline: "陡", timer: "水鐘" }, readings: [NaN, 2, 3, 4] }]; },
      (s) => { s.mode = "admin"; },
      (s) => { s.rep = 99; },
      (s) => { s.cursor.scene = "Z9-9"; },
      (s) => { s.transcript = [{ scene: "P0-1", speaker: "x".repeat(50), text: "hi" }]; },
      (s) => { JSON.parse('{"__proto__":{"polluted":1}}'); Object.defineProperty(s, "x", { value: 1 }); s.transcript = JSON.parse('[{"scene":"P0-1","text":"a","__proto__":{"p":1}}]'); },
    ];
    for (let i = 0; i < cases.length; i++) {
      const s = JSON.parse(N2.serialize(N2.initialState("explore")));
      cases[i](s);
      const r = S.sanitizeImport(s, patterns, scenes);
      if (i === 8) { /* __proto__ 於 JSON.parse 成為普通鍵仍須拒 */
        if (r.ok) throw new Error("原型污染鍵未被拒");
      } else if (r.ok) throw new Error("惡意案例 #" + i + " 未被拒");
    }
    /* 匯入閘接線+DOM-safe:chapter-ui 禁 innerHTML 串接;Sanitize 在 startGame 之前 */
    const cui = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
    const concat = (cui.match(/\.innerHTML\s*=\s*[^;]+;/g) || []).filter((l) => !/=\s*"";/.test(l));
    if (concat.length) throw new Error("chapter-ui 仍有 innerHTML 串接:" + concat[0]);
    if (!(cui.indexOf("Sanitize.sanitizeImport") >= 0 && cui.indexOf("Sanitize.sanitizeImport") < cui.indexOf("startGame(chk.state)")))
      throw new Error("匯入閘未接在 startGame 之前");
    if (!cui.includes("saveWarn")) throw new Error("存檔失敗警示缺失(B-4)");
    if (!cui.includes("revokeObjectURL")) throw new Error("匯出 URL 未回收(C-1)");
    /* A-2:永不隱藏的讀屏 log;兩殼載入 sanitize */
    const stageHtml = readFileSync(path.join(here, "../stage.html"), "utf-8");
    const chapterHtml = readFileSync(path.join(here, "../chapter.html"), "utf-8");
    if (!/id="srLine" class="srOnly" role="log" aria-live="polite"/.test(stageHtml))
      throw new Error("srLine 讀屏主線缺失");
    for (const h of [stageHtml, chapterHtml])
      if (!h.includes("src/sanitize.js")) throw new Error("殼未載入 sanitize.js");
    /* Batch03:四卡專圖+標題/史實橫幅;E2 恆 null(程式 SVG) */
    const assets = JSON.parse(readFileSync(path.join(here, "../data/assets.json"), "utf-8"));
    const byId = Object.fromEntries(assets.entries.map((e) => [e.id, e]));
    for (const cid of ["card_E1", "card_E3", "card_E4", "card_E5"]) {
      const e = byId[cid];
      if (!e || !e.path || e.w !== 800 || e.h !== 500) throw new Error("Batch03 卡片缺失/尺寸錯:" + cid);
    }
    if (byId["card_E2"].path !== null) throw new Error("card_E2 應維持 null(程式 SVG)");
    if (!byId["title_background"] || !byId["histfacts_banner"]) throw new Error("標題/史實橫幅 entry 缺失");
    const sui = readFileSync(path.join(here, "../src/stage-ui.js"), "utf-8");
    for (const frag of ['assetEntry("card_" + code)', "title_background", "histfacts_banner"])
      if (!sui.includes(frag)) throw new Error("Batch03 接線缺失:" + frag);
    /* 工作桌重排+可靠性 */
    for (const frag of ['id="labBench"', 'id="labBook"', 'id="benchProps"', 'id="labAnimSlot"',
      'id="labGoal"', 'id="labFlow"', 'id="labEmpty"', 'id="secRuns"', 'id="secClaims"', 'id="saveWarn"'])
      if (!stageHtml.includes(frag)) throw new Error("工作桌重排要素缺失:" + frag);
    if (!cui.includes("friendlyLabGoal") || !cui.includes("secRuns.hidden") || !cui.includes("empty.hidden"))
      throw new Error("實驗簿白話目標/漸進揭露缺失");
    if (!sui.includes("figcaption") || !stageHtml.includes("mix-blend-mode: multiply"))
      throw new Error("器材主視覺的防溢位/紙面融合缺失");
    for (const frag of ["unlockAudioOnce", "visibilitychange", 'addEventListener("pointerdown", unlockAudioOnce)', 'addEventListener("keydown", unlockAudioOnce)'])
      if (!sui.includes(frag)) throw new Error("音訊可靠性缺失:" + frag);
    /* 進實驗台確認閘:敘事→embed 須經玩家確認(讀完再走) */
    if (!stageHtml.includes('id="btnEmbark"') || !sui.includes("embarkGate"))
      throw new Error("進實驗台確認閘缺失");
  }
});

tests.push({
  name: "試玩修正|實驗診斷+連續工作階段+辯論桌 v2+失敗分流(Sol 20260720)",
  fn: () => {
    const stageHtml = readFileSync(path.join(here, "../stage.html"), "utf-8");
    const chapterHtml = readFileSync(path.join(here, "../chapter.html"), "utf-8");
    const cui = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
    const plainUi = readFileSync(path.join(here, "../src/ui.js"), "utf-8");
    const sui = readFileSync(path.join(here, "../src/stage-ui.js"), "utf-8");

    /* 實驗回饋:器材性格公開、兩道 12% 門檻分開說、失敗後才漸進給問句。 */
    for (const frag of ['id="labToolProfile"', 'id="labCoach"', 'id="labAssist"', 'id="btnLabDiscuss"'])
      if (!stageHtml.includes(frag)) throw new Error("實驗診斷 UI 缺失:" + frag);
    for (const frag of ["TIMER_PROFILE", "labFailStreak", "neutralLabObservation", "strongLabQuestion",
      "前四段形狀偏差", "第五段預測偏差", "兩項皆須 ≤ 12.0%"])
      if (!cui.includes(frag)) throw new Error("實驗診斷邏輯缺失:" + frag);
    if (cui.includes("選集內部不一致") || plainUi.includes("選集內部不一致"))
      throw new Error("誤導性舊訊息『選集內部不一致』回歸");

    /* 連續工作階段:A2-2 首入才閘；A2-3 e2/e3c 不重複跳出再進。 */
    if (!sui.includes('d.scene === "A2-2" || d.scene === "SC-R1"'))
      throw new Error("實驗進場閘未限縮為主實驗首次/信譽修復");
    if (!sui.includes('$("btnEmbark").focus()')) throw new Error("轉場確認鈕未取得鍵盤焦點");

    /* 辯論桌:證詞卡+證據手牌+自然語言行動句；追問後才顯示洞見。 */
    for (const frag of ["statementCard", "evidenceHand", "問到底——讓他把前提說滿",
      "先選一句證詞與一張證據", "renderDebrief", "與伽利略複盤"])
      if (!cui.includes(frag)) throw new Error("辯論桌 v2 缺失:" + frag);
    for (const p of Object.values((debate.chapter || {}).pillars || {})) {
      const statements = p.useLegacy ? debate.statements : p.statements;
      for (const st of statements) if (!st.insight) throw new Error("證詞缺追問洞見:" + st.id);
    }
    const a3f = scenes.scenes.find((s) => s.id === "A3-F");
    const debrief = a3f && a3f.nodes.find((n) => n.type === "embed");
    if (!debrief || debrief.system !== "debrief") throw new Error("說服力中止仍被誤導回實驗台");

    /* 模式是玩法偏好，不把成年人/學生按學段分級。 */
    for (const h of [stageHtml, chapterHtml])
      if (/國中基準|高中以上/.test(h)) throw new Error("模式文案仍以學段標記玩家");
  }
});

tests.push({
  name: "難度透明化|白話摘要+有隙標記(僅探索)+P1 試射+回顧末頁(Sol 彙整,總監核 20260720)",
  fn: () => {
    const assets = JSON.parse(readFileSync(path.join(here, "../data/assets.json"), "utf-8"));
    /* 摘要完備:八鍵全有,語意透明但不標正解(不得出現「正解/答案/用這張」字樣) */
    const KEYS = ["E1", "E2", "E3a", "E3b", "E3c", "E4", "S1", "S2"];
    for (const k of KEYS) {
      const s = (assets.evidenceSummary || {})[k];
      if (!s) throw new Error("evidenceSummary 缺:" + k);
      if (/正解|答案|用這張/.test(s)) throw new Error("摘要洩題:" + k);
    }
    const cui = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
    for (const frag of ["evidenceSummary", "gapBadge", "stmtHasGap", '"explore"'])
      if (!cui.includes(frag)) throw new Error("透明化要素缺失:" + frag);
    /* 有隙標記=僅探索模式(學者不標) */
    if (!/state\.mode === "explore"[\s\S]{0,300}gapBadge/.test(cui))
      throw new Error("有隙標記未鎖定探索模式");
    /* P1 首發免扣:引擎行為測試 */
    const N2 = require("../src/narrative.js");
    if (!readFileSync(path.join(here, "../src/narrative.js"), "utf-8").includes("firstMissUsed"))
      throw new Error("P1 試射旗標缺失");
    /* 回顧新題(GB-ADR-010)入 scenes;末頁措辭+封存按鈕 */
    const scenesJson = JSON.parse(readFileSync(path.join(here, "../data/scenes.json"), "utf-8"));
    const e2 = scenesJson.scenes.find((s) => s.id === "E-2");
    const rv = e2.nodes.find((n) => n.type === "review");
    if (!rv.prompts[0].includes("愈重愈快") || !rv.prompts[1].includes("垂直"))
      throw new Error("回顧題未更新為 GB-ADR-010 版");
    if (!cui.includes("封存第一章") || !cui.includes("reviewHead")) throw new Error("回顧末頁措辭缺失");
    /* GB-ADR-012 奇數錨定與平方橋(總監 20260720):鑰匙句+累加拍不得被誤刪 */
    const a22 = scenesJson.scenes.find((s) => s.id === "A2-2");
    if (!a22.nodes.find((n) => n.id === "n3" && n.text.includes("把第一段當作一個單位")))
      throw new Error("奇數錨定鑰匙句缺失(A2-2 n3)");
    const n3b = a22.nodes.find((n) => n.id === "n3b");
    if (!n3b || !n3b.text.includes("一、四、九、十六") || n3b.next !== "n4")
      throw new Error("平方橋累加拍缺失或斷鏈(A2-2 n3b)");
    const stageHtml = readFileSync(path.join(here, "../stage.html"), "utf-8");
    for (const frag of ["statementCard { background-image", "gapBadge", "evSummary", 'body[data-view="review"] #panelWrap'])
      if (!stageHtml.includes(frag)) throw new Error("復古化/末頁樣式缺失:" + frag);
  }
});

tests.push({
  name: "斷言分段四格常駐|assertStage 單一事實源+敘事層拒絕搶跑(GB-ADR-011,Sol B-1 補強)",
  fn: () => {
    const N2 = require("../src/narrative.js");
    const scenes = JSON.parse(readFileSync(path.join(here, "../data/scenes.json"), "utf-8"));
    const untilOf = (sid, nid) => scenes.scenes.find((s) => s.id === sid).nodes.find((n) => n.id === nid).until;
    /* 四格 matrix:until 直接取自 scenes 資料,不用手抄本(資料改了測試就跟著改) */
    const CELLS = [
      ["A2-2", "e1", { explore: [false, false], scholar: [false, false] }],   /* a:只認證 */
      ["A2-3", "e2", { explore: [true, false], scholar: [true, false] }],     /* b:與球重無關 */
      ["A2-3", "e3c", { explore: [false, true], scholar: [false, true] }],    /* c:雙模式必經 */
      ["SC-R1", "e1", { explore: [false, false], scholar: [false, false] }],  /* repair:乾淨紀錄 */
    ];
    for (const [sid, nid, expect] of CELLS)
      for (const mode of ["explore", "scholar"]) {
        const a = N2.assertStage(untilOf(sid, nid), mode);
        if (a.b !== expect[mode][0] || a.c !== expect[mode][1])
          throw new Error(`四格失守 ${sid}/${nid} ${mode}:得 b=${a.b},c=${a.c}`);
      }
    /* 自由段(無 until):B 開放、C 依學者 */
    if (!N2.assertStage(null, "explore").b || N2.assertStage(null, "explore").c || !N2.assertStage(null, "scholar").c)
      throw new Error("自由段規則失守");
    /* 敘事層拒絕搶跑:守衛在引擎,不只藏按鈕 */
    const GUARD = "劇情還沒問到";
    for (const [sid, nid, type] of [["A2-2", "e1", "b"], ["A2-2", "e1", "c"], ["A2-3", "e2", "c"], ["SC-R1", "e1", "b"], ["SC-R1", "e1", "c"]]) {
      const s = N2.initialState("scholar");
      s.cursor = { scene: sid, node: nid };
      const r = N2.labAction(s, "assert", { type, claimIds: [1, 2] });
      if (!r.error || !r.error.includes(GUARD)) throw new Error(`搶跑未被引擎擋下:${sid}/${nid} 斷言 ${type}`);
    }
    /* 正確階段不誤傷:A2-3/e2 斷言 b 不得觸發守衛(引擎自身的主張檢查訊息可接受) */
    const ok = N2.initialState("scholar");
    ok.cursor = { scene: "A2-3", node: "e2" };
    const rr = N2.labAction(ok, "assert", { type: "b", claimIds: [1, 2] });
    if (rr.error && rr.error.includes(GUARD)) throw new Error("守衛誤傷正確階段的斷言 b");
    /* UI 同源:chapter-ui 必須呼叫 assertStage,不得自帶平行邏輯 */
    const cui = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
    if (!cui.includes("N.assertStage(")) throw new Error("chapter-ui 未使用 assertStage 單一事實源");
    if (/updateAssertButtons[\s\S]{0,400}until\.e3/.test(cui)) throw new Error("chapter-ui 殘留平行分段邏輯");
    /* 押注三問(總監裁決 20260720):機制不動,提問跟劇情階段顯形 */
    for (const frag of ["judgeAskText", "換了球。你賭", "用同一條規律"])
      if (!cui.includes(frag)) throw new Error("押注三問缺失:" + frag);
    for (const page of ["stage.html", "chapter.html"])
      if (!readFileSync(path.join(here, "../" + page), "utf-8").includes('id="judgeAsk"'))
        throw new Error(page + " 缺 judgeAsk 掛點");
  }
});

tests.push({
  name: "字體三聲部|明體子集出貨+P0-0 現代敘事全黑體(1590 恢復世界明體;標題=書封例外)+楷體 provisional(Sol 字體驗證 20260720)",
  fn: () => {
    /* 子集字型實體+授權隨行:未入庫=不存在 */
    const fdir = path.join(here, "../../public/assets/fonts");
    for (const f of ["bd-serif-tc-regular.woff2", "bd-serif-tc-bold.woff2", "LICENSE-OFL-1.1.txt"])
      if (!existsSync(path.join(fdir, f))) throw new Error("字型檔缺失:" + f);
    const stageHtml = readFileSync(path.join(here, "../stage.html"), "utf-8");
    for (const frag of ['"BD Serif TC"', "bd-serif-tc-regular.woff2", "--font-hand", "font-display: swap"])
      if (!stageHtml.includes(frag)) throw new Error("三聲部樣式缺失:" + frag);
    /* 明體鏈以子集字型為首;回退鏈保留 */
    if (!/--font-dialogue:\s*"BD Serif TC",\s*"Noto Serif TC"/.test(stageHtml))
      throw new Error("--font-dialogue 未以 BD Serif TC 為首");
    /* 穿越剪接:P0-0 題詞/字幕/按鈕=黑體,禁用明體(標題畫面=書封例外,不在此檢) */
    const blockOf = (sel) => {
      const m = stageHtml.split(sel + " {")[1];
      if (!m) throw new Error("選擇器缺失:" + sel);
      return m.slice(0, m.indexOf("}"));
    };
    for (const sel of ["#mzTitleLines p", "#mzCaption", "#btnPrologueGo"])
      if (blockOf(sel).includes("--font-dialogue")) throw new Error("P0-0 出現明體(穿越剪接破功):" + sel);
    /* 楷體三落點常駐(Sol 最小修正 ③):回顧作答/檯上便條/旅人筆記台詞 */
    if (!blockOf('body[data-view="review"] #controls textarea').includes("--font-hand"))
      throw new Error("楷體落點缺:回顧作答");
    if (!blockOf("#labHint").includes("--font-hand")) throw new Error("楷體落點缺:檯上便條");
    if (!stageHtml.includes('#dialogue[data-speaker="旅人筆記"] #dlgText'))
      throw new Error("楷體落點缺:旅人筆記台詞");
    if (!readFileSync(path.join(here, "../src/stage-ui.js"), "utf-8").includes("dataset.speaker"))
      throw new Error("stage-ui 未掛 speaker 資料屬性");
    /* runtime 確有「旅人筆記」發言來源,CSS 掛勾不落空 */
    if (!readFileSync(path.join(here, "../src/narrative.js"), "utf-8").includes('"旅人筆記"'))
      throw new Error("narrative 無旅人筆記發言來源");
    /* 便條=玩家親筆:第一人稱自筆語氣(Sol B-3) */
    const cui = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
    if (!cui.includes("我要從四段數字找出規律")) throw new Error("便條未改第一人稱");
    /* 楷體 provisional 標記+RC 前義務入檔 */
    if (!readFileSync(path.join(fdir, "README.md"), "utf-8").includes("provisional"))
      throw new Error("楷體未標 provisional");
  }
});

tests.push({
  name: "終幕卡+行動殼|下一章預告(戲劇卡+系統行)+全螢幕/轉橫+PWA manifest(GB-ADR-013/014)",
  fn: () => {
    const stageHtml = readFileSync(path.join(here, "../stage.html"), "utf-8");
    if (stageHtml.includes("灰盒對照版"))
      throw new Error("玩家入口不應顯示內部灰盒對照連結");
    for (const frag of ['id="nextCard"', "拋出去的東西", "第二章製作中", "書信碼",
      'id="btnFull"', 'id="rotateHint"', "viewport-fit=cover", '<link rel="manifest"'])
      if (!stageHtml.includes(frag)) throw new Error("終幕卡/行動殼要素缺失:" + frag);
    /* 鉤引語=E-1 凍結原句的子字串(禁引未凍結之第二章劇本;防台詞漂移) */
    const scenesJson = JSON.parse(readFileSync(path.join(here, "../data/scenes.json"), "utf-8"));
    const e1n2 = scenesJson.scenes.find((s) => s.id === "E-1").nodes.find((n) => n.id === "n2").text;
    if (!e1n2.includes("它往前,又往下——兩件事,同時發生。"))
      throw new Error("終幕卡鉤引語與 E-1 凍結台詞不符");
    /* 灰盒不動:對照殼不長舞台專屬件 */
    const grey = readFileSync(path.join(here, "../chapter.html"), "utf-8");
    for (const frag of ["nextCard", "btnFull", "rotateHint"])
      if (grey.includes(frag)) throw new Error("灰盒殼混入舞台專屬件:" + frag);
    /* 章末系統行正名:候選版時代不得再自稱灰盒 */
    const fin = scenesJson.scenes.find((s) => s.id === "E-2").nodes.find((n) => n.id === "fin").text;
    if (fin.includes("灰盒")) throw new Error("章末系統行仍自稱灰盒");
    /* PWA manifest:全螢幕+橫向+圖示實檔 */
    const mani = JSON.parse(readFileSync(path.join(here, "../../manifest.json"), "utf-8"));
    if (mani.display !== "fullscreen" || mani.orientation !== "landscape")
      throw new Error("manifest 應為 fullscreen+landscape");
    for (const ic of mani.icons)
      if (!existsSync(path.join(here, "../..", ic.src))) throw new Error("manifest 圖示缺檔:" + ic.src);
    /* 直向自動橫置(GB-ADR-016):portrait+coarse 時舞台旋轉 90° 滿版,rotateHint 退場 */
    if (!/@media \(orientation: portrait\) and \(pointer: coarse\)[\s\S]{0,700}rotate\(90deg\)/.test(stageHtml))
      throw new Error("直向自動橫置規則缺失(GB-ADR-016)");
    if (!/rotate\(90deg\);[\s\S]{0,200}#rotateHint \{ display: none !important; \}/.test(stageHtml))
      throw new Error("自動橫置後 rotateHint 未退場");
    /* 016 補記:旋轉手機=視覺低高度橫屏——低高度規則需含直向替代式;窄高規則鎖桌機(pointer:fine) */
    if (!stageHtml.includes("(orientation: portrait) and (pointer: coarse) and (max-width: 520px)"))
      throw new Error("低高度規則缺直向旋轉替代式(GB-ADR-016 補記)");
    if (!stageHtml.includes("(min-height: 521px) and (pointer: fine)"))
      throw new Error("窄高規則未鎖桌機 pointer:fine");
    /* stage-ui:全螢幕+鎖向+終幕卡掛點;iPhone 不支援時藏鈕 */
    const sui = readFileSync(path.join(here, "../src/stage-ui.js"), "utf-8");
    for (const frag of ["requestFullscreen", 'orientation.lock("landscape")', "nextCard", "btnRotDismiss"])
      if (!sui.includes(frag)) throw new Error("stage-ui 行動殼邏輯缺失:" + frag);
  }
});

tests.push({
  name: "系列首頁 v2|單屏殼+章節列+字體分工+進度歸屬",
  fn: () => {
    const stageHtml = readFileSync(path.join(here, "../stage.html"), "utf-8");
    const cui = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
    for (const frag of [
      'class="titleIdentity"', 'class="chapterRail"', 'data-chapter="ch01"',
      'data-chapter="ch02" disabled', 'id="continueMeta"', 'overflow: hidden'
    ]) if (!stageHtml.includes(frag)) throw new Error("系列首頁契約缺失:" + frag);
    if (!stageHtml.includes("font-family: var(--font-ui); font-weight: 600"))
      throw new Error("首頁操作字未使用黑體聲部");
    if (!stageHtml.includes("#titleCard .t1") || !stageHtml.includes("font-family: var(--font-dialogue)"))
      throw new Error("系列標題未保留明體聲部");
    if (/label\.mode \.mc small\s*\{[^}]*display\s*:\s*none/s.test(stageHtml))
      throw new Error("低高度畫面仍須保留模式說明給輔助技術");
    for (const frag of ['$("continueMeta").textContent', 'loaded.mode === "scholar"', 'loaded.lab.days'])
      if (!cui.includes(frag)) throw new Error("首頁進度未標明模式/天數:" + frag);
  }
});

tests.push({
  name: "手機橫屏真機回歸|證據字級、實驗選單與辯論下半部不再溢出／裁切",
  fn: () => {
    const stageHtml = readFileSync(path.join(here, "../stage.html"), "utf-8");
    const cui = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
    if (/body\[data-view="debate"\] #panelWrap \{ bottom: 42%; \}/.test(stageHtml))
      throw new Error("舊辯論 bottom:42% 裁切規則仍存在");
    for (const frag of [
      "#dlgText.sys.gain { font-size: 1.1em",
      "grid-template-columns: max-content minmax(0, 1fr)",
      "grid-template-columns: repeat(3, minmax(260px, 78vw))",
      "#rotateHint { position: absolute; inset: 0; z-index: 60"
    ]) if (!stageHtml.includes(frag)) throw new Error("手機橫屏修正缺失:" + frag);
    for (const frag of ["COMPACT_LAB_QUERY", "timerOptionLabel", "syncLabTimerLabels", 'timer + "・" + PATTERNS.dayCost[timer] + "天"'])
      if (!cui.includes(frag)) throw new Error("手機計時器短名契約缺失:" + frag);
  }
});

tests.push({
  name: "窄舞台縮放回歸|900px 以下收斂為單一發言肖像，兩殼共用中文標點層",
  fn: () => {
    const stageHtml = readFileSync(path.join(here, "../stage.html"), "utf-8");
    const chapterHtml = readFileSync(path.join(here, "../chapter.html"), "utf-8");
    const sui = readFileSync(path.join(here, "../src/stage-ui.js"), "utf-8");
    for (const frag of [
      "@media (max-width: 900px)",
      '#dialogue[data-active="right"] #bustLeft',
      '#dialogue.has-l #dlgText, #dialogue.has-r #dlgText { margin-left: 0; margin-right: 0; }',
      '#dialogue[data-active="right"].has-r #dlgText { margin-right: 118px; }'
    ]) if (!stageHtml.includes(frag)) throw new Error("窄舞台 CSS 契約缺失:" + frag);
    for (const html of [stageHtml, chapterHtml]) {
      const tf = html.indexOf('src/text-format.js');
      const ui = html.indexOf('src/chapter-ui.js');
      if (tf < 0 || ui < 0 || tf > ui) throw new Error("text-format 必須先於 chapter-ui 載入");
    }
    if (!sui.includes('SHORT_P = "、，,；;：:·—"') || !sui.includes('LONG_P = "。．.？！?!…"'))
      throw new Error("逐字演出未識別全形中文標點");
    if (!sui.includes('"聲音：" +') || !sui.includes('displayText(d.speaker) + "："'))
      throw new Error("動態 HUD／對話紀錄仍輸出半形中文標點");
  }
});

tests.push({
  name: "C-2 拆分|stage-ui.js ≡ src/stage/*.part.js 串接(落後檢測;GB-ADR-015)",
  fn: async () => {
    const { concatParts } = await import("../tools/build-stage.mjs");
    const disk = readFileSync(path.join(here, "../src/stage-ui.js"), "utf-8");
    if (concatParts() !== disk)
      throw new Error("stage-ui.js 落後於 part 檔:執行 node tools/build-stage.mjs 後重新 commit");
    const parts = readdirSync(path.join(here, "../src/stage")).filter((f) => f.endsWith(".part.js"));
    if (parts.length < 11) throw new Error("stage part 檔缺失(應 ≥11,現 " + parts.length + ")");
    if (!disk.includes("本檔為生成物")) throw new Error("stage-ui.js 缺生成告示");
  }
});

tests.push({
  name: "第二章 M1|scenes2 雙載體深等+劇本 v0.1.3 逐字抽查+存檔鍵隔離",
  fn: () => {
    const fromJs = require("../data/scenes2.js");
    const fromJson = JSON.parse(readFileSync(path.join(here, "../data/scenes2.json"), "utf-8"));
    if (JSON.stringify(fromJs) !== JSON.stringify(fromJson)) throw new Error("scenes2 雙載體不深等");
    /* 逐字抽查(凍結劇本 v0.1.3) */
    const flat = JSON.stringify(fromJson);
    for (const frag of ["老夫讀了。(抬眼)有一問。", "此乃前章舊案,老夫已錄於冊", "答非所問",
      "那才是 impetus 押的注", "先不給它名字", "這一回,老夫也帶數字來"])
      if (!flat.includes(frag)) throw new Error("劇本逐字缺失:" + frag);
    /* 效果抽查:B0-2 a=rep-1/b 線 S3+rep+1;B1-2 F1 */
    const b02 = fromJson.scenes.find((s) => s.id === "B0-2");
    const q1 = b02.nodes.find((n) => n.id === "q1");
    if (q1.options.find((o) => o.id === "a").effects[0].rep !== -1) throw new Error("B0-2.a 信譽效果錯");
    if (!JSON.stringify(b02.nodes.find((n) => n.id === "s1").effects).includes('"S3"')) throw new Error("S3 未授予");
    /* 學者節點 mode 過濾標記 */
    const b12 = fromJson.scenes.find((s) => s.id === "B1-2");
    if (b12.nodes.find((n) => n.id === "nsch1").mode !== "scholar") throw new Error("學者節點未標 mode");
    /* 存檔鍵隔離:chapter2 覆寫 bd_ch2_save;chapter.html 不得含覆寫(灰盒零差異) */
    const c2 = readFileSync(path.join(here, "../chapter2.html"), "utf-8");
    if (!c2.includes('BD_SAVE_KEY = "bd_ch2_save"') || !c2.includes("scenes2")) throw new Error("chapter2 殼要素缺失");
    if (readFileSync(path.join(here, "../chapter.html"), "utf-8").includes("BD_SAVE_KEY")) throw new Error("chapter.html 混入 ch2 覆寫");
    if (!readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8").includes('window.BD_SAVE_KEY || "bd_ch1_save"'))
      throw new Error("存檔鍵預設回退缺失");
  }
});

tests.push({
  name: "第二章 M1|R-NAR2 三軌 lint:真實文本零受管詞+六組負向變異",
  fn: () => {
    const data = JSON.parse(readFileSync(path.join(here, "../data/scenes2.json"), "utf-8"));
    const TERMS = data.lint.terms;
    const scan = (sc) => { /* 掃所有玩家可見字串:台詞/選項/系統行/標題 */
      const hits = [];
      const check = (txt, where) => {
        if (typeof txt !== "string") return;
        for (const [k, words] of Object.entries(TERMS))
          for (const w of words) if (txt.includes(w)) hits.push({ k, w, where });
      };
      sc.scenes.forEach((s) => { check(s.title, s.id); s.nodes.forEach((n) => {
        check(n.text, s.id + "/" + n.id);
        (n.options || []).forEach((o) => check(o.text, s.id + "/" + n.id + "." + o.id));
      }); });
      return hits;
    };
    const hits = scan(data);
    /* M1 合法狀態:B0-B1 無任何受管詞;有登錄的例外須在 lint.entries(現為空) */
    const allowed = new Set((data.lint.entries || []).map((e) => e.nodeId + ":" + e.term));
    const bad = hits.filter((h) => !allowed.has(h.where.split(".")[0] + ":" + h.w));
    if (bad.length) throw new Error("受管詞違規:" + JSON.stringify(bad[0]));
    /* 六組負向變異(合成注入,驗掃描器有牙) */
    const inject = (txt) => scan({ scenes: [{ id: "X", title: "", nodes: [{ id: "n1", type: "line", speaker: "旅人", text: txt, next: "end" }] }] }).length;
    const negatives = ["這就是拋物線", "射程吃的是平方根", "它們同時落地了", "√H 的關係", "開方即可", "拋物線是完美的形"];
    negatives.forEach((t, i) => { if (!inject(t)) throw new Error("負向變異未被抓到 #" + (i + 1) + ":" + t); });
  }
});

tests.push({
  name: "第二章 M1|行為走查:B0-1→B1-4 全程可通,證據/信譽/學者分支/存檔往返",
  fn: () => {
    const F = require("../src/narrative.js")._factory;
    const scenes2 = JSON.parse(readFileSync(path.join(here, "../data/scenes2.json"), "utf-8"));
    const Engine = require("../src/engine.js");
    const walk = (mode, pickWrongFirst) => {
      const N2 = F(scenes2, Engine, {});
      let st = N2.initialState(mode);
      let guard = 0;
      while (!st.ended && guard++ < 300) {
        const v = N2.view(st);
        if (v.type === "choice") {
          const opts = v.options.map((o) => o.id);
          let pick = opts.includes("a") ? "a" : opts[0];
          if (pickWrongFirst && v.scene === "B0-2" && !st.flags.triedA) {
            st = N2.choose(st, "a").state; st.flags.triedA = "1";
            if (st.rep !== 2) throw new Error("B0-2.a 應 rep 3→2,得 " + st.rep);
            continue; /* 誤選後讓引擎把回應台詞走完,迴圈自然回到選項 */
          }
          if (v.scene === "B0-2") pick = "b";
          const r = N2.choose(st, pick);
          if (r.error) throw new Error("choose 失敗:" + v.scene + " " + r.error);
          st = r.state;
        } else {
          const r = N2.advance(st);
          if (r.error) throw new Error("advance 失敗:" + JSON.stringify(v).slice(0, 80));
          st = r.state;
        }
      }
      if (!st.ended) throw new Error("300 步未達終點(" + mode + ")");
      return st;
    };
    const s1 = walk("explore", true);
    if (!s1.evidence.S3 || !s1.evidence.F1) throw new Error("探索線證據缺失");
    if (s1.rep !== 3) throw new Error("探索線信譽應 3(−1+1),得 " + s1.rep);
    const s2 = walk("scholar", false);
    if (!s2.evidence.F1) throw new Error("學者線 F1 缺失");
    if (!s2.transcript.some((t) => (t.text || "").includes("先不給它名字"))) throw new Error("學者分支未演出");
    if (walk("explore", false).transcript.some((t) => (t.text || "").includes("先不給它名字")))
      throw new Error("探索線誤入學者節點");
    /* 存檔往返 */
    const F2i = F(scenes2, Engine, {});
    const code = F2i.serialize(s1);
    const back = F2i.loadSave(code);
    if (back.error) throw new Error("ch2 存檔往返失敗:" + back.error);
    if (JSON.stringify(back.state) !== JSON.stringify(JSON.parse(JSON.stringify(s1)))) throw new Error("往返不深等");
  }
});

tests.push({
  name: "第二章 M2a|engine2:profile 支配序+受控自由+校準重置+守衛(R-WS2)",
  fn: () => {
    const E2 = require("../src/engine2.js");
    const build = (parts, cal) => {
      let s = E2.initialState();
      for (const [slot, part] of parts) { const r = E2.place(s, slot, part); if (r.error) throw new Error("place " + part + ":" + r.error); s = r.state; }
      for (const k of cal || []) { const r = E2.calibrate(s, k); if (r.error) throw new Error(r.error); s = r.state; }
      return s;
    };
    const FULL = [["launcher", "shortGroove"], ["release", "latchRelease"], ["edge", "polishedEdge"], ["rangeBed", "rakedSand"], ["heightRig", "liftSandbed"]];
    /* 空槽=notRunnable+run 拒絕 */
    let s0 = E2.initialState();
    if (E2.profileOf(s0) !== "notRunnable") throw new Error("空槽 profile 錯");
    if (!E2.beginSeries(s0, "copper").error) throw new Error("空槽可開 series");
    /* 支配序四格 */
    if (E2.profileOf(build(FULL, ["releaseZero", "rangeScale"])) !== "clean") throw new Error("clean 判定錯");
    if (E2.profileOf(build(FULL, ["releaseZero"])) !== "coarseRead") throw new Error("rangeScale 未校應 coarseRead");
    const rough = FULL.map((p) => p[0] === "edge" ? ["edge", "roughEdge"] : p);
    if (E2.profileOf(build(rough, ["releaseZero", "rangeScale"])) !== "directionScatter") throw new Error("毛邊應 directionScatter");
    const hand = FULL.map((p) => p[0] === "release" ? ["release", "handRelease"] : p);
    if (E2.profileOf(build(hand, ["releaseZero", "rangeScale"])) !== "speedDrift") throw new Error("手放應 speedDrift");
    const eye = FULL.map((p) => p[0] === "rangeBed" ? ["rangeBed", "eyeBoard"] : p);
    if (E2.profileOf(build(eye, ["releaseZero", "rangeScale"])) !== "coarseRead") throw new Error("目測板應 coarseRead(支配序最高)");
    /* 裝配順序自由:兩種順序→同 profile 同 fixture 讀值 */
    const rev = [...FULL].reverse();
    const sA = build(FULL, ["releaseZero", "rangeScale"]), sB = build(rev, ["releaseZero", "rangeScale"]);
    const runAll = (st) => { let r = E2.beginSeries(st, "copper"); st = r.state; for (const H of [4, 9, 16]) { st = E2.runHeight(st, H).state; } st = E2.predict(st, 5).state; return E2.runHeight(st, 25).state; };
    const ra = runAll(sA).series[0], rb = runAll(sB).series[0];
    if (JSON.stringify(ra.readings) !== JSON.stringify(rb.readings) || ra.profile !== rb.profile)
      throw new Error("裝配順序影響了讀值/профile");
    /* 校準重置:換 release 只重置 releaseZero */
    let sc = build(FULL, ["releaseZero", "rangeScale"]);
    sc = E2.replacePart(sc, "release", "handRelease").state;
    if (sc.calib.releaseZero !== false || sc.calib.rangeScale !== true) throw new Error("換件重置範圍錯");
    /* no-op 校準不耗天 */
    let sd = build(FULL, ["releaseZero"]);
    const days0 = sd.days;
    if (E2.calibrate(sd, "releaseZero").noop !== true || E2.calibrate(sd, "releaseZero").state.days !== days0)
      throw new Error("重複校準應 no-op 零天");
    /* open series 期間 replace 拒絕;放棄後可換且舊紀錄留 abandoned */
    let se = build(FULL, ["releaseZero", "rangeScale"]);
    se = E2.beginSeries(se, "copper").state;
    if (E2.replacePart(se, "edge", "roughEdge").error !== "series-open") throw new Error("開放 series 未擋換件");
    se = E2.abandonSeries(se).state;
    if (se.series[0].status !== "abandoned") throw new Error("放棄未記錄");
    if (E2.replacePart(se, "edge", "roughEdge").error) throw new Error("放棄後應可換件");
    /* 未知件/錯槽:state 深等不變 */
    const before = JSON.stringify(s0);
    if (!E2.place(s0, "release", "noSuchPart").error || !E2.place(s0, "edge", "latchRelease").error)
      throw new Error("非法 place 未拒絕");
    if (JSON.stringify(s0) !== before) throw new Error("拒絕後 state 被污染");
  }
});

tests.push({
  name: "第二章 M2a|engine2:fixture 判定+12.0/12.5 邊界+換球守衛+黃金路徑 10 天(R-LAB2)",
  fn: () => {
    const E2 = require("../src/engine2.js");
    const FULL = [["launcher", "shortGroove"], ["release", "latchRelease"], ["edge", "polishedEdge"], ["rangeBed", "rakedSand"], ["heightRig", "liftSandbed"]];
    const build = () => {
      let s = E2.initialState();
      for (const [slot, part] of FULL) s = E2.place(s, slot, part).state;
      s = E2.calibrate(s, "releaseZero").state;
      s = E2.calibrate(s, "rangeScale").state;
      return s;
    };
    const runSeries = (s, ball, pred) => {
      s = E2.beginSeries(s, ball).state;
      for (const H of [4, 9, 16]) s = E2.runHeight(s, H).state;
      s = E2.predict(s, pred).state;
      return E2.runHeight(s, 25).state;
    };
    /* clean 三輪全過+cycle 輪替+F2 law(銅) */
    let s = build();
    s = runSeries(s, "copper", 5.0);
    if (!s.series[0].accepted || s.series[0].cycle !== 0) throw new Error("clean cycle1 應過");
    if (!s.evidence.f2.law) throw new Error("F2 law 未點亮");
    s = runSeries(s, "copper", 5.0); s = runSeries(s, "copper", 5.0);
    if (!(s.series[1].accepted && s.series[2].accepted)) throw new Error("clean cycle2/3 應過");
    if (s.series.map((x) => x.cycle).join(",") !== "0,1,2") throw new Error("cycle 未輪替");
    /* 黃金路徑天數:2 校準+銅 4 放=6;加木球 4 放=10 */
    if (s.series[0].dayEnded !== 6) throw new Error("銅球首輪應第 6 天收,得 " + s.series[0].dayEnded);
    s = runSeries(s, "wood", 5.0);
    if (s.days !== 2 + 4 * 4) throw new Error("四輪後總天數錯:" + s.days);
    /* 換球守衛正例 */
    const cmp = E2.compareBalls(s, 1, 4);
    if (!cmp.ok || !cmp.state.evidence.f2.ball) throw new Error("換球正例未過:" + JSON.stringify(cmp.diffs));
    /* 換球負例:不同 edge 指紋 */
    let bad = E2.replacePart(cmp.state, "edge", "roughEdge").state;
    bad = E2.calibrate(bad, "rangeScale").noop ? bad : bad; /* rangeScale 未失效 */
    bad = runSeries(bad, "wood", 5.5);
    const cmp2 = E2.compareBalls(bad, 1, bad.series.length);
    if (cmp2.ok || !cmp2.diffs.some((d) => d.includes("指紋"))) throw new Error("指紋守衛未擋");
    /* 故障 profile 全不過 */
    let sh = E2.initialState();
    for (const [slot, part] of FULL) sh = E2.place(sh, slot, part === "latchRelease" ? "handRelease" : part).state;
    sh = E2.calibrate(sh, "releaseZero").state; sh = E2.calibrate(sh, "rangeScale").state;
    sh = runSeries(sh, "copper", 5.85);
    if (sh.series[0].accepted) throw new Error("speedDrift 竟通過(押中 25 也不該過形狀門)");
    /* coarseRead:區間讀值→拒絕 */
    let sc2 = E2.initialState();
    for (const [slot, part] of FULL) sc2 = E2.place(sc2, slot, part === "rakedSand" ? "eyeBoard" : part).state;
    sc2 = E2.calibrate(sc2, "releaseZero").state; sc2 = E2.calibrate(sc2, "rangeScale").state;
    sc2 = runSeries(sc2, "copper", 5.0);
    if (sc2.series[0].accepted || sc2.series[0].rejectReason !== "non-scalar") throw new Error("區間值未被拒");
    /* 12.0 含等號過/12.5 必不過(合成:二分從兩側夾邊界,kHat 連動故不可線性造值) */
    const mk = (e) => ({ 4: 2 * (1 + e), 9: 3, 16: 4, 25: 5 });
    const bisect = (target) => { /* 回傳 [lo,hi]:shape(lo)<=target<shape(hi) */
      let lo = 0, hi = 0.8;
      for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; (E2._judgeRaw(mk(m), 5).shapeError <= target) ? lo = m : hi = m; }
      return [lo, hi];
    };
    const [lo120] = bisect(0.12);
    const jPass = E2._judgeRaw(mk(lo120), 5);
    if (!(jPass.shapeError <= 0.12 && jPass.accepted)) throw new Error("貼齊 12.0% 應通過,得 " + jPass.shapeError);
    const [, hi125] = bisect(0.125);
    const jFail = E2._judgeRaw(mk(hi125), 5);
    if (!(jFail.shapeError > 0.125 - 1e-9) || jFail.accepted) throw new Error("越過 12.5% 應不過,得 " + jFail.shapeError);
    /* 順序守衛:跳測 16 拒絕不耗天;25 前必先預測 */
    let so = build(); so = E2.beginSeries(so, "copper").state;
    const d0 = so.days;
    if (E2.runHeight(so, 16).error !== "wrong-order" || so.days !== d0) throw new Error("H 順序守衛失效");
    so = E2.runHeight(so, 4).state; so = E2.runHeight(so, 9).state; so = E2.runHeight(so, 16).state;
    if (E2.runHeight(so, 25).error !== "prediction-required") throw new Error("未預測可跑 25");
  }
});

let pass = 0, fail = 0;
for (const t of tests) {
  try {
    await t.fn();
    pass++;
    console.log("  ✓ " + t.name);
  } catch (e) {
    fail++;
    console.error("  ✗ " + t.name + "\n    " + e.message);
  }
}
console.log(`\n${pass} 通過,${fail} 失敗(共 ${tests.length})`);
process.exit(fail ? 1 : 0);
