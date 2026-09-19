import type { AnalyticsEventName, AnalyticsProperties } from './analyticsEvents';

export type AnalyticsProvider = {
  track(eventName: AnalyticsEventName, properties: AnalyticsProperties): void;
};
