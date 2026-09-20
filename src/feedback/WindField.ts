import * as THREE from 'three';

const STREAK_COUNT = 28;

export class WindField {
  readonly group = new THREE.Group();
  private readonly streaks: THREE.Line[] = [];
  private strength = 0;

  constructor() {
    for (let index = 0; index < STREAK_COUNT; index += 1) {
      const length = 0.22 + (index % 5) * 0.08;
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-length, 0, 0),
        new THREE.Vector3(length, 0, 0),
      ]);
      const material = new THREE.LineBasicMaterial({
        color: index % 3 === 0 ? 0xffffff : 0x64dcff,
        transparent: true,
        opacity: 0.18 + (index % 4) * 0.08,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const line = new THREE.Line(geometry, material);
      line.position.set(
        -2.7 + ((index * 1.37) % 5.4),
        0.8 + ((index * 0.83) % 4.4),
        0.5 + ((index * 2.71) % 13),
      );
      this.streaks.push(line);
      this.group.add(line);
    }
    this.group.visible = false;
  }

  setWind(windX: number): void {
    this.strength = windX;
    this.group.visible = Math.abs(windX) > 0.001;
    const direction = Math.sign(windX) || 1;
    for (const streak of this.streaks) {
      streak.scale.x = direction;
    }
  }

  update(dt: number, reduceMotion: boolean): void {
    if (!this.group.visible || reduceMotion) {
      return;
    }
    const speed = this.strength * 3.5;
    for (const [index, streak] of this.streaks.entries()) {
      streak.position.x += speed * dt * (0.7 + (index % 4) * 0.12);
      if (streak.position.x > 3.2) {
        streak.position.x = -3.2;
      } else if (streak.position.x < -3.2) {
        streak.position.x = 3.2;
      }
    }
  }

  dispose(): void {
    for (const streak of this.streaks) {
      streak.geometry.dispose();
      (streak.material as THREE.Material).dispose();
    }
  }
}
