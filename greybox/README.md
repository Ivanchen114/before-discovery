# 《發現之前》遊戲 runtime

本資料夾已從早期斜面灰盒演進為系列正式 runtime；名稱保留只為相容既有路徑。

## 玩家入口

- `stage.html`：唯一正式入口。系列首頁可選第一章《重物的渴望》或第二章《拋出去的東西》。
- 線上版：<https://before-discovery.vercel.app/>

`chapter.html`、`chapter2.html`、`index.html` 是內部 QA／開發對照殼，不再對玩家公開推薦。

## 目前完成度（2026-07-21）

- 第一章：完整候選版。
- 第二章：M1–M3、彈射工坊、完整辯論、敵方數據卡、跨章書信碼、P0/P1 美術均已接入正式舞台。
- 第二章專屬音樂待生成；現階段暫沿既有 mood，不阻斷劇情與玩法。

## 測試

在本資料夾執行：

```bash
npm test
```

現行基線：**75 通過、0 失敗**。涵蓋第一章 216 判定點、雙章敘事可達性、第二章 fixture／工坊／辯論、雙歸零修復、存檔封套、匯入淨化、資料鏡像與舞台契約。

真人瀏覽器與手機簽核表：`docs/browser-checklist.md`。

## 結構

- `src/`：純函式引擎、敘事狀態機、章節 UI、舞台表現層。
- `src/stage/*.part.js`：舞台來源；`stage-ui.js` 為生成物。
- `data/`：雙章劇情、辯論、史實、fixture 與美術 manifest（JS 執行載體＋JSON 規範鏡像）。
- `tests/`：零外部依賴的 Node 回歸測試。
- `docs/`：瀏覽器清單、美術需求與開發文件。
- `tools/`：stage／assets 生成與一致性工具。
- `spike_workshop/`（根目錄）：工坊研究切片；正式實作以本資料夾 `engine2.js` 為準。
