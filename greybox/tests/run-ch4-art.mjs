import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const assets = require("../data/assets.js");
const Engine4 = require("../src/engine4.js");
const json = JSON.parse(readFileSync(path.join(here, "../data/assets.json"), "utf-8"));

function fail(message) {
  console.error("  ✗ 第四章正式美術與音樂交接|" + message);
  process.exitCode = 1;
  throw new Error(message);
}

function svgVisibleText(source) {
  return [...source.matchAll(/<(?:title|text)\b[^>]*>([\s\S]*?)<\/(?:title|text)>/g)]
    .map((match) => match[1].replace(/<[^>]+>/g, " "))
    .join(" ");
}

if (JSON.stringify(assets) !== JSON.stringify(json)) fail("assets.js 與 assets.json 漂移");

const entries = new Map(assets.entries.map((entry) => [entry.id, entry]));
const expectedBackgrounds = {
  "D0-1": "bg_ch03_print_room_1642",
  "D0-2": "bg_ch04_woolsthorpe_orchard_1665",
  "D1-1": "bg_ch04_woolsthorpe_study_1665",
  "D1-2": "bg_ch04_woolsthorpe_study_1665",
  "D-INT-1": "bg_ch04_woolsthorpe_study_1665",
  "D2-1": "bg_ch04_cambridge_hooke_letter_1679",
  "D2-2": "bg_ch04_cambridge_hooke_letter_1679",
  "D3-1": "bg_ch04_cambridge_halley_1684",
  "D4-1": "bg_ch04_cambridge_halley_1684",
  "D4-2": "bg_ch04_london_printshop_1687",
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
  dialogue_newton22: "ch04/characters/ch04_char_newton22_v03.webp",
  dialogue_newton41: "ch04/characters/ch04_char_newton41_v04.webp",
  dialogue_halley28: "ch04/characters/ch04_char_halley28_v02.webp"
};
const portraitMasters = {
  dialogue_newton22: "art/source/production/ch04/characters/ch04_char_newton22_alpha_v02.png",
  dialogue_newton41: "art/source/production/ch04/characters/ch04_char_newton41_alpha_v03.png",
  dialogue_halley28: "art/source/production/ch04/characters/ch04_char_halley28_alpha_v02.png"
};
for (const [id, assetPath] of Object.entries(portraits)) {
  const entry = entries.get(id);
  if (
    !entry ||
    entry.path !== assetPath ||
    entry.sourceMaster !== portraitMasters[id] ||
    entry.w !== 900 ||
    entry.h !== 1200
  )
    fail("人物資產宣告錯誤:" + id);
  if (!existsSync(path.join(here, "../../public/assets", assetPath))) fail("人物檔案不存在:" + assetPath);
}

for (const scene of ["D0-2", "D1-1", "D1-2", "D-INT-1"])
  if (assets.sceneDialoguePortrait[scene]?.Newton !== "dialogue_newton22")
    fail("1665 場景未使用青年 Newton:" + scene);
for (const scene of ["D2-1", "D2-2", "D3-1", "D4-1", "D4-2", "DE-1"])
  if (assets.sceneDialoguePortrait[scene]?.Newton !== "dialogue_newton41")
    fail("1679–1687 場景未使用成熟 Newton:" + scene);
for (const scene of ["D3-1", "D4-1", "D4-2", "DE-1"])
  if (assets.sceneDialoguePortrait[scene]?.Halley !== "dialogue_halley28")
    fail("Halley 場景缺肖像:" + scene);

if (assets.speakerSide.Newton !== "right" || assets.speakerSide.Halley !== "left")
  fail("Newton／Halley 雙槽站位未鎖定");
if (assets.chapterThumbnail.ch04 !== "chapter_thumbnail_ch04")
  fail("第四章章節縮圖未接上");

