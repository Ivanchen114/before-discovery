import { createRequire } from "module";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import {
  assetVersionFor, localScriptAssetRefs
} from "../tools/build-stage.mjs";

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const seriesJson = JSON.parse(readFileSync(path.join(here, "../data/series.json"), "utf8"));
const seriesJs = require("../data/series.js");
const html = readFileSync(path.join(here, "../stage.html"), "utf8");
const ui = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf8");
const stageUi = readFileSync(path.join(here, "../src/stage-ui.js"), "utf8");
const scenes4 = JSON.parse(readFileSync(path.join(here, "../data/scenes4.json"), "utf8"));
const ch4Script = readFileSync(
  path.join(here, "../../04_劇本/第四章完整劇本_月亮的無盡墜落_v0.2-review.md"),
  "utf8"
);
const vercel = JSON.parse(readFileSync(path.join(here, "../../vercel.json"), "utf8"));
const sitemap = readFileSync(path.join(here, "../../sitemap.xml"), "utf8");

function assert(ok, message) {
  if (!ok) throw new Error(message);
}

assert(JSON.stringify(seriesJs) === JSON.stringify(seriesJson), "series.js 與 series.json 不同步");
assert(seriesJson.schemaVersion === 1, "系列章節資料版本錯誤");
assert(Array.isArray(seriesJson.chapters) && seriesJson.chapters.length >= 4, "系列章節資料不足");

const ids = new Set();
const routes = new Set();
const introHistoryAnchors = {
  ch1: "伽利略",
  ch2: "圭多巴爾多",
  ch3: "1632 年《對話》",
  ch4: "1684 年哈雷",
  ch5: "杜夏特萊"
};
seriesJson.chapters.forEach((chapter, index) => {
  assert(chapter.id === `ch${index + 1}`, `章節 id 次序錯誤:${chapter.id}`);
  assert(/^ch\d{2}$/.test(chapter.route), `章節 route 格式錯誤:${chapter.route}`);
  assert(!ids.has(chapter.id), `章節 id 重複:${chapter.id}`);
  assert(!routes.has(chapter.route), `章節 route 重複:${chapter.route}`);
  assert(chapter.number && chapter.label && chapter.title && chapter.question && chapter.intro,
    `章節欄位不完整:${chapter.id}`);
  assert(chapter.intro.includes(introHistoryAnchors[chapter.id]),
    `章節簡介缺少真實歷史錨點:${chapter.id}`);
  ids.add(chapter.id);
  routes.add(chapter.route);
});

for (const fragment of [
  '<link rel="icon" type="image/svg+xml" sizes="any" href="../public/assets/icons/favicon-v2.svg">',
  'id="btnPrevChapter"',
  'id="btnNextChapter"',
  'id="btnPrevChapter" hidden aria-hidden="true" tabindex="-1"',
  'id="btnNextChapter" hidden aria-hidden="true" tabindex="-1"',
  'id="chapterDirectory"',
  'id="chapterRail"',
  'id="chapterPreviewYears"',
  'id="chapterPreviewQuestion"',
  'id="chapterPreviewIntro"',
  "current.intro",
  '"第 " + (currentIndex + 1) + " 章・共 " + chapters.length + " 章"',
  "#titleCard .chapterDirectory > summary { position: relative",
  'class="chapterDirectoryPanel" role="dialog" aria-modal="true"',
  'id="btnCloseChapterDirectory"',
  'class="chapterDirectoryBackdrop"',
  "目前選擇・已完成",
  "尚未開始",
  "有未完成進度",
  'event.key === "Escape"'
]) assert(html.includes(fragment), `系列首頁缺少可擴充結構:${fragment}`);

const seriesScript = localScriptAssetRefs(html)
  .find((ref) => ref.path === "data/series.js");
assert(seriesScript, "系列首頁缺少 data/series.js 掛點");
assert(seriesScript.version === assetVersionFor(seriesScript.path),
  "系列首頁 data/series.js 快取鍵未與內容雜湊同步");

assert(!ui.includes("（舞台版）"), "正式玩家分頁標題仍含內部用的「舞台版」");
assert(ui.includes('current.title + "｜互動物理史遊戲"'), "正式玩家分頁標題缺少產品定位");
assert(!html.includes('content: "＋"'), "章節選擇器仍使用容易和進度文字重疊的加號");
assert(!html.includes("repeat(4,minmax(0,1fr))"), "系列首頁仍把章節列寫死為四欄");
assert(!html.includes('data-chapter="ch01"'), "系列首頁仍在 HTML 寫死章節卡");
assert(!ui.includes('completedCount + "/4"'), "系列進度仍寫死總章數");
for (const fragment of [
  "SERIES_CHAPTERS.forEach",
  "renderChapterDirectory(progress, current)",
  "setChapterStep",
  "chapter.question",
  "已自動儲存｜",
  'status.textContent = complete ? "✓ 已完成"'
]) assert(ui.includes(fragment), `系列首頁缺資料驅動行為:${fragment}`);

const chapter4 = seriesJson.chapters.find((chapter) => chapter.id === "ch4");
assert(chapter4?.title === "月亮的無盡墜落", "第四章章名未更新於系列資料");
assert(scenes4.title === chapter4.title, "第四章 runtime 與系列資料章名不同步");
assert(JSON.stringify(scenes4).includes(`第四章《${chapter4.title}》`), "第四章章名揭曉未同步");
assert(stageUi.includes(chapter4.title), "章末接力卡未同步第四章章名");
assert(ch4Script.includes(`# 第四章完整劇本：${chapter4.title}`), "第四章劇本標題未同步");

const dataRoute = (vercel.rewrites || []).find((route) => route.source === "/data/:path*");
const srcRoute = (vercel.rewrites || []).find((route) => route.source === "/src/:path*");
const stageRedirect = (vercel.redirects || []).find((route) => route.source === "/stage.html");
const internalStageRedirect = (vercel.redirects || []).find((route) => route.source === "/greybox/stage.html");
assert(vercel.buildCommand === "cp greybox/stage.html index.html", "部署未把系列首頁產生為根 index.html");
assert(!Object.prototype.hasOwnProperty.call(vercel, "routes"), "不得混用 legacy routes 與正式 rewrites／redirects");
assert(dataRoute?.destination === "/greybox/data/:path*", "根網址缺少 data 資源路由");
assert(srcRoute?.destination === "/greybox/src/:path*", "根網址缺少 src 資源路由");
assert(stageRedirect?.destination === "/" && stageRedirect.permanent === true, "根層 stage.html 未永久收斂到正式網址");
assert(internalStageRedirect?.destination === "/" && internalStageRedirect.permanent === true, "內部舞台網址未永久收斂到正式網址");
assert(html.includes('<link rel="canonical" href="https://before-discovery.vercel.app/">'), "系列首頁 canonical 不是正式根網址");
assert(sitemap.includes("<loc>https://before-discovery.vercel.app/</loc>"), "sitemap 未收錄正式根網址");
assert(!sitemap.includes("/greybox/stage.html"), "sitemap 不得收錄內部舞台路徑");

console.log("  ✓ 系列首頁 v3|目前旅程＋資料驅動章節目錄，可擴充且第四章章名同步");
console.log("  ✓ 正式根入口|根網址直接提供系列首頁，資源路由與 canonical 收斂");
