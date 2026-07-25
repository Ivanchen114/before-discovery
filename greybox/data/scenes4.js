/* data/scenes4.js — 第四章場景執行載體（file:// 相容）。規範鏡像:scenes4.json。
   ⚠ 本檔為生成物；請改 scenes4.json 後執行 node tools/build-ch4-data.mjs。 */
(function (root) {
 "use strict";
 var data = {
 "chapter": "ch4",
 "title": "月亮的無盡墜落",
 "startScene": "D0-1",
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
     "text": "第三章旅人筆記的末頁。紙角壓著一粒乾掉的鹽；船上與岸上的兩條路旁，剛寫下的問題還沒乾：如果放手不會清除原有運動，月亮為什麼沒有沿直線離開？",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "石頭離開桅杆，仍把原來的前進帶在身上。那月亮呢？",
     "next": "n2a"
    },
    {
     "id": "n2a",
     "type": "line",
     "speaker": "stage",
     "text": "筆記更前面的一頁透出灰色月面：鎚與羽毛並肩落下；旁邊那道未完成的弧，仍停在原處。",
     "next": "n2b"
    },
    {
     "id": "n2b",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "鎚和羽只回答了落下，沒有回答一個一直往前、又一直往下的東西，最後會走成什麼。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "stage",
     "text": "旅人翻到下一頁。紙面一片空白，沒有日期，也沒有名字。",
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "（手停在頁角）我知道自己在問什麼。我不知道下一頁會把我帶到誰面前。",
     "next": "n5"
    },
    {
     "id": "n5",
     "type": "line",
     "speaker": "stage",
     "text": "「月亮」二字從墨跡下方亮起。港口的浪聲被拉成很長的一口氣；旅人立刻按住紙頁。",
     "next": "n6"
    },
    {
     "id": "n6",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "等等——我還沒說要走。",
     "next": "c1"
    },
    {
     "id": "c1",
     "type": "choice",
     "speaker": "system",
     "text": "1642｜馬賽。港口的浪聲還在紙邊；下一頁沒有日期，也沒有名字。",
     "options": [
      {
       "id": "enter",
       "text": "翻開落下的那一頁",
       "next": "g1"
      }
     ]
    },
    {
     "id": "n7",
     "type": "goto",
     "scene": "D0-2"
    },
    {
     "id": "n8",
     "type": "goto",
     "scene": "D0-2"
    },
    {
     "id": "n9",
     "type": "goto",
     "scene": "D0-2"
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
   "title": "果園裡只有下一步",
   "historyTag": "later-recollection+fictional-bridge",
   "nodes": [
    {
     "id": "a1",
     "type": "line",
     "speaker": "stage",
     "text": "紙縫打開成真正的果園。旅人跌進濕草，身後沒有海聲，只有風吹過石牆。白日月亮掛在枝葉之間。",
     "next": "a2"
    },
    {
     "id": "a2",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "（撐起身，先聽了一會）不是馬賽。",
     "next": "a3"
    },
    {
     "id": "a3",
     "type": "system",
     "speaker": "system",
     "text": "1665 年，英格蘭・伍爾索普。劍橋因瘟疫停課，一名返鄉的學生正在果園裡。",
     "next": "n1"
    },
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "一顆蘋果掉在旅人腳邊。沒有頓悟音效。附近的年輕人走來撿起它，先看凹下去的草，再抬頭看白日月亮。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "system",
     "speaker": "system",
     "text": "史實註：蘋果故事來自多年後的回憶。本章保留它提出的問題，不把它演成 1665 年瞬間完成理論。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "抱歉。這裡是——",
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "牛頓",
     "text": "（拍掉蘋果上的草屑）伍爾索普。我家的果園。",
     "next": "n5"
    },
    {
     "id": "n5",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "那你是？",
     "next": "n6"
    },
    {
     "id": "n6",
     "type": "line",
     "speaker": "牛頓",
     "text": "艾薩克・牛頓。你呢？",
     "next": "n7"
    },
    {
     "id": "n7",
     "type": "line",
     "speaker": "stage",
     "text": "旅人沒有回答。他看了一眼筆記，又看回眼前這個年輕人。",
     "next": "n8"
    },
    {
     "id": "n8",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "這個名字我知道。眼前這個人，我不知道。",
     "next": "n9"
    },
    {
     "id": "n9",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "你在看蘋果？",
     "next": "n10"
    },
    {
     "id": "n10",
     "type": "line",
     "speaker": "牛頓",
     "text": "（掂了掂蘋果，抬眼看向月亮）我近來一直在想：讓它落下的這股作用，往上能伸多遠。到樹頂還在，到了雲上呢？（停）到了月亮那裡呢？",
     "next": "n11"
    },
    {
     "id": "n11",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "如果地球也拉著月亮——",
     "next": "n12"
    },
    {
     "id": "n12",
     "type": "line",
     "speaker": "stage",
     "text": "話才起頭，牛頓便蹲下身，用樹枝在泥上點出地球，把小石子放在旁邊，再在石子前方畫一小段直線。",
     "next": "n13"
    },
    {
     "id": "n13",
     "type": "line",
     "speaker": "牛頓",
     "text": "先別替它說完。我問的不是猜得像不像。假設沒有任何作用改變它的運動，下一刻會往哪裡？",
     "next": "n14"
    },
    {
     "id": "n14",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "我把後半句嚥了回去。他連自己想到一半的念頭，都不肯先說死。",
     "next": "g1"
    },
    {
     "id": "n15",
     "type": "goto",
     "scene": "D1-1"
    },
    {
     "id": "n16",
     "type": "goto",
     "scene": "D1-1"
    },
    {
     "id": "n17",
     "type": "goto",
     "scene": "D1-1"
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
   "title": "先把下一步留下",
   "historyTag": "modern-model",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "牛頓把泥面上的位置抄到紙上，帶旅人回到石屋工作室。紙上有地球、月亮，以及月亮剛才走過的一小段路，只缺下一步。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "牛頓",
     "text": "先拿掉所有拉扯。只選下一步。",
     "next": "c1"
    },
    {
     "id": "c1",
     "type": "choice",
     "speaker": "system",
     "text": "若此刻沒有任何作用改變月亮的運動，它下一步會往哪裡？",
     "options": [
      {
       "id": "tangent",
       "text": "沿著此刻的方向直走",
       "next": "ok1"
      },
      {
       "id": "curve",
       "text": "照原來的圓弧繼續",
       "next": "w1"
      },
      {
       "id": "inward",
       "text": "立刻朝地球落下",
       "next": "w3"
      }
     ]
    },
    {
     "id": "w1",
     "type": "line",
     "speaker": "stage",
     "text": "旅人在紙上接了一小段圓弧。牛頓用指甲截住那條線。",
     "next": "w2"
    },
    {
     "id": "w2",
     "type": "line",
     "speaker": "牛頓",
     "text": "你把要解釋的圓，先塞進答案裡了。沒有東西讓它轉彎。重選。",
     "next": "c1"
    },
    {
     "id": "w3",
     "type": "line",
     "speaker": "stage",
     "text": "旅人在月亮與地球之間畫了一條直線。牛頓把蘋果放在那條線上。",
     "next": "w4"
    },
    {
     "id": "w4",
     "type": "line",
     "speaker": "牛頓",
     "text": "這是替它加了一次向內的推動。題目說的是什麼都不加。重選。",
     "next": "c1"
    },
    {
     "id": "ok1",
     "type": "line",
     "speaker": "stage",
     "text": "牛頓沿著選中的方向連出三個點。紙上留下一條與圓弧分開的直線。",
     "next": "ok2"
    },
    {
     "id": "ok2",
     "type": "line",
     "speaker": "牛頓",
     "text": "這張先留著。它不是觀測，是我們動手前留下的預測。",
     "next": "ok3"
    },
    {
     "id": "ok3",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "圓不是它自己會走的路。",
     "next": "g1"
    },
    {
     "id": "e1",
     "type": "goto",
     "scene": "D1-2"
    },
    {
     "id": "n3",
     "type": "goto",
     "scene": "D1-2"
    },
    {
     "id": "n4",
     "type": "goto",
     "scene": "D1-2"
    },
    {
     "id": "n5",
     "type": "goto",
     "scene": "D1-2"
    },
    {
     "id": "n6",
     "type": "goto",
     "scene": "D1-2"
    },
    {
     "id": "n7",
     "type": "goto",
     "scene": "D1-2"
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
   "title": "每一拍，只改一點",
   "historyTag": "modern-model",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "牛頓把一顆木球繫到細繩末端，在桌邊甩成一個小圓。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "牛頓",
     "text": "它為什麼沒有直走？",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "繩子一直把它拉向你的手。",
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "stage",
     "text": "牛頓鬆手。木球沿圓的切線滾出去，停在剛才那張預測紙旁。",
     "next": "n5"
    },
    {
     "id": "n5",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "繩子一鬆，它就回到紙上的直線。",
     "next": "n6"
    },
    {
     "id": "n6",
     "type": "line",
     "speaker": "牛頓",
     "text": "繩子不是月亮的答案。它只把問題指出來。",
     "next": "n7"
    },
    {
     "id": "n7",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "月亮沒有繩子。可它若一直轉彎，就一定有東西持續改變它的速度。",
     "next": "n8"
    },
    {
     "id": "n8",
     "type": "line",
     "speaker": "牛頓",
     "text": "別急著替那個東西命名。把方向、箭長和初速一次寫死，然後放手。別等它走歪了才替它修路。",
     "next": "e1"
    },
    {
     "id": "e1",
     "type": "embed",
     "system": "orbit",
     "phase": "vectors",
     "hint": "設計同一套改向規則，先封存路徑預測，再讓它自行跑完。外張與內切都會留在紙上。",
     "until": {
      "orbit": "closed"
     },
     "next": "n9"
    },
    {
     "id": "n9",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "只找對方向還不夠。箭長也得配上它原來跑多快。",
     "next": "n10"
    },
    {
     "id": "n10",
     "type": "line",
     "speaker": "牛頓",
     "text": "方向告訴你往哪裡改；數量決定那條路能不能留在地球周圍。",
     "next": "g1"
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "D1-3"
    }
   ]
  },
  {
   "id": "D1-3",
   "title": "弧線裡多了什麼",
   "historyTag": "modern-model",
   "nodes": [
    {
     "id": "e1",
     "type": "embed",
     "system": "orbit",
     "phase": "claim",
     "hint": "用切線逃逸與閉合軌道兩筆紀錄，說明前進與向內改向如何同時存在。",
     "until": {
      "orbit": "k1"
     },
     "next": "n1"
    },
    {
     "id": "n1",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "它保留原來的前進；新的作用持續指向地心，改向的量還得和它跑多快相配。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "牛頓",
     "text": "現在才可以說：它一直在掉。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "卻一直錯過地面。",
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "stage",
     "text": "牛頓在金色箭頭旁寫下一個問號。",
     "next": "n5"
    },
    {
     "id": "n5",
     "type": "line",
     "speaker": "牛頓",
     "text": "方向有了。多少，還沒有。",
     "next": "n5a"
    },
    {
     "id": "n5a",
     "type": "line",
     "speaker": "stage",
     "text": "他用手邊的地球尺度，把地表的落下換算到月球距離。算到最後，兩個數字沒有碰上。",
     "next": "n5b"
    },
    {
     "id": "n5b",
     "type": "line",
     "speaker": "牛頓",
     "text": "對不上。",
     "next": "n5c"
    },
    {
     "id": "n5c",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "是規則錯了，還是我們手裡的地球尺度不準？",
     "next": "n5d"
    },
    {
     "id": "n5d",
     "type": "line",
     "speaker": "牛頓",
     "text": "現在分不出來。你說，這一頁該怎麼處理？",
     "next": "c1"
    },
    {
     "id": "c1",
     "type": "choice",
     "speaker": "system",
     "text": "第一次月球比較沒有吻合。決定怎麼處理這張紙。",
     "options": [
      {
       "id": "fit",
       "text": "換一個能讓結果剛好對上的地球大小",
       "next": "r1"
      },
      {
       "id": "announce",
       "text": "先宣布方向是對的，數量以後再補",
       "next": "r2"
      },
      {
       "id": "shelve",
       "text": "寫下差距與借來的數，標成「未決」收進抽屜",
       "next": "n5e"
      }
     ]
    },
    {
     "id": "r1",
     "type": "line",
     "speaker": "牛頓",
     "text": "那不是算出來的，是挑出來的。先有結論，再回頭買一個數。重選。",
     "next": "c1"
    },
    {
     "id": "r2",
     "type": "line",
     "speaker": "牛頓",
     "text": "方向不會替我算出多少。半個答案送出去，就收不回來。重選。",
     "next": "c1"
    },
    {
     "id": "n5e",
     "type": "line",
     "speaker": "stage",
     "text": "牛頓在頁邊寫下差距，圈起「地球的大小」，註明是借來的數，再標上「未決」，把整疊紙放進抽屜。",
     "next": "n5f"
    },
    {
     "id": "n5f",
     "type": "line",
     "speaker": "牛頓",
     "text": "等有人量出一個我信得過的地球，我再回來。",
     "next": "n5g"
    },
    {
     "id": "n5g",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "我知道他最後會對，也知道我不能替他把那個數補上。抽屜關得很輕；他沒有丟掉失敗，也沒有把它改成成功。",
     "next": "n5h"
    },
    {
     "id": "n5h",
     "type": "system",
     "speaker": "system",
     "text": "史實註：牛頓晚年的相關備忘錄記載，他早期曾比較月球所需的作用與地表重力；採用的地球尺度不夠可靠，結果不足以支撐公開宣布。本場把這次失配具象化，不把 1665 年演成理論完成的一刻。",
     "next": "g1"
    },
    {
     "id": "n6",
     "type": "goto",
     "scene": "D2-1"
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
   "title": "虎克把問題寫進來",
   "historyTag": "documented+reconstruction",
   "nodes": [
    {
     "id": "c1",
     "type": "choice",
     "speaker": "system",
     "text": "1665 留下的是一張寫著「未決」的紙。下一封信在十四年後。",
     "options": [
      {
       "id": "turn",
       "text": "親手翻到 1679",
       "next": "n1"
      }
     ]
    },
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "1679｜劍橋。當年的兩張拓印已泛黃。一封拆開的信壓在上面，信中畫著兩支熟悉的箭：沿切線前進、朝中心偏去。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "虎克・書信",
     "text": "若天體一面保留直行，一面持續受中央吸引，兩種傾向合起來便會改變它的路。吸引若隨距離改變，路徑也會跟著改變。",
     "next": "n2a"
    },
    {
     "id": "n2a",
     "type": "system",
     "speaker": "system",
     "text": "原信摘句（1679，保留原拼字）：compounding the celestiall motions of the planetts of a direct motion by the tangent & an attractive motion towards the centrall body.",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "system",
     "speaker": "system",
     "text": "史實註：此處為 1679 年虎克與牛頓書信內容的白話轉述，不是逐字引文。",
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "他把兩支箭放到同一張紙上了。",
     "next": "n5"
    },
    {
     "id": "n5",
     "type": "line",
     "speaker": "牛頓",
     "text": "他把問題放到同一張紙上。",
     "next": "n6"
    },
    {
     "id": "n6",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "這兩句差在哪裡？",
     "next": "n7"
    },
    {
     "id": "n7",
     "type": "line",
     "speaker": "牛頓",
     "text": "差在「多少」。方向對了，數量還沒算出來。",
     "next": "n8"
    },
    {
     "id": "n8",
     "type": "line",
     "speaker": "stage",
     "text": "牛頓把信推到桌角，卻沒有丟掉。他取出地表落體記錄，也把那張寫著「未決」的舊紙拿回來，壓在虎克的問句旁。",
     "next": "n8a"
    },
    {
     "id": "n8a",
     "type": "line",
     "speaker": "stage",
     "text": "旅人的目光越過信紙，落到書架上一冊翻舊的《物理學》；另一冊滿是兩種筆跡的評注本，在記憶裡一閃而過。",
     "next": "n8b"
    },
    {
     "id": "n8b",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "我第一次想念一個會先重述、再挑邊界的老人。眼前的人不和我爭；他只是不接受。",
     "next": "n9"
    },
    {
     "id": "n9",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "他怕兩件事：還沒算完，名字就被刻死。我認得那種怕；我做過的事，也全留在別人的紙上。",
     "next": "n10"
    },
    {
     "id": "n10",
     "type": "line",
     "speaker": "牛頓",
     "text": "若地上的落下和天上的偏折是同一件事，兩張記錄就該能用同一把尺相認。",
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
   "title": "讓兩張記錄相認",
   "historyTag": "modern-model",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "牛頓",
     "text": "把現在採用的地球尺度寫在紙邊。別改觀測，只准改你拿來連接它們的規則。",
     "next": "e1"
    },
    {
     "id": "e1",
     "type": "embed",
     "system": "orbit",
     "phase": "scale",
     "hint": "已知月球到地心約六十個地球半徑。先封存距離律，月球六十秒偏離切線的落點才會揭曉。",
     "until": {
      "orbit": "k2"
     },
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "六十秒後，月亮離開切線的距離，和地表一秒的落下碰上了。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "牛頓",
     "text": "先記下。它只回答了月亮。",
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "你還不相信？",
     "next": "n5"
    },
    {
     "id": "n5",
     "type": "line",
     "speaker": "牛頓",
     "text": "火星和木星還沒問。",
     "next": "g1"
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "D2-3"
    }
   ]
  },
  {
   "id": "D2-3",
   "title": "不准先看火星",
   "historyTag": "modern-model+reconstruction",
   "nodes": [
    {
     "id": "c1",
     "type": "choice",
     "speaker": "system",
     "text": "五年後，有人帶著一個不肯接受口頭保證的問題來了。",
     "options": [
      {
       "id": "turn",
       "text": "親手翻到 1684",
       "next": "n1"
      }
     ]
    },
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "1684｜劍橋。桌上的紙多了五年份。牛頓抬頭，第一次仔細看旅人的臉。",
     "next": "n1a"
    },
    {
     "id": "n1a",
     "type": "line",
     "speaker": "牛頓",
     "text": "十九年前，你也在。",
     "next": "n1b"
    },
    {
     "id": "n1b",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "是。",
     "next": "n1c"
    },
    {
     "id": "n1c",
     "type": "line",
     "speaker": "牛頓",
     "text": "你沒有老。",
     "next": "n1d"
    },
    {
     "id": "n1d",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "這件事很難解釋。",
     "next": "n1e"
    },
    {
     "id": "n1e",
     "type": "line",
     "speaker": "牛頓",
     "text": "那就先不解釋。",
     "next": "n1f"
    },
    {
     "id": "n1f",
     "type": "line",
     "speaker": "stage",
     "text": "門被敲響。哈雷抱著木匣進來，雨水沿外套滴到地板；匣內兩包封住的觀測只寫著「火星」與「木星」。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "哈雷",
     "text": "虎克、雷恩和我爭了一桌。若朝太陽的作用按距離平方縮弱，行星會走什麼路？",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "牛頓",
     "text": "橢圓。",
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "哈雷",
     "text": "一句答案，值不了我這趟雨。我要一條別人能從第一步走到最後一步的路。",
     "next": "n4a"
    },
    {
     "id": "n4a",
     "type": "line",
     "speaker": "牛頓",
     "text": "我有計算。",
     "next": "n4b"
    },
    {
     "id": "n4b",
     "type": "line",
     "speaker": "哈雷",
     "text": "那就先把規則封起來。你們留下預測，我才開資料。",
     "next": "e1"
    },
    {
     "id": "e1",
     "type": "embed",
     "system": "orbit",
     "phase": "planets",
     "hint": "鎖定距離律，在觀測揭露前分別封存火星與木星的週期預測。",
     "until": {
      "orbit": "k3"
     },
     "next": "n5"
    },
    {
     "id": "n5",
     "type": "line",
     "speaker": "哈雷",
     "text": "現在我信的不是你的語氣。是這兩個封口。",
     "next": "n6"
    },
    {
     "id": "n6",
     "type": "line",
     "speaker": "牛頓",
     "text": "還不夠成書。",
     "next": "n7"
    },
    {
     "id": "n7",
     "type": "line",
     "speaker": "哈雷",
     "text": "夠讓我來追這本書。同一條規則，敢不敢碰整片天空？",
     "next": "n8"
    },
    {
     "id": "n8",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "他不是來討答案。他是來把答案從抽屜裡拖出去。",
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
   "title": "彗星不肯走成兩顆",
   "historyTag": "reconstruction",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "1685–1686｜劍橋。彗星十一月的入向星圖與十二月的出向星圖分放桌子兩端；每個點都有日期、參考星與墨跡。",
     "next": "n1a"
    },
    {
     "id": "n1a",
     "type": "line",
     "speaker": "佛蘭斯蒂德・書信",
     "text": "我記下的不是一團光「像什麼」，而是它每一夜相對哪些星，移到哪裡。若你認為兩疊是同一位來客，請讓計算穿過這些位置。",
     "next": "n1b"
    },
    {
     "id": "n1b",
     "type": "line",
     "speaker": "牛頓",
     "text": "我先前認為是兩顆。先把它們放進同一條路。",
     "next": "e0"
    },
    {
     "id": "e0",
     "type": "embed",
     "system": "orbit",
     "phase": "comet",
     "hint": "依日期與參考星接續兩疊觀測。只讓紙面端點碰在一起，可能會留下觀測不支持的折角。",
     "until": {
      "orbit": "comet-joined"
     },
     "next": "n1c"
    },
    {
     "id": "n1c",
     "type": "line",
     "speaker": "stage",
     "text": "門縫又塞進哈雷的短箋，紙角夾著第一輪印刷排程。彗星反驗還沒跑完，校樣位置已經到了。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "哈雷・短箋",
     "text": "你們可以送一份只寫到行星的短稿，也可以放掉這輪，等彗星走完。沒有倒數；但每次送樣與延後，都會留在帳上。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "牛頓",
     "text": "送出去的缺口，不會因為我們心裡知道它是缺口，就自動留白。",
     "next": "e1"
    },
    {
     "id": "e1",
     "type": "embed",
     "system": "orbit",
     "phase": "press-opening",
     "hint": "選擇送出誠實短稿，或明列理由放掉第一輪；閱讀多久都不會消耗窗口。",
     "until": {
      "orbit": "press-opening"
     },
     "next": "n4p"
    },
    {
     "id": "n4p",
     "type": "line",
     "speaker": "哈雷・短箋",
     "text": "這張沒有說謊。但完整的書仍欠一片天空；短稿與署名問題一起留到正式排版。",
     "require": {
      "flag": [
       "ch4OpeningChoice",
       "partial"
      ]
     },
     "next": "n4d"
    },
    {
     "id": "n4d",
     "type": "line",
     "speaker": "哈雷・短箋",
     "text": "我去重談紙張和排程。慢有成本，硬印也有；1679 年那封信仍留在來源袋。",
     "require": {
      "flag": [
       "ch4OpeningChoice",
       "defer"
      ]
     },
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "哈雷",
     "text": "月亮、行星、彗星。三個抽屜都打開。",
     "next": "g1"
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "D3-2"
    }
   ]
  },
  {
   "id": "D3-2",
   "title": "結論只能蓋住跑過的紙",
   "historyTag": "documented+modern-model",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "格林威治的行星與彗星觀測紙送到。桌上並列反平方規則與本章明列的簡單共轉渦旋版本。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "佛蘭斯蒂德・書信",
     "text": "日期、星位、儀器都寫在紙邊。若要用我的數字改變你的結論，也請留下是哪一夜改變了你。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "牛頓",
     "text": "先把比較規矩寫清楚。同一條定律不能為某顆星臨時改口；每顆星觀測到的起點與速度，也不能被你抹成一樣。",
     "next": "e1"
    },
    {
     "id": "e1",
     "type": "embed",
     "system": "orbit",
     "phase": "models",
     "hint": "先封存公平標準與模型預測，再讓反平方與簡單共轉渦旋各用三組觀測初值一次跑完。",
     "until": {
      "orbit": "k4"
     },
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "哈雷",
     "text": "三組都跑過了。現在選一句，讓它只蓋住我們真的跑過的紙。",
     "next": "n5"
    },
    {
     "id": "n5",
     "type": "line",
     "speaker": "stage",
     "text": "精確封條剛好包住三疊資料與兩個明列模型，不蓋住未測空白。哈雷把記錄、補丁籤、虎克書信與封存預測一起鎖進木匣。",
     "next": "n6"
    },
    {
     "id": "n6",
     "type": "line",
     "speaker": "哈雷",
     "text": "現在去處理最難算的部分。",
     "next": "n7"
    },
    {
     "id": "n7",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "還有比彗星難算的？",
     "next": "n8"
    },
    {
     "id": "n8",
     "type": "line",
     "speaker": "哈雷",
     "text": "人名。",
     "next": "g1"
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "D3-3"
    }
   ]
  },
  {
   "id": "D3-3",
   "title": "印刷台上的名字",
   "historyTag": "documented+reconstruction",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "1686–1687｜倫敦。印刷工把鉛字排進版框；牆上只剩兩個預約窗口，先前的短稿或延後紙也實際掛在牆上。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "印刷工・合成人物",
     "text": "稿子進版框後再整頁重排，花的不只是一張紙。你們看多久都行；只有送樣或延後，才換下一輪。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "牛頓",
     "text": "那就先排證明。",
     "next": "n3a"
    },
    {
     "id": "n3a",
     "type": "line",
     "speaker": "stage",
     "text": "印刷工攤開五處空缺。牛頓把自己的計算放在中央，虎克的信卻被他壓在手肘下面。",
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "哈雷",
     "text": "先把手拿開。",
     "next": "n5"
    },
    {
     "id": "n5",
     "type": "line",
     "speaker": "牛頓",
     "text": "他會說整本都是他的。",
     "next": "n6"
    },
    {
     "id": "n6",
     "type": "line",
     "speaker": "哈雷",
     "text": "這封信不能替你證明三百頁；那三百頁也不能讓這封信不存在。",
     "next": "n7"
    },
    {
     "id": "n7",
     "type": "line",
     "speaker": "牛頓",
     "text": "他會多拿。",
     "next": "n7a"
    },
    {
     "id": "n7a",
     "type": "line",
     "speaker": "哈雷",
     "text": "所以寫清楚。不是寫大方。",
     "next": "n7f"
    },
    {
     "id": "n7f",
     "type": "line",
     "speaker": "哈雷",
     "text": "接好證明，再替虎克寫一句他做過、也只寫到他做過的事。",
     "next": "e1"
    },
    {
     "id": "e1",
     "type": "embed",
     "system": "orbit",
     "phase": "proof",
     "hint": "接好五段證明，替虎克寫出精確貢獻句，分配四項信用，留下機制空白，再親手送出校樣。錯稿會保留，但可繼續重排。",
     "until": {
      "orbit": "k5"
     },
     "next": "n8"
    },
    {
     "id": "n8",
     "type": "line",
     "speaker": "stage",
     "text": "四條來源都接好後，桌上還留著一張沒有年代的空白名條。旅人拿起來，又放下。",
     "next": "n8a"
    },
    {
     "id": "n8a",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "那我呢？",
     "next": "n8b"
    },
    {
     "id": "n8b",
     "type": "line",
     "speaker": "哈雷",
     "text": "你做了什麼？",
     "next": "n8c"
    },
    {
     "id": "n8c",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "重做、試錯，先封住預測，再拿它去碰沒看過的資料。",
     "next": "n8d"
    },
    {
     "id": "n8d",
     "type": "line",
     "speaker": "哈雷",
     "text": "你參與了驗證。但你不是這些想法在這個年代的來源。",
     "next": "n8e"
    },
    {
     "id": "n8e",
     "type": "line",
     "speaker": "哈雷",
     "text": "名字不進這本書。事情進你的筆記。",
     "next": "n8f"
    },
    {
     "id": "n8f",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "我不必成為祕密發明者，才算真的來過。",
     "next": "n8g"
    },
    {
     "id": "n8g",
     "type": "line",
     "speaker": "stage",
     "text": "旅人親手把空白名條移出作者欄，再把本章所有做過、錯過與改過的紙收回筆記。",
     "next": "g1"
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "D3-4"
    }
   ]
  },
  {
   "id": "D3-4",
   "title": "最後一格保持空白",
   "historyTag": "reconstruction",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "印刷機完整壓下。切線、向內偏折、距離律、未揭露預測與跨模型反驗留在紙上；四條信用線各自連回來源；「引力如何作用」保持未填。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "牛頓",
     "text": "我們算出了作用與運動的關係，沒有一頁告訴你它如何穿過空間。空白不是缺頁。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "哈雷",
     "text": "是這本書不冒領的部分。現在它能站了。",
     "next": "n3a"
    },
    {
     "id": "n3a",
     "type": "line",
     "speaker": "牛頓",
     "text": "那就讓別人來找它錯在哪裡。",
     "next": "c1"
    },
    {
     "id": "c1",
     "type": "choice",
     "speaker": "system",
     "text": "紙面先只顯示軌道，不顯示章名。",
     "options": [
      {
       "id": "turn",
       "text": "翻開印出的第一頁",
       "next": "s1"
      }
     ]
    },
    {
     "id": "s1",
     "type": "system",
     "speaker": "system",
     "text": "第四章《月亮的無盡墜落》",
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "它沒有停止下落。它只是每一次落下，都趕上了一個彎走的世界。",
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
     "id": "c1",
     "type": "choice",
     "speaker": "system",
     "text": "最後一張年卡仍停在 1686。",
     "options": [
      {
       "id": "turn",
       "text": "親手翻到 1687",
       "next": "n1"
      }
     ]
    },
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "1687｜倫敦。印刷工把仍帶溫度的書頁攤開。哈雷先摸紙邊是否乾透；牛頓直接翻到計算頁，沒有看封面。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "system",
     "speaker": "system",
     "text": "史實回聲：哈雷的追問促成《論運動》，並在皇家學會財務困難下推動《自然哲學的數學原理》出版；虎克的概念貢獻與優先權爭議、佛蘭斯蒂德的觀測與後來衝突，都沒有因出版自動消失。",
     "next": "n2p"
    },
    {
     "id": "n2p",
     "type": "line",
     "speaker": "哈雷",
     "text": "早先那張短稿沒有提早宣布勝利，卻讓署名問題在正式排版前就有了可查的回應。",
     "require": {
      "flag": [
       "ch4OpeningChoice",
       "partial"
      ]
     },
     "next": "n2d"
    },
    {
     "id": "n2d",
     "type": "line",
     "speaker": "哈雷",
     "text": "第一輪的延後理由仍在。它換來完整反驗，也把署名爭議留到印刷台才處理。",
     "require": {
      "flag": [
       "ch4OpeningChoice",
       "defer"
      ]
     },
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "哈雷",
     "text": "終於不在抽屜裡了。",
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "牛頓",
     "text": "所以麻煩現在才開始。",
     "next": "n5"
    },
    {
     "id": "n5",
     "type": "line",
     "speaker": "哈雷",
     "text": "你怕別人反駁？",
     "next": "n6"
    },
    {
     "id": "n6",
     "type": "line",
     "speaker": "牛頓",
     "text": "我怕他們只讀序言。",
     "next": "n7"
    },
    {
     "id": "n7",
     "type": "line",
     "speaker": "哈雷",
     "text": "那至少我們把路印在裡面了。",
     "next": "n8"
    },
    {
     "id": "n8",
     "type": "line",
     "speaker": "stage",
     "text": "哈雷把虎克書信、佛蘭斯蒂德觀測與自己的編務記錄夾進檔案袋。它們沒有被做成四人和解的合照。",
     "next": "n9"
    },
    {
     "id": "n9",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "這本書會被記成誰的？",
     "next": "n10"
    },
    {
     "id": "n10",
     "type": "line",
     "speaker": "哈雷",
     "text": "封面會回答一種問題。你剛才接回去的那些紙，回答另一種。",
     "next": "n11"
    },
    {
     "id": "n11",
     "type": "line",
     "speaker": "牛頓",
     "text": "只要別把兩種答案混在一起。",
     "next": "n12"
    },
    {
     "id": "n12",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "一本書可以有一個作者。讓它出現的歷史，從來不只一雙手。",
     "next": "e1"
    },
    {
     "id": "e1",
     "type": "embed",
     "system": "orbit",
     "phase": "archive",
     "hint": "把五份證據逐張夾回旅人筆記；每張紙都能翻看成功、錯路與不能證明的部分。",
     "until": {
      "orbit": "archive-complete"
     },
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
     "type": "system",
     "speaker": "system",
     "text": "本章證據收束：月球保留切線前進並持續向地球偏折；反平方距離律把地表落體、月球偏折與行星週期放進同一模型；未揭露預測與跨模型比較比事後相合更有力；來源署名必須寫到精確範圍；可計算規則尚未回答引力機制。",
     "next": "r1"
    },
    {
     "id": "r1",
     "type": "review",
     "prompts": [
      "月亮一直朝著地球掉，為什麼還是沒有掉到地上？",
      "這條規則算對了整片天空，最後卻停在一格空白前面。那格是什麼？為什麼不能硬把它填上？"
     ],
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "stage",
     "text": "印刷工把兩顆鉛字盒推到一起。碰撞後，一盒停得多，另一盒彈得遠；桌上兩張舊帳各寫著不同的「運動之量」。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "剛才那一下，哪一邊保留下來了？",
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "印刷工・合成人物",
     "text": "若我知道，就不必每天重排這些盒子。",
     "next": "n5"
    },
    {
     "id": "n5",
     "type": "line",
     "speaker": "stage",
     "text": "牛頓停了一步，回頭看字盒，卻沒有替下一章回答。",
     "next": "n6"
    },
    {
     "id": "n6",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "知道力怎麼改變一顆物體，還不等於知道兩顆物體相撞時，究竟該守住哪一本帳。",
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
       "text": "寫下：碰撞之後，究竟什麼應該守住？",
       "next": "n7"
      }
     ]
    },
    {
     "id": "n7",
     "type": "line",
     "speaker": "stage",
     "text": "旅人親手寫下：碰撞之後，應該記住帶方向的運動總量，還是記住物體能把重物抬多高、把材料壓多深的能力？",
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
  }
 ]
};
 if (typeof module === "object" && module.exports) { module.exports = data; }
 else { root.GB = root.GB || {}; root.GB.DATA = root.GB.DATA || {}; root.GB.DATA.scenes4 = data; }
})(typeof self !== "undefined" ? self : this);
