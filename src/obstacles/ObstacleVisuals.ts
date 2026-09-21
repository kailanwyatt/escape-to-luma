import {createReadableBlocker} from './ReadableBlockerVisual';
import {createOrbitalGate, layoutOrbitalGate} from './OrbitalGateVisual';
import {createOrbitalIris, layoutOrbitalIris} from './OrbitalIrisVisual';
import { createAirborneGate, layoutAirborneGate } from './AirborneGateVisual';
import {createBreachVisual, layoutBreachVisual} from './BreachVisual';
import { containmentMetal } from '../graphics/ContainmentMaterials';
import * as THREE from 'three';

import type { EnvironmentId } from '../config/ChallengeConfig';
import { GAME_TUNING } from '../game/gameTuning';
import { disposeObject3D } from './RotorGeometry';

function palette(environment: EnvironmentId) {
  switch (environment) {
    case 'rooftop':
      return { panel: 0xc5d4e0, accent: 0x8aa0b3, energy: 0xd8e4ee };
    case 'space':
      return { panel: 0x1c2740, accent: 0x6cf0ff, energy: 0x7a5cff };
    default:
      return { panel: 0x8d9096, accent: 0xd06a32, energy: 0xe6c35c };
  }
}


export function createGateVisual(
  environment: EnvironmentId,
  appearance: 'standard' | 'containmentGlass' = 'standard',
): THREE.Group {
  if (appearance === 'containmentGlass') return createBreachVisual();
  if (environment === 'space') return createOrbitalGate();
  const group = new THREE.Group();
  const colors = palette(environment);
  const t = GAME_TUNING.gate;
  const depth = 0.12;
  const panelMaterial = containmentMetal();
  const edgeMaterial = containmentMetal();
  const left = new THREE.Mesh(
    new THREE.BoxGeometry(1, t.panelHeight, depth),
    panelMaterial,
  );
  left.name = 'left';
  const right = left.clone();
  right.name = 'right';
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(t.panelWidth, 1, depth),
    edgeMaterial,
  );
  top.name = 'top';
  const bottom = top.clone();
  bottom.name = 'bottom';
  {
    const borderMaterial = new THREE.MeshBasicMaterial({ color: 0x8bdde7 });
    for (const name of ['edgeLeft', 'edgeRight', 'edgeTop', 'edgeBottom']) {
      const edge = new THREE.Mesh(new THREE.BoxGeometry(1, 1, .025), borderMaterial);
      edge.name = name; group.add(edge);
    }

  }
  group.add(left, right, top, bottom);
  return group;
}

export function layoutGateVisual(
  group: THREE.Group,
  openingX: number,
  openingY: number,
  openingWidth: number,
  openingHeight: number,
): void {
  if (group.userData.orbitalGate) { layoutOrbitalGate(group, openingX, openingY, openingWidth, openingHeight); return; }
  if (group.name === 'containment-glass') {
    layoutBreachVisual(group, openingX, openingY, openingWidth, openingHeight); return;
  }
  const t = GAME_TUNING.gate;
  const left = group.getObjectByName('left') as THREE.Mesh;
  const right = group.getObjectByName('right') as THREE.Mesh;
  const top = group.getObjectByName('top') as THREE.Mesh;
  const bottom = group.getObjectByName('bottom') as THREE.Mesh;
  const leftWidth = Math.max(0.2, openingX - openingWidth / 2 + t.panelWidth / 2);
  const rightWidth = Math.max(0.2, t.panelWidth / 2 - (openingX + openingWidth / 2));
  left.scale.set(leftWidth, 1, 1);
  left.position.set(openingX - openingWidth / 2 - leftWidth / 2, openingY, 0);
  right.scale.set(rightWidth, 1, 1);
  right.position.set(openingX + openingWidth / 2 + rightWidth / 2, openingY, 0);
  const topHeight = Math.max(0.2, t.panelHeight / 2 - (openingY + openingHeight / 2 - t.baseY));
  const bottomHeight = Math.max(0.2, openingY - openingHeight / 2 - (t.baseY - t.panelHeight / 2));
  top.scale.set(1, topHeight, 1);
  top.position.set(0, openingY + openingHeight / 2 + topHeight / 2, 0);
  bottom.scale.set(1, bottomHeight, 1);
  bottom.position.set(0, openingY - openingHeight / 2 - bottomHeight / 2, 0);

  const border = .025;
  for (const [name, x, y, w, h] of [
    ['edgeLeft', openingX - openingWidth / 2 - border / 2, openingY, border, openingHeight],
    ['edgeRight', openingX + openingWidth / 2 + border / 2, openingY, border, openingHeight],
    ['edgeTop', openingX, openingY + openingHeight / 2 + border / 2, openingWidth + border * 2, border],
    ['edgeBottom', openingX, openingY - openingHeight / 2 - border / 2, openingWidth + border * 2, border],
  ] as const) {
    const edge = group.getObjectByName(name);
    if (edge) { edge.position.set(x, y, -.085); edge.scale.set(w, h, 1); }
  }

}

