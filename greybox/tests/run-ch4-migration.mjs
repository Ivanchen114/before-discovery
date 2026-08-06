import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const Migration = require("../src/ch4-migration.js");
const Engine4 = require("../src/engine4.js");
const Sanitize = require("../src/sanitize.js");
const Scenes4 = require("../data/scenes4.js");
const base = JSON.parse(fs.readFileSync(path.join(here, "fixtures/ch4-v1-base.json"), "utf8"));
const golden = JSON.parse(fs.readFileSync(path.join(here, "fixtures/ch4-v1-cursors.json"), "utf8"));

const V2_STARTS = {
  "D0-1": "v2-d01-start",
  "D0-2": "v2-d02-start",
  "D1-1": "v2-d11-start",
  "D1-2": "v2-d12-start",
  "INT-1": "v2-int1-start",
  "D2-1": "v2-d21-start",
  "D2-2": "v2-d22-start",
  "D3-1": "v2-d31-start",
  "D4-1": "v2-d41-start",
  "D4-2": "v2-d42-start",
  "DE-1": "v2-de1-start",
  "DE-2": "v2-de2-start"
};
const targetScenes = {
  chapter: "ch4",
  scenes: Object.entries(V2_STARTS).map(([id, node]) => ({
    id,
    nodes: [{ id: node, type: "line", text: "fixture" }]
  }))
};

function copy(value) {
  return JSON.parse(JSON.stringify(value));
}
function seed(mode = "explore") {
  const out = copy(base);
  out.schemaVersion = 2;
  out.mode = mode;
  out.evidence = { K1: false, K2: false, K3: false, K4: false, K5: false };
  out.lab.sequence = 0;
  out.lab.sourceLab = {
    tangentPrediction: { choice: null, sealed: false, sealedAt: null },
    attempts: []
  };
  Object.assign(out.lab.orbitLab, {
    ruleSeal: null,
    manualBeats: [],
    manualAttempts: [],
    aimAngle: 35,
    firstStepAt: null,
    manualComplete: false,
    continuedAt: null
  });
  Object.assign(out.lab.scaleLab, {
    scalePrediction: null,
    predictionAttempts: [],
    conversionAttempts: [],
    ratioAttempts: [],
    relationAttempts: [],
    moonOneSecondSagMm: null,
    conversionCorrect: false,
    ratioCorrect: false,
    relationCorrect: false
  });
  Object.assign(out.lab.modelLab, {
    rowOrder: [],
    completedRows: [],
    rowStage: {},
    stampAttempts: [],
    loans: [],
    loanDecisions: {},
    comparisonSealed: false,
    evidencePackage: null
  });
  Object.assign(out.lab.proof, {
    shellPageReady: false,
    shellPagePlaced: false,
    authorField: { names: ["Newton", "Traveler"], travelerRemoved: false }
  });
  return out;
}
function migrate(state, overrides = {}) {
  return Migration.migrateV1ToV2(JSON.stringify(state), {
    targetScenes,
    initialState: seed(state.mode),
    ...overrides
  });
}
function k0Choice() {
  return {
    scene: "D1-1",
    node: "c1.tangent",
    speaker: "旅人(你)",
    text: "沿著此刻的方向直走"
  };
}
function withEvidence(level) {
  const state = copy(base);
  state.cursor = { scene: "D3-1", node: "n1" };
  state.transcript.push(k0Choice());
  for (let i = 1; i <= level; i += 1) {
    state.evidence[`K${i}`] = true;
    state.lab.evidence[`k${i}`] = true;
  }
  if (level >= 1) {
    state.lab.orbitLab.tangentRecord = {
      id: "tangent",
      kind: "tangent",
      path: [{ x: 1, y: 0 }],
      note: "舊版自動留下的切線紙"
    };
    state.lab.orbitLab.complete = true;
  }
  if (level >= 2) {
    state.lab.scaleLab.lawLocked = 2;
    state.lab.scaleLab.exponent = 2;
    state.lab.scaleLab.moonObservationRevealed = true;
    state.lab.scaleLab.moonMatch = true;
    state.lab.scaleLab.trials.push({
      id: 1,
      exponent: 2,
      moonSagM: 4.9,
      moonErrorPct: 0,
      periods: { mars: 1.874, jupiter: 11.858 },
      sealed: true,
      revealedAfterSeal: true
    });
    state.lab.claims.k2.push({
      sources: ["earth-fall", "moon-sag", "scale-60-60"],
      concept: "inverse-square-cross-scale",
      ok: true
    });
  }
  if (level >= 3) {
    state.lab.planetLab.predictions.push(
      {
        id: 1, planet: "mars", exponent: 2,
        prediction: 1.874, actual: 1.88, residualPct: 0.32,
        sealed: true, revealedAfterSeal: true, pass: true, superseded: false
      },
      {
        id: 2, planet: "jupiter", exponent: 2,
        prediction: 11.858, actual: 11.86, residualPct: 0.02,
        sealed: true, revealedAfterSeal: true, pass: true, superseded: false
      }
    );
    state.lab.planetLab.revealed = { mars: true, jupiter: true };
    state.lab.planetLab.residuals = { mars: 0.32, jupiter: 0.02 };
    state.lab.planetLab.crossScalePass = true;
    state.lab.claims.k3.push({
      sources: ["jupiter-sealed", "mars-sealed"],
      concept: "withheld-data-prediction",
      ok: true
    });
  }
  if (level >= 4) {
    state.lab.modelLab.runs.push({
      id: 1,
      model: "simpleVortex",
      caseId: "planets",
      residual: 12.4,
      patches: 2
    });
    state.lab.modelLab.gravityComplete = true;
    state.lab.modelLab.vortexComplete = true;
  }
  if (level >= 5) state.ended = true;
  return state;
}
function expectError(stateOrText, code, options = {}) {
  const raw = typeof stateOrText === "string" ? stateOrText : JSON.stringify(stateOrText);
  const result = Migration.migrateV1ToV2(raw, {
    targetScenes,
    initialState: seed(),
    ...options
  });
  assert.equal(result.ok, false, `應拒絕 ${code}`);
  assert.equal(result.error, code);
}
function completeMigratedK1(lab0) {
  let result = Engine4.sealOrbitRule(
    lab0,
    { target: "earth-center", speed: "medium", strength: "medium" },
    "circle"
  );
  assert.equal(result.error, undefined);
  let lab = result.state;
  for (let step = 0; step < 3; step += 1) {
    lab = Engine4.nudgeOrbitAim(
      lab,
      -Engine4._ORBIT_RULES.aimOffsets[step]
    ).state;
    result = Engine4.commitOrbitBeat(lab);
    assert.equal(result.ok, true);
    lab = result.state;
  }
  result = Engine4.continueOrbitRule(lab);
  assert.equal(result.ok, true);
  lab = result.state;
  result = Engine4.assertK1(
    lab,
    ["tangent", "closed"],
    "forward-plus-inward-turn"
  );
  assert.equal(result.ok, true);
  return result.state;
}

