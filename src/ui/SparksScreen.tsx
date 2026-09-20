import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ECONOMY } from '../config/economy';
import { SPARK_CATALOG } from '../customization/sparks';
import { BackButton, GlassPanel, Screen, ScreenTitle, color, radius, space } from '../design';
import type { PersistentGameData } from '../persistence/GameSave';

type Props = {
  save: PersistentGameData;
  onEquip: (sparkId: string) => void;
  onBuy: (sparkId: string) => void;
  onBack: () => void;
};

export function SparksScreen({ save, onEquip, onBuy, onBack }: Props) {
  const campaign = save.campaign;

  return (
    <Screen scroll={false}>
      <ScreenTitle title="SPARKS" meta={`◆ ${campaign.shards} SHARDS`} />
      <ScrollView contentContainerStyle={styles.list}>
        {SPARK_CATALOG.map((spark) => {
          const owned = campaign.ownedSparkIds.includes(spark.id);
          const selected = campaign.equippedSparkId === spark.id;
          return (
            <GlassPanel key={spark.id} style={[styles.row, selected && styles.selected]}>
              <View style={styles.portrait}>
                <View style={[styles.swatch, { backgroundColor: `#${spark.color.toString(16).padStart(6, '0')}` }]} />
                <View style={[styles.orbit, { borderColor: `#${spark.trailColor.toString(16).padStart(6, '0')}` }]} />
              </View>
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
            </GlassPanel>
          );
        })}
      </ScrollView>
      <Text style={styles.note}>Physics identical for all Sparks. ◆ costs from economy config.</Text>
      <BackButton onPress={onBack} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: space.md },
  row: { flexDirection: 'row', alignItems: 'center', padding: space.sm, borderRadius: radius.lg, marginBottom: space.xs },
  selected: { backgroundColor: color.cyanGlow, borderColor: color.cyanBright },
  portrait: { width: 46, height: 46, marginRight: space.sm, alignItems: 'center', justifyContent: 'center' },
  swatch: { width: 24, height: 24, borderRadius: 14, shadowColor: color.cyan, shadowOpacity: 1, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } },
  orbit: { position: 'absolute', width: 42, height: 25, borderRadius: 24, borderWidth: 1, transform: [{ rotate: '-20deg' }] },
  info: { flex: 1 },
  name: { color: color.white, fontSize: 14, fontWeight: '800' },
  meta: { marginTop: 2, color: color.creamFaint, fontSize: 11, fontWeight: '700' },
  action: { color: color.cyanBright, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  locked: { color: color.creamFaint, fontSize: 11, fontWeight: '800' },
  note: { color: color.creamFaint, fontSize: 11, textAlign: 'center', marginBottom: space.xxs },
});
