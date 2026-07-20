# INT-1「十一年」正式幕間板圖交付

**日期**：2026-07-20  
**製作**：Sol（美術／審核）  
**狀態**：三張正式圖完成，待 Claude 表現層接線；不動凍結劇情與引擎

## 1. 資產

| ID | runtime | 尺寸 | 畫面 |
|---|---|---:|---|
| `int1_pisa_notebook` | `public/assets/ch01/interlude/int1_pisa_notebook.webp` | 1920×1080 | 比薩雨夜；較新的筆記與深色墨跡 |
| `int1_time_passage` | `public/assets/ch01/interlude/int1_time_passage.webp` | 1920×1080 | 唯一一張主要翻頁；比薩燭光向帕多瓦日光溶接 |
| `int1_padua_notebook` | `public/assets/ch01/interlude/int1_padua_notebook.webp` | 1920×1080 | 帕多瓦工作室；紙張泛黃、筆記落定 |

來源母版：

- `int1_plate01_pisa_notebook_master_v01.png`
- `int1_plate02_time_passage_master_v01.png`
- `int1_plate03_padua_notebook_master_v01.png`

接圖預覽：`int1_timejump_contact_v01.webp`

## 2. 演出設計

不用預錄影片，也不要再做 CSS 3D 紙頁。三張圖以短溶接與極小的 1.01–1.04 倍鏡頭推進形成「偽影片」。總長建議 3.4 秒：

| 時間 | 畫面 | 年份 HTML |
|---:|---|---|
| 0–0.65s | plate 1 淡入、微推近 | `1592` |
| 0.65–1.20s | plate 1 → plate 2 溶接 | `1597` |
| 1.20–1.80s | plate 2 短暫停留；只看見一張頁弧 | `1602` |
| 1.80–2.55s | plate 2 → plate 3 溶接 | `1603` |
| 2.55–3.15s | plate 3 停穩 | `1603` |
| 3.15–3.40s | 幕間層淡出，露出既有帕多瓦場景 | 無 |

聲音只用三拍：plate 2 出現時一次紙頁掠過、兩地溶接時一聲低沉時間氣流、plate 3 落定時一次柔和紙面聲。禁止重複翻書聲。

## 3. 給 Claude 的施工要求

1. `assets.json/js` 新增三個 ID 與上述路徑，1920×1080；現有 `sceneFx.INT-1` 可引用三 ID。
2. `#fxPages` 四個 `<i>` 與 `bdFlip` 不再用於 INT-1；以兩張絕對定位 `<img>` 交替 crossfade，或三張圖各自一層。不得替新板圖再加 `rotateY`。
3. 移除 1592→1603 的逐年 `requestAnimationFrame` 計數；只顯示 1592／1597／1602／1603 四個劇情里程碑，年份仍為 HTML。
4. 全畫面 `object-fit:cover; object-position:center`；板圖為裝飾，`alt=""`、`aria-hidden="true"`。螢幕閱讀器由既有幕間文字負責。
5. 點擊背景、Enter、Space 都可一次跳至 plate 3，再次操作才離開（或單次直接完成也可，但需與既有跳過規則一致）；不能只有滑鼠。
6. `prefers-reduced-motion`：直接顯示 plate 3＋`1603` 約 700ms，無溶接、無縮放。
7. 預載三張；播放期間暫停逐字台詞，完成後恢復。不得改 INT-1 劇情節點、存檔或場景跳轉。
8. 補契約測試：三資產存在／尺寸正確；INT-1 不再依賴四頁 CSS；逐年計數消失；四個里程碑、鍵盤跳過與 reduced-motion fallback 存在。

可直接貼：

> INT-1 三張正式幕間板圖已交付，讀 `art/source/production/ch01/interlude/HANDOFF_INT1_TIMEJUMP_20260720.md` 後依 §2–3 接線。請刪除現行四頁 2.4 秒 `bdFlip` 與逐年數字計數，改用三張板圖 3.4 秒溶接；中圖已畫好唯一一張翻頁，不得再疊 CSS 翻頁。只改表現層、manifest 與測試，不動凍結劇情／引擎，也不要 stage Sol 其他未入庫件。

## 4. 最終提示詞存檔

### Plate 1｜比薩起頁

