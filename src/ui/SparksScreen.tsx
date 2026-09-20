import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ECONOMY } from '../config/economy';
import { SPARK_CATALOG } from '../customization/sparks';
import type { PersistentGameData } from '../persistence/GameSave';

type Props = {
  save: PersistentGameData;
  onEquip: (sparkId: string) => void;
  onBuy: (sparkId: string) => void;
  onBack: () => void;
};

export function SparksScreen({ save, onEquip, onBuy, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const campaign = save.campaign;

  return (
    <View style={[styles.root, { paddingTop: Math.max(insets.top, 16) + 8, paddingBottom: insets.bottom }]}>
      <Text style={styles.title}>SPARKS</Text>
      <Text style={styles.shards}>◆ {campaign.shards} SHARDS</Text>
      <ScrollView contentContainerStyle={styles.list}>
        {SPARK_CATALOG.map((spark) => {
          const owned = campaign.ownedSparkIds.includes(spark.id);
          const selected = campaign.equippedSparkId === spark.id;
          return (
            <View key={spark.id} style={[styles.row, selected && styles.selected]}>
              <View style={[styles.swatch, { backgroundColor: `#${spark.color.toString(16).padStart(6, '0')}` }]} />
              <View style={styles.info}>
                <Text style={styles.name}>{spark.name.toUpperCase()}</Text>
                <Text style={styles.meta}>
                  {owned
                    ? selected
                      ? 'EQUIPPED'
                      : 'OWNED'
                    : spark.acquisition === 'shards'
                      ? `${spark.shardCost} SHARDS`
                      : spark.acquisition === 'premium'
                        ? 'PREMIUM'
                        : spark.acquisition === 'world_completion'
                          ? 'WORLD REWARD'
                          : spark.acquisition.toUpperCase()}
                </Text>
              </View>
              {owned ? (
                <Pressable onPress={() => onEquip(spark.id)}>
                  <Text style={styles.action}>{selected ? '✓' : 'EQUIP'}</Text>
                </Pressable>
              ) : spark.acquisition === 'shards' ? (
                <Pressable onPress={() => onBuy(spark.id)}>
                  <Text style={styles.action}>BUY</Text>
                </Pressable>
              ) : (
                <Text style={styles.locked}>LOCK</Text>
              )}
            </View>
          );
        })}
      </ScrollView>
      <Text style={styles.note}>Physics identical for all Sparks. ◆ costs from economy config.</Text>
      <Pressable style={styles.back} onPress={onBack}>
        <Text style={styles.backText}>BACK</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(10,8,7,0.96)', paddingHorizontal: 18 },
  title: { color: '#ffd24a', fontSize: 26, fontWeight: '900', letterSpacing: 3, textAlign: 'center' },
  shards: { marginTop: 6, marginBottom: 12, color: '#7ef0ff', fontSize: 14, fontWeight: '800', textAlign: 'center' },
  list: { paddingBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 8, backgroundColor: 'rgba(244,239,230,0.06)' },
  selected: { backgroundColor: 'rgba(126,240,255,0.14)' },
  swatch: { width: 28, height: 28, borderRadius: 14, marginRight: 12 },
  info: { flex: 1 },
  name: { color: '#f4efe6', fontSize: 14, fontWeight: '800' },
  meta: { marginTop: 2, color: 'rgba(244,239,230,0.55)', fontSize: 11, fontWeight: '700' },
  action: { color: '#7ef0ff', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  locked: { color: 'rgba(244,239,230,0.35)', fontSize: 11, fontWeight: '800' },
  note: { color: 'rgba(244,239,230,0.4)', fontSize: 11, textAlign: 'center', marginBottom: 4 },
  back: { alignSelf: 'center', paddingVertical: 14 },
  backText: { color: '#7ef0ff', fontSize: 14, fontWeight: '800', letterSpacing: 2 },
});
