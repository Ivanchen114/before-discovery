import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const scenes = require("../data/scenes7.js");
const histfacts = require("../data/histfacts7.js");
const Engine = require("../src/engine7.js");
const Registry = require("../src/chapter-registry.js");
const Narrative = require("../src/narrative.js")._factory(scenes, Engine, {}, Registry);
const Sanitize = require("../src/sanitize.js");
const Envelope = require("../src/save-envelope.js");
const tests = [];
const clone = (value) => JSON.parse(JSON.stringify(value));
const add = (name, fn) => tests.push({ name, fn });
const assert = (value, message) => { if (!value) throw new Error(message); };

function permutations(values) {
  if (values.length < 2) return [values.slice()];
  return values.flatMap((value, index) => permutations(values.slice(0, index).concat(values.slice(index + 1)))
    .map((rest) => [value].concat(rest)));
}

function engineThroughEarly(order = Engine.EARLY_KEYS) {
  let state = Engine.initialState();
  state = Engine.acceptReplication(state, "take-the-box").state;
  for (const config of order) state = Engine.runEm1Config(state, { config }).state;
  return state;
}

function viewAdvanceTo(state, type, nodeId) {
  let guard = 0;
  while (guard++ < 400) {
    const view = Narrative.view(state);
    if (view.type === type && (!nodeId || view.nodeId === nodeId)) return state;
    if (view.type === "choice" || view.type === "embed")
      throw new Error(`被 ${view.scene}/${view.nodeId} ${view.type} 擋住`);
    const result = Narrative.advance(state);
    if (result.error) throw new Error(result.error);
    state = result.state;
  }
  throw new Error("敘事推進超過上限");
}

function narrativeAtMatrix() {
  let state = Narrative.initialState("explore");
  state = viewAdvanceTo(state, "choice", "c1");
  state = Narrative.choose(state, "dead-leg").state;
  state = viewAdvanceTo(state, "choice", "c_replicate");
  state = Narrative.choose(state, "take").state;
  return viewAdvanceTo(state, "embed", "e_matrix");
}

function narrativeFullA() {
  let state = narrativeAtMatrix();
  for (const config of Engine.EARLY_KEYS) state = Narrative.labAction(state, "runEm1Config", { config }).state;
  state = Narrative.embedComplete(state).state;
  state = viewAdvanceTo(state, "choice", "c_exclusive");
  state = Narrative.choose(state, "claim-A").state;
  state = viewAdvanceTo(state, "embed", "e_electrometer");
  state = Narrative.labAction(state, "touchElectrometerMetals", { pair: "copper-zinc" }).state;
  state = Narrative.labAction(state, "feedElectrometerPlate", {}).state;
  state = Narrative.labAction(state, "liftElectrometerPlate", {}).state;
  state = Narrative.embedComplete(state).state;
  state = viewAdvanceTo(state, "choice", "c_verdict_mid");
  state = Narrative.choose(state, "bounded").state;
  state = viewAdvanceTo(state, "embed", "e_pile");
  for (const material of ["copper", "zinc", "brine", "copper", "zinc", "brine"])
    state = Narrative.labAction(state, "setPileLayer", { material }).state;
  state = Narrative.labAction(state, "testPileEnds", {}).state;
  state = Narrative.embedComplete(state).state;
  state = viewAdvanceTo(state, "embed", "e_board");
  for (const trace of Engine.MATRIX_KEYS) state = Narrative.labAction(state, "placeMatrixTrace", { trace }).state;
  state = Narrative.labAction(state, "sealMatrixBoard", {}).state;
  state = Narrative.embedComplete(state).state;
  state = viewAdvanceTo(state, "choice", "c_verdict_final");
  state = Narrative.choose(state, "scoped").state;
  return viewAdvanceTo(state, "histfacts", "facts");
}

add("CH7 registry｜七章單源、舊章快照與未知 route fail closed", () => {
  assert(Registry.chapters.length === 7 && Registry.byRoute("ch07").id === "ch7", "ch7 route 未登錄");
  assert(Registry.byId("ch7").runtime.saveKey === "before-discovery:chapter7:v1", "ch7 save key 漂移");
  assert(Registry.byId("ch7").runtime.initialRep === 1 && Registry.nextOf("ch6").id === "ch7" && Registry.nextOf("ch7") === null,
    "initialRep 或下一章關係錯誤");
  assert(Registry.byRoute("ch99") === null, "未知 route 被猜成其他章");
  const original = require("../data/series.json");
  for (const [id, key, schema] of [["ch1", "bd_ch1_save", 3], ["ch2", "bd_ch2_save", 1],
    ["ch3", "bd_ch3_save", 1], ["ch4", "before-discovery:chapter4:v1", 2],
    ["ch5", "before-discovery:chapter5:v1", 1], ["ch6", "before-discovery:chapter6:v1", 1]]) {
    const meta = Registry.byId(id);
    assert(meta.runtime.saveKey === key && meta.runtime.saveSchema === schema, `${id} 舊值漂移`);
  }
  const duplicate = clone(original); duplicate.chapters[6].route = "ch06";
  let red = false; try { Registry.create(duplicate); } catch (_) { red = true; }
  assert(red, "重複 route 負向變異沒有轉紅");
});

