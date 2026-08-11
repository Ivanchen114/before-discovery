---
bd_artifact: art-revision-handoff
bd_status: art-locked
bd_truth_mode: CONFORMANCE
bd_scope: ch4-k4-both-loans
bd_date: 2026-08-09
bd_source: Fable-Art-Lock-review-B1
---

# CH4 K4 both_loans v04 定點返工交付

## 結果

Fable Art Lock 前審圖 B-1 已修：彗星借條現為
「**彗星可以穿過流（未量過）**」，左右括號皆為全形。v03 未覆蓋，修正版另存：

`art/source/production/ch04/evidence/ch04_card_K4_model_comparison_both_loans_raster_candidate_v04.png`

## 施工與檢查

- 以 both_loans v03 為唯一 edit target，使用 Codex 內建 ImageGen 做文字定點編修。
- 不使用 SVG／HTML 疊字；交付仍是完整扁平單張 raster。
- 原始輸出 1585×992，機械正規化為系列既定 1586×992。
- 原尺寸目視核對：標題副題、Moon／Planets／Comet 六格、0.36／0.32／6.4／11.86／
  45.8、五枚模型章、行星借條與 both_loans 底部總結均保留原語意；未見新增物件或
  代號。
- 完整 runtime 基線：172/0（生圖前）。本次未接 runtime，因此不以綠燈冒充 Art Lock。

## 邊界

本交付只清除 both_loans 的括號漂移。K1 v02 與 K4 其餘三變體不重生；
`resolveEvidenceVisual`、資產 mapping、瀏覽器縮放與手機驗收仍等待整組 Art Lock 後的
runtime CR。本輪未 commit、未 push、未發佈。

## 總監裁決回執

`ART LOCK: PASS — CH4 K1 v02 + K4 no_loans／planets_loan／comet_loan v03 + both_loans v04`

因此本檔 v04 已成為 `both_loans` 唯一可接線來源；v03 僅保留 provenance。Art Lock
不授權接線，runtime 仍須另過 CH4-CR-014 Design Gate。
