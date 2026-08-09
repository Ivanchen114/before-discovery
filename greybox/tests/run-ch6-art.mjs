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
  console.error("  ✗ 第六章正式美術交接|" + message);
  process.exitCode = 1;
  throw new Error(message);
}

function svgVisibleText(source) {
  return [...source.matchAll(/<(?:title|text)\b[^>]*>([\s\S]*?)<\/(?:title|text)>/g)]
    .map((match) => match[1].replace(/<[^>]+>/g, " "))
    .join(" ");
}

function requireAsset(entries, id, expected) {
  const entry = entries.get(id);
  if (!entry) fail("資產未登錄:" + id);
  for (const [key, value] of Object.entries(expected))
    if (entry[key] !== value) fail("資產宣告錯誤:" + id + "." + key);
  const runtime = path.join(publicRoot, entry.path || "");
  if (!entry.path || !existsSync(runtime)) fail("runtime 檔案不存在:" + id);
  if (statSync(runtime).size > 2 * 1024 * 1024) fail("單檔超過 2 MB:" + id);
  if (entry.path.endsWith(".webp")) {
    const head = readFileSync(runtime).subarray(0, 12);
    if (head.toString("ascii", 0, 4) !== "RIFF" || head.toString("ascii", 8, 12) !== "WEBP")
      fail("WebP 檔頭錯誤:" + id);
  }
  if (entry.path.endsWith(".svg") && !readFileSync(runtime, "utf-8").includes("<svg"))
    fail("SVG 檔頭錯誤:" + id);
  if (entry.sourceMaster && !existsSync(path.join(repoRoot, entry.sourceMaster)))
    fail("母版不存在:" + id);
  return { entry, runtime };
}

if (JSON.stringify(assets) !== JSON.stringify(canonical))
  fail("assets.js 與 assets.json 漂移");

const entries = new Map(assets.entries.map((entry) => [entry.id, entry]));
const backgrounds = {
  "ch6:H0-1": "bg_ch06_munich_arsenal_boring_floor_day",
  "ch6:H0-2": "bg_ch06_munich_arsenal_boring_floor_day",
  "ch6:H0-3": "bg_ch06_munich_chip_calorimetry_bench",
  "ch6:H1-1": "bg_ch06_munich_chip_calorimetry_bench",
  "ch6:H1-2": "bg_ch06_munich_arsenal_boring_floor_day",
  "ch6:H1-3": "bg_ch06_munich_arsenal_boring_floor_day",
  "ch6:H2-1": "bg_ch06_munich_airtight_bore_test",
  "ch6:H2-2": "bg_ch06_munich_water_box_setup",
  "ch6:H2-3": "bg_ch06_munich_water_box_boiling_evening",
  "ch6:H3-1": "bg_ch06_munich_model_audit_night",
  "ch6:H3-2": "bg_ch06_munich_model_audit_night",
  "ch6:HE-1": "bg_ch06_munich_joint_page_dawn",
  "ch6:SC6-R1": "bg_ch06_munich_model_audit_night"
};
for (const [scene, id] of Object.entries(backgrounds)) {
  if (assets.sceneBg?.[scene] !== id) fail("背景映射錯誤:" + scene);
  requireAsset(entries, id, { kind: "bg", w: 1920, h: 1080 });
}

const portraits = {
  dialogue_rumford45: "ch06/characters/ch06_char_rumford45_v01.webp",
  dialogue_stang52: "ch06/characters/ch06_char_stang52_v01.webp",
  dialogue_kessler58: "ch06/characters/ch06_char_kessler58_v01.webp"
};
for (const [id, assetPath] of Object.entries(portraits)) {
  const { runtime } = requireAsset(entries, id, { kind: "portrait", path: assetPath, w: 900, h: 1200 });
  if (!readFileSync(runtime).includes(Buffer.from("ALPH"))) fail("角色 WebP 缺透明 alpha:" + id);
}
const speakerPortraits = {
  "朗福德伯爵": "dialogue_rumford45",
  "史坦格・鑽炮長": "dialogue_stang52",
  "凱斯勒院士": "dialogue_kessler58"
};
for (const [speaker, id] of Object.entries(speakerPortraits))
  if (assets.speakerDialoguePortrait?.[speaker] !== id) fail("對話肖像未接上:" + speaker);
if (assets.speakerSide?.["朗福德伯爵"] !== "right" ||
    assets.speakerSide?.["史坦格・鑽炮長"] !== "left" ||
    assets.speakerSide?.["凱斯勒院士"] !== "left")
  fail("第六章雙槽站位未鎖定");

