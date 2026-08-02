# 《發現之前》claim → evidence → status → repair：P3/P4 實作路徑與風險規格

**版本**：v1.0
**日期**：2026-08-02
**性質**：施工規格，不修改 runtime
**適用基線**：現行 `greybox`，自動測試基線 `139 通過，0 失敗`
**配套法源**：`發現之前_四層機制_完整實作規格_Claude_20260802.md`、GB-ADR-030 及既有章別 sanitizer

---

## 0. 執行結論

採用四層架構，但施工時必須守住三個邊界：

1. **主張狀態是事實來源，舊 `rep`／`persuasion` 暫時只是相容投影。** 不可一次刪掉舊欄位，也不可先改存檔再補行為。
2. **四類事件不是靠中文文案或 `rep` 正負號猜出來。** 每一個會影響主張或研究誠信的選項都要帶穩定 `eventCode` 與明示 metadata；玩家可見文案另放 `reason`。
3. **普通配錯與越界必須分流。** `mismatch` 只影響當次論證對位；`overreach`／`authority-substitution` 才能暫停研究誠信；`repair` 必須指回一筆尚未修復的具名事件。

推薦部署順序不是一次升級：

`P0 介面改名與 metadata → P1 第五章 shadow 雙寫 → P2 第五章切換 → P3 五章展開 → P4 存檔切換與舊欄位退役`

任何階段出現新舊結果不一致，先關閉新 reader/renderer，舊 `rep`、`state.debate.persuasion` 與章別工作台仍可完整回退。

---

## 1. 先修正 Claude 規格中的現況假設

### Q1：現行 persuasion 路徑

- **ch1／ch2／ch5 完全相同**：進入辯論時由 `greybox/src/narrative.js::debateInit()` 建立 `state.debate.persuasion`。
- 初值分別讀 `greybox/data/debate.json`、`debate2.json`、`debate5.json` 頂層的 `persuasion`，目前皆為 5。
- 扣減由共用 `debatePersuasion()` 寫回 `state.debate.persuasion`；複盤再入由 `debateReenter()` 重設。
- **ch3 是另一套狀態**：`state.lab.caseFile.dossier.debate.rep`，由 `engine3.js` 自己扣減、歸零退回船上，不能映射成 `state.debate.persuasion`。

因此 P3 遷移應為：

```text
ch1/ch2/ch5: state.debate.persuasion -> alignment.value
ch3:         不建立 alignment；dossier.debate.rep 先保留為 legacy anti-bruteforce adapter
ch4:         不建立 alignment
```

### Q2：量表渲染函式

一般辯論有兩個可見入口，不是只改一處：

| 位置 | 函式 | 現行內容 | 修改 |
|---|---|---|---|
| 辯論工作台 | `chapter-ui.js::renderPillarTrack()` | `說服力`＋五點 | 改 `論證對位`＋五點，更新 aria-label |
| 頁首狀態列 | `chapter-ui.js::renderStatus()` | ch1/ch2/ch5 `說服力：X/5` | 改 `論證對位：X/5` |
| 辯論容器 | `chapter-ui.js::renderDebate()` | 呼叫 `renderPillarTrack()` | 邏輯不改；歸零文案同步改名 |
| ch3 卷宗 | `chapter-ui.js::renderShipDossierDebateTrack()` | 另畫 `dossier.debate.rep` 五點 | P0 先改成 `卷宗對位`；P3 改由簽名／缺口視圖取代數字 |
| 開場說明 | `src/stage/07-intro-inputs.part.js` | 仍有說服力文案 | 改 source part 後重建 `stage-ui.js`，不可只改 bundle |

統一玩家文案：

> **論證對位｜4/5**
> 看證據有沒有咬住主張；配錯會退回，歸零先複盤。

### Q3：ch3 dossier 五項條件

**沒有五個獨立布林旗標。** 現況把條件分散在每一筆原紙：

- `record.filed`
- `record.stage`／`record.classification`
- `record.release`
- `record.speedRecord`
- `record.sameStone`／`record.sameHeight`
- 同一組可比原紙的筆數
- 高階結論另存在 `dossier.assertions.A1/A2/A3/A6/A4/A5...` 與 `dossier.debate.pillars.p1/p2/p3`

