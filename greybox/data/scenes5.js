/* data/scenes5.js — 第五章場景執行載體（file:// 相容）。規範鏡像:scenes5.json。
   ⚠ 本檔為生成物；請改 scenes5.json 後執行 node tools/build-ch5-data.mjs。 */
(function (root) {
 "use strict";
 var data = {
 "chapter": "ch5",
 "startScene": "E0-1",
 "title": "兩本帳，哪一本是真的？",
 "conclusionLint": {
  "note": "活力可以先作歷史上的帳名；『短少』與速度平方關係必須等玩家完成前一輪結算或黏土判讀後才可出現。",
  "rules": [
   {
    "term": "短少",
    "kind": "after-scene",
    "scene": "E2-2"
   },
   {
    "term": "速度的平方",
    "kind": "after-scene",
    "scene": "E2-3"
   }
  ]
 },
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
  "J3": "同一顆球的三種速度：坑深與 v² 吻合。那一截去了哪裡，仍未對平。",
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
     "text": "筆記猛地翻頁。倫敦的墨味折進紙縫，露出一座鄉間莊園：長窗、書牆、燒著的壁爐。",
     "next": "x_arrival"
    },
    {
     "id": "x_arrival",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "等一下……這又是哪裡？現在又是哪一年？",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "system",
     "speaker": "system",
     "text": "約 1740 年，法國・西雷莊園。距上一頁的倫敦，五十三年。",
     "next": "x_time"
    },
    {
     "id": "x_time",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "五十三年……那牛頓——",
     "osPurpose": "cross_chapter_memory",
     "next": "x1"
    },
    {
     "id": "x1",
     "type": "line",
     "speaker": "stage",
     "text": "壁爐燒得很旺。長桌上攤著拆了線的牛頓《原理》，旁邊是杜夏特萊自己的《物理學原理》清樣與一疊算式。算式那疊最厚。",
     "next": "x2"
    },
    {
     "id": "x2",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "等等。那是《原理》。裝訂線都拆開了——我見過它還帶著新墨的樣子。",
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
     "text": "埃米莉・杜・夏特萊。你一直盯著那本書——你認得它？",
     "next": "x4"
    },
    {
     "id": "x4",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "認得。我只是沒想到，再看見它會是五十三年後。",
     "next": "x5"
    },
    {
     "id": "x5",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "（順著他的視線）我把它拆開，一頁一頁對。旁邊那些，是我自己的清樣。",
     "next": "x6"
    },
    {
     "id": "x6",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "我在校自己那本《物理學原理》的清樣。印刷鋪明天一早來收。今晚得先弄清楚：桌上這些紙，究竟容得下我寫到哪裡。",
     "next": "c_intro"
    },
    {
     "id": "c_intro",
     "type": "choice",
     "text": "你要怎麼說自己的來歷？",
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
     "text": "（看了他一會兒，把筆插回墨水瓶）……好。那你至少讀過那本書。",
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
     "text": "進去之前，有件事你要先知道——裡面那位不是笨蛋。",
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
     "text": "運動之量，就是質量乘速度。方向也要算。撞前有多少，撞後就有多少。至於萊布尼茲那套『活力』，還要把質量乘速度之後，再乘一次速度——那是憑空多想出來的。",
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
     "text": "三十年。",
     "next": "x3a"
    },
    {
     "id": "x3a",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "等一下，你們一直說『帳』。這不是在算錢吧？",
     "next": "x3b"
    },
    {
     "id": "x3b",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "不是，只是借帳本來說。一次碰撞，之前記一邊，之後記一邊。照同一種方法加起來，兩邊相等，我們就說這本帳『對平』。",
     "next": "x3c"
    },
    {
     "id": "x3c",
     "type": "line",
     "speaker": "杜佩院士",
     "text": "我的帳，三十年都對得平。來，你自己挑一頁。",
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
     "text": "取得 S6：《運動之量》正統文獻。這本帳主張：碰撞前後，把帶方向的 mv 加總，應該對得平。",
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
     "text": "這報告是萊頓來的。寫的人讓同一顆球從不同高度落下，把油灰上的坑一個個量了下來。",
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
     "text": "兩份紙量的都是碰撞留下的痕跡。可它們能不能接成同一筆帳，現在還不能猜。",
     "next": "x9"
    },
    {
     "id": "x9",
     "type": "line",
     "speaker": "stage",
     "text": "沒有人接話。爐子裡的柴劈啪響了一聲。",
     "next": "s7"
    },
    {
     "id": "s7",
     "type": "system",
     "speaker": "system",
     "receiptKind": "source",
     "text": "取得 S7：黏土報告。同一顆球從不同高度落下，留下可比較的坑深。它和兩本帳的關係尚未判定。",
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
     "text": "先別急著替哪一邊說話。把這場架拆開，變成兩本各自算得清的帳。誰對誰錯，等帳自己說。",
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
     "text": "問句要寫在做之前。做完了才回頭想要問什麼，就會挑對自己有利的那一場。",
     "next": "x1a"
    },
    {
     "id": "x1a",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "等等。院士這本帳把質量乘上速度，方向也算。另一張紙，為什麼還要再乘一次速度？",
     "next": "x1b"
    },
    {
     "id": "x1b",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "那是萊布尼茲的另一種記法。為了記在這一頁，質量乘速度，我們先簡寫成 mv。質量乘速度、再乘一次速度，就寫成 mv²。",
     "next": "x1c"
    },
    {
     "id": "x1c",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "可它們算的根本不是同一個數字。要怎麼比？",
     "next": "x1d"
    },
    {
     "id": "x1d",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "對，這才是現在要決定的。先讓兩本帳面對同一批碰撞，再各自比較碰撞前後。你來把規矩寫清楚。",
     "next": "q1"
    },
    {
     "id": "q1",
     "type": "choice",
     "text": "要怎麼公平比較兩本帳？",
     "options": [
      {
       "id": "ledger",
       "text": "「用同一批碰撞紀錄，分別比較兩本帳的碰撞前後。」",
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
       "text": "「直接比較兩本帳算出的數字，哪一個比較大。」",
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
     "text": "兩本帳算法不同，數字大小不能直接比。要比的是同一場碰撞前後，它自己的總數有沒有改變。再試一次。",
     "next": "q1"
    },
    {
     "id": "bad2",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "名聲結不了帳。把前輩的名字收起來，只留下量得出答案的問句。",
     "next": "q1"
    },
    {
     "id": "n1",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "對。同一批紙，不換事件，只換算法。先看每一本在碰撞前後能不能對平。",
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
     "text": "（沒有回頭）彈開的當然平。你會很滿意。",
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
     "hint": "這一輪要完成：彈開和黏住兩種碰法，各用同一種速度做三回。六張紀錄都留下後，說出這批紀錄支持哪一句話。",
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
     "text": "老人沒有立刻回答。他又把帳本翻開，翻到最後一頁空白處。",
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
     "text": "那個坑他看見了。他只是沒有地方放它。",
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
     "text": "我再撞幾次，量坑有多深。",
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
     "text": "你一重做，他就有話說了——說你是換了資料才湊出你要的結果。",
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
       "text": "可是我還沒量坑有多深。",
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
     "text": "對。如果真是同一件事的兩種寫法，同一場碰撞算下來，就該一起對平，或一起短少。",
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
     "text": "原來她防的是我。",
     "osPurpose": "private_observation",
     "next": "lab2"
    },
    {
     "id": "lab2",
     "type": "embed",
     "system": "collision",
     "phase": "vis-viva",
     "hint": "這一輪要完成：不要再撞。找出第一輪同一批紀錄，用第二本帳重算，再由你判斷兩種碰法是否仍一起對平。",
     "until": {
      "collision": "j2"
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
     "text": "那這本帳就不算數。",
     "next": "x11"
    },
    {
     "id": "x11",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "先別猜它去了哪裡。你現在只看見等重油灰少一半——『一半』是規矩，還是碰巧？",
     "next": "x12"
    },
    {
     "id": "x12",
     "type": "line",
     "speaker": "stage",
     "text": "她把『一半』圈起來，在旁邊放上 4／8 砝碼，等旅人先落筆。",
     "next": "lab2b"
    },
    {
     "id": "lab2b",
     "type": "embed",
     "system": "collision",
     "phase": "followup",
     "hint": "先封存你的預測，再把砝碼換成四比八，用油灰頭追一筆。猜錯不擋進度，原預測會和結果一起留下。",
     "until": {
      "collision": "followup"
     },
     "next": "x13"
    },
    {
     "id": "x13",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "不是固定一半。等重時少一半，換成 4／8，少的是三分之二。",
     "next": "x14"
    },
    {
     "id": "x14",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "好。那就不能把『一半』寫成定律。先找一個會隨撞擊強弱改變、又能留下數字的痕跡。",
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
     "text": "萊頓那份報告量的是坑。它能不能接上剛才的短少，先別猜——我們自己做一遍。",
     "next": "x2"
    },
    {
     "id": "x2",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "先做一格和四格。同一顆球，同一盤油灰。第三個九格，先別放。",
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
     "text": "看過前兩個坑，再把第三個會落在哪一帶寫下來。封好，才親手落第三球。三筆都在桌上，我們再談它跟速度怎麼走。",
     "next": "lab3"
    },
    {
     "id": "lab3",
     "type": "embed",
     "system": "collision",
     "phase": "clay",
     "hint": "這一輪要完成三種落下高度：先量一格、四格兩筆，封存九格第三球的坑深範圍，再親手揭曉。最後用三張原紙判斷較接近速度一次方或平方。",
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
       "text": "坑深跟著速度的平方走。這證明活力才是真的運動之量。",
       "next": "scale_bad_world"
      },
      {
       "id": "momentum-wrong",
       "text": "坑深跟著速度的平方走——所以動量帳是錯的。",
       "next": "scale_bad_momentum"
      },
      {
       "id": "measurement-only",
       "text": "油灰上的坑讓我們量得出那一截短少。可它還沒說那一截去了哪裡。",
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
     "text": "停。你今天量的只是油灰。這盤油灰可代表不了全世界。",
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
     "text": "油灰上的坑讓我們量得出那一截短少。可要把兩本帳全對平，還缺一步：那兩顆撞在一起的球，沒有人量過。",
     "legacyOnly": true,
     "next": "g1"
    },
    {
     "id": "n1a",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "尺有了。可是這把尺只量到油灰。那兩顆撞在一起的球，沒有人量過。",
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
     "text": "莊園主人請眾人入席。動量帳、活力帳和黏土盤並排留在桌上。接下來從 5 點開始算。你搬的證據要是咬不住你講的話，這句就會退回。點數歸零的話，先離席複盤一次，帳和已經破掉的支柱都會留著。",
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
     "text": "等一下上桌，先別想著贏他。",
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
     "hint": "照順序回答院士三問，再親手重寫題目。",
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
     "hint": "把剛才沒站住的說法和原紙並排，再帶回桌邊。",
     "next": "reenter"
    },
    {
     "id": "reenter",
     "type": "system",
     "speaker": "system",
     "text": "你回到桌邊。帳沒有人動過。剛才吵到哪裡，就從哪裡接下去。",
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
     "text": "院士沒有撕掉自己的紙。兩本帳並排攤著，各自答得了自己那些問題，也各自留著還沒對平的那一截。",
     "next": "x1"
    },
    {
     "id": "x1",
     "type": "line",
     "speaker": "stage",
     "text": "人散得很慢。杜佩院士最後一個起身，走到桌邊，在兩本帳之間重新列式。他把坑深一列一列抄到活力帳短少的數字旁邊，想找出一個固定的換算。算了半頁，還是沒有一張紙告訴他該怎麼換。",
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
     "text": "他不是輸了。他是把位置讓出來，留給一欄還沒有人寫過的帳。",
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
     "text": "取得 J4：兩本帳的重寫。短少去了哪裡，現在還對不平。",
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
     "text": "客人散去。爐火低了下來。杜夏特萊沒有收那兩本帳，任它們並排攤在桌上。",
     "next": "x1"
    },
    {
     "id": "x1",
     "type": "line",
     "speaker": "stage",
     "text": "她回到長桌另一頭，把自己的《物理學原理》清樣重新對齊。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "第二欄留著。欄名寫『活力』。短少去了哪裡，就寫『未決』。",
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
     "text": "（看著清樣）明天一早就送印。往後每來一封質問，我都得為這兩個字答一次——可今晚沒有量到的，我不替它補。",
     "next": "x5"
    },
    {
     "id": "x5",
     "type": "line",
     "speaker": "stage",
     "text": "她低頭在清樣第二欄寫下「活力」與「未決」。爐火照過新墨。留白還在。",
     "next": "c_emilie"
    },
    {
     "id": "c_emilie",
     "type": "choice",
     "text": "你要說什麼？",
     "options": [
      {
       "id": "promise",
       "text": "總會有人沿著這一欄，繼續算下去。",
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
     "text": "又有人看出了不對，卻沒有追問。這一筆，我記下了。",
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
     "text": "所以桌上那兩本帳，得我們自己記。",
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
   "historyTag": "documented-future-echo + explicit-boundary",
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
     "text": "空框。劍橋那個問號在抽屜裡待了二十年。這個要多久？",
     "osPurpose": "cross_chapter_memory",
     "next": "review"
    },
    {
     "id": "review",
     "type": "review",
     "prompts": [
      "同一次油灰碰撞，兩本帳各記到了什麼？",
      "黏土實驗量到了什麼？又有什麼還證明不了？"
     ],
     "next": "facts"
    },
    {
     "id": "facts",
     "type": "histfacts",
     "next": "f1"
    },
    {
     "id": "f1",
     "type": "line",
     "speaker": "stage",
     "text": "空框裡先落下一點灰。西雷的燭光退去，筆記深處浮出兩顆彼此繞行的黑色岩塊。",
     "next": "f2"
    },
    {
     "id": "f2",
     "type": "line",
     "speaker": "stage",
     "text": "2022 年，一艘名為 DART 的飛行器撞上小行星衛星 Dimorphos。撞後的軌道改了，岩石碎屑也從撞擊處大片飛散。",
     "next": "f3"
    },
    {
     "id": "f3",
     "type": "line",
     "speaker": "旅人・心聲",
     "osPurpose": "cross_chapter_memory",
     "text": "後世會同時追它撞後往哪裡走，也追表面留下什麼。兩本帳都沒有被丟掉。可撞擊畫面本身，仍不能替短少的那一截完整結帳。",
     "next": "x5"
    },
    {
     "id": "x5",
     "type": "line",
     "speaker": "stage",
     "text": "旅人翻回筆記最前面。那行褪成褐色的字還在：「這個世界只為證據付費。」",
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
       "text": "油灰上的坑只留下一個量得到的印子。那一截短少的，到底去了哪裡？",
       "next": "x7"
      }
     ]
    },
    {
     "id": "x7",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "短少的那一截沒有消失——油灰上的坑，就是它留下的一個印子。可是這把尺只量到油灰，沒有量到那兩顆球。剩下的部分，我還量不出來。它去了哪裡？",
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
     "text": "（信譽歸零。杜夏特萊把兩本帳重新攤開。短少的那一列沒有撕掉，院士那本對得平的帳也沒有蓋住。）",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "先別急著判哪一本贏。說清楚各自記到什麼，也說清楚哪一截還沒有著落。",
     "next": "c1"
    },
    {
     "id": "c1",
     "type": "choice",
     "text": "收回剛才拿名聲，或只拿一本帳撐起來的話。",
     "options": [
      {
       "id": "withdraw",
       "text": "「我剛才那句話說太滿了，收回。兩本帳都留著，還沒對平的那一截也不補寫。」",
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
       "text": "「那就只留每次都對平的動量帳，另一本整本劃掉。」",
       "next": "w1"
      },
      {
       "id": "vis-viva-only",
       "text": "「那就只留活力帳。這一本解釋得了黏土坑，短少先不提。」",
       "next": "w2"
      }
     ]
    },
    {
     "id": "w1",
     "type": "line",
     "speaker": "杜夏特萊",
     "text": "你又把坑的痕跡擦掉了。這一本帳對得平，不代表另一把尺量到的東西就不存在。",
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
