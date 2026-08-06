# 《發現之前》逐件美術資產帳

版本：v0.1-candidate  
日期：2026-07-31  
用途：依《全系列美術製作規格書》§7，逐件連結生成方式、母版、runtime 衍生、歷史邊界與查核狀態。

## 一、欄位與狀態

- `generated`：由專案協作者使用生成工具製作，沒有第三方影像直接併入。
- `runtime derived`：由母版壓縮或裁切出的遊戲檔，不能反向當母版。
- `reviewed`：已人工看過生成瑕疵、時代錯置、偽文字、洩答與可讀性。
- `browser pending`：資料與檔案已接線，但尚待總監在實際畫面確認構圖與裁切。

## 二、2026-07-31｜第四章 D4-1／D4-2 焦點鏡頭

| 資產 ID | 用途與史實邊界 | 母版 | runtime | 工具／日期 | 提示與編修紀錄 | 衍生參數 | 狀態 |
|---|---|---|---|---|---|---|---|
| `ch04_focus_stirred_tea_analogy_v01` | 攪茶類比的戲劇化重建；不是渦旋觀測證據 | `art/source/production/ch04/focus/ch04_focus_stirred_tea_analogy_master_v01.png` | `public/assets/ch04/focus/ch04_focus_stirred_tea_analogy_v01.webp` | OpenAI image generation／2026-07-31 | `PROMPTS_CH04_FOCUS_V02_20260731.md` §1 | sharp WebP q82，無裁切、無放大 | generated／reviewed／browser pending |
| `ch04_focus_lodestone_needle_analogy_v01` | 天然磁石與鐵針的戲劇化重建；只借隔空與距離弱化，不把磁力當引力機制 | `art/source/production/ch04/focus/ch04_focus_lodestone_needle_analogy_master_v01.png` | `public/assets/ch04/focus/ch04_focus_lodestone_needle_analogy_v01.webp` | OpenAI image generation／2026-07-31 | 同上 §2 | sharp WebP q82，無裁切、無放大 | generated／reviewed／browser pending |
| `ch04_focus_three_observation_folios_v01` | 三類資料封面重建；符號只用於分類，不含觀測數據 | `art/source/production/ch04/focus/ch04_focus_three_observation_folios_master_v01.png` | `public/assets/ch04/focus/ch04_focus_three_observation_folios_v01.webp` | OpenAI image generation／2026-07-31 | 同上 §3 | sharp WebP q82，無裁切、無放大 | generated／reviewed／browser pending |
| `ch04_focus_shell_theorem_page_v01` | 1687 印刷台紙頁底圖；排版演出不是定理首次形成日期 | `art/source/production/ch04/focus/ch04_focus_shell_theorem_page_master_v01.png` | `public/assets/ch04/focus/ch04_focus_shell_theorem_page_v01.webp` | OpenAI image generation／2026-07-31 | 同上 §4 | sharp WebP q82，無裁切、無放大；幾何另由 SVG 疊加 | generated／reviewed／browser pending |

## 三、母版與 runtime 邊界

- 母版保留 1672×941 PNG；runtime 為 1672×941 WebP。
- HTML 顯示名稱、替代文字與說明維護在 `greybox/data/assets.json`。
- 球殼幾何維護在 `greybox/src/stage/03-focus-visual.part.js`；不得畫回 PNG。
- runtime 單檔均低於 512 KB；第四章含音樂目前約 11.6 MB，低於 25 MB 章預算。

## 四、既有資產回填缺口

本帳自 2026-07-31 起為 canonical 候選；本批四件已逐件完成。2026-07-30 以前的既有資產仍分散在各章 README、PROMPTS 與 manifest，後續需批次回填，未回填者不得僅因出現在 runtime 就宣稱完成 Art Lock。

## 五、2026-07-31｜第三章章首年代轉場

