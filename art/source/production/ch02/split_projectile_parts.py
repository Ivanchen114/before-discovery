#!/usr/bin/env python3
"""Split the approved Chapter 2 projectile parts sheets into runtime assets.

The crop boundaries are deliberately kept in source control because the generated
plates are art sources, not a runtime atlas. Each result is trimmed by alpha and
exported both as a lossless PNG source and a compact transparent WebP runtime file.
"""

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[4]
SOURCE = ROOT / "art/source/production/ch02/props"
PARTS = SOURCE / "parts"
RUNTIME = ROOT / "public/assets/ch02/props"

# Crop boundaries are between the visibly separated objects on each 1672x941 plate.
SHEETS = {
    "ch02_prop_release_options_alpha_v01.png": [
        ("ch02_prop_release_latch_v01", (0, 0, 805, 941)),
        ("ch02_prop_release_hand_v01", (805, 0, 1672, 941)),
    ],
    "ch02_prop_edge_options_alpha_v01.png": [
        ("ch02_prop_edge_polished_v01", (0, 0, 816, 941)),
        ("ch02_prop_edge_rough_v01", (816, 0, 1672, 941)),
    ],
    "ch02_prop_rangebed_options_alpha_v01.png": [
        ("ch02_prop_range_raked_sand_v01", (0, 0, 586, 941)),
        ("ch02_prop_range_eye_board_v01", (586, 0, 1094, 941)),
        ("ch02_prop_range_fine_sand_plumb_v01", (1094, 0, 1672, 941)),
    ],
}


def trim_alpha(image: Image.Image, padding: int = 16) -> Image.Image:
    alpha = image.getchannel("A")
    bbox = alpha.getbbox()
    if not bbox:
        raise ValueError("Asset crop contains no opaque pixels")
    left, top, right, bottom = bbox
    left = max(0, left - padding)
    top = max(0, top - padding)
    right = min(image.width, right + padding)
    bottom = min(image.height, bottom + padding)
    return image.crop((left, top, right, bottom))


def runtime_copy(image: Image.Image, max_side: int = 900) -> Image.Image:
    output = image.copy()
    longest = max(output.size)
    if longest > max_side:
        scale = max_side / longest
        output.thumbnail(
            (round(output.width * scale), round(output.height * scale)),
            Image.Resampling.LANCZOS,
        )
    return output


def main() -> None:
    PARTS.mkdir(parents=True, exist_ok=True)
    RUNTIME.mkdir(parents=True, exist_ok=True)

    for sheet_name, parts in SHEETS.items():
        sheet = Image.open(SOURCE / sheet_name).convert("RGBA")
        for asset_id, crop_box in parts:
            image = trim_alpha(sheet.crop(crop_box))
            image.save(PARTS / f"{asset_id}.png", optimize=True)
            runtime_copy(image).save(
                RUNTIME / f"{asset_id}.webp",
                "WEBP",
                lossless=False,
                quality=88,
                method=6,
            )

    master = Image.open(
        SOURCE / "ch02_prop_projectile_apparatus_master_alpha_v01.png"
    ).convert("RGBA")
    runtime_copy(master, max_side=1600).save(
        RUNTIME / "ch02_prop_projectile_apparatus_master_v01.webp",
        "WEBP",
        lossless=False,
        quality=90,
        method=6,
    )


if __name__ == "__main__":
    main()
