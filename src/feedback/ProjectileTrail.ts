import * as THREE from 'three';

import { GAME_TUNING } from '../game/gameTuning';

type TrailNode = {
  mesh: THREE.Mesh;
  life: number;
};

export class ProjectileTrail {
  readonly group = new THREE.Group();
  private readonly nodes: TrailNode[] = [];
  private color = 0x7ef0ff;
  private width = 0.07;
  private emitEvery = 0.018;
  private emitAcc = 0;
  private next = 0;
  private active = false;
  private flare = 0;

  constructor(count = 18) {
    const geometry = new THREE.SphereGeometry(1, 8, 6);
    for (let i = 0; i < count; i += 1) {
      const material = new THREE.MeshBasicMaterial({
        color: this.color,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.visible = false;
      mesh.scale.setScalar(this.width);
      this.group.add(mesh);
      this.nodes.push({ mesh, life: 0 });
    }
  }

  setStyle(color: number, width: number): void {
    this.color = color;
    this.width = width;
  }

  start(): void {
    this.active = true;
    this.emitAcc = 0;
  }

  stop(): void {
    this.active = false;
  }

  pulseFlare(): void {
    this.flare = 1;
  }

  reset(): void {
    this.active = false;
    this.flare = 0;
    for (const node of this.nodes) {
      node.life = 0;
      node.mesh.visible = false;
    }
  }

  update(dt: number, position: THREE.Vector3, flying: boolean): void {
    if (this.flare > 0) {
      this.flare = Math.max(0, this.flare - dt * 4);
    }
    if (this.active && flying) {
      this.emitAcc += dt;
      while (this.emitAcc >= this.emitEvery) {
        this.emitAcc -= this.emitEvery;
        this.spawn(position);
      }
    }
    for (const node of this.nodes) {
      if (node.life <= 0) {
        continue;
      }
      node.life -= dt;
      const material = node.mesh.material as THREE.MeshBasicMaterial;
      const fade = Math.max(0, node.life / 0.28);
      material.opacity = fade * (0.55 + this.flare * 0.35);
      node.mesh.scale.setScalar(this.width * (0.7 + fade * 0.5 + this.flare * 0.4));
      if (node.life <= 0) {
        node.mesh.visible = false;
      }
    }
  }

  private spawn(position: THREE.Vector3): void {
    const node = this.nodes[this.next];
    this.next = (this.next + 1) % this.nodes.length;
    node.mesh.position.copy(position);
    node.mesh.position.y -= GAME_TUNING.projectile.radius * 0.15;
    node.life = 0.28;
    node.mesh.visible = true;
    const material = node.mesh.material as THREE.MeshBasicMaterial;
    material.color.setHex(this.color);
    material.opacity = 0.7;
    node.mesh.scale.setScalar(this.width);
  }
}
