import * as THREE from 'three';
import type { SlidingGateConfig } from '../config/ObstacleConfig';
import { GAME_TUNING } from '../game/gameTuning';
import { FacilityArtKit } from './FacilityArtKit';
import { gateStateAtTime } from './RapidShutterState';
import { RAPID_SHUTTER_VISUAL_VARIANT } from './RapidShutterVisualVariant';
import {
  createRapidShutter as createRapidShutterV1,
  layoutRapidShutter as layoutRapidShutterV1,
} from './legacy/RapidShutterVisualV1';

const FLOOR_Y = GAME_TUNING.projectile.floorY;

/** Cinematic rapid security shutter — FacilityArtKit metals + status lamps. */
function createRapidShutterCinematic(c: SlidingGateConfig): THREE.Group {
  const root = new THREE.Group();
  root.name = 'rapid-security-shutter';
  const kit = new FacilityArtKit({ cinematic: true });
  root.userData.kit = kit;

  const vertical = c.shutter?.orientation === 'vertical';
  const span = c.shutter?.maxOpeningWidth ?? (vertical ? c.openingHeight : c.openingWidth);
  const height = vertical ? c.openingWidth : c.openingHeight;
  const baseX = c.baseX;
  const baseY = c.baseY ?? 3;
  const armor = kit.metal(0x455868, 0.3);
  const steel = kit.metal(0xb0c0cb, 0.22);
  const dark = kit.metal(0x0c141c, 0.62, false);
  const lamp = kit.lamp();
  lamp.color.setHex(0x68e7ff);
  lamp.emissive.setHex(0x68e7ff);

  const box = (
    parent: THREE.Object3D,
    m: THREE.Material,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    name = '',
    bevel = 0.02,
  ) => kit.box(parent as THREE.Group, name || 'part', w, h, d, x, y, z, m, bevel);

  const assembly = new THREE.Group();
  assembly.name = 'ShutterAssembly';
  assembly.position.set(baseX, baseY, 0);
  assembly.rotation.z = vertical ? Math.PI / 2 : 0;
  root.add(assembly);

  const housing = new THREE.Group();
  housing.name = 'FixedHousing';
  assembly.add(housing);
  for (const sign of [-1, 1]) {
    box(housing, armor, sign * (span * 0.75 + 0.12), 0, -0.02, span * 0.5 + 0.28, height + 0.5, 0.62, `housing-${sign}`, 0.04);
    box(housing, steel, sign * (span / 2 + 0.1), 0, -0.38, 0.1, height + 0.58, 0.12, `housing-trim-${sign}`, 0.006);
    box(housing, lamp, sign * (span / 2 + 0.18), 0, -0.4, 0.048, height * 0.62, 0.028, `housing-lamp-${sign}`, 0.004);
    box(housing, dark, sign * (span / 2 + 0.34), height / 2 + 0.14, -0.18, 0.36, 0.24, 0.42, `housing-cap-${sign}`, 0);
  }
  for (const sign of [-1, 1]) {
    box(housing, dark, 0, sign * (height / 2 + 0.2), 0.02, span * 2 + 0.5, 0.36, 0.58, `header-${sign}`, 0);
    box(housing, steel, 0, sign * (height / 2 + 0.08), -0.3, span * 2 + 0.38, 0.06, 0.04, `header-lip-${sign}`, 0.004);
  }

  for (const [i, sign] of [-1, 1].entries()) {
    const panel = new THREE.Group();
    panel.name = i === 0 ? 'ShutterLeft' : 'ShutterRight';
    assembly.add(panel);
    box(panel, dark, 0, 0, 0.12, span / 2, height, 0.42, `panel-body-${i}`, 0);
    box(panel, armor, 0, 0, 0.14, span / 2, height, 0.46, `panel-armor-${i}`, 0.04);
    for (const y of [-0.32, 0, 0.32]) {
      box(panel, dark, 0, y * height, -0.08, span * 0.34, height * 0.06, 0.04, `panel-slat-${i}`, 0.01);
    }
    box(panel, lamp, -sign * (span / 4 - 0.04), 0, -0.16, 0.04, height * 0.9, 0.022, `panel-lamp-${i}`, 0.003);
    const arrow = new THREE.Group();
    arrow.name = 'DirectionArrow';
    panel.add(arrow);
    for (const n of [0, 1]) {
      for (const slope of [-1, 1]) {
        const bar = box(arrow, lamp, n * 0.11 - 0.055, slope * 0.07, -0.05, 0.035, 0.2, 0.018, `arrow-${i}`, 0.002);
        bar.rotation.z = slope * 0.55;
      }
    }
  }

  const mount = new THREE.Group();
  mount.name = 'GroundMount';
  root.add(mount);
  const trackWidth = span * 2 + 0.55;
  const openingBottom = baseY - height / 2;
  const sillTop = Math.max(FLOOR_Y + 0.08, Math.min(openingBottom - 0.04, FLOOR_Y + 0.55));
  const sillHeight = Math.max(0.12, sillTop - FLOOR_Y);
  const sillY = FLOOR_Y + sillHeight / 2;
  if (!vertical) {
    box(mount, dark, baseX, sillY, 0.16, trackWidth, sillHeight, 0.55, 'floor-sill', 0);
    box(mount, steel, baseX, sillTop - 0.02, -0.18, trackWidth * 0.92, 0.05, 0.09, 'sill-lip', 0.005);
    box(mount, armor, baseX, FLOOR_Y + 0.04, -0.05, trackWidth * 0.88, 0.045, 0.36, 'floor-track', 0.004);
    for (const sign of [-1, 1]) {
      const jambX = baseX + sign * (span / 2 + 0.22);
      const jambTop = baseY + height / 2 + 0.3;
      const jambHeight = Math.max(0.4, jambTop - FLOOR_Y);
      box(mount, armor, jambX, FLOOR_Y + jambHeight / 2, 0.04, 0.34, jambHeight, 0.52, `floor-jamb-${sign < 0 ? 'left' : 'right'}`, 0.04);
      box(mount, steel, jambX, FLOOR_Y + jambHeight / 2, -0.28, 0.09, jambHeight * 0.92, 0.11, '', 0.005);
      box(mount, dark, jambX, FLOOR_Y + 0.1, -0.06, 0.4, 0.18, 0.46, '', 0);
    }
    const underGap = Math.max(0.08, openingBottom - sillTop);
    if (underGap > 0.12) {
      for (const sign of [-1, 0, 1]) {
        box(mount, dark, baseX + sign * span * 0.55, sillTop + underGap / 2, 0.1, 0.16, underGap, 0.24, `under-post-${sign}`, 0);
      }
    }
  } else {
    for (const sign of [-1, 1]) {
      const towerX = baseX + sign * (height / 2 + 0.32);
      const towerH = Math.max(1.2, baseY + span / 2 + 0.35 - FLOOR_Y);
      box(mount, armor, towerX, FLOOR_Y + towerH / 2, 0.04, 0.38, towerH, 0.54, `floor-tower-${sign < 0 ? 'left' : 'right'}`, 0.04);
      box(mount, steel, towerX, FLOOR_Y + towerH / 2, -0.28, 0.1, towerH * 0.9, 0.11, '', 0.005);
      box(mount, dark, towerX, FLOOR_Y + 0.12, -0.06, 0.44, 0.18, 0.48, '', 0);
    }
    box(mount, dark, baseX, FLOOR_Y + 0.1, 0.14, height + 0.55, 0.18, 0.52, 'floor-sill', 0);
    box(mount, armor, baseX, FLOOR_Y + 0.04, -0.02, height + 0.25, 0.05, 0.34, 'floor-track', 0.004);
  }

  root.userData.light = lamp;
  root.userData.span = span;
  root.userData.assembly = assembly;
  return root;
}

