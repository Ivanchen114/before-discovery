# 第四章 runtime 美術生成紀錄

日期：2026-07-23
工具：Codex 內建 ImageGen
用途：第四章《月亮一直在掉》正式可玩候選版

## 共同規格

- 類型：historical-scene。
- 風格：前三章既有的 painterly photorealistic historical game art；自然材質、克制電影光，不做奇幻或博物館蠟像。
- 背景：16:9、無人物、無文字、無現代物件，保留對話肖像與 UI 安全區；物理軌跡、箭頭、殘差與證明連線全部由程式即時計算，不燒進圖片。
- 人物：900×1200 對話立繪；生成於純色去背底，再轉透明 WebP。
- 歷史邊界：22 歲與 41 歲 Newton、28 歲 Halley 均標記為「合理重建」，不是宣稱有同齡寫真可供精確復原。
- 風格參考：`public/assets/ch03/backgrounds/ch03_bg_marseille_harbor_dawn_v01.webp`、`public/assets/ch03/backgrounds/ch03_bg_print_room_1642_v01.webp`、`public/assets/ch03/characters/ch03_char_gassendi48_v01.webp`；只參考媒材、光線與構圖密度，不複製人物或場景。

## 背景提示詞

### 1. Woolsthorpe 果園・1665

> Woolsthorpe Manor orchard in Lincolnshire in 1665, modest seventeenth-century stone farmhouse, old orchard and dry-stone wall, uneven grass, one ordinary fallen apple, pale daytime Moon through low broken clouds. Wide 16:9 human-eye establishing shot, quiet UI-safe negative space. Cool overcast late-afternoon light, unsentimental and historically plausible. No people, glowing apple, divine beam, grand estate, mountains, text, labels, modern objects, fantasy, logo or watermark.

來源：`backgrounds/ch04_bg_woolsthorpe_orchard_1665_master_v01.png`
runtime：`public/assets/ch04/backgrounds/ch04_bg_woolsthorpe_orchard_1665_v01.webp`

### 2. Woolsthorpe 工作室・1665

> Modest Woolsthorpe farmhouse study in 1665: rough pale stone walls, dark oak floor, leaded window toward orchard branches and a pale Moon, plain table with blank manuscript sheets, quill, dividers, ruler, wooden model spheres and string, one candle. Wide 16:9, no people, unfinished private work rather than an alchemist laboratory. No readable equations, completed orbit diagram, modern apparatus, fantasy, logo or watermark.

來源：`backgrounds/ch04_bg_woolsthorpe_study_1665_master_v01.png`
runtime：`public/assets/ch04/backgrounds/ch04_bg_woolsthorpe_study_1665_v01.webp`

### 3. Cambridge・Hooke 書信・1679

> Austere Cambridge scholar's chamber in 1679, mullioned window with rainy winter light, broad oak desk, opened wax-sealed letter with unreadable handwriting, two simple unfinished arrows on a loose sheet, dividers, quills and mathematical folios. Wide 16:9, environment only, intellectual friction and unfinished proof. No readable text, completed inverse-square equation, modern objects, wizard room, fantasy, logo or watermark.

來源：`backgrounds/ch04_bg_cambridge_hooke_letter_1679_master_v01.png`
runtime：`public/assets/ch04/backgrounds/ch04_bg_cambridge_hooke_letter_1679_v01.webp`

### 4. Cambridge・Halley 來訪・1684

> Cambridge rooms in August 1684 before Halley challenges Newton: oak worktable between two plain chairs, observation sheets deliberately face down under a paperweight, blank folded prediction slip, wax seal, dividers and quills. Warm window light crossing a cool room; brisk practical intellectual challenge. No people, readable text, revealed observations, completed answer diagram, modern objects, fantasy, logo or watermark.

來源：`backgrounds/ch04_bg_cambridge_halley_1684_master_v01.png`
runtime：`public/assets/ch04/backgrounds/ch04_bg_cambridge_halley_1684_v01.webp`

### 5. Greenwich 觀測室・1680 年代

> Early Royal Observatory working room at Greenwich in the early 1680s: period-appropriate mural quadrant, long simple refracting telescope, pendulum clock, dated observation papers with unreadable marks, view over Thames haze, small restrained comet through the open shutter. Wide 16:9, cool moonlight and low oil lamp, exacting observational mood. No people, modern dome or telescope, giant disaster comet, readable text, steampunk, logo or watermark.

