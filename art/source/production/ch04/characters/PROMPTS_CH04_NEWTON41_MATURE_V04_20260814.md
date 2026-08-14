# 第四章 Newton 成年期共用成熟版肖像生成紀錄

日期：2026-08-14
工具：OpenAI 內建 imagegen（identity-preserve 編修）
用途：讓 1679–1687 場景中的 Newton（約 36–44 歲）在 158–220 px 對話立繪尺寸下，能與 1665 年的 22 歲版本清楚區分。單一成熟版以 1684 前後、約 41 歲的視覺狀態為代表，不宣稱每一年外貌完全相同。

## 問題與邊界

- runtime 原本已正確把 1665 場景接到 `dialogue_newton22`，1679–1687 場景接到 `dialogue_newton41`；後者是成年期共用資產，橫跨約 36–44 歲。
- 舊 41 歲版本只增加少量眼下紋與白領帶；縮小後近似「同一個人換領子」。本次修正的是年齡辨識，不改場景資料或人物 ID。
- 41 歲仍是成熟中年，不畫成 60 歲名人像；不使用白假髮、粉髮、鬍鬚或貴族造型。
- 保留同一人物的眼、鼻、口、臉部骨架、長髮、服裝、姿勢、鏡位與光向。

## 最終提示詞

下列生成提示以 1684 前後的約 41–44 歲作為單一代表造型；runtime 部署範圍較寬，涵蓋 1679–1687（約 36–44 歲），因此這是可讀的成年期共用重建，不是逐年肖像。

> Use case: identity-preserve
> Asset type: transparent dialogue portrait for a historical narrative game
> Primary request: Edit the supplied Isaac Newton portrait so he reads clearly as approximately 41–44 years old even when displayed at only 158–220 px tall. Change only the visible age cues; preserve the same person, identity, facial structure, pose, camera angle, body proportions, crop, seventeenth-century black coat, white neck bands, and restrained serious expression.
> Subject details: keep his long natural dark-brown hair, but give him a subtly receded M-shaped hairline and concentrated gray-brown strands at the temples (about 10–15%, visible at thumbnail size). Add clearly readable but age-appropriate under-eye hollows, faint crow's-feet, modest nasolabial lines, slightly drier/tighter cheeks and jaw, and a more seasoned, contained gaze. He should look mature and intellectually worn, not elderly.
> Style/medium: match the supplied painterly-photorealistic historical portrait exactly; realistic skin and fabric texture.
> Composition/framing: preserve the same three-quarter waist-up composition and generous padding; keep the full silhouette inside frame.
> Background: perfectly flat solid #00FF00 chroma-key background, one uniform color, no shadow, gradient, texture, floor, reflection, or lighting variation. Do not use #00FF00 on the subject.
> Constraints: preserve the recognizable face, nose, eyes, mouth, hair length/color, clothing, pose, lighting direction, and overall palette. No white wig, no powdered hair, no beard or moustache, no 60-year-old appearance, no costume redesign, no extra objects, no text, no watermark, no cast shadow.

## 來源與輸出

- 編修輸入：`art/source/production/ch04/characters/ch04_char_newton41_alpha_v02.png`
- 生成保留檔：`art/source/production/ch04/characters/ch04_char_newton41_chroma_v02.png`
- 透明母版：`art/source/production/ch04/characters/ch04_char_newton41_alpha_v03.png`
- runtime：`public/assets/ch04/characters/ch04_char_newton41_v04.webp`
- runtime 衍生：`python3 greybox/tools/render-ch4-portraits.py`，900×1200、WebP quality 88、alpha quality 100。

去背採專案 imagegen helper 的 auto-key border、soft matte、despill 與 edge-contract；母版與舊 v02/v03 均保留，不覆寫舊版本。

## 驗收

- 完整尺寸下仍是同一位 Newton；眼、鼻、口、長髮、黑衣與姿勢不漂移。
- 小尺寸的主要年齡訊號是後退髮線、鬢角灰褐、眼下凹陷、法令紋與較乾緊的面部，而不是只靠微小皺紋。
- 不出現白假髮、鬍鬚、老人斑或 60 歲以上的外觀。
- 正式資料維持 `dialogue_newton41`；1679–1687（約 36–44 歲）的既有 scene mapping 不變。驗收只要求它與 1665 青年版清楚有別且未顯老態，不宣稱每一場都是精確同齡肖像。
- 自動契約驗 path、sourceMaster、900×1200 與場景映射；實際畫面縮放與裁切仍由總監在瀏覽器確認。
