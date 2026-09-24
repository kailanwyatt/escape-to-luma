import {sequenceHousing} from './EncounterArt';
import {disposeThreeObject} from '../utils/disposeThree';
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
  private sequenceArt:THREE.Group|null=null;
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
    if(this.sequenceArt){this.group.remove(this.sequenceArt);disposeThreeObject(this.sequenceArt);this.sequenceArt=null;}
    if(config.sequenceIndex!==undefined){this.sequenceArt=sequenceHousing(config.sequenceIndex);this.group.add(this.sequenceArt);}
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
      // Cyan = throw window; amber = closing; red = sealed vs Spark.
      const aperture = this.visual.getObjectByName('aperture') as THREE.Mesh | undefined;
      const mat = aperture?.material;
      if (mat && 'color' in mat) {
        const sealed = this.openingRadius < GAME_TUNING.projectile.radius + 0.06;
        const tight = this.openingRadius < GAME_TUNING.projectile.radius + 0.35;
        const color = sealed ? 0xff7562 : tight ? 0xffb449 : 0x70e5ed;
        (mat as THREE.MeshBasicMaterial | THREE.MeshStandardMaterial).color.setHex(color);
        if ('emissive' in mat) {
          (mat as THREE.MeshStandardMaterial).emissive.setHex(color);
          (mat as THREE.MeshStandardMaterial).emissiveIntensity = sealed ? 1.15 : tight ? 1.05 : 0.75;
        }
      }
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
  const wave = (Math.sin(elapsedTime * config.speed + (config.phase ?? 0)) + 1) / 2;
  // Square the envelope so the sealed end of travel holds longer (readable shutter).
  const t = wave * wave;
  return lerp(config.minRadius, config.maxRadius, t);
}
