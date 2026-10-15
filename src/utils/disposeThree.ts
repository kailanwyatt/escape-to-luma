import * as THREE from 'three';

export function disposeThreeObject(root: THREE.Object3D): void {
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>();
  root.traverse(object => {
    if (object instanceof THREE.InstancedMesh) object.dispose();
    const drawable = object as THREE.Mesh;
    if (drawable.geometry) geometries.add(drawable.geometry);
    if (drawable.material) (Array.isArray(drawable.material) ? drawable.material : [drawable.material]).forEach(m => materials.add(m));
  });
  for (const material of materials) for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
  textures.forEach(t => t.dispose()); geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
}
