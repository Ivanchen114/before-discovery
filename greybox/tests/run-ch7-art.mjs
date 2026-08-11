import { createRequire } from "node:module";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(here, "../..");
const publicRoot = path.join(repoRoot, "public/assets");
const assets = require("../data/assets.js");
const canonical = JSON.parse(readFileSync(path.join(here, "../data/assets.json"), "utf8"));
const scenes = JSON.parse(readFileSync(path.join(here, "../data/scenes7.json"), "utf8"));

function fail(message) {
  console.error("  ✗ 第七章正式美術交接|" + message);
  process.exitCode = 1;
  throw new Error(message);
}
function requireAsset(entries, id, expected = {}) {
  const entry = entries.get(id);
  if (!entry) fail("資產未登錄:" + id);
  for (const [key, value] of Object.entries(expected))
    if (entry[key] !== value) fail(`資產宣告錯誤:${id}.${key}`);
  if (!entry.path) fail("資產沒有 runtime path:" + id);
  const runtime = path.join(publicRoot, entry.path);
  if (!existsSync(runtime)) fail("runtime 檔案不存在:" + id);
  if (statSync(runtime).size > 2 * 1024 * 1024) fail("單檔超過 2 MB:" + id);
  if (entry.path.endsWith(".webp")) {
    const head = readFileSync(runtime).subarray(0, 12);
    if (head.toString("ascii", 0, 4) !== "RIFF" || head.toString("ascii", 8, 12) !== "WEBP")
      fail("WebP 檔頭錯誤:" + id);
  }
  if (entry.sourceMaster && !existsSync(path.join(repoRoot, entry.sourceMaster)))
    fail("母版不存在:" + id);
  return { entry, runtime };
}

if (JSON.stringify(assets) !== JSON.stringify(canonical))
  fail("assets.js 與 assets.json 漂移");
const entries = new Map(assets.entries.map((entry) => [entry.id, entry]));

const backgrounds = {
  "ch7:EM7-0": "bg_ch07_bologna_rain_arrival",
  "ch7:EM7-1": "bg_ch07_galvani_anatomy_study_day",
  "ch7:EM7-2": "bg_ch07_galvani_matrix_table",
  "ch7:EM7-3": "bg_ch07_volta_pavia_lab",
  "ch7:EM7-4": "bg_ch07_galvani_return_evening",
  "ch7:EM7-E": "bg_ch07_aldini_study_1800_dawn",
  "ch7:SC7-R1": "bg_ch07_galvani_matrix_table"
};
for (const [scene, id] of Object.entries(backgrounds)) {
  if (assets.sceneBg?.[scene] !== id) fail("背景映射錯誤:" + scene);
  requireAsset(entries, id, { kind: "bg", w: 1672, h: 941 });
}

const portraits = {
  Galvani: ["dialogue_galvani61", "ch07/characters/ch07_portrait_galvani_v02.webp", "right", 1368, 1149],
  Volta: ["dialogue_volta53", "ch07/characters/ch07_portrait_volta_v02.webp", "left", 1316, 1195],
  Aldini: ["dialogue_aldini38", "ch07/characters/ch07_portrait_aldini_v02.webp", "right", 1402, 1122]
};
for (const [speaker, [id, assetPath, side, width, height]] of Object.entries(portraits)) {
  const { runtime } = requireAsset(entries, id, { kind: "portrait", path: assetPath, w: width, h: height });
  if (!readFileSync(runtime).includes(Buffer.from("ALPH"))) fail("角色 WebP 缺透明 alpha:" + id);
  if (assets.speakerDialoguePortrait?.[speaker] !== id) fail("對話肖像未接上:" + speaker);
  if (assets.speakerSide?.[speaker] !== side) fail("對話肖像站位錯誤:" + speaker);
}
if (assets.speakerDialoguePortrait?.["Volta（小冊）"] !== "dialogue_volta53")
  fail("Volta 小冊聲部沒有沿用人物肖像");

