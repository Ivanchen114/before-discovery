---
name: before-discovery-dev
description: Use for review, diagnosis, design, writing, implementation, testing, artwork, save migration, browser acceptance, archiving, or release work when the current workspace or referenced path is the 《發現之前》 repository. Also use when the user explicitly names 《發現之前》, its greybox runtime, stage shell, chapter data, evidence system, CR, GB-ADR, or chapter-specific production. Do not trigger for general physics, Newton, Galileo, history, workbench, or debate questions unrelated to this repository.
---

# 《發現之前》開發路由器

**版本**：v3.5.0-candidate（2026-08-08）
**狀態**：candidate；v3.4.7 是 HEAD 內最近一次 active 版。本版新增第六章路由與
互動骨架審查，須完成獨立 CONFORMANCE、總監裁決與 activation 驗證後才可冒充生效版。

本 skill 是任務分類器、法源路由器與狀態守門員，不是第二份專案法典。規則內容以 repo 法源為準；路由與狀態由
`references/source-registry.json` 管理。

---

## 1. 先建立工作包卡

先從使用者要求與 repo 實查填卡；能自行查到的欄位不要反問使用者。

```yaml
objective:
deliverable:
truth_mode: AS-IS | TO-BE | CONFORMANCE
target:
comparison_baseline:
scope_in:
scope_out:
lane: R0 | R1 | R2 | R3 | R4
decision_owner:
artifact_author:
implementer:
independent_reviewer:
capability_constraints:
provenance_records:
mutation_authority: read-only | selected-files | implementation | release
owned_paths:
protected_paths:
existing_reds:
save_impact:
validation_required:
stop_conditions:
```

只有缺值會改變主審對象、修改權限或驗收標準時才停下詢問。指定版本不存在時先回報，不得自行拿另一版代替。

角色、移交、lane 與雙 Gate 的現行正式條文見：

`01_治理/發現之前_開發工作包與審查閘門規範_v0.1.md`

審查者提供直接修法，不會自動取得施工權；角色只因當期任務書、總監指派或明確移交而改變。

能力限制不因角色移交而消失：目前正式生圖只能由 Sol／Codex 執行。Claude 可提出需求、prompt、接線規格與獨立審圖，但不得被指定為生圖執行者。

---

## 2. 只選一種真相模式

| 模式 | 主對象 | 比較用途 |
|---|---|---|
| **AS-IS** | runtime、目前工作樹、實際資產與存檔行為 | 規格與劇本只解釋意圖 |
| **TO-BE** | 使用者指定的候選稿、規格、CR 或工作包 | runtime 用來估成本與相容性 |
| **CONFORMANCE** | 已施工成品 | 同時固定核准目標與實際成品逐項比對 |

runtime 能證明玩家現在玩到什麼，不能取代尚未施工的主審稿。候選稿能定義本輪目標，不能冒充已上線事實。測試能保護契約，不能替錯誤契約背書。

---

## 3. 依實際動作選 lane

| Lane | 用途 |
|---|---|
| **R0** | 唯讀盤點、診斷、對抗審與報告 |
| **R1** | 索引、非玩家可見文件、可逆 metadata、小型既有契約修復 |
| **R2** | 玩家文案、既有 UI／資料／美術接線；不動共用契約或存檔 |
| **R3** | 新章、新機制、物理／史實、證據、代理權、共用引擎或狀態語意 |
| **R4** | schema／存檔、刪除／歸檔搬移、公開發佈或不可逆外部操作 |

以最高風險項定級，不因拆成小檔而降級。唯讀查 R4 範圍仍是 R0。

---

## 4. 先路由，再讀法源

從 repo root 執行：

```bash
python3 tools/skill/before-discovery-dev/scripts/skill_guard.py route \
  --task <task-or-route> \
  --chapter <chN> \
  --phase <plan|write|diagnose|implement|art|verify|review|release|archive> \
  --mode <AS-IS|TO-BE|CONFORMANCE> \
  --lane <R0|R1|R2|R3|R4> \
  --target-path <exact-local-or-repo-path> \
  --target-label <non-file-work-package-label> \
  --chapter-brief-path <new-chapter-case-brief> \
  --chapter-spec-path <new-chapter-implementation-spec> \
  --provenance-path <fact-ledger-or-provenance-file> \
  --impact <art-change|serialized-state-change|archive-mutation|shared-engine-change>
```

