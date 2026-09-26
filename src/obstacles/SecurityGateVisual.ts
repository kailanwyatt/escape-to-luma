import * as THREE from 'three';
import type { EnvironmentId } from '../config/ChallengeConfig';
import { GAME_TUNING } from '../game/gameTuning';
import { FacilityArtKit } from './FacilityArtKit';

function palette(environment: EnvironmentId) {
  return environment === 'rooftop'
    ? { armor: 0x8a9bab, inset: 0x5a6c7a, steel: 0xd0dde6, energy: 0x8bdde7, warn: 0xffb449 }
    : { armor: 0x455868, inset: 0x243643, steel: 0xb0c0cb, energy: 0x70e5ed, warn: 0xff9b32 };
}

/** Blast-door sliding panels. Collision stays the authored opening rectangle — meshes are cues only. */
export function createSecurityGate(environment: EnvironmentId): THREE.Group {
  const root = new THREE.Group();
  root.name = 'security-gate';
  root.userData.securityGate = true;
  const kit = new FacilityArtKit({ cinematic: true });
  root.userData.kit = kit;
  const colors = palette(environment);
  const t = GAME_TUNING.gate;
  const armor = kit.metal(colors.armor, 0.32);
  const inset = kit.metal(colors.inset, 0.48);
  const steel = kit.metal(colors.steel, 0.2);
  const black = kit.metal(0x0c141c, 0.62, false);
  const lamp = kit.lamp();
  lamp.color.setHex(colors.warn);
  lamp.emissive.setHex(colors.warn);
  const energy = kit.lampCore();
  energy.color.setHex(colors.energy);
  energy.emissive.setHex(colors.energy);

  const dressVertical = (panel: THREE.Group, towardOpening: 1 | -1) => {
    // Authoritative slab — layout scales X to the solid width.
    kit.box(panel, 'gate-body', 1, t.panelHeight, 0.14, 0, 0, 0, black, 0);
    kit.box(panel, 'gate-armor', 1, t.panelHeight, 0.16, 0, 0, 0.02, armor, 0.04);
    kit.box(panel, 'gate-recess', 0.82, t.panelHeight * 0.88, 0.04, 0, 0, -0.06, inset, 0.015);
    for (let i = 0; i < 6; i++) {
      const y = (i - 2.5) * (t.panelHeight / 7);
      kit.box(panel, 'armor-rib', 0.72, 0.1, 0.05, 0, y, -0.1, armor, 0.012);
      kit.box(panel, 'rib-lip', 0.72, 0.018, 0.028, 0, y - 0.045, -0.13, steel, 0.003);
    }
    // Leading seal faces the opening so the gap reads as a door throat.
    kit.box(panel, 'leading-seal', 0.08, t.panelHeight * 0.96, 0.06, towardOpening * 0.46, 0, -0.08, black, 0);
    kit.box(panel, 'leading-steel', 0.035, t.panelHeight * 0.9, 0.045, towardOpening * 0.42, 0, -0.12, steel, 0.004);
    kit.box(panel, 'leading-bevel', 0.016, t.panelHeight * 0.86, 0.025, towardOpening * 0.4, 0, -0.145, energy, 0.002);
    for (const y of [-0.35, 0, 0.35]) {
      kit.box(panel, 'status-lamp', 0.04, 0.14, 0.03, towardOpening * 0.35, y * t.panelHeight, -0.14, lamp, 0.003);
    }
    for (const y of [-0.42, 0.42]) {
      kit.box(panel, 'runner', 0.78, 0.07, 0.08, 0, y * t.panelHeight, -0.05, armor, 0.015);
      kit.box(panel, 'runner-rail', 0.7, 0.018, 0.03, 0, y * t.panelHeight, -0.12, steel, 0.003);
    }
  };

  const dressHorizontal = (panel: THREE.Group, towardOpening: 1 | -1) => {
    kit.box(panel, 'gate-body', t.panelWidth, 1, 0.14, 0, 0, 0, black, 0);
    kit.box(panel, 'gate-armor', t.panelWidth, 1, 0.16, 0, 0, 0.02, armor, 0.04);
    kit.box(panel, 'gate-recess', t.panelWidth * 0.92, 0.78, 0.04, 0, 0, -0.06, inset, 0.015);
    for (let i = 0; i < 8; i++) {
      const x = (i - 3.5) * (t.panelWidth / 9);
      kit.box(panel, 'armor-rib', 0.12, 0.62, 0.05, x, 0, -0.1, armor, 0.01);
    }
    kit.box(panel, 'leading-seal', t.panelWidth * 0.96, 0.08, 0.06, 0, towardOpening * 0.46, -0.08, black, 0);
    kit.box(panel, 'leading-steel', t.panelWidth * 0.9, 0.035, 0.045, 0, towardOpening * 0.42, -0.12, steel, 0.004);
    kit.box(panel, 'leading-bevel', t.panelWidth * 0.86, 0.016, 0.025, 0, towardOpening * 0.4, -0.145, energy, 0.002);
  };

  for (const [name, side] of [['left', 1], ['right', -1]] as const) {
    const panel = new THREE.Group();
    panel.name = name;
    dressVertical(panel, side);
    root.add(panel);
  }
  for (const [name, side] of [['top', -1], ['bottom', 1]] as const) {
    const panel = new THREE.Group();
    panel.name = name;
    dressHorizontal(panel, side);
    root.add(panel);
  }

  // Opening lip — cyan so the safe rectangle reads against dark armor.
  const edgeMat = new THREE.MeshStandardMaterial({
    color: colors.energy,
    emissive: colors.energy,
    emissiveIntensity: 0.85,
    metalness: 0.1,
    roughness: 0.3,
  });
  root.userData.edgeMat = edgeMat;
  for (const name of ['edgeLeft', 'edgeRight', 'edgeTop', 'edgeBottom']) {
    const edge = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 0.03), edgeMat);
    edge.name = name;
    root.add(edge);
  }

  // Opening corner chevrons — teach the throw rectangle at a glance.
  for (let i = 0; i < 4; i++) {
    kit.box(root, `opening-corner-${i}`, 0.14, 0.14, 0.04, 0, 0, -0.12, energy, 0.006);
  }

  // Fixed service frame sits outside the playable lane.
  for (const side of [-1, 1] as const) {
    kit.box(root, `column-${side}`, 0.32, 6.4, 0.4, side * 4.55, t.baseY, 0.08, steel, 0.02);
    kit.box(root, `column-cap-${side}`, 0.42, 0.22, 0.48, side * 4.55, t.baseY + 3.1, 0.05, armor, 0.015);
    for (let i = 0; i < 4; i++) {
      kit.box(root, `column-lamp-${side}-${i}`, 0.08, 0.2, 0.04, side * 4.4, 1.2 + i * 1.2, -0.15, lamp, 0.004);
    }
  }
  kit.box(root, 'track-top', 9.2, 0.22, 0.35, 0, t.baseY + t.panelHeight / 2 - 0.05, -0.05, steel, 0.015);
  kit.box(root, 'track-bottom', 9.2, 0.22, 0.35, 0, t.baseY - t.panelHeight / 2 + 0.05, -0.05, steel, 0.015);
  kit.box(root, 'track-groove-top', 8.6, 0.06, 0.04, 0, t.baseY + t.panelHeight / 2 - 0.05, -0.24, black, 0);
  kit.box(root, 'track-groove-bottom', 8.6, 0.06, 0.04, 0, t.baseY - t.panelHeight / 2 + 0.05, -0.24, black, 0);

  for (const name of ['jambLeft', 'jambRight', 'lintel', 'sill', 'motorLeft', 'motorRight']) {
    const part = new THREE.Group();
    part.name = name;
    root.add(part);
  }
  kit.box(root.getObjectByName('jambLeft') as THREE.Group, 'jamb-body', 0.28, 1, 0.24, 0, 0, 0, black, 0.02);
  kit.box(root.getObjectByName('jambLeft') as THREE.Group, 'jamb-face', 0.18, 0.92, 0.06, 0, 0, -0.12, steel, 0.008);
  kit.box(root.getObjectByName('jambRight') as THREE.Group, 'jamb-body', 0.28, 1, 0.24, 0, 0, 0, black, 0.02);
  kit.box(root.getObjectByName('jambRight') as THREE.Group, 'jamb-face', 0.18, 0.92, 0.06, 0, 0, -0.12, steel, 0.008);
  kit.box(root.getObjectByName('lintel') as THREE.Group, 'lintel-body', 1, 0.28, 0.24, 0, 0, 0, black, 0.02);
  kit.box(root.getObjectByName('lintel') as THREE.Group, 'lintel-face', 0.92, 0.16, 0.06, 0, 0, -0.12, steel, 0.008);
  kit.box(root.getObjectByName('sill') as THREE.Group, 'sill-body', 1, 0.28, 0.24, 0, 0, 0, black, 0.02);
  kit.box(root.getObjectByName('sill') as THREE.Group, 'sill-face', 0.92, 0.16, 0.06, 0, 0, -0.12, steel, 0.008);
  for (const name of ['motorLeft', 'motorRight']) {
    const motor = root.getObjectByName(name) as THREE.Group;
    kit.box(motor, 'motor-housing', 0.42, 0.42, 0.36, 0, 0, 0, armor, 0.02);
    kit.box(motor, 'motor-lens', 0.16, 0.16, 0.05, 0, 0, -0.2, lamp, 0.004);
  }

  const accent = new THREE.PointLight(colors.warn, 8, 9, 2);
  accent.name = 'gate-accent';
  accent.position.set(0, t.baseY, -1.1);
  root.add(accent);
  return root;
}

