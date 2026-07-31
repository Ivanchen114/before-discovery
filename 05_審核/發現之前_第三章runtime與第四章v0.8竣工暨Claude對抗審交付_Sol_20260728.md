# 第三章 runtime 與第四章 v0.8 竣工暨 Claude 對抗審交付

**施工／複驗**：Sol / Codex  
**日期**：2026-07-28  
**交付對象**：Claude（獨立對抗審）  
**狀態**：兩章已進 runtime、自動測試與瀏覽器驗收通過；本文件送 Claude 作最後一道獨立審門。總監試玩仍排在 Claude 放行之後。

---

## 一、結論

### 第三章

- executable canonical 為 `greybox/data/scenes3.json`。
- 現況為 **10 場／209 節點**，209／209 可達，零斷鏈，JSON／JS 鏡像一致。
- 舊版 71 個可追溯游標皆保留；本章只插入新節點、不改舊節點 id，**不需要存檔遷移**。
- 新幕間背景、BGM、正式劇本路由、接縫逐字契約與原先測試死區均已修正。
- 844×390 實機回看第三章航船卷宗：雙欄、原紙、操作入口與頂列皆可見，無橫向溢出。

### 第四章

- executable canonical 為 `greybox/data/scenes4.json`。
- 現況為 **12 場／287 節點／7 個互動閘門**，287／287 可達，零斷鏈。
- 存檔升為 **schema 2**；schema 1 的 **205 個合法舊游標**逐一覆蓋。
- 證據順序已實作為 `K0 來源紙 → K2（1665）→ K1（1679）→ K3 → K4 → K5`。
- K0 是玩家封存的來源紙，不冒充第六份證據；章證據仍只有 K1–K5。
- D1-2／D1-3 原多步作圖已完整搬到 **1679-11-24 虎克首信之後**；1665 只留切線預測、同尺紙與未解的地心問號。

目前沒有已知未處理的 A／B 級問題。這句只代表 Sol 這輪的結論，不替代 Claude 的獨立審查。

---

## 二、4A 場景重排已完成

| 年代／場 | runtime 功能 | 邊界 |
|---|---|---|
| 1665 D0-2 | 果園入場考 | 牛頓先自報姓名；旅人不預知人物，也不提前餵山頂大砲或「持續偏離切線」框架 |
| 1665 D1-1 | K0 切線來源紙 | 玩家三選一封存；不授證 |
| 1665 D1-2 | K2 同尺紙 | 先封量級，再換算、比刻痕、命名 `60 × 60`；依晚年回憶之合理重建、無存世 1665 計算紙 |
| D-INT-1 | 十四年幕間 | 紙進抽屜，玩家親手翻到 1679 |
| 1679-11-24 D2-1 | K1 多步作圖 | 虎克首信先把兩支箭放進同一問題；玩家封四項、親手三拍，牛頓續二十七拍 |
| 1680-01-06 D2-2 | 虎克第二封信 | 明列平方反比猜想；本場不授證 |
| 1684–1686 | K3／K4 | 封存預測、彗星接軌、逐格蓋章、玩家決定借條 |
| 1686–1687 D4-2 | K5 印刷台 | 六槽、球殼頁、雙信精確歸功、四項信用、誠實邊界、旅人親手退出作者欄 |

虎克的 runtime 正解現為：

> 虎克在 1679 年把切線運動與向中心吸引放進同一個問題，1680 年又提出平方反比猜想；牛頓完成數學證明、球體處理與跨天體整合。

---

## 三、4B schema 1→2 與狀態真相

### 遷移

- 遷移發生在 `Narrative.loadSave` 與 sanitizer **之前**。
- local save、raw JSON、書信碼三條入口共用相同流程。
- 原始 schema 1 文字逐字備份；失敗有可讀原因，不靜默重開。
- 205 個舊 `(scene,node)` 游標全部來自凍結 fixture。
- K2／K3 只有在舊游標真的越過各自 embed 里程碑時才可攜帶。
- sanitizer 會重算：
  - `originalCursor`
  - 舊里程碑
  - `sourceEvidence`
  - `reacquire`
  - deterministic target scene／node
  - `baseSequence`
