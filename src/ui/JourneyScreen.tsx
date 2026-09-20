import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { journeyDestinationLabel, WORLDS } from '../campaign/worlds';
import { getCampaignLevel } from '../campaign/levels';
import type { PersistentGameData } from '../persistence/GameSave';

type Props = {
  save: PersistentGameData;
  onSelectLevel: (levelNumber: number) => void;
  onBack: () => void;
};

export function JourneyScreen({ save, onSelectLevel, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const campaign = save.campaign;
  const destination = journeyDestinationLabel(campaign.unlockedWorldIds, campaign.campaignCompleted);
  const cleared = Object.values(campaign.completedLevels).filter((entry) => entry.cleared).length;

  return (
    <View style={[styles.root, { paddingTop: Math.max(insets.top, 16) + 8, paddingBottom: insets.bottom }]}>
      <Text style={styles.title}>JOURNEY HOME</Text>
      <Text style={styles.progress}>{cleared} / 150</Text>
      <Text style={styles.dest}>DESTINATION · {destination}</Text>
      <ScrollView contentContainerStyle={styles.list}>
        {WORLDS.map((world) => {
          const unlocked = campaign.unlockedWorldIds.includes(world.id);
          return (
            <View key={world.id} style={[styles.world, !unlocked && styles.locked]}>
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
            </View>
          );
        })}
      </ScrollView>
      <Pressable style={styles.back} onPress={onBack}>
        <Text style={styles.backText}>BACK</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(10,8,7,0.96)', paddingHorizontal: 18 },
  title: { color: '#ffd24a', fontSize: 24, fontWeight: '900', letterSpacing: 3, textAlign: 'center' },
  progress: { marginTop: 6, color: '#7ef0ff', fontSize: 18, fontWeight: '900', textAlign: 'center' },
  dest: { marginTop: 4, marginBottom: 12, color: 'rgba(244,239,230,0.55)', fontSize: 12, fontWeight: '700', textAlign: 'center', letterSpacing: 1 },
  list: { paddingBottom: 20 },
  world: { marginBottom: 16, padding: 12, borderRadius: 12, backgroundColor: 'rgba(244,239,230,0.06)' },
  locked: { opacity: 0.45 },
  worldName: { color: '#f4efe6', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  meta: { marginTop: 4, color: 'rgba(244,239,230,0.55)', fontSize: 12, fontWeight: '600' },
  signal: { marginTop: 4, marginBottom: 8, color: '#7ef0ff', fontSize: 11, fontWeight: '700' },
  levelRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(244,239,230,0.1)' },
  levelLocked: { opacity: 0.35 },
  levelLabel: { color: '#f4efe6', fontSize: 13, fontWeight: '700' },
  levelBest: { color: '#ffd24a', fontSize: 12, fontWeight: '800' },
  back: { alignSelf: 'center', paddingVertical: 14 },
  backText: { color: '#7ef0ff', fontSize: 14, fontWeight: '800', letterSpacing: 2 },
});
