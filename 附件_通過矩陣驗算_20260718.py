# -*- coding: utf-8 -*-
"""通過矩陣一致性驗算(R-DATA-03 邏輯)
模型:讀值 = B(傾角) + S(計時,傾角)*計時樣式[run] + 槽面樣式[run] + 球體樣式[run],下限夾制 1
判定:選集內部一致性 Δi/Δ1 對 (3,5,7) 偏差各 <= 12%
(預測項玩家可依 9*Δ̄1 直接命中,故可判定性的實質門檻 = 內部一致性)
"""
B = {"緩":[12,36,60,84], "中":[14,42,70,98], "陡":[22,66,110,154]}
SEV = {"水鐘":{"緩":0.5,"中":1,"陡":2.5}, "脈搏":{"緩":1,"中":2.5,"陡":5}, "音格":{"緩":0.5,"中":0.5,"陡":0.5}}
TIMER = {"水鐘":[[0,2,-2,2],[1,0,1,-1],[0,-2,0,2]],
         "脈搏":[[-2,5,-6,4],[3,-4,2,-5],[-1,6,-3,-2]],
         "音格":[[0,1,-1,1],[1,-1,1,-1],[0,0,-1,1]]}
SURF = {"打磨":[[0,0,0,0]]*3, "原木":[[-1,-5,-4,-12],[0,-3,-7,-7],[-2,-2,-5,-10]]}
BALL = {"銅大":[[0,0,0,0]]*3, "銅小":[[1,0,-1,0],[0,1,0,-1],[-1,0,1,0]], "木球":[[0,0,9,0],[0,8,0,0],[7,0,0,-2]]}

def deltas(inc, tm, sf, bl, run):
    return [max(1, B[inc][i] + SEV[tm][inc]*TIMER[tm][run][i] + SURF[sf][run][i] + BALL[bl][run][i]) for i in range(4)]

def dev(d):
    return [abs(d[i]/d[0]-t)/t for i,t in ((1,3),(2,5),(3,7))]

def ok(d): return all(x <= 0.12 for x in dev(d))

def avg3(inc, tm, sf, bl):
    rs = [deltas(inc,tm,sf,bl,r) for r in range(3)]
    return [sum(r[i] for r in rs)/3 for i in range(4)]

def cell(inc, tm, sf="打磨", bl="銅大"):
    singles = [ok(deltas(inc,tm,sf,bl,r)) for r in range(3)]
    return singles, ok(avg3(inc,tm,sf,bl))

# 矩陣規範(打磨+銅):(單次, 三次平均)
EXPECT = {("緩","水鐘"):(True,True), ("緩","音格"):(True,True), ("陡","音格"):(True,True), ("中","水鐘"):(True,True),
          ("緩","脈搏"):(False,True),
          ("陡","水鐘"):(False,False), ("陡","脈搏"):(False,False), ("中","脈搏"):(False,False)}
# 未列於矩陣之(中,音格):規格未規範,僅回報

print("=== 打磨+銅大(矩陣主表) ===")
viol = []
for (inc,tm),(es,ea) in EXPECT.items():
    s,a = cell(inc,tm)
    # 單次「通過」解讀:任一次執行皆應可判定;「不通過」:任一次都不應可判定
    s_actual = all(s) if es else not any(s)
    ok_s = "✓" if s_actual else "✗ 違規"
    ok_a = "✓" if a==ea else "✗ 違規"
    print(f"{inc}+{tm}: 單次 各run={s} 規範={'通過' if es else '不通過'} {ok_s} | 三平均 實際={'過' if a else '不過'} 規範={'過' if ea else '不過'} {ok_a}")
    if not s_actual: viol.append(f"{inc}+{tm} 單次")
    if a!=ea: viol.append(f"{inc}+{tm} 三平均")

print("\n=== 原木槽面(規範:一律不通過) ===")
for inc in B:
    for tm in TIMER:
        s,a = cell(inc,tm,sf="原木")
        if any(s) or a:
            print(f"原木 {inc}+{tm}: 單次={s} 三平均={'過' if a else '不過'}  ✗ 違規")
            viol.append(f"原木 {inc}+{tm}")

print("\n=== 木球(規範:一律不通過) ===")
for inc in B:
    for tm in TIMER:
        s,a = cell(inc,tm,bl="木球")
        if any(s) or a:
            print(f"木球 {inc}+{tm}: 單次={s} 三平均={'過' if a else '不過'}  ✗ 違規")
            viol.append(f"木球 {inc}+{tm}")

print("\n=== 銅小抽查(應與銅大同判) ===")
for (inc,tm) in [("緩","水鐘"),("陡","水鐘"),("緩","脈搏")]:
    s,a = cell(inc,tm,bl="銅小")
    print(f"銅小 {inc}+{tm}: 單次={s} 三平均={'過' if a else '不過'}")

print("\n關鍵數據示例:")
d = deltas("陡","水鐘","打磨","銅大",0)
print(f"陡+水鐘 run1 讀值={d} 偏差={[f'{x:.1%}' for x in dev(d)]} → 內部一致性通過(規範要求不通過)")
d = deltas("緩","水鐘","原木","銅大",0)
print(f"原木緩+水鐘 run1 讀值={d} 偏差={[f'{x:.1%}' for x in dev(d)]}")
d = deltas("中","水鐘","打磨","木球",0)
print(f"木球中+水鐘 run1 讀值={d} 偏差={[f'{x:.1%}' for x in dev(d)]}")

print(f"\n>>> 矩陣違規總數:{len(viol)} 處")
for v in viol: print("   -", v)
