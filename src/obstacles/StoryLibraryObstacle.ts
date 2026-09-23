/**
 * Adapter for story-heavy library families (orbiting moons → The Null).
 */

import * as THREE from 'three';
import { LibraryWorldArt } from './LibraryWorldArt';

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
  solarSailOpen,
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
  private worldArt: LibraryWorldArt | null = null;
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
    this.worldArt = new LibraryWorldArt(this.config);
    this.group.add(this.worldArt.group);
  }

  private clear(): void {
    this.worldArt?.dispose();
    this.worldArt = null;
  }

  private layout(time: number): void {
    this.worldArt?.update(time);
  }
}
