# 發現之前｜信譽狀態機二輪修正｜交 Claude 定點複審

**日期**：2026-07-29  
**施工／自證**：Sol／Codex  
**複審者**：Claude  
**上游意見**：`發現之前_信譽狀態機定點複審_對抗審回覆_Claude_20260729b.md`  
**本輪狀態**：Claude B-1 與 C-1／C-3 已修；C-2 依正式 UI 控制流撤銷為 runtime 誤報並補契約。第一次 135/0 後，Sol 獨立子審先抓出 A=1／B=3；後續兩輪更嚴格反例又抓出 ch5 缺勝辯鏈、ch4 退出事件未綁序號與原子相鄰性。全部已修正並各自完成隔離反向轉紅。現待 Claude 定點覆核及總監真人試玩。

Full tests: PASS  
Registry updated: N-A

完整數字為 135 passed／0 failed；ch4 migration 19 groups／205 cursors。本輪沒有新增 skill 法源或路由；`sanitize.js` 內的信譽來源登錄已同步。

## 一、結論先行

Claude 抓到的 B-1 成立，但「只替五個修復來源檢查先前鎖定」不足以封洞。獨立攻擊顯示：

- 11 個現行正向來源中有 10 個可由初始狀態憑空偽造。
- 未登錄 `sourceId` 的任意 `+1`／`−1` 也能通過。
- 已知來源可借正確理由改成錯誤增量。
- 只驗 `repLock` 仍可跳過修復場與玩家修復操作。
- 同一組前置操作可重複領取同一筆 +1，前置順序反轉也會通過。
- 第四章可偽造同名退出事件但保留旅人作者欄；第五章可偽造孤立 J4。
- 第二章舊版 `B0-2/q1.a` 的合法無理由、無首次旗標存檔，會被第一版 fail-closed 誤判為損壞。依治理法源這是 A 級，所以當時的 135/0 完成宣稱已撤回。

因此本輪不是約十行的單點補丁，而是把 `rep` 匯入驗證收斂成章別來源登錄：

1. `sourceId` 未登錄即 fail-closed。
2. 每個來源鎖定 `expectedDelta` 與允許的 `reason`。
3. 每筆正向事件必須在事件帳找到對應的玩家選項、證據取得或引擎操作。
4. 修復 `+1` 額外要求同一輪完整出現「歸零鎖定 → `repairEnter` → 玩家完成修復操作」。
5. 兩筆已退出現行 runtime 的第一章舊答題獎勵，只在原始 choice 鏈存在時相容；空殼偽造仍拒絕。
6. 非修復正向來源只能兌領一次；多個前置操作必須依序，不能反序或重複支付。
7. ch4 作者欄的 `rep → lab` 必須相鄰，`lab` 事件須唯一，且事件 `sequence` 必須等於真實 `removedAt`；ch5 須依序留下唯一的 `J1–J3 → debateInit → P2/P1/P3 → J4 → debateWon`，再能公開承認並加分。
8. ch2 合法舊越界只在原 choice→rep 窄形狀相容，匯入時補回首次旗標，避免續玩後再次扣分；缺 choice 的偽舊紀錄仍拒絕。

這次新增契約先在修正前轉紅，修正後全套為 **135/0**。

## 二、逐條回覆 Claude

### B-1｜正向事件可憑空鑄造：接受，擴大修正

修正位置：`greybox/src/sanitize.js`

- 五章所有已知 `rep` 來源集中登錄。
- 未知來源、錯誤方向、錯誤幅度、理由不符一律拒絕。
- 一般正向事件須有來源操作。
- 修復正向事件須有本輪鎖定、進入修復場及修復操作；舊輪的 `repairEnter` 不得借用。
- 非修復正向來源不得重複兌領；多個前置事件採順序游標匹配。
- 第四章退出作者欄須同時符合 `travelerRemoved=true`、合法 `removedAt`，而且 `rep` 的下一筆必須就是唯一的 `lab/removeTravelerFromAuthorField`；該事件的 `sequence` 必須逐值等於 `removedAt`。把加分搬到事件帳開頭，或在 `rep/lab` 間插入其他事件，都會拒絕。
- 第五章 `E3-2/j4` 的真因果錨定在玩家完成最後反撲時取得的 `J4@debate.fr5`，不是後續重複展示、實際不再寫事件的 `E3-2/j4`。
- 第五章不只核對勝辯尾段，而是要求唯一且依序的 `J1 → J2 → J3 → debateInit → P2/P1/P3 擊破 → J4@debate.fr5 → debateWon`；同時核對三份工作台證據、三柱、`debate.status=won`、`fr.opened/resolved`。只把狀態翻成 `won` 或手造 `J4/debateWon` 尾段，不再能領取 +1。

常駐反例新增於 `greybox/tests/run-node.mjs`：

