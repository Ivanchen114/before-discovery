#!/usr/bin/env python3
"""Export six question handoffs and four future echoes to runtime WebP files."""

from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[4]
SOURCE_DIR = ROOT / "art/source/production/epilogues"

EXPORTS = {
    "ch01_epilogue_unresolved_arc_master_v01.png":
        "public/assets/ch01/epilogues/ch01_epilogue_unresolved_arc_v01.webp",
    "ch02_epilogue_motion_continues_master_v01.png":
        "public/assets/ch02/epilogues/ch02_epilogue_motion_continues_v01.webp",
    "ch03_epilogue_moon_question_master_v01.png":
        "public/assets/ch03/epilogues/ch03_epilogue_moon_question_v01.webp",
    "ch04_epilogue_two_collision_accounts_master_v01.png":
        "public/assets/ch04/epilogues/ch04_epilogue_two_collision_accounts_v01.webp",
    "ch05_epilogue_blank_receipt_master_v01.png":
        "public/assets/ch05/epilogues/ch05_epilogue_blank_receipt_v01.webp",
    "ch06_epilogue_unmeasured_exchange_master_v01.png":
        "public/assets/ch06/epilogues/ch06_epilogue_unmeasured_exchange_v01.webp",
    "ch03_future_echo_apollo8_master_v01.png":
        "public/assets/ch03/epilogues/ch03_future_echo_apollo8_v01.webp",
    "ch04_future_echo_sputnik_master_v01.png":
        "public/assets/ch04/epilogues/ch04_future_echo_sputnik_v01.webp",
    "ch05_future_echo_dart_master_v01.png":
        "public/assets/ch05/epilogues/ch05_future_echo_dart_v01.webp",
    "ch06_future_echo_fsw_master_v01.png":
        "public/assets/ch06/epilogues/ch06_future_echo_fsw_v01.webp",
}


def export(source_name: str, output_name: str) -> None:
    source = SOURCE_DIR / source_name
    output = ROOT / output_name
    output.parent.mkdir(parents=True, exist_ok=True)

    with Image.open(source) as image:
        image = ImageOps.fit(
            image.convert("RGB"),
            (1920, 1080),
            method=Image.Resampling.LANCZOS,
            centering=(0.5, 0.5),
        )
        image.save(output, "WEBP", quality=86, method=6)

    print(f"{source.relative_to(ROOT)} -> {output.relative_to(ROOT)}")


if __name__ == "__main__":
    for source_name, output_name in EXPORTS.items():
        export(source_name, output_name)
