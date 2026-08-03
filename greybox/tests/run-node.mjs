/* tests/run-node.mjs — `npm test` 進入點(零外部依賴)
   執行:共用套件全部測試 + R-DATA-05 鏡像一致性(需檔案系統,node 限定) */
import { createRequire } from "module";
import { readFileSync, existsSync, readdirSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { Script } from "vm";

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));

const patterns = require("../data/patterns.js");
const debate = require("../data/debate.js");
const scenes = require("../data/scenes.js");
const scenes2 = require("../data/scenes2.js");
const Engine = require("../src/engine.js");
const Engine2 = require("../src/engine2.js");
const Engine3 = require("../src/engine3.js");
const Engine4 = require("../src/engine4.js");
const Engine5 = require("../src/engine5.js");
const Engine6 = require("../src/engine6.js");
const Narrative = require("../src/narrative.js");
const scenes3 = require("../data/scenes3.js");
const scenes4 = require("../data/scenes4.js");
const scenes5 = require("../data/scenes5.js");
const scenes6 = require("../data/scenes6.js");
const debate5 = require("../data/debate5.js");
const histfacts5 = require("../data/histfacts5.js");
const TextFormat = require("../src/text-format.js");
const buildSuite = require("./suite.js");
const buildNarrativeSuite = require("./narrative-suite.js");

const tests = buildSuite(Engine, patterns, debate).concat(buildNarrativeSuite(Narrative, scenes));
const CH3_DUAL_SETUP = {
  shoreOrigin: "quay", shipOrigin: "mast",
  clock: "shared-drum", shipObserver: "gassendi"
};

tests.push({
  name: "前端腳本語法|主要瀏覽器腳本都能被 JavaScript 引擎解析",
  fn: () => {
    for (const file of [
      "chapter-ui.js", "engine3.js", "engine4.js", "engine6.js", "ch4-migration.js",
      "narrative.js", "sanitize.js"
    ]) {
      const source = readFileSync(path.join(here, "../src", file), "utf-8");
      new Script(source, { filename: file });
    }
  }
});

function ch6ReadyForFinitePredictions() {
  let state = Engine6.initialState();
  for (const source of Engine6.SOURCES) {
    state = Engine6.setSourceLedger(state, {
      source, position: source + "-position", consequence: source + "-visible-change"
    }).state;
  }
  state = Engine6.sealModels(state, { caloric: "finite-sources", motion: "continued-motion" }).state;
  state = Engine6.runChipComparison(state).state;
  state = Engine6.judgeChipComparison(state, { concept: "chips-not-lower-capacity" }).state;
  for (const condition of ["rotation-only", "pressure-only", "contact-motion"])
    state = Engine6.runFrictionCondition(state, { condition }).state;
  state = Engine6.judgeFrictionConditions(state, { concept: "contact-and-motion" }).state;
  state = Engine6.runDryStrip(state).state;
  state = Engine6.judgeDryStrip(state, { concept: "observed-range-only" }).state;
  state = Engine6.sealAirPrediction(state, { prediction: "slower-when-sealed" }).state;
  state = Engine6.runAirComparison(state, { condition: "open" }).state;
  state = Engine6.runAirComparison(state, { condition: "sealed" }).state;
  state = Engine6.judgeAirComparison(state, { concept: "air-not-necessary" }).state;
  for (const [field, value] of [["sealed", true], ["leakChecked", true], ["sampling", true]])
    state = Engine6.setWaterDraft(state, { field, value }).state;
  state = Engine6.prepareWaterBox(state).state;
  const bands = { chips: "soon", air: "soon", cannon: "within-shift", water: "within-shift" };
  for (const source of Engine6.SOURCES)
    state = Engine6.setFinitePrediction(state, { source, band: bands[source] }).state;
  return state;
}

function ch6CompleteLongRun(state0) {
  let state = state0;
  for (let i = 0; i < 6; i += 1)
    state = Engine6.runContinuousSegment(state, { action: "continue" }).state;
  return state;
}

function ch6CompleteVerdicts(state0) {
  let state = state0;
  for (const source of Engine6.SOURCES)
    state = Engine6.judgeFiniteSource(state, { source, verdict: "not-fulfilled" }).state;
  return state;
}

function ch6CompleteAudit(state0) {
  let state = state0;
  for (const [slot, evidence] of [["chips", "T1"], ["air", "T3"], ["cannon", "T4"], ["water", "T4"], ["condition", "T2"]])
    state = Engine6.placeAuditEvidence(state, { slot, evidence }).state;
  state = Engine6.setLatentDisposition(state, { disposition: "motion-unresolved" }).state;
  return Engine6.completeAudit(state).state;
}

tests.push({
  name: "R-CH6-01|未封存有限來源預測不得跑長時段曲線",
  fn: () => {
    const initial = Engine6.initialState();
    const before = JSON.stringify(initial);
    const early = Engine6.runContinuousSegment(initial, { action: "continue" });
    if (early.error !== "finite-predictions-required" || JSON.stringify(early.state) !== before)
      throw new Error("未封預測仍能跑或失敗改動 state");
    let state = ch6ReadyForFinitePredictions();
    state = Engine6.sealFinitePredictions(state).state;
    const rewrite = Engine6.setFinitePrediction(state, { source: "cannon", band: "soon" });
    if (rewrite.error !== "finite-predictions-sealed") throw new Error("封存後仍可改押");
  }
});

tests.push({
  name: "R-CH6-02|長曲線不自動授 T4；四來源逐一判讀後才取得",
  fn: () => {
    let state = ch6ReadyForFinitePredictions();
    state = Engine6.sealFinitePredictions(state).state;
    state = ch6CompleteLongRun(state);
    if (state.evidence.t4 || !Engine6.gate(state, "continuous-run"))
      throw new Error("跑完長曲線時 T4 被自動授予或 run gate 未成立");
    for (const source of Engine6.SOURCES.slice(0, 3)) {
      state = Engine6.judgeFiniteSource(state, { source, verdict: "not-fulfilled" }).state;
      if (state.evidence.t4) throw new Error("判讀未齊就取得 T4:" + source);
      if (state.finiteSources.sealState[source] !== "cracked") throw new Error("已判讀封條沒有裂開");
    }
    const last = Engine6.judgeFiniteSource(state, { source: "water", verdict: "not-fulfilled" });
    if (last.error || last.evidence !== "T4" || !last.state.evidence.t4 || !last.state.finiteSources.complete)
      throw new Error("四來源齊全仍未原子取得 T4");
    if (!Engine6.SOURCES.every((source) => last.state.finiteSources.sealState[source] === "cracked"))
      throw new Error("裂封狀態不完整");
  }
});

tests.push({
  name: "R-CH6-03|x_final 前不得取得 T5、旅人署名或完章",
  fn: () => {
    let state = ch6ReadyForFinitePredictions();
    state = Engine6.sealFinitePredictions(state).state;
    state = ch6CompleteVerdicts(ch6CompleteLongRun(state));
    state = ch6CompleteAudit(state);
    const columns = Engine6.JOINT_VALUES;
    for (const [column, text] of Object.entries(columns))
      state = Engine6.setJointColumn(state, { column, text }).state;
    state = Engine6.writeScopeDebt(state, { debt: "scope-unresolved" }).state;
    const draft = Engine6.prepareJointPage(state);
    if (draft.error || draft.state.evidence.t5 || draft.state.jointPage.complete ||
        draft.state.jointPage.signedBy.traveler)
      throw new Error("共同頁暫稿提前授 T5／旅人署名／完成");
    const wrong = Engine6.finalizeJointPage(draft.state, { rateDebt: "drill-longer" });
    if (wrong.error !== "rate-debt-mismatch" || wrong.state.evidence.t5)
      throw new Error("錯誤交棒仍部分成立");
    const final = Engine6.finalizeJointPage(draft.state, { rateDebt: "conversion-rate-unmeasured" });
    if (final.error || final.evidence !== "T5" || !final.state.evidence.t5 ||
        !final.state.jointPage.complete || final.state.phase !== "complete" ||
        !Object.values(final.state.jointPage.signedBy).every(Boolean))
      throw new Error("x_final 沒有原子成立兩筆債、四簽、T5 與完成");
  }
});

tests.push({
  name: "R-CH6-04|17 組選項錯項 refutedBy 只指向作答前已見來源",
  fn: () => {
    if (!Array.isArray(scenes6.decisionRegistry) || scenes6.decisionRegistry.length !== 17)
      throw new Error("第六章 decisionRegistry 不是 17 組");
    const sceneOrder = new Map(scenes6.scenes.map((scene, index) => [scene.id, index]));
    const nodeByKey = new Map();
    const evidenceAt = new Map();
    for (const scene of scenes6.scenes) {
      for (const node of scene.nodes) {
        const key = `${scene.id}/${node.id}`;
        nodeByKey.set(key, { scene, node, key });
        for (const effect of node.effects || [])
          if (effect.evidence) evidenceAt.set(effect.evidence, key);
      }
    }
    const firstKey = new Map(scenes6.scenes.map((scene) => [scene.id, `${scene.id}/${scene.nodes[0].id}`]));
    const predecessors = new Map([...nodeByKey.keys()].map((key) => [key, new Set()]));
    const addEdge = (from, to) => {
      if (!nodeByKey.has(to)) throw new Error(`第六章圖邊目標不存在:${from}→${to}`);
      predecessors.get(to).add(from);
    };
    for (const { scene, node, key } of nodeByKey.values()) {
      if (node.type === "goto") addEdge(key, firstKey.get(node.scene));
      else if (node.type === "choice")
        for (const option of node.options || []) addEdge(key, `${scene.id}/${option.next}`);
      else if (node.next) addEdge(key, `${scene.id}/${node.next}`);
    }
    const start = firstKey.get(scenes6.startScene);
    const allKeys = new Set(nodeByKey.keys());
    const dominators = new Map();
    for (const key of allKeys) dominators.set(key, key === start ? new Set([key]) : new Set(allKeys));
    let changed = true;
    while (changed) {
      changed = false;
      for (const key of allKeys) {
        if (key === start) continue;
        const preds = [...predecessors.get(key)];
        if (!preds.length) continue;
        let next = new Set(dominators.get(preds[0]));
        for (const pred of preds.slice(1))
          next = new Set([...next].filter((candidate) => dominators.get(pred).has(candidate)));
        next.add(key);
        const current = dominators.get(key);
        if (next.size !== current.size || [...next].some((candidate) => !current.has(candidate))) {
          dominators.set(key, next);
          changed = true;
        }
      }
    }
    for (const decision of scenes6.decisionRegistry) {
      if (decision.preselected !== false) throw new Error("題目有預選:" + decision.id);
      const decisionKey = `${decision.scene}/${decision.node}`;
      if (!nodeByKey.has(decisionKey)) throw new Error("decision 節點不存在:" + decision.id);
      for (const option of decision.options) {
        if (option.isCorrect) continue;
        if (!option.refutedBy.length) throw new Error("錯項缺 refutedBy:" + decision.id + "/" + option.id);
        for (const ref of option.refutedBy) {
          const sourceKey = ref.includes("/") ? ref : evidenceAt.get(ref);
          if (!sourceKey || !nodeByKey.has(sourceKey))
            throw new Error("refutedBy 無法解析:" + decision.id + "/" + option.id + "→" + ref);
          if (!dominators.get(decisionKey).has(sourceKey))
            throw new Error("refutedBy 尚未見:" + decision.id + "/" + option.id + "→" + ref);
        }
      }
    }
    if (![...sceneOrder.keys()].includes("HE-1")) throw new Error("scene registry 遺漏 HE-1");
  }
});

tests.push({
  name: "第六章全章走查|十一座互動、S8/T1–T5、共同頁、存檔淨化與舞台接線",
  fn: () => {
    const San = require("../src/sanitize.js");
    const N6 = Narrative._factory(scenes6, Engine6, {});
    let state = N6.initialState("explore");
    const act = (action, args = {}) => {
      const out = N6.labAction(state, action, args);
      if (out.error) throw new Error(`${state.cursor.scene}/${state.cursor.node} ${action}:${out.error}`);
      state = out.state;
    };
    const finishEmbed = (phase) => {
      if (phase === "heat-source-ledger") {
        for (const source of Engine6.SOURCES)
          act("setSourceLedger", { source, position:`${source}-position`, consequence:`${source}-change` });
        act("sealModels", { caloric:"finite-sources", motion:"continued-motion" });
      } else if (phase === "chip-capacity-bench") {
        act("runChipComparison");
        act("judgeChipComparison", { concept:"chips-not-lower-capacity" });
      } else if (phase === "friction-condition-bench") {
        for (const condition of ["rotation-only", "pressure-only", "contact-motion"])
          act("runFrictionCondition", { condition });
        act("judgeFrictionConditions", { concept:"contact-and-motion" });
      } else if (phase === "dry-strip-bench") {
        act("runDryStrip");
        act("judgeDryStrip", { concept:"observed-range-only" });
      } else if (phase === "airtight-bench") {
        act("sealAirPrediction", { prediction:"slower-when-sealed" });
        act("runAirComparison", { condition:"open" });
        act("runAirComparison", { condition:"sealed" });
        act("judgeAirComparison", { concept:"air-not-necessary" });
      } else if (phase === "water-box-bench") {
        for (const [field, value] of [["sealed", true], ["leakChecked", true], ["sampling", true]])
          act("setWaterDraft", { field, value });
        act("prepareWaterBox");
      } else if (phase === "finite-source-prediction-bands") {
        const bands = { chips:"soon", cannon:"within-shift", air:"soon", water:"within-shift" };
        for (const [source, band] of Object.entries(bands)) act("setFinitePrediction", { source, band });
        act("sealFinitePredictions");
      } else if (phase === "continuous-run-bench") {
        for (let index = 0; index < 6; index += 1) act("runContinuousSegment", { action:"continue" });
      } else if (phase === "source-prediction-verdict") {
        for (const source of Engine6.SOURCES) act("judgeFiniteSource", { source, verdict:"not-fulfilled" });
      } else if (phase === "model-audit-board") {
        for (const [slot, evidence] of [["chips", "T1"], ["air", "T3"], ["cannon", "T4"], ["water", "T4"], ["condition", "T2"]])
          act("placeAuditEvidence", { slot, evidence });
        act("setLatentDisposition", { disposition:"motion-unresolved" });
        act("completeAudit");
      } else if (phase === "joint-verification-page") {
        for (const [column, text] of Object.entries(Engine6.JOINT_VALUES)) act("setJointColumn", { column, text });
        act("prepareJointPage");
      } else throw new Error("未知第六章互動 phase:" + phase);
      const completed = N6.embedComplete(state);
      if (completed.error) throw new Error("互動未能收束:" + completed.error);
      state = completed.state;
    };
    for (let guard = 0; guard < 1000 && !state.ended; guard += 1) {
      const view = N6.view(state);
      if (view.type === "line" || view.type === "system" || view.type === "histfacts") {
        const out = N6.advance(state);
        if (out.error) throw new Error(`${view.scene}/${view.nodeId}:${out.error}`);
        state = out.state;
      } else if (view.type === "choice") {
        const def = N6._sceneMap[view.scene].nodes[view.nodeId];
        const correct = def.options.find((option) => !option.refutedBy);
        const out = N6.choose(state, correct.id);
        if (out.error) throw new Error(`${view.scene}/${view.nodeId}/${correct.id}:${out.error}`);
        state = out.state;
      } else if (view.type === "embed") finishEmbed(view.phase);
      else if (view.type === "review") {
        const out = N6.setReview(state, "我如何逐一排除有限來源", "範圍與兌換率仍未決");
        if (out.error) throw new Error(out.error);
        state = out.state;
      } else if (view.type === "end") {
        const out = N6.advance(state);
        if (out.error) throw new Error(out.error);
        state = out.state;
      } else throw new Error("未處理的第六章節點:" + view.type);
    }
    if (!state.ended || state.lab.phase !== "complete" ||
        !["S8", "T1", "T2", "T3", "T4", "T5"].every((id) => state.evidence[id]))
      throw new Error("第六章黃金路徑未完成或證據不齊");
    if (!Object.values(state.lab.jointPage.signedBy).every(Boolean) || state.lab.days !== 14)
      throw new Error("第六章四方署名或工作日誌不一致");
    const clean = San.sanitizeImport6(JSON.parse(N6.serialize(state)), scenes6, Engine6);
    if (!clean.ok) throw new Error("合法完章存檔遭拒:" + clean.reason);
    const forgedT4 = JSON.parse(N6.serialize(state));
    forgedT4.lab.finiteSources.verdicts.water = null;
    forgedT4.lab.finiteSources.sealState.water = "intact";
    forgedT4.lab.finiteSources.complete = false;
    if (San.sanitizeImport6(forgedT4, scenes6, Engine6).ok) throw new Error("缺第四張判讀仍可冒充 T4 完章");
    const forgedT5 = JSON.parse(N6.serialize(state));
    forgedT5.lab.jointPage.signedBy.traveler = false;
    if (San.sanitizeImport6(forgedT5, scenes6, Engine6).ok) throw new Error("缺旅人最終署名仍可冒充 T5");
    const vanishedSeal = JSON.parse(N6.serialize(state));
    vanishedSeal.lab.finiteSources.sealState.chips = "hidden";
    if (San.sanitizeImport6(vanishedSeal, scenes6, Engine6).ok) throw new Error("封條消失狀態未被拒絕");

    const json = JSON.parse(readFileSync(path.join(here, "../data/scenes6.json"), "utf-8"));
    if (JSON.stringify(scenes6) !== JSON.stringify(json)) throw new Error("scenes6 鏡像漂移");
    const histfacts6 = require("../data/histfacts6.js");
    const histJson = JSON.parse(readFileSync(path.join(here, "../data/histfacts6.json"), "utf-8"));
    if (JSON.stringify(histfacts6) !== JSON.stringify(histJson) ||
        histfacts6.rows.some((row) => !histfacts6.labels.includes(row.label)))
      throw new Error("histfacts6 鏡像或 label enum 漂移");
    const html = readFileSync(path.join(here, "../stage.html"), "utf-8");
    const ui = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
    const stageUi = readFileSync(path.join(here, "../src/stage-ui.js"), "utf-8");
    for (const fragment of ["data/scenes6.js", "data/histfacts6.js", "src/engine6.js",
      'requested === "ch06"', "before-discovery:chapter6:v1"])
      if (!html.includes(fragment)) throw new Error("第六章入口接線缺失:" + fragment);
    for (const fragment of ["renderHeat6", "finite-source-prediction-bands", "source-prediction-verdict",
      "sanitizeImport6", "封存第六章"])
      if (!ui.includes(fragment)) throw new Error("第六章 UI 接線缺失:" + fragment);
    if (!stageUi.includes('d.system === "heat"') || !stageUi.includes('CHAPTER_ID === "ch6"') ||
        !stageUi.includes('stage.html?chapter=ch06'))
      throw new Error("第六章沒有接進舞台視圖或第五章章尾出口");
  }
});

tests.push({
  name: "中文顯示標點|中文語境全形化，數字比例／拉丁文／代碼保持原樣",
  fn: () => {
    const sample = "(把玩兩顆鉛球)亞里斯多德說:十倍重,十倍快!";
    const shown = TextFormat.normalizeZhPunctuation(sample);
    if (shown !== "（把玩兩顆鉛球）亞里斯多德說：十倍重，十倍快！")
      throw new Error("中文標點正規化失敗:" + shown);
    const technical = "等時距 1:3:5:7；E3.a；(De Motu)";
    if (TextFormat.normalizeZhPunctuation(technical) !== technical)
      throw new Error("技術字串遭誤改");
    if (TextFormat.playerSceneTitle("死路 A:歸檔(大學迴廊,翌日)") !== "歸檔（大學迴廊，翌日）")
      throw new Error("場景製作術語未在呈現邊界移除");
    if (TextFormat.playerSceneTitle("修復:用證據道歉") !== "用證據道歉")
      throw new Error("修復節點標籤未在呈現邊界移除");
    const people = "Isaac Newton、Edmond Halley、Robert Hooke、John Flamsteed；Newton、Halley、Hooke、Flamsteed";
    const zhPeople = "艾薩克・牛頓、愛德蒙・哈雷、羅伯特・虎克、約翰・佛蘭斯蒂德；牛頓、哈雷、虎克、佛蘭斯蒂德";
    if (TextFormat.playerText(people) !== zhPeople)
      throw new Error("第四章玩家介面仍會外漏英文人名:" + TextFormat.playerText(people));
  }
});

/* R-DATA-05|鏡像一致性:.js 執行載體 與 .json 規範鏡像 深度相等 */
tests.push({
  name: "R-DATA-05|patterns.js ≡ patterns.json",
  fn: () => {
    const json = JSON.parse(readFileSync(path.join(here, "../data/patterns.json"), "utf-8"));
    if (JSON.stringify(patterns) !== JSON.stringify(json)) throw new Error("patterns 鏡像漂移");
  }
});
tests.push({
  name: "R-DATA-05|debate.js ≡ debate.json",
  fn: () => {
    const json = JSON.parse(readFileSync(path.join(here, "../data/debate.json"), "utf-8"));
    if (JSON.stringify(debate) !== JSON.stringify(json)) throw new Error("debate 鏡像漂移");
  }
});
tests.push({
  name: "R-END-02|histfacts.js ≡ histfacts.json;每列 label ∈ 宣告 enum",
  fn: () => {
    const hf = require("../data/histfacts.js");
    const json = JSON.parse(readFileSync(path.join(here, "../data/histfacts.json"), "utf-8"));
    if (JSON.stringify(hf) !== JSON.stringify(json)) throw new Error("histfacts 鏡像漂移");
    if (!Array.isArray(hf.labels) || !hf.labels.length) throw new Error("histfacts 缺 labels enum");
    hf.rows.forEach((r) => {
      if (!r.item || !r.label) throw new Error("histfacts 列缺 item/label");
      if (hf.labels.indexOf(r.label) < 0) throw new Error("label 不在 enum:" + r.label);
    });
  }
});
tests.push({
  name: "R-DATA-06|scenes.js ≡ scenes.json",
  fn: () => {
    const json = JSON.parse(readFileSync(path.join(here, "../data/scenes.json"), "utf-8"));
    if (JSON.stringify(scenes) !== JSON.stringify(json)) throw new Error("scenes 鏡像漂移");
    const retiredGenerator = readFileSync(path.join(here, "../tools/gen_scenes.py"), "utf-8");
    const stopAt = retiredGenerator.indexOf("raise SystemExit");
    const oldDataAt = retiredGenerator.indexOf("SCENES = [");
    if (!(stopAt >= 0 && oldDataAt > stopAt) ||
        !retiredGenerator.includes("node tools/build-ch1-data.mjs") ||
        !retiredGenerator.includes("data/scenes.json"))
      throw new Error("舊 gen_scenes.py 仍可能覆寫第一章 canonical 資料");
  }
});
tests.push({
  name: "§5.9|assets.js ≡ assets.json;schema+場景映射完備性",
  fn: () => {
    const assets = require("../data/assets.js");
    const json = JSON.parse(readFileSync(path.join(here, "../data/assets.json"), "utf-8"));
    if (JSON.stringify(assets) !== JSON.stringify(json)) throw new Error("assets 鏡像漂移");
    const KINDS = ["bg", "portrait", "card", "prop", "cg", "fx"];
    const ids = new Set();
    assets.entries.forEach((e) => {
      if (ids.has(e.id)) throw new Error("資產 id 重複:" + e.id);
      ids.add(e.id);
      if (KINDS.indexOf(e.kind) < 0) throw new Error("kind 非法:" + e.id);
      if (!("path" in e) || !("firstScreen" in e)) throw new Error("缺 path/firstScreen:" + e.id);
      (e.layers || []).forEach((L) => {
        if (typeof L.anchorX !== "number" || typeof L.anchorY !== "number" || typeof L.w !== "number")
          throw new Error("layers 錨點欄位非數值:" + e.id);
      });
    });
    Object.values(assets.sceneBg).forEach((id) => {
      if (!ids.has(id)) throw new Error("sceneBg 指向不存在資產:" + id);
    });
    Object.values(assets.speakerPortrait).forEach((id) => {
      if (!ids.has(id)) throw new Error("speakerPortrait 指向不存在資產:" + id);
    });
    /* 完備性:scenes.js 每個場景都要有背景槽位(path 可 null,槽位不可缺) */
    scenes.scenes.forEach((s) => {
      if (!(s.id in assets.sceneBg)) throw new Error("場景缺背景槽位:" + s.id);
    });
    /* 已填 path 的資產,檔案必須實際存在(防 manifest 先行於檔案) */
    assets.entries.forEach((e) => {
      if (e.path) {
        const p = path.join(here, "..", assets.basePath, e.path);
        try { readFileSync(p); } catch (err) { throw new Error("path 已填但檔案不存在:" + e.id + " → " + e.path); }
      }
    });
  }
});
tests.push({
  name: "§5.7|tokens 生成器:驗證通過+落後檢測(committed css ≡ 再生結果)",
  fn: async () => {
    const { validateTokens, generateCss } = await import("../tools/gen_tokens.mjs");
    const srcReal = path.join(here, "../../art/style/tokens.json");
    const srcEx = path.join(here, "../data/tokens.example.json");
    let srcPath = srcEx;
    try { readFileSync(srcReal); srcPath = srcReal; } catch (e) {}
    const text = readFileSync(srcPath, "utf-8");
    const data = JSON.parse(text);
    data._source = path.basename(srcPath) + (srcPath === srcEx ? "(example)" : "");
    validateTokens(data);
    const css = generateCss(data, text);
    const committed = readFileSync(path.join(here, "../../public/assets/global/tokens.css"), "utf-8");
    if (committed !== css) throw new Error("tokens.css 落後於來源——請重跑 tools/gen_tokens.mjs");
    /* 負向:缺必要 token 必敗 */
    const bad = JSON.parse(text);
    delete bad.tokens["color-focus"];
    let threw = false;
    try { validateTokens(bad); } catch (e) { threw = true; }
    if (!threw) throw new Error("缺必要 token 未被攔截");
  }
});

tests.push({
  name: "器材踏查|三章配置完備+第三章重構不強制舊清單+舊存檔相容",
  fn: () => {
    const assets = require("../data/assets.js");
    const ids = new Set(assets.entries.map((e) => e.id));
    for (const key of ["ch1:A2-2", "ch2:B2-3", "ch3:C1-1"]) {
      const cfg = (assets.apparatusBriefings || {})[key];
      if (!cfg || !cfg.title || !cfg.enterLabel || !ids.has(cfg.plateAsset) || !Array.isArray(cfg.items) || cfg.items.length < 3)
        throw new Error("器材踏查配置不完整:" + key);
      const seen = new Set();
      for (const item of cfg.items) {
        if (!item.id || seen.has(item.id) || !item.label || !item.function || !item.line) throw new Error("器材條目不完整/重複:" + key);
        seen.add(item.id);
        if (!ids.has(item.asset)) throw new Error("器材條目指向不存在資產:" + key + "/" + item.id);
        if (!(item.x >= 0 && item.x <= 100 && item.y >= 0 && item.y <= 100)) throw new Error("器材亮點座標越界:" + key + "/" + item.id);
      }
      const plate = assets.entries.find((entry) => entry.id === cfg.plateAsset);
      if (!plate.path || !existsSync(path.join(here, "../../public/assets", plate.path)))
        throw new Error("器材踏查底板檔案不存在:" + key);
    }
    const c2 = assets.apparatusBriefings["ch2:B2-3"];
    for (const id of ["shortGroove", "sandbed"])
      if (!c2.items.find((item) => item.id === id && item.fixed === true)) throw new Error("第二章固定器材未標示:" + id);
    const sandbed = c2.items.find((item) => item.id === "sandbed");
    for (const frag of ["固定骨架", "真正要選的是落點讀法"])
      if (!sandbed.function.includes(frag)) throw new Error("升降沙盤與量測選項仍混為一談:" + frag);
    for (const partId of Object.keys(assets.workshopPartAsset || {})) {
      const guide = (assets.workshopPartGuide || {})[partId];
      if (!guide || !guide.detail || !guide.coach) throw new Error("第二章可選零件缺工坊差異說明:" + partId);
    }
    const stage = readFileSync(path.join(here, "../stage.html"), "utf-8");
    const sui = readFileSync(path.join(here, "../src/stage-ui.js"), "utf-8");
    const cui = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
    for (const frag of ['id="apparatusSurvey"', 'id="asHotspots"', 'id="btnApparatusGo"', "width: 52px", "height: 52px"])
      if (!stage.includes(frag)) throw new Error("器材踏查 DOM/觸控尺寸缺失:" + frag);
    for (const frag of ["showApparatusSurvey", "apparatusBriefings", "button:not(.visited)"])
      if (!sui.includes(frag)) throw new Error("器材踏查流程/鍵盤守衛缺失:" + frag);
    if (!cui.includes("E2._FIXED_SLOTS") || !cui.includes("已固定｜無須更換"))
      throw new Error("固定器材仍被畫成可更換選單");
    if (!stage.includes(".catSlot.isFixed") || !stage.includes("word-break: keep-all"))
      throw new Error("固定件標籤可能在窄卡片內逐字斷行");
    const c1 = assets.apparatusBriefings["ch1:A2-2"];
    if (c1.platePosition !== "left center" || c1.items.find((item) => item.id === "waterClock").x >= 20)
      throw new Error("第一章器材踏查未保住左側水鐘取景");
    if (!sui.includes("platePosition") || !sui.includes("style.objectPosition"))
      throw new Error("器材踏查未套用場景個別取景位置");
    const c3 = assets.apparatusBriefings["ch3:C1-1"];
    if (c3.items.length !== 4 ||
        !["releaseRig", "beatDrum", "landingTray", "paperRulers"].every((id) => c3.items.some((item) => item.id === id)))
      throw new Error("第三章器材踏查未聚焦放手、同拍、落點與兩張原紙");
    const releaseRig = c3.items.find((item) => item.id === "releaseRig");
    if (!releaseRig || releaseRig.y > 25 || releaseRig.x < 35 || releaseRig.x > 55)
      throw new Error("第三章桅頂放手裝置亮點沒有落在桅頂區");
    const stageEvents = readFileSync(path.join(here, "../src/stage/05-events.part.js"), "utf-8");
    if (stageEvents.includes('CHAPTER_ID === "ch3" && targetScene === "C1-1"'))
      throw new Error("第三章仍繞過共用器材踏查流程");
  }
});

tests.push({
  name: "舞台殼|stage.html DOM 契約:chapter-ui 引用之 id 全數存在;stage-ui 純表現層",
  fn: () => {
    const ui = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
    const html = readFileSync(path.join(here, "../stage.html"), "utf-8");
    const ids = [...new Set([...ui.matchAll(/\$\("([A-Za-z-]+)"\)/g)].map((m) => m[1]))];
    if (ids.length < 25) throw new Error("id 萃取異常(僅 " + ids.length + " 個)——正規式或檔案結構變動");
    const stageOnlyIds = new Set([
      "chapterRail", "chapterDirectory", "chapterDirectoryMeta", "btnPrevChapter", "btnNextChapter"
    ]);
    for (const page of ["stage.html", "chapter.html"]) {
      const html = readFileSync(path.join(here, "..", page), "utf-8");
      const requiredIds = page === "stage.html" ? ids : ids.filter((id) => !stageOnlyIds.has(id));
      const missing = requiredIds.filter((id) => !html.includes('id="' + id + '"'));
      if (missing.length) throw new Error(page + " 缺 id:" + missing.join("、"));
      if (!html.includes('name="mode"')) throw new Error(page + " 缺模式選擇 radio(name=mode)");
    }
    const stageHtml = readFileSync(path.join(here, "../stage.html"), "utf-8");
    if (!(stageHtml.indexOf("src/chapter-ui.js") < stageHtml.indexOf("src/stage-ui.js")))
      throw new Error("stage.html 載入順序錯誤:chapter-ui.js 必須先於 stage-ui.js");
    /* stage-ui = 純表現層:禁碰引擎與存檔(事件單向訂閱) */
    const sui = readFileSync(path.join(here, "../src/stage-ui.js"), "utf-8");
    if (/GB\.Narrative|GB\.Engine|localStorage/.test(sui))
      throw new Error("stage-ui.js 越權:出現引擎或存檔存取——表現層只准訂閱 bd:* 事件");
    /* chapter-ui 掛點存在(stage 依賴的事件名) */
    for (const evName of ["bd:line", "bd:scene", "bd:view", "bd:start"]) {
      if (!ui.includes('"' + evName + '"')) throw new Error("chapter-ui.js 缺事件掛點:" + evName);
      if (!sui.includes('"' + evName + '"')) throw new Error("stage-ui.js 未訂閱:" + evName);
    }
  }
});

tests.push({
  name: "舞台殼 v2|視覺修正契約:筆記本模式/半身像 fallback/idle 推進/場景範圍預載",
  fn: () => {
    const stageHtml = readFileSync(path.join(here, "../stage.html"), "utf-8");
    const sui = readFileSync(path.join(here, "../src/stage-ui.js"), "utf-8");
    /* 一、筆記本模式:modal 語義+分頁+44px 觸控+焦點歸還 */
    for (const frag of ['id="notebook"', 'role="dialog"', 'aria-modal="true"',
      'id="nbTabEvidence"', 'id="nbTabLog"', 'id="nbLabSnap"',
      'id="labIntro"', 'id="btnLabHelp"', ">第1段<", "紀錄不可刪",
      'id="prologueCard"', "讓證據成立的人",
      'id="debIntro"', 'id="repToast"', 'id="hudTip"']) {
      if (!stageHtml.includes(frag)) throw new Error("stage.html 缺筆記本/實驗台要素:" + frag);
    }
    if (!stageHtml.includes("min-height: 44px")) throw new Error("觸控區 44px 規則缺失");
    if (!/btnDrawer"\)\.focus\(\)/.test(sui)) throw new Error("筆記關閉後焦點未歸還 btnDrawer");
    if (!sui.includes("focusin")) throw new Error("modal 焦點圍欄缺失");
    /* 二、半身像:左右雙槽+遮罩 fallback+禁鏡像 */
    if (!stageHtml.includes('id="bustLeft"') || !stageHtml.includes('id="bustRight"') || !stageHtml.includes("mask-image"))
      throw new Error("雙肖像槽或柔邊遮罩 fallback 缺失");
    if (!sui.includes("speakerDialoguePortrait")) throw new Error("speakerDialoguePortrait 接口鏈缺失");
    if (/scaleX\(\s*-1\s*\)/.test(sui) || /scaleX\(\s*-1\s*\)/.test(stageHtml))
      throw new Error("偵測到 CSS 水平鏡像——角色特徵不可翻面");
    /* 三、字級:對話 clamp 下限 ≥24px(桌機),分頁函式存在(不出捲軸) */
    if (!/#dlgText\s*\{[^}]*clamp\(2[4-9]px/.test(stageHtml)) throw new Error("對話字級 clamp 下限低於 24px");
    if (!sui.includes("function paginate")) throw new Error("對話分頁缺失(長台詞會溢出或出捲軸)");
    if (/#dlgText\s*\{[^}]*overflow-y/.test(stageHtml)) throw new Error("對話框出現捲軸樣式——應以分頁處理");
    /* 四、idle 推進+標點停頓+場景範圍預載(禁全 manifest) */
    if (!sui.includes("function idleAdvance")) throw new Error("句完 Enter/Space 觸發繼續(idleAdvance)缺失");
    if (!sui.includes("charDelay")) throw new Error("標點停頓(charDelay)缺失");
    if (!sui.includes("function preloadScene")) throw new Error("場景範圍預載缺失");
    if (/function preloadAll/.test(sui)) throw new Error("禁止全 manifest 預載(preloadAll)——首屏 3MB 預算");
  }
});

tests.push({
  name: "整合包|scene-aware 肖像:映射完備+年代守衛(1590≠39/72,1603+≠26/58)+旅人無肖像",
  fn: () => {
    const assets = JSON.parse(readFileSync(path.join(here, "../data/assets.json"), "utf-8"));
    const ids = new Set(assets.entries.map((e) => e.id));
    const scenes2Portrait = require("../data/scenes2.js");
    const scenes3Portrait = require("../data/scenes3.js");
    const scenes4Portrait = require("../data/scenes4.js");
    const scenes5Portrait = require("../data/scenes5.js");
    const allPortraitScenes = scenes.scenes.concat(
      scenes2Portrait.scenes,
      scenes3Portrait.scenes,
      scenes4Portrait.scenes
    );
    const sceneIds = new Set(allPortraitScenes.concat(
      scenes5Portrait.scenes
    ).map((s) => s.id));
    /* 第四章 schema1 的舊游標仍可能在遷移提示／舊 transcript 中出現；
       資產表可保留這五列，但 v0.8 的 12 個有效場景仍逐場驗完。 */
    const legacyCh4PortraitScenes = new Set(["D1-3", "D2-3", "D3-2", "D3-3", "D3-4"]);
    const sdp = assets.sceneDialoguePortrait || {};
    const EARLY = /^(P0-|A1-)/;                 /* 1590:26 歲伽利略/58 歲辛普里奧 */
    const CH2 = /^(B|SC-R1)/;                   /* 1608+:44 歲伽利略/76 歲辛普里奧 */
    for (const [sc, m] of Object.entries(sdp)) {
      if (!sceneIds.has(sc) && !legacyCh4PortraitScenes.has(sc))
        throw new Error("sceneDialoguePortrait 指向不存在場景:" + sc);
      for (const [sp, aid] of Object.entries(m)) {
        if (!ids.has(aid)) throw new Error("肖像映射指向不存在資產:" + sc + "/" + sp + "→" + aid);
        if (sp === "旅人" || sp === "旅人(你)") throw new Error("旅人不得入對話肖像映射(驗收6):" + sc);
        if (EARLY.test(sc) && /39|72/.test(aid)) throw new Error("年代錯置:1590 場景用了老年肖像:" + sc + "→" + aid);
        if (!EARLY.test(sc) && /26|58/.test(aid)) throw new Error("年代錯置:1603+ 場景用了青年肖像:" + sc + "→" + aid);
        if (CH2.test(sc) && (sp === "伽利略" || sp === "辛普里奧") && !/44|76/.test(aid))
          throw new Error("年代錯置:第二章未用 44/76 歲肖像:" + sc + "→" + aid);
      }
    }
    /* 每個場景都要有 scene-aware 覆寫列(伽利略/辛普里奧年代安全的前提) */
    allPortraitScenes.forEach((s) => {
      if (!(s.id in sdp)) throw new Error("場景缺對話肖像覆寫列:" + s.id);
    });
    const spd = assets.speakerDialoguePortrait || {};
    for (const [sp, aid] of Object.entries(spd)) {
      if (!ids.has(aid)) throw new Error("speakerDialoguePortrait 指向不存在資產:" + sp);
      if (sp === "伽利略" || sp === "辛普里奧") throw new Error("跨年代角色禁設對話預設(年代安全):" + sp);
      if (sp === "旅人" || sp === "旅人(你)") throw new Error("旅人不得設對話預設(驗收6)");
    }
    /* 解析順序:台詞覆寫→場景覆寫→對話預設→筆記頭像 */
    const sui = readFileSync(path.join(here, "../src/stage-ui.js"), "utf-8");
    const a0 = sui.indexOf("lineOverride(speaker, text)");
    const a = sui.indexOf("sceneDialoguePortrait[curSceneId]");
    const b = sui.indexOf("speakerDialoguePortrait[speaker]");
    const c = sui.indexOf("speakerPortrait[speaker]");
    if (!(a0 >= 0 && a > a0 && b > a && c > b)) throw new Error("肖像四層解析順序錯誤(應:台詞→場景→預設→筆記頭像)");
    /* 台詞級覆寫:目標存在+match 真的出現在該場景/辯論文本+年代守衛 */
    const ldp = assets.lineDialoguePortrait || [];
    const scenesText = readFileSync(path.join(here, "../data/scenes.json"), "utf-8") +
      readFileSync(path.join(here, "../data/scenes2.json"), "utf-8") +
      readFileSync(path.join(here, "../data/scenes3.json"), "utf-8") +
      readFileSync(path.join(here, "../data/scenes4.json"), "utf-8");
    const debateText = readFileSync(path.join(here, "../data/debate.json"), "utf-8") +
      readFileSync(path.join(here, "../data/debate2.json"), "utf-8");
    for (const r of ldp) {
      if (!ids.has(r.asset)) throw new Error("台詞覆寫指向不存在資產:" + r.asset);
      if (!sceneIds.has(r.scene)) throw new Error("台詞覆寫指向不存在場景:" + r.scene);
      if (!r.match || (!scenesText.includes(r.match) && !debateText.includes(r.match)))
        throw new Error("台詞覆寫 match 字串不存在於任何文本:" + r.match);
      if (EARLY.test(r.scene) && /39|72/.test(r.asset)) throw new Error("台詞覆寫年代錯置:" + r.scene);
      if (!EARLY.test(r.scene) && /26|58/.test(r.asset)) throw new Error("台詞覆寫年代錯置:" + r.scene);
      if (CH2.test(r.scene) && (r.speaker === "伽利略" || r.speaker === "辛普里奧") && !/44|76/.test(r.asset))
        throw new Error("第二章台詞覆寫未用 44/76 歲肖像:" + r.scene);
      if (r.speaker === "旅人" || r.speaker === "旅人(你)") throw new Error("旅人不得入台詞覆寫");
    }
  }
});

tests.push({
  name: "雙槽+資料密度|站位資料驅動/剪影按側/20 筆保留/分組不動守衛(Sol 審核 20260720)",
  fn: () => {
    const assets = JSON.parse(readFileSync(path.join(here, "../data/assets.json"), "utf-8"));
    const ids = new Set(assets.entries.map((e) => e.id));
    /* 站位=資料來源,值域受控;依原圖朝向:伽利略朝左→站右、辛普里奧朝右→站左 */
    const side = assets.speakerSide || {};
    for (const [sp, v] of Object.entries(side))
      if (v !== "left" && v !== "right") throw new Error("speakerSide 值非法:" + sp + "→" + v);
    if (side["伽利略"] !== "right" || side["辛普里奧"] !== "left")
      throw new Error("站位違反原圖朝向資料(伽利略=right/辛普里奧=left)");
    /* 旅人剪影:兩側各自資產(重新構圖,非鏡像),預設開啟、?travelerBust=0 撤回 */
    const ts = assets.travelerSilhouette || {};
    for (const s of ["left", "right"]) {
      if (!ts[s] || !ids.has(ts[s])) throw new Error("travelerSilhouette 缺 " + s + " 側資產");
    }
    const sui = readFileSync(path.join(here, "../src/stage-ui.js"), "utf-8");
    if (!sui.includes("speakerSide") || !sui.includes("travelerSilhouette"))
      throw new Error("stage-ui 未使用資料驅動站位/剪影(疑似硬編碼)");
    if (!sui.includes("travelerBust=0")) throw new Error("剪影撤回參數(?travelerBust=0)缺失");
    if (!sui.includes('setLit("none")')) throw new Error("旁白/系統雙暗(setLit none)缺失");
    if (!sui.includes('classList.toggle("voice-no-portrait", noPortraitVoice)'))
      throw new Error("旁白/系統未切換無肖像版面");
    const stageHtml = readFileSync(path.join(here, "../stage.html"), "utf-8");
    for (const frag of ["#dialogue.voice-no-portrait .bslot", "#dialogue.voice-no-portrait #dlgText"])
      if (!stageHtml.includes(frag)) throw new Error("無肖像聲部未退場或未歸還文字寬度:" + frag);
    if (/scaleX\(\s*-1\s*\)/.test(sui)) throw new Error("偵測到鏡像");
    /* 引擎:連跑 20 次,state 保留 20 筆且 JSON 往返無損(紀錄不可刪的程式面) */
    let s = Engine.initialState();
    const cfg = { ball: "銅大", surface: "打磨", incline: "陡", timer: "水鐘" };
    for (let i = 0; i < 20; i++) {
      const r = Engine.runExperiment(s, cfg);
      s = r.state || r; /* 兼容回傳形狀 */
    }
    if (s.evidence.runs.length !== 20) throw new Error("20 次後 runs=" + s.evidence.runs.length);
    const back = JSON.parse(JSON.stringify(s));
    if (JSON.stringify(back) !== JSON.stringify(s)) throw new Error("serialize 往返漂移");
    if (back.evidence.runs.length !== 20) throw new Error("往返後筆數丟失");
    /* 分組=純 view:chapter-ui 具 grpToggle/aria-expanded/勾選永見;不碰引擎守衛 */
    const cui = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
    for (const frag of ["grpToggle", "aria-expanded", "expandedRuns", "勾選永遠可見"])
      if (!cui.includes(frag)) throw new Error("chapter-ui 分組要素缺失:" + frag);
    if (!/style\.display\s*=\s*"none"/.test(cui)) throw new Error("摺疊應為 display 隱藏(不刪 DOM/state)");
  }
});

tests.push({
  name: "序幕 v03 六板|映射+舊版未引用+禁可見疊層+固定時間+可及性(Sol 交接 20260720)",
  fn: () => {
    const assetsText = readFileSync(path.join(here, "../data/assets.json"), "utf-8");
    const assets = JSON.parse(assetsText);
    const ids = new Set(assets.entries.map((e) => e.id));
    const pp = assets.prologuePlates || {};
    for (const k of ["1", "2", "3", "4", "5", "6"])
      if (!pp[k] || !ids.has(pp[k]) || !pp[k].includes("v03")) throw new Error("prologuePlates 缺 v03 板 " + k);
    /* 舊版未引用:v01/v02 廢案禁止出現在 manifest */
    for (const old of ["p0_0_plate01_dark_room", "p0_0_plate02_aurora_intrusion",
      "p0_0_plate03_reach_glass", "p0_0_plate04_whitefall", "ch01/prologue/p0_0_plate"])
      if (assetsText.includes(old)) throw new Error("廢案仍被引用:" + old);
    /* 禁可見疊層:文字已直生於圖,程式不得再畫文章/新聞/通知/游標/動態時鐘/白層 */
    const stageHtml = readFileSync(path.join(here, "../stage.html"), "utf-8");
    for (const banned of ['id="mzScreen"', 'id="mzArticle"', 'id="mzPush"', 'id="mzCursor"',
      'id="mzNotifs"', 'id="mzClock"', 'id="mzWhite"', 'id="mzAurora"'])
      if (stageHtml.includes(banned)) throw new Error("v03 禁令:可見疊層仍存在 " + banned);
    for (const frag of ['id="mzPlateA"', 'id="mzPlateB"', 'id="mzSr"', 'aria-live="polite"', 'id="mzTitleLines"'])
      if (!stageHtml.includes(frag)) throw new Error("序幕要素缺失:" + frag);
    const sui = readFileSync(path.join(here, "../src/stage-ui.js"), "utf-8");
    /* 固定時間 00:49 已入圖:程式不得輸出動態時鐘 */
    if (/new Date\(/.test(sui)) throw new Error("固定時間契約:stage-ui 不得再有 new Date() 可見時鐘");
    /* 拍→板映射(n1-n2→1/n3→2/n4-n5→3/n6→4/n7→5/n8-n9→6) */
    if (!sui.includes("MZ_PLATE = [1, 1, 2, 3, 3, 4, 5, 6, 6]")) throw new Error("六板拍映射不符交接規格");
    /* 可及性:文章/新聞完整內容經隱藏 live region 送出;科學措辭鎖定 */
    if (!/mzSay\("平板畫面:/.test(sui) || !/mzSay\("突發新聞:/.test(sui))
      throw new Error("文章/新聞關鍵內容未經可及性文字送出");
    for (const frag of ["地磁風暴", "異常增幅原因待查", "通俗故事常這樣開場", "那兩顆球"])
      if (!sui.includes(frag)) throw new Error("可及性文字缺關鍵內容:" + frag);
    for (const banned of ["電磁風暴", "成因尚不清楚"])
      if (sui.includes(banned) || stageHtml.includes(banned)) throw new Error("違反科學措辭:" + banned);
    if (!/pc\.hidden && !pc\.contains\(ev\.target\)/.test(sui)) throw new Error("序幕焦點圍欄缺失");
  }
});

tests.push({
  name: "體感層|滾球重播/資料驅動時間蒙太奇/支柱破裂/音效掛點/E2 示意圖",
  fn: () => {
    const cui = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
    const sui = readFileSync(path.join(here, "../src/stage-ui.js"), "utf-8");
    const stageHtml = readFileSync(path.join(here, "../stage.html"), "utf-8");
    const assets = JSON.parse(readFileSync(path.join(here, "../data/assets.json"), "utf-8"));
    /* 掛點兩端對齊(chapter-ui 發佈=無訂閱者零行為;stage-ui 訂閱) */
    for (const evName of ["bd:run", "bd:debate"]) {
      if (!cui.includes('"' + evName + '"')) throw new Error("chapter-ui 缺掛點:" + evName);
      if (!sui.includes('"' + evName + '"')) throw new Error("stage-ui 未訂閱:" + evName);
    }
    /* 章首與跨年蒙太奇：各章共用契約；圖像負責時空感，文字由 HTML 呈現。 */
    const sceneIds = new Set([].concat(
      scenes.scenes, scenes2.scenes, scenes3.scenes, scenes4.scenes, scenes5.scenes, scenes6.scenes
    ).map((s) => s.id));
    const entryById = Object.fromEntries(assets.entries.map((e) => [e.id, e]));
    for (const [sc, fx] of Object.entries(assets.sceneFx || {})) {
      if (!sceneIds.has(sc)) throw new Error("sceneFx 指向不存在場景:" + sc);
      if (fx.fx !== "montage") throw new Error("sceneFx 未知效果:" + fx.fx);
      const maxSteps = sc === "C0-1" ? 6 : 3;
      if (!Array.isArray(fx.steps) || fx.steps.length < 1 || fx.steps.length > maxSteps)
        throw new Error("montage 節拍數超出場景契約:" + sc);
      for (const step of fx.steps) {
        const e = entryById[step.plate];
        if (!e) throw new Error("板圖不存在:" + step.plate);
        if (!(e.w > 0 && e.h > 0) || e.w / e.h < 1.74 || e.w / e.h > 1.8)
          throw new Error("板圖應為 16:9 安全比例:" + step.plate);
        if (!String(step.label || "").trim() || !String(step.caption || "").trim())
          throw new Error("蒙太奇節拍缺時地標籤或敘事字幕:" + sc);
      }
    }
    for (const id of ["P0-1", "INT-1", "B0-1", "C0-1", "D0-2", "E0-1"])
      if (!assets.sceneFx || !assets.sceneFx[id]) throw new Error("章首／交棒蒙太奇未註冊:" + id);
    const int1 = assets.sceneFx["INT-1"];
    if (JSON.stringify(int1.steps.map((s) => s.label)) !== JSON.stringify(["1592｜比薩 → 帕多瓦", "1597–1602｜帕多瓦", "1603｜帕多瓦"]))
      throw new Error("INT-1 年份與地點里程碑應為 1592 比薩→帕多瓦／1597–1602 帕多瓦／1603 帕多瓦");
    const b0 = assets.sceneFx["B0-1"];
    if (JSON.stringify(b0.steps.map((s) => s.plate)) !== JSON.stringify([
      "ch02_transition_1604_1608_pagefold_v01",
      "ch02_transition_old_page_handoff_v01",
      "ch02_transition_simplicio_returns_v01"
    ]))
      throw new Error("B0-1 應以翻頁／工作室／舊證據回返三拍完成第二章交棒");
    const c0 = assets.sceneFx["C0-1"];
    if (c0.triggerMatch !== "頁面自己動了")
      throw new Error("C0-1 蒙太奇應在翻頁舞台動作發生時才播放，不得搶在場景開頭");
    if (JSON.stringify(c0.steps.map((s) => s.plate)) !== JSON.stringify([
      "ch03_transition_1609_question_departs_v01",
      "ch03_transition_1610_jupiter_observation_v01",
      "ch03_transition_1616_roman_admonition_v01",
      "ch03_transition_1632_dialogue_ship_page_v01",
      "ch03_transition_1633_roman_statement_v01",
      "ch03_transition_1640_gassendi_handoff_v01"
    ]))
      throw new Error("C0-1 應依 1609→1610→1616→1632→1633→1640 六拍推進");
    for (const id of [
      "ch03_transition_1610_jupiter_observation_v01",
      "ch03_transition_1616_roman_admonition_v01",
      "ch03_transition_1633_roman_statement_v01"
    ]) {
      const entry = entryById[id];
      if (!entry?.sourceMaster ||
          !existsSync(path.join(here, "../../", entry.sourceMaster)))
        throw new Error("C0-1 新年代圖缺可追溯母版:" + id);
    }
    if (c0.steps.some((step) => String(step.caption || "").includes("\n") ||
        Array.from(String(step.caption || "")).length > 26))
      throw new Error("C0-1 手機字幕應維持單行短句");
    if (c0.steps[c0.steps.length - 1].plate !== "ch03_transition_1640_gassendi_handoff_v01")
      throw new Error("C0-1 最後一拍應完成伽桑狄交棒");
    if (!stageHtml.includes("#fxCaption { left: 20px; right: 170px;") ||
        !stageHtml.includes("white-space: nowrap;"))
      throw new Error("手機橫屏年代字幕缺單行安全區");
    const d0 = assets.sceneFx["D0-2"];
    if (JSON.stringify(d0.steps.map((s) => s.label)) !==
        JSON.stringify(["1642｜法國・馬賽", "1642→1665｜紙頁之間", "1665｜英格蘭・伍爾索普"]))
      throw new Error("D0-2 應在玩家翻頁後完成 1642→1665 三拍穿越");
    if (d0.steps[d0.steps.length - 1].plate !== "ch04_transition_1665_woolsthorpe_arrival_v01")
      throw new Error("D0-2 最後一拍應真正落地 Woolsthorpe");
    /* 禁四頁 CSS 假翻頁與逐年計數回歸 */
    if (stageHtml.includes("fxPages") || stageHtml.includes("bdFlip"))
      throw new Error("四頁 CSS 假翻頁應已退場");
    if (sui.includes("Math.round(from + span")) throw new Error("逐年計數應已移除");
    for (const frag of ['id="fxPlateA"', 'id="fxPlateB"', 'id="fxCaption"',
      'id="fxProgress"', 'id="fxAdvanceCue"', 'tabindex="0"'])
      if (!stageHtml.includes(frag)) throw new Error("逐幕轉場控制缺失:" + frag);
    if (stageHtml.includes('id="btnFxSkip"') || stageHtml.includes('id="btnFxNext"') ||
        stageHtml.includes("跳過轉場"))
      throw new Error("全遊戲時代轉場不得再用跳過／下一幕／進入故事按鈕遮住場景");
    for (const frag of ["SFX.paper", "endSceneFx", "advanceSceneFx", "fx.steps", "activeSceneFx", "activeFxIndex"])
      if (!sui.includes(frag)) throw new Error("蒙太奇要素缺失:" + frag);
    if (sui.includes("(idx + 1) * 1500") || sui.includes("steps.length * 1500"))
      throw new Error("章首／時間跳躍仍以固定秒數自動換拍");
    if (!sui.includes('$("fxJump").addEventListener("click", advanceSceneFx)'))
      throw new Error("時代轉場應由整張場景承接手點，不再放置底部按鈕");
    if (!sui.includes('document.addEventListener("bd:line"') ||
        !sui.includes("fx.triggerMatch") ||
        !sui.includes("playSceneFx(d.scene)"))
      throw new Error("指定台詞觸發的蒙太奇缺 line-level 接線");
    if (sui.includes('if (!$("fxJump").hidden) { ev.preventDefault(); endSceneFx(); return; }'))
      throw new Error("Esc 仍可跳過整段時代轉場");
    if (sui.includes('$("prologueCard").addEventListener("click"'))
      throw new Error("序章整張畫面仍可誤觸換幕；只能由明確按鈕或鍵盤逐幕推進");
    if (sui.includes('needKickoff && view === "narration"') ||
        !sui.includes("kickoffStoryFromExplicitTransition"))
      throw new Error("章首仍會在 bd:view 背景代按，或缺少明確轉場啟動點");
    const montageStart = sui.indexOf("章首／時間跳躍蒙太奇");
    const montageEnd = sui.indexOf("支柱破裂", montageStart);
    const montageRuntime = montageStart >= 0 && montageEnd > montageStart ? sui.slice(montageStart, montageEnd) : "";
    if (!montageRuntime || montageRuntime.includes("CHAPTER_ID"))
      throw new Error("章首手動轉場不得另寫單章分支；所有 sceneFx 必須共用同一套控制");
    if (!/stage-ui\.js\?v=asset-[0-9a-f]{12}/.test(stageHtml))
      throw new Error("舞台程式缺版本標記，重新整理可能繼續使用舊轉場程式");
    if (!sui.includes('btnPrologueGo").addEventListener("click", function ()') ||
        sui.includes('btnPrologueGo").addEventListener("click", dismissPrologue)'))
      throw new Error("序章可見按鈕應逐拍前進，不得直接跳過整段");
    const p01 = JSON.stringify(scenes.scenes.find((s) => s.id === "P0-1"));
    const intText = JSON.stringify(scenes.scenes.find((s) => s.id === "INT-1"));
    const b01 = JSON.stringify(scenes2.scenes.find((s) => s.id === "B0-1"));
    const c01 = JSON.stringify(scenes3.scenes.find((s) => s.id === "C0-1"));
    for (const word of ["1590", "比薩", "還不知道轉角的人是誰", "那個名字我知道"]) if (!p01.includes(word)) throw new Error("第一章首次落地缺章首定位:" + word);
    if (p01.includes("我知道伽利略會在這裡")) throw new Error("第一章在人物自我介紹前仍讓旅人預知伽利略");
    for (const word of ["十一年", "1603"]) if (!intText.includes(word)) throw new Error("第一章十一年跳躍缺定位:" + word);
    const b01Scene = scenes2.scenes.find((scene) => scene.id === "B0-1");
    const b01Node = (id) => b01Scene?.nodes.find((node) => node.id === id)?.text || "";
    if (!b01Node("n0a").includes("1608") || !b01Node("n0a").includes("中間四年") ||
        !b01Node("n0b").includes("對他們是四年") || !b01Node("n0b").includes("一頁") ||
        !b01Node("n5a").includes("留了四年"))
      throw new Error("第二章章首沒有用一頁折疊四年，或舊紙未承接四年等待");
    for (const word of ["伽利略八年前出版", "1640", "我還來不及道別"]) if (!c01.includes(word)) throw new Error("第三章交棒缺時間／人物定位:" + word);
    /* 音效=合成零資產;偏好走 sessionStorage(存檔純度不破);HUD 有開關 */
    if (!sui.includes("AudioContext")) throw new Error("音效合成器缺失");
    if (!sui.includes("sessionStorage")) throw new Error("音效偏好未持久化(sessionStorage)");
    if (!stageHtml.includes('id="btnSfx"')) throw new Error("HUD 音效開關缺失");
    /* 滾球重播:吃真實讀值+可跳過+reduced 直出;破裂 FX;E2 SVG */
    for (const frag of ["labAnim", "run.readings", "animSkip", "fx-shake", 'code === "E2"'])
      if (!sui.includes(frag)) throw new Error("體感層要素缺失:" + frag);
    /* BGM v2:cue 值域受控+三章場景全覆蓋+場景驅動+總開關 */
    const bgm = assets.sceneBgm || {};
    const scenes2Bgm = require("../data/scenes2.js");
    const cueSet = new Set(Object.keys(assets.bgmFiles || {}));
    const cueFor = (chapter, sceneId) => bgm[chapter + ":" + sceneId] || bgm[sceneId];
    scenes.scenes.forEach((s) => {
      const cue = cueFor("ch1", s.id);
      if (!cue) throw new Error("第一章場景缺 BGM mood:" + s.id);
      if (!cueSet.has(cue)) throw new Error("未知 mood:" + s.id + "→" + cue);
    });
    scenes2Bgm.scenes.forEach((s) => {
      const cue = cueFor("ch2", s.id);
      if (!cue) throw new Error("第二章場景缺 BGM mood:" + s.id);
      if (!cueSet.has(cue)) throw new Error("未知 mood:" + s.id + "→" + cue);
    });
    scenes3.scenes.forEach((s) => {
      const cue = cueFor("ch3", s.id);
      if (!cue) throw new Error("第三章場景缺 BGM mood:" + s.id);
      if (!cueSet.has(cue)) throw new Error("未知 mood:" + s.id + "→" + cue);
    });
    scenes.scenes.forEach((s) => {
      const cue = cueFor("ch1", s.id);
      if (/^ch2/.test(cue)) throw new Error("第一章誤用第二章 cue:" + s.id + "→" + cue);
    });
    scenes2Bgm.scenes.forEach((s) => {
      const cue = cueFor("ch2", s.id);
      if (s.id !== "B3-6" && s.id !== "BE-2" && !/^ch2/.test(cue))
        throw new Error("第二章未使用專屬 cue:" + s.id + "→" + cue);
    });
    scenes3.scenes.forEach((s) => {
      const cue = cueFor("ch3", s.id);
      if (!/^ch3/.test(cue)) throw new Error("第三章未使用專屬 cue:" + s.id + "→" + cue);
    });
    if (cueFor("ch1", "SC-R1") !== "workshop" || cueFor("ch2", "SC-R1") !== "ch2Catapult")
      throw new Error("同名 SC-R1 章別音樂覆寫失效");
    for (const frag of ["sceneBgm", "BGM.refresh", 'play("storm")', 'play("travelerTitle")'])
      if (!sui.includes(frag)) throw new Error("BGM 要素缺失:" + frag);
    /* 真音樂檔:once/milestone schema+實檔存在;storm 恆 null;30 秒素材禁止硬循環或低鳴回退 */
    if (assets.bgmVersion !== 2) throw new Error("BGM schema 應為 v2");
    for (const [mood, raw] of Object.entries(assets.bgmFiles || {})) {
      if (raw === null) continue;
      const spec = typeof raw === "string" ? { mode: "once", clips: [raw] } : raw;
      if (!["once", "milestone", "silence"].includes(spec.mode))
        throw new Error("bgmFiles mode 非法:" + mood + "→" + spec.mode);
      if (!Array.isArray(spec.clips)) throw new Error("bgmFiles clips 非陣列:" + mood);
      if (spec.mode === "silence" && spec.clips.length) throw new Error("silence 不得掛音樂檔");
      if ("ambient" in spec) throw new Error("真音樂不得在曲末回退程序低鳴:" + mood);
      if ("repeatGapMs" in spec && !(spec.repeatGapMs >= 3000 && spec.repeatGapMs <= 10000))
        throw new Error("repeatGapMs 應保留 3–10 秒呼吸:" + mood + "→" + spec.repeatGapMs);
      for (const f of spec.clips) {
        if (!/^(common|ch\d{2})\//.test(f)) throw new Error("BGM 未按 common/chXX 分庫:" + mood + "→" + f);
        try { readFileSync(path.join(here, "..", assets.audioBasePath, f)); }
        catch (e) { throw new Error("bgmFiles 檔案不存在:" + mood + "→" + f); }
      }
    }
    if ((assets.bgmFiles || {}).storm !== null) throw new Error("storm 應維持合成(null)");
    if ((assets.bgmFiles.workshop.clips || []).length !== 3 || assets.bgmFiles.workshop.mode !== "milestone")
      throw new Error("workshop 應為 A/B/C 三段 milestone");
    if ((assets.bgmFiles.hall.clips || []).length !== 3 || assets.bgmFiles.hall.mode !== "milestone")
      throw new Error("hall 應為 A/B/C 三段 milestone");
    if ((assets.bgmFiles.ch2Catapult.clips || []).length !== 3 || assets.bgmFiles.ch2Catapult.mode !== "milestone")
      throw new Error("ch2Catapult 應為 A/B/C 三段 milestone");
    if ((assets.bgmFiles.ch2Debate.clips || []).length !== 3 || assets.bgmFiles.ch2Debate.mode !== "milestone")
      throw new Error("ch2Debate 應為 A/B/C 三段 milestone");
    if ((assets.bgmFiles.ch3Experiment.clips || []).length !== 3 || assets.bgmFiles.ch3Experiment.mode !== "milestone")
      throw new Error("ch3Experiment 應為 A/B/C 三段 milestone");
    if ((assets.bgmFiles.ch3Public.clips || []).length !== 3 || assets.bgmFiles.ch3Public.mode !== "milestone")
      throw new Error("ch3Public 應為 A/B/C 三段 milestone");
    const ch2CueFiles = Object.entries(assets.bgmFiles)
      .filter(([mood]) => /^ch2/.test(mood))
      .flatMap(([, spec]) => spec.clips || []);
    if (ch2CueFiles.length !== 13 || new Set(ch2CueFiles).size !== 13)
      throw new Error("第二章專屬曲應為 13 首且不得重複引用");
    const ch3CueFiles = Object.entries(assets.bgmFiles)
      .filter(([mood]) => /^ch3/.test(mood))
      .flatMap(([, spec]) => spec.clips || []);
    if (ch3CueFiles.length !== 10 || new Set(ch3CueFiles).size !== 10 || ch3CueFiles.some((f) => !f.startsWith("ch03/")))
      throw new Error("第三章專屬曲應為 ch03/ 內 10 首且不得重複引用");
    if (!sui.includes("a.loop = false") || sui.includes("a.loop = true"))
      throw new Error("Gemini 30 秒素材不得無限硬循環");
    for (const frag of ["repeatGapMs", "scheduleReplay", "fileReplayTimer"])
      if (!sui.includes(frag)) throw new Error("曲末留白重播機制缺失:" + frag);
    if (sui.includes("playSynth(spec.ambient)")) throw new Error("真音樂播完仍會啟動程序低鳴");
    for (const frag of ['d.scene === "A2-2"', 'd.scene === "A2-3"', 'd.scene === "A2-4"',
      'sceneCue(sceneId)', 'BGM.current() === "ch2Catapult"', 'd.scene === "B2-3"', 'd.scene === "B2-4"',
      'BGM.current() === "ch3Experiment"', 'd.scene === "C1-3"', 'd.scene === "C2-2"',
      'BGM.current() === "ch3Public"', 'd.scene === "C3-2"', 'd.scene === "C3-3"',
      'BGM.current() !== "ch2Debate"', 'd.phase === "fr"', 'd.phase === "arrange"', "BGM.variant(1)", "BGM.variant(2)"])
      if (!sui.includes(frag)) throw new Error("BGM milestone 掛點缺失:" + frag);
    if (!stageHtml.includes("fx-gain") || !stageHtml.includes('id="fxJump"'))
      throw new Error("FX 樣式/容器缺失");
  }
});

tests.push({
  name: "竣工修正|A1 匯入淨化+DOM-safe+A2 讀屏主線+Batch03+工作桌+可靠性(Sol 巡查 20260720)",
  fn: () => {
    const S = require("../src/sanitize.js");
    const N2 = require("../src/narrative.js");
    /* 合法往返必過 */
    const good = JSON.parse(N2.serialize(N2.initialState("scholar")));
    if (!S.sanitizeImport(good, patterns, scenes).ok) throw new Error("合法 state 被誤拒");
    /* 惡意/畸形必拒(A-1 負向) */
    const cases = [
      (s) => { s.lab.evidence.runs = [{ id: 1, day: 1, seq: 1, config: { ball: "<img src=x onerror=alert(1)>", surface: "打磨", incline: "陡", timer: "水鐘" }, readings: [1, 2, 3, 4] }]; },
      (s) => { s.lab.evidence.runs = [{ id: "x' autofocus onfocus='alert(1)", day: 1, seq: 1, config: { ball: "銅大", surface: "打磨", incline: "陡", timer: "水鐘" }, readings: [1, 2, 3, 4] }]; },
      (s) => { s.lab.evidence.runs = new Array(301).fill({ id: 1, day: 1, seq: 1, config: { ball: "銅大", surface: "打磨", incline: "陡", timer: "水鐘" }, readings: [1, 2, 3, 4] }); },
      (s) => { s.lab.evidence.runs = [{ id: 1, day: 1, seq: 1, config: { ball: "銅大", surface: "打磨", incline: "陡", timer: "水鐘" }, readings: [NaN, 2, 3, 4] }]; },
      (s) => { s.mode = "admin"; },
      (s) => { s.rep = 99; },
      (s) => { s.cursor.scene = "Z9-9"; },
      (s) => { s.transcript = [{ scene: "P0-1", speaker: "x".repeat(50), text: "hi" }]; },
      (s) => { JSON.parse('{"__proto__":{"polluted":1}}'); Object.defineProperty(s, "x", { value: 1 }); s.transcript = JSON.parse('[{"scene":"P0-1","text":"a","__proto__":{"p":1}}]'); },
    ];
    for (let i = 0; i < cases.length; i++) {
      const s = JSON.parse(N2.serialize(N2.initialState("explore")));
      cases[i](s);
      const r = S.sanitizeImport(s, patterns, scenes);
      if (i === 8) { /* __proto__ 於 JSON.parse 成為普通鍵仍須拒 */
        if (r.ok) throw new Error("原型污染鍵未被拒");
      } else if (r.ok) throw new Error("惡意案例 #" + i + " 未被拒");
    }
    /* 匯入閘接線+DOM-safe:chapter-ui 禁 innerHTML 串接;Sanitize 在 startGame 之前 */
    const cui = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
    const concat = (cui.match(/\.innerHTML\s*=\s*[^;]+;/g) || []).filter((l) => !/=\s*"";/.test(l));
    if (concat.length) throw new Error("chapter-ui 仍有 innerHTML 串接:" + concat[0]);
    /* 章節化後由 sanitizeLoaded 分派 ch1/ch2；鎖資料流，不再把舊區域變數 chk 寫死。 */
    const importFn = cui.slice(cui.indexOf("function importCurrentChapter"), cui.indexOf("function initTitle"));
    const importClick = cui.slice(cui.indexOf('$("btnImport").onclick'), cui.indexOf("initTitle();"));
    if (!(importFn.indexOf("sanitizeLoaded(r.state)") >= 0 && importFn.indexOf("sanitizeLoaded(r.state)") < importFn.indexOf("return { state: chk.state }")))
      throw new Error("匯入函式未先淨化再回傳 state");
    if (!(importClick.indexOf("importCurrentChapter") >= 0 && importClick.indexOf("importCurrentChapter") < importClick.indexOf("startGame(imported.state)")))
      throw new Error("匯入閘未接在 startGame 之前");
    if (!cui.includes("saveWarn")) throw new Error("存檔失敗警示缺失(B-4)");
    if (!cui.includes("revokeObjectURL")) throw new Error("匯出 URL 未回收(C-1)");
    /* A-2:永不隱藏的讀屏 log;兩殼載入 sanitize */
    const stageHtml = readFileSync(path.join(here, "../stage.html"), "utf-8");
    const chapterHtml = readFileSync(path.join(here, "../chapter.html"), "utf-8");
    if (!/id="srLine" class="srOnly" role="log" aria-live="polite"/.test(stageHtml))
      throw new Error("srLine 讀屏主線缺失");
    for (const h of [stageHtml, chapterHtml])
      if (!h.includes("src/sanitize.js")) throw new Error("殼未載入 sanitize.js");
    /* Batch03:五卡專圖+標題/史實橫幅;E2 仍保留程式語意疊層與 SVG 降級。 */
    const assets = JSON.parse(readFileSync(path.join(here, "../data/assets.json"), "utf-8"));
    const byId = Object.fromEntries(assets.entries.map((e) => [e.id, e]));
    for (const cid of ["card_E1", "card_E2", "card_E3", "card_E4", "card_E5"]) {
      const e = byId[cid];
      if (!e || !e.path || e.w !== 800 || e.h !== 500) throw new Error("Batch03 卡片缺失/尺寸錯:" + cid);
    }
    if (!byId["title_background"] || !byId["histfacts_banner"]) throw new Error("標題/史實橫幅 entry 缺失");
    const sui = readFileSync(path.join(here, "../src/stage-ui.js"), "utf-8");
    for (const frag of ['assetEntry("card_" + code)', "title_background", "histfacts_banner"])
      if (!sui.includes(frag)) throw new Error("Batch03 接線缺失:" + frag);
    /* 工作桌重排+可靠性 */
    for (const frag of ['id="labBench"', 'id="labBook"', 'id="benchProps"', 'id="labAnimSlot"',
      'id="labGoal"', 'id="labFlow"', 'id="labEmpty"', 'id="secRuns"', 'id="secClaims"', 'id="saveWarn"'])
      if (!stageHtml.includes(frag)) throw new Error("工作桌重排要素缺失:" + frag);
    if (!cui.includes("friendlyLabGoal") || !cui.includes("secRuns.hidden") || !cui.includes("empty.hidden"))
      throw new Error("實驗簿白話目標/漸進揭露缺失");
    if (!sui.includes("figcaption") || !stageHtml.includes("mix-blend-mode: multiply"))
      throw new Error("器材主視覺的防溢位/紙面融合缺失");
    for (const frag of ["unlockAudioOnce", "visibilitychange", 'addEventListener("pointerdown", unlockAudioOnce)', 'addEventListener("keydown", unlockAudioOnce)'])
      if (!sui.includes(frag)) throw new Error("音訊可靠性缺失:" + frag);
    /* 進實驗台確認閘:敘事→embed 須經玩家確認(讀完再走) */
    if (!stageHtml.includes('id="btnEmbark"') || !sui.includes("embarkGate"))
      throw new Error("進實驗台確認閘缺失");
  }
});

tests.push({
  name: "試玩修正|實驗診斷+連續工作階段+辯論桌 v2+失敗分流(Sol 20260720)",
  fn: () => {
    const stageHtml = readFileSync(path.join(here, "../stage.html"), "utf-8");
    const chapterHtml = readFileSync(path.join(here, "../chapter.html"), "utf-8");
    const cui = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
    const plainUi = readFileSync(path.join(here, "../src/ui.js"), "utf-8");
    const sui = readFileSync(path.join(here, "../src/stage-ui.js"), "utf-8");

    /* 實驗回饋:器材性格公開、兩道 12% 門檻分開說、失敗後才漸進給問句。 */
    for (const frag of ['id="labToolProfile"', 'id="labCoach"', 'id="labAssist"', 'id="btnLabDiscuss"'])
      if (!stageHtml.includes(frag)) throw new Error("實驗診斷 UI 缺失:" + frag);
    for (const frag of ["TIMER_PROFILE", "labFailStreak", "neutralLabObservation", "strongLabQuestion",
      "前四段形狀偏差", "第五段預測偏差", "兩項皆須 ≤ 12.0%"])
      if (!cui.includes(frag)) throw new Error("實驗診斷邏輯缺失:" + frag);
    if (cui.includes("選集內部不一致") || plainUi.includes("選集內部不一致"))
      throw new Error("誤導性舊訊息『選集內部不一致』回歸");

    /* 連續工作階段:各章主實驗 e1 首入才閘；後續 embed 不重複跳出再進。 */
    for (const frag of ['d.scene === "A2-2" && d.nodeId === "e1"', 'd.scene === "B2-3" && d.nodeId === "e1"', 'd.scene === "SC-R1"'])
      if (!sui.includes(frag)) throw new Error("實驗進場閘缺失:" + frag);
    if (!sui.includes('$("btnEmbark").focus()')) throw new Error("轉場確認鈕未取得鍵盤焦點");

    /* 辯論桌:證詞卡+證據手牌+自然語言行動句；追問後才顯示洞見。 */
    for (const frag of ["statementCard", "evidenceHand", "問到底——讓他把前提說滿",
      "先選一句證詞與一張證據", "renderDebrief", "DEBATE.chapter.speakers.coach", "複盤"])
      if (!cui.includes(frag)) throw new Error("辯論桌 v2 缺失:" + frag);
    for (const p of Object.values((debate.chapter || {}).pillars || {})) {
      const statements = p.useLegacy ? debate.statements : p.statements;
      for (const st of statements) if (!st.insight) throw new Error("證詞缺追問洞見:" + st.id);
    }
    const a3f = scenes.scenes.find((s) => s.id === "A3-F");
    const debrief = a3f && a3f.nodes.find((n) => n.type === "embed");
    if (!debrief || debrief.system !== "debrief") throw new Error("說服力中止仍被誤導回實驗台");

    /* 模式是玩法偏好，不把成年人/學生按學段分級。 */
    for (const h of [stageHtml, chapterHtml])
      if (/國中基準|高中以上/.test(h)) throw new Error("模式文案仍以學段標記玩家");
  }
});

tests.push({
  name: "難度透明化|白話摘要+有隙標記(僅探索)+P1 試射+回顧末頁(Sol 彙整,總監核 20260720)",
  fn: () => {
    const assets = JSON.parse(readFileSync(path.join(here, "../data/assets.json"), "utf-8"));
    /* 摘要完備:八鍵全有,語意透明但不標正解(不得出現「正解/答案/用這張」字樣) */
    const KEYS = ["E1", "E2", "E3a", "E3b", "E3c", "E4", "S1", "S2"];
    for (const k of KEYS) {
      const s = (assets.evidenceSummary || {})[k];
      if (!s) throw new Error("evidenceSummary 缺:" + k);
      if (/正解|答案|用這張/.test(s)) throw new Error("摘要洩題:" + k);
    }
    const cui = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
    for (const frag of ["evidenceSummary", "gapBadge", "stmtHasGap", '"explore"'])
      if (!cui.includes(frag)) throw new Error("透明化要素缺失:" + frag);
    /* 有隙標記=僅探索模式(學者不標) */
    if (!/state\.mode === "explore"[\s\S]{0,300}gapBadge/.test(cui))
      throw new Error("有隙標記未鎖定探索模式");
    /* P1 首發免扣:引擎行為測試 */
    const N2 = require("../src/narrative.js");
    if (!readFileSync(path.join(here, "../src/narrative.js"), "utf-8").includes("firstMissUsed"))
      throw new Error("P1 試射旗標缺失");
    /* 回顧新題(GB-ADR-010)入 scenes;末頁措辭+封存按鈕 */
    const scenesJson = JSON.parse(readFileSync(path.join(here, "../data/scenes.json"), "utf-8"));
    const e2 = scenesJson.scenes.find((s) => s.id === "E-2");
    const rv = e2.nodes.find((n) => n.type === "review");
    if (!rv.prompts[0].includes("愈重愈快") || !rv.prompts[1].includes("垂直"))
      throw new Error("回顧題未更新為 GB-ADR-010 版");
    if (!cui.includes("封存第一章") || !cui.includes("reviewHead")) throw new Error("回顧末頁措辭缺失");
    /* GB-ADR-012 奇數錨定與平方橋(總監 20260720):鑰匙句+累加拍不得被誤刪 */
    const a22 = scenesJson.scenes.find((s) => s.id === "A2-2");
    const a22n2 = a22.nodes.find((n) => n.id === "n2");
    const qOdd = a22.nodes.find((n) => n.id === "qOdd");
    const qCum = a22.nodes.find((n) => n.id === "qCum");
    if (!String(a22n2?.text || "").includes("第五段先蓋住") ||
        !String(a22n2?.text || "").includes("翻開後") ||
        !String(a22n2?.text || "").includes("能不能往前說中") ||
        !String(qOdd?.text || "").includes("押記和第五段刻痕並排") ||
        !String(qOdd?.text || "").includes("沒有擦掉"))
      throw new Error("第五段預測缺少先量四段、封存外推與猜後並排的敘事動機");
    if (!qOdd || !qOdd.options.some((o) => o.id === "odd" && o.text.includes("一、三、五、七、九")) ||
        !qCum || !qCum.options.some((o) => o.id === "squares" && o.text.includes("一、四、九、十六、二十五")))
      throw new Error("平方律沒有由玩家分兩步讀出增量與累積距離");
    const n3b = a22.nodes.find((n) => n.id === "n3b");
    const n3 = a22.nodes.find((n) => n.id === "n3");
    if (!n3 || n3.next !== "qCum" ||
        qOdd.options.find((o) => o.id === "odd")?.next !== "n3" ||
        qCum.options.find((o) => o.id === "squares")?.next !== "n3b" ||
        !n3b || !n3b.text.includes("是你從五段紙帶加出來的") || n3b.next !== "n4")
      throw new Error("平方橋累加拍缺失或斷鏈(A2-2 n3b)");
    const stageHtml = readFileSync(path.join(here, "../stage.html"), "utf-8");
    for (const frag of ["statementCard { background-image", "gapBadge", "evSummary", 'body[data-view="review"] #panelWrap'])
      if (!stageHtml.includes(frag)) throw new Error("復古化/末頁樣式缺失:" + frag);
  }
});

tests.push({
  name: "辯論防猜題|三柱弱點顯示位置為一、三、二且不改證詞 ID",
  fn: () => {
    const cui = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
    const debate2 = require("../data/debate2.js");
    if (!cui.includes("statementDisplayOrder = { P1: [1, 0, 2], P2: [0, 2, 1], P3: [0, 1, 2] }"))
      throw new Error("辯論證詞仍可用固定第二格猜題");
    if (!cui.includes("displayedStatements.forEach")) throw new Error("辯論畫面未套用防猜題排列");
    for (const data of [debate, debate2]) {
      for (const pid of ["P1", "P2", "P3"]) {
        const pillar = data.chapter.pillars[pid];
        const statements = pillar.useLegacy ? data.statements : pillar.statements;
        const weak = statements.filter((st) => st.weakTo);
        if (weak.length !== 1) throw new Error(pid + " 應只有一條可反證證詞");
        if (!/s2$/.test(weak[0].id)) throw new Error(pid + " 弱點證詞 ID 漂移:" + weak[0].id);
      }
    }
  }
});

tests.push({
  name: "斷言分段四格常駐|assertStage 單一事實源+敘事層拒絕搶跑(GB-ADR-011,Sol B-1 補強)",
  fn: () => {
    const N2 = require("../src/narrative.js");
    const scenes = JSON.parse(readFileSync(path.join(here, "../data/scenes.json"), "utf-8"));
    const untilOf = (sid, nid) => scenes.scenes.find((s) => s.id === sid).nodes.find((n) => n.id === nid).until;
    /* 四格 matrix:until 直接取自 scenes 資料,不用手抄本(資料改了測試就跟著改) */
    const CELLS = [
      ["A2-2", "e1", { explore: [false, false], scholar: [false, false] }],   /* a:只認證 */
      ["A2-3", "e2", { explore: [true, false], scholar: [true, false] }],     /* b:與球重無關 */
      ["A2-3", "e3c", { explore: [false, true], scholar: [false, true] }],    /* c:雙模式必經 */
      ["SC-R1", "e1", { explore: [false, false], scholar: [false, false] }],  /* repair:乾淨紀錄 */
    ];
    for (const [sid, nid, expect] of CELLS)
      for (const mode of ["explore", "scholar"]) {
        const a = N2.assertStage(untilOf(sid, nid), mode);
        if (a.b !== expect[mode][0] || a.c !== expect[mode][1])
          throw new Error(`四格失守 ${sid}/${nid} ${mode}:得 b=${a.b},c=${a.c}`);
      }
    /* 自由段(無 until):B 開放、C 依學者 */
    if (!N2.assertStage(null, "explore").b || N2.assertStage(null, "explore").c || !N2.assertStage(null, "scholar").c)
      throw new Error("自由段規則失守");
    /* 敘事層拒絕搶跑:守衛在引擎,不只藏按鈕 */
    const GUARD = "劇情還沒問到";
    for (const [sid, nid, type] of [["A2-2", "e1", "b"], ["A2-2", "e1", "c"], ["A2-3", "e2", "c"], ["SC-R1", "e1", "b"], ["SC-R1", "e1", "c"]]) {
      const s = N2.initialState("scholar");
      s.cursor = { scene: sid, node: nid };
      const r = N2.labAction(s, "assert", { type, claimIds: [1, 2] });
      if (!r.error || !r.error.includes(GUARD)) throw new Error(`搶跑未被引擎擋下:${sid}/${nid} 斷言 ${type}`);
    }
    /* 正確階段不誤傷:A2-3/e2 斷言 b 不得觸發守衛(引擎自身的主張檢查訊息可接受) */
    const ok = N2.initialState("scholar");
    ok.cursor = { scene: "A2-3", node: "e2" };
    const rr = N2.labAction(ok, "assert", { type: "b", claimIds: [1, 2] });
    if (rr.error && rr.error.includes(GUARD)) throw new Error("守衛誤傷正確階段的斷言 b");
    /* UI 同源:chapter-ui 必須呼叫 assertStage,不得自帶平行邏輯 */
    const cui = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
    if (!cui.includes("N.assertStage(")) throw new Error("chapter-ui 未使用 assertStage 單一事實源");
    if (/updateAssertButtons[\s\S]{0,400}until\.e3/.test(cui)) throw new Error("chapter-ui 殘留平行分段邏輯");
    /* 押注三問(總監裁決 20260720):機制不動,提問跟劇情階段顯形 */
    for (const frag of ["judgeAskText", "換了球。你賭", "用同一條規律"])
      if (!cui.includes(frag)) throw new Error("押注三問缺失:" + frag);
    for (const page of ["stage.html", "chapter.html"])
      if (!readFileSync(path.join(here, "../" + page), "utf-8").includes('id="judgeAsk"'))
        throw new Error(page + " 缺 judgeAsk 掛點");
  }
});

tests.push({
  name: "字體三聲部|明體子集出貨+P0-0 現代敘事全黑體(1590 恢復世界明體;標題=書封例外)+楷體 provisional(Sol 字體驗證 20260720)",
  fn: () => {
    /* 子集字型實體+授權隨行:未入庫=不存在 */
    const fdir = path.join(here, "../../public/assets/fonts");
    for (const f of ["bd-serif-tc-regular.woff2", "bd-serif-tc-bold.woff2", "LICENSE-OFL-1.1.txt"])
      if (!existsSync(path.join(fdir, f))) throw new Error("字型檔缺失:" + f);
    const stageHtml = readFileSync(path.join(here, "../stage.html"), "utf-8");
    for (const frag of ['"BD Serif TC"', "bd-serif-tc-regular.woff2", "--font-hand", "font-display: swap"])
      if (!stageHtml.includes(frag)) throw new Error("三聲部樣式缺失:" + frag);
    /* 明體鏈以子集字型為首;回退鏈保留 */
    if (!/--font-dialogue:\s*"BD Serif TC",\s*"Noto Serif TC"/.test(stageHtml))
      throw new Error("--font-dialogue 未以 BD Serif TC 為首");
    /* 穿越剪接:P0-0 題詞/字幕/按鈕=黑體,禁用明體(標題畫面=書封例外,不在此檢) */
    const blockOf = (sel) => {
      const m = stageHtml.split(sel + " {")[1];
      if (!m) throw new Error("選擇器缺失:" + sel);
      return m.slice(0, m.indexOf("}"));
    };
    for (const sel of ["#mzTitleLines p", "#mzCaption", "#btnPrologueGo"])
      if (blockOf(sel).includes("--font-dialogue")) throw new Error("P0-0 出現明體(穿越剪接破功):" + sel);
    /* 楷體三落點常駐(Sol 最小修正 ③):回顧作答/檯上便條/旅人筆記台詞 */
    if (!blockOf('body[data-view="review"] #controls textarea').includes("--font-hand"))
      throw new Error("楷體落點缺:回顧作答");
    if (!blockOf("#labHint").includes("--font-hand")) throw new Error("楷體落點缺:檯上便條");
    if (!stageHtml.includes('#dialogue[data-speaker="旅人筆記"] #dlgText'))
      throw new Error("楷體落點缺:旅人筆記台詞");
    if (!readFileSync(path.join(here, "../src/stage-ui.js"), "utf-8").includes("dataset.speaker"))
      throw new Error("stage-ui 未掛 speaker 資料屬性");
    /* runtime 確有「旅人筆記」發言來源,CSS 掛勾不落空 */
    if (!readFileSync(path.join(here, "../src/narrative.js"), "utf-8").includes('"旅人筆記"'))
      throw new Error("narrative 無旅人筆記發言來源");
    /* 便條=玩家親筆:第一人稱自筆語氣(Sol B-3) */
    const cui = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
    if (!cui.includes("我要從四段數字找出規律")) throw new Error("便條未改第一人稱");
    /* 楷體 provisional 標記+RC 前義務入檔 */
    if (!readFileSync(path.join(fdir, "README.md"), "utf-8").includes("provisional"))
      throw new Error("楷體未標 provisional");
  }
});

tests.push({
  name: "終幕卡+行動殼|下一章預告(戲劇卡+系統行)+全螢幕/轉橫+PWA manifest(GB-ADR-013/014)",
  fn: () => {
    const stageHtml = readFileSync(path.join(here, "../stage.html"), "utf-8");
    if (stageHtml.includes("灰盒對照版"))
      throw new Error("玩家入口不應顯示內部灰盒對照連結");
    for (const frag of ['id="nextCard"', 'id="ncNextBtn"', "第一寸的弧線", "第二章現已開放", "書信碼",
      'id="btnFull"', 'id="playAdvice"', 'id="btnAdviceFull"', 'id="btnAdviceDismiss"',
      'id="playAdviceStatus" role="status" aria-live="polite"', "viewport-fit=cover", '<link rel="manifest"',
      '<meta name="apple-mobile-web-app-title" content="發現之前">'])
      if (!stageHtml.includes(frag)) throw new Error("終幕卡/行動殼要素缺失:" + frag);
    if (stageHtml.includes('id="rotateHint"') || stageHtml.includes("從桌面開啟即全螢幕"))
      throw new Error("不可達的 rotateHint 或 iPhone 全螢幕過度承諾仍在正式舞台");
    for (const oldTitle of ["向前，也向下", "向前也向下", "不推，也會走"])
      if (stageHtml.includes(oldTitle)) throw new Error("玩家入口仍殘留舊章名:" + oldTitle);
    /* 鉤引語=E-1 凍結原句的子字串(禁引未凍結之第二章劇本;防台詞漂移) */
    const scenesJson = JSON.parse(readFileSync(path.join(here, "../data/scenes.json"), "utf-8"));
    const e1n2 = scenesJson.scenes.find((s) => s.id === "E-1").nodes.find((n) => n.id === "n2").text;
    if (!e1n2.includes("它往前,又往下——兩件事,同時發生。"))
      throw new Error("終幕卡鉤引語與 E-1 凍結台詞不符");
    /* 灰盒不動:對照殼不長舞台專屬件 */
    const grey = readFileSync(path.join(here, "../chapter.html"), "utf-8");
    for (const frag of ["nextCard", "btnFull", "playAdvice"])
      if (grey.includes(frag)) throw new Error("灰盒殼混入舞台專屬件:" + frag);
    /* 章末系統行正名:候選版時代不得再自稱灰盒 */
    const fin = scenesJson.scenes.find((s) => s.id === "E-2").nodes.find((n) => n.id === "fin").text;
    if (fin.includes("灰盒")) throw new Error("章末系統行仍自稱灰盒");
    /* PWA manifest:全螢幕+橫向+圖示實檔 */
    const mani = JSON.parse(readFileSync(path.join(here, "../../manifest.json"), "utf-8"));
    if (mani.id !== "/" || mani.start_url !== "/" || mani.scope !== "/" ||
        mani.lang !== "zh-Hant-TW" || mani.display !== "fullscreen" || mani.orientation !== "landscape")
      throw new Error("manifest 應收旂到正式根網址並保持 fullscreen+landscape");
    for (const ic of mani.icons)
      if (!existsSync(path.join(here, "../..", ic.src))) throw new Error("manifest 圖示缺檔:" + ic.src);
    /* 直向自動橫置(GB-ADR-016):portrait+coarse 時舞台旋轉 90° 滿版 */
    if (!/@media \(orientation: portrait\) and \(pointer: coarse\)[\s\S]{0,700}rotate\(90deg\)/.test(stageHtml))
      throw new Error("直向自動橫置規則缺失(GB-ADR-016)");
    /* 016 補記:旋轉手機=視覺低高度橫屏——低高度規則需含直向替代式;窄高規則鎖桌機(pointer:fine) */
    if (!stageHtml.includes("(orientation: portrait) and (pointer: coarse) and (max-width: 520px)"))
      throw new Error("低高度規則缺直向旋轉替代式(GB-ADR-016 補記)");
    if (!stageHtml.includes("(min-height: 521px) and (pointer: fine)"))
      throw new Error("窄高規則未鎖桌機 pointer:fine");
    /* stage-ui:全螢幕+鎖向+終幕卡掛點，標題頁提示以能力偵測決定 */
    const sui = readFileSync(path.join(here, "../src/stage-ui.js"), "utf-8");
    for (const frag of ["requestFullscreen", 'orientation.lock("landscape")', "nextCard",
      "BDPlayExperience", "btnAdviceFull", "btnAdviceDismiss", "navigator.standalone"])
      if (!sui.includes(frag)) throw new Error("stage-ui 行動殼邏輯缺失:" + frag);
    const PX = require("../src/play-experience.js");
    const matrix = [
      [{ dismissed:true }, "hidden"],
      [{ standalone:true }, "hidden"],
      [{ fullscreen:true }, "hidden"],
      [{ supportsFullscreen:true, appleMobile:true, http:true }, "fullscreen"],
      [{ supportsFullscreen:false, appleMobile:true, http:true }, "ios-install"],
      [{ supportsFullscreen:false, appleMobile:true, http:false }, "hidden"],
      [{ supportsFullscreen:false, appleMobile:false, http:true }, "hidden"]
    ];
    for (const [input, expected] of matrix)
      if (PX.adviceKind(input) !== expected)
        throw new Error("遊玩建議平台矩陣錯誤:" + JSON.stringify(input));
    if (!PX.isAppleMobile({ userAgent:"Mozilla/5.0 (iPhone)", platform:"iPhone" }) ||
        PX.isAppleMobile({ userAgent:"Mozilla/5.0 (Linux; Android 15)", platform:"Linux armv8l" }))
      throw new Error("Apple 行動裝置識別器誤判");
    for (const frag of ["分享", "加入主畫面", "從桌面圖示開啟", "可減少 Safari 工具列"])
      if (!stageHtml.includes(frag)) throw new Error("iPhone 加入主畫面指引不完整:" + frag);
    if (!stageHtml.includes("#titleCard #btnAdviceFull, #titleCard #btnAdviceDismiss { min-height: 44px"))
      throw new Error("遊玩體驗建議按鈕未達 44px 點擊目標");
  }
});

tests.push({
  name: "四章章尾接力|史實回聲→未解問題→下一章出口(GB-ADR-028)",
  fn: () => {
    const ch1 = JSON.parse(readFileSync(path.join(here, "../data/scenes.json"), "utf-8"));
    const ch2 = JSON.parse(readFileSync(path.join(here, "../data/scenes2.json"), "utf-8"));
    const ch3 = JSON.parse(readFileSync(path.join(here, "../data/scenes3.json"), "utf-8"));
    const ch4 = JSON.parse(readFileSync(path.join(here, "../data/scenes4.json"), "utf-8"));
    const e2 = ch1.scenes.find((s) => s.id === "E-2");
    const be2 = ch2.scenes.find((s) => s.id === "BE-2");
    const ce2 = ch3.scenes.find((s) => s.id === "CE-2");
    const de2 = ch4.scenes.find((s) => s.id === "DE-2");
    const e2Text = e2.nodes.map((n) => n.text || "").join("\n");
    const be2Text = be2.nodes.map((n) => n.text || "").join("\n");
    const ce2Text = ce2.nodes.map((n) => n.text || "").join("\n");
    const de2Text = de2.nodes.map((n) => n.text || "").join("\n");
    if (!e2Text.includes("羽毛不再被空氣拖慢") || !e2Text.includes("重量沒有替鎚子換來更早的落地"))
      throw new Error("第一章月球鎚羽未說清無空氣與重量邊界");
    if (!be2Text.includes("球桿早已留在身後") || !be2Text.includes("沒有東西繼續推它,它為什麼還在走"))
      throw new Error("第二章月球高爾夫未接到第三章共同運動問題");
    if (!ce2Text.includes("月亮為什麼沒有沿直線離開"))
      throw new Error("第三章 runtime 漏接凍結劇本的月亮未解問題");
    if (!de2Text.includes("碰撞之後") || !de2Text.includes("什麼應該守住"))
      throw new Error("第四章 runtime 漏接碰撞守恆未解問題");
    const sui = readFileSync(path.join(here, "../src/stage-ui.js"), "utf-8");
    for (const frag of ["進入第二章", "stage.html?chapter=ch02", "進入第三章", "stage.html?chapter=ch03",
      "進入第四章", "stage.html?chapter=ch04", "船艙裡的靜止", "月亮的無盡墜落"])
      if (!sui.includes(frag)) throw new Error("章末直接接力缺失:" + frag);
    for (const placeholder of ["下一頁，仍未寫定", "旅程將繼續"])
      if (sui.includes(placeholder)) throw new Error("章末仍殘留通用佔位句:" + placeholder);
  }
});

tests.push({
  name: "系列首頁 v3|單屏殼+目前旅程+章節目錄+字體分工",
  fn: () => {
    const stageHtml = readFileSync(path.join(here, "../stage.html"), "utf-8");
    const cui = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
    for (const shellName of ["chapter.html", "chapter2.html", "chapter3.html"]) {
      const shell = readFileSync(path.join(here, "../" + shellName), "utf-8");
      const seriesAt = shell.indexOf('data/series.js');
      const uiAt = shell.indexOf('src/chapter-ui.js');
      if (!(seriesAt >= 0 && seriesAt < uiAt))
        throw new Error(shellName + " 未在共用 UI 前載入系列章名，會把第二／三章誤標成第一章");
    }
    const metaStart = cui.indexOf("function chapterMeta(id)");
    const metaEnd = cui.indexOf("function displayText", metaStart);
    const metaSource = cui.slice(metaStart, metaEnd);
    if (!metaSource.includes('label: "（章別未載入）"') ||
        metaSource.includes('label: "第一章"'))
      throw new Error("章別資料缺漏時仍會靜默偽裝成第一章");
    for (const frag of [
      'class="titleIdentity"', 'class="chapterJourneyNav"', 'id="chapterDirectory"',
      'id="chapterRail"', 'id="btnPrevChapter"', 'id="btnNextChapter"',
      'id="continueMeta"', 'overflow: hidden',
      '適合國中起步；同一套實驗，檢核預設展開，失敗後直接說明缺口',
      '適合高中與成人挑戰；同一套實驗，提示與完整診斷預設收合'
    ]) if (!stageHtml.includes(frag)) throw new Error("系列首頁契約缺失:" + frag);
    if (stageHtml.includes("卡住時伽利略會主動追問"))
      throw new Error("系列首頁把跨章引導角色寫死為伽利略");
    if (stageHtml.includes('data-chapter="ch01"')) throw new Error("系列首頁仍把章節卡寫死在 HTML");
    if (stageHtml.includes("repeat(4,minmax(0,1fr))")) throw new Error("系列首頁仍把章節列寫死為四欄");
    if (!stageHtml.includes("font-family: var(--font-ui); font-weight: 600"))
      throw new Error("首頁操作字未使用黑體聲部");
    if (!stageHtml.includes("#titleCard .t1") || !stageHtml.includes("font-family: var(--font-dialogue)"))
      throw new Error("系列標題未保留明體聲部");
    if (/label\.mode \.mc small\s*\{[^}]*display\s*:\s*none/s.test(stageHtml))
      throw new Error("低高度畫面仍須保留模式說明給輔助技術");
    for (const frag of ['$("continueMeta").textContent', 'loaded.mode === "scholar"', 'loaded.lab.days'])
      if (!cui.includes(frag)) throw new Error("首頁進度未標明模式/天數:" + frag);
    for (const frag of ["已自動儲存｜", "有未完成進度", "currentSave ?"])
      if (!stageHtml.includes(frag) && !cui.includes(frag))
        throw new Error("首頁存檔存在時仍像旅程起點:" + frag);
  }
});

tests.push({
  name: "手機橫屏真機回歸|證據字級、實驗選單與辯論下半部不再溢出／裁切",
  fn: () => {
    const stageHtml = readFileSync(path.join(here, "../stage.html"), "utf-8");
    const cui = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
    if (/body\[data-view="debate"\] #panelWrap \{ bottom: 42%; \}/.test(stageHtml))
      throw new Error("舊辯論 bottom:42% 裁切規則仍存在");
    for (const frag of [
      "#dlgText.sys.gain { font-size: 1.1em",
      "grid-template-columns: max-content minmax(0, 1fr)",
      "grid-template-columns: repeat(3, minmax(260px, 78vw))",
      "#playAdvice { box-sizing: border-box; margin-top: 7px;",
      "#dialogue { min-height: 30%; padding: 12px 14px 14px;",
      "body[data-view=\"ship\"] #panelWrap { padding: 10px; color: #ede0c6; overflow: hidden;",
      "body[data-view=\"ship\"] #panelWrap { top: 12%; bottom: 3%; left: 3%; right: 3%; padding: 6px; overflow: hidden;",
      ".shipLab .shipAction { min-height: 44px;",
      ".shipWork { overflow-y: auto; overscroll-behavior: contain; }"
    ]) if (!stageHtml.includes(frag)) throw new Error("手機橫屏修正缺失:" + frag);
    for (const frag of ["COMPACT_LAB_QUERY", "timerOptionLabel", "syncLabTimerLabels", 'timer + "・" + PATTERNS.dayCost[timer] + "天"'])
      if (!cui.includes(frag)) throw new Error("手機計時器短名契約缺失:" + frag);
  }
});

tests.push({
  name: "窄舞台縮放回歸|900px 以下收斂為單一發言肖像，兩殼共用中文標點層",
  fn: () => {
    const stageHtml = readFileSync(path.join(here, "../stage.html"), "utf-8");
    const chapterHtml = readFileSync(path.join(here, "../chapter.html"), "utf-8");
    const sui = readFileSync(path.join(here, "../src/stage-ui.js"), "utf-8");
    for (const frag of [
      "@media (max-width: 900px)",
      '#dialogue[data-active="right"] #bustLeft',
      '#dialogue.has-l #dlgText, #dialogue.has-r #dlgText { margin-left: 0; margin-right: 0; }',
      '#dialogue[data-active="right"].has-r #dlgText { margin-right: 118px; }'
    ]) if (!stageHtml.includes(frag)) throw new Error("窄舞台 CSS 契約缺失:" + frag);
    for (const html of [stageHtml, chapterHtml]) {
      const tf = html.indexOf('src/text-format.js');
      const ui = html.indexOf('src/chapter-ui.js');
      if (tf < 0 || ui < 0 || tf > ui) throw new Error("text-format 必須先於 chapter-ui 載入");
    }
    if (!sui.includes('SHORT_P = "、，,；;：:·—"') || !sui.includes('LONG_P = "。．.？！?!…"'))
      throw new Error("逐字演出未識別全形中文標點");
    if (!sui.includes('"聲音：" +') ||
        !sui.includes('travelerVoiceAccessibleName(d.speaker, d.cls) + "："'))
      throw new Error("動態 HUD／對話紀錄仍輸出半形中文標點");
  }
});

tests.push({
  name: "C-2 拆分|stage-ui.js ≡ src/stage/*.part.js 串接(落後檢測;GB-ADR-015)",
  fn: async () => {
    const {
      concatParts, stageAssetVersion, assetVersionFor, withScriptAssetVersions,
      localScriptAssetRefs, assertLocalScriptAssetVersions
    } = await import("../tools/build-stage.mjs");
    const disk = readFileSync(path.join(here, "../src/stage-ui.js"), "utf-8");
    if (concatParts() !== disk)
      throw new Error("stage-ui.js 落後於 part 檔:執行 node tools/build-stage.mjs 後重新 commit");
    const stageHtml = readFileSync(path.join(here, "../stage.html"), "utf-8");
    if (!stageHtml.includes("src/stage-ui.js?v=" + stageAssetVersion(disk)))
      throw new Error("stage.html 的 stage-ui 快取鍵未隨生成物內容更新");
    for (const htmlName of [
      "stage.html", "chapter.html", "chapter2.html", "chapter3.html", "index.html"
    ]) {
      const html = readFileSync(path.join(here, "..", htmlName), "utf-8");
      if (withScriptAssetVersions(html) !== html)
        throw new Error(htmlName + " 有本機 JavaScript 快取鍵未隨內容更新");
      const refs = assertLocalScriptAssetVersions(html, htmlName);
      if (!refs.length) throw new Error(htmlName + " 沒有內容雜湊快取鍵");
      for (const ref of refs)
        if (ref.version !== assetVersionFor(ref.path))
          throw new Error(htmlName + " 快取鍵不符合檔案內容:" + ref.path);
    }
    const singleQuoted = withScriptAssetVersions(
      "<script defer src='src/chapter-ui.js'></script>"
    );
    const deferred = withScriptAssetVersions(
      '<script data-role="boot" defer src="data/scenes.js?v=stale"></script>'
    );
    for (const [label, sample, expectedPath] of [
      ["單引號＋src 非首屬性", singleQuoted, "src/chapter-ui.js"],
      ["多屬性＋舊 query", deferred, "data/scenes.js"]
    ]) {
      const refs = localScriptAssetRefs(sample);
      if (refs.length !== 1 || refs[0].path !== expectedPath ||
          refs[0].version !== assetVersionFor(expectedPath))
        throw new Error(label + " 未被內容雜湊建置器與驗證器共同辨識");
    }
    const parts = readdirSync(path.join(here, "../src/stage")).filter((f) => f.endsWith(".part.js"));
    if (parts.length < 11) throw new Error("stage part 檔缺失(應 ≥11,現 " + parts.length + ")");
    if (!disk.includes("本檔為生成物")) throw new Error("stage-ui.js 缺生成告示");
    if (disk.includes("repHinted"))
      throw new Error("舞台重啟仍讀寫未宣告的 repHinted，進遊戲會在瀏覽器拋錯");
    if (disk.includes("state.eventLog") ||
        !disk.includes('getAttribute("data-rep-reason")'))
      throw new Error("舞台表現層仍偷讀 chapter-ui 私有 state，或缺信譽理由呈現契約");
    const chapterUi = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
    if (!chapterUi.includes('setAttribute("data-rep-reason"'))
      throw new Error("chapter-ui 沒有把最新信譽理由交給舞台表現層");
  }
});

tests.push({
  name: "第二章 M1|scenes2 雙載體深等+劇本 v0.1.3/CR-002 逐字抽查+存檔鍵隔離",
  fn: () => {
    const fromJs = require("../data/scenes2.js");
    const fromJson = JSON.parse(readFileSync(path.join(here, "../data/scenes2.json"), "utf-8"));
    if (JSON.stringify(fromJs) !== JSON.stringify(fromJson)) throw new Error("scenes2 雙載體不深等");
    const debate2Js = require("../data/debate2.js");
    const debate2Json = JSON.parse(readFileSync(path.join(here, "../data/debate2.json"), "utf-8"));
    if (JSON.stringify(debate2Js) !== JSON.stringify(debate2Json)) throw new Error("debate2 雙載體不深等");
    const hist2Js = require("../data/histfacts2.js");
    const hist2Json = JSON.parse(readFileSync(path.join(here, "../data/histfacts2.json"), "utf-8"));
    if (JSON.stringify(hist2Js) !== JSON.stringify(hist2Json)) throw new Error("histfacts2 雙載體不深等");
    hist2Json.rows.forEach((row) => {
      if (!hist2Json.labels.includes(row.label)) throw new Error("histfacts2 未宣告標籤:" + row.label);
    });
    /* 逐字抽查(凍結劇本 v0.1.3+總監核准 CH2-CR-002) */
    const flat = JSON.stringify(fromJson);
    for (const frag of ["老夫讀完了。(抬眼)有一個問題。", "這是四年前的舊案,老夫早已記在書裡", "你們答錯題了",
      "這些才是他的說法會留下結果的地方", "先不把推論當成紀錄", "這一回,老夫也帶數字來"])
      if (!flat.includes(frag)) throw new Error("劇本逐字缺失:" + frag);
    /* 效果抽查:B0-2 a=rep-1/b 線 S3+rep+1;B1-2 F1 */
    const b02 = fromJson.scenes.find((s) => s.id === "B0-2");
    const q1 = b02.nodes.find((n) => n.id === "q1");
    if (q1.options.find((o) => o.id === "a").effects[0].rep !== -1) throw new Error("B0-2.a 信譽效果錯");
    if (!JSON.stringify(b02.nodes.find((n) => n.id === "s1").effects).includes('"S3"')) throw new Error("S3 未授予");
    /* 學者節點 mode 過濾標記 */
    const b12 = fromJson.scenes.find((s) => s.id === "B1-2");
    if (b12.nodes.find((n) => n.id === "nsch1").mode !== "scholar") throw new Error("學者節點未標 mode");
    /* 存檔鍵隔離:chapter2 覆寫 bd_ch2_save;chapter.html 不得含覆寫(灰盒零差異) */
    const c2 = readFileSync(path.join(here, "../chapter2.html"), "utf-8");
    if (!c2.includes('BD_SAVE_KEY = "bd_ch2_save"') || !c2.includes("scenes2")) throw new Error("chapter2 殼要素缺失");
    if (readFileSync(path.join(here, "../chapter.html"), "utf-8").includes("BD_SAVE_KEY")) throw new Error("chapter.html 混入 ch2 覆寫");
    if (!readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8").includes('window.BD_SAVE_KEY || "bd_ch1_save"'))
      throw new Error("存檔鍵預設回退缺失");
  }
});

tests.push({
  name: "第二章語言檔位|老派書面語可直讀，半文言只留伽利略刻意模仿",
  fn: () => {
    const scenes = JSON.parse(readFileSync(path.join(here, "../data/scenes2.json"), "utf-8"));
    const mimic = scenes.scenes.find((s) => s.id === "B2-3").nodes.find((n) => n.id === "n5");
    if (!mimic.text.includes("然此乃") || !mimic.text.includes("焉知"))
      throw new Error("B2-3 刻意模仿腔遺失");
    mimic.text = ""; /* 唯一核准例外，不讓例外反過來污染全章檢查。 */
    const visible = JSON.stringify(scenes) + JSON.stringify(JSON.parse(readFileSync(path.join(here, "../data/debate2.json"), "utf-8")));
    const banned = ["爾等", "爾之", "爾且", "然則", "此乃", "焉知", "安從", "不盈尺", "婦孺", "皆然", "皆算", "乃止", "力注於物", "一物一時"];
    banned.forEach((word) => { if (visible.includes(word)) throw new Error("非模仿台詞仍有半文言門檻:" + word); });
    for (const phrase of ["敢延伸到哪裡", "空氣開始大聲說話", "空氣還來不及插嘴", "骨架靠邊界"])
      if (visible.includes(phrase)) throw new Error("最後反撲又出現疊加隱喻:" + phrase);
    if ((visible.match(/老夫/g) || []).length < 8) throw new Error("白話化過頭：辛普里奧的老派聲線遺失");
    const script = readFileSync(path.join(here, "../../04_劇本/第二章完整劇本_拋出去的東西_v0.1.3.md"), "utf-8");
    for (const frag of ["CH2-CR-002", "CH2-CR-004", "CH2-CR-006", "前行和下墜不能同時", "你們這條規律,究竟適用於哪些情況"])
      if (!script.includes(frag)) throw new Error("劇本未同步語氣修正:" + frag);
  }
});

tests.push({
  name: "第二章玩家結論橋|選資料後由旅人說出關係，船桅紙仍待驗",
  fn: () => {
    const data = JSON.parse(readFileSync(path.join(here, "../data/scenes2.json"), "utf-8"));
    const byId = (sceneId, nodeId) => data.scenes
      .find((scene) => scene.id === sceneId).nodes.find((node) => node.id === nodeId);
    const firstClaim = byId("B2-3", "p1");
    const comparisonClaim = byId("B2-3", "p2");
    const sealedBoundary = byId("B3-1", "pF1");
    if (byId("B2-3", "s1").next !== "p1" || firstClaim.next !== "n4" ||
        firstClaim.speaker !== "旅人(你)" ||
        !firstClaim.text.includes("我用的是") || !firstClaim.text.includes("這只說"))
      throw new Error("平方根關係仍由系統通知代講，或缺資料邊界");
    if (byId("B2-3", "e3").next !== "s3" || byId("B2-3", "s3").next !== "p2" ||
        comparisonClaim.next !== "n6" || comparisonClaim.speaker !== "旅人(你)" ||
        !comparisonClaim.text.includes("同一條關係") || !comparisonClaim.text.includes("換重量"))
      throw new Error("雙球對照後沒有由玩家說出跨重量的資料關係");
    if (byId("B3-1", "n3_os").next !== "pF1" || sealedBoundary.next !== "s1" ||
        sealedBoundary.speaker !== "旅人(你)" ||
        !sealedBoundary.text.includes("待驗") ||
        !sealedBoundary.text.includes("不能拿它") || !sealedBoundary.text.includes("作證"))
      throw new Error("船桅封存紙沒有由玩家保留為待驗預測");
    const duplicate = data.scenes.flatMap((scene) => (scene.nodes || [])
      .filter((node) => node.id === "pF1").map(() => scene.id));
    if (duplicate.length !== 1 || duplicate[0] !== "B3-1")
      throw new Error("pF1 有重複或落在錯誤場景:" + duplicate.join(","));
  }
});

tests.push({
  name: "五章旅人聲域|可見名牌統一、內部聲域與讀屏語意不合併",
  fn: () => {
    const jsonFiles = ["scenes.json", "scenes2.json", "scenes3.json",
      "scenes4.json", "scenes5.json"];
    const runtimeSets = [scenes, scenes2, scenes3, scenes4, scenes5];
    const allowed = new Set(["旅人(你)", "旅人・心聲"]);
    const validate = (data, label) => {
      const found = [];
      for (const scene of data.scenes) for (const node of scene.nodes || []) {
        const speaker = node.speaker;
        if (speaker === "旅人")
          throw new Error(label + "/" + scene.id + "/" + node.id + " 仍用裸旅人");
        if (typeof speaker === "string" && speaker.startsWith("旅人")) {
          if (!allowed.has(speaker))
            throw new Error(label + "/" + scene.id + "/" + node.id +
              " 使用未定義的旅人聲域:" + speaker);
          found.push(speaker);
        }
      }
      if (!found.length) throw new Error(label + " 沒有任何旅人聲域樣本，掃描可能假綠");
      return found;
    };
    runtimeSets.forEach((data, index) => {
      const canonical = JSON.parse(readFileSync(
        path.join(here, "../data/" + jsonFiles[index]), "utf-8"));
      if (JSON.stringify(data) !== JSON.stringify(canonical))
        throw new Error(jsonFiles[index] + " 的 runtime 鏡像漂移");
      validate(data, "ch" + (index + 1));
    });

    /* 負向控制：任何合法旅人節點改回裸名，taxonomy 必須轉紅。 */
    const broken = JSON.parse(JSON.stringify(scenes3));
    const target = broken.scenes.flatMap((scene) => scene.nodes)
      .find((node) => allowed.has(node.speaker));
    target.speaker = "旅人";
    let reversedRed = false;
    try { validate(broken, "broken"); }
    catch (_) { reversedRed = true; }
    if (!reversedRed) throw new Error("旅人裸名 taxonomy 沒有反向轉紅");

    const busts = readFileSync(path.join(here, "../src/stage/03-busts.part.js"), "utf-8");
    const typewriter = readFileSync(path.join(here, "../src/stage/04-typewriter.part.js"), "utf-8");
    const events = readFileSync(path.join(here, "../src/stage/05-events.part.js"), "utf-8");
    const stageUi = readFileSync(path.join(here, "../src/stage-ui.js"), "utf-8");
    const html = readFileSync(path.join(here, "../stage.html"), "utf-8");
    const travelerHelperStart = busts.indexOf("  var TRAVELER_SPOKEN");
    const travelerHelperEnd = busts.indexOf("  var travelerOn", travelerHelperStart);
    if (travelerHelperStart < 0 || travelerHelperEnd < 0)
      throw new Error("找不到旅人聲域純 helper 邊界");
    const travelerHelperContext = {
      displayText: (value) => String(value || "")
    };
    new Script(
      busts.slice(travelerHelperStart, travelerHelperEnd) +
      "\nglobalThis.__travelerVoice = { normalizeTravelerLine, travelerVoiceName, travelerVoiceAccessibleName };"
    ).runInNewContext(travelerHelperContext);
    const travelerVoice = travelerHelperContext.__travelerVoice;
    const legacySpoken = travelerVoice.normalizeTravelerLine({
      speaker: "旅人", cls: ""
    });
    const innerLine = travelerVoice.normalizeTravelerLine({
      speaker: "旅人・心聲", cls: "player"
    });
    if (legacySpoken.speaker !== "旅人(你)" || legacySpoken.cls !== "player")
      throw new Error("舊旅人接口沒有正規化為說出口");
    if (innerLine.speaker !== "旅人・心聲" || innerLine.cls === "player")
      throw new Error("旅人心聲仍被 player class 誤標成說出口");
    if (travelerVoice.travelerVoiceName("旅人(你)", "player") !== "旅人（你）" ||
        travelerVoice.travelerVoiceName("旅人・心聲", "") !== "旅人（你）")
      throw new Error("旅人兩聲域的可見名牌沒有統一為「旅人（你）」");
    if (travelerVoice.travelerVoiceAccessibleName("旅人(你)", "player") !==
          "旅人說" ||
        travelerVoice.travelerVoiceAccessibleName("旅人・心聲", "") !==
          "旅人心裡想")
      throw new Error("旅人兩聲域的讀屏語意被可見名牌合併");
    for (const source of [busts, stageUi]) for (const phrase of [
      'out.speaker = "旅人(你)"',
      'return "旅人（你）"',
      'return "旅人心裡想"',
      'return "旅人說"'
    ]) if (!source.includes(phrase))
      throw new Error("旅人舊接口沒有在呈現邊界正規化:" + phrase);
    if (!typewriter.includes("travelerVoiceName(item.speaker, item.cls)") ||
        !events.includes("normalizeTravelerLine(ev.detail)") ||
        !events.includes("travelerVoiceAccessibleName(d.speaker, d.cls)"))
      throw new Error("視覺名牌與讀屏沒有共用旅人聲域名稱");
    for (const phrase of [
      "#dialogue.voice-inner", "border-style: dashed",
      "#dlgText.inner", "font-style: italic",
      "#dialogue.voice-inner .bslot", "brightness(.32)"
    ]) if (!html.includes(phrase))
      throw new Error("心聲缺少非色彩辨識提示:" + phrase);

    const ui = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
    const beat = ui.slice(ui.indexOf("function sayDebateBeat"),
      ui.indexOf("function doShip"));
    const spokenAt = beat.indexOf("db.lastPlayerLine");
    const replyAt = beat.indexOf("db.lastReply");
    const innerAt = beat.indexOf("db.lastOS");
    if (!(spokenAt >= 0 && spokenAt < replyAt && replyAt < innerAt))
      throw new Error("第三章辯論對話框未維持說出口→NPC 回應→心聲順序");
    for (const phrase of ["旅人（你）", '"旅人說"', '"旅人心裡想"'])
      if (!ui.includes(phrase))
        throw new Error("第三章工作台留檔層沒有同步名牌／讀屏聲域:" + phrase);
    for (const phrase of [
      "function visibleSpeakerName", "function accessibleSpeakerName",
      'speaker === "旅人・心聲") return "player inner"',
      'b.setAttribute("aria-label", accessibleSpeakerName(speaker))'
    ]) if (!ui.includes(phrase))
      throw new Error("完整筆記紀錄沒有同步旅人名牌／聲域:" + phrase);
    for (const file of ["chapter.html", "chapter2.html", "chapter3.html", "stage.html"]) {
      const shell = readFileSync(path.join(here, "../" + file), "utf-8");
      if (!shell.includes(".line.player.inner") ||
          !shell.includes("border-left: 2px dashed") ||
          !shell.includes("font-style: italic"))
        throw new Error(file + " 的完整筆記心聲缺少非色彩辨識");
    }
    for (const forbidden of [
      "旅人（你・說出口）",
      "旅人・心聲（其他角色聽不見）"
    ]) if (ui.includes(forbidden) || busts.includes(forbidden) || stageUi.includes(forbidden))
      throw new Error("玩家可見層仍殘留舊聲域說明:" + forbidden);
  }
});

tests.push({
  name: "雙章角色聲線|旅人固定現代白話；老派不等於文言；章末不用製作術語",
  fn: () => {
    const s1 = JSON.parse(readFileSync(path.join(here, "../data/scenes.json"), "utf-8"));
    const s2 = JSON.parse(readFileSync(path.join(here, "../data/scenes2.json"), "utf-8"));
    const d1 = JSON.parse(readFileSync(path.join(here, "../data/debate.json"), "utf-8"));
    const d2 = JSON.parse(readFileSync(path.join(here, "../data/debate2.json"), "utf-8"));
    const traveler = [];
    for (const data of [s1, s2]) for (const scene of data.scenes) for (const node of (scene.nodes || []))
      if (node.speaker === "旅人(你)" || node.speaker === "旅人・心聲")
        traveler.push(node.text || "");
    for (const data of [d1, d2]) for (const pillar of Object.values(data.chapter.pillars))
      traveler.push(pillar.playerCorrect || "");
    if (traveler.length < 10)
      throw new Error("旅人聲線掃描樣本為空或過少，可能仍在查已廢棄的裸 speaker");
    const travelerText = traveler.join("\n");
    const travelerBanned = ["便知", "二石", "擲下", "慢於", "快於", "敢問", "取哪一頭", "稚子", "尚不足以判定", "前行得再遠"];
    travelerBanned.forEach((word) => { if (travelerText.includes(word)) throw new Error("旅人聲線滑向半文言:" + word); });

    const simplicio = [];
    for (const data of [s1, s2]) for (const scene of data.scenes) for (const node of (scene.nodes || []))
      if (node.speaker === "辛普里奧") simplicio.push(node.text || "");
    for (const data of [d1, d2]) for (const pillar of Object.values(data.chapter.pillars)) {
      for (const st of pillar.statements || []) simplicio.push(st.text || "", st.press || "");
      simplicio.push(pillar.breakReply || "");
    }
    const simplicioText = simplicio.join("\n");
    ["爾等", "爾之", "此乃", "焉知", "然則", "安從"].forEach((word) => {
      if (simplicioText.includes(word)) throw new Error("辛普里奧以難讀文言代替老派聲線:" + word);
    });
    if ((simplicioText.match(/老夫/g) || []).length < 8) throw new Error("辛普里奧老派辨識詞遺失");

    const allNodes = [...s1.scenes, ...s2.scenes].flatMap((scene) => scene.nodes || []);
    const archaicMimics = allNodes.filter((node) => /此乃|焉知/.test(node.text || ""));
    if (archaicMimics.length !== 3) throw new Error("核准的模仿節點數漂移:" + archaicMimics.length);
    for (const node of archaicMimics) {
      if (node.speaker !== "伽利略" || !/模仿|學那個熟悉/.test(node.text))
        throw new Error("半文言未明標為伽利略模仿:" + (node.text || ""));
    }

    const runtimeVisible = JSON.stringify(s1) + JSON.stringify(s2) + JSON.stringify(d1) + JSON.stringify(d2);
    if (runtimeVisible.includes("鉤子")) throw new Error("玩家可見資料洩漏編劇術語「鉤子」");
    for (const [file, cr] of [["第一章完整劇本_重物的渴望_v0.2.2.md", "CH1-CR-004"], ["第二章完整劇本_拋出去的東西_v0.1.3.md", "CH2-CR-004"]]) {
      const script = readFileSync(path.join(here, "../../04_劇本/" + file), "utf-8");
      if (!script.includes(cr) || !script.includes("旅人筆記新增未解線索")) throw new Error("凍結劇本未同步聲線 CR:" + file);
    }
  }
});

tests.push({
  name: "第三章心聲減量|舊游標保留、活躍 OS 有用途、首個玩家發言選擇前移",
  fn: () => {
    const allowedPurposes = new Set([
      "time_dislocation", "future_knowledge", "cross_chapter_memory",
      "private_observation", "private_hypothesis", "emotional_risk", "naming"
    ]);
    const validate = (data) => {
      const allInner = [];
      const activeInner = [];
      const legacyInner = [];
      let firstAction = null;
      let linesBefore = 0;
      for (const scene of data.scenes) {
        const byId = new Map((scene.nodes || []).map((node) => [node.id, node]));
        for (const node of (scene.nodes || [])) {
          if (!firstAction && node.legacyOnly !== true &&
              (node.type === "choice" || node.type === "embed")) {
            firstAction = scene.id + "/" + node.id;
          } else if (!firstAction && node.legacyOnly !== true &&
              typeof node.text === "string" && node.text.trim()) {
            linesBefore += 1;
          }
          if (node.speaker === "旅人・心聲") {
            allInner.push(scene.id + "/" + node.id);
            if (node.legacyOnly === true) legacyInner.push(scene.id + "/" + node.id);
            else {
              activeInner.push(scene.id + "/" + node.id);
              if (!allowedPurposes.has(node.osPurpose))
                throw new Error(scene.id + "/" + node.id + " 活躍心聲缺合法 osPurpose");
            }
          }
          if (node.legacyOnly === true) continue;
          const targets = [];
          if (typeof node.next === "string") targets.push(node.next);
          for (const option of (node.options || []))
            if (typeof option.next === "string") targets.push(option.next);
          for (const target of targets)
            if (byId.get(target)?.legacyOnly === true)
              throw new Error(scene.id + "/" + node.id +
                " 仍指向 legacyOnly 節點 " + target);
        }
      }
      if (allInner.length !== 46 || activeInner.length !== 18 ||
          legacyInner.length !== 28)
        throw new Error("第三章心聲庫存／活躍／相容數不符:" +
          [allInner.length, activeInner.length, legacyInner.length].join("/"));
      if (firstAction !== "C0-1/c_meet" || linesBefore > 10)
        throw new Error("第三章首個玩家發言選擇沒有前移:" +
          firstAction + " before=" + linesBefore);
    };
    validate(scenes3);
    const meet = scenes3.scenes.find((scene) => scene.id === "C0-1");
    const meetChoice = meet.nodes.find((node) => node.id === "c_meet");
    for (const option of meetChoice.options) {
      const response = meet.nodes.find((node) => node.id === option.next);
      if (!response || response.speaker !== "伽桑狄")
        throw new Error("C0-1 的公開發言沒有由伽桑狄各自接住:" + option.id);
      const unquoted = option.text.replace(/^「|」$/g, "");
      if (response.text === unquoted)
        throw new Error("C0-1 選項被逐字重播，玩家同一句說了兩次:" + option.id);
    }

    /* 負向控制一：拔掉用途標記必須轉紅。 */
    const noPurpose = JSON.parse(JSON.stringify(scenes3));
    noPurpose.scenes.flatMap((scene) => scene.nodes)
      .find((node) => node.speaker === "旅人・心聲" && node.legacyOnly !== true)
      .osPurpose = undefined;
    let purposeRed = false;
    try { validate(noPurpose); } catch (_) { purposeRed = true; }
    if (!purposeRed) throw new Error("拔掉 osPurpose 沒有反向轉紅");

    /* 負向控制二：讓新主線重新走進舊心聲必須轉紅。 */
    const legacyEdge = JSON.parse(JSON.stringify(scenes3));
    legacyEdge.scenes.find((scene) => scene.id === "C0-1")
      .nodes.find((node) => node.id === "n1").next = "x4";
    let edgeRed = false;
    try { validate(legacyEdge); } catch (_) { edgeRed = true; }
    if (!edgeRed) throw new Error("legacyOnly 入邊沒有反向轉紅");
  }
});

tests.push({
  name: "第二章 P2 可理解性|先說可測預測，再由一拋一放反駁",
  fn: () => {
    const scenes = JSON.parse(readFileSync(path.join(here, "../data/scenes2.json"), "utf-8"));
    const debate = JSON.parse(readFileSync(path.join(here, "../data/debate2.json"), "utf-8"));
    const p2 = debate.chapter.pillars.P2;
    const target = p2.statements.find((s) => s.id === "p2s2");
    if (!p2.title.includes("才會開始下墜")) throw new Error("P2 標題仍是未翻譯術語");
    if (!target.text.includes("等它用完") || !target.insight.includes("晚落")) throw new Error("P2 沒把可測預測說滿");
    if (target.weakTo?.evidence !== "F3") throw new Error("P2 弱點不再指向 F3");
    if (!p2.playerCorrect.includes("飛出去的那顆就該晚落") || !p2.playerCorrect.includes("它從離手那一刻"))
      throw new Error("P2 正解缺『如果—應該—可是—所以』證據鏈");
    if (scenes.evidenceNames.F3 !== "一拋一放・近乎同時落地") throw new Error("F3 名稱未同步白話化");
  }
});

tests.push({
  name: "GB-ADR-022|預判→三列直測→封存未決→三紙重排",
  fn: () => {
    const scenes = JSON.parse(readFileSync(path.join(here, "../data/scenes2.json"), "utf-8"));
    const debateData = JSON.parse(readFileSync(path.join(here, "../data/debate2.json"), "utf-8"));
    const byId = (sid, nid) => scenes.scenes.find((s) => s.id === sid).nodes.find((n) => n.id === nid);
    const f2 = byId("B2-3", "n4").text;
    if (!f2.includes("還沒告訴我們前進會不會拖慢下墜") || !f2.includes("門閂直接問") ||
        f2.includes("各按自己的鐘走"))
      throw new Error("F2 未維持待驗假說語氣");
    const b24 = scenes.scenes.find((s) => s.id === "B2-4");
    const f3 = byId("B2-4", "n3").text;
    if (!f3.includes("三列「分不開」") || !f3.includes("一離手") || !f3.includes("能分辨的範圍裡"))
      throw new Error("F3 缺限定式獨立性結論");
    if (b24.nodes.filter((node) => !node.legacyOnly).length !== 11 ||
        ["np2", "np3", "na1"].some((id) => !byId("B2-4", id)?.legacyOnly))
      throw new Error("B2-4 未維持 11 個 active 節點與舊游標落點");
    const prediction = byId("B2-4", "q1");
    if (prediction.options.length !== 3 || prediction.options.some((option) => option.next !== "q2") ||
        prediction.options.some((option) => (option.effects || []).some((effect) => "rep" in effect)))
      throw new Error("B2-4 未在看結果前提供三個不計分預判");
    if (byId("B2-4", "q2").options.length !== 1 || byId("B2-4", "q2").options[0].next !== "np1" ||
        !byId("B2-4", "q2").options[0].text.includes("總門閂"))
      throw new Error("B2-4 不是一次總門閂釋放三層");
    if (byId("B2-4", "np1").type !== "choice" || byId("B2-4", "np1").options[0].next !== "q3" ||
        byId("B2-4", "q3").options[0].next !== "q4" || !byId("B2-4", "q4").text.includes("第三列"))
      throw new Error("B2-4 三列結果沒有逐列出現並由玩家確認");
    const b25 = scenes.scenes.find((s) => s.id === "B2-5");
    if (b25.nodes.filter((node) => !node.legacyOnly).length !== 10 ||
        ["n2", "n3", "n4", "q3", "w3"].some((id) => !byId("B2-5", id)?.legacyOnly))
      throw new Error("B2-5 未維持 10 個 active 節點與舊游標落點");
    if (byId("B2-5", "q1").options.length !== 3 ||
        byId("B2-5", "q1").options.find((o) => o.id === "a")?.next !== "q2" ||
        byId("B2-5", "w1b").next !== "q1" || byId("B2-5", "w1c").next !== "q1")
      throw new Error("B2-5 第一拍沒有讓玩家挑出唯一未實做的船桅紙");
    if (!byId("B2-5", "q2").options.find((o) => o.id === "a")?.text.includes("尚未在船上實做") ||
        byId("B2-5", "w2").next !== "q2" || !byId("B2-5", "n5").text.includes("壓下封蠟"))
      throw new Error("B2-5 未完成挑紙→寫界線→封蠟三步");
    if (scenes.evidenceNames.F5 !== "三紙邊界對位" ||
        byId("B3-F", "n4").text.includes("已重新排好") ||
        !byId("B3-F", "n4").text.includes("上一版排法仍留在桌上"))
      throw new Error("B3 仍用舊組鏈名稱，或複盤後被系統自動排正");

    /* 新主線不得再進入 legacyOnly；但已發佈存檔的 8 個舊游標必須真的能續讀。 */
    const legacyByScene = {
      "B2-4": new Set(["np2", "np3", "na1"]),
      "B2-5": new Set(["n2", "n3", "n4", "q3", "w3"])
    };
    const legacyContinuation = {
      "B2-4/np2":"q3", "B2-4/np3":"q4", "B2-4/na1":"n3",
      "B2-5/n2":"q1", "B2-5/n3":"q2", "B2-5/n4":"q3",
      "B2-5/q3":"n5", "B2-5/w3":"q3"
    };
    for (const [sceneId, legacyIds] of Object.entries(legacyByScene)) {
      const scene = scenes.scenes.find((item) => item.id === sceneId);
      for (const node of scene.nodes.filter((item) => !item.legacyOnly)) {
        const targets = [node.next]
          .concat((node.options || []).map((option) => option.next))
          .filter(Boolean);
        if (targets.some((target) => legacyIds.has(target)))
          throw new Error(sceneId + " active 主線重新進入 legacyOnly:" + node.id);
      }
    }
    const N2 = Narrative._factory(scenes, require("../src/engine2.js"), debateData);
    const San2 = require("../src/sanitize.js");
    for (const [sceneId, legacyIds] of Object.entries(legacyByScene)) {
      for (const nodeId of legacyIds) {
        const old = N2.initialState("explore");
        old.cursor = { scene:sceneId, node:nodeId };
        const imported = San2.sanitizeImport2(JSON.parse(JSON.stringify(old)), scenes, require("../src/engine2.js"));
        if (!imported.ok) throw new Error("legacyOnly 舊游標無法匯入:" + sceneId + "/" + nodeId);
        const oldView = N2.view(imported.state);
        const continued = oldView.type === "choice"
          ? N2.choose(imported.state, oldView.options[0].id)
          : N2.advance(imported.state);
        if (continued.error) throw new Error("legacyOnly 舊游標無法續讀:" + sceneId + "/" + nodeId);
        if (continued.state.cursor.scene !== sceneId ||
            continued.state.cursor.node !== legacyContinuation[sceneId + "/" + nodeId])
          throw new Error("legacyOnly 舊游標接到錯誤的新主線拍點:" + sceneId + "/" + nodeId);
      }
    }
    let legacyRepair = N2.initialState("explore");
    for (const [sceneId, nodeId, pick] of [
      ["B0-2", "q1", "a"], ["B2-4", "q4", "b"], ["B2-5", "q2", "b"]
    ]) {
      legacyRepair.cursor = { scene:sceneId, node:nodeId };
      const penalized = N2.choose(legacyRepair, pick);
      if (penalized.error) throw new Error("無法建立舊游標修復對照組:" + penalized.error);
      legacyRepair = penalized.state;
    }
    legacyRepair.cursor = { scene:"B2-5", node:"q3" };
    const repairRedirect = N2.redirectIfLocked(legacyRepair);
    if (!repairRedirect.redirected || repairRedirect.state.flags.returnScene !== "B2-5" ||
        repairRedirect.state.flags.returnNode !== "q3" ||
        !San2.sanitizeImport2(repairRedirect.state, scenes, require("../src/engine2.js")).ok)
      throw new Error("legacyOnly 舊游標不能作為信譽修復後的精確返回點");

    /* 三個預判只寫進原紙：不計分、不改結果，也不因答過就消失。 */
    const predictionResults = prediction.options.map((option) => {
      let state = N2.initialState("explore");
      state.cursor = { scene:"B2-4", node:"q1" };
      const picked = N2.choose(state, option.id);
      if (picked.error || picked.state.rep !== state.rep || picked.state.cursor.node !== "q2" ||
          !picked.state.transcript.some((line) => line.text === option.text))
        throw new Error("B2-4 預判沒有保留玩家原句，或偷改信譽:" + option.id);
      state = N2.choose(picked.state, "a").state;
      state = N2.choose(state, "a").state;
      state = N2.choose(state, "a").state;
      const resultView = N2.view(state);
      return JSON.stringify({ text:resultView.text, options:resultView.options.map((row) => row.text) });
    });
    if (new Set(predictionResults).size !== 1)
      throw new Error("B2-4 預判暗中改變了三列實驗結果");
    const arrangement = debateData.chapter.fr.arrangement;
    if (debateData.chapter.fr.kind !== "annotation-arrange" || arrangement.cards.length !== 3 ||
        JSON.stringify(arrangement.correct) !== JSON.stringify({ table:"stands", cannon:"boundary", sky:"unmeasured" }) ||
        !arrangement.originalNote.includes("桌上的規律全錯"))
      throw new Error("B3 終局未改為三張原紙的邊界重排");
    const successText = arrangement.success.map((line) => line.text).join("\n");
    if (!successText.includes("字仍看得見") || !successText.includes("仍信亞里斯多德") &&
        !byId("B3-6", "n2").text.includes("仍信亞里斯多德"))
      throw new Error("B3 沒守住方法批註留痕或信仰立場不變");
  }
});

tests.push({
  name: "一二章誘答可信度|平行選項、錯答不消失、正解必須由玩家親自選下",
  fn: () => {
    const s1 = JSON.parse(readFileSync(path.join(here, "../data/scenes.json"), "utf-8"));
    const d1 = JSON.parse(readFileSync(path.join(here, "../data/debate.json"), "utf-8"));
    if (JSON.stringify(d1).includes("主張紀錄"))
      throw new Error("第一章角色回饋仍洩漏介面欄位名『主張紀錄』");
    for (const rel of [
      "../../04_劇本/第一章完整劇本_重物的渴望_v0.2.2.md",
      "../../04_劇本/第一章可操作小說稿_重物的渴望_v0.3-draft.md"
    ]) {
      const script = readFileSync(path.join(here, rel), "utf-8");
      if (/P0-1[^\n]*信譽\s*\+1|INT-1[^\n]*信譽\s*\+1|這數據不能用/.test(script) ||
          !script.includes("信譽不變") || !/混雜紙|紙留著|紙留進卷宗/.test(script) ||
          !script.includes("A1-3.q1") || !/改選.*同材質|改選大鉛球\+小鉛球/.test(script))
        throw new Error("第一章參考稿又漂回舊信譽或丟棄混雜紙規則:" + rel);
    }
    const a13 = s1.scenes.find((scene) => scene.id === "A1-3");
    const diagnosis = a13?.nodes.find((node) => node.id === "nB3");
    if (!diagnosis || diagnosis.type !== "choice" || diagnosis.options.length !== 3)
      throw new Error("第一章混淆紀錄未交由玩家三選判讀");
    const diagnosisTexts = diagnosis.options.map((option) => option.text);
    const firstClauses = diagnosisTexts.map((text) => text.split(";")[0]);
    if (new Set(firstClauses).size !== 1 || firstClauses[0] !== "這張紙記下木球落後")
      throw new Error("第一章混淆誘答未使用平行句型");
    if (!diagnosisTexts.every((text) =>
      /^這張紙記下木球落後;材質和重量一起變了,原因先記成「.+」。$/.test(text)))
      throw new Error("第一章混淆誘答沒有維持同一資訊量與句法");
    if (diagnosisTexts.some((text) => /只能說|已經證明|一定是/.test(text)))
      throw new Error("第一章混淆誘答以限制詞或插旗詞洩答");
    for (const id of ["weight", "material"])
      if (diagnosis.options.find((option) => option.id === id)?.next !== "nBwrong")
        throw new Error("第一章混淆錯答沒有回到可重選的診斷");
    if (a13.nodes.find((node) => node.id === "nBwrong")?.next !== "nB3")
      throw new Error("第一章 NPC 追問後沒有把診斷權還給玩家");

    let ch1 = Narrative.initialState("explore");
    ch1.cursor = { scene: "A3-1", node: "n4" };
    ch1 = Narrative.advance(ch1).state;
    ch1.debate.idx = 3;
    ch1.debate.fr.opened = true;
    ch1.debate.fr.trapPending = true;
    ch1.lab.evidence.e3.c = true;
    let view = Narrative.debateView(ch1);
    if (view.phase !== "trap" || view.trap.options.map((option) => option.id).sort().join(",") !== "honest,lied")
      throw new Error("第一章終局誠實選項未完整呈現");
    let result = Narrative.debateFr(ch1, "lied");
    if (result.outcome !== "retry" || result.state.evidence.E5 || result.state.debate.status !== "pending")
      throw new Error("第一章說謊後被引擎代為改口或自動授證");
    view = Narrative.debateView(result.state);
    if (view.trap.options.map((option) => option.id).sort().join(",") !== "honest,lied")
      throw new Error("第一章錯項在答錯後消失，形成排除式洩答");
    result = Narrative.debateFr(result.state, "honest");
    if (result.outcome !== "resolved" || !result.state.evidence.E5)
      throw new Error("第一章玩家親選誠實句後未完成終局");

    const s2 = JSON.parse(readFileSync(path.join(here, "../data/scenes2.json"), "utf-8"));
    const d2 = JSON.parse(readFileSync(path.join(here, "../data/debate2.json"), "utf-8"));
    const b25 = s2.scenes.find((scene) => scene.id === "B2-5");
    const b25scope = b25?.nodes.find((node) => node.id === "q1");
    if (!b25scope || b25scope.options.length !== 3 ||
        !b25scope.options.every((option) => /：/.test(option.text)))
      throw new Error("第二章 B2-5 未用三張同格式紙讓玩家判讀");
    const arrangement = d2.chapter.fr.arrangement;
    if (d2.chapter.fr.kind !== "annotation-arrange" || arrangement.cards.length !== 3 ||
        arrangement.dispositions.length < 3)
      throw new Error("第二章終局未提供三紙整版重排");

    const N2 = Narrative._factory(s2, require("../src/engine2.js"), d2);
    let ch2 = N2.initialState("explore");
    ch2.cursor = { scene: "B3-1", node: "s1" };
    ch2 = N2.advance(ch2).state;
    ch2.debate.idx = 3;
    ch2.debate.fr.opened = true;
    for (const evidenceId of d2.chapter.fr.requires) ch2.evidence[evidenceId] = true;
    view = N2.debateView(ch2);
    if (view.phase !== "arrange" || view.arrange.cards.length !== 3 || view.arrange.lastLayout)
      throw new Error("第二章終局三張紙未進無預設的玩家介面");
    const beforePlayerLines = ch2.transcript.filter((line) => line.speaker === "旅人(你)").length;
    const wrongLayout = "arrange:table=stands,cannon=refutes,sky=unmeasured";
    result = N2.debateFr(ch2, wrongLayout);
    if (result.outcome !== "retry" || result.state.debate.fr.claimDone || result.state.rep !== ch2.rep)
      throw new Error("第二章錯排被自動改正，或把論辯草稿誤算成信譽事件");
    const addedPlayerLines = result.state.transcript.filter((line) => line.speaker === "旅人(你)").slice(beforePlayerLines);
    if (addedPlayerLines.length !== 1 || !addedPlayerLines[0].text.includes("用它否定桌上紀錄"))
      throw new Error("第二章錯排後 transcript 混入玩家未送出的正解");
    view = N2.debateView(result.state);
    if (view.phase !== "arrange" || view.arrange.lastLayout.cannon !== "refutes")
      throw new Error("第二章錯排沒有留在三張紙上供玩家改寫");
    result = N2.debateFr(result.state, wrongLayout);
    if (result.outcome !== "retry" || result.state.debate.mistakes.filter((mistake) => mistake.kind === "arrangement").length < 2)
      throw new Error("第二章同一個錯排不能再次送出或沒有留下痕跡");
    result = N2.debateFr(result.state, "arrange:table=stands,cannon=boundary,sky=unmeasured");
    if (result.outcome !== "resolved" || !result.state.debate.fr.claimDone || !result.state.evidence.F5)
      throw new Error("第二章正確三紙對位不是由玩家整版送出");
    view = N2.debateView(result.state);
    if (view.phase !== "won" || !view.arrange || !view.arrange.resolved ||
        view.arrange.lastLayout.cannon !== "boundary")
      throw new Error("第二章答對後沒有保留唯讀三紙板與正確歸位");
  }
});

tests.push({
  name: "四章對讀精修|未做思想實驗不當證據；角色聲線與倍率措辭同步",
  fn: () => {
    const s1 = JSON.parse(readFileSync(path.join(here, "../data/scenes.json"), "utf-8"));
    const s2 = JSON.parse(readFileSync(path.join(here, "../data/scenes2.json"), "utf-8"));
    const d2 = JSON.parse(readFileSync(path.join(here, "../data/debate2.json"), "utf-8"));
    const s4 = JSON.parse(readFileSync(path.join(here, "../data/scenes4.json"), "utf-8"));
    const assets = JSON.parse(readFileSync(path.join(here, "../data/assets.json"), "utf-8"));
    const byId = (data, sid, nid) => data.scenes.find((s) => s.id === sid)?.nodes.find((n) => n.id === nid);
    const ch1 = readFileSync(path.join(here, "../../04_劇本/第一章完整劇本_重物的渴望_v0.2.2.md"), "utf-8");
    const ch2 = readFileSync(path.join(here, "../../04_劇本/第二章完整劇本_拋出去的東西_v0.1.3.md"), "utf-8");
    const ch4 = readFileSync(path.join(here, "../../04_劇本/第四章台詞稿_v0.8_Claude_20260728.md"), "utf-8");
    const review = readFileSync(path.join(here, "../../05_審核/發現之前_第一至第四章_角色對話審稿本_20260723.md"), "utf-8");
    const principles = readFileSync(path.join(here, "../../02_設計/發現之前_設計原則手冊_v0.1.md"), "utf-8");

    const b02 = s2.scenes.find((s) => s.id === "B0-2");
    for (const id of ["n1", "n1a", "n1b", "n1c", "n1d"])
      if (!b02?.nodes.find((n) => n.id === id)) throw new Error("B0-2 未拆成三拍:" + id);
    if (s2.evidenceNames.F1 !== "船桅待驗預測" ||
        !byId(s2, "B1-2", "s1")?.text.includes("它還不是實驗紀錄") ||
        !assets.evidenceSummary?.F1?.includes("尚未取得船上紀錄"))
      throw new Error("F1 仍可能被玩家讀成已完成的船上證據");
    const p3 = d2.chapter.pillars.P3;
    if (p3.statements.find((s) => s.id === "p3s2")?.weakTo?.evidence !== "F3" ||
        !p3.playerCorrect.includes("但這一筆,我們還沒做") ||
        !p3.breakReply.includes("前半是紀錄,後半是欠下的驗證"))
      throw new Error("P3 未由 F3 實測負責反駁，或未留下船桅證據債");

    const a21 = byId(s1, "A2-1", "nb2")?.text || "";
    if (!a21.includes("同一顆球") || !a21.includes("坡放得越緩") ||
        !a21.includes("速度增加得越慢") || !a21.includes("我猜") ||
        !a21.includes("一步步變快的規矩") || a21.includes("攤平") || a21.includes("加速度"))
      throw new Error("A2-1 未把物理關係與待驗假說分開");
    if (!byId(s2, "B2-1", "n2")?.text.includes("他的推薦幫了大忙"))
      throw new Error("Guidobaldo 仍只剩資料載體，缺人物關係");

    const orchardText = JSON.stringify(s4.scenes.find((s) => s.id === "D0-2"));
    const scaleText = JSON.stringify(s4.scenes.find((s) => s.id === "D1-2"));
    const proofText = JSON.stringify(s4.scenes.find((s) => s.id === "D4-2"));
    if (orchardText.includes("六十個地球半徑") ||
        !scaleText.includes("合理重建") || !scaleText.includes("沒有存世") ||
        !scaleText.includes("兩張紙分開放") || !scaleText.includes("只量過月亮") ||
        !proofText.includes("拉力如何穿過空間") || !proofText.includes("誠實空白"))
      throw new Error("第四章數字揭露或牛頓技術聲線回歸");
    const stale = ["漏水的舊房", "把『向下』攤平", "各按自己的鐘走",
      "你們竟把邊界", "一筆相合，可能只是你替它挑了合身的衣服",
      "印刷台只管期限，不管真假", "留下空白不是失敗",
      "地表一秒落下的量，按距離平方縮弱"];
    const allEditedText = [ch1, ch2, ch4, review, JSON.stringify(s1), JSON.stringify(s2), JSON.stringify(d2), JSON.stringify(s4)].join("\n");
    for (const phrase of stale) if (allEditedText.includes(phrase)) throw new Error("舊句回歸:" + phrase);
    for (const cr of ["CH1-CR-007", "CH1-CR-008", "CH2-CR-010"])
      if (!allEditedText.includes(cr)) throw new Error("劇本缺正式變更紀錄:" + cr);
    for (const boundary of [
      "本版對 v0.7 的五項結構改動",
      "沒有一張存世的 1665 年計算紙",
      "第六槽"
    ]) if (!ch4.includes(boundary)) throw new Error("第四章 v0.8 法源邊界缺失:" + boundary);
    if (!ch4.includes("溫德林寫 60") || ch4.includes("惠更斯寫 60"))
      throw new Error("第四章 v0.8 正式稿仍把 1673 年惠更斯數值放進 1665 場");
    for (const principle of ["57. **思想實驗先取得預測", "58. **跨章重複母題必須改變人物關係"])
      if (!principles.includes(principle)) throw new Error("設計原則未沉澱:" + principle);
  }
});

tests.push({
  name: "第二章 M1|R-NAR2 三軌 lint:真實文本零受管詞+六組負向變異",
  fn: () => {
    const data = JSON.parse(readFileSync(path.join(here, "../data/scenes2.json"), "utf-8"));
    const TERMS = data.lint.terms;
    const scan = (sc) => { /* 掃所有玩家可見字串:台詞/選項/系統行/標題 */
      const hits = [];
      const check = (txt, where) => {
        if (typeof txt !== "string") return;
        for (const [k, words] of Object.entries(TERMS))
          for (const w of words) if (txt.includes(w)) hits.push({ k, w, where });
      };
      sc.scenes.forEach((s) => { check(s.title, s.id); s.nodes.forEach((n) => {
        check(n.text, s.id + "/" + n.id);
        (n.options || []).forEach((o) => check(o.text, s.id + "/" + n.id + "." + o.id));
      }); });
      (sc.lab2LawConcepts || []).forEach((c) => check(c.label, "lab2LawConcepts." + c.id + ".label"));
      return hits;
    };
    const hits = scan(data);
    /* R-NAR2:辯論資料也是玩家可見字串——攤平 debate2 一併掃 */
    const D2 = require("../data/debate2.js");
    const dHits = [];
    const dCheck = (txt, where) => {
      if (typeof txt !== "string") return;
      for (const [k, words] of Object.entries(TERMS))
        for (const w of words) if (txt.includes(w)) dHits.push({ k, w, where });
    };
    (function flat(o, p) {
      if (typeof o === "string") return dCheck(o, p);
      if (Array.isArray(o)) return o.forEach((x, i) => flat(x, p + "." + (x && x.id ? x.id : i)));
      if (o && typeof o === "object") Object.entries(o).forEach(([k, v]) => { if (k !== "a11y" || true) flat(v, p + "." + k); });
    })(D2.chapter, "debate2");
    const allowed = new Set((data.lint.entries || []).map((e) => e.nodeId + ":" + e.term));
    const bad = hits.concat(dHits).filter((h) => !allowed.has(h.where + ":" + h.w));
    if (bad.length) throw new Error("受管詞違規:" + JSON.stringify(bad[0]) + "(共 " + bad.length + " 筆未登錄)");
    /* 六組負向變異(合成注入,驗掃描器有牙) */
    const inject = (txt) => scan({ scenes: [{ id: "X", title: "", nodes: [{ id: "n1", type: "line", speaker: "旅人", text: txt, next: "end" }] }] }).length;
    const negatives = ["這就是拋物線", "射程吃的是平方根", "它們同時落地了", "√H 的關係", "開方即可", "拋物線是完美的形"];
    negatives.forEach((t, i) => { if (!inject(t)) throw new Error("負向變異未被抓到 #" + (i + 1) + ":" + t); });
  }
});

tests.push({
  name: "第三至五章結論詞彙邊界|資料驅動規則掃台詞、提示與選項，負向變異會轉紅",
  fn: () => {
    const chapters = [scenes3, scenes4, scenes5];
    /* 探針刻意獨立書寫，不得從 conclusionLint.rules[].term 生成。
       否則規則本身拼錯時，自我檢驗會拿同一個錯字測自己，形成假綠燈。 */
    const independentProbes = {
      ch3: [
        { term: "參考系", text: "先選定參考系再說。" },
        { term: "慣性系", text: "這就是慣性系。" },
        { term: "伽利略變換", text: "套用伽利略變換即可。" }
      ],
      ch4: [
        { term: "拋物線", text: "這條線是拋物線。" },
        { term: "萬有引力", text: "這就是萬有引力。" },
        { term: "平方反比", text: "力道遵守平方反比。" }
      ],
      ch5: [
        { term: "短少", text: "這一筆已經短少。" },
        { term: "速度的平方", text: "答案跟速度的平方走。" }
      ]
    };
    const visibleRows = (data) => {
      const rows = [];
      data.scenes.forEach((scene, sceneIndex) => scene.nodes.forEach((node) => {
        for (const [field, value] of [["text", node.text], ["hint", node.hint]])
          if (typeof value === "string") rows.push({ path:scene.id + "/" + node.id, scene:scene.id, sceneIndex, field, value });
        (node.options || []).forEach((option) => {
          if (typeof option.text === "string") rows.push({ path:scene.id + "/" + node.id + "." + option.id,
            scene:scene.id, sceneIndex, field:"option", value:option.text });
        });
      }));
      return rows;
    };
    const violations = (data) => {
      const rules = data.conclusionLint && data.conclusionLint.rules;
      if (!Array.isArray(rules) || !rules.length) throw new Error(data.chapter + " 缺 conclusionLint.rules");
      const rows = visibleRows(data), sceneIndex = Object.fromEntries(data.scenes.map((scene, index) => [scene.id, index]));
      const bad = [];
      rules.forEach((rule) => {
        if (typeof rule.term !== "string" || !rule.term) throw new Error(data.chapter + " 結論詞規則缺 term");
        const hits = rows.filter((row) => row.value.includes(rule.term));
        if (rule.kind === "forbid") bad.push(...hits.map((row) => ({ rule, row })));
        else if (rule.kind === "allow-only") {
          const allowed = new Set(rule.paths || []);
          hits.filter((row) => !allowed.has(row.path)).forEach((row) => bad.push({ rule, row }));
          for (const path of allowed) if (!hits.some((row) => row.path === path))
            throw new Error(data.chapter + " 白名單路徑沒有實際詞彙：" + path + " / " + rule.term);
        } else if (rule.kind === "after-scene") {
          if (!(rule.scene in sceneIndex)) throw new Error(data.chapter + " 揭曉場景不存在：" + rule.scene);
          hits.filter((row) => row.sceneIndex < sceneIndex[rule.scene]).forEach((row) => bad.push({ rule, row }));
        } else throw new Error(data.chapter + " 未知結論詞規則：" + rule.kind);
      });
      return bad;
    };
    const assertIndependentVocabulary = (data) => {
      const expected = (independentProbes[data.chapter] || []).map((probe) => probe.term).sort();
      const actual = (data.conclusionLint?.rules || []).map((rule) => rule.term).sort();
      if (JSON.stringify(actual) !== JSON.stringify(expected))
        throw new Error(data.chapter + " 結論詞規則與獨立探針不一致：" +
          JSON.stringify({ expected, actual }));
    };
    chapters.forEach((data) => {
      assertIndependentVocabulary(data);
      const bad = violations(data);
      if (bad.length) throw new Error(data.chapter + " 結論詞提前出現：" + bad[0].row.path + " / " + bad[0].rule.term);
      independentProbes[data.chapter].forEach((probe) => {
        const clone = JSON.parse(JSON.stringify(data));
        const first = clone.scenes[0].nodes.find((node) => typeof node.text === "string");
        first.text += " " + probe.text;
        if (!violations(clone).some((item) => item.rule.term === probe.term))
          throw new Error(data.chapter + " 獨立負向探針未轉紅：" + probe.term);
      });
      data.conclusionLint.rules.forEach((_, ruleIndex) => {
        const typo = JSON.parse(JSON.stringify(data));
        typo.conclusionLint.rules[ruleIndex].term += "錯";
        let typoRejected = false;
        try { assertIndependentVocabulary(typo); } catch (_) { typoRejected = true; }
        if (!typoRejected) throw new Error(data.chapter + " 規則詞誤植未被獨立探針抓到 #" + ruleIndex);
      });
    });
  }
});

tests.push({
  name: "第二章 M1-M3|全章走查:B0-1→BE-2 終+三柱+三紙重排+論證對位複盤",
  fn: () => {
    const F = require("../src/narrative.js")._factory;
    const scenes2 = JSON.parse(readFileSync(path.join(here, "../data/scenes2.json"), "utf-8"));
    const E2 = require("../src/engine2.js");
    const D2 = require("../data/debate2.js");
    const FULL = [["release", "latchRelease"], ["edge", "polishedEdge"], ["rangeBed", "rakedSand"]];
    const walk = (mode, opts0) => {
      const o = opts0 || {};
      const N2 = F(scenes2, E2, D2);
      let st = N2.initialState(mode, o.xch || null);
      const lab = (action, args) => {
        const r = N2.labAction(st, action, args);
        if (r.error) throw new Error("lab " + action + ":" + r.error);
        st = r.state;
      };
      const driveCatapult = (v) => {
        const u = scenes2.scenes.find((s) => s.id === v.scene).nodes.find((n) => n.id === v.nodeId).until;
        if (u.cat === "threeH") {
          for (const [slot, part] of FULL) lab("place", { slot, part });
          lab("calibrate", { kind: "releaseZero" }); lab("calibrate", { kind: "rangeScale" });
          lab("beginSeries", { ball: "copper" });
          for (const H of [4, 9, 16]) lab("runHeight", { H });
        } else if (u.f2 === "law") {
          lab("predictSeries", { value: 5.0 }); lab("runHeight", { H: 25 });
          lab("assertLaw", { seriesId: 1, conceptId: "sqrtScale" });
        } else if (u.f2 === "ball") {
          lab("beginSeries", { ball: "wood" });
          for (const H of [4, 9, 16]) lab("runHeight", { H });
          lab("predictSeries", { value: 5.0 }); lab("runHeight", { H: 25 });
          lab("compareBalls", { a: 1, b: 2 });
        } else if (u.repairRun) {
          /* 雙歸零時先走信譽修復：既有裝置不重組，只新增一筆乾淨沙痕。 */
          lab("beginSeries", { ball: "copper" });
          lab("runHeight", { H: 4 });
        }
        const rc = N2.embedComplete(st);
        if (rc.error) throw new Error("embedComplete:" + rc.error);
        st = rc.state;
      };
      const driveDebate = () => {
        const dv = N2.debateView(st);
        const ok = (r, tag) => { if (r.error) throw new Error(tag + ":" + r.error); st = r.state; };
        if (dv.status === "suspended") { ok(N2.debateExitSuspended(st), "exit suspended"); return; }
        if (dv.phase === "pillars") {
          const pid = dv.pillar.id;
          if (dv.reason) {
            const response = {
              P1: "no-straight-stage", P2: "fall-not-delayed", P3: "motions-coexist"
            }[pid];
            ok(N2.debateReason(st, response), "reason " + pid);
            return;
          }
          ok(N2.debatePresent(st, { target: { P1: "p1s2", P2: "p2s2", P3: "p3s2" }[pid],
            evidence: { P1: "F4", P2: "F3", P3: "F3" }[pid] }), "present " + pid);
          return;
        }
        if (dv.phase === "arrange") {
          let code = "arrange:table=stands,cannon=boundary,sky=unmeasured";
          let mark = "";
          if ((o.wrongFR || o.secondWrong || o.suspendFR) && !st.flags.frW) {
            if (o.suspendFR) {
              st = JSON.parse(JSON.stringify(st));
              st.debate.persuasion = 1;
            }
            code = "arrange:table=stands,cannon=discard,sky=unmeasured";
            mark = "frW";
          } else if (o.secondWrong && !st.flags.frW2) {
            code = "arrange:table=stands,cannon=refutes,sky=unmeasured";
            mark = "frW2";
          }
          const r = N2.debateFr(st, code);
          if (r.error) throw new Error("arrange:" + r.error);
          st = r.state;
          if (mark) {
            st.flags[mark] = "1";
            if (r.outcome !== "retry" && r.outcome !== "suspended")
              throw new Error("三紙錯排應留在原步或進複盤");
          }
          return;
        }
        if (dv.phase === "enemy") {
          if (dv.enemy.step === "slope" && o.wrongFR && !st.flags.frW) {
            const r = N2.debateFr(st, "same"); st = r.state; st.flags.frW = "1";
            if (r.outcome !== "retry") throw new Error("FR 誤選應留原步");
            return;
          }
          ok(N2.debateFr(st, dv.enemy.step === "slope" ? "steeper" : "boundary"), "enemy " + dv.enemy.step);
          return;
        }
        if (dv.phase === "trap") { throw new Error("第二章新終局不應再進舊 claim 選單"); }
        if (dv.phase === "fr") {
          if (dv.fr.kind === "explore") { ok(N2.debateFr(st, "a"), "fr explore"); return; }
          ok(N2.debateFr(st, ["c1", "c2", "c3"][dv.fr.slots.length]), "fr slot");
          return;
        }
        if (dv.phase === "won") { const r = N2.embedComplete(st); if (r.error) throw new Error("辯後收尾:" + r.error); st = r.state; return; }
        throw new Error("未知辯論相位:" + dv.phase);
      };
      let guard = 0;
      while (!st.ended && guard++ < 900) {
        const lock = N2.redirectIfLocked(st);
        if (lock.redirected) { st = lock.state; continue; }
        const v = N2.view(st);
        if (v.type === "embed" && v.system === "debate") { driveDebate(); continue; }
        if (v.type === "embed" && v.system === "debrief") { const r = N2.embedComplete(st); if (r.error) throw new Error(r.error); st = r.state; continue; }
        if (v.type === "embed") { driveCatapult(v); continue; }
        if (v.type === "review") { st = N2.setReview(st, "測試答一", "測試答二").state; continue; }
        if (v.type === "choice") {
          const ids = v.options.map((x) => x.id);
          let pick = ids.includes("a") ? "a" : ids[0];
          if (o.wrongFirst && v.scene === "B0-2" && !st.flags.triedA) {
            st = N2.choose(st, "a").state; st.flags.triedA = "1";
            if (st.rep !== 2) throw new Error("B0-2.a 應 rep 3→2,得 " + st.rep);
            continue;
          }
          if (v.scene === "B0-2") pick = "b";
          if (v.scene === "B2-3" && ids.includes("r1")) pick = o.hypothesis ? "r2" : "r1";
          if (v.scene === "B2-2" && o.wrongFirst && !st.flags.triedBend && ids.includes("b")) {
            st = N2.choose(st, "b").state; st.flags.triedBend = "1"; continue; /* F4 可錯可修 */
          }
          if (v.scene === "B2-4" && v.nodeId === "q4" && o.wrongFirst && !st.flags.triedLate && ids.includes("b")) {
            st = N2.choose(st, "b").state; st.flags.triedLate = "1"; continue; /* F3 可錯可修 */
          }
          const r = N2.choose(st, pick);
          if (r.error) throw new Error("choose:" + v.scene + " " + r.error);
          st = r.state;
        } else {
          const r = N2.advance(st);
          if (r.error) throw new Error("advance:" + JSON.stringify(v).slice(0, 80));
          st = r.state;
        }
      }
      if (!st.ended) throw new Error("900 步未達終點(" + mode + ")");
      return st;
    };
    /* 探索線:B0-2 誤選、F4/F3 誤判修正、r2 假說、FR slope 誤選一次、honest */
    const s1 = walk("explore", { wrongFirst: true, hypothesis: true, wrongFR: true });
    for (const ev of ["S3", "S4", "F1", "F2", "F3", "F4", "F5"])
      if (!s1.evidence[ev]) throw new Error("證據缺失:" + ev);
    if (s1.rep !== 2) throw new Error("先搶答後修正、再把未測延遲寫進第三列，信譽應 2,得 " + s1.rep);
    if (s1.lab.days !== 10) throw new Error("黃金路徑應 10 天,得 " + s1.lab.days);
    if (s1.flags.revealSqrt !== "1") throw new Error("r2 假說未寫揭曉旗標");
    if (s1.debate.status !== "won" || !s1.debate.fr.claimDone || !s1.debate.fr.lastLayout)
      throw new Error("FR 三紙重排完成旗標/勝利狀態缺失");
    if (s1.debate.persuasion !== 4) throw new Error("FR 誤選一次應 5→4,得 " + s1.debate.persuasion);
    /* 學者線+ch1 certified 投影：前章認證仍保留，但新終局共同重排同一批三紙，不再另開 inherited 口試。 */
    const s2 = walk("scholar", { hypothesis: false, xch: { ch1: { source: "ch1-schema3", certified: true, e3: { a: true, b: true, c: true } } } });
    if (s2.flags.revealSqrt !== "1") throw new Error("r1 押中路未原子寫入揭曉旗標");
    if (!s2.transcript.some((t) => (t.text || "").includes("先不把推論當成紀錄"))) throw new Error("學者分支未演出");
    if (!s2.crossChapter?.ch1?.certified ||
        !s2.transcript.some((t) => (t.text || "").includes("天上的——今日空著")) ||
        s2.transcript.some((t) => (t.text || "").includes("第一章只量到不同傾角")))
      throw new Error("certified 投影遺失，或新三紙終局仍誤入舊 inherited 口試");
    /* 兩次錯排只扣論證對位，不把介面試排冒充研究失信；第三版由玩家整版送對。 */
    const s3 = walk("explore", { secondWrong: true });
    if (s3.debate.persuasion !== 3 || s3.rep !== 4)
      throw new Error("錯排代價錯:persuasion=" + s3.debate.persuasion + " rep=" + s3.rep);
    if (s3.debate.fr.attempts !== 3 || s3.debate.status !== "won")
      throw new Error("兩次錯排後未由玩家親手完成第三版");
    /* 論證對位歸零：保留原紙與錯排→複盤一次→再入後完成，不觸發信譽修復。 */
    const s4 = walk("explore", { suspendFR: true });
    const countEvent = (t) => s4.eventLog.filter((e) => e.t === t).length;
    if (countEvent("repairEnter") !== 0) throw new Error("三紙錯排不得誤進信譽修復");
    if (countEvent("debateSuspend") !== 1) throw new Error("論證對位歸零應且僅應複盤一次,得 " + countEvent("debateSuspend"));
    if (s4.rep !== 4 || s4.debate.status !== "won" || !s4.debate.fr.claimDone)
      throw new Error("複盤後未完成三紙重排:rep=" + s4.rep + " status=" + s4.debate.status);
    /* 存檔往返 */
    const F2i = F(scenes2, E2, D2);
    const back = F2i.loadSave(F2i.serialize(s1));
    if (back.error) throw new Error("ch2 存檔往返失敗:" + back.error);
    if (JSON.stringify(back.state) !== JSON.stringify(JSON.parse(JSON.stringify(s1)))) throw new Error("往返不深等");
    /* projectCh1 投影:合法完章/未完章/壞 JSON */
    const N1 = require("../src/narrative.js");
    let ch1done = N1.initialState("scholar");
    ch1done.ended = true; ch1done.lab.evidence.e3 = { a: true, b: true, c: true };
    if (!F2i.projectCh1(JSON.stringify(ch1done)).certified) throw new Error("完章投影應 certified");
    if (F2i.projectCh1(JSON.stringify(N1.initialState("explore"))).certified) throw new Error("未完章不得 certified");
    if (!F2i.projectCh1("{壞json").invalid) throw new Error("壞 JSON 應 invalid");
  }
});

tests.push({
  name: "第二章 M2b|until 閘負向+殼接線:threeH 需 clean、非彈射引擎拒新動作、chapter2 引擎重指",
  fn: () => {
    const F = require("../src/narrative.js")._factory;
    const scenes2 = JSON.parse(readFileSync(path.join(here, "../data/scenes2.json"), "utf-8"));
    const E2 = require("../src/engine2.js");
    const N2 = F(scenes2, E2, {});
    /* 開到 B2-3 e1,用 speedDrift 裝置跑三高:劇情門不得開 */
    let st = N2.initialState("explore");
    let guard = 0;
    while (guard++ < 200) {
      const v = N2.view(st);
      if (v.type === "embed" && v.scene === "B2-3" && v.nodeId === "e1") break;
      if (v.type === "choice") st = N2.choose(st, v.options[0].id === "a" ? (v.scene === "B0-2" ? "b" : "a") : v.options[0].id).state;
      else st = N2.advance(st).state;
    }
    const drive = [["place", { slot: "release", part: "handRelease" }],
      ["place", { slot: "edge", part: "polishedEdge" }], ["place", { slot: "rangeBed", part: "rakedSand" }],
      ["calibrate", { kind: "releaseZero" }], ["calibrate", { kind: "rangeScale" }],
      ["beginSeries", { ball: "copper" }], ["runHeight", { H: 4 }], ["runHeight", { H: 9 }], ["runHeight", { H: 16 }]];
    for (const [a, g] of drive) st = N2.labAction(st, a, g).state;
    if (!N2.embedComplete(st).error) throw new Error("speedDrift 裝置竟通過 threeH 劇情門(需 clean)");
    /* ch1 引擎不得吃 ch2 動作 */
    const N1 = require("../src/narrative.js");
    const s1 = N1.initialState("explore");
    if (!N1.labAction(s1, "beginSeries", { ball: "copper" }).error) throw new Error("ch1 引擎誤收 ch2 動作");
    /* 殼接線+面板 */
    const c2 = readFileSync(path.join(here, "../chapter2.html"), "utf-8");
    if (!c2.includes("engine2.js") || !c2.includes("GB.Engine = window.GB.Engine2")) throw new Error("chapter2 引擎重指缺失");
    const cui = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
    for (const frag of ['v.system === "catapult"', "renderCatapult", "compareBalls", "assertLaw", "abandonSeries",
      "cat2CompareFailure", "r.result.ok === false", "先選銅球紀錄", "再選木球紀錄",
      "我主張：兩組只換了球", "claimCheck.onchange",
      "cat2Mission", "cat2DefaultMessage", "mountCatapultReplay", "catReplayTrajectory",
      "cat2EvidenceFlags", "cat2ClaimGain", "cat2GateLabel", "catClaims", "catClaimComplete", "catStagePause",
      "用這組數據提出斷言", "選擇數據支持的概念", "workshopPartGuide", "catPartBrief",
      "目前查看｜", 'bs.value = v.nodeId === "e3" ? "wood" : "copper"'] )
      if (!cui.includes(frag)) throw new Error("彈射面板缺件:" + frag);
    if (!(cui.indexOf("catapultGate(sv)") < cui.indexOf("if (!open)")))
      throw new Error("彈射工坊完成出口仍藏在長紀錄簿底端");
    const stage = readFileSync(path.join(here, "../stage.html"), "utf-8");
    for (const frag of ["grid-template-rows: auto auto", "font-family: var(--font-dialogue); overflow: visible",
      ".catReplay", ".catCompareHint", ".catCompare > button", ".catMessage.gain", ".catClaims",
      ".catPartBrief",
      "#controls.catapultWorkshop::after", "env(safe-area-inset-bottom)",
      "height: clamp(220px,31vh,340px)",
      "grid-template-rows: minmax(0,1fr) auto", ".catPartArt { width: 64px; height: 64px; object-fit: contain"])
      if (!stage.includes(frag)) throw new Error("彈射工坊捲動/重播/比較提示樣式缺失:" + frag);
    if (/\.catMaster img[^}]*object-fit:\s*cover/.test(stage)) throw new Error("彈射裝置功能圖不得以 cover 裁切");
    if (readFileSync(path.join(here, "../chapter.html"), "utf-8").includes("engine2")) throw new Error("灰盒一章殼混入 ch2 引擎");
  }
});

tests.push({
  name: "第二章工坊成果節拍|F2 先得兩項斷言再合成完整證據，取得 F# 觸發戰利品演出",
  fn: () => {
    const F = require("../src/narrative.js")._factory;
    const scenes2 = require("../data/scenes2.js");
    const E2 = require("../src/engine2.js");
    const N2 = F(scenes2, E2, {});
    let st = N2.initialState("explore");
    st.cursor = { scene: "B2-3", node: "e2" };
    const drive = [["place", { slot: "release", part: "latchRelease" }],
      ["place", { slot: "edge", part: "polishedEdge" }], ["place", { slot: "rangeBed", part: "rakedSand" }],
      ["calibrate", { kind: "releaseZero" }],
      ["calibrate", { kind: "rangeScale" }], ["beginSeries", { ball: "copper" }],
      ["runHeight", { H: 4 }], ["runHeight", { H: 9 }], ["runHeight", { H: 16 }],
      ["predictSeries", { value: 5 }], ["runHeight", { H: 25 }]];
    for (const [a, g] of drive) st = N2.labAction(st, a, g).state;
    if (st.lab.evidence.f2.law || st.lab.evidence.f2.ball || st.evidence.F2)
      throw new Error("銅球押中後不得自動取得斷言或合成 F2");
    const wrong = N2.labAction(st, "assertLaw", { seriesId: 1, conceptId: "linearScale" });
    if (!wrong.result || wrong.result.ok !== false || wrong.state.lab.evidence.f2.law)
      throw new Error("錯誤概念未留在可重試狀態");
    st = N2.labAction(st, "assertLaw", { seriesId: 1, conceptId: "sqrtScale" }).state;
    if (!st.lab.evidence.f2.law || st.lab.evidence.f2.lawSource !== 1 || st.lab.evidence.f2.lawConcept !== "sqrtScale" || st.evidence.F2)
      throw new Error("手動選數據+概念後未只取得斷言一");
    st.cursor.node = "e1";
    if (!N2.embedReady(st)) throw new Error("已完成 25 格的乾淨銅球紀錄未救援第一步出口");
    st.cursor.node = "e3";
    for (const [a, g] of [["beginSeries", { ball: "wood" }], ["runHeight", { H: 4 }], ["runHeight", { H: 9 }],
      ["runHeight", { H: 16 }], ["predictSeries", { value: 5 }], ["runHeight", { H: 25 }]])
      st = N2.labAction(st, a, g).state;
    st = N2.labAction(st, "compareBalls", { a: 1, b: 2 }).state;
    if (!st.lab.evidence.f2.ball || !st.evidence.F2) throw new Error("換球比較後未合成完整 F2");
    if (!N2.embedReady(st)) throw new Error("兩項斷言完成後第三步未出現劇情出口");
    const typewriter = readFileSync(path.join(here, "../src/stage/04-typewriter.part.js"), "utf-8");
    if (!typewriter.includes("取得(?:證據| [A-Z]\\d)")) throw new Error("第二章取得 F# 未接入戰利品演出");
  }
});

tests.push({
  name: "第二章 M3b|schema1 章別隔離+書信封套+跨章唯讀投影(R-SAV2/R-XCH)",
  fn: () => {
    const F = require("../src/narrative.js")._factory;
    const scenes2 = require("../data/scenes2.js");
    const E2 = require("../src/engine2.js");
    const D2 = require("../data/debate2.js");
    const N2 = F(scenes2, E2, D2);
    const Env = require("../src/save-envelope.js");
    const s2 = N2.initialState("explore");
    if (N2.SAVE_SCHEMA !== 1 || N2.CHAPTER_ID !== "ch2" || s2.schemaVersion !== 1 || s2.chapter !== "ch2")
      throw new Error("第二章 schema/章別未隔離");
    const letter = Env.encode("ch2", s2);
    const decoded = Env.decode(letter);
    if (!decoded.envelope || decoded.chapter !== "ch2" || JSON.stringify(decoded.payload) !== JSON.stringify(s2))
      throw new Error("第二章封套往返失敗");
    const legacy = Env.decode(JSON.stringify(require("../src/narrative.js").initialState("explore")));
    if (!legacy.legacy || !legacy.value || legacy.value.schemaVersion !== 3) throw new Error("第一章 legacy raw 未辨識");
    const badVer = JSON.stringify({ format: Env.FORMAT, envelopeVersion: 99, chapter: "ch2", payload: s2 });
    if (Env.decode(badVer).error !== "envelope-version") throw new Error("未知封套版本未拒絕");
    const badChapter = JSON.stringify({ format: Env.FORMAT, envelopeVersion: 1, chapter: "ch9", payload: s2 });
    if (Env.decode(badChapter).error !== "chapter") throw new Error("未知章別未拒絕");
    const N1 = require("../src/narrative.js");
    let done = N1.initialState("scholar");
    done.ended = true; done.lab.evidence.e3 = { a: true, b: true, c: true };
    const projected = N2.projectCh1(JSON.stringify(done));
    if (!projected.certified || projected.source !== "ch1-schema3") throw new Error("完章投影未認證");
    done.schemaVersion = 2;
    if (!N2.projectCh1(JSON.stringify(done)).invalid) throw new Error("錯 schema 跨章資料未拒絕");
  }
});

tests.push({
  name: "第二章 M3b|sanitizeImport2 白名單與負向變異",
  fn: () => {
    const F = require("../src/narrative.js")._factory;
    const scenes2 = require("../data/scenes2.js");
    const E2 = require("../src/engine2.js");
    const N2 = F(scenes2, E2, require("../data/debate2.js"));
    const S = require("../src/sanitize.js");
    const fresh = N2.initialState("explore");
    if (!S.sanitizeImport2(JSON.parse(JSON.stringify(fresh)), scenes2, E2).ok) throw new Error("合法第二章 state 被拒");
    const mutations = [
      (s) => { s.chapter = "ch1"; },
      (s) => { s.schemaVersion = 3; },
      (s) => { s.cursor.node = "不存在"; },
      (s) => { s.lab.slots.release = "roughEdge"; },
      (s) => { s.lab.days = NaN; },
      (s) => { s.lab.evidence.f2.lawConcept = "linearScale"; },
      (s) => { s.lab.series = [{ id: 1, status: "complete", ball: "copper", profile: "clean", cycle: 0, readings: { 4: Infinity }, prediction: 5 }]; },
      (s) => { s.transcript = [{ scene: "B0-1", text: "x".repeat(2001) }]; }
    ];
    mutations.forEach((mutate, i) => {
      const s = JSON.parse(JSON.stringify(fresh)); mutate(s);
      if (S.sanitizeImport2(s, scenes2, E2).ok) throw new Error("惡意第二章案例 #" + (i + 1) + " 未拒絕");
    });
  }
});

tests.push({
  name: "第二章存檔真相|三紙正解才能取得 F5，舊終局仍可匯入",
  fn: () => {
    const E2 = require("../src/engine2.js");
    const D2 = require("../data/debate2.js");
    const N2 = Narrative._factory(scenes2, E2, D2);
    const S = require("../src/sanitize.js");
    const clone = (value) => JSON.parse(JSON.stringify(value));
    const checked = (state) => S.sanitizeImport2(clone(state), scenes2, E2);

    /* 新增的兩個研究誠實事件必須能從 runtime 原子動作完整往返。 */
    const firstPenalty = (scene, node, pick) => {
      const state = N2.initialState("explore");
      state.cursor = { scene, node };
      const result = N2.choose(state, pick);
      if (result.error || !checked(result.state).ok)
        throw new Error(scene + "/" + node + "." + pick + " 合法信譽事件被 sanitizer 拒絕");
      return result.state;
    };
    const delayState = firstPenalty("B2-4", "q4", "b");
    const mastBState = firstPenalty("B2-5", "q2", "b");
    firstPenalty("B2-5", "q2", "c");
    const missingChoice = clone(delayState);
    missingChoice.eventLog = missingChoice.eventLog.filter((event) =>
      !(event.t === "choice" && event.at === "B2-4/q4" && event.pick === "b"));
    if (S.sanitizeImport2(missingChoice, scenes2, E2).ok)
      throw new Error("F3 虛構延遲於拿掉玩家選擇後仍可匯入");
    const wrongReason = clone(mastBState);
    wrongReason.eventLog.find((event) => event.t === "rep" && event.at === "B2-5/q2.b").reason = "不存在的理由";
    if (S.sanitizeImport2(wrongReason, scenes2, E2).ok)
      throw new Error("船桅越界事件可篡改玩家可見理由");

    const acquireF2 = (state) => {
      state.cursor = { scene:"B2-3", node:"e2" };
      const actions = [
        ["place", { slot:"release", part:"latchRelease" }],
        ["place", { slot:"edge", part:"polishedEdge" }],
        ["place", { slot:"rangeBed", part:"rakedSand" }],
        ["calibrate", { kind:"releaseZero" }], ["calibrate", { kind:"rangeScale" }],
        ["beginSeries", { ball:"copper" }], ["runHeight", { H:4 }], ["runHeight", { H:9 }],
        ["runHeight", { H:16 }], ["predictSeries", { value:5 }], ["runHeight", { H:25 }],
        ["assertLaw", { seriesId:1, conceptId:"sqrtScale" }],
        ["beginSeries", { ball:"wood" }], ["runHeight", { H:4 }], ["runHeight", { H:9 }],
        ["runHeight", { H:16 }], ["predictSeries", { value:5 }], ["runHeight", { H:25 }],
        ["compareBalls", { a:1, b:2 }]
      ];
      for (const [action, args] of actions) {
        const result = N2.labAction(state, action, args);
        if (result.error) throw new Error("建立合法 F2 失敗:" + result.error);
        state = result.state;
      }
      return state;
    };
    const arrangeBase = () => {
      const state = acquireF2(N2.initialState("explore"));
      state.cursor = { scene:"B3-1", node:"s1" };
      const entered = N2.advance(state);
      if (entered.error) throw new Error(entered.error);
      entered.state.debate.idx = 3;
      entered.state.debate.fr.opened = true;
      for (const id of D2.chapter.fr.requires) entered.state.evidence[id] = true;
      return entered.state;
    };
    const wrong = N2.debateFr(arrangeBase(),
      "arrange:table=stands,cannon=discard,sky=unmeasured");
    if (wrong.error || !checked(wrong.state).ok)
      throw new Error("合法錯排中途存檔被拒絕:" + checked(wrong.state).reason);
    const suspendBase = arrangeBase();
    suspendBase.debate.persuasion = 1;
    const suspended = N2.debateFr(suspendBase,
      "arrange:table=stands,cannon=discard,sky=unmeasured");
    if (suspended.outcome !== "suspended" || !checked(suspended.state).ok)
      throw new Error("論證對位歸零存檔被拒絕:" + checked(suspended.state).reason);
    const won = N2.debateFr(wrong.state,
      "arrange:table=stands,cannon=boundary,sky=unmeasured");
    if (won.outcome !== "resolved" || !checked(won.state).ok)
      throw new Error("玩家親手完成的三紙正解存檔被拒絕:" + checked(won.state).reason);

    const freshF5 = N2.initialState("explore"); freshF5.evidence.F5 = true;
    const badLayout = clone(won.state); badLayout.debate.fr.lastLayout.cannon = "discard";
    const badAttempts = clone(won.state); badAttempts.debate.fr.attempts = "nine";
    const hugeAttempts = clone(won.state); hugeAttempts.debate.fr.attempts = 999;
    const badPersuasion = clone(won.state); badPersuasion.debate.persuasion = 999;
    const noF5 = clone(won.state); delete noF5.evidence.F5;
    const zeroPending = clone(wrong.state); zeroPending.debate.persuasion = 0;
    const closedWithLayout = clone(wrong.state); closedWithLayout.debate.fr.opened = false;
    const stringOpened = clone(wrong.state); stringOpened.debate.fr.opened = "yes";
    for (const [label, forged] of [
      ["空手 F5", freshF5], ["勝利後改排法", badLayout], ["次數改字串", badAttempts],
      ["次數超界", hugeAttempts], ["說服力超界", badPersuasion], ["勝利卻刪 F5", noF5],
      ["待續卻說服力歸零", zeroPending], ["未開放卻有錯排", closedWithLayout],
      ["opened 非布林", stringOpened]
    ]) if (S.sanitizeImport2(forged, scenes2, E2).ok)
      throw new Error(label + " 偽造存檔未被拒絕");

    const forgedF2 = N2.initialState("explore");
    forgedF2.lab.evidence.f2 = { law:true, lawSource:1, lawConcept:"sqrtScale", ball:true };
    forgedF2.evidence.F2 = true;
    forgedF2.eventLog.push({ t:"lab", action:"assertLaw", at:"B2-3/e2" },
      { t:"evidence", id:"F2", at:"lab2" },
      { t:"lab", action:"compareBalls", at:"B2-3/e3" });
    if (checked(forgedF2).ok) throw new Error("零筆原始資料仍可偽造完整 F2");
    const tamperedReading = acquireF2(N2.initialState("explore"));
    tamperedReading.lab.series[0].readings[9] = 99;
    if (checked(tamperedReading).ok) throw new Error("竄改 fixture 讀值仍可匯入");
    const missingCompareEvent = acquireF2(N2.initialState("explore"));
    missingCompareEvent.eventLog = missingCompareEvent.eventLog.filter((event) =>
      !(event.t === "lab" && event.action === "compareBalls"));
    if (checked(missingCompareEvent).ok) throw new Error("F2b 缺少玩家比較事件仍可匯入");

    /* 51c977d 舊玩家已走完 slope→classify→claim→三環的存檔不得被新規則鎖外。 */
    const legacyWon = N2.initialState("explore");
    for (const id of ["F1", "F2", "F3", "F4", "F5"]) legacyWon.evidence[id] = true;
    legacyWon.debate = {
      persuasion:4, idx:3, pillars:{}, p3NeedFlag:false, pressChoice:null,
      fr:{ opened:true, step:3, slots:[], trapPending:false, resolved:true,
        enemyStep:null, enemySlopeRead:true, enemyClassified:true, claimDone:true,
        overTried:false },
      mistakes:[], status:"won"
    };
    legacyWon.eventLog.push({ t:"evidence", id:"F5", at:"debate.fr" }, { t:"debateWon" });
    if (!checked(legacyWon).ok)
      throw new Error("已發佈的舊版終局存檔被新 sanitizer 拒絕:" + checked(legacyWon).reason);
  }
});

tests.push({
  name: "第二章三紙對位|三種核心錯排留痕，格式錯誤零變更",
  fn: () => {
    const E2 = require("../src/engine2.js");
    const D2 = require("../data/debate2.js");
    const N2 = Narrative._factory(scenes2, E2, D2);
    const base = () => {
      const state = N2.initialState("explore");
      state.cursor = { scene:"B3-1", node:"s1" };
      const entered = N2.advance(state).state;
      entered.debate.idx = 3; entered.debate.fr.opened = true;
      for (const id of D2.chapter.fr.requires) entered.evidence[id] = true;
      return entered;
    };
    for (const row of [
      ["arrange:table=stands,cannon=discard,sky=unmeasured", "這是老夫量到的", "discard"],
      ["arrange:table=stands,cannon=refutes,sky=unmeasured", "哪一張紙說另一張沒有發生", "refutes"],
      ["arrange:table=stands,cannon=boundary,sky=stands", "這一欄，誰量的", "stands"]
    ]) {
      const before = base();
      const result = N2.debateFr(before, row[0]);
      if (result.outcome !== "retry" || result.state.evidence.F5 || result.state.rep !== before.rep ||
          result.state.debate.persuasion !== before.debate.persuasion - 1 ||
          result.state.debate.fr.lastLayout[row[2] === "stands" ? "sky" : "cannon"] !== row[2] ||
          !result.state.transcript.some((line) => line.text.includes(row[1])))
        throw new Error("錯排沒有保留原版、只扣論證對位，或回應未指向真正邊界:" + row[0]);
    }
    for (const input of [
      "arrange:table=stands,cannon=boundary",
      "arrange:table=stands,cannon=teleport,sky=unmeasured"
    ]) {
      const before = base(), snapshot = JSON.stringify(before);
      const result = N2.debateFr(before, input);
      if (!result.error || JSON.stringify(result.state) !== snapshot || JSON.stringify(before) !== snapshot)
        throw new Error("三紙格式錯誤改寫了玩家狀態:" + input);
    }
  }
});

tests.push({
  name: "第二章 M3b|三紙對位 UI+匯入淨化接線契約",
  fn: () => {
    const cui = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
    const validateArrangeUi = (source) => {
      for (const frag of [
        'd.phase === "arrange"', "annotationBoard", "annotationCards", "annotationPaper",
        'select.value = selected[card.id] || ""', "placeholder.value = \"\"",
        "submit.disabled = d.arrange.cards.some", 'var encoded = "arrange:"',
        "d.arrange.lastLayout", "renderResolvedAnnotation", 'document.createElement("del")',
        "原文仍可讀", 'document.querySelector(".annotationPaper select")',
        "sanitizeImport2", "SaveEnvelope", "startGame(imported.state)"
      ]) if (!source.includes(frag)) throw new Error("M3b UI/匯入接線缺失:" + frag);
    };
    validateArrangeUi(cui);
    let prefillRed = false;
    try {
      validateArrangeUi(cui.replace(
        'select.value = selected[card.id] || ""',
        'select.value = selected[card.id] || "stands"'
      ));
    } catch (_) { prefillRed = true; }
    if (!prefillRed) throw new Error("三紙下拉選單預填正解的反向變異沒有轉紅");
    const c2 = readFileSync(path.join(here, "../chapter2.html"), "utf-8");
    for (const frag of [
      "src/save-envelope.js", "scenes1", "engine2.js", "第二章", "第一寸的弧線",
      ".annotationCards", "grid-template-columns: repeat(3,minmax(0,1fr))",
      "@media (max-width: 680px) { .annotationCards { grid-template-columns: 1fr; } }",
      ".annotationPaper select, .annotationSubmit { width: 100%; min-height: 44px; }"
    ])
      if (!c2.includes(frag)) throw new Error("第二章殼缺失:" + frag);
    const stage2 = readFileSync(path.join(here, "../stage.html"), "utf-8");
    for (const frag of [
      ".annotationCards { display: grid", "grid-template-columns: repeat(3,minmax(0,1fr))",
      ".annotationSubmit", ".annotationPaper select { width: 100%; min-width: 0; min-height: 44px; }",
      ".annotationResolved .annotationOriginalNote del", 'src="data/series.js?v=asset-'
    ])
      if (!stage2.includes(frag)) throw new Error("第二章正式舞台回歸契約缺失:" + frag);
    if (!stage2.includes(".annotationCards { grid-template-columns: 1fr; }"))
      throw new Error("三紙對位在窄螢幕沒有收成單欄");
    const series = JSON.parse(readFileSync(path.join(here, "../data/series.json"), "utf-8"));
    if (!series.chapters.some((chapter) => chapter.id === "ch2" && chapter.route === "ch02"))
      throw new Error("第二章未登錄於資料驅動首頁");
  }
});

tests.push({
  name: "第二章 M2a|engine2:profile 支配序+受控自由+校準重置+守衛(R-WS2)",
  fn: () => {
    const E2 = require("../src/engine2.js");
    const build = (parts, cal) => {
      let s = E2.initialState();
      for (const [slot, part] of parts) { const r = E2.place(s, slot, part); if (r.error) throw new Error("place " + part + ":" + r.error); s = r.state; }
      for (const k of cal || []) { const r = E2.calibrate(s, k); if (r.error) throw new Error(r.error); s = r.state; }
      return s;
    };
    const FULL = [["release", "latchRelease"], ["edge", "polishedEdge"], ["rangeBed", "rakedSand"]];
    /* 空槽=notRunnable+run 拒絕 */
    let s0 = E2.initialState();
    if (s0.slots.launcher !== "shortGroove" || s0.slots.heightRig !== "liftSandbed")
      throw new Error("固定器材未隨新遊戲自動安裝");
    if (E2.place(s0, "launcher", "shortGroove").error !== "fixed-slot" ||
        E2.replacePart(s0, "heightRig", "liftSandbed").error !== "fixed-slot")
      throw new Error("唯一必要件仍可被當成假選擇操作");
    if (E2.profileOf(s0) !== "notRunnable") throw new Error("空槽 profile 錯");
    if (!E2.beginSeries(s0, "copper").error) throw new Error("空槽可開 series");
    /* 舊存檔相容：固定槽為 null 時，以現行固定件解讀，不要求玩家補選。 */
    let legacy = E2.initialState(); legacy.slots.launcher = null; legacy.slots.heightRig = null;
    for (const [slot, part] of FULL) legacy = E2.place(legacy, slot, part).state;
    legacy = E2.calibrate(E2.calibrate(legacy, "releaseZero").state, "rangeScale").state;
    if (E2.profileOf(legacy) !== "clean" || E2.fingerprint(legacy).indexOf("shortGroove") < 0 || E2.fingerprint(legacy).indexOf("liftSandbed") < 0)
      throw new Error("legacy 固定槽 null 未被補成現行固定骨架");
    /* 支配序四格 */
    if (E2.profileOf(build(FULL, ["releaseZero", "rangeScale"])) !== "clean") throw new Error("clean 判定錯");
    if (E2.profileOf(build(FULL, ["releaseZero"])) !== "coarseRead") throw new Error("rangeScale 未校應 coarseRead");
    const rough = FULL.map((p) => p[0] === "edge" ? ["edge", "roughEdge"] : p);
    if (E2.profileOf(build(rough, ["releaseZero", "rangeScale"])) !== "directionScatter") throw new Error("毛邊應 directionScatter");
    const hand = FULL.map((p) => p[0] === "release" ? ["release", "handRelease"] : p);
    if (E2.profileOf(build(hand, ["releaseZero", "rangeScale"])) !== "speedDrift") throw new Error("手放應 speedDrift");
    const eye = FULL.map((p) => p[0] === "rangeBed" ? ["rangeBed", "eyeBoard"] : p);
    if (E2.profileOf(build(eye, ["releaseZero", "rangeScale"])) !== "coarseRead") throw new Error("目測板應 coarseRead(支配序最高)");
    /* 裝配順序自由:兩種順序→同 profile 同 fixture 讀值 */
    const rev = [...FULL].reverse();
    const sA = build(FULL, ["releaseZero", "rangeScale"]), sB = build(rev, ["releaseZero", "rangeScale"]);
    const runAll = (st) => { let r = E2.beginSeries(st, "copper"); st = r.state; for (const H of [4, 9, 16]) { st = E2.runHeight(st, H).state; } st = E2.predict(st, 5).state; return E2.runHeight(st, 25).state; };
    const ra = runAll(sA).series[0], rb = runAll(sB).series[0];
    if (JSON.stringify(ra.readings) !== JSON.stringify(rb.readings) || ra.profile !== rb.profile)
      throw new Error("裝配順序影響了讀值/профile");
    /* 校準重置:換 release 只重置 releaseZero */
    let sc = build(FULL, ["releaseZero", "rangeScale"]);
    sc = E2.replacePart(sc, "release", "handRelease").state;
    if (sc.calib.releaseZero !== false || sc.calib.rangeScale !== true) throw new Error("換件重置範圍錯");
    /* no-op 校準不耗天 */
    let sd = build(FULL, ["releaseZero"]);
    const days0 = sd.days;
    if (E2.calibrate(sd, "releaseZero").noop !== true || E2.calibrate(sd, "releaseZero").state.days !== days0)
      throw new Error("重複校準應 no-op 零天");
    /* open series 期間 replace 拒絕;放棄後可換且舊紀錄留 abandoned */
    let se = build(FULL, ["releaseZero", "rangeScale"]);
    se = E2.beginSeries(se, "copper").state;
    if (E2.replacePart(se, "edge", "roughEdge").error !== "series-open") throw new Error("開放 series 未擋換件");
    if (E2.calibrate(se, "rangeScale").error !== "series-open") throw new Error("開放 series 未擋校準");
    se = E2.abandonSeries(se).state;
    if (se.series[0].status !== "abandoned") throw new Error("放棄未記錄");
    if (E2.replacePart(se, "edge", "roughEdge").error) throw new Error("放棄後應可換件");
    /* 未知件/錯槽:state 深等不變 */
    const before = JSON.stringify(s0);
    if (!E2.place(s0, "release", "noSuchPart").error || !E2.place(s0, "edge", "latchRelease").error)
      throw new Error("非法 place 未拒絕");
    if (JSON.stringify(s0) !== before) throw new Error("拒絕後 state 被污染");
  }
});

tests.push({
  name: "第二章 M2a|engine2:fixture 判定+12.0/12.5 邊界+換球守衛+黃金路徑 10 天(R-LAB2)",
  fn: () => {
    const E2 = require("../src/engine2.js");
    const FULL = [["release", "latchRelease"], ["edge", "polishedEdge"], ["rangeBed", "rakedSand"]];
    const build = () => {
      let s = E2.initialState();
      for (const [slot, part] of FULL) s = E2.place(s, slot, part).state;
      s = E2.calibrate(s, "releaseZero").state;
      s = E2.calibrate(s, "rangeScale").state;
      return s;
    };
    const runSeries = (s, ball, pred) => {
      s = E2.beginSeries(s, ball).state;
      for (const H of [4, 9, 16]) s = E2.runHeight(s, H).state;
      s = E2.predict(s, pred).state;
      return E2.runHeight(s, 25).state;
    };
    /* clean 三輪全過+cycle 輪替；資料通過不得自動形成斷言 */
    let s = build();
    s = runSeries(s, "copper", 5.0);
    if (!s.series[0].accepted || s.series[0].cycle !== 0) throw new Error("clean cycle1 應過");
    if (s.evidence.f2.law) throw new Error("accepted copper series 不得自動點亮 F2 law");
    let incomplete = build();
    incomplete = E2.beginSeries(incomplete, "copper").state;
    if (E2.assertLaw(incomplete, 1, "sqrtScale").error !== "series-not-complete")
      throw new Error("未完成紀錄未被手動斷言守衛擋下");
    let woodOnly = runSeries(build(), "wood", 5.0);
    if (E2.assertLaw(woodOnly, 1, "sqrtScale").error !== "law-source-ball")
      throw new Error("木球紀錄誤被受理為斷言一來源");
    const wrongConcept = E2.assertLaw(s, 1, "linearScale");
    if (wrongConcept.ok !== false || wrongConcept.state !== s || s.evidence.f2.law)
      throw new Error("錯誤概念不得寫入斷言");
    const missingConcept = E2.assertLaw(s, 1, "");
    if (missingConcept.error !== "unknown-law-concept") throw new Error("未選概念未被拒絕");
    s = E2.assertLaw(s, 1, "sqrtScale").state;
    if (!s.evidence.f2.law || s.evidence.f2.lawSource !== 1 || s.evidence.f2.lawConcept !== "sqrtScale")
      throw new Error("選可用銅球數據+平方根概念後 F2 law 未點亮");
    s = runSeries(s, "copper", 5.0); s = runSeries(s, "copper", 5.0);
    if (!(s.series[1].accepted && s.series[2].accepted)) throw new Error("clean cycle2/3 應過");
    if (s.series.map((x) => x.cycle).join(",") !== "0,1,2") throw new Error("cycle 未輪替");
    /* 黃金路徑天數:2 校準+銅 4 放=6;加木球 4 放=10 */
    if (s.series[0].dayEnded !== 6) throw new Error("銅球首輪應第 6 天收,得 " + s.series[0].dayEnded);
    s = runSeries(s, "wood", 5.0);
    if (s.days !== 2 + 4 * 4) throw new Error("四輪後總天數錯:" + s.days);
    const sameBall = E2.compareBalls(s, 1, 2);
    if (sameBall.ok || !sameBall.diffs.includes("球種須一銅一木")) throw new Error("同球比較未給可翻譯守衛原因");
    /* 換球守衛正例 */
    const cmp = E2.compareBalls(s, 1, 4);
    if (!cmp.ok || !cmp.state.evidence.f2.ball) throw new Error("換球正例未過:" + JSON.stringify(cmp.diffs));
    /* 換球負例:數字看似相近，但木球紀錄未通過預測門檻，不得拿來作證。 */
    const unaccepted = JSON.parse(JSON.stringify(s));
    unaccepted.series[3].accepted = false;
    unaccepted.series[3].predictionError = 0.2;
    const rejectedUnaccepted = E2.compareBalls(unaccepted, 1, 4);
    if (rejectedUnaccepted.ok || rejectedUnaccepted.state !== unaccepted ||
        !rejectedUnaccepted.diffs.some((d) => d.includes("未通過雙門檻")) ||
        rejectedUnaccepted.state.evidence.f2.ball)
      throw new Error("未受理木球紀錄仍能寫出與球重無關");
    let lock = build();
    lock = E2.beginSeries(lock, "copper").state;
    for (const H of [4, 9, 16]) lock = E2.runHeight(lock, H).state;
    lock = E2.predict(lock, 5).state;
    const relock = E2.predict(lock, 4.5);
    if (relock.error !== "prediction-locked" || relock.state !== lock)
      throw new Error("已封存的 25 格預測仍可改寫");
    let restored = E2.replacePart(s, "edge", "roughEdge").state;
    restored = E2.replacePart(restored, "edge", "polishedEdge").state;
    restored = runSeries(restored, "wood", 5.0);
    const revisionMismatch = E2.compareBalls(restored, 1, restored.series.length);
    if (revisionMismatch.ok || !revisionMismatch.diffs.some((d) => d.includes("revision")))
      throw new Error("拆裝後復原的裝置仍被當成只換球");
    /* 換球負例:不同 edge 指紋 */
    let bad = E2.replacePart(cmp.state, "edge", "roughEdge").state;
    bad = E2.calibrate(bad, "rangeScale").noop ? bad : bad; /* rangeScale 未失效 */
    bad = runSeries(bad, "wood", 5.5);
    const cmp2 = E2.compareBalls(bad, 1, bad.series.length);
    if (cmp2.ok || !cmp2.diffs.some((d) => d.includes("指紋"))) throw new Error("指紋守衛未擋");
    /* 故障 profile 全不過 */
    let sh = E2.initialState();
    for (const [slot, part] of FULL) sh = E2.place(sh, slot, part === "latchRelease" ? "handRelease" : part).state;
    sh = E2.calibrate(sh, "releaseZero").state; sh = E2.calibrate(sh, "rangeScale").state;
    sh = runSeries(sh, "copper", 5.85);
    if (sh.series[0].accepted) throw new Error("speedDrift 竟通過(押中 25 也不該過形狀門)");
    if (E2.assertLaw(sh, 1, "sqrtScale").error !== "series-not-accepted")
      throw new Error("未通過雙門檻的紀錄誤被受理為斷言來源");
    /* coarseRead:區間讀值→拒絕 */
    let sc2 = E2.initialState();
    for (const [slot, part] of FULL) sc2 = E2.place(sc2, slot, part === "rakedSand" ? "eyeBoard" : part).state;
    sc2 = E2.calibrate(sc2, "releaseZero").state; sc2 = E2.calibrate(sc2, "rangeScale").state;
    sc2 = runSeries(sc2, "copper", 5.0);
    if (sc2.series[0].accepted || sc2.series[0].rejectReason !== "non-scalar") throw new Error("區間值未被拒");
    /* 12.0 含等號過/12.5 必不過(合成:二分從兩側夾邊界,kHat 連動故不可線性造值) */
    const mk = (e) => ({ 4: 2 * (1 + e), 9: 3, 16: 4, 25: 5 });
    const bisect = (target) => { /* 回傳 [lo,hi]:shape(lo)<=target<shape(hi) */
      let lo = 0, hi = 0.8;
      for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; (E2._judgeRaw(mk(m), 5).shapeError <= target) ? lo = m : hi = m; }
      return [lo, hi];
    };
    const [lo120] = bisect(0.12);
    const jPass = E2._judgeRaw(mk(lo120), 5);
    if (!(jPass.shapeError <= 0.12 && jPass.accepted)) throw new Error("貼齊 12.0% 應通過,得 " + jPass.shapeError);
    const [, hi125] = bisect(0.125);
    const jFail = E2._judgeRaw(mk(hi125), 5);
    if (!(jFail.shapeError > 0.125 - 1e-9) || jFail.accepted) throw new Error("越過 12.5% 應不過,得 " + jFail.shapeError);
    /* 順序守衛:跳測 16 拒絕不耗天;25 前必先預測 */
    let so = build(); so = E2.beginSeries(so, "copper").state;
    const d0 = so.days;
    if (E2.runHeight(so, 16).error !== "wrong-order" || so.days !== d0) throw new Error("H 順序守衛失效");
    so = E2.runHeight(so, 4).state; so = E2.runHeight(so, 9).state; so = E2.runHeight(so, 16).state;
    if (E2.runHeight(so, 25).error !== "prediction-required") throw new Error("未預測可跑 25");
  }
});

tests.push({
  name: "跨章舞台特寫|角色指圖與小說想像畫面同步入鏡，換場清除且手機不擋選項",
  fn: () => {
    const assets = JSON.parse(readFileSync(path.join(here, "../data/assets.json"), "utf-8"));
    const scenes1 = JSON.parse(readFileSync(path.join(here, "../data/scenes.json"), "utf-8"));
    const scenes2 = JSON.parse(readFileSync(path.join(here, "../data/scenes2.json"), "utf-8"));
    const scenes3 = JSON.parse(readFileSync(path.join(here, "../data/scenes3.json"), "utf-8"));
    const scenes4 = JSON.parse(readFileSync(path.join(here, "../data/scenes4.json"), "utf-8"));
    const scenes5 = JSON.parse(readFileSync(path.join(here, "../data/scenes5.json"), "utf-8"));
    const scenes6 = JSON.parse(readFileSync(path.join(here, "../data/scenes6.json"), "utf-8"));
    const ids = new Set(assets.entries.map((e) => e.id));
    const byScene = new Map([...scenes1.scenes, ...scenes2.scenes, ...scenes3.scenes, ...scenes4.scenes,
      ...scenes5.scenes, ...scenes6.scenes]
      .map((s) => [s.id, JSON.stringify(s)]));
    const rules = assets.lineFocusVisual || [];
    for (const sid of ["P0-2", "A1-2", "A1-5", "A1-7", "A2-2", "A2-4"])
      if (!rules.some((r) => r.scene === sid)) throw new Error("第一章關鍵證據場景缺特寫規則:" + sid);
    if (!rules.some((r) => r.scene === "E-1" && r.items.some((x) => x.asset === "ch01_focus_canal_first_arc_v01")))
      throw new Error("第一章運河尾聲缺少『向前又向下』的小說特寫");
    if (rules.some((r) => r.scene === "E-2" && r.items.some((x) => x.asset === "card_E5")))
      throw new Error("月球滿版尾聲不得重複疊上斜面外推證據卡");
    for (const sid of ["B0-2", "B1-1", "B2-1", "B2-2", "B2-4", "B2-5"])
      if (!rules.some((r) => r.scene === sid)) throw new Error("第二章關鍵指圖場景缺特寫規則:" + sid);
    if (!rules.some((r) => r.scene === "B1-2" && r.items.some((x) => x.asset === "ch02_focus_ship_mast_thought_v01")))
      throw new Error("第二章船桅思想實驗缺少明確標為待驗預測的想像畫面");
    if (!rules.some((r) => r.scene === "CE-1" && r.items.some((x) => x.asset === "ch03_focus_two_books_1642_v01")))
      throw new Error("第三章兩本書與死訊場景缺少敘事特寫");
    if (!rules.some((r) => r.scene === "CE-2" && r.items.some((x) => x.asset === "ch03_focus_unfinished_arc_to_moon_v01")))
      throw new Error("第三章末頁缺少未完成弧線交棒第四章的想像畫面");
    const f3 = assets.entries.find((e) => e.id === "card_F3");
    if (!f3 || f3.kind !== "card" || f3.path !== "ch02/cards/card_F3.webp" || f3.w !== 1200 || f3.h !== 750)
      throw new Error("F3 一拋一放證據圖資產宣告缺失");
    if (!existsSync(path.join(here, "../../public/assets/", f3.path))) throw new Error("F3 證據圖檔不存在");
    for (const match of ["高層最後落下", "如果它要等推力用完才下墜"])
      if (!rules.some((r) => r.scene === "B2-4" && r.match === match && r.items.some((x) => x.asset === "card_F3")))
        throw new Error("F3 判讀／回述缺專用圖:" + match);
    const viewRules = assets.viewFocusVisual || [];
    const mechanismView = viewRules.find((r) => r.scene === "B2-4" && r.match === "機關:桌緣一座小門閂");
    const resultView = viewRules.find((r) => r.scene === "B2-4" && r.match === "高層最後落下");
    if (mechanismView || rules.some((r) => r.scene === "B2-4" &&
        r.items.some((item) => item.asset === "workshop2_projectile_apparatus_master")))
      throw new Error("B2-4 預判前仍展示錯誤的 F2 斜槽彈射台");
    if (!resultView || ["q4", "nb1", "n3"].some((id) => !resultView.nodeIds.includes(id)))
      throw new Error("B2-4 第三列判讀與回述未持續展示 F3 結果圖");
    if (viewRules.some((r) => r.scene === "B2-4" &&
        (r.nodeIds || []).some((id) => ["q1", "q2", "np1", "q3"].includes(id))))
      throw new Error("B2-4 尚未顯示第三列前就擺出已畫入軌跡答案的 F3 圖");
    const pendingWall = rules.find((r) => r.scene === "B2-5" && r.match === "牆上:墨跡板");
    const expectedWall = ["ch02_focus_ship_mast_thought_v01", "prop_inked_incline_board",
      "workshop2_projectile_apparatus_master", "card_F3"];
    if (!pendingWall || pendingWall.items.length !== 4 ||
        expectedWall.some((asset) => !pendingWall.items.some((item) => item.asset === asset)))
      throw new Error("B2-5 證據牆不是三份完成紀錄＋一張船桅待驗預測");
    for (const vr of viewRules) {
      const source = rules.find((r) => r.scene === vr.scene && r.match === vr.match);
      if (!source) throw new Error("互動節點特寫找不到單一來源:" + vr.scene + "→" + vr.match);
      for (const nodeId of vr.nodeIds || []) {
        if (!byScene.get(vr.scene).includes('"id":"' + nodeId + '"'))
          throw new Error("互動節點特寫指向不存在節點:" + vr.scene + "/" + nodeId);
      }
    }
    for (const r of rules) {
      if (!byScene.has(r.scene)) throw new Error("特寫規則指向不存在場景:" + r.scene);
      if (!r.match || !byScene.get(r.scene).includes(r.match))
        throw new Error("特寫 match 不在指定場景文本:" + r.scene + "→" + r.match);
      if (!r.caption || !(r.items || []).length) throw new Error("特寫缺 caption/items:" + r.scene);
      for (const item of r.items) {
        if (item.asset && !ids.has(item.asset)) throw new Error("特寫指向不存在資產:" + item.asset);
        if (!item.asset && item.evidence !== "E2") throw new Error("特寫 item 缺合法 asset/evidence:" + r.scene);
        if (!item.alt) throw new Error("特寫圖片缺替代文字:" + (item.asset || item.evidence));
      }
    }
    const html = readFileSync(path.join(here, "../stage.html"), "utf-8");
    for (const frag of ['id="sceneFocus"', 'id="sceneFocusMedia"', 'id="sceneFocusCaption"',
      "#sceneFocus.quad", "(orientation:portrait) and (pointer:coarse)"])
      if (!html.includes(frag)) throw new Error("舞台特寫 DOM/CSS 缺失:" + frag);
    const sui = readFileSync(path.join(here, "../src/stage-ui.js"), "utf-8");
    for (const frag of ["showFocusVisualForLine", "showFocusVisualForView", "clearFocusVisual", "lineFocusVisual", "viewFocusVisual", "e2DiagramMarkup",
      "mountE2FocusVisual", "scene-focus-e2-art", "拖慢大石？", "合在一起更快？", "r.scene !== sid"])
      if (!sui.includes(frag)) throw new Error("舞台特寫接線/預載缺失:" + frag);
    if (!html.includes(".scene-focus-e2-art") || !html.includes(".e2-argument-arrows"))
      throw new Error("E2 生圖底板的精確語意疊層樣式缺失");
    const chapterUi = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
    if (!chapterUi.includes('dataset.items = JSON.stringify(evidenceItems)'))
      throw new Error("筆記本證據缺結構化 code/name 接口");
    if (!sui.includes('JSON.parse($("evidenceList").dataset.items || "[]")') ||
        sui.includes('var code = item.split(" ")[0]'))
      throw new Error("筆記本仍從顯示名稱猜證據 ID，專圖會退回空白模板");
    if (!sui.includes("showFocusVisualForLine(item.text, item.scene)") ||
        sui.includes("showFocusVisualForLine(d.text);"))
      throw new Error("證據特寫未綁定實際台詞開演時刻");
  }
});

tests.push({
  name: "第二章正式背景|七組專屬場景＋跨章 SC-R1 優先鍵(GB-ADR-023)",
  fn: () => {
    const assets = JSON.parse(readFileSync(path.join(here, "../data/assets.json"), "utf-8"));
    const ids = new Map(assets.entries.map((e) => [e.id, e]));
    const expected = {
      "B1-1": "bg_ch02_workshop_theory_rain_night",
      "B1-2": "bg_ch02_workshop_theory_rain_night",
      "B1-4": "bg_ch02_canal_dusk_1608",
      "B2-1": "bg_ch02_ink_experiment_workshop",
      "B2-2": "bg_ch02_ink_experiment_workshop",
      "B2-3": "bg_ch02_projectile_workshop",
      "B2-4": "bg_ch02_projectile_workshop",
      "B2-5": "bg_ch02_evidence_wall_night",
      "B3-1": "bg_ch02_lecture_hall_1608",
      "B3-D": "bg_ch02_lecture_hall_1608",
      "B3-F": "bg_ch02_evidence_wall_night",
      "B3-6": "bg_ch02_lecture_hall_1608",
      "BE-1": "bg_ch02_canal_dusk_1608",
      "BE-2": "bg_ch02_moon_golf_1971",
      "ch2:SC-R1": "bg_ch02_projectile_workshop"
    };
    for (const [scene, id] of Object.entries(expected)) {
      if (assets.sceneBg[scene] !== id) throw new Error("第二章背景映射錯誤:" + scene + "→" + assets.sceneBg[scene]);
      const e = ids.get(id);
      if (!e || !e.path || !e.path.startsWith("ch02/backgrounds/")) throw new Error("第二章背景未落在章別目錄:" + id);
      if (e.w !== 1920 || e.h !== 1080) throw new Error("第二章背景尺寸宣告錯誤:" + id);
    }
    if (assets.sceneBg["B0-1"] !== "bg_workshop_padua" || assets.sceneBg["B0-2"] !== "bg_workshop_padua")
      throw new Error("B0 重返同一工作室的空間連續性被破壞");
    const stageSource = readFileSync(path.join(here, "../src/stage/02-scene.part.js"), "utf-8");
    const greySource = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
    for (const source of [stageSource, greySource])
      if (!source.includes('CHAPTER_ID + ":" + sceneId')) throw new Error("跨章同名場景未優先解析 chapter:scene");
  }
});

tests.push({
  name: "第三章資料鏡像與敘事圖|10 場主線＋1 修復場、223 節點、活躍圖全可達、舊游標相容",
  fn: () => {
    const sj = JSON.parse(readFileSync(path.join(here, "../data/scenes3.json"), "utf-8"));
    const hj = JSON.parse(readFileSync(path.join(here, "../data/histfacts3.json"), "utf-8"));
    const hs = require("../data/histfacts3.js");
    if (JSON.stringify(scenes3) !== JSON.stringify(sj)) throw new Error("scenes3 鏡像漂移");
    if (JSON.stringify(hs) !== JSON.stringify(hj)) throw new Error("histfacts3 鏡像漂移");
    if (scenes3.title !== "船艙裡的靜止") throw new Error("第三章正式章名漂移");
    if (!JSON.stringify(scenes3).includes("船艙裡的靜止")) throw new Error("第三章題名選項未同步");
    if (scenes3.scenes.length !== 11 ||
        scenes3.scenes.filter((scene) => scene.id !== "SC3-R1").length !== 10)
      throw new Error("第三章應為 10 場主線＋1 個信譽修復場");
    const allNodes = scenes3.scenes.reduce((sum, scene) => sum + scene.nodes.length, 0);
    if (allNodes !== 223) throw new Error("第三章節點數不是 223，實得:" + allNodes);
    if (new Set(scenes3.scenes.map((s) => s.id)).size !== scenes3.scenes.length)
      throw new Error("第三章場景 id 重複");
    for (const s of scenes3.scenes) {
      const nodeIds = s.nodes.map((n) => n.id);
      if (new Set(nodeIds).size !== nodeIds.length) throw new Error("第三章節點 id 重複:" + s.id);
      for (const n of s.nodes) {
        const optionIds = (n.options || []).map((o) => o.id);
        if (new Set(optionIds).size !== optionIds.length) throw new Error("第三章選項 id 重複:" + s.id + "/" + n.id);
      }
    }
    const sm = new Map(scenes3.scenes.map((s) => [s.id, new Set(s.nodes.map((n) => n.id))]));
    for (const s of scenes3.scenes) for (const n of s.nodes) {
      if (n.next && !sm.get(s.id).has(n.next)) throw new Error("next 不存在:" + s.id + "/" + n.id + "→" + n.next);
      if (n.scene && !sm.has(n.scene)) throw new Error("goto 場景不存在:" + n.scene);
      for (const o of n.options || []) if (!sm.get(s.id).has(o.next)) throw new Error("option.next 不存在:" + s.id + "/" + o.id);
    }
    const sceneDefs = new Map(scenes3.scenes.map((scene) => [scene.id, scene]));
    const visited = new Set();
    const pending = [
      [scenes3.startScene, sceneDefs.get(scenes3.startScene)?.nodes[0]?.id],
      ["SC3-R1", sceneDefs.get("SC3-R1")?.nodes[0]?.id]
    ];
    while (pending.length) {
      const [sceneId, nodeId] = pending.shift();
      const key = sceneId + "/" + nodeId;
      if (!nodeId || visited.has(key)) continue;
      visited.add(key);
      const scene = sceneDefs.get(sceneId);
      const node = scene?.nodes.find((item) => item.id === nodeId);
      if (!node) throw new Error("可達性走查遇到不存在節點:" + key);
      if (node.next) pending.push([sceneId, node.next]);
      for (const option of node.options || []) pending.push([sceneId, option.next]);
      if (node.scene) pending.push([node.scene, sceneDefs.get(node.scene)?.nodes[0]?.id]);
    }
    const activeNodes = scenes3.scenes.flatMap((scene) =>
      scene.nodes.filter((node) => !node.legacyOnly)
        .map((node) => scene.id + "/" + node.id));
    const unreachableActive = activeNodes.filter((key) => !visited.has(key));
    if (unreachableActive.length)
      throw new Error("第三章仍有不可達的活躍節點:" + unreachableActive.join("、"));
    const legacyNodes = scenes3.scenes.flatMap((scene) =>
      scene.nodes.filter((node) => node.legacyOnly)
        .map((node) => scene.id + "/" + node.id));
    if (legacyNodes.length !== 29)
      throw new Error("第三章 legacyOnly 節點應保留 29 個舊游標，實得:" + legacyNodes.length);
    const reachedLegacy = legacyNodes.filter((key) => visited.has(key));
    if (reachedLegacy.length)
      throw new Error("第三章新流程仍會進入 legacyOnly 節點:" + reachedLegacy.join("、"));
    /* 2026-07-28 前最後一個可由 Git 追溯的 8 場／71 游標清單。
       展開只插新節點；每一個舊 scene+node 都須能被 v1 載入、淨化並顯示。 */
    const legacyCursors = {
      "C0-1": "n1,n1b,n2,n3,n4,n5,n6,s1,g1",
      "C0-2": "n1,n2,n3,n4,n5,n6,n7,n8,n9,n10,n11,n12,n12b,n13,g1",
      "C0-3": "n1,c1,a1,f1,f2,n2,n3,g1",
      "C1-1": "n1,n2,n3,n4,n5,e1,g1",
      "C3-1": "n1,n2,n3,n4,n5,n6,n7,n8,n9,g1",
      "C3-2": "n1,c1,s1,g1",
      "CE-1": "n1,n2,n3,n4,n5,n6,g1",
      "CE-2": "n1,n2,t1,t2,t3,r1,n3,n4,h1,s1,end"
    };
    const legacyCount = Object.values(legacyCursors)
      .reduce((sum, ids) => sum + ids.split(",").length, 0);
    if (legacyCount !== 71) throw new Error("第三章舊游標 fixture 數量漂移:" + legacyCount);
    const N3 = Narrative._factory(scenes3, Engine3, {});
    const San = require("../src/sanitize.js");
    for (const [sceneId, ids] of Object.entries(legacyCursors)) for (const nodeId of ids.split(",")) {
      const state = N3.initialState("explore");
      state.cursor = { scene: sceneId, node: nodeId };
      const clean = San.sanitizeImport3(state, scenes3);
      if (!clean.ok) throw new Error("第三章舊游標無法淨化:" + sceneId + "/" + nodeId);
      try { N3.view(clean.state); }
      catch (error) { throw new Error("第三章舊游標無法顯示:" + sceneId + "/" + nodeId + ":" + error.message); }
    }
    for (const key of legacyNodes) {
      const [sceneId, nodeId] = key.split("/");
      const state = N3.initialState("explore");
      state.cursor = { scene: sceneId, node: nodeId };
      const clean = San.sanitizeImport3(state, scenes3);
      if (!clean.ok) throw new Error("第三章 legacyOnly 游標無法淨化:" + key);
      try {
        N3.view(clean.state);
        const next = N3.advance(clean.state);
        if (next.error) throw new Error(next.error);
      } catch (error) {
        throw new Error("第三章 legacyOnly 游標無法續讀:" + key + ":" + error.message);
      }
    }
    const allowed = new Set(hs.labels);
    for (const row of hs.rows) if (!allowed.has(row.label)) throw new Error("第三章史實 label 越界:" + row.label);
  }
});

tests.push({
  name: "第三章三方台詞審查|不提前洩題、重試不代答、跨章引句與聲域媒介正確",
  fn: () => {
    const byId = (data, sceneId, nodeId) =>
      data.scenes.find((scene) => scene.id === sceneId)?.nodes.find((node) => node.id === nodeId);
    const activeText = (data) => data.scenes.flatMap((scene) => scene.nodes
      .filter((node) => !node.legacyOnly)
      .flatMap((node) => [node.text || "", node.hint || "",
        ...(node.options || []).map((option) => option.text || "")])).join("\n");
    const validate = (s3, s5) => {
      const xcard = byId(s3, "C0-1", "xcard")?.text || "";
      const steadyResultPattern = /落(?:在|到)?(?:桅(?:杆)?(?:腳|下|底)|原處)|(?:跟|隨)(?:著)?船(?:一起)?(?:走|前進)|不(?:會)?落(?:在)?後|沒有落後/;
      const experimentSceneIndex = s3.scenes.findIndex((scene) => scene.id === "C1-1");
      const preExperimentText = s3.scenes.slice(0, experimentSceneIndex)
        .flatMap((scene) => scene.nodes
          .filter((node) => !node.legacyOnly)
          .flatMap((node) => [node.text || "", node.hint || "",
            ...(node.options || []).map((option) => option.text || "")]))
        .join("\n");
      if (!xcard.includes("合理重建") || !xcard.includes("史實邊界") ||
          steadyResultPattern.test(preExperimentText))
        throw new Error("C1-1 實驗前的 active 節點或選項提前揭露平穩航行落石結果，或合理重建卡未交代史實邊界");

      const paperKeep = byId(s3, "C3-1", "x19")?.text || "";
      if (!paperKeep.includes("舊紙") || !paperKeep.includes("少了一欄") || !paperKeep.includes("不撕"))
        throw new Error("C3-1/x19 沒有明示正在保留哪張紙，仍可能讀成回應心聲");

      const namingLead = byId(s3, "C3-2", "x4")?.text || "";
      const namingChoice = byId(s3, "C3-2", "c1");
      if (/取對|答對|唯一/.test(namingLead) || !namingChoice || namingChoice.options.length !== 3 ||
          namingChoice.options.some((option) =>
            (option.effects || []).some((effect) => Object.prototype.hasOwnProperty.call(effect, "rep"))))
        throw new Error("C3-2 題名仍暗示唯一正解，或選項偷偷帶正誤分數");

      const closingClaim = byId(s3, "CE-1", "x18")?.text || "";
      if (!closingClaim.includes("這艘船") || !closingClaim.includes("量了一回") ||
          /量完|證明地球/.test(closingClaim))
        throw new Error("CE-1 章末把單船一次量測寫成完整結案");

      const ch1Spoken = TextFormat.normalizeZhPunctuation(byId(scenes, "P0-3", "n2")?.text || "");
      const ch3Memory = TextFormat.normalizeZhPunctuation(byId(s3, "CE-1", "x11")?.text || "");
      if (!ch1Spoken || !ch3Memory.includes(ch1Spoken))
        throw new Error("CE-1 回望沒有逐字引用第一章真正說出口的贈冊句");
      const ch1Inscription = TextFormat.normalizeZhPunctuation(byId(scenes, "P0-3", "n3")?.text || "")
        .match(/「([^」]+)」/)?.[1] || "";
      const ch3Inscription = TextFormat.normalizeZhPunctuation(byId(s3, "CE-2", "x4")?.text || "")
        .match(/「([^」]+)」/)?.[1] || "";
      if (!ch1Inscription || ch3Inscription !== ch1Inscription ||
          !TextFormat.normalizeZhPunctuation(activeText(s5)).includes(ch1Inscription))
        throw new Error("第三／五章首頁題字沒有回到第一章 canonical 原句");
      const activeSeriesText = [scenes, scenes2, s3, scenes4, s5].map(activeText).join("\n");
      if (activeSeriesText.includes("先別急著相信我"))
        throw new Error("全系列 active 正文仍把未曾說過的話記成伽利略原句");

      const ce2n2 = byId(s3, "CE-2", "n2");
      const ce2n3 = byId(s3, "CE-2", "n3");
      const ce2n4 = byId(s3, "CE-2", "n4");
      const ce2x3 = byId(s3, "CE-2", "x3")?.text || "";
      const ce2x5 = byId(s3, "CE-2", "x5")?.text || "";
      if (ce2n2?.speaker !== "旅人・心聲" || ce2n2?.osPurpose !== "naming" ||
          ce2n3?.next !== "n4" || ce2n4?.speaker !== "stage" ||
          !/^「.+」$/.test(ce2n4?.text || ""))
        throw new Error("CE-2 私人反思或親筆書寫仍被演成公開發言");
      if (!ce2x3.includes("首頁") || ce2x3.includes("空白頁") ||
          !ce2x5.includes("問題") || ce2x5.includes("我到現在都還沒有"))
        throw new Error("CE-2 換回真正題字後，相鄰心聲仍沿用捏造引句的舊指涉");

      const fakeOption = byId(s3, "C0-3", "c1")?.options?.find((option) => option.id === "fake")?.text || "";
      const retry1 = byId(s3, "C0-3", "f1")?.text || "";
      const retry2 = byId(s3, "C0-3", "f2")?.text || "";
      const retryReflection = byId(s3, "C0-3", "xf")?.text || "";
      const retryBundle = [fakeOption, retry1, retry2, retryReflection].join("\n");
      const disclosesR = /落在桅後/.test(retryBundle);
      const disclosesM = /船速[^。；\n]*(?:沒|未)[^。；\n]*記/.test(retryBundle);
      const disclosesS = /不能[^。；\n]*代表|別的船況|每一趟|條件[^。；\n]*(?:沒|未)[^。；\n]*全|能說(?:的)?就少/.test(retryBundle);
      const redirectsToInspection = /(?:再|重新)[^。；\n]*(?:看|查)|欄位|空白/.test(retry2);
      if (!retry1.includes("紙上原來就有") || (disclosesR && disclosesM && disclosesS) || !redirectsToInspection)
        throw new Error("C0-3 重試回饋替玩家完成了『不能代表別的船況』的推論");

      for (const [sceneId, nodeId] of [["C0-3", "xok"], ["C0-3", "x7"], ["C0-3", "a1"], ["SC3-R1", "w2"]])
        if ((byId(s3, sceneId, nodeId)?.text || "").includes("答案"))
          throw new Error(sceneId + "/" + nodeId + " 仍以『答案』替未經證據的主張背書");
      if (!byId(s3, "C0-2", "x3")?.text?.endsWith("？"))
        throw new Error("C0-2/x3 明確問句未使用問號");
      const archiveLine = byId(s3, "C0-3", "n2")?.text || "";
      if (!archiveLine.includes("落在桅後") || !archiveLine.includes("船速沒記") || archiveLine.includes("真實落後"))
        throw new Error("C0-3/n2 沒有區分紙上落點紀錄與未分類船況");
      const hint = byId(s3, "C1-1", "e1")?.hint || "";
      if (/設計並執行實驗|寫出斷言/.test(hint) ||
          !hint.includes("排好做法") || !hint.includes("原紙") || !hint.includes("缺口"))
        throw new Error("C1-1 工作台提示仍是教案語域，或缺少船務操作語意");
      const elapsed = byId(s3, "CE-1", "n6")?.text || "";
      if (!elapsed.includes("五十多年前") || /五十年前|五十二年前/.test(elapsed))
        throw new Error("CE-1 在缺少月日的情況下仍使用不可靠的精確年數");
      const seal = byId(s3, "CE-2", "s1")?.text || "";
      if (seal.includes("第三章") || !seal.includes("卷宗已封存"))
        throw new Error("CE-2 章末仍外洩製作端章節術語");
      const dialogueMemory = byId(s3, "INT-C2", "x7")?.text || "";
      if (dialogueMemory.includes("問他的是他自己") || !dialogueMemory.includes("八年前那本書") ||
          !dialogueMemory.includes("問答") || !dialogueMemory.includes("寫書的人"))
        throw new Error("INT-C2 仍要求玩家先知道《對話》的寫作結構");

      const script = readFileSync(
        path.join(here, "../../04_劇本/第三章台詞稿_v0.9_展開版_Claude_20260728.md"), "utf-8");
      const header = script.split("\n").slice(0, 14).join("\n");
      const allNodes = s3.scenes.flatMap((scene) => scene.nodes);
      const activeCount = allNodes.filter((node) => !node.legacyOnly).length;
      const legacyCount = allNodes.filter((node) => node.legacyOnly).length;
      if (!header.includes(activeCount + " 個 active 節點") ||
          !header.includes(legacyCount + " 個 legacyOnly") ||
          !header.includes("總計 " + allNodes.length))
        throw new Error("第三章 v0.9 文件頭未由 canonical 實算現況節點帳");
    };

    validate(scenes3, scenes5);
    const expectMutationFail = (label, mutate) => {
      const s3 = JSON.parse(JSON.stringify(scenes3));
      const s5 = JSON.parse(JSON.stringify(scenes5));
      mutate(s3, s5);
      let failed = false;
      try { validate(s3, s5); } catch (error) { failed = true; }
      if (!failed) throw new Error("反向控制未轉紅:" + label);
    };
    expectMutationFail("合理重建卡提前寫出桅腳", (s3) => {
      byId(s3, "C0-1", "xcard").text += " 結果落在桅腳。";
    });
    expectMutationFail("實驗前選項提前寫出跟船一起走", (s3) => {
      byId(s3, "C0-3", "c1").options[0].text = "石頭會跟船一起走，不會落在後面。";
    });
    expectMutationFail("實驗前一般台詞提前寫出桅腳", (s3) => {
      byId(s3, "C0-2", "n1").text += " 結果會落在桅腳。";
    });
    expectMutationFail("重試句代替玩家縮限", (s3) => {
      byId(s3, "C0-3", "f2").text = "條件沒寫全，這張紙能說的就少；但它記下的落點還是真的。";
    });
    expectMutationFail("題名被誤寫成唯一正解", (s3) => {
      byId(s3, "C3-2", "x4").text += " 你只能一次取對。";
    });
    expectMutationFail("書寫句退回公開發言", (s3) => {
      byId(s3, "CE-2", "n4").speaker = "旅人(你)";
    });
    expectMutationFail("第三章重新捏造伽利略引句", (s3) => {
      byId(s3, "CE-2", "x4").text = "「先別急著相信我。」";
    });
    expectMutationFail("第五章再次沿用捏造引句", (_s3, s5) => {
      byId(s5, "EE-2", "x5").text = "那行褐掉的字還在：先別急著相信我。";
    });
    expectMutationFail("真正題字換回後仍稱空白頁", (s3) => {
      byId(s3, "CE-2", "x3").text = "旅人把筆記翻回最前面。空白頁上有一行褐掉的字。";
    });
    expectMutationFail("真正題字換回後仍沿用舊回答", (s3) => {
      byId(s3, "CE-2", "x5").text = "好。我到現在都還沒有。";
    });
  }
});

tests.push({
  name: "第三章重構契約|分段證據任務、斷言先行、船艙對照與三柱辯論",
  fn: () => {
    const ui2 = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
    const engine2 = readFileSync(path.join(here, "../src/engine3.js"), "utf-8");
    const stageUi2 = readFileSync(path.join(here, "../src/stage-ui.js"), "utf-8");
    const stageHtml2 = readFileSync(path.join(here, "../stage.html"), "utf-8");
    const script2 = readFileSync(path.join(here, "../../04_劇本/第三章劇本_v0.7_自由實驗與碼頭辯論_Sol_20260726.md"), "utf-8");
    const visible2 = JSON.stringify(scenes3);
    const phases2 = scenes3.scenes.flatMap((s) => s.nodes.filter((n) => n.type === "embed").map((n) => n.phase));
    if (JSON.stringify(phases2) !== JSON.stringify(["dossier"]))
      throw new Error("第三章應只用一個可往返的卷宗工作面，實得:" + phases2.join(","));
    for (const action of ["setDossierDraft", "runDossierSeries", "setDossierSourceGroup",
      "setDossierProposedScope", "setDossierScope", "commitDossierCabinWindPlan",
      "commitDossierCabinInstrument", "runDossierCabinSeries", "enterDossierDebate", "leaveDossierDebate",
      "selectDossierPillar", "answerDossierDebate", "setDossierP3Premise",
      "alignDossierPapers", "transformDossierPapers", "transformDossierPaperBeat",
      "setDossierFinalBoundary"])
      if (!ui2.includes(action) || !engine2.includes("function " + action))
        throw new Error("第三章重構動作未接通 UI／引擎:" + action);
    for (const phrase of [
      "讓原紙替斷言說話",
      "重複系列會一次執行、逐回留下三張原紙。",
      "每一輪先把可能的斷言攤開。選一句，再勾能支撐它的原紙",
      "把這輪可能的主張攤開",
      "先選一句你打算成立的話。下一步再到原紙資料簿",
      "每組仍可展開核對三張原紙",
      "先踏查船艙：這輪用哪一樣留下痕跡？",
      "讓水滴落進碗，或把石球直直拋起",
      "原紙、斷言和已答完的柱都會保留",
      "每柱只做會改變推論的事：選紙、收邊界，或親手換算",
      "辯論備忘",
      "查看條件與原紙",
      "每拍扣掉桅杆當拍的位置",
      "逐拍換尺紙",
      "把這一拍寫到換尺紙"
    ]) if (!visible2.includes(phrase) && !ui2.includes(phrase))
      throw new Error("第三章重構缺少可見因果:" + phrase);
    for (const memo of [
      "旅人筆記・碼頭辯論備忘",
      "三問不是三次小考",
      "這一頁怎麼做？",
      "旅人筆記・兩本帳辯論備忘"
    ]) if (!stageUi2.includes(memo))
      throw new Error("章別備忘未進生成舞台:" + memo);
    if (!visible2.includes("維達爾船長留在踏板外") || !visible2.includes("我留在岸上，也不先看結果"))
      throw new Error("維達爾船長留岸、避免替自己作證的動機未進 runtime");
    if (!visible2.includes("這張紙缺的那一欄，明天我們可以真的記出來") ||
        !visible2.includes("先把你說的那一欄真的記出來"))
      throw new Error("旅人沒有在取得實驗權前先提出可檢驗的記錄方法");
    const activeDebateUi = ui2.slice(
      ui2.indexOf("function renderShipDossierDebate(work, d)"),
      ui2.indexOf("function renderShipDossier(v, box)")
    );
    for (const repeatedQuiz of [
      "石頭會自己追著往前的桅杆",
      "只有風一直往前推，石頭才會繼續前進",
      "舊紙缺少哪一個關鍵條件？",
      "看岸標間距：這張紙記的是哪種船況？",
      "兩張紙要比，第一步得先確定什麼？"
    ]) if (activeDebateUi.includes(repeatedQuiz))
      throw new Error("第三章碼頭仍重考實驗簿已支付的概念:" + repeatedQuiz);
    if (!visible2.includes("不設木籌") || ui2.includes("先擺木籌"))
      throw new Error("已刪除的木籌承諾仍殘留在玩家流程");
    const dossierUi = ui2.slice(ui2.indexOf("function renderShipDossier"));
    if (dossierUi.includes("解纜後變快") || dossierUi.includes("收槳後變慢"))
      throw new Error("純操作名又在看結果前洩漏船速分類");
    const doShipUi = ui2.slice(ui2.indexOf("function doShip"), ui2.indexOf("function ship3Mission"));
    const pendingRunUi = ui2.slice(ui2.indexOf("function renderShipDossierPending"),
      ui2.indexOf("function ship3DossierPlacePreview"));
    if (!doShipUi.includes('(action === "runDossierExperiment" || action === "runDossierSeries") && !r.error') ||
        !doShipUi.includes(': ".shipDossierRunStage"') ||
        !doShipUi.includes('".shipDossierSeriesResult .shipDossierRunStage"') ||
        !doShipUi.includes("nextWork.scrollTop += runRect.top - workRect.top") ||
        !doShipUi.includes('action === "fileDossierRecord" && !r.error') ||
        !doShipUi.includes("ship3DossierPendingReturnTop") ||
        !doShipUi.includes('[data-ship-focus="run-deck-record"]:not(:disabled)') ||
        !doShipUi.includes("else if (preserveDossierScroll)") ||
        !pendingRunUi.includes("ship3DossierRunAnimation(work, record)"))
      throw new Error("甲板實驗沒有完成「執行→看動畫→收卷→回到下一回」捲動迴圈");
    const seriesReplayUi = ui2.slice(ui2.indexOf("function renderShipDossierLastSeries"),
      ui2.indexOf("function ship3DossierPlacePreview"));
    const dossierLabUi = ui2.slice(ui2.indexOf("function renderShipDossierLab"),
      ui2.indexOf("function renderShipDossierEvidenceChoices"));
    const candidateBeforeLedger = dossierLabUi.indexOf("renderShipDossierCandidates(notebookPage") <
      dossierLabUi.indexOf("renderShipDossierLedger(notebookPage, d, currentAssertion)");
    if (!candidateBeforeLedger || !ui2.includes('doShip("setDossierProposedScope"') ||
        !ui2.includes('doShip("setDossierSourceGroup"') ||
        !ui2.includes('doShip("setDossierScope"'))
      throw new Error("第三章斷言流程沒有落成「先選斷言→再選原紙→最後提交」");
    if (!doShipUi.includes('action === "runDossierSeries" &&') ||
        !doShipUi.includes('missionBefore === "dual" && missionAfter === "explore"') ||
        !doShipUi.includes("ship3PendingMissionBridge = { from: missionBefore, to: missionAfter }") ||
        !seriesReplayUi.includes("看完動畫，收好兩張紙") ||
        !seriesReplayUi.includes('ship3OpenIntermission("ch3-dual-complete"') ||
        !seriesReplayUi.includes("ship3SayMissionBridge(bridge.from, bridge.to)") ||
        !dossierLabUi.includes('if (mission.id === "explore" && !ship3PendingMissionBridge)') ||
        !dossierLabUi.includes("!canDebate || !!d.pendingRecord || !!ship3PendingMissionBridge"))
      throw new Error("雙視角完成後仍在動畫前搶播對話，或缺少看完動畫後的接縫按鈕");
    const assertionIntermissionUi = ui2.slice(
      ui2.indexOf("function ship3StartAssertionIntermission"),
      ui2.indexOf("function doShip"));
    for (const token of ["ch3-after-a1", "ch3-cabin-wind", "ch3-after-a2"])
      if (!assertionIntermissionUi.includes(token))
        throw new Error("斷言成立後缺少離台對話接縫:" + token);
    if (!doShipUi.includes("ship3StartAssertionIntermission(rr.assertion, missionBefore, missionAfter)") ||
        !assertionIntermissionUi.includes(
          'document.addEventListener("bd:workbench-intermission-choice"') ||
        !stageUi2.includes('document.addEventListener("bd:workbench-intermission"') ||
        !stageUi2.includes('new CustomEvent("bd:workbench-intermission-choice"') ||
        !stageUi2.includes("intermission: intermissionToken") ||
        !stageHtml2.includes('id="intermissionChoices"'))
      throw new Error("斷言後沒有完成「隱藏工作台→對話／研究決定→明確再入」三層契約");
    const embarkListenerUi = ui2.slice(
      ui2.indexOf('document.addEventListener("bd:embark"'),
      ui2.indexOf("function orbit4FocusKey"));
    if (!embarkListenerUi.includes('detail.intermission === "ch3-dual-complete"') ||
        !embarkListenerUi.includes('doShip("enterDossierDebate"'))
      throw new Error("雙視角動畫收卷後沒有等玩家按下舞台轉場才進碼頭辯論");
    if (!assertionIntermissionUi.includes('detail.token !== "ch3-cabin-wind"') ||
        !assertionIntermissionUi.includes('"ch3-after-wind-choice", "▸ 進入船艙實驗"'))
      throw new Error("排除甲板風的研究決定仍留在實驗面板，或選完後沒有再入船艙的明確操作");
    if ((ui2.match(/ship3ScrollToReplayAnimation\(\)/g) || []).length < 2 ||
        !seriesReplayUi.includes("function ship3ScrollToReplayAnimation"))
      throw new Error("工作台／旅人筆記的重播沒有重新定位到既有動畫");
    if (ui2.includes("執行補強實驗") || ui2.includes("選做補強"))
      throw new Error("不影響主線的補強實驗仍擋在雙視角與碼頭辯論之間");
    if (/if \(pendingReturnTop != null\)[^;]+;\s*else if \(nextRunButton\)/.test(doShipUi))
      throw new Error("收卷後只恢復舊捲動位置，沒有再確認下一回按鈕仍在可見範圍");
    for (const phrase of ["解纜起步", "收槳", "這六回都在封閉船艙裡做；停泊三回與平駛三回",
      "肯把『分不出來』寫下去"])
      if (!script2.includes(phrase) && !ui2.includes(phrase) && !engine2.includes(phrase))
        throw new Error("v0.7.1 對抗審修正未落地:" + phrase);
    /* 括號動作不是密度 KPI：鎖住「場面真的改變→有人回應→有人確認」，
       並確認核心體感會把玩家送回親手操作，而不是靠補括號湊比例。 */
    const causalBeats = [
      ["C0-2", ["x18", "n8"], ["把裝貨箱最底下那一層翻開", "以前也有人做過"]],
      ["C0-2", ["n9", "x21a", "x21b"], ["船當時是走穩、變快，還是變慢", "明天我們可以真的記出來", "先把你說的那一欄真的記出來"]],
      ["C1-1", ["x4", "x5", "x6"], ["碼頭在往後退", "什麼時候開的", "剛剛"]],
      ["INT-C2", ["x3", "x4", "x5"], ["沒有了", "沒有了", "我問完了"]],
      ["C3-1", ["x13", "x14", "x15"], ["洛朗・維達爾", "你辯到一半", "我沒有說謊"]],
      ["CE-1", ["x3", "x4", "x5"], ["門外有人送信", "阿爾切特里", "一月八號"]]
    ];
    for (const [sceneId, nodeIds, fragments] of causalBeats) {
      const scene = scenes3.scenes.find((item) => item.id === sceneId);
      const nodes = nodeIds.map((id) => scene?.nodes.find((item) => item.id === id));
      if (nodes.some((node) => !node)) throw new Error("動作因果節點遺失:" + sceneId);
      for (let i = 0; i < nodes.length - 1; i++)
        if (nodes[i].next !== nodes[i + 1].id)
          throw new Error("動作因果鏈斷裂:" + sceneId + "/" + nodes[i].id);
      fragments.forEach((fragment, index) => {
        if (!(nodes[index].text || "").includes(fragment))
          throw new Error("動作因果拍漂移:" + sceneId + "/" + nodeIds[index] + "/" + fragment);
      });
    }
    const embodied = scenes3.scenes.find((scene) => scene.id === "C1-1");
    if (embodied?.nodes.find((node) => node.id === "x12")?.next !== "e1" ||
        embodied?.nodes.find((node) => node.id === "e1")?.type !== "embed")
      throw new Error("玩家察覺船已開動後，沒有交回卷宗操作");
  }
});

tests.push({
  name: "第三章系列實驗|一鍵三回保留原紙、資料組選取、雙視角單事件與重播零狀態",
  fn: () => {
    let state = Engine3.initialState();
    const take = (result, label) => {
      if (!result || result.error || result.ok === false)
        throw new Error(label + ":" + (result && (result.error || result.reason) || "no-result"));
      state = result.state;
      return result;
    };
    const set = (field, value) =>
      take(Engine3.setDossierDraft(state, field, value), "set:" + field);

    set("release", "latch"); set("speedRecord", "beats"); set("positionRecord", "shore");
    const day0 = state.days;
    const reproduceBase = state;
    const reproduceInput = JSON.stringify(state);
    const reproduceResult = Engine3.runDossierSeries(state);
    if (JSON.stringify(reproduceBase) !== reproduceInput)
      throw new Error("系列 action 變異了輸入 state");
    const reproduce = take(reproduceResult, "reproduce-series");
    if (reproduce.count !== 3 ||
        JSON.stringify(reproduce.records.map((row) => row.id)) !== JSON.stringify([1,2,3]) ||
        reproduce.records.some((row) => !row.filed) ||
        state.caseFile.dossier.records.length !== 3 ||
        state.days - day0 !== reproduce.dayCost)
      throw new Error("起步系列沒有一次留下三張逐回原紙或正確計時");
    const steady = take(Engine3.runDossierSeries(state), "steady-series");
    if (steady.count !== 3 ||
        JSON.stringify(steady.records.map((row) => row.id)) !== JSON.stringify([4,5,6]))
      throw new Error("走穩系列沒有一次留下 R4–R6");
    take(Engine3.setDossierProposedScope(state, "A1", "controlled-three"), "A1-propose");
    take(Engine3.setDossierSourceGroup(
      state, "A1", ["R4","R5","R6"], true
    ), "A1-group");
    if (JSON.stringify(state.caseFile.dossier.claimSelections.A1) !==
        JSON.stringify(["R4","R5","R6"]))
      throw new Error("資料組勾選沒有保留三張可追溯原紙");
    take(Engine3.setDossierScope(state, "A1", "controlled-three"), "A1");
    take(Engine3.setDossierProposedScope(state, "A3", "today-comparison"), "A3-propose");
    take(Engine3.setDossierSourceGroup(
      state, "A3", ["R1","R2","R3","R4","R5","R6"], true
    ), "A3-group");
    take(Engine3.setDossierScope(state, "A3", "today-comparison"), "A3");

    set("stage", "dock");
    const unplannedCabin = Engine3.runDossierCabinSeries(state);
    if (unplannedCabin.error !== "cabin-wind-plan-required")
      throw new Error("新流程沒有先要求玩家決定如何隔開甲板風");
    const rejectedWindPlan = Engine3.commitDossierCabinWindPlan(state, "wait-calm");
    if (rejectedWindPlan.error || rejectedWindPlan.ok !== false ||
        rejectedWindPlan.state.caseFile.dossier.designCommitments.cabinWind ||
        rejectedWindPlan.state.caseFile.dossier.designCommitments.cabinWindAttempts.length !== 1)
      throw new Error("不量風只等無風日，竟被當成已排除變因");
    state = rejectedWindPlan.state;
    take(Engine3.commitDossierCabinWindPlan(state, "close-cabin"), "cabin-wind-plan");
    const unselectedInstrument = Engine3.runDossierCabinSeries(state);
    if (unselectedInstrument.error !== "cabin-instrument-required")
      throw new Error("進船艙後沒有要求重新踏查並選定艙內器材");
    take(Engine3.commitDossierCabinInstrument(state, "drip"), "cabin-instrument");
    const dock = take(Engine3.runDossierCabinSeries(state), "cabin-dock-series");
    if (dock.count !== 3 || dock.records.map((row) => row.id).join(",") !== "C1,C2,C3" ||
        dock.records.some((row) => row.instrument !== "drip" ||
          row.water !== "水滴落在碗內標記附近" || row.ball !== "本輪未使用石球"))
      throw new Error("停泊船艙系列未一次留下三張");
    const duplicateDock = Engine3.runDossierCabinSeries(state);
    if (duplicateDock.error !== "dossier-cabin-series-complete")
      throw new Error("已完成的停泊三回仍可被無決策重按");
    set("stage", "steady");
    const cabinSteady = take(Engine3.runDossierCabinSeries(state), "cabin-steady-series");
    if (cabinSteady.count !== 3 ||
        cabinSteady.records.map((row) => row.id).join(",") !== "C4,C5,C6")
      throw new Error("平駛船艙系列未一次留下三張");
    take(Engine3.setDossierProposedScope(state, "A2", "local-only"), "A2-propose");
    take(Engine3.setDossierSourceGroup(
      state, "A2", ["C1","C2","C3","C4","C5","C6"], true
    ), "A2-group");
    take(Engine3.setDossierScope(state, "A2", "local-only"), "A2");

    take(Engine3.setDualDesign(state, CH3_DUAL_SETUP), "dual-design");
    const dual = take(Engine3.runDossierSeries(state), "dual-series");
    if (dual.count !== 1 || dual.records.length !== 1 || !dual.record.dualPapers)
      throw new Error("雙視角被錯做成三次事件，或沒有同時產生雙紙");
    let borrowState = JSON.parse(JSON.stringify(state));
    for (const [field, value] of [
      ["vesselId", "small"], ["stage", "steady"], ["release", "latch"],
      ["speedRecord", "beats"], ["positionRecord", "shore"]
    ]) {
      const result = Engine3.setDossierDraft(borrowState, field, value);
      if (!result || result.error || result.ok === false)
        throw new Error("borrow-set:" + field + ":" +
          (result && (result.error || result.reason) || "no-result"));
      borrowState = result.state;
    }
    const borrowedSeries = Engine3.runDossierSeries(borrowState);
    if (!borrowedSeries || borrowedSeries.error || borrowedSeries.ok === false ||
        !borrowedSeries.borrowedNow || borrowedSeries.count !== 3 ||
        borrowedSeries.records.filter((row) => row.borrowDays > 0).length !== 1 ||
        borrowedSeries.records.reduce((sum, row) => sum + (row.borrowDays || 0), 0) !==
          borrowedSeries.dayCost - borrowedSeries.count)
      throw new Error("同一組三回沒有把借船成本只記在第一張原紙");
    const legacy = JSON.parse(JSON.stringify(state));
    delete legacy.caseFile.dossier.designCommitments;
    let legacyDebate = Engine3.enterDossierDebate(legacy);
    legacyDebate = Engine3.answerDossierDebate(legacyDebate.state, "p1", "source", "A1");
    legacyDebate = Engine3.answerDossierDebate(legacyDebate.state, "p1", "concept", "shared-motion");
    legacyDebate = Engine3.answerDossierDebate(legacyDebate.state, "p1", "cabin", "A2");
    if (legacyDebate.error || legacyDebate.state.caseFile.dossier.debate.pillars.p1 ||
        legacyDebate.state.caseFile.dossier.debate.current !== "p1")
      throw new Error("舊存檔沒有設計承諾，卻被系統代答風的主張範圍");
    take(Engine3.enterDossierDebate(state), "enter-new-debate");
    take(Engine3.answerDossierDebate(state, "p1", "source", "A1"), "p1-source-new");
    take(Engine3.answerDossierDebate(state, "p1", "concept", "shared-motion"), "p1-concept-new");
    take(Engine3.answerDossierDebate(state, "p1", "cabin", "A2"), "p1-cabin-new");
    if (!state.caseFile.dossier.debate.pillars.p1 ||
        state.caseFile.dossier.debate.current !== "p2")
      throw new Error("玩家已在實驗前公開限定風的主張，辯論仍重複問同一題");

    const ui = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
    if (!/!db\.p1\.wind\s*&&\s*!\(d\.designCommitments\s*&&\s*d\.designCommitments\.cabinWind\s*===\s*"close-cabin"\)/.test(ui))
      throw new Error("辯論 UI 沒有引用實驗前的風範圍承諾，可能重複收費");
    const notebook = readFileSync(path.join(here, "../src/stage/09-notebook.part.js"), "utf-8");
    const html = readFileSync(path.join(here, "../stage.html"), "utf-8");
    for (const contract of [
      "重播既有紀錄｜不新增實驗",
      'document.addEventListener("bd:notebook-snapshot"',
      "ship3SayAssertionBeat",
      "船長追問：外頭的風",
      "同一趟落石、同號鼓點",
      "重播屬工作台共用層"
    ]) if (!ui.includes(contract))
      throw new Error("系列實驗敘事／重播契約缺失:" + contract);
    const replayHook = ui.indexOf("重播屬工作台共用層");
    const speedBranch = ui.indexOf('if (mission.id === "speed")', replayHook);
    if (replayHook < 0 || speedBranch < 0 ||
        ui.indexOf("renderShipDossierLastSeries(work, d);", replayHook) > speedBranch)
      throw new Error("筆記重播仍被綁在單一任務分支，進到下一題後會無處呈現");
    if (!notebook.includes("bd:notebook-snapshot") || !notebook.includes("bd:notebook-close"))
      throw new Error("第三章原始紀錄未接進旅人筆記或無法返回重播");
    const replayBody = ui.slice(
      ui.indexOf("function renderShipDossierLastSeries"),
      ui.indexOf("function ship3DossierPlacePreview")
    );
    if (replayBody.includes("doShip(") || replayBody.includes("setState(") ||
        replayBody.includes("N.labAction"))
      throw new Error("重播路徑誤接到會改持久化 state 的 action");
    if (!/#sceneFocus \{[^}]*display: flex;[^}]*overflow: hidden;/s.test(html) ||
        !/#sceneFocusCaption \{[^}]*flex: 0 0 auto;/s.test(html))
      throw new Error("證據 focus 沒有把圖與 caption 約束在同一張卡內");

    /*
     * 反向會紅：把 dual 的 1 改成 3，或把一般系列的 3 改成 1，
     * 拿掉 row.borrowDays 的 i === 0 守衛，上面的逐回計時斷言會立即失敗；
     * 刪掉 notebook 事件橋、斷言對話或 focus containment，以下 source
     * contract 也會失敗。
     */
  }
});

tests.push({
  name: "全域信譽語意|第三章搶答扣分、縮限修復、每次變動說明原因",
  fn: () => {
    const assertBlurtContract = (data) => {
      const N3 = Narrative._factory(data, Engine3, {});
      let state = N3.initialState("explore");
      state.cursor = { scene: "C0-3", node: "c1" };
      const result = N3.choose(state, "all");
      if (result.error) throw new Error("搶答選項不可選:" + result.error);
      const event = result.state.eventLog.filter((item) => item.t === "rep").at(-1);
      if (result.state.rep !== 2)
        throw new Error("把未驗證答案當事實應使信譽 3→2，實得:" + result.state.rep);
      if (!event || event.reason !== "把還沒有原紙支持的答案當成事實")
        throw new Error("扣信譽事件沒有留下玩家可讀的原因");
      return { N3, state: result.state };
    };

    let branch = assertBlurtContract(scenes3);
    branch.state = branch.N3.advance(branch.state).state;
    branch.state = branch.N3.advance(branch.state).state;
    const retry = branch.N3.view(branch.state);
    if (retry.type !== "choice" ||
        retry.options.some((option) => option.id === "all") ||
        !retry.options.some((option) => option.id === "all_again"))
      throw new Error("搶答後沒有保留同一句選項，或仍可重複觸發扣分版本");
    const repeated = branch.N3.choose(branch.state, "all_again");
    if (repeated.error || repeated.state.rep !== 2)
      throw new Error("重看同一句應保留回應，但不得重複扣信譽");
    branch.state = branch.N3.advance(repeated.state).state;
    branch.state = branch.N3.advance(branch.state).state;
    const repaired = branch.N3.choose(branch.state, "bounded");
    if (repaired.error || repaired.state.rep !== 3)
      throw new Error("搶答後把話收回原紙範圍應使信譽 2→3");
    const repairEvent = repaired.state.eventLog.filter((item) => item.t === "rep").at(-1);
    if (!repairEvent || repairEvent.reason !== "主動把斷言收回到原紙能支持的範圍")
      throw new Error("修復信譽事件沒有留下原因");

    const directN3 = Narrative._factory(scenes3, Engine3, {});
    const direct = directN3.initialState("explore");
    direct.cursor = { scene: "C0-3", node: "c1" };
    const bounded = directN3.choose(direct, "bounded");
    if (bounded.error || bounded.state.rep !== 4)
      throw new Error("直接守住舊紙邊界應使信譽 3→4");

    const c03 = scenes3.scenes.find((scene) => scene.id === "C0-3");
    const c03Text = (nodeId) => c03.nodes.find((node) => node.id === nodeId)?.text || "";
    const causalBeats = [
      ["xok", ["自己以為知道的說法", "範圍很小"]],
      ["x7", ["沒有把一趟寫成每一趟", "沒有替空白填上自己以為的船況"]],
      ["x8", ["不是因為我知道答案", "沒有先把答案寫進去"]]
    ];
    for (const [nodeId, anchors] of causalBeats)
      if (anchors.some((anchor) => !c03Text(nodeId).includes(anchor)))
        throw new Error("旅人取得實驗權的因果缺拍:C0-3/" + nodeId);

    const narrativeSource = readFileSync(path.join(here, "../src/narrative.js"), "utf-8");
    const stageSource = readFileSync(path.join(here, "../src/stage-ui.js"), "utf-8");
    const stageHtml = readFileSync(path.join(here, "../stage.html"), "utf-8");
    if (!narrativeSource.includes("applyRep(state, e.rep, sourceId, e.reason)"))
      throw new Error("choice effect 的信譽理由沒有進事件簿");
    for (const phrase of ["data-rep-reason", "信譽 +", "人物正在根據你怎麼使用證據"])
      if (!stageSource.includes(phrase)) throw new Error("HUD 信譽逐次回饋缺少:" + phrase);
    if (!stageHtml.includes("猜錯與實驗失敗不扣"))
      throw new Error("HUD 沒有說清信譽不是答題血量");

    /* 負向控制：同一驗證器套到拔除 rep:-1 的資料，必須轉紅。 */
    const broken = JSON.parse(JSON.stringify(scenes3));
    const c1 = broken.scenes.find((scene) => scene.id === "C0-3")
      .nodes.find((node) => node.id === "c1");
    c1.options.find((option) => option.id === "all").effects =
      c1.options.find((option) => option.id === "all").effects
        .filter((effect) => !("rep" in effect));
    let reversedRed = false;
    try { assertBlurtContract(broken); }
    catch (_) { reversedRed = true; }
    if (!reversedRed) throw new Error("拔除搶答扣分後，信譽契約沒有反向轉紅");
  }
});

tests.push({
  name: "全系列信譽契約|研究誠實非答題分數、首次觸發、五章修復路由",
  fn: () => {
    const Engine2 = require("../src/engine2.js");
    const debate2 = require("../data/debate2.js");
    const chapterSets = [scenes, scenes2, scenes3, scenes4, scenes5];

    /* 所有資料層 rep 事件都要能回答「為什麼」，不能只噴一個數字。 */
    for (const data of chapterSets) for (const scene of data.scenes)
      for (const node of scene.nodes || []) {
        const carriers = [node, ...(node.options || [])];
        for (const carrier of carriers) for (const effect of carrier.effects || [])
          if ("rep" in effect && !(effect.reason || "").trim())
            throw new Error(data.chapter + "/" + scene.id + "/" +
              (node.id || "?") + " 的信譽變動沒有 reason");
      }
    const scanDebatePenaltyReasons = (value, label, trail = []) => {
      if (!value || typeof value !== "object") return;
      if (value.penalty && value.penalty.rep &&
          !(value.penalty.reason || "").trim())
        throw new Error(label + "/" + trail.join(".") +
          " 的辯論信譽變動沒有 reason");
      if (Array.isArray(value))
        value.forEach((item, index) =>
          scanDebatePenaltyReasons(item, label, trail.concat(index)));
      else
        Object.keys(value).forEach((key) =>
          scanDebatePenaltyReasons(value[key], label, trail.concat(key)));
    };
    scanDebatePenaltyReasons(debate, "ch1 debate");
    scanDebatePenaltyReasons(debate2, "ch2 debate");
    scanDebatePenaltyReasons(debate5, "ch5 debate");

    const nodeAt = (data, sceneId, nodeId) =>
      data.scenes.find((scene) => scene.id === sceneId)?.nodes
        .find((node) => node.id === nodeId);
    for (const [sceneId, nodeId] of [["P0-1", "nb2"], ["INT-1", "nb2"]])
      if ((nodeAt(scenes, sceneId, nodeId)?.effects || [])
        .some((effect) => "rep" in effect))
        throw new Error("第一章仍把答對感官題或記得主線當成研究誠實:" +
          sceneId + "/" + nodeId);

    /* 第二章越界只在第一次扣；重按仍有 NPC 回應，但不得刷到零。 */
    const N2 = Narrative._factory(scenes2, Engine2, debate2);
    const ch2Base = N2.initialState("explore");
    ch2Base.cursor = { scene:"B0-2", node:"q1" };
    const ch2First = N2.choose(ch2Base, "a");
    if (ch2First.error || ch2First.state.rep !== 2 ||
        ch2First.state.eventLog.filter((event) => event.t === "rep").at(-1)?.reason !==
          "尚未檢查砲術圖就宣稱舊規律一定管得到飛行")
      throw new Error("第二章首次越界沒有留下正確的信譽後果");
    const ch2Retry = N2.advance(ch2First.state);
    const ch2Again = N2.choose(ch2Retry.state, "a-again");
    if (ch2Again.error || ch2Again.state.rep !== 2)
      throw new Error("第二章同一句越界仍可重複扣信譽");
    const f3BoundaryBase = N2.initialState("explore");
    f3BoundaryBase.cursor = { scene:"B2-4", node:"q4" };
    const f3Boundary = N2.choose(f3BoundaryBase, "b");
    const f3BoundaryBack = N2.advance(f3Boundary.state);
    const f3BoundaryAgain = N2.choose(f3BoundaryBack.state, "b_again");
    if (f3Boundary.error || f3BoundaryAgain.error || f3Boundary.state.rep !== 2 ||
        f3BoundaryAgain.state.rep !== 2 ||
        f3Boundary.state.eventLog.filter((event) => event.t === "rep").at(-1)?.reason !==
          "三列都只記下兩聲分不開，仍把沒有測得的延遲寫成結果")
      throw new Error("第二章 F3 補寫未測延遲不是一次性信譽事件");
    const sealBoundaryBase = N2.initialState("explore");
    sealBoundaryBase.cursor = { scene:"B2-5", node:"q2" };
    const sealBoundary = N2.choose(sealBoundaryBase, "b");
    const sealBoundaryBack = N2.advance(sealBoundary.state);
    const sealBoundaryAgain = N2.choose(sealBoundaryBack.state, "b_again");
    if (sealBoundary.error || sealBoundaryAgain.error || sealBoundary.state.rep !== 2 ||
        sealBoundaryAgain.state.rep !== 2 ||
        sealBoundary.state.eventLog.filter((event) => event.t === "rep").at(-1)?.reason !==
          "把尚未出航的船桅預測寫成已由桌上實驗完成")
      throw new Error("第二章把待驗紙封成已完成不是一次性信譽事件");

    /* 算錯、預測錯不扣；只有來源／署名／邊界越界才回傳 repDelta。 */
    const tangentWrong = Engine4.sealTangentPrediction(Engine4.initialState(), "arc");
    if ("repDelta" in tangentWrong)
      throw new Error("第四章物理預測錯誤被誤當成失信");
    let hookeBase = Engine4.initialState();
    hookeBase.evidence.k4 = true;
    const hookeWrong = Engine4.setHookeScope(hookeBase, "hookeComplete");
    const hookeRepeat = Engine4.setHookeScope(hookeWrong.state, "hookeComplete");
    if (hookeWrong.repDelta !== -1 || !hookeWrong.repReason ||
        "repDelta" in hookeRepeat)
      throw new Error("虎克來源越界不是首次扣，或缺 reason");
    const boundaryWrong = Engine4.setBoundary(hookeRepeat.state, "mechanismSolved");
    const boundaryRepeat = Engine4.setBoundary(boundaryWrong.state, "mechanismSolved");
    if (boundaryWrong.repDelta !== -1 || !boundaryWrong.repReason ||
        "repDelta" in boundaryRepeat)
      throw new Error("第四章機制越界不是首次扣，或缺 reason");
    const authorBase = Engine4.initialState();
    authorBase.proof.hookeScope = "precise-scope";
    authorBase.proof.shellPagePlaced = true;
    const authorExit = Engine4.removeTravelerFromAuthorField(authorBase);
    const authorRepeat = Engine4.removeTravelerFromAuthorField(authorExit.state);
    if (authorExit.repDelta !== 1 || !authorExit.repReason ||
        "repDelta" in authorRepeat)
      throw new Error("旅人退出作者欄不是只獎勵第一次");
    const hookeErasure = Engine4.setHookeScope(hookeBase, "newtonAlone");
    const boundaryBase = Engine4.initialState();
    boundaryBase.evidence.k4 = true;
    const creditErasure = Engine4.setBoundary(boundaryBase, "newtonAlone");
    const exactEngine4Reasons = [
      ["退出作者欄", authorExit, 1,
        "主動退出沒有完成之作品的作者欄，沒有把參與操作冒充成作者身分"],
      ["虎克過度署名", hookeWrong, -1,
        "把虎克的一封信擴張成整套證明，超過來源能支持的範圍"],
      ["虎克來源抹除", hookeErasure, -1,
        "把虎克已留下的問題方向從來源線抹去"],
      ["作用機制過度", boundaryWrong, -1,
        "把這批資料沒有量到的作用機制寫成已經證明"],
      ["牛頓單獨完成", creditErasure, -1,
        "把多人留下的概念、觀測與出版來源改寫成牛頓一人完成"]
    ];
    exactEngine4Reasons.forEach(([label, result, delta, reason]) => {
      if (result.repDelta !== delta || result.repReason !== reason)
        throw new Error(label + " 的信譽方向或玩家可讀理由漂移");
    });

    /* 辯論層的信譽事件也必須有理由，且同一越界只能承擔一次全域後果。 */
    const futurePenalty = debate.chapter.pillars.P2.statements
      .find((statement) => statement.id === "p2s3")
      .pressChoice.options.find((option) => option.id === "a").penalty;
    const liedPenalty = debate.chapter.fr.trap.options
      .find((option) => option.id === "lied").penalty;
    for (const [label, penalty] of [
      ["第一章未來權威", futurePenalty],
      ["第一章偽稱量過垂直", liedPenalty]
    ]) if (!(penalty.reason || "").trim())
      throw new Error(label + " 的辯論信譽後果沒有玩家可讀理由");

    const pressBase = Narrative.initialState("explore");
    pressBase.debate = {
      persuasion:5, idx:1,
      pillars:{ P1:{broken:true,s:{}}, P2:{broken:false,s:{p2s3:"pressed"}},
        P3:{broken:false,s:{}} },
      p3NeedFlag:false, pressChoice:{sid:"p2s3"},
      fr:{opened:false,step:0,slots:[],trapPending:false,resolved:false},
      firstMissUsed:false, status:"pending", mistakes:[]
    };
    const pressOnce = Narrative.debatePressChoice(pressBase, "a");
    const pressTwice = Narrative.debatePressChoice(pressOnce.state, "a");
    if (pressOnce.state.rep !== 2 || pressTwice.state.rep !== 2 ||
        pressTwice.state.eventLog.filter((event) =>
          event.t === "rep" && event.at === "debate.pressChoice.a").length !== 1 ||
        pressOnce.state.eventLog.filter((event) =>
          event.t === "rep").at(-1)?.reason !== futurePenalty.reason)
      throw new Error("第一章未來權威同一句仍可刷扣，或 reason 沒有進事件簿");

    const trapBase = Narrative.initialState("explore");
    trapBase.lab.evidence.e3.c = true;
    trapBase.debate = {
      persuasion:5, idx:3,
      pillars:{ P1:{broken:true,s:{}}, P2:{broken:true,s:{}},
        P3:{broken:true,s:{}} },
      p3NeedFlag:false, pressChoice:null,
      fr:{opened:true,step:2,slots:[],trapPending:true,resolved:false},
      firstMissUsed:false, status:"pending", mistakes:[]
    };
    const liedOnce = Narrative.debateFr(trapBase, "lied");
    const liedTwice = Narrative.debateFr(liedOnce.state, "lied");
    if (liedOnce.state.rep !== 2 || liedTwice.state.rep !== 2 ||
        liedTwice.state.eventLog.filter((event) =>
          event.t === "rep" && event.at === "debate.trap.lied").length !== 1 ||
        liedOnce.state.eventLog.filter((event) =>
          event.t === "rep").at(-1)?.reason !== liedPenalty.reason)
      throw new Error("第一章偽稱量過垂直仍可刷扣，或 reason 沒有進事件簿");

    const arrangeBase = N2.initialState("explore");
    for (const id of ["F1", "F2", "F3", "F4"]) arrangeBase.evidence[id] = true;
    arrangeBase.debate = {
      persuasion:5, idx:3,
      pillars:{ P1:{broken:true,s:{}}, P2:{broken:true,s:{}},
        P3:{broken:true,s:{}} },
      p3NeedFlag:false, pressChoice:null,
      fr:{opened:true,step:0,slots:[],trapPending:false,resolved:false,
        claimDone:false,lastLayout:null,attempts:0},
      firstMissUsed:false, status:"pending", mistakes:[]
    };
    const discardOnce = N2.debateFr(arrangeBase,
      "arrange:table=stands,cannon=discard,sky=unmeasured");
    const discardTwice = N2.debateFr(discardOnce.state,
      "arrange:table=stands,cannon=discard,sky=unmeasured");
    if (discardOnce.state.rep !== 3 || discardTwice.state.rep !== 3 ||
        discardTwice.state.debate.persuasion !== 3 ||
        discardTwice.state.eventLog.some((event) => event.t === "rep") ||
        discardTwice.state.debate.fr.lastLayout.cannon !== "discard")
      throw new Error("第二章三紙錯排被誤算成信譽，或錯排沒有留在原紙上");

    /* 第五章：拿名聲代替帳只扣一次；先立可驗問句才是正向信譽。 */
    const N5 = Narrative._factory(scenes5, Engine5, debate5);
    const authorityBase = N5.initialState("explore");
    authorityBase.cursor = { scene:"E1-1", node:"q1" };
    const authority = N5.choose(authorityBase, "authority");
    if (authority.error || authority.state.rep !== 2 ||
        authority.state.eventLog.filter((event) => event.t === "rep").at(-1)?.reason !==
          "拿前輩的名聲替代可驗資料")
      throw new Error("第五章權威替代資料沒有正確扣分");
    const authorityBack = N5.advance(authority.state);
    const authorityAgain = N5.choose(authorityBack.state, "authority-again");
    if (authorityAgain.error || authorityAgain.state.rep !== 2)
      throw new Error("第五章同一個權威陷阱仍可重複扣分");
    const ledgerBase = N5.initialState("explore");
    ledgerBase.cursor = { scene:"E1-1", node:"q1" };
    const ledger = N5.choose(ledgerBase, "ledger");
    if (ledger.error || ledger.state.rep !== 4)
      throw new Error("第五章先立可驗問句沒有取得信譽");

    /*
     * 第五章原本只有入口一個扣分點，修復場永遠到不了。
     * 現在只把「抹去痕跡／虛構去向／隱去不利帳」列為研究誠實後果；
     * 一般算錯與「兩帳是同一件事」的概念誤判仍不扣。
     */
    let ch5ReachRepair = N5.advance(authority.state).state;
    ch5ReachRepair = N5.choose(ch5ReachRepair, "ledger").state;
    /* 修復路由的測試不得靠手填 J1–J3：先走完真實引擎路徑，
       再攻辯論裡的研究誠信越界。這也鎖住 sanitizer 的投影一致性。 */
    let repairLab5 = Engine5.initialState();
    for (const head of ["steel", "putty"])
      for (let repeat = 0; repeat < 3; repeat++) {
        repairLab5 = Engine5.setDraft(repairLab5, "head", head).state;
        repairLab5 = Engine5.runCollision(repairLab5).state;
      }
    const repairCollisionIds5 = repairLab5.collisionRuns.map((row) => row.id);
    repairLab5 = Engine5.assertJ1(repairLab5, repairCollisionIds5, "both-close").state;
    repairLab5 = Engine5.assertJ2(repairLab5, repairCollisionIds5, "steel-close-putty-short").state;
    repairLab5 = Engine5.setJudgment(repairLab5, "followup", "changes-with-mass").state;
    repairLab5 = Engine5.setDraft(repairLab5, "masses", "4/8").state;
    repairLab5 = Engine5.setDraft(repairLab5, "head", "putty").state;
    repairLab5 = Engine5.runCollision(repairLab5).state;
    for (const height of ["h1", "h4", "h9"]) {
      repairLab5 = Engine5.setDraft(repairLab5, "clayHeight", height).state;
      repairLab5 = Engine5.runClay(repairLab5).state;
    }
    repairLab5 = Engine5.assertJ3(
      repairLab5, repairLab5.clayRuns.map((row) => row.id), "speed-squared"
    ).state;
    ch5ReachRepair.lab = repairLab5;
    for (const id of ["J1", "J2", "J3"]) ch5ReachRepair.evidence[id] = true;
    ch5ReachRepair.debate = {
      persuasion:5, idx:3,
      pillars:{ P1:{broken:true,s:{}}, P2:{broken:true,s:{}},
        P3:{broken:true,s:{}} },
      p3NeedFlag:false, pressChoice:null,
      fr:{opened:true,step:0,slots:[],trapPending:false,resolved:false,
        claimDone:false},
      firstMissUsed:false, status:"pending", mistakes:[]
    };
    ch5ReachRepair = N5.debateFr(ch5ReachRepair, "books-split").state;
    const vanishedOnce = N5.debateFr(ch5ReachRepair, "vanished");
    const vanishedTwice = N5.debateFr(vanishedOnce.state, "vanished");
    if (vanishedOnce.state.rep !== 2 || vanishedTwice.state.rep !== 2)
      throw new Error("第五章『短少消失』同一越界仍可刷扣");
    const putInMomentum = N5.debateFr(vanishedTwice.state, "in-momentum");
    if (putInMomentum.state.rep !== 1)
      throw new Error("第五章虛構短少去向沒有承擔信譽後果");
    ch5ReachRepair = N5.debateFr(
      putInMomentum.state, "ruler-not-receipt"
    ).state;
    const eraseOtherLedger = N5.debateFr(ch5ReachRepair, "momentum-only");
    if (eraseOtherLedger.state.rep !== 0 ||
        eraseOtherLedger.state.flags.repLocked !== "1")
      throw new Error("第五章三種不同研究誠實越界仍無法自然到達修復門檻");
    const ch5NaturalRepair = N5.redirectIfLocked(eraseOtherLedger.state);
    if (!ch5NaturalRepair.redirected ||
        ch5NaturalRepair.state.cursor.scene !== "SC5-R1")
      throw new Error("第五章自然歸零後沒有進入修復場");

    /*
     * Claude 指出「人工 state.rep=0 只能證明路由，不能證明場景到得了」。
     * 以下略過無關內容，但每一次加扣都必須走正式玩家 API；五章都要能由
     * 不同的研究誠實越界自然歸零，而不是重複刷同一句。
     */
    let ch1ReachRepair = Narrative.initialState("explore");
    ch1ReachRepair.cursor = { scene:"P0-2", node:"nA4" };
    ch1ReachRepair = Narrative.advance(ch1ReachRepair).state;
    ch1ReachRepair.debate = JSON.parse(JSON.stringify(pressBase.debate));
    ch1ReachRepair = Narrative.debatePressChoice(ch1ReachRepair, "a").state;
    ch1ReachRepair.lab.evidence.e3.c = true;
    ch1ReachRepair.debate = JSON.parse(JSON.stringify(trapBase.debate));
    ch1ReachRepair = Narrative.debateFr(ch1ReachRepair, "lied").state;

    let ch2ReachRepair = JSON.parse(JSON.stringify(ch2First.state));
    ch2ReachRepair.cursor = { scene:"B2-4", node:"q4" };
    ch2ReachRepair = N2.choose(ch2ReachRepair, "b").state;
    ch2ReachRepair.cursor = { scene:"B2-5", node:"q2" };
    ch2ReachRepair = N2.choose(ch2ReachRepair, "b").state;

    const N3Reach = Narrative._factory(scenes3, Engine3, {});
    let ch3ReachRepair = N3Reach.initialState("explore");
    ch3ReachRepair.cursor = { scene:"C0-3", node:"c1" };
    ch3ReachRepair = N3Reach.choose(ch3ReachRepair, "all").state;
    ch3ReachRepair.lab.caseFile.dossier.debate.pillars =
      { p1:true, p2:true, p3:true };
    ch3ReachRepair = N3Reach.labAction(
      ch3ReachRepair, "setDossierFinalBoundary", { choice:"overclaim" }
    ).state;
    ch3ReachRepair = N3Reach.labAction(
      ch3ReachRepair, "setDossierFinalBoundary", {
        choice:"all-motion-hidden"
      }
    ).state;

    const N4Reach = Narrative._factory(scenes4, Engine4, {});
    let ch4ReachRepair = N4Reach.initialState("explore");
    ch4ReachRepair.cursor = { scene:"D4-2", node:"e1" };
    ch4ReachRepair.lab = ch4CompleteK4(
      ch4CompleteK3(ch4CompleteK1(ch4K0K2State()))
    );
    ch4ReachRepair.flags.ch4OpeningChoice = "defer";
    const ch4HelperEvents = [{
      t: "lab",
      action: "deferPress",
      at: "D3-1/e1",
      sequence: ch4ReachRepair.lab.proof.press.delays[0].at
    }];
    for (const rows of Object.values(ch4ReachRepair.lab.claims)) {
      for (const row of rows) {
        ch4HelperEvents.push({
          t: "lab",
          action: row.action,
          at: "test-helper",
          sequence: row.at,
          args: {
            records: row.sources.slice(),
            concept: row.concept,
            claim: row.concept
          }
        });
      }
    }
    ch4HelperEvents.sort((a, b) => a.sequence - b.sequence);
    ch4ReachRepair.eventLog.push(...ch4HelperEvents);
    for (const id of ["K1", "K2", "K3", "K4"])
      ch4ReachRepair.evidence[id] = true;
    const ch4Act = (action, args = {}) => {
      const result = N4Reach.labAction(ch4ReachRepair, action, args);
      if (result.error) throw new Error("第四章自然歸零路徑失敗:" + result.error);
      ch4ReachRepair = result.state;
    };
    for (const [slot, evidenceId] of [
      ["inertia", "M3"], ["inward", "K1"], ["distance", "K2"],
      ["withheld", "K3"], ["model", "K4"]
    ]) ch4Act("placeProofLink", { slot, evidenceId });
    ch4Act("revealShellPage");
    ch4Act("placeShellPage");
    ch4Act("setHookeScope", { choice:"hookeComplete" });
    ch4Act("setHookeScope", { choice:"newtonAlone" });
    ch4Act("setHookeScope", { choice:"precise-scope" });
    ch4Act("setProofBoundary", { choice:"mechanismSolved" });

    for (const [chapter, N, state, repairScene] of [
      ["第一章", Narrative, ch1ReachRepair, "SC-R1"],
      ["第二章", N2, ch2ReachRepair, "SC-R1"],
      ["第三章", N3Reach, ch3ReachRepair, "SC3-R1"],
      ["第四章", N4Reach, ch4ReachRepair, "SC4-R1"],
      ["第五章", N5, eraseOtherLedger.state, "SC5-R1"]
    ]) {
      if (state.rep !== 0 || state.flags.repLocked !== "1")
        throw new Error(chapter + " 的不同越界無法自然把信譽降到零");
      const routed = N.redirectIfLocked(state);
      if (!routed.redirected || routed.state.cursor.scene !== repairScene)
        throw new Error(chapter + " 自然歸零後沒有進入章別修復場");
    }

    /*
     * 歸零必須進章別修復場，且不能在修復場裡再次重導。
     * ch1／ch2 的完整實驗修復另有既有重型測試；此處鎖跨章路由。
     */
    const routes = [
      [Narrative, "P0-1", "SC-R1"],
      [N2, "B0-1", "SC-R1"],
      [Narrative._factory(scenes3, Engine3, {}), "C0-1", "SC3-R1"],
      [Narrative._factory(scenes4, Engine4, {}), "D0-1", "SC4-R1"],
      [N5, "E0-1", "SC5-R1"]
    ];
    routes.forEach(([N, sceneId, repairId], index) => {
      const state = N.initialState("explore");
      state.rep = 0;
      state.flags.repLocked = "1";
      state.cursor = { scene:sceneId, node:N._sceneMap[sceneId].def.nodes[0].id };
      const routed = N.redirectIfLocked(state);
      if (!routed.redirected || routed.state.cursor.scene !== repairId ||
          routed.state.flags.returnScene !== sceneId ||
          routed.state.eventLog.filter((event) => event.t === "repairEnter").length !== 1)
        throw new Error("第 " + (index + 1) + " 章歸零沒有進正確修復場");
      const nested = N.redirectIfLocked(routed.state);
      if (nested.redirected)
        throw new Error("第 " + (index + 1) + " 章在修復場內再次重導");
      N.view(routed.state);
      if (index >= 2) {
        let repaired = N.advance(routed.state).state;
        repaired = N.advance(repaired).state;
        repaired = N.choose(repaired, "withdraw").state;
        if (repaired.rep !== 1 || repaired.flags.repLocked ||
            !repaired.eventLog.filter((event) => event.t === "rep").at(-1)?.reason)
          throw new Error("第 " + (index + 1) + " 章撤回越界後沒有恢復合作資格");
      }
    });

    /*
     * ch3–ch5 必須從非首節點進修復、跨存檔往返，並真的走過 return。
     * 只驗 returnScene 或停在 withdraw，會讓 returnNode 退化成場景首節點仍假綠。
     */
    const Sanitize = require("../src/sanitize.js");
    const exactRepairReturns = [
      [Narrative._factory(scenes3, Engine3, {}), "C0-3", "c1", "SC3-R1",
        (state) => Sanitize.sanitizeImport3(state, scenes3),
        ["discard-paper", "fill-blank"], ch3ReachRepair],
      [Narrative._factory(scenes4, Engine4, {}), "D4-2", "e1", "SC4-R1",
        (state) => Sanitize.sanitizeImport4(state, scenes4, Engine4),
        ["erase-source", "fill-mechanism"], ch4ReachRepair],
      [N5, "E1-1", "q1", "SC5-R1",
        (state) => Sanitize.sanitizeImport5(state, scenes5),
        ["momentum-only", "vis-viva-only"], eraseOtherLedger.state]
    ];
    exactRepairReturns.forEach(([
      N, sceneId, nodeId, repairId, sanitizeRepair, wrongChoices, naturalZero
    ], index) => {
      let state = JSON.parse(JSON.stringify(naturalZero));
      state.cursor = { scene:sceneId, node:nodeId };
      const entered = N.redirectIfLocked(state);
      if (!entered.redirected || entered.state.cursor.scene !== repairId)
        throw new Error("第 " + (index + 3) + " 章沒有進入修復場");
      state = N.deserialize(N.serialize(entered.state));
      if (state.flags.returnScene !== sceneId || state.flags.returnNode !== nodeId)
        throw new Error("第 " + (index + 3) + " 章修復返回游標未跨存檔保存");
      let checked = sanitizeRepair(JSON.parse(N.serialize(state)));
      if (!checked.ok)
        throw new Error("第 " + (index + 3) + " 章修復入口存檔遭拒:" + checked.reason);
      state = N.advance(state).state;
      state = N.advance(state).state;
      for (const wrongChoice of wrongChoices) {
        const wrong = N.choose(state, wrongChoice);
        if (wrong.error || wrong.state.rep !== 0 ||
            wrong.state.flags.repLocked !== "1")
          throw new Error("第 " + (index + 3) + " 章錯誤修復選項竟可恢復信譽");
        checked = sanitizeRepair(JSON.parse(N.serialize(wrong.state)));
        if (!checked.ok)
          throw new Error("第 " + (index + 3) + " 章錯誤修復存檔遭拒:" + checked.reason);
        const back = N.advance(wrong.state);
        if (back.error || back.state.cursor.scene !== repairId ||
            back.state.cursor.node !== "c1")
          throw new Error("第 " + (index + 3) + " 章錯誤修復沒有回到邊界判讀");
        state = back.state;
      }
      const withdrawn = N.choose(state, "withdraw");
      if (withdrawn.error)
        throw new Error("第 " + (index + 3) + " 章修復撤回失敗:" + withdrawn.error);
      checked = sanitizeRepair(JSON.parse(N.serialize(withdrawn.state)));
      if (!checked.ok)
        throw new Error("第 " + (index + 3) + " 章撤回後存檔遭拒:" + checked.reason);
      const returned = N.advance(withdrawn.state);
      if (returned.error)
        throw new Error("第 " + (index + 3) + " 章修復返回失敗:" + returned.error);
      if (returned.state.cursor.scene !== sceneId ||
          returned.state.cursor.node !== nodeId)
        throw new Error("第 " + (index + 3) + " 章沒有返回精確原游標");
      if (returned.state.flags.returnScene || returned.state.flags.returnNode)
        throw new Error("第 " + (index + 3) + " 章返回後仍殘留修復游標");
      checked = sanitizeRepair(JSON.parse(N.serialize(returned.state)));
      if (!checked.ok)
        throw new Error("第 " + (index + 3) + " 章返回後存檔遭拒:" + checked.reason);

      const forgedLock = N.initialState("explore");
      forgedLock.flags.repLocked = "1";
      if (sanitizeRepair(forgedLock).ok)
        throw new Error("第 " + (index + 3) + " 章 rep=3 的偽信譽鎖仍可匯入");
      const forgedRepair = N.initialState("explore");
      forgedRepair.cursor = {
        scene:repairId, node:N._sceneMap[repairId].def.nodes[0].id
      };
      forgedRepair.flags.returnScene = sceneId;
      forgedRepair.flags.returnNode = nodeId;
      forgedRepair.rep = 0;
      forgedRepair.flags.repLocked = "1";
      forgedRepair.eventLog.push({
        t:"repairEnter", from:sceneId + "/" + nodeId
      });
      if (sanitizeRepair(forgedRepair).ok)
        throw new Error("第 " + (index + 3) + " 章可偽造修復場免費加信譽");
    });

    /* 本輪新增的首次旗標必須能追到 choice→rep→flag，不能只靠匯入者自報。 */
    for (const [label, N, sanitizeState, flag, value] of [
      ["第二章", N2, (state) => Sanitize.sanitizeImport2(state, scenes2, Engine2),
        "ch2BallisticsScopeBlurted", "1"],
      ["第三章", exactRepairReturns[0][0],
        (state) => Sanitize.sanitizeImport3(state, scenes3),
        "oldPaperAnswerBlurted", "1"],
      ["第五章", N5, (state) => Sanitize.sanitizeImport5(state, scenes5),
        "ch5AuthoritySubstitutionTried", "1"]
    ]) {
      const forged = N.initialState("explore");
      forged.flags[flag] = value;
      if (sanitizeState(forged).ok)
        throw new Error(label + " 偽首次旗標沒有玩家操作紀錄仍可匯入");
    }
    if (!Sanitize.sanitizeImport2(ch2First.state, scenes2, Engine2).ok ||
        !Sanitize.sanitizeImport5(authority.state, scenes5).ok)
      throw new Error("第二或第五章真實首次越界反被信譽匯入守衛拒絕");
    const brokenChain = JSON.parse(JSON.stringify(ch2First.state));
    const brokenChainRep = brokenChain.eventLog.find((event) =>
      event.t === "rep" && event.at === "B0-2/q1.a");
    brokenChainRep.from = 5;
    brokenChainRep.to = 4;
    if (Sanitize.sanitizeImport2(brokenChain, scenes2, Engine2).ok)
      throw new Error("信譽事件只驗單筆算術，偽造的 5→4 仍能冒充真實 3→2");
    const missingCurrentReason = JSON.parse(JSON.stringify(ch2First.state));
    delete missingCurrentReason.eventLog.find((event) =>
      event.t === "rep" && event.at === "B0-2/q1.a").reason;
    if (Sanitize.sanitizeImport2(missingCurrentReason, scenes2, Engine2).ok)
      throw new Error("現行首次失信事件移除 reason 後仍可匯入");
    for (const [label, N, sanitizeState] of [
      ["第一章", Narrative,
        (state) => Sanitize.sanitizeImport(state, patterns, scenes)],
      ["第二章", N2, (state) => Sanitize.sanitizeImport2(state, scenes2, Engine2)],
      ["第三章", exactRepairReturns[0][0],
        (state) => Sanitize.sanitizeImport3(state, scenes3)],
      ["第四章", exactRepairReturns[1][0],
        (state) => Sanitize.sanitizeImport4(state, scenes4, Engine4)],
      ["第五章", N5, (state) => Sanitize.sanitizeImport5(state, scenes5)]
    ]) {
      const unlockedZero = N.initialState("explore");
      unlockedZero.rep = 0;
      if (sanitizeState(unlockedZero).ok)
        throw new Error(label + " 接受信譽為零但沒有鎖定／事件帳的存檔");
    }
    const N3ForRep = exactRepairReturns[0][0];
    const ch3BlurtBase = N3ForRep.initialState("explore");
    ch3BlurtBase.cursor = { scene:"C0-3", node:"c1" };
    const ch3Blurt = N3ForRep.choose(ch3BlurtBase, "all");
    if (ch3Blurt.error ||
        !Sanitize.sanitizeImport3(ch3Blurt.state, scenes3).ok)
      throw new Error("第三章真實首次越界反被信譽匯入守衛拒絕");
    const ch3ScopedBase = N3ForRep.initialState("explore");
    ch3ScopedBase.cursor = { scene:"C0-3", node:"c1" };
    const ch3Scoped = N3ForRep.choose(ch3ScopedBase, "bounded");
    if (ch3Scoped.error ||
        !Sanitize.sanitizeImport3(ch3Scoped.state, scenes3).ok)
      throw new Error("第三章真實縮限主張反被信譽匯入守衛拒絕");
    const forgedScoped = N3ForRep.initialState("explore");
    forgedScoped.flags.oldPaperScoped = "bounded";
    if (Sanitize.sanitizeImport3(forgedScoped, scenes3).ok)
      throw new Error("第三章空手自報縮限旗標仍可匯入");

    /* 舊版 bounded 已有 choice→flag，尚無 rep；只能接受這個精確舊事件形狀。 */
    const legacyScoped = JSON.parse(N3ForRep.serialize(ch3Scoped.state));
    legacyScoped.rep = 3;
    legacyScoped.eventLog = legacyScoped.eventLog.filter((event) =>
      !(event.t === "rep" && event.at === "C0-3/c1.bounded"));
    if (!Sanitize.sanitizeImport3(legacyScoped, scenes3).ok)
      throw new Error("第三章既有 bounded 舊存檔無法相容匯入");

    /*
     * 「看不出不完整原紙還能支持什麼」是判讀錯，不是藏紙或造假；
     * 由 NPC 糾正、玩家重選即可，不得把一般錯答重新變成信譽分數。
     */
    const ch3UnderreadBase = N3ForRep.initialState("explore");
    ch3UnderreadBase.cursor = { scene:"C0-3", node:"c1" };
    const ch3Underread = N3ForRep.choose(ch3UnderreadBase, "fake");
    if (ch3Underread.error || ch3Underread.state.rep !== 3 ||
        ch3Underread.state.eventLog.some((event) => event.t === "rep") ||
        ch3Underread.option.text.includes("不能算數"))
      throw new Error("第三章低估原紙仍被寫成作廢／研究失信，而非一般判讀錯誤");
    const partialScoped = JSON.parse(JSON.stringify(legacyScoped));
    partialScoped.eventLog = partialScoped.eventLog.filter((event) =>
      !(event.t === "choice" && event.at === "C0-3/c1"));
    if (Sanitize.sanitizeImport3(partialScoped, scenes3).ok)
      throw new Error("第三章缺 choice 的偽舊縮限旗標仍可匯入");

    /* ch3 canonical 只走 dossier 終局；舊 setBoundary 不得再二次改全域信譽。 */
    const legacy = Engine3.initialState();
    legacy.publicDemo.complete = true;
    legacy.publicDemo.screened = true;
    legacy.publicDemo.revealed = true;
    const legacyOverclaim = Engine3.setBoundary(legacy, "overclaim");
    if ("repDelta" in legacyOverclaim)
      throw new Error("第三章舊終局 API 仍可對同一越界二次扣信譽");

    const scenes5Json = JSON.parse(readFileSync(
      path.join(here, "../data/scenes5.json"), "utf-8"));
    if (JSON.stringify(scenes5) !== JSON.stringify(scenes5Json))
      throw new Error("scenes5 鏡像漂移");
  }
});

tests.push({
  name: "全系列信譽匯入真相|正向事件須有操作來源、修復須完成一輪、未知來源拒絕",
  fn: () => {
    const Sanitize = require("../src/sanitize.js");
    const Engine2 = require("../src/engine2.js");
    const debate2 = require("../data/debate2.js");
    const N2 = Narrative._factory(scenes2, Engine2, debate2);
    const N3 = Narrative._factory(scenes3, Engine3, {});
    const N4 = Narrative._factory(scenes4, Engine4, {});
    const N5 = Narrative._factory(scenes5, Engine5, debate5);
    const chapters = {
      ch1: {
        N: Narrative,
        sanitize: (state) => Sanitize.sanitizeImport(state, patterns, scenes)
      },
      ch2: {
        N: N2,
        sanitize: (state) => Sanitize.sanitizeImport2(state, scenes2, Engine2)
      },
      ch3: {
        N: N3,
        sanitize: (state) => Sanitize.sanitizeImport3(state, scenes3)
      },
      ch4: {
        N: N4,
        sanitize: (state) => Sanitize.sanitizeImport4(state, scenes4, Engine4)
      },
      ch5: {
        N: N5,
        sanitize: (state) => Sanitize.sanitizeImport5(state, scenes5)
      }
    };
    const positiveSources = [
      ["ch1", "P0-1/nb2", null],
      ["ch1", "INT-1/nb2", null],
      ["ch1", "P0-2/nB3", "同意讓斷言接受證據檢查，也把同一規矩用在同行身上"],
      ["ch1", "SC-R1/n3", "用一筆新紀錄修復合作資格"],
      ["ch2", "B0-2/s1", "先讀對手的圖，也保留它真正能支持的範圍"],
      ["ch2", "SC-R1/n3", "用一筆新紀錄修復合作資格"],
      ["ch3", "C0-3/c1.bounded", "主動把斷言收回到原紙能支持的範圍"],
      ["ch3", "SC3-R1/c1.withdraw", "主動撤回越過原紙的斷言，重新標明資料邊界"],
      ["ch4", "orbit4.removeTravelerFromAuthorField",
        "主動退出沒有完成之作品的作者欄，沒有把參與操作冒充成作者身分"],
      ["ch4", "SC4-R1/c1.withdraw",
        "主動撤回越過來源的署名與機制結論，恢復可查的邊界"],
      ["ch5", "E1-1/q1.ledger",
        "先把兩本帳各自改寫成可驗的問題，沒有先替任何一邊宣布勝負"],
      ["ch5", "E3-2/j4",
        "承認兩本帳記的是不同事情，也保留尚未對平的去向"],
      ["ch5", "SC5-R1/c1.withdraw",
        "撤回權威與單一帳結論，重新保留兩本帳及未解缺口"]
    ];
    for (const [chapterId, at, reason] of positiveSources) {
      const { N, sanitize } = chapters[chapterId];
      const forged = N.initialState("explore");
      forged.rep = 4;
      const event = { t:"rep", d:1, from:3, to:4, at };
      if (reason) event.reason = reason;
      forged.eventLog.push(event);
      if (sanitize(forged).ok)
        throw new Error(chapterId + " 可憑空鑄造正向信譽:" + at);
    }

    const unknownPositive = Narrative.initialState("explore");
    unknownPositive.rep = 4;
    unknownPositive.eventLog.push({
      t:"rep", d:1, from:3, to:4, at:"forged.unknown", reason:"任意加分"
    });
    if (chapters.ch1.sanitize(unknownPositive).ok)
      throw new Error("未知來源可憑空增加信譽");
    const unknownNegative = Narrative.initialState("explore");
    unknownNegative.rep = 2;
    unknownNegative.eventLog.push({
      t:"rep", d:-1, from:3, to:2, at:"forged.unknown", reason:"任意扣分"
    });
    if (chapters.ch1.sanitize(unknownNegative).ok)
      throw new Error("未知來源可憑空扣除信譽");

    const wrongDelta = Narrative.initialState("explore");
    wrongDelta.rep = 5;
    wrongDelta.eventLog.push(
      { t:"choice", at:"P0-2/q1", pick:"b" },
      { t:"choice", at:"P0-2/qB", pick:"b1" }
    );
    wrongDelta.eventLog.push({
      t:"rep", d:2, from:3, to:5, at:"P0-2/nB3",
      reason:"同意讓斷言接受證據檢查，也把同一規矩用在同行身上"
    });
    if (chapters.ch1.sanitize(wrongDelta).ok)
      throw new Error("合法來源與理由竟可偽造不同信譽增量");

    const reusedChoice = Narrative.initialState("explore");
    reusedChoice.rep = 5;
    reusedChoice.eventLog.push(
      { t:"choice", at:"P0-2/q1", pick:"b" },
      { t:"choice", at:"P0-2/qB", pick:"b1" },
      {
        t:"rep", d:1, from:3, to:4, at:"P0-2/nB3",
        reason:"同意讓斷言接受證據檢查，也把同一規矩用在同行身上"
      },
      {
        t:"rep", d:1, from:4, to:5, at:"P0-2/nB3",
        reason:"同意讓斷言接受證據檢查，也把同一規矩用在同行身上"
      }
    );
    if (chapters.ch1.sanitize(reusedChoice).ok)
      throw new Error("同一次玩家操作可重複兌領同一筆正向信譽");

    const reversedChoices = Narrative.initialState("explore");
    reversedChoices.rep = 4;
    reversedChoices.eventLog.push(
      { t:"choice", at:"P0-2/qB", pick:"b1" },
      { t:"choice", at:"P0-2/q1", pick:"b" },
      {
        t:"rep", d:1, from:3, to:4, at:"P0-2/nB3",
        reason:"同意讓斷言接受證據檢查，也把同一規矩用在同行身上"
      }
    );
    if (chapters.ch1.sanitize(reversedChoices).ok)
      throw new Error("前置選項反序仍可兌領正向信譽");

    const forgedAuthorExit = N4.initialState("explore");
    forgedAuthorExit.rep = 4;
    forgedAuthorExit.eventLog.push({
      t:"rep", d:1, from:3, to:4,
      at:"orbit4.removeTravelerFromAuthorField",
      reason:"主動退出沒有完成之作品的作者欄，沒有把參與操作冒充成作者身分"
    });
    forgedAuthorExit.eventLog.push({
      t:"lab", action:"removeTravelerFromAuthorField", at:"D3-2/embed"
    });
    if (chapters.ch4.sanitize(forgedAuthorExit).ok)
      throw new Error("作者欄仍有旅人，卻可憑同名事件偽造退出加分");

    const forgedJ4 = N5.initialState("explore");
    forgedJ4.rep = 4;
    forgedJ4.evidence.J4 = true;
    forgedJ4.eventLog.push(
      { t:"evidence", id:"J4", at:"debate.fr5" },
      {
        t:"rep", d:1, from:3, to:4, at:"E3-2/j4",
        reason:"承認兩本帳記的是不同事情，也保留尚未對平的去向"
      }
    );
    if (chapters.ch5.sanitize(forgedJ4).ok)
      throw new Error("第五章辯論未勝，卻可憑孤立 J4 事件偽造加分");

    const wonJ4WithoutDebateEvent = N5.initialState("explore");
    wonJ4WithoutDebateEvent.rep = 4;
    wonJ4WithoutDebateEvent.evidence.J4 = true;
    wonJ4WithoutDebateEvent.debate = { status:"won", fr:{ resolved:true } };
    wonJ4WithoutDebateEvent.eventLog.push(
      { t:"evidence", id:"J4", at:"debate.fr5" },
      {
        t:"rep", d:1, from:3, to:4, at:"E3-2/j4",
        reason:"承認兩本帳記的是不同事情，也保留尚未對平的去向"
      }
    );
    if (chapters.ch5.sanitize(wonJ4WithoutDebateEvent).ok)
      throw new Error("只把第五章辯論狀態翻成 won，沒有 debateWon 事件仍可加分");

    const forgedFinalOnlyJ4 = N5.initialState("explore");
    forgedFinalOnlyJ4.rep = 4;
    forgedFinalOnlyJ4.evidence.J4 = true;
    forgedFinalOnlyJ4.debate = { status:"won", fr:{ resolved:true } };
    forgedFinalOnlyJ4.eventLog.push(
      { t:"evidence", id:"J4", at:"debate.fr5" },
      { t:"debateWon" },
      {
        t:"rep", d:1, from:3, to:4, at:"E3-2/j4",
        reason:"承認兩本帳記的是不同事情，也保留尚未對平的去向"
      }
    );
    if (chapters.ch5.sanitize(forgedFinalOnlyJ4).ok)
      throw new Error("沒有 J1–J3 與三柱過程，只偽造勝辯尾段仍可加分");

    const duplicatedJ4 = N5.initialState("explore");
    duplicatedJ4.rep = 4;
    duplicatedJ4.evidence.J4 = true;
    duplicatedJ4.debate = { status:"won", fr:{ resolved:true } };
    duplicatedJ4.eventLog.push(
      { t:"evidence", id:"J4", at:"debate.fr5" },
      { t:"evidence", id:"J4", at:"debate.fr5" },
      { t:"debateWon" },
      {
        t:"rep", d:1, from:3, to:4, at:"E3-2/j4",
        reason:"承認兩本帳記的是不同事情，也保留尚未對平的去向"
      }
    );
    if (chapters.ch5.sanitize(duplicatedJ4).ok)
      throw new Error("同一份 J4 可用重複取得事件偽造加分");

    const duplicatedDebateWin = N5.initialState("explore");
    duplicatedDebateWin.rep = 4;
    duplicatedDebateWin.evidence.J4 = true;
    duplicatedDebateWin.debate = { status:"won", fr:{ resolved:true } };
    duplicatedDebateWin.eventLog.push(
      { t:"evidence", id:"J4", at:"debate.fr5" },
      { t:"debateWon" },
      { t:"debateWon" },
      {
        t:"rep", d:1, from:3, to:4, at:"E3-2/j4",
        reason:"承認兩本帳記的是不同事情，也保留尚未對平的去向"
      }
    );
    if (chapters.ch5.sanitize(duplicatedDebateWin).ok)
      throw new Error("重複 debateWon 事件仍可兌領第五章正向信譽");

    const repairWithoutEntry = Narrative.initialState("explore");
    repairWithoutEntry.eventLog.push({
      t:"choice", at:"P0-2/q1", pick:"a"
    });
    for (const [at, reason, from, to] of [
      ["P0-2/nA4", "把沒有證據的未來答案說成大家都知道的事", 3, 2],
      ["debate.pressChoice.a", "拿未來物理學的名聲替代現場可查的證據", 2, 1],
      ["debate.trap.lied", "聲稱量過垂直落下，卻拿不出任何原始紀錄", 1, 0]
    ]) repairWithoutEntry.eventLog.push({ t:"rep", d:-1, from, to, at, reason });
    repairWithoutEntry.eventLog.push({ t:"repLock", at:"debate.trap.lied" });
    repairWithoutEntry.eventLog.push({ t:"embedDone", at:"SC-R1/e1" });
    repairWithoutEntry.eventLog.push({
      t:"rep", d:1, from:0, to:1, at:"SC-R1/n3",
      reason:"用一筆新紀錄修復合作資格"
    });
    repairWithoutEntry.eventLog.push({
      t:"flagClear", k:"repLocked", at:"SC-R1/n3"
    });
    repairWithoutEntry.rep = 1;
    if (chapters.ch1.sanitize(repairWithoutEntry).ok)
      throw new Error("沒有 repairEnter 仍可直接領取修復信譽");

    const repairWithoutAction = JSON.parse(JSON.stringify(repairWithoutEntry));
    const repairLockIndex = repairWithoutAction.eventLog.findIndex((event) =>
      event.t === "repLock");
    repairWithoutAction.eventLog.splice(repairLockIndex + 1, 0, {
      t:"repairEnter", from:"P0-2/nA4"
    });
    repairWithoutAction.eventLog = repairWithoutAction.eventLog.filter((event) =>
      event.t !== "embedDone");
    if (chapters.ch1.sanitize(repairWithoutAction).ok)
      throw new Error("進入修復場但未完成玩家修復操作仍可直接加分");

    const staleRepairAction = Narrative.initialState("explore");
    staleRepairAction.eventLog.push(
      { t:"choice", at:"P0-2/q1", pick:"a" },
      {
        t:"rep", d:-1, from:3, to:2, at:"P0-2/nA4",
        reason:"把沒有證據的未來答案說成大家都知道的事"
      },
      {
        t:"rep", d:-1, from:2, to:1, at:"debate.pressChoice.a",
        reason:"拿未來物理學的名聲替代現場可查的證據"
      },
      {
        t:"rep", d:-1, from:1, to:0, at:"debate.trap.lied",
        reason:"聲稱量過垂直落下，卻拿不出任何原始紀錄"
      },
      { t:"repLock", at:"debate.trap.lied" },
      { t:"repairEnter", from:"P0-2/nA4" },
      { t:"embedDone", at:"SC-R1/e1" },
      {
        t:"rep", d:1, from:0, to:1, at:"SC-R1/n3",
        reason:"用一筆新紀錄修復合作資格"
      },
      { t:"flagClear", k:"repLocked", at:"SC-R1/n3" },
      {
        t:"rep", d:-1, from:1, to:0, at:"P0-2/nA4",
        reason:"把沒有證據的未來答案說成大家都知道的事"
      },
      { t:"repLock", at:"P0-2/nA4" },
      { t:"repairEnter", from:"P0-2/nA4" },
      {
        t:"rep", d:1, from:0, to:1, at:"SC-R1/n3",
        reason:"用一筆新紀錄修復合作資格"
      },
      { t:"flagClear", k:"repLocked", at:"SC-R1/n3" }
    );
    staleRepairAction.rep = 1;
    if (chapters.ch1.sanitize(staleRepairAction).ok)
      throw new Error("第二輪修復可借用上一輪的玩家操作");

    /* 新版 ch1 修復不只要 embedDone，必須保留進場後的 judge 與新成立主張。 */
    const guardedRepair = JSON.parse(JSON.stringify(repairWithoutEntry));
    const guardedLockIndex = guardedRepair.eventLog.findIndex((event) =>
      event.t === "repLock");
    guardedRepair.eventLog.splice(guardedLockIndex + 1, 0, {
      t:"repairEnter", from:"P0-2/nA4", gate:"validated-claim",
      runBaseline:0, claimBaseline:0
    });
    let guardedRun = Engine.runExperiment(guardedRepair.lab, {
      ball:"銅大", surface:"打磨", incline:"緩", timer:"水鐘"
    });
    const guardedId = guardedRun.run.id;
    const guardedJudge = Engine.judge(
      guardedRun.state, [guardedId], guardedRun.run.readings[4]
    );
    guardedRepair.lab = guardedJudge.state;
    const guardedEntryIndex = guardedRepair.eventLog.findIndex((event) =>
      event.t === "repairEnter");
    guardedRepair.eventLog.splice(guardedEntryIndex + 1, 0,
      { t:"lab", action:"run", at:"SC-R1/e1" },
      { t:"lab", action:"judge", at:"SC-R1/e1" }
    );
    const guardedChecked = chapters.ch1.sanitize(guardedRepair);
    if (!guardedChecked.ok)
      throw new Error("含新成立主張的正常修復存檔遭拒:" + guardedChecked.reason);
    const forgedValidatedRepair = JSON.parse(JSON.stringify(guardedRepair));
    forgedValidatedRepair.eventLog = forgedValidatedRepair.eventLog.filter((event) =>
      !(event.t === "lab" && event.action === "judge" && event.at === "SC-R1/e1")
    );
    if (chapters.ch1.sanitize(forgedValidatedRepair).ok)
      throw new Error("刪掉修復場 judge 事件後，仍可憑新 claim 偽造加分");

    /* fail-closed 不得誤殺 2026-07-29 前兩筆已存在、現行已撤除的答題獎勵。 */
    for (const [sceneId, choiceAt, pick, rewardAt, cursorNode] of [
      ["P0-1", "P0-1/q1", "b", "P0-1/nb2", "m1"],
      ["INT-1", "INT-1/q1", "b", "INT-1/nb2", "m1"]
    ]) {
      const legacyReward = Narrative.initialState("explore");
      legacyReward.cursor = { scene:sceneId, node:cursorNode };
      legacyReward.rep = 4;
      legacyReward.eventLog.push({ t:"choice", at:choiceAt, pick });
      legacyReward.eventLog.push({
        t:"rep", d:1, from:3, to:4, at:rewardAt
      });
      if (!chapters.ch1.sanitize(legacyReward).ok)
        throw new Error("合法舊答題獎勵遭 fail-closed 誤殺:" + rewardAt);
    }

    /*
     * 2026-07-29 前第二章「先看砲術圖」版本已能留下無 reason 的扣分；
     * 真實 choice 鏈必須相容，只有孤立 rep 的偽舊紀錄仍要拒絕。
     */
    const legacyCh2Scope = N2.initialState("explore");
    legacyCh2Scope.cursor = { scene:"B0-2", node:"na1" };
    legacyCh2Scope.rep = 2;
    legacyCh2Scope.eventLog.push(
      { t:"choice", at:"B0-2/q1", pick:"a" },
      { t:"rep", d:-1, from:3, to:2, at:"B0-2/q1.a" }
    );
    const legacyCh2Checked = chapters.ch2.sanitize(legacyCh2Scope);
    if (!legacyCh2Checked.ok)
      throw new Error("第二章合法舊越界存檔遭 fail-closed 誤殺:" +
        legacyCh2Checked.reason);
    if (legacyCh2Checked.state.flags.ch2BallisticsScopeBlurted !== "1")
      throw new Error("第二章舊越界存檔匯入後沒有補回首次觸發旗標");
    const legacyCh2Reloaded = chapters.ch2.sanitize(
      JSON.parse(JSON.stringify(legacyCh2Checked.state)));
    if (!legacyCh2Reloaded.ok)
      throw new Error("第二章舊越界遷移後再次載入不具冪等性:" +
        legacyCh2Reloaded.reason);
    if (legacyCh2Reloaded.state.eventLog.filter((event) =>
      event.t === "flag" &&
      event.k === "ch2BallisticsScopeBlurted").length !== 1)
      throw new Error("第二章舊越界每次載入都重複追加遷移旗標");
    const fakeLegacyCh2Scope = JSON.parse(JSON.stringify(legacyCh2Scope));
    fakeLegacyCh2Scope.eventLog = fakeLegacyCh2Scope.eventLog.filter((event) =>
      event.t !== "choice");
    if (chapters.ch2.sanitize(fakeLegacyCh2Scope).ok)
      throw new Error("第二章缺原 choice 的偽舊扣分竟可匯入");

    /*
     * 正式 UI 不允許在歸零後留在原工作台連點：所有動作交回 setState，
     * setState 必須先重導修復，才可存檔與重畫。這是 Claude C-2 的實際邊界。
     */
    const ui = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
    const setStateStart = ui.indexOf("function setState(s)");
    const setStateEnd = ui.indexOf("\n  function ", setStateStart + 1);
    const setStateBody = ui.slice(setStateStart, setStateEnd);
    const redirectAt = setStateBody.indexOf("N.redirectIfLocked(state)");
    const saveAt = setStateBody.indexOf("save()");
    if (redirectAt < 0 || saveAt < 0 || redirectAt > saveAt)
      throw new Error("正式 UI 沒有在儲存前把信譽歸零狀態導入修復場");
    for (const handler of ["doDebate", "doShip", "doOrbit"]) {
      const start = ui.indexOf("function " + handler + "(");
      const end = ui.indexOf("\n  function ", start + 1);
      if (start < 0 || !ui.slice(start, end).includes("setState("))
        throw new Error(handler + " 繞過共同信譽鎖定入口");
    }
  }
});

tests.push({
  name: "第三章引擎重構|導引鎖定→實際分類→船艙三加三→有效雙紙",
  fn: () => {
    let n = Engine3.initialState();
    const takeCurrent = (result, label) => {
      if (!result || result.error || result.ok === false)
        throw new Error(label + ":" + (result && (result.error || result.reason) || "no-result"));
      n = result.state;
      return result;
    };
    const setCurrent = (field, value) =>
      takeCurrent(Engine3.setDossierDraft(n, field, value), "set:" + field);
    const runAndFileCurrent = (requestedStage, requestedPosition) => {
      setCurrent("stage", requestedStage);
      setCurrent("positionRecord", requestedPosition);
      takeCurrent(Engine3.runDossierExperiment(n), "run:" + requestedStage + ":" + requestedPosition);
      const pending = n.caseFile.dossier.pendingRecord;
      takeCurrent(Engine3.fileDossierRecord(n), "file:" + requestedStage + ":" + requestedPosition);
      return pending;
    };
    const selectCurrent = (assertionId, rows) => {
      rows.forEach((row) =>
        takeCurrent(Engine3.selectDossierSource(n, assertionId, "R" + row.id),
          assertionId + ":R" + row.id));
    };

    setCurrent("release", "latch");
    setCurrent("speedRecord", "beats");
    setCurrent("repeats", 3);
    setCurrent("vesselId", "small");
    setCurrent("speedBand", "slow");
    setCurrent("forceBand", "soft");
    setCurrent("beatBand", "fast");
    const guided = runAndFileCurrent("brake", "dual");
    if (guided.stage !== "depart" || guided.positionRecord !== "shore" ||
        guided.vesselId !== "captain" || guided.speedBand !== "mid" ||
        guided.forceBand !== "hard" || guided.beatBand !== "mid" ||
        guided.repeats !== 1 || guided.dualPapers)
      throw new Error("導引任務沒有鎖住船況、船隻、操船強度、鼓拍、觀察位置與單次執行");

    while (n.caseFile.dossier.records.filter((row) =>
      row.stage === "depart" && row.classification === "正在變快").length < 3) {
      if (n.caseFile.dossier.records.length > 12)
        throw new Error("無法用實際原紙累積三張正在變快紀錄");
      runAndFileCurrent("steady", "shore");
    }
    while (n.caseFile.dossier.records.filter((row) =>
      row.stage === "steady" && row.classification === "近似穩速").length < 3) {
      if (n.caseFile.dossier.records.length > 20)
        throw new Error("無法用實際原紙累積三張近似穩速紀錄");
      runAndFileCurrent("brake", "dual");
    }

    const steadyRowsCurrent = n.caseFile.dossier.records.filter((row) =>
      row.stage === "steady" && row.classification === "近似穩速").slice(0, 3);
    const departRowsCurrent = n.caseFile.dossier.records.filter((row) =>
      row.stage === "depart" && row.classification === "正在變快").slice(0, 3);
    selectCurrent("A1", steadyRowsCurrent);
    takeCurrent(Engine3.setDossierScope(n, "A1", "controlled-three"), "A1-scope");
    selectCurrent("A3", departRowsCurrent.concat(steadyRowsCurrent));
    takeCurrent(Engine3.setDossierScope(n, "A3", "today-comparison"), "A3-scope");
    takeCurrent(Engine3.commitDossierCabinWindPlan(n, "close-cabin"), "cabin-wind");
    takeCurrent(Engine3.commitDossierCabinInstrument(n, "drip"), "cabin-instrument");

    setCurrent("stage", "dock");
    for (let i = 0; i < 3; i++)
      takeCurrent(Engine3.runDossierCabinComparison(n), "cabin-dock:" + i);
    setCurrent("stage", "steady");
    for (let i = 0; i < 3; i++)
      takeCurrent(Engine3.runDossierCabinComparison(n), "cabin-steady:" + i);
    const cabinRowsCurrent = n.caseFile.dossier.blind.records;
    if (cabinRowsCurrent.length !== 6 ||
        cabinRowsCurrent.filter((row) => row.stage === "dock").length !== 3 ||
        cabinRowsCurrent.filter((row) => row.stage === "steady").length !== 3)
      throw new Error("船艙原紙不是停泊三張加走穩三張");
    cabinRowsCurrent.forEach((row) =>
      takeCurrent(Engine3.selectDossierSource(n, "A2", row.id), "A2:" + row.id));
    takeCurrent(Engine3.setDossierScope(n, "A2", "local-only"), "A2-scope");

    takeCurrent(Engine3.setDualDesign(n, CH3_DUAL_SETUP), "dual-design");
    const dualCurrent = runAndFileCurrent("brake", "shore");
    if (dualCurrent.stage !== "steady" || dualCurrent.positionRecord !== "dual" ||
        !dualCurrent.dualPapers || !dualCurrent.papers ||
        !dualCurrent.papers.shore || !dualCurrent.papers.ship)
      throw new Error("雙視角任務沒有產生一筆可逐拍換尺的真實雙紙來源");
    const debateCurrent = Engine3.enterDossierDebate(n);
    if (debateCurrent.error || !debateCurrent.ok ||
        !debateCurrent.state.caseFile.dossier.debate.active)
      throw new Error("完成實際分類、船艙三加三與有效雙紙後仍不能進碼頭辯論");
  }
});

tests.push({
  name: "第三章船艙舊存檔|單筆四格可遷移並繼續重做",
  fn: () => {
    let s = Engine3.initialState();
    s.evidence.g1 = true;
    s.cabin.dock.drip = true;
    s.cabinResults = {
      dock: { drip: { offset: 0.03, spread: 0.06 }, toss: null },
      steady: { drip: null, toss: null }
    };
    const out = Engine3.runCabin(s, "dock", "drip");
    if (out.error || out.noop || !Array.isArray(out.state.cabinResults.dock.drip) ||
        out.state.cabinResults.dock.drip.length !== 2)
      throw new Error("舊版單筆船艙紀錄未平順遷移成可重做格式");
  }
});

tests.push({
  name: "第三章變速舊存檔|單筆加減速可遷移並繼續累積",
  fn: () => {
    let s = Engine3.initialState();
    s.predictions = { accelerating: "behind", decelerating: "ahead", locked: true };
    s.speedRuns = {
      accelerating: { state:"accelerating", offset:-0.72, predicted:"behind", outcome:"behind", matched:true, day:1 },
      decelerating: null
    };
    const out = Engine3.runSpeedChange(s, "accelerating");
    if (out.error || out.noop || !Array.isArray(out.state.speedRuns.accelerating) ||
        out.state.speedRuns.accelerating.length !== 2 || out.state.speedRuns.accelerating[1].offset !== -0.66)
      throw new Error("舊版單筆變速紀錄未平順遷移成可重做格式");
  }
});

tests.push({
  name: "第三章全章走查|自由實驗、三柱辯論、回顧與史實頁完整通關",
  fn: () => {
    const N3 = Narrative._factory(scenes3, Engine3, {});
    const San = require("../src/sanitize.js");
    let s = N3.initialState("explore"), guard = 0;
    const pick = { "C0-1": "own-drawing", "C0-3": "bounded", "C3-2": "cabin" };
    const SPOKEN_RT = /^([\u4e00-\u9fff·・A-Za-z]{1,8})：(?:（([^）]*)）)?\s*「([\s\S]*?)」\s*$/;
    const RT_WL = new Set(["維達爾船長","槳手","商人","艾蒂安","馬蒂厄","伽桑狄","官員"]);
    const act = (name, args) => {
      const r = N3.labAction(s, name, args || {});
      if (r.error || r.ok === false) throw new Error(name + ":" + (r.error || r.reason));
      s = r.state;
      /* WB-CR-025 動態契約:每個真的會進對話框的 lastReply,逐行拆得動且講者可查立繪 */
      const db = s.lab && s.lab.caseFile && s.lab.caseFile.dossier && s.lab.caseFile.dossier.debate;
      if (db && db.lastReply) {
        for (const line of String(db.lastReply).split("\n").filter((t) => t.trim())) {
          const hit = line.match(SPOKEN_RT);
          if (!hit) throw new Error("runtime lastReply 拆不動:" + line.slice(0, 40));
          if (!RT_WL.has(hit[1])) throw new Error("runtime lastReply 講者不在白名單:" + hit[1]);
        }
      }
    };
    const draft = (field, value) => act("setDossierDraft", { field, value });
    const run = (stage, positionRecord) => {
      draft("stage", stage); draft("release", "latch"); draft("speedRecord", "beats");
      draft("positionRecord", positionRecord || "shore"); draft("repeats", 1);
      act("runDossierExperiment");
      act("fileDossierRecord");
    };
    while (!s.ended && guard++ < 300) {
      const v = N3.view(s);
      if (v.type === "line" || v.type === "system" || v.type === "histfacts") {
        const r = N3.advance(s); if (r.error) throw new Error(r.error); s = r.state; continue;
      }
      if (v.type === "choice") {
        const id = pick[v.scene]; if (!id) throw new Error("未定義黃金選項:" + v.scene);
        const r = N3.choose(s, id); if (r.error) throw new Error(r.error); s = r.state; continue;
      }
      if (v.type === "review") {
        s = N3.setReview(s, "同一事件從碼頭與桅杆量，使用的零點不同。",
          "排除前進必落後，沒有直接量到地球運動。").state;
        continue;
      }
      if (v.type === "embed" && v.system === "ship" && v.phase === "dossier") {
        /* 五輪依故事提問推進：重現起步後偏 → 走穩 → 比較 → 船艙 → 雙視角。 */
        for (let i = 0; i < 3; i++) run("depart", "shore");
        for (let i = 0; i < 3; i++) run("steady", "shore");
        for (const sourceId of ["R4","R5","R6"])
          act("selectDossierSource", { assertionId:"A1", sourceId });
        act("setDossierScope", { assertionId:"A1", choice:"controlled-three" });
        for (const sourceId of ["R1","R2","R3","R4","R5","R6"])
          act("selectDossierSource", { assertionId:"A3", sourceId });
        act("setDossierScope", { assertionId:"A3", choice:"today-comparison" });
        act("commitDossierCabinWindPlan", { choice:"close-cabin" });
        act("commitDossierCabinInstrument", { choice:"drip" });
        draft("stage", "dock");
        for (let i = 0; i < 3; i++) act("runDossierCabinComparison");
        draft("stage", "steady");
        for (let i = 0; i < 3; i++) act("runDossierCabinComparison");
        for (const sourceId of ["C1","C2","C3","C4","C5","C6"])
          act("selectDossierSource", { assertionId:"A2", sourceId });
        act("setDossierScope", { assertionId:"A2", choice:"local-only" });
        act("setDualDesign", { setup:CH3_DUAL_SETUP });
        run("steady", "dual");
        act("enterDossierDebate");

        let debateActions = 0;
        /* E-2b|A⁺ 劑量:先故意答錯一次,檢查「第一次被駁」的心聲會出現 */
        const wrongTry = N3.labAction(s, "answerDossierDebate", { pillar:"p1", step:"source", choice:"A3" });
        if (!wrongTry.state || !wrongTry.state.lab.caseFile.dossier.debate.lastOS)
          throw new Error("E-2b 第一柱被駁未播旅人心聲");
        s = wrongTry.state;
        act("answerDossierDebate", { pillar:"p1", step:"source", choice:"A1" }); debateActions++;
        act("answerDossierDebate", { pillar:"p1", step:"concept", choice:"shared-motion" }); debateActions++;
        act("answerDossierDebate", { pillar:"p1", step:"cabin", choice:"A2" }); debateActions++;
        if (!s.lab.caseFile.dossier.debate.pillars.p1 ||
            s.lab.caseFile.dossier.debate.current !== "p2")
          throw new Error("設計階段已公開限定風的主張，辯論沒有引用承諾直接收柱");
        act("answerDossierDebate", { pillar:"p2", step:"source", choice:"A3" }); debateActions++;
        act("answerDossierDebate", { pillar:"p2", step:"boundary", choice:"same-pattern-not-proof" }); debateActions++;
        act("answerDossierDebate", { pillar:"p2", step:"scope", choice:"tested-vessels-only" }); debateActions++;
        act("setDossierP3Premise", { step:"source", choice:"dual-papers" }); debateActions++;
        act("setDossierP3Premise", { step:"question", choice:"same-time-transform" }); debateActions++;
        act("setDossierP3Premise", { step:"concept", choice:"reference" }); debateActions++;
        act("alignDossierPapers", { choice:"same-beats" }); debateActions++;
        act("setDossierP3Premise", { step:"scope", choice:"same-event-time-only" }); debateActions++;
        act("transformDossierPapers", { choice:"subtract-each-beat" }); debateActions++;
        for (const beat of s.lab.caseFile.dossier.records.at(-1).papers.shore.beats) {
          act("transformDossierPaperBeat", { beat:beat.beat, appliedMastX:beat.mastX });
          debateActions++;
        }
        /* GB-ADR-035 明確補回原先被引擎代答的 P1 概念與 A4 範圍兩拍；
           其餘步數不增加，因此新上限由 15 調為 17。 */
        if (debateActions > 17) throw new Error("第三章普通辯論必要認知動作超過十七步:" + debateActions);
        const repBeforeOverclaim = s.rep;
        const overclaim = N3.labAction(s, "setDossierFinalBoundary", { choice:"overclaim" });
        if (overclaim.error || overclaim.result?.ok !== false ||
            overclaim.state.rep !== repBeforeOverclaim - 1)
          throw new Error("第三章終局把未量到的地球運動說成已證明，沒有扣全域信譽");
        const overclaimEvent = overclaim.state.eventLog.filter((event) => event.t === "rep").at(-1);
        if (!overclaimEvent || overclaimEvent.reason !== "把沒有量到的地球運動說成已經證明")
          throw new Error("第三章終局越界沒有留下信譽理由");
        s = overclaim.state;
        const finalBoundary = N3.labAction(s, "setDossierFinalBoundary", { choice:"honest" });
        if (finalBoundary.error || finalBoundary.ok === false)
          throw new Error("setDossierFinalBoundary:" + (finalBoundary.error || finalBoundary.reason) +
            ":" + JSON.stringify(s.lab.caseFile.dossier.debate.pillars));
        s = finalBoundary.state;

        const done = N3.embedComplete(s);
        if (done.error) throw new Error("dossier 閘未過:" + done.error);
        s = done.state;
        continue;
      }
      if (v.type === "end") { s = N3.advance(s).state; continue; }
      throw new Error("黃金路徑卡住:" + JSON.stringify(v));
    }
    if (!s.ended || guard >= 300) throw new Error("第三章未完章");
    for (const id of ["S5","G1","G2","G3","G4","G5"]) if (!s.evidence[id]) throw new Error("缺證據:" + id);
    if (!s.lab.caseFile.dossier.complete || !Object.values(s.lab.caseFile.dossier.debate.pillars).every(Boolean))
      throw new Error("卷宗或三柱未完成");
    /* E-2b|旅人心聲層:三柱各自的關鍵時刻都必須播過,且每句只播一次 */
    {
      const fired = s.lab.caseFile.dossier.debate.osFired || [];
      for (const key of ["p1-bad", "p1-done", "p2-mine", "p2-done", "p3-align", "p3-done"])
        if (fired.indexOf(key) < 0) throw new Error("E-2b 心聲未播:" + key);
      if (new Set(fired).size !== fired.length) throw new Error("E-2b 同一句心聲重複播出");
      if (fired.length > 10) throw new Error("E-2b 心聲超過 A⁺ 劑量上限 10 句:" + fired.length);
    }
    if (!s.review.q1 || !s.review.q2) throw new Error("章末回顧未保存");
    const saved = JSON.parse(N3.serialize(s));
    const clean = San.sanitizeImport3(saved, scenes3);
    if (!clean.ok) throw new Error("完整通關存檔遭拒:" + clean.reason);
  }
});

tests.push({
  name: "工作台對話框化|第三章辯論與第四章工作台皆走立繪、ack、同屏讓位(WB-CR-025/025b)",
  fn: () => {
    const read = (f) => readFileSync(path.join(here, "..", f), "utf-8");
    /* ① 格式契約:engine3 內所有 lastReply/dossierMissing 的說話字串,逐行必須拆得動。
       拆不動=chapter-ui 的 parseSpokenLine 會把它當旁白播,立繪與名牌全失效。 */
    const SPOKEN = /^([\u4e00-\u9fff·・A-Za-z]{1,8})：(?:（([^）]*)）)?\s*「([\s\S]*?)」\s*$/;
    const WHITELIST = new Set(["維達爾船長","槳手","商人","艾蒂安","馬蒂厄","伽桑狄","官員","牛頓","哈雷","旅人","旅人・心聲"]);
    const e3 = read("src/engine3.js");
    const spokenLines = [];
    const strRe = /"((?:[^"\\]|\\.)*)"/g;
    let m;
    while ((m = strRe.exec(e3))) {
      for (const line of m[1].replace(/\\n/g, "\n").split("\n")) {
        const head = line.match(/^([\u4e00-\u9fff·・A-Za-z]{1,8})：/);
        if (head && WHITELIST.has(head[1])) spokenLines.push(line);
      }
    }
    if (spokenLines.length < 30) throw new Error("辯論說話行抽樣異常(僅 " + spokenLines.length + " 行),掃描器可能壞了");
    for (const line of spokenLines) {
      /* 字串拼接的前半段(有「無」)交給動態驗證(全章走查會驗拼好的完整句);
         靜態只驗自足的行——抓「講者：台詞沒加引號」這類手誤。 */
      if (line.includes("「") && !line.includes("」")) continue;
      if (!SPOKEN.test(line))
        throw new Error("講者行格式不完整(拆不動,將以旁白顯示、失去立繪):" + line.slice(0, 40));
    }
    /* ② 橋契約:chapter-ui 必須有 parser 與 doShip 掛點 */
    const ui = read("src/chapter-ui.js");
    for (const kw of ["function parseSpokenLine", "function sayDebateBeat", "sayDebateBeat(dbPrev, action)"])
      if (!ui.includes(kw)) throw new Error("chapter-ui 缺對話框化掛點:" + kw);

    /* ③ 第四章 source-level 橋契約：七個 runtime embed 都要有教練句，
       D1-2 必須等 embark；真實事件、立繪、queue 與 ack 另由瀏覽器驗收。 */
    const stagePart = read("src/stage/05-events.part.js");
    const phaseAlias = { "tangent-seal": "tangent", "orbit-rule": "vectors" };
    const embedPhases = new Set();
    for (const scene of scenes4.scenes) for (const node of scene.nodes) {
      if (node.type !== "embed") continue;
      embedPhases.add(phaseAlias[node.phase] || node.phase);
    }
    const coachBlock = ui.match(/var ORBIT4_COACH_PHASES = \{([\s\S]*?)\n  \};/);
    if (!coachBlock) throw new Error("第四章教練句 phase 表遺失");
    for (const phase of embedPhases) {
      const escaped = phase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (!new RegExp(`(?:^|[,\\s])["']?${escaped}["']?\\s*:\\s*1(?:[,\\s]|$)`).test(coachBlock[1]))
        throw new Error("第四章 embed 缺對話框教練句:" + phase);
    }
    const assertOrbitBridge = (uiSource, stageSource) => {
      for (const kw of [
        "function orbit4SayCoach",
        "function orbit4FlushPendingCoach",
        'document.addEventListener("bd:embark"',
        "orbit4SayCoach(ek, phase, mission[3], v.scene)",
        "sayIntoDialogue(parseSpokenLine(pending.rawLine)",
        'action === "runConsequence"',
        'spokenRunResult = { speaker: "牛頓"',
        "if (spokenRunResult)"
      ]) if (!uiSource.includes(kw)) throw new Error("第四章工作台缺 source-level 對話橋:" + kw);
      if (!stageSource.includes('new CustomEvent("bd:embark"'))
        throw new Error("舞台未在玩家跨過閘門後通知第四章教練句");
    };
    assertOrbitBridge(ui, stagePart);
    let reverseRed = false;
    try {
      assertOrbitBridge(
        ui.replace("orbit4SayCoach(ek, phase, mission[3], v.scene);", ""),
        stagePart
      );
    } catch (_) {
      reverseRed = true;
    }
    if (!reverseRed) throw new Error("第四章對話框橋契約拔除後沒有轉紅");

    /* ④ 讓位契約：台詞播放時工作台保留在對話框上方；原「平時隱藏」規則不得被刪。 */
    const html = read("stage.html");
    if (!html.includes('body[data-view="ship"].queue-active #panelWrap'))
      throw new Error("stage.html 缺工作台讓位規則(對話框會壓住手牌)");
    if (!html.includes('body[data-view="orbit"].queue-active #panelWrap'))
      throw new Error("stage.html 缺第四章工作台讓位規則");
    if (!html.includes("body.queue-active #dialogue { display: block !important; }"))
      throw new Error("stage.html 缺 queue-active 對話框進場規則");
    if (!/body\[data-view="ship"\] #dialogue/.test(html))
      throw new Error("stage.html 遺失「平時隱藏」規則——對話框會恆常佔位,違反總監 20260720 裁定");
    if (html.includes("body.held #panelWrap { visibility: hidden; }"))
      throw new Error("held 仍把工作台整張紙藏掉，違反『紙與台詞同屏』");
    if (!html.includes('body.held:not([data-view="ship"]):not([data-view="lab"]):not([data-view="orbit"]) #panelWrap'))
      throw new Error("held 隱藏規則未排除工作台視圖");
    if (!html.includes("#controls.orbitLab .shipSelect { min-height:44px; }"))
      throw new Error("844×390 的第四章 select 缺足以覆蓋 #controls select 的 44px 規則");
  }
});

tests.push({
  name: "第三章生產性失敗|提早辯論會退回實驗，資料與已完成幾何不清空",
  fn: () => {
    let s = Engine3.initialState();
    const take = (r, label) => {
      if (!r || r.error || r.ok === false)
        throw new Error(label + ":" + (r && (r.error || r.reason) || "no-result"));
      s = r.state;
    };
    const set = (field, value) => take(Engine3.setDossierDraft(s, field, value), "set:" + field);
    const run = (stage, positionRecord) => {
      set("location", "deck"); set("stage", stage); set("release", "latch");
      set("speedRecord", "beats"); set("positionRecord", positionRecord);
      set("repeats", 1); set("sameStone", true); set("sameHeight", true);
      take(Engine3.runDossierExperiment(s), "run:" + stage);
      take(Engine3.fileDossierRecord(s), "file:" + stage);
    };

    for (let i = 0; i < 3; i++) run("depart", "shore");
    for (let i = 0; i < 3; i++) run("steady", "shore");
    for (const sourceId of ["R4","R5","R6"])
      take(Engine3.selectDossierSource(s, "A1", sourceId), "A1-source:" + sourceId);
    take(Engine3.setDossierScope(s, "A1", "controlled-three"), "A1-scope");
    for (const sourceId of ["R1","R2","R3","R4","R5","R6"])
      take(Engine3.selectDossierSource(s, "A3", sourceId), "A3-source:" + sourceId);
    take(Engine3.setDossierScope(s, "A3", "today-comparison"), "A3-scope");
    take(Engine3.commitDossierCabinWindPlan(s, "close-cabin"), "cabin-wind");
    take(Engine3.commitDossierCabinInstrument(s, "drip"), "cabin-instrument");
    set("stage", "dock");
    for (let i = 0; i < 3; i++) take(Engine3.runDossierCabinComparison(s), "cabin-dock:" + i);
    set("stage", "steady");
    for (let i = 0; i < 3; i++) take(Engine3.runDossierCabinComparison(s), "cabin-steady:" + i);
    for (const sourceId of ["C1","C2","C3","C4","C5","C6"])
      take(Engine3.selectDossierSource(s, "A2", sourceId), "A2-source:" + sourceId);
    take(Engine3.setDossierScope(s, "A2", "local-only"), "A2-scope");
    take(Engine3.setDualDesign(s, CH3_DUAL_SETUP), "dual-design");
    run("steady", "dual");

    take(Engine3.enterDossierDebate(s), "enter-p1");
    const skipped = Engine3.selectDossierPillar(s, "p2");
    if (skipped.error !== "dossier-pillar-locked")
      throw new Error("第一柱未破時竟可跳到第二柱");
    take(Engine3.answerDossierDebate(s, "p1", "source", "A1"), "p1-source");
    take(Engine3.answerDossierDebate(s, "p1", "concept", "shared-motion"), "p1-concept");
    take(Engine3.answerDossierDebate(s, "p1", "cabin", "A2"), "p1-cabin");
    if (!s.caseFile.dossier.debate.pillars.p1)
      throw new Error("設計階段已公開承諾關艙隔風，辯論卻要求玩家再答一次同一件事");
    take(Engine3.answerDossierDebate(s, "p2", "source", "A3"), "p2-source");
    take(Engine3.answerDossierDebate(s, "p2", "boundary", "same-pattern-not-proof"), "p2-boundary");
    take(Engine3.answerDossierDebate(s, "p2", "scope", "tested-vessels-only"), "p2-scope");
    take(Engine3.setDossierP3Premise(s, "source", "dual-papers"), "p3-source");
    take(Engine3.setDossierP3Premise(s, "question", "same-time-transform"), "p3-question");
    take(Engine3.setDossierP3Premise(s, "concept", "reference"), "p3-concept");
    take(Engine3.alignDossierPapers(s, "same-beats"), "p3-align");
    take(Engine3.setDossierP3Premise(s, "scope", "same-event-time-only"), "p3-scope");
    take(Engine3.leaveDossierDebate(s, "還缺逐拍換尺"), "leave-p3");
    if (!s.caseFile.dossier.assertions.A4 || !s.caseFile.dossier.debate.p3.aligned)
      throw new Error("中途離場清掉了已完成的同拍對齊");
    if (!s.caseFile.dossier.debate.pins.includes("還缺逐拍換尺"))
      throw new Error("中途離場沒有把未答質疑留在卷宗");
    take(Engine3.enterDossierDebate(s), "reenter-p3");
    if (s.caseFile.dossier.debate.current !== "p3")
      throw new Error("重返碼頭沒有回到尚未完成的第三柱");
    for (let i = 0; i < 6; i++) {
      const wrong = Engine3.transformDossierPapers(s, "translate-once");
      s = wrong.state;
    }
    if (s.caseFile.dossier.page !== "lab" || s.caseFile.dossier.debate.active)
      throw new Error("聲譽歸零後沒有回到實驗面");
    if (s.caseFile.dossier.records.length !== 7 || !s.caseFile.dossier.assertions.A1 ||
        !s.caseFile.dossier.assertions.A4 || !s.caseFile.dossier.debate.p3.aligned)
      throw new Error("辯論失敗清掉了資料、斷言或已完成幾何");
    if (!s.caseFile.dossier.debate.pins.length)
      throw new Error("辯論失敗回船後沒有留下可補作的質疑");
    const ui = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
    if (!ui.includes("碼頭留下的質疑") || !ui.includes("原紙、已寫下的斷言和答過的問題都會保留"))
      throw new Error("引擎保存質疑，但實驗台沒有把它呈現給玩家");
  }
});

tests.push({
  name: "第三章分段證據任務|重現起步後偏→走穩→比較→船艙→雙視角",
  fn: () => {
    let s = Engine3.initialState();
    const take = (r, label) => {
      if (!r || r.error || r.ok === false)
        throw new Error(label + ":" + (r && (r.error || r.reason) || "no-result"));
      s = r.state;
      return r;
    };
    const set = (field, value) => take(Engine3.setDossierDraft(s, field, value), "set:" + field);
    const runAndFile = (stage, position) => {
      set("stage", stage); set("positionRecord", position);
      take(Engine3.runDossierExperiment(s), "run:" + stage + ":" + position);
      const pending = s.caseFile.dossier.pendingRecord;
      take(Engine3.fileDossierRecord(s), "file:" + stage + ":" + position);
      return pending;
    };

    /* 第一輪先重現維達爾船長舊紙：任意輸入都收回解纜起步、單一岸紙。 */
    set("release", "latch"); set("speedRecord", "beats"); set("repeats", 3);
    let row = runAndFile("brake", "dual");
    if (row.stage !== "depart" || row.positionRecord !== "shore" || row.dualPapers ||
        row.classification !== "正在變快" || row.landing !== "aft")
      throw new Error("第一輪沒有鎖回解纜起步並重現桅後落點");
    if (s.caseFile.dossier.records.length !== 1 || row.repeats !== 1)
      throw new Error("一次執行沒有嚴格只留下單張原紙");
    row = runAndFile("steady", "shore");
    if (row.stage !== "depart") throw new Error("三張重現完成前提前離開解纜起步");
    row = runAndFile("steady", "shore");
    if (row.stage !== "depart") throw new Error("第三張重現沒有保留解纜起步");

    /* 第二輪才改成走穩；其餘控制維持第一輪設定。 */
    row = runAndFile("brake", "dual");
    if (row.stage !== "steady" || row.positionRecord === "dual" || row.dualPapers)
      throw new Error("第二輪沒有鎖回走穩單視角");
    row = runAndFile("steady", "shore");
    row = runAndFile("steady", "shore");
    for (const sourceId of ["R4","R5","R6"])
      take(Engine3.selectDossierSource(s, "A1", sourceId), "A1-source:" + sourceId);
    take(Engine3.setDossierScope(s, "A1", "controlled-three"), "A1-scope");

    const redundantRun = Engine3.runDossierExperiment(s);
    if (redundantRun.error !== "dossier-use-existing-comparison")
      throw new Error("比較階段仍可新增實驗，沒有使用前兩輪原紙");
    for (const sourceId of ["R1","R2","R3","R4","R5","R6"])
      take(Engine3.selectDossierSource(s, "A3", sourceId), "A3-source:" + sourceId);
    take(Engine3.setDossierScope(s, "A3", "today-comparison"), "A3-scope");

    /* 比較斷言完成後才進船艙。 */
    take(Engine3.commitDossierCabinWindPlan(s, "close-cabin"), "cabin-wind");
    take(Engine3.commitDossierCabinInstrument(s, "drip"), "cabin-instrument");
    const cabinDay = s.days;
    set("stage", "dock");
    for (let i = 0; i < 3; i++) take(Engine3.runDossierCabinComparison(s), "cabin-dock:" + i);
    set("stage", "steady");
    for (let i = 0; i < 2; i++) take(Engine3.runDossierCabinComparison(s), "cabin-steady:" + i);
    for (const sourceId of ["C1","C2","C3","C4","C5"])
      take(Engine3.selectDossierSource(s, "A2", sourceId), "A2-source:" + sourceId);
    const incompleteCabin = Engine3.setDossierScope(s, "A2", "local-only");
    if (incompleteCabin.ok !== false || incompleteCabin.reason !== "dossier-too-few-records")
      throw new Error("五張船艙原紙竟可冒充三加三對照");
    take(Engine3.runDossierCabinComparison(s), "cabin-steady:2");
    take(Engine3.selectDossierSource(s, "A2", "C6"), "A2-source:C6");
    if (s.days !== cabinDay + 6) throw new Error("六張船艙原紙沒有逐趟計時");
    take(Engine3.setDossierScope(s, "A2", "local-only"), "A2-scope");

    take(Engine3.setDualDesign(s, CH3_DUAL_SETUP), "dual-design");
    row = runAndFile("brake", "dual");
    if (row.stage !== "steady" || !row.dualPapers)
      throw new Error("第五輪沒有鎖回走穩雙視角原紙");

    /* 核心五輪完成後才恢復自由補強，收槳不得再被任務鎖回。 */
    row = runAndFile("brake", "shore");
    if (row.stage !== "brake") throw new Error("核心卷宗完成後仍未開放自由補強");
  }
});

tests.push({
  name: "第三章分段實驗室|地點相容、三種紀錄方案與一二回辯論退件",
  fn: () => {
    const ui = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
    for (const phrase of [
      "船的狀態", "停泊（繫纜不動）", "出港平駛（先等船走穩）",
      "船況固定為解纜後第一段",
      "徒手鬆開", "剪斷細繩", "抽開門閂", "不記船速", "舵手只用嘴說",
      "水手等拍敲鼓；若安排岸上記錄，艾蒂安每拍點一次船位", "船上的伽桑狄以桅腳為零點",
      "岸上的艾蒂安以碼頭繫船柱為零點", "岸、船各記一張紙", "一回", "二回", "三回",
      "慢槳", "半槳", "滿槳", "輕加槳", "全力加槳", "慢拍", "中拍", "快拍"
    ]) if (!ui.includes(phrase)) throw new Error("第三章實驗室缺白話設定:" + phrase);

    const set = (state, field, value) => {
      const result = Engine3.setDossierDraft(state, field, value);
      if (result.error) throw new Error(field + ":" + result.error);
      return result.state;
    };
    const prepare = (paperCount) => {
      let state = Engine3.initialState();
      state = set(state, "location", "deck");
      state = set(state, "stage", "steady");
      state = set(state, "release", "latch");
      state = set(state, "speedRecord", "beats");
      state = set(state, "positionRecord", "shore");
      /* 即使舊欄位選「三回」，一次執行仍只能產一張原紙。 */
      state = set(state, "repeats", 3);
      for (let i = 0; i < paperCount; i++) {
        const run = Engine3.runDossierExperiment(state);
        if (run.error) throw new Error("乾淨試航失敗:" + run.error);
        const filed = Engine3.fileDossierRecord(run.state);
        if (filed.error) throw new Error("原紙收卷失敗:" + filed.error);
        state = filed.state;
      }
      if (state.caseFile.dossier.records.length !== paperCount ||
          state.caseFile.dossier.records.some((row) => row.repeats !== 1))
        throw new Error("重複下拉仍能代替玩家逐趟留下原紙");
      return state;
    };

    const oneDebate = Engine3.enterDossierDebate(prepare(1));
    if (oneDebate.error || !oneDebate.blocked || oneDebate.reason !== "one-run")
      throw new Error("一回紀錄沒有被辯論退件");
    if (!oneDebate.state.caseFile.dossier.debate.lastReply.includes("一回只能告訴我那一回"))
      throw new Error("一回退件沒有說清楚重複性缺口");

    const twoDebate = Engine3.enterDossierDebate(prepare(2));
    if (twoDebate.error || !twoDebate.blocked || twoDebate.reason !== "two-runs")
      throw new Error("兩回紀錄沒有被辯論退件");
    if (!twoDebate.state.caseFile.dossier.debate.lastReply.includes("再做一回"))
      throw new Error("兩回退件沒有指明下一步");

    let freeCabin = Engine3.initialState();
    Object.assign(freeCabin.caseFile.dossier.assertions, { A1:true, A2:true, A3:true });
    freeCabin = Engine3.setDualDesign(freeCabin, CH3_DUAL_SETUP).state;
    const realDual = Engine3.runDossierExperiment(freeCabin);
    if (realDual.error || !realDual.record.dualPapers ||
        !realDual.record.papers.shore || !realDual.record.papers.ship)
      throw new Error("自由補強前沒有產生可驗證的真實雙紙來源");
    const filedDual = Engine3.fileDossierRecord(realDual.state);
    if (filedDual.error) throw new Error("真實雙紙來源無法收卷:" + filedDual.error);
    freeCabin = filedDual.state;
    freeCabin = set(freeCabin, "positionRecord", "dual");
    const fakeCabinSetting = Engine3.setDossierDraft(freeCabin, "location", "cabin");
    if (fakeCabinSetting.error !== "dossier-location-fixed" ||
        fakeCabinSetting.state.caseFile.dossier.draft.location !== "deck")
      throw new Error("已移除的實驗地點假變因仍可把桅頂落石改進船艙");

    let cabin = Engine3.initialState();
    cabin = set(cabin, "positionRecord", "dual");
    const cabinSetting = Engine3.setDossierDraft(cabin, "location", "cabin");
    if (cabinSetting.error !== "dossier-location-fixed" ||
        cabinSetting.state.caseFile.dossier.draft.positionRecord !== "dual")
      throw new Error("船艙獨立任務沒有鎖住桅頂落石的地點假變因");
    if (Engine3.runDossierCabinComparison(cabin).error !== "steady-assertion-required")
      throw new Error("第一句斷言尚未成立，船艙主線卻能提前執行");
    cabin.caseFile.dossier.assertions.A1 = true;
    if (Engine3.runDossierCabinComparison(cabin).error !== "speed-assertion-required")
      throw new Error("起步／走穩比較尚未成立，船艙主線卻能提前執行");
    cabin.caseFile.dossier.assertions.A3 = true;
    if (Engine3.runDossierCabinComparison(cabin).error !== "cabin-wind-plan-required")
      throw new Error("尚未決定隔風方法，舊單回 API 卻能提前產生船艙原紙");
    cabin = Engine3.commitDossierCabinWindPlan(cabin, "close-cabin").state;
    if (Engine3.runDossierCabinComparison(cabin).error !== "cabin-instrument-required")
      throw new Error("尚未選吊壺或石球，舊單回 API 卻能免費產生雙項結果");
    cabin = Engine3.commitDossierCabinInstrument(cabin, "drip").state;
    cabin = set(cabin, "stage", "dock");
    let cabinComparison = Engine3.runDossierCabinComparison(cabin);
    if (cabinComparison.error || !cabinComparison.state.caseFile.dossier.blind.ran ||
        cabinComparison.state.caseFile.dossier.blind.records.length !== 1)
      throw new Error("一次船艙執行沒有只留下單張對照原紙");
    cabin = cabinComparison.state;
    for (let i = 1; i < 3; i++) cabin = Engine3.runDossierCabinComparison(cabin).state;
    cabin = set(cabin, "stage", "steady");
    for (let i = 0; i < 3; i++) cabin = Engine3.runDossierCabinComparison(cabin).state;
    const cabinRows = cabin.caseFile.dossier.blind.records;
    if (cabinRows.length !== 6 ||
        cabinRows.filter((row) => row.stage === "dock").length !== 3 ||
        cabinRows.filter((row) => row.stage === "steady").length !== 3)
      throw new Error("船艙配置沒有形成停泊三張／走穩三張對照");

    let stringRun = Engine3.initialState();
    stringRun = set(stringRun, "location", "deck");
    stringRun = set(stringRun, "release", "string");
    stringRun = set(stringRun, "speedRecord", "verbal");
    stringRun = set(stringRun, "positionRecord", "shore");
    stringRun = set(stringRun, "repeats", 3);
    const stringResult = Engine3.runDossierExperiment(stringRun);
    if (stringResult.error || stringResult.record.release !== "string" ||
        stringResult.record.speedRecord !== "verbal" || stringResult.record.positionRecord !== "shore")
      throw new Error("三種新設定沒有完整寫進原始紀錄");
    if (stringResult.state.caseFile.dossier.records.length !== 0 ||
        !stringResult.state.caseFile.dossier.pendingRecord)
      throw new Error("實驗結束後未先停在待簽原紙");
  }
});

tests.push({
  name: "第三章斷言取證|先選斷言、錯紙遭拒、船艙兩組六張對照缺一不可",
  fn: () => {
    const set = (state, field, value) => {
      const result = Engine3.setDossierDraft(state, field, value);
      if (result.error) throw new Error(field + ":" + result.error);
      return result.state;
    };
    let s = Engine3.initialState();
    s = set(s, "release", "latch");
    s = set(s, "speedRecord", "beats");
    s = set(s, "positionRecord", "shore");
    s = set(s, "repeats", 3);
    s = set(s, "stage", "depart");
    for (let i = 0; i < 3; i++) {
      s = Engine3.runDossierExperiment(s).state;
      s = Engine3.fileDossierRecord(s).state;
    }
    s = set(s, "stage", "steady");
    for (let i = 0; i < 3; i++) {
      s = Engine3.runDossierExperiment(s).state;
      s = Engine3.fileDossierRecord(s).state;
    }
    const empty = Engine3.setDossierScope(s, "A1", "controlled-three");
    if (empty.ok !== false || empty.reason !== "dossier-source-mismatch")
      throw new Error("沒有選原紙仍可成立走穩斷言");
    s = Engine3.selectDossierSource(s, "A1", "OLD").state;
    const wrong = Engine3.setDossierScope(s, "A1", "controlled-three");
    if (wrong.ok !== false || wrong.reason !== "dossier-source-mismatch")
      throw new Error("缺船速的舊紙竟能支持走穩斷言");
    s = Engine3.selectDossierSource(s, "A1", "OLD").state;
    s = Engine3.selectDossierSource(s, "A1", "R4").state;
    const tooFew = Engine3.setDossierScope(s, "A1", "controlled-three");
    if (tooFew.ok !== false || tooFew.reason !== "dossier-too-few-records")
      throw new Error("一張走穩原紙竟可冒充三次獨立執行");
    s = Engine3.selectDossierSource(s, "A1", "R5").state;
    s = Engine3.selectDossierSource(s, "A1", "R6").state;
    const right = Engine3.setDossierScope(s, "A1", "controlled-three");
    if (right.error || right.ok !== true || !right.state.caseFile.dossier.assertions.A1 ||
        right.state.caseFile.dossier.assertionSources.A1.join(",") !== "R4,R5,R6")
      throw new Error("乾淨走穩原紙沒有形成可追溯斷言");

    s = right.state;
    for (const sourceId of ["R1","R2","R3","R4","R5","R6"])
      s = Engine3.selectDossierSource(s, "A3", sourceId).state;
    const compared = Engine3.setDossierScope(s, "A3", "today-comparison");
    if (compared.error || compared.ok !== true || !compared.state.caseFile.dossier.assertions.A3)
      throw new Error("起步與走穩原紙沒有形成比較斷言");
    s = compared.state;
    s = Engine3.commitDossierCabinWindPlan(s, "close-cabin").state;
    s = Engine3.commitDossierCabinInstrument(s, "drip").state;
    s = set(s, "stage", "dock");
    for (let i = 0; i < 3; i++) s = Engine3.runDossierCabinComparison(s).state;
    s = set(s, "stage", "steady");
    for (let i = 0; i < 3; i++) s = Engine3.runDossierCabinComparison(s).state;
    const tamperedCabin = JSON.parse(JSON.stringify(s));
    tamperedCabin.caseFile.dossier.blind.records[0].water = "水面固定偏向左舷";
    let tamperedSelection = tamperedCabin;
    for (const sourceId of ["C1","C2","C3","C4","C5","C6"])
      tamperedSelection = Engine3.selectDossierSource(tamperedSelection, "A2", sourceId).state;
    const tamperedClaim = Engine3.setDossierScope(tamperedSelection, "A2", "local-only");
    if (tamperedClaim.ok !== false || tamperedClaim.reason !== "dossier-cabin-paper-mismatch")
      throw new Error("內容遭竄改的船艙原紙仍能成立斷言");
    const San = require("../src/sanitize.js");
    if (San.sanitizeImport3(tamperedCabin, scenes3).ok)
      throw new Error("匯入閘接受了內容與船況不一致的船艙原紙");
    for (const sourceId of ["C1","C2","C3","C4","C5"])
      s = Engine3.selectDossierSource(s, "A2", sourceId).state;
    const half = Engine3.setDossierScope(s, "A2", "local-only");
    if (half.ok !== false || half.reason !== "dossier-too-few-records")
      throw new Error("五張船艙原紙仍能成立三加三對照");
    s = Engine3.selectDossierSource(s, "A2", "C6").state;
    const pair = Engine3.setDossierScope(s, "A2", "local-only");
    if (pair.error || pair.ok !== true || !pair.state.caseFile.dossier.assertions.A2)
      throw new Error("停泊與走穩兩張船艙紙沒有形成斷言");

    const ui = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
    for (const leak of ["A1｜", "A2｜", "A3｜", "A4｜", "A5｜", "S4｜"])
      if (ui.includes(leak)) throw new Error("玩家介面仍顯示內部斷言代碼:" + leak);
    for (const phrase of [
      "每一輪先把可能的斷言攤開。選一句，再勾能支撐它的原紙",
      "碼頭待辦：", "岸上船速紙"
    ])
      if (!ui.includes(phrase)) throw new Error("第三章取證介面缺白話提示:" + phrase);
  }
});

tests.push({
  name: "第三章可見船速契約|船上紙不得暗用岸紙、岸紙可分類、舊存檔相容",
  fn: () => {
    const set = (state, field, value) => {
      const result = Engine3.setDossierDraft(state, field, value);
      if (result.error) throw new Error(field + ":" + result.error);
      return result.state;
    };
    const runAndFile = (positionRecord) => {
      let state = Engine3.initialState();
      /* 先依本章新順序重現維達爾船長的解纜起步，再測指定的走穩記錄方案。 */
      for (let i = 0; i < 3; i++) {
        for (const [field, value] of Object.entries({
          stage:"depart", release:"latch", speedRecord:"beats",
          positionRecord:"shore", repeats:3
        })) state = set(state, field, value);
        const ran = Engine3.runDossierExperiment(state);
        if (ran.error) throw new Error("depart:" + ran.error);
        const filed = Engine3.fileDossierRecord(ran.state);
        if (filed.error) throw new Error("depart:" + filed.error);
        state = filed.state;
      }
      for (let i = 0; i < 3; i++) {
        for (const [field, value] of Object.entries({
          stage:"steady", release:"latch", speedRecord:"beats",
          positionRecord, repeats:3
        })) state = set(state, field, value);
        const ran = Engine3.runDossierExperiment(state);
        if (ran.error) throw new Error(positionRecord + ":" + ran.error);
        const filed = Engine3.fileDossierRecord(ran.state);
        if (filed.error) throw new Error(positionRecord + ":" + filed.error);
        state = filed.state;
      }
      return state;
    };

    const deckOnly = runAndFile("deck");
    if (deckOnly.caseFile.dossier.records[3].classification !== "有等拍鼓點・缺岸上船位・未分類" ||
        deckOnly.caseFile.dossier.records.slice(3).some((row) => row.papers.shore))
      throw new Error("只有船上紙仍暗用岸上船速資料分類");
    if (deckOnly.caseFile.dossier.candidates.A1)
      throw new Error("只有船上紙竟浮出可提交的走穩斷言");
    const deckClaim = Engine3.selectDossierSource(deckOnly, "A1", "R4");
    if (deckClaim.error !== "dossier-candidate-required")
      throw new Error("只有船上紙沒有在選紙前就被候選門檻擋下");

    let shore = runAndFile("shore");
    if (shore.caseFile.dossier.records[3].classification !== "近似穩速" ||
        !shore.caseFile.dossier.candidates.A1)
      throw new Error("可見岸上船速紙沒有解鎖走穩分類");
    for (const sourceId of ["R4","R5","R6"])
      shore = Engine3.selectDossierSource(shore, "A1", sourceId).state;
    const shoreClaim = Engine3.setDossierScope(shore, "A1", "controlled-three");
    if (shoreClaim.error || shoreClaim.ok !== true)
      throw new Error("岸上船速紙不能支持走穩斷言");

    let legacy = runAndFile("shore");
    legacy.caseFile.dossier.records.forEach((row) => { delete row.papers; });
    for (const sourceId of ["R4","R5","R6"])
      legacy = Engine3.selectDossierSource(legacy, "A1", sourceId).state;
    const legacyClaim = Engine3.setDossierScope(legacy, "A1", "controlled-three");
    if (legacyClaim.error || legacyClaim.ok !== true)
      throw new Error("缺少 papers 欄位的合法舊岸紙存檔失去相容性");
  }
});

tests.push({
  name: "第三章模式分級|探索展開檢核、學者收合診斷，物理結果與通關標準一致",
  fn: () => {
    const stageHtml = readFileSync(path.join(here, "../stage.html"), "utf-8");
    const chapterHtml = readFileSync(path.join(here, "../chapter3.html"), "utf-8");
    const ui = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
    for (const phrase of [
      "適合國中起步", "檢核預設展開", "失敗後直接說明缺口",
      "適合高中與成人挑戰", "提示與完整診斷預設收合"
    ]) {
      if (!stageHtml.includes(phrase) || !chapterHtml.includes(phrase))
        throw new Error("第三章模式入口缺少難度說明:" + phrase);
    }
    for (const contract of [
      "support.open = ship3ExploreMode() || ship3DossierHintOpen",
      "需要提示時展開本輪檢核",
      "if (!ship3ExploreMode() && ship3DossierDiagnosis)",
      "查看卷宗診斷",
      "原紙還不夠，斷言暫時不能提交",
      "ship3DossierScopeOptions(id, d).forEach"
    ]) {
      if (!ui.includes(contract)) throw new Error("第三章模式差異未接到實際介面:" + contract);
    }
    if (ui.includes("ship3DossierCorrectScope"))
      throw new Error("學者模式仍由介面暗中代選正確斷言");

    const N3 = Narrative._factory(scenes3, Engine3, {});
    const coreLab = (mode) => {
      let state = N3.initialState(mode);
      const act = (action, args) => {
        const out = N3.labAction(state, action, args || {});
        if (out.error || (out.result && out.result.ok === false))
          throw new Error(mode + ":" + action + ":" + (out.error || out.result.reason));
        state = out.state;
      };
      const run = (stage, positionRecord) => {
        for (const [field, value] of Object.entries({
          stage, release:"latch", speedRecord:"beats", positionRecord,
          repeats:1, sameStone:true, sameHeight:true
        })) act("setDossierDraft", { field, value });
        act("runDossierExperiment");
        act("fileDossierRecord");
      };
      for (let i = 0; i < 3; i++) run("depart", "shore");
      for (let i = 0; i < 3; i++) run("steady", "shore");
      for (const sourceId of ["R4","R5","R6"])
        act("selectDossierSource", { assertionId:"A1", sourceId });
      act("setDossierScope", { assertionId:"A1", choice:"controlled-three" });
      for (const sourceId of ["R1","R2","R3","R4","R5","R6"])
        act("selectDossierSource", { assertionId:"A3", sourceId });
      act("setDossierScope", { assertionId:"A3", choice:"today-comparison" });
      act("commitDossierCabinWindPlan", { choice:"close-cabin" });
      act("commitDossierCabinInstrument", { choice:"drip" });
      act("setDossierDraft", { field:"stage", value:"dock" });
      for (let i = 0; i < 3; i++) act("runDossierCabinComparison");
      act("setDossierDraft", { field:"stage", value:"steady" });
      for (let i = 0; i < 3; i++) act("runDossierCabinComparison");
      for (const sourceId of ["C1","C2","C3","C4","C5","C6"])
        act("selectDossierSource", { assertionId:"A2", sourceId });
      act("setDossierScope", { assertionId:"A2", choice:"local-only" });
      act("setDualDesign", { setup:CH3_DUAL_SETUP });
      run("steady", "dual");
      return state.lab;
    };
    if (JSON.stringify(coreLab("explore")) !== JSON.stringify(coreLab("scholar")))
      throw new Error("探索與學者模式產生了不同物理資料或不同實驗門檻");
  }
});

tests.push({
  name: "第三章舊卷宗續玩|已有走穩斷言但缺起步紙時，可補重現再完成比較",
  fn: () => {
    let state = Engine3.initialState();
    const take = (result, label) => {
      if (!result || result.error || result.ok === false)
        throw new Error(label + ":" + (result && (result.error || result.reason) || "no-result"));
      state = result.state;
      return result;
    };
    const set = (field, value) => take(Engine3.setDossierDraft(state, field, value), "set:" + field);
    const run = (stage, positionRecord) => {
      set("stage", stage); set("release", "latch"); set("speedRecord", "beats");
      set("positionRecord", positionRecord); set("repeats", 1);
      take(Engine3.runDossierExperiment(state), "run:" + stage);
      take(Engine3.fileDossierRecord(state), "file:" + stage);
    };
    for (let i = 0; i < 3; i++) run("depart", "shore");
    for (let i = 0; i < 3; i++) run("steady", "shore");
    for (const sourceId of ["R4","R5","R6"])
      take(Engine3.selectDossierSource(state, "A1", sourceId), "A1:" + sourceId);
    take(Engine3.setDossierScope(state, "A1", "controlled-three"), "A1-scope");

    /* 模擬舊存檔：已有 A1 與三張走穩紙，但當時尚未要求先重現維達爾船長航程。 */
    state.caseFile.dossier.records = state.caseFile.dossier.records.filter((row) => row.stage === "steady");
    state.caseFile.dossier.assertions.A3 = false;
    state.caseFile.dossier.draft.location = "cabin";
    const firstRecovery = Engine3.runDossierExperiment(state);
    if (firstRecovery.error || firstRecovery.record.stage !== "depart" ||
        firstRecovery.record.location !== "deck")
      throw new Error("舊存檔沒有自動回到可執行的甲板起步重現");
    state = Engine3.fileDossierRecord(firstRecovery.state).state;
    for (let i = 1; i < 3; i++) {
      const ran = Engine3.runDossierExperiment(state);
      if (ran.error || ran.record.stage !== "depart")
        throw new Error("舊存檔補做途中提前離開起步重現");
      state = Engine3.fileDossierRecord(ran.state).state;
    }
    const departIds = state.caseFile.dossier.records
      .filter((row) => row.stage === "depart").map((row) => "R" + row.id);
    for (const sourceId of ["R4","R5","R6"].concat(departIds))
      take(Engine3.selectDossierSource(state, "A3", sourceId), "A3:" + sourceId);
    const recovered = Engine3.setDossierScope(state, "A3", "today-comparison");
    if (recovered.error || recovered.ok !== true || !recovered.state.caseFile.dossier.assertions.A3)
      throw new Error("舊存檔補齊起步紙後仍無法完成起步／走穩比較");
  }
});

tests.push({
  name: "第三章原紙生成|執行後待簽、觀察位置不補畫、變因留下可讀後果",
  fn: () => {
    const set = (state, field, value) => {
      const result = Engine3.setDossierDraft(state, field, value);
      if (result.error) throw new Error(field + ":" + result.error);
      return result.state;
    };
    const prepare = (patch, explore = false) => {
      let state = Engine3.initialState();
      if (explore) {
        Object.assign(state.caseFile.dossier.assertions, { A1:true, A2:true, A3:true });
        state = Engine3.setDualDesign(state, CH3_DUAL_SETUP).state;
        const dualRun = Engine3.runDossierExperiment(state);
        if (dualRun.error || !dualRun.record.dualPapers ||
            !dualRun.record.papers.shore || !dualRun.record.papers.ship)
          throw new Error("自由探索前沒有產生有效雙紙來源");
        const dualFile = Engine3.fileDossierRecord(dualRun.state);
        if (dualFile.error) throw new Error("有效雙紙來源無法收卷:" + dualFile.error);
        state = dualFile.state;
      }
      const base = {
        location:"deck", stage:"steady", release:"latch", speedRecord:"beats",
        positionRecord:"shore", repeats:3, speedBand:"mid", forceBand:"hard", beatBand:"mid"
      };
      Object.entries({ ...base, ...patch }).forEach(([field, value]) => { state = set(state, field, value); });
      return state;
    };

    let shore = prepare({ positionRecord:"shore" });
    const ran = Engine3.runDossierExperiment(shore);
    if (ran.error || ran.state.caseFile.dossier.records.length !== 0 ||
        !ran.state.caseFile.dossier.pendingRecord)
      throw new Error("執行後沒有停在待簽原紙");
    const pending = ran.state.caseFile.dossier.pendingRecord;
    if (!pending.papers.shore || pending.papers.ship)
      throw new Error("只安排岸上觀察卻補畫了船上原紙");
    if (!pending.animation || pending.animation.path.length < 10 ||
        pending.papers.shore.beats.length < 3)
      throw new Error("動畫與岸紙沒有共用足夠的逐拍資料");
    if (Engine3.setDossierDraft(ran.state, "stage", "brake").error !== "dossier-paper-pending")
      throw new Error("待簽原紙仍可被改方案覆蓋");
    const filed = Engine3.fileDossierRecord(ran.state);
    if (filed.error || filed.state.caseFile.dossier.records.length !== 1 ||
        filed.state.caseFile.dossier.pendingRecord || !filed.record.filed)
      throw new Error("簽名後沒有把待簽原紙轉成卷宗紀錄");

    const slow = Engine3.runDossierExperiment(prepare({ positionRecord:"dual", beatBand:"slow" }, true));
    const fast = Engine3.runDossierExperiment(prepare({ positionRecord:"dual", beatBand:"fast" }, true));
    if (slow.record.papers.shore.beats.length >= fast.record.papers.shore.beats.length)
      throw new Error("慢拍與快拍沒有留下不同點數");
    if (!(slow.record.papers.shore.readingError < fast.record.papers.shore.readingError))
      throw new Error("快拍沒有承擔較大的讀值誤差");
    if (fast.record.classification !== "船速無法判讀・未分類")
      throw new Error("快鼓高誤差原紙竟被判成可分類船況:" + fast.record.classification);
    if (!slow.record.papers.ship || !fast.record.papers.ship)
      throw new Error("雙觀察沒有各自留下兩張原紙");

    const soft = Engine3.runDossierExperiment(prepare({ stage:"depart", forceBand:"soft" }, true));
    const hard = Engine3.runDossierExperiment(prepare({ stage:"depart", forceBand:"hard" }, true));
    if (!(Math.abs(soft.record.offsets[0]) < Math.abs(hard.record.offsets[0])))
      throw new Error("輕／重加槳沒有改變可觀察偏移量");
    const steadyControl = Engine3.runDossierExperiment(prepare({ stage:"steady" }, true));
    if (hard.record.animation.path.length !== steadyControl.record.animation.path.length ||
        hard.record.animation.path.some((point, index) =>
          Math.abs(point.stoneX - steadyControl.record.animation.path[index].stoneX) > 0.001))
      throw new Error("起步／走穩比較同時改變了石頭離手瞬間的向前速度");
    const weakBrake = Engine3.runDossierExperiment(prepare({
      vesselId:"large", stage:"brake", forceBand:"soft"
    }, true));
    if (weakBrake.record.classification === "近似穩速")
      throw new Error("讀值不足以辨認的弱減速原紙被錯收成近似穩速");
    const forgedBrake = weakBrake.state;
    forgedBrake.caseFile.dossier.assertions.A1 = false;
    forgedBrake.caseFile.dossier.pendingRecord.classification = "近似穩速";
    const forgedFiled = Engine3.fileDossierRecord(forgedBrake);
    const forgedA1 = forgedFiled.state.caseFile.dossier.candidates.A1;
    if (forgedFiled.error || (forgedA1 &&
        forgedA1.records.includes(weakBrake.record.id)))
      throw new Error("非走穩且落在桅前的原紙可冒充 A1 候選");
    const slowShip = Engine3.runDossierExperiment(prepare({ speedBand:"slow" }, true));
    const fastShip = Engine3.runDossierExperiment(prepare({ speedBand:"fast" }, true));
    if (slowShip.record.landing !== fastShip.record.landing ||
        Math.abs(slowShip.record.offsets[0] - fastShip.record.offsets[0]) > 0.001)
      throw new Error("穩速快慢錯誤改變了理想相對落點");
    for (const stage of ["depart", "brake"]) {
      const slowMotion = Engine3.runDossierExperiment(
        prepare({ stage, speedBand:"slow" }, true));
      const fastMotion = Engine3.runDossierExperiment(
        prepare({ stage, speedBand:"fast" }, true));
      if (slowMotion.error || fastMotion.error)
        throw new Error(stage + " 航速三檔無法執行");
      const slowPath = slowMotion.record.animation.path;
      const fastPath = fastMotion.record.animation.path;
      const sample = Math.min(2, slowPath.length - 1, fastPath.length - 1);
      if (!(fastPath[sample].stoneX > slowPath[sample].stoneX))
        throw new Error(stage + " 的航速選項沒有改變岸上看到的共同前行速度");
      if (slowMotion.record.landing !== fastMotion.record.landing ||
          Math.abs(slowMotion.record.offsets[0] - fastMotion.record.offsets[0]) > 0.001)
        throw new Error(stage + " 的航速錯誤改變相對桅杆落點");
    }

    /* 三態斷言不能在尚未做過減速實驗時搶先出現。 */
    let beforeBrake = prepare({}, true);
    if (beforeBrake.caseFile.dossier.candidates.S4)
      throw new Error("尚未取得減速原紙，三種船況斷言已提前出現");
    const oneBrakeRun = Engine3.runDossierExperiment(
      prepare({ stage:"brake" }, true));
    const oneBrakeFile = Engine3.fileDossierRecord(oneBrakeRun.state);
    if (oneBrakeRun.error || oneBrakeFile.error ||
        !oneBrakeFile.state.caseFile.dossier.candidates.S4)
      throw new Error("第一張合格減速原紙出現後，三態候選沒有浮出");
    const oneBrakeId = "R" + oneBrakeFile.record.id;
    const oneBrakePicked = Engine3.selectDossierSource(
      oneBrakeFile.state, "S4", oneBrakeId);
    const tooEarly = Engine3.setDossierScope(
      oneBrakePicked.state, "S4", "today-three-states");
    if (tooEarly.ok !== false ||
        !["dossier-too-few-records","dossier-comparison-missing"].includes(tooEarly.reason))
      throw new Error("只有一張減速原紙竟能成立三態斷言");

    /* 徒手／剪繩的固定差異序列須依同一完整設定的重做次數輪替，
       不能被中間插入的其他原紙或全域 R 編號打亂。 */
    let repeated = prepare({ release:"hand" }, true);
    const handRows = [];
    for (let trial = 0; trial < 3; trial++) {
      let handRun = Engine3.runDossierExperiment(repeated);
      if (handRun.error) throw new Error("徒手重做失敗:" + handRun.error);
      handRows.push(handRun.record);
      let handFile = Engine3.fileDossierRecord(handRun.state);
      if (handFile.error) throw new Error("徒手原紙收卷失敗:" + handFile.error);
      repeated = handFile.state;
      if (trial === 0) {
        repeated = set(repeated, "release", "string");
        const otherRun = Engine3.runDossierExperiment(repeated);
        if (otherRun.error) throw new Error("插入剪繩原紙失敗:" + otherRun.error);
        const otherFile = Engine3.fileDossierRecord(otherRun.state);
        if (otherFile.error) throw new Error("插入剪繩原紙收卷失敗:" + otherFile.error);
        repeated = set(otherFile.state, "release", "hand");
      }
    }
    if (handRows.map((row) => row.sameSetupTrial).join(",") !== "1,2,3")
      throw new Error("徒手差異序列仍受全域原紙編號干擾:" +
        JSON.stringify(handRows.map((row) => row.sameSetupTrial)));
    if (new Set(handRows.map((row) => row.offsets[0])).size !== 3)
      throw new Error("同一徒手設定重做三回沒有留下三種固定手勢差異");
  }
});

tests.push({
  name: "第三章換船質疑|原紙揭露混淆、偏移不按桅高縮放、範圍主張可進可退",
  fn: () => {
    const ui = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
    const set = (state, field, value) => {
      const result = Engine3.setDossierDraft(state, field, value);
      if (result.error) throw new Error(field + ":" + result.error);
      return result.state;
    };
    const unlockExplore = (state) => {
      Object.assign(state.caseFile.dossier.assertions, { A1:true, A2:true, A3:true });
      state = Engine3.setDualDesign(state, CH3_DUAL_SETUP).state;
      const dualRun = Engine3.runDossierExperiment(state);
      if (dualRun.error || !dualRun.record.dualPapers ||
          !dualRun.record.papers.shore || !dualRun.record.papers.ship)
        throw new Error("換船測試前沒有產生有效雙紙來源");
      const dualFile = Engine3.fileDossierRecord(dualRun.state);
      if (dualFile.error) throw new Error("換船測試的雙紙來源無法收卷:" + dualFile.error);
      return dualFile.state;
    };
    const configureDepart = (state, vesselId, forceBand = "hard") => {
      const patch = {
        location:"deck", vesselId, stage:"depart", release:"latch", speedRecord:"beats",
        positionRecord:"shore", repeats:3, forceBand, beatBand:"mid",
        sameStone:true, sameHeight:true
      };
      Object.entries(patch).forEach(([field, value]) => { state = set(state, field, value); });
      return state;
    };
    const runAndFile = (state, vesselId, forceBand = "hard") => {
      const ran = Engine3.runDossierExperiment(configureDepart(state, vesselId, forceBand));
      if (ran.error) throw new Error(vesselId + ":" + ran.error);
      const filed = Engine3.fileDossierRecord(ran.state);
      if (filed.error) throw new Error(vesselId + ":" + filed.error);
      return { state: filed.state, record: filed.record, ran };
    };
    const runThree = (state, vesselId, forceBand = "hard") => {
      const rows = [];
      const runs = [];
      for (let i = 0; i < 3; i++) {
        const result = runAndFile(state, vesselId, forceBand);
        state = result.state;
        rows.push(result.record);
        runs.push(result.ran);
      }
      return { state, rows, runs };
    };

    let s = unlockExplore(Engine3.initialState());
    const startDay = s.days;
    const captain = runThree(s, "captain"); s = captain.state;
    if (captain.runs.some((run) => run.dayCost !== 1 || run.borrowedNow))
      throw new Error("維達爾船長的船不應另收借船時間");
    const small = runThree(s, "small"); s = small.state;
    if (small.runs[0].dayCost !== 2 || !small.runs[0].borrowedNow)
      throw new Error("第一次借小艇沒有多花一天");
    if (small.runs.slice(1).some((run) => run.dayCost !== 1 || run.borrowedNow))
      throw new Error("同一艘小艇重做又重複收借船時間");
    const large = runThree(s, "large"); s = large.state;
    if (large.runs[0].dayCost !== 2 || !large.runs[0].borrowedNow ||
        large.runs.slice(1).some((run) => run.dayCost !== 1 || run.borrowedNow) ||
        s.days - startDay !== 11)
      throw new Error("換船的時間成本沒有依首次借用計算");

    const rows = [small.rows[0], captain.rows[0], large.rows[0]];
    for (const row of rows) {
      for (const field of ["vesselId","vesselName","mastHeight","releaseOperator","rowingCrew","rowingMethod"])
        if (row[field] == null || row[field] === "") throw new Error("原紙缺條件欄:" + field);
    }
    const magnitudes = rows.map((row) => Math.abs(row.offsets[0]));
    if (!(magnitudes[0] < magnitudes[1] && magnitudes[1] < magnitudes[2]))
      throw new Error("三艘船的偏移沒有保留可誘惑的單調趨勢");
    const ratios = rows.map((row) => Math.round(magnitudes[rows.indexOf(row)] / row.mastHeight * 10000));
    if (new Set(ratios).size === 1)
      throw new Error("偏移仍被做成桅高的固定比例，混淆只存在台詞裡");
    if (rows.some((row) => row.classification !== "正在變快" ||
        !Array.isArray(row.shoreGaps) ||
        !(row.shoreGaps[row.shoreGaps.length - 1] > row.shoreGaps[0])))
      throw new Error("岸紙沒有留下各船正在加速的可判讀趨勢");

    const one = runThree(unlockExplore(Engine3.initialState()), "captain").state;
    const forgedRange = JSON.parse(JSON.stringify(one));
    forgedRange.caseFile.dossier.records[0].stage = "steady";
    forgedRange.caseFile.dossier.records[1].landing = "foot";
    if (Engine3.getDossierScopeOptions(forgedRange).some((option) =>
      option.choice === "tested-vessels-only" && option.text.includes("維達爾船長的船")
    ))
      throw new Error("船況或落點與原紙不一致的紀錄仍被算進已測船隻範圍");
    one.caseFile.dossier.debate.active = true;
    one.caseFile.dossier.debate.current = "p2";
    const prematureScope = Engine3.answerDossierDebate(one, "p2", "scope", "tested-vessels-only");
    if (prematureScope.error !== "dossier-p2-scope-premise-required" ||
        prematureScope.state.caseFile.dossier.debate.pillars.p2)
      throw new Error("第二柱前置追問尚未完成，竟可直接跳到範圍結論");
    Object.assign(one.caseFile.dossier.debate.p2, {
      question:true, concept:true, steady:true, depart:true, old:true, boundary:true
    });
    const oneOverclaim = Engine3.answerDossierDebate(one, "p2", "scope", "all-vessels");
    if (oneOverclaim.ok !== false || oneOverclaim.reason !== "overclaim")
      throw new Error("只做一艘時，把結論寫到卷宗外竟可通過");
    const oneScope = Engine3.answerDossierDebate(one, "p2", "scope", "tested-vessels-only");
    if (oneScope.error || !oneScope.ok || !oneScope.state.caseFile.dossier.debate.pillars.p2)
      throw new Error("只做維達爾船長一艘船不能完成第二柱主線");

    s.caseFile.dossier.debate.active = true;
    s.caseFile.dossier.debate.current = "p2";
    Object.assign(s.caseFile.dossier.debate.p2, {
      question:true, concept:true, steady:true, depart:true, old:true, boundary:true
    });
    const keptRecords = s.caseFile.dossier.records.length;
    const keptDays = s.days;
    const heightClaim = Engine3.answerDossierDebate(s, "p2", "scope", "height-causes-offset");
    if (heightClaim.ok !== false || heightClaim.reason !== "confounded" ||
        heightClaim.state.caseFile.dossier.records.length !== keptRecords ||
        heightClaim.state.days !== keptDays ||
        heightClaim.state.caseFile.dossier.debate.p2.scopeDiagnosis !== "required" ||
        heightClaim.state.caseFile.dossier.debate.lastReply.includes("划槳的人和槳法") ||
        !heightClaim.state.caseFile.dossier.debate.lastReply.includes("還有哪些"))
      throw new Error("高度因果陷阱沒有把視線送回原紙，或失敗時清掉了資料");
    const bypass = Engine3.answerDossierDebate(
      heightClaim.state, "p2", "scope", "tested-vessels-only"
    );
    if (bypass.error !== "dossier-scope-diagnosis-required")
      throw new Error("混淆失敗後仍能跳過玩家自己的診斷");
    const repBeforeRepair = heightClaim.state.caseFile.dossier.debate.rep;
    const wrongDiagnosis = Engine3.answerDossierDebate(
      heightClaim.state, "p2", "scope-diagnosis", "height-only"
    );
    if (wrongDiagnosis.ok !== false || wrongDiagnosis.reason !== "scope-diagnosis-mismatch" ||
        wrongDiagnosis.state.caseFile.dossier.debate.rep !== repBeforeRepair ||
        wrongDiagnosis.state.caseFile.dossier.records.length !== keptRecords)
      throw new Error("診斷錯答被重複扣信譽，或動到了原紙");
    const diagnosed = Engine3.answerDossierDebate(
      wrongDiagnosis.state, "p2", "scope-diagnosis", "vessel-crew-method"
    );
    if (diagnosed.error || !diagnosed.ok ||
        diagnosed.state.caseFile.dossier.debate.p2.scopeDiagnosis !== "complete" ||
        !diagnosed.state.caseFile.dossier.debate.lastPlayerLine.includes("操船的人和槳法"))
      throw new Error("玩家沒有親自完成混淆診斷");
    const universal = Engine3.answerDossierDebate(diagnosed.state, "p2", "scope", "all-vessels");
    if (universal.ok !== false || universal.reason !== "overclaim")
      throw new Error("測過三艘後，把結論寫到卷宗外竟可通過");
    if (universal.state.caseFile.dossier.records.length !== keptRecords ||
        universal.state.days !== keptDays ||
        !universal.state.caseFile.dossier.debate.p2.boundary)
      throw new Error("範圍過度推廣失敗後刪了資料或已完成步驟");
    const honest = Engine3.answerDossierDebate(universal.state, "p2", "scope", "tested-vessels-only");
    if (honest.error || !honest.ok || !honest.state.caseFile.dossier.debate.pillars.p2)
      throw new Error("列出實際測過的船仍不能通過範圍質詢");

    const scopeTexts = Engine3.getDossierScopeOptions(s).map((option) => option.text);
    if (scopeTexts.length !== 4 ||
        scopeTexts.some((text) => /我先只說|我只把|任何船|一定會|已經證明/.test(text)))
      throw new Error("範圍選項仍能靠謹慎語氣或插旗詞猜答案");
    for (const phrase of [
      "這句話寫在維達爾船長的船上",
      "這句話寫在卷宗裡做過的船上",
      "這句話寫在所有船上"
    ])
      if (!scopeTexts.some((text) => text.includes(phrase)))
        throw new Error("範圍選項缺少平行的資料射程:" + phrase);

    let mixed = unlockExplore(Engine3.initialState());
    mixed = runThree(mixed, "small", "hard").state;
    mixed = runThree(mixed, "captain", "soft").state;
    mixed = runThree(mixed, "large", "soft").state;
    const mixedRows = ["small","captain","large"].map((vesselId) =>
      mixed.caseFile.dossier.records.find((row) =>
        row.filed && row.stage === "depart" && row.vesselId === vesselId &&
        Array.isArray(row.offsets)
      )
    );
    const mixedMagnitudes = mixedRows.map((row) => Math.abs(row.offsets[0]));
    if (mixedMagnitudes[0] < mixedMagnitudes[1] && mixedMagnitudes[1] < mixedMagnitudes[2])
      throw new Error("混合加槳力道的測試資料意外仍呈桅高單調趨勢");
    if (Engine3.getDossierScopeOptions(mixed).some((option) => option.choice === "height-causes-offset"))
      throw new Error("原紙沒有桅高單調趨勢，介面仍固定提出該誘答");
    mixed.caseFile.dossier.debate.active = true;
    mixed.caseFile.dossier.debate.current = "p2";
    Object.assign(mixed.caseFile.dossier.debate.p2, {
      question:true, concept:true, steady:true, depart:true, old:true, boundary:true
    });
    const hiddenHeightClaim = Engine3.answerDossierDebate(
      mixed, "p2", "scope", "height-causes-offset"
    );
    if (hiddenHeightClaim.error !== "dossier-scope-choice-unavailable")
      throw new Error("資料不支持的桅高誘答仍可繞過介面直接提交");
    for (const phrase of [
      "用哪一艘船", "換船後，把不同原紙上的船名、桅高、船員與槳法逐欄比較",
      "scope-diagnosis", "getDossierScopeOptions",
      "這句因果還不能成立。回到原紙條件欄",
      "這句話寫到了卷宗以外；先把範圍收回實際做過的船"
    ])
      if (!ui.includes(phrase)) throw new Error("第三章換船質疑缺玩家可見文字:" + phrase);
    for (const stale of ["任何船解纜起步，都一定會得到同樣結果", "桅杆越高，偏移越大；所以差異是桅高造成的"])
      if (ui.includes(stale)) throw new Error("第三章範圍選項仍殘留語氣洩答:" + stale);
  }
});

tests.push({
  name: "第三章存檔與舞台契約|章別隔離、淨化負向、首頁路由與 ship 視圖",
  fn: () => {
    const N3 = Narrative._factory(scenes3, Engine3, {});
    const San = require("../src/sanitize.js");
    const good = N3.initialState("scholar");
    if (!San.sanitizeImport3(JSON.parse(N3.serialize(good)), scenes3).ok) throw new Error("合法 ch3 存檔遭拒");
    const repairPending = JSON.parse(N3.serialize(good));
    repairPending.lab.caseFile.dossier.debate.p2.scopeDiagnosis = "required";
    const repairText = N3.serialize(repairPending);
    const repairRoundTrip = N3.deserialize(repairText);
    if (repairRoundTrip.lab.caseFile.dossier.debate.p2.scopeDiagnosis !== "required" ||
        !San.sanitizeImport3(repairRoundTrip, scenes3).ok)
      throw new Error("範圍混淆診斷在存檔往返後消失");
    const repairComplete = JSON.parse(N3.serialize(good));
    repairComplete.lab.caseFile.dossier.debate.p2.scopeDiagnosis = "complete";
    const completeRoundTrip = N3.deserialize(N3.serialize(repairComplete));
    if (completeRoundTrip.lab.caseFile.dossier.debate.p2.scopeDiagnosis !== "complete" ||
        !San.sanitizeImport3(completeRoundTrip, scenes3).ok)
      throw new Error("已完成的範圍混淆診斷在存檔往返後消失");
    const badDiagnosis = JSON.parse(N3.serialize(good));
    badDiagnosis.lab.caseFile.dossier.debate.p2.scopeDiagnosis = "teleport";
    if (San.sanitizeImport3(badDiagnosis, scenes3).ok)
      throw new Error("非法範圍診斷狀態未被拒");
    const badDebateRep = JSON.parse(N3.serialize(good));
    badDebateRep.lab.caseFile.dossier.debate.rep = -1;
    if (San.sanitizeImport3(badDebateRep, scenes3).ok)
      throw new Error("非法碼頭聲譽未被拒");
    const badDebatePage = JSON.parse(N3.serialize(good));
    badDebatePage.lab.caseFile.dossier.debate.current = "teleport";
    if (San.sanitizeImport3(badDebatePage, scenes3).ok)
      throw new Error("非法碼頭支柱頁未被拒");
    const bad = JSON.parse(N3.serialize(good)); bad.lab.release = "teleport";
    if (San.sanitizeImport3(bad, scenes3).ok) throw new Error("非法 release 未被拒");
    const badClaim = JSON.parse(N3.serialize(good));
    badClaim.lab.claims.g1.push({ sources:["baseline:1,2,3"], concept:"teleport", ok:false });
    if (San.sanitizeImport3(badClaim, scenes3).ok) throw new Error("非法航船斷言未被拒");
    const badOverlay = JSON.parse(N3.serialize(good)); badOverlay.lab.overlay.preview = "teleport";
    if (San.sanitizeImport3(badOverlay, scenes3).ok) throw new Error("非法紙帶預覽狀態未被拒");
    const badSpeed = JSON.parse(N3.serialize(good));
    badSpeed.lab.speedRuns.accelerating = [{ state:"accelerating", offset:Infinity, predicted:"behind", outcome:"behind", matched:true }];
    if (San.sanitizeImport3(badSpeed, scenes3).ok) throw new Error("非法變速讀值未被拒");
    const badPublic = JSON.parse(N3.serialize(good)); badPublic.lab.publicDemo.procedure = ["repeat"];
    if (San.sanitizeImport3(badPublic, scenes3).ok) throw new Error("亂序公開演示程序未被拒");
    const legacyPublic = JSON.parse(N3.serialize(good));
    legacyPublic.lab.publicDemo = { procedure:["baseline","stable-window","no-push","repeat"], runs:3, complete:true };
    if (!San.sanitizeImport3(legacyPublic, scenes3).ok) throw new Error("舊版四步公開演示存檔失去相容性");
    const legacy = JSON.parse(N3.serialize(good)); delete legacy.lab.claims; delete legacy.lab.cabinResults;
    if (!San.sanitizeImport3(legacy, scenes3).ok) throw new Error("追加斷言欄位後舊存檔失去相容性");
    const legacyClaimOrder = JSON.parse(N3.serialize(good));
    delete legacyClaimOrder.lab.caseFile.dossier.proposedScopes;
    delete legacyClaimOrder.lab.caseFile.dossier.designCommitments.cabinInstrument;
    delete legacyClaimOrder.lab.caseFile.dossier.designCommitments.cabinInstrumentAttempts;
    if (!San.sanitizeImport3(legacyClaimOrder, scenes3).ok)
      throw new Error("斷言先行／船艙器材欄上線後，缺新欄位的舊存檔遭拒");
    const legacyDossier = JSON.parse(N3.serialize(good));
    delete legacyDossier.lab.caseFile.dossier;
    if (!San.sanitizeImport3(legacyDossier, scenes3).ok) throw new Error("自由卷宗上線後舊存檔遭拒");
    const migratedLegacyLab = Engine3.migrateLabState(legacyDossier.lab);
    if (!migratedLegacyLab.caseFile.dossier || migratedLegacyLab.caseFile.dossier.page !== "lab")
      throw new Error("第三章舊存檔顯示前沒有補建航船實驗卷宗");
    if (legacyDossier.lab.caseFile.dossier)
      throw new Error("第三章舊存檔遷移原地改寫了輸入");
    const badDossier = JSON.parse(N3.serialize(good));
    badDossier.lab.caseFile.dossier.draft.stage = "teleport";
    if (San.sanitizeImport3(badDossier, scenes3).ok) throw new Error("非法卷宗船況未被拒");
    const html = readFileSync(path.join(here, "../stage.html"), "utf-8");
    const ui = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
    const stageUi = readFileSync(path.join(here, "../src/stage-ui.js"), "utf-8");
    const stage = readFileSync(path.join(here, "../src/stage-ui.js"), "utf-8");
    for (const x of ['src="data/series.js?v=asset-', 'src="src/engine3.js', 'src="data/scenes3.js', 'bd_ch3_save', 'data-view="ship"'])
      if (!html.includes(x)) throw new Error("stage 缺第三章掛點:" + x);
    for (const asset of [
      "src/sanitize.js", "src/engine3.js", "data/scenes3.js",
      "src/chapter-ui.js", "src/narrative.js", "src/stage-ui.js"
    ]) if (!new RegExp(asset.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
      "\\?v=asset-[0-9a-f]{12}").test(html))
      throw new Error("共享殼缺少內容雜湊快取鍵:" + asset);
    const chapterHtml = readFileSync(path.join(here, "../chapter3.html"), "utf-8");
    for (const asset of ["src/sanitize.js", "src/engine3.js", "data/scenes3.js", "src/narrative.js", "src/chapter-ui.js"])
      if (!new RegExp(asset.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
        "\\?v=asset-[0-9a-f]{12}").test(chapterHtml))
        throw new Error("第三章獨立入口缺少新快取鍵:" + asset);
    if (!ui.includes('"卷宗：原紙"') || ui.includes('"共同運動：桅落"'))
      throw new Error("第三章 HUD 仍顯示已退役的五步證據清單");
    const series = JSON.parse(readFileSync(path.join(here, "../data/series.json"), "utf-8"));
    if (!series.chapters.some((chapter) => chapter.id === "ch3" && chapter.route === "ch03"))
      throw new Error("第三章未登錄於資料驅動首頁");
    for (const x of ["renderShip", "renderShipDossier", "ship3Mission", 'v.system === "ship"']) if (!ui.includes(x)) throw new Error("chapter-ui 缺船實驗:" + x);
    if (!stage.includes('d.system === "ship" ? "ship"')) throw new Error("stage-ui 未辨識 ship 視圖");
    if (!stage.includes("ship: 1")) throw new Error("ship 視圖未納入逐字台詞收隊確認；會在玩家讀完前自動讓位");
    const opening = scenes3.scenes.find((s) => s.id === "C0-1");
    if (!series.chapters.some((chapter) => chapter.id === "ch3" && chapter.title === scenes3.title))
      throw new Error("玩家入口缺第三章正式章名");
    const openingText = (opening && opening.nodes || []).map((n) => n.text || "").join("\n");
    const previousQuestion = scenes2.scenes.find((scene) => scene.id === "BE-2")
      ?.nodes.find((node) => node.id === "n4")?.text || "";
    const currentQuestion = opening?.nodes.find((node) => node.id === "n1")?.text || "";
    const extractSeamQuestion = (text) => {
      const normalized = TextFormat.normalizeZhPunctuation(text);
      return normalized.match(/沒有東西繼續推它，它為什麼還在走？/)?.[0] || "";
    };
    if (extractSeamQuestion(previousQuestion) !== extractSeamQuestion(currentQuestion) ||
        extractSeamQuestion(currentQuestion) !== "沒有東西繼續推它，它為什麼還在走？")
      throw new Error("第二章→第三章核心問題未在標點正規化後逐字接棒");
    for (const phrase of ["伽利略八年前出版", "我還來不及道別"])
      if (!openingText.includes(phrase)) throw new Error("第二章→第三章同行者接棒缺句:" + phrase);
  }
});

tests.push({
  name: "一至四章接縫|旅人不預知、玩家翻頁、問題由前章親手交棒",
  fn: () => {
    const s1 = JSON.parse(readFileSync(path.join(here, "../data/scenes.json"), "utf-8"));
    const s2 = JSON.parse(readFileSync(path.join(here, "../data/scenes2.json"), "utf-8"));
    const s3 = JSON.parse(readFileSync(path.join(here, "../data/scenes3.json"), "utf-8"));
    const s4 = JSON.parse(readFileSync(path.join(here, "../data/scenes4.json"), "utf-8"));
    const principles = readFileSync(path.join(here, "../../02_設計/發現之前_設計原則手冊_v0.1.md"), "utf-8");
    const ch4 = readFileSync(path.join(here, "../../04_劇本/第四章台詞稿_v0.8_Claude_20260728.md"), "utf-8");
    const text = (data, sceneId) => JSON.stringify(data.scenes.find((scene) => scene.id === sceneId));

    const p01 = text(s1, "P0-1");
    if (p01.includes("我知道伽利略會在這裡") || !p01.includes("那個名字我知道"))
      throw new Error("第一章仍在自我介紹前預知人物，或自我介紹後缺旅人定位");
    if (!text(s1, "E-2").includes("這條弧還沒有"))
      throw new Error("第一章最後記憶仍停在鎚羽，沒有把運河弧線交給第二章");

    const b01 = text(s2, "B0-1");
    if (!b01.includes("對他們是四年。對我,又只是一頁") || !b01.includes("他把那張紙留了四年"))
      throw new Error("第二章沒有用一頁折疊四年，或辛普里奧沒有帶回舊證據");

    const c01 = text(s3, "C0-1");
    if (c01.includes("一生快走到盡頭") || c01.includes("不會永遠跟著同一位科學家") ||
        !c01.includes("我還來不及道別"))
      throw new Error("第三章仍用作者旁白解釋換科學家");
    const ce2 = text(s3, "CE-2");
    if (ce2.includes("自動畫出") || ce2.includes("浮出一道") ||
        !ce2.includes("親手寫下") || !ce2.includes("月亮為什麼沒有沿直線離開"))
      throw new Error("第三章章尾仍由筆記代替旅人畫圖或提問");

    const d01Scene = s4.scenes.find((scene) => scene.id === "D0-1");
    const d01 = JSON.stringify(d01Scene);
    const d01Choice = d01Scene?.nodes.find((node) => node.type === "choice");
    const d01Turn = d01Choice?.options.find((option) => /翻/.test(option.text || ""));
    const d01Goto = d01Scene?.nodes.find((node) => node.id === d01Turn?.next);
    if (d01.includes("伽利略不在了") || d01.includes("我不知道下一頁會把我帶到誰面前") ||
        /牛頓|伍爾索普|眼前這個人/.test(d01) ||
        !d01.includes("月亮為什麼沒有沿直線離開") ||
        !d01Turn || d01Goto?.type !== "goto" || d01Goto?.scene !== "D0-2")
      throw new Error("第四章在翻頁前提前知道人物／地點，未承接月亮問題，或缺玩家手動翻頁");
    const d02Scene = s4.scenes.find((scene) => scene.id === "D0-2");
    const d02 = JSON.stringify(d02Scene);
    const selfIntroAt = d02Scene.nodes.findIndex((node) =>
      node.speaker === "牛頓" && (node.text || "").includes("艾薩克・牛頓"));
    if (!d02.includes("紙縫張開成一片濕草地") ||
        selfIntroAt < 0 ||
        d02.includes("這個名字我知道。眼前這個人，我不知道") ||
        d02.includes("答案在我嘴裡，整整四百年") ||
        !d02.includes("到月亮那裡呢") ||
        /切線.{0,40}向心|向心.{0,40}切線/.test(d02))
      throw new Error("第四章沒有在翻頁後落地果園，或仍用心聲替玩家說明牛頓與未來答案");
    const seamAssets = JSON.parse(readFileSync(path.join(here, "../data/assets.json"), "utf-8"));
    if (seamAssets.sceneBg["D0-1"] !== seamAssets.sceneBg["CE-2"] ||
        seamAssets.sceneBg["D0-2"] === seamAssets.sceneBg["D0-1"] ||
        seamAssets.sceneFx["D0-1"] || !seamAssets.sceneFx["D0-2"])
      throw new Error("第三章末頁、玩家翻頁與伍爾索普落地仍未在視覺上分成三拍");
    const stage = readFileSync(path.join(here, "../stage.html"), "utf-8");
    if (!/data\/assets\.js\?v=asset-[0-9a-f]{12}/.test(stage) ||
        !/data\/scenes4\.js\?v=asset-[0-9a-f]{12}/.test(stage))
      throw new Error("第四章接縫修正缺少快取更新，正式站可能仍載入舊背景");

    if (!principles.includes("筆記只折疊年月，不替旅人預知歷史"))
      throw new Error("跨章主觀時間規則未同步設計原則");
    for (const scene of s4.scenes.filter((item) => item.id !== "SC4-R1")) {
      const scriptId = scene.id === "D-INT-1" ? "INT-1" : scene.id;
      if (!ch4.includes(`【${scriptId}】${scene.title}`))
        throw new Error("第四章 runtime 場名未同步 v0.2 劇本:" + scene.id);
    }
    const ui = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
    if (!ui.includes("校樣窗口不按閱讀時間倒數") || !ui.includes("公開質詢只計算已共同檢查"))
      throw new Error("跨章 HUD 仍可能把伽利略辯論說明帶進第三、第四章");
  }
});

tests.push({
  name: "第三章正式美術與音樂|10 場主線＋1 修復場背景全映射、四角色肖像與里程碑配樂",
  fn: () => {
    const assets = JSON.parse(readFileSync(path.join(here, "../data/assets.json"), "utf-8"));
    const ids = new Map(assets.entries.map((e) => [e.id, e]));
    for (const scene of scenes3.scenes) {
      const id = assets.sceneBg[scene.id];
      if (!id) throw new Error("第三章場景缺背景映射:" + scene.id);
      const e = ids.get(id);
      if (!e || !e.path || !e.path.startsWith("ch03/backgrounds/") || e.w !== 1920 || e.h !== 1080)
        throw new Error("第三章背景資產宣告錯誤:" + id);
    }
    if (assets.sceneBg["INT-C1"] !== assets.sceneBg["C0-2"] ||
        assets.sceneBg["INT-C2"] !== assets.sceneBg["C3-1"])
      throw new Error("第三章幕間背景沒有承接前後空間");
    for (const [speaker, id] of Object.entries({ "伽桑狄":"dialogue_gassendi48", "維達爾船長":"dialogue_captain50", "馬蒂厄":"dialogue_mathieu32", "艾蒂安":"dialogue_etienne17" })) {
      if (assets.speakerDialoguePortrait[speaker] !== id) throw new Error("第三章角色預設映射缺失:" + speaker);
      const e = ids.get(id);
      if (!e || !e.path.startsWith("ch03/characters/") || e.w !== 900 || e.h !== 1200) throw new Error("第三章角色資產宣告錯誤:" + id);
    }
    if (assets.chapterThumbnail.ch03 !== "chapter_thumbnail_ch03") throw new Error("第三章章節縮圖未接上");
    const timeline = assets.sceneFx["C0-1"] && assets.sceneFx["C0-1"].steps || [];
    const requiredYears = {
      "1610": "ch03_transition_1610_jupiter_observation_v01",
      "1616": "ch03_transition_1616_roman_admonition_v01",
      "1632": "ch03_transition_1632_dialogue_ship_page_v01",
      "1633": "ch03_transition_1633_roman_statement_v01"
    };
    for (const [year, assetId] of Object.entries(requiredYears)) {
      const step = timeline.find((item) => String(item.label || "").startsWith(year));
      const entry = ids.get(assetId);
      if (!step || step.plate !== assetId || !entry?.path ||
          !existsSync(path.join(here, "../../public/assets/", entry.path)))
        throw new Error("第三章年代轉場缺圖或映射錯誤:" + year);
    }
    const survey = assets.apparatusBriefings["ch3:C1-1"];
    const releaseRig = survey && survey.items.find((item) => item.id === "releaseRig");
    if (!releaseRig || releaseRig.y > 8 || releaseRig.x < 32 || releaseRig.x > 42)
      throw new Error("桅頂放手裝置亮點沒有落在桅頂:" + JSON.stringify(releaseRig));
    const stageCss = readFileSync(path.join(here, "../stage.html"), "utf-8");
    if (!/@media \(max-height: 560px\)[\s\S]{0,700}#fxCaption[\s\S]{0,350}white-space:\s*nowrap/.test(stageCss))
      throw new Error("手機橫屏年代字幕可能重新折行");
    const expectedAudio = {
      ch3Harbor: ["once", ["ch03/Ch3_Harbor_Dawn.mp3"]],
      ch3Experiment: ["milestone", ["ch03/Ch3_Mast_Experiment_A.mp3", "ch03/Ch3_Mast_Experiment_B.mp3", "ch03/Ch3_Mast_Experiment_C.mp3"]],
      ch3Cabin: ["once", ["ch03/Ch3_Closed_Cabin.mp3"]],
      ch3Overlay: ["once", ["ch03/Ch3_Two_Records.mp3"]],
      ch3Public: ["milestone", ["ch03/Ch3_Public_Demonstration_A.mp3", "ch03/Ch3_Public_Demonstration_B.mp3", "ch03/Ch3_Public_Demonstration_C.mp3"]],
      ch3Print: ["once", ["ch03/Ch3_Print_Room_1642.mp3"]]
    };
    for (const [cue, [mode, clips]] of Object.entries(expectedAudio)) {
      const c = assets.bgmFiles[cue];
      if (!c || c.mode !== mode || c.repeatGapMs !== 5000 || JSON.stringify(c.clips) !== JSON.stringify(clips))
        throw new Error("第三章正式音樂映射錯誤:" + cue);
      if ("temporaryReuse" in c) throw new Error("第三章正式音樂仍標成暫借:" + cue);
    }
  }
});

tests.push({
  name: "第三章實驗體感|G1–G5 七底板、狀態切圖、互動運動層與減少動態",
  fn: () => {
    const assets = JSON.parse(readFileSync(path.join(here, "../data/assets.json"), "utf-8"));
    const ids = new Map(assets.entries.map((e) => [e.id, e]));
    const map = assets.shipExperimentVisuals;
    const expected = [
      "ship3_g1_mast_dock", "ship3_g1_mast_steady", "ship3_g2_cabin",
      "ship3_g3_accelerating", "ship3_g3_decelerating",
      "ship3_g4_reference_tapes", "ship3_g5_public_boundary"
    ];
    if (!map || map.baseline !== expected[0] || map["steady-mast"] !== expected[1] || map.cabin !== expected[2])
      throw new Error("G1/G2 實驗底板映射缺失");
    if (!map["speed-change"] || map["speed-change"].accelerating !== expected[3] || map["speed-change"].decelerating !== expected[4])
      throw new Error("G3 加減速未使用不同底板");
    if (map.overlay !== expected[5] || map.boundary !== expected[6]) throw new Error("G4/G5 實驗底板映射缺失");
    for (const id of expected) {
      const e = ids.get(id);
      if (!e || e.kind !== "cg" || !e.path?.startsWith("ch03/experiments/") || e.w !== 1920 || e.h !== 1080)
        throw new Error("第三章實驗資產宣告錯誤:" + id);
      if (!existsSync(path.join(here, "../../public/assets/", e.path))) throw new Error("第三章實驗資產檔不存在:" + e.path);
    }
    const cabinVisual = ids.get("ship3_g2_cabin");
    const cabinBackground = ids.get("bg_ch03_enclosed_cabin");
    for (const entry of [cabinVisual, cabinBackground]) {
      if (!entry?.path?.endsWith("_v02.webp") || !entry?.sourceMaster?.endsWith("_v02.png"))
        throw new Error("封閉船艙仍指向開窗的 v01 圖像");
      if (!existsSync(path.join(here, "../../", entry.sourceMaster)))
        throw new Error("封閉船艙 v02 母版不存在:" + entry.sourceMaster);
    }
    const perspectiveMap = assets.shipPerspectiveIntro;
    if (!perspectiveMap || perspectiveMap.shore !== "ship3_g4_shore_perspective" || perspectiveMap.ship !== "ship3_g1_mast_steady")
      throw new Error("G4 岸上／船上視角前導映射缺失");
    const shorePerspective = ids.get(perspectiveMap.shore);
    if (!shorePerspective || shorePerspective.kind !== "cg" || !shorePerspective.path?.startsWith("ch03/perspectives/")
      || shorePerspective.w !== 1920 || shorePerspective.h !== 1080)
      throw new Error("G4 岸上視角資產宣告錯誤");
    if (!existsSync(path.join(here, "../../public/assets/", shorePerspective.path)))
      throw new Error("G4 岸上視角資產檔不存在:" + shorePerspective.path);
    if (!existsSync(path.join(here, "../../", shorePerspective.sourceMaster)))
      throw new Error("G4 岸上視角來源母檔不存在:" + shorePerspective.sourceMaster);
    const ui = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
    const html = readFileSync(path.join(here, "../stage.html"), "utf-8");
    for (const frag of ["ship3VisualRun", "ship3VisualId", "shipScenePlate", '"cabin-"', '"drip"', '"toss"',
      '"speed-"', '"accelerating"', '"decelerating"', "shipPaperPath", "shipEvidenceSeal"])
      if (!ui.includes(frag)) throw new Error("第三章互動模擬接線缺失:" + frag);
    for (const frag of ["讀第 ", "只拿兩張紙最後一點當成同一時刻", "把同號鼓點配成同一時刻",
      "把船上紙等比例縮小", "每一拍：石頭離岸 − 桅杆離岸", "shipPaperSheet",
      "上｜岸上紀錄：尺固定在碼頭", "下｜船上紀錄：尺固定在桅杆（桅杆＝0）",
      "shipPaperTransformArrow", "shipPaperPath converted revealed", "兩張紙分開，從頭再讀",
      "想看數學寫法（選讀，不影響過關）", "window.setTimeout", "為什麼一張彎、一張直，卻都能成立"])
      if (!ui.includes(frag)) throw new Error("G4 程式紙帶／可重試契約缺失:" + frag);
    for (const frag of ["ship3PerspectiveIntroSeen", "先看同一顆石頭的兩個位置",
      "岸上看｜碼頭不動", "船上看｜桅杆不動", "向下越落越多",
      "M510 86 Q551 86 592 425", "M230 116 Q455 116 680 216",
      "開始對照兩張紙", "重看岸上／船上視角"])
      if (!ui.includes(frag)) throw new Error("G4 雙視角照片前導接線缺失:" + frag);
    if (!ui.includes('if (phase === "overlay") return null;'))
      throw new Error("G4 仍會把靜態完成圖載入互動主畫面");
    for (const frag of [".shipPaperBeatLabel", ".shipPaperStepLabel", ".shipPaperSheetLayer.dim",
      ".shipPaperPairBadge.wrong", ".shipPaperConvertedPanel", "@keyframes ship-transform-arrow"])
      if (!html.includes(frag)) throw new Error("G4 鼓點／紙張動作樣式缺失:" + frag);
    for (const frag of [".shipPerspectiveGrid", ".shipPerspectiveCard", ".shipPerspectiveTrace",
      ".shipPerspectiveBadge", ".shipPerspectiveReplay"])
      if (!html.includes(frag)) throw new Error("G4 雙視角照片前導樣式缺失:" + frag);
    if (!html.includes(".shipPerspectiveGrid { display: grid; grid-template-columns: minmax(0,1fr)") ||
        !html.includes(".shipPerspectiveCard { min-width: 0; margin: 0; overflow: hidden; display: grid"))
      throw new Error("G4 岸上／船上視角未改為上下卡片閱讀");
    if (!html.includes(".shipPaperBeatLabel { fill: #21160e; stroke: none; font: 900 18px"))
      throw new Error("G4 鼓點數字對比仍不足");
    for (const frag of ["再請馬蒂厄抽閂，接著加槳", "再請馬蒂厄抽閂，接著收槳", "平均相對桅腳", "仍可重做"])
      if (!ui.includes(frag)) throw new Error("G3 自由重做／累積摘要契約缺失:" + frag);
    for (const frag of [
      'missionId === "steady"', 'missionId === "speed"', 'missionId === "cabin"',
      'missionId === "explore"', "ship3DossierCurrentAssertionId(d, mission.id)"
    ]) if (!ui.includes(frag)) throw new Error("第三章斷言未依當前任務鎖定:" + frag);
    for (const frag of ["先用紀錄組成一個公平比較", "單看行船紀錄夠嗎", "還無法回答它『和什麼相同』",
      "一次接近可能只是巧合", "cfg.selectionReady", 'typeof cfg.incomplete === "function"'])
      if (!ui.includes(frag)) throw new Error("G1 兩組資料比較提示缺失:" + frag);
    if (ui.includes("至少選 3 筆「停船・可用」")) throw new Error("G1 把資料門檻直接洩漏成勾選答案");
    if (!ui.includes('x = dock ? 450 : (phase === "steady-mast" ? 376 : 300)'))
      throw new Error("停船鉛垂線未對準桅頂石球與落點沙盤");
    for (const frag of ["@keyframes ship-drop", "@keyframes ship-drip", "@keyframes ship-toss", "@keyframes ship-draw-path", "prefers-reduced-motion"])
      if (!html.includes(frag)) throw new Error("第三章互動模擬動畫／無障礙樣式缺失:" + frag);
    const intro = readFileSync(path.join(here, "../src/stage/07-intro-inputs.part.js"), "utf-8");
    for (const frag of ["航船實驗卷宗", "一題一題做", "先留原紙，再寫斷言", "ship3_g1_mast_dock", "ship3_g2_cabin", "開始第一輪"])
      if (!intro.includes(frag)) throw new Error("第三章分段實驗備忘缺掛點:" + frag);
  }
});

tests.push({
  name: "玩家介面語言|內部資料 ID 不外洩、系統語句以白話呈現",
  fn: () => {
    const sceneSets = [
      JSON.parse(readFileSync(path.join(here, "../data/scenes.json"), "utf-8")),
      JSON.parse(readFileSync(path.join(here, "../data/scenes2.json"), "utf-8")),
      JSON.parse(readFileSync(path.join(here, "../data/scenes3.json"), "utf-8")),
      JSON.parse(readFileSync(path.join(here, "../data/scenes4.json"), "utf-8")),
      JSON.parse(readFileSync(path.join(here, "../data/debate2.json"), "utf-8"))
    ];
    const visibleKeys = new Set([
      "text", "title", "label", "prompt", "reply", "slotPrompt", "frUnlocked",
      "hint", "description", "summary", "name", "alt"
    ]);
    const leaks = [];
    /* 實驗紀錄 #1、主張 #1 是玩家親手產生且需要引用的流水號，刻意不列為內部 ID。 */
    const internalId = /(?:^|[^A-Za-z0-9])(?:E[1-9](?:\.[a-z])?|F[1-9]|G[1-9]|K[1-9]|S[1-9]|P[1-9]|(?:P0|INT|[ABCD][0-9]+|BE|CE|DE|SC)-[A-Za-z0-9-]+|GB-ADR-\d+|R-[A-Z0-9-]+|run\s*#)(?:$|[^A-Za-z0-9])/;
    function walk(value, key) {
      if (typeof value === "string" && visibleKeys.has(key) && internalId.test(value)) leaks.push(value);
      else if (Array.isArray(value)) value.forEach((x) => walk(x, ""));
      else if (value && typeof value === "object") Object.entries(value).forEach(([k, v]) => walk(v, k));
    }
    sceneSets.forEach((x) => walk(x, ""));
    if (leaks.length) throw new Error("玩家可見字串仍含製作代碼：" + leaks[0]);
    const debate2 = sceneSets[4];
    if (!debate2.chapter.fr.scholar.slotPrompt.includes("依序選三句")) throw new Error("學者模式未改成白話任務");
    const ui = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
    if (ui.includes('d.fr.slots.join(" → ")')) throw new Error("介面仍把內部槽位 id 顯示給玩家");
    for (const frag of [
      '"場景：" + state.cursor.scene', 'k + " " + (names[k]', '"run #"', '"取得 " + k.toUpperCase()',
      'return names[code] || code', '(p.title || p.id)', '_" + CHAPTER_ID + "_書信碼_'
    ]) if (ui.includes(frag)) throw new Error("章節介面仍可能顯示內部資料 ID：" + frag);
    const stageScene = readFileSync(path.join(here, "../src/stage/02-scene.part.js"), "utf-8");
    if (stageScene.includes('sceneId + "') || stageScene.includes(': sceneId'))
      throw new Error("舞台場景標籤仍可能回退為場景 ID");
    const sliceUi = readFileSync(path.join(here, "../src/ui.js"), "utf-8");
    const sliceHtml = readFileSync(path.join(here, "../index.html"), "utf-8");
    for (const frag of ["E3:a", "run #", "支柱P3", "支柱 P3"]) {
      if (sliceUi.includes(frag) || sliceHtml.includes(frag)) throw new Error("內部 QA 介面仍顯示規格代碼：" + frag);
    }
    const sanitize = readFileSync(path.join(here, "../src/sanitize.js"), "utf-8");
    for (const frag of ["F2 證據", "F2 斷言", "series #", "cursor 非法", "schema 非法", "enum 非法", "profile/cycle", "run #", "claim #"])
      if (sanitize.includes(frag)) throw new Error("匯入錯誤訊息仍顯示技術欄位：" + frag);
    const narrative = readFileSync(path.join(here, "../src/narrative.js"), "utf-8");
    if (narrative.includes('error: "缺 E3.c')) throw new Error("引擎拒絕訊息仍顯示證據 ID");
    const format = readFileSync(path.join(here, "../src/text-format.js"), "utf-8");
    if (!format.includes("playerSceneTitle") || !format.includes("死路"))
      throw new Error("場景標題缺少製作術語隔離層");
    for (const label of ["落石", "船艙", "變速", "雙視角", "邊界"]) if (!ui.includes(label)) throw new Error("第三章進度缺白話名稱：" + label);
  }
});

tests.push({
  name: "長局存檔回歸|四章 601 筆合法對話不得被通用上限誤殺",
  fn: () => {
    const San = require("../src/sanitize.js");
    const scenes2 = require("../data/scenes2.js");
    const Engine2 = require("../src/engine2.js");
    const N2 = Narrative._factory(scenes2, Engine2, require("../data/debate2.js"));
    const N3 = Narrative._factory(scenes3, Engine3, {});
    const scenes4 = require("../data/scenes4.js");
    const Engine4 = require("../src/engine4.js");
    const N4 = Narrative._factory(scenes4, Engine4, {});
    const cases = [
      { state: Narrative.initialState("explore"), scene: "P0-1", check: (s) => San.sanitizeImport(s, patterns, scenes) },
      { state: N2.initialState("explore"), scene: "B0-1", check: (s) => San.sanitizeImport2(s, scenes2, Engine2) },
      { state: N3.initialState("explore"), scene: "C0-1", check: (s) => San.sanitizeImport3(s, scenes3) },
      { state: N4.initialState("explore"), scene: "D0-1", check: (s) => San.sanitizeImport4(s, scenes4, Engine4) }
    ];
    cases.forEach((c, i) => {
      c.state.transcript = Array.from({ length: 601 }, () => ({ scene: c.scene, speaker: "system", text: "合法長局紀錄" }));
      if (!c.check(JSON.parse(JSON.stringify(c.state))).ok) throw new Error("第 " + (i + 1) + " 章合法長局仍遭拒");
      c.state.transcript = Array.from({ length: 3001 }, () => ({ scene: c.scene, speaker: "system", text: "超限" }));
      if (c.check(JSON.parse(JSON.stringify(c.state))).ok) throw new Error("第 " + (i + 1) + " 章超限對話未拒");
    });
  }
});

tests.push({
  name: "六章證據視覺|每項宣告證據皆有可解析圖像，取得與筆記共用單一映射",
  fn: () => {
    const assets = require("../data/assets.js");
    const entries = new Map(assets.entries.map((e) => [e.id, e]));
    const required = [...new Set(
      [scenes, scenes2, scenes3, scenes4, scenes5, scenes6]
        .flatMap((chapter) => Object.keys(chapter.evidenceNames || {}))
    )];
    for (const code of required) {
      const visual = assets.evidenceVisual && assets.evidenceVisual[code];
      if (!visual || !visual.items?.length || !visual.caption) throw new Error("證據缺視覺映射：" + code);
      for (const item of visual.items) {
        if (item.evidence === "E2") continue;
        const entry = entries.get(item.asset);
        if (!entry?.path || !existsSync(path.join(here, "../../public/assets/", entry.path)))
          throw new Error("證據圖無法解析：" + code + " → " + item.asset);
        if (entry.sourceMaster && entry.sourceMaster.startsWith("art/") &&
            !existsSync(path.join(here, "../../", entry.sourceMaster)))
          throw new Error("證據圖母版無法解析：" + code + " → " + entry.sourceMaster);
      }
    }
    if (required.length !== 37) throw new Error("六章證據宣告數改變，請重審視覺盤點：" + required.length);
    const s5Visual = assets.evidenceVisual.S5;
    const s5Asset = entries.get(s5Visual.items[0].asset);
    if (s5Visual.items[0].asset === "bg_ch03_marseille_harbor_dawn" || s5Asset?.kind !== "card" || !s5Asset?.path?.startsWith("ch03/cards/"))
      throw new Error("S5 不得以馬賽港場景背景冒充《對話》的證據圖");
    if (!s5Visual.caption.includes("史料意象圖") || !s5Visual.caption.includes("非原書插圖"))
      throw new Error("S5 必須揭露為史料意象圖，不得冒充《對話》原書插圖");
    const g3Visual = assets.evidenceVisual.G3;
    if (!g3Visual.caption.includes("解纜起步時偏後") ||
        !g3Visual.caption.includes("出港平駛時接近桅腳") ||
        g3Visual.caption.includes("減速") ||
        g3Visual.items.some((item) => item.asset === "ship3_g3_decelerating"))
      throw new Error("G3 證據卡必須呈現玩家實際完成的起步／平駛比較，不得搶先聲稱尚未做過的減速結果");
    const g2Visual = assets.evidenceVisual.G2;
    if (!assets.evidenceSummary.G2.includes("關閉艙窗後") ||
        !assets.evidenceSummary.G2.includes("水面都沒有固定偏向") ||
        !assets.evidenceSummary.G2.includes("小球也落在放手點正下方") ||
        g2Visual.items[0].alt.includes("滴水") || g2Visual.items[0].alt.includes("拋接") ||
        g2Visual.caption.includes("滴水") || g2Visual.caption.includes("拋接"))
      throw new Error("G2 證據文字仍沿用舊玩法，沒有對齊水面與垂直落球");
    const g4Visual = assets.evidenceVisual.G4;
    if (!g4Visual.caption.includes("同號鼓點") ||
        !g4Visual.caption.includes("逐拍扣掉桅杆位置") ||
        !g4Visual.caption.includes("這一趟"))
      throw new Error("G4 證據圖說仍把單趟換尺過度推廣成任意軌跡轉換");
    const ui = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
    const focus = readFileSync(path.join(here, "../src/stage/03-focus-visual.part.js"), "utf-8");
    const typewriter = readFileSync(path.join(here, "../src/stage/04-typewriter.part.js"), "utf-8");
    const events = readFileSync(path.join(here, "../src/stage/05-events.part.js"), "utf-8");
    const notebook = readFileSync(path.join(here, "../src/stage/09-notebook.part.js"), "utf-8");
    for (const frag of ["collectNewEvidence(before, state)", "pendingEvidence.push({", "takePendingEvidence().forEach", "evidence: replaying ? [] : takePendingEvidence()"])
      if (!ui.includes(frag)) throw new Error("證據取得結構化接口缺失：" + frag);
    if (!ui.includes('setTimeout(function ()') || !ui.includes('emit("bd:evidence", item)'))
      throw new Error("無取得台詞的實驗證據未延後至本輪渲染完成後入鏡");
    if (!focus.includes("showEvidenceFocusList") || !typewriter.includes("showEvidenceFocusList(item.evidence)") || !events.includes('addEventListener("bd:evidence"'))
      throw new Error("有取得台詞的證據未在逐字機真正開演時入鏡");
    if (!ui.includes('addLine(r.node.speaker, r.node.text, classFor(r.node.speaker), sourceScene)'))
      throw new Error("證據台詞未保留取得當下的原始場景");
    if (!notebook.includes("ASSETS.evidenceVisual") || !notebook.includes("assetEntry(visualAsset)")) throw new Error("旅人筆記未共用證據視覺映射");
  }
});

tests.push({
  name: "系列通關章印|完章永久記錄、重玩不清除、誤判備份可安全救回",
  fn: () => {
    const ui = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
    const html = readFileSync(path.join(here, "../stage.html"), "utf-8");
    for (const frag of ["bd_series_progress_v1", "markChapterComplete(state)", 'completedAt: prev.completedAt',
      'status.textContent = complete ? "✓ 已完成"', '"已完成 " + completedCount + " 章"'])
      if (!ui.includes(frag)) throw new Error("通關章印契約缺失：" + frag);
    if (!html.includes(".chapterPick.isComplete")) throw new Error("首頁缺通關章印視覺");
    for (const frag of ['localStorage.getItem(KEY + "_corrupt")', "inspectSaveText(backup)", "已恢復先前被誤判並備份的進度"])
      if (!ui.includes(frag)) throw new Error("誤判備份復原契約缺失：" + frag);
  }
});

function ch4K0K2State() {
  let s = Engine4.initialState();
  s = Engine4.sealTangentPrediction(s, "tangent").state;
  s = Engine4.sealScalePrediction(s, "one-over-3600").state;
  s = Engine4.convertMoonTime(s, "divide-3600").state;
  s = Engine4.judgeScaleRatio(s, 3600).state;
  s = Engine4.judgeScaleRelation(s, "multiply").state;
  return s;
}

function ch4AimAtCurrentCenter(state0) {
  const step = state0.orbitLab.manualBeats.length;
  const offset = Engine4._ORBIT_RULES.aimOffsets[step];
  const aimed = Engine4.nudgeOrbitAim(state0, -offset);
  if (aimed.error) throw new Error("測試助手無法校正第 " + (step + 1) + " 拍");
  return aimed.state;
}

function ch4CompleteK1(state0, speed = "medium", strength = "medium") {
  let s = Engine4.sealOrbitRule(state0, {
    target: "earth-center", speed, strength
  }, "circle").state;
  for (let i = 0; i < 3; i++) {
    s = ch4AimAtCurrentCenter(s);
    const beat = Engine4.commitOrbitBeat(s);
    if (beat.error || !beat.ok) throw new Error("測試助手無法完成第 " + (i + 1) + " 拍");
    s = beat.state;
  }
  const continued = Engine4.continueOrbitRule(s);
  if (continued.error || !continued.complete) throw new Error("測試助手無法完成牛頓續畫");
  s = continued.state;
  const claim = Engine4.assertK1(s, ["tangent", "closed"], "forward-plus-inward-turn");
  if (!claim.ok) throw new Error("測試助手無法完成 K1");
  return claim.state;
}

function ch4CompleteK3(state0) {
  let s = Engine4.sealPlanetPrediction(state0, "mars", "middle").state;
  s = Engine4.sealPlanetPrediction(s, "jupiter", "long").state;
  s = Engine4.revealPlanetPredictions(s).state;
  const claim = Engine4.assertK3(
    s, ["mars-sealed", "jupiter-sealed"], "withheld-data-prediction"
  );
  if (!claim.ok) throw new Error("測試助手無法完成 K3");
  return claim.state;
}

function ch4CompleteK4(state0, loanCases = ["comet"]) {
  let s = Engine4.deferPress(state0, "等待三列對帳完成").state;
  s = Engine4.connectCometTracks(s, "same-orbit").state;
  for (const caseId of Engine4._CASES) {
    s = Engine4.beginLedgerRow(s, caseId).state;
    s = Engine4.stampLedgerCell(s, caseId, "inverseSquare", "matches").state;
    s = Engine4.stampLedgerCell(
      s, caseId, "simpleVortex", caseId === "moon" ? "story" : "mismatch"
    ).state;
    if (caseId !== "moon") {
      s = (loanCases.includes(caseId)
        ? Engine4.addModelLoan(s, caseId)
        : Engine4.declineModelLoan(s, caseId)).state;
    }
  }
  const sealed = Engine4.sealModelComparison(s, "actual-ledger");
  if (!sealed.ok) throw new Error("測試助手無法完成 K4");
  return sealed.state;
}

function ch4CompleteK5(state0) {
  let s = state0;
  for (const [slot, evidenceId] of [
    ["inertia", "M3"], ["inward", "K1"], ["distance", "K2"],
    ["withheld", "K3"], ["model", "K4"]
  ]) s = Engine4.placeProofLink(s, slot, evidenceId).state;
  s = Engine4.revealShellPage(s).state;
  s = Engine4.placeShellPage(s).state;
  s = Engine4.setHookeScope(s, "precise-scope").state;
  for (const [contribution, person] of Object.entries(Engine4._CREDIT_EXPECT))
    s = Engine4.assignCredit(s, contribution, person).state;
  s = Engine4.removeTravelerFromAuthorField(s).state;
  s = Engine4.setBoundary(s, "ruleEstablished").state;
  const submitted = Engine4.submitProof(s);
  if (!submitted.ok) throw new Error("測試助手無法完成 K5");
  return submitted.state;
}

tests.push({
  name: "第四章 v0.9 場景圖|12 場主線＋1 修復場、281 活躍節點＋19 舊游標、五座取證工作台與 JSON 鏡像一致",
  fn: () => {
    const sj = JSON.parse(readFileSync(path.join(here, "../data/scenes4.json"), "utf-8"));
    const hj = JSON.parse(readFileSync(path.join(here, "../data/histfacts4.json"), "utf-8"));
    if (JSON.stringify(scenes4) !== JSON.stringify(sj)) throw new Error("scenes4 鏡像漂移");
    if (JSON.stringify(require("../data/histfacts4.js")) !== JSON.stringify(hj))
      throw new Error("histfacts4 鏡像漂移");
    const expectedScenes = [
      "D0-1", "D0-2", "D1-1", "D1-2", "D-INT-1", "D2-1",
      "D2-2", "D3-1", "D4-1", "D4-2", "DE-1", "DE-2", "SC4-R1"
    ];
    if (scenes4.chapter !== "ch4" || scenes4.title !== "月亮的無盡墜落" ||
        JSON.stringify(scenes4.scenes.map((scene) => scene.id)) !== JSON.stringify(expectedScenes))
      throw new Error("第四章 v0.8 應保留定案 12 場主線並追加 SC4-R1");
    const allNodes = scenes4.scenes.reduce((sum, scene) => sum + scene.nodes.length, 0);
    if (allNodes !== 300) throw new Error("第四章節點數不是 300，實得:" + allNodes);

    const allowedPurposes = new Set([
      "time_dislocation", "future_knowledge", "cross_chapter_memory",
      "private_observation", "private_hypothesis", "emotional_risk", "naming"
    ]);
    const activeInner = [], legacyInner = [], legacyNodes = [];
    for (const scene of scenes4.scenes) for (const node of scene.nodes) {
      if (node.legacyOnly === true) legacyNodes.push(scene.id + "/" + node.id);
      if (node.speaker !== "旅人・心聲") continue;
      if (node.legacyOnly === true) legacyInner.push(scene.id + "/" + node.id);
      else {
        activeInner.push(scene.id + "/" + node.id);
        if (!allowedPurposes.has(node.osPurpose))
          throw new Error(scene.id + "/" + node.id + " 活躍心聲缺合法 osPurpose");
      }
    }
    if (activeInner.length !== 10 || legacyInner.length !== 17 || legacyNodes.length !== 19)
      throw new Error("第四章心聲減量庫存不符，活躍／退役／全部退役=" +
        [activeInner.length, legacyInner.length, legacyNodes.length].join("/"));
    const stageOnlyContract = (data) => [["D0-1", "n4a"], ["D0-1", "n5"], ["D0-2", "a3"]]
      .every(([sceneId, nodeId]) => data.scenes.find((scene) => scene.id === sceneId)
        ?.nodes.find((node) => node.id === nodeId)?.speaker === "stage");
    if (!stageOnlyContract(scenes4))
      throw new Error("旅人獨處的三個過場未收為無名牌的舞台動作句");
    const stageOnlyNegative = JSON.parse(JSON.stringify(scenes4));
    stageOnlyNegative.scenes.find((scene) => scene.id === "D0-1")
      .nodes.find((node) => node.id === "n4a").speaker = "旅人(你)";
    if (stageOnlyContract(stageOnlyNegative))
      throw new Error("旅人獨處過場的負向控制沒有轉紅");
    if (!activeInner.includes("D0-2/n23") || !activeInner.includes("D1-1/w2") ||
        scenes4.scenes.find((scene) => scene.id === "D2-2")
          .nodes.find((node) => node.id === "n11")?.text !==
          "課本只留一行。眼前這場沉默，就佔了那一行。")
      throw new Error("第四章應保留的笑點或虎克沉默濃縮句漂移");

    const sceneMap = new Map(scenes4.scenes.map((scene) =>
      [scene.id, new Map(scene.nodes.map((node) => [node.id, node]))]));
    for (const scene of scenes4.scenes) for (const node of scene.nodes) {
      if (node.next && !sceneMap.get(scene.id).has(node.next))
        throw new Error("next 不存在:" + scene.id + "/" + node.id);
      if (node.scene && !sceneMap.has(node.scene)) throw new Error("goto 場景不存在:" + node.scene);
      for (const option of node.options || []) if (!sceneMap.get(scene.id).has(option.next))
        throw new Error("option.next 不存在:" + scene.id + "/" + option.id);
      if (node.legacyOnly !== true) {
        const targets = [node.next, ...(node.options || []).map((option) => option.next)]
          .filter(Boolean);
        for (const target of targets)
          if (sceneMap.get(scene.id).get(target)?.legacyOnly === true)
            throw new Error(scene.id + "/" + node.id + " 仍指向退役心聲 " + target);
      }
    }
    const visited = new Set(), pending = [
      [scenes4.startScene, sceneMap.get(scenes4.startScene).keys().next().value],
      ["SC4-R1", sceneMap.get("SC4-R1").keys().next().value]
    ];
    while (pending.length) {
      const [sceneId, nodeId] = pending.shift(), key = sceneId + "/" + nodeId;
      if (!nodeId || visited.has(key)) continue;
      visited.add(key);
      const node = sceneMap.get(sceneId)?.get(nodeId);
      if (!node) throw new Error("可達性遇到不存在節點:" + key);
      if (node.next) pending.push([sceneId, node.next]);
      for (const option of node.options || []) pending.push([sceneId, option.next]);
      if (node.scene) pending.push([node.scene, sceneMap.get(node.scene).keys().next().value]);
    }
    const activeNodes = scenes4.scenes.flatMap((scene) => scene.nodes
      .filter((node) => node.legacyOnly !== true)
      .map((node) => scene.id + "/" + node.id));
    const unreachableActive = activeNodes.filter((key) => !visited.has(key));
    if (activeNodes.length !== 281 || unreachableActive.length)
      throw new Error("第四章活躍節點數或可達性錯誤:" +
        activeNodes.length + " / " + unreachableActive.join("、"));
    const reachedLegacy = legacyNodes.filter((key) => visited.has(key));
    if (reachedLegacy.length)
      throw new Error("第四章新流程仍進入退役心聲:" + reachedLegacy.join("、"));

    const N4Legacy = Narrative._factory(scenes4, Engine4, {});
    for (const key of legacyNodes) {
      const [sceneId, nodeId] = key.split("/");
      const state = N4Legacy.initialState("explore");
      state.cursor = { scene: sceneId, node: nodeId };
      const shown = N4Legacy.view(state);
      if (shown.nodeId !== nodeId) throw new Error("第四章退役心聲舊游標無法顯示:" + key);
      let next;
      if (shown.type === "embed" && shown.phase === "tangent-seal") {
        const sealed = N4Legacy.labAction(state, "sealTangentPrediction", { choice:"tangent" });
        next = sealed.error ? sealed : N4Legacy.embedComplete(sealed.state);
      } else if (shown.type === "embed" && shown.phase === "archive") {
        state.lab = ch4K0K2State();
        state.lab = ch4CompleteK1(state.lab);
        state.lab = ch4CompleteK3(state.lab);
        state.lab = ch4CompleteK4(state.lab);
        state.lab = ch4CompleteK5(state.lab);
        const archived = N4Legacy.labAction(state, "archiveEvidenceSet");
        next = archived.error ? archived : N4Legacy.embedComplete(archived.state);
      } else next = N4Legacy.advance(state);
      if (next.error) throw new Error("第四章退役節點舊游標無法續讀:" + key + ":" + next.error);
    }

    const intermissionState = N4Legacy.initialState("explore");
    intermissionState.cursor = { scene:"D-INT-1", node:"n3" };
    const intermissionView = N4Legacy.view(intermissionState);
    if (intermissionView.type !== "line" || intermissionView.speaker !== "stage" ||
        /^\d{4}——/.test(String(intermissionView.text || "")))
      throw new Error("D-INT-1/n3 沒有走可續讀的舞台旁白渲染路徑");
    const intermissionRoundTrip = N4Legacy.deserialize(N4Legacy.serialize(intermissionState));
    const intermissionNext = N4Legacy.advance(intermissionRoundTrip);
    if (intermissionNext.error || intermissionNext.state.cursor.scene !== "D-INT-1" ||
        intermissionNext.state.cursor.node !== "n4")
      throw new Error("D-INT-1/n3 在同版存檔往返後無法續讀到 n4");

    /* 負向控制：讓現行主線重新走進退役心聲，契約必須轉紅。 */
    const heartEdgeNegative = JSON.parse(JSON.stringify(scenes4));
    heartEdgeNegative.scenes.find((scene) => scene.id === "D0-2")
      .nodes.find((node) => node.id === "a3").next = "a4";
    const negativeScene = heartEdgeNegative.scenes.find((scene) => scene.id === "D0-2");
    const negativeById = new Map(negativeScene.nodes.map((node) => [node.id, node]));
    const negativeRed = negativeScene.nodes.some((node) => node.legacyOnly !== true &&
      [node.next, ...(node.options || []).map((option) => option.next)]
        .filter(Boolean).some((target) => negativeById.get(target)?.legacyOnly === true));
    if (!negativeRed) throw new Error("第四章退役心聲入邊負向控制沒有轉紅");

    const expectedGates = [
      ["D1-2", "scale", "k2"],
      ["D2-1", "orbit-rule", "k1"],
      ["D3-1", "planets", "k3"],
      ["D4-1", "models", "k4"],
      ["D4-2", "proof", "k5"]
    ];
    const actualGates = scenes4.scenes.flatMap((scene) => scene.nodes
      .filter((node) => node.type === "embed" && node.legacyOnly !== true)
      .map((node) => [scene.id, node.phase, node.until?.orbit]));
    if (JSON.stringify(actualGates) !== JSON.stringify(expectedGates))
      throw new Error("第四章五座取證工作台漂移:" + JSON.stringify(actualGates));
    const legacyGates = scenes4.scenes.flatMap((scene) => scene.nodes
      .filter((node) => node.type === "embed" && node.legacyOnly === true)
      .map((node) => [scene.id, node.phase, node.until?.orbit]));
    if (JSON.stringify(legacyGates) !== JSON.stringify([
      ["D1-1", "tangent-seal", "source-k0"],
      ["DE-1", "archive", "archive-complete"]
    ])) throw new Error("K0／歸檔舊工作台沒有正確退役:" + JSON.stringify(legacyGates));
    const tangentChoice = sceneMap.get("D1-1").get("c1");
    if (tangentChoice.options.length !== 3 ||
        JSON.stringify(tangentChoice.options.map((option) => option.id)) !==
          JSON.stringify(["curve", "inward", "tangent"]) ||
        tangentChoice.options.some((option) => option.default || option.selected))
      throw new Error("K0 三選一被預選、縮減或改序");
    const d11ActiveText = scenes4.scenes.find((scene) => scene.id === "D1-1").nodes
      .filter((node) => node.legacyOnly !== true)
      .map((node) => [String(node.text || ""),
        ...(node.options || []).map((option) => String(option.text || ""))].join("\n"))
      .join("\n");
    if (/每一拍|一拍之內|叫一拍/.test(d11ActiveText))
      throw new Error("D1-1 在紙上分拍正式定義前先使用『拍』，再次形成懸空提問");
    if (!String(sceneMap.get("D2-1").get("n23").text || "")
        .includes("每一小段，叫一拍"))
      throw new Error("D2-1 沒有在作圖操作前明確定義『拍』");
    const N4ChoiceEffects = Narrative._factory(scenes4, Engine4, {});
    let wrongTangentState = N4ChoiceEffects.initialState("explore");
    wrongTangentState.cursor = { scene:"D1-1", node:"c1" };
    wrongTangentState = N4ChoiceEffects.choose(wrongTangentState, "curve").state;
    if (wrongTangentState.lab.sourceLab.attempts.length !== 1 ||
        wrongTangentState.lab.sourceLab.tangentPrediction.sealed)
      throw new Error("K0 對話錯答沒有留下來源退件，或錯誤封存");
    let rightTangentState = N4ChoiceEffects.initialState("explore");
    rightTangentState.cursor = { scene:"D1-1", node:"c1" };
    rightTangentState = N4ChoiceEffects.choose(rightTangentState, "tangent").state;
    if (!rightTangentState.lab.sourceLab.tangentPrediction.sealed ||
        rightTangentState.lab.sourceLab.tangentPrediction.choice !== "tangent" ||
        Object.values(rightTangentState.lab.evidence).some(Boolean))
      throw new Error("K0 對話正解沒有封存，或把來源紙冒充證據");
    const noActionScenes = JSON.parse(JSON.stringify(scenes4));
    delete noActionScenes.scenes.find((scene) => scene.id === "D1-1")
      .nodes.find((node) => node.id === "c1")
      .options.find((option) => option.id === "tangent").effects;
    const N4NoAction = Narrative._factory(noActionScenes, Engine4, {});
    let noActionState = N4NoAction.initialState("explore");
    noActionState.cursor = { scene:"D1-1", node:"c1" };
    noActionState = N4NoAction.choose(noActionState, "tangent").state;
    if (!Engine4.sealOrbitRule(noActionState.lab, {
          target:"earth-center", speed:"medium", strength:"medium"
        }, "circle").error)
      throw new Error("拿掉 K0 對話動作後仍可開始 K1，狀態被台詞假造");
    const d02Nodes = scenes4.scenes.find((scene) => scene.id === "D0-2").nodes;
    const moonAnswer = d02Nodes.find((node) => node.id === "c0");
    const futurePenalty = d02Nodes.find((node) => node.id === "n12b");
    const boundaryReward = d02Nodes.find((node) => node.id === "n12d");
    if (JSON.stringify((moonAnswer?.options || []).map((option) => option.id)) !==
          JSON.stringify(["future-answer", "evidence-boundary"]) ||
        futurePenalty?.effects?.[0]?.rep !== -1 ||
        boundaryReward?.effects?.[0]?.rep !== 1 ||
        !String(futurePenalty?.effects?.[0]?.reason || "").includes("拿不出") ||
        !String(boundaryReward?.effects?.[0]?.reason || "").includes("分開"))
      throw new Error("D0-2 沒有把『正確但無證據』與『先守證據邊界』做成信譽選擇");
    const d02ChoiceTexts = moonAnswer.options.map((option) => String(option.text || ""));
    const d02Prefix = d02ChoiceTexts.map((text) => text.split("。").slice(0, 2).join("。"));
    if (new Set(d02Prefix).size !== 1 ||
        Math.max(...d02ChoiceTexts.map((text) => Array.from(text).length)) -
          Math.min(...d02ChoiceTexts.map((text) => Array.from(text).length)) > 4)
      throw new Error("D0-2/c0 沒有以同開句、近等長度呈現兩種證據界線");
    if (!d02ChoiceTexts[0].includes("同一張紙") ||
        !d02ChoiceTexts[1].includes("另一張紙"))
      throw new Error("D0-2/c0 錯項與正項沒有對準『一張紙能不能跨越未證範圍』");
    const de1Choice = sceneMap.get("DE-1").get("c1");
    const de1Texts = de1Choice.options.map((option) => String(option.text || ""));
    if (new Set(de1Texts.map((text) => text.split("。")[0])).size !== 1 ||
        Math.max(...de1Texts.map((text) => Array.from(text).length)) -
          Math.min(...de1Texts.map((text) => Array.from(text).length)) > 4 ||
        de1Texts.some((text) => !/來源.*退件.*(?:未決|還沒證明)/.test(text)))
      throw new Error("DE-1/c1 三項未以平行句型呈現同一組來源邊界");
    const sc4Repair = sceneMap.get("SC4-R1").get("c1");
    const sc4Correct = sc4Repair.options.find((option) => option.id === "withdraw");
    const sc4Wrong = sc4Repair.options.filter((option) => option.id !== "withdraw");
    const boundaryTerms = /不能|還沒有|來源|退件|撤回|邊界|只保留|先不|未決/g;
    const countTerms = (text) => (String(text || "").match(boundaryTerms) || []).length;
    if (Array.from(sc4Correct.text).length >
          Math.max(...sc4Wrong.map((option) => Array.from(option.text).length)) &&
        countTerms(sc4Correct.text) > Math.max(...sc4Wrong.map((option) => countTerms(option.text))))
      throw new Error("SC4-R1/c1 正解同時最長且邊界詞最多，洩漏答案語域");
    const N4Opening = Narrative._factory(scenes4, Engine4, {});
    let futureState = N4Opening.initialState("explore");
    futureState.cursor = { scene:"D0-2", node:"c0" };
    futureState = N4Opening.choose(futureState, "future-answer").state;
    futureState = N4Opening.advance(futureState).state;
    futureState = N4Opening.advance(futureState).state;
    let boundedState = N4Opening.initialState("explore");
    boundedState.cursor = { scene:"D0-2", node:"c0" };
    boundedState = N4Opening.choose(boundedState, "evidence-boundary").state;
    boundedState = N4Opening.advance(boundedState).state;
    if (futureState.rep !== 2 || boundedState.rep !== 4)
      throw new Error("D0-2 兩條回答沒有各自造成信譽 −1／＋1");
    const selfIntroAt = d02Nodes.findIndex((node) =>
      String(node.text || "").includes("艾薩克・牛頓")
    );
    const ch4NodeText = (node) => [
      String(node.text || ""),
      ...(node.options || []).map((option) => String(option.text || ""))
    ].join("\n");
    const ch4AllText = scenes4.scenes
      .flatMap((scene) => scene.nodes.map(ch4NodeText)).join("\n");
    const ch4CharacterText = scenes4.scenes
      .flatMap((scene) => scene.nodes
        .filter((node) => node.speaker && node.speaker !== "stage" && node.speaker !== "system")
        .map((node) => String(node.text || "")))
      .join("\n");
    const ch4WorldSpeech = [ch4CharacterText, ...scenes4.scenes.flatMap((scene) =>
      scene.nodes.flatMap((node) => (node.options || []).map((option) => String(option.text || ""))))]
      .join("\n");
    const worldChapterNumber = /第[一二三四五六七八九十0-9]+章/;
    if (!worldChapterNumber.test(ch4NodeText({ options:[{ text:"第二章" }] })))
      throw new Error("第四章世界內章號掃描器沒有涵蓋 choice option");
    if (worldChapterNumber.test(ch4WorldSpeech))
      throw new Error("第四章人物仍把經驗說成『第 X 章』，破壞世界內語氣");
    const ch4CharacterUiTerms = /重選|重收|請選擇|點選/;
    if (!ch4CharacterUiTerms.test("重選。"))
      throw new Error("第四章角色台詞的介面動詞掃描器失效");
    if (ch4CharacterUiTerms.test(ch4CharacterText))
      throw new Error("第四章角色台詞混入『重選／重收』等介面動詞");
    const beforeSelfIntro = d02Nodes.slice(0, selfIntroAt)
      .map(ch4NodeText).join("\n");
    if (selfIntroAt < 0 || /牛頓|課本裡那個瞬間|本人完全狀況外/.test(beforeSelfIntro))
      throw new Error("D0-2 仍讓旅人在牛頓自報姓名前認出人物");
    const beforeHooke = scenes4.scenes
      .slice(0, scenes4.scenes.findIndex((scene) => scene.id === "D2-1"))
      .flatMap((scene) => scene.nodes.map(ch4NodeText))
      .join("\n");
    const ch4SpoilerTerms = /一門砲|山頂大砲|一直被扳彎|錯過地面|一直往下掉|一直在落|落了一整圈|繞一整圈/;
    if (!ch4SpoilerTerms.test(ch4NodeText({ options:[{ text:"錯過地面" }] })))
      throw new Error("第四章語意劇透掃描器沒有涵蓋 choice option 文字");
    if (ch4SpoilerTerms.test(beforeHooke))
      throw new Error("1665 場仍在虎克書信前餵出山頂大砲或持續改向框架");
    const d12q2 = sceneMap.get("D1-2").get("q2");
    if (!/溫德林寫(?:\s*60|六十)/.test(String(d12q2.text || "")) ||
        /惠更斯寫(?:\s*60|六十)/.test(String(d12q2.text || "")))
      throw new Error("1665 月距來源仍時代錯置：必須引用溫德林 60，不得引用 1673 年才出版的惠更斯數值");
    const d21Text = scenes4.scenes.find((scene) => scene.id === "D2-1").nodes
      .map((node) => ch4NodeText(node) + " " + String(node.speaker || "")).join("\n");
    const ch4MetaTerms = /誘答|正解卡|錯答卡/;
    if (!ch4MetaTerms.test(ch4NodeText({ options:[{ text:"正解卡" }] })))
      throw new Error("第四章製作術語掃描器沒有涵蓋 choice option 文字");
    if (ch4MetaTerms.test(ch4AllText))
      throw new Error("第四章仍有場次把製作端的答案分類洩漏給玩家");
    const d01 = sceneMap.get("D0-1"), d12 = sceneMap.get("D1-2"), d41 = sceneMap.get("D4-1");
    if (!String(d01.get("n2").text).includes("量了兩天") ||
        !String(sceneMap.get("D0-2").get("n23").text).includes("量了兩天") ||
        /\u534a個月|一星期/.test(String(d01.get("n2").text) + String(sceneMap.get("D0-2").get("n23").text)))
      throw new Error("第四章對馬賽船上實驗的回憶未統一為兩天");
    if (!String(d12.get("n3").text).includes("比薩斜面") ||
        !String(d12.get("n8").text).includes("那疊斜面紀錄"))
      throw new Error("D1-2 仍以章號代替比薩斜面的具體紀錄");
    if (!String(d41.get("n23").text).includes("章有三種") ||
        !String(d41.get("n28").text).includes("你自己貼得上") ||
        !String(d41.get("n29").text).includes("木匣裡沒有"))
      throw new Error("D4-1 過帳規則仍是後台術語，或沒有寫出可見後果");
    const printerNodes = [["D4-2", "n2"], ["DE-2", "n3"], ["DE-2", "n7"]];
    if (printerNodes.some(([sceneId, nodeId]) => sceneMap.get(sceneId).get(nodeId).speaker !== "印刷工") ||
        !/合成(?:的)?人物|合成角色/.test(String(sceneMap.get("D4-2").get("n12").text)))
      throw new Error("印刷工名牌仍混入製作註，或玩家可見史實邊界遺失");
    const aphorismShape = /不是[^。\n]{0,48}[，；]是/g;
    const activeAphorisms = scenes4.scenes.flatMap((scene) => scene.nodes
      .filter((node) => node.legacyOnly !== true)
      .flatMap((node) => String(node.text || "").match(aphorismShape) || []));
    if (activeAphorisms.length > 3)
      throw new Error("第四章『不是 X，是 Y』格言密度超過三句");
    if (((activeAphorisms.join("\n") + "\n不是甲，是乙。\n不是丙，是丁。")
          .match(aphorismShape) || []).length <= 3)
      throw new Error("第四章格言密度負向控制沒有轉紅");
    const d22Text = scenes4.scenes.find((scene) => scene.id === "D2-2").nodes
      .map((node) => ch4NodeText(node) + " " + String(node.speaker || "")).join("\n");
    if (!d21Text.includes("1679-11-24") && !d21Text.includes("1679 年 11 月 24 日"))
      throw new Error("虎克第一封信沒有鎖定 1679-11-24");
    if (!d22Text.includes("1680-01-06") && !d22Text.includes("1680 年 1 月 6 日"))
      throw new Error("虎克第二封信沒有鎖定 1680-01-06");
    if (!String(sceneMap.get("D2-2").get("n12").text).includes("兩封信各自留下的主張，不列為新證據") ||
        String(sceneMap.get("D4-2").get("n5").text).includes("替代答案"))
      throw new Error("虎克書信的證據邊界或印刷台的『證明』用詞漂移");
    const ch4Ui = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
    if (!ch4Ui.includes("1680 年又提出平方反比猜想；牛頓完成數學證明、球體處理與跨天體整合"))
      throw new Error("K5 虎克精確歸功句漏掉第二封信或牛頓的球體處理");
    const orbit4Ui = ch4Ui.slice(
      ch4Ui.indexOf("function orbit4Error"),
      ch4Ui.indexOf("第五章：兩本帳工作台")
    );
    const visibleBackendTerms = [
      "由玩家", "玩家親手", "玩家決定", "玩家蓋章", "待玩家",
      "系統不能", "系統沒有", "由系統", "封量級賭注", "量級賭注", "原押注",
      "旅人在第一章", "先回想第一章"
    ];
    for (const term of visibleBackendTerms)
      if (orbit4Ui.includes('"' + term) || orbit4Ui.includes("'" + term))
        throw new Error("第四章動態工作台仍顯示後台／章外語氣:" + term);
    if (!ch4Ui.includes("function orbit4DisplayNote") ||
        (ch4Ui.match(/orbit4DisplayNote\(o\.(?:tangentRecord|closedRecord)\.note\)/g) || []).length !== 2)
      throw new Error("第四章舊存檔的引擎 note 未在顯示邊界轉譯，可見『玩家』將回潮");
    const historyText = hj.rows.map((row) => row.item + " " + row.note).join("\n");
    for (const disclosure of [
      "山頂大砲思想實驗", "1679 年通信後", "1687 初版",
      "Kircher 62½", "1726 第三版", "Street 60⅖"
    ]) if (!historyText.includes(disclosure))
      throw new Error("第四章 runtime 史實頁缺版本／前移揭露:" + disclosure);
    const timed = readFileSync(path.join(here, "../src/stage/05-events.part.js"), "utf-8");
    if (/setTimeout[\s\S]{0,180}(?:choose|advance|embedComplete)/.test(timed))
      throw new Error("舞台仍可能用計時器代按劇情轉場");
    const stageHtml = readFileSync(path.join(here, "../stage.html"), "utf-8");
    if (!stageHtml.includes("white-space:normal; overflow-wrap:anywhere"))
      throw new Error("低高度橫屏任務標題仍可能以 nowrap 穿入說明欄");
  }
});

tests.push({
  name: "第四章 K0→K2|來源紙不是證據、所有選擇無預設、K2 可先於 K1",
  fn: () => {
    let s = Engine4.initialState();
    const untouched = JSON.stringify(s);
    if (s.sourceLab.tangentPrediction.choice !== null ||
        Object.values(s.evidence).some(Boolean))
      throw new Error("第四章初始狀態預填 K0 或證據");
    let r = Engine4.sealTangentPrediction(s, "arc");
    if (r.ok !== false || r.state.sourceLab.attempts.length !== 1 ||
        r.state.sourceLab.tangentPrediction.sealed || Object.values(r.state.evidence).some(Boolean) ||
        JSON.stringify(s) !== untouched)
      throw new Error("K0 錯選未保留退件、偷改正解、偷發證據或破壞純函式");
    s = Engine4.sealTangentPrediction(r.state, "tangent").state;
    if (!s.sourceLab.tangentPrediction.sealed || s.sourceLab.tangentPrediction.choice !== "tangent" ||
        Object.values(s.evidence).some(Boolean))
      throw new Error("K0 正確來源紙被算成第六份證據");
    r = Engine4.sealScalePrediction(s, "one-sixtieth"); s = r.state;
    if (!r.ok || s.scaleLab.scalePrediction.openedAt !== null) throw new Error("量級沒有先封存後揭曉");
    r = Engine4.convertMoonTime(s, "divide-60"); s = r.state;
    if (r.ok || s.scaleLab.conversionAttempts.length !== 1 || s.scaleLab.conversionCorrect)
      throw new Error("錯換算未保留，或系統代做正解");
    s = Engine4.convertMoonTime(s, "divide-3600").state;
    r = Engine4.judgeScaleRatio(s, 360); s = r.state;
    if (r.ok || s.scaleLab.ratioCorrect) throw new Error("錯倍率仍通過");
    s = Engine4.judgeScaleRatio(s, 3600).state;
    r = Engine4.judgeScaleRelation(s, "add"); s = r.state;
    if (r.ok || s.evidence.k2) throw new Error("錯關係仍取得 K2");
    r = Engine4.judgeScaleRelation(s, "multiply"); s = r.state;
    if (!r.ok || !s.evidence.k2 || s.evidence.k1 ||
        !s.scaleLab.relationCorrect || s.scaleLab.lawLocked !== 2 ||
        s.scaleLab.scalePrediction.matched !== false)
      throw new Error("K2 未能先於 K1 成立，或錯押注被成功畫面洗掉");
    if (!(s.scaleLab.scalePrediction.openedAt > s.scaleLab.scalePrediction.sealedAt))
      throw new Error("量級預測時間線不是先封存後揭曉");
  }
});

tests.push({
  name: "第四章 K1 作圖|四項先封、玩家三拍、Newton 續畫，舊自動 API 不可偽造",
  fn: () => {
    const ready = ch4K0K2State();
    if (Engine4.sealOrbitRule(ready, {}, "circle").error !== "bad-orbit-target")
      throw new Error("四項空白時引擎偷偷補預設");
    let s = Engine4.sealOrbitRule(ready, {
      target:"earth-center", speed:"medium", strength:"medium"
    }, "circle").state;
    let wrong = Engine4.commitOrbitBeat(s); s = wrong.state;
    if (wrong.ok || wrong.consequence !== "aim-off-rule" || s.orbitLab.manualBeats.length !== 1)
      throw new Error("錯角度沒有留下第一拍失敗");
    s = Engine4.resetOrbitBeats(s).state;
    if (s.orbitLab.manualAttempts.length !== 1 || s.orbitLab.manualBeats.length ||
        s.orbitLab.manualAttempts[0].beats.length !== 1)
      throw new Error("重置洗掉錯拍，或舊拍仍混入新紙");
    s = Engine4.commitOrbitBeat(s).state;
    s = Engine4.resetOrbitBeats(s).state;
    if (s.orbitLab.manualAttempts.length !== 2 ||
        !(s.orbitLab.manualAttempts[0].resetAt <
          s.orbitLab.manualAttempts[1].resetAt))
      throw new Error("第二張幽靈作圖紙沒有按重做時間追加");
    for (let i = 0; i < 3; i++) {
      s = ch4AimAtCurrentCenter(s);
      const beat = Engine4.commitOrbitBeat(s); s = beat.state;
      if (!beat.ok || beat.step !== i + 1) throw new Error("玩家第 " + (i + 1) + " 拍未成立");
    }
    if (!s.orbitLab.manualComplete || s.orbitLab.manualBeats.length !== 3 ||
        !(s.orbitLab.firstStepAt > s.orbitLab.ruleSeal.sealedAt))
      throw new Error("K1 缺三拍或預測／落筆時間線倒置");

    const offsets = Engine4._ORBIT_RULES.aimOffsets;
    if (offsets.length !== 3 || !(offsets[0] > 0 && offsets[1] < 0 && offsets[2] > 0) ||
        offsets.some((offset) => Math.abs(offset / (Math.PI / 30) -
          Math.round(offset / (Math.PI / 30))) < 0.01))
      throw new Error("三拍偏角沒有交錯，或仍是 6 度按鍵的整數倍");

    let shortcut = Engine4.sealOrbitRule(ch4K0K2State(), {
      target:"earth-center", speed:"medium", strength:"medium"
    }, "circle").state;
    const shortcutBeats = [];
    for (let beatIndex = 0; beatIndex < 3; beatIndex++) {
      for (let click = 0; click < 3; click++)
        shortcut = Engine4.nudgeOrbitAim(shortcut, -Math.PI / 30).state;
      const beat = Engine4.commitOrbitBeat(shortcut);
      shortcutBeats.push(beat.beat);
      shortcut = beat.state;
    }
    if (shortcut.orbitLab.manualComplete || shortcutBeats.every((beat) => beat.valid))
      throw new Error("固定每拍逆時針三次仍可不看圖完成 K1");

    const legacyPartial = JSON.parse(JSON.stringify(
      Engine4.sealOrbitRule(ch4K0K2State(), {
        target:"earth-center", speed:"medium", strength:"medium"
      }, "circle").state
    ));
    delete legacyPartial.orbitLab.ruleSeal.aimPattern;
    delete legacyPartial.orbitLab.activeRule.aimPattern;
    legacyPartial.orbitLab.aimAngle += 0.6 - offsets[0];
    if (!Engine4._orbitPartialAudit(legacyPartial))
      throw new Error("舊固定偏角的進行中存檔無法相容重播");
    const forgedPartialLab = JSON.parse(JSON.stringify(s));
    forgedPartialLab.orbitLab.manualBeats[0].after.x = 999;
    const N4Partial = Narrative._factory(scenes4, Engine4, {});
    const forgedPartialSave = N4Partial.initialState("explore");
    forgedPartialSave.lab = forgedPartialLab;
    forgedPartialSave.evidence = { K2:true };
    forgedPartialSave.cursor = { scene:"D2-1", node:"e1" };
    forgedPartialSave.eventLog = [{
      t:"lab",
      action:"judgeScaleRelation",
      sequence:forgedPartialLab.claims.k2[0].at,
      at:"D1-2/e1"
    }];
    const San4Partial = require("../src/sanitize.js");
    if (San4Partial.sanitizeImport4(
      forgedPartialSave, scenes4, Engine4
    ).ok)
      throw new Error("尚未續畫的三拍座標可被竄改後讀回");
    if (Engine4.continueOrbitRule(forgedPartialLab).error !==
        "invalid-orbit-record")
      throw new Error("continueOrbitRule 仍信任被竄改的 in-progress 三拍");
    if (Engine4.assertK1(s, ["tangent", "closed"], "forward-plus-inward-turn").ok)
      throw new Error("Newton 續畫前即可取得 K1");
    const continued = Engine4.continueOrbitRule(s); s = continued.state;
    if (!continued.ok || continued.run.playerBeats.length !== 3 ||
        continued.run.continuedBeats < 27 || continued.run.actualShape !== "circle" ||
        continued.run.continuationSource !== "player-three-beats+newton-27" ||
        !(continued.run.continuedAt > continued.run.firstStepAt))
      throw new Error("Newton 沒有在玩家三拍後沿同一規則續畫");
    const playerPrefix = [continued.run.playerBeats[0].before]
      .concat(continued.run.playerBeats.map((beat) => beat.after));
    if (JSON.stringify(continued.run.path.slice(0, 4)) !== JSON.stringify(playerPrefix))
      throw new Error("Newton 續畫沒有從玩家親手留下的三拍接著走");
    if (Engine4.assertK1(s, ["tangent", "closed"], "forward-push").ok)
      throw new Error("向前推力錯解仍取得 K1");
    s = Engine4.assertK1(s, ["closed", "tangent"], "forward-plus-inward-turn").state;
    if (!s.evidence.k1) throw new Error("K1 正確四項封存與三拍仍未成立");
    const validHistorySave = N4Partial.initialState("explore");
    validHistorySave.lab = JSON.parse(JSON.stringify(s));
    validHistorySave.evidence = { K1:true, K2:true };
    validHistorySave.cursor = { scene:"D2-1", node:"e1" };
    validHistorySave.eventLog = [
      {
        t:"lab", action:"judgeScaleRelation",
        sequence:s.claims.k2[0].at, at:"D1-2/e1"
      },
      {
        t:"lab", action:"assertK1", sequence:s.claims.k1[0].at,
        at:"D2-1/e1",
        args:{
          records:["closed", "tangent"],
          concept:"forward-plus-inward-turn"
        }
      }
    ];
    if (!San4Partial.sanitizeImport4(
      validHistorySave, scenes4, Engine4
    ).ok)
      throw new Error("兩張合法幽靈作圖紙遭匯入淨化誤拒");
    const reversedGhosts = JSON.parse(JSON.stringify(validHistorySave));
    reversedGhosts.lab.orbitLab.manualAttempts.reverse();
    if (San4Partial.sanitizeImport4(
      reversedGhosts, scenes4, Engine4
    ).ok)
      throw new Error("幽靈作圖紙倒序後仍可讀回");
    const completedBeforeReset = JSON.stringify(s);
    const resetCompleted = Engine4.resetOrbitBeats(s);
    if (resetCompleted.error !== "completed-orbit-record-locked" ||
        JSON.stringify(s) !== completedBeforeReset)
      throw new Error("K1 完成後仍可重置三拍，或拒絕時破壞輸入 state");
    const resealedBeforeK3 = Engine4.sealOrbitRule(s, {
      target:"earth-center", speed:"slow", strength:"short"
    }, "circle");
    if (!resealedBeforeK3.ok || resealedBeforeK3.state.evidence.k1)
      throw new Error("尚未進 K3 前重封規則，舊 K1 沒有正確撤回");

    if (typeof Engine4.runOrbitRule === "function")
      throw new Error("舊 runOrbitRule 自動跑表仍暴露在 runtime API，可繞過玩家三拍");

    for (const [speed, strength] of [
      ["slow", "short"], ["medium", "medium"], ["fast", "long"]
    ]) {
      const matched = ch4CompleteK1(ch4K0K2State(), speed, strength);
      const run = matched.orbitLab.ruleRuns.at(-1);
      if (run.actualShape !== "circle" || !run.predictionMatched)
        throw new Error("v² 三組相配解未形成近圓:" + speed + "/" + strength);
    }

    /* slow/short 的設定查表答案是 circle；玩家合法地把三拍分別轉
       -12°、+36°、-18° 後，實際紙帶會成為 ellipse。這筆專門防止
       新 run 的分類又退回設定查表，也讓匯入稽核讀同一條實際路徑。 */
    let pathClassified = Engine4.sealOrbitRule(ch4K0K2State(), {
      target:"earth-center", speed:"slow", strength:"short"
    }, "ellipse").state;
    for (const clicks of [-2, 6, -3]) {
      for (let i = 0; i < Math.abs(clicks); i++) {
        const turned = Engine4.nudgeOrbitAim(
          pathClassified, Math.sign(clicks) * Math.PI / 30
        );
        if (turned.error) throw new Error("實際路徑分類探針無法轉動箭頭");
        pathClassified = turned.state;
      }
      const beat = Engine4.commitOrbitBeat(pathClassified);
      if (beat.error || !beat.ok)
        throw new Error("實際路徑分類探針沒有留下合法三拍");
      pathClassified = beat.state;
    }
    const pathContinuation = Engine4.continueOrbitRule(pathClassified);
    if (pathContinuation.error ||
        pathContinuation.run.actualShape !== "ellipse" ||
        pathContinuation.run.classificationSource !== "simulated-path-v1" ||
        !Engine4._orbitRunAudit(pathContinuation.run))
      throw new Error(
        "K1 實際路徑分類退回設定查表；slow/short 的合法偏轉紙應判為 ellipse"
      );
  }
});

tests.push({
  name: "第四章 A-5 九宮格|慢短、中中、快長為近圓，其餘六組不得冒充近圓",
  fn: () => {
    const nearPairs = new Set(["slow:short", "medium:medium", "fast:long"]);
    const speeds = ["slow", "medium", "fast"];
    const strengths = ["short", "medium", "long"];
    const outcomes = [];

    for (const speed of speeds) for (const strength of strengths) {
      let s = Engine4.sealOrbitRule(ch4K0K2State(), {
        target:"earth-center", speed, strength
      }, "circle").state;
      for (let beatIndex = 0; beatIndex < 3; beatIndex++) {
        s = ch4AimAtCurrentCenter(s);
        const beat = Engine4.commitOrbitBeat(s);
        if (beat.error || !beat.ok)
          throw new Error(`九宮格 ${speed}/${strength} 第 ${beatIndex + 1} 拍無法成立`);
        s = beat.state;
      }
      const continued = Engine4.continueOrbitRule(s);
      if (continued.error || !continued.run)
        throw new Error(`九宮格 ${speed}/${strength} 無法完成牛頓續畫`);
      const run = continued.run;
      const reportedNear = run.actualShape === "circle" && run.outcome === "near-circle";
      /* 玩家只畫三拍、牛頓再畫二十七拍的粗紙帶，本來就比連續積分厚。
         數值護欄只要求三組相配解留在地球附近；其餘六組至少越過一側。 */
      const numericallyNear =
        run.minRadius >= 0.82 && run.maxRadius <= 1.08;
      const expectedNear = nearPairs.has(`${speed}:${strength}`);
      if (reportedNear !== numericallyNear)
        throw new Error(
          `九宮格 ${speed}/${strength} 標籤與數值路徑矛盾：` +
          `shape=${run.actualShape}, outcome=${run.outcome}, ` +
          `radius=${run.minRadius}–${run.maxRadius}`
        );
      if (reportedNear !== expectedNear)
        throw new Error(
          `九宮格 ${speed}/${strength} 分類錯誤：` +
          `預期 ${expectedNear ? "near-circle" : "非 near-circle"}，` +
          `實得 ${run.actualShape}/${run.outcome}`
        );
      outcomes.push(`${speed}:${strength}=${run.outcome}`);
    }

    if (outcomes.length !== 9 ||
        outcomes.filter((row) => row.endsWith("=near-circle")).length !== 3)
      throw new Error("A-5 九宮格沒有完整鎖住三個近圓解與六個錯配後果");
  }
});

tests.push({
  name: "第四章 K3|火星木星先封存後揭露、兩筆齊全才成立",
  fn: () => {
    let s = ch4CompleteK1(ch4K0K2State());
    if (s.planetLab.revealed.mars || s.planetLab.revealed.jupiter)
      throw new Error("行星資料開局已揭露");
    let r = Engine4.sealPlanetPrediction(s, "mars", "short"); s = r.state;
    if (!r.prediction.sealed || r.prediction.revealedAfterSeal ||
        s.planetLab.revealed.mars || r.prediction.playerBandMatched)
      throw new Error("火星錯押沒有先封存、仍提前揭露，或錯押被改成正確");
    if (Engine4.revealPlanetPredictions(s).error !== "two-planet-predictions-required")
      throw new Error(
        "K3 雙封閘門失效：只封火星就能揭曉，應回 two-planet-predictions-required"
      );
    if (Engine4.assertK3(s, ["mars-sealed"], "withheld-data-prediction").ok)
      throw new Error("單顆行星即可取得 K3");
    r = Engine4.sealPlanetPrediction(s, "jupiter", "short"); s = r.state;
    if (s.planetLab.crossScalePass || s.planetLab.revealed.jupiter)
      throw new Error("兩張封口剛完成就自行揭露或提前取得跨尺度資格");
    r = Engine4.revealPlanetPredictions(s); s = r.state;
    const mars = s.planetLab.predictions.find((row) => row.planet === "mars" && !row.superseded);
    const jupiter = s.planetLab.predictions.find((row) => row.planet === "jupiter" && !row.superseded);
    if (!s.planetLab.crossScalePass || !s.planetLab.revealed.mars ||
        !s.planetLab.revealed.jupiter ||
        !mars.pass || mars.playerBandMatched !== false ||
        !jupiter.pass || jupiter.playerBandMatched !== false ||
        !(mars.openedAt > mars.sealedAt && jupiter.openedAt > jupiter.sealedAt))
      throw new Error("兩張沒有一起揭露，或任一顆錯押週期反而阻斷規則核對");
    s = Engine4.assertK3(
      s, ["jupiter-sealed", "mars-sealed"], "withheld-data-prediction"
    ).state;
    if (!s.evidence.k3) throw new Error("兩筆封存預測未成立 K3");
    if (typeof Engine4.unlockDistanceLaw === "function")
      throw new Error("揭露觀測後仍暴露舊解鎖 API，可把看過答案偽裝成新預測");
    if (typeof Engine4.predictPlanet === "function")
      throw new Error("舊 predictPlanet 仍從引擎匯出，可在同一次動作封存又揭曉");
    const narrativeSource = readFileSync(
      path.join(here, "../src/narrative.js"), "utf-8"
    );
    if (narrativeSource.includes('action === "predictPlanet"') ||
        JSON.stringify(scenes4).includes('"labAction":"predictPlanet"'))
      throw new Error("舊 predictPlanet 仍可由敘事資料或派送層重新接回");
  }
});

tests.push({
  name: "第四章 K4 對帳桌|逐格蓋章、借條 append-only、原始結果零固定 patches",
  fn: () => {
    let s = ch4CompleteK3(ch4CompleteK1(ch4K0K2State()));
    if (Engine4.beginLedgerRow(s, "moon").error !== "press-opening-choice-required")
      throw new Error("哈雷出版窗口尚未決定，對帳桌就自行開啟");
    if (Engine4.connectCometTracks(s, "same-orbit").error !==
        "press-opening-choice-required")
      throw new Error("哈雷出版取捨尚未成立，彗星接軌就先開始");
    if (Engine4.sealModelComparison(s, "actual-ledger").error !== "press-opening-choice-required")
      throw new Error("未選 partial／defer 即可繞過對帳桌封出 K4");
    s = Engine4.deferPress(s, "等待三列對帳完成").state;
    if (s.proof.press.openingChoice !== "defer" ||
        s.proof.press.delays.length !== 1 || s.proof.press.window !== 2)
      throw new Error("主動延後未留下理由與窗口成本");
    if (Engine4.beginLedgerRow(s, "comet").error !== "comet-join-required")
      throw new Error("彗星尚未接成同一條軌跡即可先開對帳列");
    let r = Engine4.connectCometTracks(s, "hard-kink"); s = r.state;
    if (r.ok || r.consequence !== "comet-kink" || s.cometLab.joined)
      throw new Error("彗星硬接未留下折角");
    s = Engine4.connectCometTracks(s, "same-orbit").state;
    const joinedBeforeRetry = JSON.stringify(s);
    const retryJoinedComet = Engine4.connectCometTracks(s, "hard-kink");
    if (retryJoinedComet.error !== "comet-connection-locked" ||
        JSON.stringify(s) !== joinedBeforeRetry)
      throw new Error("彗星接軌成立後仍可用硬折角覆寫，或拒絕時破壞輸入 state");

    r = Engine4.beginLedgerRow(s, "moon"); s = r.state;
    const moonRuns = s.modelLab.runs.filter((run) => run.caseId === "moon");
    if (!r.thoughtSuccess || moonRuns.length !== 2 ||
        moonRuns.some((run) => Object.prototype.hasOwnProperty.call(run, "patches")))
      throw new Error("月亮列沒有認知停頓，或原始結果仍藏固定 patches");
    r = Engine4.stampLedgerCell(s, "moon", "simpleVortex", "matches"); s = r.state;
    if (r.ok || s.modelLab.stampAttempts.at(-1).ok ||
        s.modelLab.rowStage.moon.vortexStamp)
      throw new Error("錯章沒有彈回並保留退件");
    s = Engine4.stampLedgerCell(s, "moon", "inverseSquare", "matches").state;
    s = Engine4.stampLedgerCell(s, "moon", "simpleVortex", "story").state;
    if (!s.modelLab.rowStage.moon.complete) throw new Error("月亮兩格正確章未完成");

    s = Engine4.beginLedgerRow(s, "planets").state;
    s = Engine4.stampLedgerCell(s, "planets", "inverseSquare", "matches").state;
    r = Engine4.stampLedgerCell(s, "planets", "simpleVortex", "mismatch"); s = r.state;
    if (!r.awaitsLoan || s.modelLab.rowStage.planets.complete ||
        s.modelLab.loans.length || s.modelLab.loanDecisions.planets)
      throw new Error("兩格落章後系統代替玩家貼借條或完成本列");
    s = Engine4.declineModelLoan(s, "planets").state;
    if (!s.modelLab.rowStage.planets.complete ||
        Engine4.addModelLoan(s, "planets").error !== "loan-decision-locked")
      throw new Error("不借決定未鎖定");

    s = Engine4.beginLedgerRow(s, "comet").state;
    s = Engine4.stampLedgerCell(s, "comet", "inverseSquare", "matches").state;
    s = Engine4.stampLedgerCell(s, "comet", "simpleVortex", "mismatch").state;
    s = Engine4.addModelLoan(s, "comet").state;
    if (s.modelLab.loans.length !== 1 || s.modelLab.loans[0].caseId !== "comet" ||
        Engine4.declineModelLoan(s, "comet").error !== "loan-decision-locked")
      throw new Error("借條不是玩家實際操作的 append-only 紀錄");
    r = Engine4.sealModelComparison(s, "all-vortices"); s = r.state;
    if (r.ok || s.evidence.k4) throw new Error("越界否定所有渦旋仍取得 K4");
    r = Engine4.sealModelComparison(s, "actual-ledger"); s = r.state;
    if (!r.ok || !s.evidence.k4 || r.evidencePackage.loans.length !== 1 ||
        JSON.stringify(r.evidencePackage.rowOrder) !== JSON.stringify(["moon", "planets", "comet"]) ||
        s.modelLab.runs.some((run) => Object.prototype.hasOwnProperty.call(run, "patches")))
      throw new Error("K4 證據包沒有逐格章、實際順序與玩家借條的真實狀態");

    const noLoanState = ch4CompleteK4(
      ch4CompleteK3(ch4CompleteK1(ch4K0K2State())), []
    );
    if (!noLoanState.evidence.k4 || noLoanState.modelLab.loans.length !== 0 ||
        noLoanState.modelLab.loanDecisions.planets !== "no-loan" ||
        noLoanState.modelLab.loanDecisions.comet !== "no-loan" ||
        !noLoanState.modelLab.evidencePackage.claimText.includes("另外兩格對不上"))
      throw new Error("兩張借條都拒絕時，K4 未能結案或失配被偷偷抹平");

    for (const legacyApi of [
      "setModelProtocol", "sealModelPrediction", "runModelSuite", "runModel", "assertK4"
    ]) if (typeof Engine4[legacyApi] === "function")
      throw new Error("schema1 自動跑表 API 仍可繞過蓋章／借條:" + legacyApi);
  }
});

tests.push({
  name: "第四章 K5 印刷台|六槽、球殼頁與旅人退出作者欄都必須親手完成",
  fn: () => {
    let s = ch4CompleteK4(ch4CompleteK3(ch4CompleteK1(ch4K0K2State())));
    if (Engine4.placeShellPage(s).error !== "shell-page-not-ready")
      throw new Error("球殼頁未翻出即可由系統代放");
    if (Engine4.removeTravelerFromAuthorField(s).error !== "hooke-scope-required")
      throw new Error("署名來源未釐清即可跳過程序");
    const scopedTooEarly = Engine4.setHookeScope(s, "precise-scope").state;
    if (Engine4.removeTravelerFromAuthorField(scopedTooEarly).error !==
        "shell-page-placement-required")
      throw new Error("球殼頁尚未入槽即可先退出作者欄");
    if (Engine4.clipEvidence(s, "K1").error !== "completed-proof-required")
      throw new Error("K5 尚未送出即可先夾頁並鎖死後續校樣");
    for (const [slot, evidenceId] of [
      ["inertia", "M3"], ["inward", "K1"], ["distance", "K2"],
      ["withheld", "K3"], ["model", "K4"]
    ]) s = Engine4.placeProofLink(s, slot, evidenceId).state;
    s = Engine4.revealShellPage(s).state;
    if (!s.proof.shellPageReady || s.proof.shellPagePlaced ||
        s.proof.slots.some((slot) => slot.slot === "shell"))
      throw new Error("翻頁動作順便把球殼頁代放進第六槽");
    s = Engine4.placeShellPage(s).state;
    if (!s.proof.shellPagePlaced ||
        s.proof.slots.find((slot) => slot.slot === "shell")?.evidenceId !== "SHELL")
      throw new Error("玩家放入球殼頁後第六槽仍未成立");
    s = Engine4.setHookeScope(s, "precise-scope").state;
    for (const [contribution, person] of Object.entries(Engine4._CREDIT_EXPECT))
      s = Engine4.assignCredit(s, contribution, person).state;
    s = Engine4.setBoundary(s, "ruleEstablished").state;
    let preview = Engine4.previewProof(s).preview;
    if (preview.complete || preview.authorOk || !preview.shellOk)
      throw new Error("旅人未退出作者欄時校樣仍能完成");
    let submitted = Engine4.submitProof(s); s = submitted.state;
    if (submitted.ok || s.evidence.k5) throw new Error("作者欄未處理仍取得 K5");
    s = Engine4.removeTravelerFromAuthorField(s).state;
    if (!s.proof.authorField.travelerRemoved ||
        JSON.stringify(s.proof.authorField.names) !== JSON.stringify(["Newton"]))
      throw new Error("旅人沒有原封不動退出作者欄");
    preview = Engine4.previewProof(s).preview;
    if (!preview.complete || s.evidence.k5) throw new Error("完整預覽自動送印或仍有缺口");
    submitted = Engine4.submitProof(s);
    if (!submitted.ok || !submitted.state.evidence.k5 ||
        submitted.proof.slots.length !== 6)
      throw new Error("六槽與署名完成後仍未取得 K5");
    const archiveMissingK3 = JSON.parse(JSON.stringify(submitted.state));
    archiveMissingK3.evidence.k3 = false;
    const rejectedArchive = Engine4.archiveEvidenceSet(archiveMissingK3);
    if (rejectedArchive.error !== "archive-evidence-set-incomplete" ||
        rejectedArchive.userMessage !== "還有證據沒完成：K3。" ||
        JSON.stringify(rejectedArchive.state) !== JSON.stringify(archiveMissingK3))
      throw new Error("章末歸檔遇缺證據時沒有具名提示，或拒絕時改動了 state");
    const N4ArchiveChoice = Narrative._factory(scenes4, Engine4, {});
    const archiveChoiceState = N4ArchiveChoice.initialState("explore");
    archiveChoiceState.cursor = { scene:"DE-1", node:"c1" };
    archiveChoiceState.lab = archiveMissingK3;
    const rejectedArchiveChoice = N4ArchiveChoice.choose(archiveChoiceState, "with_boundaries");
    if (rejectedArchiveChoice.errorCode !== "archive-evidence-set-incomplete" ||
        rejectedArchiveChoice.error !== "還有證據沒完成：K3。" ||
        JSON.stringify(rejectedArchiveChoice.state) !== JSON.stringify(archiveChoiceState))
      throw new Error("DE-1 缺證據時沒有顯示可讀引導，或選項拒絕後沒有完整回滾");
    const archivedSet = Engine4.archiveEvidenceSet(submitted.state);
    if (!archivedSet.ok || !archivedSet.complete ||
        JSON.stringify(archivedSet.archived) !== JSON.stringify(["K1", "K2", "K3", "K4", "K5"]) ||
        JSON.stringify(archivedSet.state.archiveLab.clipped) !==
          JSON.stringify(["K1", "K2", "K3", "K4", "K5"]))
      throw new Error("章末一次歸檔沒有依 K1→K5 保留五筆 append-only 紀錄");
    const resealed = Engine4.sealOrbitRule(submitted.state, {
      target:"earth-center", speed:"slow", strength:"short"
    }, "circle");
    if (resealed.error !== "downstream-records-locked" ||
        JSON.stringify(resealed.state) !== JSON.stringify(submitted.state))
      throw new Error("已有 K3／K4／K5 後仍可局部重封 K1，形成不可續玩的半重置");
    const changedSlot = Engine4.placeProofLink(
      submitted.state, "inertia", "M2"
    );
    if (!changedSlot.ok || changedSlot.state.evidence.k5 ||
        !changedSlot.state.proof.press.proofs.some((row) =>
          row.kind === "complete" && row.superseded === true
        ))
      throw new Error("校樣槽內容改動後，舊 K5 沒有撤回");
    const revised = Engine4.submitProof(changedSlot.state);
    if (!revised.ok || !revised.state.evidence.k5 ||
        revised.proof.rescheduled !== true)
      throw new Error("原排程耗盡後，修正過的完整稿無法補排取得 K5");

    const ui = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
    const proofUi = ui.slice(ui.indexOf('if (phase === "proof")'),
      ui.indexOf('if (phase === "archive")'));
    for (const leakedPreview of [
      "免費預覽校樣", "缺槽 ", "錯槽 ", "署名待修 ",
      "親手壓下完整校樣", "現在就壓下校樣（缺口也會印出）"
    ]) if (proofUi.includes(leakedPreview))
      throw new Error("K5 送印前仍由預覽或按鈕洩漏答案：" + leakedPreview);
    for (const required of [
      "orbit4ProofPreviewText", "透光檢查校樣", "親手壓下目前校樣",
      "它不會告訴你該換哪張紙、哪個名字或哪一句"
    ]) if (!ui.includes(required))
      throw new Error("K5 缺少只顯示版面異常的中性校樣提示：" + required);
  }
});

tests.push({
  name: "第四章重試上限|第 N+1 次先拒絕且不改 state，不產生 sanitizer 死存檔",
  fn: () => {
    const expectLocked = (label, state, call, error) => {
      const before = JSON.stringify(state);
      const result = call(state);
      if (result.error !== error || JSON.stringify(state) !== before ||
          JSON.stringify(result.state) !== before)
        throw new Error(label + " 未在 mutation 前穩定拒絕");
    };

    let s = Engine4.initialState();
    s.sourceLab.attempts = Array.from({ length:30 }, (_, i) => ({
      choice:"arc", ok:false, at:i + 1
    }));
    expectLocked("K0", s,
      (state) => Engine4.sealTangentPrediction(state, "arc"),
      "source-attempt-limit");

    s = Engine4.initialState();
    s.sourceLab.tangentPrediction = { choice:"tangent", sealed:true, sealedAt:1 };
    s.scaleLab.scalePrediction = {
      choice:"one-over-3600", sealed:true, sealedAt:2,
      openedAt:3, matched:true
    };
    s.scaleLab.conversionAttempts = Array.from({ length:30 }, (_, i) => ({
      choice:"divide-60", ok:false, at:i + 3
    }));
    expectLocked("K2", s,
      (state) => Engine4.convertMoonTime(state, "divide-60"),
      "scale-attempt-limit");

    s = Engine4.initialState();
    s.evidence = { k1:true, k2:true, k3:true, k4:false, k5:false };
    s.proof.press.openingChoice = "defer";
    s.proof.press.priorityRecord = {
      route:"raised-at-press", source:"hooke-letter-1679",
      return:"保留完整反驗時間，署名爭議延至印刷台", at:1
    };
    s.cometLab.attempts = Array.from({ length:100 }, (_, i) => ({
      id:i + 1, mode:"hard-kink", ok:false, at:i + 2,
      note:"只把兩張紙的最近端點硬接，接縫留下觀測不支持的折角"
    }));
    expectLocked("彗星", s,
      (state) => Engine4.connectCometTracks(state, "hard-kink"),
      "comet-attempt-limit");

    s = Engine4.initialState();
    s.modelLab.rowStage.moon = {
      openedAt:1, forceStamp:null, vortexStamp:null,
      complete:false, completedAt:null
    };
    s.modelLab.stampAttempts = Array.from({ length:100 }, (_, i) => ({
      id:i + 1, caseId:"moon", model:"inverseSquare",
      stamp:"story", expected:"matches", ok:false, at:i + 2
    }));
    expectLocked("蓋章", s,
      (state) => Engine4.stampLedgerCell(
        state, "moon", "inverseSquare", "story"
      ),
      "stamp-attempt-limit");

    s = Engine4.initialState();
    s.evidence.k4 = true;
    s.proof.slotAttempts = Array.from({ length:100 }, (_, i) => ({
      id:i + 1, slot:"inertia", evidenceId:"K1", ok:false, at:i + 1
    }));
    expectLocked("六槽", s,
      (state) => Engine4.placeProofLink(state, "inertia", "M3"),
      "proof-attempt-limit");

    s = Engine4.initialState();
    s.evidence.k4 = true;
    expectLocked("六槽未知來源", s,
      (state) => Engine4.placeProofLink(state, "inertia", "FORGED"),
      "unknown-proof-source");

    s = Engine4.initialState();
    s.evidence = { k1:true, k2:true, k3:true, k4:false, k5:false };
    expectLocked("延後理由長度", s,
      (state) => Engine4.deferPress(state, "x".repeat(241)),
      "delay-reason-required");

    s = Engine4.initialState();
    s.evidence = { k1:true, k2:true, k3:true, k4:true, k5:false };
    s.proof.press.proofs = Array.from({ length:100 }, (_, i) => ({
      kind:"wrong-proof", complete:false, submittedAt:i + 1
    }));
    expectLocked("校樣", s,
      (state) => Engine4.submitProof(state),
      "press-attempt-limit");

    s = Engine4.initialState();
    s.claims.k1 = Array.from({ length:100 }, (_, i) => ({
      id:i + 1, sources:[], concept:null, ok:false,
      at:i + 1, action:"assertK1", source:"player-assertion"
    }));
    expectLocked("斷言", s,
      (state) => Engine4.assertK1(state, [], "wrong"),
      "claim-attempt-limit");
  }
});

tests.push({
  name: "第四章存檔遷移接線|schema1→2 先轉後 sanitize，三條載入路徑保留逐字原檔",
  fn: () => {
    const html = readFileSync(path.join(here, "../stage.html"), "utf-8");
    const ui = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
    const migrationSource = readFileSync(path.join(here, "../src/ch4-migration.js"), "utf-8");
    new Script(migrationSource, { filename:"ch4-migration.js" });
    const migrationAt = html.indexOf('src="src/ch4-migration.js');
    const narrativeAt = html.indexOf('src="src/narrative.js');
    const uiAt = html.indexOf('src="src/chapter-ui.js');
    if (migrationAt < 0 || !(migrationAt < narrativeAt && migrationAt < uiAt))
      throw new Error("stage 未在 Narrative／UI 前載入 ch4-migration");
    for (const fragment of [
      "migration.migrateText(text, SCENES, window.GB.Engine4)",
      'localStorage.setItem(KEY + "_schema1_backup", report.backupText)',
      "var checked = inspectSaveText(text);",
      "var checked = inspectSaveText(backup);",
      "var checked = inspectSaveText(rawText);",
      "preserveCh4MigrationBackup(imported.migrationReport)"
    ]) if (!ui.includes(fragment)) throw new Error("第四章遷移載入路徑缺失:" + fragment);
    const inspectStart = ui.indexOf("function inspectSaveText(text)");
    const inspectEnd = ui.indexOf("function restoreBackup()", inspectStart);
    const inspectBody = ui.slice(inspectStart, inspectEnd);
    if (!(inspectBody.indexOf("migrateLegacyCh4(text)") <
          inspectBody.indexOf("N.loadSave(prepared)")) ||
        !(inspectBody.indexOf("N.loadSave(prepared)") <
          inspectBody.indexOf("sanitizeLoaded(r.state)")))
      throw new Error("第四章不是先遷移、再 load、最後 sanitize");

    const Migration = require("../src/ch4-migration.js");
    const rawV1 = readFileSync(path.join(here, "fixtures/ch4-v1-base.json"), "utf-8");
    const migrated = Migration.migrateText(rawV1, scenes4, Engine4);
    if (migrated.error || !migrated.migrated ||
        migrated.report?.backupText !== rawV1 || !migrated.report?.notice)
      throw new Error("schema1 原文未逐字保留，或遷移報告缺失");
    const v2 = JSON.parse(migrated.text);
    if (v2.schemaVersion !== 2 || v2.chapter !== "ch4")
      throw new Error("schema1 沒有轉成 schema2");
    const San = require("../src/sanitize.js");
    if (!San.sanitizeImport4(v2, scenes4, Engine4).ok)
      throw new Error("代表性 schema1 遷移結果未通過 sanitizeImport4");
    const passThrough = Migration.migrateText(migrated.text, scenes4, Engine4);
    if (passThrough.migrated || passThrough.report !== null ||
        passThrough.text !== migrated.text)
      throw new Error("schema2 被重複遷移或改寫");
    const goldenCursors = JSON.parse(readFileSync(
      path.join(here, "fixtures/ch4-v1-cursors.json"), "utf-8"
    ));
    const cursorKeys = Migration.legacyCursorKeys();
    if (goldenCursors.nodeCount !== 205 || cursorKeys.length !== 205 ||
        new Set(cursorKeys).size !== 205 ||
        JSON.stringify(cursorKeys) !== JSON.stringify(goldenCursors.cursors))
      throw new Error("schema1 的 205 個合法游標沒有逐一鎖定；15 組遷移測試不得抽樣");
  }
});

tests.push({
  name: "第四章全章走查|12 場主線、五座取證工作台、五證據、schema2 完章可淨化且偽造狀態被拒",
  fn: () => {
    const N4 = Narrative._factory(scenes4, Engine4, {});
    let s = N4.initialState("explore"), guard = 0, terminalWrongSave = null;
    const act = (name, args = {}) => {
      const result = N4.labAction(s, name, args);
      if (result.error) throw new Error(name + ":" + result.error);
      s = result.state;
      return result.result;
    };
    while (!s.ended && guard++ < 600) {
      const view = N4.view(s);
      if (["line", "system", "histfacts"].includes(view.type)) {
        const advanced = N4.advance(s);
        if (advanced.error) throw new Error(advanced.error);
        s = advanced.state;
        continue;
      }
      if (view.type === "choice") {
        const choice = view.scene === "D0-2" && view.nodeId === "c0" ? "evidence-boundary" :
          (view.scene === "D0-2" && view.nodeId === "c1" ? "carry" :
          (view.scene === "D1-1" && view.nodeId === "c1" ? "tangent" :
          (view.scene === "DE-1" && view.nodeId === "c1" ? "with_boundaries" : view.options[0].id)));
        const picked = N4.choose(s, choice);
        if (picked.error) throw new Error(picked.error);
        s = picked.state;
        continue;
      }
      if (view.type === "review") {
        s = N4.setReview(
          s,
          "若沒有作用改向，月亮沿當下方向離開。",
          "這批紙建立可反驗的跨天體規則，沒有回答作用機制。"
        ).state;
        continue;
      }
      if (view.type === "embed" && view.system === "orbit") {
        if (view.phase === "tangent-seal") {
          act("sealTangentPrediction", { choice:"arc" });
          act("sealTangentPrediction", { choice:"tangent" });
        } else if (view.phase === "scale") {
          act("sealScalePrediction", { choice:"one-over-3600" });
          act("convertMoonTime", { choice:"divide-60" });
          act("convertMoonTime", { choice:"divide-3600" });
          act("judgeScaleRatio", { choice:60 });
          act("judgeScaleRatio", { choice:3600 });
          act("judgeScaleRelation", { choice:"add" });
          act("judgeScaleRelation", { choice:"multiply" });
        } else if (view.phase === "orbit-rule") {
          act("sealOrbitRule", {
            config:{ target:"earth-center", speed:"medium", strength:"medium" },
            prediction:"circle"
          });
          act("commitOrbitBeat");
          act("resetOrbitBeats");
          for (let i = 0; i < 3; i++) {
            act("nudgeOrbitAim", { delta:-Engine4._ORBIT_RULES.aimOffsets[i] });
            act("commitOrbitBeat");
          }
          act("continueOrbitRule");
          act("assertK1", {
            records:["tangent", "closed"], concept:"forward-push"
          });
          act("assertK1", {
            records:["tangent", "closed"], concept:"forward-plus-inward-turn"
          });
          act("sealOrbitRule", {
            config:{ target:"earth-center", speed:"slow", strength:"short" },
            prediction:"circle"
          });
          for (let i = 0; i < 3; i++) {
            act("nudgeOrbitAim", { delta:-Engine4._ORBIT_RULES.aimOffsets[i] });
            act("commitOrbitBeat");
          }
          act("continueOrbitRule");
          act("assertK1", {
            records:["tangent", "closed"], concept:"forward-plus-inward-turn"
          });
        } else if (view.phase === "planets") {
          act("sealPlanetPrediction", { id:"mars", bandId:"middle" });
          act("sealPlanetPrediction", { id:"jupiter", bandId:"long" });
          act("revealPlanetPredictions");
          act("assertK3", {
            records:["mars-sealed"],
            concept:"withheld-data-prediction"
          });
          act("assertK3", {
            records:["mars-sealed", "jupiter-sealed"],
            concept:"withheld-data-prediction"
          });
        } else if (view.phase === "models") {
          act("deferPress", { reason:"等待三列對帳完成" });
          act("connectCometTracks", { mode:"hard-kink" });
          act("connectCometTracks", { mode:"same-orbit" });
          for (const caseId of Engine4._CASES) {
            act("beginLedgerRow", { caseId });
            act("stampLedgerCell", { caseId, model:"inverseSquare", stamp:"matches" });
            act("stampLedgerCell", {
              caseId, model:"simpleVortex", stamp:caseId === "moon" ? "story" : "mismatch"
            });
            if (caseId === "planets") act("declineModelLoan", { caseId });
            if (caseId === "comet") act("addModelLoan", { caseId });
          }
          act("sealModelComparison", { claim:"same" });
          act("sealModelComparison", { claim:"actual-ledger" });
        } else if (view.phase === "proof") {
          for (const [slot, evidenceId] of [
            ["inertia", "M3"], ["inward", "K1"], ["distance", "K2"],
            ["withheld", "K3"], ["model", "K4"]
          ]) act("placeProofLink", { slot, evidenceId });
          act("revealShellPage");
          act("placeShellPage");
          act("submitProof");
          act("setHookeScope", { choice:"precise-scope" });
          for (const [contribution, person] of Object.entries(Engine4._CREDIT_EXPECT))
            act("assignCredit", { contribution, person });
          act("setProofBoundary", { choice:"ruleEstablished" });
          act("submitProof");
          terminalWrongSave = JSON.parse(JSON.stringify(s));
          act("removeTravelerFromAuthorField");
          act("submitProof");
        } else if (view.phase === "archive") {
          for (const evidenceId of Engine4._ARCHIVE_IDS) act("clipEvidence", { evidenceId });
        } else {
          throw new Error("未知第四章互動 phase:" + view.phase);
        }
        const completed = N4.embedComplete(s);
        if (completed.error) throw new Error(view.phase + " 閘未過:" + completed.error);
        s = completed.state;
        continue;
      }
      if (view.type === "end") {
        const ended = N4.advance(s);
        if (ended.error) throw new Error(ended.error);
        s = ended.state;
        continue;
      }
      throw new Error("第四章走查卡住:" + JSON.stringify(view));
    }
    if (!s.ended || guard >= 600) throw new Error("第四章未完章");
    for (const id of Engine4._ARCHIVE_IDS) if (!s.evidence[id])
      throw new Error("缺章節證據:" + id);
    if (!s.review.q1 || !s.review.q2) throw new Error("第四章自由回述未保存");
    if (N4.CHAPTER_ID !== "ch4" || N4.SAVE_SCHEMA !== 2 ||
        s.chapter !== "ch4" || s.schemaVersion !== 2)
      throw new Error("第四章不是獨立 schema2");
    const San = require("../src/sanitize.js");
    const finished = JSON.parse(N4.serialize(s));
    const cleaned = San.sanitizeImport4(finished, scenes4, Engine4);
    if (!cleaned.ok) throw new Error("合法 v0.8 完章存檔遭拒:" + cleaned.reason);
    const oldTangentWorkbench = JSON.parse(JSON.stringify(finished));
    oldTangentWorkbench.cursor = { scene:"D1-1", node:"e1" };
    const tangentRedirect = San.sanitizeImport4(oldTangentWorkbench, scenes4, Engine4);
    if (!tangentRedirect.ok || tangentRedirect.state.cursor.scene !== "D1-1" ||
        tangentRedirect.state.cursor.node !== "n4")
      throw new Error("已封 K0 的舊工作台游標沒有依狀態真相略過退役 UI");
    const oldArchiveWorkbench = JSON.parse(JSON.stringify(finished));
    oldArchiveWorkbench.cursor = { scene:"DE-1", node:"e1" };
    const archiveRedirect = San.sanitizeImport4(oldArchiveWorkbench, scenes4, Engine4);
    if (!archiveRedirect.ok || archiveRedirect.state.cursor.scene !== "DE-1" ||
        archiveRedirect.state.cursor.node !== "g1")
      throw new Error("已歸檔的舊工作台游標沒有依狀態真相略過退役 UI");
    const archivedLabBefore = JSON.stringify(finished.lab);
    const editAfterArchive = Engine4.placeProofLink(
      finished.lab, "inertia", "M2"
    );
    if (editAfterArchive.error !== "archive-records-locked" ||
        JSON.stringify(finished.lab) !== archivedLabBefore)
      throw new Error("開始夾回旅人筆記後仍可撤回 K5，或拒絕時改動 state");
    if (!terminalWrongSave ||
        !San.sanitizeImport4(terminalWrongSave, scenes4, Engine4).ok)
      throw new Error("合法的終端錯稿存檔未通過淨化");
    const deletedTerminalWrong = JSON.parse(JSON.stringify(terminalWrongSave));
    deletedTerminalWrong.lab.proof.press.proofs = [];
    deletedTerminalWrong.lab.proof.press.rushTried = false;
    deletedTerminalWrong.lab.proof.press.window = 2;
    deletedTerminalWrong.lab.proof.press.status = "open";
    deletedTerminalWrong.lab.proof.press.scheduleLost = false;
    if (San.sanitizeImport4(deletedTerminalWrong, scenes4, Engine4).ok)
      throw new Error("刪掉最後一張錯稿並復活窗口仍通過匯入");
    const lateCursor = N4.initialState("explore");
    lateCursor.cursor = { scene:"DE-2", node:"s1" };
    if (San.sanitizeImport4(lateCursor, scenes4, Engine4).ok)
      throw new Error("零證據存檔可把游標偽造到章末");
    const lateCursorBefore = JSON.stringify(lateCursor);
    const skippedEnd = N4.advance(lateCursor);
    if (!skippedEnd.error || JSON.stringify(lateCursor) !== lateCursorBefore)
      throw new Error("敘事層允許零證據由章末節點直接完章，或破壞輸入 state");

    const rejectMutation = (label, mutate) => {
      const forged = JSON.parse(JSON.stringify(finished));
      mutate(forged);
      if (San.sanitizeImport4(forged, scenes4, Engine4).ok)
        throw new Error(label + "仍通過匯入");
    };
    const authorExitEvent = finished.eventLog.find((event) =>
      event && event.t === "lab" &&
      event.action === "removeTravelerFromAuthorField");
    if (!authorExitEvent ||
        authorExitEvent.sequence !== finished.lab.proof.authorField.removedAt)
      throw new Error("合法第四章存檔缺作者欄退出操作的同序號事件");
    rejectMutation("K5 作者欄退出操作序號與狀態不一致", (forged) => {
      forged.eventLog.find((event) =>
        event && event.t === "lab" &&
        event.action === "removeTravelerFromAuthorField"
      ).sequence += 1;
    });
    rejectMutation("K5 作者欄退出操作缺序號", (forged) => {
      delete forged.eventLog.find((event) =>
        event && event.t === "lab" &&
        event.action === "removeTravelerFromAuthorField"
      ).sequence;
    });
    rejectMutation("K5 作者欄退出操作事件重複", (forged) => {
      const event = forged.eventLog.find((row) =>
        row && row.t === "lab" &&
        row.action === "removeTravelerFromAuthorField");
      forged.eventLog.push(JSON.parse(JSON.stringify(event)));
    });
    rejectMutation("K5 作者欄加分與退出操作被其他事件插隊", (forged) => {
      const repIndex = forged.eventLog.findIndex((event) =>
        event && event.t === "rep" &&
        event.at === "orbit4.removeTravelerFromAuthorField");
      forged.eventLog.splice(repIndex + 1, 0, {
        t:"review", at:"D3-2/embed", key:"forged-interleave"
      });
    });
    rejectMutation("K1 缺玩家一拍", (forged) => {
      forged.lab.orbitLab.manualBeats.pop();
    });
    rejectMutation("K1 篡改 Newton 續畫半徑", (forged) => {
      forged.lab.orbitLab.ruleRuns.at(-1).minRadius = 999;
    });
    rejectMutation("K1 作圖歷史倒序後重編號", (forged) => {
      forged.lab.orbitLab.ruleRuns.reverse()
        .forEach((run, index) => { run.id = index + 1; });
      forged.lab.orbitLab.activeRule.id = 1;
    });
    rejectMutation("K1 偽造作圖嘗試數", (forged) => {
      forged.lab.orbitLab.attempt = 999;
    });
    rejectMutation("K1 偽造未知偏角版本", (forged) => {
      forged.lab.orbitLab.ruleSeal.aimPattern = "forged-pattern";
    });
    rejectMutation("K1 偽造第四章耗時", (forged) => {
      forged.lab.days = 9999;
    });
    rejectMutation("K1 篡改 reset 幽靈紙的逐拍座標", (forged) => {
      forged.lab.orbitLab.manualAttempts[0].beats[0].after.x = 999;
    });
    rejectMutation("K1 篡改舊完成作圖紙的玩家逐拍", (forged) => {
      forged.lab.orbitLab.ruleRuns[0].playerBeats[0].after.x = 999;
    });
    rejectMutation("K1 篡改閉合紙種類", (forged) => {
      forged.lab.orbitLab.closedRecord.kind = "ellipse";
    });
    rejectMutation("K0 篡改切線來源紙路徑", (forged) => {
      forged.lab.orbitLab.tangentRecord.path[0].x = 999;
    });
    rejectMutation("native K0 冒充 schema1 遷移來源", (forged) => {
      forged.lab.orbitLab.tangentRecord.source = "schema1-player-choice";
      forged.lab.orbitLab.tangentRecord.note =
        "由舊對話紀錄確認：玩家選擇無拉扯時沿當下方向直行";
    });
    rejectMutation("K1 篡改閉合紙物理解說", (forged) => {
      forged.lab.orbitLab.closedRecord.note = "不需要向內改向也會自行閉合";
    });
    rejectMutation("K1 篡改牛頓續畫來源", (forged) => {
      forged.lab.orbitLab.ruleRuns.at(-1).continuationSource = "system-recomputed";
    });
    rejectMutation("K1 篡改目前頂層路徑", (forged) => {
      forged.lab.orbitLab.path[0].x += 1;
    });
    rejectMutation("K1 篡改目前 complete", (forged) => {
      forged.lab.orbitLab.complete = false;
    });
    rejectMutation("K1 篡改目前 step", (forged) => {
      forged.lab.orbitLab.step = 2;
    });
    rejectMutation("K1 篡改目前 activeRule", (forged) => {
      forged.lab.orbitLab.activeRule = null;
    });
    rejectMutation("K1 篡改目前 position", (forged) => {
      forged.lab.orbitLab.position.x += 1;
    });
    rejectMutation("K2 篡改月球每秒下墜量", (forged) => {
      forged.lab.scaleLab.moonOneSecondSagMm = 999;
    });
    rejectMutation("K2 篡改量級押注是否命中", (forged) => {
      forged.lab.scaleLab.scalePrediction.matched =
        !forged.lab.scaleLab.scalePrediction.matched;
    });
    rejectMutation("K2 篡改量級紙開封時間", (forged) => {
      forged.lab.scaleLab.scalePrediction.openedAt += 1;
    });
    rejectMutation("K2 篡改 canonical 試算數字", (forged) => {
      forged.lab.scaleLab.trials[0].moonErrorPct = 999;
      forged.lab.scaleLab.trials[0].periods.mars = 999;
    });
    rejectMutation("K2 成立後追加污染 UI 的假試算", (forged) => {
      forged.lab.scaleLab.trials.push({
        id:2, exponent:2, moonSagM:999, moonErrorPct:999,
        periods:{mars:999,jupiter:-1}, sealed:true,
        revealedAfterSeal:true, source:"player-scale-judgments"
      });
    });
    rejectMutation("K2 完成後偽造第二張量級押注", (forged) => {
      forged.lab.sequence += 1;
      forged.lab.scaleLab.predictionAttempts.push({
        choice:"same", sealedAt:forged.lab.sequence
      });
    });
    rejectMutation("K3 只翻證據位元", (forged) => {
      forged.lab.planetLab.predictions = [];
      forged.lab.planetLab.revealed = { mars:false, jupiter:false };
      forged.lab.planetLab.residuals = { mars:null, jupiter:null };
      forged.lab.planetLab.crossScalePass = false;
    });
    rejectMutation("K3 少木星封存預測", (forged) => {
      forged.lab.planetLab.predictions =
        forged.lab.planetLab.predictions.filter((row) => row.planet !== "jupiter");
    });
    rejectMutation("K3 篡改火星預測數值", (forged) => {
      const mars = forged.lab.planetLab.predictions.find((row) => row.planet === "mars");
      mars.prediction += 1;
    });
    rejectMutation("K3 封存與開封時間倒置", (forged) => {
      const mars = forged.lab.planetLab.predictions.find((row) => row.planet === "mars");
      mars.openedAt = mars.sealedAt;
    });
    rejectMutation("K3 預測紀錄 id 重複", (forged) => {
      const mars = forged.lab.planetLab.predictions.find((row) => row.planet === "mars");
      const jupiter = forged.lab.planetLab.predictions.find((row) => row.planet === "jupiter");
      jupiter.id = mars.id;
    });
    rejectMutation("K3 顯示殘差與封存紙不一致", (forged) => {
      forged.lab.planetLab.residuals.mars += 1;
    });
    rejectMutation("K3 追加污染 UI 的假舊預測", (forged) => {
      forged.lab.planetLab.predictions.push({
        id:3, planet:"mars", exponent:0, prediction:999, actual:-50,
        residualPct:999, sealed:true, sealedAt:forged.lab.sequence - 1,
        openedAt:forged.lab.sequence, revealedAfterSeal:true,
        pass:false, superseded:true
      });
    });
    rejectMutation("native K3 冒充 schema1 遷移來源", (forged) => {
      forged.lab.planetLab.predictions.forEach((row) => {
        row.source = "schema1-validated-k3";
      });
    });
    rejectMutation("K4 清空玩家蓋章紀錄", (forged) => {
      forged.lab.modelLab.stampAttempts = [];
    });
    rejectMutation("K4 完成後偽造一枚晚到的錯章", (forged) => {
      forged.lab.sequence += 1;
      forged.lab.modelLab.stampAttempts.push({
        id:forged.lab.modelLab.stampAttempts.length + 1,
        caseId:"moon", model:"inverseSquare", stamp:"story",
        expected:"matches", ok:false, at:forged.lab.sequence
      });
    });
    rejectMutation("K4 清空封存證據包", (forged) => {
      forged.lab.modelLab.evidencePackage = null;
    });
    rejectMutation("K4 刪除玩家實際借條", (forged) => {
      forged.lab.modelLab.loans = [];
    });
    rejectMutation("K4 篡改借條種類與文字", (forged) => {
      forged.lab.modelLab.loans[0].kind = "forged-kind";
      forged.lab.modelLab.loans[0].text = "system supplied";
      forged.lab.modelLab.evidencePackage.loans =
        JSON.parse(JSON.stringify(forged.lab.modelLab.loans));
    });
    rejectMutation("K4 篡改原始對帳殘差", (forged) => {
      forged.lab.modelLab.runs.find((run) =>
        run.caseId === "moon" && run.model === "inverseSquare"
      ).residual = 999;
    });
    rejectMutation("K4 開列順序與 openedAt 不一致", (forged) => {
      forged.lab.modelLab.rowOrder.reverse();
      forged.lab.modelLab.evidencePackage.rowOrder =
        forged.lab.modelLab.rowOrder.slice();
    });
    rejectMutation("K4 完成順序與 completedAt 不一致", (forged) => {
      forged.lab.modelLab.completedRows.reverse();
    });
    rejectMutation("K4 彗星成功操作被改成無 id 假紀錄", (forged) => {
      forged.lab.cometLab.attempts = [{
        mode:"same-orbit", ok:true,
        note:"十一月入向與十二月出向按日期、星位接成同一條高傾角軌道"
      }];
    });
    rejectMutation("K4 彗星顯示選項與成功紀錄不一致", (forged) => {
      forged.lab.cometLab.selectedConnection = "hard-kink";
    });
    rejectMutation("defer 路線缺實際延後紀錄", (forged) => {
      forged.lab.proof.press.delays = [];
    });
    rejectMutation("partial 路線偽裝自 defer 且沒有早期校樣", (forged) => {
      forged.lab.proof.press.openingChoice = "partial";
      forged.lab.proof.press.priorityRecord = {
        route:"raised-early",
        source:"hooke-letter-1679",
        return:"署名爭議在完整排版前浮上桌"
      };
    });
    rejectMutation("出版分支的 priority 回報文字遭竄改", (forged) => {
      forged.lab.proof.press.priorityRecord.return = "forged return";
    });
    rejectMutation("K5 缺球殼第六槽", (forged) => {
      forged.lab.proof.slots =
        forged.lab.proof.slots.filter((slot) => slot.slot !== "shell");
      forged.lab.proof.shellPagePlaced = false;
    });
    rejectMutation("K5 缺球殼翻頁時間", (forged) => {
      delete forged.lab.proof.shellPageRevealedAt;
    });
    rejectMutation("K5 缺球殼入槽時間", (forged) => {
      delete forged.lab.proof.shellPagePlacedAt;
    });
    rejectMutation("K5 旅人仍在作者欄", (forged) => {
      forged.lab.proof.authorField = {
        names:["Newton", "Traveler"], travelerRemoved:false
      };
    });
    rejectMutation("K5 缺旅人退出作者欄時間", (forged) => {
      delete forged.lab.proof.authorField.removedAt;
    });
    rejectMutation("K5 缺完整送印校樣快照", (forged) => {
      forged.lab.proof.press.proofs = [];
    });
    rejectMutation("K5 篡改送印時間", (forged) => {
      forged.lab.proof.press.proofs.at(-1).submittedAt = 0;
    });
    rejectMutation("K5 送印快照與現態不一致", (forged) => {
      forged.lab.proof.press.proofs.at(-1).slots[0].evidenceId = "M2";
    });
    rejectMutation("K5 把舊錯稿洗成完整校樣", (forged) => {
      const wrong = forged.lab.proof.press.proofs.find((row) =>
        row.kind === "wrong-proof"
      );
      wrong.kind = "complete";
      wrong.complete = true;
      wrong.superseded = true;
    });
    rejectMutation("K5 洗掉舊錯稿的 Hooke 失敗原因", (forged) => {
      const wrong = forged.lab.proof.press.proofs.find((row) =>
        row.kind === "wrong-proof"
      );
      wrong.audit.hookeScopeOk = true;
    });
    rejectMutation("K5 用同窗延後紀錄替換舊錯稿", (forged) => {
      const index = forged.lab.proof.press.proofs.findIndex((row) =>
        row.kind === "wrong-proof"
      );
      const wrong = forged.lab.proof.press.proofs[index];
      forged.lab.proof.press.proofs.splice(index, 1);
      forged.lab.proof.press.delays.push({
        kind:"delay", reason:"偽造的同窗替換",
        window:wrong.window, at:wrong.submittedAt
      });
      forged.lab.proof.press.delays.sort((a, b) => a.window - b.window);
      forged.lab.proof.press.rushTried = false;
    });
    rejectMutation("錯誤 K1 斷言的結果被洗白", (forged) => {
      const wrong = forged.lab.claims.k1.find((row) => row.ok === false);
      wrong.ok = true;
    });
    rejectMutation("錯誤 K3 斷言的內容被改寫", (forged) => {
      const wrong = forged.lab.claims.k3.find((row) => row.ok === false);
      wrong.sources = ["jupiter-sealed", "mars-sealed"];
      wrong.ok = true;
    });
    rejectMutation("K5 刪掉六槽玩家放紙歷史", (forged) => {
      forged.lab.proof.slotAttempts = [];
    });
    rejectMutation("章末偽造五張已夾回但沒有玩家操作", (forged) => {
      forged.lab.archiveLab.clipAttempts = [];
    });
    rejectMutation("native 存檔自稱 schema1 遷移以繞過時間線", (forged) => {
      forged.migration = { fromSchema:1, toSchema:2, backupRequired:true };
    });
    const Env = require("../src/save-envelope.js");
    const decoded = Env.decode(Env.encode("ch4", s));
    if (!decoded.envelope || decoded.chapter !== "ch4")
      throw new Error("第四章書信封套往返失敗");
  }
});

tests.push({
  name: "第四章 UI 契約|雙欄身分、無預選、完整接線、44px 橫屏與減少動態",
  fn: () => {
    const html = readFileSync(path.join(here, "../stage.html"), "utf-8");
    const ui = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
    const stageUi = readFileSync(path.join(here, "../src/stage-ui.js"), "utf-8");
    const series = JSON.parse(readFileSync(path.join(here, "../data/series.json"), "utf-8"));
    if (!series.chapters.some((chapter) => chapter.id === "ch4" && chapter.route === "ch04"))
      throw new Error("第四章未登錄資料驅動入口");
    for (const fragment of [
      "renderOrbit", "orbit4Svg", "orbit4PhaseKey", '"tangent-seal": "tangent"',
      '"orbit-rule": "vectors"', "sealTangentPrediction", "sealScalePrediction",
      "commitOrbitBeat", "continueOrbitRule", "sealPlanetPrediction",
      "revealPlanetPredictions", "beginLedgerRow", "stampLedgerCell",
      "addModelLoan", "declineModelLoan", "sealModelComparison", "revealShellPage",
      "placeShellPage", "removeTravelerFromAuthorField", "clipEvidence"
    ]) if (!ui.includes(fragment)) throw new Error("第四章 UI 動作接線缺失:" + fragment);
    const blankStart = ui.indexOf("function orbit4BlankSelect");
    const blankEnd = ui.indexOf("function orbit4ClaimPanel", blankStart);
    const blankSelect = ui.slice(blankStart, blankEnd);
    for (const fragment of ['blank.value = ""', "blank.disabled = true", "blank.selected = true"])
      if (!blankSelect.includes(fragment)) throw new Error("第四章選單不是空白起步:" + fragment);
    if ((ui.match(/orbit4BlankSelect\(/g) || []).length < 10)
      throw new Error("第四章互斥選擇未全部走無預選元件");
    if (!ui.includes("四項都要由你選定；目前仍有空白，沒有任何預設答案"))
      throw new Error("四項封存缺空白守衛");
    if (!ui.includes("還沒有能夾回去的紙") || ui.includes('"○ " + p[1]'))
      throw new Error("HUD 把未來證據演成預填清單");
    if (!html.includes(".orbitLab .orbitAction { min-height:44px") ||
        !html.includes(".orbitRuleDesigner .shipSelect { min-height:44px"))
      throw new Error("844×390 主要操作／選單不足 44px");
    const renderStart = ui.indexOf("function renderOrbit(v, box)");
    const phaseStart = ui.indexOf('if (phase === "tangent")', renderStart);
    const sharedSpread = ui.slice(renderStart, phaseStart);
    const spreadOrder = [
      'var visual = ship3El("section", null, body, "orbitVisual")',
      'visual.setAttribute("aria-label", "書桌推演")',
      '"I　書桌推演"',
      'if (phase === "scale") orbit4ScaleSheets(visual)',
      "else orbit4Svg(visual, lab, phase)",
      'var work = ship3El("section", null, body, "orbitWork")',
      'work.setAttribute("aria-label", "旅人筆記")',
      '"II　旅人筆記"',
      '"現在只做一件事"'
    ].map((fragment) => sharedSpread.indexOf(fragment));
    if (spreadOrder.some((index) => index < 0) ||
        spreadOrder.some((index, i) => i > 0 && index <= spreadOrder[i - 1]))
      throw new Error("第四章未在所有相位共用左推演／右筆記雙欄身分");
    if (!sharedSpread.includes('"為什麼現在做這一步"') ||
        !sharedSpread.includes("mission[2]") || !html.includes(".orbitPurposeCard"))
      throw new Error("第四章工作台的目的欄仍未渲染給玩家看");
    const vectorsStart = ui.indexOf('if (phase === "vectors")', renderStart);
    const vectorsEnd = ui.indexOf('if (phase === "scale")', vectorsStart);
    const vectorsUi = ui.slice(vectorsStart, vectorsEnd);
    if (vectorsUi.includes('["crash",shapeLabels.crash]'))
      throw new Error(
        "K1 預測仍提供現行合法三拍無法達成的『切入地球』選項"
      );
    const planetsStart = ui.indexOf('if (phase === "planets")', renderStart);
    const planetsEnd = ui.indexOf('if (phase === "comet")', planetsStart);
    const planetsUi = ui.slice(planetsStart, planetsEnd);
    if (!planetsUi.includes('doOrbit("sealPlanetPrediction"') ||
        !planetsUi.includes('doOrbit("revealPlanetPredictions"') ||
        planetsUi.includes('doOrbit("predictPlanet"'))
      throw new Error("行星桌沒有先封兩張粗估紙再一起揭露，或仍走看一張算一張的舊入口");
    const scaleSheetsStart = ui.indexOf("function orbit4ScaleSheets(parent)");
    const scaleSheetsEnd = ui.indexOf("function orbit4Svg(parent, lab, phase)", scaleSheetsStart);
    const scaleSheetsUi = ui.slice(scaleSheetsStart, scaleSheetsEnd);
    for (const fragment of [
      "ch04_prop_cross_scale_surface_sheet_v02",
      "ch04_prop_cross_scale_moon_sheet_v02",
      'ship3El("img", null, fig)',
      '"教學重建"'
    ]) if (!scaleSheetsUi.includes(fragment))
      throw new Error("第四章同尺紙完整重建圖缺失:" + fragment);
    if (/createElementNS|<svg|canvas|getContext/.test(scaleSheetsUi))
      throw new Error("第四章同尺紙仍以程式疊圖，未使用完整 raster 圖");
    const orbitSvgStart = ui.indexOf("function orbit4Svg(parent, lab, phase)");
    const orbitSvgEnd = ui.indexOf("function orbit4Table", orbitSvgStart);
    const orbitSvgUi = ui.slice(orbitSvgStart, orbitSvgEnd);
    if (orbitSvgUi.includes('phase === "scale"') ||
        orbitSvgUi.includes("ch04_prop_cross_scale_surface_sheet_v01") ||
        orbitSvgUi.includes("ch04_prop_cross_scale_moon_sheet_v01"))
      throw new Error("第四章同尺紙的舊 SVG 疊圖分支仍殘留");
    if (sharedSpread.includes("orbitHeadCopy") || !ui.includes('"兩條路分開算，最後再疊起來"') ||
        !ui.includes('"先選一個大約範圍"') || !ui.includes('"這兩張紙從哪裡來？"') ||
        !ui.includes("紙上會得到約 81.7 毫米"))
      throw new Error("第四章同尺紙仍保留滿版說明牆，或缺少白話當前任務");
    if ((ui.match(/紙上會得到約 81\.7 毫米/g) || []).length !== 1 ||
        !ui.includes("return orbit4Error(rr.reason || rr.consequence)"))
      throw new Error("同尺紙 81.7 毫米退件說明沒有共用錯誤碼單一來源");
    for (const fragment of [
      "藍紙｜時間換尺", "金紙｜距離比較", "疊合台｜兩條獨立路徑",
      "兩個 3600 不是同一步重算", "約 1.36 mm"
    ]) if (!ui.includes(fragment))
      throw new Error("第四章 K2 雙紙疊合缺少關鍵呈現:" + fragment);
    if (!html.includes(".orbitScalePath.time") || !html.includes(".orbitScalePath.distance") ||
        !html.includes(".orbitScaleOverlay.complete"))
      throw new Error("第四章 K2 雙紙疊合缺少可辨識的藍／金／完成狀態");
    const scaleUiStart = ui.indexOf('if (phase === "scale")');
    const scaleUiEnd = ui.indexOf('if (phase === "planets")', scaleUiStart);
    const scaleUi = ui.slice(scaleUiStart, scaleUiEnd);
    const relationPrompt = scaleUi.indexOf("兩個 60 要怎麼組合");
    const inverseSquareNaming = scaleUi.indexOf("才支持距離平方關係");
    if (relationPrompt < 0 || inverseSquareNaming < relationPrompt)
      throw new Error("第四章 K2 在玩家完成疊合前就替他命名距離平方關係");
    if (!ui.includes("o.disabled = !s.accepted") ||
        !ui.includes("先選銅球紀錄") || !ui.includes("再選木球紀錄") ||
        !ui.includes("我主張：兩組只換了球") || !html.includes(".catCompareClaim") ||
        !ui.includes("compareButton.disabled = !valid || !claimCheck.checked"))
      throw new Error("第二章換球比較仍讓不可引用紀錄進入斷言");
    if (!stageUi.includes("知道了，開始換算") ||
        !stageUi.includes("先看兩張紙：地表記 1 秒，月球記 60 秒。") ||
        stageUi.includes("開始畫軌道"))
      throw new Error("第四章說明視窗仍以畫軌道統稱，或未收成三點式換算引導");
    for (const fragment of [
      "#labBench > h3::before", 'content: "Ⅰ  "',
      "#labBook > h3::before", 'content: "Ⅱ  "',
      '"I　裝置與校準"', '"II　旅人實驗簿"',
      '"I 航船實驗"', '"II 旅人實驗簿"',
      ".orbitPaneKicker"
    ]) if (!(html.includes(fragment) || ui.includes(fragment)))
      throw new Error("一至四章雙欄工作台身分漂移:" + fragment);
    if (!html.includes("@media (prefers-reduced-motion:reduce)") ||
        !html.includes(".orbitPath") || !html.includes("max-height:520px") ||
        !html.includes(".orbitPlanetSealRow"))
      throw new Error("低高度或減少動態護欄缺失");
    if (/setInterval|countdown|deadlineSeconds/.test(ui.slice(ui.indexOf("第四章軌道"))))
      throw new Error("出版壓力誤做成倒數計時");
  }
});

tests.push({
  name: "第五章 E-3 展開|十個玩家發言、零空殼場、心聲用途與舊節點隔離",
  fn: () => {
    const allowedPurposes = new Set([
      "time_dislocation", "future_knowledge", "cross_chapter_memory",
      "private_observation", "private_hypothesis", "emotional_risk", "naming"
    ]);
    const mainScenes = scenes5.scenes.filter((scene) => scene.id !== "SC5-R1");
    const activeNodes = mainScenes.flatMap((scene) =>
      (scene.nodes || []).filter((node) => node.legacyOnly !== true));
    const choices = activeNodes.filter((node) => node.type === "choice");
    if (choices.length !== 10)
      throw new Error("第五章主線玩家發言數漂移:" + choices.length);

    for (const scene of mainScenes) {
      const active = (scene.nodes || []).filter((node) => node.legacyOnly !== true);
      if (active.length === 2 && active[0].type === "embed" && active[1].type === "goto")
        throw new Error("第五章仍有 embed+goto 空殼場:" + scene.id);
      const byId = new Map((scene.nodes || []).map((node) => [node.id, node]));
      for (const node of active) {
        if (node.speaker === "旅人・心聲" && !allowedPurposes.has(node.osPurpose))
          throw new Error(scene.id + "/" + node.id + " 心聲缺合法 osPurpose");
        const targets = [];
        if (typeof node.next === "string") targets.push(node.next);
        for (const option of (node.options || []))
          if (typeof option.next === "string") targets.push(option.next);
        for (const target of targets)
          if (byId.get(target)?.legacyOnly === true)
            throw new Error(scene.id + "/" + node.id + " 仍指向舊節點 " + target);
      }
    }

    const e23 = scenes5.scenes.find((scene) => scene.id === "E2-3");
    const legacy = e23.nodes.find((node) => node.id === "n1");
    const current = e23.nodes.find((node) => node.id === "n1a");
    if (legacy?.legacyOnly !== true || !current?.text.includes("這把尺只量到油灰"))
      throw new Error("E2-3 舊游標或現行縮限句遺失");

    const N5 = Narrative._factory(scenes5, Engine5, debate5);
    let s = N5.initialState("explore");
    s.cursor = { scene: "E2-3", node: "c_scale" };
    const wrong = N5.choose(s, "overclaim-vital-force");
    if (wrong.error || wrong.state.flags.ch5ScaleBoundary)
      throw new Error("過度宣稱竟取得範圍承諾");
    const back = N5.advance(wrong.state);
    if (back.error || N5.view(back.state).nodeId !== "c_scale")
      throw new Error("範圍過度宣稱沒有回到同一選擇");
    const right = N5.choose(back.state, "measurement-only");
    if (right.error || right.state.flags.ch5ScaleBoundary !== "measurement-only")
      throw new Error("縮限主張沒有留下玩家承諾");
  }
});

tests.push({
  name: "第三、五章台詞精修|年代伏筆、證據邊界、量綱與論證對位負向契約",
  fn: () => {
    const sceneNode = (data, sceneId, nodeId) =>
      data.scenes.find((scene) => scene.id === sceneId)?.nodes.find((node) => node.id === nodeId);

    const c01x12 = sceneNode(scenes3, "C0-1", "x12");
    const c01x13 = sceneNode(scenes3, "C0-1", "x13");
    const c01x14 = sceneNode(scenes3, "C0-1", "x14");
    const c01x15 = sceneNode(scenes3, "C0-1", "x15");
    const ce1x2 = sceneNode(scenes3, "CE-1", "x2");
    if (c01x12?.next !== "x13" || c01x13?.next !== "x14" ||
        c01x14?.next !== "x16" || c01x15?.legacyOnly !== true)
      throw new Error("第三章 1640 年伏筆的節點接縫或舊游標相容漂移");
    if (c01x14?.osPurpose !== "future_knowledge" ||
        !String(c01x14?.text).includes("不到兩年") ||
        /一六四二|1642|他會死|去世|逝世|死亡/.test(String(c01x14?.text)))
      throw new Error("第三章 1640 年心聲沒有保留伏筆，或提前說破伽利略死訊");
    if (!String(ce1x2?.text).includes("那年秋天") || /兩年前/.test(String(ce1x2?.text)))
      throw new Error("第三章仍把 1640 年秋至 1642 年 1 月寫成整整兩年");

    const protectedE32 = ["那個坑。", "嗯。", "它是真的。", "我只是不知道要記在哪一欄。"];
    function keepsProtectedE32(data) {
      return protectedE32.every((text, index) =>
        sceneNode(data, "E3-2", "x" + (index + 2))?.text === text);
    }
    if (!keepsProtectedE32(scenes5))
      throw new Error("第五章 E3-2/x2–x5 的定案收尾被改寫");
    const e32Mutation = JSON.parse(JSON.stringify(scenes5));
    sceneNode(e32Mutation, "E3-2", "x2").text += "別急。";
    if (keepsProtectedE32(e32Mutation))
      throw new Error("第五章 E3-2/x2–x5 逐字護欄的反向控制未轉紅");

    function validateCh5Text(data) {
      const errors = [];
      const get = (sceneId, nodeId) => sceneNode(data, sceneId, nodeId);
      const hints = [get("E1-2", "lab1"), get("E2-2", "lab2"),
        get("E2-2", "lab2b"), get("E2-3", "lab3")];
      if (hints.some((node) => /勾選|勾回|點選|斷言[一二三]|4／8/.test(String(node?.hint || ""))))
        errors.push("hint-interface");
      if (!String(hints[0]?.hint).includes("彈開和黏住") ||
          !String(hints[1]?.hint).includes("同一批紀錄") ||
          !String(hints[2]?.hint).includes("四比八") ||
          !String(hints[3]?.hint).includes("三種落下高度"))
        errors.push("hint-mission");

      const worldText = data.scenes.flatMap((scene) => scene.nodes
        .filter((node) => node.legacyOnly !== true)
        .flatMap((node) => [node.text, node.hint]
          .concat((node.options || []).map((option) => option.text))))
        .filter(Boolean).join("\n");
      if (/第[一二三四五]章/.test(worldText)) errors.push("world-chapter");
      if (worldText.includes("；")) errors.push("oral-semicolon");
      if (/你會很快樂|它會被讀完|沒有被撕掉|沒有被蓋住|完整去向|可以量的尺|過大的結論|量坑深|玄想罷了|逐頁|逐列|正不巧/.test(worldText))
        errors.push("oral-register");
      const emiliePromise = get("EE-1", "c_emilie")?.options
        ?.find((option) => option.id === "promise")?.text;
      if (!String(emiliePromise || "").includes("有人") ||
          !String(emiliePromise || "").includes("繼續算"))
        errors.push("emilie-promise");

      const ee2x7 = get("EE-2", "x7");
      const ee2Choice = get("EE-2", "c_next")?.options?.[0];
      const boundary = String(ee2x7?.text || "") + "\n" + String(ee2Choice?.text || "");
      if (ee2x7?.speaker !== "旅人(你)" || /溫度|能量|動能|變成兩顆球/.test(boundary) ||
          !String(ee2x7?.text).includes("只量到油灰") ||
          !String(ee2Choice?.text).includes("到底去了哪裡"))
        errors.push("evidence-boundary");

      const e02x8 = String(get("E0-2", "x8")?.text || "");
      if (/同一場|同一次/.test(e02x8) || !e02x8.includes("兩份紙") || !e02x8.includes("碰撞留下的痕跡"))
        errors.push("same-event");
      const reuse = String(get("E2-2", "reuse_1")?.text || "");
      if (/數字就會一樣|數字一樣/.test(reuse) ||
          !reuse.includes("一起對平") || !reuse.includes("一起短少"))
        errors.push("dimension");

      if (/第[一二三四五六七八九十]+次/.test(String(get("EE-1", "emilie_notebook_6")?.text || "")))
        errors.push("ordinal");
      const sourceCards = String(get("E0-2", "s6")?.text || "") +
        String(get("E0-2", "s7")?.text || "");
      if (/可測主張|開收據/.test(sourceCards)) errors.push("source-register");
      if (/失手配對/.test(String(get("E3-1", "debrief")?.hint || "")))
        errors.push("debrief-register");
      for (const [sceneId, nodeId, retired] of [
        ["E2-1", "x3", "他不是看不見那個坑"],
        ["E2-2", "missing_depth_2", "她在防的不是院士"],
        ["E2-3", "scale_bad_world", "不是全世界"],
        ["EE-1", "n2", "不只是翻字"]
      ]) if (String(get(sceneId, nodeId)?.text || "").includes(retired))
        errors.push("retired-aphorism");
      return errors;
    }

    const baseErrors = validateCh5Text(scenes5);
    if (baseErrors.length) throw new Error("第五章台詞契約失敗:" + baseErrors.join("、"));
    const rejectMutation = (label, mutate, expected) => {
      const copy = JSON.parse(JSON.stringify(scenes5));
      const get = (sceneId, nodeId) => sceneNode(copy, sceneId, nodeId);
      mutate(get);
      const errors = validateCh5Text(copy);
      if (!errors.includes(expected))
        throw new Error("第五章台詞負向控制未轉紅:" + label + "→" + errors.join("、"));
    };
    rejectMutation("hint 介面動詞", (get) => {
      get("E1-2", "lab1").hint = "勾選後提出斷言一。";
    }, "hint-interface");
    rejectMutation("世界內章號", (get) => {
      get("EE-2", "x2").text = "第四章那個問號。";
    }, "world-chapter");
    rejectMutation("口白分號", (get) => {
      get("E1-2", "order_rebound_1").text += "；你會很滿意。";
    }, "oral-semicolon");
    rejectMutation("翻譯腔承諾", (get) => {
      get("EE-1", "c_emilie").options.find((option) => option.id === "promise").text = "它會被讀完的。";
    }, "oral-register");
    rejectMutation("玩家書寫誤標旁白", (get) => {
      get("EE-2", "x7").speaker = "stage";
    }, "evidence-boundary");
    rejectMutation("未量溫度", (get) => {
      get("EE-2", "c_next").options[0].text += "它變成溫度。";
    }, "evidence-boundary");
    rejectMutation("不同來源偷換同一事件", (get) => {
      get("E0-2", "x8").text = "兩份紙量的是同一場撞。";
    }, "same-event");
    rejectMutation("不同量綱偷換同一數字", (get) => {
      get("E2-2", "reuse_1").text = "兩本帳算出來的數字就會一樣。";
    }, "dimension");

    const chapterUi = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
    const stageHtml = readFileSync(path.join(here, "../stage.html"), "utf-8");
    const introUi = readFileSync(path.join(here, "../src/stage/07-intro-inputs.part.js"), "utf-8");
    const legacyUi = readFileSync(path.join(here, "../src/ui.js"), "utf-8");
    const visibleSources = [chapterUi, stageHtml, introUi, legacyUi,
      JSON.stringify(scenes), JSON.stringify(scenes2), JSON.stringify(scenes5),
      JSON.stringify(debate), JSON.stringify(require("../data/debate2.js"))].join("\n");
    if (visibleSources.includes("說服力") || !visibleSources.includes("論證對位"))
      throw new Error("玩家可見『說服力』尚未完整改名為『論證對位』");
    if (!chapterUi.includes("看證據有沒有咬住主張；配錯會退回，歸零先複盤。") ||
        !chapterUi.includes("state.debate.persuasion") || debate5.persuasion !== 5)
      throw new Error("論證對位 tooltip 缺意義說明，或底層 persuasion 契約被誤改");

    const novel5 = readFileSync(path.join(here,
      "../../04_劇本/第五章可操作小說稿_兩本帳_v0.1-draft.md"), "utf-8");
    if (novel5.includes("本章全程靜止，失敗一律退回、不扣分") ||
        !novel5.includes("E3 辯論另啟用 5 點「論證對位」"))
      throw new Error("第五章小說稿仍與 runtime 的雙軌分數契約矛盾");
  }
});

tests.push({
  name: "第五章 fixture|四種碰撞逐格驗算、4／8 油灰少三分之二、黏土誤差交替",
  fn: () => {
    const f = Engine5._FIXTURE.collisionAtSix;
    const expect = {
      equalSteel: [24, 24, 144, 144, 0],
      equalPutty: [24, 24, 144, 72, 72],
      unequalSteel: [24, 24, 144, 144, 0],
      unequalPutty: [24, 24, 144, 48, 96]
    };
    for (const [key, values] of Object.entries(expect)) {
      const row = f[key];
      const got = [row.momentum.before, row.momentum.after,
        row.visViva.before, row.visViva.after, row.visViva.deficit];
      if (JSON.stringify(got) !== JSON.stringify(values))
        throw new Error(key + " 驗算不符:" + JSON.stringify(got));
    }
    if (JSON.stringify(Engine5._FIXTURE.errors) !== JSON.stringify([0, 0.1, -0.1]))
      throw new Error("黏土誤差不是 [0,+0.1,-0.1] 交替");
  }
});

tests.push({
  name: "第五章三輪工作台|輪二零實驗、同批重算、2b 可達、三速黏土才成證據",
  fn: () => {
    let s = Engine5.initialState();
    const act = (fn, ...args) => {
      const r = Engine5[fn](s, ...args);
      if (r.error) throw new Error(fn + ":" + r.error);
      s = r.state;
      return r;
    };
    for (let i = 0; i < 3; i++) act("runCollision");
    act("setDraft", "head", "putty");
    for (let i = 0; i < 3; i++) act("runCollision");
    const ids = s.collisionRuns.map((r) => r.id);
    if (Engine5.assertJ1(s, ids).error !== "judgment-required" || s.evidence.j1)
      throw new Error("只選對 J1 原紙就由引擎代答概念");
    if (Engine5.assertJ1(s, ids, "putty-breaks").error !== "j1-concept-mismatch")
      throw new Error("J1 錯誤概念沒有被拒絕");
    act("assertJ1", ids, "both-close");
    const blocked = Engine5.runCollision(s);
    if (blocked.error !== "round2-no-new-experiment" || blocked.state !== s)
      throw new Error("輪二仍能偷偷新增實驗");
    const swapped = ids.slice(1);
    if (Engine5.assertJ2(s, swapped).error !== "same-records-required")
      throw new Error("輪二可以換資料湊結論");
    if (Engine5.assertJ2(s, ids).error !== "judgment-required" || s.evidence.j2)
      throw new Error("只勾回同批原紙就由引擎代答 J2");
    act("assertJ2", ids, "steel-close-putty-short");
    if (s.draft.masses !== "4/4" || s.draft.head !== "putty")
      throw new Error("斷言二後系統仍替玩家選好 4／8，或沒有固定油灰頭");
    if (Engine5.runCollision(s).error !== "followup-prediction-required")
      throw new Error("未封存追一筆預測就能揭曉 4／8 結果");
    act("setJudgment", "followup", "always-half");
    act("setDraft", "masses", "4/8");
    const follow = act("runCollision").record;
    if (!s.evidence.followup || follow.visViva.deficit !== 96 ||
        follow.followupPrediction !== "always-half" || follow.predictionMatched !== false)
      throw new Error("2b 追一筆不可達或未殺掉固定一半");
    for (const height of ["h1", "h4", "h9"]) {
      act("setDraft", "clayHeight", height);
      act("runClay");
    }
    const clayIds = s.clayRuns.map((r) => r.id);
    if (JSON.stringify(s.clayRuns.map((r) => r.depth)) !== JSON.stringify([0.5, 2.1, 4.4]))
      throw new Error("黏土 fixture 不符:" + JSON.stringify(s.clayRuns));
    if (!Engine5.assertJ3(s, clayIds.slice(0, 2)).error)
      throw new Error("兩種速度竟可取得 J3");
    if (Engine5.assertJ3(s, clayIds).error !== "judgment-required" || s.evidence.j3)
      throw new Error("三速原紙一齊就由引擎代答平方關係");
    const tampered = JSON.parse(JSON.stringify(s));
    tampered.clayRuns.forEach((row, index) => { row.depth = [99, 1, 50][index]; });
    if (Engine5.assertJ3(tampered, clayIds, "speed-squared").error !== "square-relation-not-supported")
      throw new Error("亂改坑深仍可冒充速度平方關係");
    act("assertJ3", clayIds, "speed-squared");
    if (!s.evidence.j1 || !s.evidence.j2 || !s.evidence.j3)
      throw new Error("三張斷言未完整進卷");
  }
});

tests.push({
  name: "第五章 debate5|P2→P1→P3、承認對手、reason 分流與錯項可重複",
  fn: () => {
    if (JSON.stringify(debate5.chapter.order) !== JSON.stringify(["P2", "P1", "P3", "FR"]))
      throw new Error("柱序被改動");
    if (!debate5.chapter.pillars.P2.playerCorrect.includes("這本帳是對的") ||
        !debate5.chapter.pillars.P2.playerCorrect.includes("有些事，它沒記"))
      throw new Error("第一個勝利不再是承認對手正確");
    if (Object.values(debate5.chapter.pillars).some((p) => p.useLegacy))
      throw new Error("P3 或其他支柱誤用 useLegacy");
    for (const pillar of Object.values(debate5.chapter.pillars)) {
      if (pillar.requirePress !== true || !Array.isArray(pillar.responses) ||
          pillar.responses.length !== 3 ||
          pillar.responses.filter((option) => option.correct).length !== 1)
        throw new Error("第五章三柱缺先追問閘門，或玩家推論不是平行三選一");
    }
    const options = debate5.chapter.fr.claim.options;
    if (options.filter((o) => o.reason === "single-ledger").length !== 2 ||
        options.filter((o) => o.reason === "same-thing").length !== 1 ||
        options.filter((o) => o.correct).length !== 1)
      throw new Error("FR 四選項 reason/correct 分流不符");
    const close = debate5.chapter.fr.claim.closeReply;
    if (!close.some((line) => line.text.includes("我記了三十年的帳。今天才知道，我記的是哪一本。")))
      throw new Error("院士收尾句遺失");
  }
});

tests.push({
  name: "第五章全章走查|三輪工作台、三柱、FR 重寫、存檔白名單與舞台接線",
  fn: () => {
    const N5 = Narrative._factory(scenes5, Engine5, debate5);
    let s = N5.initialState("explore");
    const lab = (action, args = {}) => {
      const r = N5.labAction(s, action, args);
      if (r.error) throw new Error(action + ":" + r.error);
      s = r.state;
      return r.result;
    };
    const choiceByNode = {
      c_intro: "collision-question",
      c_ledger: "check-pages",
      q1: "ledger",
      c_order: "stick-first",
      c_why2: "ask-emilie",
      c_reuse: "reuse",
      c_scale: "measurement-only",
      c_j4: "keep-both",
      c_emilie: "notebook",
      c_next: "write-question"
    };
    let guard = 0;
    while (!s.ended && guard++ < 200) {
      const v = N5.view(s);
      if (v.type === "line" || v.type === "system" || v.type === "histfacts") {
        const r = N5.advance(s);
        if (r.error) throw new Error(r.error);
        s = r.state;
        continue;
      }
      if (v.type === "choice") {
        const choiceId = choiceByNode[v.nodeId];
        if (!choiceId) throw new Error("未定義第五章黃金選項:" + v.scene + "/" + v.nodeId);
        const r = N5.choose(s, choiceId);
        if (r.error) throw new Error(r.error);
        s = r.state;
        continue;
      }
      if (v.type === "embed" && v.system === "collision") {
        if (s.lab.phase === "momentum") {
          for (let i = 0; i < 3; i++) lab("runCollision");
          lab("setCollisionDraft", { field: "head", value: "putty" });
          for (let i = 0; i < 3; i++) lab("runCollision");
          lab("assertJ1", {
            runIds: s.lab.collisionRuns.map((r) => r.id), concept: "both-close"
          });
        } else if (s.lab.phase === "vis-viva") {
          lab("assertJ2", {
            runIds: s.lab.assertions.j1.sources.slice(), concept: "steel-close-putty-short"
          });
        } else if (s.lab.phase === "followup") {
          lab("setCollisionJudgment", { key: "followup", value: "changes-with-mass" });
          lab("setCollisionDraft", { field: "masses", value: "4/8" });
          lab("runCollision");
        } else if (s.lab.phase === "clay") {
          for (const h of ["h1", "h4", "h9"]) {
            lab("setCollisionDraft", { field: "clayHeight", value: h });
            lab("runClay");
          }
          lab("assertJ3", {
            runIds: s.lab.clayRuns.map((r) => r.id), concept: "speed-squared"
          });
        }
        const done = N5.embedComplete(s);
        if (done.error) throw new Error("工作台出口:" + done.error);
        s = done.state;
        continue;
      }
      if (v.type === "embed" && v.system === "debate") {
        if (v.debate.phase === "pillars") {
          if (v.debate.pillar.id === "P2" &&
              JSON.stringify(v.debate.pillarSummary.map((p) => p.id)) !==
              JSON.stringify(["P2", "P1", "P3"]))
            throw new Error("辯論柱軌未依 P2→P1→P3 顯示");
          const answer = {
            P2: { evidence: "J1", target: "p2s3" },
            P1: { evidence: "J3", target: "p1s3" },
            P3: { evidence: "J2", target: "p3s3" }
          }[v.debate.pillar.id];
          const bypass = N5.debatePresent(s, answer);
          if (!bypass.error || !bypass.error.includes("先把這一句問清") || bypass.state !== s)
            throw new Error("第五章仍能零追問直接配證破柱");
          const pressed = N5.debatePress(s, answer.target);
          if (pressed.error) throw new Error("支柱追問失敗:" + pressed.error);
          const paired = N5.debatePresent(pressed.state, answer);
          if (paired.error || paired.outcome !== "reason")
            throw new Error("正確配證沒有進入玩家推論:" + JSON.stringify(paired));
          if (paired.state.debate.pillars[v.debate.pillar.id].broken)
            throw new Error("正確配證一送出就由系統代做推論並破柱");
          const response = {
            P2: "right-scope", P1: "trace-not-receipt", P3: "different-quantities"
          }[v.debate.pillar.id];
          var reasoningState = paired.state;
          if (v.debate.pillar.id === "P2") {
            const wrongReason = N5.debateReason(reasoningState, "wrong-ledger");
            if (wrongReason.error || wrongReason.outcome !== "retry" ||
                wrongReason.state.debate.pillars.P2.broken || !wrongReason.state.evidence.J1)
              throw new Error("錯誤推論沒有留在原步，或刪掉證據");
            reasoningState = wrongReason.state;
          }
          const reasoned = N5.debateReason(reasoningState, response);
          if (reasoned.error || reasoned.outcome !== "correct")
            throw new Error("玩家推論未破柱:" + JSON.stringify(reasoned));
          s = reasoned.state;
        } else if (v.debate.phase === "fr") {
          const id = v.debate.fr.prompt.includes("各記到") ? "books-split" : "ruler-not-receipt";
          const r = N5.debateFr(s, id);
          if (r.error) throw new Error("FR 步驟:" + r.error);
          s = r.state;
        } else if (v.debate.phase === "trap") {
          const wrong1 = N5.debateFr(s, "momentum-only");
          if (wrong1.error || wrong1.outcome !== "retry") throw new Error("FR 錯項沒有留在原步");
          const wrong2 = N5.debateFr(wrong1.state, "momentum-only");
          if (wrong2.error || wrong2.outcome !== "retry") throw new Error("FR 錯項不可重複提交");
          const reasons = wrong2.state.debate.mistakes.map((m) => m.reason);
          if (reasons.filter((x) => x === "single-ledger").length < 2)
            throw new Error("FR 沒有依資料 reason 留痕");
          const right = N5.debateFr(wrong2.state, "different-things");
          if (right.error || right.outcome !== "resolved") throw new Error("FR 正解未收束");
          s = right.state;
        } else if (v.debate.phase === "won") {
          const done = N5.embedComplete(s);
          if (done.error) throw new Error(done.error);
          s = done.state;
        } else throw new Error("未知辯論 phase:" + v.debate.phase);
        continue;
      }
      if (v.type === "review") {
        s = N5.setReview(s, "動量帳閉合，活力帳短少。", "坑深給尺度，不給完整去向。").state;
        continue;
      }
      if (v.type === "end") {
        s = N5.advance(s).state;
        continue;
      }
      throw new Error("第五章走查卡住:" + JSON.stringify(v));
    }
    if (!s.ended || guard >= 200) throw new Error("第五章未完章");
    for (const id of ["J1", "J2", "J3", "J4"])
      if (!s.evidence[id]) throw new Error("缺章節證據:" + id);
    if (!s.transcript.some((line) => line.text.includes("今天才知道，我記的是哪一本")))
      throw new Error("院士收尾沒有進 transcript");
    const San = require("../src/sanitize.js");
    const finished5 = JSON.parse(N5.serialize(s));
    const legalImport = San.sanitizeImport5(
      JSON.parse(JSON.stringify(finished5)), scenes5);
    if (!legalImport.ok)
      throw new Error("第五章合法完章存檔遭拒:" + legalImport.reason);
    const oldSave = JSON.parse(JSON.stringify(finished5));
    delete oldSave.lab.selections;
    delete oldSave.lab.judgments;
    const migratedOldSave = San.sanitizeImport5(oldSave, scenes5);
    if (!migratedOldSave.ok || migratedOldSave.state.lab.judgments.j1 !== "both-close" ||
        migratedOldSave.state.lab.judgments.followup !== "legacy-unsealed")
      throw new Error("第五章舊存檔缺新判讀欄位時無法相容匯入");
    const rejectRepMutation5 = (label, mutate) => {
      const forgedRep = JSON.parse(JSON.stringify(finished5));
      mutate(forgedRep);
      if (San.sanitizeImport5(forgedRep, scenes5).ok)
        throw new Error(label + "仍通過匯入");
    };
    rejectRepMutation5("J4 加分缺 debateWon", (forgedRep) => {
      forgedRep.eventLog = forgedRep.eventLog.filter((event) =>
        !(event && event.t === "debateWon"));
    });
    rejectRepMutation5("J4 與 debateWon 反序", (forgedRep) => {
      const j4Index = forgedRep.eventLog.findIndex((event) =>
        event && event.t === "evidence" && event.id === "J4" &&
        event.at === "debate.fr5");
      const wonIndex = forgedRep.eventLog.findIndex((event) =>
        event && event.t === "debateWon");
      [forgedRep.eventLog[j4Index], forgedRep.eventLog[wonIndex]] =
        [forgedRep.eventLog[wonIndex], forgedRep.eventLog[j4Index]];
    });
    rejectRepMutation5("J4 取得事件重複", (forgedRep) => {
      const event = forgedRep.eventLog.find((row) =>
        row && row.t === "evidence" && row.id === "J4" &&
        row.at === "debate.fr5");
      forgedRep.eventLog.push(JSON.parse(JSON.stringify(event)));
    });
    rejectRepMutation5("debateWon 事件重複", (forgedRep) => {
      forgedRep.eventLog.push({ t:"debateWon" });
    });
    rejectRepMutation5("勝辯鏈缺 P1 擊破事件", (forgedRep) => {
      forgedRep.eventLog = forgedRep.eventLog.filter((event) =>
        !(event && event.t === "pillarBroken" && event.pid === "P1"));
    });
    rejectRepMutation5("勝辯狀態仍留一柱未破", (forgedRep) => {
      forgedRep.debate.pillars.P1.broken = false;
    });
    rejectRepMutation5("勝辯鏈缺 J2 原始取得事件", (forgedRep) => {
      forgedRep.eventLog = forgedRep.eventLog.filter((event) =>
        !(event && event.t === "evidence" && event.id === "J2" &&
          event.at === "collision5"));
    });

    const forged = JSON.parse(JSON.stringify(finished5));
    forged.lab.evidence.followup = true;
    forged.lab.collisionRuns = forged.lab.collisionRuns.filter((row) => row.masses !== "4/8");
    if (San.sanitizeImport5(forged, scenes5).ok)
      throw new Error("偽造的追一筆狀態通過匯入");
    const forgedJudgment = JSON.parse(JSON.stringify(finished5));
    forgedJudgment.lab.judgments.j3 = "speed-linear";
    if (San.sanitizeImport5(forgedJudgment, scenes5).ok)
      throw new Error("J3 證據與玩家判讀互相矛盾仍通過匯入");
    const forgedSelection = JSON.parse(JSON.stringify(finished5));
    forgedSelection.lab.selections.clay.push(99999);
    if (San.sanitizeImport5(forgedSelection, scenes5).ok)
      throw new Error("勾選不存在的第五章原紙仍通過匯入");
    const forgedSquare = JSON.parse(JSON.stringify(finished5));
    forgedSquare.lab.clayRuns.forEach((row, index) => {
      row.depth = [99, 1, 50][index];
    });
    if (San.sanitizeImport5(forgedSquare, scenes5).ok)
      throw new Error("亂改黏土坑深後仍可用存檔冒充速度平方證據");

    const html = readFileSync(path.join(here, "../stage.html"), "utf-8");
    const ui = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
    const stageUi = readFileSync(path.join(here, "../src/stage-ui.js"), "utf-8");
    for (const fragment of ["data/scenes5.js", "data/debate5.js", "data/histfacts5.js",
      "src/engine5.js", 'requested === "ch05"', "before-discovery:chapter5:v1"])
      if (!html.includes(fragment)) throw new Error("第五章入口接線缺失:" + fragment);
    for (const fragment of ["renderCollision5", "round2-no-new-experiment",
      "setCollisionSelection", "collision5Judgment", "撞後速度",
      "同一批紀錄重算活力帳", "先押一個預測", "4／8 油灰追一筆"])
      if (!ui.includes(fragment)) throw new Error("第五章 UI 接線缺失:" + fragment);
    if (ui.includes("collision5Checked"))
      throw new Error("第五章勾選仍藏在不可存檔的畫面暫存變數");
    if (!stageUi.includes('d.system === "collision"') ||
        !stageUi.includes('d.scene === "E1-2" && d.nodeId === "lab1"'))
      throw new Error("第五章工作台沒有接進舞台轉場");
    const runtimeText = JSON.stringify({ scenes5, debate5, histfacts5 });
    for (const forbidden of ["找回來", "跑進黏土", "沒有離開世界", "兩量都守恆",
      "達朗貝爾", "用詞之爭"])
      if (runtimeText.includes(forbidden)) throw new Error("第五章證據越界句回歸:" + forbidden);
  }
});

tests.push({
  name: "全章證據解鎖儀式|以證據狀態新增為主、舊文案只作 fallback(RUNTIME-CR-019)",
  fn() {
    const tw = readFileSync(path.join(here, "../src/stage/04-typewriter.part.js"), "utf-8");
    const events = readFileSync(path.join(here, "../src/stage/05-events.part.js"), "utf-8");
    const html = readFileSync(path.join(here, "../stage.html"), "utf-8");
    for (const tok of ["item.evidence && item.evidence.length", "structuredGain || legacyGain",
      "function playEvidenceGain(target)", 'playEvidenceGain($("dialogue"))'])
      if (!tw.includes(tok)) throw new Error("結構化解鎖契約缺失:" + tok);
    if (!events.includes('showEvidenceFocus(d.code, d.name || "新證據");') ||
        !events.includes('playEvidenceGain($("sceneFocus"));'))
      throw new Error("無取得台詞的實驗證據未觸發同一套視聽儀式");
    if (!html.includes("#dialogue.fx-gain, #sceneFocus.fx-gain"))
      throw new Error("證據圖層未接上金色脈動");
    /* 舊的斷言／筆記解鎖尚未都有 evidence code，fallback token 暫留；不得再把它當新章主契約。 */
    for (const tok of ["取得(?:證據| [A-Z]\\d)", "旅人筆記解鎖", "收入卷宗", "已簽名收卷", "夾回"])
      if (!tw.includes(tok)) throw new Error("舊存量 fallback 缺 token:" + tok);
    const built = readFileSync(path.join(here, "../src/stage-ui.js"), "utf-8");
    if (!built.includes("structuredGain || legacyGain") ||
        !built.includes('playEvidenceGain($("sceneFocus"));'))
      throw new Error("stage-ui.js 未重建（缺結構化解鎖契約）");
    /* 行為抽測:新舊句式都要命中,一般旁白不得誤中 */
    const re1 = /^(取得(?:證據| [A-Z]\d)|旅人筆記解鎖|E\d)/, re2 = /^(取得|◆ ?取得)/,
      re3 = /收入卷宗|已簽名收卷|夾回.{0,2}筆記|證據已收|斷言.{0,4}成立/;
    const hit = (s) => re1.test(s) || re2.test(s) || re3.test(s);
    for (const s of ["取得證據 E1", "旅人筆記解鎖。首頁浮現一行字", "取得《對話》的船艙頁",
      "A6 收入卷宗:舊紙記到真實落後", "原紙 R2 已簽名收卷", "五份證據逐張夾回旅人筆記"])
      if (!hit(s)) throw new Error("取得句未命中儀式:" + s);
    for (const s of ["第二幕終。船桅待驗預測已分開收入旅人筆記。", "他把紙留在桌上。", "第三章已封存。"])
      if (re1.test(s) || re2.test(s)) throw new Error("非取得句誤觸儀式(開頭型):" + s);
  }
});

tests.push({
  name: "第三章解纜起步物理|放手時船已在動：石頭共同前行、桅距遞增、相對落點不變(CH3-CR-021)",
  fn: () => {
    const set = (state, field, value) => {
      const r = Engine3.setDossierDraft(state, field, value);
      if (r.error) throw new Error(field + ":" + r.error);
      return r.state;
    };
    let s = Engine3.initialState();
    s = set(s, "stage", "depart");
    s = set(s, "release", "latch");
    s = set(s, "speedRecord", "beats");
    s = set(s, "positionRecord", "shore");
    const ran = Engine3.runDossierExperiment(s);
    if (ran.error) throw new Error("run:" + ran.error);
    const rec = ran.record;
    const beats = rec.papers.shore.beats;
    if (beats.length < 4) throw new Error("岸紙點數不足:" + beats.length);
    /* 共同前行：石頭鬆手後帶著鬆手瞬間的船速，岸紙上逐拍前進且近似等間距 */
    const stoneGaps = beats.slice(1).map((b, i) => b.stoneX - beats[i].stoneX);
    for (const g of stoneGaps)
      if (!(g > 0.3)) throw new Error("石頭在岸紙上沒有前進（垂直下落回歸）:" + JSON.stringify(stoneGaps));
    const stoneSpread = Math.max(...stoneGaps) - Math.min(...stoneGaps);
    if (stoneSpread > 0.15) throw new Error("石頭間距不近似等距:" + JSON.stringify(stoneGaps));
    /* 變速可判讀：桅位間距逐拍遞增，且首段間距不得再擠成一團 */
    if (!rec.shoreGaps || rec.shoreGaps[0] < 0.3)
      throw new Error("桅位首段間距過小，船速欄不可判讀:" + JSON.stringify(rec.shoreGaps));
    if (!(rec.shoreGaps[rec.shoreGaps.length - 1] > rec.shoreGaps[0]))
      throw new Error("桅位間距未遞增:" + JSON.stringify(rec.shoreGaps));
    /* 落在桅後：末拍桅杆超前石頭；相對落點與斷言判定不受初速影響 */
    const last = beats[beats.length - 1];
    if (!(last.mastX > last.stoneX)) throw new Error("末拍桅杆未超前石頭");
    if (rec.landing !== "aft") throw new Error("落點分類改變:" + rec.landing);
    if (Math.abs(rec.offsets[0] + 0.698) > 0.12)
      throw new Error("相對落點偏離既有物理值:" + rec.offsets[0]);
    if (rec.classification !== "正在變快") throw new Error("分類改變:" + rec.classification);
    /* 任務卡文案契約：本輪不得承諾玩家沒有的船況自由 */
    const ui = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
    if (ui.includes("什麼船況會讓石頭落後"))
      throw new Error("實驗一標題仍在問本輪回答不了的跨船況問題");
    if (ui.includes("選一種船況"))
      throw new Error("實驗一 goal 仍給出被鎖定的假選項");
    if (!ui.includes("重做舊紙記下的第一段"))
      throw new Error("實驗一新標題缺失");
    if (!ui.includes("船況固定為解纜後第一段"))
      throw new Error("實驗一 goal 未標明已固定變因與理由");
  }
});

tests.push({
  name: "第三章物理鏈收官|隱藏變因歸零、第三柱只收走穩雙紙、範圍進度使用正式閘門(CH3-CR-023)",
  fn: () => {
    const set = (state, field, value) => {
      const result = Engine3.setDossierDraft(state, field, value);
      if (result.error) throw new Error(field + ":" + result.error);
      return result.state;
    };

    /*
     * 不適用的控制不得藏在 state 裡繼續影響指紋：停泊沒有航速檔，
     * 平駛沒有加減槳力，不記等拍鼓時也沒有鼓拍快慢。
     */
    let normalized = Engine3.initialState();
    normalized = set(normalized, "stage", "dock");
    normalized = set(normalized, "speedBand", "fast");
    if (normalized.caseFile.dossier.draft.speedBand !== "mid")
      throw new Error("停泊仍保留看不見的航速檔");
    normalized = set(normalized, "stage", "steady");
    normalized = set(normalized, "forceBand", "soft");
    if (normalized.caseFile.dossier.draft.forceBand !== "hard")
      throw new Error("平駛仍保留看不見的加減槳力");
    normalized = set(normalized, "speedRecord", "none");
    normalized = set(normalized, "beatBand", "fast");
    if (normalized.caseFile.dossier.draft.beatBand !== "mid")
      throw new Error("未使用等拍鼓時仍保留看不見的鼓拍快慢");
    normalized = set(normalized, "stage", "depart");
    normalized = set(normalized, "speedBand", "fast");
    if (normalized.caseFile.dossier.draft.speedBand !== "fast")
      throw new Error("起步時玩家真正選擇的航速檔被錯誤清除");

    /* 第三柱來源必須是走穩、門閂、中拍、雙視角且已收卷的同一趟。 */
    let dualState = Engine3.initialState();
    Object.assign(dualState.caseFile.dossier.assertions, { A1:true, A2:true, A3:true });
    dualState = Engine3.setDualDesign(dualState, CH3_DUAL_SETUP).state;
    const dualRun = Engine3.runDossierExperiment(dualState);
    if (dualRun.error) throw new Error("雙紙執行失敗:" + dualRun.error);
    const dualFile = Engine3.fileDossierRecord(dualRun.state);
    if (dualFile.error || !Engine3.isDossierP3Record(dualFile.record))
      throw new Error("合法走穩雙紙沒有通過第三柱閘門");
    for (const [field, value] of [
      ["stage", "depart"], ["classification", "正在變快"],
      ["release", "hand"], ["beatBand", "fast"], ["filed", false]
    ]) {
      const forged = JSON.parse(JSON.stringify(dualFile.record));
      forged[field] = value;
      if (Engine3.isDossierP3Record(forged))
        throw new Error("第三柱錯收不合格雙紙:" + field + "=" + value);
    }

    /*
     * 辯論證據卡、玩家說出的來源句與 NPC 回應必須共用 engine catalog。
     * 這鎖住 Claude A-1：不能再由 UI 攤一套卡、engine 另維護一套固定台詞。
     */
    const catalogState = JSON.parse(JSON.stringify(dualFile.state));
    Object.assign(catalogState.caseFile.dossier.assertions, {
      A1:true, A2:true, A3:true, S1:true, S4:true
    });
    catalogState.caseFile.dossier.blind.ran = true;
    const catalog = Engine3.getDossierEvidenceCatalog(catalogState.caseFile.dossier);
    const catalogIds = catalog.map((packet) => packet.id);
    if (new Set(catalogIds).size !== catalogIds.length)
      throw new Error("共享證據 catalog 出現重複 ID");
    for (const id of ["A1", "A2", "A3", "A6", "S1", "S4",
      "dual-papers:" + dualFile.record.id])
      if (!catalogIds.includes(id)) throw new Error("共享證據 catalog 漏包:" + id);
    const a1Packet = catalog.find((packet) => packet.id === "A1");
    for (const packet of catalog) for (const field of
      ["id", "title", "condition", "variables", "scope"])
      if (!packet?.[field]) throw new Error(packet.id + " 證據包缺玩家判讀欄:" + field);

    for (const packet of catalog.filter((item) =>
      item.id.indexOf("dual-papers:") !== 0)) {
      const wrongP3 = JSON.parse(JSON.stringify(catalogState));
      wrongP3.caseFile.dossier.debate.active = true;
      wrongP3.caseFile.dossier.debate.current = "p3";
      const wrongSource = Engine3.setDossierP3Premise(wrongP3, "source", packet.id);
      if (wrongSource.error || wrongSource.ok !== false)
        throw new Error("第三柱錯紙沒有留下可修正的失敗結果:" + packet.id);
      const wrongDb = wrongSource.state.caseFile.dossier.debate;
      if (!wrongDb.lastPlayerLine.includes(packet.title) ||
          !wrongDb.lastReply.includes(packet.title))
        throw new Error("玩家選了 " + packet.id + "，發言或 NPC 回應卻沒有指名同一張紙");
    }
    const dualPacket = catalog.find((item) =>
      item.id === "dual-papers:" + dualFile.record.id);
    const rightP3 = JSON.parse(JSON.stringify(catalogState));
    rightP3.caseFile.dossier.debate.active = true;
    rightP3.caseFile.dossier.debate.current = "p3";
    const rightSource = Engine3.setDossierP3Premise(
      rightP3, "source", dualPacket.id);
    if (rightSource.error || !rightSource.ok ||
        rightSource.sourceRecordId !== dualFile.record.id ||
        !rightSource.state.caseFile.dossier.debate.lastPlayerLine.includes(dualPacket.title))
      throw new Error("第三柱選對雙紙時，玩家發言沒有和同一 catalog 對上");
    const a1Probe = JSON.parse(JSON.stringify(catalogState));
    a1Probe.caseFile.dossier.debate.active = true;
    a1Probe.caseFile.dossier.debate.current = "p3";
    const a1Wrong = Engine3.setDossierP3Premise(a1Probe, "source", "A1");
    const a1Beat = a1Wrong.state.caseFile.dossier.debate.lastPlayerLine + "\n" +
      a1Wrong.state.caseFile.dossier.debate.lastReply;
    if (!a1Beat.includes("走穩") || a1Beat.includes("舊紙和船艙紙"))
      throw new Error("A1 又退回無法辨認所選來源的舊泛稱");

    /*
     * 進度圈不能只數「有三張紙」；必須與正式斷言相同，真的分類成功、
     * 落點方向正確、放手乾淨且條件相同，才算測過一個範圍。
     */
    const shorePaper = { beats:[{ beat:0, t:0, stoneX:0, mastX:0 }] };
    const steadyRow = (id, patch = {}) => Object.assign({
      id, filed:true, location:"deck", vesselId:"captain",
      stage:"steady", classification:"近似穩速", landing:"foot",
      release:"latch", speedRecord:"beats", positionRecord:"shore",
      speedBand:"slow", forceBand:"hard", beatBand:"mid",
      sameStone:true, sameHeight:true, papers:{ shore:shorePaper }
    }, patch);
    const unclassified = {
      records:[1,2,3].map((id) => steadyRow(id, {
        classification:"船速無法判讀・未分類", beatBand:"fast"
      }))
    };
    if (Engine3.getDossierScopeProgress(unclassified).speedBands.length)
      throw new Error("未分類快拍原紙誤亮船速範圍");
    const cleanSteady = { records:[1,2,3].map((id) => steadyRow(id)) };
    if (Engine3.getDossierScopeProgress(cleanSteady).speedBands.join(",") !== "slow")
      throw new Error("三張合格慢槳平駛原紙沒有點亮船速範圍");

    const departRow = (id, patch = {}) => Object.assign({
      id, filed:true, location:"deck", vesselId:"captain",
      stage:"depart", classification:"正在變快", landing:"aft",
      release:"latch", speedRecord:"beats", positionRecord:"shore",
      speedBand:"mid", forceBand:"hard", beatBand:"mid",
      sameStone:true, sameHeight:true, papers:{ shore:shorePaper }
    }, patch);
    const cleanDepart = { records:[1,2,3].map((id) => departRow(id)) };
    if (Engine3.getDossierScopeProgress(cleanDepart).vesselIds.join(",") !== "captain")
      throw new Error("三張合格起步原紙沒有點亮換船範圍");
    cleanDepart.records[2].classification = "未記船速・未分類";
    if (Engine3.getDossierScopeProgress(cleanDepart).vesselIds.length)
      throw new Error("混入未分類原紙仍誤亮換船範圍");

    /*
     * S4 回答的是三種甲板船況；A2 是正常流程前置，不是證據前提。
     * 沒有 A2 時可以因資料不足被退件，但不得被錯判為斷言順序錯誤。
     */
    const noCabin = JSON.parse(JSON.stringify(dualFile.state));
    noCabin.caseFile.dossier.assertions.A2 = false;
    noCabin.caseFile.dossier.assertions.A1 = true;
    noCabin.caseFile.dossier.assertions.A3 = true;
    noCabin.caseFile.dossier.candidates.S4 = { records:[] };
    const s4 = Engine3.setDossierScope(noCabin, "S4", "today-three-states");
    if (s4.error === "dossier-assertion-order-required")
      throw new Error("S4 仍把船艙 A2 當成物理必要證據");

    const ui = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
    for (const phrase of [
      "放手前船走多快", "放手前船速", "加減槳力", "計時方法",
      "位置原紙", "操船／記錄"
    ]) if (!ui.includes(phrase)) throw new Error("原紙漏印真正參與判定的條件:" + phrase);
    if (!ui.includes("getDossierScopeProgress(d)"))
      throw new Error("UI 範圍進度仍自行使用較鬆的判定");

    const sanitize = readFileSync(path.join(here, "../src/sanitize.js"), "utf-8");
    for (const fragment of [
      'record.stage === "steady"', 'record.classification === "近似穩速"',
      'record.release === "latch"', 'record.positionRecord === "dual"',
      "dualData.p3Eligible"
    ]) if (!sanitize.includes(fragment))
      throw new Error("存檔淨化缺第三柱嚴格雙紙閘門:" + fragment);
  }
});

tests.push({
  name: "第三章試玩修正|落點不飛出船、證據全攤開、當前原紙明示、柱數不寫死、換尺表移除(20260729)",
  fn: () => {
    const ui = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
    const css = readFileSync(path.join(here, "../stage.html"), "utf-8");
    const assets = JSON.parse(readFileSync(path.join(here, "../data/assets.json"), "utf-8"));

    /* -0.7 公尺是甲板內的偏移，不得因自動撐滿圖幅被畫成落海。 */
    if (!ui.includes("var relativeSpan = Math.max(4, Math.abs(minX), Math.abs(maxX));"))
      throw new Error("船上視角沒有固定甲板尺度，微小偏移可能再次被放大成落海");
    const shownDx = Math.abs(-0.70) / (4 * 2) * 650;
    if (!(shownDx < 72))
      throw new Error("既定顯示尺度仍把 0.70 公尺偏移畫到船身外:" + shownDx);

    /* A2 錯項必須把真正錯誤寫明：範圍從停泊／平駛偷渡到所有運動。 */
    if (ui.includes("所以船艙裡分不出船的運動"))
      throw new Error("船艙錯項仍使用容易被理解成局部結論的含混舊句");
    for (const phrase of [
      "封閉船艙裡連加速、減速也都分不出來",
      "這六回只比較「停泊」和「近似平駛」",
      "加速、減速會留下不同結果"
    ]) if (!ui.includes(phrase))
      throw new Error("船艙錯答缺精確範圍回饋:" + phrase);

    /* 辯論來源選擇要像第一章：全部已取得證據包同時可見，卡上有條件、變因與範圍。 */
    for (const phrase of [
      "ship3DossierDebateEvidenceCatalog(d).forEach",
      "getDossierEvidenceCatalog",
      "卷宗裡目前可用的資料全部攤開",
      "shipDossierEvidenceCondition",
      "shipDossierEvidenceVariables",
      "shipDossierEvidenceScope",
      "現在判讀的紙",
      "岸標間距："
    ]) if (!ui.includes(phrase))
      throw new Error("第三章辯論缺全證據桌或當前原紙標示:" + phrase);
    if (!ui.includes('["A6", "A1", "A3", "A2", "S1", "S4"]'))
      throw new Error("舊紙 A6 被 HUD 計入斷言，卻沒有在已成立斷言區攤開");
    if (!ui.includes("ship3DossierPacketSourceIds(d, id).join"))
      throw new Error("已成立斷言沒有沿用同一份來源 catalog，舊紙可能顯示成未記");

    /* GB-ADR-031：疑問由對白提出；工作台先攤斷言，再選紙，最後提交。 */
    for (const phrase of [
      "把這輪可能的主張攤開",
      "先選一句你打算成立的話",
      'doShip("setDossierProposedScope"',
      "斷言已選好。現在勾能支撐它的資料組",
      "用所選原紙提交這句斷言"
    ]) if (!ui.includes(phrase))
      throw new Error("第三章缺斷言先行的取證順序:" + phrase);
    if (ui.includes('"○ 問題："') || ui.includes("ship3DossierQuestionText(id)"))
      throw new Error("第三章工作台仍在角色對白之外重複印出問題題幹");

    /* 換任務後，上一輪重播仍可追溯，但不得繼續佔住新實驗的左頁。 */
    for (const phrase of [
      "var belongsToEarlierPhase = !ship3PendingMissionBridge && !ship3ReplayNotice",
      "ids.every(function (id) { return id.charAt(0) !== currentPrefix; })",
      'ship3El("details", null, parent, "shipDossierPastSeries")',
      "前一輪原紙仍在卷宗｜展開重播"
    ]) if (!ui.includes(phrase))
      throw new Error("第三章換任務後缺前輪重播收合契約:" + phrase);
    if (!css.includes(".shipDossierPastSeries > summary"))
      throw new Error("第三章前輪重播雖收合，卻缺可辨識、可操作的展開樣式");

    /* 沒有綁定來源時必須 fail closed，不能把同類所有紙靜默攤成這題的證據。 */
    const packetIdsStart = ui.indexOf("function ship3DossierPacketSourceIds");
    const packetIdsEnd = ui.indexOf("function ship3DossierDebateEvidenceCatalog", packetIdsStart);
    const packetIdsHelper = ui.slice(packetIdsStart, packetIdsEnd);
    if (!packetIdsHelper.includes("return [];") ||
        packetIdsHelper.includes("record.stage ===") ||
        packetIdsHelper.includes('return "R" + record.id'))
      throw new Error("來源 ID helper 仍按船況臨時製造一批原紙");
    const sourceStart = ui.indexOf("function ship3DossierRecordsForQuestion");
    const sourceEnd = ui.indexOf("function renderShipDossierQuestionPapers", sourceStart);
    const sourceHelper = ui.slice(sourceStart, sourceEnd);
    if (!sourceHelper.includes("if (!ids.length) return [];") ||
        sourceHelper.includes("!ids.length ||"))
      throw new Error("未綁來源的題目仍可能退回全 stage 原紙");
    const helperContext = {};
    new Script(
      ui.slice(packetIdsStart, sourceEnd) +
      "\nglobalThis.packetIds = ship3DossierPacketSourceIds;" +
      "\nglobalThis.questionRecords = ship3DossierRecordsForQuestion;"
    ).runInNewContext(helperContext);
    const paperState = {
      assertionSources:{ A1:[] }, claimSelections:{ A1:[] },
      records:[
        { id:1, filed:true, stage:"steady" },
        { id:2, filed:true, stage:"steady" },
        { id:3, filed:true, stage:"depart" }
      ]
    };
    if (helperContext.packetIds(paperState, "A1").length ||
        helperContext.questionRecords(paperState, "steady", "A1").length)
      throw new Error("未綁來源時 helper 仍替玩家挑了同類紙");
    paperState.assertionSources.A1 = ["R2"];
    if (helperContext.questionRecords(paperState, "steady", "A1")
      .map((row) => row.id).join(",") !== "2")
      throw new Error("已綁 A1:R2 時沒有只顯示 R2");
    paperState.assertionSources.A1 = ["R999"];
    if (helperContext.questionRecords(paperState, "steady", "A1").length)
      throw new Error("綁定不存在的 R999 時竟 fallback 到其他紙");
    paperState.assertionSources.A1 = ["R3"];
    if (helperContext.questionRecords(paperState, "steady", "A1").length)
      throw new Error("A1 綁到不同船況的紙時竟混入本題");
    if (!ui.includes("這一題的原紙尚未綁定，請先在卷宗選紙。"))
      throw new Error("來源未綁定時沒有給玩家可修正的明示");

    /* 第三柱保留兩張圖，但數值換算表不再佔據中段。 */
    const p3Start = ui.indexOf("function ship3DossierP3PaperMath");
    const p3End = ui.indexOf("function ship3DossierRunView", p3Start);
    if (p3Start < 0 || p3End < 0) throw new Error("找不到第三柱紙張呈現函式");
    const p3 = ui.slice(p3Start, p3End);
    if (p3.includes("ship3Table("))
      throw new Error("第三柱仍顯示逐拍數值表");
    if (!p3.includes("ship3DossierPaperPlot(plots, shore") ||
        !p3.includes("ship3DossierPaperPlot(plots, ship"))
      throw new Error("移除表格時連兩張原紙圖也被刪掉");

    /* 柱列由定義陣列驅動；第三章現況三柱不等於跨章固定三柱。 */
    if (!ui.includes("SHIP3_DOSSIER_PILLARS.every") ||
        !ui.includes("SHIP3_DOSSIER_PILLARS.find") ||
        !css.includes(".shipDossierDebateTrack { display: flex; flex-wrap: wrap;"))
      throw new Error("第三章柱列仍把三柱寫死在完成判定或版面");
    const debateLaw = readFileSync(path.join(here,
      "../../02_設計/發現之前_工作台與辯論架構_一二章實證規格_v0.1.md"), "utf-8");
    for (const phrase of [
      "柱數不寫死",
      "引擎的預設值",
      "正規化／補欄",
      "存檔 sanitizer",
      "schema 遷移"
    ]) if (!debateLaw.includes(phrase))
      throw new Error("跨章辯論柱數契約缺施工層:" + phrase);

    const oldAsset = assets.entries.find((item) => item.id === "ch03_focus_old_paper_dossier_v01");
    const oldFocus = assets.lineFocusVisual.find((item) =>
      item.scene === "C0-3" && item.match === "舊紙已收入卷宗");
    if (!oldAsset || !oldFocus)
      throw new Error("舊紙特寫未同時登錄資產與 C0-3 台詞掛點");
    if (!existsSync(path.join(here, "../../public/assets/", oldAsset.path)) ||
        !existsSync(path.join(here, "../../", oldAsset.sourceMaster)) ||
        !existsSync(path.join(here,
          "../../art/source/production/ch03/props/PROMPT_OLD_PAPER_DOSSIER_20260729.md")))
      throw new Error("舊紙特寫缺 runtime、母版或生成紀錄");
  }
});

tests.push({
  name: "GB-ADR-034|第三柱不跳題、逐拍換尺、錯圖留痕與雙視角正式閘門",
  fn: () => {
    const San = require("../src/sanitize.js");
    const N3 = Narrative._factory(scenes3, Engine3, {});
    let gated = Engine3.initialState();
    Object.assign(gated.caseFile.dossier.assertions, { A1:true, A2:true, A3:true });
    const gatedBefore = JSON.stringify(gated);
    const bypass = Engine3.runDossierExperiment(gated);
    if (bypass.error !== "dual-design-required" || JSON.stringify(gated) !== gatedBefore)
      throw new Error("未封存雙視角方案仍可生雙紙，或拒絕時改動輸入 state");

    let s = Engine3.setDualDesign(gated, CH3_DUAL_SETUP).state;
    const run = Engine3.runDossierExperiment(s);
    if (run.error || !run.record.dualPapers) throw new Error("正式雙視角方案無法生成雙紙");
    const filed = Engine3.fileDossierRecord(run.state);
    if (filed.error) throw new Error("雙紙無法收卷:" + filed.error);
    s = filed.state;
    const record = filed.record;
    s.caseFile.dossier.debate.active = true;
    s.caseFile.dossier.debate.current = "p3";
    s.caseFile.dossier.debate.pillars.p1 = true;
    s.caseFile.dossier.debate.pillars.p2 = true;

    let result = Engine3.setDossierP3Premise(s, "source", "dual-papers:" + record.id);
    if (result.error || !result.ok) throw new Error("第三柱無法選定雙紙來源");
    s = result.state;
    const p3AfterSource = s.caseFile.dossier.debate.p3;
    if (p3AfterSource.question || p3AfterSource.concept || p3AfterSource.aligned)
      throw new Error("選來源又偷偷代答同一時刻或參考起點");
    if (Engine3.alignDossierPapers(s, "same-beats").error !== "dossier-p3-question-required")
      throw new Error("尚未回答同一時刻就能越級對紙");
    if (Engine3.setDossierP3Premise(s, "concept", "reference").error !==
        "dossier-p3-question-required")
      throw new Error("尚未回答比較問題就能越級命名參考物");
    result = Engine3.setDossierP3Premise(s, "question", "same-time-transform");
    if (result.error || !result.ok) throw new Error("同一事件／同一時刻判斷無法成立");
    s = result.state;
    result = Engine3.setDossierP3Premise(s, "concept", "reference");
    if (result.error || !result.ok) throw new Error("碼頭／桅杆起點判斷無法成立");
    s = result.state;

    const badAlign = Engine3.alignDossierPapers(s, "same-height");
    if (badAlign.error || badAlign.ok !== false ||
        !badAlign.state.caseFile.dossier.debate.p3.alignAttempts.at(-1))
      throw new Error("錯誤對時沒有留下可重畫的嘗試");
    s = badAlign.state;
    result = Engine3.alignDossierPapers(s, "same-beats");
    if (result.error || !result.ok) throw new Error("同號鼓點無法正確對齊");
    s = result.state;

    if (s.caseFile.dossier.assertions.A4 || s.caseFile.dossier.debate.p3.scope ||
        Engine3.transformDossierPapers(s, "subtract-each-beat").error !==
          "dossier-p3-boundary-required")
      throw new Error("同號鼓點一對上就越界取得 A4 或直接進入換尺");
    result = Engine3.setDossierP3Premise(s, "scope", "same-event-time-only");
    if (result.error || !result.ok || !result.state.caseFile.dossier.assertions.A4)
      throw new Error("A4 範圍承諾無法成立");
    s = result.state;

    const badMethod = Engine3.transformDossierPapers(s, "translate-once");
    if (badMethod.error || badMethod.ok !== false ||
        badMethod.state.caseFile.dossier.debate.p3.transformAttempts.at(-1)?.kind !== "method")
      throw new Error("只平移一次沒有留下錯誤換尺圖資料");
    s = badMethod.state;
    result = Engine3.transformDossierPapers(s, "subtract-each-beat");
    if (result.error || !result.ok || result.completed ||
        result.state.caseFile.dossier.assertions.A5 ||
        result.state.caseFile.dossier.debate.p3.transformedPoints.length)
      throw new Error("選對方法又一次算完四拍或提前取得 A5");
    s = result.state;

    const shoreBeats = record.papers.shore.beats;
    const badBeat = Engine3.transformDossierPaperBeat(
      s, shoreBeats[0].beat, Number(shoreBeats[0].mastX) + 0.5);
    if (badBeat.error || badBeat.ok !== false || !badBeat.preview ||
        badBeat.state.caseFile.dossier.debate.p3.transformedPoints.length !== 0 ||
        badBeat.state.caseFile.dossier.debate.p3.transformAttempts.at(-1)?.kind !== "beat")
      throw new Error("單拍移尺錯量沒有留下紅點資料，或清單仍偷往前走");
    s = badBeat.state;
    result = Engine3.transformDossierPaperBeat(s, shoreBeats[0].beat, shoreBeats[0].mastX);
    if (result.error || !result.ok || result.completed ||
        result.state.caseFile.dossier.debate.p3.transformedPoints.length !== 1)
      throw new Error("第一拍沒有單獨寫進換尺紙");
    s = result.state;

    const wrapper = N3.initialState("explore");
    wrapper.lab = s;
    for (let index = 1; index <= 5; index++)
      if (s.evidence["g" + index]) wrapper.evidence["G" + index] = true;
    const sanitized = San.sanitizeImport3(JSON.parse(JSON.stringify(wrapper)), scenes3);
    if (!sanitized.ok) throw new Error("一拍中途存檔無法淨化:" + sanitized.reason);
    s = sanitized.state.lab;
    if (s.caseFile.dossier.debate.p3.transformMode !== "subtract-each-beat" ||
        s.caseFile.dossier.debate.p3.transformedPoints.length !== 1)
      throw new Error("序列化／淨化往返清掉逐拍中途進度");

    for (let index = 1; index < shoreBeats.length; index++) {
      result = Engine3.transformDossierPaperBeat(
        s, shoreBeats[index].beat, shoreBeats[index].mastX);
      if (result.error || !result.ok) throw new Error("第 " + index + " 拍無法完成");
      s = result.state;
    }
    const p3Done = s.caseFile.dossier.debate.p3;
    if (!p3Done.transformed || !s.caseFile.dossier.assertions.A5 ||
        !s.caseFile.dossier.debate.pillars.p3 ||
        p3Done.transformedPoints.length !== shoreBeats.length)
      throw new Error("四拍完成後沒有取得 A5／第三柱，或點數不完整");

    let blind = Engine3.initialState();
    blind.caseFile.dossier.blind.ran = true;
    blind.caseFile.dossier.blind.records = Array.from({ length:6 }, (_, index) => ({
      id:"C" + (index + 1),
      instrument:"drip"
    }));
    const blindRecords = JSON.stringify(blind.caseFile.dossier.blind.records);
    const judged = Engine3.judgeDossierBlind(blind, "indistinguishable");
    if (judged.error || !judged.ok ||
        JSON.stringify(judged.state.caseFile.dossier.blind.records) !== blindRecords)
      throw new Error("舊盲判 API 仍會把六張船艙原紙換成兩張彙總紙");

    const ui = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
    const narrative = readFileSync(path.join(here, "../src/narrative.js"), "utf-8");
    if (ui.includes("ship3DualDesignReady") ||
        !ui.includes('doShip("transformDossierPaperBeat"') ||
        !ui.includes("逐拍換尺紙") || !ui.includes("兩張紙記的是同一事件、同一時刻") ||
        !narrative.includes("Engine.transformDossierPaperBeat"))
      throw new Error("正式 UI 仍用暫存旗標，或缺少兩個判斷／逐拍 action 接線");
  }
});

tests.push({
  name: "GB-ADR-035|五輪因果橋、共同前行親判與第三柱範圍承諾",
  fn: () => {
    let p1 = Engine3.initialState();
    Object.assign(p1.caseFile.dossier.assertions, { A1:true, A2:true, A3:true });
    p1.caseFile.dossier.designCommitments.cabinWind = "close-cabin";
    p1.caseFile.dossier.debate.active = true;
    p1.caseFile.dossier.debate.current = "p1";
    let result = Engine3.answerDossierDebate(p1, "p1", "source", "A1");
    if (result.error || !result.ok || result.state.caseFile.dossier.debate.p1.concept)
      throw new Error("選中 A1 又由引擎代答共同前行");
    p1 = result.state;
    const wrong = Engine3.answerDossierDebate(p1, "p1", "concept", "motion-resets");
    if (wrong.error || wrong.ok !== false || wrong.state.caseFile.dossier.debate.p1.concept)
      throw new Error("門閂歸零的錯誤概念沒有被保留為失敗判斷");
    result = Engine3.answerDossierDebate(wrong.state, "p1", "concept", "shared-motion");
    if (result.error || !result.ok || !result.state.caseFile.dossier.debate.p1.concept)
      throw new Error("玩家親自選出共同前行後仍未取得概念進度");

    let early = Engine3.initialState();
    early.caseFile.dossier.assertions.A1 = true;
    early.caseFile.dossier.debate.pillars.p1 = true;
    early.caseFile.dossier.debate.pillars.p2 = true;
    result = Engine3.enterDossierDebate(early);
    if (result.error || /岸上畫彎|船上畫直/.test(result.state.caseFile.dossier.debate.lastReply))
      throw new Error("尚未取得同步雙紙，碼頭卻提前演出岸彎／船直");

    const ui = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
    for (const fragment of [
      "每一拍都拉得更開",
      "船正在往前，和船每一拍走得比上一拍更遠，是兩件事",
      "船長追問：外頭的風",
      "這裡沒有桅頂，也不是同一個落石",
      "不能靠撕掉一張來解決",
      "我的尺從碼頭柱量起",
      "墨水瓶放在一塊鬆木板上",
      "瓶子相對木板會往哪裡",
      "你把我的第三拍接到他的第四拍了",
      "我不替這張換過大小的紙簽名",
      "只證明兩張紙記的是同一事件、同一時刻；還沒說明位置怎麼互換",
      'doShip("setDossierP3Premise", { step: "scope"'
    ]) if (!ui.includes(fragment))
      throw new Error("第三章五輪因果或第三柱白話鋪陳缺失:" + fragment);

    const scene = scenes3.scenes.find((entry) => entry.id === "C1-1");
    const x10 = scene.nodes.find((node) => node.id === "x10");
    const close = scenes3.scenes.find((entry) => entry.id === "C3-1");
    const closeText = close.nodes.map((node) => String(node.text || "")).join("\n");
    if (!String(x10?.text || "").includes("還得等艾蒂安的岸紙") ||
        !closeText.includes("這麼多趟") || closeText.includes("忙了兩天"))
      throw new Error("水杯證據層級或開放航次文案未同步");
  }
});

tests.push({
  name: "GB-ADR-040|預測有疑問、有依據、有揭曉，K1 標籤來自玩家實際路徑",
  fn: () => {
    const sceneMap4 = new Map(scenes4.scenes.map((scene) => [
      scene.id, new Map(scene.nodes.map((node) => [node.id, node]))
    ]));
    const d12n7 = String(sceneMap4.get("D1-2")?.get("n7")?.text || "");
    const d21n28 = String(sceneMap4.get("D2-1")?.get("n28")?.text || "");
    const d31n29 = String(sceneMap4.get("D3-1")?.get("n29")?.text || "");
    for (const [text, fragments] of [
      [d12n7, ["換成一秒", "先蓋起來", "算完再翻"]],
      [d21n28, ["撞回地球", "逃出去", "繞住", "前三拍由你落筆"]],
      [d31n29, ["離得遠，拉得弱", "一年就不只長一倍", "先押一個大約範圍"]]
    ]) for (const fragment of fragments)
      if (!text.includes(fragment)) throw new Error("第四章預測前缺少可回答的疑問或依據:" + fragment);

    const ui = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
    const html = readFileSync(path.join(here, "../stage.html"), "utf-8");
    for (const fragment of [
      "規則紙｜這三項會改變路徑",
      "預測紙｜不改變路徑",
      "撞回來、逃出去，還是繞住",
      "蠟封留著；猜測和結果合不合",
      "兩張一起翻。猜中或猜偏的封口都釘回去",
      "把預測紙和落點紙並排"
    ]) if (!ui.includes(fragment))
      throw new Error("預測結果沒有回到故事層，或 K1 規則／押注仍混在一起:" + fragment);
    for (const fragment of [".orbitRulePaper,.orbitPredictionPaper", ".orbitPredictionPaper { border-style:dashed"])
      if (!html.includes(fragment)) throw new Error("K1 兩張紙缺少可見區分:" + fragment);

    let s = Engine4.sealOrbitRule(ch4K0K2State(), {
      target:"earth-center", speed:"medium", strength:"short"
    }, "away").state;
    for (let beatIndex = 0; beatIndex < 3; beatIndex++) {
      const validButOutward = -17 * Math.PI / 180 - Engine4._ORBIT_RULES.aimOffsets[beatIndex];
      const aimed = Engine4.nudgeOrbitAim(s, validButOutward);
      if (aimed.error) throw new Error("無法建立 K1 路徑相依反向控制");
      const beat = Engine4.commitOrbitBeat(aimed.state);
      if (beat.error || !beat.ok || Math.abs(beat.beat.angleCurrentDeg - 17) > 0.1)
        throw new Error("K1 反向控制三拍沒有落在有效但偏外的路徑");
      s = beat.state;
    }
    const continued = Engine4.continueOrbitRule(s);
    if (continued.error || continued.run.actualShape !== "away" ||
        continued.run.outcome !== "outer-band" || continued.run.maxRadius <= 1.18 ||
        !continued.run.predictionMatched ||
        continued.run.classificationSource !== "simulated-path-v1")
      throw new Error("K1 仍用 medium/short 查表成 ellipse，沒有依玩家實際三拍判讀");
    const forged = structuredClone(continued.run);
    forged.classificationSource = "canonical-table";
    if (Engine4._orbitRunAudit(forged))
      throw new Error("K1 匯入稽核接受未知的形狀判讀來源");
  }
});

tests.push({
  name: "跨章資料動作|scenes labAction 逐章白名單且拼字錯誤會在測試期失敗",
  fn: () => {
    const debate2 = require("../data/debate2.js");
    const chapters = [
      ["ch1", scenes, Narrative],
      ["ch2", scenes2, Narrative._factory(scenes2, Engine2, debate2)],
      ["ch3", scenes3, Narrative._factory(scenes3, Engine3, {})],
      ["ch4", scenes4, Narrative._factory(scenes4, Engine4, {})],
      ["ch5", scenes5, Narrative._factory(scenes5, Engine5, debate5)],
      ["ch6", scenes6, Narrative._factory(scenes6, Engine6, {})]
    ];

    function collectLabActions(root) {
      const found = [];
      function walk(value, at) {
        if (!value || typeof value !== "object") return;
        if (Object.prototype.hasOwnProperty.call(value, "labAction")) {
          const action = value.labAction && value.labAction.action;
          if (typeof action !== "string" || !action)
            throw new Error("資料層 labAction 缺少 action 字串:" + at);
          found.push({ action, at });
        }
        for (const [key, child] of Object.entries(value))
          walk(child, at + "." + key);
      }
      walk(root, "scenes");
      return found;
    }

    function validateInventory(label, data, narrative) {
      const allowed = narrative.dataLabActions();
      if (new Set(allowed).size !== allowed.length)
        throw new Error(label + " 資料層 labAction 白名單有重複項目");
      const used = collectLabActions(data);
      for (const row of used) if (!allowed.includes(row.action))
        throw new Error(label + " 資料層 labAction 未列入白名單:" + row.action + " @ " + row.at);
      for (const action of allowed) if (!used.some((row) => row.action === action))
        throw new Error(label + " 資料層 labAction 白名單已有腐爛項目:" + action);
    }

    for (const [label, data, narrative] of chapters)
      validateInventory(label, data, narrative);

    /* 獨立書寫探針，不從白名單欄位複製，避免同一個錯字同時騙過資料與測試。 */
    const typoProbe = structuredClone(scenes4);
    typoProbe.scenes[0].nodes[0].effects = [{ labAction: { action:"__lab_action_typo_probe__", args:{} } }];
    let rejected = false;
    try { validateInventory("ch4-probe", typoProbe, chapters[3][2]); }
    catch (error) { rejected = String(error.message).includes("__lab_action_typo_probe__"); }
    if (!rejected) throw new Error("資料層 labAction 靜態清冊的獨立拼字探針沒有轉紅");

    const runtimeProbe = chapters[3][2].labAction(
      chapters[3][2].initialState("explore"), "__runtime_lab_action_probe__", {}
    );
    if (runtimeProbe.error !== "未知實驗台動作:__runtime_lab_action_probe__")
      throw new Error("未知 labAction 沒有在敘事引擎層具名拒絕");
  }
});

tests.push({
  name: "跨章共用系統|玩家推論 fail-closed、存檔投影重算、非拖曳與 844×390",
  fn: () => {
    const debate2 = require("../data/debate2.js");
    for (const [label, data, modes] of [
      ["第一章", debate, { P1:"player", P2:"player", P3:"auto" }],
      ["第二章", debate2, { P1:"player", P2:"player", P3:"player" }],
      ["第五章", debate5, { P1:"player", P2:"player", P3:"player" }]
    ]) for (const [pid, mode] of Object.entries(modes)) {
      const pillar = data.chapter.pillars[pid];
      if (pillar.reasonMode !== mode)
        throw new Error(label + " " + pid + " 沒有明示宣告推論模式");
      if (mode === "player" && (!pillar.responsePrompt || pillar.responses?.length !== 3 ||
          pillar.responses.filter((row) => row.correct === true).length !== 1 ||
          pillar.responses.some((row) => row.correct !== true && !row.reply)))
        throw new Error(label + " " + pid + " 的玩家推論不是一正兩誘答");
    }

    const brokenDebate = structuredClone(debate);
    delete brokenDebate.chapter.pillars.P1.reasonMode;
    const BrokenNarrative = Narrative._factory(scenes, Engine, brokenDebate);
    const brokenState = BrokenNarrative.initialState("explore");
    brokenState.debate = { status:"pending", idx:0, pressChoice:null };
    const firstStatement = (brokenDebate.chapter.pillars.P1.statements || brokenDebate.statements)[0];
    const blocked = BrokenNarrative.debatePresent(brokenState, {
      target:firstStatement.id, evidence:"E1", subitem:null
    });
    if (blocked.error !== "reason-mode-missing:P1" ||
        JSON.stringify(blocked.state) !== JSON.stringify(brokenState))
      throw new Error("刪掉 reasonMode 後沒有在引擎層原子拒絕");

    const San = require("../src/sanitize.js");
    const injected1 = Narrative.initialState("explore");
    injected1.evidence.E5 = true;
    if (San.sanitizeImport(injected1, patterns, scenes).ok)
      throw new Error("第一章可在章首注入 E5");
    const N3 = Narrative._factory(scenes3, Engine3, {});
    const injected3 = N3.initialState("explore");
    injected3.evidence.G5 = true;
    if (San.sanitizeImport3(injected3, scenes3).ok)
      throw new Error("第三章可在章首注入 G5");
    const N5 = Narrative._factory(scenes5, Engine5, debate5);
    const injected5 = N5.initialState("explore");
    injected5.evidence.J4 = true;
    if (San.sanitizeImport5(injected5, scenes5, Engine5).ok)
      throw new Error("第五章可在章首注入 J4");

    const run1 = Engine.runExperiment(Engine.initialState(), {
      ball:"銅大", surface:"打磨", incline:"緩", timer:"水鐘"
    }).state;
    const save1 = Narrative.initialState("explore");
    save1.lab = run1;
    if (!San.sanitizeImport(structuredClone(save1), patterns, scenes).ok)
      throw new Error("第一章真實原紙被誤擋");
    const forgedReadings1 = structuredClone(save1);
    forgedReadings1.lab.evidence.runs[0].readings = [999, 1, 999, 1, 999];
    if (San.sanitizeImport(forgedReadings1, patterns, scenes).ok)
      throw new Error("第一章離譜讀值沒有用 patterns 重算拒絕");

    let claimedLab1 = Engine.initialState();
    let claimStep1 = Engine.runExperiment(claimedLab1, {
      ball:"銅大", surface:"打磨", incline:"緩", timer:"水鐘"
    });
    claimedLab1 = claimStep1.state;
    claimStep1 = Engine.judge(claimedLab1, [claimStep1.run.id], claimStep1.run.readings[4]);
    if (claimStep1.error || !claimStep1.claim || claimStep1.claim.ok !== true)
      throw new Error("無法建立第一章合法主張對照組");
    const claimedSave1 = Narrative.initialState("explore");
    claimedSave1.lab = claimStep1.state;
    if (!San.sanitizeImport(structuredClone(claimedSave1), patterns, scenes).ok)
      throw new Error("第一章合法主張對照組被誤擋");
    const forgedClaim1 = structuredClone(claimedSave1);
    forgedClaim1.lab.inference.claims[0].ok = !forgedClaim1.lab.inference.claims[0].ok;
    const forgedClaimResult1 = San.sanitizeImport(forgedClaim1, patterns, scenes);
    if (forgedClaimResult1.ok || forgedClaimResult1.reason !== "第一章主張結論與原始實驗紀錄不一致")
      throw new Error("第一章 claim.ok 偽造沒有由封閉原紙重算並具名拒絕");

    const collisionLab = Engine5.runCollision(Engine5.initialState()).state;
    const save5 = N5.initialState("explore");
    save5.lab = collisionLab;
    if (!San.sanitizeImport5(structuredClone(save5), scenes5, Engine5).ok)
      throw new Error("第五章真實碰撞原紙被誤擋");
    const forgedCollision5 = structuredClone(save5);
    forgedCollision5.lab.collisionRuns[0].after.a = 99;
    if (San.sanitizeImport5(forgedCollision5, scenes5, Engine5).ok)
      throw new Error("第五章互相矛盾的撞後速度沒有被重算拒絕");
    const forgedMigration5 = N5.initialState("explore");
    forgedMigration5.lab.evidence.j1 = true;
    delete forgedMigration5.lab.judgments;
    if (San.sanitizeImport5(forgedMigration5, scenes5, Engine5).ok)
      throw new Error("第五章遷移仍會拿偽 evidence 反補正確判讀");

    const ui = readFileSync(path.join(here, "../src/chapter-ui.js"), "utf-8");
    const narrativeSource = readFileSync(path.join(here, "../src/narrative.js"), "utf-8");
    const html = readFileSync(path.join(here, "../stage.html"), "utf-8");
    for (const forbidden of ["pointerdown", "pointermove", "dragstart", "draggable="])
      if ((ui + narrativeSource).includes(forbidden))
        throw new Error("章內必要互動又綁回拖曳:" + forbidden);
    for (const fragment of [
      ".catSlot select { font-size: 11px; min-height: 44px; }",
      "@media(max-width:900px),(max-height:520px)",
      ".collision5Setting select,.collision5Action,.collision5Gate,.collision5JudgmentOption{min-height:44px}",
      'body[data-chapter="ch5"] #panelWrap{overflow:auto}'
    ]) if (!html.includes(fragment))
      throw new Error("第二／五章手機橫屏契約缺失:" + fragment);
  }
});

let pass = 0, fail = 0;
for (const t of tests) {
  try {
    await t.fn();
    pass++;
    console.log("  ✓ " + t.name);
  } catch (e) {
    fail++;
    console.error("  ✗ " + t.name + "\n    " + e.message);
  }
}
console.log(`\n${pass} 通過,${fail} 失敗(共 ${tests.length})`);
process.exit(fail ? 1 : 0);
