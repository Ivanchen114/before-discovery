# 《發現之前》五章「去台詞」機制承重盤點

**交付者**：Sol／Codex  
**受審者**：Claude（獨立對抗審）  
**日期**：2026-07-30  
**主審真相模式**：AS-IS（目前 runtime 與 candidate skill 實查）  
**另列但不混用**：TO-BE（本輪設計／skill 工作包）  
**本檔性質**：R0 五章實查＋R3 設計／skill 候選交付；**沒有修改 runtime**。
下列 B-4、C-1 已在 candidate 包施工，且再經一次獨立內部 preflight 攻擊；其餘
runtime 缺口沒有因本輪文件或工具更新而被宣稱修復。Claude 的正式獨立對抗審仍
未完成，candidate 不得因此自行啟用。

---

## 一、總裁決

### 1. 結論

把解說、角色魅力與戲劇台詞暫時抽掉後，五章的核心並沒有整體坍塌。第一、二、三、四、五章都已具備不同程度的：

> 問題／承諾 → 操作 → 原始紀錄 → 選資料 → 形成主張 → 接受質疑或公開支付

真正的問題不是「沒有遊戲」，而是少數環節仍由系統替玩家完成語意判斷，或在玩家提交前把答案說出來。這些地方會讓外觀上有很多按鈕，認知主體卻仍不是玩家。

### 2. 分級

| 等級 | 數量 | 判定 |
|---|---:|---|
| **A** | **2** | 玩家代理權紅線：第五章可用荒謬資料自動取得 J3；第三章提交前先印出標準斷言 |
| **B** | **4** | 三條 runtime 未修；skill 路由與工作台法源狀態錯置已在 candidate 修正，待複審 |
| **C** | **3** | 可否證欄位契約已在 candidate 補上；第三章承諾命名與修復成本差異仍待裁 |

這是「本輪實查發現數」，不是把已修候選項藏掉後重算的漂亮數字。交付當下另分成：

- **仍在 runtime／設計決策中未解**：A=2、B=3、C=2；
- **已在 candidate 包施工、等待獨立複審**：B-4、C-1；
- **已驗證但尚未啟用**：route 分流、雙軌 mechanics guard、可否證資料契約。

candidate 另做一次不由施工者執行的 preflight，初次打出 **A=2、B=4、C=1**：
假 anchor／零 decision 可假綠、證據呈現法源路由錯置、release 漏源、一般互動誤載
工作台、三追問外形殘留、新章／史實來源不 fail closed、法源保存漂移數字。上述
candidate 層七項已逐條修正並加入反向測試；這組分級是 candidate 工具的修前紀錄，
不與上表五章 runtime 分級相加。

**放行判定**：

- 本輪的**設計／skill 候選包**可以進 Claude 對抗審。
- 五章 runtime **不能因本報告或測試綠燈被宣稱已通過「去台詞承重」驗收**。
- A-1、A-2 須各立 runtime CR；B-1～B-3 另行分批。B-4 與 C-1 屬本輪設計／skill 包，應在 candidate 階段先收斂。

---

## 二、作品類型定位

### 2.1 建議統一名稱

本作沒有一個現成市場類型能完整涵蓋全部設計。建議專案內的主名稱固定為：

> **歷史情境科學探究遊戲**  
> 英文工作名：**history-of-science inquiry game**

這是專案自定義的主類型，不宣稱為 Steam 或遊戲研究已經存在的標準分類。學術上
最接近的上位概念是 `epistemic game` 與 inquiry-based science game；前者強調玩家
進入一套專業實作、價值與正當化標準，後者強調提出問題、蒐集／評估資料與形成
結論。但本作再加上歷史限制、原紙來源、有限斷言與知識公開程序，範圍更窄。

輔助標籤可用：

- 證據推理與有限斷言；
- 情境式實驗與建模；
- 關係驅動的互動歷史敘事。

不建議把「視覺小說」「教育遊戲」「歷史模擬」「益智遊戲」任一項單獨當主類型。它們都只描述部分外觀，沒有說出本作最重要的玩家責任。

### 2.2 類型定義

玩家必須在當時可取得的器材、語言、紀錄方式與社會程序內：

1. 造成或保存一個可追溯的觀察；
2. 辨認資料的條件、來源與缺欄；
3. 提出不超過資料能力的主張；
4. 在公開質疑、出版、核帳或關係後果中承擔該主張。

因此，本作不是把現代課本答案搬到古代背景。它要重建的是：

> **當答案還沒有成為課本時，人怎麼把觀察做成紀錄，再把紀錄做成當時站得住的知識。**

這與 `02_設計/發現之前_架構計劃書_v0.3.md` 的憲章一至三一致：玩家以實驗、證據與論證推進；玩家是認知主體；結論必須有可追溯的因果鏈。