- 遷移後需重做 K0 的合法路徑仍可繼續，不會被 provenance 守衛誤殺。

### 玩家操作真相

- K1：四項未封不能落第一拍；每拍重對；舊錯拍留在 `manualAttempts`；牛頓只在玩家三拍成立後續畫。
- K2：量級、換算、倍率、關係四層各有自己的失敗紀錄與時間序。
- K3：火星／木星先封存後揭露；兩筆齊全才授證。
- K4：原始模型結果不含固定 `patches`；蓋章、借條、拒借與列順序都由玩家狀態生成。
- K5：六槽、球殼頁、虎克範圍、四項信用、作者欄、邊界與送樣均不可由系統代做。
- archive：K5 成立後才可逐張夾回；開始歸檔後，前段證明狀態鎖定。

### 對抗補強

本輪另用合法存檔變異重現並封住：

1. 未越過舊 embed 卻攜帶 K2／K3。
2. 偽造 migration `originalCursor`。
3. 241 字延後理由產生不可再匯入的死存檔。
4. `placeProofLink(slot, "FORGED")` 寫入未知來源。
5. `manualAttempts`／`ruleRuns` 倒序洗歷史。
6. 任意改寫 `attempt`／`days`。
7. 竄改 K0、K1、K2、K3、K4、K5、proof snapshot、press event、claim provenance、baseSequence suffix 與 archive 時序。

---

## 四、文字與史實紅線修正

### 人物與虎克坑

- 牛頓自報姓名前，旅人只看到「先看凹痕、再撿果子」的陌生年輕人。
- 1665 旅人只說前章親手做過的邊界：「放手不會拿走原有的前進」；沒有砲、沒有弧線速度提示、沒有「一路被扳彎」。
- 首信日期完整落為 `1679-11-24`；第二封完整落為 `1680-01-06`。
- 正式稿、runtime 場景、K5 選項與 runtime 史實頁已同步。

### 月距版本

命題號固定為《Principia》第三卷命題 IV、定理 IV。

- 1687 初版：多數天文家 59、Wendelin 60、Copernicus 60⅓、Kircher 62½、Tycho 56½。
- 1726 第三版：Ptolemy／多數 59、Wendelin 與 Huygens 60、Copernicus 60⅓、Street 60⅖、Tycho 56½，並補折射校正約 60½。

runtime 史實頁與 v0.8 正式稿已改為兩版並列，不再把第三版清單冒充 1687 印本。原典核對：

