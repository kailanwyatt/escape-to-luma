import * as THREE from 'three';
import type { FormationConfig } from '../config/ObstacleConfig';
import { formationParts } from './FormationState';
import { FacilityArtKit } from './FacilityArtKit';

/**
 * Alternating blast doors — FacilityArtKit panels track FormationState openings;
 * amber leading seals teach which lane is about to slam.
 */
export class FormationAlternatingDoorsArt {
  readonly group = new THREE.Group();
  private readonly kit = new FacilityArtKit({ cinematic: true });
  private readonly panels: THREE.Group[] = [];
  private readonly bodies: THREE.Mesh[] = [];
  private readonly seals: THREE.MeshStandardMaterial[] = [];
  private readonly accent: THREE.PointLight;
  private readonly armor: THREE.MeshStandardMaterial;
  private readonly dark: THREE.MeshStandardMaterial;
  private readonly glow: THREE.MeshStandardMaterial;
  private readonly centerY: number;

  constructor(private readonly config: FormationConfig) {
    this.group.name = 'formation-alternating-doors-art';
    this.centerY = config.centerY ?? 3;
    this.armor = this.kit.metal(0x455868, 0.32);
    this.dark = this.kit.metal(0x0c141c, 0.6, false);
    this.glow = this.kit.lamp();
    this.glow.color.setHex(0x70e5ed);
    this.glow.emissive.setHex(0x3aa8b8);

    formationParts(config, 0).forEach((p, i) => {
      const panel = new THREE.Group();
      panel.name = `door-panel-${i}`;
      this.group.add(panel);
      this.panels.push(panel);

      const moving = i >= 5;
      const bodyMat = moving ? this.kit.metal(0x3a4d5c, 0.3) : this.armor;
      const body = this.kit.box(panel, 'door-body', 1, 1, 0.2, 0, 0, 0, bodyMat, moving ? 0.025 : 0.015);
      this.bodies.push(body);

      this.kit.box(panel, 'door-recess', 0.86, 0.9, 0.05, 0, 0, -0.08, this.dark, 0.01);
      if (moving) {
        for (let r = 0; r < 5; r++) {
          this.kit.box(panel, `door-rib-${r}`, 0.7, 0.04, 0.04, 0, -0.32 + r * 0.16, -0.12, this.armor, 0.006);
        }
        const seal = this.kit.lamp();
        seal.color.setHex(0xffb449);
        seal.emissive.setHex(0xffa12a);
        this.seals.push(seal);
        this.kit.box(panel, 'leading-seal', 0.92, 0.06, 0.04, 0, 0.42, -0.14, seal, 0.004);
        this.kit.box(panel, 'status-lamp', 0.1, 0.18, 0.03, 0, 0, -0.15, seal, 0.003);
      } else {
        this.kit.box(panel, 'frame-trim', 0.12, 0.9, 0.04, 0, 0, -0.12, this.glow, 0.004);
      }
      void p;
    });

    // Center throat guide between the two lanes.
    this.kit.box(this.group, 'door-gap-guide', 0.04, 3.6, 0.02, 0, this.centerY, -0.1, this.glow, 0);

    this.accent = new THREE.PointLight(0x70e5ed, 8, 10, 2);
    this.accent.name = 'doors-accent';
    this.group.add(this.accent);
    this.update(0);
  }

  update(time: number) {
    const parts = formationParts(this.config, time);
    let warn = false;
    parts.forEach((p, i) => {
      const panel = this.panels[i];
      if (!panel) return;
      panel.position.set(p.x, p.y, 0);
      panel.scale.set(Math.max(0.001, p.width), Math.max(0.001, p.height), 1);
      panel.visible = p.height > 0.002;
      if (p.warning) warn = true;
      const seal = panel.getObjectByName('leading-seal') as THREE.Mesh | undefined;
      const lamp = panel.getObjectByName('status-lamp') as THREE.Mesh | undefined;
      const teach = p.warning ? 0xffb449 : p.active ? 0xff7562 : 0x70e5ed;
      for (const mesh of [seal, lamp]) {
        const mat = mesh?.material as THREE.MeshStandardMaterial | undefined;
        if (!mat?.emissive) continue;
        mat.color.setHex(teach);
        mat.emissive.setHex(teach);
        mat.emissiveIntensity = p.warning ? 1.35 : p.active ? 0.9 : 0.55;
      }
    });
    const pulse = 0.75 + 0.35 * Math.sin(time * 2.4);
    this.glow.emissiveIntensity = pulse;
    this.accent.color.setHex(warn ? 0xffb449 : 0x70e5ed);
    this.accent.intensity = 6 + (warn ? 5 : 3) * pulse;
    this.accent.position.set(0, this.centerY, -1.05);
  }

  dispose() {
    this.kit.dispose();
    this.group.clear();
    this.group.removeFromParent();
  }
}