| 資產 ID | 用途與史實邊界 | 母版 | runtime | 工具／日期 | 提示與編修紀錄 | 衍生參數 | 狀態 |
|---|---|---|---|---|---|---|---|
| `ch03_transition_1610_jupiter_observation_v01` | 望遠鏡觀測的歷史情境重建；不承載可核對星位 | `art/source/production/ch03/transitions/ch03_transition_1610_jupiter_observation_master_v01.png` | `public/assets/ch03/transitions/ch03_transition_1610_jupiter_observation_v01.webp` | OpenAI image generation／2026-07-31 | `PROMPTS_CH03_TIMELINE_20260731.md` §1610 | sharp WebP q84，無裁切、無放大 | generated／reviewed／browser pending |
| `ch03_transition_1616_roman_admonition_v01` | 羅馬告誡的程序性重建；文書正文不可讀 | `art/source/production/ch03/transitions/ch03_transition_1616_roman_admonition_master_v01.png` | `public/assets/ch03/transitions/ch03_transition_1616_roman_admonition_v01.webp` | OpenAI image generation／2026-07-31 | 同上 §1616 | sharp WebP q84，無裁切、無放大 | generated／reviewed／browser pending |
| `ch03_transition_1633_roman_statement_v01` | 羅馬聲明的克制重建；不把傳說姿勢當唯一史實 | `art/source/production/ch03/transitions/ch03_transition_1633_roman_statement_master_v01.png` | `public/assets/ch03/transitions/ch03_transition_1633_roman_statement_v01.webp` | OpenAI image generation／2026-07-31 | 同上 §1633 | sharp WebP q84，無裁切、無放大 | generated／reviewed／browser pending |

1632 沿用既有 `ch03_transition_1632_dialogue_ship_page_v01`；本批不重生成，也不倒推改寫其舊來源狀態。

## 六、2026-08-01｜第四章 1665 同尺紙底圖

| 資產 ID | 用途與史實邊界 | 母版 | runtime | 工具／日期 | 提示與編修紀錄 | 衍生參數 | 狀態 |
|---|---|---|---|---|---|---|---|
| `ch04_prop_cross_scale_surface_sheet_v01` | 地表一秒紙的 1665 手稿語彙教學重建；不是牛頓真跡或留存紙掃描，數字與公式由可驗證 SVG 疊加 | `art/source/production/ch04/props/ch04_prop_cross_scale_surface_sheet_master_v01.png` | `public/assets/ch04/props/ch04_prop_cross_scale_surface_sheet_v01.webp` | OpenAI image generation／2026-08-01 | `ch04/props/PROMPTS_CH04_CROSS_SCALE_SHEETS_V01_20260801.md` §Prompt 1 | sharp WebP q82，1200×480；runtime 以 SVG 疊字 | generated／reviewed／browser pending |
| `ch04_prop_cross_scale_moon_sheet_v01` | 月球六十秒紙的 1665 手稿語彙教學重建；不是牛頓真跡或留存紙掃描，換算公式完成作答後才由 SVG 顯示 | `art/source/production/ch04/props/ch04_prop_cross_scale_moon_sheet_master_v01.png` | `public/assets/ch04/props/ch04_prop_cross_scale_moon_sheet_v01.webp` | OpenAI image generation／2026-08-01 | 同上 §Prompt 2 | sharp WebP q82，1200×480；runtime 以 SVG 疊字 | generated／reviewed／browser pending |

## 七、2026-08-03｜第四章 1665 同尺紙完整重建圖

| 資產 ID | 用途與史實邊界 | 母版 | runtime | 工具／日期 | 提示與編修紀錄 | 衍生參數 | 狀態 |
|---|---|---|---|---|---|---|---|
| `ch04_prop_cross_scale_surface_sheet_v02` | 地表一秒完整教學重建；數字與簡式已烤入圖中，但不是牛頓真跡或留存紙掃描 | `art/source/production/ch04/props/ch04_prop_cross_scale_surface_sheet_master_v02.png` | `public/assets/ch04/props/ch04_prop_cross_scale_surface_sheet_v02.webp` | OpenAI image generation／2026-08-03 | `ch04/props/PROMPTS_CH04_CROSS_SCALE_SHEETS_V02_20260803.md` §Prompt 1 | Pillow Lanczos WebP q88，1200×480；無 runtime 疊圖 | generated／reviewed／browser pending |
| `ch04_prop_cross_scale_moon_sheet_v02` | 月球六十秒完整教學重建；主尺呈現約 60 地球半徑，放大框分開呈現切線與向內偏折；不先寫換算答案 | `art/source/production/ch04/props/ch04_prop_cross_scale_moon_sheet_master_v02.png` | `public/assets/ch04/props/ch04_prop_cross_scale_moon_sheet_v02.webp` | OpenAI image generation／2026-08-03 | 同上 §Prompt 2 | Pillow Lanczos WebP q88，1200×480；無 runtime 疊圖 | generated／reviewed／browser pending |

## 八、2026-08-03｜第四章 K2 取得證據桌面重建圖

