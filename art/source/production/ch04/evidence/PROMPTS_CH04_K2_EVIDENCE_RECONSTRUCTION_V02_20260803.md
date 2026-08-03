# 第四章 K2「地上與天上的同一把尺」取得證據重建圖 v02

- 日期：2026-08-03
- 工具：OpenAI image generation
- 狀態：已人工檢查科學比例與文字，待遊戲內桌機／844×390 驗收
- 用途：K2 取得彈窗與旅人筆記共用的 1200×750 raster 證據圖

## 史實與證據邊界

本圖是現代教學重建，不是牛頓真跡、留存手稿掃描或 1665 年桌面照片。圖中兩張紙沿用本章已生成的地表一秒紙與月球六十秒紙；主比例中的地球保持很小，月球距離標為約六十個地球半徑，切線與向內偏折另放在明確標為 `DETAIL` 的局部放大框。

工作台階段不提前顯示答案；只有玩家完成換算並取得 K2 後，這張證據圖才公開 `60 × 60 = 3600`，並讓地表一秒的約 `4.9 m` 與月球六十秒的約 `4.9 m` 在同一張桌面圖中相認。遊戲外框圖說固定標示「教學重建」。

## Prompt 1｜桌面整合初稿

Create one complete, fully rasterized historical evidence illustration for a narrative physics game, landscape 8:5 composition, designed to remain legible when displayed at 1200×750. Use both reference images as the actual scientific visual sources and preserve their essential scale logic. The "Terra · 1 sec" sheet records a near-surface fall of 4.9 m in one second. The "Luna · 60 sec" sheet must visibly show the Moon about 60 Earth radii from a small Earth on the main-scale strip. The separate circular tangent/inward-sag drawing is explicitly a magnified detail inset. A cinematic, historically plausible top-down or slightly oblique view of a dark walnut desk in Newton's Woolsthorpe study, candlelit, 1665 atmosphere. The two aged paper sheets lie side by side as real physical evidence, with worn edges, subtle folds, ruler, brass dividers, and a small cord or hand-drawn bracket linking the two measurements. Between the sheets show only the minimal comparison calculation "60 × 60 = 3600" and a restrained matching mark. Photorealistic historical reconstruction with painterly cinematic texture; not a modern infographic, not UI, not SVG/vector art, not code, not a fake archival scan. No people, hands, portraits, Chinese text, K2 title, logos, watermarks, invented provenance stamps, or explanatory paragraphs.

參考母版：

- `../props/ch04_prop_cross_scale_surface_sheet_master_v02.png`
- `../props/ch04_prop_cross_scale_moon_sheet_master_v02.png`

## Prompt 2｜科學訊息補正

Edit the first generated image as the base and keep its historical desk composition. On the right "Luna · 60 sec" paper, add one clean handwritten result: `s_Luna(60 s) ≈ 4.9 m`. Replace the isolated large `≈` on the narrow center scrap with a restrained equality or matching mark, so `60 × 60 = 3600` coherently links the two 4.9 m results. Preserve `≈ 60 R⊕` exactly, keep Earth small and Moon distant, and add no other text or equations.

## 衍生方式

保留生成器原始 1586×992 PNG 為母版；runtime 以 Pillow `ImageOps.fit` 中央裁成 8:5，Lanczos 重採樣為 1200×750，WebP quality 88、method 6。沒有加入第三方影像或後製文字圖層。