const transitionIds = [
  "ch06_transition_1740_unpaid_heat_debt_v01",
  "ch06_transition_1740_1798_pagefold_v01",
  "ch06_transition_1798_munich_arsenal_arrival_v01"
];
for (const id of transitionIds) requireAsset(entries, id, { kind: "bg", w: 1672, h: 941 });
const montage = assets.sceneFx?.["H0-1"];
if (montage?.fx !== "montage" || montage.steps?.length !== 3)
  fail("章首缺 1740→1798 三拍穿越");
if (JSON.stringify(montage.steps.map((step) => step.plate)) !== JSON.stringify(transitionIds))
  fail("章首穿越板順序錯誤");

const workbenchVisuals = {
  "heat-source-ledger": "ch06_lab_source_ledger",
  "chip-capacity-bench": "ch06_lab_chip_capacity",
  "friction-condition-bench": "ch06_lab_friction_conditions",
  "dry-strip-bench": "ch06_lab_paper_strip",
  "airtight-bench": "ch06_lab_airtight_piston",
  "water-box-bench": "ch06_lab_water_box_setup",
  "finite-source-prediction-bands": "ch06_lab_source_ledger",
  "continuous-run-bench": "ch06_lab_water_box_setup",
  "source-prediction-verdict": "ch06_lab_water_box_boiling",
  "model-audit-board": "ch06_focus_model_audit",
  "joint-verification-page": "ch06_focus_joint_page"
};
if (JSON.stringify(assets.heat6Visual) !== JSON.stringify(workbenchVisuals))
  fail("第六章工作台相位圖映射漂移");
for (const id of new Set(Object.values(workbenchVisuals)))
  requireAsset(entries, id, { kind: "prop", w: 1200, h: 750 });

const focusChecks = [
  ["H0-1", "一塊剛削下的黃銅碎屑", "ch06_focus_hot_chip_water"],
  ["H0-3", "從皮匣取出一本薄冊", "ch06_focus_latent_heat_notebook"]
];
for (const [scene, match, id] of focusChecks) {
  const focus = assets.lineFocusVisual.find((item) => item.scene === scene && item.match === match);
  if (focus?.items?.[0]?.asset !== id || !focus.caption || !focus.items[0].alt)
    fail("台詞聚焦圖未完整接上:" + scene);
  requireAsset(entries, id, { kind: "prop", w: 1200, h: 750 });
}
const epilogueFocus = assets.lineFocusVisual.find((item) =>
  item.scene === "HE-1" && item.match === "旅人把兩頁攤在一起");
if (epilogueFocus?.epilogue !== true ||
    epilogueFocus?.items?.[0]?.asset !== "ch06_epilogue_unmeasured_exchange_v01")
  fail("第六章末頁圖或 epilogue 放大演出未接上");
requireAsset(entries, "ch06_epilogue_unmeasured_exchange_v01", {
  kind: "bg", w: 1920, h: 1080
});

for (const code of ["S8", "T1", "T2", "T3", "T4", "T5"]) {
  const { runtime } = requireAsset(entries, "card_" + code, { kind: "card", w: 1200, h: 750 });
  const visual = assets.evidenceVisual?.[code];
  if (visual?.items?.[0]?.asset !== "card_" + code || !visual.caption || !visual.items[0].alt)
    fail("證據圖、說明或替代文字未接上:" + code);
  const svg = readFileSync(runtime, "utf-8");
  if (/(^|[^A-Za-z0-9_])(?:S8|T[1-5])(?=[^A-Za-z0-9_]|$)/.test(svgVisibleText(svg)))
    fail("第六章證據圖仍向玩家顯示內部代號:" + code);
}

const t4Fallback = readFileSync(path.join(
  publicRoot, "ch06/evidence/ch06_card_T4_prediction_bands_v01.svg"), "utf-8");
for (const fragment of ["四份來源預測逐一對帳", "原預測帶保留",
  "原帶與封條仍留在各自卷袋，狀態可追查", "終點位置、封條裂否",
  "展開本局卷宗逐張查驗"])
  if (!t4Fallback.includes(fragment)) fail("T4 誠實摘要缺必要邊界:" + fragment);
for (const stale of ["四枚封蠟裂開", "曲線越過封存的有限來源終點帶"])
  if (t4Fallback.includes(stale)) fail("T4 固定摘要仍捏造玩家世界線:" + stale);
const t4VisualText = [assets.entries.find((entry) => entry.id === "card_T4")?.label,
  assets.evidenceSummary?.T4, assets.evidenceVisual?.T4?.items?.[0]?.alt,
  assets.evidenceVisual?.T4?.caption].join(" ");
