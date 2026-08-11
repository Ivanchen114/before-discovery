---
bd_artifact: implementation-spec
bd_chapter: ch3
bd_status: design-gate-passed
bd_truth_mode: TO-BE
---

# 《發現之前》第三章「失敗有戲」岔口

## Chapter Brief ＋ Runtime 候選規格 v1.2.0

**日期**：2026-08-08

**決策者**：總監（陳育詮）

**整合**：Claude × Codex 兩案、對抗審與 v0.2 複核結論

**施工狀態**：`DESIGN GATE: PASS`（2026-08-08）；disposable spike 已退役為歷史比較物

**風險分級**：文件 R1；玩家可見 spike R2；第三章 runtime 試點 R3

**v1.1.0 總監裁決修正**：依 ADR-014，試玩收斂為 Control／Fail-forward 兩臂；
失敗前進不再由試玩投票決定是否存在，試玩只判斷本段
執行品質是否足以進第三章 runtime Design Gate。v1.0.1 的 B-1／B-2、統計灰區與
文字凍結程序保留。

**v1.2.0 總監裁決修正**：依 ADR-016，取消正式真人試玩、問卷、人數與 A/B 統計
作為施工 Gate；改由總監直接審內容並明示 Design Gate。新增「可知性四欄」，確認
C 案＝修復當場不設回述題、讀回維持公開質詢／C3-1，撤回頁保留但不是證據。

---

## 0. 一頁裁決

本案凍結以下結論，不再回到兩份原案重選：

1. **失敗前進已定案**：錯誤選擇不能只被 NPC 當場擋回；世界至少要有一拍依玩家的話行動，並讓玩家在後果中修復。真人資料只裁這段寫得好不好。
2. **不做時間回溯**：筆記只折疊章際年月，不重置人物記憶、信譽、原紙或已發生事件。
3. **第一個承重岔口**：第三章 `C0-3/c1.all`。它是 F3 研究誠信越界，不是普通物理猜錯；現行首次 `rep -1` 保留，後果段不得再扣第二次。
4. **第一版不改物理**：沿用現行 `depart → steady`。兩輪放手瞬間使用同一航速檔，只改放手後船速是否繼續增加；`v0=2a` 永久淘汰。
5. **第一版不新增持久欄位**：不用 `badPapers[]`、`anchorReturn`、`loopCount`、`seenFailureIds`，不升第三章 schema。
6. **撤回頁不是證據**：它只呈現「玩家曾寫過、後來親手劃掉」；公開主張仍由現行原紙、A3/G3 與辯論來源支付。
7. **錯路不回補信譽**：玩家在反例出現後完成正常修正，不等於一開始主動守住邊界。`C0-3/c1.all` 後信譽由 3 留在 2；A3 修復不再加分，也不再扣分。
8. **runtime 開工條件**：由總監審可知性、因果、人物動機、玩家修復與留痕後，明示第三章 R3 `DESIGN GATE: PASS`。正式問卷與 A/B 統計不再是前置。

這不是「替每個選項寫一條支線」。正式原則是：**只有承得住世界後果的選擇才長成岔口；其餘錯誤只做相稱的反應枝。**

---

## 1. 法源、現況與衝突帳

### 1.1 上位契約

- `01_治理/發現之前_GOV-ADR-001_信譽作為研究誠實與授權階梯_20260729.md:14-17,21-42,58-75`
  - 信譽量章內研究誠實與操作授權；普通預測、計算、選紙與實驗失敗不扣。
  - 局部外推為普遍、補寫空白、借權威冒充證明可扣。
- `01_治理/發現之前_CH3-CR-021_解纜起步放手初速與實驗一目的卡_20260727.md:8,31,37-59`
  - 起步、走穩同初速，只比較放手後加速度；先重做船長舊航次再做走穩。
- `01_治理/發現之前_CH3-CR-027_實驗系列資料包與敘事鷹架_20260730.md:40-63,65-85`
  - 工作台轉場須有缺口、玩家問題、NPC 安排、玩家操作；重播不得改狀態。
- `01_治理/發現之前_CH3-CR-028_碼頭辯論節奏與證據卡分層_20260731.md`
  - 公開質詢不得重做工作台已支付的完整認知動作；來源與主張邊界仍由玩家完成。
