# Prototype art generator

`make_sample_art.py` generates the prototype sprites and tiles. Edit the script and regenerate; don't hand-edit the PNGs. The script is split into sections: Mateo sprite, border tiles, restaurant tiles, fire and smoke, and `main()` (saves assets and previews).

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

## Previews (`tools/art/previews/`, git-ignored)

`preview_scene.png`, `preview_walk.gif`, `sheet_6x.png`, `tiles_6x.png`, `restaurant_tiles_6x.png`, `fire_6x.png`, `smoke_6x.png`, `restaurant_scene.png` (mock restaurant with Mateo, fire and smoke), `kitchen_door_6x.png`, `task_marker_6x.png`, `restaurant_walls_preview.png` (mock room: walls, corners, counter ends, cafe doors, task markers), `phone_ledge_6x.png` (over the wall tile), `phone_ui_4x.png`, `phone_icon_6x.png`, `curb_scene.png` (mock curb scene at 4x), and 6x previews of each curb image.
