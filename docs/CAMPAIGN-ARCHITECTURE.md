# Campaign Architecture (as implemented)

Working title: **SPARK**

## Modes

| Mode | Entry | Lives / Energy | Progress |
| --- | --- | --- | --- |
| **Campaign** | Home → Continue / Journey → Level Ready → Play | Failures cost 1 Energy (replay cleared levels free). No 3-heart run. | Permanent checkpoints |
| **Endless Voyage** | Post–Level 150, or `__DEV__` unlock | Existing 3 hearts + Rewarded Continue | High scores |

## Data

- Worlds: `src/campaign/worlds.ts` (10 worlds; all playable)
- Levels: `src/campaign/levels/` — World 1–2 authored files + `worldsPack.ts` (Worlds 2 finish + 3–10); 150 total via `index.ts`
- Progression helpers: `src/campaign/CampaignPlay.ts`
- Jump Gate: same target scoring; UI says CLEAR instead of HIT in campaign

## Flow

```text
OPEN → CONTINUE JOURNEY → LEVEL READY (boosts) → THROW
  → SUCCESS → save → LEVEL/WORLD COMPLETE → NEXT
  → FAIL → −1 Energy (unless unlimited / second chance / replay) → RETRY or OUT OF ENERGY
```

## Opening

First campaign launch uses `CAMPAIGN_OPENING` (containment failure beat) then tutorial aim.

## Preserve

Projectile aim/launch/collision/prediction unchanged. Wind is additive `windX` on integrate + trajectory preview. Slow Field scales obstacle `dt` only.