- [1687 拉丁文初版，第三卷命題 IV](https://la.wikisource.org/wiki/Philosophiae_Naturalis_Principia_Mathematica/Liber_III)
- [第三版傳本英譯，命題 IV](https://en.wikisource.org/wiki/Page:Newton%27s_Principia_%281846%29.djvu/397)

### 山頂大砲

- 現在演在 1679 虎克首信後，不再寫成 1665。
- 史實頁明說：成熟圖像見於牛頓後來的《世界體系》手稿並於 1728 年出版；沒有史料證明他在本章所演的 1679 通信後立即說出或畫出該圖。
- 它是揭露過的概念前移，不作 1679 新證據。

### 其他待核項

- 球殼頁：第一卷命題 LXX／LXXI／LXXIV；「1686 放上印刷台」只作排版演出。
- 雷恩：措辭維持「兩個月內交出令人信服的證明，可得一本值四十先令的書」，不是「四十先令賞金」。[Newton Project 收錄的 Halley 回述](https://newtonproject.ox.ac.uk/view/texts/diplomatic/OTHE00089)
- 魚書：只說《Historia Piscium》的製作成本使 Royal Society 財務吃緊、影響出版安排；不捏造耗盡比例。[Royal Society 的 Principia 館藏說明](https://royalsociety.org/blog/2014/07/principia/)
- 攪茶先承認漩渦說的解釋力，再限制只測一個規則寫死的簡化版本。
- 磁石只借「隔空、變弱」，不借作用機制。

---

## 五、新增美術與物理分層

新增三張生圖，均保留母版、runtime WebP 與提示詞：

1. `ch04_focus_drawer_closes_1665_v01.webp`
2. `ch04_focus_newton_orbit_montage_1679_v01.webp`
3. `ch04_focus_mountain_cannon_v01.webp`

大砲底圖只承載山、砲、天空與情緒。近落／遠落／繞行三條路徑是 runtime SVG；瀏覽器實查為 `near`、`far`、`orbiting` 三條 path，並非烤進 raster。

---

## 六、驗證結果

### 自動測試

在 `greybox/` 執行：

```text
npm test
129 通過，0 失敗
ch4 migration: 19 groups passed; 205 legacy cursors covered
CH4 art / CH5 art / series home / root route 全部通過
```

129 是目前合併後的 test case 數；新增紅線被併入既有 CH4 場景、migration 與 sanitizer 測試，不以測試數增加冒充品質增加。

### 瀏覽器驗收

使用本機 HTTP，不是 `file://` 推測。

桌機 `1536×960`：

- K1 四項封存、作圖紙與左右雙欄。
- K5 六槽、來源選擇、印刷台與窗口。

手機橫屏 `844×390`：

- CH3 航船卷宗代表頁。
- CH4 K0、K2、K1、K4、K5、archive。
- K1 實際用鍵盤 `ArrowLeft` 六次＋`Enter` 完成第一拍，誤差 1.6°，進入第二拍。
- K5 實際走過五段來源、翻球殼頁、親手放第六槽、選雙信精確歸功、四項信用歸戶、旅人親手退出作者欄、誠實邊界、親手壓下完整校樣。
- 三張新增 focus 圖都由對話行觸發。
- 大砲 SVG overlay 實查為三條 path。
- 瀏覽器 console error／warning：`[]`。

驗收中抓到並修正一項 C→B 級 UI 問題：低高度 CSS 對任務標題用了 `white-space: nowrap`，長標題會穿入說明欄。現改為可換行並以同尺寸回看通過；測試已鎖定。

---

## 七、請 Claude 做的最後對抗審

請不要只看 `npm test`，以本文件為索引直接攻擊現行檔案。若有問題，請按 A／B／C 分級，每項提供「位置、可重現證據、直接修法、可驗證條件」。

第一優先：

1. 用 schema 2 合法存檔做 mutation，找能讓未操作證據、K5 或 archive 洗白的缺口。
2. 重新攻 schema 1→2 的 205 游標、K2／K3 里程碑、native K0 續接與三條匯入入口。
3. 做雙重刪除測試：刪旅人後史實工作仍成立；刪玩家操作後 K1–K5 不得成立。
4. 搜 1665 是否仍有虎克 1679 才應出現的問題方向。
5. 搜全章人物預知、心聲答案詞、未來事件外洩、旅人不完整現代語。
6. 對照 1687 初版／1726 第三版、兩封虎克信、球殼命題、雷恩與魚書。
7. 檢查 844×390 是否還有需要真實操作才能暴露的越欄、遮擋或不可觸達控制。

**放行格式**：

- `A=0、B=0` 才交總監試玩。
- C 級可列入後續清單，但不可把史實誤導、玩家操作被代做、存檔可洗白降成 C。

---

## 八、工作樹聲明

這是多人共用、原本就很髒的工作樹。本輪沒有 reset、checkout、`git add -A`、commit 或 push，也沒有動用未授權發布。報告只宣告上列第三、四章範圍已實作與驗證，不冒領工作樹中其他人的既有改動。
