# 第一章正式美術 Batch 02｜最終提示詞紀錄（2026-07-19）

**工具**：Codex 內建 image generation。  
**共通風格**：P-5 寫實歷史插畫；胡桃木／舊紙／炭黑／琥珀；寫實解剖與克制油畫筆觸；不模仿特定在世藝術家。  
**共通背景規則**：16:9、`object-fit: cover` 中央 80% 安全、底部約 27% 對話安全區、空景、不燒文字／UI。  
**共通透明角色規則**：均勻 `#00FF00` 綠幕、無投影／漸層，之後 soft matte＋despill＋alpha QA；程式永不鏡像。

四套主角表情提示詞見 `README.md` P1-04；以下記錄本批其他正式生成。

## 1. 旅人剪影 v02

```text
Use case: precise-object-edit
Asset type: revised production dialogue silhouette for the gender-neutral player-character “Traveler”.
Input image: v01 edit target for palette, painterly material, crop, warm rim light, and flat green key only.
Replace the ominous hooded frontal figure with a humane ordinary late-16th-century traveler seen from a three-quarter rear view. Upper back occupies lower-left; head turns gently screen-right but face is entirely hidden. No hood. Cover hair with a plain close-fitting dark wool travel cap; simple dark cloak and modest raised collar. Slender-to-average, deliberately gender-neutral: no beard, hair, skin, chest shape, hips, jaw profile, or gender cue. Quiet curiosity and companionship, not secrecy, danger, magic, grief, or menace. Lighten the silhouette enough for fabric folds to read at 170–220 CSS px.
Perfectly flat uniform #00FF00 background. Exactly one isolated chest-up 3:4 bust; no assassin/monk/reaper/witch appearance, mask, weapon, book, text, UI, border, watermark, or concrete face.
```

## 2. 助手兩表情

```text
Use case: identity-preserve
Create exactly two chest-up portraits of the same 22-year-old Italian male university assistant in Pisa, circa 1590; new identity, not Galileo or Simplicio. Clean-shaven, short wavy dark-brown hair, attentive eyes, modest lean face, plain inexpensive charcoal academic clothing and small off-white linen collar. Sincere student witness, not comic relief. Body left, gaze screen-right. Portrait 1: dutiful earnest confirmation. Portrait 2: slight uncertainty after realizing observation may have been interpreted too quickly. Equal scale, no hands.
Perfectly flat uniform #00FF00 background. No prop, hat, beard, text, label, UI, border, watermark, modern/fantasy costume, caricature, or villain expression.
```

## 3. 主持兩表情

```text
Use case: identity-preserve
Create exactly two chest-up portraits of the same 66-year-old Italian university elder presiding over a Padua public debate in 1604; new identity, not Simplicio. Broad clean-shaven face, sparse silver hair under modest black square academic cap, calm grey eyes, formal black gown and restrained off-white collar. Institutionally neutral and ceremonious, not judge or priest. Body left, gaze screen-right. Portrait 1: formal calm announcement. Portrait 2: firm fair adjournment, lips pressed and one brow slightly lowered. Equal scale, no hands.
Perfectly flat uniform #00FF00 background. No beard, mitre, religious vestment, wig, gavel, prop, text, UI, border, watermark, modern/fantasy costume, caricature, or villain expression.
```

## 4. 攤開筆記本

```text
Use case: precise-object-edit
Create a top-down fully opened late-16th-century travel notebook filling a clean 16:9 frame. Two facing warm ivory handmade-paper pages, believable narrow gutter, deckled edges, thin dark worn leather cover, subtle stitching, one muted ribbon bookmark, restrained age stains. Notebook occupies about 92% width and 88% height; broad uninterrupted writing-safe area on both pages and at least 8% internal margin. Dark walnut-black surround. Diffuse museum-studio light; subtle texture only.
No writing, letters, numbers, lines, diagrams, stains in text columns, headings, tabs, UI, hands, people, quill, inkpot, spectacles, desk clutter, loose paper, crest, watermark, or pre-drawn panels. HTML supplies all content.
```

## 5. 比薩書房雨夜

```text
Use case: historical-scene
Empty modest late-16th-century Pisa scholar's study at night: worn lime plaster, dark beams, leaded window with faint blue rain, rear-left walnut desk, a few closed books, blank parchment, simple chair, candle and oil lamp, two dull lead balls on a side shelf. Large clear central stage; important furniture in upper/side thirds; bottom 27% calm and dark. Cool night plus warm candle pool; investigative lived-in mood.
No people, telescope, globe, luxury furnishing, modern object, readable writing, labeled map, UI, border, watermark, or fantasy light.
```

## 6. 比薩書房日景（雨夜版精確光線編修）

```text
Use case: lighting-weather
Change only time, weather, and lighting from rainy night to quiet overcast morning. Preserve exact geometry, camera, furniture, objects, center stage, and bottom 27%. Pale cool morning beyond window, no rain; extinguish candles and oil lamp; restrained daylight and weak warm bounce. No new prop, moved furniture, bright noon beam, crop, rotation, redesign, UI, or watermark.
```

## 7. 舊城牆試驗地

```text
Use case: historical-scene
Empty quiet test ground inside an old medieval Pisa city wall during clear late morning. Long weathered brick/stone wall runs diagonally at rear with one simple arched gate, shallow buttresses, worn lime plaster, packed-earth-and-stone yard, one low bench and a few baskets far from center. Open mid-ground for characters and props; bottom 27% quiet.
No people, guards, animals, balls, siege weapon, banner, text, UI, border, watermark, fantasy fortress, or battle damage.
```

