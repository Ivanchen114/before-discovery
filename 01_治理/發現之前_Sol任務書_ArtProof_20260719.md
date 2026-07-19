# Sol 任務書:G1 Art Proof(風格試作)——含生圖提示詞包

**發件**:總監(陳育詮)|**日期**:2026-07-19|**法源**:美術規格 v0.2 §4.1/§5/§7/§9、root decisions.md **ADR-006**(美術半解凍)
**你的角色**:美術主責(ADR-001)。本任務=生成+編修+整理交付,不是量產。**狀態更新**：P-5 已於 2026-07-19 全部通過；原「量產凍結至九月試玩」由 ADR-009 取代——第一章正式美術於劇本／章規格審查凍結後解凍，學生試玩改在正式風格候選版完成後。

## 先辦一件小事(上輪未結)

規格 A-1 的 verification pass 還沒交:讀 `05_審核/發現之前_第2輪審稿回應_Claude_20260719.md` 與 `03_規格/發現之前_灰盒功能規格書_v0.1.2.md`,只確認「水鐘史實宣稱已改為教學代理」是否落實,結論寫入 `05_審核/`。**通過即 v0.1.2 自動凍結生效**(總監已預裁,P-1)。

## 風格方向

**主軸=寫實歷史插畫感**(總監已選):油畫光影、電影構圖、文藝復興沉穩色盤+燭光暖調。若你專業判斷有更優方向,**得附一組對比稿**(同場景、另一風格)供總監比稿——附,不是取代。

## 交付清單(全部=Art Proof,共 7 項)

1. **風格定調圖 ×3**:書房夜景/工作室實驗/大學辯論(提示詞見下)。
2. **伽利略角色母版**:全身+6 表情 bust 測試。
3. **辛普里奧角色母版**:全身+5 表情 bust 測試。
4. **工作室背景(無人淨空版)+器材特寫組**(銅球斜槽/水鐘/摺扇/手稿)。
5. **合成稿 ×1**:風格圖+旅人筆記面板+互動 UI 區塊的版面示意(UI 文字用灰條示意,**不得把真字生進圖裡**——正式文字一律 HTML)。
6. **差分合成 A/B 測試**(用伽利略 bust):A=每表情一張整圖;B=身體固定+臉部差分疊層(附 canvasWidth/canvasHeight/anchorX/anchorY/裁切框建議)。記錄兩案的對齊工時與檔量,出 ART-ADR 草案。
7. **提示詞紀錄檔**:每張圖記提示詞/工具/種子(若有)/放大流程/人工修改(§7 義務,一張都不能漏)。

## 生圖提示詞包(英文核心+中文防呆註記)

**通用風格後綴(每張都加)**:
> Realistic historical illustration, oil-painting light and texture, cinematic composition, muted Renaissance palette with warm candlelight accents, painterly brushwork, high detail. No text, no letters, no readable writing, no watermark, no modern objects.

**通用禁令**:不用在世藝術家名字餵風格(§7);圖內不得出現可讀文字(§5.3,黑板/書頁一律抽象筆痕);中文/公式都不准生進圖。

### SF-01|書房夜景(風格定調圖 1)
> A cramped scholar's study in Pisa, Italy, year 1590, night. A YOUNG 26-year-old Galileo Galilei — lean face, short dark auburn beard, intense curious eyes — in a plain dark scholar's robe, sitting at a desk buried in handwritten manuscripts, holding two lead balls of different sizes, one in each hand, comparing them. Single candle, deep warm chiaroscuro, ink pots, quills, a small window showing the faintly leaning tower of Pisa under moonlight. Renaissance wooden furniture. 16:9.

中文防呆:**伽利略必須是 26 歲年輕人**——生成器最愛給白鬍老頭,那是 50 年後的他,直接退稿。兩顆一大一小的鉛球是序幕鉤子,必須在畫面裡。

### SF-02|工作室實驗(風格定調圖 2)
> A Renaissance workshop interior, Pisa, 1590s, daylight from high windows. A long polished wooden inclined channel about six meters long, propped on trestles at a gentle angle, a small bronze ball resting in its carved groove. Beside it a water clock: a raised vessel with a thin spout dripping into a collection bucket, and a small balance scale for weighing water. A young bearded scholar crouches at the channel's lower end marking distances with chalk. Wood shavings, carpenter tools, warm dusty light. 16:9.

中文防呆:器材結構是重點——斜槽(長木槽+刻溝)、銅球、水鐘(高壺→細流→收集桶→**天平秤水**)。這張圖定義實驗台的視覺語言,結構錯=退稿。

### SF-03|大學辯論(風格定調圖 3)
> A crowded university lecture hall in Pisa, 1590, tiered wooden benches full of students in dark robes, dust motes in shafts of window light. At the center floor two figures face off: an elderly dignified 58-year-old professor in a black academic gown with fur-trimmed collar, one hand resting on a thick worn leather-bound tome on the lectern before him, composed and authoritative; opposite him a young scholar gesturing toward a large board covered with abstract chalk marks. Tense scholarly atmosphere, Renaissance stone architecture. 16:9.