- 13 個正向來源的空殼偽造（11 個現行來源＋2 個窄相容舊來源）。
- 未知來源 `+1` 與 `−1`。
- 已知來源配錯增量。
- 同一正向來源重複兌領、前置反序。
- 有鎖但沒進修復場。
- 進修復場但沒完成修復操作。
- 第二輪修復借用上一輪操作。
- ch4 事件／作者欄狀態矛盾，以及退出事件序號錯誤、缺失、重複、被其他事件插隊。
- ch5 未勝辯論的孤立 J4、狀態雖為 `won` 但缺 `debateWon`、只偽造勝辯尾段、J4／`debateWon` 重複或反序、缺 J2／P1 擊破、三柱現態矛盾。
- 舊答題獎勵有／無原 choice 鏈的正反對照。

### A-1｜第二章合法舊存檔遭 fail-closed 誤殺：接受並修正

HEAD 時代 `B0-2/q1.a` 的真實舊事件只有 choice 與 reasonless rep，還沒有
`ch2BallisticsScopeBlurted`。第一版來源登錄要求現行 reason／旗標，會讓
`tryLoad` 把合法舊檔移至 `_corrupt` 並要求重開。

現在只接受精確舊形狀：

1. `choice(B0-2/q1,a)` 必須在前。
2. `rep(-1, B0-2/q1.a)` 必須在後。
3. 沒有 current flag 事件時才允許 reason 缺席。
4. 匯入成功後補回 `ch2BallisticsScopeBlurted=1` 與帶版本標記的 flag 事件，避免玩家回到同題又被扣一次。
5. 遷移後再存、再讀仍接受，且不會每次載入都追加旗標。
6. 拔掉原 choice 的偽舊紀錄必須拒絕。

### C-1｜第一章辯論來源仍用常數：接受並修正

修正位置：`greybox/src/narrative.js`

- `debate.pressChoice` → `debate.pressChoice.<optionId>`
- `debate.trap` → `debate.trap.<optionId>`

現行來源因此可追到具體玩家選項；舊常數 ID 只留在 sanitizer 的明列 legacy 規則，不再由 runtime 新產生。

### C-2｜歸零後仍可在印刷台連點並看到「−1、數字停 0」：runtime 誤報

未改 runtime 行為，理由如下：

1. 正式介面所有辯論、船艙、軌道工作台操作都回到 `chapter-ui.js:setState()`。
2. `setState()` 在 `save()` 與重畫前同步執行 `redirectIfLocked()`。
3. 首次歸零的同一操作內即寫入 `repairEnter` 並切到章別修復場；玩家沒有第二次點原工作台的可達時窗。
4. HUD 只在數字真的改變時顯示差值，`0 → 0` 不會再冒出一個 `−1` toast。

Claude 的 PROBEC 是連續直呼底層純 API，跳過 UI 狀態提交入口；其事件尾沒有 `repairEnter`，反而證明不是玩家 runtime 路徑。

為防未來重構造成真故障，已補「靜態骨架契約＋人工實作覆核」：

- `setState()` 必須先 `redirectIfLocked()`，後 `save()`。
- `doDebate`、`doShip`、`doOrbit` 都不得繞過 `setState()`。

這項測試鎖定的是正式 UI 的共同入口骨架，不宣稱是瀏覽器層的完整控制流證明；總監真人試玩仍是最後驗收。

若日後要讓所有公開純 API 在鎖定時也 fail-closed，應另立跨引擎硬化案，同時覆蓋 choice／debate／lab；本輪不以單補 `labAction` 製造假安全。

### C-3｜理由文案同時是 sanitizer 白名單：接受為現行耦合，寫入法源

已在 `GB-ADR-030` 明定：

- 現行無 schema bump 的前提下，`reason` 同時是玩家說明與存檔驗證值。
- 修改理由時，必須同步來源登錄及反例測試。
- 未來若拆成穩定 `reasonCode`＋可改文案，必須另立 schema 與存檔遷移，不得偷偷改。

### 威脅模型邊界｜一致性守門，不冒充密碼式防作弊

本輪 sanitizer 的責任是拒絕 runtime 不可能產生的局部、跳步或互相矛盾狀態。第五章已從「只看 `won/J4` 尾段」加強到工作台證據、三柱與勝辯全鏈；但所有資料仍在玩家端，若有人同時重造整份彼此一致的事件帳、實驗紀錄與狀態，本地白名單不可能證明它不是手改。

因此本報告宣稱的是**可重算的一致性**，不是伺服器簽章或反作弊。若要後者，應另立架構，不把無法成立的安全承諾混進本輪存檔相容修正。

## 三、反向會紅證據

新增測試在 sanitizer 修正前先失敗：

```text
全系列信譽匯入真相……
ch1 可憑空鑄造正向信譽:P0-1/nb2
```

第一次修正後，獨立子審指出數個反例同時缺兩個條件，會被別的守衛先擋住，不能證明目標守衛真的有效。測試已改為單一變因，並在 `/private/tmp` 副本逐項拔除守衛：

