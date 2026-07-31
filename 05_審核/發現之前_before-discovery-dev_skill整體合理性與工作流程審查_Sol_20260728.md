# `before-discovery-dev` skill 整體合理性與工作流程審查

**審查者**：Sol／Codex

**日期**：2026-07-28

**主審對象**：

- `tools/skill/before-discovery-dev/SKILL.md`
- `tools/skill/before-discovery-dev/OVERLAY-claude.md`
- skill 指向的共用守則、收官基線、工作台規格、設計原則、協作流程、美術規格、瀏覽器與發佈法源

**範圍**：審查 skill 作為「全專案開發守門流程」時的合理性、邏輯一致性、完整性、效率與可維護性。這一輪不是六項字串定點覆核，也不修改 skill、鏡像、agent 生效版或 runtime。

## 總裁決

**作為法源索引：方向正確。作為端到端開發 skill：目前不放行。**

分級：**A=2、B=8、C=5**。

這與上一份「A=0、B=2、C=4」不矛盾。上一輪只依約覆核六個收斂點；本輪第一次把整套流程放入不同任務情境，檢查它會不會選錯主審對象、錯判權責、卡死施工或漏掉高風險 Gate。

目前可保留的核心設計：

1. repo canonical、agent-neutral common、agent overlay 三層方向正確。
2. skill 應只放程序與索引，不複製領域規則，方向正確。
3. 史實查證、玩家代理權、證據邊界、髒工作樹保護與生成鏡像意識都值得保留。
4. 94 行 common、25 行 overlay 的體量本身不算肥大；問題是流程分流與法源角色，而不是單純行數。

但在 A 級兩點修掉前，不應把 v2 同步成所有 agent 的唯一守門流程。

---

## 一、實體與基線

- `skill-creator/scripts/quick_validate.py tools/skill/before-discovery-dev`：**通過**，frontmatter 與基本結構合法。
- `greybox/npm test`：**129 通過、1 失敗**。
- 唯一紅燈：`C-2 拆分｜stage-ui.js ≡ src/stage/*.part.js`，生成檔落後。
- common 明列的 32 個唯一 Markdown 路徑皆存在，但其中 **17/32 尚未被 Git 追蹤**；乾淨 clone 不會取得它們。
- 本輪未修該紅燈，也未把 129/1 說成全綠。
- 本輪未移動、刪除、修改任何原有檔案；只新增本審查報告。

---

## 二、盲測與情境模擬摘要

另以兩個不帶預設答案的唯讀任務 forward-test：

1. **「審尚未進 runtime 的第四章 v0.9 草案」**：agent 最終正確選擇草案為主審對象，但必須自行調和「runtime 一律 canonical」的衝突；它也沒有照 skill 的固定開工儀式實跑 `npm test`。結果正確靠的是額外判斷，不是流程本身無歧義。
2. **「規劃新增一張第四章證據圖」**：agent 一開始依字面判成髒工作樹＋129/1 所以不得規劃施工；之後還得跳出 skill 索引，自行找到全系列美術規格、`LICENSE-CONTENT.md`、資產母版與瀏覽器清單。它同時發現瀏覽器清單仍寫第四章 14 場，而現行 v0.8 runtime 是 12 場。

兩個盲測都能靠模型推理補洞，但 skill 的用途正是減少這種每次重建流程的成本；不能把「聰明 agent 猜對了」當成規則完整。

| 任務情境 | 現行 skill | 判定 |
|---|---|---|
| 唯讀問答／文件審查 | 仍強制讀長索引並跑完整 `npm test` | 過重 |
| 修目前唯一紅燈 | 「不綠不疊加新工作」沒有明確修復例外 | 有字面死鎖 |
| 審尚未進 runtime 的劇本 | 共用守則說 runtime 一律 canonical | 可能審錯對象 |
| 診斷已上線 bug | 若拿最新劇本當目標，也會審到玩家沒玩到的內容 | 需要 AS-IS |
| 新章／新工作台 | §三仍以器材、左右頁工作台作共同流程 | 過度套模板 |
| 存檔／schema | 只有 ch3／ch4 個案，沒有裁決前的 fail-closed 流程 | 守門不足 |
| 美術／生圖 | trigger 明列整合美術，索引卻沒有美術法源 | 路由缺失 |
| 對抗審修正後覆核 | 定點覆核被描述成可取代全面複審 | 高風險改動可能漏審 |
| 發佈／真人試玩 | 有零散法源，skill 未串成狀態機 | 退出條件不完整 |
| 髒工作樹下獨立改檔 | §五把整棵髒樹視為不可 commit | 範圍過寬 |

