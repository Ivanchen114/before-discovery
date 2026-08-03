/* data/histfacts6.js — 第六章史實頁執行載體（file:// 相容）。規範鏡像:histfacts6.json。
   ⚠ 本檔為生成物；請改 histfacts6.json 後執行 node tools/build-ch6-data.mjs。 */
(function (root) {
 "use strict";
 var data = {
 "title": "史實與重建｜1798 年鑽炮生熱",
 "rows": [
  {
   "label": "史實主線",
   "item": "Rumford 的鑽炮觀察",
   "note": "1798 年的論文記述鈍鑽持續摩擦炮身並使周圍水升溫；本章以此作為可查的歷史核心。"
  },
  {
   "label": "史實脈絡",
   "item": "比熱與潛熱不是笑話",
   "note": "量熱、比熱與潛熱概念曾在熱質框架中成長；後來的理論仍沿用其中有效的測量工具。"
  },
  {
   "label": "現代教學重建",
   "item": "來源封條與共同驗證頁",
   "note": "封存預測、四方分欄署名、炮匠史坦格與院士凱斯勒是為玩家判讀與證據責任設計的教學重建。"
  },
  {
   "label": "禁止宣稱",
   "item": "這一章還不能說什麼",
   "note": "鑽炮實驗不能單獨證明熱就是運動，也沒有量出機械作用與熱的固定兌換率；定量問題留給後續年代。"
  }
 ],
 "labels": [
  "史實主線",
  "史實脈絡",
  "現代教學重建",
  "禁止宣稱"
 ]
};
 if (typeof module === "object" && module.exports) { module.exports = data; }
 else { root.GB = root.GB || {}; root.GB.DATA = root.GB.DATA || {}; root.GB.DATA.histfacts6 = data; }
})(typeof self !== "undefined" ? self : this);
