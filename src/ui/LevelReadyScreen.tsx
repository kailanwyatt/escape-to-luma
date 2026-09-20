import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ECONOMY, type BoostId } from '../config/economy';
import { getCampaignLevel } from '../campaign/levels';
import type { SelectedBoosts } from '../campaign/types';
import { BackButton, Button, GlassPanel, Screen, ScreenTitle, color, radius, space } from '../design';
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
  const [selected, setSelected] = useState<SelectedBoosts>({});
  const def = getCampaignLevel(levelNumber);
  const world = worldForLevel(levelNumber);
  const progress = def ? save.campaign.completedLevels[def.id] : undefined;
  const inv = save.campaign.boostInventory;
  const showBoosts = levelNumber > 5;

  return (
    <Screen scroll={false}>
      <ScreenTitle eyebrow={world?.name ?? 'JOURNEY'} title={`LEVEL ${levelNumber}`} />
      {def?.storyBeat ? <Text style={styles.beat}>{def.storyBeat}</Text> : null}
      <Text style={styles.best}>BEST · {progress?.cleared ? progress.bestRank : '—'}</Text>
      {def?.windX ? <Text style={styles.wind}>WIND ACTIVE</Text> : null}

      {showBoosts ? (
        <>
          <Text style={styles.section}>BOOSTS</Text>
          {BOOSTS.map((boost) => {
            const owned = inv[boost.id] ?? 0;
            const on = Boolean(selected[boost.id]);
            return (
              <GlassPanel
                key={boost.id}
                style={[styles.boost, on && styles.boostOn]}
              >
                <Pressable
                  style={styles.boostPress}
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
              </GlassPanel>
            );
          })}
        </>
      ) : (
        <Text style={styles.teaching}>NO BOOSTS · LEARN THE THROW</Text>
      )}

      <View style={styles.play}><Button label="PLAY" playIcon onPress={() => onPlay(selected)} /></View>
      <BackButton onPress={onBack} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  beat: { marginTop: space.sm, color: color.creamMuted, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  best: { marginTop: space.md, color: color.cyanBright, fontSize: 14, fontWeight: '800', textAlign: 'center' },
  wind: { marginTop: space.xs, color: color.amberBright, fontSize: 12, fontWeight: '800', letterSpacing: 2, textAlign: 'center' },
  teaching: { marginTop: space.xl, color: color.cyanDim, fontSize: 11, fontWeight: '800', letterSpacing: 1.5, textAlign: 'center' },
  section: { marginTop: space.xl, color: color.cyanBright, fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  boost: { marginTop: space.xs, padding: 0, borderRadius: radius.md },
  boostPress: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: space.sm, paddingHorizontal: space.sm },
  boostOn: { backgroundColor: color.cyanGlow, borderColor: color.cyanBright },
  boostLabel: { color: color.cream, fontSize: 13, fontWeight: '800' },
  boostMeta: { color: color.creamFaint, fontSize: 12, fontWeight: '700' },
  play: { marginTop: space.xl },
});
