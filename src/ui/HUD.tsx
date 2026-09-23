import {FinaleScreen} from './FinaleScreen';
import {CompletionScreen} from './CompletionScreen';
import {nextVoyageMilestone} from '../progression/voyage';
import {t, displayLabel} from '../i18n';
import {useState} from 'react';
import {GameplayHeader, GameplayBoostButton} from './GameplayControls';
import {RELEASE_POLICY} from '../config/release';
import {StoryScreen} from './StoryScreen';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { HudSnapshot } from '../game/GameState';
import { getAssetSource } from '../graphics/assetRegistry';
import { formatScore } from '../target/TargetScoring';
import { color, ContinueJourneyButton } from '../design';
import { CampaignOpening } from './CampaignOpening';

type Props = {
  reduceMotion?:boolean;
  boostCount: number;
  hud: HudSnapshot;
  debugEnabled: boolean;
  onToggleDebug: () => void;
  onRestart: () => void;
  onHome: () => void;
  onContinue: () => void;
  onDeclineContinue: () => void;
  onContinueLevel: () => void;
  onExploreFinale: () => void;
  onRetryLevel: () => void;
  onUseHelp: () => void;
  onDeclineHelp: () => void;
  paused: boolean;
  onPause: () => void;
  onResume: () => void;
  onSkipOpening: () => void;
  onBoosts:()=>void;
  onOpenJourney?: () => void;
};

