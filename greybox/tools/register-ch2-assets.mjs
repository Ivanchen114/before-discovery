/* 第二章 P0/P1 runtime manifest → 全章共用 assets.json。可重跑、不得覆蓋第一章映射。 */
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../..");
const p = path.join(repo, "greybox/data/assets.json");
const data = JSON.parse(readFileSync(p, "utf8"));
const manifest = JSON.parse(readFileSync(path.join(repo, "art/source/production/ch02/asset-manifest.json"), "utf8"));
const byId = Object.fromEntries(data.entries.map((e) => [e.id, e]));
const kindOf = { background: "bg", dialoguePortrait: "portrait", dialogueActionPortrait: "portrait",
  persistentApparatusFigure: "prop", slotFigure: "prop", evidenceProp: "prop", evidenceCard: "card", chapterRailThumbnail: "cg" };

for (const a of manifest.assets) {
  const e = {
    id: a.id, kind: kindOf[a.role], label: a.id, path: a.path, firstScreen: a.id === "chapter_thumbnail_ch02",
    w: a.width || (a.role.includes("Portrait") ? 800 : 1200), h: a.height || (a.role.includes("Portrait") ? 1200 : 675),
    sourceMaster: "第二章 P0/P1；art/source/production/ch02/asset-manifest.json"
  };
  if (!byId[a.id]) { data.entries.push(e); byId[a.id] = e; }
  else Object.assign(byId[a.id], e);
}

Object.assign(data.sceneBg, {
  "B0-1": "bg_workshop_padua", "B0-2": "bg_workshop_padua",
  "B1-1": "bg_workshop_padua_night", "B1-2": "bg_workshop_padua_night",
  "B1-3": "bg_ch02_padua_university_arcade_morning", "B1-4": "bg_canal_dusk",
  "B2-1": "bg_workshop_padua", "B2-2": "bg_workshop_padua", "B2-3": "bg_workshop_padua",
  "B2-4": "bg_workshop_padua", "B2-5": "bg_workshop_padua_night",
  "B3-1": "bg_lecture_hall_audience", "B3-D": "bg_lecture_hall_audience",
  "B3-F": "bg_workshop_padua", "SC-R1": "bg_workshop_padua",
  "B3-6": "bg_lecture_hall_audience", "BE-1": "bg_canal_dusk", "BE-2": "bg_moon"
});

data.sceneDialoguePortrait = data.sceneDialoguePortrait || {};
const workshopScenes = ["B0-1","B0-2","B1-1","B1-2","B1-3","B1-4","B2-1","B2-2","B2-3","B2-4","B2-5","B3-F","SC-R1","BE-1","BE-2"];
for (const id of workshopScenes) data.sceneDialoguePortrait[id] = Object.assign({}, data.sceneDialoguePortrait[id], {
  "伽利略": id === "B2-1" || id === "B2-3" ? "dialogue_galileo44_explaining" : "dialogue_galileo44_focused",
  "辛普里奧": id === "B0-2" ? "dialogue_simplicio76_expectant" : "dialogue_simplicio76_formidable_calm"
});
for (const id of ["B3-1","B3-D","B3-6"]) data.sceneDialoguePortrait[id] = Object.assign({}, data.sceneDialoguePortrait[id], {
  "伽利略": "dialogue_galileo44_explaining", "辛普里奧": id === "B3-6" ? "dialogue_simplicio76_almost_warm" : "dialogue_simplicio76_expectant",
  "主持": "dialogue_host_formal"
});

data.lineDialoguePortrait = (data.lineDialoguePortrait || []).filter((x) => x.note !== "ch02-p0p1");
data.lineDialoguePortrait.push(
  { scene: "B2-3", speaker: "伽利略", match: "下落高度二十五格", asset: "dialogue_galileo44_deadpan", note: "ch02-p0p1" },
  { scene: "B3-D", speaker: "辛普里奧", match: "提筆,在自己的計算紙上劃掉了一行", asset: "dialogue_simplicio76_strikeout", note: "ch02-p0p1" },
  { scene: "B3-6", speaker: "辛普里奧", match: "下一回,老夫出題", asset: "dialogue_simplicio76_almost_warm", note: "ch02-p0p1" }
);

data.workshopApparatusAsset = "workshop2_projectile_apparatus_master";
data.workshopPartAsset = {
  latchRelease: "part_latchRelease", handRelease: "part_handRelease",
  polishedEdge: "part_polishedEdge", roughEdge: "part_roughEdge",
  rakedSand: "part_rakedSand", eyeBoard: "part_eyeBoard", fineSandPlumb: "part_fineSandPlumb"
};
data.chapterThumbnail = Object.assign({}, data.chapterThumbnail, { ch02: "chapter_thumbnail_ch02" });
Object.assign(data.evidenceSummary, {
  F1: "船在等速前行時，桅頂落球仍落回桅腳——共同前行不會消失。",
  F2: "同一裝置下，射程隨下落高度的開方增長；換同徑木球仍保持。",
  F3: "水平拋出與垂直放下的兩顆球，在相同條件下近乎同時觸地。",
  F4: "沾墨軌跡從離手第一寸就開始彎，找不到真正的直飛段。",
  F5: "低速短程的骨架站得住；長程砲彈的偏離標出空氣開始主導的邊界。",
  S3: "砲手的三段圖是真實問題來源，不是證明三段論正確的主證。",
  S4: "前人的實驗筆記提供線索，但主張仍須由你自己的裝置與數據成立。"
});
Object.assign(data.sceneBgm, {
  "B0-1":"workshop", "B0-2":"challenge", "B1-1":"study", "B1-2":"rain", "B1-3":"study", "B1-4":"dusk",
  "B2-1":"workshop", "B2-2":"workshop", "B2-3":"workshop", "B2-4":"workshop", "B2-5":"challenge",
  "B3-1":"hall", "B3-D":"hall", "B3-F":"debrief", "SC-R1":"workshop", "B3-6":"silence",
  "BE-1":"dusk", "BE-2":"travelerMoon"
});

writeFileSync(p, JSON.stringify(data, null, 1) + "\n");
console.log("第二章 P0/P1 已登錄 assets.json");
