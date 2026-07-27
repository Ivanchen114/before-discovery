#!/usr/bin/env python3
"""Render Chapter 5 evidence-card masters for the web runtime."""

from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[2]
SOURCE_DIR = ROOT / "art/source/production/ch05/evidence"
OUTPUT_DIR = ROOT / "public/assets/ch05/evidence"
TARGET_SIZE = (1200, 750)
CARDS = {
    "ch05_card_S6_quantity_of_motion_treatise_master_v01.png":
        "ch05_card_S6_quantity_of_motion_treatise_v01.webp",
    "ch05_card_S7_clay_report_master_v01.png":
        "ch05_card_S7_clay_report_v01.webp",
    "ch05_card_J1_signed_momentum_ledger_master_v02.png":
        "ch05_card_J1_signed_momentum_ledger_v02.webp",
    "ch05_card_J2_vis_viva_ledger_master_v02.png":
        "ch05_card_J2_vis_viva_ledger_v02.webp",
    "ch05_card_J3_clay_depth_master_v01.png":
        "ch05_card_J3_clay_depth_v01.webp",
    "ch05_card_J4_two_ledgers_master_v01.png":
        "ch05_card_J4_two_ledgers_v01.webp",
}


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for source_name, output_name in CARDS.items():
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