const focusChecks = [
  ["EM7-1", "銅鉤擺過去，碰上鐵欄", "ch07_focus_frog_witness_v01", "relationship"],
  ["EM7-2", "書商捎來一冊帕維亞印的小冊子", "ch07_focus_four_papers_matrix_v01", "reading"],
  ["EM7-3", "Volta 取出一座小裝置", "ch07_focus_volta_electrometer_v01", "relationship"],
  ["EM7-E", "把一份傳抄的圖說攤開在矩陣旁", "ch07_focus_volta_pile_v01", "relationship"],
  ["EM7-E", "六格第一次睡在同一張紙上", "ch07_focus_six_papers_board_v01", "reading"],
  ["EM7-E", "摺成一封信的形狀", "ch07_focus_empty_recipient_letter_v01", "relationship"]
];
for (const [scene, match, id, role] of focusChecks) {
  const entry = requireAsset(entries, id, { kind: "cg", w: 1672, h: 941 }).entry;
  const rule = assets.lineFocusVisual?.find((item) => item.scene === scene && item.match === match);
  if (rule?.items?.[0]?.asset !== id || !rule.items[0].alt || !rule.caption)
    fail("焦點鏡頭沒有完整接上:" + id);
  if (entry.shotRole && entry.shotRole !== role) fail("焦點鏡頭角色宣告錯誤:" + id);
}
for (const [scene, node, match] of [
  ["EM7-3", "e_electrometer", "Volta 取出一座小裝置"],
  ["EM7-E", "e_pile", "把一份傳抄的圖說攤開在矩陣旁"]
]) {
  if (!assets.viewFocusVisual?.some((item) => item.scene === scene && item.match === match && item.nodeIds?.includes(node)))
    fail("工作台操作前焦點圖沒有保持:" + node);
}

for (const code of Object.keys(scenes.evidenceNames)) {
  const { entry } = requireAsset(entries, "card_" + code, { kind: "card", w: 1586, h: 991 });
  if (!entry.path.endsWith(".webp") || entry.path.endsWith(".svg"))
    fail("第七章證據不是完整 raster:" + code);
  if (entry.renderPolicy !== "complete-raster-no-visible-overlay")
    fail("第七章證據缺零疊層政策:" + code);
  const visual = assets.evidenceVisual?.[code];
  if (visual?.items?.[0]?.asset !== "card_" + code || !visual.items[0].alt ||
      !visual.caption || !visual.readerTitle || !visual.accessibleText?.length)
    fail("證據圖或可存取文字未完整接上:" + code);
  if (!assets.evidenceSummary?.[code]) fail("證據摘要缺失:" + code);
}

if (assets.chapterThumbnail?.ch07 !== "chapter_thumbnail_ch07")
  fail("第七章章節縮圖未接上");
requireAsset(entries, "chapter_thumbnail_ch07", { kind: "cg" });
for (const scene of ["EM7-0", "EM7-E"])
  if (assets.sceneFx?.[scene]?.fx !== "montage" || !assets.sceneFx[scene].steps?.length)
    fail("章際蒙太奇未接上:" + scene);

const audioCues = {
  ch7Bologna: "ch07/Ch7_Bologna_Rain_And_Brass.mp3",
  ch7Matrix: "ch07/Ch7_Four_Papers_Question.mp3",
  ch7Pavia: "ch07/Ch7_Pavia_Needle.mp3",
  ch7Letter: "ch07/Ch7_Letter_Without_Recipient.mp3"
};
let audioBytes = 0;
for (const [cue, clip] of Object.entries(audioCues)) {
  const spec = assets.bgmFiles?.[cue];
  if (spec?.clips?.[0] !== clip || spec.mode !== "once") fail("第七章聲音 cue 漂移:" + cue);
  const file = path.join(publicRoot, "audio", clip);
  if (!existsSync(file)) fail("第七章聲音檔不存在:" + clip);
  const head = readFileSync(file).subarray(0, 3);
  if (head.toString("ascii") !== "ID3")
    fail("第七章聲音檔不是帶 ID3 的 MP3:" + clip);
  audioBytes += statSync(file).size;
}
if (audioBytes > 7 * 1024 * 1024) fail("第七章聲音超過 7 MB 預算");
for (const [scene, cue] of Object.entries({
  "ch7:EM7-0": "ch7Bologna", "ch7:EM7-1": "ch7Bologna",
  "ch7:EM7-2": "ch7Matrix", "ch7:EM7-3": "ch7Pavia",
  "ch7:EM7-4": "ch7Matrix", "ch7:EM7-E": "ch7Letter",
  "ch7:SC7-R1": "silence"
})) if (assets.sceneBgm?.[scene] !== cue) fail("第七章場景聲音映射錯誤:" + scene);

let totalBytes = 0;
const runtimePaths = new Set();
for (const entry of assets.entries) {
  if (!(entry.path || "").startsWith("ch07/")) continue;
  const runtime = path.join(publicRoot, entry.path);
  if (existsSync(runtime) && !runtimePaths.has(runtime)) {
    runtimePaths.add(runtime);
    totalBytes += statSync(runtime).size;
  }
}
if (runtimePaths.size !== 22) fail("第七章 runtime 圖片數應為 22，實際 " + runtimePaths.size);
if (totalBytes > 6 * 1024 * 1024) fail("第七章 runtime 圖片超過 6 MB 預算");

console.log(`  ✓ 第七章正式美術交接（22 圖、7 張完整 raster 證據、${(totalBytes / 1024 / 1024).toFixed(2)} MB）`);
