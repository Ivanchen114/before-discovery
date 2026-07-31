# CH3 runtime＋CH4 v0.8 B1–B3 修正暨定點複審交付

**交付者**：Sol／Codex  
**日期**：2026-07-29  
**交付對象**：Claude 獨立 CONFORMANCE  
**真相模式**：CONFORMANCE（核准的 CH4 v0.8／Claude 第一輪 B-1～B-3，對照目前 runtime）  
**本輪結論**：B-1、B-2、B-3 均已在本機工作樹完成並通過定點、全套與實際瀏覽器驗收；尚未 commit、push、部署，也尚未由總監真人試玩。

---

## 一、Claude 三條意見的處分

### B-1｜1665 年月距人物時代錯置

- `greybox/data/scenes4.json` 的 1665 年台詞已為「托勒密寫 59；**溫德林寫 60**」。
- runtime lint 同時要求存在「溫德林寫 60」且不存在「惠更斯寫 60」。
- 正式 v0.8 稿與 runtime 兩邊都有同一條守衛，不再只修史實頁、漏掉演出。

**請 Claude 覆核**：全 repo 受審範圍內的 1665 月距台詞不得再命中「惠更斯寫 60」。

### B-2｜A-5 九宮格缺契約

- `greybox/tests/run-node.mjs` 已逐格執行 3 種速度 × 3 種改向力度。
- 僅 `slow/short`、`medium/medium`、`fast/long` 可同時符合近圓標籤與數值半徑條件。
- 其餘六格必須留下可讀的非近圓後果，不得靜默被歸成成功。
- 契約鎖的是引擎行為與數值，不是只 grep 五個常數；先前已用暫時改動係數做過反向轉紅，復原後才計入通過。

**請 Claude 覆核**：九格必須完整跑完；任一相配格失去近圓、或任一錯配格冒充近圓，都要轉紅。

### B-3｜第四章工作台缺立繪對話框橋

- `greybox/src/chapter-ui.js`：七個 CH4 embed phase 都經 `sayIntoDialogue`；模擬結果改由牛頓立繪台詞回報，不再只塞工作台內文。
- `greybox/src/stage/05-events.part.js`：D1-2 必須等玩家跨過 embark 閘門才播教練句。
- `greybox/stage.html`：播話時保留工作紙並向上讓位；`held` 不再把 ship／lab／orbit 工作台藏掉。
- `greybox/src/stage-ui.js` 已由 12 個 part 重建，與來源串接一致；SHA-256：
  `df9101a7981dee836aee2814db7da02f366b0175a4838c0e36d73a8a5e7afe97`。
- 自動契約是 **source-level bridge contract**；另以實際瀏覽器走 D1-2 補足事件、立繪、queue 與 ack，不把字串測試冒充 E2E。

### 實際瀏覽器定點結果（844×390）

測試入口：`greybox/stage.html?chapter=ch04`，匯入合法 D1-2／q3 狀態後由玩家按「攤開兩張紙開始對帳」。

- 閘門前沒有提前播牛頓教練句。
- 跨閘門後：Newton 對話為「先別替它命名。把兩張紙換成同一把尺。」
- 工作台與對話框同時可見，重疊量 0。
- orbit select 實測高度 44px；頁面與 controls 水平溢出均為 0。
- 牛頓肖像載入成功：`public/assets/ch04/characters/ch04_char_newton22_v03.webp`，natural size 900×1200。
- 玩家 ack 後對話框消失、工作台恢復完整高度，操作按鈕可用。
- 瀏覽器 console：0 error、0 warning。

---

## 二、完整回歸結果

- `cd greybox && npm test`：130 通過、0 失敗。
- CH4 migration：19 groups passed；205 legacy cursors covered。
- CH4 art：12 場背景、3 肖像、8 特寫、5 證據圖、3 focus、SVG 疊圖與 BGM 契約通過。
- CH3 仍為 10 場、209 節點，全可達；本輪沒有重做或改寫第三章資料。
- `git diff --check`：本工作包相關路徑無 whitespace error。

---

## 三、生圖判斷

本輪**沒有新增生圖**。理由不是能力不足，而是 CH4 美術契約已完整通過，B-3 實際需要的是既有牛頓肖像、事件橋與版面讓位；再生一張圖不會修正機械問題，只會製造重複資產。

但 release 前仍須處理資產追蹤：至少下列三張 runtime focus WebP 與三張 source master PNG 尚在未追蹤目錄中。

- `public/assets/ch04/focus/ch04_focus_drawer_closes_1665_v01.webp`
- `public/assets/ch04/focus/ch04_focus_mountain_cannon_v01.webp`
- `public/assets/ch04/focus/ch04_focus_newton_orbit_montage_1679_v01.webp`
- `art/source/production/ch04/focus/ch04_focus_drawer_closes_1665_master_v01.png`
- `art/source/production/ch04/focus/ch04_focus_mountain_cannon_master_v01.png`
- `art/source/production/ch04/focus/ch04_focus_newton_orbit_montage_1679_master_v01.png`

這是 VCS／release 包裝阻擋，不是目前 B-1～B-3 的本機行為阻擋；而且工作樹另有其他未追蹤 CH4 美術目錄，commit 前須逐件盤點，不可只加入這六張後就宣稱資產齊備。

---

## 四、交付狀態

Outcome: IMPLEMENTED；等待 Claude 定點 CONFORMANCE

Target and comparison baseline: CH4 v0.8 runtime 對照 Claude B-1～B-3

Design Gate: PASS（沿用已核准 v0.8 與 WB-CR-025b）

Files changed: `scenes4`、`engine4`、CH4 migration、`chapter-ui`、stage parts／生成物、`stage.html`、相關契約測試

Focused tests: B-1 時代守衛、A-5 九宮格、B-3 對話橋反向轉紅與 844×390 實際路徑均通過

Full tests: PASS（130/0）

Registry updated: N-A

Browser/device: PASS（本輪定點為 CH4 D1-2、844×390；非全章真人試玩）

Accessibility: 44px 控件與無水平溢出通過；本輪未另做完整讀屏巡檢

Independent review: PENDING（Claude）

Human playtest: PENDING（總監於 Claude 放行後試玩）

VCS: UNCOMMITTED；未 stage、未 push

Release: NOT AUTHORIZED

Production smoke: NOT RUN

Known gaps: 未追蹤 runtime／美術／遷移檔仍會阻止正式 release；總監真人試玩尚未進行

Preserved foreign WIP: 未 reset、checkout、刪除或批次 stage 共享工作樹

