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

**選曲指南(Claude 策展,2026-07-20)**:見專案根 README 連結之裁決檔「二之二、音訊分工」;首選 Vincenzo Galilei(伽利略之父,魯特琴)→ pisa/study;Dowland(Lachrimae 類憂鬱曲)→ rain;Barbetta(帕多瓦魯特琴手)→ workshop;Tobias Hume(維奧爾琴,低弦)→ hall;Dowland 空靈小品 → dusk。單檔 ≤3MB、單曲 2–4 分鐘可循環者佳;總量控制在 10MB 內。
