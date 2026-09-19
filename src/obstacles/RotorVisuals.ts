import * as THREE from 'three';

import type { EnvironmentId } from '../config/ChallengeConfig';
import { GAME_TUNING } from '../game/gameTuning';
import { disposeObject3D } from './RotorGeometry';

export function createRotorVisual(environment: EnvironmentId, bladeCount: number): THREE.Group {
  switch (environment) {
    case 'rooftop':
      return createRooftopTurbine(bladeCount);
    case 'space':
      return createSpaceEnergyRotor(bladeCount);
    default:
      return createWorkshopFan(bladeCount);
  }
}

export function replaceRotorVisual(
  parent: THREE.Group,
  previous: THREE.Group | null,
  environment: EnvironmentId,
  bladeCount: number,
): THREE.Group {
  if (previous) {
    parent.remove(previous);
    disposeObject3D(previous);
  }
  const next = createRotorVisual(environment, bladeCount);
  parent.add(next);
  return next;
}

function createWorkshopFan(bladeCount: number): THREE.Group {
  const group = new THREE.Group();
  const t = GAME_TUNING.rotor;

  group.add(
    new THREE.Mesh(
      new THREE.TorusGeometry(t.radius, t.ringThickness, 10, 48),
      new THREE.MeshLambertMaterial({ color: 0xb8c0c8 }),
    ),
  );

  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(t.hubRadius, t.hubRadius, t.bladeDepth * 2.2, 20),
    new THREE.MeshLambertMaterial({ color: 0xe6c35c }),
  );
  hub.rotation.x = Math.PI / 2;
  group.add(hub);

  addBlades(group, bladeCount, 0xd06a32, t.bladeWidth, t.bladeDepth);
  return group;
}

function createRooftopTurbine(bladeCount: number): THREE.Group {
  const group = new THREE.Group();
  const t = GAME_TUNING.rotor;

  group.add(
    new THREE.Mesh(
      new THREE.TorusGeometry(t.radius, t.ringThickness * 0.85, 8, 36),
      new THREE.MeshLambertMaterial({ color: 0xd8e4ee }),
    ),
  );

  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(t.hubRadius * 0.85, t.hubRadius * 1.05, t.bladeDepth * 2.8, 16),
    new THREE.MeshLambertMaterial({ color: 0x8aa0b3 }),
  );
  hub.rotation.x = Math.PI / 2;
  group.add(hub);

  addBlades(group, bladeCount, 0xf2f6fa, t.bladeWidth * 0.78, t.bladeDepth * 0.7);
  return group;
}

function createSpaceEnergyRotor(bladeCount: number): THREE.Group {
  const group = new THREE.Group();
  const t = GAME_TUNING.rotor;

  group.add(
    new THREE.Mesh(
      new THREE.TorusGeometry(t.radius, t.ringThickness * 0.7, 8, 40),
      new THREE.MeshPhongMaterial({
        color: 0x7ef0ff,
        emissive: 0x146a78,
        emissiveIntensity: 0.7,
      }),
    ),
  );

  group.add(
    new THREE.Mesh(
      new THREE.TorusGeometry(t.radius * 0.62, t.ringThickness * 0.45, 8, 32),
      new THREE.MeshPhongMaterial({
        color: 0xb48cff,
        emissive: 0x3a1878,
        emissiveIntensity: 0.55,
      }),
    ),
  );

  group.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(t.hubRadius * 0.92, 16, 12),
      new THREE.MeshPhongMaterial({
        color: 0xfff1a8,
        emissive: 0x887020,
        emissiveIntensity: 0.6,
      }),
    ),
  );

  addBlades(group, bladeCount, 0x9be7ff, t.bladeWidth * 0.45, t.bladeDepth * 0.55);
  return group;
}

function addBlades(
  group: THREE.Group,
  bladeCount: number,
  color: number,
  width: number,
  depth: number,
): void {
  const t = GAME_TUNING.rotor;
  const geometry = new THREE.BoxGeometry(t.bladeLength, width, depth);
  const material = new THREE.MeshLambertMaterial({ color });
  for (let i = 0; i < bladeCount; i += 1) {
    const blade = new THREE.Mesh(geometry, material);
    const angle = (i / bladeCount) * Math.PI * 2;
    const radius = t.hubRadius + t.bladeLength / 2;
    blade.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
    blade.rotation.z = angle;
    group.add(blade);
  }
}
