import * as THREE from 'three';

import type { EnvironmentId } from '../config/ChallengeConfig';
import type { PhaseFieldConfig } from '../config/ObstacleConfig';
import { GAME_TUNING } from '../game/gameTuning';
import { evaluatePhaseCollision, type ObstacleCollisionResult } from './ObstacleCollision';
import {
  emptyPredictedState,
  type ObstacleDebugInfo,
  type ObstaclePredictedState,
} from './GameplayObstacle';
import { interpolateAtZ } from './SlidingGateObstacle';
import { PhaseFieldArt } from './PhaseFieldArt';
import { phaseOpen } from './PhaseFieldState';

/**
 * Phase membrane — solid when closed (warm), faint passable ghost when open (cyan).
 * Open/closed windows stay authoritative via phaseOpen(); art only teaches the state.
 */
export class PhaseFieldObstacle {
  readonly id: string;
  readonly type = 'phaseField' as const;
  readonly group = new THREE.Group();
  z = GAME_TUNING.rotor.z;
  active = false;
  open = true;
  private config: PhaseFieldConfig | null = null;
  private art: PhaseFieldArt | null = null;

  constructor(id: string) {
    this.id = id;
    this.group.visible = false;
  }

  applyConfig(config: PhaseFieldConfig, _environment: EnvironmentId): void {
    this.config = config;
    this.active = true;
    this.group.visible = true;
    this.z = config.z;
    if (this.art) {
      this.group.remove(this.art.group);
      this.art.dispose();
      this.art = null;
    }
    this.art = new PhaseFieldArt(config);
    this.group.add(this.art.group);
    this.group.position.set(config.centerX, config.centerY, config.z);
    this.update(0, 0);
  }

  hide(): void {
    this.active = false;
    this.group.visible = false;
    this.config = null;
  }

  update(_dt: number, elapsedTime: number): void {
    if (!this.active || !this.config || !this.art) {
      return;
    }
    this.art.update(elapsedTime);
    this.open = this.art.open;
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
    return evaluatePhaseCollision(
      at.x,
      at.y,
      projectileRadius,
      this.config.centerX,
      this.config.centerY,
      this.config.fieldRadius,
      this.open,
    );
  }

  predictState(deltaSeconds: number, simTime: number): ObstaclePredictedState {
    const predicted = emptyPredictedState(this.type, this.z);
    if (!this.config) {
      return predicted;
    }
    const open = phaseOpen(this.config, simTime + deltaSeconds);
    predicted.openingX = this.config.centerX;
    predicted.openingY = this.config.centerY;
    predicted.openingRadius = open ? 99 : 0;
    predicted.x = this.config.centerX;
    predicted.y = this.config.centerY;
    return predicted;
  }

  evaluateAt(
    x: number,
    y: number,
    projectileRadius: number,
    predicted: ObstaclePredictedState,
  ): ObstacleCollisionResult {
    const open = predicted.openingRadius > 10;
    return evaluatePhaseCollision(
      x,
      y,
      projectileRadius,
      predicted.openingX,
      predicted.openingY,
      this.config?.fieldRadius ?? 2,
      open,
    );
  }

  getDebugInfo(): ObstacleDebugInfo {
    const predicted = this.predictState(0, 0);
    return {
      ...predicted,
      speed: this.config?.speed ?? 0,
      extra: this.open ? 'OPEN' : 'CLOSED',
    };
  }
}

export { phaseOpen } from './PhaseFieldState';