`--chapter` 只在章別工作使用，可接受 `ch1`、已登錄的 `ch6`，或尚未登錄的 `ch7` 等 token；token 本身不會生成章法源。新章可先用 token＋`WP-*` target 做 `plan`；進 `write` 前必須另給 repo 內既有的 `--chapter-brief-path`（案件資格、機制骨架、物理邊界）與至少一個 `--provenance-path`；進 `implement` 或 `art` 前才要求劇本凍結後建立的 `--chapter-spec-path` 與 provenance。不得為了通過 router 在劇本前偽造完整功能規格。新章進入上述三個 phase 時，三類支援檔都必須以 UTF-8 YAML front matter 自報 `bd_artifact`、`bd_chapter`、`bd_status`：brief 使用 `chapter-brief / chN / design-gate-passed`，implementation spec 使用 `implementation-spec / chN / frozen`，provenance sidecar 使用 `historical-provenance / chN / review-ready|verified`。同一實體檔不得兼任不同角色；原典 PDF／網頁資訊寫入 provenance sidecar，不直接假扮 gate 文件。router 只核對角色、章別與狀態宣告，不能獨立證明簽核真實性、史料品質或 Design Gate 實質通過。`historical-claim` 的 plan／review 可用已登錄章別定位現況；進 `write`／`implement`／`art` 時，不論新舊章都必須另給至少一個 `--provenance-path`，runtime 史實頁不得替新主張自證。`--lane` 必填。除純 `plan` 外，都要用 `--target-path` 或 `--target-label` 固定主對象；缺少時路由直接阻擋。兩者皆可重複：前者必須是 repo worktree 內既有的一般檔案，並以實體檔案身分辨識大小寫、絕對路徑與目錄 source 的子檔；未登錄檔案仍會以「第一章」至「第六章」檔名標記檢查章別衝突。後者採 `WP-*` 工作包格式，只能含英數、底線與連字號，不能拿不存在的檔名或 registry source id 假扮 label。router 不靠副檔名猜類型。明示 target 高於 registry 的預設 `primary`；未命中的既有章稿只降為比較資料，superseded 來源除非被明示為 target 否則不載入。lane floor 依「實際會不會改狀態」判斷：`review`／`diagnose`／`verify` 的唯讀實查可維持 R0；真正施工時，`serialized-state-change` 不得低於 R4、`shared-engine-change` 不得低於 R3、美術與玩家可見既有接線不得低於 R2，`release`／`archive` 必須 R4。`commit`／`push`／`deploy`／`publish` 等 release route action 即使搭配其他 mutation phase 也不得低於 R4。已知共用 runtime／存檔核心路徑會自動補 impact，但施工者仍須申報其他實際受影響面。`--impact` 可省略或重複。美術、存檔與 archive 任務會依 task／phase 自動加入相應 impact；發佈既有內容不會被誤算成美術改版。可重複 `--task`，選最窄且足夠的路由。常用 route：

```text
core runtime design workbench narrative history art license browser accessibility
reputation save archive release review testing chapter.ch1 ... chapter.ch6
```

未登錄新章沒有 `chapter.chN` 專屬 source；先走通用路由，並依上文用章規格與
provenance 實檔 fail-closed。不得把能解析 `chN` 誤稱為該章法源已齊。

一個工作包跨多個 phase 時，每個實際 phase 各跑一次路由。例如新增證據圖又接 runtime，至少分別跑 `art` 與 `implement`；不得只跑較方便的一個。`diagnose` 會明示借用 `verify` 的現況證據篩選，但仍保持 R0 診斷語意。

讀取路由輸出的必要法源；不得靠記憶引用條文。輸出 `SOURCES_BLOCKED` 代表該 phase 尚缺正式法源或資產，不得自行補猜；`CAUTION` 代表候選內容只能用於規劃／審查，不能冒充 active。`SOURCES_ROUTED` 只證明法源選擇沒有已登錄 blocker，**不代表** Design Gate、路徑所有權、修改授權或發佈授權通過。

route exit code：`0`＝路由完成、`1`＝參數錯誤、`2`＝存在阻擋。不要以 shell 管線末端命令的 exit code 代替 router 本身結果。

---

## 5. 比例化 preflight

所有 lane 都先執行：

```bash
git log --oneline -8
git status --short
```

保存精確工作樹快照，辨識 `OWNED`、`FOREIGN-WIP`、`SHARED-GENERATED` 與 `UNKNOWN`。只看相關路徑及生成耦合；非重疊 dirty files 不會自動卡死 scoped work。

測試基線依 lane：

- **R0**：只跑能驗證本輪主張的定點命令；唯讀審稿不被無關紅燈阻止。
- **R1**：先跑定點檢查；是否跑全套取決於實際 diff-scope。
- **R2–R4**：施工前記錄 `cd greybox && npm test` 完整基線，施工後重跑。

