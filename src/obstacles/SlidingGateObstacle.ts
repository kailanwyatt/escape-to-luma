import * as THREE from 'three';
import {gateStateAtTime,SHUTTER_EVENTS,type ShutterEvent} from './RapidShutterState';
import {createRapidShutter,layoutRapidShutter} from './RapidShutterVisual';

import type { EnvironmentId } from '../config/ChallengeConfig';
import type { SlidingGateConfig } from '../config/ObstacleConfig';
import { GAME_TUNING } from '../game/gameTuning';
import {
  createGateVisual,
  layoutGateVisual,
  replaceVisual,
} from './ObstacleVisuals';
import { evaluateBreachCollision, evaluateGateCollision, type ObstacleCollisionResult } from './ObstacleCollision';
import {
  emptyPredictedState,
  type ObstacleDebugInfo,
  type ObstaclePredictedState,
} from './GameplayObstacle';

export class SlidingGateObstacle {
  readonly id: string;
  readonly type = 'slidingGate' as const;
  readonly group = new THREE.Group();
  z = GAME_TUNING.rotor.z;
  active = false;
  private config: SlidingGateConfig | null = null;
  private visual: THREE.Group | null = null;
  private environment: EnvironmentId = 'workshop';
  private appearance: NonNullable<SlidingGateConfig['appearance']> = 'standard';
  private elapsed = 0;
  onShutterEvent?: (event:ShutterEvent)=>void;
  private eventKey='';
  private rapid=false;
  openingX = 0;
  openingY = GAME_TUNING.gate.baseY;

  constructor(id: string) {
    this.id = id;
    this.group.visible = false;
  }

  applyConfig(config: SlidingGateConfig, environment: EnvironmentId): void {
    this.config = config;
    this.eventKey='';
    this.active = true;
    this.group.visible = true;
    this.z = config.z;
    this.elapsed = 0;
    this.openingY = config.baseY ?? GAME_TUNING.gate.baseY;
    const appearance = config.appearance ?? 'standard';
    if (
      !this.visual || config.movementMode==='rapidShutter' || this.rapid ||
      environment !== this.environment ||
      appearance !== this.appearance
    ) {
      this.environment = environment;
      this.appearance = appearance;
      this.visual = replaceVisual(
        this.group,
        this.visual,
        config.movementMode==='rapidShutter'?createRapidShutter(config):createGateVisual(environment, appearance),
      );
    }
    this.rapid=config.movementMode==='rapidShutter';
    this.update(0, 0);
  }

  hide(): void {
    this.active = false;
    this.group.visible = false;
    this.config = null;
  }

  update(dt: number, elapsedTime: number): void {
    if (!this.active || !this.config) {
      return;
    }
    this.elapsed = elapsedTime;
    const state=gateStateAtTime(this.config,elapsedTime);
    this.openingX=state.x;this.openingY=state.y;
    if(state.shutter){
      const key=`${state.shutter.cycle}:${state.shutter.beat}`;
      if(this.eventKey&&this.eventKey!==key)this.onShutterEvent?.(SHUTTER_EVENTS[state.shutter.phase]);
      this.eventKey=key;
    }
    this.group.position.set(0, 0, this.z);
    if (this.visual && this.rapid)layoutRapidShutter(this.visual,this.config,elapsedTime);
    else if (this.visual) {
      layoutGateVisual(
        this.visual,
        this.openingX,
        this.openingY,
        this.config.openingWidth,
        this.config.openingHeight,
      );
    }
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
    const fraction=(this.z-previous.z)/(current.z-previous.z);
    const state=gateStateAtTime(this.config,currentSimulationTime-stepSeconds+stepSeconds*fraction);
    return (this.appearance === 'containmentGlass' ? evaluateBreachCollision : evaluateGateCollision)(
      at.x,
      at.y,
      projectileRadius,
      state.x,
      state.y,
      state.width,
      state.height,
    );
  }

  predictState(deltaSeconds: number, simTime: number): ObstaclePredictedState {
    const config = this.config;
    const predicted = emptyPredictedState(this.type, this.z);
    if (!config) {
      return predicted;
    }
    const state=gateStateAtTime(config,simTime+deltaSeconds);
    predicted.x=state.x;predicted.y=state.y;
    predicted.openingX=state.x;predicted.openingY=state.y;
    predicted.openingWidth=state.width;predicted.openingHeight=state.height;
    return predicted;
  }

  evaluateAt(
    x: number,
    y: number,
    projectileRadius: number,
    predicted: ObstaclePredictedState,
  ): ObstacleCollisionResult {
    return (this.appearance === 'containmentGlass' ? evaluateBreachCollision : evaluateGateCollision)(
      x,
      y,
      projectileRadius,
      predicted.openingX,
      predicted.openingY,
      predicted.openingWidth,
      predicted.openingHeight,
    );
  }

  getDebugInfo(): ObstacleDebugInfo {
    const predicted = this.predictState(0, this.elapsed);
    const state=this.config?gateStateAtTime(this.config,this.elapsed):null;
    return {
      ...predicted,
      speed: this.config?.speed ?? 0,
      extra: state?.shutter?`${state.shutter.phase} t:${state.shutter.timeInState.toFixed(2)} slam:${state.shutter.timeUntilSlam.toFixed(2)} w:${state.width.toFixed(2)} left:${(state.x-state.width/2).toFixed(2)} right:${(state.x+state.width/2).toFixed(2)}`:`w${(this.config?.openingWidth ?? 0).toFixed(2)} h${(this.config?.openingHeight ?? 0).toFixed(2)} x${this.openingX.toFixed(2)}`,
    };
  }
}

export function interpolateAtZ(
  previous: { x: number; y: number; z: number },
  current: { x: number; y: number; z: number },
  z: number,
): THREE.Vector3 {
  const span = current.z - previous.z;
  const t = span === 0 ? 1 : (z - previous.z) / span;
  return new THREE.Vector3(
    previous.x + (current.x - previous.x) * t,
    previous.y + (current.y - previous.y) * t,
    z,
  );
}
