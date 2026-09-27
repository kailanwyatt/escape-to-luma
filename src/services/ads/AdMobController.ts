import { getAdMobIds, getCommercialConfig } from '../../config/commercial';
import type { AdController, AdKind, AdShowResult, AdStatus } from './AdTypes';

type Unsub = () => void;

type FullscreenAd = {
  load: () => void;
  show: () => Promise<void>;
  addAdEventListener: (type: string, listener: (...args: never[]) => void) => Unsub;
};

function platformOS(): string {
  try {
    return (require('react-native') as { Platform: { OS: string } }).Platform.OS;
  } catch {
    return 'web';
  }
}

function loadAdsModule(): typeof import('react-native-google-mobile-ads') {
  return require('react-native-google-mobile-ads') as typeof import('react-native-google-mobile-ads');
}

function unitIdFor(kind: AdKind): string {
  const { useTestAds } = getCommercialConfig();
  const ads = loadAdsModule();
  if (useTestAds) {
    return kind === 'rewarded' ? ads.TestIds.REWARDED : ads.TestIds.INTERSTITIAL;
  }
  const ids = getAdMobIds(false);
  const ios = platformOS() === 'ios';
  if (kind === 'rewarded') {
    return ios ? ids.rewardedIos : ids.rewardedAndroid;
  }
  return ios ? ids.interstitialIos : ids.interstitialAndroid;
}

/** Live AdMob fullscreen controller (rewarded or interstitial). */
export class AdMobController implements AdController {
  status: AdStatus = 'IDLE';
  readonly kind: AdKind;
  private ad: FullscreenAd | null = null;
  private unsubs: Unsub[] = [];
  private showWaiter: {
    resolve: (result: AdShowResult) => void;
  } | null = null;
  private earnedReward = false;

  constructor(kind: AdKind) {
    this.kind = kind;
  }

  private clearListeners(): void {
    for (const unsub of this.unsubs) unsub();
    this.unsubs = [];
  }

  private recreate(): void {
    this.clearListeners();
    const ads = loadAdsModule();
    const unitId = unitIdFor(this.kind);
    const created =
      this.kind === 'rewarded'
        ? ads.RewardedAd.createForAdRequest(unitId)
        : ads.InterstitialAd.createForAdRequest(unitId);
    this.ad = created as unknown as FullscreenAd;

    const loadedType =
      this.kind === 'rewarded' ? ads.RewardedAdEventType.LOADED : ads.AdEventType.LOADED;

    this.unsubs.push(
      this.ad.addAdEventListener(loadedType, () => {
        this.status = 'READY';
      }),
    );
    this.unsubs.push(
      this.ad.addAdEventListener(ads.AdEventType.ERROR, () => {
        this.status = 'FAILED';
        if (this.showWaiter) {
          this.showWaiter.resolve('failed');
          this.showWaiter = null;
        }
      }),
    );
    this.unsubs.push(
      this.ad.addAdEventListener(ads.AdEventType.CLOSED, () => {
        const result: AdShowResult =
          this.kind === 'rewarded' ? (this.earnedReward ? 'completed' : 'dismissed') : 'dismissed';
        this.earnedReward = false;
        this.status = 'IDLE';
        this.showWaiter?.resolve(result);
        this.showWaiter = null;
        this.preload();
      }),
    );
    if (this.kind === 'rewarded') {
      this.unsubs.push(
        this.ad.addAdEventListener(ads.RewardedAdEventType.EARNED_REWARD, () => {
          this.earnedReward = true;
        }),
      );
    }
  }

  preload(): void {
    if (this.status === 'READY' || this.status === 'SHOWING' || this.status === 'LOADING') {
      return;
    }
    try {
      this.status = 'LOADING';
      this.recreate();
      this.ad?.load();
    } catch {
      this.status = 'FAILED';
    }
  }

  isReady(): boolean {
    return this.status === 'READY';
  }

  async show(): Promise<AdShowResult> {
    if (this.status === 'SHOWING') return 'failed';
    if (this.status !== 'READY' || !this.ad) return 'failed';
    this.status = 'SHOWING';
    this.earnedReward = false;
    return new Promise<AdShowResult>((resolve) => {
      this.showWaiter = { resolve };
      this.ad!.show().catch(() => {
        this.status = 'FAILED';
        this.showWaiter = null;
        resolve('failed');
        this.preload();
      });
    });
  }

  forceReady(): void {
    // Live ads cannot be forced; no-op for debug toggles.
  }

  forceFailure(): void {
    this.status = 'FAILED';
  }

  reset(): void {
    this.clearListeners();
    this.ad = null;
    this.showWaiter = null;
    this.earnedReward = false;
    this.status = 'IDLE';
    this.preload();
  }
}

export async function initializeMobileAds(): Promise<boolean> {
  if (platformOS() === 'web') return false;
  try {
    const mobileAds = loadAdsModule().default;
    await mobileAds().initialize();
    return true;
  } catch {
    return false;
  }
}

export function adMobNativeAvailable(): boolean {
  if (platformOS() === 'web') return false;
  try {
    loadAdsModule();
    return true;
  } catch {
    return false;
  }
}
