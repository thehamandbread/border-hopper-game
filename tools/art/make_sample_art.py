"""Border Hopper sample art generator.
Outputs:
  public/assets/images/mateo_walk.png    64x128 sprite sheet, 16x32 frames. Rows: down, up, right, left. 4 frames each.
  public/assets/images/border_tiles.png  160x16, 16x16 tiles in a row (see TILE_ORDER).
  public/assets/images/restaurant_tiles.png  384x16, restaurant interior tiles (see RESTAURANT_ORDER).
  public/assets/images/kitchen_door.png  96x16, 3 frames of 32x16 swinging cafe doors (closed, half, open).
  public/assets/images/task_marker.png   32x16, 2 frames of 16x16 red '!' marker (bright, dim).
  public/assets/images/fire.png          48x16, 3-frame looping flame.
  public/assets/images/smoke.png         32x16, 2-frame looping smoke puff.
  tools/art/previews/preview_scene.png   small scene at 4x scale.
  tools/art/previews/preview_walk.gif    walk cycles at 6x scale.
  tools/art/previews/sheet_6x.png, tiles_6x.png  6x inspection previews.
  tools/art/previews/restaurant_tiles_6x.png, fire_6x.png, smoke_6x.png, restaurant_scene.png,
  tools/art/previews/kitchen_door_6x.png, task_marker_6x.png, restaurant_walls_preview.png
Paths are resolved relative to this file, so it runs from any working directory.
"""
import random
from pathlib import Path
from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
ASSET_DIR = HERE.parent.parent / "public" / "assets" / "images"
PREVIEW_DIR = HERE / "previews"

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


def tile_asphalt(line=None):
    """line: None, "h" (horizontal centered dash) or "v" (vertical centered dash)."""
    img = noise_tile((70, 70, 74), [(60, 60, 64), (82, 82, 86)], 0.2)
    if line:
        d = img.load()
        for a in range(3, 13):
            for b in (7, 8):
                x, y = (a, b) if line == "h" else (b, a)
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
              "asphalt_line", "fence", "wall", "crate", "asphalt_line_v"]