add("CH7 canonical｜JSON 鏡像、拓撲與凍結保護句", () => {
  const json = JSON.parse(readFileSync(path.join(here, "../data/scenes7.json"), "utf8"));
  const histJson = JSON.parse(readFileSync(path.join(here, "../data/histfacts7.json"), "utf8"));
  assert(JSON.stringify(json) === JSON.stringify(scenes), "scenes7.js 與 JSON 漂移");
  assert(JSON.stringify(histJson) === JSON.stringify(histfacts), "histfacts7.js 與 JSON 漂移");
  assert(!JSON.stringify(histfacts).includes("教學重建") && histfacts.labels.includes("遊戲重建"),
    "史實頁把一般玩家定位退回教學遊戲");
  const map = new Map(scenes.scenes.map((scene) => [scene.id, new Set(scene.nodes.map((node) => node.id))]));
  for (const scene of scenes.scenes) for (const node of scene.nodes) {
    if (node.next) assert(map.get(scene.id).has(node.next), `${scene.id}/${node.id} next 不存在`);
    if (node.scene) assert(map.has(node.scene), `${scene.id}/${node.id} goto 不存在`);
    for (const option of node.options || []) assert(map.get(scene.id).has(option.next), `${scene.id}/${node.id}.${option.id} next 不存在`);
  }
  const text = JSON.stringify(scenes);
  assert(!text.includes("（若有）") && !text.includes("(若有)"), "作者條件註記漏進玩家文本");
  assert(!scenes.scenes.some((scene) => scene.nodes.some((node) =>
    [node.text, node.hint].some((value) => typeof value === "string" && value.includes("testedScope")))),
  "內部 testedScope 欄位漏進玩家文本");
  for (const phrase of ["這句話現在姓你了", "我的針不認人，只認接觸", "先還自己的債，才有資格填別人的留白",
    "不對——「撐不了場面」不等於「必須有生命」",
    "M 與 A 兩個全稱都失敗；不同配置必須分開記，目前不能指定統一的來源角色。"])
    assert(text.includes(phrase), `凍結保護句缺失:${phrase}`);
  const em74 = scenes.scenes.find((scene) => scene.id === "EM7-4");
  const arrival = em74.nodes.find((node) => node.id === "r1");
  assert(arrival?.variants?.length === 2 && arrival.variants.some((variant) =>
    variant.require?.flag?.[1] === "A" && variant.text.includes("已送出的回覆底稿")) &&
    arrival.variants.some((variant) => variant.require?.any && !variant.text.includes("回覆底稿")),
  "中段書房沒有依公開 A 路投影回覆底稿");
  const aStable = em74.nodes.find((node) => node.id === "r_mid").variants
    .find((variant) => variant.require?.flag?.[1] === "a-stable");
  const selfCorrection = em74.nodes.find((node) => node.id === "r_mid_voice");
  assert(aStable.speaker === "stage" && aStable.next === "r_mid_voice",
    "r_mid ③路沒有先保留 Galvani 的無聲阻力拍");
  assert(selfCorrection?.speaker === "旅人・心聲" && selfCorrection.next === "f_mid_retry",
    "r_mid ③路把旅人心聲敘述化或跳過自駁拍");
  let state = Narrative.initialState("explore");
  let visibleLines = 0;
  while (Narrative.view(state).nodeId !== "c1") { visibleLines++; state = Narrative.advance(state).state; }
  assert(visibleLines === 7, `第一個玩家行動前不是 7 行:${visibleLines}`);
});

add("CH7 engine｜24 種前四格順序、重做與押注門", () => {
  for (const order of permutations(Engine.EARLY_KEYS)) {
    let state = Engine.initialState();
    state = Engine.acceptReplication(state, "take-the-box").state;
    for (let i = 0; i < order.length; i++) {
      assert(Engine.gateSatisfied(state, "matrix-four") === (i === 4), "四格未齊卻開門");
      state = Engine.runEm1Config(state, { config: order[i] }).state;
      assert(Engine.gateSatisfied(state, "matrix-four") === (i === 3), `排列 ${order.join(",")} 門檻錯誤`);
    }
    assert(Engine.commitExclusiveClaim(state, { claim: "A" }).state.commitment.public, "A 未保存公開署名");
  }
  let state = engineThroughEarly();
  const first = state.matrix.traces.noMetal;
  const before = state.records.length;
  state = Engine.runEm1Config(state, { config: "noMetal" }).state;
  assert(state.matrix.traces.noMetal === first && state.records.length === before + 1 && state.records.at(-1).repeated,
    "重做覆寫具名 trace 或未增加原紙");
});

