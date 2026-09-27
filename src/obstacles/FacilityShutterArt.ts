import * as THREE from 'three';
import type { SplitShutterConfig } from '../config/ObstacleConfig';
import { GAME_TUNING } from '../game/gameTuning';
import { splitShutterStateAtTime } from './ExtendedLibraryState';
import { FacilityArtKit } from './FacilityArtKit';

const FLOOR_Y = GAME_TUNING.projectile.floorY;

/**
 * Cinematic split-shutter leaves (curation pass).
 * Horizontal armor slats distinguish these from capture doors.
 * Depth/finish only — gaps sample splitShutterStateAtTime.
 */
export class FacilityShutterArt {
  readonly group = new THREE.Group();
  private readonly kit = new FacilityArtKit({ cinematic: true });
  private readonly leaves: THREE.Group[] = [];
  private readonly lamps: THREE.MeshStandardMaterial[] = [];
  private readonly lampCores: THREE.MeshStandardMaterial[] = [];
  private readonly accent: THREE.PointLight;

  constructor(private readonly config: SplitShutterConfig) {
    this.group.name = 'facility-shutter-art';
    const w = config.panelWidth;
    const h = config.panelHeight;
    const armor = this.kit.metal(0x455868, 0.3);
    const inset = this.kit.metal(0x243643, 0.48);
    const steel = this.kit.metal(0xb0c0cb, 0.2);
    const black = this.kit.metal(0x0c141c, 0.62, false);
    const mark = this.kit.metal(0xc48a42, 0.45, false);

    for (let i = 0; i < 2; i++) {
      const leaf = new THREE.Group();
      leaf.name = `leaf-${i}`;
      this.leaves.push(leaf);
      this.group.add(leaf);
      const side = i === 0 ? 1 : -1;
      const box = (
        name: string,
        bw: number,
        bh: number,
        d: number,
        x: number,
        y: number,
        z: number,
        m: THREE.Material,
        b = 0.03,
      ) => this.kit.box(leaf, name, bw, bh, d, x, y, z, m, b);

      // Authoritative silhouette — details stay inside this panel.
      box(`shutter-body-${i}`, w, h, 0.46, 0, 0, 0.14, black, 0);
      box('outer-armor', w, h, 0.5, 0, 0, 0.15, armor, 0.055);
      box('face-recess', w * 0.82, h * 0.86, 0.05, 0, 0, -0.1, black, 0.02);

      // Layered horizontal plates — shutter signature vs containment doors.
      for (let j = 0; j < 5; j++) {
        const y = (j - 2) * h * 0.155;
        box('armor-slat', w * 0.74, h * 0.132, 0.07, 0, y, -0.14, inset, 0.018);
        box('slat-lip', w * 0.74, h * 0.014, 0.038, 0, y - h * 0.055, -0.185, steel, 0.004);
        box('slat-groove', w * 0.7, h * 0.008, 0.02, 0, y + h * 0.05, -0.175, black, 0);
      }

      box('leading-seal', w * 0.07, h * 0.96, 0.07, side * w * 0.455, 0, -0.13, black, 0);
      box('leading-steel', w * 0.032, h * 0.92, 0.055, side * w * 0.41, 0, -0.18, steel, 0.006);
      box('leading-bevel', w * 0.014, h * 0.88, 0.028, side * w * 0.392, 0, -0.21, steel, 0.003);

      const lamp = this.kit.lamp();
      const lampCore = this.kit.lampCore();
      this.lamps.push(lamp);
      this.lampCores.push(lampCore);
      for (const y of [-0.32, 0, 0.32]) {
        box('edge-lamp-seat', w * 0.028, h * 0.16, 0.028, side * w * 0.438, y * h, -0.15, black, 0);
        box('edge-lamp', w * 0.016, h * 0.12, 0.018, side * w * 0.438, y * h, -0.175, lamp, 0.003);
        box('edge-lamp-core', w * 0.008, h * 0.07, 0.012, side * w * 0.438, y * h, -0.188, lampCore, 0);
      }

      for (const y of [-0.445, 0.445]) {
        box('runner-housing', w * 0.8, h * 0.058, 0.13, 0, y * h, -0.1, armor, 0.02);
        box('runner-rail', w * 0.72, h * 0.014, 0.04, 0, y * h, -0.175, steel, 0.004);
        for (const x of [-0.32, 0, 0.32]) {
          box('runner-fastener', w * 0.03, h * 0.016, 0.028, x * w, y * h, -0.19, steel, 0.004);
        }
      }

      for (let j = 0; j < 3; j++) {
        box('caution-marker', w * 0.05, h * 0.022, 0.012, (-0.12 + j * 0.09) * w, -h * 0.42, -0.12, mark, 0.003);
      }
      box('view-slot', w * 0.14, h * 0.04, 0.018, -side * w * 0.1, h * 0.08, -0.2, black, 0);
      box('view-glass', w * 0.1, h * 0.024, 0.01, -side * w * 0.1, h * 0.08, -0.212, steel, 0);
    }

    this.buildFloorFrame();
    this.accent = new THREE.PointLight(0xffb449, 9, 10, 2);
    this.accent.name = 'shutter-accent';
    this.accent.position.set(config.centerX, 3, -1.15);
    this.group.add(this.accent);
    this.update(0);
  }

