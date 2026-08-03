# 第五章《兩本帳，哪一本是真的？》Gemini／Lyria BGM 正式提示詞 v0.1

日期：2026-08-04
用途：供 Gemini／Lyria 生成第五章正式場景配樂。每一段提示詞都能獨立貼入，不依賴前文。

## 共同聲音識別

第五章的核心不是「哪一本帳打敗另一本帳」，而是：同一批碰撞資料，可以由兩種量來記帳；其中一本在所有碰撞中守恆，另一本在非彈性碰撞裡留下可測量的短少。音樂應讓玩家感到兩套規律同時成立、彼此拉扯，最後學會替兩本帳各自劃出適用邊界。

- 時代與地域：1740 年代法國室內樂語彙，不使用十九世紀浪漫派或現代電影配樂寫法。
- 固定調式：A Dorian。不要轉成明亮大調勝利終止，也不要用陰森小調把任何角色寫成反派。
- 核心編制：低音維奧爾琴（viola da gamba / bass viol）、高音維奧爾琴或巴洛克小提琴、羽管鍵琴、泰奧波琴。只有開場與尾聲可少量使用木製橫笛（traverso）。
- 「第一本帳」動機：低音維奧爾琴奏 `A3–B3–C4–B3`，節奏為四分、四分、二分、二分；沉著、等距、可核對。
- 「第二本帳」動機：高音維奧爾琴奏 `A4–C5–D5–E5`，同樣節奏為四分、四分、二分、二分；較有上升感，但不能英雄化。
- 「短少」的表現：不要增加戲劇性不協和音；直接讓第二本帳動機最後的 `E5` 消失，留下自然休止，像帳頁上少了一欄。
- 節奏：以 6/4 或寬鬆的 3/2 為主，速度約 54–72 BPM；保留書寫、等待與比較的空間。
- 混音：小型木質房間、近距離室內樂、自然殘響；不要做成宏大宮廷舞曲。
- 每首長度：30 秒。約 28.5 秒結束主要音樂，留下自然尾韻；不要硬切、不要設計無縫循環。程式會在每次播放後保留約 5 秒沉默。
- 全章禁用：現代鋼琴、現代交響弦樂團、合成器 pad、電影鼓、預告片低頻、鐘錶聲、算盤／收銀機／翻帳本擬音、勝利號角、悲情獨奏、超級英雄式「女性天才」主題。

---

## 01｜西雷城堡：兩本帳尚未打開

建議檔名：`Ch5_Cirey_Open_Book.mp3`

```text
Create a 30-second historically grounded French chamber cue for a narrative physics game set at Cirey in the 1740s. Use A Dorian, slow 6/4 at about 58 BPM. Instrumentation: viola da gamba, pardessus de viole or restrained baroque violin, harpsichord, theorbo, and only a faint wooden traverso color. Begin with sparse harpsichord notes and quiet theorbo, as if pages of Newton's Principia and fresh printer's proofs are spread across a table at night. Introduce the low ledger motif A3-B3-C4-B3 in viola da gamba, then let the upper viol answer with A4-C5-D5-E5, but do not resolve either motif as the winner. The mood is intelligent, intimate, curious, and slightly unsettled: a question has entered the room before anyone knows its answer. Avoid triumphant genius music, romance, tragedy, mystery clichés, clocks, page-turn sound effects, percussion, modern piano, orchestral strings, synthesizers, and cinematic swells. End the main phrase around 28.5 seconds with a natural chamber-room decay, not a loop and not a hard cutoff.
```

## 02｜杜佩的舊帳：一筆都對得上的世界

建議檔名：`Ch5_Dupre_Ledger.mp3`

