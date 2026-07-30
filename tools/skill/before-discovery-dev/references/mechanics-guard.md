# `mechanics_guard.py`：探究段雙軌承重與證據判斷契約

這個工具把兩個問題留下可重跑的結構契約：

1. **拿掉說明性台詞後，探究段仍由玩家完成問題、承諾、操作、留痕、判讀與承擔結果嗎？**
2. **證據判斷的錯項，是否真的需要一張當時看得到的紙及其欄位才能否掉？**

它不是新的設計法典，也不替物理、史實或戲劇品質打分。正式法源仍在
`02_設計/`；contract 只保存已經由人審核過的結構錨點，避免後續轉檔把它們刪掉、
調亂或改成系統代答。

## 1. 雙軌不是「把所有台詞刪掉」

**機制軌**拿掉的是解說、答案提示與 NPC 代診斷，不是刪除必要的語言行動。
「提出問題」「封存預測」「選紙」「限定斷言」「撤回過度主張」可以保留為功能性
操作標籤；玩家仍必須親自承諾、操作與判讀。

**敘事軌**把人物、動機與歷史壓力放回來。它至少支付一項：

- `motive`
- `character_response`
- `relationship_change`
- `historical_stakes`
- `pressure`

但不得替玩家補上缺少的推論、缺少的操作或控制說明。工具只能檢查這些欄位有沒有被
明示；它不能判斷台詞在語義上是否真的做到。

## 2. 最小 contract

```json
{
  "schema_version": 2,
  "chapter": "ch3",
  "binding": {
    "targetPath": "greybox/data/scenes3.json",
    "targetFormat": "scenes-json"
  },
  "segments": [
    {
      "id": "p1",
      "ordinal": 1,
      "mechanicalSpine": {
        "question": {
          "anchor": "C0-1/n1",
          "ordinal": 1,
          "reachable": true,
          "authorship": "world"
        },
        "commitment": {
          "anchor": "C0-1/c_meet",
          "ordinal": 2,
          "reachable": true,
          "authorship": "player"
        },
        "operation": {
          "anchor": "C0-3/c1",
          "ordinal": 3,
          "reachable": true,
          "authorship": "player"
        },
        "trace": {
          "anchor": "C1-1/e1",
          "ordinal": 4,
          "reachable": true,
          "authorship": "system"
        },
        "interpretation": {
          "anchor": "C3-2/c1",
          "ordinal": 5,
          "reachable": true,
          "authorship": "player"
        },
        "resistance": {
          "anchor": "C3-2/x5",
          "ordinal": 6,
          "reachable": true,
          "authorship": "npc"
        },
        "success": {
          "anchor": "C3-2/s1",
          "ordinal": 7,
          "reachable": true,
          "authorship": "system"
        },
        "failure": {
          "anchor": "C3-2/g1",
          "ordinal": 8,
          "reachable": true,
          "authorship": "system",
          "preserves": ["trace"]
        }
      },
      "commitBeforeReveal": {
        "commitment": "commitment",
        "reveal": "trace"
      },
      "narrativeTrack": {
        "payments": [
          {
            "id": "captain-pushes-back",
            "anchor": "resistance",
            "purpose": "character_response"
          }
        ],
        "suppliesRequiredInference": false,
        "suppliesMissingOperation": false,
        "suppliesControlInstruction": false
      }
    }
  ],
  "decisionRegistry": [
    {
      "id": "p1-concept",
      "segment": "p1",
      "kind": "evidence_judgment",
      "anchor": "operation"
    },
    {
      "id": "meet-gassendi",
      "segment": "p1",
      "kind": "narrative",
      "anchor": "commitment"
    },
    {
      "id": "name-dossier",
      "segment": "p1",
      "kind": "narrative",
      "anchor": "interpretation"
    }
  ],
  "decisions": [
    {
      "id": "p1-concept",
      "segment": "p1",
      "kind": "evidence_judgment",
      "anchor": "operation",
      "preselected": false,
      "options": [
        {
          "id": "shared-motion",
          "isCorrect": true,
          "supportedBy": [
            {
              "sourceId": "S5",
              "field": "promptText",
              "condition": "near_zero"
            }
          ]
        },
        {
          "id": "small-lag",
          "isCorrect": false,
          "refutedBy": [
            {
              "sourceId": "S5",
              "field": "promptText",
              "relation": "contradicts",
              "condition": "no_systematic_lag"
            }
          ]
        }
      ]
    },
    {
      "id": "meet-gassendi",
      "segment": "p1",
      "kind": "narrative",
      "anchor": "commitment",
      "preselected": false,
      "options": [
        {"id": "own"},
        {"id": "ask"}
      ]
    },
    {
      "id": "name-dossier",
      "segment": "p1",
      "kind": "narrative",
      "anchor": "interpretation",
      "preselected": false,
      "options": [
        {"id": "cabin"},
        {"id": "segment"},
        {"id": "stone"}
      ]
    }
  ],
  "evidenceSources": [
    {
      "id": "S5",
      "fields": [
        {
          "id": "promptText",
          "locator": {
            "scene": "C0-1",
            "node": "s1",
            "field": "text"
          }
        }
      ]
    }
  ]
}
```

