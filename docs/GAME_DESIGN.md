# Border Hopper — Game Design Document

This document is the source of truth for design. Technical rules live in CLAUDE.md.

## Overview
A 2D top-down pixel-art game for desktop browsers. The player is Mateo, a 20-year-old forced to work for a cartel to pay off a debt, repeatedly crossing the border between two fictional twin towns. Gameplay mixes dialogue-driven border encounters (wit) with real-time stealth traversal (skill). Choices shape relationships, available missions, and the ending.

## Controls
- Move: WASD or arrow keys.
- Interact: E.

## Phone
- The phone sits small in the bottom-right corner of the screen. Incoming calls and texts appear there while the game keeps running.
- Calls use an earpiece and stay in the corner. During a call, Mateo walks with his hand to his ear at about 60% speed. He can still move and act, just slower.
- Texting (reading a thread, typing a reply) expands the phone to take over more of the screen. While it's expanded, Mateo stands still and the world keeps going. The game does not pause.
- Declining or ignoring calls is possible and can have consequences (e.g., Don Aurelio doesn't like being ignored).
- Possible later: Mateo talking on a call makes a small noise radius that guards can hear. Not yet decided.

## Setting
- Present day.
- Fictional twin border towns: **Tres Cerros** (Mexico) and **Three Hills** (US). The mirrored names signal one community split by a border.
- The towns are fictional and not modeled on any single real crossing. Real border-town texture (food, architecture, slang) is welcome.
- Modern surveillance exists: cameras, drones, sensors, wall and fence sections, phones.

## Characters

### Mateo Ibarra (protagonist)
- Male, 20. Parents dead. Supported his grandmother and younger brother by working at a restaurant.
- Pulled into cartel work after accidentally destroying cartel money in a kitchen fire.

### Tomás "Tomi" Ibarra
- Mateo's younger brother, 14.
- Impressed by the money coming in. If Mateo lets him get close to the work, he may follow Mateo into the cartel (see Endings).

### Abuela Esperanza Ibarra
- Mateo's grandmother. Raised both boys.
- Uneasy about the cartel money from the start.
- Knew that Mateo's father worked for Don Aurelio, and has kept it secret.

### Don Aurelio Salgado (the handler)
- Aging old-guard cartel figure who assigns and manages Mateo's missions.
- Believes in respect, honor, and loyalty. Runs his territory as if it were still the 1980s.
- Hid cash at the restaurant for years and was a long-time regular there. Knows the family.
- Mateo's father worked for him and died on a job. Don Aurelio feels he owes the family. Keeping Mateo close is, in his own code, repaying that debt.
- Sees Mateo as "the man my son should have been."
- Never lies outright. Speaks in deliberately ambiguous terms and lets people deceive themselves.

### Rafael Salgado
- Don Aurelio's son, late 20s. Ruthless, efficient, modern.
- Leads the young faction that sees his father's honor code as weakness and wants him out.
- Resents that his father treats Mateo like a son.
- Mirror of what Tomi could become.

### Marisol Vega
- Nursing student who lives on the US side, in Three Hills.
- Meets Mateo during an Act 1 mission.
- Does not know what Mateo does. Mateo's honesty with her is tracked and affects her choices in the Witness ending.
- Becomes leverage once Don Aurelio learns about her.

## Protagonist Premise
- The kitchen fire destroys Don Aurelio's hidden cash. Mateo owes a debt he must work off through missions.
- The restaurant is gone, so Mateo's job is gone. The family now depends on cartel money.
- The cartel holds intel on Mateo's life and on the people he loves: Abuela, Tomi, and later Marisol. That leverage is why he can't walk away.
- The story is framed as Mateo's "last mission." Don Aurelio never actually says it's one job; Mateo assumes it. The work quietly continues.

## The Payout
- Each mission pays down the debt and pays Mateo a cut, far more than the restaurant paid.
- The size of the remaining debt is never shown. The cartel keeps it vague and shifting.
- The family's improving life is visible in the world (medicine, clothes, housing), making the cartel harder to leave.

## Story Spine

### Prologue: The Fire
- Playable closing shift at the restaurant, doubling as the tutorial: wipe tables, take out trash, turn off the stove (movement and object interaction).
- After the tables are wiped, Mateo's phone rings. It is charging on a ledge by the front door, in the far corner of the dining room. Walking over and answering is the first step of the phone tutorial.
- A few seconds into the call, the stove ignites. Mateo is at the far end of the restaurant and moving slowly on the call, so he can't reach it in time. If he gets to the kitchen anyway, the stove is already burning and can't be turned off.
- Escape the burning building: dodge spreading fire and smoke to reach the exit. No stealth yet.
- First conversation with Don Aurelio in the ashes. He is calm and fatherly and asks for "something" in return, in deliberately vague terms. The player is led to assume one job settles it.
- This conversation has real choices:
  - Mateo can apologize, stay defiant, or try to bargain. This sets the starting relationship and nudges starting Loyalty slightly.
  - One line the player chooses is remembered. Don Aurelio quotes it back at the final confrontation.
- Approved dialogue is in docs/script/prologue.md.

#### Closing Shift Details
- Tasks, in fixed order: take the kitchen trash out the back door; wipe 3 dirty tables; turn off the stove (beans simmering for tomorrow). Only the current task can be done.
- Trying a task early gives an in-world line: tables "Trash first. It's starting to smell."; stove "The beans need a few more minutes."
- The checklist shows all tasks; upcoming tasks are dimmed.
- Task progress is shown in an on-screen checklist.
- The locked back-room door can be examined: "The back room. Always locked." (foreshadows the hidden cash).
- The front door can't be used until the shift is done.
- In the full prologue, Tomi's call comes after the tables, before the stove is turned off, and the stove catches fire during the call.
- The current task shows a pulsing red "!" marker over its object. While carrying the trash bag, the marker moves to the back door.
- The kitchen doorway has swinging café doors that open as Mateo passes.
- Task markers can be turned off per scene (stealth missions may not use them).

### Act 1: One Last Job
- First crossings teach encounters and stealth. Missions arrive by phone.
- The payout starts improving the family's life. Abuela is uneasy.
- Mateo meets Marisol on the US side during a mission.
- Don Aurelio is warm and fatherly. Rafael is introduced: cold, watching.
- **Act ends:** the extension is never stated outright. It arrives as routine texts ("Good work. Tomorrow, same place."), and Mateo slowly realizes there was never an end point. If he pushes back, Don Aurelio can truthfully say he never said it was one job. Don Aurelio learns about Marisol, and she becomes leverage.

### Act 2: The Family Business
- Missions escalate as Rafael's faction undercuts Don Aurelio. Mateo is caught between them.
- An authorities contact appears, setting up the Witness ending. Heat rises.
- Tomi gets curious about the money.
- **Midpoint reveal:** Mateo's father worked for Don Aurelio and died on a job. Abuela knew.
- **Act ends:** a job goes wrong because Rafael set it up. Don Aurelio survives, weakened, and tells Mateo he's "the man my son should have been."

### Act 3: The Chair
- Open conflict between father and son, with Mateo as the prize.
- Marisol and the family are threatened directly.
- Final missions build toward whichever endings the player qualifies for.
- **Confrontation:** Don Aurelio reveals how valuable Mateo has become and that he intends to keep him permanently. He quotes back the line Mateo chose in the prologue. The player chooses how the game ends.

## Core Loop
Each mission alternates between two modes that can flow into each other:
1. **Encounter scenes:** dialogue with border agents, cartel members, locals, and rivals.
2. **Traversal sections:** real-time top-down stealth through the mission's setting (desert, tunnels, rail yards, towns, safehouses).

## Encounter System
- **Cover stories:** before each crossing, the player picks a cover story (e.g., visiting family, shopping, work).
- The agent's questions test the story. Contradicting it, Mateo's documents, or answers from past crossings raises suspicion.
- Agents on repeat crossings can recognize Mateo and bring up earlier answers.
- **Timers:** only key questions are timed. Hesitation or silence counts as an answer and raises suspicion.
- The system tracks what Mateo has claimed. Data-driven (JSON).
- **Failure chain:**
  1. Suspicion maxes out, and Mateo is sent to secondary inspection: a tougher second interview.
  2. Failing secondary inspection triggers an escape: a traversal section evading agents on foot.
  3. Getting caught during the escape is the real failure.
- Each step in the chain adds Heat. Failing secondary inspection can also cost cargo and the handler's approval.

## Traversal & Combat
- Stealth first: patrols, sightlines, hiding, cameras, drones.
- Combat is a costly last resort. Mateo can carry a weapon, but using it raises Heat, lowers Conscience, and changes how characters treat him.
- Heavy violence locks the player out of the Witness and The Letter endings.
- Spy gadgets (e.g., jammers, lock tools, drone decoys) provide non-violent options.
- Each mission ends with a summary: times spotted, weapons used, people hurt. This supports clean-run replays.
- Reference: Dishonored's chaos system.

## Branching Structure
- Fixed three-act spine: all players play the same major missions.
- Choices change three hidden meters:
  - **Loyalty:** standing with the cartel.
  - **Heat:** attention from law enforcement.
  - **Conscience:** what Mateo can live with.
- Meters affect dialogue, mission unlocks, character trust, and which endings are available.
- Endings are gated by earlier play. Not every ending is offered to every player.

## Endings

### Core endings
1. **The Right Hand** (high Loyalty). Mateo accepts the permanent role. The family is rich and safe. Abuela quietly stops taking his money; Tomi starts using Don Aurelio's nickname for him. He kept them, but they don't know him anymore.
2. **Witness** (requires authorities contacts and evidence). Mateo testifies; the family is relocated under new names. Abuela leaves her home, church, and her husband's grave. Marisol decides whether to come, based on how honest Mateo was with her.
3. **The Crossing** (depends on preparation and Heat). The final playable level is one last crossing with the family. Abuela can't or won't make the trip and tells Mateo to take Tomi and go. She stays behind by her own choice.
4. **Vacancy** (remove Don Aurelio). The cartel doesn't retaliate. It offers Mateo Don Aurelio's seat over Rafael. Refusing: Rafael takes the seat with a grudge, leading to The Crossing or Witness. Accepting: leads to The Chair, with Rafael as an enemy.
5. **The Chair** (reached from The Right Hand or Vacancy with very low Conscience). Mateo hands a frightened new kid a "last mission," in the same ambiguous words Don Aurelio used, in the same room as their first meeting.
6. **The Letter** (high Conscience). Mateo hands himself over so the family goes free. The epilogue is Tomi reading a letter Mateo left him.

### Overlay: Tomi Takes Your Place
- Applies to Witness, The Crossing, or The Letter.
- Triggered if Mateo let Tomi get close to his work during the game.
- The final card shows Tomi walking into the handler's office.
- Seeds include the prologue call: asking Tomi to check Abuela's pills (tomi_involved +1) leads to him offering to work for cash.

### Failure endings
- **Caught** (Heat maxed). Mateo is arrested. In the interrogation room, one last choice: talk or stay silent. It decides the family's fate, offscreen.
- **Discarded** (built toward nothing). The cartel cuts Mateo loose. He comes home to an empty apartment. What happened is not shown.

### Epilogue cards
- After every ending: a short card for Abuela, Tomi, Marisol, and Don Aurelio, varying by meters and choices.

## Tone
- Grounded crime drama, not cartoon villainy. References: Sicario, Breaking Bad, Narcos: Mexico.
- Every ending costs Mateo a relationship.
- Law enforcement and the cartel are both morally compromised.
- Smuggling is kept abstract (packages, people, favors), not procedural.
- Harm to the family is kept offscreen.

## Art Direction
- Retro indie pixel art, top-down 3/4 perspective.
- Tiles: 16×16 px.
- Characters: 16×32 px frames, 4-frame walk cycle. Sprite sheet rows: down, up, right, left (left is mirrored right).
- Muted desert palette.
- **Prototype art** is code-generated by Python scripts in `tools/art/`, output to `public/assets/images/`. To change art, edit the script and regenerate; don't hand-edit output.
- Existing prototype art:
  - Border tiles: sand, sand with pebbles, scrub, dirt, asphalt, asphalt with horizontal lane dash, bollard border fence, cinder block wall, crate, asphalt with vertical lane dash.
  - Restaurant tiles: kitchen floor, dining floor, wall, wall with window, counter, dirty table, clean table, chair, stove off, stove on, trash full, trash empty, sink, front door, back door, locked back-room door, left and right side walls, four wall corners, left and right counter end caps.
  - Effects: 3-frame fire animation, 2-frame smoke animation, 3-frame café door animation, 2-frame pulsing task marker.
  - Tile and frame indexes are listed in tools/art/README.md.
- Known art gaps: dirt path transition tiles, arm swing in walk cycle, side-profile polish, slightly speckled smoke at 1x, hand-to-ear walk cycle for calls (all 4 directions).
- Dialogue portraits and concept art may be generated with Canva. Canva is not used for in-game sprites.
- Final art may be replaced with custom or commissioned art once the loop is proven.
- Font: Pixel Operator 8 (Jayvee Enaguas, CC0 1.0), converted to a bitmap font by tools/fonts/. All in-game text uses it.

## Scope
- Around 8 missions total: the prologue plus 2–3 per act.
- 6 core endings, 1 overlay, 2 failure endings, plus epilogue cards. No further endings.
- First build target: the Prologue.
- Second build target: the first Act 1 mission (one encounter + one traversal section) to prove the core loop.

## Rejected Ideas
- **Visible debt counter ("the Ledger"):** rejected. The debt must feel vague and shifting.
- **Girlfriend as a cartel or authorities plant:** rejected. It undercuts her as a reason to leave.
- **Full-action combat:** rejected in favor of stealth-first.

## Open Questions
- Act 1–3 mission list and locations.
- The authorities contact character (who, which agency, how they meet Mateo).
- The restaurant's name.
- The specific line Don Aurelio remembers from the prologue.
- The mission where Mateo meets Marisol.
- Phone visual design and text/reply UI details.
- Save system.
- Music and sound direction.
- Remaining key bindings (phone, pause, menu, dialogue choices).
- Sprint key: likely added with traversal; sprinting should be louder (noise tradeoff for stealth).

## Future Polish (deferred)
- Shaders, lighting, and ambiance effects. Decide on these once most of the game is built, based on the full look.
- Must use Phaser 4's Filter system (not Phaser 3 pipelines), and must stay light enough for low-end Chromebooks.
- Full voice acting is deferred until the script is locked, because rewrites and branching multiply recording work, audio adds download size, and accented or code-switched voices need careful review.
- Character voice blips (short pitched sounds as text appears) are planned with the dialogue system.