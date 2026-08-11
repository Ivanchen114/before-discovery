# 第七章《一隻腿的證詞》Gemini／Lyria BGM 正式提示詞 v0.1

日期：2026-08-11
用途：以 Gemini／Lyria 正式音樂取代目前四段程序式 WAV 佔位。每段提示詞可獨立貼入。

## 共同聲音識別

本章不是 Galvani 與 Volta 的勝負賽，而是兩個問題曾被歷史疊成一句「誰贏」。音樂要
讓兩條可信的思想線同時存在，直到玩家把「蛙腿收縮」與「無生命配置也有可持續電效應」
分開記。不能使用電流音效、科幻閃光或天才勝利曲。

- 時代與地域：1790–1800 年代北義大利晚期古典室內樂；不使用巴洛克宮廷套語或十九世紀浪漫派。
- 固定調式：G Dorian。
- 編制：古鋼琴、兩把小提琴、中提琴、大提琴；帕維亞可少量加入玻璃質感的弦樂泛音，但不用電子音色。
- 「兩端接起」動機：兩個短句各自停在半空，第三次才短暫接成一條線；不代表理論合併。
- 「留下原紙」動機：低聲部重複同一短句，上聲部每次換一種回答，表示同一證物被不同理論引用。
- 每首 30 秒，主要音樂約 28.5 秒完成並自然衰減；不要無縫循環。前三首由 runtime 留白 5 秒後再播，尾聲只播一次。
- 禁用：人聲、合唱、現代鋼琴、電子音、電流劈啪、恐怖解剖配樂、天才蒙太奇、英雄弦樂、反派低音、電影鼓、勝利終止、葬禮音樂。

---

## 01｜波隆那雨後：黃銅鉤與一隻腿

建議檔名：`Ch7_Bologna_Rain_And_Brass.mp3`

```text
Create a 30-second historically grounded late-Classical Italian chamber cue for Bologna in the 1790s, for a narrative physics game. Use G Dorian, slow 6/4 at about 54 BPM. Instrumentation: fortepiano, two violins, viola, and cello, performed intimately in a small stone room. Begin with cool sparse violin notes above a quiet cello phrase, suggesting rain on iron railings and a brass hook without imitating weather or electricity. Present two short melodic statements that both stop before resolving, as if two explanations are waiting to claim the same frog-leg observation. The mood is humane, curious, slightly uncanny, but never horror, anatomy shock, or supernatural discovery. Keep all dynamics low enough for spoken Chinese dialogue. Avoid thunder effects, electrical crackles, heartbeat sounds, percussion, modern piano, orchestral strings, synthesizers, ominous drones, victory music, and villain cues. End the main phrase around 28.5 seconds on an open G-Dorian interval with natural room decay.
```

## 02｜四張原紙：一箱還沒問完的話

建議檔名：`Ch7_Four_Papers_Question.mp3`

```text
Create a 30-second late-Classical Italian chamber cue for an interactive four-configuration evidence matrix in a 1790s narrative physics game. Use G Dorian, measured 4/4 at about 62 BPM. Instrumentation: fortepiano, two violins, viola, and cello. Build four compact variations of one neutral phrase, each with the same pulse but a different interval relationship, representing baseline, two metals, same metal, and no metal. Give all four equal musical weight; do not signal which configuration supports or refutes any claim. Let the cello repeat a quiet 'original paper' motif while the upper strings change their answers. The mood is focused, tactile, open-ended, and accountable: every configuration must be made and left on the table. Avoid quiz-show tension, ticking, laboratory sound effects, frog sounds, percussion, modern piano, romantic orchestra, synthesizers, electrical sparkle, and triumphant cadences. End near 28.5 seconds with all four variants still available and a natural decay.
```

## 03｜帕維亞細針：沒有蛙的桌上也有讀值

建議檔名：`Ch7_Pavia_Needle.mp3`

