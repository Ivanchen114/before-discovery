# public/assets/audio/ — 真音樂檔投放區(v2)

**規則 v2**:`bgmFiles[cue]` 使用 `{mode, clips, ambient}`。`once`=30 秒播一次後回程序環境音；`milestone`=A/B/C 依玩法里程碑交叉淡換；`silence`=刻意留白。`storm:null` 恆用程序合成。禁止再把 Gemini 30 秒素材設成無限硬循環。

**授權鐵則**:每放入一檔,必須在下表補一列。可收:公共領域(PD)、CC0、CC-BY(需標示)。不可收:CC-NC-ND 以外的限制、來源不明檔。

| 檔名 | mood | 曲目/作曲 | 演奏/來源連結 | 授權 | 記錄人 | 日期 |
|---|---|---|---|---|---|---|
| Piazza_at_Dawn.mp3 | pisa | AI 生成(文藝復興魯特琴風) | Google Gemini(Lyria 3)生成 | 生成內容,依 Google 生成式 AI 條款;生成者持用 | 陳育詮(生成)/Claude(記錄) | 2026-07-20 |
| Sun_Through_Lattice.mp3 | study | 同上 | 同上 | 同上 | 同上 | 2026-07-20 |
| Midnight_at_the_Casement.mp3 | rain | 同上 | 同上 | 同上 | 同上 | 2026-07-20 |
| Beneath_the_Chisel.mp3 | workshop | 同上 | 同上 | 同上 | 同上 | 2026-07-20 |
| Counsel_of_Strings.mp3 | hall | 同上 | 同上 | 同上 | 同上 | 2026-07-20 |
| Where_The_Sun_Rests.mp3 | dusk | 同上 | 同上 | 同上 | 同上 | 2026-07-20 |
| Traveler_Theme_Title_A.mp3 | travelerTitle | AI 生成(BGM v2 提示詞包) | Google Gemini(Lyria)生成 | 同上 | 陳育詮(生成)/Sol(提示詞與整合) | 2026-07-20 |
| Traveler_Theme_Moon_B.mp3 | travelerMoon | 同上 | 同上 | 同上 | 同上 | 2026-07-20 |
| Eleven_Years_Time_Passage.mp3 | timePassage | 同上 | 同上 | 同上 | 同上 | 2026-07-20 |
| Workshop_Inquiry_A.mp3 | workshop A | 同上 | 同上 | 同上 | 同上 | 2026-07-20 |
| Workshop_Inquiry_B.mp3 | workshop B | 同上 | 同上 | 同上 | 同上 | 2026-07-20 |
| Workshop_Inquiry_C.mp3 | workshop C | 同上 | 同上 | 同上 | 同上 | 2026-07-20 |
| Debate_Hall_A.mp3 | challenge / hall A | 同上 | 同上 | 同上 | 同上 | 2026-07-20 |
| Debate_Hall_B.mp3 | hall B | 同上 | 同上 | 同上 | 同上 | 2026-07-20 |
| Debate_Hall_C.mp3 | hall C | 同上 | 同上 | 同上 | 同上 | 2026-07-20 |
| Debate_Debrief.mp3 | debrief | 同上 | 同上 | 同上 | 同上 | 2026-07-20 |

`Beneath_the_Chisel.mp3` 與 `Counsel_of_Strings.mp3` 為 v1 音色 proof，v2 runtime 已解除引用但保留作回退／審計；其餘 v1 四首仍作 pisa、study、rain、dusk 的 A 段。獨立 `Challenge_Letter_Simplicio.mp3` 未落地，現以 `Debate_Hall_A.mp3` 提前曝光辛普里奧主題，作 A2-5 → A3 的音樂伏筆。

## BGM v2 runtime（Sol 整合，2026-07-20）

- 標題首次手勢：`Traveler_Theme_Title_A`，一次播放。
- P0-0：`storm` 程序合成；進 1590 切實樂器。
- 高塔放手／證據被吃、A3 判定：`silence`，刻意留白。
- INT-1：十一年蒙太奇一次播放。
- 工坊：A=入場；B=E3.a 第一筆規律成立；C=E3.c 完成／進入對照實驗。
- 挑戰信：借用 Debate A 一次，作辛普里奧主題預告。
- 辯論：A=開庭；B=第二柱擊破；C=最後反撲／誠實陷阱。
- A3-F：複盤一次播放；SC-R1 回到工坊 A。
- E-2：旅人月球版一次播放。