add("CH7 engine｜三具名操作 dominance、錯序留痕與非對稱主張", () => {
  let state = engineThroughEarly();
  const m = Engine.commitExclusiveClaim(state, { claim: "M" });
  assert(m.state.commitment.public === false && m.state.records.at(-1).disposition === "refuted-before-dispatch", "M 被誤寫成公開");
  state = Engine.commitExclusiveClaim(state, { claim: "not-yet" }).state;
  assert(Engine.commitNextConfig(state, { choice: "next-repeat-known" }).state.phase === "next-config", "無區分力選項支付了 gate");
  state = Engine.commitNextConfig(state, { choice: "next-tissue-free-charge" }).state;
  assert(Engine.liftElectrometerPlate(state).error, "未相觸／餵盤可直接讀針");
  const wrongPair = Engine.touchElectrometerMetals(state, { pair: "copper-copper" });
  assert(wrongPair.ok === false && wrongPair.state.records.at(-1).kind === "electrometer-touch", "錯接沒有留痕");
  state = Engine.touchElectrometerMetals(wrongPair.state, { pair: "copper-zinc" }).state;
  state = Engine.feedElectrometerPlate(state).state;
  state = Engine.liftElectrometerPlate(state).state;
  state = Engine.recordMidVerdict(state, { choice: "mid-m-fell-a-open" }).state;
  for (const material of ["copper", "brine", "zinc"]) state = Engine.setPileLayer(state, { material }).state;
  const badPile = Engine.testPileEnds(state);
  assert(badPile.ok === false && badPile.state.records.at(-1).kind === "pile-test", "錯序堆沒有保留嘗試");
  assert(Engine.sealMatrixBoard(badPile.state).error, "未取得堆與六格可自報 board complete");
});

add("CH7 narrative｜M 當場反駁、A 延後裁決、not-yet 非免費", () => {
  let state = narrativeAtMatrix();
  for (const config of Engine.EARLY_KEYS) state = Narrative.labAction(state, "runEm1Config", { config }).state;
  state = Narrative.embedComplete(state).state;
  state = viewAdvanceTo(state, "choice", "c_exclusive");
  const m = Narrative.choose(state, "claim-M").state;
  assert(Narrative.view(m).nodeId === "mb1" && m.lab.commitment.public === false, "M 沒被現存紙當場擋回");
  const a = Narrative.choose(state, "claim-A").state;
  assert(Narrative.view(a).nodeId === "ac1" && a.lab.commitment.public === true, "A 沒有進失敗前進");
  let n = Narrative.choose(state, "not-yet").state;
  n = viewAdvanceTo(n, "choice", "c_next");
  n = Narrative.choose(n, "repeat-known").state;
  assert(Narrative.view(n).nodeId === "nw2" && n.lab.phase === "next-config", "not-yet 的重複配置免費前進");
});

add("CH7 reputation｜T1/T2/T3 即時鎖定、同因果修復與不可重觸", () => {
  for (const entry of [
    ["T1", (state) => Narrative.labAction(state, "concealArchival1794", {})],
    ["T2", (state) => Narrative.labAction(state, "withdrawMatrixTrace", { trace: "noMetal" })]
  ]) {
    let state = narrativeAtMatrix();
    for (const config of Engine.EARLY_KEYS) state = Narrative.labAction(state, "runEm1Config", { config }).state;
    const hit = entry[1](state); state = hit.state;
    assert(hit.redirected && state.cursor.scene === "SC7-R1" && state.rep === 0 && state.flags.repLocked === "1", `${entry[0]} 未同 transaction 轉址`);
    state = viewAdvanceTo(state, "choice", "c1");
    state = Narrative.choose(state, "withdraw").state;
    assert(state.rep === 1 && !state.flags.repLocked && state.lab.integrity.incidents.length === 1 && !state.lab.integrity.activeWithholding,
      `${entry[0]} 修復洗掉事故或沒有回 1`);
    state = Narrative.advance(state).state;
    const again = entry[1](state);
    assert(again.error, `${entry[0]} 同 source 可再次藏紙`);
  }
  let state = narrativeAtMatrix();
  for (const config of Engine.EARLY_KEYS) state = Narrative.labAction(state, "runEm1Config", { config }).state;
  state = Narrative.embedComplete(state).state;
  state = viewAdvanceTo(state, "choice", "c_exclusive");
  state = Narrative.choose(state, "claim-M").state;
  state = viewAdvanceTo(state, "choice", "c_insist");
  const t3 = Narrative.choose(state, "send");
  assert(t3.redirected && t3.state.cursor.scene === "SC7-R1" && t3.state.flags.returnNode === "c_exclusive" &&
      t3.state.lab.commitment.public === false && t3.state.transcript.some((line) => line.text.includes("Galvani 沒有接")),
    "T3 把企圖寫成已公開，或沒有用核准 pre-dispatch 結果拍");
});