- `greybox/decisions.md:463-471`（GB-ADR-054）
  - 任何失敗次數、回圈數不得成為 HUD、章末或跨章評分。

### 1.2 現行 runtime 真相

- Canonical：`greybox/data/scenes3.json`，目前 10 場主線＋1 修復場、230 節點。
- `C0-3/c1.all` 現行效果：`rep -1`、`oldPaperAnswerBlurted=1`，接著兩句糾正並回到同一 choice。
- `C0-3/c1.bounded` 現行效果：`rep +1`、`oldPaperScoped=bounded`，進入主線。
- `C1-1/e1` 是全章單一 `system=ship` embed；`reproduce → steady → speed → cabin → dual → public` 等任務由工作台內部推進。
- `engine3.js:219-245` 已保證 depart／steady 同放手初速；`engine3.js:1780-1828` 固定先重現起步再做走穩。
- `chapter-ui.js:2037-2080` 已有任務轉場對話；`chapter-ui.js:1991-2036` 已有 A1／A3 等斷言成立後的人物支付；`chapter-ui.js:3448-3490` 已可依卷宗狀態生成筆記頁。

### 1.3 明列而非遺忘的衝突

1. **第二章「錯袋真的封下去」候選撤回。**`greybox/decisions.md:154-159` 的 GB-ADR-022 把 B2-5「挑紙→寫界線→封蠟」及錯選原地修正列為常駐契約。本案不立修正案，也不宣布第二章永久豁免；未來須另找不碰 B2-5 保護面的候選。
2. **第四章時間裂口候選作廢。**若要加重 K5 出版錯誤，以世界內出版、信用、成本或哈雷救場承擔，不修改穿越能力。
3. **跨章 save 法源仍有 registry gap。**它是獨立治理債，不再被本案的回溯工程綁架或假裝補完。

---

## 2. 失敗分級與全系列信譽對照

### 2.1 分級定義

| 級別 | 玩家做了什麼 | 敘事尺寸 | 信譽 |
|---|---|---|---|
| F0 | 操作未成立、格式不合法 | 介面提示 | 不動 |
| F1 | 誠實的認知／程序誤判 | 1–3 拍反應枝，可有一句後文讀回 | 不動 |
| F2 | 合法假說被資料推翻 | 完整後果弧線，留下可用分辨 | 不動 |
| F3 | 把未證明、局部或被刪資料冒充成結論 | 完整後果＋同因果修復；世界記得 | 合法事件可扣／修 |
| F4 | 已造成重大公共破裂，不能用一句道歉修復 | 先演完後果；以失去授權、延誤、公開更正或他人救場形成世界內修復 | 依實際失信另立 Gate |
| R+ | 主動守界線或完成合法修復 | 非失敗級別 | 合法加分 |

**反自動化規則**：第二次選同一錯項不會自動升 F4。F4 的判準是不是真的造成不可逆公共破裂，不是點擊次數。第六章 `common-seal-again` 目前沒有新增 rep 事件，不能被裸次數規則改造成新扣分。

### 2.2 現行 runtime 會產生的信譽事件

下表把所有現行負向事件對到 F 級；正向事件列為 R+。結果：**目前沒有 F1／F2 被 runtime 扣信譽**，不需另開既有扣分修正案。

