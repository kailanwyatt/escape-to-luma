import * as THREE from 'three';

type ReachSegment = {
  core: THREE.Mesh<THREE.CylinderGeometry, THREE.MeshStandardMaterial>;
  rim: THREE.Mesh<THREE.CylinderGeometry, THREE.MeshBasicMaterial>;
  collar: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>;
  index: number;
};

type Reach = {
  side: -1 | 1;
  segments: ReachSegment[];
  points: THREE.Vector3[];
  tip: THREE.Mesh<THREE.ConeGeometry, THREE.MeshBasicMaterial>;
};

type LoomingSegment = {
  core: THREE.Mesh<THREE.CylinderGeometry, THREE.MeshStandardMaterial>;
  collar: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>;
  index: number;
};

export type VoidReachesStage = 'CLEAR CORRIDOR' | 'SURGE WARNING' | 'STRIKE WINDOW' | 'RECOVERY';

const CYAN = 0x75edff;
const AMBER = 0xffbd55;
const VIOLET = 0x9b5cff;
const VOID = 0x06040c;
const SEGMENTS_PER_REACH = 8;
const _direction = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
const _rotation = new THREE.Quaternion();

/**
 * Render-only study for the proposed Void Reaches language. The limbs are
 * segmented, engineered ribbons rather than organic blobs, and the cyan
 * bracket marks the intentional safe space before a sweep closes it down.
 */
export class VoidReachesDemo {
  readonly group = new THREE.Group();

