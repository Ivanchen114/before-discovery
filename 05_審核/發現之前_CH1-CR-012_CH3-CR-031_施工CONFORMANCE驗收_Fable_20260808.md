# CH1-CR-012＋CH3-CR-031 施工 CONFORMANCE 驗收

**日期**：2026-08-08
**驗收者**：Fable 5（獨立於施工方 Sol）
**模式**：CONFORMANCE / R0 唯讀
**核准目標**：劇本稿 v0.1.2＋ch1 功能規格 v0.1-candidate＋ch3 spike 規格 v1.1.0 §5＋CH1-CR-012／CH3-CR-031＋ADR-016
**實際成品**：工作樹 scenes.json／scenes3.json／chapter-ui.js／narrative.js／sanitize.js 等（Sol 施工後）

---

## 總裁決

**CONFORMANCE：PASS。可交總監實玩定案。**

## 逐項結果

| 驗收項 | 結果 |
|---|---|
| 改動範圍 vs 授權 | ✅ `engine.js`／`engine3.js` 零改動（「不改物理」守住）；`narrative.js`／`sanitize.js` 變更有 CR-012 明文授權（require 未知 key fail-closed＋qB.b2 合法因果鏈 sanitizer 修復） |
| ch1 W1–W8 台詞忠實度 | ✅ 12 個關鍵句逐字到位；W5「量壞了」／W7「對了一半」舊句零殘留 |
| ch1 揭曉時機 | ✅ `yieldToken` 每 claim 唯一（`ch1-a2-2-miss-{claimId}`）；W3 ack 前不渲染 observed；灰盒殼無訂閱者時 fallback 直接揭曉不卡死（Sol 瀏覽器實測佐證：遮蔽維持到最後一句收掉） |
| ch1 A3-1 三版讀回 | ✅ n3c／n3a／n3b 台詞逐字；互斥鏈 C＞A＞B（n3c 先驗）；**兩條搶答路徑（q1.a 與 qB.b2）皆入 `any`**——sanitizer 修復的直接成果 |
| ch3 承諾段 | ✅ a_commit1–4 逐字符合 v1.1.0 §3.4；`c1.all→a_commit1`（fresh）、`all_again→a1`（legacy）分流正確 |
| ch3 B-1 修正 | ✅ `x7: require oldPaperScoped=bounded`；`x7_fail: blurted AND NOT scoped=bounded`——與對抗審修法一字不差 |
| 匯流不洗白 | ✅ 撤回頁派生邏輯在（不序列化）；錯線／劃痕保留；C3-1 讀回接通 |
| 保護段 | ✅ C3-2/x4「你不會回來替它辯護」、A2-2 n2b／qOdd／n4b、A3-1 n3「連光陰都肯替你作弊」、P0-2 nA3——全部逐字未動 |
| 信譽紀律 | ✅ 失手弧線本體零信譽事件（F2 誠實猜錯不罰）；ch3 all 維持首次 −1 不重扣（`oldPaperAnswerBlurted` require 守衛） |
| 測試 | ✅ 獨立重跑 `run-node.mjs`＝**168 通過 0 失敗**（166→168，+2 為本輪新契約）；npm 全套 exit 0 |

## 交付狀態

Outcome: 兩章施工與核准目標逐項一致，CONFORMANCE PASS；台詞零漂移、B-1 精確實裝、保護段完好、F2 零罰
Truth mode: CONFORMANCE
Target and comparison baseline: 劇本稿 v0.1.2／規格 v1.1.0／兩 CR／ADR-016 vs 施工後工作樹
Design Gate: PASS（總監 2026-08-08，同批裁決包）——本報告為其後的 Implementation 驗收
Files changed: 本報告 1 件（05_審核/，新增）
Focused tests: 台詞逐字比對 ×12＋4、require 條件三組、yieldToken 邏輯、保護段 ×6、rep 效果掃描
Full tests: PASS (168/0)
獨立重跑；npm 九 runner exit 0。
Registry updated: N-A
Browser/device: 靜態層由本驗收覆蓋；互動行為採信 Sol 瀏覽器實測報告（遮蔽時機／rep 2/5／console 0）＋168 項測試保護；**總監實玩為最後一關，未做**
Accessibility: 押記紙替代文字依規格 §4.2 已列；讀屏實測留待總監輪或發佈前驗收
Independent review: 本報告即獨立驗收（驗收者未參與施工）
Human playtest: NOT RUN——下一棒即總監
VCS: 未 commit（維持施工後工作樹；commit 授權在總監）
Release: N-A
Production smoke: N-A
Known gaps: 視覺資產驗收未宣稱（Sol 本機缺部分既有資產，已如實揭露）；讀屏／降動態實測未做；spike_workshop 舊 spike 檔屬可丟棄物，發佈前應依規格 §4.1 確認未被正式 build 引用
Preserved foreign WIP: 天數系統與其他未提交文件未觸碰
