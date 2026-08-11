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

`decisionRegistry[]`／`decisions[]` 的 `anchor` 仍指向該段八拍之一；若同一拍附近有
第二個以上 runtime choice，可另加相同的 `runtimeAnchor: "scene/node"`，精確綁定
實際 choice。守衛會驗它存在、可達、位於本段 question→success/failure 路徑、具
玩家 authorship，並以它而非八拍 anchor 檢查 evidence dominance。這避免為了登錄
每個 choice 偽造第二套機制拍，也禁止用段外節點灌 registry。

`scenes-json` adapter 守靜態節點。工作台內部 state、跨檔案資料或動態 return 若無法由
它證明，必須另接 source registry 登錄的 repo-local engine adapter；不得退回
`reachable: true` 自我證明。第七章 `engine7_runtime_adapter.mjs` 是首個實例：guard 用
`subprocess` 陣列參數呼叫、設 timeout，只收單一 JSON，並核對 chapter、engine path、
SHA-256、八項必要行為與 contract 的逐字成功句。非零 exit、額外 stdout、缺欄或 hash
漂移一律 `ENG-01`。engine 驗證通過時，TO-BE contract 可保留 `reachable:false`；可達性
改由真實 scenes 圖與 engine adapter 共同作證，而非把欄位改成自報 true。

目前登錄範圍是 ch1–ch7；新章可在 Design Gate 人工審 contract，但在 Implementation
Gate 前必須先登錄 canonical scenes target／必要章別 adapter，否則 `check-mechanics`
保持 BLOCKED。

### 2.1 TO-BE profile：沒有 scenes 也先檢查設計包

新章進劇本前，作者必須一次交齊 chapter brief、provenance sidecar 與 schema v2
mechanics contract。contract 另加 `toBeReview`；這不是第四份設計稿，而是三件套之間
的指標表。以下是 **TO-BE 專用關聯區塊的完整範例**；把它與前節的
`schema_version`、`chapter`、`binding` 及八拍完整區塊合併。範例刻意同時展示
decision 與 evidence field 兩層 `plannedOrdinal`、operation 登錄、success
`claimRef`、baseline 與空舊句清單的 `emptyReason`：

```json
{
  "segments": [
    {
      "id": "main",
      "mechanicalSpine": {
        "success": {
          "anchor": "planned-success",
          "ordinal": 7,
          "reachable": false,
          "authorship": "system",
          "claimRef": "verdict#bounded"
        }
      }
    }
  ],
  "decisionRegistry": [
    {
      "id": "verdict",
      "segment": "main",
      "kind": "evidence_judgment",
      "anchor": "interpretation"
    },
    {
      "id": "configure-apparatus",
      "segment": "main",
      "kind": "operation",
      "anchor": "operation"
    }
  ],
  "decisions": [
    {
      "id": "verdict",
      "segment": "main",
      "kind": "evidence_judgment",
      "anchor": "interpretation",
      "plannedOrdinal": 5,
      "preselected": false,
      "options": [
        {
          "id": "bounded",
          "isCorrect": true,
          "supportedBy": [
            {
              "sourceId": "GRID",
              "field": "observation",
              "condition": "bounded-result"
            }
          ]
        },
        {
          "id": "overclaim",
          "isCorrect": false,
          "refutedBy": [
            {
              "sourceId": "GRID",
              "field": "observation",
              "relation": "out_of_scope",
              "condition": "claim-exceeds-tested-scope"
            }
          ]
        }
      ]
    },
    {
      "id": "configure-apparatus",
      "segment": "main",
      "kind": "operation",
      "anchor": "operation",
      "preselected": false,
      "options": [
        {"id": "configure-a"},
        {"id": "configure-b"}
      ]
    }
  ],
  "evidenceSources": [
    {
      "id": "GRID",
      "fields": [
        {
          "id": "observation",
          "plannedOrdinal": 4,
          "locator": {
            "scene": "planned-workbench",
            "node": "planned-grid",
            "field": "observation"
          }
        }
      ]
    },
    {
      "id": "BASELINE",
      "fields": [
        {
          "id": "observation",
          "plannedOrdinal": 2,
          "locator": {
            "scene": "planned-workbench",
            "node": "planned-baseline",
            "field": "observation"
          }
        }
      ]
    }
  ],
  "toBeReview": {
    "status": "REVIEW_READY",
    "packet": {
      "briefPath": "02_設計/chapter-brief.md",
      "briefVersion": "v0.3",
      "provenancePath": "02_設計/provenance.md",
      "provenanceVersion": "v0.2"
    },
    "consistencyRows": [
      {
        "id": "main-inquiry",
        "segment": "main",
        "claim": {"decisionId": "verdict", "optionId": "bounded"},
        "measurement": [{"sourceId": "GRID", "field": "observation"}],
        "evidence": [{"sourceId": "GRID", "field": "observation"}],
        "refutation": [{"decisionId": "verdict", "optionId": "overclaim"}],
        "playerOperation": {"decisionId": "configure-apparatus"},
        "success": {
          "segment": "main",
          "canonicalClaim": {"decisionId": "verdict", "optionId": "bounded"}
        }
      }
    ],
    "controlBaselines": [
      {
        "segment": "main",
        "status": "REQUIRED",
        "source": {"sourceId": "BASELINE", "field": "observation"}
      }
    ],
    "staleTextScan": {
      "status": "PASS",
      "scope": ["brief", "provenance", "contract"],
      "phrases": [],
      "emptyReason": "first complete packet; no superseded phrase exists yet"
    }
  }
}
```