---

## 三、「去台詞測試」到底刪什麼

### 3.1 不能把「刪台詞」誤解成刪掉所有語言

本作的某些語句本身就是操作，不只是表演。例如：

- 「我押下一筆會落在這裡」＝封存預測；
- 「我引用這三張原紙」＝選擇證據；
- 「我只主張到這批船」＝限定範圍；
- 「我撤回沒有量到的部分」＝修復證據邊界。

若把這些玩家 speech act 一起刪掉，就不是在檢查玩法，而是把玩法本身拆掉。

正確做法是：

1. 暫時移除解說、金句、角色反應與氣氛文字；
2. 把必要發言降成中性功能標籤，例如：

```text
[選研究問題]
→ [鎖定設計／預測]
→ [執行]
→ [簽收原紙]
→ [選引用資料]
→ [提交有限斷言]
→ [接受質疑]
→ [維持／縮窄／撤回]
```

3. 檢查玩家是否仍能僅憑可見資料與操作後果完成推論。

這是 `02_設計/發現之前_架構計劃書_v0.3.md:33-42` 的「刪台詞測試」及 `02_設計/發現之前_第一至第四章收官與後續章節製作基線_v1.0.md:73-82` 的「對話刪除測試」之操作化，不是新增第二套憲章。

### 3.2 三層承重判準

| 層 | 問題 | 失敗特徵 |
|---|---|---|
| **機械承重** | 去掉解說後，玩家仍有會改變狀態的決策嗎？ | 只剩按「繼續」、跑滿次數、自動頒證 |
| **認知所有權** | 關鍵主張是玩家提交、且引擎真的驗證嗎？ | 系統只收資料 ID，便自動寫成正確結論 |
| **敘事復原** | 台詞放回後，有增加動機、人物關係、歷史壓力嗎？ | 台詞只是在補玩法沒有呈現的推論或操作說明 |

任何一章若只通過第一層，仍不能稱為完整的《發現之前》玩法。

---

## 四、全遊戲系統盤點

### 4.1 九個相互咬合的系統

| 系統 | 玩家責任 | 主要 runtime 載體 |
|---|---|---|
| 問題、關係與授權 | 取得介入現場的理由與權限 | `greybox/data/scenes*.json`、信譽與旗標 |
| 器材／模型與條件 | 決定要改什麼、固定什麼 | 各章 workbench、`engine*.js` draft/state |
| 預測或先承諾 | 結果揭露前留下可被打臉的選擇 | prediction、seal、design、source 或 claim lock |
| 原始紀錄與來源 | 讓動畫、數值、原紙與簽收同源 | 各章 run records、卷宗、帳本 |
| 證據轉換 | 從原紙挑出可引用資料 | selection、assertion、evidence state |
| 主張與適用範圍 | 說清楚資料能支持到哪裡 | concept／scope／claim choice |
| 公開支付 | 面對辯論、出版、核帳或模型競爭 | debate、proof、press、audit |
| 信譽與修復 | 為越界主張承擔關係後果 | `rep`、`repLocked`、修復場 |
| 持久化與呈現 | 讓原紙、錯誤痕跡、可見性不被重整抹掉 | sanitizer、save migration、UI、a11y、art/audio |

跨系統共同不變量應是：

> **玩家創作承諾、紀錄、推論與有限斷言；NPC／世界提供問題、阻力、制度與回應；狀態保存雙方留下的痕跡。**

### 4.2 五章核心循環

| 章 | 去台詞後的主要玩家動詞 | 證據轉換與終局 | 承重判定 |
|---|---|---|---|
| **第一章** | 踏查斜面、選配置、執行多筆、看誤差、押下一筆、選來源與概念 | 從量測形成規律，再以證據回應三柱質疑 | 基本成立；共用辯論引擎仍有三柱寫死問題（B-2） |
| **第二章** | 組裝、校準、量 4／9／16、預測 25、換球、比較成對資料 | 選一組紀錄與概念形成斷言，再進公開辯論 | 五章中承重最清楚之一；但選擇一變動就先提示正誤（B-3） |
| **第三章** | 設計航次、執行、看動畫與原紙、簽收、分類船況、選紙、限縮範圍、對齊與換尺 | 帶卷宗赴碼頭；以三柱完成共同前行、變速邊界與雙紙轉換 | 操作骨架很強；但斷言標準答案在提交前出現（A-2），柱數亦寫死（B-2） |
| **第四章** | 作圖、同尺換算、封存規則、跑軌道、對行星／彗星／模型核帳、接來源與署名 | 終局不是辯論，而是把證明、信用、球殼頁與未知機制接回出版校樣 | 章別差異合理；行星的封存與揭露仍由同一動作自動完成（B-1） |
| **第五章** | 做兩種碰撞、選同速紀錄結算 J1、用同紙重算 J2、追反例、用三速黏土坑建立尺度 | 帶 J1～J3 進兩本帳的辯論 | 資料重用很有價值；但 J3 關係未由引擎驗證，且主張由系統代寫（A-1） |

