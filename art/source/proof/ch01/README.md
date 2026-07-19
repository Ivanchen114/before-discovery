# Chapter 1 Art Proof｜生成與審核紀錄

**日期**：2026-07-19  
**工具**：Codex 內建 `image_gen`  
**用途**：寫實歷史插畫 Art Proof；非 runtime 完成資產  
**直接外部影像輸入**：無。青年 Galileo 的年代與外觀約束來自文件及博物館文字資料；後續圖只以本批先前生成圖作內部身份／風格參考。

## 檔案與審核

| 檔案 | 身份／風格參考 | 已知修補 |
|---|---|---|
| `ch01_styleframe_pisa_arcade_v01.png` | 無影像參考，首張風格基準 | 複核塔與迴廊視線；正式版提升至 2560×1440 以上 |
| `ch01_char_galileo_master_v01.png` | Pisa arcade v01 | 補正／側／三分之四；做三表情差分 A/B proof |
| `ch01_char_simplicio_master_v01.png` | 前兩張作風格參考，不沿用 Galileo 身份 | 折扇偏木牌，v02 依正確折扇結構重畫 |
| `ch01_styleframe_debate_hall_v01.png` | 兩角色母版 | 觀眾降複製臉感；證據紙改由 runtime SVG／HTML 疊合 |
| `ch01_styleframe_incline_study_v01.png` | Galileo 母版＋既有風格 | 水鐘、支架先做功能圖再重製；圖上偽字不得進 runtime |

五張早期探索圖均為 1672×941、約 2.0–2.2MB PNG。正式 runtime 需輸出合適尺寸 WebP 並遵守美術規格 v0.2 的單檔預算。

## G1 任務交付

| 類別 | 檔案 |
|---|---|
| 指定 Style Frame | `proof_sf01_study_night_v01.png`、`proof_sf02_workshop_day_v01.png`、`ch01_styleframe_debate_hall_v01.png` |
| 指定角色表情 | `ch01_char_galileo_expressions_v01.png`、`ch01_char_simplicio_expressions_v01.png` |
| 空景與器材 | `ch01_bg_workshop_empty_v01.png`、`ch01_prop_ball_groove_detail_v01.png`、`ch01_prop_water_clock_detail_v01.png`、`ch01_prop_folding_fan_detail_v01.png`、`ch01_prop_manuscript_detail_v01.png` |
| 遊戲畫面合成 | `ch01_composite_workshop_ui_v01.png` |

上述新增圖與 A/B 差分來源的逐字提示詞、工具、seed 狀態、尺寸、放大與人工處理均記於 `PROMPTS_G1_20260719.md`。本檔下方保留五張早期探索圖的逐字提示詞，兩者合併為完整生成帳。

## 最終提示詞

### 1. Pisa arcade Style Frame

```text
Use case: historical-scene
Asset type: 16:9 game environment Style Frame / visual-development key art for Chapter 1 of a narrative science game
Primary request: a realistic historical illustration of the first encounter with the 26-year-old Galileo Galilei in Pisa in 1590
Scene/backdrop: early morning in a University of Pisa stone arcade opening toward a modest street; pale Tuscan limestone, worn terracotta, a distant partial glimpse of the leaning bell tower through morning haze; restrained period detail, no grand fantasy architecture
Subject: young Galileo, age 26, intelligent, restless and underpaid rather than heroic; a lean Tuscan scholar in a modest dark brown-black late-sixteenth-century doublet and academic over-gown with a clean white collar, worn leather shoes, medium brown wavy hair, short neatly trimmed beard and mustache, distinctive small mole below his left eye; he has just collided with the unseen traveler and is staring intensely at two unequal lead balls on the stone floor, listening to the nearly simultaneous impacts
Style/medium: realistic historical illustration, painterly but anatomically convincing, grounded material realism, subtle influence of late-sixteenth-century Italian oil painting without imitating any named artist; production-quality visual development for a serious educational game, not photoreal photography
Composition/framing: cinematic wide 16:9, eye-level three-quarter view, Galileo slightly off center, both lead balls clearly visible in foreground, arcade creates depth; preserve calm negative space in the upper-left and lower-right for future HTML UI overlays, but do not draw any UI
Lighting/mood: cool pearly dawn entering the arcade, one warm reflected strip from the street, intellectually charged and curious rather than epic
Color palette: limestone gray, umber, muted brick, aged paper cream, restrained cold blue morning accents
Materials/textures: real worn wool, linen collar, oxidized dull lead, scuffed stone, imperfect plaster; believable hands and facial anatomy
Historical constraints: Pisa, 1590; Galileo must look 26, not the famous elderly white-bearded Galileo; no telescope, no modern laboratory glassware, no Victorian clothing, no Baroque palace interiors, no fantasy steampunk devices
Constraints: no text, no captions, no logos, no watermark, no border, no embedded game UI; only one visible human figure; the traveler remains outside the frame; both lead balls must be clearly different sizes; period-accurate and plausible
```

