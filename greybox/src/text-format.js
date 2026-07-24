/* src/text-format.js — 玩家介面的文字邊界。
   只處理呈現文字，不改劇本、存檔與科學資料；數字比例 1:3:5:7、內部 ID、De Motu 等保持原樣。 */
(function (root) {
  "use strict";
  var CJK = "\\u3400-\\u9fff\\uf900-\\ufaff";
  var CJK_OR_PUNCT = CJK + "\\u3000-\\u303f";
  var PAIR = { ",": "，", ":": "：", ";": "；", "?": "？", "!": "！" };

  function normalizeZhPunctuation(value) {
    if (value === null || value === undefined) return value;
    var text = String(value);

    /* 括號裡含中文才換全形；(De Motu)、技術式與檔名不受影響。 */
    text = text.replace(new RegExp("\\((?=[^()\\n]*[" + CJK + "])([^()\\n]*)\\)", "g"), "（$1）");
    text = text.replace(new RegExp("([" + CJK_OR_PUNCT + "])([,:;])", "g"), function (_, left, mark) {
      return left + PAIR[mark];
    });
    text = text.replace(new RegExp("([,:;])([" + CJK + "])", "g"), function (_, mark, right) {
      return PAIR[mark] + right;
    });
    text = text.replace(new RegExp("([" + CJK_OR_PUNCT + "])([!?])", "g"), function (_, left, mark) {
      return left + PAIR[mark];
    });
    text = text.replace(new RegExp("([!?])([" + CJK + "])", "g"), function (_, mark, right) {
      return PAIR[mark] + right;
    });
    return text;
  }

  /* 玩家介面統一使用中文人名；內部 speaker／狀態鍵仍保留英文，避免破壞肖像、存檔與判定。 */
  function playerText(value) {
    if (value === null || value === undefined) return value;
    var text = normalizeZhPunctuation(value);
    [
      [/\bIsaac Newton\b/g, "艾薩克・牛頓"],
      [/\bEdmond Halley\b/g, "愛德蒙・哈雷"],
      [/\bRobert Hooke\b/g, "羅伯特・虎克"],
      [/\bJohn Flamsteed\b/g, "約翰・佛蘭斯蒂德"],
      [/\bNewton\b/g, "牛頓"],
      [/\bHalley\b/g, "哈雷"],
      [/\bHooke\b/g, "虎克"],
      [/\bFlamsteed\b/g, "佛蘭斯蒂德"]
    ].forEach(function (entry) { text = text.replace(entry[0], entry[1]); });
    return text;
  }

  /* 場景 title 是作者工具與玩家介面共用的資料欄位；公開顯示時移除製作流程標籤。
     場景 id、存檔游標與原始 title 一律不改，舊進度仍可讀。 */
  function playerSceneTitle(value) {
    if (value === null || value === undefined || value === "") return "故事進行中";
    return normalizeZhPunctuation(value)
      .replace(/^死路\s*[A-ZＡ-Ｚ]\s*[：:]\s*/, "")
      .replace(/^修復\s*[：:]\s*/, "");
  }

  function normalizeTextNodes(rootNode) {
    if (!rootNode) return;
    function walk(node) {
      var child = node.firstChild;
      while (child) {
        var next = child.nextSibling;
        if (child.nodeType === 3) {
          var tag = child.parentNode && child.parentNode.nodeName;
          if (tag !== "SCRIPT" && tag !== "STYLE" && tag !== "TEXTAREA" && tag !== "CODE" && tag !== "PRE")
            child.nodeValue = normalizeZhPunctuation(child.nodeValue);
        } else if (child.nodeType === 1) {
          ["title", "aria-label", "placeholder"].forEach(function (name) {
            if (child.hasAttribute(name)) child.setAttribute(name, normalizeZhPunctuation(child.getAttribute(name)));
          });
          walk(child);
        }
        child = next;
      }
    }
    walk(rootNode);
  }

  var api = {
    normalizeZhPunctuation: normalizeZhPunctuation,
    playerText: playerText,
    playerSceneTitle: playerSceneTitle,
    normalizeTextNodes: normalizeTextNodes
  };
  if (typeof module === "object" && module.exports) module.exports = api;
  else {
    root.GB = root.GB || {};
    root.GB.TextFormat = api;
  }
})(typeof self !== "undefined" ? self : this);
