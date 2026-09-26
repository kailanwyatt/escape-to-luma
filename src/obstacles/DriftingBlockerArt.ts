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
 * Cinematic drifting debris — sculpted rock stays inside the hit disk;
 * path ellipse / wake / hub teach the route without inventing collision.
 */
export class DriftingBlockerArt {
  readonly group = new THREE.Group();
  private readonly kit = new FacilityArtKit({ cinematic: true });
  private readonly rock: THREE.Mesh;
  private readonly wake: THREE.Mesh;
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

    this.rock = createConveyorAsteroid(3.7 + config.blockerRadius * 11 + (config.phase ?? 0));
    this.rock.name = 'drift-rock';
    this.rock.scale.setScalar(config.blockerRadius);
    this.group.add(this.rock);

    // Mineral fracture veins — stay inside unit disk after rock scale.
    for (let i = 0; i < 3; i++) {
      const a = i * 2.1 + 0.4;
      this.kit.box(
        this.group,
        `drift-vein-${i}`,
        config.blockerRadius * 0.55,
        config.blockerRadius * 0.06,
        config.blockerRadius * 0.04,
        Math.cos(a) * config.blockerRadius * 0.35,
        Math.sin(a) * config.blockerRadius * 0.35,
        -config.blockerRadius * 0.55,
        this.glow,
        0.004,
      );
    }

    this.wake = this.kit.box(
      this.group,
      'drift-wake',
      config.blockerRadius * 1.5,
      config.blockerRadius * 0.22,
      0.03,
      0,
      0,
      config.blockerRadius * 0.4,
      this.glow,
      0.002,
    );

    // Drift path ellipse — faint teach of the full travel envelope.
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
        opacity: 0.22,
        depthWrite: false,
      }),
    );
    this.path.name = 'drift-path';
    this.group.add(this.path);

    // Hub at rest center — the eye of the drift path.
    this.kit.box(this.group, 'drift-hub', 0.1, 0.1, 0.03, 0, 0, 0.04, this.glow, 0.004);

    this.accent = new THREE.PointLight(0xff8a4a, 6, 8, 2);
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

    // Wake opposite instantaneous velocity on the Lissajous path.
    const dt = 0.05;
    const next = localDrift(this.config, time + dt);
    const vx = next.x - pos.x;
    const vy = next.y - pos.y;
    const speed = Math.hypot(vx, vy) || 1;
    const bx = -vx / speed;
    const by = -vy / speed;
    this.wake.position.set(pos.x + bx * r * 0.95, pos.y + by * r * 0.95, r * 0.35);
    this.wake.rotation.z = Math.atan2(by, bx);
    this.wake.scale.set(r * 1.25, r * 0.2, 1);

    for (let i = 0; i < 3; i++) {
      const vein = this.group.getObjectByName(`drift-vein-${i}`);
      if (!vein) continue;
      const a = i * 2.1 + 0.4 + pos.angle * 0.2;
      vein.position.set(
        pos.x + Math.cos(a) * r * 0.35,
        pos.y + Math.sin(a) * r * 0.35,
        -r * 0.55,
      );
      vein.rotation.z = a;
    }

    const pulse = 0.8 + 0.3 * Math.sin(time * 2.1);
    this.glow.emissiveIntensity = pulse;
    this.accent.intensity = 5 + 3 * pulse;
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
