/**
 * Adapter for story-heavy library families (orbiting moons → The Null).
 */

import * as THREE from 'three';

import type { EnvironmentId } from '../config/ChallengeConfig';
import type {
  AccretionShredderConfig,
  EntryExitPortalConfig,
  LagrangeNullConfig,
  MagnetopauseConfig,
  MovingSafeZoneConfig,
  OrbitingMoonsConfig,
  PulsarBeamConfig,
  SequentialTunnelConfig,
  SolarSailConfig,
  TeleportPortalConfig,
  TheNullConfig,
} from '../config/ObstacleConfig';
import { GAME_TUNING } from '../game/gameTuning';
import {
  emptyPredictedState,
  type ObstacleDebugInfo,
  type ObstaclePredictedState,
} from './GameplayObstacle';
import type { ObstacleCollisionResult } from './ObstacleCollision';
import { interpolateAtZ } from './SlidingGateObstacle';
import {
  accretionDebrisAtTime,
  entryExitWarpTarget,
  evaluateAccretionCollision,
  evaluateEntryExitCollision,
  evaluateLagrangeNullCollision,
  evaluateMagnetopauseCollision,
  evaluateMovingSafeZoneCollision,
  evaluateOrbitingMoonsCollision,
  evaluatePulsarBeamCollision,
  evaluateSequentialTunnelCollision,
  evaluateSolarSailCollision,
  evaluateTeleportPortalCollision,
  evaluateTheNullCollision,
  movingSafeZoneHoleAtTime,
  orbitingMoonsAtTime,
  pulsarBeamOn,
  sequentialTunnelAtTime,
  solarSailAngle,
  teleportPortalPoseAtTime,
  theNullSafeAtTime,
} from './StoryLibraryState';

export type StoryLibraryConfig =
  | OrbitingMoonsConfig
  | SequentialTunnelConfig
  | MovingSafeZoneConfig
  | AccretionShredderConfig
  | PulsarBeamConfig
  | SolarSailConfig
  | MagnetopauseConfig
  | LagrangeNullConfig
  | TeleportPortalConfig
  | EntryExitPortalConfig
  | TheNullConfig;

export type StoryLibraryType = StoryLibraryConfig['type'];

const HIT: Record<StoryLibraryType, ObstacleCollisionResult['hit']> = {
  orbitingMoons: 'orbiter',
  sequentialTunnel: 'iris',
  movingSafeZone: 'phase',
  accretionShredder: 'drift',
  pulsarBeam: 'laser',
  solarSail: 'gate',
  magnetopause: 'ring',
  lagrangeNull: null,
  teleportPortal: 'iris',
  entryExitPortal: 'iris',
  theNull: 'phase',
};

function toResult(
  type: StoryLibraryType,
  sample: { hit: boolean; clearance: number; nearMiss: boolean },
): ObstacleCollisionResult {
  return {
    hit: sample.hit ? HIT[type] : null,
    nearMiss: sample.nearMiss,
    clearance: sample.clearance,
  };
}

export class StoryLibraryObstacle {
  readonly id: string;
  type: StoryLibraryType = 'orbitingMoons';
  readonly group = new THREE.Group();
  z = GAME_TUNING.rotor.z;
  active = false;
  private config: StoryLibraryConfig | null = null;
  private meshes: THREE.Mesh[] = [];
  private elapsed = 0;
  private evalTime = 0;

  constructor(id: string) {
    this.id = id;
    this.group.visible = false;
  }

  applyConfig(config: StoryLibraryConfig, _environment: EnvironmentId): void {
    this.config = config;
    this.type = config.type;
    this.active = true;
    this.group.visible = true;
    this.z = config.z;
    this.elapsed = 0;
    this.rebuild();
    this.update(0, 0);
  }

  hide(): void {
    this.active = false;
    this.group.visible = false;
    this.config = null;
    this.clear();
  }

  update(_dt: number, elapsedTime: number): void {
    if (!this.active || !this.config) return;
    this.elapsed = elapsedTime;
    this.group.position.set(0, 0, this.z);
    this.layout(elapsedTime);
  }

  testProjectileCrossing(
    previous: THREE.Vector3,
    current: THREE.Vector3,
    projectileRadius: number,
    currentSimulationTime = this.elapsed,
    stepSeconds = 0,
  ): ObstacleCollisionResult | null {
    if (!this.active || !this.config || previous.z >= this.z || current.z < this.z) {
      return null;
    }
    const at = interpolateAtZ(previous, current, this.z);
    const fraction = (this.z - previous.z) / (current.z - previous.z);
    const t = currentSimulationTime - stepSeconds + stepSeconds * fraction;
    return this.evaluateAt(at.x, at.y, projectileRadius, this.predictState(0, t));
  }

