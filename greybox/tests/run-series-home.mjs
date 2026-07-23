import { createRequire } from "module";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const seriesJson = JSON.parse(readFileSync(path.join(here, "../data/series.json"), "utf8"));
const seriesJs = require("../data/series.js");
const html = readFileSync(path.join(here, "../stage.html"), "utf8");
const ui = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf8");
const stageUi = readFileSync(path.join(here, "../src/stage-ui.js"), "utf8");
const scenes4 = JSON.parse(readFileSync(path.join(here, "../data/scenes4.json"), "utf8"));
const ch4Script = readFileSync(
  path.join(here, "../../04_劇本/第四章完整劇本_月亮一直在掉_v0.1-draft.md"),
  "utf8"
);

function assert(ok, message) {
  if (!ok) throw new Error(message);
}

assert(JSON.stringify(seriesJs) === JSON.stringify(seriesJson), "series.js 與 series.json 不同步");
assert(seriesJson.schemaVersion === 1, "系列章節資料版本錯誤");
assert(Array.isArray(seriesJson.chapters) && seriesJson.chapters.length >= 4, "系列章節資料不足");

const ids = new Set();
const routes = new Set();
seriesJson.chapters.forEach((chapter, index) => {
  assert(chapter.id === `ch${index + 1}`, `章節 id 次序錯誤:${chapter.id}`);
  assert(/^ch\d{2}$/.test(chapter.route), `章節 route 格式錯誤:${chapter.route}`);
  assert(!ids.has(chapter.id), `章節 id 重複:${chapter.id}`);
  assert(!routes.has(chapter.route), `章節 route 重複:${chapter.route}`);
  assert(chapter.number && chapter.label && chapter.title && chapter.question, `章節欄位不完整:${chapter.id}`);
  ids.add(chapter.id);
  routes.add(chapter.route);
});

for (const fragment of [
  'src="data/series.js"',
  'id="btnPrevChapter"',
  'id="btnNextChapter"',
  'id="chapterDirectory"',
  'id="chapterRail"',
  "repeat(auto-fit,minmax(220px,1fr))"
]) assert(html.includes(fragment), `系列首頁缺少可擴充結構:${fragment}`);

assert(!html.includes("repeat(4,minmax(0,1fr))"), "系列首頁仍把章節列寫死為四欄");
assert(!html.includes('data-chapter="ch01"'), "系列首頁仍在 HTML 寫死章節卡");
assert(!ui.includes('completedCount + "/4"'), "系列進度仍寫死總章數");
for (const fragment of [
  "SERIES_CHAPTERS.forEach",
  "renderChapterDirectory(progress, current)",
  "setChapterStep",
  "chapter.question",
  'status.textContent = complete ? "✓ 已完成"'
]) assert(ui.includes(fragment), `系列首頁缺資料驅動行為:${fragment}`);

const chapter4 = seriesJson.chapters.find((chapter) => chapter.id === "ch4");
assert(chapter4?.title === "月亮的無盡墜落", "第四章章名未更新於系列資料");
assert(scenes4.title === chapter4.title, "第四章 runtime 與系列資料章名不同步");
assert(JSON.stringify(scenes4).includes(`第四章《${chapter4.title}》`), "第四章章名揭曉未同步");
assert(stageUi.includes(chapter4.title), "章末接力卡未同步第四章章名");
assert(ch4Script.includes(`# 第四章完整劇本：${chapter4.title}`), "第四章劇本標題未同步");

console.log("  ✓ 系列首頁 v3|目前旅程＋資料驅動章節目錄，可擴充且第四章章名同步");
