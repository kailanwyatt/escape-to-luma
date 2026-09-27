/**
 * Original piston field presentation: MeshBasic lane boxes.
 * Kept for revert via PISTON_VISUAL_VARIANT = 'basic'.
 */
import * as THREE from 'three';
import type { PistonFieldConfig } from '../../config/ObstacleConfig';
import { pistonFieldStateAtTime } from '../PistonFieldState';

export class PistonFieldArtBasic {
  readonly group = new THREE.Group();
  private readonly parts: THREE.Mesh[] = [];

  constructor(private readonly config: PistonFieldConfig) {
    this.group.name = 'piston-field-basic';
    for (let i = 0; i < config.laneCount; i++) {
      for (const [name, color] of [
        ['floor-socket', 0x26313b],
        ['steel-ram', 0x405566],
        ['shaft-face', 0xabc0cc],
        ['ram-cap', 0x253746],
        ['travel-lamp', 0xffba62],
        ['shaft-shadow', 0x263944],
        ['socket-collar', 0x607785],
        ['socket-mark', 0xd8a14a],
      ] as const) {
        this.box(`${name}-${i}`, color);
      }
    }
  }

  private box(name: string, color: number) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }),
    );
    mesh.name = name;
    mesh.frustumCulled = false;
    this.parts.push(mesh);
    this.group.add(mesh);
  }

  private place(index: number, x: number, y: number, z: number, w: number, h: number, d: number) {
    const mesh = this.parts[index];
    mesh.position.set(x, y, z);
    mesh.scale.set(w, h, d);
  }

  update(time: number): void {
    pistonFieldStateAtTime(this.config, time).forEach((s, i) => {
      const n = i * 8;
      this.place(n, s.x, s.floorY - 0.06, 0.1, s.width * 1.18, 0.12, 0.3);
      this.place(n + 1, s.x, s.y, 0, s.width, s.height, 0.18);
      this.place(n + 2, s.x, s.y, -0.096, s.width * 0.34, s.height * 0.94, 0.012);
      const cap = Math.min(0.16, s.height * 0.3);
      this.place(n + 3, s.x, s.top - cap / 2, -0.1, s.width, cap, 0.016);
      this.place(n + 4, s.x, s.top - cap / 2, -0.112, s.width * 0.52, cap * 0.27, 0.012);
      (this.parts[n + 4].material as THREE.MeshBasicMaterial).color.setHex(s.open ? 0xc4d6da : 0xffb449);
      this.place(n + 5, s.x + s.width * 0.28, s.y, -0.097, s.width * 0.09, s.height * 0.94, 0.014);
      this.place(n + 6, s.x, s.floorY + Math.min(0.16, s.height * 0.18), -0.105, s.width, Math.min(0.25, s.height * 0.3), 0.02);
      this.place(n + 7, s.x, s.floorY + 0.045, -0.121, s.width * 0.7, 0.035, 0.014);
    });
  }

  dispose(): void {
    for (const mesh of this.parts) {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
    this.parts.length = 0;
    this.group.clear();
    this.group.removeFromParent();
  }
}
