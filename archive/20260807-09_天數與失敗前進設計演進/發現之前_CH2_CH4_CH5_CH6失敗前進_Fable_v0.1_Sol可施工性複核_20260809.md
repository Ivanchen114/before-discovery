# 《發現之前》CH2／CH4／CH5／CH6 失敗前進｜Fable v0.1 Sol 可施工性複核

- 日期：2026-08-09
- 審查者：GPT-5.6 Sol
- 對象：`02_設計/發現之前_CH2_CH4_CH5_CH6失敗前進_branch-map與施工台詞_v0.1_Fable_20260809.md`
- 基線：`greybox/` 全套自動測試 168/0
- 結論：**FINAL PASS（A=0；原 B=4 已由 Fable v0.1.1 全數逐字核准）**
- runtime：本輪未修改
- 總監裁決：`DESIGN GATE: PASS — CH2-CR-013 + CH4-CR-013 + CH5-CR-003 + CH6-CR-002`（2026-08-09）

## 一、總判斷

四章主候選都可施工，沒有需要退案的 A 級問題。Fable 的成本判斷大致正確：CH2／CH5
新增兩個具名狀態；CH4／CH6 可復用現行紀錄。四個 B 級問題都能在不改物理 engine、
不升 save schema、不新增 rep 事件的前提下收口。

已立四張 candidate CR：

- `CH2-CR-013`：B2-4 木籌押注與三列揭曉。
- `CH4-CR-013`：切線錯紙的印刷／封存讀回。
- `CH5-CR-003`：尺度過度斷言進辯論並保留沉默後果。
- `CH6-CR-002`：乾式過度宣言、T2 自簽與 S8 延後追債。

Fable 已於 v0.1.1 逐字確認本報告全部替代句；總監 2026-08-09 同批放行四張 CR。

## 二、B 級問題與收口

### B-1｜CH2 `r_late` 把「未測得」說成「物理上押錯」

現行三列只能支持「本裝置能分辨的範圍內沒有可測延遲」，不能支持絕對同時。因此原句
「它押錯了」超過 runtime 證據能力。

**替代句（請 Fable 逐字確認）**：

> 伽利略：（把你的木籌從「晚到」那格推到三列紙旁）這一注，三列紙沒有替它作證。可它敢押。（頓）籌碼不退——下次，讓它壓在紙寫得出的地方。

精確接點：只有 q4.a 的合法有限結論才進三路讀回；q4.b 仍先走現行 nb1、返回 q4，
不得一邊捏造未測延遲、一邊領取誠實押注讀回。

### B-2｜CH4 錯選不在 `tangentPrediction.choice`

`engine4.sealTangentPrediction()` 只在正確 `tangent` 時寫入
`sourceLab.tangentPrediction.choice`；`arc`／`fall` 只寫進 append-only
`sourceLab.attempts`，敘事層另有 choice event。故 Fable 的「依
`tangentPrediction.choice` 三選一」在錯路上讀不到資料。

收口不加新 state、不改 engine：使用現行 `require.event`。

- 有 `D1-1/c1.curve`：顯示 curve 讀回。
- 沒有 curve、但有 `D1-1/c1.inward`：顯示 inward 讀回。
- 兩種錯選皆無、且有 tangent：顯示 direct-tangent 讀回。
- legacy 存檔若缺可證事件：不捏造讀回，直接略過。

若玩家兩種錯路都試過，採 curve ＞ inward 的呈現優先序；這只是避免同場連播兩段，
append-only 原始嘗試仍全數保留。

原 `de1_close` 無條件列出三種紙，會讓直接答對者也被寫成走過兩條錯路。改為：

> stage：第一晚留下的切線紙、後來量成的短差，以及一路退下的錯稿，疊進同一只木匣。蠟油封上時，沒有一張曾真正出現的紙被抽走。

### B-3｜CH5 油灰台確實記錄速度；沉默不能再變成硬性改答案

`engine5.runClay()` 每筆原紙都有 `height`、`speed` 與 `depth`；UI 也明示速度。因此
`duel_v2` 的「你的油灰量過速度嗎？沒有」不符合 runtime。

**替代句（請 Fable 逐字確認）**：