### 4.3 整體判斷

最強的現有機制不是「答對物理名詞」，而是：

- 第二章：同一組選項骨架只改主張範圍；
- 第三章：分類、保留未分類與同拍換尺；
- 第四章：同一條律跨獨立資料集核帳，並保留來源與空白；
- 第五章：同一批紀錄用兩本帳重算，不能換資料湊結論。

最弱的環節集中在：

> **玩家已經做出資料之後，最後那一步「資料究竟支持哪一句」有時仍被 UI 或引擎代做。**

---

## 五、A 級：玩家代理權紅線

### A-1｜第五章 J3 沒有驗證「坑深跟著速度平方走」，荒謬資料也會通過

**位置**

- `greybox/src/engine5.js:180-193`：`assertJ3(state0, ids)`
- `greybox/src/chapter-ui.js:6325-6326`：未取得前已顯示 J3 標準斷言
- `greybox/src/chapter-ui.js:6531-6533`：UI 只傳 `runIds`，成功後直接宣布平方關係成立

**實際證據**

`assertJ3` 目前只檢查：

1. 至少三筆；
2. 球質量相同；
3. 有三種不同速度。

它沒有檢查 `depth` 是否隨 `v²` 成比例，也沒有要求玩家選擇主張。

以下反例於目前 runtime 回傳 `ok: true`、`evidence: "J3"`：

```js
const E = require("./greybox/src/engine5.js");
const s = E.initialState();
s.clayRuns = [
  { id: 901, ballMass: "light", speed: 2, depth: 99 },
  { id: 902, ballMass: "light", speed: 4, depth: 1 },
  { id: 903, ballMass: "light", speed: 6, depth: 99 }
];
E.assertJ3(s, [901, 902, 903]);
```

實測結果：

```text
ok=true
evidence=J3
phase=complete
depths=[99,1,99]
```

**因果問題**

玩家只做了「選三個 ID」。平方關係的語意由 UI 預先寫好，引擎又沒有驗證。這同時違反「玩家提出斷言」與「引擎不得替錯誤契約背書」。

**直接修法**

1. 工作台在選資料之外，另要求玩家選擇／組成 J3 主張；
2. `assertJ3` 驗證可見資料的關係，例如以同質量資料的 `depth / v²` 是否落在明定容差內判定；
3. 容差、雜訊與最低三速要求由 fixture／法源說明，不由 UI 文案暗示；
4. J3 標準句只在驗證通過後顯示；提交前只顯示中性研究問題。

**可失敗驗證**

- 合法 fixture 三速資料通過；
- `[99,1,99]` 反例必須失敗；
- 深度與 `v`、常數或反向關係不得誤過；
- 未顯示於玩家紀錄簿的隱藏欄位不得被用來解鎖；
- 將關係判定移除時，負向契約必須轉紅。

---

### A-2｜第三章在玩家選紙與選範圍前，已把標準斷言印在題目上

**位置**

- `greybox/src/chapter-ui.js:2686-2696`：`ship3DossierAssertionText(id)` 固定標準斷言
- `greybox/src/chapter-ui.js:2787-2803`：在選原紙、選 scope 前先把該句渲染成 `h4`

**可重現條件**

當任何 dossier candidate（如 A1、A2、A3）可作答時，進入「從資料提出斷言」：

1. 尚未勾選來源；
2. 尚未選 scope；
3. 畫面已顯示 `○ ` 加完整標準斷言；
4. 玩家接著才被問「這些原紙能支持哪一句斷言？」

例如 A1 會先顯示：

> 在這組條件下，船走穩時，石頭三次都落在桅腳附近

**因果問題**

介面宣稱「提示不會預先標出答案」，但標題就是完整答案。後續選項只是在替已公布的句子找按鈕，玩家沒有真正完成歸納。

**直接修法**

- 提交前標題只顯示中性問題，例如「這批走穩原紙最多能支持什麼？」；
- 原紙條件、變因與結果照常可見；
- `ship3DossierAssertionText(id)` 只在成功提交後用於斷言卡、取得證據與 NPC 回應；
- 錯誤後果只指出缺欄／越界，不將標準句補印回去。

**可失敗驗證**

- 提交前 DOM 不得包含該 assertion 的 canonical 完整句；
- 玩家選紙及 scope 成功後，斷言卡才出現 canonical 句；
- 故意把 `ship3DossierAssertionText(id)` 提前放回候選卡時，DOM 契約必須轉紅。

---

## 六、B 級：系統性縫隙

### B-1｜第四章行星「封存預測」與「揭露觀測」仍是同一個動作

