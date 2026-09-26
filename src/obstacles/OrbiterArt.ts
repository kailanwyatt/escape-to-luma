import * as THREE from 'three';
import type { EnvironmentId } from '../config/ChallengeConfig';
import type { OrbiterConfig } from '../config/ObstacleConfig';
import { FacilityArtKit } from './FacilityArtKit';

function localOrbit(config: OrbiterConfig, time: number) {
  const t = time * config.speed + (config.phase ?? 0);
  return { x: Math.cos(t) * config.orbitRadius, y: Math.sin(t) * config.orbitRadius, angle: t };
}

/**
 * Cinematic orbiting sentry — body stays inside the hit disk;
 * path rail / wake / hub are decorative teach only.
 */
export class OrbiterArt {
  readonly group = new THREE.Group();
  private readonly kit = new FacilityArtKit({ cinematic: true });
  private readonly body = new THREE.Group();
  private readonly wake: THREE.Mesh;
  private readonly hub: THREE.Mesh;
  private readonly optic: THREE.MeshStandardMaterial;
  private readonly accent: THREE.PointLight;
  private readonly pathGlow: THREE.MeshStandardMaterial;
  private readonly ownedGeo: THREE.BufferGeometry[] = [];

  constructor(
    private readonly config: OrbiterConfig,
    environment: EnvironmentId,
  ) {
    this.group.name = 'orbiter-art';
    const space = environment === 'space';
    const armor = this.kit.metal(space ? 0x3a5265 : 0x455868, 0.3);
    const rim = this.kit.metal(space ? 0x9eb4c4 : 0xb0c0cb, 0.2);
    const dark = this.kit.metal(0x0c141c, 0.55, false);
    this.optic = this.kit.lamp();
    this.optic.color.setHex(space ? 0x70e5ed : 0xffb449);
    this.optic.emissive.setHex(space ? 0x3aa8b8 : 0xffa12a);
    this.pathGlow = this.kit.lampCore();
    this.pathGlow.color.setHex(space ? 0x6cf0ff : 0xffb45a);
    this.pathGlow.emissive.setHex(space ? 0x2a8898 : 0xff8a30);
    this.pathGlow.emissiveIntensity = 0.55;
    this.pathGlow.transparent = true;
    this.pathGlow.opacity = 0.55;
    this.pathGlow.depthWrite = false;

    const r = config.blockerRadius;
    const hullGeo = new THREE.SphereGeometry(1, 28, 18);
    this.ownedGeo.push(hullGeo);
    const hull = new THREE.Mesh(hullGeo, armor);
    hull.name = 'orbiter-hull';
    hull.scale.set(r, r, r * 0.72);
    this.body.add(hull);

    const collarGeo = new THREE.TorusGeometry(0.82, 0.07, 8, 36);
    this.ownedGeo.push(collarGeo);
    const collar = new THREE.Mesh(collarGeo, rim);
    collar.name = 'orbiter-collar';
    collar.scale.setScalar(r);
    collar.position.z = -r * 0.32;
    this.body.add(collar);

    // Solar panels stay inside the hit disk so gaps remain readable.
    for (const side of [-1, 1] as const) {
      this.kit.box(this.body, `solar-${side > 0 ? 'r' : 'l'}`, r * 0.55, r * 0.22, r * 0.04, side * r * 0.55, 0, -r * 0.15, dark, 0.008);
      this.kit.box(this.body, `panel-cell-${side > 0 ? 'r' : 'l'}`, r * 0.42, r * 0.14, r * 0.02, side * r * 0.55, 0, -r * 0.2, this.optic, 0.004);
    }
    this.kit.box(this.body, 'scanner-recess', r * 1.1, r * 0.32, r * 0.1, 0, 0, -r * 0.62, dark, 0);
    this.kit.box(this.body, 'scanner-lens', r * 0.85, r * 0.1, r * 0.04, 0, 0, -r * 0.72, this.optic, 0.008);
    this.kit.box(this.body, 'antenna', r * 0.06, r * 0.48, r * 0.06, 0, r * 0.55, -r * 0.2, rim, 0.006);
    this.body.name = 'orbiter-body';
    this.group.add(this.body);

    // Orbit rail — thin torus, non-colliding teach of the satellite route.
    const pathGeo = new THREE.TorusGeometry(
      config.orbitRadius,
      Math.max(0.014, r * 0.045),
      8,
      96,
    );
    this.ownedGeo.push(pathGeo);
    const path = new THREE.Mesh(pathGeo, this.pathGlow);
    path.name = 'orbit-path';
    path.position.z = 0.06;
    this.group.add(path);

    // Direction chevrons along the orbit so motion sense is obvious at a glance.
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const chevron = this.kit.box(
        this.group,
        `orbit-chevron-${i}`,
        Math.max(0.08, r * 0.22),
        Math.max(0.04, r * 0.1),
        0.02,
        Math.cos(a) * config.orbitRadius,
        Math.sin(a) * config.orbitRadius,
        0.1,
        this.pathGlow,
        0.004,
      );
      chevron.rotation.z = a + Math.PI / 2;
    }

    // Hub beacon marks the orbit center (safe eye of the path).
    this.hub = this.kit.box(this.group, 'orbit-hub', r * 0.28, r * 0.28, 0.04, 0, 0, 0.05, this.optic, 0.006);

    this.wake = this.kit.box(
      this.group,
      'orbit-wake',
      r * 1.4,
      r * 0.22,
      0.03,
      0,
      0,
      r * 0.35,
      this.pathGlow,
      0.002,
    );

    this.accent = new THREE.PointLight(space ? 0x70e5ed : 0xffb449, 7, 9, 2);
    this.accent.name = 'orbiter-accent';
    this.group.add(this.accent);
    this.update(0);
  }

  update(time: number) {
    const pos = localOrbit(this.config, time);
    this.body.position.set(pos.x, pos.y, 0);
    // Face tangentially along the orbit so panels read as travel, not spin-only.
    const tangent = pos.angle + Math.PI / 2;
    this.body.rotation.z = tangent;
    this.body.rotation.x = Math.sin(time * 0.55) * 0.08;

    // Wake trails opposite travel direction.
    const back = tangent + Math.PI;
    const wr = this.config.blockerRadius;
    this.wake.position.set(
      pos.x + Math.cos(back) * wr * 0.95,
      pos.y + Math.sin(back) * wr * 0.95,
      wr * 0.3,
    );
    this.wake.rotation.z = back;
    this.wake.scale.set(wr * 1.2, wr * 0.2, 1);

    const pulse = 0.85 + 0.25 * Math.sin(time * 2.4);
    this.optic.emissiveIntensity = pulse;
    this.pathGlow.emissiveIntensity = 0.4 + 0.25 * pulse;
    this.accent.intensity = 6 + 3 * pulse;
    this.accent.position.set(pos.x, pos.y, -1.05);
    this.hub.rotation.z = time * 0.8;
  }

  dispose() {
    this.ownedGeo.forEach((g) => g.dispose());
    this.kit.dispose();
    this.group.clear();
    this.group.removeFromParent();
  }
}
