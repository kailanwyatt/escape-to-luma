import * as THREE from 'three';
import type { NullTendrilConfig } from '../config/ObstacleConfig';
import { nullTendrilStateAtTime } from './NullTendrilState';

/**
 * Living Null tendrils — dark purple coils leave one cyan corridor of light.
 * Gap angle samples NullTendrilState; tentacle meshes stay in solid sectors.
 */
export class NullTendrilArt {
  readonly group = new THREE.Group();
  private readonly tendrilRoot = new THREE.Group();
  private readonly arms: THREE.Group[] = [];
  private readonly fleshMat: THREE.MeshStandardMaterial;
  private readonly darkMat: THREE.MeshStandardMaterial;
  private readonly corridorGlow: THREE.MeshStandardMaterial;
  private readonly accent: THREE.PointLight;
  private readonly geometries: THREE.BufferGeometry[] = [];

  constructor(private readonly config: NullTendrilConfig) {
    this.group.name = 'null-tendril-art';
    this.fleshMat = new THREE.MeshStandardMaterial({
      color: 0x14081f,
      emissive: 0x3a1458,
      emissiveIntensity: 0.5,
      metalness: 0.04,
      roughness: 0.7,
    });
    this.darkMat = new THREE.MeshStandardMaterial({
      color: 0x07040c,
      emissive: 0x1a0828,
      emissiveIntensity: 0.28,
      metalness: 0.02,
      roughness: 0.82,
    });
    this.corridorGlow = new THREE.MeshStandardMaterial({
      color: 0xb8a0ff,
      emissive: 0x6a40c8,
      emissiveIntensity: 0.85,
      metalness: 0.1,
      roughness: 0.3,
    });

    this.tendrilRoot.name = 'tendril-root';
    this.group.add(this.tendrilRoot);

    const count = Math.max(2, Math.floor(config.tendrilCount));
    const gap = Math.max(0.4, config.gapWidth);
    const solid = Math.PI * 2 - gap;
    const outer = config.outerRadius;
    const inner = Math.max(0.15, Math.min(config.innerRadius, outer - 0.4));

    for (let i = 0; i < count; i++) {
      // Solid starts at ±gap/2 so the cyan corridor stays centered on gapAngle.
      const a0 = gap / 2 + (i / count) * solid;
      const a1 = gap / 2 + ((i + 1) / count) * solid;
      const mid = (a0 + a1) / 2;
      const arm = new THREE.Group();
      arm.name = `living-tendril-${i}`;
      arm.rotation.z = mid;
      arm.userData.phase = i * 0.9;
      this.tendrilRoot.add(arm);
      this.arms.push(arm);

      const reach = outer - inner;
      const segs = 5;
      let parent: THREE.Object3D = arm;
      for (let s = 0; s < segs; s++) {
        const u = s / (segs - 1);
        const r = 0.16 * (1.1 - u * 0.55);
        const geo = new THREE.SphereGeometry(1, 10, 8);
        this.geometries.push(geo);
        const seg = new THREE.Mesh(geo, s % 2 ? this.fleshMat : this.darkMat);
        seg.name = `tendril-seg-${i}-${s}`;
        seg.scale.set(r * 1.1, r, r * 0.9);
        seg.position.set(inner + reach * ((s + 0.5) / segs), 0, -s * 0.015);
        parent.add(seg);

        // Suckers / nodules along the underside
        if (s > 0 && s < segs - 1) {
          const nodGeo = new THREE.SphereGeometry(r * 0.45, 6, 4);
          this.geometries.push(nodGeo);
          const nod = new THREE.Mesh(nodGeo, this.corridorGlow);
          nod.name = `tendril-sucker-${i}-${s}`;
          nod.position.set(0, -r * 0.7, -0.02);
          nod.scale.setScalar(0.55);
          seg.add(nod);
        }
        parent = seg;
      }

      const tipGeo = new THREE.SphereGeometry(0.11, 10, 8);
      this.geometries.push(tipGeo);
      const tip = new THREE.Mesh(tipGeo, this.fleshMat);
      tip.name = `tendril-tip-${i}`;
      tip.position.set(outer - 0.06, 0, -0.04);
      arm.add(tip);
    }

    // Corridor light rim
    for (const side of [-1, 1] as const) {
      const a = side * (gap / 2);
      const geo = new THREE.TorusGeometry(0.08, 0.025, 6, 10, Math.PI * 1.2);
      this.geometries.push(geo);
      const lip = new THREE.Mesh(geo, this.corridorGlow);
      lip.name = `corridor-lip-${side > 0 ? 'a' : 'b'}`;
      lip.position.set(
        Math.cos(a) * ((inner + outer) / 2),
        Math.sin(a) * ((inner + outer) / 2),
        -0.1,
      );
      lip.rotation.z = a;
      this.tendrilRoot.add(lip);
    }

    const veilGeo = new THREE.CircleGeometry(outer * 1.08, 32);
    this.geometries.push(veilGeo);
    const veil = new THREE.Mesh(
      veilGeo,
      new THREE.MeshBasicMaterial({
        color: 0x05030a,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      }),
    );
    veil.name = 'null-veil';
    veil.position.z = 0.1;
    this.group.add(veil);

    this.accent = new THREE.PointLight(0x8a50e0, 12, 12, 2);
    this.accent.name = 'tendril-accent';
    this.group.add(this.accent);
    this.update(0);
  }

  update(time: number) {
    const state = nullTendrilStateAtTime(this.config, time);
    this.group.position.set(state.centerX, state.centerY, 0);
    this.tendrilRoot.rotation.z = state.gapAngle;

    this.arms.forEach((arm, i) => {
      const phase = arm.userData.phase as number;
      const writhe = Math.sin(time * 2.2 + phase) * 0.07;
      // Soft reach toward the corridor, then settle — reads as breathing, not spinning.
      arm.rotation.x = Math.sin(time * 1.4 + phase) * 0.05;
      arm.traverse((o) => {
        if (!(o instanceof THREE.Mesh)) return;
        if (!o.name.startsWith('tendril-seg')) return;
        const idx = Number(o.name.split('-').pop());
        if (!Number.isFinite(idx)) return;
        o.position.y = Math.sin(time * 2.8 + phase + idx * 0.7) * 0.045;
        o.rotation.z = writhe * (0.4 + idx * 0.15);
      });
    });

    const pulse = 0.5 + 0.5 * Math.sin(time * 1.9);
    this.fleshMat.emissiveIntensity = 0.4 + pulse * 0.3;
    this.corridorGlow.emissiveIntensity = 0.7 + pulse * 0.5;
    this.accent.intensity = 10 + pulse * 5;
    this.accent.position.set(0, 0, -1.1);
  }

  dispose() {
    for (const g of this.geometries) g.dispose();
    this.fleshMat.dispose();
    this.darkMat.dispose();
    this.corridorGlow.dispose();
    const veil = this.group.getObjectByName('null-veil');
    if (veil instanceof THREE.Mesh && veil.material instanceof THREE.Material) {
      veil.material.dispose();
    }
    this.group.clear();
    this.group.removeFromParent();
  }
}