---

## 三、A 級

### A-1｜沒有分開「現在實況」與「未施工目標」，會審錯 canonical

**位置**

- common `SKILL.md` 第 20–24、31–52 行。
- `01_治理/發現之前_雙人共用工作守則_v0.1.md` 第 28–30 行。
- `02_設計/發現之前_第一至第四章收官與後續章節製作基線_v1.0.md` 第 25–35 行。

**實際看到**

- 共用守則宣稱：「審台詞、審機制一律以 `greybox/data/*.json` 為準；`.md` 只用於比對角色意圖。」
- 收官基線的法源順序卻是：憲章／跨章原則 → 最新治理 CR → runtime → 測試 → 劇本與提案。
- skill 同時把第四章 v0.8 劇本、施工基線、runtime 與事後審核列在索引，卻沒有先問本輪正在查哪一種真相。
- 實體衝突已存在：v0.8 施工基線把 K0 規劃成新證據；現行 runtime／契約則明定 K0 是來源紙、**不是證據**。

**為何是 A**

本專案常見三種任務：

1. **施工前審查**：劇本／規格尚未進 runtime，主審對象本來就必須是目標稿。
2. **現況診斷**：玩家現在遇到的 bug，只能以 runtime 為準。
3. **竣工驗收**：同時比較批准目標與 runtime。

現行文字把三者壓成一句「runtime canonical」。照字面執行，第四章 v0.7／v0.8 這類「審完才進 runtime」的任務會直接審錯版本；反向只看最新劇本，也會對玩家不存在的功能下結論。這是審查標的錯置，不是用字問題。

**直接修法**

先在共用守則建立三層真相模型，skill 只索引：

```text
AS-IS：玩家現在玩到什麼
  → greybox/data、引擎、UI、實際資產與存檔行為。

TO-BE：這一輪批准要做成什麼
  → 當期任務書、已裁 CR、凍結規格、待施工劇本。

DECISION：為什麼允許這樣改
  → 總監裁決、憲章、跨章法源與法源優先序。
```

每份審查開頭必填：

```text
Audit mode：AS-IS／TO-BE／CONFORMANCE
主審對象：
比較基線：
不在本輪的資料：
```

- `AS-IS audit`：診斷玩家現況。
- `TO-BE review`：施工前審規格／劇本。
- `CONFORMANCE audit`：施工後查 AS-IS 是否符合 TO-BE。

**可驗證條件**

用三個盲測任務驗 skill：

1. 「審尚未進 runtime 的劇本」必選 TO-BE。
2. 「查線上玩家看到的 bug」必選 AS-IS。
3. 「驗收施工是否符合劇本」必同時讀兩邊，不得宣稱任一邊單獨取代另一邊。

---

### A-2｜作者、施工者、審查者的移交規則互相矛盾

**位置**

- `01_治理/發現之前_雙模型協作流程_v0.1.1.md` 第 15、25–28、44–50 行。
- `01_治理/發現之前_雙人共用工作守則_v0.1.md` 第 76–80、91 行。
- `tools/skill/before-discovery-dev/OVERLAY-claude.md` 第 8–9、18–19 行。

**實際看到**

1. 協作流程要求作者與審稿者必為不同模型；審稿者只能給最小修補，不得以重寫奪走作者工作。
2. 共用守則又說「誰提出完整修法，誰把工作包做到底」。
3. 同一份守則要求每條審查意見都給「可直接施工的修法」。
4. overlay 又說「審查方不動檔，修正歸施工方」。
5. Claude 被指定同時負責機制與台詞，守則下一行卻禁止同一人同時決定機制與台詞。

**為何是 A**

審查者只要把修法寫得夠具體，就可能被文字自動判成新施工者；但另一條又禁止他動檔。這會破壞作者／審查者分離，也讓臨時角色互換沒有可驗證邊界。對抗審若失去獨立審查者，整個品質 Gate 失效。

