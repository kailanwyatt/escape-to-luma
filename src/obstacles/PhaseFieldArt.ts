import * as THREE from 'three';
import type { PhaseFieldConfig } from '../config/ObstacleConfig';
import { FacilityArtKit } from './FacilityArtKit';
import { phaseCycleT, phaseOpen } from './PhaseFieldState';

/**
 * Cinematic phase membrane — solid/ghost discs stay authoritative.
 * Open vs sealed is read from the membrane itself (no teach rings/pods).
 */
export class PhaseFieldArt {
  readonly group = new THREE.Group();
  private readonly kit = new FacilityArtKit({ cinematic: true });
  private readonly solid: THREE.Mesh;
  private readonly ghost: THREE.Mesh;
  private readonly accent: THREE.PointLight;
  private readonly solidUniforms = { intensity: { value: 1 }, time: { value: 0 } };
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
    const closingSoon = open && cycle > ratio - 0.12;

    this.solidUniforms.time.value = time;
    this.solidUniforms.intensity.value = open ? 0 : 1;
    this.solid.visible = !open;
    this.ghost.visible = open;

    const teach = open ? (closingSoon ? 0xffb449 : 0x7ef0ff) : 0xff806f;
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
    this.kit.dispose();
    this.group.clear();
    this.group.removeFromParent();
  }
}
