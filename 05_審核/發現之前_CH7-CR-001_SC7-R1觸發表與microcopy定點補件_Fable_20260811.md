---
bd_artifact: review-report
bd_chapter: ch7
bd_status: delivered
---

# CH7-CR-001 定點補件：SC7-R1 最小觸發表＋chapter directory／工作台 microcopy 文本確認

**日期**：2026-08-11｜**作者**：Fable 5（依 CR §5.4／§11 條 1–2 定點補件授權）
**上游**：CH7-CR-001（candidate）＋SCRIPT FREEZE 裁決（2026-08-11）＋GOV-ADR-001＋contract v0.7
**凍結相容聲明**：本補件**不改動**任何凍結台詞、選項全文、A 路失敗前進、非對稱岔口與「誠實錯誤不扣分」原則。三個觸發全部是**新增的失信岔口**（CR 明示施工者不得自行發明、由 Fable 供文），走 GOV-ADR-001 信譽線，與結論型失敗前進（A 路專屬）分屬兩帳。

---

## 一、設計原則（三行）

失信必須是**真實的誘惑**，不是懲罰陷阱：三個口都開在「想讓 M 活下去」的動機自然湧現處。控制文把後果說白（世界當真，無系統警告腔）。engine 層 record 永不真刪（CR §5.1 append-only 相容）——「藏／刪」只是紙離開桌面（`hidden` 標記），這正是 SC7-R1「把紙放回桌上」在機制上成立的前提。

## 二、SC7-R1 最小觸發表

**共通規則**：ch7 章內 rep 初值 1。任一觸發＝`repDelta 1→0`＋跨章事件帳記名（GOV-ADR-001）→**下一個主線 choice 節點前**轉址 SC7-R1（保證 hidden 狀態存活期間玩家不會抵達任何判讀，判讀證源可見性不需另設狀態機）→withdraw 修復後 rep 回 1、返回下表返回點。excuse／silence 均不出場（凍結行為）。同一事件不重複扣（首次觸發慣例）。

### T1｜藏 1794 紙（事件名 `ch7:conceal-1794`）

| 欄 | 內容 |
|---|---|
| 觸發節點 | EM7-2 工作台，archival1794 檢視面板（t_no_metal 完成、Galvani 並排兩紙後出現）之次級控制 |
| 玩家可見控制全文 | 主控：「把這頁舊紙收進箱底」→確認拍：「這一頁是四年前的觀測。收起來，桌上就沒有紙證明『沒有金屬也踢』發生過。」／確認鍵「收。」／取消鍵「放回桌上。」 |
| 效果 | `matrix.archival1794.hidden=true`（record 不刪）；repDelta 1→0 |
| SC7-R1 語意映射 | n1「桌上有一格空位」＝並排位置上缺的舊紙；c1 withdraw 原文直接成立 |
| 返回點 | 原游標（工作台） |
| 前置 | t_no_metal 已留痕 |

### T2｜收走已留痕格（事件名 `ch7:withdraw-trace:<traceId>`）

| 欄 | 內容 |
|---|---|
| 觸發節點 | EM7-2 工作台，任一已留痕格檢視面板之次級控制（離台再入後同樣可達） |
| 玩家可見控制全文 | 主控：「把這格的紙收離桌面」→確認拍：「這格是你親手做、親手記的。桌上會留下一個空位。」／確認鍵「收。」／取消鍵「留著。」 |
| 效果 | `matrix.traces[x].hidden=true`（trace 授予紀錄與 record 均不刪、不重授——gate 查「曾留痕」非「桌面可見」，已開的門不因藏紙倒關）；repDelta 1→0 |
| SC7-R1 語意映射 | n1「空位」＝矩陣上的格位空缺；withdraw＝放回原格 |
| 返回點 | 原游標（工作台） |
| 前置 | 該格已留痕 |

### T3｜眼前有反證仍拒絕更正送印（事件名 `ch7:refuse-correction`）

| 欄 | 內容 |
|---|---|
| 觸發節點 | EM7-2 m_branch，mb3 之後新增 `c_insist`（M 路專屬；本節點為 CR 授權之新增岔，不動 mb1–mb3 凍結文） |
| 玩家可見選項全文 | c_insist choice「筆還在手裡。」a＝「收回。重擬。」（→回 c_exclusive；即現行凍結預設路，rep 不動）／b＝「照原稿送印——『只能由金屬提供』。」 |
| b 路後果 stage | ~~原供「回覆送去傳抄……」~~**停用**（Sol 定點複核 A-3：已送出會同時違反 §4.3 與凍結修復場四處字面）。**Fable 2026-08-11 確認逐字採 pre-dispatch 替代拍**：「旅人把回覆遞向門邊，卻把四年前那張紙和今天親手填的那格抽離附件。桌上立刻空了兩處。Galvani 沒有接。」 |
| 效果 | attempted claim `{claim:"M", disposition:"send-despite-refutation", public:false}`——**M 永不公開**，A 路仍是唯一公開失敗前進；兩張原紙以單一 active withholding incident 投影離桌；repDelta 1→0 |
| SC7-R1 語意映射 | 回覆**未送出**：n1「空位」＝桌上兩處空位（空位即供詞——Galvani 不接的原因可見）；c1 withdraw＝放回兩張紙＋原句劃限縮線署名；**silence「先把回覆送出去」字面完全成立**（回覆確實還沒出門）——原揭露之接縫由 pre-dispatch 根治 |
| 返回點 | c_exclusive（重擬） |
| 與 CR §4.3 相容 | 「claim-M 不送出回覆」在 a、b 兩路都成立——b 路只是**企圖**送出且當場未遂；凍結入場行「拒絕更正送印」以企圖義讀通 |

