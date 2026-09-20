import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ECONOMY } from '../config/economy';
import type { PersistentGameData } from '../persistence/GameSave';

type Props = {
  save: PersistentGameData;
  onBuyBoost: (id: 'guidance' | 'slowField' | 'secondChance') => void;
  onWatchEnergy: () => void;
  onBuyUnlimited: (hours: 24 | 168) => void;
  onBack: () => void;
};

export function ShopScreen({ save, onBuyBoost, onWatchEnergy, onBuyUnlimited, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const campaign = save.campaign;

  return (
    <View style={[styles.root, { paddingTop: Math.max(insets.top, 16) + 8, paddingBottom: insets.bottom }]}>
      <Text style={styles.title}>SHOP</Text>
      <Text style={styles.shards}>◆ {campaign.shards} SHARDS · ⚡ {campaign.currentEnergy}/{ECONOMY.maxEnergy}</Text>
      <ScrollView contentContainerStyle={styles.list}>
        <Text style={styles.section}>ENERGY</Text>
        <Pressable style={styles.row} onPress={onWatchEnergy}>
          <Text style={styles.label}>WATCH AD · +{ECONOMY.rewardedAdEnergyAmount} ENERGY</Text>
          <Text style={styles.meta}>OPTIONAL</Text>
        </Pressable>
        <Pressable style={styles.row} onPress={() => onBuyUnlimited(24)}>
          <Text style={styles.label}>UNLIMITED ENERGY · 24H</Text>
          <Text style={styles.meta}>{ECONOMY.mockUnlimitedEnergy24hLabel}</Text>
        </Pressable>
        <Pressable style={styles.row} onPress={() => onBuyUnlimited(168)}>
          <Text style={styles.label}>UNLIMITED ENERGY · 7D</Text>
          <Text style={styles.meta}>{ECONOMY.mockUnlimitedEnergy7dLabel}</Text>
        </Pressable>

        <Text style={styles.section}>BOOSTS</Text>
        <Pressable style={styles.row} onPress={() => onBuyBoost('guidance')}>
          <Text style={styles.label}>GUIDANCE</Text>
          <Text style={styles.meta}>{ECONOMY.boostCosts.guidance} ◆ · ×{campaign.boostInventory.guidance}</Text>
        </Pressable>
        <Pressable style={styles.row} onPress={() => onBuyBoost('slowField')}>
          <Text style={styles.label}>SLOW FIELD</Text>
          <Text style={styles.meta}>{ECONOMY.boostCosts.slowField} ◆ · ×{campaign.boostInventory.slowField}</Text>
        </Pressable>
        <Pressable style={styles.row} onPress={() => onBuyBoost('secondChance')}>
          <Text style={styles.label}>SECOND CHANCE</Text>
          <Text style={styles.meta}>{ECONOMY.boostCosts.secondChance} ◆ · ×{campaign.boostInventory.secondChance}</Text>
        </Pressable>

        <Text style={styles.section}>PREMIUM</Text>
        <Text style={styles.blurb}>
          Remove Ads lives in Settings. Premium Sparks / shard packs are architected as mocks — no live IAP required for this slice.
        </Text>
        <Text style={styles.blurb}>Priority: Unlimited Energy → Cosmetics → Boosts → Rewarded ads → Remove Ads.</Text>
      </ScrollView>
      <Pressable style={styles.back} onPress={onBack}>
        <Text style={styles.backText}>BACK</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(10,8,7,0.96)', paddingHorizontal: 18 },
  title: { color: '#ffd24a', fontSize: 26, fontWeight: '900', letterSpacing: 3, textAlign: 'center' },
  shards: { marginTop: 6, marginBottom: 12, color: '#7ef0ff', fontSize: 13, fontWeight: '800', textAlign: 'center' },
  list: { paddingBottom: 20 },
  section: { marginTop: 18, marginBottom: 8, color: '#7ef0ff', fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(244,239,230,0.12)' },
  label: { color: '#f4efe6', fontSize: 13, fontWeight: '800', flex: 1, paddingRight: 8 },
  meta: { color: 'rgba(244,239,230,0.55)', fontSize: 11, fontWeight: '700' },
  blurb: { color: 'rgba(244,239,230,0.5)', fontSize: 12, fontWeight: '600', lineHeight: 17, marginBottom: 8 },
  back: { alignSelf: 'center', paddingVertical: 14 },
  backText: { color: '#7ef0ff', fontSize: 14, fontWeight: '800', letterSpacing: 2 },
});
