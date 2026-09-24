import * as THREE from 'three';

import { GAME_TUNING } from '../game/gameTuning';

type Particle = {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
};

export class ParticleSystem {
  readonly group = new THREE.Group();
  private readonly pool: Particle[] = [];
  private next = 0;

  constructor(count = 48) {
    const geometry = new THREE.SphereGeometry(0.05, 6, 6);
    for (let i = 0; i < count; i += 1) {
      const material = new THREE.MeshBasicMaterial({
        color: 0xffc46b,
        transparent: true,
        opacity: 0,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.visible = false;
      this.group.add(mesh);
      this.pool.push({
        mesh,
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: 1,
      });
    }
  }

  spawnSparks(position: THREE.Vector3, count = 10): void {
    this.burst(position, count, 0xffc46b, 3.2, 0.45);
  }

  spawnHit(position: THREE.Vector3, count: number, color: number, speed: number): void {
    this.burst(position, count, color, speed, 0.55);
  }

  spawnCloseCall(position: THREE.Vector3): void {
    this.burst(position, 6, 0x7ef0ff, 1.8, 0.35);
  }

  spawnStreak(position: THREE.Vector3): void {
    this.burst(position, 10, 0xffd24a, 2.4, 0.4);
  }

  /** Cyan flow from entry aperture toward the destination portal. */
  spawnPortalFlow(from: THREE.Vector3, to: THREE.Vector3): void {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dz = to.z - from.z;
    const steps = 10;
    for (let i = 0; i < steps; i += 1) {
      const u = (i + 0.5) / steps;
      const pos = new THREE.Vector3(
        from.x + dx * u,
        from.y + dy * u,
        from.z + dz * u,
      );
      const particle = this.pool[this.next];
      this.next = (this.next + 1) % this.pool.length;
      particle.mesh.position.copy(pos);
      particle.velocity.set(dx * 1.8, dy * 1.8, dz * 1.8 + (Math.random() - 0.5) * 0.4);
      particle.life = 0.45 + u * 0.2;
      particle.maxLife = particle.life;
      particle.mesh.visible = true;
      const material = particle.mesh.material as THREE.MeshBasicMaterial;
      material.color.setHex(0x7ef0ff);
      material.opacity = 1;
    }
    this.burst(to, 8, 0x85f5ff, 1.6, 0.5);
  }

  /** Amber suck when Spark takes a false black-hole entry. */
  spawnFalsePortalSuck(position: THREE.Vector3): void {
    this.burst(position, 12, 0xffb449, 2.8, 0.5);
  }

  update(dt: number): void {
    for (const particle of this.pool) {
      if (particle.life <= 0) {
        continue;
      }
      particle.life -= dt;
      particle.velocity.y -= 4 * dt;
      particle.mesh.position.addScaledVector(particle.velocity, dt);
      const material = particle.mesh.material as THREE.MeshBasicMaterial;
      material.opacity = Math.max(0, particle.life / particle.maxLife);
      if (particle.life <= 0) {
        particle.mesh.visible = false;
      }
    }
  }

  private burst(
    position: THREE.Vector3,
    count: number,
    color: number,
    speed: number,
    life: number,
  ): void {
    for (let i = 0; i < count; i += 1) {
      const particle = this.pool[this.next];
      this.next = (this.next + 1) % this.pool.length;
      particle.mesh.position.copy(position);
      particle.velocity.set(
        (Math.random() * 2 - 1) * speed,
        Math.random() * speed,
        (Math.random() * 2 - 1) * speed * 0.45,
      );
      particle.life = life;
      particle.maxLife = life;
      particle.mesh.visible = true;
      const material = particle.mesh.material as THREE.MeshBasicMaterial;
      material.color.setHex(color);
      material.opacity = 1;
    }
  }
}