完整提示詞與檔名：`PROMPTS_BGM_V2_GEMINI_20260720.md`。

## 生成紀錄(Sol 已審 2026-07-20:**候選、未凍結**)

**歷史審核狀態**(依 `05_審核/發現之前_第一章BGM與GB-ADR-011驗證_Sol_20260720.md`):v1 六檔皆約 30 秒，曾因 `loop=true` 造成單調；v2 已取消硬循環，改為單次 cue＋里程碑變奏＋環境音。仍須真人 G8 抽查相對音量、對白遮蔽與 A/B/C 交叉淡換。

**授權補記**(公開發佈用,Sol BGM-3):Lyria 生成內容含 SynthID 數位浮水印,**不得移除**。生成紀錄——生成日期:2026-07-20;工具:Google Gemini 應用內音樂生成(Lyria,短片段版;非 Lyria Pro 長曲);生成帳號類型:【待總監填:免費/Google AI Pro】;適用條款:Google 生成式 AI 使用條款+Gemini 應用音樂生成說明(https://support.google.com/gemini/answer/16901237,查閱日 2026-07-20)。若日後以 Pro 重生長版,本欄逐項更新。

六曲由總監以 Google Gemini(Lyria)生成;提示詞 v1 由 Claude 撰寫如下(共同鐵則:純器樂、無人聲、可無縫循環、音量平穩不搶台詞):

1. **pisa**:文藝復興時期魯特琴獨奏,溫暖明亮的義大利清晨氛圍,節奏舒緩,稀疏的撥弦,約兩分鐘
2. **study**:安靜的文藝復興魯特琴獨奏,沉思與專注的書房氛圍,緩慢簡約,低音量背景
3. **rain**:憂鬱的文藝復興帕凡舞曲,魯特琴獨奏,緩慢哀愁,小調,雨夜氛圍
4. **workshop**:文藝復興義大利工坊氛圍,魯特琴與輕柔維奧爾琴,溫暖專注、帶一點勞動節奏感,中慢板
5. **hall**:緊張莊嚴的文藝復興低音維奧爾琴重奏,深沉低音,對峙的壓迫感,緩慢沉重,小調
6. **dusk**:空靈安靜的文藝復興魯特琴小品,黃昏與釋然的氛圍,極簡緩慢,高音區清澈

**設計備註**:storm(序幕)恆為程式合成(現代=合成器、1590=真琴,音色即穿越,測試鎖定);場景→mood 映射見 `greybox/data/assets.json` 之 `sceneBgm`;檔缺=回退程序化鋪底(丁丁丁撥弦層已停用)。

**v1 重生成護欄（已由上方 30 秒模組提示詞包取代，留作歷史）**:

> 純器樂;晚期十六世紀義大利室內樂氣質;稀疏編制、低資訊密度、穩定小動態,讓中文對話永遠在前景;乾燥而自然的小房間聲學;開頭與結尾使用可相接的同一和聲與殘響尾,不淡出、不做終止式。禁止人聲、合唱、現代鋼琴、現代弦樂團、合成器 Pad、電影預告片鼓、低頻衝擊與巨大殘響。完整曲目 60–120 秒,可無縫循環。

個別補充:hall=張力來自克制的模仿與不協和延宕,不寫「深沉低音重奏」;dusk=「清澈、留白、乾燥室內聲」取代「空靈」;rain=帕凡的沉著步伐,不用現代小調悲傷語法。

**擴充裁定 v2**:標題、複盤與 A/B/C 變奏已落地；判定暫用沉默＋既有悶響，不另造假勝利短奏。SC-R1 沿用 workshop A——道歉不是悲情配樂，而是重新做一次乾淨工作。

**選曲指南(Claude 策展 2026-07-20;史實錨定依 Sol 審核修正)**:見專案根 README 連結之裁決檔「二之二、音訊分工」;首選 Vincenzo Galilei(伽利略之父,魯特琴)→ pisa/study;Dowland《Lachrimae》(1604,英國作品——**僅作情緒參考,非帕多瓦現場曲目**)→ rain;Barbetta(帕多瓦魯特琴手)→ workshop;**晚期文藝復興維奧爾琴合奏** → hall(原 Tobias Hume 錨定已刪:其曲集出版於 1605,晚於 1604 判定場);Dowland 式小品 → dusk。單檔 ≤3MB、總量 10MB 內。
