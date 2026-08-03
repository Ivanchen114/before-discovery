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
  dialogue_newton41: "ch04/characters/ch04_char_newton41_v03.webp",
  dialogue_halley28: "ch04/characters/ch04_char_halley28_v02.webp"
};
for (const [id, assetPath] of Object.entries(portraits)) {
  const entry = entries.get(id);
  if (!entry || entry.path !== assetPath || entry.w !== 900 || entry.h !== 1200)
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
  K1: "card_K1",
  K2: "card_K2_cross_scale_reconstruction_v02",
  K3: "card_K3",
  K4: "card_K4",
  K5: "card_K5"
};
for (const [code, id] of Object.entries(expectedEvidenceAssets)) {
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
  if (code === "K2") {
    if (!entry.path.endsWith(".webp") || !entry.sourceMaster ||
        !existsSync(path.join(here, "../../", entry.sourceMaster)))
      fail("K2 未使用有母版的完整 raster 教學重建圖");
    if (!visual.caption.includes("教學重建") ||
        !visual.items[0].alt.includes("六十個地球半徑") ||
        !visual.items[0].alt.includes("三千六百"))
      fail("K2 教學重建、比例或換算邊界未對玩家說清楚");
    if (statSync(file).size > 512 * 1024)
      fail("K2 證據圖超過單檔 512 KB 預算");
    continue;
  }
  const svg = readFileSync(file, "utf-8");
  if (!svg.includes('role="img"') || !svg.includes("<title") || !svg.includes("<desc"))
    fail("第四章證據圖缺可及性文字:" + id);
}

const tangentSheet = entries.get("ch04_prop_tangent_prediction_sheet_v02");
if (tangentSheet?.path !== "ch04/props/ch04_prop_tangent_prediction_sheet_v02.webp" ||
    tangentSheet.w !== 1200 || tangentSheet.h !== 750)
  fail("無作用切線預測紙宣告錯誤");
if (!existsSync(path.join(here, "../../public/assets", tangentSheet.path)))
  fail("無作用切線預測紙 runtime 檔案不存在");
if (!existsSync(path.join(here, "../../", tangentSheet.sourceMaster)))
  fail("無作用切線預測紙母版不存在");
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
const tangentFocus = (assets.lineFocusVisual || []).find((rule) =>
  rule.scene === "D1-1" && rule.match.includes("畫下一條直線"));
if (tangentFocus?.items?.[0]?.asset !== "ch04_prop_tangent_prediction_sheet_v02" ||
    !tangentFocus.caption.includes("不是觀測證據"))
  fail("D1-1 選對後未接上切線預測紙或證據邊界");

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
    guard: "先留下預測"
  },
  ch04_prop_print_credit_sources_v01: {
    scene: "D4-2",
    match: "作者欄沒有旅人的名條",
    guard: "署名決定之後"
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
    scene: "D1-2", match: "兩張紙放進抽屜", guard: "尚未被證明"
  },
  ch04_focus_newton_orbit_montage_1679_v01: {
    scene: "D2-1", match: "第三十拍落下", guard: "軌跡仍由引擎繪製"
  },
  ch04_focus_mountain_cannon_v01: {
    scene: "D2-1", match: "最高的山頂上", guard: "引擎 SVG 疊加"
  },
  ch04_focus_stirred_tea_analogy_v01: {
    scene: "D4-1", match: "攪茶圖卡", guard: "不表示渦旋已被證明"
  },
  ch04_focus_lodestone_needle_analogy_v01: {
    scene: "D4-1", match: "磁石圖卡", guard: "不能把磁力機制等同引力"
  },
  ch04_focus_three_observation_folios_v01: {
    scene: "D4-1", match: "三份觀測封面", guard: "仍由引擎表格承載"
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
const cannonRule = (assets.lineFocusVisual || []).find((rule) =>
  rule.items?.some((item) => item.asset === "ch04_focus_mountain_cannon_v01"));
if (cannonRule?.items?.[0]?.overlay !== "cannon-trajectories" ||
    !focusRenderer.includes("function mountCannonFocusVisual") ||
    !focusRenderer.includes('overlay.setAttribute("class", "cannon-trajectory-overlay")') ||
    (focusRenderer.match(/<path class=/g) || []).length < 5 ||
    !stageHtml.includes(".cannon-trajectory-overlay"))
  fail("山頂大砲的物理軌跡沒有由 runtime SVG 疊加");
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
  "revealShellPage",
  "placeShellPage",
  "removeTravelerFromAuthorField",
  "orbitProofTrack",
  "cannon-trajectory-overlay"
])
  if (!chapterUi.includes(fragment) && !focusRenderer.includes(fragment))
    fail("第四章 v0.8 動態證據視覺缺漏:" + fragment);
for (const fragment of [
  "ch04_prop_cross_scale_surface_sheet_v02",
  "ch04_prop_cross_scale_moon_sheet_v02",
  "orbit4ScaleSheets",
  "想看公式，再展開",
  "依 s ∝ t² 換成 1 秒約 1.36 mm"
]) if (!chapterUi.includes(fragment)) fail("同尺紙完整圖或完成後選讀公式缺漏:" + fragment);
for (const obsolete of [
  "ch04_prop_cross_scale_surface_sheet_v01",
  "ch04_prop_cross_scale_moon_sheet_v01",
  "4.9 m ÷ 60² ≈ 1.4 mm",
  "4.9 m ÷ 1.4 mm ≈ 3600",
  "60² = 3600｜距離平方縮弱"
]) if (chapterUi.includes(obsolete)) fail("同尺紙仍殘留舊 SVG 疊圖或提前公式:" + obsolete);
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
