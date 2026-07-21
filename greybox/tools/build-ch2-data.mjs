/* scenes2/debate2 JSON → file:// 可執行載體。規範來源永遠是 JSON。 */
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
   ⚠ 本檔為生成物；請改 ${base}.json 後執行 node tools/build-ch2-data.mjs。 */
(function (root) {
 "use strict";
 var data = ${body};
 if (typeof module === "object" && module.exports) { module.exports = data; }
 else { root.GB = root.GB || {}; root.GB.DATA = root.GB.DATA || {}; root.GB.DATA.${globalName} = data; }
})(typeof self !== "undefined" ? self : this);
`;
  writeFileSync(jsPath, output);
}

export function buildCh2Data() {
  buildMirror("scenes2", "scenes2", "第二章場景執行載體");
  buildMirror("debate2", "debate2", "第二章辯論執行載體");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildCh2Data();
  console.log("scenes2.js / debate2.js 已由 JSON 重建");
}