> 杜佩院士：（翻開 J2 那頁，推到桌心）同一批碰撞。你的油灰坑量過碰撞後兩邊的速度嗎？量過方向嗎？（頓）沒有。那它憑什麼，審一本記方向的帳？

另，原稿要讓「沉默」進辯論，卻又要求 debrief 前必須縮句。若以單一合法選項把玩家
擋回縮句，就會重造「選錯馬上重選」的舊病。CR 改採真正後果：

- 縮句：`ch5ScaleClaim` 轉成 `*-shrunk`，使用原 `e_shrunk`／`e32_trace`。
- 沉默：`ch5ScaleClaim` 轉成 `*-silent`，照樣進辯論；原斷言不被 NPC 代撤回，E3-2
  明說它仍算在玩家名下。

**新增兩句（請 Fable 確認）**：

> `e_silent`｜杜夏特萊：（把下午那句原話留在帳頁邊欄，沒有替你劃線）沉默不算撤回。上桌吧——它還是你的。

> `e32_trace_silent`｜杜夏特萊：（把帳頁邊欄翻開給你看——下午那句原話旁，今晚仍是一片空白）你沒有收回。那它就繼續算在你名下。

這不是多結局；兩路都進現行 debate5 與 E3-2，只是匯流不洗白。

### B-4｜CH6 越界路的 T2 狀態與 S8 反擊文字都需校正

現行 T2 不只是 scene evidence：sanitizer 要求
`lab.evidence.t2 === lab.dryBench.judged`。若 `w3 → h13_sign → t2` 沒有執行
`judgeDryStrip({concept:"observed-range-only"})`，存檔會成為不一致狀態，後續
`sealAirPrediction` 也會被 `dry-judgment-required` 擋下。

收口：新增 overreach 專用 system 節點 `t2_overreach`，同時執行白名單內既有
`judgeDryStrip` 並授予 T2；正確路仍走現行 `a1 → t2`。這改 scenes，不改 engine6。
T2 是史坦格自簽的觀測紙，證據名稱與歸屬不需改成玩家簽名。

S8 是冰融而不升溫，與炮膛長曲線不是「條件欄一格沒動」。替換三處：

> `h31_recall`：凱斯勒院士：（把 S8「升溫最後停住」那格推到旅人面前）第一天，有人說這一班已分出勝負。（從對帳板下抽出那句被朗福德收藏的話——伯爵不知何時把它貼了上去）現在，熱還在進，溫度線卻停住了。（頓）分出來的那個勝負——借我看看？

> `c_concede.keep`：「冰在融，條件當然變了。這不等於運動說輸了。」

> `h31_press`：凱斯勒院士：（把長時段曲線與 S8 並排）我也沒說它輸了。我問的是你第一天那句「已分出勝負」。炮紙沒有告訴我們，冰融而不升溫時，運動記在哪裡。你可以保留模型，不能把缺口寫成勝利。

修復選項直接寫既有 `ch6LatentUnresolved=1` 後進現行 `a1`，不得再顯示一次現行 c1
要求玩家重答同題。`he1_veil` 所依空氣撤回是必經 T3，不需另加 seen flag。

## 三、C 級補充

### C-1｜防重播不用新增全域機制

四組讀回都位於線性離場節點；失敗重試只回到岔口，不會跨回後文。以節點拓撲＋既有
event／flag guard 即可 exactly-once，不需 `seenFailureIds`、`yieldToken` 或裸計數。

### C-2｜兩個具名狀態仍成立

- `ch2DropPrediction = late | unresolved | abstain`
- `ch5ScaleClaim = measurement-only | vis-viva-open | vis-viva-shrunk | vis-viva-silent |
  momentum-false-open | momentum-false-shrunk | momentum-false-silent`

CH5 用同一枚舉同時保存原立場與後續處理，不另加 `repaired` flag；CH4／CH6 零新增。

## 四、施工與 Gate

Fable 確認上述替代句後，四張 CR 即可供總監同批裁：

`DESIGN GATE: PASS — CH2-CR-013 + CH4-CR-013 + CH5-CR-003 + CH6-CR-002`

此 Gate 只授權 runtime 施工；不等於 commit、push、deploy 或正式發佈。施工須分四個可
獨立回退的章別修改包，最後才做六章整合驗收與總監一次實玩。
