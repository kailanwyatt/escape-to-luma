import { Asset } from 'expo-asset';
import { GameLog } from '../debug/GameLog';
import type { TimelinePlayer } from './TimelineAudio';

export interface ManagedAudioPlayer extends TimelinePlayer {
  volume: number;
  playbackRate: number;
  release(): void;
}

/** Expo's web play() discards HTMLMediaElement.play's promise. Own that promise
 * here so a normal pause/skip cannot create an unhandled AbortError. */
export function createManagedAudioPlayer(source: number): ManagedAudioPlayer {
  const media = new Audio(Asset.fromModule(source).uri);
  media.preload = 'auto';
  return {
    get isLoaded() { return media.readyState >= 2; },
    get currentTime() { return media.currentTime; },
    get volume() { return media.volume; },
    set volume(value: number) { media.volume = value; },
    get playbackRate() { return media.playbackRate; },
    set playbackRate(value: number) { media.playbackRate = value; },
    async seekTo(seconds: number) { media.currentTime = seconds; },
    play() {
      void media.play().catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        GameLog.warnOnce('web-audio-play', 'Browser audio unavailable; interact with the game to enable sound');
      });
    },
    pause() { media.pause(); },
    release() { media.pause(); media.removeAttribute('src'); media.load(); },
  };
}
