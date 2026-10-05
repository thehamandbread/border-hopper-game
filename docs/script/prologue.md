# Prologue Script

Approved dialogue for the prologue. The dialogue system will load lines from data files built from this.

## Tomi's Call

**Trigger:** the last table is wiped. The phone rings. It is charging on a ledge by the front door. The corner phone shows TOMI calling, and a "!" marker appears over the phone.

**Tutorial hints:**
- When the phone rings: "Your phone's ringing."
- At the phone: "E: Answer"
- After answering: "You can walk during calls, but slower."

**TOMI:** Hey, Teo. Are you almost done?
**MATEO:** Almost. Why?
**TOMI:** No reason. I just… went to the farmacia.
**MATEO:** You sound weird. What's going on?
**TOMI:** Don Chuy wouldn't give me Abuela's heart pills.
**MATEO:** Did you tell him I'd pay him Friday?
**TOMI:** I told him. He showed me his notebook. The whole page is just us.
**MATEO:** How much do we owe?
**TOMI:** Two thousand three hundred.

*(The stove ignites here, offscreen.)*

**TOMI:** …Teo?
**MATEO:** I'm here.
**TOMI:** She's acting normal. But she had to stop three times on the stairs.

**Choice:**
- **A. "I'll talk to him tomorrow. Don't worry about it."**
  - **TOMI:** I'm not worried.
- **B. "Can you check how many pills she has left?"** *(sets flag: tomi_involved +1)*
  - **TOMI:** I already did. She has two.
  - **MATEO:** Two days. Okay.
  - **TOMI:** I could help, you know. Beto's uncle is hiring at the tire shop. He pays cash, and I could work after school.
  - **MATEO:** You have school.
  - **TOMI:** School doesn't pay, Teo.

**TOMI:** Is there any food left from today?
**MATEO:** I'll bring some home.

*(Smoke alarm starts.)*

**TOMI:** What's that noise?
**MATEO:** …I'll call you back.

*(Call ends. Smoke is pouring through the café doors. No line from Mateo.)*

## The Escape

**Hints:**
- During the call, walking into fire: "It's too hot."
- At the stove after ignition: "Too late."
- When the call ends: "The front's locked. Use the back."
- New task: "Get out the back door"
- On touching fire: "You got burned."
- First restart only: "Move when the flames die down."
- At the back door: "E: Get out"

## The Curb

*(Night. Mateo sits on the curb outside the burned restaurant, waiting for the owner, Doña Lupe, as the firefighters asked. The last fire truck pulls away. An old, spotless sedan pulls up. Don Aurelio gets out slowly and walks over.)*

**DON AURELIO:** Mateo, right?
**MATEO:** Yeah. Who are you?
**DON AURELIO:** Aurelio. Lupe asked me to come.
**MATEO:** She's not coming?
**DON AURELIO:** No.

*(He sits down on the curb next to Mateo, with some effort.)*

**DON AURELIO:** Are you hurt?
**MATEO:** No.
**DON AURELIO:** Good. Buildings can be fixed.

**Choice 1 (sets the starting relationship):**
- **A. "It was my fault. I left the stove on. I'll pay her back."** *(loyalty +1)*
  - **DON AURELIO:** You say it straight. Most people start with excuses.
- **B. "I'm waiting for Lupe, not you."** *(loyalty −1)*
  - **DON AURELIO:** I know. You'll be waiting a long time.
- **C. "Whatever it costs, I'll work it off. Just tell me the number."** *(no change)*
  - **DON AURELIO:** A number. Your generation always wants a number.

**DON AURELIO:** There was something of mine in that back room.
**MATEO:** The back room's always locked. I've never been in there.
**DON AURELIO:** I know. That's why it was there.
**MATEO:** What was it?
**DON AURELIO:** It doesn't matter now. It's gone.

*(A pause.)*

**DON AURELIO:** Your father would have stayed too. On this curb.
**MATEO:** You knew my dad?
**DON AURELIO:** Everyone knew your father.

*(He looks at Mateo for a while.)*

**DON AURELIO:** Let me ask you something. Not about tonight. What do you want, Mateo? In your life.

**Choice 2 (the line he remembers; sets prologue_want):**
- **A. "I want my family to be okay."** *(family)*
- **B. "I want to not owe anybody anything."** *(no_debt)*
- **C. "I don't know. I've never had time to think about it."** *(unsure)*

**DON AURELIO:** That's an honest answer. I'll remember it.

**DON AURELIO:** Here's what we'll do. You help me with something. Then we'll talk about what's owed.
**MATEO:** Help you with what?
**DON AURELIO:** Something small. I'll send you the details.

*(He stands up slowly.)*

**DON AURELIO:** Esperanza's prescription will be ready in the morning. Tell Chuy I said hello.
**MATEO:** I didn't ask you for that.
**DON AURELIO:** No. You didn't.

*(He walks back to his car and drives away. A moment later, the phone buzzes. A text from an unknown number: "Tomorrow. I'll send the address." Reading it expands the phone for the first time: the texting tutorial.)*

## The First Text

*(After Don Aurelio drives away, the phone buzzes. Hint: "You got a text. Press Q to read.")*

**From: Unknown number**
Tomorrow. I'll send the address.

*(Hint inside the phone: "Q: close". After closing: fade to black. "END OF PROLOGUE". Any key: the Mission 1 title card, "MISSION 1: THE ENVELOPE".)*
