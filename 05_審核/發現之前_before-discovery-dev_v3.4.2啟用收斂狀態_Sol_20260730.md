# before-discovery-dev v3.4.2 啟用收斂狀態

**日期**：2026-07-30  
**執行**：Sol／Codex  
**真相模式**：CONFORMANCE  
**lane**：R4  
**結論**：v3.4.2 lifecycle 的 Claude gate 已完成；系列聖經 v0.2.3 的內容定點覆核
仍待 Claude 回覆。skill 維持 candidate，且 active source 尚未全部形成 Git 可重現
閉包。不得把目前狀態稱為 active。

## 一、已完成

1. Claude 對 v3.4.1 整包與 v3.4.2 lifecycle 定點覆核皆為 A=0、B=0。該結論
   不自動涵蓋其後才修正的系列聖經 v0.2.3。
2. `decisions.md` 新增：
   - ADR-012：主類型、事前承諾形式、第三章程序承諾與因果相符的信譽修復；
   - ADR-013：v3.4.2 啟用授權與「activation 全綠才算 active」邊界。
3. P-7、P-8 結案，分別併入工作包法源 §八與 §六-4；P-6、P-9 仍待裁。
4. 共用守則收斂四個漂移：
   - canonical 改由 AS-IS／TO-BE／CONFORMANCE 決定；
   - 審查修法不再自動轉移施工權；
   - 施工不得只讀 CR 與 runtime 而跳過路由法源；
   - 定點覆核只在 path、接口與狀態假設未擴張時適用。
5. 歷史探究規範與系列聖經候選 v0.2.3 已納入：
   - 「事前承諾不等於每章都猜結果」；
   - 信譽不是答題分數；
   - 修復必須對應原違約；
   - 系列聖經升為 v0.2.3，並依較新總監裁決撤出第四章手機方案；在 Claude
     定點覆核 A=0、B=0 前保持 candidate。
6. NARRATIVE-CR-031 已記錄 Claude CONFORMANCE 通過；總監真機接受仍獨立待辦。
7. 八份不含 runtime 的既有法源已依 SHA 精確納管於 commit `180652b`；第四章
   migration 規格刻意留給完整可重現 migration 包，沒有拆成只可閱讀、不可執行
   的半包。
8. skill 內三處過期的「候選流程法源」狀態字樣已改為現行 active workflow，
   並由 `sync-mirror` 同步治理鏡像；skill 自身仍是 v3.4.2-candidate，兩個狀態
   沒有混用。

## 二、驗證

- `skill_guard.py validate`：PASS，0 errors。
- `test_skill_guard.py`：50/50。
- `test_mechanics_guard.py`：20/20。
- skill-creator `quick_validate.py`：valid。
- `greybox npm test`：136 通過、0 失敗。
- 第四章 migration：19 groups passed、205 legacy cursors covered。
- `validate --activation`：仍 FAIL；八份 tracking-only 法源提交後，現況為
  14 errors、18 warnings。

14 個 activation errors 的性質：

- 12 筆是 active source 尚未由 Git 追蹤（若同一路徑被多 route 引用會重複計數）；
- 1 筆是系列聖經 v0.2.3 仍為 candidate，等待 Claude 內容定點覆核；
- 1 筆是 registry 仍為 candidate。

這是預期且正確的 fail-closed，不得用改低 source status 或刪 registry entry 洗白。

## 三、已完成的 tracking-only 文件

以下八份已於 commit `180652b` 精確納管；納管只代表版本可追蹤，不冒充重新核准
全文：

1. `02_設計/發現之前_工作台與辯論架構_一二章實證規格_v0.1.md`
2. `02_設計/發現之前_跨章規格_旅人聲線與章際接縫_v1.0_Claude_20260728.md`
3. `01_治理/發現之前_CH3-CR-024_碼頭辯論旅人心聲層_20260728.md`
4. `04_劇本/第三章台詞稿_v0.9_展開版_Claude_20260728.md`
5. `03_規格/發現之前_第四章v0.8施工基線_盤點與分批_Claude_20260728.md`
6. `04_劇本/第四章台詞稿_v0.8_Claude_20260728.md`
7. `03_規格/發現之前_第五章工作台與辯論規格_v0.1_Claude.md`
8. `03_規格/發現之前_第五章debate5資料稿_v0.1_Claude.md`

`03_規格/發現之前_第四章v0.8存檔遷移表與契約測試_Claude_20260728.md`
本身可追蹤，但不與 runtime 實作拆包，留在第五節的完整 migration 交付。

## 四、spike 索引必須帶實體閉包

`spike_workshop/README_ch4_spike索引.md` 不可單獨提交。最小閉包是索引加：

