"""Border Hopper sample art generator.
Outputs:
  public/assets/images/mateo_walk.png    64x128 sprite sheet, 16x32 frames. Rows: down, up, right, left. 4 frames each.
  public/assets/images/border_tiles.png  160x16, 16x16 tiles in a row (see TILE_ORDER).
  public/assets/images/restaurant_tiles.png  384x16, restaurant interior tiles (see RESTAURANT_ORDER).
  public/assets/images/kitchen_door.png  96x16, 3 frames of 32x16 swinging cafe doors (closed, half, open).
  public/assets/images/task_marker.png   32x16, 2 frames of 16x16 red '!' marker (bright, dim).
  public/assets/images/phone_ledge.png   32x16, 2 frames of 16x16 phone lying on a wall ledge, cable to the wall (dim, ringing).
  public/assets/images/phone_icon.png    32x24, 2 frames of 16x24 corner phone icon (idle, ringing).
  public/assets/images/curb_tiles.png    144x16, curb scene tiles (see CURB_ORDER).
  public/assets/images/streetlight.png   16x48 streetlight pole and lamp; light_pool.png 56x22 soft ground light.
  public/assets/images/sedan.png         96x24, 2 frames of 48x24 dark maroon sedan (headlights off, on).
  public/assets/images/aurelio_walk.png  64x128, Don Aurelio, same layout as mateo_walk.png.
  public/assets/images/sitting.png       48x32, 3 frames of 16x32 (Mateo sitting, Aurelio sitting, Aurelio mid sit-down).
  public/assets/images/phone_ui.png      112x150 corner phone frame; screen area x6 y16 w100 h118.
  public/assets/images/fire.png          48x16, 3-frame looping flame.
  public/assets/images/smoke.png         32x16, 2-frame looping smoke puff.
  tools/art/previews/preview_scene.png   small scene at 4x scale.
  tools/art/previews/preview_walk.gif    walk cycles at 6x scale.
  tools/art/previews/sheet_6x.png, tiles_6x.png  6x inspection previews.
  tools/art/previews/restaurant_tiles_6x.png, fire_6x.png, smoke_6x.png, restaurant_scene.png,
  tools/art/previews/kitchen_door_6x.png, task_marker_6x.png, restaurant_walls_preview.png,
  tools/art/previews/phone_ledge_6x.png, phone_ui_4x.png, phone_icon_6x.png,
  tools/art/previews/curb_scene.png and 6x previews of each curb image
  Mission 1: apartment_tiles.png, apartment_props.png, tireshop_tiles.png, pickup_truck.png, creeper.png,
  abuela_walk.png, tomi_walk.png, ruiz_walk.png, nando_walk.png, mateo_extra.png (see the README),
  and previews apartment_scene.png, tireshop_scene.png, m1_lineup_1x/6x.png
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

MATEO = {
    "pal": PAL, "head_down": HEAD_DOWN, "head_up": HEAD_UP, "head_side": HEAD_SIDE,
    "torso_front": TORSO_FRONT, "torso_back": TORSO_BACK, "torso_side": TORSO_SIDE,
    "head_dy": 0, "head_dx_side": 0, "bob": 1,
}

# Don Aurelio: late 60s, gray hair and mustache, cream guayabera (pleats p), dark slacks and shoes.
# A slight stoop: head carried 1 px low, and pushed 1 px forward in profile. His walk has less bob
# (and is played slower in game), so it reads steadier than Mateo's.
AURELIO_PAL = {
    "H": (150, 148, 146), "h": (190, 188, 184),
    "S": (170, 116, 84), "s": (132, 88, 62),
    "E": (28, 20, 18), "M": (206, 204, 198),
    "T": (228, 216, 188), "t": (192, 180, 152), "p": (176, 164, 138),
    "J": (52, 48, 56), "j": (36, 32, 40),
    "B": (52, 40, 34), "b": (36, 28, 24),
}
AURELIO = {
    "pal": AURELIO_PAL,
    "head_down": [
        ".....HHHHHH.....",
        "....HhHHHHhH....",
        "...HHHHHHHHHH...",
        "...HHSSSSSSHH...",
        "...HSSSSSSSSH...",
        "...HSSESSESSH...",
        "....SMMMMMMS....",
        ".....sSSSSs.....",
        "......ssss......",
    ],
    "head_up": [
        ".....HHHHHH.....",
        "....HHHHhhHH....",
        "...HHHHHHHHHH...",
        "...HHHHHHHHHH...",
        "...HHHHHhHHHH...",
        "...HHHHHHHHHH...",
        "....HHHHHHHH....",
        ".....sSSSSs.....",
        "......ssss......",
    ],
    "head_side": [
        ".....HHHHH......",
        "....HHhhHHH.....",
        "....HHHHHHHH....",
        "....HHHHSSSS....",
        "....HHHSSSSSS...",
        "....HHHSSSESS...",
        ".....HSSSMMMM...",
        "......sSSSs.....",
        ".......sss......",
    ],
    "torso_front": [
        "....TTTTTTTT....",
        "..TTTTTTTTTTTT..",
        "..TtTpTTTTpTtT..",
        "..TtTpTTTTpTtT..",
        "..TtTpTTTTpTtT..",
        "..SttttttttttS..",
        "....JJJJJJJJ....",
    ],
    "torso_back": [
        "....tTTTTTTt....",
        "..TTtttttttTTT..",
        "..TtTpTTTTpTtT..",
        "..TtTpTTTTpTtT..",
        "..TtTTTTTTTTtT..",
        "..SttttttttttS..",
        "....JJJJJJJJ....",
    ],
    "torso_side": [
        ".....TTTTTT.....",
        ".....TTTTTTT....",
        ".....TtTpTTT....",
        ".....TtTpTTT....",
        ".....TtTTTTT....",
        ".....tStttttt...",
        "......JJJJJ.....",
    ],
    "head_dy": 1, "head_dx_side": 1, "bob": 0,
}


CUR = {"pal": PAL}  # palette used by blit_rows/rect; switched per character in make_frame


def blit_rows(px, rows, y0, dx=0):
    pal = CUR["pal"]
    for dy, row in enumerate(rows):
        for x, c in enumerate(row):
            if c != "." and 0 <= x + dx < FW:
                px[x + dx, y0 + dy] = pal[c] + (255,)


def rect(px, x0, y0, w, h, c):
    pal = CUR["pal"]
    for y in range(y0, y0 + h):
        for x in range(x0, x0 + w):
            px[x, y] = pal[c] + (255,)


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


def make_frame(direction, step, ch=None):
    ch = ch or MATEO
    CUR["pal"] = ch["pal"]
    img = Image.new("RGBA", (FW, FH), (0, 0, 0, 0))
    px = img.load()
    bob = ch["bob"] if step in (1, 3) else 0
    y = TOP + bob
    hy = y + ch["head_dy"]  # a stooped character carries his head a little low
    if direction in ("down", "up"):
        blit_rows(px, ch["torso_front"] if direction == "down" else ch["torso_back"], y + 9)
        blit_rows(px, ch["head_down"] if direction == "down" else ch["head_up"], hy)
        if ch["head_dy"]:  # torso shoulders over the lowered neck
            blit_rows(px, (ch["torso_front"] if direction == "down" else ch["torso_back"])[1:2], y + 10)
        ll = 1 if step == 1 else 0
        lr = 1 if step == 3 else 0
        front_legs(px, y + 16, ll, lr, back=(direction == "up"))
    else:  # right
        blit_rows(px, ch["torso_side"], y + 9)
        blit_rows(px, ch["head_side"], hy, dx=ch["head_dx_side"])
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
    CUR["pal"] = PAL
    return img


def make_sheet(ch=None):
    sheet = Image.new("RGBA", (FW * 4, FH * 4), (0, 0, 0, 0))
    frames = {}
    for r, d in enumerate(("down", "up", "right")):
        for f in range(4):
            fr = make_frame(d, f, ch)
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


# ---------------- phone ----------------
PHONE_BODY, PHONE_EDGE, PHONE_DARK = (34, 32, 40), (58, 54, 66), (20, 18, 24)
SCREEN_OFF = (12, 14, 20)
SCREEN_LIT, SCREEN_LIT_HI = (168, 214, 234), (226, 244, 250)
# Screen area inside phone_ui.png. PhoneUI.js uses the same numbers.
PHONE_UI_W, PHONE_UI_H = 112, 150
PHONE_SCREEN = (6, 16, 100, 118)  # x, y, w, h


def make_phone_ledge():
    """2 frames of 16x16, drawn over the bottom wall face: a smartphone lying flat on a small wooden
    ledge (screen up), with a white charging cable running down into a wall outlet.
    Frame 0: dim screen. Frame 1: bright screen with a little glow (ringing)."""
    sheet = Image.new("RGBA", (T * 2, T), (0, 0, 0, 0))
    cable = (240, 240, 234)
    for f in range(2):
        layer = Image.new("RGBA", (T, T), (0, 0, 0, 0))
        px = layer.load()
        fill(px, 1, 7, 14, 10, WOOD_HI)            # ledge top surface (seen from above)
        fill(px, 1, 7, 14, 7, (206, 160, 106))      # back edge, catching the light
        fill(px, 1, 11, 14, 12, WOOD_DK)           # ledge front edge
        fill(px, 3, 6, 11, 9, PHONE_BODY)          # phone lying flat, screen up
        fill(px, 3, 6, 11, 6, PHONE_EDGE)
        fill(px, 4, 7, 10, 8, SCREEN_LIT if f else (52, 62, 80))
        if f:
            fill(px, 4, 7, 5, 7, SCREEN_LIT_HI)
        fill(px, 12, 8, 12, 8, cable)              # cable out of the phone's end...
        fill(px, 13, 8, 13, 12, cable)             # ...over the ledge edge...
        fill(px, 13, 13, 13, 13, cable)            # ...down the wall
        fill(px, 12, 13, 14, 15, (226, 220, 204))  # wall outlet on the baseboard
        dots(px, [(13, 14)], (120, 112, 100))
        outline(layer)
        if f:  # glow above the lit screen, added after outlining so it stays soft
            dots(px, [(5, 4), (7, 3), (9, 4)], (250, 244, 200))
        sheet.paste(layer, (f * T, 0))
    return sheet


PHONE_ICON_W, PHONE_ICON_H = 16, 24


def make_phone_icon():
    """Small corner phone icon, 2 frames of 16x24. Frame 0: idle, dark screen. Frame 1: ringing, lit
    screen with a handset glyph."""
    sheet = Image.new("RGBA", (PHONE_ICON_W * 2, PHONE_ICON_H), (0, 0, 0, 0))
    for f in range(2):
        layer = Image.new("RGBA", (PHONE_ICON_W, PHONE_ICON_H), (0, 0, 0, 0))
        px = layer.load()
        fill(px, 3, 1, 12, 22, PHONE_BODY)
        fill(px, 3, 1, 3, 22, PHONE_EDGE)
        for x, y in ((3, 1), (12, 1), (3, 22), (12, 22)):   # rounded corners
            px[x, y] = (0, 0, 0, 0)
        fill(px, 7, 2, 8, 2, (70, 68, 80))          # speaker
        fill(px, 4, 4, 11, 19, SCREEN_LIT if f else SCREEN_OFF)
        if f:  # incoming-call screen: caller avatar and a green answer button
            fill(px, 4, 4, 5, 5, SCREEN_LIT_HI)
            fill(px, 6, 7, 9, 10, (226, 236, 240))
            dots(px, [(6, 7), (9, 7), (6, 10), (9, 10)], SCREEN_LIT)
            fill(px, 6, 14, 9, 17, (46, 170, 80))
            dots(px, [(6, 14), (9, 14), (6, 17), (9, 17)], SCREEN_LIT)
            dots(px, [(7, 15)], (150, 230, 160))
        fill(px, 6, 21, 9, 21, (96, 94, 106))       # home bar
        outline(layer)
        sheet.paste(layer, (f * PHONE_ICON_W, 0))
    return sheet


def make_phone_ui():
    """Corner phone frame: dark modern smartphone with a clearly bordered screen area."""
    w, h = PHONE_UI_W, PHONE_UI_H
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    px = img.load()
    fill(px, 1, 1, w - 2, h - 2, PHONE_BODY)
    fill(px, 1, 1, 2, h - 2, PHONE_EDGE)          # left edge highlight
    fill(px, 1, 1, w - 2, 2, PHONE_EDGE)          # top edge highlight
    fill(px, 0, 4, 0, h - 5, OUT)                 # outline with rounded corners
    fill(px, w - 1, 4, w - 1, h - 5, OUT)
    fill(px, 4, 0, w - 5, 0, OUT)
    fill(px, 4, h - 1, w - 5, h - 1, OUT)
    for cx, cy, sx, sy in ((0, 0, 1, 1), (w - 1, 0, -1, 1), (0, h - 1, 1, -1), (w - 1, h - 1, -1, -1)):
        for dx, dy in ((1, 3), (1, 2), (2, 1), (3, 1)):
            px[cx + sx * dx, cy + sy * dy] = OUT
        for dx, dy in ((0, 0), (1, 0), (0, 1), (2, 0), (0, 2), (1, 1), (3, 0), (0, 3)):
            px[cx + sx * dx, cy + sy * dy] = (0, 0, 0, 0)
        px[cx + sx * 1, cy + sy * 1] = (0, 0, 0, 0)
        px[cx + sx * 2, cy + sy * 2] = OUT
    sx0, sy0, sw, sh = PHONE_SCREEN
    fill(px, sx0 - 1, sy0 - 1, sx0 + sw, sy0 + sh, (44, 50, 66))   # screen border
    fill(px, sx0, sy0, sx0 + sw - 1, sy0 + sh - 1, SCREEN_OFF)       # screen
    fill(px, 46, 7, 65, 8, (66, 64, 76))          # speaker slot
    fill(px, 71, 7, 72, 8, (70, 84, 120))         # camera
    fill(px, 44, 141, 67, 142, (96, 94, 106))     # home bar
    fill(px, w - 1, 30, w - 1, 44, (78, 76, 90))  # side buttons
    fill(px, 0, 26, 0, 32, (78, 76, 90))
    fill(px, 0, 36, 0, 42, (78, 76, 90))
    return img


# ---------------- curb scene ----------------
crng = random.Random(33)  # own stream: curb art never changes earlier outputs
CONCRETE, CONCRETE_DK, CONCRETE_HI = (148, 146, 140), (122, 120, 116), (166, 164, 158)
SOOT, SOOT_DK = (58, 50, 48), (30, 26, 26)
SCORCH = [(168, 150, 124), (128, 112, 96), (92, 82, 74)]  # plaster getting more burned toward the top


def tile_sidewalk():
    img = solid(CONCRETE)
    d = img.load()
    for _ in range(18):
        d[crng.randrange(T), crng.randrange(T)] = crng.choice([CONCRETE_DK, CONCRETE_HI]) + (255,)
    fill(d, 0, 0, 15, 0, CONCRETE_DK)   # slab joints along the top and left edges
    fill(d, 0, 0, 0, 15, CONCRETE_DK)
    return img


def tile_curb_edge(drain=False):
    """Sidewalk (top) meeting the street: curb top, curb face, then the gutter."""
    img = tile_sidewalk()
    d = img.load()
    fill(d, 0, 9, 15, 9, (190, 186, 178))     # curb top edge, catching light
    fill(d, 0, 10, 15, 12, (112, 110, 106))   # curb face
    fill(d, 0, 13, 15, 15, (58, 58, 62))      # gutter
    if drain:  # storm drain opening in the curb face, grate in the gutter
        fill(d, 3, 10, 12, 12, (22, 20, 22))
        for x in range(4, 12, 2):
            fill(d, x, 13, x, 15, (34, 34, 38))
        fill(d, 3, 13, 12, 13, (92, 92, 96))
    return img


def tile_street():
    img = solid((62, 62, 66))
    d = img.load()
    for y in range(T):
        for x in range(T):
            if crng.random() < 0.2:
                d[x, y] = crng.choice([(52, 52, 56), (74, 74, 78)]) + (255,)
    return img


def tile_burned_wall():
    """Scorched plaster: soot thickest at the top, a charred baseboard."""
    img = solid(SCORCH[0])
    d = img.load()
    for y in range(12):
        for x in range(T):
            heat = (11 - y) / 11 + crng.uniform(-0.08, 0.08)  # mostly smooth: the tile repeats along the wall
            if heat > 0.66:
                d[x, y] = SCORCH[2] + (255,)
            elif heat > 0.33:
                d[x, y] = SCORCH[1] + (255,)
    for _ in range(1):  # one irregular soot streak running down from the top
        x = crng.randrange(1, 15)
        for y in range(0, 4 + crng.randrange(6)):
            if crng.random() < 0.8:
                d[x, y] = SOOT + (255,)
            if crng.random() < 0.3:
                x = max(0, min(15, x + crng.choice((-1, 1))))
    fill(d, 0, 12, 15, 12, (70, 52, 42))
    fill(d, 0, 13, 15, 15, SOOT_DK)
    return img


def tile_broken_window():
    img = tile_burned_wall()
    d = img.load()
    fill(d, 2, 1, 13, 10, OUT)                # blackened frame
    fill(d, 3, 2, 12, 9, (18, 16, 20))        # dark, empty inside
    for x, y in ((4, 2), (5, 3), (4, 4), (11, 2), (10, 3), (12, 8), (11, 9), (3, 9)):
        d[x, y] = (150, 170, 178, 255)         # glass shards left in the frame
    dots(d, [(6, 6), (9, 5)], (90, 60, 40))   # embers inside
    return img


def tile_charred_door():
    img = tile_burned_wall()
    d = img.load()
    fill(d, 2, 1, 13, 15, (64, 66, 70))       # metal frame
    fill(d, 3, 2, 12, 15, (40, 30, 26))       # charred
    fill(d, 7, 2, 8, 15, (28, 22, 20))
    for _ in range(14):
        d[3 + crng.randrange(10), 2 + crng.randrange(13)] = crng.choice([(58, 44, 36), (22, 18, 16)]) + (255,)
    fill(d, 9, 8, 10, 8, (120, 118, 110))     # handle
    return img


def tile_wall_top_soot():
    """Top edge of the storefront (the roofline seen from above), streaked with soot."""
    img = solid((150, 136, 116))
    d = img.load()
    fill(d, 0, 0, 15, 0, OUT)
    fill(d, 0, 12, 15, 15, SCORCH[2])
    for _ in range(10):  # low-contrast soot specks (the tile repeats along the roofline)
        x, y = crng.randrange(T), crng.randrange(1, 12)
        d[x, y] = crng.choice([(132, 118, 100), SCORCH[1]]) + (255,)
    return img


def tile_streetlight_base():
    img = tile_sidewalk()
    d = img.load()
    fill(d, 5, 9, 10, 12, (50, 56, 58))       # cast base plate under the pole
    fill(d, 5, 9, 10, 9, (84, 92, 96))
    fill(d, 6, 13, 9, 13, (100, 98, 94))      # its shadow edge
    return img


CURB_ORDER = ["sidewalk", "curb_edge", "street", "burned_wall", "broken_window", "charred_door",
              "wall_top_soot", "storm_drain", "streetlight_base"]


def make_curb_tiles():
    tiles = {
        "sidewalk": tile_sidewalk(), "curb_edge": tile_curb_edge(), "street": tile_street(),
        "burned_wall": tile_burned_wall(), "broken_window": tile_broken_window(),
        "charred_door": tile_charred_door(), "wall_top_soot": tile_wall_top_soot(),
        "storm_drain": tile_curb_edge(drain=True), "streetlight_base": tile_streetlight_base(),
    }
    sheet = Image.new("RGBA", (T * len(CURB_ORDER), T))
    for i, k in enumerate(CURB_ORDER):
        sheet.paste(tiles[k], (i * T, 0))
    return sheet, tiles


def make_streetlight():
    """16x48 pole and lamp. The pole's foot is at the bottom centre."""
    img = Image.new("RGBA", (16, 48), (0, 0, 0, 0))
    px = img.load()
    pole, pole_hi, pole_dk = (66, 74, 78), (98, 108, 112), (44, 50, 54)
    fill(px, 7, 8, 8, 45, pole)
    fill(px, 7, 8, 7, 45, pole_hi)
    fill(px, 5, 44, 10, 47, pole_dk)          # base flare
    fill(px, 5, 44, 10, 44, pole)
    fill(px, 2, 2, 13, 5, pole_dk)            # lamp head
    fill(px, 3, 2, 12, 2, pole_hi)
    fill(px, 3, 6, 12, 7, (252, 232, 160))    # lit glass underneath
    fill(px, 5, 6, 10, 6, (255, 248, 210))
    outline(img)
    return img


