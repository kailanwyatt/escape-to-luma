import * as THREE from 'three';
import type { NullLashConfig } from '../config/ObstacleConfig';
import { nullLashStateAtTime } from './NullLashState';

const SEG_COUNT = 12;
const SUCKER_EVERY = 2;
const _up = new THREE.Vector3(0, 1, 0);
const _dir = new THREE.Vector3();
const _mid = new THREE.Vector3();
const _quat = new THREE.Quaternion();

type LimbSeg = {
  mesh: THREE.Mesh;
  /** 0 at shoulder → 1 at tip. */
  u: number;
};

/**
 * Cinematic Null lash — continuous tapered tentacle (not a bead chain).
 * Spine samples NullLashState; visual curve stays near the collision segment.
 */
export class NullLashArt {
  readonly group = new THREE.Group();
  private readonly limb = new THREE.Group();
  private readonly segs: LimbSeg[] = [];
  private readonly suckers: THREE.Mesh[] = [];
  private readonly joints: THREE.Vector3[] = [];
  private readonly fleshMat: THREE.MeshStandardMaterial;
  private readonly darkMat: THREE.MeshStandardMaterial;
  private readonly warnMat: THREE.MeshStandardMaterial;
  private readonly suckerMat: THREE.MeshStandardMaterial;
  private readonly tip: THREE.Mesh;
  private readonly bulb: THREE.Mesh;
  private readonly accent: THREE.PointLight;
  private readonly geometries: THREE.BufferGeometry[] = [];

  constructor(private readonly config: NullLashConfig) {
    this.group.name = 'null-lash-art';
    this.fleshMat = new THREE.MeshStandardMaterial({
      color: 0x160a22,
      emissive: 0x3a1860,
      emissiveIntensity: 0.5,
      metalness: 0.04,
      roughness: 0.68,
    });
    this.darkMat = new THREE.MeshStandardMaterial({
      color: 0x08040e,
      emissive: 0x1a0a28,
      emissiveIntensity: 0.32,
      metalness: 0.02,
      roughness: 0.8,
    });
    this.warnMat = new THREE.MeshStandardMaterial({
      color: 0xc080ff,
      emissive: 0x8a40e0,
      emissiveIntensity: 0.95,
      metalness: 0.08,
      roughness: 0.32,
    });
    this.suckerMat = new THREE.MeshStandardMaterial({
      color: 0x4a2068,
      emissive: 0x6a30a0,
      emissiveIntensity: 0.55,
      metalness: 0.05,
      roughness: 0.45,
    });

    this.limb.name = 'null-lash-limb';
    this.group.add(this.limb);

    const baseR = config.thickness * 1.35;
    for (let i = 0; i < SEG_COUNT; i++) {
      this.joints.push(new THREE.Vector3());
      const u = (i + 0.5) / SEG_COUNT;
      // Unit cylinder along Y — scaled each frame to span joint→joint.
      const geo = new THREE.CylinderGeometry(1, 1, 1, 10, 1, false);
      this.geometries.push(geo);
      const mesh = new THREE.Mesh(geo, i % 2 ? this.fleshMat : this.darkMat);
      mesh.name = `null-lash-seg-${i}`;
      // Slight oval cross-section so it reads as muscle, not a pipe.
      mesh.scale.set(baseR * (1.15 - u * 0.7), 1, baseR * (0.95 - u * 0.55));
      this.limb.add(mesh);
      this.segs.push({ mesh, u });

      if (i > 0 && i < SEG_COUNT - 1 && i % SUCKER_EVERY === 0) {
        const suckGeo = new THREE.SphereGeometry(1, 8, 6);
        this.geometries.push(suckGeo);
        const suck = new THREE.Mesh(suckGeo, this.suckerMat);
        suck.name = `null-lash-sucker-${i}`;
        suck.scale.setScalar(baseR * (0.55 - u * 0.25));
        this.limb.add(suck);
        this.suckers.push(suck);
      }
    }
    this.joints.push(new THREE.Vector3()); // tip joint

    // Pointed tip — elongated teardrop, not a bubble.
    const tipGeo = new THREE.ConeGeometry(1, 2.2, 10);
    this.geometries.push(tipGeo);
    this.tip = new THREE.Mesh(tipGeo, this.fleshMat);
    this.tip.name = 'null-lash-tip';
    this.tip.scale.set(
      config.thickness * 0.85,
      config.thickness * 1.1,
      config.thickness * 0.85,
    );
    this.limb.add(this.tip);

    // Shoulder bulb / root
    const bulbGeo = new THREE.SphereGeometry(1, 14, 12);
    this.geometries.push(bulbGeo);
    this.bulb = new THREE.Mesh(bulbGeo, this.darkMat);
    this.bulb.name = 'null-lash-pivot';
    this.bulb.scale.set(
      config.thickness * 1.85,
      config.thickness * 1.55,
      config.thickness * 1.35,
    );
    this.group.add(this.bulb);

    // Root collar rings
    for (let i = 0; i < 2; i++) {
      const ringGeo = new THREE.TorusGeometry(config.thickness * (1.55 + i * 0.22), 0.035, 6, 16);
      this.geometries.push(ringGeo);
      const ring = new THREE.Mesh(ringGeo, this.fleshMat);
      ring.name = `null-lash-collar-${i}`;
      ring.position.set(0, 0, -0.04 - i * 0.03);
      ring.rotation.x = Math.PI / 2;
      this.bulb.add(ring);
    }

    this.accent = new THREE.PointLight(0x7a40c8, 10, 11, 2);
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
    const angle =
      tucked ? this.config.restAngle : state.angle;

    // Build a smooth tentacle polyline: taper + lateral undulation (+ coil curl when tucked).
    const n = this.joints.length - 1;
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const along = visLen * u;
      let x = state.pivotX + Math.cos(angle) * along;
      let y = state.pivotY + Math.sin(angle) * along;

      const nx = -Math.sin(angle);
      const ny = Math.cos(angle);

      // Living wave — stronger mid-body, quieter at tip.
      const waveAmp =
        state.phase === 'lashing' || state.phase === 'extended'
          ? state.thickness * (0.55 + 0.35 * Math.sin(time * 10))
          : state.thickness * 0.28;
      const wave = Math.sin(u * Math.PI * 2.4 + time * (tucked ? 2.2 : 6.5)) * waveAmp * (1 - u * 0.35);

      // When coiled, curl the tentacle into a hook so it reads as a tucked limb.
      let curl = 0;
      if (tucked) {
        curl = Math.sin(u * Math.PI) * state.thickness * (1.8 + (state.phase === 'warning' ? 0.4 : 0));
        curl += u * u * state.thickness * 1.1;
      }

      x += nx * (wave + curl);
      y += ny * (wave + curl);
      // Slight depth so overlapping cylinders don't z-fight as a flat ribbon.
      this.joints[i]!.set(x, y, -u * 0.03);
    }

