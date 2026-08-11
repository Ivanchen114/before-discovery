# 高潮執筆權修正 ＋ skill v3.5.0-candidate CONFORMANCE 獨立審查

**日期**：2026-08-08
**審查者**：Claude（獨立審查，未參與本輪實作）
**模式**：CONFORMANCE / R0 唯讀
**核准目標**：總監裁決文（C3-1 三選項、HE-1 親簽、ch6 三項同步修正、規範 3.3–3.6 四法、skill v3.5.0-candidate 四功能）
**實際成品**：工作樹 scenes3.json / scenes6.json（含 JS 鏡像）、互動敘事規範 v0.1、SKILL.md v3.5.0-candidate 及 guard 腳本

---

## 總裁決

**CONFORMANCE：PASS。可進真人試玩。**

十五項宣稱逐一實查，十四項與裁決描述一致且證據充分；一項（runtimeAnchor）機制與負向測試齊備但生產代碼零標註實例，屬「機制先行、標註待補」，不擋試玩。無 A/B 級新增問題；C 級三條列後。第一輪編劇審查中被裁決駁回的四項推論，本輪逐條回查後確認總監方法批評成立，正式撤回並記錄口徑錯誤。

---

## 宣稱核對表

| # | 宣稱 | 實查結果 |
|---|---|---|
| 1 | C3-1/x1 改三選項（有限主張／過度推論／過度保守） | ✅ 結構逐字符合；`bounded→x2`、`earth-moves→x1_over`、`nothing-learned→x1_under` |
| 2 | 錯項由角色針對錯因回應，非答錯即彈回 | ✅ 過度推論由伽桑狄收窄（「我們沒有把地球搬上這條船」）；過度保守由 1632 舊紙主人維達爾親自反駁（「走穩時的紙就不會一趟趟落在桅腳附近」）——角色分配與錯因嚴格對位；回應一拍後重選 |
| 3 | x2 官員照抄成為玩家措辭的鏡子 | ✅ 「官員逐字把旅人的話寫進結果欄」承接玩家所選句 |
| 4 | HE-1/x_final 玩家親寫「兌換率：未量得」並簽名 | ✅ 單選項 choice＋`labAction: finalizeJointPage(rateDebt)` 狀態效果＋`x_signed` 收尾；順帶消除了原 type/speaker 不一致 |
| 5 | ch6 兩處越界措辭 | ✅ 兩處 NPC 台詞由評論抽象句改為「你說／你寫的」直指玩家行動（規範 3.6 落實） |
| 6 | 用途分類 | ✅ osPurpose 重分類（cross_chapter_debt→cross_chapter_memory 等四筆）＋narrativeExemptions 增 R-TXT-5 |
| 7 | 「判讀發生在 heat 工作台內」明示邊界 | ✅ T4 節點 reason 欄：「scene 節點只做具名證據回收，不能把引擎內四次判讀誤報成缺少玩家主張」 |
| 8 | JSON/JS 鏡像、匯入器、快取鍵、回歸契約同步 | ✅ R-DATA-05 鏡像深度相等測試在 166/166 內；審查者以 build-ch3-data.mjs 冪等復核（diff 僅含 C3-1 關鍵字、無時間戳漂移） |
| 9 | greybox 166/166 | ✅ 獨立重跑 run-node.mjs：166 通過 0 失敗；九 runner 合計 182 ✓ 0 ✗，exit 0 |
| 10 | skill guard 87/87 | ✅ 66＋21＝87 對帳成立；沙盒側 2 個 tearDown PermissionError 為 mount 禁 unlink 的已知環境限制（skill §9），斷言層全過 |
| 11 | registry 0 errors / 15 warnings | ✅ 且 15 warnings 內容正對應裁決「尚缺文件」清單（ch5/ch6 美術附錄 GAP、ch6.novel candidate 等） |
| 12 | ch6 敘事稽核 0/0；ch3 0 errors/1 既有警告 | ✅ ch6 無任何 WARN/ERROR；ch3 僅 `WARN NAR-09 consecutive active OS: CE-2/f3 → x5`，與宣稱逐字一致 |
| 13 | git diff --check | ✅ 通過 |
| 14 | ch6 正式路由＋--story-audit | ✅ check-narrative --chapter 支援 ch6；story-audit 首行即報三軌口徑（`unannotated_engine_controls=not-counted`），choice shape／匯流點／direct_state／LINE_RUN 齊備，並以 MANUAL 聲明「choice topology does not prove semantic impact」——工具把方法論邊界寫進輸出，是本輪最扎實的一件交付 |
| 15 | runtimeAnchor＋負向測試 | ⚠️ 機制存在（`narrativeChoice: "chN"` 標註、--runtime-source 按章計數、跨章洩漏即 WARN＋計 0）、負向測試齊（未登錄章 fail-closed×2、跨章洩漏、三軌分離）；**但生產代碼零標註實例**，六章 `annotated_runtime_choices=0`，runtime 軌目前空轉 |

---

## C 級意見（不擋試玩）

