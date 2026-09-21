import * as THREE from 'three';
import {FormationObstacle} from './FormationObstacle';

import type { EnvironmentId } from '../config/ChallengeConfig';
import {
  obstacleTypeOf,
  type ObstacleConfig,
  type ObstacleType,
} from '../config/ObstacleConfig';
import { emptyPredictedState, type ObstacleDebugInfo, type ObstaclePredictedState } from './GameplayObstacle';
import { evaluateRotorCollision, type ObstacleCollisionResult } from './ObstacleCollision';
import { DriftingBlockerObstacle } from './DriftingBlockerObstacle';
import { IrisObstacle } from './IrisObstacle';
import { LaserGridObstacle } from './LaserGridObstacle';
import { MovingRingObstacle } from './MovingRingObstacle';
import { OrbiterObstacle } from './OrbiterObstacle';
import { PendulumObstacle } from './PendulumObstacle';
import { PhaseFieldObstacle } from './PhaseFieldObstacle';
import { RotorObstacle } from './RotorObstacle';
import { ShiftingApertureObstacle } from './ShiftingApertureObstacle';
import { interpolateAtZ, SlidingGateObstacle } from './SlidingGateObstacle';
import { disposeThreeObject } from '../utils/disposeThree';

type ObstacleImpl =
  | RotorObstacle
  | SlidingGateObstacle
  | IrisObstacle
  | PendulumObstacle
  | MovingRingObstacle
  | OrbiterObstacle
  | DriftingBlockerObstacle
  | PhaseFieldObstacle
  | ShiftingApertureObstacle
  | LaserGridObstacle
  | FormationObstacle;

export class ObstacleSlot {
  readonly id: string;
  readonly group = new THREE.Group();
  private impl: ObstacleImpl;

  constructor(id: string) {
    this.id = id;
    this.impl = new RotorObstacle(id);
    this.group.add(this.impl.group);
  }

  get type(): ObstacleType {
    return this.impl.type;
  }

  get z(): number {
    return this.impl.z;
  }

  get active(): boolean {
    return this.impl.active;
  }

  get angle(): number {
    return this.impl instanceof RotorObstacle ? this.impl.angle : 0;
  }

  get currentSpeed(): number {
    return this.impl instanceof RotorObstacle ? this.impl.currentSpeed : 0;
  }

  get bladeCount(): number {
    return this.impl instanceof RotorObstacle ? this.impl.bladeCount : 0;
  }

  applyConfig(config: ObstacleConfig, environment: EnvironmentId): void {
    this.group.visible = true;
    const nextType = obstacleTypeOf(config);
    if (this.impl.type !== nextType) {
      this.group.remove(this.impl.group);
      this.impl.hide();
      disposeThreeObject(this.impl.group);
      this.impl = createImpl(this.id, nextType);
      this.group.add(this.impl.group);
    }
    applyTypedConfig(this.impl, config, environment);
  }

  hide(): void {
    this.group.visible = false;
    this.impl.hide();
  }

  dispose(): void {
    this.impl.hide();
    disposeThreeObject(this.impl.group);
    this.group.clear();
  }

  update(dt: number, elapsedTime: number): void {
    this.impl.update(dt, elapsedTime);
  }

  testProjectileCrossing(
    previous: THREE.Vector3,
    current: THREE.Vector3,
    projectileRadius: number,
    currentSimulationTime?: number,
    stepSeconds?: number,
  ): ObstacleCollisionResult | null {
    if (this.impl instanceof FormationObstacle || this.impl instanceof LaserGridObstacle || this.impl instanceof SlidingGateObstacle) {
      return this.impl.testProjectileCrossing(
        previous,
        current,
        projectileRadius,
        currentSimulationTime,
        stepSeconds,
      );
    }
    return this.impl.testProjectileCrossing(previous, current, projectileRadius);
  }

  laserBeamsAtTime(elapsedTime: number) {
    return this.impl instanceof LaserGridObstacle
      ? this.impl.beamsAtTime(elapsedTime)
      : [];
  }

