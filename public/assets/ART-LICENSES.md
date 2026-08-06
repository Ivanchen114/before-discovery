# 《發現之前》美術資產授權與來源索引

版本：v0.1-candidate  
日期：2026-07-31

## 一、適用範圍

本檔補充根目錄 `LICENSE-CONTENT.md`，記錄 `public/assets/` 正式美術的產生方式與第三方素材邊界。遊戲程式碼授權不在本檔處理。

## 二、OpenAI 生成資產｜2026-07-31 第四章補圖

以下四件由專案協作者 Sol／Codex 使用 OpenAI 內建 image generation 產生，未投入第三方影像、未直接模仿特定在世藝術家，並依 OpenAI 使用條款及本專案 `LICENSE-CONTENT.md` 的非商業共享精神散布：

| 資產 ID | runtime 資產 | 母版與提示紀錄 | 第三方影像 | 授權狀態 |
|---|---|---|---|---|
| `ch04_focus_stirred_tea_analogy_v01` | `ch04/focus/ch04_focus_stirred_tea_analogy_v01.webp` | `art/source/production/ch04/focus/PROMPTS_CH04_FOCUS_V02_20260731.md` §1 | 無 | 可進內部／公開非商業版本 |
| `ch04_focus_lodestone_needle_analogy_v01` | `ch04/focus/ch04_focus_lodestone_needle_analogy_v01.webp` | 同上 §2 | 無 | 可進內部／公開非商業版本 |
| `ch04_focus_three_observation_folios_v01` | `ch04/focus/ch04_focus_three_observation_folios_v01.webp` | 同上 §3 | 無 | 可進內部／公開非商業版本 |
| `ch04_focus_shell_theorem_page_v01` | `ch04/focus/ch04_focus_shell_theorem_page_v01.webp` | 同上 §4 | 無 | 可進內部／公開非商業版本 |

## 三、衍生檔

四件 WebP 皆由同名 PNG 母版以 sharp 轉出，沒有加入外部圖層。HTML／SVG 疊圖屬本專案自製程式與內容；球殼頁的幾何線不屬生成影像的一部分。

## 四、既有資產回填缺口

2026-07-30 以前的既有美術授權紀錄仍散見各章 README、PROMPTS 與 `LICENSE-CONTENT.md`。本檔不倒推宣告未逐件查核的舊資產；後續回填前，舊資產仍以原紀錄為準。

## 五、OpenAI 生成資產｜2026-07-31 第三章年代補圖

以下三件由專案協作者 Sol／Codex 使用 OpenAI 內建 image generation 產生，未投入第三方影像、未直接模仿特定在世藝術家。1632 年沿用既有資產，不列為本批新生成物。

| 資產 ID | runtime 資產 | 母版與提示紀錄 | 第三方影像 | 授權狀態 |
|---|---|---|---|---|
| `ch03_transition_1610_jupiter_observation_v01` | `ch03/transitions/ch03_transition_1610_jupiter_observation_v01.webp` | `art/source/production/ch03/transitions/PROMPTS_CH03_TIMELINE_20260731.md` §1610 | 無 | 可進內部／公開非商業版本 |
| `ch03_transition_1616_roman_admonition_v01` | `ch03/transitions/ch03_transition_1616_roman_admonition_v01.webp` | 同上 §1616 | 無 | 可進內部／公開非商業版本 |
| `ch03_transition_1633_roman_statement_v01` | `ch03/transitions/ch03_transition_1633_roman_statement_v01.webp` | 同上 §1633 | 無 | 可進內部／公開非商業版本 |

## 六、OpenAI 生成資產｜2026-08-01 第四章同尺紙

以下兩件由專案協作者 Codex 使用 OpenAI 內建 image generation 產生，未投入第三方影像、未直接模仿特定在世藝術家。兩圖是歷史語彙教學重建，不宣稱為牛頓真跡；玩家看到的數字與公式是專案自製 SVG 疊圖，不屬生成影像的一部分。

| 資產 ID | runtime 資產 | 母版與提示紀錄 | 第三方影像 | 授權狀態 |
|---|---|---|---|---|
| `ch04_prop_cross_scale_surface_sheet_v01` | `ch04/props/ch04_prop_cross_scale_surface_sheet_v01.webp` | `art/source/production/ch04/props/PROMPTS_CH04_CROSS_SCALE_SHEETS_V01_20260801.md` §Prompt 1 | 無 | 可進內部／公開非商業版本 |
| `ch04_prop_cross_scale_moon_sheet_v01` | `ch04/props/ch04_prop_cross_scale_moon_sheet_v01.webp` | 同上 §Prompt 2 | 無 | 可進內部／公開非商業版本 |

## 七、OpenAI 生成資產｜2026-08-03 第四章同尺紙完整重建圖

以下兩件由專案協作者 Codex 使用 OpenAI image generation 產生，未投入第三方影像、未直接模仿特定在世藝術家。兩圖是現代教學重建，不是牛頓手稿掃描。依總監裁決，本版的線條、公開數字與簡式已烤入 raster 圖；玩家仍待判斷的 `1.4 mm`、`3600` 與平方關係沒有提前寫入圖中。

