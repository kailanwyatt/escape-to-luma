import { Platform } from 'react-native';
import {
  getTrackingPermissionsAsync,
  isAvailable,
  requestTrackingPermissionsAsync,
  PermissionStatus,
} from 'expo-tracking-transparency';

/**
 * Request App Tracking Transparency on iOS before ads initialize.
 * Safe no-op on Android/web and when ATT is unavailable.
 * Returns whether tracking was granted (useful for ad SDK configuration).
 */
export async function requestTrackingIfNeeded(): Promise<boolean> {
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
