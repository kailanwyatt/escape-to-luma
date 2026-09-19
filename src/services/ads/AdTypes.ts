export type AdKind = 'rewarded' | 'interstitial';

export type AdStatus = 'IDLE' | 'LOADING' | 'READY' | 'SHOWING' | 'FAILED';

export type AdShowResult = 'completed' | 'dismissed' | 'failed';

export type AdController = {
  status: AdStatus;
  kind: AdKind;
  preload(): void;
  isReady(): boolean;
  show(): Promise<AdShowResult>;
  forceReady(): void;
  forceFailure(): void;
  reset(): void;
};