add("CH7 save｜完整 A 路、schema1 信件碼與 sanitizer 負向控制", () => {
  const state = narrativeFullA();
  assert(state.lab.phase === "scoped" && state.lab.commitment.public && state.lab.commitment.repaired,
    "A 路沒有在同紙限縮後匯流");
  const clean = Sanitize.sanitizeImport7(clone(state), scenes, Engine);
  assert(clean.ok, `合法 ch7 state 被拒:${clean.reason}`);
  const letter = Envelope.encode("ch7", state);
  const decoded = Envelope.decode(letter);
  assert(decoded.envelope && decoded.chapter === "ch7" && Sanitize.sanitizeImport7(decoded.payload, scenes, Engine).ok,
    "ch7 信件碼往返失敗");
  const mutations = [
    (s) => { s.lab.records[1].id = "em1-r999"; },
    (s) => { s.lab.records.find((row) => row.kind === "matrix-trace").observation = "捏造結果"; },
    (s) => { s.lab.matrix.traces.noMetal = s.lab.matrix.traces.baseline; },
    (s) => { s.lab.commitment.repaired = false; },
    (s) => { s.lab.matrix.boardComplete = false; },
    (s) => { s.ended = true; s.lab.phase = "named"; }
  ];
  for (let i = 0; i < mutations.length; i++) {
    const forged = clone(state); mutations[i](forged);
    assert(!Sanitize.sanitizeImport7(forged, scenes, Engine).ok, `sanitize 負向案例 #${i + 1} 未拒絕`);
  }
  const ch6 = { schemaVersion: 1, chapter: "ch6", cursor: { scene: "H0-1", node: "n1" } };
  const retagged = JSON.parse(Envelope.encode("ch7", ch6));
  assert(!Sanitize.sanitizeImport7(retagged.payload, scenes, Engine).ok, "ch6 payload 改標 ch7 後通過");
});

add("CH7 UI｜三工作台、讀屏文字、44px 與 registry 接線", () => {
  const stage = readFileSync(path.join(here, "../stage.html"), "utf8");
  const ui = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf8");
  const stageUi = readFileSync(path.join(here, "../src/stage-ui.js"), "utf8");
  for (const fragment of ["data/scenes7.js", "data/histfacts7.js", "src/engine7.js", "src/chapter-registry.js"])
    assert(stage.includes(fragment), `stage 缺 ch7 接線:${fragment}`);
  for (const fragment of ["renderEm1", "runEm1Config", "touchElectrometerMetals", "testPileEnds", "sealMatrixBoard",
    "把這格的紙收離桌面", "把一七九四年的舊紙收進箱底",
    "這格是你親手做、親手記的。桌上會留下一個空位。", "留著。", "放回桌上。",
    'state.cursor.node === "e_pile" ? "pile"', 'state.cursor.node === "e_board" ? "board"'])
    assert(ui.includes(fragment), `ch7 UI 缺件:${fragment}`);
  assert(!ui.includes("window.confirm"), "ch7 研究誠信確認拍不得退回不可定名的瀏覽器系統框");
  assert(!ui.includes('"逐張把三地原紙歸回同一頁；testedScope'), "工作台洩漏 testedScope 工程欄位");
  for (const fragment of ["旅人筆記・複驗矩陣備忘", "先留基準紙", "開始接第一格"])
    assert(stageUi.includes(fragment), `ch7 實驗備忘仍缺專用文案:${fragment}`);
  assert(stage.includes("min-height: 44px") && stageUi.includes('d.system === "em1"'), "ch7 工作台 44px 或舞台 lab 視圖缺失");
});

let passed = 0;
for (const test of tests) {
  try { await test.fn(); passed++; console.log("  ✓ " + test.name); }
  catch (error) { console.error("  ✗ " + test.name + "\n    " + error.message); process.exitCode = 1; }
}
console.log(`\nCH7：${passed}/${tests.length} 通過`);
