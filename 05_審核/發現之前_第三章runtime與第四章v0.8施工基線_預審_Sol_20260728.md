# 第三章 runtime 與第四章 v0.8 施工基線預審

**審查者**：Sol / Codex  
**日期**：2026-07-28  
**範圍**：第三章 `scenes3` 展開後 runtime；第四章 v0.8 施工基線、遷移表與現行 `engine4`／載入流程  
**性質**：**施工前預審，不是「第三、四章都完成後」的最終合併驗收**

---

## 一、裁定

### 第三章

**核心結構通過，但尚不能列為最終可交付綠。**

- 10 場、209 節點、209/209 可達、零斷鏈，JSON／JS 鏡像一致。
- 以目前可追溯的 committed 基線計，舊版是 8 場、71 節點；71 個舊游標均可由現行 sanitizer 與 Narrative 讀取，不需要 schema 遷移。
- 目前有 **3 項 B 級必修**：測試死區造成假綠、兩個幕間缺背景、文件權威路由分裂。

### 第四章

**現行「先做 4A 場景重排，再做 4B 遷移」不准照表開工。**

第四章不是只有 A-3 尚待補。施工基線另有 **7 項 A 級阻擋**，其中包括：

- 新順序 `K0 → K2 → K1` 會被現行引擎的 `k1-required` 直接卡死。
- 遷移表所列的多數 v1 欄位不存在。
- migration 若只放在 sanitizer 前，仍會先被 `N.loadSave` 判成壞檔。
- A-5 只有數值核心可沿用，玩家三拍、零預選、封存時間序與牛頓續畫都還沒進 runtime。

### 合併交付

**目前不具備「第三、四章一次交 Sol」的條件。**  
這份預審不改變總監裁定的交付節奏：Claude 先修第三章必修項，再改正第四章施工基線並完成 runtime；兩章全部通過後，再做一次正式 Sol 對抗審，最後由總監試玩。

---

## 二、已獨立驗證的說法

| Claude 說法 | 判定 | 實際結果 |
|---|---|---|
| 第三章為 10 場、209 節點 | ✅ | 實撈相符 |
| 第三章零斷鏈 | ✅ | 場景與節點 BFS 為 209/209 可達；零無效 next、零非 end 死點 |
| `scenes3.js` 已重建 | ✅ | 與 `scenes3.json` 深度相等 |
| 舊節點 ID 全保留，免遷移 | ⚠️ 大致成立 | 對可追溯 committed 基線的 71 個舊節點成立；「施工前 72」沒有不可變快照可證 |
| `npm test` 134/0 | ✅ 數字成立 | 但測試檔有無條件 `return`，數個契約實際未執行，不能解讀為「全部契約通過」 |
| A-5 已在引擎裡 | ❌ 過度宣稱 | 只有四參數驗證、一次性模擬與 3×3 數值核心；完整玩家互動未成立 |
| A-3 是真病灶 | ✅ | `modelOutcome` 確實把渦旋補丁寫死成 `patches: 2` |

本輪實際執行 `greybox/npm test`：**134 passed / 0 failed**。下列問題是對這個綠燈的覆核，不是否認測試輸出本身。

---

# 第三章

## B-CH3-1｜測試死區造成「134/0 假陽性」

### 證據

- `greybox/tests/run-node.mjs:2060` 有無條件 `return`。
- 動作密度契約位於死區內：`greybox/tests/run-node.mjs:2143-2148`。
- `greybox/tests/run-node.mjs:2309` 又提前返回，使 `2311-2491` 的 legacy API／G1–G5 契約不執行。
- 現行第三章角色 line 為 152 句，其中 62 句含括號動作，比例 **40.8%**；死區內契約要求至少 50%，若真的執行會失敗。

這個 bypass 不是本輪新加的，但它使「134/0」長期帶著假陽性。

### 直接修法

1. 把仍有效的契約拆成獨立、可執行的 test case。
2. 不要為湊 50% 機械補括號；由 CR 明定四律展開後仍採比例門檻，或改測「動作改變場面 → 他人回應 → 導向玩家下一操作」。
3. 將 `2311-2491` 分成仍承諾相容與已退役兩組；退役測試刪除，不能繼續藏在 `return` 後。
4. 新增測試檔不可達程式碼檢查。

