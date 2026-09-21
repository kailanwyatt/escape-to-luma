import type { GamePhase, ShotResultKind } from '../game/GameState';
export type SparkVisualState = 'idle' | 'signal' | 'charge' | 'launch' | 'collision' | 'success';
export function sparkStateFor(phase: GamePhase, result: ShotResultKind | null, openingStage: number): SparkVisualState {
  if (phase === 'CAMPAIGN_OPENING') return openingStage === 3 ? 'signal' : 'idle';
  if (phase === 'AIMING') return 'charge';
  if (phase === 'PROJECTILE_ACTIVE') return 'launch';
  if (phase === 'RESULT') return result === 'ROTOR_HIT' || result === 'MISS' ? 'collision' : 'success';
  if (phase === 'LEVEL_COMPLETE' || phase === 'WORLD_COMPLETE' || phase === 'SPARK_UNLOCKED') return 'success';
  return 'idle';
}
