import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/** Merge stationary opaque geometry by material. Animated / transparent actors stay independent. */
export function batchOpeningMeshes(root: THREE.Group) {
  root.updateMatrixWorld(true);
  const inverse = root.matrixWorld.clone().invert();
  const batches = new Map<THREE.Material, THREE.Mesh[]>();
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh) || object instanceof THREE.InstancedMesh || object.userData.animated) return;
    if (Array.isArray(object.material) || object.material.transparent) return;
    const batch = batches.get(object.material) ?? [];
    batch.push(object);
    batches.set(object.material, batch);
  });
  for (const [material, objects] of batches) {
    if (objects.length < 2) continue;
    const copies = objects.map(object => object.geometry.clone().applyMatrix4(inverse.clone().multiply(object.matrixWorld)));
    const geometry = mergeGeometries(copies);
    copies.forEach(copy => copy.dispose());
    if (!geometry) continue;
    const originalGeometries = new Set<THREE.BufferGeometry>();
    for (const object of objects) {
      object.removeFromParent();
      originalGeometries.add(object.geometry);
    }
    originalGeometries.forEach(original => original.dispose());
    const combined = new THREE.Mesh(geometry, material);
    combined.name = 'opening-static-batch';
    root.add(combined);
  }
}
