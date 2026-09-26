import * as THREE from 'three';
import type { OrbitingMoonsConfig } from '../config/ObstacleConfig';
import {
  beaconPulseStateAtTime,
  orbitingMoonsAtTime,
} from './StoryLibraryState';
import { FacilityArtKit } from './FacilityArtKit';
import { createConveyorAsteroid } from './ConveyorAsteroidArt';

/**
 * Cinematic orbiting beacons — moon disks stay authoritative;
 * orbit rail + pulse rings/beams teach the corridor.
 */
export class OrbitingMoonsArt {
  readonly group = new THREE.Group();
  private readonly kit = new FacilityArtKit({ cinematic: true });
  private readonly moons: THREE.Mesh[] = [];
  private readonly pulseMeshes: THREE.Object3D[] = [];
  private readonly glow: THREE.MeshStandardMaterial;
  private readonly accent: THREE.PointLight;
  private readonly path: THREE.Mesh;

  constructor(private readonly config: OrbitingMoonsConfig) {
    this.group.name = 'orbiting-moons-art';
    this.glow = this.kit.lamp();
    this.glow.color.setHex(0x70e5ed);
    this.glow.emissive.setHex(0x3aa8b8);

    const pathMat = this.kit.lampCore();
    pathMat.color.setHex(0x70e5ed);
    pathMat.emissive.setHex(0x2a8898);
    pathMat.transparent = true;
    pathMat.opacity = 0.4;
    pathMat.depthWrite = false;
    this.path = new THREE.Mesh(
      new THREE.TorusGeometry(config.orbitRadius, 0.018, 8, 96),
      pathMat,
    );
    this.path.name = 'moons-orbit-path';
    this.path.position.set(config.centerX, config.centerY, 0.05);
    this.group.add(this.path);

    if ((config.hubRadius ?? 0) > 0) {
      const hubR = config.hubRadius!;
      const hub = new THREE.Mesh(
        new THREE.TorusGeometry(Math.max(0.08, hubR * 0.55), Math.max(0.016, hubR * 0.12), 6, 28),
        this.glow,
      );
      hub.name = 'relay-hub';
      hub.position.set(config.centerX, config.centerY, 0.02);
      this.group.add(hub);
    }

    for (let i = 0; i < config.moonCount; i++) {
      const moon = createConveyorAsteroid(5.1 + i * 1.17);
      moon.name = `relay-beacon-${i}`;
      moon.scale.setScalar(config.moonRadius);
      this.group.add(moon);
      this.moons.push(moon);

      if (config.beaconPulse) {
        if (config.beaconPulse.kind === 'shockwave') {
          const ring = new THREE.Mesh(
            new THREE.RingGeometry(0.9, 1.05, 48),
            new THREE.MeshBasicMaterial({
              color: 0x70e5ed,
              transparent: true,
              opacity: 0.5,
              depthWrite: false,
              side: THREE.DoubleSide,
            }),
          );
          ring.name = `beacon-shock-${i}`;
          this.group.add(ring);
          this.pulseMeshes.push(ring);
        } else {
          const beam = this.kit.box(
            this.group,
            `beacon-laser-${i}`,
            0.08,
            1,
            0.04,
            0,
            0,
            -0.05,
            this.glow,
            0,
          );
          this.pulseMeshes.push(beam);
        }
      }
    }

    this.accent = new THREE.PointLight(0x70e5ed, 8, 11, 2);
    this.accent.name = 'moons-accent';
    this.group.add(this.accent);
    this.update(0);
  }

  update(time: number) {
    const moons = orbitingMoonsAtTime(this.config, time);
    const pulse = this.config.beaconPulse ? beaconPulseStateAtTime(this.config, time) : null;
    moons.forEach((b, i) => {
      const moon = this.moons[i];
      if (!moon) return;
      moon.position.set(b.x, b.y, 0);
      moon.scale.setScalar(b.radius);
      moon.rotation.z = b.angle + time * 0.2;

      const pulseMesh = this.pulseMeshes[i];
      if (!pulseMesh || !pulse || !this.config.beaconPulse) return;
      const color = pulse.warning ? 0xffb449 : pulse.phase === 'firing' ? 0xff6a55 : 0x70e5ed;
      if (this.config.beaconPulse.kind === 'shockwave' && pulseMesh instanceof THREE.Mesh) {
        const r =
          pulse.phase === 'firing'
            ? b.radius + this.config.beaconPulse.range * pulse.fraction
            : pulse.warning
              ? b.radius + 0.08
              : b.radius + 0.04;
        const thick = this.config.beaconPulse.thickness ?? 0.16;
        pulseMesh.position.set(b.x, b.y, -0.03);
        pulseMesh.scale.setScalar(Math.max(0.05, r));
        pulseMesh.visible = pulse.phase !== 'off';
        const mat = pulseMesh.material as THREE.MeshBasicMaterial;
        mat.color.setHex(color);
        mat.opacity = pulse.phase === 'off' ? 0.12 : pulse.warning ? 0.45 : 0.85;
        void thick;
      } else {
        const len =
          pulse.phase === 'firing'
            ? this.config.beaconPulse.range
            : pulse.warning
              ? this.config.beaconPulse.range * 0.4
              : 0;
        const ux = -Math.cos(b.angle);
        const uy = -Math.sin(b.angle);
        const half = this.config.beaconPulse.thickness ?? 0.09;
        pulseMesh.visible = len > 0.01;
        pulseMesh.position.set(
          b.x + ux * (b.radius + len / 2),
          b.y + uy * (b.radius + len / 2),
          -0.05,
        );
        pulseMesh.scale.set(half * 2, Math.max(0.01, len), 1);
        pulseMesh.rotation.z = b.angle + Math.PI / 2;
        const mat = (pulseMesh as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (mat?.emissive) {
          mat.color.setHex(color);
          mat.emissive.setHex(color);
          mat.emissiveIntensity = pulse.phase === 'firing' ? 1.4 : 0.7;
        }
      }
    });

    const teach = pulse?.warning ? 0xffb449 : pulse?.phase === 'firing' ? 0xff6a55 : 0x70e5ed;
    this.glow.color.setHex(teach);
    this.glow.emissive.setHex(teach);
    this.accent.color.setHex(teach);
    this.accent.intensity = 7 + (pulse?.phase === 'firing' ? 6 : pulse?.warning ? 4 : 2);
    this.accent.position.set(this.config.centerX, this.config.centerY, -1.1);
  }

  dispose() {
    for (const moon of this.moons) {
      moon.geometry.dispose();
      if (moon.material instanceof THREE.Material) moon.material.dispose();
    }
    for (const mesh of this.pulseMeshes) {
      if (mesh instanceof THREE.Mesh) {
        mesh.geometry.dispose();
        if (mesh.material instanceof THREE.Material) mesh.material.dispose();
      }
    }
    this.path.geometry.dispose();
    this.kit.dispose();
    this.group.clear();
    this.group.removeFromParent();
  }
}
