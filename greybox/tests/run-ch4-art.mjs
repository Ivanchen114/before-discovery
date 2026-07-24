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
  "D0-1": "bg_ch04_woolsthorpe_orchard_1665",
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
  dialogue_newton22: "ch04/characters/ch04_char_newton22_v02.webp",
  dialogue_newton41: "ch04/characters/ch04_char_newton41_v02.webp",
  dialogue_halley28: "ch04/characters/ch04_char_halley28_v02.webp"
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

for (const code of ["K1", "K2", "K3", "K4", "K5"]) {
  const id = "card_" + code;
  const entry = entries.get(id);
  const visual = assets.evidenceVisual?.[code];
  if (!entry?.path || entry.w !== 1200 || entry.h !== 750)
    fail("第四章證據圖宣告錯誤:" + id);
  if (!assets.evidenceSummary?.[code])
    fail("第四章證據摘要缺漏:" + code);
  if (visual?.items?.[0]?.asset !== id || !visual.caption)
    fail("第四章旅人筆記視覺未接上:" + code);
  const file = path.join(here, "../../public/assets", entry.path);
  if (!existsSync(file)) fail("第四章證據圖檔案不存在:" + entry.path);
  const svg = readFileSync(file, "utf-8");
  if (!svg.includes('role="img"') || !svg.includes("<title") || !svg.includes("<desc"))
    fail("第四章證據圖缺可及性文字:" + id);
}

const stageHtml = readFileSync(path.join(here, "../stage.html"), "utf-8");
if (!/body\[data-view="orbit"\] #panelWrap\s*\{\s*display:\s*block/.test(stageHtml))
  fail("第四章工作台仍可能被全域 display:none 隱藏");
if (!stageHtml.includes('body[data-view="orbit"] #dialogue'))
  fail("第四章工作台未關閉殘留對話框");

const chapterUi = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
for (const fragment of [
  "先把預測封存，觀測才翻面",
  "同一批天空，兩個模型都必須跑完",
  '[["K1","改向"],["K2","跨尺度"],["K3","封存預測"],["K4","模型反驗"],["K5","署名邊界"]]'
])
  if (!chapterUi.includes(fragment)) fail("第四章動態證據視覺缺漏:" + fragment);

const chapter4Transition = assets.sceneFx?.["D0-1"];
if (!chapter4Transition || chapter4Transition.fx !== "montage" || chapter4Transition.steps?.length !== 3)
  fail("第四章章首缺 1642→1655→1665 三拍穿越");
for (const id of [
  "ch04_transition_1642_question_opens_v01",
  "ch04_transition_1655_paper_passage_v01",
  "ch04_transition_1665_woolsthorpe_arrival_v01"
]) {
  const entry = entries.get(id);
  if (!entry?.path || entry.w !== 1672 || entry.h !== 941)
    fail("第四章穿越板宣告錯誤:" + id);
  if (!existsSync(path.join(here, "../../public/assets", entry.path)))
    fail("第四章穿越板檔案不存在:" + id);
}
if (chapter4Transition.steps[2]?.plate !== "ch04_transition_1665_woolsthorpe_arrival_v01")
  fail("第四章穿越最後一拍沒有落地 Woolsthorpe");

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

const expectedSceneBgm = {
  "D0-1": "ch4Orchard",
  "D0-2": "ch4Orchard",
  "D1-1": "ch4Orbit",
  "D1-2": "ch4Orbit",
  "D1-3": "ch4Orbit",
  "D2-1": "ch4Hooke",
  "D2-2": "ch4Hooke",
  "D2-3": "ch4Predictions",
  "D3-1": "ch4Press",
  "D3-2": "ch4Greenwich",
  "D3-3": "ch4Press",
  "D3-4": "ch4Press",
  "DE-1": "ch4Principia",
  "DE-2": "ch4Principia"
};
for (const [scene, cue] of Object.entries(expectedSceneBgm))
  if (assets.sceneBgm?.[scene] !== cue) fail("第四章場景音樂映射錯誤:" + scene);

const expectedBgmFiles = {
  ch4Orchard: ["ch04/Ch4_Orchard_Question.mp3"],
  ch4Orbit: [
    "ch04/Ch4_Orbit_Workbench_A.mp3",
    "ch04/Ch4_Orbit_Workbench_B.mp3",
    "ch04/Ch4_Orbit_Workbench_C.mp3"
  ],
  ch4Hooke: ["ch04/Ch4_Hooke_Letter_1679.mp3"],
  ch4Predictions: ["ch04/Ch4_Sealed_Predictions.mp3"],
  ch4Greenwich: ["ch04/Ch4_Greenwich_Comet.mp3"],
  ch4Press: [
    "ch04/Ch4_Press_Window_A.mp3",
    "ch04/Ch4_Press_Window_B.mp3",
    "ch04/Ch4_Press_Window_C.mp3"
  ],
  ch4Principia: ["ch04/Ch4_Principia_1687.mp3"]
};
let chapter4MusicBytes = 0;
for (const [cue, clips] of Object.entries(expectedBgmFiles)) {
  const spec = assets.bgmFiles?.[cue];
  const expectedMode = clips.length === 3 ? "milestone" : "once";
  if (spec?.mode !== expectedMode) fail("第四章音樂播放模式錯誤:" + cue);
  if (spec?.repeatGapMs !== 5000) fail("第四章音樂重播間隔錯誤:" + cue);
  if (JSON.stringify(spec?.clips) !== JSON.stringify(clips)) fail("第四章音樂清單錯誤:" + cue);
  for (const clip of clips) {
    const file = path.join(here, "../../public/assets/audio", clip);
    if (!existsSync(file)) fail("runtime 音樂接到不存在檔案:" + cue + " → " + clip);
    const bytes = statSync(file).size;
    if (bytes < 100 * 1024) fail("第四章音樂檔案異常過小:" + clip);
    if (bytes > 3 * 1024 * 1024) fail("第四章音樂超過單檔 3 MB 預算:" + clip);
    const header = readFileSync(file).subarray(0, 3);
    const isMp3 = header.toString("ascii") === "ID3" || (header[0] === 0xff && (header[1] & 0xe0) === 0xe0);
    if (!isMp3) fail("第四章音樂不是可辨識的 MP3:" + clip);
    chapter4MusicBytes += bytes;
  }
}
if (chapter4MusicBytes > 10 * 1024 * 1024) fail("第四章音樂超過全章 10 MB 預算");

const stageUi = readFileSync(path.join(here, "../src/stage-ui.js"), "utf-8");
for (const fragment of [
  'BGM.current() === "ch4Orbit"',
  'd.scene === "D1-2"',
  'd.scene === "D1-3"',
  'BGM.current() === "ch4Press"',
  'd.scene === "D3-3"',
  'd.scene === "D3-4"'
])
  if (!stageUi.includes(fragment)) fail("第四章三段式音樂缺里程碑切換:" + fragment);

console.log("  ✓ 第四章正式美術與音樂交接|14 場背景、3 張去邊肖像、5 張證據圖、11 首 BGM、可見工作台與零斷鏈");