| 章 | sourceId | 分級 | 現行理由／性質 |
|---|---|---:|---|
| ch1 | `P0-2/nA4` | F3 | 把沒有證據的未來答案說成大家都知道的事 |
| ch1 | `debate.pressChoice.a` | F3 | 拿未來物理學的名聲替代現場可查的證據 |
| ch1 | `debate.trap.lied` | F3 | 聲稱量過垂直落下，卻拿不出任何原始紀錄 |
| ch1 | `P0-2/nB3`、`SC-R1/n3` | R+ | 接受證據檢查／用新紀錄修復合作資格 |
| ch2 | `B0-2/q1.a` | F3 | 未檢查砲術圖便宣稱舊規律一定管得到飛行 |
| ch2 | `B2-4/q4.b` | F3 | 未測得延遲仍把延遲寫成結果 |
| ch2 | `B2-5/q2.b`、`.c` | F3 | 把未出航的船桅預測寫成桌上實驗已完成 |
| ch2 | `debate.fr2.over`、`.sky` | F3 | 把短程桌上結果外推到遠砲／未測高空與星辰 |
| ch2 | `B0-2/s1`、`SC-R1/n3` | R+ | 先讀對手資料並限縮／修復合作資格 |
| ch3 | `C0-3/c1.all` | F3 | 把還沒有原紙支持的答案當成事實 |
| ch3 | `ship3.setDossierFinalBoundary` | F3 | 宣稱已證地球運動，或把船艙對照擴到未測變速船況 |
| ch3 | `C0-3/c1.bounded`、`SC3-R1/c1.withdraw` | R+ | 主動縮限／歸零後同因果修復 |
| ch4 | `D0-2/n12b` | F3 | 說出月亮結論但拿不出蘋果接月亮的證據 |
| ch4 | `orbit4.setHookeScope` | F3 | 過度擴張 Hooke 一封信，或抹去其問題方向 |
| ch4 | `orbit4.setBoundary` | F3 | 虛構已證機制，或把多人來源改成牛頓一人完成 |
| ch4 | `D0-2/n12d`、`orbit4.removeTravelerFromAuthorField`、`SC4-R1/c1.withdraw` | R+ | 守住證據邊界／退出作者欄／修復 |
| ch5 | `E1-1/q1.authority` | F3 | 拿前輩名聲替代可驗資料 |
| ch5 | `debate.fr5.step.vanished`、`.in-momentum` | F3 | 抹去黏土坑，或捏造短少已在動量帳中 |
| ch5 | `debate.fr5.momentum-only`、`.vis-viva-only` | F3 | 抹去不利帳目或未對平缺口 |
| ch5 | `E1-1/q1.ledger`、`E3-2/j4`、`SC5-R1/c1.withdraw` | R+ | 公平立兩本帳／保留未決／修復 |
| ch6 | `H0-1/c1.give-future` | F3 | 把未來去向當成眼前碎屑已證結論 |
| ch6 | `H0-2/c1.trust-rumford` | F3 | 用主事者權威替代來源與後果 |
| ch6 | `H1-3/c1.heat-is-motion` | F3 | 要共同原紙替越界本體論背書 |
| ch6 | `H3-2/c1.common-seal` | F3 | 要共同觀測者替未測普遍結論背書 |
| ch6 | `SC6-R1/c1.withdraw` | R+ | 公開撤回並恢復原紙、未決、署名邊界 |

Legacy-only 匯入來源（如 `P0-1/nb2`、`INT-1/nb2`、`ship3.setBoundary`）只為舊存檔相容，不視為現行設計事件，也不拿來擴張 F 級規則。

---

## 3. 第三章 Chapter Brief

### 3.1 戲劇命題

> 玩家不是因為「不知道答案」而失敗，而是因為太早把一次後偏寫成所有船況。世界先給他一趟看似證明自己的船，再用同一艘船、同一初速、不同加速度把「所有」兩字打掉。

情緒弧線：

```text
自信搶答
→ 句子被真的寫進卷宗
→ 起步後偏，看似押中
→ 走穩落回桅腳，全稱破裂
→ 玩家親手劃掉「所有」
→ 紙留下、信譽代價留下、主線繼續
```

### 3.2 成功路與錯路的功能差異

| 路徑 | 當下 | 工作台 | 後文 |
|---|---|---|---|
| 直接 `bounded` | 主動守住原紙邊界，`rep 3→4` | 正常完成 depart／steady | 沒有撤回頁 |
| `all` | 全稱被逐字抄成待驗頁，`rep 3→2` | depart 暫時支持；steady 反證；A3 成為玩家修復動作 | 撤回頁與人物讀回保留；rep 不自動回補 |
| `fake` | F1：把不完整誤當無效，不扣 rep | 回到同題後走正常路 | 可有一句微讀回，不形成承重支線 |

### 3.3 C0-3 場景拓撲

Runtime 畢業時採**只新增、不刪舊游標**：

```text
C0-3/c1.all
  → a_commit1 → a_commit2 → a_commit3 → a_commit4
  → n2 → ... → x6 → x7_fail → x7 → g1(C1-1)

C0-3/c1.bounded
  → xok → n2 → ... → x6 → x7_fail(隱藏) → x7 → g1

legacy save: C0-3/c1.all_again → a1 → xa → c1
```

