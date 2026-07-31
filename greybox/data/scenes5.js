/* data/scenes5.js — 第五章場景執行載體（file:// 相容）。規範鏡像:scenes5.json。
   ⚠ 本檔為生成物；請改 scenes5.json 後執行 node tools/build-ch5-data.mjs。 */
(function (root) {
 "use strict";
 var data = {
 "chapter": "ch5",
 "startScene": "E0-1",
 "title": "兩本帳，哪一本是真的？",
 "evidenceNames": {
  "S6": "《運動之量》正統文獻",
  "S7": "'s Gravesande 黏土報告",
  "J1": "帶方向的動量帳",
  "J2": "活力帳（mv²）",
  "J3": "黏土深度",
  "J4": "兩本帳的重寫"
 },
 "evidenceSummaries": {
  "J1": "鋼頭、油灰頭各三筆：帶方向的 mv 撞前撞後都閉合。",
  "J2": "同一批紀錄改算 mv²：鋼頭閉合，油灰從可見運動短少。",
  "J3": "同一顆球的三種速度：坑深與 v² 吻合；短少的完整去向仍未對平。",
  "J4": "兩本帳記不同的事，各有用途；不能合成一本，也不能獨尊一本。"
 },
 "scenes": [
  {
   "id": "E0-1",
   "title": "那本書，我看著它印出來",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "筆記自己翻頁。倫敦的墨味折進紙縫，露出一座有長窗、書牆與壁爐的鄉間莊園。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "system",
     "speaker": "system",
     "text": "約 1740 年，法國・西雷莊園。距上一頁的倫敦，五十三年。",
     "next": "x1"
    },
    {
     "id": "x1",
     "type": "line",
     "speaker": "stage",
     "text": "壁爐燒得很旺。長桌上攤著一本拆了線的大書，旁邊三疊紙：一疊是原文，一疊是法文，一疊全是算式。算式那疊最厚。",
     "next": "x2"
    },
    {
     "id": "x2",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "那是《原理》。裝訂線都拆開了——有人把它拆了在讀。",
     "osPurpose": "cross_chapter_memory",
     "next": "x3"
    },
    {
     "id": "x3",
     "type": "line",
     "speaker": "stage",
     "text": "有人從書牆後面繞出來，手上還捏著筆，袖口沾了墨。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "埃米莉・杜・夏特萊。你來得正好，還是正不巧——這屋裡最近只吵一件事。",
     "next": "x4"
    },
    {
     "id": "x4",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "那本書……",
     "next": "x5"
    },
    {
     "id": "x5",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "（順著他的視線）拆了才好翻。我在把它譯成法文。",
     "next": "x6"
    },
    {
     "id": "x6",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "不是翻字。翻字誰都會。我要讓它在法文裡也能算。",
     "next": "c_intro"
    },
    {
     "id": "c_intro",
     "type": "choice",
     "text": "你怎麼說明自己？",
     "options": [
      {
       "id": "saw-printing",
       "text": "我看著那本書印出來。",
       "effects": [
        {
         "flag": [
          "ch5IntroChoice",
          "saw-printing"
         ]
        }
       ],
       "next": "intro_print_1"
      },
      {
       "id": "collision-question",
       "text": "我帶著一個問題來的。碰撞之後，該記住什麼？",
       "effects": [
        {
         "flag": [
          "ch5IntroChoice",
          "collision-question"
         ]
        }
       ],
       "next": "intro_question_1"
      }
     ]
    },
    {
     "id": "intro_print_1",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "（筆停住）那是我出生以前的事。",
     "next": "intro_print_2"
    },
    {
     "id": "intro_print_2",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "我知道。這件事很難解釋。",
     "next": "intro_print_3"
    },
    {
     "id": "intro_print_3",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "（看了他兩秒，把筆插回墨水瓶）……好。那你至少讀過它。",
     "next": "x9"
    },
    {
     "id": "intro_question_1",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "（停下腳步）那你來對地方了，而且來得很不巧。",
     "next": "intro_question_2"
    },
    {
     "id": "intro_question_2",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "這屋裡為了這句話，已經吵到僕人都會背了。",
     "next": "x9"
    },
    {
     "id": "x9",
     "type": "line",
     "speaker": "stage",
     "text": "她把算式那疊往旅人面前推了半寸，又停住，像在決定要不要給。",
     "next": "x10"
    },
    {
     "id": "x10",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "你進去之前，先知道一件事：裡面那位不是笨蛋。",
     "next": "g1"
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "E0-2"
    }
   ]
  },
  {
   "id": "E0-2",
   "title": "運動之量，只能有一個？",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "杜佩院士",
     "text": "運動之量，就是質量乘速度——帶著方向記。撞前多少，撞後就多少。萊布尼茲那個速度還要自乘的『活力』，只是多出來的玄想。",
     "next": "x2"
    },
    {
     "id": "x2",
     "type": "line",
     "speaker": "stage",
     "text": "他把帳本轉過來，推到旅人面前。紙頁邊緣捲得很厲害，墨色深淺不一——有些是很多年前寫的。",
     "next": "x3"
    },
    {
     "id": "x3",
     "type": "line",
     "speaker": "杜佩院士",
     "text": "三十年。你隨便挑一頁，挑一場撞，自己加加看。",
     "next": "c_ledger"
    },
    {
     "id": "c_ledger",
     "type": "choice",
     "text": "你怎麼回應這本帳？",
     "options": [
      {
       "id": "check-pages",
       "text": "真的翻開加一遍。",
       "effects": [
        {
         "flag": [
          "ch5LedgerChoice",
          "check-pages"
         ]
        }
       ],
       "next": "ledger_check_1"
      },
      {
       "id": "ask-worry",
       "text": "我先問：哪一場撞最讓你不放心？",
       "effects": [
        {
         "flag": [
          "ch5LedgerChoice",
          "ask-worry"
         ]
        }
       ],
       "next": "ledger_ask_1"
      }
     ]
    },
    {
     "id": "ledger_check_1",
     "type": "line",
     "speaker": "stage",
     "text": "旅人翻了三頁，每一頁都自己加了一次。都對。",
     "next": "ledger_check_2"
    },
    {
     "id": "ledger_check_2",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "三十年。每一頁都對。這個人不是來擋路的。",
     "osPurpose": "private_observation",
     "next": "n2"
    },
    {
     "id": "ledger_ask_1",
     "type": "line",
     "speaker": "杜佩院士",
     "text": "（第一次抬眼）……你問得不對。我從來沒有不放心過。",
     "next": "ledger_ask_2"
    },
    {
     "id": "ledger_ask_2",
     "type": "line",
     "speaker": "stage",
     "text": "但他翻頁的手停了一下。",
     "next": "ledger_ask_3"
    },
    {
     "id": "ledger_ask_3",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "他停了一下。",
     "osPurpose": "private_observation",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "（把院士的帳本壓在桌面中央）杜佩院士的帳，每一次都對得平。這一點你要先記住：他不是在胡說。",
     "next": "s6"
    },
    {
     "id": "s6",
     "type": "system",
     "speaker": "system",
     "receiptKind": "source",
     "text": "取得 S6：《運動之量》正統文獻。可測主張：碰撞前後帶方向的 mv 加總閉合。",
     "effects": [
      {
       "evidence": "S6"
      }
     ],
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "這是萊頓來的報告。作者是牛頓的信徒；他量出的坑深，卻跟著速度的平方走。",
     "next": "x6"
    },
    {
     "id": "x6",
     "type": "line",
     "speaker": "stage",
     "text": "她把報告放在帳本旁邊。兩份紙差不多厚。",
     "next": "x7"
    },
    {
     "id": "x7",
     "type": "line",
     "speaker": "杜佩院士",
     "text": "坑深不是運動之量。那是黏土的事。",
     "next": "x8"
    },
    {
     "id": "x8",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "那就是兩件事。可是它們量的是同一場撞。",
     "next": "x9"
    },
    {
     "id": "x9",
     "type": "line",
     "speaker": "stage",
     "text": "沒有人接話。壁爐劈了一聲。",
     "next": "s7"
    },
    {
     "id": "s7",
     "type": "system",
     "speaker": "system",
     "receiptKind": "source",
     "text": "取得 S7：黏土報告。它給出可量的壓陷尺度，不替短少的完整去向開收據。",
     "effects": [
      {
       "evidence": "S7"
      }
     ],
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "在你替任何一邊說話以前，先把這場架拆成兩本各自算得清的帳。誰對誰錯，等帳自己說。",
     "next": "x10"
    },
    {
     "id": "x10",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "等帳自己說——這句話我在馬賽聽過，在劍橋也聽過。走了一百五十年，還是同一句。",
     "osPurpose": "cross_chapter_memory",
     "next": "g1"
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "E1-1"
    }
   ]
  },
  {
   "id": "E1-1",
   "title": "先把問句立好",
   "nodes": [
    {
     "id": "x1",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "問句要寫在做之前。做完再想要問什麼，就會挑對自己有利的那一場。",
     "next": "q1"
    },
    {
     "id": "q1",
     "type": "choice",
     "text": "先替兩本帳立下什麼可驗的問句？",
     "options": [
      {
       "id": "ledger",
       "text": "「一本問帶方向的 mv 前後變不變；一本問 mv² 前後變不變。」",
       "effects": [
        {
         "rep": 1,
         "reason": "先把兩本帳各自改寫成可驗的問題，沒有先替任何一邊宣布勝負"
        }
       ],
       "next": "n1"
      },
      {
       "id": "bigger",
       "text": "「先比哪一本算出的數字比較大。」",
       "next": "bad1"
      },
      {
       "id": "authority",
       "text": "「先比哪一位前輩的名聲更大。」",
       "require": {
        "flagAbsent": "ch5AuthoritySubstitutionTried"
       },
       "effects": [
        {
         "rep": -1,
         "reason": "拿前輩的名聲替代可驗資料"
        },
        {
         "flag": [
          "ch5AuthoritySubstitutionTried",
          "1"
         ]
        }
       ],
       "next": "bad2"
      },
      {
       "id": "authority-again",
       "text": "「先比哪一位前輩的名聲更大。」",
       "require": {
        "flag": [
         "ch5AuthoritySubstitutionTried",
         "1"
        ]
       },
       "next": "bad2"
      }
     ]
    },
    {
     "id": "bad1",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "比大小不是守恆。先問每一本在同一場碰撞前後，記的數有沒有對平。",
     "next": "q1"
    },
    {
     "id": "bad2",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "名聲不能替帳結算。把前輩的名字收起來，只留下量得到的問句。",
     "next": "q1"
    },
    {
     "id": "n1",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "對。先把兩種算法各算清楚——哪一本、在什麼時候，對得平。怎麼問，等帳記完再說。",
     "next": "x3"
    },
    {
     "id": "x3",
     "type": "line",
     "speaker": "杜佩院士",
     "text": "（從火爐邊）兩本。（停）隨你。",
     "next": "x4"
    },
    {
     "id": "x4",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "他說「隨你」的時候，把帳本闔上了。",
     "osPurpose": "private_observation",
     "next": "g1"
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "E1-2"
    }
   ]
  },
  {
   "id": "E1-2",
   "title": "碰撞台・第一輪",
   "nodes": [
    {
     "id": "x1",
     "type": "line",
     "speaker": "stage",
     "text": "長桌清空。兩顆黃銅球用細繩吊成一對，球心等高。桌邊擺著一盤油灰。",
     "next": "x2"
    },
    {
     "id": "x2",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "兩種碰法。彈開的，和黏住的。",
     "next": "x3"
    },
    {
     "id": "x3",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "同一種速度，各做三回——不是為了保險，是為了讓你自己看見它每次都一樣。",
     "next": "c_order"
    },
    {
     "id": "c_order",
     "type": "choice",
     "text": "先做哪一種？",
     "options": [
      {
       "id": "rebound-first",
       "text": "先做彈開的。乾淨的先做。",
       "effects": [
        {
         "flag": [
          "ch5CollisionOrder",
          "rebound-first"
         ]
        }
       ],
       "next": "order_rebound_1"
      },
      {
       "id": "stick-first",
       "text": "先做黏住的。難看的先做。",
       "effects": [
        {
         "flag": [
          "ch5CollisionOrder",
          "stick-first"
         ]
        }
       ],
       "next": "order_stick_1"
      }
     ]
    },
    {
     "id": "order_rebound_1",
     "type": "line",
     "speaker": "杜佩院士",
     "text": "（沒有回頭）彈開的當然平。你會很快樂。",
     "next": "lab1"
    },
    {
     "id": "order_stick_1",
     "type": "line",
     "speaker": "杜佩院士",
     "text": "（這才回頭）你先做那個？",
     "next": "order_stick_2"
    },
    {
     "id": "order_stick_2",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "如果有問題，我想早點看到。",
     "next": "order_stick_3"
    },
    {
     "id": "order_stick_3",
     "type": "line",
     "speaker": "杜佩院士",
     "text": "……嗯。",
     "next": "lab1"
    },
    {
     "id": "lab1",
     "type": "embed",
     "system": "collision",
     "phase": "momentum",
     "hint": "兩種碰法各留下三筆同速紀錄，勾選後提出斷言一。",
     "until": {
      "collision": "j1"
     },
     "next": "x6"
    },
    {
     "id": "x6",
     "type": "line",
     "speaker": "stage",
     "text": "六張紀錄紙一字排開。旅人在每一張的角落寫上撞法與速度。",
     "next": "g1"
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "E2-1"
    }
   ]
  },
  {
   "id": "E2-1",
   "title": "動量帳，到哪裡都平",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "杜佩院士",
     "text": "撞爛、黏住、彈開，它都守得住。這一本帳，我三十年沒見它出過錯。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "他說得對。別因為等一下要為難他，就假裝這本帳有問題。它沒有。",
     "next": "c_why2"
    },
    {
     "id": "c_why2",
     "type": "choice",
     "text": "那你為什麼還要第二本？",
     "options": [
      {
       "id": "ask-emilie",
       "text": "既然它每次都平，為什麼還要另一本？",
       "effects": [
        {
         "flag": [
          "ch5WhySecondLedger",
          "ask-emilie"
         ]
        }
       ],
       "next": "why_emilie_1"
      },
      {
       "id": "ask-dupre",
       "text": "黏住那一組，油灰上的坑，你記在哪一欄？",
       "effects": [
        {
         "flag": [
          "ch5WhySecondLedger",
          "ask-dupre"
         ]
        }
       ],
       "next": "why_dupre_1"
      }
     ]
    },
    {
     "id": "why_emilie_1",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "因為黏住的那一組，油灰上有個坑。",
     "next": "why_emilie_2"
    },
    {
     "id": "why_emilie_2",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "那個坑是真的。他的帳裡，沒有一欄可以寫它。",
     "next": "x3"
    },
    {
     "id": "why_dupre_1",
     "type": "line",
     "speaker": "stage",
     "text": "老人沒有立刻回答。他把帳本又翻開，翻到最後一頁空白處。",
     "next": "why_dupre_2"
    },
    {
     "id": "why_dupre_2",
     "type": "line",
     "speaker": "杜佩院士",
     "text": "……不記。那不是運動之量。",
     "next": "why_dupre_3"
    },
    {
     "id": "why_dupre_3",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "可是它每次都在。",
     "next": "why_dupre_4"
    },
    {
     "id": "why_dupre_4",
     "type": "line",
     "speaker": "杜佩院士",
     "text": "每次都在的東西很多。天氣也每次都在。",
     "next": "x3"
    },
    {
     "id": "x3",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "他不是看不見那個坑。他是沒有地方放它。",
     "osPurpose": "private_hypothesis",
     "next": "g1"
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "E2-2"
    }
   ]
  },
  {
   "id": "E2-2",
   "title": "同一批紀錄，換一本帳",
   "nodes": [
    {
     "id": "x1",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "我再撞幾次，量坑深。",
     "next": "x2"
    },
    {
     "id": "x2",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "不要。",
     "next": "x3"
    },
    {
     "id": "x3",
     "type": "line",
     "speaker": "stage",
     "text": "她把手按在那六張紀錄紙上。",
     "next": "x4"
    },
    {
     "id": "x4",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "你一重做，他就有話說了——你換了資料才算出你要的結果。",
     "next": "x5"
    },
    {
     "id": "x5",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "用這六張。一張都不要換。",
     "next": "c_reuse"
    },
    {
     "id": "c_reuse",
     "type": "choice",
     "text": "你怎麼回答？",
     "options": [
      {
       "id": "reuse",
       "text": "同一批數字算兩次。這樣輸贏都賴不掉。",
       "effects": [
        {
         "flag": [
          "ch5ReuseChoice",
          "reuse"
         ]
        }
       ],
       "next": "reuse_1"
      },
      {
       "id": "missing-depth",
       "text": "可是我還沒量坑深。",
       "effects": [
        {
         "flag": [
          "ch5ReuseChoice",
          "missing-depth"
         ]
        }
       ],
       "next": "missing_depth_1"
      }
     ]
    },
    {
     "id": "reuse_1",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "對。而且如果兩本帳講的是同一件事，它們算出來就會一樣。",
     "next": "reuse_2"
    },
    {
     "id": "reuse_2",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "如果不一樣——那才有意思。",
     "next": "lab2"
    },
    {
     "id": "missing_depth_1",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "坑深另外算，另外一張紙。先別把它混進這六張。",
     "next": "missing_depth_2"
    },
    {
     "id": "missing_depth_2",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "她在防的不是院士。她在防我。",
     "osPurpose": "private_observation",
     "next": "lab2"
    },
    {
     "id": "lab2",
     "type": "embed",
     "system": "collision",
     "phase": "vis-viva",
     "hint": "不要再撞；勾回第一輪同一批紀錄重算，再完成 4／8 油灰追一筆。",
     "until": {
      "collision": "followup"
     },
     "next": "x8"
    },
    {
     "id": "x8",
     "type": "line",
     "speaker": "stage",
     "text": "同一批數字，第二本帳。旅人算到黏住那一組時，筆停了。",
     "next": "x9"
    },
    {
     "id": "x9",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "這一組……少了一截。",
     "next": "x10"
    },
    {
     "id": "x10",
     "type": "line",
     "speaker": "杜佩院士",
     "text": "那就是它不成立。",
     "next": "x11"
    },
    {
     "id": "x11",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "或者那一截去了別的地方。",
     "next": "x12"
    },
    {
     "id": "x12",
     "type": "line",
     "speaker": "stage",
     "text": "兩個人都沒有再說話。旅人手上還握著那張紙。",
     "next": "g1"
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "E2-3"
    }
   ]
  },
  {
   "id": "E2-3",
   "title": "黏土記得速度的平方",
   "nodes": [
    {
     "id": "x1",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "現在可以量坑了。",
     "next": "x2"
    },
    {
     "id": "x2",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "三種落下的高度。同一顆球，同一盤油灰。",
     "next": "x3"
    },
    {
     "id": "x3",
     "type": "line",
     "speaker": "stage",
     "text": "她把萊頓那份報告翻開，壓在盤子旁邊，但沒有讓旅人看數字那一頁。",
     "next": "x4"
    },
    {
     "id": "x4",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "先量你自己的。等一下再對他們的。",
     "next": "lab3"
    },
    {
     "id": "lab3",
     "type": "embed",
     "system": "collision",
     "phase": "clay",
     "hint": "三種落下速度各留一筆，勾選後提出斷言三。",
     "until": {
      "collision": "j3"
     },
     "next": "c_scale"
    },
    {
     "id": "c_scale",
     "type": "choice",
     "text": "這盤油灰能說到哪裡？",
     "options": [
      {
       "id": "overclaim-vital-force",
       "text": "坑深跟著速度自乘走。這證明活力才是真的運動之量。",
       "next": "scale_bad_world"
      },
      {
       "id": "momentum-wrong",
       "text": "坑深跟著速度自乘走——所以動量帳是錯的。",
       "next": "scale_bad_momentum"
      },
      {
       "id": "measurement-only",
       "text": "這盤油灰給了那一截短少一把可以量的尺。它還沒說那一截去了哪裡。",
       "effects": [
        {
         "flag": [
          "ch5ScaleBoundary",
          "measurement-only"
         ]
        }
       ],
       "next": "scale_right"
      }
     ]
    },
    {
     "id": "scale_bad_world",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "停。你今天量的是油灰，不是全世界。",
     "next": "c_scale"
    },
    {
     "id": "scale_bad_momentum",
     "type": "line",
     "speaker": "杜佩院士",
     "text": "我的帳從來沒有出錯。你去翻三十年。",
     "next": "c_scale"
    },
    {
     "id": "scale_right",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "現在可以看了。",
     "next": "n1a"
    },
    {
     "id": "n1",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "這盤黏土給了短少一把可量的尺。可要把去向全帳對平，還缺一步：沒有人量過那兩團油灰的凹痕。",
     "legacyOnly": true,
     "next": "g1"
    },
    {
     "id": "n1a",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "尺有了。可是這把尺只量到油灰。那兩團撞在一起的球本身，沒有人量過。",
     "next": "x8"
    },
    {
     "id": "x8",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "我知道那一截去了哪裡。我甚至知道它一百年後會叫什麼。但今天桌上沒有一張紙寫得出來。",
     "osPurpose": "future_knowledge",
     "next": "g1"
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "E3-1"
    }
   ]
  },
  {
   "id": "E3-1",
   "title": "兩本帳上桌",
   "nodes": [
    {
     "id": "init",
     "type": "system",
     "speaker": "system",
     "text": "莊園主人請眾人入席。動量帳、活力帳與黏土盤並排留在桌上。",
     "effects": [
      {
       "debate": "init"
      }
     ],
     "next": "x1"
    },
    {
     "id": "x1",
     "type": "line",
     "speaker": "stage",
     "text": "客人陸續進來。有人帶了自己的帳本，有人只帶了椅子。杜佩院士坐回火爐邊那張，沒有換位置。",
     "next": "x2"
    },
    {
     "id": "x2",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "你等一下不是要贏他。",
     "next": "x3"
    },
    {
     "id": "x3",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "那要做什麼？",
     "next": "x4"
    },
    {
     "id": "x4",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "讓兩本帳都留在桌上。",
     "next": "debate"
    },
    {
     "id": "debate",
     "type": "embed",
     "system": "debate",
     "hint": "依序回答院士三問，再親手重寫題目。",
     "until": {
      "debateWon": true
     },
     "suspendNext": "debrief",
     "next": "g1"
    },
    {
     "id": "debrief",
     "type": "embed",
     "system": "debrief",
     "hint": "攤開失手配對，帶著原證據回到桌邊。",
     "next": "reenter"
    },
    {
     "id": "reenter",
     "type": "system",
     "speaker": "system",
     "text": "你回到桌邊。帳沒有人動過；剛才吵到哪裡，就從哪裡接下去。",
     "effects": [
      {
       "debate": "reenter"
      }
     ],
     "next": "debate"
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "E3-2"
    }
   ]
  },
  {
   "id": "E3-2",
   "title": "紙都留在桌上",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "院士沒有撕掉自己的紙。兩本帳並排攤著，各自留下它能回答的問題，也留下還沒對平的去向。",
     "next": "x1"
    },
    {
     "id": "x1",
     "type": "line",
     "speaker": "stage",
     "text": "人散得很慢。杜佩院士最後一個起身，走到桌邊，看那兩疊紙看了很久。",
     "next": "x2"
    },
    {
     "id": "x2",
     "type": "line",
     "speaker": "杜佩院士",
     "text": "那個坑。",
     "next": "x3"
    },
    {
     "id": "x3",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "嗯。",
     "next": "x4"
    },
    {
     "id": "x4",
     "type": "line",
     "speaker": "杜佩院士",
     "text": "它是真的。",
     "next": "x5"
    },
    {
     "id": "x5",
     "type": "line",
     "speaker": "杜佩院士",
     "text": "我只是不知道要記在哪一欄。",
     "next": "x6"
    },
    {
     "id": "x6",
     "type": "line",
     "speaker": "stage",
     "text": "他把自己的帳本放回桌上，沒有帶走。然後轉身離開。",
     "next": "x7"
    },
    {
     "id": "x7",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "他不是輸了。他是把位置讓出來，給一欄還沒有人寫過的東西。",
     "osPurpose": "private_hypothesis",
     "next": "c_j4"
    },
    {
     "id": "c_j4",
     "type": "choice",
     "text": "你要在卷宗上寫什麼？",
     "options": [
      {
       "id": "keep-both",
       "text": "兩本帳都留。還沒對平的那一截，也留著，不補寫。",
       "next": "j4"
      }
     ]
    },
    {
     "id": "j4",
     "type": "system",
     "speaker": "system",
     "text": "取得 J4：兩本帳的重寫。它不宣稱短少的完整去向已經對平。",
     "effects": [
      {
       "evidence": "J4"
      },
      {
       "rep": 1,
       "reason": "承認兩本帳記的是不同事情，也保留尚未對平的去向"
      }
     ],
     "next": "g1"
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "EE-1"
    }
   ]
  },
  {
   "id": "EE-1",
   "title": "她會把一生給那本書",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "客人散去。壁爐低了下來。杜夏特萊沒有收那兩本帳，任它們並排攤在桌上。",
     "next": "x1"
    },
    {
     "id": "x1",
     "type": "line",
     "speaker": "stage",
     "text": "她回到長桌另一頭，把《原理》拆開的那幾疊重新對齊。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "法國讀懂《原理》的人還太少。我要做的不只是翻字，是讓它在另一種語言裡也能算。",
     "next": "x3"
    },
    {
     "id": "x3",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "要多久？",
     "next": "x4"
    },
    {
     "id": "x4",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "我算過。算了，不說。說出來會嚇到自己。",
     "next": "x5"
    },
    {
     "id": "x5",
     "type": "line",
     "speaker": "stage",
     "text": "她低頭繼續對齊紙疊。爐火照著那三疊紙——原文、法文、算式。算式那疊還是最厚。",
     "next": "c_emilie"
    },
    {
     "id": "c_emilie",
     "type": "choice",
     "text": "你要說什麼？",
     "options": [
      {
       "id": "promise",
       "text": "它會被讀完的。",
       "effects": [
        {
         "flag": [
          "ch5EmilieChoice",
          "promise"
         ]
        }
       ],
       "next": "emilie_promise_1"
      },
      {
       "id": "notebook",
       "text": "什麼都不說，把自己的筆記放上桌。",
       "effects": [
        {
         "flag": [
          "ch5EmilieChoice",
          "notebook"
         ]
        }
       ],
       "next": "emilie_notebook_1"
      }
     ]
    },
    {
     "id": "emilie_promise_1",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "你怎麼知道。",
     "next": "emilie_promise_2"
    },
    {
     "id": "emilie_promise_2",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "……我不知道。",
     "next": "emilie_promise_3"
    },
    {
     "id": "emilie_promise_3",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "那就別安慰我。不過謝謝。",
     "next": "x12"
    },
    {
     "id": "emilie_notebook_1",
     "type": "line",
     "speaker": "stage",
     "text": "封皮磨得起毛，邊角捲了三層。她翻開第一頁，又翻到中間。",
     "next": "emilie_notebook_2"
    },
    {
     "id": "emilie_notebook_2",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "比薩。帕多瓦。馬賽。劍橋。",
     "next": "emilie_notebook_3"
    },
    {
     "id": "emilie_notebook_3",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "這是一個人的筆跡。",
     "next": "emilie_notebook_4"
    },
    {
     "id": "emilie_notebook_4",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "……是。",
     "next": "emilie_notebook_5"
    },
    {
     "id": "emilie_notebook_5",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "我不問。你也別解釋。",
     "next": "emilie_notebook_6"
    },
    {
     "id": "emilie_notebook_6",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "這是第四次有人決定不問。我開始覺得，不問才是這個時代最體面的事。",
     "osPurpose": "time_dislocation",
     "next": "x12"
    },
    {
     "id": "x12",
     "type": "line",
     "speaker": "stage",
     "text": "她把手放在《原理》的封面上。",
     "next": "x13"
    },
    {
     "id": "x13",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "他寫了天上的事。碰撞這件事，他書裡沒有。",
     "next": "x14"
    },
    {
     "id": "x14",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "所以桌上那兩本帳，得由我們自己記。",
     "next": "g1"
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "EE-2"
    }
   ]
  },
  {
   "id": "EE-2",
   "title": "旅人筆記・末頁",
   "nodes": [
    {
     "id": "x1",
     "type": "line",
     "speaker": "stage",
     "text": "旅人把兩本帳的抄本並排夾進筆記。短少的那一列沒有補上數字，只在旁邊畫了一個空框。",
     "next": "x2"
    },
    {
     "id": "x2",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "空框。第四章那個問號還在抽屜裡待了二十年。這個要多久？",
     "osPurpose": "cross_chapter_memory",
     "next": "review"
    },
    {
     "id": "review",
     "type": "review",
     "prompts": [
      "同一次油灰碰撞，兩本帳各記到了什麼？",
      "黏土實驗量到什麼，又還不能替短少證明什麼？"
     ],
     "next": "facts"
    },
    {
     "id": "facts",
     "type": "histfacts",
     "next": "x5"
    },
    {
     "id": "x5",
     "type": "line",
     "speaker": "stage",
     "text": "旅人翻回筆記最前面。那行褐掉的字還在：先別急著相信我。",
     "next": "x6"
    },
    {
     "id": "x6",
     "type": "line",
     "speaker": "stage",
     "text": "他往後翻，翻到今天這一頁，在那個空框旁邊落筆。",
     "next": "c_next"
    },
    {
     "id": "c_next",
     "type": "choice",
     "text": "寫下這一章留下的問題。",
     "options": [
      {
       "id": "write-question",
       "text": "那一截短少的，沒有消失。它去了哪裡？",
       "next": "x7"
      }
     ]
    },
    {
     "id": "x7",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "那一截短少的，沒有消失。它變成了油灰上的坑、變成兩顆球摸起來的溫度、變成我還沒有辦法量的東西。它去了哪裡？",
     "next": "x8"
    },
    {
     "id": "x8",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "……又一頁。",
     "osPurpose": "private_observation",
     "next": "end"
    },
    {
     "id": "end",
     "type": "end"
    }
   ]
  },
  {
   "id": "SC5-R1",
   "title": "修復：讓兩本帳各自說話",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "（信譽歸零。杜夏特萊把兩本帳重新攤開；短少的那一列沒有被撕掉，院士的閉合帳也沒有被蓋住。）",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "先別替任何一本宣布勝負。說清楚各自記到什麼，也說清楚哪一截還沒有去向。",
     "next": "c1"
    },
    {
     "id": "c1",
     "type": "choice",
     "text": "撤回以名聲或單一帳代替資料的結論。",
     "options": [
      {
       "id": "withdraw",
       "text": "「我撤回剛才過大的結論。兩本帳都保留；還沒對平的去向也不補寫。」",
       "effects": [
        {
         "rep": 1,
         "reason": "撤回權威與單一帳結論，重新保留兩本帳及未解缺口"
        },
        {
         "flagClear": "repLocked"
        }
       ],
       "next": "n3"
      },
      {
       "id": "momentum-only",
       "text": "「那就只留每次都對平的動量帳，另一本文字劃掉。」",
       "next": "w1"
      },
      {
       "id": "vis-viva-only",
       "text": "「那就只留能解釋黏土坑的活力帳，短少先不提。」",
       "next": "w2"
      }
     ]
    },
    {
     "id": "w1",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "你又把坑的痕跡擦掉了。一本帳對平，不等於另一把尺量到的事可以消失。",
     "next": "c1"
    },
    {
     "id": "w2",
     "type": "line",
     "speaker": "杜佩院士",
     "text": "你又把短少藏起來了。要留下這本帳，就得連它還沒對平的地方一起留下。",
     "next": "c1"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "好。現在讓同一批數字重新回答問題。",
     "next": "r1"
    },
    {
     "id": "r1",
     "type": "return"
    }
   ]
  }
 ]
};
 if (typeof module === "object" && module.exports) { module.exports = data; }
 else { root.GB = root.GB || {}; root.GB.DATA = root.GB.DATA || {}; root.GB.DATA.scenes5 = data; }
})(typeof self !== "undefined" ? self : this);
