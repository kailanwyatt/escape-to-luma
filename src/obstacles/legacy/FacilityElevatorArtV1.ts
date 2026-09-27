import * as THREE from 'three';
import type { ElevatorBlocksConfig } from '../../config/ObstacleConfig';
import { GAME_TUNING } from '../../game/gameTuning';
import { elevatorBlocksStateAtTime } from '../ElevatorBlocksState';
import { FacilityArtKit } from '../FacilityArtKit';

const FLOOR_Y = GAME_TUNING.projectile.floorY;

/** Archived elevator carriages (pre-cinematic pass). */
export class FacilityElevatorArtV1 {
  readonly group = new THREE.Group();
  private readonly kit = new FacilityArtKit();
  private readonly carriages: Array<Array<{ mesh: THREE.Mesh; x: number; y: number }>> = [];

  constructor(private readonly config: ElevatorBlocksConfig) {
    this.group.name = 'facility-elevator-v1';
    const armor = this.kit.metal(0x526674);
    const steel = this.kit.metal(0xa1b3bd, 0.28);
    const dark = this.kit.metal(0x111e29, 0.6, false);
    const glass = this.kit.metal(0x254d59, 0.22, false);
    const lamp = this.kit.lamp();
    lamp.color.setHex(0xffb449);
    lamp.emissive.setHex(0xffa32c);
    const poses = elevatorBlocksStateAtTime(config, 0);
    const mid = (poses.length - 1) / 2;
    poses.forEach((s, i) => {
      const x = (i - mid) * config.spacing;
      const top = config.baseY + config.amplitude + s.height / 2 + 0.35;
      const railH = Math.max(0.8, top - FLOOR_Y);
      this.kit.box(this.group, `shaft-rail-l-${i}`, 0.08, railH, 0.18, x - s.width * 0.52, FLOOR_Y + railH / 2, 0.22, steel, 0.004);
      this.kit.box(this.group, `shaft-rail-r-${i}`, 0.08, railH, 0.18, x + s.width * 0.52, FLOOR_Y + railH / 2, 0.22, steel, 0.004);
      this.kit.box(this.group, `shaft-foot-${i}`, s.width * 1.15, 0.14, 0.36, x, FLOOR_Y + 0.07, 0.12, dark, 0);
      this.kit.box(this.group, `shaft-sill-${i}`, s.width * 1.05, 0.05, 0.28, x, FLOOR_Y + 0.14, -0.02, armor, 0.004);
      this.kit.box(this.group, `shaft-header-${i}`, s.width * 1.1, 0.16, 0.32, x, top - 0.08, 0.1, armor, 0.03);
    });
    poses.forEach((s, i) => {
      const parts: Array<{ mesh: THREE.Mesh; x: number; y: number }> = [];
      this.carriages.push(parts);
      const add = (
        name: string,
        w: number,
        h: number,
        d: number,
        x: number,
        y: number,
        z: number,
        m: THREE.Material,
        b = 0.02,
      ) => {
        const mesh = this.kit.box(this.group, `${name}-${i}`, w, h, d, x, y, z, m, b);
        parts.push({ mesh, x, y });
      };
      add('carriage-body', s.width, s.height, 0.36, 0, 0, 0.1, dark, 0);
      add('carriage-armor', s.width, s.height, 0.38, 0, 0, 0.11, armor);
      add('window-recess', s.width * 0.76, s.height * 0.64, 0.045, 0, 0, -0.105, dark);
      add('reinforced-window', s.width * 0.65, s.height * 0.49, 0.025, 0, 0, -0.133, glass);
      for (const side of [-1, 1]) {
        add('guide-shoe', s.width * 0.11, s.height * 0.7, 0.43, side * s.width * 0.425, 0, 0.1, steel);
        add('cross-member', s.width * 0.72, s.height * 0.045, 0.04, 0, side * s.height * 0.3, -0.14, steel);
      }
      for (const x of [-0.21, 0, 0.21]) add('window-rib', s.width * 0.025, s.height * 0.49, 0.035, x * s.width, 0, -0.16, steel, 0.004);
      add('lamp-pocket', s.width * 0.52, s.height * 0.12, 0.035, 0, s.height * 0.405, -0.11, dark);
      add('travel-lamp', s.width * 0.39, s.height * 0.052, 0.021, 0, s.height * 0.405, -0.135, lamp, 0.004);
      for (const x of [-0.34, 0.34]) add('service-fastener', s.width * 0.03, s.height * 0.04, 0.02, x * s.width, -s.height * 0.4, -0.1, steel, 0.004);
    });
    this.update(0);
  }

  update(time: number) {
    elevatorBlocksStateAtTime(this.config, time).forEach((s, i) => {
      for (const p of this.carriages[i]) {
        p.mesh.position.x = s.x + p.x;
        p.mesh.position.y = s.y + p.y;
      }
    });
  }

  dispose() {
    this.kit.dispose();
    this.group.clear();
  }
}