let checks = 0;
function checked(fn) {
  fn();
  checks += 1;
}

checked(() => {
  assert.equal(golden.schemaVersion, 1);
  assert.equal(golden.chapter, "ch4");
  assert.equal(
    golden.sourceSha256,
    "82e3e28c7e67d7612d308d7edfdb3f9089d01940bad63663bc5da71c8f445f56"
  );
  assert.equal(golden.sceneCount, 14);
  assert.equal(golden.nodeCount, 205);
  assert.equal(new Set(golden.cursors).size, 205);
  assert.deepEqual(Migration.legacyCursorKeys(), golden.cursors);
});

checked(() => {
  for (const key of golden.cursors) {
    const [scene, node] = key.split("/");
    const state = copy(base);
    state.cursor = { scene, node };
    if (!["D0-1", "D0-2", "D1-1"].includes(scene)) state.transcript.push(k0Choice());
    const result = migrate(state);
    assert.equal(result.ok, true, `${key}: ${result.message || result.error || ""}`);
    const mappedScene = Migration.V1_TO_V2_SCENE[scene];
    /* 這批 205 游標刻意不偽造舊證據；越過 K2 的合成狀態必須退回
       D1-2，而不是為了保住游標位置繞過新版 milestone guard。 */
    const expectedScene = ["D0-1", "D0-2", "D1-1", "D1-2"].includes(mappedScene)
      ? mappedScene
      : "D1-2";
    assert.equal(result.state.cursor.scene, expectedScene, key);
    assert.equal(result.state.cursor.node, V2_STARTS[expectedScene], key);
    const integrated = Migration.migrateText(JSON.stringify(state), targetScenes, Engine4);
    assert.equal(integrated.error, undefined, `${key}: ${integrated.message || ""}`);
    const sanitized = Sanitize.sanitizeImport4(
      JSON.parse(integrated.text),
      targetScenes,
      Engine4
    );
    assert.equal(sanitized.ok, true, `${key}: ${sanitized.reason || ""}`);
  }
});

