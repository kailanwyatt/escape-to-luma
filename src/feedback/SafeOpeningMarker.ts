/**
 * Presentation-only marker for Aurora Guiding Light.
 * Highlights the authored safe opening — never moves aim or physics.
 */

import * as THREE from 'three';
import type { ObstaclePredictedState } from '../obstacles/GameplayObstacle';

/** True when predicted state names a real aperture (not a default empty pose). */
export function hasAuthoredSafeOpening(predicted: ObstaclePredictedState): boolean {
  return (
    predicted.openingRadius > 0.05 ||
    predicted.openingWidth > 0.15 ||
    predicted.openingHeight > 0.15
  );
}

export class SafeOpeningMarker {
  readonly group = new THREE.Group();
  private readonly ring: THREE.Mesh;

  constructor() {
    this.ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.55, 0.035, 8, 28),
      new THREE.MeshBasicMaterial({
        color: 0x7cffb2,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      }),
    );
    this.group.add(this.ring);
    this.group.visible = false;
  }

  setTarget(
    active: boolean,
    x: number,
    y: number,
    z: number,
    radius = 0.55,
  ): void {
    this.group.visible = active;
    if (!active) return;
    this.group.position.set(x, y, z);
    this.ring.scale.setScalar(Math.max(0.35, radius) / 0.55);
  }

  update(time: number, reduceMotion: boolean): void {
    if (!this.group.visible) return;
    const mat = this.ring.material as THREE.MeshBasicMaterial;
    mat.opacity = reduceMotion ? 0.5 : 0.4 + 0.2 * (0.5 + 0.5 * Math.sin(time * 3.2));
  }
}