```text
Create a 30-second historically grounded French chamber cue for a narrative physics game in 1740. Use A Dorian, steady 3/2 at about 62 BPM. Instrumentation: viola da gamba, dry harpsichord, theorbo, and a restrained baroque violin. The cue represents a careful accountant of collisions whose records have balanced for thirty years; he is a respectable opponent, not a villain. Repeat the low ledger motif A3-B3-C4-B3 in clear equal phrases, with harpsichord responses that close neatly and leave no flourish. Let the upper instrument occasionally attempt the second motif A4-C5-D5-E5, but keep it quiet and unfinished, suggesting that another way of counting has not yet been tested. The feeling should be orderly, credible, stubborn, and human. Do not use sinister bass, comic bookkeeping sounds, clocks, coins, cash-register effects, military rhythm, modern piano, orchestral strings, synthesizers, or cinematic tension. End the main phrase around 28.5 seconds with a clean but not victorious cadence and natural room decay.
```

## 03｜碰撞台 A：先把問題封存

建議檔名：`Ch5_Collision_Workbench_A.mp3`

```text
Create a 30-second historically grounded French chamber cue for an interactive collision workbench in a 1740s narrative physics game. Use A Dorian, measured 6/4 at about 60 BPM. Instrumentation: viola da gamba, high viol or restrained baroque violin, harpsichord, and theorbo. The player is arranging two balls, choosing conditions, and committing to a prediction before seeing the result. Present the low ledger motif A3-B3-C4-B3 and the upper ledger motif A4-C5-D5-E5 as two separate unanswered statements, with a short breath of silence between them. Keep the rhythm tactile and deliberate, like placing apparatus and writing a sealed prediction, but do not imitate impacts or laboratory sound effects. The music must not reveal which quantity will balance or what the collision will prove. Mood: focused anticipation, careful comparison, player agency. Avoid suspense drones, countdowns, percussion hits, ticking, modern piano, orchestral strings, synthesizers, victory cadences, and cinematic build-ups. End the main material near 28.5 seconds with an open A-Dorian sonority and natural decay, not a loop.
```

## 04｜碰撞台 B：第一本帳對上，第二本帳留下空格

建議檔名：`Ch5_Collision_Workbench_B.mp3`

```text
Create a 30-second historically grounded French chamber cue for the moment after a player has collected enough collision records to compare two accounting rules. Use A Dorian, calm 6/4 at about 64 BPM. Instrumentation: viola da gamba, high viol or baroque violin, harpsichord, and theorbo. Let the low ledger motif A3-B3-C4-B3 complete evenly and return with quiet confidence. Then play the upper ledger motif A4-C5-D5, but replace its final E5 with a clear natural rest: the absence itself represents a measurable shortfall, without horror or melodrama. Alternate the two motifs so the player hears that both are meaningful observations, not a simple good-versus-bad answer. The cue should feel like evidence becoming legible after hands-on work. Avoid triumphant discovery music, sad loss music, impact effects, clocks, counting sounds, modern piano, orchestral strings, synthesizers, percussion, and cinematic swells. Finish the main phrase around 28.5 seconds with both instruments present but neither dominating, followed by natural room decay.
```

## 05｜碰撞台 C：同一批原紙，換一種讀法

建議檔名：`Ch5_Collision_Workbench_C.mp3`

```text
Create a 30-second historically grounded French chamber cue for a narrative physics game in which the player rereads the exact same collision records using a second quantity. Use A Dorian, spacious 3/2 at about 56 BPM. Instrumentation: viola da gamba, pardessus de viole or restrained baroque violin, harpsichord, and theorbo. Begin with the low ledger motif A3-B3-C4-B3 in the bass viol. Without changing tempo or pulse, let the upper viol reinterpret the same harmonic ground with A4-C5-D5-E5. On one repetition, omit the final E5 and leave a rest, suggesting that the second account sometimes has a missing entry. The essential feeling is not repetition or grind, but the surprise that unchanged evidence can answer a different question. Keep the texture transparent and analytical, with no winner. Avoid literal impact sounds, ticking, arithmetic sound effects, dramatic dissonance, modern piano, orchestral strings, synthesizers, percussion, and heroic discovery music. End near 28.5 seconds with an unresolved but calm A-Dorian tail and natural decay.
```

