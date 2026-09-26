import * as THREE from 'three';
import type { EnvironmentId } from '../config/ChallengeConfig';
import type { OrbiterConfig } from '../config/ObstacleConfig';
import { GAME_TUNING } from '../game/gameTuning';
import { evaluateBlockerCollision, type ObstacleCollisionResult } from './ObstacleCollision';
import {
  emptyPredictedState,
  type ObstacleDebugInfo,
  type ObstaclePredictedState,
} from './GameplayObstacle';
import { interpolateAtZ } from './SlidingGateObstacle';
import { OrbiterArt } from './OrbiterArt';

/** Centered root: orbit path stays fixed while the satellite body rides the ring. */
export class OrbiterObstacle {
  readonly id: string;
  readonly type = 'orbiter' as const;
  readonly group = new THREE.Group();
  z = GAME_TUNING.rotor.z;
  active = false;
  blockerX = 0;
  blockerY = 3;
  private config: OrbiterConfig | null = null;
  private art: OrbiterArt | null = null;

  constructor(id: string) {
    this.id = id;
    this.group.name = 'orbiter';
    this.group.visible = false;
  }

  applyConfig(config: OrbiterConfig, environment: EnvironmentId): void {
    this.config = config;
    this.active = true;
    this.group.visible = true;
    this.z = config.z;
    this.group.position.set(config.centerX, config.centerY, config.z);

    if (this.art) {
      this.group.remove(this.art.group);
      this.art.dispose();
      this.art = null;
    }
    this.art = new OrbiterArt(config, environment);
    this.group.add(this.art.group);
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
    const pos = orbiterPosition(this.config, elapsedTime);
    this.blockerX = pos.x;
    this.blockerY = pos.y;
    this.art.update(elapsedTime);
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
    return evaluateBlockerCollision(
      at.x,
      at.y,
      projectileRadius,
      this.blockerX,
      this.blockerY,
      this.config.blockerRadius,
      'orbiter',
    );
  }

  predictState(deltaSeconds: number, simTime: number): ObstaclePredictedState {
    const predicted = emptyPredictedState(this.type, this.z);
    if (!this.config) {
      return predicted;
    }
    const pos = orbiterPosition(this.config, simTime + deltaSeconds);
    predicted.blockerX = pos.x;
    predicted.blockerY = pos.y;
    predicted.blockerRadius = this.config.blockerRadius;
    predicted.x = pos.x;
    predicted.y = pos.y;
    return predicted;
  }

  evaluateAt(
    x: number,
    y: number,
    projectileRadius: number,
    predicted: ObstaclePredictedState,
  ): ObstacleCollisionResult {
    return evaluateBlockerCollision(
      x,
      y,
      projectileRadius,
      predicted.blockerX,
      predicted.blockerY,
      predicted.blockerRadius,
      'orbiter',
    );
  }

  getDebugInfo(): ObstacleDebugInfo {
    const predicted = this.predictState(0, 0);
    return {
      ...predicted,
      speed: this.config?.speed ?? 0,
      extra: `orb r${(this.config?.orbitRadius ?? 0).toFixed(2)}`,
    };
  }
}

export function orbiterPosition(config: OrbiterConfig, elapsedTime: number) {
  const t = elapsedTime * config.speed + (config.phase ?? 0);
  return {
    x: config.centerX + Math.cos(t) * config.orbitRadius,
    y: config.centerY + Math.sin(t) * config.orbitRadius,
  };
}
