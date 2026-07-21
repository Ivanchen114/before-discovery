/* assets.json → assets.js（file:// 可執行載體）。 */
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const here = path.dirname(fileURLToPath(import.meta.url));
const jsonPath = path.join(here, "../data/assets.json");
const jsPath = path.join(here, "../data/assets.js");

export function buildAssets() {
  const data = JSON.parse(readFileSync(jsonPath, "utf8"));
  const body = JSON.stringify(data, null, 1);
  return `/* data/assets.js — 執行載體(file:// 相容)。規範鏡像:assets.json（測試把關）。
   ⚠ 本檔為生成物；請改 assets.json 後執行 node tools/build-assets.mjs。 */
(function (root) {
 "use strict";
 var data = ${body};
 if (typeof module === "object" && module.exports) { module.exports = data; }
 else { root.GB = root.GB || {}; root.GB.DATA = root.GB.DATA || {}; root.GB.DATA.assets = data; }
})(typeof self !== "undefined" ? self : this);
`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(jsPath, buildAssets());
  console.log("assets.js 已由 assets.json 重建");
}
