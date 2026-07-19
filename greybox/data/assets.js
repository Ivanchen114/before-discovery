/* data/assets.js — 執行載體(file:// 相容)。規範鏡像:assets.json(美術規格 §5.9;鏡像測試把關)
   資產槽位清單=第一章全需求;path=null → UI fallback(灰盒)。Sol 填 path 即上圖,程式零改動。 */
(function (root) {
  "use strict";
  var data = {
 "version": 1,
 "basePath": "../public/assets/",
 "note": "path=null 即該槽尚無 runtime 資產,UI 全面 fallback(灰盒不變)。Sol 只需:轉出 WebP 放入 public/assets/,把 path 填上;程式零改動。layers 欄位=ART-ADR-001 混合制(base+臉層,anchorX/anchorY/w 以母版座標記)。 sceneDialoguePortrait[場景][講者]→場景覆寫,speakerDialoguePortrait[講者]→對話預設,speakerPortrait[講者]→舊筆記頭像 fallback(遮罩呈現)。旅人一律不入對話肖像映射(壓暗對手呈現);dialogue_traveler_silhouette 僅供章末/筆記/A-B。 speakerSide[講者]→雙槽站位(依原圖朝向,永不鏡像);travelerSilhouette[side]→旅人剪影按側選圖(預設開啟,?travelerBust=0 撤回)。",
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
  "SC-R1": "bg_workshop_padua"
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
   "path": null,
   "firstScreen": false,
   "sourceMaster": "新繪或以 prop 特寫合成",
   "w": 800,
   "h": 500
  },
  {
   "id": "card_E2",
   "kind": "card",
   "label": "綁縛悖論(示意圖)",
   "path": null,
   "firstScreen": false,
   "sourceMaster": "",
   "w": 800,
   "h": 500
  },
  {
   "id": "card_E3",
   "kind": "card",
   "label": "斜面奇數律(數據紙)",
   "path": null,
   "firstScreen": false,
   "sourceMaster": "",
   "w": 800,
   "h": 500
  },
  {
   "id": "card_E4",
   "kind": "card",
   "label": "介質阻力辨析",
   "path": null,
   "firstScreen": false,
   "sourceMaster": "",
   "w": 800,
   "h": 500
  },
  {
   "id": "card_E5",
   "kind": "card",
   "label": "外推論證鏈",
   "path": null,
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
   "伽利略": "dialogue_galileo39_focused",
   "辛普里奧": "dialogue_simplicio72_formidable_calm"
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
  }
 },
 "speakerDialoguePortrait": {
  "助手": "dialogue_assistant_earnest",
  "主持": "dialogue_host_formal",
  "年輕人": "dialogue_galileo26_neutral"
 },
 "speakerSide": {
  "伽利略": "right",
  "年輕人": "right",
  "辛普里奧": "left",
  "助手": "left",
  "主持": "right"
 },
 "travelerSilhouette": {
  "left": "dialogue_traveler_silhouette",
  "right": "dialogue_traveler_silhouette_right"
 }
};
  if (typeof module === "object" && module.exports) { module.exports = data; }
  else { root.GB = root.GB || {}; root.GB.DATA = root.GB.DATA || {}; root.GB.DATA.assets = data; }
})(typeof self !== "undefined" ? self : this);
