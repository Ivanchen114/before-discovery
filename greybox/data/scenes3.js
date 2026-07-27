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
  "G1": "三回走穩落石紀錄",
  "G2": "停泊與平駛的船艙對照",
  "G3": "往前走，不等於愈走愈快",
  "G4": "岸上與船上的兩張紙",
  "G5": "沒有說過頭的結論"
 },
 "evidenceSummary": {
  "S5": "書裡提出一個可以拿到真船上檢查的問題，還不是這艘船的實驗證據。",
  "G1": "同石、同高、門閂放手，岸紙確認近似走穩的三回都落在桅腳附近。",
  "G2": "封閉船艙裡，停泊和平駛時，水面都平、落球都直、拋接都回到手裡；岸紙再確認哪一組是在平駛。",
  "G3": "解纜起步時，船愈走愈快，石頭落到桅後；走穩時，石頭落在桅腳附近。舊紙沒記船速，不能硬分到任何一邊。",
  "G4": "先用同號鼓點對上同一時刻，再把每一拍的位置改成從桅杆量；岸上紙就能換成船上紙。",
  "G5": "實驗排除「船只要往前，落石就一定落在後面」這項反對，沒有直接量到地球運動。"
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
     "text": "伽利略留下的問題還在：沒有東西繼續推，它為什麼還會往前？",
     "next": "n1b"
    },
    {
     "id": "n1b",
     "type": "line",
     "speaker": "stage",
     "text": "紙頁一翻，又是三十年。1640 年秋，法國馬賽。港風吹著一本攤開的書，總把它翻回同一頁。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "我還來不及道別，紙頁已經翻過三十年。他們老了，我沒有。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "（按住被風吹起的書頁，目光停在旅人筆記的桅杆圖上）你也在看這一頁？",
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "（看清書頁上的插圖）船、桅杆……有人從桅頂放開一顆石頭。",
     "next": "n5"
    },
    {
     "id": "n5",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "（闔起書）這是伽利略八年前出版的《對話》。他寫的是一艘走得又直又穩、沒有風浪的船。",
     "next": "n6"
    },
    {
     "id": "n6",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "（望向碼頭上真正的桅杆）所以我想借一艘真的船，照著做一次。",
     "next": "s1"
    },
    {
     "id": "s1",
     "type": "system",
     "speaker": "system",
     "text": "取得《對話》的船艙頁。它提出一個可以拿到真船上檢查的問題，還不是實驗證據。",
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
     "text": "（等洛朗・維達爾在裝貨單上畫完一筆）維達爾船長，我想借你的船做個實驗：從桅頂放下一顆石頭，看它落在哪裡。",
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
     "text": "有人認為，只要船在往前，石頭一離手，船就會跑到前面，石頭會落在後頭。",
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "同樣的說法，也有人拿來反對地球會動。地球如果在轉，塔也會跟著往前；石頭還沒落地，塔就已經往前走了，所以石頭應該落在塔後。",
     "next": "n5"
    },
    {
     "id": "n5",
     "type": "line",
     "speaker": "艦長",
     "text": "（終於抬頭）可塔頂放下的東西，不都落在塔腳嗎？",
     "next": "n6"
    },
    {
     "id": "n6",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "所以我才想查：換成一艘往前走的船，這個說法還站不站得住。",
     "next": "n7"
    },
    {
     "id": "n7",
     "type": "line",
     "speaker": "艦長",
     "text": "（把裝貨單捲起，擋在踏板前）船借你。量到什麼就寫什麼。沒弄清楚以前，別把我的名字寫上去。",
     "next": "n8"
    },
    {
     "id": "n8",
     "type": "line",
     "speaker": "艦長",
     "text": "（從裝貨箱底抽出一張皺紙）以前也有人做過。紙上寫：解纜後第一段，石頭落在桅後。",
     "next": "n9"
    },
    {
     "id": "n9",
     "type": "line",
     "speaker": "艦長",
     "text": "（指著紙面空白處）這張紙只記了落點。船當時是走穩、變快，還是變慢，沒寫；也沒有鼓點、岸標，連第二回都沒有。",
     "next": "n10"
    },
    {
     "id": "n10",
     "type": "line",
     "speaker": "官員",
     "text": "（提著借船單走近）船要離港，我得把用途和結果都記進港務簿。結果欄先寫什麼？",
     "next": "n11"
    },
    {
     "id": "n11",
     "type": "line",
     "speaker": "艦長",
     "text": "先空著。他們做完再說。",
     "next": "n12"
    },
    {
     "id": "n12",
     "type": "line",
     "speaker": "艦長",
     "text": "（把封蠟交給馬蒂厄）每趟做完，原紙一下船就封起來。我留在岸上，也不先看結果。",
     "next": "n12b"
    },
    {
     "id": "n12b",
     "type": "line",
     "speaker": "艦長",
     "text": "船是我的，舊紙也是我的。我若跟著上船，回頭誰都會懷疑我在替自己說話。",
     "next": "n13"
    },
    {
     "id": "n13",
     "type": "line",
     "speaker": "艦長",
     "text": "你覺得紙夠了，就回來找我。別等我問到一半，才發現還缺東西。",
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
   "title": "先看舊紙能說什麼",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "（把舊紙攤平）先別替舊紙猜。光看它寫下來的，最多能說到哪裡？",
     "next": "c1"
    },
    {
     "id": "c1",
     "type": "choice",
     "text": "這張舊紙目前能支持哪一句？",
     "options": [
      {
       "id": "all",
       "text": "它記到石頭落在桅後，所以只要船往前，石頭都會落後。",
       "next": "a1"
      },
      {
       "id": "bounded",
       "text": "它只記下一次落在桅後；那一趟的船速沒記，不能拿來代表別的船況。",
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
       "text": "船速、鼓點和岸標都沒記，這張紙不能算數。",
       "next": "f1"
      }
     ]
    },
    {
     "id": "a1",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "（指著船速空欄）「只要船往前」是你加的。紙上沒有。",
     "next": "c1"
    },
    {
     "id": "f1",
     "type": "line",
     "speaker": "馬蒂厄",
     "text": "石頭落在桅後，是紙上原來就有的。",
     "next": "f2"
    },
    {
     "id": "f2",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "條件沒寫全，這張紙能說的就少；但它記下的落點還是真的。",
     "next": "c1"
    },
    {
     "id": "n2",
     "type": "system",
     "speaker": "system",
     "text": "◆ 舊紙已收入卷宗：它記下一次真實落後，但那一趟船速沒記，目前只能放在「船況不明」。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "（把空白卷宗翻到下一頁）先重做舊紙寫的那一趟：解纜後第一段，再看石頭怎麼落。船和地點先不換；你來安排怎麼放手、怎麼記船速、誰記落點。每做一回，就留一張原紙。",
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
     "text": "（把封蠟擱在卷宗旁）條件先填好，等石頭落地再記落點。原紙一下船，我就封。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "先把艦長看過的後偏重做出來，讓今天的岸紙回答：解纜後第一段，船速究竟怎麼變。",
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "確認那一趟後，再只改成船走穩，看看石頭還會不會落在桅後。放手、鼓點與記錄位置都要留在原紙上。",
     "next": "n5"
    },
    {
     "id": "n5",
     "type": "line",
     "speaker": "馬蒂厄",
     "text": "先把這一趟記完整。少了哪一欄，紙上會看得見。",
     "next": "e1"
    },
    {
     "id": "e1",
     "type": "embed",
     "system": "ship",
     "phase": "dossier",
     "hint": "一次查一個問題：先設計並執行實驗，再從原紙寫出斷言。資料不夠也能去碼頭；被問倒後，可以帶著缺口回船補做。",
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
     "text": "三輪質詢結束後，官員把改過的結果欄掛回木板：本實驗排除了「承載物前進，落石就必定落後」這項反對；沒有直接量到地球運動。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "艦長",
     "text": "（逐字讀完才拿起筆）我的船，只替今天真的量過的事作證。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "艦長",
     "text": "（在操作紀錄下簽名）我只簽操作紀錄：船怎麼走、石頭怎麼放、原紙怎麼封，都照紙上寫的。",
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
     "text": "（補寫）船速沒記，這一趟不能判斷船況。",
     "next": "n6"
    },
    {
     "id": "n6",
     "type": "line",
     "speaker": "艦長",
     "text": "我當年少的就是這一欄。（把舊紙重新掛回木板）不撕。留著。",
     "next": "n7"
    },
    {
     "id": "n7",
     "type": "line",
     "speaker": "商人",
     "text": "（看向被退回、畫錯與船況不明的紙）連退回來的、畫錯的也掛？",
     "next": "n8"
    },
    {
     "id": "n8",
     "type": "line",
     "speaker": "艦長",
     "text": "要掛。留在這裡，大家才看得見哪一句說過頭了。",
     "next": "n9"
    },
    {
     "id": "n9",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "（把簽好的結果欄壓在木板中央）寫到這裡，夠了。",
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
   "title": "替卷宗取名",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "（把卷宗推過來）封面還空著。名字由你來取。",
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
     "text": "你取的名字，已寫上卷宗封面。",
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
     "text": "馬賽的落點紙、船速紀錄、船艙對照紙與公開換過的兩張紙，攤在兩本書之間。",
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
     "text": "五十年前，伽利略把第一本空白筆記塞進我手裡。現在他走了，我卻還是那天的模樣。",
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
     "text": "旅人把岸上紙與船上紙並排攤開。原紙一張不少；畫歪的線、改過的句子，也都留著。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "（把船上那張推到岸上那張下面）同一顆石頭，同一次落下。只是記它的人，站在兩個地方。",
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
     "text": "月亮也一直往前走。如果沒有東西讓它轉彎，為什麼它沒有沿直線離開？",
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
