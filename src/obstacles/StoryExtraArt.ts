import * as THREE from 'three';
import type {
  LagrangeNullConfig,
  MagnetopauseConfig,
  PulsarBeamConfig,
  SequentialTunnelConfig,
  SolarSailConfig,
  TeleportPortalConfig,
} from '../config/ObstacleConfig';
import {
  pulsarBeamOn,
  sequentialTunnelAtTime,
  solarSailAngle,
  solarSailOpen,
  teleportPortalPoseAtTime,
} from './StoryLibraryState';
import { FacilityArtKit } from './FacilityArtKit';

type StoryExtraConfig =
  | MagnetopauseConfig
  | LagrangeNullConfig
  | PulsarBeamConfig
  | SolarSailConfig
  | SequentialTunnelConfig
  | TeleportPortalConfig;

/**
 * Cinematic kits for remaining single-level story primitives.
 * Collision stays in StoryLibraryState; meshes are teach only.
 */
export class StoryExtraArt {
  readonly group = new THREE.Group();
  private readonly kit = new FacilityArtKit({ cinematic: true });
  private readonly accent: THREE.PointLight;
  private readonly glow: THREE.MeshStandardMaterial;
  private readonly owned: THREE.Object3D[] = [];

  constructor(private readonly config: StoryExtraConfig) {
    this.group.name = `story-extra-art-${config.type}`;
    this.glow = this.kit.lamp();
    this.glow.color.setHex(0x70e5ed);
    this.glow.emissive.setHex(0x3aa8b8);
    this.accent = new THREE.PointLight(0x70e5ed, 8, 11, 2);
    this.accent.name = 'story-extra-accent';
    this.group.add(this.accent);
    this.build();
    this.update(0);
  }

