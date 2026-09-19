import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GAME_TUNING } from '../game/gameTuning';
import type { DebugSnapshot } from '../game/GameState';

type Props = {
  snapshot: DebugSnapshot | null;
  visible: boolean;
  onNext: () => void;
  onReplay: () => void;
  onRestartSeed: () => void;
  onJumpEnvironment: () => void;
  onPrevious: () => void;
  onJumpAhead: () => void;
  onToggleHearts: () => void;
  onRestartGauntlet: () => void;
  onForceRunOver: () => void;
  onResetBests: () => void;
  onCycleMode: () => void;
  onAddXp: () => void;
  onAddLevel: () => void;
  onUnlockAll: () => void;
  onLockAll: () => void;
  onResetProgress: () => void;
  onResetOnboarding: () => void;
  onToggleAnalytics: () => void;
  onToggleAds: () => void;
  onToggleTestAds: () => void;
  onForceRewardedReady: () => void;
  onForceRewardedFail: () => void;
  onForceInterstitialReady: () => void;
  onForceInterstitialFail: () => void;
  onResetAdCounters: () => void;
  onToggleRemoveAds: () => void;
  onResetContinue: () => void;
  onSetContinueUsed: () => void;
  onForceContinueSuccess: () => void;
  onForceContinueFail: () => void;
};

