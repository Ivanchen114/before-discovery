# `before-discovery-dev` v3 候選施工完成與 Claude 對抗審交付

**施工者**：Sol／Codex

**日期**：2026-07-28

**版本**：v3.0.1-candidate
**前一輪審查**：`05_審核/發現之前_before-discovery-dev_skill整體合理性與工作流程審查_Sol_20260728.md`

## 一、交付判定

**v3 候選已施工完成，可交 Claude 做獨立對抗審；目前不得啟用。**

本輪只修改 skill 套件、候選治理規範與機械鏡像，沒有修改第四章或任何 runtime。repo candidate、Claude overlay、registry、router／validator 與鏡像已形成一個可重跑、可失敗的候選包；Codex 目前生效版仍維持舊版，沒有偷跑同步。

啟用仍須依序完成：

1. Claude 獨立對抗審；
2. 總監裁決候選治理規範；
3. 原子式修掉現行共用守則的衝突句；
4. 處理 strict activation 列出的追蹤與法源缺口；
5. registry 改為 active，嚴格驗證全綠；
6. 最後才同步 Claude／Codex 生效版。

## 二、施工檔案

| 檔案 | 用途 | 行數 | SHA-256 |
|---|---|---:|---|
| `tools/skill/before-discovery-dev/SKILL.md` | agent-neutral 主流程與路由入口 | 242 | `67b7bc2ca46d88efe31c3cc55604f084450fed31db3082c39fc45faba11cdfa2` |
| `tools/skill/before-discovery-dev/OVERLAY-claude.md` | Claude 個人慣犯、交接與能力限制 | 27 | `a5dcf596c91230d10f76e5eb72e6bdab85ba593aa054059bb39ab51132e0b9a1` |
| `tools/skill/before-discovery-dev/references/source-registry.json` | 19 routes、72 sources 的 machine-readable 法源登錄 | 2248 | `0966666694092b756988887bce26004bafa99e55ecf4fea34b5ff1a1d3a271a3` |
| `tools/skill/before-discovery-dev/scripts/skill_guard.py` | validate／route／sync-mirror | 718 | `6b6ed4bc39c96ab6a5c01b5aee4788412df078c4a6758e7233659b1cf23019f1` |
| `tools/skill/before-discovery-dev/agents/openai.yaml` | UI metadata | 4 | `f942ca7538e659ae7fb7764fced862678ee711a8f8c2d54e2bfe3259c0fb9e9d` |
| `01_治理/發現之前_開發工作包與審查閘門規範_v0.1.md` | 三種真相、角色移交、R0–R4、雙 Gate、存檔安全預設 | 337 | `e5ae34009d23b23f722fc63662873e4a226750a88acf1ff8cc7a22e47c8ddd1f` |
| `01_治理/發現之前_Claude開發守則_before-discovery-dev_skill鏡像.md` | 機械生成的人讀鏡像 | 279 | `a671bcc8b78cc6781885f3907ca7efd4cf3c69d6b7b128f065191ff7ffc52ea0` |

> 上表 hash 是本交付檔建立前的固定值。Claude 審查前若任何受審檔又被修改，須重算 hash，不能沿用本表。

Codex 生效版仍為：

```text
/Users/Ivan/.codex/skills/before-discovery-dev/SKILL.md
SHA-256 36b583fd469f30dcd9094707d124b602ad48ddeb34542d3df3947bf930f4c43a
```

## 三、前一輪 A／B／C 的處理

### A 級

1. **AS-IS／TO-BE／CONFORMANCE 已拆開。** 主審 target 必須由工作包卡與 `--target` 固定；正式 review／diagnose 缺 target 時 exit 2。
2. **作者、施工者、審查者不再自動互換。** 完整修法不等於施工移交；只有任務書、總監明示或完整交接可改派。現行舊句未被假裝解決，而是登錄成 strict activation blocker。

### B 級

1. 建立 R0–R4 比例化 lane 與三類既有紅燈。
2. 跨章只保留因果骨架，不再把第一、二章工作台外形套給所有章。
3. 補齊 runtime、五章、敘事、史實、美術、授權、瀏覽器、可及性、存檔、archive、release、review、testing 路由。
4. 存檔／schema 在正式跨章通則缺席時 fail-closed；章別個案只能滿足同章工作。
5. Design Gate 與 Implementation Gate 分開；定點覆核有升級條件。
6. dirty worktree 改以 owned paths、生成耦合與 shared interface 判斷。
7. common 保持程序；Claude 專屬內容移到 overlay。
8. 加入 registry、確定性 validator、鏡像生成與 candidate／active 生命週期。

### C 級

- 移除假錨點與錯誤相對路徑。
- trigger 限縮為本 repo／《發現之前》，不因一般「牛頓」「工作台」誤載。
- 第一、二章改成比較基準，不是章型模板。
- overlay 不再固定 `_factory` 或 `tests.push(...)`。
- 補上 `agents/openai.yaml`。

## 四、第二輪 forward tests 與直接回修

三名唯讀 reviewer 沒讀前一輪審查報告，分別測真相模式、美術／release、存檔／角色。第一輪共抓出：

1. `diagnose` 無 phase；
2. chapter route 無條件過讀 runtime、history、migration 與 spike；
3. `stage.html` 未登錄；
4. generic save 會錯用第四章個案遷移解鎖；
5. art-change 在 `implement` phase 漏掉三個正式美術 blocker；
6. router 的 `ROUTED` 容易被誤讀成授權；
7. target 缺失仍 fail-open，外部 target 可能被既有 v0.8 shadow；
8. 生圖能力邊界未出現在 router。

以上均已直接修正並重跑。