**直接修法**

每個工作包固定一張角色卡：

```text
Decision owner：
Artifact author：
Implementer：
Independent reviewer：
Owned paths：
Audit mode：
```

並立以下明確界線：

- 審查者提供替換句、驗證條件、局部 diff 或偽碼，**不自動移轉施工權**。
- 只有總監明示，或原施工者明示接受完整工作包移交，角色才改變。
- 當期任務書的角色指定，高於預設分工與 agent overlay。
- 同一人可起草機制與台詞，但不能同時批准兩者：先過 **Design Gate**，再展開台詞；最後由另一人做 **Implementation Gate**。
- overlay 只保留個人慣犯與工具習慣，不保存會覆蓋當期任務書的固定權責。

**可驗證條件**

審查者提出一段完整替換句後，Owner 不得自動改變；只有一份明確移交紀錄才可使角色互換。

---

## 四、B 級

### B-1｜所有任務共用同一套開工儀式，既浪費又會卡死

**位置**：common `SKILL.md` 第 18–25 行。

唯讀審查、改一個標點、修既有紅燈、新機制、schema 遷移與正式發佈，都被要求先讀同一批長文件、跑完整 `npm test`；而「不綠先回報，不疊加新工作」沒有區分紅燈是否正是本輪任務。

**建議改為風險 lane**

| Lane | 任務 | 最低前置與退出條件 |
|---|---|---|
| R0 | 唯讀查詢、盤點、審查 | target status＋任務法源；不因無關紅燈禁止閱讀 |
| R1 | 恢復既有契約的小 bug、純文件修正 | target diff＋定點測試；交付前依影響決定全套 |
| R2 | 台詞、既有 UI、資料或美術接線 | 基線＋相關 builder／lint＋全套測試＋必要瀏覽器 |
| R3 | 新章、新機制、共用引擎 | Design Gate＋spike／契約＋全套測試＋Implementation Gate |
| R4 | schema、存檔、匯入、archive 搬移、發佈 | 個案計畫＋負向／回退驗證＋獨立審查＋明示授權 |

既有紅燈應分類：

1. 本輪就是修它；
2. 與本輪目標重疊；
3. 已知但與本輪不重疊。

只有第 2 類必須阻止施工；第 3 類可以在完整揭露、限定路徑下繼續安全的獨立工作。

另把「生成物同步」從開工儀式移到「修改來源後、測試前」；它不是 preflight。

---

### B-2｜把一、二章的實驗工作台形狀寫成全章共同主流程

**位置**

- common `SKILL.md` 第 56–72 行。
- 工作台規格第 17–26 行。
- 收官基線第 42–56、130–160 行。

skill 仍畫出：

> 器材踏查 → 左右頁工作台 → 勾選紀錄／斷言／證據 → 終局

這是實驗章的好 UI 語言，不是所有科學工作的唯一形狀。第四章已明確是作圖、算術、封存、對帳、出版的「書桌章」；若把 skill 流程當成章型模板，下一次很可能又把它實驗台化。

**直接修法**

common 只保留跨章因果：

```text
角色真的需要答案
→ 玩家先承諾
→ 產生可見紀錄／操作痕跡
→ 玩家把紀錄變成有限主張
→ 合理阻力追問
→ 終局整合、守邊界並承擔後果
```

再條件分流：

- 含實物實驗：讀工作台規格。
- 紙上模型、帳桌、出版、資料審計：讀章別規格與收官基線，不強套左右頁裝置。

---

### B-3｜trigger 宣稱涵蓋全專案，法源路由卻缺重要工作

缺少或不足的路由：

1. ch1–ch3 現行章級入口。
2. 一般 runtime／引擎除錯與生成耦合。
3. 美術、生圖、母版、runtime 衍生檔、來源與授權。
4. 史實查核與「史實／合理重建／虛構串接／傳說」揭露流程。
5. 瀏覽器、手機、讀屏與真人無提示試玩。
6. CR／ADR 的建立與 bug 修復例外。
7. 文件歸檔、引用改寫與 manifest。
8. commit、push、Vercel、production smoke 與回退。

