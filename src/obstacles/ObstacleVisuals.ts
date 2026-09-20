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
  const group = new THREE.Group();
  const colors = palette(environment);
  const t = GAME_TUNING.gate;
  const depth = 0.12;
  const glass = appearance === 'containmentGlass';
  const panelMaterial = glass
    ? new THREE.MeshPhongMaterial({
        color: 0x7de7ff,
        emissive: 0x0b6688,
        emissiveIntensity: 0.28,
        transparent: true,
        opacity: 0.34,
        shininess: 100,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    : new THREE.MeshLambertMaterial({ color: colors.panel });
  const edgeMaterial = glass
    ? panelMaterial
    : new THREE.MeshLambertMaterial({ color: colors.accent });
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
  if (environment === 'space' && !glass) {
    for (const mesh of [left, right, top, bottom]) {
      (mesh.material as THREE.MeshLambertMaterial).emissive = new THREE.Color(colors.energy);
      (mesh.material as THREE.MeshLambertMaterial).emissiveIntensity = 0.25;
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
}

export function createIrisVisual(environment: EnvironmentId): THREE.Group {
  const group = new THREE.Group();
  const colors = palette(environment);
  const outer = GAME_TUNING.iris.outerRadius;
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(outer, 0.1, 8, 32),
    new THREE.MeshLambertMaterial({
      color: colors.accent,
      emissive: environment === 'space' ? colors.energy : 0x000000,
      emissiveIntensity: environment === 'space' ? 0.4 : 0,
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
      color: environment === 'space' ? colors.energy : colors.panel,
      emissive: environment === 'space' ? colors.energy : 0x000000,
      emissiveIntensity: environment === 'space' ? 0.35 : 0,
    }),
  );
  arm.name = 'arm';
  const blocker = new THREE.Mesh(
    environment === 'rooftop'
      ? new THREE.BoxGeometry(0.7, 0.7, 0.28)
      : new THREE.SphereGeometry(0.4, 14, 12),
    new THREE.MeshLambertMaterial({ color: colors.accent }),
  );
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
  blocker.scale.setScalar(blockerRadius / 0.4);
  arm.position.set((pivotX + blockerX) / 2, (pivotY + blockerY) / 2, 0);
  arm.scale.set(1, length, 1);
  arm.rotation.z = Math.atan2(blockerX - pivotX, pivotY - blockerY);
}

export function createRingVisual(environment: EnvironmentId): THREE.Group {
  const group = new THREE.Group();
  const colors = palette(environment);
  const barrier = new THREE.Mesh(
    new THREE.RingGeometry(1, GAME_TUNING.ring.outerRadius, 32),
    new THREE.MeshLambertMaterial({
      color: colors.panel,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: environment === 'space' ? 0.45 : 0.72,
      emissive: environment === 'space' ? colors.energy : 0x000000,
      emissiveIntensity: environment === 'space' ? 0.3 : 0,
    }),
  );
  barrier.name = 'barrier';
  const hoop = new THREE.Mesh(
    new THREE.TorusGeometry(1, 0.1, 8, 32),
    new THREE.MeshLambertMaterial({ color: colors.accent }),
  );
  hoop.name = 'hoop';
  group.add(barrier, hoop);
  return group;
}

export function layoutRingVisual(group: THREE.Group, radius: number): void {
  const hoop = group.getObjectByName('hoop') as THREE.Mesh;
  const barrier = group.getObjectByName('barrier') as THREE.Mesh;
  hoop.scale.setScalar(radius);
  barrier.scale.setScalar(1);
  barrier.geometry.dispose();
  barrier.geometry = new THREE.RingGeometry(radius, GAME_TUNING.ring.outerRadius, 32);
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