| 資產 ID | 用途與史實邊界 | 母版 | runtime | 工具／日期 | 提示與編修紀錄 | 衍生參數 | 狀態 |
|---|---|---|---|---|---|---|---|
| `card_K2_cross_scale_reconstruction_v02` | 歷史版 K2 取得桌面；2026-08-05 因把六十秒與公式烤進 raster、牴觸一秒先行順序而退出正式 `evidenceVisual.K2`，檔案僅留追溯 | `art/source/production/ch04/evidence/ch04_card_K2_cross_scale_reconstruction_master_v02.png` | `public/assets/ch04/evidence/ch04_card_K2_cross_scale_reconstruction_v02.webp` | OpenAI image generation／2026-08-03 | `ch04/evidence/PROMPTS_CH04_K2_EVIDENCE_RECONSTRUCTION_V02_20260803.md` | 中央裁成 8:5，Pillow Lanczos WebP q88，1200×750；無 runtime 疊圖 | generated／reviewed／retired from display |

## 九、2026-08-05｜共同發現感跨章焦點圖

| 資產 ID | 用途與史實邊界 | 母版 | runtime | 工具／日期 | 提示與編修紀錄 | 衍生參數 | 狀態 |
|---|---|---|---|---|---|---|---|
| `ch01_focus_shared_paper_calculation_v01` | 兩人平行核紙的戲劇化重建；紙上不承載平方律答案 | `art/source/production/ch01/focus/ch01_focus_shared_paper_calculation_master_v01.png` | `public/assets/ch01/focus/ch01_focus_shared_paper_calculation_v01.webp` | OpenAI 內建 imagegen／2026-08-05 | `PROMPTS_COMMON_DISCOVERY_FOCUS_V01_20260805.md` §1 | sharp WebP q84，無裁切、無放大 | generated／reviewed／browser pending |
| `ch02_focus_evidence_next_test_v01` | 保留砂痕紙並換球續查的戲劇化重建；不顯示實驗答案 | `art/source/production/ch02/focus/ch02_focus_evidence_next_test_master_v01.png` | `public/assets/ch02/focus/ch02_focus_evidence_next_test_v01.webp` | 同上 | 同上 §2 | sharp WebP q84，無裁切、無放大 | generated／reviewed／browser pending |
| `ch03_focus_public_limited_claim_v01` | 公開落筆的戲劇化重建；簿冊內容不可讀，不冒充留存公文 | `art/source/production/ch03/focus/ch03_focus_public_limited_claim_master_v01.png` | `public/assets/ch03/focus/ch03_focus_public_limited_claim_v01.webp` | 同上 | 同上 §3 | sharp WebP q84，無裁切、無放大 | generated／reviewed／browser pending |
| `ch04_focus_shared_moon_calculation_v01` | 兩張獨立算紙的教學重建；數值、公式與精確正矢由 runtime SVG 顯示 | `art/source/production/ch04/focus/ch04_focus_shared_moon_calculation_master_v01.png` | `public/assets/ch04/focus/ch04_focus_shared_moon_calculation_v01.webp` | 同上 | 同上 §4 | sharp WebP q84，無裁切、無放大 | generated／reviewed／browser pending |
| `ch06_focus_four_hands_strip_alignment_v01` | 四人共同對齊紙帶的戲劇化重建；初稿六手已退件 | `art/source/production/ch06/focus/ch06_focus_four_hands_strip_alignment_master_v01.png` | `public/assets/ch06/focus/ch06_focus_four_hands_strip_alignment_v01.webp` | 同上 | 同上 §5 | sharp WebP q84，無裁切、無放大 | generated／reviewed／browser pending |
| `ch06_focus_public_blank_admission_v01` | 公開保留未決欄的戲劇化重建；不將冰或炮紙畫成機制證明 | `art/source/production/ch06/focus/ch06_focus_public_blank_admission_master_v01.png` | `public/assets/ch06/focus/ch06_focus_public_blank_admission_v01.webp` | 同上 | 同上 §6 | sharp WebP q84，無裁切、無放大 | generated／reviewed／browser pending |

本批六件正式母版均為 1672×941 PNG；runtime 單檔 104–203 KB，低於 512 KB。文字、數字、公式與精確資料不烤入 raster。

第四章 `card_K2` 是旅人筆記會優先解析的相容別名；2026-08-05 起已改指向 `ch04_focus_shared_moon_calculation_v01`，避免筆記縮圖繞過 `evidenceVisual.K2` 又載回含答案的歷史 SVG。

## 十、2026-08-05｜共同探究雙鏡頭閱讀圖