**位置**

- `greybox/src/engine4.js:1249-1275`：`predictPlanet(state0, id)`
- `greybox/src/chapter-ui.js:5781-5791`：單一按鈕「封存預測，再揭露觀測」

**實際證據**

`predictPlanet` 在同一次呼叫中：

1. 由系統計算 prediction；
2. 寫入 `sealedAt`；
3. 立刻寫入 `openedAt`；
4. 把 actual、residual 與 pass 一起寫進 row；
5. 立刻令 `planetLab.revealed[id] = true`。

定點實測火星：

```text
sealedAt=1
openedAt=2
revealed=true
revealedAfterSeal=true
prediction=1.874
actual=1.88
```

**因果問題**

時間戳雖先後不同，玩家層只有一個不可中斷的按鈕，沒有「我現在承諾這個預測」與「我決定開封觀測」兩個可辨識動作。

**直接修法**

拆為至少兩個狀態轉移：

1. `sealPlanetPrediction`：生成預測草稿，讓玩家確認並封存；不得寫入 actual／pass／revealed；
2. `revealPlanetObservation`：只能讀取已封存版本，再揭露 actual、residual 與結果。

這會改 serialized state，須獨立列 R4、補舊存檔遷移，不與文字小修混包。

**可失敗驗證**

- 封存後、揭露前，state 與 DOM 都不能讀到 actual；
- 未封存不得揭露；
- 揭露後不得倒回修改同一份預測；
- 重新開律時舊預測與舊觀測均保留為 superseded；
- 把 actual 偷塞回 seal action 時，負向測試轉紅。

---

### B-2｜法源允許二／三／四柱，runtime 仍把「三」寫進狀態與控制流

**位置**

- `greybox/src/narrative.js:263,304,330,617-621`：`idx >= 3`、`slice(0, 3)`、`idx < 3`
- `greybox/src/engine3.js:620-626`：固定 `p1/p2/p3`
- `greybox/src/engine3.js:908-910`：sanitizer 只承認 `p1/p2/p3`
- `greybox/src/engine3.js:2184-2187,2241-2242,2773`：順序、合法值與完成條件均寫死三柱
- `greybox/src/chapter-ui.js:377`：第三章進度固定過濾 `["p1","p2","p3"]`

**對照法源**

`02_設計/發現之前_工作台與辯論架構_一二章實證規格_v0.1.md` §七已寫明「柱數由劇情決定」，並要求 `pillars[]`／`pillarOrder[]` 資料驅動。

**因果問題**

UI 的外觀可以畫第四格，不代表狀態機、完成條件、重進與存檔會承認第四柱。新增第四柱會被引擎提早送入最後反撲，或在 sanitizer 中被洗掉。

**直接修法**

- 以章別 `pillarOrder`／registry 為唯一順序；
- 初始化、目前柱、完成判定、view 與 sanitizer 同源；
- 第三章章別特殊操作用 pillar type／handler 註冊，不靠 `if (pillar === "p3")` 當跨章假設；
- 另做 2、3、4 柱 fixture；
- 若改既有存檔形狀，獨立列 R4 與 migration。

**可失敗驗證**

- 2、3、4 柱 fixture 均可依序通關；
- 中途存檔／匯入後仍停在原柱；
- 4 柱資料不得在第三柱後提早進 final；
- 搜尋共用路徑不得再以 `>= 3`、`slice(0, 3)` 決定辯論完成。

---

### B-3｜第二章在玩家提交前就告知所選資料是否正確

**位置**

- `greybox/src/chapter-ui.js:1472-1477`：`updateLawHint()`
- `greybox/src/chapter-ui.js:1500-1507`：`updateCompareHint()`

**可重現條件**

- 在「從數據提出斷言一」改變來源下拉，立即顯示「不能拿來支持」或 `✓ 這組數據可引用`；
- 在「換球比較」改變兩組資料，立即顯示「同球重測不能回答」「裝置或校準不同」或 `✓ 只換了球`；
- 以上均發生在按下「提出斷言」之前。

**因果問題**

玩家可以用 hint 當即時正解探測器，不必先承擔一次選擇。這削弱「承諾 → 後果 → 診斷」的學習循環。

**直接修法**

- 提交前只中性回述所選資料的可見條件，不判正誤；
- 第一次提交失敗後，才指出哪一欄不同或哪種對照缺失；
- 學者模式可以延後完整診斷，探索模式仍不得在承諾前亮綠勾。

**可失敗驗證**

- 改下拉但未提交時，不出現 `✓`、`不能支持` 或正解性判詞；
- 提交錯誤後才顯示與實際缺欄相符的診斷；
- 失敗後不刪選項、不自動換成正確資料。

---

### B-4｜candidate 施工前，純歷史探究無條件路由到工作台法源，且工作台法源自己的狀態互相衝突

