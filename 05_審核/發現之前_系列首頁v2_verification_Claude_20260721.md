# 系列首頁 v2 verification(Claude,2026-07-21)

**對象**:Sol commit `a941a39`(redesign title screen for series and mobile landscape)。**結論:通過,一項 B 級整合縫呈報。**

## 檢核

| # | 項目 | 結果 |
|---|---|---|
| 1 | `npm test` 66/66(含 Sol 新增「系列首頁 v2」契約測試:單屏殼/章節列/字體分工/進度歸屬/低高度保留讀屏說明) | ✅ |
| 2 | 章節路由:`data-chapter="ch01"` 可玩、`ch02` disabled;首頁=系列入口非第一章專屬 | ✅ |
| 3 | 字體三聲部:系列名/章名=明體(--font-dialogue)、按鈕/狀態/模式說明=黑體(--font-ui)——符合原則 29 | ✅ |
| 4 | 續玩顯示模式+遊玩天數(`continueMeta`,chapter-ui 讀存檔唯讀)——純度不破 | ✅ |
| 5 | 灰盒 chapter.html 僅 +1 行(對照殼最小同步) | ✅ |

## B-1|直向自動橫置(GB-ADR-016)× 窄高媒體查詢的整合縫

`stage.html` 標題區保留 `@media (max-width:760px) and (min-height:521px) → #titleCard 單欄+overflow-y:auto`(窄高視窗用)。**media query 依視窗而非旋轉後舞台**:手機直拿時(390×844)GB-ADR-016 已把舞台轉成 844×390 視覺橫屏,但此分支仍命中 → 橫舞台內渲染直版單欄捲動卡,與 v2「單屏無捲動」目標相悖。

**處置(2026-07-21 追記)**:總監授權 Claude 代修,採方案 a 之系統化版——不只標題卡,**全站 18 個 media 區塊一次對齊**(13 個低高度區塊加直向旋轉替代式、5 個窄高窄寬區塊鎖 pointer:fine;iPad 直拿以 max-width:520 排除)。契約測試鎖定;66/66。詳 GB-ADR-016 補記。**請 Sol 事後複驗**(特別是 844×390 真橫屏未受波及+iPad 直拿旋轉後的桌面版面)。

**原建議修法(擇一,Sol 裁)**:
a. 窄高分支加 `and (pointer: fine)`——排除觸控直向(它已被 016 轉橫),桌機窄窗保留單欄捲動;另在 `(orientation: portrait) and (pointer: coarse)` 區塊把標題卡映射到低高度橫屏規則(844×390 同款)。
b. 016 的旋轉區塊內直接覆寫 titleCard 為橫屏 grid(重複規則較多,但自包含)。

真機表現:總監直拿手機開首頁即可肉眼判定(單欄直版=中縫;橫版雙欄=已解)。

## 首頁鐵則(已入 SKILL/記憶,防後續覆蓋)

首頁=系列單屏入口;修改前必讀 `a941a39`;禁恢復縱向長卡與 overflow-y:auto 首頁(桌機窄窗豁免待 B-1 裁定);第二章 runtime 完成時沿 `data-chapter="ch02"` 接路由與分章存檔,**不另做第二套首頁**。
