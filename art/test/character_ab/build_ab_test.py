"""Build the Galileo facial-layer Art Proof from locked-pose alpha sources."""

from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parent
LAYER_DIR = ROOT / "b_face_layers"
FACE_BOX = (430, 300, 810, 680)  # left, top, right, bottom on a 1254 px canvas
FACE_ANCHOR = FACE_BOX[:2]


def soft_ellipse(size: tuple[int, int], feather: int = 22) -> Image.Image:
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    inset = feather * 2
    draw.ellipse((inset, inset, size[0] - inset, size[1] - inset), fill=255)
    return mask.filter(ImageFilter.GaussianBlur(feather))


def checker(size: tuple[int, int], cell: int = 32) -> Image.Image:
    canvas = Image.new("RGB", size, "#d7d1c6")
    draw = ImageDraw.Draw(canvas)
    for y in range(0, size[1], cell):
        for x in range(0, size[0], cell):
            if (x // cell + y // cell) % 2:
                draw.rectangle((x, y, x + cell - 1, y + cell - 1), fill="#bdb6aa")
    return canvas


def make_layer(source: Image.Image, name: str) -> Image.Image:
    crop = source.crop(FACE_BOX).convert("RGBA")
    feather = soft_ellipse(crop.size)
    crop.putalpha(ImageChops.multiply(crop.getchannel("A"), feather))
    crop.save(LAYER_DIR / f"galileo_face_{name}_layer.png", optimize=True)
    return crop


def main() -> None:
    base = Image.open(LAYER_DIR / "galileo_locked_neutral_alpha.png").convert("RGBA")
    curious = Image.open(LAYER_DIR / "galileo_locked_curious_alpha.png").convert("RGBA")
    dry = Image.open(LAYER_DIR / "galileo_locked_dry_smile_alpha.png").convert("RGBA")

    curious_layer = make_layer(curious, "curious")
    dry_layer = make_layer(dry, "dry_smile")

    previews = [base]
    for name, layer in (("curious", curious_layer), ("dry_smile", dry_layer)):
        composite = base.copy()
        composite.alpha_composite(layer, FACE_ANCHOR)
        composite.save(LAYER_DIR / f"galileo_b_preview_{name}.png", optimize=True)
        previews.append(composite)

    thumb_size = (512, 512)
    strip = checker((thumb_size[0] * len(previews), thumb_size[1]))
    for index, preview in enumerate(previews):
        thumb = preview.resize(thumb_size, Image.Resampling.LANCZOS)
        strip.paste(thumb, (index * thumb_size[0], 0), thumb)
    strip.save(ROOT / "galileo_b_layer_preview_strip.png", optimize=True)


if __name__ == "__main__":
    main()
