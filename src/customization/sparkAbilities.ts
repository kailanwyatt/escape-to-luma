/**
 * Persistent Spark passive specializations (docs/SPARK-COLLECTION-ABILITIES.md).
 * Passives never change base collider, launch physics, or target rules.
 */

export type SparkAbilityId =
  | 'pure_focus'
  | 'future_sight'
  | 'energy_harvest'
  | 'cold_field'
  | 'limited_forgiveness'
  | 'guiding_light'
  | 'phase_charge'
  | 'gravity_sense'
  | 'momentum'
  | 'phase_sense'
  | 'network_sense'
  | 'resonance'
  | 'cosmetic_only';

export type SparkAbilityDefinition = {
  id: SparkAbilityId;
  /** One plain sentence for collection / Level Ready. */
  summary: string;
  /** Presentation-only unless noted; gameplay effects are gated and modest. */
  category: 'baseline' | 'presentation' | 'economy' | 'readability' | 'prototype' | 'cosmetic';
};

export const SPARK_ABILITIES: Record<SparkAbilityId, SparkAbilityDefinition> = {
  pure_focus: {
    id: 'pure_focus',
    summary: 'Neutral baseline with the clearest prediction.',
    category: 'baseline',
  },
  future_sight: {
    id: 'future_sight',
    summary: 'Slightly clearer future-state and arrival visualization.',
    category: 'presentation',
  },
  energy_harvest: {
    id: 'energy_harvest',
    summary: 'Modest extra value on eligible first clears, never from replays.',
    category: 'economy',
  },
  cold_field: {
    id: 'cold_field',
    summary: 'A small local slow/readability window that shares the obstacle clock.',
    category: 'readability',
  },
  limited_forgiveness: {
    id: 'limited_forgiveness',
    summary: 'Narrow, visibly armed mistake protection (prototype).',
    category: 'prototype',
  },
  guiding_light: {
    id: 'guiding_light',
    summary: 'Highlights the authored safe opening — not aim assist.',
    category: 'presentation',
  },
  phase_charge: {
    id: 'phase_charge',
    summary: 'Passive, limited phase interaction.',
    category: 'readability',
  },
  gravity_sense: {
    id: 'gravity_sense',
    summary: 'Visualizes declared gravity and force vectors.',
    category: 'presentation',
  },
  momentum: {
    id: 'momentum',
    summary: 'Clearer speed and arrival feedback.',
    category: 'presentation',
  },
  phase_sense: {
    id: 'phase_sense',
    summary: 'Improves phase-field window readability without changing windows.',
    category: 'presentation',
  },
  network_sense: {
    id: 'network_sense',
    summary: 'Displays synchronization and order cues.',
    category: 'presentation',
  },
  resonance: {
    id: 'resonance',
    summary: 'Final-route story resonance feedback.',
    category: 'presentation',
  },
  cosmetic_only: {
    id: 'cosmetic_only',
    summary: 'Visual identity only — same physics as Original.',
    category: 'cosmetic',
  },
};

/** Catalog keyed by Spark id. Missing entries fail safe to Original / pure_focus. */
export const SPARK_ABILITY_BY_SPARK_ID: Record<string, SparkAbilityId> = {
  original: 'pure_focus',
  neon: 'future_sight',
  solar: 'energy_harvest',
  frost: 'cold_field',
  storm: 'limited_forgiveness',
  aurora: 'guiding_light',
  plasma: 'phase_charge',
  lunar: 'gravity_sense',
  meteor: 'momentum',
  nebula: 'phase_sense',
  ancient: 'network_sense',
  origin: 'resonance',
  reactor: 'cosmetic_only',
  void: 'cosmetic_only',
  prism: 'cosmetic_only',
};

export type SparkPassiveAttemptState = {
  sparkId: string;
  abilityId: SparkAbilityId;
  /** Future Sight: slightly denser / longer preview (presentation). */
  predictionClarity: number;
  /** Cold Field: local obstacle-time scale near Spark (1 = none). */
  localSlowScale: number;
  /** Guiding Light / phase / network presentation flags. */
  highlightSafeOpening: boolean;
  showForceVectors: boolean;
  showPhaseWindows: boolean;
  showSyncCues: boolean;
  /** Energy Harvest first-clear bonus multiplier (1 = none). Caps applied by economy. */
  firstClearValueBonus: number;
  /** Storm prototype: not armed by default until balance commits. */
  limitedForgivenessArmed: boolean;
};

const ORIGINAL_PASSIVE: SparkPassiveAttemptState = {
  sparkId: 'original',
  abilityId: 'pure_focus',
  predictionClarity: 1,
  localSlowScale: 1,
  highlightSafeOpening: false,
  showForceVectors: false,
  showPhaseWindows: false,
  showSyncCues: false,
  firstClearValueBonus: 1,
  limitedForgivenessArmed: false,
};

export function abilityIdForSpark(sparkId: string): SparkAbilityId {
  return SPARK_ABILITY_BY_SPARK_ID[sparkId] ?? 'pure_focus';
}

export function abilityDefinitionForSpark(sparkId: string): SparkAbilityDefinition {
  return SPARK_ABILITIES[abilityIdForSpark(sparkId)];
}

/** Pure evaluator: attempt-local passive state. Fails safe to Original. */
export function evaluateSparkPassive(sparkId: string): SparkPassiveAttemptState {
  const abilityId = abilityIdForSpark(sparkId);
  const base = { ...ORIGINAL_PASSIVE, sparkId, abilityId };
  switch (abilityId) {
    case 'future_sight':
      return { ...base, predictionClarity: 1.15 };
    case 'energy_harvest':
      return { ...base, firstClearValueBonus: 1.1 };
    case 'cold_field':
      return { ...base, localSlowScale: 0.92 };
    case 'limited_forgiveness':
      return { ...base, limitedForgivenessArmed: false };
    case 'guiding_light':
      return { ...base, highlightSafeOpening: true };
    case 'phase_charge':
      return { ...base, showPhaseWindows: true };
    case 'gravity_sense':
      return { ...base, showForceVectors: true };
    case 'momentum':
      return { ...base, predictionClarity: 1.08 };
    case 'phase_sense':
      return { ...base, showPhaseWindows: true };
    case 'network_sense':
      return { ...base, showSyncCues: true };
    case 'resonance':
      return { ...base, predictionClarity: 1.05 };
    case 'cosmetic_only':
    case 'pure_focus':
    default:
      return base;
  }
}

export function sparkPassiveDebugLine(state: SparkPassiveAttemptState): string {
  return `spark:${state.sparkId}/${state.abilityId} clarity=${state.predictionClarity.toFixed(2)}`;
}
