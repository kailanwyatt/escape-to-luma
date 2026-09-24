import * as THREE from 'three';
import type { PulseRingConfig } from '../config/ObstacleConfig';
import { pulseRingStateAtTime } from './PulseRingState';
import { FacilityArtKit } from './FacilityArtKit';
import { spaceFinish } from './SpaceSurfaceArt';

const SEGMENTS = 96;

/**
 * Cinematic storm pulse ring.
 * Expanding band matches PulseRingState; hub stays empty.
 */
export class CinematicPulseRingArt {
  readonly group = new THREE.Group();
  private readonly kit = new FacilityArtKit({ cinematic: true });
  private readonly surface: THREE.Mesh;
  private readonly litEdge: THREE.Mesh;
  private readonly pods: THREE.Group[] = [];
  private readonly lamps: THREE.MeshStandardMaterial[] = [];
  private readonly ownedMaterials: THREE.Material[] = [];
  private readonly accent: THREE.PointLight;
  private readonly surfaceTime = { value: 0 };
  private readonly geometries: THREE.BufferGeometry[] = [];

  constructor(private readonly config: PulseRingConfig) {
    this.group.name = 'cinematic-pulse-ring';
    const armor = this.kit.metal(0x3a5168, 0.32);
    const steel = this.kit.metal(0xa8bcc8, 0.22);
    const dark = this.kit.metal(0x0c141c, 0.62, false);
    const lamp = this.kit.lamp();
    lamp.color.setHex(0x9de9ff);
    lamp.emissive.setHex(0x4aa7c9);
    this.lamps.push(lamp);
    const lampCore = this.kit.lampCore();
    lampCore.color.setHex(0xe6f3ff);
    lampCore.emissive.setHex(0x9de9ff);
    this.lamps.push(lampCore);

    const dangerMat = new THREE.MeshStandardMaterial({
      color: 0x6a9ec8,
      metalness: 0.55,
      roughness: 0.35,
      emissive: 0x1a4060,
      emissiveIntensity: 0.35,
      side: THREE.DoubleSide,
    });
    this.ownedMaterials.push(dangerMat);
    spaceFinish(dangerMat, 'pulse', this.surfaceTime);

    const surfaceGeo = new THREE.RingGeometry(1, 2, SEGMENTS);
    this.geometries.push(surfaceGeo);
    this.surface = new THREE.Mesh(surfaceGeo, dangerMat);
    this.surface.name = 'danger-surface';
    this.surface.frustumCulled = false;
    this.group.add(this.surface);

    const edgeMat = new THREE.MeshStandardMaterial({
      color: 0xe6f3ff,
      emissive: 0x9de9ff,
      emissiveIntensity: 0.9,
      metalness: 0.1,
      roughness: 0.25,
      side: THREE.DoubleSide,
    });
    this.ownedMaterials.push(edgeMat);
    const edgeGeo = new THREE.RingGeometry(1, 2, SEGMENTS);
    this.geometries.push(edgeGeo);
    this.litEdge = new THREE.Mesh(edgeGeo, edgeMat);
    this.litEdge.name = 'lit-edge';
    this.litEdge.frustumCulled = false;
    this.group.add(this.litEdge);

    // Compact pods sit inside the dangerous band (radial extent << thickness).
    const podW = Math.min(0.14, config.thickness * 1.1);
    const podH = Math.min(0.1, config.thickness * 0.85);
    for (let i = 0; i < 8; i++) {
      const pod = new THREE.Group();
      pod.name = `pulse-pod-${i}`;
      this.pods.push(pod);
      this.group.add(pod);
      this.kit.box(pod, 'armor', podW, podH, 0.1, 0, 0, 0.02, armor, 0.008);
      this.kit.box(pod, 'steel', podW * 0.72, podH * 0.7, 0.035, 0, 0, -0.05, steel, 0.004);
      this.kit.box(pod, 'lamp', podW * 0.45, podH * 0.4, 0.018, 0, 0, -0.07, lamp, 0.002);
      this.kit.box(pod, 'core', podW * 0.22, podH * 0.2, 0.01, 0, 0, -0.08, lampCore, 0);
    }

    this.accent = new THREE.PointLight(0x9de9ff, 10, 10, 2);
    this.accent.name = 'pulse-accent';
    this.accent.position.set(config.centerX, config.centerY, -1.05);
    this.group.add(this.accent);
    this.update(0);
  }

  private annulus(mesh: THREE.Mesh, x: number, y: number, inner: number, outer: number, z = 0) {
    const positions = mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let row = 0; row < 2; row++) {
      const radius = row === 0 ? inner : outer;
      for (let j = 0; j <= SEGMENTS; j++) {
        const angle = (j / SEGMENTS) * Math.PI * 2;
        positions.setXYZ(row * (SEGMENTS + 1) + j, Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
      }
    }
    positions.needsUpdate = true;
    mesh.position.set(x, y, z);
  }

  update(time: number) {
    this.surfaceTime.value = time;
    const s = pulseRingStateAtTime(this.config, time);
    const inner = Math.max(0.05, s.radius - s.thickness);
    const outer = s.radius + s.thickness;
    this.annulus(this.surface, s.centerX, s.centerY, inner, outer);
    this.annulus(this.litEdge, s.centerX, s.centerY, s.radius - s.thickness * 0.22, s.radius + s.thickness * 0.22, -0.005);

    const spin = time * 0.35;
    this.pods.forEach((pod, i) => {
      const a = spin + (i / 8) * Math.PI * 2;
      pod.position.set(s.centerX + Math.cos(a) * s.radius, s.centerY + Math.sin(a) * s.radius, 0);
      pod.rotation.z = a;
    });

    const hot = s.cycleT > 0.7;
    const color = hot ? 0xffb449 : 0x9de9ff;
    for (const lamp of this.lamps) {
      lamp.color.setHex(color);
      lamp.emissive.setHex(color);
      lamp.emissiveIntensity = hot ? 1.25 : 0.85 + 0.2 * Math.sin(time * 6);
    }
    this.accent.color.setHex(color);
    this.accent.intensity = 8 + s.cycleT * 6;
    this.accent.position.set(s.centerX, s.centerY, -1.05);
    this.group.userData.radius = s.radius;
  }

  dispose() {
    this.kit.dispose();
    this.ownedMaterials.forEach((m) => m.dispose());
    this.geometries.forEach((g) => g.dispose());
    this.group.clear();
    this.group.removeFromParent();
  }
}