| 資產 ID | 用途與史實邊界 | 母版 | runtime | 工具／日期 | 提示與編修紀錄 | 衍生參數 | 狀態 |
|---|---|---|---|---|---|---|---|
| `ch01_focus_square_pattern_reading_v01` | A2-2 已揭曉五個總距離後的正視閱讀圖；只承載 `1 4 9 16 25`，不替玩家補公式 | `art/source/production/ch01/focus/ch01_focus_square_pattern_reading_master_v01.png` | `public/assets/ch01/focus/ch01_focus_square_pattern_reading_v01.webp` | OpenAI 內建 imagegen／2026-08-05 | `PROMPTS_DUAL_SHOT_READING_V01_20260805.md` §1 | sharp WebP q84，無裁切、無放大 | generated／reviewed／browser pending |
| `ch02_focus_ball_comparison_reading_v01` | B2-3 四列砂痕的正視閱讀圖；只標銅球／木球，不畫判決 | `art/source/production/ch02/focus/ch02_focus_ball_comparison_reading_master_v01.png` | `public/assets/ch02/focus/ch02_focus_ball_comparison_reading_v01.webp` | 同上 | 同上 §2 | sharp WebP q84，無裁切、無放大 | generated／reviewed／browser pending |
| `ch03_focus_limited_claim_reading_v01` | C3-1 公開結果紙的雙欄教學重建；不是留存公文 | `art/source/production/ch03/focus/ch03_focus_limited_claim_reading_master_v01.png` | `public/assets/ch03/focus/ch03_focus_limited_claim_reading_v01.webp` | 同上 | 同上 §3 | sharp WebP q84，無裁切、無放大 | generated／reviewed／browser pending |
| `ch04_focus_one_second_papers_reading_v01` | D1-2 K2 完成後的兩張一秒算紙；只烤入已揭曉兩值與待比較，不含倍率或平方關係 | `art/source/production/ch04/focus/ch04_focus_one_second_papers_reading_master_v01.png` | `public/assets/ch04/focus/ch04_focus_one_second_papers_reading_v01.webp` | 同上 | 同上 §4 | sharp WebP q84，無裁切、無放大 | generated／reviewed／browser pending |
| `ch05_focus_same_six_records_relation_v01` | E2-2 杜夏特萊與旅人守住同六張原紙的戲劇化重建；旅人不定臉 | `art/source/production/ch05/focus/ch05_focus_same_six_records_relation_master_v01.png` | `public/assets/ch05/focus/ch05_focus_same_six_records_relation_v01.webp` | 同上 | 同上 §5；五張紙稿退件後修為六張 | sharp WebP q84，無裁切、無放大 | generated／reviewed／browser pending |
| `ch05_focus_two_ledgers_reading_v01` | E2-2 同紙換帳的正視閱讀圖；只顯示當前一列的短少，不宣稱去向 | `art/source/production/ch05/focus/ch05_focus_two_ledgers_reading_master_v01.png` | `public/assets/ch05/focus/ch05_focus_two_ledgers_reading_v01.webp` | 同上 | 同上 §6；過密初稿退件 | sharp WebP q84，無裁切、無放大 | generated／reviewed／browser pending |
| `ch06_focus_heat_strips_reading_v01` | H1-1 碎屑／薄片紙帶正視閱讀圖；近乎重合已由前句揭曉，圖不替玩家選範圍 | `art/source/production/ch06/focus/ch06_focus_heat_strips_reading_master_v01.png` | `public/assets/ch06/focus/ch06_focus_heat_strips_reading_v01.webp` | 同上 | 同上 §7 | sharp WebP q84，無裁切、無放大 | generated／reviewed／browser pending |

本批七件正式母版均為 1672×941 PNG；runtime 單檔約 146–307 KB，低於 512 KB。圖內文字逐字列在提示紀錄與 `assets.json.embeddedText`；任何新增字串都須重新審查揭曉時點。

## 十一、2026-08-05｜第四章 D1-1 無作用切線預測紙修正

| 資產 ID | 用途與史實邊界 | 母版 | runtime | 工具／日期 | 提示與編修紀錄 | 衍生參數 | 狀態 |
|---|---|---|---|---|---|---|---|
| `ch04_prop_tangent_prediction_sheet_v03` | D1-1 封存的無作用思想預測；只畫地月半徑與單一直切線，不是月球觀測紀錄，也不提前顯示實際端點或向內偏折 | `art/source/production/ch04/props/ch04_prop_tangent_prediction_sheet_master_v03.png` | `public/assets/ch04/props/ch04_prop_tangent_prediction_sheet_v03.webp` | OpenAI 內建 imagegen／2026-08-05 | `ch04/props/PROMPTS_CH04_TANGENT_PREDICTION_SHEET_V03_20260805.md` | Pillow Lanczos WebP q84，1200×750；無裁切、無 runtime 疊字 | generated／reviewed／browser pending |

v02 多出一段未揭曉的彎曲弧線，會把後續「實際端點向地球偏」提前暗示；v03 移除該弧線並保留 v02 檔案作版本追溯。
