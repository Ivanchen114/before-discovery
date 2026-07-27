# 第五章 runtime 美術生成與採用紀錄

日期：2026-07-27  
工具：Codex 內建 ImageGen  
用途：第五章《兩本帳，哪一本是真的？》正式可玩候選版

## 一、交付範圍

本批新增八張非證據圖：

1. 章首轉場三張：1687 碰撞問題、1687→1740 紙頁時間通道、1740 抵達西雷。
2. 場景背景三張：西雷日間書房、夜間辯論桌、低火尾聲。
3. 對話人物兩張：Émilie du Châtelet 約 34 歲、虛構複合角色杜佩院士約 58 歲。

S6、S7、J1–J4 六張證據圖由平行工作流生成，提示詞與母版位於
`art/source/production/ch05/evidence/`。本輪負責視覺與證據邊界驗收，
並修正 J1、J2。

## 二、史實與視覺邊界

- 地點採法國西雷莊園約 1740 年。官方 Château de Cirey 資料確認 1734–1749
  為 Émilie du Châtelet 與 Voltaire 居住、研究的時期，並提到書庫、物理實驗櫃、
  Voltaire 增建的 gallery wing 與 Nollet 儀器。
- 西雷現存室內經歷革命後散失與後世改建，背景一律標示「合理重建」，
  不宣稱精確復原某一房間。
- 杜夏特萊外觀參考 Rijksmuseum 的 Johann Martin Bernigeroth 1742 年版畫，
  以及 British Museum 對當代版畫中 fur-lined gown、書房、地球儀與書架的描述；
  不採後世已撤回身分認定的 Nattier 肖像。
- 杜佩院士是虛構複合角色，服飾只要求符合 1730–1740 年代法國學者，
  不暗示有真實肖像。
- 背景中的碰撞台是教學代理，不是 `'s Gravesande` 特定裝置復原。
- 圖片不呈現「活力變成熱」「能量守恆」或完整去向；所有數值與結算交給 runtime。

查核來源：

- https://www.chateaudecirey.com/xviiieme
- https://sri.grandest.fr/publications/le-chateau-de-cirey-sur-blaise-retraite-de-voltaire-et-demilie-du-chatelet/
- https://www.rijksmuseum.nl/en/collection/object/Portret-van-%C3%89milie-du-Ch%C3%A2telet--ac5d7fa1ebc84914ca5f9314267e7e42
- https://www.britishmuseum.org/collection/object/P_1858-0724-185

## 三、共同視覺規格

- 類型：`historical-scene`；紙頁時間通道為 `stylized-concept`。
- 風格：前三、四章的 painterly photorealistic historical game art；
  自然材質、克制電影光、不做奇幻傳送門或博物館蠟像。
- 背景：16:9、無人物、無可讀文字、無現代物件，保留 UI 與雙肖像安全區。
- 人物：純綠幕生成，去背後輸出 900×1200 transparent WebP。
- 物理圖、帳目數字、箭頭與 fixture 不燒進場景底圖。
- 禁止：glowing book、勝負象徵、撕紙、公式、能量流向箭頭、steampunk、logo、watermark。

## 四、最終提示詞摘要與輸出

### 1. 西雷日間書房

> Château de Cirey working library around 1740: tall French windows, book-lined walls,
> stone fireplace, walnut shelves and broad table. Two separate unreadable folios,
> blank sheets, quills, dividers and modest period instruments. Cool late-morning light
> with restrained firelight; no people, text, equations, modern objects or fantasy.

母版：`backgrounds/ch05_bg_cirey_library_day_master_v01.png`  
runtime：`public/assets/ch05/backgrounds/ch05_bg_cirey_library_day_v01.webp`

### 2. 西雷夜間辯論桌

> The same Cirey salon at evening. Two blank ledgers side by side, shallow clay tray
> with three dents, and a simple teaching collision track with steel balls and putty caps.
> Warm fire and oil-lamp light against cool windows. The two books remain separate and
> equally dignified. No people, numbers, equations or solved energy destination.

母版：`backgrounds/ch05_bg_cirey_debate_evening_master_v01.png`  
runtime：`public/assets/ch05/backgrounds/ch05_bg_cirey_debate_evening_v01.webp`

### 3. 西雷低火尾聲

> Quiet late-night aftermath in the same library. Two open blank account ledgers remain
> side by side with a narrow gap; one closed mathematical folio, quill, dividers and clay
> tray nearby. Chairs pushed back, low embers and moonlit windows. No torn papers,
> triumph symbols, readable text or people.

