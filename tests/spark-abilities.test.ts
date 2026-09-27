import { describe, expect, it } from 'vitest';

import {
  abilityIdForSpark,
  evaluateSparkPassive,
  SPARK_ABILITY_BY_SPARK_ID,
} from '../src/customization/sparkAbilities';
import { SPARK_CATALOG, sparkAbilityId } from '../src/customization/sparks';

describe('Spark passive data model', () => {
  it('assigns a known ability to every catalog spark', () => {
    for (const spark of SPARK_CATALOG) {
      expect(SPARK_ABILITY_BY_SPARK_ID[spark.id] ?? spark.abilityId).toBeTruthy();
      expect(sparkAbilityId(spark)).toBe(abilityIdForSpark(spark.id));
    }
  });

  it('fails safe to Original / pure focus', () => {
    const unknown = evaluateSparkPassive('missing-spark');
    expect(unknown.abilityId).toBe('pure_focus');
    expect(unknown.predictionClarity).toBe(1);
    expect(unknown.firstClearValueBonus).toBe(1);
  });

  it('keeps Original as the neutral baseline', () => {
    const original = evaluateSparkPassive('original');
    expect(original.abilityId).toBe('pure_focus');
    expect(original.highlightSafeOpening).toBe(false);
    expect(original.limitedForgivenessArmed).toBe(false);
  });

  it('exposes modest, presentation-first effects for named sparks', () => {
    expect(evaluateSparkPassive('neon').predictionClarity).toBeGreaterThan(1);
    expect(evaluateSparkPassive('solar').firstClearValueBonus).toBeGreaterThan(1);
    expect(evaluateSparkPassive('aurora').highlightSafeOpening).toBe(true);
    expect(evaluateSparkPassive('lunar').showForceVectors).toBe(true);
    expect(evaluateSparkPassive('frost').localSlowScale).toBeLessThan(1);
    expect(evaluateSparkPassive('plasma').showPhaseWindows).toBe(true);
    expect(evaluateSparkPassive('nebula').showPhaseWindows).toBe(true);
    expect(evaluateSparkPassive('ancient').showSyncCues).toBe(true);
    expect(evaluateSparkPassive('storm').limitedForgivenessArmed).toBe(false);
  });
});
