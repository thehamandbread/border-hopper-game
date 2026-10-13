# Prototype art generator

`make_sample_art.py` generates the prototype sprites and tiles. Edit the script and regenerate; don't hand-edit the PNGs. The script is split into sections: Mateo sprite, border tiles, restaurant tiles, fire and smoke, phone, curb scene, Mission 1 (characters, apartment, tire shop, previews), the Mission 1 crossing (port of entry, secondary inspection, previews), Three Hills and stealth (the alley, cover props, the wall camera, detection icons, the guard, Walt, the street, previews), and `main()` (saves assets and previews). Mission 1 art, the crossing art and the Three Hills art each use their own random stream and run in that order after everything else, so they never change earlier outputs.

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

## Mission 1: the crossing

### `port_tiles.png` (352x16, 16x16 tiles, one row)

| Index | Name | Notes |
|---|---|---|
| 0 | pavement | sun-bleached concrete |
| 1 | pavement_seam | with expansion joints on its right and bottom edges |
| 2 | pavement_stains | old gum and a drink stain |
| 3 | rope | stanchion rope crossing the tile at waist height, sagging a pixel in the middle |
| 4 | rope_post | rope with a chrome post in the middle of the tile |
| 5 | rope_end_left | first post of a barrier (post on the left, rope going right) |
| 6 | rope_end_right | last post (rope coming in from the left) |
| 7 | port_wall | the port building's wall face, government tan, dark baseboard |
| 8 | port_sign_left | metal sign, 2 tiles wide, on the wall face: blue header band and gray lines where the words go. No text is baked in; the words are game text |
| 9 | port_sign_right |  |
| 10 | port_door | steel door with a wired-glass window (wall row; the way to secondary inspection) |
| 11 | roof | the building's flat gravel roof edge, seen from above (goes above the wall row) |
| 12 | booth_roof_left | inspection booth, 2 wide x 3 tall: flat roof with a lip and a blue band |
| 13 | booth_roof_right |  |
| 14 | booth_window_left | the window: dim inside, a monitor on the right. Draw the officer over it, then `booth_glass.png` |
| 15 | booth_window_right |  |
| 16 | booth_counter_left | steel ledge with the document slot, ribbed front |
| 17 | booth_counter_right |  |
| 18 | gate_closed | steel swing gate past the booth |
| 19 | gate_open | swung back against its post |
| 20 | fence | copied unchanged from `border_tiles.png` (index 6) |
| 21 | wall | copied unchanged from `border_tiles.png` (index 7) |

Rope tiles sit on pavement and block movement; a one-wide queue lane is a row of pavement between two rows of rope.

### `port_awning.png` (32x16)
Shade overlays for the long awning over the line, partially transparent: 0 shade, 1 shade along its sunny edge (dithered). Draw them above the floor and below people.

### `awning_post.png` (16x48)
A steel support post for the awning, taller than anyone in line, with a bracket at the top. Feet on row 44 (3 px above the bottom, like the characters), so it depth-sorts with them.

### `booth_glass.png` (32x16)
Faint glass tint and two glare streaks, partially transparent. Draw it over the booth officer, exactly over `booth_window_left` + `booth_window_right`.

### `port_props.png` (48x16)
16x16 props in line, with transparency: 0 a cooler, 1 a stroller, 2 a full plastic shopping bag (a red logo, no lettering).

### `booth_officer.png` (32x32)
The booth officer, waist-up behind the glass, 16x32 frames: 0 idle, looking out; 1 head down, typing. The frame's bottom row is the counter's top edge: stand him on the bottom of the `booth_window` row.

### `handler_walk.png` (64x128)
The K-9 handler, `mateo_walk.png` layout: the agency uniform (steel-blue shirt, gold badge, navy trousers) under a black vest, a navy ball cap.

