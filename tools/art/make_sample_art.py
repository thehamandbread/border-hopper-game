"""Border Hopper sample art generator.
Outputs:
  mateo_walk.png    64x128 sprite sheet, 16x32 frames. Rows: down, up, right, left. 4 frames each.
  border_tiles.png  16x16 tiles in a row (see TILE_ORDER).
  preview_scene.png small scene at 4x scale.
  preview_walk.gif  walk cycles at 6x scale.
"""
import random
from PIL import Image, ImageDraw

OUT = (24, 18, 20, 255)
PAL = {
    "H": (40, 30, 28), "h": (78, 60, 50),
    "S": (176, 118, 82), "s": (138, 88, 60),
    "E": (28, 20, 18),
    "T": (84, 98, 72), "t": (60, 72, 54),
    "J": (62, 78, 112), "j": (44, 56, 82),
    "B": (214, 208, 196), "b": (150, 144, 136),
}

HEAD_DOWN = [
    ".....HHHHHH.....",
    "....HHhhHHHH....",
    "...HHHHHHHHHH...",
    "...HHSSSSSSHH...",
    "...HSSSSSSSSH...",
    "...HSSESSESSH...",
    "....SSSSSSSS....",
    ".....sSSSSs.....",
    "......ssss......",
]
HEAD_UP = [
    ".....HHHHHH.....",
    "....HHHHhhHH....",
    "...HHHHHHHHHH...",
    "...HHHHHHHHHH...",
    "...HHHHHhHHHH...",
    "...HHHHHHHHHH...",
    "....HHHHHHHH....",
    ".....sSSSSs.....",
    "......ssss......",
]
TORSO_FRONT = [
    "....TTTTTTTT....",
    "..TTTTTTTTTTTT..",
    "..TtTTTTTTTTtT..",
    "..TtTTTTTTTTtT..",
    "..TtTTTTTTTTtT..",
    "..SttttttttttS..",
    "....JJJJJJJJ....",
]
TORSO_BACK = [
    "....tTTTTTTt....",
    "..TTtttttttTTT..",
    "..TtTTTTTTTTtT..",
    "..TtTTTTTTTTtT..",
    "..TtTTTTTTTTtT..",
    "..SttttttttttS..",
    "....JJJJJJJJ....",
]
HEAD_SIDE = [
    ".....HHHHH......",
    "....HHHhhHH.....",
    "....HHHHHHHH....",
    "....HHHHSSSS....",
    "....HHHSSSSSS...",
    "....HHHSSSESS...",
    ".....HSSSSSS....",
    "......sSSSs.....",
    ".......sss......",
]
TORSO_SIDE = [
    ".....TTTTTT.....",
    ".....TTTTTTT....",
    ".....TtTTTTT....",
    ".....TtTTTTT....",
    ".....TtTTTTT....",
    ".....tStttttt...",
    "......JJJJJ.....",
]

FW, FH = 16, 32
TOP = 6  # first row of the head inside the frame


def blit_rows(px, rows, y0):
    for dy, row in enumerate(rows):
        for x, c in enumerate(row):
            if c != ".":
                px[x, y0 + dy] = PAL[c] + (255,)


def rect(px, x0, y0, w, h, c):
    for y in range(y0, y0 + h):
        for x in range(x0, x0 + w):
            px[x, y] = PAL[c] + (255,)


def outline(img):
    """Add a 1px dark outline around all filled pixels (4-neighbour)."""
    src = img.copy().load()
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            if src[x, y][3] == 0:
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h and src[nx, ny][3] > 0:
                        px[x, y] = OUT
                        break


def front_legs(px, y0, lift_left, lift_right, back=False):
    # two legs, cols 4-6 and 9-11; a lifted leg is 1px shorter
    for x0, lift in ((4, lift_left), (9, lift_right)):
        leg_h = 5 - lift
        rect(px, x0, y0, 3, leg_h, "J")
        rect(px, x0 + (2 if x0 == 4 else 0), y0, 1, leg_h, "j")
        rect(px, x0, y0 + leg_h, 3, 2, "b" if back else "B")