紅燈標成：

1. 本輪就是修它；
2. 與本輪路徑／接口重疊，必須先處理；
3. 已知但不重疊，可在完整揭露與限定路徑下繼續。

不要重用舊測試數冒充本輪結果。

---

## 6. 依授權工作

### Review

維持唯讀。先給總裁決，再依治理法源分級。每條可執行意見都要含：

```text
位置 → 實際證據 → 因果問題 → 直接修法 → 可失敗的驗證條件
```

### Diagnosis

查明失敗層、重現方式與原因。使用者未要求修復時，不修改。

### Implementation

只施工已通過 Design Gate 的 TO-BE：

- 先改人工正本，再更新生成物；
- 不碰包外 dirty files；
- 不在施工中靜默改變目標、證據邊界、存檔語意或非目標；
- 發現目標不可行時退回 Design Gate，不由施工者自行改題；
- 高風險行為同時建立正向與負向契約。

新章與新互動先讀《收官基線》§三的跨章因果，不強套第一、二章工作台外形。
只有任務實際含實驗工作台、證據支付或辯論語法時，才加
`--task workbench`／`--task debate`／`--task evidence-interaction`／
`--task workbench-interaction`，並讀
`02_設計/發現之前_工作台與辯論架構_一二章實證規格_v0.1.md`；
一般場景 choice／embed 使用 `--task interaction`，歸 narrative；純
`historical-inquiry` 不自動載入工作台。柱數、卡片欄位與操作細節只維護在該法源，
不複製進 skill。

工作台／證據互動的交付包，必須依 `design.workbench` 的現行 output contract
逐項回報操作決策密度、原始紀錄可追查性、斷言回應、斷言後離台／對話／再入接縫、
筆記可見性、重播副作用與重播定位，
以及每個必按動作究竟在支付選證據、做推論、限主張或資料轉換中的哪一項；
辯論另須回報章別備忘與證據卡第一層的認知負荷；
本 skill 只負責把任務送到該法源，不另存一份細節規則。

劇本、故事、旅人心聲、角色聲線或「古代如何做出知識」的工作，使用
`--task narrative`；同時涉及歷史情境、探究迴路與證據資格時，再加
`--task historical-inquiry`。路由後依正式敘事法源 §十的完整精修流程執行；
不得先靠局部潤稿掩蓋場景功能缺口，也不得用 OS 補足主角在場。

台詞、幕間、轉場與工作台注入字串的撰寫或改寫，另讀
`02_設計/發現之前_文字與對白規範_v0.1.md`：轉場動機、旅人不念規程、
實體動作密度、玩家發言權、斷言簽收儀式與必須保護的既有段落都只維護在該法源，
不複製進 skill。交付前跑 `check-narrative`；六條可機檢規則的 warning 必須逐條
修正或書面說明，不得為追求歸零硬塞無意義選項。即使 warning 歸零也不等於台詞
已通過，人工四問仍須書面回答。

六章橫向編劇審查先以通用 `narrative`＋`interaction` route 綁定全部實際 target，
不要重複宣告 `--chapter`；再逐章各跑一次 `check-narrative --story-audit`。報告必須
分開四個證據面：首個可達玩家行動、場景 choice、embed、引擎內已標註決策；
未標註的工作台互動另讀 engine/UI。不得用「場景 choice 少」推論整章沒有玩法，
也不得用「按鈕多」推論代理權成立。choice 匯流、單選儀式、最長 line 段與 embed
前後接縫的精確邊界見 `references/narrative-guard.md` 與正式敘事法源 §3.3–3.6。

信譽、研究誠實、授權支付、歸零修復或信譽事件帳的工作，使用
`--task reputation`；章別個案再加 `--chapter chN`。不得只讀一般設計原則，
漏掉跨章信譽法源與該章 CR。

史實性證據圖與時代場景在生圖前同時路由 `history`：runtime 史實頁只提供現況對照，新增的年代、器物、服飾、文本或科學主張仍須回查原典或權威館藏，並把來源與生成參數寫入逐件 ledger。

---

## 7. 驗證與 Gate

R2–R4 施工前須有 `DESIGN GATE：PASS`；施工後依現行流程法源完成 Implementation Gate。

驗證順序依實際改動選取：

```text
定點測試
→ 必要生成物同步
→ 全套 npm test
→ 桌機／手機／鍵盤／讀屏／降低動態
→ 獨立 CONFORMANCE
→ 固定內容 hash 或 commit
→ 總監真人無提示試玩
→ 明示授權後才 push／deploy
→ production smoke 與回退點
```

