import * as THREE from 'three';

import type { EnvironmentId } from '../config/ChallengeConfig';
import type { LaserGridConfig } from '../config/ObstacleConfig';
import { GAME_TUNING } from '../game/gameTuning';
import {
  evaluateLaserCollision,
  laserBeamsFromLayout,
  lasersOnAt,
  type LaserBeam,
  type ObstacleCollisionResult,
} from './ObstacleCollision';
import {
  emptyPredictedState,
  type ObstacleDebugInfo,
  type ObstaclePredictedState,
} from './GameplayObstacle';
import { interpolateAtZ } from './SlidingGateObstacle';

const LASER_ON = 0xff3b3b;
const LASER_OFF = 0x4a2020;

export class LaserGridObstacle {
  readonly id: string;
  readonly type = 'laserGrid' as const;
  readonly group = new THREE.Group();
  z = GAME_TUNING.rotor.z;
  active = false;
  lasersOn = true;
  private config: LaserGridConfig | null = null;
  private baseBeams: LaserBeam[] = [];
  private beams: LaserBeam[] = [];
  private meshes: THREE.Mesh[] = [];
  private elapsed = 0;

  constructor(id: string) {
    this.id = id;
    this.group.visible = false;
  }

  applyConfig(config: LaserGridConfig, _environment: EnvironmentId): void {
    this.config = config;
    this.active = true;
    this.group.visible = true;
    this.z = config.z;
    this.elapsed = 0;
    this.clearMeshes();

    const centerX = config.centerX ?? 0;
    const centerY = config.centerY ?? 3;
    this.baseBeams = laserBeamsFromLayout({
      orientation: config.orientation,
      openingSize: config.openingSize,
      spacing: config.spacing,
      span: config.span,
      thickness: config.thickness,
      centerX,
      centerY,
    });
    this.beams = this.baseBeams.map((beam) => ({ ...beam }));

    for (const beam of this.beams) {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 0.08),
        new THREE.MeshBasicMaterial({
          color: LASER_ON,
          transparent: true,
          opacity: 0.85,
          depthWrite: false,
        }),
      );
      if (beam.orientation === 'vertical') {
        mesh.scale.set(config.thickness * 2, config.span, 1);
        mesh.position.set(beam.position, centerY, 0);
      } else {
        mesh.scale.set(config.span, config.thickness * 2, 1);
        mesh.position.set(centerX, beam.position, 0);
      }
      this.group.add(mesh);
      this.meshes.push(mesh);
    }

    this.group.position.set(0, 0, config.z);
    this.update(0, 0);
  }

  hide(): void {
    this.active = false;
    this.group.visible = false;
    this.config = null;
    this.baseBeams = [];
    this.beams = [];
    this.clearMeshes();
  }

  update(_dt: number, elapsedTime: number): void {
    if (!this.active || !this.config) {
      return;
    }
    this.elapsed = elapsedTime;
    this.lasersOn =
      (this.config.mode ?? 'static') === 'static'
        ? true
        : lasersOnAt(
            elapsedTime,
            this.config.speed ?? 0.7,
            this.config.phase ?? 0,
            this.config.onRatio ?? 0.55,
          );

    const center = this.centerAt(elapsedTime);
    const baseX = this.config.centerX ?? 0;
    const baseY = this.config.centerY ?? 3;
    const dx = center.x - baseX;
    const dy = center.y - baseY;

    for (let index = 0; index < this.meshes.length; index += 1) {
      const mesh = this.meshes[index];
      const base = this.baseBeams[index];
      const beam = this.beams[index];
      beam.position =
        base.position + (beam.orientation === 'vertical' ? dx : dy);
      beam.centerX = base.centerX + dx;
      beam.centerY = base.centerY + dy;
      if (beam.orientation === 'vertical') {
        mesh.position.set(beam.position, beam.centerY, 0);
      } else {
        mesh.position.set(beam.centerX, beam.position, 0);
      }
      const material = mesh.material as THREE.MeshBasicMaterial;
      material.color.setHex(this.lasersOn ? LASER_ON : LASER_OFF);
      material.opacity = this.lasersOn ? 0.9 : 0.18;
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
    return evaluateLaserCollision(at.x, at.y, projectileRadius, this.beams, this.lasersOn);
  }

  predictState(deltaSeconds: number, simTime: number): ObstaclePredictedState {
    const predicted = emptyPredictedState(this.type, this.z);
    if (!this.config) {
      return predicted;
    }
    const on =
      (this.config.mode ?? 'static') === 'static'
        ? true
        : lasersOnAt(
            simTime + deltaSeconds,
            this.config.speed ?? 0.7,
            this.config.phase ?? 0,
            this.config.onRatio ?? 0.55,
          );
    const center = this.centerAt(simTime + deltaSeconds);
    predicted.openingX = center.x;
    predicted.openingY = center.y;
    predicted.openingWidth = this.config.openingSize;
    predicted.openingHeight = this.config.openingSize;
    // Encode on/off for trajectory: large opening when off.
    predicted.openingRadius = on ? this.config.openingSize / 2 : 99;
    return predicted;
  }

  evaluateAt(
    x: number,
    y: number,
    projectileRadius: number,
    predicted: ObstaclePredictedState,
  ): ObstacleCollisionResult {
    const on = predicted.openingRadius < 50;
    if (!this.config) {
      return { hit: null, nearMiss: false, clearance: 1 };
    }
    const beams = laserBeamsFromLayout({
      orientation: this.config.orientation,
      openingSize: this.config.openingSize,
      spacing: this.config.spacing,
      span: this.config.span,
      thickness: this.config.thickness,
      centerX: predicted.openingX,
      centerY: predicted.openingY,
    });
    return evaluateLaserCollision(x, y, projectileRadius, beams, on);
  }

  getDebugInfo(): ObstacleDebugInfo {
    const predicted = this.predictState(0, this.elapsed);
    return {
      ...predicted,
      speed: this.config?.speed ?? 0,
      extra: `${this.config?.orientation ?? '?'} ${this.lasersOn ? 'ON' : 'OFF'} n${this.beams.length}`,
    };
  }

  private centerAt(elapsedTime: number): { x: number; y: number } {
    const config = this.config;
    const x = config?.centerX ?? 0;
    const y = config?.centerY ?? 3;
    const movement = config?.movement;
    if (!movement || movement.amplitude === 0) {
      return { x, y };
    }
    const angle = elapsedTime * movement.speed + (movement.phase ?? 0);
    const offset = Math.sin(angle) * movement.amplitude;
    if (movement.axis === 'horizontal') {
      return { x: x + offset, y };
    }
    if (movement.axis === 'vertical') {
      return { x, y: y + offset };
    }
    return {
      x: x + offset,
      y: y + Math.cos(angle) * movement.amplitude * 0.65,
    };
  }

  private clearMeshes(): void {
    for (const mesh of this.meshes) {
      this.group.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
    this.meshes = [];
  }
}
