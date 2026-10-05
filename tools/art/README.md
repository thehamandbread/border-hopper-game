# Prototype art generator

`make_sample_art.py` generates the prototype sprites and tiles. Edit the script and regenerate; don't hand-edit the PNGs. The script is split into sections: Mateo sprite, border tiles, restaurant tiles, fire and smoke, phone, curb scene, Mission 1 (characters, apartment, tire shop, previews), and `main()` (saves assets and previews). Mission 1 art uses its own random stream and runs last, so it never changes earlier outputs.

## Run

Needs Pillow (`pip install Pillow`, or `sudo apt install python3-pil` on Debian/Ubuntu).

```
python3 tools/art/make_sample_art.py
```

Works from any working directory.

## Output (committed, in `public/assets/images/`)

### `mateo_walk.png` (64x128)
16x32 frames. Rows: 0 down, 1 up, 2 right, 3 left. Columns: 4-frame walk cycle.

### `border_tiles.png` (160x16, 16x16 tiles, one row)

| Index | Name | Notes |
|---|---|---|
| 0 | sand | |
| 1 | sand_pebbles | |
| 2 | scrub | |
| 3 | dirt | |
| 4 | asphalt | |
| 5 | asphalt_line | horizontal centered dash, for horizontal roads |
| 6 | fence | |
| 7 | wall | |
| 8 | crate | |
| 9 | asphalt_line_v | vertical centered dash, for vertical roads |

### `restaurant_tiles.png` (384x16, 16x16 tiles, one row)

| Index | Name | Notes |
|---|---|---|
| 0 | kitchen_floor | cool checker tile |
| 1 | dining_floor | warm terracotta |
| 2 | wall | cream plaster, dark baseboard |
| 3 | wall_window | wall with a window |
| 4 | counter | wooden service counter (fills the tile, tiles horizontally) |
| 5 | table_dirty | plate, crumbs, salsa spill |
| 6 | table_clean | same table, wiped |
| 7 | chair | |
| 8 | stove_off | dark burners |
| 9 | stove_on | lit orange/blue burners |
| 10 | trash_full | bag overflowing |
| 11 | trash_empty | open empty can |
| 12 | sink | |
| 13 | front_door | glass and metal |
| 14 | back_door | plain metal |
| 15 | back_room_door | heavy door with padlock |
| 16 | wall_side_left | top edge (cap) of the left wall seen from above, room on its right; stacks seamlessly |
| 17 | wall_side_right | same for the right wall, room on its left |
| 18 | wall_corner_top_left | left wall cap meeting the top wall's face |
| 19 | wall_corner_top_right | |
| 20 | wall_corner_bottom_left | left wall cap ending on the bottom wall's face |
| 21 | wall_corner_bottom_right | |
| 22 | counter_end_left | rounded end of the counter segment on the LEFT of a gap (its right end faces the gap) |
| 23 | counter_end_right | rounded end of the segment on the RIGHT of the gap (its left end faces the gap) |

Tables and chairs sit on dining floor; stove, sink and trash sit on kitchen floor; doors sit in the wall.

### `kitchen_door.png` (96x16)
Swinging cafe doors for a doorway 2 tiles wide. 3 frames of 32x16 (indexes 0-2): closed, half open, fully open. Leaves are hinged at the outer sides; transparent background, draw it over the floor.

### `task_marker.png` (32x16)
Red "!" with a dark outline. 2 frames of 16x16 (indexes 0-1): bright, slightly dimmer, for a pulse. Transparent background.

### `phone_ledge.png` (32x16)
Mateo's smartphone lying on a small wall ledge, with a white charging cable running down into a wall outlet. Drawn to sit over the bottom wall face (transparent background). 2 frames of 16x16: 0 dim screen, 1 bright screen (ringing).

### `phone_icon.png` (32x24)
Small corner phone icon. 2 frames of 16x24: 0 idle (dark screen), 1 ringing (lit incoming-call screen).

### `phone_ui.png` (112x150)
The large texting phone: a dark smartphone. Screen area (where text goes): x 6, y 16, w 100, h 118 inside the image.

### `aurelio_walk.png` (64x128)
Don Aurelio, same layout as `mateo_walk.png`: 16x32 frames, rows down, up, right, left (left is mirrored right), 4-frame walk. Gray hair and mustache, cream guayabera, dark slacks and shoes, a slight stoop. Less bob than Mateo; play it slower for his steady walk.

