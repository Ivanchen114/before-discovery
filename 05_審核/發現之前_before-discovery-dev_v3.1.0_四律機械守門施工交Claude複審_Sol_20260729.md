# before-discovery-dev v3.1.0-candidate｜四律機械守門施工交 Claude 複審

**Sol／Codex → Claude**｜**日期**：2026-07-29  
**來源交接**：`05_審核/發現之前_四律脈絡交接_文字壓縮問題與缺口_Claude交Sol_20260728.md`  
**判定**：接受根因診斷並直接施工。不是把四律抄回 skill；新增可重跑工具、負向測試與四律節拍契約。

---

## 一、先說結論

總監當初反應的不是四個孤立用詞問題，而是同一個結構病：

> 設計、節點稿與 runtime 各自都把資訊壓成最短功能單位，最後「資訊完整、場面不完整」。

你的交接判斷正確，但「四律完全機械化」若只靠 grep，會再製造一次誤判。因此本輪拆成兩層：

1. **低誤報自動診斷**：旅人在場、逐章禁詞、金句候選、章際問句、字數／節點與節點／場、直接 evidence 寫入前的可見拍數。
2. **明示節拍 contract**：人類先確認哪些節點真的構成發現／回應／確認、認知停頓、NPC 對他人反應、轉場壓力；工具保證轉檔後這些節點仍存在、順序與講者沒被改壞。

第二層是關鍵。它不假裝懂戲，但能在一場被壓回一句、response 被刪、pause 被移到證據後面時確實轉紅。

---

## 二、施工內容

### 2.1 新命令

```bash
python3 tools/skill/before-discovery-dev/scripts/skill_guard.py check-narrative \
  --scenes greybox/data/scenes5.json \
  --chapter ch5
```

支援：

- `--scenes`：runtime JSON，完整模式。
- `--draft`：結構化 Markdown；只認 `## ...【SCENE-ID】` 下的角色台詞、動作、系統標記與選項。
- `--previous-scenes`：由前章 runtime 取最後開放問句，核本章第一場有無接住；只正規化全／半形標點與空白，措辭不放寬。
- `--contract`：schema 1 四律節拍契約。
- `--require-contract`：沒有契約或任一契約區為空時警告。
- `--fail-on-warnings`：advisory warning 轉 exit 2，供正式閘門與負向測試使用。

預設 warning 不阻擋，避免中信度文學判斷冒充硬契約。

### 2.2 四律 contract 守住什麼

| 條文 | 人先判斷 | 工具負責 |
|---|---|---|
| 63 三拍 | 哪三節點真的是發現／回應／確認 | 三節點同場、不同、依序；發現與回應講者不同；直接 evidence id 不得漏契約 |
| 64 停頓 | 哪一拍是「以為成功了」 | 同 evidence id 有 pause；pause 在 evidence 前 |
| 65 角色反應 | 哪句真在回應誰 | 每名有台詞 NPC 至少一筆；講者正確；被回應者更早在同場說過話 |
| 66 不得不 | 哪個節點造成壓力 | 壓力節點存在；目標場在後；明示 `goto` 時目標一致 |

這只能保護**已由人核准的語義錨點**，不能證明句子本身真的有發現、停頓或壓力。工具每次明印這個人工邊界。

### 2.3 避免你踩過的兩次誤判

Markdown parser 明確排除：

- 場名與非場景章節
- 表格
- blockquote
- HTML comment
- code fence
- 設計註記

選項只掃玩家實際看到的選項文字，不把 `→` 後面的設計說明混成角色金句；普通條列也不冒充說話人。

### 2.4 版本與文件

候選版由 `v3.0.6-candidate` 升為 `v3.1.0-candidate`。SKILL 只加一段路由提示；完整命令、contract schema、邊界與反例放在 progressive-disclosure reference，沒有把四律正文複製進 skill。

---

## 三、反向會紅的證據

`scripts/test_skill_guard.py` 現為 **32 tests**，新增八類 narrative fixture：

1. 完整 scenes + contract + strict → exit 0。
2. 連續兩場刪掉旅人台詞／OS → NAR-01，exit 2。
3. 禁詞只放 metadata／註記 → 不報；移入玩家可見 node → NAR-02，exit 2。
4. 同場加入第二句對仗候選 → NAR-03，exit 2。
5. 將三拍 response 移到 confirm 後面 → NAR-63，exit 2。
6. `--require-contract` 但未供應 contract → NAR-CONTRACT，exit 2。
7. contract 任一區空陣列 → NAR-CONTRACT，exit 2。
8. 前章問句改字、不再出現在本章第一場 → NAR-04，exit 2。

另有草稿反例確認：禁詞與對仗只在場名、表格、blockquote、comment 時不得誤報。

---

## 四、拿現行五章實打的結果

這些是 AS-IS 診斷，不是要求本輪順手改劇本。

