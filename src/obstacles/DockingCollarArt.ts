import { ringVolume } from './SpaceSurfaceArt';
import * as THREE from 'three';
import type { DockingCollarConfig } from '../config/ObstacleConfig';
import { dockingCollarStateAtTime } from './DockingCollarState';
import { FacilityArtKit } from './FacilityArtKit';

const SEGMENTS = 40;
function extrudedAnnulus(inner: number, outer: number, start: number, span: number, depth: number): THREE.BufferGeometry {
  const geometry = ringVolume(SEGMENTS); writeAnnulus(geometry, inner, outer, start, span, depth); return geometry;
}
function writeAnnulus(geometry: THREE.BufferGeometry, inner: number, outer: number, start: number, span: number, depth: number) {
  const p = geometry.getAttribute('position');
  for (let row = 0; row < 4; row++) for (let i = 0; i <= SEGMENTS; i++) {
    const r = row % 2 === 0 ? inner : outer, a = start + i / SEGMENTS * span;
    p.setXYZ(row * (SEGMENTS + 1) + i, Math.cos(a) * r, Math.sin(a) * r, row < 2 ? -depth / 2 : depth / 2);
  }
  p.needsUpdate = true; geometry.computeVertexNormals(); geometry.computeBoundingSphere();
}

/**
 * Cinematic docking collar — two thick jaws clamp a circular hatch.
 * Opening radius samples DockingCollarState; cyan wash marks the open window.
 *
 * Fixed jaw buffers follow the exact opening without stepped radii or allocation churn.
 */
export class DockingCollarArt {
  readonly group = new THREE.Group();
  private readonly kit = new FacilityArtKit({ cinematic: true });
  private readonly leftJaw: THREE.Mesh;
  private readonly rightJaw: THREE.Mesh;
  private readonly leftEdge: THREE.Mesh;
  private readonly rightEdge: THREE.Mesh;
  private readonly holeFill: THREE.Mesh;
  private readonly plug: THREE.Mesh;
  private readonly frame: THREE.Group;
  private readonly lamps: THREE.MeshStandardMaterial[] = [];
  private readonly edgeMat: THREE.MeshStandardMaterial;
  private readonly holeMat: THREE.MeshBasicMaterial;
  private readonly ownedMaterials: THREE.Material[] = [];
  private readonly geometries: THREE.BufferGeometry[] = [];
  private readonly rams: THREE.Mesh[] = [];
  private readonly accent: THREE.PointLight;
  private jawInner = -1;
  private jawOuter = -1;