const expectedEvidenceAssets = {
  K1: { id:"card_K1", w:800, h:500 },
  K2: { id:"ch04_focus_shared_moon_calculation_v01", w:1672, h:941 },
  K3: { id:"card_K3", w:1200, h:750 },
  K4: { id:"card_K4", w:1200, h:750 },
  K5: { id:"card_K5", w:1536, h:1024 }
};
for (const [code, expected] of Object.entries(expectedEvidenceAssets)) {
  const entry = entries.get(expected.id);
  const visual = assets.evidenceVisual?.[code];
  if (!entry?.path || entry.w !== expected.w || entry.h !== expected.h)
    fail("第四章證據圖宣告錯誤:" + expected.id);
  if (!assets.evidenceSummary?.[code])
    fail("第四章證據摘要缺漏:" + code);
  if (visual?.items?.[0]?.asset !== expected.id || !visual.caption)
    fail("第四章旅人筆記視覺未接上:" + code);
  const file = path.join(here, "../../public/assets", entry.path);
  if (!existsSync(file)) fail("第四章證據圖檔案不存在:" + entry.path);
  if (code === "K2") {
    const notebookAlias = entries.get("card_K2");
    if (notebookAlias?.path !== entry.path || notebookAlias?.sourceMaster !== entry.sourceMaster)
      fail("K2 旅人筆記仍會優先載入舊版答案圖");
    if (!entry.path.endsWith(".webp") || !entry.sourceMaster ||
        !existsSync(path.join(here, "../../", entry.sourceMaster)))
      fail("K2 未使用有母版的共同計算 raster");
    if (!visual.caption.includes("地表一秒") ||
        !visual.caption.includes("月球一秒") ||
        !visual.items[0].alt.includes("沒有可讀公式或答案"))
      fail("K2 解鎖圖仍可能把公式或答案烤進 raster");
    if (statSync(file).size > 512 * 1024)
      fail("K2 證據圖超過單檔 512 KB 預算");
    continue;
  }
  if (code === "K1") {
    if (!entry.path.endsWith(".webp") || !entry.sourceMaster ||
        !existsSync(path.join(here, "../../", entry.sourceMaster)))
      fail("K1 未使用有 Art Lock 母版的完整 raster");
    if (!visual.projectionOnly || !visual.neutralBase || !entry.path.includes("neutral"))
      fail("K1 未使用可解析中性底圖，或未維持狀態投影優先");
    if (statSync(file).size > 768 * 1024)
      fail("K1 證據圖超過單檔 768 KB 工作預算");
    if (!visual.readerTitle || visual.accessibleText?.length !== 2)
      fail("K1 放大閱讀缺圖外逐字文字版");
    continue;
  }
  if (code === "K5") {
    if (!entry.path.endsWith(".webp") || !entry.sourceMaster ||
        !existsSync(path.join(here, "../../", entry.sourceMaster)))
      fail("K5 未使用有鎖定母版的完整 raster");
    if (statSync(file).size > 768 * 1024)
      fail("K5 證據圖超過單檔 768 KB 工作預算");
    if (!visual.readerTitle || visual.accessibleText?.length !== 4)
      fail("K5 放大閱讀缺圖外逐字文字版");
    continue;
  }
  const svg = readFileSync(file, "utf-8");
  if (!svg.includes('role="img"') || !svg.includes("<title") || !svg.includes("<desc"))
    fail("第四章證據圖缺可及性文字:" + expected.id);
  if (/(^|[^A-Za-z0-9_])K[1-5](?=[^A-Za-z0-9_]|$)/.test(svgVisibleText(svg)))
    fail("第四章證據圖仍向玩家顯示內部代號:" + expected.id);
}

