import * as THREE from 'three';

import type { EnvironmentId } from '../config/ChallengeConfig';
import type { SlidingGateConfig } from '../config/ObstacleConfig';
import { GAME_TUNING } from '../game/gameTuning';
import {
  createGateVisual,
  layoutGateVisual,
  replaceVisual,
} from './ObstacleVisuals';
import { evaluateGateCollision, type ObstacleCollisionResult } from './ObstacleCollision';
import {
  emptyPredictedState,
  type ObstacleDebugInfo,
  type ObstaclePredictedState,
} from './GameplayObstacle';

export class SlidingGateObstacle {
  readonly id: string;
  readonly type = 'slidingGate' as const;
  readonly group = new THREE.Group();
  z = GAME_TUNING.rotor.z;
  active = false;
  private config: SlidingGateConfig | null = null;
  private visual: THREE.Group | null = null;
  private environment: EnvironmentId = 'workshop';
  private appearance: NonNullable<SlidingGateConfig['appearance']> = 'standard';
  private elapsed = 0;
  openingX = 0;
  openingY = GAME_TUNING.gate.baseY;

  constructor(id: string) {
    this.id = id;
    this.group.visible = false;
  }

  applyConfig(config: SlidingGateConfig, environment: EnvironmentId): void {
    this.config = config;
    this.active = true;
    this.group.visible = true;
    this.z = config.z;
    this.elapsed = 0;
    this.openingY = config.baseY ?? GAME_TUNING.gate.baseY;
    const appearance = config.appearance ?? 'standard';
    if (
      !this.visual ||
      environment !== this.environment ||
      appearance !== this.appearance
    ) {
      this.environment = environment;
      this.appearance = appearance;
      this.visual = replaceVisual(
        this.group,
        this.visual,
        createGateVisual(environment, appearance),
      );
    }
    this.update(0, 0);
  }

  hide(): void {
    this.active = false;
    this.group.visible = false;
    this.config = null;
  }

  update(dt: number, elapsedTime: number): void {
    if (!this.active || !this.config) {
      return;
    }
    this.elapsed += dt;
    const time = elapsedTime;
    this.openingX =
      this.config.baseX +
      Math.sin(time * this.config.speed + (this.config.phase ?? 0)) * this.config.amplitude;
    this.group.position.set(0, 0, this.z);
    if (this.visual) {
      layoutGateVisual(
        this.visual,
        this.openingX,
        this.openingY,
        this.config.openingWidth,
        this.config.openingHeight,
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
    return evaluateGateCollision(
      at.x,
      at.y,
      projectileRadius,
      this.openingX,
      this.openingY,
      this.config.openingWidth,
      this.config.openingHeight,
    );
  }

  predictState(deltaSeconds: number, simTime: number): ObstaclePredictedState {
    const config = this.config;
    const predicted = emptyPredictedState(this.type, this.z);
    if (!config) {
      return predicted;
    }
    const openingX =
      config.baseX +
      Math.sin((simTime + deltaSeconds) * config.speed + (config.phase ?? 0)) * config.amplitude;
    predicted.x = openingX;
    predicted.y = this.openingY;
    predicted.openingX = openingX;
    predicted.openingY = this.openingY;
    predicted.openingWidth = config.openingWidth;
    predicted.openingHeight = config.openingHeight;
    return predicted;
  }

  evaluateAt(
    x: number,
    y: number,
    projectileRadius: number,
    predicted: ObstaclePredictedState,
  ): ObstacleCollisionResult {
    return evaluateGateCollision(
      x,
      y,
      projectileRadius,
      predicted.openingX,
      predicted.openingY,
      predicted.openingWidth,
      predicted.openingHeight,
    );
  }

  getDebugInfo(): ObstacleDebugInfo {
    const predicted = this.predictState(0, this.elapsed);
    return {
      ...predicted,
      speed: this.config?.speed ?? 0,
      extra: `w${(this.config?.openingWidth ?? 0).toFixed(2)} h${(this.config?.openingHeight ?? 0).toFixed(2)} x${this.openingX.toFixed(2)}`,
    };
  }
}

export function interpolateAtZ(
  previous: { x: number; y: number; z: number },
  current: { x: number; y: number; z: number },
  z: number,
): THREE.Vector3 {
  const span = current.z - previous.z;
  const t = span === 0 ? 1 : (z - previous.z) / span;
  return new THREE.Vector3(
    previous.x + (current.x - previous.x) * t,
    previous.y + (current.y - previous.y) * t,
    z,
  );
}
