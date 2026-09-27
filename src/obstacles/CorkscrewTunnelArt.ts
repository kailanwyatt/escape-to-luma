import * as THREE from 'three';
import type { CorkscrewTunnelConfig } from '../config/ObstacleConfig';
import { corkscrewStateAtTime } from './ExtendedLibraryState';
import { FacilityArtKit } from './FacilityArtKit';

const SEGMENTS = 48;

/** Thick annular sector — face-on readable tunnel mouth (flat rings vanish as silhouettes). */
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
 * Forgotten transit conduit — solid bore with one timed cyan sector.
 * Gap angle samples corkscrewStateAtTime; plate stays mesh-free in the open pie.
 */
export class CorkscrewTunnelArt {
  readonly group = new THREE.Group();
  private readonly kit = new FacilityArtKit({ cinematic: true });
  private readonly plate = new THREE.Group();
  private readonly gapGlow: THREE.MeshStandardMaterial;
  private readonly gapFill: THREE.MeshBasicMaterial;
  private readonly accent: THREE.PointLight;
  private readonly ownedMaterials: THREE.Material[] = [];
  private readonly geometries: THREE.BufferGeometry[] = [];

  constructor(private readonly config: CorkscrewTunnelConfig) {
    this.group.name = 'corkscrew-tunnel-art';
    const armor = this.kit.metal(0x4a5a68, 0.36);
    const steel = this.kit.metal(0xa8b8c4, 0.22);
    const dark = this.kit.metal(0x243240, 0.52, false);
    dark.emissive.setHex(0x152028);
    dark.emissiveIntensity = 0.32;
    const copper = this.kit.metal(0xc49a62, 0.28);
    copper.emissive.setHex(0x5a3a18);
    copper.emissiveIntensity = 0.22;

    this.gapGlow = this.kit.lamp();
    this.gapGlow.color.setHex(0x7ce8ff);
    this.gapGlow.emissive.setHex(0x3aa8c9);
    this.gapFill = new THREE.MeshBasicMaterial({
      color: 0x5ec8e8,
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    this.ownedMaterials.push(this.gapFill);

    this.plate.name = 'conduit-plate';
    this.group.add(this.plate);

    const outer = config.radius;
    const hub = Math.max(0.12, Math.min(config.innerRadius ?? outer * 0.18, outer - 0.35));
    const gap = Math.max(0.35, config.gapWidth);
    const solid = Math.PI * 2 - gap;
    const solidStart = gap / 2;
    const plateInner = hub * 0.92;

    // Deep bore wall — reads as a transit tunnel mouth, not a flat sticker.
    const wallGeo = extrudedAnnulus(plateInner, outer, solidStart, solid, 0.22);
    this.geometries.push(wallGeo);
    const wall = new THREE.Mesh(wallGeo, dark);
    wall.name = 'conduit-wall';
    wall.userData.thetaStart = solidStart;
    wall.userData.thetaLength = solid;
    this.plate.add(wall);

    const armorGeo = extrudedAnnulus(
      plateInner + (outer - plateInner) * 0.18,
      outer - 0.06,
      solidStart + 0.04,
      solid - 0.08,
      0.12,
    );
    this.geometries.push(armorGeo);
    const armorRing = new THREE.Mesh(armorGeo, armor);
    armorRing.name = 'conduit-armor';
    armorRing.position.z = -0.06;
    this.plate.add(armorRing);

    // Soft cyan wash in the open pie — throw lane sized.
    const fillGeo = extrudedAnnulus(hub * 1.05, outer - 0.05, -gap / 2, gap, 0.05);
    this.geometries.push(fillGeo);
    const fill = new THREE.Mesh(fillGeo, this.gapFill);
    fill.name = 'gap-fill';
    fill.position.z = 0.07;
    this.plate.add(fill);

    // Helix ridges along the solid bore (decorative; stay clear of gap edges).
    const ridgeCount = 7;
    const ridgeInset = 0.16;
    for (let i = 0; i < ridgeCount; i++) {
      const a = solidStart + ridgeInset + ((i + 0.5) / ridgeCount) * (solid - ridgeInset * 2);
      const mid = (plateInner + outer) / 2;
      const ridge = this.kit.box(
        this.plate,
        `helix-${i}`,
        0.06,
        Math.max(0.1, (outer - plateInner) * 0.62),
        0.07,
        Math.cos(a) * (mid + 0.02),
        Math.sin(a) * (mid + 0.02),
        -0.12,
        copper,
        0.004,
      );
      ridge.rotation.z = a + Math.PI / 2;
    }

    // Solid hub (center throws fail — same lesson as rotatingGate).
    const hubShape = new THREE.Shape();
    hubShape.absarc(0, 0, hub, 0, Math.PI * 2, false);
    const hubCapGeo = new THREE.ExtrudeGeometry(hubShape, { depth: 0.14, bevelEnabled: false });
    hubCapGeo.translate(0, 0, -0.07);
    this.geometries.push(hubCapGeo);
    const hubCap = new THREE.Mesh(hubCapGeo, dark);
    hubCap.name = 'conduit-hub';
    this.plate.add(hubCap);

    const hubGeo = new THREE.TorusGeometry(hub + 0.045, 0.05, 8, SEGMENTS);
    this.geometries.push(hubGeo);
    const hubMesh = new THREE.Mesh(hubGeo, steel);
    hubMesh.name = 'hub-collar';
    hubMesh.position.z = -0.04;
    this.plate.add(hubMesh);

    // Outer housing + copper transit lip.
    const rimGeo = new THREE.TorusGeometry(outer + 0.03, 0.055, 8, SEGMENTS);
    this.geometries.push(rimGeo);
    const rim = new THREE.Mesh(rimGeo, armor);
    rim.name = 'outer-rim';
    rim.position.z = -0.02;
    this.plate.add(rim);

    const lipGeo = new THREE.TorusGeometry(outer - 0.02, 0.028, 6, SEGMENTS);
    this.geometries.push(lipGeo);
    const lip = new THREE.Mesh(lipGeo, copper);
    lip.name = 'transit-lip';
    lip.position.z = -0.08;
    this.plate.add(lip);

    // Gap edge lights mark the safe sector (±gap/2).
    for (const side of [-1, 1] as const) {
      const a = side * (gap / 2);
      const marker = this.kit.box(
        this.plate,
        `gap-lip-${side > 0 ? 'a' : 'b'}`,
        0.11,
        outer - plateInner - 0.06,
        0.06,
        Math.cos(a) * ((plateInner + outer) / 2),
        Math.sin(a) * ((plateInner + outer) / 2),
        -0.15,
        this.gapGlow,
        0.002,
      );
      marker.rotation.z = a + Math.PI / 2;
    }

    // Mount struts around the housing.
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      this.kit.box(
        this.group,
        `mount-${i}`,
        0.24,
        0.14,
        0.2,
        Math.cos(a) * (outer + 0.14),
        Math.sin(a) * (outer + 0.14),
        0.03,
        steel,
        0.006,
      );
    }

    this.accent = new THREE.PointLight(0x5ec8e8, 11, 13, 2);
    this.accent.name = 'conduit-accent';
    this.group.add(this.accent);
    this.update(0);
  }

  update(time: number) {
    const state = corkscrewStateAtTime(this.config, time);
    this.plate.rotation.z = state.gapAngle;
    const pulse = 0.5 + 0.5 * Math.sin(time * 2.2);
    this.gapGlow.emissiveIntensity = 0.7 + pulse * 0.55;
    this.gapFill.opacity = 0.18 + pulse * 0.14;
    this.accent.intensity = 8 + pulse * 6;
    this.accent.position.set(state.centerX, state.centerY, -1.15);
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