  constructor(private readonly config: DockingCollarConfig) {
    this.group.name = 'docking-collar-art';
    const armor = this.kit.metal(0x4a5d6e, 0.34);
    const steel = this.kit.metal(0xb0bec9, 0.2);
    const dark = this.kit.metal(0x243444, 0.52, false);
    dark.emissive.setHex(0x15202c);
    dark.emissiveIntensity = 0.3;
    const lamp = this.kit.lamp();
    this.lamps.push(lamp);
    const lampCore = this.kit.lampCore();
    this.lamps.push(lampCore);

    this.edgeMat = new THREE.MeshStandardMaterial({
      color: 0x9de9ff,
      emissive: 0x4aa7c9,
      emissiveIntensity: 0.9,
      metalness: 0.12,
      roughness: 0.28,
      side: THREE.DoubleSide,
    });
    this.ownedMaterials.push(this.edgeMat);
    this.lamps.push(this.edgeMat);

    this.holeMat = new THREE.MeshBasicMaterial({
      color: 0x5ec8e8,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.ownedMaterials.push(this.holeMat);

    // Placeholder jaws — rebuilt sparsely when quantized radii change.
    const stub = extrudedAnnulus(0.5, 1, Math.PI * 0.5, Math.PI, 0.16);
    this.geometries.push(stub);
    this.leftJaw = new THREE.Mesh(stub, dark);
    this.leftJaw.name = 'jaw-left';
    this.rightJaw = new THREE.Mesh(stub.clone(), dark);
    this.rightJaw.name = 'jaw-right';
    this.geometries.push(this.rightJaw.geometry as THREE.BufferGeometry);
    this.leftEdge = new THREE.Mesh(stub.clone(), this.edgeMat);
    this.leftEdge.name = 'jaw-edge-left';
    this.geometries.push(this.leftEdge.geometry as THREE.BufferGeometry);
    this.rightEdge = new THREE.Mesh(stub.clone(), this.edgeMat);
    this.rightEdge.name = 'jaw-edge-right';
    this.geometries.push(this.rightEdge.geometry as THREE.BufferGeometry);
    this.group.add(this.leftJaw, this.rightJaw, this.leftEdge, this.rightEdge);

    // Unit circle scaled each frame — no ExtrudeGeometry thrash for the wash.
    const holeGeo = new THREE.CircleGeometry(1, 48);
    this.geometries.push(holeGeo);
    this.holeFill = new THREE.Mesh(holeGeo, this.holeMat);
    this.holeFill.name = 'collar-hole-fill';
    this.holeFill.position.z = 0.05;
    this.group.add(this.holeFill);

    const plugShape = new THREE.Shape();
    plugShape.absarc(0, 0, 1, 0, Math.PI * 2, false);
    const plugGeo = new THREE.ExtrudeGeometry(plugShape, { depth: 0.14, bevelEnabled: false });
    plugGeo.translate(0, 0, -0.07);
    this.geometries.push(plugGeo);
    this.plug = new THREE.Mesh(plugGeo, dark);
    this.plug.name = 'collar-plug';
    this.group.add(this.plug);

    this.frame = new THREE.Group();
    this.frame.name = 'collar-frame';
    this.group.add(this.frame);
    const R = config.outerRadius;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const pod = new THREE.Group();
      pod.rotation.z = a;
      this.frame.add(pod);
      this.kit.box(pod, `dock-pod-${i}`, 0.32, 0.22, 0.24, R + 0.08, 0, 0.02, dark, 0.01);
      this.kit.box(pod, `dock-armor-${i}`, 0.24, 0.16, 0.18, R + 0.1, 0, -0.02, armor, 0.008);
      this.kit.box(pod, `dock-steel-${i}`, 0.16, 0.1, 0.04, R + 0.1, 0, -0.12, steel, 0.004);
      this.kit.box(pod, `dock-lamp-${i}`, 0.1, 0.06, 0.02, R + 0.1, 0, -0.14, lamp, 0.003);
      this.kit.box(pod, `dock-core-${i}`, 0.05, 0.03, 0.012, R + 0.1, 0, -0.155, lampCore, 0);
    }
    const torusGeo = new THREE.TorusGeometry(R + 0.02, 0.05, 8, 48);
    this.geometries.push(torusGeo);
    const torus = new THREE.Mesh(torusGeo, steel);
    torus.name = 'dock-torus';
    torus.position.z = -0.06;
    this.frame.add(torus);

    const sleeveGeo = extrudedAnnulus(R + .03, R + .18, 0, Math.PI * 2, .7);
    this.geometries.push(sleeveGeo); const sleeve = new THREE.Mesh(sleeveGeo, armor); sleeve.position.z = .24; this.frame.add(sleeve);
    for (const side of [-1, 1]) {
      this.kit.box(this.frame, 'dock-hydraulic-housing', .5, R * 1.6, .65, side * (R + .35), 0, .2, dark, .025);
      this.kit.box(this.frame, 'dock-mount-flange', R * 2 + 1.2, .26, .7, 0, side * (R + .24), .2, armor, .02);
      const ram = this.kit.box(this.frame, 'dock-hydraulic-ram', .3, .16, .16, side * R, 0, -.2, steel, .008);
      this.rams.push(ram);
    }

    this.kit.box(this.group, 'hinge-top', 0.32, 0.2, 0.24, 0, R * 0.92, 0.04, steel, 0.008);
    this.kit.box(this.group, 'hinge-bot', 0.32, 0.2, 0.24, 0, -R * 0.92, 0.04, steel, 0.008);

    this.accent = new THREE.PointLight(0xffb449, 10, 12, 2);
    this.accent.name = 'docking-accent';
    this.group.add(this.accent);
    this.update(0);
  }

  private rebuildJaw(mesh: THREE.Mesh, inner: number, outer: number, start: number, span: number, depth: number) {
    writeAnnulus(mesh.geometry, inner, outer, start, span, depth);
  }

  update(time: number) {
    const s = dockingCollarStateAtTime(this.config, time);
    const inner = Math.max(0.001, s.openingRadius);
    const outer = s.outerRadius;
    const sealed = s.fraction < 0.08;
    const qInner = inner;
    const qOuter = outer;

    if (qInner !== this.jawInner || qOuter !== this.jawOuter) {
      this.jawInner = qInner;
      this.jawOuter = qOuter;
      this.rebuildJaw(this.leftJaw, qInner, qOuter, Math.PI * 0.5, Math.PI, 0.18);
      this.rebuildJaw(this.rightJaw, qInner, qOuter, -Math.PI * 0.5, Math.PI, 0.18);
      const edgeInner = Math.max(0.001, qInner - 0.02);
      const edgeOuter = Math.min(qOuter, qInner + 0.07);
      this.rebuildJaw(this.leftEdge, edgeInner, edgeOuter, Math.PI * 0.5, Math.PI, 0.06);
      this.rebuildJaw(this.rightEdge, edgeInner, edgeOuter, -Math.PI * 0.5, Math.PI, 0.06);
    }

    this.leftJaw.position.set(s.centerX, s.centerY, 0);
    this.rightJaw.position.set(s.centerX, s.centerY, 0);
    this.leftEdge.position.set(s.centerX, s.centerY, -0.04);
    this.rightEdge.position.set(s.centerX, s.centerY, -0.04);

    this.holeFill.position.set(s.centerX, s.centerY, 0.06);
    this.holeFill.scale.setScalar(Math.max(0.05, inner * 0.98));
    this.holeFill.visible = !sealed && s.openingRadius > 0.2;

    // Solid plug when clamped — matches full-plate collision.
    const plugR = Math.max(0.08, sealed ? outer * 0.98 : Math.min(inner, 0.2));
    this.plug.scale.setScalar(plugR);
    this.plug.position.set(s.centerX, s.centerY, 0.02);
    this.plug.visible = sealed || s.openingRadius < 0.28;

    this.frame.position.set(s.centerX, s.centerY, 0);
    this.rams.forEach((ram, i) => { const side = i === 0 ? -1 : 1; ram.position.x = side * (outer + .08 + s.fraction * .2); });
    const hingeTop = this.group.getObjectByName('hinge-top');
    const hingeBot = this.group.getObjectByName('hinge-bot');
    if (hingeTop) {
      hingeTop.position.x = s.centerX;
      hingeTop.position.y = s.centerY + outer * 0.92;
    }
    if (hingeBot) {
      hingeBot.position.x = s.centerX;
      hingeBot.position.y = s.centerY - outer * 0.92;
    }

    const color =
      s.phase === 'open' || s.phase === 'opening'
        ? 0x70e5ed
        : s.warning
          ? 0xffb449
          : 0xff7562;
    for (const lamp of this.lamps) {
      lamp.color.setHex(color);
      if ('emissive' in lamp) {
        (lamp as THREE.MeshStandardMaterial).emissive.setHex(color);
        (lamp as THREE.MeshStandardMaterial).emissiveIntensity = s.warning
          ? 1.35
          : s.phase === 'open'
            ? 0.9
            : 1.1;
      }
    }
    this.holeMat.color.setHex(color);
    this.holeMat.opacity = s.phase === 'open' ? 0.28 : s.warning ? 0.34 : sealed ? 0 : 0.18;
    this.accent.color.setHex(color);
    this.accent.intensity = s.warning ? 16 : s.phase === 'open' ? 9 : 12;
    this.accent.position.set(s.centerX, s.centerY, -1.1);
    this.group.userData.phase = s.phase;
    this.group.userData.warning = s.warning;
  }

  dispose() {
    this.kit.dispose();
    for (const g of this.geometries) g.dispose();
    this.geometries.length = 0;
    for (const m of this.ownedMaterials) m.dispose();
    this.group.clear();
    this.group.removeFromParent();
  }
}
