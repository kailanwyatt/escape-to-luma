/**
 * Phase Shield (Boost): one eligible obstacle collision forgiveness per attempt.
 * Distinct from Second Chance (retry after failure).
 */

export type PhaseShieldFailureClass =
  | 'eligible_obstacle'
  | 'target_miss'
  | 'out_of_bounds'
  | 'scripted'
  | 'non_eligible';

export type PhaseShieldState = {
  armed: boolean;
  consumed: boolean;
  /** Set when shield breaks on an eligible hit. */
  brokeAtShotTime: number | null;
  lastClassifiedFailure: PhaseShieldFailureClass | null;
};

export function createPhaseShieldState(equipped: boolean): PhaseShieldState {
  return {
    armed: equipped,
    consumed: false,
    brokeAtShotTime: null,
    lastClassifiedFailure: null,
  };
}

/**
 * Priority: active Phase Shield resolves the first eligible obstacle collision;
 * Second Chance remains available afterward if its conditions are met.
 */
export function tryAbsorbObstacleHit(
  state: PhaseShieldState,
  shotTime: number,
): { absorbed: boolean; next: PhaseShieldState } {
  if (!state.armed || state.consumed) {
    return {
      absorbed: false,
      next: { ...state, lastClassifiedFailure: 'eligible_obstacle' },
    };
  }
  return {
    absorbed: true,
    next: {
      armed: false,
      consumed: true,
      brokeAtShotTime: shotTime,
      lastClassifiedFailure: 'eligible_obstacle',
    },
  };
}

export function classifyNonObstacleFailure(
  state: PhaseShieldState,
  kind: Exclude<PhaseShieldFailureClass, 'eligible_obstacle'>,
): PhaseShieldState {
  return { ...state, lastClassifiedFailure: kind };
}

export function phaseShieldDebugLine(state: PhaseShieldState): string {
  if (!state.armed && !state.consumed) return 'phaseShield:off';
  if (state.armed) return 'phaseShield:armed';
  return `phaseShield:broke@${state.brokeAtShotTime?.toFixed(2) ?? '?'}`;
}
