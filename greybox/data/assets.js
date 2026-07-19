/* data/assets.js — 執行載體(file:// 相容)。規範鏡像:assets.json(美術規格 §5.9;鏡像測試把關)
   資產槽位清單=第一章全需求;path=null → UI fallback(灰盒)。Sol 填 path 即上圖,程式零改動。 */
(function (root) {
  "use strict";
  var data = {
 "version": 1,
 "basePath": "../public/assets/",
 "note": "path=null 即該槽尚無 runtime 資產,UI 全面 fallback(灰盒不變)。Sol 只需:轉出 WebP 放入 public/assets/,把 path 填上;程式零改動。layers 欄位=ART-ADR-001 混合制(base+臉層,anchorX/anchorY/w 以母版座標記)。",
 "sceneBg": {
  "P0-1": "bg_pisa_arcade",
  "P0-2": "bg_study_pisa",
  "P0-3": "bg_study_pisa",
  "A1-1": "bg_study_pisa",
  "A1-2": "bg_study_pisa",
  "A1-3": "bg_city_wall",
  "A1-4": "bg_tower_top",
  "A1-5": "bg_university_corridor",
  "A1-6": "bg_riverside",
  "A1-7": "bg_study_pisa",
  "INT-1": "bg_workshop_padua",
  "A2-1": "bg_workshop_padua",
  "A2-2": "bg_workshop_padua",
  "A2-3": "bg_workshop_padua",
  "A2-4": "bg_workshop_padua",
  "A2-5": "bg_workshop_padua",
  "A3-1": "bg_lecture_hall",
  "A3-D": "bg_lecture_hall",
  "A3-F": "bg_workshop_padua",
  "A3-6": "bg_lecture_hall",
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
   "path": null,
   "firstScreen": true,
   "sourceMaster": "ch01_styleframe_pisa_arcade 可裁",
   "w": 1920,
   "h": 1080
  },
  {
   "id": "bg_study_pisa",
   "kind": "bg",
   "label": "比薩書房(夜/日兩態可後補)",
   "path": null,
   "firstScreen": false,
   "sourceMaster": "proof_sf01_study_night 可裁",
   "w": 1920,
   "h": 1080
  },
  {
   "id": "bg_city_wall",
   "kind": "bg",
   "label": "舊城牆(快試)",
   "path": null,
   "firstScreen": false,
   "sourceMaster": "P2 優先度,可暫用 bg_pisa_arcade",
   "w": 1920,
   "h": 1080
  },
  {
   "id": "bg_tower_top",
   "kind": "bg",
   "label": "鐘樓頂(黎明)",
   "path": null,
   "firstScreen": false,
   "sourceMaster": "新繪",
   "w": 1920,
   "h": 1080
  },
  {
   "id": "bg_university_corridor",
   "kind": "bg",
   "label": "大學迴廊(死路A)",
   "path": null,
   "firstScreen": false,
   "sourceMaster": "可與 bg_pisa_arcade 共用/變體",
   "w": 1920,
   "h": 1080
  },
  {
   "id": "bg_riverside",
   "kind": "bg",
   "label": "阿諾河邊(黃昏)",
   "path": null,
   "firstScreen": false,
   "sourceMaster": "新繪",
   "w": 1920,
   "h": 1080
  },
  {
   "id": "bg_workshop_padua",
   "kind": "bg",
   "label": "帕多瓦工作室",
   "path": null,
   "firstScreen": false,
   "sourceMaster": "ch01_bg_workshop_empty_v01 ✓ 已有母版",
   "w": 1920,
   "h": 1080
  },
  {
   "id": "bg_lecture_hall",
   "kind": "bg",
   "label": "大學講堂(1604)",
   "path": null,
   "firstScreen": false,
   "sourceMaster": "ch01_styleframe_debate_hall_v02 ✓ 已有母版",
   "w": 1920,
   "h": 1080
  },
  {
   "id": "bg_canal_dusk",
   "kind": "bg",
   "label": "帕多瓦運河(黃昏)",
   "path": null,
   "firstScreen": false,
   "sourceMaster": "新繪",
   "w": 1920,
   "h": 1080
  },
  {
   "id": "bg_moon",
   "kind": "bg",
   "label": "月球・亞平寧山麓",
   "path": null,
   "firstScreen": false,
   "sourceMaster": "新繪(單場景,小檔即可)",
   "w": 1920,
   "h": 1080
  },
  {
   "id": "portrait_galileo",
   "kind": "portrait",
   "label": "伽利略(26/39 歲共用母版,差分後補)",
   "path": null,
   "firstScreen": true,
   "sourceMaster": "ch01_char_galileo_master_v01 裁 bust",
   "w": 600,
   "h": 600
  },
  {
   "id": "portrait_simplicio",
   "kind": "portrait",
   "label": "辛普里奧(58/72 歲共用母版)",
   "path": null,
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
   "path": null,
   "firstScreen": false,
   "sourceMaster": "",
   "w": 800,
   "h": 500
  },
  {
   "id": "card_S2",
   "kind": "card",
   "label": "《論運動》手稿",
   "path": null,
   "firstScreen": false,
   "sourceMaster": "ch01_prop_manuscript_detail_v01 可用",
   "w": 800,
   "h": 500
  },
  {
   "id": "prop_ball_groove",
   "kind": "prop",
   "label": "銅球與木槽",
   "path": null,
   "firstScreen": false,
   "sourceMaster": "ch01_prop_ball_groove_detail_v01 ✓",
   "w": 800,
   "h": 500
  },
  {
   "id": "prop_water_clock",
   "kind": "prop",
   "label": "水鐘",
   "path": null,
   "firstScreen": false,
   "sourceMaster": "ch01_prop_water_clock_detail_v01 ✓(集水桶/秤比例 B 級修補後)",
   "w": 800,
   "h": 500
  },
  {
   "id": "prop_physics_tome",
   "kind": "prop",
   "label": "《物理學》評注本",
   "path": null,
   "firstScreen": false,
   "sourceMaster": "ch01_prop_physics_tome_detail_v01 ✓",
   "w": 800,
   "h": 500
  }
 ]
};
  if (typeof module === "object" && module.exports) { module.exports = data; }
  else { root.GB = root.GB || {}; root.GB.DATA = root.GB.DATA || {}; root.GB.DATA.assets = data; }
})(typeof self !== "undefined" ? self : this);