因此 Claude 所列 `baseline/steady/release/sealed/repeat` **不能各自從任意航次分開湊齊**。那會允許「A 航次有門閂、B 航次封存、C 航次做三次」拼成假資格。

`engine3.js::_pressureView()` 必須以**同一批合格原紙 cohort** 原子推導。最低判準：

```js
eligible = records.filter(row =>
  row.filed === true &&
  row.stage === "steady" &&
  row.classification === "近似穩速" &&
  row.release === "latch" &&
  row.speedRecord === "beats" &&
  row.sameStone !== false &&
  row.sameHeight !== false
)
cohort = groupByComparableFingerprint(eligible).find(rows => rows.length >= 3)
```

若簽名欄仍要顯示五格，五格只能是此 cohort 的衍生視圖，不是五個可獨立累積的存檔旗標。若「停船基準」是指船艙停泊對照，則須另由 `dossier.blind.records` 的 dock/steady 配對或 `assertions.A2` 推導，不可拿甲板走穩原紙代替。這一項名稱與物理意義需總監在 P1 前拍板。

### 其他需要修正的 schema 前提

1. 第一章現行 `schemaVersion` 已是 3；第二、三、五章是 1，第四章是 2。不可把「五章統一升 3」當成天然安全：第一章若要新增不相容結構，需升 4 或把新欄位設計成 schema 3 的向後相容 optional extension。
2. 現行 rep event 的 `at` 是 `sourceId` 字串，不是全域數字 tick。遷移不可直接宣稱它是單調無間隙時鐘。
3. 不接受「舊檔沒有 rep event 時，照 `rep` 數字合成 delta」：這會把手改 `rep=5` 的檔案洗白。舊檔必須先通過現行章別 sanitizer；只有 `rep===3` 且無事件可視為乾淨初始狀態。
4. `RepEvent.kind` 必須納入 `authority-substitution`，不能把所有負事件都粗略標成 `overreach`。

---

## 2. 事件分類系統

### 2.1 不從效果組合自動猜類型

建議在 choice option、debate option 或 engine action result 上加入同一個 envelope：

```json
{
  "epistemic": {
    "version": 1,
    "kind": "mismatch",
    "eventCode": "ch5.fr.claim.same-thing",
    "claimId": "ch5.claim.two-ledgers",
    "evidenceIds": ["J1", "J2", "J3"],
    "boundaryId": "ch5.boundary.separate-quantities",
    "authorityRef": null,
    "repairOf": []
  }
}
```

另以 `claim` 描述正向狀態轉移：

```json
{
  "claim": {
    "id": "ch5.claim.two-ledgers",
    "transition": "anchor",
    "evidenceIds": ["J1", "J2", "J3"],
    "boundaryId": "ch5.boundary.separate-quantities",
    "repairs": []
  }
}
```

**`anchor` 不是第五種錯誤事件。** 它是 claim transition。這可避免把所有正向信譽誤叫成 `repair`。

### 2.2 四類事件的明確判定

#### A. `mismatch`：配錯／讀錯，但沒有越過證據邊界

必須同時滿足：

1. 玩家把一份存在且可用的證據配到錯的支柱、錯的帳、錯的局部結論，或對資料做了不成立的普通判讀。
2. 選項沒有宣稱未量到的事、沒有擴大適用範圍、沒有刪掉不利資料、沒有拿人名替代證據。
3. metadata 明示 `kind:'mismatch'`。

允許的 effects：

- `persuasion/alignment < 0`
- 記錄 attempt/misfile
- 退回當前步驟

禁止的 effects：

- `rep < 0`
- `repLocked`
- 建立 repair target
- 把 claim 設成 `overreach`

範例：ch5 `debate5.json` 的 `same-thing`，現行只扣 persuasion，應標為 `mismatch`。

#### B. `overreach`：內容超過現有紙張可支持的範圍

任一條成立即可，但必須有 explicit metadata：

- 把局部／特定條件結果擴成全域規律。
- 宣稱未觀測、未量測或尚未證成的因果／去向。
- 抹去、隱去、丟棄對自己不利但有效的證據。
- 聲稱做過實際未做的測量或偽造來源。
- 把「相似」寫成「同一事件已證明」。

必填：`eventCode`、`claimId`、`boundaryId`、至少一個 `evidenceId` 或 `missingEvidenceId`。

