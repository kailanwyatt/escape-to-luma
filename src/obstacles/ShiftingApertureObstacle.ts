import {ancientSurface} from '../graphics/AncientSurface';
import {createOrbitalIris,layoutOrbitalIris} from './OrbitalIrisVisual';
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
  private visual: THREE.Group | null = null;
  private openingWash: THREE.Mesh | null = null;
  private shiftTicks: THREE.Mesh[] = [];

  constructor(id: string) {
    this.id = id;
    this.group.visible = false;
  }

  applyConfig(config: ShiftingApertureConfig, environment: EnvironmentId): void {
    this.config = config;
    this.active = true;
    this.group.visible = true;
    this.z = config.z;
    if (!this.visual) {
      this.visual=createOrbitalIris();
      const carved=ancientSurface();
      this.visual.traverse(object=>{
        if(object instanceof THREE.Mesh && object.material instanceof THREE.MeshPhongMaterial){
          object.material.map=carved;object.material.bumpMap=carved;object.material.bumpScale=.035;
          object.material.color.setHex(object.name.startsWith('petal')?0x697071:0x9d865e);
          object.material.shininess=35;
        }
      });
      const edge=this.visual.getObjectByName('aperture') as THREE.Mesh;
      (edge.material as THREE.MeshBasicMaterial).color.setHex(0xffcf70);
      this.visual.traverse(object=>{
        if(object instanceof THREE.Mesh && object.material instanceof THREE.MeshBasicMaterial && object.material.color.getHex()===0x92e8f2)object.material.color.setHex(0xffcf70);
      });
      this.group.add(this.visual);

      // Safe-hole wash lives on the group (not inside iris children) so petal geometry stays authoritative.
      this.openingWash = new THREE.Mesh(
        new THREE.RingGeometry(0.15, 1, 48),
        new THREE.MeshBasicMaterial({
          color: 0xffcf70,
          transparent: true,
          opacity: 0.18,
          depthWrite: false,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
        }),
      );
      this.openingWash.name = 'aperture-wash';
      this.openingWash.position.z = 0.04;
      this.group.add(this.openingWash);

      for (const side of [-1, 1] as const) {
        const tick = new THREE.Mesh(
          new THREE.BoxGeometry(0.14, 0.04, 0.03),
          new THREE.MeshBasicMaterial({
            color: 0xffcf70,
            transparent: true,
            opacity: 0.55,
            depthWrite: false,
          }),
        );
        tick.name = `shift-tick-${side > 0 ? 'right' : 'left'}`;
        tick.userData.side = side;
        this.shiftTicks.push(tick);
        this.group.add(tick);
      }
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
    if(this.visual)layoutOrbitalIris(this.visual,state.radius);
    if (this.openingWash) {
      const openT = Math.min(1, Math.max(0.15, state.radius / Math.max(0.2, this.config.maxRadius)));
      this.openingWash.scale.setScalar(state.radius);
      (this.openingWash.material as THREE.MeshBasicMaterial).opacity = 0.12 + openT * 0.16;
    }
    // Lateral ticks mark travel of the shifting center (amplitude cue, not collision).
    const amp = this.config.shiftAmplitude;
    for (const tick of this.shiftTicks) {
      const side = tick.userData.side as number;
      tick.position.set(side * (amp + state.radius * 0.15), 0, -0.06);
      tick.visible = amp > 0.05;
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
