/* tests/run-node.mjs — `npm test` 進入點(零外部依賴)
   執行:共用套件全部測試 + R-DATA-05 鏡像一致性(需檔案系統,node 限定) */
import { createRequire } from "module";
import { readFileSync } from "fs";
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