效果：

- 產生 unresolved integrity event。
- claim 狀態進入 `overreach`，原句保留。
- 研究誠信可 −1；若章內正式辯論同時配錯，也可另外扣 alignment。
- 不得由一般重試自動清除。

#### C. `authority-substitution`：以權威、未來知識或身分取代可檢查證據

必須同時滿足：

1. 主張的主要支持理由是人名、名望、未來教科書、大家都知道、旅人的特殊身分等。
2. 當下缺少本章允許的可查證據。
3. metadata 明示 `authorityRef` 與 `expectedEvidenceIds`／`boundaryId`。

效果與 `overreach` 同屬研究誠信事件，但 UI／修復要求不同：修復時必須撤回權威代理，重新連結可查紙張；不能只把句子縮短。

#### D. `repair`：針對一筆尚未解決的具名事件完成可驗證修復

必須全部滿足：

1. `repairOf` 指向目前 unresolved 的 `overreach` 或 `authority-substitution` eventCode。
2. 修訂後 claim 仍保留原句（劃線／紅圈），並新增 revised claim 或縮限 boundary。
3. 修復動作符合事件型別：
   - overreach：`withdraw` 或 `narrow`，並保留證據邊界。
   - authority-substitution：`withdraw-authority` 並 `attach-source`。
4. 修復材料確實存在於 state，不能只靠選項文字宣稱已修。

效果：只清除 `repairOf` 指定事件。若仍有其他 unresolved 事件，integrity 仍為 suspended。正向信譽最多執行一次。

### 2.3 優先順序與衝突規則

同一操作可能同時配錯又越界，採最嚴格類型：

`authority-substitution > overreach > mismatch`

但 local alignment 與 integrity 可以同時變動。例如 ch1 用未來牛頓名聲打錯支柱：

- alignment −1：證據與支柱沒對上。
- integrity −1：拿權威替代可查證據。
- 只產生一筆 `authority-substitution` integrity event，不能再重複產生 overreach event。

### 2.4 動態 anchor／repair

ch3 `C0-3/c1.bounded` 可有兩種合法結果：

- 玩家未先越界：直接 `anchor`。
- 玩家先選 `all` 造成同 claim unresolved overreach，再收窄：`repair` 該 event。

不得從 reason 文案猜。option metadata 應明列：

```json
{
  "claim": {
    "id": "ch3.claim.old-paper-scope",
    "transition": "anchor",
    "repairs": ["ch3.c0.old-paper.all"]
  }
}
```

引擎規則：若 `repairs` 中有 unresolved event，先執行 repair；否則執行 anchor。兩條路都由明示 ID 決定。

---

## 3. 現行事件重新分類清單

### ch1

| 來源 | 新分類 | 主張轉移 |
|---|---|---|
| `scenes.json P0-2/nA4` | authority-substitution | overreach，authority=`future-common-knowledge` |
| `P0-2/nB3` | 非四類；anchor | 錨定「斷言接受證據檢查」 |
| `debate.json P2 pressChoice option a` | authority-substitution，同時 alignment mismatch | unresolved |
| `debate.json FR trap lied` | overreach（偽稱量過） | unresolved |
| `SC-R1/n3` | repair | 僅修復本章 unresolved |

### ch2

| 來源 | 新分類 | 主張轉移 |
|---|---|---|
| `scenes2.json B0-2/q1.a` | overreach | 舊規律未讀圖就擴張到飛行 |
| `B0-2/s1` | 非四類；anchor | 錨定對手資料的適用範圍 |
| `debate2.json FR over` | overreach＋alignment penalty | 低速短程外推遠砲 |
| `debate2.json FR sky` | overreach＋alignment penalty | 未測高空／星辰 |
| `SC-R1/n3` | repair | 指回具名 unresolved |

### ch3

| 來源 | 新分類 | 主張轉移 |
|---|---|---|
| `scenes3.json C0-3/c1.all` | overreach | 舊紙缺船況仍斷言一般結論 |
| `C0-3/c1.bounded` | anchor 或 repair | 由 `repairs:[ch3.c0.old-paper.all]` 決定 |
| `engine3.js::setDossierFinalBoundary(overclaim)` | overreach | 把落石結果說成地球運動證明 |
| `setDossierFinalBoundary(all-motion-hidden)` | overreach | 把船艙穩速結論擴到加減速 |
| `SC3-R1/c1.withdraw` | repair | 修復 unresolved 事件 |
| 卷宗普通 `evidence-mismatch` | mismatch | 只扣／保留 ch3 legacy 對位壓力，不動誠信 |

