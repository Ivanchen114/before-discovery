#!/usr/bin/env python3
"""Export Chapter 3 background masters as exact-size runtime WebP files."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()

    image = Image.open(args.input).convert("RGB")
    source_ratio = image.width / image.height
    target_ratio = 16 / 9
    if source_ratio > target_ratio:
        crop_width = round(image.height * target_ratio)
        left = (image.width - crop_width) // 2
        image = image.crop((left, 0, left + crop_width, image.height))
    elif source_ratio < target_ratio:
        crop_height = round(image.width / target_ratio)
        top = (image.height - crop_height) // 2
        image = image.crop((0, top, image.width, top + crop_height))

    image = image.resize((1920, 1080), Image.Resampling.LANCZOS)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    image.save(args.output, "WEBP", quality=86, method=6)


if __name__ == "__main__":
    main()
