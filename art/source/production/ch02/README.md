# 《發現之前》第二章正式美術｜〈拋出去的東西〉

**批次**：P0＋P1 v0.1

**日期**：2026-07-21

**美術主責**：Sol

**整合主責**：Claude

**上游**：第二章劇本 v0.1.3 🔒、第二章功能規格 v0.1.1 🔒、`greybox/docs/asset-request-ch2.md`

本批使用 Codex 內建 `image_gen` 製作。來源 PNG 留在本目錄；遊戲只讀 `public/assets/ch02/` 的 WebP。完整提示詞見 `PROMPTS_P0_P1_20260721.md`，接口見 `asset-manifest.json`。

## 批次結論

- 伽利略 1608 採新 `galileo44` 年代組，不用 39 歲圖硬充。
- 辛普里奧 1608 採新 `simplicio76` 年代組，絕不覆蓋 72 歲資產。
- 彈射裝置採「完整母版＋錨定零件縮圖」：零件圖是持續可見的 slot figure，不是像素對齊貼皮。
- `strikeout` 必須使用含羽筆、計算紙與劃除動作的 v02；v01 只保留生成紀錄。
- 數據、軌跡疊線、落點與斜率仍由 HTML／SVG 畫；點陣圖不承擔判定。

## 目錄

- `backgrounds/`：帕多瓦大學迴廊來源圖。
- `characters/dialogue/`：44 歲伽利略與 76 歲辛普里奧差分、綠幕與 alpha。
- `props/`：彈射裝置、零件片、墨跡斜板。
- `cards/`：S3、S4 證據卡來源圖。
- `ui/`：第二章章節列縮圖。
- `process_character_alpha.py`：細髮綠邊清理與 runtime WebP 輸出。
- `split_projectile_parts.py`：零件片切分與 runtime WebP 輸出。
- `ch02_p0_p1_contactsheet_v01.webp`：本批 QA 聯絡表。

## 不得踩的整合坑

1. 程式永不鏡像人物；站位由資料層指定。
2. `strikeout` 使用 `ch02_char_simplicio76_strikeout_v02.webp`。
3. 選中毛邊、手放或目測板時，不得顯示「壞件」或 profile 名；只顯示零件本身。
4. 彈射母版的預設畫面是門閂＋打磨桌沿＋耙平沙盤，用於空景與完整裝置；互動工坊必另顯示目前 slot 的零件縮圖，避免畫面說謊。
5. S3 是歷史錯圖；現代正確軌跡、FR 疊線與玩家判讀仍由程式繪製。
