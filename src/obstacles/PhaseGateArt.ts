import * as THREE from 'three';
import type { PhaseGateConfig } from '../config/ObstacleConfig';
import { phaseGateStateAtTime } from './PhaseGateState';
import { FacilityArtKit } from './FacilityArtKit';

/**
 * Cinematic phase gate — blue membrane disk that fades open with cyan telegraph.
 * Solid / warning / open samples PhaseGateState.
 */
export class PhaseGateArt {
  readonly group = new THREE.Group();
  private readonly kit = new FacilityArtKit({ cinematic: true });
  private readonly membrane: THREE.Mesh;
  private readonly rim: THREE.Mesh;
  private readonly warnRing: THREE.Mesh;
  private readonly membraneMat: THREE.MeshStandardMaterial;
  private readonly rimMat: THREE.MeshStandardMaterial;
  private readonly warnMat: THREE.MeshStandardMaterial;
  private readonly accent: THREE.PointLight;
  private readonly geometries: THREE.BufferGeometry[] = [];

  constructor(private readonly config: PhaseGateConfig) {
    this.group.name = 'phase-gate-art';
    this.membraneMat = new THREE.MeshStandardMaterial({
      color: 0x102238,
      emissive: 0x3a8ad0,
      emissiveIntensity: 0.7,
      metalness: 0.08,
      roughness: 0.45,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.rimMat = this.kit.metal(0x8aa0b0, 0.3);
    this.warnMat = this.kit.lamp();
    this.warnMat.color.setHex(0x7ec8ff);
    this.warnMat.emissive.setHex(0x4aa8ff);

    const diskGeo = new THREE.CircleGeometry(1, 48);
    this.geometries.push(diskGeo);
    this.membrane = new THREE.Mesh(diskGeo, this.membraneMat);
    this.membrane.name = 'phase-membrane';
    this.group.add(this.membrane);

    const rimGeo = new THREE.TorusGeometry(1, 0.045, 8, 48);
    this.geometries.push(rimGeo);
    this.rim = new THREE.Mesh(rimGeo, this.rimMat);
    this.rim.name = 'phase-rim';
    this.rim.position.z = -0.04;
    this.group.add(this.rim);

    const warnGeo = new THREE.TorusGeometry(0.92, 0.03, 6, 40);
    this.geometries.push(warnGeo);
    this.warnRing = new THREE.Mesh(warnGeo, this.warnMat);
    this.warnRing.name = 'phase-warn';
    this.warnRing.position.z = -0.06;
    this.group.add(this.warnRing);

    // Frame pods
    const dark = this.kit.metal(0x0e141c, 0.65, false);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      this.kit.box(
        this.group,
        `phase-pod-${i}`,
        0.2,
        0.14,
        0.16,
        Math.cos(a) * (config.fieldRadius + 0.08),
        Math.sin(a) * (config.fieldRadius + 0.08),
        0.02,
        dark,
        0.006,
      );
    }

    this.accent = new THREE.PointLight(0x5ab0ff, 10, 11, 2);
    this.accent.name = 'phase-accent';
    this.group.add(this.accent);
    this.update(0);
  }

  update(time: number) {
    const state = phaseGateStateAtTime(this.config, time);
    this.group.position.set(state.centerX, state.centerY, 0);
    this.membrane.scale.setScalar(state.fieldRadius);
    this.rim.scale.setScalar(state.fieldRadius);
    this.warnRing.scale.setScalar(state.fieldRadius);

    if (state.open) {
      this.membrane.visible = false;
      this.warnRing.visible = false;
      this.rimMat.color.setHex(0x7ce8d0);
      this.accent.color.setHex(0x7ce8d0);
      this.accent.intensity = 6;
    } else if (state.warning) {
      this.membrane.visible = true;
      this.membraneMat.opacity = 0.35;
      this.membraneMat.emissive.setHex(0x6ab8ff);
      this.membraneMat.emissiveIntensity = 0.95;
      this.warnRing.visible = true;
      this.rimMat.color.setHex(0x9ad4ff);
      this.accent.color.setHex(0x8ad0ff);
      this.accent.intensity = 14;
    } else {
      this.membrane.visible = true;
      this.membraneMat.opacity = 0.78;
      this.membraneMat.emissive.setHex(0x3a8ad0);
      this.membraneMat.emissiveIntensity = 0.75;
      this.warnRing.visible = false;
      this.rimMat.color.setHex(0x8aa0b0);
      this.accent.color.setHex(0x5ab0ff);
      this.accent.intensity = 11;
    }
    this.accent.position.set(0, 0, -1.05);
    this.group.userData.phase = state.phase;
  }

  dispose() {
    for (const g of this.geometries) g.dispose();
    this.membraneMat.dispose();
    this.kit.dispose();
    this.group.clear();
    this.group.removeFromParent();
  }
}
