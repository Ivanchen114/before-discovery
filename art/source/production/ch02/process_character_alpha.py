#!/usr/bin/env python3
"""Clean chroma spill from dialogue portraits and export transparent WebP.

The shared chroma-key helper creates the matte. This second pass only neutralizes
fully opaque green contamination around fine hair, where the source renderer can
bake the key color into individual strands.
"""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageFilter


def clean_edge_spill(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    alpha = rgba.getchannel("A")
    # A wide minimum filter marks opaque strands that are still close to the matte.
    near_transparency = alpha.filter(ImageFilter.MinFilter(11))
    pixels = rgba.load()
    edge = near_transparency.load()

    for y in range(rgba.height):
        for x in range(rgba.width):
            red, green, blue, opacity = pixels[x, y]
            if opacity == 0 or edge[x, y] >= 250:
                continue
            neutral = max(red, blue)
            if green > neutral + 4:
                pixels[x, y] = (red, neutral + 2, blue, opacity)
    return rgba


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--source-out", type=Path, required=True)
    parser.add_argument("--runtime-out", type=Path, required=True)
    args = parser.parse_args()

    image = clean_edge_spill(Image.open(args.input))
    args.source_out.parent.mkdir(parents=True, exist_ok=True)
    args.runtime_out.parent.mkdir(parents=True, exist_ok=True)
    image.save(args.source_out, optimize=True)

    runtime = image.copy()
    if runtime.height > 1200:
        runtime.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
    runtime.save(
        args.runtime_out,
        "WEBP",
        lossless=False,
        quality=90,
        method=6,
    )


if __name__ == "__main__":
    main()