def make_tiles():
    tiles = {
        "sand": tile_sand(), "sand_pebbles": tile_sand_pebbles(),
        "scrub": tile_scrub(), "dirt": tile_dirt(),
        "asphalt": tile_asphalt(), "asphalt_line": tile_asphalt("h"),
        "fence": tile_fence(), "wall": tile_wall(), "crate": tile_crate(),
        "asphalt_line_v": tile_asphalt("v"),
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


# ---------------- restaurant tiles ----------------
rrng = random.Random(21)  # separate stream so border tiles never change


def solid(c):
    return Image.new("RGBA", (T, T), c + (255,))


def fill(px, x0, y0, x1, y1, c):
    """Fill the inclusive rectangle; c is an RGB or RGBA tuple."""
    c = c if len(c) == 4 else c + (255,)
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            px[x, y] = c


def dots(px, pts, c):
    for x, y in pts:
        px[x, y] = c + (255,)


def prop_on(floor, draw_fn):
    """Draw a prop on a transparent layer, auto-outline it, then put it on a copy of floor."""
    layer = Image.new("RGBA", (T, T), (0, 0, 0, 0))
    draw_fn(layer.load())
    outline(layer)
    out = floor.copy()
    out.alpha_composite(layer)
    return out


# palette for the taqueria
CREAM, CREAM_DK, CREAM_HI = (224, 208, 174), (200, 182, 148), (236, 224, 194)
BASE, BASE_DK, BASE_HI = (122, 82, 62), (92, 60, 46), (150, 106, 80)
WOOD, WOOD_DK, WOOD_HI = (150, 104, 60), (106, 72, 40), (178, 130, 80)
STEEL, STEEL_DK, STEEL_HI = (150, 156, 162), (104, 110, 118), (192, 198, 204)
GLASS, GLASS_HI = (150, 190, 204), (206, 230, 236)


def tile_kitchen_floor():
    img = solid((140, 158, 162))
    d = img.load()
    for y in range(T):
        for x in range(T):
            if ((x // 4) + (y // 4)) % 2:
                d[x, y] = (116, 136, 144, 255)
    for _ in range(6):
        d[rrng.randrange(T), rrng.randrange(T)] = (154, 172, 176, 255)
    return img


def tile_dining_floor():
    img = solid((178, 102, 74))
    d = img.load()
    grout = (136, 76, 58, 255)
    for i in range(T):
        d[i, 0] = grout
        d[i, 8] = grout
        d[0, i] = grout if i < 8 else d[0, i]
        d[8, i] = grout if i >= 8 else d[8, i]
    for _ in range(9):
        x, y = rrng.randrange(T), rrng.randrange(T)
        if d[x, y] != grout:
            d[x, y] = rrng.choice([(190, 114, 84), (166, 92, 66)]) + (255,)
    return img


def tile_rest_wall(window=False):
    img = solid(CREAM)
    d = img.load()
    fill(d, 0, 10, 15, 11, CREAM_DK)          # plaster shading above baseboard
    fill(d, 0, 0, 15, 0, CREAM_HI)            # top edge highlight
    fill(d, 0, 12, 15, 12, BASE_HI)           # baseboard top
    fill(d, 0, 13, 15, 14, BASE)
    fill(d, 0, 15, 15, 15, BASE_DK)
    for _ in range(10):
        x, y = rrng.randrange(T), rrng.randrange(10)
        d[x, y] = rrng.choice([CREAM_DK, CREAM_HI]) + (255,)
    if window:
        fill(d, 3, 1, 12, 9, OUT)             # window frame outline
        fill(d, 4, 2, 11, 8, (170, 128, 84))  # wooden frame
        fill(d, 5, 3, 10, 7, GLASS)
        fill(d, 7, 3, 8, 7, (150, 190, 204))
        fill(d, 5, 5, 10, 5, (170, 128, 84))  # mullions
        fill(d, 7, 3, 8, 3, (170, 128, 84))
        fill(d, 7, 3, 7, 7, (170, 128, 84))
        fill(d, 8, 3, 8, 7, (170, 128, 84))
        fill(d, 5, 3, 6, 4, GLASS_HI)         # glare
        d[9, 6] = GLASS_HI + (255,)
        fill(d, 3, 10, 12, 10, WOOD_DK)       # sill
        fill(d, 3, 9, 12, 9, WOOD_HI)
    return img


def tile_counter():
    img = solid(WOOD)
    d = img.load()
    fill(d, 0, 0, 15, 0, OUT)
    fill(d, 0, 1, 15, 8, (196, 150, 98))      # worktop
    fill(d, 0, 1, 15, 1, (218, 174, 120))     # front lip highlight
    fill(d, 0, 8, 15, 8, WOOD_DK)
    fill(d, 0, 9, 15, 15, WOOD)               # front face
    fill(d, 1, 11, 6, 14, WOOD_DK)            # cabinet panels
    fill(d, 2, 12, 5, 13, (128, 88, 50))
    fill(d, 9, 11, 14, 14, WOOD_DK)
    fill(d, 10, 12, 13, 13, (128, 88, 50))
    fill(d, 0, 15, 15, 15, OUT)
    dots(d, [(4, 3), (5, 3), (11, 5), (12, 5), (13, 5)], (176, 130, 82))
    return img


def draw_table(px, dirty):
    fill(px, 2, 3, 13, 10, (204, 164, 112))   # top
    fill(px, 2, 3, 13, 3, (226, 190, 140))    # top edge highlight
    fill(px, 2, 11, 13, 12, WOOD_DK)          # apron
    fill(px, 2, 11, 13, 11, (128, 88, 50))
    fill(px, 2, 13, 3, 14, WOOD_DK)           # legs
    fill(px, 12, 13, 13, 14, WOOD_DK)
    if dirty:
        fill(px, 4, 5, 7, 8, (222, 216, 204))  # plate
        fill(px, 5, 6, 6, 7, (170, 164, 154))
        dots(px, [(5, 6)], (196, 60, 44))      # leftover sauce on plate
        dots(px, [(6, 7)], (120, 156, 70))
        spill = [(9, 6), (10, 6), (11, 6), (9, 7), (10, 7), (11, 7), (12, 7), (10, 8), (11, 8)]
        for x, y in spill:                     # red salsa spill
            px[x, y] = (176, 48, 36, 255)
        dots(px, [(10, 7)], (214, 92, 60))
        dots(px, [(8, 4), (12, 4), (3, 9), (8, 9), (9, 10), (13, 9)], (96, 66, 40))  # crumbs
    else:
        fill(px, 3, 4, 12, 4, (238, 208, 160))  # polished sheen
        fill(px, 5, 6, 8, 6, (222, 186, 134))
        fill(px, 6, 8, 7, 9, (236, 232, 222))   # napkin holder
        fill(px, 6, 8, 7, 8, (250, 248, 240))
        fill(px, 10, 8, 10, 9, (196, 196, 200))  # salt shaker
        px[10, 8] = (236, 236, 240, 255)


def draw_chair(px):
    fill(px, 4, 1, 11, 6, WOOD_DK)            # backrest
    fill(px, 5, 2, 6, 5, WOOD)                # slats
    fill(px, 9, 2, 10, 5, WOOD)
    fill(px, 7, 2, 8, 5, (128, 88, 50))
    fill(px, 4, 1, 11, 1, WOOD_HI)
    fill(px, 3, 7, 12, 10, WOOD_HI)           # seat
    fill(px, 3, 10, 12, 11, WOOD_DK)          # seat front
    fill(px, 4, 12, 5, 14, WOOD_DK)           # legs
    fill(px, 10, 12, 11, 14, WOOD_DK)


def draw_stove(px, on):
    fill(px, 1, 1, 14, 14, STEEL)
    fill(px, 1, 1, 14, 9, (88, 90, 98))       # cooktop
    fill(px, 1, 1, 14, 1, STEEL_HI)
    fill(px, 1, 10, 14, 14, STEEL)            # front
    fill(px, 1, 10, 14, 10, STEEL_DK)
    fill(px, 3, 12, 12, 13, (58, 62, 70))     # oven window
    fill(px, 3, 11, 12, 11, STEEL_HI)         # handle
    dots(px, [(3, 10), (6, 10), (9, 10), (12, 10)], (40, 40, 44))  # knobs
    for cx in (4, 11):
        for cy in (3, 7):
            if on:
                fill(px, cx - 1, cy - 1, cx + 1, cy + 1, (236, 132, 40))
                px[cx, cy] = (130, 190, 250, 255)
                dots(px, [(cx - 2, cy), (cx + 2, cy), (cx, cy - 2 if cy > 3 else cy - 1)], (170, 96, 52))
            else:
                fill(px, cx - 1, cy - 1, cx + 1, cy + 1, (34, 34, 38))
                px[cx, cy] = (18, 16, 18, 255)
    if on:
        dots(px, [(3, 10), (6, 10)], (236, 132, 40))


def draw_trash(px, full):
    fill(px, 4, 6, 11, 14, (118, 128, 120))    # can body
    fill(px, 4, 6, 5, 14, (146, 158, 148))     # left highlight
    fill(px, 10, 6, 11, 14, (86, 96, 90))      # right shade
    for x in (7, 8):
        fill(px, x, 8, x, 13, (90, 100, 94))   # ribs
    fill(px, 3, 5, 12, 6, STEEL_HI)            # rim
    if full:
        fill(px, 3, 2, 12, 5, (46, 56, 50))    # bloated bag
        fill(px, 4, 1, 10, 2, (46, 56, 50))
        fill(px, 5, 1, 7, 2, (86, 100, 90))    # plastic sheen
        fill(px, 2, 4, 3, 7, (46, 56, 50))     # bag sagging over the rim
        fill(px, 12, 4, 13, 7, (46, 56, 50))
        dots(px, [(9, 0), (10, 0)], (238, 230, 210))  # paper sticking out
        dots(px, [(6, 0)], (222, 132, 40))            # orange peel
        dots(px, [(13, 2), (12, 3)], (196, 190, 176))
    else:
        fill(px, 4, 5, 11, 5, (22, 22, 26))    # open, dark, empty mouth
        fill(px, 5, 6, 10, 6, (36, 38, 42))


def draw_sink(px):
    fill(px, 1, 3, 14, 14, STEEL)
    fill(px, 1, 3, 14, 9, STEEL_HI)            # steel top
    fill(px, 3, 4, 12, 8, (108, 122, 134))     # basin
    fill(px, 3, 4, 12, 4, (84, 96, 108))
    fill(px, 4, 6, 6, 7, (134, 158, 176))      # water sheen
    px[8, 7] = (40, 44, 50, 255)               # drain
    fill(px, 7, 1, 8, 3, STEEL_DK)             # faucet
    fill(px, 7, 1, 10, 1, STEEL_DK)
    px[10, 2] = (180, 190, 196, 255)
    dots(px, [(3, 2), (12, 2)], (60, 110, 190))  # taps
    fill(px, 1, 10, 14, 10, STEEL_DK)
    fill(px, 2, 11, 13, 14, STEEL)             # cabinet doors
    fill(px, 7, 11, 8, 14, STEEL_DK)
    dots(px, [(6, 12), (9, 12)], (60, 64, 70))


def wall_door(draw_fn):
    def make():
        layer = Image.new("RGBA", (T, T), (0, 0, 0, 0))
        draw_fn(layer.load())
        outline(layer)
        img = tile_rest_wall()
        img.alpha_composite(layer)
        return img
    return make()


def draw_front_door(px):
    fill(px, 2, 1, 13, 15, (112, 120, 130))    # metal frame
    fill(px, 3, 2, 12, 11, GLASS)
    fill(px, 3, 2, 4, 5, GLASS_HI)             # glare
    fill(px, 6, 2, 6, 3, GLASS_HI)
    fill(px, 3, 7, 12, 7, (170, 210, 222))
    fill(px, 3, 12, 12, 15, STEEL_DK)          # kick plate
    fill(px, 3, 12, 12, 12, STEEL_HI)
    fill(px, 10, 6, 11, 8, STEEL_HI)           # push bar handle
    fill(px, 8, 13, 9, 13, (94, 100, 108))
    fill(px, 7, 2, 8, 11, (112, 120, 130))     # centre mullion


def draw_back_door(px):
    fill(px, 2, 1, 13, 15, (124, 134, 128))    # plain painted metal
    fill(px, 2, 1, 13, 1, (150, 160, 154))
    fill(px, 2, 1, 2, 15, (150, 160, 154))
    fill(px, 13, 1, 13, 15, (92, 100, 96))
    fill(px, 4, 3, 11, 6, (108, 118, 112))     # recessed panels
    fill(px, 4, 9, 11, 13, (108, 118, 112))
    fill(px, 4, 3, 11, 3, (92, 100, 96))
    fill(px, 4, 9, 11, 9, (92, 100, 96))
    fill(px, 10, 7, 11, 8, (200, 196, 180))    # lever handle
    px[10, 8] = (76, 76, 72, 255)
    dots(px, [(3, 4), (3, 11)], (78, 84, 80))  # hinges


def draw_back_room_door(px):
    fill(px, 2, 1, 13, 15, (112, 76, 52))      # heavy planks
    for x in (5, 8, 11):
        fill(px, x, 1, x, 15, (80, 54, 38))
    fill(px, 2, 1, 13, 1, (136, 96, 66))
    fill(px, 2, 4, 13, 5, (86, 90, 98))        # iron straps
    fill(px, 2, 12, 13, 13, (86, 90, 98))
    fill(px, 2, 4, 13, 4, (122, 128, 138))
    fill(px, 2, 12, 13, 12, (122, 128, 138))
    dots(px, [(3, 5), (12, 5), (3, 13), (12, 13)], (176, 182, 190))  # rivets
    fill(px, 7, 8, 10, 11, (222, 180, 60))     # brass padlock body
    fill(px, 7, 8, 10, 8, (248, 216, 108))
    fill(px, 8, 6, 9, 7, (178, 184, 192))      # shackle
    dots(px, [(8, 6), (9, 6)], (178, 184, 192))
    px[8, 9] = (44, 30, 20, 255)               # keyhole
    px[8, 10] = (44, 30, 20, 255)


RESTAURANT_ORDER = ["kitchen_floor", "dining_floor", "wall", "wall_window", "counter",
                    "table_dirty", "table_clean", "chair", "stove_off", "stove_on",
                    "trash_full", "trash_empty", "sink", "front_door", "back_door",
                    "back_room_door",
                    "wall_side_left", "wall_side_right",
                    "wall_corner_top_left", "wall_corner_top_right",
                    "wall_corner_bottom_left", "wall_corner_bottom_right",
                    "counter_end_left", "counter_end_right"]


def make_restaurant_tiles():
    kf, df = tile_kitchen_floor(), tile_dining_floor()
    tiles = {
        "kitchen_floor": kf, "dining_floor": df,
        "wall": tile_rest_wall(), "wall_window": tile_rest_wall(True),
        "counter": tile_counter(),
        "table_dirty": prop_on(df, lambda p: draw_table(p, True)),
        "table_clean": prop_on(df, lambda p: draw_table(p, False)),
        "chair": prop_on(df, draw_chair),
        "stove_off": prop_on(kf, lambda p: draw_stove(p, False)),
        "stove_on": prop_on(kf, lambda p: draw_stove(p, True)),
        "trash_full": prop_on(kf, lambda p: draw_trash(p, True)),
        "trash_empty": prop_on(kf, lambda p: draw_trash(p, False)),
        "sink": prop_on(kf, draw_sink),
        "front_door": wall_door(draw_front_door),
        "back_door": wall_door(draw_back_door),
        "back_room_door": wall_door(draw_back_room_door),
        # indexes 16-23 (added later; none of these use the random stream)
        "wall_side_left": tile_wall_side_left(),
        "wall_side_right": flip(tile_wall_side_left()),
        "wall_corner_top_left": tile_corner_top_left(),
        "wall_corner_top_right": flip(tile_corner_top_left()),
        "wall_corner_bottom_left": tile_corner_bottom_left(),
        "wall_corner_bottom_right": flip(tile_corner_bottom_left()),
        "counter_end_left": tile_counter_end_left(),
        "counter_end_right": flip(tile_counter_end_left()),
    }
    sheet = Image.new("RGBA", (T * len(RESTAURANT_ORDER), T))
    for i, k in enumerate(RESTAURANT_ORDER):
        sheet.paste(tiles[k], (i * T, 0))
    return sheet, tiles


# ---------------- restaurant polish: side walls, corners, counter ends ----------------
# These use no random numbers, so adding them never changes tiles 0-15.
CAP = CREAM_HI                      # wall top ("cap") colour, same as the wall face's top highlight
CAP_SHADE = [(224, 208, 174), (200, 182, 148), (186, 160, 128), (166, 140, 110), (148, 122, 96)]


def tile_wall_side_left():
    """Top edge of the left wall seen from above; room is on the right.
    Every row is identical, so stacked tiles join with no banding."""
    img = solid(CAP)
    d = img.load()
    fill(d, 0, 0, 0, 15, OUT)                 # outer edge
    for i, c in enumerate(CAP_SHADE):         # shadow on the room-facing side
        fill(d, 11 + i, 0, 11 + i, 15, c)
    return img


def tile_corner_top_left():
    """Left wall cap meeting the top wall's face: face plaster continues to the right."""
    img = tile_rest_wall_plain()
    strip = tile_wall_side_left()
    img.paste(strip.crop((0, 0, 12, T)), (0, 0))
    return img


def tile_corner_bottom_left():
    """Left wall cap ending on the bottom wall's face: cap above, face rows (shading + baseboard) below."""
    img = tile_rest_wall_plain()
    strip = tile_wall_side_left()
    img.paste(strip.crop((0, 0, T, 10)), (0, 0))
    fill(img.load(), 0, 10, 0, 15, OUT)       # keep the outer edge continuous
    return img


def tile_rest_wall_plain():
    """The plain wall face, drawn without touching the shared random stream."""
    img = solid(CREAM)
    d = img.load()
    fill(d, 0, 10, 15, 11, CREAM_DK)
    fill(d, 0, 0, 15, 0, CREAM_HI)
    fill(d, 0, 12, 15, 12, BASE_HI)
    fill(d, 0, 13, 15, 14, BASE)
    fill(d, 0, 15, 15, 15, BASE_DK)
    return img


def tile_counter_end_left():
    """Rounded end for the counter segment on the LEFT of the gap (its right end faces the gap)."""
    img = tile_kitchen_floor_plain()
    d = img.load()
    body = tile_counter().load()
    for y in range(T):
        for x in range(15):
            d[x, y] = body[x, y]
    for y in range(T):                          # end outline
        d[14, y] = OUT
    fill(d, 12, 1, 13, 7, (218, 174, 120))      # worktop end, lighter where it overhangs
    fill(d, 13, 8, 13, 8, WOOD_DK)
    fill(d, 12, 9, 13, 14, WOOD_DK)             # end panel
    fill(d, 13, 9, 13, 14, (128, 88, 50))
    for x, y in ((14, 0), (14, 15)):            # round the corners
        d[x, y] = d[15, y]
    d[13, 0] = OUT
    d[13, 15] = OUT
    return img


def tile_kitchen_floor_plain():
    """Kitchen checker without random speckles (corner pixels behind counter ends)."""
    img = solid((140, 158, 162))
    d = img.load()
    for y in range(T):
        for x in range(T):
            if ((x // 4) + (y // 4)) % 2:
                d[x, y] = (116, 136, 144, 255)
    return img


def flip(img):
    return img.transpose(Image.FLIP_LEFT_RIGHT)


# ---------------- cafe doors and task marker ----------------
STEEL_PIN = (176, 182, 190)


def draw_leaf(px, hinge_x, inner_x, dy_inner, tone=0):
    """One swing-door leaf from hinge_x to inner_x. dy_inner lowers the free edge (swing toward viewer).
    tone > 0 darkens it (leaf turned nearly edge-on)."""
    step = 1 if inner_x > hinge_x else -1
    span = max(1, abs(inner_x - hinge_x))
    for i, x in enumerate(range(hinge_x, inner_x + step, step)):
        off = round(dy_inner * i / span)
        top, bot = 3 + off, 11 + off + off // 2   # free edge is nearer the viewer: lower and taller
        slat = WOOD_HI if (i % 2 == 0) else WOOD
        if tone:
            slat = WOOD_DK if i % 2 == 0 else (128, 88, 50)
        for y in range(top, bot + 1):
            px[x, y] = slat + (255,)
        px[x, top] = (WOOD_HI if not tone else WOOD) + (255,)      # top rail
        px[x, top + 1] = WOOD_DK + (255,)
        px[x, bot] = WOOD_DK + (255,)                              # bottom rail
        px[x, bot - 1] = (WOOD_DK if i % 2 else (128, 88, 50)) + (255,)
    # darker free edge so the two leaves read as separate doors
    for y in range(3 + dy_inner, 12 + dy_inner + dy_inner // 2):
        px[inner_x, y] = WOOD_DK + (255,)
    # hinge pins on the outer edge
    for y in (5, 10):
        px[hinge_x, y] = STEEL_PIN + (255,)


def make_kitchen_door():
    """3 frames of 32x16: closed, half open, fully open. Leaves hinged at the outer sides."""
    sheet = Image.new("RGBA", (32 * 3, T), (0, 0, 0, 0))
    # (leaf width, free-edge drop, edge-on tone)
    for f, (w, dy, tone) in enumerate(((15, 0, 0), (10, 2, 0), (5, 3, 1))):
        frame = Image.new("RGBA", (32, T), (0, 0, 0, 0))
        px = frame.load()
        fill(px, 0, 2, 0, 13, WOOD_DK)                       # jambs the hinges are fixed to
        fill(px, 31, 2, 31, 13, WOOD_DK)
        draw_leaf(px, 1, 1 + w - 1, dy, tone)
        draw_leaf(px, 30, 30 - (w - 1), dy, tone)
        outline(frame)
        sheet.paste(frame, (f * 32, 0))
    return sheet


MARKER_BAR = [(5, 1, 9, 4), (6, 5, 8, 8), (7, 9, 7, 9)]   # x0, y0, x1, y1: tapering bar
MARKER_DOT = (6, 11, 8, 13)


def make_task_marker():
    sheet = Image.new("RGBA", (T * 2, T), (0, 0, 0, 0))
    for f, (fill_c, hi_c) in enumerate((((230, 44, 38), (255, 130, 108)), ((176, 36, 34), (214, 86, 72)))):
        frame = Image.new("RGBA", (T, T), (0, 0, 0, 0))
        px = frame.load()
        for x0, y0, x1, y1 in MARKER_BAR + [MARKER_DOT]:
            fill(px, x0, y0, x1, y1, fill_c)
            fill(px, x0, y0, x0, y1, hi_c)       # left highlight
        outline(frame)
        sheet.paste(frame, (f * T, 0))
    return sheet


# ---------------- fire and smoke ----------------
FIRE_PAL = {
    "Y": (255, 240, 176), "O": (240, 144, 44), "R": (196, 56, 32),
    "D": (122, 32, 28), "K": (56, 22, 22),
}
FIRE_FRAMES = [
    [
        "................",
        ".......R........",
        "......RR....R...",
        "......ROR...RR..",
        ".....RROOR..ROR.",
        "....RROOOR.RROR.",
        "....ROOYOORRROR.",
        "....ROYYOOROOOR.",
        "...RROYYYOOOOOR.",
        "...ROOYYYYOOOOR.",
        "...ROOYYYYYOOOR.",
        "...ROOYYYYYOOR..",
        "...RROYYYYYOORR.",
        "....RROYYYYORR..",
        ".....RRROOORR...",
        "......KKRRRKK...",
    ],
    [
        "................",
        "....R...........",
        "....RR..........",
        "....ROR...R.....",
        "....ROOR..RR....",
        "....RROOR.ROR...",
        "....ROOOORROOR..",
        "...RROYYOOROOR..",
        "...ROOYYYOOOOR..",
        "...ROOYYYYOOOR..",
        "...ROOYYYYYOOR..",
        "..RROOYYYYYOOR..",
        "..RROYYYYYYOORR.",
        "...RROYYYYYORR..",
        ".....RROOOORR...",
        "......KKRRRKK...",
    ],
    [
        "................",
        "................",
        "........R.......",
        ".......RR.......",
        ".......ROR..R...",
        "......RROOR.RR..",
        "...R..ROOOROOR..",
        "...RR.ROYOOOOR..",
        "...ROROYYYOOOR..",
        "...ROOOYYYYOOR..",
        "..RROOYYYYYOOR..",
        "..ROOYYYYYYOOR..",
        "..RROYYYYYYOORR.",
        "...RROYYYYYORR..",
        "....RRROOOORR...",
        "......KKRRRKK...",
    ],
]


def make_fire():
    sheet = Image.new("RGBA", (T * len(FIRE_FRAMES), T), (0, 0, 0, 0))
    for i, rows in enumerate(FIRE_FRAMES):
        assert len(rows) == T and all(len(r) == T for r in rows), f"fire frame {i} not 16x16"
        px = sheet.load()
        for y, row in enumerate(rows):
            for x, c in enumerate(row):
                if c != ".":
                    px[i * T + x, y] = FIRE_PAL[c] + (255,)
    return sheet


# each smoke frame is a cluster of (cx, cy, radius) blobs
SMOKE_BLOBS = [
    [(8, 10, 5.0), (5, 8, 3.6), (11, 7, 3.8), (8, 5, 3.4), (6, 3, 2.2)],
    [(8, 9, 5.0), (4.5, 6.5, 3.4), (11.5, 8, 3.8), (9, 4, 3.6), (11, 2, 2.2)],
]


def make_smoke():
    srng = random.Random(5)
    sheet = Image.new("RGBA", (T * len(SMOKE_BLOBS), T), (0, 0, 0, 0))
    px = sheet.load()
    for i, blobs in enumerate(SMOKE_BLOBS):
        for y in range(T):
            for x in range(T):
                dens = 0.0
                for cx, cy, r in blobs:
                    dens = max(dens, 1 - (((x - cx) ** 2 + (y - cy) ** 2) ** 0.5) / r)
                dens += srng.uniform(-0.12, 0.12) if dens > 0 else 0
                if dens <= 0.08:
                    continue
                alpha = 90 if dens < 0.35 else (150 if dens < 0.65 else 195)
                shade = 84 if dens < 0.35 else (66 if dens < 0.65 else 52)
                if (x + y) % 5 == 0 and dens > 0.35:
                    shade += 14   # small highlights break up the flat gray
                px[i * T + x, y] = (shade, shade, shade + 6, alpha)
    return sheet


def make_restaurant_scene(tiles, frames, fire, smoke):
    # d dining floor, k kitchen floor, w wall, n window, F front door, B back door, R back room door
    # c counter, t dirty table, u clean table, h chair, s stove, S sink, x full trash, e empty trash
    layout = [
        "wwFwnwwnwBwwRwnw",
        "dddddddddkksksSx",
        "ddhtuhdddkkkkkkk",
        "dddddddddkkkkkke",
        "dddddddddcccccck",
        "dddddddddddddddd",
        "ddhthhhuhddddddd",
        "dddddddddddddddd",
        "dddddddddddddddd",
    ]
    key = {"d": "dining_floor", "k": "kitchen_floor", "w": "wall", "n": "wall_window",
           "F": "front_door", "B": "back_door", "R": "back_room_door", "c": "counter",
           "t": "table_dirty", "u": "table_clean", "h": "chair", "s": "stove_on",
           "S": "sink", "x": "trash_full", "e": "trash_empty"}
    img = Image.new("RGBA", (len(layout[0]) * T, len(layout) * T))
    for y, row in enumerate(layout):
        for x, ch in enumerate(row):
            img.paste(tiles[key[ch]], (x * T, y * T))
    # fire and smoke near the stove (stove tiles are at columns 12 and 10 in row 1)
    for (tx, ty, f) in ((11, 2, 0), (12, 2, 1)):
        img.alpha_composite(fire.crop((f * T, 0, f * T + T, T)), (tx * T, ty * T))
    for (tx, ty, f) in ((11, 1, 0), (12, 1, 1), (11, 2, 1), (10, 1, 1)):
        img.alpha_composite(smoke.crop((f * T, 0, f * T + T, T)), (tx * T, ty * T))
    shadow = Image.new("RGBA", (12, 4), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).ellipse((0, 0, 11, 3), fill=(0, 0, 0, 70))
    mx, my = 6 * T, 4 * T - 12
    img.alpha_composite(shadow, (mx + 2, my + 28))
    img.alpha_composite(frames[("down", 0)], (mx, my))
    return img


def make_walls_preview(tiles, door, marker):
    """Mock room: top/side/bottom walls with corners, counter with end caps around a 2-tile gap,
    cafe doors (closed) in the gap, and task markers over the stove and a table."""
    # < > top corners, [ ] bottom corners, l r side walls, w wall, n window, F front door,
    # k kitchen floor, d dining floor, c counter, ( ) counter ends, s stove, K sink, t table, h chair
    layout = [
        "<wwnwwwwwwnww>",
        "lkkkkkkkkkkkkr",
        "lkksKkkkkkkkkr",
        "lkkkkkkkkkkkkr",
        "lkkkkkkkkkkkkr",
        "lcccc(kk)ccccr",
        "lddddddddddddr",
        "ldddhtdhdddddr",
        "lddddddddddddr",
        "lddddddddddddr",
        "[wwwwwwFwnwww]",
    ]
    key = {"w": "wall", "n": "wall_window", "<": "wall_corner_top_left", ">": "wall_corner_top_right",
           "[": "wall_corner_bottom_left", "]": "wall_corner_bottom_right",
           "l": "wall_side_left", "r": "wall_side_right", "k": "kitchen_floor", "d": "dining_floor",
           "c": "counter", "(": "counter_end_left", ")": "counter_end_right",
           "s": "stove_on", "K": "sink", "t": "table_dirty", "h": "chair", "F": "front_door"}
    # the top-right and bottom-right corner characters share a row with '>' and ']'
    layout[0] = layout[0][:-1] + ">"
    img = Image.new("RGBA", (len(layout[0]) * T, len(layout) * T))
    for y, row in enumerate(layout):
        assert len(row) == len(layout[0]), (y, row)
        for x, ch in enumerate(row):
            img.paste(tiles[key[ch]], (x * T, y * T))
    img.alpha_composite(door.crop((0, 0, 32, T)), (6 * T, 5 * T))          # closed doors in the gap
    img.alpha_composite(marker.crop((0, 0, T, T)), (3 * T, 2 * T - 14))    # above the stove
    img.alpha_composite(marker.crop((T, 0, 2 * T, T)), (5 * T, 7 * T - 14))  # above the table
    return img


def main():
    ASSET_DIR.mkdir(parents=True, exist_ok=True)
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    sheet, frames = make_sheet()
    sheet.save(ASSET_DIR / "mateo_walk.png")
    tiles_sheet, tiles = make_tiles()
    tiles_sheet.save(ASSET_DIR / "border_tiles.png")

    scene = make_scene(tiles, frames)
    scene.resize((scene.width * 4, scene.height * 4), Image.NEAREST).save(PREVIEW_DIR / "preview_scene.png")

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
    gif_frames[0].save(PREVIEW_DIR / "preview_walk.gif", save_all=True, append_images=gif_frames[1:],
                       duration=160, loop=0)

    rest_sheet, rest_tiles = make_restaurant_tiles()
    rest_sheet.save(ASSET_DIR / "restaurant_tiles.png")
    fire = make_fire()
    fire.save(ASSET_DIR / "fire.png")
    smoke = make_smoke()
    smoke.save(ASSET_DIR / "smoke.png")
    for name, im in (("restaurant_tiles", rest_sheet), ("fire", fire), ("smoke", smoke)):
        bg = Image.new("RGBA", im.size, (150, 118, 84, 255)) if name != "restaurant_tiles" else Image.new("RGBA", im.size)
        bg.alpha_composite(im)
        bg.resize((im.width * 6, im.height * 6), Image.NEAREST).save(PREVIEW_DIR / f"{name}_6x.png")
    kdoor = make_kitchen_door()
    kdoor.save(ASSET_DIR / "kitchen_door.png")
    marker = make_task_marker()
    marker.save(ASSET_DIR / "task_marker.png")
    for name, im in (("kitchen_door", kdoor), ("task_marker", marker)):
        bg = Image.new("RGBA", im.size, (150, 118, 84, 255))
        bg.alpha_composite(im)
        bg.resize((im.width * 6, im.height * 6), Image.NEAREST).save(PREVIEW_DIR / f"{name}_6x.png")
    walls = make_walls_preview(rest_tiles, kdoor, marker)
    walls.resize((walls.width * 4, walls.height * 4), Image.NEAREST).save(PREVIEW_DIR / "restaurant_walls_preview.png")
    rscene = make_restaurant_scene(rest_tiles, frames, fire, smoke)
    rscene.resize((rscene.width * 4, rscene.height * 4), Image.NEAREST).save(PREVIEW_DIR / "restaurant_scene.png")

    # also a 6x preview of the sprite sheet and tiles for inspection
    sheet.resize((sheet.width * 6, sheet.height * 6), Image.NEAREST).save(PREVIEW_DIR / "sheet_6x.png")
    tiles_sheet.resize((tiles_sheet.width * 6, tiles_sheet.height * 6), Image.NEAREST).save(PREVIEW_DIR / "tiles_6x.png")


if __name__ == "__main__":
    main()
