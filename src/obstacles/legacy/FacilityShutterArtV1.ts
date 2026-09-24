import * as THREE from 'three';
import type { SplitShutterConfig } from '../../config/ObstacleConfig';
import { GAME_TUNING } from '../../game/gameTuning';
import { splitShutterStateAtTime } from '../ExtendedLibraryState';
import { FacilityArtKit } from '../FacilityArtKit';

const FLOOR_Y = GAME_TUNING.projectile.floorY;

/** Archived split-shutter leaves (pre-cinematic pass). */
export class FacilityShutterArtV1 {
  readonly group = new THREE.Group();
  private readonly kit = new FacilityArtKit();
  private readonly leaves: Array<Array<{ mesh: THREE.Mesh; x: number; y: number }>> = [];

  constructor(private readonly config: SplitShutterConfig) {
    this.group.name = 'facility-shutter-v1';
    const w = config.panelWidth;
    const h = config.panelHeight;
    const armor = this.kit.metal(0x526778, 0.43);
    const steel = this.kit.metal(0x9daeb8, 0.3);
    const dark = this.kit.metal(0x121e27, 0.65, false);
    const inset = this.kit.metal(0x304554, 0.5);
    const amber = this.kit.lamp();
    amber.color.setHex(0xffb449);
    amber.emissive.setHex(0xff9b32);
    const s0 = splitShutterStateAtTime(config, 0);
    const span = config.maxGap + w * 2 + 0.3;
    const doorBottom = s0.y - h / 2;
    const sillTop = Math.max(FLOOR_Y + 0.1, Math.min(doorBottom - 0.05, FLOOR_Y + 0.45));
    const sillH = Math.max(0.12, sillTop - FLOOR_Y);
    this.kit.box(this.group, 'floor-sill', span, sillH, 0.48, config.centerX, FLOOR_Y + sillH / 2, 0.14, dark, 0);
    this.kit.box(this.group, 'floor-track', span * 0.88, 0.04, 0.3, config.centerX, FLOOR_Y + 0.035, -0.04, armor, 0.004);
    for (const side of [-1, 1]) {
      const x = config.centerX + side * (config.maxGap / 2 + w * 0.55 + 0.06);
      const jambH = Math.max(0.5, s0.y + h / 2 + 0.25 - FLOOR_Y);
      this.kit.box(this.group, `jamb-${side < 0 ? 'left' : 'right'}`, 0.28, jambH, 0.46, x, FLOOR_Y + jambH / 2, 0.04, armor, 0.035);
      this.kit.box(this.group, `jamb-foot-${side < 0 ? 'left' : 'right'}`, 0.36, 0.14, 0.4, x, FLOOR_Y + 0.09, -0.05, dark, 0);
    }
    for (let i = 0; i < 2; i++) {
      const parts: Array<{ mesh: THREE.Mesh; x: number; y: number }> = [];
      this.leaves.push(parts);
      const side = i === 0 ? 1 : -1;
      const add = (
        name: string,
        bw: number,
        bh: number,
        d: number,
        x: number,
        y: number,
        z: number,
        m: THREE.Material,
        b = 0.025,
      ) => {
        const mesh = this.kit.box(this.group, `${name}-${i}`, bw, bh, d, x, y, z, m, b);
        parts.push({ mesh, x, y });
      };
      add('shutter-body', w, h, 0.4, 0, 0, 0.12, dark, 0);
      add('outer-armor', w, h, 0.42, 0, 0, 0.13, armor, 0.045);
      add('recess', w * 0.79, h * 0.83, 0.045, 0, 0, -0.1, dark);
      for (let j = 0; j < 5; j++) {
        const y = (j - 2) * h * 0.155;
        add('armor-slat', w * 0.72, h * 0.135, 0.065, 0, y, -0.137, inset);
        add('slat-lip', w * 0.72, h * 0.015, 0.035, 0, y - h * 0.055, -0.18, steel, 0.005);
      }
      add('leading-seal', w * 0.065, h * 0.96, 0.065, side * w * 0.46, 0, -0.12, dark);
      add('leading-steel', w * 0.034, h * 0.91, 0.05, side * w * 0.405, 0, -0.16, steel, 0.007);
      for (const y of [-0.28, 0, 0.28]) add('inset-edge-lamp', w * 0.018, h * 0.14, 0.018, side * w * 0.444, y * h, -0.16, amber, 0.003);
      for (const y of [-0.445, 0.445]) {
        add('runner-housing', w * 0.78, h * 0.055, 0.12, 0, y * h, -0.11, armor);
        for (const x of [-0.3, 0.3]) add('runner-fastener', w * 0.028, h * 0.016, 0.025, x * w, y * h, -0.18, steel, 0.004);
      }
    }
    this.update(0);
  }

  update(time: number) {
    const s = splitShutterStateAtTime(this.config, time);
    [s.leftX, s.rightX].forEach((x, i) => {
      for (const p of this.leaves[i]) {
        p.mesh.position.x = x + p.x;
        p.mesh.position.y = s.y + p.y;
      }
    });
  }

  dispose() {
    this.kit.dispose();
    this.group.clear();
  }
}