### ch4

| 來源 | 新分類 | 主張轉移 |
|---|---|---|
| `scenes4.json D0-2/n12b` | overreach | 沒有橋接證據便宣稱月亮結論 |
| `D0-2/n12d` | 非四類；anchor | 船上紀錄與月亮問題分開 |
| `engine4.js::setHookeScope` 越界／抹名來源 | overreach | 署名與來源邊界 unresolved |
| `engine4.js::setProofBoundary` 機制已證／牛頓獨得 | overreach | 機制／信用邊界 unresolved |
| `removeTravelerFromAuthorField` 正確退出 | 非四類；anchor | 不是 repair，除非明示修復同 claim |
| `SC4-R1/c1.withdraw` | repair | 指回來源／署名 unresolved |

### ch5

| 來源 | 新分類 | 主張轉移 |
|---|---|---|
| `scenes5.json E1-1/q1.ledger` | 非四類；anchor | 兩本帳各自成為可驗問題 |
| `E1-1/q1.authority` | authority-substitution | 用前輩名聲代替資料 |
| `E3-2/j4` | 非四類；anchor | 兩帳不同且短少仍懸置 |
| `debate5.json vanished` | overreach | 抹去可量痕跡 |
| `in-momentum` | overreach | 在動量帳中捏造短少去向 |
| `momentum-only` | overreach＋alignment −1 | 隱去另一帳與坑痕 |
| `vis-viva-only` | overreach＋alignment −1 | 抹去未對平短少 |
| `same-thing` | mismatch＋alignment −1 | 普通把兩種量當同一筆，不動誠信 |
| `SC5-R1/c1.withdraw` | repair | 撤回權威／單一帳越界，保留缺口 |

---

## 4. P0–P4 檔案層級任務

風險：L=低、M=中、H=高。回退：Y=可關 feature flag 回退；N=涉及不可逆資料轉換。

### P0：語義與 metadata 基線，不改行為

| 檔案 | 任務 | 風險 | 回退 |
|---|---|---:|:---:|
| `greybox/data/scenes*.json` | 在上節列出的 rep 節點／option 加 `epistemic` 或 `claim` metadata；舊 `effects.rep` 原樣保留 | L | Y |
| `greybox/data/debate.json`, `debate2.json`, `debate5.json` | 為每個 penalty 加穩定 eventCode、kind、claimId、boundaryId；`same-thing` 明標 mismatch | L | Y |
| `greybox/data/scenes*.js`, `debate*.js` | 用既有 build 流程由 canonical JSON 重建，禁止手工雙改 | L | Y |
| `greybox/src/chapter-ui.js` | `renderStatus()`、`renderPillarTrack()`、`renderDebate()` 文案改 `論證對位`；ch3 暫稱 `卷宗對位` | L | Y |
| `greybox/src/stage/07-intro-inputs.part.js` | 改說明文字並重建 `stage-ui.js` | L | Y |
| `greybox/src/narrative.js` | 新增 `normalizeEpistemicMeta()` 與 `recordEpistemicShadowEvent()`；只記 shadow event，不改 rep／persuasion | M | Y |
| `greybox/tests/run-node.mjs` | 靜態契約：所有 rep 負事件必有 kind；所有 repair 必有 repairOf；mismatch 禁止 rep；所有 eventCode 唯一 | L | Y |
| 新增 ADR/CR | 鎖定四類判準、anchor 非 repair、舊欄位退役條件 | L | Y |

驗收：玩家行為、存檔 shape、分數全部與基線一致；`npm test` 不少於 139/0；grep 玩家文字無「說服力」。

### P1：第五章 shadow pilot，雙寫不切換

