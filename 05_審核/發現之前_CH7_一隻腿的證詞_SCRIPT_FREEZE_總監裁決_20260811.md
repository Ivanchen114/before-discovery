# 發現之前｜CH7《一隻腿的證詞》SCRIPT FREEZE 總監裁決

**日期**：2026-08-11
**裁決者**：總監
**狀態**：`SCRIPT FREEZE: PASS`
**階段邊界**：只凍結劇本與機制目的；不授權 runtime 施工、commit、push、deploy 或上線

## 一、正式裁決

> `SCRIPT FREEZE: PASS — CH7《一隻腿的證詞》劇本 v0.6＋provenance v0.3＋mechanics contract v0.7；凍結戲劇目的、台詞與選擇後果。chapter registry、check-narrative ch7／heading adapter、engine adapter 與負向 fixtures 移入 implementation CR。`

此裁決表示第七章已完成劇本階段。下一份可施工法源為 `CH7-CR-001`；該 CR 仍須另過
Design Gate，通過前不得建立 `scenes7.json`、`engine7.js` 或修改共用 runtime。

## 二、凍結輸入與內容指紋

| 角色 | 實體檔 | 本次凍結版本 | SHA-256（2026-08-11 工作樹） |
|---|---|---|---|
| 劇本正本 | `04_劇本/第七章劇本稿_一隻腿的證詞_v0.1_Fable_20260810.md` | 內容 v0.6 | `9d83a9c9462a4b8b5c8caabd7bbad36a4dfea8d6733a0641e760d188490fdfa9` |
| 史實 sidecar | `02_設計/發現之前_第七章provenance_sidecar_EM1_v0.1_Fable_20260809.md` | 內容 v0.3／verified | `202f5c7f27a9f70ae94cfc4750085ccf8c93e60b7858a946da16f2d2b64bafca` |
| 機制契約 | `03_規格/發現之前_第七章mechanics_contract_v0.1_TO-BE_Fable_20260809.json` | 內容 v0.7 | `c5f7457fd02f2d3913475af526ffd36996b05a9515d111041de9cefafb65b74d` |

檔名中的舊版號不是內容版本；施工與驗收必須讀檔內版本史及本表指紋，不得憑檔名猜版本。

## 三、凍結範圍

下列內容只有另開劇本 CR 並重新取得總監裁決才可變更：

1. 七場結構、1798→1800 的時間跨度與 Galvani 之死只作餘波的收法。
2. Fable v0.6 的玩家可見台詞、選項全文、話輪歸屬與「啊！」唯一落點。
3. M 當場被現有證據反駁、A 署名後失敗前進、not-yet 必須提出區分配置的非對稱後果。
4. 玩家親手完成矩陣、電量器、伏打堆與六格合帳；NPC 不得以演出代做。
5. 中間判讀與最終判讀的主張上限、共通阻力拍、A 路先修自己的原句再填留白。
6. 誠實押錯不扣信譽；研究失信才進 `SC7-R1` 的資格邊界。
7. 史實／合理重建標示與 mechanics contract v0.7 的主張—證源—順序關係。

## 四、不屬解凍的機械校正

- 劇本交付摘要把首個玩家行動 `EM7-1/c1` 寫成「第 4 節點」；依正本文字實數，它是
  `EM7-1` 第 5 節點、全章第 8 節點，前有 7 個可見 line。runtime 與測試使用實際拓撲，
  不修改玩家文字。
- 劇本 front matter 仍為 `freeze-candidate` 不會推翻本裁決；日後若只把 metadata stamp 改成
  `frozen`，屬程序回寫，不得同時改正文。
- `check-narrative` 現行 draft parser 除了不接受 ch7，也不認 `## EM7-1｜…` 標題，且會跳過
  Markdown 表格列。implementation CR 必須同時處理章別、heading 與表格列，不能只放寬 enum
  後產生「零台詞也 PASS」的假綠燈。

## 五、下一關

`CH7-CR-001` 應先完成 AS-IS、章節登錄、save/sanitizer、engine7、工作台操作、工具 adapter、
負向 fixtures、回復方案與人工驗收矩陣。總監另簽 `DESIGN GATE: PASS — CH7-CR-001` 後，
才授權 runtime 施工；完成後仍須 Fable 做敘事 CONFORMANCE，再由總監實玩定案。
