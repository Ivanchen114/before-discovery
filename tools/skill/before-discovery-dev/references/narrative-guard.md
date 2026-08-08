# `check-narrative` 使用與邊界

本工具處理「資訊完整、場面不完整」的可重複診斷。規則來源如下；其中
《互動敘事與歷史科學探究規範》目前仍是 candidate，不得因工具可執行就冒充已裁決：

- `02_設計/發現之前_設計原則手冊_v0.1.md` K 節（63–66、66-bis）
- `02_設計/發現之前_互動敘事與歷史科學探究規範_v0.1_20260730.md`
- `02_設計/發現之前_跨章規格_旅人聲線與章際接縫_v1.0_Claude_20260728.md` §六
- `02_設計/發現之前_主筆自檢清單_文字慣犯_Claude_20260727.md`

它不替文字打分，也不宣稱關鍵字能證明戲劇成立。

## 1. 基本用法

runtime JSON 是完整檢查的首選：

```bash
python3 tools/skill/before-discovery-dev/scripts/skill_guard.py check-narrative \
  --scenes greybox/data/scenes5.json \
  --chapter ch5
```

六章編劇審查先加 `--story-audit` 拉出場景標題、全部 choice/embed、選項匯流形狀、
embed 前後節點與最長五段連續 line：

```bash
python3 tools/skill/before-discovery-dev/scripts/skill_guard.py check-narrative \
  --scenes greybox/data/scenes6.json \
  --chapter ch6 \
  --runtime-source greybox/src/chapter-ui.js \
  --story-audit
```

輸出的 `STORY TRACKS` 嚴格分開 `scene_choices`、`embeds` 與明示
`narrativeChoice: "chN"` 的引擎決策；未標註的工作台按鈕會顯示為 `not-counted`，
必須另讀對應 engine/UI，不得由零推論成沒有互動。

正式閘門需要 warning 轉成非零退出碼時，明示：

```bash
python3 tools/skill/before-discovery-dev/scripts/skill_guard.py check-narrative \
  --scenes greybox/data/scenes5.json \
  --chapter ch5 \
  --contract path/to/ch5-narrative-contract.json \
  --require-contract \
  --fail-on-warnings
```

退出碼：

- `0`：輸入可解析；advisory 模式即使有 warning 仍為 0。
- `1`：參數、檔案、JSON／Markdown 或 contract 結構無法解析。
- `2`：使用 `--fail-on-warnings`，且至少一項診斷出現 warning。

`--previous-scenes` 會從前章 runtime 的最後開放問句取字，確認它出現在本章第一場；只正規化全／半形標點與空白，措辭仍須逐字相同。不要拿台詞稿代替前章 runtime。

## 2. Markdown 草稿的嚴格輸入格式

草稿只辨識 `## ...【SCENE-ID】` 場景標題下的：

- `角色:台詞`／`角色：台詞`
- 括號開頭的動作行
- `【系統】`、`【操作】`、`【證據】` 等玩家可見標記
- `▸`／`▶` 開頭的選項

表格、場名、blockquote、HTML comment、code fence 與其他設計註記不參與掃描。這是為了避免第三章臨時掃描器曾把場名、註記當成金句的誤判。

Markdown 模式適合寫稿期的旅人在場、禁詞、金句與壓縮訊號；節點契約只接受 runtime JSON。

## 3. 自動檢查的涵蓋面

| 代碼 | 自動檢查 | 性質 |
|---|---|---|
| NAR-01 | 從 `startScene` 沿可達 `next/options/goto` 找首個現行 `choice/embed`；不可達與 `legacyOnly` 不計，心聲不支付玩家參與 | 結構警示，不是代理權品質分數 |
| NAR-02 | 逐章禁詞，只掃玩家可見文字與選項 | 高信度 |
| NAR-03 | 「不是…是…」「A，不是 B」候選，每場超過一處 | 中信度 warning |
| NAR-04 | 前章最後開放問句是否在本章第一場逐字接住 | 高信度 |
| NAR-08 | 字數／節點、節點／場、單拍場景 | 壓縮訊號，不是品質分數 |
| NAR-09 | 公開發言／活躍心聲／庫存心聲、連續 OS、用途標記與 `legacyOnly` 入邊 | 高信度結構＋人工語義複核 |
| NAR-63 | JSON 中直接取得 evidence 的前五節點是否至少有三個可見拍 | 部分涵蓋 |
| NAR-63–66 | 明示節拍 contract 的節點存在、順序、講者與轉場目標 | 結構守衛 |

字數密度沿用 ch1 的 27 字／節點基準；超過 1.2 倍才警示。節點／場低於 6 只作「敘事層可能是空殼」的診斷。兩者都不能單獨判定場面成立。