### 可驗證條件

- 刻意破壞一個受保護動作或 legacy 行為時，測試必須真的紅。
- `run-node.mjs` 不得再用無條件 `return` 隔離整段斷言。

---

## B-CH3-2｜兩個新幕間沒有背景

### 證據

- `INT-C1`、`INT-C2` 已有肖像：`greybox/data/assets.json:2147-2153`。
- 兩場已有 BGM：`greybox/data/assets.json:2756-2757`。
- `sceneBg` 只列舊場，未列這兩場：`greybox/data/assets.json:47-65`。
- 缺映射時，舞台會明確隱藏背景圖並顯示 fallback：`greybox/src/stage/02-scene.part.js:19-38`。
- 美術測試仍手寫舊八場：`greybox/tests/run-node.mjs:3725-3739`。

### 直接修法

- `INT-C1 → bg_ch03_marseille_harbor_dawn`
- `INT-C2 → bg_ch03_public_demonstration`
- 重建 `assets.js` 鏡像。
- 美術完整性測試改由現行場景資料推導，不再手寫八場清單。

### 可驗證條件

- 十場都有可解析背景。
- 兩個幕間不進 `bgFallback`。
- JSON／JS 鏡像一致，瀏覽器實際走到兩場確認。

---

## B-CH3-3｜runtime 與正式劇本的權威路由分裂

### 證據

- v0.9 說自己以 `scenes3.json` 為對象，且已進 runtime 後轉為對照文件：`04_劇本/第三章台詞稿_v0.9_展開版_Claude_20260728.md:4,8`。
- 同一份 v0.9 的第 6 行仍寫 8 場／72 節點；第 476 行後仍叫「進 runtime 前」。
- 活著的測試仍讀 v0.7；死區測試讀更舊的 v0.1.1：`greybox/tests/run-node.mjs:2014,2064`。
- 根 `README.md:20` 仍把第三章 v0.1.1 標為現行鎖定版。
- `02_設計/README.md:18` 仍把「第三章現在的玩法」導向 v0.7。

### 直接修法

明定且只保留一條現行路由：

- `greybox/data/scenes3.json`：唯一 executable canonical。
- v0.9：現行台詞對照稿。
- v0.7／v0.1.1：歷史或機制基線，首屏加「已被取代」標記。

同步更新兩份 README。若測試聲稱「劇本／runtime 同步」，就讀 v0.9 並比較兩側，不能採「script、UI、engine 任一處命中就算通過」。

### 可驗證條件

新協作者由根索引只會得到一條現行路徑；活測試不再把 v0.7 或 v0.1.1 當目前台詞稿。

---

## 其他第三章問題

### B｜接縫內容成立，測試名稱卻誇大

`scenes2` 末句與 `scenes3` 開句的核心問句經中文標點正規化後一致；但 `greybox/tests/run-node.mjs:3657` 只查三個子字串，註解卻寫「逐字一致」。

**修法**：直接取兩端節點，抽出交棒問句，正規化標點後做 equality；或把契約改名為「語意接縫」。

### B｜209/209 可達尚未成為常駐契約

目前測試只鎖 10 場、重複 ID 與目標存在，沒有鎖全部節點可達。應把本輪 BFS 寫成常駐測試；節點總數可記錄為診斷值，不宜把 209 永久當內容規格。

### C｜施工前「72 節點」不可追溯

目前可追溯的 committed 基線是 71 節點。若 72 來自未提交本機快照，請寫明「施工前本機快照」，並保存 fixture，不能稱 committed 基線。

### C｜殘留欄位與舊測試名稱

- `scenes3` 內十個 `_keep` 沒有 runtime 讀取者；請刪除或正式納入 schema。
- `greybox/tests/run-node.mjs:1978,3725` 的名稱仍稱八場。

---

# 第四章

## A-CH4-1｜新證據順序會被現行引擎卡死

### 證據

- v0.8 明訂取得順序為 `K0 → K2 → K1`：`04_劇本/第四章台詞稿_v0.8_Claude_20260728.md:17`。
- `setScale`、`tryDistanceLaw`、`sealDistanceLaw` 仍硬性要求 K1：`greybox/src/engine4.js:337-383`。
- 施工基線先搬場景，卻沒有先改這條依賴：`03_規格/發現之前_第四章v0.8施工基線_盤點與分批_Claude_20260728.md:27-31`。

