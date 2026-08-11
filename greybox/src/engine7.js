/* src/engine7.js — 第七章 EM1 接線矩陣、電量器、伏打堆與原紙誠信狀態機。
   所有操作皆為純函式；records / incidents / usedSourceIds 只增不減。 */
(function (root, factory) {
  "use strict";
  if (typeof module === "object" && module.exports) module.exports = factory();
  else { root.GB = root.GB || {}; root.GB.Engine7 = factory(); }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var FINAL_SUCCESS_CLAIM = "M 與 A 兩個全稱都失敗；不同配置必須分開記，目前不能指定統一的來源角色。";
  var MATRIX_KEYS = ["baseline", "bimetal", "sameMetal", "noMetal", "electrometer", "pile"];
  var EARLY_KEYS = ["baseline", "bimetal", "sameMetal", "noMetal"];
  var FIXTURES = {
    baseline: {
      configNote: "外部已知刺激；只確認本次蛙腿製備仍會反應",
      observation: "外部刺激到位時，蛙腿製備收縮。"
    },
    bimetal: {
      configNote: "黃銅鉤接觸鐵片，形成雙金屬閉合接法",
      observation: "黃銅與鐵接觸閉合時，蛙腿收縮。"
    },
    sameMetal: {
      configNote: "同材質金屬弧接觸神經與肌肉",
      observation: "同材質接法完成時，蛙腿收縮；只記本次接點與組織狀態。"
    },
    noMetal: {
      configNote: "不使用金屬，讓神經與肌肉直接接觸",
      observation: "沒有金屬在場，神經與肌肉直接接觸時仍然收縮。"
    },
    electrometer: {
      configNote: "無蛙；銅與鋅相觸後，把接觸效應餵給薄盤",
      observation: "桌上沒有生命組織；薄盤累積接觸後，提盤時細針偏轉。"
    },
    pile: {
      configNote: "無動物組織；銅、鋅與浸鹽水布依序重複疊層",
      observation: "兩端同觸時，反應持續存在，不只一下。"
    }
  };

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function fail(state, message, code) {
    return { state: state, error: message, code: code || "invalid" };
  }
  function initialState() {
    return {
      phase: "qualification",
      recordSeq: 0,
      records: [],
      matrix: {
        traces: {
          baseline: null, bimetal: null, sameMetal: null,
          noMetal: null, electrometer: null, pile: null
        },
        archival1794: null,
        testedScope: [],
        boardComplete: false,
        boardOrder: []
      },
      integrity: { incidents: [], activeWithholding: null, usedSourceIds: [] },
      commitment: {
        replicationAccepted: false,
        exclusiveClaim: null,
        attemptedClaims: [],
        signed: false,
        public: false,
        nextConfig: null,
        repaired: false
      },
      verdicts: { mid: null, final: null, attempts: [] },
      evidence: {
        baseline: false, bimetal: false, sameMetal: false,
        noMetal: false, electrometer: false, pile: false, board: false
      },
      electrometer: { pair: null, touched: false, feeds: 0, lifted: false },
      pile: { layers: [], tested: false, sustained: false }
    };
  }
  function appendRecord(state, kind, payload) {
    state.recordSeq += 1;
    var record = Object.assign({ id: "em1-r" + state.recordSeq, seq: state.recordSeq, kind: kind }, payload || {});
    state.records.push(record);
    return record;
  }
  function locked(state) {
    return !!(state.integrity && state.integrity.activeWithholding);
  }
  function guardUnlocked(state) {
    return locked(state) ? "原紙仍被收離桌面；先把這一筆修好。" : null;
  }
  function allTraces(state, keys) {
    return keys.every(function (key) { return !!state.matrix.traces[key]; });
  }
  function traceRecord(state, key) {
    var id = state.matrix.traces[key];
    return state.records.find(function (record) { return record.id === id; }) || null;
  }
  function visibleTrace(state, key) {
    var active = state.integrity.activeWithholding;
    return !!state.matrix.traces[key] && !(active && active.kind === "trace" && active.id === key);
  }
  function visibleArchival1794(state) {
    var active = state.integrity.activeWithholding;
    return !!state.matrix.archival1794 && !(active &&
      (active.kind === "archival1794" || active.kind === "claim-M-papers"));
  }
  function grantTrace(state, key, extra) {
    var fixture = FIXTURES[key];
    var record = appendRecord(state, "matrix-trace", Object.assign({
      traceId: "t_" + (key === "sameMetal" ? "same_metal" : (key === "noMetal" ? "no_metal" : key)),
      config: key,
      configNote: fixture.configNote,
      observation: fixture.observation
    }, extra || {}));
    if (!state.matrix.traces[key]) {
      state.matrix.traces[key] = record.id;
      state.evidence[key] = true;
    }
    if (key === "noMetal" && !state.matrix.archival1794) {
      var archival = appendRecord(state, "archival-source", {
        sourceId: "RECORD_1794",
        year: 1794,
        configNote: "無金屬；神經與肌肉直接接觸",
        observation: "沒有金屬在場仍記錄到收縮。"
      });
      state.matrix.archival1794 = archival.id;
    }
    return record;
  }

  function acceptReplication(state0, choice) {
    var state = clone(state0);
    var blocked = guardUnlocked(state); if (blocked) return fail(state0, blocked, "rep-locked");
    if (choice && typeof choice === "object") choice = choice.choice;
    if (choice !== "take-the-box" && choice !== "sample-only")
      return fail(state0, "接箱選項不存在");
    appendRecord(state, "replication-commitment", { choice: choice, accepted: choice === "take-the-box" });
    if (choice === "take-the-box") state.commitment.replicationAccepted = true;
    return { state: state, accepted: choice === "take-the-box" };
  }

  function runEm1Config(state0, args) {
    var state = clone(state0), blocked = guardUnlocked(state);
    if (blocked) return fail(state0, blocked, "rep-locked");
    if (!state.commitment.replicationAccepted) return fail(state0, "先接下整箱複驗的承諾。", "gate");
    var config = args && args.config;
    if (EARLY_KEYS.indexOf(config) < 0) return fail(state0, "這張桌上沒有這個接法。", "config");
    var record = grantTrace(state, config, { repeated: !!state.matrix.traces[config] });
    state.phase = allTraces(state, EARLY_KEYS) ? "exclusive-claim" : "qualification";
    return { state: state, record: record, firstTrace: state.matrix.traces[config] === record.id };
  }

  function commitExclusiveClaim(state0, args) {
    var state = clone(state0), blocked = guardUnlocked(state);
    if (blocked) return fail(state0, blocked, "rep-locked");
    if (!allTraces(state, EARLY_KEYS)) return fail(state0, "前四格尚未全部留痕。", "gate");
    var claim = args && args.claim;
    if (["M", "A", "not-yet"].indexOf(claim) < 0) return fail(state0, "主張不存在。", "claim");
    var attempted = appendRecord(state, "exclusive-claim", {
      claim: claim,
      signed: claim === "A",
      public: claim === "A",
      disposition: claim === "M" ? "refuted-before-dispatch" : (claim === "A" ? "circulated" : "withheld")
    });
    state.commitment.attemptedClaims.push(attempted.id);
    state.commitment.exclusiveClaim = claim;
    state.commitment.signed = claim === "A";
    state.commitment.public = claim === "A";
    state.phase = claim === "not-yet" ? "next-config" : "electrometer";
    return { state: state, claim: claim };
  }

  function commitNextConfig(state0, args) {
    var state = clone(state0), blocked = guardUnlocked(state);
    if (blocked) return fail(state0, blocked, "rep-locked");
    if (state.commitment.exclusiveClaim !== "not-yet") return fail(state0, "這條承諾只屬於暫不排他的路。", "gate");
    var choice = args && args.choice;
    if (["next-no-metal-contraction", "next-tissue-free-charge", "next-repeat-known"].indexOf(choice) < 0)
      return fail(state0, "下一格選項不存在。", "choice");
    appendRecord(state, "next-config-commitment", {
      choice: choice,
      discriminating: choice === "next-tissue-free-charge"
    });
    if (choice === "next-tissue-free-charge") {
      state.commitment.nextConfig = choice;
      state.phase = "electrometer";
    }
    return { state: state, accepted: choice === "next-tissue-free-charge" };
  }

  function touchElectrometerMetals(state0, args) {
    var state = clone(state0), blocked = guardUnlocked(state);
    if (blocked) return fail(state0, blocked, "rep-locked");
    if (state.phase !== "electrometer") return fail(state0, "還沒走到帕維亞的電量器。", "gate");
    var pair = args && args.pair;
    state.electrometer.pair = pair || null;
    state.electrometer.touched = pair === "copper-zinc";
    appendRecord(state, "electrometer-touch", { pair: pair || null, valid: state.electrometer.touched });
    return state.electrometer.touched
      ? { state: state, ok: true }
      : { state: state, ok: false, code: "pair", userMessage: "兩片沒有形成銅鋅接觸；這次接法已記下，可以重接。" };
  }
  function feedElectrometerPlate(state0) {
    var state = clone(state0), blocked = guardUnlocked(state);
    if (blocked) return fail(state0, blocked, "rep-locked");
    if (!state.electrometer.touched) return fail(state0, "先讓銅碰鋅，再把那一點餵給薄盤。", "order");
    state.electrometer.feeds += 1;
    appendRecord(state, "electrometer-feed", { feed: state.electrometer.feeds });
    return { state: state };
  }
  function liftElectrometerPlate(state0) {
    var state = clone(state0), blocked = guardUnlocked(state);
    if (blocked) return fail(state0, blocked, "rep-locked");
    if (state.electrometer.feeds < 1) return fail(state0, "薄盤還沒有接到任何一次接觸。", "order");
    state.electrometer.lifted = true;
    var record = grantTrace(state, "electrometer", { feedCount: state.electrometer.feeds });
    state.phase = "mid-verdict";
    return { state: state, record: record, deflected: true };
  }

  function recordMidVerdict(state0, args) {
    var state = clone(state0), blocked = guardUnlocked(state);
    if (blocked) return fail(state0, blocked, "rep-locked");
    if (!state.matrix.traces.electrometer) return fail(state0, "帕維亞的針格尚未留痕。", "gate");
    var choice = args && args.choice;
    var correct = choice === "mid-m-fell-a-open";
    var record = appendRecord(state, "mid-verdict", { choice: choice, correct: correct });
    state.verdicts.attempts.push(record.id);
    if (correct) {
      state.verdicts.mid = choice;
      state.phase = "await-pile";
    }
    return { state: state, correct: correct };
  }

  function setPileLayer(state0, args) {
    var state = clone(state0), blocked = guardUnlocked(state);
    if (blocked) return fail(state0, blocked, "rep-locked");
    if (state.phase !== "await-pile" && state.phase !== "pile")
      return fail(state0, "還沒走到 1800 年的堆。", "gate");
    var material = args && args.material;
    if (["copper", "zinc", "brine"].indexOf(material) < 0) return fail(state0, "疊層材料不存在。", "material");
    if (args && args.reset === true) state.pile.layers = [];
    state.pile.layers.push(material);
    state.phase = "pile";
    appendRecord(state, "pile-layer", {
      material: material,
      position: state.pile.layers.length,
      reset: !!(args && args.reset === true)
    });
    return { state: state, layers: state.pile.layers.slice() };
  }
  function validPile(layers) {
    if (!Array.isArray(layers) || layers.length < 6 || layers.length % 3 !== 0) return false;
    return layers.every(function (material, index) {
      return material === ["copper", "zinc", "brine"][index % 3];
    });
  }
  function testPileEnds(state0) {
    var state = clone(state0), blocked = guardUnlocked(state);
    if (blocked) return fail(state0, blocked, "rep-locked");
    var valid = validPile(state.pile.layers);
    appendRecord(state, "pile-test", { layers: state.pile.layers.slice(), sustained: valid });
    state.pile.tested = true;
    state.pile.sustained = valid;
    if (!valid) return {
      state: state,
      ok: false,
      code: "pile-order",
      sustained: false,
      userMessage: "沒有形成持續的勁——這次排列已記下，層序可以重排。"
    };
    var record = grantTrace(state, "pile", { layers: state.pile.layers.slice() });
    state.phase = "board";
    return { state: state, record: record, sustained: true };
  }

  function placeMatrixTrace(state0, args) {
    var state = clone(state0), blocked = guardUnlocked(state);
    if (blocked) return fail(state0, blocked, "rep-locked");
    if (state.phase !== "board") return fail(state0, "六格還不能合帳。", "gate");
    var key = args && args.trace;
    if (MATRIX_KEYS.indexOf(key) < 0 || !state.matrix.traces[key]) return fail(state0, "這張原紙尚未取得。", "trace");
    if (!visibleTrace(state, key)) return fail(state0, "這張原紙仍被收離桌面。", "withheld");
    if (state.matrix.boardOrder.indexOf(key) < 0) state.matrix.boardOrder.push(key);
    appendRecord(state, "board-placement", { trace: key, position: state.matrix.boardOrder.indexOf(key) + 1 });
    return { state: state, placed: state.matrix.boardOrder.slice() };
  }
  function sealMatrixBoard(state0) {
    var state = clone(state0), blocked = guardUnlocked(state);
    if (blocked) return fail(state0, blocked, "rep-locked");
    if (!MATRIX_KEYS.every(function (key) { return state.matrix.boardOrder.indexOf(key) >= 0; }))
      return fail(state0, "六張紙還沒有全回到同一頁。", "board-incomplete");
    state.matrix.testedScope = state.matrix.boardOrder.slice();
    state.matrix.boardComplete = true;
    state.evidence.board = true;
    appendRecord(state, "matrix-board", {
      completeness: true,
      testedScope: state.matrix.testedScope.slice()
    });
    state.phase = "final-verdict";
    return { state: state, complete: true };
  }

  function recordFinalVerdict(state0, args) {
    var state = clone(state0), blocked = guardUnlocked(state);
    if (blocked) return fail(state0, blocked, "rep-locked");
    if (!state.matrix.boardComplete) return fail(state0, "矩陣尚未合帳。", "gate");
    var choice = args && args.choice;
    var correct = choice === "m-a-both-fell-record-configs-separately";
    var record = appendRecord(state, "final-verdict", { choice: choice, correct: correct });
    state.verdicts.attempts.push(record.id);
    if (correct) {
      state.verdicts.final = choice;
      state.phase = state.commitment.exclusiveClaim === "A" ? "named" : "scoped";
    }
    return { state: state, correct: correct };
  }
  function repairExclusiveClaim(state0) {
    var state = clone(state0), blocked = guardUnlocked(state);
    if (blocked) return fail(state0, blocked, "rep-locked");
    if (state.commitment.exclusiveClaim !== "A" || !state.commitment.public || !state.verdicts.final)
      return fail(state0, "目前沒有可在原紙上限縮的公開署名。", "gate");
    if (!state.commitment.repaired)
      appendRecord(state, "claim-repair", { claim: "A", method: "scope-on-original" });
    state.commitment.repaired = true;
    state.phase = "scoped";
    return { state: state, repaired: true };
  }

  function beginIntegrityIncident(state, sourceId, kind, id, reason, attemptedClaim) {
    if (state.integrity.usedSourceIds.indexOf(sourceId) >= 0)
      return fail(state, "這一筆失信已經發生過，不能再次藏同一張紙。", "incident-reused");
    if (locked(state)) return fail(state, "先修目前桌上的空位。", "rep-locked");
    var incident = appendRecord(state, "integrity-incident", {
      sourceId: sourceId, incidentKind: kind, targetId: id, reason: reason
    });
    state.integrity.usedSourceIds.push(sourceId);
    state.integrity.incidents.push(incident.id);
    state.integrity.activeWithholding = { kind: kind, id: id, sourceId: sourceId, incidentId: incident.id };
    if (attemptedClaim) {
      var claimRecord = appendRecord(state, "attempted-claim", attemptedClaim);
      state.commitment.attemptedClaims.push(claimRecord.id);
    }
    return {
      state: state,
      repDelta: -1,
      repSource: sourceId,
      repReason: reason,
      integrityIncident: incident.id
    };
  }
  function concealArchival1794(state0) {
    var state = clone(state0);
    if (!state.matrix.archival1794 || !visibleArchival1794(state))
      return fail(state0, "一七九四年的紙不在可收起的位置。", "gate");
    return beginIntegrityIncident(
      state, "ch7:conceal-1794", "archival1794", "RECORD_1794",
      "把已知反例藏離桌面，企圖讓排他主張失去可見反證"
    );
  }
  function withdrawMatrixTrace(state0, args) {
    var state = clone(state0), key = args && args.trace;
    if (MATRIX_KEYS.indexOf(key) < 0 || !traceRecord(state, key) || !visibleTrace(state, key))
      return fail(state0, "這格沒有可收離桌面的原紙。", "gate");
    return beginIntegrityIncident(
      state, "ch7:withdraw-trace:" + key, "trace", key,
      "把自己已留痕的觀測收離桌面，隱去不利原紙"
    );
  }
  function refuseCorrection(state0) {
    var state = clone(state0);
    if (state.commitment.exclusiveClaim !== "M" || !state.matrix.archival1794 || !state.matrix.traces.noMetal)
      return fail(state0, "目前沒有眼前已有兩張反證的 M 原稿。", "gate");
    var result = beginIntegrityIncident(
      state, "ch7:refuse-correction", "claim-M-papers", "M:RECORD_1794+t_no_metal",
      "眼前已有兩張反證，仍抽走原紙並企圖把排他主張送出",
      { claim: "M", disposition: "send-despite-refutation", public: false }
    );
    if (!result.error) {
      result.stageText = "旅人把回覆遞向門邊，卻把四年前那張紙和今天親手填的那格抽離附件。桌上立刻空了兩處。Galvani 沒有接。";
      result.returnNode = "c_exclusive";
    }
    return result;
  }
  function repairWithholding(state0) {
    var state = clone(state0), active = state.integrity.activeWithholding;
    if (!active) return fail(state0, "桌上沒有待修的空位。", "gate");
    appendRecord(state, "integrity-repair", {
      incidentId: active.incidentId,
      sourceId: active.sourceId,
      method: "restore-and-scope-on-original"
    });
    state.integrity.activeWithholding = null;
    return {
      state: state,
      repDelta: 1,
      repSource: "SC7-R1/c1.withdraw",
      repReason: "把藏起來的原紙放回桌上，在被反駁的句子上劃限縮線並署名認錯",
      clearRepLock: true,
      repairedIncident: active.incidentId
    };
  }

  function gateSatisfied(state, gate) {
    if (!state || typeof gate !== "string") return false;
    if (gate === "matrix-four") return allTraces(state, EARLY_KEYS);
    if (gate === "electrometer") return !!state.matrix.traces.electrometer;
    if (gate === "pile") return !!state.matrix.traces.pile;
    if (gate === "board") return !!state.matrix.boardComplete;
    return false;
  }

  return {
    FINAL_SUCCESS_CLAIM: FINAL_SUCCESS_CLAIM,
    MATRIX_KEYS: MATRIX_KEYS.slice(), EARLY_KEYS: EARLY_KEYS.slice(), FIXTURES: clone(FIXTURES),
    initialState: initialState,
    acceptReplication: acceptReplication,
    runEm1Config: runEm1Config,
    commitExclusiveClaim: commitExclusiveClaim,
    commitNextConfig: commitNextConfig,
    touchElectrometerMetals: touchElectrometerMetals,
    feedElectrometerPlate: feedElectrometerPlate,
    liftElectrometerPlate: liftElectrometerPlate,
    recordMidVerdict: recordMidVerdict,
    setPileLayer: setPileLayer,
    testPileEnds: testPileEnds,
    placeMatrixTrace: placeMatrixTrace,
    sealMatrixBoard: sealMatrixBoard,
    recordFinalVerdict: recordFinalVerdict,
    repairExclusiveClaim: repairExclusiveClaim,
    concealArchival1794: concealArchival1794,
    withdrawMatrixTrace: withdrawMatrixTrace,
    refuseCorrection: refuseCorrection,
    repairWithholding: repairWithholding,
    gateSatisfied: gateSatisfied,
    visibleTrace: visibleTrace,
    visibleArchival1794: visibleArchival1794,
    validPile: validPile
  };
});
