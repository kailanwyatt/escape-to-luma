import * as THREE from 'three';
import type { ConveyorGateConfig } from '../../config/ObstacleConfig';
import { conveyorGateBlocksAtTime } from '../ExtendedLibraryState';
import { FacilityArtKit } from '../FacilityArtKit';

/** Archived patrol drones (pre-cinematic pass). */
export class CaptureDroneArtV1 {
  readonly group = new THREE.Group();
  private readonly kit = new FacilityArtKit();
  private readonly geometry: THREE.BufferGeometry[] = [];
  private readonly drones: Array<Array<{ mesh: THREE.Mesh; offset: THREE.Vector3 }>> = [];

  constructor(private readonly config: ConveyorGateConfig) {
    this.group.name = 'capture-drone-v1';
    const armor = this.kit.metal(0x526b7c, 0.34);
    const rim = this.kit.metal(0xa7b8c1, 0.25);
    const dark = this.kit.metal(0x0e1924, 0.48, false);
    const optic = this.kit.lamp();
    optic.color.setHex(0xffb449);
    optic.emissive.setHex(0xffa12a);
    const hull = new THREE.SphereGeometry(1, 24, 16);
    const ring = new THREE.TorusGeometry(0.84, 0.065, 6, 32);
    this.geometry.push(hull, ring);
    conveyorGateBlocksAtTime(config, 0).forEach((s, i) => {
      const parts: Array<{ mesh: THREE.Mesh; offset: THREE.Vector3 }> = [];
      this.drones.push(parts);
      const record = (m: THREE.Mesh) => {
        parts.push({ mesh: m, offset: m.position.clone() });
      };
      const body = new THREE.Mesh(hull, armor);
      body.name = `patrol-hull-${i}`;
      body.scale.set(s.radius, s.radius, s.radius * 0.76);
      this.group.add(body);
      record(body);
      const collar = new THREE.Mesh(ring, rim);
      collar.name = `armor-seam-${i}`;
      collar.scale.setScalar(s.radius);
      collar.position.z = -s.radius * 0.39;
      this.group.add(collar);
      record(collar);
      const box = (name: string, w: number, h: number, d: number, x: number, y: number, z: number, m: THREE.Material) => {
        record(
          this.kit.box(
            this.group,
            `${name}-${i}`,
            w * s.radius,
            h * s.radius,
            d * s.radius,
            x * s.radius,
            y * s.radius,
            z * s.radius,
            m,
            0.02 * s.radius,
          ),
        );
      };
      box('optical-recess', 1.38, 0.4, 0.12, 0, 0, -0.74, dark);
      box('scanner-lens', 1.12, 0.12, 0.055, 0, 0, -0.82, optic);
      for (const side of [-1, 1]) {
        box('visor-arm', 0.12, 0.42, 0.13, side * 0.68, 0, -0.73, armor);
        box('propulsion-pocket', 0.38, 0.24, 0.07, side * 0.39, -0.48, -0.59, dark);
        for (let j = 0; j < 3; j++) box('vent-fin', 0.035, 0.16, 0.025, side * 0.39 + (j - 1) * 0.09, -0.48, -0.64, rim);
      }
      box('dorsal-inset', 0.53, 0.12, 0.035, 0, 0.63, -0.47, dark);
      box('dorsal-ridge', 0.15, 0.29, 0.07, 0, 0.6, -0.49, armor);
    });
    this.update(0);
  }

  update(time: number) {
    conveyorGateBlocksAtTime(this.config, time).forEach((s, i) => {
      for (const p of this.drones[i]) p.mesh.position.set(s.x + p.offset.x, s.y + p.offset.y, p.offset.z);
    });
  }

  dispose() {
    this.kit.dispose();
    this.geometry.forEach((g) => g.dispose());
    this.group.clear();
  }
}
