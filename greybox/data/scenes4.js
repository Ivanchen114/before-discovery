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
   "title": "問題活得比人久",
   "historyTag": "documented+fictional-bridge",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "白光退去。Cambridge 因瘟疫停課，一位二十二歲的學生回到這片鄉間。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "我只走過三張紙，這裡卻換了一代人。伽利略不在了；那個月亮問題還在。",
     "next": "c1"
    },
    {
     "id": "c1",
     "type": "choice",
     "speaker": "system",
     "text": "1665｜Woolsthorpe, Lincolnshire。",
     "options": [
      {
       "id": "enter",
       "text": "走進果園",
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
   "title": "果園沒有答案",
   "historyTag": "later-recollection+fictional-bridge",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "低雲、果樹、石牆。遠處的月亮還掛在白日天空。一顆蘋果落進草裡，沒有光芒，也沒有頓悟的音樂。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "system",
     "speaker": "system",
     "text": "史實註：蘋果故事來自多年後的回憶。本章保留它提出的問題，不把它當成 1665 年完成理論的即時紀錄。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "Newton",
     "text": "它只走了幾尺。",
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "你在看蘋果？",
     "next": "n5"
    },
    {
     "id": "n5",
     "type": "line",
     "speaker": "Newton",
     "text": "我在看它和月亮之間，那一大段沒有人量過的距離。",
     "next": "n6"
    },
    {
     "id": "n6",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "若地球也拉月亮——",
     "next": "n7"
    },
    {
     "id": "n7",
     "type": "line",
     "speaker": "Newton",
     "text": "先別替它說完。地上的幾尺，還不能替月亮作證。",
     "next": "n8"
    },
    {
     "id": "n8",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "因為中間太遠？",
     "next": "n9"
    },
    {
     "id": "n9",
     "type": "line",
     "speaker": "Newton",
     "text": "將近六十個地球半徑。先量，再說是不是同一件事。",
     "next": "n10"
    },
    {
     "id": "n10",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "我又差點把答案說完。他先攔住了我。",
     "next": "n11"
    },
    {
     "id": "n11",
     "type": "line",
     "speaker": "Newton",
     "text": "先問小一點的問題。若沒有任何東西把月亮往地球改向，它下一刻會去哪裡？",
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
   "title": "月亮本來要去哪裡",
   "historyTag": "modern-model",
   "nodes": [
    {
     "id": "n1",
     "type": "system",
     "speaker": "system",
     "text": "這是為玩家製作的可操作重建，不是 Newton 1665 年桌面的復刻。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "Newton",
     "text": "先拿掉所有吸引。不要猜圓，讓它照原有方向走。",
     "next": "e1"
    },
    {
     "id": "e1",
     "type": "embed",
     "system": "orbit",
     "phase": "tangent",
     "hint": "先讓月亮在完全不偏折的情況下續走，親眼看完它離開。",
     "until": {
      "orbit": "tangent"
     },
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "Newton",
     "text": "沒有作用讓它轉彎，它就沿原來的方向走。",
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "所以圓不是物體本來就會走的路。",
     "next": "n5"
    },
    {
     "id": "n5",
     "type": "line",
     "speaker": "Newton",
     "text": "圓需要每一刻都有事情發生。",
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
   "title": "每一拍，往裡改一點",
   "historyTag": "modern-model",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "Newton",
     "text": "別把它拖回原位。只問這一拍，速度要往哪裡改一點。",
     "next": "e1"
    },
    {
     "id": "e1",
     "type": "embed",
     "system": "orbit",
     "phase": "vectors",
     "hint": "畫三拍偏折。方向或大小錯了，先看完真正路徑，再依後果重試。",
     "until": {
      "orbit": "closed"
     },
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "Newton",
     "text": "你剛才每一步都把月亮拉回原來的位置嗎？",
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
   "title": "讓規則自己走",
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
     "speaker": "Newton",
     "text": "現在可以說：它一直在掉。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "卻沒有掉到地上。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "Newton",
     "text": "因為掉，不是直直撞向中心。它一面前進，一面偏離原來的切線。",
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "落下、弧線、鬆手後留下的前進，第一次站在同一張圖上。",
     "next": "g1"
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
   "title": "一封不肯讓路的信",
   "historyTag": "documented+reconstruction",
   "nodes": [
    {
     "id": "c1",
     "type": "choice",
     "speaker": "system",
     "text": "1665 的工作台仍攤著。下一封信在十四年後。",
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
     "text": "1679｜Cambridge。同一張軌道圖旁多了一封信。紙上兩支箭被圈起：沿切線的直接運動、朝中心的吸引。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "Hooke・書信",
     "text": "天體的運動，可以看成兩種傾向合在一起：一種沿切線直走，一種持續朝中心偏去。若吸引隨距離改變，路徑也會跟著改變。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "system",
     "speaker": "system",
     "text": "史實註：此處為 1679 年 Hooke–Newton 書信內容的白話轉述，不是逐字引文。",
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "Newton",
     "text": "方向說得容易。多少，才是問題。",
     "next": "n5"
    },
    {
     "id": "n5",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "但他把兩支箭放到同一張紙上。",
     "next": "n6"
    },
    {
     "id": "n6",
     "type": "line",
     "speaker": "Newton",
     "text": "所以更不能只靠圖好看。把地上的一秒和月亮的一分鐘放到同一把尺上。",
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
   "title": "六十倍遠，六十秒久",
   "historyTag": "modern-model",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "Newton",
     "text": "先縮放距離，再縮放時間。不要一看到月亮那個數字，就只試你想要的平方。",
     "next": "e1"
    },
    {
     "id": "e1",
     "type": "embed",
     "system": "orbit",
     "phase": "scale",
     "hint": "把尺調到 60 個地球半徑與 60 秒，至少比較兩種距離律，再提出跨尺度斷言。",
     "until": {
      "orbit": "k2"
     },
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "地表一秒落下的量，按距離平方縮弱；放到六十秒，竟和月亮離開切線的量級碰在一起。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "Newton",
     "text": "碰上，不等於證完。它現在只取得下一次冒險的資格。",
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
   "title": "先寫答案，再拆蠟封",
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
     "text": "1684｜Cambridge。Edmond Halley 把 Mars 與 Jupiter 的觀測紙壓在手肘下，數字朝下。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "Halley",
     "text": "假定吸引按距離平方減弱，軌道會是什麼？別告訴我你算過。把預測寫下來，我才翻資料。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "Newton",
     "text": "橢圓。週期也該跟距離有固定關係。",
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "Halley",
     "text": "很好。現在讓你的規則先冒險。",
     "next": "e1"
    },
    {
     "id": "e1",
     "type": "embed",
     "system": "orbit",
     "phase": "planets",
     "hint": "鎖定距離律，在觀測揭露前分別封存 Mars 與 Jupiter 的週期預測。",
     "until": {
      "orbit": "k3"
     },
     "next": "n5"
    },
    {
     "id": "n5",
     "type": "line",
     "speaker": "Halley",
     "text": "這兩張不是掌聲。它們只是證明你在看答案以前，確實說過會發生什麼。",
     "next": "n6"
    },
    {
     "id": "n6",
     "type": "line",
     "speaker": "Newton",
     "text": "那就別停在兩張。拿它去碰更難看的天空。",
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
   "title": "第一輪校樣先到了",
   "historyTag": "reconstruction",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "一張印刷排程壓上工作台。彗星反驗還沒跑完，第一輪校樣位置卻已經到了。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "Halley",
     "text": "現在能誠實送的是月球與行星；彗星和替代模型還空著。你可以送一份範圍較小的短稿，也可以放掉這輪，等鏈條完整。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "Newton",
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
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "Halley",
     "text": "好。窗口怎麼走已經留下紀錄；證據本身沒有被刪掉。現在把兩套模型都放上桌。",
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
   "title": "讓兩種天空都說話",
   "historyTag": "documented+modern-model",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "Greenwich 的行星與彗星觀測紙送到。桌上並列反平方規則與本章明列的簡單共轉渦旋版本。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "Flamsteed・書信",
     "text": "日期、星位、儀器都寫在紙邊。若要用我的數字改變你的結論，也請留下是哪一夜改變了你。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "Newton",
     "text": "月球一項，兩邊都能說。把行星和彗星也放進去。",
     "next": "e1"
    },
    {
     "id": "e1",
     "type": "embed",
     "system": "orbit",
     "phase": "models",
     "hint": "讓反平方與簡單共轉渦旋都跑過 Moon、Planets、Comet，再比較殘差與新增補丁。",
     "until": {
      "orbit": "k4"
     },
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "渦旋沒有在月球那一格立刻失效；差別出現在它跨到行星和彗星時，要多補幾條規則。",
     "next": "n5"
    },
    {
     "id": "n5",
     "type": "line",
     "speaker": "Newton",
     "text": "這足以比較這兩個版本。別把它寫成我們已經消滅所有可能的介質模型。",
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
   "title": "把證明送進印刷台",
   "historyTag": "documented+reconstruction",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "1686｜證明桌旁，印刷工把剩餘校樣窗口與曾經送出的短稿、延後紙條一起釘上牆。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "印刷工・合成人物",
     "text": "字排進版框後若整頁重來，紙、鉛字和下一家的工作都得重新挪。你們看多久都行；只有送樣或延後，才換下一輪。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "Newton",
     "text": "Hooke 卻說整件事都是他的。",
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "Halley",
     "text": "他提出過重要方向。這不等於他寫了你的證明；也不等於你的證明可以擦掉他的信。把每種工作記在對的人名下。",
     "next": "n5"
    },
    {
     "id": "n5",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "我的名字放哪裡？",
     "next": "n6"
    },
    {
     "id": "n6",
     "type": "line",
     "speaker": "Halley",
     "text": "你重做、試錯、鎖下預測。那就寫在你的筆記，別把自己塞進他們的年代。",
     "next": "n7"
    },
    {
     "id": "n7",
     "type": "line",
     "speaker": "Halley",
     "text": "最後一句最危險。規則算得準，不代表我們已經知道引力如何穿過空間。",
     "next": "e1"
    },
    {
     "id": "e1",
     "type": "embed",
     "system": "orbit",
     "phase": "proof",
     "hint": "接好五段證明、分配四項信用、留下機制空白，再親手送出校樣。錯稿會保留，但可繼續重排。",
     "until": {
      "orbit": "k5"
     },
     "next": "n8"
    },
    {
     "id": "n8",
     "type": "line",
     "speaker": "Newton",
     "text": "留下空白不是失敗。那只是不讓不知道冒充知道。",
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
   "title": "能算到哪裡，就停在哪裡",
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
     "speaker": "Halley",
     "text": "這一版能站了。趕上，不是因為印刷機催得夠兇；延後，也不是因為證據輸了。差別只在我們有沒有讓鉛字跑到證明前面。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "Newton",
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
   "title": "一冊書不是一個人的手",
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
     "text": "1687｜《Philosophiæ Naturalis Principia Mathematica》付梓。手稿、校樣、Halley 的編務痕跡與印刷頁並列。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "system",
     "speaker": "system",
     "text": "史實回聲：Halley 的追問促成《De motu》，並在 Royal Society 財務困難下推動《Principia》出版；Hooke 的概念貢獻與優先權爭議、Flamsteed 的觀測與後來衝突，都沒有因出版自動消失。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "Halley",
     "text": "現在它不只屬於抽屜。別人可以讀、可以算，也可以找它錯在哪裡。",
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "Newton",
     "text": "那通常比稱讚來得快。",
     "next": "n5"
    },
    {
     "id": "n5",
     "type": "line",
     "speaker": "Halley",
     "text": "很好。一本不能被攻擊的書，多半也沒有說清楚自己在主張什麼。",
     "next": "n6"
    },
    {
     "id": "n6",
     "type": "line",
     "speaker": "旅人・心聲",
     "text": "地上的落下和天上的繞行，終於能用同一把尺算了。可這把尺再強，也沒有把往後的問題封住。",
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
   "title": "旅人筆記・M 線末頁",
   "historyTag": "modern-model",
   "nodes": [
    {
     "id": "n1",
     "type": "system",
     "speaker": "system",
     "text": "本章證據收束：月球保留切線前進並持續向地球偏折；反平方距離律把地表落體、月球偏折與行星週期放進同一模型；未揭露預測與跨模型比較比事後相合更有力；可計算規則尚未回答引力機制。",
     "next": "r1"
    },
    {
     "id": "r1",
     "type": "review",
     "prompts": [
      "若地球突然不再吸引月球，月球下一刻會往哪裡走？為什麼？",
      "本章建立了什麼規則，又還沒有解釋什麼？"
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
     "speaker": "旅人・心聲",
     "text": "知道力如何改變一顆物體的運動，還不等於知道兩顆物體相撞時，究竟什麼應該守住。",
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "system",
     "speaker": "system",
     "text": "下一個未解問題：碰撞之後，應該記住帶方向的運動總量，還是記住物體能把重物抬多高、把材料壓多深的能力？",
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
