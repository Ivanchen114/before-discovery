# 《發現之前》第一章正式美術量產帳

**狀態**：量產中
**解凍依據**：ADR-009；Sol 第二次 verification pass（commit `c688f52`）
**凍結內容基線**：劇本 v0.2.2、第一章功能規格 v0.1.1
**風格基線**：P-5 寫實歷史插畫感、胡桃木／舊紙／炭黑／琥珀色盤、ART-ADR-001 混合差分制

本目錄只收第一章正式來源圖；G1 試作仍留在 `art/source/proof/ch01/`，不得混充 runtime 完成品。所有可讀文字、數字與 UI 由 HTML／SVG 產生，不燒入點陣圖。

## 批次順序

| 批次 | 內容 | 原因 | 狀態 |
|---|---|---|---|
| P0 | 實驗器材功能圖：水鐘、斜面、球、支架、紙／水對照 | 先鎖機械因果，避免場景圖把錯器材畫死 | 進行中（2 張功能母版完成） |
| P1 | 角色正式母版：伽利略 26／39、辛普里奧 58／72；姿勢與表情差分 | 鎖身份後才能量產同框場景 | 對話層完成（21 張透明 runtime）；大型動作立繪待高潮演出接口 |
| P2 | 共用背景幾何底圖與光線狀態 | 以共用底圖控制跨場景一致與返工成本 | 第一章 scene map 所需背景與日／夜狀態完成，待 Claude 掛路徑 |
| P3 | 證據卡、筆記、信件、評注本與辯論桌道具 | 與 HTML 疊字接口一起驗收 | 共用卡面、筆記、S1/S2、三器材 runtime 完成；E1–E5 圖解交 HTML/SVG |
| P4 | 高塔、判定、月球末頁等一次性章節插畫 | 最後製作，避免前段規格變動造成重工 | 高塔背景與月球末頁完成；掉落／支柱／拋體仍依政策用程式動畫 |
| P5 | runtime WebP／透明差分／整合畫面與可讀性 QA | 由 Claude 整合，Sol 審核 | 美術檔案 QA 完成（本批全部 runtime 約 3.98 MiB）；整合實機驗收待 Claude／總監 |

## 影片與動畫政策

第一章不製作預錄過場影片。需要動態的部分（落球、斜面滾球、水流、證據卡、支柱裂解、拋體弧線、月球淡入）採程式動畫；美術交付底圖、分層角色、器材狀態與 FX 素材。這可保留鍵盤操作、降低動態與文字放大能力，也避免影片把 UI 與字體燒死。

## 正式資產紀錄

### P0-01｜水鐘功能圖 v02

