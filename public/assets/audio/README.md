# public/assets/audio/ — 真音樂檔投放區(v2)

**規則**:mp3 或 ogg 放進本資料夾 → 到 `greybox/data/assets.js` 與 `.json` 的 `bgmFiles` 把對應 mood 的 `null` 改成檔名(例:`"pisa": "galilei_lute_01.mp3"`)→ 重新整理即播(循環+交叉淡入)。留 `null` 的 mood 自動回退程序化合成。**storm 建議永遠留合成**:現代場景用合成器、1590 用真琴——音色本身就是穿越。

**授權鐵則**:每放入一檔,必須在下表補一列。可收:公共領域(PD)、CC0、CC-BY(需標示)。不可收:CC-NC-ND 以外的限制、來源不明檔。

| 檔名 | mood | 曲目/作曲 | 演奏/來源連結 | 授權 | 記錄人 | 日期 |
|---|---|---|---|---|---|---|
| Piazza_at_Dawn.mp3 | pisa | AI 生成(文藝復興魯特琴風) | Google Gemini(Lyria 3)生成 | 生成內容,依 Google 生成式 AI 條款;生成者持用 | 陳育詮(生成)/Claude(記錄) | 2026-07-20 |
| Sun_Through_Lattice.mp3 | study | 同上 | 同上 | 同上 | 同上 | 2026-07-20 |
| Midnight_at_the_Casement.mp3 | rain | 同上 | 同上 | 同上 | 同上 | 2026-07-20 |
| Beneath_the_Chisel.mp3 | workshop | 同上 | 同上 | 同上 | 同上 | 2026-07-20 |
| Counsel_of_Strings.mp3 | hall | 同上 | 同上 | 同上 | 同上 | 2026-07-20 |
| Where_The_Sun_Rests.mp3 | dusk | 同上 | 同上 | 同上 | 同上 | 2026-07-20 |

## 生成紀錄(供 Sol 審核,2026-07-20)

六曲由總監以 Google Gemini(Lyria 3)生成;提示詞由 Claude 撰寫如下(共同鐵則:純器樂、無人聲、可無縫循環、音量平穩不搶台詞):

1. **pisa**:文藝復興時期魯特琴獨奏,溫暖明亮的義大利清晨氛圍,節奏舒緩,稀疏的撥弦,約兩分鐘
2. **study**:安靜的文藝復興魯特琴獨奏,沉思與專注的書房氛圍,緩慢簡約,低音量背景
3. **rain**:憂鬱的文藝復興帕凡舞曲,魯特琴獨奏,緩慢哀愁,小調,雨夜氛圍
4. **workshop**:文藝復興義大利工坊氛圍,魯特琴與輕柔維奧爾琴,溫暖專注、帶一點勞動節奏感,中慢板
5. **hall**:緊張莊嚴的文藝復興低音維奧爾琴重奏,深沉低音,對峙的壓迫感,緩慢沉重,小調
6. **dusk**:空靈安靜的文藝復興魯特琴小品,黃昏與釋然的氛圍,極簡緩慢,高音區清澈

**設計備註**:storm(序幕)恆為程式合成(現代=合成器、1590=真琴,音色即穿越,測試鎖定);場景→mood 映射見 `greybox/data/assets.json` 之 `sceneBgm`;檔缺=回退程序化鋪底(丁丁丁撥弦層已停用)。
**待 Sol 審**:①六曲聽感 QA(循環接縫/音量/與台詞打架否);②覆蓋缺口表態——候選新 mood:標題畫面(現靜音)、A3-F 複盤(現沿用 workshop)、判定場勝利短奏(sting)、SC-R1 修復(現沿用 workshop);每檔約 0.7MB,總預算內可再收 2–4 首;③提示詞措辭如需修訂(樂器/時代準確性)請直接標註。

**選曲指南(Claude 策展,2026-07-20)**:見專案根 README 連結之裁決檔「二之二、音訊分工」;首選 Vincenzo Galilei(伽利略之父,魯特琴)→ pisa/study;Dowland(Lachrimae 類憂鬱曲)→ rain;Barbetta(帕多瓦魯特琴手)→ workshop;Tobias Hume(維奧爾琴,低弦)→ hall;Dowland 空靈小品 → dusk。單檔 ≤3MB、單曲 2–4 分鐘可循環者佳;總量控制在 10MB 內。
