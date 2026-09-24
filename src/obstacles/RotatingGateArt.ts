import * as THREE from 'three';
import type { RotatingGateConfig } from '../config/ObstacleConfig';
import { rotatingGateHubRadius, rotatingGateStateAtTime } from './RotatingGateState';
import { FacilityArtKit } from './FacilityArtKit';

const SEGMENTS = 48;

/** Thick annular sector so the plate reads face-on (flat RingGeometry vanishes as a silhouette). */
function extrudedAnnulus(
  inner: number,
  outer: number,
  start: number,
  span: number,
  depth: number,
): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  for (let i = 0; i <= SEGMENTS; i++) {
    const a = start + (i / SEGMENTS) * span;
    const x = Math.cos(a) * outer;
    const y = Math.sin(a) * outer;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  for (let i = SEGMENTS; i >= 0; i--) {
    const a = start + (i / SEGMENTS) * span;
    shape.lineTo(Math.cos(a) * inner, Math.sin(a) * inner);
  }
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
    curveSegments: 1,
  });
  geo.translate(0, 0, -depth / 2);
  return geo;
}

/**
 * Cinematic rotating security gate — solid armored disk with one timed sector.
 * Gap angle samples RotatingGateState; plate is a thick annular sector so the
 * empty pie stays mesh-free and readable (box panels used to fill the opening).
 */
export class RotatingGateArt {
  readonly group = new THREE.Group();
  private readonly kit = new FacilityArtKit({ cinematic: true });
  private readonly plate = new THREE.Group();
  private readonly gapGlow: THREE.MeshStandardMaterial;
  private readonly gapFill: THREE.MeshBasicMaterial;
  private readonly accent: THREE.PointLight;
  private readonly ownedMaterials: THREE.Material[] = [];
  private readonly geometries: THREE.BufferGeometry[] = [];

  constructor(private readonly config: RotatingGateConfig) {
    this.group.name = 'rotating-gate-art';
    // Mid-value armor so the missing sector reads as an empty pie against sky/backdrops.
    const armor = this.kit.metal(0x4a5d6e, 0.34);
    const steel = this.kit.metal(0xb0bec9, 0.2);
    const dark = this.kit.metal(0x2a3848, 0.5, false);
    dark.emissive.setHex(0x1a2836);
    dark.emissiveIntensity = 0.28;
    this.gapGlow = this.kit.lamp();
    this.gapGlow.color.setHex(0x7ce8ff);
    this.gapGlow.emissive.setHex(0x3aa8c9);
    this.gapFill = new THREE.MeshBasicMaterial({
      color: 0x5ec8e8,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.ownedMaterials.push(this.gapFill);

    this.plate.name = 'gate-plate';
    this.group.add(this.plate);

    const outer = config.outerRadius;
    const hub = rotatingGateHubRadius(config);
    const gap = Math.max(0.35, config.gapWidth);
    const solid = Math.PI * 2 - gap;
    // Solid starts at +gap/2 so the empty pie is centered on local 0 (= collision gapAngle).
    const solidStart = gap / 2;
    const plateInner = hub * 0.96;

    const wallGeo = extrudedAnnulus(plateInner, outer, solidStart, solid, 0.16);
    this.geometries.push(wallGeo);
    const wall = new THREE.Mesh(wallGeo, dark);
    wall.name = 'gate-wall';
    // Stash sector params for tests (ExtrudeGeometry has no RingGeometry.parameters).
    wall.userData.thetaStart = solidStart;
    wall.userData.thetaLength = solid;
    this.plate.add(wall);

    const armorGeo = extrudedAnnulus(
      plateInner + (outer - plateInner) * 0.2,
      outer - 0.05,
      solidStart + 0.05,
      solid - 0.1,
      0.1,
    );
    this.geometries.push(armorGeo);
    const armorRing = new THREE.Mesh(armorGeo, armor);
    armorRing.name = 'gate-armor';
    armorRing.position.z = -0.05;
    this.plate.add(armorRing);

    // Soft cyan wash fills the open pie so the throw lane reads Spark-sized.
    const fillGeo = extrudedAnnulus(hub * 1.02, outer - 0.04, -gap / 2, gap, 0.04);
    this.geometries.push(fillGeo);
    const fill = new THREE.Mesh(fillGeo, this.gapFill);
    fill.name = 'gap-fill';
    fill.position.z = 0.06;
    this.plate.add(fill);

    // Ribs stay inset from the gap edges so they never read as blocking the pie.
    const ribCount = 8;
    const ribInset = 0.14;
    for (let i = 0; i < ribCount; i++) {
      const a = solidStart + ribInset + ((i + 0.5) / ribCount) * (solid - ribInset * 2);
      const rib = this.kit.box(
        this.plate,
        `rib-${i}`,
        0.055,
        Math.max(0.08, (outer - plateInner) * 0.55),
        0.06,
        Math.cos(a) * ((plateInner + outer) / 2 + 0.04),
        Math.sin(a) * ((plateInner + outer) / 2 + 0.04),
        -0.11,
        steel,
        0.004,
      );
      rib.rotation.z = a + Math.PI / 2;
    }

    // Solid hub cap (thick so it reads face-on)
    const hubShape = new THREE.Shape();
    hubShape.absarc(0, 0, hub, 0, Math.PI * 2, false);
    const hubCapGeo = new THREE.ExtrudeGeometry(hubShape, { depth: 0.12, bevelEnabled: false });
    hubCapGeo.translate(0, 0, -0.06);
    this.geometries.push(hubCapGeo);
    const hubCap = new THREE.Mesh(hubCapGeo, dark);
    hubCap.name = 'hub-cap';
    this.plate.add(hubCap);

    // Hub collar
    const hubGeo = new THREE.TorusGeometry(hub + 0.04, 0.055, 8, SEGMENTS);
    this.geometries.push(hubGeo);
    const hubMesh = new THREE.Mesh(hubGeo, steel);
    hubMesh.name = 'hub-collar';
    hubMesh.position.z = -0.04;
    this.plate.add(hubMesh);

    // Outer rim (full circle housing)
    const rimGeo = new THREE.TorusGeometry(outer + 0.02, 0.05, 8, SEGMENTS);
    this.geometries.push(rimGeo);
    const rim = new THREE.Mesh(rimGeo, armor);
    rim.name = 'outer-rim';
    rim.position.z = -0.02;
    this.plate.add(rim);

    // Gap lip lights mark the safe sector edges (collision ±gap/2).
    for (const side of [-1, 1] as const) {
      const a = side * (gap / 2);
      const lip = this.kit.box(
        this.plate,
        `gap-lip-${side > 0 ? 'a' : 'b'}`,
        0.1,
        outer - plateInner - 0.08,
        0.055,
        Math.cos(a) * ((plateInner + outer) / 2),
        Math.sin(a) * ((plateInner + outer) / 2),
        -0.14,
        this.gapGlow,
        0.002,
      );
      lip.rotation.z = a + Math.PI / 2;
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

    this.accent = new THREE.PointLight(0x5ec8e8, 12, 14, 2);
    this.accent.name = 'gate-accent';
    this.group.add(this.accent);
    this.update(0);
  }

  update(time: number) {
    const state = rotatingGateStateAtTime(this.config, time);
    this.plate.rotation.z = state.gapAngle;
    const pulse = 0.5 + 0.5 * Math.sin(time * 2.4);
    this.gapGlow.emissiveIntensity = 0.75 + pulse * 0.5;
    this.gapFill.opacity = 0.16 + pulse * 0.12;
    this.accent.intensity = 9 + pulse * 6;
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
