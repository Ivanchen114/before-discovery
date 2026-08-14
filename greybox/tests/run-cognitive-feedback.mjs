import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));
const ui = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf8");
const evidenceLaw = readFileSync(path.join(here,
  "../../02_設計/發現之前_實驗證據所有權與認知進階原則_v0.1.md"), "utf8");

function block(name, nextName) {
  const start = ui.indexOf("function " + name + "(");
  const end = nextName ? ui.indexOf("function " + nextName + "(", start + 1) : ui.length;
  if (start < 0 || end <= start) throw new Error("找不到回饋函式：" + name);
  return ui.slice(start, end);
}
function requireText(source, fragments, label) {
  for (const fragment of fragments)
    if (!source.includes(fragment)) throw new Error(label + " 缺少：" + fragment);
}
function forbidText(source, fragments, label) {
  for (const fragment of fragments)
    if (source.includes(fragment)) throw new Error(label + " 不該把純操作錯誤人物化：" + fragment);
}

const common = block("sayWorkbenchCorrection", "sayDebateBeat");
requireText(common, [
  'lines.push({ speaker: "旅人(你)"',
  "lines.push({ speaker: speaker",
  "sayIntoDialogue(lines"
], "跨章雙層回饋");
if (common.indexOf('speaker: "旅人(你)"') > common.indexOf("speaker: speaker"))
  throw new Error("認知錯誤必須先留下玩家實際主張，再由人物質詢");

const ch1 = block("lab1AssertionCorrection", "bindLabButtons");
requireText(ch1, ["伽利略", "兩筆主張皆須成立", "變因不符", "條件欄"], "第一章");

const ch2 = block("cat2SayFailure", "doLab2");
requireText(ch2, ["concept-mismatch", "law-source-ball", "compare-mismatch", "伽利略"], "第二章");
forbidText(ch2, ["wrong-order", "prediction-required", "bad-prediction"], "第二章");

const ch3 = block("ship3SayDossierCorrection", "ship3DossierHasVisibleShore");
requireText(ch3, [
  "ship3DossierScopeOptions", "ship3DossierSourceGroups", "dossier-scope-overread",
  "dossier-dirty-release", "dossier-speed-paper-missing", "dossier-variable-mismatch",
  "dossier-comparison-missing", "馬蒂厄", "艾蒂安", "維達爾船長", "伽桑狄"
], "第三章");

const ch4 = block("orbit4SayCorrection", "doOrbit");
requireText(ch4, [
  "judgeScaleRatio", "judgeScaleRelation", "judgePlanetComparison",
  "stampLedgerCell", "sealModelComparison", "牛頓", "哈雷"
], "第四章");
forbidText(ch4, ["commitOrbitBeat", "bad-scale-ratio", "ledger-row-required"], "第四章");
requireText(ui, [
  'var paperDraft = orbit4ClaimDraft["k1-paper-two-questions"]',
  'input.checked = chosen',
  'paperDraft.firstPicked[run.id] = input.checked',
  'paperDraft.secondPicked[run.id] = input.checked',
  'paperDraft.repairId = secondResult.repairId',
  'paperDraft.firstReplyAcknowledged',
  'paperDraft.secondReplyAcknowledged',
  'paperClaim.onchange = function () { paperDraft.claim = paperClaim.value; }',
  "orbit4ClaimDraft = {};"
], "第四章錯誤斷言草稿保留");

const ch5 = block("collision5SayCorrection", "collision5Do");
requireText(ch5, [
  "j1-concept-mismatch", "j2-concept-mismatch", "j3-concept-mismatch",
  "mixed-masses", "three-speeds-required", "杜夏特萊", "杜佩院士"
], "第五章");
forbidText(ch5, ["judgment-required", "unknown-record", "unknown-setting"], "第五章");

const ch6 = block("heat6SayCorrection", "heat6Do");
requireText(ch6, [
  "source-ledger-mismatch", "source-verdict-mismatch", "audit-placement-mismatch",
  "latent-disposition-mismatch", "凱斯勒院士", "史坦格・鑽炮長"
], "第六章");
forbidText(ch6, ["water-box-not-ready", "four-prediction-bands-required", "joint-page-draft-incomplete"], "第六章");

requireText(ui, [
  "lab1AssertionCorrection(type, a)",
  "cat2SayFailure(action, args",
  "ship3SayDossierCorrection(args || {}, rr)",
  "orbit4SayCorrection(action, args, rr)",
  "collision5SayCorrection(action, args, r.error",
  "heat6SayCorrection(action, args, r.error)"
], "六章接線");

requireText(evidenceLaw, [
  "### 3.8 認知錯誤雙層回饋",
  "介面短診斷", "人物質詢", "只使用介面提示，不啟動人物對話"
], "跨章法源");

console.log("認知錯誤雙層回饋：六章接線、人物引用與操作錯誤邊界通過");
