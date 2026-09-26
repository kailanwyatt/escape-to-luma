import * as THREE from 'three';
import type { DriftingBlockerConfig } from '../config/ObstacleConfig';
import { createConveyorAsteroid } from './ConveyorAsteroidArt';
import { FacilityArtKit } from './FacilityArtKit';

function localDrift(config: DriftingBlockerConfig, time: number) {
  const t = time * config.speed + (config.phase ?? 0);
  return {
    x: Math.sin(t) * config.amplitudeX,
    y: Math.cos(t * 0.85) * config.amplitudeY,
    angle: t,
  };
}

/**
 * Cinematic drifting debris — sculpted rock stays inside the hit disk.
 * Path ellipse is a faint cue only; no hub square / wake bar / vein slabs.
 */
export class DriftingBlockerArt {
  readonly group = new THREE.Group();
  private readonly kit = new FacilityArtKit({ cinematic: true });
  private readonly rock: THREE.Mesh;
  private readonly glow: THREE.MeshStandardMaterial;
  private readonly accent: THREE.PointLight;
  private readonly path: THREE.Line;
  private readonly ampX: number;
  private readonly ampY: number;

  constructor(private readonly config: DriftingBlockerConfig) {
    this.group.name = 'drifting-blocker-art';
    this.ampX = Math.max(0.05, config.amplitudeX);
    this.ampY = Math.max(0.05, config.amplitudeY);
    this.glow = this.kit.lamp();
    this.glow.color.setHex(0xff8a4a);
    this.glow.emissive.setHex(0xff6a2a);
    this.glow.emissiveIntensity = 0.35;

    this.rock = createConveyorAsteroid(3.7 + config.blockerRadius * 11 + (config.phase ?? 0));
    this.rock.name = 'drift-rock';
    this.rock.scale.setScalar(config.blockerRadius);
    this.group.add(this.rock);

    // Faint path ellipse only — no hub ring, wake bar, or glow veins.
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 64; i++) {
      const u = (i / 64) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.sin(u) * this.ampX, Math.cos(u * 0.85) * this.ampY, 0.05));
    }
    const pathGeo = new THREE.BufferGeometry().setFromPoints(pts);
    this.path = new THREE.Line(
      pathGeo,
      new THREE.LineBasicMaterial({
        color: 0xff8a4a,
        transparent: true,
        opacity: 0.14,
        depthWrite: false,
      }),
    );
    this.path.name = 'drift-path';
    this.group.add(this.path);

    this.accent = new THREE.PointLight(0xff8a4a, 4, 7, 2);
    this.accent.name = 'drift-accent';
    this.group.add(this.accent);
    this.update(0);
  }

  update(time: number) {
    const pos = localDrift(this.config, time);
    const r = this.config.blockerRadius;
    this.rock.position.set(pos.x, pos.y, 0);
    this.rock.rotation.z = pos.angle * 0.35;
    this.rock.rotation.x = Math.sin(pos.angle * 0.7) * 0.15;
    this.rock.scale.setScalar(r);

    const pulse = 0.8 + 0.3 * Math.sin(time * 2.1);
    this.glow.emissiveIntensity = 0.25 + 0.2 * pulse;
    this.accent.intensity = 3.5 + 2 * pulse;
    this.accent.position.set(pos.x, pos.y, -1.0);
  }

  dispose() {
    this.rock.geometry.dispose();
    if (this.rock.material instanceof THREE.Material) this.rock.material.dispose();
    this.path.geometry.dispose();
    if (this.path.material instanceof THREE.Material) this.path.material.dispose();
    this.kit.dispose();
    this.group.clear();
    this.group.removeFromParent();
  }
}
