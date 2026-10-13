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
- The line: there's no frame for Mateo's hand going to his jacket or for him opening the envelope (he just turns to face down); the officer has no frame for holding the passport or sliding the documents back.
- The people ahead in line walk straight through the gate when the line moves; nobody is seen at the booth before Mateo.
- The dog's front and back views are rough at 1x; the leash is a straight 1 px line.
- Secondary inspection: the waiting room and Carr's office are drawn side by side, with a fade between them; the camera could cut to one room at a time. On refusal nobody walks him back; the scene fades straight to the line.
- Carr's bun only shows from the side; from the front her hair reads as short.
- Evening (Scene 5), missing in-between poses, using the closest frames: Mateo taking the notices off the fridge (he stands facing the fridge; the notices just leave it), taking the envelope out of his jacket (seated frame; the envelope just appears), Mateo standing up from the table (the seated frame swaps for standing); Abuela threading the needle, her hands stopping, putting the mending down and picking the needle up again (one seated frame throughout); Tomi counting in twos (his standing frame at the table) and getting up from or sitting back down on the couch (the frames swap). Tomi walks to the table with one shoe on (the one-shoe walk): there's no walk with both shoes off.
- Evening: Mateo's seated frame at the table covers most of the notices; only the envelope's corner and part of the notices show. The lamp's hum has no sound.
- Walt: the door opens and closes by swapping frames (no in-between), and Mateo hands over the envelope with no animation.
- The summary lists an answer each time it was given (no merging across attempts), and secondary's "exposed" suspicion (the blank pages against a lie) has no answer text, so it isn't listed (the dev panel shows it as unresolved).
- In a shipped build, Space on the summary starts the game over from the prologue (there's no Mission 2 yet).
- Secondary inspection asks "What's the doctor's name?" even when the booth answer was picking up a prescription; consider a pharmacy variant.

## Stealth
- Guards walk in straight lines between path cells and ignore their own width, so a path can graze the corner of cover.
- The guard's sprite only switches between four facings; while he turns on the spot (noise, route ends) it snaps from one to the next.
- No sound yet for the noise ring, the "?" filling, or being spotted.
- Fourth Street: until the back-door text arrives, the alley mouth is blocked by an invisible wall; nothing shows why Mateo can't go in.
- The cardboard sign's words (CLOSED FOR REPAIRS) show as a floating label when Mateo is near the window; the sign art is too small to hold them.
- The guard snaps to face Mateo when he reaches him, and Mateo's walk out of the alley ignores the guard's body (they can overlap for a moment).
- After Mateo talks his way past, the guard sees nothing until he's back on his route (otherwise he'd spot Mateo again on the spot). A short grace period might feel better than "until he's back".
- Stealth hints sit over Mateo's head even next to the back wall, where they can cover the camera.

## Mission 2
- Pose fallbacks: Mateo sitting on the crate uses his waiting-room seated frame; Rafael typing, tapping the table, and ending the call use his phone frames (reading, phone at his ear); the worker "waits" in his standing frame; Mateo checking his phone at 10:41 has no frame.
- The case hand-off has no in-between frames (the case on the table just disappears and appears in his hand); so does Rafael pushing it across the table (a short slide).
- The phone's thread starts empty again in Mission 2, though it's the same sender as Mission 1.
- The forklift "beeps somewhere" in the narration but there's no sound.
- The waiting room's narration still says "The clock says 11:12." and "11:31." (reused from Mission 1) while the wall's digital clock shows the game clock (it moves on 19 minutes at that beat); the two disagree.
- Mission 2's office leaves out Mission 1's "He follows her into a small office" (its line was about the envelope); the pass path leaves out "She puts the pages back in the envelope..." and goes straight to "You can go."
- The game clock pauses while dialogue, fades and auto-walks have Mateo (only walking and the wait in line spend it), so reading speed doesn't change the officer. Worth a design decision either way.
- Mateo can sprint up the queue lane at the port (sprint is on for the whole walk to the booth).
- The night officer, once on shift, stays for the mission's retries even though the clock goes back to the line start each time.
- The line has already settled when Mateo arrives (nobody steps forward as he catches up); the woman behind him just stops when he does.
- Leaving the warehouse means walking back through the cold room door to the dock: there's no hint, and holding left inside the cold room just meets the wall.

## Art
- Hand-to-ear walk cycle for calls (normal walk at 60% is used until then).
- Arm swing in walk cycles; side-profile polish.
- Dirt path transition tiles. Slightly speckled smoke at 1x.
- Alley: the dumpsters' lids sit above their footprint, so a drain or stain on the tile above shows between the lids and the wall. Walt's frame shows only half of him in the door gap; no frame for him handing over the envelope.

## Audio
- Tire shop ambience: the air compressor and the radio the narration mentions.
- Placeholder ring and alarm sounds. Voice blips. Full sound direction.