### 2. Galileo character master

```text
Use case: historical-scene
Asset type: Chapter 1 game character master / Art Proof identity sheet
Input images: Image 1 is the locked style and identity reference for the young Galileo; preserve his face, age, mole, hair, build, clothing materials, palette, and painterly realism
Primary request: create a production-ready character master sheet for Galileo Galilei at age 26 in Pisa, 1590
Subject: the same young Galileo from Image 1, lean Tuscan scholar, medium brown wavy hair, short trimmed beard and mustache, small characteristic mole below his left eye, alert intelligent eyes, modest dark brown-black late-sixteenth-century scholar clothing and academic over-gown, white linen collar, worn leather shoes
Composition/framing: one coherent landscape character sheet on a plain warm gray-beige studio backdrop; a large full-body neutral three-quarter standing pose showing the entire silhouette and both shoes, plus three smaller shoulder-up expression studies: intense curiosity, dry amused skepticism, exhausted frustration; no panel borders and no text
Style/medium: exact same realistic historical illustration style as Image 1, anatomically convincing painterly oil texture, game visual-development sheet rather than a modern photo
Lighting/mood: soft neutral studio light preserving garment and face detail
Historical constraints: age 26, 1590 Tuscan scholar; no elderly white beard, no telescope, no seventeenth-century ruff, no modern tailoring, no fantasy accessories
Identity invariants: keep the same facial proportions, nose, brow, eye color, hairline, beard pattern, mole placement, lean body type, costume construction, and color palette across every pose
Constraints: no text, no labels, no logos, no watermark, no cropped feet, no extra people, no duplicate limbs, natural hands; keep generous clean margins around every pose
```

### 3. Simplicio character master

```text
Use case: historical-scene
Asset type: Chapter 1 game character master / Art Proof identity sheet
Input images: the two recent generated images are style, rendering, costume-era, and palette references only; do not reuse Galileo's face or body for this new character
Primary request: create a production-ready character master sheet for Professor Simplicio, age 58, a fictional composite Aristotelian scholar at the University of Pisa in 1590
Subject: an intelligent, formidable Tuscan professor who has taught for thirty years; broad but not obese, upright practiced posture, lined thoughtful face, dark gray hair receding at the temples, carefully groomed gray-black mustache and short beard, controlled observant eyes; he must look learned and reasonable, never buffoonish or evil; formal black late-sixteenth-century university robe over a deep charcoal doublet, crisp modest white scholar collar, well-kept leather shoes; a closed folding hand fan is his habitual debate prop
Composition/framing: one coherent landscape character sheet on a plain warm gray-beige studio backdrop; a large full-body neutral three-quarter standing pose showing the entire silhouette and both shoes, holding the closed fan calmly, plus three smaller shoulder-up expression studies: courteous senior confidence, sharp skeptical scrutiny, and a restrained moment of intellectual shock with dignity intact; no panel borders and no text
Style/medium: same realistic historical illustration style and painterly material realism as the references; anatomically convincing game visual development, not a modern photo
Lighting/mood: soft neutral studio light, restrained authority
Historical constraints: Pisa, 1590; period-plausible Tuscan academic dress; no eighteenth-century wig, no Victorian suit, no cardinal costume, no oversized theatrical ruff, no fantasy villain styling
Character constraints: visually distinct from young Galileo in age, face, build, grooming, and silhouette; he is a worthy opponent, not a caricature
Identity invariants: keep the same facial proportions, hairline, beard pattern, body type, robe construction, collar, fan, and palette across every pose
Constraints: no text, no labels, no logos, no watermark, no cropped feet, no extra people, no duplicate limbs, natural hands, fan structurally plausible, generous clean margins
```

### 4. Debate hall Style Frame

