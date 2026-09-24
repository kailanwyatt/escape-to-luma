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
import { createReadableBlocker } from './ReadableBlockerVisual';
import { interpolateAtZ } from './SlidingGateObstacle';
import { disposeThreeObject } from '../utils/disposeThree';

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
  private body: THREE.Mesh | null = null;
  private path: THREE.Mesh | null = null;
  private environment: EnvironmentId = 'workshop';

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

    const needsBody = !this.body || environment !== this.environment;
    if (needsBody) {
      if (this.body) {
        this.group.remove(this.body);
        disposeThreeObject(this.body);
        this.body = null;
      }
      this.environment = environment;
      this.body = createReadableBlocker('drone');
      this.body.name = 'orbiter-body';
      this.group.add(this.body);
    }
    this.body!.scale.setScalar(config.blockerRadius);

    if (this.path) {
      this.group.remove(this.path);
      disposeThreeObject(this.path);
      this.path = null;
    }
    // Thin orbit cue — non-colliding, reads the satellite route without filling the lane.
    const pathMat = new THREE.MeshBasicMaterial({
      color: environment === 'space' ? 0x6cf0ff : 0xffb45a,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.path = new THREE.Mesh(
      new THREE.TorusGeometry(config.orbitRadius, Math.max(0.012, config.blockerRadius * 0.04), 8, 96),
      pathMat,
    );
    this.path.name = 'orbit-path';
    this.path.position.z = 0.08;
    this.group.add(this.path);

    this.update(0, 0);
  }

  hide(): void {
    this.active = false;
    this.group.visible = false;
    this.config = null;
  }

  update(_dt: number, elapsedTime: number): void {
    if (!this.active || !this.config || !this.body) {
      return;
    }
    const pos = orbiterPosition(this.config, elapsedTime);
    this.blockerX = pos.x;
    this.blockerY = pos.y;
    this.body.position.set(pos.x - this.config.centerX, pos.y - this.config.centerY, 0);
    // Slow spin sells a satellite mass without changing the circular hit disk.
    this.body.rotation.z = elapsedTime * 0.35 + (this.config.phase ?? 0);
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