const rasterLocks = {
  card_K1_raster_v02: "4bb170a8c175dc9888682024ec65cd5c7040099ad3dcc9fe1aa06c6cc95b079b",
  card_K4_no_loans_raster_v03: "5d125862cd16f97c82b47f7bf0cbecc63955769b6eebf648b93173684cc16687",
  card_K4_planets_loan_raster_v03: "66a0c985e9cbd71dc5e18672358baa10630c212a1f9b30d8efdcdc604db43bdf",
  card_K4_comet_loan_raster_v03: "e74d3442267f1fbce4d2305fac2d1dca07a7540cc6da5d17380faa2a4427ee62",
  card_K4_both_loans_raster_v04: "7c9240725524d032d7e32a982a5ea36ba89e29afd5a6053349431e5fd71a49c8",
  card_K4_no_loans_raster_v04: "5497d1c4719d403b39cce3d47e15b1b701ec6fb26c062bef8f8ae527b7dab9d7",
  card_K4_planets_loan_raster_v04: "58f4170ebb97a27f8cd81b23af1b23566b853df545bcc86dfa4e9d10f172b428",
  card_K4_comet_loan_raster_v04: "9814357465464f520bb172b2667c5249c4f11aeb6a10eba9c660983a2778a692",
  card_K4_both_loans_raster_v05: "313db3355d10c7982d1c71d0f7c644eec1e6670fb2a7cdcb04d28a8b438b4925"
};
for (const [id, expectedSha] of Object.entries(rasterLocks)) {
  const entry = entries.get(id);
  if (!entry?.path?.endsWith(".webp") || entry.w !== 1586 || entry.h !== 992 || !entry.sourceMaster)
    fail("Art Lock raster 宣告錯誤:" + id);
  const runtime = path.join(here, "../../public/assets", entry.path);
  const master = path.join(here, "../../", entry.sourceMaster);
  if (!existsSync(runtime) || !existsSync(master)) fail("Art Lock raster 或母版不存在:" + id);
  if (statSync(runtime).size > 768 * 1024) fail("Art Lock raster 超過 768 KB 工作預算:" + id);
  const actualSha = createHash("sha256").update(readFileSync(master)).digest("hex");
  if (actualSha !== expectedSha) fail("Art Lock 母版雜湊漂移:" + id);
}

const k4Visual = assets.evidenceVisual.K4;
const k4Variants = {
  no_loans: { asset: "card_K4_no_loans_raster_v04", loans: [] },
  planets_loan: { asset: "card_K4_planets_loan_raster_v04", loans: [{ caseId: "planets" }] },
  comet_loan: { asset: "card_K4_comet_loan_raster_v04", loans: [{ caseId: "comet" }] },
  both_loans: { asset: "card_K4_both_loans_raster_v05", loans: [{ caseId: "planets" }, { caseId: "comet" }] }
};
if (k4Visual.items?.[0]?.asset !== "card_K4" ||
    k4Visual.identity?.kind !== "reconstruction" ||
    !k4Visual.identity?.label?.includes("現代教學比較") ||
    !k4Visual.readerTitle?.includes("現代教學比較") ||
    !k4Visual.fallbackNotice?.includes("黃色補充紙"))
  fail("K4 fail-closed 中性圖或圖外標示缺失");
for (const [key, expected] of Object.entries(k4Variants)) {
  const variant = k4Visual.variants?.[key];
  if (variant?.items?.[0]?.asset !== expected.asset || !variant.caption ||
      !variant.accessibleText?.length)
    fail("K4 有限變體未完整登錄:" + key);
  if (!variant.items[0].alt.includes("現代教學比較") ||
      !variant.caption.includes("現代重算") ||
      !variant.accessibleText[0].includes("非十七世紀原始對帳表") ||
      variant.accessibleText.join(" ").includes("失配"))
    fail("K4 圖外歷史身分或白話用詞漂移:" + key);
  const claim = Engine4._ledgerClaimText({ loans: expected.loans });
  if (variant.accessibleText.at(-1) !== claim)
    fail("K4 文字版沒有逐字取自 deterministic ledgerClaimText:" + key);
}
for (const id of Object.values(k4Variants).map((row) => row.asset)) {
  const entry = entries.get(id);
  if (entry?.historicalDebt?.status !== "art-locked-modern-teaching-comparison" ||
      !entry.historicalDebt?.identity?.includes("非十七世紀原始對帳表"))
    fail("K4 Art Lock 未登錄現代重算身分:" + id);
}

const k5Entry = entries.get("card_K5");
const k5Visual = assets.evidenceVisual.K5;
if (k5Entry?.path !== "ch04/evidence/ch04_card_K5_scoped_proof_raster_v03.webp" ||
    k5Entry?.w !== 1536 || k5Entry?.h !== 1024 ||
    k5Entry?.sourceMaster !== "art/source/production/ch04/evidence/ch04_card_K5_scoped_proof_raster_candidate_v03.png" ||
    k5Entry?.historicalDebt?.status !== "art-locked-fixed-summary-raster" ||
    k5Entry?.historicalDebt?.identity !== "六段證明鏈教學圖，非《原理》原頁" ||
    k5Visual?.identity?.label !== "證明鏈教學圖 · 非《原理》原頁" ||
    !k5Visual?.readerTitle?.includes("六段證明鏈") ||
    k5Visual?.accessibleText?.length !== 4)
  fail("K5 v03 完整 raster 或圖外身分未完整登錄");