`binding.targetPath` 必須是 repo 內存在的 canonical scenes JSON；章別必須與 target
一致。`anchor` 採 `scene/node`，不能只寫一個宣稱可達的標籤。工具從
`startScene` 建靜態控制流圖，實查 node 存在、可達與 dominance；`ordinal` 仍保存
人審後的排序意圖。證據欄位用 `locator` 綁到真實 node 的 JSON field，而且該 node
必須真的以 node／option effect 取得同一 evidence id，並在所有通往 decision 的
靜態路徑上先出現。

目前只有 `scenes-json` adapter。工作台內部 state、跨檔案資料或動態 return 若無法由
這個 adapter 證明，會 fail closed；不得退回 `reachable: true` 自我證明。
目前登錄範圍是 ch1–ch5；新章可在 Design Gate 人工審 contract，但在
Implementation Gate 前必須先登錄 canonical scenes target／章別 adapter，否則
`check-mechanics` 保持 BLOCKED。

## 3. 守衛實際保證

| 代碼 | 可機械檢查的契約 |
|---|---|
| `MEC-01` | schema、章別、段落基本形狀 |
| `MEC-02` | 八個必要節拍都有獨立 anchor、正整數 ordinal、`reachable: true` |
| `MEC-03` | 問題→承諾→操作→留痕→判讀→阻力；成功與失敗都在阻力之後 |
| `MEC-04` | 承諾、操作、判讀由玩家 authored |
| `MEC-05` | 失敗分支明示保留 `trace`，不以重置抹掉玩家的犯錯痕跡 |
| `MEC-06` | 承諾早於明示的揭露節拍 |
| `MEC-07` | 敘事支付有錨點，且宣告不代替推論、操作、控制說明 |
| `BIND-01` | targetPath 存在、為可解析 scenes JSON，chapter／startScene／edge 一致 |
| `BIND-02` | 每個 `scene/node` anchor 真實存在且從 startScene 可達 |
| `BIND-03` | 真實靜態圖可證明前拍 dominates 後拍，承諾 dominates reveal |
| `BIND-04` | 玩家 authored beat 綁到 choice／embed，或 runtime 明標 `playerAuthored: true`，不靠講者名稱猜 |
| `DEC-01` | registry 與 decision 一一對應，kind／segment／anchor 不漂移，且圈定路徑上的每個 runtime choice 都有登錄 |
| `DEC-02` | 決策與選項皆不得預選 |
| `DEC-03` | `evidence_judgment` 至少一個可支持選項與一個可否證錯項 |
| `DEC-04` | 每個錯項都有非空 `refutedBy`，且 `relation` 限定為 `contradicts`／`confounded`／`out_of_scope`／`insufficient` |
| `DEC-05` | source／field 與 locator 真實存在；綁定 node／option 也確實 grant 同一 evidence id |
| `DEC-06` | 來源 node 可達且 dominates decision；晚出現或只在互斥支線上都失敗 |
| `DEC-07` | 零 decision 必須有可驗的 `NOT_APPLICABLE`，不能冒充完整 PASS |

