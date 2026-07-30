/* tools/build-stage.mjs — C-2 拆分(GB-ADR-015):src/stage/*.part.js 依檔名序串接 → src/stage-ui.js。
   設計:單一 IIFE 閉包不動(part 檔共享作用域,串接後 byte 級等價),file:// 零建置負擔;
   真模組化(命名空間)於第二章期間漸進。直接改 stage-ui.js=白改:改 parts 後執行本腳本。
   驗證:tests/run-node.mjs 落後檢測=串接結果 ≡ 倉庫內 stage-ui.js(tokens.css 先例)。 */
import { readFileSync, writeFileSync, readdirSync } from "fs";
import { fileURLToPath } from "url";
import { createHash } from "crypto";
import path from "path";

const here = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(here, "..");
const partsDir = path.join(here, "../src/stage");
export function concatParts() {
  return readdirSync(partsDir).filter((f) => f.endsWith(".part.js")).sort()
    .map((f) => readFileSync(path.join(partsDir, f), "utf-8")).join("\n");
}
export function assetVersionFor(relativePath, source) {
  const content = source === undefined
    ? readFileSync(path.join(rootDir, relativePath), "utf-8")
    : source;
  return "asset-" + createHash("sha256").update(content).digest("hex").slice(0, 12);
}
export function stageAssetVersion(source = concatParts()) {
  return assetVersionFor("src/stage-ui.js", source);
}
export function localScriptAssetRefs(html) {
  const refs = [];
  for (const tagMatch of html.matchAll(/<script\b[^>]*>/gi)) {
    const srcMatch = tagMatch[0].match(
      /\bsrc\s*=\s*(["'])((?:src|data)\/[^"'?]+\.js)(?:\?v=([^"']*))?\1/i
    );
    if (srcMatch) {
      refs.push({
        path: srcMatch[2],
        version: srcMatch[3] || "",
        quote: srcMatch[1]
      });
    }
  }
  return refs;
}
export function withScriptAssetVersions(html) {
  return html.replace(/<script\b[^>]*>/gi, function (tag) {
    return tag.replace(
      /\bsrc\s*=\s*(["'])((?:src|data)\/[^"'?]+\.js)(?:\?v=[^"']*)?\1/i,
      function (_, quote, relativePath) {
        return "src=" + quote + relativePath + "?v=" +
          assetVersionFor(relativePath) + quote;
      }
    );
  });
}
export function assertLocalScriptAssetVersions(html, htmlName) {
  const refs = localScriptAssetRefs(html);
  if (!refs.length)
    throw new Error((htmlName || "HTML") + " 缺少本機 JavaScript 掛點");
  refs.forEach(function (ref) {
    const expected = assetVersionFor(ref.path);
    if (ref.version !== expected) {
      throw new Error((htmlName || "HTML") +
        " 快取鍵不符合檔案內容:" + ref.path);
    }
  });
  return refs;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const source = concatParts();
  const version = stageAssetVersion(source);
  writeFileSync(path.join(here, "../src/stage-ui.js"), source);
  ["stage.html", "chapter.html", "chapter2.html", "chapter3.html", "index.html"]
    .forEach(function (htmlName) {
      const htmlPath = path.join(rootDir, htmlName);
      const html = readFileSync(htmlPath, "utf-8");
      const nextHtml = withScriptAssetVersions(html);
      assertLocalScriptAssetVersions(nextHtml, htmlName);
      writeFileSync(htmlPath, nextHtml);
    });
  console.log("stage-ui.js 已自 " +
    readdirSync(partsDir).filter((f) => f.endsWith(".part.js")).length +
    " 個 part 檔重建；五入口快取鍵已按內容更新，舞台 " + version);
}
