/* data/scenes3.js — 第三章場景執行載體（file:// 相容）。規範鏡像:scenes3.json。
   ⚠ 本檔為生成物；請改 scenes3.json 後執行 node tools/build-ch3-data.mjs。 */
(function (root) {
 "use strict";
 var data = {
 "chapter": "ch3",
 "title": "船艙裡的靜止",
 "startScene": "C0-1",
 "evidenceNames": {
  "S5": "《對話》的船艙頁",
  "G1": "三回乾淨走穩紀錄",
  "G2": "封閉船艙盲測",
  "G3": "前進與變速的分類",
  "G4": "同一事件的兩張紙",
  "G5": "有限的公開結論"
 },
 "evidenceSummary": {
  "S5": "書中提出可受審的問題，尚不是這艘船的實驗證據。",
  "G1": "同石、同高、門閂放手，岸紙確認近似走穩的三回都落在桅腳附近。",
  "G2": "先封存船況，只憑艙內局部結果無法可靠分出停泊與近似走穩；拆封岸紙後才確認船況。",
  "G3": "今天正在變快的後偏與走穩的近中不同；舊紙缺船速，只能保留為未分類。",
  "G4": "同號鼓點先鎖定時刻，逐拍扣掉桅杆當拍位置後，岸上紙可換成船上紙。",
  "G5": "實驗排除「承載物前進，落石必定落後」這項反對，沒有直接量到地球運動。"
 },
 "publicDemo": {
  "purpose": "玩家可帶不完整卷宗上台；辯論指出缺口後返回實驗，已完成的資料、斷言與支柱全部保留。",
  "tokenRule": "不設木籌。承諾發生在實驗方案與斷言適用範圍；舊紙、錯紙與越界墨痕都不刪除。",
  "steps": [
   "共同前行：選材",
   "前進與變速：分類",
   "參考物：現場幾何"
  ]
 },
 "scenes": [
  {
   "id": "C0-1",
   "title": "馬賽港・頁面翻了三十來年",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "上一頁的問題還沒有人回答：沒有東西繼續推它，它為什麼還在走？",
     "next": "n1b"
    },
    {
     "id": "n1b",
     "type": "line",
     "speaker": "stage",
     "text": "紙頁又翻過三十年。1640 年秋，法國・馬賽。港口的風把一本攤開的書，一直翻回同一頁。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "頁面沒有讓我道別。他們老了三十來年。我沒有。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "（按住被風吹起的書頁，瞥見旅人筆記上畫的桅杆）你也停在這一頁？",
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "（看清書頁上的插圖）船。桅杆。有人在桅頂放手。",
     "next": "n5"
    },
    {
     "id": "n5",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "伽利略在 1632 年寫的，八年前的書。（闔起《對話》）他讓那艘船走得又直又穩，沒有浪，也沒有風。",
     "next": "n6"
    },
    {
     "id": "n6",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "（望向碼頭上真正的桅杆）所以我想借一艘真的。",
     "next": "s1"
    },
    {
     "id": "s1",
     "type": "system",
     "speaker": "system",
     "text": "取得《對話》的船艙頁。它提出可受審的問題，尚不是實驗證據。",
     "effects": [
      {
       "evidence": "S5"
      }
     ],
     "next": "g1"
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "C0-2"
    }
   ]
  },
  {
   "id": "C0-2",
   "title": "借船的人留在岸上",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "（等洛朗・維達爾在裝貨單上畫完一筆）維達爾船長，我想借你的船。從桅頂放一顆石頭。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "艦長",
     "text": "（沒抬頭）往我的甲板上扔石頭？先說你想查什麼。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "有人說：船只要在往前走，鬆手的石頭就一定落在後面。",
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "同一句話，也被拿來反對地球會動：地球若在轉，塔也跟著轉；石頭落下的那一會兒，塔往前走了，石頭就該落在塔後面。",
     "next": "n5"
    },
    {
     "id": "n5",
     "type": "line",
     "speaker": "艦長",
     "text": "（終於抬頭）可塔頂放下的石頭，一向落在塔腳。",
     "next": "n6"
    },
    {
     "id": "n6",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "正因為這樣。我想看同一句話搬到船上，還站不站得住。",
     "next": "n7"
    },
    {
     "id": "n7",
     "type": "line",
     "speaker": "艦長",
     "text": "（把裝貨單捲起，擋在踏板前）船可以借。做出什麼，就寫什麼。別拿我的名字替沒弄清楚的事撐場面。",
     "next": "n8"
    },
    {
     "id": "n8",
     "type": "line",
     "speaker": "艦長",
     "text": "（從裝貨箱底抽出一張皺紙）你們不是第一批從桅頂放石頭的人。解纜後第一段，落在桅後。",
     "next": "n9"
    },
    {
     "id": "n9",
     "type": "line",
     "speaker": "艦長",
     "text": "（指紙面空白處）只有落點。沒有鼓點，沒有岸標，也沒有第二次。",
     "next": "n10"
    },
    {
     "id": "n10",
     "type": "line",
     "speaker": "官員",
     "text": "（他一直坐在借船桌後，此時在單上寫下「落石試驗」）結果欄呢？",
     "next": "n11"
    },
    {
     "id": "n11",
     "type": "line",
     "speaker": "艦長",
     "text": "空著。等他們做完再填。",
     "next": "n12"
    },
    {
     "id": "n12",
     "type": "line",
     "speaker": "艦長",
     "text": "（把封蠟交給馬蒂厄）每一趟原紙，下船就封。我不上船，也不先看。這是我的船，也是我的舊紙；我若跟著上去，最後誰都能說，我替自己作證。",
     "next": "n13"
    },
    {
     "id": "n13",
     "type": "line",
     "speaker": "艦長",
     "text": "覺得手上的東西夠了，就回碼頭找我。別等我問到一半，才說還少一張紙。",
     "next": "g1"
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "C0-3"
    }
   ]
  },
  {
   "id": "C0-3",
   "title": "先把舊紙說到剛好",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "（把舊紙攤平）先別替它補字。它現在到底能說到哪裡？",
     "next": "c1"
    },
    {
     "id": "c1",
     "type": "choice",
     "text": "這張舊紙目前能支持哪一句？",
     "options": [
      {
       "id": "all",
       "text": "它證明所有正在向前的船，都會把石頭留在後面。",
       "next": "a1"
      },
      {
       "id": "bounded",
       "text": "它記到某一次落後；但沒有當趟船速，不能代表所有船況。",
       "effects": [
        {
         "flag": [
          "oldPaperScoped",
          "bounded"
         ]
        }
       ],
       "next": "n2"
      },
      {
       "id": "fake",
       "text": "缺了幾欄，所以這張紙是假的。",
       "next": "f1"
      }
     ]
    },
    {
     "id": "a1",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "（指船速空欄）「所有船況」是你添上去的。紙上沒有。",
     "next": "c1"
    },
    {
     "id": "f1",
     "type": "line",
     "speaker": "馬蒂厄",
     "text": "落在後面，是原來就寫著的。",
     "next": "f2"
    },
    {
     "id": "f2",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "不完整，不等於沒有發生。",
     "next": "c1"
    },
    {
     "id": "n2",
     "type": "system",
     "speaker": "system",
     "text": "A6 收入卷宗：舊紙記到真實落後，但缺少當趟船速，只能保留為未分類紀錄。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "（把空白卷宗翻到下一頁）船在哪裡、怎麼走、怎麼放手、由誰記、做幾回，我都留空。你來填。",
     "next": "g1"
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "C1-1"
    }
   ]
  },
  {
   "id": "C1-1",
   "title": "同一份卷宗",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "第二天，船員把門閂、等拍鼓、岸標紙與空白卷宗搬上船。維達爾船長留在踏板外，沒有跨上甲板。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "馬蒂厄",
     "text": "（把封蠟擱在卷宗旁）條件先寫，落點後看。原紙一下船，我就封。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "先做出一句你敢拿去給他問的話。答不完，就把他的問題帶回來。",
     "next": "e1"
    },
    {
     "id": "e1",
     "type": "embed",
     "system": "ship",
     "phase": "dossier",
     "hint": "自由設計桅杆落石與封存船艙盲測；資料達門檻後選定斷言範圍，自選時機上碼頭，三柱失敗可返回補實驗。",
     "until": {
      "ship": "dossier-complete"
     },
     "next": "g1"
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "C3-1"
    }
   ]
  },
  {
   "id": "C3-1",
   "title": "少寫的不是答案，是一欄",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "三柱改寫後，官員把縮短的結果欄掛回木板：本實驗排除了「承載物前進，落石就必定落後」這項反對；沒有直接量到地球運動。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "艦長",
     "text": "（逐字讀完才拿起筆）我的船只替今天量到的事作證。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "艦長",
     "text": "（在操作紀錄下簽名）船況、放手與原始紀錄，如紙所寫。",
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "馬蒂厄",
     "text": "（指向維達爾船長舊紙上的船速空欄）這一欄，當年沒有人填。",
     "next": "n5"
    },
    {
     "id": "n5",
     "type": "line",
     "speaker": "艦長",
     "text": "（補寫）船速未記；船況不能分類。",
     "next": "n6"
    },
    {
     "id": "n6",
     "type": "line",
     "speaker": "艦長",
     "text": "我當年少寫的，不是一個答案，是一欄。（把舊紙重新掛回木板）不撕。留著。",
     "next": "n7"
    },
    {
     "id": "n7",
     "type": "line",
     "speaker": "商人",
     "text": "（看向被退回、畫錯與未分類的紙）退回來的、畫壞的，你們也掛上去？",
     "next": "n8"
    },
    {
     "id": "n8",
     "type": "line",
     "speaker": "艦長",
     "text": "不留，下一個人就會再替它們補話。",
     "next": "n9"
    },
    {
     "id": "n9",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "（把簽好的結果欄壓在木板中央）這就夠重了。",
     "next": "g1"
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "C3-2"
    }
   ]
  },
  {
   "id": "C3-2",
   "title": "替卷宗題名",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "（把卷宗推過來）封面還空著。你替它題名。",
     "next": "c1"
    },
    {
     "id": "c1",
     "type": "choice",
     "text": "這份卷宗要叫什麼？",
     "options": [
      {
       "id": "cabin",
       "text": "船艙裡的靜止",
       "effects": [
        {
         "flag": [
          "caseTitle",
          "cabin"
         ]
        }
       ],
       "next": "s1"
      },
      {
       "id": "segment",
       "text": "解纜後的第一段",
       "effects": [
        {
         "flag": [
          "caseTitle",
          "segment"
         ]
        }
       ],
       "next": "s1"
      },
      {
       "id": "stone",
       "text": "同一顆石頭，兩張紙",
       "effects": [
        {
         "flag": [
          "caseTitle",
          "stone"
         ]
        }
       ],
       "next": "s1"
      }
     ]
    },
    {
     "id": "s1",
     "type": "system",
     "speaker": "system",
     "text": "你題的名，已經寫在卷宗封面上。",
     "next": "g1"
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "CE-1"
    }
   ]
  },
  {
   "id": "CE-1",
   "title": "兩本書・1642",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "1642 年。紙張、鉛字與油墨。伽桑狄把伽利略的《對話》放在左邊，自己的手稿放在右邊。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "（指腹停在《對話》的船艙頁）他把船寫進書裡。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "stage",
     "text": "馬賽的落點紙、船速紀錄、盲測蠟封與公開換過的兩張紙攤在兩本書之間。",
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "（把卷宗夾進手稿）我們把書帶到海上。現在，把海帶回書裡。",
     "next": "n5"
    },
    {
     "id": "n5",
     "type": "line",
     "speaker": "stage",
     "text": "桌角有一封新到的信：伽利略已於阿爾切特里去世。伽桑狄沒有朗讀，只把《對話》的封面拂平。",
     "next": "n6"
    },
    {
     "id": "n6",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "五十年前，他把第一本空白筆記塞進我手裡。如今他走了，我仍是那天的樣子。",
     "next": "g1"
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "CE-2"
    }
   ]
  },
  {
   "id": "CE-2",
   "title": "旅人筆記・末頁",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "旅人把岸上紙與船上紙並排攤開。原紙都還在；錯過的線、刪改的句子，也都還在。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "（把船上那張推到岸上那張下面）同一顆石頭。兩個量它的地方。",
     "next": "t1"
    },
    {
     "id": "t1",
     "type": "line",
     "speaker": "stage",
     "text": "卷宗封面上是旅人自己寫的字：《船艙裡的靜止》。",
     "require": {
      "flags": [
       [
        "caseTitle",
        "cabin"
       ]
      ]
     },
     "next": "t2"
    },
    {
     "id": "t2",
     "type": "line",
     "speaker": "stage",
     "text": "卷宗封面上是旅人自己寫的字：《解纜後的第一段》。",
     "require": {
      "flags": [
       [
        "caseTitle",
        "segment"
       ]
      ]
     },
     "next": "t3"
    },
    {
     "id": "t3",
     "type": "line",
     "speaker": "stage",
     "text": "卷宗封面上是旅人自己寫的字：《同一顆石頭，兩張紙》。",
     "require": {
      "flags": [
       [
        "caseTitle",
        "stone"
       ]
      ]
     },
     "next": "r1"
    },
    {
     "id": "r1",
     "type": "review",
     "prompts": [
      "船上與岸上看見的路徑不同，為什麼不代表有人看錯？",
      "這場實驗排除了哪一個反對？又沒有證明什麼？"
     ],
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "stage",
     "text": "旅人把岸上那道彎線往前延長。短弧逐漸伸向頁面之外。他在弧線旁親手寫下：",
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "月亮也一直在向前。如果沒有東西讓它改變，它為什麼沒有沿直線離開？",
     "next": "h1"
    },
    {
     "id": "h1",
     "type": "histfacts",
     "next": "s1"
    },
    {
     "id": "s1",
     "type": "system",
     "speaker": "system",
     "text": "第三章已封存。旅人筆記新增未解問題：「月亮為什麼沒有沿直線離開？」",
     "next": "end"
    },
    {
     "id": "end",
     "type": "end"
    }
   ]
  }
 ]
};
 if (typeof module === "object" && module.exports) { module.exports = data; }
 else { root.GB = root.GB || {}; root.GB.DATA = root.GB.DATA || {}; root.GB.DATA.scenes3 = data; }
})(typeof self !== "undefined" ? self : this);
