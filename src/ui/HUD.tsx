import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { HudSnapshot } from '../game/GameState';
import { formatScore } from '../target/TargetScoring';

type Props = {
  hud: HudSnapshot;
  debugEnabled: boolean;
  onToggleDebug: () => void;
  onRestart: () => void;
  onHome: () => void;
  onContinue: () => void;
  onDeclineContinue: () => void;
};

export function HUD({
  hud,
  debugEnabled,
  onToggleDebug,
  onRestart,
  onHome,
  onContinue,
  onDeclineContinue,
}: Props) {
  const insets = useSafeAreaInsets();
  const hearts = hud.unlimitedHearts
    ? '∞'
    : [0, 1, 2].map((index) => (index < hud.lives ? '♥' : '♡')).join(' ');

  return (
    <View style={styles.root}>
      <View style={[styles.top, { paddingTop: Math.max(insets.top, 16) + 8 }]}>
        <Text style={styles.hearts}>{hearts}</Text>
        <Pressable onPress={onToggleDebug} hitSlop={12}>
          <Text style={[styles.shot, debugEnabled && styles.shotOn]}>
            {debugEnabled
              ? `${hud.environment.toUpperCase()} · ${hud.shotInEnvironment}/${hud.shotsPerEnvironment}`
              : `${hud.environment.toUpperCase()} · PROTO`}
          </Text>
        </Pressable>
        <Text style={styles.score}>{formatScore(hud.score)}</Text>
      </View>

      {hud.streak >= 2 || hud.multiplier > 1 ? (
        <View style={styles.streakWrap}>
          {hud.multiplier > 1 ? <Text style={styles.multiplier}>x{hud.multiplier}</Text> : null}
          {hud.streak >= 2 ? <Text style={styles.streak}>STREAK {hud.streak}</Text> : null}
        </View>
      ) : null}
      {hud.banner ? <Text style={styles.banner}>{hud.banner}</Text> : null}
      {hud.closeCallText ? <Text style={styles.closeCall}>{hud.closeCallText}</Text> : null}

      {hud.cancelReady ? <Text style={styles.cancel}>CANCEL</Text> : null}

      {hud.onboardingText ? (
        <View style={[styles.onboarding, { bottom: Math.max(insets.bottom, 16) + 28 }]}>
          <Text style={styles.onboardingTitle}>{hud.onboardingText}</Text>
          {hud.onboardingText === 'DRAG TO AIM' ? (
            <Text style={styles.onboardingSub}>RELEASE TO THROW</Text>
          ) : null}
        </View>
      ) : null}

      {hud.phase === 'RUN_START' ? (
        <View style={styles.startOverlay} pointerEvents="none">
          <Text style={styles.startTheme}>{hud.runTheme}</Text>
          <Text style={styles.startBestLabel}>BEST</Text>
          <Text style={styles.startBest}>{formatScore(hud.bestScore)}</Text>
          <Text style={styles.tapStart}>TAP TO START</Text>
        </View>
      ) : null}

      {hud.phase === 'CONTINUE_OFFER' ? (
        <View style={styles.overlay}>
          <Text style={styles.endTitle}>KEEP GOING?</Text>
          <Text style={styles.continueCopy}>Watch an ad to continue this run.</Text>
          {hud.adMessage ? <Text style={styles.adMessage}>{hud.adMessage}</Text> : null}
          <Pressable
            style={[styles.button, hud.adBusy && styles.buttonDisabled]}
            disabled={hud.adBusy}
            onPress={onContinue}
          >
            <Text style={styles.buttonText}>{hud.adBusy ? 'LOADING' : 'CONTINUE'}</Text>
          </Pressable>
          <Pressable
            style={styles.homeButton}
            disabled={hud.adBusy}
            onPress={onDeclineContinue}
          >
            <Text style={styles.homeText}>END RUN</Text>
          </Pressable>
        </View>
      ) : null}

      {hud.phase === 'PROTOTYPE_COMPLETE' ? (
        <EndCard
          title="GAUNTLET COMPLETE"
          hud={hud}
          newBest={hud.records.score}
          rows={[
            ['Score', formatScore(hud.score)],
            ['Best', formatScore(hud.bestScore)],
            ['Shots', String(hud.shotsReached)],
            ['Best Streak', String(hud.bestStreak)],
          ]}
          secondary={[
            ['Bullseyes', String(hud.bullseyes)],
            ['Perfects', String(hud.perfects)],
            ['Close Calls', String(hud.closeCalls)],
          ]}
          action="TRY AGAIN"
          onAction={onRestart}
          onHome={onHome}
          busy={hud.adBusy}
        />
      ) : null}

      {hud.phase === 'RUN_OVER' ? (
        <EndCard
          title="RUN OVER"
          hud={hud}
          newBest={hud.records.score}
          rows={[
            ['Score', formatScore(hud.score)],
            ['Best', formatScore(hud.bestScore)],
            ['Shots', String(hud.shotsReached)],
            ['Best Streak', String(hud.bestStreak)],
          ]}
          secondary={[
            ['Bullseyes', String(hud.bullseyes)],
            ['Perfects', String(hud.perfects)],
            ['Close Calls', String(hud.closeCalls)],
          ]}
          action="TRY AGAIN"
          onAction={onRestart}
          onHome={onHome}
          busy={hud.adBusy}
        />
      ) : null}
    </View>
  );
}

