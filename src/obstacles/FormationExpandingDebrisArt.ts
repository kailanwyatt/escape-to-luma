import * as THREE from 'three';
import type { FormationConfig } from '../config/ObstacleConfig';
import { formationParts } from './FormationState';
import { createConveyorAsteroid } from './ConveyorAsteroidArt';
import { FacilityArtKit } from './FacilityArtKit';

/**
 * Expanding debris ring — sculpted rocks stay inside hit radii.
 */
export class FormationExpandingDebrisArt {
  readonly group = new THREE.Group();
  private readonly kit = new FacilityArtKit({ cinematic: true });
  private readonly rocks: THREE.Mesh[] = [];
  private readonly accent: THREE.PointLight;
  private readonly centerY: number;

  constructor(private readonly config: FormationConfig) {
    this.group.name = 'formation-expanding-debris-art';
    this.centerY = config.centerY ?? 3;

    formationParts(config, 0).forEach((p, i) => {
      const rock = createConveyorAsteroid(4.2 + i * 0.83);
      rock.name = `expand-rock-${i}`;
      rock.scale.setScalar(p.radius || 0.48);
      this.group.add(rock);
      this.rocks.push(rock);
    });

    this.accent = new THREE.PointLight(0xff8a4a, 7, 10, 2);
    this.accent.name = 'expand-accent';
    this.group.add(this.accent);
    this.update(0);
  }

  update(time: number) {
    const parts = formationParts(this.config, time);
    parts.forEach((p, i) => {
      const rock = this.rocks[i];
      if (!rock || !p.radius) return;
      rock.position.set(p.x, p.y, 0);
      rock.scale.setScalar(p.radius);
      rock.rotation.z = time * 0.25 * (i % 2 ? 1 : -1) + i;
      rock.rotation.x = Math.sin(time * 0.4 + i) * 0.1;
    });
    const pulse = 0.75 + 0.35 * Math.sin(time * 2.2);
    this.accent.intensity = 6 + 3 * pulse;
    this.accent.position.set(0, this.centerY, -1.05);
  }

  dispose() {
    for (const rock of this.rocks) {
      rock.geometry.dispose();
      if (rock.material instanceof THREE.Material) rock.material.dispose();
    }
    this.kit.dispose();
    this.group.clear();
    this.group.removeFromParent();
  }
}
