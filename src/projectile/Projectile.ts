import * as THREE from 'three';

import { GAME_TUNING } from '../game/gameTuning';

export class Projectile {
  readonly position = new THREE.Vector3();
  readonly previousPosition = new THREE.Vector3();
  readonly velocity = new THREE.Vector3();
  readonly mesh = new THREE.Group();
  private readonly core: THREE.Mesh<THREE.SphereGeometry, THREE.MeshPhongMaterial>;
  private readonly shell: THREE.Mesh<THREE.SphereGeometry, THREE.MeshPhongMaterial>;
  private readonly glow: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;
  private readonly orbits: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>[] = [];
  private style = {
    color: 0x7ef0ff,
    emissive: 0x1aa8b8,
    emissiveIntensity: 0.55,
    shininess: 80,
  };

  constructor() {
    const radius = GAME_TUNING.projectile.radius;
    this.core = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 0.62, 20, 16),
      new THREE.MeshPhongMaterial({
      color: 0x7ef0ff,
      emissive: 0x1aa8b8,
        emissiveIntensity: 1.15,
        shininess: 100,
      }),
    );
    this.shell = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 24, 18),
      new THREE.MeshPhongMaterial({
        color: 0x7ef0ff,
        emissive: 0x1aa8b8,
        emissiveIntensity: 0.45,
        shininess: 100,
        transparent: true,
        opacity: 0.24,
        depthWrite: false,
      }),
    );
    this.glow = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 1.42, 16, 12),
      new THREE.MeshBasicMaterial({
        color: 0x22d8ff,
        transparent: true,
        opacity: 0.1,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    for (let index = 0; index < 3; index += 1) {
      const orbit = new THREE.Mesh(
        new THREE.TorusGeometry(radius * 1.05, radius * 0.035, 6, 36),
        new THREE.MeshBasicMaterial({
          color: 0x8ff8ff,
          transparent: true,
          opacity: 0.82,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      orbit.rotation.set(index * 1.03, index * 0.7, index * 0.92);
      this.orbits.push(orbit);
    }
    this.mesh.add(this.glow, this.shell, this.core, ...this.orbits);
    this.reset();
  }

  setCancelReady(ready: boolean): void {
    this.mesh.scale.setScalar(ready ? 0.88 : 1);
    this.core.material.emissiveIntensity = ready
      ? this.style.emissiveIntensity * 0.55
      : this.style.emissiveIntensity;
    this.shell.material.opacity = ready ? 0.12 : 0.24;
  }

  applyStyle(style: { color: number; emissive: number; emissiveIntensity: number; shininess: number }): void {
    this.style = style;
    this.core.material.color.setHex(style.color);
    this.core.material.emissive.setHex(style.emissive);
    this.core.material.emissiveIntensity = style.emissiveIntensity;
    this.core.material.shininess = style.shininess;
    this.shell.material.color.setHex(style.color);
    this.shell.material.emissive.setHex(style.emissive);
    this.glow.material.color.setHex(style.emissive);
    for (const orbit of this.orbits) {
      orbit.material.color.setHex(style.color);
    }
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

  updateVisual(time: number, reduceMotion: boolean): void {
    const pulse = reduceMotion ? 1 : 1 + Math.sin(time * 4.2) * 0.045;
    this.core.scale.setScalar(pulse);
    this.glow.scale.setScalar(reduceMotion ? 1 : 1 + Math.sin(time * 2.4) * 0.08);
    if (!reduceMotion) {
      this.orbits.forEach((orbit, index) => {
        orbit.rotation.z += 0.004 + index * 0.0015;
        orbit.rotation.x += 0.0015;
      });
    }
  }

  dispose(): void {
    this.core.geometry.dispose();
    this.core.material.dispose();
    this.shell.geometry.dispose();
    this.shell.material.dispose();
    this.glow.geometry.dispose();
    this.glow.material.dispose();
    for (const orbit of this.orbits) {
      orbit.geometry.dispose();
      orbit.material.dispose();
    }
  }
}
