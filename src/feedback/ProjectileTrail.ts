import * as THREE from 'three';

import { GAME_TUNING } from '../game/gameTuning';

type TrailNode = {
  mesh: THREE.Mesh;
  life: number;
  stretch: number;
};

/** Soft energy ribbon — elongated additive quads that streak behind the Spark. */
export class ProjectileTrail {
  readonly group = new THREE.Group();
  private readonly nodes: TrailNode[] = [];
  private color = 0x7ef0ff;
  private width = 0.07;
  private emitEvery = 0.016;
  private emitAcc = 0;
  private next = 0;
  private active = false;
  private flare = 0;
  private readonly lastPos = new THREE.Vector3();
  private readonly dir = new THREE.Vector3(0, 0, 1);
  private hasLast = false;

  constructor(count = 22) {
    const geometry = new THREE.PlaneGeometry(1, 1);
    for (let i = 0; i < count; i += 1) {
      const material = new THREE.MeshBasicMaterial({
        color: this.color,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.visible = false;
      mesh.scale.set(this.width * 0.6, this.width * 2.4, 1);
      this.group.add(mesh);
      this.nodes.push({ mesh, life: 0, stretch: 1 });
    }
  }

  setStyle(color: number, width: number): void {
    this.color = color;
    this.width = width;
  }

  start(): void {
    this.active = true;
    this.emitAcc = 0;
    this.hasLast = false;
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
    this.hasLast = false;
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
      if (this.hasLast) {
        this.dir.copy(position).sub(this.lastPos);
        if (this.dir.lengthSq() > 1e-6) {
          this.dir.normalize();
        }
      }
      this.emitAcc += dt;
      while (this.emitAcc >= this.emitEvery) {
        this.emitAcc -= this.emitEvery;
        this.spawn(position);
      }
      this.lastPos.copy(position);
      this.hasLast = true;
    }
    for (const node of this.nodes) {
      if (node.life <= 0) {
        continue;
      }
      node.life -= dt;
      const material = node.mesh.material as THREE.MeshBasicMaterial;
      const fade = Math.max(0, node.life / 0.32);
      material.opacity = fade * (0.42 + this.flare * 0.4);
      const w = this.width * (0.55 + fade * 0.45 + this.flare * 0.35);
      node.mesh.scale.set(w * 0.55, w * (2.2 + node.stretch * 1.4), 1);
      if (node.life <= 0) {
        node.mesh.visible = false;
      }
    }
  }

  private spawn(position: THREE.Vector3): void {
    const node = this.nodes[this.next];
    this.next = (this.next + 1) % this.nodes.length;
    node.mesh.position.copy(position);
    node.mesh.position.y -= GAME_TUNING.projectile.radius * 0.12;
    // Orient ribbon along flight direction.
    if (this.dir.lengthSq() > 0.01) {
      node.mesh.lookAt(
        position.x - this.dir.x,
        position.y - this.dir.y,
        position.z - this.dir.z,
      );
    }
    node.stretch = 0.8 + Math.min(1.6, this.dir.length() * 8);
    node.life = 0.32;
    node.mesh.visible = true;
    const material = node.mesh.material as THREE.MeshBasicMaterial;
    material.color.setHex(this.color);
    material.opacity = 0.65;
    node.mesh.scale.set(this.width * 0.55, this.width * 2.6, 1);
  }
}
