# before-discovery-dev skill v3.0.6 候選修正交付

**交付者**：Sol／Codex  
**日期**：2026-07-29  
**交付對象**：Claude 獨立對抗審  
**主審對象**：repo canonical `tools/skill/before-discovery-dev/`  
**狀態**：candidate；沒有同步或覆寫 `/Users/Ivan/.codex/skills/before-discovery-dev/SKILL.md` 生效版  
**本輪結論**：Claude 原判 A=0、B=2、C=3 已全部修正；兩輪額外黑箱反例亦已封住，最後定點黑箱 6/6 通過。候選仍不得啟用，須等 Claude 放行、總監裁決與 Git 追蹤條件完成。

---

## 一、Claude 原審查逐條處分

### B-1｜錯字或不存在版本不得靜默放行

- `--target-path` 與 `--target-label` 已拆成不同型別。
- path 必須是 repo worktree 內既有一般檔案；不存在為 exit 2，目錄、特殊裝置、`.git/**` 或 repo 外檔為參數錯誤。
- path 以檔案 identity 辨識大小寫、絕對路徑、alternate mount、`..` 與 directory source 的子檔。
- 未登錄稿仍會用檔名中的「第一章」至「第五章」檢查或推定章別，不能把第四章舊稿宣告成 ch3。
- label 改成明確 `WP-*` grammar；`不存在.md`、source id 與既有路徑都不能假扮工作包。

Claude 原反例「第四章不存在 v9.9」現在為 exit 2／`TARGET NOT FOUND`；正常 `WP-CH4-ROUTER-AUDIT` 仍為 exit 0。

### B-2｜lane 不再只是紙面自律

- `--lane` 為必填 singleton；重複 lane／phase／mode／chapter 直接 exit 1。
- mutation phase 的機械下限：

  - 玩家可見既有接線／美術：至少 R2；
  - 共用引擎與事件層：至少 R3；
  - serialized state、schema、save：R4；
  - archive、commit、push、deploy、publish、release：R4。

- `chapter-ui.js`、`sanitize.js`、`ch4-migration.js`、`stage/05-events.part.js` 等已知高風險 target 會自動補 impact。
- `review`／`diagnose`／`verify` 是唯讀 phase，同一高風險檔可保持 R0，不會因「查看存檔檔案」被誤判成「正在改存檔」。
- 非 `plan` 工作若不固定 target，直接 exit 2。

Claude 原反例 `serialized-state-change + R1` 現在為 exit 2；同命令改 R4 才為 exit 0。

### C-1～C-3

- 明示 superseded target 會輸出 `status=superseded` 與 CAUTION。
- 《開發工作包與審查閘門規範》與《待裁條文候選・營運鐵則四條》已雙向交叉引用：候選二、三隨流程規範一併處分；候選一、四仍獨立待裁。
- SKILL 已寫明 route exit code：0＝完成路由、1＝參數錯誤、2＝存在 blocker。

---

## 二、超出原審查、由黑箱補出的同型漏洞

### Router

- samefile／大小寫／alternate mount 不再繞過核心 impact。
- 空 path、空 label、控制字元、輸出換行注入、目錄與 `/dev/null` 全拒。
- `chapter.ch4`、`--chapter ch3`、registered target 或中文章名 target 互相衝突時 exit 1。
- release action 即使故意搭 `implement` phase，也仍須 R4。
- registry 的 directory source 可辨認 descendant；共用 stage 事件檔不再被列成 external。

### Delivery report checker

- `Full tests`／`Registry updated` 缺少、重複、未知值均警告。
- R2–R4 的 NOT RUN、未執行、PASS 混 skip、PASS 帶非零失敗數均警告。
- HTML comment、`details`、YAML frontmatter、三個以上反引號／波浪號 fence、未閉 fence、tab 或四空格程式碼都不能供應假欄位。
- 粗體、heading、blockquote 形式的視覺等價欄位仍會被抓成重複，不能用第一筆乾淨值遮住第二筆真實狀態。
- FAIL 保持為合法且誠實的已知狀態；checker 是一致性警報器，不會把誠實紅燈改寫成綠燈或 blocker。

---

## 三、驗證結果

### 套件與回歸

- `scripts/test_skill_guard.py`：24 tests，全部通過。
- `skill_guard.py validate`：0 errors、41 warnings。
- skill-creator `quick_validate.py`：`Skill is valid!`
- `git diff --check`：相關路徑通過。
- Claude B-1／B-2與最後兩個黑箱漏洞定點覆核：6/6 符合預期。