R-TXT-4 的選擇密度以 `scenes*.json` 的現行 choice，加上 `--runtime-source` 內明示
`narrativeChoice: "chN"` 的章別敘事選擇計算。工作台的一般按鈕不會自動灌水；
標記只給會改變關係、調查順序、主張範圍或公開承諾的選擇。

`legacyOnly: true` 用於保留舊存檔可能停留的節點；它仍存在於庫存，但不得有現行節點
指向它，也不計入活躍心聲與文字密度。活躍 OS 若開始使用 `osPurpose`，同一份
runtime 的其他活躍 OS 也必須標用途；合法值與語義見正式敘事規範。工具只驗拼字、
連續入邊與是否遺漏，不能判斷該心聲是否真的不可替代。

工具會列出每場 `spoken／inner／actions` 與首個 `choice/embed` 的位置。沒有旅人台詞
不再自動失敗：有意義沉默與 NPC 主導場必須由人工 scene contract 說明，不能靠補 OS
消除 warning。

`--story-audit` 的 choice 分型只描述拓撲：單選儀式、直接匯流、短程回應後匯流、
有直接 state 的匯流或分支。它不把「稍後匯流」自動判成假選擇，也不把有旗標自動
判成有意義；人工仍要確認實際發言、NPC 回應與後文是否讀回。`LINE_RUN` 只量同一
場景 node 陣列中相鄰的 `line`，不是可達路徑、閱讀秒數或工作台內互動量。

embed 接縫只列陣列前一節點與明示 `next` 節點。人工要再確認進台前是否有當下
動機與任務、出台後是否針對玩家實際操作回應，以及引擎內是否已經演完辯論或高潮；
不能因 scenes 沒有 `debate` embed 就推論 runtime 沒有辯論。

史實查證、合理重建告示與「不會老」採哪一種戲劇處理仍是人工項。工具每次都印出 MANUAL 提醒，不把無法可靠判斷的工作偽裝成 pass。

## 4. 四律節拍契約

contract 是人類完成語義判斷後留下的結構錨點。最小格式：

```json
{
  "schema_version": 1,
  "chapter": "ch5",
  "three_beat_evidence": [
    {
      "id": "J1",
      "scene": "E1-1",
      "discover": "n3",
      "respond": "n4",
      "confirm": "n5"
    }
  ],
  "cognitive_pauses": [
    {
      "id": "J1",
      "scene": "E1-1",
      "pause": "n6",
      "evidence": "n7"
    }
  ],
  "npc_reactions": [
    {
      "id": "du-chatelet-reacts-to-voltaire",
      "scene": "E1-1",
      "responder": "杜夏特萊",
      "to_speaker": "伏爾泰",
      "node": "n9"
    }
  ],
  "forced_transitions": [
    {
      "id": "ledger-must-open",
      "from_scene": "E1-1",
      "pressure": "n12",
      "to_scene": "E1-2"
    }
  ]
}
```

守衛保證：

- 發現、回應、確認是同場三個不同且依序的節點；發現與回應不能是同一講者。
- runtime 直接寫入的每個 evidence id 都有同 id 的三拍契約；每份三拍契約也有同 id 的認知停頓。
- 認知停頓在證據節點之前。
- 每名在 runtime 說過話的 NPC 都有至少一筆回應契約；回應節點的講者正確，而且被回應者在同場更早說過話。
- 壓力節點存在、目標場在後面；若來源場有明示 `goto`，目標必須相符。

它不能證明指定節點在語義上真的完成發現、停頓、反應或壓力。對抗審先確認語義，contract 再防止後續轉檔把已核准的拍刪掉、合併或調亂。

## 5. 反向驗證要求

新增或修改檢查時，至少保留一個負向 fixture：

- 把首個 `choice/embed` 推到 20 個以上可見行之後，NAR-01 必須出現。
- 讓現行節點重新指向 `legacyOnly`、移除已啟用章的 `osPurpose`，或把兩個活躍 OS
  直接相連，NAR-09 必須出現。
- 把禁詞放進玩家可見節點，NAR-02 必須出現；只放在場名、表格或註記不得出現。
- 增加第二句對仗，NAR-03 必須出現。
- 刪除或調亂 contract 的 response／pause／pressure 節點，對應 NAR-63–66 必須出現。
- 搭配 `--fail-on-warnings` 時，上述變異必須以 exit 2 結束。
- 以 `--chapter ch6 --story-audit` 跑最小 fixture，必須分列 scene choice、embed 與
  已標註 runtime choice；刪除其中任一軌，對應 coverage 必須改變。