checked(() => {
  for (let level = 1; level <= 5; level += 1) {
    const state = withEvidence(level);
    state.cursor = { scene: level === 5 ? "DE-2" : "D3-1", node: level === 5 ? "end" : "n1" };
    state.lab.archiveLab.clipped = Array.from({ length: level }, (_, i) => `K${i + 1}`);
    state.lab.archiveLab.complete = level === 5;
    const raw = JSON.stringify(state);
    const result = Migration.migrateV1ToV2(raw, {
      targetScenes,
      initialState: seed()
    });
    assert.equal(result.ok, true, `K1-K${level}`);
    assert.equal(result.backupText, raw, "必須逐字回傳原始備份");
    assert.equal(result.state.schemaVersion, 2);
    const expectedRedoScene = level === 1 ? "D1-2" : "D2-1";
    assert.equal(result.state.cursor.scene, expectedRedoScene);
    assert.equal(result.state.cursor.node, V2_STARTS[expectedRedoScene]);
    assert.equal(result.state.flags.legacyKnownOrbitMethod, "1");
    assert.equal(result.state.evidence.K1, false);
    assert.equal(result.state.lab.evidence.k1, false);
    assert.equal("K0" in result.state.evidence, false,
      "K0 是來源紙，不得混進五證據容器");
    assert.equal("k0" in result.state.lab.evidence, false);
    const expectedReacquire = ["K1"]
      .concat(level >= 4 ? ["K4"] : [])
      .concat(level >= 5 ? ["K5"] : []);
    assert.deepEqual(result.reacquire, expectedReacquire);
    assert.equal(result.state.ended, false);
    assert.equal(result.state.archiveLab, undefined);
    assert.equal(result.state.lab.archiveLab.clipped.includes("K1"), false);
    assert.deepEqual(result.state.lab.archiveLab.clipped, [],
      "新版回收必須等完整 K5 後由玩家逐張重做");
    assert.deepEqual(result.state.lab.archiveLab.clipAttempts, []);
    assert.equal(result.state.lab.archiveLab.complete, false);
    for (let i = 2; i <= 5; i += 1) {
      const expected = i <= level && i <= 3;
      assert.equal(result.state.evidence[`K${i}`], expected);
      assert.equal(result.state.lab.evidence[`k${i}`], expected);
    }
  }
});

checked(() => {
  const state = copy(base);
  state.cursor = { scene: "D2-1", node: "c1" };
  state.eventLog.push({ t: "embedDone", at: "D1-1/e1" });
  let result = migrate(state);
  assert.equal(result.ok, true);
  assert.equal(result.state.lab.sourceLab.tangentPrediction.sealed, false);
  assert.equal(result.state.cursor.scene, "D1-1", "沒有 choice 紀錄就退回來源紙");

  state.eventLog.push({ t: "choice", at: "D1-1/c1", pick: "tangent" });
  result = migrate(state);
  assert.equal(result.ok, true);
  assert.deepEqual(result.state.lab.sourceLab.tangentPrediction, {
    choice: "tangent",
    sealed: true,
    sealedAt: 2
  });
  assert.deepEqual(result.state.lab.sourceLab.attempts, [
    { choice: "tangent", ok: true, at: 2 }
  ]);
  assert.equal(result.state.lab.orbitLab.tangentRecord.source, "schema1-player-choice");
  assert.equal(result.state.cursor.scene, "D1-2",
    "有 K0 但沒有可驗證 K2 時必須回到同尺紙");
});