```text
Use case: historical-scene
Asset type: 16:9 Chapter 1 debate-hall Style Frame for a narrative science game
Input images: Image 1 is the locked young Galileo identity/costume reference; Image 2 is the locked Professor Simplicio identity/costume reference. Preserve both identities, ages, faces, builds, clothing construction, and painterly style exactly
Primary request: a tense public academic disputation at the University of Pisa in 1590, showing evidence confronting inherited authority
Scene/backdrop: a plausible late-sixteenth-century university lecture hall with worn plaster, dark timber benches, stone floor, tall windows, a restrained raised teaching dais, parchment notes and simple demonstration objects; no modern blackboard, no electric light, no theatrical fantasy hall
Subjects: Professor Simplicio, age 58, stands composed at the teaching table, one hand resting beside a structurally plausible closed folding fan, scrutinizing a sheet of numerical evidence; young Galileo, age 26, stands opposite with controlled intensity, one hand indicating four columns of hand-drawn marks on the evidence without readable words; a small audience of period-dressed university students watches with divided attention, no one cheering
Style/medium: same realistic historical illustration and grounded painterly oil texture as the references, production-quality game visual development, not photoreal photography
Composition/framing: cinematic wide 16:9 at seated audience eye level; Simplicio and Galileo form a strong visual opposition across the center table, their faces clearly readable; preserve a clean dark lower band and modest upper-left negative space for future HTML debate UI, but draw no UI
Lighting/mood: cool daylight from tall windows meets warm candle and reflected wood tones; intellectual tension, restraint, no melodramatic victory pose
Color palette: charcoal academic robes, aged parchment, dark walnut, limestone gray, muted Tuscan amber
Historical constraints: Pisa, 1590; correct late-sixteenth-century academic clothing; no telescope, no powdered wigs, no Victorian clothing, no modern classroom items, no fantasy machinery
Identity invariants: Galileo must match Image 1 and look 26; Simplicio must match Image 2 and look 58; Simplicio remains dignified and intelligent, never villainous
Constraints: no readable text, no captions, no logos, no watermark, no embedded UI; natural hands; plausible folding fan; evidence paper may show only abstract ink lines and numbers too small to read; audience secondary and subdued
```

### 5. Inclined-plane study Style Frame

```text
Use case: historical-scene
Asset type: 16:9 Chapter 1 inclined-plane experiment Style Frame for a narrative science game
Input images: use the recent Galileo character sheet and debate image as locked identity/costume references for young Galileo; use all recent images as the locked painterly style, material, and palette reference
Primary request: Galileo and the unseen traveler conducting a careful inclined-plane experiment in his cramped Pisa study at night, 1590
Scene/backdrop: a modest overfilled scholar's room with rough plaster, dark timber, shelves of folded papers and a few books, a long straight wooden grooved ramp spanning sturdy supports, small adjustable wedges visibly changing its incline, two copper balls of different sizes, a simple hanging water vessel with a narrow outlet collecting into a small cup, hand-marked measurement strips, parchment run records; every instrument must look hand-built and mechanically plausible
Subject: the same 26-year-old Galileo, sleeves carefully secured, leaning near the ramp to release one copper ball with focused restraint; his face, hair, mole, build and costume must match the locked reference; only Galileo is visible, the traveler remains outside frame
Style/medium: realistic historical illustration, grounded painterly oil texture and production-quality game visual development matching the references; not a modern photo
Composition/framing: cinematic wide 16:9, slightly elevated three-quarter view so the entire experimental chain is readable from ramp start to collection cup and notes; the ramp, ball, water timer and result parchment form a clear visual path; preserve a calm vertical area on the left and a clean lower-right region for future HTML experiment controls and numeric UI, but draw no UI
Lighting/mood: warm candlelight concentrated on the apparatus and Galileo's hands, cool moonlit shadows at the window; patient discovery after repeated failure, intimate rather than magical
Color palette: aged paper cream, dark walnut, oxidized copper, charcoal wool, warm amber candlelight, cool blue-gray night
Historical and scientific constraints: Pisa, 1590; no telescope, no pendulum clock, no modern glass laboratory equipment, no stopwatch, no printed graph paper, no electric light; water timer is a simple period-plausible vessel and collection cup, not a modern faucet; ramp remains shallow enough to visibly slow the ball
Identity invariants: Galileo must exactly match the young reference and look 26
Constraints: no readable text, no captions, no logos, no watermark, no embedded UI, no fantasy glow, no extra people, natural hands, apparatus geometry coherent, copper balls clearly different sizes, no impossible floating parts
```
