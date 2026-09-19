import * as THREE from 'three';

import { GAME_TUNING } from '../game/gameTuning';

export class CameraController {
  readonly camera: THREE.PerspectiveCamera;
  private readonly lookAt = new THREE.Vector3(
    GAME_TUNING.camera.lookAt[0],
    GAME_TUNING.camera.lookAt[1],
    GAME_TUNING.camera.lookAt[2],
  );
  private shakeTime = 0;
  private shakeDuration = 0.18;
  private shakeMagnitude = 0;
  private punch = 0;
  private fovBoost = 0;
  reduceMotion = false;
  allowShake = true;
  travel = 0;
  aspect = 9 / 16;

  constructor() {
    const cam = GAME_TUNING.camera;
    this.camera = new THREE.PerspectiveCamera(cam.fov, this.aspect, cam.near, cam.far);
    this.camera.position.set(cam.position[0], cam.position[1], cam.position[2]);
    this.camera.lookAt(this.lookAt);
  }

  setAspect(aspect: number): void {
    this.aspect = Math.max(0.4, aspect);
    this.camera.aspect = this.aspect;
    this.camera.updateProjectionMatrix();
  }

  setTravel(value: number): void {
    const scale = this.reduceMotion ? 0.35 : 1;
    this.travel = value * scale;
  }

  rebase(): void {
    this.travel = 0;
  }

  clearEffects(): void {
    this.shakeTime = 0;
    this.shakeMagnitude = 0;
    this.punch = 0;
    this.fovBoost = 0;
    this.camera.fov = GAME_TUNING.camera.fov;
    this.camera.updateProjectionMatrix();
  }

  shake(magnitude: number, duration = 0.16): void {
    if (!this.allowShake) {
      return;
    }
    const scale = this.reduceMotion ? 0.22 : 1;
    this.shakeMagnitude = magnitude * scale;
    this.shakeDuration = this.reduceMotion ? Math.min(duration, 0.08) : duration;
    this.shakeTime = this.shakeDuration;
  }

  punchLaunch(): void {
    if (this.reduceMotion) {
      return;
    }
    this.punch = 1;
  }

  hitEmphasis(perfect: boolean): void {
    if (this.reduceMotion) {
      this.shake(perfect ? 0.04 : 0.02, 0.08);
      return;
    }
    this.shake(perfect ? GAME_TUNING.feedback.shakePerfect : GAME_TUNING.feedback.shakeHit, perfect ? 0.2 : 0.12);
    if (perfect) {
      this.fovBoost = 1;
    }
  }

  collisionImpulse(): void {
    this.shake(GAME_TUNING.feedback.shakeRotor, 0.2);
  }

  update(dt: number): void {
    const base = GAME_TUNING.camera.position;
    const look = GAME_TUNING.camera.lookAt;
    const push = this.travel * GAME_TUNING.transition.travelDistance;
    let ox = 0;
    let oy = 0;
    let oz = 0;
    if (this.shakeTime > 0 && this.allowShake) {
      this.shakeTime = Math.max(0, this.shakeTime - dt);
      const falloff = this.shakeTime / Math.max(0.001, this.shakeDuration);
      ox = (Math.random() * 2 - 1) * this.shakeMagnitude * falloff;
      oy = (Math.random() * 2 - 1) * this.shakeMagnitude * falloff;
    }
    if (this.punch > 0) {
      this.punch = Math.max(0, this.punch - dt * 5);
      oz = this.punch * 0.28;
    }
    if (this.fovBoost > 0) {
      this.fovBoost = Math.max(0, this.fovBoost - dt * 4.5);
      this.camera.fov = GAME_TUNING.camera.fov + this.fovBoost * 3.2;
      this.camera.updateProjectionMatrix();
    } else if (this.camera.fov !== GAME_TUNING.camera.fov) {
      this.camera.fov = GAME_TUNING.camera.fov;
      this.camera.updateProjectionMatrix();
    }
    this.camera.position.set(base[0] + ox, base[1] + oy, base[2] + push + oz);
    this.lookAt.set(look[0], look[1], look[2] + push);
    this.camera.lookAt(this.lookAt);
  }
}

export class CameraShake {
  static rotorHit = 0.18;
  static targetHit = 0.08;
  static perfect = 0.14;
}
