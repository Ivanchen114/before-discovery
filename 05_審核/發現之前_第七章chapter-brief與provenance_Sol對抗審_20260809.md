---
bd_artifact: adversarial-review
bd_chapter: ch7
bd_status: changes-requested
bd_mode: TO-BE
bd_lane: R0
bd_work_package: WP-CH7-EM1-BRIEF-REVIEW
---

# 第七章 Chapter Brief＋Provenance：Sol 獨立對抗審

**日期**：2026-08-09
**主審稿**：

- `02_設計/發現之前_第七章chapter-brief_EM1_Galvani與Volta_v0.1_Fable_20260809.md`
- `02_設計/發現之前_第七章provenance_sidecar_EM1_v0.1_Fable_20260809.md`

**真相模式／Lane**：TO-BE／R0 唯讀審查
**總裁決**：**CHANGES REQUESTED——A×3、B×3、C×2。題材維持 GO；brief 尚不可升 `design-gate-passed`。**

## 一、先確認通過的部分

Sol 上輪 A×3 已實質吸收：

1. 皇家研究院修為 1799，並與 Royal Society／Volta 致 Banks 信分開；
2. 撤回 `sameMetal→弱`，改由材料、接點、閉路與樣本狀態共同決定；
3. 撤回「青蛙一律同時是電源與偵測器」，改為配置限定的角色判讀。

新增史實也成立：Galvani 於 1798 年 12 月 4 日逝世；1800 年 3 月 20 日的 Volta 信與 6 月 26 日宣讀皆可由機構史料追查。核心新動詞「接線／閉路」、單一長成式矩陣、誠實押錯不扣 rep，以及《一隻腿的證詞》都值得保留。

## 二、A 級——Design Gate 前必修

### A-1｜§七案甲與本章核心機制互相排斥

**位置**：brief 34、38、52–53、66 行。
**實際證據**：五步弧把伏打堆列為第⑤步；F2 宣稱兩種排他主張都有後續反例；案甲卻把伏打堆移到史實頁，玩家在 runtime 完全不摸。
**因果問題**：若採案甲，「只可能來自動物」在本章內沒有世界後果，雙向失敗前進退化成單向；「成功路提出下一個可區分配置」也失去最後一次支付。這不是尾聲口味差異，而是刪除半個主機制。
**直接修法**：本版 brief 應以**案乙為唯一結構基線**；案甲改列「替代縮編案——若採用，必須另改 brief、岔口與 mechanics contract，不得在同一 Design Gate 直接切換」。Galvani 之死只放在工作台完成後的短尾聲，不承擔科學高潮。
**失敗條件**：若玩家走「動物是唯一來源」後直到完章仍未親手取得非動物電效應，F2 不成立。

### A-2｜伏打堆改了量測對象，不能直接裁決目前那句主張

**位置**：brief 34、38、52–53、58 行。
**實際證據**：前四步的可見結果是「蛙腿是否收縮」；第⑤步改成「伏打堆是否產生電效應」。但署名句寫的是「**收縮**只可能來自金屬／動物」。
**因果問題**：伏打堆能反駁「所有電效應都需要生命組織」，卻不能單獨證明「這一次雙金屬蛙腿收縮的電從哪裡來」。目前設計在最需要控制變因的地方，同時換掉裝置、樣本與觀測欄；玩家不是被同一批證據打臉，而是被系統換題。

史料本身已提供缺的橋：1796 年 Volta 使用 condenser electrometer，移除蛙作為偵測器，觀察不同金屬接觸造成的電不平衡；1799 年末再做成伏打堆。

**直接修法**：

1. 實驗矩陣明分兩個 observable：`frog_response` 與 `non_animal_detector`；
2. 在伏打堆前加入「雙金屬＋condenser electrometer」橋接格，證明不靠蛙也能讀到接觸電效應；
3. 排他性署名不得混用「收縮來源」與「所有電的來源」。改成兩個有範圍的主張，例如：
   - M：`這批配置已證明，金屬接觸是所有收縮所需電效應的唯一來源。`
   - A：`這批配置已證明，任何可持續的電效應都必須由生命組織提供。`
