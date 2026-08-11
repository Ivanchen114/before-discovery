---
bd_artifact: review-report
bd_chapter: ch7
bd_status: delivered
---

# CH7-CR-001 施工後獨立 CONFORMANCE（Fable）

**日期**：2026-08-11｜**審查者**：Fable 5（獨立於施工方 Sol）｜**模式**：R0 唯讀＋工具實跑
**固定目標**：凍結劇本 v0.6（SHA 見 FREEZE 裁決）＋contract v0.7＋觸發表補件（含 pre-dispatch 確認版）＋CR 白名單
**實際成品**：scenes7.json／histfacts7.json／engine7.js／chapter-registry.js／chapter-ui.js（em1 工作台）／run-ch7.mjs

## 總裁決：**CONDITIONAL PASS — B×2、C×3；機制五大項全數通過，僅台詞層兩處需定點收口**

## 一、五大重點驗證（全部實查，非讀報告）

### 1. 凍結台詞零漂移 — 大體達成，B×2／C×3

109 個台詞節點全數機比（正規化後回凍結稿找源）＋保護句 11 句逐字 grep 全中（含「這句話現在姓你了」「我的針不認人，只認接觸」「先還自己的債，才有資格填別人的留白」）。路徑標記刪除（「（A 路，」「（withdraw 後，」）、【】編輯註記除去、劇本註記不入台詞——均為合理轉錄。

**B-1｜r_mid ③路聲部改寫（must-fix，一節點級）**
凍結：「（沒說話，把矩陣往旅人那邊推近半寸。**旅人・心聲**：不對——…）」→成品：「Galvani 沒說話，只把矩陣往旅人那邊推近半寸。**旅人忽然明白**：…」且刪「不對——」自駁起手。「旅人・心聲」是專屬聲道（話輪歸屬屬凍結範圍條 2）。直接修法：拆回兩拍——stage「Galvani 沒說話，把矩陣往旅人那邊推近半寸。」＋旅人・心聲「不對——『撐不了場面』不等於『必須有生命』。針的那一下是真的。A 要活，得靠自己的紙，不能靠對手的針矮。」驗證條件：修後聲部標記與凍結稿逐字、心聲聲道樣式與他章一致。

**B-2｜SC7-R1 excuse 回應新句（本報告逐字追認，銷案）**
成品 w1「基準格記著樣本那天醒著。你可以質疑，不能把已在桌上的資格一筆抹掉。」為我凍結稿括號設計註記的擴寫，非 Fable 供文。審：語意忠實、資格層聲線正確——**Fable 逐字核准此句**（依 Sol 替換句核准制之鏡像），無需改動；後續視同凍結文。

**C×3（回執即可）**：①baseline 工作台注入串「接下來，別再用它」逗號漂移（chapter-ui.js:9466）；②選項文本『』→「」引號層級攤平（如 bounded），建議在 CR 附記轉錄慣例；③choice 題面短句（「你把哪一句寫進回覆？」「下一格要怎麼問？」）為新增 UI 承載文——語意中性，本報告一併核准，建議標 microcopy 歸檔。

### 2. M／A 揭曉時機 ✓

c_exclusive gate 於 engine fail-closed（`前四格尚未全部留痕`，engine7 commitExclusiveClaim）＋場景拓撲雙保險（v_p1 小冊拍在 t_no_metal 之後）。判讀登錄（scenes7 內嵌 sidecar 區）：mid 錯項 refutedBy 僅 EM7-3/p6 與 t_electrometer——**1798 年無一處引堆**；1794 紙於 t_no_metal 揭曉（engineEvidence 含 RECORD_1794）；final 錯項 refutedBy 含 RECORD_1794＋t_no_metal。與 contract v0.7 plannedOrdinal 軸一致。

### 3. A 路同紙修復 ✓

repairExclusiveClaim：僅 A＋public＋final 後可修；method=`scope-on-original`、appendRecord 不產新紙、repaired flag 單向。r_named 為 final 各選項唯一出口（三 require 變體 scoped-A/N/M 全部 next→r_named）——dominance 與 contract S2 順序（判讀→r_named→f_repair→s_scoped）一致。

### 4. T3 pre-dispatch ✓

確認句於 engine7.js:380 **逐字**；attempted claim `{claim:"M", disposition:"send-despite-refutation", public:false}`——M 永不公開；防重觸發雙層（scenes `flagAbsent: ch7T3Used`＋engine usedSourceIds「不能再次藏同一張紙」）；returnNode=c_exclusive；gate 前置（M 承諾＋兩張反證在場）正確。T1／T2 確認拍與觸發表逐字（「把這頁舊紙收進箱底」「這格是你親手做、親手記的。桌上會留下一個空位。」）。initialRep：series.json ch7=1（舊章 3 不變）。修復 repairWithholding：restore-and-scope-on-original、repDelta +1、clearRepLock。

### 5. 三座工作台玩家操作權 ✓

e_matrix／e_electrometer／e_pile／e_board 均為 embed＋`until` 引擎相位 gate（matrix-four／electrometer／…）——NPC 演示無法支付；每格即時回應由工作台注入（chapter-ui.js:9466–9469，四句正文與凍結逐字，動作指示合理省略），演出循環「每格→人物回應」保持；t_* marker 帶 engineEvidence＋configNote＋observation，與 contract locator 對齊；engine action 白名單如 CR §5.3。

## 二、獨立重跑數字（非抄施工方）

- `npm test` 全鏈：run-node **179／0**＋run-ch7 **8／8**＋cognitive-feedback／ch4-migration（19 groups, 205 cursors）／art×4／series-home／design-governance 全綠
- skill guard tests OK；mechanics guard tests OK
- `check-narrative --draft --chapter ch7`：**0 errors／1 warning**（NAR-07 合理重建揭露為 MANUAL 項——ch7 adapter 實際可用，枚舉債已清）
- `check-mechanics --contract v0.7`：**PASS，chapter=ch7、segments=2、decisions=6、decisionStatus=VALIDATED**——scenes binder 真實綁定，TB-01 過渡豁免正式退役

## 三、交付狀態

Outcome: CONDITIONAL PASS——五大重點全過（gate／揭曉時機／同紙修復／pre-dispatch／操作權），台詞層 B×2（一處 must-fix 一處已追認）＋C×3
Truth mode: CONFORMANCE
Target and comparison baseline: 凍結三件套＋觸發表 vs 本機施工成品（136 檔未提交工作樹）
Design Gate: PASS（CH7-CR-001，總監已簽）；本報告為施工後獨立驗收
Files changed: 本報告（05_審核/，新檔）；成品與凍結稿零觸碰
Focused tests: 109 節點台詞機比＋保護句 11 句＋引號／聲部細診；engine gate／repair／T3 函式級對讀；judgment 登錄與 contract 對位
Full tests: PASS (179/0)
（另 CH7 8/8、guards OK、check-narrative 0e/1w、check-mechanics PASS——均獨立重跑）
Registry updated: N-A
Independent review: 本報告即獨立 CONFORMANCE
Human playtest: 未做（M／A／not-yet 三路全章人工通關屬總監實玩；VoiceOver 未驗）
VCS: 未 commit（成品維持未提交狀態，與宣稱一致）
Release: 未 deploy
Known gaps: B-1 一節點修正待 Sol；C×3 回執；三路人工通關／VoiceOver／Art CR 未在本輪範圍
Preserved foreign WIP: 全程唯讀；未觸碰任何工作樹檔案