```text
Use case: historical-scene
Asset type: production cinematic storyboard plate 1 of 3 for a full-screen 16:9 game time-jump montage
Input images: Image 1 is the exact Pisa study environment and lighting/style reference. Image 2 is the exact leather-bound travel notebook design/material reference.
Primary request: Create the opening plate of a seamless three-image montage. A close, slightly elevated three-quarter camera looks down at the SAME open leather-bound travel notebook resting on Galileo's dark walnut writing desk in the Pisa study at night, 1592. The notebook dominates the lower and central frame, about 62 percent of image width, with both pages fully visible. The pages are relatively fresh warm ivory, with sparse period ink notes and small nonverbal sketches near the outer edges, but a broad calm central area remains free for HTML year overlays. A brass candlestick at far left gives restrained amber light; the established blue-black rainy window and rough plaster study remain softly out of focus in the upper background. The near page edge is just beginning to lift by a few millimeters, suggesting the book is about to turn itself, but no page is yet airborne.
Style/medium: match the supplied realistic restrained historical oil-illustration look exactly; cinematic but natural, detailed aged paper, leather, walnut, quill and ink.
Composition/framing: exact 16:9 landscape; book spine centered; camera and book geometry must be clean enough to reuse unchanged in plates 2 and 3. Preserve the upper center and center of the pages as low-detail safe zones for large HTML dates. Keep all essential book content inside the central 80 percent so 844x390 landscape cropping remains safe.
Lighting/mood: intimate candlelight, cool rainy Pisa night behind, quiet threshold before impossible time passes.
Constraints: no people, no hands, no face, no floating pages, no magical glow, no clock, no readable words, letters, dates or numerals, no UI, no subtitles, no logo, no watermark, no modern object, no telescope.
```

### Plate 2｜時間流逝

```text
Use case: compositing
Asset type: production cinematic storyboard plate 2 of 3 for a full-screen 16:9 game time-jump montage
Input images: Image 1 is the exact opening endpoint. Image 2 is the exact ending endpoint. Treat both as locked camera, notebook identity, desk perspective, framing and style anchors.
Primary request: Create the single TRANSITION plate exactly between Images 1 and 2. Preserve the same close elevated three-quarter camera, same open leather notebook position, centered spine, overall book scale and walnut desk perspective. Show only one main sheet turning itself across the center in a graceful natural arc, with the soft semi-transparent motion shadow of at most one second sheet immediately behind it; this is a brief two-page rush, not many repeated pages. The turning sheet partly reveals an older yellowed page below. Across the softly defocused upper background, Pisa's candlelit blue rainy study on the left gently dissolves into Padua's pale workshop window and carpentry tools on the right. Candle warmth stretches into cool daylight; ink near page edges appears to dry from dark to faded brown. The center upper third remains calm enough for HTML milestone years to dissolve one at a time.
Style/medium: exact restrained realistic historical oil-illustration treatment of both endpoint images; cinematic motion conveyed by one elegant page arc and restrained edge blur, never cheap CGI.
Composition/framing: exact 16:9; all essential content inside central 80 percent for mobile landscape crop. The book's outer cover, desk edge and centered spine must align closely with Images 1 and 2 for cross-fade continuity.
Lighting/mood: eleven years compressed into one breath; melancholy, quiet persistence, no fantasy spectacle.
Constraints: exactly one clearly visible airborne page and no more than one faint secondary page shadow; no stack of flying sheets, no paper storm, no hands, no people, no face, no magic particles, no glowing portal, no clock, no readable words, letters, dates or numerals, no UI, no subtitles, no logo, no watermark, no modern objects, no telescope.
```

### Plate 3｜帕多瓦落頁

```text
Use case: precise-object-edit
Asset type: production cinematic storyboard plate 3 of 3 for a full-screen 16:9 game time-jump montage
Input images: Image 1 is the exact edit target and locked camera, notebook identity, desk placement, framing and oil-illustration rendering. Image 2 is the exact Padua workshop architecture, daylight, canal-side atmosphere and palette reference.
Primary request: Transform Image 1 into the END plate eleven years later, 1603, while preserving the exact camera angle, open leather notebook geometry, scale, spine position, desk perspective and overall framing so the two plates cross-dissolve without a visual jump. Replace the Pisa rainy-night study background with the established Padua workshop in pale late-afternoon daylight: workshop windows, rough carpentry tools and stacked wood softly out of focus in the upper background, with subtle moving canal-light reflections implied on the plaster and tabletop. The same notebook pages are now noticeably older, more yellowed and dry at the edges, with faded brown ink traces near the outer margins. The right-hand page has settled nearly blank and calm, as if waiting for a new chapter; the central page area remains free for HTML year overlay. The previously lifted page has fully landed.
Style/medium: preserve Image 1's restrained realistic historical oil-illustration look, material fidelity and cinematic depth of field.
Composition/framing: exact 16:9; match Image 1's book silhouette and centered spine as closely as possible. Keep all essential content inside the central 80 percent for 844x390 landscape crop.
Lighting/mood: quiet pale Padua daylight replaces candlelit Pisa; reflective, uncanny, time has passed but the question remains.
Constraints: change only time, room, light and paper ageing; no people, no hands, no face, no airborne page, no magical glow, no clock, no readable words, letters, dates or numerals, no UI, no subtitles, no logo, no watermark, no modern objects, no telescope.
```

