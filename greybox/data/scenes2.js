/* data/scenes2.js — 第二章場景執行載體（file:// 相容）。規範鏡像:scenes2.json。
   ⚠ 本檔為生成物；請改 scenes2.json 後執行 node tools/build-ch2-data.mjs。 */
(function (root) {
 "use strict";
 var data = {
 "chapter": "ch2",
 "startScene": "B0-1",
 "evidenceNames": {
  "F1": "船桅思想實驗",
  "F2": "桌緣彈射・平方根律",
  "F3": "一拋一放・近乎同時落地",
  "F4": "墨跡曲線",
  "F5": "邊界論證鏈",
  "S3": "塔爾塔利亞砲術圖",
  "S4": "Guidobaldo 的實驗筆記(抄頁)"
 },
 "lab2LawConcepts": [
  {
   "id": "sqrtScale",
   "label": "平方根關係：高度 ×4，射程約 ×2"
  },
  {
   "id": "linearScale",
   "label": "正比關係：高度 ×4，射程約 ×4"
  },
  {
   "id": "constantRange",
   "label": "無關：高度改變，射程仍差不多"
  }
 ],
 "lint": {
  "note": "R-NAR2 三軌(規格 v0.1.1 §七):player-naming=拋物線(命名前全字串禁)/player-hypothesis=√・平方根・開方(僅 B2-3.r2 或押中事件)/resolution-qualified=同時落地(須條件句)。M1(B0–B1)合法狀態=零受管詞;entries 於 M2 起隨節點登錄。",
  "terms": {
   "parabola": [
    "拋物線"
   ],
   "sqrt": [
    "平方根",
    "開方",
    "√"
   ],
   "simul": [
    "同時落地"
   ]
  },
  "entries": [
   {
    "nodeId": "B2-3/q1.r2",
    "term": "開方",
    "class": "player-hypothesis",
    "revealKey": "revealSqrt"
   },
   {
    "nodeId": "B2-3/n4",
    "term": "√",
    "class": "revealed-after-player",
    "requiresReveal": "revealSqrt"
   },
   {
    "nodeId": "B2-3/n4",
    "term": "平方",
    "class": "revealed-after-player",
    "requiresReveal": "revealSqrt"
   },
   {
    "nodeId": "B2-3/n4",
    "term": "平方根",
    "class": "revealed-after-player",
    "requiresReveal": "revealSqrt"
   },
   {
    "nodeId": "lab2LawConcepts.sqrtScale.label",
    "term": "平方根",
    "class": "player-hypothesis",
    "revealKey": "revealSqrt"
   },
   {
    "nodeId": "B2-3/s2",
    "term": "平方根",
    "class": "revealed-after-player",
    "requiresReveal": "revealSqrt"
   },
   {
    "nodeId": "B2-5/n2",
    "term": "平方根",
    "class": "revealed-after-player",
    "requiresReveal": "revealSqrt"
   },
   {
    "nodeId": "B2-5/n5",
    "term": "平方根",
    "class": "revealed-after-player",
    "requiresReveal": "revealSqrt"
   },
   {
    "nodeId": "B2-3/s2",
    "term": "√",
    "class": "revealed-after-player",
    "requiresReveal": "revealSqrt"
   },
   {
    "nodeId": "B2-4/q4.a",
    "term": "同時落地",
    "class": "resolution-qualified",
    "conditionText": "在這機關聽得出的範圍內"
   },
   {
    "nodeId": "B2-4/s1",
    "term": "同時落地",
    "class": "resolution-qualified",
    "conditionText": "近乎;本機關解析度內"
   },
   {
    "nodeId": "debate2.pillars.P3.playerCorrect",
    "term": "平方根",
    "class": "revealed-after-player",
    "requiresReveal": "revealSqrt"
   },
   {
    "nodeId": "debate2.fr.explore.stepsLocal.0.options.a.text",
    "term": "開方",
    "class": "revealed-after-player",
    "requiresReveal": "revealSqrt"
   },
   {
    "nodeId": "debate2.fr.explore.stepsInherited.0.options.a.text",
    "term": "開方",
    "class": "revealed-after-player",
    "requiresReveal": "revealSqrt"
   },
   {
    "nodeId": "debate2.fr.scholar.correctInherited.c1.text",
    "term": "平方根",
    "class": "revealed-after-player",
    "requiresReveal": "revealSqrt"
   },
   {
    "nodeId": "debate2.fr.scholar.correctLocal.c1.text",
    "term": "平方根",
    "class": "revealed-after-player",
    "requiresReveal": "revealSqrt"
   },
   {
    "nodeId": "debate2.fr.scholar.correctLocal.c2.text",
    "term": "同時落地",
    "class": "resolution-qualified",
    "conditionText": "近乎;裝置能分辨"
   }
  ]
 },
 "scenes": [
  {
   "id": "B0-1",
   "title": "工作室門口(清晨)",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "帕多瓦的春天。運河水氣。敲門聲——不急,不重。一下,一下。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "stage",
     "text": "門開。辛普里奧,76 歲。銀鬚更白,腰桿沒彎。臂彎裡,那一冊《物理學》。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "伽利略",
     "text": "(刨到一半的木料還在手上)……教授。",
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "辛普里奧",
     "text": "伽利萊教授。(微一頷首,目光掠過旅人,停了半拍)還有你。四年了——你還是一天都沒老。老夫已經懶得問了。",
     "next": "n5"
    },
    {
     "id": "n5",
     "type": "line",
     "speaker": "stage",
     "text": "他沒等邀請,就自己走到長桌前,把《物理學》端端正正放下。翻開——夾在書頁裡的,正是四年前那頁數據紙。舊墨跡旁,密密麻麻,添了另一種筆跡的批註。",
     "next": "n6"
    },
    {
     "id": "n6",
     "type": "line",
     "speaker": "辛普里奧",
     "text": "老夫讀完了。(抬眼)有一個問題。",
     "next": "g1"
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "B0-2"
    }
   ]
  },
  {
   "id": "B0-2",
   "title": "砲術圖",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "辛普里奧",
     "text": "你們的數字,老夫一行一行驗過。斜面上的結果——無可反駁。(自袖中取出一張折紙,展開:一幅砲術圖,軌跡分三段——直線上升、一段圓弧、鉛直墜落)可是——(指圖)這是砲手畫的。塔爾塔利亞的書,關係著千萬砲手的性命。拋出去的東西:先直飛,力用盡了,才往下墜。(直視旅人)你們的「時間平方」——管得到天上飛的東西嗎?",
     "next": "q1"
    },
    {
     "id": "q1",
     "type": "choice",
     "speaker": "system",
     "text": "你回答:",
     "options": [
      {
       "id": "a",
       "text": "「管得到。」",
       "next": "na1",
       "effects": [
        {
         "rep": -1
        }
       ]
      },
      {
       "id": "b",
       "text": "(先看那張圖)",
       "next": "nb1"
      }
     ]
    },
    {
     "id": "na1",
     "type": "line",
     "speaker": "辛普里奧",
     "text": "(不怒)四年前,也有人想用一句話贏老夫。(合上書)後來,他改用了數字。",
     "next": "q1"
    },
    {
     "id": "nb1",
     "type": "line",
     "speaker": "stage",
     "text": "細看:三段軌跡的接縫生硬;弧段短得吝嗇。",
     "next": "nb2"
    },
    {
     "id": "nb2",
     "type": "line",
     "speaker": "旅人",
     "text": "這圖……是畫給瞄準用的,不是畫給真相用的。",
     "next": "nb3"
    },
    {
     "id": "nb3",
     "type": "line",
     "speaker": "辛普里奧",
     "text": "瞄不準,砲手就會送命。先別急著輕看它。",
     "next": "s1"
    },
    {
     "id": "s1",
     "type": "system",
     "speaker": "system",
     "text": "信譽 +1。取得證據：塔爾塔利亞砲術圖。",
     "next": "n2",
     "effects": [
      {
       "rep": 1
      },
      {
       "evidence": "S3"
      }
     ]
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "伽利略",
     "text": "(放下刨刀,走過來,看圖,很久)教授——你這一問,值一場辯論。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "辛普里奧",
     "text": "老夫正有此意。三月後,大學講堂。(把書抱回臂彎)這一回,老夫也帶數字來。",
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "stage",
     "text": "他走到門口,停了一步,沒有回頭。",
     "next": "n5"
    },
    {
     "id": "n5",
     "type": "line",
     "speaker": "辛普里奧",
     "text": "數據紙,老夫收下了。批註若有錯——來信。",
     "next": "s2"
    },
    {
     "id": "s2",
     "type": "system",
     "speaker": "system",
     "text": "旅人筆記章節頁:「第二章。這次,是他先出題。」",
     "next": "g1"
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "B1-1"
    }
   ]
  },
  {
   "id": "B1-1",
   "title": "眼睛的證詞(工作室,夜)",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "伽利略",
     "text": "(把砲術圖釘在牆上)先別笑這張圖。你自己丟一顆石子,眼睛告訴你什麼?出手——直。末了——墜。中間那段彎,眼睛根本抓不住。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "旅人",
     "text": "所以砲手的圖是——",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "伽利略",
     "text": "錯的。但它是誠實的錯:照著眼睛,一筆一筆畫的。(敲敲圖上那段直線)要贏這種錯,不能罵它瞎——得讓軌跡自己現形。",
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "旅人",
     "text": "那真正的軌跡是——",
     "next": "n5"
    },
    {
     "id": "n5",
     "type": "line",
     "speaker": "伽利略",
     "text": "(舉手,止住)別說。(笑)四年前你就想直接說答案。這回,我們讓它自己畫給我們看。",
     "next": "s1"
    },
    {
     "id": "s1",
     "type": "system",
     "speaker": "system",
     "text": "筆記:「誠實的錯,最難打。它有眼睛作證。」",
     "next": "g1"
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "B1-2"
    }
   ]
  },
  {
   "id": "B1-2",
   "title": "船桅(思想實驗,雨夜)",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "伽利略",
     "text": "先拆他理論的一塊地基。他遲早會說:一件物體在同一時間,只能有一種運動。來,還是那個老問題。(比劃)想像一條船順流而下,速度不變,穩得像桌面。我們從桅頂放下一顆球——它會落在哪裡?",
     "next": "q1"
    },
    {
     "id": "q1",
     "type": "choice",
     "speaker": "system",
     "text": "球落在哪?",
     "options": [
      {
       "id": "a",
       "text": "「桅杆正下方(桅腳)。」",
       "next": "na1"
      },
      {
       "id": "b",
       "text": "「船尾——球下落時,船已經往前跑了。」",
       "next": "nb1"
      }
     ]
    },
    {
     "id": "nb1",
     "type": "line",
     "speaker": "伽利略",
     "text": "船往前走了——球為什麼不能跟著走?它待在桅頂時,本來就和船一起前進。鬆手的那一瞬,誰把它原來的「前行」拿走了?",
     "next": "q1"
    },
    {
     "id": "na1",
     "type": "line",
     "speaker": "伽利略",
     "text": "桅腳。(點頭)球保留著船給它的前行,同時往下落——同一顆球,同一段時間,做了兩件事。(停頓)誰說前行和下墜不能同時發生?",
     "next": "nsch1"
    },
    {
     "id": "nsch1",
     "type": "line",
     "speaker": "伽利略",
     "text": "那麼——岸上的人,會看見球走出什麼形狀?",
     "next": "qsch",
     "mode": "scholar"
    },
    {
     "id": "qsch",
     "type": "choice",
     "speaker": "system",
     "text": "你答:",
     "mode": "scholar",
     "options": [
      {
       "id": "a",
       "text": "「一道彎。又前,又下。」",
       "next": "nsch2"
      }
     ],
     "next": "s1"
    },
    {
     "id": "nsch2",
     "type": "line",
     "speaker": "伽利略",
     "text": "記住這道彎。先不給它名字。",
     "next": "s1",
     "mode": "scholar"
    },
    {
     "id": "s1",
     "type": "system",
     "speaker": "system",
     "text": "取得證據：船桅思想實驗。筆記：「前行與下墜，可以同時發生。」",
     "next": "g1",
     "effects": [
      {
       "evidence": "F1"
      }
     ]
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "B1-3"
    }
   ]
  },
  {
   "id": "B1-3",
   "title": "死路 A:歸檔(大學迴廊,翌日)",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "簡易演示已備:兩顆輕重不同的球,同高同放——近乎同落,只差一線。第一章的老證據。旅人與伽利略把這一手帶去給客座講學的辛普里奧。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "辛普里奧",
     "text": "(聽完,看完,竟點頭)同落?自然。(翻到一頁夾籤——上面抄的正是四年前的數據)這是四年前的舊案,老夫早已記在書裡,不打算重審。(合上書)今天老夫談的是前行的力——力灌進球裡,力用盡,前行才停止。你們量的是「落」。(把那顆演示球輕輕推回)老夫問的是「飛」。你們答錯題了。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "stage",
     "text": "學生們安靜地記筆記。沒有人竊笑——這次連嘲弄都省了。",
     "next": "s1"
    },
    {
     "id": "s1",
     "type": "system",
     "speaker": "system",
     "text": "筆記重重寫下:「他變強了。四年前他吃掉反例;現在,他把反例分類歸檔。」",
     "next": "g1"
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "B1-4"
    }
   ]
  },
  {
   "id": "B1-4",
   "title": "撞牆(運河邊)",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "伽利略",
     "text": "(把石子拋進水裡,一顆,又一顆)他說得對,你知道嗎。同落打不中他——他的理論根本沒把「落的時間」押在桌上。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "旅人",
     "text": "那他押了什麼?",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "伽利略",
     "text": "(拋石子的手停住)飛。前行怎麼衰、軌跡什麼形、飛多遠——那才是「推力(impetus)」理論押的注。(轉頭)所以問題變了:不是「它會不會同落」,而是——拋出去的東西,究竟走哪條路?走多遠?",
     "next": "s1"
    },
    {
     "id": "s1",
     "type": "system",
     "speaker": "system",
     "text": "第一幕終。筆記:「打正面。要軌跡,要射程。」",
     "next": "g1"
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "B2-1"
    }
   ]
  },
  {
   "id": "B2-1",
   "title": "Guidobaldo 的筆記(抄頁)",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "伽利略在木箱底翻出一冊手抄的筆記頁——邊角磨圓了。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "伽利略",
     "text": "十六年前。Guidobaldo 侯爵——我的老恩主,引我到帕多瓦的人,也是我見過最捨得弄髒手的貴族。(翻開一頁)那年我們把球沾了墨,沿一塊立得近乎直、卻仍托得住球的斜板,斜斜推上去。墨跡拖出一道彎——他在筆記裡記:「像倒掛的鏈子。」這一頁,是我離開前抄下的。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "旅人",
     "text": "你們早就畫過它了。",
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "伽利略",
     "text": "畫過,沒算過。(把抄頁拍在桌上)現在,補課。",
     "next": "s1"
    },
    {
     "id": "s1",
     "type": "system",
     "speaker": "system",
     "text": "取得證據：Guidobaldo 的實驗筆記（抄頁）。筆記：「又一次——不是一個人在想。」",
     "next": "g1",
     "effects": [
      {
       "evidence": "S4"
      }
     ]
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "B2-2"
    }
   ]
  },
  {
   "id": "B2-2",
   "title": "墨跡曲線",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "重做:斜板立得近乎直,仍托著球。沾墨的球沿板面斜推而上、彎回、落下。墨線蜿蜒——",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "伽利略",
     "text": "(退開一步,把尺遞給旅人)別問我。你看——這條線,從哪裡開始彎?",
     "next": "q1"
    },
    {
     "id": "q1",
     "type": "choice",
     "speaker": "system",
     "text": "你持尺,沿墨線比對——最早開始彎的位置在:",
     "options": [
      {
       "id": "a",
       "text": "「從離手第一寸,就在彎。」",
       "next": "na1"
      },
      {
       "id": "b",
       "text": "「前段有一小段直,之後才彎。」",
       "next": "nb1"
      }
     ]
    },
    {
     "id": "nb1",
     "type": "line",
     "speaker": "伽利略",
     "text": "(不說話,把直尺貼上墨線起段)尺不會客氣。你再看。(尺與墨線之間,漏進一線光)",
     "next": "q1"
    },
    {
     "id": "na1",
     "type": "line",
     "speaker": "旅人",
     "text": "(用指節沿線比到底)……彎的。整條線,找不到一段直。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "伽利略",
     "text": "一寸都沒有。(把砲術圖拿下來,並排釘上)砲手的第一段直線——是眼睛替匠人省略的筆畫。",
     "next": "s1"
    },
    {
     "id": "s1",
     "type": "system",
     "speaker": "system",
     "text": "取得證據：墨跡曲線。筆記：「曲線，從第一寸開始——是我用尺量過才敢說的。」",
     "next": "g1",
     "effects": [
      {
       "evidence": "F4"
      }
     ]
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "B2-3"
    }
   ]
  },
  {
   "id": "B2-3",
   "title": "桌緣彈射(核心實驗,連日)",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "裝置:短斜槽接平桌,球自槽上固定刻度釋放、滾過桌面、飛離桌緣,落在鋪細沙的長盤裡。沙盤可升降——改的是桌沿到沙面的下落高度。沙上留痕,量水平射程。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "伽利略",
     "text": "先讓發射器閉嘴:同一刻度,出手就是同一個速度。它穩了,才輪得到真正的問題——(搖動沙盤的升降架)掉得愈深,飛得愈遠——遠多少?",
     "next": "e1"
    },
    {
     "id": "e1",
     "type": "embed",
     "system": "catapult",
     "until": {
      "cat": "threeH"
     },
     "hint": "確認固定骨架、選好三個可換部位並完成兩項校準，再用同一顆銅球放完 4、9、16 格三個下落高度",
     "next": "q1"
    },
    {
     "id": "q1",
     "type": "choice",
     "speaker": "伽利略",
     "text": "(把紀錄推過來)你看出什麼?",
     "options": [
      {
       "id": "r1",
       "text": "「高度翻四倍……射程翻兩倍。」",
       "next": "n3"
      },
      {
       "id": "r2",
       "text": "「射程,像是下落高度的開方。」",
       "next": "n3",
       "effects": [
        {
         "flag": [
          "revealSqrt",
          "1"
         ]
        }
       ]
      }
     ]
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "伽利略",
     "text": "是嗎?(把沙盤又降下一段,新釘一格)下落高度二十五格——射程,你說多少?",
     "next": "e2"
    },
    {
     "id": "e2",
     "type": "embed",
     "system": "catapult",
     "until": {
      "f2": "law"
     },
     "hint": "先押 25 格並親手放球;結果通過後,再選一組數據與它支持的概念提出斷言",
     "next": "s1"
    },
    {
     "id": "s1",
     "type": "system",
     "speaker": "system",
     "text": "(玩家已選定一組可用數據,並親自提出斷言——系統記下引用來源。)",
     "next": "n4",
     "effects": [
      {
       "flag": [
        "revealSqrt",
        "1"
       ]
      }
     ]
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "伽利略",
     "text": "(盯著沙盤,很久)出手的速度沒變——變的只有「掉多深」。下墜距離跟著時間的平方走;前進距離只跟時間的一次方走。掉得愈久,球就往前跑得愈遠——所以射程跟下落高度的平方根有關。(抬頭)這組數字像是在說:前進與下墜各按自己的鐘走——但一組射程還不夠。先換球堵住重量,接著直接測:往前飛,會不會讓它晚一點落地?",
     "next": "n5"
    },
    {
     "id": "n5",
     "type": "line",
     "speaker": "伽利略",
     "text": "(忽然壓低嗓子,學那個熟悉的腔調)——「妙哉。然此乃銅球之弧。焉知非重者獨有之飛法?」(拋來一顆同樣大小的木球)他真的會這樣問。同一個尺寸,重量差七倍——接好。",
     "next": "e3"
    },
    {
     "id": "e3",
     "type": "embed",
     "system": "catapult",
     "until": {
      "f2": "ball"
     },
     "hint": "同裝置、同刻度,木球走完 4/9/16、押 25;完成後在紀錄簿對兩組成立紀錄斷言比較",
     "next": "n6"
    },
    {
     "id": "n6",
     "type": "line",
     "speaker": "伽利略",
     "text": "銅的這道彎,木的這道彎——同一副骨架。",
     "next": "s2"
    },
    {
     "id": "s2",
     "type": "system",
     "speaker": "system",
     "text": "取得證據：桌緣彈射・平方根律（含換球複驗）。筆記大字：「同介質、同外形同徑、同發射設定下：射程∝√下落高度，形式不隨球重改變。」",
     "next": "g1"
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "B2-4"
    }
   ]
  },
  {
   "id": "B2-4",
   "title": "一拋一放・落地比較",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "機關:桌緣一座小門閂——扳下,同時做兩件事:把一球水平推離桌緣、放另一球原地自由落下。兩球同高、同形、低速短程。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "伽利略",
     "text": "(把門閂讓出來)還是老規矩——不是看,是聽。你來扳。",
     "next": "q1"
    },
    {
     "id": "q1",
     "type": "choice",
     "speaker": "system",
     "text": "第一輪。",
     "options": [
      {
       "id": "a",
       "text": "(扳下門閂)",
       "next": "np1"
      }
     ]
    },
    {
     "id": "np1",
     "type": "line",
     "speaker": "stage",
     "text": "一顆飛出老遠,一顆直墜腳邊——兩聲,近得分不開。",
     "next": "q2"
    },
    {
     "id": "q2",
     "type": "choice",
     "speaker": "system",
     "text": "墊高。第二輪。",
     "options": [
      {
       "id": "a",
       "text": "(扳下門閂)",
       "next": "np2"
      }
     ]
    },
    {
     "id": "np2",
     "type": "line",
     "speaker": "stage",
     "text": "仍分不開。",
     "next": "q3"
    },
    {
     "id": "q3",
     "type": "choice",
     "speaker": "system",
     "text": "再墊高。第三輪。",
     "options": [
      {
       "id": "a",
       "text": "(扳下門閂)",
       "next": "np3"
      }
     ]
    },
    {
     "id": "np3",
     "type": "line",
     "speaker": "stage",
     "text": "在這座機關聽得出的範圍裡,還是分不開。",
     "next": "q4"
    },
    {
     "id": "q4",
     "type": "choice",
     "speaker": "system",
     "text": "三輪紀錄在案——你的判讀:",
     "options": [
      {
       "id": "a",
       "text": "「在這機關聽得出的範圍內,兩球同時落地。」",
       "next": "na1"
      },
      {
       "id": "b",
       "text": "「飛遠的那顆,晚了一點。」",
       "next": "nb1"
      }
     ]
    },
    {
     "id": "nb1",
     "type": "line",
     "speaker": "伽利略",
     "text": "(把紀錄推回)你的耳朵記的是「分不開」,三輪都是。晚了一點——是聽見的,還是猜的?",
     "next": "q4"
    },
    {
     "id": "na1",
     "type": "line",
     "speaker": "旅人",
     "text": "不管往前飛多遠,都量不到它延後落地。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "伽利略",
     "text": "如果物體真的要等推力用盡才下墜,飛得遠的那顆就該讓我們聽見它晚一點落地——可是三輪,一次都沒有。這把結果當成原因了:下墜從離手那一刻就開始,不必等推力用完。(指向三輪紀錄)現在才有資格說:至少在這套裝置聽得出的範圍內,水平前進沒有拖慢垂直下墜。",
     "next": "s1"
    },
    {
     "id": "s1",
     "type": "system",
     "speaker": "system",
     "text": "取得證據：一拋一放・近乎同時落地。筆記：「如果下墜需要等待，向前飛的球就該晚落；但三輪都量不到延後。下墜從離手時就開始。（同高、同形、低速短程；本裝置能分辨的範圍內）」",
     "next": "g1",
     "effects": [
      {
       "evidence": "F3"
      }
     ]
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "B2-5"
    }
   ]
  },
  {
   "id": "B2-5",
   "title": "幕間(工作室,夜)",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "牆上:砲術圖、墨跡板、沙盤紀錄、批註滿的舊數據紙——並排。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "伽利略",
     "text": "船桅、墨跡、平方根、分不開的兩聲。(逐一點過去)四樣都在了——但四張紙還不是一套說法。上辯論台以前,你把它們排成一條。",
     "next": "q1"
    },
    {
     "id": "q1",
     "type": "choice",
     "speaker": "system",
     "text": "模型組裝・第一步:同高一推一放,三輪都聽不出先後。我們能說到哪裡?",
     "options": [
      {
       "id": "a",
       "text": "在這套裝置內,水平推出沒有造成可測的落地延遲。",
       "next": "n3"
      },
      {
       "id": "b",
       "text": "所有物體在任何情況下,落地都會絕對不分先後。",
       "next": "w1b"
      },
      {
       "id": "c",
       "text": "向前飛的球一定比直接落下的球更晚落地。",
       "next": "w1c"
      }
     ]
    },
    {
     "id": "w1b",
     "type": "line",
     "speaker": "伽利略",
     "text": "我們只能說這套裝置聽得出來的事。「任何情況」——那是沒量過的地方。",
     "next": "q1"
    },
    {
     "id": "w1c",
     "type": "line",
     "speaker": "伽利略",
     "text": "那三輪分不開的落地聲,正好不支持這句話。讀紀錄,別讀直覺。",
     "next": "q1"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "伽利略",
     "text": "對。先守住量到的邊界。",
     "next": "q2"
    },
    {
     "id": "q2",
     "type": "choice",
     "speaker": "system",
     "text": "模型組裝・第二步:下落高度變成四倍。依第一章的時間平方,飛行時間會變成幾倍?",
     "options": [
      {
       "id": "a",
       "text": "兩倍。",
       "next": "n4"
      },
      {
       "id": "b",
       "text": "四倍。",
       "next": "w2"
      }
     ]
    },
    {
     "id": "w2",
     "type": "line",
     "speaker": "伽利略",
     "text": "垂直距離跟時間的平方走。距離四倍,時間只要兩倍。",
     "next": "q2"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "旅人",
     "text": "下落高度四倍,飛行時間兩倍。",
     "next": "q3"
    },
    {
     "id": "q3",
     "type": "choice",
     "speaker": "system",
     "text": "模型組裝・第三步:出手速度固定,飛行時間變兩倍。水平射程應變成幾倍?",
     "options": [
      {
       "id": "a",
       "text": "兩倍。",
       "next": "n5"
      },
      {
       "id": "b",
       "text": "四倍。",
       "next": "w3"
      }
     ]
    },
    {
     "id": "w3",
     "type": "line",
     "speaker": "伽利略",
     "text": "出手速度沒變,前進距離只跟時間的一次方走。再算一次。",
     "next": "q3"
    },
    {
     "id": "n5",
     "type": "line",
     "speaker": "旅人",
     "text": "(把四張紙串成一列)垂直距離跟時間平方走,水平距離跟時間一次方走。兩者同時進行;所以軌跡從第一寸就在彎,固定出手時,射程才會符合下落高度的平方根關係。",
     "next": "n6"
    },
    {
     "id": "n6",
     "type": "line",
     "speaker": "伽利略",
     "text": "(把辛普里奧的講堂告示拍上牆——是教授自己貼的,字跡端正)現在才是一套說法。他等這場,比我們還久。",
     "next": "s1"
    },
    {
     "id": "s1",
     "type": "system",
     "speaker": "system",
     "text": "第二幕終。船桅思想實驗、桌緣彈射、一拋一放與墨跡曲線都已收入旅人筆記。",
     "next": "g1"
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "B3-1"
    }
   ]
  },
  {
   "id": "B3-1",
   "title": "他帶數字來(大學講堂,1608 夏)",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "座無虛席。白髮更多的長老主持。辛普里奧入席——這次,他自己帶了一疊計算紙,壓在《物理學》下面。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "主持",
     "text": "今日論題:論拋體之運動。辛普里奧教授立論;伽利萊教授與其同伴質詢。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "辛普里奧",
     "text": "(環視,把數據紙的批註頁攤開在講台)先定一條規矩:今天,誰的話超出證據——無論是誰——都算失分。(看向旅人,眼裡有一點四年前沒有的東西,像是期待)這規矩,是老夫從你們身上學來的。",
     "next": "s1"
    },
    {
     "id": "s1",
     "type": "system",
     "speaker": "system",
     "text": "說服力量表:5。錯誤出示 −1;歸零中止 → 與伽利略複盤論證後再入(已破支柱保留;非缺實驗,是配對失準)。",
     "next": "g1",
     "effects": [
      {
       "debate": "init"
      }
     ]
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "B3-D"
    }
   ]
  },
  {
   "id": "B3-D",
   "title": "論拋體之運動(辯論)",
   "nodes": [
    {
     "id": "e1",
     "type": "embed",
     "system": "debate",
     "until": {
      "debateWon": true
     },
     "suspendNext": "gF",
     "hint": "追問找線索,出示(證據×目標證詞)擊破三柱;最後反撲:先讀他的資料,再答他的問題。",
     "next": "gW"
    },
    {
     "id": "gF",
     "type": "goto",
     "scene": "B3-F"
    },
    {
     "id": "gW",
     "type": "goto",
     "scene": "B3-6"
    }
   ]
  },
  {
   "id": "B3-F",
   "title": "辯論中止(複盤)",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "主持",
     "text": "今日論辯,質詢方失序,到此為止。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "辛普里奧",
     "text": "(收拾計算紙,語氣平平)你們的證據,老夫都看見了——就擺在你們桌上。(離席前,留下一句)只是出示錯了地方。回去想想,每張證據究竟能反駁哪一句話。想清楚了,老夫隨時再來。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "伽利略",
     "text": "(把玩家的證據一字排開,對齊三根支柱的抄錄)東西都在。剛剛亂的不是手,是對位。再走一遍——這句話,哪張紙咬得住?",
     "next": "e1"
    },
    {
     "id": "e1",
     "type": "embed",
     "system": "debrief",
     "until": {},
     "hint": "複盤剛才用錯的證據與證詞配對;證據、已破支柱與判讀成功步完整保留。整理好就重返辯論會。",
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "system",
     "speaker": "system",
     "text": "(複盤完成——說服力重置;已破的支柱與敵方資料判讀成功步,不必重做。)",
     "next": "g1",
     "effects": [
      {
       "debate": "reenter"
      }
     ]
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "B3-D"
    }
   ]
  },
  {
   "id": "SC-R1",
   "title": "修復:用乾淨紀錄道歉",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "(關鍵人物暫時拒絕與你交談。)伽利略把彈射台的沙盤耙平,推到旅人面前。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "伽利略",
     "text": "在這座城市,道歉不用嘴。(指彈射台)我要重新做一次乾淨的紀錄——你來放球。校準過的裝置、老老實實的沙痕,拿來。",
     "next": "e1"
    },
    {
     "id": "e1",
     "type": "embed",
     "system": "catapult",
     "until": {
      "repairRun": true
     },
     "hint": "用乾淨(全件到位+雙校準)的裝置放一次球,把紀錄帶回,劇情繼續。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "system",
     "speaker": "system",
     "text": "信譽回復至 1。筆記:「話說錯了可以收回;數據不會。所以他們只信數據。」",
     "next": "r1",
     "effects": [
      {
       "rep": 1
      },
      {
       "flagClear": "repLocked"
      }
     ]
    },
    {
     "id": "r1",
     "type": "return"
    }
   ]
  },
  {
   "id": "B3-6",
   "title": "判定:交換批註",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "辛普里奧沒有坐下。他把自己那疊計算紙——整整齊齊——推過講台,推向伽利略。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "辛普里奧",
     "text": "老夫的數據。你們拿去核對。(整袍)有錯——來信。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "伽利略",
     "text": "(起身,鄭重接過)教授的批註,我也核。有錯,來信。",
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "辛普里奧",
     "text": "(點頭。走到門口,停步,沒有回頭)下一回——(頓)下一回,老夫出題,會再快些。",
     "next": "n5"
    },
    {
     "id": "n5",
     "type": "line",
     "speaker": "stage",
     "text": "他離場。背影挺直。學生們沒有先鼓掌——他們湧向講台,翻看那兩疊交換的紙。看懂的人,先是一兩聲敲桌;敲桌聲逐漸連成一片。他沒有停步,但諸位都看見:他把那頁批註滿的數據紙,重新夾回了《物理學》。",
     "next": "s1"
    },
    {
     "id": "s1",
     "type": "system",
     "speaker": "system",
     "text": "辯論勝利。",
     "next": "g1"
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "BE-1"
    }
   ]
  },
  {
   "id": "BE-1",
   "title": "望遠鏡的傳聞(翌年夏・1609,運河邊,黃昏)",
   "nodes": [
    {
     "id": "n0",
     "type": "system",
     "speaker": "system",
     "text": "(短轉場)一年過去。桌緣的沙盤換了三盤新沙;批註往返了四封信。",
     "next": "n1"
    },
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "學生跑來,氣喘吁吁:威尼斯傳來消息——荷蘭人造出一種鏡筒,兩片鏡片,能把遠處拉到眼前;已有人在威尼斯親眼見過。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "伽利略",
     "text": "(拋著手裡的石子,忽然停住)兩片鏡片……(石子落回掌心)地上的事,量完了嗎?",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "旅人",
     "text": "沒有。",
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "伽利略",
     "text": "沒有。(望向天邊第一顆星)可是天上在叫。",
     "next": "n5"
    },
    {
     "id": "n5",
     "type": "line",
     "speaker": "stage",
     "text": "他快步離去。這次,連袖口都來不及寫。",
     "next": "s1"
    },
    {
     "id": "s1",
     "type": "system",
     "speaker": "system",
     "text": "旅人筆記新增未解線索:「兩片鏡片,能把遠處拉到眼前。」",
     "next": "g1"
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "BE-2"
    }
   ]
  },
  {
   "id": "BE-2",
   "title": "旅人筆記・末頁(月球)",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "旅人獨坐橋頭。筆記末頁透出微光——灰色的塵原。黑色的天。一個穿臃腫白甲的人——這次,手裡是一支球桿。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "stage",
     "text": "揮桿。小白球飛出一道弧——乾乾淨淨,不搖,不飄。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "system",
     "speaker": "system",
     "text": "三百六十三年後・月球・弗拉毛羅高地\n那裡沒有空氣。球飛出的那道彎,只聽兩件事的話:前行,和下墜。",
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "stage",
     "text": "球桿早已留在身後,小白球卻仍向前。旅人在頁角寫下:沒有東西繼續推它,它為什麼還在走?",
     "next": "rv"
    },
    {
     "id": "rv",
     "type": "review",
     "prompts": [
      "為什麼拋出去的東西,不是「力用完了才掉」?",
      "桌上的小球,憑什麼替砲彈說話?——說到哪裡為止?"
     ],
     "next": "hf"
    },
    {
     "id": "hf",
     "type": "histfacts",
     "next": "fin"
    },
    {
     "id": "fin",
     "type": "system",
     "speaker": "system",
     "text": "——第二章 終——\n感謝遊玩完整第二章。總耗天數與你的筆記已存檔。",
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
 else { root.GB = root.GB || {}; root.GB.DATA = root.GB.DATA || {}; root.GB.DATA.scenes2 = data; }
})(typeof self !== "undefined" ? self : this);