| 反例 | 現在結果 |
|---|---|
| ch4 新劇本 TO-BE review，外部 target | exit 0；外部 target 保持主審；既有 v0.8 降 comparison；v0.7 superseded 不載入 |
| review／diagnose 不給 target | exit 2，`TARGET BLOCKER` |
| ch4 UI bug AS-IS diagnose | exit 0；讀 `stage.html`、共用 UI、stage sources、scenes4、engine4；不再拉入 history／migration／spike |
| ch4 正式證據圖接 runtime | exit 2；逐件美術 ledger、授權 ledger、ch4 美術附錄共三個 blocker |
| generic save 不給章別 | exit 2；不再載入或借用 ch4 遷移 |
| ch4 schema 1→2 | exit 0；同章個案遷移標成 `SATISFIED` |
| ch3 新存檔欄位 | exit 2；跨章通則／ch3 個案法源缺失 |
| release 既有內容、無 art-change | exit 0；美術 ledger 只顯示 conditional，不製造假 blocker |
| image-generation | router 明示 `Sol/Codex only`；Claude 只負責需求、prompt 或獨立審圖 |

## 五、機械驗證

### 套件與結構

```text
skill-creator quick_validate：PASS
skill_guard.py syntax：PASS
source-registry.json parse：PASS
skill_guard.py validate：PASS，0 errors／41 warnings
尾端空白：0 命中
```

41 個 warning 沒被消音，內容是 candidate、未追蹤法源、已知過期索引與尚缺的美術／存檔／archive 法源。

### 嚴格啟用

```text
skill_guard.py validate --activation：預期 FAIL
25 errors／17 warnings
```

其中明列：

- v3 流程與 registry 仍是 candidate；
- 《雙人共用工作守則》角色／canonical 舊句仍是 activation blocker；
- 多份 active 必讀來源尚未 Git 追蹤；
- 第四章遷移規格、遷移器與測試尚未 Git 追蹤。

這是誠實的生命週期守門，不是本輪結構驗證失敗。

### 反向會紅

曾刻意讓治理鏡像落後於 `SKILL.md`；`validate` 立即以
`治理鏡像 common 與 SKILL.md 正文不同步` 轉紅。執行 `sync-mirror` 後恢復 0 errors。

### 全專案回歸

```text
cd greybox && npm test
129 通過／1 失敗
```

唯一失敗仍是既有：

```text
C-2 拆分｜stage-ui.js ≡ src/stage/*.part.js
stage-ui.js 落後於 part 檔
```

本輪前後一致；沒有執行 `build-stage.mjs`，因那會碰不屬於本 skill 工作包的 runtime WIP。

## 六、已知缺口與為何沒有偷修

1. 《雙人共用工作守則》的角色與 runtime canonical 舊句要等 Claude 審查、總監裁決後原子式修訂；現在只先把它鎖成 activation blocker。
2. 跨章存檔通則仍缺；因此 generic save 與沒有個案遷移的章別繼續 fail-closed。
3. 全系列逐件美術 ledger、逐件授權 ledger、ch3–ch5 章別美術附錄仍缺；正式生圖與接線會被阻擋。
4. browser checklist 的第四章 G9 仍是 14 場舊版；router 會警告，不得拿它單獨簽核 12 場現況。
5. 多份現行 WIP 尚未 Git 追蹤。這不是由 skill 重寫或代 commit 可以合法解決的事。

## 七、請 Claude 做的獨立對抗審

請不要只驗字串。以本檔第二節的精確檔案與 hash 為主審對象，至少攻擊：

1. 三種真相模式是否仍可能選錯 target；
2. 完整修法、角色移交與 Sol-only 生圖能力是否還會互相矛盾；
3. R0–R4 是否有可降級鑽洞或把唯讀工作過度升級；
4. chapter domains 是否造成漏讀或過讀；
5. `satisfied_by` 是否可能跨章誤解鎖；
6. art-change 在 art／implement／release 是否一致；
7. `SOURCES_ROUTED` 是否仍可能被誤當 Design Gate 或授權；
8. candidate → active 的生命週期能否 fail-closed；
9. registry＋router 的維護成本是否已超過它避免的錯誤；
10. 72 份 source 的 status、authority、phase、domain 與 known issue 是否有誤標。

每條問題請給：

```text
位置 → 可重現證據 → 因果風險 → 直接修法 → 會失敗的驗證條件
```

建議先跑：

```bash
python3 tools/skill/before-discovery-dev/scripts/skill_guard.py validate
python3 tools/skill/before-discovery-dev/scripts/skill_guard.py validate --activation
python3 tools/skill/before-discovery-dev/scripts/skill_guard.py route \
  --task script --task review --chapter ch4 --phase review --mode TO-BE \
  --target WP-A-CH4-NEW-SCRIPT
python3 tools/skill/before-discovery-dev/scripts/skill_guard.py route \
  --task ui --task browser --chapter ch4 --phase diagnose --mode AS-IS \
  --target greybox/stage.html
python3 tools/skill/before-discovery-dev/scripts/skill_guard.py route \
  --task art --chapter ch4 --phase implement --mode TO-BE \
  --target ch4-evidence-art --impact art-change
python3 tools/skill/before-discovery-dev/scripts/skill_guard.py route \
  --task save --phase implement --mode TO-BE --target generic-save-change
```

## 八、本輪未宣稱的狀態

```text
Implementation：v3 candidate COMPLETE
Focused tests：PASS
Full tests：FAIL，129／1，既有且不重疊
Browser／device：NOT RUN（本輪無玩家 UI）
Independent review：PENDING CLAUDE
Human playtest：NOT APPLICABLE TO SKILL PACKAGE
VCS：UNCOMMITTED
Release：NOT DEPLOYED
Agent activation：NOT RUN／BLOCKED BY DESIGN
Runtime changes：NONE
Preserved foreign WIP：YES
```
