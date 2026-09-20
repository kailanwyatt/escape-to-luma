# Save Schema

**Version:** 4 (`SAVE_VERSION`)  
**Key:** `ball-game-cs.save.v1` (unchanged)

## Migration

`migrateSaveData` merges partial/corrupt fields with defaults.  
v3 → v4 adds `campaign` block; endless XP/bests preserved. Opening resets to unseen for migrated players.

## `campaign` block

```ts
highestUnlockedLevel: number;      // starts 1
completedLevels: Record<id, LevelProgress>;
unlockedWorldIds: string[];        // ['containment', ...]
campaignCompleted: boolean;
hasSeenOpening: boolean;
shards: number;
currentEnergy: number;
energyUpdatedAt: number;
ownedSparkIds / equippedSparkId;
ownedTrailIds / equippedTrailId;
boostInventory: { guidance, slowField, secondChance, hyperjump };
unlimitedEnergyExpiresAt: number;
consecutiveFailuresOnLevel: number;
lastPlayedLevel: number;
stats: CampaignStats;
endlessUnlockedDev: boolean;
```

## LevelProgress

`bestRank`, `bestScore`, `attempts`, `cleared`, `rewardsGranted.{clear,great,bullseye,perfect}`

## Rule

Success path saves **before** transition UI (`applyLevelSuccess` + `saveGameSave`).
