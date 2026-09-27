import { disposeThreeObject } from '../utils/disposeThree';
import * as THREE from 'three';

export type Well = { x: number; y: number; z: number; strength: number; radius: number };

/**
 * Readable gravity / repulsor volumes — outer radius ring, warp haze, drifting packets.
 * Matches well.radius used by physics; trajectory preview stays authoritative.
 */
export class GravityWellField {
  readonly group = new THREE.Group();
  private readonly wells: THREE.Group[] = [];
  private readonly animated: THREE.Object3D[] = [];
  private readonly hazeTemplate: THREE.ShaderMaterial;

  constructor() {
    this.group.name = 'gravity-well-field';
    this.hazeTemplate = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms: {
        color: { value: new THREE.Color(0x57cfff) },
        intensity: { value: 0.35 },
        time: { value: 0 },
      },
      vertexShader: `
        varying vec2 tex;
        void main() {
          tex = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        precision mediump float;
        varying vec2 tex;
        uniform vec3 color;
        uniform float intensity;
        uniform float time;
        void main() {
          vec2 p = tex * 2.0 - 1.0;
          float r = length(p);
          float rim = smoothstep(1.0, 0.72, r) * smoothstep(0.15, 0.55, r);
          float swirl = 0.55 + 0.45 * sin(atan(p.y, p.x) * 5.0 - time * 1.4);
          float core = exp(-r * r * 6.0) * 0.35;
          float alpha = (rim * swirl * 0.55 + core) * intensity;
          gl_FragColor = vec4(color, alpha);
        }`,
    });
  }

  setWells(wells: Well[], options?: { showForceVectors?: boolean }): void {
    this.clear();
    const enhanced = Boolean(options?.showForceVectors);
    for (const well of wells) {
      this.buildWell(well, enhanced);
    }
    this.group.visible = wells.length > 0;
  }

  update(time: number, reduceMotion: boolean): void {
    this.hazeTemplate.uniforms.time.value = reduceMotion ? 0 : time;
    for (const well of this.wells) {
      well.traverse((obj) => {
        const mat = (obj as THREE.Mesh).material;
        if (mat && (mat as THREE.ShaderMaterial).uniforms?.time) {
          (mat as THREE.ShaderMaterial).uniforms.time.value = reduceMotion ? 0 : time;
        }
      });
    }
    if (!this.group.visible) return;

    for (const part of this.animated) {
      const data = part.userData;
      if (data.kind === 'ring') {
        part.rotation.z = reduceMotion ? data.baseRot : time * data.spin + data.baseRot;
        const pulse = reduceMotion ? 1 : 1 + Math.sin(time * 1.7 + data.phase) * 0.05;
        part.scale.setScalar(pulse);
      } else if (data.kind === 'packet') {
        const orbit = data.orbit as number;
        const sign = data.flow as number;
        const angle = reduceMotion ? data.phase : time * data.spin + data.phase;
        const breathe = reduceMotion ? 0 : Math.sin(time * 2.2 + data.phase) * 0.08;
        const r = orbit * (1 + breathe * sign);
        part.position.set(Math.cos(angle) * r, Math.sin(angle) * r, 0);
      } else if (data.kind === 'haze') {
        const pulse = reduceMotion ? 1 : 1 + Math.sin(time * 1.3 + data.phase) * 0.04;
        part.scale.setScalar(data.baseScale * pulse);
      }
    }
  }

  dispose(): void {
    this.clear();
    this.hazeTemplate.dispose();
  }

  private buildWell(well: Well, enhanced: boolean): void {
    const root = new THREE.Group();
    root.position.set(well.x, well.y, well.z);
    root.name = 'gravity-well';

    const attract = well.strength >= 0;
    const mag = Math.min(1.6, 0.35 + Math.abs(well.strength) * 0.08);
    const cool = attract ? 0x57cfff : 0xff8a40;
    const hot = attract ? 0xb889ff : 0xffb070;
    const rim = attract ? 0x9de9ff : 0xffd0a0;

    const hazeMat = this.hazeTemplate.clone();
    hazeMat.uniforms.color.value = new THREE.Color(cool);
    hazeMat.uniforms.intensity.value = (enhanced ? 0.48 : 0.34) * mag;
    // Own time uniform — never share with the template. disposeThreeObject would
    // otherwise leave the template pointing at a disposed program's uniform bag.
    hazeMat.uniforms.time = { value: this.hazeTemplate.uniforms.time.value };
    const haze = new THREE.Mesh(new THREE.CircleGeometry(1, 48), hazeMat);
    haze.scale.setScalar(well.radius);
    haze.userData = { kind: 'haze', baseScale: well.radius, phase: well.x + well.z };
    haze.position.z = 0.02;
    root.add(haze);
    this.animated.push(haze);

    const bands = [
      { u: 1, tube: enhanced ? 0.04 : 0.032, color: rim, opacity: 0.55 * mag },
      { u: 0.62, tube: enhanced ? 0.028 : 0.022, color: cool, opacity: 0.4 * mag },
      { u: 0.32, tube: enhanced ? 0.024 : 0.018, color: hot, opacity: 0.36 * mag },
    ];
    bands.forEach((band, index) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(Math.max(0.08, well.radius * band.u), band.tube, 8, 48),
        new THREE.MeshBasicMaterial({
          color: band.color,
          transparent: true,
          opacity: band.opacity,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      ring.userData = {
        kind: 'ring',
        spin: (0.1 + index * 0.07) * (attract ? 1 : -1) * (0.7 + mag * 0.4),
        phase: index * 1.7 + well.y,
        baseRot: 0,
      };
      root.add(ring);
      this.animated.push(ring);
    });

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(enhanced ? 0.11 : 0.085, 12, 10),
      new THREE.MeshBasicMaterial({
        color: hot,
        transparent: true,
        opacity: 0.75 * mag,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    core.position.z = -0.02;
    root.add(core);

    const packetCount = enhanced ? 8 : 5;
    for (let i = 0; i < packetCount; i++) {
      const packet = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 8, 6),
        new THREE.MeshBasicMaterial({
          color: i % 2 ? rim : cool,
          transparent: true,
          opacity: 0.7,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      const orbit = well.radius * (0.28 + (i / packetCount) * 0.62);
      packet.userData = {
        kind: 'packet',
        orbit,
        phase: (i / packetCount) * Math.PI * 2,
        spin: (attract ? 0.55 : -0.55) * (0.8 + mag * 0.35),
        flow: attract ? -1 : 1,
      };
      packet.position.set(orbit, 0, 0);
      root.add(packet);
      this.animated.push(packet);
    }

    if (enhanced) {
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const tick = new THREE.Mesh(
          new THREE.PlaneGeometry(0.28, 0.06),
          new THREE.MeshBasicMaterial({
            color: rim,
            transparent: true,
            opacity: 0.55,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide,
          }),
        );
        const r = well.radius * 0.78;
        tick.position.set(Math.cos(a) * r, Math.sin(a) * r, -0.04);
        tick.rotation.z = a + (attract ? Math.PI : 0);
        root.add(tick);
      }
    }

    this.group.add(root);
    this.wells.push(root);
  }

  private clear(): void {
    for (const well of this.wells) {
      this.group.remove(well);
      // Detach first; dispose after remove so the renderer isn't still sampling
      // these buffers mid-frame on Metal (iOS).
      disposeThreeObject(well);
    }
    this.wells.length = 0;
    this.animated.length = 0;
    this.group.visible = false;
  }
}
