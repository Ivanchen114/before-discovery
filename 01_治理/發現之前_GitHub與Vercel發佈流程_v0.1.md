# 《發現之前》GitHub 與 Vercel 發佈流程 v0.1

**狀態**：正式法源  
**適用範圍**：本機修改、GitHub 提交、Vercel 線上試玩與發佈驗收  
**最後更新**：2026-07-28

---

## 一、唯一正式管線

```text
本機工作樹
  → 只選本輪要發佈的檔案
  → commit 到 GitHub main
  → git push origin main
  → Vercel 由 GitHub 自動部署
  → 從正式網址做瀏覽器驗收
```

- GitHub：<https://github.com/Ivanchen114/before-discovery>
- 正式網站：<https://before-discovery.vercel.app/>
- 玩家入口：<https://before-discovery.vercel.app/>
- 第三章直達：<https://before-discovery.vercel.app/?chapter=ch03>
- 第四章直達：<https://before-discovery.vercel.app/?chapter=ch04>
- Vercel 以 repo 根目錄為靜態輸出；設定見根目錄 `vercel.json`。
- `greybox/stage.html` 是內部實作路徑；正式對外連結一律使用根網址，避免入口與 canonical 分裂。

`chatgpt.site`、本機 `127.0.0.1`、直接雙擊 `file://` 都不是本專案的正式發佈位址。

---

## 二、先決定這次是哪一種發佈

### A. 正式候選版

- 自動測試全綠。
- 桌機與手機橫屏完成定點驗收。
- GitHub、Vercel 與瀏覽器驗收狀態全部記錄。

### B. 線上試玩中的半成品

總監明確知道尚有缺口時，可以先推上線試玩，但交付訊息必須列出：

1. 已知失敗或未完成項目。
2. 哪些章節可以玩。
3. 哪些項目只通過自動測試、尚未真人驗收。

**半成品可以發佈；不能把它說成正式凍結版。**

---

## 三、發佈前盤點

在 repo 根目錄執行：

```bash
git status -sb
git remote -v
git rev-list --left-right --count origin/main...HEAD
git diff --cached --name-status
```

確認：

- 當前分支是 `main`。
- `origin` 指向 `Ivanchen114/before-discovery`。
- 是否有人已經 stage 其他檔案。
- 是否存在其他協作者尚未完成的修改。

### 共享髒工作樹鐵律

- **禁止 `git add -A`、`git add .`。**
- 不 reset、不 checkout、不覆寫別人的未提交修改。
- 只用明確路徑加入本輪檔案：

```bash
git add greybox/src/chapter-ui.js
git add greybox/src/engine3.js
git add greybox/data/scenes3.json greybox/data/scenes3.js
git add public/assets/ch03/需要的圖片.webp
```

- 提交前一定再看：

```bash
git diff --cached --name-only
git diff --cached --check
```

若 index 已經有別人 staged 的檔案，不可直接整批 commit；要用明確 pathspec 提交本輪檔案，或先與總監確認範圍。

---

## 四、資料鏡像與測試

`greybox/data/*.json` 是資料法源；修改 JSON 後，要執行對應 build script 產生 JS 鏡像，不可只手改其中一份。

先查看可用 script：

```bash
cd greybox
npm run
```

依修改章節執行對應 `build:*`，再跑：

```bash
npm test
```

測試結果要記錄成「X 通過、Y 失敗」。若是半成品發佈，Y 可以不為零，但必須明確說明失敗內容；不可只報通過數。

---

## 五、提交與推送

提交訊息用繁中，一句話說明玩家會看到的改變：

```bash
git commit -m "feat: 更新第三章線上試玩流程"
git push origin main
```

在共享髒工作樹中，提交時仍須限定本輪路徑，不得順手收走所有 staged／untracked 檔案。

`git push origin main` 成功只代表 **GitHub 已收到 commit**；它不等於 Vercel 已完成，也不等於玩家入口已驗收。

---

## 六、Vercel 部署與正式網址驗收

推送後依序確認：

1. GitHub `main` 已顯示剛才的 commit。
2. 等待 Vercel 自動部署完成。
3. 開啟正式網站首頁。
4. 開啟本輪改動章節的直達網址。
5. 用帶 commit 短碼的查詢參數避開舊快取，例如：

```text
https://before-discovery.vercel.app/?chapter=ch03&build=abc1234
```

6. 實際確認：
   - 背景圖、角色圖、證據圖能載入。
   - 對話可繼續。
   - 工作台能進入並執行。
   - 存檔不會一載入就報錯。
   - 本輪修正的 UI 在桌機與手機橫屏可操作。

Vercel 顯示成功但玩家頁面壞掉，仍算發佈失敗。

---

## 七、狀態用語不可混用

交付時只能使用實際完成的層級：

| 用語 | 真正代表 |
|---|---|
| 已修改 | 檔案只在本機 |
| 測試通過 | 已跑自動測試 |
| 已 commit | Git 本機已有 commit |
| 已 push | GitHub 已收到 commit |
| 已部署 | Vercel 已完成該 commit |
| 已驗收 | 正式網址實際打開並走查 |

不得用「好了」「發佈了」概括尚未完成的後續層級。

---

## 八、部署失敗或需回退

先分清楚是：

- Git push 失敗。
- Vercel build／deploy 失敗。
- 部署成功但資產路徑或 runtime 壞掉。
- 瀏覽器仍讀到快取。

公開 `main` 若需要回退，用可追蹤的新 commit：

```bash
git revert <bad_commit_sha>
git push origin main
```

不要用 `git reset --hard` 改寫共享歷史。

---

## 九、每次發佈的最小回報格式

```text
GitHub：已 push／未 push
commit：<短碼> <訊息>
Vercel：已部署／部署中／失敗
正式網址：<URL>
自動測試：X 通過、Y 失敗
瀏覽器驗收：桌機／手機橫屏／尚未驗收
已知缺口：<逐項列出>
```

這份格式同時適用正式候選版與半成品線上試玩版。
