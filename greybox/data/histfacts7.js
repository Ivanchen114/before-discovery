/* data/histfacts7.js — 第七章史實頁執行載體（file:// 相容）。規範鏡像:histfacts7.json。
   ⚠ 本檔為生成物；請改 histfacts7.json 後執行 node tools/build-ch7-data.mjs。 */
(function (root) {
 "use strict";
 var data = {
 "title": "史實與重建｜Galvani、Volta 與兩種電的爭論",
 "rows": [
  {
   "label": "史實主線",
   "item": "1791 年的蛙腿實驗與動物電解讀",
   "note": "Galvani 以黃銅鉤與鐵欄杆上的蛙腿收縮作為重要觀察，並在 1791 年出版研究；他把神經與肌肉視為證詞的一部分，而不是單純的被動儀器。"
  },
  {
   "label": "史實反例",
   "item": "1794 年的單金屬與無金屬配置",
   "note": "Galvani 陣營記錄了不依賴雙金屬、甚至沒有金屬仍可收縮的配置。這足以反駁「收縮只能由金屬提供」，但不能單獨說明所有電效應的來源。"
  },
  {
   "label": "量測橋梁",
   "item": "Volta 的接觸電量測",
   "note": "Volta 重做實驗後改變解釋，主張異種金屬接觸本身能產生可量的電效應；1796 年的凝電器與電量器讓這件事能在沒有蛙腿的桌上被看見。"
  },
  {
   "label": "1800 年公開",
   "item": "致 Joseph Banks 的信與伏打堆",
   "note": "Volta 於 1800 年 3 月 20 日致函皇家學會會長 Joseph Banks，信於 6 月 26 日宣讀。銅、鋅與浸鹽水材料的重複疊層，讓無動物組織的電效應能持續存在。"
  },
  {
   "label": "遊戲重建",
   "item": "六格矩陣與旅人的署名",
   "note": "遊戲中的自由接線矩陣、逐格原紙、旅人往返送信與在同一張紙上修正，是為玩家判讀與承擔後果設計的重建；史實中的爭論經過更多人物、出版物與反覆實驗。"
  },
  {
   "label": "證明邊界",
   "item": "兩個全稱都站不住，不等於已有單一答案",
   "note": "本章能排除「收縮只能由金屬提供」與「任何可持續電效應都必須有生命組織」；它不能憑這六格指定所有生物電與接觸電的統一來源角色。"
  }
 ],
 "labels": [
  "史實主線",
  "史實反例",
  "量測橋梁",
  "1800 年公開",
  "遊戲重建",
  "證明邊界"
 ]
};
 if (typeof module === "object" && module.exports) { module.exports = data; }
 else { root.GB = root.GB || {}; root.GB.DATA = root.GB.DATA || {}; root.GB.DATA.histfacts7 = data; }
})(typeof self !== "undefined" ? self : this);
