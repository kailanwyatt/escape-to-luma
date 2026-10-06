import type { AdController, AdKind, AdShowResult, AdStatus } from './AdTypes';

/** AdMob is native-only; keep the browser preview free of native SDK imports. */
export class AdMobController implements AdController {
  status: AdStatus = 'IDLE';
  constructor(readonly kind: AdKind) {}
  preload(): void { this.status = 'FAILED'; }
  isReady(): boolean { return false; }
  async show(): Promise<AdShowResult> { return 'failed'; }
  forceReady(): void {}
  forceFailure(): void { this.status = 'FAILED'; }
  reset(): void { this.status = 'IDLE'; }
}

export async function initializeMobileAds(): Promise<boolean> { return false; }
export function adMobNativeAvailable(): boolean { return false; }