const k5Runtime = path.join(here, "../../public/assets", k5Entry.path);
const k5Master = path.join(here, "../../", k5Entry.sourceMaster);
if (!existsSync(k5Runtime) || !existsSync(k5Master) || statSync(k5Runtime).size > 768 * 1024)
  fail("K5 v03 runtime／母版缺失或超過 768 KB 工作預算");
const k5Sha = createHash("sha256").update(readFileSync(k5Master)).digest("hex");
if (k5Sha !== "a9e4d0dfa7b715b1c82ca552dc3f35a35dd211f189f9882f708bf6927979a4c2")
  fail("K5 v03 母版雜湊漂移");
for (const old of ["ch04_card_K5_scoped_proof_v01.svg", "ch04_card_K5_scoped_proof_v02.svg"])
  if (!existsSync(path.join(here, "../../public/assets/ch04/evidence", old)))
    fail("K5 舊檔未保留追溯:" + old);

const k4Fallback = readFileSync(path.join(
  here, "../../public/assets/ch04/evidence/ch04_card_K4_model_comparison_v01.svg"), "utf-8");
for (const fragment of ["殘差 0.36%", "兩筆較大殘差 0.32%", "此列只判方向，不出百分比",
  "只有說法", "沒有交出可核對數字", "推得 6.4 年，實測 11.86 年", "差 45.8%",
  "方向相反", "與固定流向衝突"])
  if (!k4Fallback.includes(fragment)) fail("K4 舊 SVG 尚未換成 runtime 真值:" + fragment);
for (const stale of ["0.8%", "1.6%", "2.2%", "3.8%", "12.4%", "28.0%", "補丁 2"])
  if (k4Fallback.includes(stale)) fail("K4 舊 SVG 假數據仍在 runtime:" + stale);

const tangentSheet = entries.get("ch04_prop_tangent_geometry_base_v01");
if (tangentSheet?.path !== "ch04/props/ch04_prop_tangent_geometry_base_v01.webp" ||
    tangentSheet.w !== 1200 || tangentSheet.h !== 800 || !tangentSheet.precisionOverlay)
  fail("月球切線分步底圖宣告錯誤");
if (!existsSync(path.join(here, "../../public/assets", tangentSheet.path)))
  fail("月球切線分步底圖 runtime 檔案不存在");
if (!existsSync(path.join(here, "../../", tangentSheet.sourceMaster)))
  fail("月球切線分步底圖母版不存在");
const crossScaleSheets = {
  ch04_prop_cross_scale_surface_sheet_v02:
    "ch04/props/ch04_prop_cross_scale_surface_sheet_v02.webp",
  ch04_prop_cross_scale_moon_sheet_v02:
    "ch04/props/ch04_prop_cross_scale_moon_sheet_v02.webp"
};
for (const [id, assetPath] of Object.entries(crossScaleSheets)) {
  const entry = entries.get(id);
  if (entry?.path !== assetPath || entry.w !== 1200 || entry.h !== 480)
    fail("同尺紙完整重建圖宣告錯誤:" + id);
  if (!existsSync(path.join(here, "../../public/assets", assetPath)))
    fail("同尺紙 runtime 完整重建圖不存在:" + assetPath);
  if (!entry.sourceMaster || !existsSync(path.join(here, "../../", entry.sourceMaster)))
    fail("同尺紙來源母版不存在:" + id);
}
const tangentFocusStates = [
  ["月亮先前走過的一小段圓弧", "orbit-base", "月亮前方仍是空白"],
  ["旅人把尺靠上月亮此刻的方向", "orbit-tangent", "尚未畫實際彎路"],
  ["牛頓在同一張紙上補出月亮實際走過", "orbit-gap", "短線精確連接"]
];
for (const [match, overlay, altGuard] of tangentFocusStates) {
  const focus = (assets.lineFocusVisual || []).find((rule) =>
    rule.scene === "D1-1" && rule.match.includes(match));
  if (focus?.items?.[0]?.asset !== "ch04_prop_tangent_geometry_base_v01" ||
      focus.items[0].overlay !== overlay || !focus.items[0].alt.includes(altGuard) ||
      !focus.caption)
    fail("D1-1 圓弧／切線／端點短差沒有依序分圖:" + overlay);
}

