# 《發現之前》第一章正式美術批次 03｜標題、史實頁、證據卡

**交付者**：Sol（美術／審核）  
**日期**：2026-07-20  
**狀態**：美術完成，待 Claude 接線；本批不修改劇本、引擎或凍結基線

## 1. 正式交付

| ID | runtime 檔 | 尺寸 | 用途／構圖 |
|---|---|---:|---|
| `title_background`（新） | `public/assets/ch01/ui/title_background.webp` | 1920×1080 | 帕多瓦黎明工作室；中央暗部留給既有標題卡，器材分置左右下角 |
| `histfacts_banner`（新） | `public/assets/ch01/ui/histfacts_banner.webp` | 1920×420 | 左側傳說木刻、中央文獻查證、右側實驗器材；供史實揭露頁頂部橫幅 |
| `card_E1` | `public/assets/ch01/cards/card_E1.webp` | 800×500 | 高塔近乎同落；HTML 題名留白在左上 |
| `card_E3` | `public/assets/ch01/cards/card_E3.webp` | 800×500 | 斜面、等時分段、水鐘與遞增紀錄；不燒入數字 |
| `card_E4` | `public/assets/ch01/cards/card_E4.webp` | 800×500 | 同紙攤平／揉團的等臂天平＋空氣／水中下降對照 |
| `card_E5` | `public/assets/ch01/cards/card_E5.webp` | 800×500 | 緩斜面→中斜面→陡斜面→垂直落下的連續外推鏈 |

來源母版：

- `art/source/production/ch01/ui/final/ch01_title_background_master_v01.png`
- `art/source/production/ch01/ui/final/ch01_histfacts_banner_master_v01.png`
- `art/source/production/ch01/cards/final/ch01_card_{E1,E3,E4,E5}_master_v01.png`

預覽：

- `art/source/production/ch01/ui/final/ch01_title_histfacts_contact_v01.webp`
- `art/source/production/ch01/cards/final/ch01_cards_E1_E3_E4_E5_contact_v01.webp`

淘汰件：`ch01_card_E4_candidate_v01.png` 的天平沒有清楚呈現「同一張紙的兩種形態」，不得接入 runtime；保留只為製作稽核。

## 2. 美術判定

1. 所有可讀標題、說明、數字與公式仍由 HTML／SVG 疊加；點陣圖只承載材質、器材與氣氛。
2. 四張證據卡共用舊羊皮紙、深棕皮革邊、黃銅固定釘與銅色重點，形成同一套收藏物；各卡左上保留低細節區，避免壓住題名。
3. E4 是教學圖，不接受「看起來漂亮但物理關係含糊」：天平必須水平，兩盤分別是攤平與揉團的同紙；水缸與空氣下降只作介質差異，不畫死結論文字。
4. 標題圖中央安全區約佔畫面寬 34%，現有 `titleCard` 可直接覆蓋；圖片不得再烙遊戲名。
5. 史實頁橫幅是「傳說→查證→實驗」的視覺引子，不代替下方史實／傳說／改編表格。

## 3. 給 Claude 的接線包

請只改表現層、manifest 與契約測試，不動凍結劇情／功能基線：

1. 在 `greybox/data/assets.json` 新增 `title_background`、`histfacts_banner` 兩個 entry，並將 `card_E1/E3/E4/E5.path` 分別填入本表路徑；`card_E2.path` 維持 `null`，繼續使用程式 SVG。
2. `#title-screen` 使用 `title_background` 作 `cover center` 背景；在圖與 `titleCard` 間保留暗色漸層／半透明底，確保 200% 文字放大仍可讀。圖片是裝飾，無障礙名稱仍由現有 HTML 標題提供。
3. 史實揭露頁在標題／表格上方加入 `histfacts_banner`；使用空 `alt`、`aria-hidden="true"`，桌機顯示寬幅，844×390 橫屏以 `object-fit:cover` 並限制高度，不能把表格推到完全不可見。
4. 修正 `stage-ui.js/renderEvidenceCards()` 的解析規則：除 S1／S2 外，先嘗試 `assetEntry("card_" + code)`，不存在才 fallback `card_template`。E2 因 path 為 null，自然回退共用底並保留既有 SVG；不得把 E1/E3/E4/E5 的物理資訊改成新的硬編碼 DOM。
5. 補契約測試：四張專用卡路徑存在且 800×500；E2 仍為程式 SVG；專用卡解析優先、缺圖 fallback；標題與史實橫幅掛點存在。完成後跑既有全套測試與舞台 smoke test。

## 4. 可直接貼給 Claude 的短提示詞