### 直接修法

把 K2 的前置條件改為玩家親手封存的切線來源紀錄／K0 狀態，不得要求尚未到年代的 K1。

### 可驗證條件

完整走查實際以 `K0 → K2 → K1` 取得；K2 成立時必須是 `k2=true、k1=false`，全程不得回傳 `k1-required`。

---

## A-CH4-2｜遷移表不是從真實 v1 schema 撈出來的

### 證據

遷移表列出：

- `orbitRule`
- `scaleGuess`
- `marsSeal`
- `jupiterSeal`
- `patchCount`

見 `03_規格/發現之前_第四章v0.8存檔遷移表與契約測試_Claude_20260728.md:55-65`。

這些欄位都不在現行 `initialState()`。真實欄位是：

- `orbitLab.ruleRuns / activeRule / tangentRecord`
- `scaleLab.trials / lawLocked`
- `planetLab.predictions / revealed / residuals`
- `modelLab.runs[*].patches`

見 `greybox/src/engine4.js:58-102`；sanitizer 也依這套欄位驗證：`greybox/src/sanitize.js:785-815`。

### 直接修法

先凍結真實 v1 node map、schema 與 golden saves，再逐欄寫 v1→v2 transform。除非完整移除舊欄位，不要另造 `d21/d12/d31/d41/d42` 平行真相。

### 可驗證條件

- 205 個舊 `(scene,node)` 游標都有 fixture，不只是「每場一份」。
- 每個互動中途與 K1–K5 完成階段都有真實 v1 fixture。
- 全部遷移後通過 v2 sanitizer。

---

## A-CH4-3｜migration 必須早於 `N.loadSave`

### 證據

- 本機讀檔流程是 `N.loadSave → sanitize`：`greybox/src/chapter-ui.js:106-114`。
- 書信碼／raw import 同樣先 `N.loadSave`：`greybox/src/chapter-ui.js:6276-6281`。
- `N.loadSave` 已先拒絕舊 schema 與舊 cursor：`greybox/src/narrative.js:1022-1029`。
- 本機路徑會把被拒絕的合法 v1 移到 `_corrupt` 並刪主 key：`greybox/src/chapter-ui.js:125-134`。
- 舊 transcript 內含被刪場號時，現行 sanitizer 也會拒絕：`greybox/src/sanitize.js:959-963`。

所以「先 migration，後 sanitizer」仍不夠；migration 必須在載入驗證之前。

### 直接修法

流程改為：

`decode raw → 用凍結的 v1 schema/node map 預驗證 → 備份原文 → migrate → v2 loadSave → v2 sanitize`

另須處理：

- `ended:true` 不可只重設 cursor，否則 UI 仍立即當完章：`chapter-ui.js:6130-6133`。
- 回收 K1 時，外層 `state.evidence.K1` 與內層 `state.lab.evidence.k1` 必須同步；現行機制只授證、不撤證：`narrative.js:957-959`。
- 不可對任意 JSON 直接「洗成 v2」，否則偽造證據也可能被接受。

### 可驗證條件

localStorage、raw import、envelope import 各測：

- 合法 v1
- 惡意 v1
- 舊 transcript
- 已完章
- 互動中途
- 備份與可讀訊息

合法 v1 不得進 `_corrupt` 路徑。

---

## A-CH4-4｜K0 的身分與生命周期互相矛盾

### 證據

- 基線與台詞稱 K0 為新增證據：施工基線 `:15,31`；台詞稿 `:17`。
- 章末仍說「本章五份證據」：台詞稿 `:553`。
- 引擎、archive、Narrative、sanitizer 全都只認 K1–K5：`engine4.js:23,101-102,810-824`；`sanitize.js:889-900,927-936`；`narrative.js:957-959`。
- `runOrbitRule` 仍會自動生成 `tangentRecord`：`engine4.js:217-230`，違反「玩家親手封存」。

### 建議裁定

**K0 定義成玩家封存的來源紀錄，不是第六張章證據。**

