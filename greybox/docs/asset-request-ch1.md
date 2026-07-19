# 第一章 runtime 資產需求清單(給 Sol)

**接口已就緒**:`data/assets.js` 已列全部槽位(path=null)。你只需——①母版轉出 runtime WebP 放入 `/public/assets/`(建議子路徑 `chapters/ch01/`)②把對應 entry 的 `path` 填上(同步 `assets.json` 鏡像)——**程式零改動,圖即出現**(場景橫幅+對話立繪)。`npm test` 會自動驗:鏡像一致、path 已填則檔案必須存在、每場景有槽位。

## 優先序 P0(首發必要,共 6 件)

| 槽位 id | 內容 | 建議尺寸(runtime) | 母版對應 |
|---|---|---|---|
| bg_pisa_arcade | 比薩迴廊(晨) | 1600×900 WebP | `ch01_styleframe_pisa_arcade` 裁 16:9 |
| bg_study_pisa | 比薩書房 | 1600×900 | `proof_sf01_study_night` 裁 |
| bg_workshop_padua | 帕多瓦工作室 | 1600×900 | `ch01_bg_workshop_empty_v01` ✓ 現成 |
| bg_lecture_hall | 大學講堂 | 1600×900 | `ch01_styleframe_debate_hall_v02` ✓ 現成 |
| portrait_galileo | 伽利略 bust | 600×600(透明) | `ch01_char_galileo_master_v01` 裁 bust;混合制臉層屆時填 `layers` |
| portrait_simplicio | 辛普里奧 bust(書版) | 600×600(透明) | `ch01_char_simplicio_master_v02` 裁 bust |

## P1(第二批,體驗完整,共 6 件)

bg_tower_top(鐘樓頂・黎明)、bg_riverside(河邊・黃昏)、bg_canal_dusk(運河・黃昏)、bg_moon(月球,單場小檔)、card_E3(數據紙)、card_S1(德爾夫特信)——後兩張是辯論高潮的出示物,值得先做。

## P2(可後補/可共用)

bg_city_wall(可暫掛 bg_pisa_arcade)、bg_university_corridor(可用迴廊變體)、portrait_host/portrait_assistant(可永久缺席,UI 自動 fallback)、其餘 card_*、prop_*(prop 三件母版已有:球槽/水鐘/評注本)。

## 規則備忘

- `portrait_traveler` 槽位保留但**勿填**——旅人露臉屬美術待決 #2,總監未裁。
- 混合制(ART-ADR-001):細表情用 `layers:[{path, anchorX, anchorY, w}]`(母版座標,程式換算百分比定位);大動作直接換 base path。
- 每件仍走你的 §9.1 單件驗收與提示詞紀錄;檔名照 §5.2(`ch01_bg_..._v01.webp`)。
- 首屏(P0-1 用到的)請把 entry `firstScreen: true` 保持正確——之後做載入預算量測用。