  /** Entry/exit warp target when this plane is an entry portal. */
  warpTarget(): { x: number; y: number } | null {
    if (!this.config || this.config.type !== 'entryExitPortal') return null;
    return entryExitWarpTarget(this.config);
  }

  predictState(_deltaSeconds: number, simTime: number): ObstaclePredictedState {
    this.evalTime = simTime;
    const predicted = emptyPredictedState(this.type, this.z);
    if (!this.config) return predicted;
    switch (this.config.type) {
      case 'orbitingMoons': {
        const moons = orbitingMoonsAtTime(this.config, simTime);
        predicted.x = moons[0]?.x ?? 0;
        predicted.y = moons[0]?.y ?? 3;
        predicted.blockerRadius = this.config.moonRadius;
        break;
      }
      case 'sequentialTunnel': {
        const open = sequentialTunnelAtTime(this.config, simTime).find((a) => a.open);
        predicted.openingX = open?.x ?? 0;
        predicted.openingY = open?.y ?? 3;
        predicted.openingRadius = open?.radius ?? 0;
        break;
      }
      case 'movingSafeZone': {
        const hole = movingSafeZoneHoleAtTime(this.config, simTime);
        predicted.openingX = hole.x;
        predicted.openingY = hole.y;
        predicted.openingRadius = hole.radius;
        break;
      }
      case 'accretionShredder': {
        predicted.x = this.config.centerX;
        predicted.y = this.config.centerY;
        predicted.openingRadius = 0.5;
        break;
      }
      case 'pulsarBeam': {
        predicted.x = this.config.centerX;
        predicted.y = this.config.centerY;
        predicted.openingWidth = this.config.halfWidth * 2;
        break;
      }
      case 'solarSail': {
        predicted.angle = solarSailAngle(this.config, simTime);
        predicted.openingX = this.config.centerX;
        predicted.openingY = this.config.centerY;
        break;
      }
      case 'magnetopause':
      case 'lagrangeNull':
      case 'theNull': {
        predicted.x = this.config.centerX;
        predicted.y = this.config.centerY;
        if (this.config.type === 'theNull') {
          const safe = theNullSafeAtTime(this.config, simTime);
          predicted.openingRadius = safe.radius;
        } else if (this.config.type === 'lagrangeNull') {
          predicted.openingRadius = this.config.radius;
        } else {
          predicted.openingRadius = this.config.outerRadius;
        }
        break;
      }
      case 'teleportPortal': {
        const pose = teleportPortalPoseAtTime(this.config, simTime);
        predicted.openingX = pose.x;
        predicted.openingY = pose.y;
        predicted.openingRadius = pose.radius;
        break;
      }
      case 'entryExitPortal': {
        predicted.openingX = this.config.entryX;
        predicted.openingY = this.config.entryY;
        predicted.openingRadius = this.config.radius;
        break;
      }
    }
    return predicted;
  }

  evaluateAt(
    x: number,
    y: number,
    projectileRadius: number,
    _predicted: ObstaclePredictedState,
  ): ObstacleCollisionResult {
    if (!this.config) return { hit: null, nearMiss: false, clearance: Infinity };
    const t = this.evalTime;
    switch (this.config.type) {
      case 'orbitingMoons':
        return toResult(this.type, evaluateOrbitingMoonsCollision(this.config, t, x, y, projectileRadius));
      case 'sequentialTunnel':
        return toResult(this.type, evaluateSequentialTunnelCollision(this.config, t, x, y, projectileRadius));
      case 'movingSafeZone':
        return toResult(this.type, evaluateMovingSafeZoneCollision(this.config, t, x, y, projectileRadius));
      case 'accretionShredder':
        return toResult(this.type, evaluateAccretionCollision(this.config, t, x, y, projectileRadius));
      case 'pulsarBeam':
        return toResult(this.type, evaluatePulsarBeamCollision(this.config, t, x, y, projectileRadius));
      case 'solarSail':
        return toResult(this.type, evaluateSolarSailCollision(this.config, t, x, y, projectileRadius));
      case 'magnetopause':
        return toResult(this.type, evaluateMagnetopauseCollision(this.config, t, x, y, projectileRadius));
      case 'lagrangeNull':
        return toResult(this.type, evaluateLagrangeNullCollision(this.config, t, x, y, projectileRadius));
      case 'teleportPortal':
        return toResult(this.type, evaluateTeleportPortalCollision(this.config, t, x, y, projectileRadius));
      case 'entryExitPortal':
        return toResult(this.type, evaluateEntryExitCollision(this.config, t, x, y, projectileRadius));
      case 'theNull':
        return toResult(this.type, evaluateTheNullCollision(this.config, t, x, y, projectileRadius));
    }
  }

