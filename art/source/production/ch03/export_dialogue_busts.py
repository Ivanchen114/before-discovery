#!/usr/bin/env python3
"""由第三章透明全身母版轉出對話框用半身 WebP。"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[4]
SOURCE = Path(__file__).resolve().parent / "characters"
OUT = ROOT / "public/assets/ch03/characters"

FILES = {
    "ch03_char_gassendi48_alpha_v01.png": "ch03_char_gassendi48_v01.webp",
    "ch03_char_captain50_alpha_v01.png": "ch03_char_captain50_v01.webp",
    "ch03_char_etienne17_alpha_v01.png": "ch03_char_etienne17_v01.webp",
}

OUT.mkdir(parents=True, exist_ok=True)
for src_name, out_name in FILES.items():
    im = Image.open(SOURCE / src_name).convert("RGBA")
    bbox = im.getchannel("A").getbbox()
    if not bbox:
        raise RuntimeError(f"角色沒有 alpha 主體:{src_name}")
    center_x = (bbox[0] + bbox[2]) / 2
    crop_h = min(round(im.height * 0.74), im.height)
    crop_w = round(crop_h * 3 / 4)
    left = max(0, min(round(center_x - crop_w / 2), im.width - crop_w))
    top = 0
    bust = im.crop((left, top, left + crop_w, top + crop_h))
    bust = bust.resize((900, 1200), Image.Resampling.LANCZOS)
    bust.save(OUT / out_name, "WEBP", quality=88, method=6)
    print(f"{src_name} -> {out_name} crop=({left},0,{left+crop_w},{crop_h})")
