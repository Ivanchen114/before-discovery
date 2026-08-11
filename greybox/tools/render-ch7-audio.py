#!/usr/bin/env python3
"""CH7-ART-001 original procedural chamber score renderer.

No samples or third-party recordings are used.  The renderer makes four quiet,
mono 22.05 kHz WAV cues with plucked-string, bowed-string, glass and room-noise
models.  They are deliberately sparse so Mandarin dialogue remains foreground.
"""
from array import array
import math
import random
import wave
from pathlib import Path

RATE = 22050
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public/assets/audio/ch07"
OUT.mkdir(parents=True, exist_ok=True)

NOTE = {
    "D2": 73.42, "A2": 110.00, "C3": 130.81, "D3": 146.83,
    "E3": 164.81, "F3": 174.61, "G3": 196.00, "A3": 220.00,
    "Bb3": 233.08, "C4": 261.63, "D4": 293.66, "E4": 329.63,
    "F4": 349.23, "G4": 392.00, "A4": 440.00, "C5": 523.25,
}

def empty(seconds):
    return array("f", [0.0]) * int(seconds * RATE)

def add_bowed(buf, start, dur, freq, amp=0.06, warmth=1.0, phase=0.0):
    lo = max(0, int(start * RATE)); hi = min(len(buf), int((start + dur) * RATE))
    attack = min(1.2, dur * 0.22); release = min(1.8, dur * 0.28)
    for i in range(lo, hi):
        t = (i / RATE) - start
        if t < attack: env = (t / attack) ** 1.5
        elif t > dur - release: env = max(0.0, (dur - t) / release) ** 1.5
        else: env = 1.0
        vibrato = 1.0 + 0.0022 * math.sin(2 * math.pi * 4.7 * t)
        x = 2 * math.pi * freq * vibrato * t + phase
        tone = (math.sin(x) + 0.31 * warmth * math.sin(2*x + 0.18) +
                0.12 * warmth * math.sin(3*x + 0.41)) / (1.43)
        bow = 0.006 * math.sin(2 * math.pi * 37.0 * t + 0.6)
        buf[i] += amp * env * (tone + bow)

def add_glass(buf, start, dur, freq, amp=0.035):
    lo = max(0, int(start * RATE)); hi = min(len(buf), int((start + dur) * RATE))
    for i in range(lo, hi):
        t = (i / RATE) - start
        env = min(1.0, t / 0.8) * max(0.0, (dur - t) / 2.2) ** 0.7
        x = 2 * math.pi * freq * t
        shimmer = math.sin(x) + 0.19 * math.sin(2.01*x) + 0.08 * math.sin(3.98*x)
        buf[i] += amp * env * shimmer / 1.27

def add_pluck(buf, start, freq, amp=0.11, decay=3.8, seed=1):
    rng = random.Random(seed)
    n = max(8, int(RATE / freq))
    ring = [rng.uniform(-1, 1) for _ in range(n)]
    pos = 0; length = min(len(buf) - int(start * RATE), int(decay * RATE))
    damp = 0.9965 - min(0.002, freq / 250000.0)
    base = int(start * RATE)
    for j in range(max(0, length)):
        nxt = (pos + 1) % n
        sample = ring[pos]
        ring[pos] = damp * 0.5 * (ring[pos] + ring[nxt])
        pos = nxt
        env = math.exp(-2.4 * j / max(1, length))
        buf[base + j] += amp * sample * env

def add_room(buf, level=0.006, seed=1, rain=False):
    rng = random.Random(seed); low = 0.0; slow = 0.0
    for i in range(len(buf)):
        white = rng.uniform(-1.0, 1.0)
        low += 0.035 * (white - low)
        slow += 0.002 * (low - slow)
        noise = 0.72 * low + 0.28 * slow
        if rain:
            patter = max(0.0, rng.random() - 0.997) * 6.0
            noise += patter
        buf[i] += level * noise

def add_wood_tick(buf, when, amp=0.055, seed=0):
    rng = random.Random(seed); base = int(when * RATE); length = int(0.09 * RATE)
    for j in range(length):
        if base + j >= len(buf): break
        env = math.exp(-70 * j / RATE)
        buf[base+j] += amp * env * (0.65 * rng.uniform(-1,1) + 0.35 * math.sin(2*math.pi*240*j/RATE))

