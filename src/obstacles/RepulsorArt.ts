import * as THREE from 'three';
import type { RepulsorConfig } from '../config/ObstacleConfig';
import { repulsorStateAtTime } from './RepulsorState';
import { FacilityArtKit } from './FacilityArtKit';

/**
 * Cinematic repulsor — brushed metal orb with expanding push rings.
 * Core radius samples RepulsorState; rings are non-colliding VFX.
 */
export class RepulsorArt {
  readonly group = new THREE.Group();
  private readonly kit = new FacilityArtKit({ cinematic: true });
  private readonly core: THREE.Mesh;
  private readonly rings: THREE.Mesh[] = [];
  private readonly ringMats: THREE.MeshStandardMaterial[] = [];
  private readonly glow: THREE.MeshStandardMaterial;
  private readonly accent: THREE.PointLight;
  private readonly geometries: THREE.BufferGeometry[] = [];

  constructor(private readonly config: RepulsorConfig) {
    this.group.name = 'repulsor-art';
    const steel = this.kit.metal(0xb0bec8, 0.18);
    const dark = this.kit.metal(0x1a222c, 0.55, false);
    this.glow = this.kit.lamp();
    this.glow.color.setHex(0xffb070);
    this.glow.emissive.setHex(0xff7a30);

    const coreGeo = new THREE.SphereGeometry(1, 32, 24);
    this.geometries.push(coreGeo);
    this.core = new THREE.Mesh(coreGeo, steel);
    this.core.name = 'repulsor-core';
    this.group.add(this.core);

    this.kit.box(this.group, 'equator', 2.05, 0.12, 0.12, 0, 0, 0, dark, 0.008);
    this.kit.box(this.group, 'pole-n', 0.35, 0.18, 0.18, 0, 0.92, 0, this.glow, 0.004);
    this.kit.box(this.group, 'pole-s', 0.35, 0.18, 0.18, 0, -0.92, 0, this.glow, 0.004);

    for (let i = 0; i < 3; i++) {
      const geo = new THREE.TorusGeometry(1, 0.028, 6, 48);
      this.geometries.push(geo);
      const mat = this.glow.clone();
      mat.transparent = true;
      this.ringMats.push(mat);
      const ring = new THREE.Mesh(geo, mat);
      ring.name = `push-ring-${i}`;
      ring.position.z = -0.02 - i * 0.01;
      this.group.add(ring);
      this.rings.push(ring);
    }

    this.accent = new THREE.PointLight(0xff8a40, 14, 14, 2);
    this.accent.name = 'repulsor-accent';
    this.group.add(this.accent);
    this.update(0);
  }

  update(time: number) {
    const state = repulsorStateAtTime(this.config, time);
    this.group.position.set(state.centerX, state.centerY, 0);
    this.core.scale.setScalar(state.coreRadius);

    const equator = this.group.getObjectByName('equator');
    if (equator) equator.scale.set(state.coreRadius, 1, 1);
    for (const name of ['pole-n', 'pole-s'] as const) {
      const pole = this.group.getObjectByName(name);
      if (pole) {
        pole.scale.setScalar(state.coreRadius);
        pole.position.y = (name === 'pole-n' ? 1 : -1) * state.coreRadius * 0.92;
      }
    }

    this.rings.forEach((ring, i) => {
      const u = ((time * 1.05 + i * 0.33) % 1 + 1) % 1;
      const r = state.coreRadius + u * (state.fieldRadius - state.coreRadius);
      ring.scale.setScalar(Math.max(0.15, r));
      const mat = this.ringMats[i]!;
      mat.opacity = 0.7 * (1 - u);
      mat.emissiveIntensity = 0.95 * (1 - u * 0.65);
    });

    const pulse = 0.5 + 0.5 * Math.sin(time * 2.6);
    this.glow.emissiveIntensity = 0.85 + pulse * 0.4;
    this.accent.intensity = 12 + pulse * 6;
    this.accent.position.set(0, 0, -1.15);
  }

  dispose() {
    for (const g of this.geometries) g.dispose();
    for (const m of this.ringMats) m.dispose();
    this.kit.dispose();
    this.group.clear();
    this.group.removeFromParent();
  }
}
