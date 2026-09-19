import { PROTOTYPE_SHOTS } from '../config/prototypeShots';
import type { ShotConfig } from '../config/ShotConfig';

export class ShotManager {
  private index = 0;

  get current(): ShotConfig {
    return PROTOTYPE_SHOTS[this.index];
  }

  get shotId(): number {
    return this.current.id;
  }

  get total(): number {
    return PROTOTYPE_SHOTS.length;
  }

  get isLast(): boolean {
    return this.index >= PROTOTYPE_SHOTS.length - 1;
  }

  advance(): boolean {
    if (this.isLast) {
      return false;
    }
    this.index += 1;
    return true;
  }

  reset(): void {
    this.index = 0;
  }
}
