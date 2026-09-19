import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { formatScore } from '../target/TargetScoring';
import type { PersistentGameData } from '../persistence/GameSave';

type Props = {
  save: PersistentGameData;
  onBack: () => void;
};

export function StatsScreen({ save, onBack }: Props) {
  const p = save.playerProgress;
  const rows: [string, string][] = [
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
    <View style={styles.root}>
      <Text style={styles.title}>STATS</Text>
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {rows.map(([label, value]) => (
          <View key={label} style={styles.row}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value}</Text>
          </View>
        ))}
      </ScrollView>
      <Pressable style={styles.back} onPress={onBack}>
        <Text style={styles.backText}>BACK</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10,8,7,0.94)',
    paddingTop: 72,
    paddingHorizontal: 28,
  },
  title: {
    color: '#ffd24a',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 24,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    color: 'rgba(244,239,230,0.7)',
    fontSize: 16,
    fontWeight: '600',
  },
  value: {
    color: '#f4efe6',
    fontSize: 16,
    fontWeight: '800',
  },
  back: {
    alignSelf: 'center',
    marginBottom: 36,
    paddingVertical: 12,
  },
  backText: {
    color: '#7ef0ff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
  },
});
