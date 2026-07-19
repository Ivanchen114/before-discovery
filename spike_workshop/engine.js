/* spike_workshop/engine.js — 工坊研究切片・純引擎(可丟棄;SPIKE 命名空間,非 GB,不構成相容承諾)
   法源:總監裁決 20260720(A 案)+ Sol 討論 20260720 硬邊界:
   4 typed slots(槽體/釋放/計時/標尺),釋放與計時各 2 替代件,2 校準項正偏二態
   → 16 組裝狀態,確定性映射 4 apparatusProfile;fixture 只讀 profile,零 RNG。
   映射規則(支配序):標尺未校→blur(尾段模糊/混合);計時零點未校→systematic;
   雙校但手放或脈搏→jitter;門閂+水鐘+雙校→clean。
   計數:blur 8/systematic 4/jitter 3/clean 1(測試把關)。 */
(function (root) {
  "use strict";

  var SLOTS = ["groove", "release", "timer", "gauge"];
  var PARTS = {
    groove: { slot: "groove", label: "刨直木槽" },
    latch: { slot: "release", label: "重錘門閂(釋放穩)" },
    hand: { slot: "release", label: "手指放球(釋放看手感)" },
    waterclock: { slot: "timer", label: "水鐘(滴速穩)" },
    pulse: { slot: "timer", label: "脈搏計時(跳動看心情)" },
    gauge: { slot: "gauge", label: "刻度標尺" }
  };
  var REFERENCE = [12, 36, 60, 84]; /* 參考形狀(乾淨裝置的期望增量,格) */

  /* 確定性讀值表:profile × 試驗輪替(3)× 四段增量;blur 第四段=兩個都說得通的候選 */
  var FIX = {
    clean: [[12.1, 36.2, 60.1, 84.3], [12.3, 35.9, 60.4, 84.0], [11.9, 36.4, 59.8, 84.5]],
    systematic: [[19.1, 43.2, 67.1, 91.3], [19.3, 42.9, 67.4, 91.0], [18.9, 43.4, 66.8, 91.5]],
    jitter: [[15.8, 31.2, 66.0, 79.5], [8.9, 40.7, 55.2, 90.1], [13.5, 33.0, 63.8, 81.2]],
    blur: [[12.2, 36.1, 60.2, [80.9, 90.6]], [12.0, 36.3, 59.9, [81.4, 91.1]], [12.4, 35.8, 60.3, [80.5, 90.2]]]
  };

  function init() {
    return {
      slots: { groove: null, release: null, timer: null, gauge: null },
      calibrated: { zero: false, scale: false },
      order: [],   /* 裝配順序自由,只記錄不評分 */
      trials: []
    };
  }
  function clone(s) { return JSON.parse(JSON.stringify(s)); }

  function place(state, slotId, partId) {
    var p = PARTS[partId];
    if (!p) return { error: "沒有這個零件:" + partId };
    if (SLOTS.indexOf(slotId) < 0) return { error: "沒有這個槽位:" + slotId };
    if (p.slot !== slotId) return { error: "typed slot:「" + p.label + "」裝不進「" + slotId + "」" };
    var s = clone(state);
    s.slots[slotId] = partId;
    s.order.push(partId);
    if (slotId === "timer") s.calibrated.zero = false;   /* 換計時器=零點重新歸未校 */
    if (slotId === "gauge") s.calibrated.scale = false;
    return { state: s };
  }

  function calibrate(state, item) {
    if (item !== "zero" && item !== "scale") return { error: "沒有這個校準項:" + item };
    if (item === "zero" && !state.slots.timer) return { error: "先裝計時器,才有零點可校" };
    if (item === "scale" && !state.slots.gauge) return { error: "先裝標尺,才有刻度可對" };
    var s = clone(state);
    var before = item === "zero" ? 7.0 : 6.9; /* 標準件對照顯示的偏差量(ghost 用) */
    s.calibrated[item] = true;
    return { state: s, ghost: { item: item, offsetBefore: before, offsetAfter: 0.2 } };
  }

  function assembled(state) {
    return SLOTS.every(function (k) { return !!state.slots[k]; });
  }

  function profileOf(state) {
    if (!assembled(state)) return null;
    if (!state.calibrated.scale) return "blur";
    if (!state.calibrated.zero) return "systematic";
    if (state.slots.release === "hand" || state.slots.timer === "pulse") return "jitter";
    return "clean";
  }

  function run(state) {
    if (!assembled(state)) return { error: "裝置未完成——空槽就是空槽,不會偷偷跑出爛數據" };
    var s = clone(state);
    var prof = profileOf(s);
    var idx = s.trials.length;
    s.trials.push({ n: idx + 1, profile: prof, readings: clone({ r: FIX[prof][idx % 3] }).r });
    return { state: s, profile: prof };
  }

  /* 中性觀察(第二層載體):只陳述可觀察特徵,不歸因、不判決(憲章一) */
  function notes(state) {
    var out = [];
    var t = state.trials;
    var last = t.slice(-3);
    if (last.length >= 2 && last.every(function (x) { return x.profile === "systematic"; }))
      out.push("最近幾次讀值都比參考多出約七格,方向相同。");
    if (last.length >= 3 && last.every(function (x) { return x.profile === "jitter"; }))
      out.push("同一套裝置做了三次,讀值沒有聚在一起。");
    if (t.length && t[t.length - 1].profile === "blur")
      out.push("最後一段的終點,兩個讀值都說得通。");
    if (t.length >= 2 && t[t.length - 1].profile === "clean" && t[t.length - 2].profile !== "clean")
      out.push("這一次,讀值貼著參考形狀走了。");
    return out;
  }

  var api = { SLOTS: SLOTS, PARTS: PARTS, REFERENCE: REFERENCE, FIX: FIX,
              init: init, place: place, calibrate: calibrate,
              assembled: assembled, profileOf: profileOf, run: run, notes: notes };
  if (typeof module === "object" && module.exports) { module.exports = api; }
  else { root.SPIKE = api; }
})(typeof self !== "undefined" ? self : this);
