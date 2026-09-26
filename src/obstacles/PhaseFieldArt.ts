import * as THREE from 'three';
import type { PhaseFieldConfig } from '../config/ObstacleConfig';
import { FacilityArtKit } from './FacilityArtKit';
import { phaseCycleT, phaseOpen } from './PhaseFieldState';

/**
 * Cinematic phase membrane — solid/ghost discs stay authoritative;
 * pods, accent, and warn ticks teach open vs sealed.
 */
export class PhaseFieldArt {
  readonly group = new THREE.Group();
  private readonly kit = new FacilityArtKit({ cinematic: true });
  private readonly solid: THREE.Mesh;
  private readonly ghost: THREE.Mesh;
  private readonly warning: THREE.Group;
  private readonly boundary: THREE.Mesh;
  private readonly accent: THREE.PointLight;
  private readonly solidUniforms = { intensity: { value: 1 }, time: { value: 0 } };
  private readonly boundaryMat: THREE.MeshStandardMaterial;
  private readonly warnMat: THREE.MeshStandardMaterial;
  private readonly ghostMat: THREE.MeshBasicMaterial;

  constructor(private readonly config: PhaseFieldConfig) {
    this.group.name = 'phase-field-art';
    const r = config.fieldRadius;

    this.solid = new THREE.Mesh(
      new THREE.CircleGeometry(1, 64),
      new THREE.ShaderMaterial({
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        uniforms: this.solidUniforms,
        vertexShader: `varying vec2 v;void main(){v=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader: `precision mediump float;varying vec2 v;uniform float intensity;uniform float time;
        void main(){float rad=length(v),a=atan(v.y,v.x);
          float threads=pow(.5+.5*sin(rad*72.+sin(a*9.)*2.6+time*.9),16.);
          float veins=pow(.5+.5*sin(a*19.+rad*11.+sin(rad*27.)),24.);
          float rim=smoothstep(.86,1.,rad);float energy=max(threads*.5,veins*.35)+rim*.7;
          vec3 c=mix(vec3(.42,.03,.14),vec3(1.,.48,.42),energy);
          gl_FragColor=vec4(c,(.16+energy*.68)*intensity);}`,
      }),
    );
    this.solid.name = 'phase-solid';
    this.solid.scale.setScalar(r);
    this.group.add(this.solid);

    this.ghostMat = new THREE.MeshBasicMaterial({
      color: 0x7ef0ff,
      transparent: true,
      opacity: 0.14,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    this.ghost = new THREE.Mesh(new THREE.CircleGeometry(1, 48), this.ghostMat);
    this.ghost.name = 'phase-ghost';
    this.ghost.position.z = 0.01;
    this.ghost.scale.setScalar(r);
    this.group.add(this.ghost);

    // Open-state crosshair so the passable disc never goes silent.
    for (const rot of [0, Math.PI / 2]) {
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.035, 0.02),
        this.ghostMat,
      );
      bar.name = `ghost-cross-${rot === 0 ? 'h' : 'v'}`;
      bar.rotation.z = rot;
      bar.position.z = 0.02;
      bar.scale.setScalar(r);
      this.group.add(bar);
    }

    this.warnMat = this.kit.lamp();
    this.warnMat.color.setHex(0xff8a7a);
    this.warnMat.emissive.setHex(0xff6a5a);
    this.warning = new THREE.Group();
    this.warning.name = 'phase-warning';
    const warnRing = new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.032, 8, 48), this.warnMat);
    warnRing.position.z = -0.02;
    this.warning.add(warnRing);
    for (let i = 0; i < 4; i++) {
      const tick = this.kit.box(this.warning, `warn-tick-${i}`, 0.08, 0.22, 0.02, 0, 0, -0.03, this.warnMat, 0.004);
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      tick.position.set(Math.cos(a) * 0.72, Math.sin(a) * 0.72, -0.03);
      tick.rotation.z = a;
    }
    this.warning.scale.setScalar(r);
    this.group.add(this.warning);

    this.boundaryMat = new THREE.MeshStandardMaterial({
      color: 0x98efdc,
      emissive: 0x3aa8b8,
      emissiveIntensity: 0.75,
      metalness: 0.12,
      roughness: 0.3,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    });
    this.boundary = new THREE.Mesh(new THREE.TorusGeometry(1, 0.022, 8, 64), this.boundaryMat);
    this.boundary.name = 'phase-boundary';
    this.boundary.scale.setScalar(r);
    this.group.add(this.boundary);

    const dark = this.kit.metal(0x0e141c, 0.65, false);
    const collar = this.kit.metal(0x8aa0b0, 0.28);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      this.kit.box(
        this.group,
        `phase-pod-${i}`,
        0.22,
        0.15,
        0.18,
        Math.cos(a) * (r + 0.1),
        Math.sin(a) * (r + 0.1),
        0.02,
        dark,
        0.006,
      );
      this.kit.box(
        this.group,
        `phase-pod-collar-${i}`,
        0.12,
        0.08,
        0.04,
        Math.cos(a) * (r + 0.1),
        Math.sin(a) * (r + 0.1),
        -0.06,
        collar,
        0.004,
      );
      this.kit.box(
        this.group,
        `phase-pod-lamp-${i}`,
        0.08,
        0.05,
        0.03,
        Math.cos(a) * (r + 0.1),
        Math.sin(a) * (r + 0.1),
        -0.1,
        this.warnMat,
        0.003,
      );
      this.group.getObjectByName(`phase-pod-${i}`)!.rotation.z = a;
      this.group.getObjectByName(`phase-pod-collar-${i}`)!.rotation.z = a;
      this.group.getObjectByName(`phase-pod-lamp-${i}`)!.rotation.z = a;
    }

    this.accent = new THREE.PointLight(0xff806f, 9, 10, 2);
    this.accent.name = 'phase-field-accent';
    this.group.add(this.accent);
    this.update(0);
  }

  get open() {
    return phaseOpen(this.config, this.solidUniforms.time.value);
  }

  update(time: number) {
    const open = phaseOpen(this.config, time);
    const cycle = phaseCycleT(this.config, time);
    const ratio = this.config.openRatio ?? 0.45;
    // Amber telegraph in the last ~12% of the open window.
    const closingSoon = open && cycle > ratio - 0.12;

    this.solidUniforms.time.value = time;
    this.solidUniforms.intensity.value = open ? 0 : 1;
    this.solid.visible = !open;
    this.ghost.visible = open;
    for (const name of ['ghost-cross-h', 'ghost-cross-v']) {
      const cross = this.group.getObjectByName(name);
      if (cross) cross.visible = open;
    }
    this.warning.visible = !open || closingSoon;
    if (closingSoon) {
      this.warnMat.color.setHex(0xffb449);
      this.warnMat.emissive.setHex(0xffa12a);
      this.warnMat.emissiveIntensity = 1.1 + 0.4 * Math.sin(time * 8);
    } else if (!open) {
      this.warnMat.color.setHex(0xff8a7a);
      this.warnMat.emissive.setHex(0xff6a5a);
      this.warnMat.emissiveIntensity = 0.95;
    }

    const teach = open ? (closingSoon ? 0xffb449 : 0x7ef0ff) : 0xff806f;
    this.boundaryMat.color.setHex(teach);
    this.boundaryMat.emissive.setHex(teach);
    this.boundaryMat.emissiveIntensity = open ? (closingSoon ? 1.15 : 0.65) : 0.95;
    this.boundaryMat.opacity = open ? 0.45 : 0.8;

    this.accent.color.setHex(teach);
    this.accent.intensity = open ? (closingSoon ? 12 : 6) : 11;
    this.accent.position.set(0, 0, -1.05);
    this.group.userData.open = open;
  }

  dispose() {
    this.solid.geometry.dispose();
    if (this.solid.material instanceof THREE.Material) this.solid.material.dispose();
    this.ghost.geometry.dispose();
    this.ghostMat.dispose();
    this.boundary.geometry.dispose();
    this.boundaryMat.dispose();
    this.kit.dispose();
    this.group.clear();
    this.group.removeFromParent();
  }
}