4. 每句各自綁定可見欄位與 `refutedBy.relation`；不能靠另一個較寬／較窄命題代打。

**失敗條件**：拿掉 electrometer 橋接格後，若玩家仍能只靠伏打堆判定 M 的真假，契約必須轉紅。

### A-3｜主要實驗尚無 schema v2 mechanics contract

**位置**：brief 29–53 行；整包缺件。
**實際證據**：brief 已定義主要工作台、F2 承重岔口與 evidence judgment，但沒有 `mechanicalSpine`、`decisionRegistry`、`supportedBy/refutedBy`、成功／失敗留痕契約。現行敘事法源 §9.5 明定主要探究段必須在 Design Gate 先人工審查 schema v2 contract。
**因果問題**：現在只能看出「想做什麼」，不能證明拿掉解說後玩家仍親自完成問題→承諾→操作→留痕→判讀→阻力→成功／失敗。尤其 A-2 的換題問題，正是 contract 應在施工前暴露的。
**直接修法**：由 Fable 補一份 TO-BE mechanics contract，至少包含：

- 一段完整八拍 `mechanicalSpine`；
- F2 的兩個排他主張與謹慎路；
- 每個科學判斷的 `decisionRegistry`；
- 可見來源欄位與 `supportedBy/refutedBy`；
- 失敗保留原始署名與矩陣痕跡；
- `binding` 明示未有 `scenes7.json`，機械執行狀態為 `BLOCKED_NO_CANONICAL_SCENES`，不得冒充 PASS。

**失敗條件**：刪除署名、玩家操作、玩家判讀或失敗留痕中的任一拍，人工 contract review 必須失敗。

## 三、B 級——同輪修正

### B-1｜Provenance W1 已有部分答案，必須拆成兩件事

**位置**：sidecar 20、26 行。
**實際證據**：已查證列第 6 筆引用的 Bologna／INFN C2 頁，已明載 1794 年 Galvani 以單金屬弧，或讓 crural nerve 直接接觸肌肉，皆能造成收縮；同頁另談後來的「兩條蛙腿只以神經相接」最後實驗。
**因果問題**：W1 把「1794 無金屬神經—肌肉」與「後期兩神經實驗／致 Spallanzani 信」揉成一筆，因此核心第④步一面宣稱可用、一面仍待查。
**直接修法**：

- P7（移入已查證）：1794，Galvani，直接神經—肌肉接觸、無金屬弧；作為工作台第④步。
- W1b（繼續待查）：兩蛙腿／兩神經最後實驗的確切日期、信件、逐字描述；只供史實頁或後續場景。

**失敗條件**：若工作台美術或 fixture 混用兩種配置，provenance 不合格。

### B-2｜「Volta 起初接受」在已查證與待查欄互相打架

**位置**：brief 18、27 行；sidecar 16、27 行。
**實際證據**：已查證列第 2 筆寫「由重複實驗轉為反對」，W2 又把「起初接受」列待查；Bologna C1 能支持「閱讀、重做、後來改變解釋」，未必足以支持他曾正式接受 Galvani 的動物電模型。
**因果問題**：人物弧把未確認的心理／立場強度升成事實。
**直接修法**：W2 收口前，brief 改成「Volta 讀到結果、重做實驗，隨後改變對現象的解釋」；只有找到同期書信／發表證據後才使用「曾接受動物電」。
**失敗條件**：劇本若讓 Volta 說出或承認自己曾相信 Galvani 的完整模型，卻無同期來源，查證失敗。

### B-3｜人物分工有戲，但兩個比喻都越過 provenance

