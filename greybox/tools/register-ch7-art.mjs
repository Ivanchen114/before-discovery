/* CH7-ART-001：把第七章正式背景、角色、焦點與證據 raster 登錄到共用 assets.json。
   可重跑；只覆寫本檔列出的 CH7 ID 與映射，不碰其他章 WIP。 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../..");
const manifestPath = path.join(repo, "greybox/data/assets.json");
const assets = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

function upsertEntry(entry) {
  const index = assets.entries.findIndex((item) => item.id === entry.id);
  if (index >= 0) assets.entries[index] = entry;
  else assets.entries.push(entry);
}

const entries = [
  ["bg_ch07_bologna_rain_arrival", "bg", "1798 波隆那雨後抵達（合理重建）", "ch07/backgrounds/ch07_bg_bologna_rain_arrival_v01.webp", 1672, 941, "art/source/production/ch07/backgrounds/ch07_bg_bologna_rain_arrival_master_v01.png", true],
  ["bg_ch07_galvani_anatomy_study_day", "bg", "1798 Galvani 解剖書房日景（合理重建）", "ch07/backgrounds/ch07_bg_galvani_anatomy_study_day_v01.webp", 1672, 941, "art/source/production/ch07/backgrounds/ch07_bg_galvani_anatomy_study_day_master_v01.png", true],
  ["bg_ch07_galvani_matrix_table", "bg", "1798 Galvani 四格複驗桌（合理重建）", "ch07/backgrounds/ch07_bg_galvani_matrix_table_v01.webp", 1672, 941, "art/source/production/ch07/backgrounds/ch07_bg_galvani_matrix_table_master_v01.png", false],
  ["bg_ch07_volta_pavia_lab", "bg", "1798 Volta 帕維亞儀器室（合理重建）", "ch07/backgrounds/ch07_bg_volta_pavia_lab_v01.webp", 1672, 941, "art/source/production/ch07/backgrounds/ch07_bg_volta_pavia_lab_master_v01.png", true],
  ["bg_ch07_galvani_return_evening", "bg", "1798 波隆那五格判讀黃昏（合理重建）", "ch07/backgrounds/ch07_bg_galvani_return_evening_v01.webp", 1672, 941, "art/source/production/ch07/backgrounds/ch07_bg_galvani_return_evening_master_v01.png", false],
  ["bg_ch07_aldini_study_1800_dawn", "bg", "1800 Aldini 書房清晨（合理重建）", "ch07/backgrounds/ch07_bg_aldini_study_1800_dawn_v01.webp", 1672, 941, "art/source/production/ch07/backgrounds/ch07_bg_aldini_study_1800_dawn_master_v01.png", true],
  ["dialogue_galvani61", "portrait", "Luigi Galvani 約 61 歲（合理重建）", "ch07/characters/ch07_portrait_galvani_v02.webp", 1368, 1149, "art/source/production/ch07/characters/ch07_portrait_galvani_alpha_master_v02.png", true],
  ["dialogue_volta53", "portrait", "Alessandro Volta 約 53 歲（合理重建）", "ch07/characters/ch07_portrait_volta_v02.webp", 1316, 1195, "art/source/production/ch07/characters/ch07_portrait_volta_alpha_master_v02.png", true],
  ["dialogue_aldini38", "portrait", "Giovanni Aldini 約 38 歲（合理重建）", "ch07/characters/ch07_portrait_aldini_v02.webp", 1402, 1122, "art/source/production/ch07/characters/ch07_portrait_aldini_alpha_master_v02.png", true],
  ["ch07_focus_frog_witness_v01", "cg", "第七章蛙腿接觸共同觀察鏡頭", "ch07/focus/ch07_focus_frog_witness_v01.webp", 1672, 941, "art/source/production/ch07/focus/ch07_focus_frog_witness_master_v01.png", false],
  ["ch07_focus_four_papers_matrix_v01", "cg", "第七章四張複驗紙閱讀鏡頭", "ch07/focus/ch07_focus_four_papers_matrix_v01.webp", 1672, 941, "art/source/production/ch07/focus/ch07_focus_four_papers_matrix_master_v01.png", false],
  ["ch07_focus_volta_electrometer_v01", "cg", "第七章旅人親手操作凝聚電量器鏡頭", "ch07/focus/ch07_focus_volta_electrometer_v01.webp", 1672, 941, "art/source/production/ch07/focus/ch07_focus_volta_electrometer_master_v01.png", false],
  ["ch07_focus_volta_pile_v01", "cg", "第七章旅人與 Aldini 疊堆鏡頭", "ch07/focus/ch07_focus_volta_pile_v01.webp", 1672, 941, "art/source/production/ch07/focus/ch07_focus_volta_pile_master_v01.png", false],
  ["ch07_focus_six_papers_board_v01", "cg", "第七章六張原紙合帳閱讀鏡頭", "ch07/focus/ch07_focus_six_papers_board_v01.webp", 1672, 941, "art/source/production/ch07/focus/ch07_focus_six_papers_board_master_v01.png", false],
  ["ch07_focus_empty_recipient_letter_v01", "cg", "第七章沒有收件人的信收束鏡頭", "ch07/focus/ch07_focus_empty_recipient_letter_v01.webp", 1672, 941, "art/source/production/ch07/focus/ch07_focus_empty_recipient_letter_master_v01.png", false],
  ["chapter_thumbnail_ch07", "cg", "第七章章節縮圖", "ch07/backgrounds/ch07_bg_bologna_rain_arrival_v01.webp", 1672, 941, "art/source/production/ch07/backgrounds/ch07_bg_bologna_rain_arrival_master_v01.png", true]
].map(([id, kind, label, assetPath, w, h, sourceMaster, firstScreen]) => ({
  id, kind, label, path: assetPath, firstScreen, w, h, sourceMaster
}));

const evidenceLabels = {
  GRID_BASELINE: "證人醒著的基準紙",
  GRID_BIMETAL: "雙金屬閉合的觀測紙",
  GRID_SAME_METAL: "同材質接法的觀測紙",
  GRID_NO_METAL: "無金屬仍收縮的觀測紙",
  GRID_ELECTROMETER: "沒有生命組織的針格",
  GRID_PILE: "持續電效應的堆格",
  GRID_STATE: "六格合帳頁"
};
Object.entries(evidenceLabels).forEach(([code, label]) => {
  entries.push({
    id: `card_${code}`,
    kind: "card",
    label: `第七章 ${label}`,
    path: `ch07/evidence/ch07_card_${code}_v01.webp`,
    firstScreen: false,
    w: 1586,
    h: 991,
    sourceMaster: `art/source/production/ch07/evidence/ch07_card_${code}_master_v01.png`,
    renderPolicy: "complete-raster-no-visible-overlay"
  });
});
entries.forEach(upsertEntry);

Object.assign(assets.sceneBg, {
  "ch7:EM7-0": "bg_ch07_bologna_rain_arrival",
  "ch7:EM7-1": "bg_ch07_galvani_anatomy_study_day",
  "ch7:EM7-2": "bg_ch07_galvani_matrix_table",
  "ch7:EM7-3": "bg_ch07_volta_pavia_lab",
  "ch7:EM7-4": "bg_ch07_galvani_return_evening",
  "ch7:EM7-E": "bg_ch07_aldini_study_1800_dawn",
  "ch7:SC7-R1": "bg_ch07_galvani_matrix_table"
});

Object.assign(assets.bgmFiles, {
  ch7Bologna: { mode: "once", repeatGapMs: 5000, clips: ["ch07/Ch7_Bologna_Rain_And_Brass.mp3"] },
  ch7Matrix: { mode: "once", repeatGapMs: 5000, clips: ["ch07/Ch7_Four_Papers_Question.mp3"] },
  ch7Pavia: { mode: "once", repeatGapMs: 5000, clips: ["ch07/Ch7_Pavia_Needle.mp3"] },
  ch7Letter: { mode: "once", clips: ["ch07/Ch7_Letter_Without_Recipient.mp3"] }
});
Object.assign(assets.sceneBgm, {
  "ch7:EM7-0": "ch7Bologna",
  "ch7:EM7-1": "ch7Bologna",
  "ch7:EM7-2": "ch7Matrix",
  "ch7:EM7-3": "ch7Pavia",
  "ch7:EM7-4": "ch7Matrix",
  "ch7:EM7-E": "ch7Letter",
  "ch7:SC7-R1": "silence"
});

Object.assign(assets.speakerDialoguePortrait, {
  "Galvani": "dialogue_galvani61",
  "Volta": "dialogue_volta53",
  "Volta（小冊）": "dialogue_volta53",
  "Aldini": "dialogue_aldini38"
});
Object.assign(assets.speakerSide, {
  "Galvani": "right",
  "Volta": "left",
  "Volta（小冊）": "left",
  "Aldini": "right"
});

const focusRules = [
  { scene: "EM7-1", match: "銅鉤擺過去，碰上鐵欄", items: [{ asset: "ch07_focus_frog_witness_v01", alt: "Galvani 與旅人的手同時停在黃銅鉤與鐵接點旁，覆布標本的接觸位置成為兩人共同注視的焦點" }], caption: "腿踢了一下；兩個人先看同一個接點，再爭它能證明什麼。" },
  { scene: "EM7-2", match: "書商捎來一冊帕維亞印的小冊子", items: [{ asset: "ch07_focus_four_papers_matrix_v01", alt: "四張無字複驗原紙依接法排在桌上，最舊的 1794 年紙壓在一旁，沒有任何正誤印章" }], caption: "四格都由玩家親手留下；舊紙沒有因新主張而消失。" },
  { scene: "EM7-3", match: "Volta 取出一座小裝置", items: [{ asset: "ch07_focus_volta_electrometer_v01", alt: "旅人的雙手操作黃銅與鋅片、薄盤和細針電量器，Volta 退在後方抱手旁觀" }], caption: "儀器是 Volta 的，接觸與讀針由玩家親手完成。" },
  { scene: "EM7-E", match: "把一份傳抄的圖說攤開在矩陣旁", items: [{ asset: "ch07_focus_volta_pile_v01", alt: "旅人與 Aldini 依圖交替排放銅片、鋅片與濕布，尚未用任何發光效果預告結果" }], caption: "圖說只給接法；堆能不能持續，由玩家把兩端接起來。" },
  { scene: "EM7-E", match: "六格第一次睡在同一張紙上", items: [{ asset: "ch07_focus_six_papers_board_v01", alt: "六張已取得原紙歸在同一頁，接法物件仍可逐格追查，兩條過寬墨線被保留並限縮" }], caption: "六張紙第一次同頁；合帳不是抹平差異，而是讓每一格互相限制。" },
  { scene: "EM7-E", match: "摺成一封信的形狀", items: [{ asset: "ch07_focus_empty_recipient_letter_v01", alt: "清晨桌上一封摺好的信仍空著收件人欄，旁邊是可追查的六格矩陣與被劃限的原句" }], caption: "收件人欄留白；證詞沒有因此失去去處。" }
];
const focusKeys = new Set(focusRules.map((rule) => `${rule.scene}\u0000${rule.match}`));
assets.lineFocusVisual = assets.lineFocusVisual.filter((rule) => !focusKeys.has(`${rule.scene}\u0000${rule.match}`)).concat(focusRules);

const viewRules = [
  { scene: "EM7-3", nodeIds: ["e_electrometer"], match: "Volta 取出一座小裝置" },
  { scene: "EM7-E", nodeIds: ["e_pile"], match: "把一份傳抄的圖說攤開在矩陣旁" }
];
const viewKeys = new Set(viewRules.map((rule) => `${rule.scene}\u0000${rule.nodeIds.join(",")}`));
assets.viewFocusVisual = assets.viewFocusVisual.filter((rule) => !viewKeys.has(`${rule.scene}\u0000${(rule.nodeIds || []).join(",")}`)).concat(viewRules);

/* EM7-E 已使用兩拍重大時間 montage，不與短幕 sceneTreatment 疊加。 */
delete assets.sceneTreatment["EM7-E"];
Object.assign(assets.sceneFx, {
  "EM7-0": { fx: "montage", steps: [{ plate: "bg_ch07_bologna_rain_arrival", label: "1798｜義大利・波隆那", caption: "炮膛的火星退成雨聲；一隻腿替新的問題作證。" }] },
  "EM7-E": { fx: "montage", steps: [
    { plate: "bg_ch07_galvani_return_evening", label: "1798｜波隆那", caption: "倒下的全稱被劃線；還沒有證據的那一行留白。" },
    { plate: "bg_ch07_aldini_study_1800_dawn", label: "1800｜同一間書房", caption: "兩年後，另一張紙終於回來。寫下它的人已不在。" }
  ] }
});

