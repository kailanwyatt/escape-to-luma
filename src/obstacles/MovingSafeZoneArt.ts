import * as THREE from 'three';
import type { MovingSafeZoneConfig } from '../config/ObstacleConfig';
import { movingSafeZoneHoleAtTime } from './StoryLibraryState';
import { FacilityArtKit } from './FacilityArtKit';
import { createConveyorAsteroid } from './ConveyorAsteroidArt';

/**
 * Moving wreck pocket — field edge + drifting safe hole;
 * debris crumbs decorate the dangerous annulus without changing collision.
 */
export class MovingSafeZoneArt {
  readonly group = new THREE.Group();
  private readonly kit = new FacilityArtKit({ cinematic: true });
  private readonly holeLip: THREE.Mesh;
  private readonly fieldEdge: THREE.Mesh;
  private readonly pocket: THREE.Mesh;
  private readonly wake: THREE.Mesh;
  private readonly crumbs: THREE.Mesh[] = [];
  private readonly glow: THREE.MeshStandardMaterial;
  private readonly accent: THREE.PointLight;

  constructor(private readonly config: MovingSafeZoneConfig) {
    this.group.name = 'moving-safe-zone-art';
    this.glow = this.kit.lamp();
    this.glow.color.setHex(0xffd08a);
    this.glow.emissive.setHex(0xffb449);

    this.fieldEdge = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.028, 8, 64),
      this.kit.metal(0xb89a78, 0.35),
    );
    this.fieldEdge.name = 'field-edge';
    this.fieldEdge.position.set(config.centerX, config.centerY, 0);
    this.fieldEdge.scale.setScalar(config.fieldRadius);
    this.group.add(this.fieldEdge);

    this.holeLip = new THREE.Mesh(new THREE.TorusGeometry(1, 0.035, 8, 64), this.glow);
    this.holeLip.name = 'safe-edge';
    this.group.add(this.holeLip);

    this.pocket = new THREE.Mesh(
      new THREE.CircleGeometry(1, 48),
      new THREE.MeshBasicMaterial({
        color: 0x1a120c,
        transparent: true,
        opacity: 0.4,
        depthWrite: false,
      }),
    );
    this.pocket.name = 'safe-pocket';
    this.pocket.position.z = 0.01;
    this.group.add(this.pocket);

    // Decorative wreck crumbs stay in the dangerous band (outside hole, inside field).
    for (let i = 0; i < 10; i++) {
      const rock = createConveyorAsteroid(8.2 + i * 0.67);
      rock.name = `wreck-crumb-${i}`;
      rock.scale.setScalar(0.12 + (i % 3) * 0.04);
      this.group.add(rock);
      this.crumbs.push(rock);
    }

    this.wake = this.kit.box(
      this.group,
      'hole-wake',
      config.holeRadius * 1.6,
      config.holeRadius * 0.25,
      0.03,
      0,
      0,
      0.05,
      this.glow,
      0.002,
    );

    this.kit.box(
      this.group,
      'drift-hub',
      0.12,
      0.12,
      0.03,
      config.baseX,
      config.baseY,
      0.04,
      this.glow,
      0.004,
    );

    this.accent = new THREE.PointLight(0xffd08a, 9, 11, 2);
    this.accent.name = 'safe-zone-accent';
    this.group.add(this.accent);
    this.update(0);
  }

  update(time: number) {
    const s = movingSafeZoneHoleAtTime(this.config, time);
    this.holeLip.position.set(s.x, s.y, -0.02);
    this.holeLip.scale.setScalar(s.radius);
    this.pocket.position.set(s.x, s.y, 0.01);
    this.pocket.scale.setScalar(s.radius * 0.98);

    const midR = (s.radius + this.config.fieldRadius) * 0.55;
    this.crumbs.forEach((rock, i) => {
      const a = time * 0.15 + i * 0.63;
      const r = midR + Math.sin(time + i) * 0.12;
      rock.position.set(
        this.config.centerX + Math.cos(a) * r,
        this.config.centerY + Math.sin(a) * r,
        0,
      );
      rock.rotation.z = a + time * 0.4;
      // Hide crumbs that drift into the safe hole.
      rock.visible = Math.hypot(rock.position.x - s.x, rock.position.y - s.y) > s.radius + 0.15;
    });

    const dt = 0.05;
    const next = movingSafeZoneHoleAtTime(this.config, time + dt);
    const vx = next.x - s.x;
    const vy = next.y - s.y;
    const speed = Math.hypot(vx, vy) || 1;
    this.wake.position.set(
      s.x - (vx / speed) * s.radius * 0.9,
      s.y - (vy / speed) * s.radius * 0.9,
      0.05,
    );
    this.wake.rotation.z = Math.atan2(-vy, -vx);
    this.wake.scale.set(s.radius * 1.3, s.radius * 0.2, 1);

    const pulse = 0.8 + 0.3 * Math.sin(time * 2.3);
    this.glow.emissiveIntensity = pulse;
    this.accent.intensity = 7 + 4 * pulse;
    this.accent.position.set(s.x, s.y, -1.05);
  }

  dispose() {
    this.holeLip.geometry.dispose();
    this.fieldEdge.geometry.dispose();
    this.pocket.geometry.dispose();
    if (this.pocket.material instanceof THREE.Material) this.pocket.material.dispose();
    for (const rock of this.crumbs) {
      rock.geometry.dispose();
      if (rock.material instanceof THREE.Material) rock.material.dispose();
    }
    this.kit.dispose();
    this.group.clear();
    this.group.removeFromParent();
  }
}