## 06｜黏土記憶：速度留下不同深度

建議檔名：`Ch5_Clay_Remembers.mp3`

```text
Create a 30-second historically grounded French chamber cue for a 1740s physics investigation using clay impressions to preserve the effect of different collision speeds. Use A Dorian, slow 6/4 at about 54 BPM. Instrumentation: muted viola da gamba, high viol, sparse harpsichord, and theorbo. Build three related phrases of increasing reach: the first compact, the second wider, the third wider again, while keeping the underlying pulse unchanged. Let the upper ledger motif A4-C5-D5-E5 gradually occupy more space, but do not state a mathematical answer or create a triumphant revelation. The cue should evoke material memory: clay quietly keeping what the eye would otherwise lose. It must support close observation and comparison, not tell the player that a square law is correct. Avoid squishing or impact sound effects, rising cinematic ostinatos, modern piano, orchestral strings, synthesizers, percussion, clocks, and victory cadences. End the main phrase around 28.5 seconds with one sustained high-viol note fading over a quiet bass-viol A, followed by natural room decay.
```

## 07｜辯論 A：兩本帳同時攤開

建議檔名：`Ch5_Ledger_Debate_A.mp3`

```text
Create a 30-second historically grounded French chamber debate cue for a narrative physics game set in 1740. Use A Dorian, poised 3/2 at about 66 BPM. Instrumentation: viola da gamba, high viol or baroque violin, harpsichord, and theorbo. Place the low ledger motif A3-B3-C4-B3 and the upper ledger motif A4-C5-D5-E5 in equal musical space, first one after the other, then briefly in counterpoint. Neither instrument should sound morally superior. The player is opening a public argument by placing two ledgers and their evidence on the same table. The mood is alert, exact, and socially tense, but never aggressive or cinematic. Do not reveal the final boundary or turn the opponent into a villain. Avoid marching rhythm, courtroom clichés, pounding harpsichord, percussion, modern piano, orchestral strings, synthesizers, heroic fanfares, and ominous drones. End the main phrase around 28.5 seconds on an open A-Dorian sonority with both motifs still available, followed by natural decay.
```

## 08｜辯論 B：短少不能靠改名消失

建議檔名：`Ch5_Ledger_Debate_B.mp3`

```text
Create a 30-second historically grounded French chamber cue for the middle of an evidence-based debate in 1740. Use A Dorian, controlled 6/4 at about 68 BPM. Instrumentation: viola da gamba, high viol, harpsichord, and theorbo. The low ledger motif A3-B3-C4-B3 should remain steady underneath. Above it, play the upper ledger motif A4-C5-D5, repeatedly withholding the final E5 as a natural rest. Let harpsichord chords briefly attempt to fill the space, then stop, showing that a missing quantity cannot be erased by rhetoric. The feeling is pressure created by evidence, not by volume: the player is aligning a claim with records and forcing a precise reply. Avoid villain music, courtroom percussion, suspense drones, modern piano, orchestral strings, synthesizers, clocks, impact sounds, and triumphant resolution. End the main phrase near 28.5 seconds with the rest still audible as space, then allow the room tone to decay naturally.
```

## 09｜辯論 C：替兩種守恆各自劃界

建議檔名：`Ch5_Ledger_Debate_C.mp3`

```text
Create a 30-second historically grounded French chamber cue for the resolution of a scientific debate in a 1740s narrative physics game. Use A Dorian, broad 3/2 at about 60 BPM. Instrumentation: viola da gamba, high viol or restrained baroque violin, harpsichord, and theorbo. Begin with the low ledger motif A3-B3-C4-B3, then answer with the upper motif A4-C5-D5-E5. On the next exchange, allow the upper motif to omit its final E5 while the lower motif continues, then bring both instruments into a balanced counterpoint that does not merge them into one melody. The musical idea is boundary-making: keep both ledgers, state where each remains useful, and refuse to erase inconvenient evidence. The mood is earned clarity without finality. Avoid victory fanfares, sentimental reconciliation, villain defeat, modern piano, orchestral strings, synthesizers, percussion, clocks, and cinematic swells. Conclude the main material around 28.5 seconds with a modest open fifth and natural chamber decay, not a grand cadence and not a loop.
```

