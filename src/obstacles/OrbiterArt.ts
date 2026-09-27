import * as THREE from 'three';
import type { EnvironmentId } from '../config/ChallengeConfig';
import type { OrbiterConfig } from '../config/ObstacleConfig';
import { FacilityArtKit } from './FacilityArtKit';

function localOrbit(config: OrbiterConfig, time: number) {
  const t = time * config.speed + (config.phase ?? 0);
  return { x: Math.cos(t) * config.orbitRadius, y: Math.sin(t) * config.orbitRadius, angle: t };
}

/**
 * Cinematic orbiting sentry — body stays inside the hit disk.
 * Orbit path is a faint rail only; no debug hub / box tabs.
 */
export class OrbiterArt {
  readonly group = new THREE.Group();
  private readonly kit = new FacilityArtKit({ cinematic: true });
  private readonly body = new THREE.Group();
  private readonly optic: THREE.MeshStandardMaterial;
  private readonly accent: THREE.PointLight;
  private readonly pathGlow: THREE.MeshStandardMaterial;
  private readonly ownedGeo: THREE.BufferGeometry[] = [];
  private readonly ownedMats: THREE.Material[] = [];

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
    this.pathGlow.color.setHex(space ? 0x4aa8b8 : 0xffb45a);
    this.pathGlow.emissive.setHex(space ? 0x1a5060 : 0xff8a30);
    this.pathGlow.emissiveIntensity = 0.25;
    this.pathGlow.transparent = true;
    this.pathGlow.opacity = 0.22;
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

    // Flush dark solar arrays — stay inside the hit disk, no glowing tabs.
    for (const side of [-1, 1] as const) {
      this.kit.box(
        this.body,
        `solar-${side > 0 ? 'r' : 'l'}`,
        r * 0.48,
        r * 0.18,
        r * 0.03,
        side * r * 0.42,
        0,
        -r * 0.12,
        dark,
        0.006,
      );
      const cellMat = new THREE.MeshStandardMaterial({
        color: space ? 0x0e2438 : 0x241c14,
        emissive: space ? 0x0a3048 : 0x3a2810,
        emissiveIntensity: 0.2,
        metalness: 0.55,
        roughness: 0.5,
      });
      this.ownedMats.push(cellMat);
      const cellGeo = new THREE.PlaneGeometry(r * 0.34, r * 0.1);
      this.ownedGeo.push(cellGeo);
      const cell = new THREE.Mesh(cellGeo, cellMat);
      cell.name = `panel-cell-${side > 0 ? 'r' : 'l'}`;
      cell.position.set(side * r * 0.42, 0, -r * 0.145);
      this.body.add(cell);
    }

    // Recessed scanner bay + circular lens (no bar / slab).
    this.kit.box(this.body, 'scanner-recess', r * 0.95, r * 0.28, r * 0.08, 0, 0, -r * 0.55, dark, 0);
    const lensGeo = new THREE.CircleGeometry(r * 0.11, 20);
    this.ownedGeo.push(lensGeo);
    const lens = new THREE.Mesh(lensGeo, this.optic);
    lens.name = 'scanner-lens';
    lens.position.set(0, 0, -r * 0.66);
    this.body.add(lens);
    const lensRingGeo = new THREE.TorusGeometry(r * 0.11, r * 0.014, 6, 20);
    this.ownedGeo.push(lensRingGeo);
    const lensRing = new THREE.Mesh(lensRingGeo, rim);
    lensRing.name = 'scanner-lens-ring';
    lensRing.position.copy(lens.position);
    this.body.add(lensRing);

    // Slim antenna mast — metal, not a glow brick.
    this.kit.box(this.body, 'antenna', r * 0.04, r * 0.4, r * 0.04, 0, r * 0.48, -r * 0.15, rim, 0.004);
    this.body.name = 'orbiter-body';
    this.group.add(this.body);

    // Faint orbit rail only — no hub square/ring, no chevron boxes, no wake bar.
    const pathGeo = new THREE.TorusGeometry(
      config.orbitRadius,
      Math.max(0.01, r * 0.028),
      6,
      96,
    );
    this.ownedGeo.push(pathGeo);
    const path = new THREE.Mesh(pathGeo, this.pathGlow);
    path.name = 'orbit-path';
    path.position.z = 0.06;
    this.group.add(path);

    this.accent = new THREE.PointLight(space ? 0x70e5ed : 0xffb449, 5, 8, 2);
    this.accent.name = 'orbiter-accent';
    this.group.add(this.accent);
    this.update(0);
  }

  update(time: number) {
    const pos = localOrbit(this.config, time);
    this.body.position.set(pos.x, pos.y, 0);
    const tangent = pos.angle + Math.PI / 2;
    this.body.rotation.z = tangent;
    this.body.rotation.x = Math.sin(time * 0.55) * 0.08;

    const pulse = 0.85 + 0.25 * Math.sin(time * 2.4);
    this.optic.emissiveIntensity = pulse * 0.7;
    this.pathGlow.emissiveIntensity = 0.18 + 0.1 * pulse;
    this.accent.intensity = 4 + 2 * pulse;
    this.accent.position.set(pos.x, pos.y, -1.05);
  }

  dispose() {
    this.ownedGeo.forEach((g) => g.dispose());
    this.ownedMats.forEach((m) => m.dispose());
    this.kit.dispose();
    this.group.clear();
    this.group.removeFromParent();
  }
}
