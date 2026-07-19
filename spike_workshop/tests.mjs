/* spike_workshop/tests.mjs — 切片門檻 #6:16 態矩陣確定性重播(node tests.mjs) */
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const S = require("./engine.js");

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log("  ✓ " + name); }
  catch (e) { fail++; console.error("  ✗ " + name + " — " + e.message); }
}
const eq = (a, b, msg) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(msg + ":" + JSON.stringify(a) + " ≠ " + JSON.stringify(b)); };

function build(release, timer, zero, scale) {
  let s = S.init();
  s = S.place(s, "groove", "groove").state;
  s = S.place(s, "release", release).state;
  s = S.place(s, "timer", timer).state;
  s = S.place(s, "gauge", "gauge").state;
  if (zero) s = S.calibrate(s, "zero").state;
  if (scale) s = S.calibrate(s, "scale").state;
  return s;
}

t("16 態全枚舉→4 profile,計數=blur8/systematic4/jitter3/clean1", () => {
  const count = { blur: 0, systematic: 0, jitter: 0, clean: 0 };
  for (const rel of ["latch", "hand"]) for (const tm of ["waterclock", "pulse"])
    for (const z of [false, true]) for (const sc of [false, true]) {
      const p = S.profileOf(build(rel, tm, z, sc));
      if (!(p in count)) throw new Error("未知 profile:" + p);
      count[p]++;
    }
  eq(count, { blur: 8, systematic: 4, jitter: 3, clean: 1 }, "profile 計數");
});

t("確定性重播:同狀態同輪次讀值恆等", () => {
  for (let i = 0; i < 2; i++) {
    let s = build("hand", "pulse", true, true);
    const a = S.run(s); const b = S.run(a.state); const c = S.run(b.state);
    eq(a.state.trials[0].readings, S.FIX.jitter[0], "trial1");
    eq(b.state.trials[1].readings, S.FIX.jitter[1], "trial2");
    eq(c.state.trials[2].readings, S.FIX.jitter[2], "trial3");
  }
});

t("裝配順序自由:兩種順序→同 profile 同讀值", () => {
  let a = S.init();
  a = S.place(a, "gauge", "gauge").state; a = S.place(a, "timer", "waterclock").state;
  a = S.place(a, "release", "latch").state; a = S.place(a, "groove", "groove").state;
  a = S.calibrate(a, "scale").state; a = S.calibrate(a, "zero").state;
  const b = build("latch", "waterclock", true, true);
  eq(S.profileOf(a), S.profileOf(b), "profile");
  eq(S.run(a).state.trials[0].readings, S.run(b).state.trials[0].readings, "讀值");
});

t("typed slot:錯槽必拒", () => {
  const r = S.place(S.init(), "release", "waterclock");
  if (!r.error) throw new Error("水鐘裝進釋放槽竟被接受");
});

t("未組完不得跑:空槽=不能開跑,不是爛數據", () => {
  const r = S.run(S.init());
  if (!r.error) throw new Error("未組完竟可執行");
});

t("診斷跟著裝置走:校標尺→blur 消失;校零點→systematic 消失", () => {
  let s = build("latch", "waterclock", false, false);
  eq(S.profileOf(s), "blur", "雙未校");
  s = S.calibrate(s, "scale").state;
  eq(S.profileOf(s), "systematic", "校標尺後");
  s = S.calibrate(s, "zero").state;
  eq(S.profileOf(s), "clean", "雙校後");
});

t("換零件重置對應校準:換計時器→零點歸未校", () => {
  let s = build("latch", "waterclock", true, true);
  s = S.place(s, "timer", "pulse").state;
  if (s.calibrated.zero) throw new Error("換計時器後零點竟仍算已校");
  eq(S.profileOf(s), "systematic", "換件後 profile");
});

t("blur 第四段=雙候選;其餘 profile 四段皆單值", () => {
  for (const p of ["clean", "systematic", "jitter"])
    S.FIX[p].forEach((row) => row.forEach((v) => { if (Array.isArray(v)) throw new Error(p + " 出現候選對"); }));
  S.FIX.blur.forEach((row) => {
    if (!Array.isArray(row[3]) || row[3].length !== 2) throw new Error("blur 第四段非雙候選");
  });
});

t("中性觀察:三次抖動→筆記只陳述不歸因", () => {
  let s = build("hand", "waterclock", true, true);
  s = S.run(s).state; s = S.run(s).state; s = S.run(s).state;
  const n = S.notes(s);
  if (!n.some((x) => x.indexOf("沒有聚在一起") >= 0)) throw new Error("缺散布觀察");
  n.forEach((x) => { if (/壞|故障|因為|問題出在/.test(x)) throw new Error("觀察出現歸因語:" + x); });
});

console.log(`\n${pass} 通過,${fail} 失敗(共 ${pass + fail})`);
process.exit(fail ? 1 : 0);
