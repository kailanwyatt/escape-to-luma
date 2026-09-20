import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ECONOMY } from '../config/economy';
import { formatCountdown } from '../economy/energy';

type Props = {
  nextEnergyMs: number;
  onWatchAd: () => void;
  onUnlimited24: () => void;
  onUnlimited7: () => void;
  onLater: () => void;
};

export function OutOfEnergyScreen({
  nextEnergyMs,
  onWatchAd,
  onUnlimited24,
  onUnlimited7,
  onLater,
}: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Text style={styles.title}>SPARK NEEDS TO RECHARGE</Text>
      <Text style={styles.next}>NEXT ENERGY</Text>
      <Text style={styles.time}>{formatCountdown(nextEnergyMs)}</Text>
      <Pressable style={styles.primary} onPress={onWatchAd}>
        <Text style={styles.primaryText}>WATCH AD · +{ECONOMY.rewardedAdEnergyAmount} ENERGY</Text>
      </Pressable>
      <Pressable style={styles.secondary} onPress={onUnlimited24}>
        <Text style={styles.secondaryText}>{ECONOMY.mockUnlimitedEnergy24hLabel}</Text>
      </Pressable>
      <Pressable style={styles.secondary} onPress={onUnlimited7}>
        <Text style={styles.secondaryText}>{ECONOMY.mockUnlimitedEnergy7dLabel}</Text>
      </Pressable>
      <Pressable style={styles.later} onPress={onLater}>
        <Text style={styles.laterText}>COME BACK LATER</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10,8,7,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  title: { color: '#ffd24a', fontSize: 22, fontWeight: '900', letterSpacing: 1, textAlign: 'center' },
  next: { marginTop: 28, color: 'rgba(244,239,230,0.55)', fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  time: { marginTop: 6, color: '#7ef0ff', fontSize: 28, fontWeight: '900' },
  primary: { marginTop: 32, backgroundColor: '#d06a32', paddingHorizontal: 22, paddingVertical: 14, borderRadius: 14 },
  primaryText: { color: '#fff8ef', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  secondary: { marginTop: 14, paddingVertical: 10 },
  secondaryText: { color: '#7ef0ff', fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  later: { marginTop: 24, paddingVertical: 10 },
  laterText: { color: 'rgba(244,239,230,0.55)', fontSize: 13, fontWeight: '800', letterSpacing: 2 },
});
