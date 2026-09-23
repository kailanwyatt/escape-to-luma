/**
 * Minimal Three.js adapter for new obstacle library families.
 * State/collision are authoritative in *State modules; visuals are functional primitives.
 */

import * as THREE from 'three';
import { LibraryPriorityArt } from './LibraryPriorityArt';
import { LibraryWorldArt } from './LibraryWorldArt';

import type { EnvironmentId } from '../config/ChallengeConfig';
import type {
  ClockHandsConfig,
  CometCrossingConfig,
  ConveyorGateConfig,
  CorkscrewTunnelConfig,
  ElevatorBlocksConfig,
  PistonFieldConfig,
  PulseRingConfig,
  ReactiveGateConfig,
  RollingApertureConfig,
  ScissorGateConfig,
  SpeedFieldConfig,
  SplitShutterConfig,
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
  clockHandsStateAtTime,
  evaluateClockHandsCollision,
} from './ClockHandsState';
import {
  elevatorBlocksStateAtTime,
  evaluateElevatorBlocksCollision,
} from './ElevatorBlocksState';
import {
  evaluatePistonFieldCollision,
  pistonFieldStateAtTime,
} from './PistonFieldState';
import { evaluatePulseRingCollision, pulseRingStateAtTime } from './PulseRingState';
import {
  evaluateScissorGateCollision,
  scissorGateStateAtTime,
} from './ScissorGateState';
import {
  evaluateSpeedFieldCollision,
  speedFieldStateAtTime,
  speedMultiplierAt,
} from './SpeedFieldState';
import {
  cometCrossingStateAtTime,
  conveyorGateBlocksAtTime,
  corkscrewStateAtTime,
  evaluateCometCrossingCollision,
  evaluateConveyorGateCollision,
  evaluateCorkscrewCollision,
  evaluateReactiveGateCollision,
  evaluateRollingApertureCollision,
  evaluateSplitShutterCollision,
  reactiveGateStateAtTime,
  rollingApertureStateAtTime,
  splitShutterStateAtTime,
} from './ExtendedLibraryState';

export type LibraryObstacleConfig =
  | PistonFieldConfig
  | ClockHandsConfig
  | ElevatorBlocksConfig
  | PulseRingConfig
  | ScissorGateConfig
  | SpeedFieldConfig
  | SplitShutterConfig
  | ReactiveGateConfig
  | ConveyorGateConfig
  | RollingApertureConfig
  | CorkscrewTunnelConfig
  | CometCrossingConfig;

export type LibraryObstacleType = LibraryObstacleConfig['type'];

const HIT_PART: Record<LibraryObstacleType, ObstacleCollisionResult['hit']> = {
  pistonField: 'gate',
  clockHands: 'pendulum',
  elevatorBlocks: 'gate',
  pulseRing: 'ring',
  scissorGate: 'gate',
  speedField: null,
  splitShutter: 'gate',
  reactiveGate: 'gate',
  conveyorGate: 'drift',
  rollingAperture: 'aperture',
  corkscrewTunnel: 'ring',
  cometCrossing: 'orbiter',
};

function toResult(
  type: LibraryObstacleType,
  sample: { hit: boolean; clearance: number; nearMiss: boolean },
): ObstacleCollisionResult {
  return {
    hit: sample.hit ? HIT_PART[type] : null,
    nearMiss: sample.nearMiss,
    clearance: sample.clearance,
  };
}

export class LibraryObstacle {
  readonly id: string;
  type: LibraryObstacleType = 'pistonField';
  readonly group = new THREE.Group();
  z = GAME_TUNING.rotor.z;
  active = false;
  private config: LibraryObstacleConfig | null = null;
  private meshes: THREE.Mesh[] = [];
  private priorityArt: LibraryPriorityArt | null = null;
  private worldArt: LibraryWorldArt | null = null;
  private elapsed = 0;
  /** Last sim time used by predictState / crossing eval (prediction parity). */
  private evalTime = 0;

  constructor(id: string) {
    this.id = id;
    this.group.visible = false;
  }

  applyConfig(config: LibraryObstacleConfig, _environment: EnvironmentId): void {
    this.config = config;
    this.type = config.type;
    this.active = true;
    this.group.visible = true;
    this.z = config.z;
    this.elapsed = 0;
    this.rebuildMeshes();
    this.update(0, 0);
  }