const evidenceRules = {
  GRID_BASELINE: {
    alt: "亞麻布標本袋接受外部已知刺激後，兩條位移指示線偏離；本次製備仍會反應",
    caption: "取得證據：外部已知刺激能使本次製備收縮；這格只保證證人醒著，不回答來源。",
    text: ["配置：外部已知刺激；不使用金屬接點。", "觀測：本次蛙腿製備收縮。", "邊界：只確認製備仍會反應。"]
  },
  GRID_BIMETAL: {
    alt: "黃銅與鐵兩種不同金屬閉合接觸，覆布標本的位移指示線改變",
    caption: "取得證據：黃銅與鐵形成閉合接法時，蛙腿收縮。",
    text: ["配置：黃銅鉤接觸鐵片，形成雙金屬閉合接法。", "觀測：蛙腿收縮。"]
  },
  GRID_SAME_METAL: {
    alt: "兩端使用同材質黃銅接點，覆布標本的位移指示線仍顯示收縮",
    caption: "取得證據：同材質接法完成時，本次蛙腿製備仍收縮。",
    text: ["配置：同材質金屬弧接觸神經與肌肉。", "觀測：本次蛙腿製備收縮。", "邊界：只記本次接點與組織狀態。"]
  },
  GRID_NO_METAL: {
    alt: "桌上沒有金屬接點，玻璃棒與直接組織接觸後，位移指示線仍顯示收縮",
    caption: "取得證據：沒有金屬在場，神經與肌肉直接接觸時仍然收縮。",
    text: ["配置：不使用金屬，讓神經與肌肉直接接觸。", "觀測：沒有金屬在場仍然收縮。"]
  },
  GRID_ELECTROMETER: {
    alt: "沒有生物組織的桌上，黃銅與鋅接觸後把效應餵給薄盤，提盤時細針偏轉",
    caption: "取得證據：桌上沒有生命組織；金屬接觸累積到薄盤後，細針偏轉。",
    text: ["配置：無蛙；銅與鋅相觸後，把接觸效應餵給薄盤。", "觀測：提盤時細針偏轉。", "邊界：這一格量電效應，不量肌肉收縮。"]
  },
  GRID_PILE: {
    alt: "銅片、鋅片與浸鹽水布交替疊成直立堆，雙手同觸兩端",
    caption: "取得證據：沒有動物組織；銅、鋅與浸鹽水布依序疊層後，兩端反應持續存在。",
    text: ["配置：無動物組織；銅、鋅與浸鹽水布重複疊層。", "觀測：兩端同觸時，反應持續存在，不只一下。"]
  },
  GRID_STATE: {
    alt: "六張原紙同頁排列，基準、三種蛙腿接法、細針與堆各自保留，兩道過寬主張線被限縮",
    caption: "取得證據：六張原紙已同頁合帳；每一格的配置、觀測與原主張仍可追查。",
    text: ["合帳範圍：基準、雙金屬、同材質、無金屬、電量器、堆。", "M 與 A 兩個全稱都失敗。", "不同配置必須分開記；目前不能指定統一的來源角色。"]
  }
};
Object.entries(evidenceRules).forEach(([code, rule]) => {
  assets.evidenceVisual[code] = {
    items: [{ asset: `card_${code}`, alt: rule.alt }],
    caption: rule.caption,
    readerTitle: evidenceLabels[code],
    accessibleText: rule.text
  };
  assets.evidenceSummary[code] = rule.text.join(" ");
});
assets.chapterThumbnail.ch07 = "chapter_thumbnail_ch07";

fs.writeFileSync(manifestPath, JSON.stringify(assets, null, 1) + "\n");
console.log("CH7 正式美術已登錄 assets.json");
