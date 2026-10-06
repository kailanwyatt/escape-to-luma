import * as THREE from 'three';
import type { NullLashConfig } from '../config/ObstacleConfig';
import { nullLashStateAtTime } from './NullLashState';
import { NULL_PALETTE, NullFleshKit } from './NullFleshKit';

const SEG_COUNT = 12;
const _up = new THREE.Vector3(0, 1, 0);
const _dir = new THREE.Vector3();
const _quat = new THREE.Quaternion();

type LimbSeg = {
  mesh: THREE.Mesh;
  u: number;
  baseR: number;
};

/**
 * Null Lash — egg-blob spine of the same void-moon flesh.
 * Coiled = clear; violet tip = warning; then whip.
 */
export class NullLashArt {
  readonly group = new THREE.Group();
  private readonly limb = new THREE.Group();
  private readonly segs: LimbSeg[] = [];
  private readonly joints: THREE.Vector3[] = [];
  private readonly kit = new NullFleshKit();
  private readonly tip: THREE.Mesh;
  private readonly bulb: THREE.Mesh;
  private readonly accent: THREE.PointLight;
  private readonly geometries: THREE.BufferGeometry[] = [];

  constructor(private readonly config: NullLashConfig) {
    this.group.name = 'null-lash-art';
    this.limb.name = 'null-lash-limb';
    this.group.add(this.limb);

    const blobGeo = new THREE.SphereGeometry(1, 12, 10);
    this.geometries.push(blobGeo);
    const baseR = config.thickness * 1.45;

    for (let i = 0; i < SEG_COUNT; i++) {
      this.joints.push(new THREE.Vector3());
      const u = (i + 0.5) / SEG_COUNT;
      const mesh = new THREE.Mesh(blobGeo, i % 2 ? this.kit.flesh : this.kit.dark);
      mesh.name = `null-lash-seg-${i}`;
      const r = baseR * (1.2 - u * 0.75);
      mesh.scale.set(r * 1.35, r * 1.05, r * 0.85);
      this.limb.add(mesh);
      this.segs.push({ mesh, u, baseR: r });
    }
    this.joints.push(new THREE.Vector3());

    this.tip = new THREE.Mesh(blobGeo, this.kit.flesh);
    this.tip.name = 'null-lash-tip';
    this.tip.scale.set(
      config.thickness * 0.95,
      config.thickness * 0.75,
      config.thickness * 0.7,
    );
    this.limb.add(this.tip);

    this.bulb = new THREE.Mesh(blobGeo, this.kit.dark);
    this.bulb.name = 'null-lash-pivot';
    this.bulb.scale.set(
      config.thickness * 2.1,
      config.thickness * 1.7,
      config.thickness * 1.5,
    );
    this.group.add(this.bulb);

    this.accent = new THREE.PointLight(NULL_PALETTE.scaleLow, 10, 11, 2);
    this.accent.name = 'null-lash-accent';
    this.group.add(this.accent);
    this.update(0);
  }

  update(time: number) {
    const state = nullLashStateAtTime(this.config, time);
    this.bulb.position.set(state.pivotX, state.pivotY, 0.02);

    const tucked = state.phase === 'coiled' || state.phase === 'warning';
    const tuck = state.phase === 'coiled' ? 0.38 : state.phase === 'warning' ? 0.48 : 1;
    const visLen = state.length * tuck;
    const angle = tucked ? this.config.restAngle : state.angle;

    const n = this.joints.length - 1;
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const along = visLen * u;
      let x = state.pivotX + Math.cos(angle) * along;
      let y = state.pivotY + Math.sin(angle) * along;
      const nx = -Math.sin(angle);
      const ny = Math.cos(angle);
      const waveAmp =
        state.phase === 'lashing' || state.phase === 'extended'
          ? state.thickness * (0.55 + 0.35 * Math.sin(time * 10))
          : state.thickness * 0.28;
      const wave =
        Math.sin(u * Math.PI * 2.4 + time * (tucked ? 2.2 : 6.5)) * waveAmp * (1 - u * 0.35);
      let curl = 0;
      if (tucked) {
        curl = Math.sin(u * Math.PI) * state.thickness * (1.8 + (state.phase === 'warning' ? 0.4 : 0));
        curl += u * u * state.thickness * 1.1;
      }
      x += nx * (wave + curl);
      y += ny * (wave + curl);
      this.joints[i]!.set(x, y, -u * 0.03);
    }

    for (let i = 0; i < this.segs.length; i++) {
      const a = this.joints[i]!;
      const b = this.joints[i + 1]!;
      _dir.subVectors(b, a);
      const len = Math.max(0.04, _dir.length());
      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;
      const midZ = (a.z + b.z) / 2;
      _dir.normalize();
      _quat.setFromUnitVectors(_up, _dir);
      const seg = this.segs[i]!;
      const stretch = Math.min(1.35, Math.max(0.85, len / (this.config.length / SEG_COUNT)));
      seg.mesh.position.set(midX, midY, midZ);
      seg.mesh.quaternion.copy(_quat);
      seg.mesh.scale.set(seg.baseR * 1.35, seg.baseR * 1.05 * stretch, seg.baseR * 0.85);
    }

    const tipJoint = this.joints[n]!;
    const prev = this.joints[n - 1]!;
    _dir.subVectors(tipJoint, prev).normalize();
    this.tip.position.set(
      tipJoint.x + _dir.x * this.config.thickness * 0.35,
      tipJoint.y + _dir.y * this.config.thickness * 0.35,
      tipJoint.z - 0.02,
    );
    _quat.setFromUnitVectors(_up, _dir);
    this.tip.quaternion.copy(_quat);

    const warn = state.warning;
    this.kit.telegraph.emissiveIntensity = warn ? 1.35 : 0.7;
    this.kit.flesh.emissiveIntensity = warn ? 0.9 : 0.55;
    this.kit.dark.emissiveIntensity = warn ? 0.55 : 0.35;
    this.tip.material = warn ? this.kit.telegraph : this.kit.flesh;
    this.accent.color.setHex(warn ? NULL_PALETTE.telegraph : NULL_PALETTE.scaleLow);
    this.accent.intensity = warn ? 16 : 9;
    this.accent.position.set(this.tip.position.x, this.tip.position.y, -1.0);
    this.group.userData.phase = state.phase;
  }

  dispose() {
    for (const g of this.geometries) g.dispose();
    this.kit.dispose();
    this.group.clear();
    this.group.removeFromParent();
  }
}
