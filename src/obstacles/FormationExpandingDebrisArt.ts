import * as THREE from 'three';
import type { FormationConfig } from '../config/ObstacleConfig';
import { formationParts } from './FormationState';
import { createConveyorAsteroid } from './ConveyorAsteroidArt';
import { FacilityArtKit } from './FacilityArtKit';

/**
 * Expanding debris ring — sculpted rocks stay inside hit radii;
 * expansion halo teaches the breathing corridor at center.
 */
export class FormationExpandingDebrisArt {
  readonly group = new THREE.Group();
  private readonly kit = new FacilityArtKit({ cinematic: true });
  private readonly rocks: THREE.Mesh[] = [];
  private readonly glow: THREE.MeshStandardMaterial;
  private readonly halo: THREE.Mesh;
  private readonly accent: THREE.PointLight;
  private readonly centerY: number;

  constructor(private readonly config: FormationConfig) {
    this.group.name = 'formation-expanding-debris-art';
    this.centerY = config.centerY ?? 3;
    this.glow = this.kit.lamp();
    this.glow.color.setHex(0xff8a4a);
    this.glow.emissive.setHex(0xff6a2a);

    formationParts(config, 0).forEach((p, i) => {
      const rock = createConveyorAsteroid(4.2 + i * 0.83);
      rock.name = `expand-rock-${i}`;
      rock.scale.setScalar(p.radius || 0.48);
      this.group.add(rock);
      this.rocks.push(rock);
    });

    this.halo = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.025, 8, 64),
      this.glow,
    );
    this.halo.name = 'expand-halo';
    this.halo.position.set(0, this.centerY, -0.08);
    this.group.add(this.halo);

    this.kit.box(this.group, 'expand-hub', 0.14, 0.14, 0.04, 0, this.centerY, 0.04, this.glow, 0.006);

    this.accent = new THREE.PointLight(0xff8a4a, 7, 10, 2);
    this.accent.name = 'expand-accent';
    this.group.add(this.accent);
    this.update(0);
  }

  update(time: number) {
    const parts = formationParts(this.config, time);
    let avgR = 0;
    parts.forEach((p, i) => {
      const rock = this.rocks[i];
      if (!rock || !p.radius) return;
      rock.position.set(p.x, p.y, 0);
      rock.scale.setScalar(p.radius);
      rock.rotation.z = time * 0.25 * (i % 2 ? 1 : -1) + i;
      rock.rotation.x = Math.sin(time * 0.4 + i) * 0.1;
      avgR += Math.hypot(p.x, p.y - this.centerY);
    });
    avgR /= Math.max(1, parts.length);
    this.halo.scale.setScalar(Math.max(0.35, avgR));
    const pulse = 0.75 + 0.35 * Math.sin(time * 2.2);
    this.glow.emissiveIntensity = pulse;
    this.accent.intensity = 6 + 3 * pulse;
    this.accent.position.set(0, this.centerY, -1.05);
  }

  dispose() {
    for (const rock of this.rocks) {
      rock.geometry.dispose();
      if (rock.material instanceof THREE.Material) rock.material.dispose();
    }
    this.halo.geometry.dispose();
    this.kit.dispose();
    this.group.clear();
    this.group.removeFromParent();
  }
}
