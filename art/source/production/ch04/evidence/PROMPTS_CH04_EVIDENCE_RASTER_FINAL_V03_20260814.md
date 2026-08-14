# CH04 K4／K5 完整 raster 封版提示與逐字稿（2026-08-14）

本輪遵守 71-bis：取得後固定摘要卡與有限變體卡皆輸出完整扁平單張 raster；文字烘焙入圖，runtime 不疊字、不以 SVG 修補。舊檔保留作 provenance。

## K4｜白話詞定點編修

### 共通編修約束（逐張都使用）

> Use case: precise-object-edit and text-localization. Image 1 is the ONLY edit target. Produce one complete, fully flattened raster image. Preserve the entire existing composition and every other semantic element: same canvas ratio and crop; same seventeenth-century tabletop, lighting, aged paper, three ledgers, seals, stamps, ink texture, title, subtitle, all Moon/Planets/Comet labels, every number, every result stamp, every other sentence, spacing and object placement. Do not rewrite, translate, correct, reflow, add or delete ANY other text. Do not add UI, overlay layers, watermark, signature, caption, frame, or new objects. The replacement must be crisp, readable Traditional Chinese in the same handwriting style, size, colour and alignment. Return a single complete flat image, not a patch and not an overlay.

### A｜兩格皆未加借條

- 輸入：`ch04_card_K4_model_comparison_no_loans_raster_candidate_v03.png`
- 定點指示：Planets 與 Comet 兩格的「未加借條｜失配保留」逐字換成「未加借條｜原結果保留」；底部總結不得改。
- 輸出：`ch04_card_K4_model_comparison_no_loans_raster_candidate_v04.png`
- SHA-256：`5497d1c4719d403b39cce3d47e15b1b701ec6fb26c062bef8f8ae527b7dab9d7`

### B｜只借行星

- 輸入：`ch04_card_K4_model_comparison_planets_loan_raster_candidate_v03.png`
- 定點指示：只把 Comet 格的「未加借條｜失配保留」換成「未加借條｜原結果保留」；Planets 黃色借條與底部總結不得改。
- 輸出：`ch04_card_K4_model_comparison_planets_loan_raster_candidate_v04.png`
- SHA-256：`58f4170ebb97a27f8cd81b23af1b23566b853df545bcc86dfa4e9d10f172b428`

### C｜只借彗星

- 輸入：`ch04_card_K4_model_comparison_comet_loan_raster_candidate_v03.png`
- 定點指示：只把 Planets 格的「未加借條｜失配保留」換成「未加借條｜原結果保留」；Comet 黃色借條與底部總結不得改。
- 輸出：`ch04_card_K4_model_comparison_comet_loan_raster_candidate_v04.png`
- SHA-256：`9814357465464f520bb172b2667c5249c4f11aeb6a10eba9c660983a2778a692`

### D｜兩格都借

- 輸入：`ch04_card_K4_model_comparison_both_loans_raster_candidate_v04.png`
- 定點指示：底部總結只把「漩渦帳原先兩格失配」換成「漩渦帳原先兩格對不上」。兩張黃色借條、六格固定資料與其餘總結逐字不得改。
- 輸出：`ch04_card_K4_model_comparison_both_loans_raster_candidate_v05.png`
- SHA-256：`313db3355d10c7982d1c71d0f7c644eec1e6670fb2a7cdcb04d28a8b438b4925`

四張皆為 1586×992；以 Pillow 僅做 PNG→WebP q91 衍生，不加文字、遮罩或拼貼。原尺寸目視確認固定區數字、章、借條、結論與指定新詞。

## K5｜六段證明鏈歷史紙面

### 最終 prompt

> Use case: historical scientific evidence card and information design. Create a SINGLE COMPLETE FLAT RASTER IMAGE, landscape 3:2, viewed almost straight down on one large warm ivory laid-paper proof sheet on a dark seventeenth-century English printing table. The paper is an acquired evidence artifact, not a modern UI. Restrained candlelight, subtle deckled edges, letterpress black ink, muted green and dark red ink accents, excellent legibility, generous margins. No people.
>
> COMPOSITION: Top: centered title and subtitle. Middle upper: one horizontal six-step proof chain, each step on its own small paper cartouche connected by a thin hand-inked line with modest arrowheads. Middle lower left: a compact “work divided among four people” credit block in four rows. Middle lower right: a clear “proof boundary” block, visibly set apart but still printed on the same sheet. Bottom: one single-line closing statement.
>
> EXACT TRADITIONAL CHINESE TRANSCRIPT — reproduce character-for-character and do not add or omit text:
>
> TITLE: 能算到哪裡，也要停在哪裡
>
> SUBTITLE: 五張走過的紙接上球殼定理；來源與未知邊界都留在同一張校樣。
>
> SIX CHAIN LABELS, left to right: 原有前進／持續改向／同一把尺／事前預測／三種天空／球殼定理
>
> CREDIT BLOCK HEADING: 這份證明不是一個人的獨白
>
> FOUR CREDIT ROWS:
> Hooke｜提出問題方向與平方反比猜想
> Halley｜1684 追問、催促並推動出版
> Flamsteed｜提供帶日期的天文與彗星觀測
> Newton｜數學證明、球體處理與跨天體整合
>
> BOUNDARY BLOCK HEADING: 證明邊界
>
> BOUNDARY QUESTION: 拉力如何穿過空間？
>
> BOUNDARY ANSWER: 這批資料沒有回答
>
> BOUNDARY SUPPORTING LINES: 同一規則跨過不同尺度／不等於作用原因已解開
>
> FOOTER: 球殼定理讓「從地心量」站得住；不知道的原因仍誠實留白。
>
> TYPOGRAPHY AND AUTHORSHIP: Chinese text should look like clean period letterpress Ming type, not modern sans-serif and not casual handwriting. Latin names and 1684 in restrained seventeenth-century roman type. Keep all Chinese horizontal and readable. The chain may use small muted green round stamps; the boundary may use one muted dark-red bracket or seal. Do not use decorative pseudo-characters.
>
> VISUAL DETAILS: Subtle printer’s registration marks, a small brass compass and a sealed quill lying OUTSIDE the paper at the corners, softly out of focus. The proof sheet remains the sole focal object. The six-step chain must be visually obvious at thumbnail size. Credits and boundary are secondary but readable when enlarged.
>
> NEGATIVE CONSTRAINTS: No SVG look, no dark digital panel, no modern infographic boxes, no glowing effects, no floating cards, no UI chrome, no parchment scroll cliché, no fake mathematical formulas, no portrait, no book cover, no watermark, no signature, no internal codes such as K5, no extra words, no English except the four required surnames, no text overlay outside the historical proof sheet. The result must be a complete flattened historical paper image with all required text baked in.

### 輸出與驗收

- 母版：`ch04_card_K5_scoped_proof_raster_candidate_v03.png`
- runtime：`public/assets/ch04/evidence/ch04_card_K5_scoped_proof_raster_v03.webp`
- 尺寸：1536×1024
- 母版 SHA-256：`a9e4d0dfa7b715b1c82ca552dc3f35a35dd211f189f9882f708bf6927979a4c2`
- 原尺寸人工逐字檢查：標題、副題、六鏈、四人功勞、證明邊界、頁尾全數符合上列逐字稿；無內部代號、無額外文字、無 runtime 疊字。
- 身分：完整生成的歷史紙面「教學校樣」，不是牛頓手稿或《原理》原頁。
