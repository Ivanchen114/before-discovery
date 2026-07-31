"""P0-0 v02 screen-state compositor (art-source utility, not runtime code)."""

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parent
PROJECT = ROOT.parents[4]
SANS = "/System/Library/Fonts/STHeiti Medium.ttc"
SERIF = "/System/Library/Fonts/Supplemental/Songti.ttc"


def font(path: str, size: int, index: int = 0):
    return ImageFont.truetype(path, size=size, index=index)


def gradient(size, top, bottom):
    w, h = size
    a = np.array(top, dtype=np.float32)
    b = np.array(bottom, dtype=np.float32)
    rows = np.linspace(a, b, h).astype(np.uint8)
    arr = np.repeat(rows[:, None, :], w, axis=1)
    return Image.fromarray(arr, "RGB")


def rounded_panel(canvas, box, fill, outline=None, radius=22, width=2):
    ImageDraw.Draw(canvas).rounded_rectangle(
        box, radius=radius, fill=fill, outline=outline, width=width
    )


def crop_cover(image, size, centering=(0.5, 0.5)):
    return ImageOps.fit(image, size, Image.Resampling.LANCZOS, centering=centering)


def make_article_screen():
    size = (1200, 680)
    im = gradient(size, (10, 16, 23), (18, 25, 31))
    draw = ImageDraw.Draw(im)
    gold = (210, 163, 86)
    ivory = (238, 233, 220)
    muted = (164, 180, 188)

    draw.rectangle((0, 0, 1200, 72), fill=(7, 11, 15))
    draw.rectangle((0, 70, 1200, 74), fill=gold)
    draw.text((48, 20), "物理史專題｜斜塔傳說", font=font(SANS, 28), fill=gold)
    draw.text((1060, 20), "00:49", font=font(SANS, 28), fill=(196, 207, 213))

    draw.text((48, 118), "比薩斜塔上，", font=font(SERIF, 56, 2), fill=ivory)
    draw.text((48, 192), "他真的丟過那兩顆球嗎？", font=font(SERIF, 52, 2), fill=ivory)
    draw.rectangle((50, 282, 655, 286), fill=gold)

    body = [
        "通俗故事常這樣開場：亞里斯多德錯了一千九百年，",
        "直到伽利略登上斜塔。",
        "可那兩顆球，真的落下過嗎？",
    ]
    y = 322
    for line in body:
        draw.text((50, y), line, font=font(SANS, 29), fill=muted)
        y += 52

    # Reuse the project's established Pisa view as an editorial image; text remains exact typography.
    pisa = Image.open(PROJECT / "public/assets/ch01/backgrounds/bg_pisa_arcade.webp").convert("RGB")
    pisa = crop_cover(pisa.crop((1180, 0, 1920, 1040)), (410, 430), (0.62, 0.45))
    pisa = ImageEnhance.Color(pisa).enhance(0.72)
    pisa = ImageEnhance.Brightness(pisa).enhance(0.72)
    mask = Image.new("L", pisa.size, 255)
    mask = mask.filter(ImageFilter.GaussianBlur(1.2))
    im.paste(pisa, (744, 118), mask)
    draw = ImageDraw.Draw(im)
    draw.rounded_rectangle((742, 116, 1156, 552), radius=18, outline=(93, 105, 112), width=3)
    draw.rectangle((742, 500, 1156, 552), fill=(8, 13, 18, 220))
    draw.text((768, 511), "比薩｜流傳四百年的一幕", font=font(SANS, 24), fill=(222, 214, 193))

    draw.text((50, 618), "閱讀這段歷史之前，先問：我們真正知道了什麼？", font=font(SANS, 24), fill=(126, 145, 154))
    return im


