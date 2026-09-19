import * as THREE from 'three';

import { GAME_TUNING } from '../game/gameTuning';

const ringMaterial = () =>
  new THREE.MeshLambertMaterial({ color: 0xb8c0c8 });

const hubMaterial = () =>
  new THREE.MeshLambertMaterial({ color: 0xe6c35c });

const bladeMaterial = () =>
  new THREE.MeshLambertMaterial({ color: 0xd06a32 });

export function createRotorGeometry(bladeCount: number): THREE.Group {
  const group = new THREE.Group();
  const t = GAME_TUNING.rotor;

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(t.radius, t.ringThickness, 10, 48),
    ringMaterial(),
  );
  group.add(ring);

  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(t.hubRadius, t.hubRadius, t.bladeDepth * 2.2, 20),
    hubMaterial(),
  );
  hub.rotation.x = Math.PI / 2;
  group.add(hub);

  const bladeGeom = new THREE.BoxGeometry(t.bladeLength, t.bladeWidth, t.bladeDepth);
  for (let i = 0; i < bladeCount; i += 1) {
    const blade = new THREE.Mesh(bladeGeom, bladeMaterial());
    const angle = (i / bladeCount) * Math.PI * 2;
    const radius = t.hubRadius + t.bladeLength / 2;
    blade.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
    blade.rotation.z = angle;
    group.add(blade);
  }

  return group;
}

export function disposeObject3D(object: THREE.Object3D): void {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }
    const material = mesh.material;
    if (Array.isArray(material)) {
      for (const item of material) {
        item.dispose();
      }
    } else if (material) {
      material.dispose();
    }
  });
}