  hide(): void {
    this.active = false;
    this.group.visible = false;
    this.config = null;
    this.clearMeshes();
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

  predictState(_deltaSeconds: number, simTime: number): ObstaclePredictedState {
    this.evalTime = simTime;
    const predicted = emptyPredictedState(this.type, this.z);
    if (!this.config) return predicted;
    switch (this.config.type) {
      case 'pistonField': {
        const lanes = pistonFieldStateAtTime(this.config, simTime);
        const open = lanes.find((lane) => lane.open) ?? lanes[Math.floor(lanes.length / 2)];
        // Marker sits in the flight band above a retracted ram, not on the floor body.
        predicted.openingX = open?.x ?? 0;
        predicted.openingY = 3;
        predicted.openingWidth = open?.width ?? 0.7;
        predicted.openingHeight = Math.max(0.6, 3 - (open?.top ?? 2));
        break;
      }
      case 'clockHands': {
        const state = clockHandsStateAtTime(this.config, simTime);
        predicted.x = state.hubX;
        predicted.y = state.hubY;
        predicted.angle = state.hands[0]?.angle ?? 0;
        predicted.length = this.config.length;
        predicted.blockerRadius = this.config.thickness;
        break;
      }
      case 'elevatorBlocks': {
        const blocks = elevatorBlocksStateAtTime(this.config, simTime);
        const mid = blocks[Math.floor(blocks.length / 2)];
        predicted.openingX = mid?.x ?? 0;
        predicted.openingY = mid?.y ?? this.config.baseY;
        predicted.openingWidth = mid?.width ?? 0;
        predicted.openingHeight = mid?.height ?? 0;
        break;
      }
      case 'pulseRing': {
        const state = pulseRingStateAtTime(this.config, simTime);
        predicted.x = state.centerX;
        predicted.y = state.centerY;
        predicted.openingRadius = state.radius;
        predicted.blockerRadius = state.thickness;
        break;
      }
      case 'scissorGate': {
        const state = scissorGateStateAtTime(this.config, simTime);
        predicted.x = state.centerX;
        predicted.y = state.centerY;
        predicted.angle = state.angle;
        predicted.openingWidth = state.apertureWidth;
        break;
      }
      case 'speedField': {
        const state = speedFieldStateAtTime(this.config, simTime);
        predicted.x = state.centerX;
        predicted.y = state.centerY;
        predicted.openingWidth = state.width;
        predicted.openingHeight = state.height;
        break;
      }
      case 'splitShutter': {
        const state = splitShutterStateAtTime(this.config, simTime);
        predicted.openingX = this.config.centerX;
        predicted.openingY = state.y;
        predicted.openingWidth = state.gap;
        predicted.openingHeight = state.height;
        break;
      }
      case 'reactiveGate': {
        const state = reactiveGateStateAtTime(this.config, simTime);
        predicted.openingX = this.config.centerX;
        predicted.openingY = state.y;
        predicted.openingWidth = state.gap;
        predicted.openingHeight = state.panelHeight;
        break;
      }
      case 'conveyorGate': {
        const blocks = conveyorGateBlocksAtTime(this.config, simTime);
        const mid = blocks[Math.floor(blocks.length / 2)];
        predicted.x = mid?.x ?? this.config.centerX;
        predicted.y = mid?.y ?? this.config.centerY ?? 3;
        predicted.blockerRadius = mid?.radius ?? this.config.blockRadius;
        break;
      }
      case 'rollingAperture': {
        const state = rollingApertureStateAtTime(this.config, simTime);
        predicted.x = state.x;
        predicted.y = state.y;
        predicted.openingRadius = state.radius;
        break;
      }
      case 'corkscrewTunnel': {
        const state = corkscrewStateAtTime(this.config, simTime);
        predicted.x = state.centerX;
        predicted.y = state.centerY;
        predicted.angle = state.gapAngle;
        predicted.openingRadius = state.radius;
        predicted.openingWidth = state.gapWidth;
        break;
      }
      case 'cometCrossing': {
        const state = cometCrossingStateAtTime(this.config, simTime);
        predicted.x = state.x;
        predicted.y = state.y;
        predicted.blockerRadius = state.radius;
        break;
      }
    }
    return predicted;
  }

  evaluateAt(
    x: number,
    y: number,
    projectileRadius: number,
    predicted: ObstaclePredictedState,
  ): ObstacleCollisionResult {
    if (!this.config) {
      return { hit: null, nearMiss: false, clearance: Infinity };
    }
    void predicted;
    const t = this.evalTime;
    switch (this.config.type) {
      case 'pistonField':
        return toResult(this.type, evaluatePistonFieldCollision(this.config, t, x, y, projectileRadius));
      case 'clockHands':
        return toResult(this.type, evaluateClockHandsCollision(this.config, t, x, y, projectileRadius));
      case 'elevatorBlocks':
        return toResult(this.type, evaluateElevatorBlocksCollision(this.config, t, x, y, projectileRadius));
      case 'pulseRing':
        return toResult(this.type, evaluatePulseRingCollision(this.config, t, x, y, projectileRadius));
      case 'scissorGate':
        return toResult(this.type, evaluateScissorGateCollision(this.config, t, x, y, projectileRadius));
      case 'speedField':
        return toResult(this.type, evaluateSpeedFieldCollision(this.config, t, x, y, projectileRadius));
      case 'splitShutter':
        return toResult(this.type, evaluateSplitShutterCollision(this.config, t, x, y, projectileRadius));
      case 'reactiveGate':
        return toResult(this.type, evaluateReactiveGateCollision(this.config, t, x, y, projectileRadius));
      case 'conveyorGate':
        return toResult(this.type, evaluateConveyorGateCollision(this.config, t, x, y, projectileRadius));
      case 'rollingAperture':
        return toResult(this.type, evaluateRollingApertureCollision(this.config, t, x, y, projectileRadius));
      case 'corkscrewTunnel':
        return toResult(this.type, evaluateCorkscrewCollision(this.config, t, x, y, projectileRadius));
      case 'cometCrossing':
        return toResult(this.type, evaluateCometCrossingCollision(this.config, t, x, y, projectileRadius));
    }
  }

  /** Shared by flight integration / prediction when a speed field is active. */
  speedMultiplierAt(x: number, y: number, time = this.elapsed): number {
    if (!this.config || this.config.type !== 'speedField') return 1;
    return speedMultiplierAt(this.config, time, x, y);
  }

  getDebugInfo(): ObstacleDebugInfo {
    const predicted = this.predictState(0, this.elapsed);
    let extra = this.type as string;
    if (this.config?.type === 'speedField') {
      extra = `speed×${this.config.speedMultiplier.toFixed(2)}`;
    } else if (this.config?.type === 'pulseRing') {
      const state = pulseRingStateAtTime(this.config, this.elapsed);
      extra = `r=${state.radius.toFixed(2)}`;
    } else if (this.config?.type === 'scissorGate') {
      const state = scissorGateStateAtTime(this.config, this.elapsed);
      extra = `gap=${state.apertureWidth.toFixed(2)}`;
    } else if (this.config?.type === 'splitShutter') {
      const state = splitShutterStateAtTime(this.config, this.elapsed);
      extra = `gap=${state.gap.toFixed(2)}`;
    } else if (this.config?.type === 'reactiveGate') {
      const state = reactiveGateStateAtTime(this.config, this.elapsed);
      extra = state.phase;
    } else if (this.config?.type === 'rollingAperture') {
      const state = rollingApertureStateAtTime(this.config, this.elapsed);
      extra = `r=${state.radius.toFixed(2)}`;
    } else if (this.config?.type === 'corkscrewTunnel') {
      const state = corkscrewStateAtTime(this.config, this.elapsed);
      extra = `θ=${state.gapAngle.toFixed(2)}`;
    } else if (this.config?.type === 'cometCrossing') {
      const state = cometCrossingStateAtTime(this.config, this.elapsed);
      extra = `(${state.x.toFixed(1)},${state.y.toFixed(1)})`;
    }
    return { ...predicted, speed: 0, extra };
  }

  private rebuildMeshes(): void {
    this.clearMeshes();
    if (!this.config) return;
    if (LibraryPriorityArt.supports(this.config)) {
      this.priorityArt = new LibraryPriorityArt(this.config);
      this.group.add(this.priorityArt.group);
    } else {
      this.worldArt = new LibraryWorldArt(this.config);
      this.group.add(this.worldArt.group);
    }
  }

  private clearMeshes(): void {
    this.priorityArt?.dispose();
    this.priorityArt = null;
    this.worldArt?.dispose();
    this.worldArt = null;
  }

  private layout(time: number): void {
    this.priorityArt?.update(time);
    this.worldArt?.update(time);
  }
}