| 資產 ID | runtime 資產 | 母版與提示紀錄 | 第三方影像 | 授權狀態 |
|---|---|---|---|---|
| `ch04_prop_cross_scale_surface_sheet_v02` | `ch04/props/ch04_prop_cross_scale_surface_sheet_v02.webp` | `art/source/production/ch04/props/PROMPTS_CH04_CROSS_SCALE_SHEETS_V02_20260803.md` §Prompt 1 | 無 | 可進內部／公開非商業版本 |
| `ch04_prop_cross_scale_moon_sheet_v02` | `ch04/props/ch04_prop_cross_scale_moon_sheet_v02.webp` | 同上 §Prompt 2 | 無 | 可進內部／公開非商業版本 |

## 八、OpenAI 生成資產｜2026-08-03 第四章 K2 取得證據桌面重建圖

下列圖像由專案協作者 Codex 使用 OpenAI image generation 產生，以本專案兩張同尺紙生成母版作為參考，未投入第三方影像、未直接模仿特定在世藝術家。這是現代教學重建，不是牛頓手稿掃描或歷史桌面照片；數字、公式與圖線已烤入 raster 圖，沒有執行期疊圖。

| 資產 ID | runtime 資產 | 母版與提示紀錄 | 第三方影像 | 授權狀態 |
|---|---|---|---|---|
| `card_K2_cross_scale_reconstruction_v02` | `ch04/evidence/ch04_card_K2_cross_scale_reconstruction_v02.webp` | `art/source/production/ch04/evidence/PROMPTS_CH04_K2_EVIDENCE_RECONSTRUCTION_V02_20260803.md` | 無 | 可進內部／公開非商業版本 |

## 九、OpenAI 生成資產｜2026-08-05 共同發現感跨章焦點圖

以下六件由專案協作者 Codex 使用 OpenAI 內建 imagegen 產生，以本專案既有章節圖作視覺參考；未投入第三方影像、未直接模仿特定在世藝術家。生成影像不含可讀文字、公式或精確資料，相關內容由本專案 runtime 圖層呈現。

| 資產 ID | runtime 資產 | 母版與提示紀錄 | 第三方影像 | 授權狀態 |
|---|---|---|---|---|
| `ch01_focus_shared_paper_calculation_v01` | `ch01/focus/ch01_focus_shared_paper_calculation_v01.webp` | `art/source/production/PROMPTS_COMMON_DISCOVERY_FOCUS_V01_20260805.md` §1 | 無 | 可進內部／公開非商業版本 |
| `ch02_focus_evidence_next_test_v01` | `ch02/focus/ch02_focus_evidence_next_test_v01.webp` | 同上 §2 | 無 | 可進內部／公開非商業版本 |
| `ch03_focus_public_limited_claim_v01` | `ch03/focus/ch03_focus_public_limited_claim_v01.webp` | 同上 §3 | 無 | 可進內部／公開非商業版本 |
| `ch04_focus_shared_moon_calculation_v01` | `ch04/focus/ch04_focus_shared_moon_calculation_v01.webp` | 同上 §4 | 無 | 可進內部／公開非商業版本 |
| `ch06_focus_four_hands_strip_alignment_v01` | `ch06/focus/ch06_focus_four_hands_strip_alignment_v01.webp` | 同上 §5 | 無 | 可進內部／公開非商業版本 |
| `ch06_focus_public_blank_admission_v01` | `ch06/focus/ch06_focus_public_blank_admission_v01.webp` | 同上 §6 | 無 | 可進內部／公開非商業版本 |

註：旅人筆記相容別名 `card_K2` 與 `ch04_focus_shared_moon_calculation_v01` 共用同一 runtime、母版與授權紀錄。

## 十、OpenAI 生成資產｜2026-08-05 共同探究雙鏡頭

以下七件由專案協作者 Codex 使用 OpenAI 內建 imagegen 產生，以本專案既有章節圖作視覺參考；未投入第三方影像、未直接模仿特定在世藝術家。這些圖是戲劇化或教學重建，不冒充歷史手稿與照片。少量已揭曉文字依 GB-ADR-044 受控烤入 raster，逐字內容與揭曉時點記在提示紀錄。

| 資產 ID | runtime 資產 | 母版與提示紀錄 | 第三方影像 | 授權狀態 |
|---|---|---|---|---|
| `ch01_focus_square_pattern_reading_v01` | `ch01/focus/ch01_focus_square_pattern_reading_v01.webp` | `art/source/production/PROMPTS_DUAL_SHOT_READING_V01_20260805.md` §1 | 無 | 可進內部／公開非商業版本 |
| `ch02_focus_ball_comparison_reading_v01` | `ch02/focus/ch02_focus_ball_comparison_reading_v01.webp` | 同上 §2 | 無 | 可進內部／公開非商業版本 |
| `ch03_focus_limited_claim_reading_v01` | `ch03/focus/ch03_focus_limited_claim_reading_v01.webp` | 同上 §3 | 無 | 可進內部／公開非商業版本 |
| `ch04_focus_one_second_papers_reading_v01` | `ch04/focus/ch04_focus_one_second_papers_reading_v01.webp` | 同上 §4 | 無 | 可進內部／公開非商業版本 |
| `ch05_focus_same_six_records_relation_v01` | `ch05/focus/ch05_focus_same_six_records_relation_v01.webp` | 同上 §5 | 無 | 可進內部／公開非商業版本 |
| `ch05_focus_two_ledgers_reading_v01` | `ch05/focus/ch05_focus_two_ledgers_reading_v01.webp` | 同上 §6 | 無 | 可進內部／公開非商業版本 |
| `ch06_focus_heat_strips_reading_v01` | `ch06/focus/ch06_focus_heat_strips_reading_v01.webp` | 同上 §7 | 無 | 可進內部／公開非商業版本 |