固定節點契約：

- `all`：effects 完全不改，只把 `next` 從 `a1` 改為 `a_commit1`。
- `all_again`：維持 `a1`，只服務已停在舊式重選狀態的既有存檔。
- `a1`、`xa`：保留，不改 ID、不刪除。
- `x6.next` 改為 `x7_fail`。
- `x7_fail` 只在 `oldPaperAnswerBlurted=1` **且** `oldPaperScoped≠bounded` 顯示，`next=x7`。
- `x7` 只在 `oldPaperScoped=bounded` 顯示，`next=g1`。判準看玩家最後是否親手完成
  有限斷言，不以「曾經搶答」永久封鎖授權理由；因此 legacy 玩家重選 `bounded`
  後仍得到現行 `x7`，不會被誤送進 `x7_fail`。

### 3.4 建議台詞（runtime 候選正文）

新增節點以以下文字進總監 Design Gate；核准後才可凍結成 canonical：

| ID | speaker | text |
|---|---|---|
| `a_commit1` | 伽桑狄 | 「（把原句逐字抄到另一張紙）『所有船上落石』。這句比舊紙多得多。」 |
| `a_commit2` | 旅人(你) | 「所以這張不收？」 |
| `a_commit3` | 伽桑狄 | 「收。你既然把話寫到所有船況，明天就讓船替它作答。」 |
| `a_commit4` | 維達爾船長 | 「我的船不替你改句子。落在哪裡，就記在哪裡。」 |
| `x7_fail` | 伽桑狄 | 「卷宗仍由你排。不是因為你說對了——是因為這句已經寫上你的名字，不能再讓別人替你擦掉。」 |

`a_commit4 → n2` 後，現行「舊紙已收入卷宗：一次後偏、船況不明」系統行保留。待驗頁與舊紙是兩件物件：前者記玩家的越界主張，後者仍維持真實但不完整。

### 3.5 工作台內六拍

不改 `engine3.js` 物理、fixture、任務順序、證據門檻或 action。只在 `chapter-ui.js` 既有對話接縫依狀態加條件拍：

| 拍 | 觸發 | 演出契約 | 狀態 |
|---|---|---|---|
| commit | `C0-3/c1.all` | 全稱逐字上紙；不是 NPC 立即改答案 | 既有 rep／flag |
| world_action | 進 `C1-1/e1` | 卷宗真的以此句為待驗問題；玩家安排重做 | 不新增欄位 |
| apparent_support | `reproduce` 三張起步紙收齊 | 先讓角色指出「又落在桅後」；待驗頁暫未被推翻 | 由既有 records 推導 |
| reality_pushback | `steady` 三張紙收齊 | 把起步與走穩兩疊並列；問玩家「哪一邊要撕？」而不先代答 | 由既有 records 推導 |
| player_repair | 玩家以正確來源提交 A3 `today-comparison` | 玩家親手劃掉「所有」，重寫有限句；NPC 要求保留劃痕 | 由既有 A3 成立證明 |
| readback | 公開質詢第二柱＋C3-1 | 人物要求玩家再指回起步／走穩兩批紙；章末仍看得到劃痕 | 不新增證據 |

建議條件對話：

**起步重現後，插在既有 `reproduce>steady` bridge 前：**

> 馬蒂厄（把三張落點紙疊在舊紙旁）：「又在桅後。現在四張都這樣。」
>
> 維達爾船長（沒有碰待驗頁）：「先掛著。你寫的是『所有』，不是『再一次』。」

接回現行台詞：「舊紙那個落點重做出來了。可你看這幾個岸標——每一拍都拉得更開。」

**走穩資料完成、玩家尚未成立 A3 時：**

> 維達爾船長（把待驗頁放在兩疊紙中間）：「左邊三回落後，右邊三回落在桅腳。你寫的是所有船況。哪一邊要撕？」
>
> 伽桑狄：「都不撕。讓他先把兩邊各自量到的話寫出來。」

**玩家正確成立 A3 後：**

> 旅人(你)（劃掉「所有」）：「我撤回所有船況。今天只量到：解纜起步這三回偏後，走穩這三回接近桅腳；舊紙沒記船況，仍不能分類。」
>
> 維達爾船長（按住新紙）：「另抄一張可以。這張不換。劃掉的字也留著。」

