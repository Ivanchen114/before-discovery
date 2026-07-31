# skill v3.0.1 候選|Claude 獨立對抗審回覆

**審查**:Claude|**日期**:2026-07-28|**主審對象**:Sol 交付表 7 檔(hash **7/7 逐一比對一致**,受審版本已固定)
**方法**:讀閘門規範全文 → 實跑 validate/--activation/route → 重放 Sol 反例表 → 自選六路攻擊。全程唯讀,零檔案修改。
**判定**:**A=0、B=2、C=3——退回小修。**方向與工程品質是三輪以來最高的一版;兩條 B 都是 router 的機械縫,修完即可交總監裁決啟用。

---

## 〇、先認一個我自己的誤報

第一輪跑反例時我回報「缺 target 竟 exit 0」——錯了,是我的 shell 管線吃掉退出碼(`$?` 拿到 `tail` 的)。重測後 **Sol 反例表 6/6 全部復現**:缺 target=2、generic save=2、ch4 美術三 blocker=2、合法路由=0、ch5 存檔跨章被 `save.cross-chapter-law` 擋=2。這條列在最前,因為它示範了本包最大的優點:**可重跑、可失敗,連審查者的錯都能被它糾正。**

## 一、B 級(2 條)

### B-1|路徑狀的 target 不存在時,router fail-open

- **位置**:`scripts/skill_guard.py:471 source_matches_target` 與 `route_sources`——target 未命中 registry 時一律視為「外部工作包標籤」,**無任何檔案存在性檢查**。
- **重現**:
  ```bash
  python3 tools/skill/before-discovery-dev/scripts/skill_guard.py route \
    --task review --chapter ch4 --phase review --mode TO-BE \
    --target "04_劇本/第四章台詞稿_v0.9_不存在.md"
  # → exit 0,TARGET 照印,SOURCES_ROUTED
  ```
- **因果風險**:總監說「審 v0.9」而 v0.9 尚未建檔(或打錯字),router 放行、registry 的 v0.8 以 comparison 載入——agent 會非常順手地**拿 comparison 當主審對象**,正是 A-1 三真相模式要防的「審錯版本」。SKILL.md §1 自己寫「指定版本不存在時先回報,不得自行拿另一版代替」——**規則已宣告,機械層漏接**。依 Sol 上輪對我立的同一標準(「行為正確但無鎖=B」),此為 B。
- **直接修法**:target 含路徑分隔符或 `.md/.json/.js/.html` 副檔名、且未命中 registry 時,做 `Path.exists()`;不存在 → `TARGET NOT FOUND` blocker,exit 2。純標籤(無 `/`、無副檔名,如 `WP-A-CH4-NEW-SCRIPT`)維持現行為。
- **會失敗的驗證條件**:上述重現命令必轉 exit 2;`--target WP-A-CH4-NEW-SCRIPT` 仍 exit 0;`--target greybox/stage.html`(存在)仍 exit 0。

### B-2|lane 是純自律:R4 工作自報 R0/R1,無任何機械擋

- **位置**:`route --help` 無 `--lane` 參數;lane 只存在於工作包卡(自填)與閘門規範 §四(紙面)。
- **重現**:`route --task ui --chapter ch3 --phase implement --mode TO-BE --target x` 不帶 `--impact serialized-state-change` 即可繞過存檔 blocker——**impact 同樣自報**,save/archive/art 的自動 impact 只覆蓋 task 名稱命中者,「改 engine3 順手動了序列化欄位」這種實際 R4 動作,router 無從知道。
- **因果風險**:比例化分流的整個下限靠施工者誠實申報。規範 §四寫「以最高風險定級,不得拆檔降級」,但違反時**沒有任何工具會紅**。
- **直接修法**(最小):①route 加選用 `--lane`,並立兩條硬對應——`--impact serialized-state-change` 或 `--task save` 而 lane<R4 → exit 2;`shared-engine-change` 而 lane<R3 → exit 2。②validator 加一條:交付報告若含 `Full tests: NOT RUN` 而 lane≥R2 → warning。申報不實仍防不了,但至少「申報了 impact 卻謊報 lane」會被抓——把純自律收窄成「只剩漏報一種作弊」。
- **會失敗的驗證條件**:`route --lane R1 --impact serialized-state-change …` 必 exit 2;`--lane R4` 同參數 exit 0。

