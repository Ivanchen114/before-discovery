/* data/debate.js — 執行載體(file:// 相容)。規範鏡像:debate.json(R-DATA-05 測試保證一致) */
(function (root) {
  "use strict";
  var data = {
  "pillar": "P3",
  "persuasion": 5,
  "statements": [
    {
      "id": "s1",
      "text": "【佔位】重物性喜就下,如遊子思歸——此其本性也。",
      "press": "【佔位】性也者,萬物受於天者也。石之就下,猶火之炎上,豈待外力?"
    },
    {
      "id": "s2",
      "text": "【佔位】渴望愈強者,行愈疾。十斤之鐵,思鄉之情十倍於一斤,故其墜十倍疾。",
      "press": "【佔位】汝且思之:秤上愈重者,歸心愈切。重量者,渴望之度量也。",
      "weakTo": {
        "evidence": "E3",
        "subitem": "b"
      },
      "insufficient": {
        "evidence": "E3",
        "subitem": "a",
        "reply": "【佔位】單一球重之規律,焉能證『與重量無關』?汝只量了一種渴望。"
      }
    },
    {
      "id": "s3",
      "text": "【佔位】此乃目的之因,天地之情——數字豈能言之?",
      "press": "【佔位】數者,匠人之具;情者,自然之理。以數言情,南轅北轍。"
    }
  ],
  "stubs": [
    "E1",
    "S1"
  ],
  "texts": {
    "absorb": "【佔位】(辛普里奧展扇)此物與吾言何干?諸位,質詢方已然失措。",
    "suspendHint": "【佔位】此支柱需要能將快慢與重量脫鉤的量化證據。",
    "victory": "【佔位】(長久的寂靜)……老夫執教三十年,今日第一次,在辯論裡輸給一組數字。",
    "stubE1": "高塔落球紀錄(存根):兩球幾乎同時落地——「幾乎」。",
    "stubS1": "德爾夫特來的信(存根):斯泰文四年前已做過雙球實驗。"
  }
};
  if (typeof module === "object" && module.exports) { module.exports = data; }
  else { root.GB = root.GB || {}; root.GB.DATA = root.GB.DATA || {}; root.GB.DATA.debate = data; }
})(typeof self !== "undefined" ? self : this);