for (const fragment of ["四份來源預測逐一對帳", "原預測帶", "以本局卷宗為準",
  "終點位置與封條狀態"])
  if (!t4VisualText.includes(fragment)) fail("T4 資產文字缺中性世界線邊界:" + fragment);
for (const stale of ["四張有限來源", "四個有限來源", "封蠟裂開", "裂封與原預測"])
  if (t4VisualText.includes(stale)) fail("T4 資產文字仍捏造玩家世界線:" + stale);

requireAsset(entries, "chapter_thumbnail_ch06", {
  kind: "cg",
  path: "ch06/backgrounds/ch06_bg_munich_arsenal_boring_floor_day_v01.webp",
  w: 1920,
  h: 1080
});
if (assets.chapterThumbnail?.ch06 !== "chapter_thumbnail_ch06")
  fail("第六章章節縮圖未接上");

for (const [assetId, scene, match] of [
  ["ch06_focus_four_hands_strip_alignment_v01", "H1-1", "旅人把兩條紙帶的起點對齊"],
  ["ch06_focus_heat_strips_reading_v01", "H1-1", "這組紙最多支持到哪裡？"],
  ["ch06_focus_public_blank_admission_v01", "H3-1", "炮紙沒有因此變假"]
]) {
  requireAsset(entries, assetId, { kind:"cg", w:1672, h:941 });
  const rule = assets.lineFocusVisual?.find((entry) =>
    entry.scene === scene && entry.match === match &&
    entry.items?.some((item) => item.asset === assetId));
  if (!rule?.caption || !rule.items?.[0]?.alt)
    fail("第六章共同發現焦點圖未接上台詞:" + assetId);
}
const readingAsset = entries.get("ch06_focus_heat_strips_reading_v01");
const readingView = assets.viewFocusVisual?.find((entry) =>
  entry.scene === "H1-1" && entry.match === "這組紙最多支持到哪裡？" &&
  entry.nodeIds?.length === 1 && entry.nodeIds[0] === "c1");
if (readingAsset?.shotRole !== "reading" ||
    JSON.stringify(readingAsset.embeddedText) !== JSON.stringify(["碎屑", "薄片"]) ||
    !readingView)
  fail("第六章紙帶閱讀鏡頭未鎖定允許文字或 c1 停留映射");

const ui = readFileSync(path.join(repoRoot, "greybox/src/chapter-ui.js"), "utf-8");
for (const fragment of ["ASSETS.heat6Visual", "heat6MountVisual", "ch06_lab_water_box_boiling",
  "圖面不替任何來源押答案", "封條只裂，不消失"])
  if (!ui.includes(fragment)) fail("第六章工作台圖像契約缺失:" + fragment);
const css = readFileSync(path.join(repoRoot, "greybox/stage.html"), "utf-8");
for (const fragment of [".heat6Visual", ".heat6Seal.cracked", "max-height:520px"])
  if (!css.includes(fragment)) fail("第六章圖像響應式樣式缺失:" + fragment);

const handoffPath = path.join(repoRoot, "art/source/production/ch06/PROMPTS_RUNTIME_ART_20260803.md");
if (!existsSync(handoffPath)) fail("缺正式美術提示詞與採用紀錄");
const handoff = readFileSync(handoffPath, "utf-8");
for (const guard of ["合理重建", "共同頁第一版畫成五欄", "炮身旋轉", "鈍鑽固定",
  "不在點陣圖燒入", "虛構複合角色", "不宣稱精確復原"])
  if (!handoff.includes(guard)) fail("美術交接缺邊界:" + guard);

let totalBytes = 0;
const runtimePaths = new Set();
for (const entry of assets.entries) {
  if (!(entry.path || "").startsWith("ch06/")) continue;
  const runtime = path.join(publicRoot, entry.path);
  if (existsSync(runtime)) {
    totalBytes += runtimePaths.has(runtime) ? 0 : statSync(runtime).size;
    runtimePaths.add(runtime);
  }
}
if (runtimePaths.size !== 35) fail("第六章 runtime 檔案數應為 35，實際 " + runtimePaths.size);
if (totalBytes > 8 * 1024 * 1024) fail("第六章 runtime 圖片超過全章 8 MB 預算");

console.log("  ✓ 第六章正式美術交接（35 圖，含共同核紙、紙帶閱讀、公開未決與章末未來顯影，" + (totalBytes / 1024 / 1024).toFixed(2) + " MB）");
