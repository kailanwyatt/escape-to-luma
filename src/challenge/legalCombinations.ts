import type { ObstacleType } from '../config/ObstacleConfig';
import { obstacleTypeOf, type ObstacleConfig } from '../config/ObstacleConfig';

export const LEGAL_PAIRS: ReadonlyArray<readonly [ObstacleType, ObstacleType]> = [
  ['rotor', 'rotor'],
  ['rotor', 'slidingGate'],
  ['slidingGate', 'rotor'],
  ['rotor', 'iris'],
  ['iris', 'rotor'],
  ['rotor', 'movingRing'],
  ['movingRing', 'rotor'],
  ['pendulum', 'rotor'],
  ['pendulum', 'movingRing'],
  ['pendulum', 'pendulum'],
  ['movingRing', 'movingRing'],
  ['iris', 'iris'],
  ['iris', 'slidingGate'],
  ['slidingGate', 'iris'],
  ['iris', 'pendulum'],
  ['pendulum', 'iris'],
  ['orbiter', 'orbiter'],
  ['orbiter', 'rotor'],
  ['rotor', 'orbiter'],
  ['orbiter', 'iris'],
  ['iris', 'orbiter'],
  ['orbiter', 'driftingBlocker'],
  ['driftingBlocker', 'orbiter'],
  ['driftingBlocker', 'driftingBlocker'],
  ['driftingBlocker', 'movingRing'],
  ['movingRing', 'driftingBlocker'],
  ['phaseField', 'phaseField'],
  ['phaseField', 'iris'],
  ['iris', 'phaseField'],
  ['phaseField', 'movingRing'],
  ['movingRing', 'phaseField'],
  ['shiftingAperture', 'shiftingAperture'],
  ['shiftingAperture', 'phaseField'],
  ['phaseField', 'shiftingAperture'],
  ['shiftingAperture', 'pendulum'],
  ['pendulum', 'shiftingAperture'],
  ['slidingGate', 'orbiter'],
  ['orbiter', 'slidingGate'],
  ['laserGrid', 'rotor'],
  ['rotor', 'laserGrid'],
  ['laserGrid', 'slidingGate'],
  ['slidingGate', 'laserGrid'],
];

export function isLegalCombination(obstacles: ObstacleConfig[]): boolean {
  if (obstacles.length <= 1) {
    return true;
  }
  if (obstacles.length > 2) {
    return false;
  }
  const a = obstacleTypeOf(obstacles[0]);
  const b = obstacleTypeOf(obstacles[1]);
  return LEGAL_PAIRS.some((pair) => pair[0] === a && pair[1] === b);
}
