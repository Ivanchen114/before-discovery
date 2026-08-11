---
bd_artifact: contract-final-verification
bd_chapter: ch7
bd_status: conditional-pass
bd_mode: TO-BE
bd_lane: R0
bd_work_package: WP-CH7-EM1-CONTRACT-V03-FINAL
---

# 第七章 Mechanics Contract v0.3：Sol 定點終驗

**日期**：2026-08-10
**範圍**：只驗前輪指定五項，不擴題。
**總裁決**：**CONDITIONAL PASS——A×0、B×2、C×1。兩處機械殘留修正後可進 Design Gate，無需再回 Sol。**

## 一、五項驗收

| 項目 | 結果 | 證據 |
|---|---|---|
| GRID_BASELINE／t_baseline | PASS | evidenceSources 首筆為 GRID_BASELINE；trace 鏈首為 t_baseline；正向判讀引用 preparation_verified |
| 正向結論縮到證據範圍 | PASS（decision） | `m-a-both-fell-record-configs-separately` 只說 M／A 全稱失敗、配置分開記、不能指定統一角色 |
| 接線與謹慎路入 registry | PASS | 新增 `em1-configure-circuit`、`em1-next-discriminating-config`；BLOCKED_ENGINE_ADAPTER 明載 |
| Spine M／A 逐字一致 | PASS | commitment、resistance、commitBeforeReveal 都使用 M／A 完整句 |
| testedScope | PASS | GRID_STATE 新增頂層 testedScope；always-both 以 insufficient 對照已測範圍 |

定點工具結果：JSON_PARSE PASS；4 decisions／7 evidence sources；`check-mechanics` 為**預期 FAIL 14**＝MEC-01×1、BIND-01×1、MEC-02×8、DEC-01×4。新增兩筆 decision 後由 12 變 14，組成合理；沒有新格式錯誤。BLOCKED 仍是正確狀態。

## 二、B 級兩處機械殘留

### B-1｜Success beat 還留著被撤回的過度結論

`em1-config-verdict` 正向選項已縮句，但 `mechanicalSpine.success._planned` 仍寫「這隻腿在不同接法裡，扮演的角色不相同」。請逐字換成已核准的範圍句：

> M 與 A 兩個全稱都失敗；不同配置必須分開記，目前不能指定統一的來源角色。

否則劇本作者可能從 success beat 抄回被 decision 撤掉的舊答案。

### B-2｜接線是 operation，不是 experiment commitment

`em1-configure-circuit` 已進 registry，但 registry 與 decision 的 `kind` 都寫成 `experiment_commitment`。這一筆描述玩家實際接線，現行合法枚舉已有 `operation`；兩處均改為：

```json
"kind": "operation"
```

`em1-next-discriminating-config` 才維持 `experiment_commitment`。

## 三、C 級

內容版已 v0.3，檔名仍為 `v0.1`，upstream 又標 brief／provenance v0.2。Design Gate 固定快照前統一檔名、版本與引用即可；不影響本輪語意結論。

## 四、Gate 建議

Fable 吸收 B×2 後，**不需第四次 contract 複核**。總監可在同一輪補題材章與 Design Gate：

> `TOPIC GATE: PASS — CH7 = EM1 Galvani × Volta`

> `DESIGN GATE: PASS — CH7《一隻腿的證詞》chapter-brief v0.3＋provenance v0.2＋mechanics contract v0.3；時間跨到 1800，Galvani 之死只作餘波`

此 Gate 授權 Fable 進劇本，不授權 Sol 建 runtime。`scenes7.json`、chapter registry、engine adapter、存檔與實作仍須劇本凍結後另立 implementation CR 與 Runtime Design Gate。

## 五、交付狀態

Outcome: CONDITIONAL PASS（A×0、B×2、C×1；B×2 吸收後免複核）
Truth mode: TO-BE
Target and comparison baseline: mechanics contract 內容版 v0.3；只比對前輪五項
Design Gate: RECOMMENDED AFTER B×2
Files changed: 僅新增本定點終驗；Fable contract 零修改
Focused tests: JSON_PARSE PASS；check-mechanics＝預期 FAIL 14；router＝SOURCES_ROUTED／ch7 unregistered CAUTION
Full tests: NOT RUN（R0 唯讀定點終驗）
Registry updated: N-A
Browser/device: N-A
Accessibility: N-A
Independent review: 本報告即 Sol 定點終驗
Human playtest: N-A
VCS: 未 stage、未 commit
Release: N-A
Production smoke: N-A
Known gaps: B×2、版本名；runtime／adapter／canonical scenes 仍按計畫 BLOCKED
Preserved foreign WIP: YES
