#!/usr/bin/env python3
"""Regenerate Expo / iOS / Android / web icon set from the brand master.

Usage:
  python3 -m venv .tmp-icon-venv && .tmp-icon-venv/bin/pip install pillow
  .tmp-icon-venv/bin/python scripts/generate-app-icons.py
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets" / "brand" / "app-icon-original.jpg"
OUT = ROOT / "assets"
BRAND = OUT / "brand"


def crop_baked_corners(im: Image.Image, scale: float = 1.085) -> Image.Image:
    w, h = im.size
    nw, nh = int(w * scale), int(h * scale)
    zoomed = im.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - w) // 2
    top = (nh - h) // 2
    return zoomed.crop((left, top, left + w, top + h))


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"Missing source icon: {SRC}")

    BRAND.mkdir(exist_ok=True)
    src = Image.open(SRC).convert("RGBA")
    if src.size != (1024, 1024):
        src = src.resize((1024, 1024), Image.Resampling.LANCZOS)

    src.save(BRAND / "app-icon-source.png", "PNG", optimize=True)
    full = crop_baked_corners(src)

    icon = Image.new("RGB", (1024, 1024), (5, 11, 21))
    icon.paste(full.convert("RGB"), (0, 0))
    icon.save(OUT / "icon.png", "PNG", optimize=True)
    icon.save(OUT / "android-icon.png", "PNG", optimize=True)
    icon.save(OUT / "splash-icon.png", "PNG", optimize=True)
    icon.save(BRAND / "app-icon-1024.png", "PNG", optimize=True)
    icon.resize((512, 512), Image.Resampling.LANCZOS).save(
        BRAND / "app-icon-512.png", "PNG", optimize=True
    )

    bg = Image.new("RGB", (1024, 1024), (5, 11, 21))
    draw = ImageDraw.Draw(bg)
    for i in range(512, 0, -1):
        t = i / 512
        r = int(5 + 18 * (1 - t))
        g = int(11 + 8 * (1 - t))
        b = int(21 + 55 * (1 - t))
        draw.ellipse([512 - i, 520 - i, 512 + i, 640 + i * 0.35], fill=(r, g, b))
    bg.save(OUT / "android-icon-background.png", "PNG", optimize=True)

    safe_scale = 0.72
    fg_content = full.resize(
        (int(1024 * safe_scale), int(1024 * safe_scale)), Image.Resampling.LANCZOS
    )
    ox = (1024 - fg_content.width) // 2
    oy = (1024 - fg_content.height) // 2
    fg = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    fg.paste(fg_content, (ox, oy), fg_content)
    fg.save(OUT / "android-icon-foreground.png", "PNG", optimize=True)

    gray = ImageEnhance.Contrast(ImageOps.grayscale(full.convert("RGB"))).enhance(1.8)
    mono = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    pixels = gray.load()
    out_px = mono.load()
    for y in range(1024):
        for x in range(1024):
            v = pixels[x, y]
            if v > 28:
                out_px[x, y] = (255, 255, 255, min(255, int((v - 28) * 1.35)))
    mono_scaled = mono.resize(
        (int(1024 * safe_scale), int(1024 * safe_scale)), Image.Resampling.LANCZOS
    )
    mono_canvas = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    mono_canvas.paste(mono_scaled, (ox, oy), mono_scaled)
    mono_canvas.save(OUT / "android-icon-monochrome.png", "PNG", optimize=True)

    for size, name in [(48, "favicon.png"), (32, "favicon-32.png"), (16, "favicon-16.png")]:
        icon.resize((size, size), Image.Resampling.LANCZOS).save(OUT / name, "PNG", optimize=True)

    print("Regenerated app icon set under assets/")


if __name__ == "__main__":
    main()
