import { Platform } from 'react-native';
import { isWebArcadeBuild } from '../../config/webArcade';

type WebArcadeEvent = 'arcade_game_started' | 'arcade_run_finished';
type WebArcadeParameters = Record<string, string | number | boolean>;
type ArcadeHostWindow = Window & {
  trackSparkEvent?: (eventName: string, parameters?: WebArcadeParameters) => void;
};

/** Send consent-gated analytics events from the embedded Arcade game to its site shell. */
export function reportWebArcadeEvent(
  eventName: WebArcadeEvent,
  parameters: WebArcadeParameters = {},
): void {
  if (!isWebArcadeBuild || Platform.OS !== 'web' || typeof window === 'undefined') {
    return;
  }
  if (window.parent === window) {
    (window as ArcadeHostWindow).trackSparkEvent?.(eventName, parameters);
    return;
  }
  window.parent.postMessage(
    { source: 'spark-arcade', eventName, parameters },
    window.location.origin,
  );
}