export function DebugOverlay({
  snapshot,
  visible,
  onNext,
  onReplay,
  onRestartSeed,
  onJumpEnvironment,
  onPrevious,
  onJumpAhead,
  onToggleHearts,
  onRestartGauntlet,
  onForceRunOver,
  onResetBests,
  onCycleMode,
  onAddXp,
  onAddLevel,
  onUnlockAll,
  onLockAll,
  onResetProgress,
  onResetOnboarding,
  onToggleAnalytics,
  onToggleAds,
  onToggleTestAds,
  onForceRewardedReady,
  onForceRewardedFail,
  onForceInterstitialReady,
  onForceInterstitialFail,
  onResetAdCounters,
  onToggleRemoveAds,
  onResetContinue,
  onSetContinueUsed,
  onForceContinueSuccess,
  onForceContinueFail,
}: Props) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmProgress, setConfirmProgress] = useState(false);

  if (!visible || !snapshot) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.box}>
        <Text style={styles.line}>FPS {snapshot.fps}</Text>
        <Text style={styles.line}>SEED {snapshot.runSeed}</Text>
        <Text style={styles.line}>
          #{snapshot.shotId} {snapshot.template}
        </Text>
        <Text style={styles.line}>{snapshot.challengeId}</Text>
        <Text style={styles.line}>
          DIFF {snapshot.difficulty} {snapshot.environment} L{snapshot.loopNumber}
        </Text>
        <Text style={styles.line}>{snapshot.phase}</Text>
        <Text style={styles.line}>
          P {snapshot.projectile.x} {snapshot.projectile.y} {snapshot.projectile.z}
        </Text>
        <Text style={styles.line}>
          V {snapshot.velocity.x} {snapshot.velocity.y} {snapshot.velocity.z}
        </Text>
        {snapshot.obstacleA ? (
          <Text style={styles.line}>
            A {snapshot.obstacleA.type} z{snapshot.obstacleA.z} {snapshot.obstacleA.extra}
          </Text>
        ) : (
          <Text style={styles.line}>A -</Text>
        )}
        {snapshot.obstacleB ? (
          <Text style={styles.line}>
            B {snapshot.obstacleB.type} z{snapshot.obstacleB.z} {snapshot.obstacleB.extra}
          </Text>
        ) : (
          <Text style={styles.line}>B -</Text>
        )}
        <Text style={styles.line}>
          T {snapshot.target.x} {snapshot.target.y} {snapshot.target.moving}
        </Text>
        <Text style={styles.line}>
          AIM {snapshot.aimState} hx {snapshot.horizontalExponent} vy{' '}
          {GAME_TUNING.aim.verticalAimExponent}
        </Text>
        <Text style={styles.line}>
          Raw {snapshot.rawDragX} {snapshot.rawDragY}
        </Text>
        <Text style={styles.line}>
          N {snapshot.normalizedX} {snapshot.normalizedY}
        </Text>
        <Text style={styles.line}>
          CurveX {snapshot.curvedAimX} Y {snapshot.aimY} P {snapshot.power}
        </Text>
        <Text style={styles.line}>
          MaxD {snapshot.maxDragDistance} entered {snapshot.hasEnteredAim ? 'Y' : 'N'} cancel{' '}
          {snapshot.cancelReady ? 'Y' : 'N'}
        </Text>
        <Text style={styles.line}>
          Last {snapshot.lastResult ?? '-'} CC {snapshot.closeCall ? 'Y' : 'N'} clr{' '}
          {snapshot.closeCallClearance}
        </Text>
        <Text style={styles.line}>
          SCORE {snapshot.runScore} BEST {snapshot.personalBest} ♥ {snapshot.lives}
        </Text>
        <Text style={styles.line}>
          STRK {snapshot.currentStreak} x{snapshot.multiplier} BEST {snapshot.bestStreak}
        </Text>
        <Text style={styles.line}>
          CLR {snapshot.challengesCleared} CC {snapshot.closeCalls} L{snapshot.loopNumber}
        </Text>
        <Text style={styles.warn}>PRED {snapshot.environment.toUpperCase()}</Text>
        <Text style={styles.line}>
          Vz {snapshot.vz} 7–11 p{snapshot.power}
        </Text>
        <Text style={styles.line}>A {snapshot.predA}</Text>
        <Text style={styles.line}>B {snapshot.predB}</Text>
        <Text style={styles.line}>T {snapshot.predT}</Text>
        <Text style={styles.line}>
          tA {snapshot.timeA} tB {snapshot.timeB} tT {snapshot.timeT}
        </Text>
        <Text style={styles.line}>
          PathErr {snapshot.pathError} AnlSimY {snapshot.analyticVsSimY}
        </Text>
        <Text style={styles.line}>MISS {snapshot.lastMiss}</Text>
        <Text style={styles.line}>
          MODE {snapshot.runMode} {snapshot.unlimitedHearts ? 'UNLIM' : '3♥'}
        </Text>
        <Text style={styles.line}>
          ShotAtt {snapshot.authoredAttempts} 1st {snapshot.firstTryClears}
        </Text>
        {snapshot.lastFail !== '-' ? (
          <Text style={styles.warn}>FAILED {snapshot.lastFail}</Text>
        ) : null}
        {snapshot.spike ? <Text style={styles.warn}>⚠ 4+ ATTEMPTS</Text> : null}
        <Text style={styles.line}>
          THEME {snapshot.runTheme} LVL {snapshot.playerLevel}
        </Text>
        <Text style={styles.line}>
          XP {snapshot.totalXP} BALL {snapshot.selectedProjectile}
        </Text>
        <Text style={styles.line}>
          ADS {snapshot.adsEnabled ? 'ON' : 'OFF'} TEST {snapshot.useTestAds ? 'Y' : 'N'}
        </Text>
        <Text style={styles.line}>
          RW {snapshot.rewardedReady ? 'RDY' : 'NO'} INT {snapshot.interstitialReady ? 'RDY' : 'NO'}
        </Text>
        <Text style={styles.line}>
          IAP {snapshot.removeAds ? 'NOADS' : '-'} CONT {snapshot.hasUsedContinue ? 'USED' : 'FREE'}
        </Text>
        <Text style={styles.line}>AN {snapshot.analyticsDebug ? 'DBG' : 'OFF'}</Text>
      </View>
      {snapshot.phase === 'AIMING' ? <AimGuides snapshot={snapshot} /> : null}
      <View style={styles.buttons}>
        {snapshot.runMode !== 'GENERATED' ? (
          <>
            <DebugButton label="PREV" onPress={onPrevious} />
            <DebugButton label="RST" onPress={onReplay} />
            <DebugButton label="NEXT" onPress={onNext} />
            <DebugButton label="+5" onPress={onJumpAhead} />
            <DebugButton label={snapshot.unlimitedHearts ? '♥ ON' : '♥ OFF'} onPress={onToggleHearts} />
            <DebugButton label="RUN" onPress={onRestartGauntlet} />
            <DebugButton label="END RUN" onPress={onForceRunOver} />
            <DebugButton label="MODE" onPress={onCycleMode} />
            <DebugButton
              label={confirmReset ? 'CONFIRM?' : 'RST BEST'}
              onPress={() => {
                if (!confirmReset) {
                  setConfirmReset(true);
                  setTimeout(() => setConfirmReset(false), 2000);
                  return;
                }
                onResetBests();
                setConfirmReset(false);
              }}
            />
          </>
        ) : (
          <>
            <DebugButton label="NEXT" onPress={onNext} />
            <DebugButton label="REPLAY" onPress={onReplay} />
            <DebugButton label="SEED" onPress={onRestartSeed} />
            <DebugButton label="ENV" onPress={onJumpEnvironment} />
            <DebugButton
              label={snapshot.unlimitedHearts ? '♥ ON' : '♥ OFF'}
              onPress={onToggleHearts}
            />
            <DebugButton label="END RUN" onPress={onForceRunOver} />
            <DebugButton label="MODE" onPress={onCycleMode} />
            <DebugButton
              label={confirmReset ? 'CONFIRM?' : 'RST BEST'}
              onPress={() => {
                if (!confirmReset) {
                  setConfirmReset(true);
                  setTimeout(() => setConfirmReset(false), 2000);
                  return;
                }
                onResetBests();
                setConfirmReset(false);
              }}
            />
          </>
        )}
        <DebugButton label="LVL+" onPress={onAddLevel} />
        <DebugButton label="XP+" onPress={onAddXp} />
        <DebugButton label="ALL" onPress={onUnlockAll} />
        <DebugButton label="LOCK" onPress={onLockAll} />
        <DebugButton
          label={confirmProgress ? 'CONFIRM?' : 'RST PROG'}
          onPress={() => {
            if (!confirmProgress) {
              setConfirmProgress(true);
              setTimeout(() => setConfirmProgress(false), 2000);
              return;
            }
            onResetProgress();
            setConfirmProgress(false);
          }}
        />
        <DebugButton label="RST ONB" onPress={onResetOnboarding} />
        <DebugButton label={snapshot.analyticsDebug ? 'AN ON' : 'AN OFF'} onPress={onToggleAnalytics} />
        <DebugButton label={snapshot.adsEnabled ? 'ADS ON' : 'ADS OFF'} onPress={onToggleAds} />
        <DebugButton label={snapshot.useTestAds ? 'TEST ON' : 'TEST OFF'} onPress={onToggleTestAds} />
        <DebugButton label="RW RDY" onPress={onForceRewardedReady} />
        <DebugButton label="RW FAIL" onPress={onForceRewardedFail} />
        <DebugButton label="INT RDY" onPress={onForceInterstitialReady} />
        <DebugButton label="INT FAIL" onPress={onForceInterstitialFail} />
        <DebugButton label="RST ADS" onPress={onResetAdCounters} />
        <DebugButton label={snapshot.removeAds ? 'IAP ON' : 'IAP OFF'} onPress={onToggleRemoveAds} />
        <DebugButton label="CONT RST" onPress={onResetContinue} />
        <DebugButton label="CONT USED" onPress={onSetContinueUsed} />
        <DebugButton label="CONT OK" onPress={onForceContinueSuccess} />
        <DebugButton label="CONT NO" onPress={onForceContinueFail} />
      </View>
    </View>
  );
}

function DebugButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.button} onPress={onPress}>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

function AimGuides({ snapshot }: { snapshot: DebugSnapshot }) {
  const { screenWidth, screenHeight, aimStartX, aimStartY, aimCurrentX, aimCurrentY } = snapshot;
  if (screenWidth <= 0 || screenHeight <= 0) {
    return null;
  }

  const { minAimDrag, cancelEnterRadius, cancelExitRadius } = GAME_TUNING.aim;
  const cancelScale = Math.min(screenWidth, screenHeight);

  return (
    <View style={styles.guides} pointerEvents="none">
      <AimRing
        startX={aimStartX}
        startY={aimStartY}
        radiusX={cancelExitRadius * cancelScale}
        radiusY={cancelExitRadius * cancelScale}
        color="rgba(126,240,255,0.28)"
      />
      <AimRing
        startX={aimStartX}
        startY={aimStartY}
        radiusX={cancelEnterRadius * cancelScale}
        radiusY={cancelEnterRadius * cancelScale}
        color="rgba(255,93,108,0.45)"
      />
      <AimRing
        startX={aimStartX}
        startY={aimStartY}
        radiusX={minAimDrag * cancelScale}
        radiusY={minAimDrag * cancelScale}
        color="rgba(255,210,74,0.55)"
      />
      <View
        style={[
          styles.point,
          styles.startPoint,
          { left: aimStartX - 4, top: aimStartY - 4 },
        ]}
      />
      <View
        style={[
          styles.point,
          styles.touchPoint,
          { left: aimCurrentX - 5, top: aimCurrentY - 5 },
        ]}
      />
    </View>
  );
}

function AimRing({
  startX,
  startY,
  radiusX,
  radiusY,
  color,
}: {
  startX: number;
  startY: number;
  radiusX: number;
  radiusY: number;
  color: string;
}) {
  return (
    <View
      style={{
        position: 'absolute',
        left: startX - radiusX,
        top: startY - radiusY,
        width: radiusX * 2,
        height: radiusY * 2,
        borderRadius: 9999,
        borderWidth: 1,
        borderColor: color,
      }}
    />
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    pointerEvents: 'box-none',
  },
  box: {
    position: 'absolute',
    left: 12,
    bottom: 72,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    pointerEvents: 'none',
  },
  line: {
    color: '#9dffb0',
    fontSize: 10,
    fontVariant: ['tabular-nums'],
    fontWeight: '600',
  },
  warn: {
    color: '#ffd24a',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 4,
  },
  buttons: {
    position: 'absolute',
    right: 12,
    bottom: 24,
    gap: 6,
  },
  button: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  buttonText: {
    color: '#7ef0ff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  guides: {
    ...StyleSheet.absoluteFill,
    pointerEvents: 'none',
  },
  point: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  startPoint: {
    backgroundColor: 'rgba(255,210,74,0.9)',
  },
  touchPoint: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(126,240,255,0.95)',
  },
});
