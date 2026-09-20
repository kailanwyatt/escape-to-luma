# Economy (as implemented)

Central config: `src/config/economy.ts`

## Energy

| Setting | Test value |
| --- | --- |
| Max | 15 |
| Regen | 1 / 10 minutes |
| Fail cost | −1 (success free; cleared-level replay free) |
| Rewarded ad | +1 |
| Unlimited | timestamp `unlimitedEnergyExpiresAt` (24h / 7d mocks) |

Regen runs offline via `energyUpdatedAt` (`src/economy/energy.ts`).

## Shards

| Source | Amount |
| --- | --- |
| First clear | +5 |
| GREAT bonus | +2 |
| BULLSEYE bonus | +4 |
| PERFECT bonus | +8 |
| World complete | +50 |

First-time / newly earned ranks only (`src/economy/rewards.ts`). No infinite Level 1 farming.

## Score (skill, not spendable)

CLEAR 100 · GREAT 150 · BULLSEYE 250 · PERFECT 400 · CLOSE CALL 50

## Boost shard costs

Guidance 100 · Slow Field 150 · Second Chance 200

## Skin shard costs

See `ECONOMY.skinCosts` / `SPARK_CATALOG`.