中文防呆:板上只能有**抽象粉筆痕**;辛普里奧要威嚴不要滑稽;講台上那冊書=他的權杖(ADR-008)。

### CH-01|伽利略母版(全身)
> Character design, full-body standing portrait of a YOUNG 26-year-old Galileo Galilei, Pisa 1590: lean build, short dark auburn hair, trimmed short beard, sharp curious eyes, slight confident smirk; plain dark scholar's robe over a simple doublet, worn leather shoes; holding a small bronze ball in one hand. Neutral pose, front three-quarter view, full figure head to toe, plain pale background for easy cutout. Portrait orientation.

表情測試(同臉近景 bust ×6):中性/好奇挑眉/頓悟狂喜/挫敗抓髮/專注瞇眼/自嘲苦笑。
中文防呆:六張 bust 必須是**同一張臉**——臉型漂移就重生;素背景方便去背。

### CH-02|辛普里奧母版(全身)【ADR-008 修訂版】
> Character design, full-body standing portrait of a dignified 58-year-old Italian university professor, year 1590: neatly trimmed silver-grey beard, deep-set stern eyes with quiet weariness, black academic gown with fur-trimmed collar, dark scholar's cap, clutching a thick worn leather-bound Latin tome against his chest like a sceptre — cracked spine, layered ribbon bookmarks, dog-eared pages, faint abstract illegible marginalia. Upright proud posture, front three-quarter view, full figure, plain pale background. Portrait orientation.

表情測試(bust ×5):威嚴訓示/嘲諷微笑/**翻頁的手停在半空的錯愕**/閉目長考/罕見的鄭重(給 A3-6 判定那場)。
中文防呆:他是**可敬的對手**,不是丑角;「輸給一組數字」那場戲,他的背影要撐得住。**道具=那冊《物理學》評注本(ADR-008)**:磨損、夾籤層層、頁邊批註一律抽象筆痕不得可讀;摺扇已廢——16 世紀末義大利摺扇屬宮廷女性配件,男性學者執之不符史實。

### BG-01|工作室淨空背景
SF-02 同構圖同光線,**empty of people**,前景中央留安全區(供立繪與 UI 疊放,§5.5)。

### PR-01|器材特寫組(每件單張、素底)
> Museum-catalog style close-up on plain background, same painterly style: (a) a bronze ball resting in a carved wooden groove; (b) a Renaissance water clock — raised vessel, thin spout, collection bucket, small balance scale; (c) a thick worn leather-bound Latin tome, cracked spine, layered ribbon bookmarks, lying closed on a desk (Simplicio's Physics commentary — distinct from item d); (d) a thin leather-bound handwritten manuscript with blank cover (Galileo's De Motu draft).

## 檔案與存放

- 尺寸:風格圖/背景以 §5.4 為目標(母版 ≥2560×1440;立繪長邊 ≥2400)。生成工具原生解析度不足時:先生後放大,流程記入提示詞紀錄檔。
- 命名(§5.2):`proof_sf01_study_night_v01.png`、`ch01_char_galileo_master_v01.png`、`ch01_prop_water_clock_detail_v01.png`⋯不得出現「final/最新版」。
- 存放(§5.1,資料夾自建):來源與紀錄 → `/art/source/proof/`;風格文件 → `/art/style/`。runtime 壓縮版**先不做**(等 Style Frame 選定)。
- 每件過 §9.1 單件驗收自檢(結構錯誤、多指、浮水印、亂字=退稿重生)。

## 完成後

交付清單+提示詞紀錄放入資料夾,通知總監執行 **P-5:Style Frame 選圖**。選定後才建 Style Bible 與量產模板——在那之前,不要多生。

---

## 補充單(2026-07-19,ADR-008 道具替換之重生清單)

G1 v01 已交付、已驗收(見 05_審核)。因總監裁決 ADR-008(摺扇→《物理學》評注本),下列**四件重生為 v02**,其餘 v01 不動:

1. `ch01_char_simplicio_master_v02` — 依上方 CH-02 修訂版提示詞(書代扇)。
2. `ch01_char_simplicio_expressions_v02` — 表情三改「翻頁的手停在半空的錯愕」,餘四表情沿 v01 構圖。
3. `ch01_styleframe_debate_hall_v02` — 依上方 SF-03 修訂版(講台上的書)。
4. `ch01_prop_physics_tome_detail_v01`(新件)— 依 PR-01 (c) 修訂版;`ch01_prop_folding_fan_detail_v01` **廢止**,檔案保留作歷史紀錄、不入量產清單。

兩份 Sol 維護文件已於 P-5 通過時同步：`03_規格/發現之前_第一章美術製作附錄_v0.2.md`、`art/style/ART-ADR-001`（「持扇錯愕」→「翻頁停在半空」）。劇本與 debate 資料已由 Claude 同步完畢（劇本 v0.2.1），**請勿改 04_劇本**（作者／審稿分離）。四件 v02 重生不重開 P-5（風格與構圖不變，僅道具同步）。