定點 verification pass 只有在原問題、原 path set、接口與狀態皆未擴張時才足夠。schema、存檔、共用引擎、導航、證據層、新分支、新狀態鍵、跨章或範圍漂移，一律升級完整 CONFORMANCE。

四律展開稿與 runtime 在交付前執行 `skill_guard.py check-narrative`。它支援 ch1–ch6，
把首個玩家行動、公開發言／活躍心聲／相容庫存、逐章禁詞、金句候選、章際問句與
壓縮率做成可重跑診斷；`--story-audit` 另列場景標題、choice/embed、匯流形狀、
工作台接縫與陣列相鄰的最長 line 段。四律本體使用明示節拍 contract 防止核准節點
被刪除或調亂。完整命令、contract 格式與人工邊界見 `references/narrative-guard.md`，
不得把 warning 歸零誤稱為戲劇品質已通過，也不得把心聲數量或 choice 數量當成
故事品質分數。

主要實驗、觀察、建模、史料判讀、對帳、出版與公開論證段，在 **Design Gate 先
撰寫並人工審查 schema v2 contract**；此時它是 TO-BE 的結構承諾，不能冒充機械
PASS。等 canonical `scenes*.json` 已存在後，才在 Implementation Gate 與交付前執行：

```bash
python3 tools/skill/before-discovery-dev/scripts/skill_guard.py check-mechanics \
  --contract <chapter-mechanics-contract.json>
```

它把 contract 綁到該章 canonical scenes JSON，以靜態控制流與 dominance 守
「探究段雙軌承重」及 `evidence_judgment` 的可否證結構：玩家承諾、操作、留痕、
解讀、阻力、成功／失敗後果，及錯項引用的可見來源欄位。新章若尚未有相應
`scenes-json` adapter／canonical target，交付狀態必須保持 BLOCKED，不得拿
`reachable: true` 自證。格式、負向 fixture 與人工邊界見
`references/mechanics-guard.md`。工具不能證明動態 state／`require`／`return` 的
完整可行性、錯項真的可信、物理／史實真的正確或台詞真的精彩；綠燈不得冒充真人
試玩。

commit、push、deploy 與公開發佈不是普通施工的默認授權。

---

## 8. 交付時分開報狀態

```text
Outcome:
Truth mode:
Target and comparison baseline:
Design Gate:
Files changed:
Focused tests:
Full tests:
Registry updated: YES / N-A
Browser/device:
Accessibility:
Independent review:
Human playtest:
VCS:
Release:
Production smoke:
Known gaps:
Preserved foreign WIP:
```

`implemented`、`tests passed`、`browser checked`、`human accepted`、`committed`、`pushed`、`deployed` 與 `production smoke passed` 必須各自有證據，不得互相代稱。

R2–R4 交付可再跑：

```bash
python3 tools/skill/before-discovery-dev/scripts/skill_guard.py check-report \
  --report <delivery-report.md> \
  --lane <R2|R3|R4>
```

所有 lane 的報告若缺少、重複或使用未知的 `Full tests`／`Registry updated` 欄位，檢查器都會警告；R2–R4 明列 `Full tests: NOT RUN`（含常見變形、混入 PASS 的跳過字樣與「未執行」）也會警告。HTML comment、`details`、frontmatter、任意長度或未閉合的程式碼圍欄、tab／四空格縮排程式碼都不能替交付正文供應欄位；粗體、標題或 blockquote 形式的同名欄位仍會納入重複檢查。它是交付一致性檢查，不是完整 Implementation Gate；warning 不會冒充 blocker，也不能支撐完整施工完成的主張。

---

## 9. skill 套件維護

結構驗證：

```bash
python3 tools/skill/before-discovery-dev/scripts/skill_guard.py validate
python3 tools/skill/before-discovery-dev/scripts/test_skill_guard.py
python3 tools/skill/before-discovery-dev/scripts/test_mechanics_guard.py
```

同步治理鏡像：

```bash
python3 tools/skill/before-discovery-dev/scripts/skill_guard.py sync-mirror
```

正式安裝前的嚴格驗證：

```bash
python3 tools/skill/before-discovery-dev/scripts/skill_guard.py validate --activation
```

只有在下列條件全成立後才可把 candidate 改成 active：

1. Claude 完成獨立對抗審；
2. 流程法源已獲總監裁決且狀態為 active；
3. registry 的 active 必讀來源已進入 HEAD commit，且 worktree 內容逐路徑等於
   HEAD；只存在 index 暫存區、未提交修改或未追蹤子檔都不算；
4. 鏡像一致；
5. 三種真相模式與 R0–R4 盲測通過；
6. `validate --activation` 全綠。
