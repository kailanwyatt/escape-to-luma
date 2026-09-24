import * as THREE from 'three';
import type { ReactiveGateConfig } from '../config/ObstacleConfig';
import { GAME_TUNING } from '../game/gameTuning';
import { reactiveGateStateAtTime } from './ExtendedLibraryState';
import { FacilityArtKit } from './FacilityArtKit';

const FLOOR_Y = GAME_TUNING.projectile.floorY;

/**
 * Cinematic containment doors (curation pass).
 * Depth/finish only — gaps and phases sample reactiveGateStateAtTime.
 */
export class ContainmentGateArt {
  readonly group = new THREE.Group();
  private readonly kit = new FacilityArtKit({ cinematic: true });
  private readonly doors: THREE.Group[] = [];
  private readonly lamps: THREE.MeshStandardMaterial[] = [];
  private readonly lampCores: THREE.MeshStandardMaterial[] = [];
  private readonly accent: THREE.PointLight;

  constructor(private readonly config: ReactiveGateConfig) {
    this.group.name = 'containment-gate-art';
    const s = reactiveGateStateAtTime(config, 0);
    const w = s.panelWidth;
    const h = s.panelHeight;
    const armor = this.kit.metal(0x455868, 0.3);
    const inset = this.kit.metal(0x243643, 0.48);
    const steel = this.kit.metal(0xb0c0cb, 0.2);
    const black = this.kit.metal(0x0c141c, 0.62, false);
    const mark = this.kit.metal(0xc48a42, 0.45, false);

    for (let i = 0; i < 2; i++) {
      const door = new THREE.Group();
      door.name = `door-${i}`;
      this.doors.push(door);
      this.group.add(door);
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
        b = 0.035,
      ) => this.kit.box(door, name, bw, bh, d, x, y, z, m, b);

      // Full collision silhouette stays occupied even at bevelled outer corners.
      box(`capture-door-${i}`, w, h, 0.48, 0, 0, 0.14, black, 0);
      box('armor-shell', w, h, 0.5, 0, 0, 0.15, armor, 0.06);
      box('face-plate', w * 0.88, h * 0.9, 0.04, -side * w * 0.02, 0, -0.09, inset, 0.02);
      box('recessed-panel', w * 0.7, h * 0.68, 0.06, -side * w * 0.05, -h * 0.01, -0.12, black);
      box('upper-armor', w * 0.62, h * 0.34, 0.07, -side * w * 0.05, h * 0.14, -0.16, inset);
      box('lower-armor', w * 0.62, h * 0.22, 0.07, -side * w * 0.05, -h * 0.24, -0.16, inset);
      box('leading-seal', w * 0.06, h * 0.94, 0.07, side * w * 0.455, 0, -0.13, black);
      box('steel-leading-edge', w * 0.028, h * 0.9, 0.065, side * w * 0.418, 0, -0.19, steel);
      box('leading-bevel', w * 0.014, h * 0.86, 0.03, side * w * 0.4, 0, -0.22, steel, 0.004);

      const lamp = this.kit.lamp();
      const lampCore = this.kit.lampCore();
      this.lamps.push(lamp);
      this.lampCores.push(lampCore);
      box('lamp-recess', w * 0.74, h * 0.1, 0.065, 0, h * 0.39, -0.13, black);
      box(`status-lamp-${i}`, w * 0.6, h * 0.038, 0.024, 0, h * 0.39, -0.175, lamp, 0.006);
      box(`status-core-${i}`, w * 0.32, h * 0.016, 0.016, 0, h * 0.39, -0.19, lampCore, 0);

      for (const sy of [-1, 1]) {
        box('cross-brace', w * 0.76, h * 0.024, 0.055, 0, sy * h * 0.3, -0.2, steel, 0.008);
        box('latch-pocket', w * 0.2, h * 0.14, 0.065, side * w * 0.28, sy * h * 0.17, -0.22, black);
        box('latch-block', w * 0.14, h * 0.095, 0.075, side * w * 0.28, sy * h * 0.17, -0.27, steel);
        box('hinge-rail', w * 0.04, h * 0.22, 0.05, -side * w * 0.44, sy * h * 0.28, -0.08, steel, 0.006);
      }
      for (let j = 0; j < 5; j++) {
        box('vent', w * 0.2, h * 0.01, 0.014, -side * w * 0.16, -h * 0.22 + j * h * 0.022, -0.2, black, 0);
      }
      for (const x of [-0.38, 0.38]) {
        for (const y of [-0.42, 0.42]) {
          box('fastener-seat', w * 0.055, h * 0.028, 0.02, x * w, y * h, -0.11, black);
          box('fastener', w * 0.026, h * 0.014, 0.028, x * w, y * h, -0.128, steel, 0.005);
        }
      }
      for (let j = 0; j < 3; j++) {
        box('caution-marker', w * 0.055, h * 0.025, 0.014, (-0.1 + j * 0.08) * w, -h * 0.43, -0.11, mark, 0.004);
      }
      // Viewing slit — still inside silhouette; sells thickness without opening a collision hole.
      box('view-slot', w * 0.12, h * 0.045, 0.02, -side * w * 0.12, h * 0.02, -0.205, black, 0);
      box('view-glass', w * 0.09, h * 0.028, 0.012, -side * w * 0.12, h * 0.02, -0.218, steel, 0);
    }

