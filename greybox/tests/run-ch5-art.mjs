import { createRequire } from "node:module";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const assets = require("../data/assets.js");
const canonical = JSON.parse(readFileSync(path.join(here, "../data/assets.json"), "utf-8"));
const publicRoot = path.join(here, "../../public/assets");
const repoRoot = path.join(here, "../..");

function fail(message) {
  console.error("  ✗ 第五章正式美術交接|" + message);
  process.exitCode = 1;
  throw new Error(message);
}

function requireAsset(entries, id, expected) {
  const entry = entries.get(id);
  if (!entry) fail("資產未登錄:" + id);
  for (const [key, value] of Object.entries(expected))
    if (entry[key] !== value) fail("資產宣告錯誤:" + id + "." + key);
  const runtime = path.join(publicRoot, entry.path || "");
  if (!entry.path || !existsSync(runtime)) fail("runtime 檔案不存在:" + id);
  if (statSync(runtime).size > 2 * 1024 * 1024) fail("單檔超過 2 MB:" + id);
  if (entry.sourceMaster && !existsSync(path.join(repoRoot, entry.sourceMaster)))
    fail("母版不存在:" + id);
  return { entry, runtime };
}

if (JSON.stringify(assets) !== JSON.stringify(canonical))
  fail("assets.js 與 assets.json 漂移");

const entries = new Map(assets.entries.map((entry) => [entry.id, entry]));
const backgrounds = {
  "ch5:E0-1": "bg_ch05_cirey_library_day",
  "ch5:E0-2": "bg_ch05_cirey_library_day",
  "ch5:E1-1": "bg_ch05_cirey_library_day",
  "ch5:E1-2": "bg_ch05_cirey_library_day",
  "ch5:E2-1": "bg_ch05_cirey_library_day",
  "ch5:E2-2": "bg_ch05_cirey_library_day",
  "ch5:E2-3": "bg_ch05_cirey_library_day",
  "ch5:E3-1": "bg_ch05_cirey_debate_evening",
  "ch5:E3-2": "bg_ch05_cirey_debate_evening",
  "ch5:EE-1": "bg_ch05_cirey_epilogue_night",
  "ch5:EE-2": "bg_ch05_cirey_epilogue_night"
};
for (const [scene, id] of Object.entries(backgrounds)) {
  if (assets.sceneBg?.[scene] !== id) fail("背景映射錯誤:" + scene);
  requireAsset(entries, id, { kind: "bg", w: 1920, h: 1080 });
}

const portraits = {
  dialogue_du_chatelet34: "ch05/characters/ch05_char_du_chatelet34_v01.webp",
  dialogue_dupre58: "ch05/characters/ch05_char_dupre58_v01.webp"
};
for (const [id, assetPath] of Object.entries(portraits))
  requireAsset(entries, id, { kind: "portrait", path: assetPath, w: 900, h: 1200 });
if (assets.speakerDialoguePortrait?.["杜夏特萊"] !== "dialogue_du_chatelet34")
  fail("杜夏特萊對話肖像未接上");
if (assets.speakerDialoguePortrait?.["杜佩院士"] !== "dialogue_dupre58")
  fail("杜佩院士對話肖像未接上");
if (assets.speakerSide?.["杜夏特萊"] !== "right" || assets.speakerSide?.["杜佩院士"] !== "left")
  fail("第五章雙槽站位未鎖定");

const transitionIds = [
  "ch05_transition_1687_collision_question_v01",
  "ch05_transition_1687_1740_pagefold_v01",
  "ch05_transition_1740_cirey_arrival_v01"
];
for (const id of transitionIds)
  requireAsset(entries, id, { kind: "bg", w: 1672, h: 941 });
const montage = assets.sceneFx?.["E0-1"];
if (montage?.fx !== "montage" || montage.steps?.length !== 3)
  fail("章首缺 1687→1740 三拍穿越");
if (JSON.stringify(montage.steps.map((step) => step.plate)) !== JSON.stringify(transitionIds))
  fail("章首穿越板順序錯誤");