- 檔案：`props/ch01_prop_water_clock_functional_v02.png`
- 工具：Codex 內建 image generation；以 proof v01 作 edit target
- 狀態：**功能構圖通過，待場景比例與 runtime 衍生檔**
- 修正重點：刪除 proof v01 的大型接水桶、裝飾性管路與不清楚的流程；改為「高處大容器底部細管 → 細水流 → 小收集杯 → 天平稱重」，讓學生一眼能讀懂操作鏈。
- 史料依據：1638 年《關於兩門新科學的談話與數學證明》所述，高處大水器底部焊接細管，下降期間以小容器收水，之後精密稱重比較時間比例。現存重建只能作形制參考，遊戲仍標為教學代理。
- 參考：[Rice University Galileo Project：Inclined Plane Experiment](https://galileo.library.rice.edu/lib/student_work/experiment95/inclined_plane.html)、[University of Oklahoma：Inclined plane instrument](https://galileo.ou.edu/exhibits/inclined-plane-instrument.html)

最終提示詞：

```text
Use case: precise-object-edit
Asset type: production functional prop sheet for a historical educational game, Chapter 1
Primary request: Redesign the supplied ornate water-clock setup into a simple, mechanically legible reconstruction of the timing apparatus described for Galileo's inclined-plane experiment. Preserve the realistic historical oil-illustration rendering, warm muted walnut/brass/cream palette, plain parchment-colored studio backdrop, wide catalog composition, and high material detail.
Required apparatus: one large plain elevated water vessel on a sturdy rough wooden stand; from the BOTTOM of the vessel a short narrow metal pipe produces a thin vertical jet; directly below is one small removable collecting cup or glass; beside it is a compact accurate two-pan balance with a few small weights, used after each run. Show the flow path and relative scale so a student instantly understands vessel → thin jet → collecting cup → weighing. The collecting cup must be small enough to lift onto the balance. The apparatus must look hand-built and plausible for a late-16th/early-17th-century workshop.
Composition/framing: three-quarter view, all parts fully visible and separated, generous empty margins, no people, no UI, no labels.
Constraints: exactly one elevated vessel, one bottom outlet, one thin water jet, one small collecting cup, one balance; no large catch bucket, no second reservoir, no modern valve, no tubing, no glass laboratory beaker, no ornate clockwork, no readable text or numbers, no watermark. Function over decoration; this is an educational game asset, not fantasy machinery.
```

### P0-02｜可調斜面功能圖 v02

- 檔案：`props/ch01_prop_incline_functional_v02.png`
- 工具：Codex 內建 image generation；以 proof 球槽 v01 與 P0-01 作風格參考
- 狀態：**功能構圖通過，待場景比例與 runtime 衍生檔**
- 修正重點：proof v01 是不可調角度的短實心楔形坡，無法支援遊戲的緩／中／陡三傾角。正式圖改為長直木板、淺半圓槽、淡色襯紙、獨立腳架、三塊墊高楔、大小銅球與末端黃銅響片。
- 史料依據：伽利略描述長約十二肘、寬半肘、厚三指的木板，沿邊開一指寬直槽並以羊皮紙使之平滑；遊戲的三塊楔與可調腳架是把「傾角可變」轉成可讀操作的教學代理。

最終提示詞：

```text
Use case: precise-object-edit
Asset type: production functional prop sheet for a historical educational game, Chapter 1
Primary request: Replace the supplied short solid wedge ramp with a mechanically legible reconstruction of Galileo's inclined-plane apparatus while preserving the same realistic historical oil-illustration style, warm walnut/brass/cream palette, catalog clarity, and plain parchment-colored backdrop.
Required apparatus: one LONG, straight, narrow wooden plank with a shallow semicircular groove running its full length, about one finger wide; the groove is smoothly finished and visibly lined with pale parchment-like material. The plank is separate from its supports, not carved as a triangular wedge. Show it raised at a gentle angle on two sturdy workshop trestles plus a set of three simple wooden wedge blocks that clearly permit low, medium, and steeper inclinations. Include two loose bronze balls of visibly different size and one small brass stop plate at the lower end that the ball can strike to make a clear sound.
Composition/framing: wide three-quarter museum-catalog view, entire long plank and every support fully visible, supports structurally plausible, parts separated enough for students to understand their function, generous empty margins, no people, no UI, no labels.
Constraints: no integrated solid wedge ramp; no steep slide; no modern screws, bearings, rails, measurement tape, plastic, steel tripod, or laboratory furniture; no readable text or numbers; no watermark. The channel must be a shallow groove, not two high guard rails. Function and adjustable tilt must be instantly readable.
```

### P1-01｜伽利略 26／39 歲年齡連續母版 v02

- 檔案：`characters/ch01_char_galileo_age_master_v02.png`
- 工具：Codex 內建 image generation；以 G1 伽利略 master v01 作 exact identity anchor
- 狀態：**身份與年齡連續性通過；正式場景只引用人物，不引用圖中的斜面外形**
- QA：26 歲與 39 歲保持同一窄臉、捲髮、短鬍與左眼下特徵痣；39 歲只增加眼紋、疲態與極少鬢角灰，不老化成經典晚年伽利略。右側木板是姿勢支撐物，並非 P0-02 已鎖定的正式斜面。

最終提示詞：

```text
Use case: identity-preserve
Asset type: production age-continuity character master for a historical narrative game
Input images: Image 1 is the exact Galileo identity, costume, rendering style, and young-age anchor.
Primary request: Create a clean age-continuity master board showing the SAME Galileo identity at age 26 in Pisa (1590) and age 39 in Padua (1603). Preserve Image 1's exact narrow face, dark alert eyes, curly dark hair, short beard, distinctive small mole below the left eye, lean build, realistic late-Renaissance clothing, and restrained oil-illustration rendering.
Age 26: closely preserve the original young full-body identity; restless, slightly underpaid professor; entirely dark curls and beard; black worn scholar's doublet, robe, white linen collar; holding one large and one small dull lead ball at waist height.
Age 39: unmistakably the same man thirteen years later, not a different actor and not elderly; slightly deeper forehead and eye lines, a few restrained silver strands only at the temples, beard still mostly dark, posture more assured but visibly tired; better-kept Padua scholar's black clothing with rolled working sleeves; one hand resting on the edge of a long grooved wooden incline, the other holding a small bronze ball.
Composition/framing: wide production identity board on a plain warm pale parchment background; two full-body figures head-to-toe, age 26 on the left and age 39 on the right, equal scale and matching three-quarter camera angle; above or between them include exactly two matching close busts, one per age, for facial comparison. Generous separation and clean margins. No labels.
Lighting/mood: soft neutral studio light, dignified and human, no theatrical spotlight.
Constraints: exactly four depictions total (two full-body, two bust); same identity across all; age 39 must look 39, not 60; anatomically correct hands; historically plausible late-16th/early-17th-century Italian academic clothing; no telescope, no modern objects, no readable text, no numbers, no watermark, no green screen, no frame borders.
```

### P1-02｜辛普里奧 58／72 歲年齡連續母版 v03

- 檔案：`characters/ch01_char_simplicio_age_master_v03.png`
- 工具：Codex 內建 image generation；以書版 master v02 與評注本道具作 exact anchors
- 狀態：**身份、年齡、服裝與評注本道具連續性通過**
- QA：72 歲版增加銀髮、深紋與手部年齡，仍維持挺直背影與威嚴；沒有丑角化、反派化或病弱化。兩個年齡均不出現摺扇。

最終提示詞：

```text
Use case: identity-preserve
Asset type: production age-continuity character master for a historical narrative game
Input images: Image 1 is the exact Simplicio identity, costume, rendering style, and age-58 anchor. Image 2 is the exact worn Aristotle Physics commentary prop anchor.
Primary request: Create a clean age-continuity master board showing the SAME dignified Italian university professor at age 58 in Pisa (1590) and age 72 in Padua (1604). Preserve Image 1's exact deep-set stern eyes, strong nose, curly dark-grey hair, neatly trimmed grey beard, upright proud bearing, black late-Renaissance academic gown, white linen collar, realistic anatomy, and restrained historical oil-illustration rendering.
Age 58: closely preserve the original full-body identity; powerful and composed, hair and beard mixed dark grey and silver; the worn Physics commentary tucked securely under one forearm against his chest, with the free hand relaxed as if about to address students.
Age 72: unmistakably the same man fourteen years later, not a different actor and not frail; deeper forehead, eye, and cheek lines, hair and beard predominantly silver-grey, slightly leaner face and hands, but back still straight and gaze formidable. The same commentary volume is now more worn and visibly thicker with additional muted ribbon bookmarks; he holds it in the crook of one arm while the other hand rests firmly on the closed cover.
Composition/framing: wide production identity board on a plain warm pale parchment background; two full-body figures head-to-toe, age 58 on the left and age 72 on the right, equal scale and matching three-quarter camera angle; above or between them include exactly two matching close busts, one per age, for facial comparison. Generous separation and clean margins. No labels.
Lighting/mood: soft neutral studio light; respected opponent, never villainous, comic, defeated, or feeble.
Constraints: exactly four depictions total (two full-body, two bust); same identity across all; anatomically correct hands; one historically plausible Physics commentary per full-body figure; no fan, no sceptre, no modern objects, no readable text, no numbers, no watermark, no green screen, no frame borders.
```

### P1-03｜共用 runtime 肖像 v01

- 檔案：`public/assets/ch01/portraits/portrait_galileo.webp`、`portrait_simplicio.webp`
- 方式：從正式年齡母版的 39 歲伽利略與 72 歲辛普里奧 bust 作無生成裁切，輸出 600×600 WebP；沒有重新捏臉。
- 狀態：**已接入 `assets.js/json`，48/48 測試通過**。
- 限制：現行程式以角色名共用單一肖像，故先取台詞量較多的後期年齡；正式候選版若要求 1590／1604 精準切齡，須由程式端增加 scene-aware portrait mapping，不能靠美術檔偷換。

### P1-04｜四年齡對話半身像與表情差分 v01

- 整張來源：
  - `characters/dialogue/ch01_char_galileo26_dialogue_sheet_chroma_v01.png`、`ch01_char_galileo26_dialogue_sheet_alpha_v01.png`
  - `characters/dialogue/ch01_char_galileo39_dialogue_sheet_chroma_v01.png`、`ch01_char_galileo39_dialogue_sheet_alpha_v01.png`
  - `characters/dialogue/ch01_char_simplicio58_dialogue_sheet_chroma_v01.png`、`ch01_char_simplicio58_dialogue_sheet_alpha_v01.png`
  - `characters/dialogue/ch01_char_simplicio72_dialogue_sheet_chroma_v01.png`、`ch01_char_simplicio72_dialogue_sheet_alpha_v01.png`
- 獨立母圖：`characters/dialogue/{galileo26,galileo39,simplicio58,simplicio72}/`，每套四張 `*_master_v01.png`，共 16 張；全部 RGBA、透明角落、長邊 2400 px。
- 工具：Codex 內建 image generation；分別以 P1-01／P1-02 年齡母版作身份與服裝錨點。內建生成先用均勻綠幕，之後以標準 chroma helper 做 soft matte、despill、透明切圖，再用 Lanczos3 非破壞放大。
- 狀態：**身份、年齡、服裝與四套表情通過；等待 Claude 完成 scene-aware 對話肖像接口後才衍生 runtime WebP，不先接 manifest。**
- 站位：全數為胸口以上、身體置左、視線朝畫面右方，供對話框左側使用；沒有方形底板、手、書、扇子、文字或 UI。重大動作仍另用全身立繪，不把這批半身像硬放大成舞台人物。
- QA：16 張母圖四角 alpha 均為 0、alpha 範圍 0–255；強綠殘色檢查 0 px。伽利略 26／39 保留左眼下痣、窄臉與短鬍；辛普里奧 58／72 保持可敬、挺直且不丑角化，72 歲只加銀髮與深紋、不做病弱老人。

表情配置：

| 年齡套組 | 表情 1 | 表情 2 | 表情 3 | 表情 4 |
|---|---|---|---|---|
| 伽利略 26 | neutral | skeptical | curious | crooked_smile |
| 伽利略 39 | focused | explaining | frustrated | realization |
| 辛普里奧 58 | authoritative | skeptical_smile | surprised | thoughtful |
| 辛普里奧 72 | formidable_calm | cross_examination | caught_off_guard | solemn_respect |

共用最終提示詞骨架：

```text
Use case: identity-preserve
Asset type: production dialogue bust expression sheet for a historical narrative game, Chapter 1
Input image: exact locked age-continuity character master; preserve the specified age identity, facial proportions, hair, beard, costume, restrained realistic historical oil-illustration rendering, and established age markers.
Primary request: Create exactly four separate chest-up dialogue portraits of the SAME character at the SAME age. Body occupies the left side of each portrait and the face/gaze turns toward screen-right, suitable for placement immediately left of a bottom dialogue box. Keep matching scale, camera height, three-quarter view, lighting, costume, and identity across all four portraits. Expressions from left to right are the four entries in the age-set table above; make each readable at small game-dialogue scale without caricature.
Background/keying: perfectly flat, uniform chroma green #00FF00 across the entire background, including every corner and gap around hair and shoulders; no texture, gradient, vignette, shadow, halo, scenery, frame, or floor.
Constraints: exactly four portraits; no hands, props, books, fan, telescope, text, labels, UI, border, watermark, extra person, duplicated face, cropped head, square portrait card, modern clothing, fantasy costume, villain caricature, or exaggerated expression. Preserve natural skin texture and fine hair edges for later chroma-key removal.
```

各套身份與表情替換：

- 伽利略 26：深色捲髮與短鬍、左眼下痣、全深髮色、舊黑學者服；表情為克制中性／懷疑側看／突然好奇／不對稱的壞笑。
- 伽利略 39：同一身份十三年後，細眼紋、輕疲態、極少鬢角灰、較整齊的帕多瓦黑衣；表情為專注／解釋中的投入／受挫但不暴怒／抓到關鍵的領悟。
- 辛普里奧 58：深灰捲髮、整齊灰鬍、深眼、挺直威嚴、黑色學袍與白領；表情為權威訓示／克制嘲諷微笑／扼要錯愕／閉口長考。
- 辛普里奧 72：同一身份十四年後，銀灰髮鬍、深紋、略瘦但不虛弱、同款學袍；表情為可敬的平靜威壓／交叉詰問／一瞬失守／罕見的鄭重尊重。

### P1-05｜旅人、助手與主持對話肖像 v01/v02

- 旅人來源：`characters/traveler/ch01_char_traveler_silhouette_{chroma,alpha,master}_v02.png`；runtime：`public/assets/ch01/dialogue/dialogue_traveler_silhouette.webp`。
- 助手來源：`characters/assistant/`（earnest／uncertain）；主持來源：`characters/host/`（formal／adjournment）；runtime 同名置於 `public/assets/ch01/dialogue/`。
- 狀態：**21 張對話 WebP 全部高度 720 px、透明角落通過；旅人為三分之二後視無臉剪影，不指定性別。**
- 淘汰：旅人 v01 兜帽正面剪影未入庫，因視覺過度接近奇幻刺客／神祕反派；v02 改為普通旅者後視輪廓。總監若實機仍感到太具體，可表現層改為玩家台詞無肖像，不需改劇本。
- 最終提示詞與 scene-aware 接口：`01_治理/發現之前_Claude_第一章正式美術整合包_20260719.md`；本批逐張提示詞另存 `PROMPTS_BATCH_02_20260719.md`。

### G2-01｜正式語意 token v1

- 唯一來源：`art/style/tokens.json`
- runtime 衍生：`public/assets/global/tokens.css`（由 `greybox/tools/gen_tokens.mjs` 產生，禁止手改）
- 狀態：**P-5 色彩與動效基線已落地；48/48 測試通過**
- 色彩：舊紙世界面 `#e6d7bd`、旅人筆記 `#f7f0df`、炭墨主字 `#241b16`、胡桃木章色 `#7a4b2a`；證據採去飽和深藍，成功採深綠，警示採赭橙。
- 無障礙：主／次文字對兩種底色對比均大於 6:1；證據、警示、成功與章色作文字時對筆記底均大於 4.5:1。鍵盤焦點 `#005fcc` 刻意不用章節棕，作非文字焦點框對兩種底色均大於 3:1。
- 動效：120／200／500／1000ms；降低動態模式仍須由 runtime 覆寫為近乎即時。

### P2-01｜比薩大學迴廊晨景空底 v02

- 檔案：`backgrounds/ch01_bg_pisa_arcade_morning_v02.png`
- 工具：Codex 內建 image generation；以 G1 Pisa arcade style frame v01 作 exact edit target
- 狀態：**空景、透視、補洞與角色安全區通過；runtime 已接入首幕**
- QA：伽利略與兩球已完全移出，原遮擋區重建為連續石板、柱基與牆面；中央及下方可獨立疊角色與互動球。保留遠方微傾塔作 P0-1 劇本定位，但不把人物、文字或 UI 燒入底圖。

最終提示詞：

```text
Use case: precise-object-edit
Asset type: production empty background plate for Chapter 1 opening scene
Input images: Image 1 is the exact edit target and locked composition, architecture, lighting, palette, perspective, and painterly-style anchor.
Primary request: Remove Galileo completely and remove both lead balls from the foreground. Reconstruct the hidden stone pavement, column bases, corridor wall, arch shadows, and distant street naturally so the result is a seamless EMPTY late-16th-century Pisa university arcade background plate.
Preserve exactly: the wide cinematic camera, arcade geometry, cool shaded foreground, warm morning sunlight beyond the arch, worn lime plaster, stone bench, distant urban street, subtly leaning tower visible through the right arch, realistic historical oil-illustration treatment, and the same muted stone/umber/blue palette.
Composition/framing: 16:9 landscape; empty middle and lower foreground must remain usable for separately layered character sprites and interactive balls; retain clean negative space without adding furniture.
Constraints: no people, no human silhouettes, no balls, no props, no UI, no borders, no readable text, no signs, no watermark, no modern objects; do not redesign the architecture, change the camera, crop the tower, or add dramatic fantasy lighting.
```

Runtime 衍生檔：`public/assets/ch01/backgrounds/bg_pisa_arcade.webp`（1920×1080，WebP quality 82）。已於真正瀏覽器確認完整載入，場景元件顯示 320×180、無裁切錯位。

### P2-02｜帕多瓦工作室正式底圖 v02

- 檔案：`backgrounds/ch01_bg_workshop_padua_v02.png`
- 工具：Codex 內建 image generation；以 proof 工作室空景作構圖鎖定，以 P0-01／P0-02 作器材功能錨點。
- 狀態：**器材修正通過；runtime 已接入 A2、A3-F、SC-R1 共用場景**。
- QA：固定陡坡改為長直淺槽木板＋兩腳架＋獨立墊高楔；水鐘改為高置水器底部細流、集水杯與雙盤秤；兩顆銅球、末端響片與角色安全區保留。背景不含人物、文字或 UI。
- Runtime：`public/assets/ch01/backgrounds/bg_workshop_padua.webp`（1920×1080，WebP quality 82）。

最終提示詞：

```text
Use case: precise-object-edit
Asset type: production empty background plate for Chapter 1 Padua workshop, shared by the inclined-plane experiment scenes.
Input images: Image 1 is the exact locked room composition, camera, architecture, daylight, perspective, and restrained historical oil-illustration anchor. Image 2 is the exact mechanically approved adjustable inclined-plane apparatus. Image 3 is the exact mechanically approved water-clock apparatus.
Primary request: Correct ONLY the experimental apparatus in Image 1 while preserving the workshop itself. Replace the existing steep fixed ramp with the approved long straight shallow-grooved plank on two sturdy trestles plus clearly separate wedge blocks that permit low, medium, and steeper inclinations. Replace the oversized ornate tank-and-bucket setup with the approved simple elevated vessel, bottom narrow outlet producing a thin water jet into one small removable collecting cup, with a compact two-pan balance and small weights nearby. Keep one large and one small bronze ball visibly available near the groove and one small brass stop plate at the lower end.
Preserve exactly: 16:9 wide camera, all windows and exterior view, worn plaster, ceiling beams, carpentry tools, benches, wood stock, cool indoor shadows, warm Padua daylight, realistic late-Renaissance materials, same muted walnut/cream/brass palette, and generous empty middle-ground where characters can later be layered.
Composition/framing: the entire long incline and all functional timing parts must remain legible at scene scale; the front and central floor must remain clear for separately layered people and UI. No people are present.
Constraints: no people, no silhouettes, no readable writing or numerals, no UI, no border, no watermark, no modern hardware, no rubber tube, no laboratory glassware, no integrated triangular wedge ramp, no large catch bucket, no second reservoir, no fantasy clockwork. The plank channel is a shallow groove, not two tall rails. Function over ornament. Do not redesign the room or change the camera.
```

### P2-03｜大學辯論廳空底 v03

- 檔案：`backgrounds/ch01_bg_lecture_hall_empty_v03.png`
- 工具：Codex 內建 image generation；以 G1 書版辯論廳 v02 作 exact edit target。
- 狀態：**去角色、補洞與分層安全區通過；runtime 已接入第三幕全部講堂場景**。
- QA：所有前景與觀眾人物均移除；座席、牆面、窗格與地面完整重建；中央桌面清空，供數據紙、評注本與角色另層疊入。
- Runtime：`public/assets/ch01/backgrounds/bg_lecture_hall.webp`（1920×1080，WebP quality 82）。

最終提示詞：

```text
Use case: precise-object-edit
Asset type: production empty background plate for Chapter 1 university debate hall, year 1604.
Input image: Image 1 is the exact locked camera, architecture, palette, window light, furniture design, perspective, and restrained realistic historical oil-illustration anchor.
Primary request: Remove every person completely and reconstruct all occluded benches, desks, paneled walls, stone floor, window bays, and warm dusty air as a seamless EMPTY early-17th-century Italian university lecture hall. Keep the large central examination table in the foreground, but clear its top completely so books, inkpots, papers, data sheets, and hands can be separate props later.
Preserve exactly: 16:9 wide camera and height, lecture-hall geometry, tiered dark walnut benches, pale stone/plaster architecture, tall leaded-glass windows at right, cool window daylight, sober brown/cream palette, and dignified historic atmosphere. Maintain clear stage space behind and beside the central table for separately layered Galileo and Simplicio.
Constraints: no people, faces, silhouettes, ghosts, mannequins, books or papers on the central table, readable text, numerals, UI, border, watermark, modern objects, or fantasy ornament. Do not redesign the architecture, move the windows, change the camera, or add theatrical spotlighting.
```

### P2-04｜第一章缺景與光線狀態批次 v01

- 新增來源母版：比薩書房日／雨夜、舊城牆、高塔頂黎明、阿諾河黃昏、帕多瓦運河黃昏、帕多瓦工作室深夜、比薩迴廊午後、大講堂觀眾版、月球亞平寧末頁。
- 目錄：`backgrounds/ch01_bg_*_master_v01.png`（2560×1440）；runtime：`public/assets/ch01/backgrounds/*.webp`（1920×1080，quality 82）。
- QA：所有背景保留底部約 27% 對話安全區；關鍵建築／器材／人物位置在中央 80%；沒有燒入文字與 UI。講堂觀眾只在後排，中央辯論桌保持空白。月球圖為放手前一瞬，鎚與羽後續位移仍由程式演出。
- 共享：`bg_university_corridor` 可直接指向午後迴廊，不製造重複圖；書房與工作室必須使用 scene-aware 日／夜 ID，不能用單一路徑硬撐全章。
- 最終提示詞與場景對照：`PROMPTS_BATCH_02_20260719.md`、`01_治理/發現之前_Claude_第一章正式美術整合包_20260719.md`。

### P3-01｜筆記本、證據卡底、信件與 runtime 器材 v01

- 筆記本：`ui/ch01_ui_notebook_open_master_v01.png` → `public/assets/ch01/ui/bg_notebook.webp`（1920×1080）。雙頁完全留白，文字由 HTML 疊加。
- 證據共用卡面：`ui/ch01_ui_evidence_card_blank_v01.png` → `public/assets/ch01/cards/card_template.webp`（800×500）。
- S1：`props/ch01_prop_pisa_letter_v01.png` → `public/assets/ch01/cards/card_S1.webp`；S2 由已通過手稿 proof 衍生 `card_S2.webp`。
- 器材：正式斜面、水鐘、評注本衍生 `prop_ball_groove.webp`、`prop_water_clock.webp`、`prop_physics_tome.webp`（皆 800×500）。
- 邊界：E1–E5 的數字、推論鏈、變因比較與互動狀態不得畫進點陣圖；卡面只提供紙張／框體材質，語意由 HTML/SVG 產生。

## 驗收規則

1. 來源圖先過歷史／物理功能 QA，再進場景；不能以「看起來像古董」代替操作合理。
2. 場景母版目標 2560×1440 以上；角色正式母版長邊 2400 以上。內建生成原圖若不足，須以非破壞方式放大後再做清邊與縮圖驗收。
3. runtime 每張圖另輸出 WebP，桌面與小螢幕各測一次；來源 PNG 不直接塞進遊戲。
4. 角色身份、服裝、年齡與道具一旦鎖定，只能以差分或正式變更紀錄修改。
5. 本帳每一資產都要留下最終提示詞、參考角色、生成／編修方式、版本與淘汰原因。