| 檔案 | 任務 | 風險 | 回退 |
|---|---|---:|:---:|
| `scenes5.json` | 為 `E1-1/q1.ledger`、`.authority`、`E3-2/j4`、`SC5-R1/c1.withdraw` 補完整 claim/event metadata | L | Y |
| `debate5.json` | 五個關鍵選項依第 3 節分類；舊 penalty 不動 | L | Y |
| `narrative.js` | 在 `applyEffects()`、`debateFrRewrite()` 旁雙寫 shadow event；順序必須是先產生 stable eventCode，再執行舊 effects，最後比較 projection | M | Y |
| `sanitize.js` | optional shadow event allowlist；未知 kind／eventCode fail closed；仍由舊 reputation lifecycle 判斷是否合法 | M | Y |
| `chapter-ui.js` | 開發模式可顯示 shadow 差異；正式模式不讀新狀態 | L | Y |
| `tests/run-node.mjs` | 第五章全事件重播；斷言 new projection 與舊 rep/persuasion 完全一致 | M | Y |

驗收：shadow 記錄可刪除而不影響遊戲；舊存檔匯入／匯出逐字行為不變；`debate5.json` 的支柱、FR、複盤路徑均未改。

### P2：第五章 claim contract 成為來源，舊欄位保留投影

| 檔案 | 任務 | 風險 | 回退 |
|---|---|---:|:---:|
| `narrative.js` | 新增純函式 `applyEpistemicEvent()`、`transitionClaim()`、`repairClaim()`、`projectLegacyRep()`、`projectLegacyAlignment()` | H | Y |
| `narrative.js::applyRep/applyRepOnce` | ch5 feature flag 開啟時不再直接決策，只接受新模型投影；其他章保持舊行為 | H | Y |
| `sanitize.js` | ch5 同時驗新 contract 與舊 projection；任一不符拒絕匯入 | H | Y |
| `chapter-ui.js` | ch5 顯示 claim status／對位；仍可回讀 legacy 欄位 | M | Y |
| `tests` | 事件 idempotency、repair 對位、同時多 unresolved、same-thing 不扣誠信、四個 overreach 不被普通答對自動清掉 | H | Y |

切換門檻：至少一輪完整第五章自動重播、合法舊檔匯入、mutation 攻擊與真人瀏覽器辯論驗收都通過。單跑 `npm test` 不等於切換完成。

### P3：擴展全五章，處理 ch3/ch4 章別物件

| 檔案 | 任務 | 風險 | 回退 |
|---|---|---:|:---:|
| `scenes.json`, `scenes2-4.json`; `debate.json`, `debate2.json` | 依第 3 節補 metadata，禁止由 reason 中文反推 | M | Y |
| `narrative.js` | ch1/ch2/ch5 共用 `state.debate.persuasion` 對映 alignment；章別開關逐章啟用 | H | Y |
| `engine3.js` | 加 `_pressureView()`；用同一 cohort 原子推導，不新增五個可拼湊旗標 | M | Y |
| `engine3.js` | `dossier.debate.rep` 暫保留 anti-bruteforce 行為，但不再對玩家叫說服力；待簽名壓力通過 parity 後再決定退役 | H | Y |
| `engine4.js` | `_pressureView()` 從既有 press proof／window 狀態衍生，不另造第二套倒數 | M | Y |
| `chapter-ui.js` | ch3 簽名／缺口視圖、ch4 校樣窗口沿用；禁止同章再顯示 alignment | M | Y |
| `sanitize.js` | 五章 eventCode allowlist、claim projection、章別 pressure 衍生值驗證 | H | Y |
| `tests` | 每章至少一個 mismatch、overreach、authority、repair；ch3 cohort 混搭攻擊；ch4 window replay | H | Y |

**ch3 特別風險**：現況不是「沒有第二層」，而是藏在 `dossier.debate.rep`。P3 不能直接刪除，否則會失去錯誤累積到退回補證據的節奏。先換呈現，再以同等行為的簽名缺口取代，最後才刪 adapter。

### P4：schema／遷移切換與 legacy 退役

| 檔案 | 任務 | 風險 | 回退 |
|---|---|---:|:---:|
| 新 `src/claim-migration.js` 或 Claude schema 指定檔 | 逐章顯式 migrator；不可用單一「任意章升 3」函式 | H | Y（保留原文） |
| `narrative.js::SAVE_SCHEMA/loadSave/serialize` | 章別版本表更新；第一章需升 4 或確認 optional extension 不破 schema3 | H | Y |
| `chapter-ui.js` 載入流程 | 維持 raw→migrate→load→sanitize；失敗保留原始文字 | H | Y |
| `sanitize.js` | 新 contract 成為 source of truth；legacy 只准等於 projection，不再獨立授權 | H | Y |
| `tests/fixtures` | 五章 golden saves、所有修復場、rep=0、辯論中止、ch3 dossier、ch4 205 cursor | H | Y |
| 移除舊 reader | 僅在兩個穩定版本與手動匯入 QA 後進行 | H | N |