**位置**

- `tools/skill/before-discovery-dev/references/source-registry.json:471-541`
- `tools/skill/before-discovery-dev/SKILL.md:164-170`
- `02_設計/發現之前_工作台與辯論架構_一二章實證規格_v0.1.md:4,17-25,178,218`

**原缺陷的可重現條件**

在本輪 candidate 修正前執行：

```bash
python3 tools/skill/before-discovery-dev/scripts/skill_guard.py route \
  --task historical-inquiry \
  --phase plan \
  --mode TO-BE \
  --lane R0
```

輸出會同時載入：

```text
SOURCE design.workbench | active | ... | registry-role=constraint
CAUTION narrative.historical-inquiry | candidate | ...
```

但 `design.workbench` 的 note 又說「只在任務含實驗工作台或辯論語法時讀」。

另有三個狀態矛盾：

1. 工作台文件檔頭自稱「法源候補」；
2. registry 把它標成 `active`；
3. 文件前段稱「四段主流程不可省略、不可換順序」且寫死「三個追問」，後段又明定柱數由劇情決定、終局不限三追問。

**因果問題**

router 的 route-level tasks 不能實現 source note 的條件式載入。純故事／歷史探究會被一二章工作台外形誤約束；同時，審查者無法判定文件究竟是 active 法源、candidate 比較樣本，還是只含部分 active 條文。

**直接修法**

1. 將「歷史探究敘事／證據責任」與「工作台／辯論具體語法」拆成不同 route 或 source filter；
2. `historical-inquiry` 仍須讀證據所有權與正式探究敘事法源，但不因 task 名稱就自動讀工作台；
3. 只有 `workbench`、`debate`、`evidence-payment` 等明示任務才載入 `design.workbench`；
4. 工作台文件明定為「含工作台／證據支付／辯論語法時的 active 法源」，並把
   「不可省略」改成核心功能不可由 NPC／系統代做，呈現順序與終局形式依章；
5. registry status、文件檔頭與 skill 文字一次同步。

**可失敗驗證**

- 純 `historical-inquiry` route 不出現 `design.workbench`；
- 加 `--task workbench` 或 `--task debate` 才出現；
- 文件檔頭與 registry status 不得一個 candidate、一個 active；
- required headings 與 route 測試在改壞條件載入時轉紅。

**candidate 修正現況（2026-07-30）**

- registry 已拆成 `design`（證據／歷史探究）與 `workbench`
  （`workbench`／`debate`／`evidence-interaction`／`workbench-interaction`）
  兩條 route；一般 `interaction` 歸 narrative；
- 純 `historical-inquiry` 不再載入 `design.workbench`；
- 工作台檔頭改為「含工作台／證據支付／辯論語法時的現行法源」；
- 「不可省略、不可換」改為認知功能不得被代做，外形與分段可變；
- 正向／反向 route 測試已加入；本項等待 Claude 定點覆核，不再列為待施工。

---

## 七、C 級：契約與設計決定仍需補齊

### C-1｜跨章尚無「錯項必須能被玩家自己的可見證據否掉」之資料契約

**位置**

- `greybox/data/debate.json`
- `greybox/data/debate2.json`
- `greybox/data/debate5.json`
- `greybox/src/engine3.js:2396-2612`

目前三份 debate data 各有 3 個 `weakTo`，但三份合計 `refutedBy` 命中為 0；第三章的多數概念與 scope 判定則硬編碼於 `answerDossierDebate`。

**風險**

文字上看似合理的錯項，可能根本不用讀原紙就能靠常識或語氣排除。這不是單靠「三個選項都有同樣長度」能抓到的問題。

**本輪設計／skill 包應做**

把契約放在：

`02_設計/發現之前_實驗證據所有權與認知進階原則_v0.1.md`

而不是把全文抄進 skill。最小欄位只適用於科學／認知判斷，不強套角色態度或純敘事選擇：

```json
{
  "kind": "epistemic",
  "supportedBy": [
    { "evidenceId": "A1", "visibleField": "landingOffset" }
  ],
  "refutedBy": [
    { "evidenceId": "A1", "visibleField": "landingOffset" }
  ],
  "commitBeforeReveal": true,
  "consequence": "opponent-points-to-missing-field"
}
```

機械檢查能確認：

- 欄位存在；
- evidence／field 已登錄；
- 該資料在作答前可見；
- 沒有正解預選；
- commit 早於 reveal；
- 錯項有可讀後果。

機械檢查**不能**證明錯項在語意上真的誘人。反向 fixture 應使用「缺欄、未知欄位、資料尚未可見、先 reveal 後 commit」；不要宣稱把文字改成荒謬句就一定會被結構檢查器抓到。

**candidate 修正現況（2026-07-30）**