### `dog_walk.png` (64x80)
The handler's dog, a German shepherd (tan, black saddle). 16x16 frames; rows 0 down, 1 up, 2 right, 3 left (4-frame walk, frame 0 standing), row 4: 0-1 sniffing, facing right (nose to the ground; alternate them), 2-3 the same facing left. Feet on row 12, so it stands on the characters' ground line (3 px above the frame's bottom).

### `queue_npcs.png` (64x160)
People in line ahead of Mateo, 16x32 frames, all facing right (toward the booth). Row 0: the woman with the flyer (50s, curly hair, mustard blouse, brown skirt) walking, frame 0 standing. Row 1: 0-1 her fanning herself with the flyer (alternate). Row 2: the man holding a sleeping boy against his shoulder (gray T-shirt; the boy in yellow), walking. Row 3: the teenage girl (ponytail, teal hoodie), walking. Row 4: the teenage boy (maroon T-shirt), walking. The teenagers share earbuds: a white earbud and thin cord each; she holds the phone.

### `secondary_tiles.png` (288x16, 16x16 tiles, one row)

| Index | Name | Notes |
|---|---|---|
| 0 | vinyl | waiting room and office floor: institutional vinyl squares |
| 1 | vinyl_scuff | with scuff marks |
| 2 | sec_wall | pale institutional wall face, gray baseboard |
| 3 | wall_side_left | same rules as the restaurant's side walls and corners |
| 4 | wall_side_right |  |
| 5 | wall_corner_top_left |  |
| 6 | wall_corner_top_right |  |
| 7 | wall_corner_bottom_left |  |
| 8 | wall_corner_bottom_right |  |
| 9 | wall_clock | round wall clock on the wall face |
| 10 | chair_row_left | one seat of a row of molded plastic chairs bolted to a steel beam, facing down; leg at the left end |
| 11 | chair_row_mid | middle seat |
| 12 | chair_row_right | leg at the right end |
| 13 | office_door | the office door, closed (wall row) |
| 14 | office_door_open | open: the lit office beyond |
| 15 | desk_left | steel office desk, 2 wide, seen from the visitor's side |
| 16 | desk_right | drawers |
| 17 | wall_clock_1131 | the wall clock later: 11:31 |

Empty chairs are these tiles; occupied chairs are the seated frames in `waiting_people.png` drawn over them.

### `carr_walk.png` (64x160)
Officer Carr: 40s, dark brown hair in a low bun, the agency uniform. `mateo_walk.png` layout, plus row 4: at her desk, waist-up, facing down (the frame's bottom row is the desk's far edge; her notepad is on the desk): 0-1 writing (alternate), 2 stopped writing (pen still in her hand), 3 the pen set down.

### `waiting_people.png` (64x32)
Seated frames, 16x32, feet on row 28 like everyone else (about 3 px shorter than standing). Draw 0-2 over a `chair_row` tile with the feet on the tile's bottom edge: 0 the man in work boots (50s, faded red work shirt) staring at the floor; 1 the woman holding a manila folder flat against her chest (lavender blouse); 2 Mateo, sitting facing down (his own head and torso rows, sitting); 3 Mateo at Carr's desk, back to us, on a plastic chair (the chair is part of the frame). The curb-sitting frame in `sitting.png` is cut off at the knees, so it doesn't fit a chair; frame 2 replaces it here.

### `secondary_props.png` (48x16)
16x16 props with transparency: 0 the envelope sealed in a clear plastic bag (signature across the flap), 1 three blank sheets, unfolded, 2 his passport and border crossing card.

## Three Hills and stealth

### `alley_tiles.png` (336x16, 16x16 tiles, one row)

The alley's back walls are two tiles tall (an upper and a lower tile; the lower one has grime along the ground), with `roof` above them. Doors are two tiles tall too (top in the upper row, bottom in the lower row).

| Index | Name | Notes |
|---|---|---|
| 0 | asphalt | copied unchanged from `border_tiles.png` (index 4) |
| 1 | concrete | poured concrete pad, joints on the top and right edges |
| 2 | gutter | concrete with a shallow channel running left-right through the middle |
| 3 | drain | the gutter with a grate |
| 4 | trash_stains | asphalt with a dark seep and some faded litter |
| 5 | brick_upper | laundromat back wall: red-brown brick |
| 6 | brick_lower | |
| 7 | brick_upper_pipe | variant: a downspout |
| 8 | brick_lower_pipe | the downspout's bottom, a wet mark |
| 9 | cinder_upper | phone store back wall: painted gray cinder block |
| 10 | cinder_lower | |
| 11 | cinder_upper_vent | variant: an exhaust grille with rust streaks |
| 12 | cinder_lower_box | variant: an electrical box with conduit |
| 13 | roof | flat tar roof, coping along the bottom edge (goes above a wall's upper row) |
| 14 | roof_far | same roof with the coping on the top edge: the far side of the alley seen from above |
| 15 | phone_door_top | phone store's plain steel back door, no window, no text (on cinder) |
| 16 | phone_door_bottom | |
| 17 | laundry_door_top | laundromat back door, faded teal steel, closed (on brick) |
| 18 | laundry_door_bottom | |
| 19 | laundry_door_open_top | pushed in a few inches: the leaf in shade, a dark gap on the latch side |
| 20 | laundry_door_open_bottom | |

### `dumpster.png` (64x32)
Two 32x32 dumpsters, 2 tiles wide, lids closed, seen from the front and a little above: 0 green, 1 dark blue with rust. Feet line (bottom of the casters) on row 28, like the characters; the footprint is the 2x1 tiles under that line.

### `pallets.png` (16x32)
A stack of wooden pallets, feet line on row 28; the footprint is one tile.

### `parked_car.png` (48x24)
A faded gray-blue sedan, parked, from the side (the sedan's 3/4 construction), facing right: dusty sills, a dent in the front door, plain hubcaps. Footprint: 3 tiles wide, 1 deep.

### `wall_camera.png` (48x16)
Security camera on a wall bracket, 3 frames of 16x16 with transparency, drawn over a wall tile (the bracket is at the top of the tile): 0 aimed left, 1 center (toward the viewer), 2 right.

### `stealth_icons.png` (30x10)
10x10 frames: 0 "?" empty (dark outline, dim inside), 1 "?" filled (amber), 2 "!" (red). Frames 0 and 1 are pixel-aligned: show detection by drawing frame 0, then frame 1 cropped to the bottom part of its height.

### `guard_walk.png` (64x160)
The alley guard: 40s, a little heavy, buzz cut and mustache, pale gray security shirt with dark epaulettes, charcoal trousers, a radio on his belt; no weapon. `mateo_walk.png` layout, plus row 4 (idle, arms folded): 0-1 facing down (alternate for a slow breath), 2 facing right, 3 facing left.

### `walt_door.png` (16x32)
Walt in the laundromat's back doorway: the door pushed open a few inches, Walt (50s, thinning gray hair, glasses pushed up, faded green work shirt with the sleeves rolled up) in the gap, a wrench hanging from the hand on the door's edge. Draw it exactly over `laundry_door_top` + `laundry_door_bottom`.

### `threehills_tiles.png` (336x16, 16x16 tiles, one row)

Storefronts are three rows: `storefront_roof`, then the sign row (plain wall and the 2-tile sign band), then the window row.

| Index | Name | Notes |
|---|---|---|
| 0 | sidewalk | daytime concrete slab |
| 1 | curb | sidewalk meeting the street: curb top, face, gutter |
| 2 | street | copied unchanged from `border_tiles.png` (asphalt, index 4) |
| 3 | street_line | copied unchanged (asphalt_line, index 5): Fourth Street's center line |
| 4 | crosswalk | asphalt with white bars, for a street running left-right |
| 5 | laundry_wall | laundromat front: peach stucco with a dark base |
| 6 | laundry_wall_plain | without the base (sign row) |
| 7 | laundry_window | front window, washers inside |
| 8 | laundry_door | glass front door |
| 9 | laundry_sign_left | blank sign band, 2 tiles wide (blue frame, pale panel; no text) |
| 10 | laundry_sign_right | |
| 11 | phone_wall | phone store front: gray-blue stucco |
| 12 | phone_wall_plain | |
| 13 | phone_window | window with two phone posters (shapes only) and a display stand |
| 14 | phone_door | glass front door |
| 15 | phone_sign_left | blank sign band (red frame; no text) |
| 16 | phone_sign_right | |
| 17 | storefront_roof | same as the alley's `roof` |
| 18 | block_wall | other buildings: tan-gray stucco with a dark base |
| 19 | block_wall_plain | without the base (sign row) |
| 20 | alley_mouth | the gap between two buildings where the alley meets the sidewalk: asphalt in shade, side edges left and right; use it in all three storefront rows |

### `closed_sign.png` (12x10)
The cardboard sign taped inside the laundromat's window: marker strokes where the words go (no text baked in; CLOSED FOR REPAIRS is game text).

### `notice.png` (16x16)
A printed notice taped up, gray lines where the words go (no text baked in; the notice is game text). Draw it over `phone_door_top`.

### `food_truck.png` (64x40)
A taco truck from the side, facing right: cream body, red stripe, the serving window open under a striped awning, a blank menu board.

### `bus_bench.png` (32x16)
A bus-stop bench facing down: wooden slats and backrest, steel ends.

## Previews (`tools/art/previews/`, git-ignored)

`preview_scene.png`, `preview_walk.gif`, `sheet_6x.png`, `tiles_6x.png`, `restaurant_tiles_6x.png`, `fire_6x.png`, `smoke_6x.png`, `restaurant_scene.png` (mock restaurant with Mateo, fire and smoke), `kitchen_door_6x.png`, `task_marker_6x.png`, `restaurant_walls_preview.png` (mock room: walls, corners, counter ends, cafe doors, task markers), `phone_ledge_6x.png` (over the wall tile), `phone_ui_4x.png`, `phone_icon_6x.png`, `curb_scene.png` (mock curb scene at 4x), and 6x previews of each curb image. Mission 1: `apartment_scene.png` and `tireshop_scene.png` (mock scenes at 4x with every character placed), `m1_lineup_1x.png` / `m1_lineup_6x.png` (everyone side by side, for checking they read as different people), and 6x previews of each Mission 1 image. The crossing: `port_scene.png` (mock line and booth at 4x, everyone placed) and `secondary_scene.png` (mock waiting room and office at 4x), `crossing_lineup_1x.png` / `crossing_lineup_6x.png`, and 6x previews of each crossing image. Three Hills: `alley_scene.png` (the sandbox alley mocked up at 4x, with cover, the camera, the guard and Walt), `threehills_scene.png` (Fourth Street at 4x), `threehills_lineup_1x.png` / `threehills_lineup_6x.png`, and 6x previews of each Three Hills image.
