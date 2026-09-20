# SPARK — Style Guide & Design System

**Product:** Spark — Escape to Luma  
**UI stack:** React Native overlays on Three.js playfield  
**Code:** `src/design/`

---

## 1. Intent

UI should feel like a **signal from deep containment** — dark, precise, sparse.  
The play corridor stays sacred; chrome never competes with depth, openings, or Spark.

Fantasy line:

> A small spark. A long way home. Escape to Luma.

---

## 2. Principles

1. **Brand first** — On launch/home, **SPARK** is the hero; everything else is subordinate.
2. **One job per screen** — Launch = begin journey. Not a dashboard.
3. **Readable over ornate** — Silhouette and contrast beat decoration.
4. **Cyan = Spark / progress** · **Amber = energy / attention** · **Copper = primary action** · **Red = danger only**.
5. **Corridor clear** — No floating badges over the 3D throw lane.
6. **Approximate, don’t paste** — Concept art informs mood; UI uses tokens + primitives.

---

## 3. Color tokens (`tokens.ts`)

| Token | Hex / value | Use |
| --- | --- | --- |
| `ink` | `#0A0807` | Screen base |
| `inkElevated` | `#141110` | Chips / panels |
| `cream` | `#F4EFE6` | Primary text |
| `creamMuted` / `creamFaint` | alpha cream | Secondary / kickers |
| `amber` | `#FFD24A` | Brand display, energy |
| `copper` | `#D06A32` | Primary CTA |
| `cyan` | `#7EF0FF` | Spark, links, progress |
| `energy` | `#7EFFB0` | Energy positive |
| `shard` | `#FFE08A` | Currency |
| `danger` | `#FF3B3B` | Lasers / fail |

Avoid default AI purple gradients. Keep space washes subtle (cyan/copper at ≤8% opacity).

---

## 4. Type roles (`typography.ts`)

| Role | Use |
| --- | --- |
| `kicker` | Micro uppercase eyebrow |
| `brand` | SPARK display |
| `productLine` | ESCAPE TO LUMA |
| `tagline` | Supporting sentence |
| `label` / `labelCyan` / `labelAmber` | Buttons, chips |
| `caption` | World / meta |
| `buttonPrimary` / `buttonSecondary` / `buttonGhost` | CTA hierarchy |

Fonts are system for now. Later: one display + one condensed UI via `expo-font`.

---

## 5. Space & radius

- Screen gutter: `space.screenX` (28)
- Stack rhythm: `xs → sm → md → lg`
- Controls: `radius.lg` (16); chips: `radius.sm` (8)

---

## 6. Components (`src/design/components/`)

| Module | Role |
| --- | --- |
| `Screen` | Full-bleed ink + optional space atmosphere + safe area |
| `BrandHero` | Spark mote + SPARK + product line + tagline |
| `MetaStrip` | Energy / shards / progress — compact, not a dashboard |
| `Button` | `primary` \| `secondary` \| `ghost` \| `outline` |

Import from `src/design`:

```ts
import { Screen, BrandHero, MetaStrip, Button, color, textStyles } from '../design';
```

---

## 7. Launch screen composition

Matches landing concept:

1. Deep-space atmosphere (corridor washes + Spark well)
2. Settings control (top-right)
3. BrandHero — JOURNEY HOME / SPARK / ESCAPE TO LUMA
4. StatusPanel — world · level · energy · shards
5. Primary gold CTA — CONTINUE JOURNEY
6. BottomNav ×4 — Journey / Sparks / Shop / Stats
7. Footer quote

Concept JPG kept at `assets/art/landing-hero.jpg` as art reference only (includes baked UI — do not use as live background).

---

## 8. Motion (later)

Ship intentional motion only:

1. Spark idle pulse (scale/opacity)
2. Primary button press (already slight scale)
3. Screen atmosphere drift (optional)

Respect Reduce Motion.

---

## 9. Do / Don’t

| Do | Don’t |
| --- | --- |
| One copper primary | Multiple equal CTAs |
| Cyan for Spark-adjacent UI | Purple neon soup |
| Hairline strokes | Heavy card stacks on launch |
| Uppercase labels with tracking | Dense paragraph UI |
| Align with throw-camera language | Side-view / isometric menus |

---

## 10. Rollout

1. ✅ Tokens + components  
2. ✅ Home / launch screen  
3. Next: Journey, Level Ready, Shop, HUD chrome  
4. Then: custom fonts + Spark portraits

Keep this doc aligned with `src/design/tokens.ts`.
