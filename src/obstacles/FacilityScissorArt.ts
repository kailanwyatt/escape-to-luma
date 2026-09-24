import * as THREE from 'three';
import type { ScissorGateConfig } from '../config/ObstacleConfig';
import { scissorGateStateAtTime } from './ScissorGateState';
import { FacilityArtKit } from './FacilityArtKit';

/**
 * Cinematic capture pincers (scissorGate).
 * Bar capsules stay authoritative — art dresses the same segments.
 */
export class FacilityScissorArt {
  readonly group = new THREE.Group();
  private readonly kit = new FacilityArtKit({ cinematic: true });
  private readonly bars: THREE.Group[] = [];
  private readonly lamps: THREE.MeshStandardMaterial[] = [];
  private readonly accent: THREE.PointLight;
  private readonly barLength: number;
  private readonly thickness: number;

  constructor(private readonly config: ScissorGateConfig) {
    this.group.name = 'facility-scissor-art';
    this.barLength = config.barLength;
    this.thickness = config.barThickness;
    const L = this.barLength;
    const r = this.thickness;
    const armor = this.kit.metal(0x455868, 0.3);
    const steel = this.kit.metal(0xb0c0cb, 0.2);
    const dark = this.kit.metal(0x0c141c, 0.62, false);
    const lamp = this.kit.lamp();
    lamp.color.setHex(0xffb449);
    lamp.emissive.setHex(0xffa12a);
    this.lamps.push(lamp);
    const lampCore = this.kit.lampCore();
    this.lamps.push(lampCore);

    for (let i = 0; i < 2; i++) {
      const bar = new THREE.Group();
      bar.name = `pincer-bar-${i}`;
      this.bars.push(bar);
      this.group.add(bar);
      const box = (
        name: string,
        w: number,
        h: number,
        d: number,
        x: number,
        y: number,
        z: number,
        m: THREE.Material,
        b = 0.01,
      ) => this.kit.box(bar, name, w, h, d, x, y, z, m, b);

      // Authoritative silhouette: length 2L, height 2r — details stay inside.
      box(`pincer-body-${i}`, L * 2, r * 2, r * 1.6, 0, 0, 0.04, dark, 0);
      box('pincer-armor', L * 2, r * 2, r * 1.75, 0, 0, 0.05, armor, 0.012);
      box('recess-channel', L * 1.7, r * 0.9, 0.03, 0, 0, -r * 0.55, dark);
      box('light-rail', L * 1.45, r * 0.22, 0.018, 0, 0, -r * 0.72, lamp, 0.003);
      box('light-core', L * 0.7, r * 0.1, 0.012, 0, 0, -r * 0.82, lampCore, 0);
      for (const side of [-1, 1]) {
        box('edge-steel', L * 1.75, r * 0.16, 0.028, 0, side * r * 0.7, -r * 0.6, steel, 0.003);
        box('tip-cap', r * 1.1, r * 1.85, r * 1.4, side * L * 0.92, 0, 0.02, steel, 0.008);
        box('tip-pad', r * 0.55, r * 1.2, r * 0.5, side * L * 0.98, 0, -r * 0.35, dark, 0);
      }
      for (const x of [-0.45, 0, 0.45]) {
        box('collar', r * 0.7, r * 1.9, r * 1.5, x * L, 0, 0.02, steel, 0.006);
      }
    }

    // Shared hinge eye — must stay inside the bar intersection region.
    const hr = r * 0.7;
    this.kit.box(this.group, 'hinge-housing', hr * 2.1, hr * 2.1, hr * 1.6, 0, 0, -0.06, armor, 0.012);
    this.kit.box(this.group, 'hinge-recess', hr * 1.5, hr * 1.5, hr * 0.45, 0, 0, -0.13, dark, 0);
    this.kit.box(this.group, 'hinge-eye', hr * 1.05, hr * 1.05, hr * 0.5, 0, 0, -0.17, lamp, 0.003);
    this.kit.box(this.group, 'hinge-core', hr * 0.45, hr * 0.45, hr * 0.3, 0, 0, -0.2, lampCore, 0);

    this.accent = new THREE.PointLight(0xffb449, 8, 9, 2);
    this.accent.name = 'pincer-accent';
    this.accent.position.set(config.centerX, config.centerY, -1.05);
    this.group.add(this.accent);
    this.update(0);
  }

  update(time: number) {
    const s = scissorGateStateAtTime(this.config, time);
    s.bars.forEach((bar, i) => {
      const midX = (bar.ax + bar.bx) / 2;
      const midY = (bar.ay + bar.by) / 2;
      this.bars[i].position.set(midX, midY, 0);
      this.bars[i].rotation.z = Math.atan2(bar.by - bar.ay, bar.bx - bar.ax);
    });
    this.group.position.set(0, 0, 0);
    // Hinge pieces stay at authored center.
    for (const name of ['hinge-housing', 'hinge-recess', 'hinge-eye', 'hinge-core']) {
      const o = this.group.getObjectByName(name);
      if (o) o.position.x = s.centerX;
      if (o) o.position.y = s.centerY;
    }
    const openFrac =
      (s.angle - (this.config.minAngle ?? 0.35)) /
      Math.max(1e-6, this.config.maxAngle - (this.config.minAngle ?? 0.35));
    const color = openFrac > 0.65 ? 0x70e5ed : openFrac < 0.35 ? 0xff7562 : 0xffb449;
    const intensity = openFrac > 0.65 ? 0.8 : openFrac < 0.35 ? 1.1 : 1.0;
    for (const lamp of this.lamps) {
      lamp.color.setHex(color);
      lamp.emissive.setHex(color);
      lamp.emissiveIntensity = intensity;
    }
    this.accent.color.setHex(color);
    this.accent.intensity = 7 + openFrac * 4;
    this.accent.position.set(s.centerX, s.centerY, -1.05);
    this.group.userData.aperture = s.apertureWidth;
  }

  dispose() {
    this.kit.dispose();
    this.group.clear();
    this.group.removeFromParent();
  }
}
