"""Border Hopper placeholder sound effects.

Outputs (8-bit mono WAV, 16 kHz, quiet by default, a few KB each):
  public/assets/audio/phone_ring.wav   ~2 s modern ringtone loop (two marimba-like arpeggios, then a rest)
  public/assets/audio/smoke_alarm.wav  ~1.2 s harsh smoke-alarm loop (three square-wave beeps)

Both files start and end at silence so they loop without clicks.
Paths resolve relative to this file, so it runs from any working directory. Standard library only.
"""
import math
import struct
import wave
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT_DIR = HERE.parent.parent / "public" / "assets" / "audio"
RATE = 16000


def write_wav(name, samples, volume):
    """samples: floats in [-1, 1]. Written as unsigned 8-bit PCM."""
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUT_DIR / name
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(1)
        w.setframerate(RATE)
        data = bytes(max(0, min(255, int(128 + 127 * volume * s))) for s in samples)
        w.writeframes(data)
    return path


def silence(seconds):
    return [0.0] * int(RATE * seconds)


def pluck(freq, seconds, decay):
    """Marimba-like note: sine plus a little 4th harmonic, exponential decay, short attack."""
    n = int(RATE * seconds)
    out = []
    for i in range(n):
        t = i / RATE
        env = math.exp(-t * decay) * min(1.0, t / 0.004)
        out.append(env * (0.85 * math.sin(2 * math.pi * freq * t) + 0.15 * math.sin(2 * math.pi * freq * 4 * t)))
    # fade the tail to exactly zero
    fade = int(RATE * 0.01)
    for i in range(fade):
        out[n - fade + i] *= 1 - i / fade
    return out


def beep(freq, seconds):
    """Harsh alarm beep: square wave with a 3 ms fade in/out."""
    n = int(RATE * seconds)
    edge = int(RATE * 0.003)
    out = []
    for i in range(n):
        t = i / RATE
        s = 1.0 if math.sin(2 * math.pi * freq * t) >= 0 else -1.0
        env = min(1.0, i / edge, (n - 1 - i) / edge)
        out.append(s * env)
    return out


def make_phone_ring():
    notes = [659.25, 830.61, 987.77, 1318.51]  # E5 G#5 B5 E6
    phrase = []
    for f in notes:
        phrase += pluck(f, 0.12, 18)
    ring = phrase + silence(0.06) + phrase + silence(2.0 - 2 * len(phrase) / RATE - 0.06)
    return write_wav("phone_ring.wav", ring, volume=0.35)


def make_smoke_alarm():
    loop = []
    for _ in range(3):
        loop += beep(3100, 0.25) + silence(0.15)
    return write_wav("smoke_alarm.wav", loop, volume=0.18)


def main():
    for path in (make_phone_ring(), make_smoke_alarm()):
        with wave.open(str(path)) as w:
            secs = w.getnframes() / w.getframerate()
        print(f"{path.name}: {secs:.2f} s, {path.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
