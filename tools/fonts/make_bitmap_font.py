"""Converts Pixel Operator 8 (TTF) into a Phaser bitmap font.

Input:   tools/fonts/source/PixelOperator8.ttf
Outputs: public/assets/fonts/pixel_operator_8.png  glyph atlas, white on transparent (tintable)
         public/assets/fonts/pixel_operator_8.xml  AngelCode BMFont XML (accepted by Phaser's load.bitmapFont)

Glyphs are rendered at the font's native 8 px with antialiasing off, so every pixel is fully on or off.
Paths resolve relative to this file, so it runs from any working directory.
"""
import sys
from pathlib import Path
from xml.sax.saxutils import quoteattr

from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
TTF = HERE / "source" / "PixelOperator8.ttf"
OUT_DIR = HERE.parent.parent / "public" / "assets" / "fonts"
NAME = "pixel_operator_8"
SIZE = 8
PAD = 1          # transparent gap between glyphs in the atlas
ATLAS_W = 128
PROBE = 4        # margin around each glyph while rendering

CHARS = [chr(c) for c in range(32, 127)] + list("áéíóúÁÉÍÓÚñÑüÜ¿¡…")


def render(font, ch):
    """Returns a 1-bit-style 'L' image of ch (0 or 255) drawn at (PROBE, PROBE), top-left anchored."""
    img = Image.new("L", (SIZE * 3, SIZE * 3), 0)
    d = ImageDraw.Draw(img)
    d.fontmode = "1"  # no antialiasing
    d.text((PROBE, PROBE), ch, font=font, fill=255, anchor="la")
    return img


def main():
    if not TTF.exists():
        sys.exit(f"Missing {TTF}")
    font = ImageFont.truetype(str(TTF), SIZE)
    notdef = render(font, "￿").tobytes()

    glyphs, missing = [], []
    for ch in CHARS:
        img = render(font, ch)
        if ch != " " and img.tobytes() == notdef:
            missing.append(ch)
            continue
        box = img.getbbox()  # None for blank glyphs (space)
        adv = round(font.getlength(ch))
        glyphs.append({"ch": ch, "img": img, "box": box, "adv": adv})

    # Line box: top is the highest ink row (accents may rise above the ascent), bottom the lowest.
    inked = [g for g in glyphs if g["box"]]
    top = min(g["box"][1] for g in inked) - PROBE      # <= 0, relative to the text origin
    bottom = max(g["box"][3] for g in inked) - PROBE
    line_height = bottom - top
    base = font.getmetrics()[0] - top                   # ascent measured from the line top

    # Shelf-pack glyphs into the atlas.
    x = y = row_h = 0
    for g in glyphs:
        if not g["box"]:
            g.update(x=0, y=0, w=0, h=0, xo=0, yo=0)
            continue
        l, t, r, b = g["box"]
        w, h = r - l, b - t
        if x + w + PAD > ATLAS_W:
            x, y, row_h = 0, y + row_h + PAD, 0
        g.update(x=x, y=y, w=w, h=h, xo=l - PROBE, yo=t - PROBE - top)
        x += w + PAD
        row_h = max(row_h, h)
    atlas_h = 1
    while atlas_h < y + row_h + PAD:
        atlas_h *= 2

    atlas = Image.new("RGBA", (ATLAS_W, atlas_h), (0, 0, 0, 0))
    for g in glyphs:
        if g["w"]:
            mask = g["img"].crop(g["box"])
            atlas.paste(Image.new("RGBA", mask.size, (255, 255, 255, 255)), (g["x"], g["y"]), mask)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    atlas.save(OUT_DIR / f"{NAME}.png")

    lines = [
        '<?xml version="1.0"?>',
        "<font>",
        f'  <info face={quoteattr("Pixel Operator 8")} size="{SIZE}" bold="0" italic="0" smooth="0" aa="0"/>',
        f'  <common lineHeight="{line_height}" base="{base}" scaleW="{ATLAS_W}" scaleH="{atlas_h}" pages="1" packed="0"/>',
        "  <pages>",
        f'    <page id="0" file="{NAME}.png"/>',
        "  </pages>",
        f'  <chars count="{len(glyphs)}">',
    ]
    for g in glyphs:
        lines.append(
            f'    <char id="{ord(g["ch"])}" x="{g["x"]}" y="{g["y"]}" width="{g["w"]}" height="{g["h"]}" '
            f'xoffset="{g["xo"]}" yoffset="{g["yo"]}" xadvance="{g["adv"]}" page="0" chnl="15"/>'
        )
    lines += ["  </chars>", "</font>", ""]
    (OUT_DIR / f"{NAME}.xml").write_text("\n".join(lines), encoding="utf-8")

    print(f"Wrote {len(glyphs)} glyphs to {OUT_DIR} (atlas {ATLAS_W}x{atlas_h}, lineHeight {line_height}, base {base})")
    if missing:
        print("MISSING characters (not in the font):", " ".join(missing))
    else:
        print("All requested characters are present.")


if __name__ == "__main__":
    main()
