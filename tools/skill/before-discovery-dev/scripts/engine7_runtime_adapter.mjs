#!/usr/bin/env node
/* Fail-closed runtime evidence adapter for CH7 mechanics.
   stdout is exactly one JSON object; diagnostics use the object, not prose. */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve, relative } from "node:path";

const require = createRequire(import.meta.url);
const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1]);
}

const repoRoot = resolve(args.get("--repo-root") || ".");
const enginePath = resolve(args.get("--engine") || "");
const failures = [];
const checks = {};

function check(name, condition, detail) {
  checks[name] = Boolean(condition);
  if (!condition) failures.push({ check: name, detail });
}

function assertResult(result, label) {
  if (!result || result.error || !result.state) {
    throw new Error(`${label}: ${result?.error || "missing state"}`);
  }
  return result.state;
}

function permutations(values) {
  if (values.length <= 1) return [values.slice()];
  return values.flatMap((value, index) =>
    permutations(values.slice(0, index).concat(values.slice(index + 1)))
      .map((tail) => [value].concat(tail))
  );
}

function acceptedState(Engine) {
  return assertResult(
    Engine.acceptReplication(Engine.initialState(), { choice: "take-the-box" }),
    "accept replication"
  );
}

function earlyState(Engine, claim = "A") {
  let state = acceptedState(Engine);
  for (const config of Engine.EARLY_KEYS) {
    state = assertResult(Engine.runEm1Config(state, { config }), `run ${config}`);
  }
  state = assertResult(Engine.commitExclusiveClaim(state, { claim }), `claim ${claim}`);
  return state;
}

function electrometerState(Engine, claim = "A") {
  let state = earlyState(Engine, claim);
  state = assertResult(Engine.touchElectrometerMetals(state, { pair: "copper-zinc" }), "touch metals");
  state = assertResult(Engine.feedElectrometerPlate(state), "feed plate");
  state = assertResult(Engine.liftElectrometerPlate(state), "lift plate");
  state = assertResult(
    Engine.recordMidVerdict(state, { choice: "mid-m-fell-a-open" }),
    "mid verdict"
  );
  return state;
}

function pileState(Engine, claim = "A") {
  let state = electrometerState(Engine, claim);
  for (const material of ["copper", "zinc", "brine", "copper", "zinc", "brine"]) {
    state = assertResult(Engine.setPileLayer(state, { material }), `pile ${material}`);
  }
  return assertResult(Engine.testPileEnds(state), "test pile");
}

function boardState(Engine, claim = "A") {
  let state = pileState(Engine, claim);
  for (const trace of Engine.MATRIX_KEYS) {
    state = assertResult(Engine.placeMatrixTrace(state, { trace }), `place ${trace}`);
  }
  return assertResult(Engine.sealMatrixBoard(state), "seal board");
}