checked(() => {
  const state = copy(base);
  state.cursor = { scene: "D1-2", node: "e1" };
  state.transcript.push(k0Choice());
  state.lab.orbitLab.attempt = 1;
  state.lab.orbitLab.step = 2;
  state.lab.orbitLab.path = [{ x: 1, y: 0 }, { x: 0.9, y: 0.2 }];
  state.lab.orbitLab.ruleRuns.push({
    target: "earth-center",
    speed: "medium",
    strength: "medium",
    prediction: "near-circle",
    outcome: "near-circle",
    path: [{ x: 1, y: 0 }]
  });
  state.lab.scaleLab.lawLocked = 2;
  state.lab.planetLab.predictions.push({
    planet: "mars",
    prediction: 1.88,
    residualPct: 0,
    sealed: true,
    pass: true
  });
  state.lab.modelLab.runs.push({
    id: 1,
    model: "simpleVortex",
    caseId: "planets",
    residual: 12.4,
    patches: 2
  });
  const before = copy(state);
  const result = migrate(state);
  assert.equal(result.ok, true);
  assert.deepEqual(state, before, "migration 不得改動呼叫端物件");
  assert.equal(result.state.lab.scaleLab.lawLocked, null,
    "未形成可驗證 K2 的半成品距離律只留逐字備份");
  assert.equal(result.state.lab.planetLab.predictions.length, 0,
    "未湊齊可驗證 K3 的舊行星列只留逐字備份，不灌入新版封蠟時序");
  assert.equal(result.state.lab.modelLab.runs.length, 0,
    "舊 patches 只能留在逐字備份，不得灌入新版玩家借條狀態");
  assert.deepEqual(result.state.lab.modelLab.loans, []);
  assert.deepEqual(result.state.lab.modelLab.loanDecisions, {});
  assert.equal(result.state.lab.modelLab.evidencePackage, null);
  assert.equal(result.state.lab.orbitLab.ruleRuns.length, 0, "舊自動作圖不可灌入新版手動三拍");
});

checked(() => {
  const state = withEvidence(4);
  state.transcript.push({
    scene: "D3-3",
    node: "n8",
    speaker: "牛頓",
    text: "這是舊印刷台的一行。"
  });
  const a = migrate(state);
  const b = migrate(state);
  assert.equal(a.ok, true);
  assert.deepEqual(a, b, "同一輸入必須得到完全相同的遷移結果");
  const line = a.state.transcript.at(-1);
  assert.equal(line.scene, "D4-2");
  assert.equal(line.legacyScene, "D3-3");
  assert.equal(line.legacyNode, "n8");
  assert.equal(line.legacy, true);
  assert.equal("node" in line, false);
  assert.match(a.migrationNotice, /重新完成/);
});

checked(() => {
  expectError("{", "bad-json");
  const wrongVersion = copy(base);
  wrongVersion.schemaVersion = 2;
  expectError(wrongVersion, "wrong-version");
  const badCursor = copy(base);
  badCursor.cursor.node = "不存在";
  expectError(badCursor, "bad-cursor");
  const inconsistent = copy(base);
  inconsistent.evidence.K1 = true;
  expectError(inconsistent, "bad-evidence");
  const impossible = copy(base);
  impossible.evidence.K2 = true;
  impossible.lab.evidence.k2 = true;
  expectError(impossible, "bad-evidence");
  const negativePatch = copy(base);
  negativePatch.lab.modelLab.runs.push({
    model: "simpleVortex",
    caseId: "planets",
    residual: 1,
    patches: -1
  });
  expectError(negativePatch, "bad-lab");
  const polluted = `{"__proto__":{"polluted":true},${JSON.stringify(base).slice(1)}`;
  expectError(polluted, "unsafe-v1");
  const infinite = JSON.stringify(base).replace('"rep":3', '"rep":1e999');
  expectError(infinite, "unsafe-v1");
});

checked(() => {
  const unprovenK1 = copy(base);
  unprovenK1.evidence.K1 = true;
  unprovenK1.lab.evidence.k1 = true;
  unprovenK1.ended = false;
  const result = migrate(unprovenK1);
  assert.equal(result.ok, true);
  assert.equal(result.state.evidence.K1, false);
  assert.equal(result.state.lab.sourceLab.tangentPrediction.sealed, false);
  assert.equal(result.state.cursor.scene, "D1-1",
    "沒有玩家 choice 紀錄時不得把舊自動 tangentRecord 冒充 K0");
});

checked(() => {
  const unprovenK2 = withEvidence(2);
  unprovenK2.lab.claims.k2 = [];
  const result = migrate(unprovenK2);
  assert.equal(result.ok, true);
  assert.equal(result.state.evidence.K2, false);
  assert.equal(result.state.lab.evidence.k2, false);
  assert.deepEqual(result.reacquire, ["K1", "K2"]);
  assert.equal(result.state.cursor.scene, "D1-2",
    "K2 無可驗操作時，最早重做點必須先於 1679 K1");
});

