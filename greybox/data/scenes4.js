/* data/scenes4.js — 第四章場景執行載體（file:// 相容）。規範鏡像:scenes4.json。
   ⚠ 本檔為生成物；請改 scenes4.json 後執行 node tools/build-ch4-data.mjs。 */
(function (root) {
 "use strict";
 var data = {
 "chapter": "ch4",
 "title": "月亮的無盡墜落",
 "startScene": "D0-1",
 "narrativeExemptions": [
  {
   "rule": "NAR-09",
   "scene": "D2-2",
   "nodes": [
    "n9",
    "n10",
    "n11"
   ],
   "reason": "三連心聲刻意把十五年計算、後世課本與當下沉默壓成一個連續蒙太奇；拆開會破壞既定節制。"
  },
  {
   "rule": "NAR-03",
   "scene": "D4-2",
   "nodes": [
    "n10",
    "n16"
   ],
   "reason": "牛頓承認二十年前只是暫用假設，哈雷再把來源署名收窄；兩句分別支付證據邊界與署名邊界。"
  }
 ],
 "evidenceNames": {
  "K1": "一直改向的路",
  "K2": "地上與天上的同一把尺",
  "K3": "沒看答案前的兩個週期",
  "K4": "一條規則穿過三種天空",
  "K5": "能算到哪裡，也要停在哪裡"
 },
 "scenes": [
  {
   "id": "D0-1",
   "title": "紙上的問題沒有老",
   "historyTag": "documented+fictional-bridge",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "馬賽筆記末頁。紙角壓著一粒乾掉的鹽。旅人剛寫的字還沒乾：如果放手不會清除原有運動，月亮為什麼沒有沿直線離開？",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "（指腹按在那行字上，墨蹭到指節）石頭離開桅杆，還帶著原來的前進。這件事我們量了兩天，量到維達爾船長都認了。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "（抬頭看白日月亮）那月亮呢？它也在走。誰在旁邊拉著它？",
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "stage",
     "text": "「月亮」兩個字從墨跡底下亮起來。港口的浪聲被拉長、拉薄，最後只剩一條線。",
     "next": "n4a"
    },
    {
     "id": "n4a",
     "type": "line",
     "speaker": "stage",
     "text": "紙頁開始發燙。旅人盯著剛寫下的問句，低聲說：「這次，我至少先把問題寫清楚了。」",
     "next": "n5"
    },
    {
     "id": "n5",
     "type": "line",
     "speaker": "stage",
     "text": "旅人兩手按住紙頁：「等等——我還沒說要走。」紙角仍從指下抬起。",
     "next": "c1"
    },
    {
     "id": "c1",
     "type": "choice",
     "speaker": "system",
     "text": "1642｜馬賽。紙頁正在往下一個年代翻。",
     "options": [
      {
       "id": "turn",
       "text": "翻開落下的那一頁",
       "next": "g1"
      }
     ]
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "D0-2"
    }
   ]
  },
  {
   "id": "D0-2",
   "title": "果園入場考",
   "historyTag": "later-recollection+fictional-bridge",
   "nodes": [
    {
     "id": "a1",
     "type": "line",
     "speaker": "stage",
     "text": "紙縫張開成一片濕草地。旅人跌進去，手掌撐在冰冷的草上；身後已沒有海聲。",
     "next": "a2"
    },
    {
     "id": "a2",
     "type": "line",
     "speaker": "stage",
     "text": "風吹過石牆。遠處有羊。空氣裡是青草和爛蘋果的味道。",
     "next": "a3"
    },
    {
     "id": "a3",
     "type": "line",
     "speaker": "stage",
     "text": "旅人坐在草地上聽了一會，才低聲說：「……不是馬賽。」",
     "next": "a5"
    },
    {
     "id": "a4",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "海聲沒了。這裡連海的味道都沒有。",
     "legacyOnly": true,
     "next": "a5"
    },
    {
     "id": "a5",
     "type": "line",
     "speaker": "stage",
     "text": "枝葉之間掛著一輪白日月亮，半透明，像誰忘了擦掉的一筆。",
     "next": "a6"
    },
    {
     "id": "a6",
     "type": "system",
     "speaker": "system",
     "text": "1665 年，英格蘭・伍爾索普。劍橋因瘟疫停課，一名返鄉的學生正在果園裡。",
     "next": "n1"
    },
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "一顆蘋果掉在旅人腳邊。沒有音效，沒有光。它滾了半圈，停住。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "stage",
     "text": "不遠處的年輕人先蹲下看被砸凹的草，才撿起蘋果；撿完沒有走，只抬頭看那輪白日月亮。",
     "next": "n3a"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "蘋果真的掉了，他先看草上的凹痕，才撿起果子。這個人看東西的順序真怪。",
     "legacyOnly": true,
     "next": "n3a"
    },
    {
     "id": "n3a",
     "type": "line",
     "speaker": "stage",
     "text": "旅人已經走出去半步，才發現自己在走。他停下。",
     "next": "n5"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "冷靜。比薩的第一課還貼在筆記首頁：這個世界，只為證據付費。",
     "legacyOnly": true,
     "next": "n5"
    },
    {
     "id": "n5",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "抱歉，打擾一下。這裡是——",
     "next": "n6"
    },
    {
     "id": "n6",
     "type": "line",
     "speaker": "牛頓",
     "text": "（拍掉蘋果上的草屑）伍爾索普。我家的果園。（這才看旅人一眼）艾薩克・牛頓。你呢？",
     "next": "n7"
    },
    {
     "id": "n7",
     "type": "line",
     "speaker": "stage",
     "text": "旅人沒有立刻回答。他在想：名字要怎麼講。",
     "next": "n8"
    },
    {
     "id": "n8",
     "type": "line",
     "speaker": "牛頓",
     "text": "不講也行。你是從那條路上來的？那邊三天沒有人走了。城裡在死人。",
     "next": "n9"
    },
    {
     "id": "n9",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "我知道。所以我走得慢。",
     "next": "n10"
    },
    {
     "id": "n10",
     "type": "line",
     "speaker": "牛頓",
     "text": "（視線移回月亮）我近來一直在想一件事。讓這顆蘋果掉下來的那股勁——往上能伸多遠？",
     "next": "n11"
    },
    {
     "id": "n11",
     "type": "line",
     "speaker": "牛頓",
     "text": "到樹頂，蘋果照樣落；那股勁沒有在枝頭斷掉。那到雲上呢？到月亮那裡呢？",
     "next": "c0"
    },
    {
     "id": "c0",
     "type": "choice",
     "speaker": "system",
     "text": "牛頓在等你的回答。你怎麼說？",
     "options": [
      {
       "id": "future-answer",
       "text": "先把這張船紙放上桌：它記得離手後仍會前進；同一張紙也能把地球的拉力接到月亮。",
       "next": "n12a"
      },
      {
       "id": "evidence-boundary",
       "text": "先把這張船紙放上桌：它記得離手後仍會前進；月亮那一段，要等另一張紙才能接。",
       "next": "n12d"
      }
     ]
    },
    {
     "id": "n12a",
     "type": "line",
     "speaker": "牛頓",
     "text": "（盯著旅人）你說得像已經量過。哪張紙，能從蘋果一路接到月亮？",
     "next": "n12b"
    },
    {
     "id": "n12b",
     "type": "system",
     "speaker": "system",
     "text": "信譽 −1｜說出了結論，卻拿不出能把蘋果接到月亮的證據。",
     "effects": [
      {
       "rep": -1,
       "reason": "說出了結論，卻拿不出能把蘋果接到月亮的證據"
      }
     ],
     "next": "n13"
    },
    {
     "id": "n12d",
     "type": "system",
     "speaker": "system",
     "text": "信譽 +1｜把做過的船上紀錄，和還沒有證據的月亮問題分開。",
     "effects": [
      {
       "rep": 1,
       "reason": "把做過的船上紀錄，和還沒有證據的月亮問題分開"
      }
     ],
     "next": "n14"
    },
    {
     "id": "n13",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "我沒有能接到月亮的紙。我只做過一件相關的事：放手不會拿走原有的前進。",
     "next": "n14"
    },
    {
     "id": "n14",
     "type": "line",
     "speaker": "牛頓",
     "text": "（把蘋果換到另一隻手）好。先把你做過的那一件講清楚。",
     "next": "n16"
    },
    {
     "id": "n16",
     "type": "line",
     "speaker": "牛頓",
     "text": "（把蘋果拋回掌心，往石屋走了一步，又停住）這幾個月，我聽自己猜得夠多了。你要講的那一件——有紙嗎？",
     "next": "n18"
    },
    {
     "id": "n17",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "他要走了。四百年來我最想見的人之一，見面三句話，他要走了。",
     "legacyOnly": true,
     "next": "n18"
    },
    {
     "id": "n18",
     "type": "line",
     "speaker": "stage",
     "text": "旅人抽出自己重畫的船紙：船、桅杆，以及船上與岸上看見的兩條路。他追上兩步。",
     "next": "n19"
    },
    {
     "id": "n19",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "我不是猜。這張，是做出來的。",
     "next": "n20"
    },
    {
     "id": "n20",
     "type": "line",
     "speaker": "牛頓",
     "text": "（停步，將紙轉向光）誰做的？",
     "next": "n21"
    },
    {
     "id": "n21",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "我在場。每一筆都能講——什麼時候放的手、船當時走多快、量了幾趟。",
     "next": "n22"
    },
    {
     "id": "n22",
     "type": "line",
     "speaker": "牛頓",
     "text": "（指著鬆手的石頭）紙上畫它落在桅腳。憑什麼？它明明已經離了手。",
     "next": "n23"
    },
    {
     "id": "n23",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "這題我們在船上量了兩天。太簡單了吧。",
     "osPurpose": "cross_chapter_memory",
     "next": "c1"
    },
    {
     "id": "c1",
     "type": "choice",
     "speaker": "system",
     "text": "石頭離了手，為什麼仍落在桅腳？",
     "options": [
      {
       "id": "carry",
       "text": "它離手時已跟著船往前；放手沒有拿走那份前進",
       "next": "ok1"
      },
      {
       "id": "catch",
       "text": "船走得快，追上了它",
       "next": "w1"
      },
      {
       "id": "wind",
       "text": "風把它吹回去",
       "next": "w2"
      }
     ]
    },
    {
     "id": "w1",
     "type": "line",
     "speaker": "牛頓",
     "text": "追上的東西會撞上桅杆，不會乖乖躺在腳邊。",
     "next": "c1"
    },
    {
     "id": "w2",
     "type": "line",
     "speaker": "牛頓",
     "text": "（圈住三個落點）風有這麼準？每一趟，都吹回同一隻手掌大的地方？",
     "next": "c1"
    },
    {
     "id": "ok1",
     "type": "line",
     "speaker": "stage",
     "text": "牛頓臉上沒有任何佩服。他把紙照原來的摺痕折好，遞還。",
     "next": "ok3"
    },
    {
     "id": "ok2",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "呼。門票而已。",
     "legacyOnly": true,
     "next": "ok3"
    },
    {
     "id": "ok3",
     "type": "line",
     "speaker": "牛頓",
     "text": "（往石屋走了兩步）把那張紙帶上。進來。",
     "next": "ok4"
    },
    {
     "id": "ok4",
     "type": "line",
     "speaker": "stage",
     "text": "旅人跟上。走到門口，他回頭看了一眼蘋果樹；樹下的草仍凹著。",
     "next": "s1"
    },
    {
     "id": "s1",
     "type": "system",
     "speaker": "system",
     "text": "合作成立。取得工作室出入權。",
     "next": "g1"
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "D1-1"
    }
   ]
  },
  {
   "id": "D1-1",
   "title": "切線預測紙",
   "historyTag": "modern-model+reconstruction",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "石屋工作室。牛頓挪開桌上的紙，鋪上一張新的；很快畫好地球、月亮和月亮剛走過的一小段路。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "牛頓",
     "text": "（把筆遞給旅人，退開半步）先拿掉所有拉扯。地球不拉它，什麼都不拉它。別替它畫完一圈。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "牛頓",
     "text": "只告訴我，它下一步往哪裡。",
     "next": "c1"
    },
    {
     "id": "c1",
     "type": "choice",
     "speaker": "system",
     "text": "若此刻沒有任何東西改變月亮的運動，它下一步往哪裡？",
     "options": [
      {
       "id": "curve",
       "text": "照原來的圓弧繼續走",
       "effects": [
        {
         "labAction": {
          "action": "sealTangentPrediction",
          "args": {
           "choice": "arc"
          }
         }
        }
       ],
       "next": "w1"
      },
      {
       "id": "inward",
       "text": "立刻朝地球落下",
       "effects": [
        {
         "labAction": {
          "action": "sealTangentPrediction",
          "args": {
           "choice": "fall"
          }
         }
        }
       ],
       "next": "w3"
      },
      {
       "id": "tangent",
       "text": "沿著此刻的方向直走",
       "effects": [
        {
         "labAction": {
          "action": "sealTangentPrediction",
          "args": {
           "choice": "tangent"
          }
         }
        }
       ],
       "next": "ok1"
      }
     ]
    },
    {
     "id": "w1",
     "type": "line",
     "speaker": "牛頓",
     "text": "（用指甲截住那段弧）你把要證明的圓，先塞進答案裡了。",
     "next": "w2"
    },
    {
     "id": "w2",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "……我收回「太簡單」那句話。",
     "osPurpose": "naming",
     "next": "c1"
    },
    {
     "id": "w3",
     "type": "line",
     "speaker": "牛頓",
     "text": "（把蘋果放在月亮與地球之間）這是替它多加了一次拉。題目說，什麼都不加。",
     "next": "c1"
    },
    {
     "id": "ok1",
     "type": "line",
     "speaker": "stage",
     "text": "旅人沿選中的方向畫下一條直線，寫下日期，再滴蠟封住紙角。牛頓等蠟凝固，才把紙拿過去。",
     "next": "ok2"
    },
    {
     "id": "ok2",
     "type": "line",
     "speaker": "牛頓",
     "text": "好。沒有拉扯，它就沿這條直線離開。現在要問的是：每一拍加上什麼，才不會讓它走掉？",
     "next": "n4"
    },
    {
     "id": "e1",
     "type": "embed",
     "system": "orbit",
     "phase": "tangent-seal",
     "hint": "親手封存切線預測紙。它是玩家留下的來源紀錄，不列入本章五份證據。",
     "until": {
      "orbit": "source-k0"
     },
     "legacyOnly": true,
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "system",
     "speaker": "system",
     "text": "切線預測紙已封存：沒有任何拉扯時，月亮沿當下方向直走。這張來源紀錄全程留在桌上。",
     "next": "n5"
    },
    {
     "id": "n5",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "所以，沒有任何拉扯時，它不會自己沿著圓弧走。",
     "next": "n6"
    },
    {
     "id": "n6",
     "type": "line",
     "speaker": "牛頓",
     "text": "這張紙只能說到這裡。我想先知道一件更小的事：如果真有那股勁，到月亮那裡，它該剩多少？",
     "next": "g1"
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "D1-2"
    }
   ]
  },
  {
   "id": "D1-2",
   "title": "同一把尺",
   "historyTag": "later-recollection+reconstruction",
   "nodes": [
    {
     "id": "n1",
     "type": "system",
     "speaker": "system",
     "text": "合理重建：牛頓晚年說，自己在瘟疫年曾把拉月亮的勁和地上的重量相比，結果大致相符。沒有存世的 1665 年計算紙能證明他當時正是照本場步驟計算；本場數字是現代教學整理值。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "stage",
     "text": "牛頓把兩張來源不同的紙上下分開掛在牆上。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "system",
     "speaker": "system",
     "text": "上：牛頓的地表估算——自由落下一秒約 4.9 公尺。下：旅人在比薩斜面上的紀錄——等時段距離比為 1、3、5、7，總距離隨時間平方增加。",
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "等一下。這個 4.9，不是我量的。",
     "next": "n5"
    },
    {
     "id": "n5",
     "type": "line",
     "speaker": "牛頓",
     "text": "哦？",
     "next": "n6"
    },
    {
     "id": "n6",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "我們在斜面上量到的是比例——一、三、五、七。垂直落下一秒到底掉多少，那次沒有量。當年有人問我「垂直，你量過嗎」，我只能說沒有。",
     "next": "n7"
    },
    {
     "id": "n7",
     "type": "line",
     "speaker": "牛頓",
     "text": "那你記得比多數人清楚。上面這張是我估的；你帶來的數字另起一張——兩張紙分開放，別混。",
     "next": "n8"
    },
    {
     "id": "n8",
     "type": "system",
     "speaker": "system",
     "text": "旅人那疊斜面紀錄不包含月亮，只提供地表落下的時間平方關係。",
     "next": "c0"
    },
    {
     "id": "c0",
     "type": "choice",
     "speaker": "system",
     "text": "開始對帳前，你可以先追問月距的來源。",
     "options": [
      {
       "id": "ask",
       "text": "先問：月亮有多遠，這個數字誰量的？",
       "next": "q1"
      },
      {
       "id": "start",
       "text": "來源標籤已看懂，開始對帳",
       "next": "e1"
      }
     ]
    },
    {
     "id": "q1",
     "type": "line",
     "speaker": "牛頓",
     "text": "（從架上抽出一本翻舊的書）量月亮，不用等我。",
     "next": "q2"
    },
    {
     "id": "q2",
     "type": "line",
     "speaker": "牛頓",
     "text": "希臘人用月食的影子和兩地同時看月亮的角度差，把它量在六十上下。這本寫 60⅖；托勒密寫 59；溫德林寫 60。這個數字比我老一千八百年。",
     "next": "q3"
    },
    {
     "id": "q3",
     "type": "system",
     "speaker": "system",
     "text": "選讀：兩地同時看月亮，它在星空背景上的位置差接近一度；一度約等於六十分之一弧長，所以距離約是六十條基線，而基線就是地球自己。",
     "next": "e1"
    },
    {
     "id": "e1",
     "type": "embed",
     "system": "orbit",
     "phase": "scale",
     "hint": "先封存月球一秒偏折的量級預測，再把六十秒換成一秒、完成平方換算，最後判讀六十與三千六百的關係；猜錯的蠟封仍保留。",
     "until": {
      "orbit": "k2"
     },
     "next": "n9"
    },
    {
     "id": "n9",
     "type": "line",
     "speaker": "stage",
     "text": "蠟條、換算紙與兩張來源不同的紙一起留在桌上。猜錯的蠟封沒有消失；紙上的數字已完成核對。",
     "next": "n10"
    },
    {
     "id": "n10",
     "type": "line",
     "speaker": "牛頓",
     "text": "把六十秒換成一秒，再按距離平方把地表那個數縮小。現在，兩張紙可以用同一把尺讀了。",
     "next": "n11"
    },
    {
     "id": "n11",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "換成同一秒後，地表估算與月球偏折在量級上接得起來；這支持它們可能服從同一條隨距離平方變弱的規矩。",
     "next": "n12"
    },
    {
     "id": "n12",
     "type": "line",
     "speaker": "stage",
     "text": "牛頓在「支持」兩字下劃線，沒有把它改成「證明」。筆尖停在紙上，墨滲開一個小點。",
     "next": "n13"
    },
    {
     "id": "n13",
     "type": "line",
     "speaker": "牛頓",
     "text": "先記下。我們只量過月亮。天上還有火星、木星和幾十年才回來一次的東西——它們照不照這條規矩，今天一個都沒問過。",
     "next": "n15"
    },
    {
     "id": "n14",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "……他連一句「不錯」都沒有。",
     "legacyOnly": true,
     "next": "n15"
    },
    {
     "id": "n15",
     "type": "line",
     "speaker": "stage",
     "text": "牛頓走到窗邊。外面就是那棵蘋果樹，枝子壓得很低。",
     "next": "n16"
    },
    {
     "id": "n16",
     "type": "line",
     "speaker": "牛頓",
     "text": "蘋果離地三公尺。你憑什麼說它離地球一個地球半徑？",
     "next": "n17"
    },
    {
     "id": "n17",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "因為我們是從地球正中心量到蘋果，也從正中心量到月亮；所以蘋果那頭才算一個地球半徑。",
     "next": "n18"
    },
    {
     "id": "n18",
     "type": "line",
     "speaker": "牛頓",
     "text": "為什麼可以從正中心量？整顆地球都在拉它。腳下的土在拉，對面的海也在拉，遠一點、近一點的，全部都在拉。",
     "next": "n19"
    },
    {
     "id": "n19",
     "type": "line",
     "speaker": "牛頓",
     "text": "憑什麼把這些全部算成擠在地心的一點？",
     "next": "n20"
    },
    {
     "id": "n20",
     "type": "line",
     "speaker": "stage",
     "text": "旅人張開嘴，又閉上。他知道這題有答案，卻不知道證明。屋裡只剩壁爐聲。",
     "next": "n21"
    },
    {
     "id": "n21",
     "type": "line",
     "speaker": "牛頓",
     "text": "（在紙角寫問號）這兩張紙只證明了「若從地心量，數字就對得上」。它們沒有一行能證明為什麼可以從地心量。",
     "next": "n22"
    },
    {
     "id": "n22",
     "type": "line",
     "speaker": "stage",
     "text": "他把兩張紙放進抽屜。抽屜關上的聲音很輕。",
     "next": "n23"
    },
    {
     "id": "n23",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "這一問，課本沒教過我。課本給了我所有答案，沒給過我這個問題。",
     "osPurpose": "future_knowledge",
     "next": "n24"
    },
    {
     "id": "n24",
     "type": "system",
     "speaker": "system",
     "text": "旅人筆記裡多了「同一把尺（角落帶問號）」這一頁。它支持：若作用按距離平方變弱，地表與月球量級相符；它不支持完整定律，也尚未證明為何可從地心量。",
     "next": "n25"
    },
    {
     "id": "n25",
     "type": "line",
     "speaker": "stage",
     "text": "抽屜完全闔上。那個問號在黑暗裡留了下來。",
     "next": "g1"
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "D-INT-1"
    }
   ]
  },
  {
   "id": "D-INT-1",
   "title": "幕間十四年",
   "historyTag": "documented+transition",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "旅人翻頁。紙縫折進十四年。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "system",
     "speaker": "system",
     "text": "1667——瘟疫退了，牛頓回到劍橋；兩年後，二十六歲，接任盧卡斯數學教授。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "stage",
     "text": "紙縫裡看得見那張書桌。旅人伸手，指尖穿過光，什麼也沒有碰到。",
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "system",
     "speaker": "system",
     "text": "1672——他磨的鏡片做成望遠鏡，送進皇家學會；隨後為了光的顏色，跟人爭了很久。",
     "next": "n5"
    },
    {
     "id": "n5",
     "type": "system",
     "speaker": "system",
     "text": "這些年——那個抽屜，沒有再開過。",
     "next": "n6"
    },
    {
     "id": "n6",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "對他們是十四年。對我，又只是一頁。",
     "osPurpose": "time_dislocation",
     "next": "c1"
    },
    {
     "id": "c1",
     "type": "choice",
     "speaker": "system",
     "text": "1665 的紙仍在抽屜裡。下一封信在十四年後。",
     "options": [
      {
       "id": "turn",
       "text": "親手翻到 1679",
       "next": "g1"
      }
     ]
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "D2-1"
    }
   ]
  },
  {
   "id": "D2-1",
   "title": "虎克的第一封信",
   "historyTag": "documented+reconstruction",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "1679 年 11 月 24 日｜劍橋。換了一張整齊得多的桌子：紙分了疊，筆架上有三支筆，鎮紙壓著一封剛拆開的信。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "stage",
     "text": "信上畫著兩支箭。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "虎克・書信（1679-11-24）",
     "text": "若天體一面保留直行，一面持續受中央吸引，兩種傾向合起來便會改變它的路。吸引若隨距離改變，路徑也會跟著改變。",
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "stage",
     "text": "牛頓讀完，沒有立刻放下。他把信轉了個方向，又讀一次。",
     "next": "n5"
    },
    {
     "id": "n5",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "他把兩件事放到同一張紙上了。往前直走，還有一直被拉向中間。",
     "next": "n6"
    },
    {
     "id": "n6",
     "type": "line",
     "speaker": "牛頓",
     "text": "十四年前，我把它們分開想。月亮往外掙，重量把它按住——按得夠不夠，我算過。",
     "next": "n7"
    },
    {
     "id": "n7",
     "type": "line",
     "speaker": "牛頓",
     "text": "他不是這樣看。他說：它一直在往前，同時一直被扳彎。一路都在。",
     "next": "n8"
    },
    {
     "id": "n8",
     "type": "line",
     "speaker": "stage",
     "text": "牛頓拉開那個十四年沒開的抽屜。第一次卡住；第二次，終於開了。",
     "next": "n9"
    },
    {
     "id": "n9",
     "type": "line",
     "speaker": "stage",
     "text": "他取出果園的兩張紙，吹掉灰，和虎克的信並排放好。",
     "next": "n11"
    },
    {
     "id": "n10",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "十四年。那個抽屜今天才第二次打開。",
     "legacyOnly": true,
     "next": "n11"
    },
    {
     "id": "n11",
     "type": "line",
     "speaker": "牛頓",
     "text": "（把三張紙排好）這樣就畫得出來了。",
     "next": "n12"
    },
    {
     "id": "n12",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "畫什麼？",
     "next": "n13"
    },
    {
     "id": "n13",
     "type": "line",
     "speaker": "牛頓",
     "text": "路。先看這個。",
     "next": "n14"
    },
    {
     "id": "n14",
     "type": "line",
     "speaker": "stage",
     "text": "他在木球上繫好細繩，讓球在桌邊轉成一個小圓；繩子繃得筆直。",
     "next": "n15"
    },
    {
     "id": "n15",
     "type": "line",
     "speaker": "牛頓",
     "text": "它為什麼不直著飛走？",
     "next": "n16"
    },
    {
     "id": "n16",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "繩子一直把它拉向你的手。",
     "next": "n17"
    },
    {
     "id": "n17",
     "type": "line",
     "speaker": "牛頓",
     "text": "那我鬆手。",
     "next": "n18"
    },
    {
     "id": "n18",
     "type": "line",
     "speaker": "stage",
     "text": "木球沿切線滾過整張桌子，停在十四年前的切線預測紙旁。兩人都看著它。",
     "next": "n19"
    },
    {
     "id": "n19",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "……它停在那張紙旁邊。",
     "next": "n20"
    },
    {
     "id": "n20",
     "type": "line",
     "speaker": "牛頓",
     "text": "繩子不是月亮的答案。月亮上沒有繩。它只把問題指出來：有東西一直改月亮的路，而且不會斷——這件事，是他寫給我的。",
     "next": "n21"
    },
    {
     "id": "n21",
     "type": "system",
     "speaker": "system",
     "text": "取得參考卡「繩球演示」：它只借了幾何，不能當作引力機制。",
     "next": "n22"
    },
    {
     "id": "n22",
     "type": "line",
     "speaker": "牛頓",
     "text": "我要一條規矩。但在下筆以前，先把走法拆開。",
     "next": "n23"
    },
    {
     "id": "n23",
     "type": "line",
     "speaker": "牛頓",
     "text": "月亮一路連著走，筆卻不能一路連著算。我把它切成一小段、一小段——每一小段，叫一拍。",
     "next": "n24"
    },
    {
     "id": "n24",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "你把一條不停的路，拆成一拍一拍算？",
     "next": "n25"
    },
    {
     "id": "n25",
     "type": "line",
     "speaker": "牛頓",
     "text": "對。一拍之內，它先照原來的方向走；走完，我再把方向朝地球扳一點點。切得越細，畫出的路就越接近真正的路。",
     "next": "n26"
    },
    {
     "id": "n26",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "所以我要給的規矩是：每一拍，往哪扳、扳多少。",
     "next": "n27"
    },
    {
     "id": "n27",
     "type": "line",
     "speaker": "牛頓",
     "text": "還有一件。你得先假定它原本跑多快。",
     "next": "n28"
    },
    {
     "id": "n28",
     "type": "line",
     "speaker": "牛頓",
     "text": "同樣一扳，對慢的來說太重，對快的來說太輕。扳多少，得配上它跑多快。",
     "next": "e1"
    },
    {
     "id": "e1",
     "type": "embed",
     "system": "orbit",
     "phase": "orbit-rule",
     "hint": "先封存方向、初速、箭長與形狀預測，才能落第一拍；前三拍由你親手重對，牛頓再沿同一規則續畫二十七拍。錯墨、蠟封與多組可行配對都保留。",
     "until": {
      "orbit": "k1"
     },
     "next": "n29"
    },
    {
     "id": "n29",
     "type": "line",
     "speaker": "stage",
     "text": "第三十拍落下。封存的規則與形狀預測仍在紙邊；猜錯的蠟條和重畫的淡墨也沒有消失。",
     "next": "n30"
    },
    {
     "id": "n30",
     "type": "line",
     "speaker": "牛頓",
     "text": "（活動手腕）它沒有畫成完美的圓，但也沒有逃走或撞上地球。",
     "next": "n31"
    },
    {
     "id": "n31",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "在這組速度與向心偏折下，三十拍都留在同一條窄帶裡。",
     "next": "n32"
    },
    {
     "id": "n32",
     "type": "line",
     "speaker": "牛頓",
     "text": "這一句可以留下，但別把紙帶當成天空本身。我們一次畫一拍；步子切得越細，帶子會越窄，真正的月亮卻一直在走。",
     "next": "n33"
    },
    {
     "id": "n33",
     "type": "line",
     "speaker": "stage",
     "text": "牛頓把錯規則的紙逐張攤開：內捲、外張、固定方向的拋物線、繞錯墨點的彎路，以及什麼都不改時的切線直路。",
     "next": "n34"
    },
    {
     "id": "n34",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "（指固定方向那張）這條線我認得。帕多瓦，桌緣彈射，一模一樣。",
     "next": "n35"
    },
    {
     "id": "n35",
     "type": "line",
     "speaker": "stage",
     "text": "牛頓看著滿桌的路，很久沒有動。然後他開口，語速比平常慢。",
     "next": "n36"
    },
    {
     "id": "n36",
     "type": "line",
     "speaker": "牛頓",
     "text": "想像一件事：最高的山頂上，架一門砲。",
     "next": "n37"
    },
    {
     "id": "n37",
     "type": "line",
     "speaker": "牛頓",
     "text": "打得慢，砲彈砸在山腳；快些，砸得更遠；再快些，落點一路往前跑，追著地平線。",
     "next": "n38"
    },
    {
     "id": "n38",
     "type": "line",
     "speaker": "牛頓",
     "text": "快到某個份上——它還是一直在落，可地面一直在腳下彎走。它落了一整圈，誰也沒有接住它。",
     "next": "n39"
    },
    {
     "id": "n39",
     "type": "line",
     "speaker": "牛頓",
     "text": "月亮，就是打得夠快的那顆砲彈。",
     "next": "n41"
    },
    {
     "id": "n40",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "我看著他把眼前的草圖，推向課本裡那張熟悉的圖。",
     "legacyOnly": true,
     "next": "n41"
    },
    {
     "id": "n41",
     "type": "system",
     "speaker": "system",
     "text": "旅人筆記裡多了「一直改向的路」這一頁。月亮保留原來的前進，每一拍又朝當下地球偏一點；偏多少必須與原來的速度相配。",
     "next": "n42"
    },
    {
     "id": "n42",
     "type": "line",
     "speaker": "牛頓",
     "text": "這條路是照他信上的兩支箭畫出來的。（把虎克的信放在圖旁）畫得出來，不等於證得出來。",
     "next": "n43"
    },
    {
     "id": "n43",
     "type": "system",
     "speaker": "system",
     "text": "取得參考卡「方向卡」。山頂大砲圖卡已放到桌邊；圖上的三條路可與作圖紙逐一對照。",
     "next": "g1"
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "D2-2"
    }
   ]
  },
  {
   "id": "D2-2",
   "title": "虎克的第二封信",
   "historyTag": "documented+reconstruction",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "1680 年 1 月 6 日。六個星期後，又一封信。牛頓讀得很快，讀完就放下。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "虎克・書信（1680-01-06）",
     "text": "我認為，那股朝中心的吸引，應與距離的平方成反比。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "stage",
     "text": "旅人看見那行字，再看牛頓。牛頓正在削筆；削好，試過筆尖，便開始寫別的東西。",
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "他寫了……平方反比。",
     "next": "n5"
    },
    {
     "id": "n5",
     "type": "line",
     "speaker": "牛頓",
     "text": "嗯。",
     "next": "n6"
    },
    {
     "id": "n6",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "你抽屜裡那兩張紙——",
     "next": "n7"
    },
    {
     "id": "n7",
     "type": "line",
     "speaker": "牛頓",
     "text": "在抽屜裡。（沒有抬頭）",
     "next": "n8"
    },
    {
     "id": "n8",
     "type": "line",
     "speaker": "stage",
     "text": "旅人看了他很久。牛頓沒有再說一個字。窗外的雪落在石牆上。",
     "next": "n11"
    },
    {
     "id": "n9",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "十五年前他就算過。現在有人寫信告訴他這件事，他一個字都沒回。",
     "legacyOnly": true,
     "next": "n10"
    },
    {
     "id": "n10",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "我知道這件事以後會變成什麼。課本上只寫一行：兩人為此爭執多年。",
     "legacyOnly": true,
     "next": "n11"
    },
    {
     "id": "n11",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "課本只留一行。眼前這場沉默，就佔了那一行。",
     "osPurpose": "future_knowledge",
     "next": "n12"
    },
    {
     "id": "n12",
     "type": "system",
     "speaker": "system",
     "text": "本場不取得證據。虎克 1679-11-24 提出切向直進與中央吸引的合成，1680-01-06 提出平方反比猜想；牛頓完成軌道證明、球體處理與跨天體整合。這一頁只記兩封信各自留下的主張，不列為新證據。",
     "next": "g1"
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "D3-1"
    }
   ]
  },
  {
   "id": "D3-1",
   "title": "哈雷帶著木匣進來",
   "historyTag": "documented+reconstruction",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "1684｜劍橋。桌上的紙又多了四年份。旅人正在按年份疊紙，牛頓抬頭，第一次仔細看他的臉。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "牛頓",
     "text": "十九年前，你也在。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "是。",
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "牛頓",
     "text": "你沒有老。",
     "next": "n5"
    },
    {
     "id": "n5",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "這件事很難解釋。",
     "next": "n6"
    },
    {
     "id": "n6",
     "type": "line",
     "speaker": "牛頓",
     "text": "（看了三秒，低頭回到紙上）那就先不解釋。",
     "next": "n7"
    },
    {
     "id": "n7",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "他把「你沒有老」跟沒算完的題目放在同一疊裡了。這人真的很會擱置。",
     "osPurpose": "naming",
     "next": "n8"
    },
    {
     "id": "n8",
     "type": "line",
     "speaker": "stage",
     "text": "門被人用拳頭側面砸響。",
     "next": "n9"
    },
    {
     "id": "n9",
     "type": "line",
     "speaker": "牛頓",
     "text": "（沒有抬頭）不見客。",
     "next": "n10"
    },
    {
     "id": "n10",
     "type": "line",
     "speaker": "stage",
     "text": "門還是開了。一個年輕人抱著木匣站在門口，雨水沿外套下擺一路滴進屋裡。",
     "next": "n12"
    },
    {
     "id": "n11",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "誰啊？這種天氣、這種砸門法——不是討債的，就是有話非講不可的人。",
     "legacyOnly": true,
     "next": "n12"
    },
    {
     "id": "n12",
     "type": "line",
     "speaker": "哈雷",
     "text": "（不脫外套，走到桌前）愛德蒙・哈雷。皇家學會的。",
     "next": "n14"
    },
    {
     "id": "n13",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "哈雷。等一下——那顆七十六年回來一次的彗星，以後會跟他姓。他現在還不知道。",
     "legacyOnly": true,
     "next": "n14"
    },
    {
     "id": "n14",
     "type": "line",
     "speaker": "哈雷",
     "text": "虎克、雷恩和我在咖啡館爭了一桌。若朝太陽的拉力按距離平方變弱，行星會走什麼路？",
     "next": "n15"
    },
    {
     "id": "n15",
     "type": "line",
     "speaker": "牛頓",
     "text": "橢圓。",
     "next": "n16"
    },
    {
     "id": "n16",
     "type": "line",
     "speaker": "stage",
     "text": "哈雷停住，看著牛頓，像在確認他是不是隨口說的。",
     "next": "n17"
    },
    {
     "id": "n17",
     "type": "line",
     "speaker": "哈雷",
     "text": "……你連想都沒想。",
     "next": "n18"
    },
    {
     "id": "n18",
     "type": "line",
     "speaker": "牛頓",
     "text": "我算過。",
     "next": "n19"
    },
    {
     "id": "n19",
     "type": "line",
     "speaker": "哈雷",
     "text": "那給我看。",
     "next": "n20"
    },
    {
     "id": "n20",
     "type": "line",
     "speaker": "stage",
     "text": "牛頓翻了很久的抽屜。紙上密密麻麻，可是他要找的那幾張不在裡面。",
     "next": "n21"
    },
    {
     "id": "n21",
     "type": "line",
     "speaker": "牛頓",
     "text": "找不到。我可以重算。",
     "next": "n22"
    },
    {
     "id": "n22",
     "type": "line",
     "speaker": "哈雷",
     "text": "重算。雷恩押了一本值四十先令的書，限我們兩個月拿出證明。期限早過了，紙還是空的。",
     "next": "n23"
    },
    {
     "id": "n23",
     "type": "line",
     "speaker": "哈雷",
     "text": "現在你告訴我：你算過、紙不見了、可以重算。",
     "next": "n25"
    },
    {
     "id": "n24",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "他不是不信牛頓。他是被兩個月的空話餵飽了。",
     "legacyOnly": true,
     "next": "n25"
    },
    {
     "id": "n25",
     "type": "line",
     "speaker": "哈雷",
     "text": "（打開木匣）這是佛蘭斯蒂德那邊抄來的觀測。我沒拆過。",
     "next": "n26"
    },
    {
     "id": "n26",
     "type": "line",
     "speaker": "牛頓",
     "text": "給我。",
     "next": "n27"
    },
    {
     "id": "n27",
     "type": "line",
     "speaker": "哈雷",
     "text": "（蓋回木匣，手壓在上面）不。",
     "next": "n28"
    },
    {
     "id": "n28",
     "type": "line",
     "speaker": "stage",
     "text": "哈雷掏出封蠟，推到旅人面前，不是牛頓面前。",
     "next": "n29"
    },
    {
     "id": "n29",
     "type": "line",
     "speaker": "哈雷",
     "text": "你們先寫下預測，滴上蠟。我再開包。",
     "next": "n30"
    },
    {
     "id": "n30",
     "type": "line",
     "speaker": "牛頓",
     "text": "你信不過我？",
     "next": "n31"
    },
    {
     "id": "n31",
     "type": "line",
     "speaker": "哈雷",
     "text": "我信不過任何人的記性，包括我自己的。看過答案以後，人都會覺得自己早就知道。",
     "next": "n33"
    },
    {
     "id": "n32",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "這句話，我在船上聽過一模一樣的版本。四十四年前，一個船長說的。",
     "legacyOnly": true,
     "next": "n33"
    },
    {
     "id": "n33",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "這規矩我熟。我在別的地方見過有人這樣做。他要防的不是誰撒謊，是事情過幾天就被記成另一個樣子。",
     "next": "n34"
    },
    {
     "id": "n34",
     "type": "line",
     "speaker": "哈雷",
     "text": "你在哪見過？",
     "next": "n35"
    },
    {
     "id": "n35",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "馬賽。一個船長。",
     "next": "n36"
    },
    {
     "id": "n36",
     "type": "line",
     "speaker": "哈雷",
     "text": "（短促地笑了一聲）船長。好。那你來封。",
     "next": "e1"
    },
    {
     "id": "e1",
     "type": "embed",
     "system": "orbit",
     "phase": "planets",
     "hint": "先想清楚再滴蠟，分別封住火星與木星的週期；只有封存後，哈雷才拆開資料。刻痕帶、兩條看似可行的錯路與錯誤斷言都留在帳上。",
     "until": {
      "orbit": "k3"
     },
     "next": "n37"
    },
    {
     "id": "n37",
     "type": "line",
     "speaker": "stage",
     "text": "兩個封口、拆包後的觀測與十年刻痕帶都留在牆上；被攔下的逃避承諾和事後改數，也各自留帳。",
     "next": "n38"
    },
    {
     "id": "n38",
     "type": "line",
     "speaker": "哈雷",
     "text": "（小心拿起牛頓的計算紙）封口早於觀測，火星與木星都對上了。這兩筆比你的保證有用；但兩筆還不能替整片天空作保。",
     "next": "n39"
    },
    {
     "id": "n39",
     "type": "line",
     "speaker": "牛頓",
     "text": "還不夠成書。",
     "next": "n40"
    },
    {
     "id": "n40",
     "type": "line",
     "speaker": "哈雷",
     "text": "夠讓我來追這本書。九頁可以先回答橢圓；整本書還得回答：同一條規矩，敢不敢碰整片天空。",
     "next": "n41"
    },
    {
     "id": "n41",
     "type": "system",
     "speaker": "system",
     "text": "旅人筆記裡多了「沒看答案前的兩個週期」這一頁。木匣、封包、滴蠟與刻痕帶仍留在桌上。",
     "next": "g1"
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "D4-1"
    }
   ]
  },
  {
   "id": "D4-1",
   "title": "對帳桌",
   "historyTag": "documented+modern-model+reconstruction",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "1685–1686｜劍橋。哈雷帶來三份東西，還帶了自己的椅子。他把椅子放在桌子另一頭，像要待很久。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "哈雷",
     "text": "在我們吵下去以前，先讓他知道對面在講什麼。你知道現在讀書人怎麼想天上的事嗎？",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "我大概知道他們怎麼說。",
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "哈雷",
     "text": "待會過帳，你要替兩邊都算。你先講講對面那一套——講得不對，我現在補；等蓋章時才發現你不懂，就晚了。",
     "next": "n5"
    },
    {
     "id": "n5",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "他們說天上不是空的，裡頭塞滿看不見的流。太陽在中間攪出大漩渦，行星就被流帶著轉。",
     "next": "n6"
    },
    {
     "id": "n6",
     "type": "line",
     "speaker": "哈雷",
     "text": "像什麼？",
     "next": "n7"
    },
    {
     "id": "n7",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "像攪一杯茶。水轉，茶葉就跟著轉——不是茶葉自己想轉。",
     "next": "n8"
    },
    {
     "id": "n8",
     "type": "line",
     "speaker": "哈雷",
     "text": "太陽是湯匙，行星是茶葉。他講得比劍橋一半的人清楚。",
     "next": "n9"
    },
    {
     "id": "n9",
     "type": "system",
     "speaker": "system",
     "text": "攪茶圖卡：一杯茶、一支湯匙，以及被流帶著轉的茶葉。",
     "next": "n10"
    },
    {
     "id": "n10",
     "type": "line",
     "speaker": "牛頓",
     "text": "而且它解釋得掉一件事——行星為什麼全往同一方向繞。這一點，我的說法反而不佔便宜。",
     "next": "n11"
    },
    {
     "id": "n11",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "老實說，要不是知道結局，我也覺得攪茶這套比較好懂。而且茶比較好喝。",
     "osPurpose": "future_knowledge",
     "next": "n12"
    },
    {
     "id": "n12",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "那你的說法呢？",
     "next": "n13"
    },
    {
     "id": "n13",
     "type": "line",
     "speaker": "牛頓",
     "text": "沒有流。",
     "next": "n14"
    },
    {
     "id": "n14",
     "type": "line",
     "speaker": "stage",
     "text": "牛頓放下一塊磁石和一根鐵針。針隔著一段桌面動了一下，貼了過去。",
     "next": "n15"
    },
    {
     "id": "n15",
     "type": "line",
     "speaker": "牛頓",
     "text": "像這個：不碰它，也拉它；離得越遠，拉得越弱。只借這兩件事。別的不借——磁石只吸鐵，這股勁什麼都拉。",
     "next": "n16"
    },
    {
     "id": "n16",
     "type": "system",
     "speaker": "system",
     "text": "磁石圖卡只標示「隔空」與「越遠越弱」，不得把磁力當作引力機制。",
     "next": "n17"
    },
    {
     "id": "n17",
     "type": "line",
     "speaker": "哈雷",
     "text": "兩邊都講得出道理。道理不算數。",
     "next": "n18"
    },
    {
     "id": "n18",
     "type": "line",
     "speaker": "哈雷",
     "text": "漩渦的說法不只一種。今天上桌的，只有一個把規則寫死、能一格一格算的簡化版本。它輸了，不代表所有漩渦都輸。",
     "next": "n20"
    },
    {
     "id": "n19",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "這句話我要記住。他是在保護對手，還是在保護這桌帳？兩個都是吧。",
     "legacyOnly": true,
     "next": "n20"
    },
    {
     "id": "n20",
     "type": "system",
     "speaker": "system",
     "text": "三份觀測封面：月亮、火星與木星、彗星。每一份都把可核對的距離、週期、日期與星位寫在紙邊。",
     "next": "n21"
    },
    {
     "id": "n21",
     "type": "line",
     "speaker": "哈雷",
     "text": "三份都要過帳。拉力帳的平方規矩不准動；漩渦帳的流速表也不准動。中途改任何一條，整桌帳作廢。",
     "next": "n22"
    },
    {
     "id": "n22",
     "type": "line",
     "speaker": "stage",
     "text": "他取出三顆木章，一顆一顆擺到旅人面前。",
     "next": "n23"
    },
    {
     "id": "n23",
     "type": "line",
     "speaker": "哈雷",
     "text": "每一格，先看依據，再蓋章。章有三種：對上了——有數字，而且相合；講得通——只有說法，沒有數字可核；對不上——有數字，但不合。",
     "next": "n24"
    },
    {
     "id": "n24",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "為什麼是我蓋？",
     "next": "n25"
    },
    {
     "id": "n25",
     "type": "line",
     "speaker": "哈雷",
     "text": "牛頓不能蓋——規矩是他的。我不能蓋——書是我要印的。你既不是規矩的作者，也不是出錢印書的人；這桌帳裡，只有你沒有輸贏。",
     "next": "n26"
    },
    {
     "id": "n26",
     "type": "line",
     "speaker": "哈雷",
     "text": "帳房裡最值錢的，是那筆本來可以藏、最後仍照樣留下的數。",
     "next": "n28"
    },
    {
     "id": "n27",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "四章下來，我第一次因為「什麼都不要」拿到東西。",
     "legacyOnly": true,
     "next": "n28"
    },
    {
     "id": "n28",
     "type": "system",
     "speaker": "system",
     "text": "蓋錯不罰；桌上的數字會把蓋錯的章頂回來。三份資料先過哪一份，你決定。借條只有你自己貼得上——你拒絕過的，不會有人替你補。",
     "next": "e1"
    },
    {
     "id": "e1",
     "type": "embed",
     "system": "orbit",
     "phase": "models",
     "hint": "自行決定三份資料的過帳順序，逐格讀依據、蓋章、決定是否留下不可撕的借條，親手併接彗星並依實際帳面選封條。印刷短稿或延後也會留痕。",
     "until": {
      "orbit": "k4"
     },
     "next": "n29"
    },
    {
     "id": "n29",
     "type": "line",
     "speaker": "stage",
     "text": "三份資料都已過帳。哈雷只把真的貼出來的借條，連同紀錄、虎克書信和封存預測收進木匣；你拒絕過的那幾張，木匣裡沒有。",
     "next": "n30"
    },
    {
     "id": "n30",
     "type": "line",
     "speaker": "哈雷",
     "text": "這張紙只比較今天鎖死的兩本帳：哪一本用同一條規矩過三份資料，哪一本必須另貼借條。別把它寫成『所有漩渦都錯』。（扣上鎖）現在去處理最難算的部分。",
     "next": "n31"
    },
    {
     "id": "n31",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "還有比彗星難算的？",
     "next": "n32"
    },
    {
     "id": "n32",
     "type": "line",
     "speaker": "哈雷",
     "text": "人名。",
     "next": "g1"
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "D4-2"
    }
   ]
  },
  {
   "id": "D4-2",
   "title": "印刷台",
   "historyTag": "documented+reconstruction",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "1686–1687｜倫敦。印刷所比想像的吵；鉛字撞在字盤裡，像下雨。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "印刷工",
     "text": "這個月，只剩兩個能開印的空檔。稿子一旦進了版框，再改就得整頁重排——花掉的不只一張紙。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "哈雷",
     "text": "會裡能拿來印書的錢，先被那本魚書卡住了。紙張和費用，我去處理。",
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "牛頓",
     "text": "那就先排證明。",
     "next": "n5"
    },
    {
     "id": "n5",
     "type": "line",
     "speaker": "stage",
     "text": "版框中央留著六處空位。最後一處仍寫著二十年前留下的問題：「憑什麼從地心量？」同尺紙不能替代證明。",
     "next": "n6"
    },
    {
     "id": "n6",
     "type": "line",
     "speaker": "stage",
     "text": "牛頓抱來一疊邊緣磨毛的新紙，放在版框旁。",
     "next": "n7"
    },
    {
     "id": "n7",
     "type": "line",
     "speaker": "牛頓",
     "text": "一個均勻球殼，對殼外物體的拉力，等效於把整個球殼的物質集中在球心。",
     "next": "n8"
    },
    {
     "id": "n8",
     "type": "line",
     "speaker": "牛頓",
     "text": "把整顆球拆成一層一層的同心球殼，這個結果就能一層層相加。",
     "next": "n9"
    },
    {
     "id": "n9",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "所以從地心量，是可以的。",
     "next": "n10"
    },
    {
     "id": "n10",
     "type": "line",
     "speaker": "牛頓",
     "text": "現在是。二十年前不是——二十年前我只是假設它可以。",
     "next": "n12"
    },
    {
     "id": "n11",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "那個問號，他補了二十年。",
     "legacyOnly": true,
     "next": "n12"
    },
    {
     "id": "n12",
     "type": "system",
     "speaker": "system",
     "text": "史實邊界：《原理》第一卷命題 LXX、LXXI 與 LXXIV 分別處理球殼內部、殼外等效球心與完整均勻球的疊合；「1686 交到印刷台」是排版演出，不是首次形成日期。本章印刷工為呈現當時排字與出版現場所作的合成人物。",
     "next": "n13"
    },
    {
     "id": "n13",
     "type": "line",
     "speaker": "stage",
     "text": "虎克的兩封信放在版框旁。牛頓把自己的計算放在中央，手肘仍壓著信紙一角。",
     "next": "n14"
    },
    {
     "id": "n14",
     "type": "line",
     "speaker": "哈雷",
     "text": "先把手拿開。這兩封信不能替你證明三百頁；那三百頁也不能讓兩封信不存在。",
     "next": "n15"
    },
    {
     "id": "n15",
     "type": "line",
     "speaker": "牛頓",
     "text": "他會說整本都是他的。",
     "next": "n16"
    },
    {
     "id": "n16",
     "type": "line",
     "speaker": "哈雷",
     "text": "所以寫清楚，不是寫大方。接好證明，再寫一句他做過、也只寫到他做過的事。",
     "next": "e1"
    },
    {
     "id": "e1",
     "type": "embed",
     "system": "orbit",
     "phase": "proof",
     "hint": "接好六槽證明鏈，放入球殼頁，保持預測早於觀測；精確寫下虎克的兩項貢獻，並把來源接回哈雷、佛蘭斯蒂德與牛頓。最後由你移走旅人的作者名條，留下尚未解明的機制，再壓下印刷機。",
     "until": {
      "orbit": "k5"
     },
     "next": "n17"
    },
    {
     "id": "n17",
     "type": "line",
     "speaker": "stage",
     "text": "校樣從壓板下出來：第六槽印著球殼頁；來源各自接回名字；作者欄沒有旅人的名條；「拉力如何穿過空間」仍保留誠實空白。錯稿與延後紙全釘在牆上。",
     "next": "n18"
    },
    {
     "id": "n18",
     "type": "line",
     "speaker": "哈雷",
     "text": "六段都接上了。名字沒有蓋住來源，空白也沒有硬填。可以送了。",
     "next": "n19"
    },
    {
     "id": "n19",
     "type": "line",
     "speaker": "牛頓",
     "text": "那就讓別人來找它錯在哪裡。",
     "next": "n20"
    },
    {
     "id": "n20",
     "type": "system",
     "speaker": "system",
     "text": "旅人筆記裡多了「能算到哪裡，也要停在哪裡」這一頁。第四章《月亮的無盡墜落》。",
     "next": "n21"
    },
    {
     "id": "n21",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "它沒有停止下落。只是每一次落下，都趕上了一個彎走的世界。",
     "osPurpose": "naming",
     "next": "g1"
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "DE-1"
    }
   ]
  },
  {
   "id": "DE-1",
   "title": "墨還沒有乾",
   "historyTag": "documented+reconstruction",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "1687｜倫敦。印刷工把仍帶著溫度的書頁攤開。哈雷先摸紙邊是否乾透；牛頓直接翻到計算頁，沒有看封面。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "哈雷",
     "text": "終於不在抽屜裡了。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "牛頓",
     "text": "所以麻煩現在才開始。",
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "哈雷",
     "text": "你怕別人反駁？",
     "next": "n5"
    },
    {
     "id": "n5",
     "type": "line",
     "speaker": "牛頓",
     "text": "我怕他們只讀序言。",
     "next": "n6"
    },
    {
     "id": "n6",
     "type": "line",
     "speaker": "哈雷",
     "text": "那至少，我們把路印在裡面了。",
     "next": "n7"
    },
    {
     "id": "n7",
     "type": "line",
     "speaker": "stage",
     "text": "哈雷把虎克書信、佛蘭斯蒂德觀測和自己的編務紀錄，一份一份夾進來源袋；沒有把眾人湊成和解合照。",
     "next": "n8"
    },
    {
     "id": "n8",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "這本書會被記成誰的？",
     "next": "n9"
    },
    {
     "id": "n9",
     "type": "line",
     "speaker": "哈雷",
     "text": "封面會回答一種問題。你剛才接回去的那些紙，回答另一種。",
     "next": "n10"
    },
    {
     "id": "n10",
     "type": "line",
     "speaker": "牛頓",
     "text": "只要別把兩種答案混在一起。",
     "next": "n11"
    },
    {
     "id": "n11",
     "type": "line",
     "speaker": "stage",
     "text": "牛頓把書合上。封面是他一個人的名字；來源袋仍清清楚楚攤在旁邊。",
     "next": "n12"
    },
    {
     "id": "n12",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "一本書可以有一個作者。讓它出現的歷史，從來不只一雙手。",
     "osPurpose": "naming",
     "next": "c1"
    },
    {
     "id": "c1",
     "type": "choice",
     "speaker": "system",
     "text": "這五張證據要怎麼放回旅人筆記？",
     "options": [
      {
       "id": "proof_only",
       "text": "五張照原順序收好；最後校樣夾進筆記，來源、退件與未決欄留在木匣。",
       "next": "w1"
      },
      {
       "id": "summary_only",
       "text": "五張照原順序收好；每張只抄結論，來源、退件與未決欄留在木匣。",
       "next": "w2"
      },
      {
       "id": "with_boundaries",
       "text": "五張照原順序收好；各自連著來源、退件與未決欄，一起夾回筆記。",
       "effects": [
        {
         "labAction": {
          "action": "archiveEvidenceSet",
          "args": {}
         }
        }
       ],
       "next": "ok1"
      }
     ]
    },
    {
     "id": "w1",
     "type": "line",
     "speaker": "牛頓",
     "text": "只留答對的最後一頁，別人就看不出我們排除了什麼，也看不出哪一步曾經失敗。",
     "next": "c1"
    },
    {
     "id": "w2",
     "type": "line",
     "speaker": "哈雷",
     "text": "結論和來源一分開，過幾年就只剩一句漂亮話。要讓每句話找得到它付過的紙。",
     "next": "c1"
    },
    {
     "id": "ok1",
     "type": "line",
     "speaker": "stage",
     "text": "旅人依次夾回五張證據；每張後面都跟著來源、退件與不能證明的部分。切線預測另標作來源紀錄，不冒充第六張證據。",
     "next": "g1"
    },
    {
     "id": "e1",
     "type": "embed",
     "system": "orbit",
     "phase": "archive",
     "hint": "把本章五份證據逐一夾回旅人筆記。切線預測紙是來源紀錄，不列入五證據；每張證據可翻看成功、失敗與不能證明的部分。",
     "until": {
      "orbit": "archive-complete"
     },
     "legacyOnly": true,
     "next": "g1"
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "DE-2"
    }
   ]
  },
  {
   "id": "DE-2",
   "title": "下一本帳",
   "historyTag": "modern-model",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "印刷工收著鉛字，把字盒一格一格推回架上。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "stage",
     "text": "兩個字盒在桌邊撞了一下：一個當場停住，另一個彈得很遠，滾到牆邊。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "印刷工",
     "text": "這兩個盒子一樣重。",
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "（蹲下來看）一樣重，撞完卻差這麼多。",
     "next": "n5"
    },
    {
     "id": "n5",
     "type": "line",
     "speaker": "stage",
     "text": "桌上有兩張帳：一張記撞完往哪裡走、走多快；另一張記哪一盒撞凹木頭、凹多深。",
     "next": "n6"
    },
    {
     "id": "n6",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "剛才那一下，究竟是哪一本帳前後對得上？",
     "next": "n7"
    },
    {
     "id": "n7",
     "type": "line",
     "speaker": "印刷工",
     "text": "我只管把鉛字撿回盒裡；哪一本帳對，你們自己算。",
     "next": "n8"
    },
    {
     "id": "n8",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "……別又來。上一題我跟了二十二年，墨都還沒乾。好，撿。",
     "osPurpose": "time_dislocation",
     "next": "n9"
    },
    {
     "id": "n9",
     "type": "line",
     "speaker": "stage",
     "text": "牛頓走到門口，回頭看了兩個字盒一眼。他沒有替下一章回答。",
     "next": "r1"
    },
    {
     "id": "r1",
     "type": "review",
     "prompts": [
      "月亮一直朝著地球掉，為什麼還是沒有掉到地上？",
      "這條規矩算對了整片天空，最後卻停在一格空白前面。那格是什麼？為什麼不能硬把它填上？"
     ],
     "next": "c1"
    },
    {
     "id": "c1",
     "type": "choice",
     "speaker": "system",
     "text": "旅人筆記翻到空白頁。",
     "options": [
      {
       "id": "write",
       "text": "寫下碰撞後的下一個問題",
       "next": "n10"
      }
     ]
    },
    {
     "id": "n10",
     "type": "line",
     "speaker": "stage",
     "text": "旅人親手寫下：碰撞之後，該記住帶方向的運動總量，還是物體能把重物抬多高、把材料壓多深的能力？",
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
     "text": "第四章已封存。旅人筆記新增未解問題：「碰撞後，究竟什麼應該守住？」",
     "next": "end"
    },
    {
     "id": "end",
     "type": "end"
    }
   ]
  },
  {
   "id": "SC4-R1",
   "title": "修復：把來源接回去",
   "historyTag": "dramatic-reconstruction",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "（信譽歸零。哈雷把來源袋壓在校樣上；作者欄、虎克書信和機制空白都仍留在桌面。）",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "哈雷",
     "text": "算錯可以重算。把沒量到的寫成已證，或把別人的紙擦掉，才會讓整本書失去可查的路。你要撤回哪一部分？",
     "next": "c1"
    },
    {
     "id": "c1",
     "type": "choice",
     "text": "哪一種改法真的把來源與證據邊界接回去？",
     "options": [
      {
       "id": "withdraw",
       "text": "「把超過來源的署名與機制結論劃掉；其餘照原紙留下。」",
       "effects": [
        {
         "rep": 1,
         "reason": "主動撤回越過來源的署名與機制結論，恢復可查的邊界"
        },
        {
         "flagClear": "repLocked"
        }
       ],
       "next": "n3"
      },
      {
       "id": "erase-source",
       "text": "「我只保留能證明的最後一頁；虎克的信先不列，免得混淆。」",
       "next": "w1"
      },
      {
       "id": "fill-mechanism",
       "text": "「機制欄不能留白；先寫成已證明，等找到來源再補。」",
       "next": "w2"
      }
     ]
    },
    {
     "id": "w1",
     "type": "line",
     "speaker": "哈雷",
     "text": "那不是撤回，是再擦掉一次來源。信沒有完成證明，但它留下的問題方向不能消失。",
     "next": "c1"
    },
    {
     "id": "w2",
     "type": "line",
     "speaker": "牛頓",
     "text": "空白正是這批紙沒有回答的地方。先填滿它，只會把未知印成事實。",
     "next": "c1"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "牛頓",
     "text": "那就把線一條一條接回去。空白也留著。",
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
 else { root.GB = root.GB || {}; root.GB.DATA = root.GB.DATA || {}; root.GB.DATA.scenes4 = data; }
})(typeof self !== "undefined" ? self : this);