  private readonly reaches: Reach[] = [];
  private readonly loomingReach = new THREE.Group();
  private readonly loomingSegments: LoomingSegment[] = [];
  private readonly loomingPoints: THREE.Vector3[] = [];
  private readonly loomingCoreMaterial = new THREE.MeshStandardMaterial({
    color: 0x0d0b1b,
    emissive: 0x1c0c3b,
    emissiveIntensity: 0.5,
    metalness: 0.72,
    roughness: 0.46,
  });
  private readonly loomingCollarMaterial = new THREE.MeshBasicMaterial({
    color: 0x7d4acd,
    transparent: true,
    opacity: 0.52,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  private readonly coreMaterial = new THREE.MeshStandardMaterial({
    color: 0x070914,
    emissive: 0x08051a,
    emissiveIntensity: 0.38,
    metalness: 0.68,
    roughness: 0.42,
  });
  private readonly rimMaterial = new THREE.MeshBasicMaterial({
    color: VIOLET,
    transparent: true,
    opacity: 0.1,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  private readonly collarMaterial = new THREE.MeshBasicMaterial({
    color: CYAN,
    transparent: true,
    opacity: 0.82,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  private readonly tipMaterial = new THREE.MeshBasicMaterial({
    color: VIOLET,
    transparent: true,
    opacity: 0.94,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  private readonly safeMaterial = new THREE.MeshBasicMaterial({
    color: CYAN,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  private readonly safeGlowMaterial = new THREE.MeshBasicMaterial({
    color: CYAN,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  private readonly fieldMaterial = new THREE.MeshBasicMaterial({
    color: 0x080511,
    transparent: true,
    opacity: 0.74,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  private readonly warningMaterial = new THREE.MeshBasicMaterial({
    color: AMBER,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  private readonly safeBrackets = new THREE.Group();
  private readonly safeGlow: THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial>;
  private readonly warningHalo: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
  private readonly accent = new THREE.PointLight(VIOLET, 9, 15, 2);
  private readonly geometries: THREE.BufferGeometry[] = [];
  private visible = false;
  private stage: VoidReachesStage = 'CLEAR CORRIDOR';

  constructor() {
    this.group.name = 'void-reaches-demo';
    this.group.visible = false;

    const fieldGeo = new THREE.CircleGeometry(4.5, 64);
    this.geometries.push(fieldGeo);
    const field = new THREE.Mesh(fieldGeo, this.fieldMaterial);
    field.name = 'void-reaches-eclipse-field';
    field.position.set(0, 3.12, 6.48);
    this.group.add(field);

    const glowGeo = new THREE.CircleGeometry(1.05, 48);
    this.geometries.push(glowGeo);
    this.safeGlow = new THREE.Mesh(glowGeo, this.safeGlowMaterial);
    this.safeGlow.name = 'void-reaches-safe-glow';
    this.safeGlow.position.set(0, 3.12, 6.42);
    this.group.add(this.safeGlow);

    const warningGeo = new THREE.RingGeometry(1.08, 1.22, 48);
    this.geometries.push(warningGeo);
    this.warningHalo = new THREE.Mesh(warningGeo, this.warningMaterial);
    this.warningHalo.name = 'void-reaches-surge-halo';
    this.warningHalo.position.set(0, 3.12, 6.4);
    this.group.add(this.warningHalo);

    this.buildSafeBrackets();
    this.group.add(this.safeBrackets);
    this.buildLoomingReach();
    this.group.add(this.loomingReach);
    this.reaches.push(this.createReach(-1), this.createReach(1));
    this.group.add(this.accent);
    this.update(0, false);
  }

  show(): void {
    this.visible = true;
    this.group.visible = true;
  }

  hide(): void {
    this.visible = false;
    this.group.visible = false;
  }

  isVisible(): boolean {
    return this.visible;
  }

  currentStage(): VoidReachesStage {
    return this.stage;
  }

  update(elapsed: number, reduceMotion: boolean): void {
    if (!this.visible) return;

    const cycle = reduceMotion ? 0.9 : elapsed % 8.6;
    const motion = sampleCycle(cycle);
    this.stage = motion.stage;
    const time = reduceMotion ? 0 : elapsed;
    const pulse = reduceMotion ? 0.78 : 0.64 + 0.36 * Math.sin(time * 7.5);
    const warning = motion.warning;

    this.coreMaterial.emissive.setHex(warning ? 0x1d0a13 : 0x08051a);
    this.coreMaterial.emissiveIntensity = warning ? 0.58 + pulse * 0.32 : 0.3 + pulse * 0.12;
    this.rimMaterial.color.setHex(warning ? AMBER : motion.closing > 0.7 ? 0x7838bb : CYAN);
    this.rimMaterial.opacity = warning ? 0.16 + pulse * 0.16 : 0.04 + motion.closing * 0.08;
    this.collarMaterial.color.setHex(warning ? AMBER : motion.closing > 0.7 ? VIOLET : CYAN);
    this.collarMaterial.opacity = warning ? 0.62 + pulse * 0.3 : 0.68 + motion.closing * 0.18;
    this.tipMaterial.color.setHex(warning ? AMBER : motion.closing > 0.7 ? VIOLET : CYAN);
    this.tipMaterial.opacity = warning ? 0.75 + pulse * 0.2 : 0.62;

    this.safeGlowMaterial.opacity = (warning ? 0.05 : 0.12) + (1 - motion.closing) * 0.18;
    this.safeGlow.scale.setScalar(1 + (1 - motion.closing) * 0.2 + (warning ? pulse * 0.04 : 0));
    this.warningMaterial.opacity = warning ? 0.12 + pulse * 0.3 : 0;
    this.warningHalo.scale.setScalar(1 + (warning ? pulse * 0.14 : 0));
    this.safeBrackets.scale.setScalar(1 - motion.closing * 0.29);

    for (const reach of this.reaches) {
      this.updateReach(reach, motion.closing, warning ? pulse : 0, time);
    }
    this.updateLoomingReach(time, warning ? pulse : 0);

    this.accent.color.setHex(warning ? AMBER : motion.closing > 0.7 ? VIOLET : CYAN);
    this.accent.intensity = warning ? 12 + pulse * 9 : 7 + motion.closing * 5;
    this.accent.position.set(0, 3.12, 4.8);
  }

  dispose(): void {
    for (const geometry of this.geometries) geometry.dispose();
    this.coreMaterial.dispose();
    this.rimMaterial.dispose();
    this.collarMaterial.dispose();
    this.loomingCoreMaterial.dispose();
    this.loomingCollarMaterial.dispose();
    this.tipMaterial.dispose();
    this.safeMaterial.dispose();
    this.safeGlowMaterial.dispose();
    this.fieldMaterial.dispose();
    this.warningMaterial.dispose();
    this.group.clear();
    this.group.removeFromParent();
  }

  private buildSafeBrackets(): void {
    const horizontalGeo = new THREE.BoxGeometry(0.35, 0.045, 0.035);
    const verticalGeo = new THREE.BoxGeometry(0.045, 0.35, 0.035);
    this.geometries.push(horizontalGeo, verticalGeo);
    // The brackets are local to the safe aperture so closing can scale them
    // without dragging the marker toward the world origin.
    this.safeBrackets.position.set(0, 3.12, 0);
    const corners: Array<[number, number, number, number]> = [
      [-0.88, 0.78, 1, -1],
      [0.88, 0.78, -1, -1],
      [-0.88, -0.78, 1, 1],
      [0.88, -0.78, -1, 1],
    ];
    for (const [x, y, inwardX, inwardY] of corners) {
      const horizontal = new THREE.Mesh(horizontalGeo, this.safeMaterial);
      horizontal.position.set(x + inwardX * 0.16, y, 6.25);
      const vertical = new THREE.Mesh(verticalGeo, this.safeMaterial);
      vertical.position.set(x, y + inwardY * 0.16, 6.25);
      this.safeBrackets.add(horizontal, vertical);
    }
  }

  private createReach(side: -1 | 1): Reach {
    const group = new THREE.Group();
    group.name = `void-reach-${side < 0 ? 'left' : 'right'}`;
    const segments: ReachSegment[] = [];
    const points: THREE.Vector3[] = [];
    const segmentGeo = new THREE.CylinderGeometry(1, 0.78, 1, 6, 1, false);
    const collarGeo = new THREE.TorusGeometry(1, 0.075, 5, 10);
    this.geometries.push(segmentGeo, collarGeo);
    for (let index = 0; index < SEGMENTS_PER_REACH; index += 1) {
      const rim = new THREE.Mesh(segmentGeo, this.rimMaterial);
      rim.name = `void-reach-${side}-rim-${index}`;
      const core = new THREE.Mesh(segmentGeo, this.coreMaterial);
      core.name = `void-reach-${side}-segment-${index}`;
      const collar = new THREE.Mesh(collarGeo, this.collarMaterial);
      collar.name = `void-reach-${side}-joint-${index}`;
      collar.rotation.x = Math.PI / 2;
      group.add(rim, core, collar);
      segments.push({ core, rim, collar, index });
      points.push(new THREE.Vector3());
    }
    points.push(new THREE.Vector3());

    const tipGeo = new THREE.ConeGeometry(0.17, 0.48, 4);
    this.geometries.push(tipGeo);
    const tip = new THREE.Mesh(tipGeo, this.tipMaterial);
    tip.name = `void-reach-${side}-tip`;
    group.add(tip);
    this.group.add(group);
    return { side, segments, points, tip };
  }

  /** A third reach exists only to make Null feel present around the arena. */
  private buildLoomingReach(): void {
    this.loomingReach.name = 'void-reach-looming';
    const segmentGeo = new THREE.CylinderGeometry(1, 0.8, 1, 6, 1, false);
    const collarGeo = new THREE.TorusGeometry(1, 0.055, 5, 10);
    this.geometries.push(segmentGeo, collarGeo);
    for (let index = 0; index < 6; index += 1) {
      const core = new THREE.Mesh(segmentGeo, this.loomingCoreMaterial);
      core.name = `void-reach-looming-segment-${index}`;
      const collar = new THREE.Mesh(collarGeo, this.loomingCollarMaterial);
      collar.name = `void-reach-looming-joint-${index}`;
      this.loomingReach.add(core, collar);
      this.loomingSegments.push({ core, collar, index });
      this.loomingPoints.push(new THREE.Vector3());
    }
    this.loomingPoints.push(new THREE.Vector3());
  }

  private updateReach(reach: Reach, closing: number, warningPulse: number, time: number): void {
    const side = reach.side;
    const root = new THREE.Vector3(side * 4.2, side < 0 ? 1.25 : 4.98, 6.08);
    const tip = new THREE.Vector3(
      side * (1.8 - closing * 1.38),
      3.12 + (side < 0 ? 0.16 : -0.16) + Math.sin(time * 1.8 + side) * 0.07,
      6.02,
    );
    const controlA = new THREE.Vector3(side * 3.05, side < 0 ? 1.4 : 4.82, 6.05);
    const controlB = new THREE.Vector3(side * (2.25 - closing * 0.45), side < 0 ? 3.9 : 2.34, 6.03);

    for (let index = 0; index < reach.points.length; index += 1) {
      const u = index / (reach.points.length - 1);
      cubicPoint(root, controlA, controlB, tip, u, reach.points[index]!);
    }

    for (const segment of reach.segments) {
      const a = reach.points[segment.index]!;
      const b = reach.points[segment.index + 1]!;
      _direction.subVectors(b, a);
      const length = Math.max(0.04, _direction.length());
      _direction.normalize();
      _rotation.setFromUnitVectors(_up, _direction);
      const taper = 0.26 - segment.index * 0.014;
      const jitter = warningPulse * Math.sin(segment.index * 2.3 + time * 11) * 0.028;
      const radius = taper + jitter;
      for (const mesh of [segment.rim, segment.core]) {
        mesh.position.lerpVectors(a, b, 0.5);
        mesh.quaternion.copy(_rotation);
      }
      segment.rim.scale.set(radius * 1.1, length * 1.05, radius * 1.1);
      segment.core.scale.set(radius, length, radius);
      segment.collar.position.copy(b);
      segment.collar.quaternion.copy(_rotation);
      segment.collar.rotateX(Math.PI / 2);
      segment.collar.scale.setScalar(radius * 1.06);
    }

    const previous = reach.points[reach.points.length - 2]!;
    const end = reach.points[reach.points.length - 1]!;
    _direction.subVectors(end, previous).normalize();
    reach.tip.position.copy(end).addScaledVector(_direction, 0.18);
    reach.tip.quaternion.setFromUnitVectors(_up, _direction);
    reach.tip.scale.setScalar(1 + closing * 0.25 + warningPulse * 0.2);
  }

  private updateLoomingReach(time: number, warningPulse: number): void {
    // It is behind the active pair and never approaches the cyan aperture.
    const drift = Math.sin(time * 0.68) * 0.16;
    const root = new THREE.Vector3(-2.15, 7.15, 6.34);
    const controlA = new THREE.Vector3(-2.9, 6.35, 6.34);
    const controlB = new THREE.Vector3(-1.55 + drift, 5.28, 6.31);
    const tip = new THREE.Vector3(-1.42 + drift, 4.36, 6.27);
    for (let index = 0; index < this.loomingPoints.length; index += 1) {
      cubicPoint(
        root,
        controlA,
        controlB,
        tip,
        index / (this.loomingPoints.length - 1),
        this.loomingPoints[index]!,
      );
    }
    this.loomingCoreMaterial.emissiveIntensity = 0.42 + warningPulse * 0.2;
    this.loomingCollarMaterial.opacity = 0.46 + warningPulse * 0.2;
    for (const segment of this.loomingSegments) {
      const a = this.loomingPoints[segment.index]!;
      const b = this.loomingPoints[segment.index + 1]!;
      _direction.subVectors(b, a);
      const length = Math.max(0.04, _direction.length());
      _direction.normalize();
      _rotation.setFromUnitVectors(_up, _direction);
      const radius = 0.29 - segment.index * 0.018;
      segment.core.position.lerpVectors(a, b, 0.5);
      segment.core.quaternion.copy(_rotation);
      segment.core.scale.set(radius, length, radius);
      segment.collar.position.copy(b);
      segment.collar.quaternion.copy(_rotation);
      segment.collar.rotateX(Math.PI / 2);
      segment.collar.scale.setScalar(radius * 1.04);
    }
  }
}

function sampleCycle(time: number): { stage: VoidReachesStage; closing: number; warning: boolean } {
  if (time < 2.4) return { stage: 'CLEAR CORRIDOR', closing: 0, warning: false };
  if (time < 3.55) return { stage: 'SURGE WARNING', closing: (time - 2.4) / 1.15 * 0.46, warning: true };
  if (time < 4.65) return { stage: 'STRIKE WINDOW', closing: 0.92, warning: false };
  if (time < 6.3) return { stage: 'RECOVERY', closing: 0.92 * (1 - (time - 4.65) / 1.65), warning: false };
  return { stage: 'CLEAR CORRIDOR', closing: 0, warning: false };
}

function cubicPoint(
  start: THREE.Vector3,
  controlA: THREE.Vector3,
  controlB: THREE.Vector3,
  end: THREE.Vector3,
  t: number,
  output: THREE.Vector3,
): THREE.Vector3 {
  const inverse = 1 - t;
  output.set(
    inverse ** 3 * start.x + 3 * inverse ** 2 * t * controlA.x + 3 * inverse * t ** 2 * controlB.x + t ** 3 * end.x,
    inverse ** 3 * start.y + 3 * inverse ** 2 * t * controlA.y + 3 * inverse * t ** 2 * controlB.y + t ** 3 * end.y,
    inverse ** 3 * start.z + 3 * inverse ** 2 * t * controlA.z + 3 * inverse * t ** 2 * controlB.z + t ** 3 * end.z,
  );
  return output;
}