- 四個 CANONICAL：
  - `spike_ch4_D2-1_construction_v3_CANONICAL.html`
  - `spike_ch4_d22_v3_prediction.html`
  - `spike_ch4_D3-1_sealing_v2_CANONICAL.html`
  - `spike_ch4_d31_ledger.html`
- 五個 OBSOLETE：
  - `spike_ch4_d1_construction.html`
  - `spike_ch4_d1_construction_v2.html`
  - `spike_ch4_d22_balance.html`
  - `spike_ch4_d22_sixsteps.html`
  - `spike_ch4_d23_sealing.html`
- 一個節奏示範：`spike_ch4_expansion_demo.html`

registry 已保留同尺紙 spike 的 A-1 known issue：舊 `4.9 公尺` 文字不得直接轉 runtime。

## 五、第四章 migration 是唯一結構性阻擋

四個未追蹤 migration 檔不能單獨構成可重現交付：

- `greybox/src/ch4-migration.js`
- `greybox/tests/run-ch4-migration.mjs`
- `greybox/tests/fixtures/ch4-v1-base.json`
- `greybox/tests/fixtures/ch4-v1-cursors.json`

乾淨 HEAD 只加四檔會立即失敗。最低純 migration 契約還需要 v0.8 的
`engine4.js`、`scenes4.json/js` 與 `sanitizeImport4`；玩家可真正載入舊檔時，
另需 `narrative.js`、`chapter-ui.js`、`stage.html`、`package.json`、`run-node.mjs`
的精確接線。

目前這些共用檔同時含第三章、第五章與全系列信譽 WIP，禁止 whole-file stage。
若要完成 migration commit，必須在乾淨暫存環境重建「不含後加信譽層」的 v0.8
精確 hunk，重新跑 19/205、全套測試與反向控制。這屬 runtime 施工；本輪明定不改
runtime，因此保持 BLOCKED，不用半包冒充完成。

乾淨暫存重建已實際做到 12 場／287 節點、19 組／205 游標，且刪一筆 golden
cursor 會精準轉紅；逐檔 hunk、排除清單、命令與 SHA 見：

`05_審核/發現之前_第四章v0.8存檔遷移_乾淨可重現包施工交接_Sol_20260730.md`

## 六、Git 狀態

- 已存在 commit：`b3008cb chore: add before-discovery guard v3.4.2 candidate`。
- tracking-only commit：`180652b chore: track approved design sources`（八份文件，
  零 runtime）。
- 本輪新修法源、系列聖經 v0.2.3 與兩份狀態／覆核文件尚未 commit；先等 Claude
  定點覆核，避免審後再改寫已提交的 candidate。
- `decisions.md` 是混合 diff；本包只能取 ADR-011～013、P-7／P-8 與 P-6／P-9
  對應 hunk，不能 whole-file 吃入無關的第一章歷史補記。
- `02_設計/README.md` 暫不進本包。它宣稱 11 份舊稿已移入 archive，但該 archive
  閉包尚未由 Git 追蹤；必須另成索引／archive 包，不能讓乾淨 checkout 留壞引用。
  唯讀審計確認 11 檔實體齊全、皆為 Claude 署名、全部 Git `??`，原位置與 Git
  歷史皆不存在；因此只能視為 add-only tracking 候選，且在 Claude／總監明示移交
  所有權前仍標 `FOREIGN-WIP/UNKNOWN`，本輪不代為提交。
- registry 在最終 active 原子切換時還會再變；Claude 覆核後須重新 diff／hash，
  再 whole-file stage，不能沿用現在的暫存內容。
- 原 index 內三份 staged additions 未被改動或收進 `b3008cb`，後續仍須以精確
  pathspec 提交，且在 `180652b` 後重新核對三個 index blob 仍完全相同；禁止
  `git add -A`／`git add .`。

## 七、active 的剩餘順序

1. Claude 只對系列聖經 v0.2.3 與相依法源做定點覆核；A=0、B=0 後才升該
   registry entry 為 active。
2. 精確提交本輪新修法源包；八份 tracking-only 文件已由 `180652b` 完成。
3. 另開索引／archive 閉包包，處理 `02_設計/README.md` 與其 11 份實體引用；
   不混入 activation 法源 commit。
4. 以完整閉包提交 spike 索引。
5. 另開 runtime 工作包重建並提交第四章 migration 可重現包。
6. `validate --activation` 全綠。
7. 原子切換 registry／SKILL／治理鏡像為 v3.4.2 active。
8. Codex 與 Claude 各自同步生效版並 read-back；不把 repo 更新冒充已同步。
