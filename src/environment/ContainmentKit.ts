import * as THREE from 'three';
import { containmentProfile } from './WorldPresentation';

/** Shared geometry/materials. All dressing lies outside x ±3.2, the play lane. */
export class ContainmentKit {
  readonly group = new THREE.Group();
  private readonly research = new THREE.Group();
  private readonly service = new THREE.Group();
  private readonly security = new THREE.Group();
  private readonly skyline = new THREE.Group();
  private readonly accent: THREE.MeshStandardMaterial;

  constructor() {
    const steel = new THREE.MeshStandardMaterial({ color: 0x6a8294, metalness: 0.78, roughness: 0.34 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x101c28, metalness: 0.55, roughness: 0.62 });
    const amber = new THREE.MeshStandardMaterial({
      color: 0xffb74e,
      emissive: 0xff9b32,
      emissiveIntensity: 0.55,
      metalness: 0.15,
      roughness: 0.4,
    });
    this.accent = new THREE.MeshStandardMaterial({
      color: 0x64dce8,
      emissive: 0x2a8a9a,
      emissiveIntensity: 0.45,
      metalness: 0.2,
      roughness: 0.35,
    });
    const cube = new THREE.BoxGeometry(1, 1, 1);
    const add = (
      parent: THREE.Group,
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
      mat: THREE.Material,
    ) => {
      const mesh = new THREE.Mesh(cube, mat);
      mesh.position.set(x, y, z);
      mesh.scale.set(w, h, d);
      parent.add(mesh);
    };
    for (const side of [-1, 1]) {
      for (const z of [2, 6, 10]) {
        add(this.group, side * 4.8, 3.2, z, 0.34, 4.8, 3.7, steel);
        add(this.group, side * 4.55, 3.2, z - 1.8, 0.3, 5.4, 0.2, dark);
        add(this.group, side * 4.36, 3.4, z - 1.9, 0.09, 2.1, 0.09, this.accent);
        add(this.group, side * 3.8, 0.35, z, 1.2, 0.75, 1.55, steel);
        add(this.group, side * 3.8, 0.78, z, 1.22, 0.09, 1.6, amber);
        add(this.group, side * 4.15, 5.6, z, 1.25, 0.2, 2.8, steel);
        add(this.group, side * 3.58, 5.45, z, 0.09, 0.09, 2.3, amber);
        add(this.research, side * 4, 0.8, z, 1.15, 1.65, 0.95, steel);
        add(this.research, side * 3.8, 1.9, z, 0.85, 0.58, 0.1, dark);
        for (let row = 0; row < 4; row++) {
          add(this.research, side * 3.8, 1.72 + row * 0.1, z - 0.05, 0.6 - row * 0.1, 0.025, 0.02, this.accent);
        }
        add(this.service, side * 4, 2.6, z, 0.85, 5.2, 0.28, steel);
        add(this.service, side * 3.55, 2.6, z - 0.1, 0.07, 4.7, 0.07, this.accent);
        add(this.security, side * 3.9, 2.8, z, 0.6, 5.6, 0.65, dark);
        add(this.security, side * 3.58, 4.5, z, 0.07, 0.7, 0.45, this.accent);
      }
      for (let i = 0; i < 4; i++) add(this.service, side * 4.6, 1 + i * 0.45, 7, 0.14, 0.14, 14, steel);
      for (let i = 0; i < 7; i++) {
        const height = 3 + ((i * 7) % 5);
        add(this.skyline, side * (3.4 + i * 0.25), height / 2, 15.6, 0.48, height, 0.22, dark);
        for (let row = 1; row < height; row++) {
          add(this.skyline, side * (3.4 + i * 0.25), row, 15.45, 0.1, 0.12, 0.02, this.accent);
        }
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
    this.accent.emissive.setHex(profile.accent);
    this.research.visible = profile.composition === 'research' || profile.composition === 'vessel';
    this.service.visible = profile.composition === 'service';
    this.security.visible = profile.composition === 'security' || profile.composition === 'escape';
    this.skyline.visible = level === 15;
  }
}
