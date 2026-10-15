import * as THREE from 'three';

import type { NullTendrilConfig } from '../config/ObstacleConfig';
import { nullTendrilStateAtTime } from './NullTendrilState';

type Plate = {
  mesh: THREE.Mesh<THREE.ShapeGeometry, THREE.MeshStandardMaterial>;
  phase: number;
};

type Reach = {
  group: THREE.Group;
  plates: Plate[];
};

const CYAN = 0x75edff;
const VIOLET = 0x8d55e8;

function annulusSector(
  inner: number,
  outer: number,
  start: number,
  span: number,
  segments = 10,
): THREE.ShapeGeometry {
  const shape = new THREE.Shape();
  for (let index = 0; index <= segments; index += 1) {
    const angle = start + (index / segments) * span;
    const x = Math.cos(angle) * outer;
    const y = Math.sin(angle) * outer;
    if (index === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  for (let index = segments; index >= 0; index -= 1) {
    const angle = start + (index / segments) * span;
    shape.lineTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
  }
  shape.closePath();
  return new THREE.ShapeGeometry(shape);
}

/**
 * Void Reaches — two segmented, near-black ribbons seal the annulus and leave
 * a cyan rotating corridor. It is render-only; NullTendrilState remains the
 * single source of collision and prediction truth.
 */
export class NullTendrilArt {
  readonly group = new THREE.Group();

  private readonly reaches: Reach[] = [];
  private readonly root = new THREE.Group();
  private readonly corridorLips: THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial>[] = [];
  private readonly plateMaterial = new THREE.MeshStandardMaterial({
    color: 0x080912,
    emissive: 0x160a2a,
    emissiveIntensity: 0.48,
    metalness: 0.72,
    roughness: 0.4,
    side: THREE.DoubleSide,
  });
  private readonly seamMaterial = new THREE.LineBasicMaterial({
    color: VIOLET,
    transparent: true,
    opacity: 0.36,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  private readonly lipMaterial = new THREE.MeshBasicMaterial({
    color: CYAN,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  private readonly corridorGlowMaterial = new THREE.MeshBasicMaterial({
    color: CYAN,
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
  private readonly corridorGlow: THREE.Mesh<THREE.ShapeGeometry, THREE.MeshBasicMaterial>;
  private readonly accent = new THREE.PointLight(CYAN, 10, 12, 2);
  private readonly geometries: THREE.BufferGeometry[] = [];

  constructor(private readonly config: NullTendrilConfig) {
    this.group.name = 'void-reaches-art';
    this.root.name = 'void-reaches-root';
    this.group.add(this.root);

    const gap = Math.max(0.4, config.gapWidth);
    const inner = Math.max(0.15, Math.min(config.innerRadius, config.outerRadius - 0.4));
    const outer = config.outerRadius;
    const solid = Math.PI * 2 - gap;
    // Two ribbons overlap at the far side, leaving just one intentional gap.
    const reachSpan = solid / 2 + 0.12;
    this.reaches.push(
      this.createReach('a', gap / 2, reachSpan, inner, outer),
      this.createReach('b', -gap / 2, -reachSpan, inner, outer),
    );

    const corridorGeo = annulusSector(inner * 0.985, outer * 1.015, -gap / 2, gap, 18);
    this.geometries.push(corridorGeo);
    this.corridorGlow = new THREE.Mesh(corridorGeo, this.corridorGlowMaterial);
    this.corridorGlow.name = 'void-corridor-glow';
    this.corridorGlow.position.z = 0.035;
    this.root.add(this.corridorGlow);

    const lipGeo = new THREE.BoxGeometry(0.058, outer - inner + 0.12, 0.03);
    this.geometries.push(lipGeo);
    const middle = (inner + outer) / 2;
    for (const [index, angle] of [-gap / 2, gap / 2].entries()) {
      const lip = new THREE.Mesh(lipGeo, this.lipMaterial);
      lip.name = `void-corridor-lip-${index === 0 ? 'a' : 'b'}`;
      lip.position.set(Math.cos(angle) * middle, Math.sin(angle) * middle, 0.07);
      lip.rotation.z = angle - Math.PI / 2;
      this.root.add(lip);
      this.corridorLips.push(lip);
    }

    this.accent.name = 'void-reaches-accent';
    this.group.add(this.accent);
    this.update(0);
  }

  update(time: number): void {
    const state = nullTendrilStateAtTime(this.config, time);
    this.group.position.set(state.centerX, state.centerY, 0);
    this.root.rotation.z = state.gapAngle;

    const pulse = 0.5 + 0.5 * Math.sin(time * 2.4);
    this.plateMaterial.emissiveIntensity = 0.34 + pulse * 0.2;
    this.seamMaterial.opacity = 0.24 + pulse * 0.2;
    this.corridorGlowMaterial.opacity = 0.12 + pulse * 0.14;
    for (const reach of this.reaches) {
      for (const plate of reach.plates) {
        plate.mesh.position.z = -0.015 + Math.sin(time * 1.9 + plate.phase) * 0.012;
      }
    }
    this.corridorLips.forEach((lip, index) => {
      lip.scale.setScalar(0.9 + pulse * 0.14 + index * 0.02);
    });
    const middle = (state.innerRadius + state.outerRadius) / 2;
    this.accent.position.set(
      state.centerX + Math.cos(state.gapAngle) * middle,
      state.centerY + Math.sin(state.gapAngle) * middle,
      -0.9,
    );
    this.accent.intensity = 8 + pulse * 8;
  }

  dispose(): void {
    for (const geometry of this.geometries) geometry.dispose();
    this.plateMaterial.dispose();
    this.seamMaterial.dispose();
    this.lipMaterial.dispose();
    this.corridorGlowMaterial.dispose();
    this.group.clear();
    this.group.removeFromParent();
  }

  private createReach(
    id: 'a' | 'b',
    start: number,
    span: number,
    inner: number,
    outer: number,
  ): Reach {
    const group = new THREE.Group();
    group.name = `void-reach-${id}`;
    const plates: Plate[] = [];
    const plateCount = 8;
    const plateSpan = span / plateCount;
    const direction = Math.sign(span);
    for (let index = 0; index < plateCount; index += 1) {
      const seam = Math.min(0.045, Math.abs(plateSpan) * 0.17);
      const plateStart = start + plateSpan * index + direction * seam / 2;
      const visibleSpan = plateSpan - direction * seam;
      const plateGeo = annulusSector(inner, outer, plateStart, visibleSpan);
      const seamGeo = new THREE.EdgesGeometry(plateGeo, 14);
      this.geometries.push(plateGeo, seamGeo);
      const plate = new THREE.Mesh(plateGeo, this.plateMaterial);
      plate.name = `void-reach-${id}-plate-${index}`;
      const seamLine = new THREE.LineSegments(seamGeo, this.seamMaterial);
      seamLine.name = `void-reach-${id}-seam-${index}`;
      seamLine.position.z = 0.025;
      group.add(plate, seamLine);
      plates.push({ mesh: plate, phase: index * 0.57 + (id === 'a' ? 0 : 1.4) });
    }
    this.root.add(group);
    return { group, plates };
  }
}
