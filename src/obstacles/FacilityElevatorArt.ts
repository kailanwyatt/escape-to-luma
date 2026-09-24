import * as THREE from 'three';
import type { ElevatorBlocksConfig } from '../config/ObstacleConfig';
import { GAME_TUNING } from '../game/gameTuning';
import { elevatorBlocksStateAtTime } from './ElevatorBlocksState';
import { FacilityArtKit } from './FacilityArtKit';

const FLOOR_Y = GAME_TUNING.projectile.floorY;

/**
 * Cinematic elevator carriages (curation pass).
 * Depth/finish only — poses sample elevatorBlocksStateAtTime.
 */
export class FacilityElevatorArt {
  readonly group = new THREE.Group();
  private readonly kit = new FacilityArtKit({ cinematic: true });
  private readonly carriages: THREE.Group[] = [];
  private readonly lamps: THREE.MeshStandardMaterial[] = [];
  private readonly lampCores: THREE.MeshStandardMaterial[] = [];
  private readonly accent: THREE.PointLight;

  constructor(private readonly config: ElevatorBlocksConfig) {
    this.group.name = 'facility-elevator-art';
    const armor = this.kit.metal(0x455868, 0.3);
    const steel = this.kit.metal(0xb0c0cb, 0.2);
    const black = this.kit.metal(0x0c141c, 0.62, false);
    const glass = this.kit.metal(0x1a3a48, 0.18, false);
    const inset = this.kit.metal(0x243643, 0.48);
    const mark = this.kit.metal(0xc48a42, 0.45, false);

    const poses = elevatorBlocksStateAtTime(config, 0);
    const mid = (poses.length - 1) / 2;
    const shafts = new THREE.Group();
    shafts.name = 'shaft-frame';
    this.group.add(shafts);

    poses.forEach((s, i) => {
      const x = (i - mid) * config.spacing;
      const top = config.baseY + config.amplitude + s.height / 2 + 0.42;
      const railH = Math.max(0.8, top - FLOOR_Y);
      this.kit.box(shafts, `shaft-rail-l-${i}`, 0.1, railH, 0.22, x - s.width * 0.52, FLOOR_Y + railH / 2, 0.2, steel, 0.006);
      this.kit.box(shafts, `shaft-rail-r-${i}`, 0.1, railH, 0.22, x + s.width * 0.52, FLOOR_Y + railH / 2, 0.2, steel, 0.006);
      this.kit.box(shafts, `shaft-rail-groove-l-${i}`, 0.028, railH * 0.92, 0.06, x - s.width * 0.52, FLOOR_Y + railH / 2, -0.02, black, 0);
      this.kit.box(shafts, `shaft-rail-groove-r-${i}`, 0.028, railH * 0.92, 0.06, x + s.width * 0.52, FLOOR_Y + railH / 2, -0.02, black, 0);
      this.kit.box(shafts, `shaft-foot-${i}`, s.width * 1.22, 0.16, 0.42, x, FLOOR_Y + 0.08, 0.14, black, 0);
      this.kit.box(shafts, `shaft-sill-${i}`, s.width * 1.1, 0.055, 0.32, x, FLOOR_Y + 0.16, -0.04, armor, 0.006);
      this.kit.box(shafts, `shaft-sill-lip-${i}`, s.width * 1.02, 0.03, 0.08, x, FLOOR_Y + 0.19, -0.2, steel, 0.004);
      this.kit.box(shafts, `shaft-header-${i}`, s.width * 1.18, 0.2, 0.38, x, top - 0.06, 0.08, armor, 0.04);
      this.kit.box(shafts, `shaft-header-lip-${i}`, s.width * 1.08, 0.045, 0.08, x, top - 0.14, -0.18, steel, 0.004);
      this.kit.box(shafts, `shaft-header-lamp-${i}`, s.width * 0.45, 0.032, 0.04, x, top - 0.04, -0.22, this.kit.lamp(), 0.003);
    });

    poses.forEach((s, i) => {
      const carriage = new THREE.Group();
      carriage.name = `carriage-${i}`;
      this.carriages.push(carriage);
      this.group.add(carriage);
      const box = (
        name: string,
        w: number,
        h: number,
        d: number,
        x: number,
        y: number,
        z: number,
        m: THREE.Material,
        b = 0.025,
      ) => this.kit.box(carriage, name, w, h, d, x, y, z, m, b);

      box(`carriage-body-${i}`, s.width, s.height, 0.44, 0, 0, 0.12, black, 0);
      box('carriage-armor', s.width, s.height, 0.48, 0, 0, 0.13, armor, 0.045);
      box('face-plate', s.width * 0.88, s.height * 0.84, 0.04, 0, 0, -0.08, inset, 0.018);
      box('window-recess', s.width * 0.72, s.height * 0.6, 0.05, 0, 0, -0.11, black, 0.015);
      // Opaque reinforced glazing — never suggests a passable opening.
      box('reinforced-window', s.width * 0.6, s.height * 0.44, 0.028, 0, 0, -0.14, glass, 0.006);
      for (const x of [-0.22, 0, 0.22]) {
        box('window-rib', s.width * 0.026, s.height * 0.44, 0.036, x * s.width, 0, -0.165, steel, 0.004);
      }
      for (const side of [-1, 1]) {
        box('guide-shoe', s.width * 0.1, s.height * 0.7, 0.48, side * s.width * 0.4, 0, 0.1, steel, 0.016);
        box('guide-pad', s.width * 0.045, s.height * 0.48, 0.07, side * s.width * 0.445, 0, -0.12, black, 0);
        box('cross-member', s.width * 0.68, s.height * 0.038, 0.045, 0, side * s.height * 0.3, -0.155, steel, 0.006);
      }

      const lamp = this.kit.lamp();
      const lampCore = this.kit.lampCore();
      this.lamps.push(lamp);
      this.lampCores.push(lampCore);
      box('lamp-pocket', s.width * 0.52, s.height * 0.13, 0.04, 0, s.height * 0.38, -0.1, black, 0);
      box(`travel-lamp-${i}`, s.width * 0.4, s.height * 0.048, 0.024, 0, s.height * 0.38, -0.145, lamp, 0.005);
      box(`travel-core-${i}`, s.width * 0.2, s.height * 0.018, 0.014, 0, s.height * 0.38, -0.162, lampCore, 0);

      for (const x of [-0.32, 0.32]) {
        box('service-seat', s.width * 0.045, s.height * 0.045, 0.02, x * s.width, -s.height * 0.36, -0.1, black, 0);
        box('service-fastener', s.width * 0.026, s.height * 0.026, 0.026, x * s.width, -s.height * 0.36, -0.118, steel, 0.004);
      }
      for (let j = 0; j < 3; j++) {
        box('caution-marker', s.width * 0.055, s.height * 0.026, 0.012, (-0.14 + j * 0.11) * s.width, -s.height * 0.4, -0.1, mark, 0.003);
      }
      box('vent-slot', s.width * 0.32, s.height * 0.018, 0.014, 0, s.height * 0.2, -0.175, black, 0);
    });

    this.accent = new THREE.PointLight(0xffb449, 8, 11, 2);
    this.accent.name = 'elevator-accent';
    this.accent.position.set(0, config.baseY, -1.2);
    this.group.add(this.accent);
    this.update(0);
  }

