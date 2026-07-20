# public/assets/fonts/ — 自帶字型(字體三聲部)

**目的**:世界聲部(明體)不賭玩家裝了什麼字——Windows 回退新細明體會毀掉 1590 的氣氛。故將思源宋體子集化隨遊戲出貨,離線 file:// 也吃得到。

| 檔名 | 來源 | 字重 | 內容 | 授權 |
|---|---|---|---|---|
| bd-serif-tc-regular.woff2 | Noto Serif CJK TC(思源宋體) | 400 | 全遊戲文本字集 1562 字(CJK 1407)+安全符號集 | SIL OFL 1.1(見 LICENSE-OFL-1.1.txt) |
| bd-serif-tc-bold.woff2 | 同上 | 700(映射 600–700) | 同上 | 同上 |

**字集來源**:掃描 `greybox/` 全部 .js/.html/.json/.md 的唯一字元,另加安全符號集(圈號、箭頭、全形標點等)。玩家在回顧頁自行輸入的罕字,由回退鏈(Noto Serif TC→Songti TC→系統 serif)接手,屬預期行為。

**再生成**(內容新增後若出現缺字):
```
# 1. 抽字集(掃 greybox 全文本)→ /tmp/charset.txt
# 2. 子集化(Noto Serif CJK .ttc 的 TC 面 = --font-number=3):
pyftsubset NotoSerifCJK-Regular.ttc --font-number=3 --text-file=charset.txt \
  --flavor=woff2 --output-file=bd-serif-tc-regular.woff2 \
  --layout-features='*' --no-hinting --desubroutinize
# Bold 同理。需 python 套件:fonttools、brotli。
```

**三聲部速查**(定義在 `greybox/stage.html`):`--font-dialogue`=明體(1590 世界)、`--font-ui`=黑體(現代/系統)、`--font-hand`=楷體(旅人筆記/玩家親筆)。

**楷體狀態=provisional**(Sol 字體驗證 B-2,20260720):現靠系統字(Mac=Kaiti TC、Win=標楷體),但受檢 Mac 未必裝有,退到底會與世界明體合流=第三聲部不可保證存在。**RC 前義務**:子集化一套 OFL 楷/手寫字型(候選:芫荽)比照本流程隨遊戲出貨;在那之前不得宣告三聲部完成。

**時序註記**(Sol B-1):玩家實際看到的是「標題明體(書封)→ P0-0 黑體(現代)→ 1590 明體(歷史)」三拍;標題畫面=封面例外,勿宣稱「全遊戲首次出現明體」。

**OFL 義務**:再散布須附 LICENSE-OFL-1.1.txt;不得以「Noto」原名販售字型本體;隨遊戲捆綁散布=允許。
