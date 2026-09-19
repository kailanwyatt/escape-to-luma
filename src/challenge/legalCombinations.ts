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
