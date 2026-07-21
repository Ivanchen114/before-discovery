/* src/engine2.js — 第二章彈射工坊引擎(規格 v0.1.1 🔒 R-WS2/R-LAB2 之忠實實作)。
   純函式、零 RNG、零 DOM;UMD 雙載體同 engine.js。
   讀值=確定性 fixture(教學代理,非 folio 116v 重建);profile 支配序=R-WS2-04 唯一壓縮規則。 */
(function (root) {
  "use strict";

  /* R-WS2-01 零件目錄(封閉) */
  var PARTS = {
    shortGroove:   { slot: "launcher", label: "短斜槽",       invalidates: [] },
    latchRelease:  { slot: "release",  label: "門閂釋放",     invalidates: ["releaseZero"] },
    handRelease:   { slot: "release",  label: "手放",         invalidates: ["releaseZero"], tag: "speedDrift" },
    polishedEdge:  { slot: "edge",     label: "打磨桌沿",     invalidates: [] },
    roughEdge:     { slot: "edge",     label: "毛邊桌沿",     invalidates: [], tag: "directionScatter" },
    rakedSand:     { slot: "rangeBed", label: "耙平沙盤",     invalidates: ["rangeScale"] },
    eyeBoard:      { slot: "rangeBed", label: "目測板",       invalidates: ["rangeScale"], tag: "coarseRead" },
    fineSandPlumb: { slot: "rangeBed", label: "細沙+鉛垂規",  invalidates: ["rangeScale"], scholar: true },
    liftSandbed:   { slot: "heightRig", label: "升降沙盤",    invalidates: [] }
  };
  var SLOTS = ["launcher", "release", "edge", "rangeBed", "heightRig"];
  /* CR-器材踏查：唯一必要件不是選擇題。舊存檔若仍為 null，也以固定件解讀。 */
  var FIXED_SLOTS = { launcher: "shortGroove", heightRig: "liftSandbed" };
  var CAL_DEP = { releaseZero: "release", rangeScale: "rangeBed" };
  var HS = [4, 9, 16, 25], ROOTS = [2, 3, 4];

  /* R-LAB2-02 fixture:列序 H=4/9/16/25;coarseRead 為 {lo,hi} 區間 */
  var FIXTURE = {
    clean: [
      [2.00, 3.02, 3.98, 5.01], [2.03, 2.98, 4.01, 4.99], [1.98, 3.01, 4.02, 5.00]],
    directionScatter: [
      [2.00, 3.50, 3.55, 5.55], [2.30, 2.65, 4.55, 4.50], [1.72, 3.35, 3.55, 5.55]],
    speedDrift: [
      [1.72, 2.85, 4.36, 5.85], [2.22, 2.64, 3.72, 5.65], [1.82, 3.39, 3.76, 5.70]],
    coarseRead: [
      [[1.6, 2.4], [2.5, 3.5], [3.4, 4.6], [4.3, 5.7]],
      [[1.5, 2.5], [2.4, 3.6], [3.5, 4.5], [4.4, 5.6]],
      [[1.7, 2.3], [2.6, 3.4], [3.3, 4.7], [4.2, 5.8]]]
  };

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function err(state0, code) { return { state: state0, error: code }; }

  function initialState() {
    return {
      slots: { launcher: "shortGroove", release: null, edge: null, rangeBed: null, heightRig: "liftSandbed" },
      revision: 0,
      calib: { releaseZero: false, rangeScale: false },
      series: [], seriesSeq: 0,
      days: 0,
      assemblyLog: [],
      evidence: { f2: { law: false, lawSource: null, lawConcept: null, ball: false } }
    };
  }

  function effectivePart(s, slot) { return s.slots[slot] || FIXED_SLOTS[slot] || null; }
  function assembled(s) { return SLOTS.every(function (k) { return !!effectivePart(s, k); }); }
  function openSeries(s) {
    for (var i = s.series.length - 1; i >= 0; i--) if (s.series[i].status === "open") return s.series[i];
    return null;
  }
  /* R-WS2-04 支配序(唯一壓縮規則) */
  function profileOf(s) {
    if (!assembled(s)) return "notRunnable";
    if (!s.calib.rangeScale || effectivePart(s, "rangeBed") === "eyeBoard") return "coarseRead";
    if (effectivePart(s, "edge") === "roughEdge") return "directionScatter";
    if (!s.calib.releaseZero || effectivePart(s, "release") === "handRelease") return "speedDrift";
    return "clean";
  }
  function fingerprint(s) {
    return SLOTS.map(function (k) { return effectivePart(s, k); }).join("|") +
      "#z" + (s.calib.releaseZero ? 1 : 0) + "s" + (s.calib.rangeScale ? 1 : 0);
  }

  function place(state0, slot, part) {
    var p = PARTS[part];
    if (SLOTS.indexOf(slot) < 0) return err(state0, "unknown-slot");
    if (FIXED_SLOTS[slot]) return err(state0, "fixed-slot");
    if (!p) return err(state0, "unknown-part");
    if (p.slot !== slot) return err(state0, "wrong-slot");
    if (state0.slots[slot]) return err(state0, "slot-occupied");
    var s = clone(state0);
    s.slots[slot] = part; s.revision += 1;
    s.assemblyLog.push({ t: "place", slot: slot, part: part, rev: s.revision });
    return { state: s };
  }
  function replacePart(state0, slot, part) {
    var p = PARTS[part];
    if (SLOTS.indexOf(slot) < 0) return err(state0, "unknown-slot");
    if (FIXED_SLOTS[slot]) return err(state0, "fixed-slot");
    if (!p || p.slot !== slot) return err(state0, !p ? "unknown-part" : "wrong-slot");
    if (!state0.slots[slot]) return err(state0, "slot-empty");
    if (openSeries(state0)) return err(state0, "series-open"); /* 未完成 series 須先明確放棄 */
    var s = clone(state0);
    s.slots[slot] = part; s.revision += 1;
    (p.invalidates || []).forEach(function (k) { s.calib[k] = false; });
    /* 同槽舊件的失效義務相同(依賴槽決定),上行已覆蓋 */
    s.assemblyLog.push({ t: "replace", slot: slot, part: part, rev: s.revision });
    return { state: s };
  }
  function calibrate(state0, kind) {
    if (!(kind in CAL_DEP)) return err(state0, "unknown-calibration");
    if (!state0.slots[CAL_DEP[kind]]) return err(state0, "dependency-missing");
    if (state0.calib[kind]) return { state: state0, noop: true }; /* 同 revision 有效=no-op 不耗天 */
    var s = clone(state0);
    s.calib[kind] = true; s.days += 1;
    s.assemblyLog.push({ t: "calibrate", kind: kind, rev: s.revision, day: s.days });
    return { state: s };
  }
  function abandonSeries(state0) {
    var o = openSeries(state0);
    if (!o) return err(state0, "no-open-series");
    var s = clone(state0);
    for (var i = 0; i < s.series.length; i++) if (s.series[i].id === o.id) s.series[i].status = "abandoned";
    return { state: s };
  }
  function beginSeries(state0, ball) {
    if (ball !== "copper" && ball !== "wood") return err(state0, "unknown-ball");
    if (!assembled(state0)) return err(state0, "not-assembled");
    if (openSeries(state0)) return err(state0, "series-open");
    var s = clone(state0);
    var fp = fingerprint(s);
    var done = s.series.filter(function (x) {
      return x.status === "complete" && x.fingerprint === fp && x.ball === ball;
    }).length;
    s.seriesSeq += 1;
    s.series.push({
      id: s.seriesSeq, status: "open", apparatusRevision: s.revision,
      fingerprint: fp, ball: ball, profile: profileOf(s), cycle: done % 3,
      readings: {}, prediction: null,
      kHat: null, shapeError: null, predictionError: null, accepted: false,
      dayStarted: s.days, dayEnded: null
    });
    return { state: s, seriesId: s.seriesSeq };
  }
  function nextH(sr) {
    for (var i = 0; i < HS.length; i++) if (!(HS[i] in sr.readings)) return HS[i];
    return null;
  }
  /* R-LAB2-03 唯一判定公式(對完整單值 series) */
  function judgeRaw(readings, prediction) {
    var vals = [readings[4], readings[9], readings[16], readings[25]];
    for (var i = 0; i < 4; i++)
      if (typeof vals[i] !== "number" || !isFinite(vals[i])) return { error: "non-scalar" };
    if (typeof prediction !== "number" || !isFinite(prediction)) return { error: "bad-prediction" };
    var ks = [readings[4] / 2, readings[9] / 3, readings[16] / 4];
    var kHat = (ks[0] + ks[1] + ks[2]) / 3;
    var shape = 0;
    [readings[4], readings[9], readings[16]].forEach(function (r, i) {
      var ideal = kHat * ROOTS[i];
      var e = Math.abs(r - ideal) / ideal;
      if (e > shape) shape = e;
    });
    var pErr = Math.abs(prediction - readings[25]) / readings[25];
    return { kHat: kHat, shapeError: shape, predictionError: pErr,
      accepted: shape <= 0.12 && pErr <= 0.12 };
  }
  function runHeight(state0, H) {
    var o = openSeries(state0);
    if (!o) return err(state0, "no-open-series");
    var expect = nextH(o);
    if (H !== expect) return err(state0, "wrong-order"); /* 不耗天 */
    if (H === 25 && (typeof o.prediction !== "number" || !isFinite(o.prediction)))
      return err(state0, "prediction-required");
    var s = clone(state0);
    var sr = openSeries(s);
    var idx = HS.indexOf(H);
    sr.readings[H] = clone(FIXTURE[sr.profile][sr.cycle][idx]);
    s.days += 1;
    if (H === 25) {
      sr.status = "complete"; sr.dayEnded = s.days;
      var j = judgeRaw(sr.readings, sr.prediction);
      if (j.error) { sr.accepted = false; sr.rejectReason = j.error; }
      else {
        sr.kHat = j.kHat; sr.shapeError = j.shapeError; sr.predictionError = j.predictionError;
        sr.accepted = j.accepted;
      }
    }
    return { state: s, series: clone(sr) };
  }
  function predict(state0, value) {
    var o = openSeries(state0);
    if (!o) return err(state0, "no-open-series");
    if (!(4 in o.readings) || !(9 in o.readings) || !(16 in o.readings)) return err(state0, "too-early");
    if (25 in o.readings) return err(state0, "already-run");
    if (typeof value !== "number" || !isFinite(value)) return err(state0, "bad-prediction");
    var s = clone(state0);
    openSeries(s).prediction = value;
    return { state: s };
  }
  /* CH2-CR-005/R-LAB2-04：資料通過只代表「可引用」，不替玩家形成斷言。
     玩家必須親自選一組完整銅球紀錄，再選它支持的概念。 */
  function assertLaw(state0, seriesId, conceptId) {
    var concepts = { sqrtScale: 1, linearScale: 1, constantRange: 1 };
    if (!concepts[conceptId]) return err(state0, "unknown-law-concept");
    if (state0.evidence && state0.evidence.f2 && state0.evidence.f2.law)
      return { state: state0, ok: true, noop: true };
    var sr = null;
    (state0.series || []).forEach(function (x) { if (x.id === seriesId) sr = x; });
    if (!sr) return err(state0, "series-not-found");
    if (sr.status !== "complete") return err(state0, "series-not-complete");
    if (!sr.accepted) return err(state0, "series-not-accepted");
    if (sr.ball !== "copper") return err(state0, "law-source-ball");
    if (conceptId !== "sqrtScale")
      return { state: state0, ok: false, reason: "concept-mismatch", seriesId: seriesId, conceptId: conceptId };
    var s = clone(state0);
    s.evidence.f2.law = true;
    s.evidence.f2.lawSource = seriesId;
    s.evidence.f2.lawConcept = conceptId;
    return { state: s, ok: true, seriesId: seriesId, conceptId: conceptId };
  }
  /* R-LAB2-05 換球比較五守衛 */
  function compareBalls(state0, idA, idB) {
    var a = null, b = null;
    state0.series.forEach(function (x) { if (x.id === idA) a = x; if (x.id === idB) b = x; });
    if (!a || !b) return err(state0, "series-not-found");
    var diffs = [];
    if (!((a.ball === "copper" && b.ball === "wood") || (a.ball === "wood" && b.ball === "copper")))
      diffs.push("球種須一銅一木");
    if (a.fingerprint !== b.fingerprint) diffs.push("裝置指紋(零件/校準)不同");
    if (a.status !== "complete" || b.status !== "complete") diffs.push("series 未完成");
    var scalar = function (x) { return [4, 9, 16].every(function (h) { return typeof x.readings[h] === "number"; }); };
    if (!scalar(a) || !scalar(b)) diffs.push("含區間讀值");
    else {
      if (!(a.shapeError <= 0.12) || !(b.shapeError <= 0.12)) diffs.push("形狀誤差超限");
      var maxRel = 0;
      [4, 9, 16].forEach(function (h) {
        var m = (a.readings[h] + b.readings[h]) / 2;
        var rel = Math.abs(a.readings[h] - b.readings[h]) / m;
        if (rel > maxRel) maxRel = rel;
      });
      if (maxRel > 0.03) diffs.push("兩球讀值差超過 3%");
    }
    if (diffs.length) return { state: state0, ok: false, diffs: diffs }; /* 不寫 F2b、不耗天 */
    var s = clone(state0);
    s.evidence.f2.ball = true;
    return { state: s, ok: true, diffs: [] };
  }

  var api = {
    initialState: initialState, place: place, replacePart: replacePart,
    calibrate: calibrate, beginSeries: beginSeries, runHeight: runHeight,
    predict: predict, assertLaw: assertLaw, abandonSeries: abandonSeries, compareBalls: compareBalls,
    profileOf: profileOf, fingerprint: fingerprint,
    _judgeRaw: judgeRaw, _FIXTURE: FIXTURE, _PARTS: PARTS, _SLOTS: SLOTS, _FIXED_SLOTS: FIXED_SLOTS
  };
  if (typeof module === "object" && module.exports) { module.exports = api; }
  else { root.GB = root.GB || {}; root.GB.Engine2 = api; }
})(typeof self !== "undefined" ? self : this);
