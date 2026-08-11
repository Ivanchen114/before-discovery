# 《發現之前》before-discovery-dev v3.6.0-candidate｜TO-BE 新章整包守衛交付

## Outcome

已完成 candidate：新章 brief＋provenance＋contract 整包送審、六欄一致性、兩輪收斂
及無 runtime TO-BE mechanics guard。未 activation、未修改 account-level skill、未改
第七章三件套。

## Truth mode

TO-BE。

## Target and comparison baseline

- 目標：v3.6.0-candidate 流程與守衛。
- 比較基線：repo 既有 v3.5.4-candidate、active《雙模型協作流程》兩輪上限、schema v2
  runtime mechanics guard。
- 第七章 EM1 v0.4 只作過渡樣本：新模式穩定回報 `TB-01`（缺 `toBeReview`），不重開
  已結案內容審查。

## Design Gate

PASS — 2026-08-10 總監指示「這邊先改？」授權 candidate 工具包施工；active 法源併入、
skill activation、commit／push 仍未授權。

## Files changed

1. `01_治理/發現之前_新章設計包整包送審與兩輪收斂修正案_v0.1-candidate_20260810.md`
2. `tools/skill/before-discovery-dev/SKILL.md`
3. `tools/skill/before-discovery-dev/references/source-registry.json`
4. `tools/skill/before-discovery-dev/references/mechanics-guard.md`
5. `tools/skill/before-discovery-dev/scripts/mechanics_guard.py`
6. `tools/skill/before-discovery-dev/scripts/skill_guard.py`
7. `tools/skill/before-discovery-dev/scripts/test_mechanics_guard.py`
8. `01_治理/發現之前_Claude開發守則_before-discovery-dev_skill鏡像.md`（生成同步）
9. 本交付報告。

## Focused tests

- `python3 tools/skill/before-discovery-dev/scripts/test_mechanics_guard.py`：27 tests PASS。
- `python3 tools/skill/before-discovery-dev/scripts/test_skill_guard.py`：66 tests PASS。
- `python3 tools/skill/before-discovery-dev/scripts/skill_guard.py validate`：0 errors；17 個
  已揭露 warning，含本 candidate 未追蹤／未 activation，符合預期。
- Python compile：PASS（pycache 導向 `/tmp/bd-pycache`）。
- `git diff --check`：PASS。

負向 fixture 已證明下列任一項被拔除會紅：三件套／六欄、late evidence、baseline、
operation kind、success claimRef、舊句清零。

Full tests: PASS (173/0)

完整測試命令：`cd greybox && npm test`。

Registry updated: YES

Registry 已升為 v3.6.0-candidate，新增 candidate 流程來源；未宣稱 active。

## Browser/device

N-A — 本包不改玩家 runtime。

## Accessibility

N-A — 本包不改玩家介面。

## Independent review

PENDING — 交 Fable 5 做一次完整對抗審；修正後只做 verification pass。

## Human playtest

N-A — 工具與治理候選，不是玩家內容。

## VCS

UNCOMMITTED。

## Release

NOT DEPLOYED；本包不需部署。

## Production smoke

N-A。

## Known gaps

1. account-level skill 仍是舊 five-chapter 版；activation 前不修改、不宣稱同步。
2. 新治理檔仍是 candidate、未追蹤；須 Fable 審查＋總監裁決後併入 active 宿主。
3. 第七章 v0.4 沒有新 `toBeReview`；依過渡條款不追改，第一個強制採用者是本案生效後
   才開始的下一章。
4. TO-BE guard 只能驗作者列出的 stale phrases；不能猜出作者忘記列的舊句，也不能
   判斷物理、史實或戲劇品質。

## Preserved foreign WIP

YES — 未修改第七章 brief／provenance／contract、各章 runtime、CR、劇本與美術；既有
dirty tree 全部保留。Skill、registry、鏡像上的既有 v3.5.4 WIP 只做增量更新。

---

## 給 Fable 5 的獨立對抗審訊息

> 請對 `before-discovery-dev v3.6.0-candidate` 做第一輪完整對抗審。主審包：
> ① `01_治理/發現之前_新章設計包整包送審與兩輪收斂修正案_v0.1-candidate_20260810.md`；
> ② `tools/skill/before-discovery-dev/SKILL.md`；
> ③ `tools/skill/before-discovery-dev/references/mechanics-guard.md`；
> ④ `tools/skill/before-discovery-dev/scripts/mechanics_guard.py`；
> ⑤ `tools/skill/before-discovery-dev/scripts/test_mechanics_guard.py`；
> ⑥ 本交付報告。請一次列完所有可確認 A／B，特別驗：治理修正是否只是操作化既有
> 兩輪上限而非複製新法；六欄 profile 是否過度綁定 EM1；`TB-01`～`TB-07` 是否真能
> 在無 scenes 時抓 late evidence、漏 baseline、operation 未登錄與 success 漂移；
> TO-BE PASS 是否仍明確不能冒充 runtime／Design Gate PASS；第七章 v0.4 過渡條款
> 是否合理且不形成未來豁免漏洞。27 mechanics tests、66 skill tests、173 runtime tests
> 目前全綠。若有修正，第二輪只驗原 A／B、修法新引入問題或有證據的硬傷；純機械
> 殘留採回執，不另開擴審。