P4 不應與 P3 行為改動同一個 commit。先讓新 contract 在舊 schema 下 shadow／dual-write 穩定，再升版本。

---

## 5. 第五章試作：具體實作順序

### Step 0：鎖基線

1. 保存 `npm test` 139/0 結果。
2. 固定五條 debate5 fixture：`vanished`、`in-momentum`、`momentum-only`、`vis-viva-only`、`same-thing`。
3. 固定四個場景節點：`E1-1/q1.ledger`、`.authority`、`E3-2/j4`、`SC5-R1/c1.withdraw`。
4. 記錄辯論進入、歸零、複盤、再入、勝利的舊 state snapshot。

### Step 1：只加 metadata

- 在 `scenes5.json`／`debate5.json` 加 eventCode 與 claim metadata。
- 重建 JS mirror。
- 靜態測試確認：metadata 不改 next、effects、penalty、correct、支柱順序。
- 驗收：舊 snapshots byte-for-byte 等價（忽略資料檔新增 metadata）。

### Step 2：新增 shadow recorder

- `narrative.js` 在舊 effects 前讀 metadata，舊 effects 後記一筆 `epistemicShadow`。
- shadow event 先放在既有 `eventLog`，但 sanitizer 只接受明確 allowlist。
- 不新增 `state.claims` persistent source，不升 schema。
- 驗收：刪除所有 shadow events 後，序列化 state 必須等同舊版本。

### Step 3：建立新模型的記憶體投影

- 從 shadow events 純重播出 `claimsView`／`integrityView`／`alignmentView`，先不寫存檔。
- 比較：
  - `alignmentView.value === state.debate.persuasion`
  - `integrityView.value === state.rep`
  - `same-thing` 只改 alignment
  - 四個 overreach 依現行 penalty 同步反映
- 任一差異只報錯，不修正舊 state。

### Step 4：repair 與多事件測試

- 先走 `authority`，再走兩個不同 overreach，確認有三個 unresolved。
- 進 `SC5-R1` 時，metadata 必須指定修哪幾筆；不能用一個 repair 無條件清空全部。
- 若現行劇情設計確實要「一次撤回權威與單一帳結論」，修復 metadata 可列多個 eventCode，但需逐一驗證 claim 與材料。
- `J4` 只是 anchor，不得神奇修掉前面的 overreach。

### Step 5：feature flag 切換來源

- 只對 ch5 開 `claimContractVersion:1`。
- 新模型先決策，舊 `rep`／`state.debate.persuasion` 由 projection 寫回。
- 關閉 flag 必須回到舊決策路徑，且可讀同一份 dual-written save。

### Step 6：不破壞 debate5 的驗收

必做：

1. `debate:init` 仍把對位設為 5。
2. `same-thing` 仍只扣 1 對位，不扣信譽。
3. `momentum-only`／`vis-viva-only` 仍各扣 1 對位，同時只首次產生 integrity event。
4. `vanished`／`in-momentum` 不扣對位，但產生 integrity event。
5. 歸零仍進既有 debrief，已完成步驟與支柱保留。
6. reenter 仍把對位重設 5，不清空 integrity history。
7. `honestText`、step 順序、支柱破裂與勝利條件完全不改。

### Step 7：驗證層級

- 靜態：metadata 完整／唯一／不改圖拓樸。
- 單元：四類事件與 projection。
- mutation：改 rep、刪 event、偽 repair、跨 claim repair、same-thing 偽裝 overreach 均拒絕。
- 自動重播：第五章全路徑。
- 瀏覽器：辯論、歸零、複盤、手機尺寸。
- 真人：玩家能分辨「配錯」與「越界」，不把新 UI 當第二套分數。

---

## 6. 舊存檔相容與退役

### 6.1 過渡期共存

