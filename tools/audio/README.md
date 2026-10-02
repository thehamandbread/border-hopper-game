# Placeholder sound effects

`make_sfx.py` generates the placeholder sound effects as WAV files. Edit the script and regenerate; don't hand-edit the WAVs. These are stand-ins until the real sound direction is decided.

## Run

Standard library only (no extra packages).

```
python3 tools/audio/make_sfx.py
```

Works from any working directory.

## Output (committed, in `public/assets/audio/`)

8-bit mono WAV at 16 kHz, quiet by default, start and end at silence so they loop cleanly.

- `phone_ring.wav`: ~2 s modern ringtone loop (two short marimba-like arpeggios, then a rest).
- `smoke_alarm.wav`: ~1.2 s harsh smoke-alarm loop (three square-wave beeps).
