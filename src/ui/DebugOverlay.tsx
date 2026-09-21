import {t} from '../i18n';
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
        <Text style={styles.line}>{t("debugoverlay.fps")}{snapshot.fps}</Text>
        <Text style={styles.line}>{t("debugoverlay.seed")}{snapshot.runSeed}</Text>
        <Text style={styles.line}>
          #{snapshot.shotId} {snapshot.template}
        </Text>
        <Text style={styles.line}>{snapshot.challengeId}</Text>
        <Text style={styles.line}>
          {t("debugoverlay.diff")}{snapshot.difficulty} {snapshot.environment} {t("debugoverlay.l")}{snapshot.loopNumber}
        </Text>
        <Text style={styles.line}>{snapshot.phase}</Text>
        <Text style={styles.line}>
          {t("debugoverlay.p")}{snapshot.projectile.x} {snapshot.projectile.y} {snapshot.projectile.z}
        </Text>
        <Text style={styles.line}>
          {t("debugoverlay.v")}{snapshot.velocity.x} {snapshot.velocity.y} {snapshot.velocity.z}
        </Text>
        {snapshot.obstacleA ? (
          <Text style={styles.line}>
            {t("debugoverlay.a")}{snapshot.obstacleA.type} {t("debugoverlay.z")}{snapshot.obstacleA.z} {snapshot.obstacleA.extra}
          </Text>
        ) : (
          <Text style={styles.line}>{t("debugoverlay.a_2")}</Text>
        )}
        {snapshot.obstacleB ? (
          <Text style={styles.line}>
            {t("debugoverlay.b")}{snapshot.obstacleB.type} {t("debugoverlay.z")}{snapshot.obstacleB.z} {snapshot.obstacleB.extra}
          </Text>
        ) : (
          <Text style={styles.line}>{t("debugoverlay.b_2")}</Text>
        )}
        <Text style={styles.line}>
          {t("debugoverlay.t")}{snapshot.target.x} {snapshot.target.y} {snapshot.target.moving}
        </Text>
        <Text style={styles.line}>
          {t("debugoverlay.aim")}{snapshot.aimState} {t("debugoverlay.hx")}{snapshot.horizontalExponent} {t("debugoverlay.vy")}{' '}
          {GAME_TUNING.aim.verticalAimExponent}
        </Text>
        <Text style={styles.line}>
          {t("debugoverlay.raw")}{snapshot.rawDragX} {snapshot.rawDragY}
        </Text>
        <Text style={styles.line}>
          {t("debugoverlay.n")}{snapshot.normalizedX} {snapshot.normalizedY}
        </Text>
        <Text style={styles.line}>
          {t("debugoverlay.curvex")}{snapshot.curvedAimX} {t("debugoverlay.y")}{snapshot.aimY} {t("debugoverlay.p")}{snapshot.power}
        </Text>
        <Text style={styles.line}>
          {t("debugoverlay.maxd")}{snapshot.maxDragDistance} {t("debugoverlay.entered")}{snapshot.hasEnteredAim ? 'Y' : 'N'} {t("debugoverlay.cancel")}{' '}
          {snapshot.cancelReady ? 'Y' : 'N'}
        </Text>
        <Text style={styles.line}>
          {t("debugoverlay.last")}{snapshot.lastResult ?? '-'} {t("debugoverlay.cc")}{snapshot.closeCall ? 'Y' : 'N'} {t("debugoverlay.clr")}{' '}
          {snapshot.closeCallClearance}
        </Text>
        <Text style={styles.line}>
          {t("debugoverlay.score")}{snapshot.runScore} {t("debugoverlay.best")}{snapshot.personalBest} ♥ {snapshot.lives}
        </Text>
        <Text style={styles.line}>
          {t("debugoverlay.strk")}{snapshot.currentStreak} {t("debugoverlay.x")}{snapshot.multiplier} {t("debugoverlay.best")}{snapshot.bestStreak}
        </Text>
        <Text style={styles.line}>
          {t("debugoverlay.clr_2")}{snapshot.challengesCleared} {t("debugoverlay.cc")}{snapshot.closeCalls} {t("debugoverlay.l")}{snapshot.loopNumber}
        </Text>
        <Text style={styles.warn}>{t("debugoverlay.pred")}{snapshot.environment.toUpperCase()}</Text>
        <Text style={styles.line}>
          {t("debugoverlay.vz")}{snapshot.vz} {t("debugoverlay.7_11_p")}{snapshot.power}
        </Text>
        <Text style={styles.line}>{t("debugoverlay.a")}{snapshot.predA}</Text>
        <Text style={styles.line}>{t("debugoverlay.b")}{snapshot.predB}</Text>
        <Text style={styles.line}>{t("debugoverlay.t")}{snapshot.predT}</Text>
        <Text style={styles.line}>
          {t("debugoverlay.ta")}{snapshot.timeA} {t("debugoverlay.tb")}{snapshot.timeB} {t("debugoverlay.tt")}{snapshot.timeT}
        </Text>
        <Text style={styles.line}>
          {t("debugoverlay.patherr")}{snapshot.pathError} {t("debugoverlay.anlsimy")}{snapshot.analyticVsSimY}
        </Text>
        <Text style={styles.line}>{t("debugoverlay.miss")}{snapshot.lastMiss}</Text>
        <Text style={styles.line}>
          {t("debugoverlay.mode")}{snapshot.runMode} {snapshot.unlimitedHearts ? t("debugoverlay.unlim") : '3♥'}
        </Text>
        <Text style={styles.line}>
          {t("debugoverlay.shotatt")}{snapshot.authoredAttempts} {t("debugoverlay.1st")}{snapshot.firstTryClears}
        </Text>
        {snapshot.lastFail !== '-' ? (
          <Text style={styles.warn}>{t("debugoverlay.failed")}{snapshot.lastFail}</Text>
        ) : null}
        {snapshot.spike ? <Text style={styles.warn}>{t("debugoverlay.4_attempts")}</Text> : null}
        <Text style={styles.line}>
          {t("debugoverlay.theme")}{snapshot.runTheme} {t("debugoverlay.lvl")}{snapshot.playerLevel}
        </Text>
        <Text style={styles.line}>
          {t("debugoverlay.xp")}{snapshot.totalXP} {t("debugoverlay.ball")}{snapshot.selectedProjectile}
        </Text>
        <Text style={styles.line}>
          {t("debugoverlay.ads")}{snapshot.adsEnabled ? t("debugoverlay.on") : t("debugoverlay.off")} {t("debugoverlay.test")}{snapshot.useTestAds ? 'Y' : 'N'}
        </Text>
        <Text style={styles.line}>
          {t("debugoverlay.rw")}{snapshot.rewardedReady ? t("debugoverlay.rdy") : t("debugoverlay.no")} {t("debugoverlay.int")}{snapshot.interstitialReady ? t("debugoverlay.rdy") : t("debugoverlay.no")}
        </Text>
        <Text style={styles.line}>
          {t("debugoverlay.iap")}{snapshot.removeAds ? t("debugoverlay.noads") : '-'} {t("debugoverlay.cont")}{snapshot.hasUsedContinue ? t("debugoverlay.used") : t("debugoverlay.free")}
        </Text>
        <Text style={styles.line}>{t("debugoverlay.an")}{snapshot.analyticsDebug ? t("debugoverlay.dbg") : t("debugoverlay.off")}</Text>
      </View>
      {snapshot.phase === 'AIMING' ? <AimGuides snapshot={snapshot} /> : null}
      <View style={styles.buttons}>
        {snapshot.runMode !== 'GENERATED' ? (
          <>
            <DebugButton label={t("debugoverlay.prev")} onPress={onPrevious} />
            <DebugButton label={t("debugoverlay.rst")} onPress={onReplay} />
            <DebugButton label={t("debugoverlay.next")} onPress={onNext} />
            <DebugButton label="+5" onPress={onJumpAhead} />
            <DebugButton label={snapshot.unlimitedHearts ? t("debugoverlay.on_2") : t("debugoverlay.off_2")} onPress={onToggleHearts} />
            <DebugButton label={t("debugoverlay.run")} onPress={onRestartGauntlet} />
            <DebugButton label={t("debugoverlay.end_run")} onPress={onForceRunOver} />
            <DebugButton label={t("debugoverlay.mode_2")} onPress={onCycleMode} />
            <DebugButton
              label={confirmReset ? 'CONFIRM?' : t("debugoverlay.rst_best")}
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
            <DebugButton label={t("debugoverlay.next")} onPress={onNext} />
            <DebugButton label={t("debugoverlay.replay")} onPress={onReplay} />
            <DebugButton label={t("debugoverlay.seed_2")} onPress={onRestartSeed} />
            <DebugButton label={t("debugoverlay.env")} onPress={onJumpEnvironment} />
            <DebugButton
              label={snapshot.unlimitedHearts ? t("debugoverlay.on_2") : t("debugoverlay.off_2")}
              onPress={onToggleHearts}
            />
            <DebugButton label={t("debugoverlay.end_run")} onPress={onForceRunOver} />
            <DebugButton label={t("debugoverlay.mode_2")} onPress={onCycleMode} />
            <DebugButton
              label={confirmReset ? 'CONFIRM?' : t("debugoverlay.rst_best")}
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
        <DebugButton label={t("debugoverlay.lvl_2")} onPress={onAddLevel} />
        <DebugButton label={t("debugoverlay.xp_2")} onPress={onAddXp} />
        <DebugButton label={t("debugoverlay.all")} onPress={onUnlockAll} />
        <DebugButton label={t("debugoverlay.lock")} onPress={onLockAll} />
        <DebugButton
          label={confirmProgress ? 'CONFIRM?' : t("debugoverlay.rst_prog")}
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
        <DebugButton label={t("debugoverlay.rst_onb")} onPress={onResetOnboarding} />
        <DebugButton label={snapshot.analyticsDebug ? t("debugoverlay.an_on") : t("debugoverlay.an_off")} onPress={onToggleAnalytics} />
        <DebugButton label={snapshot.adsEnabled ? t("debugoverlay.ads_on") : t("debugoverlay.ads_off")} onPress={onToggleAds} />
        <DebugButton label={snapshot.useTestAds ? t("debugoverlay.test_on") : t("debugoverlay.test_off")} onPress={onToggleTestAds} />
        <DebugButton label={t("debugoverlay.rw_rdy")} onPress={onForceRewardedReady} />
        <DebugButton label={t("debugoverlay.rw_fail")} onPress={onForceRewardedFail} />
        <DebugButton label={t("debugoverlay.int_rdy")} onPress={onForceInterstitialReady} />
        <DebugButton label={t("debugoverlay.int_fail")} onPress={onForceInterstitialFail} />
        <DebugButton label={t("debugoverlay.rst_ads")} onPress={onResetAdCounters} />
        <DebugButton label={snapshot.removeAds ? t("debugoverlay.iap_on") : t("debugoverlay.iap_off")} onPress={onToggleRemoveAds} />
        <DebugButton label={t("debugoverlay.cont_rst")} onPress={onResetContinue} />
        <DebugButton label={t("debugoverlay.cont_used")} onPress={onSetContinueUsed} />
        <DebugButton label={t("debugoverlay.cont_ok")} onPress={onForceContinueSuccess} />
        <DebugButton label={t("debugoverlay.cont_no")} onPress={onForceContinueFail} />
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
