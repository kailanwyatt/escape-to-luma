import * as THREE from 'three';
import type { RotatingGateConfig } from '../config/ObstacleConfig';
import { rotatingGateStateAtTime } from './RotatingGateState';
import { FacilityArtKit } from './FacilityArtKit';

const SEGMENTS = 48;

/**
 * Cinematic rotating security gate — solid armored disk with one timed sector.
 * Gap angle samples RotatingGateState; panels fill from hub to rim outside the open sector.
 */
export class RotatingGateArt {
  readonly group = new THREE.Group();
  private readonly kit = new FacilityArtKit({ cinematic: true });
  private readonly plate = new THREE.Group();
  private readonly gapGlow: THREE.MeshStandardMaterial;
  private readonly accent: THREE.PointLight;
  private readonly ownedMaterials: THREE.Material[] = [];
  private readonly geometries: THREE.BufferGeometry[] = [];

  constructor(private readonly config: RotatingGateConfig) {
    this.group.name = 'rotating-gate-art';
    const armor = this.kit.metal(0x3a4552, 0.38);
    const steel = this.kit.metal(0x9aa8b6, 0.22);
    const dark = this.kit.metal(0x0c1218, 0.7, false);
    this.gapGlow = this.kit.lamp();
    this.gapGlow.color.setHex(0x7ce8ff);
    this.gapGlow.emissive.setHex(0x3aa8c9);

    this.plate.name = 'gate-plate';
    this.group.add(this.plate);

    const outer = config.outerRadius;
    const hub = Math.max(0.12, Math.min(config.innerRadius, outer - 0.35));
    const gap = Math.max(0.35, config.gapWidth);
    const solid = Math.PI * 2 - gap;
    const panels = 12;
    // Fill to the hub so the center is visibly solid (matches collision).
    const plateInner = hub * 0.35;
    for (let i = 0; i < panels; i++) {
      const a0 = -solid / 2 + (i / panels) * solid;
      const a1 = -solid / 2 + ((i + 1) / panels) * solid;
      const mid = (a0 + a1) / 2;
      const span = a1 - a0;
      const rMid = (plateInner + outer) / 2;
      const panel = new THREE.Group();
      panel.rotation.z = mid;
      this.plate.add(panel);
      this.kit.box(
        panel,
        `panel-${i}`,
        outer - plateInner - 0.04,
        Math.max(0.08, rMid * span * 0.92),
        0.14,
        rMid,
        0,
        0,
        dark,
        0.012,
      );
      this.kit.box(
        panel,
        `armor-${i}`,
        (outer - plateInner) * 0.55,
        Math.max(0.06, rMid * span * 0.55),
        0.08,
        rMid + 0.02,
        0,
        -0.06,
        armor,
        0.008,
      );
      this.kit.box(
        panel,
        `rib-${i}`,
        0.06,
        Math.max(0.05, rMid * span * 0.7),
        0.05,
        outer - 0.08,
        0,
        -0.1,
        steel,
        0.004,
      );
    }

    // Solid hub cap
    const hubCapGeo = new THREE.CircleGeometry(hub, SEGMENTS);
    this.geometries.push(hubCapGeo);
    const hubCap = new THREE.Mesh(hubCapGeo, dark);
    hubCap.name = 'hub-cap';
    hubCap.position.z = 0.02;
    this.plate.add(hubCap);

    // Hub collar
    const hubGeo = new THREE.TorusGeometry(hub + 0.04, 0.05, 8, SEGMENTS);
    this.geometries.push(hubGeo);
    const hubMesh = new THREE.Mesh(hubGeo, steel);
    hubMesh.name = 'hub-collar';
    hubMesh.position.z = -0.04;
    this.plate.add(hubMesh);

    // Outer rim
    const rimGeo = new THREE.TorusGeometry(outer + 0.02, 0.045, 8, SEGMENTS);
    this.geometries.push(rimGeo);
    const rim = new THREE.Mesh(rimGeo, armor);
    rim.name = 'outer-rim';
    rim.position.z = -0.02;
    this.plate.add(rim);

    // Gap lip lights (fixed to plate edges of the sector)
    for (const side of [-1, 1] as const) {
      const lip = this.kit.box(
        this.plate,
        `gap-lip-${side > 0 ? 'a' : 'b'}`,
        outer - plateInner - 0.1,
        0.08,
        0.04,
        (plateInner + outer) / 2,
        0,
        -0.12,
        this.gapGlow,
        0.002,
      );
      lip.position.set(
        Math.cos(side * (gap / 2)) * ((plateInner + outer) / 2),
        Math.sin(side * (gap / 2)) * ((plateInner + outer) / 2),
        -0.12,
      );
      lip.rotation.z = side * (gap / 2) + Math.PI / 2;
    }

    // Bearing bosses
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      this.kit.box(
        this.group,
        `bearing-${i}`,
        0.22,
        0.16,
        0.18,
        Math.cos(a) * (outer + 0.12),
        Math.sin(a) * (outer + 0.12),
        0.02,
        steel,
        0.006,
      );
    }

    this.accent = new THREE.PointLight(0x5ec8e8, 10, 12, 2);
    this.accent.name = 'gate-accent';
    this.group.add(this.accent);
    this.update(0);
  }

  update(time: number) {
    const state = rotatingGateStateAtTime(this.config, time);
    this.plate.rotation.z = state.gapAngle;
    const pulse = 0.5 + 0.5 * Math.sin(time * 2.4);
    this.gapGlow.emissiveIntensity = 0.7 + pulse * 0.45;
    this.accent.intensity = 8 + pulse * 5;
    this.accent.position.set(state.centerX, state.centerY, -1.1);
    this.group.position.set(state.centerX, state.centerY, 0);
  }

  dispose() {
    for (const g of this.geometries) g.dispose();
    for (const m of this.ownedMaterials) m.dispose();
    this.kit.dispose();
    this.group.clear();
    this.group.removeFromParent();
  }
}