這樣可以保留章末五份證據，也避免 HUD、archive、證據卡與史實頁全面擴成六份。K0 仍須有不可偽造的 `playerSealed`／action sequence，但不進 `evidenceNames`。

若總監堅持 K0 是第六份證據，就必須完整加入 evidence、claim、archive、proof、sanitizer、HUD、史實頁、美術與章末六份回收；不能只加一個布林。

### 可驗證條件

玩家未完成 D1-1 封存前，任何後續 API 都不能替玩家生成 K0；HUD／archive 不得出現身分不明的第六證據。

---

## A-CH4-5｜A-5 只有數值核心，不是完整 runtime

### 已成立部分

- `runOrbitRule(config,prediction)` 的確要求方向、速度、箭長、預測四項有值才模擬：`engine4.js:217-256`。
- `ORBIT_SPEEDS` 與 `ORBIT_STRENGTHS` 的三組配對可沿用為多解數值核心：`engine4.js:8-15`。

### 未成立部分

- 一次 API 呼叫就跑完整條路，沒有 `sealedAt < firstStepAt`。
- 沒有玩家親手三拍、每拍重新對準、牛頓續畫 27 拍。
- UI 預選四項：`chapter-ui.js:5220-5235`。
- UI 的按鈕直接讓規則自己跑：`chapter-ui.js:5236-5241`。
- 現行錯配只分 inner／outer，沒有 canonical 表要求的橢圓結果。
- v0.8 主稿明訂玩家三拍與每拍重設偏角：`04_劇本/第四章台詞稿_v0.8_Claude_20260728.md:205-225`。

### 直接修法

拆成狀態動作：

`sealOrbitRule → nudgeAim → commitOrbitBeat × 3 → continueLockedRule`

順序真相使用單調 action sequence；牆鐘時間只供顯示。每拍需比較玩家箭頭與當下地心、上一拍地心的實際夾角。

### 可驗證條件

- 初始四項全空。
- 封存前不可第一拍。
- 每拍箭頭重設為刻意非正解角。
- 重載後封存順序仍成立。
- 九格結果逐格吻合 canonical 表。
- 玩家三拍之後才由牛頓續畫。

---

## A-CH4-6｜A-3 不能只把固定常數換成兩個布林

### 證據

- `simpleVortex.planets/comet` 固定回傳 `patches:2`：`greybox/src/engine4.js:520-533`。
- 現行 `assertK4` 沒有查玩家是否貼過借條。

### 直接修法

- 原始模型 run 保持不可變，只記 fit／residual／原始對不上。
- 借條另存為玩家觸發、append-only 的操作紀錄。
- `d41.slipPlanet`／`slipComet` 可以是派生方便欄位，但不能取代操作紀錄。
- K4 證據包與四種結論由實際借條紀錄派生；不得改寫原始模型輸出。

### 可驗證條件

無／只行星／只彗星／兩張四態各有專屬結論；未貼時證據包借條數為 0；系統不能生成、刪除或改寫借條。

---

## A-CH4-7｜4A→4B 不是安全中間狀態

### 證據

施工基線先換場景、年代與 embed，再於下一批補 schema／migration：`03_規格/發現之前_第四章v0.8施工基線_盤點與分批_Claude_20260728.md:27-42`。

4A 完、4B 未完時，只要載入一次舊存檔，就可能：

- 被當成壞檔。
- 落入同 ID、不同年代的新場景。
- 在 K2 遇到 `k1-required`。

### 安全施工順序

1. 凍結 v1 node map、schema、205 個游標 fixture 與代表性 golden saves。
2. 先完成雙版本 loader、migration、v2 sanitizer 與測試。
3. 定義 K0 身分與 v2 唯一 state schema。
4. 實作 K2-before-K1、A-5 狀態機、A-3 借條紀錄。
5. 最後一次切換 scenes、UI、assets、stage hooks 與 generated mirrors。
6. 全測與 served browser acceptance。

不必 commit 一個走不完的 4A，但應保留可回退的小型施工 checkpoint；「一氣呵成」不能等於沒有中途不變量。

### 可驗證條件

任一中間狀態都不得刪除、誤判合法 v1；場景切換只能在 migration 已可用後發生。

---

## 第四章 B 級

