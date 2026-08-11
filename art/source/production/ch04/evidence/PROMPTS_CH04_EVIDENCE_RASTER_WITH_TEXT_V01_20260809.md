---
bd_artifact: art-generation-record
bd_chapter: ch4
bd_status: candidate
---

# 第四章證據卡單張含字生成候選 v0.1

日期：2026-08-09  
工具：Codex 內建 ImageGen  
真相模式：TO-BE candidate；尚未接入 runtime

## 總監裁決與邊界

- K1、K3、K4、K5 一次生成，不先做單張 proof。
- 每張是單一點陣完成圖；文字、數字與圖示直接燒入圖片，不使用 runtime 疊圖。
- 不覆蓋現行 SVG；本批只保存候選母圖。
- 本裁決刻意偏離現行美術附錄「精確資訊以 SVG／HTML 承載」的既有做法；正式接線前須另完成文字、物理、讀屏與縮放驗收。
- 內部證據代號不出現在玩家可見圖面。

## 共用提示

> Use case: scientific-educational. Asset type: single flattened raster evidence card for the historical science game 《發現之前》. Transform the supplied reference into one complete historically grounded seventeenth-century evidence sheet. All text, numbers and diagrams are baked into the single image; no runtime overlays. Preserve the reference image's scientific relationships and exact information. Use aged rag paper, fine ink or copperplate print, restrained watercolor and period tools. Keep the page straight-on, landscape and highly readable; avoid modern UI, fantasy, evidence IDs, logos and watermarks. Reproduce all supplied Traditional Chinese and numerical text verbatim with no extra text.

## K1｜一直改向的路

參考：`/tmp/before-discovery-ch4-gen/refs/K1_orbit_deflection.png`  
輸出：`ch04_card_K1_orbit_deflection_raster_candidate_v01.png`

精確文字：

- 一直改向的路
- 同一個起點、同一個原有速度；只改「每一拍有沒有向內偏折」
- 沒有偏折
- 結果：沿切線離開
- 圓不是物體「本來就會走」的路。
- 每拍向地心改一點
- 結果：前進，同時持續改向
- 向內作用改變速度方向，不必沿圓周推著走。
- 月亮一直「落」：保留原有前進，又每一刻偏離原來的切線。

物理鎖定：左圖無向內偏折時沿切線離開；右圖保留前進並以逐拍向內改向形成曲線，不得畫成沿圓周推動。

## K3｜沒看答案前的兩個週期

參考：`/tmp/before-discovery-ch4-gen/refs/K3_sealed_predictions.png`  
輸出：`ch04_card_K3_sealed_predictions_raster_candidate_v01.png`

精確文字：

- 沒看答案前的兩個週期
- 順序就是證據的一部分：鎖規則 → 寫預測 → 封存 → 才揭露觀測。
- ① 鎖定規則
- n＝2
- a(r) ∝ 1/r²
- 此後不能看答案改律
- ② 先封存預測
- Mars 1.874
- Jupiter 11.858
- ③ 再翻觀測紙
- Mars 觀測／1.88／殘差 0.32% ✓
- Jupiter 觀測／11.86／殘差 0.02% ✓
- 兩張都在揭露前留下
- 若看完答案才把 n 調成 2，即使相合，也不能叫「預測」。
- 蠟封不是戲劇道具；它防止人看見結果後改口。

程序鎖定：預測必須先封存，之後才揭露觀測；所有小數不得改動。

## K4｜一條規則穿過三種天空

參考：`/tmp/before-discovery-ch4-gen/refs/K4_model_comparison.png`  
輸出：`ch04_card_K4_model_comparison_raster_candidate_v01.png`

精確文字：

- 一條規則穿過三種天空
- 不能只挑會贏的一格；兩個模型都跑 Moon、Planets、Comet。
- 欄：Moon／Planets／Comet
- 列：反平方／簡單渦旋
- 反平方×Moon：通過／殘差 0.8%｜補丁 0
- 反平方×Planets：通過／殘差 1.6%｜補丁 0
- 反平方×Comet：通過／殘差 2.2%｜補丁 0
- 簡單渦旋×Moon：通過／殘差 3.8%｜補丁 0
- 簡單渦旋×Planets：需補丁／殘差 12.4%｜補丁 2
- 簡單渦旋×Comet：需補丁／殘差 28.0%｜補丁 2
- 本章可說：反平方用同一條規則跨過三種天空；這個簡單渦旋版本需要更多補丁。
- 不能說：因此所有渦旋或介質模型永遠不可能成立。

比較鎖定：不得交換格位、數值或判決；必須呈現公平的雙模型對帳。

## K5｜能算到哪裡，也要停在哪裡

參考：`/tmp/before-discovery-ch4-gen/refs/K5_scoped_proof.png`  
輸出：`ch04_card_K5_scoped_proof_raster_candidate_v01.png`

精確文字：

- 能算到哪裡，也要停在哪裡
- 證據鏈、信用線與機制空白，必須在同一張校樣上同時站住。
- 證明鏈：改向／同一把尺／封存預測／模型比較／證明邊界
- 四種工作，各回自己的來源
- Hooke｜1679：把切線運動與向中心吸引放進同一問題
- Halley｜1684 追問與出版推動
- Flamsteed｜行星、衛星與彗星觀測
- Newton｜數學證明與跨天體整合
- 機制欄
- 引力如何穿過空間作用？
- 尚無來源｜留白
- 可計算規則已成立
- 不等於作用機制已解釋
- 寫清楚，不是寫大方；留下空白，也不是留下漏洞。

範圍鎖定：四條來源分開；機制欄維持未決，不得暗示已找到作用機制。

## 生成輸出

| 證據 | 候選母圖 | 原生尺寸 |
|---|---|---:|
| K1 | `ch04_card_K1_orbit_deflection_raster_candidate_v01.png` | 1536×1024 |
| K3 | `ch04_card_K3_sealed_predictions_raster_candidate_v01.png` | 1587×991 |
| K4 | `ch04_card_K4_model_comparison_raster_candidate_v01.png` | 1606×979 |
| K5 | `ch04_card_K5_scoped_proof_raster_candidate_v01.png` | 1610×977 |

四張均保存於本目錄；內建 ImageGen 的原始輸出另保留在 Codex generated_images 目錄。正式接線前仍需裁切／縮放為共同 runtime 比例並完成逐字、物理與小尺寸驗收。
