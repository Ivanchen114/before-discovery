/* data/scenes2.js — 第二章執行載體(file:// 相容)。規範鏡像:scenes2.json(深等測試把關)。
   台詞逐字=凍結劇本 v0.1.3(M1 範圍:B0-1~B1-4);lint=R-NAR2 三軌(規格 v0.1.1 §七)。 */
(function (root) {
  "use strict";
  var data = {
 "chapter": "ch2",
 "startScene": "B0-1",
 "evidenceNames": {
  "F1": "船桅思想實驗",
  "F2": "桌緣彈射・平方根律",
  "F3": "雙球同落",
  "F4": "墨跡曲線",
  "F5": "邊界論證鏈",
  "S3": "塔爾塔利亞砲術圖",
  "S4": "Guidobaldo 的實驗筆記(抄頁)"
 },
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
  "entries": []
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
     "text": "他不等邀請,逕自走到長桌前,把《物理學》端端正正放下。翻開——夾在書頁裡的,正是四年前那頁數據紙。舊墨跡旁,密密麻麻,添了另一種筆跡的批註。",
     "next": "n6"
    },
    {
     "id": "n6",
     "type": "line",
     "speaker": "辛普里奧",
     "text": "老夫讀了。(抬眼)有一問。",
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
     "text": "爾等的數字,老夫一行一行驗過。斜面之上——無可駁。(自袖中取出一張折紙,展開:一幅砲術圖,軌跡分三段——直線上升、一段圓弧、鉛直墜落)然則。(指圖)這是砲手畫的。塔爾塔利亞的書,萬千砲手性命所繫。拋出去的東西:先直飛,力竭,而後墜。(直視旅人)爾等的「時間平方」——管得到天上飛的嗎?",
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
     "text": "瞄不準,砲手陪葬。爾且慢些輕蔑它。",
     "next": "s1"
    },
    {
     "id": "s1",
     "type": "system",
     "speaker": "system",
     "text": "信譽 +1。取得 S3 塔爾塔利亞砲術圖。",
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
     "text": "先拆他一塊地基。他遲早要說:前行與下墜,不能同時——一物一時,一運動。來,老遊戲。(比劃)一條船,順流,等速,穩得像桌面。桅頂,放下一顆球。球落在哪?",
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
       "text": "「桅腳。」",
       "next": "na1"
      },
      {
       "id": "b",
       "text": "「船尾——落下的時候,船跑掉了。」",
       "next": "nb1"
      }
     ]
    },
    {
     "id": "nb1",
     "type": "line",
     "speaker": "伽利略",
     "text": "船跑掉了——球為什麼不跟著跑?它蹲在桅頂的時候,不正和船一起走?鬆手的那一瞬,誰把它的「前行」沒收了?",
     "next": "q1"
    },
    {
     "id": "na1",
     "type": "line",
     "speaker": "伽利略",
     "text": "桅腳。(點頭)球一路帶著船給它的前行,一路走自己的下墜——兩件事,同一顆球,同一段時間。(停頓)誰規定它們不能同席?",
     "next": "nsch1"
    },
    {
     "id": "nsch1",
     "type": "line",
     "speaker": "伽利略",
     "text": "那——岸上的人,看見球走出什麼形狀?",
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
     "text": "取得 F1 船桅思想實驗。筆記:「前行與下墜,可以同席。」",
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
     "text": "(聽完,看完,竟點頭)同落?自然。(翻到一頁夾籤——上面抄的正是四年前的數據)此乃前章舊案,老夫已錄於冊,無意重審。(合上書)今日老夫論的是前行之力——力注於球,力竭,前行乃止。爾等量的是「落」。(把那顆演示球輕輕推回)老夫問的,是「飛」。答非所問。",
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
     "text": "(拋石子的手停住)飛。前行怎麼衰、軌跡什麼形、飛多遠——那才是 impetus 押的注。(轉頭)所以問題變了:不是「它會不會同落」,是——拋出去的東西,究竟走哪條路?走多遠?",
     "next": "s1"
    },
    {
     "id": "s1",
     "type": "system",
     "speaker": "system",
     "text": "第一幕終。筆記:「打正面。要軌跡,要射程。」\n(M1 灰盒切片至此;第二幕實驗於 M2 接續。)",
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