    this.buildFloorFrame(s.y, w, h, config.openWidth);
    this.accent = new THREE.PointLight(0xff7562, 8, 10, 2);
    this.accent.name = 'gate-accent';
    this.accent.position.set(0, s.y, -1.2);
    this.group.add(this.accent);
    this.update(0);
  }

  private buildFloorFrame(centerY: number, panelWidth: number, panelHeight: number, openWidth: number) {
    const armor = this.kit.metal(0x455868, 0.3);
    const steel = this.kit.metal(0xb0c0cb, 0.2);
    const black = this.kit.metal(0x0c141c, 0.62, false);
    const frame = new THREE.Group();
    frame.name = 'ground-frame';
    this.group.add(frame);
    const doorBottom = centerY - panelHeight / 2;
    const doorTop = centerY + panelHeight / 2;
    const span = openWidth + panelWidth * 2 + 0.4;
    const sillTop = Math.max(FLOOR_Y + 0.1, Math.min(doorBottom - 0.05, FLOOR_Y + 0.45));
    const sillH = Math.max(0.12, sillTop - FLOOR_Y);
    this.kit.box(frame, 'floor-sill', span, sillH, 0.55, 0, FLOOR_Y + sillH / 2, 0.16, black, 0);
    this.kit.box(frame, 'sill-lip', span * 0.92, 0.05, 0.09, 0, sillTop - 0.02, -0.18, steel, 0.006);
    this.kit.box(frame, 'floor-track', span * 0.86, 0.045, 0.36, 0, FLOOR_Y + 0.04, -0.05, armor, 0.004);
    this.kit.box(frame, 'track-groove', span * 0.8, 0.02, 0.08, 0, FLOOR_Y + 0.06, -0.2, black, 0);
    for (const side of [-1, 1]) {
      const x = side * (openWidth / 2 + panelWidth * 0.55 + 0.1);
      const jambH = Math.max(0.5, doorTop + 0.32 - FLOOR_Y);
      this.kit.box(frame, `jamb-${side < 0 ? 'left' : 'right'}`, 0.36, jambH, 0.52, x, FLOOR_Y + jambH / 2, 0.06, armor, 0.045);
      this.kit.box(frame, `jamb-trim-${side < 0 ? 'left' : 'right'}`, 0.1, jambH * 0.94, 0.12, x, FLOOR_Y + jambH / 2, -0.28, steel, 0.006);
      this.kit.box(frame, `jamb-foot-${side < 0 ? 'left' : 'right'}`, 0.44, 0.18, 0.48, x, FLOOR_Y + 0.11, -0.06, black, 0);
      this.kit.box(frame, `jamb-cap-${side < 0 ? 'left' : 'right'}`, 0.4, 0.1, 0.4, x, doorTop + 0.2, 0.02, steel, 0.01);
    }
    const headerY = doorTop + 0.2;
    this.kit.box(frame, 'header', span, 0.32, 0.5, 0, headerY, 0.07, armor, 0.045);
    this.kit.box(frame, 'header-lip', span * 0.94, 0.055, 0.09, 0, headerY - 0.14, -0.22, steel, 0.005);
    this.kit.box(frame, 'header-light-bar', span * 0.55, 0.04, 0.05, 0, headerY - 0.02, -0.28, this.kit.lamp(), 0.004);
    const underGap = Math.max(0, doorBottom - sillTop);
    if (underGap > 0.1) {
      for (const x of [-openWidth * 0.35, 0, openWidth * 0.35]) {
        this.kit.box(frame, `under-post-${x}`, 0.14, underGap, 0.26, x, sillTop + underGap / 2, 0.12, black, 0);
      }
    }
  }

  update(time: number) {
    const s = reactiveGateStateAtTime(this.config, time);
    this.doors[0].position.set(s.leftX, s.y, 0);
    this.doors[1].position.set(s.rightX, s.y, 0);
    const color = s.warning ? 0xffb449 : s.phase === 'open' ? 0x70e5ed : 0xff7562;
    const intensity = s.warning ? 1.05 : s.phase === 'open' ? 0.75 : 0.95;
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
    this.accent.intensity = s.warning ? 14 : s.phase === 'open' ? 7 : 10;
    this.accent.position.set(0, s.y + s.panelHeight * 0.35, -1.15);
    this.group.userData.phase = s.phase;
  }

  dispose() {
    this.kit.dispose();
    this.group.clear();
    this.group.removeFromParent();
  }
}
