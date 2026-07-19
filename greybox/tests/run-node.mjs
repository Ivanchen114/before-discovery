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
  name: "R-END-02|histfacts.js ≡ histfacts.json",
  fn: () => {
    const hf = require("../data/histfacts.js");
    const json = JSON.parse(readFileSync(path.join(here, "../data/histfacts.json"), "utf-8"));
    if (JSON.stringify(hf) !== JSON.stringify(json)) throw new Error("histfacts 鏡像漂移");
  }
});
tests.push({
  name: "R-DATA-06|scenes.js ≡ scenes.json",
  fn: () => {
    const json = JSON.parse(readFileSync(path.join(here, "../data/scenes.json"), "utf-8"));
    if (JSON.stringify(scenes) !== JSON.stringify(json)) throw new Error("scenes 鏡像漂移");
  }
});

let pass = 0, fail = 0;
for (const t of tests) {
  try {
    t.fn();
    pass++;
    console.log("  ✓ " + t.name);
  } catch (e) {
    fail++;
    console.error("  ✗ " + t.name + "\n    " + e.message);
  }
}
console.log(`\n${pass} 通過,${fail} 失敗(共 ${tests.length})`);
process.exit(fail ? 1 : 0);
