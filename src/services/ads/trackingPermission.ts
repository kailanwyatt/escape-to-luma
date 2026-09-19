import { requestTrackingPermissionsAsync, isAvailable } from 'expo-tracking-transparency';

let asked = false;

/**
 * Request ATT only immediately before a real (non-simulated) ad.
 * Never called on first launch. Does not send the advertising ID to analytics.
 */
export async function requestTrackingIfNeeded(): Promise<void> {
  if (asked) {
    return;
  }
  asked = true;
  if (!isAvailable()) {
    return;
  }
  try {
    await requestTrackingPermissionsAsync();
  } catch {
    // Permission is optional; ads still function as non-personalized.
  }
}
