/* 旅人筆記行為契約：真正執行各章 snapshot handler，不以原始碼字串代替 DOM 結果。 */
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const Registry = require("../src/chapter-registry.js");
const Engine7 = require("../src/engine7.js");
const ui = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf8");
const stage = readFileSync(path.join(here, "../stage.html"), "utf8");
const tests = [];
const add = (name, fn) => tests.push({ name, fn });
const assert = (value, message) => { if (!value) throw new Error(message); };
const clone = (value) => JSON.parse(JSON.stringify(value));

class FakeNode {
  constructor(tag = "div") {
    this.tagName = tag;
    this.children = [];
    this.attributes = {};
    this.className = "";
    this.ownText = "";
  }
  appendChild(node) { this.children.push(node); node.parentNode = this; return node; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  set innerHTML(value) { if (value === "") this.children = []; this.ownText = String(value || ""); }
  get innerHTML() { return this.ownText; }
  set textContent(value) { this.ownText = String(value == null ? "" : value); }
  get textContent() { return [this.ownText].concat(this.children.map((child) => child.textContent)).join(" "); }
}

function functionBodyFor(chapterId, source = ui) {
  const marker = `/* notebook-renderer:${chapterId} — stable boundary for behavior contracts. */`;
  const markerAt = source.indexOf(marker);
  if (markerAt < 0) throw new Error(`${chapterId} 缺 stable notebook renderer marker`);
  const fnAt = source.indexOf("function (ev)", markerAt);
  const braceAt = source.indexOf("{", fnAt);
  let depth = 0, quote = null, escaped = false, lineComment = false, blockComment = false;
  for (let i = braceAt; i < source.length; i += 1) {
    const char = source[i], next = source[i + 1];
    if (lineComment) { if (char === "\n") lineComment = false; continue; }
    if (blockComment) { if (char === "*" && next === "/") { blockComment = false; i += 1; } continue; }
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === "/" && next === "/") { lineComment = true; i += 1; continue; }
    if (char === "/" && next === "*") { blockComment = true; i += 1; continue; }
    if (char === '"' || char === "'" || char === "`") { quote = char; continue; }
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(braceAt + 1, i);
    }
  }
  throw new Error(`${chapterId} handler 邊界無法解析`);
}

function render(chapterId, state, source = ui) {
  const target = new FakeNode("div");
  const detail = { target, handled: false };
  const ship3El = (tag, text, parent, className) => {
    const node = new FakeNode(tag);
    node.className = className || "";
    if (text != null) node.textContent = text;
    if (parent) parent.appendChild(node);
    return node;
  };
  const ship3Btn = (parent, text, onClick, className) => {
    const node = ship3El("button", text, parent, className);
    node.onClick = onClick;
    return node;
  };
  const env = {
    CHAPTER_ID: chapterId, state, ship3El, ship3Btn,
    fmt: (value) => Array.isArray(value) ? value.join("～") : String(value),
    cfgLabel: (config) => Object.keys(config || {}).map((key) => `${key}:${config[key]}`).join("、") || "未留存配置",
    ship3DossierSourceGroups: () => [], ship3DossierAssertionText: (id) => `斷言${id}`,
    ship3DossierPacketSourceIds: () => [], ship3LastSeriesIds: [], ship3ReplayRecordId: null,
    ship3ReplayNotice: false, renderAll: () => {}, ship3ScrollToReplayAnimation: () => {},
    document: { dispatchEvent: () => {} }, CustomEvent: class { constructor(type) { this.type = type; } },
    window: { GB: { Engine7 } }
  };
  const names = Object.keys(env);
  const factory = new Function(...names, `return function (ev) {${functionBodyFor(chapterId, source)}};`);
  const handler = factory(...names.map((name) => env[name]));
  handler({ detail });
  return { target, text: target.textContent.replace(/\s+/g, " ").trim(), handled: detail.handled };
}

