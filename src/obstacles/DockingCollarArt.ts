import * as THREE from 'three';
import type { DockingCollarConfig } from '../config/ObstacleConfig';
import { dockingCollarStateAtTime } from './DockingCollarState';
import { FacilityArtKit } from './FacilityArtKit';

const SEGMENTS = 64;

/**
 * Cinematic docking collar — two jaws clamp a circular hatch.
 * Opening radius samples DockingCollarState; plate fills the annulus.
 */
export class DockingCollarArt {
  readonly group = new THREE.Group();
  private readonly kit = new FacilityArtKit({ cinematic: true });
  private readonly leftJaw: THREE.Mesh;
  private readonly rightJaw: THREE.Mesh;
  private readonly leftEdge: THREE.Mesh;
  private readonly rightEdge: THREE.Mesh;
  private readonly frame: THREE.Group;
  private readonly lamps: THREE.MeshStandardMaterial[] = [];
  private readonly ownedMaterials: THREE.Material[] = [];
  private readonly geometries: THREE.BufferGeometry[] = [];
  private readonly accent: THREE.PointLight;

  constructor(private readonly config: DockingCollarConfig) {
    this.group.name = 'docking-collar-art';
    const armor = this.kit.metal(0x3a4c5c, 0.32);
    const steel = this.kit.metal(0xa8b8c6, 0.2);
    const dark = this.kit.metal(0x0a121a, 0.65, false);
    const lamp = this.kit.lamp();
    this.lamps.push(lamp);
    const lampCore = this.kit.lampCore();
    this.lamps.push(lampCore);

    const jawMat = dark.clone();
    this.ownedMaterials.push(jawMat);
    const edgeMat = new THREE.MeshStandardMaterial({
      color: 0x9de9ff,
      emissive: 0x4aa7c9,
      emissiveIntensity: 0.9,
      metalness: 0.12,
      roughness: 0.28,
      side: THREE.DoubleSide,
    });
    this.ownedMaterials.push(edgeMat);
    this.lamps.push(edgeMat);

    this.leftJaw = this.makeJaw('jaw-left', jawMat, Math.PI * 0.5, Math.PI);
    this.rightJaw = this.makeJaw('jaw-right', jawMat, -Math.PI * 0.5, Math.PI);
    this.leftEdge = this.makeJaw('jaw-edge-left', edgeMat, Math.PI * 0.5, Math.PI);
    this.rightEdge = this.makeJaw('jaw-edge-right', edgeMat, -Math.PI * 0.5, Math.PI);
    this.group.add(this.leftJaw, this.rightJaw, this.leftEdge, this.rightEdge);

    this.frame = new THREE.Group();
    this.frame.name = 'collar-frame';
    this.group.add(this.frame);
    const R = config.outerRadius;
    // Outer docking ring stays outside the collision annulus (rim).
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
    const torusGeo = new THREE.TorusGeometry(R + 0.02, 0.04, 8, 48);
    this.geometries.push(torusGeo);
    const torus = new THREE.Mesh(torusGeo, steel);
    torus.name = 'dock-torus';
    torus.position.z = -0.06;
    this.frame.add(torus);

    // Hinge bosses on the clamp axis (inside outerRadius band when closed).
    this.kit.box(this.group, 'hinge-top', 0.28, 0.18, 0.22, 0, R * 0.92, 0.04, steel, 0.008);
    this.kit.box(this.group, 'hinge-bot', 0.28, 0.18, 0.22, 0, -R * 0.92, 0.04, steel, 0.008);

    this.accent = new THREE.PointLight(0xffb449, 10, 10, 2);
    this.accent.name = 'docking-accent';
    this.group.add(this.accent);
    this.update(0);
  }

  private makeJaw(name: string, material: THREE.Material, start: number, span: number) {
    const geo = new THREE.RingGeometry(0.5, 1, SEGMENTS, 1, start, span);
    this.geometries.push(geo);
    const mesh = new THREE.Mesh(geo, material);
    mesh.name = name;
    mesh.frustumCulled = false;
    return mesh;
  }

  private poseJaw(
    mesh: THREE.Mesh,
    cx: number,
    cy: number,
    inner: number,
    outer: number,
    z: number,
    start: number,
    span: number,
  ) {
    const positions = mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
    // RingGeometry layout: inner ring then outer ring.
    for (let row = 0; row < 2; row++) {
      const radius = row === 0 ? inner : outer;
      for (let j = 0; j <= SEGMENTS; j++) {
        const angle = start + (j / SEGMENTS) * span;
        positions.setXYZ(row * (SEGMENTS + 1) + j, Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
      }
    }
    positions.needsUpdate = true;
    mesh.geometry.computeVertexNormals();
    mesh.position.set(cx, cy, z);
  }

  update(time: number) {
    const s = dockingCollarStateAtTime(this.config, time);
    const inner = Math.max(0.02, s.openingRadius);
    const outer = s.outerRadius;
    const edgeInner = Math.max(0.02, inner - 0.04);
    const edgeOuter = Math.min(outer, inner + 0.05);

    this.poseJaw(this.leftJaw, s.centerX, s.centerY, inner, outer, 0, Math.PI * 0.5, Math.PI);
    this.poseJaw(this.rightJaw, s.centerX, s.centerY, inner, outer, 0, -Math.PI * 0.5, Math.PI);
    this.poseJaw(this.leftEdge, s.centerX, s.centerY, edgeInner, edgeOuter, -0.02, Math.PI * 0.5, Math.PI);
    this.poseJaw(this.rightEdge, s.centerX, s.centerY, edgeInner, edgeOuter, -0.02, -Math.PI * 0.5, Math.PI);

    this.frame.position.set(s.centerX, s.centerY, 0);
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
          : s.phase === 'slamming'
            ? 0xff7562
            : 0xff7562;
    for (const lamp of this.lamps) {
      lamp.color.setHex(color);
      if ('emissive' in lamp) {
        (lamp as THREE.MeshStandardMaterial).emissive.setHex(color);
        (lamp as THREE.MeshStandardMaterial).emissiveIntensity = s.warning
          ? 1.25
          : s.phase === 'open'
            ? 0.85
            : 1.05;
      }
    }
    this.accent.color.setHex(color);
    this.accent.intensity = s.warning ? 15 : s.phase === 'open' ? 8 : 11;
    this.accent.position.set(s.centerX, s.centerY, -1.1);
    this.group.userData.phase = s.phase;
    this.group.userData.warning = s.warning;
  }

  dispose() {
    this.kit.dispose();
    for (const g of this.geometries) g.dispose();
    for (const m of this.ownedMaterials) m.dispose();
    this.group.clear();
    this.group.removeFromParent();
  }
}
