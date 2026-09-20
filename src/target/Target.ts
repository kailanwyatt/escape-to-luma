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
  private readonly portal: THREE.Mesh;
  private readonly frame: THREE.Mesh;
  private movement?: ChallengeConfig['target']['movement'];

  constructor() {
    this.portal = new THREE.Mesh(
      new THREE.CircleGeometry(1.02, 48),
      new THREE.MeshBasicMaterial({
        color: 0x0d6fb8,
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    this.portal.position.z = -0.04;
    this.frame = new THREE.Mesh(
      new THREE.TorusGeometry(1.08, 0.075, 10, 48),
      new THREE.MeshPhongMaterial({
        color: 0x153d5f,
        emissive: 0x00aee8,
        emissiveIntensity: 0.8,
        shininess: 90,
      }),
    );
    this.group.add(this.portal, this.frame);
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
    this.frame.rotation.z = elapsedTime * 0.08;
    (this.portal.material as THREE.MeshBasicMaterial).opacity =
      0.18 + Math.sin(elapsedTime * 2.2) * 0.05;
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
    const colors = [0x168dc4, 0x48dfff, 0xc9fbff, 0xffd54a];
    const zones = GAME_TUNING.target.zones;
    const radii = [zones.hit, zones.great, zones.bullseye, zones.perfect];
    for (let i = 0; i < colors.length; i += 1) {
      const mesh = new THREE.Mesh(
        new THREE.CircleGeometry(radii[i], 32),
        new THREE.MeshPhongMaterial({
          color: colors[i],
          emissive: colors[i],
          emissiveIntensity: i === colors.length - 1 ? 0.9 : 0.35,
          transparent: true,
          opacity: 0.88,
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

  dispose(): void {
    this.portal.geometry.dispose();
    (this.portal.material as THREE.Material).dispose();
    this.frame.geometry.dispose();
    (this.frame.material as THREE.Material).dispose();
    for (const ring of this.rings) {
      ring.geometry.dispose();
      (ring.material as THREE.Material).dispose();
    }
  }
}
