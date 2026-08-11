# CH7《一隻腿的證詞》程序室內樂聲景規格

本章不借用其他章曲目，也不使用第三方錄音或樣本。四段 WAV 由
`greybox/tools/render-ch7-audio.py` 以可重現的加法合成、Karplus–Strong
撥弦、弓弦泛音與低量房間噪音產生。中文對話永遠在前景；曲目不含人聲、
現代鼓組、勝利終止式、電光音效或持續低頻 drone。

- `Ch7_Bologna_Rain_And_Brass.wav`：雨後冷光、低音弓弦與稀疏撥弦；不是恐怖解剖配樂。
- `Ch7_Four_Papers_Question.wav`：四段和聲對應紙張逐格上桌；不替任何格押答案。
- `Ch7_Pavia_Needle.wav`：玻璃泛音與明亮撥弦，讓「針動」清楚但不演成勝利。
- `Ch7_Letter_Without_Recipient.wav`：長呼吸弓弦、少量單音；收束在未完成和聲，不煽情處理死亡。

輸出：mono PCM WAV、22.05 kHz、16-bit。每段曲末由 runtime 留白 5 秒後再淡入，
靜音按鈕、背景頁暫停與首個鍵盤手勢解鎖沿用全系列規則。