- `實驗證據所有權與認知進階原則` 已升至 v0.1.5，§3.7 成為唯一語意法源，§5.1
  單一持有全章 evidence state／解鎖／配圖與來源 ledger；
- `refutedBy.relation` 限定
  `contradicts`／`confounded`／`out_of_scope`／`insufficient`；
- `mechanics_guard.py` schema v2 已綁 canonical `scenes*.json`，用靜態 CFG 與
  dominance 驗八拍承重、玩家 authorship、先承諾後揭露、失敗保留 trace、無預選、
  source／field 真實存在、runtime 真正 grant 同一 evidence id 且作答前可見；
- 已有缺拍、順序顛倒、NPC 代推論、刪除 `refutedBy`、未知欄位、太晚可見、
  kind 降級逃檢、`ch99`／假 anchor、零 decision 無豁免、未登錄 runtime choice 等
  反向 fixture；
- 動態 state／`require`／`return` 的完整可行性、語意可信度與物理／史實正確性仍
  明列為人工覆核；工具不再以 `reachable:true` 自證。

---

### C-2｜第三章 canonical dossier 的主要承諾是「實驗設計／來源選擇」，不是每段都有封存預測

**位置**

- `greybox/src/engine3.js:1976-2042`：設定 draft 後 `runDossierExperiment` 直接生成 pending record
- `greybox/src/chapter-ui.js:3432-3468,3471-3628`：船艙與甲板程序

**判定**

第三章有些既有子系統含預測，但目前 canonical dossier 並非每個實驗都要求先押落點。這不必自動升成缺陷：`收官基線` §三允許玩家先承諾「預測、設計、來源或主張」其中一種。

需修的是命名與驗收誠實：

- 若此段的認知工作是控制條件、留下完整原紙與判讀船況，就稱為「設計／程序承諾」；
- 不得只因玩家先選了設定，便在跨章矩陣寫成「已完成封存預測」；
- 若未來要考預測，必須新增結果前的獨立 lock，而不是事後問「你原本是不是這樣想」。

Claude 請裁：維持程序承諾，或另立 CR 增加真正預測；不要在文件裡把兩者混為一談。

---

### C-3｜信譽修復成本已分成兩類，但「為何可以不同」尚未成為明文原則

**位置**

- `greybox/data/scenes.json`、`greybox/data/scenes2.json`：`SC-R1` 要完成一輪乾淨實驗
- `greybox/data/scenes3.json`：`SC3-R1` 以撤回越界主張修復
- `greybox/data/scenes4.json`：`SC4-R1` 以接回來源與保留未知修復
- `greybox/data/scenes5.json`：`SC5-R1` 以讓兩本帳各自說話修復

**判定**

目前已不是「按一下就原諒」：第三至五章各有錯誤替代項與 NPC 回應。但章際成本仍不對稱：

- 第一、二章的失信是程序／資料不誠實，所以用乾淨實驗修；
- 第三至五章的失信多為主張、來源或未知邊界越界，所以用可判錯的撤回／重寫修。

這個差異可以是好設計，不必強行改成每章重做實驗；但法源應明寫：

> **修復成本對應違約類型，不追求表面一致。程序造假用新紀錄修；語意越界用玩家親自辨認、撤回並留下錯誤痕跡修。**

Claude 請檢查各章的扣分 reason 是否真與修復行為對應，不能用一句通用道歉跨過不相干的違約。

---

## 八、本輪設計／skill 包與 runtime CR 的界線

### 8.1 本輪候選包可以處理

| 項目 | 層級 | 本輪目標 |
|---|---|---|
| 類型定位與九系統地圖 | 設計法源 | 固定「歷史情境科學探究遊戲」與核心不變量 |
| 去台詞測試操作化 | 收官基線／設計法源 | 分清 prose 與 speech-act mechanics |
| 誘答可否證欄位 | 證據所有權法源 | 定義 `supportedBy`／`refutedBy` 與人工邊界 |
| mechanics guard | skill 工具 | 驗結構、可見時序、未知 evidence／field 與反向 fixture |
| route 收斂 | skill registry | 修 B-4，避免純探究被工作台外形綁架 |
| skill 正文 | 路由器 | 只增加命令與法源路由，不複製設計條文 |

### 8.2 本輪不得冒稱已完成

| 待開 CR | 內容 | 風險 |
|---|---|---|
| **CR-A5-J3** | 玩家選主張；J3 驗證坑深／`v²` 關係 | R3，涉及物理與 evidence gate |
| **CR-A3-PREANSWER** | 第三章候選卡改中性題目，成功後才顯示斷言 | R2；需 DOM 負向測試 |
| **CR-B4-PLANETS** | 行星封存與揭露拆成兩個狀態 | R4；需存檔／遷移 |
| **CR-B2-FEEDBACK** | 第二章診斷移到提交後 | R2 |
| **CR-B-PILLARS** | 二／三／四柱資料驅動與 sanitizer／migration | R4；不得混入一般 UI 小修 |