**位置**：brief 27 行。
**實際證據**：「把解剖桌當祭壇」「凡是真的就能離開生命被做出來」是強烈作者詮釋，sidecar 尚無人物聲線、宗教觀與方法論來源。
**因果問題**：前者容易把虔誠寫成神祕主義，後者把 Volta 塑成機械論宣言者；都可能讓「兩邊不是笨蛋」重新變成兩張整齊的理念牌。
**直接修法**：保留為作者內部比喻，但加 `interpretive-characterization` 標記與史料需求；brief 的可執行人物功能先寫成「Galvani 守住組織配置的差異／Volta 堅持把效應移到非生物儀器上重現」。
**失敗條件**：任何成品台詞直接說出這兩句理念，而不能由人物行動與史料支持，人物審查失敗。

## 四、C 級——不擋修稿

1. **章名**：建議直接鎖《一隻腿的證詞》。它同時指向物件、證據歧義與系列母題；《兩種電》會洩露折衷答案，《沒有青蛙的電》洩露末段。
2. **尾聲句**：「只有一邊活著聽到掌聲」暫勿進台詞。它暗示伏打堆已裁決整場爭論且得到即時、單向承認；可降為「旅人手裡有一封想拿給 Galvani 看、卻找不到收件人的信」。讓缺席成餘波，不搶科學高潮。

## 五、建議收法與 Gate 狀態

我支持**案乙的時間跨度、案甲的克制音量**：玩家必須親手走到 1800，完成 non-animal detector→伏打堆的證據鏈；科學高潮是玩家限縮自己的署名，Galvani 的缺席只在其後一到三拍回響。這樣既保住雙向岔口，也不搶 Maxwell→Hertz 的死亡主題首發。

本輪不可簽 `DESIGN GATE: PASS`。Fable 修正 A×3、B×3 並交 mechanics contract 後，Sol 再做一次窄複核即可；無須重審題材。

正式流程仍缺總監的題材落檔句：

> `TOPIC GATE: PASS — CH7 = EM1 Galvani × Volta；依 Sol A×3 修正後開 chapter-brief＋provenance`

該句只補齊題材授權，不會自動把現行 brief 升成 Design Gate PASS。

## 六、查證依據

- [University of Bologna｜Galvani 生平與 1794 無金屬實驗](https://www.unibo.it/en/university/who-we-are/our-history/famous-people-and-students/luigi-galvani)
- [Bologna／INFN C2｜1794 無金屬、1796 condenser electrometer、1799 pile](https://www.bo.infn.it/galvani/cultura-estero/latin-america/pannelli/c2.html)
- [Bologna／INFN C1｜Volta 重做實驗並改變解釋](https://www.bo.infn.it/galvani/cultura-estero/latin-america/pannelli/c1.html)
- [Royal Society｜Volta 致 Joseph Banks 原件](https://makingscience.royalsociety.org/items/l-and-p_11_137/letter-account-of-electricity-excied-by-contact-and-conducting-substances-of-different-kinds-from-alessandro-volta-to-joseph-banks?page=1)

## 七、交付狀態

Outcome: CHANGES REQUESTED（A×3、B×3、C×2）
Truth mode: TO-BE
Target and comparison baseline: Fable chapter-brief v0.1＋provenance sidecar v0.1；比較 Sol preflight 與現行法源
Design Gate: NOT RUN
Files changed: 僅新增本審查報告；Fable 正本零修改
Focused tests: router `SOURCES_ROUTED`（ch7 仍 unregistered／review only）；史料逐項網路複核
Full tests: PASS（173 通過、0 失敗；ch4 migration 19 groups／205 legacy cursors）
Registry updated: N-A
Browser/device: N-A（唯讀文件審查）
Accessibility: N-A
Independent review: 本報告即 Sol 獨立對抗審
Human playtest: N-A
VCS: 未 stage、未 commit
Release: N-A
Production smoke: N-A
Known gaps: A×3、B×3；ch7 canonical scenes 尚不存在，mechanics guard 應維持 BLOCKED
Preserved foreign WIP: YES；未修改 Fable brief、sidecar 與其他大量 dirty files