function emptyLab4(overrides = {}) {
  return Object.assign({
    claims: {}, sourceLab: { attempts: [], tangentPrediction: null },
    orbitLab: { paperTrials: [], ruleRuns: [], manualAttempts: [], manualBeats: [] },
    scaleLab: { predictionAttempts: [], conversionAttempts: [], ratioAttempts: [], relationAttempts: [] },
    planetLab: { predictions: [], comparisonAttempts: [], revealed: {} },
    modelLab: { rowOrder: [], stampAttempts: [], loans: [], comparisonAttempts: [] },
    proof: { slotAttempts: [], attributionAttempts: [], hookeScopeAttempts: [], boundaryAttempts: [], press: { proofs: [] } }
  }, overrides);
}

function legalCh7Early() {
  let state = Engine7.initialState();
  state = Engine7.acceptReplication(state, "take-the-box").state;
  for (const config of Engine7.EARLY_KEYS) state = Engine7.runEm1Config(state, { config }).state;
  return state;
}

add("旅人筆記行為｜registry 每一個正式 runtime 章都有可接管且非恆空的 handler", () => {
  const states = {
    ch1: { lab: { evidence: { runs: [{ id: 1, config: { timer: "water" }, readings: [1, 3, 5, 7, 9] }] }, inference: { claims: [], assertions: [], comparisons: [] } } },
    ch2: { lab: { revision: 1, assemblyLog: [{ t: "place", slot: "release", part: "latchRelease", rev: 1 }], calib: {}, series: [], evidence: { f2: {} } } },
    ch3: { lab: { caseFile: { dossier: { designCommitments: {}, sourceAttempts: [{ assertion: "A1", sources: ["R1"], ok: false, reason: "missing-comparison" }], scopeAttempts: [], assertions: {} } } } },
    ch4: { lab: emptyLab4({ sourceLab: { attempts: [{ choice: "arc", ok: false, at: 1 }], tangentPrediction: null } }) },
    ch5: { lab: { collisionRuns: [], clayRuns: [{ id: 1, ballMass: "light", height: 1, speed: 1, depth: 1, unitDepth: "分" }], clayPrediction: null, assertions: {}, judgments: {} } },
    ch6: { lab: { records: [], sourceLedger: { placements: {}, consequences: {}, modelPredictions: {}, sealed: false }, finiteSources: { bands: {}, verdicts: {}, sealed: false }, auditBoard: {}, jointPage: {}, airBench: { prediction: "slower-when-sealed", sealed: true, attempts: [], judged: false } } },
    ch7: { lab: legalCh7Early() }
  };
  for (const chapter of Registry.chapters) {
    const before = JSON.stringify(states[chapter.id]);
    const first = render(chapter.id, states[chapter.id]);
    const second = render(chapter.id, states[chapter.id]);
    const third = render(chapter.id, states[chapter.id]);
    assert(first.handled && first.text && !/^尚無研究紀錄。?$/.test(first.text), `${chapter.id} handler 未接管或恆空`);
    assert(second.handled && third.handled, `${chapter.id} 重開筆記後失去接管`);
    assert(JSON.stringify(states[chapter.id]) === before, `${chapter.id} 開啟筆記改寫 state`);
  }
});

