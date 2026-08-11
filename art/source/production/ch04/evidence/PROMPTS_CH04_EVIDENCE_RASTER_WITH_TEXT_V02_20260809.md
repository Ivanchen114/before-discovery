---
bd_artifact: art-generation-record
bd_chapter: ch4
bd_status: art-locked
bd_art_lock_date: 2026-08-09
bd_art_lock: "PASS — CH4 K1 v02 + K4 no_loans／planets_loan／comet_loan v03 + both_loans v04"
supersedes_for_k1_k4: PROMPTS_CH04_EVIDENCE_RASTER_WITH_TEXT_V01_20260809.md
---

# 第四章證據卡單張含字生成 v0.2（Art Locked）

日期：2026-08-09  
工具：Codex 內建 ImageGen  
真相模式：TO-BE Art Locked；尚未接入 runtime

## 本輪結論

- K1 重建為「三張試跑紙＋舊切線紙」的完整 raster；玩家實選數值不烘焙。
- K4 依 runtime 真值重建，淘汰舊 SVG／v01 raster 的假對稱數據。
- K4 有四張完整扁平 raster：不借、只借行星、只借彗星、兩格都借；runtime 日後依取得時封存的 `evidencePackage.stamps[].loanDecision` 選整張圖。
- K3、K5 保留 v01 候選，不重抽。
- 不覆蓋現行 SVG、不接 assets mapping、不改 runtime。
- v02 K4 曾通過構圖與數據檢查，但字體聲部未分清，降為過程稿；v03 才是本輪字體語義候選。

## 字體聲部鎖定

依設計原則 29，證據成品按「誰寫下這些字」分聲部，而不是按字位於哪張紙：

- **旅人／玩家親筆（楷書手寫感）**：卡名、副題、筆記結論、玩家親手加上的借條。
- **1590 世界文件（明體／宋體刻本感）**：對帳冊欄名、資料、說明、未借狀態；西文與數字用節制的十七世紀銅版感。
- **章痕**：是玩家操作世界器物留下的印記，字形屬世界側的預刻章，不改成玩家手寫。
- 禁用篆隸、魏碑與額外古典標題字；年代感來自紙、墨、字距與印刷質感。

這裡的「楷書／明體感」是生成器的美術指示，不是指定或嵌入字型檔。HTML 的 `--font-hand` 仍是 provisional；RC 前另須完成 OFL 手寫子集出貨。

## K1｜一直改向的路（v3）

輸出：`ch04_card_K1_orbit_deflection_raster_candidate_v02.png`  
原生尺寸：1586×992

> 十七世紀英格蘭石屋書房木桌，俯視略斜（約 25°），燭光偏暖。畫面中央（受光、清晰）：三張試跑紙。每張紙上先以極淡墨畫著兩條平行的細界線（窄帶），帶內一條較深的墨線軌跡與沿線幾個小墨點。第一、二張：軌跡都留在窄帶內，但彎折程度肉眼可辨地不同（一張彎得緊、一張彎得緩）。第三張：半壓在前兩張之下，只露出局部——可見其墨線衝出窄帶界線的那一小段，線的去向（向內或向外）被上層紙面遮住。三張紙旁壓著第四張明顯更舊、泛黃起皺的紙，隱約一條直線草圖（十四年前切線預測紙，內容不需可讀）。畫面周邊（暗部桌角）：木球靜置、細麻繩鬆弛蜿蜒，失焦，不搶焦點。
>
> 紙面上除墨線、墨點與淡界線外，不得出現任何文字、數字或類文字筆畫。圖中文字僅三處（旅人楷書手寫感，逐字）：標題「一直改向的路」；結論兩行「保留原來的前進，每一拍又朝當下地球偏一點。」「偏多少，必須與原來的速度相配。」
>
> 負面提示：光滑完成圓、紙面出現字樣或數字、第三張紙的出帶方向可判、繩球居中、現代字體、座標軸、代號、浮水印。

驗收：三張試跑紙與舊切線紙在場；兩張帶內路徑彎折不同；紙面無數字；三處旅人文字正確；無內部代號。

## K4｜一條規則穿過三種天空（v3）

### 共用固定區

四張都以同一 v03-A 母版生成；固定區只用世界文件聲部：

- 反平方 Moon：章「對得上」；「殘差 0.36%」
- 反平方 Planets：章「對得上」；「兩筆較大殘差 0.32%」
- 反平方 Comet：章「方向對得上」；「此列只判方向，不出百分比」
- 簡單渦旋 Moon：章「只有說法」；「沒有交出可核對數字」
- 簡單渦旋 Planets：章「對不上」；「推得 6.4 年，實測 11.86 年——差 45.8%」
- 簡單渦旋 Comet：章「方向相反」；「與固定流向衝突」

卡名與副題使用旅人聲部：

- 「一條規則穿過三種天空」
- 「不能只挑會贏的一格；兩個模型都跑 Moon、Planets、Comet。」

固定負面提示：渦旋 Moon 或任一 Comet 格出現百分比、改動六格章痕、假對稱數據、同一手寫字覆蓋所有聲部、篆隸魏碑、中國古風花字、現代 UI、代號、浮水印。

### A｜都不加借條

輸出：`ch04_card_K4_model_comparison_no_loans_raster_candidate_v03.png`  
原生尺寸：1586×992

- Planets、Comet 各留世界側狀態：「未加借條｜失配保留」。
- 旅人總結逐字：

