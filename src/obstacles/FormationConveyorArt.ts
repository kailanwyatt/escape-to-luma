import * as THREE from 'three';
import type { FormationConfig } from '../config/ObstacleConfig';
import { formationParts } from './FormationState';
import { createConveyorAsteroid } from './ConveyorAsteroidArt';
import { FacilityArtKit } from './FacilityArtKit';

/**
 * Cinematic asteroid conveyor — sculpted rocks stay inside hit radii.
 */
export class FormationConveyorArt {
  readonly group = new THREE.Group();
  private readonly kit = new FacilityArtKit({ cinematic: true });
  private readonly rocks: THREE.Mesh[] = [];
  private readonly glow: THREE.MeshStandardMaterial;
  private readonly accent: THREE.PointLight;
  private readonly centerY: number;
  private readonly direction: 1 | -1;

  constructor(private readonly config: FormationConfig) {
    this.group.name = 'formation-conveyor-art';
    this.centerY = config.centerY ?? 3;
    this.direction = config.direction ?? 1;
    this.glow = this.kit.lamp();
    this.glow.color.setHex(0x70e5ed);
    this.glow.emissive.setHex(0x3aa8b8);

    const seed = formationParts(config, 0);
    seed.forEach((p, i) => {
      const rock = createConveyorAsteroid(2.1 + i * 0.71 + (this.direction < 0 ? 3.3 : 0));
      rock.name = `conveyor-rock-${i}`;
      rock.scale.setScalar(p.radius || 0.5);
      this.group.add(rock);
      this.rocks.push(rock);
    });

    this.accent = new THREE.PointLight(0x70e5ed, 7, 10, 2);
    this.accent.name = 'conveyor-accent';
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
      rock.rotation.z = time * 0.55 * this.direction + i * 0.37;
      rock.rotation.x = Math.sin(time * 0.4 + i) * 0.12;
    });

    const pulse = 0.5 + 0.5 * Math.sin(time * 2.4);
    this.glow.emissiveIntensity = 0.45 + pulse * 0.4;
    this.accent.intensity = 6 + pulse * 4;
    this.accent.position.set(0, this.centerY, -1.1);
    this.group.userData.blockCount = parts.length;
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