checked(() => {
  const raw = JSON.stringify(base);
  let result = Migration.migrateV1ToV2(raw, {
    targetScenes,
    initialState: { schemaVersion: 1, chapter: "ch4", lab: {} }
  });
  assert.equal(result.ok, false);
  assert.equal(result.error, "bad-v2-seed");
  result = Migration.migrateV1ToV2(raw, {
    targetScenes: { scenes: [] },
    initialState: seed()
  });
  assert.equal(result.ok, false);
  assert.equal(result.error, "missing-v2-target");
});

checked(() => {
  const engine4 = { initialState: () => copy(seed().lab) };
  const oldText = JSON.stringify(base);
  const migrated = Migration.migrateText(oldText, targetScenes, engine4);
  assert.equal(migrated.migrated, true);
  assert.equal(migrated.report.backupText, oldText);
  assert.equal(JSON.parse(migrated.text).schemaVersion, 2);
  const passThrough = Migration.migrateText(migrated.text, targetScenes, engine4);
  assert.equal(passThrough.migrated, false);
  assert.equal(passThrough.text, migrated.text);
  assert.equal(Migration.migrateText("{", targetScenes, engine4).error, "bad-json");
  assert.equal(Migration.migrateText(JSON.stringify({ schemaVersion: 1, chapter: "ch3" }),
    targetScenes, engine4).error, "wrong-version");
});

checked(() => {
  const samples = [copy(base), ...Array.from({ length: 5 }, (_, i) => withEvidence(i + 1))];
  for (const oldState of samples) {
    const migrated = Migration.migrateText(JSON.stringify(oldState), targetScenes, Engine4);
    assert.equal(migrated.error, undefined, migrated.message || migrated.error);
    const checkedImport = Sanitize.sanitizeImport4(
      JSON.parse(migrated.text),
      targetScenes,
      Engine4
    );
    assert.equal(checkedImport.ok, true, checkedImport.reason || "sanitizeImport4");
  }
});

checked(() => {
  const migrated = Migration.migrateText(
    JSON.stringify(withEvidence(2)),
    targetScenes,
    Engine4
  );
  const lab = completeMigratedK1(JSON.parse(migrated.text).lab);
  assert.equal(lab.evidence.k1, true,
    "K1 回收後必須能從 D2-1 重新取得，不可形成死存檔");
});

checked(() => {
  const migrated = Migration.migrateText(
    JSON.stringify(withEvidence(4)),
    targetScenes,
    Engine4
  );
  let lab = completeMigratedK1(JSON.parse(migrated.text).lab);
  lab = Engine4.deferPress(lab, "先把三份資料逐列對完再送印").state;
  lab = Engine4.setModelProtocol(lab, "shared-law-observed-initials").state;
  lab = Engine4.sealModelPrediction(
    lab,
    "inverseSquare",
    "one-law-three-skies"
  ).state;
  lab = Engine4.sealModelPrediction(
    lab,
    "simpleVortex",
    "patches-beyond-moon"
  ).state;
  lab = Engine4.connectCometTracks(lab, "same-orbit").state;
  for (const caseId of ["moon", "planets", "comet"]) {
    lab = Engine4.beginLedgerRow(lab, caseId).state;
    lab = Engine4.stampLedgerCell(lab, caseId, "inverseSquare", "matches").state;
    lab = Engine4.stampLedgerCell(
      lab,
      caseId,
      "simpleVortex",
      caseId === "moon" ? "story" : "mismatch"
    ).state;
    if (caseId !== "moon") lab = Engine4.declineModelLoan(lab, caseId).state;
  }
  const result = Engine4.sealModelComparison(lab, "actual-ledger");
  assert.equal(result.ok, true,
    "K4 回收後必須能從空白蓋章／借條狀態重新取得：" +
      (result.error || "unknown"));
  assert.deepEqual(result.state.modelLab.loans, [],
    "migration 不得替玩家預貼借條");
});

