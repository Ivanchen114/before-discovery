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
  "G1": "航船桅頂落石",
  "G2": "船艙共同運動",
  "G3": "加速／減速對照",
  "G4": "雙參考物疊圖",
  "G5": "反對失效，不等於主張得證"
 },
 "evidenceSummary": {
  "S5": "書中提出船直線穩速、無額外推石頭時的待驗預測；它不是實驗結果。",
  "G1": "停船基準與三次穩速落石：石頭相對船落在桅腳附近。",
  "G2": "停船與穩速時，封閉船艙中的滴水與拋接近乎相同。",
  "G3": "放手後加速會使落點偏後，減速會使落點偏前；運動改變會留下相對偏移。",
  "G4": "同一事件的船上與岸上紙帶；對齊鼓點並扣除桅杆位移後可互相轉換。",
  "G5": "實驗排除『船若前進，落石必落後』的反對，但沒有直接量到地球在動。"
 },
 "scenes": [
  {
   "id": "C0-1",
   "title": "馬賽港・頁面翻了三十二年",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "旅人筆記在掌中翻動。1608、1609——最後停在一行新墨：馬賽，1640 年秋。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "stage",
     "text": "海鳥、纜繩與槳帆船。貨箱上坐著一位神父，海風每次掀頁，他都把同一頁壓回去。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "如果你再看我三次，我就只好假定你在等這本書。",
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "我在看那一頁。",
     "next": "n5"
    },
    {
     "id": "n5",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "伽利略，《對話》。第二日。船。",
     "next": "n6"
    },
    {
     "id": "n6",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "他把船寫進書裡。",
     "next": "n7"
    },
    {
     "id": "n7",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "我想把書帶到海上。那顆石頭從桅頂鬆手，船若正在前進，它會落在哪裡？",
     "next": "s1"
    },
    {
     "id": "s1",
     "type": "system",
     "speaker": "system",
     "text": "取得 S5《對話》的船艙頁。它提出可受審的條件，尚不是實驗證據。",
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
   "title": "先押一個落點",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "碼頭木板畫著船頭、桅腳、船尾三格。艦長、槳手和商人各押一枚木籌。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "艦長",
     "text": "船往前，石頭往下。當然落在後面。你從奔馬上跳下來，也不會停在馬鞍正下方。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "奔馬會顛，也會加速。先別借一匹太忙的馬。",
     "next": "q1"
    },
    {
     "id": "q1",
     "type": "choice",
     "speaker": "system",
     "text": "先押一個落點。結果出來前不能改注。",
     "options": [
      {
       "id": "foot",
       "text": "桅腳附近",
       "effects": [
        {
         "flag": [
          "initialPrediction",
          "foot"
         ]
        }
       ],
       "next": "n4"
      },
      {
       "id": "behind",
       "text": "船尾方向",
       "effects": [
        {
         "flag": [
          "initialPrediction",
          "behind"
         ]
        }
       ],
       "next": "n4"
      },
      {
       "id": "ahead",
       "text": "船頭方向",
       "effects": [
        {
         "flag": [
          "initialPrediction",
          "ahead"
         ]
        }
       ],
       "next": "n4"
      }
     ]
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "寫下來。先押，才知道結果究竟改變了誰。",
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
   "title": "把句子拆成零件",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "書給我們的不是結果，是一張待驗的條件單。你先選哪一組能真的做。",
     "next": "q1"
    },
    {
     "id": "q1",
     "type": "choice",
     "speaker": "system",
     "text": "哪三條是這次實驗真正需要控制的條件？",
     "options": [
      {
       "id": "right",
       "text": "船近似直線前進、速度近似不變、放手時不額外推石頭",
       "next": "n2"
      },
      {
       "id": "wind",
       "text": "海面完全無風、船一定向東、石頭來自比薩",
       "next": "r1"
      },
      {
       "id": "mix",
       "text": "船近似直線前進、海面完全無風、石頭必須夠重",
       "next": "r1"
      }
     ]
    },
    {
     "id": "r1",
     "type": "line",
     "speaker": "艦長",
     "text": "連船往哪裡開、石頭哪裡出生都要指定？這不是定律，是航程表。",
     "next": "q1"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "很好。停船、近似穩速，再加上船改變速度——三種狀態，一個也不能少。",
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
   "title": "停船基準",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "船繫在碼頭。桅腳下鋪細沙；鉛垂線、石球與可抽除的繩扣放在木箱上。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "手放，總會多送一點。先讓鉛垂線告訴我們桅腳在哪，再決定怎麼放。",
     "next": "e1"
    },
    {
     "id": "e1",
     "type": "embed",
     "system": "ship",
     "phase": "baseline",
     "hint": "校準鉛垂，選擇不額外推石頭的釋放方式，完成三次乾淨的停船基準。",
     "until": {
      "ship": "baseline"
     },
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "艾蒂安",
     "text": "三個點都在中央附近。不是同一個洞，但擠在一個手掌裡。",
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "從現在起，不說『完全同點』，只說『落在這個散布範圍』。",
     "next": "g1"
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "C1-2"
    }
   ]
  },
  {
   "id": "C1-2",
   "title": "搶跑的船",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "船離岸。槳聲由慢轉快。岸上的艾蒂安揮旗，旅人抽扣——石球重重落在桅腳後方。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "艦長",
     "text": "落後。書輸了。",
     "next": "e1"
    },
    {
     "id": "e1",
     "type": "embed",
     "system": "ship",
     "phase": "first-failure",
     "hint": "重現搶跑的一筆，核對鼓點與岸標，找出哪個條件沒有站穩。",
     "until": {
      "ship": "failure"
     },
     "next": "q1"
    },
    {
     "id": "q1",
     "type": "choice",
     "speaker": "system",
     "text": "這筆異常最值得先查什麼？",
     "options": [
      {
       "id": "repeat",
       "text": "不看條件，再做一次",
       "next": "r1"
      },
      {
       "id": "weight",
       "text": "換一顆比較輕的石頭",
       "next": "r2"
      },
      {
       "id": "speed",
       "text": "核對放手前後，船怎麼走",
       "next": "n3"
      }
     ]
    },
    {
     "id": "r1",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "若不先問哪個條件沒站穩，重做只是把錯誤寫得更整齊。",
     "next": "q1"
    },
    {
     "id": "r2",
     "type": "line",
     "speaker": "艦長",
     "text": "剛才談的是船追過石頭，怎麼忽然變成石頭的體重？",
     "next": "q1"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "鼓點還在加快，岸標間距也一段比一段大。放手後，船繼續加速，追到石頭前面。",
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "那不是書輸了。是我們根本沒照書下注。",
     "next": "s1"
    },
    {
     "id": "s1",
     "type": "system",
     "speaker": "system",
     "text": "保留失敗紀錄：搶跑的船。它會在之後成為加速度邊界的證據。",
     "effects": [
      {
       "flag": [
        "failureDiagnosed",
        "1"
       ]
      }
     ],
     "next": "g1"
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "C1-3"
    }
   ]
  },
  {
   "id": "C1-3",
   "title": "等船安靜下來",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "鼓點穩定還不夠。等連續三段岸標位移也近乎相等，再放手。",
     "next": "e1"
    },
    {
     "id": "e1",
     "type": "embed",
     "system": "ship",
     "phase": "steady-mast",
     "hint": "選出近似穩速窗口，完成三次航行落石。",
     "until": {
      "ship": "g1"
     },
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "艾蒂安",
     "text": "船一直往前！我從岸上看見石頭也往前。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "艦長",
     "text": "可在船上，它就在桅杆底下。",
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "一個結果，先有了兩個證人。",
     "next": "g1"
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "C1-4"
    }
   ]
  },
  {
   "id": "C1-4",
   "title": "風的辯護",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "艦長",
     "text": "甲板有風。也許不是石頭保留了前行，是空氣把它帶回桅腳。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "那就在風比較難替我們辦事的地方做。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "書裡那個房間，終於可以下水了。",
     "next": "g1"
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "C2-1"
    }
   ]
  },
  {
   "id": "C2-1",
   "title": "船艙裡的房間",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "低矮船艙裡看不見岸。桌上只有滴水壺、窄口碗與一顆軟布球。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "我們不養飛蟲，也不折磨魚。停船與穩速，各做滴水和拋接——兩件事夠了。",
     "next": "e1"
    },
    {
     "id": "e1",
     "type": "embed",
     "system": "ship",
     "phase": "cabin",
     "hint": "完成停船／穩速兩種狀態下的滴水與拋接四格比較。",
     "until": {
      "ship": "g2"
     },
     "next": "q1"
    },
    {
     "id": "q1",
     "type": "choice",
     "speaker": "system",
     "text": "四格結果最精確的解釋是什麼？",
     "options": [
      {
       "id": "still",
       "text": "所以船其實沒有動",
       "next": "r1"
      },
      {
       "id": "shared",
       "text": "船、器材、空氣與我們原本就一起前進",
       "next": "n3"
      }
     ]
    },
    {
     "id": "r1",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "岸上的旗已經反對你。不要為了解釋船艙，就把甲板刪掉。",
     "next": "q1"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "放手只改變彼此的接觸，沒有把大家原本共有的前行清掉。",
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "先保留這句。它還要經過一個更凶的測試。",
     "next": "g1"
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "C2-2"
    }
   ]
  },
  {
   "id": "C2-2",
   "title": "船一改變主意",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "裝置維持不變。這次只改放手之後的船速：加槳，或收槳。",
     "next": "e1"
    },
    {
     "id": "e1",
     "type": "embed",
     "system": "ship",
     "phase": "speed-change",
     "hint": "先押加速與減速的落點，再各做一次對照。",
     "until": {
      "ship": "g3"
     },
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "艦長",
     "text": "所以第一回看見的落後，不是假的。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "不是假的。只是它證明的是船在加速，不是石頭天生會忘記前行。",
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "失敗紀錄，現在升格成證據。",
     "next": "g1"
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "C2-3"
    }
   ]
  },
  {
   "id": "C2-3",
   "title": "岸上的紙，船上的紙",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "艾蒂安帶回岸上紙帶；旅人攤開船上紙帶。兩張都標著同一串鼓點。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "艾蒂安",
     "text": "我的石頭往前走。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "艦長",
     "text": "我的石頭直直落。",
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "很好。現在誰要把誰的紙燒掉？",
     "next": "e1"
    },
    {
     "id": "e1",
     "type": "embed",
     "system": "ship",
     "phase": "overlay",
     "hint": "先讓同一聲鼓相認，再扣除每個時刻桅杆向前的位移。",
     "until": {
      "ship": "g4"
     },
     "next": "n5"
    },
    {
     "id": "n5",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "兩張圖沒有互相推翻。它們只是各自把不同的東西當作不動。",
     "next": "n6"
    },
    {
     "id": "n6",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "一句話若沒先回答『相對誰』，通常只說了一半。",
     "next": "s1"
    },
    {
     "id": "s1",
     "type": "system",
     "speaker": "system",
     "text": "取得證據：雙參考物疊圖。解鎖操作詞：切換參考物。現代整理詞「參考系」留到史實頁。",
     "effects": [
      {
       "flag": [
        "referenceNamed",
        "1"
       ]
      }
     ],
     "next": "g1"
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "C2-4"
    }
   ]
  },
  {
   "id": "C2-4",
   "title": "不推之後，留下什麼",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "現在把最危險的字刪掉。哪一句有資格上公開演示？",
     "next": "q1"
    },
    {
     "id": "q1",
     "type": "choice",
     "speaker": "system",
     "text": "選出不誇大、也不偷偷造出一股新力的主張。",
     "options": [
      {
       "id": "forever",
       "text": "物體一旦運動，就會永遠保持任何運動",
       "next": "r1"
      },
      {
       "id": "force",
       "text": "石頭裡藏著一股向前的力，持續推它",
       "next": "r2"
      },
      {
       "id": "bounded",
       "text": "近似直線穩速、無額外水平推拉時，鬆手不會清除石頭與船共有的前行",
       "next": "n2"
      }
     ]
    },
    {
     "id": "r1",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "重力正在讓它往下變快。你不能一邊看見運動改變，一邊說任何運動都不變。",
     "next": "q1"
    },
    {
     "id": "r2",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "別為了保住舊直覺，換個名字又塞進一股看不見的推力。",
     "next": "q1"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "不再接觸，不等於把已有的前行歸零。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "明天讓整個碼頭先下注。",
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
   "title": "馬賽港公開演示",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "船員、學生、商人與官員站滿碼頭。每個人先把木籌押在船頭、桅腳或船尾。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "條件由你公開。結果也由你留下。",
     "next": "e1"
    },
    {
     "id": "e1",
     "type": "embed",
     "system": "ship",
     "phase": "public-demo",
     "hint": "依序公開停船基準、穩速窗口、無額外推石頭與三次重複。",
     "until": {
      "ship": "public"
     },
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "stage",
     "text": "三次落點都聚在桅腳的基準散布附近。原先押船尾的木籌沒有被拿走；預測與結果一起留在木板上。",
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
   "title": "三道公開質詢",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "艦長",
     "text": "漂亮的演示還不夠。風、加速和那兩張互相打架的路徑，都得說清楚。",
     "next": "e1"
    },
    {
     "id": "e1",
     "type": "embed",
     "system": "ship",
     "phase": "audit",
     "hint": "為三道質詢各選一張真正能回答它的證據。",
     "until": {
      "ship": "audit"
     },
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "三個問題都留下可追查的回答。現在只剩最像勝利的那個陷阱。",
     "next": "g1"
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "C3-3"
    }
   ]
  },
  {
   "id": "C3-3",
   "title": "最後的誘惑",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "官員",
     "text": "很好。那就寫：今日在馬賽，伽桑狄證明了地球正在運動。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "stage",
     "text": "人群安靜。這句話比任何反對都更像勝利。",
     "next": "e1"
    },
    {
     "id": "e1",
     "type": "embed",
     "system": "ship",
     "phase": "boundary",
     "hint": "指出這場演示究竟排除了什麼，又沒有直接證明什麼。",
     "until": {
      "ship": "g5"
     },
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "今天沒有直接量到地球怎麼動。我們只讓『石頭應落在後面』不能再假裝自己是證據。",
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "這就夠重了。",
     "next": "g1"
    },
    {
     "id": "g1",
     "type": "goto",
     "scene": "C3-4"
    }
   ]
  },
  {
   "id": "C3-4",
   "title": "題名",
   "nodes": [
    {
     "id": "n1",
     "type": "line",
     "speaker": "stage",
     "text": "人群散去。艦長最後才離開，手裡拿的是加速／減速對照，不是那張漂亮的結果。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "艦長",
     "text": "下回你們再說船很穩，先把這張給我看。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "成交。",
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "旅人(你)",
     "text": "鬆手之後，沒有誰繼續推它。",
     "next": "n5"
    },
    {
     "id": "n5",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "可它沒有忘記，自己本來就和船一起向前。",
     "next": "s1"
    },
    {
     "id": "s1",
     "type": "system",
     "speaker": "system",
     "text": "第三章《船艙裡的靜止》",
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
     "text": "紙張、鉛字與油墨。伽桑狄把伽利略的《對話》放在左邊，自己的手稿放在右邊。",
     "next": "n2"
    },
    {
     "id": "n2",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "他把船寫進書裡。",
     "next": "n3"
    },
    {
     "id": "n3",
     "type": "line",
     "speaker": "stage",
     "text": "他把馬賽的落點紙、船速紀錄與雙紙帶夾進手稿。",
     "next": "n4"
    },
    {
     "id": "n4",
     "type": "line",
     "speaker": "伽桑狄",
     "text": "我們把書帶到海上。現在，把海帶回書裡。",
     "next": "n5"
    },
    {
     "id": "n5",
     "type": "line",
     "speaker": "stage",
     "text": "桌角有一封新到的信：伽利略已於阿爾切特里去世。伽桑狄沒有朗讀，只把《對話》的封面拂平。",
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
     "text": "筆記畫出兩條路：以船為基準近乎直落；以岸為基準向前彎下。兩條線共用同一串鼓點。",
     "next": "r1"
    },
    {
     "id": "r1",
     "type": "review",
     "prompts": [
      "船上與岸上看見的路徑不同，為什麼不代表有人看錯？",
      "這場實驗推翻了哪一個反對？又沒有證明什麼？"
     ],
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
     "text": "第三章已封存。旅人筆記的下一頁仍是空白。",
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