`decisionRegistry` 是經 Design Gate 核准的決策清單。工具會阻止施工者只把
`decisions[].kind` 從 `evidence_judgment` 改成 `narrative` 來逃避
`refutedBy`；如果 registry 與 decision 一起被改掉，仍須由 diff review 與
Design Gate 阻擋。registry 不是不可竄改的神諭。

### 零 decision 的唯一合法形式

```json
{
  "decisionRegistry": [],
  "decisions": [],
  "evidenceSources": [],
  "decisionExemption": {
    "status": "NOT_APPLICABLE",
    "reason": "這個已圈定的線性幕間沒有玩家決策。",
    "decisionOwner": "總監裁決編號",
    "scopeSegments": ["interlude-1"],
    "basis": {
      "targetPath": "02_設計/已核准規格.md",
      "locator": "NO_DECISIONS_APPROVED"
    }
  }
}
```

守衛會驗 basis 檔案與 locator 真實存在、scope 恰好覆蓋本 contract，並掃描
question 到 success／failure 的實際路徑；若仍有 `choice`／`embed`，exemption
失敗。通過時輸出明示 `decisionStatus=NOT_APPLICABLE`，不是 decisions 的完整 PASS。

## 4. 執行

目前可以獨立執行：

```bash
python3 tools/skill/before-discovery-dev/scripts/mechanics_guard.py \
  --contract path/to/chapter-mechanics-contract.json
```

退出碼：

- `0`：結構契約通過。
- `1`：檔案、JSON 或根物件無法解析。
- `2`：至少一條結構契約不成立。

定點測試：

```bash
python3 tools/skill/before-discovery-dev/scripts/test_mechanics_guard.py
```

## 5. 反向驗證

新增或修改守衛時，至少保留以下負向 fixture：

- 刪掉八拍之一、把拍標成不可達、或顛倒 ordinal；
- 把 commitment／operation／interpretation 的 authorship 改成 NPC；
- 失敗分支拿掉 `preserves: ["trace"]`；
- 把 reveal 移到 commitment 之前；
- 把 `suppliesRequiredInference` 改成 true；
- 把 decision 的 kind 降成 narrative，但 registry 保持 evidence_judgment；
- 預選 decision／option；
- 刪除錯項的 `refutedBy`；
- 刪除 `refutedBy.relation` 或填入未知關係；
- 指到不存在的 source／field；
- 把 source id 改成 target node 並未取得的 `FAKE`；
- 把 chapter 改成 `ch99`、target 指到別章，或 anchor 改成不存在／不可達 node；
- 把 evidence locator 放到互斥選項支線，或移到 decision 之後；
- 清空 registry／decisions／sources 而不附 exemption；
- exemption 的 basis／locator 不存在，或實際路徑仍含 choice／embed。

## 6. 工具不能證明的事

每次輸出都保留 `MANUAL` 提醒。`scenes-json` adapter 現在會實查 anchor、startScene
可達性與 dominance；仍不能證明：

- `require`、flag、存檔狀態與動態 return 組出的路徑在某一狀態下是否真的可走；
- 錯項是不是「對一半」而非荒謬稻草人；
- 指定欄位在物理與史實上是否真的支持／否證該句；
- `condition` 是否有正確門檻、容差與量綱；
- 玩家是否看得懂該欄位，而非只是在資料裡存在；
- 敘事放回來後是否真的增加動機、人物回應、關係變化、壓力或歷史代價。

靜態圖把條件分支全部納入；因此 dominance 不成立就 fail closed，可能產生需要章別
adapter 才能解除的保守紅燈，但不會用 contract 的 `reachable: true` 把它洗綠。
綠燈仍不能宣稱「遊戲好玩」、「物理正確」或「戲劇完整」。