> Sol 正式美術批次 03 已交付，見 `art/source/production/ch01/HANDOFF_BATCH_03_TITLE_HIST_CARDS_20260720.md`。請依 §3 只做表現層接線：標題背景、史實頁橫幅、E1/E3/E4/E5 專用證據卡；E2 保留程式 SVG。特別注意目前 `renderEvidenceCards()` 對 E1/E3/E4/E5 仍一律拿 `card_template`，請改為 `card_<code>` 存在時優先、缺圖才 fallback。保留 HTML/SVG 文字與物理資訊、補契約測試、跑全套測試與 smoke；不要動凍結劇本／引擎資料，也不要 stage Sol 其他未入庫件。

## 5. 生圖提示詞存檔

### 標題背景

```text
Production title-screen background for a historical science narrative game, realistic late-Renaissance historical illustration with restrained cinematic oil-paint texture. A quiet Padua scholar's workshop at dawn, 1603: a long hand-built wooden inclined groove with two bronze balls in the lower-left foreground; a simple elevated water-clock vessel, small collecting cup, balance, and an open blank notebook in the lower-right foreground; through a right-side window, a modest northern Italian bell tower in pale dawn mist. Warm walnut, aged parchment, muted brass, charcoal and cool blue-gray shadows. 16:9 wide composition. Keep the entire central vertical 34 percent calm, dark, low-detail and empty from upper third through lower center for an HTML title/menu card. Props may frame the safe area but must not cross it. No people, no telescope, no modern objects, no readable text, no title, no logo, no UI, no watermark, no fantasy glow.
```

### 史實頁橫幅

```text
Ultra-wide production banner for the end-of-chapter page "legend and historical record", in the same restrained realistic historical illustration style and walnut/parchment/brass palette. An archival table seen at a shallow three-quarter angle: on the left, a weathered old woodcut-style sheet suggesting a leaning Italian tower and two falling spheres, with a muted red wax seal, representing a famous legend; in the center, an open early-modern folio, magnifying lens and quill, representing source checking; on the right, a long grooved wooden incline, two bronze balls, a simple water-clock collecting cup, and a loose data sheet with nonverbal ink marks, representing experiment and evidence. Warm amber light on the legend side shifts gently to cool neutral daylight on the evidence side. 1920:420 panoramic composition, readable at short height, no people. No legible writing, dates, numbers, labels, title, UI, logo, watermark, or modern equipment.
```

### 證據卡共用約束

```text
Production evidence-card artwork for a historical educational game. 8:5 landscape, aged warm vellum mounted inside a dark-brown leather edge with four small brass corner pins and one restrained copper accent. Period ink-and-wash technical illustration with realistic historical materials, not a modern infographic. Keep the upper-left 38 percent and the top 24 percent calm and low-detail for HTML code/title overlay. No readable text, numerals, formulas, arrows, labels, UI, logo, watermark, people, or modern objects. The image must remain legible at 800x500.
```

- **E1**：在共用約束後加：`A tall late-16th-century Italian masonry bell tower occupies the right half; two spheres descend almost level beside it along faint vertical guide strokes, with two small impact dust rings below; one bronze and one dark wooden ball rest in the lower-right foreground.`
- **E3**：加：`A long shallow-grooved wooden inclined plane occupies the center-right, with one bronze ball near the top; beside it a simple elevated water vessel and collecting cup; four unobtrusive segment brackets divide the path; a loose data slip shows four progressively longer rows made only of dots and strokes, never numbers.`
- **E4**：加：`A perfectly horizontal equal-arm balance: one plain flat sheet of paper on the left pan and the same-sized crumpled paper on the right pan; beside it a clear pale-blue water vessel with two bronze spheres descending and restrained wake trails; a small separate air-descent inset at far right. The equality and medium comparison must be visually unambiguous without symbols.`
- **E5**：加：`Four separate vellum slips connected by one continuous thin copper thread through brass eyelets: a shallow incline, a medium incline, a steep incline, then a vertical masonry edge with a falling bronze sphere. The sequence reads left to right without arrows, labels, numbers, or formulas.`

## 6. 聲音分工判定

目前 Sol 工具能產點陣圖、不能交付可稽核的音樂／環境音檔，因此不冒充音訊製作。Claude 的程式合成 FX 可保留；正式候選版的聲音建議分兩層：

- 本輪必要：介面、落球、水滴、支柱、取得證據等短 FX；已有程式原生版本。
- 後續音訊批次：三條低存在感、可無縫循環的環境床——比薩迴廊晨風／遠鐘、帕多瓦木工坊室內底噪／偶發水滴、辯論廳安靜人群／木椅與衣料。對話時自動 duck，史實頁近乎靜音。
- BGM 不建議從頭鋪滿；開場、幕間、辯論終局與尾聲各用短主題即可，避免長篇閱讀疲勞，也避免音樂替玩家預告正解。
- 外部音源只收 CC0 1.0 或明確買斷／委託；每檔記錄來源網址、作者、授權版本、取得日、修改內容與 checksum。不可把「免費下載」當成可商用或 CC0。