## 10｜杜夏特萊尾聲：總會有人接著算下去

建議檔名：`Ch5_Emilie_Night_Proof.mp3`

```text
Create a 30-second historically grounded French chamber epilogue for a narrative physics game set at Cirey in the 1740s. Use A Dorian, very calm 6/4 at about 52 BPM. Instrumentation: viola da gamba, pardessus de viole, soft harpsichord, theorbo, and a faint wooden traverso only in the final phrase. Begin with fragments of both ledger motifs, A3-B3-C4-B3 below and A4-C5-D5-E5 above, separated by quiet breaths. Gradually let the two lines coexist without forcing them into a single answer. The scene concerns proofs, printing, unfinished work, and the hope that another reader will continue the calculation. It should feel warm, lucid, mortal, and forward-looking, never tragic, romantic, saintly, or heroic. Do not quote funeral music or portray a lone genius transcending history. Avoid modern piano, orchestral strings, synthesizers, percussion, clocks, page-turn sounds, and cinematic swells. End the main phrase around 28.5 seconds with traverso holding a soft A above the two viols, followed by a long natural room decay and no hard loop.
```

---

## Runtime 對應建議

| 場景／狀態 | Runtime cue | 建議音檔 |
|---|---|---|
| E0-1｜西雷城堡開場、杜夏特萊登場 | `ch5Cirey` | `Ch5_Cirey_Open_Book.mp3` |
| E0-2～E1-1｜杜佩舊帳與問題成立 | `ch5Dupre` | `Ch5_Dupre_Ledger.mp3` |
| E1-2｜碰撞台：設計、預測、第一輪資料 | `ch5Collision` A | `Ch5_Collision_Workbench_A.mp3` |
| E2-1｜第一本帳完成 | `ch5Collision` B | `Ch5_Collision_Workbench_B.mp3` |
| E2-2｜同一批原紙改用第二本帳 | `ch5Collision` C | `Ch5_Collision_Workbench_C.mp3` |
| E2-3｜黏土與速度比較 | `ch5Clay` | `Ch5_Clay_Remembers.mp3` |
| E3-1｜辯論開場、兩本帳並列 | `ch5Debate` A | `Ch5_Ledger_Debate_A.mp3` |
| E3-1｜首支柱擊破、短少無法抹去 | `ch5Debate` B | `Ch5_Ledger_Debate_B.mp3` |
| E3-1～E3-2｜第二支柱後、替兩本帳各自劃界 | `ch5Debate` C | `Ch5_Ledger_Debate_C.mp3` |
| EE-1～EE-2｜印刷鋪、證明與章末 | `ch5Emilie` | `Ch5_Emilie_Night_Proof.mp3` |
| SC5-R1｜修復／重建場 | `silence` | 維持沉默，不配置 BGM |

## A／B 驗收

### A｜必須通過

- 十首皆為 30 秒左右，主要樂句約在 28.5 秒前結束並自然收尾。
- 音色可辨識為十八世紀法國小編制室內樂，不出現現代鋼琴、合成器或電影管弦樂。
- 兩個帳本動機能被聽成相關但不同的兩條線；不能做成正派主題與反派主題。
- 「短少」使用省略／休止表現，不用撞擊、不協和尖叫或悲劇式下墜。
- 工作台曲不提前宣布答案；辯論曲不把杜佩寫成愚昧或邪惡。
- 尾聲有溫度但不神化杜夏特萊，不用悲情死亡預告。
- 每首可以獨立播放，不依靠前一首的尾音或相同上下文。

