import { getCommercialConfig } from '../../config/commercial';
import { ANALYTICS_EVENTS, type AnalyticsEventName, type AnalyticsProperties } from './analyticsEvents';
import type { AnalyticsProvider } from './AnalyticsProvider';

function makeId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

class ConsoleAnalyticsProvider implements AnalyticsProvider {
  track(eventName: AnalyticsEventName, properties: AnalyticsProperties): void {
    if (typeof __DEV__ !== 'undefined' && __DEV__ && Analytics.debug) {
      console.log(`[analytics] ${eventName}`, properties);
    }
  }
}

class AnalyticsImpl {
  debug = false;
  sessionId = makeId('ses');
  runId: string | null = null;
  private lastRunEndedAt = 0;
  private provider: AnalyticsProvider = new ConsoleAnalyticsProvider();
  private onboardingStarted = false;

  setProvider(provider: AnalyticsProvider): void {
    this.provider = provider;
  }

  newSession(): string {
    this.sessionId = makeId('ses');
    return this.sessionId;
  }

  newRunId(): string {
    this.runId = makeId('run');
    return this.runId;
  }

  noteRunEnded(): void {
    this.lastRunEndedAt = Date.now();
  }

  isImmediateRetry(windowMs = 10_000): boolean {
    return this.lastRunEndedAt > 0 && Date.now() - this.lastRunEndedAt <= windowMs;
  }

  track(eventName: AnalyticsEventName, properties: AnalyticsProperties = {}): void {
    if (!getCommercialConfig().analyticsEnabled) {
      return;
    }
    const payload: AnalyticsProperties = {
      sessionId: this.sessionId,
      ...properties,
    };
    this.provider.track(eventName, payload);
  }

  appOpen(): void {
    this.track(ANALYTICS_EVENTS.appOpen, { sessionId: this.sessionId });
  }

  markOnboardingStarted(): void {
    if (this.onboardingStarted) {
      return;
    }
    this.onboardingStarted = true;
    this.track(ANALYTICS_EVENTS.onboardingStarted);
  }

  markOnboardingCompleted(): void {
    this.track(ANALYTICS_EVENTS.onboardingCompleted);
  }
}

export const Analytics = new AnalyticsImpl();
export { ANALYTICS_EVENTS };
