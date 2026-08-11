---
bd_artifact: preflight-review
bd_chapter: ch7
bd_status: conditional-go
bd_mode: TO-BE
bd_lane: R3
bd_work_package: WP-CH7-EM1-PREFLIGHT
---

# 第七章 EM1｜Galvani × Volta：可施工性與史實風險複核

**日期**：2026-08-09
**審查者**：GPT-5.6 Sol
**輸入**：`02_設計/發現之前_第七章題材確認單_EM1_Galvani與Volta_Fable_20260809.md`
**結論**：**題材 CONDITIONAL GO；可進 chapter-brief＋provenance，尚不可進劇本或 runtime。**

## 一、總判斷

建議確認 **CH7＝EM1（Galvani × Volta）**。它能承接第六章 1798 的時間位置、打開電磁長線，也天然適合《發現之前》的核心玩法：玩家不是挑一位「答對的科學家」，而是靠改變接線、材料與生物組織的位置，逐步發現**同一個「腿踢了一下」在不同配置中不是同一種證據**。

Fable 的戲劇核心「兩邊都不是笨蛋」成立；但現候選把它收束成「兩種來源都在、青蛙同時是電源與偵測器」，仍太像預先給答案。更強、也更科學的章法是：**先讓青蛙成為一件有歧義的儀器，再用不同配置拆開它在各場實驗中的角色。**

## 二、分級問題

### A-1｜跨章機構日期錯誤，必須修正

候選稿寫「ch6 朗福德 1798 創立皇家研究院」。皇家研究院官方史料記載：1799 年 3 月 7 日於 Joseph Banks 的 Soho Square 住處成立，1800 年取得皇家特許；Humphry Davy 於 1801 年任實驗室主管。第六章的 1798 是朗福德砲膛實驗所在年份，不是皇家研究院成立年份。

**修法**：接縫改為「1798 砲膛實驗留下工程與熱的問題 → 1799 皇家研究院成立 → 1800 Volta 致 Joseph Banks／皇家學會的信」。不得寫成 Volta 把信寄到皇家研究院；信的收件者與公開場所是 Joseph Banks／Royal Society。

### A-2｜「單金屬＝弱且不穩」不能成為固定 fixture

候選工作台第 2 步預寫「單金屬對照……踢得弱且不穩」。史料顯示 1794 年的單金屬弧在特定接觸配置下可以造成有力收縮；結果受金屬接點、神經／肌肉位置與組織狀態影響。若引擎把「同種金屬」直接映射成弱反應，玩家得到的不是控制變因，而是假定答案。

**修法**：fixture 的權威由完整配置決定，不得只讀 `metalCount` 或 `sameMetal`：

- 材料種類；
- 兩端接觸的組織位置；
- 是否形成閉合路徑；
- 樣本狀態與可重複性。

「弱／強／無反應」只能是一次具名配置的觀測，不是某一理論的固定徽章。

### A-3｜「青蛙腿同時是電源與偵測器」過度概括

這句可作章末對歷史爭論的現代回望，不能當所有實驗的共同真相。雙金屬回路中，製備過的青蛙可主要作為濕導體與靈敏反應器；無金屬的神經—肌肉配置則支持生物組織自身存在電生理現象。把兩者壓成一句「同時」會抹掉本章最重要的配置差異。

**修法**：章末只允許玩家寫到證據所及，例如：「這隻腿在不同接法裡，扮演的角色不相同；金屬接觸能產生可測的電效應，神經與肌肉本身也有不能刪掉的電現象。」不得讓工作台或 NPC 宣判「兩種電源總是同時存在」。

### B-1｜「各對一半」宜保留為戲劇框，不可作答案判定

Galvani 與 Volta 都抓住了可延伸成重要學科的現象，但不代表兩套原理各占同一現象的 50%。遊戲應判讀「這句主張在哪些配置中撐得住」，而非判定玩家是否選了折衷答案。

### B-2｜《兩種電》只宜作工作名

它抽象、像課本章名，也提前暗示「正解是兩種」。正式章名依命名原則應來自玩家碰過的物件與矛盾。brief 階段可從「會踢的腿／兩端之間／沒有青蛙的電」等意象另提 3–5 案。