### B｜可接受但應優先挑較好版本

- Lyria 若無法精確控制音高，至少保留「低聲部等距四音」與「高聲部上行四音」的對照。
- 若無法穩定生成 pardessus de viole，可用音色較輕的巴洛克小提琴替代，但不可改成現代浪漫派小提琴獨奏。
- 若 30 秒內無法完整呈現兩個動機，優先保留對等、未決與留白，犧牲裝飾音。

## 交付規則

1. 音檔放入 `public/assets/audio/ch05/`，檔名使用上表建議名稱，不加空格。
2. 每首至少生成兩版，依 A 級條件選一版；不要只因「更戲劇化」就選擇偏離歷史語彙的版本。
3. 檔案建議為 MP3，單檔小於 3 MB；第五章整包目標小於約 10 MB。
4. 實際音檔尚未存在前，不得先在 `assets.json` 或 runtime 中登記假路徑。
5. 音檔到齊後再補：SHA-256、實際秒數、檔案大小、授權／生成紀錄與 runtime 對應。
6. 完成接線後需分開驗收：桌面瀏覽器、iPhone 加入主畫面模式、Android Chrome、靜音切換、場景切換與 5 秒停頓。
7. 第六章另案製作；待章節節奏、工作台轉折與尾聲位置凍結後，再依本格式建立獨立音樂包。

## 生成完成紀錄

生成者：陳育詮
生成工具：Google Gemini（Lyria）
整合日期：2026-08-04

| 檔名 | 時長 | 大小（bytes） | SHA-256 |
|---|---:|---:|---|
| `Ch5_Cirey_Open_Book.mp3` | 30.772 秒 | 744609 | `b7f49ba71e9dc56fb4e0989ab404a009b953362712ecdd902d17d75975be0bdf` |
| `Ch5_Clay_Remembers.mp3` | 27.899 秒 | 675646 | `15cfb5198004ea4ff3b480add70fda8f5b6f602e2de7b3ca56b74e43adc8fd4d` |
| `Ch5_Collision_Workbench_A.mp3` | 26.802 秒 | 649315 | `836d22c0efa79feef9b08119ca460285173d2e77237b8c265a29d2a884401c90` |
| `Ch5_Collision_Workbench_B.mp3` | 27.899 秒 | 675646 | `2922ce31f69ee9b92903a84eb2ae6b88e671823c133320f13edcf42b129a29ab` |
| `Ch5_Collision_Workbench_C.mp3` | 30.772 秒 | 744609 | `0022f578cc4043836c03696c7272ee38bc89ea81a6b71a5819f02f6481fb6f11` |
| `Ch5_Dupre_Ledger.mp3` | 30.772 秒 | 744609 | `57416f1d318fa117c74ddac851288581cf1563f263690f2b30988ef1eba958e0` |
| `Ch5_Emilie_Night_Proof.mp3` | 27.899 秒 | 675646 | `83a1ce73f209892ac1d92b817be2e0abd1f0668b0ae49d31bd88be864dfc20c9` |
| `Ch5_Ledger_Debate_A.mp3` | 30.772 秒 | 744609 | `ba8e937f2506fbd55f2d8077a3e4fd969241b0ca8c4de822ff919a9211ebbfed` |
| `Ch5_Ledger_Debate_B.mp3` | 28.656 秒 | 693827 | `1495428842ee573f12c79955c2cd1074bd4871cdf8696e05c9bd65203c113691` |
| `Ch5_Ledger_Debate_C.mp3` | 30.772 秒 | 744609 | `bfa29385f0fc70c9305086c988b5814a039933385203029b9acebbe21f304e3a` |

技術驗證：十首皆為雙聲道 MP3、44.1 kHz、192 kbps；總量約 6.8 MB。音色、對白遮蔽與 A／B／C 情緒差異仍須總監真人實聽。
