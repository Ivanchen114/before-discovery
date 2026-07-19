/* tools/gen_tokens.mjs — token 管線生成器(美術規格 v0.2 §5.7;Claude 負責生成器,Sol 負責語意與值)
   來源:art/style/tokens.json(唯一人工編輯來源;不存在時用 greybox/data/tokens.example.json 供測試)
   輸出:public/assets/global/tokens.css(runtime 衍生檔,禁止手改;檔頭嵌來源 hash 供落後檢測)
   用法:node greybox/tools/gen_tokens.mjs [--check]   (--check:僅驗證不寫檔) */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { createHash } from "crypto";
import path from "path";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..", "..");
const SRC_REAL = path.join(root, "art", "style", "tokens.json");
const SRC_EXAMPLE = path.join(here, "..", "data", "tokens.example.json");
const OUT = path.join(root, "public", "assets", "global", "tokens.css");

/* 必要 token(美術規格 §1.3 + §5.6);缺一即失敗 */
const REQUIRED = [
  "color-surface-world", "color-surface-notebook", "color-ink-primary", "color-ink-secondary",
  "color-evidence", "color-warning", "color-success", "color-chapter-accent", "color-focus",
  "motion-instant", "motion-fast", "motion-medium", "motion-dramatic"
];

export function validateTokens(data) {
  if (!data || typeof data !== "object" || !data.tokens) throw new Error("tokens.json 缺 tokens 欄位");
  const names = Object.keys(data.tokens);
  const seen = new Set();
  for (const n of names) {
    if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(n)) throw new Error("token 名稱非 kebab-case:" + n);
    if (seen.has(n)) throw new Error("token 名稱重複:" + n);
    seen.add(n);
    const v = data.tokens[n];
    if (typeof v !== "string" || !v.trim()) throw new Error("token 值須為非空字串:" + n);
  }
  for (const r of REQUIRED) {
    if (!seen.has(r)) throw new Error("缺必要 token:" + r);
  }
  return true;
}

export function generateCss(data, sourceText) {
  validateTokens(data);
  const hash = createHash("sha256").update(sourceText).digest("hex").slice(0, 16);
  const lines = Object.keys(data.tokens).map((n) => `  --${n}: ${data.tokens[n]};`);
  return `/* tokens.css — 由 tools/gen_tokens.mjs 產生,禁止手改(§5.7)。
   source: ${data._source || "tokens.json"} | source-hash: ${hash}
   落後檢測:重跑生成器比對 hash;不符=來源已改而未再生。 */
:root {
${lines.join("\n")}
}
`;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const src = existsSync(SRC_REAL) ? SRC_REAL : SRC_EXAMPLE;
  const text = readFileSync(src, "utf-8");
  const data = JSON.parse(text);
  data._source = path.basename(src) + (src === SRC_EXAMPLE ? "(example)" : "");
  const css = generateCss(data, text);
  if (process.argv.includes("--check")) {
    console.log("tokens 驗證通過:", src, "|", Object.keys(data.tokens).length, "個 token");
  } else {
    mkdirSync(path.dirname(OUT), { recursive: true });
    writeFileSync(OUT, css);
    console.log("tokens.css 已產生:", OUT, "|來源:", src);
  }
}