const CAMPAIGN_OVERLAY_PHASES = new Set<HudSnapshot['phase']>([
  'CAMPAIGN_STORY',
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
  boostCount,
  reduceMotion=false,
  debugEnabled,
  onToggleDebug,
  onRestart,
  onHome,
  onContinue,
  onDeclineContinue,
  onContinueLevel,
  onExploreFinale,
  onRetryLevel,
  onUseHelp,
  onDeclineHelp,
  paused,
  onPause,
  onResume,
  onSkipOpening,
  onBoosts,
  onOpenJourney,
}: Props) {
  const insets = useSafeAreaInsets();
  const [instructionHeight, setInstructionHeight] = useState(0);
  const campaign = hud.sessionMode === 'campaign';
  const showCampaignTop = campaign && !CAMPAIGN_OVERLAY_PHASES.has(hud.phase) && hud.phase !== 'RESULT';
  const crackEscapeSource = getAssetSource('world1.crackEscape');

  const hearts = hud.unlimitedHearts
    ? '∞'
    : [0, 1, 2].map((index) => (index < hud.lives ? '♥' : '♡')).join(' ');



  if ((hud.phase === 'CAMPAIGN_STORY' && hud.campaignStory?.visual === 'reunion') || hud.phase === 'CAMPAIGN_COMPLETE') {
    return <FinaleScreen equippedSparkId={hud.equippedSparkId ?? 'original'} reduceMotion={reduceMotion} onExplore={onExploreFinale}/>;
  }
  if (hud.phase === 'CAMPAIGN_STORY' && hud.campaignStory) {
    return <StoryScreen level={hud.campaignLevel} reduceMotion={reduceMotion} story={hud.campaignStory} onContinue={onContinueLevel} onHome={onHome}/>;
  }

  if (['WORLD_COMPLETE','SPARK_UNLOCKED'].includes(hud.phase)) {
    return <CompletionScreen hud={hud} onContinue={onContinueLevel} onHome={onHome} reduceMotion={reduceMotion}/>;
  }

  return (
    <View style={styles.root} pointerEvents="box-none">
      {showCampaignTop ? <GameplayHeader hud={hud} onBack={onPause} onTitlePress={onOpenJourney}/> : null}
      {showCampaignTop ? (
        hud.firstLevelOnboarding ? (
          <View style={[styles.breachHeaderWrap, { paddingTop: 8 }]}>
            <LinearGradient
              colors={['rgba(6,18,32,0.94)', 'rgba(8,28,44,0.88)', 'rgba(4,14,26,0.55)']}
              locations={[0, 0.55, 1]}
              style={styles.breachHeader}
            >
              <View style={styles.breachHeaderTop}>
                <View style={styles.breachBadge}>
                  <View style={styles.breachBadgeDot} />
                  <Text style={styles.breachBadgeText}>{t("worlds.containment")}</Text>
                </View>
                <Text style={styles.breachMeta}>{t("hud.breach_l1")}</Text>

              </View>
              <View style={styles.breachMissionRow}>
                {crackEscapeSource ? (
                  <Image
                    source={crackEscapeSource}
                    style={styles.breachThumb}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.breachThumb, styles.breachThumbFallback]} />
                )}
                <View style={styles.breachMissionCopy}>
                  <Text style={styles.breachEyebrow}>{t("hud.objective")}</Text>
                  <Text style={styles.breachTitle}>{t("hud.escape_through_the_crack")}</Text>
                  <Text style={styles.breachSub}>{t("hud.aim_for_the_fracture_break_free_of_the_vessel")}</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        ) : null
      ) : !campaign ? (
        <View style={[styles.top, { paddingTop: Math.max(insets.top, 16) + 8 }]}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('gameplaycontrols.pause_game')} onPress={onPause} hitSlop={12}><Text style={styles.hearts}>‹</Text></Pressable>
          <View style={{flex:1,alignItems:'center'}}>
            <Text style={styles.shot}>{t('voyage.title')}</Text>
            <Text style={{color:'#92c6da',fontSize:11,marginTop:5}}>{t('voyage.progress',{cleared:hud.shotsReached,goal:nextVoyageMilestone(hud.shotsReached)})}</Text>
            <Text style={{color:'#69e6ee',fontSize:12,marginTop:4}}>{hearts}</Text>
          </View>
          <Text style={styles.score}>{formatScore(hud.score)}</Text>
        </View>
      ) : null}

      {!campaign && (hud.streak >= 2 || hud.multiplier > 1) ? (
        <View style={styles.streakWrap}>
          {hud.multiplier > 1 ? <Text style={styles.multiplier}>{t("debugoverlay.x")}{hud.multiplier}</Text> : null}
          {hud.streak >= 2 ? <Text style={styles.streak}>{t("hud.streak")}{hud.streak}</Text> : null}
        </View>
      ) : null}
      {hud.banner ? <Text pointerEvents="none" style={styles.banner}>{hud.banner}</Text> : null}
      {hud.closeCallText ? <Text pointerEvents="none" style={styles.closeCall}>{hud.closeCallText}</Text> : null}

      {showCampaignTop && !hud.firstLevelOnboarding && !paused ? (
        <GameplayBoostButton count={boostCount} disabled={!hud.canChooseBoosts}
          onPress={onBoosts}
          bottom={hud.onboardingText
            ? Math.max(insets.bottom, 16) + 28 + instructionHeight + 14
            : Math.max(insets.bottom, 16) + 18}/>
      ) : null}

      {hud.cancelReady && !hud.firstLevelOnboarding ? (
        <Text pointerEvents="none" style={styles.cancel}>{t("hud.cancel")}</Text>
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
          <Text style={styles.firstTutorialEyebrow}>{hud.cancelReady ? t("hud.release_to_cancel") : hud.phase === 'AIMING' ? t("hud.release_to_launch") : t("hud.pull_down_to_power_up")}</Text>
          <Text style={{color: color.creamMuted, fontSize: 12, textAlign: 'center', marginTop: 6}}>
            {hud.phase === 'AIMING' ? t("hud.move_sideways_to_aim_return_to_center_to_cancel") : t("hud.drag_to_aim_through_the_opening_in_the_glass")}
          </Text>
        </View>
      ) : hud.onboardingText && !CAMPAIGN_OVERLAY_PHASES.has(hud.phase) ? (
        <View onLayout={event => setInstructionHeight(event.nativeEvent.layout.height)} style={[styles.onboarding, { bottom: Math.max(insets.bottom, 16) + 28 }]}>
          <Text style={styles.onboardingTitle}>{hud.onboardingText}</Text>
          {hud.onboardingText === t("game.drag_to_aim") ? (
            <Text style={styles.onboardingSub}>{t("hud.release_to_throw")}</Text>
          ) : null}
        </View>
      ) : null}

      {hud.phase === 'CAMPAIGN_OPENING' && !paused ? (
        <CampaignOpening reduceMotion={reduceMotion} stage={hud.openingStage} onSkip={onSkipOpening} onPause={onPause} />
      ) : null}

      {hud.phase === 'LEVEL_COMPLETE' ? (
        <View style={styles.overlay}>
          <Text style={styles.endTitle}>{t("hud.level_clear")}</Text>
          {hud.lastPrecisionRank ? (
            <Text style={styles.rank}>{displayLabel(hud.lastPrecisionRank)}</Text>
          ) : null}
          {hud.lastShardsGained > 0 ? (
            <Text style={styles.shardGain}>+{hud.lastShardsGained} {t("statuspanel.shards")}</Text>
          ) : null}
          <ContinueJourneyButton label={hud.campaignLevel >= RELEASE_POLICY.campaignMaxLevel ? t("debugoverlay.replay") : t("debugoverlay.next")} playIcon={false} style={styles.overlayCta} onPress={onContinueLevel} />
          <Pressable style={styles.homeButton} onPress={onHome}>
            <Text style={styles.homeText}>{t("worldspack.home")}</Text>
          </Pressable>
        </View>
      ) : null}

      {hud.phase === 'LEVEL_FAILED' ? (
        <View style={styles.overlay}>
          <Text style={styles.endTitle}>{t("hud.level_failed")}</Text>
          {hud.lastFail ? <Text style={styles.continueCopy}>{hud.lastFail}</Text> : null}
          <ContinueJourneyButton label={t("apperrorboundary.retry")} playIcon={false} style={styles.overlayCta} onPress={onRetryLevel} />
          {hud.helpOffer?<Pressable accessibilityRole="button" onPress={onUseHelp} style={styles.homeButton}><Text style={styles.helpCopy}>{t("hud.need_a_hand_try_a_free_slow_field")}</Text></Pressable>:null}
          <Pressable style={styles.homeButton} onPress={onHome}><Text style={styles.homeText}>{t("worldspack.home")}</Text></Pressable>

        </View>
      ) : null}

      {hud.phase === 'RUN_START' ? (
        <View style={styles.startOverlay} pointerEvents="none">
          <Text style={styles.startTheme}>{t('voyage.title')}</Text>
          <Text style={styles.continueCopy}>{t('voyage.rules')}</Text>
          <Text style={styles.rank}>{hud.runTheme}</Text>
          <Text style={styles.startBestLabel}>{t("hud.best")}</Text>
          <Text style={styles.startBest}>{formatScore(hud.bestScore)}</Text>
          <Text style={styles.tapStart}>{t("hud.tap_to_start")}</Text>
        </View>
      ) : null}

      {hud.phase === 'CONTINUE_OFFER' ? (
        <View style={styles.overlay}>
          <Text style={styles.endTitle}>{t("hud.keep_going")}</Text>
          <Text style={styles.continueCopy}>{t("hud.watch_an_ad_to_continue_this_run")}</Text>
          {hud.adMessage ? <Text style={styles.adMessage}>{hud.adMessage}</Text> : null}
          <ContinueJourneyButton
            label={hud.adBusy ? t("hud.loading") : t("storymoments.continue")}
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
            <Text style={styles.homeText}>{t("debugoverlay.end_run")}</Text>
          </Pressable>
        </View>
      ) : null}

      {hud.phase === 'PROTOTYPE_COMPLETE' ? (
        <EndCard
          title={t("hud.gauntlet_complete")}
          hud={hud}
          newBest={hud.records.score}
          rows={[
            [t("hud.score"), formatScore(hud.score)],
            [t("hud.best_2"), formatScore(hud.bestScore)],
            [t("hud.shots"), String(hud.shotsReached)],
            [t("hud.best_streak"), String(hud.bestStreak)],
          ]}
          secondary={[
            [t("hud.bullseyes"), String(hud.bullseyes)],
            [t("hud.perfects"), String(hud.perfects)],
            [t("hud.close_calls"), String(hud.closeCalls)],
          ]}
          action={t("voyage.again")}
          onAction={onRestart}
          onHome={onHome}
          busy={hud.adBusy}
        />
      ) : null}

      {hud.phase === 'RUN_OVER' ? (
        <EndCard
          title={t("voyage.complete")}
          hud={hud}
          newBest={hud.records.score}
          rows={[
            [t("hud.score"), formatScore(hud.score)],
            [t("hud.best_2"), formatScore(hud.bestScore)],
            [t("hud.shots"), String(hud.shotsReached)],
            [t("hud.best_streak"), String(hud.bestStreak)],
          ]}
          secondary={[
            [t("hud.bullseyes"), String(hud.bullseyes)],
            [t("hud.perfects"), String(hud.perfects)],
            [t("hud.close_calls"), String(hud.closeCalls)],
          ]}
          action={t("voyage.again")}
          onAction={onRestart}
          onHome={onHome}
          busy={hud.adBusy}
        />
      ) : null}

      {paused ? (
        <View style={styles.overlay}>
          <Text style={styles.endTitle}>{t("hud.paused")}</Text>
          <ContinueJourneyButton label={t("hud.resume")} playIcon={false} style={styles.overlayCta} onPress={onResume} />
          <Pressable style={styles.homeButton} onPress={onRestart}>
            <Text style={styles.homeText}>{campaign ? t("hud.restart_level") : t("hud.restart_run")}</Text>
          </Pressable>
          <Pressable style={styles.homeButton} onPress={onHome}>
            <Text style={styles.homeText}>{t("hud.return_home")}</Text>
          </Pressable>
        </View>
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
      {newBest ? <Text style={styles.newBest}>{t("game.new_best")}</Text> : null}
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
      <Text style={styles.shardGain}>{t('voyage.banked',{count:hud.voyageShards??0})}</Text>
      <Text style={styles.xpGain}>+{hud.runXp} {t("hud.xp")}</Text>
      {hud.levelUp ? <Text style={styles.levelUp}>{t("hud.level_up")}</Text> : null}
      <Text style={styles.levelLabel}>{t("hud.level")}{hud.playerLevel}</Text>
      <View style={styles.xpBar}>
        <View style={[styles.xpFill, { width: `${Math.round(ratio * 100)}%` }]} />
      </View>
      <Text style={styles.xpMeta}>
        {hud.xpForNext <= 0 ? t("hud.max") : `${hud.xpIntoLevel} / ${hud.xpForNext}`}
      </Text>
      {hud.unlockedName ? (
        <View style={styles.unlock}>
          <Text style={styles.unlockEyebrow}>{t("hud.new_projectile")}</Text>
          <Text style={styles.unlockName}>{hud.unlockedName.toUpperCase()}</Text>
          <Text style={styles.unlockStatus}>{t("hud.unlocked")}</Text>
        </View>
      ) : null}
      <ContinueJourneyButton
        label={busy ? t("hud.loading") : action}
        playIcon={false}
        style={styles.overlayCta}
        onPress={onAction}
        disabled={busy}
      />
      <Pressable style={styles.homeButton} onPress={onHome}>
        <Text style={styles.homeText}>{t("worldspack.home")}</Text>
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
  breachHeaderWrap: {
    paddingHorizontal: 14,
    pointerEvents: 'none',
  },
  breachHeader: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(126,240,255,0.38)',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    overflow: 'hidden',
  },
  breachHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  breachBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,184,0,0.45)',
    backgroundColor: 'rgba(255,184,0,0.12)',
  },
  breachBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: color.amberBright,
  },
  breachBadgeText: {
    color: color.amberBright,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  breachMeta: {
    color: 'rgba(126,240,255,0.72)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  breachTimer: {
    color: 'rgba(244,239,230,0.55)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  breachMissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  breachThumb: {
    width: 58,
    height: 72,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(126,240,255,0.45)',
    backgroundColor: '#0a1826',
  },
  breachThumbFallback: {
    backgroundColor: '#123048',
  },
  breachMissionCopy: {
    flex: 1,
  },
  breachEyebrow: {
    color: color.cyanDim,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 4,
  },
  breachTitle: {
    color: color.cream,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.1,
    marginBottom: 4,
  },
  breachSub: {
    color: 'rgba(244,239,230,0.62)',
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
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
