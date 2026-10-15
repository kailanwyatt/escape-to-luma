import * as THREE from 'three';
import type { EnvironmentId } from '../config/ChallengeConfig';
import type { MovingRingConfig } from '../config/ObstacleConfig';
import { createRingVisual } from './ObstacleVisuals';
import { batchOpeningMeshes } from '../scene/batchOpeningMeshes';

/** Motion-specific chassis, entirely outside the unit opening. */
export function createMovingRingMechanism(environment: EnvironmentId, movement: MovingRingConfig['movement']['type']) {
  const root = createRingVisual(environment), hardware = root.getObjectByName('gate-hardware') as THREE.Group;
  const shell = new THREE.MeshStandardMaterial({ color: environment === 'space' ? 0x66808e : 0x526778, roughness: .38, metalness: .7 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x142532, roughness: .6, metalness: .45 });
  const light = new THREE.MeshBasicMaterial({ color: 0x76d7e5 });
  const box = new THREE.BoxGeometry(1, 1, 1);
  const batchHardware = () => {
    const replaced = new Map<THREE.BufferGeometry, THREE.BufferGeometry>();
    hardware.traverse(o => {
      if (!(o instanceof THREE.Mesh) || !o.geometry.index) return;
      const old = o.geometry;
      if (!replaced.has(old)) replaced.set(old, old.toNonIndexed());
      o.geometry = replaced.get(old)!;
    });
    replaced.forEach((_next, old) => old.dispose());
    batchOpeningMeshes(hardware);
  };
  const put = (x: number, y: number, z: number, w: number, h: number, d: number, m: THREE.Material) => {
    const mesh = new THREE.Mesh(box, m); mesh.position.set(x, y, z); mesh.scale.set(w, h, d); hardware.add(mesh); return mesh;
  };
  if (movement === 'vertical') {
    root.userData.mechanism = 'lift-carriage';
    for (const side of [-1, 1]) {
      put(side * 1.42, 0, .1, .22, 2.8, .35, shell);
      put(side * 1.42, 0, -.1, .08, 2.35, .08, dark);
      for (let i = 0; i < 6; i++) put(side * 1.42, -.95 + i * .38, -.15, .11, .04, .03, light);
      put(side * 1.42, 1.46, 0, .45, .2, .4, shell); put(side * 1.42, -1.46, 0, .45, .2, .4, shell);
    }
  } else if (movement === 'ellipse') {
    root.userData.mechanism = 'orbital-gimbal';
    const arc = new THREE.TorusGeometry(1.62, .10, 8, 64, Math.PI * 1.55);
    const gimbal = new THREE.Group(); gimbal.name = 'orbital-gimbal';
    const outer = new THREE.Mesh(arc, shell); outer.userData.animated = true; gimbal.add(outer);
    const trace = new THREE.Mesh(new THREE.TorusGeometry(1.62, .025, 6, 48, Math.PI * 1.2), light); trace.position.z = -.105; trace.userData.animated = true; gimbal.add(trace);
    for (const side of [-1, 1]) put(side * 1.8, 0, 0, .22, .58, .38, dark);
    // Added after batching so the counter-rotation remains independent.
    batchHardware(); hardware.add(gimbal);
    root.userData.updateMechanism = (time: number) => { gimbal.rotation.z = time * -.18; };
    return root;
  } else {
    root.userData.mechanism = 'lateral-thruster-yoke';
    for (const side of [-1, 1]) {
      put(side * 1.62, 0, .05, .8, .52, .45, shell);
      put(side * 1.75, 0, -.2, .45, .33, .12, dark);
      for (let i = 0; i < 4; i++) put(side * (1.55 + i * .12), 0, -.28, .04, .25, .025, light);
    }
  }
  batchHardware();
  return root;
}
