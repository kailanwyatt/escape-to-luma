import type { RotorVisualVariant } from '../config/RotorConfig';
import { createVariantRotor } from './RotorVariantVisual';
import * as THREE from 'three';

import type { EnvironmentId } from '../config/ChallengeConfig';
import { GAME_TUNING } from '../game/gameTuning';
import { disposeObject3D } from './RotorGeometry';
import { FacilityArtKit } from './FacilityArtKit';

/** Ring-driven security sweep: all solid detailing stays within the collision silhouette. */
export function defaultRotorVariant(environment: EnvironmentId): RotorVisualVariant {
  return environment === 'rooftop' ? 'cityVentilation' : environment === 'space' ? 'atmosphereAntenna' : 'containmentSecurity';
}

export function createRotorVisual(environment: EnvironmentId, bladeCount: number, variant = defaultRotorVariant(environment)): THREE.Group {
  if (variant !== 'containmentSecurity') return createVariantRotor(variant, bladeCount);
  const group = new THREE.Group();
  const kit = new FacilityArtKit({ cinematic: true });
  group.userData.kit = kit;
  const housing = new THREE.Group();
  housing.name = 'stationary-housing';
  group.add(housing);
  const t = GAME_TUNING.rotor;
  const metal = kit.metal(environment === 'rooftop' ? 0x627686 : 0x334859, 0.32);
  const dark = kit.metal(0x101c29, 0.55, false);
  const silver = kit.metal(0xb3cad4, 0.2);
  const warning = kit.lamp();
  warning.color.setHex(0xffb83e);
  warning.emissive.setHex(0xff650a);
  warning.emissiveIntensity = 0.55;
  const light = kit.lampCore();
  light.color.setHex(environment === 'space' ? 0xa5a4ff : 0x77ebff);
  light.emissive.setHex(environment === 'space' ? 0x6a69cc : 0x4aa7c9);
  const bolt = new THREE.CylinderGeometry(0.018, 0.018, 0.012, 6);
  const unit = new THREE.BoxGeometry(1, 1, 1);
  const addBox = (parent: THREE.Group, material: THREE.Material, x: number, y: number, z: number, w: number, h: number, d: number) => {
    const mesh = new THREE.Mesh(unit, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(w, h, d);
    parent.add(mesh);
    return mesh;
  };
  const casing = new THREE.Shape();
  casing.absarc(0, 0, t.radius + t.ringThickness, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, t.radius - t.ringThickness, 0, Math.PI * 2, true);
  casing.holes.push(hole);
  const frame = new THREE.Mesh(new THREE.ExtrudeGeometry(casing, { depth: 0.24, bevelEnabled: false, curveSegments: 48 }), metal);
  frame.position.z = -0.12;
  housing.add(frame);
  for (const radius of [t.radius - 0.09, t.radius + 0.09]) {
    const lip = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.022, 8, 64), silver);
    lip.position.z = -0.13;
    housing.add(lip);
  }
  const raceway = new THREE.Mesh(new THREE.TorusGeometry(t.radius, 0.033, 8, 64), dark);
  raceway.position.z = -0.128;
  housing.add(raceway);
  for (let i = 0; i < 12; i += 1) {
    const a = (i * Math.PI) / 6;
    const plate = new THREE.Group();
    plate.position.set(Math.cos(a) * t.radius, Math.sin(a) * t.radius, -0.15);
    plate.rotation.z = a;
    housing.add(plate);
    addBox(plate, dark, 0, 0, 0, 0.15, 0.11, 0.025);
    addBox(plate, i % 3 === 0 ? warning : light, 0, 0, -0.017, 0.075, 0.055, 0.012);
  }
  const cylinder = (radius: number, depth: number, z: number, material: THREE.Material) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, depth, 24), material);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.z = z;
    group.add(mesh);
  };
  cylinder(t.hubRadius, 0.32, 0, dark);
  cylinder(t.hubRadius * 0.94, 0.07, -0.17, silver);
  cylinder(t.hubRadius * 0.72, 0.08, -0.21, metal);
  cylinder(t.hubRadius * 0.27, 0.015, -0.257, dark);
  for (let i = 0; i < bladeCount; i += 1) {
    const arm = new THREE.Group();
    arm.name = 'security-arm';
    arm.rotation.z = (i / bladeCount) * Math.PI * 2;
    group.add(arm);
    const center = t.hubRadius + t.bladeLength / 2;
    const body = addBox(arm, metal, center, 0, 0, t.bladeLength, t.bladeWidth, t.bladeDepth);
    body.name = 'collision-arm';
    // Leading / trailing bevels stay inside bladeWidth — fan silhouette, not a flat slab.
    addBox(arm, dark, center, -t.bladeWidth * 0.38, -0.04, t.bladeLength - 0.08, 0.035, t.bladeDepth * 0.7);
    addBox(arm, silver, center, t.bladeWidth * 0.38, -0.05, t.bladeLength - 0.1, 0.028, 0.04);
    addBox(arm, dark, center, 0, -0.078, t.bladeLength - 0.12, 0.15, 0.012);
    // Tip chevron reads as a shutter paddle end without extending past bladeLength.
    const tipX = t.hubRadius + t.bladeLength - 0.08;
    addBox(arm, dark, tipX, 0, 0.02, 0.14, t.bladeWidth * 0.92, t.bladeDepth * 0.85);
    addBox(arm, light, tipX, 0, -0.085, 0.05, 0.14, 0.012);
    addBox(arm, warning, tipX - 0.12, 0, -0.09, 0.1, t.bladeWidth * 0.7, 0.014);
    for (let j = 0; j < 7; j += 1) {
      const x = t.hubRadius + 0.15 + j * 0.22;
      addBox(arm, warning, x, 0, -0.09, 0.13, 0.095, 0.015);
    }
    for (const y of [-0.103, 0.103]) {
      addBox(arm, silver, center, y, -0.077, t.bladeLength - 0.035, 0.024, 0.015);
    }
    for (const x of [t.hubRadius + 0.055, t.hubRadius + t.bladeLength - 0.05]) {
      const fastener = new THREE.Mesh(bolt, silver);
      fastener.position.set(x, 0, -0.099);
      fastener.rotation.x = Math.PI / 2;
      arm.add(fastener);
    }
  }
  const accent = new THREE.PointLight(0xffb83e, 8, 8, 2);
  accent.name = 'rotor-accent';
  accent.position.set(0, 0, -1.1);
  group.add(accent);
  return group;
}

/** Parent rotation remains authoritative for collision and prediction. */
export function syncRotorHousing(visual: THREE.Group | null, angle: number): void {
  const housing = visual?.children[0];
  if (housing) housing.rotation.z = -angle;
}

export function replaceRotorVisual(
  parent: THREE.Group,
  previous: THREE.Group | null,
  environment: EnvironmentId,
  bladeCount: number,
  variant?: RotorVisualVariant,
): THREE.Group {
  if (previous) {
    const kit = previous.userData.kit as { dispose?: () => void } | undefined;
    kit?.dispose?.();
    parent.remove(previous);
    disposeObject3D(previous);
  }
  const next = createRotorVisual(environment, bladeCount, variant);
  parent.add(next);
  return next;
}
