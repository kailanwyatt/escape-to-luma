import {createReadableBlocker} from './ReadableBlockerVisual';
import {createOrbitalGate, layoutOrbitalGate} from './OrbitalGateVisual';
import {createOrbitalIris, layoutOrbitalIris} from './OrbitalIrisVisual';
import { createAirborneGate, layoutAirborneGate } from './AirborneGateVisual';
import {createBreachVisual, layoutBreachVisual} from './BreachVisual';
import {createSecurityGate, layoutSecurityGate} from './SecurityGateVisual';
import { FacilityArtKit } from './FacilityArtKit';
import { IRIS_VISUAL_VARIANT } from './IrisVisualVariant';
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
  return createSecurityGate(environment);
}

export function layoutGateVisual(
  group: THREE.Group,
  openingX: number,
  openingY: number,
  openingWidth: number,
  openingHeight: number,
): void {
  if (group.userData.orbitalGate) { layoutOrbitalGate(group, openingX, openingY, openingWidth, openingHeight); return; }
  if (group.userData.securityGate) { layoutSecurityGate(group, openingX, openingY, openingWidth, openingHeight); return; }
  if (group.name === 'containment-glass') {
    layoutBreachVisual(group, openingX, openingY, openingWidth, openingHeight); return;
  }
  const t = GAME_TUNING.gate;
  const left = group.getObjectByName('left') as THREE.Object3D;
  const right = group.getObjectByName('right') as THREE.Object3D;
  const top = group.getObjectByName('top') as THREE.Object3D;
  const bottom = group.getObjectByName('bottom') as THREE.Object3D;
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
  if (IRIS_VISUAL_VARIANT === 'legacy') {
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

  const group = new THREE.Group();
  group.userData.cinematicIris = true;
  const kit = new FacilityArtKit({ cinematic: true });
  group.userData.kit = kit;
  const colors = palette(environment);
  const outer = GAME_TUNING.iris.outerRadius;
  const armor = kit.metal(colors.panel, 0.32);
  const steel = kit.metal(colors.accent, 0.28);
  const lamp = kit.lamp();
  lamp.color.setHex(colors.energy);
  lamp.emissive.setHex(colors.energy);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(outer, 0.12, 10, 48), steel);
  rim.name = 'rim';
  group.add(rim);
  const aperture = new THREE.Mesh(
    new THREE.TorusGeometry(1.4, 0.07, 10, 36),
    lamp,
  );
  aperture.name = 'aperture';
  group.add(aperture);
  for (let i = 0; i < 8; i += 1) {
    const petal = new THREE.Group();
    petal.name = `petal-${i}`;
    group.add(petal);
    // Trapezoid petal: wider at rim, narrow toward aperture — camera-iris silhouette.
    const shape = new THREE.Shape();
    shape.moveTo(-0.55, -0.14);
    shape.lineTo(0.55, -0.09);
    shape.lineTo(0.55, 0.09);
    shape.lineTo(-0.55, 0.14);
    shape.closePath();
    const petalBody = new THREE.Mesh(
      new THREE.ExtrudeGeometry(shape, { depth: 0.07, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.01, bevelSegments: 1 }),
      armor,
    );
    petalBody.name = 'petal-body';
    petalBody.position.z = -0.035;
    petal.add(petalBody);
    kit.box(petal, 'petal-edge', 0.95, 0.05, 0.025, 0.08, 0, -0.05, steel, 0.004);
    kit.box(petal, 'petal-lamp', 0.55, 0.07, 0.018, -0.12, 0, -0.055, lamp, 0.003);
  }
  const accent = new THREE.PointLight(colors.energy, 8, 8, 2);
  accent.name = 'iris-accent';
  accent.position.set(0, 0, -1.05);
  group.add(accent);
  return group;
}

export function layoutIrisVisual(group: THREE.Group, openingRadius: number): void {
  if (group.userData.orbitalIris) { layoutOrbitalIris(group, openingRadius); return; }
  const aperture = group.getObjectByName('aperture') as THREE.Mesh;
  aperture.scale.setScalar(Math.max(0.2, openingRadius));
  const outer = GAME_TUNING.iris.outerRadius;
  for (let i = 0; i < 8; i += 1) {
    const petal = group.getObjectByName(`petal-${i}`) as THREE.Object3D;
    const angle = (i / 8) * Math.PI * 2;
    const mid = (openingRadius + outer) / 2;
    petal.position.set(Math.cos(angle) * mid, Math.sin(angle) * mid, 0);
    petal.rotation.z = angle;
    petal.scale.setX(Math.max(0.25, (outer - openingRadius) / (outer - 0.4)));
  }
  const accent = group.getObjectByName('iris-accent') as THREE.PointLight | undefined;
  if (accent) {
    const open = (openingRadius - 0.6) / Math.max(0.01, outer - 0.6);
    accent.intensity = 7 + Math.max(0, Math.min(1, open)) * 5;
    accent.color.setHex(open > 0.65 ? 0x70e5ed : open < 0.35 ? 0xff7562 : 0xffb449);
  }
}

