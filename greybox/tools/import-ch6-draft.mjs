/* One-time, deterministic importer for the reviewed chapter-six Markdown draft.
   Runtime edits continue in data/scenes6.json after import. */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../..");
const draftPath = path.join(repo, "03_劇本/發現之前_第六章H1完整劇本草稿_codex_20260802.md");
const outputPath = path.join(here, "../data/scenes6.json");
const lines = readFileSync(draftPath, "utf8").split(/\r?\n/);

function scalar(raw) {
  const value = String(raw ?? "").trim();
  if (!value) return "";
  if (value === "true") return true;
  if (value === "false") return false;
  if (/^-?\d+(?:\.\d+)?$/.test(value)) return Number(value);
  if (value.startsWith("[") && value.endsWith("]")) {
    const body = value.slice(1, -1).trim();
    return body ? body.split(",").map((part) => scalar(part)) : [];
  }
  if (value.startsWith('"') && value.endsWith('"')) {
    try { return JSON.parse(value); } catch { /* keep author text */ }
  }
  return value;
}

function parseMap(block, start, baseIndent) {
  const out = {};
  let i = start;
  for (; i < block.length; i += 1) {
    const line = block[i];
    if (!line.trim()) continue;
    const indent = line.match(/^ */)[0].length;
    if (indent < baseIndent) break;
    const match = line.trim().match(/^([A-Za-z][A-Za-z0-9]*):\s*(.*)$/);
    if (!match) break;
    out[match[1]] = scalar(match[2]);
  }
  return { value: out, next: i };
}

function parseEffects(block, start, baseIndent) {
  const effects = [];
  let i = start;
  for (; i < block.length;) {
    const line = block[i];
    if (!line.trim()) { i += 1; continue; }
    const indent = line.match(/^ */)[0].length;
    if (indent < baseIndent) break;
    const item = line.trim().match(/^-\s+([A-Za-z][A-Za-z0-9]*):\s*(.*)$/);
    if (!item || indent !== baseIndent) break;
    const effect = { [item[1]]: scalar(item[2]) };
    i += 1;
    while (i < block.length) {
      const extra = block[i];
      if (!extra.trim()) { i += 1; continue; }
      const extraIndent = extra.match(/^ */)[0].length;
      if (extraIndent <= baseIndent) break;
      const prop = extra.trim().match(/^([A-Za-z][A-Za-z0-9]*):\s*(.*)$/);
      if (!prop) break;
      effect[prop[1]] = scalar(prop[2]);
      i += 1;
    }
    effects.push(effect);
  }
  return { value: effects, next: i };
}

function parseOptions(block, start) {
  const options = [];
  let i = start;
  while (i < block.length) {
    const line = block[i];
    if (!line.trim()) { i += 1; continue; }
    const indent = line.match(/^ */)[0].length;
    const item = line.trim().match(/^-\s+id:\s*(.*)$/);
    if (indent < 2 || !item) break;
    const option = { id: scalar(item[1]) };
    i += 1;
    while (i < block.length) {
      const propLine = block[i];
      if (!propLine.trim()) { i += 1; continue; }
      const propIndent = propLine.match(/^ */)[0].length;
      if (propIndent <= 2) break;
      const prop = propLine.trim().match(/^([A-Za-z][A-Za-z0-9]*):\s*(.*)$/);
      if (!prop) break;
      const key = prop[1];
      if (prop[2]) {
        option[key] = scalar(prop[2]);
        i += 1;
      } else if (key === "effects") {
        const parsed = parseEffects(block, i + 1, 6);
        option.effects = parsed.value;
        i = parsed.next;
      } else {
        const parsed = parseMap(block, i + 1, 6);
        option[key] = parsed.value;
        i = parsed.next;
      }
    }
    options.push(option);
  }
  return { value: options, next: i };
}

function parseNode(block) {
  const node = {};
  let i = 0;
  while (i < block.length) {
    const line = block[i];
    if (!line.trim()) { i += 1; continue; }
    const top = line.match(/^-\s+([A-Za-z][A-Za-z0-9]*):\s*(.*)$/);
    if (!top) { i += 1; continue; }
    const key = top[1];
    if (top[2]) {
      node[key] = scalar(top[2]);
      i += 1;
      continue;
    }
    if (key === "options") {
      const parsed = parseOptions(block, i + 1);
      node.options = parsed.value;
      i = parsed.next;
    } else if (key === "effects") {
      const parsed = parseEffects(block, i + 1, 2);
      node.effects = parsed.value;
      i = parsed.next;
    } else if (key === "operationContract" || key === "prompts") {
      const values = [];
      i += 1;
      while (i < block.length) {
        const child = block[i];
        const indent = child.match(/^ */)[0].length;
        const item = child.trim().match(/^-\s+(.*)$/);
        if (indent < 2 || !item) break;
        values.push(scalar(item[1]));
        i += 1;
      }
      node[key] = values;
    } else {
      const nextNonBlank = block.slice(i + 1).find((entry) => entry.trim());
      const baseIndent = nextNonBlank ? nextNonBlank.match(/^ */)[0].length : 2;
      const parsed = parseMap(block, i + 1, baseIndent);
      node[key] = parsed.value;
      i = parsed.next;
    }
  }
  return node;
}