本報告**沒有授權、沒有施工、沒有驗收**上述 runtime CR。

---

## 九、建議執行順序

1. **先審法源責任**  
   Claude 先審類型定義、去台詞三層測試、`refutedBy` 邊界，以及工作台法源是否已
   清楚限定為「實際含工作台／證據支付／辯論語法時的 active 法源」。

2. **複審 candidate skill**  
   B-4 路由、mechanics guard 與負向 fixture 已施工；Claude 請依第十節定點覆核。
   候選通過且總監裁決前，仍不得安裝成任何 agent 生效版。

3. **總監裁決三件事**  
   - 是否採用「歷史情境科學探究遊戲」作專案主類型；
   - 第三章維持程序承諾，或新增真正預測；
   - 章際修復成本差異是否按違約類型正式立法。

4. **先修兩條 A，分開驗**  
   A-1 與 A-2 可同屬代理權批次，但各有自己的反向條件；不得以其中一條通過代替另一條。

5. **再修 B-3 與 B-1**  
   第二章 feedback timing 是低風險 R2；第四章 planet state 是 R4，另包施工。

6. **最後處理柱數資料化**  
   這是共用引擎、章別狀態與存檔變更，必須另開完整 CONFORMANCE，不應為了「順手」混進前述小修。

7. **全綠後交總監無提示試玩**  
   自動測試、Claude 對抗審與 Sol 瀏覽器檢查都不能代替真人判斷選項是否有誘惑力、故事是否自然、玩家是否真的覺得結論是自己做出來的。

---

## 十、給 Claude 的定點覆核清單

### A. 法源與 skill

- [ ] 「去台詞」是否只抽 prose，保留預測、引用、斷言、撤回等 speech act？
- [ ] 新原則是否寫進唯一法源，而非 skill、工作台文件與治理鏡像各抄一份？
- [ ] `refutedBy` 是否只要求科學／認知判斷，不誤傷角色態度與敘事選擇？
- [ ] 機檢是否誠實標示只能驗結構，不能驗選項在語意上是否可信？
- [ ] 純 `historical-inquiry` route 是否不再無條件載入 `design.workbench`？
- [ ] 加 `workbench`／`debate` task 時，工作台法源是否確實載入？
- [ ] 工作台檔頭 status 與 registry 是否一致？
- [ ] 「四段不可省略」與「終局形式／柱數可變」是否已消除字面衝突？
- [ ] skill 是否仍只做路由與守門，沒有長成第二份法典？

### B. Runtime 延後 CR

- [ ] A-1 的 `[99,1,99]` 反例是否從通過改為失敗？
- [ ] J3 是否同時驗證玩家選的資料與玩家選的主張？
- [ ] A-2 提交前 DOM 是否不含 canonical assertion 完整句？
- [ ] 第四章 seal action 是否完全不持有 actual／pass／revealed？
- [ ] 第四章 reveal 是否只能讀已封存預測，且改律後舊稿可追溯？
- [ ] 2／3／4 柱 fixture 是否都能完成、保存、匯入與重進？
- [ ] 第二章改下拉但未提交時，是否只回述條件、不判正誤？

### C. 反向性

- [ ] 刪掉 `refutedBy` 時 guard 轉紅；
- [ ] 寫入不存在的 evidence／field 時轉紅；
- [ ] 用作答後才可見的資料當反駁時轉紅；
- [ ] reveal 早於 commit 時轉紅；
- [ ] 把第四章 actual 塞回 seal 時轉紅；
- [ ] 把第三章 canonical assertion 提前放回候選卡時轉紅；
- [ ] 把第五章關係判定移除時，荒謬資料反例轉紅。
- [ ] `ch99`、不存在的 scene/node、零 decision 無合法豁免是否 exit 2？
- [ ] catalog 與 contract 同時把 evidence id 改成假值時，是否因 runtime 沒有 grant
  該 evidence 而轉紅？
- [ ] 圈定路徑若藏有未登錄 choice/embed，是否轉紅？
- [ ] `historical-claim` 的 write／implement／art 未給外部 provenance，或只拿
  runtime `histfacts` 自證時，是否 exit 2？
- [ ] 未登錄新章是否以 `chapter brief` 才准 write、以凍結後 chapter spec 才准
  implement／art，且兩者都不能取代 provenance？
- [ ] 新章支援檔的文件角色、章別、狀態是否有機械契約；錯章、錯角色、未凍結、
  同檔兼任與拿任意 JSON 冒充是否 exit 2？

---

## 十一、總監真人試玩邊界

### 自動化與對抗審能回答