| 章 | 結果 | 讀法 |
|---|---|---|
| ch1 | 10 warnings | 7 場旅人缺席、2 組連續缺席、1 個零文字工作場；屬尚未展開／結構場混合債 |
| ch2 | 11 warnings | 7 場旅人缺席、3 組連續缺席、1 個零文字工作場；同上 |
| **ch3** | **0 warnings** | 10 場／209 nodes，24.5 chars/node，20.9 nodes/scene；ch2→ch3 問句措辭通過 |
| ch4 | 3 warnings | D1-2、D3-1、D4-2 各有金句／對仗候選超額；NAR-03 是中信度，請你逐句判斷是實際超額或 detector 還需收窄 |
| **ch5** | **24 warnings** | 10 場無旅人、8 組連續缺席、3.6 nodes/scene、4 個 0–1 可見拍場、J4 取得前只見 2 拍 |

加入 ch4→ch5 接縫後，ch5 為 **25 warnings**：多一條 NAR-04，第四章末問句「碰撞後，究竟什麼應該守住？」沒有在第五章第一場接住。這與跨章規格既有診斷一致。

重要反證：ch5 的 chars/node 只有 19.3，並不高；若只看句長會漏掉問題。真正轉紅的是 **3.6 nodes/scene + 大量空場／旅人缺席**，正好重現總監所說「看不見事情發生的過程」。

---

## 五、請 Claude 對抗審的定點

不必重開 v3 全面審，請只打以下五點：

1. **NAR-03 誤報率**：逐讀 ch4 runtime 的 D1-2／D3-1／D4-2，以及 v0.8 草稿 D1-2／D4-1；判斷是正文真的超配，還是 regex 應再限縮。請不要只看計數。
2. **contract 完整性**：63–66 的明示欄位是否足以防「三拍被合併」；是否有合理場景會被錯擋。
3. **證據涵蓋**：runtime `effects.evidence` 會要求同 id 三拍與停頓；engine-owned evidence 仍須人工列 contract。這個邊界是否清楚、會不會漏掉你寫稿時最常壓縮的證據。
4. **Markdown 排除規則**：確認場名、表格、註記不再供應金句或禁詞命中；確認 `〔新〕／〔改〕` 台詞仍會被掃。
5. **退化試驗**：任選一個 fixture 刪掉 response／traveler／pressure，再跑 `--fail-on-warnings`；必須 exit 2。若只有輸出文字變、退出碼仍 0，判 B。

建議分級：

- A：會讓禁詞、人物預知或證據邊界被錯誤放行，或工具宣稱能取代人工戲劇審。
- B：明確規則的反向變異不會 exit 2，或常見合法稿型被系統性誤判。
- C：提示文字、命名、額外 fixture 與不影響結論的 parser 邊角。

---

## 六、驗證與現況

Outcome: COMPLETE（v3.1.0 candidate 施工完成；未啟用）

Truth mode: TO-BE

Target and comparison baseline: `tools/skill/before-discovery-dev/` v3.1.0-candidate；對照四律交接、手冊 K、跨章規格 §六、主筆自檢清單

Design Gate: PASS（總監明示「順便處理」，Claude 明確移交 `skill_guard.py` 施工路徑）

Files changed:

- `tools/skill/before-discovery-dev/SKILL.md`
- `tools/skill/before-discovery-dev/references/source-registry.json`
- `tools/skill/before-discovery-dev/references/narrative-guard.md`（新增）
- `tools/skill/before-discovery-dev/scripts/skill_guard.py`
- `tools/skill/before-discovery-dev/scripts/narrative_guard.py`（新增）
- `tools/skill/before-discovery-dev/scripts/test_skill_guard.py`
- `01_治理/發現之前_Claude開發守則_before-discovery-dev_skill鏡像.md`（機械重生）
- 本交付檔

Focused tests: PASS（32/0；含正向、負向、草稿排除、contract 與 seam）

Full tests: PASS（130/0）

Registry updated: YES

Browser/device: N-A（未修改玩家 runtime／UI）

Accessibility: N-A（未修改玩家 runtime／UI）

Independent review: PENDING（Claude 本輪定點對抗審）

Human playtest: N-A（工具層；章節試玩仍依原排程）

VCS: NOT COMMITTED；未 stage。共享工作樹既有 foreign WIP 全保留

Release: NOT RELEASED；Codex／Claude 生效版均未同步

Production smoke: N-A

Known gaps:

- `validate`：PASS，0 errors／41 warnings。
- skill-creator `quick_validate.py`：PASS。
- `validate --activation`：預期 FAIL，33 errors／17 warnings；主因仍是 candidate 狀態、未裁治理條文與 17 筆未追蹤法源／skill package，不是本輪工具回歸。
- NAR-03 是中信度候選掃描，需本輪 Claude 定點判讀後才適合成為嚴格章稿門檻。
- 四律語義、史實查證、合理重建與「不會老」處理仍必須人工審。

Preserved foreign WIP: YES；未改 `greybox/data/scenes*.json`、引擎、劇本、既有 Claude 審核檔或其他 dirty files

---

## 七、恢復主線的建議

本輪沒有修改第三、四、五章 runtime。Claude 定點審過工具後：

1. 總監裁 skill v3 與待裁營運條文。
2. 若要正式啟用，再處理 Git tracking 與 activation blocker；不能把 candidate 驗證綠誤稱 active。
3. 恢復先前暫停的 B-3／第三、四章收尾。
4. 第五章展開一開始就建立 narrative contract，不要等 runtime 完成才補。

這樣總監下一次說「怪怪的」，我們不只會改那一句；流程會先告訴我們，是哪一整段事情根本沒有發生。
