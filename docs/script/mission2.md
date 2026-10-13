# Mission 2 Script: The Window

Approved dialogue for Mission 2. Narration lines are in brackets. Suspicion values in parentheses are for implementation only and are never shown to the player.

## Scene 1: Morning

*(The apartment. The player walks it freely. All examinables, no dialogue scene.)*

**Optional to examine:**
- Shoes by the door: [Tomi's shoes by the door. New. The box is still on the couch.]
- Fridge: [Eggs, milk, a whole chicken in a plastic bag. Nothing is stuck to the door.]
- Table: [Abuela's pill bottle. The label says 90 days.]
- Basket: [Abuela's mending. A pair of Tomi's old shoes sits on top, the sole half off.]

*(Walking to the door starts the text.)*
[Mateo's phone buzzes.]
**Text from: Unknown number**
Good morning, Mateo. My son will see you at ten o'clock at Distribuidora del Valle, Calle Industria 40. Please be on time.

## Scene 2: The Warehouse

*(Distribuidora del Valle. The player walks in under their own control. A wall clock is visible throughout.)*

[A loading dock. Pallets of produce under plastic. A forklift beeps somewhere. A worker in a hairnet stands by a door marked with a snowflake.]
**WORKER:** You're from Don Aurelio?
**MATEO:** Yes.
**WORKER:** This way.
[The door opens. Cold air. Crates of limes stacked to the ceiling. A man in a pressed shirt stands at a steel table with a phone at his ear. His back is half turned.]
**MAN:** No. Thursday. I said Thursday.
[The worker waits. The man doesn't turn.]
**MAN** (to the worker): That's the courier?
**WORKER:** Yes.
[The man listens to the phone. He taps the table once.]
**MAN** (to the phone): I'll call you back.
[He puts the phone face down. He still hasn't looked at Mateo.]
**MAN:** Crossing window closes at eleven. Booth changes shift. Day officer doesn't care what's in a bag. The next one does.
**MAN:** Drop is behind Delgado Auto Parts, Fourth and Mesa. There's a patrol over the fence. It clears the yard around eleven-forty, a couple of minutes.
**MAN:** Late comes out of your margin.
[He picks the phone up again. It lights up. He reads it.]
**MAN:** Sit.
[Mateo looks at the clock. 10:02. There's nowhere to sit but a crate.]

**Choice:**
- "I have to be through by eleven."
  - **MAN:** I know.
- "Is it ready?"
  - **MAN:** When it's ready.
- (Say nothing.)
  - [The clock ticks.]

[Mateo sits on a crate. His breath shows. The man types with his thumb, then makes a call. A worker carries limes past them, twice.]
[The clock says 10:31.] {p:1500}
[10:38.]
[The man ends the call. He opens a cabinet and sets a gray hard-shell case on the table. Two small padlocks on the latches.]
**MAN:** Don't open it.
[He pushes it across the table with two fingers.]
**MAN** (to the worker): Door.
[The worker holds the door open. Mateo takes the case. It's heavier than it looks.]
[10:41. Mateo checks his phone anyway.]

## Scene 3: The Walk and the Crossing

*(Mateo leaves on foot, carrying the case. The walk to the port is player-controlled, with sprint enabled. The clock keeps running. No examinables.)*

**Hint, first time:** "SHIFT: sprint."

*(At the line, the clock sets the officer: arrival before 11:00 gets the day officer, after gets the night officer, and the booth starts at suspicion +1.)*

[The pedestrian line runs under the awning. Longer than last time.]
[Mateo moves the case to his other hand. A woman behind him looks at it, then looks away.]
[The line moves. The clock over the booths says (the actual time).]

**Booth, before the cutoff:**
[The officer doesn't look up.]
**OFFICER:** Documents.
*(Continue as Mission 1: cover story choice and follow-ups, with Mission 1 values.)*

**Booth, after the cutoff:**
[A different officer is at the booth. He looks at Mateo's passport, then at Mateo.]
**OFFICER:** You were through here last week.
*(Booth starts at +1. Continue as Mission 1.)*

### The key question

[The officer looks at the case.]
**OFFICER:** What's in the case?

**Timed choice, 6 seconds:**
- "It's heavy. I don't know." (+1)
- "Clothes." (+2)
- "A friend asked me to carry it." (+2)
- No answer in time: [Mateo doesn't answer.] (+2)

*(No cover story has a matching answer. Outcome thresholds are as in Mission 1.)*

## Scene 3b: Secondary Inspection

*(Same waiting room as Mission 1. Its narration is reused, with the clock showing the real in-game times. Only the office exchange is new. The Mission 1 cover-story follow-ups still run first, with the skip rule.)*

[She has his passport, his card, and the gray case. She sets the case on the desk. Both padlocks are shut.]
(If the booth key answer was "Clothes.":) **OFFICER CARR:** You told the officer outside this was clothes. (+2)
[She lifts the case an inch and sets it down.]
**OFFICER CARR:** Whose is it?
- "A friend's." (+1)
- "Mine." (+2)
- "I don't know." (+2)

**OFFICER CARR:** Do you have the key?
- "No." (0)
- "It's at home." (+2)
- (Say nothing.) (+2)

**OFFICER CARR:** You're carrying a locked case you can't open. Why?
- "He asked me to bring it." (+1)
  - **OFFICER CARR:** Who?
    - "A guy at a warehouse." (+1; sets told_officer_warehouse: true; loyalty −1, once only)
    - "A friend of my family." (+1)
    - "I'd rather not say." (+2)
- "I don't know." (+2)

*(Tells by attempt, outcomes, Heat, refusal and restart: as in Mission 1. Carr never opens the case, so there is no envelope_inspected equivalent.)*

## Scene 4: The Yard

*(Three Hills. A short walk from the port. Then Mesa Street. Built in the next prompt.)*

[Delgado Auto Parts. A chain-link gate beside the building, open. Behind it, a gravel yard, stacked tires, a covered parking bay, and the border fence at the far end.]
[Mateo's phone buzzes.]
**Text from: Unknown number**
Yard. 11:40. Hand it over at the gate.
**Hint:** "Wait for the gap."

*(Stealth: the drone patrols. Heat +1 once per attempt if spotted.)*

[A man in a gray jacket stands at the gate. He holds out both hands.]
[Mateo gives him the case. The man tests the weight and nods.]
[He walks back toward the shop. He doesn't say anything.]
[Mateo's phone buzzes.]
**Text from: Unknown number**
Received.

*(Fade. End of mission. Summary screen.)*