const expectedEvidencePaths = {
  S6: "ch05/evidence/ch05_card_S6_quantity_of_motion_treatise_v01.webp",
  S7: "ch05/evidence/ch05_card_S7_clay_report_v01.webp",
  J1: "ch05/evidence/ch05_card_J1_signed_momentum_ledger_v02.webp",
  J2: "ch05/evidence/ch05_card_J2_vis_viva_ledger_v02.webp",
  J3: "ch05/evidence/ch05_card_J3_clay_depth_v01.webp",
  J4: "ch05/evidence/ch05_card_J4_two_ledgers_v02.webp"
};
for (const [code, assetPath] of Object.entries(expectedEvidencePaths)) {
  const { runtime } = requireAsset(entries, "card_" + code, {
    kind: "card",
    path: assetPath,
    w: 1200,
    h: 750
  });
  if (statSync(runtime).size > 512 * 1024) fail("證據圖超過 512 KB:" + code);
  if (!assets.evidenceSummary?.[code]) fail("證據摘要缺漏:" + code);
  const visual = assets.evidenceVisual?.[code];
  if (visual?.items?.[0]?.asset !== "card_" + code || !visual.caption || !visual.items[0].alt)
    fail("證據圖、說明或替代文字未接上:" + code);
}
if (entries.get("card_J1")?.path.includes("_v01.") ||
    entries.get("card_J2")?.path.includes("_v01.") ||
    entries.get("card_J4")?.path.includes("_v01."))
  fail("J1／J2／J4 又接回含假數據或偽手寫的 v01");
if (!assets.evidenceVisual.J1.items[0].alt.includes("數值帳格留白"))
  fail("J1 替代文字沒有交代數字由工作台提供");
if (!assets.evidenceVisual.J2.items[0].alt.includes("尚未對平"))
  fail("J2 替代文字沒有保留去向邊界");
if (!assets.evidenceVisual.J4.items[0].alt.includes("帳格留白") ||
    !assets.evidenceVisual.J4.items[0].alt.includes("工作台紀錄"))
  fail("J4 替代文字沒有交代圖面留白與數字來源");

const workbenchVisuals = {
  momentum: "ch05_lab_collision_rig",
  "vis-viva": "ch05_lab_collision_rig",
  followup: "ch05_focus_unequal_putty_question",
  clay: "ch05_lab_clay_depth_rig",
  complete: "ch05_lab_clay_depth_rig"
};
if (JSON.stringify(assets.collision5Visual) !== JSON.stringify(workbenchVisuals))
  fail("第五章工作台相位圖映射漂移");
for (const id of new Set(Object.values(workbenchVisuals)))
  requireAsset(entries, id, { kind: "prop", w: 1200, h: 750 });

const ui = readFileSync(path.join(repoRoot, "greybox/src/chapter-ui.js"), "utf-8");
for (const fragment of ["ASSETS.collision5Visual", "這一輪要回答",
  "取得條件：鋼頭、油灰頭各勾三筆同速紀錄",
  "這回換個問法。不問撞完剩下多少",
  "院士的動量帳，鋼頭與油灰兩種碰法都能對平嗎",
  "同一批紀錄換算 mv²，兩種碰法還會一起對平嗎",
  "油灰碰撞的短少，真的總是固定一半嗎",
  "黏土坑深能不能替可見運動的短少提供一把可量的尺"])
  if (!ui.includes(fragment)) fail("第五章工作台 UI 契約缺失:" + fragment);
if (ui.includes('"兩本帳：J1"') || ui.includes('" J2" + (j5.j2'))
  fail("第五章 HUD 又露出內部斷言代碼");
if (ui.includes('ship3El("h2", "動量帳 → 活力帳 → 黏土 → 對帳"'))
  fail("第五章工作台標題又提前洩露後續路線");

requireAsset(entries, "chapter_thumbnail_ch05", {
  kind: "cg",
  path: "ch05/backgrounds/ch05_bg_cirey_library_day_v01.webp",
  w: 1920,
  h: 1080
});
if (assets.chapterThumbnail?.ch05 !== "chapter_thumbnail_ch05")
  fail("第五章章節縮圖未接上");

const handoffPath = path.join(repoRoot, "art/source/production/ch05/PROMPTS_RUNTIME_ART_20260727.md");
if (!existsSync(handoffPath)) fail("缺正式美術提示詞與採用紀錄");
const handoff = readFileSync(handoffPath, "utf-8");
for (const guard of ["合理重建", "J1、J2、J4 v01 退役", "不宣稱精確復原",
  "不畫熱或完整去向", "ch05_lab_collision_rig", "ch05_lab_clay_depth_rig",
  "ch05_focus_unequal_putty_question"])
  if (!handoff.includes(guard)) fail("美術交接缺邊界:" + guard);

