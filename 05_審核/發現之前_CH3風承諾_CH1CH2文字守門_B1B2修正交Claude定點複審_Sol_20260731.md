# CH3 風承諾・CH1/CH2 文字守門｜B1/B2 修正交 Claude 定點複審

**施工者**：Sol／Codex  
**日期**：2026-07-31  
**真相模式**：CONFORMANCE  
**最高 lane**：R3（第三章既有狀態語意與辯論接線）

## 一、結論

Claude 首輪的兩條 B 全部接受，零反駁。

- **B-1 已修**：有 `cabinWind=close-cabin` 的新流程，在第一柱選完 A2 後直接
  引用玩家先前承諾並進第二柱；UI 不再顯示相同的風範圍題。
- **B-1 舊檔分流保留**：沒有承諾的舊存檔仍停在第一柱，必須完成一次
  `p1/wind` 補問。
- **B-2 已修**：`P0-2/nA3` 不再以 `「` 開頭；第一章 R-TXT-6 由 1 error
  降為 0。
- **B-2 豁免補實作**：A3-D／B3-D 是由辯論引擎承載可見攻防的 embed 場。
  兩章已逐場登記 NAR-08 豁免；守門器也補上原先缺少的 NAR-08 豁免判讀。

## 二、B-1 可驗證條件

### 新流程

1. 實驗設計選 `close-cabin`，留下 `designCommitments.cabinWind`。
2. 走完 A2 後回答第一柱 `source=A1`、`cabin=A2`。
3. `db.p1.wind=true`、`db.pillars.p1=true`、`db.current=p2`。
4. UI 同時檢查 `db.p1.wind` 與 `cabinWind`，不得再畫出風範圍三選一。

### 舊存檔

1. 刪除 `designCommitments`，保留既有船艙原紙。
2. 回答第一柱 `source=A1`、`cabin=A2` 後仍留在 p1。
3. `pillars.p1=false`，玩家仍須回答 `p1/wind`。

### 反向性

- 拿掉引擎的承諾引用，第三章「辯論仍重複問同一題」契約會紅。
- 拿掉 UI 的 `cabinWind` 守衛，靜態 UI 契約會紅。
- 把舊存檔視為已有承諾，舊檔 fallback 契約會紅。

## 三、B-2 可驗證條件

### R-TXT-6

`P0-2/nA3` 改為：

> 你說的「大家都知道」，正是亞里斯多德最厚的一面牆。

把字串改回以 `「` 開頭，第一章 `check-narrative` 必須重新出現
`ERROR R-TXT-6 P0-2/nA3`。

### NAR-08

- ch1 `A3-D` 與 ch2 `B3-D` 各自明列場號、全部三個節點與原因。
- `narrative_guard.py` 只在豁免的 rule、scene 與完整 node set 都吻合時略過警告。
- unit fixture 同時驗證「有精確豁免不報、移除豁免立刻報」。

## 四、驗證結果

- 修前全套：**138/0**。
- 修後全套：**138/0**。
- ch4 migration：**19 groups，205 legacy cursors**。
- skill guard unit：**64/64**（原 63，新增 NAR-08 正反 fixture）。
- `skill_guard validate`：**0 errors、27 warnings**；均為既有 candidate／追蹤／
  已知缺口，未因本輪新增 error。
- 五章 `check-narrative --runtime-source greybox/src/chapter-ui.js`：

| 章 | error | warning | 說明 |
|---|---:|---:|---|
| ch1 | 0 | 2 | 既有 R-TXT-5：E1 缺玩家主張／實體簽收；E2 缺玩家主張 |
| ch2 | 0 | 2 | 既有 R-TXT-5：S3 缺實體簽收；F1 缺玩家主張 |
| ch3 | 0 | 0 | |
| ch4 | 0 | 0 | |
| ch5 | 0 | 0 | |

ch1/ch2 的四個 R-TXT-5 warning 是跨章新規則揭露的既有證據簽收債；不屬
Claude 本輪兩條 B 的放行條件。本輪不為追求數字歸零而改寫既有證據節拍，留待
獨立工作包判定真缺口或登記精確豁免。

## 五、請 Claude 只覆核三點

1. 新流程完成 A2 後不得出現 `p1/wind`；舊檔仍會出現。
2. ch1 `P0-2/nA3` 的 R-TXT-6 error 為 0，反加引號會紅。
3. ch1/ch2 的 NAR-08 豁免確實逐場、逐節點，移除任一份會恢復 warning。

## 六、交付狀態

Outcome: IMPLEMENTED，兩條 B 已完成定點補修，待 Claude 複審  
Truth mode: CONFORMANCE  
Target and comparison baseline: Claude 2026-07-31 A=0/B=2 報告；修前 138/0  
Design Gate: PASS（CH3-CR-029）；B-2 為既有跨章文字契約修復  
Files changed: CH3 UI／契約；ch1/ch2 canonical scenes 與生成鏡像；narrative guard 與 unit fixture；五入口快取鍵；本 CR 與本報告  
Focused tests: PASS；B-1 新舊路徑、UI 守衛、NAR-08 正反 fixture、五章 narrative guard  
Full tests: PASS  
Registry updated: N-A  
Browser/device: NOT RUN；本輪由機械契約驗證，總監真機試玩另待  
Accessibility: NOT RUN；未改控制標籤、焦點順序或讀屏內容  
Independent review: PENDING Claude 定點複審  
Human playtest: PENDING 總監  
VCS: 未 stage、未 commit、未 push  
Release: NOT RUN／未授權  
Production smoke: NOT RUN  
Known gaps: ch1/ch2 共 4 個既有 R-TXT-5 warning；Claude C-1/C-2 仍照原報告列觀察項  
Preserved foreign WIP: YES；未重置、刪除或整理共享髒工作樹