  interpolateCrossing(previous: THREE.Vector3, current: THREE.Vector3): THREE.Vector3 {
    return interpolateAtZ(previous, current, this.z);
  }

  predictState(deltaSeconds: number, simTime: number): ObstaclePredictedState {
    if (this.impl instanceof RotorObstacle) {
      const rotor = this.impl.predictState(deltaSeconds, simTime);
      const predicted = emptyPredictedState('rotor', this.z);
      predicted.x = rotor.x;
      predicted.y = rotor.y;
      predicted.angle = rotor.angle;
      return predicted;
    }
    return this.impl.predictState(deltaSeconds, simTime);
  }

  evaluateAt(
    x: number,
    y: number,
    projectileRadius: number,
    predicted: ObstaclePredictedState,
  ): ObstacleCollisionResult {
    if (this.impl instanceof RotorObstacle) {
      return evaluateRotorCollision(
        x,
        y,
        projectileRadius,
        predicted.angle,
        this.impl.bladeCount,
        predicted.x,
        predicted.y,
      );
    }
    return this.impl.evaluateAt(x, y, projectileRadius, predicted);
  }

  getDebugInfo(): ObstacleDebugInfo {
    if (this.impl instanceof RotorObstacle) {
      const predicted = this.predictState(0, 0);
      return {
        ...predicted,
        x: this.impl.group.position.x,
        y: this.impl.group.position.y,
        angle: this.impl.angle,
        speed: this.impl.currentSpeed,
        extra: `b${this.impl.bladeCount} s${this.impl.currentSpeed.toFixed(2)}`,
      };
    }
    return this.impl.getDebugInfo();
  }
}

function createImpl(id: string, type: ObstacleType): ObstacleImpl {
  switch (type) {
    case 'formation':
      return new FormationObstacle(id);
    case 'slidingGate':
      return new SlidingGateObstacle(id);
    case 'iris':
      return new IrisObstacle(id);
    case 'pendulum':
      return new PendulumObstacle(id);
    case 'movingRing':
      return new MovingRingObstacle(id);
    case 'orbiter':
      return new OrbiterObstacle(id);
    case 'driftingBlocker':
      return new DriftingBlockerObstacle(id);
    case 'phaseField':
      return new PhaseFieldObstacle(id);
    case 'shiftingAperture':
      return new ShiftingApertureObstacle(id);
    case 'laserGrid':
      return new LaserGridObstacle(id);
    default:
      return new RotorObstacle(id);
  }
}

function applyTypedConfig(
  impl: ObstacleImpl,
  config: ObstacleConfig,
  environment: EnvironmentId,
): void {
  if (impl instanceof FormationObstacle && config.type === 'formation') {impl.applyConfig(config,environment);return;}
  if (impl instanceof SlidingGateObstacle && config.type === 'slidingGate') {
    impl.applyConfig(config, environment);
    return;
  }
  if (impl instanceof IrisObstacle && config.type === 'iris') {
    impl.applyConfig(config, environment);
    return;
  }
  if (impl instanceof PendulumObstacle && config.type === 'pendulum') {
    impl.applyConfig(config, environment);
    return;
  }
  if (impl instanceof MovingRingObstacle && config.type === 'movingRing') {
    impl.applyConfig(config, environment);
    return;
  }
  if (impl instanceof OrbiterObstacle && config.type === 'orbiter') {
    impl.applyConfig(config, environment);
    return;
  }
  if (impl instanceof DriftingBlockerObstacle && config.type === 'driftingBlocker') {
    impl.applyConfig(config, environment);
    return;
  }
  if (impl instanceof PhaseFieldObstacle && config.type === 'phaseField') {
    impl.applyConfig(config, environment);
    return;
  }
  if (impl instanceof ShiftingApertureObstacle && config.type === 'shiftingAperture') {
    impl.applyConfig(config, environment);
    return;
  }
  if (impl instanceof LaserGridObstacle && config.type === 'laserGrid') {
    impl.applyConfig(config, environment);
    return;
  }
  if (impl instanceof RotorObstacle && (!config.type || config.type === 'rotor')) {
    impl.applyConfig(config, environment);
  }
}
