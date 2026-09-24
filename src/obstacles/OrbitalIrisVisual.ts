import * as THREE from 'three';
import { GAME_TUNING } from '../game/gameTuning';
import { FacilityArtKit } from './FacilityArtKit';
import { IRIS_VISUAL_VARIANT } from './IrisVisualVariant';

/** Legacy Phong orbital iris. */
function createOrbitalIrisLegacy(): THREE.Group {
  const root = new THREE.Group();
  root.userData.orbitalIris = true;
  const outer = GAME_TUNING.iris.outerRadius;
  const steel = new THREE.MeshPhongMaterial({ color: 0x536b83, shininess: 65, side: THREE.DoubleSide });
  const alternate = new THREE.MeshPhongMaterial({ color: 0x344d65, shininess: 75, side: THREE.DoubleSide });
  const dark = new THREE.MeshPhongMaterial({ color: 0x152739, shininess: 70 });
  const metal = new THREE.MeshPhongMaterial({ color: 0x97adbf, shininess: 95 });
  const amber = new THREE.MeshBasicMaterial({ color: 0xf0b657 });
  const cyan = new THREE.MeshBasicMaterial({ color: 0x92e8f2 });
  const ring = (r: number, tube: number, m: THREE.Material, z: number) => {
    const o = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 8, 96), m);
    o.position.z = z;
    root.add(o);
    return o;
  };
  ring(outer, 0.15, dark, 0.04);
  ring(outer + 0.05, 0.035, metal, -0.105);
  const aperture = new THREE.Mesh(
    new THREE.RingGeometry(1, 1.022, 96),
    new THREE.MeshBasicMaterial({ color: 0x92e8f2, side: THREE.DoubleSide }),
  );
  aperture.name = 'aperture';
  aperture.position.z = -0.065;
  root.add(aperture);
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const petal = new THREE.Mesh(
      new THREE.RingGeometry(0.5, outer, 12, 1, angle, Math.PI / 4 + 0.003),
      i % 2 ? steel : alternate,
    );
    petal.name = `petal-${i}`;
    (petal.geometry.attributes.position as THREE.BufferAttribute).setUsage(THREE.DynamicDrawUsage);
    petal.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), outer + 0.1);
    root.add(petal);
    const clamp = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.38, 0.28), metal);
    clamp.position.set(Math.cos(angle) * outer, Math.sin(angle) * outer, -0.03);
    clamp.rotation.z = angle;
    root.add(clamp);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.24, 0.025), amber);
    lamp.position.set(clamp.position.x, clamp.position.y, -0.19);
    lamp.rotation.z = angle;
    root.add(lamp);
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.035, 8), dark);
    bolt.rotation.x = Math.PI / 2;
    bolt.position.set(Math.cos(angle + 0.065) * outer, Math.sin(angle + 0.065) * outer, -0.15);
    root.add(bolt);
  }
  ring(outer - 0.1, 0.018, cyan, -0.13);
  layoutOrbitalIris(root, 1.4);
  return root;
}

/** Cinematic airlock iris — FacilityArtKit metals; petals still sample layoutOrbitalIris. */
function createOrbitalIrisCinematic(): THREE.Group {
  const root = new THREE.Group();
  root.userData.orbitalIris = true;
  root.userData.cinematicIris = true;
  const kit = new FacilityArtKit({ cinematic: true });
  root.userData.kit = kit;
  const outer = GAME_TUNING.iris.outerRadius;
  const steel = kit.metal(0x536b83, 0.32);
  const alternate = kit.metal(0x344d65, 0.28);
  const dark = kit.metal(0x152739, 0.55, false);
  const metal = kit.metal(0x97adbf, 0.2);
  const lamp = kit.lamp();
  const cyan = kit.lampCore();
  cyan.color.setHex(0x92e8f2);
  cyan.emissive.setHex(0x4aa7c9);

  const ring = (r: number, tube: number, m: THREE.Material, z: number) => {
    const o = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 10, 96), m);
    o.position.z = z;
    root.add(o);
    return o;
  };
  ring(outer, 0.15, dark, 0.04);
  ring(outer + 0.05, 0.035, metal, -0.105);

  const aperture = new THREE.Mesh(
    new THREE.RingGeometry(1, 1.022, 96),
    new THREE.MeshStandardMaterial({
      color: 0x92e8f2,
      emissive: 0x4aa7c9,
      emissiveIntensity: 0.7,
      metalness: 0.1,
      roughness: 0.3,
      side: THREE.DoubleSide,
    }),
  );
  aperture.name = 'aperture';
  aperture.position.z = -0.065;
  root.add(aperture);

  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const petal = new THREE.Mesh(
      new THREE.RingGeometry(0.5, outer, 12, 1, angle, Math.PI / 4 + 0.003),
      i % 2 ? steel : alternate,
    );
    petal.name = `petal-${i}`;
    (petal.geometry.attributes.position as THREE.BufferAttribute).setUsage(THREE.DynamicDrawUsage);
    petal.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), outer + 0.1);
    root.add(petal);
    kit.box(
      root,
      `clamp-${i}`,
      0.3,
      0.38,
      0.28,
      Math.cos(angle) * outer,
      Math.sin(angle) * outer,
      -0.03,
      metal,
      0.02,
    );
    const clamp = root.getObjectByName(`clamp-${i}`)!;
    clamp.rotation.z = angle;
    kit.box(
      root,
      `iris-lamp-${i}`,
      0.12,
      0.24,
      0.025,
      Math.cos(angle) * outer,
      Math.sin(angle) * outer,
      -0.19,
      lamp,
      0.004,
    );
    root.getObjectByName(`iris-lamp-${i}`)!.rotation.z = angle;
  }
  ring(outer - 0.1, 0.018, cyan, -0.13);

  const accent = new THREE.PointLight(0xf0b657, 9, 9, 2);
  accent.name = 'iris-accent';
  accent.position.set(0, 0, -1.05);
  root.add(accent);

  layoutOrbitalIris(root, 1.4);
  return root;
}

/** A pressure shutter with a continuous safe opening. Animation never owns collision. */
export function createOrbitalIris(): THREE.Group {
  return IRIS_VISUAL_VARIANT === 'legacy' ? createOrbitalIrisLegacy() : createOrbitalIrisCinematic();
}

export function layoutOrbitalIris(root: THREE.Group, radius: number): void {
  root.getObjectByName('aperture')!.scale.setScalar(radius);
  for (let i = 0; i < 8; i++) {
    const petal = root.getObjectByName(`petal-${i}`) as THREE.Mesh;
    const positions = petal.geometry.attributes.position as THREE.BufferAttribute;
    for (let row = 0; row < 2; row++)
      for (let step = 0; step <= 12; step++) {
        const a = (i * Math.PI) / 4 + ((Math.PI / 4 + 0.003) * step) / 12;
        const r = row === 0 ? radius : GAME_TUNING.iris.outerRadius;
        positions.setXYZ(row * 13 + step, Math.cos(a) * r, Math.sin(a) * r, -0.025);
      }
    positions.needsUpdate = true;
  }
  const accent = root.getObjectByName('iris-accent') as THREE.PointLight | undefined;
  if (accent) {
    const open = (radius - 0.6) / Math.max(0.01, GAME_TUNING.iris.outerRadius - 0.6);
    accent.intensity = 7 + Math.max(0, Math.min(1, open)) * 5;
    accent.color.setHex(open > 0.65 ? 0x70e5ed : open < 0.35 ? 0xff7562 : 0xffb449);
  }
}
