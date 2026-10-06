import * as THREE from 'three';
import type { PhaseGateConfig } from '../config/ObstacleConfig';
import { phaseGateStateAtTime } from './PhaseGateState';
import { FacilityArtKit } from './FacilityArtKit';

const FILL = 0xfff0a0;
const FILL_EMISSIVE = 0xffe070;
const WARN_FILL = 0xffe8b0;
const WARN_EMISSIVE = 0xffc24a;

/**
 * Cinematic phase gate — light-yellow membrane with a destination-portal-style border.
 * Solid / warning / open samples PhaseGateState.
 */
export class PhaseGateArt {
  readonly group = new THREE.Group();
  private readonly kit = new FacilityArtKit({ cinematic: true });
  private readonly membrane: THREE.Mesh;
  private readonly rim: THREE.Mesh;
  private readonly rimLip: THREE.Mesh;
  private readonly membraneMat: THREE.MeshStandardMaterial;
  private readonly rimMat: THREE.MeshStandardMaterial;
  private readonly rimLipMat: THREE.MeshBasicMaterial;
  private readonly accent: THREE.PointLight;
  private readonly geometries: THREE.BufferGeometry[] = [];

  constructor(private readonly config: PhaseGateConfig) {
    this.group.name = 'phase-gate-art';
    this.membraneMat = new THREE.MeshStandardMaterial({
      color: FILL,
      emissive: FILL_EMISSIVE,
      emissiveIntensity: 0.85,
      metalness: 0.05,
      roughness: 0.4,
      transparent: true,
      opacity: 0.82,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.rimMat = this.kit.metal(0x263f55, 0.28);
    // Non-additive cyan — additive cyan on yellow fill reads as a green collar.
    this.rimLipMat = new THREE.MeshBasicMaterial({
      color: 0x50e5ff,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });

    const diskGeo = new THREE.CircleGeometry(1, 48);
    this.geometries.push(diskGeo);
    this.membrane = new THREE.Mesh(diskGeo, this.membraneMat);
    this.membrane.name = 'phase-membrane';
    this.group.add(this.membrane);

    // Destination-portal style border: steel torus + cyan inner lip (same as JumpGate frame).
    const rimGeo = new THREE.TorusGeometry(1.02, 0.055, 8, 48);
    this.geometries.push(rimGeo);
    this.rim = new THREE.Mesh(rimGeo, this.rimMat);
    this.rim.name = 'phase-rim';
    this.rim.position.z = -0.04;
    this.group.add(this.rim);

    const lipGeo = new THREE.TorusGeometry(1.08, 0.022, 6, 48);
    this.geometries.push(lipGeo);
    this.rimLip = new THREE.Mesh(lipGeo, this.rimLipMat);
    this.rimLip.name = 'phase-rim-lip';
    this.rimLip.position.z = -0.02;
    this.group.add(this.rimLip);

    this.accent = new THREE.PointLight(FILL_EMISSIVE, 10, 11, 2);
    this.accent.name = 'phase-accent';
    this.group.add(this.accent);
    this.update(0);
  }

  update(time: number) {
    const state = phaseGateStateAtTime(this.config, time);
    this.group.position.set(state.centerX, state.centerY, 0);
    this.membrane.scale.setScalar(state.fieldRadius);
    this.rim.scale.setScalar(state.fieldRadius);
    this.rimLip.scale.setScalar(state.fieldRadius);

    this.rim.visible = true;
    this.rimLip.visible = true;
    this.rimMat.color.setHex(0x263f55);
    this.rimLipMat.color.setHex(0x50e5ff);
    this.rimLipMat.opacity = 0.88;

    if (state.open) {
      this.membrane.visible = false;
      this.rimLipMat.opacity = 0.7;
      this.accent.color.setHex(0x50e5ff);
      this.accent.intensity = 6;
    } else if (state.warning) {
      this.membrane.visible = true;
      this.membraneMat.color.setHex(WARN_FILL);
      this.membraneMat.opacity = 0.4;
      this.membraneMat.emissive.setHex(WARN_EMISSIVE);
      this.membraneMat.emissiveIntensity = 1.05;
      this.rimLipMat.color.setHex(WARN_EMISSIVE);
      this.rimLipMat.opacity = 0.95;
      this.accent.color.setHex(WARN_EMISSIVE);
      this.accent.intensity = 14;
    } else {
      this.membrane.visible = true;
      this.membraneMat.color.setHex(FILL);
      this.membraneMat.opacity = 0.85;
      this.membraneMat.emissive.setHex(FILL_EMISSIVE);
      this.membraneMat.emissiveIntensity = 0.9;
      this.accent.color.setHex(FILL_EMISSIVE);
      this.accent.intensity = 11;
    }
    this.accent.position.set(0, 0, -1.05);
    this.group.userData.phase = state.phase;
  }

  dispose() {
    for (const g of this.geometries) g.dispose();
    this.membraneMat.dispose();
    this.rimLipMat.dispose();
    this.kit.dispose();
    this.group.clear();
    this.group.removeFromParent();
  }
}