### `sitting.png` (48x32)
16x32 frames: 0 Mateo sitting on a curb (facing down), 1 Don Aurelio sitting, 2 Don Aurelio mid sit-down (for easing down and standing up).

### `curb_tiles.png` (144x16, 16x16 tiles, one row)

| Index | Name | Notes |
|---|---|---|
| 0 | sidewalk | concrete slab |
| 1 | curb_edge | sidewalk meeting the street: curb top, curb face, gutter |
| 2 | street | night asphalt |
| 3 | burned_wall | scorched plaster storefront, charred baseboard |
| 4 | broken_window | blackened, broken front window |
| 5 | charred_door | charred front door in a metal frame |
| 6 | wall_top_soot | the storefront's soot-streaked top edge |
| 7 | storm_drain | curb edge with a drain opening and grate |
| 8 | streetlight_base | sidewalk with the streetlight's base plate |

### `streetlight.png` (16x48) and `light_pool.png` (56x22)
The streetlight pole and lamp (foot at the bottom centre). `light_pool.png` is a soft pale-yellow ellipse with partial transparency, placed on the ground under the lamp (draw it above a night overlay so it glows).

### `sedan.png` (96x24)
Don Aurelio's old, spotless, dark maroon sedan from the side, facing right, with chrome trim. 2 frames of 48x24: 0 headlights off, 1 on.

### `fire.png` (48x16)
3 frames of 16x16 (indexes 0-2), looping flame, transparent background.

### `smoke.png` (32x16)
2 frames of 16x16 (indexes 0-1), looping dark gray puff, partially transparent.

## Mission 1

Character sheets use the `mateo_walk.png` layout (16x32 frames; rows 0 down, 1 up, 2 right, 3 left; 4-frame walk), plus extra rows. Every character's feet end on the same row as Mateo's, so they all stand on the same ground line.

### `abuela_walk.png` (64x160)
Abuela Esperanza: small and upright (3 px shorter than Mateo), gray hair in a bun, plum cardigan over a pale floral housedress. Row 4: frame 0 sitting at a table, facing down (waist-up; the frame's bottom row is the table's far edge).

### `tomi_walk.png` (64x256)
Tomi: 3 px shorter than Mateo, messy black hair, white school polo, navy pants. Rows 4-7: the same walk (down, up, right, left) with his left shoe off (white sock). Frame 0 of each row is standing.

### `ruiz_walk.png` (64x160)
Sr. Ruiz: 60s, mustard work cap, glasses, gray mustache, a little heavyset, light blue work shirt. Row 4: frames 0-1 standing behind the counter writing in a receipt book (waist-up, looking down; the frame's bottom row is the counter's front edge). Alternate them for the pen moving.

### `nando_walk.png` (64x160)
Nando: 40s, navy coveralls, red bandana, dark mustache. Row 4: 0 only his legs, lying on the creeper (for under the truck); 1 lying on his back on the creeper, whole body (rolling out); 2-3 standing, wiping his hands on a rag (alternate). Frames 0-1 line up with `creeper.png` at the same position.

### `mateo_extra.png` (64x32)
Two 32x32 frames: 0 lying on the couch (head on the left, eyes closed; body in the lower half); 1 sitting at a table facing up, his back to us over the back of his chair (the frame's bottom is the chair's feet; it covers a `chair_back` tile exactly).

### `apartment_tiles.png` (384x16, 16x16 tiles, one row)

