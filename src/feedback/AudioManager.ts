import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

import { GameLog } from '../debug/GameLog';

export type AudioEvent =
  | 'ui'
  | 'aim'
  | 'launch'
  | 'close-call'
  | 'rotor'
  | 'gate'
  | 'iris'
  | 'pendulum'
  | 'ring'
  | 'miss'
  | 'hit'
  | 'great'
  | 'bullseye'
  | 'perfect'
  | 'streak'
  | 'heart'
  | 'new-best'
  | 'level-up'
  | 'unlock'
  | 'run-over';

const PRIORITY: Record<AudioEvent, number> = {
  perfect: 100,
  bullseye: 90,
  rotor: 80,
  gate: 80,
  iris: 80,
  pendulum: 80,
  ring: 80,
  'level-up': 70,
  unlock: 65,
  'new-best': 60,
  'run-over': 55,
  heart: 50,
  'close-call': 40,
  great: 35,
  hit: 30,
  streak: 28,
  miss: 22,
  launch: 20,
  aim: 12,
  ui: 10,
};

const FILE: Record<AudioEvent, AudioEvent | 'collision'> = {
  ui: 'ui',
  aim: 'aim',
  launch: 'launch',
  'close-call': 'close-call',
  rotor: 'collision',
  gate: 'collision',
  iris: 'collision',
  pendulum: 'collision',
  ring: 'collision',
  miss: 'miss',
  hit: 'hit',
  great: 'great',
  bullseye: 'bullseye',
  perfect: 'perfect',
  streak: 'streak',
  heart: 'heart',
  'new-best': 'new-best',
  'level-up': 'level-up',
  unlock: 'unlock',
  'run-over': 'run-over',
};

const SOURCES: Record<string, number> = {
  ui: require('../../assets/sfx/ui.wav'),
  aim: require('../../assets/sfx/aim.wav'),
  launch: require('../../assets/sfx/launch.wav'),
  collision: require('../../assets/sfx/collision.wav'),
  'close-call': require('../../assets/sfx/close-call.wav'),
  miss: require('../../assets/sfx/miss.wav'),
  hit: require('../../assets/sfx/hit.wav'),
  great: require('../../assets/sfx/great.wav'),
  bullseye: require('../../assets/sfx/bullseye.wav'),
  perfect: require('../../assets/sfx/perfect.wav'),
  streak: require('../../assets/sfx/streak.wav'),
  heart: require('../../assets/sfx/heart.wav'),
  'new-best': require('../../assets/sfx/new-best.wav'),
  'level-up': require('../../assets/sfx/level-up.wav'),
  unlock: require('../../assets/sfx/unlock.wav'),
  'run-over': require('../../assets/sfx/run-over.wav'),
};

class AudioManagerImpl {
  enabled = true;
  private suspended = false;
  private ready = false;
  private players = new Map<string, AudioPlayer>();
  private current: { event: AudioEvent; until: number } | null = null;

  async init(): Promise<void> {
    if (this.ready) {
      return;
    }
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        interruptionMode: 'mixWithOthers',
      });
    } catch {
      GameLog.warnOnce('audio-mode', 'Audio session could not be configured');
    }
    for (const [id, source] of Object.entries(SOURCES)) {
      try {
        const player = createAudioPlayer(source);
        this.players.set(id, player);
      } catch {
        GameLog.warnOnce(`audio-missing-${id}`, `Missing audio asset: ${id}`);
      }
    }
    this.ready = true;
  }

  play(event: AudioEvent): void {
    if (!this.enabled || this.suspended) {
      return;
    }
    const now = Date.now();
    if (this.current && this.current.until > now && PRIORITY[event] < PRIORITY[this.current.event]) {
      return;
    }
    const file = FILE[event];
    const player = this.players.get(file);
    if (!player) {
      GameLog.warnOnce(`audio-missing-${file}`, `Missing audio asset: ${file}`);
      return;
    }
    try {
      player.seekTo(0);
      player.volume = event === 'ui' || event === 'aim' ? 0.45 : 0.72;
      player.playbackRate = collisionRate(event);
      player.play();
      this.current = { event, until: now + 220 };
    } catch {
      GameLog.warnOnce('audio-play', 'Audio playback failed');
    }
  }

  pauseAll(): void {
    for (const player of this.players.values()) {
      try {
        player.pause();
      } catch {
        // ignore
      }
    }
    this.current = null;
  }

  suspendForAd(): void {
    this.suspended = true;
    this.pauseAll();
  }

  restoreFromSettings(soundEnabled: boolean): void {
    this.suspended = false;
    this.enabled = soundEnabled;
  }

  release(): void {
    for (const player of this.players.values()) {
      try {
        player.release();
      } catch {
        // ignore
      }
    }
    this.players.clear();
    this.ready = false;
  }
}

function collisionRate(event: AudioEvent): number {
  switch (event) {
    case 'gate':
      return 0.92;
    case 'iris':
      return 1.08;
    case 'pendulum':
      return 0.84;
    case 'ring':
      return 1.14;
    default:
      return 1;
  }
}

export const AudioManager = new AudioManagerImpl();

export function playAudioHook(event: AudioEvent | 'throw' | 'close-call'): void {
  if (event === 'throw') {
    AudioManager.play('launch');
    return;
  }
  AudioManager.play(event);
}