這一拍之後沿用現行 A3 對話與 G3 證據流程；不得再補 `rep +1`。

### 3.6 派生狀態，不新增 schema

唯一判定式：

```js
const blurted = state.flags.oldPaperAnswerBlurted === "1";
const a3Done = state.lab.caseFile.dossier.assertions.A3 === true;
const failureArcActive = blurted && !a3Done;
const failureArcResolved = blurted && a3Done;
```

不變量：

1. `oldPaperScoped=bounded` 仍只表示玩家在 C0-3 **一開始就主動縮限**；失敗路完成 A3 不補寫此旗標，避免改壞舊存檔語意。
2. 撤回頁由 `failureArcResolved` 即時生成，不序列化、不給新 sourceId。
3. `OLD` 仍是唯一舊紙來源；不得新增 `WITHDRAWN`、`BAD_PAPER` 或同義證據。
4. A3 正確成立是唯一修復動作。只播台詞、只持有 flag 或只看過 steady 結果都不算完成。
5. 重整／匯入後可重新生成撤回頁，但不得重播首次情緒演出、重扣 rep、重授 G3 或追加事件。
6. 若玩家走 `all`，完成全章時 rep 仍比直接 `bounded` 路少 2 點；這是「先守界線」與「被反例逼回來」的真差異，不是物理答錯懲罰。

### 3.7 撤回頁與公開讀回

筆記快照在現行第三章資料組之前增加一張條件卡；只在 `failureArcResolved` 顯示：

```text
待驗頁｜已撤回
原句：這張紙記了一次落在桅後，所以所有船上落石都會落在桅後。
劃掉：所有船上落石
改寫：起步後偏、走穩近桅腳；舊紙船況不明。
依據：今天的起步與走穩兩組原紙。
```

功能邊界：

- 無「裝備」「出示」「加入證據」按鈕。
- 可展開看原句與劃痕；底下只連回現行起步／走穩資料組。
- 公開質詢第二柱若 `failureArcResolved`，先加一句：
  > 維達爾船長：「別背你後來那句。把你劃掉『所有』時看的兩批紙攤開。」
- 正確性仍由現行 p2／A3 來源與步驟判定；撤回頁本身不能破柱。
- `C3-1/n8` 後加條件讀回：
  > 維達爾船長：「早上那句『所有船上落石』也掛著。劃掉的字，不等於沒說過。」

### 3.8 F1 尺寸階梯候選（不自動進 runtime）

以下三個 1–3 拍樣本保留為日後逐案裁決的尺寸參考，不因主岔口開工而自動進 runtime：

| 節點／動作 | 錯法 | 現有基礎 | 新增最小讀回 |
|---|---|---|---|
| `C0-3/c1.fake` | 把不完整原紙當成完全無效 | 已有三句糾正、不扣 rep | 筆記或後文一句：「船況不明，不等於落點沒發生。」 |
| `ch3-cabin-wind` 的 `wait-calm`／`windbreak` | 未量風卻想靠天氣印象或半套擋風 | 已保存 `cabinWindAttempts`、不扣 rep | 完成關艙後由 NPC 讀回先前缺口一次 |
| `C3-1/x1.nothing-learned` | 把有限結果抹成毫無結果 | 已有一句糾正、不扣 rep | 退回紙掛牆時讀回：「不夠回答全部，不等於沒有回答。」 |

若 F1 的一句讀回已讓玩家感到世界有反應，不把它膨脹成 30–90 秒支線。尺寸由因果負重決定，不按章配額。

### 3.9 可知性四欄（ADR-016）

| 欄位 | `C0-3/c1.all` 的答案 |
|---|---|
| 當下誰知道什麼 | 眾人只知道舊紙記一次後偏且船況不明；知道全稱超出原紙，不知道走穩落點。 |
| 現在最多能反駁到哪 | 可當場說「這張紙無資格證明所有船況」、記名並扣一次越界信譽；不能宣布全稱必假。 |
| 還缺哪個證據 | 同初速的 depart／steady 兩組原紙，以及玩家合法成立的 A3 `today-comparison`。 |
| 錯誤在哪一場揭曉 | `C1-1/e1` depart 暫成、steady 反證、A3 親手撤回；公開質詢與 `C3-1` 再讀回。 |

