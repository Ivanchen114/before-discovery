/* src/engine.js — 純函式狀態機(R-STA-05:給定狀態+事件 → 唯一後繼狀態)
   法源:灰盒功能規格書 v0.1.1。無 DOM、無亂數、無副作用;瀏覽器與 Node 皆可載入。 */
(function (root, factory) {
  "use strict";
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("../data/patterns.js"), require("../data/debate.js"));
  } else {
    root.GB = root.GB || {};
    root.GB.Engine = factory(root.GB.DATA.patterns, root.GB.DATA.debate);
  }
})(typeof self !== "undefined" ? self : this, function (PATTERNS, DEBATE) {
  "use strict";

  var DIMS = ["ball", "surface", "incline", "timer"];
  var DIM_LABEL = { ball: "球", surface: "槽面", incline: "傾角", timer: "計時" };
  var ODD = [3, 5, 7];
  var TOL = 0.12;

  function clone(s) { return JSON.parse(JSON.stringify(s)); }
  function configKey(c) { return DIMS.map(function (d) { return c[d]; }).join("|"); }

  function initialState() {
    return {
      days: 0,
      runSeq: {},
      evidence: { runs: [], e3: { a: false, b: false, c: false }, stubs: DEBATE.stubs.slice() },
      inference: { claims: [], assertions: [], comparisons: [] },
      belief: {
        P3: {
          statements: { s1: "intact", s2: "intact", s3: "intact" },
          persuasion: DEBATE.persuasion,
          status: "pending",
          s2NeedFlag: false
        }
      },
      review: { q1: "", q2: "" }
    };
  }

  /* R-DATA-01:讀值 = B + S×計時樣式 + 槽面樣式 + 球體樣式,下限夾制 1(儲存精確值,顯示層才捨入) */
  function computeReadings(config, patternIndex) {
    var b = PATTERNS.base[config.incline];
    var s = PATTERNS.severity[config.timer][config.incline];
    var t = PATTERNS.timer[config.timer][patternIndex];
    var sf = PATTERNS.surface[config.surface][patternIndex];
    var bl = PATTERNS.ball[config.ball][patternIndex];
    return b.map(function (base, i) {
      return Math.max(1, base + s * t[i] + sf[i] + bl[i]);
    });
  }

  /* R-EXP-01/02/03:執行實驗。天數 += 工具成本;同配置第 n 次 → 樣式 ((n−1) mod 3)+1 */
  function runExperiment(state0, config) {
    var state = clone(state0);
    var key = configKey(config);
    var n = (state.runSeq[key] || 0) + 1;
    state.runSeq[key] = n;
    var patternIndex = (n - 1) % 3;
    state.days += PATTERNS.dayCost[config.timer];
    var run = {
      id: state.evidence.runs.length + 1,
      config: clone(config),
      readings: computeReadings(config, patternIndex),
      seq: n,
      patternIndex: patternIndex,
      day: state.days
    };
    state.evidence.runs.push(run);
    return { state: state, run: run };
  }

  function diffDims(configs) {
    return DIMS.filter(function (d) {
      var vals = {};
      configs.forEach(function (c) { vals[c[d]] = 1; });
      return Object.keys(vals).length > 1;
    });
  }

  /* R-JUD-01:選集守衛——四維配置指紋(球/槽面/傾角/計時)全同;拒絕重複與無效 ID */
  function checkSelection(state, runIds) {
    var seen = {}, hasDup = false;
    runIds.forEach(function (id) { if (seen[id]) hasDup = true; seen[id] = 1; });
    if (hasDup) return { ok: false, reason: "選集含重複 run", diff: [] };
    var runs = runIds.map(function (id) {
      return state.evidence.runs.filter(function (r) { return r.id === id; })[0];
    }).filter(Boolean);
    if (runs.length !== runIds.length || runs.length < 1 || runs.length > 3) {
      return { ok: false, reason: "選集需 1–3 筆有效 run", diff: [] };
    }
    var diff = diffDims(runs.map(function (r) { return r.config; }));
    if (diff.length) {
      return { ok: false, reason: "變因未受控,無法認證", diff: diff.map(function (d) { return DIM_LABEL[d]; }) };
    }
    return { ok: true, runs: runs };
  }

  function avgDeltas(runs) {
    return [0, 1, 2, 3].map(function (i) {
      return runs.reduce(function (a, r) { return a + r.readings[i]; }, 0) / runs.length;
    });
  }

  function cumulative(readings) {
    var out = [], acc = 0;
    readings.forEach(function (v) { acc += v; out.push(acc); });
    return out;
  }

  /* R-JUD-03/04:預測式指認。成敗皆記(R-STA-04);守衛不過則拒絕受理、不記 claim */
  function judge(state0, runIds, prediction) {
    var sel = checkSelection(state0, runIds);
    if (!sel.ok) return { state: state0, rejected: sel };
    var state = clone(state0);
    var avg = avgDeltas(sel.runs);
    var target = 9 * avg[0];
    var predDev = Math.abs(prediction - target) / target;
    var predHit = predDev <= TOL;
    var devs = ODD.map(function (k, i) { return Math.abs(avg[i + 1] / avg[0] - k) / k; });
    var consistent = devs.every(function (d) { return d <= TOL; });
    var ok = predHit && consistent;
    var claim = {
      id: state.inference.claims.length + 1,
      runIds: runIds.slice(),
      config: clone(sel.runs[0].config),
      prediction: prediction,
      ok: ok,
      predHit: predHit,
      consistent: consistent,
      predDev: predDev,
      maxDev: Math.max.apply(null, devs),
      day: state.days
    };
    state.inference.claims.push(claim);
    if (ok) state.evidence.e3.a = true; /* E3.a:任一主張成立即點亮 */
    return { state: state, claim: claim };
  }

  /* R-JUD-05:斷言。b=僅球相異(銅大/銅小)、c=僅傾角相異;其餘三維全同且兩主張皆成立。
     入口守衛:僅接受 b/c;其他型別回傳錯誤且不改 state、不記 assertion(程式審查 B-3)。 */
  function assertE3(state0, type, claimIds) {
    if (type !== "b" && type !== "c") {
      return {
        state: state0,
        assertion: { id: null, type: type, claimIds: claimIds.slice(), ok: false, reason: "未知斷言型別(僅接受 b/c)", diff: [] },
        invalidType: true
      };
    }
    var state = clone(state0);
    var cs = claimIds.map(function (id) {
      return state.inference.claims.filter(function (c) { return c.id === id; })[0];
    }).filter(Boolean);
    var rec = { id: state.inference.assertions.length + 1, type: type, claimIds: claimIds.slice(), ok: false, reason: "", diff: [] };
    if (cs.length !== 2) {
      rec.reason = "需選取兩筆主張";
    } else if (!cs.every(function (c) { return c.ok; })) {
      rec.reason = "兩筆主張皆須成立";
    } else {
      var diff = diffDims(cs.map(function (c) { return c.config; })).map(function (d) { return DIM_LABEL[d]; });
      var want = type === "b" ? "球" : "傾角";
      if (diff.length === 1 && diff[0] === want) {
        if (type === "b") {
          var balls = {};
          cs.forEach(function (c) { balls[c.config.ball] = 1; });
          if (balls["銅大"] && balls["銅小"]) { rec.ok = true; state.evidence.e3.b = true; }
          else { rec.reason = "球之相異須為銅大/銅小"; }
        } else {
          rec.ok = true; state.evidence.e3.c = true;
        }
      } else {
        rec.reason = "變因不符";
        rec.diff = diff;
      }
    }
    state.inference.assertions.push(rec);
    return { state: state, assertion: rec };
  }

  /* R-JUD-02 比較工具:記錄 run 對之相異變因 */
  function compareRuns(state0, runIdPair) {
    var runs = runIdPair.map(function (id) {
      return state0.evidence.runs.filter(function (r) { return r.id === id; })[0];
    }).filter(Boolean);
    if (runs.length !== 2) return { state: state0, error: "需選取兩筆 run" };
    var state = clone(state0);
    var rec = { runIds: runIdPair.slice(), diff: diffDims(runs.map(function (r) { return r.config; })).map(function (d) { return DIM_LABEL[d]; }) };
    state.inference.comparisons.push(rec);
    return { state: state, comparison: rec };
  }

  function e3Established(state) { return state.evidence.e3.a && state.evidence.e3.b; }

  /* R-DEB-02 追問:免費,不改量表 */
  function press(sid) {
    var st = DEBATE.statements.filter(function (s) { return s.id === sid; })[0];
    return st ? st.press : "";
  }

  /* R-DEB-03~08 + R-STA-04:出示 */
  function present(state0, p) {
    var P3s = state0.belief.P3.status;
    if (P3s === "broken") return { state: state0, outcome: "already_broken" };
    if (P3s === "suspended") return { state: state0, outcome: "suspended_block" };
    var state = clone(state0);
    var P3 = state.belief.P3;
    var outcome;
    if (p.evidence === "E3" && p.subitem === "b" && p.target === "s2" && state.evidence.e3.b) {
      P3.statements.s2 = "broken";
      P3.status = "broken";
      outcome = "correct";
    } else if (p.evidence === "E3" && p.subitem === "a" && p.target === "s2" && state.evidence.e3.a && !state.evidence.e3.b) {
      P3.s2NeedFlag = true;
      outcome = "insufficient";
    } else {
      P3.persuasion -= 1;
      outcome = "wrong";
      if (P3.persuasion <= 0) { P3.persuasion = 0; P3.status = "suspended"; outcome = "suspended"; }
    }
    return { state: state, outcome: outcome };
  }

  /* R-STA-04 再入辯論:量表重置,證詞狀態保留 */
  function reenterDebate(state0) {
    if (state0.belief.P3.status !== "suspended") return { state: state0, error: "非中止狀態" };
    var state = clone(state0);
    state.belief.P3.persuasion = DEBATE.persuasion;
    state.belief.P3.status = "pending";
    return { state: state };
  }

  return {
    initialState: initialState,
    computeReadings: computeReadings,
    runExperiment: runExperiment,
    checkSelection: checkSelection,
    judge: judge,
    assertE3: assertE3,
    compareRuns: compareRuns,
    e3Established: e3Established,
    press: press,
    present: present,
    reenterDebate: reenterDebate,
    avgDeltas: avgDeltas,
    cumulative: cumulative,
    configKey: configKey,
    diffDims: diffDims,
    DIMS: DIMS,
    DIM_LABEL: DIM_LABEL,
    TOL: TOL
  };
});
