# 第四章｜牛頓山頂大砲原典圖遊戲重建 v01

日期：2026-08-11
工具：OpenAI 內建 image generation
用途：D2-1「最高的山頂上，架一門砲」焦點圖。

## 來源與身分邊界

- 內容參考：Isaac Newton, *A Treatise of the System of the World*（1728 英譯刊本）第 6 頁山頂大砲圖。
- 公版掃描：https://archive.org/details/1728-newton-a-treatise-of-the-system-of-the-world/page/n35/mode/2up
- Wikimedia Commons：https://commons.wikimedia.org/wiki/File:Newton%27s_cannonball.png
- 來源檔：`art/source/historical/ch04/newton_cannonball_1728_public_domain.png`
- 來源 SHA-256：`88651ef30da15f8e9afb5a6e784551ebebd3c57ca54f9054f1b246ff2edeb522`
- 來源授權：Public Domain Mark。
- 本遊戲圖是依原典構圖生成的風格重建，不是原典掃描，也不是牛頓親筆手稿。

## 參考圖角色

1. `newton_cannonball_1728_public_domain.png`：科學構圖與軌跡關係的權威參考。
2. `ch04_prop_tangent_prediction_sheet_master_v03.png`：本專案羊皮紙、木桌、羽毛筆、墨線風格參考。

## 最終提示詞

```text
Use case: historical-scene
Asset type: Chapter 4 in-game historical diagram reconstruction, wide 16:9 raster prop image.
Primary request: Redraw Isaac Newton's famous mountain-cannon thought-experiment diagram as a polished in-world seventeenth-century study-sheet prop for the game 《發現之前》.
Input images: Image 1 is the authoritative content/composition reference from the 1728 printed edition; Image 2 is the project's visual-style reference for parchment, dark wooden desk, quill, lighting, and line-work.
Scene/backdrop: Top-down view of one large handmade cream parchment sheet lying flat on a dark seventeenth-century wooden study desk, with only a restrained quill and brass divider near the far edges.
Subject: Preserve the scientific structure of Image 1: a large Earth centered on the page, a high mountain at the top with a tiny cannon firing horizontally, several progressively longer falling trajectories around the Earth, one complete near-circular orbit, and one much larger outward/escape path. The relationship among falling back, orbiting, and escaping must be visually clear. The Earth should be the dominant form, not tiny.
Style/medium: historically inspired hand-inked scientific drawing with fine cross-hatching and slightly uneven black-brown quill lines; warm aged-paper photography matching Image 2; elegant, restrained, museum-quality game prop.
Composition/framing: Wide 16:9 landscape. Parchment fills about 82% of the frame. Diagram centered and large enough to read in a game focus card. Keep generous margins so nothing is cropped. The outer escape path must remain fully visible.
Lighting/mood: warm candlelit study, quiet discovery, subtle vignette, high legibility.
Text: No prose, no title, no formula, no watermark. If labels are included, use only the exact single Latin capitals A, B, C, D, E, F, V and make them clean and sparse; otherwise omit labels entirely.
Constraints: Treat Image 1 as the authoritative geometry reference, but do not reproduce its white page scan or 'Page 6' lettering. Treat Image 2 only as style and material reference. This is a reconstruction, not a forged autograph manuscript. Keep all trajectories physically coherent and distinguish impact arcs, closed orbit, and escape path.
Avoid: photorealistic cannon landscape, modern typography, extra planets, Moon, fantasy symbols, equations, illegible pseudo-writing, decorative borders, burnt paper, torn missing corners, hands, people, UI, code-generated overlay look, watermark.
```

## 定點修正提示詞

初稿在地球下方多產生兩個未要求的 `G` 標記，使用同一工具做一次定點修正：

```text
Use case: precise-object-edit
Primary request: Remove only the two extraneous capital letter G marks near the bottom center of the parchment diagram (one overlapping the lower edge of Earth and one immediately below Earth). Fill those tiny areas naturally with matching parchment or the existing line hatching as appropriate.
Invariants: Preserve the entire image pixel-for-pixel in appearance as closely as possible: exact 1672×941 composition, parchment, wooden desk, feather, divider, Earth engraving, mountain, cannon, every trajectory curve and arrow, and the existing A, B, C, F, V labels. Do not move, redraw, add, or remove any scientific line. Do not alter lighting, color, texture, framing, or crop.
Avoid: any new text, any new labels, any changed trajectory, any changed geography, any added object, watermark.
```

## 產物

- 母版：`art/source/production/ch04/focus/ch04_focus_newton_cannonball_reconstruction_master_v01.png`（1672×941）
- runtime：`public/assets/ch04/focus/ch04_focus_newton_cannonball_reconstruction_v01.webp`（WebP q84）