def make_light_pool(w=56, h=22):
    """Soft pale-yellow ellipse for the ground under the streetlight (3 alpha steps, pixel style)."""
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    px = img.load()
    cx, cy = (w - 1) / 2, (h - 1) / 2
    for y in range(h):
        for x in range(w):
            r = ((x - cx) / (w / 2)) ** 2 + ((y - cy) / (h / 2)) ** 2
            if r < 0.3:
                a = 110
            elif r < 0.65:
                a = 70
            elif r < 1.0:
                a = 34
            else:
                continue
            px[x, y] = (255, 236, 164, a)
    return img


SEDAN_W, SEDAN_H = 48, 24


def make_sedan():
    """Old, spotless, dark maroon sedan from the side (3/4 top-down), facing right, chrome trim.
    2 frames: 0 headlights off, 1 on."""
    sheet = Image.new("RGBA", (SEDAN_W * 2, SEDAN_H), (0, 0, 0, 0))
    body, body_dk, body_hi = (80, 18, 30), (56, 12, 22), (112, 38, 50)  # dark maroon
    chrome, chrome_dk = (214, 218, 224), (150, 156, 164)
    glass, glass_hi = (54, 66, 84), (110, 128, 150)
    for f in range(2):
        layer = Image.new("RGBA", (SEDAN_W, SEDAN_H), (0, 0, 0, 0))
        px = layer.load()
        fill(px, 14, 2, 34, 4, body_hi)            # roof (seen a little from above)
        fill(px, 12, 5, 36, 9, glass)              # side windows
        fill(px, 22, 5, 23, 9, body_dk)            # door pillar
        fill(px, 13, 5, 15, 6, glass_hi)
        fill(px, 25, 5, 27, 6, glass_hi)
        fill(px, 12, 4, 36, 4, chrome)             # window trim
        fill(px, 1, 10, 46, 17, body)              # body side
        fill(px, 1, 10, 46, 10, body_hi)           # beltline highlight
        fill(px, 1, 17, 46, 17, body_dk)
        fill(px, 2, 13, 45, 13, chrome)            # chrome side strip
        fill(px, 22, 11, 22, 16, body_dk)          # door seam
        fill(px, 0, 14, 2, 16, chrome)             # rear bumper
        fill(px, 45, 14, 47, 16, chrome)           # front bumper
        fill(px, 0, 11, 1, 12, (190, 30, 30))      # tail light
        fill(px, 45, 11, 47, 12, (255, 250, 214) if f else (196, 192, 170))  # headlight
        for wx in (8, 34):                         # wheels with chrome hubcaps
            fill(px, wx, 16, wx + 7, 22, (24, 22, 24))
            fill(px, wx + 2, 18, wx + 5, 20, chrome_dk)
            fill(px, wx + 3, 18, wx + 4, 19, chrome)
        outline(layer)
        if f:  # glow off the lit headlight, after outlining so it stays soft
            for x, y in ((47, 10), (47, 13)):
                layer.load()[x, y] = (255, 246, 200, 160)
        sheet.paste(layer, (f * SEDAN_W, 0))
    return sheet


def make_sitting():
    """16x32 frames: 0 Mateo sitting on a curb, facing down; 1 Don Aurelio sitting;
    2 Don Aurelio mid sit-down (easing down / standing up)."""
    sheet = Image.new("RGBA", (FW * 3, FH), (0, 0, 0, 0))
    for i, (ch, drop) in enumerate(((MATEO, 6), (AURELIO, 6), (AURELIO, 3))):
        CUR["pal"] = ch["pal"]
        img = Image.new("RGBA", (FW, FH), (0, 0, 0, 0))
        px = img.load()
        y = TOP + drop
        blit_rows(px, ch["torso_front"], y + 9)
        blit_rows(px, ch["head_down"], y + ch["head_dy"])
        ly = y + 16
        if drop >= 6:   # seated: thighs come toward us (short, a bit apart), feet on the street
            rect(px, 3, ly, 4, 2, "J")
            rect(px, 9, ly, 4, 2, "J")
            rect(px, 6, ly, 1, 2, "j")
            rect(px, 9, ly, 1, 2, "j")
            rect(px, 3, ly + 2, 4, 2, "B")
            rect(px, 9, ly + 2, 4, 2, "B")
        else:           # halfway: knees bent, still mostly on his feet
            rect(px, 4, ly, 3, 4, "J")
            rect(px, 9, ly, 3, 4, "J")
            rect(px, 6, ly, 1, 4, "j")
            rect(px, 9, ly, 1, 4, "j")
            rect(px, 3, ly + 4, 4, 2, "B")
            rect(px, 9, ly + 4, 4, 2, "B")
        outline(img)
        CUR["pal"] = PAL
        sheet.paste(img, (i * FW, 0))
    return sheet


