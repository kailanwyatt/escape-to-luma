import * as THREE from 'three';

import type { EnvironmentId } from '../config/ChallengeConfig';
import type { IrisConfig } from '../config/ObstacleConfig';
import { GAME_TUNING } from '../game/gameTuning';
import { lerp } from '../utils/math';
import {
  createIrisVisual,
  layoutIrisVisual,
  replaceVisual,
} from './ObstacleVisuals';
import { evaluateIrisCollision, type ObstacleCollisionResult } from './ObstacleCollision';
import {
  emptyPredictedState,
  type ObstacleDebugInfo,
  type ObstaclePredictedState,
} from './GameplayObstacle';
import { interpolateAtZ } from './SlidingGateObstacle';

export class IrisObstacle {
  readonly id: string;
  readonly type = 'iris' as const;
  readonly group = new THREE.Group();
  z = GAME_TUNING.rotor.z;
  active = false;
  openingRadius = 1.4;
  private config: IrisConfig | null = null;
  private visual: THREE.Group | null = null;
  private environment: EnvironmentId = 'workshop';
  private centerX = GAME_TUNING.iris.center.x;
  private centerY = GAME_TUNING.iris.center.y;

  constructor(id: string) {
    this.id = id;
    this.group.visible = false;
  }

  applyConfig(config: IrisConfig, environment: EnvironmentId): void {
    this.config = config;
    this.active = true;
    this.group.visible = true;
    this.z = config.z;
    this.centerX = config.centerX ?? GAME_TUNING.iris.center.x;
    this.centerY = config.centerY ?? GAME_TUNING.iris.center.y;
    if (!this.visual || environment !== this.environment) {
      this.environment = environment;
      this.visual = replaceVisual(this.group, this.visual, createIrisVisual(environment));
    }
    this.update(0, 0);
  }

  hide(): void {
    this.active = false;
    this.group.visible = false;
    this.config = null;
  }

  update(_dt: number, elapsedTime: number): void {
    if (!this.active || !this.config) {
      return;
    }
    this.openingRadius = irisRadiusAt(this.config, elapsedTime);
    this.group.position.set(this.centerX, this.centerY, this.z);
    if (this.visual) {
      layoutIrisVisual(this.visual, this.openingRadius);
    }
  }

  testProjectileCrossing(
    previous: THREE.Vector3,
    current: THREE.Vector3,
    projectileRadius: number,
  ): ObstacleCollisionResult | null {
    if (!this.active || !this.config || previous.z >= this.z || current.z < this.z) {
      return null;
    }
    const at = interpolateAtZ(previous, current, this.z);
    return evaluateIrisCollision(
      at.x,
      at.y,
      projectileRadius,
      this.centerX,
      this.centerY,
      this.openingRadius,
    );
  }

  predictState(deltaSeconds: number, simTime: number): ObstaclePredictedState {
    const config = this.config;
    const predicted = emptyPredictedState(this.type, this.z);
    predicted.x = this.centerX;
    predicted.y = this.centerY;
    predicted.openingX = this.centerX;
    predicted.openingY = this.centerY;
    predicted.openingRadius = config ? irisRadiusAt(config, simTime + deltaSeconds) : this.openingRadius;
    return predicted;
  }

  evaluateAt(
    x: number,
    y: number,
    projectileRadius: number,
    predicted: ObstaclePredictedState,
  ): ObstacleCollisionResult {
    return evaluateIrisCollision(
      x,
      y,
      projectileRadius,
      predicted.x,
      predicted.y,
      predicted.openingRadius,
    );
  }

  getDebugInfo(): ObstacleDebugInfo {
    const predicted = this.predictState(0, 0);
    return {
      ...predicted,
      openingRadius: this.openingRadius,
      speed: this.config?.speed ?? 0,
      extra: `r${this.openingRadius.toFixed(2)}`,
    };
  }
}

export function irisRadiusAt(config: IrisConfig, elapsedTime: number): number {
  const t = (Math.sin(elapsedTime * config.speed + (config.phase ?? 0)) + 1) / 2;
  return lerp(config.minRadius, config.maxRadius, t);
}
