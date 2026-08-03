/* src/sanitize.js — 書信碼匯入淨化(Sol 巡查 A-1)。雙載體:module.exports+root.GB.Sanitize。
   職責:對「跨機貼入」的 state 做深層白名單檢查——通過=原樣放行,違規=整包拒絕(不修補、不覆蓋本機存檔)。
   防線分工:本檔擋結構/型別/enum/長度/原型污染;chapter-ui 的 DOM-safe 渲染擋殘餘字串(雙層防禦)。
   引擎與 loadSave 零改動(R-SAV-02 四分類不變;本檢查是其後的第五道匯入閘,僅 btnImport 路徑)。 */
(function (root) {
  "use strict";
  var BAD_KEYS = ["__proto__", "constructor", "prototype"]; /* 陣列而非字面量:字面量的 __proto__ 不會成為自有鍵 */
  /* transcript 的章別白名單明確允許 3000 筆；通用深掃不得先用較小上限誤殺合法長局。
     各高風險清單(runs/claims/series)仍在章別 sanitizer 內維持 100/300 筆的窄限。 */
  var LIMITS = { maxNodes: 20000, maxStr: 4000, maxArr: 3000, maxKey: 64, maxDepth: 12 };

  function fail(reason) { return { ok: false, reason: reason }; }

  /* 通用深掃:僅容 plain object/array/string/finite number/boolean/null;鍵與長度受限 */
  function scrub(v, depth, budget) {
    if (depth > LIMITS.maxDepth) return "存檔資料層級過深";
    if (budget.n-- <= 0) return "存檔資料項目過多";
    var t = typeof v;
    if (v === null || t === "boolean") return null;
    if (t === "number") return isFinite(v) ? null : "存檔含無法辨識的數值";
    if (t === "string") return v.length <= LIMITS.maxStr ? null : "存檔文字過長";
    if (Array.isArray(v)) {
      if (v.length > LIMITS.maxArr) return "存檔清單過長";
      for (var i = 0; i < v.length; i++) {
        var r = scrub(v[i], depth + 1, budget);
        if (r) return r;
      }
      return null;
    }
    if (t === "object") {
      var keys = Object.keys(v);
      for (var j = 0; j < keys.length; j++) {
        var k = keys[j];
        if (BAD_KEYS.indexOf(k) >= 0) return "存檔含不允許的欄位";
        if (k.length > LIMITS.maxKey) return "存檔欄位名稱過長";
        var r2 = scrub(v[k], depth + 1, budget);
        if (r2) return r2;
      }
      return null;
    }
    return "存檔含無法辨識的資料型態";
  }

  function isInt(x) { return typeof x === "number" && isFinite(x) && Math.floor(x) === x; }
  function ch3Close(a, b, tolerance) {
    return typeof a === "number" && isFinite(a) &&
      typeof b === "number" && isFinite(b) &&
      Math.abs(a - b) <= tolerance;
  }
  function ch3CabinRowConsistent(row) {
    if (!row || ["dock", "steady"].indexOf(row.stage) < 0 ||
        ["drip", "toss", "combined"].indexOf(row.instrument) < 0 ||
        !Array.isArray(row.shoreGaps) || row.shoreGaps.length !== 3 ||
        row.shoreGaps.some(function (gap) {
          return typeof gap !== "number" || !isFinite(gap);
        }))
      return false;
    var observationMatches = row.instrument === "drip"
      ? row.water === "水滴落在碗內標記附近" && row.ball === "本輪未使用石球"
      : (row.instrument === "toss"
        ? row.water === "本輪未使用滴水壺" && row.ball === "石球直上拋起後落回手邊附近"
        : row.water === "水面沒有固定偏向" && row.ball === "小球落在放手點正下方");
    if (!observationMatches) return false;
    if (row.stage === "dock") {
      return row.classification === "岸標位置不變" &&
        row.shoreGaps.every(function (gap) { return Math.abs(gap) <= 0.05; });
    }
    var maxGap = Math.max.apply(null, row.shoreGaps);
    var minGap = Math.min.apply(null, row.shoreGaps);
    var meanGap = row.shoreGaps.reduce(function (sum, gap) { return sum + gap; }, 0) /
      row.shoreGaps.length;
    return row.classification === "岸標間距近乎相同" &&
      meanGap > 0.5 && maxGap - minGap <= 0.08;
  }
  function ch3PaperReadingError(paper) {
    return paper && typeof paper.readingError === "number" && isFinite(paper.readingError)
      ? Math.max(0, Math.abs(paper.readingError)) : 0;
  }
  function ch3DualPaperData(record) {
    var shore = record && record.papers && record.papers.shore;
    var ship = record && record.papers && record.papers.ship;
    var shoreBeats = shore && Array.isArray(shore.beats) ? shore.beats : [];
    var shipBeats = ship && Array.isArray(ship.beats) ? ship.beats : [];
    if (!shore || !ship || shoreBeats.length < 2 || shoreBeats.length !== shipBeats.length)
      return { ok: false, reason: "dual-paper-missing" };
    var tolerance = Math.max(
      0.006,
      Math.max(ch3PaperReadingError(shore), ch3PaperReadingError(ship)) * 2.6
    );
    var transformedPoints = [];
    for (var i = 0; i < shoreBeats.length; i++) {
      var shorePoint = shoreBeats[i], shipPoint = shipBeats[i];
      if (!shorePoint || !shipPoint ||
          shorePoint.beat !== shipPoint.beat ||
          !ch3Close(shorePoint.t, shipPoint.t, 0.002) ||
          !ch3Close(shorePoint.y, shipPoint.y, 0.002) ||
          !ch3Close(shipPoint.mastX, 0, 0.002))
        return { ok: false, reason: "beats-mismatch" };
      var shoreRelativeX = shorePoint.stoneX - shorePoint.mastX;
      var shipX = shipPoint.stoneX;
      var residual = shoreRelativeX - shipX;
      if (!ch3Close(shoreRelativeX, shipX, tolerance))
        return { ok: false, reason: "paper-transform-mismatch" };
      transformedPoints.push({
        beat: shorePoint.beat,
        t: shorePoint.t,
        y: shorePoint.y,
        shoreRelativeX: shoreRelativeX,
        shipX: shipX,
        residual: residual
      });
    }
    var p3Eligible = record && record.filed !== false &&
      record.stage === "steady" && record.classification === "近似穩速" &&
      record.release === "latch" && record.speedRecord === "beats" &&
      (record.beatBand == null || record.beatBand === "mid") &&
      record.positionRecord === "dual" &&
      record.sameStone !== false && record.sameHeight !== false &&
      shoreBeats.length >= 4;
    return {
      ok: true,
      p3Eligible: !!p3Eligible,
      tolerance: tolerance,
      transformedPoints: transformedPoints,
      maxResidual: Math.max.apply(null, transformedPoints.map(function (point) {
        return Math.abs(point.residual);
      }))
    };
  }
  function ch3AnimationConsistent(animation) {
    if (!animation || !Array.isArray(animation.path)) return false;
    return animation.path.every(function (point) {
      return point && ch3Close(point.relativeX, point.stoneX - point.mastX, 0.003);
    });
  }
  function ch3TransformedPointsConsistent(p3, dualData) {
    var saved = p3 && p3.transformedPoints;
    if (saved == null) return true; /* 舊存檔尚未保存逐拍衍生表，仍可沿用原紙重建。 */
    if (!dualData || !dualData.ok || !dualData.p3Eligible ||
        !Array.isArray(saved) || saved.length > dualData.transformedPoints.length ||
        (p3.transformed && saved.length !== dualData.transformedPoints.length))
      return false;
    for (var i = 0; i < saved.length; i++) {
      var actual = saved[i], expected = dualData.transformedPoints[i];
      if (!actual || actual.beat !== expected.beat ||
          !ch3Close(actual.t, expected.t, 0.002) ||
          !ch3Close(actual.y, expected.y, 0.002) ||
          !ch3Close(actual.shoreRelativeX, expected.shoreRelativeX, 0.003) ||
          !ch3Close(actual.shipX, expected.shipX, 0.003) ||
          !ch3Close(actual.residual, actual.shoreRelativeX - actual.shipX, 0.003) ||
          !ch3Close(actual.residual, expected.residual, 0.003))
        return false;
    }
    if (p3.transformTolerance != null &&
        !ch3Close(p3.transformTolerance, dualData.tolerance, 0.002))
      return false;
    if (p3.maxResidual != null &&
        !ch3Close(p3.maxResidual, dualData.maxResidual, 0.002))
      return false;
    return true;
  }
  function ch3ResetP3Derived(lab, cf, dossier, keepAlignment) {
    var p3 = dossier.debate.p3;
    if (!keepAlignment) {
      p3.source = null;
      p3.sourceRecordId = null;
      p3.question = false;
      p3.concept = false;
      p3.aligned = false;
      dossier.assertions.A4 = false;
      if (lab.overlay) {
        lab.overlay.aligned = false;
        lab.overlay.preview = "initial";
      }
    }
    p3.transformed = false;
    p3.transformMode = null;
    p3.transformedPoints = [];
    delete p3.transformTolerance;
    delete p3.maxResidual;
    dossier.assertions.A5 = false;
    dossier.debate.pillars.p3 = false;
    dossier.debate.boundary = null;
    dossier.complete = false;
    if (dossier.debate.active) dossier.debate.current = "p3";
    else dossier.debate.current = null;
    cf.transformProgress = 0;
    if (lab.overlay) {
      lab.overlay.transformed = false;
      if (keepAlignment) lab.overlay.preview = "sameBeats";
    }
    if (lab.evidence) {
      lab.evidence.g4 = false;
      lab.evidence.g5 = false;
    }
    if (lab.audit) lab.audit.boundary = false;
    if (lab.publicDemo) lab.publicDemo.complete = false;
  }

  /*
   * 信譽生命週期只守本系統保留欄位；未知舊 flags／event 仍交由各章既有
   * 相容層處理。這裡不替存檔「補故事」，只拒絕不可能由 runtime 原子動作
   * 產生的鎖定、修復游標與本輪首次旗標。
   */
  function sanitizeReputationLifecycle(state, scenes, chapterId) {
    var flags = state && state.flags;
    var events = state && state.eventLog;
    if (!flags || typeof flags !== "object" || Array.isArray(flags))
      return fail("信譽旗標格式錯誤");
    if (!Array.isArray(events) || events.length > 3000)
      return fail("信譽事件紀錄格式錯誤");
    /*
     * 現行事件的理由是玩家可見契約；少數在 GB-ADR-030 前已能寫入
     * 存檔的來源允許舊紀錄沒有 reason，但只要有 reason 仍須逐字吻合。
     * 新來源一律不接受「拿掉 reason 就假裝成舊存檔」。
     */
    var reasonRules = {
      ch1: {
        /*
         * 兩筆 2026-07-29 前已寫入的答題獎勵不再由現行 runtime 產生，
         * 但舊存檔仍可憑原本的玩家選擇鏈證明它們不是憑空加分。
         */
        "P0-1/nb2": {
          expectedDelta: 1, legacyOptional: true,
          requiresBefore: [{ t:"choice", at:"P0-1/q1", pick:"b" }],
          values: []
        },
        "INT-1/nb2": {
          expectedDelta: 1, legacyOptional: true,
          requiresBefore: [{ t:"choice", at:"INT-1/q1", pick:"b" }],
          values: []
        },
        "P0-2/nA4": {
          expectedDelta: -1, legacyOptional: true,
          requiresBefore: [{ t:"choice", at:"P0-2/q1", pick:"a" }],
          values: [
          "把沒有證據的未來答案說成大家都知道的事"
        ] },
        "P0-2/nB3": {
          expectedDelta: 1, legacyOptional: true,
          requiresBefore: [
            { t:"choice", at:"P0-2/q1", pick:"b" },
            { t:"choice", at:"P0-2/qB", pick:"b1" }
          ],
          values: [
          "同意讓斷言接受證據檢查，也把同一規矩用在同行身上"
        ] },
        "SC-R1/n3": {
          expectedDelta: 1, legacyOptional: true, requiresRepairCycle: true,
          requiresBefore: [{ t:"embedDone", at:"SC-R1/e1" }],
          values: [
          "用一筆新紀錄修復合作資格"
        ] },
        /* 舊常數 sourceId 只供既有存檔；現行 runtime 使用選項級 ID。 */
        "debate.pressChoice": { expectedDelta: -1, legacyOptional: true, values: [
          "拿未來物理學的名聲替代現場可查的證據"
        ] },
        "debate.pressChoice.a": { expectedDelta: -1, values: [
          "拿未來物理學的名聲替代現場可查的證據"
        ] },
        "debate.trap": { expectedDelta: -1, legacyOptional: true, values: [
          "聲稱量過垂直落下，卻拿不出任何原始紀錄"
        ] },
        "debate.trap.lied": { expectedDelta: -1, values: [
          "聲稱量過垂直落下，卻拿不出任何原始紀錄"
        ] }
      },
      ch2: {
        "B0-2/q1.a": {
          expectedDelta: -1,
          legacyOptionalWithoutEvent: {
            t:"flag", k:"ch2BallisticsScopeBlurted",
            v:"1", at:"B0-2/q1.a"
          },
          legacyOptionalWithEvent: {
            t:"flag", k:"ch2BallisticsScopeBlurted",
            v:"1", at:"B0-2/q1.a",
            migratedFrom:"ch2-v1-reasonless"
          },
          requiresBefore: [{ t:"choice", at:"B0-2/q1", pick:"a" }],
          values: [
          "尚未檢查砲術圖就宣稱舊規律一定管得到飛行"
        ] },
        "B0-2/s1": {
          expectedDelta: 1, legacyOptional: true,
          requiresBefore: [{ t:"choice", at:"B0-2/q1", pick:"b" }],
          values: [
          "先讀對手的圖，也保留它真正能支持的範圍"
        ] },
        "B2-4/q4.b": {
          expectedDelta: -1,
          requiresBefore: [{ t:"choice", at:"B2-4/q4", pick:"b" }],
          values: [
          "三列都只記下兩聲分不開，仍把沒有測得的延遲寫成結果"
        ] },
        "B2-5/q2.b": {
          expectedDelta: -1,
          requiresBefore: [{ t:"choice", at:"B2-5/q2", pick:"b" }],
          values: [
          "把尚未出航的船桅預測寫成已由桌上實驗完成"
        ] },
        "B2-5/q2.c": {
          expectedDelta: -1,
          requiresBefore: [{ t:"choice", at:"B2-5/q2", pick:"c" }],
          values: [
          "把尚未出航的船桅預測寫成已由桌上實驗完成"
        ] },
        "SC-R1/n3": {
          expectedDelta: 1, legacyOptional: true, requiresRepairCycle: true,
          requiresBefore: [{ t:"embedDone", at:"SC-R1/e1" }],
          values: [
          "用一筆新紀錄修復合作資格"
        ] },
        "debate.fr2.over": { expectedDelta: -1, legacyOptional: true, values: [
          "把低速短程的桌上結果擴張到已顯示不同軌跡的遠砲"
        ] },
        "debate.fr2.sky": { expectedDelta: -1, legacyOptional: true, values: [
          "把未測的高空與星辰寫成已由桌上實驗證明"
        ] }
      },
      ch3: {
        "C0-3/c1.all": { expectedDelta: -1, values: [
          "把還沒有原紙支持的答案當成事實"
        ] },
        "C0-3/c1.bounded": {
          expectedDelta: 1,
          requiresBefore: [{ t:"choice", at:"C0-3/c1", pick:"bounded" }],
          values: [
          "主動把斷言收回到原紙能支持的範圍"
        ] },
        "SC3-R1/c1.withdraw": {
          expectedDelta: 1, requiresRepairCycle: true,
          requiresBefore: [{ t:"choice", at:"SC3-R1/c1", pick:"withdraw" }],
          values: [
          "主動撤回越過原紙的斷言，重新標明資料邊界"
        ] },
        "ship3.setDossierFinalBoundary": {
          expectedDelta: -1, legacyOptional: true, values: [
          "把沒有量到的地球運動說成已經證明",
          "把船艙對照擴大到沒有測過的變速船況"
        ] },
        /* 舊公開演示終局的 action 名稱，僅供 schema 1 既有存檔。 */
        "ship3.setBoundary": { expectedDelta: -1, legacyOptional: true, values: [
        ] }
      },
      ch4: {
        "D0-2/n12b": {
          expectedDelta: -1,
          requiresBefore: [{ t:"choice", at:"D0-2/c0", pick:"future-answer" }],
          values: [
          "說出了結論，卻拿不出能把蘋果接到月亮的證據"
        ] },
        "D0-2/n12d": {
          expectedDelta: 1,
          requiresBefore: [{ t:"choice", at:"D0-2/c0", pick:"evidence-boundary" }],
          values: [
          "把做過的船上紀錄，和還沒有證據的月亮問題分開"
        ] },
        "orbit4.setHookeScope": { expectedDelta: -1, values: [
          "把虎克的一封信擴張成整套證明，超過來源能支持的範圍",
          "把虎克已留下的問題方向從來源線抹去"
        ] },
        "orbit4.removeTravelerFromAuthorField": {
          expectedDelta: 1,
          linkedAfter: [{
            match: { t:"lab", action:"removeTravelerFromAuthorField" },
            eventField: "sequence",
            statePath: ["lab","proof","authorField","removedAt"],
            adjacent: true,
            unique: true
          }],
          requiresState: [
            { path:["lab","proof","authorField","travelerRemoved"], equals:true },
            { path:["lab","proof","authorField","removedAt"], type:"integer", min:1 }
          ],
          values: [
          "主動退出沒有完成之作品的作者欄，沒有把參與操作冒充成作者身分"
        ] },
        "orbit4.setProofBoundary": { expectedDelta: -1, values: [
          "把這批資料沒有量到的作用機制寫成已經證明",
          "把多人留下的概念、觀測與出版來源改寫成牛頓一人完成"
        ] },
        "SC4-R1/c1.withdraw": {
          expectedDelta: 1, requiresRepairCycle: true,
          requiresBefore: [{ t:"choice", at:"SC4-R1/c1", pick:"withdraw" }],
          values: [
          "主動撤回越過來源的署名與機制結論，恢復可查的邊界"
        ] }
      },
      ch5: {
        "E1-1/q1.ledger": {
          expectedDelta: 1,
          requiresBefore: [{ t:"choice", at:"E1-1/q1", pick:"ledger" }],
          values: [
          "先把兩本帳各自改寫成可驗的問題，沒有先替任何一邊宣布勝負"
        ] },
        "E1-1/q1.authority": { expectedDelta: -1, values: [
          "拿前輩的名聲替代可驗資料"
        ] },
        "E3-2/j4": {
          expectedDelta: 1,
          /*
           * J4 在最後反撲由玩家完成重寫時先成立；E3-2 只負責公開承認。
           * 因此來源鏈須從三份工作台證據、三柱擊破一路接到勝辯，不能
           * 只靠一組自報的 won/J4 尾段狀態。
           */
          requiresBefore: [
            { t:"evidence", id:"J1", at:"collision5" },
            { t:"evidence", id:"J2", at:"collision5" },
            { t:"evidence", id:"J3", at:"collision5" },
            { t:"debateInit" },
            { t:"pillarBroken", pid:"P2" },
            { t:"pillarBroken", pid:"P1" },
            { t:"pillarBroken", pid:"P3" },
            { t:"evidence", id:"J4", at:"debate.fr5" },
            { t:"debateWon" }
          ],
          requiresState: [
            { path:["evidence","J1"], equals:true },
            { path:["evidence","J2"], equals:true },
            { path:["evidence","J3"], equals:true },
            { path:["evidence","J4"], equals:true },
            { path:["lab","evidence","j1"], equals:true },
            { path:["lab","evidence","j2"], equals:true },
            { path:["lab","evidence","j3"], equals:true },
            { path:["debate","idx"], equals:3 },
            { path:["debate","pillars","P2","broken"], equals:true },
            { path:["debate","pillars","P1","broken"], equals:true },
            { path:["debate","pillars","P3","broken"], equals:true },
            { path:["debate","fr","opened"], equals:true },
            { path:["debate","status"], equals:"won" },
            { path:["debate","fr","resolved"], equals:true }
          ],
          uniqueEvents: [
            { t:"evidence", id:"J1", at:"collision5" },
            { t:"evidence", id:"J2", at:"collision5" },
            { t:"evidence", id:"J3", at:"collision5" },
            { t:"debateInit" },
            { t:"pillarBroken", pid:"P2" },
            { t:"pillarBroken", pid:"P1" },
            { t:"pillarBroken", pid:"P3" },
            { t:"evidence", id:"J4", at:"debate.fr5" },
            { t:"debateWon" }
          ],
          values: [
          "承認兩本帳記的是不同事情，也保留尚未對平的去向"
        ] },
        "debate.fr5.step.vanished": {
          expectedDelta: -1, legacyOptional: true, values: [
          "看見黏土坑仍宣稱短少完全消失，抹去不利的可量痕跡"
        ] },
        "debate.fr5.step.in-momentum": {
          expectedDelta: -1, legacyOptional: true, values: [
          "動量帳沒有多出一截，仍宣稱已在其中找到短少的去向"
        ] },
        "debate.fr5.momentum-only": {
          expectedDelta: -1, legacyOptional: true, values: [
          "把活力帳的短少直接當成無效，抹去黏土坑留下的可量痕跡"
        ] },
        "debate.fr5.vis-viva-only": {
          expectedDelta: -1, legacyOptional: true, values: [
          "只保留活力帳，隱去非彈性碰撞尚未對平的短少"
        ] },
        "SC5-R1/c1.withdraw": {
          expectedDelta: 1, requiresRepairCycle: true,
          requiresBefore: [{ t:"choice", at:"SC5-R1/c1", pick:"withdraw" }],
          values: [
          "撤回權威與單一帳結論，重新保留兩本帳及未解缺口"
        ] }
      }
    }[chapterId] || {};
    var replayRep = 3;
    var replayLocked = false;
    var latestZeroRepIndex = -1;
    var latestRepLockIndex = -1;
    var latestRepairEnterIndex = -1;
    var seenPositiveRepSources = {};
    function matchesRepTrace(event, expected) {
      if (!event || !expected) return false;
      return Object.keys(expected).every(function (key) {
        return event[key] === expected[key];
      });
    }
    function findRepTrace(expected, start, end) {
      for (var traceIndex = Math.max(0, start); traceIndex < Math.min(events.length, end); traceIndex++) {
        if (matchesRepTrace(events[traceIndex], expected)) return traceIndex;
      }
      return -1;
    }
    function countRepTrace(expected) {
      var count = 0;
      for (var traceIndex = 0; traceIndex < events.length; traceIndex++) {
        if (matchesRepTrace(events[traceIndex], expected)) count += 1;
      }
      return count;
    }
    function getRepState(path) {
      var value = state;
      if (!Array.isArray(path) || !path.length)
        return { found: false, value: undefined };
      for (var pathIndex = 0; pathIndex < path.length; pathIndex++) {
        if (!value || typeof value !== "object" ||
            !Object.prototype.hasOwnProperty.call(value, path[pathIndex]))
          return { found: false, value: undefined };
        value = value[path[pathIndex]];
      }
      return { found: true, value: value };
    }
    function matchesRepState(spec) {
      var resolved = getRepState(spec && spec.path);
      if (!resolved.found) return false;
      var value = resolved.value;
      if (Object.prototype.hasOwnProperty.call(spec, "equals"))
        return value === spec.equals;
      if (spec.type === "integer")
        return isInt(value) &&
          (!isFinite(spec.min) || value >= spec.min) &&
          (!isFinite(spec.max) || value <= spec.max);
      return false;
    }
    for (var rei = 0; rei < events.length; rei++) {
      var repEvent = events[rei];
      if (!repEvent) continue;
      if (repEvent.t === "rep") {
        if (!isInt(repEvent.d) || !isInt(repEvent.from) || !isInt(repEvent.to) ||
            repEvent.from < 0 || repEvent.from > 5 ||
            repEvent.to < 0 || repEvent.to > 5 ||
            repEvent.to !== Math.min(5, Math.max(0, repEvent.from + repEvent.d)) ||
            typeof repEvent.at !== "string" || !repEvent.at ||
            repEvent.from !== replayRep)
          return fail("信譽事件紀錄前後矛盾");
        if ("reason" in repEvent &&
            (typeof repEvent.reason !== "string" || !repEvent.reason.trim() ||
              repEvent.reason.length > 240))
          return fail("信譽事件理由格式錯誤");
        var reasonRule = reasonRules[repEvent.at];
        if (!reasonRule)
          return fail("信譽事件來源未登錄:" + repEvent.at);
        if (repEvent.d !== reasonRule.expectedDelta)
          return fail("信譽事件增量與來源不一致:" + repEvent.at);
        var missingReasonAllowed = !!reasonRule.legacyOptional ||
          !!(reasonRule.legacyOptionalWithoutEvent &&
            countRepTrace(reasonRule.legacyOptionalWithoutEvent) === 0) ||
          !!(reasonRule.legacyOptionalWithEvent &&
            countRepTrace(reasonRule.legacyOptionalWithEvent) === 1);
        if (!repEvent.reason && !missingReasonAllowed ||
            repEvent.reason &&
            reasonRule.values.indexOf(repEvent.reason) < 0)
          return fail("信譽事件理由與來源不一致:" + repEvent.at);
        if (repEvent.d > 0 && !reasonRule.requiresRepairCycle) {
          if (seenPositiveRepSources[repEvent.at])
            return fail("信譽正向來源重複兌領:" + repEvent.at);
          seenPositiveRepSources[repEvent.at] = true;
        }
        var stateRules = reasonRule.requiresState || [];
        for (var sri = 0; sri < stateRules.length; sri++) {
          if (!matchesRepState(stateRules[sri]))
            return fail("信譽事件與目前狀態不一致:" + repEvent.at);
        }
        var uniqueRules = reasonRule.uniqueEvents || [];
        for (var uri = 0; uri < uniqueRules.length; uri++) {
          if (countRepTrace(uniqueRules[uri]) !== 1)
            return fail("信譽事件的來源操作不是唯一一筆:" + repEvent.at);
        }
        if (repEvent.d > 0) {
          if (reasonRule.requiresRepairCycle &&
              (replayRep !== 0 || !replayLocked ||
                latestRepairEnterIndex <= latestRepLockIndex))
            return fail("信譽修復加分缺少本輪歸零與進場:" + repEvent.at);
        }
        var beforeCursor = reasonRule.requiresRepairCycle
          ? latestRepairEnterIndex + 1 : 0;
        var beforeRules = reasonRule.requiresBefore || [];
        for (var bri = 0; bri < beforeRules.length; bri++) {
          var beforeIndex = findRepTrace(beforeRules[bri], beforeCursor, rei);
          if (beforeIndex < 0)
            return fail("信譽事件缺少依序的玩家操作:" + repEvent.at);
          beforeCursor = beforeIndex + 1;
        }
        var afterCursor = rei + 1;
        var afterRules = reasonRule.requiresAfter || [];
        for (var ari = 0; ari < afterRules.length; ari++) {
          var afterIndex = findRepTrace(afterRules[ari], afterCursor, events.length);
          if (afterIndex < 0)
            return fail("信譽事件缺少依序的後續操作:" + repEvent.at);
          afterCursor = afterIndex + 1;
        }
        var linkedAfterRules = reasonRule.linkedAfter || [];
        for (var lai = 0; lai < linkedAfterRules.length; lai++) {
          var linkedRule = linkedAfterRules[lai];
          var linkedIndex = findRepTrace(
            linkedRule.match, rei + 1, events.length);
          if (linkedIndex < 0 ||
              (linkedRule.unique &&
                countRepTrace(linkedRule.match) !== 1))
            return fail("信譽事件缺少唯一的後續操作:" + repEvent.at);
          if (linkedRule.adjacent && linkedIndex !== rei + 1)
            return fail("信譽事件與後續操作不是同一步:" + repEvent.at);
          var linkedState = getRepState(linkedRule.statePath);
          if (!linkedState.found ||
              events[linkedIndex][linkedRule.eventField] !== linkedState.value)
            return fail("信譽事件的後續操作與目前狀態不一致:" + repEvent.at);
        }
        replayRep = repEvent.to;
        if (repEvent.d < 0 && repEvent.to === 0)
          latestZeroRepIndex = rei;
      } else if (repEvent.t === "repLock") {
        var zeroEvent = events[rei - 1];
        if (!zeroEvent || zeroEvent.t !== "rep" ||
            zeroEvent.d >= 0 || zeroEvent.to !== 0 ||
            zeroEvent.at !== repEvent.at || replayRep !== 0)
          return fail("信譽歸零鎖缺少同來源扣分");
        replayLocked = true;
        latestRepLockIndex = rei;
      } else if (repEvent.t === "flagClear" &&
          repEvent.k === "repLocked") {
        if (!replayLocked || replayRep <= 0)
          return fail("信譽鎖定清除時序錯誤");
        replayLocked = false;
      } else if (repEvent.t === "repairEnter") {
        if (!replayLocked || replayRep !== 0 ||
            latestZeroRepIndex < 0 || latestRepLockIndex < latestZeroRepIndex)
          return fail("信譽修復入口前缺少歸零與鎖定");
        if (repEvent.gate != null) {
          if (chapterId !== "ch1" || repEvent.gate !== "validated-claim" ||
              !isInt(repEvent.runBaseline) || repEvent.runBaseline < 0 ||
              !isInt(repEvent.claimBaseline) || repEvent.claimBaseline < 0)
            return fail("信譽修復驗證閘格式錯誤");
        }
        latestRepairEnterIndex = rei;
      }
    }
    if (replayRep !== state.rep)
      return fail("信譽事件帳與目前數值不一致");
    if (replayRep === 0 && !replayLocked)
      return fail("信譽歸零但未鎖定修復");
    if (replayLocked !== (flags.repLocked === "1"))
      return fail("信譽鎖定旗標與事件帳不一致");

    /* 新版第一章修復不能只偽造 embedDone：新 run 必須在進場後經 judge 成為成立主張。
       沒有 gate 的舊 repairEnter 仍依既有事件鏈相容讀取。 */
    if (chapterId === "ch1" && latestRepairEnterIndex >= 0) {
      var repairGate = events[latestRepairEnterIndex];
      var repairRewarded = events.slice(latestRepairEnterIndex + 1).some(function (event) {
        return event && event.t === "rep" && event.at === "SC-R1/n3" && event.d === 1;
      });
      if (repairGate.gate === "validated-claim" && repairRewarded) {
        var ch1Runs = state.lab && state.lab.evidence && state.lab.evidence.runs || [];
        var ch1Claims = state.lab && state.lab.inference && state.lab.inference.claims || [];
        if (repairGate.runBaseline > ch1Runs.length || repairGate.claimBaseline > ch1Claims.length)
          return fail("信譽修復基線超出目前紀錄");
        var repairJudged = events.slice(latestRepairEnterIndex + 1).some(function (event) {
          return event && event.t === "lab" && event.action === "judge" && event.at === "SC-R1/e1";
        });
        var repairClaimed = ch1Claims.slice(repairGate.claimBaseline).some(function (claim) {
          return claim && claim.ok && Array.isArray(claim.runIds) && claim.runIds.some(function (id) {
            return id > repairGate.runBaseline;
          });
        });
        if (!repairJudged || !repairClaimed)
          return fail("第一章信譽修復缺少新紀錄的成立主張");
      }
    }

    var repairScene = {
      ch1: "SC-R1", ch2: "SC-R1", ch3: "SC3-R1",
      ch4: "SC4-R1", ch5: "SC5-R1"
    }[chapterId];
    var sceneNodes = {};
    (scenes && scenes.scenes || []).forEach(function (scene) {
      sceneNodes[scene.id] = {};
      (scene.nodes || []).forEach(function (node) {
        sceneNodes[scene.id][node.id] = true;
      });
    });
    var inRepair = !!(state.cursor && state.cursor.scene === repairScene);
    var hasReturnScene = Object.prototype.hasOwnProperty.call(flags, "returnScene");
    var hasReturnNode = Object.prototype.hasOwnProperty.call(flags, "returnNode");
    var hasBaseline = Object.prototype.hasOwnProperty.call(flags, "scr1_baseline");
    if (flags.repLocked != null && flags.repLocked !== "1")
      return fail("信譽鎖定旗標格式錯誤");
    if (state.rep > 0 && flags.repLocked === "1")
      return fail("信譽尚未歸零卻被鎖定");

    var effectiveCursor = state.cursor;
    if (inRepair) {
      if (!hasReturnScene || !hasReturnNode ||
          !sceneNodes[flags.returnScene] ||
          !sceneNodes[flags.returnScene][flags.returnNode] ||
          flags.returnScene === repairScene)
        return fail("信譽修復缺少有效返回游標");
      var latestRepairEnter = null;
      for (var eri = events.length - 1; eri >= 0; eri--) {
        if (events[eri] && events[eri].t === "repairEnter") {
          latestRepairEnter = events[eri];
          break;
        }
      }
      if (!latestRepairEnter ||
          latestRepairEnter.from !== flags.returnScene + "/" + flags.returnNode ||
          latestRepairEnterIndex < latestRepLockIndex)
        return fail("信譽修復入口與返回游標不一致");
      effectiveCursor = { scene: flags.returnScene, node: flags.returnNode };

      if (chapterId === "ch1" || chapterId === "ch2") {
        if (["n1", "n2", "e1", "n3"].indexOf(state.cursor.node) < 0 ||
            state.rep !== 0 || flags.repLocked !== "1" ||
            !hasBaseline || !/^(0|[1-9][0-9]*)$/.test(flags.scr1_baseline))
          return fail("第一、二章信譽修復狀態不一致");
      } else {
        if (hasBaseline ||
            ["n1", "n2", "c1", "w1", "w2", "n3"].indexOf(state.cursor.node) < 0)
          return fail("信譽修復場含不相容欄位");
        if (state.cursor.node === "n3") {
          if (state.rep !== 1 || flags.repLocked != null)
            return fail("信譽修復撤回後的數值或鎖定狀態錯誤");
          var choiceAt = repairScene + "/c1";
          var effectAt = choiceAt + ".withdraw";
          var choiceIndex = events.findIndex(function (event) {
            return event && event.t === "choice" &&
              event.at === choiceAt && event.pick === "withdraw";
          });
          var repairRepIndex = events.findIndex(function (event, index) {
            return index > choiceIndex && event && event.t === "rep" &&
              event.at === effectAt && event.d === 1 &&
              event.from === 0 && event.to === 1;
          });
          var clearIndex = events.findIndex(function (event, index) {
            return index > repairRepIndex && event && event.t === "flagClear" &&
              event.k === "repLocked" && event.at === effectAt;
          });
          if (choiceIndex < 0 || repairRepIndex < 0 || clearIndex < 0)
            return fail("信譽修復撤回缺少完整玩家操作紀錄");
        } else if (state.rep !== 0 || flags.repLocked !== "1") {
          return fail("信譽修復完成前的數值或鎖定狀態錯誤");
        }
      }
    } else if (hasReturnScene || hasReturnNode || hasBaseline) {
      return fail("非修復場殘留返回游標");
    }

    var reserved = {
      ch2: [{
        flag: "ch2BallisticsScopeBlurted", value: "1",
        choiceAt: "B0-2/q1", pick: "a", effectAt: "B0-2/q1.a", delta: -1,
        legacyReasonOptional: true, legacyWithoutFlag: true,
        reason: "尚未檢查砲術圖就宣稱舊規律一定管得到飛行"
      }, {
        flag: "f3DelayInvented", value: "1",
        choiceAt: "B2-4/q4", pick: "b", effectAt: "B2-4/q4.b", delta: -1,
        reason: "三列都只記下兩聲分不開，仍把沒有測得的延遲寫成結果"
      }, {
        flag: "shipMastOverclaimed", value: "1",
        variants: [{
          choiceAt: "B2-5/q2", pick: "b", effectAt: "B2-5/q2.b", delta: -1,
          reason: "把尚未出航的船桅預測寫成已由桌上實驗完成"
        }, {
          choiceAt: "B2-5/q2", pick: "c", effectAt: "B2-5/q2.c", delta: -1,
          reason: "把尚未出航的船桅預測寫成已由桌上實驗完成"
        }]
      }],
      ch3: [{
        flag: "oldPaperAnswerBlurted", value: "1",
        choiceAt: "C0-3/c1", pick: "all", effectAt: "C0-3/c1.all", delta: -1,
        reason: "把還沒有原紙支持的答案當成事實"
      }, {
        flag: "oldPaperScoped", value: "bounded",
        choiceAt: "C0-3/c1", pick: "bounded",
        effectAt: "C0-3/c1.bounded", delta: 1,
        reason: "主動把斷言收回到原紙能支持的範圍",
        /*
         * 2026-07-29 前的第三章已寫入同名旗標與 choice→flag，
         * 但當時「縮限主張」尚未納入全域信譽，所以沒有 rep 事件。
         * 只接受這一個可驗證的舊事件形狀；空手自報旗標仍拒絕。
         */
        legacyWithoutRep: true
      }],
      ch5: [{
        flag: "ch5AuthoritySubstitutionTried", value: "1",
        choiceAt: "E1-1/q1", pick: "authority",
        effectAt: "E1-1/q1.authority", delta: -1,
        reason: "拿前輩的名聲替代可驗資料"
      }]
    }[chapterId] || [];
    for (var rsi = 0; rsi < reserved.length; rsi++) {
      var spec = reserved[rsi];
      var flagPresent = Object.prototype.hasOwnProperty.call(flags, spec.flag);
      if (flagPresent && flags[spec.flag] !== spec.value)
        return fail("信譽首次旗標值錯誤:" + spec.flag);
      var variants = spec.variants || [spec];
      var tracePresent = false, completeCurrentTrace = false;
      var completeLegacyTrace = false, completeLegacyFlagless = false;
      var legacyVariant = null;
      for (var vsi = 0; vsi < variants.length; vsi++) {
        var variant = variants[vsi];
        var flagIndex = events.findIndex(function (event) {
          return event && event.t === "flag" && event.k === spec.flag &&
            event.v === spec.value && event.at === variant.effectAt;
        });
        var repIndex = events.findIndex(function (event) {
          return event && event.t === "rep" &&
            event.at === variant.effectAt && event.d === variant.delta &&
            (event.reason === variant.reason ||
              (variant.legacyReasonOptional && !event.reason));
        });
        var pickIndex = events.findIndex(function (event) {
          return event && event.t === "choice" &&
            event.at === variant.choiceAt && event.pick === variant.pick;
        });
        tracePresent = tracePresent || flagIndex >= 0 || repIndex >= 0 || pickIndex >= 0;
        if (flagPresent && pickIndex >= 0 && repIndex > pickIndex && flagIndex > repIndex)
          completeCurrentTrace = true;
        if (variant.legacyWithoutRep && flagPresent && pickIndex >= 0 &&
            repIndex < 0 && flagIndex > pickIndex)
          completeLegacyTrace = true;
        if (variant.legacyWithoutFlag && !flagPresent && pickIndex >= 0 &&
            repIndex > pickIndex && flagIndex < 0) {
          completeLegacyFlagless = true;
          legacyVariant = variant;
        }
      }
      if ((flagPresent || tracePresent) && !completeCurrentTrace &&
          !completeLegacyTrace && !completeLegacyFlagless)
        return fail("信譽首次旗標缺少完整玩家操作紀錄:" + spec.flag);
      if (completeLegacyFlagless) {
        flags[spec.flag] = spec.value;
        events.push({
          t: "flag", k: spec.flag, v: spec.value, at: legacyVariant.effectAt,
          migratedFrom: "ch2-v1-reasonless"
        });
      }
    }
    return { ok: true, effectiveCursor: effectiveCursor };
  }

  /* 關鍵欄位白名單(需要 patterns/scenes 資料提供 enum) */
  function sanitizeImport(state, patterns, scenes) {
    if (!state || typeof state !== "object") return fail("存檔內容格式錯誤");
    var generic = scrub(state, 0, { n: LIMITS.maxNodes });
    if (generic) return fail(generic);

    if (state.mode !== "explore" && state.mode !== "scholar") return fail("遊戲模式無法辨識");
    if (!isInt(state.rep) || state.rep < 0 || state.rep > 5) return fail("信譽數值錯誤");

    var sceneIds = {};
    (scenes && scenes.scenes || []).forEach(function (s) { sceneIds[s.id] = 1; });
    if (!state.cursor || !sceneIds[state.cursor.scene]) return fail("存檔中的故事位置無法辨識");
    var reputation = sanitizeReputationLifecycle(state, scenes, "ch1");
    if (!reputation.ok) return reputation;

    var lab = state.lab;
    if (!lab || typeof lab !== "object") return fail("實驗紀錄缺失");
    if (!isInt(lab.days) || lab.days < 0 || lab.days > 9999) return fail("天數紀錄錯誤");

    var runs = lab.evidence && lab.evidence.runs;
    if (!Array.isArray(runs) || runs.length > 300) return fail("實驗紀錄格式錯誤");
    /* run.config 的 incline 對應 patterns.base，不是不存在的 patterns.incline。 */
    var DIM_KEYS = { ball: "ball", surface: "surface", incline: "base", timer: "timer" };
    for (var i = 0; i < runs.length; i++) {
      var r = runs[i];
      if (!r || !isInt(r.id) || !isInt(r.day) || !r.config) return fail("第 " + (i + 1) + " 筆實驗紀錄格式錯誤");
      for (var dk in DIM_KEYS) {
        var val = r.config[dk];
        var patternKey = DIM_KEYS[dk];
        if (typeof val !== "string" || !patterns || !patterns[patternKey] ||
            !(val in patterns[patternKey]))
          return fail("第 " + (i + 1) + " 筆實驗的器材配置無法辨識");
      }
      if (!Array.isArray(r.readings) || r.readings.length > 8) return fail("第 " + (i + 1) + " 筆實驗的讀值格式錯誤");
      for (var j = 0; j < r.readings.length; j++)
        if (typeof r.readings[j] !== "number" || !isFinite(r.readings[j])) return fail("第 " + (i + 1) + " 筆實驗含無法辨識的讀值");
    }
    var claims = lab.inference && lab.inference.claims;
    if (!Array.isArray(claims) || claims.length > 300) return fail("主張紀錄格式錯誤");
    for (var c = 0; c < claims.length; c++) {
      var cl = claims[c];
      if (!cl || !isInt(cl.id) || !cl.config) return fail("第 " + (c + 1) + " 筆主張紀錄格式錯誤");
      if (typeof cl.prediction !== "number" || !isFinite(cl.prediction)) return fail("第 " + (c + 1) + " 筆主張的預測值錯誤");
      for (var dk2 in DIM_KEYS) {
        var v2 = cl.config[dk2];
        var claimPatternKey = DIM_KEYS[dk2];
        if (typeof v2 !== "string" || !patterns[claimPatternKey] ||
            !(v2 in patterns[claimPatternKey]))
          return fail("第 " + (c + 1) + " 筆主張的器材配置無法辨識");
      }
    }
    if (!Array.isArray(state.transcript) || state.transcript.length > 3000) return fail("對話紀錄格式錯誤");
    for (var t = 0; t < state.transcript.length; t++) {
      var line = state.transcript[t];
      if (!line || typeof line !== "object") return fail("對話紀錄中有一筆格式錯誤");
      if (line.scene && !sceneIds[line.scene]) return fail("對話紀錄中的故事位置無法辨識");
      if (typeof line.text !== "string" || line.text.length > 2000) return fail("對話紀錄中有一筆文字格式錯誤");
      if (line.speaker != null && (typeof line.speaker !== "string" || line.speaker.length > 40))
        return fail("對話紀錄中有一筆講者格式錯誤");
    }
    return { ok: true, state: state };
  }

  /* 第二章白名單：工坊資料與第一章 runs/claims 形狀不同，禁止拿第一章 sanitizer 硬套。
     這裡驗結構與 enum；fixture 成敗仍由 Engine2 重算，不相信匯入檔自稱 accepted。 */
  function sanitizeImport2(state, scenes, engine2) {
    if (!state || typeof state !== "object") return fail("存檔內容格式錯誤");
    var generic = scrub(state, 0, { n: LIMITS.maxNodes });
    if (generic) return fail(generic);
    if (state.schemaVersion !== 1 || state.chapter !== "ch2") return fail("存檔版本或章節不相容");
    if (state.mode !== "explore" && state.mode !== "scholar") return fail("遊戲模式無法辨識");
    if (!isInt(state.rep) || state.rep < 0 || state.rep > 5) return fail("信譽數值錯誤");

    var sceneIds = {}, nodeIds = {};
    (scenes && scenes.scenes || []).forEach(function (s) {
      sceneIds[s.id] = 1; nodeIds[s.id] = {};
      (s.nodes || []).forEach(function (n) { nodeIds[s.id][n.id] = 1; });
    });
    /* CH3-CR-018 只刪除了三個舊場景殼；舊游標安全送到意義最接近的新場，
       不嘗試替玩家偽造已完成的實驗狀態。 */
    var legacySceneRedirect = { "C2-2B": "C2-3", "C3-3": "C3-1", "C3-4": "C3-2" };
    if (state.cursor && legacySceneRedirect[state.cursor.scene]) {
      state.cursor.scene = legacySceneRedirect[state.cursor.scene];
      state.cursor.node = (scenes.scenes.find(function (s) { return s.id === state.cursor.scene; }).nodes[0] || {}).id;
    }
    if (!state.cursor || !sceneIds[state.cursor.scene] || !nodeIds[state.cursor.scene][state.cursor.node])
      return fail("存檔中的故事位置無法辨識");
    var reputation = sanitizeReputationLifecycle(state, scenes, "ch2");
    if (!reputation.ok) return reputation;

    /*
     * GB-ADR-022 (2026-08-02) 後的最後反撲是一次「三紙整版對位」。
     * F5 不是可獨立勾選的進度欄；它必須和正確排法、辯論勝利與
     * runtime 寫下的事件帳同時成立。舊線上存檔沒有 lastLayout，
     * 因此另以舊 FR 真正走完時的封閉形狀放行，不替存檔補故事。
     */
    var evidence2 = state.evidence;
    if (!evidence2 || typeof evidence2 !== "object" || Array.isArray(evidence2))
      return fail("第二章證據欄位格式錯誤");
    var evidenceIds2 = { S3:1, S4:1, F1:1, F2:1, F3:1, F4:1, F5:1 };
    for (var evidenceId2 in evidence2) {
      if (!evidenceIds2[evidenceId2] || evidence2[evidenceId2] !== true)
        return fail("第二章證據狀態無法辨識:" + evidenceId2);
    }
    var hasF5 = evidence2.F5 === true;
    var debate2 = state.debate;
    if (debate2 == null) {
      if (hasF5) return fail("三紙對位尚未完成，不得取得 F5");
    } else {
      if (typeof debate2 !== "object" || Array.isArray(debate2) ||
          !isInt(debate2.persuasion) || debate2.persuasion < 0 || debate2.persuasion > 5 ||
          !isInt(debate2.idx) || debate2.idx < 0 || debate2.idx > 3 ||
          ["pending", "suspended", "won"].indexOf(debate2.status) < 0 ||
          !debate2.fr || typeof debate2.fr !== "object" || Array.isArray(debate2.fr))
        return fail("第二章辯論狀態格式錯誤");
      if (debate2.status === "suspended" && debate2.persuasion !== 0)
        return fail("論證對位中止狀態與量表不一致");
      if (debate2.status === "pending" && debate2.persuasion === 0)
        return fail("論證對位歸零卻未進入中止狀態");

      var fr2 = debate2.fr;
      var isNewArrangement = Object.prototype.hasOwnProperty.call(fr2, "lastLayout") ||
        Object.prototype.hasOwnProperty.call(fr2, "attempts");
      var correctLayout2 = { table:"stands", cannon:"boundary", sky:"unmeasured" };
      var layoutCorrect2 = false;
      if (isNewArrangement) {
        if (!Object.prototype.hasOwnProperty.call(fr2, "lastLayout") ||
            !Object.prototype.hasOwnProperty.call(fr2, "attempts") ||
            !isInt(fr2.attempts) || fr2.attempts < 0 || fr2.attempts > 200 ||
            typeof fr2.opened !== "boolean" || typeof fr2.claimDone !== "boolean" ||
            typeof fr2.resolved !== "boolean")
          return fail("三紙對位進度格式錯誤");
        if (fr2.lastLayout == null) {
          if (fr2.attempts !== 0)
            return fail("三紙對位次數與桌上排法不一致");
        } else {
          if (typeof fr2.lastLayout !== "object" || Array.isArray(fr2.lastLayout) ||
              fr2.attempts < 1 || !fr2.opened)
            return fail("三紙對位排法格式錯誤");
          var layoutKeys2 = Object.keys(fr2.lastLayout).sort();
          if (layoutKeys2.join(",") !== "cannon,sky,table")
            return fail("三紙對位排法欄位錯誤");
          var disposition2 = { stands:1, boundary:1, unmeasured:1, discard:1, refutes:1 };
          for (var layoutKey2 in fr2.lastLayout)
            if (!disposition2[fr2.lastLayout[layoutKey2]])
              return fail("三紙對位位置無法辨識");
          layoutCorrect2 = fr2.lastLayout.table === correctLayout2.table &&
            fr2.lastLayout.cannon === correctLayout2.cannon &&
            fr2.lastLayout.sky === correctLayout2.sky;
        }
        if (debate2.status === "won") {
          if (!fr2.opened || !fr2.resolved || !fr2.claimDone || !layoutCorrect2 ||
              !hasF5 || debate2.persuasion === 0)
            return fail("三紙對位勝利狀態與實際排法不一致");
        } else if (fr2.resolved || fr2.claimDone || hasF5 || layoutCorrect2) {
          return fail("三紙對位尚未勝利卻殘留完成狀態");
        }
      } else {
        /* 51c977d 以前的線上終局：敵方圖、範圍承諾與三步組鏈全數完成。 */
        var legacyWon2 = debate2.status === "won" && fr2.opened === true &&
          fr2.resolved === true && fr2.claimDone === true &&
          fr2.enemySlopeRead === true && fr2.enemyClassified === true &&
          ((state.mode === "explore" && fr2.step === 3) ||
            (state.mode === "scholar" && Array.isArray(fr2.slots) &&
              fr2.slots.join(",") === "c1,c2,c3"));
        if (debate2.status === "won" && (!legacyWon2 || !hasF5 || debate2.persuasion === 0))
          return fail("舊版第二章終局完成狀態不完整");
        if (debate2.status !== "won" && hasF5)
          return fail("舊版第二章終局尚未完成卻已取得 F5");
      }

      if (hasF5) {
        var f5Events2 = state.eventLog.filter(function (event) {
          return event && event.t === "evidence" && event.id === "F5" && event.at === "debate.fr";
        });
        var debateWins2 = state.eventLog.filter(function (event) {
          return event && event.t === "debateWon";
        });
        var f5EventIndex2 = state.eventLog.indexOf(f5Events2[0]);
        var winEventIndex2 = state.eventLog.indexOf(debateWins2[0]);
        if (f5Events2.length !== 1 || debateWins2.length !== 1 ||
            f5EventIndex2 < 0 || winEventIndex2 <= f5EventIndex2)
          return fail("F5 缺少完整的三紙對位勝利事件鏈");
      }
    }

    var legacyCompletedLab2 = !!(debate2 && debate2.status === "won" &&
      typeof isNewArrangement !== "undefined" && !isNewArrangement && legacyWon2);
    var lab = state.lab, parts = engine2 && engine2._PARTS || {}, slots = engine2 && engine2._SLOTS || [];
    var fixture2 = engine2 && engine2._FIXTURE;
    if (!lab || typeof lab !== "object") return fail("實驗紀錄缺失");
    if (!isInt(lab.days) || lab.days < 0 || lab.days > 9999) return fail("天數紀錄錯誤");
    if (!lab.slots || !lab.calib || !Array.isArray(lab.series)) return fail("工坊紀錄格式錯誤");
    if (!isInt(lab.revision) || lab.revision < 0 || !isInt(lab.seriesSeq) || lab.seriesSeq < 0 ||
        !Array.isArray(lab.assemblyLog) || !fixture2 || !engine2 ||
        typeof engine2._judgeRaw !== "function" || typeof engine2.compareBalls !== "function")
      return fail("工坊版本或驗算器格式錯誤");
    if (lab.series.length > 300) return fail("工坊測量紀錄過多");
    for (var si = 0; si < slots.length; si++) {
      var slot = slots[si], pid = lab.slots[slot];
      if (pid !== null && (!parts[pid] || parts[pid].slot !== slot)) return fail("工坊中有一件零件裝錯位置");
    }
    if (typeof lab.calib.releaseZero !== "boolean" || typeof lab.calib.rangeScale !== "boolean")
      return fail("工坊校準紀錄格式錯誤");
    if (!lab.evidence || !lab.evidence.f2 || typeof lab.evidence.f2.law !== "boolean" ||
        typeof lab.evidence.f2.ball !== "boolean") return fail("彈射實驗的證據狀態格式錯誤");
    if (lab.evidence.f2.lawSource != null && !isInt(lab.evidence.f2.lawSource))
      return fail("彈射實驗的斷言來源無法辨識");
    if (lab.evidence.f2.lawConcept != null && lab.evidence.f2.lawConcept !== "sqrtScale")
      return fail("彈射實驗的斷言內容無法辨識");
    var profiles = { clean: 1, directionScatter: 1, speedDrift: 1, coarseRead: 1 };
    var seriesById2 = {}, completedBySetup2 = {}, maxSeriesId2 = 0;
    function sameFixture2(actual, expected) {
      return JSON.stringify(actual) === JSON.stringify(expected);
    }
    function sameNumber2(actual, expected) {
      return typeof actual === "number" && isFinite(actual) && Math.abs(actual - expected) < 1e-12;
    }
    for (var i = 0; i < lab.series.length; i++) {
      var sr = lab.series[i];
      if (!sr || !isInt(sr.id) || ["open", "complete", "abandoned"].indexOf(sr.status) < 0)
        return fail("第 " + (i + 1) + " 組彈射測量格式錯誤");
      if (seriesById2[sr.id] || sr.id <= maxSeriesId2) return fail("彈射測量編號重複或倒退");
      seriesById2[sr.id] = sr; maxSeriesId2 = sr.id;
      if (sr.ball !== "copper" && sr.ball !== "wood") return fail("彈射測量的球種無法辨識");
      if (!profiles[sr.profile] || !isInt(sr.cycle) || sr.cycle < 0 || sr.cycle > 2) return fail("彈射測量的裝置狀態格式錯誤");
      if (!isInt(sr.apparatusRevision) || sr.apparatusRevision < 0 || sr.apparatusRevision > lab.revision ||
          typeof sr.fingerprint !== "string" || !sr.fingerprint)
        return fail("彈射測量的裝置版本無法辨識");
      if (!isInt(sr.dayStarted) || sr.dayStarted < 0 || sr.dayStarted > lab.days)
        return fail("彈射測量的起始日無法辨識");
      var cycleKey2 = sr.fingerprint + "|" + sr.ball;
      var expectedCycle2 = (completedBySetup2[cycleKey2] || 0) % 3;
      if (sr.cycle !== expectedCycle2) return fail("彈射測量輪次與既有紀錄不一致");
      var readings = sr.readings || {}, hs = [4, 9, 16, 25];
      var readingKeys2 = Object.keys(readings);
      for (var rk2 = 0; rk2 < readingKeys2.length; rk2++)
        if (["4", "9", "16", "25"].indexOf(readingKeys2[rk2]) < 0)
          return fail("彈射測量含未知高度");
      var gapSeen2 = false, readingCount2 = 0;
      for (var hi = 0; hi < hs.length; hi++) {
        if (!(hs[hi] in readings)) { gapSeen2 = true; continue; }
        if (gapSeen2) return fail("彈射測量沒有依序留下讀值");
        readingCount2 += 1;
        var rd = readings[hs[hi]];
        if (typeof rd === "number") { if (!isFinite(rd)) return fail("彈射測量含無法辨識的讀值"); }
        else if (!Array.isArray(rd) || rd.length !== 2 || !isFinite(rd[0]) || !isFinite(rd[1]) || rd[0] > rd[1])
          return fail("彈射測量的讀值範圍格式錯誤");
        if (!sameFixture2(rd, fixture2[sr.profile][sr.cycle][hi]))
          return fail("彈射測量讀值與封閉資料源不一致");
      }
      if (sr.prediction !== null && (typeof sr.prediction !== "number" || !isFinite(sr.prediction)))
        return fail("彈射測量的預測值格式錯誤");
      if (sr.prediction !== null && readingCount2 < 3) return fail("彈射預測早於前三筆讀值");
      if (sr.status === "complete") {
        if (readingCount2 !== 4 || sr.prediction === null || !isInt(sr.dayEnded) ||
            sr.dayEnded < sr.dayStarted || sr.dayEnded > lab.days)
          return fail("完成的彈射測量缺少封存資料");
        var judged2 = engine2._judgeRaw(readings, sr.prediction);
        if (judged2.error) {
          if (sr.accepted !== false || sr.rejectReason !== judged2.error ||
              sr.kHat !== null || sr.shapeError !== null || sr.predictionError !== null)
            return fail("彈射測量的退件結果與原始資料不一致");
        } else if (sr.accepted !== judged2.accepted || !sameNumber2(sr.kHat, judged2.kHat) ||
            !sameNumber2(sr.shapeError, judged2.shapeError) ||
            !sameNumber2(sr.predictionError, judged2.predictionError)) {
          return fail("彈射測量的受理結果與原始資料不一致");
        }
        completedBySetup2[cycleKey2] = (completedBySetup2[cycleKey2] || 0) + 1;
      } else if (readingCount2 > 3 || sr.dayEnded !== null || sr.accepted !== false ||
          sr.kHat !== null || sr.shapeError !== null || sr.predictionError !== null) {
        return fail("未完成的彈射測量殘留結案結果");
      }
    }
    if (lab.seriesSeq !== maxSeriesId2) return fail("彈射測量流水號與紀錄不一致");
    var law2 = lab.evidence.f2.law, ball2 = lab.evidence.f2.ball;
    if (law2) {
      var lawSource2 = seriesById2[lab.evidence.f2.lawSource];
      if (!lawSource2 || lawSource2.status !== "complete" || !lawSource2.accepted ||
          lawSource2.ball !== "copper" || lab.evidence.f2.lawConcept !== "sqrtScale")
        return fail("平方根斷言沒有可重算的銅球來源");
    } else if (lab.evidence.f2.lawSource !== null || lab.evidence.f2.lawConcept !== null) {
      return fail("尚未成立的平方根斷言殘留來源");
    }
    if (ball2) {
      var validBallPair2 = false;
      for (var ba2 = 0; ba2 < lab.series.length && !validBallPair2; ba2++)
        for (var bb2 = ba2 + 1; bb2 < lab.series.length && !validBallPair2; bb2++)
          validBallPair2 = engine2.compareBalls(lab, lab.series[ba2].id, lab.series[bb2].id).ok === true;
      if (!validBallPair2) return fail("換球斷言沒有可重算的兩組來源");
    }
    var hasF2Lab2 = law2 && ball2;
    var hasF2Story2 = evidence2.F2 === true;
    var labActions2 = (state.eventLog || []).filter(function (event) { return event && event.t === "lab"; });
    if (!legacyCompletedLab2) {
      if (law2 && !labActions2.some(function (event) { return event.action === "assertLaw"; }))
        return fail("平方根斷言缺少玩家判讀事件");
      if (ball2 && !labActions2.some(function (event) { return event.action === "compareBalls"; }))
        return fail("換球斷言缺少玩家比較事件");
      if (hasF2Lab2 !== hasF2Story2) return fail("F2 故事證據與實驗斷言不一致");
      var f2Events2 = (state.eventLog || []).filter(function (event) {
        return event && event.t === "evidence" && event.id === "F2" && event.at === "lab2";
      });
      if ((hasF2Story2 && f2Events2.length !== 1) || (!hasF2Story2 && f2Events2.length !== 0))
        return fail("F2 缺少唯一的取得事件");
    }
    if (!Array.isArray(state.transcript) || state.transcript.length > 3000) return fail("對話紀錄格式錯誤");
    for (var t = 0; t < state.transcript.length; t++) {
      var line = state.transcript[t];
      if (!line || !sceneIds[line.scene] || typeof line.text !== "string" || line.text.length > 2000)
        return fail("對話紀錄中有一筆格式錯誤");
    }
    return { ok: true, state: state };
  }

  /* 第三章白名單：船桅 fixture 與雙紙帶狀態。結果欄仍由 Engine3 動作產生；
     匯入只接受封閉列舉與有限數值，拒絕玩家自稱已取得不存在的場景游標。 */
  function sanitizeImport3(state, scenes) {
    if (!state || typeof state !== "object") return fail("存檔內容格式錯誤");
    var generic = scrub(state, 0, { n: LIMITS.maxNodes });
    if (generic) return fail(generic);
    if (state.schemaVersion !== 1 || state.chapter !== "ch3") return fail("存檔版本或章節不相容");
    if (state.mode !== "explore" && state.mode !== "scholar") return fail("遊戲模式無法辨識");
    if (!isInt(state.rep) || state.rep < 0 || state.rep > 5) return fail("信譽數值錯誤");
    var sceneIds = {}, nodeIds = {};
    (scenes && scenes.scenes || []).forEach(function (s) {
      sceneIds[s.id] = 1; nodeIds[s.id] = {};
      (s.nodes || []).forEach(function (n) { nodeIds[s.id][n.id] = 1; });
    });
    if (!state.cursor || !sceneIds[state.cursor.scene] || !nodeIds[state.cursor.scene][state.cursor.node])
      return fail("存檔中的故事位置無法辨識");
    var reputation = sanitizeReputationLifecycle(state, scenes, "ch3");
    if (!reputation.ok) return reputation;
    var lab = state.lab;
    if (!lab || !isInt(lab.days) || lab.days < 0 || lab.days > 9999) return fail("航船實驗紀錄格式錯誤");
    if ([null, "hand", "string", "latch"].indexOf(lab.release) < 0 || typeof lab.plumbCalibrated !== "boolean")
      return fail("航船實驗的釋放方式或鉛垂校準格式錯誤");
    if (lab.design != null) {
      var design = lab.design;
      if (!design.pilot || !design.protocol || !design.cabinBlind || !design.wind || !design.dual ||
          [null, "release", "speed", "repeat"].indexOf(design.pilot.focus) < 0 ||
          [null, "release", "speed", "repeat"].indexOf(design.pilot.diagnosed) < 0 ||
          !Array.isArray(design.pilot.rows) || design.pilot.rows.length > 20 ||
          !Array.isArray(design.pilot.missing) || design.pilot.missing.length > 3 ||
          !Array.isArray(design.pilot.history) || design.pilot.history.length > 20 ||
          !design.protocol.assignments || !Array.isArray(design.protocol.attempts) ||
          design.protocol.attempts.length > 50 ||
          typeof design.protocol.locked !== "boolean" || typeof design.protocol.ran !== "boolean" ||
          [null, "speed", "wind"].indexOf(design.investigationOrder) < 0 ||
          !Array.isArray(design.cabinBlind.traces) || design.cabinBlind.traces.length > 4 ||
          !Array.isArray(design.cabinBlind.judgments) || design.cabinBlind.judgments.length > 20 ||
          typeof design.cabinBlind.complete !== "boolean" ||
          !Array.isArray(design.wind.attempts) || design.wind.attempts.length > 20 ||
          !Array.isArray(design.wind.runs) || design.wind.runs.length > 20 ||
          typeof design.wind.interpreted !== "boolean" ||
          !Array.isArray(design.dual.attempts) || design.dual.attempts.length > 20 ||
          typeof design.dual.locked !== "boolean")
        return fail("第三章實驗設計卷宗格式錯誤");
      var assignedPeople = ["mathieu", "sailor", "etienne", "gassendi", "traveler", "captain"];
      for (var protocolSlot of Object.keys(design.protocol.assignments)) {
        if (["release", "clock", "shore", "ship", "vessel"].indexOf(protocolSlot) < 0 ||
            assignedPeople.indexOf(design.protocol.assignments[protocolSlot]) < 0)
          return fail("第三章分工表含無法辨識的角色");
      }
      for (var pilotRow of design.pilot.rows) {
        if (!pilotRow || typeof pilotRow.offset !== "number" || !isFinite(pilotRow.offset))
          return fail("第三章試航紀錄含無法辨識的讀值");
      }
      for (var blindTrace of design.cabinBlind.traces) {
        if (!blindTrace || typeof blindTrace.offset !== "number" || !isFinite(blindTrace.offset) ||
            typeof blindTrace.spread !== "number" || !isFinite(blindTrace.spread))
          return fail("第三章船艙盲測含無法辨識的讀值");
      }
      for (var windRow of design.wind.runs) {
        if (!windRow || typeof windRow.offset !== "number" || !isFinite(windRow.offset) ||
            ["steady", "accelerating", "unclassified", "unknown"].indexOf(windRow.shipState) < 0)
          return fail("第三章風向紀錄含無法辨識的讀值");
      }
    }
    if (!Array.isArray(lab.baselineRuns) || !Array.isArray(lab.mastRuns) ||
        lab.baselineRuns.length > 100 || lab.mastRuns.length > 100) return fail("落石紀錄格式錯誤");
    var checkRuns = lab.baselineRuns.concat(lab.mastRuns);
    for (var i = 0; i < checkRuns.length; i++) {
      var rr = checkRuns[i];
      if (!rr || typeof rr.offset !== "number" || !isFinite(rr.offset)) return fail("落石紀錄含無法辨識的落點");
    }
    if (!lab.cabin || !lab.predictions || !lab.speedRuns || !lab.overlay || !lab.publicDemo || !lab.audit || !lab.evidence)
      return fail("航船實驗有必要紀錄缺失");
    if (typeof lab.overlay.aligned !== "boolean" || typeof lab.overlay.transformed !== "boolean" ||
        ["shore", "ship"].indexOf(lab.overlay.activeReference) < 0 ||
        (lab.overlay.preview != null &&
          ["initial", "inspection", "endpoints", "sameBeats", "scaleOnly", "subtractMast"].indexOf(lab.overlay.preview) < 0) ||
        (lab.overlay.inspectionBeat != null &&
          (!isInt(lab.overlay.inspectionBeat) || lab.overlay.inspectionBeat < -1 || lab.overlay.inspectionBeat > 3)) ||
        (lab.overlay.inspected != null && typeof lab.overlay.inspected !== "boolean"))
      return fail("雙紙帶操作紀錄格式錯誤");
    for (var speedKind of ["accelerating", "decelerating"]) {
      /* v1 單筆物件與 v1.2 可重做陣列都接受；進引擎後統一遷移為陣列。 */
      var speedCell = lab.speedRuns[speedKind];
      var speedRows = speedCell == null ? [] : (Array.isArray(speedCell) ? speedCell : [speedCell]);
      if (speedRows.length > 100) return fail("變速比較紀錄筆數異常");
      for (var sr = 0; sr < speedRows.length; sr++) {
        var speedRun = speedRows[sr];
        if (!speedRun || speedRun.state !== speedKind ||
            typeof speedRun.offset !== "number" || !isFinite(speedRun.offset) ||
            ["behind", "foot", "ahead"].indexOf(speedRun.predicted) < 0 ||
            ["behind", "ahead"].indexOf(speedRun.outcome) < 0 ||
            typeof speedRun.matched !== "boolean")
          return fail("變速比較紀錄含無法辨識的讀值");
      }
    }
    var publicOrder = ["baseline", "stable-window", "no-push", "seal-prediction", "repeat"];
    var legacyPublicOrder = ["baseline", "stable-window", "no-push", "repeat"];
    var publicProcedure = lab.publicDemo.procedure;
    var validPublicPrefix = Array.isArray(publicProcedure) && publicProcedure.length <= publicOrder.length &&
      publicProcedure.every(function (step, index) { return step === publicOrder[index]; });
    var validLegacyPublic = Array.isArray(publicProcedure) &&
      publicProcedure.length === legacyPublicOrder.length &&
      publicProcedure.every(function (step, index) { return step === legacyPublicOrder[index]; });
    if ((!validPublicPrefix && !validLegacyPublic) || !isInt(lab.publicDemo.runs) ||
        lab.publicDemo.runs < 0 || lab.publicDemo.runs > 3 ||
        typeof lab.publicDemo.complete !== "boolean" ||
        (lab.publicDemo.predictionsSealed != null && typeof lab.publicDemo.predictionsSealed !== "boolean"))
      return fail("公開演示程序紀錄格式錯誤");
    if (lab.publicDemo.criteria != null) {
      var crit = lab.publicDemo.criteria;
      if (!crit || [2, 3, 4].indexOf(crit.equalSegments) < 0 ||
          [2, 3].indexOf(crit.repeats) < 0 ||
          ["hand", "latch"].indexOf(crit.release) < 0 ||
          typeof crit.requireDual !== "boolean" ||
          !Array.isArray(lab.publicDemo.criteriaHistory) || lab.publicDemo.criteriaHistory.length > 30 ||
          !lab.publicDemo.decisions || typeof lab.publicDemo.decisions !== "object" ||
          typeof lab.publicDemo.screened !== "boolean" ||
          typeof lab.publicDemo.revealed !== "boolean" ||
          !Array.isArray(lab.publicDemo.records) || lab.publicDemo.records.length > 20)
        return fail("公開複驗的採信標準格式錯誤");
      for (var decisionId of Object.keys(lab.publicDemo.decisions)) {
        if (!/^[A-F]$/.test(decisionId) || typeof lab.publicDemo.decisions[decisionId] !== "boolean")
          return fail("公開複驗的收退判定格式錯誤");
      }
      for (var publicRow of lab.publicDemo.records) {
        if (!publicRow || !/^[A-F]$/.test(publicRow.id) ||
            [2, 3, 4].indexOf(publicRow.equalSegments) < 0 ||
            ["hand", "latch"].indexOf(publicRow.release) < 0 ||
            typeof publicRow.dual !== "boolean" ||
            typeof publicRow.offset !== "number" || !isFinite(publicRow.offset))
          return fail("公開複驗紀錄格式錯誤");
      }
    }
    /* v1.1 追加欄位採可選驗證，讓 v1 舊存檔仍可匯入；引擎第一次相關動作會補齊。 */
    if (lab.cabinResults != null) {
      for (var vessel of ["dock", "steady"]) for (var test of ["drip", "toss"]) {
        var cell = lab.cabinResults[vessel] && lab.cabinResults[vessel][test];
        /* v1.2 改為每格可重做、保存多筆；仍接受 v1.1 的單一彙整物件。 */
        var cells = cell == null ? [] : (Array.isArray(cell) ? cell : [cell]);
        if (cells.length > 100) return fail("船艙比較紀錄筆數異常");
        for (var cr = 0; cr < cells.length; cr++) {
          var cabinRun = cells[cr];
          if (!cabinRun || typeof cabinRun.offset !== "number" || !isFinite(cabinRun.offset) ||
              typeof cabinRun.spread !== "number" || !isFinite(cabinRun.spread) ||
              cabinRun.spread < 0 || cabinRun.spread > 10)
            return fail("船艙比較紀錄含無法辨識的讀值");
        }
      }
    }
    if (lab.claims != null) {
      var allowedConcepts = {
        g1: ["mast-pulls-stone", "steady-shares-motion", "weight-finds-foot"],
        g2: ["air-is-gone", "ship-too-slow", "steady-matches-dock",
          "local-common-motion-wind-below-spread"],
        g3: ["speed-change-breaks-shared-motion", "stone-loses-force", "wind-reverses"],
        g4: ["one-record-false", "same-event-different-reference", "paper-distorts-path"]
      };
      for (var claimId of ["g1", "g2", "g3", "g4"]) {
        var claimRows = lab.claims[claimId];
        if (!Array.isArray(claimRows) || claimRows.length > 100) return fail("航船斷言紀錄格式錯誤");
        for (var ci = 0; ci < claimRows.length; ci++) {
          var claim = claimRows[ci];
          if (!claim || !Array.isArray(claim.sources) || claim.sources.length > 20 ||
              claim.sources.some(function (source) { return typeof source !== "string" || source.length > 120; }) ||
              allowedConcepts[claimId].indexOf(claim.concept) < 0 || typeof claim.ok !== "boolean")
            return fail("航船斷言紀錄含無法辨識的資料");
        }
      }
    }
    if (lab.caseFile != null) {
      var cf = lab.caseFile;
      var validCaseStage = ["v1", "v2", "v3", "wind", "cabin", "v4", "dual", "public"];
      if (!cf || [null, "release", "speed", "wind"].indexOf(cf.firstControl) < 0 ||
          typeof cf.crewConfirmed !== "boolean" || !cf.voyages || !Array.isArray(cf.attempts) ||
          !Array.isArray(cf.fingerprintAttempts) || !Array.isArray(cf.dualAttempts) ||
          !Array.isArray(cf.boundaryAttempts) || cf.attempts.length > 100 ||
          cf.fingerprintAttempts.length > 30 || cf.dualAttempts.length > 30 ||
          cf.boundaryAttempts.length > 30 ||
          [null, "wind-not-systematic"].indexOf(cf.windJudgment) < 0 ||
          [null, "indistinguishable"].indexOf(cf.cabinJudgment) < 0 ||
          [null, "fore", "aft", "foot"].indexOf(cf.decelPrediction) < 0 ||
          typeof cf.fingerprintComplete !== "boolean" ||
          typeof cf.transformProgress !== "number" || !isFinite(cf.transformProgress) ||
          cf.transformProgress < 0 || cf.transformProgress > 1 ||
          typeof cf.dualNamed !== "boolean" ||
          typeof cf.publicCriteriaConfirmed !== "boolean" ||
          typeof cf.publicComplete !== "boolean" ||
          [null, "honest"].indexOf(cf.boundary) < 0)
        return fail("第三章航次卷宗格式錯誤");
      for (var caseStage of validCaseStage) {
        var caseRun = cf.voyages[caseStage];
        if (caseRun != null && (!caseRun || caseRun.stage !== caseStage))
          return fail("第三章航次卷宗含無法辨識的航次");
      }
      for (var caseAttempt of cf.attempts) {
        if (!caseAttempt || typeof caseAttempt.stage !== "string" || caseAttempt.stage.length > 40)
          return fail("第三章航次卷宗含無法辨識的操作紀錄");
      }
      if (cf.dossier != null) {
        var dossier = cf.dossier;
        /* GB-ADR-035：舊存檔沒有 A4 範圍承諾欄。已對齊／已完成者視為
           當時已作過承諾；尚未對齊者必須在新流程親自回答。 */
        if (dossier && dossier.debate && dossier.debate.p3 &&
            dossier.debate.p3.scope == null) {
          dossier.debate.p3.scope = !!(dossier.debate.p3.aligned ||
            dossier.debate.p3.transformed ||
            (dossier.assertions && (dossier.assertions.A4 || dossier.assertions.A5)));
        }
        if (!dossier || ["lab", "debate"].indexOf(dossier.page) < 0 || !dossier.draft ||
            (dossier.draft.location != null && ["deck", "cabin"].indexOf(dossier.draft.location) < 0) ||
            (dossier.draft.vesselId != null && ["small", "captain", "large"].indexOf(dossier.draft.vesselId) < 0) ||
            ["dock", "steady", "depart", "brake"].indexOf(dossier.draft.stage) < 0 ||
            ["hand", "string", "latch"].indexOf(dossier.draft.release) < 0 ||
            ["none", "verbal", "beats"].indexOf(dossier.draft.speedRecord) < 0 ||
            ["mast", "deck", "shore", "dual"].indexOf(dossier.draft.positionRecord) < 0 ||
            [1, 2, 3].indexOf(Number(dossier.draft.repeats)) < 0 ||
            (dossier.draft.speedBand != null && ["slow", "mid", "fast"].indexOf(dossier.draft.speedBand) < 0) ||
            (dossier.draft.forceBand != null && ["soft", "hard"].indexOf(dossier.draft.forceBand) < 0) ||
            (dossier.draft.beatBand != null && ["slow", "mid", "fast"].indexOf(dossier.draft.beatBand) < 0) ||
            typeof dossier.draft.sameStone !== "boolean" ||
            typeof dossier.draft.sameHeight !== "boolean" ||
            (dossier.borrowedVessels != null && (!Array.isArray(dossier.borrowedVessels) ||
              dossier.borrowedVessels.length > 3 ||
              dossier.borrowedVessels.some(function (id) {
                return ["small", "captain", "large"].indexOf(id) < 0;
              }))) ||
            !Array.isArray(dossier.records) || dossier.records.length > 100 ||
            (dossier.pendingRecord != null && typeof dossier.pendingRecord !== "object") ||
            !dossier.assertions || !dossier.candidates ||
            (dossier.claimSelections != null && (!dossier.claimSelections ||
              typeof dossier.claimSelections !== "object")) ||
            (dossier.proposedScopes != null && (!dossier.proposedScopes ||
              typeof dossier.proposedScopes !== "object")) ||
            (dossier.designCommitments != null && (!dossier.designCommitments ||
              typeof dossier.designCommitments !== "object" ||
              (dossier.designCommitments.cabinWind != null &&
                dossier.designCommitments.cabinWind !== "close-cabin") ||
              (dossier.designCommitments.cabinInstrument != null &&
                ["drip", "toss", "combined"].indexOf(
                  dossier.designCommitments.cabinInstrument
                ) < 0) ||
              !Array.isArray(dossier.designCommitments.cabinWindAttempts || []) ||
              !Array.isArray(dossier.designCommitments.cabinInstrumentAttempts || []) ||
              (dossier.designCommitments.cabinInstrumentAttempts || []).length > 30)) ||
            (dossier.assertionSources != null && (!dossier.assertionSources ||
              typeof dossier.assertionSources !== "object")) ||
            (dossier.sourceAttempts != null && (!Array.isArray(dossier.sourceAttempts) ||
              dossier.sourceAttempts.length > 200)) ||
            !Array.isArray(dossier.scopeAttempts) || dossier.scopeAttempts.length > 100 ||
            !dossier.blind || !Array.isArray(dossier.blind.attempts) ||
            (dossier.blind.records != null && (!Array.isArray(dossier.blind.records) ||
              dossier.blind.records.length > 60)) ||
            dossier.blind.attempts.length > 50 || !dossier.debate ||
            typeof dossier.debate.active !== "boolean" ||
            !isInt(dossier.debate.rep) || dossier.debate.rep < 0 || dossier.debate.rep > 5 ||
            [null, "p1", "p2", "p3"].indexOf(dossier.debate.current) < 0 ||
            !Array.isArray(dossier.debate.pins) || dossier.debate.pins.length > 50 ||
            !Array.isArray(dossier.debate.attempts) || dossier.debate.attempts.length > 200 ||
            !dossier.debate.pillars || !dossier.debate.p1 || !dossier.debate.p2 || !dossier.debate.p3 ||
            ["p1", "p2", "p3"].some(function (pillarId) {
              return typeof dossier.debate.pillars[pillarId] !== "boolean";
            }) ||
            (dossier.debate.p1.source != null && dossier.debate.p1.source !== "A1") ||
            ["concept", "steady", "cabin", "wind"].some(function (field) {
              return typeof dossier.debate.p1[field] !== "boolean";
            }) ||
            (dossier.debate.p2.source != null && dossier.debate.p2.source !== "A3") ||
            (dossier.debate.p3.source != null && dossier.debate.p3.source !== "dual-papers") ||
            (dossier.debate.p2.scope != null && typeof dossier.debate.p2.scope !== "boolean") ||
            (dossier.debate.p2.scopeDiagnosis != null &&
              ["not-required", "required", "complete"].indexOf(dossier.debate.p2.scopeDiagnosis) < 0) ||
            (dossier.debate.p3.sourceRecordId != null &&
              (!isInt(dossier.debate.p3.sourceRecordId) || dossier.debate.p3.sourceRecordId < 1)) ||
            typeof dossier.debate.p3.scope !== "boolean" ||
            (dossier.debate.p3.transformMode != null &&
              dossier.debate.p3.transformMode !== "subtract-each-beat") ||
            (dossier.debate.p3.transformedPoints != null &&
              (!Array.isArray(dossier.debate.p3.transformedPoints) ||
                dossier.debate.p3.transformedPoints.length > 20)) ||
            (dossier.debate.p3.transformTolerance != null &&
              (typeof dossier.debate.p3.transformTolerance !== "number" ||
                !isFinite(dossier.debate.p3.transformTolerance) ||
                dossier.debate.p3.transformTolerance < 0 ||
                dossier.debate.p3.transformTolerance > 10)) ||
            (dossier.debate.p3.maxResidual != null &&
              (typeof dossier.debate.p3.maxResidual !== "number" ||
                !isFinite(dossier.debate.p3.maxResidual) ||
                dossier.debate.p3.maxResidual < 0 ||
                dossier.debate.p3.maxResidual > 10)) ||
            !Array.isArray(dossier.debate.p3.alignAttempts) ||
            !Array.isArray(dossier.debate.p3.transformAttempts) ||
            typeof dossier.complete !== "boolean")
          return fail("第三章自由實驗卷宗格式錯誤");
        /*
         * 舊存檔曾把「船艙／甲板」「換石頭」「改高度」畫成可調變因，
         * 但自由落石模型並沒有對應的物理變化。載入後正規化為目前真正
         * 可執行的甲板流程，避免存檔把已移除的假選項帶回介面。
         */
        dossier.draft.location = "deck";
        dossier.draft.sameStone = true;
        dossier.draft.sameHeight = true;
        if (dossier.debate.p3.transformedPoints != null) {
          for (var savedTransformPoint of dossier.debate.p3.transformedPoints) {
            if (!savedTransformPoint || !isInt(savedTransformPoint.beat) ||
                savedTransformPoint.beat < 0 || savedTransformPoint.beat > 20 ||
                typeof savedTransformPoint.t !== "number" || !isFinite(savedTransformPoint.t) ||
                savedTransformPoint.t < 0 || savedTransformPoint.t > 10 ||
                typeof savedTransformPoint.y !== "number" || !isFinite(savedTransformPoint.y) ||
                savedTransformPoint.y < 0 || savedTransformPoint.y > 100 ||
                typeof savedTransformPoint.shoreRelativeX !== "number" ||
                !isFinite(savedTransformPoint.shoreRelativeX) ||
                Math.abs(savedTransformPoint.shoreRelativeX) > 100 ||
                typeof savedTransformPoint.shipX !== "number" ||
                !isFinite(savedTransformPoint.shipX) ||
                Math.abs(savedTransformPoint.shipX) > 100 ||
                typeof savedTransformPoint.residual !== "number" ||
                !isFinite(savedTransformPoint.residual) ||
                Math.abs(savedTransformPoint.residual) > 10)
              return fail("第三章逐拍換尺資料格式錯誤");
          }
        }
        /*
         * C1、C2… 是目前逐回船艙原紙；C-dock／C-steady 是舊存檔
         * 在遷移前留下的兩組合併代號。兩者都須可安全匯入。
         */
        var sourcePattern = /^(OLD|R[1-9][0-9]*|C[1-9][0-9]*|C-(dock|steady))$/;
        for (var selectionMap of [dossier.claimSelections, dossier.assertionSources]) {
          if (selectionMap == null) continue;
          for (var assertionId in selectionMap) {
            var sourceIds = selectionMap[assertionId];
            if (!Array.isArray(sourceIds) || sourceIds.length > 30 ||
                sourceIds.some(function (sourceId) {
                  return typeof sourceId !== "string" || !sourcePattern.test(sourceId);
                }))
              return fail("第三章斷言含無法辨識的原始資料");
          }
        }
        var dossierRows = dossier.records.slice();
        if (dossier.pendingRecord != null) dossierRows.push(dossier.pendingRecord);
        var validP3Records = [], validP3ById = {};
        for (var dr of dossierRows) {
          if (!dr || !isInt(dr.id) || dr.id < 1 ||
              (dr.location != null && dr.location !== "deck") ||
              (dr.vesselId != null && ["small", "captain", "large"].indexOf(dr.vesselId) < 0) ||
              (dr.vesselName != null && (typeof dr.vesselName !== "string" || dr.vesselName.length > 80)) ||
              (dr.mastHeight != null && (typeof dr.mastHeight !== "number" || !isFinite(dr.mastHeight) ||
                dr.mastHeight < 1 || dr.mastHeight > 50)) ||
              (dr.releaseOperator != null && (typeof dr.releaseOperator !== "string" || dr.releaseOperator.length > 80)) ||
              (dr.rowingCrew != null && (typeof dr.rowingCrew !== "string" || dr.rowingCrew.length > 120)) ||
              (dr.rowingMethod != null && (typeof dr.rowingMethod !== "string" || dr.rowingMethod.length > 80)) ||
              (dr.borrowDays != null && (!isInt(dr.borrowDays) || dr.borrowDays < 0 || dr.borrowDays > 2)) ||
              ["dock", "steady", "depart", "brake"].indexOf(dr.stage) < 0 ||
              ["hand", "string", "latch"].indexOf(dr.release) < 0 ||
              ["none", "verbal", "beats"].indexOf(dr.speedRecord) < 0 ||
              ["mast", "deck", "shore", "dual"].indexOf(dr.positionRecord) < 0 ||
              [1, 2, 3].indexOf(Number(dr.repeats)) < 0 ||
              (dr.speedBand != null && ["slow", "mid", "fast"].indexOf(dr.speedBand) < 0) ||
              (dr.forceBand != null && ["soft", "hard"].indexOf(dr.forceBand) < 0) ||
              (dr.beatBand != null && ["slow", "mid", "fast"].indexOf(dr.beatBand) < 0) ||
              (dr.dualPapers != null && typeof dr.dualPapers !== "boolean") ||
              (dr.filed != null && typeof dr.filed !== "boolean") ||
              !Array.isArray(dr.offsets) || dr.offsets.length < 1 || dr.offsets.length > 3 ||
              dr.offsets.some(function (n) { return typeof n !== "number" || !isFinite(n) || Math.abs(n) > 10; }))
            return fail("第三章自由實驗卷宗含無法辨識的原始紀錄");
          if (dr.papers != null) {
            if (!dr.papers || typeof dr.papers !== "object") return fail("第三章觀察原紙格式錯誤");
            for (var paperKey of ["shore", "ship"]) {
              var paper = dr.papers[paperKey];
              if (paper == null) continue;
              if (!paper || typeof paper.observer !== "string" || paper.observer.length > 40 ||
                  typeof paper.origin !== "string" || paper.origin.length > 80 ||
                  !Array.isArray(paper.beats) || paper.beats.length > 20 ||
                  !Array.isArray(paper.landings) || paper.landings.length > 3 ||
                  (paper.readingError != null &&
                    (typeof paper.readingError !== "number" || !isFinite(paper.readingError) ||
                      paper.readingError < 0 || paper.readingError > 1)) ||
                  paper.landings.some(function (n) {
                    return typeof n !== "number" || !isFinite(n) || Math.abs(n) > 10;
                  }))
                return fail("第三章觀察原紙格式錯誤");
              for (var beat of paper.beats) {
                if (!beat || !isInt(beat.beat) || beat.beat < 0 || beat.beat > 20 ||
                    typeof beat.t !== "number" || !isFinite(beat.t) || beat.t < 0 || beat.t > 10 ||
                    typeof beat.mastX !== "number" || !isFinite(beat.mastX) || Math.abs(beat.mastX) > 100 ||
                    typeof beat.stoneX !== "number" || !isFinite(beat.stoneX) || Math.abs(beat.stoneX) > 100 ||
                    typeof beat.y !== "number" || !isFinite(beat.y) || beat.y < 0 || beat.y > 100)
                  return fail("第三章觀察原紙含無法辨識的鼓點");
              }
            }
          }
          if (dr.animation != null) {
            if (!dr.animation || !Array.isArray(dr.animation.path) || dr.animation.path.length > 40)
              return fail("第三章落石動畫格式錯誤");
            for (var point of dr.animation.path) {
              if (!point || typeof point.t !== "number" || !isFinite(point.t) ||
                  typeof point.mastX !== "number" || !isFinite(point.mastX) ||
                  typeof point.stoneX !== "number" || !isFinite(point.stoneX) ||
                  typeof point.relativeX !== "number" || !isFinite(point.relativeX) ||
                  typeof point.y !== "number" || !isFinite(point.y))
                return fail("第三章落石動畫含無法辨識的座標");
            }
          }
          var animationWasInconsistent = dr.animation != null && !ch3AnimationConsistent(dr.animation);
          if (animationWasInconsistent) delete dr.animation;
          var dualData = ch3DualPaperData(dr);
          /*
           * 原紙不一致時不替玩家補畫或改數字：只取消這筆的雙紙資格。
           * 原始紀錄與兩張紙仍留在卷宗供查核，其他章節進度也不受影響。
           */
          if (dr.dualPapers == null && dualData.ok && !animationWasInconsistent &&
              dr.release === "latch" && dr.speedRecord === "beats")
            dr.dualPapers = true; /* 舊存檔兼容：由可驗證的兩張原紙恢復資格。 */
          if (dr.dualPapers && (!dualData.ok || animationWasInconsistent)) dr.dualPapers = false;
          if (dr !== dossier.pendingRecord && dr.filed !== false && dr.dualPapers &&
              dualData.ok && dualData.p3Eligible) {
            if (Object.prototype.hasOwnProperty.call(validP3ById, dr.id))
              validP3ById[dr.id] = null; /* 重複編號不可作第三柱來源。 */
            else {
              var validP3Entry = { record: dr, dualData: dualData };
              validP3ById[dr.id] = validP3Entry;
              validP3Records.push(validP3Entry);
            }
          }
        }
        validP3Records = validP3Records.filter(function (entry) {
          return validP3ById[entry.record.id] === entry;
        });
        var p3 = dossier.debate.p3;
        var p3HasProgress = p3.sourceRecordId != null || p3.source === "dual-papers" ||
          p3.question || p3.concept ||
          p3.transformMode === "subtract-each-beat" ||
          (Array.isArray(p3.transformedPoints) && p3.transformedPoints.length > 0) ||
          p3.aligned || p3.transformed || dossier.assertions.A4 || dossier.assertions.A5 ||
          dossier.debate.pillars.p3;
        /*
         * 舊存檔只有泛稱 dual-papers，沒有 sourceRecordId。若實際卷宗裡仍有
         * 合格雙紙，綁定最後一筆已簽收原紙；若沒有，只退回第三柱，不清空全章。
         */
        if (p3.sourceRecordId == null && p3HasProgress && validP3Records.length)
          p3.sourceRecordId = validP3Records[validP3Records.length - 1].record.id;
        var sourceEntry = p3.sourceRecordId == null ? null : validP3ById[p3.sourceRecordId];
        if (sourceEntry && p3.source == null) p3.source = "dual-papers";
        if (p3HasProgress && !sourceEntry) {
          ch3ResetP3Derived(lab, cf, dossier, false);
        } else if (sourceEntry) {
          if (p3.transformed && p3.transformedPoints == null) {
            /* v1 舊存檔尚無逐拍衍生表；不信任孤立的彙總數字。 */
            delete p3.transformTolerance;
            delete p3.maxResidual;
          }
          var transformDataOk = ch3TransformedPointsConsistent(p3, sourceEntry.dualData);
          if (!p3.transformed) {
            delete p3.transformTolerance;
            delete p3.maxResidual;
            if (!transformDataOk) ch3ResetP3Derived(lab, cf, dossier, true);
            else if (Array.isArray(p3.transformedPoints) && p3.transformedPoints.length &&
                p3.transformMode == null)
              p3.transformMode = "subtract-each-beat";
          } else if (!transformDataOk) {
            ch3ResetP3Derived(lab, cf, dossier, true);
          } else if (p3.transformMode == null) {
            p3.transformMode = "subtract-each-beat";
          }
        }
        for (var cabinRow of dossier.blind.records || []) {
          if (cabinRow && cabinRow.instrument == null &&
              cabinRow.water === "水面沒有固定偏向" &&
              cabinRow.ball === "小球落在放手點正下方")
            cabinRow.instrument = "combined";
          if (!cabinRow || !/^C[1-9][0-9]*$/.test(cabinRow.id || "") ||
              ["dock", "steady"].indexOf(cabinRow.stage) < 0 ||
              ["drip", "toss", "combined"].indexOf(cabinRow.instrument) < 0 ||
              typeof cabinRow.stageLabel !== "string" || cabinRow.stageLabel.length > 40 ||
              typeof cabinRow.observer !== "string" || cabinRow.observer.length > 160 ||
              typeof cabinRow.classification !== "string" || cabinRow.classification.length > 80 ||
              !Array.isArray(cabinRow.shoreGaps) || cabinRow.shoreGaps.length !== 3 ||
              cabinRow.shoreGaps.some(function (n) {
                return typeof n !== "number" || !isFinite(n) || Math.abs(n) > 20;
              }) ||
              typeof cabinRow.water !== "string" || cabinRow.water.length > 80 ||
              typeof cabinRow.ball !== "string" || cabinRow.ball.length > 80 ||
              !ch3CabinRowConsistent(cabinRow))
            return fail("第三章船艙原紙格式錯誤");
        }
        if (dossier.blind.judgment === "comparison-recorded") {
          var blindDockCount = dossier.blind.records.filter(function (row) {
            return row.stage === "dock";
          }).length;
          var blindSteadyCount = dossier.blind.records.filter(function (row) {
            return row.stage === "steady";
          }).length;
          if (blindDockCount < 3 || blindSteadyCount < 3)
            return fail("第三章船艙對照回數不足");
        }
      }
    }
    if (!Array.isArray(state.transcript) || state.transcript.length > 3000) return fail("對話紀錄格式錯誤");
    var legacyTranscriptScenes = { "C2-2B": 1, "C3-3": 1, "C3-4": 1 };
    for (var t = 0; t < state.transcript.length; t++) {
      var line = state.transcript[t];
      if (!line || (!sceneIds[line.scene] && !legacyTranscriptScenes[line.scene]) ||
          typeof line.text !== "string" || line.text.length > 2000)
        return fail("對話紀錄中有一筆格式錯誤");
    }
    return { ok: true, state: state };
  }

  /* 第四章白名單：軌道向量、跨尺度預測、模型比較與校樣窗口。
     匯入檔只能攜帶有限的數值／列舉；證據仍須能由引擎動作路徑重建。 */
  function sanitizeImport4(state, scenes, engine4) {
    if (!state || typeof state !== "object") return fail("存檔內容格式錯誤");
    var generic = scrub(state, 0, { n: LIMITS.maxNodes });
    if (generic) return fail(generic);
    if (state.schemaVersion !== 2 || state.chapter !== "ch4") return fail("存檔版本或章節不相容");
    if (state.mode !== "explore" && state.mode !== "scholar") return fail("遊戲模式無法辨識");
    if (!isInt(state.rep) || state.rep < 0 || state.rep > 5) return fail("信譽數值錯誤");
    var sceneIds = {}, nodeIds = {}, sceneOrder = {}, nodeOrder = {};
    (scenes && scenes.scenes || []).forEach(function (s, sceneIndex) {
      sceneIds[s.id] = 1; sceneOrder[s.id] = sceneIndex;
      nodeIds[s.id] = {}; nodeOrder[s.id] = {};
      (s.nodes || []).forEach(function (n, nodeIndex) {
        nodeIds[s.id][n.id] = 1;
        nodeOrder[s.id][n.id] = nodeIndex;
      });
    });
    if (!state.cursor || !sceneIds[state.cursor.scene] || !nodeIds[state.cursor.scene][state.cursor.node])
      return fail("存檔中的故事位置無法辨識");
    var reputation = sanitizeReputationLifecycle(state, scenes, "ch4");
    if (!reputation.ok) return reputation;
    var milestoneCursor = reputation.effectiveCursor;
    function cursorPastMilestone(gateScene, gateNode) {
      var currentSceneIndex = sceneOrder[milestoneCursor.scene];
      var gateSceneIndex = sceneOrder[gateScene];
      if (currentSceneIndex > gateSceneIndex) return true;
      return currentSceneIndex === gateSceneIndex &&
        nodeOrder[milestoneCursor.scene][milestoneCursor.node] >
          nodeOrder[gateScene][gateNode];
    }
    var lab = state.lab;
    if (!lab || !isInt(lab.days) || lab.days < 0 || lab.days > 9999 ||
        !isInt(lab.sequence) || lab.sequence < 0 || lab.sequence > 999999 ||
        !lab.sourceLab || !lab.orbitLab || !lab.scaleLab || !lab.planetLab ||
        !lab.modelLab || !lab.proof || !lab.evidence)
      return fail("第四章實驗紀錄格式錯誤");
    var migratedV1 = false;
    var migrationSourceEvidence = null;
    var legacySceneOrder4 = [
      "D0-1", "D0-2", "D1-1", "D1-2", "D1-3", "D2-1", "D2-2",
      "D2-3", "D3-1", "D3-2", "D3-3", "D3-4", "DE-1", "DE-2"
    ];
    var legacyGateNodes4 = {
      "D1-1": ["n1", "n2", "c1", "w1", "w2", "w3", "w4", "ok1",
        "ok2", "ok3", "e1", "n3", "n4", "n5", "n6", "n7", "g1"],
      "D2-2": ["n0", "n0a", "n0h", "n1", "e1", "n2", "n3", "n4", "n5", "g1"],
      "D2-3": ["c1", "n1", "n1a", "n1b", "n1c", "n1d", "n1e", "n1f",
        "n2", "n3", "n4", "n4a", "n4b", "e1", "n5", "n6", "n7", "n8", "g1"]
    };
    function legacyCursorPast4(cursor, gateScene, gateNode) {
      var currentSceneIndex = legacySceneOrder4.indexOf(cursor && cursor.scene);
      var gateSceneIndex = legacySceneOrder4.indexOf(gateScene);
      if (currentSceneIndex < 0) return false;
      if (currentSceneIndex > gateSceneIndex) return true;
      if (currentSceneIndex < gateSceneIndex) return false;
      var nodes = legacyGateNodes4[gateScene] || [];
      var currentNodeIndex = nodes.indexOf(cursor.node);
      var gateNodeIndex = nodes.indexOf(gateNode);
      return currentNodeIndex > gateNodeIndex;
    }
    if (state.migration != null) {
      var migration = state.migration;
      var migrationEvidence = ["K1", "K2", "K3", "K4", "K5"];
      var migrationReacquire = migration && migration.reacquire;
      migrationSourceEvidence = migration && migration.sourceEvidence;
      var migrationEvents = Array.isArray(state.eventLog)
        ? state.eventLog.filter(function (event) { return event && event.t === "migration"; })
        : [];
      if (!migration || migration.fromSchema !== 1 || migration.toSchema !== 2 ||
          migration.backupRequired !== true ||
          !isInt(migration.baseSequence) || migration.baseSequence < 0 ||
          migration.baseSequence > lab.sequence ||
          !migration.originalCursor || typeof migration.originalCursor.scene !== "string" ||
          typeof migration.originalCursor.node !== "string" ||
          legacySceneOrder4.indexOf(migration.originalCursor.scene) < 0 ||
          !migration.targetCursor || !sceneIds[migration.targetCursor.scene] ||
          !nodeIds[migration.targetCursor.scene][migration.targetCursor.node] ||
          !migrationSourceEvidence || typeof migrationSourceEvidence !== "object" ||
          Array.isArray(migrationSourceEvidence) ||
          Object.keys(migrationSourceEvidence).length !== migrationEvidence.length ||
          migrationEvidence.some(function (id) {
            return typeof migrationSourceEvidence[id] !== "boolean";
          }) ||
          !Array.isArray(migrationReacquire) ||
          migrationReacquire.length !== new Set(migrationReacquire).size ||
          migrationReacquire.some(function (id) {
            return migrationEvidence.indexOf(id) < 0;
          }) ||
          [null, "transcript", "eventLog", "transcript+eventLog"]
            .indexOf(migration.k0ProvenBy == null ? null : migration.k0ProvenBy) < 0 ||
          typeof state.migrationNotice !== "string" || !state.migrationNotice ||
          migrationEvents.length !== 1 ||
          migrationEvents[0].fromSchema !== 1 ||
          migrationEvents[0].toSchema !== 2 ||
          migrationEvents[0].from !==
            migration.originalCursor.scene + "/" + migration.originalCursor.node ||
          migrationEvents[0].to !==
            migration.targetCursor.scene + "/" + migration.targetCursor.node ||
          JSON.stringify(migrationEvents[0].sourceEvidence) !==
            JSON.stringify(migrationSourceEvidence) ||
          migrationEvents[0].baseSequence !== migration.baseSequence ||
          JSON.stringify(migrationEvents[0].reacquire) !==
            JSON.stringify(migrationReacquire))
        return fail("第四章遷移來源標記不完整或彼此矛盾");
      migratedV1 = true;
    }
    var tangent = lab.sourceLab.tangentPrediction;
    if (!tangent || typeof tangent.sealed !== "boolean" ||
        (tangent.choice != null && ["arc", "fall", "tangent"].indexOf(tangent.choice) < 0) ||
        (tangent.sealed && (tangent.choice !== "tangent" || !isInt(tangent.sealedAt) ||
          tangent.sealedAt < 1 || tangent.sealedAt > lab.sequence)) ||
        !Array.isArray(lab.sourceLab.attempts) || lab.sourceLab.attempts.length > 30)
      return fail("切線來源紙格式錯誤");
    for (var sta = 0; sta < lab.sourceLab.attempts.length; sta++) {
      var sourceAttempt = lab.sourceLab.attempts[sta];
      if (!sourceAttempt ||
          ["arc", "fall", "tangent"].indexOf(sourceAttempt.choice) < 0 ||
          typeof sourceAttempt.ok !== "boolean" ||
          sourceAttempt.ok !== (sourceAttempt.choice === "tangent") ||
          !isInt(sourceAttempt.at) || sourceAttempt.at < 1 ||
          sourceAttempt.at > lab.sequence)
        return fail("切線來源紙嘗試紀錄格式錯誤");
      if (sta && sourceAttempt.at <= lab.sourceLab.attempts[sta - 1].at)
        return fail("切線來源紙嘗試時間重複或倒置");
    }
    var successfulTangentAttempts = lab.sourceLab.attempts.filter(function (attempt) {
      return attempt.choice === "tangent" && attempt.ok === true;
    });
    if (tangent.sealed) {
      if (successfulTangentAttempts.length !== 1 ||
          successfulTangentAttempts[0] !==
            lab.sourceLab.attempts[lab.sourceLab.attempts.length - 1] ||
          successfulTangentAttempts[0].at !== tangent.sealedAt ||
          !lab.orbitLab.tangentRecord ||
          (engine4 && !engine4._tangentRecordAudit(lab.orbitLab.tangentRecord)) ||
          (lab.orbitLab.tangentRecord.source === "schema1-player-choice" &&
            !migratedV1))
        return fail("切線來源紙缺少唯一且可重算的玩家封存紀錄");
    } else if (tangent.choice != null || tangent.sealedAt != null ||
        successfulTangentAttempts.length || lab.orbitLab.tangentRecord != null) {
      return fail("未封存切線來源紙混入完成資料");
    }
    if (!isInt(lab.orbitLab.attempt) || lab.orbitLab.attempt < 0 || lab.orbitLab.attempt > 999 ||
        !isInt(lab.orbitLab.step) || lab.orbitLab.step < 0 || lab.orbitLab.step > 3 ||
        !Array.isArray(lab.orbitLab.path) || lab.orbitLab.path.length > 200 ||
        !Array.isArray(lab.orbitLab.deflectionVectors) || lab.orbitLab.deflectionVectors.length > 3)
      return fail("軌道路徑紀錄格式錯誤");
    for (var pi = 0; pi < lab.orbitLab.path.length; pi++) {
      var point = lab.orbitLab.path[pi];
      if (!point || !isFinite(point.x) || !isFinite(point.y)) return fail("軌道路徑含無法辨識的座標");
    }
    if (lab.orbitLab.ruleRuns != null) {
      if (!Array.isArray(lab.orbitLab.ruleRuns) || lab.orbitLab.ruleRuns.length > 100)
        return fail("改向規則紀錄格式錯誤");
      var orbitShapeValues = ["line", "away", "circle", "ellipse", "crash", "wrong-center"];
      var orbitOutcomeValues = ["parabola", "wrong-center", "outer-band", "inner-band", "near-circle"];
      for (var ori = 0; ori < lab.orbitLab.ruleRuns.length; ori++) {
        var orbitRun = lab.orbitLab.ruleRuns[ori];
        if (!orbitRun || orbitRun.id !== ori + 1 ||
            ["same-vector", "ink-mark", "earth-center"].indexOf(orbitRun.target) < 0 ||
            ["slow", "medium", "fast"].indexOf(orbitRun.speed) < 0 ||
            ["short", "medium", "long"].indexOf(orbitRun.strength) < 0 ||
            orbitShapeValues.indexOf(orbitRun.prediction) < 0 ||
            orbitShapeValues.indexOf(orbitRun.actualShape) < 0 ||
            orbitOutcomeValues.indexOf(orbitRun.outcome) < 0 ||
            typeof orbitRun.predictionMatched !== "boolean" ||
            !isInt(orbitRun.sealedAt) || !isInt(orbitRun.firstStepAt) ||
            !isInt(orbitRun.continuedAt) ||
            !(orbitRun.sealedAt < orbitRun.firstStepAt &&
              orbitRun.firstStepAt < orbitRun.continuedAt) ||
            !Array.isArray(orbitRun.playerBeats) || orbitRun.playerBeats.length !== 3 ||
            !Array.isArray(orbitRun.path) || orbitRun.path.length > 200 ||
            (engine4 && !engine4._orbitRunAudit(orbitRun)))
          return fail("改向規則含無法辨識的設定");
        if (ori &&
            (!(lab.orbitLab.ruleRuns[ori - 1].sealedAt < orbitRun.sealedAt) ||
              !(lab.orbitLab.ruleRuns[ori - 1].continuedAt <
                orbitRun.continuedAt)))
          return fail("改向規則歷史順序與操作時間不一致");
      }
    }
    if (!Array.isArray(lab.orbitLab.manualBeats) || lab.orbitLab.manualBeats.length > 3 ||
        !Array.isArray(lab.orbitLab.manualAttempts) || lab.orbitLab.manualAttempts.length > 100 ||
        typeof lab.orbitLab.manualComplete !== "boolean")
      return fail("親手三拍紀錄格式錯誤");
    for (var mai = 0; mai < lab.orbitLab.manualAttempts.length; mai++) {
      var manualAttempt = lab.orbitLab.manualAttempts[mai];
      var attemptSeal = manualAttempt && manualAttempt.seal;
      if (!manualAttempt || !attemptSeal ||
          ["same-vector", "ink-mark", "earth-center"].indexOf(attemptSeal.target) < 0 ||
          ["slow", "medium", "fast"].indexOf(attemptSeal.speed) < 0 ||
          ["short", "medium", "long"].indexOf(attemptSeal.strength) < 0 ||
          ["line", "away", "circle", "ellipse", "crash", "wrong-center"].indexOf(attemptSeal.prediction) < 0 ||
          !isInt(attemptSeal.sealedAt) || attemptSeal.sealedAt < 1 ||
          !Array.isArray(manualAttempt.beats) ||
          manualAttempt.beats.length < 1 || manualAttempt.beats.length > 3 ||
          typeof manualAttempt.complete !== "boolean" ||
          !isInt(manualAttempt.resetAt) || manualAttempt.resetAt > lab.sequence ||
          (engine4 && !engine4._orbitAttemptAudit(manualAttempt)))
        return fail("幽靈作圖紙格式錯誤");
      for (var mab = 0; mab < manualAttempt.beats.length; mab++) {
        var oldBeat = manualAttempt.beats[mab];
        if (!oldBeat || oldBeat.step !== mab + 1 || !isInt(oldBeat.at) ||
            oldBeat.at <= attemptSeal.sealedAt ||
            !oldBeat.before || !isFinite(oldBeat.before.x) || !isFinite(oldBeat.before.y) ||
            !oldBeat.after || !isFinite(oldBeat.after.x) || !isFinite(oldBeat.after.y) ||
            !isFinite(oldBeat.aimAngle) || !isFinite(oldBeat.expectedAngle) ||
            !isFinite(oldBeat.angleCurrentDeg) || !isFinite(oldBeat.anglePreviousDeg) ||
            typeof oldBeat.valid !== "boolean")
          return fail("幽靈作圖紙含無法辨識的方向");
        if (mab && oldBeat.at <= manualAttempt.beats[mab - 1].at)
          return fail("幽靈作圖紙時間線不一致");
      }
      if (manualAttempt.resetAt <=
          manualAttempt.beats[manualAttempt.beats.length - 1].at ||
          manualAttempt.complete !==
            (manualAttempt.beats.length === 3 &&
              manualAttempt.beats.every(function (row) { return row.valid; })))
        return fail("幽靈作圖紙完成狀態不一致");
      if (mai && manualAttempt.resetAt <=
          lab.orbitLab.manualAttempts[mai - 1].resetAt)
        return fail("幽靈作圖紙順序與重做時間不一致");
    }
    if (lab.orbitLab.ruleSeal != null) {
      var seal = lab.orbitLab.ruleSeal;
      if (!seal || ["same-vector", "ink-mark", "earth-center"].indexOf(seal.target) < 0 ||
          ["slow", "medium", "fast"].indexOf(seal.speed) < 0 ||
          ["short", "medium", "long"].indexOf(seal.strength) < 0 ||
          ["line", "away", "circle", "ellipse", "crash", "wrong-center"].indexOf(seal.prediction) < 0 ||
          (seal.aimPattern != null && seal.aimPattern !== "staggered-v1") ||
          !isInt(seal.sealedAt) || seal.sealedAt < 1 || seal.sealedAt > lab.sequence)
        return fail("改向規則封存格式錯誤");
      for (var mbi = 0; mbi < lab.orbitLab.manualBeats.length; mbi++) {
        var beat = lab.orbitLab.manualBeats[mbi];
        if (!beat || beat.step !== mbi + 1 || !isInt(beat.at) ||
            !isFinite(beat.aimAngle) || !isFinite(beat.expectedAngle) ||
            !isFinite(beat.angleCurrentDeg) || !isFinite(beat.anglePreviousDeg) ||
            typeof beat.valid !== "boolean")
          return fail("親手三拍含無法辨識的方向");
      }
      if (lab.orbitLab.firstStepAt != null &&
          (!isInt(lab.orbitLab.firstStepAt) || lab.orbitLab.firstStepAt <= seal.sealedAt))
        return fail("預測與落筆時間線倒置");
      if (lab.orbitLab.continuedAt != null &&
          (!isInt(lab.orbitLab.continuedAt) ||
            lab.orbitLab.firstStepAt == null ||
            lab.orbitLab.continuedAt <= lab.orbitLab.firstStepAt))
        return fail("續畫時間線倒置");
      if (lab.orbitLab.manualComplete &&
          (lab.orbitLab.manualBeats.length !== 3 ||
            lab.orbitLab.manualBeats.some(function (row) { return !row.valid; })))
        return fail("親手三拍完成狀態與紀錄不一致");
      if (lab.orbitLab.continuedAt == null &&
          engine4 && !engine4._orbitPartialAudit(lab))
        return fail("尚未續畫的親手三拍不是由封存規則重算");
      if (lab.orbitLab.continuedAt != null &&
          engine4 && !engine4._orbitRecordAudit(lab))
        return fail("已續畫的作圖紀錄不是由封存規則重算");
    } else if (lab.orbitLab.manualBeats.length || lab.orbitLab.manualComplete) {
      return fail("親手三拍缺少封存規則");
    }
    var expectedOrbitAttempts = lab.orbitLab.ruleRuns.length +
      (lab.orbitLab.ruleSeal != null && lab.orbitLab.continuedAt == null ? 1 : 0);
    if (lab.orbitLab.attempt !== expectedOrbitAttempts)
      return fail("作圖嘗試數不是由封存規則紀錄導出");
    if (!migratedV1) {
      var expectedOrbitDays = lab.orbitLab.ruleRuns.filter(function (run) {
        return run.target === "earth-center" &&
          ["circle", "ellipse"].indexOf(run.actualShape) >= 0;
      }).length;
      if (lab.days !== expectedOrbitDays)
        return fail("第四章耗時不是由完成的作圖紙導出");
    }
    if (lab.scaleLab.earthRadiusRatio !== 60 ||
        lab.scaleLab.timeRatio !== 60 ||
        !Array.isArray(lab.scaleLab.trials) || lab.scaleLab.trials.length > 100)
      return fail("跨尺度工作台紀錄格式錯誤");
    if (!lab.scaleLab.actualCoordinates ||
        lab.scaleLab.actualCoordinates.earthX !== 0 ||
        lab.scaleLab.actualCoordinates.moonX !== lab.scaleLab.earthRadiusRatio ||
        lab.scaleLab.actualCoordinates.displayMoonX !== 82)
      return fail("同尺紙顯示座標不是可重算的固定刻度");
    for (var ti = 0; ti < lab.scaleLab.trials.length; ti++) {
      var trial = lab.scaleLab.trials[ti];
      if (!trial || trial.id !== ti + 1 ||
          (engine4 && !engine4._scaleTrialAudit(trial)) ||
          (trial.source === "schema1-validated-k2" && !migratedV1))
        return fail("距離律試算不是可重算的 canonical 紀錄");
    }
    if (lab.scaleLab.lawLocked !== null &&
        (!isFinite(lab.scaleLab.lawLocked) || lab.scaleLab.lawLocked < 0 || lab.scaleLab.lawLocked > 3))
      return fail("封存距離律格式錯誤");
    if (!Array.isArray(lab.scaleLab.predictionAttempts) ||
        !Array.isArray(lab.scaleLab.conversionAttempts) ||
        !Array.isArray(lab.scaleLab.ratioAttempts) ||
        !Array.isArray(lab.scaleLab.relationAttempts) ||
        lab.scaleLab.predictionAttempts.length > 30 ||
        lab.scaleLab.conversionAttempts.length > 30 ||
        lab.scaleLab.ratioAttempts.length > 30 ||
        lab.scaleLab.relationAttempts.length > 30 ||
        typeof lab.scaleLab.conversionCorrect !== "boolean" ||
        typeof lab.scaleLab.ratioCorrect !== "boolean" ||
        typeof lab.scaleLab.relationCorrect !== "boolean")
      return fail("同尺紙判讀紀錄格式錯誤");
    if (lab.scaleLab.scalePrediction != null) {
      var scalePrediction = lab.scaleLab.scalePrediction;
      if (!scalePrediction.sealed ||
          ["same", "one-sixtieth", "one-over-3600", "almost-none"].indexOf(scalePrediction.choice) < 0 ||
          !isInt(scalePrediction.sealedAt) || scalePrediction.sealedAt > lab.sequence ||
          (scalePrediction.openedAt != null &&
            (!isInt(scalePrediction.openedAt) ||
              scalePrediction.openedAt <= scalePrediction.sealedAt ||
              scalePrediction.openedAt > lab.sequence)) ||
          (scalePrediction.matched != null &&
            typeof scalePrediction.matched !== "boolean"))
        return fail("同尺紙預測封存格式錯誤");
    }
    var scaleAttemptSpecs = [
      {
        rows: lab.scaleLab.predictionAttempts,
        choices: ["same", "one-sixtieth", "one-over-3600", "almost-none"],
        time: "sealedAt",
        label: "量級預測"
      },
      {
        rows: lab.scaleLab.conversionAttempts,
        choices: ["divide-60", "divide-3600"],
        time: "at",
        label: "時間換算"
      },
      {
        rows: lab.scaleLab.ratioAttempts,
        choices: [60, 360, 3600, 36000],
        time: "at",
        label: "倍率判讀"
      },
      {
        rows: lab.scaleLab.relationAttempts,
        choices: ["add", "multiply", "unknown"],
        time: "at",
        label: "倍率關係"
      }
    ];
    for (var sas = 0; sas < scaleAttemptSpecs.length; sas++) {
      var scaleSpec = scaleAttemptSpecs[sas];
      var previousScaleAt = 0;
      for (var sar = 0; sar < scaleSpec.rows.length; sar++) {
        var scaleAttempt = scaleSpec.rows[sar];
        var scaleChoice = scaleAttempt && scaleAttempt.choice;
        if (!scaleAttempt || scaleSpec.choices.indexOf(scaleChoice) < 0 ||
            !isInt(scaleAttempt[scaleSpec.time]) ||
            scaleAttempt[scaleSpec.time] <= previousScaleAt ||
            scaleAttempt[scaleSpec.time] > lab.sequence)
          return fail(scaleSpec.label + "嘗試紀錄格式錯誤");
        if (scaleSpec.time === "at") {
          var expectedScaleOk =
            (sas === 1 && scaleChoice === "divide-3600") ||
            (sas === 2 && scaleChoice === 3600) ||
            (sas === 3 && scaleChoice === "multiply");
          if (typeof scaleAttempt.ok !== "boolean" ||
              scaleAttempt.ok !== expectedScaleOk)
            return fail(scaleSpec.label + "嘗試結果與選項不一致");
        }
        previousScaleAt = scaleAttempt[scaleSpec.time];
      }
    }
    var migratedK2 = migratedV1 && lab.scaleLab.trials.length === 1 &&
      lab.scaleLab.trials[0].source === "schema1-validated-k2" &&
      lab.scaleLab.scalePrediction == null &&
      lab.scaleLab.predictionAttempts.length === 0 &&
      lab.scaleLab.conversionAttempts.length === 0 &&
      lab.scaleLab.ratioAttempts.length === 0 &&
      lab.scaleLab.relationAttempts.length === 0;
    if (!migratedK2) {
      if (lab.scaleLab.predictionAttempts.length !==
            (lab.scaleLab.scalePrediction ? 1 : 0) ||
          (lab.scaleLab.scalePrediction &&
            (lab.scaleLab.predictionAttempts[0].choice !==
              lab.scaleLab.scalePrediction.choice ||
             lab.scaleLab.predictionAttempts[0].sealedAt !==
              lab.scaleLab.scalePrediction.sealedAt)))
        return fail("同尺紙量級預測不是唯一的目前封存紙");
      var scaleSuccessSpecs = [
        [lab.scaleLab.conversionAttempts, "divide-3600", lab.scaleLab.conversionCorrect],
        [lab.scaleLab.ratioAttempts, 3600, lab.scaleLab.ratioCorrect],
        [lab.scaleLab.relationAttempts, "multiply", lab.scaleLab.relationCorrect]
      ];
      for (var ssi = 0; ssi < scaleSuccessSpecs.length; ssi++) {
        var successfulScaleRows = scaleSuccessSpecs[ssi][0].filter(function (row) {
          return row.ok === true;
        });
        if (successfulScaleRows.length !== (scaleSuccessSpecs[ssi][2] ? 1 : 0) ||
            (successfulScaleRows.length &&
              successfulScaleRows[0] !==
                scaleSuccessSpecs[ssi][0][scaleSuccessSpecs[ssi][0].length - 1]) ||
            (successfulScaleRows.length &&
              successfulScaleRows[0].choice !== scaleSuccessSpecs[ssi][1]))
          return fail("同尺紙成功狀態與玩家最後一次判讀不一致");
      }
    }
    if (lab.scaleLab.scalePrediction != null) {
      var sealedPrediction = lab.scaleLab.scalePrediction;
      if (!lab.scaleLab.predictionAttempts.some(function (attempt) {
        return attempt.choice === sealedPrediction.choice &&
          attempt.sealedAt === sealedPrediction.sealedAt;
      })) return fail("同尺紙預測缺少玩家封存紀錄");
      if (sealedPrediction.openedAt != null) {
        var firstConversion = lab.scaleLab.conversionAttempts[0];
        if (!firstConversion || sealedPrediction.openedAt !== firstConversion.at ||
            sealedPrediction.matched !==
              (sealedPrediction.choice === "one-over-3600"))
          return fail("同尺紙開蠟結果與首次換算不一致");
      }
    }
    if (lab.scaleLab.conversionCorrect === true &&
        lab.scaleLab.moonOneSecondSagMm !== 1.4)
      return fail("月球一秒刻痕不是可重算的教學數值");
    if (lab.scaleLab.trials.length !== (lab.scaleLab.relationCorrect ? 1 : 0))
      return fail("同尺紙試算張數與最後倍率關係不一致");
    if (!Array.isArray(lab.planetLab.predictions) || lab.planetLab.predictions.length > 100 ||
        !lab.planetLab.revealed || !lab.planetLab.residuals) return fail("行星預測紀錄格式錯誤");
    var planetRows = {};
    for (var pr = 0; pr < lab.planetLab.predictions.length; pr++) {
      var pred = lab.planetLab.predictions[pr];
      if (!pred || pred.id !== pr + 1 ||
          ["mars", "jupiter"].indexOf(pred.planet) < 0 ||
          planetRows[pred.planet] ||
          !isFinite(pred.exponent) || !isFinite(pred.prediction) ||
          !isFinite(pred.actual) || !isFinite(pred.residualPct) ||
          pred.sealed !== true || typeof pred.revealedAfterSeal !== "boolean" ||
          !isInt(pred.sealedAt) || pred.sealedAt < 1 ||
          (pred.revealedAfterSeal
            ? !isInt(pred.openedAt) || pred.sealedAt >= pred.openedAt ||
              pred.openedAt > lab.sequence
            : pred.openedAt != null) ||
          typeof pred.pass !== "boolean" || pred.superseded !== false ||
          (engine4 && !engine4._planetPredictionAudit(pred)) ||
          (pred.source === "schema1-validated-k3" && !migratedV1))
        return fail("行星預測含無法辨識的資料");
      planetRows[pred.planet] = pred;
    }
    if (Object.keys(lab.planetLab.revealed).some(function (id) {
      return ["mars", "jupiter"].indexOf(id) < 0;
    }) || Object.keys(lab.planetLab.residuals).some(function (id) {
      return ["mars", "jupiter"].indexOf(id) < 0;
    })) return fail("行星顯示狀態含未知資料");
    ["mars", "jupiter"].forEach(function (id) {
      if (typeof lab.planetLab.revealed[id] !== "boolean")
        planetRows.__invalid = true;
      if (lab.planetLab.revealed[id] !==
            !!(planetRows[id] && planetRows[id].revealedAfterSeal) ||
          lab.planetLab.residuals[id] !==
            (planetRows[id] && planetRows[id].revealedAfterSeal
              ? planetRows[id].residualPct : null))
        planetRows.__invalid = true;
    });
    if (planetRows.__invalid ||
        lab.planetLab.crossScalePass !==
          ["mars", "jupiter"].every(function (id) {
            return !!(planetRows[id] && planetRows[id].pass &&
              planetRows[id].revealedAfterSeal);
          }))
      return fail("行星揭露畫面與 canonical 預測紀錄不一致");
    if (!Array.isArray(lab.modelLab.runs) || lab.modelLab.runs.length > 100)
      return fail("模型比較紀錄格式錯誤");
    for (var mr = 0; mr < lab.modelLab.runs.length; mr++) {
      var run = lab.modelLab.runs[mr];
      if (!run || run.id !== mr + 1 ||
          ["inverseSquare", "simpleVortex"].indexOf(run.model) < 0 ||
          ["moon", "planets", "comet"].indexOf(run.caseId) < 0 ||
          run.raw !== true ||
          (run.residual != null && !isFinite(run.residual)) ||
          ["matches", "story", "mismatch"].indexOf(run.fit) < 0 ||
          Object.prototype.hasOwnProperty.call(run, "patches") ||
          (engine4 && !engine4._modelRunAudit(run)))
        return fail("模型比較含無法辨識的資料");
    }
    if (!Array.isArray(lab.modelLab.rowOrder) || lab.modelLab.rowOrder.length > 3 ||
        !Array.isArray(lab.modelLab.completedRows) || lab.modelLab.completedRows.length > 3 ||
        !lab.modelLab.rowStage || typeof lab.modelLab.rowStage !== "object" ||
        !Array.isArray(lab.modelLab.stampAttempts) || lab.modelLab.stampAttempts.length > 100 ||
        !Array.isArray(lab.modelLab.loans) || lab.modelLab.loans.length > 2 ||
        !lab.modelLab.loanDecisions || typeof lab.modelLab.loanDecisions !== "object" ||
        !lab.modelLab.loanDecisionAt || typeof lab.modelLab.loanDecisionAt !== "object" ||
        !Array.isArray(lab.modelLab.comparisonAttempts) ||
        lab.modelLab.comparisonAttempts.length > 30 ||
        !Array.isArray(lab.modelLab.selectedRecords) ||
        lab.modelLab.selectedRecords.length !== 0 ||
        typeof lab.modelLab.comparisonSealed !== "boolean" ||
        (lab.modelLab.comparisonSealedAt != null &&
          (!isInt(lab.modelLab.comparisonSealedAt) ||
            lab.modelLab.comparisonSealedAt < 1 ||
            lab.modelLab.comparisonSealedAt > lab.sequence)) ||
        typeof lab.modelLab.gravityComplete !== "boolean" ||
        typeof lab.modelLab.vortexComplete !== "boolean" ||
        (lab.modelLab.comparisonClaim != null &&
          ["same", "all-vortices", "actual-ledger"].indexOf(lab.modelLab.comparisonClaim) < 0) ||
        (lab.modelLab.evidencePackage != null &&
          (typeof lab.modelLab.evidencePackage !== "object" ||
            Array.isArray(lab.modelLab.evidencePackage))))
      return fail("對帳桌紀錄格式錯誤");
    var ledgerCases = ["moon", "planets", "comet"];
    var uniqueOrder = Array.from(new Set(lab.modelLab.rowOrder));
    var uniqueCompleted = Array.from(new Set(lab.modelLab.completedRows));
    if (uniqueOrder.length !== lab.modelLab.rowOrder.length ||
        uniqueCompleted.length !== lab.modelLab.completedRows.length ||
        uniqueOrder.some(function (id) { return ledgerCases.indexOf(id) < 0; }) ||
        uniqueCompleted.some(function (id) {
          return ledgerCases.indexOf(id) < 0 || uniqueOrder.indexOf(id) < 0;
        }))
      return fail("對帳桌列順序格式錯誤");
    var loanCases = {};
    for (var li = 0; li < lab.modelLab.loans.length; li++) {
      var loan = lab.modelLab.loans[li];
      if (!loan || !isInt(loan.id) || loan.id !== li + 1 ||
          ["planets", "comet"].indexOf(loan.caseId) < 0 ||
          loanCases[loan.caseId] || !isInt(loan.at) || loan.at > lab.sequence)
        return fail("借條紀錄格式錯誤");
      if (engine4 && !engine4._modelLoanAudit(loan))
        return fail("借條內容不是玩家可選的兩種明示借法");
      loanCases[loan.caseId] = true;
    }
    for (var sai = 0; sai < lab.modelLab.stampAttempts.length; sai++) {
      var stampAttempt = lab.modelLab.stampAttempts[sai];
      var canonicalExpected = stampAttempt && stampAttempt.model === "inverseSquare"
        ? "matches"
        : (stampAttempt && stampAttempt.caseId === "moon" ? "story" : "mismatch");
      var stampRow = stampAttempt && lab.modelLab.rowStage[stampAttempt.caseId];
      if (!stampAttempt || stampAttempt.id !== sai + 1 ||
          ledgerCases.indexOf(stampAttempt.caseId) < 0 ||
          ["inverseSquare", "simpleVortex"].indexOf(stampAttempt.model) < 0 ||
          ["matches", "story", "mismatch"].indexOf(stampAttempt.stamp) < 0 ||
          ["matches", "story", "mismatch"].indexOf(stampAttempt.expected) < 0 ||
          typeof stampAttempt.ok !== "boolean" || !isInt(stampAttempt.at) ||
          stampAttempt.at < 1 || stampAttempt.at > lab.sequence ||
          stampAttempt.expected !== canonicalExpected ||
          stampAttempt.ok !== (stampAttempt.stamp === canonicalExpected) ||
          !stampRow || !isInt(stampRow.openedAt) ||
          stampAttempt.at <= stampRow.openedAt ||
          (isInt(stampRow.completedAt) &&
            stampAttempt.at >= stampRow.completedAt))
        return fail("蓋章嘗試紀錄格式錯誤");
    }
    for (var lci = 0; lci < ledgerCases.length; lci++) {
      var ledgerCase = ledgerCases[lci];
      var rowStage = lab.modelLab.rowStage[ledgerCase];
      if (!rowStage) {
        if (uniqueOrder.indexOf(ledgerCase) >= 0) return fail("對帳桌列狀態缺失");
        continue;
      }
      if (uniqueOrder.indexOf(ledgerCase) < 0)
        return fail("對帳桌列狀態沒有玩家開列紀錄");
      var expectedVortex = ledgerCase === "moon" ? "story" : "mismatch";
      if ((rowStage.forceStamp != null && rowStage.forceStamp !== "matches") ||
          (rowStage.vortexStamp != null && rowStage.vortexStamp !== expectedVortex) ||
          !isInt(rowStage.openedAt) || rowStage.openedAt < 1 ||
          rowStage.openedAt > lab.sequence ||
          typeof rowStage.complete !== "boolean" ||
          (rowStage.complete !== (uniqueCompleted.indexOf(ledgerCase) >= 0)))
        return fail("對帳桌章記與完成狀態不一致");
      if (rowStage.complete &&
          (!isInt(rowStage.completedAt) ||
            rowStage.completedAt <= rowStage.openedAt ||
            rowStage.completedAt > lab.sequence))
        return fail("對帳桌列時間線不一致");
      if (!rowStage.complete && rowStage.completedAt != null)
        return fail("未完成對帳列不應有完成時間");
      if (ledgerCase === "comet") {
        var successfulCometBeforeRow = lab.cometLab &&
          lab.cometLab.attempts.filter(function (attempt) {
            return attempt.ok === true && attempt.mode === "same-orbit";
          });
        if (!successfulCometBeforeRow ||
            successfulCometBeforeRow.length !== 1 ||
            successfulCometBeforeRow[0].at >= rowStage.openedAt)
          return fail("彗星對帳列早於玩家完成軌跡接合");
      }
      if (ledgerCase !== "moon" && rowStage.complete &&
          ["loan", "no-loan"].indexOf(lab.modelLab.loanDecisions[ledgerCase]) < 0)
        return fail("借條選擇缺失");
      if (ledgerCase !== "moon" && rowStage.complete &&
          (!isInt(lab.modelLab.loanDecisionAt[ledgerCase]) ||
            lab.modelLab.loanDecisionAt[ledgerCase] <= rowStage.openedAt ||
            lab.modelLab.loanDecisionAt[ledgerCase] >= rowStage.completedAt))
        return fail("借條選擇時間線不一致");
      var successfulCellTimes = ["inverseSquare", "simpleVortex"].map(function (model) {
        var row = lab.modelLab.stampAttempts.filter(function (attempt) {
          return attempt.caseId === ledgerCase && attempt.model === model &&
            attempt.ok === true && attempt.at > rowStage.openedAt;
        });
        return row;
      });
      if (successfulCellTimes[0].length !== (rowStage.forceStamp != null ? 1 : 0) ||
          successfulCellTimes[1].length !== (rowStage.vortexStamp != null ? 1 : 0))
        return fail("對帳桌現態缺少玩家成功蓋章紀錄");
      var lastCellAt = successfulCellTimes.every(function (rows) { return rows.length === 1; })
        ? Math.max(successfulCellTimes[0][0].at, successfulCellTimes[1][0].at)
        : null;
      if (rowStage.complete && (lastCellAt == null ||
          (ledgerCase === "moon" && !(lastCellAt < rowStage.completedAt)) ||
          (ledgerCase !== "moon" &&
            !(lastCellAt < lab.modelLab.loanDecisionAt[ledgerCase] &&
              lab.modelLab.loanDecisionAt[ledgerCase] < rowStage.completedAt))))
        return fail("蓋章、借條與完成列的時間線不一致");
      if ((lab.modelLab.loanDecisions[ledgerCase] === "loan") !== !!loanCases[ledgerCase])
        return fail("借條選擇與實際借條不一致");
      if (lab.modelLab.loanDecisions[ledgerCase] === "loan" &&
          lab.modelLab.loans.find(function (loan) {
            return loan.caseId === ledgerCase;
          }).at !== lab.modelLab.loanDecisionAt[ledgerCase])
        return fail("借條內容與玩家選擇時間不一致");
    }
    if (Object.keys(lab.modelLab.rowStage).some(function (id) {
      return ledgerCases.indexOf(id) < 0;
    })) return fail("對帳桌含未知資料列");
    var openedRowOrder = uniqueOrder.slice().sort(function (a, b) {
      return lab.modelLab.rowStage[a].openedAt - lab.modelLab.rowStage[b].openedAt;
    });
    var completedRowOrder = uniqueCompleted.slice().sort(function (a, b) {
      return lab.modelLab.rowStage[a].completedAt - lab.modelLab.rowStage[b].completedAt;
    });
    if (JSON.stringify(openedRowOrder) !== JSON.stringify(lab.modelLab.rowOrder) ||
        JSON.stringify(completedRowOrder) !== JSON.stringify(lab.modelLab.completedRows))
      return fail("對帳桌列順序與玩家操作時間不一致");
    for (var roi = 1; roi < openedRowOrder.length; roi++) {
      if (lab.modelLab.rowStage[openedRowOrder[roi - 1]].openedAt >=
          lab.modelLab.rowStage[openedRowOrder[roi]].openedAt)
        return fail("對帳桌開列時間重複或倒置");
    }
    for (var rci = 1; rci < completedRowOrder.length; rci++) {
      if (lab.modelLab.rowStage[completedRowOrder[rci - 1]].completedAt >=
          lab.modelLab.rowStage[completedRowOrder[rci]].completedAt)
        return fail("對帳桌完成時間重複或倒置");
    }
    if (lab.modelLab.protocolAttempts != null) {
      if (!Array.isArray(lab.modelLab.protocolAttempts) || lab.modelLab.protocolAttempts.length > 30)
        return fail("模型比較標準紀錄格式錯誤");
      for (var mpa = 0; mpa < lab.modelLab.protocolAttempts.length; mpa++) {
        var protocolAttempt = lab.modelLab.protocolAttempts[mpa];
        if (!protocolAttempt ||
            ["shared-law-observed-initials", "same-start-all", "retune-law-per-body"].indexOf(protocolAttempt.protocol) < 0 ||
            typeof protocolAttempt.ok !== "boolean")
          return fail("模型比較標準含無法辨識的資料");
      }
    }
    if (lab.modelLab.protocolLocked &&
        lab.modelLab.protocol !== "shared-law-observed-initials")
      return fail("模型比較完成狀態與公平標準不一致");
    var successfulComparisons = [];
    for (var mci = 0; mci < lab.modelLab.comparisonAttempts.length; mci++) {
      var comparisonAttempt = lab.modelLab.comparisonAttempts[mci];
      if (!comparisonAttempt || comparisonAttempt.id !== mci + 1 ||
          ["same", "all-vortices", "actual-ledger"].indexOf(comparisonAttempt.claim) < 0 ||
          comparisonAttempt.ok !== (comparisonAttempt.claim === "actual-ledger") ||
          !isInt(comparisonAttempt.at) || comparisonAttempt.at < 1 ||
          comparisonAttempt.at > lab.sequence ||
          (mci && comparisonAttempt.at <=
            lab.modelLab.comparisonAttempts[mci - 1].at))
        return fail("模型比較封條嘗試紀錄格式錯誤");
      if (comparisonAttempt.ok) successfulComparisons.push(comparisonAttempt);
    }
    if (lab.modelLab.comparisonClaim !==
          (lab.modelLab.comparisonAttempts.length
            ? lab.modelLab.comparisonAttempts[lab.modelLab.comparisonAttempts.length - 1].claim
            : null) ||
        successfulComparisons.length !== (lab.modelLab.comparisonSealed ? 1 : 0) ||
        (successfulComparisons.length &&
          successfulComparisons[0] !==
            lab.modelLab.comparisonAttempts[lab.modelLab.comparisonAttempts.length - 1]) ||
        lab.modelLab.comparisonSealedAt !==
          (successfulComparisons.length ? successfulComparisons[0].at : null) ||
        (!lab.modelLab.comparisonSealed && lab.modelLab.evidencePackage != null))
      return fail("模型比較封條現態與玩家嘗試紀錄不一致");
    if (lab.cometLab != null) {
      if (!Array.isArray(lab.cometLab.attempts) || lab.cometLab.attempts.length > 100 ||
          typeof lab.cometLab.joined !== "boolean" ||
          (lab.cometLab.selectedConnection != null &&
            ["hard-kink", "same-orbit"].indexOf(lab.cometLab.selectedConnection) < 0))
        return fail("彗星接軌紀錄格式錯誤");
      for (var ca = 0; ca < lab.cometLab.attempts.length; ca++) {
        var cometAttempt = lab.cometLab.attempts[ca];
        var cometOk = cometAttempt && cometAttempt.mode === "same-orbit";
        var cometNote = cometOk
          ? "十一月入向與十二月出向按日期、星位接成同一條高傾角軌道"
          : "只把兩張紙的最近端點硬接，接縫留下觀測不支持的折角";
        if (!cometAttempt || cometAttempt.id !== ca + 1 ||
            ["hard-kink", "same-orbit"].indexOf(cometAttempt.mode) < 0 ||
            cometAttempt.ok !== cometOk || cometAttempt.note !== cometNote ||
            !isInt(cometAttempt.at) || cometAttempt.at < 1 ||
            cometAttempt.at > lab.sequence ||
            (ca && cometAttempt.at <= lab.cometLab.attempts[ca - 1].at))
          return fail("彗星接軌含無法辨識的資料");
      }
      var successfulComets = lab.cometLab.attempts.filter(function (attempt) {
        return attempt.ok === true;
      });
      var lastComet = lab.cometLab.attempts.length
        ? lab.cometLab.attempts[lab.cometLab.attempts.length - 1] : null;
      if (lab.cometLab.selectedConnection !== (lastComet ? lastComet.mode : null) ||
          successfulComets.length !== (lab.cometLab.joined ? 1 : 0) ||
          (successfulComets.length && successfulComets[0] !== lastComet))
        return fail("彗星接軌完成狀態與紀錄不一致");
    }
    if (lab.archiveLab != null) {
      if (!Array.isArray(lab.archiveLab.clipped) || lab.archiveLab.clipped.length > 5 ||
          !Array.isArray(lab.archiveLab.clipAttempts) ||
          lab.archiveLab.clipAttempts.length > 5 ||
          typeof lab.archiveLab.complete !== "boolean")
        return fail("旅人筆記回收紀錄格式錯誤");
      var allowedArchive = ["K1", "K2", "K3", "K4", "K5"];
      var uniqueArchive = Array.from(new Set(lab.archiveLab.clipped));
      if (uniqueArchive.length !== lab.archiveLab.clipped.length ||
          uniqueArchive.some(function (id) { return allowedArchive.indexOf(id) < 0; }) ||
          uniqueArchive.some(function (id) {
            return !lab.evidence[id.toLowerCase()];
          }) ||
          lab.archiveLab.complete !== allowedArchive.every(function (id) {
            return uniqueArchive.indexOf(id) >= 0;
          }))
        return fail("旅人筆記回收狀態與紀錄不一致");
      for (var aci = 0; aci < lab.archiveLab.clipAttempts.length; aci++) {
        var clipAttempt = lab.archiveLab.clipAttempts[aci];
        if (!clipAttempt || clipAttempt.id !== aci + 1 ||
            allowedArchive.indexOf(clipAttempt.evidenceId) < 0 ||
            clipAttempt.evidenceId !== lab.archiveLab.clipped[aci] ||
            !isInt(clipAttempt.at) || clipAttempt.at < 1 ||
            clipAttempt.at > lab.sequence ||
            (aci && clipAttempt.at <= lab.archiveLab.clipAttempts[aci - 1].at))
          return fail("旅人筆記缺少玩家逐張夾回的操作紀錄");
      }
      if (lab.archiveLab.clipAttempts.length !== lab.archiveLab.clipped.length)
        return fail("旅人筆記夾頁與玩家操作紀錄不一致");
    }
    if (!Array.isArray(lab.proof.slots) || lab.proof.slots.length > 6 ||
        !Array.isArray(lab.proof.slotAttempts) || lab.proof.slotAttempts.length > 100 ||
        !Array.isArray(lab.proof.attributionAttempts) ||
        lab.proof.attributionAttempts.length > 100 ||
        !Array.isArray(lab.proof.boundaryAttempts) ||
        lab.proof.boundaryAttempts.length > 100 ||
        !lab.proof.attribution || typeof lab.proof.attribution !== "object" ||
        Array.isArray(lab.proof.attribution))
      return fail("證明槽或署名欄格式錯誤");
    var proofSlots = ["inertia", "inward", "distance", "withheld", "model", "shell"];
    var proofSources = ["M2", "M3", "K1", "K2", "K3", "K4", "SHELL"];
    var seenProofSlots = {};
    for (var psi = 0; psi < lab.proof.slots.length; psi++) {
      var proofSlot = lab.proof.slots[psi];
      if (!proofSlot || proofSlots.indexOf(proofSlot.slot) < 0 ||
          proofSources.indexOf(proofSlot.evidenceId) < 0 ||
          !isInt(proofSlot.placedAt) || proofSlot.placedAt < 1 ||
          proofSlot.placedAt > lab.sequence ||
          seenProofSlots[proofSlot.slot])
        return fail("證明槽含無法辨識或重複的來源");
      seenProofSlots[proofSlot.slot] = true;
    }
    var currentSlotById = {};
    for (var psai = 0; psai < lab.proof.slotAttempts.length; psai++) {
      var slotAttempt = lab.proof.slotAttempts[psai];
      var expectedSlotSources = slotAttempt && engine4 &&
        engine4._PROOF_EXPECT[slotAttempt.slot];
      if (!slotAttempt || slotAttempt.id !== psai + 1 ||
          proofSlots.indexOf(slotAttempt.slot) < 0 ||
          proofSources.indexOf(slotAttempt.evidenceId) < 0 ||
          !Array.isArray(expectedSlotSources) ||
          slotAttempt.ok !==
            (expectedSlotSources.indexOf(slotAttempt.evidenceId) >= 0) ||
          !isInt(slotAttempt.at) || slotAttempt.at < 1 ||
          slotAttempt.at > lab.sequence ||
          (psai && slotAttempt.at <= lab.proof.slotAttempts[psai - 1].at))
        return fail("證明槽缺少玩家放紙的操作紀錄");
      currentSlotById[slotAttempt.slot] = slotAttempt;
    }
    if (Object.keys(currentSlotById).length !== lab.proof.slots.length ||
        lab.proof.slots.some(function (slot) {
          var attempt = currentSlotById[slot.slot];
          return !attempt || attempt.evidenceId !== slot.evidenceId ||
            attempt.at !== slot.placedAt;
        }))
      return fail("證明槽現態與玩家最後一次放紙不一致");
    var creditKeys = ["direction", "publication", "observations", "proof"];
    var creditPeople = ["Hooke", "Halley", "Flamsteed", "Newton"];
    var attributionKeys = Object.keys(lab.proof.attribution);
    if (attributionKeys.some(function (key) {
      return creditKeys.indexOf(key) < 0 ||
        creditPeople.indexOf(lab.proof.attribution[key]) < 0;
    })) return fail("署名欄含無法辨識的工作或人名");
    var currentAttribution = {};
    for (var pai = 0; pai < lab.proof.attributionAttempts.length; pai++) {
      var attributionAttempt = lab.proof.attributionAttempts[pai];
      var expectedCredit = attributionAttempt && engine4 &&
        engine4._CREDIT_EXPECT[attributionAttempt.contribution];
      if (!attributionAttempt || attributionAttempt.id !== pai + 1 ||
          creditKeys.indexOf(attributionAttempt.contribution) < 0 ||
          creditPeople.indexOf(attributionAttempt.person) < 0 ||
          attributionAttempt.ok !== (expectedCredit === attributionAttempt.person) ||
          !isInt(attributionAttempt.at) || attributionAttempt.at < 1 ||
          attributionAttempt.at > lab.sequence ||
          (pai && attributionAttempt.at <=
            lab.proof.attributionAttempts[pai - 1].at))
        return fail("信用歸戶缺少玩家操作紀錄");
      currentAttribution[attributionAttempt.contribution] = attributionAttempt.person;
    }
    if (JSON.stringify(currentAttribution) !== JSON.stringify(lab.proof.attribution))
      return fail("信用歸戶現態與玩家最後一次操作不一致");
    var press = lab.proof.press;
    if (!press || !isInt(press.window) || press.window < 1 || press.window > 3 ||
        press.reservedWindows !== 3 || ["open", "schedule-lost"].indexOf(press.status) < 0 ||
        (press.openingChoice != null &&
          ["partial", "defer"].indexOf(press.openingChoice) < 0) ||
        typeof press.scheduleLost !== "boolean" ||
        typeof press.rushTried !== "boolean" || !Array.isArray(press.proofs) ||
        !Array.isArray(press.delays) || press.proofs.length > 100 || press.delays.length > 100)
      return fail("校樣窗口紀錄格式錯誤");
    for (var pfi = 0; pfi < press.proofs.length; pfi++) {
      var proofRecord = press.proofs[pfi];
      if (!proofRecord ||
          ["partial", "wrong-proof", "complete"].indexOf(proofRecord.kind) < 0 ||
          typeof proofRecord.complete !== "boolean" ||
          (proofRecord.kind === "complete" && proofRecord.complete !== true) ||
          (proofRecord.kind !== "complete" && proofRecord.complete !== false))
        return fail("校樣紀錄含無法辨識的內容");
      if (proofRecord.kind === "partial") {
        if (proofRecord.complete !== false ||
            JSON.stringify(proofRecord.supported) !== JSON.stringify(["moon", "planets"]) ||
            JSON.stringify(proofRecord.missing) !==
            JSON.stringify(["comet", "model-comparison"]) ||
            !isInt(proofRecord.window) || proofRecord.window < 1 ||
            proofRecord.window > press.reservedWindows ||
            !isInt(proofRecord.at) || proofRecord.at < 1 ||
            proofRecord.at > lab.sequence ||
            proofRecord.rescheduled === true)
          return fail("部分校樣紀錄格式錯誤");
      } else if (!isInt(proofRecord.submittedAt) ||
          proofRecord.submittedAt < 1 || proofRecord.submittedAt > lab.sequence ||
          !proofRecord.audit || typeof proofRecord.audit !== "object" ||
          !Array.isArray(proofRecord.slots) ||
          !proofRecord.attribution || typeof proofRecord.attribution !== "object" ||
          !proofRecord.authorField || !Array.isArray(proofRecord.authorField.names) ||
          typeof proofRecord.authorField.travelerRemoved !== "boolean" ||
          typeof proofRecord.shellPagePlaced !== "boolean" ||
          typeof proofRecord.superseded !== "boolean" ||
          (proofRecord.kind === "wrong-proof" && proofRecord.superseded !== false) ||
          !((isInt(proofRecord.window) &&
              proofRecord.window >= 1 &&
              proofRecord.window <= press.reservedWindows &&
              proofRecord.rescheduled === false) ||
            (proofRecord.window == null && proofRecord.rescheduled === true))) {
        return fail("完整或錯誤校樣快照格式錯誤");
      }
    }
    for (var pdi = 0; pdi < press.delays.length; pdi++) {
      var delayRecord = press.delays[pdi];
      if (!delayRecord || delayRecord.kind !== "delay" ||
          typeof delayRecord.reason !== "string" || !delayRecord.reason.trim() ||
          delayRecord.reason.length > 240 || !isInt(delayRecord.window) ||
          delayRecord.window < 1 || delayRecord.window > press.reservedWindows ||
          !isInt(delayRecord.at) || delayRecord.at < 1 ||
          delayRecord.at > lab.sequence)
        return fail("延後校樣紀錄格式錯誤");
    }
    var windowedPressRecords = [];
    press.proofs.forEach(function (record) {
      if (isInt(record.window)) {
        windowedPressRecords.push({
          window: record.window,
          at: record.kind === "partial" ? record.at : record.submittedAt,
          kind: record.kind,
          record: record
        });
      }
    });
    press.delays.forEach(function (record) {
      windowedPressRecords.push({
        window: record.window, at: record.at, kind: "delay", record: record
      });
    });
    windowedPressRecords.sort(function (a, b) { return a.window - b.window; });
    if (windowedPressRecords.length > press.reservedWindows ||
        windowedPressRecords.some(function (record, index) {
          return record.window !== index + 1 ||
            (index && record.at <= windowedPressRecords[index - 1].at);
        }))
      return fail("校樣窗口紀錄不是從第一窗連續留下");
    var usedWindows = windowedPressRecords.length;
    var expectedPressLost = usedWindows === press.reservedWindows;
    if (press.window !== (expectedPressLost ? press.reservedWindows : usedWindows + 1) ||
        press.status !== (expectedPressLost ? "schedule-lost" : "open") ||
        press.scheduleLost !== expectedPressLost)
      return fail("校樣窗口現態不是由實際使用紀錄導出");
    var rescheduledProofs = press.proofs.filter(function (record) {
      return record.window == null;
    });
    if (press.openingChoice == null && (usedWindows || rescheduledProofs.length))
      return fail("未做出版取捨卻已有校樣窗口紀錄");
    var lastWindowAt = windowedPressRecords.length
      ? windowedPressRecords[windowedPressRecords.length - 1].at : 0;
    for (var rpi = 0; rpi < rescheduledProofs.length; rpi++) {
      if (!expectedPressLost ||
          rescheduledProofs[rpi].submittedAt <=
            (rpi ? rescheduledProofs[rpi - 1].submittedAt : lastWindowAt))
        return fail("補排校樣沒有接在已耗盡的原窗口之後");
    }
    {
      if (!Array.isArray(state.eventLog) || state.eventLog.length > 3000)
        return fail("第四章事件紀錄格式錯誤");
      var expectedPressActions = press.proofs.map(function (record) {
        return {
          at: record.kind === "partial" ? record.at : record.submittedAt,
          action: record.kind === "partial" ? "submitPartialProof" : "submitProof"
        };
      }).concat(press.delays.map(function (record) {
        return { at: record.at, action: "deferPress" };
      })).sort(function (a, b) { return a.at - b.at; })
        .map(function (record) {
          return { action: record.action, sequence: record.at };
        });
      var migrationEventIndex = migratedV1
        ? state.eventLog.findIndex(function (event) {
            return event && event.t === "migration";
          }) : -1;
      var loggedPressActions = state.eventLog.filter(function (event, index) {
        return index > migrationEventIndex && event && event.t === "lab" &&
          ["submitPartialProof", "deferPress", "submitProof"]
            .indexOf(event.action) >= 0;
      }).map(function (event) {
        return { action: event.action, sequence: event.sequence };
      });
      if (JSON.stringify(expectedPressActions) !==
          JSON.stringify(loggedPressActions))
        return fail("校樣窗口種類與敘事層玩家操作紀錄不一致");
    }
    var completeProofRows = press.proofs.filter(function (record) {
      return record.kind === "complete" && record.complete === true &&
        record.superseded !== true;
    });
    var allPressTimes = windowedPressRecords.map(function (record) { return record.at; })
      .concat(rescheduledProofs.map(function (record) { return record.submittedAt; }));
    if (completeProofRows.length > 1 ||
        (completeProofRows.length &&
          completeProofRows[0].submittedAt !== Math.max.apply(Math, allPressTimes)) ||
        press.rushTried !== press.proofs.some(function (record) {
          return record.kind === "wrong-proof" && record.complete === false;
        }))
      return fail("完整校樣之後仍有操作，或錯稿紀錄被刪除");
    if (typeof lab.proof.shellPageReady !== "boolean" ||
        typeof lab.proof.shellPagePlaced !== "boolean" ||
        !lab.proof.authorField || !Array.isArray(lab.proof.authorField.names) ||
        typeof lab.proof.authorField.travelerRemoved !== "boolean" ||
        lab.proof.authorField.names.some(function (name) {
          return ["Newton", "Traveler"].indexOf(name) < 0;
        }) ||
        (lab.proof.authorField.travelerRemoved &&
          (lab.proof.authorField.names.length !== 1 ||
            lab.proof.authorField.names[0] !== "Newton")))
      return fail("第六槽或作者欄格式錯誤");
    if ((lab.proof.shellPageReady &&
          (!isInt(lab.proof.shellPageRevealedAt) ||
            lab.proof.shellPageRevealedAt < 1 ||
            lab.proof.shellPageRevealedAt > lab.sequence)) ||
        (!lab.proof.shellPageReady && lab.proof.shellPageRevealedAt != null) ||
        (lab.proof.shellPagePlaced &&
          (!lab.proof.shellPageReady ||
            !isInt(lab.proof.shellPagePlacedAt) ||
            lab.proof.shellPagePlacedAt <= lab.proof.shellPageRevealedAt ||
            lab.proof.shellPagePlacedAt > lab.sequence ||
            !lab.proof.slots.some(function (slot) {
              return slot.slot === "shell" && slot.evidenceId === "SHELL" &&
                slot.placedAt < lab.proof.shellPagePlacedAt;
            }))) ||
        (!lab.proof.shellPagePlaced && lab.proof.shellPagePlacedAt != null) ||
        (lab.proof.authorField.travelerRemoved &&
          (!isInt(lab.proof.authorField.removedAt) ||
            lab.proof.authorField.removedAt < 1 ||
            lab.proof.authorField.removedAt > lab.sequence)) ||
        (!lab.proof.authorField.travelerRemoved &&
          lab.proof.authorField.removedAt != null))
      return fail("第六槽或作者欄時間線不一致");
    var hookeChoices = ["hookeComplete", "newtonAlone", "precise-scope"];
    if (lab.proof.hookeScope != null && hookeChoices.indexOf(lab.proof.hookeScope) < 0)
      return fail("Hooke 貢獻句格式錯誤");
    if (lab.proof.hookeScopeAttempts != null) {
      if (!Array.isArray(lab.proof.hookeScopeAttempts) || lab.proof.hookeScopeAttempts.length > 100)
        return fail("Hooke 貢獻句嘗試紀錄格式錯誤");
      for (var hs = 0; hs < lab.proof.hookeScopeAttempts.length; hs++) {
        var scopeTry = lab.proof.hookeScopeAttempts[hs];
        if (!scopeTry || scopeTry.id !== hs + 1 ||
            hookeChoices.indexOf(scopeTry.choice) < 0 ||
            scopeTry.ok !== (scopeTry.choice === "precise-scope") ||
            !isInt(scopeTry.at) || scopeTry.at < 1 ||
            scopeTry.at > lab.sequence ||
            (hs && scopeTry.at <= lab.proof.hookeScopeAttempts[hs - 1].at))
          return fail("Hooke 貢獻句嘗試含無法辨識的資料");
      }
    }
    if (lab.proof.hookeScope !==
        (lab.proof.hookeScopeAttempts.length
          ? lab.proof.hookeScopeAttempts[lab.proof.hookeScopeAttempts.length - 1].choice
          : null))
      return fail("Hooke 貢獻句現態與玩家最後一次操作不一致");
    var boundaryChoices = ["mechanismSolved", "newtonAlone", "ruleEstablished"];
    for (var bai = 0; bai < lab.proof.boundaryAttempts.length; bai++) {
      var boundaryAttempt = lab.proof.boundaryAttempts[bai];
      if (!boundaryAttempt || boundaryAttempt.id !== bai + 1 ||
          boundaryChoices.indexOf(boundaryAttempt.choice) < 0 ||
          boundaryAttempt.ok !== (boundaryAttempt.choice === "ruleEstablished") ||
          !isInt(boundaryAttempt.at) || boundaryAttempt.at < 1 ||
          boundaryAttempt.at > lab.sequence ||
          (bai && boundaryAttempt.at <= lab.proof.boundaryAttempts[bai - 1].at))
        return fail("證明邊界缺少玩家操作紀錄");
    }
    if (lab.proof.boundaryChoice !==
          (lab.proof.boundaryAttempts.length
            ? lab.proof.boundaryAttempts[lab.proof.boundaryAttempts.length - 1].choice
            : null) ||
        lab.proof.overclaimTried !== lab.proof.boundaryAttempts.some(function (attempt) {
          return attempt.ok === false;
        }))
      return fail("證明邊界現態與玩家最後一次操作不一致");
    if (press.priorityRecord != null) {
      var priority = press.priorityRecord;
      if (!priority || ["raised-early", "raised-at-press"].indexOf(priority.route) < 0 ||
          priority.source !== "hooke-letter-1679" || typeof priority.return !== "string" ||
          !priority.return || priority.return.length > 240 ||
          !isInt(priority.at) || priority.at < 1 || priority.at > lab.sequence)
        return fail("署名爭議分支紀錄格式錯誤");
    }
    if ((press.openingChoice == null) !== (press.priorityRecord == null) ||
        (press.openingChoice === "partial" &&
          press.priorityRecord.route !== "raised-early") ||
        (press.openingChoice === "defer" &&
          press.priorityRecord.route !== "raised-at-press"))
      return fail("出版取捨與署名爭議紀錄不一致");
    if (press.openingChoice === "partial") {
      if (press.priorityRecord.return !== "署名爭議在完整排版前浮上桌" ||
          press.priorityRecord.at == null ||
          press.proofs.filter(function (record) {
            return record.kind === "partial" && record.complete === false &&
              record.window === 1 &&
              record.at === press.priorityRecord.at &&
              JSON.stringify(record.supported) === JSON.stringify(["moon", "planets"]) &&
              JSON.stringify(record.missing) ===
                JSON.stringify(["comet", "model-comparison"]);
          }).length !== 1)
        return fail("提早送部分校樣的玩家取捨紀錄缺失");
    }
    if (press.openingChoice === "defer") {
      if (press.priorityRecord.return !== "保留完整反驗時間，署名爭議延至印刷台" ||
          press.priorityRecord.at == null ||
          press.delays.filter(function (record) {
            return record.kind === "delay" && record.window === 1 &&
              record.at === press.priorityRecord.at &&
              typeof record.reason === "string" && !!record.reason.trim();
          }).length !== 1)
        return fail("延後送印的玩家取捨紀錄缺失");
    }

    /* 校樣快照是 append-only 的歷史，不可拿目前已修好的版面回填舊錯稿。
       以 submittedAt 為切點，從每筆玩家操作重建當時六槽、署名與邊界，
       再用同一 proofAudit 重算快照種類與失敗原因。 */
    function proofStateAt(submittedAt) {
      var slotsAt = [];
      lab.proof.slotAttempts.forEach(function (attempt) {
        if (attempt.at >= submittedAt) return;
        var found = false;
        slotsAt = slotsAt.map(function (slot) {
          if (slot.slot !== attempt.slot) return slot;
          found = true;
          return {
            slot: attempt.slot,
            evidenceId: attempt.evidenceId,
            placedAt: attempt.at
          };
        });
        if (!found) {
          slotsAt.push({
            slot: attempt.slot,
            evidenceId: attempt.evidenceId,
            placedAt: attempt.at
          });
        }
      });
      var attributionAt = {};
      lab.proof.attributionAttempts.forEach(function (attempt) {
        if (attempt.at < submittedAt)
          attributionAt[attempt.contribution] = attempt.person;
      });
      var hookeScopeAt = null;
      lab.proof.hookeScopeAttempts.forEach(function (attempt) {
        if (attempt.at < submittedAt) hookeScopeAt = attempt.choice;
      });
      var boundaryAt = null;
      lab.proof.boundaryAttempts.forEach(function (attempt) {
        if (attempt.at < submittedAt) boundaryAt = attempt.choice;
      });
      var shellReadyAt = isInt(lab.proof.shellPageRevealedAt) &&
        lab.proof.shellPageRevealedAt < submittedAt;
      var shellPlacedAt = isInt(lab.proof.shellPagePlacedAt) &&
        lab.proof.shellPagePlacedAt < submittedAt;
      var authorAt = {
        names: ["Newton", "Traveler"],
        travelerRemoved: false
      };
      if (isInt(lab.proof.authorField.removedAt) &&
          lab.proof.authorField.removedAt < submittedAt) {
        authorAt = {
          names: ["Newton"],
          travelerRemoved: true,
          removedAt: lab.proof.authorField.removedAt
        };
      }
      return {
        slots: slotsAt,
        attribution: attributionAt,
        hookeScope: hookeScopeAt,
        boundaryChoice: boundaryAt,
        shellPageReady: shellReadyAt,
        shellPagePlaced: shellPlacedAt,
        authorField: authorAt
      };
    }
    var proofRevisionTimes = lab.proof.slotAttempts
      .concat(lab.proof.attributionAttempts)
      .concat(lab.proof.hookeScopeAttempts)
      .concat(lab.proof.boundaryAttempts)
      .map(function (attempt) { return attempt.at; });
    for (var psiSnapshot = 0; psiSnapshot < press.proofs.length; psiSnapshot++) {
      var historicalProof = press.proofs[psiSnapshot];
      if (historicalProof.kind === "partial") continue;
      if (!engine4 || typeof engine4._proofAudit !== "function")
        return fail("缺少可重算校樣的第四章引擎");
      var rebuiltProof = proofStateAt(historicalProof.submittedAt);
      var rebuiltAudit = engine4._proofAudit({
        proof: rebuiltProof,
        evidence: { k1: true, k2: true, k3: true, k4: true }
      });
      var expectedComplete = rebuiltAudit.complete === true;
      var expectedSuperseded = expectedComplete &&
        proofRevisionTimes.some(function (at) {
          return at > historicalProof.submittedAt;
        });
      if (historicalProof.kind !==
            (expectedComplete ? "complete" : "wrong-proof") ||
          historicalProof.complete !== expectedComplete ||
          historicalProof.superseded !== expectedSuperseded ||
          JSON.stringify(historicalProof.audit) !== JSON.stringify(rebuiltAudit) ||
          JSON.stringify(historicalProof.slots) !==
            JSON.stringify(rebuiltProof.slots) ||
          JSON.stringify(historicalProof.attribution) !==
            JSON.stringify(rebuiltProof.attribution) ||
          historicalProof.hookeScope !== rebuiltProof.hookeScope ||
          historicalProof.boundaryChoice !== rebuiltProof.boundaryChoice ||
          historicalProof.shellPagePlaced !== rebuiltProof.shellPagePlaced ||
          JSON.stringify(historicalProof.authorField) !==
            JSON.stringify(rebuiltProof.authorField) ||
          historicalProof.openingChoice !== press.openingChoice ||
          JSON.stringify(historicalProof.priorityRecord) !==
            JSON.stringify(press.priorityRecord))
        return fail("校樣快照不是由送出當下的玩家操作重建");
    }

    var evidenceIds = ["k1", "k2", "k3", "k4", "k5"];
    for (var ei = 0; ei < evidenceIds.length; ei++)
      if (typeof lab.evidence[evidenceIds[ei]] !== "boolean") return fail("第四章證據狀態格式錯誤");
    if (lab.evidence.k5 !== (completeProofRows.length === 1))
      return fail("K5 與完整校樣送出紀錄不一致");
    if (lab.evidence.k1) {
      var currentSeal = lab.orbitLab.ruleSeal;
      var currentOrbitRun = !!currentSeal && (lab.orbitLab.ruleRuns || []).some(function (run) {
        return run && run.target === "earth-center" &&
          ["circle", "ellipse"].indexOf(run.actualShape) >= 0 &&
          run.sealedAt === currentSeal.sealedAt &&
          run.firstStepAt === lab.orbitLab.firstStepAt &&
          run.continuedAt === lab.orbitLab.continuedAt;
      });
      var sealedTangentAttempt = lab.sourceLab.attempts.some(function (attempt) {
        return attempt && attempt.choice === "tangent" && attempt.ok === true &&
          attempt.at === tangent.sealedAt;
      });
      if (!(tangent.sealed && sealedTangentAttempt && currentSeal &&
          currentSeal.target === "earth-center" &&
          lab.orbitLab.manualComplete && lab.orbitLab.continuedAt &&
          lab.orbitLab.closedRecord && currentOrbitRun &&
          (!engine4 || engine4._orbitRecordAudit(lab))))
        return fail("K1 與玩家親手作圖紀錄不一致");
    }
    if (lab.evidence.k2) {
      var k2Trial = lab.scaleLab.trials.some(function (trial) {
        return trial && trial.exponent === 2 && trial.sealed === true &&
          trial.revealedAfterSeal === true &&
          trial.moonSagM >= 4.7 && trial.moonSagM <= 5.1;
      });
      if (!(lab.scaleLab.relationCorrect && lab.scaleLab.conversionCorrect &&
          lab.scaleLab.ratioCorrect && lab.scaleLab.lawLocked === 2 &&
          lab.scaleLab.exponent === 2 && lab.scaleLab.earthRadiusRatio === 60 &&
          lab.scaleLab.timeRatio === 60 && lab.scaleLab.moonMatch === true &&
          lab.scaleLab.moonObservationRevealed === true && k2Trial))
        return fail("K2 與同尺紙判讀紀錄不一致");
      if (!migratedK2) {
        var predictionAt = lab.scaleLab.scalePrediction &&
          lab.scaleLab.scalePrediction.sealedAt;
        var predictionOpenedAt = lab.scaleLab.scalePrediction &&
          lab.scaleLab.scalePrediction.openedAt;
        var conversionAt = null, ratioAt = null, relationAt = null;
        lab.scaleLab.conversionAttempts.forEach(function (attempt) {
          if (attempt && attempt.choice === "divide-3600" && attempt.ok === true &&
              isInt(attempt.at) && (conversionAt == null || attempt.at < conversionAt))
            conversionAt = attempt.at;
        });
        lab.scaleLab.ratioAttempts.forEach(function (attempt) {
          if (attempt && Number(attempt.choice) === 3600 && attempt.ok === true &&
              isInt(attempt.at) && (ratioAt == null || attempt.at < ratioAt))
            ratioAt = attempt.at;
        });
        lab.scaleLab.relationAttempts.forEach(function (attempt) {
          if (attempt && attempt.choice === "multiply" && attempt.ok === true &&
              isInt(attempt.at) && (relationAt == null || attempt.at < relationAt))
            relationAt = attempt.at;
        });
        if (!isInt(predictionAt) || !isInt(predictionOpenedAt) ||
            !isInt(conversionAt) || !isInt(ratioAt) ||
            !isInt(relationAt) ||
            predictionOpenedAt !== lab.scaleLab.conversionAttempts[0].at ||
            lab.scaleLab.scalePrediction.matched !==
              (lab.scaleLab.scalePrediction.choice === "one-over-3600") ||
            lab.scaleLab.moonOneSecondSagMm !== 1.4 ||
            !(predictionAt < conversionAt && conversionAt < ratioAt && ratioAt < relationAt))
          return fail("K2 缺少玩家依序完成的同尺紙判讀");
      }
    }
    if (lab.evidence.k3) {
      var migratedK3 = migratedV1 && lab.planetLab.predictions.length === 2 &&
        lab.planetLab.predictions.every(function (prediction) {
          return prediction.source === "schema1-validated-k3";
        });
      var validPlanetPrediction = function (id) {
        var currentRows = lab.planetLab.predictions.filter(function (prediction) {
          return prediction && prediction.planet === id &&
            prediction.superseded !== true;
        });
        return currentRows.length === 1 && currentRows.some(function (prediction) {
          return prediction && prediction.planet === id && prediction.exponent === 2 &&
            prediction.sealed === true && prediction.revealedAfterSeal === true &&
            prediction.pass === true && prediction.superseded !== true &&
            prediction.sealedAt < prediction.openedAt &&
            lab.planetLab.residuals[id] === prediction.residualPct &&
            (!engine4 || engine4._planetPredictionAudit(prediction));
        });
      };
      if (!((lab.evidence.k1 || migratedK3) && lab.evidence.k2 &&
          lab.planetLab.crossScalePass === true &&
          lab.planetLab.revealed.mars === true &&
          lab.planetLab.revealed.jupiter === true &&
          validPlanetPrediction("mars") && validPlanetPrediction("jupiter")))
        return fail("K3 與封存後開啟的兩個行星預測不一致");
    }
    if (lab.evidence.k4) {
      var completeLedger = uniqueOrder.length === 3 && uniqueCompleted.length === 3 &&
        ledgerCases.every(function (id) {
          var row = lab.modelLab.rowStage[id];
          var expectedVortexStamp = id === "moon" ? "story" : "mismatch";
          var forceRun = lab.modelLab.runs.some(function (run) {
            return run.caseId === id && run.model === "inverseSquare" &&
              run.raw === true && run.fit === "matches";
          });
          var vortexRun = lab.modelLab.runs.some(function (run) {
            return run.caseId === id && run.model === "simpleVortex" &&
              run.raw === true && run.fit === expectedVortexStamp;
          });
          var forceStamped = lab.modelLab.stampAttempts.some(function (attempt) {
            return attempt.caseId === id && attempt.model === "inverseSquare" &&
              attempt.expected === "matches" && attempt.stamp === "matches" &&
              attempt.ok === true && attempt.at > row.openedAt &&
              attempt.at < row.completedAt;
          });
          var vortexStamped = lab.modelLab.stampAttempts.some(function (attempt) {
            return attempt.caseId === id && attempt.model === "simpleVortex" &&
              attempt.expected === expectedVortexStamp &&
              attempt.stamp === expectedVortexStamp && attempt.ok === true &&
              attempt.at > row.openedAt && attempt.at < row.completedAt;
          });
          return row.complete && row.forceStamp === "matches" &&
            row.vortexStamp === expectedVortexStamp &&
            forceRun && vortexRun && forceStamped && vortexStamped;
        });
      var expectedLedgerStamps = ledgerCases.map(function (id) {
        var packageRow = lab.modelLab.rowStage[id] || {};
        return {
          caseId: id,
          inverseSquare: packageRow.forceStamp || null,
          vortex: packageRow.vortexStamp || null,
          loanDecision: lab.modelLab.loanDecisions[id] || null
        };
      });
      var evidencePackage = lab.modelLab.evidencePackage;
      var packageMatches = evidencePackage &&
        JSON.stringify(evidencePackage.rowOrder) === JSON.stringify(lab.modelLab.rowOrder) &&
        JSON.stringify(evidencePackage.stamps) === JSON.stringify(expectedLedgerStamps) &&
        JSON.stringify(evidencePackage.loans) === JSON.stringify(lab.modelLab.loans) &&
        typeof evidencePackage.claimText === "string" &&
        (!engine4 || evidencePackage.claimText === engine4._ledgerClaimText(lab.modelLab));
      if (!(lab.evidence.k1 && lab.evidence.k2 && lab.evidence.k3 &&
          press.openingChoice && press.priorityRecord &&
          completeLedger && lab.cometLab && lab.cometLab.joined === true &&
          lab.modelLab.gravityComplete === true &&
          lab.modelLab.vortexComplete === true &&
          lab.modelLab.comparisonClaim === "actual-ledger" &&
          lab.modelLab.comparisonSealed === true && packageMatches))
        return fail("K4 與逐格蓋章／借條／出版取捨紀錄不一致");
    }
    var chapterEvidence = state.evidence;
    if (!chapterEvidence || typeof chapterEvidence !== "object" || Array.isArray(chapterEvidence))
      return fail("章節證據格式錯誤");
    for (var eti = 0; eti < evidenceIds.length; eti++) {
      var upper = evidenceIds[eti].toUpperCase();
      if (!!chapterEvidence[upper] !== !!lab.evidence[evidenceIds[eti]])
        return fail("章節證據與工作台狀態不一致");
    }
    if (lab.claims != null) {
      if (!lab.claims || typeof lab.claims !== "object" || Array.isArray(lab.claims) ||
          Object.keys(lab.claims).some(function (id) { return evidenceIds.indexOf(id) < 0; }))
        return fail("第四章斷言紀錄格式錯誤");
      for (var claimKey of evidenceIds) {
        var claimRows = lab.claims[claimKey];
        if (!Array.isArray(claimRows) || claimRows.length > 100)
          return fail("第四章斷言紀錄格式錯誤");
        var allowedClaimActions = {
          k1: ["assertK1"],
          k2: ["judgeScaleRelation", "assertK2", "migrationCarryK2"],
          k3: ["assertK3", "migrationCarryK3"],
          k4: ["sealModelComparison", "assertK4"],
          k5: ["submitProof"]
        };
        for (var cri = 0; cri < claimRows.length; cri++) {
          var claimRow = claimRows[cri];
          if (!claimRow || claimRow.id !== cri + 1 ||
              !Array.isArray(claimRow.sources) || claimRow.sources.length > 8 ||
              claimRow.sources.some(function (source) {
                return typeof source !== "string" || source.length > 80;
              }) ||
              (claimRow.concept != null &&
                (typeof claimRow.concept !== "string" || claimRow.concept.length > 80)) ||
              typeof claimRow.ok !== "boolean" ||
              !isInt(claimRow.at) || claimRow.at < 1 ||
              claimRow.at > lab.sequence ||
              allowedClaimActions[claimKey].indexOf(claimRow.action) < 0 ||
              ["player-assertion", "schema1-validated-claim"]
                .indexOf(claimRow.source) < 0 ||
              (claimRow.source === "schema1-validated-claim" &&
                (!migratedV1 ||
                 ["migrationCarryK2", "migrationCarryK3"]
                   .indexOf(claimRow.action) < 0 ||
                 claimRow.at > state.migration.baseSequence)) ||
              (claimRow.source === "player-assertion" && migratedV1 &&
                claimRow.at <= state.migration.baseSequence) ||
              (cri && claimRow.at <= claimRows[cri - 1].at))
            return fail("第四章斷言紀錄含無法辨識的資料");
          if (claimRow.source === "player-assertion") {
            var claimMigrationIndex = migratedV1
              ? state.eventLog.findIndex(function (event) {
                  return event && event.t === "migration";
                }) : -1;
            var matchingClaimEvents = state.eventLog.filter(function (event, index) {
              return index > claimMigrationIndex && event &&
                event.t === "lab" && event.action === claimRow.action &&
                event.sequence === claimRow.at;
            });
            if (matchingClaimEvents.length !== 1)
              return fail("第四章斷言缺少同一次玩家操作事件");
            if (["assertK1", "assertK2", "assertK3", "assertK4"]
                .indexOf(claimRow.action) >= 0) {
              var eventArgs = matchingClaimEvents[0].args;
              var eventSources = eventArgs && Array.isArray(eventArgs.records)
                ? Array.from(new Set(eventArgs.records)).sort() : [];
              var eventConcept = claimRow.action === "assertK4"
                ? eventArgs && eventArgs.claim
                : eventArgs && eventArgs.concept;
              if (JSON.stringify(eventSources) !==
                    JSON.stringify(claimRow.sources.slice().sort()) ||
                  eventConcept !== claimRow.concept)
                return fail("第四章斷言文字與玩家送出的選項不一致");
            }
          }

          var sortedClaimSources = claimRow.sources.slice().sort();
          var expectedClaimSources = null, expectedClaimConcept = null;
          if (claimKey === "k1") {
            expectedClaimSources = ["closed", "tangent"];
            expectedClaimConcept = "forward-plus-inward-turn";
          } else if (claimKey === "k2") {
            expectedClaimSources = ["earth-fall", "moon-sag", "scale-60-60"];
            expectedClaimConcept = "inverse-square-cross-scale";
          } else if (claimKey === "k3") {
            expectedClaimSources = ["jupiter-sealed", "mars-sealed"];
            expectedClaimConcept = "withheld-data-prediction";
          } else if (claimKey === "k4" &&
              claimRow.action === "sealModelComparison") {
            expectedClaimSources = ledgerCases.map(function (id) {
              return "ledger:" + id;
            }).concat(lab.modelLab.loans.map(function (loan) {
              return "loan:" + loan.caseId;
            })).sort();
            expectedClaimConcept = "same-rule-fewer-player-recorded-loans";
          } else if (claimKey === "k5") {
            expectedClaimSources = ["K1", "K2", "K3", "K4", "SHELL"];
            expectedClaimConcept = "sources-and-rule-scoped";
          }
          var wordsMatch = expectedClaimSources == null ||
            (JSON.stringify(sortedClaimSources) ===
              JSON.stringify(expectedClaimSources.slice().sort()) &&
             claimRow.concept === expectedClaimConcept);
          var expectedClaimOk = false;
          if (claimRow.action === "migrationCarryK2" ||
              claimRow.action === "migrationCarryK3") {
            expectedClaimOk = wordsMatch;
          } else if (claimRow.action === "assertK1") {
            var latestSealAt = Math.max.apply(Math, [-1]
              .concat((lab.orbitLab.ruleRuns || []).map(function (run) {
                return run.sealedAt < claimRow.at ? run.sealedAt : -1;
              }))
              .concat((lab.orbitLab.manualAttempts || []).map(function (attempt) {
                return attempt.seal.sealedAt < claimRow.at
                  ? attempt.seal.sealedAt : -1;
              }))
              .concat(lab.orbitLab.ruleSeal &&
                lab.orbitLab.ruleSeal.sealedAt < claimRow.at
                  ? [lab.orbitLab.ruleSeal.sealedAt] : []));
            expectedClaimOk = wordsMatch &&
              (lab.orbitLab.ruleRuns || []).some(function (run) {
                return run.sealedAt === latestSealAt &&
                  run.continuedAt < claimRow.at &&
                  run.target === "earth-center" &&
                  ["circle", "ellipse"].indexOf(run.actualShape) >= 0;
              });
          } else if (claimRow.action === "judgeScaleRelation" ||
              claimRow.action === "assertK2") {
            var relationReady = lab.scaleLab.relationAttempts.some(function (row) {
              return row.ok === true && row.at <= claimRow.at;
            });
            expectedClaimOk = wordsMatch && relationReady;
          } else if (claimRow.action === "assertK3") {
            expectedClaimOk = wordsMatch &&
              ["mars", "jupiter"].every(function (planet) {
                return lab.planetLab.predictions.some(function (prediction) {
                  return prediction.planet === planet &&
                    prediction.pass === true &&
                    prediction.openedAt < claimRow.at;
                });
              });
          } else if (claimRow.action === "sealModelComparison") {
            expectedClaimOk = wordsMatch &&
              lab.modelLab.comparisonSealedAt === claimRow.at;
          } else if (claimRow.action === "assertK4") {
            expectedClaimOk = lab.modelLab.comparisonSealed === true &&
              lab.modelLab.evidencePackage != null &&
              claimRow.concept === "same-rule-fewer-patches";
          } else if (claimRow.action === "submitProof") {
            expectedClaimOk = wordsMatch && press.proofs.some(function (proofRow) {
              return proofRow.kind === "complete" &&
                proofRow.complete === true &&
                proofRow.submittedAt === claimRow.at;
            });
          }
          if (claimRow.ok !== expectedClaimOk)
            return fail("第四章斷言結果不是由當時證據重算");
        }
      }
    }
    function hasExactSuccessfulClaim(key, sources, concept) {
      var expectedSources = sources.slice().sort();
      return !!(lab.claims && Array.isArray(lab.claims[key]) &&
        lab.claims[key].some(function (row) {
          return row && row.ok === true && row.concept === concept &&
            JSON.stringify((row.sources || []).slice().sort()) ===
              JSON.stringify(expectedSources);
        }));
    }
    if (lab.evidence.k1 &&
        !hasExactSuccessfulClaim("k1", ["closed", "tangent"],
          "forward-plus-inward-turn"))
      return fail("K1 缺少與目前作圖一致的成功斷言");
    if (lab.evidence.k2 &&
        !hasExactSuccessfulClaim("k2",
          ["earth-fall", "moon-sag", "scale-60-60"],
          "inverse-square-cross-scale"))
      return fail("K2 缺少與目前同尺紙一致的成功斷言");
    if (lab.evidence.k3 &&
        !hasExactSuccessfulClaim("k3",
          ["jupiter-sealed", "mars-sealed"],
          "withheld-data-prediction"))
      return fail("K3 缺少與目前封存預測一致的成功斷言");
    if (lab.evidence.k4) {
      var k4Sources = ledgerCases.map(function (id) { return "ledger:" + id; })
        .concat(lab.modelLab.loans.map(function (loan) {
          return "loan:" + loan.caseId;
        }));
      if (!hasExactSuccessfulClaim("k4", k4Sources,
          "same-rule-fewer-player-recorded-loans"))
        return fail("K4 缺少與目前蓋章／借條一致的成功斷言");
    }
    if (lab.evidence.k5) {
      if (!["k1", "k2", "k3", "k4"].every(function (id) {
        return lab.evidence[id];
      })) return fail("K5 缺少前四份有效證據");
      if (!hasExactSuccessfulClaim("k5",
          ["K1", "K2", "K3", "K4", "SHELL"],
          "sources-and-rule-scoped"))
        return fail("K5 缺少與目前校樣一致的成功斷言");
      if (engine4 && !engine4._proofAudit(lab).complete)
        return fail("完成證據與校樣內容不一致");
      var shellRevealedAt = lab.proof.shellPageRevealedAt;
      var shellPlacedAt = lab.proof.shellPagePlacedAt;
      var authorRemovedAt = lab.proof.authorField.removedAt;
      if (!isInt(shellRevealedAt) || !isInt(shellPlacedAt) ||
          !isInt(authorRemovedAt) ||
          !(shellRevealedAt < shellPlacedAt &&
            shellPlacedAt < authorRemovedAt &&
            authorRemovedAt <= lab.sequence))
        return fail("K5 缺少玩家翻頁、放頁或退出作者欄的時間線");
      var completeProofSnapshot = press.proofs.some(function (snapshot) {
        return snapshot && snapshot.kind === "complete" &&
          snapshot.complete === true && snapshot.superseded !== true &&
          isInt(snapshot.submittedAt) &&
          authorRemovedAt < snapshot.submittedAt &&
          snapshot.submittedAt <= lab.sequence &&
          snapshot.audit && snapshot.audit.complete === true &&
          snapshot.openingChoice === press.openingChoice &&
          JSON.stringify(snapshot.priorityRecord) ===
            JSON.stringify(press.priorityRecord) &&
          JSON.stringify(snapshot.slots) === JSON.stringify(lab.proof.slots) &&
          JSON.stringify(snapshot.attribution) === JSON.stringify(lab.proof.attribution) &&
          snapshot.hookeScope === lab.proof.hookeScope &&
          snapshot.boundaryChoice === lab.proof.boundaryChoice &&
          snapshot.shellPagePlaced === lab.proof.shellPagePlaced &&
          JSON.stringify(snapshot.authorField) ===
            JSON.stringify(lab.proof.authorField);
      });
      if (!completeProofSnapshot)
        return fail("K5 缺少由玩家實際送出的完整校樣快照");
    }

    /* schema 2 的 sequence 是操作時鐘，不只是可任改的顯示數字。
       先驗每一次實際 tick 唯一，再驗各證據階段只能沿依賴方向前進。 */
    var operationTimes = [];
    function rememberOperation(label, at) {
      if (isInt(at)) operationTimes.push({ label: label, at: at });
    }
    lab.sourceLab.attempts.forEach(function (row) {
      rememberOperation("source", row.at);
    });
    lab.scaleLab.predictionAttempts.forEach(function (row) {
      rememberOperation("scale-prediction", row.sealedAt);
    });
    lab.scaleLab.conversionAttempts.forEach(function (row) {
      rememberOperation("scale-conversion", row.at);
    });
    lab.scaleLab.ratioAttempts.forEach(function (row) {
      rememberOperation("scale-ratio", row.at);
    });
    lab.scaleLab.relationAttempts.forEach(function (row) {
      rememberOperation("scale-relation", row.at);
    });
    lab.orbitLab.manualAttempts.forEach(function (attempt) {
      (attempt.beats || []).forEach(function (row) {
        rememberOperation("orbit-old-beat", row.at);
      });
      rememberOperation("orbit-reset", attempt.resetAt);
    });
    if (lab.orbitLab.ruleSeal) {
      rememberOperation("orbit-seal", lab.orbitLab.ruleSeal.sealedAt);
      lab.orbitLab.manualBeats.forEach(function (row) {
        rememberOperation("orbit-beat", row.at);
      });
      rememberOperation("orbit-continue", lab.orbitLab.continuedAt);
    }
    lab.orbitLab.ruleRuns.forEach(function (run) {
      var isCurrentRun = lab.orbitLab.ruleSeal &&
        run.sealedAt === lab.orbitLab.ruleSeal.sealedAt &&
        run.continuedAt === lab.orbitLab.continuedAt;
      if (isCurrentRun) return;
      rememberOperation("orbit-old-seal", run.sealedAt);
      (run.playerBeats || []).forEach(function (row) {
        rememberOperation("orbit-old-beat", row.at);
      });
      rememberOperation("orbit-old-continue", run.continuedAt);
    });
    lab.planetLab.predictions.forEach(function (row) {
      rememberOperation("planet-seal", row.sealedAt);
      rememberOperation("planet-open", row.openedAt);
    });
    windowedPressRecords.forEach(function (row) {
      rememberOperation("press-window", row.at);
    });
    rescheduledProofs.forEach(function (row) {
      rememberOperation("press-rescheduled", row.submittedAt);
    });
    (lab.cometLab && lab.cometLab.attempts || []).forEach(function (row) {
      rememberOperation("comet", row.at);
    });
    Object.keys(lab.modelLab.rowStage).forEach(function (id) {
      var row = lab.modelLab.rowStage[id];
      rememberOperation("ledger-open", row.openedAt);
      rememberOperation("ledger-complete", row.completedAt);
    });
    lab.modelLab.stampAttempts.forEach(function (row) {
      rememberOperation("ledger-stamp", row.at);
    });
    Object.keys(lab.modelLab.loanDecisionAt).forEach(function (id) {
      rememberOperation("ledger-loan", lab.modelLab.loanDecisionAt[id]);
    });
    lab.modelLab.comparisonAttempts.forEach(function (row) {
      rememberOperation("comparison", row.at);
    });
    lab.proof.slotAttempts.forEach(function (row) {
      rememberOperation("proof-slot", row.at);
    });
    lab.proof.hookeScopeAttempts.forEach(function (row) {
      rememberOperation("proof-scope", row.at);
    });
    lab.proof.attributionAttempts.forEach(function (row) {
      rememberOperation("proof-credit", row.at);
    });
    lab.proof.boundaryAttempts.forEach(function (row) {
      rememberOperation("proof-boundary", row.at);
    });
    rememberOperation("shell-reveal", lab.proof.shellPageRevealedAt);
    rememberOperation("shell-place", lab.proof.shellPagePlacedAt);
    rememberOperation("author-remove", lab.proof.authorField.removedAt);
    (lab.archiveLab && lab.archiveLab.clipAttempts || []).forEach(function (row) {
      rememberOperation("archive-clip", row.at);
    });
    evidenceIds.forEach(function (id) {
      (lab.claims[id] || []).forEach(function (row) {
        if (["assertK1", "assertK2", "assertK3", "assertK4",
             "migrationCarryK2", "migrationCarryK3"].indexOf(row.action) >= 0)
          rememberOperation("claim:" + id, row.at);
      });
    });
    var seenOperationTimes = {};
    for (var oti = 0; oti < operationTimes.length; oti++) {
      var operation = operationTimes[oti];
      if (seenOperationTimes[operation.at])
        return fail("玩家操作時鐘重複：" +
          seenOperationTimes[operation.at] + "／" + operation.label);
      seenOperationTimes[operation.at] = operation.label;
    }
    var orderedOperationTimes = operationTimes.map(function (row) { return row.at; })
      .sort(function (a, b) { return a - b; });
    if ((lab.sequence === 0 && orderedOperationTimes.length) ||
        (lab.sequence > 0 &&
          (!orderedOperationTimes.length ||
            orderedOperationTimes[orderedOperationTimes.length - 1] !== lab.sequence)))
      return fail("玩家操作時鐘尾端缺少不可刪除的紀錄");
    if (migratedV1) {
      var migrationIndexForBase = state.eventLog.findIndex(function (event) {
        return event && event.t === "migration";
      });
      var k0Provenance = [];
      state.transcript.forEach(function (row, index) {
        if (row && row.legacyScene === "D1-1" &&
            /^c1\.(arc|fall|tangent)$/.test(row.legacyNode || "")) {
          k0Provenance.push({
            choice: row.legacyNode.slice(3),
            at: index + 1,
            via: "transcript"
          });
        }
      });
      state.eventLog.forEach(function (event, index) {
        if (index < migrationIndexForBase && event &&
            event.t === "choice" && event.at === "D1-1/c1" &&
            ["arc", "fall", "tangent"].indexOf(event.pick) >= 0) {
          k0Provenance.push({
            choice: event.pick,
            at: state.transcript.length + index + 1,
            via: "eventLog"
          });
        }
      });
      var provenanceChoices = Array.from(new Set(k0Provenance.map(function (row) {
        return row.choice;
      })));
      var expectedK0At = null, expectedK0Via = null;
      if (k0Provenance.length === 1 ||
          (k0Provenance.length > 1 &&
            provenanceChoices.length === 1 &&
            provenanceChoices[0] === "tangent")) {
        k0Provenance.sort(function (a, b) { return a.at - b.at; });
        if (provenanceChoices[0] === "tangent") {
          expectedK0At = k0Provenance[0].at;
          expectedK0Via = Array.from(new Set(k0Provenance.map(function (row) {
            return row.via;
          }))).join("+");
        }
      }
      var nativeK0AfterMigration = expectedK0At == null &&
        tangent.sealed === true &&
        tangent.sealedAt > state.migration.baseSequence &&
        lab.orbitLab.tangentRecord &&
        lab.orbitLab.tangentRecord.source === "player-sealed-k0";
      if (state.migration.k0ProvenBy !== expectedK0Via ||
          (expectedK0At != null &&
            (!tangent.sealed || tangent.sealedAt !== expectedK0At)) ||
          (expectedK0At == null && tangent.sealed && !nativeK0AfterMigration))
        return fail("遷移的 K0 來源時間不是由舊對話紀錄重建");
      var expectedMigrationBase = expectedK0At || 0;
      var migratedK2Claims = (lab.claims.k2 || []).filter(function (row) {
        return row.action === "migrationCarryK2";
      });
      if (migratedK2Claims.length) {
        expectedMigrationBase += 1;
        if (migratedK2Claims.length !== 1 ||
            migratedK2Claims[0].at !== expectedMigrationBase)
          return fail("遷移的 K2 斷言時間不是 canonical 前綴");
      }
      var migratedPlanetRowsForBase = lab.planetLab.predictions.filter(function (row) {
        return row.source === "schema1-validated-k3";
      });
      for (var mpb = 0; mpb < migratedPlanetRowsForBase.length; mpb++) {
        expectedMigrationBase += 1;
        if (migratedPlanetRowsForBase[mpb].sealedAt !== expectedMigrationBase)
          return fail("遷移的 K3 封存時間不是 canonical 前綴");
        expectedMigrationBase += 1;
        if (migratedPlanetRowsForBase[mpb].openedAt !== expectedMigrationBase)
          return fail("遷移的 K3 開封時間不是 canonical 前綴");
      }
      var migratedK3Claims = (lab.claims.k3 || []).filter(function (row) {
        return row.action === "migrationCarryK3";
      });
      if (migratedK3Claims.length) {
        expectedMigrationBase += 1;
        if (migratedK3Claims.length !== 1 ||
            migratedK3Claims[0].at !== expectedMigrationBase)
          return fail("遷移的 K3 斷言時間不是 canonical 前綴");
      }
      var carriedK2AtMigration = migratedK2Claims.length === 1;
      var carriedK3AtMigration = migratedK3Claims.length === 1;
      if ((carriedK2AtMigration &&
            (!migrationSourceEvidence.K2 || expectedK0At == null ||
              !legacyCursorPast4(state.migration.originalCursor, "D2-2", "e1"))) ||
          (carriedK3AtMigration &&
            (!migrationSourceEvidence.K3 || !carriedK2AtMigration ||
              !legacyCursorPast4(state.migration.originalCursor, "D2-3", "e1"))))
        return fail("遷移攜帶的 K2／K3 早於舊版玩家完成里程碑");
      var expectedReacquire4 = ["K1", "K2", "K3", "K4", "K5"]
        .filter(function (id) {
          var carried = id === "K2" ? carriedK2AtMigration :
            (id === "K3" ? carriedK3AtMigration : false);
          return migrationSourceEvidence[id] && !carried;
        });
      if (JSON.stringify(state.migration.reacquire) !==
          JSON.stringify(expectedReacquire4))
        return fail("遷移重做清單不是由舊證據與可攜帶證據導出");
      var legacyToV2Scene4 = {
        "D0-1": "D0-1", "D0-2": "D0-2", "D1-1": "D1-1",
        "D1-2": "D1-2", "D1-3": "D1-2", "D2-1": "D2-1",
        "D2-2": "D1-2", "D2-3": "D3-1", "D3-1": "D4-1",
        "D3-2": "D4-1", "D3-3": "D4-2", "D3-4": "D4-2",
        "DE-1": "DE-1", "DE-2": "DE-2"
      };
      var expectedTargetScene4;
      if (expectedK0At == null && migrationSourceEvidence.K1) {
        expectedTargetScene4 = "D1-1";
      } else {
        expectedTargetScene4 =
          legacyToV2Scene4[state.migration.originalCursor.scene];
        [
          ["K2", "D1-2"], ["K1", "D2-1"], ["K3", "D3-1"],
          ["K4", "D4-1"], ["K5", "D4-2"]
        ].some(function (redo) {
          if (expectedReacquire4.indexOf(redo[0]) < 0) return false;
          expectedTargetScene4 = redo[1];
          return true;
        });
        var v2SceneOrder4 = [
          "D0-1", "D0-2", "D1-1", "D1-2", "D-INT-1", "D2-1",
          "D2-2", "D3-1", "D4-1", "D4-2", "DE-1", "DE-2"
        ];
        var targetSceneIndex4 = v2SceneOrder4.indexOf(expectedTargetScene4);
        [
          ["D1-1", expectedK0At != null],
          ["D1-2", carriedK2AtMigration],
          ["D2-1", false],
          ["D3-1", carriedK3AtMigration],
          ["D4-1", false],
          ["D4-2", false]
        ].some(function (gate) {
          if (targetSceneIndex4 <= v2SceneOrder4.indexOf(gate[0]) || gate[1])
            return false;
          expectedTargetScene4 = gate[0];
          return true;
        });
      }
      var expectedTargetNode4 = expectedTargetScene4 &&
        Object.keys(nodeOrder[expectedTargetScene4] || {})[0];
      if (!expectedTargetNode4 ||
          state.migration.targetCursor.scene !== expectedTargetScene4 ||
          state.migration.targetCursor.node !== expectedTargetNode4)
        return fail("遷移安全入口不是由舊游標與重做清單導出");
      if (state.migration.baseSequence !== expectedMigrationBase)
        return fail("遷移基準時鐘不是由可驗證的舊證據重建");
    }
    if (!migratedV1 &&
        (orderedOperationTimes.length !== lab.sequence ||
          orderedOperationTimes.some(function (at, index) { return at !== index + 1; })))
      return fail("玩家操作時鐘中間有紀錄被刪除");
    if (migratedV1) {
      var migrationBase = state.migration.baseSequence;
      var nativeOperationTimes = orderedOperationTimes.filter(function (at) {
        return at > migrationBase;
      });
      if (nativeOperationTimes.length !== lab.sequence - migrationBase ||
          nativeOperationTimes.some(function (at, index) {
            return at !== migrationBase + index + 1;
          }))
        return fail("遷移後的玩家操作時鐘中間有紀錄被刪除");
    }
    var supersededCompleteProofs = press.proofs.filter(function (record) {
      return record.kind === "complete" && record.complete === true &&
        record.superseded === true;
    });
    if (supersededCompleteProofs.some(function (record) {
      return !operationTimes.some(function (operation) {
        return operation.at > record.submittedAt;
      });
    })) return fail("舊完整校樣被標成失效，卻沒有更晚的重做操作");
    if (completeProofRows.length) {
      var activeProofTime = completeProofRows[0].submittedAt;
      if (operationTimes.some(function (operation) {
        return operation.at > activeProofTime &&
          operation.label !== "archive-clip" &&
          operation.label !== "claim:k5";
      }))
        return fail("有效完整校樣之後混入不可能的前置操作");
    }

    var firstScaleAt = lab.scaleLab.scalePrediction &&
      lab.scaleLab.scalePrediction.sealedAt;
    var successfulConversion = lab.scaleLab.conversionAttempts.find(function (row) {
      return row.ok === true;
    });
    var successfulRatio = lab.scaleLab.ratioAttempts.find(function (row) {
      return row.ok === true;
    });
    var successfulRelation = lab.scaleLab.relationAttempts.find(function (row) {
      return row.ok === true;
    });
    if (!migratedK2 && firstScaleAt != null &&
        (!tangent.sealed || !(tangent.sealedAt < firstScaleAt)))
      return fail("同尺紙預測早於切線來源紙");
    if (!migratedK2 && successfulConversion &&
        !(firstScaleAt < successfulConversion.at))
      return fail("同尺紙換算早於量級封存");
    if (!migratedK2 && successfulRatio &&
        (!successfulConversion || !(successfulConversion.at < successfulRatio.at)))
      return fail("同尺紙倍率判讀早於時間換算");
    if (!migratedK2 && successfulRelation &&
        (!successfulRatio || !(successfulRatio.at < successfulRelation.at)))
      return fail("同尺紙關係判讀早於倍率判讀");
    if (lab.orbitLab.ruleSeal && !migratedK2 &&
        (!successfulRelation ||
          !(successfulRelation.at < lab.orbitLab.ruleSeal.sealedAt)))
      return fail("作圖規則早於同尺紙成立");
    var nativePlanetRows = lab.planetLab.predictions.filter(function (row) {
      return row.source !== "schema1-validated-k3";
    });
    if (nativePlanetRows.length &&
        (!lab.orbitLab.continuedAt ||
          nativePlanetRows.some(function (row) {
            return row.sealedAt <= lab.orbitLab.continuedAt;
          })))
      return fail("行星封存預測早於玩家作圖與牛頓續畫");
    var openedPlanetTimes = lab.planetLab.predictions.map(function (row) {
      return row.openedAt;
    }).filter(isInt);
    var lastPlanetOpen = openedPlanetTimes.length
      ? Math.max.apply(Math, openedPlanetTimes) : null;
    if (press.priorityRecord) {
      var priorDiscoveryTimes = [lab.orbitLab.continuedAt, lastPlanetOpen].filter(isInt);
      if (priorDiscoveryTimes.length < 2 ||
          press.priorityRecord.at <= Math.max.apply(Math, priorDiscoveryTimes))
        return fail("出版取捨早於 K1／K3 證據成立");
    }
    var openingAt = press.priorityRecord && press.priorityRecord.at;
    var ledgerOpenTimes = Object.keys(lab.modelLab.rowStage).map(function (id) {
      return lab.modelLab.rowStage[id].openedAt;
    });
    var cometTimes = lab.cometLab && lab.cometLab.attempts.map(function (row) {
      return row.at;
    }) || [];
    if (openingAt != null &&
        ledgerOpenTimes.concat(cometTimes).some(function (at) {
          return at <= openingAt;
        }))
      return fail("彗星接軌或對帳桌早於出版取捨");
    if (lab.modelLab.comparisonSealedAt != null) {
      var ledgerEndTimes = Object.keys(lab.modelLab.rowStage).map(function (id) {
        return lab.modelLab.rowStage[id].completedAt;
      }).filter(isInt);
      var joinedCometAt = lab.cometLab && lab.cometLab.attempts.length
        ? lab.cometLab.attempts[lab.cometLab.attempts.length - 1].at : null;
      if (ledgerEndTimes.length !== 3 || !isInt(joinedCometAt) ||
          lab.modelLab.comparisonSealedAt <=
            Math.max.apply(Math, ledgerEndTimes.concat([joinedCometAt])))
        return fail("模型比較封條早於三列對帳或彗星接軌");
    }
    var proofActionTimes = lab.proof.slotAttempts.map(function (row) { return row.at; })
      .concat(lab.proof.hookeScopeAttempts.map(function (row) { return row.at; }))
      .concat(lab.proof.attributionAttempts.map(function (row) { return row.at; }))
      .concat(lab.proof.boundaryAttempts.map(function (row) { return row.at; }))
      .concat([
        lab.proof.shellPageRevealedAt,
        lab.proof.shellPagePlacedAt,
        lab.proof.authorField.removedAt
      ].filter(isInt));
    if (proofActionTimes.length &&
        (!isInt(lab.modelLab.comparisonSealedAt) ||
          proofActionTimes.some(function (at) {
            return at <= lab.modelLab.comparisonSealedAt;
          })))
      return fail("印刷台操作早於 K4 對帳封條");
    if (completeProofRows.length) {
      var finalProofAt = completeProofRows[0].submittedAt;
      if (!proofActionTimes.length ||
          finalProofAt <= Math.max.apply(Math, proofActionTimes))
        return fail("完整校樣早於六槽、署名或邊界操作");
      if (lab.archiveLab && lab.archiveLab.clipAttempts.some(function (row) {
        return row.at <= finalProofAt;
      })) return fail("旅人筆記早於完整校樣送出");
    } else if (lab.archiveLab && lab.archiveLab.clipAttempts.length) {
      return fail("尚未送出完整校樣就夾回旅人筆記");
    }

    var cursorMilestones = [
      {
        scene: "D1-1", node: "e1",
        ok: tangent.sealed === true && tangent.choice === "tangent",
        label: "K0 切線來源紙"
      },
      { scene: "D1-2", node: "e1", ok: lab.evidence.k2, label: "K2 同尺紙" },
      { scene: "D2-1", node: "e1", ok: lab.evidence.k1, label: "K1 作圖法" },
      { scene: "D3-1", node: "e1", ok: lab.evidence.k3, label: "K3 封存預測" },
      { scene: "D4-1", node: "e1", ok: lab.evidence.k4, label: "K4 對帳桌" },
      { scene: "D4-2", node: "e1", ok: lab.evidence.k5, label: "K5 完整校樣" },
      {
        scene: "DE-1", node: "e1",
        ok: !!(lab.archiveLab && lab.archiveLab.complete),
        label: "證據回收"
      }
    ];
    for (var cmi = 0; cmi < cursorMilestones.length; cmi++) {
      var milestone = cursorMilestones[cmi];
      if (sceneOrder[milestone.scene] != null &&
          cursorPastMilestone(milestone.scene, milestone.node) &&
          !milestone.ok)
        return fail("故事位置已越過尚未完成的" + milestone.label);
    }
    if (state.ended && !(lab.evidence.k5 && lab.archiveLab && lab.archiveLab.complete))
      return fail("完章狀態與證據回收不一致");
    if (!Array.isArray(state.transcript) || state.transcript.length > 3000) return fail("對話紀錄格式錯誤");
    for (var t = 0; t < state.transcript.length; t++) {
      var line = state.transcript[t];
      if (!line || (!sceneIds[line.scene] &&
          !/^(D[0-4]-[0-9]+|INT-1|D-INT-1|DE-[12])$/.test(line.scene || "")) ||
          typeof line.text !== "string" || line.text.length > 2000)
        return fail("對話紀錄中有一筆格式錯誤");
    }
    /* NARRATIVE-CR-034：舊存檔若正停在兩座退役工作台，不再把玩家送回錯的 UI。
       依 state truth 回到對話決策；已完成者才略過，不替未完成者補造操作。 */
    if (state.cursor.scene === "D1-1" && state.cursor.node === "e1")
      state.cursor.node = tangent.sealed === true && tangent.choice === "tangent" ? "n4" : "c1";
    if (state.cursor.scene === "DE-1" && state.cursor.node === "e1")
      state.cursor.node = lab.archiveLab && lab.archiveLab.complete ? "g1" : "c1";
    return { ok: true, state: state };
  }

  /* 第五章白名單：碰撞紀錄、同批重算來源、追一筆與黏土深度。 */
  function sanitizeImport5(state, scenes) {
    if (!state || typeof state !== "object") return fail("存檔內容格式錯誤");
    var generic = scrub(state, 0, { n: LIMITS.maxNodes });
    if (generic) return fail(generic);
    if (state.schemaVersion !== 1 || state.chapter !== "ch5") return fail("存檔版本或章節不相容");
    if (state.mode !== "explore" && state.mode !== "scholar") return fail("遊戲模式無法辨識");
    if (!isInt(state.rep) || state.rep < 0 || state.rep > 5) return fail("信譽數值錯誤");
    var sceneIds = {}, nodeIds = {};
    (scenes && scenes.scenes || []).forEach(function (scene) {
      sceneIds[scene.id] = 1;
      nodeIds[scene.id] = {};
      (scene.nodes || []).forEach(function (node) { nodeIds[scene.id][node.id] = 1; });
    });
    if (!state.cursor || !sceneIds[state.cursor.scene] || !nodeIds[state.cursor.scene][state.cursor.node])
      return fail("存檔中的故事位置無法辨識");
    var reputation = sanitizeReputationLifecycle(state, scenes, "ch5");
    if (!reputation.ok) return reputation;
    var lab = state.lab;
    /* GB-ADR-036：舊存檔沒有選紙／判讀欄位；只在整個欄位缺席時依既有證據補相容值。
       新格式若刻意把單一判讀清空，仍須 fail closed。 */
    if (lab && !lab.selections) lab.selections = { collision: [], clay: [] };
    if (lab && !lab.judgments) lab.judgments = {
      j1: lab.evidence && lab.evidence.j1 ? "both-close" : null,
      j2: lab.evidence && lab.evidence.j2 ? "steel-close-putty-short" : null,
      j3: lab.evidence && lab.evidence.j3 ? "speed-squared" : null,
      followup: lab.evidence && lab.evidence.followup ? "legacy-unsealed" : null
    };
    if (!lab || !isInt(lab.days) || lab.days < 0 || lab.days > 9999 ||
        !lab.draft || !Array.isArray(lab.collisionRuns) || !Array.isArray(lab.clayRuns) ||
        !lab.assertions || !lab.evidence || !lab.selections || !lab.judgments ||
        !Array.isArray(lab.selections.collision) || !Array.isArray(lab.selections.clay))
      return fail("第五章工作台紀錄格式錯誤");
    if (lab.collisionRuns.length > 300 || lab.clayRuns.length > 300)
      return fail("第五章實驗紀錄過多");
    if (["steel", "putty"].indexOf(lab.draft.head) < 0 ||
        ["low", "mid", "high"].indexOf(lab.draft.speed) < 0 ||
        ["4/4", "4/8"].indexOf(lab.draft.masses) < 0 ||
        ["h1", "h4", "h9"].indexOf(lab.draft.clayHeight) < 0 ||
        ["light", "heavy"].indexOf(lab.draft.ballMass) < 0)
      return fail("第五章工作台設定無法辨識");
    for (var i = 0; i < lab.collisionRuns.length; i++) {
      var row = lab.collisionRuns[i];
      if (!row || !isInt(row.id) || row.kind !== "collision" ||
          ["steel", "putty"].indexOf(row.head) < 0 ||
          ["low", "mid", "high"].indexOf(row.speedBand) < 0 ||
          ["4/4", "4/8"].indexOf(row.masses) < 0 ||
          !row.momentum || !row.visViva ||
          !isFinite(row.momentum.before) || !isFinite(row.momentum.after) ||
          !isFinite(row.visViva.before) || !isFinite(row.visViva.after) ||
          !isFinite(row.visViva.deficit))
        return fail("第五章碰撞紀錄格式錯誤");
    }
    for (var j = 0; j < lab.clayRuns.length; j++) {
      var clay = lab.clayRuns[j];
      if (!clay || !isInt(clay.id) || clay.kind !== "clay" ||
          [1, 4, 9].indexOf(clay.height) < 0 || [2, 4, 6].indexOf(clay.speed) < 0 ||
          ["light", "heavy"].indexOf(clay.ballMass) < 0 ||
          !isFinite(clay.depth) || !isFinite(clay.readingError))
        return fail("第五章黏土紀錄格式錯誤");
    }
    var assertionKeys = ["j1", "j2", "j3"];
    for (var ak = 0; ak < assertionKeys.length; ak++) {
      var assertion = lab.assertions[assertionKeys[ak]];
      if (!assertion || typeof assertion.done !== "boolean" || !Array.isArray(assertion.sources))
        return fail("第五章斷言紀錄格式錯誤");
    }
    try {
      var collisionIds = {};
      lab.collisionRuns.forEach(function (row) { collisionIds[row.id] = true; });
      var clayIds = {};
      lab.clayRuns.forEach(function (row) { clayIds[row.id] = true; });
      if (lab.assertions.j1.sources.some(function (id) { return !collisionIds[id]; }) ||
          lab.assertions.j2.sources.some(function (id) { return !collisionIds[id]; }) ||
          lab.assertions.j3.sources.some(function (id) { return !clayIds[id]; }))
        return fail("第五章斷言引用了不存在的紀錄");
      if (lab.selections.collision.some(function (id) { return !collisionIds[id]; }) ||
          lab.selections.clay.some(function (id) { return !clayIds[id]; }) ||
          new Set(lab.selections.collision).size !== lab.selections.collision.length ||
          new Set(lab.selections.clay).size !== lab.selections.clay.length)
        return fail("第五章勾選引用了不存在或重複的原紙");
    } catch (e) {
      return fail("第五章斷言紀錄格式錯誤");
    }
    if (lab.evidence.j1 !== lab.assertions.j1.done ||
        lab.evidence.j2 !== lab.assertions.j2.done ||
        lab.evidence.j3 !== lab.assertions.j3.done)
      return fail("第五章證據狀態與斷言不一致");
    var judgmentAllowed = {
      j1: [null, "both-close", "steel-only", "putty-breaks"],
      j2: [null, "steel-close-putty-short", "both-close", "both-short"],
      j3: [null, "speed-squared", "speed-linear", "height-independent"],
      followup: [null, "always-half", "changes-with-mass", "same-amount", "legacy-unsealed"]
    };
    for (var judgmentKey in judgmentAllowed) {
      if (judgmentAllowed[judgmentKey].indexOf(lab.judgments[judgmentKey]) < 0)
        return fail("第五章判讀狀態無法辨識");
    }
    if ((lab.evidence.j1 && lab.judgments.j1 !== "both-close") ||
        (lab.evidence.j2 && lab.judgments.j2 !== "steel-close-putty-short") ||
        (lab.evidence.j3 && lab.judgments.j3 !== "speed-squared"))
      return fail("第五章證據與玩家判讀不一致");
    if (lab.evidence.j3) {
      var chosenClay = lab.clayRuns.filter(function (row) {
        return lab.assertions.j3.sources.indexOf(row.id) >= 0;
      });
      var ratios = chosenClay.map(function (row) { return row.depth / (row.speed * row.speed); });
      var mean = ratios.reduce(function (sum, value) { return sum + value; }, 0) / ratios.length;
      if (!(mean > 0) || ratios.some(function (value) { return Math.abs(value - mean) / mean > 0.08; }))
        return fail("第五章 J3 原紙不支持速度平方關係");
    }
    if (lab.evidence.followup &&
        !lab.collisionRuns.some(function (row) {
          return row.masses === "4/8" && row.head === "putty" &&
            row.momentum.before === 24 && row.momentum.after === 24 &&
            row.visViva.before === 144 && row.visViva.after === 48;
        }))
      return fail("第五章追一筆狀態與紀錄不一致");
    if (!Array.isArray(state.transcript) || state.transcript.length > 3000)
      return fail("對話紀錄格式錯誤");
    for (var t = 0; t < state.transcript.length; t++) {
      var line = state.transcript[t];
      if (!line || !sceneIds[line.scene] || typeof line.text !== "string" || line.text.length > 2400)
        return fail("對話紀錄中有一筆格式錯誤");
    }
    return { ok: true, state: state };
  }

  var api = { sanitizeImport: sanitizeImport, sanitizeImport2: sanitizeImport2,
    sanitizeImport3: sanitizeImport3, sanitizeImport4: sanitizeImport4,
    sanitizeImport5: sanitizeImport5,
    _scrub: scrub, LIMITS: LIMITS };
  if (typeof module === "object" && module.exports) { module.exports = api; }
  else { root.GB = root.GB || {}; root.GB.Sanitize = api; }
})(typeof self !== "undefined" ? self : this);