add("旅人筆記行為｜一至六章封存前不洩漏，合法揭曉後可讀", () => {
  const ch1Hidden = { lab: { evidence: { runs: [{ id: 1, config: {}, readings: [1, 3, 5, 7, 9] }] }, inference: { claims: [], assertions: [], comparisons: [] } } };
  assert(render("ch1", ch1Hidden).text.includes("第五段：封存中"), "ch1 第五段提前揭曉");
  const ch1Open = clone(ch1Hidden); ch1Open.lab.inference.claims.push({ id: 1, runIds: [1], prediction: 9, observedFifth: 9, ok: true });
  assert(render("ch1", ch1Open).text.includes("第五段：9"), "ch1 合法揭曉後仍看不到第五段");

  const base2 = { lab: { revision: 1, assemblyLog: [], calib: {}, evidence: { f2: {} }, series: [{ id: 1, ball: "copper", status: "open", readings: { 4: 2, 9: 3, 16: 4 }, prediction: 5, apparatusRevision: 1, fingerprint: "fp", profile: "clean" }] } };
  assert(render("ch2", base2).text.includes("實測仍封存"), "ch2 25 格提前揭曉");
  const open2 = clone(base2); open2.lab.series[0].readings[25] = 5; open2.lab.series[0].accepted = true;
  assert(render("ch2", open2).text.includes("翻面實測 5"), "ch2 合法揭曉後仍看不到 25 格");

  const base4 = { lab: emptyLab4({ planetLab: { predictions: [{ planet: "mars", playerBandLabel: "約 1.9 年", actual: 1.88, residualPct: 1.06, revealedAfterSeal: false, superseded: false }], comparisonAttempts: [], revealed: { mars: false } } }) };
  assert(!render("ch4", base4).text.includes("觀測 1.88"), "ch4 火星觀測提前揭曉");
  const open4 = clone(base4); open4.lab.planetLab.predictions[0].revealedAfterSeal = true; open4.lab.planetLab.revealed.mars = true;
  assert(render("ch4", open4).text.includes("觀測 1.88"), "ch4 合法揭曉後仍看不到火星觀測");

  const base5 = { lab: { collisionRuns: [], clayRuns: [], clayPrediction: { min: 3, max: 5, revealed: false, actualDepth: 4, matched: true }, assertions: {}, judgments: {} } };
  assert(!render("ch5", base5).text.includes("翻面實測 4"), "ch5 第三球提前揭曉");
  const open5 = clone(base5); open5.lab.clayPrediction.revealed = true;
  assert(render("ch5", open5).text.includes("翻面實測 4"), "ch5 合法揭曉後仍看不到第三球");

  const base6 = { lab: { records: [], sourceLedger: { placements: {}, consequences: {}, modelPredictions: {}, sealed: false }, finiteSources: { bands: {}, verdicts: {}, sealed: false }, auditBoard: {}, jointPage: {}, airBench: { prediction: "slower-when-sealed", sealed: true, attempts: [], judged: false, predictionOutcome: "not-fulfilled" } } };
  assert(!render("ch6", base6).text.includes("揭曉：未兌現"), "ch6 空氣押記提前揭曉");
  const open6 = clone(base6); open6.lab.airBench.judged = true;
  assert(render("ch6", open6).text.includes("揭曉：未兌現"), "ch6 合法判讀後仍看不到揭曉");
});

add("旅人筆記行為｜第七章離桌內容不旁路、修復後恢復且歷史仍在", () => {
  const early = legalCh7Early();
  const concealed = Engine7.concealArchival1794(early).state;
  const hidden = render("ch7", { lab: concealed }).text;
  assert(hidden.includes("舊紙已離桌") && !hidden.includes("沒有金屬在場仍記錄到收縮"), "ch7 離桌舊紙內容由筆記旁路洩漏");
  const repaired = Engine7.repairWithholding(concealed).state;
  const restored = render("ch7", { lab: repaired }).text;
  assert(restored.includes("沒有金屬在場仍記錄到收縮"), "ch7 修復後原紙未恢復");
  assert(restored.includes("失信事故") && restored.includes("把原紙放回並在原句上限縮"), "ch7 修復後事故或修復歷史消失");
  const withdrawn = Engine7.withdrawMatrixTrace(early, { trace: "bimetal" }).state;
  const traceHidden = render("ch7", { lab: withdrawn }).text;
  assert(traceHidden.includes("黃銅與鐵的雙金屬接法：原紙已離桌") &&
    !traceHidden.includes(Engine7.FIXTURES.bimetal.observation), "ch7 離桌矩陣原紙內容旁路洩漏");
});