const focusProps = {
  ch04_prop_rope_ball_setup_v01: {
    scene: "D2-1",
    match: "木球上繫好細繩",
    guard: "不替月亮提供答案"
  },
  ch04_prop_hooke_letter_reconstruction_v01: {
    scene: "D2-1",
    match: "信上畫著兩支箭",
    guard: "非真跡影像"
  },
  ch04_prop_halley_sealed_observation_box_v01: {
    scene: "D3-1",
    match: "哈雷掏出封蠟",
    guard: "先寫下預測"
  },
  ch04_prop_print_credit_sources_v01: {
    scene: "D4-2",
    match: "作者欄沒有旅人的名字",
    guard: "各份來源仍留在紙上"
  }
};
for (const [id, expected] of Object.entries(focusProps)) {
  const entry = entries.get(id);
  if (!entry?.path || entry.w !== 1200 || entry.h !== 800)
    fail("第四章台詞特寫宣告錯誤:" + id);
  const runtime = path.join(here, "../../public/assets", entry.path);
  const source = path.join(here, "../../", entry.sourceMaster || "");
  if (!existsSync(runtime)) fail("第四章台詞特寫 runtime 檔案不存在:" + id);
  if (!existsSync(source)) fail("第四章台詞特寫母版不存在:" + id);
  if (statSync(runtime).size > 512 * 1024) fail("第四章台詞特寫超過單檔 512 KB 預算:" + id);
  const focus = (assets.lineFocusVisual || []).find((rule) =>
    rule.scene === expected.scene && rule.match.includes(expected.match));
  if (focus?.items?.[0]?.asset !== id || !focus.caption.includes(expected.guard))
    fail("第四章台詞特寫觸發或洩答護欄錯誤:" + id);
}

const generatedFocus = {
  ch04_focus_drawer_closes_1665_v01: {
    scene: "D1-2", match: "兩張紙放進抽屜", guard: "還沒有答案"
  },
  ch04_focus_newton_orbit_montage_1679_v01: {
    scene: "D2-1", match: "桌上排著旅人挑出的三張紙", guard: "路徑與設定仍由引擎依玩家操作繪製"
  },
  ch04_focus_newton_cannonball_reconstruction_v01: {
    scene: "D2-1", match: "最高的山頂上", guard: "依牛頓 1728 年刊本原典圖重建"
  },
  ch04_focus_stirred_tea_analogy_v01: {
    scene: "D4-1", match: "攪茶圖卡", guard: "不表示渦旋已被證明"
  },
  ch04_focus_lodestone_needle_analogy_v01: {
    scene: "D4-1", match: "牛頓放下一塊磁石", guard: "沒有說明引力為什麼"
  },
  ch04_focus_three_observation_folios_v01: {
    scene: "D4-1", match: "三個紙袋排成一列", guard: "仍由表格呈現"
  },
  ch04_focus_shell_theorem_page_v01: {
    scene: "D4-2", match: "厚薄均勻的球殼", guard: "由引擎 SVG 疊加"
  }
};
for (const [id, expected] of Object.entries(generatedFocus)) {
  const entry = entries.get(id);
  if (!entry?.path || entry.w !== 1672 || entry.h !== 941)
    fail("第四章新增敘事特寫宣告錯誤:" + id);
  const runtime = path.join(here, "../../public/assets", entry.path);
  const source = path.join(here, "../../", entry.sourceMaster || "");
  if (!existsSync(runtime)) fail("第四章新增敘事特寫 runtime 檔案不存在:" + id);
  if (!existsSync(source)) fail("第四章新增敘事特寫母版不存在:" + id);
  if (statSync(runtime).size > 512 * 1024)
    fail("第四章新增敘事特寫超過單檔 512 KB 預算:" + id);
  const focus = (assets.lineFocusVisual || []).find((rule) =>
    rule.scene === expected.scene && rule.match.includes(expected.match));
  if (focus?.items?.[0]?.asset !== id || !focus.caption.includes(expected.guard))
    fail("第四章新增敘事特寫觸發或 SVG 邊界錯誤:" + id);
}

