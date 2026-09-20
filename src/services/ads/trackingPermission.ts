/**
 * TestFlight deliberately ships without tracking or an ATT prompt.
 * Keep the service seam so a future real ad provider can implement consent
 * without touching gameplay callers.
 */
export async function requestTrackingIfNeeded(): Promise<void> {
  return Promise.resolve();
}
