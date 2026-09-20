import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ECONOMY } from '../config/economy';
import { RELEASE_POLICY } from '../config/release';
import { BackButton, Screen, ScreenTitle, color, space } from '../design';
import type { PersistentGameData } from '../persistence/GameSave';

type Props = {
  save: PersistentGameData;
  onBuyBoost: (id: 'guidance' | 'slowField' | 'secondChance') => void;
  onWatchEnergy: () => void;
  onBuyUnlimited: (hours: 24 | 168) => void;
  onBack: () => void;
};

export function ShopScreen({ save, onBuyBoost, onWatchEnergy, onBuyUnlimited, onBack }: Props) {
  const campaign = save.campaign;

  return (
    <Screen scroll={false}>
      <ScreenTitle title="WORKSHOP" meta={`◆ ${campaign.shards} SHARDS · ⚡ ${campaign.currentEnergy}/${ECONOMY.maxEnergy}`} />
      <ScrollView contentContainerStyle={styles.list}>
        {RELEASE_POLICY.adsEnabled || RELEASE_POLICY.purchasesEnabled ? (
          <>
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
          </>
        ) : null}

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

        <Text style={styles.section}>TESTFLIGHT</Text>
        <Text style={styles.blurb}>No ads or purchases. Everything here is earned through play.</Text>
      </ScrollView>
      <BackButton onPress={onBack} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: space.lg },
  section: { marginTop: space.lg, marginBottom: space.xs, color: color.cyanBright, fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: space.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: color.stroke },
  label: { color: color.cream, fontSize: 13, fontWeight: '800', flex: 1, paddingRight: space.xs },
  meta: { color: color.creamFaint, fontSize: 11, fontWeight: '700' },
  blurb: { color: color.creamFaint, fontSize: 12, fontWeight: '600', lineHeight: 17, marginBottom: space.xs },
});
