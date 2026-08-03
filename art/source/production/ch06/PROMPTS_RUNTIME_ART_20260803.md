# 第六章 runtime 美術提示詞與採用紀錄

日期：2026-08-03
生成方式：Codex 內建 ImageGen；PNG 母版經 `export_runtime.py` 輸出 WebP。
定位：所有場景與器材都是「合理重建」，不宣稱精確復原 1798 年慕尼黑軍械庫的特定房間。

## 一、不可跨越的表現邊界

- 點陣圖只承載空間、人物、器材、材質、光線與操作情境；讀數、曲線、公式、可讀文字、封條狀態與判讀結果不在點陣圖燒入，全部交給 deterministic HTML／SVG。
- 朗福德 1798 年原文描述的機械骨架是：炮身旋轉、鈍鑽固定、馬匹經機構帶動、短空心炮段置於合水木箱，並可加裝密合活塞。美術只據此做可玩性重建。
- 朗福德外貌參考約 1801 年肖像；不把軍械庫場景或服裝細節冒充當時攝影紀錄。
- 史坦格與凱斯勒是虛構複合角色，人物圖不暗示真實歷史肖像。
- 證據卡 T1–T5、S8 採 SVG；數值與模型邊界可由測試鎖定，不由生成圖自行「畫答案」。

參考來源：

- Benjamin Thompson, *An Inquiry Concerning the Source of the Heat which is Excited by Friction*（1798，Royal Society 原文掃描）：https://www3.nd.edu/~powers/ame.20231/thompson1798.pdf
- Smithsonian National Portrait Gallery，Benjamin Thompson, Count Rumford（1801，CC0）：https://www.si.edu/object/benjamin-thompson-count-rumford%3Anpg_NPG.2008.96
- Rijksmuseum，Benjamin Thompson 肖像版畫（約 1800）：https://www.rijksmuseum.nl/en/collection/object/Portret-van-Benjamin-Thompson--c2cf528a7434dbdab31002e5b6fd7774

## 二、共同風格提示

> Historical-scene key art for a serious narrative physics game, painterly photorealism, late-eighteenth-century Munich arsenal, tactile brass, iron, timber, leather and paper, physically plausible apparatus, restrained amber daylight or candlelight, cinematic 16:9 composition, calm investigative tone, no fantasy glow, no modern object, no readable writing, no printed labels, no digits, no equations, no graph, no interface, no watermark.

角色追加：three-quarter full-body dialogue portrait, centered subject, flat chroma background, period-appropriate late-eighteenth-century clothing, hands visible, no prop containing text。後製使用邊框取色去背與 despill，輸出透明 WebP。

## 三、採用資產

### 場景背景（7）

1. `ch06_bg_munich_arsenal_boring_floor_day`：日間鑽炮工場；旋轉炮身、固定鈍鑽、傳動與工頭動線。
2. `ch06_bg_munich_chip_calorimetry_bench`：碎屑／實心片的雙水杯量熱桌，紙帶與刻度留白。
3. `ch06_bg_munich_airtight_bore_test`：密合皮圈與活塞比較，保留可觀察接縫。
4. `ch06_bg_munich_water_box_setup`：水箱長時段實驗的乾淨起點，尚未沸騰。
5. `ch06_bg_munich_water_box_boiling_evening`：同一裝置達沸點的晚間狀態。
6. `ch06_bg_munich_model_audit_night`：四區稽核板、原紙與封存袋；區內無可讀答案。
7. `ch06_bg_munich_joint_page_dawn`：清晨共同驗證桌；頁面恰有四欄，內容留白。

### 跨時轉場（3）

1. `ch06_transition_1740_unpaid_heat_debt`：西雷留下的兩本帳與未付收據。
2. `ch06_transition_1740_1798_pagefold`：紙頁與季節共同折過 58 年。
3. `ch06_transition_1798_munich_arsenal_arrival`：抵達慕尼黑軍械庫鑽炮工場。

### 角色（3）

1. `ch06_char_rumford45`：朗福德伯爵約 45 歲，依歷史肖像特徵做合理重建。
2. `ch06_char_stang52`：史坦格・鑽炮長約 52 歲，虛構複合角色。
3. `ch06_char_kessler58`：凱斯勒院士約 58 歲，虛構複合角色。

### 實驗台與敘事聚焦（11）

- `ch06_lab_source_ledger`：四個實物來源區與四張空白來源紙。
- `ch06_lab_chip_capacity`：碎屑／實心片雙杯量熱桌。
- `ch06_lab_friction_conditions`：只轉、只壓、接觸且轉動的三條件器材。
- `ch06_lab_paper_strip`：無數字紙帶、無數字取樣鼓與固定鈍鑽。
- `ch06_lab_airtight_piston`：開放／密合活塞比較。
- `ch06_lab_water_box_setup`：長時段水箱起點。
- `ch06_lab_water_box_boiling`：水箱沸騰結果。
- `ch06_focus_model_audit`：四來源稽核板。
- `ch06_focus_joint_page`：四欄共同頁。
- `ch06_focus_hot_chip_water`：鉗子把熱黃銅碎屑放入水中。
- `ch06_focus_latent_heat_notebook`：冰水杯與留白薄冊，保留潛熱未決邊界。

### deterministic 證據卡（6）

`ch06_card_S8_latent_heat_boundary_v01.svg`、`ch06_card_T1_equal_heat_scale_v01.svg`、`ch06_card_T2_contact_motion_v01.svg`、`ch06_card_T3_airtight_comparison_v01.svg`、`ch06_card_T4_prediction_bands_v01.svg`、`ch06_card_T5_joint_page_v01.svg`。

## 四、退稿與修正鎖

- 共同頁第一版畫成五欄，已退役；採用版只有三條垂直分隔線、恰成四欄，第四欄不是備註欄。
- 摩擦條件台第一版把正在工作的鑽頭畫尖，已退役；採用版固定工作的鑽頭為鈍鑽，尖頭只能作為桌上未安裝的比較件。
- 紙帶台第一版在取樣器留下可讀數字，已退役；採用版改為無數字缺口鼓，所有讀數由 runtime 產生。

## 五、輸出規格

- 背景：1920×1080 WebP，quality 82。
- 轉場：1672×941 WebP，quality 82。
- 角色：900×1200 透明 WebP，quality 88。
- 實驗／聚焦：1200×750 WebP，quality 84。
- 輸出腳本：`art/source/production/ch06/export_runtime.py`。