def make_curb_preview(tiles, mateo_frames, aurelio_frames, sitting, sedan, light, pool, smoke):
    """Mock curb scene: burned storefront, sidewalk, curb, street, streetlight with its pool,
    the sedan, Mateo sitting, Don Aurelio standing and sitting, smoke wisps."""
    layout = [
        "tttttttttttttt",
        "wwnwwdwwnwwwww",
        "ssssssssssssss",
        "sssLssssssssss",
        "ccccccgccccccc",
        "rrrrrrrrrrrrrr",
        "rrrrrrrrrrrrrr",
    ]
    key = {"t": "wall_top_soot", "w": "burned_wall", "n": "broken_window", "d": "charred_door",
           "s": "sidewalk", "L": "streetlight_base", "c": "curb_edge", "g": "storm_drain", "r": "street"}
    img = Image.new("RGBA", (len(layout[0]) * T, len(layout) * T))
    for y, row in enumerate(layout):
        for x, ch in enumerate(row):
            img.paste(tiles[key[ch]], (x * T, y * T))
    img.alpha_composite(pool, (3 * T + 8 - pool.width // 2, 4 * T + 2))
    img.alpha_composite(light, (3 * T, 4 * T - 48))
    img.alpha_composite(sedan.crop((SEDAN_W, 0, SEDAN_W * 2, SEDAN_H)), (8 * T, 5 * T + 2))
    img.alpha_composite(sitting.crop((0, 0, FW, FH)), (5 * T, 5 * T - 30))           # Mateo on the curb
    img.alpha_composite(sitting.crop((FW, 0, FW * 2, FH)), (6 * T + 2, 5 * T - 30))  # Aurelio sitting
    img.alpha_composite(aurelio_frames[("right", 0)], (11 * T, 3 * T - 14))         # Aurelio standing
    img.alpha_composite(mateo_frames[("down", 0)], (12 * T + 4, 3 * T - 14))        # for comparison
    for sx, f in ((2, 0), (6, 1), (9, 0)):
        img.alpha_composite(smoke.crop((f * T, 0, f * T + T, T)), (sx * T, 0))
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


# ---------------- Mission 1: characters ----------------
# Mission 1 art uses its own random stream (mrng) and its own frame builder, so nothing here can change
# an earlier output. Characters are built bottom-up: every character's feet end on the same row as
# Mateo's (row 28 of the 16x32 frame), whatever their height.
mrng = random.Random(51)
FEET_ROW = 28


def check_rows(name, rows, width=FW):
    for r in rows:
        assert len(r) == width, f"{name}: row {r!r} is {len(r)} wide, not {width}"
    return rows


LEGS_MATEO = {"front": [(4, 3), (9, 3)], "stand": (7, 3), "back": (5, 3), "fwd": (9, 3)}


def draw_char_legs(px, ch, view, step, ly, bare):
    """Legs and shoes in Mateo's style. bare: the character's own left foot has no shoe (sock 'K')."""
    L = ch["legs"]
    g = ch.get("leg_geom", LEGS_MATEO)
    if view in ("front", "back"):
        lifts = (1 if step == 1 else 0, 1 if step == 3 else 0)
        for i, ((x0, w), lift) in enumerate(zip(g["front"], lifts)):
            h = L - lift
            rect(px, x0, ly, w, h, "J")
            rect(px, x0 + w - 1 if i == 0 else x0, ly, 1, h, "j")     # inner-side shading
            own_left = (i == 1) if view == "front" else (i == 0)
            shoe = "K" if bare and own_left else ("b" if view == "back" else "B")
            rect(px, x0, ly + h, w, 2, shoe)
    elif step in (0, 2):
        x0, w = g["stand"]
        rect(px, x0, ly, w, L, "J")
        rect(px, x0 + w - 1, ly, 1, L, "j")
        rect(px, x0, ly + L, w + 1, 2, "B")
    else:
        near, far = ("J", "j") if step == 1 else ("j", "J")
        bx, bw = g["back"]
        fx, fw = g["fwd"]
        rect(px, bx, ly, bw, L - 1, far)                               # back leg
        rect(px, bx - 1, ly + L - 1, bw + 1, 2, "K" if bare else "b")
        rect(px, fx, ly, fw, L - 1, near)                              # front leg
        rect(px, fx, ly + L - 1, fw + 1, 2, "B")


def char_frame(direction, step, ch, bare=False):
    CUR["pal"] = ch["pal"]
    img = Image.new("RGBA", (FW, FH), (0, 0, 0, 0))
    px = img.load()
    view = {"down": "front", "up": "back"}.get(direction, "side")
    head = ch["head_" + {"front": "down", "back": "up", "side": "side"}[view]]
    torso = ch["torso_" + view]
    skirt = ch.get("skirt_" + view, [])
    total = len(head) + len(torso) + len(skirt) + ch["legs"] + 2
    y = FEET_ROW + 1 - total + (ch["bob"] if step in (1, 3) else 0)
    blit_rows(px, torso, y + len(head))
    blit_rows(px, head, y)
    blit_rows(px, skirt, y + len(head) + len(torso))
    draw_char_legs(px, ch, view, step, y + len(head) + len(torso) + len(skirt), bare)
    outline(img)
    CUR["pal"] = PAL
    return img


def char_sheet(ch, extra_rows=()):
    """mateo_walk.png layout (rows down, up, right, left; 4 frames each), plus extra rows of frames."""
    sheet = Image.new("RGBA", (FW * 4, FH * (4 + len(extra_rows))), (0, 0, 0, 0))
    frames = {}
    for r, d in enumerate(("down", "up", "right")):
        for f in range(4):
            frames[(d, f)] = char_frame(d, f, ch)
            sheet.paste(frames[(d, f)], (f * FW, r * FH))
    for f in range(4):
        frames[("left", f)] = frames[("right", f)].transpose(Image.FLIP_LEFT_RIGHT)
        sheet.paste(frames[("left", f)], (f * FW, 3 * FH))
    for r, row in enumerate(extra_rows):
        for f, fr in enumerate(row):
            sheet.paste(fr, (f * FW, (4 + r) * FH))
    return sheet, frames


def rows_frame(ch, rows, bottom=FEET_ROW, size=(FW, FH)):
    """A frame from whole-figure rows (e.g. lying down), drawn so the last row lands on `bottom`."""
    CUR["pal"] = ch["pal"]
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    px = img.load()
    y0 = bottom - len(rows) + 1
    for dy, row in enumerate(rows):
        for x, c in enumerate(row):
            if c != ".":
                px[x, y0 + dy] = ch["pal"][c] + (255,)
    outline(img)
    CUR["pal"] = PAL
    return img


def seated_frame(ch, head, torso):
    """Waist-up, for sitting behind a table or standing behind a counter: the frame's bottom row is
    the edge of the table or counter in front of them (the furniture hides the rest)."""
    return rows_frame(ch, head + torso, bottom=FH - 1)


# Abuela Esperanza: small and upright (3 px shorter than Mateo), gray hair in a bun, plum cardigan
# over a pale floral housedress, tan stockings, black shoes.
ABUELA_PAL = {
    "H": (172, 168, 164), "h": (206, 204, 200),
    "S": (172, 120, 90), "s": (136, 92, 66), "E": (28, 20, 18),
    "T": (118, 70, 96), "t": (88, 50, 72),
    "D": (214, 170, 160), "d": (186, 140, 132), "f": (238, 224, 168),
    "J": (182, 140, 110), "j": (150, 112, 86),
    "B": (44, 36, 36), "b": (30, 24, 24), "K": (230, 228, 222),
}
ABUELA = {
    "pal": ABUELA_PAL, "legs": 2, "bob": 1,
    "leg_geom": {"front": [(5, 2), (9, 2)], "stand": (7, 2), "back": (6, 2), "fwd": (8, 2)},
    "head_down": check_rows("abuela", [
        "......HhHH......",
        ".....HHHHHH.....",
        "....HHhHHhHH....",
        "....HHSSSSHH....",
        "....HSESSESH....",
        "....SSSSSSSS....",
        ".....sSSSSs.....",
        "......ssss......",
    ]),
    "head_up": check_rows("abuela", [
        "......HhHH......",
        ".....HHhhHH.....",
        "....HHHhhHHH....",
        "....HHHHHHHH....",
        "....HHHHHHHH....",
        "....HHHHHHHH....",
        ".....sHHHHs.....",
        "......ssss......",
    ]),
    "head_side": check_rows("abuela", [
        "......HHHH......",
        "...HhHHHHHH.....",
        "...HHHHHHSSS....",
        "....HHHSSSESS...",
        "....HHSSSSSSS...",
        ".....sSSSSSS....",
        "......sSSSs.....",
        ".......sss......",
    ]),
    "torso_front": check_rows("abuela", [
        ".....TTTTTT.....",
        "....TTTDDTTT....",
        "....TtTDDTtT....",
        "....TtTDDTtT....",
        "....STDDDDTS....",
    ]),
    "torso_back": check_rows("abuela", [
        ".....tTTTTt.....",
        "....TTttttTT....",
        "....TtTTTTtT....",
        "....TtTTTTtT....",
        "....STTTTTTS....",
    ]),
    "torso_side": check_rows("abuela", [
        "......TTTT......",
        ".....TTTTTD.....",
        ".....TtTTTD.....",
        ".....TtTTTD.....",
        ".....tSttTD.....",
    ]),
    "skirt_front": check_rows("abuela", [
        "....DdDDDDdD....",
        "....DDDfDDDD....",
        "...DDfDDDDfDD...",
    ]),
    "skirt_back": check_rows("abuela", [
        "....DDDDDDDD....",
        "....DdDDfDdD....",
        "...DDDDDDDDDD...",
    ]),
    "skirt_side": check_rows("abuela", [
        ".....DDDDDD.....",
        ".....DDfDDD.....",
        "....DDDDDDDD....",
    ]),
}

# Tomi: 14, 3 px shorter than Mateo, messy black hair, white school polo, navy school pants, black shoes.
TOMI_PAL = {
    "H": (30, 24, 24), "h": (62, 50, 48),
    "S": (170, 114, 80), "s": (134, 88, 62), "E": (28, 20, 18),
    "T": (228, 226, 220), "t": (186, 184, 180),
    "J": (54, 58, 80), "j": (40, 42, 60),
    "B": (36, 32, 34), "b": (24, 22, 24), "K": (238, 236, 230),
}
TOMI = {
    "pal": TOMI_PAL, "legs": 4, "bob": 1,
    "head_down": check_rows("tomi", [
        "....H.HHH.H.....",
        "...HHHHhHHHH....",
        "...HHhHHHHhHH...",
        "...HHSSSSSSHH...",
        "...HSSESSESSH...",
        "....SSSSSSSS....",
        ".....sSSSSs.....",
        "......ssss......",
    ]),
    "head_up": check_rows("tomi", [
        "....H.HHH.H.....",
        "...HHHHHHHHH....",
        "...HHhHHHHhHH...",
        "...HHHHHhHHHH...",
        "...HHHHHHHHHH...",
        "....HHHHHHHH....",
        ".....sSSSSs.....",
        "......ssss......",
    ]),
    "head_side": check_rows("tomi", [
        ".....H.HHH......",
        "....HHHHhHH.....",
        "....HHHHHHHH....",
        "....HHHHSSSS....",
        "....HHHSSSSSS...",
        "....HHHSSSESS...",
        ".....HSSSSSS....",
        "......sSSSs.....",
    ]),
    "torso_front": check_rows("tomi", [
        "....TTtTTtTT....",
        "...TTTTtTTTT....",
        "...TtTTTTTTtT...",
        "...TtTTTTTTtT...",
        "...SttttttttS...",
        "....JJJJJJJJ....",
    ]),
    "torso_back": check_rows("tomi", [
        "....tTTTTTTt....",
        "...TTttttttTT...",
        "...TtTTTTTTtT...",
        "...TtTTTTTTtT...",
        "...SttttttttS...",
        "....JJJJJJJJ....",
    ]),
    "torso_side": check_rows("tomi", [
        ".....TTTTTT.....",
        ".....TtTTTTT....",
        ".....TtTTTTT....",
        ".....TtTTTTT....",
        ".....tSttttt....",
        "......JJJJJ.....",
    ]),
}

# Sr. Ruiz: 60s, mustard work cap, glasses, gray mustache, a little heavyset (wide torso), light blue
# work shirt, gray work pants, brown boots.
RUIZ_PAL = {
    "C": (198, 152, 60), "c": (156, 116, 42),
    "H": (150, 146, 140), "h": (182, 178, 172),
    "S": (168, 112, 80), "s": (132, 88, 62), "E": (28, 20, 18),
    "G": (44, 44, 52), "M": (140, 136, 130),
    "T": (140, 170, 196), "t": (108, 136, 162),
    "J": (100, 96, 90), "j": (76, 72, 68),
    "B": (98, 64, 42), "b": (72, 46, 30), "K": (230, 228, 222),
    "W": (236, 232, 220), "w": (176, 170, 160), "P": (40, 52, 140),
}
RUIZ_HEAD_DOWN = check_rows("ruiz", [
    "....CCCCCCCC....",
    "...CCCCCCCCCC...",
    "..cccccccccccc..",
    "...HSSSSSSSSH...",
    "...HSGGSSGGSH...",
    "...HSSSSSSSSH...",
    "....SMMMMMMS....",
    ".....sSSSSs.....",
    "......ssss......",
])
RUIZ_TORSO_FRONT = check_rows("ruiz", [
    "...TTTTTTTTTT...",
    ".TTTTTTTTTTTTTT.",
    ".TtTTTTTTTTTTtT.",
    ".TtTTTTTTTTTTtT.",
    ".TtTTTTTTTTTTtT.",
    ".SttttttttttttS.",
    "...JJJJJJJJJJ...",
])
RUIZ = {
    "pal": RUIZ_PAL, "legs": 5, "bob": 1,
    "head_down": RUIZ_HEAD_DOWN,
    "head_up": check_rows("ruiz", [
        "....CCCCCCCC....",
        "...CCCCCCCCCC...",
        "...CCCCcCCCCC...",
        "...HHHHHHHHHH...",
        "...HHHHHHHHHH...",
        "...HHHHHHHHHH...",
        "....HHHHHHHH....",
        ".....sSSSSs.....",
        "......ssss......",
    ]),
    "head_side": check_rows("ruiz", [
        ".....CCCCC......",
        "....CCCCCCC.....",
        "....CCCCCCcccc..",
        "....HHHHSSSS....",
        "....HHHSSGGSS...",
        "....HHHSSSSSS...",
        ".....HSSSMMMM...",
        "......sSSSs.....",
        ".......sss......",
    ]),
    "torso_front": RUIZ_TORSO_FRONT,
    "torso_back": check_rows("ruiz", [
        "...tTTTTTTTTt...",
        ".TTTttttttttTTT.",
        ".TtTTTTTTTTTTtT.",
        ".TtTTTTTTTTTTtT.",
        ".TtTTTTTTTTTTtT.",
        ".SttttttttttttS.",
        "...JJJJJJJJJJ...",
    ]),
    "torso_side": check_rows("ruiz", [
        ".....TTTTTT.....",
        "....TTTTTTTT....",
        "....TtTTTTTTT...",
        "....TtTTTTTTTT..",
        "....TtTTTTTTT...",
        "....tSttttttt...",
        ".....JJJJJJ.....",
    ]),
}
# Writing at the counter: looking down (the brim hides his eyes), hands on a receipt book.
RUIZ_WRITING_HEAD = check_rows("ruiz", [
    "....CCCCCCCC....",
    "...CCCCCCCCCC...",
    "...CCCCCCCCCC...",
    "..cccccccccccc..",
    "...HSGGSSGGSH...",
    "...HSSSSSSSSH...",
    "....SMMMMMMS....",
    ".....sSSSSs.....",
])
RUIZ_WRITING_TORSO = [
    check_rows("ruiz", [
        "...TTTTTTTTTT...",
        ".TTTTTTTTTTTTTT.",
        ".TtTTTTTTTTTTtT.",
        ".TtTTTTTTTTTTtT.",
        "..tTTTTTTTTTTt..",
        "...SWWWWWWWPS...",
        "...WwWwWwWwWW...",
    ]),
    check_rows("ruiz", [
        "...TTTTTTTTTT...",
        ".TTTTTTTTTTTTTT.",
        ".TtTTTTTTTTTTtT.",
        ".TtTTTTTTTTTTtT.",
        "..tTTTTTTTTTTt..",
        "...SWWWWWWPSW...",
        "...WwWwWwWwWW...",
    ]),
]

# Nando: 40s, navy coveralls (one colour head to boots), red bandana, dark mustache, black boots.
NANDO_PAL = {
    "R": (178, 42, 40), "r": (128, 28, 30),
    "H": (44, 34, 30), "h": (70, 56, 50),
    "S": (152, 100, 68), "s": (118, 76, 52), "E": (28, 20, 18), "M": (44, 34, 30),
    "T": (48, 60, 96), "t": (34, 42, 70), "Z": (150, 158, 178), "P": (222, 222, 214),
    "J": (48, 60, 96), "j": (34, 42, 70),
    "B": (34, 30, 32), "b": (22, 20, 22), "K": (230, 228, 222),
    "G": (204, 198, 186), "g": (150, 138, 118),
}
NANDO_HEAD_DOWN = check_rows("nando", [
    ".....RRRRRR.....",
    "....RRrRRRRR....",
    "...RRRRRRRRRR...",
    "...HHSSSSSSHH...",
    "...HSSSSSSSSH...",
    "...HSSESSESSH...",
    "....SMMMMMMS....",
    ".....sSSSSs.....",
    "......ssss......",
])
NANDO = {
    "pal": NANDO_PAL, "legs": 5, "bob": 1,
    "head_down": NANDO_HEAD_DOWN,
    "head_up": check_rows("nando", [
        ".....RRRRRR.....",
        "....RRRRRRRR....",
        "...RRRRRRRRRR...",
        "...RRRRrRRRRR...",
        "...HHHHrrHHHH...",
        "...HHHHHHHHHH...",
        "....HHHHHHHH....",
        ".....sSSSSs.....",
        "......ssss......",
    ]),
    "head_side": check_rows("nando", [
        ".....RRRRR......",
        "....RRRRRRR.....",
        "....RRRRRRRR....",
        "...rRHHHSSSS....",
        "...r.HHSSSSSS...",
        "....HHHSSSESS...",
        ".....HSSSMMMM...",
        "......sSSSs.....",
        ".......sss......",
    ]),
    "torso_front": check_rows("nando", [
        "....TTTTTTTT....",
        "..TTTTTZTTTTTT..",
        "..TtTPTZTTTTtT..",
        "..TtTTTZTTTTtT..",
        "..TtTTTZTTTTtT..",
        "..SttttZtttttS..",
        "....TTTTTTTT....",
    ]),
    "torso_back": check_rows("nando", [
        "....tTTTTTTt....",
        "..TTtttttttTTT..",
        "..TtTTTTTTTTtT..",
        "..TtTTTTTTTTtT..",
        "..TtTTTTTTTTtT..",
        "..SttttttttttS..",
        "....TTTTTTTT....",
    ]),
    "torso_side": check_rows("nando", [
        ".....TTTTTT.....",
        ".....TTTTTTT....",
        ".....TtTTTZT....",
        ".....TtTTTZT....",
        ".....TtTTTZT....",
        ".....tStttttt...",
        "......TTTTT.....",
    ]),
}
# Lying on his back on the creeper, seen from above: head toward the truck (up), boots toward us.
NANDO_LYING = check_rows("nando", [
    ".....RRRRRR.....",
    "....RRRRRRRR....",
    "....RRrRRRRR....",
    "....HSSSSSSH....",
    "....SSESSESS....",
    "....SMMMMMMS....",
    ".....sSSSSs.....",
    "...TTTTTTTTTT...",
    "..TTTTTZTTTTTT..",
    "..TtTPTZTTTTtT..",
    "..TtTTTZTTTTtT..",
    "..TtTTTZTTTTtT..",
    "..SttttZtttttS..",
    "....TTTTTTTT....",
    "....TTT..TTT....",
    "....TTt..tTT....",
    "....TTt..tTT....",
    "....TTt..tTT....",
    "....TTt..tTT....",
    "....TTt..tTT....",
    "....BBB..BBB....",
    "...BBBB..BBBB...",
])
NANDO_LEGS_FROM = 13  # NANDO_LYING rows from here down: hips to boots (under the truck, only these show)
# Standing, wiping his hands on a rag (2 frames).
NANDO_WIPING = [
    check_rows("nando", [
        "....TTTTTTTT....",
        "..TTTTTZTTTTTT..",
        "..TtTPTZTTTTtT..",
        "..TtTTTZTTTTtT..",
        "..TttTTZTTTttT..",
        "....tSGGGGSt....",
        "....TTGgGGTT....",
    ]),
    check_rows("nando", [
        "....TTTTTTTT....",
        "..TTTTTZTTTTTT..",
        "..TtTPTZTTTTtT..",
        "..TtTTTZTTTTtT..",
        "..TttTTZTTTttT..",
        "....tGGSGGSt....",
        "....TTGGgGTT....",
    ]),
]


def with_parts(ch, **parts):
    return {**ch, **parts}


def make_abuela():
    seated = seated_frame(ABUELA, ABUELA["head_down"], ABUELA["torso_front"])
    return char_sheet(ABUELA, [[seated]])


def make_tomi():
    """Rows 4-7: the walk again with his left shoe off (sock showing). Frame 0 of each row is standing."""
    rows = []
    bare = {d: [char_frame(d, f, TOMI, bare=True) for f in range(4)] for d in ("down", "up", "right")}
    bare["left"] = [fr.transpose(Image.FLIP_LEFT_RIGHT) for fr in bare["right"]]
    for d in ("down", "up", "right", "left"):
        rows.append(bare[d])
    return char_sheet(TOMI, rows)


def make_ruiz():
    writing = [seated_frame(RUIZ, RUIZ_WRITING_HEAD, t) for t in RUIZ_WRITING_TORSO]
    return char_sheet(RUIZ, [writing])


def make_nando():
    lying = rows_frame(NANDO, NANDO_LYING, bottom=29)
    legs_rows = ["." * FW] * NANDO_LEGS_FROM + NANDO_LYING[NANDO_LEGS_FROM:]
    legs = rows_frame(NANDO, legs_rows, bottom=29)
    wiping = [char_frame("down", 0, with_parts(NANDO, torso_front=t)) for t in NANDO_WIPING]
    return char_sheet(NANDO, [[legs, lying] + wiping])


KCHAIR, KCHAIR_DK, KCHAIR_HI = (74, 124, 146), (52, 92, 110), (104, 156, 176)  # painted kitchen chairs


def make_mateo_extra():
    """32x32 frames: 0 lying on the couch (head left, eyes closed); 1 sitting at a table facing up, his
    back to us over the back of his chair (the frame's bottom is the chair's feet, on the floor)."""
    sheet = Image.new("RGBA", (64, 32), (0, 0, 0, 0))
    sleeping = {**MATEO, "head_down": [r.replace("E", "s") for r in HEAD_DOWN]}
    lying = make_frame("down", 0, sleeping).rotate(90, expand=True)   # 32x16: head on the left
    sheet.alpha_composite(lying, (0, 16))
    CUR["pal"] = PAL
    sit = Image.new("RGBA", (FW, FH), (0, 0, 0, 0))
    px = sit.load()
    blit_rows(px, HEAD_UP, 6)
    blit_rows(px, TORSO_BACK, 15)
    outline(sit)
    chair = Image.new("RGBA", (FW, FH), (0, 0, 0, 0))
    draw_chair_back(chair.load(), oy=16)
    outline(chair)
    sit.alpha_composite(chair)
    sheet.alpha_composite(sit, (32 + 8, 0))
    return sheet


# ---------------- Mission 1: apartment tiles and props ----------------
APT_PAINT, APT_PAINT_DK, APT_PAINT_HI = (178, 196, 170), (152, 170, 146), (198, 212, 190)  # sage green
APT_BASE, APT_BASE_DK, APT_BASE_HI = (112, 82, 62), (84, 60, 46), (140, 106, 82)
LINO, LINO_PRINT, LINO_DK, LINO_HI = (198, 184, 150), (188, 174, 140), (168, 154, 122), (214, 202, 174)
CERAMIC, CERAMIC_DK, GROUT = (176, 170, 160), (164, 158, 148), (140, 134, 126)
FRIDGE, FRIDGE_DK, FRIDGE_HI = (230, 230, 224), (200, 200, 194), (244, 244, 240)
COUCH, COUCH_DK, COUCH_HI, COUCH_WORN = (150, 98, 66), (116, 72, 48), (176, 124, 88), (186, 146, 112)


def wall_face(paint, dk, hi, base, base_dk, base_hi, speckles=0):
    """A wall face in the restaurant's structure: paint, shading above a baseboard."""
    img = solid(paint)
    d = img.load()
    fill(d, 0, 10, 15, 11, dk)
    fill(d, 0, 0, 15, 0, hi)
    fill(d, 0, 12, 15, 12, base_hi)
    fill(d, 0, 13, 15, 14, base)
    fill(d, 0, 15, 15, 15, base_dk)
    for _ in range(speckles):
        d[mrng.randrange(T), mrng.randrange(10)] = mrng.choice([dk, hi]) + (255,)
    return img


def side_wall_left(cap, shades):
    """Top edge of a left wall seen from above (same rules as the restaurant's)."""
    img = solid(cap)
    d = img.load()
    fill(d, 0, 0, 0, 15, OUT)
    for i, c in enumerate(shades):
        fill(d, T - len(shades) + i, 0, T - len(shades) + i, 15, c)
    return img


def wall_set(face_plain, cap, shades):
    """Side walls and corners for one wall colour, as in the restaurant (indexes: see the README)."""
    side = side_wall_left(cap, shades)
    top_left = face_plain.copy()
    top_left.paste(side.crop((0, 0, 12, T)), (0, 0))
    bottom_left = face_plain.copy()
    bottom_left.paste(side.crop((0, 0, T, 10)), (0, 0))
    fill(bottom_left.load(), 0, 10, 0, 15, OUT)
    return {
        "wall_side_left": side, "wall_side_right": flip(side),
        "wall_corner_top_left": top_left, "wall_corner_top_right": flip(top_left),
        "wall_corner_bottom_left": bottom_left, "wall_corner_bottom_right": flip(bottom_left),
    }


def on_face(face, draw_fn):
    """Draw something on a transparent layer, outline it, and put it on a copy of a wall face."""
    layer = Image.new("RGBA", (T, T), (0, 0, 0, 0))
    draw_fn(layer.load())
    outline(layer)
    img = face.copy()
    img.alpha_composite(layer)
    return img


def prop_tall_on(floor, draw_fn):
    """A prop two tiles tall: drawn and outlined as one piece, returned as (top, bottom) tiles."""
    layer = Image.new("RGBA", (T, T * 2), (0, 0, 0, 0))
    draw_fn(layer.load())
    outline(layer)
    out = Image.new("RGBA", (T, T * 2))
    out.paste(floor, (0, 0))
    out.paste(floor, (0, T))
    out.alpha_composite(layer)
    return out.crop((0, 0, T, T)), out.crop((0, T, T, T * 2))


def prop2_on(floor, draw_fn):
    """A prop two tiles wide: drawn and outlined as one piece, returned as (left, right) tiles."""
    layer = Image.new("RGBA", (T * 2, T), (0, 0, 0, 0))
    draw_fn(layer.load())
    outline(layer)
    out = Image.new("RGBA", (T * 2, T))
    out.paste(floor, (0, 0))
    out.paste(floor, (T, 0))
    out.alpha_composite(layer)
    return out.crop((0, 0, T, T)), out.crop((T, 0, T * 2, T))


def tile_linoleum(worn=False):
    img = solid(LINO)
    d = img.load()
    for y in range(T):
        for x in range(T):
            if ((x // 4) + (y // 4)) % 2:
                d[x, y] = LINO_PRINT + (255,)            # faded printed checker
    if worn:  # worn through in front of the stove: the print is gone in a soft patch
        for y in range(T):
            for x in range(T):
                if ((x - 8) ** 2) / 30 + ((y - 7) ** 2) / 14 < 1:
                    d[x, y] = LINO_HI + (255,)
    for _ in range(4):
        d[mrng.randrange(T), mrng.randrange(T)] = LINO_DK + (255,)   # scuffs
    return img


def tile_ceramic():
    img = solid(CERAMIC)
    d = img.load()
    for y in range(9, 16):
        for x in range(9, 16):
            d[x, y] = CERAMIC_DK + (255,)
    for y in range(1, 8):
        for x in range(1, 8):
            d[x, y] = CERAMIC_DK + (255,)
    for i in range(T):
        for p in ((i, 0), (i, 8), (0, i), (8, i)):
            d[p] = GROUT + (255,)
    for _ in range(4):
        x, y = mrng.randrange(1, T), mrng.randrange(1, T)
        if d[x, y][:3] != GROUT:
            d[x, y] = (186, 180, 170, 255)
    return img


def apt_face():
    return wall_face(APT_PAINT, APT_PAINT_DK, APT_PAINT_HI, APT_BASE, APT_BASE_DK, APT_BASE_HI)


def tile_apt_wall():
    return wall_face(APT_PAINT, APT_PAINT_DK, APT_PAINT_HI, APT_BASE, APT_BASE_DK, APT_BASE_HI, speckles=8)


def tile_apt_window():
    """Window in morning light: warm sky, sheer curtains drawn to the sides."""
    img = apt_face()
    d = img.load()
    fill(d, 2, 1, 13, 10, OUT)
    fill(d, 3, 2, 12, 9, (234, 236, 236))                # painted frame
    fill(d, 4, 3, 11, 8, (250, 222, 150))                # morning sky
    fill(d, 4, 3, 11, 4, (252, 238, 194))
    fill(d, 7, 3, 8, 8, (234, 236, 236))                 # mullion
    fill(d, 4, 6, 11, 6, (234, 236, 236))
    fill(d, 3, 2, 4, 9, (240, 236, 222))                 # curtains
    fill(d, 11, 2, 12, 9, (240, 236, 222))
    dots(d, [(4, 4), (4, 7), (11, 3), (11, 8)], (220, 214, 198))
    fill(d, 2, 10, 13, 10, (226, 224, 216))              # sill
    fill(d, 2, 11, 13, 11, APT_PAINT_DK)
    return img


def tile_apt_photo():
    """Framed photo on the wall: a couple at a wedding, a baby in her arms (tiny)."""
    def draw(px):
        fill(px, 4, 2, 11, 9, (92, 62, 42))              # frame
        fill(px, 5, 3, 10, 8, (198, 176, 138))           # sepia picture
        dots(px, [(6, 4), (9, 4)], (60, 44, 40))         # heads
        fill(px, 6, 5, 6, 7, (242, 238, 230))            # her white dress
        dots(px, [(7, 5)], (226, 188, 170))              # the baby
        fill(px, 9, 5, 9, 7, (52, 52, 62))               # his dark suit
        dots(px, [(4, 2), (11, 9)], (120, 86, 60))
    return on_face(apt_face(), draw)


def draw_hallway(px):
    fill(px, 2, 0, 13, 15, (112, 80, 54))                # door frame
    fill(px, 3, 1, 12, 15, (46, 40, 40))                 # dark hallway beyond
    fill(px, 3, 1, 12, 3, (34, 30, 30))
    fill(px, 3, 12, 12, 15, (82, 72, 64))                # hallway floor in the light from the room
    fill(px, 2, 0, 13, 0, (138, 104, 76))


def draw_apt_door(px):
    fill(px, 2, 1, 13, 15, (128, 70, 50))                # painted wooden door
    fill(px, 2, 1, 13, 1, (156, 94, 70))
    fill(px, 4, 3, 11, 7, (110, 58, 42))                 # panels
    fill(px, 4, 9, 11, 14, (110, 58, 42))
    fill(px, 4, 3, 11, 3, (96, 50, 36))
    fill(px, 4, 9, 11, 9, (96, 50, 36))
    fill(px, 7, 2, 8, 2, (40, 36, 36))                   # peephole
    dots(px, [(11, 8)], (226, 196, 96))                  # knob
    dots(px, [(11, 6)], (190, 190, 196))                 # deadbolt
    dots(px, [(3, 4), (3, 12)], (90, 70, 60))            # hinges


def draw_fridge_top(px):
    """Upper part of the fridge, drawn over the wall face (it stands against the wall)."""
    fill(px, 1, 1, 14, 15, FRIDGE)
    fill(px, 1, 1, 14, 2, FRIDGE_HI)                     # top surface
    fill(px, 14, 3, 14, 15, FRIDGE_DK)
    fill(px, 1, 10, 14, 10, FRIDGE_DK)                   # freezer door seam
    fill(px, 12, 4, 12, 8, (170, 170, 166))              # freezer handle
    dots(px, [(4, 6)], (60, 140, 200))                   # magnet
    dots(px, [(7, 4), (8, 4)], (210, 80, 60))


def draw_fridge_bottom(px):
    """Lower door, on the floor row: past-due notices held up with magnets."""
    fill(px, 1, 0, 14, 13, FRIDGE)
    fill(px, 14, 0, 14, 13, FRIDGE_DK)
    fill(px, 12, 1, 12, 6, (170, 170, 166))              # handle
    fill(px, 1, 13, 14, 14, (90, 90, 92))                # kick plate
    fill(px, 4, 3, 9, 9, (214, 212, 200))                # the notice underneath
    fill(px, 3, 2, 8, 8, (244, 242, 232))                # the top notice
    fill(px, 4, 4, 7, 4, (170, 168, 160))                # print lines
    fill(px, 4, 6, 6, 6, (170, 168, 160))
    fill(px, 5, 5, 7, 5, (196, 44, 40))                  # PAST DUE, stamped in red
    dots(px, [(5, 2)], (60, 140, 200))                   # magnet
    dots(px, [(9, 10)], (230, 190, 60))


def tile_apt_counter():
    img = solid((96, 128, 150))
    d = img.load()
    fill(d, 0, 0, 15, 0, OUT)
    fill(d, 0, 1, 15, 7, (230, 226, 214))                # tiled worktop
    for x in (3, 7, 11, 15):
        fill(d, x, 1, x, 7, (184, 192, 198))
    fill(d, 0, 4, 15, 4, (184, 192, 198))
    dots(d, [(1, 2), (5, 6), (9, 2), (13, 6)], (64, 96, 170))   # blue Talavera tiles
    fill(d, 0, 8, 15, 8, (118, 114, 106))                # front edge
    fill(d, 0, 9, 15, 14, (96, 128, 150))                # painted cabinets
    fill(d, 1, 10, 6, 13, (82, 110, 132))
    fill(d, 9, 10, 14, 13, (82, 110, 132))
    dots(d, [(6, 11), (9, 11)], (210, 200, 170))
    fill(d, 0, 15, 15, 15, OUT)
    return img


def draw_apt_stove(px):
    """Small white enamel stove; a pan of eggs on the front-left burner."""
    fill(px, 1, 1, 14, 14, (226, 222, 212))
    fill(px, 1, 1, 14, 9, (120, 118, 116))               # cooktop
    fill(px, 1, 1, 14, 1, (240, 238, 230))
    for cx in (4, 11):
        for cy in (3, 7):
            fill(px, cx - 1, cy - 1, cx + 1, cy + 1, (52, 50, 52))
            px[cx, cy] = (30, 28, 30, 255)
    fill(px, 2, 5, 7, 9, (44, 44, 48))                   # the pan
    fill(px, 3, 6, 6, 8, (238, 204, 76))                 # eggs
    dots(px, [(3, 6), (6, 8)], (246, 242, 226))
    dots(px, [(5, 7)], (200, 60, 40))
    fill(px, 8, 7, 10, 7, (44, 44, 48))                  # handle
    fill(px, 1, 10, 14, 10, (196, 192, 184))
    fill(px, 3, 12, 12, 13, (70, 66, 64))                # oven window
    fill(px, 3, 11, 12, 11, (204, 204, 208))             # handle
    dots(px, [(3, 10), (6, 10), (9, 10), (12, 10)], (60, 58, 60))


def draw_kitchen_table(px):
    """16 wide, 32 deep: a small table for two (one at each end) under a red gingham oilcloth."""
    for y in range(2, 26):
        for x in range(1, 15):
            px[x, y] = ((196, 66, 58) if ((x // 2) + (y // 2)) % 2 == 0 else (238, 232, 220)) + (255,)
    fill(px, 1, 2, 14, 2, (244, 238, 228))
    for x in range(1, 15):                                  # the cloth hanging over the front edge
        px[x, 26] = ((168, 52, 46) if (x // 2) % 2 == 0 else (212, 204, 192)) + (255,)
        px[x, 27] = ((150, 44, 40) if (x // 2) % 2 == 0 else (190, 182, 170)) + (255,)
    fill(px, 2, 28, 3, 30, WOOD_DK)                         # legs
    fill(px, 12, 28, 13, 30, WOOD_DK)


def draw_kitchen_chair(px):
    """Facing down (backrest at the top), like the restaurant chair, painted blue."""
    fill(px, 4, 1, 11, 6, KCHAIR_DK)
    fill(px, 5, 2, 6, 5, KCHAIR)
    fill(px, 9, 2, 10, 5, KCHAIR)
    fill(px, 7, 2, 8, 5, (64, 108, 128))
    fill(px, 4, 1, 11, 1, KCHAIR_HI)
    fill(px, 3, 7, 12, 10, KCHAIR_HI)
    fill(px, 3, 10, 12, 11, KCHAIR_DK)
    fill(px, 4, 12, 5, 14, KCHAIR_DK)
    fill(px, 10, 12, 11, 14, KCHAIR_DK)


def draw_chair_back(px, oy=0):
    """Facing up (away from us): the back of the backrest, the seat's edges peeking out at the sides."""
    fill(px, 3, oy + 6, 3, oy + 9, KCHAIR_HI)
    fill(px, 12, oy + 6, 12, oy + 9, KCHAIR_HI)
    fill(px, 4, oy + 1, 11, oy + 9, KCHAIR_DK)
    fill(px, 5, oy + 2, 10, oy + 8, KCHAIR)
    fill(px, 4, oy + 1, 11, oy + 1, KCHAIR_HI)
    fill(px, 4, oy + 10, 5, oy + 14, KCHAIR_DK)
    fill(px, 10, oy + 10, 11, oy + 14, KCHAIR_DK)


def draw_couch(px):
    """32 wide: a worn couch facing down. Faded cushions, a split seam on the backrest."""
    fill(px, 1, 1, 30, 6, COUCH_DK)                      # backrest
    fill(px, 1, 1, 30, 1, COUCH)
    fill(px, 1, 2, 3, 13, COUCH)                         # arms
    fill(px, 28, 2, 30, 13, COUCH)
    fill(px, 1, 2, 3, 2, COUCH_HI)
    fill(px, 28, 2, 30, 2, COUCH_HI)
    fill(px, 4, 7, 27, 11, COUCH_HI)                     # seat cushions
    fill(px, 15, 7, 16, 11, COUCH_DK)
    fill(px, 4, 12, 27, 13, COUCH_DK)                    # seat front
    fill(px, 7, 8, 9, 9, COUCH_WORN)                     # worn patches
    fill(px, 21, 9, 24, 10, COUCH_WORN)
    dots(px, [(20, 3), (21, 3), (21, 4)], (226, 214, 184))   # stuffing showing through a split seam
    fill(px, 2, 14, 3, 14, (60, 40, 30))                 # feet
    fill(px, 28, 14, 29, 14, (60, 40, 30))


APARTMENT_ORDER = ["linoleum", "linoleum_worn", "ceramic", "wall", "wall_window",
                   "wall_side_left", "wall_side_right", "wall_corner_top_left", "wall_corner_top_right",
                   "wall_corner_bottom_left", "wall_corner_bottom_right",
                   "counter", "stove", "fridge_top", "fridge", "table_top", "table_bottom",
                   "chair", "chair_back", "couch_left", "couch_right", "hallway", "front_door", "photo"]


def make_apartment_tiles():
    lino, ceramic = tile_linoleum(), tile_ceramic()
    apt_cap_shades = [APT_PAINT, APT_PAINT_DK, (134, 150, 128), (118, 132, 112), (104, 116, 98)]
    table_t, table_b = prop_tall_on(lino, draw_kitchen_table)
    couch_l, couch_r = prop2_on(ceramic, draw_couch)
    tiles = {
        "linoleum": lino, "linoleum_worn": tile_linoleum(worn=True), "ceramic": ceramic,
        "wall": tile_apt_wall(), "wall_window": tile_apt_window(),
        **wall_set(apt_face(), APT_PAINT_HI, apt_cap_shades),
        "counter": tile_apt_counter(), "stove": prop_on(lino, draw_apt_stove),
        "fridge_top": on_face(apt_face(), draw_fridge_top), "fridge": prop_on(lino, draw_fridge_bottom),
        "table_top": table_t, "table_bottom": table_b,
        "chair": prop_on(lino, draw_kitchen_chair), "chair_back": prop_on(lino, draw_chair_back),
        "couch_left": couch_l, "couch_right": couch_r,
        "hallway": on_face(apt_face(), draw_hallway), "front_door": on_face(apt_face(), draw_apt_door),
        "photo": tile_apt_photo(),
    }
    sheet = Image.new("RGBA", (T * len(APARTMENT_ORDER), T))
    for i, k in enumerate(APARTMENT_ORDER):
        sheet.paste(tiles[k], (i * T, 0))
    return sheet, tiles


PROP_ORDER = ["pill_bottle", "plate_eggs", "backpack", "jacket_on_chair"]


def draw_pill_bottle(px):
    fill(px, 6, 8, 9, 13, (196, 122, 40))                # amber bottle
    fill(px, 6, 8, 6, 13, (224, 160, 70))
    fill(px, 6, 10, 9, 11, (238, 234, 222))              # label
    fill(px, 6, 6, 9, 7, (244, 244, 240))                # white cap


def draw_plate_eggs(px):
    fill(px, 3, 8, 12, 12, (236, 236, 230))              # plate
    fill(px, 4, 7, 11, 7, (236, 236, 230))
    fill(px, 4, 13, 11, 13, (200, 200, 196))
    fill(px, 5, 8, 10, 11, (238, 202, 72))               # eggs
    dots(px, [(6, 9), (9, 10)], (200, 60, 40))           # tomato
    dots(px, [(8, 8), (5, 10)], (90, 150, 70))           # chile
    dots(px, [(10, 9)], (250, 236, 170))


def draw_backpack(px):
    """Tomi's backpack, sitting on the floor. One strap is held on with silver tape."""
    fill(px, 5, 1, 10, 3, (36, 48, 86))                  # carry loop / straps over the top
    fill(px, 7, 2, 8, 3, (0, 0, 0, 0))
    fill(px, 9, 1, 10, 2, (196, 198, 204))               # the taped strap
    fill(px, 4, 4, 11, 14, (52, 72, 128))                # body
    fill(px, 4, 4, 11, 4, (78, 100, 156))
    fill(px, 5, 9, 10, 13, (40, 56, 104))                # front pocket
    fill(px, 5, 9, 10, 9, (176, 180, 190))               # zipper
    dots(px, [(10, 10)], (210, 210, 216))


def draw_jacket_on_chair(px):
    """His work jacket hung over the back of a chair (drawn to sit on the 'chair' tile)."""
    fill(px, 3, 1, 12, 6, (92, 72, 54))                  # over the backrest
    fill(px, 3, 1, 12, 1, (122, 98, 74))                 # collar
    fill(px, 2, 3, 3, 10, (78, 60, 44))                  # sleeves hanging down
    fill(px, 12, 3, 13, 10, (78, 60, 44))
    fill(px, 7, 2, 8, 6, (70, 54, 40))                   # front opening
    dots(px, [(5, 4), (10, 3), (4, 8)], (52, 46, 44))    # soot


def make_apartment_props():
    sheet = Image.new("RGBA", (T * len(PROP_ORDER), T), (0, 0, 0, 0))
    for i, fn in enumerate((draw_pill_bottle, draw_plate_eggs, draw_backpack, draw_jacket_on_chair)):
        layer = Image.new("RGBA", (T, T), (0, 0, 0, 0))
        fn(layer.load())
        outline(layer)
        sheet.paste(layer, (i * T, 0))
    return sheet


# ---------------- Mission 1: tire shop tiles, truck, creeper ----------------
CONC, CONC_DK, CONC_HI = (156, 154, 146), (138, 136, 130), (170, 168, 160)
OIL, OIL_DK = (108, 106, 104), (84, 82, 82)
SHOP_PAINT, SHOP_PAINT_DK, SHOP_PAINT_HI = (206, 200, 184), (184, 178, 164), (220, 216, 202)
SHOP_RED = (176, 58, 46)
SHOP_BASE, SHOP_BASE_DK, SHOP_BASE_HI = (92, 90, 88), (70, 68, 66), (116, 114, 110)
ALU, ALU_DK, ALU_HI = (176, 180, 186), (132, 136, 144), (210, 214, 218)
TIRE, TIRE_DK, TIRE_HI = (44, 42, 44), (24, 22, 24), (74, 72, 74)


def tile_concrete(oil=False):
    img = solid(CONC)
    d = img.load()
    for _ in range(16):
        d[mrng.randrange(T), mrng.randrange(T)] = mrng.choice([CONC_DK, CONC_HI]) + (255,)
    if oil:  # an old oil stain
        for y in range(T):
            for x in range(T):
                r = ((x - 7) ** 2) / 26 + ((y - 9) ** 2) / 12
                if r < 0.55:
                    d[x, y] = OIL_DK + (255,)
                elif r < 1:
                    d[x, y] = OIL + (255,)
        dots(d, [(12, 4), (13, 5)], OIL)
    return img


def shop_face(speckles=0):
    """Painted cinder block with a red stripe above the baseboard."""
    img = solid(SHOP_PAINT)
    d = img.load()
    for y in (2, 6):
        fill(d, 0, y, 15, y, SHOP_PAINT_DK)
    for x0, y0, y1 in ((3, 0, 1), (11, 0, 1), (7, 3, 5), (15, 3, 5), (3, 7, 8), (11, 7, 8)):
        fill(d, x0, y0, x0, y1, SHOP_PAINT_DK)
    fill(d, 0, 0, 15, 0, SHOP_PAINT_HI)
    fill(d, 0, 9, 15, 10, SHOP_RED)
    fill(d, 0, 11, 15, 11, SHOP_PAINT_DK)
    fill(d, 0, 12, 15, 12, SHOP_BASE_HI)
    fill(d, 0, 13, 15, 14, SHOP_BASE)
    fill(d, 0, 15, 15, 15, SHOP_BASE_DK)
    for _ in range(speckles):
        d[mrng.randrange(T), mrng.randrange(9)] = mrng.choice([SHOP_PAINT_DK, SHOP_PAINT_HI]) + (255,)
    return img


def draw_tire_stack(px):
    """Three tires stacked, seen from above at an angle: the top tire's ring and hole, then each
    tire's rounded side as a band."""
    for top in (6, 9, 12):
        fill(px, 3, top, 12, top + 2, TIRE)
        fill(px, 2, top + 1, 13, top + 2, TIRE)
        fill(px, 3, top, 12, top, (62, 60, 62))          # each tire's upper shoulder catches the light
        fill(px, 2, top + 2, 13, top + 2, TIRE_DK)
    fill(px, 4, 1, 11, 1, TIRE_HI)                       # top tire, seen from above
    fill(px, 3, 2, 12, 2, TIRE)
    fill(px, 2, 3, 13, 5, TIRE)
    fill(px, 3, 6, 12, 6, TIRE)
    fill(px, 5, 2, 10, 5, (68, 66, 68))                  # inner rim
    fill(px, 6, 3, 9, 4, (16, 14, 16))                   # hole


def draw_compressor(px):
    fill(px, 2, 8, 13, 13, (190, 50, 40))                # tank
    fill(px, 1, 9, 14, 12, (190, 50, 40))
    fill(px, 2, 8, 13, 8, (224, 96, 74))
    fill(px, 2, 13, 13, 13, (140, 34, 28))
    fill(px, 4, 3, 10, 7, (90, 94, 100))                 # motor
    fill(px, 4, 3, 10, 3, (124, 128, 134))
    fill(px, 11, 4, 12, 7, (70, 72, 78))                 # belt guard
    dots(px, [(6, 5)], (236, 236, 230))                  # gauge
    fill(px, 2, 14, 3, 15, (30, 28, 30))                 # wheels
    fill(px, 12, 14, 13, 15, (30, 28, 30))
    dots(px, [(14, 6), (15, 7), (14, 8), (13, 7)], (220, 190, 60))   # coiled yellow hose


def draw_workbench(px, drawer):
    fill(px, 0, 2, 15, 8, (150, 110, 70))                # wooden top
    fill(px, 0, 2, 15, 2, (176, 134, 90))
    fill(px, 0, 8, 15, 8, (110, 80, 50))
    fill(px, 0, 9, 15, 14, (92, 92, 96))                 # steel front
    fill(px, 0, 9, 15, 9, (120, 120, 126))
    if drawer:
        fill(px, 2, 10, 13, 13, (110, 110, 116))
        fill(px, 2, 10, 13, 10, (136, 136, 142))
        fill(px, 6, 12, 9, 12, (200, 200, 206))          # handle
        fill(px, 3, 4, 7, 4, (170, 174, 180))            # a wrench on the top
        dots(px, [(3, 3), (7, 5)], (170, 174, 180))
        dots(px, [(11, 5), (12, 5)], (200, 60, 40))      # rag
    else:
        fill(px, 4, 3, 9, 6, (80, 86, 96))               # vise
        fill(px, 5, 2, 8, 2, (110, 116, 126))
        fill(px, 10, 4, 12, 4, (180, 180, 186))
        dots(px, [(13, 6), (14, 6)], (220, 180, 50))     # screwdriver handle


def tile_shop_counter():
    img = solid((164, 48, 40))
    d = img.load()
    fill(d, 0, 0, 15, 0, OUT)
    fill(d, 0, 1, 15, 7, (190, 186, 176))                # laminate top
    fill(d, 0, 1, 15, 1, (214, 210, 200))
    dots(d, [(3, 4), (11, 3), (12, 6)], (172, 168, 158))
    fill(d, 0, 8, 15, 8, (100, 98, 94))                  # metal edge
    fill(d, 0, 9, 15, 14, (164, 48, 40))                 # red front panel
    fill(d, 0, 9, 15, 9, (190, 70, 58))
    fill(d, 7, 10, 8, 14, (140, 38, 32))
    fill(d, 0, 15, 15, 15, OUT)
    return img


def tile_shop_counter_end_left():
    """Square end of the counter on its right side (faces the open floor)."""
    img = tile_concrete()
    d = img.load()
    body = tile_shop_counter().load()
    for y in range(T):
        for x in range(14):
            d[x, y] = body[x, y]
    fill(d, 14, 0, 14, 15, OUT)
    fill(d, 12, 9, 13, 14, (140, 38, 32))                # end panel in shade
    return img


def draw_office_glass(px, door):
    fill(px, 0, 0, 15, 15, ALU)                          # aluminium frame
    fill(px, 1, 1, 14, 11, (150, 178, 192))              # glass
    for y in (3, 5, 7, 9):
        fill(px, 1, y, 14, y, (196, 206, 212))           # blinds inside
    fill(px, 2, 1, 3, 4, (210, 228, 234))                # glare
    fill(px, 0, 12, 15, 15, ALU_DK)                      # kick panel
    fill(px, 0, 12, 15, 12, ALU_HI)
    if door:
        fill(px, 0, 0, 0, 15, ALU_DK)
        fill(px, 15, 0, 15, 15, ALU_DK)
        fill(px, 12, 6, 12, 9, (226, 228, 232))          # handle


def tile_office_corner():
    """The office's front face ending: an aluminium post, open shop floor to its right."""
    img = tile_concrete()
    d = img.load()
    fill(d, 0, 0, 3, 15, ALU)
    fill(d, 0, 0, 3, 0, ALU_HI)
    fill(d, 3, 0, 3, 15, ALU_DK)
    fill(d, 4, 0, 4, 15, OUT)
    return img


def tile_office_side():
    """The office's glass side wall seen from above: a thin aluminium cap, shop floor to its right."""
    img = tile_concrete()
    d = img.load()
    fill(d, 0, 0, 3, 15, (160, 186, 198))
    fill(d, 0, 0, 0, 15, ALU)
    fill(d, 3, 0, 3, 15, ALU_DK)
    fill(d, 4, 0, 4, 15, OUT)
    return img


def tile_office_floor():
    img = solid((116, 122, 136))
    d = img.load()
    for _ in range(26):
        d[mrng.randrange(T), mrng.randrange(T)] = mrng.choice([(104, 110, 124), (130, 136, 150)]) + (255,)
    return img


def tile_garage_open(side):
    """The roll-up door, rolled up: the drum along the top, bright street light below.
    side: 'left' / 'right' (track on that edge) or None for a middle piece."""
    img = solid((232, 226, 206))
    d = img.load()
    fill(d, 0, 0, 15, 3, (124, 128, 134))                # rolled-up door
    fill(d, 0, 1, 15, 1, (150, 154, 160))
    fill(d, 0, 3, 15, 3, (96, 100, 106))
    fill(d, 0, 4, 15, 4, (196, 190, 172))
    fill(d, 0, 12, 15, 15, (210, 204, 186))              # sidewalk outside
    fill(d, 0, 12, 15, 12, (188, 182, 166))
    if side:
        x = 0 if side == "left" else 15
        fill(d, x, 0, x, 15, (90, 94, 100))              # door track
    return img


def tile_garage_closed():
    img = solid((150, 154, 160))
    d = img.load()
    for y in range(1, 16, 2):
        fill(d, 0, y, 15, y, (124, 128, 134))            # corrugation
    fill(d, 0, 0, 15, 0, (96, 100, 106))
    fill(d, 0, 15, 15, 15, (90, 94, 100))
    return img


def tile_shop_window():
    """Front window with a cardboard sign taped inside: HELP WANTED / SE BUSCA AYUDANTE."""
    img = shop_face()
    d = img.load()
    fill(d, 1, 1, 14, 11, ALU_DK)
    fill(d, 2, 2, 13, 10, (176, 204, 214))               # glass, daylight
    fill(d, 2, 2, 4, 3, (220, 236, 240))
    fill(d, 4, 3, 11, 8, (178, 142, 98))                 # cardboard
    fill(d, 5, 4, 10, 4, (70, 50, 36))                   # two lines of marker
    fill(d, 5, 6, 9, 6, (70, 50, 36))
    dots(d, [(4, 3), (11, 3), (4, 8), (11, 8)], (224, 218, 196))   # tape
    return img


def tile_tool_wall():
    """Pegboard on the wall face, with tools hanging on it."""
    img = shop_face()
    d = img.load()
    fill(d, 1, 0, 14, 10, (196, 164, 116))
    for y in range(1, 10, 2):
        for x in range(2, 14, 2):
            d[x, y] = (160, 128, 88, 255)
    fill(d, 3, 2, 3, 7, (170, 174, 180))                 # wrench
    fill(d, 2, 2, 4, 2, (170, 174, 180))
    fill(d, 7, 2, 9, 3, (120, 124, 130))                 # hammer head
    fill(d, 8, 4, 8, 8, (180, 50, 40))                   # handle
    fill(d, 12, 2, 12, 5, (200, 200, 206))               # screwdriver
    fill(d, 12, 6, 12, 8, (220, 180, 50))
    fill(d, 1, 10, 14, 10, (150, 120, 84))
    return img


TIRESHOP_ORDER = ["concrete", "concrete_oil", "wall",
                  "wall_side_left", "wall_side_right", "wall_corner_top_left", "wall_corner_top_right",
                  "wall_corner_bottom_left", "wall_corner_bottom_right",
                  "tire_stack", "compressor", "workbench", "workbench_drawer",
                  "counter", "counter_end_left", "counter_end_right",
                  "office_glass", "office_door", "office_corner", "office_side", "office_floor",
                  "garage_open_left", "garage_open", "garage_open_right", "garage_closed",
                  "shop_window", "tool_wall"]


def make_tireshop_tiles():
    conc = tile_concrete()
    shades = [SHOP_PAINT, SHOP_PAINT_DK, (166, 160, 146), (150, 144, 132), (134, 128, 118)]
    counter_end = tile_shop_counter_end_left()
    tiles = {
        "concrete": conc, "concrete_oil": tile_concrete(oil=True), "wall": shop_face(speckles=6),
        **wall_set(shop_face(), SHOP_PAINT_HI, shades),
        "tire_stack": prop_on(conc, draw_tire_stack), "compressor": prop_on(conc, draw_compressor),
        "workbench": prop_on(conc, lambda p: draw_workbench(p, False)),
        "workbench_drawer": prop_on(conc, lambda p: draw_workbench(p, True)),
        "counter": tile_shop_counter(), "counter_end_left": counter_end, "counter_end_right": flip(counter_end),
        "office_glass": on_face(shop_face(), lambda p: draw_office_glass(p, False)),
        "office_door": on_face(shop_face(), lambda p: draw_office_glass(p, True)),
        "office_corner": tile_office_corner(), "office_side": tile_office_side(),
        "office_floor": tile_office_floor(),
        "garage_open_left": tile_garage_open("left"), "garage_open": tile_garage_open(None),
        "garage_open_right": tile_garage_open("right"), "garage_closed": tile_garage_closed(),
        "shop_window": tile_shop_window(), "tool_wall": tile_tool_wall(),
    }
    sheet = Image.new("RGBA", (T * len(TIRESHOP_ORDER), T))
    for i, k in enumerate(TIRESHOP_ORDER):
        sheet.paste(tiles[k], (i * T, 0))
    return sheet, tiles


TRUCK_W, TRUCK_H = 48, 24


def make_pickup_truck():
    """An old pickup from the side (3/4 top-down), facing right: faded blue paint with rust, the bed
    behind the cab, plain steel wheels. Same construction as the sedan."""
    img = Image.new("RGBA", (TRUCK_W, TRUCK_H), (0, 0, 0, 0))
    px = img.load()
    body, body_dk, body_hi = (118, 148, 166), (88, 114, 132), (152, 180, 194)
    rust = (150, 92, 60)
    glass, glass_hi = (54, 66, 84), (110, 128, 150)
    fill(px, 28, 2, 40, 4, body_hi)                      # cab roof
    fill(px, 27, 5, 41, 9, glass)                        # cab window
    fill(px, 28, 5, 30, 6, glass_hi)
    fill(px, 34, 5, 34, 9, body_dk)                      # door pillar
    fill(px, 1, 8, 25, 9, body_hi)                       # bed rail (top edge of the bed)
    fill(px, 2, 6, 24, 7, (60, 62, 66))                  # inside of the bed, seen from above
    fill(px, 1, 10, 46, 17, body)                        # body side
    fill(px, 26, 10, 46, 10, body_hi)
    fill(px, 1, 17, 46, 17, body_dk)
    fill(px, 26, 6, 26, 16, body_dk)                     # gap between bed and cab
    fill(px, 35, 11, 35, 16, body_dk)                    # door seam
    fill(px, 37, 12, 39, 12, (200, 200, 196))            # door handle
    fill(px, 0, 14, 2, 16, (170, 172, 168))              # rear bumper
    fill(px, 45, 14, 47, 16, (170, 172, 168))            # front bumper
    fill(px, 0, 11, 1, 12, (190, 30, 30))                # tail light
    fill(px, 45, 11, 47, 12, (214, 210, 186))            # headlight
    dots(px, [(4, 15), (5, 16), (19, 16), (40, 16), (41, 15), (12, 11)], rust)
    for wx in (6, 34):                                   # wheels: plain steel rims
        fill(px, wx, 16, wx + 7, 22, (24, 22, 24))
        fill(px, wx + 2, 18, wx + 5, 20, (190, 190, 184))
        fill(px, wx + 3, 19, wx + 4, 19, (120, 120, 116))
    outline(img)
    return img


def make_creeper():
    """16x32 mechanic's creeper (wheeled board), lengthwise up the screen, padded headrest at the top.
    Lines up with Nando's lying frames (same frame size, same feet row); it shows around him, so he
    reads as lying on it."""
    img = Image.new("RGBA", (FW, FH), (0, 0, 0, 0))
    px = img.load()
    fill(px, 1, 3, 14, 27, (88, 52, 44))                 # board, a little wider than him
    fill(px, 2, 2, 13, 2, (118, 76, 64))                 # top edge, catching the light
    fill(px, 1, 3, 1, 27, (118, 76, 64))
    fill(px, 4, 4, 11, 7, (40, 36, 36))                  # headrest pad
    for x, y in ((0, 5), (15, 5), (0, 25), (15, 25)):    # casters
        fill(px, x, y, x, y + 1, (24, 22, 24))
    outline(img)
    return img


# ---------------- Mission 1 previews ----------------
def paste_layout(layout, key, tiles):
    img = Image.new("RGBA", (len(layout[0]) * T, len(layout) * T))
    for y, row in enumerate(layout):
        assert len(row) == len(layout[0]), (y, row)
        for x, ch in enumerate(row):
            img.paste(tiles[key[ch]], (x * T, y * T))
    return img


def feet(img, frame, x, y):
    """Put a 16x32 (or 32x32) frame on img with its feet (bottom centre) at x, y."""
    img.alpha_composite(frame, (x - frame.width // 2, y - frame.height))


def cell(sheet, col, row, w=FW, h=FH):
    return sheet.crop((col * w, row * h, col * w + w, row * h + h))


def make_apartment_preview(tiles, props, mateo_extra, abuela, tomi, mateo_frames):
    # < > top corners, [ ] bottom corners, l r side walls, w wall, n window, P photo, H hallway,
    # F fridge top, f fridge, c counter, s stove, k linoleum, K worn linoleum, e ceramic,
    # ^ v table (top, bottom), h chair, b chair (back to us), { } couch, D front door
    layout = [
        "<wnwwFwwwwPwwnwwwwHww>",
        "lccscfkkkkeeeee{}eeeer",
        "lkkKkkkkkkeeeeeeeeeeer",
        "lkkkkkkkkkeeeeeeeeeeer",
        "lkkkhkkkkkeeeeeeeeeeer",
        "lkkk^kkkkkeeeeeeeeeeer",
        "lkkkvkkkkkeeeeeeeeeeer",
        "lkkkbkkkkkeeeeeeeeeeer",
        "lkkkkkkkkkeeeeeeeeheer",
        "lkkkkkkkkkeeeeeeeeeeer",
        "[wwwwwwwwwwwwwwwDwwww]",
    ]
    key = {"<": "wall_corner_top_left", ">": "wall_corner_top_right", "[": "wall_corner_bottom_left",
           "]": "wall_corner_bottom_right", "l": "wall_side_left", "r": "wall_side_right", "w": "wall",
           "n": "wall_window", "P": "photo", "H": "hallway", "F": "fridge_top", "f": "fridge",
           "c": "counter", "s": "stove", "k": "linoleum", "K": "linoleum_worn", "e": "ceramic",
           "^": "table_top", "v": "table_bottom", "h": "chair", "b": "chair_back",
           "{": "couch_left", "}": "couch_right", "D": "front_door"}
    img = paste_layout(layout, key, tiles)
    prop = lambda i: props.crop((i * T, 0, i * T + T, T))  # noqa: E731
    img.alpha_composite(prop(3), (18 * T, 8 * T))                    # jacket over the chair by the door
    img.alpha_composite(prop(2), (17 * T, 9 * T))                    # Tomi's backpack
    img.alpha_composite(prop(1), (4 * T, 6 * T - 10))                # plate, in front of Mateo
    img.alpha_composite(prop(0), (4 * T, 5 * T - 2))                 # pill bottle, between them
    feet(img, cell(mateo_extra, 0, 0, 32, 32), 16 * T, 2 * T + 2)    # Mateo asleep on the couch
    feet(img, cell(abuela, 0, 1), 3 * T + 8, 3 * T)                  # Abuela at the stove, back to us
    feet(img, cell(abuela, 0, 4), 4 * T + 8, 5 * T + 3)              # ...and sitting at the table
    feet(img, cell(mateo_extra, 1, 0, 32, 32), 4 * T + 8, 8 * T)     # Mateo at the table
    feet(img, cell(tomi, 0, 5), 4 * T + 8, 9 * T)                    # Tomi behind him, one shoe off
    feet(img, cell(tomi, 0, 4), 18 * T + 8, 2 * T)                   # Tomi in the hallway doorway
    feet(img, cell(tomi, 1, 0), 12 * T, 6 * T)                       # Tomi walking (shoes on)
    feet(img, mateo_frames[("down", 0)], 14 * T, 6 * T)              # Mateo standing, for scale
    return img


def make_tireshop_preview(tiles, truck, creeper, ruiz, nando, mateo_frames):
    # o office floor, g office glass, d office door, C office corner, S office side, x concrete,
    # X oil stain, t tires, a compressor, B workbench, Y workbench with drawer, T tool wall,
    # c counter, ) counter end, L M R open garage door, Q closed garage door, n window with sign
    layout = [
        "<wwwwwwwwwwwwwwTTTwwww>",
        "looooSxxxxxxxxxBYxxxxar",
        "looooSxxxxxxxxxxxxxxxxr",
        "lgggdCxxxxxXxxxxxxxxttr",
        "lxxxxxxxxxxxxxxxxxxxxtr",
        "lxxxxxxxxxxxxxxxxxxxxxr",
        "lxxxxxxxxXxxxxxxxxxxxxr",
        "lxxxxxxxxxxxxxxxxxxxttr",
        "lxxxcc)xxxxxxxxxxxxxxxr",
        "lxxxxxxxxxxxxxxxxxxxxxr",
        "[wwnwwwwLMRwwwwwQQQwww]",
    ]
    key = {"<": "wall_corner_top_left", ">": "wall_corner_top_right", "[": "wall_corner_bottom_left",
           "]": "wall_corner_bottom_right", "l": "wall_side_left", "r": "wall_side_right", "w": "wall",
           "o": "office_floor", "g": "office_glass", "d": "office_door", "C": "office_corner",
           "S": "office_side", "x": "concrete", "X": "concrete_oil", "t": "tire_stack", "a": "compressor",
           "B": "workbench", "Y": "workbench_drawer", "T": "tool_wall", "c": "counter",
           ")": "counter_end_left", "L": "garage_open_left", "M": "garage_open",
           "R": "garage_open_right", "Q": "garage_closed", "n": "shop_window"}
    img = paste_layout(layout, key, tiles)
    # Nando under the truck: creeper and legs first, the truck over them.
    tx, ty = 9 * T, 3 * T + 4                                        # truck's top-left
    feet(img, creeper, tx + 24, ty + 32)
    feet(img, cell(nando, 0, 4), tx + 24, ty + 32)
    img.alpha_composite(truck, (tx, ty))
    feet(img, cell(nando, 2, 4), 13 * T, 6 * T)                      # Nando standing, wiping his hands
    feet(img, creeper, 15 * T, 6 * T + 2)
    feet(img, cell(nando, 1, 4), 15 * T, 6 * T + 2)                  # rolling out on the creeper
    feet(img, cell(ruiz, 0, 4), 4 * T + 8, 8 * T + 3)                # Sr. Ruiz writing at the counter
    feet(img, cell(ruiz, 0, 0), 7 * T + 8, 6 * T)                    # Sr. Ruiz walking
    feet(img, mateo_frames[("up", 0)], 9 * T + 8, 10 * T)                # Mateo coming in from the street
    return img


def make_lineup(sheets):
    """Everyone side by side at 1x, standing down/up/right, for checking they read as different people."""
    strip = Image.new("RGBA", (len(sheets) * (FW * 3 + 6) + 4, FH + 4), (150, 140, 124, 255))
    for i, sh in enumerate(sheets):
        for j, row in enumerate((0, 1, 2)):
            strip.alpha_composite(cell(sh, 0, row), (4 + i * (FW * 3 + 6) + j * FW, 2))
    return strip


def save_mission1(frames):
    apt_sheet, apt_tiles = make_apartment_tiles()
    apt_sheet.save(ASSET_DIR / "apartment_tiles.png")
    props = make_apartment_props()
    props.save(ASSET_DIR / "apartment_props.png")
    shop_sheet, shop_tiles = make_tireshop_tiles()
    shop_sheet.save(ASSET_DIR / "tireshop_tiles.png")
    truck = make_pickup_truck()
    truck.save(ASSET_DIR / "pickup_truck.png")
    creeper = make_creeper()
    creeper.save(ASSET_DIR / "creeper.png")
    abuela, _ = make_abuela()
    abuela.save(ASSET_DIR / "abuela_walk.png")
    tomi, _ = make_tomi()
    tomi.save(ASSET_DIR / "tomi_walk.png")
    ruiz, _ = make_ruiz()
    ruiz.save(ASSET_DIR / "ruiz_walk.png")
    nando, _ = make_nando()
    nando.save(ASSET_DIR / "nando_walk.png")
    mateo_extra = make_mateo_extra()
    mateo_extra.save(ASSET_DIR / "mateo_extra.png")

    for name, im in (("apartment_tiles", apt_sheet), ("tireshop_tiles", shop_sheet)):
        im.resize((im.width * 6, im.height * 6), Image.NEAREST).save(PREVIEW_DIR / f"{name}_6x.png")
    for name, im in (("apartment_props", props), ("pickup_truck", truck), ("creeper", creeper),
                     ("abuela_walk", abuela), ("tomi_walk", tomi), ("ruiz_walk", ruiz),
                     ("nando_walk", nando), ("mateo_extra", mateo_extra)):
        bg = Image.new("RGBA", im.size, (150, 140, 124, 255))
        bg.alpha_composite(im)
        bg.resize((im.width * 6, im.height * 6), Image.NEAREST).save(PREVIEW_DIR / f"{name}_6x.png")
    mateo_sheet = Image.open(ASSET_DIR / "mateo_walk.png")
    lineup = make_lineup([mateo_sheet, abuela, tomi, ruiz, nando])
    lineup.save(PREVIEW_DIR / "m1_lineup_1x.png")
    lineup.resize((lineup.width * 6, lineup.height * 6), Image.NEAREST).save(PREVIEW_DIR / "m1_lineup_6x.png")
    apt = make_apartment_preview(apt_tiles, props, mateo_extra, abuela, tomi, frames)
    apt.resize((apt.width * 4, apt.height * 4), Image.NEAREST).save(PREVIEW_DIR / "apartment_scene.png")
    shop = make_tireshop_preview(shop_tiles, truck, creeper, ruiz, nando, frames)
    shop.resize((shop.width * 4, shop.height * 4), Image.NEAREST).save(PREVIEW_DIR / "tireshop_scene.png")


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
    ledge = make_phone_ledge()
    ledge.save(ASSET_DIR / "phone_ledge.png")
    phone_ui = make_phone_ui()
    phone_ui.save(ASSET_DIR / "phone_ui.png")
    icon = make_phone_icon()
    icon.save(ASSET_DIR / "phone_icon.png")
    bg = Image.new("RGBA", icon.size, (150, 118, 84, 255))
    bg.alpha_composite(icon)
    bg.resize((bg.width * 6, bg.height * 6), Image.NEAREST).save(PREVIEW_DIR / "phone_icon_6x.png")
    bg = Image.new("RGBA", ledge.size)
    for f in range(2):
        bg.paste(rest_tiles["wall"], (f * T, 0))
    bg.alpha_composite(ledge)
    bg.resize((bg.width * 6, bg.height * 6), Image.NEAREST).save(PREVIEW_DIR / "phone_ledge_6x.png")
    bg = Image.new("RGBA", phone_ui.size, (150, 118, 84, 255))
    bg.alpha_composite(phone_ui)
    bg.resize((bg.width * 4, bg.height * 4), Image.NEAREST).save(PREVIEW_DIR / "phone_ui_4x.png")
    curb_sheet, curb_tiles = make_curb_tiles()
    curb_sheet.save(ASSET_DIR / "curb_tiles.png")
    light = make_streetlight()
    light.save(ASSET_DIR / "streetlight.png")
    pool = make_light_pool()
    pool.save(ASSET_DIR / "light_pool.png")
    sedan = make_sedan()
    sedan.save(ASSET_DIR / "sedan.png")
    aurelio_sheet, aurelio_frames = make_sheet(AURELIO)
    aurelio_sheet.save(ASSET_DIR / "aurelio_walk.png")
    sitting = make_sitting()
    sitting.save(ASSET_DIR / "sitting.png")
    for name, im, k in (("curb_tiles", curb_sheet, 6), ("sedan", sedan, 6), ("aurelio_walk", aurelio_sheet, 6),
                        ("sitting", sitting, 6), ("streetlight", light, 6)):
        bg = Image.new("RGBA", im.size, (90, 96, 104, 255))
        bg.alpha_composite(im)
        bg.resize((im.width * k, im.height * k), Image.NEAREST).save(PREVIEW_DIR / f"{name}_{k}x.png")
    curb = make_curb_preview(curb_tiles, frames, aurelio_frames, sitting, sedan, light, pool, smoke)
    curb.resize((curb.width * 4, curb.height * 4), Image.NEAREST).save(PREVIEW_DIR / "curb_scene.png")
    walls = make_walls_preview(rest_tiles, kdoor, marker)
    walls.resize((walls.width * 4, walls.height * 4), Image.NEAREST).save(PREVIEW_DIR / "restaurant_walls_preview.png")
    rscene = make_restaurant_scene(rest_tiles, frames, fire, smoke)
    rscene.resize((rscene.width * 4, rscene.height * 4), Image.NEAREST).save(PREVIEW_DIR / "restaurant_scene.png")

    # also a 6x preview of the sprite sheet and tiles for inspection
    sheet.resize((sheet.width * 6, sheet.height * 6), Image.NEAREST).save(PREVIEW_DIR / "sheet_6x.png")
    tiles_sheet.resize((tiles_sheet.width * 6, tiles_sheet.height * 6), Image.NEAREST).save(PREVIEW_DIR / "tiles_6x.png")

    # Mission 1 (last: its own random stream and builders, so it never changes the outputs above)
    save_mission1(frames)


if __name__ == "__main__":
    main()
