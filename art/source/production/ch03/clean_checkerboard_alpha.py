#!/usr/bin/env python3
"""Convert image-generator checkerboard portraits into transparent runtime art.

The generator sometimes renders its transparency preview into the RGB pixels.
Only near-neutral, bright pixels connected to a canvas edge are removed, so
white collars and highlights enclosed by the figure remain opaque.
"""

from __future__ import annotations

import argparse
from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter


def is_preview_background(pixel: tuple[int, int, int]) -> bool:
    red, green, blue = pixel
    return min(red, green, blue) >= 210 and max(red, green, blue) - min(red, green, blue) <= 16


def matte_from_edges(image: Image.Image) -> Image.Image:
    rgb = image.convert("RGB")
    width, height = rgb.size
    pixels = rgb.load()
    seen = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()

    def enqueue(x: int, y: int) -> None:
        index = y * width + x
        if seen[index] or not is_preview_background(pixels[x, y]):
            return
        seen[index] = 1
        queue.append((x, y))

    for x in range(width):
        enqueue(x, 0)
        enqueue(x, height - 1)
    for y in range(height):
        enqueue(0, y)
        enqueue(width - 1, y)

    while queue:
        x, y = queue.popleft()
        if x:
            enqueue(x - 1, y)
        if x + 1 < width:
            enqueue(x + 1, y)
        if y:
            enqueue(x, y - 1)
        if y + 1 < height:
            enqueue(x, y + 1)

    alpha = Image.new("L", (width, height), 255)
    alpha_pixels = alpha.load()
    for y in range(height):
        row = y * width
        for x in range(width):
            if seen[row + x]:
                alpha_pixels[x, y] = 0

    return alpha.filter(ImageFilter.GaussianBlur(0.7))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("source_out", type=Path)
    parser.add_argument("runtime_out", type=Path)
    args = parser.parse_args()

    rgba = Image.open(args.input).convert("RGBA")
    rgba.putalpha(matte_from_edges(rgba))
    args.source_out.parent.mkdir(parents=True, exist_ok=True)
    args.runtime_out.parent.mkdir(parents=True, exist_ok=True)
    rgba.save(args.source_out, optimize=True)

    runtime = rgba.copy()
    runtime.thumbnail((900, 1200), Image.Resampling.LANCZOS)
    runtime.save(args.runtime_out, "WEBP", lossless=False, quality=91, method=6)


if __name__ == "__main__":
    main()