export function createPendulumVisual(environment: EnvironmentId): THREE.Group {
  const group = new THREE.Group();
  group.name = 'antenna-boom';
  const colors = palette(environment);
  const steel = new THREE.MeshStandardMaterial({ color: 0x8f9aa5, metalness: 0.65, roughness: 0.35 });
  const armor = new THREE.MeshStandardMaterial({ color: 0x3a4a58, metalness: 0.7, roughness: 0.4 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1a242e, metalness: 0.55, roughness: 0.55 });

  // Fixed hull mount — boom hangs from this so it never reads as floating.
  const mount = new THREE.Group();
  mount.name = 'boom-mount';
  const hull = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.55, 0.28), dark);
  hull.name = 'mount-hull';
  hull.position.set(0, 0.42, 0.22);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.85, 10), armor);
  mast.name = 'mount-mast';
  mast.position.set(0, 0.75, 0.08);
  const clamp = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.22, 0.36), steel);
  clamp.name = 'mount-clamp';
  clamp.position.set(0, 0.12, 0.06);
  const bracketL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.4, 0.18), armor);
  bracketL.name = 'mount-bracket-l';
  bracketL.position.set(-0.38, 0.28, 0.14);
  const bracketR = bracketL.clone();
  bracketR.name = 'mount-bracket-r';
  bracketR.position.x = 0.38;
  const stayL = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.7, 6), steel);
  stayL.name = 'mount-stay-l';
  stayL.position.set(-0.55, 0.55, 0.1);
  stayL.rotation.z = 0.45;
  const stayR = stayL.clone();
  stayR.name = 'mount-stay-r';
  stayR.position.x = 0.55;
  stayR.rotation.z = -0.45;
  mount.add(hull, mast, clamp, bracketL, bracketR, stayL, stayR);

  const pivot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.2, 0.22, 10),
    armor,
  );
  pivot.name = 'pivot';
  pivot.rotation.x = Math.PI / 2;
  const arm = new THREE.Mesh(
    new THREE.CylinderGeometry(GAME_TUNING.pendulum.armRadius * 1.15, GAME_TUNING.pendulum.armRadius * 0.85, 1, 10),
    steel,
  );
  arm.name = 'arm';
  const tip = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 12, 10),
    new THREE.MeshStandardMaterial({
      color: colors.accent,
      emissive: colors.accent,
      emissiveIntensity: 0.55,
      metalness: 0.2,
      roughness: 0.35,
    }),
  );
  tip.name = 'antenna-tip';
  const blocker = createReadableBlocker('weight');
  blocker.name = 'blocker';
  group.add(mount, pivot, arm, tip, blocker);
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
  const mount = group.getObjectByName('boom-mount') as THREE.Group | undefined;
  const pivot = group.getObjectByName('pivot') as THREE.Mesh;
  const arm = group.getObjectByName('arm') as THREE.Mesh;
  const tip = group.getObjectByName('antenna-tip') as THREE.Mesh | undefined;
  const blocker = group.getObjectByName('blocker') as THREE.Mesh;
  if (mount) {
    mount.position.set(pivotX, pivotY, 0);
  }
  pivot.position.set(pivotX, pivotY, 0);
  blocker.position.set(blockerX, blockerY, 0);
  blocker.scale.setScalar(blockerRadius);
  arm.position.set((pivotX + blockerX) / 2, (pivotY + blockerY) / 2, 0);
  arm.scale.set(1, length, 1);
  arm.rotation.z = Math.atan2(blockerX - pivotX, pivotY - blockerY);
  if (tip) {
    tip.position.set(blockerX, blockerY, -0.08);
    tip.scale.setScalar(Math.max(0.8, blockerRadius * 0.55));
  }
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
    const kit = previous.userData.kit as { dispose?: () => void } | undefined;
    kit?.dispose?.();
    parent.remove(previous);
    disposeObject3D(previous);
  }
  parent.add(next);
  return next;
}
