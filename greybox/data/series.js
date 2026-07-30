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
   "question": "重物真的落得比較快嗎？",
   "intro": "伽利略在帕多瓦研究斜面與落體，逐步把「重物落得更快」變成可測量、可辯論的問題。"
  },
  {
   "id": "ch2",
   "route": "ch02",
   "number": "02",
   "label": "第二章",
   "title": "第一寸的弧線",
   "years": "1608–1632",
   "question": "拋出去之後，誰還在推它？",
   "intro": "伽利略與圭多巴爾多留下著墨球實驗的線索；循著手稿，重查拋體如何同時向前、向下。"
  },
  {
   "id": "ch3",
   "route": "ch03",
   "number": "03",
   "label": "第三章",
   "title": "船艙裡的靜止",
   "years": "1632–1642",
   "question": "船在前進，船艙裡為何看不出來？",
   "intro": "伽利略在 1632 年《對話》提出封閉船艙論證；伽桑狄後來又在馬賽安排航船落石實驗。"
  },
  {
   "id": "ch4",
   "route": "ch04",
   "number": "04",
   "label": "第四章",
   "title": "月亮的無盡墜落",
   "years": "1665–1687",
   "question": "月亮一直墜落，為何從不落地？",
   "intro": "從 1679 年胡克書信到 1684 年哈雷來訪，牛頓的月球問題逐步走向 1687 年《自然哲學的數學原理》。"
  },
  {
   "id": "ch5",
   "route": "ch05",
   "number": "05",
   "label": "第五章",
   "title": "兩本帳，哪一本是真的？",
   "years": "約 1740",
   "question": "兩本都算得對，爭論為何還不會停？",
   "intro": "約 1740 年，杜夏特萊介入牛頓與萊布尼茲的活力論爭，重新追問碰撞中究竟該記下什麼。"
  }
 ]
};
 if (typeof module === "object" && module.exports) { module.exports = data; }
 else { root.GB = root.GB || {}; root.GB.DATA = root.GB.DATA || {}; root.GB.DATA.series = data; }
})(typeof self !== "undefined" ? self : this);
