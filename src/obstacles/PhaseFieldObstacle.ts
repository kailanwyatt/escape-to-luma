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
  private warning: THREE.Group | null = null;
  private boundary: THREE.Mesh | null = null;

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
        new THREE.ShaderMaterial({
          transparent:true, side:THREE.DoubleSide, depthWrite:false,
          vertexShader:`varying vec2 v;void main(){v=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
          fragmentShader:`precision mediump float;varying vec2 v;
          void main(){float r=length(v),a=atan(v.y,v.x);
            float threads=pow(.5+.5*sin(r*65.+sin(a*7.)*2.4),14.);
            float veins=pow(.5+.5*sin(a*17.+r*9.+sin(r*23.)),22.);
            float rim=smoothstep(.87,1.,r);float energy=max(threads*.45,veins*.3)+rim*.65;
            vec3 c=mix(vec3(.38,.025,.12),vec3(1.,.44,.4),energy);
            gl_FragColor=vec4(c,.1+energy*.58);}`,
        }),
      );
      this.group.add(this.mesh);
      this.warning=new THREE.Group();
      // Soft membrane rim — no HUD-style X bars.
      const warningMat=new THREE.MeshBasicMaterial({color:0xff8a7a,transparent:true,opacity:.55,depthWrite:false});
      const warnRing=new THREE.Mesh(new THREE.TorusGeometry(0.92,.03,6,48),warningMat);
      warnRing.position.z=-.02;this.warning.add(warnRing);
      this.group.add(this.warning);
      this.boundary=new THREE.Mesh(new THREE.TorusGeometry(1,.012,6,64),new THREE.MeshBasicMaterial({color:0x98efdc,transparent:true,opacity:.65,depthWrite:false}));this.group.add(this.boundary);

    }
    this.mesh.scale.setScalar(config.fieldRadius);
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
    if (!this.active || !this.config || !this.mesh) {
      return;
    }
    this.open = phaseOpen(this.config, elapsedTime);
    this.mesh.visible=!this.open;
    this.warning!.visible=!this.open;
    (this.boundary!.material as THREE.MeshBasicMaterial).color.setHex(this.open?0x98efdc:0xff806f);
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
