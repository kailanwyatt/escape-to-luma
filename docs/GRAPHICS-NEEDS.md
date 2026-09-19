# Aperture — Graphics Needs Brief

**Status:** Prototype art only (procedural Three.js primitives + RN text UI)  
**In-app:** Home → **GRAPHICS NEEDS**  
**Source of truth in code:** `src/graphics/graphicsNeeds.ts`  
**Copy this doc** for artists, producers, or freelancers.

---

## 1. Art direction (one paragraph)

Aperture is a **precision arcade throw** game. Visuals should feel like an **industrial aperture fantasy**: warm Workshop metal, bright Rooftop HVAC daylight, cool Space neon void. Silhouette and opening readability beat detail. Never decorate over the play corridor. Palette anchors: ink `#0A0807`, cream `#F4EFE6`, amber `#FFD24A`, copper `#D06A32`, cyan `#7EF0FF`, heart `#FF5D6C`.

---

## 2. What exists today (prototype)

| Layer | Current state |
| --- | --- |
| 3D environments | Hand-built from boxes/planes/cylinders (Workshop, Rooftop, Space) |
| Obstacles | Primitive meshes (rotor, gate, iris petals, pendulum, ring) |
| Target | Flat concentric circles |
| Projectiles | Colored Phong spheres + sphere-node trails |
| Particles | Tiny colored spheres |
| UI / HUD | React Native text + solid views (hearts = ♥ glyphs) |
| Brand / store | Expo default `icon.png` / splash / favicon |
| Textures / GLB | **None** |
| Custom fonts | **None** (system) |

Audio WAVs exist under `assets/sfx/` — out of scope for this graphics brief.

---

## 3. Priority legend

| Priority | Meaning |
| --- | --- |
| **P0** | Ship blockers for a “real game” look / store listing |
| **P1** | Strong polish; do after P0 |
| **P2** | Nice-to-have / can stay procedural longer |

**Counts:** P0 **14** · P1 **22** · P2 **4** · **40** items total

---

## 4. Deliverables checklist (copyable)

### Store & launch — P0
- [ ] **App icon** — 1024×1024 branded aperture/ball mark; Android adaptive FG/BG/mono
- [ ] **Splash / launch** — centered mark on `#1a1612` (or brand ink)

### Brand — P0
- [ ] **APERTURE wordmark** — SVG + PNG @1x/@2x/@3x (+ optional monogram)

### Menus & UI
- [ ] **P0 Projectile select cards** — 8 ball portraits (256–512 transparent PNG)
- [ ] **P1 Home backdrop** — Workshop still or branded gradient (safe for tall phones)
- [ ] **P1 Menu button frames** — Play primary + secondary panels (SVG / 9-slice)
- [ ] **P1 UI typefaces** — 1 display + 1 condensed UI (mobile license) via expo-font
- [ ] **P2 Remove Ads badge** — small lock/shield mark

### In-run HUD
- [ ] **P0 Hearts** — filled + empty (PNG @2x/@3x or SVG)
- [ ] **P1 Result callouts** — optional HIT/GREAT/BULLSEYE/PERFECT stamp frames
- [ ] **P1 Close Call mark** — small flare/chevron
- [ ] **P1 Keep Going? panel** — continue-offer frame (not spammy)
- [ ] **P2 XP / level chrome** — track + fill + badge

### Projectiles (cosmetic only — same collision radius)
- [ ] **P0 Classic Ball** — hero mesh or stylized sphere + albedo/emissive
- [ ] **P1 Steel Ball** — brushed metal
- [ ] **P1 Neon Ball** — glow / neon shell
- [ ] **P1 Fireball** — heat shell (+ trail color guide)
- [ ] **P1 Ice Ball** — crystal / frosted
- [ ] **P1 Plasma Ball** — energy orb
- [ ] **P1 Gold Ball** — premium metal
- [ ] **P1 Void Ball** — dark core + bright rim (must read on Space black)

### Target — P0
- [ ] **Aperture target** — dimensional bullseye; **art rings must match scoring radii**