const promptPath = path.join(repoRoot, "public/assets/audio/ch05/PROMPTS_BGM_CH5_GEMINI_20260804.md");
if (!existsSync(promptPath)) fail("缺第五章音樂提示詞與生成紀錄");
const prompts = readFileSync(promptPath, "utf-8");
const expectedSceneBgm = {
  "ch5:E0-1": "ch5Cirey",
  "ch5:E0-2": "ch5Dupre",
  "ch5:E1-1": "ch5Dupre",
  "ch5:E1-2": "ch5Collision",
  "ch5:E2-1": "ch5Collision",
  "ch5:E2-2": "ch5Collision",
  "ch5:E2-3": "ch5Clay",
  "ch5:E3-1": "ch5Debate",
  "ch5:E3-2": "ch5Debate",
  "ch5:EE-1": "ch5Emilie",
  "ch5:EE-2": "ch5Emilie",
  "ch5:SC5-R1": "silence"
};
for (const [scene, cue] of Object.entries(expectedSceneBgm))
  if (assets.sceneBgm?.[scene] !== cue) fail("第五章場景音樂映射錯誤:" + scene);

const expectedBgmFiles = {
  ch5Cirey: ["ch05/Ch5_Cirey_Open_Book.mp3"],
  ch5Dupre: ["ch05/Ch5_Dupre_Ledger.mp3"],
  ch5Collision: [
    "ch05/Ch5_Collision_Workbench_A.mp3",
    "ch05/Ch5_Collision_Workbench_B.mp3",
    "ch05/Ch5_Collision_Workbench_C.mp3"
  ],
  ch5Clay: ["ch05/Ch5_Clay_Remembers.mp3"],
  ch5Debate: [
    "ch05/Ch5_Ledger_Debate_A.mp3",
    "ch05/Ch5_Ledger_Debate_B.mp3",
    "ch05/Ch5_Ledger_Debate_C.mp3"
  ],
  ch5Emilie: ["ch05/Ch5_Emilie_Night_Proof.mp3"]
};
let chapter5MusicBytes = 0;
for (const [cue, clips] of Object.entries(expectedBgmFiles)) {
  if (!prompts.includes("`" + cue + "`")) fail("音樂提示詞缺 runtime cue:" + cue);
  const spec = assets.bgmFiles?.[cue];
  const expectedMode = clips.length === 3 ? "milestone" : "once";
  if (spec?.mode !== expectedMode) fail("第五章音樂播放模式錯誤:" + cue);
  if (spec?.repeatGapMs !== 5000) fail("第五章音樂重播間隔錯誤:" + cue);
  if (JSON.stringify(spec?.clips) !== JSON.stringify(clips)) fail("第五章音樂清單錯誤:" + cue);
  for (const clip of clips) {
    if (!prompts.includes(path.basename(clip))) fail("音樂提示詞缺檔名:" + clip);
    const file = path.join(repoRoot, "public/assets/audio", clip);
    if (!existsSync(file)) fail("runtime 音樂接到不存在檔案:" + cue + " → " + clip);
    const bytes = statSync(file).size;
    if (bytes < 100 * 1024) fail("第五章音樂檔案異常過小:" + clip);
    if (bytes > 3 * 1024 * 1024) fail("第五章音樂超過單檔 3 MB 預算:" + clip);
    const header = readFileSync(file).subarray(0, 3);
    const isMp3 = header.toString("ascii") === "ID3" || (header[0] === 0xff && (header[1] & 0xe0) === 0xe0);
    if (!isMp3) fail("第五章音樂不是可辨識的 MP3:" + clip);
    chapter5MusicBytes += bytes;
  }
}
if (chapter5MusicBytes > 10 * 1024 * 1024) fail("第五章音樂超過全章 10 MB 預算");

const audioLedger = readFileSync(path.join(repoRoot, "public/assets/audio/README.md"), "utf-8");
for (const clips of Object.values(expectedBgmFiles))
  for (const clip of clips)
    if (!audioLedger.includes("`" + clip + "`")) fail("音樂授權索引缺檔案:" + clip);

const stageUi = readFileSync(path.join(repoRoot, "greybox/src/stage-ui.js"), "utf-8");
for (const fragment of [
  'BGM.current() === "ch5Collision"',
  'd.scene === "E2-2"',
  'BGM.current() === "ch5Debate"',
  'd.phase === "won" || n >= 2'
]) if (!stageUi.includes(fragment)) fail("第五章三段式音樂缺里程碑切換:" + fragment);

let totalBytes = 0;
for (const entry of assets.entries)
  if ((entry.path || "").startsWith("ch05/") && existsSync(path.join(publicRoot, entry.path)))
    totalBytes += statSync(path.join(publicRoot, entry.path)).size;
if (totalBytes > 8 * 1024 * 1024) fail("第五章 runtime 圖片超過全章 8 MB 預算");

console.log("  ✓ 第五章正式美術與音樂交接|10 首 BGM、碰撞台與辯論各三段里程碑");
