import * as Haptics from 'expo-haptics';

import type { ShotResultKind } from '../game/GameState';

export const GameHaptics = {
  enabled: true,

  async light(): Promise<void> {
    if (!this.enabled) {
      return;
    }
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics are optional on unsupported devices/simulators.
    }
  },

  async medium(): Promise<void> {
    if (!this.enabled) {
      return;
    }
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // ignore
    }
  },

  async heavy(): Promise<void> {
    if (!this.enabled) {
      return;
    }
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {
      // ignore
    }
  },

  async success(): Promise<void> {
    if (!this.enabled) {
      return;
    }
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // ignore
    }
  },

  async selection(): Promise<void> {
    if (!this.enabled) {
      return;
    }
    try {
      await Haptics.selectionAsync();
    } catch {
      // ignore
    }
  },

  forUi(): void {
    void this.selection();
  },

  forAimStart(): void {
    void this.selection();
  },

  forResult(kind: ShotResultKind): void {
    switch (kind) {
      case 'ROTOR_HIT':
        void this.heavy();
        break;
      case 'MISS':
        void this.light();
        break;
      case 'HIT':
        void this.light();
        break;
      case 'GREAT':
        void this.medium();
        break;
      case 'BULLSEYE':
        void this.medium();
        break;
      case 'PERFECT':
        void this.heavy();
        void this.success();
        break;
    }
  },

  forThrow(): void {
    void this.light();
  },

  forCloseCall(): void {
    void this.light();
  },

  forStreak(): void {
    void this.medium();
  },

  forHeartLost(): void {
    void this.medium();
  },

  forNewBest(): void {
    void this.success();
  },

  forLevelUp(): void {
    void this.success();
  },

  forRunOver(): void {
    void this.heavy();
  },
};