> 三份資料、兩套固定規矩：拉力帳三格都對得上；漩渦帳一格只有說法，另外兩格對不上。這只比較同一規則跨資料的表現，不等於已說明拉力如何穿過空間。

### B｜只借行星

輸出：`ch04_card_K4_model_comparison_planets_loan_raster_candidate_v03.png`  
原生尺寸：1586×992

- Planets 的未借狀態改成玩家楷書借條：「木星那一層另設流速」。
- Comet 維持「未加借條｜失配保留」。
- 旅人總結逐字：

> 拉力帳三格都對得上。漩渦帳的行星格改了流速表才貼合，借條仍在；彗星格對不上。這只比較同一規則跨資料的表現，不等於已說明拉力如何穿過空間。

### C｜只借彗星

輸出：`ch04_card_K4_model_comparison_comet_loan_raster_candidate_v03.png`  
原生尺寸：1586×992

- Planets 維持「未加借條｜失配保留」。
- Comet 的未借狀態改成玩家楷書借條：「彗星可以穿過流（未量過）」。
- 旅人總結逐字：

> 拉力帳三格都對得上。漩渦帳的彗星格靠未量過的穿流假設才講得通；行星格對不上。這只比較同一規則跨資料的表現，不等於已說明拉力如何穿過空間。

### D｜兩格都借

輸出：`ch04_card_K4_model_comparison_both_loans_raster_candidate_v03.png`  
原生尺寸：1586×992

- Planets 玩家楷書借條：「木星那一層另設流速」。
- Comet 玩家楷書借條：「彗星可以穿過流（未量過）」。
- 旅人總結逐字：

> 拉力帳三格都對得上。漩渦帳原先兩格失配；每次改成講得通，逐案新增的代價都留在借條上。這只比較同一規則跨資料的表現，不等於已說明拉力如何穿過空間。

#### D-1｜Art Lock 前括號定點返工

輸出：`ch04_card_K4_model_comparison_both_loans_raster_candidate_v04.png`  
最終尺寸：1586×992  
編修來源：both_loans v03  
工具：Codex 內建 ImageGen，`text-localization / precise-object-edit`

- Fable Art Lock 前審圖發現 v03 彗星借條的結尾括號誤成半形。v04 只核准一項文字
  修正，逐字固定為「彗星可以穿過流（未量過）」；左括號為全形 `（`（U+FF08），
  右括號為全形 `）`（U+FF09）。此形制同時約束 comet_loan 與 both_loans。
- 編修 prompt 明文保護六格資料、印章、行星借條、總結、構圖、光線與所有其他文字；
  人工原尺寸比對未見其他語意漂移。
- ImageGen 原始輸出為 1585×992；僅以 `sips` 做 1 px 水平尺寸正規化至 1586×992，
  沒有加疊字、遮罩、UI 或其他可見拼貼。
- v03 保留為修正前 provenance，不再作 both_loans 的 Art Lock 候選；v04 尚未接 runtime，
  已由總監補批 Art Lock；v04 為 both_loans 唯一可接線版本。

## Art Lock 清單與完整性雜湊

總監裁決：
`ART LOCK: PASS — CH4 K1 v02 + K4 no_loans／planets_loan／comet_loan v03 + both_loans v04`

| 用途 | 鎖定來源檔 | SHA-256 |
|---|---|---|
| K1 固定摘要 | `ch04_card_K1_orbit_deflection_raster_candidate_v02.png` | `4bb170a8c175dc9888682024ec65cd5c7040099ad3dcc9fe1aa06c6cc95b079b` |
| K4 不借 | `ch04_card_K4_model_comparison_no_loans_raster_candidate_v03.png` | `5d125862cd16f97c82b47f7bf0cbecc63955769b6eebf648b93173684cc16687` |
| K4 只借行星 | `ch04_card_K4_model_comparison_planets_loan_raster_candidate_v03.png` | `66a0c985e9cbd71dc5e18672358baa10630c212a1f9b30d8efdcdc604db43bdf` |
| K4 只借彗星 | `ch04_card_K4_model_comparison_comet_loan_raster_candidate_v03.png` | `e74d3442267f1fbce4d2305fac2d1dca07a7540cc6da5d17380faa2a4427ee62` |
| K4 兩格都借 | `ch04_card_K4_model_comparison_both_loans_raster_candidate_v04.png` | `7c9240725524d032d7e32a982a5ea36ba89e29afd5a6053349431e5fd71a49c8` |

Art Lock 不等於 runtime 接線授權。衍生 WebP／PNG 必須能追溯到上表雜湊；任何重抽、
文字修補或固定區漂移都會解除該張鎖定，須重新審圖。

## 變體工法與驗收

- A 是核准母版；B／C／D 都直接以 A 編修，不串接前一變體。
- 只允許借條區與底部總結改變；固定區語意、章痕、數據與構圖不得漂移。
- 每張輸出都是完整扁平單張 raster，不依賴 runtime 文字疊層。
- 本輪為人工原尺寸目視逐字檢查；尚未完成自動 OCR、讀屏、縮放、瀏覽器或 runtime 驗收。
- 正式接線前須先修現行 K4 SVG 假數據，再另立 runtime CR，讓取得畫面與旅人筆記共用同一個狀態選圖 resolver。

## 保留的既有候選

- `ch04_card_K3_sealed_predictions_raster_candidate_v01.png`
- `ch04_card_K5_scoped_proof_raster_candidate_v01.png`

兩張本輪不重抽；後續只可在核准後做共同比例裁切／縮放與 WebP 輸出。
