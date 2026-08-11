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
   "intro": "伽利略在帕多瓦研究斜面與落體，逐步把「重物落得更快」變成可測量、可辯論的問題。",
   "endCard": {
    "nextLabel": "下一章",
    "nextTitle": "第一寸的弧線",
    "hook": "它往前，又往下——兩件事，同時發生。帕多瓦的運河邊，有人整晚睡不著。"
   },
   "runtime": {
    "scenesKey": "scenes1",
    "histfactsKey": "histfacts1",
    "debateKey": "debate1",
    "engineKey": "Engine1",
    "saveKey": "bd_ch1_save",
    "saveSchema": 3,
    "saveEncoding": "legacy-raw",
    "sanitizerKey": "sanitizeImport",
    "initialRep": 3,
    "repairScene": "SC-R1"
   }
  },
  {
   "id": "ch2",
   "route": "ch02",
   "number": "02",
   "label": "第二章",
   "title": "第一寸的弧線",
   "years": "1608–1632",
   "question": "拋出去之後，誰還在推它？",
   "intro": "伽利略與圭多巴爾多留下著墨球實驗的線索；循著手稿，重查拋體如何同時向前、向下。",
   "endCard": {
    "nextLabel": "下一章",
    "nextTitle": "船艙裡的靜止",
    "hook": "球桿早已離開，小白球仍向前。若整艘船也在前進，桅頂鬆手的石頭會落在哪裡？"
   },
   "runtime": {
    "scenesKey": "scenes2",
    "histfactsKey": "histfacts2",
    "debateKey": "debate2",
    "engineKey": "Engine2",
    "saveKey": "bd_ch2_save",
    "saveSchema": 1,
    "saveEncoding": "letter-envelope",
    "sanitizerKey": "sanitizeImport2",
    "initialRep": 3,
    "repairScene": "SC-R1"
   }
  },
  {
   "id": "ch3",
   "route": "ch03",
   "number": "03",
   "label": "第三章",
   "title": "船艙裡的靜止",
   "years": "1632–1642",
   "question": "船在前進，船艙裡為何看不出來？",
   "intro": "伽利略在 1632 年《對話》提出封閉船艙論證；伽桑狄後來又在馬賽安排航船落石實驗。",
   "endCard": {
    "nextLabel": "下一章",
    "nextTitle": "月亮的無盡墜落",
    "hook": "船上的石頭保留前行；如果月亮也在前行，究竟是什麼讓它不斷轉彎？"
   },
   "runtime": {
    "scenesKey": "scenes3",
    "histfactsKey": "histfacts3",
    "debateKey": null,
    "engineKey": "Engine3",
    "saveKey": "bd_ch3_save",
    "saveSchema": 1,
    "saveEncoding": "letter-envelope",
    "sanitizerKey": "sanitizeImport3",
    "initialRep": 3,
    "repairScene": "SC3-R1"
   }
  },
  {
   "id": "ch4",
   "route": "ch04",
   "number": "04",
   "label": "第四章",
   "title": "月亮的無盡墜落",
   "years": "1665–1687",
   "question": "月亮一直墜落，為何從不落地？",
   "intro": "從 1679 年胡克書信到 1684 年哈雷來訪，牛頓的月球問題逐步走向 1687 年《自然哲學的數學原理》。",
   "endCard": {
    "nextLabel": "下一個問題",
    "nextTitle": "碰撞之後，什麼應該守住？",
    "hook": "一本帳記方向與運動總量；另一本帳記能抬多高、壓多深。兩本帳都有人說是真的。"
   },
   "runtime": {
    "scenesKey": "scenes4",
    "histfactsKey": "histfacts4",
    "debateKey": null,
    "engineKey": "Engine4",
    "saveKey": "before-discovery:chapter4:v1",
    "saveSchema": 2,
    "saveEncoding": "letter-envelope",
    "sanitizerKey": "sanitizeImport4",
    "initialRep": 3,
    "repairScene": "SC4-R1"
   }
  },
  {
   "id": "ch5",
   "route": "ch05",
   "number": "05",
   "label": "第五章",
   "title": "兩本帳，哪一本是真的？",
   "years": "約 1740",
   "question": "兩本都算得對，爭論為何還不會停？",
   "intro": "約 1740 年，杜夏特萊介入牛頓與萊布尼茲的活力論爭，重新追問碰撞中究竟該記下什麼。",
   "endCard": {
    "nextLabel": "下一個問題",
    "nextTitle": "短少的那一截，去了哪裡？",
    "hook": "黏土留下了可量的痕跡；要把去向全帳對平，還得學會怎麼量熱。"
   },
   "runtime": {
    "scenesKey": "scenes5",
    "histfactsKey": "histfacts5",
    "debateKey": "debate5",
    "engineKey": "Engine5",
    "saveKey": "before-discovery:chapter5:v1",
    "saveSchema": 1,
    "saveEncoding": "letter-envelope",
    "sanitizerKey": "sanitizeImport5",
    "initialRep": 3,
    "repairScene": "SC5-R1"
   }
  },
  {
   "id": "ch6",
   "route": "ch06",
   "number": "06",
   "label": "第六章",
   "title": "熱從哪裡來？",
   "years": "1798",
   "question": "沒有火，為什麼能一直生熱？",
   "intro": "1798 年慕尼黑兵工廠，Rumford 的鑽炮觀察逼兩套熱模型先封存來源與可見後果，再由長時段原紙逐一追債。",
   "endCard": {
    "nextLabel": "下一個問題",
    "nextTitle": "一隻腿的證詞",
    "hook": "炮膛的火星退成雨聲。一隻不再活著的腿，卻替兩種電各留下一半證詞。"
   },
   "runtime": {
    "scenesKey": "scenes6",
    "histfactsKey": "histfacts6",
    "debateKey": null,
    "engineKey": "Engine6",
    "saveKey": "before-discovery:chapter6:v1",
    "saveSchema": 1,
    "saveEncoding": "letter-envelope",
    "sanitizerKey": "sanitizeImport6",
    "initialRep": 3,
    "repairScene": "SC6-R1"
   }
  },
  {
   "id": "ch7",
   "route": "ch07",
   "number": "07",
   "label": "第七章",
   "title": "一隻腿的證詞",
   "years": "1791–1800",
   "question": "那一踢的電，是青蛙自己的，還是我們帶來的？",
   "intro": "1791–1800 年，Galvani 與 Volta 用青蛙、金屬與紙上紀錄互相追問。兩邊的話，都還不敢說死。",
   "endCard": {
    "nextLabel": "旅程暫歇",
    "nextTitle": "返回旅程目錄",
    "hook": "穩定、不停的電已沿信紙傳開。下一個問題還沒有登錄；這一頁先留在筆記裡。"
   },
   "runtime": {
    "scenesKey": "scenes7",
    "histfactsKey": "histfacts7",
    "debateKey": null,
    "engineKey": "Engine7",
    "saveKey": "before-discovery:chapter7:v1",
    "saveSchema": 1,
    "saveEncoding": "letter-envelope",
    "sanitizerKey": "sanitizeImport7",
    "initialRep": 1,
    "repairScene": "SC7-R1"
   }
  }
 ]
};
 if (typeof module === "object" && module.exports) { module.exports = data; }
 else { root.GB = root.GB || {}; root.GB.DATA = root.GB.DATA || {}; root.GB.DATA.series = data; }
})(typeof self !== "undefined" ? self : this);