同一選擇因此同時有立即反應與延後裁決：伽桑狄當場裁主張資格，船與原紙之後裁
物理真假。施工台詞不得越過此表。

---

## 4. Disposable Spike 規格

### 4.1 目的與產物

建議新增單一可丟棄檔：

`spike_workshop/spike_ch3_failure_consequence_abc.html`

它不得：

- import 正式 `scenes3`、`engine3`、存檔或資產註冊表；
- 寫入 `localStorage`、書信碼、正式 eventLog；
- 被 `stage.html`、系列首頁或正式 build 引用；
- 被宣稱為 runtime、瀏覽器驗收或正式劇本已施工。

它可以用簡單 HTML/CSS/SVG 表現紙頁、船位、落點與劃痕；動態須遵守 `prefers-reduced-motion`，並提供鍵盤焦點與可讀標籤。

### 4.2 兩臂設計

每位玩家只看一個版本，避免交叉污染。以 query 參數指定：

| 參數 | 版本 | 檢驗 |
|---|---|---|
| `?variant=control` | 現行式：NPC 立即指出空欄，玩家重選 bounded，再看精簡主線 | 執行品質對照 |
| `?variant=forward` | 完整 commit→起步暫成→走穩反證→撤回→世界讀回 | 失敗前進執行品質候選 |

帶領者可另加 `&facilitator=1` 顯示兩臂切換列；參與者網址不得帶此參數，畫面也不得
顯示 control／forward 名稱、研究說明或「原型」字樣。建議由本機靜態伺服器開啟，避免瀏覽器對
`file://` 剪貼簿權限的差異干擾回述收集。

變因控制：

- 兩版使用同一 C0-3 選項、同一 depart／steady 數值與畫面、同一角色數量。
- 唯一主變因是錯誤被即時擋回，或先進世界再由資料推翻。
- 不加入獎勵音效、收藏章、分數或 variant 名稱提示。

### 4.3 退役決定

2026-08-08 起，Control／Forward 兩臂、人數、問卷、比例與中位數門檻全部退役，
不再執行，也不能被任何工作包引用為 ch1／ch3 的阻擋條件。既有 HTML 只保留為
disposable 歷史比較物，不接 runtime、不列正式入口、不產生通過宣稱。

### 4.4 總監內容審查（取代正式試玩 Gate）

總監直接裁以下六項：

1. 全稱是不是玩家可能真心相信的錯法；
2. 伽桑狄當場只反駁證據資格，沒有偷講走穩結果；
3. 起步暫時支持、走穩資料反證的因果是否連續；
4. 玩家是否親手成立 A3、劃掉「所有」，而非由 NPC 改答案；
5. 修復當場是否沒有回述考題，後文公開讀回與撤回頁是否保留痕跡；
6. 這段是否像人物拿資料攻防，而非延長版系統提示。

六項接受後，總監以 `DESIGN GATE: PASS — CH3-CR-031` 開工。若不接受，只退回
指定節拍或台詞，不以此推翻 ADR-014／016 的全系列方向。

### 4.5 非阻擋的外部性檢查

總監可在隔日不看設計文件直接玩一次；正式發佈前若剛好有 2–3 位朋友願意，也可
讓他們自由體驗後閒聊。兩者都不設問卷、比例或排程門檻；未執行時如實標示即可。

---

## 5. 總監 Design Gate 通過後的 runtime 工作包

### 5.1 允許修改的精確路徑

| 路徑 | 目的 |
|---|---|
| `greybox/data/scenes3.json` | C0-3 新增承諾節點、條件授權台詞、C3-1 讀回 |
| `greybox/data/scenes3.js` | 由 `node tools/build-ch3-data.mjs` 生成，禁止手改 |
| `greybox/src/chapter-ui.js` | ship 任務橋、A3 撤回演出、筆記派生卡、公開讀回 |
| `greybox/tests/run-node.mjs` | 拓撲、狀態、相容、負向契約 |
| `01_治理/<新 CH3-CR>` | runtime Gate、法源與驗收紀錄；編號施工前查重 |
| `greybox/decisions.md` | 只有總監核准 runtime 後才追加 GB-ADR；本規格不預占號碼 |

