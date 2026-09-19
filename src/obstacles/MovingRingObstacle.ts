import * as THREE from 'three';

import type { EnvironmentId } from '../config/ChallengeConfig';
import type { MovingRingConfig } from '../config/ObstacleConfig';
import { GAME_TUNING } from '../game/gameTuning';
import {
  createRingVisual,
  layoutRingVisual,
  replaceVisual,
} from './ObstacleVisuals';
import { evaluateRingCollision, type ObstacleCollisionResult } from './ObstacleCollision';
import {
  emptyPredictedState,
  type ObstacleDebugInfo,
  type ObstaclePredictedState,
} from './GameplayObstacle';
import { interpolateAtZ } from './SlidingGateObstacle';

export class MovingRingObstacle {
  readonly id: string;
  readonly type = 'movingRing' as const;
  readonly group = new THREE.Group();
  z = GAME_TUNING.rotor.z;
  active = false;
  centerX = 0;
  centerY = 3;
  private config: MovingRingConfig | null = null;
  private visual: THREE.Group | null = null;
  private environment: EnvironmentId = 'workshop';
  private lastRadius = 0;

  constructor(id: string) {
    this.id = id;
    this.group.visible = false;
  }

  applyConfig(config: MovingRingConfig, environment: EnvironmentId): void {
    this.config = config;
    this.active = true;
    this.group.visible = true;
    this.z = config.z;
    if (!this.visual || environment !== this.environment) {
      this.environment = environment;
      this.visual = replaceVisual(this.group, this.visual, createRingVisual(environment));
      this.lastRadius = 0;
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
    const pos = ringPosition(this.config, elapsedTime);
    this.centerX = pos.x;
    this.centerY = pos.y;
    this.group.position.set(pos.x, pos.y, this.z);
    if (this.visual && Math.abs(this.lastRadius - this.config.radius) > 0.001) {
      layoutRingVisual(this.visual, this.config.radius);
      this.lastRadius = this.config.radius;
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
    return evaluateRingCollision(
      at.x,
      at.y,
      projectileRadius,
      this.centerX,
      this.centerY,
      this.config.radius,
    );
  }

  predictState(deltaSeconds: number, simTime: number): ObstaclePredictedState {
    const config = this.config;
    const predicted = emptyPredictedState(this.type, this.z);
    if (!config) {
      return predicted;
    }
    const pos = ringPosition(config, simTime + deltaSeconds);
    predicted.x = pos.x;
    predicted.y = pos.y;
    predicted.openingX = pos.x;
    predicted.openingY = pos.y;
    predicted.openingRadius = config.radius;
    return predicted;
  }

  evaluateAt(
    x: number,
    y: number,
    projectileRadius: number,
    predicted: ObstaclePredictedState,
  ): ObstacleCollisionResult {
    return evaluateRingCollision(
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
      x: this.centerX,
      y: this.centerY,
      openingRadius: this.config?.radius ?? 0,
      speed: this.config?.movement.speed ?? 0,
      extra: `${this.config?.movement.type ?? '-'} r${(this.config?.radius ?? 0).toFixed(2)}`,
    };
  }
}

export function ringPosition(config: MovingRingConfig, elapsedTime: number) {
  const move = config.movement;
  const t = elapsedTime * move.speed + (move.phase ?? 0);
  if (move.type === 'vertical') {
    return { x: config.baseX, y: config.baseY + Math.sin(t) * move.amplitudeY };
  }
  if (move.type === 'ellipse') {
    return {
      x: config.baseX + Math.cos(t) * move.amplitudeX,
      y: config.baseY + Math.sin(t) * move.amplitudeY,
    };
  }
  return { x: config.baseX + Math.sin(t) * move.amplitudeX, y: config.baseY };
}
