---
bd_artifact: contract-review
bd_chapter: ch7
bd_status: changes-requested
bd_mode: TO-BE
bd_lane: R0
bd_work_package: WP-CH7-EM1-CONTRACT-FINAL-REVIEW
---

# 第七章 Mechanics Contract v0.2：Sol 終審

**日期**：2026-08-09
**範圍**：只審 `03_規格/發現之前_第七章mechanics_contract_v0.1_TO-BE_Fable_20260809.json` 內容版 v0.2；不重審題材、收法、章名與 brief 文筆。
**總裁決**：**CHANGES REQUESTED——A×3、B×2、C×1。核心修正成立，但玩法本身尚未被 contract 守住。**

## 一、本輪確認通過

1. `em1-exclusive-claim` 已正確改成 `experiment_commitment`；三個選項不再帶 `isCorrect`，符合「先押、後由世界裁決」。
2. M／A 已拆成不同量測範圍：M 由無金屬收縮反例處理，A 由 electrometer／pile 的無生命電效應處理。
3. `always-both-sources` 已改為 `insufficient`，不再偽裝成某格直接矛盾。
4. locator 已改成分階段具名節點與頂層欄位，方向符合現行 scenes-json binder。
5. 定點重跑結果仍為預期 12 FAIL；JSON 可解析。這只證明 BLOCKED 狀態誠實，不等於人工語意審查通過。

## 二、A 級

### A-1｜六步弧漏掉第一步基準證據

**位置**：contract `operation._planned`、`trace._planned`、`evidenceSources`。
**實際證據**：operation 宣告六步＝基準→雙金屬→同材質→無金屬→electrometer→pile；trace 節點只有 `t_bimetal`、`t_same_metal`、`t_no_metal`、`t_electrometer`、`t_pile`、`t_board`，沒有 `t_baseline`，evidenceSources 也沒有 `GRID_BASELINE`。第六個名字其實是桌面狀態，不是第六項實驗。
**因果問題**：外部刺激基準負責證明蛙腿製備仍可反應；沒有它，後續「沒有收縮」無法區分接法結果與樣本失效。施工者即使整步刪掉，contract 也不會紅。
**直接修法**：新增 `GRID_BASELINE`、`t_baseline` 與頂層 `observation`／`sampleState`；所有需要把「無反應」當證據的格，須明示依賴同一樣本或可追查的有效基準。
**可失敗驗證**：刪除 `GRID_BASELINE` 或令 baseline 發生在 no-response 判讀之後，人工 contract review／後續 dominance contract 必須失敗。

### A-2｜正向結論仍多說了一步

**位置**：`em1-config-verdict.options[0]`。
**實際證據**：選項 `m-and-a-both-fell-roles-differ` 的 supportedBy 能證明 M／A 兩個全稱失敗，卻把結論加成「各配置中腿的角色不相同」。
**因果問題**：無金屬收縮＋無蛙接觸電只能證明兩種排他說法都過度；它們沒有量出每個雙金屬配置裡，腿究竟以什麼比例作來源、導體或偵測器。這仍是把章末整合語偷塞進證據欄。
**直接修法**：正向選項縮成：`這批紀錄足以否掉 M 與 A 的全稱；不同配置必須分開記，現有資料還不能替所有配置指定同一來源角色。` 若未來要判「角色不同」，另立可觀測欄位與判讀，不由本三張紙代證。
**可失敗驗證**：移除任何 NPC／system 的角色診斷後，若原始觀測仍無法支撐選項全文，該選項不得標 `isCorrect: true`。

### A-3｜主要新動詞沒有進 decision registry

**位置**：`decisionRegistry`／`decisions` 只有 `em1-exclusive-claim` 與 `em1-config-verdict`。
**實際證據**：brief 的唯一主要新動詞是玩家選擇接線；contract 只把整座工作台濃縮成一個 `operation` beat，沒有任何 `kind: operation` 或 `experiment_commitment` 登錄「選哪個接點／下一個區分配置」。連謹慎路「必須提出下一個配置」也只留在文字備註。
**因果問題**：這份 contract 可以在玩家只按六次「下一步」的線性教學版上照樣成立。它守住了押注與結論，沒有守住遊戲玩法。
**直接修法**：至少新增：

- `em1-configure-circuit`，`kind: operation`，綁到工作台內可驗的玩家接線決定；
- `em1-next-discriminating-config`，`kind: experiment_commitment`，只在 `not-yet-exclusive` 路徑要求玩家提出下一個能區分主張的配置；不得由 NPC 預選。

若 scenes-json binder 看不到 engine7 內部選擇，contract 必須明標 `BLOCKED_ENGINE_ADAPTER`，並把 chapter-specific adapter／負向 fixture 列入 implementation CR；不能只靠 operation beat 自證。
**可失敗驗證**：把工作台改成固定順序自動跑完六步時，decision contract 必須轉紅。

## 三、B 級

### B-1｜Spine 與 resistance 仍使用舊的模糊標籤

`commitment._planned`、`resistance._planned`、`commitBeforeReveal._note` 還寫「只可能來自金屬／只可能來自動物」，與 decisions 內已修正的 M／A 不一致。請全部改成 M／A 逐字主張，避免劇本作者抄到錯版本。

### B-2｜`GRID_STATE.completeness` 不足以承擔 `always` 的範圍判斷

桌面「已填滿」只能證明規定格完成，不直接告訴玩家測過哪些範圍。請把欄位改為或新增 `testedScope`／`testedConfigurations`，讓玩家看得見有限枚舉的邊界；`insufficient` 才不是系統憑空宣布。

## 四、C 級

contract 內容已稱 v0.2，檔名仍為 v0.1，`_upstream` 又把 brief／provenance 標 v0.2；請在 Gate 前統一版本與檔名引用。避免 runtime CR 鎖到錯快照。

## 五、Gate 結論

本輪不能簽 Design Gate。修正量已很小，不需再改題材或重寫 brief；只要 contract 補：

1. baseline evidence；
2. 不過度的正向結論；
3. 接線與謹慎路的實際 decision；
4. M／A 逐字一致與 tested scope 欄位。

下一輪只需做 JSON contract 定點終驗；若上述四項到位，可直接建議 Design Gate，不再擴題。

## 六、交付狀態

Outcome: CHANGES REQUESTED（A×3、B×2、C×1）
Truth mode: TO-BE
Target and comparison baseline: mechanics contract 內容版 v0.2；比較 schema v2、前輪 Sol A×3 與 brief 核心動詞
Design Gate: NOT RUN
Files changed: 僅新增本終審報告；Fable contract 零修改
Focused tests: JSON_PARSE PASS；check-mechanics＝預期 FAIL 12；router＝SOURCES_ROUTED／ch7 unregistered CAUTION
Full tests: NOT RUN（R0 唯讀 contract 審查）
Registry updated: N-A
Browser/device: N-A
Accessibility: N-A
Independent review: 本報告即 Sol contract 終審
Human playtest: N-A
VCS: 未 stage、未 commit
Release: N-A
Production smoke: N-A
Known gaps: baseline、operation decision、engine adapter 邊界、testedScope
Preserved foreign WIP: YES；未修改 Fable contract 與其他 dirty files