其中最直接的缺口是：frontmatter 明列「整合美術」，第 25 行也提 `build-assets.mjs`，但索引沒有：

`03_規格/發現之前_全系列美術製作規格書_v0.2.md`

因此會漏掉點陣圖／SVG 邊界、母版與 runtime 衍生檔、尺寸與安全區、下載預算、授權、提示詞與史實查核、Art Lock。

實查還有三個下游缺口：

- `LICENSE-CONTENT.md` 的 AI 美術適用路徑仍只明列 `public/assets/ch01、art/source`，沒有清楚涵蓋後續章 runtime 圖。
- 第四章沒有章別美術附錄或逐件授權 ledger 的 canonical 路徑。
- `greybox/docs/browser-checklist.md` 第四章仍是 14 場舊版，不能直接充當 v0.8 的現行驗收表。

**生圖順序也應分開**

- 設計階段：先定 `evidenceVisual` 穩定 ID、資訊責任與灰盒 placeholder。
- 證據鏈與互動凍結後：才量產正式圖。
- 數字、軌跡、刻痕、圖表與可變物理資訊：HTML／SVG／Canvas。
- 生圖：人物、場景、器物質感與情緒。

另應索引正式發佈法源：

`01_治理/發現之前_GitHub與Vercel發佈流程_v0.1.md`

---

### B-4｜存檔規則仍是 fail-open

**位置**：common `SKILL.md` 第 49、76–83 行。

skill 誠實說明跨章通則待裁，但沒有寫「裁決前如何安全施工」。agent 可能直接類推 ch3 的「只插不刪免遷移」，忽略場序、閘門、證據語意與進行中互動狀態。

**裁決前的安全預設**

> 任何可能影響已序列化狀態的改動，先立個案遷移表；未以 legacy fixtures 證明免遷移，不得自行宣告免遷移。

個案最小矩陣：

- 原始舊檔 → migration → sanitizer，順序固定。
- `scene + node` 與所有 in-progress interaction state。
- 證據、預測、錯誤痕跡、不可逆選擇與資源語意保持。
- migration 冪等性與未知未來版本拒絕。
- 失敗保留原始備份並顯示玩家可讀訊息。
- 不得靜默補授證據、改掉錯誤或洗白歷史。
- 匯出／匯入、重整與回退路徑。

正式通則建議另立 `03_規格/存檔相容與遷移規範`，不要塞進共用守則或 skill。

---

### B-5｜把施工前設計審與施工後實作審混成同一個「對抗審」

目前缺兩個獨立 Gate：

1. **Design Gate**：施工前審 TO-BE 的物理、史實、代理權、證據鏈與互動骨架。
2. **Implementation Gate**：施工後審 AS-IS 是否忠實實現 TO-BE，包含狀態機、存檔、負向路徑、UI、資產與瀏覽器。

共用守則又宣稱「定點驗證取代全面複審」，語氣過度絕對。以下任一情況都必須升級 Implementation Gate：

- schema／存檔。
- 共用引擎、導航、證據解鎖層。
- 新增／刪除節點、分支、狀態鍵或不可逆操作。
- 修正橫跨多章、多場或大量檔案。
- 修法改變原審查假設或超出原定 path set。

定點覆核只適用於：修法侷限於原問題，且 diff-scope 證明未改變接口與契約。

審查標的應固定為 commit SHA 或內容 hash；不能在持續變動的工作樹上宣告最終放行。

---

### B-6｜髒工作樹與 commit 規則看整棵樹，不看目標 ownership

**位置**：common `SKILL.md` 第 89、94 行。

「工作樹混有對方 WIP 時不 commit」比法源的「不碰他人未提交檔案」更寬。對方改章五，不應自動阻止自己提交完全獨立、已驗證的章一文件；把自己的改動交由對方日後一起 commit，反而混淆作者與驗證責任。

**替代規則**

> 以目標檔案、生成耦合與 shared interface 判定 ownership。非重疊 dirty files 不阻止 scoped work；目標檔、生成物或共用接口與他人 WIP 重疊時才停止。stage／commit 永遠只使用明列 path，且必須獲得當期任務授權；push／deploy 另需明示授權。

「恢復已裁契約的 bug」與「改變契約」也要分開：