## 二、C 級(3 條)

- **C-1|superseded target 無警語**。明示 `--target v0.7 台詞稿` → exit 0、`TARGET REGISTERED`,但輸出**不標** `status=superseded`(審舊版是合法需求,放行正確;缺的是提醒)。修法:target 命中 registry 時在 TARGET 行帶 status,superseded 加一行 CAUTION。驗證:v0.7 target 輸出含 superseded 字樣。
- **C-2|兩份待裁候選部分重疊,未互相引用**。閘門規範 §八 ≈ 我 v2 立的候選二(存檔通則)、§六-4 ≈ 候選三(反向轉紅);兩檔都已入 registry,但**規範正文未提候選檔**——總監裁決時若只裁一份,另一份變殭屍或雙重立法。修法:規範 §十加一句「本檔 §六-4/§八 吸收《待裁條文候選》二、三,裁決本檔即同時處分;候選一(A=0/B=0)、四(archive 邊界)另裁」;候選檔頂部加反向註記。驗證:兩檔互見對方路徑。
- **C-3|exit code 語意未寫進 SKILL.md**。實測三值:0=已路由、1=用法錯(mode/phase/impact 非法)、2=blocker。SKILL.md §4 只解釋了輸出字樣。修法:§4 加一行「exit 0/1/2 = 路由完成/參數錯誤/存在阻擋」。驗證:文件與實測三值一致。

## 三、守住的(實測清單)

| Sol 第七節攻擊面 | 結果 |
|---|---|
| 1 真相模式選錯 target | ◐ 機制正確;唯一縫=B-1 的不存在路徑 fail-open |
| 2 修法/移交/生圖矛盾 | ✅ 規範 §3.2 三條移交要件明確;「能力不因移交虛構」寫進 §3.1;overlay 改寫後仍保留我的自檢清單指向,生圖限制是能力事實,我無異議 |
| 3 R0–R4 鑽洞 | ⚠ B-2(自律無鎖);唯讀升級問題未見(R0 不被無關紅燈卡,實測 validate 不擋) |
| 4 chapter domains 漏讀/過讀 | ✅ ch4 diagnose 不再拉 history/migration/spike(Sol 修正後行為復現) |
| 5 satisfied_by 跨章 | ✅ ch5 存檔 → `save.cross-chapter-law` blocker;ch4 個案只解同章 |
| 6 art-change 三 phase 一致 | ✅ implement 帶 art-change → 三 blocker;release 無 art-change → 不製造假 blocker |
| 7 ROUTED 誤當授權 | ✅ 每次輸出尾註「Design Gate and mutation authority were not evaluated」 |
| 8 candidate→active fail-closed | ✅ `--activation` 25 errors 誠實列出(candidate 狀態、守則衝突句、17 個未追蹤法源);`registry_status=candidate` 是硬擋 |
| 9 維護成本 | **值得,附一個條件**:registry 的更新義務必須進交付狀態(建議規範 §九加欄 `Registry updated: YES/N-A`),否則三個月後它就是下一個過期的 `02_設計/README` |
| 10 registry 誤標 | ✅ 65 條實路徑存在性**零誤標**;ch3「10 場 209 節點」與 runtime 一致;browser-checklist 帶「過期段落不得簽核」note;待裁候選檔已登錄 |
| (自查)偷渡待裁條文 | ✅ **沒有**。A=0/B=0 未寫死;§八明標「跨章通則正式裁決前」的安全預設 |
| (自查)sync-mirror 方向 | ✅ 單向 SKILL.md→鏡像,不會反寫 canonical |
| (自查)hash | ✅ 7/7 一致 |

## 四、給總監的裁決建議

1. **B-1、B-2 由 Sol 小修**(合計約 30 行 guard 程式+規範一句),我做定點覆核(只驗四條「會失敗的驗證條件」)。
2. 修完後**可裁**:閘門規範 v0.1 轉 active(裁決時一併處分待裁候選二、三,見 C-2;候選一、四另裁)。
3. 裁後依交接報告第一節順序執行啟用(原子式修守則衝突句 → 17 個法源入 Git 追蹤 → registry 轉 active → `validate --activation` 全綠 → 同步生效版)。**17 個未追蹤法源的 commit 需要你的授權**——那是 Sol 已正確識別「不能由 skill 代辦」的事。
