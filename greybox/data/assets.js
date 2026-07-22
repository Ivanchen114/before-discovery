/* data/assets.js — 執行載體(file:// 相容)。規範鏡像:assets.json（測試把關）。
   ⚠ 本檔為生成物；請改 assets.json 後執行 node tools/build-assets.mjs。 */
(function (root) {
 "use strict";
 var data = {
 "version": 1,
 "basePath": "../public/assets/",
 "note": "path=null 即該槽尚無 runtime 資產,UI 全面 fallback(灰盒不變)。Sol 只需:轉出 WebP 放入 public/assets/,把 path 填上;程式零改動。layers 欄位=ART-ADR-001 混合制(base+臉層,anchorX/anchorY/w 以母版座標記)。 sceneDialoguePortrait[場景][講者]→場景覆寫,speakerDialoguePortrait[講者]→對話預設,speakerPortrait[講者]→舊筆記頭像 fallback(遮罩呈現)。旅人一律不入對話肖像映射(壓暗對手呈現);dialogue_traveler_silhouette 僅供章末/筆記/A-B。 speakerSide[講者]→雙槽站位(依原圖朝向,永不鏡像);travelerSilhouette[side]→旅人剪影按側選圖(預設開啟,?travelerBust=0 撤回)。 prologuePlates[板號]→序幕 P0-0 v03 六板(文字直生於圖;拍映射 n1-n2→1/n3→2/n4-n5→3/n6→4/n7→5/n8-n9→6;程式僅交叉淡化+字幕+題詞+無障礙文字;v01/v02 廢案禁引)。 lineDialoguePortrait[{scene,speaker,match,asset}]→台詞級表情覆寫(最高優先;子字串比對;年代守衛測試把關)。 lineFocusVisual[{scene,match,items,caption}]→台詞提及圖像或器材時自動入鏡,同場景保留、換場清除。 sceneFx[場景]→進場特效(timejump=三板 3.4s 溶接偽影片+年份四里程碑 HTML 淡換;僅活戲;無資產=單紙淡入 fallback)。 sceneBgm[場景]→程序化環境音樂 mood(pisa/study/rain/workshop/hall/dusk;storm=序幕專用;Web Audio 合成零資產,聲音鈕總開關)。 bgmFiles[mood]→真音樂檔(mp3/ogg,放 public/assets/audio/ 填檔名即播,交叉淡入;null=回退程序化合成;storm 建議留合成=現代場景用合成器,1590 用真琴,音色本身就是穿越)。授權紀錄=public/assets/audio/README.md。 Batch03:title_background/histfacts_banner/card_E1·E3·E4·E5 專圖(card_E2 恆 null=程式 SVG);證據卡解析=card_<code> 優先,缺圖回退 template。 evidenceSummary[證據(+子項)]→手牌白話摘要(語意透明化,不標正解)。",
 "sceneBg": {
  "P0-1": "bg_pisa_arcade",
  "P0-2": "bg_study_pisa_day",
  "P0-3": "bg_study_pisa_day",
  "A1-1": "bg_study_pisa_rain_night",
  "A1-2": "bg_study_pisa_day",
  "A1-3": "bg_city_wall",
  "A1-4": "bg_tower_top",
  "A1-5": "bg_pisa_arcade_afternoon",
  "A1-6": "bg_riverside",
  "A1-7": "bg_study_pisa_rain_night",
  "INT-1": "bg_workshop_padua",
  "A2-1": "bg_workshop_padua",
  "A2-2": "bg_workshop_padua",
  "A2-3": "bg_workshop_padua",
  "A2-4": "bg_workshop_padua",
  "A2-5": "bg_workshop_padua_night",
  "A3-1": "bg_lecture_hall_audience",
  "A3-D": "bg_lecture_hall_audience",
  "A3-F": "bg_workshop_padua",
  "A3-6": "bg_lecture_hall_audience",
  "E-1": "bg_canal_dusk",
  "E-2": "bg_moon",
  "SC-R1": "bg_workshop_padua",
  "B0-1": "bg_workshop_padua",
  "B0-2": "bg_workshop_padua",
  "B1-1": "bg_ch02_workshop_theory_rain_night",
  "B1-2": "bg_ch02_workshop_theory_rain_night",
  "B1-3": "bg_ch02_padua_university_arcade_morning",
  "B1-4": "bg_ch02_canal_dusk_1608",
  "B2-1": "bg_ch02_ink_experiment_workshop",
  "B2-2": "bg_ch02_ink_experiment_workshop",
  "B2-3": "bg_ch02_projectile_workshop",
  "B2-4": "bg_ch02_projectile_workshop",
  "B2-5": "bg_ch02_evidence_wall_night",
  "B3-1": "bg_ch02_lecture_hall_1608",
  "B3-D": "bg_ch02_lecture_hall_1608",
  "B3-F": "bg_ch02_evidence_wall_night",
  "B3-6": "bg_ch02_lecture_hall_1608",
  "BE-1": "bg_ch02_canal_dusk_1608",
  "BE-2": "bg_ch02_moon_golf_1971",
  "ch2:SC-R1": "bg_ch02_projectile_workshop",
  "C0-1": "bg_ch03_marseille_harbor_dawn",
  "C0-2": "bg_ch03_marseille_harbor_dawn",
  "C0-3": "bg_ch03_marseille_harbor_dawn",
  "C1-1": "bg_ch03_moored_mast_deck",
  "C1-2": "bg_ch03_steady_sailing_deck",
  "C1-3": "bg_ch03_steady_sailing_deck",
  "C1-4": "bg_ch03_steady_sailing_deck",
  "C2-1": "bg_ch03_enclosed_cabin",
  "C2-2": "bg_ch03_speed_change_deck",
  "C2-3": "bg_ch03_reference_tapes_table",
  "C2-4": "bg_ch03_reference_tapes_table",
  "C3-1": "bg_ch03_public_demonstration",
  "C3-2": "bg_ch03_public_demonstration",
  "C3-3": "bg_ch03_public_demonstration",
  "C3-4": "bg_ch03_public_demonstration",
  "CE-1": "bg_ch03_print_room_1642",
  "CE-2": "bg_ch03_print_room_1642"
 },
 "apparatusBriefings": {
  "ch1:A2-2": {
   "title": "把量時間的東西找齊",
   "subtitle": "點開三個亮起的器材。先知道各自管什麼，再開始量。",
   "plateAsset": "bg_workshop_padua",
   "platePosition": "left center",
   "speaker": "伽利略",
   "enterLabel": "帶齊器材，開始斜面實驗",
   "items": [
    {
     "id": "waterClock",
     "label": "水鐘",
     "asset": "prop_water_clock",
     "x": 12,
     "y": 23,
     "function": "滴下等量的水，代表經過等長的時間；它把看不見的時間切成可以比較的片段。",
     "line": "鐘不會替我們回答。它只負責把時間切得一樣大。"
    },
    {
     "id": "groove",
     "label": "斜槽與刻度",
     "asset": "prop_ball_groove",
     "x": 45,
     "y": 48,
     "function": "讓太快的下落變慢，並用槽上的刻度記下球在每個等時段走過的距離。",
     "line": "斜面不是拿來冒充自由落體；它是把太快的運動攤開，讓我們量得到。"
    },
    {
     "id": "balls",
     "label": "實驗球",
     "asset": "prop_ball_groove",
     "x": 61,
     "y": 55,
     "function": "先用同一顆球建立基準；後續換球時，才能檢查改變球重會不會改變量到的規律。",
     "line": "先讓一顆球把規律說清楚。等骨架固定，再換球追問重量。"
    }
   ]
  },
  "ch2:B2-3": {
   "title": "把彈射裝置看懂，再動手",
   "subtitle": "這不是找藏起來的東西。沿著亮點檢查裝置，每一件都控制一個實驗條件。",
   "plateAsset": "workshop2_projectile_apparatus_master",
   "speaker": "伽利略",
   "enterLabel": "器材齊了，走進彈射工坊",
   "items": [
    {
     "id": "shortGroove",
     "label": "短斜槽（固定骨架）",
     "asset": "workshop2_projectile_apparatus_master",
     "x": 30,
     "y": 31,
     "function": "固定球的起始高度，讓每次出手有可重複的基準。只有一種合法短斜槽，因此不需要選。",
     "line": "這段斜槽是骨架，不是選項。它只管一件事：讓球每次從同一個高度出發。",
     "fixed": true
    },
    {
     "id": "release",
     "label": "釋放機構",
     "asset": "part_latchRelease",
     "x": 8,
     "y": 12,
     "function": "決定球能否在相同刻度、相近時刻離手；不同釋放方式可能留下不同的重複性。",
     "line": "手能放，門閂也能放。哪一種更穩，不先猜——讓重複紀錄說話。"
    },
    {
     "id": "edge",
     "label": "桌沿",
     "asset": "part_polishedEdge",
     "x": 48,
     "y": 46,
     "function": "決定球離開桌面時的方向是否一致；桌沿狀態會反映在落點的散布上。",
     "line": "球離桌那一刻，桌沿若不齊，方向就會散。這裡的一道毛邊，也會寫進沙裡。"
    },
    {
     "id": "sandbed",
     "label": "升降沙盤與落點量測",
     "asset": "part_rakedSand",
     "x": 72,
     "y": 58,
     "function": "升降架是固定骨架，只改桌沿到沙面的下落高度；進工坊後真正要選的是落點讀法，例如沙痕、目測板或細沙與鉛垂規。",
     "line": "沙盤升降不用選；你要選的是怎麼把落點讀成射程。每一輪，都得知道自己改了哪件事。",
     "fixed": true
    },
    {
     "id": "balls",
     "label": "同徑銅球與木球",
     "asset": "workshop2_projectile_apparatus_master",
     "x": 16,
     "y": 82,
     "function": "兩球外形相同、重量不同；裝置固定後只換球，才有資格追問重量是否改變規律。",
     "line": "先把裝置固定。最後只換這兩顆球——那時，我們才是在問重量。"
    }
   ]
  }
 },
 "shipExperimentVisuals": {
  "baseline": "ship3_g1_mast_dock",
  "first-failure": "ship3_g3_accelerating",
  "steady-mast": "ship3_g1_mast_steady",
  "cabin": "ship3_g2_cabin",
  "speed-change": {
   "default": "ship3_g3_accelerating",
   "accelerating": "ship3_g3_accelerating",
   "decelerating": "ship3_g3_decelerating"
  },
  "overlay": "ship3_g4_reference_tapes",
  "public-demo": "ship3_g5_public_boundary",
  "audit": "ship3_g5_public_boundary",
  "boundary": "ship3_g5_public_boundary"
 },
 "speakerPortrait": {
  "伽利略": "portrait_galileo",
  "年輕人": "portrait_galileo",
  "辛普里奧": "portrait_simplicio",
  "主持": "portrait_host",
  "助手": "portrait_assistant"
 },
 "entries": [
  {
   "id": "bg_pisa_arcade",
   "kind": "bg",
   "label": "比薩大學迴廊(晨)",
   "path": "ch01/backgrounds/bg_pisa_arcade.webp",
   "firstScreen": true,
   "sourceMaster": "ch01_styleframe_pisa_arcade 可裁",
   "w": 1920,
   "h": 1080
  },
  {
   "id": "bg_study_pisa",
   "kind": "bg",
   "label": "比薩書房(夜/日兩態可後補)",
   "path": "ch01/backgrounds/bg_study_pisa.webp",
   "firstScreen": false,
   "sourceMaster": "proof_sf01_study_night 可裁",
   "w": 1920,
   "h": 1080
  },
  {
   "id": "bg_city_wall",
   "kind": "bg",
   "label": "舊城牆(快試)",
   "path": "ch01/backgrounds/bg_city_wall.webp",
   "firstScreen": false,
   "sourceMaster": "P2 優先度,可暫用 bg_pisa_arcade",
   "w": 1920,
   "h": 1080
  },
  {
   "id": "bg_tower_top",
   "kind": "bg",
   "label": "鐘樓頂(黎明)",
   "path": "ch01/backgrounds/bg_tower_top.webp",
   "firstScreen": false,
   "sourceMaster": "新繪",
   "w": 1920,
   "h": 1080
  },
  {
   "id": "bg_university_corridor",
   "kind": "bg",
   "label": "大學迴廊(死路A)",
   "path": "ch01/backgrounds/bg_pisa_arcade_afternoon.webp",
   "firstScreen": false,
   "sourceMaster": "可與 bg_pisa_arcade 共用/變體",
   "w": 1920,
   "h": 1080
  },
  {
   "id": "bg_riverside",
   "kind": "bg",
   "label": "阿諾河邊(黃昏)",
   "path": "ch01/backgrounds/bg_riverside.webp",
   "firstScreen": false,
   "sourceMaster": "新繪",
   "w": 1920,
   "h": 1080
  },
  {
   "id": "bg_workshop_padua",
   "kind": "bg",
   "label": "帕多瓦工作室",
   "path": "ch01/backgrounds/bg_workshop_padua.webp",
   "firstScreen": false,
   "sourceMaster": "ch01_bg_workshop_empty_v01 ✓ 已有母版",
   "w": 1920,
   "h": 1080
  },
  {
   "id": "bg_lecture_hall",
   "kind": "bg",
   "label": "大學講堂(1604)",
   "path": "ch01/backgrounds/bg_lecture_hall.webp",
   "firstScreen": false,
   "sourceMaster": "ch01_styleframe_debate_hall_v02 ✓ 已有母版",
   "w": 1920,
   "h": 1080
  },
  {
   "id": "bg_canal_dusk",
   "kind": "bg",
   "label": "帕多瓦運河(黃昏)",
   "path": "ch01/backgrounds/bg_canal_dusk.webp",
   "firstScreen": false,
   "sourceMaster": "新繪",
   "w": 1920,
   "h": 1080
  },
  {
   "id": "bg_moon",
   "kind": "bg",
   "label": "月球・亞平寧山麓",
   "path": "ch01/backgrounds/bg_moon.webp",
   "firstScreen": false,
   "sourceMaster": "新繪(單場景,小檔即可)",
   "w": 1920,
   "h": 1080
  },
  {
   "id": "portrait_galileo",
   "kind": "portrait",
   "label": "伽利略(26/39 歲共用母版,差分後補)",
   "path": "ch01/portraits/portrait_galileo.webp",
   "firstScreen": true,
   "sourceMaster": "ch01_char_galileo_master_v01 裁 bust",
   "w": 600,
   "h": 600
  },
  {
   "id": "portrait_simplicio",
   "kind": "portrait",
   "label": "辛普里奧(58/72 歲共用母版)",
   "path": "ch01/portraits/portrait_simplicio.webp",
   "firstScreen": false,
   "sourceMaster": "ch01_char_simplicio_master_v02(書版)裁 bust",
   "w": 600,
   "h": 600
  },
  {
   "id": "portrait_traveler",
   "kind": "portrait",
   "label": "旅人(露臉與否=美術待決#2,未決前保持 null)",
   "path": null,
   "firstScreen": false,
   "sourceMaster": "待決",
   "w": 600,
   "h": 600
  },
  {
   "id": "portrait_host",
   "kind": "portrait",
   "label": "主持長老(可選,P2)",
   "path": null,
   "firstScreen": false,
   "sourceMaster": "可後補",
   "w": 600,
   "h": 600
  },
  {
   "id": "portrait_assistant",
   "kind": "portrait",
   "label": "助手(可選,P2)",
   "path": null,
   "firstScreen": false,
   "sourceMaster": "可後補",
   "w": 600,
   "h": 600
  },
  {
   "id": "card_E1",
   "kind": "card",
   "label": "高塔落球紀錄",
   "path": "ch01/cards/card_E1.webp",
   "firstScreen": false,
   "sourceMaster": "新繪或以 prop 特寫合成",
   "w": 800,
   "h": 500
  },
  {
   "id": "card_E2",
   "kind": "card",
   "label": "綁縛悖論(示意圖)",
   "path": "ch01/cards/card_E2.webp",
   "firstScreen": false,
   "sourceMaster": "OpenAI imagegen 2026-07-21；E1/E3 卡框風格參考；精確文字與箭頭由 HTML/SVG 疊層",
   "note": "時代質感由生圖底板承擔；物理語意與可讀文字由程式疊層，缺圖時回退 SVG",
   "w": 800,
   "h": 500
  },
  {
   "id": "card_E3",
   "kind": "card",
   "label": "斜面奇數律(數據紙)",
   "path": "ch01/cards/card_E3.webp",
   "firstScreen": false,
   "sourceMaster": "",
   "w": 800,
   "h": 500
  },
  {
   "id": "card_E4",
   "kind": "card",
   "label": "介質阻力辨析",
   "path": "ch01/cards/card_E4.webp",
   "firstScreen": false,
   "sourceMaster": "",
   "w": 800,
   "h": 500
  },
  {
   "id": "card_E5",
   "kind": "card",
   "label": "外推論證鏈",
   "path": "ch01/cards/card_E5.webp",
   "firstScreen": false,
   "sourceMaster": "",
   "w": 800,
   "h": 500
  },
  {
   "id": "card_S1",
   "kind": "card",
   "label": "德爾夫特來的信",
   "path": "ch01/cards/card_S1.webp",
   "firstScreen": false,
   "sourceMaster": "",
   "w": 800,
   "h": 500
  },
  {
   "id": "card_S2",
   "kind": "card",
   "label": "《論運動》手稿",
   "path": "ch01/cards/card_S2.webp",
   "firstScreen": false,
   "sourceMaster": "ch01_prop_manuscript_detail_v01 可用",
   "w": 800,
   "h": 500
  },
  {
   "id": "prop_ball_groove",
   "kind": "prop",
   "label": "銅球與木槽",
   "path": "ch01/props/prop_ball_groove.webp",
   "firstScreen": false,
   "sourceMaster": "ch01_prop_ball_groove_detail_v01 ✓",
   "w": 800,
   "h": 500
  },
  {
   "id": "prop_water_clock",
   "kind": "prop",
   "label": "水鐘",
   "path": "ch01/props/prop_water_clock.webp",
   "firstScreen": false,
   "sourceMaster": "ch01_prop_water_clock_detail_v01 ✓(集水桶/秤比例 B 級修補後)",
   "w": 800,
   "h": 500
  },
  {
   "id": "prop_physics_tome",
   "kind": "prop",
   "label": "《物理學》評注本",
   "path": "ch01/props/prop_physics_tome.webp",
   "firstScreen": false,
   "sourceMaster": "ch01_prop_physics_tome_detail_v01 ✓",
   "w": 800,
   "h": 500
  },
  {
   "id": "bg_study_pisa_day",
   "kind": "bg",
   "label": "比薩書房(日)",
   "path": "ch01/backgrounds/bg_study_pisa_day.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080
  },
  {
   "id": "bg_study_pisa_rain_night",
   "kind": "bg",
   "label": "比薩書房(雨夜)",
   "path": "ch01/backgrounds/bg_study_pisa_rain_night.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080
  },
  {
   "id": "bg_pisa_arcade_afternoon",
   "kind": "bg",
   "label": "比薩迴廊(午後)",
   "path": "ch01/backgrounds/bg_pisa_arcade_afternoon.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080
  },
  {
   "id": "bg_workshop_padua_night",
   "kind": "bg",
   "label": "帕多瓦工作室(夜)",
   "path": "ch01/backgrounds/bg_workshop_padua_night.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080
  },
  {
   "id": "bg_lecture_hall_audience",
   "kind": "bg",
   "label": "大學講堂(滿座)",
   "path": "ch01/backgrounds/bg_lecture_hall_audience.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080
  },
  {
   "id": "bg_notebook",
   "kind": "bg",
   "label": "旅人筆記攤頁(UI 底;文字一律 HTML 疊加)",
   "path": "ch01/ui/bg_notebook.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080
  },
  {
   "id": "card_template",
   "kind": "card",
   "label": "證據卡共用底(內容 HTML/SVG 疊加)",
   "path": "ch01/cards/card_template.webp",
   "firstScreen": false,
   "w": 800,
   "h": 500
  },
  {
   "id": "dialogue_galileo26_neutral",
   "kind": "portrait",
   "label": "伽利略 26・平靜",
   "path": "ch01/dialogue/dialogue_galileo26_neutral.webp",
   "firstScreen": false
  },
  {
   "id": "dialogue_galileo26_skeptical",
   "kind": "portrait",
   "label": "伽利略 26・存疑",
   "path": "ch01/dialogue/dialogue_galileo26_skeptical.webp",
   "firstScreen": false
  },
  {
   "id": "dialogue_galileo26_curious",
   "kind": "portrait",
   "label": "伽利略 26・好奇",
   "path": "ch01/dialogue/dialogue_galileo26_curious.webp",
   "firstScreen": false
  },
  {
   "id": "dialogue_galileo26_crooked_smile",
   "kind": "portrait",
   "label": "伽利略 26・歪嘴笑",
   "path": "ch01/dialogue/dialogue_galileo26_crooked_smile.webp",
   "firstScreen": false
  },
  {
   "id": "dialogue_galileo39_focused",
   "kind": "portrait",
   "label": "伽利略 39・專注",
   "path": "ch01/dialogue/dialogue_galileo39_focused.webp",
   "firstScreen": false
  },
  {
   "id": "dialogue_galileo39_explaining",
   "kind": "portrait",
   "label": "伽利略 39・講解",
   "path": "ch01/dialogue/dialogue_galileo39_explaining.webp",
   "firstScreen": false
  },
  {
   "id": "dialogue_galileo39_realization",
   "kind": "portrait",
   "label": "伽利略 39・了悟",
   "path": "ch01/dialogue/dialogue_galileo39_realization.webp",
   "firstScreen": false
  },
  {
   "id": "dialogue_galileo39_frustrated",
   "kind": "portrait",
   "label": "伽利略 39・挫折(備用)",
   "path": "ch01/dialogue/dialogue_galileo39_frustrated.webp",
   "firstScreen": false
  },
  {
   "id": "dialogue_simplicio58_authoritative",
   "kind": "portrait",
   "label": "辛普里奧 58・威嚴",
   "path": "ch01/dialogue/dialogue_simplicio58_authoritative.webp",
   "firstScreen": false
  },
  {
   "id": "dialogue_simplicio58_skeptical_smile",
   "kind": "portrait",
   "label": "辛普里奧 58・含笑存疑",
   "path": "ch01/dialogue/dialogue_simplicio58_skeptical_smile.webp",
   "firstScreen": false
  },
  {
   "id": "dialogue_simplicio58_surprised",
   "kind": "portrait",
   "label": "辛普里奧 58・訝異(備用)",
   "path": "ch01/dialogue/dialogue_simplicio58_surprised.webp",
   "firstScreen": false
  },
  {
   "id": "dialogue_simplicio58_thoughtful",
   "kind": "portrait",
   "label": "辛普里奧 58・沉思(備用)",
   "path": "ch01/dialogue/dialogue_simplicio58_thoughtful.webp",
   "firstScreen": false
  },
  {
   "id": "dialogue_simplicio72_cross_examination",
   "kind": "portrait",
   "label": "辛普里奧 72・質詢",
   "path": "ch01/dialogue/dialogue_simplicio72_cross_examination.webp",
   "firstScreen": false
  },
  {
   "id": "dialogue_simplicio72_formidable_calm",
   "kind": "portrait",
   "label": "辛普里奧 72・沉靜威壓",
   "path": "ch01/dialogue/dialogue_simplicio72_formidable_calm.webp",
   "firstScreen": false
  },
  {
   "id": "dialogue_simplicio72_solemn_respect",
   "kind": "portrait",
   "label": "辛普里奧 72・肅然起敬",
   "path": "ch01/dialogue/dialogue_simplicio72_solemn_respect.webp",
   "firstScreen": false
  },
  {
   "id": "dialogue_simplicio72_caught_off_guard",
   "kind": "portrait",
   "label": "辛普里奧 72・措手不及(備用)",
   "path": "ch01/dialogue/dialogue_simplicio72_caught_off_guard.webp",
   "firstScreen": false
  },
  {
   "id": "dialogue_assistant_earnest",
   "kind": "portrait",
   "label": "助手・懇切",
   "path": "ch01/dialogue/dialogue_assistant_earnest.webp",
   "firstScreen": false
  },
  {
   "id": "dialogue_assistant_uncertain",
   "kind": "portrait",
   "label": "助手・遲疑(備用)",
   "path": "ch01/dialogue/dialogue_assistant_uncertain.webp",
   "firstScreen": false
  },
  {
   "id": "dialogue_host_formal",
   "kind": "portrait",
   "label": "主持・莊重",
   "path": "ch01/dialogue/dialogue_host_formal.webp",
   "firstScreen": false
  },
  {
   "id": "dialogue_host_adjournment",
   "kind": "portrait",
   "label": "主持・散會",
   "path": "ch01/dialogue/dialogue_host_adjournment.webp",
   "firstScreen": false
  },
  {
   "id": "dialogue_traveler_silhouette",
   "kind": "portrait",
   "label": "旅人剪影(僅章末/筆記/A-B 測試;預設不接對話)",
   "path": "ch01/dialogue/dialogue_traveler_silhouette.webp",
   "firstScreen": false
  },
  {
   "id": "dialogue_traveler_silhouette_right",
   "kind": "portrait",
   "label": "旅人剪影・右側槽(朝左;重新構圖非鏡像;無臉無性別)",
   "path": "ch01/dialogue/dialogue_traveler_silhouette_right.webp",
   "firstScreen": false,
   "w": 540,
   "h": 720
  },
  {
   "id": "p0_0_v03_frame01_article",
   "kind": "bg",
   "label": "序幕v03・01 雙手持平板/00:49 斜塔文章(文字直生)",
   "path": "ch01/prologue/v03/p0_0_v03_frame01_article.webp",
   "firstScreen": true,
   "w": 1920,
   "h": 1080
  },
  {
   "id": "p0_0_v03_frame02_breaking_news",
   "kind": "bg",
   "label": "序幕v03・02 地磁風暴新聞(地球監測圖)/窗外第一縷極光",
   "path": "ch01/prologue/v03/p0_0_v03_frame02_breaking_news.webp",
   "firstScreen": true,
   "w": 1920,
   "h": 1080
  },
  {
   "id": "p0_0_v03_frame03_taipei_aurora",
   "kind": "bg",
   "label": "序幕v03・03 極光在 101 後方爆開/燈熄",
   "path": "ch01/prologue/v03/p0_0_v03_frame03_taipei_aurora.webp",
   "firstScreen": true,
   "w": 1920,
   "h": 1080
  },
  {
   "id": "p0_0_v03_frame04_reach_tower",
   "kind": "bg",
   "label": "序幕v03・04 深色玻璃只剩斜塔/右手將觸",
   "path": "ch01/prologue/v03/p0_0_v03_frame04_reach_tower.webp",
   "firstScreen": true,
   "w": 1920,
   "h": 1080
  },
  {
   "id": "p0_0_v03_frame05_tablet_passage",
   "kind": "bg",
   "label": "序幕v03・05 指尖穿過玻璃/平板成 passage",
   "path": "ch01/prologue/v03/p0_0_v03_frame05_tablet_passage.webp",
   "firstScreen": true,
   "w": 1920,
   "h": 1080
  },
  {
   "id": "p0_0_v03_frame06_whitefall",
   "kind": "bg",
   "label": "序幕v03・06 台北被抽走/義大利晨光擴張",
   "path": "ch01/prologue/v03/p0_0_v03_frame06_whitefall.webp",
   "firstScreen": true,
   "w": 1920,
   "h": 1080
  },
  {
   "id": "int1_pisa_notebook",
   "kind": "bg",
   "label": "幕間板1・比薩雨夜筆記(墨深紙新)",
   "path": "ch01/interlude/int1_pisa_notebook.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080
  },
  {
   "id": "int1_time_passage",
   "kind": "bg",
   "label": "幕間板2・時間流逝(唯一翻頁,比薩溶向帕多瓦)",
   "path": "ch01/interlude/int1_time_passage.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080
  },
  {
   "id": "int1_padua_notebook",
   "kind": "bg",
   "label": "幕間板3・帕多瓦落頁(紙黃頁定)",
   "path": "ch01/interlude/int1_padua_notebook.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080
  },
  {
   "id": "title_background",
   "kind": "bg",
   "label": "標題背景・帕多瓦黎明工作室(中央 34% 暗部安全區)",
   "path": "ch01/ui/title_background.webp",
   "firstScreen": true,
   "w": 1920,
   "h": 1080
  },
  {
   "id": "histfacts_banner",
   "kind": "bg",
   "label": "史實頁橫幅・傳說→查證→實驗",
   "path": "ch01/ui/histfacts_banner.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 420
  },
  {
   "id": "bg_ch02_padua_university_arcade_morning",
   "kind": "bg",
   "label": "bg_ch02_padua_university_arcade_morning",
   "path": "ch02/backgrounds/ch02_bg_padua_university_arcade_morning_v01.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "第二章 P0/P1；art/source/production/ch02/asset-manifest.json"
  },
  {
   "id": "bg_ch02_workshop_theory_rain_night",
   "kind": "bg",
   "label": "1608 雨夜推演室・船桅思想實驗",
   "path": "ch02/backgrounds/ch02_bg_workshop_theory_rain_night_v01.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "第二章背景補圖批次；art/source/production/ch02/backgrounds"
  },
  {
   "id": "bg_ch02_canal_dusk_1608",
   "kind": "bg",
   "label": "1608–1609 帕多瓦運河暮色",
   "path": "ch02/backgrounds/ch02_bg_canal_dusk_1608_v01.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "第二章背景補圖批次；art/source/production/ch02/backgrounds"
  },
  {
   "id": "bg_ch02_ink_experiment_workshop",
   "kind": "bg",
   "label": "墨跡斜板與前人筆記實驗室",
   "path": "ch02/backgrounds/ch02_bg_ink_experiment_workshop_v01.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "第二章背景補圖批次；art/source/production/ch02/backgrounds"
  },
  {
   "id": "bg_ch02_projectile_workshop",
   "kind": "bg",
   "label": "彈射裝置專用工坊",
   "path": "ch02/backgrounds/ch02_bg_projectile_workshop_v01.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "第二章背景補圖批次；art/source/production/ch02/backgrounds"
  },
  {
   "id": "bg_ch02_evidence_wall_night",
   "kind": "bg",
   "label": "雨夜證據牆與複盤桌",
   "path": "ch02/backgrounds/ch02_bg_evidence_wall_night_v01.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "第二章背景補圖批次；art/source/production/ch02/backgrounds"
  },
  {
   "id": "bg_ch02_lecture_hall_1608",
   "kind": "bg",
   "label": "1608 帕多瓦同行辯論講堂",
   "path": "ch02/backgrounds/ch02_bg_lecture_hall_1608_v01.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "第二章背景補圖批次；art/source/production/ch02/backgrounds"
  },
  {
   "id": "bg_ch02_moon_golf_1971",
   "kind": "bg",
   "label": "1971 阿波羅 14 月球高爾夫尾鏡",
   "path": "ch02/backgrounds/ch02_bg_moon_golf_1971_v01.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "第二章背景補圖批次；art/source/production/ch02/backgrounds"
  },
  {
   "id": "dialogue_galileo44_focused",
   "kind": "portrait",
   "label": "dialogue_galileo44_focused",
   "path": "ch02/characters/ch02_char_galileo44_focused_v01.webp",
   "firstScreen": false,
   "w": 800,
   "h": 1200,
   "sourceMaster": "第二章 P0/P1；art/source/production/ch02/asset-manifest.json"
  },
  {
   "id": "dialogue_galileo44_deadpan",
   "kind": "portrait",
   "label": "dialogue_galileo44_deadpan",
   "path": "ch02/characters/ch02_char_galileo44_deadpan_v01.webp",
   "firstScreen": false,
   "w": 800,
   "h": 1200,
   "sourceMaster": "第二章 P0/P1；art/source/production/ch02/asset-manifest.json"
  },
  {
   "id": "dialogue_galileo44_explaining",
   "kind": "portrait",
   "label": "dialogue_galileo44_explaining",
   "path": "ch02/characters/ch02_char_galileo44_explaining_v01.webp",
   "firstScreen": false,
   "w": 800,
   "h": 1200,
   "sourceMaster": "第二章 P0/P1；art/source/production/ch02/asset-manifest.json"
  },
  {
   "id": "dialogue_simplicio76_formidable_calm",
   "kind": "portrait",
   "label": "dialogue_simplicio76_formidable_calm",
   "path": "ch02/characters/ch02_char_simplicio76_formidable_calm_v01.webp",
   "firstScreen": false,
   "w": 800,
   "h": 1200,
   "sourceMaster": "第二章 P0/P1；art/source/production/ch02/asset-manifest.json"
  },
  {
   "id": "dialogue_simplicio76_expectant",
   "kind": "portrait",
   "label": "dialogue_simplicio76_expectant",
   "path": "ch02/characters/ch02_char_simplicio76_expectant_v01.webp",
   "firstScreen": false,
   "w": 800,
   "h": 1200,
   "sourceMaster": "第二章 P0/P1；art/source/production/ch02/asset-manifest.json"
  },
  {
   "id": "dialogue_simplicio76_strikeout",
   "kind": "portrait",
   "label": "dialogue_simplicio76_strikeout",
   "path": "ch02/characters/ch02_char_simplicio76_strikeout_v02.webp",
   "firstScreen": false,
   "w": 800,
   "h": 1200,
   "sourceMaster": "第二章 P0/P1；art/source/production/ch02/asset-manifest.json"
  },
  {
   "id": "dialogue_simplicio76_almost_warm",
   "kind": "portrait",
   "label": "dialogue_simplicio76_almost_warm",
   "path": "ch02/characters/ch02_char_simplicio76_almost_warm_v01.webp",
   "firstScreen": false,
   "w": 800,
   "h": 1200,
   "sourceMaster": "第二章 P0/P1；art/source/production/ch02/asset-manifest.json"
  },
  {
   "id": "workshop2_projectile_apparatus_master",
   "kind": "prop",
   "label": "workshop2_projectile_apparatus_master",
   "path": "ch02/props/ch02_prop_projectile_apparatus_master_v01.webp",
   "firstScreen": false,
   "w": 1599,
   "h": 900,
   "sourceMaster": "第二章 P0/P1；art/source/production/ch02/asset-manifest.json"
  },
  {
   "id": "part_latchRelease",
   "kind": "prop",
   "label": "part_latchRelease",
   "path": "ch02/props/ch02_prop_release_latch_v01.webp",
   "firstScreen": false,
   "w": 1200,
   "h": 675,
   "sourceMaster": "第二章 P0/P1；art/source/production/ch02/asset-manifest.json"
  },
  {
   "id": "part_handRelease",
   "kind": "prop",
   "label": "part_handRelease",
   "path": "ch02/props/ch02_prop_release_hand_v01.webp",
   "firstScreen": false,
   "w": 1200,
   "h": 675,
   "sourceMaster": "第二章 P0/P1；art/source/production/ch02/asset-manifest.json"
  },
  {
   "id": "part_polishedEdge",
   "kind": "prop",
   "label": "part_polishedEdge",
   "path": "ch02/props/ch02_prop_edge_polished_v02.png",
   "firstScreen": false,
   "w": 1200,
   "h": 675,
   "sourceMaster": "Codex imagegen 重構 v02；透明底 16:9 正規化桌沿零件"
  },
  {
   "id": "part_roughEdge",
   "kind": "prop",
   "label": "part_roughEdge",
   "path": "ch02/props/ch02_prop_edge_rough_v02.png",
   "firstScreen": false,
   "w": 1200,
   "h": 675,
   "sourceMaster": "Codex imagegen 重構 v02；透明底 16:9 正規化桌沿零件"
  },
  {
   "id": "part_rakedSand",
   "kind": "prop",
   "label": "part_rakedSand",
   "path": "ch02/props/ch02_prop_range_raked_sand_v01.webp",
   "firstScreen": false,
   "w": 1200,
   "h": 675,
   "sourceMaster": "第二章 P0/P1；art/source/production/ch02/asset-manifest.json"
  },
  {
   "id": "part_eyeBoard",
   "kind": "prop",
   "label": "part_eyeBoard",
   "path": "ch02/props/ch02_prop_range_eye_board_v01.webp",
   "firstScreen": false,
   "w": 1200,
   "h": 675,
   "sourceMaster": "第二章 P0/P1；art/source/production/ch02/asset-manifest.json"
  },
  {
   "id": "part_fineSandPlumb",
   "kind": "prop",
   "label": "part_fineSandPlumb",
   "path": "ch02/props/ch02_prop_range_fine_sand_plumb_v01.webp",
   "firstScreen": false,
   "w": 1200,
   "h": 675,
   "sourceMaster": "第二章 P0/P1；art/source/production/ch02/asset-manifest.json"
  },
  {
   "id": "prop_inked_incline_board",
   "kind": "prop",
   "label": "prop_inked_incline_board",
   "path": "ch02/props/ch02_prop_inked_incline_board_v01.webp",
   "firstScreen": false,
   "w": 1200,
   "h": 675,
   "sourceMaster": "第二章 P0/P1；art/source/production/ch02/asset-manifest.json"
  },
  {
   "id": "card_S3",
   "kind": "card",
   "label": "card_S3",
   "path": "ch02/cards/card_S3.webp",
   "firstScreen": false,
   "w": 800,
   "h": 500,
   "sourceMaster": "第二章 P0/P1；art/source/production/ch02/asset-manifest.json"
  },
  {
   "id": "card_S4",
   "kind": "card",
   "label": "card_S4",
   "path": "ch02/cards/card_S4.webp",
   "firstScreen": false,
   "w": 800,
   "h": 500,
   "sourceMaster": "第二章 P0/P1；art/source/production/ch02/asset-manifest.json"
  },
  {
   "id": "card_F3",
   "kind": "card",
   "label": "F3 一拋一放・等時位置",
   "path": "ch02/cards/card_F3.webp",
   "firstScreen": false,
   "w": 1200,
   "h": 750,
   "sourceMaster": "Codex imagegen 歷史裝置底板＋可驗算 SVG 等時軌跡；art/source/production/ch02/cards"
  },
  {
   "id": "chapter_thumbnail_ch02",
   "kind": "cg",
   "label": "chapter_thumbnail_ch02",
   "path": "ch02/ui/ch02_chapter_thumbnail.webp",
   "firstScreen": true,
   "w": 800,
   "h": 450,
   "sourceMaster": "第二章 P0/P1；art/source/production/ch02/asset-manifest.json"
  },
  {
   "id": "bg_ch03_marseille_harbor_dawn",
   "kind": "bg",
   "label": "1640 馬賽港清晨",
   "path": "ch03/backgrounds/ch03_bg_marseille_harbor_dawn_v01.webp",
   "firstScreen": true,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/ch03/backgrounds/ch03_bg_marseille_harbor_dawn_master_v01.png"
  },
  {
   "id": "bg_ch03_moored_mast_deck",
   "kind": "bg",
   "label": "繫泊船桅甲板",
   "path": "ch03/backgrounds/ch03_bg_moored_mast_deck_v01.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/ch03/backgrounds/ch03_bg_moored_mast_deck_master_v01.png"
  },
  {
   "id": "bg_ch03_steady_sailing_deck",
   "kind": "bg",
   "label": "穩速航行甲板",
   "path": "ch03/backgrounds/ch03_bg_steady_sailing_deck_v01.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/ch03/backgrounds/ch03_bg_steady_sailing_deck_master_v01.png"
  },
  {
   "id": "bg_ch03_enclosed_cabin",
   "kind": "bg",
   "label": "密閉船艙",
   "path": "ch03/backgrounds/ch03_bg_enclosed_cabin_v01.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/ch03/backgrounds/ch03_bg_enclosed_cabin_master_v01.png"
  },
  {
   "id": "bg_ch03_speed_change_deck",
   "kind": "bg",
   "label": "變速航行甲板",
   "path": "ch03/backgrounds/ch03_bg_speed_change_deck_v01.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/ch03/backgrounds/ch03_bg_speed_change_deck_master_v01.png"
  },
  {
   "id": "bg_ch03_reference_tapes_table",
   "kind": "bg",
   "label": "雙紙帶比較桌",
   "path": "ch03/backgrounds/ch03_bg_reference_tapes_table_v01.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/ch03/backgrounds/ch03_bg_reference_tapes_table_master_v01.png"
  },
  {
   "id": "bg_ch03_public_demonstration",
   "kind": "bg",
   "label": "馬賽碼頭公開演示",
   "path": "ch03/backgrounds/ch03_bg_public_demonstration_v01.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/ch03/backgrounds/ch03_bg_public_demonstration_master_v01.png"
  },
  {
   "id": "ship3_g1_mast_dock",
   "kind": "cg",
   "label": "G1 停船桅頂落石互動底板",
   "path": "ch03/experiments/ch03_lab_g1_mast_dock_v01.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/ch03/experiments/ch03_lab_g1_mast_dock_master_v01.png"
  },
  {
   "id": "ship3_g1_mast_steady",
   "kind": "cg",
   "label": "G1 穩速桅頂落石互動底板",
   "path": "ch03/experiments/ch03_lab_g1_mast_steady_v01.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/ch03/experiments/ch03_lab_g1_mast_steady_master_v01.png"
  },
  {
   "id": "ship3_g2_cabin",
   "kind": "cg",
   "label": "G2 封閉船艙共同運動互動底板",
   "path": "ch03/experiments/ch03_lab_g2_cabin_v01.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/ch03/experiments/ch03_lab_g2_cabin_master_v01.png"
  },
  {
   "id": "ship3_g3_accelerating",
   "kind": "cg",
   "label": "G3 加速甲板互動底板",
   "path": "ch03/experiments/ch03_lab_g3_accelerating_v01.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/ch03/experiments/ch03_lab_g3_accelerating_master_v01.png"
  },
  {
   "id": "ship3_g3_decelerating",
   "kind": "cg",
   "label": "G3 減速甲板互動底板",
   "path": "ch03/experiments/ch03_lab_g3_decelerating_v01.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/ch03/experiments/ch03_lab_g3_decelerating_master_v01.png"
  },
  {
   "id": "ship3_g4_reference_tapes",
   "kind": "cg",
   "label": "G4 雙參考系紙帶互動底板",
   "path": "ch03/experiments/ch03_lab_g4_reference_tapes_v01.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/ch03/experiments/ch03_lab_g4_reference_tapes_master_v01.png"
  },
  {
   "id": "ship3_g5_public_boundary",
   "kind": "cg",
   "label": "G5 公開演示與證據邊界互動底板",
   "path": "ch03/experiments/ch03_lab_g5_public_boundary_v01.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/ch03/experiments/ch03_lab_g5_public_boundary_master_v01.png"
  },
  {
   "id": "bg_ch03_print_room_1642",
   "kind": "bg",
   "label": "1642 印刷室",
   "path": "ch03/backgrounds/ch03_bg_print_room_1642_v01.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/ch03/backgrounds/ch03_bg_print_room_1642_master_v01.png"
  },
  {
   "id": "dialogue_gassendi48",
   "kind": "portrait",
   "label": "伽桑狄 48 歲",
   "path": "ch03/characters/ch03_char_gassendi48_v01.webp",
   "firstScreen": true,
   "w": 900,
   "h": 1200,
   "sourceMaster": "art/source/production/ch03/characters/ch03_char_gassendi48_alpha_v01.png"
  },
  {
   "id": "dialogue_captain50",
   "kind": "portrait",
   "label": "馬賽船長約 50 歲",
   "path": "ch03/characters/ch03_char_captain50_v01.webp",
   "firstScreen": false,
   "w": 900,
   "h": 1200,
   "sourceMaster": "art/source/production/ch03/characters/ch03_char_captain50_alpha_v01.png"
  },
  {
   "id": "dialogue_etienne17",
   "kind": "portrait",
   "label": "艾蒂安 17 歲",
   "path": "ch03/characters/ch03_char_etienne17_v01.webp",
   "firstScreen": false,
   "w": 900,
   "h": 1200,
   "sourceMaster": "art/source/production/ch03/characters/ch03_char_etienne17_alpha_v01.png"
  },
  {
   "id": "chapter_thumbnail_ch03",
   "kind": "cg",
   "label": "第三章章節縮圖",
   "path": "ch03/backgrounds/ch03_bg_marseille_harbor_dawn_v01.webp",
   "firstScreen": true,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/ch03/backgrounds/ch03_bg_marseille_harbor_dawn_master_v01.png"
  }
 ],
 "sceneDialoguePortrait": {
  "P0-1": {
   "年輕人": "dialogue_galileo26_neutral",
   "伽利略": "dialogue_galileo26_neutral",
   "辛普里奧": "dialogue_simplicio58_authoritative"
  },
  "P0-2": {
   "年輕人": "dialogue_galileo26_neutral",
   "伽利略": "dialogue_galileo26_neutral",
   "辛普里奧": "dialogue_simplicio58_authoritative"
  },
  "P0-3": {
   "年輕人": "dialogue_galileo26_neutral",
   "伽利略": "dialogue_galileo26_neutral",
   "辛普里奧": "dialogue_simplicio58_authoritative"
  },
  "A1-1": {
   "伽利略": "dialogue_galileo26_skeptical",
   "辛普里奧": "dialogue_simplicio58_authoritative"
  },
  "A1-2": {
   "伽利略": "dialogue_galileo26_skeptical",
   "辛普里奧": "dialogue_simplicio58_authoritative"
  },
  "A1-3": {
   "伽利略": "dialogue_galileo26_skeptical",
   "辛普里奧": "dialogue_simplicio58_authoritative"
  },
  "A1-4": {
   "伽利略": "dialogue_galileo26_curious",
   "辛普里奧": "dialogue_simplicio58_authoritative"
  },
  "A1-5": {
   "伽利略": "dialogue_galileo26_skeptical",
   "辛普里奧": "dialogue_simplicio58_skeptical_smile",
   "助手": "dialogue_assistant_earnest"
  },
  "A1-6": {
   "伽利略": "dialogue_galileo26_crooked_smile",
   "辛普里奧": "dialogue_simplicio58_authoritative"
  },
  "A1-7": {
   "伽利略": "dialogue_galileo26_crooked_smile",
   "辛普里奧": "dialogue_simplicio58_authoritative"
  },
  "INT-1": {
   "伽利略": "dialogue_galileo39_focused",
   "辛普里奧": "dialogue_simplicio72_formidable_calm"
  },
  "A2-1": {
   "伽利略": "dialogue_galileo39_focused",
   "辛普里奧": "dialogue_simplicio72_formidable_calm"
  },
  "A2-2": {
   "伽利略": "dialogue_galileo39_focused",
   "辛普里奧": "dialogue_simplicio72_formidable_calm"
  },
  "A2-3": {
   "伽利略": "dialogue_galileo39_focused",
   "辛普里奧": "dialogue_simplicio72_formidable_calm"
  },
  "A2-4": {
   "伽利略": "dialogue_galileo39_focused",
   "辛普里奧": "dialogue_simplicio72_formidable_calm"
  },
  "SC-R1": {
   "伽利略": "dialogue_galileo44_focused",
   "辛普里奧": "dialogue_simplicio76_formidable_calm"
  },
  "A2-5": {
   "伽利略": "dialogue_galileo39_realization",
   "辛普里奧": "dialogue_simplicio72_formidable_calm"
  },
  "A3-1": {
   "伽利略": "dialogue_galileo39_explaining",
   "辛普里奧": "dialogue_simplicio72_cross_examination",
   "主持": "dialogue_host_formal"
  },
  "A3-D": {
   "伽利略": "dialogue_galileo39_explaining",
   "辛普里奧": "dialogue_simplicio72_cross_examination",
   "主持": "dialogue_host_formal"
  },
  "A3-6": {
   "伽利略": "dialogue_galileo39_explaining",
   "辛普里奧": "dialogue_simplicio72_solemn_respect",
   "主持": "dialogue_host_formal"
  },
  "A3-F": {
   "伽利略": "dialogue_galileo39_focused",
   "辛普里奧": "dialogue_simplicio72_formidable_calm",
   "主持": "dialogue_host_adjournment"
  },
  "E-1": {
   "伽利略": "dialogue_galileo39_realization",
   "辛普里奧": "dialogue_simplicio72_formidable_calm"
  },
  "E-2": {
   "伽利略": "dialogue_galileo39_focused"
  },
  "B0-1": {
   "伽利略": "dialogue_galileo44_focused",
   "辛普里奧": "dialogue_simplicio76_formidable_calm"
  },
  "B0-2": {
   "伽利略": "dialogue_galileo44_focused",
   "辛普里奧": "dialogue_simplicio76_expectant"
  },
  "B1-1": {
   "伽利略": "dialogue_galileo44_focused",
   "辛普里奧": "dialogue_simplicio76_formidable_calm"
  },
  "B1-2": {
   "伽利略": "dialogue_galileo44_focused",
   "辛普里奧": "dialogue_simplicio76_formidable_calm"
  },
  "B1-3": {
   "伽利略": "dialogue_galileo44_focused",
   "辛普里奧": "dialogue_simplicio76_formidable_calm"
  },
  "B1-4": {
   "伽利略": "dialogue_galileo44_focused",
   "辛普里奧": "dialogue_simplicio76_formidable_calm"
  },
  "B2-1": {
   "伽利略": "dialogue_galileo44_explaining",
   "辛普里奧": "dialogue_simplicio76_formidable_calm"
  },
  "B2-2": {
   "伽利略": "dialogue_galileo44_focused",
   "辛普里奧": "dialogue_simplicio76_formidable_calm"
  },
  "B2-3": {
   "伽利略": "dialogue_galileo44_explaining",
   "辛普里奧": "dialogue_simplicio76_formidable_calm"
  },
  "B2-4": {
   "伽利略": "dialogue_galileo44_focused",
   "辛普里奧": "dialogue_simplicio76_formidable_calm"
  },
  "B2-5": {
   "伽利略": "dialogue_galileo44_focused",
   "辛普里奧": "dialogue_simplicio76_formidable_calm"
  },
  "B3-F": {
   "伽利略": "dialogue_galileo44_focused",
   "辛普里奧": "dialogue_simplicio76_formidable_calm"
  },
  "BE-1": {
   "伽利略": "dialogue_galileo44_focused",
   "辛普里奧": "dialogue_simplicio76_formidable_calm"
  },
  "BE-2": {
   "伽利略": "dialogue_galileo44_focused",
   "辛普里奧": "dialogue_simplicio76_formidable_calm"
  },
  "B3-1": {
   "伽利略": "dialogue_galileo44_explaining",
   "辛普里奧": "dialogue_simplicio76_expectant",
   "主持": "dialogue_host_formal"
  },
  "B3-D": {
   "伽利略": "dialogue_galileo44_explaining",
   "辛普里奧": "dialogue_simplicio76_expectant",
   "主持": "dialogue_host_formal"
  },
  "B3-6": {
   "伽利略": "dialogue_galileo44_explaining",
   "辛普里奧": "dialogue_simplicio76_almost_warm",
   "主持": "dialogue_host_formal"
  },
  "C0-1": {
   "伽桑狄": "dialogue_gassendi48"
  },
  "C0-2": {
   "伽桑狄": "dialogue_gassendi48",
   "艦長": "dialogue_captain50"
  },
  "C0-3": {
   "伽桑狄": "dialogue_gassendi48",
   "艦長": "dialogue_captain50"
  },
  "C1-1": {
   "伽桑狄": "dialogue_gassendi48",
   "艾蒂安": "dialogue_etienne17"
  },
  "C1-2": {
   "伽桑狄": "dialogue_gassendi48",
   "艦長": "dialogue_captain50"
  },
  "C1-3": {
   "伽桑狄": "dialogue_gassendi48",
   "艾蒂安": "dialogue_etienne17",
   "艦長": "dialogue_captain50"
  },
  "C1-4": {
   "伽桑狄": "dialogue_gassendi48",
   "艦長": "dialogue_captain50"
  },
  "C2-1": {
   "伽桑狄": "dialogue_gassendi48",
   "艦長": "dialogue_captain50"
  },
  "C2-2": {
   "伽桑狄": "dialogue_gassendi48",
   "艦長": "dialogue_captain50"
  },
  "C2-3": {
   "伽桑狄": "dialogue_gassendi48",
   "艾蒂安": "dialogue_etienne17",
   "艦長": "dialogue_captain50"
  },
  "C2-4": {
   "伽桑狄": "dialogue_gassendi48"
  },
  "C3-1": {
   "伽桑狄": "dialogue_gassendi48"
  },
  "C3-2": {
   "伽桑狄": "dialogue_gassendi48",
   "艦長": "dialogue_captain50"
  },
  "C3-3": {
   "伽桑狄": "dialogue_gassendi48"
  },
  "C3-4": {
   "伽桑狄": "dialogue_gassendi48"
  },
  "CE-1": {
   "伽桑狄": "dialogue_gassendi48",
   "艦長": "dialogue_captain50"
  },
  "CE-2": {
   "伽桑狄": "dialogue_gassendi48"
  }
 },
 "speakerDialoguePortrait": {
  "助手": "dialogue_assistant_earnest",
  "主持": "dialogue_host_formal",
  "年輕人": "dialogue_galileo26_neutral",
  "伽桑狄": "dialogue_gassendi48",
  "艦長": "dialogue_captain50",
  "艾蒂安": "dialogue_etienne17"
 },
 "speakerSide": {
  "伽利略": "right",
  "年輕人": "right",
  "辛普里奧": "left",
  "助手": "left",
  "主持": "right",
  "伽桑狄": "right",
  "艦長": "left",
  "艾蒂安": "left"
 },
 "travelerSilhouette": {
  "left": "dialogue_traveler_silhouette",
  "right": "dialogue_traveler_silhouette_right"
 },
 "prologuePlates": {
  "1": "p0_0_v03_frame01_article",
  "2": "p0_0_v03_frame02_breaking_news",
  "3": "p0_0_v03_frame03_taipei_aurora",
  "4": "p0_0_v03_frame04_reach_tower",
  "5": "p0_0_v03_frame05_tablet_passage",
  "6": "p0_0_v03_frame06_whitefall"
 },
 "lineDialoguePortrait": [
  {
   "scene": "A3-D",
   "speaker": "辛普里奧",
   "match": "夾籤留在了外面",
   "asset": "dialogue_simplicio72_caught_off_guard",
   "note": "P2 綁縛悖論破防:合上書,夾籤留在外面"
  },
  {
   "scene": "A3-D",
   "speaker": "辛普里奧",
   "match": "反而更難駁",
   "asset": "dialogue_simplicio72_solemn_respect",
   "note": "trap 誠實收束:一輩子頭一回"
  },
  {
   "scene": "A2-2",
   "speaker": "伽利略",
   "match": "實驗失敗最常見的樣子",
   "asset": "dialogue_galileo39_frustrated",
   "note": "作廢紀錄前的苦笑"
  },
  {
   "scene": "B2-3",
   "speaker": "伽利略",
   "match": "下落高度二十五格",
   "asset": "dialogue_galileo44_deadpan",
   "note": "ch02-p0p1"
  },
  {
   "scene": "B3-D",
   "speaker": "辛普里奧",
   "match": "提筆,在自己的計算紙上劃掉了一行",
   "asset": "dialogue_simplicio76_strikeout",
   "note": "ch02-p0p1"
  },
  {
   "scene": "B3-6",
   "speaker": "辛普里奧",
   "match": "下一回,老夫出題",
   "asset": "dialogue_simplicio76_almost_warm",
   "note": "ch02-p0p1"
  }
 ],
 "lineFocusVisual": [
  {
   "scene": "P0-2",
   "match": "桌上攤著手稿",
   "items": [
    {
     "asset": "card_S2",
     "alt": "伽利略早期《論運動》手稿的戲劇化證據卡"
    }
   ],
   "caption": "伽利略此時相信的《論運動》手稿——它也會在實驗面前被修正。"
  },
  {
   "scene": "A1-2",
   "match": "布商朋友送來一封",
   "items": [
    {
     "asset": "card_S1",
     "alt": "記述斯泰文在德爾夫特塔樓落球實驗的來信，戲劇化重繪"
    }
   ],
   "caption": "從法蘭德斯輾轉送到比薩的信（戲劇化重繪）。"
  },
  {
   "scene": "A1-5",
   "match": "出示 E1",
   "items": [
    {
     "asset": "card_E1",
     "alt": "比薩高塔落球紀錄：兩顆同材質但重量相差十倍的鉛球近乎同時落地"
    }
   ],
   "caption": "玩家交到辛普里奧手上的高塔落球紀錄。"
  },
  {
   "scene": "A1-7",
   "match": "用鐵鏈把它們綁在一起",
   "items": [
    {
     "evidence": "E2",
     "alt": "綁縛悖論：輕石會拖慢重石，但綁成更重的整體又應該落得更快"
    }
   ],
   "caption": "綁縛悖論：同一個前提，為什麼會同時推出更慢與更快？"
  },
  {
   "scene": "A2-2",
   "match": "長木槽、銅球、水鐘",
   "items": [
    {
     "asset": "prop_water_clock",
     "alt": "水鐘、收集桶與天平"
    },
    {
     "asset": "prop_ball_groove",
     "alt": "斜槽、銅球與調整傾角的墊木"
    }
   ],
   "caption": "本輪可用器材：斜槽、銅球、水鐘與天平。"
  },
  {
   "scene": "A2-2",
   "match": "把第一段當作一個單位",
   "items": [
    {
     "asset": "card_E3",
     "alt": "斜面實驗證據卡：等時段位移呈一、三、五、七的奇數規律"
    }
   ],
   "caption": "把第一段當成一個單位，玩家量出的四段數字開始說話。"
  },
  {
   "scene": "A2-4",
   "match": "取得證據 E4",
   "items": [
    {
     "asset": "card_E4",
     "alt": "介質與形狀對照實驗證據卡：同一張紙與同一組球的單變因比較"
    }
   ],
   "caption": "介質阻力辨析：快慢差異不能直接記在重量頭上。"
  },
  {
   "scene": "E-2",
   "match": "左手一柄鎚",
   "items": [
    {
     "asset": "card_E5",
     "alt": "月球上鎚子與羽毛同時落地的致敬畫面"
    }
   ],
   "caption": "三百六十七年後，人類終於把「沒有空氣」帶上了實驗台。"
  },
  {
   "scene": "B0-2",
   "match": "自袖中取出一張折紙",
   "items": [
    {
     "asset": "card_S3",
     "alt": "砲彈先沿直線上升、再走短弧、最後垂直落下的三段砲術圖，戲劇化重繪"
    }
   ],
   "caption": "辛普里奧展開的塔爾塔利亞砲術圖（戲劇化重繪）"
  },
  {
   "scene": "B1-1",
   "match": "把砲術圖釘在牆上",
   "items": [
    {
     "asset": "card_S3",
     "alt": "砲彈三段軌跡圖：直飛、圓弧與鉛直墜落，戲劇化重繪"
    }
   ],
   "caption": "先別急著嘲笑它——玩家現在看到的，就是角色正在討論的三段圖。"
  },
  {
   "scene": "B2-1",
   "match": "翻開一頁",
   "items": [
    {
     "asset": "card_S4",
     "alt": "Guidobaldo 實驗抄頁：近乎直立的斜板與球留下的彎曲墨跡，戲劇化重繪"
    }
   ],
   "caption": "Guidobaldo 的實驗筆記抄頁（戲劇化重繪）"
  },
  {
   "scene": "B2-2",
   "match": "墨線蜿蜒",
   "items": [
    {
     "asset": "prop_inked_incline_board",
     "alt": "立起的墨跡板上，一條從離手後立刻彎曲的黑色軌跡"
    }
   ],
   "caption": "重做後的墨跡板——請沿著起點找找看，哪一段真正是直的？"
  },
  {
   "scene": "B2-2",
   "match": "把砲術圖拿下來,並排釘上",
   "items": [
    {
     "asset": "card_S3",
     "alt": "砲手畫的三段軌跡圖"
    },
    {
     "asset": "prop_inked_incline_board",
     "alt": "玩家重做、從起點便彎曲的墨跡軌跡"
    }
   ],
   "caption": "並排比較：砲手的三段圖，與玩家親手量過的連續墨線。"
  },
  {
   "scene": "B2-4",
   "match": "機關:桌緣一座小門閂",
   "items": [
    {
     "asset": "workshop2_projectile_apparatus_master",
     "alt": "桌緣彈射裝置：門閂同時水平推出一球並釋放另一球垂直下落"
    }
   ],
   "caption": "雙球機關：一次扳動，同時水平推出一球、原地放下一球。"
  },
  {
   "scene": "B2-4",
   "match": "三輪紀錄在案",
   "items": [
    {
     "asset": "card_F3",
     "alt": "同一門閂釋放兩顆相同球：左球直落、右球向前運動並同時下墜；成對殘影表示相同時刻的兩球位置"
    }
   ],
   "caption": "每一條橫向虛線代表同一時刻：向前的球與直落的球，下降高度仍然一致。"
  },
  {
   "scene": "B2-4",
   "match": "如果物體真的要等推力用盡才下墜",
   "items": [
    {
     "asset": "card_F3",
     "alt": "一顆球垂直落下，另一顆球沿弧線向前落下；等時位置的垂直高度互相對齊"
    }
   ],
   "caption": "圖只重畫裝置聽見的結果；能說到哪裡，仍由你的三輪紀錄決定。"
  },
  {
   "scene": "B2-5",
   "match": "牆上:砲術圖",
   "items": [
    {
     "asset": "card_S3",
     "alt": "砲術三段圖"
    },
    {
     "asset": "prop_inked_incline_board",
     "alt": "墨跡曲線板"
    },
    {
     "asset": "workshop2_projectile_apparatus_master",
     "alt": "桌緣彈射裝置與沙盤"
    },
    {
     "asset": "card_S4",
     "alt": "Guidobaldo 實驗筆記抄頁"
    }
   ],
   "caption": "第二幕的證據牆：問題來源、前人線索、玩家裝置與親測墨跡並排。"
  }
 ],
 "sceneFx": {
  "INT-1": {
   "fx": "timejump",
   "years": [
    1592,
    1597,
    1602,
    1603
   ],
   "plates": [
    "int1_pisa_notebook",
    "int1_time_passage",
    "int1_padua_notebook"
   ]
  }
 },
 "sceneBgm": {
  "P0-1": "pisa",
  "A1-2": "pisa",
  "A1-3": "pisa",
  "A1-4": "silence",
  "A1-5": "silence",
  "P0-2": "study",
  "P0-3": "study",
  "A1-1": "rain",
  "A1-7": "rain",
  "A1-6": "study",
  "INT-1": "timePassage",
  "A2-1": "workshop",
  "A2-2": "workshop",
  "A2-3": "workshop",
  "A2-4": "workshop",
  "A2-5": "challenge",
  "A3-F": "debrief",
  "SC-R1": "workshop",
  "ch2:SC-R1": "ch2Catapult",
  "A3-1": "hall",
  "A3-D": "hall",
  "A3-6": "silence",
  "E-1": "dusk",
  "E-2": "travelerMoon",
  "B0-1": "ch2OldPage",
  "B0-2": "ch2Cannon",
  "B1-1": "ch2Ink",
  "B1-2": "ch2Shipmast",
  "B1-3": "ch2Ink",
  "B1-4": "ch2Canal",
  "B2-1": "ch2Ink",
  "B2-2": "ch2Ink",
  "B2-3": "ch2Catapult",
  "B2-4": "ch2Catapult",
  "B2-5": "ch2Cannon",
  "B3-1": "ch2Debate",
  "B3-D": "ch2Debate",
  "B3-F": "ch2Debrief",
  "B3-6": "silence",
  "BE-1": "ch2Telescope",
  "BE-2": "travelerMoon",
  "C0-1": "ch3Harbor",
  "C0-2": "ch3Harbor",
  "C0-3": "ch3Harbor",
  "C1-1": "ch3Experiment",
  "C1-2": "ch3Experiment",
  "C1-3": "ch3Experiment",
  "C1-4": "ch3Experiment",
  "C2-1": "ch3Cabin",
  "C2-2": "ch3Experiment",
  "C2-3": "ch3Overlay",
  "C2-4": "ch3Overlay",
  "C3-1": "ch3Public",
  "C3-2": "ch3Public",
  "C3-3": "ch3Public",
  "C3-4": "ch3Public",
  "CE-1": "ch3Print",
  "CE-2": "ch3Print"
 },
 "audioBasePath": "../public/assets/audio/",
 "bgmVersion": 2,
 "bgmFiles": {
  "travelerTitle": {
   "mode": "once",
   "clips": [
    "common/Traveler_Theme_Title_A.mp3"
   ]
  },
  "travelerMoon": {
   "mode": "once",
   "clips": [
    "common/Traveler_Theme_Moon_B.mp3"
   ]
  },
  "pisa": {
   "mode": "once",
   "repeatGapMs": 5000,
   "clips": [
    "ch01/Piazza_at_Dawn.mp3"
   ]
  },
  "study": {
   "mode": "once",
   "repeatGapMs": 5000,
   "clips": [
    "ch01/Sun_Through_Lattice.mp3"
   ]
  },
  "rain": {
   "mode": "once",
   "repeatGapMs": 5000,
   "clips": [
    "ch01/Midnight_at_the_Casement.mp3"
   ]
  },
  "timePassage": {
   "mode": "once",
   "clips": [
    "ch01/Eleven_Years_Time_Passage.mp3"
   ]
  },
  "workshop": {
   "mode": "milestone",
   "repeatGapMs": 5000,
   "clips": [
    "ch01/Workshop_Inquiry_A.mp3",
    "ch01/Workshop_Inquiry_B.mp3",
    "ch01/Workshop_Inquiry_C.mp3"
   ]
  },
  "challenge": {
   "mode": "once",
   "repeatGapMs": 5000,
   "clips": [
    "ch01/Debate_Hall_A.mp3"
   ]
  },
  "hall": {
   "mode": "milestone",
   "repeatGapMs": 5000,
   "clips": [
    "ch01/Debate_Hall_A.mp3",
    "ch01/Debate_Hall_B.mp3",
    "ch01/Debate_Hall_C.mp3"
   ]
  },
  "debrief": {
   "mode": "once",
   "repeatGapMs": 5000,
   "clips": [
    "ch01/Debate_Debrief.mp3"
   ]
  },
  "dusk": {
   "mode": "once",
   "repeatGapMs": 5000,
   "clips": [
    "ch01/Where_The_Sun_Rests.mp3"
   ]
  },
  "ch2OldPage": {
   "mode": "once",
   "repeatGapMs": 5000,
   "clips": [
    "ch02/Ch2_Old_Page_Returns.mp3"
   ]
  },
  "ch2Cannon": {
   "mode": "once",
   "repeatGapMs": 5000,
   "clips": [
    "ch02/Ch2_Cannon_Question.mp3"
   ]
  },
  "ch2Ink": {
   "mode": "once",
   "repeatGapMs": 5000,
   "clips": [
    "ch02/Ch2_Ink_And_Motion.mp3"
   ]
  },
  "ch2Shipmast": {
   "mode": "once",
   "repeatGapMs": 5000,
   "clips": [
    "ch02/Ch2_Shipmast_Rain.mp3"
   ]
  },
  "ch2Canal": {
   "mode": "once",
   "repeatGapMs": 5000,
   "clips": [
    "ch02/Ch2_Canal_Impasse.mp3"
   ]
  },
  "ch2Catapult": {
   "mode": "milestone",
   "repeatGapMs": 5000,
   "clips": [
    "ch02/Ch2_Catapult_A.mp3",
    "ch02/Ch2_Catapult_B.mp3",
    "ch02/Ch2_Catapult_C.mp3"
   ]
  },
  "ch2Debate": {
   "mode": "milestone",
   "repeatGapMs": 5000,
   "clips": [
    "ch02/Ch2_Debate_A.mp3",
    "ch02/Ch2_Debate_B.mp3",
    "ch02/Ch2_Debate_C.mp3"
   ]
  },
  "ch2Debrief": {
   "mode": "once",
   "repeatGapMs": 5000,
   "clips": [
    "ch02/Ch2_Debate_Debrief.mp3"
   ]
  },
  "ch2Telescope": {
   "mode": "once",
   "repeatGapMs": 5000,
   "clips": [
    "ch02/Ch2_Telescope_Dusk.mp3"
   ]
  },
  "ch3Harbor": {
   "mode": "once",
   "repeatGapMs": 5000,
   "temporaryReuse": true,
   "clips": [
    "ch01/Piazza_at_Dawn.mp3"
   ]
  },
  "ch3Experiment": {
   "mode": "once",
   "repeatGapMs": 5000,
   "temporaryReuse": true,
   "clips": [
    "ch02/Ch2_Shipmast_Rain.mp3"
   ]
  },
  "ch3Cabin": {
   "mode": "once",
   "repeatGapMs": 5000,
   "temporaryReuse": true,
   "clips": [
    "ch01/Midnight_at_the_Casement.mp3"
   ]
  },
  "ch3Overlay": {
   "mode": "once",
   "repeatGapMs": 5000,
   "temporaryReuse": true,
   "clips": [
    "ch02/Ch2_Ink_And_Motion.mp3"
   ]
  },
  "ch3Public": {
   "mode": "milestone",
   "repeatGapMs": 5000,
   "temporaryReuse": true,
   "clips": [
    "ch02/Ch2_Debate_A.mp3",
    "ch02/Ch2_Debate_B.mp3",
    "ch02/Ch2_Debate_C.mp3"
   ]
  },
  "ch3Print": {
   "mode": "once",
   "repeatGapMs": 5000,
   "temporaryReuse": true,
   "clips": [
    "ch01/Sun_Through_Lattice.mp3"
   ]
  },
  "silence": {
   "mode": "silence",
   "clips": []
  },
  "storm": null
 },
 "evidenceSummary": {
  "E1": "只能證明「近乎同落」——排除不了空氣與形狀。",
  "E2": "同一前提,同時推出更快與更慢。",
  "E3a": "規律本身成立——但還沒說它跟什麼無關。",
  "E3b": "只換球重,規律沒有改變。",
  "E3c": "換了傾角,規律的形狀仍然不變。",
  "E4": "重量沒變,只改形狀或介質,先後就變了。",
  "S1": "歷史背景——別人也做過,不是你的主證。",
  "S2": "他也曾卡住——是故事,不是反證。",
  "F1": "船在等速前行時，桅頂落球仍落回桅腳——共同前行不會消失。",
  "F2": "同一裝置下，射程隨下落高度的開方增長；換同徑木球仍保持。",
  "F3": "一顆水平拋出、一顆原地放下；兩顆近乎同時落地，向前運動沒有讓下墜延後。",
  "F4": "沾墨軌跡從離手第一寸就開始彎，找不到真正的直飛段。",
  "F5": "低速短程的骨架站得住；長程砲彈的偏離標出空氣開始主導的邊界。",
  "S3": "砲手的三段圖是真實問題來源，不是證明三段論正確的主證。",
  "S4": "前人的實驗筆記提供線索，但主張仍須由你自己的裝置與數據成立。"
 },
 "workshopApparatusAsset": "workshop2_projectile_apparatus_master",
 "workshopPartAsset": {
  "latchRelease": "part_latchRelease",
  "handRelease": "part_handRelease",
  "polishedEdge": "part_polishedEdge",
  "roughEdge": "part_roughEdge",
  "rakedSand": "part_rakedSand",
  "eyeBoard": "part_eyeBoard",
  "fineSandPlumb": "part_fineSandPlumb"
 },
 "workshopPartGuide": {
  "latchRelease": {
   "detail": "用門閂在同一刻度放球，出手較容易重複；更換釋放方式後，發射零位要重新校準。",
   "coach": "門閂替手指守住同一個起點。"
  },
  "handRelease": {
   "detail": "直接用手放球最省事，但手指施力和離手時刻可能每次不同；更換後要重新校準發射零位。",
   "coach": "手很方便，只是每次鬆開，都可能多推一點、少推一點。"
  },
  "polishedEdge": {
   "detail": "桌沿平順，球離桌時的方向較容易一致；適合比較射程隨高度怎麼改變。",
   "coach": "桌沿齊，球離手的方向才容易一致。"
  },
  "roughEdge": {
   "detail": "桌沿毛邊可能讓球離桌方向散開；可觀察落點是否跟著變寬。",
   "coach": "一道毛邊不會說話，但會把散布寫進沙裡。"
  },
  "rakedSand": {
   "detail": "先耙平沙面再讀新落點；量測前仍要校準沙盤標尺。",
   "coach": "先把舊痕耙平，這一輪才不會和上一輪混在一起。"
  },
  "eyeBoard": {
   "detail": "靠目測板快速估讀落點，但每筆只會得到較寬的讀值區間；量測前仍要校準標尺。",
   "coach": "眼睛很快，可惜每次『差不多』的邊界都不太一樣。"
  },
  "fineSandPlumb": {
   "detail": "細沙留下清楚落點，鉛垂規定義桌沿正下方；能分辨較小差異，量測前仍要校準標尺。",
   "coach": "鉛垂線告訴我們從哪裡起算，細沙把落點留下。"
  }
 },
 "chapterThumbnail": {
  "ch02": "chapter_thumbnail_ch02",
  "ch03": "chapter_thumbnail_ch03"
 }
};
 if (typeof module === "object" && module.exports) { module.exports = data; }
 else { root.GB = root.GB || {}; root.GB.DATA = root.GB.DATA || {}; root.GB.DATA.assets = data; }
})(typeof self !== "undefined" ? self : this);