def make_frame(direction, step):
    img = Image.new("RGBA", (FW, FH), (0, 0, 0, 0))
    px = img.load()
    bob = 1 if step in (1, 3) else 0
    y = TOP + bob
    if direction in ("down", "up"):
        blit_rows(px, HEAD_DOWN if direction == "down" else HEAD_UP, y)
        blit_rows(px, TORSO_FRONT if direction == "down" else TORSO_BACK, y + 9)
        ll = 1 if step == 1 else 0
        lr = 1 if step == 3 else 0
        front_legs(px, y + 16, ll, lr, back=(direction == "up"))
    else:  # right
        blit_rows(px, HEAD_SIDE, y)
        blit_rows(px, TORSO_SIDE, y + 9)
        ly = y + 16
        if step in (0, 2):
            rect(px, 7, ly, 3, 5, "J")
            rect(px, 9, ly, 1, 5, "j")
            rect(px, 7, ly + 5, 4, 2, "B")
        else:
            near, far = ("J", "j") if step == 1 else ("j", "J")
            # back leg
            rect(px, 5, ly, 3, 4, far)
            rect(px, 4, ly + 4, 4, 2, "b")
            # front leg
            rect(px, 9, ly, 3, 4, near)
            rect(px, 9, ly + 4, 4, 2, "B")
    outline(img)
    return img


def make_sheet():
    sheet = Image.new("RGBA", (FW * 4, FH * 4), (0, 0, 0, 0))
    frames = {}
    for r, d in enumerate(("down", "up", "right")):
        for f in range(4):
            fr = make_frame(d, f)
            frames[(d, f)] = fr
            sheet.paste(fr, (f * FW, r * FH))
    for f in range(4):
        fr = frames[("right", f)].transpose(Image.FLIP_LEFT_RIGHT)
        frames[("left", f)] = fr
        sheet.paste(fr, (f * FW, 3 * FH))
    return sheet, frames


# ---------------- tiles ----------------
T = 16
rng = random.Random(7)


def noise_tile(base, dots, density=0.12):
    img = Image.new("RGBA", (T, T), base + (255,))
    px = img.load()
    for y in range(T):
        for x in range(T):
            if rng.random() < density:
                px[x, y] = rng.choice(dots) + (255,)
    return img


def tile_sand():
    return noise_tile((200, 168, 118), [(186, 152, 104), (212, 182, 132)])


def tile_sand_pebbles():
    img = tile_sand()
    d = img.load()
    for _ in range(4):
        x, y = rng.randrange(1, 14), rng.randrange(1, 14)
        d[x, y] = (128, 110, 88, 255)
        d[x + 1, y] = (150, 132, 108, 255)
        d[x, y + 1] = (104, 88, 70, 255)
    return img


def tile_scrub():
    img = tile_sand()
    d = img.load()
    greens = [(104, 112, 64), (86, 94, 52), (126, 132, 78)]
    cx, cy = 8, 9
    for y in range(T):
        for x in range(T):
            r = ((x - cx) ** 2) / 20 + ((y - cy) ** 2) / 10
            if r < 1 and rng.random() < 0.8:
                d[x, y] = rng.choice(greens) + (255,)
    for x in range(4, 13):
        d[x, 12] = (160, 130, 92, 255)  # shadow line under bush
    return img


def tile_dirt():
    return noise_tile((158, 122, 86), [(140, 106, 74), (172, 136, 98)], 0.18)


def tile_asphalt(line=False):
    img = noise_tile((70, 70, 74), [(60, 60, 64), (82, 82, 86)], 0.2)
    if line:
        d = img.load()
        for y in range(2, 12):
            for x in (7, 8):
                d[x, y] = (212, 176, 62, 255)
    return img


def tile_fence():
    # steel bollard fence seen from the 3/4 top-down angle, over sand
    img = tile_sand()
    d = img.load()
    rust = (122, 70, 44)
    rust_hi = (158, 96, 60)
    rust_dk = (84, 48, 32)
    for x0 in (1, 6, 11):
        for y in range(0, 14):
            d[x0, y] = rust_hi + (255,)
            d[x0 + 1, y] = rust + (255,)
            d[x0 + 2, y] = rust_dk + (255,)
        d[x0, 0] = (180, 120, 80, 255)
    for x in range(T):  # base shadow
        for y in (14, 15):
            d[x, y] = (150, 118, 80, 255)
    return img


def tile_wall():
    img = Image.new("RGBA", (T, T), (170, 164, 150, 255))
    d = img.load()
    mortar = (128, 122, 110, 255)
    for y in (0, 5, 10, 15):
        for x in range(T):
            d[x, y] = mortar
    for row, y0 in enumerate((0, 5, 10)):
        off = 0 if row % 2 == 0 else 4
        for x in range(off, T, 8):
            for y in range(y0, min(y0 + 5, T)):
                d[x, y] = mortar
    for _ in range(12):
        d[rng.randrange(T), rng.randrange(T)] = (184, 178, 164, 255)
    return img


