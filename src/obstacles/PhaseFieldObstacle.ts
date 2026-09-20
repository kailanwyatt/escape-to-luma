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

export class PhaseFieldObstacle {
  readonly id: string;
  readonly type = 'phaseField' as const;
  readonly group = new THREE.Group();
  z = GAME_TUNING.rotor.z;
  active = false;
  open = true;
  private config: PhaseFieldConfig | null = null;
  private mesh: THREE.Mesh | null = null;

  constructor(id: string) {
    this.id = id;
    this.group.visible = false;
  }

  applyConfig(config: PhaseFieldConfig, _environment: EnvironmentId): void {
    this.config = config;
    this.active = true;
    this.group.visible = true;
    this.z = config.z;
    if (!this.mesh) {
      this.mesh = new THREE.Mesh(
        new THREE.CircleGeometry(1, 32),
        new THREE.MeshBasicMaterial({
          color: 0xb07cff,
          transparent: true,
          opacity: 0.35,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      this.group.add(this.mesh);
    }
    this.mesh.scale.setScalar(config.fieldRadius);
    this.group.position.set(config.centerX, config.centerY, config.z);
    this.update(0, 0);
  }

  hide(): void {
    this.active = false;
    this.group.visible = false;
    this.config = null;
  }

  update(_dt: number, elapsedTime: number): void {
    if (!this.active || !this.config || !this.mesh) {
      return;
    }
    this.open = phaseOpen(this.config, elapsedTime);
    const material = this.mesh.material as THREE.MeshBasicMaterial;
    material.opacity = this.open ? 0.12 : 0.55;
    material.color.setHex(this.open ? 0x7ef0ff : 0xff5d6c);
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

export function phaseOpen(config: PhaseFieldConfig, elapsedTime: number): boolean {
  const ratio = config.openRatio ?? 0.45;
  const cycle = ((elapsedTime * config.speed + (config.phase ?? 0)) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
  return cycle / (Math.PI * 2) < ratio;
}
