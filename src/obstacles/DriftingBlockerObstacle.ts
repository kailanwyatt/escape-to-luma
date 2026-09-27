import * as THREE from 'three';

import type { EnvironmentId } from '../config/ChallengeConfig';
import type { DriftingBlockerConfig } from '../config/ObstacleConfig';
import { GAME_TUNING } from '../game/gameTuning';
import { evaluateBlockerCollision, type ObstacleCollisionResult } from './ObstacleCollision';
import {
  emptyPredictedState,
  type ObstacleDebugInfo,
  type ObstaclePredictedState,
} from './GameplayObstacle';
import { interpolateAtZ } from './SlidingGateObstacle';
import { DriftingBlockerArt } from './DriftingBlockerArt';

export class DriftingBlockerObstacle {
  readonly id: string;
  readonly type = 'driftingBlocker' as const;
  readonly group = new THREE.Group();
  z = GAME_TUNING.rotor.z;
  active = false;
  blockerX = 0;
  blockerY = 3;
  private config: DriftingBlockerConfig | null = null;
  private art: DriftingBlockerArt | null = null;

  constructor(id: string) {
    this.id = id;
    this.group.name = 'drifting-blocker';
    this.group.visible = false;
  }

  applyConfig(config: DriftingBlockerConfig, _environment: EnvironmentId): void {
    this.config = config;
    this.active = true;
    this.group.visible = true;
    this.z = config.z;
    this.group.position.set(config.baseX, config.baseY, config.z);

    if (this.art) {
      this.group.remove(this.art.group);
      this.art.dispose();
      this.art = null;
    }
    this.art = new DriftingBlockerArt(config);
    this.group.add(this.art.group);
    this.update(0, 0);
  }

  hide(): void {
    this.active = false;
    this.group.visible = false;
    this.config = null;
  }

  update(_dt: number, elapsedTime: number): void {
    if (!this.active || !this.config || !this.art) {
      return;
    }
    const pos = driftPosition(this.config, elapsedTime);
    this.blockerX = pos.x;
    this.blockerY = pos.y;
    // Art is local to baseX/baseY; world position stays at the drift center.
    this.group.position.set(this.config.baseX, this.config.baseY, this.z);
    this.art.update(elapsedTime);
  }

  testProjectileCrossing(
    previous: THREE.Vector3,
    current: THREE.Vector3,
    projectileRadius: number,
  ): ObstacleCollisionResult | null {
    if (!this.active || !this.config || previous.z >= this.z || current.z < this.z) {
      return null;
    }
    const at = interpolateAtZ(previous, current, this.z);
    return evaluateBlockerCollision(
      at.x,
      at.y,
      projectileRadius,
      this.blockerX,
      this.blockerY,
      this.config.blockerRadius,
      'drift',
    );
  }

  predictState(deltaSeconds: number, simTime: number): ObstaclePredictedState {
    const predicted = emptyPredictedState(this.type, this.z);
    if (!this.config) {
      return predicted;
    }
    const pos = driftPosition(this.config, simTime + deltaSeconds);
    predicted.blockerX = pos.x;
    predicted.blockerY = pos.y;
    predicted.blockerRadius = this.config.blockerRadius;
    predicted.x = pos.x;
    predicted.y = pos.y;
    return predicted;
  }

  evaluateAt(
    x: number,
    y: number,
    projectileRadius: number,
    predicted: ObstaclePredictedState,
  ): ObstacleCollisionResult {
    return evaluateBlockerCollision(
      x,
      y,
      projectileRadius,
      predicted.blockerX,
      predicted.blockerY,
      predicted.blockerRadius,
      'drift',
    );
  }

  getDebugInfo(): ObstacleDebugInfo {
    const predicted = this.predictState(0, 0);
    return {
      ...predicted,
      speed: this.config?.speed ?? 0,
      extra: `drift r${(this.config?.blockerRadius ?? 0).toFixed(2)}`,
    };
  }
}

export function driftPosition(config: DriftingBlockerConfig, elapsedTime: number) {
  const t = elapsedTime * config.speed + (config.phase ?? 0);
  return {
    x: config.baseX + Math.sin(t) * config.amplitudeX,
    y: config.baseY + Math.cos(t * 0.85) * config.amplitudeY,
  };
}
