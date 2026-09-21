import * as THREE from 'three';
import { containmentMetal } from '../graphics/ContainmentMaterials';
import { containmentProfile } from './WorldPresentation';

/** Shared geometry/materials. All dressing lies outside x ±3.2, the play lane. */
export class ContainmentKit {
  readonly group = new THREE.Group();
  private readonly research = new THREE.Group();
  private readonly service = new THREE.Group();
  private readonly security = new THREE.Group();
  private readonly skyline = new THREE.Group();
  private readonly accent = new THREE.MeshBasicMaterial({color: 0x64dce8});
  constructor() {
    const steel = containmentMetal();
    const dark = new THREE.MeshLambertMaterial({color: 0x101c28});
    const amber = new THREE.MeshBasicMaterial({color: 0xffb74e});
    const cube = new THREE.BoxGeometry(1, 1, 1);
    const add = (parent: THREE.Group, x: number, y: number, z: number, w: number, h: number, d: number, mat: THREE.Material) => {
      const mesh = new THREE.Mesh(cube, mat); mesh.position.set(x, y, z); mesh.scale.set(w, h, d); parent.add(mesh);
    };
    for (const side of [-1, 1]) {
      for (const z of [2, 6, 10]) {
        // Wall cassettes and recessed equipment repeat through every composition.
        add(this.group, side * 4.8, 3.2, z, .3, 4.8, 3.7, steel);
        add(this.group, side * 4.55, 3.2, z - 1.8, .28, 5.4, .18, dark);
        add(this.group, side * 4.36, 3.4, z - 1.9, .08, 2.1, .08, this.accent);
        add(this.group, side * 3.8, .35, z, 1.15, .7, 1.5, steel);
        add(this.group, side * 3.8, .74, z, 1.18, .08, 1.55, amber);
        add(this.group, side * 4.15, 5.6, z, 1.2, .18, 2.8, steel);
        add(this.group, side * 3.58, 5.45, z, .08, .08, 2.3, amber);
        add(this.research, side * 4, .8, z, 1.1, 1.6, .9, steel);
        add(this.research, side * 3.8, 1.9, z, .8, .55, .08, dark);
        for (let row = 0; row < 4; row++) {
          add(this.research, side * 3.8, 1.72 + row * .1, z - .05, .6 - row * .1, .025, .02, this.accent);
        }
        add(this.service, side * 4, 2.6, z, .8, 5.2, .25, steel);
        add(this.service, side * 3.55, 2.6, z - .1, .06, 4.7, .06, this.accent);
        add(this.security, side * 3.9, 2.8, z, .55, 5.6, .6, dark);
        add(this.security, side * 3.58, 4.5, z, .06, .65, .4, this.accent);
      }
      for (let i = 0; i < 4; i++) add(this.service, side * 4.6, 1 + i * .45, 7, .12, .12, 14, steel);
      for (let i = 0; i < 7; i++) {
        const height = 3 + (i * 7 % 5);
        add(this.skyline, side * (3.4 + i * .25), height / 2, 15.6, .45, height, .2, dark);
        for (let row = 1; row < height; row++) add(this.skyline, side * (3.4 + i * .25), row, 15.45, .09, .12, .02, this.accent);
      }
    }
    this.group.add(this.research, this.service, this.security, this.skyline);
    this.setLevel(null);
  }
  setLevel(level: number | null): void {
    this.group.visible = level !== null;
    if (level === null) return;
    const profile = containmentProfile(level);
    this.accent.color.setHex(profile.accent);
    this.research.visible = profile.composition === 'research' || profile.composition === 'vessel';
    this.service.visible = profile.composition === 'service';
    this.security.visible = profile.composition === 'security' || profile.composition === 'escape';
    this.skyline.visible = level === 15;
  }
}
