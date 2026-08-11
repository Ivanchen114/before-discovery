# 《發現之前》CH4-CR-014 施工回寫與 Fable CONFORMANCE 交接

- 日期：2026-08-09
- 施工者：GPT-5.6 Sol
- 依據：`DESIGN GATE: PASS — CH4-CR-014`
- 狀態：實作完成、全測試通過、瀏覽器驗收通過；待 Fable 5 獨立 CONFORMANCE

## 一、交付結果

1. K1 使用 Art Locked v02 完整 raster；其 `visualKey` 恆為 `null`，不觸發 fallback。
2. K4 從已封存的 `evidencePackage` 唯讀投影四種世界線：
   `no_loans`、`planets_loan`、`comet_loan`、`both_loans`。
3. 取得特寫與筆記共用 resolver；靜態 `card_K4` 不得蓋過狀態變體。
4. 無法安全還原時退回已修正的中性 SVG，圖外明示狀態無法還原，不猜 no_loans。
5. 筆記卡可開啟完整單張 raster；可見圖上零疊字，圖外另有 caption、alt 與確定性
   文字版。鍵盤與焦點行為完整。
6. `engine4.js`、`sanitize.js`、schema、migration、取得條件、借條文字、
   `ledgerClaimText` 與科學結論均未修改。

## 二、主要施工範圍

- `greybox/src/chapter-ui.js`
- `greybox/data/assets.json` 與生成鏡像 `assets.js`
- `greybox/src/stage/03-focus-visual.part.js`
- `greybox/src/stage/05-events.part.js`
- `greybox/src/stage/09-notebook.part.js`
- `greybox/stage.html`、生成的 `greybox/src/stage-ui.js` 與 builder 回寫之入口快取鍵
- `greybox/tests/run-node.mjs`、`greybox/tests/run-ch4-art.mjs`
- `public/assets/ch04/evidence/` 五張 WebP

共享工作樹另有其他章與治理文件的既存修改；請勿以整棵 `git diff` 推定皆屬本 CR。

## 三、驗證證據

- `cd greybox && npm test`：**173 通過、0 失敗**。
- ch4 migration：19 groups passed，205 legacy cursors covered。
- 四組 K4 合法世界線均在真實舞台開啟並對到正確圖、caption 與文字版；非法投影負向
  契約不得命中任何 raster。
- K1 與四張 K4 WebP 均為 1586×992，可解碼，且 Art Lock source SHA 有契約。
- 1440×900、844×390：完整圖無橫向溢出；Tab／Enter／Space／Esc 與焦點歸還通過。
- console：0 error／warning。
- 讀屏等價內容已做 DOM／ARIA 結構核對；未做 VoiceOver 實聽。

## 四、請 Fable 窄驗的五件事

1. `evidencePackage` 是否確為唯一世界線權威，且投影不受 DOM／當前選項／中文文字影響。
2. 四個 K4 `visualKey` 的圖、封存借條狀態與 exact `ledgerClaimText` 是否逐一一致。
3. K1 null 是否保持正常；K4 破損投影是否 fail closed 且不捏造 no_loans。
4. 取得特寫與筆記是否真為同一件證物；靜態 `card_K4` 是否無法搶先。
5. 玩家可見文字是否忠於核准的敘事／科學邊界；無內部代號、無可見程式疊字。

請勿重審已 Art Locked 的美術品味；若發現科學事實、世界線或可見承諾漂移，依 A／B／C
分級回報並附實際 runtime 證據。

## 五、發布狀態

- Modified：是
- Automated tested：是，PASS
- Browser accepted：是，PASS
- Fable CONFORMANCE：待辦
- Committed：否
- Pushed：否
- Deployed：否
