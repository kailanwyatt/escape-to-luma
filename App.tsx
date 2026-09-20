import { StatusBar } from 'expo-status-bar';
import { GLView, type ExpoWebGLRenderingContext } from 'expo-gl';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, AppState, PanResponder, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { canStartLevel } from './src/campaign/CampaignPlay';
import { ECONOMY } from './src/config/economy';
import { msUntilNextEnergy } from './src/economy/energy';
import { Game } from './src/game/Game';
import type { DebugSnapshot, HudSnapshot } from './src/game/GameState';
import { emptySave, type GameSettings, type PersistentGameData } from './src/persistence/GameSave';
import { GameHaptics } from './src/feedback/Haptics';
import { AudioManager } from './src/feedback/AudioManager';
import { DebugOverlay } from './src/ui/DebugOverlay';
import { GraphicsScreen } from './src/ui/GraphicsScreen';
import { HomeScreen } from './src/ui/HomeScreen';
import { HUD } from './src/ui/HUD';
import { JourneyScreen } from './src/ui/JourneyScreen';
import { LevelReadyScreen } from './src/ui/LevelReadyScreen';
import { OutOfEnergyScreen } from './src/ui/OutOfEnergyScreen';
import { ResultFeedback } from './src/ui/ResultFeedback';
import { SettingsScreen } from './src/ui/SettingsScreen';
import { ShopScreen } from './src/ui/ShopScreen';
import { SparksScreen } from './src/ui/SparksScreen';
import { StatsScreen } from './src/ui/StatsScreen';

type AppScreen =
  | 'home'
  | 'play'
  | 'journey'
  | 'levelReady'
  | 'sparks'
  | 'shop'
  | 'stats'
  | 'settings'
  | 'graphics'
  | 'outOfEnergy';

const EMPTY_RECORDS = {
  score: false,
  longestRun: false,
  bestStreak: false,
  bullseyes: false,
  perfects: false,
  loop: false,
};

const INITIAL_HUD: HudSnapshot = {
  phase: 'READY',
  lives: 3,
  score: 0,
  shotId: 1,
  totalShots: 0,
  resultKind: null,
  resultText: null,
  showOnboarding: true,
  onboardingText: 'DRAG TO AIM',
  shotsReached: 0,
  hits: 0,
  greats: 0,
  bullseyes: 0,
  perfects: 0,
  rotorHits: 0,
  targetMisses: 0,
  streak: 0,
  bestStreak: 0,
  multiplier: 1,
  environment: 'workshop',
  shotInEnvironment: 1,
  shotsPerEnvironment: 8,
  banner: null,
  closeCall: false,
  closeCallText: null,
  closeCalls: 0,
  cancelReady: false,
  runMode: 'GENERATED',
  attempts: 0,
  firstTryClears: 0,
  unlimitedHearts: false,
  lastFail: null,
  bestScore: 0,
  newBest: false,
  records: EMPTY_RECORDS,
  loopNumber: 1,
  runTheme: 'CLASSIC RUN',
  runXp: 0,
  playerLevel: 1,
  xpIntoLevel: 0,
  xpForNext: 100,
  totalXP: 0,
  unlockedName: null,
  levelUp: false,
  continueOffer: false,
  adBusy: false,
  adMessage: null,
  removeAds: false,
  sessionMode: 'endless',
  campaignLevel: 1,
  campaignWorldName: null,
  energy: ECONOMY.maxEnergy,
  maxEnergy: ECONOMY.maxEnergy,
  shards: 0,
  unlimitedEnergy: false,
  lastShardsGained: 0,
  lastPrecisionRank: null,
  storyBeat: null,
  windActive: false,
  helpOffer: false,
};

function continueLevelNumber(save: PersistentGameData): number {
  const c = save.campaign;
  const level = c.lastPlayedLevel >= 1 ? c.lastPlayedLevel : c.highestUnlockedLevel;
  return Math.min(150, Math.max(1, Math.min(level, c.highestUnlockedLevel)));
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppShell />
    </SafeAreaProvider>
  );
}

