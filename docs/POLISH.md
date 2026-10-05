# Polish Backlog

Collected during development. Fixed in a dedicated polish pass after all missions are built. Nothing here blocks new work.

## Writing
- Curb conversation: fix what the player doesn't know at that point.
  - "Esperanza's prescription": the player has only ever heard "Abuela." Change to "Your abuela's pills. Chuy will have them ready in the morning. Tell him I said hello."
  - The scene never says why Mateo is on the curb, and Lupe's name only appears if the player examined the front door. Add a line for Mateo when the stranger approaches: "I'm waiting for Doña Lupe. The firemen said she has to come sign something."
  - "I'll pay her back" (choice 1) depends on Lupe being established first.
  - The back room line: Mateo's reply should explain it: "The back room? Lupe never lets anyone in there."
- Rewrite all prologue dialogue to docs/STYLE_GUIDE.md: narration lines, pacing, choices at the emotional peaks, and the character voices.
- Standard for all dialogue: no line exists only to deliver exposition. Every line must be something that character would actually say in that moment.

## Curb scene
- Framing feels empty: the sidewalk is too tall and mostly bare, and the burned restaurant is a thin strip at the top. Tighten the camera so the burned storefront is large and close behind Mateo, and clearly the same restaurant.
- The sedan stops mid-street instead of pulling up to the curb beside Mateo.
- Don Aurelio's sitting frame sits slightly lower than Mateo's on the same curb. Align them.
- Sidewalk grid lines are too strong (reads as graph paper). Soften them.
- The "pause" event does nothing. It should hold about 1 second.
- The "aurelio_looks" event does nothing. Needs a sitting frame of Don Aurelio turned toward Mateo.
- "Unknown number" wraps onto two lines in the texting phone.
- Phone-call narration sits over the restaurant's top wall and reads a little busy. Consider a subtle backing or a different position.

## Mission 1
- Sr. Ruiz has no frame for looking up from the receipt book ("Sr. Ruiz looks up from the receipt book."); for now he just stops writing.
- Poses switch with no in-between frames: Mateo getting up from the couch, Abuela sitting down and standing up, Nando lying down on the creeper.
- The dialogue box covers the bottom two rows of the apartment and the tire shop, so Tomi standing behind Mateo, and Mateo at the counter, are partly hidden while it's up. Consider moving the camera or the box.
- The phone's thread starts empty in each scene: the prologue's "Tomorrow. I'll send the address." isn't there when the Mission 1 text arrives from the same number.

## Art
- Hand-to-ear walk cycle for calls (normal walk at 60% is used until then).
- Arm swing in walk cycles; side-profile polish.
- Dirt path transition tiles. Slightly speckled smoke at 1x.

## Audio
- Tire shop ambience: the air compressor and the radio the narration mentions.
- Placeholder ring and alarm sounds. Voice blips. Full sound direction.
