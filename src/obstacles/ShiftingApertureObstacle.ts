import * as THREE from 'three';

import type { EnvironmentId } from '../config/ChallengeConfig';
import type { ShiftingApertureConfig } from '../config/ObstacleConfig';
import { GAME_TUNING } from '../game/gameTuning';
import { evaluateIrisCollision, type ObstacleCollisionResult } from './ObstacleCollision';
import {
  emptyPredictedState,
  type ObstacleDebugInfo,
  type ObstaclePredictedState,
} from './GameplayObstacle';
import { interpolateAtZ } from './SlidingGateObstacle';

export class ShiftingApertureObstacle {
  readonly id: string;
  readonly type = 'shiftingAperture' as const;
  readonly group = new THREE.Group();
  z = GAME_TUNING.rotor.z;
  active = false;
  centerX = 0;
  centerY = 3;
  openingRadius = 1;
  private config: ShiftingApertureConfig | null = null;
  private rim: THREE.Mesh | null = null;
  private hole: THREE.Mesh | null = null;

  constructor(id: string) {
    this.id = id;
    this.group.visible = false;
  }

  applyConfig(config: ShiftingApertureConfig, environment: EnvironmentId): void {
    this.config = config;
    this.active = true;
    this.group.visible = true;
    this.z = config.z;
    if (!this.rim) {
      const accent = environment === 'space' ? 0xffd24a : 0xd06a32;
      this.rim = new THREE.Mesh(
        new THREE.RingGeometry(0.85, 1.05, 32),
        new THREE.MeshLambertMaterial({
          color: accent,
          side: THREE.DoubleSide,
          emissive: environment === 'space' ? accent : 0x000000,
          emissiveIntensity: environment === 'space' ? 0.35 : 0,
        }),
      );
      this.hole = new THREE.Mesh(
        new THREE.CircleGeometry(1, 28),
        new THREE.MeshBasicMaterial({
          color: 0x0a0807,
          transparent: true,
          opacity: 0.55,
          side: THREE.DoubleSide,
        }),
      );
      this.group.add(this.rim, this.hole);
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
    const state = apertureState(this.config, elapsedTime);
    this.centerX = state.x;
    this.centerY = state.y;
    this.openingRadius = state.radius;
    this.group.position.set(state.x, state.y, this.z);
    const outer = Math.max(state.radius + 0.35, 1.2);
    if (this.rim) {
      this.rim.geometry.dispose();
      this.rim.geometry = new THREE.RingGeometry(state.radius, outer, 32);
    }
    if (this.hole) {
      this.hole.scale.setScalar(Math.max(0.15, state.radius));
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
    const result = evaluateIrisCollision(
      at.x,
      at.y,
      projectileRadius,
      this.centerX,
      this.centerY,
      this.openingRadius,
    );
    if (result.hit) {
      return { ...result, hit: 'aperture' };
    }
    return result;
  }

  predictState(deltaSeconds: number, simTime: number): ObstaclePredictedState {
    const predicted = emptyPredictedState(this.type, this.z);
    if (!this.config) {
      return predicted;
    }
    const state = apertureState(this.config, simTime + deltaSeconds);
    predicted.openingX = state.x;
    predicted.openingY = state.y;
    predicted.openingRadius = state.radius;
    predicted.x = state.x;
    predicted.y = state.y;
    return predicted;
  }

  evaluateAt(
    x: number,
    y: number,
    projectileRadius: number,
    predicted: ObstaclePredictedState,
  ): ObstacleCollisionResult {
    const result = evaluateIrisCollision(
      x,
      y,
      projectileRadius,
      predicted.openingX,
      predicted.openingY,
      predicted.openingRadius,
    );
    if (result.hit) {
      return { ...result, hit: 'aperture' };
    }
    return result;
  }

  getDebugInfo(): ObstacleDebugInfo {
    const predicted = this.predictState(0, 0);
    return {
      ...predicted,
      speed: this.config?.shiftSpeed ?? 0,
      extra: `ap r${this.openingRadius.toFixed(2)}`,
    };
  }
}

export function apertureState(config: ShiftingApertureConfig, elapsedTime: number) {
  const pulse = (Math.sin(elapsedTime * config.pulseSpeed + (config.phase ?? 0)) + 1) / 2;
  const radius = config.minRadius + (config.maxRadius - config.minRadius) * pulse;
  const shift = Math.sin(elapsedTime * config.shiftSpeed + (config.phase ?? 0) * 0.7) * config.shiftAmplitude;
  return {
    x: config.baseX + shift,
    y: config.baseY,
    radius,
  };
}