function AppShell() {
  const gameRef = useRef<Game | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [save, setSave] = useState<PersistentGameData>(emptySave());
  const [screen, setScreen] = useState<AppScreen>('home');
  const [pendingLevel, setPendingLevel] = useState(1);
  const [debugEnabled, setDebugEnabled] = useState(false);
  const [debugSnapshot, setDebugSnapshot] = useState<DebugSnapshot | null>(null);
  const [systemReduceMotion, setSystemReduceMotion] = useState(false);
  const [purchaseBusy, setPurchaseBusy] = useState(false);
  const [purchaseMessage, setPurchaseMessage] = useState<string | null>(null);

  const refreshSave = useCallback(() => {
    const game = gameRef.current;
    if (game) {
      setSave(game.getSave());
    }
  }, []);

  const attachGame = useCallback((game: Game) => {
    unsubscribeRef.current?.();
    gameRef.current?.dispose();
    gameRef.current = game;
    game.setSystemReduceMotion(systemReduceMotion);
    unsubscribeRef.current = game.subscribeHud((snapshot) => {
      setHud(snapshot);
      setSave(game.getSave());
    });
    game.start();
  }, [systemReduceMotion]);

  const onContextCreate = useCallback(
    (gl: ExpoWebGLRenderingContext) => {
      const boot = () => {
        if (gl.drawingBufferWidth < 2 || gl.drawingBufferHeight < 2) {
          requestAnimationFrame(boot);
          return;
        }
        attachGame(new Game(gl));
      };
      requestAnimationFrame(boot);
    },
    [attachGame],
  );

  useEffect(() => {
    return () => {
      unsubscribeRef.current?.();
      gameRef.current?.dispose();
      gameRef.current = null;
    };
  }, []);

  useEffect(() => {
    void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {
      // Orientation lock is best-effort in Expo Go / web.
    });
    void AudioManager.init();
  }, []);

  useEffect(() => {
    let mounted = true;
    const apply = (enabled: boolean) => {
      if (!mounted) {
        return;
      }
      setSystemReduceMotion(enabled);
      gameRef.current?.setSystemReduceMotion(enabled);
    };
    void AccessibilityInfo.isReduceMotionEnabled().then(apply);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', apply);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        gameRef.current?.resume();
      } else {
        gameRef.current?.onTouchCancel();
        gameRef.current?.pause();
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!debugEnabled) {
      setDebugSnapshot(null);
      return;
    }
    const id = setInterval(() => {
      const snapshot = gameRef.current?.getDebugSnapshot();
      if (snapshot) {
        setDebugSnapshot(snapshot);
      }
    }, 120);
    return () => clearInterval(id);
  }, [debugEnabled]);

  const playing = screen === 'play';

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () =>
          playing && (gameRef.current?.canAcceptInput() ?? false),
        onMoveShouldSetPanResponder: () =>
          playing && (gameRef.current?.canAcceptInput() ?? false),
        onPanResponderGrant: (event) => {
          gameRef.current?.onTouchStart(
            event.nativeEvent.locationX,
            event.nativeEvent.locationY,
          );
        },
        onPanResponderMove: (event) => {
          gameRef.current?.onTouchMove(
            event.nativeEvent.locationX,
            event.nativeEvent.locationY,
          );
        },
        onPanResponderRelease: () => {
          gameRef.current?.onTouchEnd();
        },
        onPanResponderTerminate: () => {
          gameRef.current?.onTouchCancel();
        },
      }),
    [playing],
  );

  const onLayout = useCallback((width: number, height: number) => {
    const game = gameRef.current;
    if (!game || width <= 0 || height <= 0) {
      return;
    }
    game.setScreenSize(width, height);
    game.resize();
  }, []);

  const onToggleDebug = useCallback(() => {
    if (!__DEV__) {
      return;
    }
    setDebugEnabled((current) => {
      const next = !current;
      gameRef.current?.setDebugEnabled(next);
      return next;
    });
  }, []);

  const tap = useCallback((fn: () => void) => {
    GameHaptics.forUi();
    AudioManager.play('ui');
    fn();
  }, []);

  const syncEnergyAndSave = useCallback(() => {
    gameRef.current?.syncCampaignSave();
    refreshSave();
  }, [refreshSave]);

  const tryOpenLevelReady = useCallback(
    (levelNumber: number) => {
      syncEnergyAndSave();
      const campaign = gameRef.current?.getSave().campaign ?? save.campaign;
      const check = canStartLevel(campaign, levelNumber);
      if (!check.ok && check.reason === 'energy') {
        setScreen('outOfEnergy');
        return;
      }
      if (!check.ok) {
        return;
      }
      setPendingLevel(levelNumber);
      setScreen('levelReady');
    },
    [save.campaign, syncEnergyAndSave],
  );

  const onHome = useCallback(() => {
    tap(() => {
      refreshSave();
      setScreen('home');
    });
  }, [refreshSave, tap]);

  const onToggleSetting = useCallback(
    (key: keyof GameSettings) => {
      GameHaptics.forUi();
      AudioManager.play('ui');
      const current = gameRef.current?.getSave().settings ?? save.settings;
      gameRef.current?.setSettings({ [key]: !current[key] });
      refreshSave();
    },
    [refreshSave, save.settings],
  );

  const nextEnergyMs = msUntilNextEnergy(save.campaign.currentEnergy, save.campaign.energyUpdatedAt);
  const showOutOfEnergyOverlay =
    (screen === 'play' && hud.phase === 'OUT_OF_ENERGY') || screen === 'outOfEnergy';

  return (
    <View style={styles.root}>
      <StatusBar style="light" hidden />
      <GLView
        style={styles.gl}
        msaaSamples={4}
        onContextCreate={onContextCreate}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          onLayout(width, height);
        }}
      />
      {playing ? <View style={styles.touch} {...panResponder.panHandlers} /> : null}
      {playing ? <ResultFeedback text={hud.resultText} kind={hud.resultKind} /> : null}
      {playing ? (
        <HUD
          hud={hud}
          debugEnabled={debugEnabled}
          onToggleDebug={onToggleDebug}
          onRestart={() => {
            GameHaptics.forUi();
            gameRef.current?.requestRetry();
          }}
          onHome={onHome}
          onContinue={() => {
            GameHaptics.forUi();
            gameRef.current?.acceptContinue();
          }}
          onDeclineContinue={() => {
            GameHaptics.forUi();
            gameRef.current?.declineContinue();
          }}
          onContinueLevel={() => {
            GameHaptics.forUi();
            gameRef.current?.continueAfterLevel();
          }}
          onRetryLevel={() => {
            GameHaptics.forUi();
            gameRef.current?.retryCampaignLevel();
          }}
          onUseHelp={() => {
            GameHaptics.forUi();
            gameRef.current?.useHelpSlowField();
          }}
          onDeclineHelp={() => {
            GameHaptics.forUi();
            gameRef.current?.declineHelp();
          }}
        />
      ) : null}
      {showOutOfEnergyOverlay ? (
        <OutOfEnergyScreen
          nextEnergyMs={nextEnergyMs}
          onWatchAd={() =>
            tap(() => {
              gameRef.current?.watchRewardedEnergy();
              refreshSave();
            })
          }
          onUnlimited24={() =>
            tap(() => {
              gameRef.current?.activateUnlimitedEnergy(ECONOMY.unlimitedEnergy24hMs);
              refreshSave();
              if (screen === 'outOfEnergy') {
                tryOpenLevelReady(pendingLevel);
              }
            })
          }
          onUnlimited7={() =>
            tap(() => {
              gameRef.current?.activateUnlimitedEnergy(ECONOMY.unlimitedEnergy7dMs);
              refreshSave();
              if (screen === 'outOfEnergy') {
                tryOpenLevelReady(pendingLevel);
              }
            })
          }
          onLater={() =>
            tap(() => {
              if (screen === 'play' && hud.phase === 'OUT_OF_ENERGY') {
                onHome();
              } else {
                setScreen('home');
                refreshSave();
              }
            })
          }
        />
      ) : null}
      <DebugOverlay
        snapshot={debugSnapshot}
        visible={__DEV__ && debugEnabled}
        onNext={() => gameRef.current?.debugNextChallenge()}
        onReplay={() => gameRef.current?.debugReplayChallenge()}
        onRestartSeed={() => gameRef.current?.debugRestartSeed()}
        onJumpEnvironment={() => gameRef.current?.debugJumpEnvironment()}
        onPrevious={() => gameRef.current?.debugPreviousChallenge()}
        onJumpAhead={() =>
          gameRef.current?.debugJumpToShot((debugSnapshot?.shotId ?? 1) + 5)
        }
        onToggleHearts={() => gameRef.current?.debugToggleUnlimitedHearts()}
        onRestartGauntlet={() => gameRef.current?.debugRestartGauntlet()}
        onForceRunOver={() => gameRef.current?.debugForceRunOver()}
        onResetBests={() => gameRef.current?.debugResetLocalBests()}
        onCycleMode={() => {
          const order = ['GENERATED', 'VALIDATION_15', 'OBSTACLE_TEST', 'AUTHORED_30'] as const;
          const current = debugSnapshot?.runMode ?? 'GENERATED';
          const index = order.indexOf(current as (typeof order)[number]);
          const next = order[(index + 1) % order.length];
          gameRef.current?.debugSetMode(next);
        }}
        onAddXp={() => gameRef.current?.debugAddXp(50)}
        onAddLevel={() =>
          gameRef.current?.debugSetLevel((gameRef.current?.getSave().playerProgress.playerLevel ?? 1) + 1)
        }
        onUnlockAll={() => gameRef.current?.debugUnlockAllProjectiles()}
        onLockAll={() => gameRef.current?.debugLockProjectiles()}
        onResetProgress={() => gameRef.current?.debugResetProgress()}
        onResetOnboarding={() => gameRef.current?.debugResetOnboarding()}
        onToggleAnalytics={() => gameRef.current?.debugToggleAnalytics()}
        onToggleAds={() => gameRef.current?.debugToggleAdsEnabled()}
        onToggleTestAds={() => gameRef.current?.debugToggleTestAds()}
        onForceRewardedReady={() => gameRef.current?.debugForceRewardedReady()}
        onForceRewardedFail={() => gameRef.current?.debugForceRewardedFailure()}
        onForceInterstitialReady={() => gameRef.current?.debugForceInterstitialReady()}
        onForceInterstitialFail={() => gameRef.current?.debugForceInterstitialFailure()}
        onResetAdCounters={() => gameRef.current?.debugResetAdCounters()}
        onToggleRemoveAds={() =>
          gameRef.current?.debugSetRemoveAds(!(debugSnapshot?.removeAds ?? false))
        }
        onResetContinue={() => gameRef.current?.debugResetContinueUsed()}
        onSetContinueUsed={() => gameRef.current?.debugSetContinueUsed()}
        onForceContinueSuccess={() => gameRef.current?.debugForceContinueSuccess()}
        onForceContinueFail={() => gameRef.current?.debugForceContinueFailure()}
      />
      {screen === 'home' ? (
        <HomeScreen
          save={save}
          onContinue={() =>
            tap(() => {
              const level = continueLevelNumber(gameRef.current?.getSave() ?? save);
              syncEnergyAndSave();
              const campaign = gameRef.current?.getSave().campaign ?? save.campaign;
              const check = canStartLevel(campaign, level);
              if (!check.ok && check.reason === 'energy') {
                setPendingLevel(level);
                setScreen('outOfEnergy');
                return;
              }
              if (!check.ok) {
                return;
              }
              setPendingLevel(level);
              setScreen('levelReady');
            })
          }
          onJourney={() =>
            tap(() => {
              syncEnergyAndSave();
              setScreen('journey');
            })
          }
          onSparks={() =>
            tap(() => {
              refreshSave();
              setScreen('sparks');
            })
          }
          onShop={() =>
            tap(() => {
              syncEnergyAndSave();
              setScreen('shop');
            })
          }
          onStats={() =>
            tap(() => {
              refreshSave();
              setScreen('stats');
            })
          }
          onSettings={() =>
            tap(() => {
              refreshSave();
              setScreen('settings');
            })
          }
          onEndless={() =>
            tap(() => {
              setScreen('play');
              gameRef.current?.startEndlessVoyage();
            })
          }
          currentLevel={continueLevelNumber(save)}
        />
      ) : null}
      {screen === 'journey' ? (
        <JourneyScreen
          save={save}
          onSelectLevel={(levelNumber) =>
            tap(() => tryOpenLevelReady(levelNumber))
          }
          onBack={() => tap(() => setScreen('home'))}
        />
      ) : null}
      {screen === 'levelReady' ? (
        <LevelReadyScreen
          save={save}
          levelNumber={pendingLevel}
          onPlay={(boosts) =>
            tap(() => {
              setScreen('play');
              gameRef.current?.startCampaignLevel(pendingLevel, boosts);
            })
          }
          onBack={() => tap(() => setScreen('home'))}
        />
      ) : null}
      {screen === 'sparks' ? (
        <SparksScreen
          save={save}
          onEquip={(id) => {
            GameHaptics.forUi();
            AudioManager.play('ui');
            gameRef.current?.equipSpark(id);
            refreshSave();
          }}
          onBuy={(id) => {
            GameHaptics.forUi();
            AudioManager.play('ui');
            gameRef.current?.buySparkWithShards(id);
            refreshSave();
          }}
          onBack={() => tap(() => setScreen('home'))}
        />
      ) : null}
      {screen === 'shop' ? (
        <ShopScreen
          save={save}
          onBuyBoost={(id) => {
            GameHaptics.forUi();
            AudioManager.play('ui');
            gameRef.current?.buyBoostWithShards(id);
            refreshSave();
          }}
          onWatchEnergy={() => {
            GameHaptics.forUi();
            gameRef.current?.watchRewardedEnergy();
            refreshSave();
          }}
          onBuyUnlimited={(hours) => {
            GameHaptics.forUi();
            AudioManager.play('ui');
            const ms =
              hours === 24 ? ECONOMY.unlimitedEnergy24hMs : ECONOMY.unlimitedEnergy7dMs;
            gameRef.current?.activateUnlimitedEnergy(ms);
            refreshSave();
          }}
          onBack={() => tap(() => setScreen('home'))}
        />
      ) : null}
      {screen === 'graphics' ? (
        <GraphicsScreen onBack={() => tap(() => setScreen('home'))} />
      ) : null}
      {screen === 'stats' ? (
        <StatsScreen save={save} onBack={() => tap(() => setScreen('home'))} />
      ) : null}
      {screen === 'settings' ? (
        <SettingsScreen
          settings={save.settings}
          systemReduceMotion={systemReduceMotion}
          removeAds={save.commercial.removeAds}
          purchaseBusy={purchaseBusy}
          purchaseMessage={purchaseMessage}
          onToggle={onToggleSetting}
          onRemoveAds={() => {
            GameHaptics.forUi();
            AudioManager.play('ui');
            setPurchaseBusy(true);
            setPurchaseMessage(null);
            void gameRef.current?.purchaseRemoveAds().then((result) => {
              setPurchaseBusy(false);
              refreshSave();
              if (result === 'completed' || result === 'already') {
                setPurchaseMessage('Interstitials removed.');
              } else if (result === 'failed') {
                setPurchaseMessage('Purchase unavailable.');
              }
            });
          }}
          onRestore={() => {
            GameHaptics.forUi();
            AudioManager.play('ui');
            setPurchaseBusy(true);
            setPurchaseMessage(null);
            void gameRef.current?.restorePurchases().then((entitled) => {
              setPurchaseBusy(false);
              refreshSave();
              setPurchaseMessage(entitled ? 'Purchases restored.' : 'No purchases to restore.');
            });
          }}
          onBack={() => tap(() => setScreen('home'))}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1a1612',
  },
  gl: {
    flex: 1,
  },
  touch: {
    ...StyleSheet.absoluteFill,
  },
});
