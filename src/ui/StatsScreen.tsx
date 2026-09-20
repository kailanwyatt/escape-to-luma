import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { BackButton, GlassPanel, Screen, ScreenTitle, color, space } from '../design';
import { formatScore } from '../target/TargetScoring';
import type { PersistentGameData } from '../persistence/GameSave';

type Props = {
  save: PersistentGameData;
  onBack: () => void;
};

export function StatsScreen({ save, onBack }: Props) {
  const p = save.playerProgress;
  const c = save.campaign.stats;
  const rows: [string, string][] = [
    ['Journey Clears', String(c.levelsCompleted)],
    ['Worlds Cleared', String(c.worldsCompleted)],
    ['Journey Attempts', String(c.totalAttempts)],
    ['Shards Earned', String(c.shardsEarned)],
    ['Runs', String(p.totalRuns)],
    ['Best Score', formatScore(p.highestScore)],
    ['Longest Run', String(p.longestRun)],
    ['Best Streak', String(p.bestStreak)],
    ['Bullseyes', String(p.totalBullseyes)],
    ['Perfects', String(p.totalPerfects)],
    ['Close Calls', String(p.totalCloseCalls)],
    ['Shots Cleared', String(p.totalShotsCleared)],
    ['Workshop Clears', String(save.lifetimeStats.workshopClears)],
    ['Rooftop Clears', String(save.lifetimeStats.rooftopClears)],
    ['Space Clears', String(save.lifetimeStats.spaceClears)],
  ];
  return (
    <Screen scroll={false}>
      <ScreenTitle title="STATS" eyebrow="YOUR JOURNEY" />
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {rows.map(([label, value]) => (
          <GlassPanel key={label} style={styles.row}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value}</Text>
          </GlassPanel>
        ))}
      </ScrollView>
      <BackButton onPress={onBack} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: space.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: space.xs,
    paddingVertical: space.sm,
  },
  label: {
    color: color.creamMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  value: {
    color: color.cyanBright,
    fontSize: 14,
    fontWeight: '800',
  },
});
