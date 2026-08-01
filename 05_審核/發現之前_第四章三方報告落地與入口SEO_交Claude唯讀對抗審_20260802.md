# 《發現之前》第四章三方報告落地與入口／SEO｜交 Claude 唯讀對抗審

日期：2026-08-02
性質：發布後可重現的唯讀對抗審施工包；不得直接修改受審檔案。
判定格式：A／B／C，逐條提供位置、可重現證據、直接修法與驗證條件。

## 一、這次實際落地的範圍

1. 依 `發現之前_第四章台詞審查_三方交叉驗證彙整報告_20260802.md` 落地第四章 B1–B7、C1–C9。
2. `scenes4.json` 是台詞正本，`scenes4.js` 為生成鏡像；節點 ID、選項 ID、effects 與導向不得因潤稿改動。
3. 將第四章工作台玩家可見的「玩家／系統／賭注／押注」後台語彙改為世界內說法；引擎保存值不改，以顯示層轉譯保留舊存檔。
4. 標題頁加入 capability-first 的非阻塞遊玩建議：有 Fullscreen API 就顯示全螢幕；iPhone 無 API 且為 HTTP(S) 才顯示「分享 → 加入主畫面」；standalone、已全螢幕或本次工作階段已略過則隱藏。
5. 補齊作者、OG／Twitter、JSON-LD、H1、manifest 根路徑與 sitemap 日期；單一 canonical 仍是正式根網址。

## 二、受審檔案與 SHA-256

| 檔案 | SHA-256 |
|---|---|
| `greybox/data/scenes4.json` | `b069fb68960b252030477e7f0bad659ac378f764e6ff8c4786e91ecf50690e48` |
| `greybox/data/scenes4.js` | `25b635720c75ac45dbc969a1f0e3e031c758a04719b255af753eb1dcf912ba10` |
| `greybox/src/chapter-ui.js` | `3fb62128b2e2772c3da6eea82bd88a66d8689ffbe7a7f0e4f581d23a62e9824f` |
| `greybox/stage.html` | `a4421f47420023f7ceedca41bc4d608779a9cbc7696f4e19a067a6137d991f0f` |
| `greybox/src/play-experience.js` | `67ba5b39d9ddac89a7af910cf942576a86c79383e1311287ece74fb544a920d9` |
| `greybox/src/stage/08-mobile.part.js` | `0a898953a3b8f248b788cd6973b661e3fb7b9f819667186f116b09e86e6a4570` |
| `greybox/tests/run-node.mjs` | `6a0f0989e854aee7d880e66b049ddd706902b51d8bd3e9618789584b64c441c5` |
| `greybox/tests/run-ch4-art.mjs` | `b6ac4a3d41b93e8e3fe6b74199ac9a63e27c22ec1af5e5b684ae8c72242a55e9` |
| `greybox/tests/run-series-home.mjs` | `4392ca2173c6f659aaca165cc0575cc3fcdd2ec15da08d450b25653294596152` |

若任何 SHA 不符，先停止；不得把不同版本混成同一輪判定。

## 三、請實攻的九條路徑

1. **劇透邊界**：D2-1 山頂大砲揭示前，逐節點與逐選項掃描大砲／軌道結論；確認新 D0-2/c0 仍只承諾可攜帶的船紙範圍。
2. **選項語域**：D0-2/c0、DE-1/c1 正解不得靠獨自最長、獨自具限制詞或獨自完整而洩答；錯項仍須像人會選的主張。
3. **時間與跨章記憶**：第四章對馬賽實驗只能說兩天；「比薩斜面／帕多瓦」不得退回「第一章／第二章」。
4. **心聲與舞台句**：D0-1/n4a、D0-1/n5、D0-2/a3 必須走 `line/stage`，且 active OS 配額仍為 10；舊游標與 active 281 節點不可被改壞。
5. **動態 UI**：遍歷第四章五座工作台的初始、失敗、成功與封存狀態；玩家可見 DOM 不得出現後台語彙，engine4 原值與 schema-2 存檔仍須相容。
6. **印刷史實邊界**：名牌只顯示「印刷工」，但玩家在章內必須能看見「合成人物」揭露；不可讓揭露消失。
7. **iPhone 分流**：變異平台矩陣，特別檢查「iPhone 但已有 Fullscreen API」走一般全螢幕，不被送進舊式安裝教學；請求失敗不得寫入略過狀態。
8. **可及性／版面**：提示不可是 modal；開始／繼續始終可操作；兩個按鈕至少 44px；844×390 無溢出。真 iPhone／Android 仍須另列未驗，不可以模擬器冒充真機。
9. **SEO 真相**：JSON-LD 可解析、作者與學校一致、canonical 唯一、sitemap 只列正式根頁；OG／結構化資料缺漏不應被誤判為 Search Console「無法擷取」的直接原因。

## 四、反向控制最低要求

至少完成下列變異並證明測試轉紅、訊息命中宣稱的層：

- 把大砲結論塞回 D0-2/c0 選項。
- 把 DE-1/c1 正解改成獨自最長且限制詞最多。
- 把 `D0-1/n2` 改回「半個月」。
- 把 `D0-1/n4a` 改回 `inner`。
- 讓動態工作台重新顯示「系統不能代貼」。
- 把 iPhone＋Fullscreen API 錯分到 `ios-install`。
- 移除 JSON-LD 作者或把 manifest `start_url` 改回舊 redirect 路徑。

空變異一律報 B，不得以現況內容乾淨代替護欄有效。

## 五、現行驗證證據

- `cd greybox && npm test`：139 通過、0 失敗。
- 第四章 migration：19 組、205 個 legacy cursor 通過。
- `git diff --check`：通過。
- `xmllint --noout sitemap.xml`：通過。
- served browser 定點：844×390 標題頁無水平／垂直溢出，提示按鈕 44px；第一、二、四章續玩入口可進；console error 0。

以上不等於真人完整通關。iPhone Safari 加入主畫面、Android 全螢幕／鎖向、VoiceOver、200% 字級與第四章真機逐場節奏仍須列為未驗。

## 六、回報格式

先給 `A=x、B=y、C=z` 與是否放行，再列：

1. 被推翻的宣稱。
2. 精確位置與重現步驟。
3. 最小修法。
4. 修後驗證條件與反向控制。
5. 未驗清單。

若 A／B 皆為 0，明確寫「就已攻擊路徑放行」，不要擴張成全章真人體感已驗收。