### B-3｜時間接縫可以成立，但要分清兩個倫敦機構

Royal Society／Joseph Banks 是 Volta 1800 信件的公開端；Royal Institution 是 1799 後逐步成形、日後承接 Davy 電化學工作的機構。兩者可以在章際長線互相照亮，不能合併成同一地址。

## 三、修正後的案件骨架（供 Fable 寫 brief，不是劇本定稿）

### 3.1 本章一句話

玩家與 Galvani／Volta 反覆改接一隻會踢的蛙腿；每當有人急著把一次反應寫成唯一原因，下一種配置就迫使那句話縮小適用範圍。

### 3.2 主要新動詞與畫面

- **唯一主要新動詞**：接線／閉路。玩家拖動的是「哪兩端接到哪裡」，不是點選理論答案。
- **唯一主要視覺**：實驗矩陣。橫軸是材料與接法，縱軸是接觸位置、是否閉路與反應；每格保留實際觀測與樣本狀態。
- **資源**：不新增「電量條」。若需要消耗，只沿用時間／樣本準備成本；電不是可隨意花掉的遊戲貨幣。

### 3.3 五步工作台弧

1. **建立基準**：用已知外部電刺激確認蛙腿製備仍會反應，先分清「儀器壞了」與「接法沒效應」。
2. **雙金屬閉路**：改變金屬與接點，重現有力收縮；只允許記「這個配置出現反應」。
3. **同材質／接點對照**：保留完整配置資訊，不預寫弱或無反應；重複後才談穩定性。
4. **無金屬反例**：以史料可證的神經—肌肉接觸配置，讓「金屬是唯一來源」失去全稱資格。
5. **離開蛙腿**：以 Volta 的非動物檢測與伏打堆，讓「生命組織是電效應必要條件」失去全稱資格。

這五步應是**同一座工作台逐格長出的證據矩陣**，不是五個各自開關的 embed。玩家每次只改一個可辨識條件，上一格的紙與錯句留在桌上。

### 3.4 一個承重岔口

本章只養一個 F2 承重岔口：玩家在矩陣尚未完成時，決定是否替一個**排他性因果主張**署名，例如「收縮只可能來自金屬」或「收縮只可能來自動物」。

- **立即反應**：科學家只能指出控制尚未做完，不能預告真假。
- **失敗前進**：署名句不被系統擋回；信件／公開示範照樣往前，後續反例在世界中點名它。
- **修復**：玩家在原紙上劃限縮線、補條件，不能換一張乾淨答案紙。
- **成功路也有戲**：不肯過早排他的玩家，必須提出下一個能區分模型的配置；不是免費跳過後果。

誠實押錯不扣 rep。只有把未完成矩陣宣稱成「已證明」、藏掉反例或改寫原紀錄，才構成資格／研究誠實事件。

### 3.5 ADR-016 可知性四欄

| 欄位 | 本章填法 |
|---|---|
| 當下誰知道什麼 | Galvani 掌握組織製備與收縮；Volta 掌握材料接觸與電學儀器；旅人知道後世方向，但沒有可交付給 1790 年代現場的證據。 |
| 當場最多能反駁到哪 | 只能反駁「你的對照已做完／這一格已證明唯一原因」等資格主張；不能憑立場裁定電的本性。 |
| 還缺哪個證據 | 無金屬反例、非動物檢測、跨配置重複與閉路控制。 |
| 在哪一場揭曉 | 1794 前後的無金屬配置，以及 1799–1800 的伏打堆／信件公開；兩次揭曉分別打掉兩種全稱。 |

## 四、證據成品與美術路由

- **實驗矩陣、署名主張、限縮痕跡**：玩家狀態卡，必須由封存的 deterministic state 完整繪製；不得用一張固定 raster 假裝所有人的接線與結論。
- **原始出版頁、信件、固定史料摘要**：取得後可走固定 raster，但需 provenance 與 Art Gate，文字版不得依賴 OCR。
- **伏打堆**：探究中焦點圖可用生成圖；若圖上層數量或材料順序是玩家狀態，就必須回到程式製圖，不能生成單一世界線。

## 五、runtime 影響地圖（本輪只盤點，不施工）

