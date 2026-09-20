import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { journeyDestinationLabel, WORLDS } from '../campaign/worlds';
import { getCampaignLevel } from '../campaign/levels';
import { BackButton, GlassPanel, Screen, ScreenTitle, color, radius, space } from '../design';
import type { PersistentGameData } from '../persistence/GameSave';

type Props = {
  save: PersistentGameData;
  onSelectLevel: (levelNumber: number) => void;
  onBack: () => void;
};

export function JourneyScreen({ save, onSelectLevel, onBack }: Props) {
  const campaign = save.campaign;
  const destination = journeyDestinationLabel(campaign.unlockedWorldIds, campaign.campaignCompleted);
  const cleared = Object.values(campaign.completedLevels).filter((entry) => entry.cleared).length;

  return (
    <Screen scroll={false}>
      <ScreenTitle title="JOURNEY HOME" meta={`${cleared} / 150 · DESTINATION ${destination}`} />
      <ScrollView contentContainerStyle={styles.list}>
        {WORLDS.map((world) => {
          const unlocked = campaign.unlockedWorldIds.includes(world.id);
          return (
            <GlassPanel key={world.id} style={[styles.world, !unlocked && styles.locked]}>
              <Text style={styles.worldName}>
                W{world.index} · {world.name}
              </Text>
              <Text style={styles.meta}>
                {world.subtitle}
                {world.stub ? ' · COMING SOON' : ''}
              </Text>
              <Text style={styles.signal}>
                {world.distanceFromEarth} · SIGNAL {world.homeSignalStrength.toUpperCase()}
              </Text>
              {unlocked && !world.stub
                ? Array.from({ length: world.lastLevel - world.firstLevel + 1 }, (_, i) => {
                    const n = world.firstLevel + i;
                    const def = getCampaignLevel(n);
                    if (!def) {
                      return null;
                    }
                    const progress = campaign.completedLevels[def.id];
                    const available = n <= campaign.highestUnlockedLevel;
                    return (
                      <Pressable
                        key={def.id}
                        style={[styles.levelRow, !available && styles.levelLocked]}
                        disabled={!available}
                        onPress={() => onSelectLevel(n)}
                      >
                        <Text style={styles.levelLabel}>LEVEL {n}</Text>
                        <Text style={styles.levelBest}>
                          {progress?.cleared ? progress.bestRank : available ? 'OPEN' : 'LOCKED'}
                        </Text>
                      </Pressable>
                    );
                  })
                : null}
            </GlassPanel>
          );
        })}
      </ScrollView>
      <BackButton onPress={onBack} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: space.sm },
  world: { marginBottom: space.md, padding: space.md, borderRadius: radius.lg },
  locked: { opacity: 0.45 },
  worldName: { color: color.white, fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  meta: { marginTop: space.xxs, color: color.creamFaint, fontSize: 12, fontWeight: '600' },
  signal: { marginTop: space.xxs, marginBottom: space.xs, color: color.cyanBright, fontSize: 11, fontWeight: '700' },
  levelRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: space.xs, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.stroke },
  levelLocked: { opacity: 0.35 },
  levelLabel: { color: color.cream, fontSize: 13, fontWeight: '700' },
  levelBest: { color: color.amberBright, fontSize: 12, fontWeight: '800' },
});