export function createRapidShutter(c: SlidingGateConfig): THREE.Group {
  return RAPID_SHUTTER_VISUAL_VARIANT === 'legacy' ? createRapidShutterV1(c) : createRapidShutterCinematic(c);
}

export function layoutRapidShutter(root: THREE.Group, c: SlidingGateConfig, t: number): void {
  if (RAPID_SHUTTER_VISUAL_VARIANT === 'legacy') {
    layoutRapidShutterV1(root, c, t);
    return;
  }
  const state = gateStateAtTime(c, t);
  const vertical = c.shutter?.orientation === 'vertical';
  const span = root.userData.span as number;
  const opening = vertical ? state.height : state.width;
  const assembly = (root.userData.assembly as THREE.Group | undefined) ?? root;
  const shift = vertical ? state.y - (c.baseY ?? 3) : state.x - c.baseX;
  for (const [i, sign] of [-1, 1].entries()) {
    const panel = assembly.getObjectByName(i === 0 ? 'ShutterLeft' : 'ShutterRight')!;
    panel.position.x = shift + sign * (opening / 2 + span / 4);
    const inward =
      state.shutter?.phase === 'WARNING' ||
      state.shutter?.phase === 'SLAMMING_CLOSED' ||
      state.shutter?.phase === 'CLOSED';
    panel.getObjectByName('DirectionArrow')!.scale.x = inward ? -sign : sign;
  }
  const phase = state.shutter!.phase;
  const light = root.userData.light as THREE.MeshStandardMaterial;
  const color =
    phase === 'WARNING' ? 0xffb640 : phase === 'SLAMMING_CLOSED' || phase === 'CLOSED' ? 0xff4435 : 0x68e7ff;
  light.color.setHex(color);
  light.emissive.setHex(color);
  let intensity = phase === 'WARNING' ? 1.2 : phase === 'OPEN' ? 0.85 : 1.05;
  if (phase === 'CLOSED') intensity *= 0.55 + 0.45 * Math.max(0, 1 - state.shutter!.timeInState / 0.12);
  light.emissiveIntensity = intensity;
}

export function disposeRapidShutter(root: THREE.Group): void {
  const kit = root.userData.kit as FacilityArtKit | undefined;
  kit?.dispose();
  root.clear();
}
