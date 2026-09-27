import { Platform } from 'react-native';
import {
  getTrackingPermissionsAsync,
  isAvailable,
  requestTrackingPermissionsAsync,
  PermissionStatus,
} from 'expo-tracking-transparency';
import { RELEASE_POLICY } from '../../config/release';

/**
 * Request App Tracking Transparency on iOS before ads initialize.
 * Safe no-op on Android/web, when ATT is unavailable, or when tracking is off.
 * Returns whether tracking was granted (useful for ad SDK configuration).
 */
export async function requestTrackingIfNeeded(): Promise<boolean> {
  if (!RELEASE_POLICY.trackingPromptEnabled) {
    return false;
  }
  if (Platform.OS !== 'ios' || !isAvailable()) {
    return Platform.OS !== 'ios';
  }
  try {
    const current = await getTrackingPermissionsAsync();
    if (current.status !== PermissionStatus.UNDETERMINED) {
      return current.granted;
    }
    const next = await requestTrackingPermissionsAsync();
    return next.granted;
  } catch {
    return false;
  }
}
