# 第四章「同尺紙」完整教學重建圖 v02

- 日期：2026-08-03
- 狀態：已接入 runtime，待桌機／844×390 瀏覽器驗收
- 工具：OpenAI image generation
- 用途：第四章 1665 伍爾索普「同尺紙」工作台左頁兩張完整 raster 圖

## 導演裁決與史實邊界

本版依總監 2026-08-03 明確裁決，取代 v01「生成底圖＋執行期 SVG 疊圖」方案。線條、刻度、數字與簡式直接烤進重建圖；runtime 不再疊畫。兩圖仍是現代教學重建，不是牛頓手稿掃描，也不宣稱 1665 年有這兩張成對留存紙。玩家介面在圖下固定標示「教學重建」。

地表紙只寫本場已公開的 `4.9 m` 與 `s(1s) ≈ 4.9 m`。月球紙只公開當時可用的約 `60 R⊕` 距離與「切線前進／向內偏折」關係，不先寫出玩家仍須換算的 `1.4 mm`、`3600` 或平方關係答案。

## 資產

- `ch04_prop_cross_scale_surface_sheet_v02`
  - 母版：`ch04_prop_cross_scale_surface_sheet_master_v02.png`
  - runtime：`../../../../../public/assets/ch04/props/ch04_prop_cross_scale_surface_sheet_v02.webp`
- `ch04_prop_cross_scale_moon_sheet_v02`
  - 母版：`ch04_prop_cross_scale_moon_sheet_master_v02.png`
  - runtime：`../../../../../public/assets/ch04/props/ch04_prop_cross_scale_moon_sheet_v02.webp`

## Prompt 1｜地表一秒完整紙

Use case: scientific-educational. Asset type: completed in-game historical reconstruction sheet for Chapter 4, landscape parchment diagram. Edit the reference image into a fully finished illustration while preserving its aged cream laid-paper texture, wide 2.55:1 composition, restrained seventeenth-century brown ink, fine hand-drawn geometry, and ample margins. Subject: a clear vertical one-second terrestrial fall record. Show two small circular positions on one vertical plumb line, a precise dark bracket between them, subtle ruler tick marks, and a small falling brass ball. Bake the essential notation directly into the artwork in clean legible Latin characters and Arabic numerals: "Terra · 1 sec" at upper left, "4.9 m" beside the bracket, and "s(1s) ≈ 4.9 m" on the right. The drawing must be visually complete and self-explanatory without any HTML, SVG, canvas, or later code overlay. Keep the mathematics exactly as written. This is a modern teaching reconstruction styled as an old working sheet, not a purported archival scan. No Chinese characters, no decorative paragraphs, no watermark, no frame outside the paper, no photorealistic desk, no modern UI.

## Prompt 2｜月球六十秒完整紙（比例修正版）

Use case: scientific-educational. Revise this completed landscape parchment diagram because the Earth is misleadingly huge. Keep the aged cream laid-paper, restrained seventeenth-century brown ink, wide 2.5:1 composition, and baked-in drawing with no later overlay. Create two clearly separated hand-drawn regions on the same sheet. MAIN SCALE STRIP across the left two-thirds: show a very small Earth circle near the left, with Earth radius about 12 pixels at final 1200px width, and a tiny Moon about sixty Earth radii away to the right; connect Earth center and Moon with a long fine dimension line and label it exactly "≈ 60 R⊕". The spacing must visually communicate that the Moon is very far away; do not enlarge Earth into a large foreground globe or broad arc. DETAIL INSET on the right third: enlarge only the immediate neighborhood around the Moon, label the inset "detail", show a long straight tangent arrow continuing forward and a much smaller downward/inward sag arrow aimed toward Earth, labelled exactly "inward sag". Upper-left title exactly "Luna · 60 sec". Make the main-scale Earth and Moon relationship approximately to scale and the inset visibly boxed or circled so it cannot be mistaken for the same scale. All text and arrows are baked into the raster art. No Chinese, no paragraphs, no modern UI, no watermark, no photorealistic sky, no giant Earth.

## 衍生方式

母版保持生成器原始 PNG；runtime 以 Pillow Lanczos 重採樣為 1200×480、WebP quality 88、method 6。沒有加入第三方影像或後製圖層。