來源：`backgrounds/ch04_bg_greenwich_observatory_1680s_master_v01.png`
runtime：`public/assets/ch04/backgrounds/ch04_bg_greenwich_observatory_1680s_v01.webp`

### 6. London 印刷室・1687

> Working London printing house in 1687 with wooden common press, type cases, composing sticks, damp proof sheets, costly paper, corrected galleys, contribution slips connected by plain thread to a central blank proof, and a deliberate empty space on the final proof. Wide 16:9, cold window light with restrained oil lamps, pressured but orderly. No people, readable title, names, equations, Victorian machinery, magical book, logo or watermark.

來源：`backgrounds/ch04_bg_london_printshop_1687_master_v01.png`
runtime：`public/assets/ch04/backgrounds/ch04_bg_london_printshop_1687_v01.webp`

### 7. 章末鉛字盒碰撞

> Intimate 1687 print-room table after publication: two shallow wooden trays of lead type have just met at an angle, one displaced slightly and the other farther away, a few scattered lead sorts, two old account slips, closed mathematical volume, pale Moon through imperfect glass. Wide 16:9 low view, quiet unresolved curiosity. No people, arrows, equations, modern billiard balls, dramatic crash, fantasy, logo or watermark.

來源：`backgrounds/ch04_bg_typecase_collision_epilogue_master_v01.png`
runtime：`public/assets/ch04/backgrounds/ch04_bg_typecase_collision_epilogue_v01.webp`

## 人物提示詞

共同底板要求：

> Vertical three-quarter dialogue portrait, head to below waist, full shoulders and arms, generous padding. Painterly photorealistic historical rendering with natural skin and worn fabric. Perfectly flat solid #ff00ff chroma-key background, no shadow, gradient, texture or reflection; do not use magenta in subject. No text, props, logo or watermark.

### 8. Newton・22 歲・1665

> Plausible young Isaac Newton at age 22 before fame: slim pale English university scholar, narrow thoughtful face, high brow, clean shaven, gray-brown alert eyes, natural shoulder-length dark auburn hair without a wig; plain black-brown wool doublet and modest linen collar. Guarded and slightly impatient with premature conclusions, not iconic or heroic.

來源：`characters/ch04_char_newton22_chroma_v01.png` → `characters/ch04_char_newton22_alpha_v02.png`
runtime：`public/assets/ch04/characters/ch04_char_newton22_v01.webp`

### 9. Newton・約 41 歲・1684

> Age the same young-Newton identity to about 41 while preserving facial structure, eyes, nose, mouth and hair color. Slightly leaner mature face, subtle under-eye and mouth lines, a few early gray strands, sober black scholar's coat and narrow white bands, no wig. Controlled, skeptical and defensive about unfinished proof; no elderly iconic portrait or aristocratic glamour.

來源：`characters/ch04_char_newton41_chroma_v01.png` → `characters/ch04_char_newton41_alpha_v02.png`
runtime：`public/assets/ch04/characters/ch04_char_newton41_v01.webp`

### 10. Halley・28 歲・1684

> Plausible Edmond Halley at age 28: lively dark hazel eyes, broad intelligent forehead, youthful rounded jaw, clean shaven, shoulder-length naturally curled dark brown hair; well-kept but travel-worn charcoal-brown coat, dark waistcoat and plain linen cravat. Direct, practical and confident with a restrained half-smile; not deferential, elderly, aristocratic or a sea captain.

來源：`characters/ch04_char_halley28_chroma_v01.png` → `characters/ch04_char_halley28_alpha_v02.png`
runtime：`public/assets/ch04/characters/ch04_char_halley28_v01.webp`

## 技術輸出

- 背景：1920×1080 WebP，quality 82。
- 角色：900×1200 transparent WebP，quality 88、alpha quality 100。
- runtime 十檔合計約 1.4 MB，低於單章 25 MB 與單檔 2 MB 預算。
- 去背 v01 因全域 despill 造成膚色偏綠，保留作失敗紀錄但不進 runtime；runtime 使用保留原色並收邊 1 px 的 alpha v02。
