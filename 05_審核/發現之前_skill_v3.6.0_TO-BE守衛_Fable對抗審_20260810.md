# before-discovery-dev v3.6.0-candidate（TO-BE 新章整包守衛）Fable 獨立對抗審

**日期**：2026-08-10｜**審查者**：Fable 5（獨立於實作方 Sol）｜**模式**：R0 唯讀＋工具行為實測
**輸入**：SKILL.md v3.6.0-candidate＋整包送審修正案 v0.1-candidate＋Sol 交付報告＋mechanics_guard.py 實測

## 總裁決：**通過——A×0、B×0、C×2。可交總監裁 activation（仍依六條件另案）。**

## 實測證據（不是讀文件，是跑出來的）

1. **整包強制在 CLI 層落實**：`--to-be` 缺 `--brief`／`--provenance` 直接拒收 ✓。
2. **正向可轉綠**：以 ch7 三件套為底構造完整 `toBeReview`（六欄 consistencyRows、controlBaselines、field／judgment 雙層 plannedOrdinal、staleTextScan＋emptyReason、spine `claimRef`）——`TO_BE_CONTRACT: PASS`，exit 0，**無 scenes7.json 亦可過**，decisionStatus=VALIDATED ✓。
3. **負向三連精準紅**（自構 fixture）：success 漂移→**TB-06 雙保險**（row 級＋spine claimRef 級各一條——正是 ch7 v0.3→v0.4 舊句殘留事故的機械化）；漏 baseline→TB-04；證據揭曉晚於判讀（pile ordinal 9＞judgment 8）→TB-03「is not visible before the judgment」✓。TB-05（operation 未登錄）由代碼層確認三重檢查（registered／kind=operation／同 segment）。
4. **回歸**：mechanics guard 27／skill guard 66／runtime 173 全綠獨立重跑；fixture 垃圾與 index.lock 已清。
5. **條文純度**：SKILL 只路由——整包規則指向宿主候選法源並明標「未經獨立審查與總監裁決前不得冒充 active」（空指針防範內建）；六欄以 ID 承載不複製文字；「TO_BE PASS 只證明可進第一輪對抗審」的邊界誠實；**兩輪收斂的重大例外保留**（新引入 A／B 或既存污染性硬傷可附證據重開——防收斂條款遮 A 級）✓。
6. **祖父條款**：修正案「過渡條款」明文（ch7 v0.4 已完成終審與回執，不溯及）；TB-01 對舊格式 ch7 contract 的拒收行為與豁免語意一致（豁免＝不必重審，不＝工具放水）✓。

## C 級 2（回執即可，不需再審）

1. TB-03 對同一 field 的多處引用重複報錯（負向3 同一訊息×2）——建議去重，純噪音。
2. mechanics-guard.md 的 `toBeReview` 段建議補一份完整 JSON 範例——本次審查構造正向 fixture 歷經三輪格式試錯（consistencyRows 鍵名、雙層 plannedOrdinal、emptyReason），下一個新章作者不應重付此成本。**本審查的正向 fixture（/tmp/tb_ok3.json 結構）可直接捐作範例底稿。**

## 交付狀態

Outcome: v3.6.0-candidate 通過對抗審——五種新檢查實測四種精準、正向可轉綠、條文純度與例外保留確認；C×2 純改善
Truth mode: CONFORMANCE（宣稱 vs 工具實際行為）
Full tests: PASS (173/0)
（另 27＋66 guard 測試全綠）
Independent review: 本報告即獨立對抗審（實測驅動）
VCS: 未 commit；activation 未做（六條件另案，仍卡條件 3 未 commit）
Known gaps: activation 前需宿主法源（整包修正案）獲總監裁決轉 active；C×2 回執
Preserved foreign WIP: 未觸碰任何檔案；/tmp fixture 不留 repo
