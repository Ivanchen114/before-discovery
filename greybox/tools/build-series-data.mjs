/* series.json → file:// 可執行載體。首頁章節目錄的規範來源永遠是 JSON。 */
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const here = path.dirname(fileURLToPath(import.meta.url));
const jsonPath = path.join(here, "../data/series.json");
const jsPath = path.join(here, "../data/series.js");

export function buildSeriesData() {
  const data = JSON.parse(readFileSync(jsonPath, "utf8"));
  const body = JSON.stringify(data, null, 1);
  const output = `/* data/series.js — 系列章節目錄（file:// 相容）。規範鏡像:series.json。
   ⚠ 本檔為生成物；請改 series.json 後執行 node tools/build-series-data.mjs。 */
(function (root) {
 "use strict";
 var data = ${body};
 if (typeof module === "object" && module.exports) { module.exports = data; }
 else { root.GB = root.GB || {}; root.GB.DATA = root.GB.DATA || {}; root.GB.DATA.series = data; }
})(typeof self !== "undefined" ? self : this);
`;
  writeFileSync(jsPath, output);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildSeriesData();
  console.log("series.js 已由 series.json 重建");
}