checked(() => {
  for (const key of golden.cursors) {
    const [scene, node] = key.split("/");
    const oldState = copy(base);
    oldState.cursor = { scene, node };
    if (!["D0-1", "D0-2", "D1-1"].includes(scene)) oldState.transcript.push(k0Choice());
    const migrated = Migration.migrateText(
      JSON.stringify(oldState),
      Scenes4,
      Engine4
    );
    assert.equal(migrated.error, undefined, `${key}: ${migrated.message || ""}`);
    const sanitized = Sanitize.sanitizeImport4(
      JSON.parse(migrated.text),
      Scenes4,
      Engine4
    );
    assert.equal(sanitized.ok, true, `${key}: ${sanitized.reason || ""}`);
  }
});

checked(() => {
  const badK2 = withEvidence(3);
  badK2.lab.scaleLab.trials[0].periods.mars = 999;
  let result = migrate(badK2);
  assert.equal(result.ok, true);
  assert.equal(result.state.evidence.K2, false,
    "schema1 K2 數字遭竄改時不得 canonicalize 成真證據");
  assert.equal(result.state.evidence.K3, false,
    "K2 被拒後 K3 也不得跨依賴保留");

  const badK3 = withEvidence(3);
  badK3.lab.planetLab.predictions[0].prediction = 999;
  result = migrate(badK3);
  assert.equal(result.ok, true);
  assert.equal(result.state.evidence.K2, true);
  assert.equal(result.state.evidence.K3, false,
    "schema1 行星預測遭竄改時不得用 canonical 真數洗白");
});

checked(() => {
  const prematureK2 = withEvidence(2);
  prematureK2.cursor = { scene: "D1-1", node: "n7" };
  const result = migrate(prematureK2);
  assert.equal(result.ok, true);
  assert.equal(result.state.evidence.K2, false,
    "舊游標尚未越過 D2-2/e1 時不得只憑注入的 K2 狀態跨版攜帶");

  const legitimate = migrate(withEvidence(2));
  assert.equal(legitimate.ok, true);
  const forgedCursor = copy(legitimate.state);
  forgedCursor.migration.originalCursor = { scene: "D0-1", node: "n1" };
  forgedCursor.eventLog.find((event) => event.t === "migration").from =
    "D0-1/n1";
  assert.equal(
    Sanitize.sanitizeImport4(forgedCursor, targetScenes, Engine4).ok,
    false,
    "匯入淨化不得接受早於舊 K2 里程碑的偽造 migration.originalCursor"
  );
});

checked(() => {
  const beforeK0 = copy(base);
  beforeK0.cursor = { scene: "D1-1", node: "n1" };
  const migrated = Migration.migrateText(
    JSON.stringify(beforeK0), Scenes4, Engine4
  );
  assert.equal(migrated.error, undefined);
  const nativeK0 = JSON.parse(migrated.text);
  assert.equal(nativeK0.migration.k0ProvenBy, null);
  nativeK0.lab = Engine4.sealTangentPrediction(
    nativeK0.lab, "tangent"
  ).state;
  const nativeK0Checked = Sanitize.sanitizeImport4(
    nativeK0, Scenes4, Engine4
  );
  assert.equal(
    nativeK0Checked.ok,
    true,
    "遷移後由玩家重新封存的 native K0 應接在 baseSequence 後合法續玩"
      + (nativeK0Checked.reason ? `：${nativeK0Checked.reason}` : "")
  );
});

checked(() => {
  const migrated = Migration.migrateText(
    JSON.stringify(withEvidence(2)),
    targetScenes,
    Engine4
  );
  const state = JSON.parse(migrated.text);
  const before = JSON.stringify(state.lab);
  const sealed = Engine4.sealScalePrediction(state.lab, "one-over-3600");
  assert.equal(sealed.error, "completed-scale-record-locked");
  assert.equal(JSON.stringify(state.lab), before,
    "carried K2 的公開 API 拒絕時不得把存檔做成半套 native 紀錄");

  state.migration.baseSequence = state.lab.sequence + 1;
  state.eventLog.find((event) => event.t === "migration").baseSequence =
    state.migration.baseSequence;
  state.lab.sequence = state.migration.baseSequence;
  const checkedImport = Sanitize.sanitizeImport4(state, targetScenes, Engine4);
  assert.equal(checkedImport.ok, false,
    "migration.baseSequence 不得抬高來吞掉 post-migration 缺口");
});

console.log(`ch4 migration: ${checks} groups passed; ${golden.nodeCount} legacy cursors covered`);
