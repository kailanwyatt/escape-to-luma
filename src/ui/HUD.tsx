import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { HudSnapshot } from '../game/GameState';
import { formatScore } from '../target/TargetScoring';
import { color, ContinueJourneyButton } from '../design';
import { CampaignOpening } from './CampaignOpening';

type Props = {
  hud: HudSnapshot;
  debugEnabled: boolean;
  onToggleDebug: () => void;
  onRestart: () => void;
  onHome: () => void;
  onContinue: () => void;
  onDeclineContinue: () => void;
  onContinueLevel: () => void;
  onRetryLevel: () => void;
  onUseHelp: () => void;
  onDeclineHelp: () => void;
  paused: boolean;
  onPause: () => void;
  onResume: () => void;
  onSkipOpening: () => void;
};

const CAMPAIGN_OVERLAY_PHASES = new Set<HudSnapshot['phase']>([
  'CAMPAIGN_OPENING',
  'LEVEL_COMPLETE',
  'LEVEL_FAILED',
  'WORLD_COMPLETE',
  'SPARK_UNLOCKED',
  'CAMPAIGN_COMPLETE',
  'OUT_OF_ENERGY',
]);

export function HUD({
  hud,
  debugEnabled,
  onToggleDebug,
  onRestart,
  onHome,
  onContinue,
  onDeclineContinue,
  onContinueLevel,
  onRetryLevel,
  onUseHelp,
  onDeclineHelp,
  paused,
  onPause,
  onResume,
  onSkipOpening,
}: Props) {
  const insets = useSafeAreaInsets();
  const campaign = hud.sessionMode === 'campaign';
  const showCampaignTop = campaign && !CAMPAIGN_OVERLAY_PHASES.has(hud.phase) && hud.phase !== 'RESULT';

  const hearts = hud.unlimitedHearts
    ? '∞'
    : [0, 1, 2].map((index) => (index < hud.lives ? '♥' : '♡')).join(' ');

  const energyLabel = hud.unlimitedEnergy
    ? '⚡ ∞'
    : `⚡ ${hud.energy}/${hud.maxEnergy}`;

  return (
    <View style={styles.root}>
      {showCampaignTop ? (
        <View style={[styles.top, { paddingTop: Math.max(insets.top, 16) + 8 }]}>
          <Text style={styles.campaignMeta}>
            {hud.firstLevelOnboarding ? 'CONTAINMENT' : energyLabel}
          </Text>
          <Text style={styles.campaignCenter}>
            {hud.firstLevelOnboarding
              ? 'ESCAPE THROUGH THE CRACK'
              : `L${hud.campaignLevel}${
                  hud.campaignWorldName ? ` · ${hud.campaignWorldName.toUpperCase()}` : ''
                }${hud.windActive ? ' · WIND' : ''}`}
          </Text>
          <Text style={[styles.campaignMeta, styles.campaignMetaRight]}>
            {hud.firstLevelOnboarding ? 'NO TIMER' : `◆ ${hud.shards}`}
          </Text>
        </View>
      ) : !campaign ? (
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
      ) : null}

      {!campaign && (hud.streak >= 2 || hud.multiplier > 1) ? (
        <View style={styles.streakWrap}>
          {hud.multiplier > 1 ? <Text style={styles.multiplier}>x{hud.multiplier}</Text> : null}
          {hud.streak >= 2 ? <Text style={styles.streak}>STREAK {hud.streak}</Text> : null}
        </View>
      ) : null}
      {hud.banner ? <Text style={styles.banner}>{hud.banner}</Text> : null}
      {hud.closeCallText ? <Text style={styles.closeCall}>{hud.closeCallText}</Text> : null}

      {showCampaignTop && !hud.firstLevelOnboarding ? (
        <View style={styles.playControls}>
          <Pressable accessibilityRole="button" onPress={onHome} hitSlop={10}>
            <Text style={styles.controlText}>HOME</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onRestart} hitSlop={10}>
            <Text style={styles.controlText}>RESTART</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onPause} hitSlop={10}>
            <Text style={styles.controlText}>PAUSE</Text>
          </Pressable>
        </View>
      ) : null}

      {hud.cancelReady && !hud.firstLevelOnboarding ? (
        <Text style={styles.cancel}>CANCEL</Text>
      ) : null}

      {hud.firstLevelOnboarding &&
      (hud.phase === 'READY' || hud.phase === 'AIMING') ? (
        <View
          style={[
            styles.firstTutorial,
            { bottom: Math.max(insets.bottom, 16) + 18 },
          ]}
          pointerEvents="none"
        >
          <Text style={styles.firstTutorialEyebrow}>HOW TO ESCAPE</Text>
          <TutorialRow
            active={hud.phase === 'READY'}
            number="1"
            text="PULL TO POWER UP"
          />
          <TutorialRow
            active={hud.phase === 'AIMING' && !hud.cancelReady}
            number="2"
            text="DRAG TO AIM THROUGH THE CRACK"
          />
          <TutorialRow
            active={hud.phase === 'AIMING' && !hud.cancelReady}
            number="3"
            text="FINGER UP TO RELEASE"
          />
          <TutorialRow
            active={hud.cancelReady}
            number="4"
            text="PULL BACK TO CENTER TO CANCEL"
          />
        </View>
      ) : hud.onboardingText && !CAMPAIGN_OVERLAY_PHASES.has(hud.phase) ? (
        <View style={[styles.onboarding, { bottom: Math.max(insets.bottom, 16) + 28 }]}>
          <Text style={styles.onboardingTitle}>{hud.onboardingText}</Text>
          {hud.onboardingText === 'DRAG TO AIM' ? (
            <Text style={styles.onboardingSub}>RELEASE TO THROW</Text>
          ) : null}
        </View>
      ) : null}

      {hud.phase === 'CAMPAIGN_OPENING' ? (
        <CampaignOpening stage={hud.openingStage} onSkip={onSkipOpening} />
      ) : null}

      {hud.phase === 'LEVEL_COMPLETE' ? (
        <View style={styles.overlay}>
          <Text style={styles.endTitle}>LEVEL CLEAR</Text>
          {hud.lastPrecisionRank ? (
            <Text style={styles.rank}>{hud.lastPrecisionRank}</Text>
          ) : null}
          {hud.lastShardsGained > 0 ? (
            <Text style={styles.shardGain}>+{hud.lastShardsGained} SHARDS</Text>
          ) : null}
          <ContinueJourneyButton label="NEXT" playIcon={false} style={styles.overlayCta} onPress={onContinueLevel} />
          <Pressable style={styles.homeButton} onPress={onHome}>
            <Text style={styles.homeText}>HOME</Text>
          </Pressable>
        </View>
      ) : null}

      {hud.phase === 'WORLD_COMPLETE' ? (
        <View style={styles.overlay}>
          <Text style={styles.endTitle}>WORLD COMPLETE</Text>
          {hud.lastShardsGained > 0 ? (
            <Text style={styles.shardGain}>+{hud.lastShardsGained} SHARDS</Text>
          ) : null}
          <Text style={styles.continueCopy}>The journey continues.</Text>
          <ContinueJourneyButton label="CONTINUE" playIcon={false} style={styles.overlayCta} onPress={onContinueLevel} />
          <Pressable style={styles.homeButton} onPress={onHome}>
            <Text style={styles.homeText}>HOME</Text>
          </Pressable>
        </View>
      ) : null}

      {hud.phase === 'SPARK_UNLOCKED' ? (
        <View style={styles.overlay}>
          <Text style={styles.unlockEyebrow}>NEW SPARK</Text>
          <Text style={styles.unlockName}>{hud.unlockedSparkName?.toUpperCase() ?? 'SPARK'}</Text>
          <Text style={styles.continueCopy}>A new energy form joins the journey.</Text>
          <ContinueJourneyButton label="CONTINUE" playIcon={false} style={styles.overlayCta} onPress={onContinueLevel} />
        </View>
      ) : null}

      {hud.phase === 'CAMPAIGN_COMPLETE' ? (
        <View style={styles.overlay}>
          <Text style={styles.endTitle}>HOME REACHED</Text>
          <Text style={styles.rank}>LUMA</Text>
          <Text style={styles.continueCopy}>Spark found the signal. The network is open.</Text>
          <ContinueJourneyButton label="RETURN HOME" playIcon={false} style={styles.overlayCta} onPress={onHome} />
        </View>
      ) : null}

      {hud.phase === 'LEVEL_FAILED' ? (
        <View style={styles.overlay}>
          <Text style={styles.endTitle}>LEVEL FAILED</Text>
          {hud.lastFail ? <Text style={styles.continueCopy}>{hud.lastFail}</Text> : null}
          {hud.helpOffer ? (
            <View style={styles.helpBanner}>
              <Text style={styles.helpTitle}>NEED A HAND?</Text>
              <Text style={styles.helpCopy}>Try a free slow field on this level.</Text>
              <ContinueJourneyButton label="USE SLOW FIELD" playIcon={false} style={styles.overlayCta} onPress={onUseHelp} />
              <Pressable onPress={onDeclineHelp}>
                <Text style={styles.homeText}>NO THANKS</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <ContinueJourneyButton label="RETRY" playIcon={false} style={styles.overlayCta} onPress={onRetryLevel} />
              <Pressable style={styles.homeButton} onPress={onHome}>
                <Text style={styles.homeText}>HOME</Text>
              </Pressable>
            </>
          )}
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
          <ContinueJourneyButton
            label={hud.adBusy ? 'LOADING' : 'CONTINUE'}
            playIcon={false}
            style={styles.overlayCta}
            disabled={hud.adBusy}
            onPress={onContinue}
          />
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

      {paused ? (
        <View style={styles.overlay}>
          <Text style={styles.endTitle}>PAUSED</Text>
          <ContinueJourneyButton label="RESUME" playIcon={false} style={styles.overlayCta} onPress={onResume} />
          <Pressable style={styles.homeButton} onPress={onRestart}>
            <Text style={styles.homeText}>RESTART</Text>
          </Pressable>
          <Pressable style={styles.homeButton} onPress={onHome}>
            <Text style={styles.homeText}>HOME</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function TutorialRow({
  active,
  number,
  text,
}: {
  active: boolean;
  number: string;
  text: string;
}) {
  return (
    <View style={styles.tutorialRow}>
      <View style={[styles.tutorialNumber, active && styles.tutorialNumberActive]}>
        <Text style={[styles.tutorialNumberText, active && styles.tutorialNumberTextActive]}>
          {number}
        </Text>
      </View>
      <Text style={[styles.tutorialText, active && styles.tutorialTextActive]}>
        {text}
      </Text>
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
      <ContinueJourneyButton
        label={busy ? 'LOADING' : action}
        playIcon={false}
        style={styles.overlayCta}
        onPress={onAction}
        disabled={busy}
      />
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
    color: color.heart,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 2,
    width: 90,
  },
  campaignMeta: {
    color: 'rgba(244,239,230,0.65)',
    fontSize: 13,
    fontWeight: '700',
    width: 72,
  },
  campaignMetaRight: {
    textAlign: 'right',
  },
  campaignCenter: {
    flex: 1,
    textAlign: 'center',
    color: 'rgba(244,239,230,0.55)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  score: {
    color: color.cream,
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
    color: color.cyanBright,
  },
  streakWrap: {
    marginTop: 8,
    alignItems: 'center',
  },
  multiplier: {
    color: color.amberBright,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  streak: {
    marginTop: 2,
    textAlign: 'center',
    color: color.amberBright,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  banner: {
    marginTop: 18,
    textAlign: 'center',
    color: color.cream,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 4,
  },
  closeCall: {
    marginTop: 10,
    textAlign: 'center',
    color: color.cyanBright,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2,
  },
  playControls: {
    position: 'absolute',
    top: 104,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    pointerEvents: 'box-none',
  },
  controlText: {
    color: 'rgba(126,240,255,0.8)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
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
    color: color.cream,
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
  firstTutorial: {
    position: 'absolute',
    left: 20,
    right: 20,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(126,240,255,0.42)',
    backgroundColor: 'rgba(4,14,26,0.88)',
  },
  firstTutorialEyebrow: {
    marginBottom: 10,
    color: color.cyanBright,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2.5,
    textAlign: 'center',
  },
  tutorialRow: {
    minHeight: 27,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tutorialNumber: {
    width: 19,
    height: 19,
    marginRight: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(126,240,255,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tutorialNumberActive: {
    borderColor: color.amberBright,
    backgroundColor: color.amberBright,
  },
  tutorialNumberText: {
    color: color.cyanDim,
    fontSize: 10,
    fontWeight: '900',
  },
  tutorialNumberTextActive: {
    color: color.ink,
  },
  tutorialText: {
    flex: 1,
    color: 'rgba(244,239,230,0.58)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  tutorialTextActive: {
    color: color.amberBright,
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
  storyBeat: {
    color: color.cream,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 28,
  },
  rank: {
    color: color.cyanBright,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 8,
  },
  shardGain: {
    color: color.amberBright,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 12,
  },
  helpBanner: {
    marginTop: 16,
    alignItems: 'center',
    width: '100%',
  },
  helpTitle: {
    color: color.amberBright,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
  helpCopy: {
    marginTop: 8,
    marginBottom: 16,
    color: 'rgba(244,239,230,0.78)',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  endTitle: {
    color: color.amberBright,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 12,
    textAlign: 'center',
  },
  newBest: {
    color: color.cyanBright,
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
    color: color.cream,
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
  overlayCta: {
    marginTop: 28,
    width: '100%',
    maxWidth: 360,
  },
  startOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10,8,7,0.42)',
  },
  startTheme: {
    color: color.amberBright,
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
    color: color.cream,
    fontSize: 22,
    fontWeight: '800',
  },
  tapStart: {
    marginTop: 36,
    color: color.cyanBright,
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
    color: color.amberBright,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  xpGain: {
    marginTop: 18,
    color: color.cyanBright,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
  },
  levelUp: {
    marginTop: 8,
    color: color.amberBright,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 3,
  },
  levelLabel: {
    marginTop: 10,
    color: color.cream,
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
    backgroundColor: color.cyanBright,
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
    color: color.amberBright,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
  unlockStatus: {
    marginTop: 2,
    color: color.cyanBright,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
  },
  homeButton: {
    marginTop: 14,
    paddingVertical: 10,
  },
  homeText: {
    color: color.cyanBright,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
  },
});
