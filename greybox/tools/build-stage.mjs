/* tools/build-stage.mjs — C-2 拆分(GB-ADR-015):src/stage/*.part.js 依檔名序串接 → src/stage-ui.js。
   設計:單一 IIFE 閉包不動(part 檔共享作用域,串接後 byte 級等價),file:// 零建置負擔;
   真模組化(命名空間)於第二章期間漸進。直接改 stage-ui.js=白改:改 parts 後執行本腳本。
   驗證:tests/run-node.mjs 落後檢測=串接結果 ≡ 倉庫內 stage-ui.js(tokens.css 先例)。 */
import { readFileSync, writeFileSync, readdirSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const here = path.dirname(fileURLToPath(import.meta.url));
const partsDir = path.join(here, "../src/stage");
export function concatParts() {
  return readdirSync(partsDir).filter((f) => f.endsWith(".part.js")).sort()
    .map((f) => readFileSync(path.join(partsDir, f), "utf-8")).join("\n");
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(path.join(here, "../src/stage-ui.js"), concatParts());
  console.log("stage-ui.js 已自 " + readdirSync(partsDir).filter((f) => f.endsWith(".part.js")).length + " 個 part 檔重建");
}
