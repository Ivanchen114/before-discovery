#!/usr/bin/env python3
"""Render Chapter 4 dialogue-focus prop masters for the web runtime."""

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[2]
SOURCE_DIR = ROOT / "art/source/production/ch04/props"
OUTPUT_DIR = ROOT / "public/assets/ch04/props"
PROPS = {
    "ch04_prop_tangent_geometry_base_master_v01.png":
        ("ch04_prop_tangent_geometry_base_v01.webp", (1200, 800)),
    "ch04_prop_tangent_prediction_sheet_master_v03.png":
        ("ch04_prop_tangent_prediction_sheet_v03.webp", (1200, 750)),
    "ch04_prop_rope_ball_setup_master_v01.png":
        ("ch04_prop_rope_ball_setup_v01.webp", (1200, 800)),
    "ch04_prop_hooke_letter_reconstruction_master_v01.png":
        ("ch04_prop_hooke_letter_reconstruction_v01.webp", (1200, 800)),
    "ch04_prop_halley_sealed_observation_box_master_v01.png":
        ("ch04_prop_halley_sealed_observation_box_v01.webp", (1200, 800)),
    "ch04_prop_print_credit_sources_master_v01.png":
        ("ch04_prop_print_credit_sources_v01.webp", (1200, 800)),
}


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for source_name, (output_name, target_size) in PROPS.items():
        source = SOURCE_DIR / source_name
        output = OUTPUT_DIR / output_name
        with Image.open(source) as image:
            rendered = image.convert("RGB").resize(
                target_size,
                Image.Resampling.LANCZOS,
            )
            rendered.save(output, "WEBP", quality=84, method=6)
        print(output.relative_to(ROOT))


if __name__ == "__main__":
    main()
