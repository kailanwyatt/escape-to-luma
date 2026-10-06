# The Null — Creature Concept Bible

**Status:** Concept approved — art rebuild against void-moon board in progress / shipped.
**Reference image:** `null-creature-concept.png` (living-eclipse / void-moon take)

---

## Identity

| | |
|---|---|
| **Name** | The Null |
| **Nature** | A light-eater. Not a machine, not a portal hazard — a hungry darkness that tastes paths and swallows glow. |
| **Player stance** | Escape. Do not fight. (`STAY OUT OF THE DARK`) |
| **Chapter** | `the_null` (L111–L115). After the nebula; Spark crosses without being swallowed, then emerges toward a familiar beacon. |

Story anchors (already shipped):

- “Something here feeds on light.”
- “Escape the Null — do not fight it.”
- “The light-eater fills the void. Only a drifting eye of light remains.”
- “Null tastes the path — dark purple tendrils coil and leave one corridor of light.”

---

## Locked silhouette: hybrid light-eater

```
Distant Null body ──► NullTendril (coils)
                 ├──► NullLash (whip)
                 └──► TheNull boss (safe eye)
Spark escapes through light ──► safe eye / portal
```

- **Background body** (`NullPresenceArt`): vast, soft, almost-featureless dark mass far behind the corridor — felt more than fought.
- **Gameplay contact:** only limbs and the eye enter the throw plane.

### Level mapping

| Level | Obstacle | What Spark faces |
|---|---|---|
| L111 | `nullTendril` | Coils of egg-blob flesh leave **one violet corridor** of uneaten light |
| L112 | `nullLash` | One limb coils, warns **violet**, then whips across the path |
| L113 | `theNull` | Scaled void-field with a **drifting safe eye** of remaining light |

---

## Palette (single source of truth)

| Role | Hex | Use |
|---|---|---|
| Void flesh | `#0a0612` → `#1a0a2c` | Body / blobs / limb volume |
| Scale / wet highlight | `#6a28a8` → `#9a50e8` | Emissive rims, suckers, hunger glow |
| Telegraph | `#b070ff` | Gap lips, lash warning — **Null owns violet** (not amber) |
| Safe light | `#c8e8ff` | Portal / safe eye **only** — never Null flesh |

**Meaning in play**

- Dark = death
- Violet = Null is about to close or strike
- Cool light = the only path

### Forbidden

- Metal rails, plates, facility trim
- Green / olive rings
- Cyan energy collars on Null art
- Painted rings that look like portal hardware

---

## Look rules

1. **Organic, not mechanical** — egg/blob segments, soft scales, tapered limbs.
2. **One creature, three scales** — same flesh language on presence, tendril, lash, and boss field.
3. **Readable openings** — safe paths are holes of light (gap / coiled clear / drifting eye).
4. **Portal stays alien to Null** — destination gate remains light/void-frame; Null must not own a green/cyan collar around it.

---

## Concept board checklist

The approved concept image must show:

- [ ] Distant Null body in deep purple void
- [ ] Mid-ground egg-blob tendrils leaving a violet gap
- [ ] One lash limb
- [ ] Boss-scale dark field with a single cool safe eye
- [ ] Spark as a small bright mote for scale
- [ ] No green rings, no metal gates

---

## Rebuild order (AFTER concept approval only)

1. ~~`NullTendrilArt.ts`~~ — egg-blob arc + violet gap (done)
2. ~~`NullLashArt.ts`~~ — egg-blob spine + violet warn tip (done)
3. ~~`TheNullArt.ts`~~ — void field + cyan safe eye (done)
4. ~~`NullPresenceArt.ts`~~ — distant void-moon + one hanging lash (done)
5. Shared kit: `NullFleshKit.ts` (palette + procedural flesh/scale textures)

Gameplay timing and collision stay unless the bible forces a readability change.
