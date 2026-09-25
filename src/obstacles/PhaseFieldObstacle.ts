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
  private mesh: THREE.Mesh | null = null;
  private ghost: THREE.Mesh | null = null;
  private warning: THREE.Group | null = null;
  private boundary: THREE.Mesh | null = null;
  private readonly solidUniforms = {
    intensity: { value: 1 },
    time: { value: 0 },
  };

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
        new THREE.CircleGeometry(1, 48),
        new THREE.ShaderMaterial({
          transparent: true,
          side: THREE.DoubleSide,
          depthWrite: false,
          uniforms: this.solidUniforms,
          vertexShader: `varying vec2 v;void main(){v=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
          fragmentShader: `precision mediump float;varying vec2 v;uniform float intensity;uniform float time;
          void main(){float r=length(v),a=atan(v.y,v.x);
            float threads=pow(.5+.5*sin(r*65.+sin(a*7.)*2.4+time*.8),14.);
            float veins=pow(.5+.5*sin(a*17.+r*9.+sin(r*23.)),22.);
            float rim=smoothstep(.87,1.,r);float energy=max(threads*.45,veins*.3)+rim*.65;
            vec3 c=mix(vec3(.38,.025,.12),vec3(1.,.44,.4),energy);
            gl_FragColor=vec4(c,(.14+energy*.62)*intensity);}`,
        }),
      );
      this.mesh.name = 'phase-solid';
      this.group.add(this.mesh);

      this.ghost = new THREE.Mesh(
        new THREE.CircleGeometry(1, 48),
        new THREE.MeshBasicMaterial({
          color: 0x7ef0ff,
          transparent: true,
          opacity: 0.12,
          depthWrite: false,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
        }),
      );
      this.ghost.name = 'phase-ghost';
      this.ghost.position.z = 0.01;
      this.group.add(this.ghost);

      this.warning = new THREE.Group();
      this.warning.name = 'phase-warning';
      const warningMat = new THREE.MeshBasicMaterial({
        color: 0xff8a7a,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      });
      const warnRing = new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.03, 6, 48), warningMat);
      warnRing.position.z = -0.02;
      this.warning.add(warnRing);
      // Four inward ticks teach “solid — do not enter”.
      for (let i = 0; i < 4; i++) {
        const tick = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.02), warningMat);
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        tick.position.set(Math.cos(a) * 0.72, Math.sin(a) * 0.72, -0.03);
        tick.rotation.z = a;
        this.warning.add(tick);
      }
      this.group.add(this.warning);

      this.boundary = new THREE.Mesh(
        new THREE.TorusGeometry(1, 0.018, 6, 64),
        new THREE.MeshBasicMaterial({
          color: 0x98efdc,
          transparent: true,
          opacity: 0.7,
          depthWrite: false,
        }),
      );
      this.boundary.name = 'phase-boundary';
      this.group.add(this.boundary);
    }
    this.mesh.scale.setScalar(config.fieldRadius);
    this.ghost!.scale.setScalar(config.fieldRadius);
    this.boundary!.scale.setScalar(config.fieldRadius);
    this.warning!.scale.setScalar(config.fieldRadius);
    this.group.position.set(config.centerX, config.centerY, config.z);
    this.update(0, 0);
  }

  hide(): void {
    this.active = false;
    this.group.visible = false;
    this.config = null;
  }

  update(_dt: number, elapsedTime: number): void {
    if (!this.active || !this.config || !this.mesh || !this.ghost) {
      return;
    }
    this.open = phaseOpen(this.config, elapsedTime);
    this.solidUniforms.time.value = elapsedTime;
    this.solidUniforms.intensity.value = this.open ? 0 : 1;
    // Solid disc hidden when passable; faint cyan ghost remains so the window never goes silent.
    this.mesh.visible = !this.open;
    this.ghost.visible = this.open;
    this.warning!.visible = !this.open;
    (this.boundary!.material as THREE.MeshBasicMaterial).color.setHex(this.open ? 0x7ef0ff : 0xff806f);
    (this.boundary!.material as THREE.MeshBasicMaterial).opacity = this.open ? 0.45 : 0.78;
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
