# 第四章焦點鏡頭生圖紀錄 v02

- 生成日期：2026-07-31
- 生成方式：OpenAI 內建 image generation（專案協作者 Sol／Codex）
- 用途：補足 D4-1 的三個比較道具與 D4-2 球殼證明紙頁。
- 共同邊界：影像只承載器物、時代質感與情境；名稱、數據、距離、週期、星位、幾何關係與判定均由 HTML／SVG／引擎資料承載。

## 1. 攪茶渦旋類比

- 資產 ID：`ch04_focus_stirred_tea_analogy_v01`
- 主檔：`ch04_focus_stirred_tea_analogy_master_v01.png`
- runtime：`public/assets/ch04/focus/ch04_focus_stirred_tea_analogy_v01.webp`
- 初稿生成原檔：`call_HhDnM1ZZ3IZ7zJqHQGJQB0dC.png`
- 最終編修原檔：`call_sUgxXAnC330aLlibzcxH6kk2.png`
- prompt：

> Create a cinematic historical prop close-up for an educational narrative game, landscape 16:9. Cambridge, England, 1684, on a dark oak scholar's desk. A plain late-seventeenth-century earthenware tea bowl filled with dark tea is being gently stirred with a simple small spoon; loose tea leaves form a visible but natural swirling current in the liquid. Show only part of a historically plausible sleeve and hand at the far right edge. A quill, closed folio, and candle are soft and secondary in the background. Naturalistic historical photography with restrained painterly texture, low saturation, cool leaded-window daylight from the left and warm candlelight from the right, intimate scientific conversation mood. Keep the tea bowl large and central-left so the motion is legible at game size. The image is only an analogy prop: do not depict planets, space, orbital lines, arrows, labels, formulas, diagrams, readable writing, letters, numbers, modern objects, logos, or watermark.

- 最終編修 prompt：

> Edit the provided image while preserving the same 1684 Cambridge desk, hand, spoon, quill, leaded-window light, candlelight, low-saturation historical realism, and 16:9 composition. Replace the oversized bowl with a small handleless late-seventeenth-century ceramic tea bowl for one person, roughly one-third of the current vessel's diameter. It should read clearly as a cup of tea rather than a serving bowl. Reduce the loose leaves substantially; keep only a modest number of tea leaves making a subtle but visible natural swirl around the spoon. Keep the vessel central-left and legible at game size. No text, numbers, diagrams, arrows, planets, modern objects, logos, or watermark.

## 2. 天然磁石與鐵針類比

- 資產 ID：`ch04_focus_lodestone_needle_analogy_v01`
- 主檔：`ch04_focus_lodestone_needle_analogy_master_v01.png`
- runtime：`public/assets/ch04/focus/ch04_focus_lodestone_needle_analogy_v01.webp`
- 生成原檔：`call_XDROFfvgNRMazAw7OP0FFFsu.png`
- prompt：

> Create a cinematic historical prop close-up for an educational narrative game, landscape 16:9. Cambridge, England, 1684, on a dark oak scholar's desk. A naturally shaped dark lodestone sits on a small plain wooden base at left; a single seventeenth-century iron sewing needle lies separately on the desk to the right, close enough to suggest attraction but not touching. A scholar's hand has just withdrawn, leaving the apparatus still. Include a subtle earlier dust mark behind the needle, but no motion line. A divider, quill, and blank folded parchment sit softly out of focus. Naturalistic historical photography with restrained painterly texture, low saturation, cool leaded-window daylight from the left and warm candlelight from the right. Keep the lodestone and needle large and clearly separated at game size. The image is only an analogy prop: do not show modern bar magnets, horseshoe magnets, magnetic field lines, arrows, labels, formulas, diagrams, readable writing, letters, numbers, modern objects, logos, or watermark.

## 3. 三份觀測封面

- 資產 ID：`ch04_focus_three_observation_folios_v01`
- 主檔：`ch04_focus_three_observation_folios_master_v01.png`
- runtime：`public/assets/ch04/focus/ch04_focus_three_observation_folios_v01.webp`
- 生成原檔：`call_37r0X5E9zABJjiqlWB8ot4hb.png`
- prompt：

> Create a cinematic historical evidence-prop close-up for an educational narrative game, landscape 16:9. Cambridge, England, 1684. On a dark oak scholar's desk, arrange exactly three separate closed observation folios side by side, each made of worn cream parchment and tied independently with thin cord. They must be visibly distinct but contain no readable text: the left cover has only a small hand-drawn crescent-moon emblem, the middle cover has only two small plain circular wax markers suggesting two planets, and the right cover has only a small simple comet-tail emblem. Keep all three folios fully visible and equally important, with clear gaps between them. A quill, sealing wax, and brass divider remain secondary at the edge. Naturalistic historical photography with restrained painterly texture, low saturation, cool leaded-window daylight from the left and warm candlelight from the right. This is a reconstructed sorting prop, not a facsimile and not data: no star charts, no dates, no measurements, no formulas, no orbital paths, no labels, no readable handwriting, no letters, no numbers, no modern objects, logos, or watermark.

## 4. 球殼定理紙頁底圖

- 資產 ID：`ch04_focus_shell_theorem_page_v01`
- 主檔：`ch04_focus_shell_theorem_page_master_v01.png`
- runtime：`public/assets/ch04/focus/ch04_focus_shell_theorem_page_v01.webp`
- 生成原檔：`call_YPFeEs8Fn1bqUyAQKsJfLGmp.png`
- prompt：

> Create a cinematic historical paper-prop base plate for an educational narrative game, landscape 16:9. London printshop, 1687. Close view of one large worn cream proof sheet lying flat on a dark oak compositor's table beside a few loose metal types, a wooden composing stick, a brass divider and a quill. The proof sheet must occupy the central two-thirds and remain largely blank, with only subtle paper fibers, faint erased construction smudges, and a very light circular compass indentation—no finished diagram. Leave generous clean central space for a later engine-drawn SVG geometry overlay. Naturalistic historical photography with restrained painterly texture, low saturation, warm press-room candlelight with a narrow cool window reflection. Historically plausible late-seventeenth-century printing environment. This is a stage prop, not a facsimile: no readable writing, no printed text, no formulas, no numbers, no labels, no arrows, no completed circles or theorem diagram, no modern objects, logos, or watermark.

## Runtime 衍生與人工檢查

- 母版皆為 1672×941 PNG。
- runtime 由 `sharp` 以 WebP quality 82、smart subsampling 產生，無放大、無裁切。
- 四張均已人工檢查：無可讀偽文字、無現代器材、無浮水印、無把物理結論畫死。
- 球殼頁的同心殼、球心、殼外點與連線必須由 `shell-theorem` SVG overlay 繪製。