```js
state.rep                         // legacy projection，仍寫
state.debate.persuasion           // ch1/ch2/ch5 legacy local pressure，仍寫
state.lab.caseFile.dossier.debate.rep // ch3 legacy adapter，仍寫
state.epistemic                   // new source after chapter cutover
```

每次轉移順序：

1. 驗證 metadata 與目前 state。
2. 寫入 append-only epistemic event。
3. 由新 event replay 得到 claim／integrity／alignment view。
4. 投影回 legacy 欄位。
5. 斷言 projection 與預期一致後才 serialize。

### 6.2 遷移原則

1. **先驗舊檔，再遷移。** 現行 `sanitizeReputationLifecycle` 的章別 allowlist 仍是第一道門。
2. 只從已驗證的 `eventLog`、evidence/lab 原始紀錄、章別 milestone 重建；不可從布林 evidence 或 rep 數字單獨授權。
3. 舊 rep event 的 `at` 是 sourceId。新模型另產 `eventCode` 與可信 sequence；不可把 sourceId 當 tick。
4. 無 rep event：只有 `rep===3` 可視為初始狀態。其他值拒絕匯入，不合成種子。
5. `repLocked` 若為真，必須能找到最後一筆尚未修復的負事件；否則拒絕或建立明確 `legacy-unresolved`，不可靜默解鎖。
6. persuasion 遷移：ch1/ch2/ch5 直接複製當前值與 status，round 無法可靠推知時標 `legacyRound:true`，不要假造完整 misfiles。
7. ch3 `dossier.debate.rep` 保留原值；pressure view 由原紙重算，兩者不互相授權。
8. ch4 先走既有 schema1→2 migration，再走新 migration，保留原始 backupText 與既有 migration report。

### 6.3 版本策略

不建議直接宣稱全章 schema 3：

- ch1 已是 3。
- ch2/ch3/ch5 是 1。
- ch4 是 2。

安全選項：

1. **統一升 4**：語意最清楚，但五章 migrator 工作最大。
2. **章別下一版**：ch1 4、ch2 2、ch3 2、ch4 3、ch5 2；較符合現況，但測試矩陣較多。
3. **optional extension**：P1/P2 shadow 期可用，不適合作為最終 source-of-truth cutover。

推薦：shadow 期不升版；正式 P4 採章別下一版。版本數字本身不必統一，schema 語意與 migrator 才必須一致。

### 6.4 何時可移除 legacy 欄位

必須全部達成：

1. 五章都由 new contract 決策至少兩個穩定版本。
2. 合法舊檔 golden fixtures 全部可遷移，偽造 mutation 全拒絕。
3. repo 內除 migration／projection 測試外，無 production reader 直接讀舊欄位。
4. ch1/ch2/ch5 辯論中止／再入與 ch3 卷宗退回已完成真人驗收。
5. 可下載的 raw backup 保留；使用者可在遷移失敗時回復舊版。

移除順序：先停止舊欄位決策 → 停止新存檔寫入 → 保留讀取一版 → 最後才刪 reader。`persuasion` 的內部欄位可長期保留；改名不要求資料庫重命名。

---

## 7. 回退與開工閘門

### 可回退設計

- `claimContractVersion` 以章為單位開關，不設全域一次切換。
- shadow metadata 與事件可被舊 runtime 忽略。
- P0–P3 不刪 legacy 欄位。
- migration 永遠保留原始存檔文字。

### 開工閘門

總監需先裁決：

1. ch3 簽名欄的「停船基準」究竟指甲板停船原紙，還是船艙 dock/steady 對照；兩者不是同一物理條件。
2. 一次修復是否可修多筆 unresolved；本規格允許，但必須明列 eventCode，不能清空全部。
3. 信譽正向 anchor 是否繼續加數值，或只解除 suspended。這不影響事件分類，但影響 legacy projection。
4. 正式 schema 採統一 4 或章別下一版。本規格反對把已是 schema3 的 ch1 無條件再當「1→3」。

### 完成定義

P3/P4 完成不等於 `npm test` 綠。至少要分別報告：

- 靜態契約與圖拓樸
- 單元／重播／mutation
- 舊存檔匯入
- 瀏覽器與手機驗收
- 真人完整辯論／修復流程
- commit／部署狀態

任何一層未做，明確標示未驗，不以其他層代替。
