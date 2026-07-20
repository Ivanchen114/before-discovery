# 《發現之前》BGM v2 整合驗證(Claude,2026-07-20)

**對象**:Sol 依其配樂架構 v2 之播放器與資產整合(未提交工作樹)。**結論:靜態驗證通過;G8 試聽(總監耳朵)為凍結前最後一關。**

## 檢核表

| # | 項目 | 結果 |
|---|---|---|
| 1 | `npm test` 60/60(含 Sol 加嚴之 BGM v2 契約) | ✅ |
| 2 | 測試方向=加嚴非放水:mood 值域 11 種、schema v2 驗證、workshop/hall 鎖三段 milestone、`a.loop = true` 字面封殺、storm 恆 null 保留 | ✅ |
| 3 | stage-ui 純度:BGM v2 僅讀 `bd:view`/`bd:debate` 事件+ASSETS,未觸引擎/存檔 | ✅ |
| 4 | `once` 播畢→`ended` 事件→回程序環境聲(settle);不重播 | ✅ |
| 5 | `milestone` 同段重繪不重播:`next===curVariant` 短路+`curFinished` 旗標(refresh 時已播完→只回環境聲) | ✅ |
| 6 | `silence` 三處入資料(A1-4 高塔/A1-5 雜耍/A3-6 判定),不掛檔案(測試禁止) | ✅ |
| 7 | 交叉淡換放緩(0.008/60ms≈1.8–2 秒),符合 2–4 秒規格下緣 | ✅ |
| 8 | 舊 string schema 視為 once=向下相容;舊存檔不受影響 | ✅ |
| 9 | 里程碑掛點:工坊 A2-2 c1/n3→B、A2-3→B、A2-3 學者節點與 A2-4→C;辯論 broken≥2→B、fr/trap/won→C | ✅ 邏輯與架構 v2 相符 |
| 10 | 16 檔實檔存在(測試逐檔 readFileSync);缺 Challenge_Letter 改重用 Debate_Hall_A=辛普里奧主題提前伏筆,README 已記載 | ✅ |
| 11 | 授權表 10 列新檔全補(生成者/日期/工具) | ✅ |
| 12 | 標題 travelerTitle 於 init 即 play,autoplay 被擋由首次手勢 unlockAudioOnce 補播 | ✅ |

## B 級備註(不阻擋)

1. **音訊資料夾 12MB,超出舊指南 10MB**:其中 Beneath_the_Chisel/Counsel_of_Strings(1.4MB)已不被遊戲引用,保留作 proof 與回退。可接受;若日後要瘦身,兩檔移 `art/source/` 即可,規則一行不用改。
2. **試聽仍是人工關**(本驗證無耳朵):G8 重點改為——once 播完落回環境聲的落差感、milestone 切換時機聽感(交叉 2 秒夠不夠自然)、16 檔相對音量、hall C 是否仍克制。
3. 舊 G8「三輪循環聽接縫」項目**作廢**(硬循環已不存在),checklist 對應欄位待更新。

## 提交建議

批次歸屬 Sol(架構+實作),依 8751351 先例由 Sol 自行 commit(明列路徑);或總監授權 Claude 代提(訊息署名 Sol 實作/Claude 驗證)。推上 GitHub 後線上版才會更新。
