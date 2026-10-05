# Mission 1 Script: The Envelope

Approved dialogue for Mission 1. Narration lines are in brackets. Suspicion values in parentheses are for implementation only and are never shown to the player.

## Scene 1: The Morning After

*(Mateo wakes on the couch. The player can walk the apartment before sitting down at the table, which starts the scene.)*

**Optional to examine:**
- Photo on the wall: [His parents at somebody's wedding. His mother is holding Tomi, a baby.]
- Fridge: [A notice from the electric company. PAST DUE, stamped in red. Another one underneath it.]
- Backpack: [Tomi's backpack. One strap is held on with tape.]
- Jacket: [His work jacket. It still smells like smoke.]

[Abuela is at the stove. A pan of eggs.]
**ABUELA:** Sit down and eat something, mijo.
**MATEO:** I'm not hungry.
**ABUELA:** You didn't eat last night. Eat a little.
[She sets a plate in front of him.]
**ABUELA:** You still smell like smoke.
**MATEO:** I'll shower after.
**TOMI** (from the hallway): Abuela, where's my other shoe?
**ABUELA:** It's where you left it.
[She sits down across from Mateo.]
**ABUELA:** Chuy came by this morning, before seven.
**ABUELA:** He said the pills were already taken care of.
[She sets the pill bottle on the table between them. She waits.]

**Choice:**
- "That was nice of him." (sets abuela_morning: deflect)
  - **ABUELA:** Yes. It was.
  - [She doesn't pick the bottle back up.]
- "I'll pay him back." (sets abuela_morning: promise)
  - **MATEO:** I'll find something. When they cut my hours, I covered rent anyway. I'll cover this.
  - **ABUELA:** I know you will.
  - [She keeps looking at him.]
- (Say nothing.) (sets abuela_morning: silent)
  - [Mateo eats. Abuela turns the bottle until the label faces her.]

[Mateo's phone buzzes.]
**Text from: Unknown number**
Good morning, Mateo. Please be at Llantera Ruiz, Calle Morelos 214, at ten o'clock. Ask for Nando.

[Tomi is behind him, reading over his shoulder. He has one shoe on.]
**TOMI:** That's Beto's uncle's shop.
**MATEO:** Don't read my phone.
**TOMI:** Did he hire you? Are you working there now? Because I know where everything is, Teo, I was there Saturday, I can show you where they keep the—
**MATEO:** It's not like that.
**TOMI:** Then what is it?
[Abuela is watching them both.]

**Choice:**
- "Go to school, Tomi."
  - **TOMI:** Fine. Whatever.
  - [He grabs his backpack and leaves.]
- "Next time. Maybe." (tomi_involved +1)
  - **TOMI:** For real?
  - **MATEO:** Maybe. Go to school.
  - [Tomi grabs his backpack. He's smiling.]

[Mateo stands up and reaches for his jacket.]
**ABUELA:** Wait.
[She wraps the eggs he didn't finish in a tortilla and puts it in his hand.]
**ABUELA:** For later.

## Scene 2: The Tire Shop

*(Llantera Ruiz. The player walks in under their own control.)*

**Optional to examine:**
- Window: [A cardboard sign taped to the glass: HELP WANTED / SE BUSCA AYUDANTE.]

[Stacked tires. An air compressor running. A radio playing somewhere in the back. A man in his sixties stands at the counter, writing in a receipt book.]
**SR. RUIZ:** Morning. Flat?
**MATEO:** I'm looking for Nando.
[Sr. Ruiz looks up from the receipt book.]
**SR. RUIZ:** You're Tomi's brother. Same face.
**MATEO:** …Yeah.
**SR. RUIZ:** Good kid, your brother. He was here Saturday asking a hundred questions about the balancer.

**Choice:**
- "Don't tell him I was here." (sets ruiz_secret: true)
  - [Sr. Ruiz looks at him a moment longer.]
  - **SR. RUIZ:** Sure. Nando's in the back.
- (Say nothing.)
  - **SR. RUIZ:** Nando's in the back.

[In the back, a pair of legs sticks out from under a pickup truck.]
**MATEO:** Nando?
**NANDO:** Who's asking?
**MATEO:** Mateo. I was told to—
**NANDO:** Yeah. Hold on.
[He rolls out on a creeper and wipes his hands on a rag. He opens a drawer in the workbench and takes out a thin envelope.]
**NANDO:** Don't open it. Walt, at the laundromat on Fourth Street. In Three Hills.
**MATEO:** And then?
**NANDO:** That's it.
[He holds out the envelope. Someone has signed across the flap.]
[Mateo puts it inside his jacket. Nando is already back under the truck.]

## Scene 3: The Crossing

### The line
[The pedestrian line runs under a long metal awning. It's already hot.]
[A woman fans herself with a store flyer. A man ahead holds a sleeping boy on his shoulder. Two teenagers share a pair of earbuds.]
*(Mateo walks forward with the line and passes a sign.)*
[A sign on the wall: BORDER CROSSING CARD HOLDERS: EMPLOYMENT NOT AUTHORIZED.]
[Mateo checks his pocket. His passport, and his border crossing card.]
[The line stops moving.]
[An officer walks a dog slowly down the line. The dog sniffs a cooler, a stroller, a shopping bag.]
[Mateo's hand goes to his jacket. He moves it away.]
[The dog passes him without stopping.]
[The line still isn't moving.]

**Choice:**
- Open the envelope. (sets envelope_opened: true)
  - [He turns away from the line and slides a thumb under the flap. The signature tears down the middle.]
  - [Inside: three sheets of paper, folded once. All of them blank.]
  - [He folds them back in and puts the envelope away.]
- Leave it.

[The line moves.]

### The booth
**OFFICER:** Documents.
[Mateo slides his passport and card under the glass. The officer scans them without looking up.]
**OFFICER:** Purpose of your visit?

**Choice (sets the cover story):**
- "Shopping."
- "Visiting family."
- "A doctor's appointment."
- "I have to drop something off." (+2)

### Follow-ups
**Shopping:**
**OFFICER:** What are you buying?
- "Shoes for my brother." (0)
- "Some stuff for work." (+2)
- "I don't know yet." (+1)

**Visiting family:**
**OFFICER:** Who?
- "My tía." (0)
  - **OFFICER:** Where does she live?
    - "Fourth Street." (0)
    - "Near downtown." (0)
    - "I'd have to check my phone." (+2)
- "A friend." (+1)
  - **OFFICER:** Thought you said family.

**A doctor's appointment:**
**OFFICER:** What kind of appointment?
- "The dentist." (0)
  - **OFFICER:** What time?
    - "Eleven thirty." (0)
    - "Sometime this afternoon." (+1)
- "Picking up a prescription for my grandmother." (0)
- "It's… a checkup." (+1)

**Drop something off:**
**OFFICER:** Drop off what?
- "A letter for a friend." (0)
- "Some papers for a business." (+2)

### The key question
(If suspicion is 2 or more:) [He stops typing.]
(Otherwise:) [He glances at the front of Mateo's jacket.]
**OFFICER:** What's in your jacket?

**Timed choice, 6 seconds:**
- "Just paper." Only if he opened the envelope. (0)
- The cover-matched answer (0), a lie unless it's "Just paper":
  - Visiting family: "A letter for my tía."
  - Shopping: "Cash. For the shoes."
  - A doctor's appointment: "My medical papers." If he said he's picking up a prescription: "The prescription."
  - Drop something off: "The letter I'm dropping off."
- "Paperwork." (+2)
- "I don't know." (+2)
- No answer in time: [Mateo doesn't answer.] (+2)

### Behavior tells during the follow-ups
- Crossing 2: [He stops typing.]
- Crossing 3: [He looks at the passport photo, then at Mateo.]

### Outcome
- Suspicion 0–1: [He slides the documents back under the glass.] **OFFICER:** Have a good day.
- Suspicion 2–3: [He holds onto the passport a moment longer. Then he slides it back.] **OFFICER:** Go ahead.
- Suspicion 4 or more: **OFFICER:** Step over there, please. The door on your left. (Secondary inspection.)

## Scene 3b: Secondary Inspection

Secondary has its own suspicion count, starting at 0. Refused entry at 4 or more. It remembers the booth answers.

[A small room with plastic chairs bolted together in rows. A clock on the wall. A man in work boots stares at the floor. A woman holds a folder of documents against her chest.]
[Mateo sits. The clock says 11:12.] {p:1500}
[11:31.]
[A door opens.]
**OFFICER CARR:** Mateo Ibarra?
[He follows her into a small office. She has his passport, his card, and the envelope in a clear plastic bag.]
**OFFICER CARR:** Have a seat.
[She sits across from him and opens a notepad. The envelope stays in its bag.]

### Follow-up by cover story
**Visiting family:**
**OFFICER CARR:** What's your tía's name?
- "Rosa." (0)
- "Rosa… Ibarra." (+1)
- (Say nothing.) (+2)
**OFFICER CARR:** And where does she live?
- Repeats his booth answer. (0)
- Gives the other one. (+2) [She writes something down.]

**Shopping:**
**OFFICER CARR:** Which store?
- "Whichever one has his size." (+1)
- "The outlets on the highway." (0)
**OFFICER CARR:** How much are the shoes?
- "Around sixty dollars." (0)
- "I don't know. A lot." (+1)

**A doctor's appointment:**
**OFFICER CARR:** What's the doctor's name?
- "I have it in my phone." (+1)
- (Say nothing.) (+2)
**OFFICER CARR:** What time did you say it was?
- Repeats his booth answer. (0)
- Gives a different time. (+2)

**Drop something off:**
**OFFICER CARR:** Who's the friend?
- "His name's Walt." (+1)
- "Just a guy I know." (+2)

### The envelope
(If he opened it:) [She turns the bag over. The signature on the flap is already torn.]
[She takes the envelope out and unfolds the sheets. Three pages. Blank.]
(If his booth answer was "Cash. For the shoes.", "My medical papers.", "The prescription.", or "The letter I'm dropping off.":)
[She looks at the blank pages, then at him.] (+2)
**OFFICER CARR:** You told the officer outside this was cash. (Or: medical papers / a prescription / a letter, matching his answer.)
**OFFICER CARR:** Why are you carrying blank paper across the border?
- "Somebody asked me to bring it." (+1)
  - **OFFICER CARR:** Who?
    - "A guy at a tire shop." (+1; sets told_officer_tireshop: true; loyalty −1)
    - "A friend of my family." (+1)
    - "I'd rather not say." (+2)
- "It's for my tía. She makes cards." (0 if visiting family; +2 otherwise)
- "I don't know." (+2)

### Behavior tells
- Crossing 2: [She stops writing.]
- Crossing 3: [She sets the pen down.]

### Outcome
- Under 4: [She puts the pages back in the envelope and slides everything across the desk.] **OFFICER CARR:** You can go. (Heat +1. Continue to Three Hills.)
- 4 or more: **OFFICER CARR:** We're denying your entry today. Someone will walk you back. [She writes something on a form and doesn't look up again.] (Heat +2, card flagged, mission restarts from the line.)

## Scene 4: Three Hills

### The walk
*(Mateo leaves the port on foot. A short, safe walk.)*
**Optional to examine:**
- Food truck: [A taco truck. Same menu as the one outside the port on the other side. Higher prices.]

### Fourth Street
[The laundromat's front window. A piece of cardboard taped inside: CLOSED FOR REPAIRS.]
(Interacting with the door:) [Locked.]
[Mateo's phone buzzes.]
**Text from: Unknown number**
Please use the back door, and see that no one watches you go in.
**Hint:** Reach the back door without being seen.

### The alley
**Optional to examine:**
- Phone store's back door: [A printed notice taped to the steel: DUE TO RECENT BREAK-INS, THIS AREA IS MONITORED BY SECURITY.]

**Stealth hints, first time each:**
- First vision cone on screen: "The shaded area is what they can see."
- Detection starts: "Stay in sight too long and they'll notice you."
- Near cover: "Cover blocks their view."
- First movement: "SHIFT: sprint. It's loud."

### Spotted by the guard
[The guard turns. He walks over, unhurried.]
**GUARD:** Hey. What are you doing back here?

**Choice** (one cover-matched option, plus two always offered):
- Visiting family, Fourth Street: "My tía lives on Fourth. I'm cutting through." (passes)
- Visiting family, near downtown: "Visiting my tía. I got turned around." (passes)
- A doctor's appointment: "I'm looking for a clinic. I think I'm lost." (passes)
  - **GUARD:** Clinic's two blocks that way.
- Shopping: "Shortcut to the bus stop." (passes)
- Drop something off: "I'm dropping something at the laundromat." (fails)
  - **GUARD:** They're closed.
- Always offered: "Just walking." (fails)
- Always offered: (Say nothing.) (fails)

If it passes: **GUARD:** Use the street next time. [He goes back to his route.]
If it fails: **GUARD:** Out. Come on. [He walks Mateo to the end of the alley and waits there until he's gone.] (Heat +1. The alley restarts.)

### The back door
[Mateo knocks. Nothing. He knocks again.]
[The door opens a few inches. A man in his fifties, sleeves rolled up, a wrench in one hand.]
**WALT:** Yeah?
**MATEO:** I'm looking for Walt.
**WALT:** That's me.
[Mateo takes out the envelope. Walt takes it and turns it over. He looks at the signature on the flap.]

Unopened:
[He takes out his phone, types one word, and sends it.]
[He hands Mateo a different envelope. It's thicker.]
**WALT:** Here.
[The door closes.]
(loyalty +1)

Opened:
[He looks at the torn signature. Then at Mateo.]
[He doesn't take out his phone.]
[He hands Mateo a different envelope. It's thicker.]
[The door closes.]
(loyalty −1)

[Mateo looks inside. Cash. He counts it twice.]

### Going home
Unopened only: [His phone buzzes.] **Text from: Unknown number** Thank you, Mateo.
(Fade.) Card: "Back in Tres Cerros." Then the end-of-mission summary: times spotted, Heat change, and which answers raised suspicion.