這是關聯區塊範例，不是允許省略八拍、binding 或 narrativeTrack。若已有被汰汰的舊句，
把它們逐字列入 `phrases`，並移除 `emptyReason`；只有 `phrases` 為空時才使用
`emptyReason`。`plannedOrdinal: 4` 必須早於判讀的 `plannedOrdinal: 5`；兩個數字
分屬 evidence field 與 `evidence_judgment` decision，不可只填其一。

六欄只保存既有 ID 參照，不抄第二份台詞。`mechanicalSpine.success.claimRef` 必須等於
同列的 `decisionId#optionId`，讓成功句上限只有一份正本。每個
`evidence_judgment` 與它引用的 evidence field 另填 `plannedOrdinal`；TO-BE guard
據此檢查證據必須早於判讀。每個 segment 都要明示 baseline 是 `REQUIRED` 或
`NOT_APPLICABLE`；後者必須寫理由。`playerOperation` 必須指向同 segment、
`kind: operation` 的 decision，避免把玩家接線偷換成固定教學播放。

尚無 runtime 時，八拍的 `reachable` 必須保持 `false`。TO-BE PASS 只代表三件套齊、
內部參照與宣告順序自洽；它不會把未存在的 scenes 或 engine adapter 洗成可達。

## 3. 守衛實際保證

