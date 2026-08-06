/* data/scenes4.js — 第四章場景執行載體（file:// 相容）。規範鏡像:scenes4.json。
   ⚠ 本檔為生成物；請改 scenes4.json 後執行 node tools/build-ch4-data.mjs。 */
(function (root) {
 "use strict";
 var data = {
 "chapter": "ch4",
 "title": "月亮的無盡墜落",
 "startScene": "D0-1",
 "conclusionLint": {
  "note": "第四章先讓玩家用紙上推演取得關係；後世曲線名與完成理論名不得提前代答，虎克的平方反比只作有來源的歷史猜想。",
  "rules": [
   {
    "term": "拋物線",
    "kind": "forbid"
   },
   {
    "term": "萬有引力",
    "kind": "forbid"
   },
   {
    "term": "平方反比",
    "kind": "allow-only",
    "paths": [
     "D2-2/n4",
     "D2-2/n12"
    ]
   }
  ]
 },
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
     "text": "到樹頂，蘋果照樣落。那股勁沒有在枝頭斷掉。那到雲上呢？到月亮那裡呢？",
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
       "text": "我有一張船上的紀錄。東西鬆手後，原來的前進還在。我想用同一張紙，把這個道理接到月亮。",
       "next": "n12a"
      },
      {
       "id": "evidence-boundary",
       "text": "我有一張船上的紀錄。東西鬆手後，原來的前進還在。至於月亮，還得等另一張紙，現在不能先說。",
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
     "text": "我沒有一張紙，能把這件事一路接到月亮。我只做過一個相關的實驗：放手後，原來的前進還在。",
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
       "text": "鬆手以前，石頭就跟著船往前走了。放手後，那股前進還在。",
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
     "text": "石屋工作室。牛頓挪開桌上的紙，畫下地球、月亮，還有月亮先前走過的一小段圓弧。圓弧只畫到此刻的月亮，前方仍是一片空白。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "這段路看起來像圓弧。可是如果我們現在就順著圓畫下去，不就把要找的原因先放進答案裡了？",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "牛頓",
     "text": "那就先把所有拉扯拿掉。地球不拉，別的東西也不拉。你看它到了這一點，下一步會往哪裡？",
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
     "text": "（用指甲截住那段弧）等等。這條圓弧是我們看見的路，不是月亮在沒有作用時非走不可的路。",
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
     "text": "（把蘋果放在月亮與地球之間）這樣等於先替地球加了一次拉。可我們剛剛說好，這一步什麼都不加。",
     "next": "c1"
    },
    {
     "id": "ok1",
     "type": "line",
     "speaker": "stage",
     "text": "旅人把尺靠上月亮此刻的方向，從圓弧末端畫出一小段切線。那條直線從月亮出發，沒有朝地球彎。",
     "next": "ok1b"
    },
    {
     "id": "ok1b",
     "type": "line",
     "speaker": "牛頓",
     "text": "直線先留著。現在換我。",
     "next": "ok1c"
    },
    {
     "id": "ok1c",
     "type": "line",
     "speaker": "stage",
     "text": "牛頓在同一張紙上補出月亮實際走過的一小段彎路，再點出下一刻的位置。切線端點在外，實際端點略向地球偏，兩點幾乎貼在一起。",
     "next": "ok1d"
    },
    {
     "id": "ok1d",
     "type": "line",
     "speaker": "牛頓",
     "text": "現在紙上有兩種走法：沒有作用時的直線，還有我們實際看見的彎路。你說，我們真正要量的是哪一段？",
     "next": "c2"
    },
    {
     "id": "c2",
     "type": "choice",
     "speaker": "system",
     "text": "哪一段最直接留下了『月亮偏離原本直線』的量？",
     "options": [
      {
       "id": "arc",
       "text": "月亮實際走過的整段圓弧",
       "next": "w4"
      },
      {
       "id": "radius",
       "text": "地球中心到月亮的整段距離",
       "next": "w5"
      },
      {
       "id": "gap",
       "text": "切線端點與實際端點之間的短差",
       "next": "ok2"
      }
     ]
    },
    {
     "id": "w4",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "不對，整段圓弧裡還混著月亮原本往前的運動。我得把『往前』和『向內偏』拆開。",
     "next": "c2"
    },
    {
     "id": "w5",
     "type": "line",
     "speaker": "牛頓",
     "text": "月地距離能告訴我們月亮在哪裡，卻不是它這一步偏離直線多少。再看兩個端點。",
     "next": "c2"
    },
    {
     "id": "ok2",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "啊，不是整段圓弧。是切線端點和實際端點之間，朝地球縮進去的那一小段。",
     "next": "ok3"
    },
    {
     "id": "ok3",
     "type": "line",
     "speaker": "牛頓",
     "text": "（點住兩個端點）月亮一面向前，一面離開原來的直線。這個短差，就是向內作用留下的量。",
     "next": "ok4"
    },
    {
     "id": "ok4",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "那地上的落下也能這樣看嗎？都取一秒，一張算地表落了多少，一張算月亮朝地球偏了多少。",
     "next": "ok5"
    },
    {
     "id": "ok5",
     "type": "line",
     "speaker": "牛頓",
     "text": "我也正想到這裡。地表那張我來算，月亮那張一起盯。兩張都算完，再看看它們有沒有值得追的關係。",
     "next": "g1"
    },
    {
     "id": "e1",
     "type": "embed",
     "system": "orbit",
     "phase": "tangent-seal",
     "hint": "舊存檔相容節點：封存切線預測紙。新流程已改由對話中的切線判讀直接記錄。",
     "until": {
      "orbit": "source-k0"
     },
     "legacyOnly": true,
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
     "text": "地表紙：牛頓估算自由落下一秒約 4.9 公尺。旁邊另掛旅人在比薩斜面的紀錄，只替落距隨時間改變的關係作證。月球天文紙：月地距離約 60 個地球半徑，月球繞行一週約 27.3 日；一秒的向內差距仍空著。兩張計算紙都標明「教學重建」。",
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
     "text": "（抬眼）斜面沒有量垂直一秒？",
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
     "text": "（把兩張紙分開）地表一秒的估算是我的。你的斜面紙只替時間關係作證。",
     "next": "n7a"
    },
    {
     "id": "n7a",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "月亮這張呢？你有距離和週期，我就盯著剛才那個端點短差，免得我們不小心把整段弧長算進去。",
     "next": "n7b"
    },
    {
     "id": "n7b",
     "type": "line",
     "speaker": "牛頓",
     "text": "你先指出該算哪一段，我來核幾何。算完各放一張紙，再並起來看。",
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
     "text": "地表紙已是一秒；月球紙要從距離與週期算出同一秒的向內差距。月距的數字從哪裡來，也可以先問清楚。",
     "options": [
      {
       "id": "ask",
       "text": "先問：月亮有多遠，這個數字從哪裡來？",
       "next": "q1"
      },
      {
       "id": "start",
       "text": "開始算月球一秒的向內差距",
       "next": "c_geom"
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
     "text": "希臘人看月食的影子，再比較兩地同時看到的月亮角度，算出月亮大約在六十個地球半徑外。這本寫六十又五分之二，托勒密寫五十九，溫德林寫六十。這個數字比我老一千八百年。",
     "next": "q3"
    },
    {
     "id": "q3",
     "type": "system",
     "speaker": "system",
     "text": "選讀：兩地同時看月亮，它在星空背景上的位置差接近一度；一度約等於六十分之一弧長，所以距離約是六十條基線，而基線就是地球自己。",
     "next": "c_geom"
    },
    {
     "id": "e1",
     "type": "embed",
     "system": "orbit",
     "phase": "scale",
     "hint": "舊存檔相容工作台：新流程已改由對話選擇依序完成幾何、倍率與關係判讀。",
     "until": {
      "orbit": "k2"
     },
     "legacyOnly": true,
     "next": "n9"
    },
    {
     "id": "c_geom",
     "type": "choice",
     "speaker": "system",
     "text": "月球一秒的『向內差距』，應該從圖上的哪一段算？",
     "options": [
      {
       "id": "arc",
       "text": "量月亮一秒走過的整段弧長",
       "effects": [
        {
         "labAction": {
          "action": "convertMoonTime",
          "args": {
           "choice": "arc-length"
          }
         }
        }
       ],
       "next": "wg1"
      },
      {
       "id": "radius",
       "text": "量地心到月亮的整段半徑",
       "next": "wg2"
      },
      {
       "id": "gap",
       "text": "量切線端點到實際端點的短差",
       "effects": [
        {
         "labAction": {
          "action": "convertMoonTime",
          "args": {
           "choice": "sagitta-geometry"
          }
         }
        }
       ],
       "next": "n9"
      }
     ]
    },
    {
     "id": "wg1",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "嗯，不是弧長。那裡大部分是月亮原本往前走的距離，會把我們要找的向內偏折淹掉。",
     "next": "c_geom"
    },
    {
     "id": "wg2",
     "type": "line",
     "speaker": "牛頓",
     "text": "半徑是位置，不是這一秒偏離直線的量。回到兩個幾乎貼在一起的端點。",
     "next": "c_geom"
    },
    {
     "id": "n9",
     "type": "line",
     "speaker": "stage",
     "text": "旅人圈住兩個端點之間的短差。牛頓以月地距離和週期核算幾何，兩人各重做一遍，紙上才落下月球一秒的數字。",
     "next": "n10"
    },
    {
     "id": "n10",
     "type": "line",
     "speaker": "牛頓",
     "text": "月亮這張，約一點三六毫米。你那邊呢？地表一秒是多少？",
     "next": "n11"
    },
    {
     "id": "n11",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "四點九公尺。嗯……一邊是公尺，一邊是毫米。換成同一個單位，兩邊大約差多少倍？",
     "next": "c_ratio"
    },
    {
     "id": "c_ratio",
     "type": "choice",
     "speaker": "system",
     "text": "4.9 公尺與 1.36 毫米，大約相差多少倍？",
     "options": [
      {
       "id": "r60",
       "text": "大約六十倍",
       "effects": [
        {
         "labAction": {
          "action": "judgeScaleRatio",
          "args": {
           "choice": 60
          }
         }
        }
       ],
       "next": "wr1"
      },
      {
       "id": "r360",
       "text": "大約三百六十倍",
       "effects": [
        {
         "labAction": {
          "action": "judgeScaleRatio",
          "args": {
           "choice": 360
          }
         }
        }
       ],
       "next": "wr1"
      },
      {
       "id": "r3600",
       "text": "大約三千六百倍",
       "effects": [
        {
         "labAction": {
          "action": "judgeScaleRatio",
          "args": {
           "choice": 3600
          }
         }
        }
       ],
       "next": "n11b"
      },
      {
       "id": "r36000",
       "text": "大約三萬六千倍",
       "effects": [
        {
         "labAction": {
          "action": "judgeScaleRatio",
          "args": {
           "choice": 36000
          }
         }
        }
       ],
       "next": "wr1"
      }
     ]
    },
    {
     "id": "wr1",
     "type": "line",
     "speaker": "牛頓",
     "text": "先把四點九公尺換成毫米，再除以一點三六。數量級會立刻露出來。",
     "next": "c_ratio"
    },
    {
     "id": "n11b",
     "type": "line",
     "speaker": "牛頓",
     "text": "約三千六百。月亮離地心，約六十個地球半徑。",
     "next": "c_relation"
    },
    {
     "id": "c_relation",
     "type": "choice",
     "speaker": "system",
     "text": "兩人都沒說話，只把「六十」和「三千六百」抄到同一張紙上。旅人先試哪一步？",
     "options": [
      {
       "id": "add",
       "text": "把六十再加一次，看看能不能接上三千六百",
       "effects": [
        {
         "labAction": {
          "action": "judgeScaleRelation",
          "args": {
           "choice": "add"
          }
         }
        }
       ],
       "next": "wr2"
      },
      {
       "id": "multiply",
       "text": "把六十再乘一次，看看能不能接上三千六百",
       "effects": [
        {
         "labAction": {
          "action": "judgeScaleRelation",
          "args": {
           "choice": "multiply"
          }
         }
        }
       ],
       "next": "n11c"
      },
      {
       "id": "unknown",
       "text": "先把六十放一旁，看看兩個數字是否只是巧合",
       "effects": [
        {
         "labAction": {
          "action": "judgeScaleRelation",
          "args": {
           "choice": "unknown"
          }
         }
        }
       ],
       "next": "wr3"
      }
     ]
    },
    {
     "id": "wr2",
     "type": "line",
     "speaker": "stage",
     "text": "旅人在旁邊寫下一百二十。它接不上三千六百，這條路停住了。",
     "next": "c_relation"
    },
    {
     "id": "wr3",
     "type": "line",
     "speaker": "stage",
     "text": "旅人把兩張紙分開，又忍不住看了一眼六十與三千六百。這個吻合還沒有被檢查。",
     "next": "c_relation"
    },
    {
     "id": "n11c",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "（盯著紙，忽然抬頭）六十……三千六百……啊！六十乘六十，不就是三千六百嗎？",
     "evidenceCue": "K2",
     "evidenceCueFrom": [
      "c_relation"
     ],
     "next": "n11d"
    },
    {
     "id": "n11d",
     "type": "line",
     "speaker": "牛頓",
     "text": "（立刻抽回月球紙）等等。我再算一遍。",
     "next": "n12"
    },
    {
     "id": "n12",
     "type": "line",
     "speaker": "牛頓",
     "text": "（重新算過比值，又在旁邊寫下一次六十乘六十。他停了一會兒）月亮離地心遠約六十倍；同樣一秒裡，它向內偏的距離，約是地表一秒落距的三千六百分之一。",
     "next": "n12a"
    },
    {
     "id": "n12a",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "所以……距離放大六十倍，向內落下的距離就縮成六十平方分之一？",
     "next": "n12c"
    },
    {
     "id": "n12c",
     "type": "line",
     "speaker": "牛頓",
     "text": "至少地表和月亮這兩張紙，是這樣接上的。先記著，別急著叫它定律。",
     "next": "n12b"
    },
    {
     "id": "n12b",
     "type": "line",
     "speaker": "stage",
     "text": "兩種筆跡並排留在紙上。牛頓在「距離約六十倍」與「偏折約為地表的三千六百分之一」之間畫了一道線，便把筆放下。接著，他才把一秒的細差放大成六十秒：約一點三六毫米乘六十的平方，得到約四點八八公尺。",
     "next": "n13"
    },
    {
     "id": "n13",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "那火星、木星，還有彗星呢？它們也會照這個縮法嗎？",
     "next": "n13a"
    },
    {
     "id": "n13a",
     "type": "line",
     "speaker": "牛頓",
     "text": "這才是下一個問題。但我們今天只算過月亮。",
     "next": "n14"
    },
    {
     "id": "n14",
     "type": "line",
     "speaker": "旅人・心聲",
     "osPurpose": "private_observation",
     "text": "他沒說「答對」。他把我的六十寫進自己的算式。",
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
     "text": "因為我們從地球正中心量到蘋果，也從正中心量到月亮。所以蘋果那頭才算一個地球半徑。",
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
     "next": "c_center_reason"
    },
    {
     "id": "c_center_reason",
     "type": "choice",
     "speaker": "system",
     "text": "旅人先試哪一個理由？",
     "options": [
      {
       "id": "center_round",
       "text": "地球是圓的啊，既然有地心，距離就該從那裡算",
       "next": "wc_round"
      },
      {
       "id": "center_symmetry",
       "text": "地球四面大致對稱，旁邊的拉扯應該會互相抵掉",
       "next": "wc_symmetry"
      },
      {
       "id": "center_fall",
       "text": "蘋果和月亮都往地球靠，拉它們的地方應該就在地心",
       "next": "wc_fall"
      }
     ]
    },
    {
     "id": "wc_round",
     "type": "line",
     "speaker": "牛頓",
     "text": "（把圓圈描深）這只告訴我們中心在哪裡。它還沒把每一塊土的拉扯加起來。",
     "next": "n20"
    },
    {
     "id": "wc_symmetry",
     "type": "line",
     "speaker": "牛頓",
     "text": "（畫出左右兩支箭）這能說明合起來的方向朝中心。可是拉得多大，還沒有算出來。",
     "next": "n20"
    },
    {
     "id": "wc_fall",
     "type": "line",
     "speaker": "牛頓",
     "text": "（圈起『往地心』三字）你拿結果當成理由了。我問的正是：為什麼結果能像從地心拉來？",
     "next": "n20"
    },
    {
     "id": "n20",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "……我最多只能把地心標出來，還不能把整顆地球當成縮在那一點。",
     "next": "n21"
    },
    {
     "id": "n21",
     "type": "line",
     "speaker": "牛頓",
     "text": "（在紙角寫下問號）那就先停在這裡。數字對上了，理由還沒有。",
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
     "text": "旅人筆記裡多了「同一把尺（角落帶問號）」這一頁。它支持：在同樣一秒裡，距離從一個地球半徑增加到約六十倍時，向內落下的距離縮到約三千六百分之一。它還不能證明這個關係是否普遍，也沒有證明為什麼可以從地心量。",
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
     "text": "他不是這樣看。他說：月亮一直往前，同時一路被扳彎。兩件事從沒停過。",
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
     "text": "繩子不是月亮的答案，月亮上也沒有繩。這個演示只指出一件事：有東西一直在改月亮的路，而且不會斷。這是他寫給我的。",
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
     "text": "月亮一路連著走，紙上卻不能一口氣算完。我把它切成一小步、一小步，照同一套規矩往下畫。",
     "next": "n24"
    },
    {
     "id": "n24",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "嗯……就是把一條不停的路，拆成很多小步來算？",
     "next": "n25"
    },
    {
     "id": "n25",
     "type": "line",
     "speaker": "牛頓",
     "text": "對。每一步，月亮先照原來的方向走；接著再朝它此刻看見的地心扳一點。步子切得越細，紙上的路就越平順。",
     "next": "n26"
    },
    {
     "id": "n26",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "方向先固定朝此刻的地心。那我們真正要試的，只剩它原本跑多快、每一步往內扳多少。",
     "next": "n27"
    },
    {
     "id": "n27",
     "type": "line",
     "speaker": "牛頓",
     "text": "對。先別猜最後會畫成什麼。拿幾張紙，一次只改一件事，讓結果自己排出差別。",
     "next": "n28"
    },
    {
     "id": "n28",
     "type": "line",
     "speaker": "牛頓",
     "text": "我替你把每張紙快速續畫完；你盯著哪些設定真的能互相比。舊紙都留著，不准看完才改。",
     "next": "n28a"
    },
    {
     "id": "n28a",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "好啊。先試跑、記結果，再從紀錄裡挑出能支持一句話的那幾張。",
     "next": "n28b"
    },
    {
     "id": "n28b",
     "type": "line",
     "speaker": "牛頓",
     "text": "（把尺靠回紙邊）我只是替你把很多小步畫快一點；紙上算的是我們寫下的規矩，不是替天空作證。",
     "next": "e1"
    },
    {
     "id": "e1",
     "type": "embed",
     "system": "orbit",
     "phase": "orbit-rule",
     "hint": "方向固定朝此刻地心；自由試跑原有快慢與向內扳量，留下至少三張可比較的紙，再由玩家選數據下斷言。",
     "until": {
      "orbit": "k1"
     },
     "next": "n29"
    },
    {
     "id": "n29",
     "type": "line",
     "speaker": "stage",
     "text": "桌上排著旅人挑出的三張紙。兩張都留在窄帶，卻用了不同的快慢與向內扳量；第三張只改了一項，路便往內切或向外張。",
     "next": "n30"
    },
    {
     "id": "n30",
     "type": "line",
     "speaker": "牛頓",
     "text": "（把兩張繞住的紙疊起來，核對片刻）跑得較快的這張，每一步往內扳得也更多。兩張都繞住了。",
     "next": "n31"
    },
    {
     "id": "n31",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "等等！只改其中一項，路就跑掉了。不是只要朝地心就行；往內扳多少，得跟原本跑多快配得上。",
     "next": "n32"
    },
    {
     "id": "n32",
     "type": "line",
     "speaker": "牛頓",
     "text": "對。這一句可以留下。不過別把紙上的路當成天空本身——它先告訴我們，哪種關係值得拿真實天象繼續追。",
     "next": "n33"
    },
    {
     "id": "n33",
     "type": "line",
     "speaker": "stage",
     "text": "牛頓把試跑紙依序攤開：留在窄帶、往內切、向外張；最旁邊仍壓著那張沒有作用時的切線直路。",
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
     "text": "打得慢，砲彈砸在山腳。快一些，砸得更遠。再快一些，落點一路往前跑，追著地平線。",
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
     "text": "（削著筆）我看見了。",
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
     "text": "呃……這件事很難解釋。",
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
     "text": "虎克、雷恩和我在咖啡館吵了一桌。若朝太陽的拉力按距離平方變弱，行星會走什麼路？",
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
     "text": "先看你們手上的線索。離得遠，拉得弱。拉得弱，走得慢，路又更長。",
     "next": "n29a"
    },
    {
     "id": "n29a",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "嗯……兩件事會一起把週期拉長。遠一倍，一年不會只跟著長一倍。",
     "next": "n29b"
    },
    {
     "id": "n29b",
     "type": "line",
     "speaker": "哈雷",
     "text": "就是這個意思。火星和木星各要多久，你們先押一個大約範圍，滴上蠟。我再開包。",
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
     "text": "這規矩我熟。我在別的地方見過。那個人不是怕誰說謊，是怕過幾天，大家記得的已經變成另一回事。",
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
     "text": "兩個封口、拆包後的觀測和十年刻痕帶都留在牆上。有人想逃避承諾，也有人想看完再改數字。哈雷把這些嘗試也一筆筆記了下來。",
     "next": "n38"
    },
    {
     "id": "n38",
     "type": "line",
     "speaker": "哈雷",
     "text": "（小心拿起牛頓的計算紙）對。直覺可以猜中，也可以猜偏；真正經得起檢驗的，是封口在先，觀測在後的兩筆計算。火星和木星都對上了——但還不能替整片天空作保。",
     "evidenceCue": "K3",
     "evidenceCueFrom": [
      "e1"
     ],
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
     "text": "夠讓我來追這本書。九頁可以先回答橢圓。整本書還得回答另一個問題：同一條規矩，敢不敢碰整片天空？",
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
     "text": "待會過帳，你要替兩邊都算。你先講講對面那一套——講得不對，我現在補。等蓋章時才發現你不懂，就晚了。",
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
     "text": "而且這套說法能解釋一件事——行星為什麼全往同一方向繞。這一點，我的說法反而不佔便宜。",
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
     "text": "像這個：不用碰，也能拉。距離越遠，拉得越弱。只借這兩件事。別的不借——磁石只吸鐵，這股勁什麼都拉。",
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
     "text": "漩渦的說法不只一種。今天拿來比的，只是一個規矩固定、能一格一格算的簡化版本。這一版輸了，不等於所有漩渦都輸。",
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
     "text": "三份都要過帳。拉力帳的平方規矩不准動。漩渦帳的流速表也不准動。中途改任何一條，整桌帳作廢。",
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
     "text": "每一格都先看依據，再蓋章。章有三種。有數字，也對得上，就蓋「對上了」。只有說法，沒有數字可查，就蓋「講得通」。有數字卻對不上，就蓋「對不上」。",
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
     "text": "牛頓不能蓋——規矩是他的。我不能蓋——書是我要印的。你既不是規矩的作者，也不是出錢印書的人。這桌帳裡，只有你沒有輸贏。",
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
     "hint": "先選一份資料。兩本帳都讀同一份，再由你各蓋一顆章。若有人想補新說法，借條要留在帳上；三份都看完，才寫總結。",
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
     "text": "這張紙只比今天定好的兩本帳。哪一本能用同一條規矩算過三份資料？哪一本得另外貼借條？別把結論寫成「所有漩渦都錯」。（扣上鎖）現在去處理最難算的部分。",
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
     "text": "牛頓抱來一疊邊緣磨毛的新紙，還帶來一顆能一層層拆開的套疊木球。他把木球拆成幾層薄殼，排在版框旁。",
     "next": "n7"
    },
    {
     "id": "n7",
     "type": "line",
     "speaker": "牛頓",
     "text": "一個厚薄均勻的球殼，拉外面的東西時，就跟把整個殼的重量全擠在球心一樣。",
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
     "text": "史實邊界：《原理》第一卷命題 LXX、LXXI 與 LXXIV 分別處理球殼裡面、球殼外面等效於球心，以及整顆均勻球怎麼一層層合起來。「1686 交到印刷台」是排版演出，不是它第一次成形的日期。本章的印刷工，是為了呈現當時排字與出版現場而合成的人物。",
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
     "text": "先把手拿開。這兩封信不能替你證明三百頁。可那三百頁，也不能讓兩封信不存在。",
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
     "text": "所以要寫清楚，不是故作大方。把證明接好，再寫明他做過什麼，也只寫到那裡。",
     "next": "e1"
    },
    {
     "id": "e1",
     "type": "embed",
     "system": "orbit",
     "phase": "proof",
     "hint": "這一頁只問兩件事：每段證明能不能接回一張紙？每個名字能不能接回真正做過的事？接好後，再檢查作者欄和還沒解開的問題有沒有被誠實保留。",
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
       "text": "五張證據照原來的順序收好。最後的校樣帶走，來源、退件和未決的部分都留在木匣。",
       "next": "w1"
      },
      {
       "id": "summary_only",
       "text": "五張證據照原來的順序收好。每張只抄結論，來源、退件和未決的部分都留在木匣。",
       "next": "w2"
      },
      {
       "id": "with_boundaries",
       "text": "五張證據照原來的順序收好。每一張都連同來源、退件和還沒證明的地方，一起夾回筆記。",
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
     "text": "旅人把五張證據一張張夾回筆記。每張後面都跟著來源、退件和還沒證明的地方。切線預測另外收好，沒有硬算成第六張證據。",
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
   "historyTag": "documented-future-echo + modern-model",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "印刷工收著鉛字，把字盒一格一格推回架上。",
     "next": "f1"
    },
    {
     "id": "f1",
     "type": "line",
     "speaker": "stage",
     "text": "旅人筆記的頁角忽然亮起。鉛字盒後方的黑暗拉深成星空，一顆帶著四根長鬚的銀色小球從紙面升起。",
     "next": "f2"
    },
    {
     "id": "f2",
     "type": "line",
     "speaker": "stage",
     "text": "1957 年，史普尼克一號成為第一顆繞行地球的人造衛星。它比一個人還輕，卻一次又一次從地平線外回來。",
     "next": "f3"
    },
    {
     "id": "f3",
     "type": "line",
     "speaker": "旅人・心聲",
     "osPurpose": "cross_chapter_memory",
     "text": "牛頓寫下的規則，幾百年後真的讓人造的月亮一直落、也一直錯過地面。可兩個東西若撞在一起，軌道那本帳還不夠用。",
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
     "text": "我只管把鉛字撿回盒裡。哪一本帳對，你們自己算。",
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
     "text": "算錯可以重算。把沒量到的寫成已經證明，或把別人的紙擦掉，才會讓整本書失去讓人查回去的路。你要收回哪一部分？",
     "next": "c1"
    },
    {
     "id": "c1",
     "type": "choice",
     "text": "要怎麼改，才沒有把來源弄丟，也沒有把證據說過頭？",
     "options": [
      {
       "id": "withdraw",
       "text": "「我把超出來源的署名和機制說法劃掉，其他照原紙留下。」",
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
       "text": "「我只留能證明的最後一頁。虎克的信先不列，免得混淆。」",
       "next": "w1"
      },
      {
       "id": "fill-mechanism",
       "text": "「機制那一欄不能空著。我先寫成已經證明，找到來源再補。」",
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
