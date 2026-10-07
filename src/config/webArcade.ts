import { Platform } from 'react-native';

/**
 * A web-only presentation of the existing Arcade catalog. The flag is baked
 * into the exported browser bundle; native builds always retain their normal
 * Campaign and commerce flows.
 */
export const isWebArcadeBuild =
  Platform.OS === 'web' && process.env.EXPO_PUBLIC_WEB_MODE === 'arcade';
