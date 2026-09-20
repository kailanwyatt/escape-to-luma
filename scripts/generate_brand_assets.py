#!/usr/bin/env python3
"""Generate deterministic SPARK icon/splash assets with Pillow."""

from pathlib import Path
import math
import random
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
BRAND = ASSETS / "art" / "brand"
BRAND.mkdir(parents=True, exist_ok=True)


def background(size: int) -> Image.Image:
    image = Image.new("RGB", (size, size), "#050B15")
    draw = ImageDraw.Draw(image, "RGBA")
    for step in range(18, 0, -1):
        radius = size * (0.18 + step * 0.035)
        alpha = max(2, 25 - step)
        draw.ellipse(
            (size / 2 - radius, size / 2 - radius, size / 2 + radius, size / 2 + radius),
            fill=(0, 124, 190, alpha),
        )
    rng = random.Random(57)
    for _ in range(72):
        x, y = rng.randrange(size), rng.randrange(size)
        r = rng.choice((1, 1, 1, 2)) * size / 1024
        draw.ellipse((x - r, y - r, x + r, y + r), fill=(170, 235, 255, rng.randrange(35, 125)))
    return image.convert("RGBA")


def spark_mark(size: int, monochrome: bool = False) -> Image.Image:
    scale = size / 1024
    mark = Image.new("RGBA", (size, size))
    center = size / 2
    cyan = (255, 255, 255, 255) if monochrome else (82, 230, 255, 255)
    glow_color = (255, 255, 255, 180) if monochrome else (0, 204, 255, 200)

    glow = Image.new("RGBA", (size, size))
    glow_draw = ImageDraw.Draw(glow, "RGBA")
    glow_draw.ellipse(
        (center - 145 * scale, center - 145 * scale, center + 145 * scale, center + 145 * scale),
        fill=glow_color,
    )
    glow = glow.filter(ImageFilter.GaussianBlur(70 * scale))
    mark.alpha_composite(glow)

    for index, angle in enumerate((-24, 36, 96)):
        orbit = Image.new("RGBA", (size, size))
        orbit_draw = ImageDraw.Draw(orbit, "RGBA")
        box = (
            center - 235 * scale,
            center - (105 + index * 7) * scale,
            center + 235 * scale,
            center + (105 + index * 7) * scale,
        )
        orbit_draw.ellipse(box, outline=cyan, width=max(2, round(10 * scale)))
        orbit = orbit.rotate(angle, resample=Image.Resampling.BICUBIC, center=(center, center))
        mark.alpha_composite(orbit)

    draw = ImageDraw.Draw(mark, "RGBA")
    draw.ellipse(
        (center - 105 * scale, center - 105 * scale, center + 105 * scale, center + 105 * scale),
        fill=(0, 174, 236, 210) if not monochrome else (255, 255, 255, 210),
        outline=cyan,
        width=max(3, round(12 * scale)),
    )
    for radius, alpha in ((75, 110), (52, 175), (27, 255)):
        fill = (220, 253, 255, alpha) if not monochrome else (255, 255, 255, alpha)
        draw.ellipse(
            (
                center - radius * scale,
                center - radius * scale,
                center + radius * scale,
                center + radius * scale,
            ),
            fill=fill,
        )
    return mark


def compose_icon(size: int) -> Image.Image:
    image = background(size)
    mark = spark_mark(size)
    image.alpha_composite(mark)
    draw = ImageDraw.Draw(image, "RGBA")
    ring = size * 0.38
    draw.ellipse(
        (size / 2 - ring, size / 2 - ring, size / 2 + ring, size / 2 + ring),
        outline=(0, 204, 255, 58),
        width=max(2, round(size * 0.004)),
    )
    return image


def save(image: Image.Image, path: Path, size: int) -> None:
    resized = image.resize((size, size), Image.Resampling.LANCZOS)
    resized.save(path, optimize=True)


def main() -> None:
    master = compose_icon(2048)
    mark = spark_mark(2048)
    mono = spark_mark(2048, monochrome=True)
    save(master, ASSETS / "icon.png", 1024)
    save(mark, ASSETS / "splash-icon.png", 1024)
    save(mark, ASSETS / "android-icon-foreground.png", 432)
    save(background(864), ASSETS / "android-icon-background.png", 432)
    save(mono, ASSETS / "android-icon-monochrome.png", 432)
    save(master, ASSETS / "favicon.png", 64)
    save(mark, BRAND / "spark-mark.png", 1024)


if __name__ == "__main__":
    main()