const stageHtml = readFileSync(path.join(here, "../stage.html"), "utf-8");
if (!/body\[data-view="orbit"\] #panelWrap\s*\{\s*display:\s*block/.test(stageHtml))
  fail("第四章工作台仍可能被全域 display:none 隱藏");
if (!stageHtml.includes('body[data-view="orbit"] #dialogue'))
  fail("第四章工作台未關閉殘留對話框");
const focusRenderer = readFileSync(path.join(here, "../src/stage/03-focus-visual.part.js"), "utf-8");
const orbitRules = (assets.lineFocusVisual || []).filter((rule) =>
  rule.items?.some((item) => ["orbit-base", "orbit-tangent", "orbit-gap"].includes(item.overlay)));
if (orbitRules.length < 4 ||
    !focusRenderer.includes("function mountOrbitGeometryFocusVisual") ||
    !focusRenderer.includes('overlay.setAttribute("class", "orbit-geometry-overlay")') ||
    !focusRenderer.includes('overlay.setAttribute("viewBox", "0 0 1200 800")') ||
    !focusRenderer.includes('overlay.setAttribute("preserveAspectRatio", "xMidYMid slice")') ||
    !focusRenderer.includes('d="M 627.2 276.6 L 712 390.3"') ||
    !focusRenderer.includes('d="M 627.2 276.6 A 335.9 358.1 0 0 1 688.5 405.6"') ||
    !focusRenderer.includes('d="M 712 390.3 L 688.5 405.6"') ||
    !stageHtml.includes(".orbit-geometry-overlay"))
  fail("月球切線、實際彎路與端點短差沒有在底圖座標系中由 runtime 精確疊圖");
const cannonEntry = entries.get("ch04_focus_newton_cannonball_reconstruction_v01");
const cannonRule = (assets.lineFocusVisual || []).find((rule) =>
  rule.items?.some((item) => item.asset === cannonEntry?.id));
if (!cannonEntry?.sourceReference?.endsWith("newton_cannonball_1728_public_domain.png") ||
    !cannonEntry?.sourceUrl?.includes("1728-newton-a-treatise-of-the-system-of-the-world") ||
    !cannonEntry?.license?.includes("Public Domain") ||
    cannonRule?.items?.[0]?.overlay ||
    !cannonRule?.caption?.includes("不是牛頓親筆手稿"))
  fail("山頂大砲重建圖未保留 1728 原典來源、重建標示或無疊圖邊界");
const shellRule = (assets.lineFocusVisual || []).find((rule) =>
  rule.items?.some((item) => item.asset === "ch04_focus_shell_theorem_page_v01"));
if (shellRule?.items?.[0]?.overlay !== "shell-theorem" ||
    !focusRenderer.includes("function mountShellTheoremFocusVisual") ||
    !focusRenderer.includes('overlay.setAttribute("class", "shell-theorem-overlay")') ||
    (focusRenderer.match(/class="shell /g) || []).length !== 3 ||
    !stageHtml.includes(".shell-theorem-overlay"))
  fail("球殼定理紙頁的幾何沒有由 runtime SVG 疊加");

const chapterUi = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
for (const fragment of [
  "orbit4BlankSelect",
  "四項都要由你選定",
  "commitOrbitBeat",
  "continueOrbitRule",
  "beginLedgerRow",
  "stampLedgerCell",
  "addModelLoan",
  "declineModelLoan",
  "assembleKnownProofSources",
  "judgeShellBalance",
  "placeShellPage",
  "assignCreditPlan",
  "removeTravelerFromAuthorField",
  "orbitProofTrack",
  "cannon-trajectory-overlay"
])
  if (!chapterUi.includes(fragment) && !focusRenderer.includes(fragment))
    fail("第四章 v0.8 動態證據視覺缺漏:" + fragment);
for (const fragment of [
  "ch04_prop_cross_scale_surface_sheet_v01",
  "ch04_prop_cross_scale_moon_sheet_v01",
  "orbit4ScaleSheets",
  "orbit4ScaleGeometry",
  "有興趣再看幾何算式",
  "端點短差 s＝2r sin²(θ／2)",
  "這不是輸入答案，而是事後把差距放大"
]) if (!chapterUi.includes(fragment)) fail("同尺紙底圖、真實幾何或事後顯影缺漏:" + fragment);
for (const obsolete of [
  "ch04_prop_cross_scale_surface_sheet_v02",
  "ch04_prop_cross_scale_moon_sheet_v02",
  "4.9 m ÷ 60² ≈ 1.4 mm",
  "4.9 m ÷ 1.4 mm ≈ 3600",
  "60² = 3600｜距離平方縮弱"
]) if (chapterUi.includes(obsolete)) fail("同尺紙仍引用烤死答案圖、舊精度或提前公式:" + obsolete);
for (const obsolete of ["箭頭方向 ", "箭頭長度 ", 'dist.type="range"', 'exponent.type="range"'])
  if (chapterUi.includes(obsolete)) fail("D1-2／D2-2 仍殘留已退役滑桿:" + obsolete);

const chapter4Transition = assets.sceneFx?.["D0-2"];
if (!chapter4Transition || chapter4Transition.fx !== "montage" || chapter4Transition.steps?.length !== 3)
  fail("第四章章首缺 1642→1665 三拍穿越");
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
  "D0-1": "ch3Print",
  "D0-2": "ch4Orchard",
  "D1-1": "ch4Orbit",
  "D1-2": "ch4Orbit",
  "D-INT-1": "timePassage",
  "D2-1": "ch4Hooke",
  "D2-2": "ch4Hooke",
  "D3-1": "ch4Predictions",
  "D4-1": "ch4Press",
  "D4-2": "ch4Press",
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
  'BGM.current() === "ch4Press"',
  'd.scene === "D4-2"'
])
  if (!stageUi.includes(fragment)) fail("第四章三段式音樂缺里程碑切換:" + fragment);

const artGovernanceFiles = {
  prompts: path.join(here, "../../art/source/production/ch04/focus/PROMPTS_CH04_FOCUS_V02_20260731.md"),
  ledger: path.join(here, "../../art/source/production/ASSET_LEDGER.md"),
  licenses: path.join(here, "../../public/assets/ART-LICENSES.md"),
  appendix: path.join(here, "../../03_規格/發現之前_第四章美術製作附錄_v0.1.md")
};
for (const [label, file] of Object.entries(artGovernanceFiles))
  if (!existsSync(file)) fail("第四章補圖缺治理紀錄:" + label);
const scalePromptFile = path.join(here,
  "../../art/source/production/ch04/props/PROMPTS_CH04_CROSS_SCALE_SHEETS_V02_20260803.md");
if (!existsSync(scalePromptFile)) fail("同尺紙缺生成提示與重建邊界紀錄");
const scaleGovernance = [
  readFileSync(scalePromptFile, "utf-8"),
  readFileSync(artGovernanceFiles.ledger, "utf-8"),
  readFileSync(artGovernanceFiles.licenses, "utf-8")
].join("\n");
for (const id of Object.keys(crossScaleSheets))
  if (!scaleGovernance.includes(id)) fail("同尺紙治理紀錄缺資產 ID:" + id);
const governanceText = Object.fromEntries(Object.entries(artGovernanceFiles).map(
  ([label, file]) => [label, readFileSync(file, "utf-8")]
));
for (const id of Object.keys(generatedFocus).filter((id) =>
  id.includes("stirred_tea") || id.includes("lodestone") ||
  id.includes("three_observation") || id.includes("shell_theorem"))) {
  for (const label of ["prompts", "ledger", "licenses", "appendix"])
    if (!governanceText[label].includes(id))
      fail("第四章補圖治理紀錄未逐件收錄:" + label + " → " + id);
}
const rootLicense = readFileSync(path.join(here, "../../LICENSE-CONTENT.md"), "utf-8");
if (!rootLicense.includes("public/assets/ch01–ch05") ||
    !rootLicense.includes("public/assets/ART-LICENSES.md"))
  fail("根內容授權仍未涵蓋後續章美術或未連到逐件授權帳");

console.log("  ✓ 第四章正式美術與音樂交接|12 場背景、3 張去邊肖像、12 張台詞特寫、5 張證據圖、7 張新增 focus、2 張同尺完整重建圖、11 首 BGM");
