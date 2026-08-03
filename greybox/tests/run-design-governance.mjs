import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../..");
const read = (rel) => fs.readFileSync(path.join(repo, rel), "utf8");
const fail = (message) => {
  console.error(`✗ 設計治理｜${message}`);
  process.exitCode = 1;
};
const pass = (message) => console.log(`✓ 設計治理｜${message}`);

const decisionsPath = "greybox/decisions.md";
const decisions = read(decisionsPath);
const headingPattern = /^## GB-ADR-(\d{3})(?:\||｜)/gm;
const headings = [...decisions.matchAll(headingPattern)].map((m) => ({
  id: `GB-ADR-${m[1]}`,
  n: Number(m[1]),
  at: m.index
}));
const counts = new Map();
for (const row of headings) counts.set(row.id, (counts.get(row.id) || 0) + 1);
const duplicate = [...counts].filter(([, count]) => count !== 1).map(([id]) => id);
if (duplicate.length) fail(`GB-ADR ID 撞號或缺唯一標題：${duplicate.join("、")}`);
else pass("GB-ADR 標題無撞號");

const missing = [];
for (let n = 1; n <= 41; n += 1) {
  const id = `GB-ADR-${String(n).padStart(3, "0")}`;
  if (!counts.has(id)) missing.push(id);
}
if (missing.length) fail(`GB-ADR-001～041 不連續：缺 ${missing.join("、")}`);
else pass("GB-ADR-001～041 流水號完整");

const retiredAliasPath = "01_治理/發現之前_GB-ADR-030_信譽作為研究誠實與授權階梯_20260729.md";
const walkMarkdown = (dir, prefix = "") => {
  const out = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if ([".git", "node_modules", "archive", "05_審核"].includes(item.name)) continue;
    const rel = path.join(prefix, item.name);
    if (item.isDirectory()) out.push(...walkMarkdown(path.join(dir, item.name), rel));
    else if (item.isFile() && item.name.endsWith(".md")) out.push(rel);
  }
  return out;
};
const foreignHeadings = walkMarkdown(repo).filter((rel) =>
  rel !== decisionsPath && rel !== retiredAliasPath && /^#{1,2} GB-ADR-\d{3}(?:\||｜)/m.test(read(rel))
);
if (foreignHeadings.length) fail(`GB-ADR 標題出現在唯一流水帳之外：${foreignHeadings.join("、")}`);
else pass("唯一流水帳之外沒有第二份 active GB-ADR 標題");

const oldAlias = read(retiredAliasPath);
const gov = read("01_治理/發現之前_GOV-ADR-001_信譽作為研究誠實與授權階梯_20260729.md");
if (!oldAlias.startsWith("> [!CAUTION]\n> **RETIRED ALIAS"))
  fail("舊 GB-ADR-030 信譽檔未標 RETIRED ALIAS");
else if (!gov.startsWith("# GOV-ADR-001｜信譽作為研究誠實與授權階梯"))
  fail("GOV-ADR-001 現行檔標題不符");
else pass("GB-ADR-030 撞號已拆成 GOV-ADR-001＋退役別名");

const registry = JSON.parse(read("03_規格/current-specs.json"));
const entries = [...registry.documents, ...registry.designs];
const index = read("03_規格/README.md");
const currentTexts = [];
for (const entry of entries) {
  const absolute = path.join(repo, entry.path);
  if (!fs.existsSync(absolute)) {
    fail(`CURRENT 檔不存在：${entry.path}`);
    continue;
  }
  const body = fs.readFileSync(absolute, "utf8");
  currentTexts.push({ ...entry, body });
  const base = path.basename(entry.path);
  const firstH1 = body.split(/\r?\n/).find((line) => line.startsWith("# ")) || "";
  if (!base.includes(entry.version)) fail(`檔名版本與 registry 不符：${entry.path} / ${entry.version}`);
  if (!firstH1.includes(entry.version)) fail(`H1 版本與 registry 不符：${entry.path} / ${entry.version}`);
  if (!index.includes(entry.path)) fail(`03_規格/README.md 未列 CURRENT：${entry.path}`);
}
if (!process.exitCode) pass(`${entries.length} 份 CURRENT 檔存在，檔名／H1／索引版本一致`);

const concatenated = currentTexts.map((entry) => entry.body).join("\n");
const active = [];
for (let i = 0; i < headings.length; i += 1) {
  const row = headings[i];
  const end = i + 1 < headings.length ? headings[i + 1].at : decisions.length;
  const section = decisions.slice(row.at, end);
  if (!/^\*\*狀態\*\*：superseded\b/m.test(section)) active.push(row.id);
}
const uncovered = active.filter((id) => !concatenated.includes(id));
if (uncovered.length) fail(`active ADR 未被 CURRENT 規格引用：${uncovered.join("、")}`);
else pass(`${active.length} 筆 active／partially-superseded ADR 均有 CURRENT 規格落點`);

const chapterAndDesign = currentTexts.filter((entry) => entry.id !== "shared");
const legacyTerm = chapterAndDesign.filter((entry) => entry.body.includes("說服力"));
if (legacyTerm.length) fail(`CURRENT 章規格仍使用舊玩家名「說服力」：${legacyTerm.map((x) => x.path).join("、")}`);
else if (!currentTexts.find((entry) => entry.id === "shared")?.body.includes("GB-ADR-041"))
  fail("跨章規格未引用 GB-ADR-041");
else pass("CURRENT 章規格使用「論證對位」，相容裁決集中於跨章規格");

if (!gov.includes("`persuasion`") || !gov.includes("論證對位") || !gov.includes("GB-ADR-041"))
  fail("GOV-ADR-001 未守住信譽／論證對位／內部欄位邊界");
else pass("GOV-ADR-001 與 GB-ADR-041 名詞／存檔邊界可追查");

if (process.exitCode) process.exit(process.exitCode);
