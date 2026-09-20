import * as THREE from 'three';

import { GAME_TUNING } from '../game/gameTuning';
import { integrateMotion } from './physics';

export class TrajectoryPredictor {
  readonly dots: THREE.Mesh[] = [];
  readonly group = new THREE.Group();
  private debugFull = false;

  constructor() {
    const geometry = new THREE.SphereGeometry(0.07, 10, 8);
    for (let i = 0; i < GAME_TUNING.aim.trajectoryDots; i += 1) {
      const material = new THREE.MeshBasicMaterial({
        color: 0xd8fbff,
        transparent: true,
        opacity: 0.85 - i * 0.08,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.visible = false;
      this.dots.push(mesh);
      this.group.add(mesh);
    }
  }

  setVisible(visible: boolean): void {
    this.group.visible = visible;
    for (const dot of this.dots) {
      dot.visible = visible;
    }
  }

  setDebugFull(enabled: boolean): void {
    this.debugFull = enabled;
    for (const [index, dot] of this.dots.entries()) {
      const material = dot.material as THREE.MeshBasicMaterial;
      material.color.setHex(enabled ? 0xfff4c2 : 0xd8fbff);
      material.opacity = enabled ? 0.9 - index * 0.04 : 0.85 - index * 0.08;
    }
  }

  setFaded(faded: boolean): void {
    this.group.visible = !faded;
    for (const [index, dot] of this.dots.entries()) {
      const material = dot.material as THREE.MeshBasicMaterial;
      material.opacity = faded ? 0 : 0.85 - index * 0.08;
      dot.visible = !faded;
    }
  }

  update(
    start: THREE.Vector3,
    velocity: { vx: number; vy: number; vz: number },
    endZ = GAME_TUNING.target.z,
    options?: {
      windX?: number;
      gravityScale?: number;
      wells?: { x: number; y: number; z: number; strength: number; radius: number }[];
    },
  ): void {
    const count = this.dots.length;
    const travelZ = Math.max(0.5, endZ - start.z);
    const tEnd =
      (velocity.vz <= 0.001 ? 1 : travelZ / velocity.vz) *
      (this.debugFull ? 1 : GAME_TUNING.aim.trajectoryFraction);

    const state = {
      x: start.x,
      y: start.y,
      z: start.z,
      vx: velocity.vx,
      vy: velocity.vy,
      vz: velocity.vz,
    };
    const steps = count * 4;
    const dt = tEnd / steps;
    let dotIndex = 0;
    for (let step = 1; step <= steps; step += 1) {
      integrateMotion(state, dt, options);
      if (step % 4 === 0 && dotIndex < count) {
        this.dots[dotIndex].position.set(state.x, state.y, state.z);
        dotIndex += 1;
      }
    }
    while (dotIndex < count) {
      this.dots[dotIndex].position.set(state.x, state.y, state.z);
      dotIndex += 1;
    }
  }
}
