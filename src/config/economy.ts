/** Central economy / campaign score / energy / shop tuning (test values). */

export const ECONOMY = {
  maxEnergy: 15,
  energyRegenMinutes: 10,
  rewardedAdEnergyAmount: 1,

  score: {
    CLEAR: 100,
    GREAT: 150,
    BULLSEYE: 250,
    PERFECT: 400,
    CLOSE_CALL: 50,
  },

  shards: {
    levelClear: 5,
    greatBonus: 2,
    bullseyeBonus: 4,
    perfectBonus: 8,
    worldCompletion: 50,
    challengeGate: 20,
  },

  boostCosts: {
    guidance: 100,
    slowField: 150,
    secondChance: 200,
  },

  boostSlowFieldMultiplier: 0.6,
  helpAfterFailures: 5,

  skinCosts: {
    neon: 500,
    solar: 1000,
    frost: 800,
    storm: 1200,
    plasma: 1500,
    meteor: 1800,
    nebula: 2000,
    void: 2500,
  } as Record<string, number>,

  trailCosts: {
    stardust: 300,
    lightning: 400,
    fire: 400,
    frost: 400,
    void: 600,
  } as Record<string, number>,

  mockUnlimitedEnergy24hLabel: 'MOCK · 24 HOURS',
  mockUnlimitedEnergy7dLabel: 'MOCK · 7 DAYS',
  unlimitedEnergy24hMs: 24 * 60 * 60 * 1000,
  unlimitedEnergy7dMs: 7 * 24 * 60 * 60 * 1000,
} as const;

export type BoostId = 'guidance' | 'slowField' | 'secondChance' | 'hyperjump';