  private buildFloorFrame() {
    const { config } = this;
    const w = config.panelWidth;
    const h = config.panelHeight;
    const armor = this.kit.metal(0x455868, 0.3);
    const steel = this.kit.metal(0xb0c0cb, 0.2);
    const black = this.kit.metal(0x0c141c, 0.62, false);
    const frame = new THREE.Group();
    frame.name = 'ground-frame';
    this.group.add(frame);
    const s0 = splitShutterStateAtTime(config, 0);
    const doorBottom = s0.y - h / 2;
    const doorTop = s0.y + h / 2;
    const span = config.maxGap + w * 2 + 0.4;
    const sillTop = Math.max(FLOOR_Y + 0.1, Math.min(doorBottom - 0.05, FLOOR_Y + 0.45));
    const sillH = Math.max(0.12, sillTop - FLOOR_Y);
    this.kit.box(frame, 'floor-sill', span, sillH, 0.55, config.centerX, FLOOR_Y + sillH / 2, 0.16, black, 0);
    this.kit.box(frame, 'sill-lip', span * 0.92, 0.05, 0.09, config.centerX, sillTop - 0.02, -0.18, steel, 0.006);
    this.kit.box(frame, 'floor-track', span * 0.88, 0.045, 0.36, config.centerX, FLOOR_Y + 0.04, -0.05, armor, 0.004);
    this.kit.box(frame, 'track-groove', span * 0.8, 0.02, 0.08, config.centerX, FLOOR_Y + 0.06, -0.2, black, 0);
    for (const side of [-1, 1]) {
      const x = config.centerX + side * (config.maxGap / 2 + w * 0.55 + 0.1);
      const jambH = Math.max(0.5, doorTop + 0.28 - FLOOR_Y);
      this.kit.box(frame, `jamb-${side < 0 ? 'left' : 'right'}`, 0.34, jambH, 0.5, x, FLOOR_Y + jambH / 2, 0.05, armor, 0.04);
      this.kit.box(
        frame,
        `jamb-trim-${side < 0 ? 'left' : 'right'}`,
        0.09,
        jambH * 0.94,
        0.11,
        x,
        FLOOR_Y + jambH / 2,
        -0.26,
        steel,
        0.005,
      );
      this.kit.box(frame, `jamb-foot-${side < 0 ? 'left' : 'right'}`, 0.42, 0.16, 0.46, x, FLOOR_Y + 0.1, -0.05, black, 0);
      this.kit.box(frame, `jamb-cap-${side < 0 ? 'left' : 'right'}`, 0.38, 0.09, 0.38, x, doorTop + 0.18, 0.02, steel, 0.01);
    }
    const headerY = doorTop + 0.18;
    this.kit.box(frame, 'header', span, 0.28, 0.48, config.centerX, headerY, 0.06, armor, 0.04);
    this.kit.box(frame, 'header-lip', span * 0.94, 0.05, 0.08, config.centerX, headerY - 0.12, -0.22, steel, 0.005);
    this.kit.box(frame, 'header-light-bar', span * 0.5, 0.036, 0.045, config.centerX, headerY - 0.02, -0.27, this.kit.lamp(), 0.004);
  }

  update(time: number) {
    const s = splitShutterStateAtTime(this.config, time);
    this.leaves[0].position.set(s.leftX, s.y, 0);
    this.leaves[1].position.set(s.rightX, s.y, 0);

    const color =
      s.phase === 'warning' || s.phase === 'slamming'
        ? 0xffb449
        : s.phase === 'open' || s.phase === 'opening'
          ? 0x70e5ed
          : 0xff7562;
    const intensity =
      s.phase === 'warning' ? 1.2 : s.phase === 'slamming' ? 1.35 : s.phase === 'open' ? 0.78 : 1.0;
    for (const lamp of this.lamps) {
      lamp.color.setHex(color);
      lamp.emissive.setHex(color);
      lamp.emissiveIntensity = intensity;
    }
    for (const core of this.lampCores) {
      core.color.setHex(color);
      core.emissive.setHex(color);
      core.emissiveIntensity = intensity * 1.45;
    }
    this.accent.color.setHex(color);
    this.accent.intensity =
      s.phase === 'warning' ? 14 : s.phase === 'slamming' ? 16 : s.phase === 'open' ? 7 : 10;
    this.accent.position.set(this.config.centerX, s.y + s.height * 0.2, -1.15);
    this.group.userData.gap = s.gap;
    this.group.userData.phase = s.phase;
  }

  dispose() {
    this.kit.dispose();
    this.group.clear();
    this.group.removeFromParent();
  }
}