add("旅人筆記完整度｜懸空引用、舊版、逐次嘗試、質量與人類可讀標籤可查", () => {
  const dangling = { lab: { revision: 0, assemblyLog: [], calib: {}, series: [], evidence: { f2: { law: true, lawSource: 3, lawConcept: "sqrtScale" } } } };
  assert(render("ch2", dangling).text.includes("本裝置未留存該輪紀錄"), "ch2 懸空引用未誠實標示");
  const oldPrediction = { lab: emptyLab4({ planetLab: { predictions: [{ planet: "mars", playerBandLabel: "約 1.5 年", exponent: 1, superseded: true, revealedAfterSeal: false }], comparisonAttempts: [], revealed: {} } }) };
  assert(render("ch4", oldPrediction).text.includes("約 1.5 年") && render("ch4", oldPrediction).text.includes("已作廢"), "ch4 被取代押記仍被隱藏");
  const ch3 = { lab: { caseFile: { dossier: { designCommitments: {}, sourceAttempts: [{ assertion: "A1", sources: ["R1"], ok: false, reason: "少一張對照紙" }], scopeAttempts: [{ assertion: "A1", choice: "all", ok: false }], assertions: {} } } } };
  assert(render("ch3", ch3).text.includes("少一張對照紙") && render("ch3", ch3).text.includes("過度延伸"), "ch3 嘗試歷程仍只剩計數");
  const ch5 = { lab: { collisionRuns: [], clayRuns: [{ id: 1, ballMass: "heavy", height: 4, speed: 2, depth: 8, unitDepth: "分" }], assertions: {}, judgments: { j1: "steel-only" } } };
  const ch5Text = render("ch5", ch5).text;
  assert(ch5Text.includes("球重 重球") && ch5Text.includes("只有鋼頭碰撞接近守恆") && !ch5Text.includes("steel-only"), "ch5 質量或錯誤代碼仍不透明");
  const ch6 = { lab: { records: [], sourceLedger: { placements: { chips: "x" }, consequences: { chips: "y" }, modelPredictions: { caloric: "finite-sources", motion: "continued-motion" }, sealed: true }, finiteSources: { bands: {}, verdicts: {}, sealed: false }, auditBoard: {}, jointPage: {}, airBench: { attempts: [] } } };
  const ch6Text = render("ch6", ch6).text;
  assert(ch6Text.includes("若熱質有限") && ch6Text.includes("接觸運動持續") && !ch6Text.includes("finite-sources"), "ch6 模型押記仍顯示代碼");
  assert(render("ch3", { lab: {} }).handled && render("ch3", { lab: {} }).text.includes("未留存第三章卷宗"), "ch3 缺卷宗時沒有接管並明示未留存");
});

add("旅人筆記可及性｜展開與重播控制至少 44px", () => {
  assert(/#nbLabSnap button,\s*#nbLabSnap summary\s*\{[^}]*min-height:\s*44px\s*!important/s.test(stage),
    "旅人筆記 button/summary 未以 important 覆蓋舊 36px 規則");
});

add("旅人筆記反向控制｜保留關鍵字但不接管、恆空或旁路揭曉都必須被行為探針抓到", () => {
  const legal = { lab: legalCh7Early() };
  const handledMutation = ui.replace(
    "ev.detail.handled = true;\n    ship3El(\"p\", \"第七章電與組織研究紀錄\"",
    "ev.detail.handled = true; ev.detail.handled = false;\n    ship3El(\"p\", \"第七章電與組織研究紀錄\""
  );
  assert(render("ch7", legal, handledMutation).handled === false,
    "反向控制寫壞：不 handled 變異沒有改變行為");
  const emptyMutation = ui.replace(
    "ship3El(\"p\", \"第七章電與組織研究紀錄\", target, \"shipNotebookSnapshotTitle\");",
    "ship3El(\"p\", \"第七章電與組織研究紀錄\", target, \"shipNotebookSnapshotTitle\"); target.innerHTML = \"\"; return;"
  );
  assert(render("ch7", legal, emptyMutation).text === "",
    "反向控制寫壞：恆空變異沒有改變行為");
  const ch5State = { lab: { collisionRuns: [{ id: 1, head: "steel", mA: 4, mB: 4,
    before: { a: 2, b: 0 }, after: { a: 0, b: 2 }, momentum: { before: 8, after: 8 },
    visViva: { before: 16, after: 16, deficit: 0 } }], clayRuns: [], assertions: {}, judgments: {} } };
  const leakMutation = ui.replace(
    "if (lab.evidence && lab.evidence.j1)",
    "if (true || (lab.evidence && lab.evidence.j1))"
  );
  assert(render("ch5", ch5State, leakMutation).text.includes("第二本帳"),
    "反向控制寫壞：封存旁路變異沒有造成可觀察洩漏");
});

let passed = 0;
for (const test of tests) {
  try { test.fn(); console.log(`  ✓ ${test.name}`); passed += 1; }
  catch (error) { console.error(`  ✗ ${test.name}\n    ${error.message}`); }
}
console.log(`\n${passed} 通過,${tests.length - passed} 失敗(共 ${tests.length})`);
if (passed !== tests.length) process.exitCode = 1;
