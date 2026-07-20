/* tests/run-node.mjs — `npm test` 進入點(零外部依賴)
   執行:共用套件全部測試 + R-DATA-05 鏡像一致性(需檔案系統,node 限定) */
import { createRequire } from "module";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));

const patterns = require("../data/patterns.js");
const debate = require("../data/debate.js");
const scenes = require("../data/scenes.js");
const Engine = require("../src/engine.js");
const Narrative = require("../src/narrative.js");
const buildSuite = require("./suite.js");
const buildNarrativeSuite = require("./narrative-suite.js");

const tests = buildSuite(Engine, patterns, debate).concat(buildNarrativeSuite(Narrative, scenes));

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
    /* 程序化 BGM:mood 值域受控+23 場景全覆蓋+場景驅動+總開關 */
    const BGM_MOODS = ["pisa", "study", "rain", "workshop", "hall", "dusk"];
    const bgm = assets.sceneBgm || {};
    scenes.scenes.forEach((s) => {
      if (!(s.id in bgm)) throw new Error("場景缺 BGM mood:" + s.id);
      if (!BGM_MOODS.includes(bgm[s.id])) throw new Error("未知 mood:" + s.id + "→" + bgm[s.id]);
    });
    for (const frag of ["sceneBgm", "BGM.refresh", 'play("storm")'])
      if (!sui.includes(frag)) throw new Error("BGM 要素缺失:" + frag);
    /* 真音樂檔:填了就必須存在;storm 恆 null(現代=合成器,1590=真曲,音色即穿越) */
    for (const [mood, f] of Object.entries(assets.bgmFiles || {})) {
      if (f === null) continue;
      try { readFileSync(path.join(here, "..", assets.audioBasePath, f)); }
      catch (e) { throw new Error("bgmFiles 檔案不存在:" + mood + "→" + f); }
    }
    if ((assets.bgmFiles || {}).storm !== null) throw new Error("storm 應維持合成(null)");
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
