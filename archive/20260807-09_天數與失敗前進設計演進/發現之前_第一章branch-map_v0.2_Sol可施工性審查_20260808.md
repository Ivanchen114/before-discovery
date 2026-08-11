---
bd_artifact: feasibility-review
bd_chapter: ch1
bd_source: 02_設計/發現之前_第一章選擇後果地圖_branch-map_v0.1_Fable_20260808.md
bd_source_internal_version: v0.2
bd_status: changes-required-before-script
---

# 第一章 branch map v0.2｜Sol 可施工性審查

**日期**：2026-08-08  
**審查者**：GPT-5.6 Sol（ADR-015：runtime、狀態、存檔與成本邊界）  
**範圍**：唯讀查核 `scenes.json`、`patterns.json`、`debate.json`、`engine.js`、`narrative.js`、`chapter-ui.js`、`sanitize.js` 與現行測試；**未修改 runtime**。  
**結論**：**CHANGES REQUIRED**。A2-2 作為第一章承重岔口可保留，但 v0.2 的「d∝t 和 d∝t² 在短段誤差內都成立」不符現行 fixture，1604 年史實錯法也標錯。兩點修正前，Fable 5 不應展開完整劇本；本結論不否定總監已裁的 A2-2 選點。

## 一、兩個阻擋項

### A-1｜「前兩段兩法則都在誤差內」與現行 fixture 相反

- `engine.js::runExperiment()` 每次直接產生五段增量；UI 先顯示前四段，`judge(runIds, prediction)` 才把數值押記和第五段對帳。現行沒有「先量兩個短段→換精準工具→再加長」的段階狀態。
- `patterns.json` 的誤差維度是計時工具×傾角、槽面與球；探索／學者模式共用同一個 `Engine`，沒有模式專屬的物理誤差。
- 以現行 54 種配置×3 種樣式全枚舉，162 組中有 30 組通過現行 12% 奇數律門檻。這 30 組的前兩刻累積距離比 `s(2)/s(1)` 在 **3.695–4.033**；`d∝t` 應為 2，`d∝t²` 應為 4。所以只要資料乾淨到能入筆記，線性距離律已在第二刻被排除，不會「第三段仍以為押中」。
- 若為了劇情把誤差放大到兩法則都能解釋，會新造一套測量物理，也會撞現行 E3.a、sanitizer 重算與歷史存檔。這不是台詞級成本。

### A-2｜1604 年錯誤原理是 `v∝s`，不是 `d∝t`