def make_news_screen():
    size = (1200, 680)
    im = gradient(size, (7, 14, 22), (16, 24, 31))
    draw = ImageDraw.Draw(im)
    gold = (224, 172, 74)
    ivory = (244, 240, 230)
    muted = (179, 196, 204)
    rust = (133, 45, 37)

    draw.rectangle((0, 0, 1200, 80), fill=(8, 12, 17))
    draw.rectangle((0, 0, 190, 80), fill=rust)
    draw.text((31, 19), "突發新聞", font=font(SANS, 34), fill=ivory)
    draw.text((225, 22), "地磁風暴特別報導", font=font(SANS, 28), fill=gold)
    draw.text((1060, 22), "00:49", font=font(SANS, 28), fill=(205, 214, 219))

    draw.text((48, 122), "罕見強烈地磁風暴", font=font(SERIF, 58, 2), fill=ivory)
    draw.text((48, 191), "抵達地球", font=font(SERIF, 58, 2), fill=ivory)
    draw.rectangle((50, 274, 672, 278), fill=gold)
    draw.text((50, 310), "低緯度地區出現極光｜多地通訊異常", font=font(SANS, 30), fill=muted)
    draw.text((50, 368), "監測單位：本次強度遠超預報，", font=font(SANS, 28), fill=(220, 225, 224))
    draw.text((50, 417), "異常增幅原因待查。", font=font(SANS, 28), fill=gold)

    aurora = Image.open(ROOT / "p0_0_plate02_taipei_aurora_v02.png").convert("RGB")
    aurora = crop_cover(aurora.crop((500, 0, 1270, 500)), (405, 360), (0.48, 0.4))
    aurora = ImageEnhance.Contrast(aurora).enhance(1.05)
    im.paste(aurora, (754, 113))
    draw = ImageDraw.Draw(im)
    draw.rounded_rectangle((752, 111, 1161, 476), radius=18, outline=(80, 103, 113), width=3)
    draw.rectangle((752, 424, 1161, 476), fill=(6, 12, 18))
    draw.text((776, 436), "台北｜即時畫面", font=font(SANS, 24), fill=(231, 226, 213))

    draw.rectangle((0, 566, 1200, 680), fill=(5, 10, 15))
    draw.rectangle((0, 566, 1200, 571), fill=rust)
    draw.text((48, 590), "通訊異常　｜　GPS 訊號中斷　｜　航班大面積延誤", font=font(SANS, 28), fill=(208, 214, 214))
    draw.text((48, 634), "低緯極光警報持續更新", font=font(SANS, 23), fill=(151, 170, 178))
    return im


def perspective_coeffs(dst, src):
    matrix = []
    values = []
    for (x, y), (u, v) in zip(dst, src):
        matrix.append([x, y, 1, 0, 0, 0, -u * x, -u * y])
        values.append(u)
        matrix.append([0, 0, 0, x, y, 1, -v * x, -v * y])
        values.append(v)
    return np.linalg.solve(np.asarray(matrix), np.asarray(values)).tolist()


def composite(base_path, screen, dst, out_path):
    base = Image.open(base_path).convert("RGBA")
    sw, sh = screen.size
    src = [(0, 0), (sw - 1, 0), (sw - 1, sh - 1), (0, sh - 1)]
    coeffs = perspective_coeffs(dst, src)
    warped = screen.convert("RGBA").transform(
        base.size,
        Image.Transform.PERSPECTIVE,
        coeffs,
        Image.Resampling.BICUBIC,
        fillcolor=(0, 0, 0, 0),
    )
    mask = Image.new("L", base.size, 0)
    ImageDraw.Draw(mask).polygon(dst, fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(0.7))
    base.alpha_composite(Image.composite(warped, Image.new("RGBA", base.size), mask))
    base.convert("RGB").save(out_path, quality=96)


def main():
    screens = ROOT / "screens"
    screens.mkdir(exist_ok=True)
    article = make_article_screen()
    news = make_news_screen()
    article.save(screens / "p0_screen_article_v02.png")
    news.save(screens / "p0_screen_news_v02.png")

    composite(
        ROOT / "p0_0_plate00_taipei_home_v02.png",
        article,
        [(652, 536), (1092, 536), (1137, 782), (610, 782)],
        ROOT / "p0_0_plate00_taipei_establishing_final_v02.png",
    )
    composite(
        ROOT / "p0_0_plate01_taipei_news_v02.png",
        article,
        [(584, 420), (1111, 420), (1145, 716), (538, 716)],
        ROOT / "p0_0_plate01_taipei_article_final_v02.png",
    )
    composite(
        ROOT / "p0_0_plate02_taipei_aurora_v02.png",
        news,
        [(584, 420), (1111, 420), (1145, 716), (538, 716)],
        ROOT / "p0_0_plate02_taipei_news_final_v02.png",
    )


if __name__ == "__main__":
    main()