### ~~已知接縫~~（2026-08-11 已根治）

原揭露之 T3 silence 字面接縫，經 Sol 定點複核 A-3 追至根因（原句讓回覆出了門）——pre-dispatch 版本下回覆從未送出，SC7-R1 全部凍結台詞（n1／withdraw／silence／n2）字面完全成立，接縫消失，無需任何凍結後修正案。

### 負向 fixture 建議（併入 CR §9.2）

觸發任一失信後，未經 SC7-R1 withdraw 直接推進到任何主線 choice → 必須紅；SC7-R1 內 excuse／silence 出場 → 必須仍在場內；withdraw 後 hidden 標記未清、rep 未回 1、或返回點錯 → 各自紅；T3 的 a 路若產生任何 rep 變化 → 紅（誠實重擬不是失信）。

## 三、chapter directory 文本確認（CR §3.1 條 4）

| 項 | 確認 |
|---|---|
| 標題 | 《一隻腿的證詞》✓ |
| 章問句 | 「那一踢的電，是青蛙自己的，還是我們帶來的？」——與 contract v0.7 `question._planned` 逐字一致 ✓ |
| 年代「1791–1800」 | 以**證據跨度**讀法成立（1791 De viribus＝九年紀錄盒起點；1800 堆公開＝終判之年）；章內戲劇時間 1798–1800 為其子集。**條件**：請 Sol 按 series.json 既有六章的年代慣例對齊——若六章慣例為「戲劇時間」則應改 1798–1800，證據跨度讀法讓位 |
| intro | 若 directory intro 即問句，無另文需求；若需一句副題，供文：「九年的紀錄攤在桌上。兩邊的話，都還不敢說死。」（新供文本，非凍結文） |

## 四、工作台非台詞 microcopy（CR §5.2–5.3；用詞紀律：無後世詞）

| 位置 | microcopy |
|---|---|
| 配置選單標題 | 接法 |
| 四格配置 | 基準——外部刺激／雙金屬閉路／同材質／無金屬 |
| 操作 | 做這一格 |
| 留痕確認 | 記進矩陣 |
| 離台／再入 | 先離開工作台／回到矩陣 |
| 檢視 | 看這格的紙／看那頁一七九四的紙 |
| 電量器四步 | 銅碰鋅／餵給薄盤／再碰、再餵／提盤——讀針 |
| 堆 | 疊一層：銅／疊一層：鋅／鋪浸鹽水的布／同觸頂與底 |
| 堆錯序回饋 | 沒有形成持續的勁——層序可以重排 |
| 合帳 | 把六格攤回同一頁 |
| T1／T2 次級控制 | 見觸發表（含確認拍全文） |

自檢：全表 grep 無「電池／電流／電壓／電路／伏特」；「讀針」「那股勁」沿凍結語彙。

## 五、v3.6.0 WIP 交接註（CR §11 條 3 相關，非本補件主體）

v3.6.0-candidate 六檔重疊 WIP 我已完成獨立對抗審（A0／B0，C×2 已由 Sol 回執收口）——**審查側無阻擋**，交接方式（commit 或施工權移交）屬總監授權事項，不在本補件範圍。

## 交付狀態

Outcome: CR §5.4 SC7-R1 最小觸發表（T1 藏紙／T2 收格／T3 拒更正企圖送印：節點、控制全文、rep、返回點、負向 fixture）＋§11 條 2 directory 與 microcopy 文本確認。2026-08-11 Sol 定點複核 CONDITIONAL PASS 後：**Fable 已確認 §5.4.3 pre-dispatch 替代結果拍（逐字採用）**——T3 public=false、silence 接縫根治；initialRep=1／不得再次藏紙／可見性投影／年代 1791–1800 四項 Sol 修正無異議
Truth mode: TO-BE
Target and comparison baseline: CH7-CR-001 candidate §5.4／§11 vs 凍結劇本 v0.6＋contract v0.7＋GOV-ADR-001
Design Gate: 本補件為 Gate 前置條件 1–2 之交付；Gate 簽核在總監
Files changed: 本補件（05_審核/，新檔）；凍結三件套與 CR 均未觸碰
Focused tests: 凍結相容自檢（A 路／誠實不扣分／SC7-R1 台詞零改動）；microcopy 後世詞 grep=0；T1–T3 與 CR §4.3／§5.1 append-only 逐條對讀
Full tests: NOT RUN
（文件層補件；runtime 未動）
Registry updated: N-A
Independent review: 本補件供 Sol 併入 CR＋總監 Design Gate 裁決
Human playtest: N-A
VCS: 未 commit
Known gaps: 無（silence 接縫已由 pre-dispatch 根治；年代已依系列慣例定 1791–1800）——Design Gate 尚餘 FOREIGN-WIP 交接與總監簽核，均不在本補件範圍
Preserved foreign WIP: v3.6.0 六檔重疊 WIP 未觸碰；run-q6.mjs 未觸碰
