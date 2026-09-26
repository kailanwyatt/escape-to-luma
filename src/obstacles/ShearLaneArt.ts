import * as THREE from 'three';
import type { ShearLaneConfig } from '../config/ObstacleConfig';
import { createConveyorAsteroid } from './ConveyorAsteroidArt';
import { shearLaneBlocksAtTime } from './ShearLaneState';
import { FacilityArtKit } from './FacilityArtKit';

/**
 * Cinematic shear lane — two opposing debris currents.
 * Block circles stay authoritative; rock meshes are scaled silhouettes.
 */
export class ShearLaneArt {
  readonly group = new THREE.Group();
  private readonly kit = new FacilityArtKit({ cinematic: true });
  private readonly rocks: THREE.Mesh[] = [];
  private readonly glow: THREE.MeshStandardMaterial;
  private readonly accent: THREE.PointLight;

  constructor(private readonly config: ShearLaneConfig) {
    this.group.name = 'shear-lane-art';
    this.glow = this.kit.lamp();
    this.glow.color.setHex(0xffb449);
    this.glow.emissive.setHex(0xffa12a);

    const seedBlocks = shearLaneBlocksAtTime(config, 0);
    seedBlocks.forEach((b, i) => {
      const rock = createConveyorAsteroid(1.7 + i * 0.73 + b.stream * 0.4);
      rock.name = `shear-rock-${i}`;
      rock.scale.setScalar(b.radius);
      this.group.add(rock);
      this.rocks.push(rock);
    });

    this.accent = new THREE.PointLight(0xffb449, 8, 11, 2);
    this.accent.name = 'shear-accent';
    this.group.add(this.accent);
    this.update(0);
  }

  update(time: number) {
    const blocks = shearLaneBlocksAtTime(this.config, time);
    blocks.forEach((b, i) => {
      const rock = this.rocks[i];
      if (!rock) return;
      rock.position.set(b.x, b.y, 0);
      rock.rotation.z = time * 0.35 * b.stream + i * 0.4;
      rock.scale.setScalar(b.radius);
    });

    const pulse = 0.5 + 0.5 * Math.sin(time * 2.2);
    this.glow.emissiveIntensity = 0.55 + pulse * 0.35;
    this.accent.intensity = 7 + pulse * 4;
    this.accent.position.set(this.config.centerX, this.config.centerY, -1.15);
    this.group.userData.blockCount = blocks.length;
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