- 1604-10-16 致 Paolo Sarpi 的信確實把一個後來被伽利略放棄的原理當作出發點：**速度隨已走距離成比例**（`v∝s`）。他同時在信中宣稱得到距離與時間平方成比例、等時間距離為奇數列；後來修正的是「速度對距離」原理，改為速度對時間。
- 因此 v0.2 「伽利略本人曾押 d∝t」不可進史實文案。可查 [Treccani 機械史條目](https://www.treccani.it/enciclopedia/la-meccanica_%28Il-Contributo-italiano-alla-storia-del-Pensiero%3A-Scienze%29/)、[Max Planck Institute 所收信件英譯](https://www.mpiwg-berlin.mpg.de/sites/default/files/Preprints/P97.pdf) 與 [Stillman Drake 的 1604 手稿研究](https://www.cambridge.org/core/journals/british-journal-for-the-history-of-science/article/abs/galileos-1604-fragment-on-falling-bodies-galileo-gleanings-xviii/8C3C236DD4C9D570A1D22C4359434445)。
- `v∝s` 雖是很好的史實傷痕，卻不應在一般玩家第一章直接做成新公式題；若要用，必須另設白話可操作的對立預測，不能只把 `d∝t` 改成 `v∝s` 就開工。

## 二、四個技術查證題回覆

### 1. 押記應落 engine 還是 scenes？

**結論：不可用 scenes 假裝數據檢驗，也不應破壞現有數值 `judge()`。**

- 純 scenes 方案只能記一個對話 flag，無法證明預畫線是由當前原紙重算。存檔可伪造，也會把物理判斷偷放 UI。
- 直接把 `judge(prediction:number)` 改成 `judge(rule:string)` 會改動所有 numeric claim、E3.a、sanitizer 封閉重算、UI 與舊存檔，成本太高。
- 若未來仍需「法則押記」，正確切法是新增一個獨立 `hypothesis` 封套（具名 enum、來源 run、押記時點、預測線、揭曉結果），而現有 `judge()` 照舊處理第五段數值認證。此案會動 `engine.js`、`narrative.js`、`chapter-ui.js`、`sanitize.js`、資料鏡像與測試，屬 R3 狀態／存檔變更。

**本章推薦不走新 `hypothesis` 封套**，改用現成 numeric claim 作為戲劇岔口，見第三節。

### 2. 是否已有短段粗計時／加長段精計時？

**沒有。**現行只有五段固定 fixture、三種計時器和傾角相依的誤差強度。一次 run 會把五段全數產生，UI 只把第五段延後翻開。探索模式若要落地「前兩段模糊」，必須重寫 fixture 語意；不能只改台詞。

### 3. `hadFailure` 能否復用？

**不可拿它當本岔口身分。**

- `hadFailure` 會在任一 `judge` 主張未成立或選紙被拒時設為 `1`；它包含混入不同配置、數值猜錯、誤差太大等多種原因。
- A2-2/c1 用它讀回「前幾張作廢紀錄」；若把一次有價值的錯誤預測也冒充作廢紀錄，語意會打架。
- 推薦直接由現有 claims 派生「有過 `consistent=true && predHit=false`」；這正是「紙形狀站得住，但玩家延伸第五段時押錯」，不必新增裸 flag。若日後有另一種獨立假說，才新增具名事件，並讓 sanitizer 驗證因果鏈。

### 4. A3-D P2 可否追加可選讀回？

**原指定位置不成立。**

- 現行 P2 是「權威」支柱，用 E2 綁縛矛盾反駁；沒有「規律是不是湊的」這一問。與斜面規律直接相關的是 P3（E3.b）或最後 FR。
- 每柱 `reasonMode=player` 目前必須正好三個 response、且正確項正好一個；引擎也不支援依章狀態顯示第四個「失敗資產」回覆。直加會破壞 R-DEB 契約。
- 低成本讀回：在 A3-1 進辯論前加一個條件反應，或在 P3 擊破後加非計分條件台詞。
- 若總監要求「玩家在辯論中主動打出這張傷痕」，應另建 P3 `optional_probe` 資料契約，加條件可見性與測試；這是中成本 engine/UI 變更，不是純文本。

## 三、推薦給 Fable 5 的 v0.3 修法

**保留 A2-2，改養「第五段數值押錯」，不新造 d∝t 法則。**

1. 玩家以現行前四段原紙押第五段數值。
2. 世界把這個數值當真：桌上依預測畫下蠟線／粉筆線，或把接球盤放到預測位置。
3. 第五段翻開，球越過或未到預畫線；現行 `claim.predHit=false` 就是世界打臉的權威。
4. NPC 不報正解，只要求玩家指出自己如何延伸。玩家修正預畫線再驗一次；錯線和 failed claim 保留。
5. 只有形狀本身已站得住、數值押錯（`consistent && !predHit`）才進此枝；器材混亂或選紙錯誤照原診斷迴路。
6. 後文讀回放 A3-1 或 P3 後，不放 P2。是否要做成玩家主動打出的 `optional_probe`，由總監在 v0.3 再裁成本。

這個修法保留總監的核心：**玩家押下去→世界依它行動→現實用紙帶反駁→玩家自己修正→後文還記得**。它不需要把一個錯誤史實公式教給一般玩家，也不必重寫整套 fixture。

## 四、下一棒與 Gate

1. Fable 5 將 branch map 修為 v0.3，只需回應 A-1、A-2 與讀回位置；不必重做 19 個 choice 盤點。
2. Sol 對 v0.3 做一次快速可施工性複核；PASS 後 Fable 5 才展開劇本。
3. 劇本完成後，Sol 另立 R3 功能規格，列明 state 派生、舊存檔、反伪造、辮論讀回與負向測試。
4. 總監明示簽「DESIGN GATE：PASS／可施工」且 ch3 spike 執行品質 Gate 滿足 ADR-014 排程後，才允許修改 `greybox/`。

## 五、當前驗證

- 查證前基線：`cd greybox && npm test` → **166 通過，0 失敗**。
- 本審查未修改 `greybox/data/*`、`greybox/src/*` 或測試。
- 本輪唯一另外文件變更：依 Fable 5 B-1 指示，將《設計原則手冊》K 節「適用與紀律」移回 L 節之前，內容不變。
