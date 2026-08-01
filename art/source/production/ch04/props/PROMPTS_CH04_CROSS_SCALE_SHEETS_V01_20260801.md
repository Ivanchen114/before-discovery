# 第四章「同尺紙」候選底圖 v01

- 日期：2026-08-01
- 狀態：已接入 runtime 候選，待桌機／手機橫屏瀏覽器驗收
- 工具：Codex 內建 image generation
- 用途：第四章 1665 伍爾索普「同尺紙」工作台左側兩張紙的材質底圖

## 史實與呈現邊界

這兩張圖只重建十七世紀手稿的紙張、墨水與幾何草圖語彙，不宣稱是牛頓留存手稿的掃描或臨摹。牛頓 1660 年代的 Waste Book 可作為時代視覺參照，但目前沒有資料證明遊戲中的「地表一秒／月球六十秒」兩張現代比較卡是牛頓當年留存的成對原稿。

所有可驗證的文字、數值、刻度與軌跡由 HTML／SVG 疊加在紙面上；玩家視覺上會看見數字與公式寫在手稿紙中，但點陣底圖不承擔物理證據，也不偽造可讀手寫文字、公式、簽名、日期或館藏標記。公式依玩家完成換算／倍率／關係判斷後逐步出現，不在作答前洩漏。

參考資料：

- Cambridge Digital Library / University of Cambridge Repository, Newton's Waste Book (MS Add. 4004)
- The Newton Project, Waste Book, Part 2 (NATP00221)

## 檔案

- `ch04_prop_cross_scale_surface_sheet_master_v01.png`：原始生成母檔
- `ch04_prop_cross_scale_moon_sheet_master_v01.png`：原始生成母檔
- `../../../../../public/assets/ch04/props/ch04_prop_cross_scale_surface_sheet_v01.webp`：runtime 候選壓縮檔
- `../../../../../public/assets/ch04/props/ch04_prop_cross_scale_moon_sheet_v01.webp`：runtime 候選壓縮檔

## Prompt 1：地表落體紙

Create a wide horizontal historical scientific manuscript prop for an educational game, aspect ratio about 5:2. A single sheet of warm cream handmade rag paper from rural England circa 1665, viewed perfectly straight-on, filling the frame with a narrow clean margin. Sparse brown-black iron-gall ink diagram only: near the left third, a simple small open circle at the top and another below it, connected by a thin vertical ink line, suggesting a plumb line and a falling body. Add only a few faint construction pricks and restrained ruled guide marks. Authentic uneven fibers, subtle foxing, worn deckled edges, gentle age stains, natural ink bleed, sober early-modern scientific notebook character. No people, no hands, no desk, no books, no printed border, no modern graphics. Absolutely no readable words, letters, numbers, equations, signatures, dates, watermarks, labels, or measurements. This is a historically informed teaching reconstruction, not a scan or replica of an extant Newton manuscript. The diagram must remain sparse so deterministic SVG labels and measurements can be overlaid later. No invented legible historical text.

## Prompt 2：月球切線與下墜紙

Using the first generated surface sheet as the exact visual style reference, create its matching companion sheet, same wide 5:2 aspect ratio, same warm cream handmade rag paper, straight-on view, restrained brown-black iron-gall ink, identical aging, margins, fibers, foxing, edge wear, and sparse 1665 notebook character. The diagram should suggest the Moon's inertial motion and inward fall without carrying any numerical evidence: place a small open circle near the left third, a long thin horizontal tangent guide extending to the right, a second subtly lower construction mark indicating inward deflection, and a very broad faint curved arc below suggesting the Earth. Include only a few construction pricks and faint ruled guides. No people, no hands, no desk, no printed border, no modern graphics. Absolutely no readable words, letters, numbers, equations, signatures, dates, watermarks, labels, or measurements. Historically informed teaching reconstruction only, not a scan or replica of an extant Newton manuscript. Leave generous quiet space for deterministic SVG labels, values, and tracks to be overlaid later. No invented legible historical text.

第二張生成時以第一張成品作為風格參照，以維持紙張色澤與墨線語彙一致。