### B-CH4-1｜`INT-1` 與第一章資產鍵衝突

`assets.json:16` 已把 `INT-1` 指向第一章帕多瓦背景；`assets.json:2580` 又把 `INT-1` 指向 1592→1602 第一章蒙太奇。sceneFx 解析沒有 chapter namespace：`greybox/src/stage/11-fx.part.js:152-154`。

**修法**：第四章幕間使用唯一 ID，例如 `D-INT-1`；成本低於把所有資產解析全面 namespace 化。

### B-CH4-2｜D4-2 的必要 state truth 未列進 4B

- 現行 `PROOF_EXPECT` 只有五槽，沒有球殼第六槽：`engine4.js:24-30`。
- 旅人退出作者欄仍不能只靠固定台詞，必須是玩家 action 與狀態真相。

兩者都要進 schema、sanitizer、UI 與契約測試。

### B-CH4-3｜舞台與音樂仍硬綁舊場號

首次工作台交棒、BGM 變奏與印刷段均有舊場號條件。場景重排時須同步 `src/stage/*.part.js`，再重建 `stage-ui.js`；不能只改 `scenes4`／`engine4`。

### B-CH4-4｜「18 條契約」實際列了 22 條

遷移表以 1、2、3、3b、3c、4、5、6、7、8、9、9b、9c、10–18 編號，合計 **22 條**。施工基線多處寫 18，應改正，避免完工時漏驗。

### B-CH4-5｜現有 134/0 只證明舊版

現行全章走查明確鎖死「14 場、五證據」：`greybox/tests/run-node.mjs:4384-4415`。它通過只代表舊 schema 1 runtime 仍可走，不代表 v0.8 已可施工。

### B-CH4-6｜844×390 只有 spike 靜態承諾

canonical spike 的低高度 CSS 不等於 runtime acceptance。v0.8 實作後仍須以 served URL 驗證 D2-1、D3-1、D4-1、D4-2 的完整流程、鍵盤操作、reduced motion 與 reload。

---

## 三、Claude 下一步的准入清單

### 先收第三章

- [ ] 修掉測試死區，讓仍有效的契約真的執行。
- [ ] 補 `INT-C1`／`INT-C2` 背景與完整性測試。
- [ ] 統一 README、v0.9 與 runtime 的權威路由。
- [ ] 加 209/209 可達性與較強的跨章接縫契約。
- [ ] 全測通過後，瀏覽器實走兩個新幕間。

### 再開第四章

- [ ] 先改施工基線與遷移表，不得直接從搬 D1-2／D1-3 開始。
- [ ] 凍結真實 v1 schema、205 游標與代表性中途狀態。
- [ ] 決定 K0 是來源紀錄或第六證據。
- [ ] migration 接在 `N.loadSave` 前，涵蓋 local/raw/envelope。
- [ ] 先解開 K2 對 K1 的依賴。
- [ ] A-5 按 canonical 互動完整實作，不只沿用 auto-run helper。
- [ ] A-3 借條使用 append-only 玩家操作紀錄。
- [ ] 補齊實際 22 條契約及遷移矩陣。
- [ ] 同步 scenes／engine／UI／stage parts／assets／sanitizer／generated mirrors。

---

## 四、最終合併交 Sol 的通過條件

1. 第三章上述 B 級全部關閉。
2. 第四章 7 項 A 級全部關閉；不得以文件回應代替 runtime state truth。
3. 所有舊 v1 fixture 可讀、可備份、可遷移；不得靜默重開或誤入 `_corrupt`。
4. 22 條新契約確實執行，不得再藏在 dead code。
5. 全部 Node 測試通過。
6. served browser 完整通關；桌機與 844×390 橫屏均驗收。
7. 再交一次正式 Sol 對抗審；通過後才由總監試玩。

---

## 五、驗證邊界

本輪只新增本預審報告，未修改第三、四章 runtime、劇本、規格或測試。  
已完成資料結構、鏡像、Git 基線、舊游標、測試死區、引擎依賴與存檔載入流程的靜態／Node 覆核。  
**尚未做瀏覽器畫面、聲音與 844×390 acceptance**；本環境無法安全啟動可供瀏覽器連線的本機服務，因此不宣稱試玩通過。
