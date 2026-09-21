"""Original synthesized opening score; Python standard library only.
No samples, pretrained audio, external music or third-party recordings.
Run from any directory; writes only assets/sfx/opening-score.wav.
"""
import math
import random
import struct
import wave
from pathlib import Path

RATE = 22050
DURATION = 35
samples = [0.0] * (RATE * DURATION)
rng = random.Random(101)

def tone(start, duration, frequency, gain, end_frequency=None, texture=0):
    phase = 0.0
    for i in range(int(duration * RATE)):
        index = round(start * RATE) + i
        if index >= len(samples):
            break
        t = i / RATE
        u = t / duration
        hz = frequency + ((end_frequency or frequency) - frequency) * u
        phase += math.tau * hz / RATE
        attack = min(1.0, t / .08)
        release = min(1.0, (duration - t) / .25)
        envelope = attack * release
        harmonic = math.sin(phase) + .2 * math.sin(phase * 2.003)
        samples[index] += gain * envelope * (harmonic + texture * rng.uniform(-1, 1))

# Home motif: D, A, E, left unresolved until the later reunion arrangement.
for start, gain in [(1.0, .10), (19.3, .14)]:
    for offset, hz in [(0, 293.665), (.8, 440), (1.7, 329.628)]:
        tone(start + offset, 2.3, hz, gain)
        tone(start + offset + .28, 2.4, hz / 2, gain * .24)
# Scanner approach and mechanical chamber closure.
tone(5.2, 3.4, 180, .065, 680)
tone(9.6, .7, 110, .12, 45, .15)
tone(10.4, .9, 72, .09, 38, .10)
# Low containment bed; soft fade avoids clicks at the shot transition.
tone(12, 20.5, 55, .035)
tone(12, 20.5, 82.41, .021)
for start in [13.2, 15.7, 18.2]:
    tone(start, .65, 164.81, .025)
# Recognizable, restrained two-note alert, without a piercing siren.
for start in [25.1, 27.1, 29.1]:
    tone(start, .6, 220, .07)
    tone(start + .65, .6, 261.626, .055)
tone(25.05, 1.2, 90, .08, 32, .7)
for start, hz in [(26, 1700), (26.13, 2100), (26.37, 1300)]:
    tone(start, .3, hz, .025, hz * .7, .3)
# Leave space for the player's first throw.
tone(31.2, 2.8, 146.832, .05)
peak = max(abs(value) for value in samples)
scale = min(1, .78 / peak)
output = Path(__file__).resolve().parents[1] / 'assets/sfx/opening-score.wav'
with wave.open(str(output), 'wb') as handle:
    handle.setnchannels(1)
    handle.setsampwidth(2)
    handle.setframerate(RATE)
    handle.writeframes(b''.join(struct.pack('<h', round(value * scale * 32767)) for value in samples))
print(f'{output.name}: {DURATION}s, mono PCM16, {RATE}Hz; peak {peak * scale:.3f}')
