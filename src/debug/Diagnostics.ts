import Constants from 'expo-constants';
import { Dimensions, Platform } from 'react-native';

import type { HudSnapshot } from '../game/GameState';
import type { PersistentGameData } from '../persistence/GameSave';
import { runtimeAssetDiagnostics } from '../graphics/assetRegistry';
import { GameLog } from './GameLog';

export function buildDiagnosticReport(
  save: PersistentGameData,
  hud: HudSnapshot,
): string {
  const window = Dimensions.get('window');
  return JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      app: {
        name: Constants.expoConfig?.name ?? 'SPARK',
        version: Constants.expoConfig?.version ?? 'unknown',
        build: Constants.expoConfig?.ios?.buildNumber ?? 'local',
      },
      device: {
        platform: Platform.OS,
        platformVersion: String(Platform.Version),
        viewport: `${Math.round(window.width)}x${Math.round(window.height)}`,
        pixelRatio: window.scale,
      },
      game: {
        phase: hud.phase,
        mode: hud.sessionMode,
        campaignLevel: hud.campaignLevel,
        world: hud.campaignWorldName,
        highestUnlockedLevel: save.campaign.highestUnlockedLevel,
        campaignCompleted: save.campaign.campaignCompleted,
        saveVersion: save.saveVersion,
        reduceMotion: save.settings.reduceMotion,
        soundEnabled: save.settings.soundEnabled,
        hapticsEnabled: save.settings.hapticsEnabled,
      },
      assets: runtimeAssetDiagnostics(),
      events: GameLog.snapshot(),
    },
    null,
    2,
  ).slice(0, 40_000);
}
