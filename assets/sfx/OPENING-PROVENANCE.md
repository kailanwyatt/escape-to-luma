# Opening score provenance

`opening-score.wav` is an original procedural synthesis authored locally for Spark on 2026-09-20. Reproduce it with `python3 scripts/generate_opening_audio.py`. No external recordings, sampled music, model output or third-party sound libraries are used. The source script and rendered output belong to this project; no external asset license is required.

Format: 35 seconds, mono PCM16 WAV, 22,050 Hz, approximately 1.55 MB. Bounded peak below 0.78 full scale; playback gain 0.6. The three-note home motif is D4–A4–E4, unresolved. Scene timing: living light 0–5, probe 5–12, laboratory 12–19, signal 19–25, failure 25–31, handoff 31–35.

Status: first sound-design pass, not a final mastered soundtrack. Review with headphones and phone speakers. The low containment tones may need harmonic reinforcement for small speakers. No change to existing gameplay sound files.

The game clock owns the track. Loading joins the current scene time; mute/pause/skip/scene disposal stop playback. Resume seeks to the paused scene position. Browser autoplay policy can require the first user interaction before sound plays; the visual sequence remains usable silently.