def tile_crate():
    img = tile_dirt()
    d = img.load()
    wood, wood_dk, wood_hi = (150, 104, 60), (106, 72, 40), (178, 130, 80)
    for y in range(1, 15):
        for x in range(1, 15):
            d[x, y] = wood + (255,)
    for i in range(1, 15):
        d[i, 1] = wood_hi + (255,)
        d[i, 14] = wood_dk + (255,)
        d[1, i] = wood_hi + (255,)
        d[14, i] = wood_dk + (255,)
        d[i, i] = wood_dk + (255,)  # diagonal brace
        d[i, 15 - i] = wood_dk + (255,)
    for i in range(0, 16):
        for j in (0, 15):
            d[i, j] = OUT
            d[j, i] = OUT
    return img


TILE_ORDER = ["sand", "sand_pebbles", "scrub", "dirt", "asphalt",
              "asphalt_line", "fence", "wall", "crate"]


def make_tiles():
    tiles = {
        "sand": tile_sand(), "sand_pebbles": tile_sand_pebbles(),
        "scrub": tile_scrub(), "dirt": tile_dirt(),
        "asphalt": tile_asphalt(), "asphalt_line": tile_asphalt(True),
        "fence": tile_fence(), "wall": tile_wall(), "crate": tile_crate(),
    }
    sheet = Image.new("RGBA", (T * len(TILE_ORDER), T))
    for i, k in enumerate(TILE_ORDER):
        sheet.paste(tiles[k], (i * T, 0))
    return sheet, tiles


def make_scene(tiles, frames):
    cols, rows = 14, 9
    # map legend: s sand, p pebbles, b scrub, d dirt, a asphalt, l line, f fence, w wall, c crate
    layout = [
        "ssbsspsssbssps",
        "ffffffffffffff",
        "ssspssdddsssbs",
        "sbsssdddssspss",
        "aaaaaaaaaaaaaa",
        "llllllllllllll",
        "aaaaaaaaaaaaaa",
        "wwwwwssddsswww",
        "pscsssddsbcssp",
    ]
    key = {"s": "sand", "p": "sand_pebbles", "b": "scrub", "d": "dirt", "a": "asphalt",
           "l": "asphalt_line", "f": "fence", "w": "wall", "c": "crate"}
    img = Image.new("RGBA", (cols * T, rows * T))
    for y, row in enumerate(layout):
        for x, ch in enumerate(row):
            t = tiles[key[ch]]
            if ch == "l":
                # only dash every other tile
                t = tiles["asphalt_line"] if x % 2 == 0 else tiles["asphalt"]
            img.paste(t, (x * T, y * T))
    # Mateo with a soft shadow
    shadow = Image.new("RGBA", (12, 4), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).ellipse((0, 0, 11, 3), fill=(0, 0, 0, 70))
    mx, my = 6 * T, 2 * T - 2
    img.alpha_composite(shadow, (mx + 2, my + 28))
    img.alpha_composite(frames[("down", 0)], (mx, my))
    return img


def main():
    sheet, frames = make_sheet()
    sheet.save("mateo_walk.png")
    tiles_sheet, tiles = make_tiles()
    tiles_sheet.save("border_tiles.png")

    scene = make_scene(tiles, frames)
    scene.resize((scene.width * 4, scene.height * 4), Image.NEAREST).save("preview_scene.png")

    # walk gif: 4 directions side by side on sand, 6x
    S = 6
    bg_tile = tiles["sand"]
    gif_frames = []
    for f in range(4):
        canvas = Image.new("RGBA", (FW * 4 + 24, FH + 4))
        for x in range(0, canvas.width, T):
            for y in range(0, canvas.height, T):
                canvas.paste(bg_tile, (x, y))
        for i, d in enumerate(("down", "left", "up", "right")):
            canvas.alpha_composite(frames[(d, f)], (4 + i * (FW + 6), 2))
        gif_frames.append(canvas.resize((canvas.width * S, canvas.height * S), Image.NEAREST).convert("RGB"))
    gif_frames[0].save("preview_walk.gif", save_all=True, append_images=gif_frames[1:],
                       duration=160, loop=0)

    # also a 6x preview of the sprite sheet and tiles for inspection
    sheet.resize((sheet.width * 6, sheet.height * 6), Image.NEAREST).save("sheet_6x.png")
    tiles_sheet.resize((tiles_sheet.width * 6, tiles_sheet.height * 6), Image.NEAREST).save("tiles_6x.png")


if __name__ == "__main__":
    main()