- runtime 偏離已有明文契約：可直接修＋回歸測試＋修復紀錄。
- 改變體驗、資料語意或契約：先 CR／GB-ADR。
- 無法判定：只診斷，不先施工。

---

### B-7｜skill 宣稱只做索引，§五與 overlay 仍在立新規則

**位置**

- common `SKILL.md` 第 10–14、87–94 行。
- `OVERLAY-claude.md` 第 21–25 行。

§五仍包含：

- 「只改乾淨檔」的漂移規則。
- archive 尚待裁卻先寫「不改」。
- commit 格式。
- 測試保護意圖。
- 講者字串的跨檔同步規則。

overlay 的 `tests.push(...)` 插入方式與 `_factory(...,{})` 也把單一 suite 的做法說成通用工具規則。

**直接修法**

- common §五刪成純路由；正式規則回到共用守則或專屬工程法源。
- overlay 只保留個人慣犯、偏好與不具規範性的工具入口。
- 測試檔結構與章別 factory 參數寫進 `greybox/tests` 的工程說明或由實碼／helper 決定，不放 agent 人格層。

---

### B-8｜現行路徑與安裝狀態全靠人工同步，已反覆漂移

具體證據：

- `02_設計/README.md` 仍標 2026-07-26 與 17 份，實際集合已改變。
- 根 `README.md` 同時保留第四章 v0.2 舊狀態與更新後 runtime 描述。
- common 有錯誤／含糊錨點，見 C-1。
- common 明列的 32 個唯一 Markdown 路徑中，**17 個仍是 untracked**，包含共用守則、工作台規格、跨章規格、第四章 v0.8 規格／劇本、第五章規格、兩份 CR、overlay 與待裁條文。現在這份 skill 若單獨被提交或安裝，會指向乾淨 clone 裡不存在的「法源」。
- repo canonical、治理鏡像、Claude live、Codex active 不是同一生命週期；目前 Codex active 刻意維持 61 行舊版。
- v2 檔頭沒有明確標示「candidate／approved／superseded」，讀者可能把未放行版本當成現行守門。

**建議**

建立一份 machine-readable 現行資產登錄表，例如：

```text
task_type
chapter
phase
status
authority
path
required_headings
supersedes
```

skill 只指向登錄表，不再手抄 ch4／ch5 的高頻路徑。

另加 deterministic validator，至少檢查：

- frontmatter；
- 索引 path 存在；
- 索引 path 已被 Git 追蹤；
- heading／anchor 存在；
- common／overlay／mirror 正規化一致；
- common 無 agent 專屬字串；
- 未裁條文未以規範語氣回流；
- 登錄表與實檔集合一致；
- 安裝候選的 core hash／overlay hash 與 read-back 狀態。

無 read-back 時只能寫「預期已安裝／未獨立驗證」，不能宣告同步完成。

---

## 五、C 級

### C-1｜三個假錨點與一個錯誤相對路徑

- `§UI 控件` 不是工作台規格的實際標題。
- 兩個「同上」不是可驗證索引。
- `治理測試` 未指定檔案或測試名。
- `§5-2` 與來源實際標題「五之二」不一致。
- `src/ch4-migration.js` 應為 `greybox/src/ch4-migration.js`。
- builder 指令未統一說明以 repo root 還是 `greybox/` 為工作目錄。

建議改成：

- 變因／動作控件 → 工作台規格 §3-1。
- 固定變因 → §二。
- 一次一筆／封存預測 → §五。
- 未來清單守衛 → 指定實際測試檔與測試名稱。

### C-2｜trigger 過廣，也漏掉真正需要的詞

「牛頓」「工作台」「斷言」是跨專案常見詞，單獨觸發可能誤載；但 archive、治理、部署、Vercel、存檔遷移、生圖授權又未完整列入。

建議：

> cwd／引用路徑位於本 repo，或使用者明確提到《發現之前》時啟用；一般物理人物或詞彙不能單獨觸發。

### C-3｜Claude overlay 帶有模板偏見

`OVERLAY-claude.md` 第 9 行說第一、二章「公認可用，新章對齊它，不重新發明」，容易把比較基準變成複製模板。

建議替換：

