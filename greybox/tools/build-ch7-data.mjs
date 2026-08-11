/* scenes7/histfacts7 JSON → file:// 可執行載體；JSON 永遠是規範來源。 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));

function buildMirror(base, globalName, description) {
  const jsonPath = path.join(here, "../data/" + base + ".json");
  const jsPath = path.join(here, "../data/" + base + ".js");
  const data = JSON.parse(readFileSync(jsonPath, "utf8"));
  const body = JSON.stringify(data, null, 1);
  const output = `/* data/${base}.js — ${description}（file:// 相容）。規範鏡像:${base}.json。
   ⚠ 本檔為生成物；請改 ${base}.json 後執行 node tools/build-ch7-data.mjs。 */
(function (root) {
 "use strict";
 var data = ${body};
 if (typeof module === "object" && module.exports) { module.exports = data; }
 else { root.GB = root.GB || {}; root.GB.DATA = root.GB.DATA || {}; root.GB.DATA.${globalName} = data; }
})(typeof self !== "undefined" ? self : this);
`;
  writeFileSync(jsPath, output);
}

buildMirror("scenes7", "scenes7", "第七章場景執行載體");
buildMirror("histfacts7", "histfacts7", "第七章史實頁執行載體");
console.log("scenes7.js / histfacts7.js 已由 JSON 重建");
