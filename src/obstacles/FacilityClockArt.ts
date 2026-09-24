import * as THREE from 'three';
import type { ClockHandsConfig } from '../config/ObstacleConfig';
import { clockHandsStateAtTime } from './ClockHandsState';
import { FacilityArtKit } from './FacilityArtKit';

/**
 * Cinematic retrieval scanner (clockHands).
 * Sweeping arms + hub optic — not a timepiece. Poses sample ClockHandsState.
 */
export class FacilityClockArt {
  readonly group = new THREE.Group();
  private readonly kit = new FacilityArtKit({ cinematic: true });
  private readonly geometry: THREE.BufferGeometry[] = [];
  private readonly arms: Array<Array<{ mesh: THREE.Mesh; x: number; y: number }>> = [];
  private readonly lamps: THREE.MeshStandardMaterial[] = [];
  private readonly accent: THREE.PointLight;

  constructor(private readonly config: ClockHandsConfig) {
    this.group.name = 'facility-clock-art';
    const armor = this.kit.metal(0x455868, 0.3);
    const steel = this.kit.metal(0xb0c0cb, 0.2);
    const dark = this.kit.metal(0x0c141c, 0.62, false);
    const lamp = this.kit.lamp();
    lamp.color.setHex(0xffb449);
    lamp.emissive.setHex(0xffa12a);
    this.lamps.push(lamp);
    const lampCore = this.kit.lampCore();
    this.lamps.push(lampCore);

    const state = clockHandsStateAtTime(config, 0);
    const r = config.thickness;
    const L = config.length;
    const sphere = new THREE.SphereGeometry(1, 22, 14);
    this.geometry.push(sphere);
    const ball = (name: string, x: number, y: number, z: number, radius: number, m: THREE.Material) => {
      const mesh = new THREE.Mesh(sphere, m);
      mesh.name = name;
      mesh.position.set(x, y, z);
      mesh.scale.set(radius, radius, radius * 0.78);
      this.group.add(mesh);
      return mesh;
    };

    state.hands.forEach((_, i) => {
      const parts: Array<{ mesh: THREE.Mesh; x: number; y: number }> = [];
      this.arms.push(parts);
      const record = (mesh: THREE.Mesh) => parts.push({ mesh, x: mesh.position.x, y: mesh.position.y });
      const box = (
        name: string,
        w: number,
        h: number,
        d: number,
        x: number,
        y: number,
        z: number,
        m: THREE.Material,
        b = 0.012,
      ) => record(this.kit.box(this.group, `${name}-${i}`, w, h, d, x, y, z, m, b));

      box('arm-body', L, r * 2, r * 1.55, L / 2, 0, 0, armor, 0);
      for (const x of [0, L]) record(ball(`rounded-end-${i}`, x, 0, 0, r, armor));
      box('recessed-channel', L * 0.82, r * 0.9, 0.032, L / 2, 0, -r * 0.7, dark);
      box('light-channel', L * 0.72, r * 0.18, 0.018, L / 2, 0, -r * 0.88, lamp, 0.003);
      box('light-core', L * 0.4, r * 0.08, 0.012, L / 2, 0, -r * 0.95, lampCore, 0);
      for (const side of [-1, 1]) {
        box('steel-edge', L * 0.86, r * 0.14, 0.028, L / 2, side * r * 0.7, -r * 0.72, steel, 0.003);
      }
      for (const fraction of [0.18, 0.5, 0.82]) {
        box('arm-collar', r * 0.5, r * 1.75, r * 1.55, L * fraction, 0, 0, steel, 0.008);
      }
      record(ball(`end-optic-${i}`, L, 0, -r * 0.78, r * 0.34, lamp));
      record(ball(`end-optic-core-${i}`, L, 0, -r * 0.95, r * 0.16, lampCore));
    });

    const hr = state.hubRadius;
    ball('scanner-housing', state.hubX, state.hubY, -r, hr, armor);
    ball('scanner-recess', state.hubX, state.hubY, -r - hr * 0.52, hr * 0.68, dark);
    ball('scanner-optic', state.hubX, state.hubY, -r - hr * 0.9, hr * 0.3, lamp);
    ball('scanner-core', state.hubX, state.hubY, -r - hr * 1.05, hr * 0.14, lampCore);
    const ring = new THREE.TorusGeometry(hr * 0.78, hr * 0.07, 8, 36);
    this.geometry.push(ring);
    const bearing = new THREE.Mesh(ring, steel);
    bearing.name = 'hub-bearing';
    bearing.position.set(state.hubX, state.hubY, -r - hr * 0.58);
    this.group.add(bearing);

    this.accent = new THREE.PointLight(0xffb449, 9, 10, 2);
    this.accent.name = 'scanner-accent';
    this.accent.position.set(state.hubX, state.hubY, -1.1);
    this.group.add(this.accent);
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

    const phase = s.phase;
    const color =
      phase === 'warning' || phase === 'slamming'
        ? 0xffb449
        : phase === 'closed'
          ? 0xff7562
          : phase === 'open' || phase === 'opening'
            ? 0x70e5ed
            : 0xffb449;
    const pulse =
      phase === 'warning'
        ? 1.15 + 0.2 * Math.sin(time * 14)
        : phase === 'slamming'
          ? 1.4
          : phase === 'closed'
            ? 1.05
            : 0.85 + 0.2 * Math.sin(time * 2.4);
    for (const lamp of this.lamps) {
      if (phase) {
        lamp.color.setHex(color);
        lamp.emissive.setHex(color);
      }
      lamp.emissiveIntensity = pulse;
    }
    this.accent.color.setHex(phase ? color : 0xffb449);
    this.accent.intensity = phase === 'slamming' ? 16 : phase === 'warning' ? 13 : 8 + 3 * pulse;
    this.accent.position.set(s.hubX, s.hubY, -1.1);
    this.group.userData.phase = phase;
  }

  dispose() {
    this.kit.dispose();
    this.geometry.forEach((g) => g.dispose());
    this.group.clear();
    this.group.removeFromParent();
  }
}