const scenes = [];
let scene = null;
let nodeId = null;
let nodeLines = [];
let inAppendix = false;

function flushNode() {
  if (!scene || !nodeId) return;
  const node = parseNode(nodeLines);
  node.id = nodeId;
  scene.nodes.push(node);
  nodeId = null;
  nodeLines = [];
}

for (const line of lines) {
  if (/^# 附錄/.test(line)) { flushNode(); inAppendix = true; break; }
  if (inAppendix) break;
  const sceneHeading = line.match(/^##\s+([A-Z][A-Z0-9-]*)｜(.+)$/);
  if (sceneHeading) {
    flushNode();
    scene = { id: sceneHeading[1], title: sceneHeading[2], nodes: [] };
    scenes.push(scene);
    continue;
  }
  const nodeHeading = line.match(/^####\s+([^\s]+)$/);
  if (nodeHeading && scene) {
    flushNode();
    nodeId = nodeHeading[1];
    nodeLines = [];
    continue;
  }
  if (nodeId) nodeLines.push(line);
  else if (scene) {
    const history = line.match(/^\*\*historyTag\*\*：(.+)$/);
    const purpose = line.match(/^\*\*功能\*\*：(.+)$/);
    if (history) scene.historyTag = history[1].trim();
    if (purpose) scene.purpose = purpose[1].trim();
  }
}
flushNode();

const gateFor = {
  "heat-source-ledger": "source-ledger",
  "chip-capacity-bench": "chips",
  "friction-condition-bench": "friction",
  "dry-strip-bench": "dry",
  "airtight-bench": "air",
  "water-box-bench": "water",
  "finite-source-prediction-bands": "finite-predictions",
  "continuous-run-bench": "continuous-run",
  "source-prediction-verdict": "finite-verdict",
  "model-audit-board": "audit"
};
const cleanNextFor = {
  "chip-capacity-bench": "n4",
  "dry-strip-bench": "n3",
  "airtight-bench": "n4",
  "water-box-bench": "n5",
  "continuous-run-bench": "n4"
};

for (const currentScene of scenes) {
  for (const node of currentScene.nodes) {
    if (node.type === "embed") {
      const embed = node.embed;
      node.system = "heat";
      node.phase = embed;
      node.hint = node.text || "完成目前的來源追債工作。";
      node.until = { heat: gateFor[embed] };
      /* 舊稿旗標只描述作者預期的完成點；runtime 的同一真相已由 Engine6
         gate 持有。保留兩套門會讓合法工作台狀態被不可見節點直接跳過。 */
      delete node.require;
      if (cleanNextFor[embed]) node.next = cleanNextFor[embed];
      delete node.embed;
      delete node.nextByFlag;
      delete node.resumeText;
    }
    if (node.type === "choice") {
      for (const option of node.options || []) {
        if (currentScene.id === "H3-2" && node.id === "c2" && option.id === "bounded-scope") {
          option.effects = option.effects || [];
          option.effects.push({ labAction: { action: "writeScopeDebt", args: { debt: "scope-unresolved" } } });
        }
      }
    }
    if (currentScene.id === "H2-3" && node.id === "t4") node.require = { evidence: "T4" };
    if (currentScene.id === "H3-1" && node.id === "e1") node.require = { evidence: "T4" };
    if (currentScene.id === "HE-1" && node.id === "x_final") {
      node.type = "system";
      node.effects = [{ labAction: { action: "finalizeJointPage", args: { rateDebt: "conversion-rate-unmeasured" } } }];
    }
  }
}

const epilogue = scenes.find((item) => item.id === "HE-1");
if (!epilogue) throw new Error("HE-1 missing");
const n10 = epilogue.nodes.find((node) => node.id === "n10");
const c2Index = epilogue.nodes.findIndex((node) => node.id === "c2");
if (!n10 || c2Index < 0) throw new Error("HE-1 joint-page insertion point missing");
n10.next = "joint";
epilogue.nodes.splice(c2Index, 0, {
  id: "joint",
  type: "embed",
  speaker: "system",
  system: "heat",
  phase: "joint-verification-page",
  text: "把四種責任分欄放回共同頁。先完成暫稿；旅人的最後簽名仍留白。",
  hint: "四欄與範圍未決都要保留；這裡不授予 T5。",
  operationContract: [
    "操作與讀數、量熱來源與反例、朗福德個人解讀、證據邊界與下一筆債分欄。",
    "只建立暫稿；第二筆兌換率未決、旅人署名、T5 與完章都留到 x_final。"
  ],
  until: { heat: "joint-draft" },
  next: "c2"
});

scenes.push({
  id: "SC6-R1",
  title: "修復：把越界的名字收回來",
  supportOnly: true,
  nodes: [
    { id: "n1", type: "line", speaker: "stage", text: "信譽歸零。史坦格把被拿去替理論背書的印章收回桌上；裂開的封條與原紙一張也沒有丟。", next: "n2" },
    { id: "n2", type: "line", speaker: "史坦格・鑽炮長", text: "錯押可以留下。拿別人的名字替沒量到的話背書，得公開收回。", next: "c1" },
    {
      id: "c1", type: "choice", text: "收回剛才越過證據與署名範圍的話。", options: [
        {
          id: "withdraw", text: "「我收回越過原紙與署名範圍的話。封條、壞紙和未決都照原樣留著。」",
          effects: [
            { rep: 1, reason: "公開撤回越界結論，恢復原紙、未決與署名邊界" },
            { flagClear: "repLocked" }
          ], next: "n3"
        },
        { id: "erase", text: "「把不利原紙收掉，再請大家重新簽一次。」", next: "w1" },
        { id: "rename", text: "「把那句話換個名稱，內容照舊一起簽。」", next: "w2" }
      ]
    },
    { id: "w1", type: "line", speaker: "凱斯勒院士", text: "你要修的是自己的越界，不是把反例修掉。原紙留下。", next: "c1" },
    { id: "w2", type: "line", speaker: "朗福德伯爵", text: "換名字沒有縮小一句話。誰說的，誰負責；共同頁只收共同量到的。", next: "c1" },
    { id: "n3", type: "line", speaker: "史坦格・鑽炮長", text: "好。印章還你。回到剛才那張紙，照它真正量到的繼續。", next: "r1" },
    { id: "r1", type: "return" }
  ]
});

const decisionRegistry = [];
for (const currentScene of scenes) {
  if (currentScene.supportOnly) continue;
  currentScene.nodes.forEach((node, nodeIndex) => {
    if (node.type !== "choice") return;
    const options = (node.options || []).map((option) => ({
      id: option.id,
      isCorrect: !Array.isArray(option.refutedBy) || option.refutedBy.length === 0,
      refutedBy: Array.isArray(option.refutedBy) ? option.refutedBy.slice() : []
    }));
    decisionRegistry.push({
      id: `${currentScene.id}.${node.id}`,
      scene: currentScene.id,
      node: node.id,
      nodeIndex,
      kind: options.some((option) => option.refutedBy.length) ? "evidence_judgment" : "narrative",
      preselected: false,
      options
    });
  });
}

const data = {
  chapter: "ch6",
  startScene: "H0-1",
  title: "熱從哪裡來？",
  evidenceNames: {
    S8: "冰融化時吸熱而溫度停住的現象簿",
    T1: "碎屑與薄片的同一把熱尺",
    T2: "只有接觸轉動才持續升溫",
    T3: "關住空氣後沒有消失的熱",
    T4: "越過各個有限來源的長時段曲線",
    T5: "一頁四種署名、兩筆未決"
  },
  evidenceSummaries: {
    S8: "冰融化時持續吸熱，溫度暫不升高；這不是炮鑽的新結果。",
    T1: "等重、同溫、等水量的碎屑與薄片，量熱曲線近似重合。",
    T2: "只轉與只壓都不持續升溫；接觸轉動才持續升。",
    T3: "封住外界空氣後，乾淨紙帶仍與未封時近似重合。",
    T4: "曲線越過已封的有限來源衰減帶；每張裂封與原預測都保留。",
    T5: "共同頁分四欄署名，保留範圍未決與尚未量得的兌換率。"
  },
  conclusionLint: {
    note: "本章不提前宣稱熱就是運動、熱質說全滅或功熱定量兌換率。",
    rules: [
      { term: "熱質說已被摧毀", kind: "speaker-only", speaker: "朗福德伯爵" },
      { term: "兌換率：未量得", kind: "after-node", scene: "HE-1", node: "x_final" }
    ]
  },
  decisionRegistry,
  scenes
};

if (scenes.length !== 13) throw new Error(`expected 13 scenes, got ${scenes.length}`);
if (decisionRegistry.length !== 17) throw new Error(`expected 17 choice groups, got ${decisionRegistry.length}`);
writeFileSync(outputPath, JSON.stringify(data, null, 1) + "\n");
console.log(`scenes6.json imported: ${scenes.length} scenes, ${decisionRegistry.length} choice groups`);
