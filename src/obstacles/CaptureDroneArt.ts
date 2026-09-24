import * as THREE from 'three';
import type { ConveyorGateConfig } from '../config/ObstacleConfig';
import { conveyorGateBlocksAtTime } from './ExtendedLibraryState';
import { FacilityArtKit } from './FacilityArtKit';

/**
 * Cinematic patrol drones (conveyorGate).
 * Circular silhouettes and wrap motion stay authoritative.
 */
export class CaptureDroneArt {
  readonly group = new THREE.Group();
  private readonly kit = new FacilityArtKit({ cinematic: true });
  private readonly geometry: THREE.BufferGeometry[] = [];
  private readonly drones: Array<Array<{ mesh: THREE.Mesh; offset: THREE.Vector3 }>> = [];
  private readonly optics: THREE.MeshStandardMaterial[] = [];
  private readonly accent: THREE.PointLight;

  constructor(private readonly config: ConveyorGateConfig) {
    this.group.name = 'capture-drone-art';
    const armor = this.kit.metal(0x455868, 0.3);
    const rim = this.kit.metal(0xb0c0cb, 0.2);
    const dark = this.kit.metal(0x0c141c, 0.55, false);
    const optic = this.kit.lamp();
    optic.color.setHex(0xffb449);
    optic.emissive.setHex(0xffa12a);
    this.optics.push(optic);
    const opticCore = this.kit.lampCore();
    this.optics.push(opticCore);

    const hull = new THREE.SphereGeometry(1, 28, 18);
    const ring = new THREE.TorusGeometry(0.82, 0.07, 8, 36);
    this.geometry.push(hull, ring);

    conveyorGateBlocksAtTime(config, 0).forEach((s, i) => {
      const parts: Array<{ mesh: THREE.Mesh; offset: THREE.Vector3 }> = [];
      this.drones.push(parts);
      const record = (m: THREE.Mesh) => {
        parts.push({ mesh: m, offset: m.position.clone() });
      };
      const body = new THREE.Mesh(hull, armor);
      body.name = `patrol-hull-${i}`;
      body.scale.set(s.radius, s.radius, s.radius * 0.74);
      this.group.add(body);
      record(body);
      const collar = new THREE.Mesh(ring, rim);
      collar.name = `armor-seam-${i}`;
      collar.scale.setScalar(s.radius);
      collar.position.z = -s.radius * 0.36;
      this.group.add(collar);
      record(collar);
      const box = (
        name: string,
        w: number,
        h: number,
        d: number,
        x: number,
        y: number,
        z: number,
        m: THREE.Material,
        b = 0.015,
      ) => {
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
            b * s.radius,
          ),
        );
      };
      box('optical-recess', 1.28, 0.36, 0.11, 0, 0, -0.7, dark, 0);
      box('scanner-lens', 1.02, 0.1, 0.05, 0, 0, -0.78, optic, 0.01);
      box('scanner-core', 0.55, 0.045, 0.03, 0, 0, -0.84, opticCore, 0);
      for (const side of [-1, 1]) {
        box('visor-arm', 0.1, 0.38, 0.12, side * 0.62, 0, -0.7, armor, 0.01);
        box('propulsion-pocket', 0.34, 0.22, 0.06, side * 0.36, -0.44, -0.55, dark, 0);
        for (let j = 0; j < 3; j++) {
          box('vent-fin', 0.03, 0.14, 0.022, side * 0.36 + (j - 1) * 0.08, -0.44, -0.6, rim, 0.005);
        }
      }
      box('dorsal-inset', 0.48, 0.1, 0.03, 0, 0.58, -0.44, dark, 0);
      box('dorsal-ridge', 0.12, 0.26, 0.06, 0, 0.55, -0.46, armor, 0.008);
    });

    this.accent = new THREE.PointLight(0xffb449, 7, 9, 2);
    this.accent.name = 'drone-accent';
    this.accent.position.set(config.centerX, config.centerY ?? 3, -1.05);
    this.group.add(this.accent);
    this.update(0);
  }

  update(time: number) {
    const blocks = conveyorGateBlocksAtTime(this.config, time);
    let ax = 0;
    let ay = 0;
    blocks.forEach((s, i) => {
      for (const p of this.drones[i]) p.mesh.position.set(s.x + p.offset.x, s.y + p.offset.y, p.offset.z);
      ax += s.x;
      ay += s.y;
    });
    const n = Math.max(1, blocks.length);
    this.accent.position.set(ax / n, ay / n, -1.05);
    const pulse = 0.9 + 0.3 * Math.sin(time * 2.2);
    for (const o of this.optics) o.emissiveIntensity = pulse;
    this.accent.intensity = 6 + 3 * pulse;
  }

  dispose() {
    this.kit.dispose();
    this.geometry.forEach((g) => g.dispose());
    this.group.clear();
    this.group.removeFromParent();
  }
}
