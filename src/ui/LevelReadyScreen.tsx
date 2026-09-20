import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ECONOMY, type BoostId } from '../config/economy';
import { getCampaignLevel } from '../campaign/levels';
import type { SelectedBoosts } from '../campaign/types';
import type { PersistentGameData } from '../persistence/GameSave';
import { worldForLevel } from '../campaign/worlds';

type Props = {
  save: PersistentGameData;
  levelNumber: number;
  onPlay: (boosts: SelectedBoosts) => void;
  onBack: () => void;
};

const BOOSTS: { id: BoostId; label: string; costKey: keyof typeof ECONOMY.boostCosts }[] = [
  { id: 'guidance', label: 'GUIDANCE', costKey: 'guidance' },
  { id: 'slowField', label: 'SLOW FIELD', costKey: 'slowField' },
  { id: 'secondChance', label: 'SECOND CHANCE', costKey: 'secondChance' },
];

export function LevelReadyScreen({ save, levelNumber, onPlay, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<SelectedBoosts>({});
  const def = getCampaignLevel(levelNumber);
  const world = worldForLevel(levelNumber);
  const progress = def ? save.campaign.completedLevels[def.id] : undefined;
  const inv = save.campaign.boostInventory;

  return (
    <View style={[styles.root, { paddingTop: Math.max(insets.top, 24) + 20, paddingBottom: insets.bottom }]}>
      <Text style={styles.kicker}>{world?.name ?? 'JOURNEY'}</Text>
      <Text style={styles.title}>LEVEL {levelNumber}</Text>
      {def?.storyBeat ? <Text style={styles.beat}>{def.storyBeat}</Text> : null}
      <Text style={styles.best}>BEST · {progress?.cleared ? progress.bestRank : '—'}</Text>
      {def?.windX ? <Text style={styles.wind}>WIND ACTIVE</Text> : null}

      <Text style={styles.section}>BOOSTS</Text>
      {BOOSTS.map((boost) => {
        const owned = inv[boost.id] ?? 0;
        const on = Boolean(selected[boost.id]);
        return (
          <Pressable
            key={boost.id}
            style={[styles.boost, on && styles.boostOn]}
            onPress={() => {
              if (owned <= 0) {
                return;
              }
              setSelected((current) => ({ ...current, [boost.id]: !current[boost.id] }));
            }}
          >
            <Text style={styles.boostLabel}>
              {on ? '[x] ' : '[ ] '}
              {boost.label}
            </Text>
            <Text style={styles.boostMeta}>
              {owned > 0 ? `×${owned}` : `${ECONOMY.boostCosts[boost.costKey]} SHARDS`}
            </Text>
          </Pressable>
        );
      })}

      <Pressable style={styles.play} onPress={() => onPlay(selected)}>
        <Text style={styles.playText}>PLAY</Text>
      </Pressable>
      <Pressable style={styles.back} onPress={onBack}>
        <Text style={styles.backText}>BACK</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(10,8,7,0.96)', paddingHorizontal: 28, alignItems: 'center' },
  kicker: { color: 'rgba(244,239,230,0.5)', fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  title: { marginTop: 8, color: '#ffd24a', fontSize: 32, fontWeight: '900', letterSpacing: 2 },
  beat: { marginTop: 12, color: 'rgba(244,239,230,0.75)', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  best: { marginTop: 16, color: '#7ef0ff', fontSize: 14, fontWeight: '800' },
  wind: { marginTop: 8, color: '#ffd24a', fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  section: { marginTop: 28, alignSelf: 'stretch', color: '#7ef0ff', fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  boost: { marginTop: 10, alignSelf: 'stretch', flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10, backgroundColor: 'rgba(244,239,230,0.06)' },
  boostOn: { backgroundColor: 'rgba(126,240,255,0.14)' },
  boostLabel: { color: '#f4efe6', fontSize: 13, fontWeight: '800' },
  boostMeta: { color: 'rgba(244,239,230,0.55)', fontSize: 12, fontWeight: '700' },
  play: { marginTop: 32, backgroundColor: '#d06a32', paddingHorizontal: 40, paddingVertical: 14, borderRadius: 14 },
  playText: { color: '#fff8ef', fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  back: { marginTop: 16, paddingVertical: 10 },
  backText: { color: '#7ef0ff', fontSize: 14, fontWeight: '800', letterSpacing: 2 },
});
