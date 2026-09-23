/**
 * Minimal Three.js adapter for new obstacle library families.
 * State/collision are authoritative in *State modules; visuals are functional primitives.
 */

import * as THREE from 'three';

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
        predicted.openingX = open?.x ?? 0;
        predicted.openingY = open?.y ?? 3;
        predicted.openingWidth = open?.width ?? 0;
        predicted.openingHeight = open?.height ?? 0;
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
    const isField = this.config.type === 'speedField';
    const mat = new THREE.MeshBasicMaterial({
      color: isField ? 0x3ad4ff : 0x8ab4c8,
      transparent: true,
      opacity: isField ? 0.28 : 0.85,
      depthWrite: false,
    });
    let count = 1;
    switch (this.config.type) {
      case 'pistonField':
      case 'elevatorBlocks':
        count = this.config.laneCount;
        break;
      case 'clockHands':
        count = this.config.handCount + 1;
        break;
      case 'scissorGate':
      case 'splitShutter':
      case 'reactiveGate':
        count = 2;
        break;
      case 'conveyorGate':
        count = Math.max(2, Math.floor(this.config.blockCount));
        break;
      case 'pulseRing':
        // Ring band approximated with 12 segments (not a filled square).
        count = 12;
        break;
      case 'rollingAperture':
        // Outer ring segments around the open hole.
        count = 10;
        break;
      case 'corkscrewTunnel':
        count = 10;
        break;
      default:
        count = 1;
    }
    for (let i = 0; i < count; i += 1) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 0.08), mat.clone());
      this.meshes.push(mesh);
      this.group.add(mesh);
    }
  }

  private clearMeshes(): void {
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
      case 'pistonField': {
        const lanes = pistonFieldStateAtTime(this.config, time);
        lanes.forEach((lane, i) => {
          const mesh = this.meshes[i];
          if (!mesh) return;
          mesh.position.set(lane.x, lane.y, 0);
          mesh.scale.set(lane.width, lane.height, 1);
        });
        break;
      }
      case 'elevatorBlocks': {
        const blocks = elevatorBlocksStateAtTime(this.config, time);
        blocks.forEach((block, i) => {
          const mesh = this.meshes[i];
          if (!mesh) return;
          mesh.position.set(block.x, block.y, 0);
          mesh.scale.set(block.width, block.height, 1);
        });
        break;
      }
      case 'clockHands': {
        const state = clockHandsStateAtTime(this.config, time);
        const hub = this.meshes[0];
        if (hub) {
          hub.position.set(state.hubX, state.hubY, 0);
          hub.scale.set(state.hubRadius * 2, state.hubRadius * 2, 1);
        }
        state.hands.forEach((hand, i) => {
          const mesh = this.meshes[i + 1];
          if (!mesh || !this.config || this.config.type !== 'clockHands') return;
          const mx = (state.hubX + hand.tipX) / 2;
          const my = (state.hubY + hand.tipY) / 2;
          mesh.position.set(mx, my, 0);
          mesh.rotation.z = hand.angle;
          mesh.scale.set(this.config.length, this.config.thickness * 2, 1);
        });
        break;
      }
      case 'pulseRing': {
        const state = pulseRingStateAtTime(this.config, time);
        const n = this.meshes.length;
        const band = state.radius;
        const segW = Math.max(0.15, state.thickness * 2.2);
        const segH = Math.max(0.2, ((Math.PI * 2) / n) * band * 0.95);
        for (let i = 0; i < n; i += 1) {
          const mesh = this.meshes[i];
          if (!mesh) continue;
          const ang = (i / n) * Math.PI * 2;
          mesh.position.set(
            state.centerX + Math.cos(ang) * band,
            state.centerY + Math.sin(ang) * band,
            0,
          );
          mesh.rotation.z = ang;
          mesh.scale.set(segW, segH, 1);
          (mesh.material as THREE.MeshBasicMaterial).opacity = 0.4 + 0.35 * (1 - state.cycleT);
        }
        break;
      }
      case 'scissorGate': {
        const state = scissorGateStateAtTime(this.config, time);
        state.bars.forEach((bar, i) => {
          const mesh = this.meshes[i];
          if (!mesh || !this.config || this.config.type !== 'scissorGate') return;
          mesh.position.set((bar.ax + bar.bx) / 2, (bar.ay + bar.by) / 2, 0);
          mesh.rotation.z = Math.atan2(bar.by - bar.ay, bar.bx - bar.ax);
          mesh.scale.set(this.config.barLength * 2, this.config.barThickness * 2, 1);
        });
        break;
      }
      case 'speedField': {
        const state = speedFieldStateAtTime(this.config, time);
        const mesh = this.meshes[0];
        if (!mesh) return;
        mesh.position.set(state.centerX, state.centerY, 0);
        mesh.scale.set(state.width, state.height, 1);
        (mesh.material as THREE.MeshBasicMaterial).opacity = 0.18 + 0.16 * state.pulse;
        break;
      }
      case 'splitShutter': {
        const state = splitShutterStateAtTime(this.config, time);
        const left = this.meshes[0];
        const right = this.meshes[1];
        if (left) {
          left.position.set(state.leftX, state.y, 0);
          left.scale.set(this.config.panelWidth, state.height, 1);
        }
        if (right) {
          right.position.set(state.rightX, state.y, 0);
          right.scale.set(this.config.panelWidth, state.height, 1);
        }
        break;
      }
      case 'reactiveGate': {
        const state = reactiveGateStateAtTime(this.config, time);
        const left = this.meshes[0];
        const right = this.meshes[1];
        const color = state.warning ? 0xffb14a : state.phase === 'open' ? 0x6bc4d8 : 0x8ab4c8;
        const opacity = state.phase === 'open' ? 0.75 : state.warning ? 0.9 : 0.95;
        if (left) {
          left.position.set(state.leftX, state.y, 0);
          left.scale.set(state.panelWidth, state.panelHeight, 1);
          const mat = left.material as THREE.MeshBasicMaterial;
          mat.color.setHex(color);
          mat.opacity = opacity;
        }
        if (right) {
          right.position.set(state.rightX, state.y, 0);
          right.scale.set(state.panelWidth, state.panelHeight, 1);
          const mat = right.material as THREE.MeshBasicMaterial;
          mat.color.setHex(color);
          mat.opacity = opacity;
        }
        break;
      }
      case 'conveyorGate': {
        const blocks = conveyorGateBlocksAtTime(this.config, time);
        blocks.forEach((block, i) => {
          const mesh = this.meshes[i];
          if (!mesh) return;
          mesh.position.set(block.x, block.y, 0);
          mesh.scale.set(block.radius * 2, block.radius * 2, 1);
        });
        break;
      }
      case 'rollingAperture': {
        const state = rollingApertureStateAtTime(this.config, time);
        const n = this.meshes.length;
        const band = state.radius + 0.18;
        const segW = 0.28;
        const segH = Math.max(0.22, ((Math.PI * 2) / n) * band * 0.9);
        for (let i = 0; i < n; i += 1) {
          const mesh = this.meshes[i];
          if (!mesh) continue;
          const ang = (i / n) * Math.PI * 2;
          mesh.position.set(state.x + Math.cos(ang) * band, state.y + Math.sin(ang) * band, 0);
          mesh.rotation.z = ang;
          mesh.scale.set(segW, segH, 1);
          (mesh.material as THREE.MeshBasicMaterial).opacity = 0.8;
        }
        break;
      }
      case 'corkscrewTunnel': {
        const state = corkscrewStateAtTime(this.config, time);
        const band = (state.radius + state.innerRadius) / 2;
        const thickness = Math.max(0.2, state.radius - state.innerRadius);
        const span = Math.PI * 2 - state.gapWidth;
        const start = state.gapAngle + state.gapWidth / 2;
        const n = this.meshes.length;
        for (let i = 0; i < n; i += 1) {
          const mesh = this.meshes[i];
          if (!mesh) continue;
          const t = n <= 1 ? 0 : i / (n - 1);
          const ang = start + span * t;
          mesh.visible = true;
          mesh.position.set(
            state.centerX + Math.cos(ang) * band,
            state.centerY + Math.sin(ang) * band,
            0,
          );
          mesh.rotation.z = ang;
          mesh.scale.set(thickness, Math.max(0.22, (span / Math.max(1, n - 1)) * band * 0.95), 1);
        }
        break;
      }
      case 'cometCrossing': {
        const state = cometCrossingStateAtTime(this.config, time);
        const mesh = this.meshes[0];
        if (!mesh) return;
        mesh.position.set(state.x, state.y, 0);
        mesh.scale.set(state.radius * 2, state.radius * 2, 1);
        break;
      }
    }
  }
}
