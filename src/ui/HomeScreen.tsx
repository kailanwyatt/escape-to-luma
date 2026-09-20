import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { TOTAL_CORE_LEVELS, worldForLevel } from '../campaign/worlds';
import { HOME_BRAND } from '../config/branding';
import { ContainmentScene } from '../design/components/ContainmentScene';
import { ECONOMY } from '../config/economy';
import {
  BottomNav,
  BrandHero,
  Button,
  ContinueJourneyButton,
  Screen,
  StatusPanel,
  color,
  space,
  textStyles,
} from '../design';
import { formatCountdown, msUntilNextEnergy, regenerateEnergy } from '../economy/energy';
import { hasUnlimitedEnergy, isEndlessUnlocked, type PersistentGameData } from '../persistence/GameSave';

type Props = {
  save: PersistentGameData;
  onContinue: () => void;
  onJourney: () => void;
  onSparks: () => void;
  onShop: () => void;
  onStats: () => void;
  onSettings: () => void;
  onEndless: () => void;
  currentLevel: number;
};

export function HomeScreen({
  save,
  onContinue,
  onJourney,
  onSparks,
  onShop,
  onStats,
  onSettings,
  onEndless,
  currentLevel,
}: Props) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const campaign = save.campaign;
  const unlimited = hasUnlimitedEnergy(campaign);
  const level = Math.max(1, Math.min(currentLevel, TOTAL_CORE_LEVELS));
  const world = worldForLevel(level);
  const energy = regenerateEnergy(campaign.currentEnergy, campaign.energyUpdatedAt, now, unlimited);
  const nextMs = msUntilNextEnergy(energy.energy, energy.energyUpdatedAt, now);
  const post = campaign.campaignCompleted;
  const worldIndex = world?.index ?? 1;
  const worldName = post ? HOME_BRAND.destination : (world?.name ?? 'THE CONTAINMENT');

  const ctaLabel = post ? 'ENDLESS VOYAGE' : 'CONTINUE JOURNEY';
  const ctaSub = post
    ? 'EXPLORE THE NETWORK'
    : `WORLD ${worldIndex} · LEVEL ${level}`;

  return (
    <Screen>
      <View style={styles.topBar}>
        <View style={styles.topSpacer} />
        {isEndlessUnlocked(campaign) && !post ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Endless voyage" onPress={onEndless} hitSlop={12} style={styles.topGhost}>
            <Text style={textStyles.caption}>ENDLESS</Text>
          </Pressable>
        ) : (
          <View style={styles.topGhost} />
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Settings"
          onPress={onSettings}
          hitSlop={12}
          style={styles.settingsBtn}
        >
          <Text style={styles.settingsGlyph}>⚙</Text>
        </Pressable>
      </View>

      <View style={styles.layout}>
        <View style={styles.topBlock}>
          <BrandHero
            kicker={post ? 'HOME REACHED' : HOME_BRAND.eyebrow}
            title={HOME_BRAND.title}
            productLine={HOME_BRAND.subtitle}
            tagline={
              post ? 'THE NETWORK IS OPEN.' : HOME_BRAND.tagline
            }
          />

          <StatusPanel
            worldIndex={worldIndex}
            worldName={worldName}
            level={level}
            totalLevels={TOTAL_CORE_LEVELS}
            energyLabel={unlimited ? '∞' : `${energy.energy} / ${ECONOMY.maxEnergy}`}
            shardsLabel={String(campaign.shards)}
          />
          {!unlimited && energy.energy < ECONOMY.maxEnergy ? (
            <Text style={[textStyles.caption, styles.nextEnergy]}>
              NEXT +1  {formatCountdown(nextMs)}
            </Text>
          ) : null}
        </View>

        <ContainmentScene />

        <View style={styles.midBlock}>
          <View style={styles.ctaContainer}>
            <ContinueJourneyButton
              label={ctaLabel}
              onPress={post ? onEndless : onContinue}
            />
          </View>
          <Text style={[textStyles.caption, styles.ctaSub]}>{ctaSub}</Text>
          {post ? (
            <Button label="REPLAY JOURNEY" variant="ghost" onPress={onContinue} />
          ) : null}
        </View>

        <View style={styles.bottomBlock}>
          <BottomNav
            items={[
              { id: 'journey', label: 'JOURNEY', subtitle: 'WORLDS', glyph: '⌖', onPress: onJourney },
              { id: 'sparks', label: 'SPARKS', subtitle: 'CUSTOMIZE', glyph: '✦', onPress: onSparks },
              { id: 'shop', label: 'SHOP', subtitle: 'SKINS & BOOSTS', glyph: '▣', onPress: onShop },
              { id: 'stats', label: 'STATS', subtitle: 'YOUR PROGRESS', glyph: '▦', onPress: onStats },
            ]}
          />

          <View style={styles.quoteRow}>
            <View style={styles.quoteLine} />
            <Text style={textStyles.quote}>{HOME_BRAND.closing}</Text>
            <View style={styles.quoteLine} />
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: space.sm,
  },
  topSpacer: {
    flex: 1,
  },
  topGhost: {
    minWidth: 44,
    alignItems: 'center',
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: color.panelBorder,
    backgroundColor: color.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsGlyph: {
    color: color.cyanBright,
    fontSize: 22,
  },
  layout: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: space.xs,
  },
  topBlock: {
    gap: space.md,
    alignItems: 'stretch',
  },
  nextEnergy: {
    textAlign: 'center',
    marginTop: -space.sm,
  },
  midBlock: {
    alignItems: 'center',
    gap: space.xs,
    paddingVertical: space.md,
  },
  ctaContainer: {
    width: '100%',
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  ctaSub: {
    letterSpacing: 2,
  },
  bottomBlock: {
    gap: space.md,
  },
  quoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.xs,
  },
  quoteLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: color.strokeStrong,
  },
});