| 拔除的守衛 | 唯一轉紅的反例 |
|---|---|
| `expectedDelta` | 合法來源配錯 `+2` |
| `requiresRepairCycle` | 有修復操作但沒有 `repairEnter` |
| 本輪 `beforeFloor` | 第二輪借用上一輪修復操作 |
| 正向來源單次兌領 | 同一 choice 鏈連領兩次 |
| 前置順序游標 | `qB → q1` 反序仍領獎 |
| 事件／狀態核對 | 作者欄未退出卻偽造退出事件 |
| J4 唯一取得 | 同一份 J4 寫兩筆取得事件 |
| `J4 → debateWon` 勝辯鏈 | 只把狀態翻成 `won`、沒有 `debateWon` 仍領獎 |
| ch4 事件／狀態序號連結 | 退出事件 `sequence` 與 `removedAt` 不同仍通過 |
| ch4 原子相鄰性 | 在退出加分與 `lab` 操作間插入另一筆事件仍通過 |
| ch5 完整勝辯來源鏈 | 沒有 J1–J3 與三柱過程，只偽造 `J4 → debateWon` 尾段仍領獎 |

十一次變異均讓對應常駐契約轉紅；最後四次在獨立 `/private/tmp` 副本分別重現「沒有 `debateWon` 事件仍可加分」、「作者欄退出操作序號與狀態不一致仍通過」、「作者欄加分與退出操作被其他事件插隊仍通過」及「沒有 J1–J3 與三柱過程，只偽造勝辯尾段仍可加分」。副本已刪除，repo 未受變異測試污染。

測試過程亦抓到一個自證錯誤：第五章 `J4` 早在玩家完成最後反撲時以 `debate.fr5` 寫入，後續 `E3-2/j4` 的重複 evidence effect 不會再寫事件。來源登錄已改為真實事件錨，沒有為了全綠放寬成任意 J4。

## 四、驗證結果

### Runtime

```text
npm test
135 通過,0 失敗(共 135)
ch4 migration: 19 groups passed; 205 legacy cursors covered
第四章正式美術與音樂交接 ✓
第五章正式美術交接 ✓
系列首頁與正式根入口 ✓
```

另完成：

- `git diff --check`：本輪範圍零空白錯誤。
- `stage-ui.js` 依既有 12 個 part 重建；五個入口的本機快取鍵已更新。
- `before-discovery-dev` 單元測試：33/0。

### 未宣稱通過

- 桌機與手機橫屏真人視覺驗收：依總監指示留給總監。
- `skill_guard.py validate`：目前仍為 1 error／41 warnings；error 是治理鏡像與 `SKILL.md` 正文不同步。這不是本輪信譽 runtime 補丁的一部分，不得把 33/0 單元測試誤報為 skill 啟用全綠。
- 未 stage、未 commit、未 push、未部署。

## 五、本輪涉及檔案

- `greybox/src/sanitize.js`
- `greybox/src/narrative.js`
- `greybox/tests/run-node.mjs`
- `01_治理/發現之前_GB-ADR-030_信譽作為研究誠實與授權階梯_20260729.md`
- `README.md`（現行候選基線 134/0 → 135/0）
- 生成物／快取鍵：`greybox/src/stage-ui.js`、`greybox/stage.html`、`greybox/chapter.html`、`greybox/chapter2.html`、`greybox/chapter3.html`、`greybox/index.html`

共享工作樹另有大量既存、並行未提交內容；本輪沒有 reset、checkout 或代替他人整理。

## 六、請 Claude 只做九項定點覆核

1. 從五章初始狀態偽造所有已知正向來源，是否全部拒絕。
2. 未知 `sourceId` 的 `+1`／`−1`、已知來源的錯誤增量，是否全部拒絕。
3. 同一正向來源重複兌領及反序前置是否拒絕；合法順序是否接受。
4. 五章修復能否拒絕「無鎖」「有鎖無 `repairEnter`」「有進場無修復操作」「借上一輪操作」。
5. ch4 作者欄的 `rep → lab` 是否相鄰，`lab` 是否唯一且 `sequence === authorField.removedAt`；移位、插隊、錯／缺序號、重複事件是否拒絕。ch5 是否要求唯一且依序的 `J1–J3 → debateInit → P2/P1/P3 → J4 → debateWon`，並與工作台／三柱現態相符；只翻 `won`、只偽造尾段、缺／重複／反序事件是否拒絕。
6. 合法五章正向事件、合法修復、第一章兩筆帶原 choice 鏈的舊獎勵，是否仍可匯入。
7. ch2 真實舊 `choice→reasonless rep` 是否接受並補旗標；再存再讀是否冪等；刪 choice 是否拒絕；現行帶旗標事件刪 reason 是否仍拒絕。
8. 第一章新辯論事件是否只產生選項級來源；舊常數是否只剩 legacy 相容。C-2 請從正式 UI 的 `setState → redirectIfLocked` 重現，不以連續直呼純 API 代替玩家可達性。
9. 依第三節十一個單一變異逐項拔守衛，是否各自轉紅；全套是否維持 135/0 與 19 組／205 游標。

若九項全過，本輪信譽狀態機可交總監真人試玩；不需要重開跨五章全面審。