### Obstacles (skin per environment where noted)
- [ ] **P0 Rotor — Workshop fan** — industrial fan / shutter blades (GLB)
- [ ] **P1 Rotor — Rooftop turbine** — HVAC / turbine
- [ ] **P1 Rotor — Space energy** — sci-fi spinner
- [ ] **P0 Sliding gate** — blast-door panels; opening must stay readable
- [ ] **P0 Iris aperture** — camera-iris petals; **opening radius is gameplay-critical**
- [ ] **P1 Pendulum blocker** — wrecking-ball / crate / energy bob by env
- [ ] **P1 Moving ring** — framed hoop + solid outer barrier

### Environments
- [ ] **P0 Workshop set** — readable corridor dressing (avoid clutter in aim path)
- [ ] **P0 Rooftop set** — sky/city backdrop + roof props
- [ ] **P0 Space set** — station deck + starfield / nebula
- [ ] **P1 Portals ×3** — door / tunnel / ring for environment transitions

### FX
- [ ] **P1 Projectile trail** — soft ribbon/streak (mobile-cheap)
- [ ] **P1 Hit / Perfect particles** — sparks / aperture shards / Perfect burst
- [ ] **P1 Obstacle impact sparks** — metal vs energy by env
- [ ] **P2 Aim trajectory dots** — subtle production-safe ghosts

---

## 5. Technical constraints (give to 3D artist)

1. **Mobile first** — prefer low poly; target ≤15k tris per interactive GLB unless shared.
2. **No mid-shot hitch** — preload or keep procedural fallbacks.
3. **Collision fidelity** — obstacle openings and target radii are gameplay; art cannot “look” bigger/smaller than collision.
4. **Materials** — Phong/Lambert today; PBR OK later if perf allows. Emissive used heavily in Space.
5. **Reduce Motion** — FX must degrade (already gated in settings).
6. **Corridor clear** — keep ±~2m play lane visually quiet; dressing goes to sides/ceiling/far Z.
7. **Three environments** — Workshop / Rooftop / Space; obstacles re-skin, same collision logic.
8. **Eight balls** — color/material variants only; no different hitboxes.

---

## 6. Suggested production order

1. Wordmark + icon + splash (store)
2. Hearts + Classic ball + Target + Iris + Rotor (Workshop) + Gate
3. Workshop / Rooftop / Space set dressing (readable, not dense)
4. Remaining balls + projectile portraits
5. Other obstacle skins + portals
6. FX trails / particles + HUD stamps
7. Fonts + menu chrome

---

## 7. File naming (proposed)

```text
assets/art/
  brand/aperture-wordmark.svg
  brand/aperture-mark.svg
  store/icon-1024.png
  store/splash.png
  ui/heart-full.png
  ui/heart-empty.png
  ui/ball-{classic|steel|neon|fire|ice|plasma|gold|void}.png
  models/ball-{id}.glb
  models/target-aperture.glb
  models/obstacle-rotor-{workshop|rooftop|space}.glb
  models/obstacle-gate.glb
  models/obstacle-iris.glb
  models/obstacle-pendulum.glb
  models/obstacle-ring.glb
  models/env-workshop.glb
  models/env-rooftop.glb
  models/env-space.glb
  models/portal-{door|tunnel|ring}.glb
  fx/trail-guide.png
  fx/spark-sheet.png
```

---

## 8. Out of scope for this pass

- Rewriting gameplay / collision
- Full marketing site / trailer art
- Character or narrative cutscenes
- Real AdMob creatives
- Replacing procedural audio

---

## 9. Acceptance (when “graphics” is no longer prototype)

- [ ] Store icon is branded (not Expo default)
- [ ] Home shows wordmark / mark (not only system text)
- [ ] Hearts are sprites
- [ ] At least Classic ball + Target + Iris + Workshop rotor are non-primitive assets
- [ ] Each environment has a distinct, readable set (not only fog/color swap)
- [ ] Projectile select shows portraits, not only text
- [ ] Prototype labels (“PROTOTYPE ART”, HUD `· PROTO`) can be removed

---

*Generated for Prototype art audit. Keep aligned with `src/graphics/graphicsNeeds.ts`.*
