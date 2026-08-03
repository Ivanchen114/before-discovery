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
| `card_K2_cross_scale_reconstruction_v02` | K2 取得後的桌面教學重建；把地表一秒紙、月球六十秒紙與 `60 × 60 = 3600` 換算痕跡並置，不宣稱為牛頓真跡或留存桌面照片 | `art/source/production/ch04/evidence/ch04_card_K2_cross_scale_reconstruction_master_v02.png` | `public/assets/ch04/evidence/ch04_card_K2_cross_scale_reconstruction_v02.webp` | OpenAI image generation／2026-08-03 | `ch04/evidence/PROMPTS_CH04_K2_EVIDENCE_RECONSTRUCTION_V02_20260803.md` | 中央裁成 8:5，Pillow Lanczos WebP q88，1200×750；無 runtime 疊圖 | generated／reviewed／browser pending |