let payload;
try {
  if (!enginePath.startsWith(repoRoot + "/")) throw new Error("engine path is outside repository");
  const source = readFileSync(enginePath);
  const Engine = require(enginePath);
  const engineSha256 = createHash("sha256").update(source).digest("hex");

  let allOrders = true;
  for (const order of permutations(Engine.EARLY_KEYS)) {
    let state = acceptedState(Engine);
    for (let index = 0; index < order.length; index += 1) {
      state = assertResult(Engine.runEm1Config(state, { config: order[index] }), `permutation ${order}`);
      if (index < 3 && Engine.gateSatisfied(state, "matrix-four")) allOrders = false;
    }
    if (!Engine.gateSatisfied(state, "matrix-four")) allOrders = false;
  }
  check("matrixPermutations24", allOrders, "all 24 orders must open only after four traces");

  let repeated = acceptedState(Engine);
  repeated = assertResult(Engine.runEm1Config(repeated, { config: "baseline" }), "first baseline");
  const firstTrace = repeated.matrix.traces.baseline;
  const beforeRepeat = repeated.records.length;
  repeated = assertResult(Engine.runEm1Config(repeated, { config: "baseline" }), "repeat baseline");
  check(
    "repeatAppendsWithoutRegrant",
    repeated.records.length === beforeRepeat + 1 && repeated.matrix.traces.baseline === firstTrace,
    "repeat must append one paper and preserve the named trace"
  );

  let operation = earlyState(Engine, "A");
  const liftEarly = Engine.liftElectrometerPlate(operation);
  const noElectrometer = Boolean(liftEarly.error) && !liftEarly.state.matrix.traces.electrometer;
  operation = assertResult(Engine.touchElectrometerMetals(operation, { pair: "copper-zinc" }), "touch for dominance");
  operation = assertResult(Engine.feedElectrometerPlate(operation), "feed for dominance");
  operation = assertResult(Engine.liftElectrometerPlate(operation), "lift for dominance");
  operation = assertResult(Engine.recordMidVerdict(operation, { choice: "mid-m-fell-a-open" }), "mid for dominance");
  for (const material of ["zinc", "copper", "brine", "zinc", "copper", "brine"]) {
    operation = assertResult(Engine.setPileLayer(operation, { material }), "bad pile layer");
  }
  const badPile = Engine.testPileEnds(operation);
  const noPile = badPile.ok === false && !badPile.state.matrix.traces.pile;
  let beforeBoard = pileState(Engine, "A");
  const earlySeal = Engine.sealMatrixBoard(beforeBoard);
  const noBoard = Boolean(earlySeal.error) && !earlySeal.state.matrix.boardComplete;
  const earlyVerdict = Engine.recordFinalVerdict(beforeBoard, {
    choice: "m-a-both-fell-record-configs-separately"
  });
  check(
    "operationDominance",
    noElectrometer && noPile && noBoard && Boolean(earlyVerdict.error),
    "electrometer, pile and board must each gate their trace or final verdict"
  );

  let aState = boardState(Engine, "A");
  const signedBefore = aState.commitment.signed && aState.commitment.public && !aState.commitment.repaired;
  aState = assertResult(Engine.recordFinalVerdict(aState, {
    choice: "m-a-both-fell-record-configs-separately"
  }), "A final verdict");
  const repaired = assertResult(Engine.repairExclusiveClaim(aState), "A same-paper repair");
  check(
    "claimAPersistsUntilRepair",
    signedBefore && aState.commitment.public && !aState.commitment.repaired &&
      repaired.commitment.public && repaired.commitment.repaired,
    "public A claim must persist until the explicit same-paper repair"
  );

  const mState = earlyState(Engine, "M");
  check(
    "claimMRefutedBeforeDispatch",
    mState.commitment.exclusiveClaim === "M" && !mState.commitment.public &&
      Boolean(mState.matrix.traces.noMetal) && Boolean(mState.matrix.archival1794),
    "M must remain non-public while both no-metal papers exist"
  );

  let nextState = earlyState(Engine, "not-yet");
  const nonDiscriminating = assertResult(
    Engine.commitNextConfig(nextState, { choice: "next-repeat-known" }),
    "non-discriminating next config"
  );
  const blockedElectrometer = Engine.touchElectrometerMetals(nonDiscriminating, { pair: "copper-zinc" });
  nextState = assertResult(
    Engine.commitNextConfig(nonDiscriminating, { choice: "next-tissue-free-charge" }),
    "discriminating next config"
  );
  check(
    "notYetRequiresDiscriminatingConfig",
    !nonDiscriminating.commitment.nextConfig && Boolean(blockedElectrometer.error) &&
      nextState.commitment.nextConfig === "next-tissue-free-charge",
    "not-yet may advance only through the tissue-free measurement"
  );

  function integrityCase(kind) {
    let state = earlyState(Engine, kind === "T3" ? "M" : "A");
    let incident;
    if (kind === "T1") incident = Engine.concealArchival1794(state);
    else if (kind === "T2") incident = Engine.withdrawMatrixTrace(state, { trace: "noMetal" });
    else incident = Engine.refuseCorrection(state);
    if (!incident || incident.error) return false;
    const historySize = incident.state.integrity.incidents.length;
    const lockedAction = Engine.runEm1Config(incident.state, { config: "baseline" });
    const repairedState = assertResult(Engine.repairWithholding(incident.state), `${kind} repair`);
    let repeat;
    if (kind === "T1") repeat = Engine.concealArchival1794(repairedState);
    else if (kind === "T2") repeat = Engine.withdrawMatrixTrace(repairedState, { trace: "noMetal" });
    else repeat = Engine.refuseCorrection(repairedState);
    return incident.repDelta === -1 && Boolean(lockedAction.error) &&
      repairedState.integrity.incidents.length === historySize &&
      !repairedState.integrity.activeWithholding && repairedState.integrity.usedSourceIds.length === 1 &&
      Boolean(repeat.error);
  }
  check(
    "integrityTransactions",
    ["T1", "T2", "T3"].every(integrityCase),
    "each temptation must lock immediately, repair the active incident, preserve history and reject reuse"
  );

  check(
    "finalSuccessExact",
    Engine.FINAL_SUCCESS_CLAIM ===
      "M 與 A 兩個全稱都失敗；不同配置必須分開記，目前不能指定統一的來源角色。",
    "engine final success claim drifted"
  );

  payload = {
    schemaVersion: 1,
    chapter: "ch7",
    enginePath: relative(repoRoot, enginePath).replaceAll("\\\\", "/"),
    engineSha256,
    checks,
    finalSuccessClaim: Engine.FINAL_SUCCESS_CLAIM,
    ok: failures.length === 0,
    failures
  };
} catch (error) {
  payload = {
    schemaVersion: 1,
    chapter: "ch7",
    enginePath: relative(repoRoot, enginePath).replaceAll("\\\\", "/"),
    engineSha256: null,
    checks,
    finalSuccessClaim: null,
    ok: false,
    failures: failures.concat([{ check: "adapterExecution", detail: String(error?.message || error) }])
  };
}

process.stdout.write(JSON.stringify(payload));
process.exitCode = payload.ok ? 0 : 1;
