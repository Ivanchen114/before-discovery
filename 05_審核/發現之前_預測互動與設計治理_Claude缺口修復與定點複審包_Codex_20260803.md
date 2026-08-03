# 《發現之前》預測互動與設計治理
## Claude 缺口修復與定點複審包（Codex，2026-08-03）

## 一、審查來源與本輪結論

本輪承接 Claude 對原始兩層錨點的最終判定：

- Layer A：A=0、B=2、C=1。
- Layer B：A=0、B=1、C=2。
- 原判定：整體不放行。

本輪已針對三條 B 與可直接消除的 C 完成修復，並補做 K1 `crash` 可達性與 A3「四項先封」判定。現在交回 Claude 做**定點複審**；本文件不自行宣稱外部審查放行。

## 二、逐項修復

### A-B1｜K1 形狀分類不得退回設定查表

1. 正式結果仍由 `orbitShapeFromSimulation(run.path)` 判讀玩家實際路徑。
2. 契約新增一組會區分模擬與查表的合法操作：`slow / short / [-2, 6, -3]`。實際路徑為 `ellipse`，舊 canonical 查表會給 `circle`。
3. 測試同時檢查 `classificationSource === "simulated-path-v1"` 與存檔稽核。
4. 反向控制：把分類器改回 canonical 查表後，測試精準轉紅：

   > K1 實際路徑分類退回設定查表；slow/short 的合法偏轉紙應判為 ellipse

### A-B2｜舊 `predictPlanet` 不得由其他層接回

1. 從 `engine4.js` 刪除舊函式及 API 匯出。
2. 從 `narrative.js` 刪除 `labAction: predictPlanet` 派送。
3. 契約同時掃引擎 API、敘事派送與 canonical `scenes4.json`。
4. 反向控制：只在敘事層重接舊 action 後，測試精準轉紅：

   > 舊 predictPlanet 仍可由敘事資料或派送層重新接回

### A-C1｜K3 雙封閘門須以具名契約失敗

`revealPlanetPredictions` 對火星、木星列的後續存取改成防禦式存在檢查。即使有人誤刪雙封守衛，也不會先因 `undefined` 解參考而崩潰。

反向控制：刪除雙封守衛後，零 TypeError，測試精準轉紅：

> K3 雙封閘門失效：只封火星就能揭曉，應回 two-planet-predictions-required

### B-B1｜ADR 必須有逐檔語意落點

現況採 `current-specs.json` schema 2：

- 每筆 active／partially-superseded ADR 明列指定 CURRENT 文件。
- 每份指定文件必須有該 ADR 的獨立語意列。
- 治理測試拒絕缺檔、重複檔、非 CURRENT、語意過薄、只以另一個 ADR 編號代替語意。
- 跨章規格明文禁止以「機器覆蓋索引」或全號碼總表冒充章別落點；測試也會拒絕該字樣。

### B-C｜第四章現行定案補風險、取捨與未驗

第四章現行設計定案新增「風險、取捨與未驗」：

- A3 四項預測先封的認知負荷風險。
- 玩家若把它讀成考題，後續結構性備案。
- 瀏覽器、VoiceOver、真人閱讀節奏、production smoke 均標示 NOT RUN。

### 跨章通則

跨章 runtime 與治理規格新增：每條護欄須同時有正向存在斷言與負向旁路斷言；負向探針不得從被檢驗欄位複製，並須檢查 canonical data、派送層、引擎 API 與匯入淨化等可重接入口。

## 三、新增判定

### `crash` 在現行 K1 合法操作下不可達

已完整枚舉 UI 可產生的三拍操作與九組速度／力道設定：

- 第 1 拍：-6 至 -2。
- 第 2 拍：1 至 6。
- 第 3 拍：-6 至 -3。
- 共九組 speed／strength。

結果：零組達到 `crash`；最小半徑為 0.400，而 `crash` 門檻為 0.280。這不是抽樣，也不是只跑標準答案。

因此本輪不放大地球、不改容差來遷就假選項；新局的預測選單移除「切入地球」。`crash` 顯示文字與 enum 暫留，只供舊存檔／舊結果相容。

### A3「四項先封」暫保留，但不冒充已完成真人驗收

目前錯押不扣信譽、不阻擋 K1，目的在保留玩家操作前的直覺。因此本輪保留「先押目標、速度、力道、形狀」。

待真人試玩確認玩家是否把四項讀成考題；若負荷仍高，結構性備案為「先封規則與參數 → 畫三拍 → 再封形狀 → 牛頓續畫」。該方案會動 schema／migration，不應偽裝成純文案修正。

## 四、驗證結果

- `cd greybox && npm test`：154 通過、0 失敗。
- 第四章 migration：19 組、205 個舊游標通過。
- `git diff --check`：通過。
- K1 查表回退反向控制：精準轉紅。
- K3 舊 action 重接反向控制：精準轉紅。
- K3 雙封守衛刪除反向控制：精準轉紅，且無 TypeError。

## 五、定點複審請求

請 Claude 只攻以下五點：

1. K1 是否仍存在不經 `orbitShapeFromSimulation(run.path)` 的可達分類旁路。
2. 舊 `predictPlanet` 是否仍能從 canonical data、敘事派送、API 或匯入層重接。
3. 刪除 K3 雙封守衛後是否以具名契約轉紅，而非 TypeError。
4. `current-specs.json` 的逐檔語意落點能否再被集中索引或空洞列舉騙綠。
5. `crash` 枚舉是否漏掉任何 UI 可達的合法操作序列。

## 六、送審 SHA-256

| 檔案 | SHA-256 |
|---|---|
| `greybox/src/engine4.js` | `16cce02eccd2f6c52ca2ccf63d40c652f21ac8f9ab2d9fec7fcfa8342ed7452f` |
| `greybox/src/narrative.js` | `cdffd4a5addf52399ecdb8d048c936e1f88a93445beb2319081532d55793d814` |
| `greybox/src/chapter-ui.js` | `c416a7fa9c4a4c18319ff7a6b2324bbcda6bd945362670f71fc1bcb4e7ea7980` |
| `greybox/tests/run-node.mjs` | `d05da90203528af13547a19989713bda635d9ae273690c807194fa67c0da314c` |
| `02_設計/發現之前_第四章書桌探究現行設計定案_v1.0.md` | `614f1577f6d419d5ca7a14a595738423a815be9a2451e1889b0aa29f5e74ae99` |
| `03_規格/發現之前_第四章功能規格書_v0.2.md` | `63793185b80efe376d8646af266c42b65174ea9b9d02ef9eb9a7f5d4b4f80c32` |
| `03_規格/發現之前_跨章runtime與治理規格_v1.0.md` | `7e8843e9c64e54a5e4b4080b8c5a37c22c2ce902f803d72d41eb400d68bfc52c` |
| `greybox/tests/run-design-governance.mjs` | `7da8c916029c0f094e1efb553409cf4aeef167424f3d1135dc61ee95b2c00255` |

基準 HEAD：`0a5425af23c02fa85cea501bbc87306097aa04b5`。送審對象是上述工作樹檔案 SHA，不可把 HEAD tree 當成已含修復。

## 七、交付邊界

- 已完成：程式修復、契約、文件同步、反向控制、Node 全測試。
- 未完成：真人試玩、瀏覽器與行動裝置驗收、無障礙實測、production smoke。
- 本輪未提交、未推送、未發佈。工作樹另含第六章與其他治理施工，不能以 `git add -A` 混包。