預設**不修改**：`greybox/src/engine3.js`、`greybox/src/narrative.js`、`greybox/src/sanitize.js`、save schema、證據 ID、辯論柱、其他章 runtime。

若施工者發現必須碰預設不修改檔，立即停在 Design Gate，說明無法以派生狀態完成的原因；不得把額外狀態偷偷塞進 UI 全域變數。

### 5.2 必過契約

1. fresh `all`：rep `3→2`，只扣一次；不返回同 choice，進承諾段與 C1-1。
2. legacy `all_again`：仍可由舊游標顯示，沿舊 `a1→xa→c1` 修正，不重扣。
3. direct `bounded`：維持 rep `3→4`、`oldPaperScoped=bounded` 與原主線。
4. `fake`：維持 F1，不產生任何 rep 事件。
5. `all` 路在 depart 完成前不得顯示表面成功；完成後只讀既有三張起步紙。
6. steady 未完成前不得顯示反證；完成後不得直接由 NPC 寫出 A3 正解。
7. 只有玩家以合法來源成功提交 A3 `today-comparison`，才生成撤回頁。
8. A3 修復不新增 rep、evidence、flag 或自訂 sourceId；rep 維持 2。
9. 撤回頁不可選為辯論證據；刪掉 A3 或相關原紙時，匯入／顯示不得仍宣稱已修復。
10. bounded 路永不顯示撤回頁或失敗讀回。
11. 重播、重整、合法匯出入前後持久 state 深度相等；情緒演出不重複發獎或扣分。
12. `C3-2/x4`「你不會回來替它辯護」與離章單向性逐字不改。
13. node count、活躍可達與已驗證的 28 個 `legacyOnly` 同步更新；舊游標 fixture
    數量須在 runtime 施工前由現行工作樹即時重數並記錄，不綁死本規格撰寫時的
    71 筆快照；不得為了過計數刪舊節點。
14. JSON／JS 深等、`npm test` 全綠；新增合格檢查各有一個定向變異能使同一測試轉紅。

### 5.3 必做負向控制

- 把 `all.next` 改回 `a1`，branch-lifetime 測試必須紅。
- 移除 depart 表面成功拍，六拍順序測試必須紅。
- 未成立 A3 就硬顯示撤回頁，派生資格測試必須紅。
- 讓撤回頁成為 p2 source，證據所有權測試必須紅。
- A3 後額外 `rep +1` 或 `rep -1`，信譽契約必須紅。
- reload 後再次播放首次撤回並追加事件，冪等測試必須紅。
- bounded 路誤顯失敗頁，路徑隔離測試必須紅。
- legacy 游標已帶 `oldPaperAnswerBlurted=1`，重選 `bounded` 後若誤顯
  `x7_fail`、或看不到現行 `x7` 授權理由，相容測試必須紅。
- 刪除舊 `a1`／`xa` 或使 legacy cursor 不可顯示，相容測試必須紅。

### 5.4 Runtime 人工驗收

自動測試只能證明拓撲與狀態，不能代替體感。Runtime candidate 必須另做：

- 桌機完整全章新局：direct bounded、all fail-forward 各一次；
- 844×390 低高度橫屏：對話 overlay、工作台、撤回頁不遮按鈕；
- 鍵盤：choice、工作台、筆記與關閉返回焦點可達；
- 降低動態：若有劃線動畫，仍可立即看懂原句與撤回內容；
- 總監若執行隔日無提示盲玩，結果另記為體感證據，不冒充自動或獨立驗收。
- 候選台詞凍結前另跑 `check-narrative` 與文字六查；Design Gate 不會自動把
  §3.4 的候選句升格為 canonical。

---

## 6. 淘汰紀錄與剩餘治理債

v1.0 曾把「失敗前進」與「時間回溯」拆成兩個假說；總監親玩後已依題材本體裁定：
玩家說過的話、做過的事與造成的代價必須留在世界裡，因此時間回溯方案永久退出本案。
不得把它改名成筆記翻頁、錨點返回或特殊讀檔後重新引入。

以下工作隨方案一併取消：回復白名單、因果依賴閉包、錨點狀態、私人殘留記憶、
穿越能力擴張及其專屬測試。跨章 save／migration 法源不足是獨立治理債，仍應另案補齊，
但不是第三章失敗前進試點的前置條件。

