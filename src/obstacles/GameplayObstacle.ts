import type { ObstacleType } from '../config/ObstacleConfig';
import type { ObstacleCollisionResult } from './ObstacleCollision';

export type ObstaclePredictedState = {
  type: ObstacleType;
  x: number;
  y: number;
  z: number;
  angle: number;
  openingX: number;
  openingY: number;
  openingWidth: number;
  openingHeight: number;
  openingRadius: number;
  blockerX: number;
  blockerY: number;
  blockerRadius: number;
  pivotX: number;
  pivotY: number;
  length: number;
};

export type ObstacleDebugInfo = ObstaclePredictedState & {
  speed: number;
  extra: string;
};

export function emptyPredictedState(
  type: ObstacleType,
  z: number,
): ObstaclePredictedState {
  return {
    type,
    x: 0,
    y: 3,
    z,
    angle: 0,
    openingX: 0,
    openingY: 3,
    openingWidth: 0,
    openingHeight: 0,
    openingRadius: 0,
    blockerX: 0,
    blockerY: 3,
    blockerRadius: 0,
    pivotX: 0,
    pivotY: 5,
    length: 0,
  };
}

export type GameplayObstacle = {
  readonly id: string;
  readonly type: ObstacleType;
  readonly group: { visible: boolean; position: { x: number; y: number; z: number } };
  z: number;
  active: boolean;
  update(dt: number, elapsedTime: number): void;
  testProjectileCrossing(
    previous: { x: number; y: number; z: number },
    current: { x: number; y: number; z: number },
    projectileRadius: number,
  ): ObstacleCollisionResult | null;
  predictState(deltaSeconds: number, simTime: number): ObstaclePredictedState;
  evaluateAt(
    x: number,
    y: number,
    projectileRadius: number,
    predicted: ObstaclePredictedState,
  ): ObstacleCollisionResult;
  getDebugInfo(): ObstacleDebugInfo;
};
