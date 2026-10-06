import * as THREE from 'three';
import type { NullTendrilConfig } from '../config/ObstacleConfig';
import { nullTendrilStateAtTime } from './NullTendrilState';
import { NULL_PALETTE, NullFleshKit } from './NullFleshKit';

type Blob = {
  mesh: THREE.Mesh;
  baseScale: THREE.Vector3;
  phase: number;
};

function annulusSector(
  inner: number,
  outer: number,
  start: number,
  span: number,
  segs = 28,
): THREE.ShapeGeometry {
  const shape = new THREE.Shape();
  for (let i = 0; i <= segs; i++) {
    const a = start + (i / segs) * span;
    if (i === 0) shape.moveTo(Math.cos(a) * outer, Math.sin(a) * outer);
    else shape.lineTo(Math.cos(a) * outer, Math.sin(a) * outer);
  }
  for (let i = segs; i >= 0; i--) {
    const a = start + (i / segs) * span;
    shape.lineTo(Math.cos(a) * inner, Math.sin(a) * inner);
  }
  shape.closePath();
  return new THREE.ShapeGeometry(shape, segs);
}

/**
 * Null Tendril — egg-blob coils of the void-moon leave one violet corridor.
 * Concept: floating flesh orbs in an arc; no annular plate / metal ring.
 */
export class NullTendrilArt {
  readonly group = new THREE.Group();
  private readonly tendrilRoot = new THREE.Group();
  private readonly kit = new NullFleshKit();
  private readonly blobs: Blob[] = [];
  private readonly gapLips: THREE.Mesh[] = [];
  private readonly gapGlowMat: THREE.MeshBasicMaterial;
  private readonly accent: THREE.PointLight;
  private readonly geometries: THREE.BufferGeometry[] = [];

  constructor(private readonly config: NullTendrilConfig) {
    this.group.name = 'null-tendril-art';
    this.tendrilRoot.name = 'tendril-root';
    this.group.add(this.tendrilRoot);

    const count = Math.max(2, Math.floor(config.tendrilCount));
    const gap = Math.max(0.4, config.gapWidth);
    const solid = Math.PI * 2 - gap;
    const outer = config.outerRadius;
    const inner = Math.max(0.15, Math.min(config.innerRadius, outer - 0.4));
    const solidStart = gap / 2;
    const midR = (inner + outer) / 2;
    const blobGeo = new THREE.SphereGeometry(1, 14, 12);
    this.geometries.push(blobGeo);

    const orbsPerLimb = 4;
    for (let i = 0; i < count; i++) {
      const a0 = solidStart + (i / count) * solid;
      const a1 = solidStart + ((i + 1) / count) * solid;
      for (let s = 0; s < orbsPerLimb; s++) {
        const u = (s + 0.5) / orbsPerLimb;
        const a = a0 + (a1 - a0) * u;
        const weave = 0.35 + 0.55 * (0.5 + 0.5 * Math.sin(i * 2.1 + s * 1.7));
        const r = inner + (outer - inner) * weave;
        const size = 0.16 + (s % 3) * 0.045 + (i % 2) * 0.02;
        const mat = s % 2 ? this.kit.flesh : this.kit.dark;
        const mesh = new THREE.Mesh(blobGeo, mat);
        mesh.name = s === 0 ? `living-tendril-${i}` : `tendril-seg-${i}-${s}`;
        mesh.position.set(Math.cos(a) * r, Math.sin(a) * r, -0.02 - s * 0.008);
        const baseScale = new THREE.Vector3(size * 1.35, size * 1.05, size * 0.82);
        mesh.scale.copy(baseScale);
        this.tendrilRoot.add(mesh);
        this.blobs.push({ mesh, baseScale, phase: i * 0.9 + s * 0.4 });
      }
    }

    for (const side of [-1, 1] as const) {
      const a = side * (gap / 2);
      const lip = new THREE.Mesh(blobGeo, this.kit.telegraph);
      lip.name = `corridor-lip-${side > 0 ? 'a' : 'b'}`;
      lip.position.set(Math.cos(a) * midR, Math.sin(a) * midR, -0.06);
      lip.scale.set(0.14, 0.11, 0.1);
      this.tendrilRoot.add(lip);
      this.gapLips.push(lip);
    }

    this.gapGlowMat = new THREE.MeshBasicMaterial({
      color: NULL_PALETTE.telegraph,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const gapGeo = annulusSector(inner * 0.98, outer * 1.02, -gap / 2, gap);
    this.geometries.push(gapGeo);
    const gapMesh = new THREE.Mesh(gapGeo, this.gapGlowMat);
    gapMesh.name = 'corridor-glow';
    gapMesh.position.z = 0.08;
    this.tendrilRoot.add(gapMesh);

    this.accent = new THREE.PointLight(NULL_PALETTE.telegraph, 14, 13, 2);
    this.accent.name = 'tendril-accent';
    this.group.add(this.accent);
    this.update(0);
  }

  update(time: number) {
    const state = nullTendrilStateAtTime(this.config, time);
    this.group.position.set(state.centerX, state.centerY, 0);
    this.tendrilRoot.rotation.z = state.gapAngle;

    for (const blob of this.blobs) {
      const pulse = 0.94 + 0.08 * Math.sin(time * 2.4 + blob.phase);
      blob.mesh.scale.set(
        blob.baseScale.x * pulse,
        blob.baseScale.y * pulse,
        blob.baseScale.z * pulse,
      );
      blob.mesh.position.z = -0.02 + Math.sin(time * 1.8 + blob.phase) * 0.012;
    }

    const breathe = 0.7 + 0.3 * Math.sin(time * 1.9);
    this.kit.flesh.emissiveIntensity = 0.55 + breathe * 0.35;
    this.kit.dark.emissiveIntensity = 0.32 + breathe * 0.25;
    this.kit.telegraph.emissiveIntensity = 0.9 + breathe * 0.4;
    this.gapGlowMat.opacity = 0.16 + breathe * 0.12;

    this.gapLips.forEach((lip, i) => {
      lip.scale.setScalar(0.95 + 0.12 * Math.sin(time * 3.1 + i));
    });

    this.accent.intensity = 12 + breathe * 6;
    this.accent.position.set(
      Math.cos(state.gapAngle) * ((state.innerRadius + state.outerRadius) / 2),
      Math.sin(state.gapAngle) * ((state.innerRadius + state.outerRadius) / 2),
      -1.0,
    );
  }

  dispose() {
    for (const g of this.geometries) g.dispose();
    this.gapGlowMat.dispose();
    this.kit.dispose();
    this.group.clear();
    this.group.removeFromParent();
  }
}
