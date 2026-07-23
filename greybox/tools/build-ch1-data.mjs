/* scenes JSON → file:// 可執行載體。規範來源永遠是 JSON。 */
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const here = path.dirname(fileURLToPath(import.meta.url));

function buildMirror(base, globalName, description, options = {}) {
  const jsonPath = path.join(here, "../data/" + base + ".json");
  const jsPath = path.join(here, "../data/" + base + ".js");
  const data = JSON.parse(readFileSync(jsonPath, "utf8"));
  const body = JSON.stringify(data, null, options.indent || 1);
  const pad = options.wrapperIndent || " ";
  const header = options.header || `/* data/${base}.js — ${description}（file:// 相容）。規範鏡像:${base}.json。
   ⚠ 本檔為生成物；請改 ${base}.json 後執行 node tools/build-ch1-data.mjs。 */
`;
  const output = `${header}(function (root) {
${pad}"use strict";
${pad}var data = ${body};
${pad}if (typeof module === "object" && module.exports) { module.exports = data; }
${pad}else { root.GB = root.GB || {}; root.GB.DATA = root.GB.DATA || {}; root.GB.DATA.${globalName} = data; }
})(typeof self !== "undefined" ? self : this);
`;
  writeFileSync(jsPath, output);
}

export function buildCh1Data() {
  buildMirror("scenes", "scenes", "第一章場景執行載體");
  buildMirror("debate", "debate", "第一章辯論執行載體", {
    indent: 2,
    wrapperIndent: "  ",
    header: `/* data/debate.js — 執行載體(file:// 相容)。規範鏡像:debate.json(R-DATA-05 測試保證一致)
   legacy 欄位=切片(P3 單場);chapter 欄位=全章辯論(M3,R-DEB-09~13)。ADR-005/008 已適用;M3 外科修正 20260719。 */
`
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildCh1Data();
  console.log("scenes.js、debate.js 已由 JSON 重建");
}