CH7 不是新增一份 `scenes7.json` 就能上線。現行程式多處把六章寫成封閉集合：

- `greybox/src/stage/01-core.part.js:18`、`greybox/src/narrative.js:19`、`greybox/src/stage-ui.js:18` 只接受 `ch1`–`ch6`；
- `greybox/src/save-envelope.js:29` 的 envelope 章號白名單同樣只到六；
- `greybox/src/chapter-ui.js:238` 的 sanitizer dispatch 只到 `sanitizeImport6`；
- `greybox/stage.html:3163-3208` 的引擎／場景載入、章節分派與 save key 只到第六章；
- `greybox/src/stage-ui.js` 是組裝產物，不能直接把硬編碼補成 7，應改 partial／registry 的來源再重建。

正式施工至少需要：

1. `scenes7.json` canonical＋生成鏡像；
2. `engine7.js` 與 deterministic fixture；
3. `sanitizeImport7`、save envelope／schema 契約與 legacy 負向測試；
4. stage／narrative／chapter registry、入口選章與第六章「下一章」；
5. 工作台、讀屏文字版、證據成品 resolver；
6. builder、靜態掃描、migration、runtime、瀏覽器與 mobile 驗收。

**架構建議**：不要再把第七章逐處塞進 `ch[1-6]` 鏈。CH7 的實作 CR 應先建立共用 chapter registry，讓載入器、save envelope、選章 UI 與下一章路由讀同一份章節權威；否則第八章會重付同一筆債。

## 六、工作包與 Gate

### WP-CH7-EM1-PREFLIGHT

| 欄位 | 內容 |
|---|---|
| Mode / Lane | TO-BE / R3 |
| 目的 | 確認題材資格、史實邊界、主要動詞與 runtime 成本 |
| 作者／戲劇目的 | Fable 5 |
| 可施工性／狀態審查 | GPT-5.6 Sol |
| 裁決 | 總監 |
| 本輪持有路徑 | 本複核報告；不改 Fable 題材確認單，不動 runtime |
| 明確不做 | 不寫正式台詞、不立 fixture 真值、不做存檔 schema、不生圖 |

### 建議裁決句

若總監接受題材與上述三項 A 級修正，可批：

> `TOPIC GATE: PASS — CH7 = EM1 Galvani × Volta；依 Sol A×3 修正後開 chapter-brief＋provenance`

此 Gate 只授權 Fable 產出 chapter-brief 與 provenance sidecar。brief 通過 Design Gate 後才進劇本；劇本凍結後由 Sol 立 implementation CR；runtime 仍需另一次 `DESIGN GATE: PASS`。

## 七、主要史料

- [Royal Society｜Volta 致 Joseph Banks 信（1800-03-20；1800-06-26 宣讀）](https://makingscience.royalsociety.org/items/l-and-p_11_137/letter-account-of-electricity-excied-by-contact-and-conducting-substances-of-different-kinds-from-alessandro-volta-to-joseph-banks?page=1)
- [Smithsonian Libraries｜Volta 1800 原始論文／伏打堆](https://library.si.edu/digital-library/book/onelectricitye9021800volt)
- [Smithsonian Libraries｜Galvani《De viribus…》原典](https://library.si.edu/digital-library/book/aloysiigalvanid00galv)
- [Royal Institution｜官方機構史](https://www.rigb.org/about-us/our-history)
- [Bologna／INFN｜Galvani 無金屬與單金屬實驗時間線](https://www.bo.infn.it/galvani/cultura-estero/latin-america/pannelli/c2.html)
- [Bologna／INFN｜Galvani 雙百年導覽（單金屬配置）](https://www.bo.infn.it/galvani/piccola-guida-galvaniana/)
- [Comptes Rendus Biologies｜Galvani 1791 模型與金屬弧的歷史分析](https://comptes-rendus.academie-sciences.fr/biologies/articles/en/10.1016/j.crvi.2006.03.002/)

---

**收口**：CH7 題材值得做；現階段最重要的不是多寫一章，而是把「兩種理論」改寫成「不同配置對不同主張有什麼判決」。三項 A 級修正入 brief 後，這章會是六章累積的新法第一次從零長成玩法，而不是把舊考卷換成電學題。
