/** App Tracking Transparency is an iOS-only permission. */
export async function requestTrackingIfNeeded(): Promise<boolean> {
  return false;
}