    for (let i = 0; i < this.segs.length; i++) {
      const a = this.joints[i]!;
      const b = this.joints[i + 1]!;
      _dir.subVectors(b, a);
      const len = Math.max(0.04, _dir.length());
      _mid.addVectors(a, b).multiplyScalar(0.5);
      _dir.normalize();
      _quat.setFromUnitVectors(_up, _dir);

      const seg = this.segs[i]!;
      const taper = 1.2 - seg.u * 0.75;
      const r = this.config.thickness * taper;
      seg.mesh.position.copy(_mid);
      seg.mesh.quaternion.copy(_quat);
      // Overlap neighbors slightly so the limb reads as one continuous tube.
      seg.mesh.scale.set(r * 1.05, len * 1.12, r * 0.92);
    }

    // Suckers ride the underside of every other joint.
    let suckerIdx = 0;
    for (let i = 1; i < SEG_COUNT - 1; i++) {
      if (i % SUCKER_EVERY !== 0) continue;
      const suck = this.suckers[suckerIdx++];
      if (!suck) break;
      const a = this.joints[i]!;
      const b = this.joints[Math.min(i + 1, n)]!;
      _dir.subVectors(b, a).normalize();
      const nx = -_dir.y;
      const ny = _dir.x;
      const u = i / n;
      const r = this.config.thickness * (1.05 - u * 0.65);
      suck.position.set(a.x + nx * r * 0.85, a.y + ny * r * 0.85, a.z - 0.02);
      suck.visible = true;
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
    this.warnMat.emissiveIntensity = warn ? 1.25 : 0.55;
    this.fleshMat.emissiveIntensity = warn ? 0.75 : 0.45;
    this.darkMat.emissiveIntensity = warn ? 0.5 : 0.3;
    this.suckerMat.emissiveIntensity = warn ? 1.1 : 0.5;
    this.suckerMat.emissive.setHex(warn ? 0xb050ff : 0x6a30a0);
    this.tip.material = warn ? this.warnMat : this.fleshMat;
    this.accent.color.setHex(warn ? 0xff90ff : 0x6a40c8);
    this.accent.intensity = warn ? 16 : 9;
    this.accent.position.set(this.tip.position.x, this.tip.position.y, -1.0);
    this.group.userData.phase = state.phase;
  }

  dispose() {
    for (const g of this.geometries) g.dispose();
    this.fleshMat.dispose();
    this.darkMat.dispose();
    this.warnMat.dispose();
    this.suckerMat.dispose();
    this.group.clear();
    this.group.removeFromParent();
  }
}