> 第一、二章是互動語言與閱讀節奏的比較基準，不是章型模板；重用已驗證的證據語法，但章別工作、操作與終局形式依當期法源分化。

### C-4｜overlay 的測試速記過度概括

`Narrative._factory(scenes, Engine, {})` 不能保證適用任意章；部分章需要 debate／chapter data。`tests.push(...)` 也不是所有測試檔的通用插入方式。

建議只列完整路徑與「先讀現有 helper／suite」，不要在 overlay 固定函式簽章與插入位置。

### C-5｜缺少 `agents/openai.yaml`

`skill-creator` 把 `agents/openai.yaml` 列為建議的 UI metadata。缺少它不影響 frontmatter 驗證，但會讓顯示名稱、短說明與預設提示無法與新版 skill 一起被固定、驗證。

應在 v3 穩定後生成；現在不宜為尚未放行的 v2 補漂亮包裝。

---

## 六、建議的 v3 最小結構

不要把上述規則全文再塞回 skill。v3 應比 v2 更像路由器，而不是更長的守則。

### 1. 狀態與真相模式

```text
Status：candidate／approved／superseded
Audit mode：AS-IS／TO-BE／CONFORMANCE
```

### 2. 工作包卡

```text
目標／非目標
任務 lane
Decision owner／Author／Implementer／Reviewer
Owned paths
主審對象與比較基線
既有紅燈分類
預定測試／瀏覽器／存檔／美術驗收
退出條件
```

### 3. 風險 lane 路由

只列 R0–R4 的入口與退出條件，細節指向共用守則、遷移法源、美術法源、發佈法源。

### 4. 法源登錄表入口

讀 machine-readable registry，依 `task × chapter × phase` 選路徑；skill 不再手抄高頻變動的章別檔名。

### 5. 交付狀態

固定分開：

```text
已修改
定點測試
全套測試
瀏覽器驗收
獨立審查
已 commit
已 push
已部署
production smoke
真人無提示試玩
```

不把 commit、push 或部署當成普通施工的自動授權。

---

## 七、建議的端到端開發流程

```text
工作包角色與 scope 固定
→ 選 AS-IS／TO-BE／CONFORMANCE
→ 選 R0–R4 lane
→ 讀精確法源
→ 若為新設計，先過 Design Gate
→ 高風險機制先做 spike／契約
→ 施工
→ 定點測試
→ 生成物同步
→ 全套測試
→ 桌機／手機／讀屏驗收
→ diff-scope 判定定點覆核或完整 Implementation Gate
→ 固定候選版 hash／commit
→ 總監無提示試玩
→ 明示核准後才 push／deploy
→ production smoke＋回退點
```

正式美術插在「證據鏈／互動骨架通過 Design Gate」之後，不插在最早的概念稿階段。

---

## 八、v3 放行條件

1. A-1 的 AS-IS／TO-BE／DECISION 三層已落正式法源。
2. A-2 的工作包角色與移交條件已落正式法源。
3. common §五不再是第二規則正文。
4. R0–R4 或等價任務分流成立；已知紅燈有分類規則。
5. 實驗章與非實驗章不再共用「左右頁工作台」硬模板。
6. 存檔通則未裁前有 fail-closed 個案流程。
7. 美術、生圖、瀏覽器、真人試玩、歸檔與發佈路由齊備。
8. Design Gate 與 Implementation Gate 分開；定點覆核有升級條件。
9. 所有 path＋heading 可由 validator 機械驗證。
10. common／overlay／mirror／安裝候選有 hash 與獨立 read-back 狀態。
11. 以下盲測全部選對入口：
    - 尚未進 runtime 的劇本審查；
    - 線上 bug 診斷；
    - 竣工 conformance；
    - 小文件修正；
    - 新章；
    - 生圖與資產接線；
    - schema 遷移；
    - archive 搬移；
    - 正式發佈。

---

## 九、給 Claude 的一句話

> v2 已經把「規則去哪裡找」整理得比舊版好；v3 不該再增加零散鐵律，而要補上「我現在查的是實況還是目標、這個工作包誰寫誰審、不同風險走哪條路、什麼條件才算完成」。最優先修 AS-IS／TO-BE 分層與角色移交邊界，否則 agent 會非常勤奮地審錯版本，或審著審著失去獨立性。
