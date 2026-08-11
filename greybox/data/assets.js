/* data/assets.js — 執行載體(file:// 相容)。規範鏡像:assets.json（測試把關）。
   ⚠ 本檔為生成物；請改 assets.json 後執行 node tools/build-assets.mjs。 */
(function (root) {
 "use strict";
 var data = {
 "version": 1,
 "basePath": "../public/assets/",
 "note": "path=null 即該槽尚無 runtime 資產,UI 全面 fallback(灰盒不變)。Sol 只需:轉出 WebP 放入 public/assets/,把 path 填上;程式零改動。layers 欄位=ART-ADR-001 混合制(base+臉層,anchorX/anchorY/w 以母版座標記)。 sceneDialoguePortrait[場景][講者]→場景覆寫,speakerDialoguePortrait[講者]→對話預設,speakerPortrait[講者]→舊筆記頭像 fallback(遮罩呈現)。旅人一律不入對話肖像映射(壓暗對手呈現);dialogue_traveler_silhouette 僅供章末/筆記/A-B。 speakerSide[講者]→雙槽站位(依原圖朝向,永不鏡像);travelerSilhouette[side]→旅人剪影按側選圖(預設開啟,?travelerBust=0 撤回)。 prologuePlates[板號]→序幕 P0-0 v03 六板(文字直生於圖;拍映射 n1-n2→1/n3→2/n4-n5→3/n6→4/n7→5/n8-n9→6;程式僅交叉淡化+字幕+題詞+無障礙文字;v01/v02 廢案禁引)。 lineDialoguePortrait[{scene,speaker,match,asset}]→台詞級表情覆寫(最高優先;子字串比對;年代守衛測試把關)。 lineFocusVisual[{scene,match,items,caption}]→台詞提及圖像或器材時自動入鏡,同場景保留、換場清除。viewFocusVisual[{scene,nodeIds,match}]→互動節點重叫指定 lineFocusVisual；用於操作前持續看裝置、判讀時才換結果圖，讀檔直落選項亦成立。 sceneTreatment[場景]→短幕表現狀態；time-passage 只讓世界退到近黑並保留對話，不取代逐拍蒙太奇。 sceneFx[場景]→章首／跨年 montage；steps[{plate,label,caption}] 依序溶接，時間、地點與交棒者由 HTML 字幕呈現，僅活戲播放，缺圖則略過而不阻斷流程。 sceneBgm[場景]→程序化環境音樂 mood(pisa/study/rain/workshop/hall/dusk;storm=序幕專用;Web Audio 合成零資產,聲音鈕總開關)。 bgmFiles[mood]→真音樂檔(mp3/ogg,放 public/assets/audio/ 填檔名即播,交叉淡入;null=回退程序化合成;storm 建議留合成=現代場景用合成器,1590 用真琴,音色本身就是穿越)。授權紀錄=public/assets/audio/README.md。 Batch03:title_background/histfacts_banner/card_E1·E3·E4·E5 專圖(card_E2 恆 null=程式 SVG);證據卡解析=card_<code> 優先,缺圖回退 template。 evidenceSummary[證據(+子項)]→手牌白話摘要(語意透明化,不標正解)。",
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
  "INT-C1": "bg_ch03_marseille_harbor_dawn",
  "C0-3": "bg_ch03_marseille_harbor_dawn",
  "C1-1": "bg_ch03_moored_mast_deck",
  "C1-2": "bg_ch03_steady_sailing_deck",
  "C1-3": "bg_ch03_steady_sailing_deck",
  "C1-4": "bg_ch03_steady_sailing_deck",
  "C1-5": "bg_ch03_steady_sailing_deck",
  "C2-1": "bg_ch03_enclosed_cabin",
  "C2-2": "bg_ch03_speed_change_deck",
  "C2-2B": "bg_ch03_return_to_quay",
  "C2-3": "bg_ch03_return_to_quay",
  "C2-4": "bg_ch03_reference_tapes_table",
  "C3-1": "bg_ch03_public_demonstration",
  "INT-C2": "bg_ch03_public_demonstration",
  "C3-2": "bg_ch03_public_demonstration",
  "C3-3": "bg_ch03_public_demonstration",
  "C3-4": "bg_ch03_public_demonstration",
  "CE-1": "bg_ch03_print_room_1642",
  "CE-2": "bg_ch03_print_room_1642",
  "SC3-R1": "bg_ch03_public_demonstration",
  "D0-1": "bg_ch03_print_room_1642",
  "D0-2": "bg_ch04_woolsthorpe_orchard_1665",
  "D1-1": "bg_ch04_woolsthorpe_study_1665",
  "D1-2": "bg_ch04_woolsthorpe_study_1665",
  "D-INT-1": "bg_ch04_woolsthorpe_study_1665",
  "D1-3": "bg_ch04_woolsthorpe_study_1665",
  "D2-1": "bg_ch04_cambridge_hooke_letter_1679",
  "D2-2": "bg_ch04_cambridge_hooke_letter_1679",
  "D2-3": "bg_ch04_cambridge_halley_1684",
  "D3-1": "bg_ch04_cambridge_halley_1684",
  "D3-2": "bg_ch04_greenwich_observatory_1680s",
  "D3-3": "bg_ch04_london_printshop_1687",
  "D3-4": "bg_ch04_london_printshop_1687",
  "D4-1": "bg_ch04_cambridge_halley_1684",
  "D4-2": "bg_ch04_london_printshop_1687",
  "DE-1": "bg_ch04_london_printshop_1687",
  "DE-2": "bg_ch04_typecase_collision_epilogue",
  "SC4-R1": "bg_ch04_london_printshop_1687",
  "ch5:E0-1": "bg_ch05_cirey_library_day",
  "ch5:E0-2": "bg_ch05_cirey_library_day",
  "ch5:E1-1": "bg_ch05_cirey_library_day",
  "ch5:E1-2": "bg_ch05_cirey_library_day",
  "ch5:E2-1": "bg_ch05_cirey_library_day",
  "ch5:E2-2": "bg_ch05_cirey_library_day",
  "ch5:E2-3": "bg_ch05_cirey_library_day",
  "ch5:E3-1": "bg_ch05_cirey_debate_evening",
  "ch5:E3-2": "bg_ch05_cirey_debate_evening",
  "ch5:EE-1": "bg_ch05_cirey_epilogue_night",
  "ch5:EE-2": "bg_ch05_cirey_epilogue_night",
  "ch5:SC5-R1": "bg_ch05_cirey_debate_evening",
  "ch6:H0-1": "bg_ch06_munich_arsenal_boring_floor_day",
  "ch6:H0-2": "bg_ch06_munich_arsenal_boring_floor_day",
  "ch6:H0-3": "bg_ch06_munich_chip_calorimetry_bench",
  "ch6:H1-1": "bg_ch06_munich_chip_calorimetry_bench",
  "ch6:H1-2": "bg_ch06_munich_arsenal_boring_floor_day",
  "ch6:H1-3": "bg_ch06_munich_arsenal_boring_floor_day",
  "ch6:H2-1": "bg_ch06_munich_airtight_bore_test",
  "ch6:H2-2": "bg_ch06_munich_water_box_setup",
  "ch6:H2-3": "bg_ch06_munich_water_box_boiling_evening",
  "ch6:H3-1": "bg_ch06_munich_model_audit_night",
  "ch6:H3-2": "bg_ch06_munich_model_audit_night",
  "ch6:HE-1": "bg_ch06_munich_joint_page_dawn",
  "ch6:SC6-R1": "bg_ch06_munich_model_audit_night",
  "ch7:EM7-0": "bg_ch07_bologna_rain_arrival",
  "ch7:EM7-1": "bg_ch07_galvani_anatomy_study_day",
  "ch7:EM7-2": "bg_ch07_galvani_matrix_table",
  "ch7:EM7-3": "bg_ch07_volta_pavia_lab",
  "ch7:EM7-4": "bg_ch07_galvani_return_evening",
  "ch7:EM7-E": "bg_ch07_aldini_study_1800_dawn",
  "ch7:SC7-R1": "bg_ch07_galvani_matrix_table"
 },
 "apparatusBriefings": {
  "ch3:C1-1": {
   "title": "先看懂誰會留下哪一張紙",
   "subtitle": "沿著四個亮點檢查。器材不替你回答；它們只決定這趟能留下哪些紀錄。",
   "plateAsset": "ship3_apparatus_survey",
   "speaker": "伽桑狄",
   "enterLabel": "器材與分工看清楚了，開始設計航次",
   "items": [
    {
     "id": "releaseRig",
     "label": "桅頂放手裝置",
     "asset": "ship3_apparatus_survey",
     "x": 38,
     "y": 7,
     "function": "石頭可以徒手鬆開、剪斷吊繩，或抽開門閂。不同做法會留下不同程度的手推與擺動干擾。",
     "line": "別只問石頭落在哪裡。先問：它究竟是怎麼離手的。"
    },
    {
     "id": "beatDrum",
     "label": "等拍鼓",
     "asset": "ship3_apparatus_survey",
     "x": 17,
     "y": 85,
     "function": "水手維持固定節拍；岸上和船上的記錄員每聽見同一號鼓點，就各自在自己的紙上標一次位置。",
     "line": "鼓聲不量位置。它只讓兩張紙說的是同一個時刻。"
    },
    {
     "id": "landingTray",
     "label": "沙盤與鉛垂線",
     "asset": "ship3_apparatus_survey",
     "x": 45,
     "y": 82,
     "function": "沙盤留下石頭的落點；桅腳鉛垂線提供船上量位置的起點。落點留下來後，不能為了辯論再補畫。",
     "line": "先把桅腳定下來。沒有起點，『前』和『後』只是一句話。"
    },
    {
     "id": "paperRulers",
     "label": "格紙與量尺",
     "asset": "ship3_apparatus_survey",
     "x": 59,
     "y": 91,
     "function": "岸上以碼頭岸標為起點，船上以桅腳為起點。兩位觀察者各畫原紙，不能先把彼此的結果換算成想看的樣子。",
     "line": "兩張紙可以都是真的。先讓它們各自把看見的東西留下來。"
    }
   ]
  },
  "ch5:E1-1": {
   "title": "先看桌上的三份紙",
   "subtitle": "先別選哪一派。把兩種記法與一份實驗報告各自看清楚，再決定怎麼比較。",
   "plateAsset": "bg_ch05_cirey_library_day",
   "itemNoun": "紙件",
   "triggerNode": "q1",
   "speaker": "杜夏特萊",
   "enterLabel": "三份紙看清楚了，決定怎麼比較",
   "items": [
    {
     "id": "dupreLedger",
     "label": "杜佩院士的舊帳",
     "asset": "card_S6",
     "x": 16,
     "y": 79,
     "function": "碰撞前與碰撞後各記一邊。每筆把質量乘上帶方向的速度，再看兩邊合計是否相等。",
     "line": "這本帳用了三十年。先承認它每次都算得通。"
    },
    {
     "id": "visVivaLedger",
     "label": "另一種算法的空帳",
     "asset": "card_J2",
     "x": 82,
     "y": 79,
     "function": "另一張演算把質量乘速度之後，再乘一次速度。它只是另一種記法，還沒有被這張紙證明。",
     "line": "先看懂它怎麼記，別急著替它宣布勝負。"
    },
    {
     "id": "clayReport",
     "label": "萊頓來的黏土報告",
     "asset": "card_S7",
     "x": 72,
     "y": 91,
     "function": "同一顆球從不同高度落下，油灰坑深逐筆記錄。這份報告尚未說明它應該接到哪一本帳。",
     "line": "它只留下痕跡。兩本帳誰能讀它，還得另外查。"
    }
   ]
  },
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
 "shipPerspectiveIntro": {
  "shore": "ship3_g4_shore_perspective",
  "ship": "ship3_g1_mast_steady"
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
   "sourceMaster": "art/source/production/ch01/cards/final/ch01_card_E1_master_v01.png",
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
   "historicalDebt": {
    "status": "generated-base-source-not-archived",
    "identity": "教學示意底圖，非史料",
    "reason": "既有生圖底板未保存可驗證母版；精確物理關係由程式圖層負責。"
   },
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
   "sourceMaster": "art/source/production/ch01/cards/final/ch01_card_E3_master_v01.png",
   "w": 800,
   "h": 500
  },
  {
   "id": "card_E4",
   "kind": "card",
   "label": "介質阻力辨析",
   "path": "ch01/cards/card_E4.webp",
   "firstScreen": false,
   "sourceMaster": "art/source/production/ch01/cards/final/ch01_card_E4_master_v01.png",
   "w": 800,
   "h": 500
  },
  {
   "id": "card_E5",
   "kind": "card",
   "label": "外推論證鏈",
   "path": "ch01/cards/card_E5.webp",
   "firstScreen": false,
   "sourceMaster": "art/source/production/ch01/cards/final/ch01_card_E5_master_v01.png",
   "w": 800,
   "h": 500
  },
  {
   "id": "card_S1",
   "kind": "card",
   "label": "德爾夫特來的信",
   "path": "ch01/cards/card_S1_neutral_v02.webp",
   "firstScreen": false,
   "sourceMaster": "art/source/production/ch01/cards/ch01_card_S1_delft_letter_neutral_master_v02.png",
   "w": 800,
   "h": 500
  },
  {
   "id": "card_S2",
   "kind": "card",
   "label": "《論運動》手稿",
   "path": "ch01/cards/card_S2_neutral_v02.webp",
   "firstScreen": false,
   "sourceMaster": "art/source/production/ch01/cards/ch01_card_S2_de_motu_neutral_master_v02.png",
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
   "id": "prop_paper_shape_balance",
   "kind": "prop",
   "label": "同一張紙的形狀與重量對照",
   "path": "ch01/props/prop_paper_shape_balance_v01.jpg",
   "firstScreen": false,
   "sourceMaster": "OpenAI imagegen 2026-07-22；攤平紙／紙團置於水平天平兩端，不呈現落下快慢",
   "w": 1586,
   "h": 992
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
   "id": "ch01_transition_first_arrival_pisa_v01",
   "kind": "bg",
   "label": "章首轉場・1590 比薩首次落地",
   "path": "ch01/transitions/ch01_transition_first_arrival_pisa_v01.png",
   "firstScreen": true,
   "w": 1672,
   "h": 941
  },
  {
   "id": "ch01_focus_canal_first_arc_v01",
   "kind": "bg",
   "label": "小說特寫・運河上第一道未解的弧",
   "path": "ch01/transitions/ch01_focus_canal_first_arc_v01.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/ch01/transitions/ch01_focus_canal_first_arc_master_v01.png"
  },
  {
   "id": "ch02_transition_old_page_handoff_v01",
   "kind": "bg",
   "label": "章首轉場・1608 舊頁交棒",
   "path": "ch02/transitions/ch02_transition_old_page_handoff_v01.png",
   "firstScreen": false,
   "w": 1672,
   "h": 941
  },
  {
   "id": "ch02_transition_1604_1608_pagefold_v01",
   "kind": "bg",
   "label": "章首轉場・1604 至 1608 筆記折頁",
   "path": "ch02/transitions/ch02_transition_1604_1608_pagefold_v01.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/ch02/transitions/ch02_transition_1604_1608_pagefold_master_v01.png"
  },
  {
   "id": "ch02_transition_simplicio_returns_v01",
   "kind": "bg",
   "label": "章首轉場・辛普里奧攜舊證據回返",
   "path": "ch02/transitions/ch02_transition_simplicio_returns_v01.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/ch02/transitions/ch02_transition_simplicio_returns_master_v01.png"
  },
  {
   "id": "ch02_focus_ship_mast_thought_v01",
   "kind": "bg",
   "label": "小說特寫・紙上船桅待驗預測",
   "path": "ch02/transitions/ch02_focus_ship_mast_thought_v01.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/ch02/transitions/ch02_focus_ship_mast_thought_master_v01.png"
  },
  {
   "id": "ch03_transition_1609_question_departs_v01",
   "kind": "bg",
   "label": "章首轉場・1609 問題留下",
   "path": "ch03/transitions/ch03_transition_1609_question_departs_v01.png",
   "firstScreen": false,
   "w": 1672,
   "h": 941
  },
  {
   "id": "ch03_transition_1610_jupiter_observation_v01",
   "kind": "bg",
   "label": "章首轉場・1610 木星觀測",
   "path": "ch03/transitions/ch03_transition_1610_jupiter_observation_v01.webp",
   "firstScreen": false,
   "w": 1672,
   "h": 941,
   "sourceMaster": "art/source/production/ch03/transitions/ch03_transition_1610_jupiter_observation_master_v01.png"
  },
  {
   "id": "ch03_transition_1616_roman_admonition_v01",
   "kind": "bg",
   "label": "章首轉場・1616 羅馬告誡",
   "path": "ch03/transitions/ch03_transition_1616_roman_admonition_v01.webp",
   "firstScreen": false,
   "w": 1672,
   "h": 941,
   "sourceMaster": "art/source/production/ch03/transitions/ch03_transition_1616_roman_admonition_master_v01.png"
  },
  {
   "id": "ch03_transition_1632_dialogue_ship_page_v01",
   "kind": "bg",
   "label": "章首轉場・1632 對話船頁",
   "path": "ch03/transitions/ch03_transition_1632_dialogue_ship_page_v01.png",
   "firstScreen": false,
   "w": 1672,
   "h": 941,
   "sourceMaster": "art/source/production/ch03/transitions/ch03_transition_1632_dialogue_ship_page_v01.png"
  },
  {
   "id": "ch03_transition_1633_roman_statement_v01",
   "kind": "bg",
   "label": "章首轉場・1633 羅馬聲明",
   "path": "ch03/transitions/ch03_transition_1633_roman_statement_v01.webp",
   "firstScreen": false,
   "w": 1672,
   "h": 941,
   "sourceMaster": "art/source/production/ch03/transitions/ch03_transition_1633_roman_statement_master_v01.png"
  },
  {
   "id": "ch03_transition_1640_gassendi_handoff_v01",
   "kind": "bg",
   "label": "章首轉場・1640 伽桑狄接棒",
   "path": "ch03/transitions/ch03_transition_1640_gassendi_handoff_v01.png",
   "firstScreen": false,
   "w": 1672,
   "h": 941
  },
  {
   "id": "ch03_focus_two_books_1642_v01",
   "kind": "bg",
   "label": "小說特寫・兩本書與未朗讀的信",
   "path": "ch03/transitions/ch03_focus_two_books_1642_v01.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/ch03/transitions/ch03_focus_two_books_1642_master_v01.png"
  },
  {
   "id": "ch03_focus_unfinished_arc_to_moon_v01",
   "kind": "bg",
   "label": "小說特寫・雙紙帶延長成月亮問題",
   "path": "ch03/transitions/ch03_focus_unfinished_arc_to_moon_v01.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/ch03/transitions/ch03_focus_unfinished_arc_to_moon_master_v01.png"
  },
  {
   "id": "ch04_transition_1642_question_opens_v01",
   "kind": "bg",
   "label": "章首轉場・1642 問題打開時間通道",
   "path": "ch04/transitions/ch04_transition_1642_question_opens_v01.webp",
   "firstScreen": true,
   "w": 1672,
   "h": 941,
   "sourceMaster": "art/source/production/ch04/transitions/ch04_transition_1642_question_opens_master_v01.png"
  },
  {
   "id": "ch04_transition_1655_paper_passage_v01",
   "kind": "bg",
   "label": "章首轉場・1642 至 1665 紙頁時間通道",
   "path": "ch04/transitions/ch04_transition_1655_paper_passage_v01.webp",
   "firstScreen": true,
   "w": 1672,
   "h": 941,
   "sourceMaster": "art/source/production/ch04/transitions/ch04_transition_1655_paper_passage_master_v01.png"
  },
  {
   "id": "ch04_transition_1665_woolsthorpe_arrival_v01",
   "kind": "bg",
   "label": "章首轉場・1665 抵達 Woolsthorpe",
   "path": "ch04/transitions/ch04_transition_1665_woolsthorpe_arrival_v01.webp",
   "firstScreen": true,
   "w": 1672,
   "h": 941,
   "sourceMaster": "art/source/production/ch04/transitions/ch04_transition_1665_woolsthorpe_arrival_master_v01.png"
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
   "label": "1608 雨夜推演室・船桅待驗預測",
   "path": "ch02/backgrounds/ch02_bg_workshop_theory_rain_night_v01.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/ch02/backgrounds/ch02_bg_workshop_theory_rain_night_master_v01.png"
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
   "sourceMaster": "art/source/production/ch02/props/ch02_prop_projectile_apparatus_master_chroma_v01.png"
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
   "sourceMaster": "art/source/production/ch02/props/ch02_prop_inked_incline_board_chroma_v01.png"
  },
  {
   "id": "card_S3",
   "kind": "card",
   "label": "塔爾塔利亞砲術圖・教學重建",
   "path": "ch02/cards/card_S3_neutral_v02.webp",
   "firstScreen": false,
   "w": 800,
   "h": 500,
   "sourceMaster": "art/source/production/ch02/cards/ch02_card_S3_tartaglia_neutral_master_v02.png"
  },
  {
   "id": "card_S4",
   "kind": "card",
   "label": "Guidobaldo 實驗筆記・教學重建",
   "path": "ch02/cards/card_S4_neutral_v02.webp",
   "firstScreen": false,
   "w": 800,
   "h": 500,
   "sourceMaster": "art/source/production/ch02/cards/ch02_card_S4_guidobaldo_neutral_master_v02.png"
  },
  {
   "id": "card_F1_neutral_v02",
   "kind": "card",
   "label": "F1 船桅落球・待驗預測",
   "path": "ch02/cards/ch02_card_F1_mast_prediction_neutral_v02.webp",
   "firstScreen": false,
   "w": 800,
   "h": 500,
   "sourceMaster": "art/source/production/ch02/cards/ch02_card_F1_mast_prediction_neutral_master_v02.png"
  },
  {
   "id": "card_F3",
   "kind": "card",
   "label": "F3 一拋一放・等時位置",
   "path": "ch02/cards/card_F3.webp",
   "firstScreen": false,
   "w": 1200,
   "h": 750,
   "sourceMaster": "art/source/production/ch02/cards/ch02_card_F3_simultaneous_release_master_v01.png"
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
   "id": "card_S5",
   "kind": "card",
   "label": "S5 《對話》的船艙論證（史料意象圖）",
   "path": "ch03/cards/ch03_card_S5_dialogue_ship_cabin_v01.webp",
   "firstScreen": false,
   "w": 1200,
   "h": 750,
   "sourceMaster": "art/source/production/ch03/cards/ch03_card_S5_dialogue_ship_cabin_master_v01.png"
  },
  {
   "id": "ch03_focus_old_paper_dossier_v01",
   "kind": "cg",
   "label": "維達爾船長舊紙正面（戲劇化重建）",
   "path": "ch03/props/ch03_focus_old_paper_dossier_v01.webp",
   "firstScreen": false,
   "w": 1672,
   "h": 941,
   "sourceMaster": "art/source/production/ch03/props/ch03_focus_old_paper_dossier_master_v01.png"
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
   "path": "ch03/backgrounds/ch03_bg_enclosed_cabin_v02.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/ch03/backgrounds/ch03_bg_enclosed_cabin_master_v02.png"
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
   "id": "bg_ch03_return_to_quay",
   "kind": "bg",
   "label": "返港時的兩種傳言",
   "path": "ch03/backgrounds/ch03_bg_return_to_quay_v01.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/ch03/backgrounds/ch03_bg_return_to_quay_master_v01.png"
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
   "id": "ship3_apparatus_survey",
   "kind": "cg",
   "label": "第三章航船實驗器材踏查底板",
   "path": "ch03/experiments/ch03_lab_apparatus_survey_v01.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/ch03/experiments/ch03_lab_apparatus_survey_master_v01.png"
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
   "id": "ship3_g4_shore_perspective",
   "kind": "cg",
   "label": "G4 岸上視角：同一顆石頭",
   "path": "ch03/perspectives/ch03_g4_shore_view_v01.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/ch03/perspectives/ch03_g4_shore_view_master_v01.png"
  },
  {
   "id": "ship3_g2_cabin",
   "kind": "cg",
   "label": "G2 封閉船艙共同運動互動底板",
   "path": "ch03/experiments/ch03_lab_g2_cabin_v02.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/ch03/experiments/ch03_lab_g2_cabin_master_v02.png"
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
   "id": "dialogue_mathieu32",
   "kind": "portrait",
   "label": "馬蒂厄 32 歲",
   "path": "ch03/characters/ch03_char_mathieu32_v02.webp",
   "firstScreen": false,
   "w": 900,
   "h": 1200,
   "sourceMaster": "art/source/production/ch03/characters/ch03_char_mathieu32_alpha_v01.png"
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
  },
  {
   "id": "bg_ch04_woolsthorpe_orchard_1665",
   "kind": "bg",
   "label": "1665 Woolsthorpe 果園",
   "path": "ch04/backgrounds/ch04_bg_woolsthorpe_orchard_1665_v01.webp",
   "firstScreen": true,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/ch04/backgrounds/ch04_bg_woolsthorpe_orchard_1665_master_v01.png"
  },
  {
   "id": "bg_ch04_woolsthorpe_study_1665",
   "kind": "bg",
   "label": "1665 Woolsthorpe 工作室",
   "path": "ch04/backgrounds/ch04_bg_woolsthorpe_study_1665_v01.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/ch04/backgrounds/ch04_bg_woolsthorpe_study_1665_master_v01.png"
  },
  {
   "id": "bg_ch04_cambridge_hooke_letter_1679",
   "kind": "bg",
   "label": "1679 Cambridge・Hooke 書信",
   "path": "ch04/backgrounds/ch04_bg_cambridge_hooke_letter_1679_v01.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/ch04/backgrounds/ch04_bg_cambridge_hooke_letter_1679_master_v01.png"
  },
  {
   "id": "bg_ch04_cambridge_halley_1684",
   "kind": "bg",
   "label": "1684 Cambridge・Halley 來訪",
   "path": "ch04/backgrounds/ch04_bg_cambridge_halley_1684_v01.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/ch04/backgrounds/ch04_bg_cambridge_halley_1684_master_v01.png"
  },
  {
   "id": "bg_ch04_greenwich_observatory_1680s",
   "kind": "bg",
   "label": "1680 年代 Greenwich 觀測室",
   "path": "ch04/backgrounds/ch04_bg_greenwich_observatory_1680s_v01.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/ch04/backgrounds/ch04_bg_greenwich_observatory_1680s_master_v01.png"
  },
  {
   "id": "bg_ch04_london_printshop_1687",
   "kind": "bg",
   "label": "1687 London 印刷室",
   "path": "ch04/backgrounds/ch04_bg_london_printshop_1687_v01.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/ch04/backgrounds/ch04_bg_london_printshop_1687_master_v01.png"
  },
  {
   "id": "bg_ch04_typecase_collision_epilogue",
   "kind": "bg",
   "label": "章末鉛字盒碰撞",
   "path": "ch04/backgrounds/ch04_bg_typecase_collision_epilogue_v01.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/ch04/backgrounds/ch04_bg_typecase_collision_epilogue_master_v01.png"
  },
  {
   "id": "ch04_prop_tangent_prediction_sheet_v03",
   "kind": "prop",
   "label": "牛頓桌上的無作用切線預測紙",
   "path": "ch04/props/ch04_prop_tangent_prediction_sheet_v03.webp",
   "firstScreen": false,
   "w": 1200,
   "h": 750,
   "sourceMaster": "art/source/production/ch04/props/ch04_prop_tangent_prediction_sheet_master_v03.png"
  },
  {
   "id": "ch04_prop_tangent_geometry_base_v01",
   "kind": "prop",
   "label": "1665 月球圓弧與切線推理底圖",
   "path": "ch04/props/ch04_prop_tangent_geometry_base_v01.webp",
   "firstScreen": false,
   "w": 1200,
   "h": 800,
   "sourceMaster": "art/source/production/ch04/props/ch04_prop_tangent_geometry_base_master_v01.png",
   "shotRole": "diagram-base",
   "precisionOverlay": true
  },
  {
   "id": "ch04_prop_cross_scale_surface_sheet_v01",
   "kind": "prop",
   "label": "1665 同尺紙・地表一秒教學重建底圖",
   "path": "ch04/props/ch04_prop_cross_scale_surface_sheet_v01.webp",
   "firstScreen": false,
   "w": 1200,
   "h": 480,
   "sourceMaster": "art/source/production/ch04/props/ch04_prop_cross_scale_surface_sheet_master_v01.png"
  },
  {
   "id": "ch04_prop_cross_scale_moon_sheet_v01",
   "kind": "prop",
   "label": "1665 同尺紙・月球六十秒教學重建底圖",
   "path": "ch04/props/ch04_prop_cross_scale_moon_sheet_v01.webp",
   "firstScreen": false,
   "w": 1200,
   "h": 480,
   "sourceMaster": "art/source/production/ch04/props/ch04_prop_cross_scale_moon_sheet_master_v01.png"
  },
  {
   "id": "ch04_prop_cross_scale_surface_sheet_v02",
   "kind": "prop",
   "label": "1665 同尺紙・地表一秒完整教學重建",
   "path": "ch04/props/ch04_prop_cross_scale_surface_sheet_v02.webp",
   "firstScreen": false,
   "w": 1200,
   "h": 480,
   "sourceMaster": "art/source/production/ch04/props/ch04_prop_cross_scale_surface_sheet_master_v02.png"
  },
  {
   "id": "ch04_prop_cross_scale_moon_sheet_v02",
   "kind": "prop",
   "label": "1665 同尺紙・月球六十秒完整教學重建",
   "path": "ch04/props/ch04_prop_cross_scale_moon_sheet_v02.webp",
   "firstScreen": false,
   "w": 1200,
   "h": 480,
   "sourceMaster": "art/source/production/ch04/props/ch04_prop_cross_scale_moon_sheet_master_v02.png"
  },
  {
   "id": "ch04_prop_rope_ball_setup_v01",
   "kind": "prop",
   "label": "1665 繩球演示裝置（演示前）",
   "path": "ch04/props/ch04_prop_rope_ball_setup_v01.webp",
   "firstScreen": false,
   "w": 1200,
   "h": 800,
   "sourceMaster": "art/source/production/ch04/props/ch04_prop_rope_ball_setup_master_v01.png"
  },
  {
   "id": "ch04_prop_hooke_letter_reconstruction_v01",
   "kind": "prop",
   "label": "1679 虎克書信道具重建",
   "path": "ch04/props/ch04_prop_hooke_letter_reconstruction_v01.webp",
   "firstScreen": false,
   "w": 1200,
   "h": 800,
   "sourceMaster": "art/source/production/ch04/props/ch04_prop_hooke_letter_reconstruction_master_v01.png"
  },
  {
   "id": "ch04_prop_halley_sealed_observation_box_v01",
   "kind": "prop",
   "label": "1684 哈雷未開封觀測資料匣",
   "path": "ch04/props/ch04_prop_halley_sealed_observation_box_v01.webp",
   "firstScreen": false,
   "w": 1200,
   "h": 800,
   "sourceMaster": "art/source/production/ch04/props/ch04_prop_halley_sealed_observation_box_master_v01.png"
  },
  {
   "id": "ch04_prop_print_credit_sources_v01",
   "kind": "prop",
   "label": "1687 印刷台上的分立來源",
   "path": "ch04/props/ch04_prop_print_credit_sources_v01.webp",
   "firstScreen": false,
   "w": 1200,
   "h": 800,
   "sourceMaster": "art/source/production/ch04/props/ch04_prop_print_credit_sources_master_v01.png"
  },
  {
   "id": "ch04_focus_drawer_closes_1665_v01",
   "kind": "cg",
   "label": "1665 年抽屜關上的焦點鏡頭",
   "path": "ch04/focus/ch04_focus_drawer_closes_1665_v01.webp",
   "firstScreen": false,
   "w": 1672,
   "h": 941,
   "sourceMaster": "art/source/production/ch04/focus/ch04_focus_drawer_closes_1665_master_v01.png"
  },
  {
   "id": "ch04_focus_newton_orbit_montage_1679_v01",
   "kind": "cg",
   "label": "1679 年牛頓接筆續畫焦點鏡頭",
   "path": "ch04/focus/ch04_focus_newton_orbit_montage_1679_v01.webp",
   "firstScreen": false,
   "w": 1672,
   "h": 941,
   "sourceMaster": "art/source/production/ch04/focus/ch04_focus_newton_orbit_montage_1679_master_v01.png"
  },
  {
   "id": "ch04_focus_mountain_cannon_v01",
   "kind": "cg",
   "label": "山頂大砲思想實驗焦點鏡頭",
   "path": "ch04/focus/ch04_focus_mountain_cannon_v01.webp",
   "firstScreen": false,
   "w": 1672,
   "h": 941,
   "sourceMaster": "art/source/production/ch04/focus/ch04_focus_mountain_cannon_master_v01.png"
  },
  {
   "id": "ch04_focus_newton_cannonball_reconstruction_v01",
   "kind": "cg",
   "label": "牛頓山頂大砲原典圖遊戲重建",
   "path": "ch04/focus/ch04_focus_newton_cannonball_reconstruction_v01.webp",
   "firstScreen": false,
   "w": 1672,
   "h": 941,
   "sourceMaster": "art/source/production/ch04/focus/ch04_focus_newton_cannonball_reconstruction_master_v01.png",
   "sourceReference": "art/source/historical/ch04/newton_cannonball_1728_public_domain.png",
   "sourceUrl": "https://archive.org/details/1728-newton-a-treatise-of-the-system-of-the-world/page/n35/mode/2up",
   "license": "Public Domain source reference; OpenAI-generated reconstruction",
   "embeddedText": [
    "A",
    "B",
    "C",
    "F",
    "V"
   ]
  },
  {
   "id": "ch04_focus_stirred_tea_analogy_v01",
   "kind": "cg",
   "label": "1684 攪茶渦旋類比焦點鏡頭",
   "path": "ch04/focus/ch04_focus_stirred_tea_analogy_v01.webp",
   "firstScreen": false,
   "w": 1672,
   "h": 941,
   "sourceMaster": "art/source/production/ch04/focus/ch04_focus_stirred_tea_analogy_master_v01.png"
  },
  {
   "id": "ch04_focus_lodestone_needle_analogy_v01",
   "kind": "cg",
   "label": "1684 磁石與鐵針類比焦點鏡頭",
   "path": "ch04/focus/ch04_focus_lodestone_needle_analogy_v01.webp",
   "firstScreen": false,
   "w": 1672,
   "h": 941,
   "sourceMaster": "art/source/production/ch04/focus/ch04_focus_lodestone_needle_analogy_master_v01.png"
  },
  {
   "id": "ch04_focus_three_observation_folios_v01",
   "kind": "cg",
   "label": "1684 三份觀測封面焦點鏡頭",
   "path": "ch04/focus/ch04_focus_three_observation_folios_v01.webp",
   "firstScreen": false,
   "w": 1672,
   "h": 941,
   "sourceMaster": "art/source/production/ch04/focus/ch04_focus_three_observation_folios_master_v01.png"
  },
  {
   "id": "ch04_focus_shell_theorem_page_v01",
   "kind": "cg",
   "label": "1687 球殼定理紙頁焦點鏡頭",
   "path": "ch04/focus/ch04_focus_shell_theorem_page_v01.webp",
   "firstScreen": false,
   "w": 1672,
   "h": 941,
   "sourceMaster": "art/source/production/ch04/focus/ch04_focus_shell_theorem_page_master_v01.png"
  },
  {
   "id": "card_K1",
   "kind": "card",
   "label": "K1 一直改向的路・中性推演底圖",
   "path": "ch04/evidence/ch04_card_K1_orbit_deflection_neutral_v03.webp",
   "firstScreen": false,
   "w": 800,
   "h": 500,
   "sourceMaster": "art/source/production/ch04/evidence/ch04_card_K1_orbit_deflection_neutral_master_v03.png"
  },
  {
   "id": "card_K1_raster_v02",
   "kind": "card",
   "label": "K1 一直改向的路・取得後證據成品",
   "path": "ch04/evidence/ch04_card_K1_orbit_deflection_raster_v02.webp",
   "firstScreen": false,
   "w": 1586,
   "h": 992,
   "sourceMaster": "art/source/production/ch04/evidence/ch04_card_K1_orbit_deflection_raster_candidate_v02.png"
  },
  {
   "id": "card_K2",
   "kind": "card",
   "label": "K2 地上與天上的同一把尺・共同計算證據",
   "path": "ch04/focus/ch04_focus_shared_moon_calculation_v01.webp",
   "firstScreen": false,
   "w": 1672,
   "h": 941,
   "sourceMaster": "art/source/production/ch04/focus/ch04_focus_shared_moon_calculation_master_v01.png"
  },
  {
   "id": "card_K2_cross_scale_reconstruction_v02",
   "kind": "card",
   "label": "K2 地上與天上的同一把尺・桌面教學重建",
   "path": "ch04/evidence/ch04_card_K2_cross_scale_reconstruction_v02.webp",
   "firstScreen": false,
   "w": 1200,
   "h": 750,
   "sourceMaster": "art/source/production/ch04/evidence/ch04_card_K2_cross_scale_reconstruction_master_v02.png"
  },
  {
   "id": "card_K3",
   "kind": "card",
   "label": "K3 沒看答案前的兩個週期",
   "path": "ch04/evidence/ch04_card_K3_sealed_predictions_v01.svg",
   "firstScreen": false,
   "w": 1200,
   "h": 750,
   "historicalDebt": {
    "status": "programmatic-state-projection",
    "identity": "本局預測資料圖，非史料",
    "reason": "固定 SVG 僅為舊底圖；正式內容由玩家封存與揭曉狀態投影。"
   }
  },
  {
   "id": "card_K4",
   "kind": "card",
   "label": "K4 一條規則穿過三種天空",
   "path": "ch04/evidence/ch04_card_K4_model_comparison_v01.svg",
   "firstScreen": false,
   "w": 1200,
   "h": 750,
   "historicalDebt": {
    "status": "variant-resolver-owned",
    "identity": "本局模型比較圖，非史料",
    "reason": "中性 SVG 只作無法還原時的安全退路；四種正式世界線各有可解析母版。"
   }
  },
  {
   "id": "card_K4_no_loans_raster_v03",
   "kind": "card",
   "label": "K4 模型比較・兩格皆未加借條",
   "path": "ch04/evidence/ch04_card_K4_model_comparison_no_loans_raster_v03.webp",
   "firstScreen": false,
   "w": 1586,
   "h": 992,
   "sourceMaster": "art/source/production/ch04/evidence/ch04_card_K4_model_comparison_no_loans_raster_candidate_v03.png"
  },
  {
   "id": "card_K4_planets_loan_raster_v03",
   "kind": "card",
   "label": "K4 模型比較・只借行星",
   "path": "ch04/evidence/ch04_card_K4_model_comparison_planets_loan_raster_v03.webp",
   "firstScreen": false,
   "w": 1586,
   "h": 992,
   "sourceMaster": "art/source/production/ch04/evidence/ch04_card_K4_model_comparison_planets_loan_raster_candidate_v03.png"
  },
  {
   "id": "card_K4_comet_loan_raster_v03",
   "kind": "card",
   "label": "K4 模型比較・只借彗星",
   "path": "ch04/evidence/ch04_card_K4_model_comparison_comet_loan_raster_v03.webp",
   "firstScreen": false,
   "w": 1586,
   "h": 992,
   "sourceMaster": "art/source/production/ch04/evidence/ch04_card_K4_model_comparison_comet_loan_raster_candidate_v03.png"
  },
  {
   "id": "card_K4_both_loans_raster_v04",
   "kind": "card",
   "label": "K4 模型比較・兩格皆加借條",
   "path": "ch04/evidence/ch04_card_K4_model_comparison_both_loans_raster_v04.webp",
   "firstScreen": false,
   "w": 1586,
   "h": 992,
   "sourceMaster": "art/source/production/ch04/evidence/ch04_card_K4_model_comparison_both_loans_raster_candidate_v04.png"
  },
  {
   "id": "card_K5",
   "kind": "card",
   "label": "K5 能算到哪裡，也要停在哪裡",
   "path": "ch04/evidence/ch04_card_K5_scoped_proof_v01.svg",
   "firstScreen": false,
   "w": 1200,
   "h": 750,
   "historicalDebt": {
    "status": "programmatic-canonical-diagram",
    "identity": "出版邊界教學圖，非史料",
    "reason": "可驗證文字由 runtime 與資料層負責，SVG 不冒充牛頓手稿。"
   }
  },
  {
   "id": "card_S6",
   "kind": "card",
   "label": "S6 《運動之量》正統文獻（史料意象圖）",
   "path": "ch05/evidence/ch05_card_S6_quantity_of_motion_treatise_v01.webp",
   "firstScreen": false,
   "w": 1200,
   "h": 750,
   "sourceMaster": "art/source/production/ch05/evidence/ch05_card_S6_quantity_of_motion_treatise_master_v01.png"
  },
  {
   "id": "card_S7",
   "kind": "card",
   "label": "S7 's Gravesande 黏土報告（史料意象圖）",
   "path": "ch05/evidence/ch05_card_S7_clay_report_v01.webp",
   "firstScreen": false,
   "w": 1200,
   "h": 750,
   "sourceMaster": "art/source/production/ch05/evidence/ch05_card_S7_clay_report_master_v01.png"
  },
  {
   "id": "card_J1",
   "kind": "card",
   "label": "J1 帶方向的動量帳",
   "path": "ch05/evidence/ch05_card_J1_signed_momentum_ledger_v02.webp",
   "firstScreen": false,
   "w": 1200,
   "h": 750,
   "sourceMaster": "art/source/production/ch05/evidence/ch05_card_J1_signed_momentum_ledger_master_v02.png"
  },
  {
   "id": "card_J2",
   "kind": "card",
   "label": "J2 活力帳（mv²）",
   "path": "ch05/evidence/ch05_card_J2_vis_viva_ledger_v02.webp",
   "firstScreen": false,
   "w": 1200,
   "h": 750,
   "sourceMaster": "art/source/production/ch05/evidence/ch05_card_J2_vis_viva_ledger_master_v02.png"
  },
  {
   "id": "card_J3",
   "kind": "card",
   "label": "J3 黏土深度",
   "path": "ch05/evidence/ch05_card_J3_clay_depth_v01.webp",
   "firstScreen": false,
   "w": 1200,
   "h": 750,
   "sourceMaster": "art/source/production/ch05/evidence/ch05_card_J3_clay_depth_master_v01.png"
  },
  {
   "id": "card_J4",
   "kind": "card",
   "label": "J4 兩本帳的重寫",
   "path": "ch05/evidence/ch05_card_J4_two_ledgers_v02.webp",
   "firstScreen": false,
   "w": 1200,
   "h": 750,
   "sourceMaster": "art/source/production/ch05/evidence/ch05_card_J4_two_ledgers_master_v02.png"
  },
  {
   "id": "card_S8",
   "kind": "card",
   "label": "S8 潛熱未決卡",
   "path": "ch06/evidence/ch06_card_S8_latent_heat_boundary_v01.svg",
   "firstScreen": false,
   "w": 1200,
   "h": 750,
   "sourceMaster": "art/source/production/ch06/evidence/ch06_evidence_cards_master_v01.svg"
  },
  {
   "id": "card_T1",
   "kind": "card",
   "label": "T1 碎屑與薄片同尺量熱",
   "path": "ch06/evidence/ch06_card_T1_equal_heat_scale_v01.svg",
   "firstScreen": false,
   "w": 1200,
   "h": 750,
   "sourceMaster": "art/source/production/ch06/evidence/ch06_evidence_cards_master_v01.svg"
  },
  {
   "id": "card_T2",
   "kind": "card",
   "label": "T2 接觸運動條件紙",
   "path": "ch06/evidence/ch06_card_T2_contact_motion_v01.svg",
   "firstScreen": false,
   "w": 1200,
   "h": 750,
   "sourceMaster": "art/source/production/ch06/evidence/ch06_evidence_cards_master_v01.svg"
  },
  {
   "id": "card_T3",
   "kind": "card",
   "label": "T3 密合與開放對照",
   "path": "ch06/evidence/ch06_card_T3_airtight_comparison_v01.svg",
   "firstScreen": false,
   "w": 1200,
   "h": 750,
   "sourceMaster": "art/source/production/ch06/evidence/ch06_evidence_cards_master_v01.svg"
  },
  {
   "id": "card_T4",
   "kind": "card",
   "label": "四份來源預測逐一對帳",
   "path": "ch06/evidence/ch06_card_T4_prediction_bands_v01.svg",
   "firstScreen": false,
   "w": 1200,
   "h": 750,
   "sourceMaster": "art/source/production/ch06/evidence/ch06_evidence_cards_master_v01.svg"
  },
  {
   "id": "card_T5",
   "kind": "card",
   "label": "T5 共同驗證頁",
   "path": "ch06/evidence/ch06_card_T5_joint_page_v01.svg",
   "firstScreen": false,
   "w": 1200,
   "h": 750,
   "sourceMaster": "art/source/production/ch06/evidence/ch06_evidence_cards_master_v01.svg"
  },
  {
   "id": "dialogue_newton22",
   "kind": "portrait",
   "label": "Isaac Newton 22 歲（合理重建）",
   "path": "ch04/characters/ch04_char_newton22_v03.webp",
   "firstScreen": true,
   "w": 900,
   "h": 1200,
   "sourceMaster": "art/source/production/ch04/characters/ch04_char_newton22_alpha_v02.png"
  },
  {
   "id": "dialogue_newton41",
   "kind": "portrait",
   "label": "Isaac Newton 約 41 歲（合理重建）",
   "path": "ch04/characters/ch04_char_newton41_v03.webp",
   "firstScreen": false,
   "w": 900,
   "h": 1200,
   "sourceMaster": "art/source/production/ch04/characters/ch04_char_newton41_alpha_v02.png"
  },
  {
   "id": "dialogue_halley28",
   "kind": "portrait",
   "label": "Edmond Halley 28 歲（合理重建）",
   "path": "ch04/characters/ch04_char_halley28_v02.webp",
   "firstScreen": false,
   "w": 900,
   "h": 1200,
   "sourceMaster": "art/source/production/ch04/characters/ch04_char_halley28_alpha_v02.png"
  },
  {
   "id": "chapter_thumbnail_ch04",
   "kind": "cg",
   "label": "第四章章節縮圖",
   "path": "ch04/backgrounds/ch04_bg_woolsthorpe_orchard_1665_v01.webp",
   "firstScreen": true,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/ch04/backgrounds/ch04_bg_woolsthorpe_orchard_1665_master_v01.png"
  },
  {
   "id": "ch05_transition_1687_collision_question_v01",
   "kind": "bg",
   "label": "章首轉場・1687 碰撞問題留在筆記",
   "path": "ch05/transitions/ch05_transition_1687_collision_question_v01.webp",
   "firstScreen": false,
   "w": 1672,
   "h": 941,
   "sourceMaster": "art/source/production/ch05/transitions/ch05_transition_1687_collision_question_master_v01.png"
  },
  {
   "id": "ch05_transition_1687_1740_pagefold_v01",
   "kind": "bg",
   "label": "章首轉場・1687 至 1740 紙頁時間通道",
   "path": "ch05/transitions/ch05_transition_1687_1740_pagefold_v01.webp",
   "firstScreen": false,
   "w": 1672,
   "h": 941,
   "sourceMaster": "art/source/production/ch05/transitions/ch05_transition_1687_1740_pagefold_master_v01.png"
  },
  {
   "id": "ch05_transition_1740_cirey_arrival_v01",
   "kind": "bg",
   "label": "章首轉場・約 1740 抵達西雷莊園",
   "path": "ch05/transitions/ch05_transition_1740_cirey_arrival_v01.webp",
   "firstScreen": false,
   "w": 1672,
   "h": 941,
   "sourceMaster": "art/source/production/ch05/transitions/ch05_transition_1740_cirey_arrival_master_v01.png"
  },
  {
   "id": "bg_ch05_cirey_library_day",
   "kind": "bg",
   "label": "約 1740 西雷莊園・日間書房",
   "path": "ch05/backgrounds/ch05_bg_cirey_library_day_v01.webp",
   "firstScreen": true,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/ch05/backgrounds/ch05_bg_cirey_library_day_master_v01.png"
  },
  {
   "id": "bg_ch05_cirey_debate_evening",
   "kind": "bg",
   "label": "約 1740 西雷莊園・夜間辯論桌",
   "path": "ch05/backgrounds/ch05_bg_cirey_debate_evening_v01.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/ch05/backgrounds/ch05_bg_cirey_debate_evening_master_v01.png"
  },
  {
   "id": "bg_ch05_cirey_epilogue_night",
   "kind": "bg",
   "label": "約 1740 西雷莊園・低火尾聲",
   "path": "ch05/backgrounds/ch05_bg_cirey_epilogue_night_v01.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/ch05/backgrounds/ch05_bg_cirey_epilogue_night_master_v01.png"
  },
  {
   "id": "dialogue_du_chatelet34",
   "kind": "portrait",
   "label": "Émilie du Châtelet 約 34 歲（合理重建）",
   "path": "ch05/characters/ch05_char_du_chatelet34_v01.webp",
   "firstScreen": true,
   "w": 900,
   "h": 1200,
   "sourceMaster": "art/source/production/ch05/characters/ch05_char_du_chatelet34_alpha_v01.png"
  },
  {
   "id": "dialogue_dupre58",
   "kind": "portrait",
   "label": "杜佩院士約 58 歲（虛構複合角色）",
   "path": "ch05/characters/ch05_char_dupre58_v01.webp",
   "firstScreen": false,
   "w": 900,
   "h": 1200,
   "sourceMaster": "art/source/production/ch05/characters/ch05_char_dupre58_alpha_v01.png"
  },
  {
   "id": "ch05_lab_collision_rig",
   "kind": "prop",
   "label": "第五章碰撞工作台（合理重建）",
   "path": "ch05/experiments/ch05_lab_collision_rig_v01.webp",
   "firstScreen": false,
   "w": 1200,
   "h": 750,
   "sourceMaster": "art/source/production/ch05/experiments/ch05_lab_collision_rig_master_v01.png"
  },
  {
   "id": "ch05_lab_clay_depth_rig",
   "kind": "prop",
   "label": "第五章黏土深度工作台（合理重建）",
   "path": "ch05/experiments/ch05_lab_clay_depth_rig_v01.webp",
   "firstScreen": false,
   "w": 1200,
   "h": 750,
   "sourceMaster": "art/source/production/ch05/experiments/ch05_lab_clay_depth_rig_master_v01.png"
  },
  {
   "id": "ch05_focus_unequal_putty_question",
   "kind": "prop",
   "label": "第五章 4／8 油灰追問",
   "path": "ch05/experiments/ch05_focus_unequal_putty_question_v01.webp",
   "firstScreen": false,
   "w": 1200,
   "h": 750,
   "sourceMaster": "art/source/production/ch05/experiments/ch05_focus_unequal_putty_question_master_v01.png"
  },
  {
   "id": "chapter_thumbnail_ch05",
   "kind": "cg",
   "label": "第五章章節縮圖",
   "path": "ch05/backgrounds/ch05_bg_cirey_library_day_v01.webp",
   "firstScreen": true,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/ch05/backgrounds/ch05_bg_cirey_library_day_master_v01.png"
  },
  {
   "id": "ch06_transition_1740_unpaid_heat_debt_v01",
   "kind": "bg",
   "label": "章首轉場・1740 未清熱債",
   "path": "ch06/transitions/ch06_transition_1740_unpaid_heat_debt_v01.webp",
   "firstScreen": false,
   "w": 1672,
   "h": 941,
   "sourceMaster": "art/source/production/ch06/transitions/ch06_transition_1740_unpaid_heat_debt_master_v01.png"
  },
  {
   "id": "ch06_transition_1740_1798_pagefold_v01",
   "kind": "bg",
   "label": "章首轉場・1740 至 1798 紙頁時間通道",
   "path": "ch06/transitions/ch06_transition_1740_1798_pagefold_v01.webp",
   "firstScreen": false,
   "w": 1672,
   "h": 941,
   "sourceMaster": "art/source/production/ch06/transitions/ch06_transition_1740_1798_pagefold_master_v01.png"
  },
  {
   "id": "ch06_transition_1798_munich_arsenal_arrival_v01",
   "kind": "bg",
   "label": "章首轉場・1798 抵達慕尼黑軍械庫",
   "path": "ch06/transitions/ch06_transition_1798_munich_arsenal_arrival_v01.webp",
   "firstScreen": false,
   "w": 1672,
   "h": 941,
   "sourceMaster": "art/source/production/ch06/transitions/ch06_transition_1798_munich_arsenal_arrival_master_v01.png"
  },
  {
   "id": "bg_ch06_munich_arsenal_boring_floor_day",
   "kind": "bg",
   "label": "1798 慕尼黑軍械庫・日間鑽炮工場（合理重建）",
   "path": "ch06/backgrounds/ch06_bg_munich_arsenal_boring_floor_day_v01.webp",
   "firstScreen": true,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/ch06/backgrounds/ch06_bg_munich_arsenal_boring_floor_day_master_v01.png"
  },
  {
   "id": "bg_ch06_munich_chip_calorimetry_bench",
   "kind": "bg",
   "label": "1798 慕尼黑軍械庫・雙杯量熱桌（合理重建）",
   "path": "ch06/backgrounds/ch06_bg_munich_chip_calorimetry_bench_v01.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/ch06/backgrounds/ch06_bg_munich_chip_calorimetry_bench_master_v01.png"
  },
  {
   "id": "bg_ch06_munich_airtight_bore_test",
   "kind": "bg",
   "label": "1798 慕尼黑軍械庫・密合活塞對照（合理重建）",
   "path": "ch06/backgrounds/ch06_bg_munich_airtight_bore_test_v01.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/ch06/backgrounds/ch06_bg_munich_airtight_bore_test_master_v01.png"
  },
  {
   "id": "bg_ch06_munich_water_box_setup",
   "kind": "bg",
   "label": "1798 慕尼黑軍械庫・水箱長時段起點（合理重建）",
   "path": "ch06/backgrounds/ch06_bg_munich_water_box_setup_v01.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/ch06/backgrounds/ch06_bg_munich_water_box_setup_master_v01.png"
  },
  {
   "id": "bg_ch06_munich_water_box_boiling_evening",
   "kind": "bg",
   "label": "1798 慕尼黑軍械庫・水箱沸騰晚間（合理重建）",
   "path": "ch06/backgrounds/ch06_bg_munich_water_box_boiling_evening_v01.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/ch06/backgrounds/ch06_bg_munich_water_box_boiling_evening_master_v01.png"
  },
  {
   "id": "bg_ch06_munich_model_audit_night",
   "kind": "bg",
   "label": "1798 慕尼黑軍械庫・模型稽核夜間（合理重建）",
   "path": "ch06/backgrounds/ch06_bg_munich_model_audit_night_v01.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/ch06/backgrounds/ch06_bg_munich_model_audit_night_master_v01.png"
  },
  {
   "id": "bg_ch06_munich_joint_page_dawn",
   "kind": "bg",
   "label": "1798 慕尼黑軍械庫・四欄共同頁清晨（合理重建）",
   "path": "ch06/backgrounds/ch06_bg_munich_joint_page_dawn_v01.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/ch06/backgrounds/ch06_bg_munich_joint_page_dawn_master_v01.png"
  },
  {
   "id": "dialogue_rumford45",
   "kind": "portrait",
   "label": "朗福德伯爵約 45 歲（合理重建）",
   "path": "ch06/characters/ch06_char_rumford45_v01.webp",
   "firstScreen": true,
   "w": 900,
   "h": 1200,
   "sourceMaster": "art/source/production/ch06/characters/ch06_char_rumford45_alpha_v01.png"
  },
  {
   "id": "dialogue_stang52",
   "kind": "portrait",
   "label": "史坦格・鑽炮長約 52 歲（虛構複合角色）",
   "path": "ch06/characters/ch06_char_stang52_v01.webp",
   "firstScreen": false,
   "w": 900,
   "h": 1200,
   "sourceMaster": "art/source/production/ch06/characters/ch06_char_stang52_alpha_v01.png"
  },
  {
   "id": "dialogue_kessler58",
   "kind": "portrait",
   "label": "凱斯勒院士約 58 歲（虛構複合角色）",
   "path": "ch06/characters/ch06_char_kessler58_v01.webp",
   "firstScreen": false,
   "w": 900,
   "h": 1200,
   "sourceMaster": "art/source/production/ch06/characters/ch06_char_kessler58_alpha_v01.png"
  },
  {
   "id": "ch06_lab_source_ledger",
   "kind": "prop",
   "label": "第六章四來源追債台",
   "path": "ch06/experiments/ch06_lab_source_ledger_v01.webp",
   "firstScreen": false,
   "w": 1200,
   "h": 750,
   "sourceMaster": "art/source/production/ch06/experiments/ch06_lab_source_ledger_master_v01.png"
  },
  {
   "id": "ch06_lab_chip_capacity",
   "kind": "prop",
   "label": "第六章碎屑與薄片量熱台",
   "path": "ch06/experiments/ch06_lab_chip_capacity_v01.webp",
   "firstScreen": false,
   "w": 1200,
   "h": 750,
   "sourceMaster": "art/source/production/ch06/backgrounds/ch06_bg_munich_chip_calorimetry_bench_master_v01.png"
  },
  {
   "id": "ch06_lab_friction_conditions",
   "kind": "prop",
   "label": "第六章摩擦三條件工作台",
   "path": "ch06/experiments/ch06_lab_friction_conditions_v01.webp",
   "firstScreen": false,
   "w": 1200,
   "h": 750,
   "sourceMaster": "art/source/production/ch06/experiments/ch06_lab_friction_conditions_master_v01.png"
  },
  {
   "id": "ch06_lab_paper_strip",
   "kind": "prop",
   "label": "第六章乾式無數字紙帶台",
   "path": "ch06/experiments/ch06_lab_paper_strip_v01.webp",
   "firstScreen": false,
   "w": 1200,
   "h": 750,
   "sourceMaster": "art/source/production/ch06/experiments/ch06_lab_paper_strip_master_v01.png"
  },
  {
   "id": "ch06_lab_airtight_piston",
   "kind": "prop",
   "label": "第六章開放與密合活塞對照",
   "path": "ch06/experiments/ch06_lab_airtight_piston_v01.webp",
   "firstScreen": false,
   "w": 1200,
   "h": 750,
   "sourceMaster": "art/source/production/ch06/backgrounds/ch06_bg_munich_airtight_bore_test_master_v01.png"
  },
  {
   "id": "ch06_lab_water_box_setup",
   "kind": "prop",
   "label": "第六章水箱長時段起點",
   "path": "ch06/experiments/ch06_lab_water_box_setup_v01.webp",
   "firstScreen": false,
   "w": 1200,
   "h": 750,
   "sourceMaster": "art/source/production/ch06/backgrounds/ch06_bg_munich_water_box_setup_master_v01.png"
  },
  {
   "id": "ch06_lab_water_box_boiling",
   "kind": "prop",
   "label": "第六章水箱長時段沸騰結果",
   "path": "ch06/experiments/ch06_lab_water_box_boiling_v01.webp",
   "firstScreen": false,
   "w": 1200,
   "h": 750,
   "sourceMaster": "art/source/production/ch06/backgrounds/ch06_bg_munich_water_box_boiling_evening_master_v01.png"
  },
  {
   "id": "ch06_focus_model_audit",
   "kind": "prop",
   "label": "第六章四來源模型稽核板",
   "path": "ch06/focus/ch06_focus_model_audit_v01.webp",
   "firstScreen": false,
   "w": 1200,
   "h": 750,
   "sourceMaster": "art/source/production/ch06/backgrounds/ch06_bg_munich_model_audit_night_master_v01.png"
  },
  {
   "id": "ch06_focus_joint_page",
   "kind": "prop",
   "label": "第六章四欄共同驗證頁",
   "path": "ch06/focus/ch06_focus_joint_page_v01.webp",
   "firstScreen": false,
   "w": 1200,
   "h": 750,
   "sourceMaster": "art/source/production/ch06/backgrounds/ch06_bg_munich_joint_page_dawn_master_v01.png"
  },
  {
   "id": "ch06_focus_hot_chip_water",
   "kind": "prop",
   "label": "第六章熱碎屑入水聚焦",
   "path": "ch06/focus/ch06_focus_hot_chip_water_v01.webp",
   "firstScreen": false,
   "w": 1200,
   "h": 750,
   "sourceMaster": "art/source/production/ch06/focus/ch06_focus_hot_chip_water_master_v01.png"
  },
  {
   "id": "ch06_focus_latent_heat_notebook",
   "kind": "prop",
   "label": "第六章潛熱未決薄冊聚焦",
   "path": "ch06/focus/ch06_focus_latent_heat_notebook_v01.webp",
   "firstScreen": false,
   "w": 1200,
   "h": 750,
   "sourceMaster": "art/source/production/ch06/focus/ch06_focus_latent_heat_notebook_master_v01.png"
  },
  {
   "id": "ch01_epilogue_unresolved_arc_v01",
   "kind": "bg",
   "label": "第一章末頁・運河石子與未完弧線",
   "path": "ch01/epilogues/ch01_epilogue_unresolved_arc_v01.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/epilogues/ch01_epilogue_unresolved_arc_master_v01.png"
  },
  {
   "id": "ch02_epilogue_motion_continues_v01",
   "kind": "bg",
   "label": "第二章末頁・月球高爾夫回聲與持續運動",
   "path": "ch02/epilogues/ch02_epilogue_motion_continues_v01.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/epilogues/ch02_epilogue_motion_continues_master_v01.png"
  },
  {
   "id": "ch03_epilogue_moon_question_v01",
   "kind": "bg",
   "label": "第三章末頁・同步紙帶與月亮問題",
   "path": "ch03/epilogues/ch03_epilogue_moon_question_v01.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/epilogues/ch03_epilogue_moon_question_master_v01.png"
  },
  {
   "id": "ch04_epilogue_two_collision_accounts_v01",
   "kind": "bg",
   "label": "第四章末頁・碰撞後的兩張帳",
   "path": "ch04/epilogues/ch04_epilogue_two_collision_accounts_v01.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/epilogues/ch04_epilogue_two_collision_accounts_master_v01.png"
  },
  {
   "id": "ch05_epilogue_blank_receipt_v01",
   "kind": "bg",
   "label": "第五章末頁・兩本帳與空白收據",
   "path": "ch05/epilogues/ch05_epilogue_blank_receipt_v01.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/epilogues/ch05_epilogue_blank_receipt_master_v01.png"
  },
  {
   "id": "ch06_epilogue_unmeasured_exchange_v01",
   "kind": "bg",
   "label": "第六章末頁・尚未量得的兌換率",
   "path": "ch06/epilogues/ch06_epilogue_unmeasured_exchange_v01.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/epilogues/ch06_epilogue_unmeasured_exchange_master_v01.png"
  },
  {
   "id": "ch03_future_echo_apollo8_v01",
   "kind": "bg",
   "label": "第三章未來顯影・阿波羅八號月球軌道艙",
   "path": "ch03/epilogues/ch03_future_echo_apollo8_v01.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/epilogues/ch03_future_echo_apollo8_master_v01.png"
  },
  {
   "id": "ch04_future_echo_sputnik_v01",
   "kind": "bg",
   "label": "第四章未來顯影・史普尼克一號繞地",
   "path": "ch04/epilogues/ch04_future_echo_sputnik_v01.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/epilogues/ch04_future_echo_sputnik_master_v01.png"
  },
  {
   "id": "ch05_future_echo_dart_v01",
   "kind": "bg",
   "label": "第五章未來顯影・DART 撞擊 Dimorphos",
   "path": "ch05/epilogues/ch05_future_echo_dart_v01.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/epilogues/ch05_future_echo_dart_master_v01.png"
  },
  {
   "id": "ch06_future_echo_fsw_v01",
   "kind": "bg",
   "label": "第六章未來顯影・摩擦攪拌焊",
   "path": "ch06/epilogues/ch06_future_echo_fsw_v01.webp",
   "firstScreen": false,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/epilogues/ch06_future_echo_fsw_master_v01.png"
  },
  {
   "id": "chapter_thumbnail_ch06",
   "kind": "cg",
   "label": "第六章章節縮圖",
   "path": "ch06/backgrounds/ch06_bg_munich_arsenal_boring_floor_day_v01.webp",
   "firstScreen": true,
   "w": 1920,
   "h": 1080,
   "sourceMaster": "art/source/production/ch06/backgrounds/ch06_bg_munich_arsenal_boring_floor_day_master_v01.png"
  },
  {
   "id": "ch01_focus_shared_paper_calculation_v01",
   "kind": "cg",
   "label": "第一章共同讀紙與計算特寫",
   "path": "ch01/focus/ch01_focus_shared_paper_calculation_v01.webp",
   "firstScreen": false,
   "w": 1672,
   "h": 941,
   "sourceMaster": "art/source/production/ch01/focus/ch01_focus_shared_paper_calculation_master_v01.png",
   "shotRole": "relationship",
   "pairId": "shared-discovery-ch01"
  },
  {
   "id": "ch01_focus_square_pattern_reading_v01",
   "kind": "cg",
   "label": "第一章總距離平方序列閱讀鏡頭",
   "path": "ch01/focus/ch01_focus_square_pattern_reading_v01.webp",
   "firstScreen": false,
   "w": 1672,
   "h": 941,
   "sourceMaster": "art/source/production/ch01/focus/ch01_focus_square_pattern_reading_master_v01.png",
   "shotRole": "reading",
   "pairId": "shared-discovery-ch01",
   "embeddedText": [
    "1 4 9 16 25"
   ]
  },
  {
   "id": "ch02_focus_evidence_next_test_v01",
   "kind": "cg",
   "label": "第二章保留證據並換球續查特寫",
   "path": "ch02/focus/ch02_focus_evidence_next_test_v01.webp",
   "firstScreen": false,
   "w": 1672,
   "h": 941,
   "sourceMaster": "art/source/production/ch02/focus/ch02_focus_evidence_next_test_master_v01.png",
   "shotRole": "relationship",
   "pairId": "shared-discovery-ch02"
  },
  {
   "id": "ch02_focus_ball_comparison_reading_v01",
   "kind": "cg",
   "label": "第二章銅球木球砂痕閱讀鏡頭",
   "path": "ch02/focus/ch02_focus_ball_comparison_reading_v01.webp",
   "firstScreen": false,
   "w": 1672,
   "h": 941,
   "sourceMaster": "art/source/production/ch02/focus/ch02_focus_ball_comparison_reading_master_v01.png",
   "shotRole": "reading",
   "pairId": "shared-discovery-ch02",
   "embeddedText": [
    "銅球",
    "木球"
   ]
  },
  {
   "id": "ch03_focus_public_limited_claim_v01",
   "kind": "cg",
   "label": "第三章公開記錄有限主張特寫",
   "path": "ch03/focus/ch03_focus_public_limited_claim_v01.webp",
   "firstScreen": false,
   "w": 1672,
   "h": 941,
   "sourceMaster": "art/source/production/ch03/focus/ch03_focus_public_limited_claim_master_v01.png",
   "shotRole": "relationship",
   "pairId": "shared-discovery-ch03"
  },
  {
   "id": "ch03_focus_limited_claim_reading_v01",
   "kind": "cg",
   "label": "第三章有限主張雙欄閱讀鏡頭",
   "path": "ch03/focus/ch03_focus_limited_claim_reading_v01.webp",
   "firstScreen": false,
   "w": 1672,
   "h": 941,
   "sourceMaster": "art/source/production/ch03/focus/ch03_focus_limited_claim_reading_master_v01.png",
   "shotRole": "reading",
   "pairId": "shared-discovery-ch03",
   "embeddedText": [
    "排除",
    "未直接量"
   ]
  },
  {
   "id": "ch04_focus_shared_moon_calculation_v01",
   "kind": "cg",
   "label": "第四章兩張獨立算紙共同發現特寫",
   "path": "ch04/focus/ch04_focus_shared_moon_calculation_v01.webp",
   "firstScreen": false,
   "w": 1672,
   "h": 941,
   "sourceMaster": "art/source/production/ch04/focus/ch04_focus_shared_moon_calculation_master_v01.png",
   "shotRole": "relationship",
   "pairId": "shared-discovery-ch04"
  },
  {
   "id": "ch04_focus_one_second_papers_reading_v01",
   "kind": "cg",
   "label": "第四章兩張一秒算紙閱讀鏡頭",
   "path": "ch04/focus/ch04_focus_one_second_papers_reading_v01.webp",
   "firstScreen": false,
   "w": 1672,
   "h": 941,
   "sourceMaster": "art/source/production/ch04/focus/ch04_focus_one_second_papers_reading_master_v01.png",
   "shotRole": "reading",
   "pairId": "shared-discovery-ch04",
   "embeddedText": [
    "地表 1 秒：約 4.9 m",
    "月球 1 秒：約 1.36 mm",
    "待比較"
   ]
  },
  {
   "id": "ch05_focus_same_six_records_relation_v01",
   "kind": "cg",
   "label": "第五章同守六張紀錄關係鏡頭",
   "path": "ch05/focus/ch05_focus_same_six_records_relation_v01.webp",
   "firstScreen": false,
   "w": 1672,
   "h": 941,
   "sourceMaster": "art/source/production/ch05/focus/ch05_focus_same_six_records_relation_master_v01.png",
   "shotRole": "relationship",
   "pairId": "shared-discovery-ch05"
  },
  {
   "id": "ch05_focus_two_ledgers_reading_v01",
   "kind": "cg",
   "label": "第五章兩本帳同紙閱讀鏡頭",
   "path": "ch05/focus/ch05_focus_two_ledgers_reading_v01.webp",
   "firstScreen": false,
   "w": 1672,
   "h": 941,
   "sourceMaster": "art/source/production/ch05/focus/ch05_focus_two_ledgers_reading_master_v01.png",
   "shotRole": "reading",
   "pairId": "shared-discovery-ch05",
   "embeddedText": [
    "動量帳",
    "活力帳"
   ]
  },
  {
   "id": "ch06_focus_four_hands_strip_alignment_v01",
   "kind": "cg",
   "label": "第六章四人對齊紙帶特寫",
   "path": "ch06/focus/ch06_focus_four_hands_strip_alignment_v01.webp",
   "firstScreen": false,
   "w": 1672,
   "h": 941,
   "sourceMaster": "art/source/production/ch06/focus/ch06_focus_four_hands_strip_alignment_master_v01.png",
   "shotRole": "relationship",
   "pairId": "shared-discovery-ch06"
  },
  {
   "id": "ch06_focus_heat_strips_reading_v01",
   "kind": "cg",
   "label": "第六章碎屑薄片紙帶閱讀鏡頭",
   "path": "ch06/focus/ch06_focus_heat_strips_reading_v01.webp",
   "firstScreen": false,
   "w": 1672,
   "h": 941,
   "sourceMaster": "art/source/production/ch06/focus/ch06_focus_heat_strips_reading_master_v01.png",
   "shotRole": "reading",
   "pairId": "shared-discovery-ch06",
   "embeddedText": [
    "碎屑",
    "薄片"
   ]
  },
  {
   "id": "ch06_focus_public_blank_admission_v01",
   "kind": "cg",
   "label": "第六章公開保留未決空欄特寫",
   "path": "ch06/focus/ch06_focus_public_blank_admission_v01.webp",
   "firstScreen": false,
   "w": 1672,
   "h": 941,
   "sourceMaster": "art/source/production/ch06/focus/ch06_focus_public_blank_admission_master_v01.png"
  },
  {
   "id": "bg_ch07_bologna_rain_arrival",
   "kind": "bg",
   "label": "1798 波隆那雨後抵達（合理重建）",
   "path": "ch07/backgrounds/ch07_bg_bologna_rain_arrival_v01.webp",
   "firstScreen": true,
   "w": 1672,
   "h": 941,
   "sourceMaster": "art/source/production/ch07/backgrounds/ch07_bg_bologna_rain_arrival_master_v01.png"
  },
  {
   "id": "bg_ch07_galvani_anatomy_study_day",
   "kind": "bg",
   "label": "1798 Galvani 解剖書房日景（合理重建）",
   "path": "ch07/backgrounds/ch07_bg_galvani_anatomy_study_day_v01.webp",
   "firstScreen": true,
   "w": 1672,
   "h": 941,
   "sourceMaster": "art/source/production/ch07/backgrounds/ch07_bg_galvani_anatomy_study_day_master_v01.png"
  },
  {
   "id": "bg_ch07_galvani_matrix_table",
   "kind": "bg",
   "label": "1798 Galvani 四格複驗桌（合理重建）",
   "path": "ch07/backgrounds/ch07_bg_galvani_matrix_table_v01.webp",
   "firstScreen": false,
   "w": 1672,
   "h": 941,
   "sourceMaster": "art/source/production/ch07/backgrounds/ch07_bg_galvani_matrix_table_master_v01.png"
  },
  {
   "id": "bg_ch07_volta_pavia_lab",
   "kind": "bg",
   "label": "1798 Volta 帕維亞儀器室（合理重建）",
   "path": "ch07/backgrounds/ch07_bg_volta_pavia_lab_v01.webp",
   "firstScreen": true,
   "w": 1672,
   "h": 941,
   "sourceMaster": "art/source/production/ch07/backgrounds/ch07_bg_volta_pavia_lab_master_v01.png"
  },
  {
   "id": "bg_ch07_galvani_return_evening",
   "kind": "bg",
   "label": "1798 波隆那五格判讀黃昏（合理重建）",
   "path": "ch07/backgrounds/ch07_bg_galvani_return_evening_v01.webp",
   "firstScreen": false,
   "w": 1672,
   "h": 941,
   "sourceMaster": "art/source/production/ch07/backgrounds/ch07_bg_galvani_return_evening_master_v01.png"
  },
  {
   "id": "bg_ch07_aldini_study_1800_dawn",
   "kind": "bg",
   "label": "1800 Aldini 書房清晨（合理重建）",
   "path": "ch07/backgrounds/ch07_bg_aldini_study_1800_dawn_v01.webp",
   "firstScreen": true,
   "w": 1672,
   "h": 941,
   "sourceMaster": "art/source/production/ch07/backgrounds/ch07_bg_aldini_study_1800_dawn_master_v01.png"
  },
  {
   "id": "dialogue_galvani61",
   "kind": "portrait",
   "label": "Luigi Galvani 約 61 歲（合理重建）",
   "path": "ch07/characters/ch07_portrait_galvani_v02.webp",
   "firstScreen": true,
   "w": 1368,
   "h": 1149,
   "sourceMaster": "art/source/production/ch07/characters/ch07_portrait_galvani_alpha_master_v02.png"
  },
  {
   "id": "dialogue_volta53",
   "kind": "portrait",
   "label": "Alessandro Volta 約 53 歲（合理重建）",
   "path": "ch07/characters/ch07_portrait_volta_v02.webp",
   "firstScreen": true,
   "w": 1316,
   "h": 1195,
   "sourceMaster": "art/source/production/ch07/characters/ch07_portrait_volta_alpha_master_v02.png"
  },
  {
   "id": "dialogue_aldini38",
   "kind": "portrait",
   "label": "Giovanni Aldini 約 38 歲（合理重建）",
   "path": "ch07/characters/ch07_portrait_aldini_v02.webp",
   "firstScreen": true,
   "w": 1402,
   "h": 1122,
   "sourceMaster": "art/source/production/ch07/characters/ch07_portrait_aldini_alpha_master_v02.png"
  },
  {
   "id": "ch07_focus_frog_witness_v01",
   "kind": "cg",
   "label": "第七章蛙腿接觸共同觀察鏡頭",
   "path": "ch07/focus/ch07_focus_frog_witness_v01.webp",
   "firstScreen": false,
   "w": 1672,
   "h": 941,
   "sourceMaster": "art/source/production/ch07/focus/ch07_focus_frog_witness_master_v01.png"
  },
  {
   "id": "ch07_focus_four_papers_matrix_v01",
   "kind": "cg",
   "label": "第七章四張複驗紙閱讀鏡頭",
   "path": "ch07/focus/ch07_focus_four_papers_matrix_v01.webp",
   "firstScreen": false,
   "w": 1672,
   "h": 941,
   "sourceMaster": "art/source/production/ch07/focus/ch07_focus_four_papers_matrix_master_v01.png"
  },
  {
   "id": "ch07_focus_volta_electrometer_v01",
   "kind": "cg",
   "label": "第七章旅人親手操作凝聚電量器鏡頭",
   "path": "ch07/focus/ch07_focus_volta_electrometer_v01.webp",
   "firstScreen": false,
   "w": 1672,
   "h": 941,
   "sourceMaster": "art/source/production/ch07/focus/ch07_focus_volta_electrometer_master_v01.png"
  },
  {
   "id": "ch07_focus_volta_pile_v01",
   "kind": "cg",
   "label": "第七章旅人與 Aldini 疊堆鏡頭",
   "path": "ch07/focus/ch07_focus_volta_pile_v01.webp",
   "firstScreen": false,
   "w": 1672,
   "h": 941,
   "sourceMaster": "art/source/production/ch07/focus/ch07_focus_volta_pile_master_v01.png"
  },
  {
   "id": "ch07_focus_six_papers_board_v01",
   "kind": "cg",
   "label": "第七章六張原紙合帳閱讀鏡頭",
   "path": "ch07/focus/ch07_focus_six_papers_board_v01.webp",
   "firstScreen": false,
   "w": 1672,
   "h": 941,
   "sourceMaster": "art/source/production/ch07/focus/ch07_focus_six_papers_board_master_v01.png"
  },
  {
   "id": "ch07_focus_empty_recipient_letter_v01",
   "kind": "cg",
   "label": "第七章沒有收件人的信收束鏡頭",
   "path": "ch07/focus/ch07_focus_empty_recipient_letter_v01.webp",
   "firstScreen": false,
   "w": 1672,
   "h": 941,
   "sourceMaster": "art/source/production/ch07/focus/ch07_focus_empty_recipient_letter_master_v01.png"
  },
  {
   "id": "chapter_thumbnail_ch07",
   "kind": "cg",
   "label": "第七章章節縮圖",
   "path": "ch07/backgrounds/ch07_bg_bologna_rain_arrival_v01.webp",
   "firstScreen": true,
   "w": 1672,
   "h": 941,
   "sourceMaster": "art/source/production/ch07/backgrounds/ch07_bg_bologna_rain_arrival_master_v01.png"
  },
  {
   "id": "card_GRID_BASELINE",
   "kind": "card",
   "label": "第七章 證人醒著的基準紙",
   "path": "ch07/evidence/ch07_card_GRID_BASELINE_v01.webp",
   "firstScreen": false,
   "w": 1586,
   "h": 991,
   "sourceMaster": "art/source/production/ch07/evidence/ch07_card_GRID_BASELINE_master_v01.png",
   "renderPolicy": "complete-raster-no-visible-overlay"
  },
  {
   "id": "card_GRID_BIMETAL",
   "kind": "card",
   "label": "第七章 雙金屬閉合的觀測紙",
   "path": "ch07/evidence/ch07_card_GRID_BIMETAL_v01.webp",
   "firstScreen": false,
   "w": 1586,
   "h": 991,
   "sourceMaster": "art/source/production/ch07/evidence/ch07_card_GRID_BIMETAL_master_v01.png",
   "renderPolicy": "complete-raster-no-visible-overlay"
  },
  {
   "id": "card_GRID_SAME_METAL",
   "kind": "card",
   "label": "第七章 同材質接法的觀測紙",
   "path": "ch07/evidence/ch07_card_GRID_SAME_METAL_v01.webp",
   "firstScreen": false,
   "w": 1586,
   "h": 991,
   "sourceMaster": "art/source/production/ch07/evidence/ch07_card_GRID_SAME_METAL_master_v01.png",
   "renderPolicy": "complete-raster-no-visible-overlay"
  },
  {
   "id": "card_GRID_NO_METAL",
   "kind": "card",
   "label": "第七章 無金屬仍收縮的觀測紙",
   "path": "ch07/evidence/ch07_card_GRID_NO_METAL_v01.webp",
   "firstScreen": false,
   "w": 1586,
   "h": 991,
   "sourceMaster": "art/source/production/ch07/evidence/ch07_card_GRID_NO_METAL_master_v01.png",
   "renderPolicy": "complete-raster-no-visible-overlay"
  },
  {
   "id": "card_GRID_ELECTROMETER",
   "kind": "card",
   "label": "第七章 沒有生命組織的針格",
   "path": "ch07/evidence/ch07_card_GRID_ELECTROMETER_v01.webp",
   "firstScreen": false,
   "w": 1586,
   "h": 991,
   "sourceMaster": "art/source/production/ch07/evidence/ch07_card_GRID_ELECTROMETER_master_v01.png",
   "renderPolicy": "complete-raster-no-visible-overlay"
  },
  {
   "id": "card_GRID_PILE",
   "kind": "card",
   "label": "第七章 持續電效應的堆格",
   "path": "ch07/evidence/ch07_card_GRID_PILE_v01.webp",
   "firstScreen": false,
   "w": 1586,
   "h": 991,
   "sourceMaster": "art/source/production/ch07/evidence/ch07_card_GRID_PILE_master_v01.png",
   "renderPolicy": "complete-raster-no-visible-overlay"
  },
  {
   "id": "card_GRID_STATE",
   "kind": "card",
   "label": "第七章 六格合帳頁",
   "path": "ch07/evidence/ch07_card_GRID_STATE_v01.webp",
   "firstScreen": false,
   "w": 1586,
   "h": 991,
   "sourceMaster": "art/source/production/ch07/evidence/ch07_card_GRID_STATE_master_v01.png",
   "renderPolicy": "complete-raster-no-visible-overlay"
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
   "維達爾船長": "dialogue_captain50",
   "馬蒂厄": "dialogue_mathieu32"
  },
  "C0-3": {
   "伽桑狄": "dialogue_gassendi48",
   "維達爾船長": "dialogue_captain50",
   "馬蒂厄": "dialogue_mathieu32",
   "艾蒂安": "dialogue_etienne17"
  },
  "C1-1": {
   "伽桑狄": "dialogue_gassendi48",
   "艾蒂安": "dialogue_etienne17",
   "馬蒂厄": "dialogue_mathieu32"
  },
  "C3-1": {
   "伽桑狄": "dialogue_gassendi48",
   "維達爾船長": "dialogue_captain50",
   "馬蒂厄": "dialogue_mathieu32"
  },
  "C3-2": {
   "伽桑狄": "dialogue_gassendi48",
   "維達爾船長": "dialogue_captain50",
   "馬蒂厄": "dialogue_mathieu32"
  },
  "CE-1": {
   "伽桑狄": "dialogue_gassendi48",
   "維達爾船長": "dialogue_captain50"
  },
  "CE-2": {
   "伽桑狄": "dialogue_gassendi48"
  },
  "SC3-R1": {
   "伽桑狄": "dialogue_gassendi48",
   "維達爾船長": "dialogue_captain50"
  },
  "D0-1": {},
  "D0-2": {
   "Newton": "dialogue_newton22",
   "牛頓": "dialogue_newton22"
  },
  "D1-1": {
   "Newton": "dialogue_newton22",
   "牛頓": "dialogue_newton22"
  },
  "D1-2": {
   "Newton": "dialogue_newton22",
   "牛頓": "dialogue_newton22"
  },
  "D-INT-1": {
   "Newton": "dialogue_newton22",
   "牛頓": "dialogue_newton22"
  },
  "D1-3": {
   "Newton": "dialogue_newton22",
   "牛頓": "dialogue_newton22"
  },
  "D2-1": {
   "Newton": "dialogue_newton41",
   "牛頓": "dialogue_newton41"
  },
  "D2-2": {
   "Newton": "dialogue_newton41",
   "牛頓": "dialogue_newton41"
  },
  "D2-3": {
   "Newton": "dialogue_newton41",
   "Halley": "dialogue_halley28",
   "牛頓": "dialogue_newton41",
   "哈雷": "dialogue_halley28"
  },
  "D3-1": {
   "Newton": "dialogue_newton41",
   "Halley": "dialogue_halley28",
   "牛頓": "dialogue_newton41",
   "哈雷": "dialogue_halley28"
  },
  "D3-2": {
   "Newton": "dialogue_newton41",
   "牛頓": "dialogue_newton41",
   "哈雷": "dialogue_halley28"
  },
  "D3-3": {
   "Newton": "dialogue_newton41",
   "Halley": "dialogue_halley28",
   "牛頓": "dialogue_newton41",
   "哈雷": "dialogue_halley28"
  },
  "D3-4": {
   "Newton": "dialogue_newton41",
   "Halley": "dialogue_halley28",
   "牛頓": "dialogue_newton41",
   "哈雷": "dialogue_halley28"
  },
  "D4-1": {
   "Newton": "dialogue_newton41",
   "Halley": "dialogue_halley28",
   "牛頓": "dialogue_newton41",
   "哈雷": "dialogue_halley28"
  },
  "D4-2": {
   "Newton": "dialogue_newton41",
   "Halley": "dialogue_halley28",
   "牛頓": "dialogue_newton41",
   "哈雷": "dialogue_halley28"
  },
  "DE-1": {
   "Newton": "dialogue_newton41",
   "Halley": "dialogue_halley28",
   "牛頓": "dialogue_newton41",
   "哈雷": "dialogue_halley28"
  },
  "DE-2": {},
  "SC4-R1": {
   "Newton": "dialogue_newton41",
   "Halley": "dialogue_halley28",
   "牛頓": "dialogue_newton41",
   "哈雷": "dialogue_halley28"
  },
  "SC5-R1": {
   "杜夏特萊": "dialogue_du_chatelet34"
  },
  "INT-C1": {
   "伽桑狄": "dialogue_gassendi48"
  },
  "INT-C2": {
   "伽桑狄": "dialogue_gassendi48",
   "維達爾船長": "dialogue_captain50"
  }
 },
 "speakerDialoguePortrait": {
  "助手": "dialogue_assistant_earnest",
  "主持": "dialogue_host_formal",
  "年輕人": "dialogue_galileo26_neutral",
  "伽桑狄": "dialogue_gassendi48",
  "維達爾船長": "dialogue_captain50",
  "艾蒂安": "dialogue_etienne17",
  "馬蒂厄": "dialogue_mathieu32",
  "Newton": "dialogue_newton41",
  "Halley": "dialogue_halley28",
  "牛頓": "dialogue_newton41",
  "哈雷": "dialogue_halley28",
  "杜夏特萊": "dialogue_du_chatelet34",
  "杜佩院士": "dialogue_dupre58",
  "朗福德伯爵": "dialogue_rumford45",
  "史坦格・鑽炮長": "dialogue_stang52",
  "凱斯勒院士": "dialogue_kessler58",
  "Galvani": "dialogue_galvani61",
  "Volta": "dialogue_volta53",
  "Volta（小冊）": "dialogue_volta53",
  "Aldini": "dialogue_aldini38"
 },
 "speakerSide": {
  "伽利略": "right",
  "年輕人": "right",
  "辛普里奧": "left",
  "助手": "left",
  "主持": "right",
  "伽桑狄": "right",
  "維達爾船長": "left",
  "艾蒂安": "left",
  "馬蒂厄": "left",
  "Newton": "right",
  "Halley": "left",
  "牛頓": "right",
  "哈雷": "left",
  "杜夏特萊": "right",
  "杜佩院士": "left",
  "朗福德伯爵": "right",
  "史坦格・鑽炮長": "left",
  "凱斯勒院士": "left",
  "Galvani": "right",
  "Volta": "left",
  "Volta（小冊）": "left",
  "Aldini": "right"
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
   "match": "老夫反倒拿你沒辦法",
   "asset": "dialogue_simplicio72_solemn_respect",
   "note": "trap 誠實收束:一輩子頭一回(CH1-CR-010 台詞白話化後同步 match)"
  },
  {
   "scene": "A2-2",
   "speaker": "伽利略",
   "match": "點散成一團",
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
   "match": "提筆，在自己的計算紙上劃掉一行",
   "asset": "dialogue_simplicio76_strikeout",
   "note": "終局三紙重排後，只劃掉方法性批註；原句仍可見"
  },
  {
   "scene": "B3-6",
   "speaker": "辛普里奧",
   "match": "下一回，老夫出題",
   "asset": "dialogue_simplicio76_almost_warm",
   "note": "ch02-p0p1"
  }
 ],
 "lineFocusVisual": [
  {
   "scene": "A2-2",
   "match": "兩支筆刮過紙面的聲音",
   "items": [
    {
     "asset": "ch01_focus_shared_paper_calculation_v01",
     "alt": "燭光下兩人各據一張實驗紙，伽利略核對水滴紙帶，旅人整理總距離紙，兩雙手在桌中央並列工作"
    }
   ],
   "caption": "一人核原紙，一人重排總距離；關係還沒被說出口。"
  },
  {
   "scene": "A2-2",
   "match": "等一下——一、四、九、十六、二十五",
   "items": [
    {
     "asset": "ch01_focus_square_pattern_reading_v01",
     "alt": "從正上方看見完整紙面，五組逐步增長的刻痕下依序寫著一、四、九、十六、二十五；兩人的手停在紙面兩側，沒有遮住資料"
    }
   ],
   "caption": "現在只讀這一列：總距離依序是一、四、九、十六、二十五；推導可稍後再展開。"
  },
  {
   "scene": "B2-3",
   "match": "先換球查重量",
   "items": [
    {
     "asset": "ch02_focus_evidence_next_test_v01",
     "alt": "旅人的手壓住既有砂痕紀錄，伽利略把同尺寸木球移到銅球旁，準備只改變材質與重量"
    }
   ],
   "caption": "舊紙不被抹掉；下一輪只換一個問題來查。"
  },
  {
   "scene": "B2-3",
   "match": "銅球與木球的四列沙痕並排",
   "items": [
    {
     "asset": "ch02_focus_ball_comparison_reading_v01",
     "alt": "從正上方看見銅球與木球各自對應兩列砂痕，四列都由同一座斜槽留下，紙面未寫任何相等或結論符號"
    }
   ],
   "caption": "同一座斜槽留下四列痕跡；先比較，再決定球的重量是否改變結果。"
  },
  {
   "scene": "C3-1",
   "match": "官員逐字把旅人的話寫進結果欄",
   "items": [
    {
     "asset": "ch03_focus_public_limited_claim_v01",
     "alt": "馬賽港的公開桌上，官員落筆、旅人指向有限的結果欄，船長按住兩份有封蠟的來源紙"
    }
   ],
   "caption": "公開記下的不是勝利，而是這批證據真正排除了什麼。"
  },
  {
   "scene": "C3-1",
   "match": "逐字讀完才拿起筆",
   "items": [
    {
     "asset": "ch03_focus_limited_claim_reading_v01",
     "alt": "從正上方看見完整公開紀錄紙，左欄標示排除，右欄標示未直接量；兩欄都保留大量空白與封存來源"
    }
   ],
   "caption": "同一張結果紙分清兩件事：已排除的反對，以及這次沒有直接量到的範圍。"
  },
  {
   "scene": "D1-2",
   "match": "兩人各重做一遍",
   "items": [
    {
     "asset": "ch04_focus_shared_moon_calculation_v01",
     "alt": "月光與燭光交會的書桌上，牛頓與旅人各在一張幾何紙工作，中央短尺連起兩張獨立算紙"
    }
   ],
   "caption": "端點之間的細差先被看見；數值仍要由幾何算出。"
  },
  {
   "scene": "D1-2",
   "match": "兩種筆跡並排留在紙上",
   "items": [
    {
     "asset": "ch04_focus_shared_moon_calculation_v01",
     "alt": "牛頓與旅人的兩張獨立計算紙在桌中央相接，兩人仍各自保留自己的筆與尺"
    }
   ],
   "caption": "旅人先說出平方連結；牛頓另紙重算，再把距離約六十倍與偏折約為地表的三千六百分之一接起來。"
  },
  {
   "scene": "D1-2",
   "match": "月亮這張，約一點三六毫米",
   "items": [
    {
     "asset": "ch04_focus_one_second_papers_reading_v01",
     "alt": "從正上方看見兩張完整算紙：地表一秒約四點九公尺，月球一秒約一點三六毫米；中央只寫待比較，沒有倍率或定律答案"
    }
   ],
   "caption": "兩張紙現在才把一秒讀值放在同一桌面；倍率與距離關係仍由玩家接起來。"
  },
  {
   "scene": "D1-2",
   "match": "月球一秒的『向內差距』",
   "items": [
    {
     "asset": "ch04_prop_tangent_geometry_base_v01",
     "overlay": "orbit-gap",
     "alt": "月球作圖紙同時保留無作用切線與實際短彎路，兩個一秒端點以短線相接，等待玩家辨認哪一段是向內偏折"
    }
   ],
   "caption": "這一步只判讀幾何：向前走的弧長、月地半徑，還是兩個端點之間的短差？"
  },
  {
   "scene": "E2-2",
   "match": "她把手按在那六張紀錄紙上",
   "items": [
    {
     "asset": "ch05_focus_same_six_records_relation_v01",
     "alt": "西雷書房裡，杜夏特萊一手按住橫排的六張碰撞紀錄、一手指出其中一張；旅人在對面持筆核對，同桌而非受教"
    }
   ],
   "caption": "兩人先守住同一批六張原紙：換帳，不換資料。"
  },
  {
   "scene": "E2-2",
   "match": "這一組……少了一截",
   "items": [
    {
     "asset": "ch05_focus_two_ledgers_reading_v01",
     "alt": "從正上方看見同六張紀錄位於兩本帳上方；動量帳目前一列對齊，活力帳同一列右端留下被圈起的空缺"
    }
   ],
   "caption": "不用一次讀完整本帳：只看正在核對的這一列，右頁確實少了一截。"
  },
  {
   "scene": "H1-1",
   "match": "旅人把兩條紙帶的起點對齊",
   "items": [
    {
     "asset": "ch06_focus_four_hands_strip_alignment_v01",
     "alt": "慕尼黑兵工廠的桌上，旅人、朗福德、凱斯勒與史坦格各伸出一隻手，共同把兩條紙帶對齊同一起點"
    }
   ],
   "caption": "四個人各守一處：起點、紙角、尺與末端都能被彼此核對。"
  },
  {
   "scene": "H1-1",
   "match": "這組紙最多支持到哪裡？",
   "items": [
    {
     "asset": "ch06_focus_heat_strips_reading_v01",
     "alt": "從正上方看見碎屑與薄片兩條完整紙帶從同一起點展開，兩線幾乎重合；圖中沒有替玩家寫出可排除的主張"
    }
   ],
   "caption": "先讀兩條紙帶本身：同起點、近乎重合；它能排除到哪裡，仍由玩家作答。"
  },
  {
   "scene": "H3-1",
   "match": "炮紙沒有因此變假",
   "items": [
    {
     "asset": "ch06_focus_public_blank_admission_v01",
     "alt": "對帳板保留炮鑽紀錄與冰的藍紙，中央另釘一張完全空白的紙，四人的手都沒有把它遮住"
    }
   ],
   "caption": "炮紙留下；冰的空欄也留下。承認未決，是共同頁的一部分。"
  },
  {
   "scene": "C0-3",
   "match": "舊紙已收入卷宗",
   "items": [
    {
     "asset": "ch03_focus_old_paper_dossier_v01",
     "alt": "戲劇化重建的舊紙正面攤在馬賽碼頭石台上，三顆石子壓住紙角，第四顆剛被挪開；紙上只有模糊欄線與一大片留白，沒有可讀署名或數字"
    }
   ],
   "caption": "舊紙正面（戲劇化重建）：它只留下一次落在桅後的紀錄；船速欄空白，正面也沒有署名。"
  },
  {
   "scene": "D1-1",
   "match": "月亮先前走過的一小段圓弧",
   "items": [
    {
     "asset": "ch04_prop_tangent_geometry_base_v01",
     "overlay": "orbit-base",
     "alt": "俯視牛頓桌上的月球作圖紙：地球、月亮、地月半徑，以及只畫到此刻月亮位置的短圓弧；月亮前方仍是空白"
    }
   ],
   "caption": "先放入已觀察到的短圓弧；月亮下一步怎麼走，紙上還沒有答案。"
  },
  {
   "scene": "D1-1",
   "match": "旅人把尺靠上月亮此刻的方向",
   "items": [
    {
     "asset": "ch04_prop_tangent_geometry_base_v01",
     "overlay": "orbit-tangent",
     "alt": "同一張月球作圖紙上，從圓弧末端的月亮位置沿當下方向加畫一段直切線；前方尚未畫實際彎路"
    }
   ],
   "caption": "先只畫無作用時的下一步：從此刻的月亮位置沿切線直走。"
  },
  {
   "scene": "D1-1",
   "match": "牛頓在同一張紙上補出月亮實際走過",
   "items": [
    {
     "asset": "ch04_prop_tangent_geometry_base_v01",
     "overlay": "orbit-gap",
     "alt": "同一張月球作圖紙同時保留直切線與向地球彎曲的實際短路徑；切線端點和實際端點之間以短線精確連接"
    }
   ],
   "caption": "再補實際彎路：兩個端點之間朝地球縮進去的短差，才是這一步的向內偏折。"
  },
  {
   "scene": "D2-1",
   "match": "他在木球上繫好細繩",
   "items": [
    {
     "asset": "ch04_prop_rope_ball_setup_v01",
     "alt": "演示前放在工作桌上的木球與細繩，尚未甩動或鬆手"
    }
   ],
   "caption": "繩球演示的裝置：它只把「持續轉彎需要持續改變運動」的問題指出來，不替月亮提供答案。"
  },
  {
   "scene": "D1-2",
   "match": "他把兩張紙放進抽屜",
   "items": [
    {
     "asset": "ch04_focus_drawer_closes_1665_v01",
     "alt": "1665 年工作桌的抽屜被輕輕關上，兩張尚未完成的計算紙留在裡面"
    }
   ],
   "caption": "兩張紙先進抽屜：量級對上了，但「憑什麼從地心量」尚未被證明。"
  },
  {
   "scene": "D2-1",
   "match": "信上畫著兩支箭",
   "items": [
    {
     "asset": "ch04_prop_hooke_letter_reconstruction_v01",
     "alt": "1679 年書信的戲劇化道具重建，紙上只有未完成的方向草記"
    }
   ],
   "caption": "1679 年書信道具重建（非真跡影像）：信把切線前進與向中心吸引放進同一個問題，沒有替後面的證明作答。"
  },
  {
   "scene": "D2-1",
   "match": "桌上排著旅人挑出的三張紙",
   "items": [
    {
     "asset": "ch04_focus_newton_orbit_montage_1679_v01",
     "alt": "1679 年燭光下，旅人與牛頓一同核對多張快慢與向內扳量不同的試跑紙"
    }
   ],
   "caption": "玩家先試跑並挑出三張可比較紀錄；牛頓與旅人再共同核對。底圖只承載手、紙與燭光，路徑與設定仍由引擎依玩家操作繪製。"
  },
  {
   "scene": "D2-1",
   "match": "最高的山頂上，架一門砲",
   "items": [
    {
     "asset": "ch04_focus_newton_cannonball_reconstruction_v01",
     "alt": "依牛頓 1728 年刊本原典圖重建的仿古紙頁：山頂水平發砲，不同初速形成落地、繞行與外圈軌道"
    }
   ],
   "caption": "依牛頓 1728 年刊本原典圖重建（不是原典掃描，也不是牛頓親筆手稿）：不同初速讓砲彈落地、繞行或走上更外圈的路。"
  },
  {
   "scene": "D3-1",
   "match": "哈雷掏出封蠟",
   "items": [
    {
     "asset": "ch04_prop_halley_sealed_observation_box_v01",
     "alt": "哈雷木匣裡兩包仍以蠟封住的觀測紙，資料內容尚未揭露"
    }
   ],
   "caption": "觀測仍在封口裡：先留下預測，才有資格拆開火星與木星的資料。"
  },
  {
   "scene": "D4-1",
   "match": "攪茶圖卡",
   "items": [
    {
     "asset": "ch04_focus_stirred_tea_analogy_v01",
     "alt": "1684 年劍橋書桌上的茶碗正被湯匙攪動，茶葉隨茶水形成自然旋流；畫面沒有行星、軌跡或結論標記"
    }
   ],
   "caption": "攪茶只幫玩家看懂「流帶著東西轉」的類比；它不是天空觀測，也不表示渦旋已被證明。"
  },
  {
   "scene": "D4-1",
   "match": "磁石圖卡",
   "items": [
    {
     "asset": "ch04_focus_lodestone_needle_analogy_v01",
     "alt": "1684 年劍橋書桌上的天然磁石與一根分開放置的鐵針；兩者尚未接觸，畫面沒有磁力線或箭頭"
    }
   ],
   "caption": "磁石只借「隔空」與「距離越遠、作用越弱」兩點；不能把磁力機制等同引力。"
  },
  {
   "scene": "D4-1",
   "match": "三份觀測封面",
   "items": [
    {
     "asset": "ch04_focus_three_observation_folios_v01",
     "alt": "劍橋書桌上並列三份獨立封好的觀測卷宗，封面分別以月牙、兩顆圓點與彗星符號區分，沒有可讀數據"
    }
   ],
   "caption": "三份封面只標示待過帳的資料類別；距離、週期、日期與星位仍由引擎表格承載。"
  },
  {
   "scene": "D4-2",
   "match": "厚薄均勻的球殼",
   "items": [
    {
     "asset": "ch04_focus_shell_theorem_page_v01",
     "overlay": "shell-theorem",
     "alt": "1687 年印刷台上的空白證明紙頁，疊有引擎繪製的同心球殼、球心、殼外點與連線"
    }
   ],
   "caption": "球殼頁的紙張與印刷台是情境底圖；同心殼、殼外點與球心關係由引擎 SVG 疊加。"
  },
  {
   "scene": "D4-2",
   "match": "作者欄沒有旅人的名條",
   "items": [
    {
     "asset": "ch04_prop_print_credit_sources_v01",
     "alt": "印刷版框旁分開擺放書信、計算紙與觀測紀錄，沒有任何一份覆蓋其他來源"
    }
   ],
   "caption": "署名決定之後，來源仍各自留在紙上：問題、證明、觀測與編務不能互相抹除。"
  },
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
   "match": "出示高塔落球紀錄",
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
   "match": "五段都對得上",
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
   "match": "從桌上抓起一張寫壞的稿紙",
   "items": [
    {
     "asset": "prop_paper_shape_balance",
     "alt": "同樣份量的紙，一邊攤平、一邊揉成紙團，放在水平天平兩端"
    }
   ],
   "caption": "同一張紙，只改變形狀；先別猜哪一種落得快。"
  },
  {
   "scene": "A2-4",
   "match": "取得證據：介質阻力辨析",
   "items": [
    {
     "asset": "card_E4",
     "alt": "介質與形狀對照實驗證據卡：同一張紙與同一組球的單變因比較"
    }
   ],
   "caption": "介質阻力辨析：快慢差異不能直接記在重量頭上。"
  },
  {
   "scene": "B0-2",
   "match": "他從袖中取出折紙",
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
   "match": "高層最後落下",
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
   "match": "如果它要等推力用完才下墜",
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
   "match": "牆上:墨跡板",
   "items": [
    {
     "asset": "ch02_focus_ship_mast_thought_v01",
     "alt": "只有桅杆與落石問號、尚未留下船上紀錄的待驗預測紙"
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
     "asset": "card_F3",
     "alt": "三個高度逐列確認的一拋一放聲響紀錄"
    }
   ],
   "caption": "三份完成的紀錄留在牆上；只有船桅預測尚未實做，等著被寫清界線後封進蠟袋。"
  },
  {
   "scene": "E-1",
   "match": "石子劃出一道弧",
   "items": [
    {
     "asset": "ch01_focus_canal_first_arc_v01",
     "alt": "黃昏的帕多瓦運河上，一顆石子離手後一面向前、一面向水面下降，前方漣漪正在散開"
    }
   ],
   "caption": "第一道未解的弧：石子向前，也在同一刻向下。"
  },
  {
   "scene": "B1-2",
   "match": "想像一條船順流而下",
   "items": [
    {
     "asset": "ch02_focus_ship_mast_thought_v01",
     "alt": "雨夜工作室的筆記紙上，一艘想像的船由墨線浮起，石頭停在桅頂上方，落點仍未畫出"
    }
   ],
   "caption": "這只是紙上的待驗預測：先把兩種落點都留給真正的船回答。"
  },
  {
   "scene": "CE-1",
   "match": "紙張、鉛字與油墨",
   "items": [
    {
     "asset": "ch03_focus_two_books_1642_v01",
     "alt": "1642 年印刷室的桌上，伽利略的舊書與伽桑狄的新手稿並排，中間放著馬賽實驗紀錄，桌角留著一封未朗讀的信"
    }
   ],
   "caption": "書帶問題到海上；紀錄再把海帶回書裡。桌角那封信，沒有人念出聲。"
  },
  {
   "scene": "CE-2",
   "match": "褐色字跡旁忽然透出冷白光",
   "epilogue": true,
   "epilogueLayer": "future-echo",
   "items": [
    {
     "asset": "ch03_future_echo_apollo8_v01",
     "alt": "1968 年阿波羅八號月球軌道艙內，三名太空人面向儀表，無字紙張與鉛筆浮在身旁，窗外是月面與遠方地球"
    }
   ],
   "caption": "1968・阿波羅 8 號｜艙內一切與飛船共同前進；整艘船為什麼繞月轉彎，這一幕仍沒回答。"
  },
  {
   "scene": "CE-2",
   "match": "旅人把岸上那道彎線往前延長",
   "epilogue": true,
   "epilogueLayer": "question-handoff",
   "items": [
    {
     "asset": "ch03_epilogue_moon_question_v01",
     "alt": "1642 年印刷室的兩條同步紙帶並排，筆記上的墨弧停在半途，窗外月亮與弧線之間沒有連線"
    }
   ],
   "caption": "紙帶留下共同前進的證據；月亮為什麼沒有沿直線離開，仍在下一頁等答案。"
  },
  {
   "scene": "E-2",
   "match": "鎚羽影像消失",
   "epilogue": true,
   "epilogueLayer": "question-handoff",
   "items": [
    {
     "asset": "ch01_epilogue_unresolved_arc_v01",
     "alt": "帕多瓦運河石橋上的旅人筆記攤開，一顆石子壓著運河素描，未完的墨弧跨過書脊後停在空白頁"
    }
   ],
   "caption": "鎚和羽回答了落下；運河石子留下的彎曲路徑，仍停在空白頁。"
  },
  {
   "scene": "BE-2",
   "match": "球桿早已留在身後",
   "epilogue": true,
   "epilogueLayer": "future-echo",
   "items": [
    {
     "asset": "ch02_epilogue_motion_continues_v01",
     "alt": "旅人筆記透出的 1971 年月球遠景裡，太空人與球桿留在左後方，唯一一顆小白球已飛到右前景"
    }
   ],
   "caption": "向前與向下已能一起描述；沒有持續推動，運動為什麼仍會繼續？"
  },
  {
   "scene": "DE-2",
   "match": "旅人筆記的頁角忽然亮起",
   "epilogue": true,
   "epilogueLayer": "future-echo",
   "items": [
    {
     "asset": "ch04_future_echo_sputnik_v01",
     "alt": "1957 年史普尼克一號的銀色球體與四根長天線從旅人筆記上方掠過地球弧面，畫面沒有軌道線或文字"
    }
   ],
   "caption": "1957・史普尼克一號｜人造衛星把牛頓的軌道規則帶進工程；碰撞後該守住什麼，仍是另一本帳。"
  },
  {
   "scene": "DE-2",
   "match": "桌上有兩張帳",
   "epilogue": true,
   "epilogueLayer": "question-handoff",
   "items": [
    {
     "asset": "ch04_epilogue_two_collision_accounts_v01",
     "alt": "1687 年印刷室裡兩只字盤撞後錯開，方向紀錄與凹痕紀錄分列左右，中間留著一張空白卡"
    }
   ],
   "caption": "兩張帳都能誠實記下碰撞；真正該守住哪一筆，還沒有名字。"
  },
  {
   "scene": "EE-2",
   "match": "空框裡先落下一點灰",
   "epilogue": true,
   "epilogueLayer": "future-echo",
   "items": [
    {
     "asset": "ch05_future_echo_dart_v01",
     "alt": "DART 飛行器剛撞上小行星衛星 Dimorphos，岩石碎屑向外飛散，較大的 Didymos 位在遠方，頁面下緣仍可見旅人筆記"
    }
   ],
   "caption": "2022・DART｜撞後運動與碎屑痕跡都要記；撞擊畫面仍不能替可見運動的短少完整結帳。"
  },
  {
   "scene": "EE-2",
   "match": "短少的那一截沒有消失",
   "epilogue": true,
   "epilogueLayer": "question-handoff",
   "items": [
    {
     "asset": "ch05_epilogue_blank_receipt_v01",
     "alt": "西雷書桌上的兩本帳分列左右，凹陷黏土放在其中一頁，旅人的筆停在中央空白收據上方"
    }
   ],
   "caption": "凹痕可以量，短少也確實存在；空白收據仍在等它去了哪裡。"
  },
  {
   "scene": "HE-1",
   "match": "旅人筆記的紙邊忽然泛出冷白光",
   "epilogue": true,
   "epilogueLayer": "future-echo",
   "items": [
    {
     "asset": "ch06_future_echo_fsw_v01",
     "alt": "現代摩擦攪拌焊機的旋轉工具壓過兩塊鋁板接縫，接觸處因發熱泛出暖色但沒有火焰，角落疊著旅人筆記"
    }
   ],
   "caption": "1991 年後・摩擦攪拌焊｜持續機械接觸能使金屬發熱軟化；固定兌換率仍須另一把尺。"
  },
  {
   "scene": "HE-1",
   "match": "旅人把兩頁攤在一起",
   "epilogue": true,
   "epilogueLayer": "question-handoff",
   "items": [
    {
     "asset": "ch06_epilogue_unmeasured_exchange_v01",
     "alt": "1798 年兵工廠桌上，機械作用頁與水溫頁分列兩側，中央兌換欄空白，黃銅量規尚未對上兩頁的刻度"
    }
   ],
   "caption": "兩頁紀錄各自成立；一份機械作用究竟能換來多少升溫，仍未量得。"
  },
  {
   "scene": "H0-1",
   "match": "一塊剛削下的黃銅碎屑",
   "items": [
    {
     "asset": "ch06_focus_hot_chip_water",
     "alt": "史坦格用鐵鉗夾住剛削下的黃銅碎屑，放向一桶水；水面冒出白氣，畫面不含溫度數字"
    }
   ],
   "caption": "碎屑確實很熱；它是不是熱的來源，還要用等質量、等初溫的比較來追問。"
  },
  {
   "scene": "H0-3",
   "match": "從皮匣取出一本薄冊",
   "items": [
    {
     "asset": "ch06_focus_latent_heat_notebook",
     "alt": "凱斯勒的薄冊攤在冰水杯旁，紙頁保留留白，沒有把潛熱現象寫成已解答案"
    }
   ],
   "caption": "薄冊把未查現象留在桌上：有限來源受挫，不等於熱的機制已經證明。"
  },
  {
   "scene": "EM7-1",
   "match": "銅鉤擺過去，碰上鐵欄",
   "items": [
    {
     "asset": "ch07_focus_frog_witness_v01",
     "alt": "Galvani 與旅人的手同時停在黃銅鉤與鐵接點旁，覆布標本的接觸位置成為兩人共同注視的焦點"
    }
   ],
   "caption": "腿踢了一下；兩個人先看同一個接點，再爭它能證明什麼。"
  },
  {
   "scene": "EM7-2",
   "match": "書商捎來一冊帕維亞印的小冊子",
   "items": [
    {
     "asset": "ch07_focus_four_papers_matrix_v01",
     "alt": "四張無字複驗原紙依接法排在桌上，最舊的 1794 年紙壓在一旁，沒有任何正誤印章"
    }
   ],
   "caption": "四格都由玩家親手留下；舊紙沒有因新主張而消失。"
  },
  {
   "scene": "EM7-3",
   "match": "Volta 取出一座小裝置",
   "items": [
    {
     "asset": "ch07_focus_volta_electrometer_v01",
     "alt": "旅人的雙手操作黃銅與鋅片、薄盤和細針電量器，Volta 退在後方抱手旁觀"
    }
   ],
   "caption": "儀器是 Volta 的，接觸與讀針由玩家親手完成。"
  },
  {
   "scene": "EM7-E",
   "match": "把一份傳抄的圖說攤開在矩陣旁",
   "items": [
    {
     "asset": "ch07_focus_volta_pile_v01",
     "alt": "旅人與 Aldini 依圖交替排放銅片、鋅片與濕布，尚未用任何發光效果預告結果"
    }
   ],
   "caption": "圖說只給接法；堆能不能持續，由玩家把兩端接起來。"
  },
  {
   "scene": "EM7-E",
   "match": "六格第一次睡在同一張紙上",
   "items": [
    {
     "asset": "ch07_focus_six_papers_board_v01",
     "alt": "六張已取得原紙歸在同一頁，接法物件仍可逐格追查，兩條過寬墨線被保留並限縮"
    }
   ],
   "caption": "六張紙第一次同頁；合帳不是抹平差異，而是讓每一格互相限制。"
  },
  {
   "scene": "EM7-E",
   "match": "摺成一封信的形狀",
   "items": [
    {
     "asset": "ch07_focus_empty_recipient_letter_v01",
     "alt": "清晨桌上一封摺好的信仍空著收件人欄，旁邊是可追查的六格矩陣與被劃限的原句"
    }
   ],
   "caption": "收件人欄留白；證詞沒有因此失去去處。"
  }
 ],
 "viewFocusVisual": [
  {
   "scene": "D1-1",
   "nodeIds": [
    "c1",
    "w1",
    "w2",
    "w3"
   ],
   "match": "月亮先前走過的一小段圓弧"
  },
  {
   "scene": "D1-1",
   "nodeIds": [
    "c2",
    "w4",
    "w5",
    "ok2",
    "ok3",
    "ok4",
    "ok5"
   ],
   "match": "牛頓在同一張紙上補出月亮實際走過"
  },
  {
   "scene": "D1-2",
   "nodeIds": [
    "c_geom",
    "wg1",
    "wg2"
   ],
   "match": "月球一秒的『向內差距』"
  },
  {
   "scene": "B2-4",
   "nodeIds": [
    "q4",
    "nb1",
    "n3"
   ],
   "match": "高層最後落下"
  },
  {
   "scene": "H1-1",
   "nodeIds": [
    "c1"
   ],
   "match": "這組紙最多支持到哪裡？"
  },
  {
   "scene": "EM7-3",
   "nodeIds": [
    "e_electrometer"
   ],
   "match": "Volta 取出一座小裝置"
  },
  {
   "scene": "EM7-E",
   "nodeIds": [
    "e_pile"
   ],
   "match": "把一份傳抄的圖說攤開在矩陣旁"
  }
 ],
 "sceneTreatment": {
  "D-INT-1": {
   "mode": "time-passage",
   "label": "1665 → 1679",
   "caption": "十四年，折進一頁"
  }
 },
 "sceneFx": {
  "P0-1": {
   "fx": "montage",
   "steps": [
    {
     "plate": "ch01_transition_first_arrival_pisa_v01",
     "label": "1590｜義大利・比薩",
     "caption": "白光退去。四百多年以前的鐘聲迎面而來。"
    }
   ]
  },
  "INT-1": {
   "fx": "montage",
   "steps": [
    {
     "plate": "int1_pisa_notebook",
     "label": "1592｜比薩 → 帕多瓦",
     "caption": "他離開了比薩，問題沒有。"
    },
    {
     "plate": "int1_time_passage",
     "label": "1597–1602｜帕多瓦",
     "caption": "工作、學生與債信填滿日子；斜面與擺，又讓他半夜起床。"
    },
    {
     "plate": "int1_padua_notebook",
     "label": "1603｜帕多瓦",
     "caption": "對旅人只是一頁；對伽利略，是十一年。"
    }
   ]
  },
  "B0-1": {
   "fx": "montage",
   "steps": [
    {
     "plate": "ch02_transition_1604_1608_pagefold_v01",
     "label": "1604→1608｜筆記只翻一頁",
     "caption": "窗外換了四次季節；旅人的手，仍是初到比薩那天的手。"
    },
    {
     "plate": "ch02_transition_old_page_handoff_v01",
     "label": "1608｜義大利・帕多瓦",
     "caption": "工作室裡多了四年的木屑、器材與批註；問題沒有被收進抽屜。"
    },
    {
     "plate": "ch02_transition_simplicio_returns_v01",
     "label": "敲門聲｜舊證據回來了",
     "caption": "辛普里奧把夾進《物理學》的數據紙帶回來——不是認輸，是來問下一題。"
    }
   ]
  },
  "C0-1": {
   "fx": "montage",
   "triggerMatch": "頁面自己動了",
   "steps": [
    {
     "plate": "ch03_transition_1609_question_departs_v01",
     "label": "1609｜帕多瓦",
     "caption": "伽利略轉向天空，船艙問題留在筆記裡。"
    },
    {
     "plate": "ch03_transition_1610_jupiter_observation_v01",
     "label": "1610｜帕多瓦",
     "caption": "鏡筒對準木星，四顆伴星改變了天空的秩序。"
    },
    {
     "plate": "ch03_transition_1616_roman_admonition_v01",
     "label": "1616｜羅馬",
     "caption": "一份告誡送到羅馬；他收下，沒有回話。"
    },
    {
     "plate": "ch03_transition_1632_dialogue_ship_page_v01",
     "label": "1632｜《對話》出版",
     "caption": "他把未完的問題，寫進一艘想像的船。"
    },
    {
     "plate": "ch03_transition_1633_roman_statement_v01",
     "label": "1633｜羅馬",
     "caption": "他在羅馬讀完聲明，之後回到阿爾切特里。"
    },
    {
     "plate": "ch03_transition_1640_gassendi_handoff_v01",
     "label": "1640｜法國・馬賽",
     "caption": "八年後，馬賽有人接住了那一頁。"
    }
   ]
  },
  "D0-2": {
   "fx": "montage",
   "steps": [
    {
     "plate": "ch04_transition_1642_question_opens_v01",
     "label": "1642｜法國・馬賽",
     "caption": "馬賽港的紙帶已乾，月亮的問題卻從末頁亮了起來。"
    },
    {
     "plate": "ch04_transition_1655_paper_passage_v01",
     "label": "1642→1665｜紙頁之間",
     "caption": "二十三年折進紙縫；旅人沒有變，問題仍在往前。"
    },
    {
     "plate": "ch04_transition_1665_woolsthorpe_arrival_v01",
     "label": "1665｜英格蘭・伍爾索普",
     "caption": "白光退去。濕草、石牆，和白日天空裡沒有墜落的月亮。"
    }
   ]
  },
  "E0-1": {
   "fx": "montage",
   "steps": [
    {
     "plate": "ch05_transition_1687_collision_question_v01",
     "label": "1687｜英格蘭・倫敦",
     "caption": "《原理》已經印成書；碰撞之後該記住什麼，仍留在旅人的下一頁。"
    },
    {
     "plate": "ch05_transition_1687_1740_pagefold_v01",
     "label": "1687→約 1740｜筆記翻過五十三年",
     "caption": "五十三年折進紙縫。旅人沒有變，接住問題的人已換了一代。"
    },
    {
     "plate": "ch05_transition_1740_cirey_arrival_v01",
     "label": "約 1740｜法國・西雷莊園",
     "caption": "白光退去。書房裡已有兩本帳，等著被分開算清。"
    }
   ]
  },
  "H0-1": {
   "fx": "montage",
   "steps": [
    {
     "plate": "ch06_transition_1740_unpaid_heat_debt_v01",
     "label": "約 1740｜法國・西雷莊園",
     "caption": "兩本碰撞帳已經分開；熱從哪裡來，仍是一張沒有付清的收據。"
    },
    {
     "plate": "ch06_transition_1740_1798_pagefold_v01",
     "label": "約 1740→1798｜筆記翻過五十八年",
     "caption": "五十八年折進紙縫。旅人沒有變，問題換了一座工場。"
    },
    {
     "plate": "ch06_transition_1798_munich_arsenal_arrival_v01",
     "label": "1798｜巴伐利亞・慕尼黑軍械庫",
     "caption": "白光退去。炮身正在旋轉，固定的鈍鑽把熱一刻一刻留進原紙。"
    }
   ]
  },
  "EM7-0": {
   "fx": "montage",
   "steps": [
    {
     "plate": "bg_ch07_bologna_rain_arrival",
     "label": "1798｜義大利・波隆那",
     "caption": "炮膛的火星退成雨聲；一隻腿替新的問題作證。"
    }
   ]
  },
  "EM7-E": {
   "fx": "montage",
   "steps": [
    {
     "plate": "bg_ch07_galvani_return_evening",
     "label": "1798｜波隆那",
     "caption": "倒下的全稱被劃線；還沒有證據的那一行留白。"
    },
    {
     "plate": "bg_ch07_aldini_study_1800_dawn",
     "label": "1800｜同一間書房",
     "caption": "兩年後，另一張紙終於回來。寫下它的人已不在。"
    }
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
  "C1-5": "ch3Experiment",
  "C2-1": "ch3Cabin",
  "C2-2": "ch3Experiment",
  "C2-2B": "ch3Harbor",
  "C2-3": "ch3Harbor",
  "C2-4": "ch3Overlay",
  "C3-1": "ch3Public",
  "C3-2": "ch3Public",
  "C3-3": "ch3Public",
  "C3-4": "ch3Public",
  "CE-1": "ch3Print",
  "CE-2": "ch3Print",
  "SC3-R1": "ch3Public",
  "D0-1": "ch3Print",
  "D0-2": "ch4Orchard",
  "D1-1": "ch4Orbit",
  "D1-2": "ch4Orbit",
  "D-INT-1": "timePassage",
  "D1-3": "ch4Orbit",
  "D2-1": "ch4Hooke",
  "D2-2": "ch4Hooke",
  "D2-3": "ch4Predictions",
  "D3-1": "ch4Predictions",
  "D3-2": "ch4Greenwich",
  "D3-3": "ch4Press",
  "D3-4": "ch4Press",
  "D4-1": "ch4Press",
  "D4-2": "ch4Press",
  "DE-1": "ch4Principia",
  "DE-2": "ch4Principia",
  "SC4-R1": "ch4Press",
  "ch5:E0-1": "ch5Cirey",
  "ch5:E0-2": "ch5Dupre",
  "ch5:E1-1": "ch5Dupre",
  "ch5:E1-2": "ch5Collision",
  "ch5:E2-1": "ch5Collision",
  "ch5:E2-2": "ch5Collision",
  "ch5:E2-3": "ch5Clay",
  "ch5:E3-1": "ch5Debate",
  "ch5:E3-2": "ch5Debate",
  "ch5:EE-1": "ch5Emilie",
  "ch5:EE-2": "ch5Emilie",
  "ch5:SC5-R1": "silence",
  "INT-C1": "ch3Harbor",
  "INT-C2": "ch3Public",
  "ch6:H0-1": "ch6Arsenal",
  "ch6:H0-2": "ch6Arsenal",
  "ch6:H0-3": "ch6Sources",
  "ch6:H1-1": "ch6Contact",
  "ch6:H1-2": "ch6Contact",
  "ch6:H1-3": "ch6Strip",
  "ch6:H2-1": "ch6Containment",
  "ch6:H2-2": "ch6Containment",
  "ch6:H2-3": "ch6Continuous",
  "ch6:H3-1": "ch6Audit",
  "ch6:H3-2": "ch6Audit",
  "ch6:HE-1": "ch6JointPage",
  "ch6:SC6-R1": "silence",
  "ch7:EM7-0": "ch7Bologna",
  "ch7:EM7-1": "ch7Bologna",
  "ch7:EM7-2": "ch7Matrix",
  "ch7:EM7-3": "ch7Pavia",
  "ch7:EM7-4": "ch7Matrix",
  "ch7:EM7-E": "ch7Letter",
  "ch7:SC7-R1": "silence"
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
   "clips": [
    "ch03/Ch3_Harbor_Dawn.mp3"
   ]
  },
  "ch3Experiment": {
   "mode": "milestone",
   "repeatGapMs": 5000,
   "clips": [
    "ch03/Ch3_Mast_Experiment_A.mp3",
    "ch03/Ch3_Mast_Experiment_B.mp3",
    "ch03/Ch3_Mast_Experiment_C.mp3"
   ]
  },
  "ch3Cabin": {
   "mode": "once",
   "repeatGapMs": 5000,
   "clips": [
    "ch03/Ch3_Closed_Cabin.mp3"
   ]
  },
  "ch3Overlay": {
   "mode": "once",
   "repeatGapMs": 5000,
   "clips": [
    "ch03/Ch3_Two_Records.mp3"
   ]
  },
  "ch3Public": {
   "mode": "milestone",
   "repeatGapMs": 5000,
   "clips": [
    "ch03/Ch3_Public_Demonstration_A.mp3",
    "ch03/Ch3_Public_Demonstration_B.mp3",
    "ch03/Ch3_Public_Demonstration_C.mp3"
   ]
  },
  "ch3Print": {
   "mode": "once",
   "repeatGapMs": 5000,
   "clips": [
    "ch03/Ch3_Print_Room_1642.mp3"
   ]
  },
  "ch4Orchard": {
   "mode": "once",
   "repeatGapMs": 5000,
   "clips": [
    "ch04/Ch4_Orchard_Question.mp3"
   ]
  },
  "ch4Orbit": {
   "mode": "milestone",
   "repeatGapMs": 5000,
   "clips": [
    "ch04/Ch4_Orbit_Workbench_A.mp3",
    "ch04/Ch4_Orbit_Workbench_B.mp3",
    "ch04/Ch4_Orbit_Workbench_C.mp3"
   ]
  },
  "ch4Hooke": {
   "mode": "once",
   "repeatGapMs": 5000,
   "clips": [
    "ch04/Ch4_Hooke_Letter_1679.mp3"
   ]
  },
  "ch4Predictions": {
   "mode": "once",
   "repeatGapMs": 5000,
   "clips": [
    "ch04/Ch4_Sealed_Predictions.mp3"
   ]
  },
  "ch4Greenwich": {
   "mode": "once",
   "repeatGapMs": 5000,
   "clips": [
    "ch04/Ch4_Greenwich_Comet.mp3"
   ]
  },
  "ch4Press": {
   "mode": "milestone",
   "repeatGapMs": 5000,
   "clips": [
    "ch04/Ch4_Press_Window_A.mp3",
    "ch04/Ch4_Press_Window_B.mp3",
    "ch04/Ch4_Press_Window_C.mp3"
   ]
  },
  "ch4Principia": {
   "mode": "once",
   "repeatGapMs": 5000,
   "clips": [
    "ch04/Ch4_Principia_1687.mp3"
   ]
  },
  "ch5Cirey": {
   "mode": "once",
   "repeatGapMs": 5000,
   "clips": [
    "ch05/Ch5_Cirey_Open_Book.mp3"
   ]
  },
  "ch5Dupre": {
   "mode": "once",
   "repeatGapMs": 5000,
   "clips": [
    "ch05/Ch5_Dupre_Ledger.mp3"
   ]
  },
  "ch5Collision": {
   "mode": "milestone",
   "repeatGapMs": 5000,
   "clips": [
    "ch05/Ch5_Collision_Workbench_A.mp3",
    "ch05/Ch5_Collision_Workbench_B.mp3",
    "ch05/Ch5_Collision_Workbench_C.mp3"
   ]
  },
  "ch5Clay": {
   "mode": "once",
   "repeatGapMs": 5000,
   "clips": [
    "ch05/Ch5_Clay_Remembers.mp3"
   ]
  },
  "ch5Debate": {
   "mode": "milestone",
   "repeatGapMs": 5000,
   "clips": [
    "ch05/Ch5_Ledger_Debate_A.mp3",
    "ch05/Ch5_Ledger_Debate_B.mp3",
    "ch05/Ch5_Ledger_Debate_C.mp3"
   ]
  },
  "ch5Emilie": {
   "mode": "once",
   "repeatGapMs": 5000,
   "clips": [
    "ch05/Ch5_Emilie_Night_Proof.mp3"
   ]
  },
  "ch6Arsenal": {
   "mode": "once",
   "repeatGapMs": 5000,
   "clips": [
    "ch06/Ch6_Arsenal_Question.mp3"
   ]
  },
  "ch6Sources": {
   "mode": "once",
   "repeatGapMs": 5000,
   "clips": [
    "ch06/Ch6_Four_Sources_Ledger.mp3"
   ]
  },
  "ch6Contact": {
   "mode": "once",
   "repeatGapMs": 5000,
   "clips": [
    "ch06/Ch6_Chips_And_Contact.mp3"
   ]
  },
  "ch6Strip": {
   "mode": "once",
   "repeatGapMs": 5000,
   "clips": [
    "ch06/Ch6_First_Rising_Strip.mp3"
   ]
  },
  "ch6Containment": {
   "mode": "once",
   "repeatGapMs": 5000,
   "clips": [
    "ch06/Ch6_Seal_Air_And_Water.mp3"
   ]
  },
  "ch6Continuous": {
   "mode": "once",
   "repeatGapMs": 5000,
   "clips": [
    "ch06/Ch6_Continuous_Run.mp3"
   ]
  },
  "ch6Audit": {
   "mode": "once",
   "repeatGapMs": 5000,
   "clips": [
    "ch06/Ch6_Model_Audit.mp3"
   ]
  },
  "ch6JointPage": {
   "mode": "once",
   "clips": [
    "ch06/Ch6_Sign_Observation.mp3"
   ]
  },
  "silence": {
   "mode": "silence",
   "clips": []
  },
  "storm": null,
  "ch7Bologna": {
   "mode": "once",
   "repeatGapMs": 5000,
   "clips": [
    "ch07/Ch7_Bologna_Rain_And_Brass.mp3"
   ]
  },
  "ch7Matrix": {
   "mode": "once",
   "repeatGapMs": 5000,
   "clips": [
    "ch07/Ch7_Four_Papers_Question.mp3"
   ]
  },
  "ch7Pavia": {
   "mode": "once",
   "repeatGapMs": 5000,
   "clips": [
    "ch07/Ch7_Pavia_Needle.mp3"
   ]
  },
  "ch7Letter": {
   "mode": "once",
   "clips": [
    "ch07/Ch7_Letter_Without_Recipient.mp3"
   ]
  }
 },
 "evidenceSummary": {
  "E1": "只能證明「近乎同落」——排除不了空氣與形狀。",
  "E2": "同一前提,同時推出更快與更慢。",
  "E3a": "規律本身成立——但還沒說它跟什麼無關。",
  "E3b": "只換球重,規律沒有改變。",
  "E3c": "換了傾角,規律的形狀仍然不變。",
  "E3": "水鐘等時切段後，各段新增距離呈一、三、五、七的奇數律；只換球重或傾角複驗，規律的形式仍然不變。",
  "E4": "重量沒變,只改形狀或介質,先後就變了。",
  "E5": "奇數律在各傾角都保持同一形式；增陡只改變快慢，垂直則是斜面立到底的極限方向。因此可把斜面上量到的平方關係誠實外推至自由落下，但並未直接量過垂直落下。",
  "S1": "歷史背景——別人也做過,不是你的主證。",
  "S2": "他也曾卡住——是故事,不是反證。",
  "F1": "待驗預測：船若等速前行，桅頂落球應落回桅腳附近；第二章尚未取得船上紀錄。",
  "F2": "同一裝置下，射程隨下落高度的開方增長；換同徑木球仍保持。",
  "F3": "一顆水平拋出、一顆原地放下；兩顆近乎同時落地，向前運動沒有讓下墜延後。",
  "F4": "沾墨軌跡從離手第一寸就開始彎，找不到真正的直飛段。",
  "F5": "桌上規律只適用於低速、短程，而且空氣阻力還不明顯的情況。",
  "S3": "砲手的三段圖是真實問題來源，不是證明三段論正確的主證。",
  "S4": "前人的實驗筆記提供線索，但主張仍須由你自己的裝置與數據成立。",
  "S5": "書中提出船直線穩速、無額外推石頭時的待驗預測；它不是實驗結果。",
  "G1": "岸紙確認走穩的三次落石：石頭相對船集中在桅腳附近。",
  "G2": "關閉艙窗後，停泊與走穩各做三回；水面都沒有固定偏向，小球也落在放手點正下方。岸紙另外確認哪三回在走穩。",
  "G3": "解纜起步時落點偏後，出港平駛時接近桅腳；一次後偏不能代表所有前進船況。",
  "G4": "同一事件的船上與岸上紙帶；先以同號鼓點對齊，再逐拍扣掉桅杆位置，這一趟的岸紙才能換成船紙。",
  "G5": "實驗排除『船若前進，落石必落後』的反對，但沒有直接量到地球在動。",
  "K1": "沒有向內偏折時月亮沿切線離開；每一拍向地心改向，才形成閉合軌道。",
  "K2": "月距與週期算出月球一秒正矢約 1.36 mm；與地表一秒約 4.9 m 相差約 3600 倍，旅人再把它接到月距約 60R。",
  "K3": "Mars 與 Jupiter 的週期都在觀測揭露前封存，舊預測即使改律也不會被刪除。",
  "K4": "反平方與簡單共轉渦旋都跑過 Moon、Planets、Comet；比較只涵蓋這兩個明列版本。",
  "K5": "證據鏈、來源署名與作用機制邊界同時通過校樣；可計算規則成立，機制仍未決。",
  "S6": "正統主張把碰撞前後帶方向的 mv 當作同一本帳；這是待檢驗的主張，不是本輪結果。",
  "S7": "黏土壓痕提供可量的深度尺度，但不替短少的可見運動說明完整去向。",
  "J1": "鋼頭、油灰頭各三筆：帶方向的 mv 在碰撞前後都閉合。",
  "J2": "同一批紀錄改算 mv²：鋼頭閉合，油灰碰撞後的可見運動出現短少。",
  "J3": "同一顆球用三種速度撞黏土：坑深與 v² 的變化吻合；短少的完整去向仍未對平。",
  "J4": "兩本帳記的是不同問題，各有用途；不能硬合成一本，也不能只留其中一本。",
  "S8": "冰融化時持續吸熱而溫度暫停；這張卡限制本章反例能說到哪裡，不是鑽炮的新結果。",
  "T1": "等重、同溫、等水量下，碎屑與實心薄片的回溫曲線近似重合。",
  "T2": "只轉或只壓都不持續升溫；接觸與相對運動同時存在時，紙帶才持續上升。",
  "T3": "扣緊皮圈後曲線仍與開放進氣時近似重合；空氣必要來源版本撤回，舊封條保留。",
  "T4": "四份來源的原預測帶各自保留；長時段曲線後逐張判讀，終點位置與封條狀態以本局卷宗為準。",
  "T5": "共同頁分開操作、讀數與兩種解讀，保留範圍未決與兌換率未量得；四方各簽自己負責的欄。",
  "GRID_BASELINE": "配置：外部已知刺激；不使用金屬接點。 觀測：本次蛙腿製備收縮。 邊界：只確認製備仍會反應。",
  "GRID_BIMETAL": "配置：黃銅鉤接觸鐵片，形成雙金屬閉合接法。 觀測：蛙腿收縮。",
  "GRID_SAME_METAL": "配置：同材質金屬弧接觸神經與肌肉。 觀測：本次蛙腿製備收縮。 邊界：只記本次接點與組織狀態。",
  "GRID_NO_METAL": "配置：不使用金屬，讓神經與肌肉直接接觸。 觀測：沒有金屬在場仍然收縮。",
  "GRID_ELECTROMETER": "配置：無蛙；銅與鋅相觸後，把接觸效應餵給薄盤。 觀測：提盤時細針偏轉。 邊界：這一格量電效應，不量肌肉收縮。",
  "GRID_PILE": "配置：無動物組織；銅、鋅與浸鹽水布重複疊層。 觀測：兩端同觸時，反應持續存在，不只一下。",
  "GRID_STATE": "合帳範圍：基準、雙金屬、同材質、無金屬、電量器、堆。 M 與 A 兩個全稱都失敗。 不同配置必須分開記；目前不能指定統一的來源角色。"
 },
 "evidenceVisual": {
  "E1": {
   "items": [
    {
     "asset": "card_E1",
     "alt": "高塔落球紀錄"
    }
   ],
   "caption": "取得證據：高塔落球紀錄。"
  },
  "E2": {
   "items": [
    {
     "asset": "card_E2",
     "alt": "綁縛悖論示意圖"
    }
   ],
   "caption": "取得證據：綁縛悖論。精確關係由程式圖層呈現。",
   "readerTitle": "兩顆綁在一起會更快，還是更慢？",
   "accessibleText": [
    "若小石拖慢大石，綁起來應比大石慢。",
    "若重量越大越快，綁起來又應比大石快。",
    "同一前提推出互相衝突的結果。"
   ]
  },
  "E3": {
   "items": [
    {
     "asset": "card_E3",
     "alt": "斜面奇數律紀錄"
    }
   ],
   "caption": "取得證據：斜面奇數律。"
  },
  "E4": {
   "items": [
    {
     "asset": "card_E4",
     "alt": "介質與形狀對照實驗"
    }
   ],
   "caption": "取得證據：介質阻力辨析。"
  },
  "E5": {
   "items": [
    {
     "asset": "card_E5",
     "alt": "外推論證鏈"
    }
   ],
   "caption": "取得證據：外推論證鏈。"
  },
  "S1": {
   "items": [
    {
     "asset": "card_S1",
     "alt": "依劇情線索製作的德爾夫特來信教學重建，不是史料掃描"
    }
   ],
   "caption": "取得歷史線索：德爾夫特來信（教學重建，非史料掃描）。",
   "readerTitle": "德爾夫特來信｜教學重建，非史料掃描",
   "neutralBase": true,
   "identity": {
    "kind": "reconstruction",
    "label": "教學重建 · 非史料掃描"
   }
  },
  "S2": {
   "items": [
    {
     "asset": "card_S2",
     "alt": "依劇情線索製作的《論運動》手稿教學重建，不是原稿掃描"
    }
   ],
   "caption": "取得歷史線索：《論運動》手稿（教學重建，非原稿掃描）。",
   "readerTitle": "《論運動》手稿｜教學重建，非原稿掃描",
   "neutralBase": true,
   "identity": {
    "kind": "reconstruction",
    "label": "教學重建 · 非原稿掃描"
   }
  },
  "F1": {
   "items": [
    {
     "asset": "card_F1_neutral_v02",
     "alt": "1608 年雨夜書桌上的封存預測紙、船桅模型與石球；紙面沒有預先畫出落點"
    }
   ],
   "caption": "記下預測：船桅落球。",
   "projectionOnly": true,
   "neutralBase": true
  },
  "F2": {
   "items": [
    {
     "asset": "workshop2_projectile_apparatus_master",
     "alt": "桌緣彈射裝置與量測沙盤"
    }
   ],
   "caption": "取得證據：桌緣彈射的平方根關係。",
   "projectionOnly": true
  },
  "F3": {
   "items": [
    {
     "asset": "card_F3",
     "alt": "一拋一放的等時位置紀錄"
    }
   ],
   "caption": "取得證據：一拋一放近乎同時落地。"
  },
  "F4": {
   "items": [
    {
     "asset": "prop_inked_incline_board",
     "alt": "從起點就開始彎曲的墨跡軌跡"
    }
   ],
   "caption": "取得證據：墨跡曲線。",
   "projectionOnly": true
  },
  "F5": {
   "items": [
    {
     "asset": "workshop2_projectile_apparatus_master",
     "alt": "桌緣彈射裝置",
     "neutralBase": true
    },
    {
     "asset": "card_F3",
     "alt": "一拋一放紀錄"
    },
    {
     "asset": "prop_inked_incline_board",
     "alt": "墨跡曲線"
    }
   ],
   "caption": "取得證據：三組結果能說到哪裡，也不能說到哪裡。",
   "projectionOnly": true
  },
  "S3": {
   "items": [
    {
     "asset": "card_S3",
     "alt": "依塔爾塔利亞砲術問題製作的教學重建，不是原書插圖掃描"
    }
   ],
   "caption": "取得歷史線索：塔爾塔利亞砲術圖（依問題重建，非原書掃描）。",
   "readerTitle": "塔爾塔利亞砲術圖｜依問題重建，非原書掃描",
   "neutralBase": true,
   "identity": {
    "kind": "reconstruction",
    "label": "依問題重建 · 非原書掃描"
   }
  },
  "S4": {
   "items": [
    {
     "asset": "card_S4",
     "alt": "依 Guidobaldo 實驗線索製作的教學重建，不是筆記原頁掃描"
    }
   ],
   "caption": "取得歷史線索：Guidobaldo 實驗筆記（教學重建，非原頁掃描）。",
   "readerTitle": "Guidobaldo 實驗筆記｜教學重建，非原頁掃描",
   "neutralBase": true,
   "identity": {
    "kind": "reconstruction",
    "label": "教學重建 · 非原頁掃描"
   }
  },
  "S5": {
   "items": [
    {
     "asset": "card_S5",
     "alt": "打開的十七世紀書頁，右頁以史料意象呈現船艙滴水、拋接、魚缸、飛蟲與桅頂落石"
    }
   ],
   "caption": "取得待驗線索：《對話》的船艙論證（史料意象圖，非原書插圖）。"
  },
  "G1": {
   "items": [
    {
     "asset": "ship3_g1_mast_steady",
     "alt": "岸紙確認走穩的三次桅頂落石"
    }
   ],
   "caption": "取得證據：岸紙確認走穩的三回，落點集中在桅腳附近。",
   "projectionOnly": true
  },
  "G2": {
   "items": [
    {
     "asset": "ship3_g2_cabin",
     "alt": "關閉艙窗後，停泊與走穩時的水面和垂直落球對照"
    }
   ],
   "caption": "取得證據：關閉艙窗後，停泊與走穩各做三回；水面都沒有固定偏向，小球也落在放手點正下方。",
   "projectionOnly": true
  },
  "G3": {
   "items": [
    {
     "asset": "ship3_g3_accelerating",
     "alt": "解纜起步時的甲板情境底圖；實際落點由本局資料另行呈現",
     "neutralBase": true
    },
    {
     "asset": "ship3_g1_mast_steady",
     "alt": "出港平駛時的甲板情境底圖；實際落點由本局資料另行呈現",
     "neutralBase": true
    }
   ],
   "caption": "取得證據：解纜起步時偏後，出港平駛時接近桅腳；一次後偏不能代表所有前進船況。",
   "projectionOnly": true
  },
  "G4": {
   "items": [
    {
     "asset": "ship3_g4_reference_tapes",
     "alt": "船上與岸上的雙參考物紙帶"
    }
   ],
   "caption": "取得證據：先以同號鼓點對齊，再逐拍扣掉桅杆位置；這一趟的岸紙可以換成船紙。",
   "projectionOnly": true
  },
  "G5": {
   "items": [
    {
     "asset": "ship3_g5_public_boundary",
     "alt": "碼頭公開演示與證據邊界"
    }
   ],
   "caption": "取得證據：反對失效，不等於所有主張都已得證。",
   "projectionOnly": true
  },
  "K1": {
   "items": [
    {
     "asset": "card_K1",
     "alt": "1679 年冬季書桌上的四張空白推演紙、舊參考紙、木球與鬆弛細繩；軌跡與結果由本局資料另行疊上"
    }
   ],
   "caption": "取得證據：沒有偏折就沿切線離開；持續向內改向才形成軌道。",
   "readerTitle": "一直改向的路",
   "accessibleText": [
    "保留原來的前進，每一拍又朝當下地球偏一點。",
    "偏多少，必須與原來的速度相配。"
   ],
   "projectionOnly": true,
   "neutralBase": true
  },
  "K2": {
   "items": [
    {
     "asset": "ch04_focus_shared_moon_calculation_v01",
     "alt": "月光與燭光交會的書桌上，牛頓與旅人各自完成一張幾何紙，中央短尺連起兩張獨立算紙；圖面沒有可讀公式或答案"
    }
   ],
   "caption": "取得證據：地表一秒與月球一秒已放上同一把尺；旅人接出約 60 與約 3600，牛頓另紙重算。"
  },
  "K3": {
   "items": [
    {
     "asset": "card_K3",
     "alt": "先封存 Mars 與 Jupiter 週期預測再揭露觀測的時間線"
    }
   ],
   "caption": "取得證據：兩個週期都在看見答案前留下預測。",
   "projectionOnly": true
  },
  "K4": {
   "items": [
    {
     "asset": "card_K4",
     "alt": "反平方與簡單共轉渦旋跨 Moon、Planets、Comet 的六格比較矩陣"
    }
   ],
   "caption": "取得證據：同一批天空下的雙模型比較。",
   "readerTitle": "一條規則穿過三種天空",
   "fallbackNotice": "此存檔的借條狀態無法安全還原。",
   "accessibleText": [
    "反平方 Moon：對得上；殘差 0.36%。",
    "反平方 Planets：對得上；兩筆較大殘差 0.32%。",
    "反平方 Comet：方向對得上；此列只判方向，不出百分比。",
    "簡單渦旋 Moon：只有說法；沒有交出可核對數字。",
    "簡單渦旋 Planets：對不上；推得 6.4 年，實測 11.86 年——差 45.8%。",
    "簡單渦旋 Comet：方向相反；與固定流向衝突。"
   ],
   "variants": {
    "no_loans": {
     "items": [
      {
       "asset": "card_K4_no_loans_raster_v03",
       "alt": "模型比較對帳桌：反平方三格對得上；簡單渦旋一格只有說法、兩格對不上，行星與彗星都未加借條"
      }
     ],
     "caption": "模型比較已封存：行星與彗星都未加借條。",
     "accessibleText": [
      "封存的借條狀態：行星未加借條；彗星未加借條。",
      "三份資料、兩套固定規矩：拉力帳三格都對得上；漩渦帳一格只有說法，另外兩格對不上。這只比較同一規則跨資料的表現，不等於已說明拉力如何穿過空間。"
     ]
    },
    "planets_loan": {
     "items": [
      {
       "asset": "card_K4_planets_loan_raster_v03",
       "alt": "模型比較對帳桌：行星渦旋格貼有木星分層流速借條，彗星格未加借條且保留失配"
      }
     ],
     "caption": "模型比較已封存：行星加了借條；彗星未加借條。",
     "accessibleText": [
      "封存的借條狀態：行星借條——木星那一層另設流速；彗星未加借條，失配保留。",
      "拉力帳三格都對得上。漩渦帳的行星格改了流速表才貼合，借條仍在；彗星格對不上。這只比較同一規則跨資料的表現，不等於已說明拉力如何穿過空間。"
     ]
    },
    "comet_loan": {
     "items": [
      {
       "asset": "card_K4_comet_loan_raster_v03",
       "alt": "模型比較對帳桌：彗星渦旋格貼有未量過的穿流借條，行星格未加借條且保留失配"
      }
     ],
     "caption": "模型比較已封存：行星未加借條；彗星加了借條。",
     "accessibleText": [
      "封存的借條狀態：行星未加借條，失配保留；彗星借條——彗星可以穿過流（未量過）。",
      "拉力帳三格都對得上。漩渦帳的彗星格靠未量過的穿流假設才講得通；行星格對不上。這只比較同一規則跨資料的表現，不等於已說明拉力如何穿過空間。"
     ]
    },
    "both_loans": {
     "items": [
      {
       "asset": "card_K4_both_loans_raster_v04",
       "alt": "模型比較對帳桌：行星渦旋格與彗星渦旋格各貼一張借條，兩筆逐案新增的代價都保留在帳上"
      }
     ],
     "caption": "模型比較已封存：行星與彗星都加了借條。",
     "accessibleText": [
      "封存的借條狀態：行星借條——木星那一層另設流速；彗星借條——彗星可以穿過流（未量過）。",
      "拉力帳三格都對得上。漩渦帳原先兩格失配；每次改成講得通，逐案新增的代價都留在借條上。這只比較同一規則跨資料的表現，不等於已說明拉力如何穿過空間。"
     ]
    }
   }
  },
  "K5": {
   "items": [
    {
     "asset": "card_K5",
     "alt": "證據鏈、四條信用線與引力機制留白的完整校樣"
    }
   ],
   "caption": "取得證據：證明、署名與未決機制都停在各自邊界。"
  },
  "S6": {
   "items": [
    {
     "asset": "card_S6",
     "alt": "十八世紀碰撞論著的史料意象圖，書頁畫出碰撞前後的方向箭頭"
    }
   ],
   "caption": "取得史料：《運動之量》正統文獻（史料意象圖，非原書頁掃描）。"
  },
  "S7": {
   "items": [
    {
     "asset": "card_S7",
     "alt": "十八世紀黏土壓痕報告的史料意象圖，黏土上有三種深度的圓形壓痕"
    }
   ],
   "caption": "取得史料：'s Gravesande 黏土報告（史料意象圖，非原報告掃描）。"
  },
  "J1": {
   "items": [
    {
     "asset": "card_J1",
     "alt": "同一批鋼球與油灰碰撞用方向箭頭整理成動量帳；數值帳格留白，由工作台紀錄給出"
    }
   ],
   "caption": "取得證據：帶方向的動量帳在兩種碰撞都閉合。"
  },
  "J2": {
   "items": [
    {
     "asset": "card_J2",
     "alt": "同一批碰撞改列活力帳；數值帳格留白，油灰列另留一格尚未對平的去向"
    }
   ],
   "caption": "取得證據：活力帳在鋼頭閉合，在油灰碰撞留下可見運動的短少。"
  },
  "J3": {
   "items": [
    {
     "asset": "card_J3",
     "alt": "同一顆球從三種高度落入黏土，留下由淺至深的三個壓痕"
    }
   ],
   "caption": "取得證據：黏土坑深隨速度平方的尺度變化。"
  },
  "J4": {
   "items": [
    {
     "asset": "card_J4",
     "alt": "方向碰撞帳與黏土深度帳並排而不合併；帳格留白，數值由工作台紀錄給出，中間保留尚未填寫的空白收據"
    }
   ],
   "caption": "取得證據：兩本帳各答一種問題，短少的完整去向仍留白。"
  },
  "S8": {
   "items": [
    {
     "asset": "card_S8",
     "alt": "冰融化時持續吸熱但溫度暫停的未決現象卡"
    }
   ],
   "caption": "取得現象簿：潛熱等未查現象仍保留，不能由鑽炮反例一併抹去。",
   "projectionOnly": true
  },
  "T1": {
   "items": [
    {
     "asset": "card_T1",
     "alt": "等重同溫的金屬碎屑與實心薄片回溫曲線近似重合"
    }
   ],
   "caption": "取得證據：碎屑與薄片放上同一把熱尺，碎屑來源版本失去熱容量退路。",
   "projectionOnly": true
  },
  "T2": {
   "items": [
    {
     "asset": "card_T2",
     "alt": "只轉、只壓、接觸並轉動三條條件紙帶的比較"
    }
   ],
   "caption": "取得證據：持續升溫跟著接觸與相對運動同時出現。",
   "projectionOnly": true
  },
  "T3": {
   "items": [
    {
     "asset": "card_T3",
     "alt": "開放進氣與皮圈密合兩組升溫曲線近似重合"
    }
   ],
   "caption": "取得證據：關住外界空氣後升溫沒有按封存預測變慢。",
   "projectionOnly": true
  },
  "T4": {
   "items": [
    {
     "asset": "card_T4",
     "alt": "碎屑、炮身、空氣與水四份卷袋並列，原預測帶保留；右側長時段升溫線，終點位置與封條狀態需展開本局卷宗查看"
    }
   ],
   "caption": "取得證據：四份來源已逐張判讀；各自的原預測帶、終點位置與封條狀態仍可追查。",
   "projectionOnly": true
  },
  "T5": {
   "items": [
    {
     "asset": "card_T5",
     "alt": "共同驗證頁分四欄署名，並保留範圍未決與兌換率未量得"
    }
   ],
   "caption": "取得證據：一頁四種署名、兩筆未決；旅人只在最後交棒一次簽名。",
   "projectionOnly": true
  },
  "GRID_BASELINE": {
   "items": [
    {
     "asset": "card_GRID_BASELINE",
     "alt": "亞麻布標本袋接受外部已知刺激後，兩條位移指示線偏離；本次製備仍會反應"
    }
   ],
   "caption": "取得證據：外部已知刺激能使本次製備收縮；這格只保證證人醒著，不回答來源。",
   "readerTitle": "證人醒著的基準紙",
   "projectionOnly": true,
   "accessibleText": [
    "配置：外部已知刺激；不使用金屬接點。",
    "觀測：本次蛙腿製備收縮。",
    "邊界：只確認製備仍會反應。"
   ]
  },
  "GRID_BIMETAL": {
   "items": [
    {
     "asset": "card_GRID_BIMETAL",
     "alt": "黃銅與鐵兩種不同金屬閉合接觸，覆布標本的位移指示線改變"
    }
   ],
   "caption": "取得證據：黃銅與鐵形成閉合接法時，蛙腿收縮。",
   "readerTitle": "雙金屬閉合的觀測紙",
   "projectionOnly": true,
   "accessibleText": [
    "配置：黃銅鉤接觸鐵片，形成雙金屬閉合接法。",
    "觀測：蛙腿收縮。"
   ]
  },
  "GRID_SAME_METAL": {
   "items": [
    {
     "asset": "card_GRID_SAME_METAL",
     "alt": "兩端使用同材質黃銅接點，覆布標本的位移指示線仍顯示收縮"
    }
   ],
   "caption": "取得證據：同材質接法完成時，本次蛙腿製備仍收縮。",
   "readerTitle": "同材質接法的觀測紙",
   "projectionOnly": true,
   "accessibleText": [
    "配置：同材質金屬弧接觸神經與肌肉。",
    "觀測：本次蛙腿製備收縮。",
    "邊界：只記本次接點與組織狀態。"
   ]
  },
  "GRID_NO_METAL": {
   "items": [
    {
     "asset": "card_GRID_NO_METAL",
     "alt": "桌上沒有金屬接點，玻璃棒與直接組織接觸後，位移指示線仍顯示收縮"
    }
   ],
   "caption": "取得證據：沒有金屬在場，神經與肌肉直接接觸時仍然收縮。",
   "readerTitle": "無金屬仍收縮的觀測紙",
   "projectionOnly": true,
   "accessibleText": [
    "配置：不使用金屬，讓神經與肌肉直接接觸。",
    "觀測：沒有金屬在場仍然收縮。"
   ]
  },
  "GRID_ELECTROMETER": {
   "items": [
    {
     "asset": "card_GRID_ELECTROMETER",
     "alt": "沒有生物組織的桌上，黃銅與鋅接觸後把效應餵給薄盤，提盤時細針偏轉"
    }
   ],
   "caption": "取得證據：桌上沒有生命組織；金屬接觸累積到薄盤後，細針偏轉。",
   "readerTitle": "沒有生命組織的針格",
   "projectionOnly": true,
   "accessibleText": [
    "配置：無蛙；銅與鋅相觸後，把接觸效應餵給薄盤。",
    "觀測：提盤時細針偏轉。",
    "邊界：這一格量電效應，不量肌肉收縮。"
   ]
  },
  "GRID_PILE": {
   "items": [
    {
     "asset": "card_GRID_PILE",
     "alt": "銅片、鋅片與浸鹽水布交替疊成直立堆，雙手同觸兩端"
    }
   ],
   "caption": "取得證據：沒有動物組織；銅、鋅與浸鹽水布依序疊層後，兩端反應持續存在。",
   "readerTitle": "持續電效應的堆格",
   "projectionOnly": true,
   "accessibleText": [
    "配置：無動物組織；銅、鋅與浸鹽水布重複疊層。",
    "觀測：兩端同觸時，反應持續存在，不只一下。"
   ]
  },
  "GRID_STATE": {
   "items": [
    {
     "asset": "card_GRID_STATE",
     "alt": "六張原紙同頁排列，基準、三種蛙腿接法、細針與堆各自保留，兩道過寬主張線被限縮"
    }
   ],
   "caption": "取得證據：六張原紙已同頁合帳；每一格的配置、觀測與原主張仍可追查。",
   "readerTitle": "六格合帳頁",
   "projectionOnly": true,
   "accessibleText": [
    "合帳範圍：基準、雙金屬、同材質、無金屬、電量器、堆。",
    "M 與 A 兩個全稱都失敗。",
    "不同配置必須分開記；目前不能指定統一的來源角色。"
   ]
  }
 },
 "historicalReference": {
  "ch4": [
   {
    "id": "H4_ROPE_BALL",
    "name": "繩球演示",
    "unlockText": "取得參考卡「繩球演示」",
    "identity": "教學重建 · 非牛頓原物",
    "items": [
     {
      "asset": "ch04_prop_rope_ball_setup_v01",
      "alt": "教學重建的木球與細繩演示裝置，不是牛頓原物或史料掃描",
      "caption": "繩球演示裝置的教學重建，非牛頓原物或史料掃描"
     }
    ],
    "caption": "歷史參考：繩球演示（教學重建，非牛頓原物或史料掃描）。它只借幾何說明持續轉彎，不替引力機制授證。",
    "readerTitle": "繩球演示｜教學重建，非牛頓原物",
    "accessibleText": [
     "身分：教學重建，不是牛頓原物或史料掃描。",
     "用途：只幫忙理解持續轉彎需要持續改變運動。",
     "邊界：不能單獨證明月亮的引力機制。"
    ]
   },
   {
    "id": "H4_MOUNTAIN_CANNON",
    "name": "山頂大砲",
    "unlockText": "山頂大砲圖卡已放到桌邊",
    "identity": "依 1728 年刊本原典圖重建 · 非牛頓手稿",
    "items": [
     {
      "asset": "ch04_focus_newton_cannonball_reconstruction_v01",
      "alt": "依牛頓 1728 年刊本原典圖製作的遊戲重建，不是牛頓親筆手稿或原典掃描",
      "caption": "依 1728 年《A Treatise of the System of the World》刊本圖重建，非牛頓親筆手稿或原典掃描"
     }
    ],
    "caption": "歷史參考：牛頓山頂大砲（依 1728 年刊本原典圖重建；非牛頓親筆手稿、非原典掃描）。",
    "readerTitle": "牛頓山頂大砲｜依 1728 年刊本重建，非牛頓手稿",
    "accessibleText": [
     "身分：依 1728 年刊本圖重建，不是牛頓親筆手稿。",
     "圖意：不同初速會落地、繞行或進入更外側路徑。",
     "來源：A Treatise of the System of the World，1728 年刊本。"
    ]
   }
  ]
 },
 "collision5Visual": {
  "momentum": "ch05_lab_collision_rig",
  "vis-viva": "ch05_lab_collision_rig",
  "followup": "ch05_focus_unequal_putty_question",
  "clay": "ch05_lab_clay_depth_rig",
  "complete": "ch05_lab_clay_depth_rig"
 },
 "heat6Visual": {
  "heat-source-ledger": "ch06_lab_source_ledger",
  "chip-capacity-bench": "ch06_lab_chip_capacity",
  "friction-condition-bench": "ch06_lab_friction_conditions",
  "dry-strip-bench": "ch06_lab_paper_strip",
  "airtight-bench": "ch06_lab_airtight_piston",
  "water-box-bench": "ch06_lab_water_box_setup",
  "finite-source-prediction-bands": "ch06_lab_source_ledger",
  "continuous-run-bench": "ch06_lab_water_box_setup",
  "source-prediction-verdict": "ch06_lab_water_box_boiling",
  "model-audit-board": "ch06_focus_model_audit",
  "joint-verification-page": "ch06_focus_joint_page"
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
  "ch03": "chapter_thumbnail_ch03",
  "ch04": "chapter_thumbnail_ch04",
  "ch05": "chapter_thumbnail_ch05",
  "ch06": "chapter_thumbnail_ch06",
  "ch07": "chapter_thumbnail_ch07"
 }
};
 if (typeof module === "object" && module.exports) { module.exports = data; }
 else { root.GB = root.GB || {}; root.GB.DATA = root.GB.DATA || {}; root.GB.DATA.assets = data; }
})(typeof self !== "undefined" ? self : this);
