#!/usr/bin/env python3
"""Render Chapter 4 dialogue portraits without chroma-key fringe."""

from pathlib import Path

from PIL import Image, ImageFilter


ROOT = Path(__file__).resolve().parents[2]
SOURCE_DIR = ROOT / "art/source/production/ch04/characters"
OUTPUT_DIR = ROOT / "public/assets/ch04/characters"
PORTRAITS = {
    "ch04_char_newton22_alpha_v02.png": "ch04_char_newton22_v02.webp",
    "ch04_char_newton41_alpha_v02.png": "ch04_char_newton41_v02.webp",
    "ch04_char_halley28_alpha_v02.png": "ch04_char_halley28_v02.webp",
}
TARGET_SIZE = (900, 1200)


def is_magenta_fringe(pixel, edge=False):
    red, green, blue, alpha = pixel
    strong = (
        alpha > 0
        and red >= 90
        and blue >= 70
        and red - green >= 28
        and blue - green >= 18
        and red + blue - 2 * green >= 55
    )
    edge_spill = (
        edge
        and alpha > 0
        and red >= 85
        and blue >= 45
        and red - green >= 25
        and blue - green >= 5
        and red + blue - 2 * green >= 45
    )
    return strong or edge_spill


def nearest_subject_color(pixels, fringe, width, height, x, y, original_alpha):
    min_alpha = max(24, int(original_alpha * 0.55))
    for radius in range(1, 9):
        candidates = []
        x0, x1 = max(0, x - radius), min(width - 1, x + radius)
        y0, y1 = max(0, y - radius), min(height - 1, y + radius)
        for px in range(x0, x1 + 1):
            candidates.append((px, y0))
            candidates.append((px, y1))
        for py in range(y0 + 1, y1):
            candidates.append((x0, py))
            candidates.append((x1, py))
        usable = []
        for px, py in candidates:
            color = pixels[px, py]
            if color[3] >= min_alpha and (px, py) not in fringe:
                distance = (px - x) ** 2 + (py - y) ** 2
                usable.append((distance, -color[3], color))
        if usable:
            usable.sort(key=lambda item: (item[0], item[1]))
            return usable[0][2][:3]
    return None


def despill(source):
    image = Image.open(source).convert("RGBA")
    pixels = image.load()
    width, height = image.size
    alpha = image.getchannel("A")
    eroded = alpha.filter(ImageFilter.MinFilter(11))
    edge_pixels = eroded.load()
    fringe = set()
    for y in range(height):
        for x in range(width):
            if is_magenta_fringe(pixels[x, y], edge=edge_pixels[x, y] == 0):
                fringe.add((x, y))
    replacements = []
    for x, y in fringe:
        original_alpha = pixels[x, y][3]
        replacement = nearest_subject_color(
            pixels, fringe, width, height, x, y, original_alpha
        )
        if replacement:
            replacements.append((x, y, replacement, original_alpha))
    for x, y, replacement, original_alpha in replacements:
        pixels[x, y] = (*replacement, original_alpha)
    return image, len(replacements)


def contain(image):
    rendered = image.copy()
    rendered.thumbnail(TARGET_SIZE, Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", TARGET_SIZE, (0, 0, 0, 0))
    offset = (
        (TARGET_SIZE[0] - rendered.width) // 2,
        (TARGET_SIZE[1] - rendered.height) // 2,
    )
    canvas.alpha_composite(rendered, offset)
    return canvas


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for source_name, output_name in PORTRAITS.items():
        source = SOURCE_DIR / source_name
        output = OUTPUT_DIR / output_name
        cleaned, replaced = despill(source)
        contain(cleaned).save(
            output,
            "WEBP",
            quality=94,
            method=6,
            exact=True,
        )
        print(f"{output.relative_to(ROOT)}: replaced {replaced} fringe pixels")


if __name__ == "__main__":
    main()