## 8. 比薩鐘樓頂黎明

```text
Use case: historical-scene
Empty upper belfry arcade of Pisa's leaning tower before sunrise. Historically plausible pale Pisan Romanesque marble columns and round arches, low parapet, part of one large bronze bell at far left, oblique cathedral-square rooftops far below. Slight lean perceptible but not exaggerated. Human-height 16:9 camera, open center/right, bottom 27% cool uncluttered stone floor. Cold blue-grey predawn with restrained amber horizon.
No people, balls, apparatus, banners, clocks, battlements, fantasy tower, modern rail, fisheye, text, UI, border, or watermark.
```

## 9. 阿諾河岸黃昏

```text
Use case: historical-scene
Empty riverside walking place along the Arno in late-16th-century Pisa at quiet sunset. Worn stone embankment and broad path foreground, slow river middle distance, simple old bridge and ochre houses receding behind. One low sitting block and several pebbles; clear stage for two characters. Muted amber-to-blue dusk, weary not romantic; bottom 27% dark and low-detail.
No people, boats, animals, modern embankment, sign, text, UI, border, watermark, tourist skyline, or fantasy sunset.
```

## 10. 帕多瓦運河黃昏

```text
Use case: historical-scene
Empty intimate canal path in Padua, 1604, at blue-amber dusk. Narrow dark canal, old low single-arch stone bridge casting a clear shadow, weathered brick/plaster university buildings, broad foreground stone path with loose pebbles, clear patch of water for later ripple/projectile overlay. Open center-left stage; bottom 27% dark and quiet. Thoughtful forward-looking calm.
No people, boats, animals, thrown stone, arc, ripple, modern rail/light, sign, text, UI, border, watermark, Venice gondola, or tourist scene.
```

## 11. 月球亞平寧末頁

```text
Use case: scientific-educational
Wide lunar tableau: grey dusty plain under absolutely black sky, low rugged lunar Apennine ridges, one Apollo-era astronaut in left third with reflective black-gold visor. Arms extended at equal height; one glove holds a small geological hammer and the other a pale feather, frozen immediately before simultaneous release. Tiny restrained Earth high right; subtle footprints and one small equipment case. 16:9; all critical objects central-safe; bottom 27% calm. Scientific wonder, not propaganda; realistic historical illustration.
Exactly one astronaut; no flag, logo, patch, readable text, caption, UI, border, watermark, alien/fantasy element, stars, extra moon, or oversized Earth.
```

## 12. 帕多瓦工作室深夜（正式日景精確光線編修）

```text
Use case: lighting-weather
Change only time and lighting to deep night. Preserve exact workshop geometry and all approved apparatus. Dark blue-black windows; two small candles and one oil lamp on existing rear work surfaces; restrained amber glints on copper balls and balance, most of room cool and quiet. Mood: late work, fatigue, anticipation of old colleague's letter.
No people, letter, new/moved apparatus, modern light, spotlight, readable text, UI, border, watermark, crop, or redesign.
```

## 13. 大講堂觀眾版（空底精確編修）

```text
Use case: precise-object-edit
Preserve exact locked lecture-hall camera, architecture, windows, benches, central table, palette, lighting, perspective, and bottom safe region. Add about twenty late-Renaissance male students and several older faculty only in tiered benches, background-scale and subdued, watching the empty debate area. Keep front examination table completely empty and stage space clear for layered Galileo, Simplicio, and host.
No main characters, standing foreground figure, modern clothing, applause, caricature, books/papers on central table, text, UI, border, watermark, moved furniture, crop, or redesign.
```

## 14. 比薩迴廊午後（晨景精確光線編修）

```text
Use case: lighting-weather
Change only locked Pisa arcade sunlight from morning to restrained afternoon. Preserve empty architecture, tower glimpse, camera, objects, center stage, and bottom 27%. Muted late-afternoon amber and slightly longer arch shadows; shaded arcade stays neutral for layered characters.
No people, students, props, balls, new furniture, dramatic sunset, text, UI, border, watermark, crop, rotation, or redesign.
```

## 15. 舊同事來信 S1

```text
Use case: historical-scene
Wide museum-catalog still life of one late-Renaissance folded correspondence letter on a plain walnut tabletop. One opened cream handmade-paper sheet with believable folds, small folded outer wrapper beneath, broken dark red-brown blank wax seal, muted cord. Main paper almost entirely blank for live HTML. 8:5, broad writing-safe area, warm candle edge and readable paper.
No readable/pseudo writing, numerals, address, stamp, quill, inkpot, spectacles, hands, people, map, crest, UI, caption, frame, or watermark.
```

## 16. 共用證據卡底

```text
Use case: ui-mockup
One empty straight-on 8:5 evidence card. Warm ivory handmade paper inside thin worn dark desaturated blue-grey leather/wood frame. Left 58% completely blank text field, right 34% completely blank recessed illustration field, thin vertical embossed separator, one small blank circular seal recess lower-left. Card fills 94%; even margins; neutral diffuse light and very restrained texture.
No text, glyph, pseudo-writing, content lines, diagram, icon, label, tab, ribbon, ornament, person, prop, shadow across fields, UI button, external border, or watermark.
```

## 後製

- 綠幕角色：標準 helper `--auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill --edge-contract 1`。
- 角色 source master：Lanczos3 放大至長邊 2400；runtime WebP 高 720、quality 86、alphaQuality 95。
- 背景 source master：2560×1440；runtime 1920×1080 WebP quality 82。
- 卡／器材 runtime：800×500 WebP quality 86。
