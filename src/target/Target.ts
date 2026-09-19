import * as THREE from 'three';

import type { ChallengeConfig } from '../config/ChallengeConfig';
import { sampleMovement } from '../config/MovementConfig';
import { GAME_TUNING } from '../game/gameTuning';

export class Target {
  readonly group = new THREE.Group();
  x = GAME_TUNING.target.defaultCenter.x;
  y = GAME_TUNING.target.defaultCenter.y;
  z = GAME_TUNING.target.z;
  radius = GAME_TUNING.target.defaultRadius;
  baseX = 0;
  baseY = 3;
  private pulse = 0;
  private pulseStrength = 0;
  private readonly rings: THREE.Mesh[] = [];
  private movement?: ChallengeConfig['target']['movement'];

  constructor() {
    this.buildRings();
    this.group.position.set(this.x, this.y, this.z);
  }

  applyConfig(config: ChallengeConfig['target']): void {
    this.baseX = config.x;
    this.baseY = config.y;
    this.x = config.x;
    this.y = config.y;
    this.z = config.z ?? GAME_TUNING.target.z;
    this.radius = config.radius;
    this.movement = config.movement;
    this.pulse = 0;
    this.syncScale();
    this.group.position.set(this.x, this.y, this.z);
  }

  triggerPulse(strength: number): void {
    this.pulse = 1;
    this.pulseStrength = strength;
  }

  update(dt: number, elapsedTime: number): void {
    if (this.movement?.type === 'horizontal') {
      this.x = sampleMovement(this.movement, this.baseX, elapsedTime);
    } else if (this.movement?.type === 'vertical') {
      this.y = sampleMovement(this.movement, this.baseY, elapsedTime);
    } else {
      this.x = this.baseX;
      this.y = this.baseY;
    }
    this.group.position.set(this.x, this.y, this.z);

    if (this.pulse > 0) {
      this.pulse = Math.max(0, this.pulse - dt * 3.2);
    }
    this.syncScale();
  }

  predictPosition(atTime: number): { x: number; y: number } {
    if (this.movement?.type === 'horizontal') {
      return { x: sampleMovement(this.movement, this.baseX, atTime), y: this.baseY };
    }
    if (this.movement?.type === 'vertical') {
      return { x: this.baseX, y: sampleMovement(this.movement, this.baseY, atTime) };
    }
    return { x: this.baseX, y: this.baseY };
  }

  private buildRings(): void {
    const colors = [0xd63c3c, 0xf2f0ea, 0xd63c3c, 0xffd24a];
    const radii = [1, 0.72, 0.46, 0.2];
    for (let i = 0; i < colors.length; i += 1) {
      const mesh = new THREE.Mesh(
        new THREE.CircleGeometry(radii[i], 32),
        new THREE.MeshLambertMaterial({
          color: colors[i],
          side: THREE.DoubleSide,
        }),
      );
      mesh.position.z = i * 0.01;
      this.rings.push(mesh);
      this.group.add(mesh);
    }
  }

  private syncScale(): void {
    const radiusScale = this.radius / GAME_TUNING.target.defaultRadius;
    const pulseScale =
      this.pulse <= 0 ? 1 : 1 + Math.sin(this.pulse * Math.PI) * 0.18 * this.pulseStrength;
    this.group.scale.setScalar(radiusScale * pulseScale);
  }
}
