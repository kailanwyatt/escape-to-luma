import * as THREE from 'three';

export function addLighting(scene: THREE.Scene): void {
  const ambient = new THREE.AmbientLight(0xc8bba8, 0.72);
  scene.add(ambient);

  const key = new THREE.DirectionalLight(0xfff1d6, 1.05);
  key.position.set(-3.5, 10, -4);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0x88a0c8, 0.28);
  fill.position.set(4, 2, 6);
  scene.add(fill);
}