function EndCard({
  title,
  rows,
  secondary,
  action,
  onAction,
  onHome,
  newBest,
  hud,
  busy,
}: {
  title: string;
  rows: [string, string][];
  secondary?: [string, string][];
  action: string;
  onAction: () => void;
  onHome: () => void;
  newBest: boolean;
  hud: HudSnapshot;
  busy?: boolean;
}) {
  const ratio = hud.xpForNext <= 0 ? 1 : Math.min(1, hud.xpIntoLevel / hud.xpForNext);
  return (
    <View style={styles.overlay}>
      <Text style={styles.endTitle}>{title}</Text>
      {newBest ? <Text style={styles.newBest}>NEW BEST</Text> : null}
      {rows.map(([label, value]) => (
        <View key={label} style={styles.row}>
          <Text style={styles.rowLabel}>{label}</Text>
          <Text style={styles.rowValue}>{value}</Text>
        </View>
      ))}
      {secondary?.map(([label, value]) => (
        <View key={label} style={styles.row}>
          <Text style={styles.secondaryLabel}>{label}</Text>
          <Text style={styles.secondaryValue}>{value}</Text>
        </View>
      ))}
      <Text style={styles.xpGain}>+{hud.runXp} XP</Text>
      {hud.levelUp ? <Text style={styles.levelUp}>LEVEL UP</Text> : null}
      <Text style={styles.levelLabel}>LEVEL {hud.playerLevel}</Text>
      <View style={styles.xpBar}>
        <View style={[styles.xpFill, { width: `${Math.round(ratio * 100)}%` }]} />
      </View>
      <Text style={styles.xpMeta}>
        {hud.xpForNext <= 0 ? 'MAX' : `${hud.xpIntoLevel} / ${hud.xpForNext}`}
      </Text>
      {hud.unlockedName ? (
        <View style={styles.unlock}>
          <Text style={styles.unlockEyebrow}>NEW PROJECTILE</Text>
          <Text style={styles.unlockName}>{hud.unlockedName.toUpperCase()}</Text>
          <Text style={styles.unlockStatus}>UNLOCKED</Text>
        </View>
      ) : null}
      <Pressable style={[styles.button, busy && styles.buttonDisabled]} onPress={onAction} disabled={busy}>
        <Text style={styles.buttonText}>{busy ? 'LOADING' : action}</Text>
      </Pressable>
      <Pressable style={styles.homeButton} onPress={onHome}>
        <Text style={styles.homeText}>HOME</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    pointerEvents: 'box-none',
  },
  top: {
    paddingTop: 54,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    pointerEvents: 'box-none',
  },
  hearts: {
    color: '#ff5d6c',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 2,
    width: 90,
  },
  score: {
    color: '#f4efe6',
    fontSize: 18,
    fontWeight: '800',
    width: 90,
    textAlign: 'right',
  },
  shot: {
    color: 'rgba(244,239,230,0.55)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  shotOn: {
    color: '#7ef0ff',
  },
  streakWrap: {
    marginTop: 8,
    alignItems: 'center',
  },
  multiplier: {
    color: '#ffd24a',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  streak: {
    marginTop: 2,
    textAlign: 'center',
    color: '#ffd24a',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  banner: {
    marginTop: 18,
    textAlign: 'center',
    color: '#f4efe6',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 4,
  },
  closeCall: {
    marginTop: 10,
    textAlign: 'center',
    color: '#7ef0ff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2,
  },
  cancel: {
    position: 'absolute',
    bottom: 108,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: 'rgba(244,239,230,0.78)',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 3,
  },
  onboarding: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  onboardingTitle: {
    color: '#f4efe6',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
  },
  onboardingSub: {
    marginTop: 6,
    color: 'rgba(244,239,230,0.7)',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(10,8,7,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    pointerEvents: 'auto',
  },
  endTitle: {
    color: '#ffd24a',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 12,
    textAlign: 'center',
  },
  newBest: {
    color: '#7ef0ff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 18,
  },
  row: {
    width: '100%',
    maxWidth: 280,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  rowLabel: {
    color: 'rgba(244,239,230,0.7)',
    fontSize: 15,
    fontWeight: '600',
  },
  rowValue: {
    color: '#f4efe6',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryLabel: {
    color: 'rgba(244,239,230,0.42)',
    fontSize: 13,
    fontWeight: '600',
  },
  secondaryValue: {
    color: 'rgba(244,239,230,0.55)',
    fontSize: 13,
    fontWeight: '700',
  },
  button: {
    marginTop: 28,
    backgroundColor: '#d06a32',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    color: '#fff8ef',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  startOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10,8,7,0.42)',
  },
  startTheme: {
    color: '#ffd24a',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 4,
  },
  startBestLabel: {
    marginTop: 28,
    color: 'rgba(244,239,230,0.55)',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 3,
  },
  startBest: {
    marginTop: 4,
    color: '#f4efe6',
    fontSize: 22,
    fontWeight: '800',
  },
  tapStart: {
    marginTop: 36,
    color: '#7ef0ff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 3,
  },
  continueCopy: {
    marginTop: 8,
    marginBottom: 18,
    color: 'rgba(244,239,230,0.78)',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  adMessage: {
    marginBottom: 12,
    color: '#ffd24a',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  xpGain: {
    marginTop: 18,
    color: '#7ef0ff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
  },
  levelUp: {
    marginTop: 8,
    color: '#ffd24a',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 3,
  },
  levelLabel: {
    marginTop: 10,
    color: '#f4efe6',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
  },
  xpBar: {
    marginTop: 8,
    width: 220,
    height: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(244,239,230,0.15)',
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: '#7ef0ff',
  },
  xpMeta: {
    marginTop: 6,
    color: 'rgba(244,239,230,0.65)',
    fontSize: 12,
    fontWeight: '700',
  },
  unlock: {
    marginTop: 18,
    alignItems: 'center',
  },
  unlockEyebrow: {
    color: 'rgba(244,239,230,0.55)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
  },
  unlockName: {
    marginTop: 4,
    color: '#ffd24a',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
  unlockStatus: {
    marginTop: 2,
    color: '#7ef0ff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
  },
  homeButton: {
    marginTop: 14,
    paddingVertical: 10,
  },
  homeText: {
    color: '#7ef0ff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
  },
});
