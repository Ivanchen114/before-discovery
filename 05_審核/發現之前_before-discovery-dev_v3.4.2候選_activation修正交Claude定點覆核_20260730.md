# before-discovery-dev v3.4.2 candidate｜activation 修正與 Claude 定點覆核包

**交付者**：Sol／Codex  
**日期**：2026-07-30  
**真相模式**：CONFORMANCE  
**lane**：R4（activation／commit）；runtime 零修改  
**主審對象**：commit `b3008cb`  
**前版審查基線**：`v3.4.1-candidate` 已由 Claude 判定 A=0、B=0、C=4  
**本輪狀態**：`v3.4.2-candidate` 已提交，**尚未 active、尚未同步任何 agent 生效版**

## 一、結論

總監已同意進行 activation，但實跑嚴格驗證後，不能只改版本字串：

- v3.4.1 原始 `validate --activation`：`41 errors / 17 warnings`；
- 修正 lifecycle 邏輯、但尚未提交 skill package：`33 errors / 25 warnings`；
- 精確提交完整 candidate skill package 後：`22 errors / 25 warnings`。

錯誤數下降不是降低標準。原驗證器把未追蹤的 candidate、superseded、historical
來源也升成 activation error，與 SKILL §9「active 必讀來源已由 Git 追蹤」矛盾。
修正後，非 active 來源仍保留 warning；未追蹤 active 來源仍是 error。

剩餘 22 條含尚未裁決的法源狀態、shared-rules activation blocker、13 個未追蹤
active source 路徑及 registry candidate 狀態。當中包含第四章 migration runtime
與測試，超出本輪「不得碰 runtime」授權，因此本輪誠實停在 candidate。

## 二、v3.4.1 → v3.4.2 的唯一兩項語意改動

### 1. 未追蹤來源的 activation 分級

**位置**：

- `scripts/skill_guard.py`：`untracked_source_blocks_activation()`
- `scripts/test_skill_guard.py`：`ActivationLifecycleTests`

**新契約**：

- `status=active + tracked_required=true + untracked` → activation **ERROR**；
- candidate／superseded／obsolete／historical 未追蹤 → **WARN**；
- candidate 若另有 `blocks_skill_activation=true`，仍由 candidate 狀態本身升 ERROR，
  不會被 tracking 修正放行。

**理由**：activation 要保證現行必讀來源可重現，不應強迫提交尚待裁、作廢或歷史檔。

### 2. 治理鏡像 lifecycle 與 registry 同源

**位置**：

- `scripts/skill_guard.py`：`build_mirror_header()`、`build_mirror_text()`
- `validate()`：新增 lifecycle 檔頭一致性檢查
- `sync_mirror()`：不再硬編碼 candidate 標題
- `scripts/test_skill_guard.py`：candidate／active 雙態測試

**新契約**：

- registry candidate → 鏡像明示「候選鏡像，不是 agent 生效版」；
- registry active → 鏡像明示「active 治理鏡像」；
- active 仍不冒充已安裝：各 agent 必須明示同步並 read-back；
- 正文 markers 相同但檔頭 lifecycle 錯誤時，`validate` 會紅。

## 三、驗證

| 驗證 | 結果 |
|---|---|
| `npm test`（`greybox/`） | **136/0 PASS** |
| `test_skill_guard.py` | **50/50 PASS** |
| `test_mechanics_guard.py` | **20/20 PASS** |
| skill-creator `quick_validate.py` | **Skill is valid** |
| `skill_guard.py validate` | **0 errors / 46 warnings PASS** |
| `skill_guard.py validate --activation` | **22 errors / 25 warnings FAIL（預期，未冒充 active）** |
| 鏡像 common SHA-256 | `0129dc27313c4900aa2be50743a786af843c2106be4c8b6aedc7911426623187` |
| 鏡像 overlay SHA-256 | `cd21f27a8809afa5400a71d93d8bbec2780629c211a1b9b17cd4c1d064968777` |

### 反向轉紅

1. 暫時把 tracking 判定退回「activation 時所有 status 都升紅」：
   `test_only_untracked_active_sources_block_activation` 出現 4 個 failure
   （candidate／superseded／obsolete／historical）。
