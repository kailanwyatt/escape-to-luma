import * as THREE from 'three';
import { createAsteroidSurface, finishAsteroidGeometry } from '../graphics/AsteroidSurface';

/** Four seeded silhouettes: rubble, elongated fragments, broken slabs and contact binaries. */
export function createAsteroidGeometry(seed: number, widthSegments = 48, heightSegments = 32): THREE.BufferGeometry {
  const surface = createAsteroidSurface(seed);
  const axes = [[1, .91, .86], [1.28, .68, .79], [1.13, .96, .56], [1.2, .84, .87]][surface.shape];
  const geometry = new THREE.SphereGeometry(1, widthSegments, heightSegments);
  const positions = geometry.getAttribute('position'), colors: number[] = [];
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
    const sample = surface.sample(x, y, z);
    const lobes = surface.shape === 3 ? -.18 + .3 * Math.abs(x) : 0;
    let radius = 1 + sample.relief + lobes;
    // Planar fracture faces cut corners off the original body, without vertex spikes.
    const plane = Math.abs(x * .63 + y * .53 - z * .57);
    radius = Math.min(radius, (.87 + Math.sin(surface.phase) * .045) / Math.max(.1, plane));
    radius = Math.max(.55, radius);
    positions.setXYZ(i, x * radius * axes[0], y * radius * axes[1], z * radius * axes[2]);
    colors.push(sample.color.r, sample.color.g, sample.color.b);
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.userData.asteroidFamily = surface.family;
  geometry.userData.asteroidShape = surface.shape;
  finishAsteroidGeometry(geometry, widthSegments, heightSegments);
  return geometry;
}
