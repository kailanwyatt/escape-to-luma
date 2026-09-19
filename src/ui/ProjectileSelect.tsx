import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PROJECTILE_STYLES } from '../progression/projectiles';
import type { PersistentGameData } from '../persistence/GameSave';

type Props = {
  save: PersistentGameData;
  onSelect: (id: string) => void;
  onBack: () => void;
};

export function ProjectileSelect({ save, onSelect, onBack }: Props) {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>PROJECTILES</Text>
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {PROJECTILE_STYLES.map((style) => {
          const unlocked = save.playerProgress.unlockedProjectileIds.includes(style.id);
          const selected = save.selectedProjectileId === style.id;
          return (
            <Pressable
              key={style.id}
              style={[styles.row, selected && styles.selected]}
              onPress={() => {
                if (unlocked) {
                  onSelect(style.id);
                }
              }}
            >
              <View>
                <Text style={styles.name}>{style.name}</Text>
                <Text style={styles.meta}>
                  {unlocked
                    ? selected
                      ? 'SELECTED'
                      : 'UNLOCKED'
                    : `UNLOCK LEVEL ${style.unlockLevel}`}
                </Text>
              </View>
              <Text style={styles.mark}>{selected ? '✓' : unlocked ? '●' : '○'}</Text>
            </Pressable>
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
  root: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10,8,7,0.94)',
    paddingTop: 72,
    paddingHorizontal: 24,
  },
  title: {
    color: '#ffd24a',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 20,
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
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(244,239,230,0.06)',
  },
  selected: {
    backgroundColor: 'rgba(126,240,255,0.14)',
  },
  name: {
    color: '#f4efe6',
    fontSize: 16,
    fontWeight: '800',
  },
  meta: {
    marginTop: 4,
    color: 'rgba(244,239,230,0.6)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  mark: {
    color: '#7ef0ff',
    fontSize: 18,
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
