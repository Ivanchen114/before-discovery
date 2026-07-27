#!/usr/bin/env python3
"""Render Chapter 5 workbench illustration masters for the web runtime."""

from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[2]
SOURCE_DIR = ROOT / "art/source/production/ch05/experiments"
OUTPUT_DIR = ROOT / "public/assets/ch05/experiments"
TARGET_SIZE = (1200, 750)
PLATES = {
    "ch05_lab_collision_rig_master_v01.png":
        "ch05_lab_collision_rig_v01.webp",
    "ch05_lab_clay_depth_rig_master_v01.png":
        "ch05_lab_clay_depth_rig_v01.webp",
    "ch05_focus_unequal_putty_question_master_v01.png":
        "ch05_focus_unequal_putty_question_v01.webp",
}


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for source_name, output_name in PLATES.items():
        source = SOURCE_DIR / source_name
        output = OUTPUT_DIR / output_name
        with Image.open(source) as image:
            rendered = ImageOps.fit(
                image.convert("RGB"),
                TARGET_SIZE,
                method=Image.Resampling.LANCZOS,
                centering=(0.5, 0.5),
            )
            rendered.save(output, "WEBP", quality=86, method=6)
        print(output.relative_to(ROOT))


if __name__ == "__main__":
    main()
