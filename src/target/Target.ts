import {JumpGateVisual} from './JumpGateVisual';
import * as THREE from 'three';

import type { ChallengeConfig } from '../config/ChallengeConfig';
import { sampleMovement } from '../config/MovementConfig';
import { GAME_TUNING } from '../game/gameTuning';

export class Target {
  readonly group = new THREE.Group();
  x = GAME_TUNING.target.defaultCenter.x;
  y = GAME_TUNING.target.defaultCenter.y;
  z = GAME_TUNING.target.z;
  radius = GAME_TUNING.target.defaultRadius;
  baseX = 0;
  baseY = 3;
  private readonly visual = new JumpGateVisual();
  private breach = false;
  private movement?: ChallengeConfig['target']['movement'];

  constructor() {
    this.group.add(this.visual.group);
    this.syncScale();
    this.group.position.set(this.x, this.y, this.z);
  }

  applyConfig(config: ChallengeConfig['target']): void {
    this.group.visible = true;
    this.baseX = config.x;
    this.baseY = config.y;
    this.x = config.x;
    this.y = config.y;
    this.z = config.z ?? GAME_TUNING.target.z;
    this.radius = config.radius;
    this.movement = config.movement;
    this.visual.reset();
    this.syncScale();
    this.group.position.set(this.x, this.y, this.z);
  }

  /** The breach is the destination in the opening; retain scoring without a bullseye prop. */
  setBreachPresentation(breach: boolean): void {
    this.breach = breach;
    this.visual.group.visible = !breach;
  }

  setWorld(world:string):void {this.visual.setWorld(world);}

  get isBreach(): boolean {return this.breach;}
  triggerPulse(strength: number): void {this.visual.trigger(strength);}
  updateVisual(dt: number, reduceMotion: boolean): void {this.visual.update(dt,reduceMotion);}

  update(dt: number, elapsedTime: number): void {
    if (this.movement?.type === 'horizontal') {
      this.x = sampleMovement(this.movement, this.baseX, elapsedTime);
    } else if (this.movement?.type === 'vertical') {
      this.y = sampleMovement(this.movement, this.baseY, elapsedTime);
    } else {
      this.x = this.baseX;
      this.y = this.baseY;
    }
    this.group.position.set(this.x, this.y, this.z);

  }

  predictPosition(atTime: number): { x: number; y: number } {
    if (this.movement?.type === 'horizontal') {
      return { x: sampleMovement(this.movement, this.baseX, atTime), y: this.baseY };
    }
    if (this.movement?.type === 'vertical') {
      return { x: this.baseX, y: sampleMovement(this.movement, this.baseY, atTime) };
    }
    return { x: this.baseX, y: this.baseY };
  }

  private syncScale(): void {
    // Unit visual aperture equals the scoring radius. No feedback scales this group.
    this.group.scale.setScalar(this.radius);
  }
  dispose(): void {this.visual.dispose();}
}
