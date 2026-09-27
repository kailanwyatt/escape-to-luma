/**
 * Authoritative obstacle-time composition for Slow Field + Time Lock.
 * Projectile / sim time stays separate; all obstacle state queries use this clock.
 */

import { ECONOMY } from '../config/economy';

export type ObstacleClockPolicy = {
  /** Shot / simulation elapsed time (projectile clock). */
  shotTime: number;
  /** When true, obstacle dt is scaled by ECONOMY.boostSlowFieldMultiplier. */
  slowFieldActive: boolean;
  /**
   * Launch-triggered freeze duration in seconds. While shotTime < lockDuration,
   * obstacle time stays at the freeze baseline (usually 0 at launch).
   */
  timeLockDuration: number;
  /**
   * Obstacle time at the moment Time Lock armed (normally launch obstacleTime).
   * Defaults to 0 for launch-start freezes.
   */
  timeLockBaseline?: number;
};

/**
 * Map shot time → obstacle time.
 * Time Lock freezes obstacle progression; Slow Field scales advancement after unlock.
 */
export function obstacleTimeFromShot(policy: ObstacleClockPolicy): number {
  const baseline = policy.timeLockBaseline ?? 0;
  const lock = Math.max(0, policy.timeLockDuration);
  if (lock <= 0) {
    return baseline + policy.shotTime * (policy.slowFieldActive ? ECONOMY.boostSlowFieldMultiplier : 1);
  }
  if (policy.shotTime <= lock) {
    return baseline;
  }
  const afterLock = policy.shotTime - lock;
  const scale = policy.slowFieldActive ? ECONOMY.boostSlowFieldMultiplier : 1;
  return baseline + afterLock * scale;
}

/** Obstacle dt for one frame given raw / scaled projectile dt and remaining lock. */
export function obstacleDeltaSeconds(options: {
  projectileDt: number;
  shotTimeBefore: number;
  timeLockDuration: number;
  slowFieldActive: boolean;
}): number {
  const lock = Math.max(0, options.timeLockDuration);
  const before = Math.max(0, options.shotTimeBefore);
  const after = before + Math.max(0, options.projectileDt);
  if (lock <= 0) {
    return options.projectileDt * (options.slowFieldActive ? ECONOMY.boostSlowFieldMultiplier : 1);
  }
  if (after <= lock) {
    return 0;
  }
  const unfrozen = before >= lock ? options.projectileDt : after - lock;
  return unfrozen * (options.slowFieldActive ? ECONOMY.boostSlowFieldMultiplier : 1);
}

export function remainingTimeLock(shotTime: number, lockDuration: number): number {
  return Math.max(0, lockDuration - Math.max(0, shotTime));
}