  update(time: number) {
    const poses = elevatorBlocksStateAtTime(this.config, time);
    let avgY = 0;
    poses.forEach((s, i) => {
      this.carriages[i].position.set(s.x, s.y, 0);
      avgY += s.y;
      const amp = Math.max(1e-6, this.config.amplitude);
      const heightFrac = (s.y - this.config.baseY) / amp; // -1..1
      // High = cyan (under-lane clear), low = coral (blocking low path), mid = amber.
      const color = heightFrac > 0.45 ? 0x70e5ed : heightFrac < -0.45 ? 0xff7562 : 0xffb449;
      const intensity = 0.85 + Math.abs(heightFrac) * 0.35;
      this.lamps[i].color.setHex(color);
      this.lamps[i].emissive.setHex(color);
      this.lamps[i].emissiveIntensity = intensity;
      this.lampCores[i].color.setHex(color);
      this.lampCores[i].emissive.setHex(color);
      this.lampCores[i].emissiveIntensity = intensity * 1.45;
    });
    avgY /= Math.max(1, poses.length);
    this.accent.position.set(0, avgY, -1.15);
    this.accent.intensity = 8 + Math.abs(Math.sin(time * this.config.speed)) * 4;
    this.group.userData.laneYs = poses.map((p) => p.y);
  }

  dispose() {
    this.kit.dispose();
    this.group.clear();
    this.group.removeFromParent();
  }
}
