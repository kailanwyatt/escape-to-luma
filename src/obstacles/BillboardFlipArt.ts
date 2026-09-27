import * as THREE from 'three';
import type { BillboardFlipConfig } from '../config/ObstacleConfig';
import { billboardFlipStateAtTime } from './BillboardFlipState';
import { FacilityArtKit } from './FacilityArtKit';

/**
 * Cinematic rooftop billboard.
 * Face-on = wall; edge-on = clear. Poses sample BillboardFlipState.
 * Collision AABB matches the face silhouette (board-* meshes); mast is decorative.
 */
export class BillboardFlipArt {
  readonly group = new THREE.Group();
  private readonly kit = new FacilityArtKit({ cinematic: true });
  private readonly panel: THREE.Group;
  private readonly lamps: THREE.MeshStandardMaterial[] = [];
  private readonly accent: THREE.PointLight;
  private readonly halfH: number;

  constructor(private readonly config: BillboardFlipConfig) {
    this.group.name = 'billboard-flip-art';
    this.halfH = config.halfHeight;
    const w = config.halfWidth * 2;
    const h = config.halfHeight * 2;
    const d = (config.halfDepth ?? 0.08) * 2;
    const armor = this.kit.metal(0x3d4f5e, 0.34);
    const steel = this.kit.metal(0xb0c0cb, 0.22);
    const dark = this.kit.metal(0x0c141c, 0.62, false);
    const face = this.kit.metal(0x5a6d7c, 0.4);
    const lamp = this.kit.lamp();
    this.lamps.push(lamp);
    const lampCore = this.kit.lampCore();
    this.lamps.push(lampCore);

    this.panel = new THREE.Group();
    this.panel.name = 'billboard-panel';
    this.group.add(this.panel);

    const box = (
      name: string,
      bw: number,
      bh: number,
      bd: number,
      x: number,
      y: number,
      z: number,
      m: THREE.Material,
      b = 0.012,
    ) => this.kit.box(this.panel, name, bw, bh, bd, x, y, z, m, b);

    // Authoritative face silhouette — details stay inside halfWidth × halfHeight.
    box('board-body', w, h, d, 0, 0, 0, dark, 0);
    box('board-face', w * 0.94, h * 0.92, d * 0.55, 0, 0, -d * 0.15, face, 0.01);
    box('board-frame', w, h * 0.08, d * 1.1, 0, h * 0.46, 0.01, armor, 0.008);
    box('board-frame-b', w, h * 0.08, d * 1.1, 0, -h * 0.46, 0.01, armor, 0.008);
    for (const side of [-1, 1]) {
      box('board-rail', w * 0.06, h * 0.88, d * 1.05, side * w * 0.47, 0, 0.01, steel, 0.006);
    }
    for (const y of [-0.28, 0, 0.28]) {
      box('ad-stripe', w * 0.72, h * 0.08, 0.02, 0, y * h, -d * 0.45, lamp, 0.003);
    }
    box('ad-core', w * 0.35, h * 0.04, 0.014, 0, 0, -d * 0.52, lampCore, 0);
    // Pivot hub stays inside the face band.
    box('board-hub', w * 0.12, h * 0.1, d * 1.35, 0, 0, 0.02, steel, 0.006);

    // Decorative mast below the face (excluded from silhouette tests).
    this.kit.box(this.group, 'mast', 0.16, 0.55, 0.16, 0, -h * 0.5 - 0.28, 0.04, armor, 0.01);
    this.kit.box(this.group, 'mast-base', 0.42, 0.12, 0.28, 0, -h * 0.5 - 0.55, 0.02, dark, 0.006);

    this.accent = new THREE.PointLight(0xffb449, 9, 9, 2);
    this.accent.name = 'billboard-accent';
    this.group.add(this.accent);
    this.update(0);
  }

  update(time: number) {
    const s = billboardFlipStateAtTime(this.config, time);
    this.panel.position.set(s.centerX, s.centerY, 0);
    this.panel.rotation.y = s.angle;

    const mast = this.group.getObjectByName('mast');
    const base = this.group.getObjectByName('mast-base');
    if (mast) {
      mast.position.x = s.centerX;
      mast.position.y = s.centerY - this.halfH - 0.28;
    }
    if (base) {
      base.position.x = s.centerX;
      base.position.y = s.centerY - this.halfH - 0.55;
    }

    const color = s.open ? 0x70e5ed : s.warning ? 0xffb449 : 0xff7562;
    for (const lamp of this.lamps) {
      lamp.color.setHex(color);
      lamp.emissive.setHex(color);
      lamp.emissiveIntensity = s.warning ? 1.2 : s.open ? 0.85 : 1.05;
    }
    this.accent.color.setHex(color);
    this.accent.intensity = s.warning ? 14 : s.open ? 8 : 11;
    this.accent.position.set(s.centerX, s.centerY, -1.05);
    this.group.userData.open = s.open;
    this.group.userData.warning = s.warning;
  }

  dispose() {
    this.kit.dispose();
    this.group.clear();
    this.group.removeFromParent();
  }
}
