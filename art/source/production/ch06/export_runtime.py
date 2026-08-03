#!/usr/bin/env python3
"""Export Chapter 6 image-generation masters to deterministic runtime WebP files."""

from pathlib import Path
from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[4]
SOURCE = ROOT / "art/source/production/ch06"
PUBLIC = ROOT / "public/assets/ch06"


def export_fit(source: Path, target: Path, size: tuple[int, int], quality: int) -> None:
    with Image.open(source) as image:
        image = ImageOps.exif_transpose(image).convert("RGBA" if image.mode == "RGBA" else "RGB")
        image = ImageOps.fit(image, size, method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))
        target.parent.mkdir(parents=True, exist_ok=True)
        image.save(target, "WEBP", quality=quality, method=6)


def export_portrait(source: Path, target: Path) -> None:
    with Image.open(source) as image:
        image = ImageOps.exif_transpose(image).convert("RGBA")
        image.thumbnail((900, 1200), Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", (900, 1200), (0, 0, 0, 0))
        canvas.alpha_composite(image, ((900 - image.width) // 2, 1200 - image.height))
        target.parent.mkdir(parents=True, exist_ok=True)
        canvas.save(target, "WEBP", quality=88, method=6, lossless=False)


BACKGROUNDS = [
    "ch06_bg_munich_arsenal_boring_floor_day",
    "ch06_bg_munich_chip_calorimetry_bench",
    "ch06_bg_munich_airtight_bore_test",
    "ch06_bg_munich_water_box_setup",
    "ch06_bg_munich_water_box_boiling_evening",
    "ch06_bg_munich_model_audit_night",
    "ch06_bg_munich_joint_page_dawn",
]

TRANSITIONS = [
    "ch06_transition_1740_unpaid_heat_debt",
    "ch06_transition_1740_1798_pagefold",
    "ch06_transition_1798_munich_arsenal_arrival",
]

PORTRAITS = [
    ("ch06_char_rumford45_alpha_v01.png", "ch06_char_rumford45_v01.webp"),
    ("ch06_char_stang52_alpha_v01.png", "ch06_char_stang52_v01.webp"),
    ("ch06_char_kessler58_alpha_v01.png", "ch06_char_kessler58_v01.webp"),
]

FUNCTIONAL = [
    (SOURCE / "experiments/ch06_lab_source_ledger_master_v01.png", PUBLIC / "experiments/ch06_lab_source_ledger_v01.webp"),
    (SOURCE / "backgrounds/ch06_bg_munich_chip_calorimetry_bench_master_v01.png", PUBLIC / "experiments/ch06_lab_chip_capacity_v01.webp"),
    (SOURCE / "experiments/ch06_lab_friction_conditions_master_v01.png", PUBLIC / "experiments/ch06_lab_friction_conditions_v01.webp"),
    (SOURCE / "experiments/ch06_lab_paper_strip_master_v01.png", PUBLIC / "experiments/ch06_lab_paper_strip_v01.webp"),
    (SOURCE / "backgrounds/ch06_bg_munich_airtight_bore_test_master_v01.png", PUBLIC / "experiments/ch06_lab_airtight_piston_v01.webp"),
    (SOURCE / "backgrounds/ch06_bg_munich_water_box_setup_master_v01.png", PUBLIC / "experiments/ch06_lab_water_box_setup_v01.webp"),
    (SOURCE / "backgrounds/ch06_bg_munich_water_box_boiling_evening_master_v01.png", PUBLIC / "experiments/ch06_lab_water_box_boiling_v01.webp"),
    (SOURCE / "backgrounds/ch06_bg_munich_model_audit_night_master_v01.png", PUBLIC / "focus/ch06_focus_model_audit_v01.webp"),
    (SOURCE / "backgrounds/ch06_bg_munich_joint_page_dawn_master_v01.png", PUBLIC / "focus/ch06_focus_joint_page_v01.webp"),
    (SOURCE / "focus/ch06_focus_hot_chip_water_master_v01.png", PUBLIC / "focus/ch06_focus_hot_chip_water_v01.webp"),
    (SOURCE / "focus/ch06_focus_latent_heat_notebook_master_v01.png", PUBLIC / "focus/ch06_focus_latent_heat_notebook_v01.webp"),
]


def main() -> None:
    for stem in BACKGROUNDS:
        export_fit(
            SOURCE / f"backgrounds/{stem}_master_v01.png",
            PUBLIC / f"backgrounds/{stem}_v01.webp",
            (1920, 1080),
            82,
        )
    for stem in TRANSITIONS:
        export_fit(
            SOURCE / f"transitions/{stem}_master_v01.png",
            PUBLIC / f"transitions/{stem}_v01.webp",
            (1672, 941),
            82,
        )
    for source_name, target_name in PORTRAITS:
        export_portrait(SOURCE / "characters" / source_name, PUBLIC / "characters" / target_name)
    for source, target in FUNCTIONAL:
        export_fit(source, target, (1200, 750), 84)


if __name__ == "__main__":
    main()