  getDebugInfo(): ObstacleDebugInfo {
    const predicted = this.predictState(0, this.elapsed);
    let extra = this.type as string;
    if (this.config?.type === 'pulsarBeam') {
      extra = pulsarBeamOn(this.config, this.elapsed) ? 'ON' : 'off';
    } else if (this.config?.type === 'teleportPortal') {
      extra = teleportPortalPoseAtTime(this.config, this.elapsed).warning ? 'warn' : 'hold';
    }
    return { ...predicted, speed: 0, extra };
  }

  private rebuild(): void {
    this.clear();
    if (!this.config) return;
    const mat = new THREE.MeshBasicMaterial({
      color: this.config.type === 'lagrangeNull' || this.config.type === 'theNull' ? 0x1a1028 : 0x8ab4c8,
      transparent: true,
      opacity: this.config.type === 'lagrangeNull' ? 0.22 : 0.85,
      depthWrite: false,
    });
    let count = 1;
    if (this.config.type === 'orbitingMoons') count = this.config.moonCount;
    else if (this.config.type === 'sequentialTunnel') count = this.config.apertureCount;
    else if (this.config.type === 'accretionShredder') count = this.config.debrisCount;
    else if (this.config.type === 'entryExitPortal' || this.config.type === 'theNull') count = 2;
    else if (this.config.type === 'magnetopause' || this.config.type === 'movingSafeZone') count = 8;
    for (let i = 0; i < count; i += 1) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 0.08), mat.clone());
      this.meshes.push(mesh);
      this.group.add(mesh);
    }
  }

  private clear(): void {
    for (const mesh of this.meshes) {
      this.group.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
    this.meshes = [];
  }

  private layout(time: number): void {
    if (!this.config) return;
    switch (this.config.type) {
      case 'orbitingMoons': {
        orbitingMoonsAtTime(this.config, time).forEach((moon, i) => {
          const mesh = this.meshes[i];
          if (!mesh) return;
          mesh.position.set(moon.x, moon.y, 0);
          mesh.scale.set(moon.radius * 2, moon.radius * 2, 1);
        });
        break;
      }
      case 'sequentialTunnel': {
        sequentialTunnelAtTime(this.config, time).forEach((ap, i) => {
          const mesh = this.meshes[i];
          if (!mesh) return;
          mesh.position.set(ap.x, ap.y, 0);
          mesh.scale.set(ap.radius * 2, ap.radius * 2, 1);
          (mesh.material as THREE.MeshBasicMaterial).opacity = ap.open ? 0.25 : 0.85;
          (mesh.material as THREE.MeshBasicMaterial).color.setHex(ap.open ? 0x7cffb2 : 0x8ab4c8);
        });
        break;
      }
      case 'movingSafeZone': {
        const hole = movingSafeZoneHoleAtTime(this.config, time);
        const n = this.meshes.length;
        for (let i = 0; i < n; i += 1) {
          const mesh = this.meshes[i];
          if (!mesh || !this.config || this.config.type !== 'movingSafeZone') return;
          const ang = (i / n) * Math.PI * 2;
          const r = this.config.fieldRadius;
          mesh.position.set(
            this.config.centerX + Math.cos(ang) * r,
            this.config.centerY + Math.sin(ang) * r,
            0,
          );
          mesh.scale.set(0.25, ((Math.PI * 2) / n) * r * 0.9, 1);
          mesh.rotation.z = ang;
          (mesh.material as THREE.MeshBasicMaterial).opacity = 0.35;
        }
        // Reuse mesh 0 as hole marker if present.
        const marker = this.meshes[0];
        if (marker) {
          marker.position.set(hole.x, hole.y, 0.02);
          marker.scale.set(hole.radius * 2, hole.radius * 2, 1);
          (marker.material as THREE.MeshBasicMaterial).opacity = 0.5;
          (marker.material as THREE.MeshBasicMaterial).color.setHex(0x7cffb2);
        }
        break;
      }
      case 'accretionShredder': {
        accretionDebrisAtTime(this.config, time).forEach((d, i) => {
          const mesh = this.meshes[i];
          if (!mesh) return;
          mesh.position.set(d.x, d.y, 0);
          mesh.scale.set(d.radius * 2, d.radius * 2, 1);
        });
        break;
      }
      case 'pulsarBeam': {
        const mesh = this.meshes[0];
        if (!mesh || this.config.type !== 'pulsarBeam') return;
        const on = pulsarBeamOn(this.config, time);
        mesh.position.set(this.config.centerX, this.config.centerY, 0);
        if (this.config.orientation === 'vertical') {
          mesh.scale.set(this.config.halfWidth * 2, 4.5, 1);
        } else {
          mesh.scale.set(4.5, this.config.halfWidth * 2, 1);
        }
        (mesh.material as THREE.MeshBasicMaterial).opacity = on ? 0.75 : 0.12;
        (mesh.material as THREE.MeshBasicMaterial).color.setHex(on ? 0xff6b6b : 0x8ab4c8);
        break;
      }
      case 'solarSail': {
        const mesh = this.meshes[0];
        if (!mesh || this.config.type !== 'solarSail') return;
        const ang = solarSailAngle(this.config, time);
        mesh.position.set(this.config.centerX, this.config.centerY, 0);
        mesh.rotation.z = ang;
        mesh.scale.set(this.config.halfWidth * 2, this.config.halfHeight * 2, 1);
        (mesh.material as THREE.MeshBasicMaterial).opacity = Math.abs(ang) >= this.config.openAngle ? 0.25 : 0.85;
        break;
      }
      case 'magnetopause': {
        const n = this.meshes.length;
        for (let i = 0; i < n; i += 1) {
          const mesh = this.meshes[i];
          if (!mesh || !this.config || this.config.type !== 'magnetopause') return;
          const band = (this.config.innerRadius + this.config.outerRadius) / 2;
          const gap = this.config.gapWidth;
          const start = time * this.config.speed + (this.config.phase ?? 0) + gap / 2;
          const span = Math.PI * 2 - gap;
          const ang = start + (i / Math.max(1, n - 1)) * span;
          mesh.position.set(
            this.config.centerX + Math.cos(ang) * band,
            this.config.centerY + Math.sin(ang) * band,
            0,
          );
          mesh.rotation.z = ang;
          mesh.scale.set(this.config.outerRadius - this.config.innerRadius, 0.35, 1);
        }
        break;
      }
      case 'lagrangeNull': {
        const mesh = this.meshes[0];
        if (!mesh || this.config.type !== 'lagrangeNull') return;
        mesh.position.set(this.config.centerX, this.config.centerY, 0);
        mesh.scale.set(this.config.radius * 2, this.config.radius * 2, 1);
        break;
      }
      case 'teleportPortal': {
        const pose = teleportPortalPoseAtTime(this.config, time);
        const mesh = this.meshes[0];
        if (!mesh) return;
        mesh.position.set(pose.x, pose.y, 0);
        mesh.scale.set(pose.radius * 2, pose.radius * 2, 1);
        (mesh.material as THREE.MeshBasicMaterial).color.setHex(pose.warning ? 0xffb14a : 0x7cffb2);
        break;
      }
      case 'entryExitPortal': {
        const entry = this.meshes[0];
        const exit = this.meshes[1];
        if (entry && this.config.type === 'entryExitPortal') {
          entry.position.set(this.config.entryX, this.config.entryY, 0);
          entry.scale.set(this.config.radius * 2, this.config.radius * 2, 1);
          (entry.material as THREE.MeshBasicMaterial).color.setHex(0x7cffb2);
        }
        if (exit && this.config.type === 'entryExitPortal') {
          exit.position.set(this.config.exitX, this.config.exitY, 0);
          exit.scale.set(this.config.radius * 1.6, this.config.radius * 1.6, 1);
          (exit.material as THREE.MeshBasicMaterial).color.setHex(0x6bc4ff);
          (exit.material as THREE.MeshBasicMaterial).opacity = 0.45;
        }
        break;
      }
      case 'theNull': {
        const safe = theNullSafeAtTime(this.config, time);
        const mesh = this.meshes[0];
        if (!mesh || this.config.type !== 'theNull') return;
        mesh.position.set(this.config.centerX, this.config.centerY, 0);
        mesh.scale.set(this.config.fieldRadius * 2, this.config.fieldRadius * 2, 1);
        (mesh.material as THREE.MeshBasicMaterial).opacity = 0.4;
        const hole = this.meshes[1] ?? mesh;
        hole.position.set(safe.x, safe.y, 0.02);
        hole.scale.set(safe.radius * 2, safe.radius * 2, 1);
        (hole.material as THREE.MeshBasicMaterial).color.setHex(0xd8fbff);
        (hole.material as THREE.MeshBasicMaterial).opacity = 0.55;
        break;
      }
    }
  }
}