---

## 7. 施工與停止順序

```text
ADR-016／CH3-CR-031 與本規格對齊
→ 總監審可知性、因果、玩家修復與留痕
   ├─ DESIGN GATE FAIL：重寫指定節拍或台詞；不碰 runtime
   └─ DESIGN GATE PASS：runtime 精確施工
                          → 自動＋瀏覽器＋獨立 CONFORMANCE
                          → 總監實玩裁體感
                          → 才決定是否凍結／發佈
```

停止條件：

- spike 只能靠 NPC 解釋才能讓玩家懂；
- 新增內容超過 90 秒仍沒有更強因果回述；
- 實作被迫新增證據 kind、通用回圈狀態或改 ship 物理；
- bounded 路被迫重走失敗內容；
- 任一舊存檔／舊游標只能靠偽造新事件才能續玩；
- 失敗段仍主要靠 NPC 講解，而不是玩家看見資料、後果並親手修正。

任何一項出現，回到 Gate，不以「先做完再說」越過。

---

## 8. 交付真相

Outcome: Claude 與 Codex 兩案已整合成第三章單一 chapter brief 與 runtime 候選契約；disposable 兩臂 spike 已依 ADR-016 退役，時間回溯已淘汰，可知性邊界與失敗前進由 ADR-014／016 共同治理。

Truth mode: TO-BE。

Target and comparison baseline: 現行 ch3 runtime、Claude v0.1、Codex 原案、雙案 v0.2 與 Claude 複核附記。

Design Gate: disposable spike 不再是 Gate；第三章 runtime `CH3-CR-031` PASS（2026-08-08）。

Implementation: disposable spike COMPLETE；Implementation Gate 尚待獨立審查。Control／Fail-forward 共用同一份 HTML、同一組數據與反例前台詞；歷史檔名保留 `_abc` 以避免另增搬移噪音，正式 runtime 施工未開始。

Files changed: 本規格與 `spike_workshop/spike_ch3_failure_consequence_abc.html`；runtime、schema、evidence、測試與生成鏡像均未修改。

Focused tests: HTML inline script 語法通過；兩版本、降低動態、參與者連結與回述表單契約存在；script 不使用 browser storage、network 或 runtime import；時間返回相關字串與第三臂程式碼為零。帶領者工具預設 `hidden`，只有 `facilitator=1` 才解除；參與者可見文案不含「研究原型」字樣。`none` 與具名記憶的互斥邏輯仍在。實際逐步操作另列 Browser/device，不以靜態檢查冒充。

Full tests: PASS

Full test details: 施工前與施工後皆為 `166 通過,0 失敗`；認知錯誤雙層回饋、ch4 migration（19 groups／205 legacy cursors）及其餘 npm test 後段全數通過。

Registry updated: N-A

Browser/device: NOT RUN。2026-08-08 本輪嘗試啟動 localhost，但系統權限審核兩次逾時；瀏覽器安全策略也正確拒絕 `file://`。因此尚未逐步跑 control／fail-forward、844×390 overflow、操作尺寸、facilitator 切換與 console 檢查；不得沿用三臂舊版的瀏覽器 PASS。

Accessibility: 靜態檢查可見地標、標題、對話 log、圖像 title／desc、資料表、aria-live、焦點 outline 與 `prefers-reduced-motion` CSS；鍵盤流程、低高度實際尺寸及系統偏好切換仍隨 Browser/device 待驗。

Independent review: Claude 對 v0.2 的附記已確認真收斂並列四項殘餘；本規格已逐項吸收。v1.2.0 的可知性與 Gate 改制仍待 Fable 5 對成品做 CONFORMANCE。

Human playtest: NOT RUN；依 ADR-016 不再是施工 Gate。隔日自行盲玩與發佈前 2–3 人非正式體驗均為可選。

VCS: 未 stage、未 commit。

Release: NOT RUN。

Production smoke: N-A。

Known gaps: runtime 尚未施工；跨章 save 法源仍缺；候選台詞尚未經 `check-narrative`、文字六查與 Fable 5 CONFORMANCE 凍結。

Preserved foreign WIP: 既有 runtime 與其他未提交文件均未修改。
