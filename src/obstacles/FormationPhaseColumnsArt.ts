import * as THREE from 'three';
import type { FormationConfig } from '../config/ObstacleConfig';
import { formationParts } from './FormationState';
import { FacilityArtKit } from './FacilityArtKit';

/**
 * Phase columns — FacilityArtKit housings with energy faces;
 * solid/ghost opacity still mirrors FormationState.active.
 */
export class FormationPhaseColumnsArt {
  readonly group = new THREE.Group();
  private readonly kit = new FacilityArtKit({ cinematic: true });
  private readonly columns: THREE.Group[] = [];
  private readonly bodies: THREE.Mesh[] = [];
  private readonly fields: THREE.Mesh[] = [];
  private readonly accent: THREE.PointLight;
  private readonly railGlow: THREE.MeshStandardMaterial;
  private readonly centerY: number;

  constructor(private readonly config: FormationConfig) {
    this.group.name = 'formation-phase-columns-art';
    this.centerY = config.centerY ?? 3;
    this.railGlow = this.kit.lamp();
    this.railGlow.color.setHex(0xe45eff);
    this.railGlow.emissive.setHex(0x9a3dff);

    formationParts(config, 0).forEach((_, i) => {
      const col = new THREE.Group();
      col.name = `phase-column-${i}`;
      this.group.add(col);
      this.columns.push(col);

      // Unique body material so active/ghost opacity does not leak across columns.
      const armor = this.kit.metal(0x3a2a55, 0.35);
      const dark = this.kit.metal(0x12182a, 0.55, false);
      const energy = this.kit.lamp();
      energy.color.setHex(0xe45eff);
      energy.emissive.setHex(0x9a3dff);

      const body = this.kit.box(col, 'column-body', 1, 1, 0.22, 0, 0, 0, armor, 0.03);
      body.userData.armor = armor;
      body.userData.dark = dark;
      this.bodies.push(body);
      this.kit.box(col, 'column-frame', 1.05, 1.02, 0.08, 0, 0, 0.12, dark, 0.01);

      const field = new THREE.Mesh(
        new THREE.PlaneGeometry(0.94, 0.96),
        new THREE.ShaderMaterial({
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          uniforms: { time: { value: 0 }, strength: { value: 1 } },
          vertexShader:
            'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
          fragmentShader:
            'varying vec2 v;uniform float time;uniform float strength;void main(){float bands=pow(.5+.5*sin(v.y*95.-time*3.+sin(v.x*20.+time)*2.),9.);float edge=pow(abs(v.x-.5)*2.,5.);gl_FragColor=vec4(.55,.32,1.,(bands*.3+edge*.72)*strength);}',
        }),
      );
      field.name = 'phase-energy';
      field.position.z = -0.14;
      col.add(field);
      this.fields.push(field);

      this.kit.box(col, 'column-lamp', 0.08, 0.7, 0.04, 0, 0, -0.16, energy, 0.004);
    });

    this.kit.box(this.group, 'columns-rail-top', 5.2, 0.06, 0.04, 0, this.centerY + 2.35, -0.1, this.railGlow, 0);
    this.kit.box(this.group, 'columns-rail-bot', 5.2, 0.06, 0.04, 0, this.centerY - 2.35, -0.1, this.railGlow, 0);

    this.accent = new THREE.PointLight(0xe45eff, 8, 11, 2);
    this.accent.name = 'phase-columns-accent';
    this.group.add(this.accent);
    this.update(0);
  }

  update(time: number) {
    const parts = formationParts(this.config, time);
    let activeCount = 0;
    parts.forEach((p, i) => {
      const col = this.columns[i];
      const body = this.bodies[i];
      const field = this.fields[i];
      if (!col || !body) return;
      col.position.set(p.x, p.y, 0);
      col.scale.set(p.width, p.height, 1);
      col.visible = p.height > 0.002;

      const armor = body.userData.armor as THREE.MeshStandardMaterial;
      const dark = body.userData.dark as THREE.MeshStandardMaterial;
      const mat = p.active ? armor : dark;
      body.material = mat;
      mat.transparent = !p.active;
      mat.opacity = p.active ? 1 : 0.1;
      mat.depthWrite = p.active;

      if (field) {
        const shader = field.material as THREE.ShaderMaterial;
        shader.uniforms.time.value = time;
        shader.uniforms.strength.value = p.active ? 1 : 0;
      }
      if (p.active) activeCount += 1;

      const lamp = col.getObjectByName('column-lamp') as THREE.Mesh | undefined;
      const lampMat = lamp?.material as THREE.MeshStandardMaterial | undefined;
      if (lampMat) {
        lampMat.color.setHex(p.warning ? 0xffbd52 : p.active ? 0xe45eff : 0x334455);
        lampMat.emissive.setHex(p.warning ? 0xffbd52 : p.active ? 0x9a3dff : 0x111822);
        lampMat.emissiveIntensity = p.warning ? 1.3 : p.active ? 1 : 0.2;
      }
    });
    const pulse = 0.8 + 0.3 * Math.sin(time * 2.6);
    this.railGlow.emissiveIntensity = pulse;
    this.accent.intensity = 5 + activeCount * 1.2 + pulse * 2;
    this.accent.position.set(0, this.centerY, -1.1);
  }

  dispose() {
    for (const field of this.fields) {
      field.geometry.dispose();
      if (field.material instanceof THREE.Material) field.material.dispose();
    }
    this.kit.dispose();
    this.group.clear();
    this.group.removeFromParent();
  }
}