- 狀態是否可達、可重進、可遷移；
- 玩家提交前是否已有答案或隱藏結果；
- evidence／field 是否存在且在當時可見；
- 錯誤是否保留原紙並留下可追查後果；
- 柱數是否真正資料驅動；
- 負向反例是否會紅。

### 只有總監無提示試玩能回答

1. 去掉角色解說時，是否仍知道自己下一步在解哪個問題？
2. 是否能用自己的話說出「我選了什麼 → 看見什麼 → 所以只能說到哪裡」？
3. 錯項是否真的「對一半」，必須讀證據才能否掉，而非一眼看出荒謬？
4. 放回台詞後，是否增加人物動機、關係與歷史壓力，而非替玩法補講答案？
5. 旅人是否像在場的合作者，而非只在需要按按鈕時突然被叫來？
6. 答錯時，是否感到「我的主張被紙打回來」，而非「系統說我錯」？
7. 桌機與手機橫屏的閱讀、捲動與同屏比較是否自然？

第 7 項及整章節奏由總監保留最終裁決。任何自動綠燈都不得寫成「真人已接受」。

---

## 十二、本報告實查紀錄

Outcome: 五章 AS-IS 承重盤點完成；R3 設計／skill candidate 已建立並通過本地結構與
回歸驗證，等待 Claude 獨立對抗審。

Truth mode: AS-IS（runtime 缺口）＋ TO-BE（candidate 法源與 skill），兩者在本文分列，
未用候選規格冒充已上線行為。

Target and comparison baseline: candidate 主對象為本報告 §8.1 所列法源／skill 包；
比較基線為 2026-07-30 工作樹的五章 runtime。

Design Gate: PENDING — Claude 對抗審與總監裁決尚未完成；candidate 不得切成 active。

Files changed: candidate 範圍包含設計索引／跨章法源／系列聖經、skill 正文／
registry／guard／測試／鏡像及本報告；玩家 runtime 變更 0。共享工作樹另有大量
既存 WIP，不把整份 `git status` 冒充本包施工清單。

Focused tests: PASS —

- `test_mechanics_guard.py`：20/20；
- `test_skill_guard.py`：48/48；
- `skill_guard.py validate`：0 errors、46 warnings；
- route 對照：純 `historical-inquiry` 不載入 `design.workbench`，明示 `workbench`
  才載入；一般 `interaction` 歸 narrative；release 取得 closeout／accessibility／
  review；史實 mutation 無外部 provenance 會阻擋；
- `quick_validate.py`：`Skill is valid!`；
- `git diff --check`（本包 tracked 路徑）：PASS；
- 第五章 J3 荒謬資料反例仍回傳 `ok=true`、`evidence=J3`；
- 第四章火星仍由同一次 `predictPlanet` 寫入 seal、open、actual 與 revealed；
- 三柱常數、第三章斷言提前渲染、第二章提交前 correctness hint 仍存在。

Full tests: PASS

Full test evidence: `cd greybox && npm test` exit 0；主契約 136 通過、0 失敗，
第四章遷移 19 groups／205 legacy cursors 通過，其後美術與系列首頁檢查亦通過。

Registry updated: YES

Registry scope: 只更新 repo candidate registry；沒有宣稱任何 agent 生效版已同步。

Browser/device: NOT RUN — 本包未改玩家 runtime；桌機／手機與無提示遊玩保留到各
runtime CR 完成後。

Accessibility: NOT RUN — 同上；mechanics contract 的可見性欄位檢查不能代替讀屏、
鍵盤與同屏實機驗收。

Independent review: INTERNAL PREFLIGHT COMPLETED — 修前 A=2、B=4、C=1 已全部回打
並補反向測試；CLAUDE PENDING。本地第二審不能取代指定的 Claude 正式對抗審。

Human playtest: NOT RUN — 保留給總監；第十一節列出自動化不能回答的七問。

VCS: 未 stage、未 commit、未 push；共享工作樹原有大量他人 WIP。

Release: NONE；candidate 未安裝、未發佈。

Production smoke: N-A — 無部署。

Known gaps: A-1、A-2、B-1～B-3 尚未施工；C-2、C-3 待裁。另
`validate --activation` 如預期 FAIL（41 errors、17 warnings），主因為 candidate
狀態、尚未獨立審／裁決、active 來源與 skill 套件尚未由 Git 追蹤，以及既有
activation blocker；此紅燈必須保留到正式啟用條件全滿足。

Preserved foreign WIP: YES — 未改、未 stage、未搬移本包以外的 dirty files。

Runtime fixes: NONE。

---

## 十三、一句話交接

> 五章的骨架值得保留；下一步不是把台詞再刪一輪，而是把「最後這句是誰做出來的」鎖進資料、引擎與反向測試——然後再讓台詞回來，負責人物與歷史，而不是替系統代答。