| Index | Name | Notes |
|---|---|---|
| 0 | linoleum | kitchen floor: worn beige linoleum, faded printed checker |
| 1 | linoleum_worn | same, worn through (in front of the stove) |
| 2 | ceramic | living-room floor: gray ceramic tiles |
| 3 | wall | sage-green painted wall face, brown baseboard |
| 4 | wall_window | window in morning light, curtains to the sides |
| 5 | wall_side_left | same rules as the restaurant's side walls and corners |
| 6 | wall_side_right |  |
| 7 | wall_corner_top_left |  |
| 8 | wall_corner_top_right |  |
| 9 | wall_corner_bottom_left |  |
| 10 | wall_corner_bottom_right |  |
| 11 | counter | small kitchen counter, tiled top, painted cabinets (tiles horizontally) |
| 12 | stove | white enamel stove with a pan of eggs |
| 13 | fridge_top | upper fridge, drawn over the wall face (goes in the wall row) |
| 14 | fridge | lower fridge door with the past-due notices (floor row, under fridge_top) |
| 15 | table_top | small kitchen table, 1 wide x 2 deep, red gingham oilcloth: top half |
| 16 | table_bottom | bottom half (cloth edge, legs) |
| 17 | chair | painted kitchen chair facing down (backrest at the top) |
| 18 | chair_back | same chair facing up (back of the backrest toward us) |
| 19 | couch_left | worn couch, 2 tiles wide, facing down |
| 20 | couch_right |  |
| 21 | hallway | open doorway to the bedrooms (wall row) |
| 22 | front_door | apartment front door (wall row) |
| 23 | photo | framed photo on the wall: his parents at a wedding, the baby |

### `apartment_props.png` (64x16)
16x16 props with transparency: 0 pill bottle, 1 plate of eggs, 2 Tomi's backpack (one strap taped), 3 work jacket hung over a chair back (draw it exactly over a `chair` tile).

### `tireshop_tiles.png` (432x16, 16x16 tiles, one row)

| Index | Name | Notes |
|---|---|---|
| 0 | concrete | shop floor |
| 1 | concrete_oil | with an old oil stain |
| 2 | wall | painted cinder block, red stripe, dark baseboard |
| 3 | wall_side_left | same rules as the restaurant's side walls and corners |
| 4 | wall_side_right |  |
| 5 | wall_corner_top_left |  |
| 6 | wall_corner_top_right |  |
| 7 | wall_corner_bottom_left |  |
| 8 | wall_corner_bottom_right |  |
| 9 | tire_stack | three stacked tires |
| 10 | compressor | red air compressor with a coiled hose |
| 11 | workbench | bench with a vise |
| 12 | workbench_drawer | bench with the drawer (the envelope's drawer) |
| 13 | counter | service counter, laminate top, red front (tiles horizontally) |
| 14 | counter_end_left | square end of a counter segment whose right end faces open floor |
| 15 | counter_end_right | mirror of counter_end_left |
| 16 | office_glass | glass-walled office: front face with blinds (wall-face row) |
| 17 | office_door | its glass door |
| 18 | office_corner | aluminium post where the office front ends; shop floor to its right |
| 19 | office_side | the office's side wall from above (thin cap on the left, shop floor to its right) |
| 20 | office_floor | office carpet |
| 21 | garage_open_left | roll-up door, rolled up: drum on top, street light below; track on the left edge |
| 22 | garage_open | middle piece |
| 23 | garage_open_right | track on the right edge |
| 24 | garage_closed | roll-up door down (corrugated) |
| 25 | shop_window | front window with the HELP WANTED cardboard sign |
| 26 | tool_wall | pegboard with tools on the wall face |

### `pickup_truck.png` (48x24)
An old faded-blue pickup from the side, facing right, like the sedan. The gap between the wheels (x 14-33) is where Nando's legs stick out: draw the truck above the creeper and his legs.

### `creeper.png` (16x32)
Mechanic's creeper, lengthwise up the screen, headrest at the top. Same frame size and feet row as Nando's lying frames.

## Previews (`tools/art/previews/`, git-ignored)

`preview_scene.png`, `preview_walk.gif`, `sheet_6x.png`, `tiles_6x.png`, `restaurant_tiles_6x.png`, `fire_6x.png`, `smoke_6x.png`, `restaurant_scene.png` (mock restaurant with Mateo, fire and smoke), `kitchen_door_6x.png`, `task_marker_6x.png`, `restaurant_walls_preview.png` (mock room: walls, corners, counter ends, cafe doors, task markers), `phone_ledge_6x.png` (over the wall tile), `phone_ui_4x.png`, `phone_icon_6x.png`, `curb_scene.png` (mock curb scene at 4x), and 6x previews of each curb image. Mission 1: `apartment_scene.png` and `tireshop_scene.png` (mock scenes at 4x with every character placed), `m1_lineup_1x.png` / `m1_lineup_6x.png` (everyone side by side, for checking they read as different people), and 6x previews of each Mission 1 image.