```text
Create a 30-second restrained late-Classical Italian chamber cue for Volta's Pavia laboratory in the 1790s. Use G Dorian, calm 3/2 at about 60 BPM. Instrumentation: fortepiano, violin harmonics used sparingly, viola, cello, and a second violin. Begin with two dry fortepiano notes representing contact, followed by a very small sustained upper-string displacement, like a fine needle moving enough to be recorded. Keep the gesture modest and repeatable; it is evidence, not a miracle or final victory. Let one earlier Bologna phrase return in the viola, now answered by a different configuration with no living tissue present, while leaving the question of persistence open. The atmosphere is bright, exact, courteous, and competitive without heroism. Avoid electronic tones, glass chimes, electricity sound effects, discovery fanfares, suspense builds, percussion, modern piano, orchestral swells, synthesizers, and villain music. End around 28.5 seconds with an unresolved but clearly audible upper interval and natural decay.
```

## 04｜沒有收件人的信：證人退庭，證詞留下

建議檔名：`Ch7_Letter_Without_Recipient.mp3`

```text
Create a 30-second late-Classical Italian chamber epilogue for a narrative physics game set in 1800. Use G Dorian, very slow 6/4 at about 48 BPM. Instrumentation: soft fortepiano, two violins, viola, and cello. Begin with fragments of the two earlier unresolved statements, now placed on the same harmonic ground without merging them into a winner's theme. Let the cello preserve the original-paper motif while the upper strings complete only the limited conclusion earned by six configurations. In the final phrase, leave one expected answering note absent: a letter has evidence to carry, but its intended recipient is no longer alive. Treat absence with restraint, not funeral sentiment, tragedy, or a dramatic death reveal. The feeling is lucid, tender, unfinished, and forward-looking toward another laboratory. Avoid requiem gestures, solo lament, heroic Volta music, defeated Galvani music, percussion, modern piano, orchestral swells, synthesizers, electrical effects, and grand cadences. Complete the main phrase around 28.5 seconds, then allow a long natural chamber decay; this cue will play only once.
```

---

## Runtime 預定對應

| 場景 | Runtime cue | 正式音檔 |
|---|---|---|
| EM7-0～EM7-1 | `ch7Bologna` | `Ch7_Bologna_Rain_And_Brass.mp3` |
| EM7-2、EM7-4 | `ch7Matrix` | `Ch7_Four_Papers_Question.mp3` |
| EM7-3 | `ch7Pavia` | `Ch7_Pavia_Needle.mp3` |
| EM7-E | `ch7Letter` | `Ch7_Letter_Without_Recipient.mp3` |
| SC7-R1 | `silence` | 維持沉默 |

## 生成與替換規則

1. 每首至少生成兩版；優先選低資訊密度、能讓中文對白留在前景的一版。
2. 目標為 MP3、雙聲道、44.1 kHz、192 kbps、約 30 秒、單檔小於 3 MB。
3. 正式檔到齊前，四段程序式 WAV 維持可播放 fallback；不得先改成不存在的 MP3 路徑。
4. 四首正式 MP3 到齊後，總監指示刪除程序式 WAV；可重現腳本與程序提示詞只保留作 provenance，不再作 runtime fallback。
5. 保留 Gemini／Lyria SynthID；交回時記錄生成日期、工具與帳號類型。
6. 接線後驗收：曲目切換、5 秒留白、尾聲只播一次、靜音、背景頁暫停、鍵盤首次手勢、對白遮蔽與 SC7-R1 沉默。
7. 本提示詞包不是 Audio Lock；總監實聽後才能鎖定。

## 生成交付紀錄（2026-08-11）

四首均由陳育詮使用 Google Gemini／Lyria 生成，Codex 完成格式校驗與 runtime 接線。四檔皆為雙聲道、44.1 kHz、192 kbps MP3，實際長度均約 30.772 秒、單檔 744,608 bytes；SynthID 保留。音色、中文對白遮蔽與時代感尚待總監實聽，不在本次接線中自動取得 Audio Lock。

| 檔名 | SHA-256 |
|---|---|
| `Ch7_Bologna_Rain_And_Brass.mp3` | `60e265527ed137d6f9752a070add1a08d56edd226f524569c73636494e28eec1` |
| `Ch7_Four_Papers_Question.mp3` | `cf98eb549c4de172052e1ab11b99c00620ce0d5b1914b5f9a219a9cb965dbd2a` |
| `Ch7_Pavia_Needle.mp3` | `a83b12e8c961603a970c03b03f516bdebb43826c7554dd1daec567636da8a347` |
| `Ch7_Letter_Without_Recipient.mp3` | `6c22cf96785efe7728ac8975134037ea631c3ed4f172dd10df6918721cfe9dba` |