def normalize_and_write(name, buf, target=0.78):
    peak = max(1e-9, max(abs(x) for x in buf)); gain = target / peak
    pcm = array("h", (int(max(-1.0, min(1.0, x * gain)) * 32767) for x in buf))
    path = OUT / name
    with wave.open(str(path), "wb") as out:
        out.setnchannels(1); out.setsampwidth(2); out.setframerate(RATE); out.writeframes(pcm.tobytes())
    print(f"{path.relative_to(ROOT)} {len(buf)/RATE:.2f}s {path.stat().st_size/1024:.1f} KiB")

def bologna():
    b = empty(29.0); add_room(b, 0.008, 71, rain=True)
    for f in (NOTE["D2"], NOTE["A2"], NOTE["D3"]): add_bowed(b, 0, 11.5, f, 0.025, 0.8)
    for t,n in [(2.0,"D3"),(5.3,"F3"),(8.6,"E3"),(12.4,"D3"),(16.1,"A3"),(20.0,"G3"),(23.6,"E3")]:
        add_pluck(b,t,NOTE[n],0.062,4.5,int(t*101))
    for f in (NOTE["C3"], NOTE["G3"], NOTE["D4"]): add_bowed(b, 11.0, 16.8, f, 0.019, 0.7, 0.3)
    normalize_and_write("Ch7_Bologna_Rain_And_Brass.wav", b)

def matrix():
    b = empty(31.0); add_room(b, 0.0035, 72)
    chords=[(0,("D2","A2","E3")),(8,("C3","G3","D4")),(16,("D2","A2","F3")),(24,("C3","G3","E4"))]
    for start, chord in chords:
        for k,n in enumerate(chord): add_bowed(b,start,7.8,NOTE[n],0.022 if k else 0.029,0.8,k*0.17)
    seq=["D3","A3","E4","C4","G3","D4","F4","E4","D4","A3","G3","E3"]
    for i,n in enumerate(seq):
        add_pluck(b,1.1+i*2.35,NOTE[n],0.070 if i%3==0 else 0.050,4.0,500+i)
    for t in (7.6,15.6,23.6): add_wood_tick(b,t,0.030,int(t*10))
    normalize_and_write("Ch7_Four_Papers_Question.wav", b)

def pavia():
    b = empty(28.0); add_room(b, 0.0028, 73)
    for start,chord in [(0,("G3","D4","A4")),(7,("A3","E4","C5")),(14,("F3","C4","G4")),(21,("G3","D4","A4"))]:
        for k,n in enumerate(chord): add_glass(b,start,6.8,NOTE[n],0.022 if k else 0.030)
    seq=["G3","D4","G4","A3","E4","A4","F3","C4","G4","G3","D4","A4"]
    for i,n in enumerate(seq): add_pluck(b,0.8+i*2.12,NOTE[n],0.052,3.2,700+i)
    for t in (6.6,13.8,20.8): add_wood_tick(b,t,0.038,int(t*30))
    normalize_and_write("Ch7_Pavia_Needle.wav", b)

def letter():
    b = empty(33.0); add_room(b, 0.0032, 74)
    for start,chord in [(0,("D2","A2","F3")),(10,("Bb3","D3","F3")),(20,("C3","G3","E4")),(27,("D2","A2","E3"))]:
        dur = min(10.5,33-start)
        for k,n in enumerate(chord): add_bowed(b,start,dur,NOTE[n],0.018 if k else 0.027,0.75,k*0.22)
    for t,n in [(3,"D4"),(7,"A3"),(12,"F4"),(17,"D4"),(22,"E4"),(27,"D4")]:
        add_pluck(b,t,NOTE[n],0.047,5.3,900+int(t))
    add_glass(b,23.0,8.5,NOTE["A4"],0.012)
    normalize_and_write("Ch7_Letter_Without_Recipient.wav", b)

if __name__ == "__main__":
    bologna(); matrix(); pavia(); letter()
