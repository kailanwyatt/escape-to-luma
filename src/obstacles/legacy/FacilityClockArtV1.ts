import * as THREE from 'three';
import type { ClockHandsConfig } from '../../config/ObstacleConfig';
import { clockHandsStateAtTime } from '../ClockHandsState';
import { FacilityArtKit } from '../FacilityArtKit';

/** Archived retrieval-scanner arms (pre-cinematic pass). */
export class FacilityClockArtV1 {
  readonly group = new THREE.Group();
  private readonly kit = new FacilityArtKit();
  private readonly geometry: THREE.BufferGeometry[] = [];
  private readonly arms: Array<Array<{ mesh: THREE.Mesh; x: number; y: number }>> = [];

  constructor(private readonly config: ClockHandsConfig) {
    this.group.name = 'facility-clock-v1';
    const armor = this.kit.metal(0x526979, 0.36);
    const steel = this.kit.metal(0xabb9c0, 0.25);
    const dark = this.kit.metal(0x101c26, 0.6, false);
    const lamp = this.kit.lamp();
    lamp.color.setHex(0xffb449);
    lamp.emissive.setHex(0xffa12a);
    const state = clockHandsStateAtTime(config, 0);
    const r = config.thickness;
    const L = config.length;
    const sphere = new THREE.SphereGeometry(1, 20, 12);
    this.geometry.push(sphere);
    const ball = (name: string, x: number, y: number, z: number, radius: number, m: THREE.Material) => {
      const mesh = new THREE.Mesh(sphere, m);
      mesh.name = name;
      mesh.position.set(x, y, z);
      mesh.scale.set(radius, radius, radius * 0.8);
      this.group.add(mesh);
      return mesh;
    };
    state.hands.forEach((_, i) => {
      const parts: Array<{ mesh: THREE.Mesh; x: number; y: number }> = [];
      this.arms.push(parts);
      const record = (mesh: THREE.Mesh) => parts.push({ mesh, x: mesh.position.x, y: mesh.position.y });
      const box = (name: string, w: number, h: number, d: number, x: number, y: number, z: number, m: THREE.Material, b = 0.015) =>
        record(this.kit.box(this.group, `${name}-${i}`, w, h, d, x, y, z, m, b));
      box('arm-body', L, r * 2, r * 1.4, L / 2, 0, 0, armor, 0);
      for (const x of [0, L]) record(ball(`rounded-end-${i}`, x, 0, 0, r, armor));
      box('recessed-channel', L * 0.84, r * 0.95, 0.028, L / 2, 0, -r * 0.72, dark);
      box('light-channel', L * 0.75, r * 0.2, 0.016, L / 2, 0, -r * 0.9, lamp, 0.004);
      for (const side of [-1, 1]) box('steel-edge', L * 0.88, r * 0.15, 0.026, L / 2, side * r * 0.73, -r * 0.73, steel, 0.004);
      for (const fraction of [0.17, 0.5, 0.83]) box('arm-collar', r * 0.55, r * 1.85, r * 1.5, L * fraction, 0, 0, steel);
      record(ball(`end-optic-${i}`, L, 0, -r * 0.82, r * 0.36, lamp));
    });
    const hr = state.hubRadius;
    ball('scanner-housing', state.hubX, state.hubY, -r, hr, armor);
    ball('scanner-recess', state.hubX, state.hubY, -r - hr * 0.55, hr * 0.7, dark);
    ball('scanner-optic', state.hubX, state.hubY, -r - hr * 0.95, hr * 0.28, lamp);
    const ring = new THREE.TorusGeometry(hr * 0.76, hr * 0.06, 6, 32);
    this.geometry.push(ring);
    const bearing = new THREE.Mesh(ring, steel);
    bearing.name = 'hub-bearing';
    bearing.position.set(state.hubX, state.hubY, -r - hr * 0.6);
    this.group.add(bearing);
    this.update(0);
  }

  update(time: number) {
    const s = clockHandsStateAtTime(this.config, time);
    s.hands.forEach((h, i) => {
      const cos = Math.cos(h.angle);
      const sin = Math.sin(h.angle);
      for (const p of this.arms[i]) {
        p.mesh.position.x = s.hubX + p.x * cos - p.y * sin;
        p.mesh.position.y = s.hubY + p.x * sin + p.y * cos;
        p.mesh.rotation.z = h.angle;
      }
    });
  }

  dispose() {
    this.kit.dispose();
    this.geometry.forEach((g) => g.dispose());
    this.group.clear();
  }
}