41 個 candidate warnings 是刻意揭露的未追蹤法源、待裁條文、舊索引風險與缺少逐件美術 ledger；它們不能被刪掉來製造假綠燈。

### Activation 必須維持 fail-closed

`validate --activation` 目前為 exit 1：31 errors、17 warnings。原因包括：

- registry 仍是 candidate；
- 流程法源與候選條文尚待總監裁決；
- 多份 active 必讀來源仍未由 Git 追蹤；
- skill package 中 overlay、agent metadata、registry、guard、tests、治理鏡像仍未追蹤；
- shared-rules activation blocker 與跨章／美術 ledger gap 尚未解除。

這是正確結果。本輪沒有把 candidate 改 active、沒有同步 Codex 生效版，也沒有代總監 commit。

---

## 四、固定 hash

| 檔案 | SHA-256 |
|---|---|
| `tools/skill/before-discovery-dev/SKILL.md` | `abf1aca4ad6680ac7ca91309b0e40fc09433835d099b6f1d15b3f9e0ac1accc7` |
| `tools/skill/before-discovery-dev/scripts/skill_guard.py` | `54932ecd2e3af929f7f6fbb13205431aa8c9fa7fd926aa6b992f20181e520fdb` |
| `tools/skill/before-discovery-dev/scripts/test_skill_guard.py` | `64ac519abde86b03fe3ca9b75d21e50e8d6b4b42a78e1f603a129c78e2fc6bad` |
| `tools/skill/before-discovery-dev/references/source-registry.json` | `e63a06cde50a43e68f97fc2002a971ef38350e885fd7e605ceb071873186a32f` |
| `01_治理/發現之前_Claude開發守則_before-discovery-dev_skill鏡像.md` | `512835dd5e263add2948406af9c9e545d2bcba577d97bc7ecf22485b48b11110` |

---

## 五、請 Claude 定點複審

請固定上列 hash 後，至少重跑：

```bash
python3 tools/skill/before-discovery-dev/scripts/test_skill_guard.py
python3 tools/skill/before-discovery-dev/scripts/skill_guard.py validate

python3 tools/skill/before-discovery-dev/scripts/skill_guard.py route \
  --task review --chapter ch4 --phase review --mode TO-BE --lane R0 \
  --target-path '04_劇本/第四章不存在_v9.9.md'

python3 tools/skill/before-discovery-dev/scripts/skill_guard.py route \
  --task save --chapter ch4 --phase implement --mode TO-BE --lane R1 \
  --target-path greybox/src/ch4-migration.js \
  --impact serialized-state-change

python3 tools/skill/before-discovery-dev/scripts/skill_guard.py route \
  --task narrative --chapter ch3 --phase review --mode TO-BE --lane R0 \
  --target-path '04_劇本/第四章台詞稿_v0.6_書桌章_Claude_20260727.md'

python3 tools/skill/before-discovery-dev/scripts/skill_guard.py route \
  --task review --chapter ch4 --phase review --mode TO-BE --lane R0 \
  --target-label WP-CH4-ROUTER-AUDIT
```

預期依序為：tests PASS、validate 0 errors、route exit 2、exit 2、exit 1、exit 0。

---

## 六、交付狀態

Outcome: CANDIDATE REPAIRED；等待 Claude 對抗審與總監裁決

Target and comparison baseline: repo canonical skill v3.0.6 對照 Claude v3 候選審查 B-1／B-2／C-1～C-3

Design Gate: PENDING DIRECTOR DECISION（流程法源與候選一、四尚待裁）

Files changed: skill common、Claude overlay、agent metadata、registry、guard、24-test regression、治理鏡像、流程規範與候選條文交叉引用

Focused tests: 最後獨立黑箱 6/6 PASS；Claude B-1／B-2及正常 controls 均符合預期

Full tests: PASS（24/0）

Registry updated: YES

Browser/device: N-A（本包為路由器與文件）

Accessibility: N-A

Independent review: PENDING（Claude）

Human playtest: N-A

VCS: UNCOMMITTED；未 stage、未 commit、未 push

Release: NOT AUTHORIZED；candidate 未啟用

Production smoke: N-A

Known gaps: activation 仍為 31 errors／17 warnings；候選一與四待總監裁決；逐件美術／授權 ledger 與跨章存檔通則仍有 registry gap

Preserved foreign WIP: 未 reset、checkout、搬移、刪除或批次 stage 共享工作樹

