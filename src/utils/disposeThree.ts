import * as THREE from 'three';

export function disposeThreeObject(root: THREE.Object3D): void {
  root.traverse((object) => {
    const renderable = object as THREE.Mesh | THREE.Line | THREE.Points;
    if ('geometry' in renderable && renderable.geometry) {
      renderable.geometry.dispose();
    }
    if (!('material' in renderable) || !renderable.material) {
      return;
    }
    const materials = Array.isArray(renderable.material)
      ? renderable.material
      : [renderable.material];
    for (const material of materials) {
      disposeMaterialTextures(material);
      material.dispose();
    }
  });
}

function disposeMaterialTextures(material: THREE.Material): void {
  const values = Object.values(material as unknown as Record<string, unknown>);
  for (const value of values) {
    if (value instanceof THREE.Texture) {
      value.dispose();
    }
  }
}