  private build() {
    const c = this.config;
    const metal = this.kit.metal(0x6a7f93, 0.35);
    const dark = this.kit.metal(0x152029, 0.55, false);
    if (c.type === 'magnetopause') {
      const hub = Math.max(0.12, c.hubRadius ?? c.innerRadius * 0.45);
      const arc = new THREE.Mesh(
        new THREE.RingGeometry(c.innerRadius / c.outerRadius, 1, 64, 1, 0, Math.PI * 2 - c.gapWidth),
        metal,
      );
      arc.name = 'dish-arc';
      arc.scale.setScalar(c.outerRadius);
      arc.position.set(c.centerX, c.centerY, 0);
      this.group.add(arc);
      this.owned.push(arc);
      const dishHub = new THREE.Mesh(
        new THREE.TorusGeometry(Math.max(0.08, hub * 0.55), Math.max(0.016, hub * 0.12), 6, 28),
        this.glow,
      );
      dishHub.name = 'dish-hub';
      dishHub.position.set(c.centerX, c.centerY, -0.05);
      this.group.add(dishHub);
      this.owned.push(dishHub);
      this.kit.box(this.group, 'gap-tick-a', 0.08, 0.2, 0.03, c.centerX + c.outerRadius, c.centerY, -0.08, this.glow, 0.004);
      this.kit.box(this.group, 'gap-tick-b', 0.08, 0.2, 0.03, c.centerX + c.outerRadius, c.centerY, -0.08, this.glow, 0.004);
    } else if (c.type === 'lagrangeNull') {
      const calm = new THREE.Mesh(
        new THREE.CircleGeometry(1, 48),
        new THREE.MeshBasicMaterial({
          color: 0x142637,
          transparent: true,
          opacity: 0.22,
          depthWrite: false,
        }),
      );
      calm.name = 'calm-pocket';
      calm.position.set(c.centerX, c.centerY, 0.02);
      calm.scale.setScalar(c.radius);
      this.group.add(calm);
      this.owned.push(calm);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(1, 0.02, 8, 64), this.glow);
      rim.name = 'calm-boundary';
      rim.position.set(c.centerX, c.centerY, 0);
      rim.scale.setScalar(c.radius);
      this.group.add(rim);
      this.owned.push(rim);
    } else if (c.type === 'pulsarBeam') {
      const beam = this.kit.box(this.group, 'radiation', 1, 1, 0.08, c.centerX, c.centerY, 0, this.glow, 0);
      const core = this.kit.box(this.group, 'radiation-core', 1, 1, 0.05, c.centerX, c.centerY, -0.02, this.glow, 0);
      void beam;
      void core;
      for (const side of [-1, 1] as const) {
        this.kit.box(this.group, `trace-${side}`, 1, 1, 0.02, c.centerX, c.centerY, 0.02, dark, 0);
      }
    } else if (c.type === 'solarSail') {
      this.kit.box(this.group, 'vane-panel', c.halfWidth * 2, c.halfHeight * 2, 0.06, c.centerX, c.centerY, 0, metal, 0.01);
      this.kit.box(this.group, 'clear-line', c.halfWidth * 2, 0.03, 0.03, c.centerX, c.centerY, -0.05, this.glow, 0);
      for (let i = 0; i < 5; i++) {
        this.kit.box(
          this.group,
          `vane-rib-${i}`,
          0.04,
          c.halfHeight * 1.85,
          0.04,
          c.centerX + (i - 2) * c.halfWidth * 0.32,
          c.centerY,
          -0.04,
          this.kit.metal(0xc5d0d8, 0.25),
          0.004,
        );
      }
    } else if (c.type === 'sequentialTunnel') {
      for (let i = 0; i < c.apertureCount; i++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.06, 8, 48), metal);
        ring.name = `port-${i}`;
        this.group.add(ring);
        this.owned.push(ring);
        this.kit.box(this.group, `sealed-${i}`, 1.2, 0.1, 0.05, 0, 0, -0.05, this.glow, 0.004);
      }
      const wall = new THREE.Mesh(new THREE.TorusGeometry(1, 0.12, 8, 48), dark);
      wall.name = 'derelict-wall';
      this.group.add(wall);
      this.owned.push(wall);
    } else if (c.type === 'teleportPortal') {
      const frame = new THREE.Mesh(new THREE.TorusGeometry(1, 0.08, 10, 48), metal);
      frame.name = 'portal-frame';
      this.group.add(frame);
      this.owned.push(frame);
      const energy = new THREE.Mesh(new THREE.TorusGeometry(1, 0.04, 8, 48), this.glow);
      energy.name = 'portal-energy';
      this.group.add(energy);
      this.owned.push(energy);
      const ghost = new THREE.Mesh(
        new THREE.TorusGeometry(1, 0.05, 8, 40),
        new THREE.MeshBasicMaterial({
          color: 0xffbe66,
          transparent: true,
          opacity: 0.55,
          depthWrite: false,
        }),
      );
      ghost.name = 'next-anchor';
      this.group.add(ghost);
      this.owned.push(ghost);
    }
  }

  update(time: number) {
    const c = this.config;
    if (c.type === 'magnetopause') {
      const arc = this.group.getObjectByName('dish-arc');
      if (arc) {
        const a = time * c.speed + (c.phase ?? 0) + c.gapWidth / 2;
        arc.rotation.z = a;
      }
      const gapA = this.group.getObjectByName('gap-tick-a');
      const gapB = this.group.getObjectByName('gap-tick-b');
      const mid = time * c.speed + (c.phase ?? 0);
      const ga = mid;
      const gb = mid + c.gapWidth;
      if (gapA) {
        gapA.position.set(
          c.centerX + Math.cos(ga) * c.outerRadius,
          c.centerY + Math.sin(ga) * c.outerRadius,
          -0.08,
        );
        gapA.rotation.z = ga;
      }
      if (gapB) {
        gapB.position.set(
          c.centerX + Math.cos(gb) * c.outerRadius,
          c.centerY + Math.sin(gb) * c.outerRadius,
          -0.08,
        );
        gapB.rotation.z = gb;
      }
      this.accent.color.setHex(0xffb449);
      this.accent.position.set(c.centerX, c.centerY, -1.05);
    } else if (c.type === 'lagrangeNull') {
      this.glow.emissiveIntensity = 0.5 + 0.3 * Math.sin(time * 1.5);
      this.accent.color.setHex(0x8caaa9);
      this.accent.position.set(c.centerX, c.centerY, -1.05);
    } else if (c.type === 'pulsarBeam') {
      const on = pulsarBeamOn(c, time);
      const vertical = c.orientation === 'vertical';
      const beam = this.group.getObjectByName('radiation');
      const core = this.group.getObjectByName('radiation-core');
      if (beam) {
        beam.visible = on;
        beam.scale.set(vertical ? c.halfWidth * 2 : 40, vertical ? 40 : c.halfWidth * 2, 1);
        beam.position.set(c.centerX, c.centerY, 0);
      }
      if (core) {
        core.visible = on;
        core.scale.set(
          vertical ? c.halfWidth * 0.65 : 40,
          vertical ? 40 : c.halfWidth * 0.65,
          1,
        );
        core.position.set(c.centerX, c.centerY, -0.02);
      }
      this.glow.color.setHex(on ? 0xff997a : 0x8aa3bd);
      this.glow.emissive.setHex(on ? 0xff6644 : 0x334455);
      this.accent.color.setHex(on ? 0xff997a : 0x8aa3bd);
      this.accent.intensity = on ? 14 : 4;
      this.accent.position.set(c.centerX, c.centerY, -1.05);
    } else if (c.type === 'solarSail') {
      const a = solarSailAngle(c, time);
      const open = solarSailOpen(c, time);
      const panel = this.group.getObjectByName('vane-panel');
      if (panel) {
        panel.rotation.z = a;
        panel.position.set(c.centerX, c.centerY, 0);
        const mat = (panel as THREE.Mesh).material as THREE.MeshStandardMaterial;
        mat.color.setHex(open ? 0x8ae6c9 : 0x5a6a76);
        mat.opacity = open ? 0.2 : 1;
        mat.transparent = open;
      }
      const line = this.group.getObjectByName('clear-line');
      if (line) {
        line.visible = open;
        line.rotation.z = a;
        line.position.set(c.centerX, c.centerY, -0.05);
      }
      for (let i = 0; i < 5; i++) {
        const rib = this.group.getObjectByName(`vane-rib-${i}`);
        if (!rib) continue;
        const dx = (i - 2) * c.halfWidth * 0.32;
        rib.rotation.z = a;
        rib.position.set(c.centerX + Math.cos(a) * dx, c.centerY + Math.sin(a) * dx, -0.04);
        rib.visible = !open;
      }
      this.accent.color.setHex(open ? 0x88efc9 : 0xa8b8c4);
      this.accent.intensity = open ? 6 : 10;
      this.accent.position.set(c.centerX, c.centerY, -1.05);
    } else if (c.type === 'sequentialTunnel') {
      const ports = sequentialTunnelAtTime(c, time);
      const open = ports.find((p) => p.open)!;
      const wall = this.group.getObjectByName('derelict-wall');
      if (wall) {
        wall.position.set(open.x, open.y, 0);
        wall.scale.setScalar(open.radius + 0.2);
      }
      ports.forEach((p, i) => {
        const ring = this.group.getObjectByName(`port-${i}`);
        const sealed = this.group.getObjectByName(`sealed-${i}`);
        const r = p.open ? p.radius : Math.max(0.12, Math.min(p.radius, c.spacing - p.radius - 0.16));
        if (ring) {
          ring.position.set(p.x, p.y, -0.02);
          ring.scale.setScalar(r);
          const mat = (ring as THREE.Mesh).material as THREE.MeshStandardMaterial;
          mat.color.setHex(p.open ? 0x92edcf : 0x65747e);
        }
        if (sealed) {
          sealed.visible = !p.open;
          sealed.position.set(p.x, p.y, -0.05);
          sealed.scale.set(r * 1.2, 1, 1);
          sealed.rotation.z = Math.PI / 4;
        }
      });
      this.accent.color.setHex(0x92edcf);
      this.accent.position.set(open.x, open.y, -1.05);
    } else if (c.type === 'teleportPortal') {
      const s = teleportPortalPoseAtTime(c, time);
      for (const name of ['portal-frame', 'portal-energy']) {
        const o = this.group.getObjectByName(name);
        if (!o) continue;
        o.visible = s.present;
        o.position.set(s.x, s.y, name === 'portal-energy' ? -0.02 : 0.01);
        o.scale.setScalar(s.radius + (name === 'portal-frame' ? 0.08 : 0.06));
      }
      const ghost = this.group.getObjectByName('next-anchor');
      if (ghost) {
        ghost.visible = s.warning;
        ghost.position.set(s.nextX, s.nextY, -0.04);
        ghost.scale.setScalar(s.radius * 0.95);
      }
      this.accent.color.setHex(s.warning ? 0xffbe66 : 0x4aa7c9);
      this.accent.intensity = s.present ? 10 : 3;
      this.accent.position.set(s.x, s.y, -1.05);
    }
    this.accent.intensity = Math.max(this.accent.intensity, 5 + 3 * Math.sin(time * 2));
  }

  dispose() {
    for (const o of this.owned) {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        if (o.material instanceof THREE.Material) o.material.dispose();
      }
    }
    this.kit.dispose();
    this.group.clear();
    this.group.removeFromParent();
  }
}
