import * as THREE from 'three';

import type { EnvironmentId } from '../config/ChallengeConfig';
import type { RotorConfig } from '../config/RotorConfig';
import type { MovementConfig } from '../config/MovementConfig';
import { sampleMovement } from '../config/MovementConfig';
import { GAME_TUNING } from '../game/gameTuning';
import { lerp, smoothstep } from '../utils/math';
import { evaluateRotorCollision, type ObstacleCollisionResult } from './ObstacleCollision';
import { replaceRotorVisual } from './RotorVisuals';

export class RotorObstacle {
  readonly id: string;
  readonly type = 'rotor' as const;
  readonly group = new THREE.Group();
  bladeCount = 2;
  baseSpeed = 0.55;
  direction: 1 | -1 = 1;
  currentSpeed = 0.55;
  elapsed = 0;
  z = GAME_TUNING.rotor.z;
  baseX = GAME_TUNING.rotor.center.x;
  baseY = GAME_TUNING.rotor.center.y;
  active = false;
  private speedPulse?: { amplitude: number; frequency: number };
  private reverseInterval?: number;
  private movement: MovementConfig = { type: 'none', amplitude: 0, speed: 0, phase: 0 };
  private visual: THREE.Group | null = null;
  private environment: EnvironmentId = 'workshop';
  private initialRotation = 0;

  constructor(id: string) {
    this.id = id;
    this.group.visible = false;
  }

  get angle(): number {
    return this.group.rotation.z;
  }

  applyConfig(config: RotorConfig, environment: EnvironmentId): void {
    this.active = true;
    this.group.visible = true;
    this.baseSpeed = config.rotationSpeed;
    this.direction = config.direction;
    this.speedPulse = config.speedPulse;
    this.reverseInterval = config.reverseInterval;
    this.z = config.z;
    this.baseX = GAME_TUNING.rotor.center.x;
    this.baseY = GAME_TUNING.rotor.center.y;
    this.elapsed = 0;
    this.initialRotation = config.initialRotation ?? config.phase ?? 0;
    this.group.rotation.z = this.initialRotation;
    this.movement = {
      type: config.movement?.type ?? 'none',
      amplitude: config.movement?.amplitude ?? 0,
      speed: config.movement?.speed ?? 0,
      phase: config.movement?.phase ?? 0,
    };

    const needsRebuild =
      !this.visual || config.bladeCount !== this.bladeCount || environment !== this.environment;
    this.bladeCount = config.bladeCount;
    this.environment = environment;
    if (needsRebuild) {
      this.visual = replaceRotorVisual(this.group, this.visual, environment, this.bladeCount);
    }

    this.update(0, 0);
  }

  hide(): void {
    this.active = false;
    this.group.visible = false;
  }

  update(dt: number, elapsedTime: number): void {
    if (!this.active) {
      return;
    }
    this.elapsed += dt;
    const time = elapsedTime;

    const signedDirection = this.directionAt(this.elapsed);
    this.currentSpeed = this.speedMagnitude(this.elapsed) * signedDirection;
    this.group.rotation.z -= this.currentSpeed * dt;

    const x =
      this.movement.type === 'horizontal'
        ? sampleMovement(this.movement, this.baseX, time)
        : this.baseX;
    const y =
      this.movement.type === 'vertical'
        ? sampleMovement(this.movement, this.baseY, time)
        : this.baseY;
    this.group.position.set(x, y, this.z);
  }

  testProjectileCrossing(
    previous: THREE.Vector3,
    current: THREE.Vector3,
    projectileRadius: number,
  ): ObstacleCollisionResult | null {
    if (!this.active || previous.z >= this.z || current.z < this.z) {
      return null;
    }
    const span = current.z - previous.z;
    const t = span === 0 ? 1 : (this.z - previous.z) / span;
    const x = previous.x + (current.x - previous.x) * t;
    const y = previous.y + (current.y - previous.y) * t;
    return evaluateRotorCollision(
      x,
      y,
      projectileRadius,
      this.angle,
      this.bladeCount,
      this.group.position.x,
      this.group.position.y,
    );
  }

  interpolateCrossing(previous: THREE.Vector3, current: THREE.Vector3): THREE.Vector3 {
    const span = current.z - previous.z;
    const t = span === 0 ? 1 : (this.z - previous.z) / span;
    return new THREE.Vector3(
      previous.x + (current.x - previous.x) * t,
      previous.y + (current.y - previous.y) * t,
      this.z,
    );
  }

  resetClock(): void {
    this.elapsed = 0;
    this.group.rotation.z = this.initialRotation;
  }

  predictState(
    deltaSeconds: number,
    simTime: number,
  ): { x: number; y: number; z: number; angle: number } {
    const step = 1 / 120;
    let elapsed = this.elapsed;
    let angle = this.angle;
    let remaining = Math.max(0, deltaSeconds);
    while (remaining > 1e-8) {
      const dt = Math.min(step, remaining);
      elapsed += dt;
      angle -= this.speedMagnitude(elapsed) * this.directionAt(elapsed) * dt;
      remaining -= dt;
    }
    const futureTime = simTime + deltaSeconds;
    return {
      x:
        this.movement.type === 'horizontal'
          ? sampleMovement(this.movement, this.baseX, futureTime)
          : this.baseX,
      y:
        this.movement.type === 'vertical'
          ? sampleMovement(this.movement, this.baseY, futureTime)
          : this.baseY,
      z: this.z,
      angle,
    };
  }

  private speedMagnitude(elapsed: number): number {
    if (!this.speedPulse) {
      return this.baseSpeed;
    }
    return (
      this.baseSpeed +
      Math.sin(elapsed * this.speedPulse.frequency * Math.PI * 2) * this.speedPulse.amplitude
    );
  }

  private directionAt(elapsed: number): number {
    const interval = this.reverseInterval;
    if (!interval) {
      return this.direction;
    }

    const ease = GAME_TUNING.rotor.reverseEaseDuration;
    const cycle = interval;
    const t = elapsed % (cycle * 2);

    let signed = 1;
    if (t < cycle - ease) {
      signed = 1;
    } else if (t < cycle) {
      signed = lerp(1, -1, smoothstep((t - (cycle - ease)) / ease));
    } else if (t < cycle * 2 - ease) {
      signed = -1;
    } else {
      signed = lerp(-1, 1, smoothstep((t - (cycle * 2 - ease)) / ease));
    }

    return signed * this.direction;
  }
}
