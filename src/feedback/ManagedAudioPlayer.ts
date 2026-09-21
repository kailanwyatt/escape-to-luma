import { createAudioPlayer } from 'expo-audio';
import type { TimelinePlayer } from './TimelineAudio';

export interface ManagedAudioPlayer extends TimelinePlayer {
  volume: number;
  playbackRate: number;
  release(): void;
}

/** Native playback remains owned by Expo Audio. */
export function createManagedAudioPlayer(source: number): ManagedAudioPlayer {
  return createAudioPlayer(source, { updateInterval: 100 });
}
