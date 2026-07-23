/* data/series.js — 系列章節目錄（file:// 相容）。規範鏡像:series.json。
   ⚠ 本檔為生成物；請改 series.json 後執行 node tools/build-series-data.mjs。 */
(function (root) {
 "use strict";
 var data = {
 "schemaVersion": 1,
 "chapters": [
  {
   "id": "ch1",
   "route": "ch01",
   "number": "01",
   "label": "第一章",
   "title": "重物的渴望",
   "years": "1590–1610",
   "question": "重物真的落得比較快嗎？"
  },
  {
   "id": "ch2",
   "route": "ch02",
   "number": "02",
   "label": "第二章",
   "title": "第一寸的弧線",
   "years": "1608–1632",
   "question": "拋出去之後，誰還在推它？"
  },
  {
   "id": "ch3",
   "route": "ch03",
   "number": "03",
   "label": "第三章",
   "title": "船艙裡的靜止",
   "years": "1632–1642",
   "question": "船在前進，船艙裡為何看不出來？"
  },
  {
   "id": "ch4",
   "route": "ch04",
   "number": "04",
   "label": "第四章",
   "title": "月亮的無盡墜落",
   "years": "1665–1687",
   "question": "月亮一直墜落，為何從不落地？"
  }
 ]
};
 if (typeof module === "object" && module.exports) { module.exports = data; }
 else { root.GB = root.GB || {}; root.GB.DATA = root.GB.DATA || {}; root.GB.DATA.series = data; }
})(typeof self !== "undefined" ? self : this);