1. **runtimeAnchor 空轉**
   位置：greybox/src/engine*.js（全部）→ 證據：`grep narrativeChoice` 生產代碼零命中；story-audit 六章 annotated=0 → 因果：三軌盤點的 runtime 軌無資料，「碼頭辯論在 engine 內不可見」的原始問題只解決了工具口徑，還沒解決可見性 → 修法：在 engine3 ship public 質詢與 engine6 對帳板各掛 2-3 個 `narrativeChoice` 標註做示範批次 → 驗證：ch3/ch6 story-audit `annotated_runtime_choices ≥ 2` 且 R-TXT-4 計數正確。
2. **skill 測試 fixture 建在 repo root，在禁 unlink 的檔案系統上留垃圾**
   位置：test_skill_guard.py fixture 路徑 → 證據：本輪沙盒執行兩次共殘留 8 個 `.route-support-*` 目錄與一個 stale `.git/index.lock`（0 byte，會完全擋住 git 寫操作；均已由審查者於清理權限開啟後移除，工作樹已復原）→ 因果：skill §9 已記載此限制，但根治法是 fixture 改用系統 tempdir → 修法：fixture 根移至 `tempfile.mkdtemp()`，需要 repo 相對路徑的測試以 symlink 或 monkeypatch cwd 處理 → 驗證：在禁 unlink 環境跑完 `git status --short` 乾淨。
3. **審查者自身紀律違規記錄（無實害）**
   R0 審查中誤跑 `build-ch3-data.mjs`（mutation 工具）。事後以「build 前 166/166 已含 R-DATA-05」證明鏡像本已同步、build 冪等、diff 無時間戳漂移，工作樹內容未因此改變。記錄在案供流程稽核。

**觀察（不立案）**：C3-1/x1 錯項無 rep 懲罰（對照 C0-3/c1 越界項 rep −1＋防重罰旗標）。「終局重考不罰分、只逼收窄」設計上可辯護——同一玩家已在 C0-3 為同型錯誤付過費——總監知情即可。

---

## 對第一輪編劇審查的修正記錄

總監四項反駁逐條回查，全數成立，正式撤回：

1. **「ch3 只有 4 次互動」口徑錯誤**：我以 scenes 層節點數推玩法總量；ship engine 八階段才是本體。story-audit 的 `not-counted` 明示欄與規範 3.3 三軌盤點正是此錯的制度化根治。
2. **「首個 choice 在 59 節後」計算錯誤**：c_meet 實際在 9 行後（story-audit `NAR-01 first_action=C0-1/c_meet lines_before=9` 佐證）。我用「無 flag＋匯流」粗判其為裝飾——按規範 3.4，不同發言＋NPC 不同一拍回應即成立角色扮演選擇，flag 從來不是必要條件。
3. **ch2 三列確認清理建議與 GB-ADR-022 衝突**：查證 decisions.md，逐列確認是裁決明定的分列見證動作且進常駐測試（「只扳一次且三列逐列確認」）。撤回。
4. **ch6 減台建議只憑數量**：違反規範 3.6「不以 embed 數量單獨判定」「不得為了讓節奏表好看直接刪台」。撤回，密度問題留待真人試玩證據。

第一輪站得住並已制度化的部分：高潮執筆權（規範 3.5）、假選擇語意判準的需求（規範 3.4，判準比原報告更嚴謹且雙向）、接縫規則（規範 3.6）。

---

## 交付狀態

Outcome: CONFORMANCE PASS——十五項宣稱十四項全符、一項機制先行待標註；C 級 3 條；第一輪四項錯誤推論正式撤回並記錄；殘留垃圾（8 fixture 目錄＋stale index.lock）已清除
Truth mode: CONFORMANCE
Target and comparison baseline: 總監裁決文 vs 工作樹 scenes3/scenes6（含鏡像）、互動敘事規範 3.3–3.6、SKILL.md v3.5.0-candidate＋guard 腳本
Design Gate: N-A（R0 審查；本輪施工的 Gate 屬實作方流程）
Files changed: 本報告 1 件（05_審核/，新增）；另清除非交付殘留（.route-support-*×8、.git/index.lock）
Focused tests: story-audit ch3/ch6、check-narrative ch3/ch6、validate、test_skill_guard（66，含 2 環境性 tearDown error）、test_mechanics_guard（21）、build-ch3 冪等復核、GB-ADR-022 查證
Full tests: PASS (166/0)
九 runner 合計 182 ✓／0 ✗，exit 0；run-node.mjs 單獨口徑 166/166。
Registry updated: N-A
Browser/device: NOT RUN（靜態審查；瀏覽器驗收清單本就列於尚缺文件第 4 項）
Accessibility: 未評估（沿用裁決：真人試玩前另行）
Independent review: 本報告即獨立審查；審查者未參與本輪實作
Human playtest: NOT RUN——總監試玩為下一步，本審查即其前置
VCS: 未 commit（工作樹維持交付時狀態；skill 帳號層仍為舊五章 active 版，候選未啟用）
Release: N-A
Production smoke: N-A
Known gaps: runtimeAnchor 零生產實例；ch3 CE-2/f3→x5 既有心聲警告未清；尚缺文件四項依裁決清單；工作台 embed 內部體驗仍未經真人試玩
Preserved foreign WIP: 天數系統與其他 dirty files 未觸碰；本輪唯一寫入為本報告