2. 暫時讓 active registry 仍生成 candidate header：
   `test_mirror_header_tracks_registry_lifecycle` 立即 FAIL。
3. 還原後完整 skill suite 50/50 綠。

變異只在測試程序記憶體中注入，沒有修改共享檔案。

## 四、剩餘 22 條 activation error 的實際分類

### A. 尚待總監內容裁決／狀態回寫

1. 是否正式採用「歷史情境科學探究遊戲」為專案自定義主類型；
2. 第三章維持「設計／程序承諾」，或另立 CR 新增真正的結果前預測；
3. 是否把「修復成本依違約類型，不追求表面一致」升為跨章原則；
4. workflow law、historical-inquiry law、series bible v0.2.1、NARRATIVE-CR-031
   的 candidate／覆核狀態；
5. workflow §六-4／§八吸收候選條文三／二後，P-8／P-7 的合併結案；
6. shared rules 的三處舊句與 registry activation blocker；
7. registry／SKILL／鏡像由 candidate 原子切換 active。

### B. 未追蹤的 active source（13 個 unique paths）

1. `01_治理/發現之前_雙人共用工作守則_v0.1.md`
2. `02_設計/發現之前_工作台與辯論架構_一二章實證規格_v0.1.md`
3. `02_設計/發現之前_跨章規格_旅人聲線與章際接縫_v1.0_Claude_20260728.md`
4. `03_規格/發現之前_第四章v0.8存檔遷移表與契約測試_Claude_20260728.md`
5. `greybox/src/ch4-migration.js`
6. `greybox/tests/run-ch4-migration.mjs`
7. `01_治理/發現之前_CH3-CR-024_碼頭辯論旅人心聲層_20260728.md`
8. `04_劇本/第三章台詞稿_v0.9_展開版_Claude_20260728.md`
9. `03_規格/發現之前_第四章v0.8施工基線_盤點與分批_Claude_20260728.md`
10. `04_劇本/第四章台詞稿_v0.8_Claude_20260728.md`
11. `spike_workshop/README_ch4_spike索引.md`
12. `03_規格/發現之前_第五章工作台與辯論規格_v0.1_Claude.md`
13. `03_規格/發現之前_第五章debate5資料稿_v0.1_Claude.md`

其中第 5、6 項屬 runtime／test；依工作樹分類清冊，還要和兩個 migration fixture
及必要耦合檔一起形成獨立 runtime package，不能只為讓 activation 變綠而單獨 stage。

### C. 尚未完成的 activation 證據

五個無提示 forward-test prompts 與評分表已備妥；現有 50 項 regression 及 Claude
攻擊測試證明 router 行為，但若環境無法把 candidate 安裝到隔離 skill registry，
只能稱 workflow forward-test，不能冒充 metadata 自動觸發已驗。

## 五、VCS 與範圍保護

- commit：`b3008cb chore: add before-discovery guard v3.4.2 candidate`
- commit 只含 12 個 skill／治理鏡像路徑；
- 沒有使用 `git add -A`；
- 原本三個 staged additions 的 index blob hash 未變，commit 後仍留在 index；
- runtime、法源內容、劇本、美術與發佈零修改；
- 未 push、未 deploy；
- 移除一個 2026-07-28 遺留、0-byte、無 Git 寫入者的 stale `.git/index.lock`，
  只為完成已授權的精確 commit，index 本體未刪改。

## 六、請 Claude 只做三項定點覆核

1. 把 candidate／superseded 未追蹤改為 warning，是否與 SKILL §9 一致，且未放過
   未追蹤 active source；
2. active registry 是否必定產生 active mirror header，candidate 是否仍保留警告，
   stale header 是否會被 validate 抓住；
3. 重跑 50/50、20/20 與兩個反向變異。

不必重開 v3.4.1 的五章承重、CR-031、mechanics guard 或六條 runtime 紅線全面審。
若以上三項 A=0、B=0，請回覆「v3.4.2 lifecycle 定點通過」；真正 active 仍須等
總監三項內容裁決、active source tracking 與 `validate --activation` 綠。

