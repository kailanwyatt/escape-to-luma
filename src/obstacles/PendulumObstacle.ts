import * as THREE from 'three';

import type { EnvironmentId } from '../config/ChallengeConfig';
import type { PendulumConfig } from '../config/ObstacleConfig';
import { GAME_TUNING } from '../game/gameTuning';
import {
  createPendulumVisual,
  layoutPendulumVisual,
  replaceVisual,
} from './ObstacleVisuals';
import { evaluatePendulumCollision, type ObstacleCollisionResult } from './ObstacleCollision';
import {
  emptyPredictedState,
  type ObstacleDebugInfo,
  type ObstaclePredictedState,
} from './GameplayObstacle';
import { interpolateAtZ } from './SlidingGateObstacle';

export class PendulumObstacle {
  readonly id: string;
  readonly type = 'pendulum' as const;
  readonly group = new THREE.Group();
  z = GAME_TUNING.rotor.z;
  active = false;
  angle = 0;
  blockerX = 0;
  blockerY = 3;
  private config: PendulumConfig | null = null;
  private visual: THREE.Group | null = null;
  private environment: EnvironmentId = 'workshop';

  constructor(id: string) {
    this.id = id;
    this.group.visible = false;
  }

  applyConfig(config: PendulumConfig, environment: EnvironmentId): void {
    this.config = config;
    this.active = true;
    this.group.visible = true;
    this.z = config.z;
    if (!this.visual || environment !== this.environment) {
      this.environment = environment;
      this.visual = replaceVisual(this.group, this.visual, createPendulumVisual(environment));
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
    const pose = pendulumPose(this.config, elapsedTime);
    this.angle = pose.angle;
    this.blockerX = pose.blockerX;
    this.blockerY = pose.blockerY;
    this.group.position.set(0, 0, this.z);
    if (this.visual) {
      layoutPendulumVisual(
        this.visual,
        this.config.pivotX,
        this.config.pivotY,
        pose.blockerX,
        pose.blockerY,
        this.config.blockerRadius,
        this.config.length,
      );
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
    return evaluatePendulumCollision(
      at.x,
      at.y,
      projectileRadius,
      this.config.pivotX,
      this.config.pivotY,
      this.blockerX,
      this.blockerY,
      this.config.blockerRadius,
      GAME_TUNING.pendulum.armRadius,
    );
  }

  predictState(deltaSeconds: number, simTime: number): ObstaclePredictedState {
    const config = this.config;
    const predicted = emptyPredictedState(this.type, this.z);
    if (!config) {
      return predicted;
    }
    const pose = pendulumPose(config, simTime + deltaSeconds);
    predicted.x = pose.blockerX;
    predicted.y = pose.blockerY;
    predicted.angle = pose.angle;
    predicted.blockerX = pose.blockerX;
    predicted.blockerY = pose.blockerY;
    predicted.blockerRadius = config.blockerRadius;
    predicted.pivotX = config.pivotX;
    predicted.pivotY = config.pivotY;
    predicted.length = config.length;
    return predicted;
  }

  evaluateAt(
    x: number,
    y: number,
    projectileRadius: number,
    predicted: ObstaclePredictedState,
  ): ObstacleCollisionResult {
    return evaluatePendulumCollision(
      x,
      y,
      projectileRadius,
      predicted.pivotX,
      predicted.pivotY,
      predicted.blockerX,
      predicted.blockerY,
      predicted.blockerRadius,
      GAME_TUNING.pendulum.armRadius,
    );
  }

  getDebugInfo(): ObstacleDebugInfo {
    const predicted = this.predictState(0, 0);
    return {
      ...predicted,
      angle: this.angle,
      blockerX: this.blockerX,
      blockerY: this.blockerY,
      speed: this.config?.speed ?? 0,
      extra: `a${this.angle.toFixed(2)} b${this.config?.blockerRadius.toFixed(2) ?? '0'}`,
    };
  }
}

export function pendulumPose(config: PendulumConfig, elapsedTime: number) {
  const angle = Math.sin(elapsedTime * config.speed + (config.phase ?? 0)) * config.maxAngle;
  return {
    angle,
    blockerX: config.pivotX + Math.sin(angle) * config.length,
    blockerY: config.pivotY - Math.cos(angle) * config.length,
  };
}