export function createIrisVisual(environment: EnvironmentId): THREE.Group {
  if (environment === 'space') return createOrbitalIris();
  const group = new THREE.Group();
  const colors = palette(environment);
  const outer = GAME_TUNING.iris.outerRadius;
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(outer, 0.1, 8, 32),
    new THREE.MeshLambertMaterial({
      color: colors.accent,
      emissive: 0x000000,
      emissiveIntensity: 0,
    }),
  );
  rim.name = 'rim';
  group.add(rim);
  const aperture = new THREE.Mesh(
    new THREE.TorusGeometry(1.4, 0.07, 8, 28),
    new THREE.MeshLambertMaterial({ color: colors.energy }),
  );
  aperture.name = 'aperture';
  group.add(aperture);
  for (let i = 0; i < 8; i += 1) {
    const petal = new THREE.Mesh(
      new THREE.BoxGeometry(outer - 0.4, 0.22, 0.06),
      new THREE.MeshLambertMaterial({ color: colors.panel }),
    );
    petal.name = `petal-${i}`;
    group.add(petal);
  }
  return group;
}

export function layoutIrisVisual(group: THREE.Group, openingRadius: number): void {
  if (group.userData.orbitalIris) { layoutOrbitalIris(group, openingRadius); return; }
  const aperture = group.getObjectByName('aperture') as THREE.Mesh;
  aperture.scale.setScalar(Math.max(0.2, openingRadius));
  const outer = GAME_TUNING.iris.outerRadius;
  for (let i = 0; i < 8; i += 1) {
    const petal = group.getObjectByName(`petal-${i}`) as THREE.Mesh;
    const angle = (i / 8) * Math.PI * 2;
    const mid = (openingRadius + outer) / 2;
    petal.position.set(Math.cos(angle) * mid, Math.sin(angle) * mid, 0);
    petal.rotation.z = angle;
    petal.scale.setX(Math.max(0.25, (outer - openingRadius) / (outer - 0.4)));
  }
}

export function createPendulumVisual(environment: EnvironmentId): THREE.Group {
  const group = new THREE.Group();
  const colors = palette(environment);
  const pivot = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 12, 10),
    new THREE.MeshLambertMaterial({ color: colors.accent }),
  );
  pivot.name = 'pivot';
  const arm = new THREE.Mesh(
    new THREE.CylinderGeometry(GAME_TUNING.pendulum.armRadius, GAME_TUNING.pendulum.armRadius, 1, 8),
    new THREE.MeshLambertMaterial({
      color: 0x8f9aa5,
      emissive: 0x000000,
    }),
  );
  arm.name = 'arm';
  const blocker = createReadableBlocker('weight');
  blocker.name = 'blocker';
  group.add(pivot, arm, blocker);
  return group;
}

export function layoutPendulumVisual(
  group: THREE.Group,
  pivotX: number,
  pivotY: number,
  blockerX: number,
  blockerY: number,
  blockerRadius: number,
  length: number,
): void {
  const pivot = group.getObjectByName('pivot') as THREE.Mesh;
  const arm = group.getObjectByName('arm') as THREE.Mesh;
  const blocker = group.getObjectByName('blocker') as THREE.Mesh;
  pivot.position.set(pivotX, pivotY, 0);
  blocker.position.set(blockerX, blockerY, 0);
  blocker.scale.setScalar(blockerRadius);
  arm.position.set((pivotX + blockerX) / 2, (pivotY + blockerY) / 2, 0);
  arm.scale.set(1, length, 1);
  arm.rotation.z = Math.atan2(blockerX - pivotX, pivotY - blockerY);
}

export function createRingVisual(environment: EnvironmentId): THREE.Group {
  return createAirborneGate(environment);
}

export function layoutRingVisual(group: THREE.Group, radius: number): void {
  layoutAirborneGate(group, radius);
}

export function replaceVisual(
  parent: THREE.Group,
  previous: THREE.Group | null,
  next: THREE.Group,
): THREE.Group {
  if (previous) {
    parent.remove(previous);
    disposeObject3D(previous);
  }
  parent.add(next);
  return next;
}
