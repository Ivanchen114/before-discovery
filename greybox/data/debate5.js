/* data/debate5.js — 第五章辯論執行載體（file:// 相容）。規範鏡像:debate5.json。
   ⚠ 本檔為生成物；請改 debate5.json 後執行 node tools/build-ch5-data.mjs。 */
(function (root) {
 "use strict";
 var data = {
 "persuasion": 5,
 "statements": [],
 "chapter": {
  "speakers": {
   "opponent": "杜佩院士",
   "coach": "杜夏特萊",
   "host": "莊園主人"
  },
  "order": [
   "P2",
   "P1",
   "P3",
   "FR"
  ],
  "pillars": {
   "P2": {
    "title": "第一問：帳只能有一本",
    "reasonMode": "player",
    "requirePress": true,
    "responsePrompt": "J1 每筆都對平。這能推出哪一步？",
    "responses": [
     {
      "id": "right-scope",
      "text": "這本帳確實每筆都平。我不是說它錯；我說的是，這還不能證明只能有這一本。",
      "correct": true
     },
     {
      "id": "wrong-ledger",
      "text": "油灰一黏住，動量帳就已經錯了；所以才需要另一本。",
      "correct": false,
      "reply": "你自己的 J1 每筆都平。不能一上桌就抹掉它。"
     },
     {
      "id": "only-ledger",
      "text": "既然動量帳每筆都平，第二本帳就沒有留下來的必要。",
      "correct": false,
      "reply": "這張紙只驗了這本帳。它沒有替另一把尺下判決。"
     }
    ],
    "statements": [
     {
      "id": "p2s1",
      "text": "這本帳，帶方向記。撞前多少，撞後就多少。",
      "press": "往右記正，往左記負。你若不認方向，這本帳當然不會平。",
      "insight": "院士押的是可驗的事：兩種碰法，帶方向的 mv 是否每一筆都閉合。"
     },
     {
      "id": "p2s2",
      "text": "彈開的、黏死的，我都記過。它一次也沒有漏。",
      "press": "鋼頭也好，油灰也好。把你自己的紀錄攤開，有哪一筆沒對平？",
      "insight": "這一問不能靠攻擊對手過關；要先誠實承認 J1 支持他的帳。"
     },
     {
      "id": "p2s3",
      "text": "所以運動之量只有一個。再立一本，是不會算，不是新發現。",
      "press": "我的帳既然沒有錯，你憑什麼還留第二本？",
      "insight": "「這一本正確」還推不出「只能有這一本」。先把正確的部分承認清楚。",
      "weakTo": {
       "evidence": "J1"
      }
     }
    ],
    "playerCorrect": "院士，這兩種碰法我都親手記過——鋼頭、油灰頭，帶方向加起來，每一筆都平。這本帳是對的。（把 J1 推到桌心）我要說的不是它錯了。是有些事，它沒記。",
    "breakReply": "……你先認了我的帳。好。那你說，它沒記到什麼？"
   },
   "P1": {
    "title": "第二問：短少的那一截",
    "reasonMode": "player",
    "requirePress": true,
    "responsePrompt": "J3 留下了可量的坑。這能反駁院士哪一步？",
    "responses": [
     {
      "id": "trace-not-receipt",
      "text": "短少去了哪裡，我還沒對平；但它伴著量得出的壓痕，不能直接當成記錯。",
      "correct": true
     },
     {
      "id": "all-in-clay",
      "text": "短少的那一截全都進了黏土；這本帳其實一直守恆。",
      "correct": false,
      "reply": "你量到的是坑深，不是完整去向。別把一把尺說成收據。"
     },
     {
      "id": "pit-irrelevant",
      "text": "坑只是黏土自己的事，跟那筆短少沒有任何可比關係。",
      "correct": false,
      "reply": "三種速度留下的比例正在回答你。不能因為帳還沒對平就把數據丟掉。"
     }
    ],
    "statements": [
     {
      "id": "p1s1",
      "text": "你們那本要自乘的帳，鋼頭那幾次，我認，是平的。",
      "press": "彈開時對得平，我沒有否認。可一撞爛，它就不是那回事。",
      "insight": "院士沒有否認彈性列；爭點在非彈性短少是否代表這把尺記錯。"
     },
     {
      "id": "p1s2",
      "text": "可油灰一撞成團，它就短少一截。撞得越狠，少得越多。",
      "press": "短少的數字就在你自己的帳上。你總不能把它抹掉。",
      "insight": "短少是真的；能反駁的不是數字，而是「短少只能等於記錯」這一步。"
     },
     {
      "id": "p1s3",
      "text": "會憑空少掉東西的帳，記的就不是自然的定律。",
      "press": "一把可靠的尺，怎麼會量著量著少掉一截？",
      "insight": "J3 只證明短少伴隨可量的壓陷尺度；完整去向仍不能假裝已對平。",
      "weakTo": {
       "evidence": "J3"
      }
     }
    ],
    "playerCorrect": "（把黏土盤放上桌）同一顆球，速度加一倍，坑深大約四倍——壓出去的效果，跟著失去的活力走。短少的那截去了哪裡，我還沒對平；可它走的時候留了量得出來的痕跡。會留痕跡的短少，不是帳記錯了。",
    "breakReply": "（盯著那排坑，很久）……坑，是量得出來的。去向你沒對平——可這確實不像記錯帳的樣子。"
   },
   "P3": {
    "title": "第三問：一本帳的兩種寫法",
    "reasonMode": "player",
    "requirePress": true,
    "responsePrompt": "同一批碰撞在兩本帳裡不同進退。這代表什麼？",
    "responses": [
     {
      "id": "different-quantities",
      "text": "同一次碰撞，一本對平、一本短少；換了砝碼，短少比例還變。兩本帳不是同一件事。",
      "correct": true
     },
     {
      "id": "same-formula",
      "text": "兩本帳只是同一件事的兩種算法；差別只在速度有沒有自乘。",
      "correct": false,
      "reply": "同一件事換個寫法，應該同進同退。油灰那兩欄可沒有。"
     },
     {
      "id": "pick-winner",
      "text": "既然兩本帳會吵架，就挑總能對平的那一本留下來。",
      "correct": false,
      "reply": "這正是主人要你重寫的舊問題。另一張紙量到的關係不會因此消失。"
     }
    ],
    "statements": [
     {
      "id": "p3s1",
      "text": "好。你的帳沒漏，我的帳沒錯。",
      "press": "你既替兩本帳都留了位置，就該說清楚它們究竟差在哪裡。",
      "insight": "兩本都能量到真實關係，不等於兩本在量同一件事。"
     },
     {
      "id": "p3s2",
      "text": "那它們記的就是同一個東西——不過一本多自乘了一次。",
      "press": "同一場碰撞、同一批速度與砝碼。不是同一件事，還能是什麼？",
      "insight": "同一份資料可以用兩把尺重算；兩把尺是否同物，要看它們在同一事件裡是否同進同退。"
     },
     {
      "id": "p3s3",
      "text": "同一件事寫兩遍，留一本就夠。",
      "press": "既然只是兩種寫法，何必把爭論再養三十年？",
      "insight": "油灰列一本閉合、一本短少；4／8 追一筆又改變短少比例。兩帳沒有同進同退。",
      "weakTo": {
       "evidence": "J2"
      }
     }
    ],
    "playerCorrect": "同一件事，會在同一次碰撞裡，一本對平、一本短少嗎？（把兩本帳並排壓在桌上，指油灰那幾列）同一次撞擊，這邊對平，這邊短少；換了砝碼再撞，短少的份量還會變。記同一件事的兩本帳，不會這樣吵架。",
    "breakReply": "（看著那一列，手指停在短少的數字上）……不會吵架。可它們吵了。"
   }
  },
  "fr": {
   "kind": "rewrite",
   "requires": [
    "J1",
    "J2",
    "J3"
   ],
   "grant": "J4",
   "open": "（莊園主人敲了敲杯子。）「兩位的帳都攤在桌上了。旅人，你一路都在場——這場架，誰贏？」",
   "explore": {
    "steps": [
     {
      "prompt": "先別急著判。同一次油灰碰撞，兩本帳各記到什麼？",
      "options": [
       {
        "id": "books-split",
        "text": "「動量帳對平；活力帳短少一截。」",
        "correct": true
       },
       {
        "id": "both-close",
        "text": "「兩本都對平。」",
        "correct": false,
        "reply": "（指油灰那列）「再看一次這一列。」"
       },
       {
        "id": "both-short",
        "text": "「兩本都短少。」",
        "correct": false,
        "reply": "（指動量那欄）「這一欄，你自己結算過。」"
       }
      ]
     },
     {
      "prompt": "那短少的那截，追到哪裡了？",
      "options": [
       {
        "id": "ruler-not-receipt",
        "text": "「追到一把尺——壓陷的深淺，跟著速度的平方走。去向還沒對平。」",
        "correct": true
       },
       {
        "id": "vanished",
        "text": "「找不到，它消失了。」",
        "correct": false,
        "reply": "「消失，是句太滿的話。那盤黏土上的坑，怎麼說？」",
        "penalty": {
         "rep": -1,
         "reason": "看見黏土坑仍宣稱短少完全消失，抹去不利的可量痕跡"
        }
       },
       {
        "id": "in-momentum",
        "text": "「找齊了，在動量帳裡。」",
        "correct": false,
        "reply": "「動量帳平得剛剛好，一截都沒多。」",
        "penalty": {
         "rep": -1,
         "reason": "動量帳沒有多出一截，仍宣稱已在其中找到短少的去向"
        }
       }
      ]
     }
    ]
   },
   "assertion": "「『運動之量』這四個字，一直裝著兩本帳。」",
   "claim": {
    "prompt": "主人：「所以呢？這題到底怎麼收？」",
    "options": [
     {
      "id": "momentum-only",
      "text": "「答案是動量那本：它到哪都平；活力會短少，就是它不夠格。」",
      "correct": false,
      "reason": "single-ledger",
      "reply": "（看著黏土盤）「那這些坑，記在哪一本？」",
      "penalty": {
       "persuasion": -1,
       "rep": -1,
       "reason": "把活力帳的短少直接當成無效，抹去黏土坑留下的可量痕跡"
      }
     },
     {
      "id": "vis-viva-only",
      "text": "「答案是活力那本：黏土和回彈，只有它說得清。」",
      "correct": false,
      "reason": "single-ledger",
      "reply": "（指非彈性那列）「短少的那截，你要跟院士怎麼交代？」",
      "penalty": {
       "persuasion": -1,
       "rep": -1,
       "reason": "只保留活力帳，隱去非彈性碰撞尚未對平的短少"
      }
     },
     {
      "id": "same-thing",
      "text": "「這題問錯了——兩本帳記的其實是同一件事，一本多自乘了一次。」",
      "correct": false,
      "reason": "same-thing",
      "reply": "（把兩本帳並排壓下）「同一件事，會在同一次撞擊裡一本平、一本短少嗎？」",
      "penalty": {
       "persuasion": -1
      }
     },
     {
      "id": "different-things",
      "text": "「這題問錯了——兩本帳記的是不同的事，各有各的用處。」",
      "correct": true
     }
    ],
    "honestText": "杜佩院士，你的帳記的是方向上的多少——它到哪都平。夫人這本記的是做事的本錢——彈開時守住，撞爛時從眼前的運動裡短少；短少多少，壓出來的痕跡量得出尺度，去向的全帳，還沒有人對平。（拿起筆，把「運動之量＝？」那行劃掉）題目不該問誰贏。該問：哪本帳，記哪件事。",
    "closeReply": [
     {
      "speaker": "杜佩院士",
      "text": "（沉默很久，拿起自己的帳簿，又放下）「……我記了三十年的帳。今天才知道，我記的是哪一本。」"
     },
     {
      "speaker": "杜夏特萊",
      "text": "（對旅人，聲音放輕）「兩本都留著。往後的人用得上。」"
     }
    ]
   }
  },
  "texts": {
   "wrong": "這一句被駁回了。紙都還在桌上——重新看一次，再答。",
   "suspend": "你先離了席。兩本帳、黏土盤和所有紀錄，都原樣留在桌上。",
   "reenter": "你回到桌邊。帳沒有人動過；剛才吵到哪裡，就從哪裡接下去。",
   "frUnlocked": "三問都過了。主人請你收這場架——重寫這道題目。"
  }
 }
};
 if (typeof module === "object" && module.exports) { module.exports = data; }
 else { root.GB = root.GB || {}; root.GB.DATA = root.GB.DATA || {}; root.GB.DATA.debate5 = data; }
})(typeof self !== "undefined" ? self : this);
