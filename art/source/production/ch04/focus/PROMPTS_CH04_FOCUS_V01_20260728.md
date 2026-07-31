# 第四章焦點鏡頭生圖紀錄 v01

- 生成日期：2026-07-28
- 生成方式：OpenAI 內建 image generation
- 用途：只承載時代質感、空間與情緒；所有物理數據、軌跡、刻痕、數字與判定仍由引擎 SVG／HTML 繪製。

## 1. 1665 抽屜關上

- 主檔：`ch04_focus_drawer_closes_1665_master_v01.png`
- runtime：`public/assets/ch04/focus/ch04_focus_drawer_closes_1665_v01.webp`
- prompt：

> Create a cinematic historical scene plate for an educational narrative game, 16:9. Woolsthorpe Manor, England, 1665. Close-up of a dark oak writing-desk drawer being quietly pushed shut by a young scholar's hand; only the edges of two calculation papers are faintly visible inside, suggesting a question suspended for fourteen years. Modest seventeenth-century stone farmhouse study, historically plausible woodwork and sleeve. Naturalistic historical photography, restrained and intimate, central drawer and hand, dark negative space in the upper left for dialogue UI. Warm candlelight from the right, cool daylight leaking from a small window. No readable writing, no numbers, no diagrams, no modern hardware, no apple, no text, no watermark.

## 2. 1679 牛頓接筆續畫

- 主檔：`ch04_focus_newton_orbit_montage_1679_master_v01.png`
- runtime：`public/assets/ch04/focus/ch04_focus_newton_orbit_montage_1679_v01.webp`
- prompt：

> Create a cinematic historical close-up plate for an educational narrative game, 16:9. Cambridge study, 1679. Isaac Newton's hand takes over a quill and continues a geometric construction on parchment after another person's first few marks. The parchment should remain mostly blank, with a generous open central-left area reserved for later SVG lines and motion overlays; show only faint ink texture, not a finished diagram. Hand, quill, candle and instruments occupy the right third. Naturalistic historical photography, tense concentration, warm candlelight against cool window light. No complete orbit, no formulas, no numbers, no labels, no readable text, no watermark.

## 3. 山頂大砲

- 主檔：`ch04_focus_mountain_cannon_master_v01.png`
- runtime：`public/assets/ch04/focus/ch04_focus_mountain_cannon_v01.webp`
- prompt：

> Create a cinematic historical concept plate for an educational narrative game, 16:9. A plausible late-seventeenth-century iron cannon mounted on an impossibly high but visually credible mountain summit, a thought experiment taking shape in Isaac Newton's mind. Put the cannon and rocky ledge in the lower-left quarter; leave the right two-thirds and upper sky open and visually quiet for three engine-drawn SVG trajectory arcs. Predawn slate-blue sky with a narrow amber horizon, distant curvature suggested only by atmosphere. Naturalistic historical photography with restrained painterly texture. No projectile, no smoke trail, no arcs, no lines, no arrows, no numbers, no text, no watermark.

## Runtime 原則

- 三張圖均不得作為物理判定依據。
- 山頂大砲的三條軌跡必須由 SVG 疊加，並與玩家操作狀態同步。
- 作圖紙上的幾何線、箭頭與步數必須由引擎產生，不可烘焙進底圖。
- 若後續裁切，保留原始主檔；runtime 衍生檔使用 WebP。
