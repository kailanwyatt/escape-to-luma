import * as THREE from 'three';
import { createAsteroidMaterial, createAsteroidSurface, finishAsteroidGeometry } from '../graphics/AsteroidSurface';

/** Sculpted impact bowls and fracture faces preserve the authoritative XY hit silhouette. */
export function createConveyorAsteroid(seed: number, silhouette: 'round' | 'shard' = 'round'): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(1, 64, 40);
  const positions = geometry.getAttribute('position'), colors: number[] = [];
  const surface = createAsteroidSurface(seed);
  const thickness = .82 + Math.sin(surface.phase) * .11;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
    const sample = surface.sample(x, y, z);
    if (silhouette === 'shard') {
      const angle = Math.atan2(y, x);
      const contour = .94 + .045 * Math.cos(angle * (3 + Math.floor(seed) % 3) + seed);
      const flatten = .91 + .07 * Math.abs(Math.sin(seed));
      positions.setXY(i, x * contour, y * contour * flatten);
    }
    // Crater floors sink into the body; raised lips catch the key light. Broken faces
    // are broad planes rather than noisy triangles. Both sides have unique impacts.
    const face = Math.max(.5, 1 - Math.max(0, x * .48 + y * .32 + Math.abs(z) * .69 - .48) * .65);
    const depth = Math.min(.98, Math.max(.38, thickness + sample.relief * 1.45)) * face;
    positions.setZ(i, z * depth);
    colors.push(sample.color.r, sample.color.g, sample.color.b);
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  finishAsteroidGeometry(geometry, 64, 40);
  const body = new THREE.Mesh(geometry, createAsteroidMaterial(surface.family));
  body.name = 'conveyor-impact-sculpted-asteroid';
  return body;
}
