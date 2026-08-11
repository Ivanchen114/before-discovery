# CH4-CR-014 施工 CONFORMANCE（K1／K4 證據成品狀態選圖）

**日期**：2026-08-09｜**驗收者**：Fable 5（獨立於施工方）｜**模式**：CONFORMANCE / R0
**核准目標**：CH4-CR-014＋71-bis §5.2＋Art Lock 五資產｜**成品**：施工後工作樹

## 總裁決：PASS——可交總監實看定案

## 五項窄驗（皆附 runtime 證據）

1. **世界線權威 ✅**：`evidenceVisualKeyForState`（chapter-ui.js:321-343）只讀 `evidencePackage.stamps`；防禦**嚴於規格**——除 CR 列的缺格／重複／非法值外，連 moon 帶 loanDecision 值也判非法回 null。映射四組合與 CR §3.2 逐項一致。投影不寫回存檔（413 行註釋明示）。
2. **四種 K4 圖文一致 ✅**：assets.json `K4.variants` 四鍵齊；alt／caption／accessibleText 與各世界線 `claimText` 語意對位（both_loans alt「兩筆逐案新增的代價都保留在帳上」）；測試四組合各自命中＋fallback 負向 ×9。
3. **K1／fallback 語意 ✅**：K1 恆 null 且不觸發診斷（「固定卡的 null 正常」——窄複核 C-1 精確實裝）；非法 key→中性舊 SVG＋玩家可見 `fallbackNotice`「證據圖狀態無法安全還原。」＋console 診斷訊號，不擋讀檔。
4. **特寫與筆記同證物 ✅**：03-focus-visual 與 09-notebook 呼叫同一 `resolveEvidenceVisual`；stage-ui.js 生成檔同步（四處呼叫點一致）；`card_K4` 靜態不再壓過 resolver。
5. **可見文字邊界 ✅**：accessibleText 用「**封存的**借條狀態」（窄複核 C-2 吸收）；K1 caption「沒有偏折就沿切線離開；持續向內改向才形成軌道」停在幾何層，未宣稱引力機制；K4 文字版含固定六格＋世界線 claimText，取自 deterministic 資料非 OCR。

五張衍生 WebP 於 `public/assets/ch04/evidence/` 全數存在（K1 v02＋K4 四變體 v03/v04）。獨立重跑 `run-node.mjs`＝**173 通過 0 失敗**。

## C 級 2（不擋定案）

1. CR §7 白名單寫 `greybox/public/assets/…`，實際資產依既有慣例落在 root `public/assets/…`——CR 文字筆誤，施工位置正確；請在施工回寫註一行。
2. 窄複核 C-3（schema1 乾淨舊檔開筆記不顯 K4 卡不觸診斷）未見專項人工驗收記錄——與 VoiceOver 實聽並列待辦，發佈前補。

## 交付狀態

Outcome: 五項窄驗全過、防禦嚴於規格、窄複核 C×3 全數吸收；C 級 2 為文書與待辦
Truth mode: CONFORMANCE
Target and comparison baseline: CH4-CR-014＋71-bis vs 施工後 chapter-ui／stage parts／assets.json／公開資產
Design Gate: PASS（總監，CH4-CR-014）——本報告為 Implementation 驗收
Files changed: 本報告 1 件
Focused tests: 權威計算逐行、resolver 兩入口、assets variants 結構、五資產存在、CR-014 契約覆蓋摘要
Full tests: PASS (173/0)
獨立重跑 run-node.mjs。
Registry updated: N-A
Browser/device: 靜態層本報告覆蓋；桌機＋844×390 採信 Sol 實測（console 0）＋契約保護
Accessibility: 結構層驗訖（focus trap／文字版／alt 分層）；VoiceOver 實聽待辦
Independent review: 本報告即獨立驗收
Human playtest: NOT RUN——總監實看為下一步
VCS: 未 commit
Release: N-A
Production smoke: N-A
Known gaps: VoiceOver 實聽；schema1 乾淨舊檔專項人工驗收；CR §7 路徑筆誤待註記
Preserved foreign WIP: 未觸碰任何檔案
