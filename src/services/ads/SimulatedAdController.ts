import type { AdController, AdKind, AdShowResult, AdStatus } from './AdTypes';

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class SimulatedAdController implements AdController {
  status: AdStatus = 'IDLE';
  readonly kind: AdKind;
  private failNext = false;
  private showing = false;

  constructor(kind: AdKind) {
    this.kind = kind;
  }

  preload(): void {
    if (this.status === 'READY' || this.status === 'SHOWING' || this.status === 'LOADING') {
      return;
    }
    this.status = 'LOADING';
    setTimeout(() => {
      if (this.failNext) {
        this.status = 'FAILED';
        return;
      }
      if (this.status === 'LOADING') {
        this.status = 'READY';
      }
    }, 240);
  }

  isReady(): boolean {
    return this.status === 'READY';
  }

  async show(): Promise<AdShowResult> {
    if (this.showing) {
      return 'failed';
    }
    if (this.failNext || this.status === 'FAILED') {
      this.status = 'FAILED';
      return 'failed';
    }
    if (this.status !== 'READY') {
      return 'failed';
    }
    this.showing = true;
    this.status = 'SHOWING';
    await wait(700);
    this.showing = false;
    if (this.failNext) {
      this.status = 'FAILED';
      this.failNext = false;
      this.preload();
      return 'failed';
    }
    this.status = 'IDLE';
    this.preload();
    return this.kind === 'rewarded' ? 'completed' : 'dismissed';
  }

  forceReady(): void {
    this.failNext = false;
    this.status = 'READY';
  }

  forceFailure(): void {
    this.failNext = true;
    this.status = 'FAILED';
  }

  reset(): void {
    this.failNext = false;
    this.showing = false;
    this.status = 'IDLE';
    this.preload();
  }
}
