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
  J4: "ch05/evidence/ch05_card_J4_two_ledgers_v01.webp"
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
if (entries.get("card_J1")?.path.includes("_v01.") || entries.get("card_J2")?.path.includes("_v01."))
  fail("J1／J2 又接回含假數據的 v01");
if (!assets.evidenceVisual.J1.items[0].alt.includes("數值帳格留白"))
  fail("J1 替代文字沒有交代數字由工作台提供");
if (!assets.evidenceVisual.J2.items[0].alt.includes("尚未對平"))
  fail("J2 替代文字沒有保留去向邊界");

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
for (const guard of ["合理重建", "J1、J2 v01 退役", "不宣稱精確復原", "不畫熱或完整去向"])
  if (!handoff.includes(guard)) fail("美術交接缺邊界:" + guard);

let totalBytes = 0;
for (const entry of assets.entries)
  if ((entry.path || "").startsWith("ch05/") && existsSync(path.join(publicRoot, entry.path)))
    totalBytes += statSync(path.join(publicRoot, entry.path)).size;
if (totalBytes > 8 * 1024 * 1024) fail("第五章 runtime 圖片超過全章 8 MB 預算");

console.log("  ✓ 第五章正式美術交接");