export function layoutSecurityGate(
  root: THREE.Group,
  openingX: number,
  openingY: number,
  openingWidth: number,
  openingHeight: number,
): void {
  const t = GAME_TUNING.gate;
  const left = root.getObjectByName('left')!;
  const right = root.getObjectByName('right')!;
  const top = root.getObjectByName('top')!;
  const bottom = root.getObjectByName('bottom')!;
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

  const border = 0.03;
  const leftEdge = openingX - openingWidth / 2;
  const rightEdge = openingX + openingWidth / 2;
  const topEdge = openingY + openingHeight / 2;
  const bottomEdge = openingY - openingHeight / 2;
  for (const [name, x, y, w, h] of [
    ['edgeLeft', leftEdge - border / 2, openingY, border, openingHeight],
    ['edgeRight', rightEdge + border / 2, openingY, border, openingHeight],
    ['edgeTop', openingX, topEdge + border / 2, openingWidth + border * 2, border],
    ['edgeBottom', openingX, bottomEdge - border / 2, openingWidth + border * 2, border],
  ] as const) {
    const edge = root.getObjectByName(name);
    if (edge) {
      edge.position.set(x, y, -0.1);
      edge.scale.set(w, h, 1);
    }
  }

  const put = (name: string, x: number, y: number, z: number, sx: number, sy: number) => {
    const o = root.getObjectByName(name);
    if (!o) return;
    o.position.set(x, y, z);
    o.scale.set(sx, sy, 1);
  };
  put('jambLeft', leftEdge - 0.14, openingY, -0.05, 1, openingHeight + 0.35);
  put('jambRight', rightEdge + 0.14, openingY, -0.05, 1, openingHeight + 0.35);
  put('lintel', openingX, topEdge + 0.14, -0.05, openingWidth + 0.2, 1);
  put('sill', openingX, bottomEdge - 0.14, -0.05, openingWidth + 0.2, 1);
  put('motorLeft', leftEdge - 0.35, topEdge + 0.38, -0.08, 1, 1);
  put('motorRight', rightEdge + 0.35, topEdge + 0.38, -0.08, 1, 1);

  const corners: Array<[number, number, number]> = [
    [leftEdge + 0.08, topEdge - 0.08, Math.PI / 4],
    [rightEdge - 0.08, topEdge - 0.08, -Math.PI / 4],
    [leftEdge + 0.08, bottomEdge + 0.08, -Math.PI / 4],
    [rightEdge - 0.08, bottomEdge + 0.08, Math.PI / 4],
  ];
  corners.forEach(([x, y, rot], i) => {
    const corner = root.getObjectByName(`opening-corner-${i}`);
    if (!corner) return;
    corner.position.set(x, y, -0.12);
    corner.rotation.z = rot;
    corner.visible = openingWidth > 0.35 && openingHeight > 0.35;
  });

  const teach =
    openingWidth * openingHeight > 3.3 ? 0x70e5ed : openingWidth * openingHeight < 1.8 ? 0xff7562 : 0xffb449;
  const edgeMat = root.userData.edgeMat as THREE.MeshStandardMaterial | undefined;
  if (edgeMat?.emissive) {
    edgeMat.color.setHex(teach);
    edgeMat.emissive.setHex(teach);
    edgeMat.emissiveIntensity = teach === 0xff7562 ? 1.35 : teach === 0xffb449 ? 1.05 : 0.8;
  }

  const accent = root.getObjectByName('gate-accent') as THREE.PointLight | undefined;
  if (accent) {
    accent.position.set(openingX, openingY, -1.05);
    const open = Math.min(1, (openingWidth * openingHeight) / 6);
    accent.intensity = 6 + open * 5;
    accent.color.setHex(teach);
  }
}
