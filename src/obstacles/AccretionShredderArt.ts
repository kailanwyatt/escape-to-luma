import * as THREE from 'three';
import type { AccretionShredderConfig } from '../config/ObstacleConfig';
import { accretionDebrisAtTime } from './StoryLibraryState';
import { createConveyorAsteroid } from './ConveyorAsteroidArt';
import { FacilityArtKit } from './FacilityArtKit';

/**
 * Accretion shredder — sculpted shards on the spiral;
 * quiet-center hub teaches the throw corridor.
 */
export class AccretionShredderArt {
  readonly group = new THREE.Group();
  private readonly kit = new FacilityArtKit({ cinematic: true });
  private readonly rocks: THREE.Mesh[] = [];
  private readonly glow: THREE.MeshStandardMaterial;
  private readonly halo: THREE.Mesh;
  private readonly accent: THREE.PointLight;
  private readonly count: number;

  constructor(private readonly config: AccretionShredderConfig) {
    this.group.name = 'accretion-shredder-art';
    this.count = Math.max(4, Math.floor(config.debrisCount));
    this.glow = this.kit.lamp();
    this.glow.color.setHex(0xff8a4a);
    this.glow.emissive.setHex(0xff6a2a);

    for (let i = 0; i < this.count; i++) {
      const rock = createConveyorAsteroid(6.4 + i * 0.91);
      rock.name = `rock-shard-${i}`;
      rock.scale.setScalar(config.debrisRadius);
      this.group.add(rock);
      this.rocks.push(rock);
    }

    this.halo = new THREE.Mesh(
      new THREE.TorusGeometry(config.outerRadius * 0.55, 0.022, 8, 64),
      this.glow,
    );
    this.halo.name = 'accretion-halo';
    this.halo.position.set(config.centerX, config.centerY, -0.06);
    this.group.add(this.halo);

    this.kit.box(
      this.group,
      'quiet-hub',
      0.16,
      0.16,
      0.04,
      config.centerX,
      config.centerY,
      0.04,
      this.glow,
      0.006,
    );

    this.accent = new THREE.PointLight(0xff8a4a, 8, 11, 2);
    this.accent.name = 'accretion-accent';
    this.group.add(this.accent);
    this.update(0);
  }

  update(time: number) {
    const debris = accretionDebrisAtTime(this.config, time);
    let avgR = 0;
    debris.forEach((b, i) => {
      const rock = this.rocks[i];
      if (!rock) return;
      rock.visible = true;
      rock.position.set(b.x, b.y, 0);
      rock.scale.setScalar(b.radius);
      rock.rotation.z = time * 0.55 + i;
      rock.rotation.x = Math.sin(time * 0.4 + i) * 0.2;
      avgR += Math.hypot(b.x - this.config.centerX, b.y - this.config.centerY);
    });
    for (let i = debris.length; i < this.rocks.length; i++) {
      this.rocks[i].visible = false;
    }
    avgR /= Math.max(1, debris.length);
    this.halo.scale.setScalar(Math.max(0.4, avgR / Math.max(0.2, this.config.outerRadius * 0.55)));
    const pulse = 0.75 + 0.35 * Math.sin(time * 2.5);
    this.glow.emissiveIntensity = pulse;
    this.accent.intensity = 6 + 4 * pulse;
    this.accent.position.set(this.config.centerX, this.config.centerY, -1.05);
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
