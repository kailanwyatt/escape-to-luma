import * as THREE from 'three';

import { GAME_TUNING } from '../game/gameTuning';

export class Projectile {
  readonly position = new THREE.Vector3();
  readonly previousPosition = new THREE.Vector3();
  readonly velocity = new THREE.Vector3();
  readonly mesh: THREE.Mesh;
  private style = {
    color: 0x7ef0ff,
    emissive: 0x1aa8b8,
    emissiveIntensity: 0.55,
    shininess: 80,
  };

  constructor() {
    const geometry = new THREE.SphereGeometry(GAME_TUNING.projectile.radius, 20, 16);
    const material = new THREE.MeshPhongMaterial({
      color: 0x7ef0ff,
      emissive: 0x1aa8b8,
      emissiveIntensity: 0.55,
      shininess: 80,
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.reset();
  }

  setCancelReady(ready: boolean): void {
    this.mesh.scale.setScalar(ready ? 0.88 : 1);
    const material = this.mesh.material as THREE.MeshPhongMaterial;
    material.emissiveIntensity = ready ? this.style.emissiveIntensity * 0.4 : this.style.emissiveIntensity;
  }

  applyStyle(style: { color: number; emissive: number; emissiveIntensity: number; shininess: number }): void {
    this.style = style;
    const material = this.mesh.material as THREE.MeshPhongMaterial;
    material.color.setHex(style.color);
    material.emissive.setHex(style.emissive);
    material.emissiveIntensity = style.emissiveIntensity;
    material.shininess = style.shininess;
  }

  reset(): void {
    const start = GAME_TUNING.projectile.startPosition;
    this.position.set(start.x, start.y, start.z);
    this.previousPosition.copy(this.position);
    this.velocity.set(0, 0, 0);
    this.syncMesh();
    this.mesh.visible = true;
    this.setCancelReady(false);
  }

  syncMesh(): void {
    this.mesh.position.copy(this.position);
  }
}
