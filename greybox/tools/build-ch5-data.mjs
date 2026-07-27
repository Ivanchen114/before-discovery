/* scenes5/debate5/histfacts5 JSON → file:// 可執行載體。規範來源永遠是 JSON。 */
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const here = path.dirname(fileURLToPath(import.meta.url));

function buildMirror(base, globalName, description) {
  const jsonPath = path.join(here, "../data/" + base + ".json");
  const jsPath = path.join(here, "../data/" + base + ".js");
  const data = JSON.parse(readFileSync(jsonPath, "utf8"));
  const body = JSON.stringify(data, null, 1);
  const output = `/* data/${base}.js — ${description}（file:// 相容）。規範鏡像:${base}.json。
   ⚠ 本檔為生成物；請改 ${base}.json 後執行 node tools/build-ch5-data.mjs。 */
(function (root) {
 "use strict";
 var data = ${body};
 if (typeof module === "object" && module.exports) { module.exports = data; }
 else { root.GB = root.GB || {}; root.GB.DATA = root.GB.DATA || {}; root.GB.DATA.${globalName} = data; }
})(typeof self !== "undefined" ? self : this);
`;
  writeFileSync(jsPath, output);
}

export function buildCh5Data() {
  buildMirror("scenes5", "scenes5", "第五章場景執行載體");
  buildMirror("debate5", "debate5", "第五章辯論執行載體");
  buildMirror("histfacts5", "histfacts5", "第五章史實頁執行載體");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildCh5Data();
  console.log("scenes5.js / debate5.js / histfacts5.js 已由 JSON 重建");
}
