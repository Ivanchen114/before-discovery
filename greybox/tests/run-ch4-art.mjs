import { createRequire } from "node:module";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const assets = require("../data/assets.js");
const json = JSON.parse(readFileSync(path.join(here, "../data/assets.json"), "utf-8"));

function fail(message) {
  console.error("  ✗ 第四章正式美術與音樂交接|" + message);
  process.exitCode = 1;
  throw new Error(message);
}

if (JSON.stringify(assets) !== JSON.stringify(json)) fail("assets.js 與 assets.json 漂移");

const entries = new Map(assets.entries.map((entry) => [entry.id, entry]));
const expectedBackgrounds = {
  "D0-1": "bg_ch03_print_room_1642",
  "D0-2": "bg_ch04_woolsthorpe_orchard_1665",
  "D1-1": "bg_ch04_woolsthorpe_study_1665",
  "D1-2": "bg_ch04_woolsthorpe_study_1665",
  "D1-3": "bg_ch04_woolsthorpe_study_1665",
  "D2-1": "bg_ch04_cambridge_hooke_letter_1679",
  "D2-2": "bg_ch04_cambridge_hooke_letter_1679",
  "D2-3": "bg_ch04_cambridge_halley_1684",
  "D3-1": "bg_ch04_cambridge_halley_1684",
  "D3-2": "bg_ch04_greenwich_observatory_1680s",
  "D3-3": "bg_ch04_london_printshop_1687",
  "D3-4": "bg_ch04_london_printshop_1687",
  "DE-1": "bg_ch04_london_printshop_1687",
  "DE-2": "bg_ch04_typecase_collision_epilogue"
};

for (const [scene, id] of Object.entries(expectedBackgrounds)) {
  if (assets.sceneBg[scene] !== id) fail("背景映射錯誤:" + scene);
  const entry = entries.get(id);
  if (!entry || !entry.path) fail("背景資產未登錄:" + id);
  const file = path.join(here, "../../public/assets", entry.path);
  if (!existsSync(file)) fail("背景檔案不存在:" + entry.path);
  if (statSync(file).size > 2 * 1024 * 1024) fail("背景超過單檔 2 MB 預算:" + entry.path);
}

const portraits = {
  dialogue_newton22: "ch04/characters/ch04_char_newton22_v01.webp",
  dialogue_newton41: "ch04/characters/ch04_char_newton41_v01.webp",
  dialogue_halley28: "ch04/characters/ch04_char_halley28_v01.webp"
};
for (const [id, assetPath] of Object.entries(portraits)) {
  const entry = entries.get(id);
  if (!entry || entry.path !== assetPath || entry.w !== 900 || entry.h !== 1200)
    fail("人物資產宣告錯誤:" + id);
  if (!existsSync(path.join(here, "../../public/assets", assetPath))) fail("人物檔案不存在:" + assetPath);
}

for (const scene of ["D0-2", "D1-1", "D1-2", "D1-3"])
  if (assets.sceneDialoguePortrait[scene]?.Newton !== "dialogue_newton22")
    fail("1665 場景未使用青年 Newton:" + scene);
for (const scene of ["D2-1", "D2-2", "D2-3", "D3-1", "D3-2", "D3-3", "D3-4", "DE-1"])
  if (assets.sceneDialoguePortrait[scene]?.Newton !== "dialogue_newton41")
    fail("1679–1687 場景未使用成熟 Newton:" + scene);
for (const scene of ["D2-3", "D3-1", "D3-3", "D3-4", "DE-1"])
  if (assets.sceneDialoguePortrait[scene]?.Halley !== "dialogue_halley28")
    fail("Halley 場景缺肖像:" + scene);

if (assets.speakerSide.Newton !== "right" || assets.speakerSide.Halley !== "left")
  fail("Newton／Halley 雙槽站位未鎖定");
if (assets.chapterThumbnail.ch04 !== "chapter_thumbnail_ch04")
  fail("第四章章節縮圖未接上");

const promptPath = path.join(here, "../../public/assets/audio/ch04/PROMPTS_BGM_CH4_GEMINI_20260723.md");
const prompts = readFileSync(promptPath, "utf-8");
const musicFiles = [
  "Ch4_Orchard_Question.mp3",
  "Ch4_Orbit_Workbench_A.mp3",
  "Ch4_Orbit_Workbench_B.mp3",
  "Ch4_Orbit_Workbench_C.mp3",
  "Ch4_Hooke_Letter_1679.mp3",
  "Ch4_Sealed_Predictions.mp3",
  "Ch4_Greenwich_Comet.mp3",
  "Ch4_Press_Window_A.mp3",
  "Ch4_Press_Window_B.mp3",
  "Ch4_Press_Window_C.mp3",
  "Ch4_Principia_1687.mp3"
];
for (const file of musicFiles) if (!prompts.includes(file)) fail("音樂提示詞缺檔名:" + file);
for (const cue of ["ch4Orchard", "ch4Orbit", "ch4Hooke", "ch4Predictions", "ch4Greenwich", "ch4Press", "ch4Principia"])
  if (!prompts.includes(cue)) fail("音樂提示詞缺 runtime 對應:" + cue);
for (const line of prompts.split("\n"))
  if (line.startsWith(">") && /(沿用上一首|同上)/.test(line))
    fail("獨立生成提示詞仍依賴跨首上下文");

for (const [cue, spec] of Object.entries(assets.bgmFiles || {})) {
  if (!spec || !Array.isArray(spec.clips)) continue;
  for (const clip of spec.clips) {
    const file = path.join(here, "../../public/assets/audio", clip);
    if (!existsSync(file)) fail("runtime 音樂接到不存在檔案:" + cue + " → " + clip);
  }
}

console.log("  ✓ 第四章正式美術與音樂交接|14 場背景、兩齡 Newton、Halley、11 首獨立提示詞與零斷鏈");
