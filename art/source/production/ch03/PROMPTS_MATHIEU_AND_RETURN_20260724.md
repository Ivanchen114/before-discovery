# CH3 馬蒂厄與返港場景生成紀錄

**日期**：2026-07-24
**生成方式**：Codex 內建 imagegen
**用途**：CH3-CR-014「艦長木籌約定＋獨立船員馬蒂厄」

## 1. 馬蒂厄對話角色圖

### 參考圖

- `art/source/production/ch03/characters/ch03_char_captain50_alpha_v01.png`
- `art/source/production/ch03/characters/ch03_char_etienne17_alpha_v01.png`

### 最終提示詞

```text
Use case: historical-scene
Asset type: transparent-ready dialogue character portrait for Chapter 3 of a historical physics game
Input images: Image 1 is the painterly realism, period clothing, lighting, and three-quarter dialogue-portrait style reference for the 50-year-old Marseille captain; Image 2 is the same Chapter 3 portrait style, framing, and working-sailor material reference for the 17-year-old Etienne. Do not copy either face.
Primary request: create Mathieu, a distinct 32-year-old trusted mate on a modest Marseille experiment vessel in 1640, who operates the release latch, keeps drum-beat and landmark records, and remains neutral about the scientific wager
Subject: lean, weathered Mediterranean French sailor; early thirties; wavy dark hair tied loosely at the nape; short practical beard; alert brown eyes; calm, observant, unsmiling expression; rough cream linen shirt with rolled sleeves, worn dark navy sleeveless working vest, brown belt and trousers; one hand holds a plain wooden record board close to his body, the other holds a short wooden drum mallet; no hat, no jewelry, no weapon
Style/medium: historically grounded painterly realism matching the two Chapter 3 reference portraits; natural skin texture, worn cloth, restrained cinematic detail
Composition/framing: vertical 3:4 dialogue portrait, roughly knees or upper thighs upward, complete head and hands visible with generous padding; body and gaze turned slightly toward viewer-right so he can occupy the left dialogue slot; strong readable silhouette
Lighting/mood: warm Marseille daylight, practical and trustworthy, not heroic
Background: perfectly flat solid #00ff00 chroma-key background for removal, one uniform color with no shadows, gradients, texture, reflections, floor plane, or lighting variation
Constraints: period-appropriate 1640 working sailor; clearly older than Etienne and younger than the captain; distinct facial identity; no text, no symbols, no watermark; do not use #00ff00 anywhere in the subject; crisp separated edges; no cast shadow, contact shadow, or reflection
Avoid: aristocratic clothing, scholar robes, military uniform, pirate costume, fantasy accessories, dramatic action pose, smile, extra people, ship background, cropped head, cropped hands
```

### 輸出

- Chroma 原圖：`art/source/production/ch03/characters/ch03_char_mathieu32_chroma_v01.png`
- 去背工作檔：`art/source/production/ch03/characters/ch03_char_mathieu32_alpha_raw_v01.png`
- 900×1200 透明母版：`art/source/production/ch03/characters/ch03_char_mathieu32_alpha_v01.png`
- Runtime WebP：`public/assets/ch03/characters/ch03_char_mathieu32_v02.webp`

去背使用 imagegen skill 的 `remove_chroma_key.py`，以邊界自動取樣、soft matte、despill 與 1 px edge contract 處理。Runtime 版另裁去腿部空間，讓對話鏡頭的頭身比例與艦長一致；完整手腳仍保留在透明母版。

## 2. C2-2B「船還沒繫牢」返港背景

### 參考圖

- `public/assets/ch03/experiments/ch03_lab_g1_mast_steady_v01.webp`
- `public/assets/ch03/backgrounds/ch03_bg_marseille_harbor_dawn_v01.webp`

### 最終提示詞

```text
Use case: historical-scene
Asset type: 16:9 narrative game background for Chapter 3, scene immediately after the ship's speed-change experiments
Input images: Image 1 is the exact Chapter 3 experiment vessel, rigging, wood materials, and painterly realism reference; Image 2 is the Marseille harbor architecture, quay, lighting language, and atmosphere reference
Primary request: the same modest 1640 Marseille experiment vessel has just returned and is being tied alongside a stone quay; before it is fully secured, dockworkers have gathered and are already repeating two conflicting versions of the falling-stone result
Scene/backdrop: Marseille harbor, late afternoon after a day of experiments; stone quay, mooring posts, warehouses and hills; the vessel close enough that its central mast and experiment area are recognizable
Subject/action: several period-appropriate dockworkers in small separated groups near the gangplank; one group gestures toward the stern as if saying the first stone fell behind, another gestures toward the mast foot as if saying later stones landed there; their argument is visible through body language only, not theatrical shouting; a sailor is still handling the mooring line so the ship is visibly not yet fully tied
Style/medium: historically grounded painterly realism matching existing Chapter 3 game backgrounds, restrained cinematic detail, natural cloth and timber textures
Composition/framing: 16:9 wide establishing background, eye-level three-quarter view from the quay; full relationship between ship, gangplank, and arguing dockworkers readable; keep the center and lower third moderately uncluttered for game dialogue UI and character busts; crowd remains environmental rather than becoming named portraits
Lighting/mood: warm late-afternoon Mediterranean light, busy and credible, an ordinary rumor beginning rather than a festival
Constraints: period-appropriate 1640 Marseille clothing, vessel, quay, tools, and architecture; same visual world as references; no text, no signs, no diagrams, no falling-stone trajectory, no arrows, no watermark, no modern objects
Avoid: giant crowd, public demonstration stage, celebration, riot, pirate imagery, uniforms, dramatic combat gestures, cropped mast, modern harbor equipment, fantasy ship
```

### 輸出

- PNG 母版：`art/source/production/ch03/backgrounds/ch03_bg_return_to_quay_master_v01.png`
- 1920×1080 Runtime WebP：`public/assets/ch03/backgrounds/ch03_bg_return_to_quay_v01.webp`
