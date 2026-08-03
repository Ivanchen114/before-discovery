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
for (let n = 1; n <= 42; n += 1) {
  const id = `GB-ADR-${String(n).padStart(3, "0")}`;
  if (!counts.has(id)) missing.push(id);
}
if (missing.length) fail(`GB-ADR-001～042 不連續：缺 ${missing.join("、")}`);
else pass("GB-ADR-001～042 流水號完整");

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

const active = [];
for (let i = 0; i < headings.length; i += 1) {
  const row = headings[i];
  const end = i + 1 < headings.length ? headings[i + 1].at : decisions.length;
  const section = decisions.slice(row.at, end);
  if (!/^\*\*狀態\*\*：superseded\b/m.test(section)) active.push(row.id);
}

const coverage = registry.adrCoverage || {};
const activeSet = new Set(active);
const declaredSet = new Set(Object.keys(coverage));
const missingCoverage = active.filter((id) => !declaredSet.has(id));
const staleCoverage = [...declaredSet].filter((id) => !activeSet.has(id));
if (registry.schemaVersion !== 2) fail("current-specs registry 尚未使用逐檔 ADR 語意落點 schema 2");
if (missingCoverage.length) fail(`active ADR 未宣告指定 CURRENT 文件：${missingCoverage.join("、")}`);
if (staleCoverage.length) fail(`已 superseded／不存在的 ADR 仍宣告為 CURRENT：${staleCoverage.join("、")}`);

const byEntryId = new Map(currentTexts.map((entry) => [entry.id, entry]));
const semanticRows = new Map();
for (const entry of currentTexts) {
  const marker = entry.body.match(/^## .*ADR 語意落點\s*$/m);
  if (!marker) continue;
  const sectionStart = marker.index;
  const remainder = entry.body.slice(sectionStart + marker[0].length);
  const nextHeading = remainder.search(/^## /m);
  const section = nextHeading < 0 ? remainder : remainder.slice(0, nextHeading);
  const rows = new Map();
  for (const match of section.matchAll(/^\|\s*(GB-ADR-\d{3})\s*\|\s*([^|\n]+?)\s*\|\s*$/gm)) {
    const id = match[1];
    const summary = match[2].replace(/[`*_]/g, "").trim();
    if (rows.has(id)) fail(`${entry.path} 的 ADR 語意列重複：${id}`);
    rows.set(id, summary);
  }
  semanticRows.set(entry.id, rows);
}

const semanticGaps = [];
for (const id of active) {
  const targets = coverage[id];
  if (!Array.isArray(targets) || targets.length === 0) {
    semanticGaps.push(`${id}:未指定文件`);
    continue;
  }
  if (new Set(targets).size !== targets.length) semanticGaps.push(`${id}:重複文件`);
  for (const target of targets) {
    const entry = byEntryId.get(target);
    if (!entry) {
      semanticGaps.push(`${id}:${target} 不在 CURRENT registry`);
      continue;
    }
    const summary = semanticRows.get(target)?.get(id) || "";
    if (!summary) semanticGaps.push(`${id}:${target} 缺獨立語意列`);
    else if (summary.length < 18 || /^(?:現行裁決|現行用途|見|依)\b/.test(summary))
      semanticGaps.push(`${id}:${target} 語意過薄`);
    else if (/GB-ADR-\d{3}/.test(summary))
      semanticGaps.push(`${id}:${target} 只用另一個 ADR 編號代替語意`);
  }
}
if (semanticGaps.length) fail(`ADR 指定落點未形成語意：${semanticGaps.join("、")}`);
else pass(`${active.length} 筆 active／partially-superseded ADR 均在指定 CURRENT 文件有獨立語意列`);

const sharedText = byEntryId.get("shared")?.body || "";
if (sharedText.includes("機器覆蓋索引")) fail("跨章規格仍以全號碼機器索引冒充章別語意落點");
else if (/\|\s*GB-ADR-\d{3}～GB-ADR-\d{3}\s*\|/.test(sharedText))
  fail("跨章規格仍以 ADR 範圍列取代逐筆語意");
else pass("跨章索引不再替章別規格吞掉 ADR 語意責任");

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