| 代碼 | 可機械檢查的契約 |
|---|---|
| `MEC-01` | schema、章別、段落基本形狀 |
| `MEC-02` | 八個必要節拍都有獨立 anchor、正整數 ordinal；一般 runtime 明載 `reachable: true`，已登錄 engine adapter 的章由實際 adapter 證據取代自報 |
| `MEC-03` | 問題→承諾→操作→留痕→判讀→阻力；成功與失敗都在阻力之後 |
| `MEC-04` | 承諾、操作、判讀由玩家 authored |
| `MEC-05` | 失敗分支明示保留 `trace`，不以重置抹掉玩家的犯錯痕跡 |
| `MEC-06` | 承諾早於明示的揭露節拍 |
| `MEC-07` | 敘事支付有錨點，且宣告不代替推論、操作、控制說明 |
| `BIND-01` | targetPath 存在、為可解析 scenes JSON，chapter／startScene／edge 一致 |
| `BIND-02` | 每個 `scene/node` anchor 真實存在且從 startScene 可達 |
| `BIND-03` | 真實靜態圖可證明前拍 dominates 後拍，承諾 dominates reveal |
| `BIND-04` | 玩家 authored beat 綁到 choice／embed，或 runtime 明標 `playerAuthored: true`，不靠講者名稱猜 |
| `DEC-01` | registry 與 decision 一一對應，kind／segment／anchor／runtimeAnchor 不漂移，且圈定路徑上的每個 runtime choice 都有登錄 |
| `DEC-02` | 決策與選項皆不得預選 |
| `DEC-03` | `evidence_judgment` 至少一個可支持選項與一個可否證錯項 |
| `DEC-04` | 每個錯項都有非空 `refutedBy`，且 `relation` 限定為 `contradicts`／`confounded`／`out_of_scope`／`insufficient` |
| `DEC-05` | source／field 與 locator 真實存在；綁定 node／option 也確實 grant 同一 evidence id |
| `DEC-06` | 來源 node 可達且 dominates decision；晚出現或只在互斥支線上都失敗 |
| `DEC-07` | 零 decision 必須有可驗的 `NOT_APPLICABLE`，不能冒充完整 PASS |
| `TB-01` | 三件套路徑、版本、`REVIEW_READY` 與未施工 `reachable:false` 完整 |
| `TB-02` | 「主張—量測—證據—反證—玩家操作—成功句」六欄覆蓋每個 segment，且所有 ID 真實存在 |
| `TB-03` | planned evidence 早於 evidence judgment；沒有 scenes 也能抓 late evidence |
| `TB-04` | 每段 baseline 明示 REQUIRED 或具理由的 NOT_APPLICABLE |
| `TB-05` | 六欄的玩家操作指向同段 `kind: operation` decision |
| `TB-06` | success 以 `claimRef` 重用 canonical claim，不複製另一句答案 |
| `TB-07` | brief、provenance、contract 三檔的指定舊句均已清零 |

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

新章尚無 scenes 時：

```bash
python3 tools/skill/before-discovery-dev/scripts/mechanics_guard.py \
  --contract path/to/chapter-mechanics-contract.json \
  --to-be \
  --brief path/to/chapter-brief.md \
  --provenance path/to/provenance-sidecar.md
```

`TO_BE_CONTRACT: PASS` 與 `MECHANICS_CONTRACT: PASS` 是不同狀態。前者不能用於
Implementation Gate；runtime 存在後仍須以一般模式重跑 binder 與 dominance。

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
- 把 `runtimeAnchor` 改成不存在、不可達或段外 choice。
- TO-BE 三件套漏一件、版本空白或任一 beat 假填 `reachable:true`；
- 六欄漏列一欄、引用不存在的 option／field，或沒有覆蓋全部 segment；
- evidence field 的 `plannedOrdinal` 晚於／等於 evidence judgment；
- baseline 未表態、operation decision 未登錄或 kind 被改成 commitment；
- success `claimRef` 漂到另一個選項；
- 指定淘汰舊句仍殘留在 brief、provenance 或 contract。
- 移除／改路徑 engine adapter、讓 adapter 多印 stdout、改 engine 後偽造舊 hash，或讓逐字成功句漂移。

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
`marker` 只把 engine 已授予的具名 trace 綁回 scenes locator；runtime 自動跳過，不增加
玩家點擊，也不得用一般 `effects.evidence` 偽造工作台結果。條件台詞的 `variants` 在靜態圖
展開全部 next，runtime 則要求恰有一個變體命中。
綠燈仍不能宣稱「遊戲好玩」、「物理正確」或「戲劇完整」。

TO-BE mode 也不能自行知道作者忘了把哪一句舊話列進 `staleTextScan.phrases`，不能判斷
六欄引用的量測在科學上是否足以支持主張，也不能驗證未施工 engine 的自由操作。
這些仍由作者自查、第一輪完整對抗審與後續 runtime CONFORMANCE 負責。