母版：`backgrounds/ch05_bg_cirey_epilogue_night_master_v01.png`  
runtime：`public/assets/ch05/backgrounds/ch05_bg_cirey_epilogue_night_v01.webp`

### 4. 1687 碰撞問題

> London print-room table after work in 1687: two shallow trays of lead type, two blank
> account slips, closed mathematical folio and an open Traveler notebook catching pale
> light. The unresolved question passes forward quietly; no text, dates, equations,
> fantasy portal or people.

母版：`transitions/ch05_transition_1687_collision_question_master_v01.png`  
runtime：`public/assets/ch05/transitions/ch05_transition_1687_collision_question_v01.webp`

### 5. 1687→1740 紙頁時間通道

> Thick handmade notebook pages turning across a dark desk. Printer's ink and lead type
> fade at left; shifting winter, autumn and spring light passes beyond the window; a
> French quill and two blank account slips wait at right. Physical paper and light,
> no clocks, calendars, digits, magic glyphs or hands.

母版：`transitions/ch05_transition_1687_1740_pagefold_master_v01.png`  
runtime：`public/assets/ch05/transitions/ch05_transition_1687_1740_pagefold_v01.webp`

### 6. 約 1740 抵達西雷

> Plausible Château de Cirey exterior around 1740: restrained irregular stone residence,
> slate roofs, repaired main house and newer gallery wing, wet tree-lined approach and
> one warm study window. Not Versailles scale and not an exact claim about the later
> surviving building.

母版：`transitions/ch05_transition_1740_cirey_arrival_master_v01.png`  
runtime：`public/assets/ch05/transitions/ch05_transition_1740_cirey_arrival_v01.webp`

### 7. Émilie du Châtelet 約 34 歲

> Plausible 1740 identity reconstruction informed by the 1742 Bernigeroth engraving:
> oval face, high forehead, dark attentive eyes, restrained period hair; muted blue-gray
> silk gown with ivory stomacher and modest dark fur edging. Three-quarter dialogue bust,
> placed right and facing left, quill and blank ledger, precise calm expression.
> Flat #00ff00 chroma background; no late-century hair, sexualized neckline or text.

母版：`characters/ch05_char_du_chatelet34_chroma_v01.png`  
去背：`characters/ch05_char_du_chatelet34_alpha_v01.png`  
runtime：`public/assets/ch05/characters/ch05_char_du_chatelet34_v01.webp`

### 8. 杜佩院士約 58 歲

> Fictional composite French academician around 1740: intelligent weathered face,
> restrained powdered gray wig, charcoal-brown justaucorps, plain cravat and intact
> calculation sheets. Three-quarter dialogue bust, placed left and facing right;
> formidable and honestly confident, not angry or defeated. Flat #00ff00 chroma
> background; no medals, sword, villain pose or readable text.

母版：`characters/ch05_char_dupre58_chroma_v01.png`  
去背：`characters/ch05_char_dupre58_alpha_v01.png`  
runtime：`public/assets/ch05/characters/ch05_char_dupre58_v01.webp`

## 五、證據圖採用裁決

### 原樣採用

- S6：清楚標為「史料意象圖」，不是原書頁掃描。
- S7：只呈現可量的黏土壓痕，不替活力去向開收據。
- J3：呈現三種落下條件與三種壓痕；同一顆球、速度與坑深的確切值由 runtime 說明。
- J4：兩本帳物理上分開，中間保留空白收據，未合成單一守恆律。

### J1、J2 v01 退役，v02 採用

J1 v01 與 J2 v01 的點／骰格看似可數，實際數量未能對平，會製造假的
fixture。v02 保留碰撞物件、方向與未決格，但清空所有裝飾性數量：

- J1 v02：兩組數值帳格皆空白，閉合數字只由玩家工作台紀錄給出。
- J2 v02：彈性列保留同尺寸空白帳格；油灰列另保留虛線未決格，
  不畫熱或完整去向。

runtime：

- `public/assets/ch05/evidence/ch05_card_J1_signed_momentum_ledger_v02.webp`
- `public/assets/ch05/evidence/ch05_card_J2_vis_viva_ledger_v02.webp`

v01 保留作生成失敗紀錄，但 `assets.json` 禁止引用。

## 六、技術輸出

- 場景背景：1920×1080 WebP，quality 82。
- 章首轉場：1672×941 WebP，quality 82。
- 人物：900×1200 transparent WebP，quality 88；四角 alpha＝0。
- 證據卡：1200×750 WebP；J1、J2 使用 v02。
- 所有 runtime 圖單檔低於 512 KB，遠低於單檔 2 MB 預算。
