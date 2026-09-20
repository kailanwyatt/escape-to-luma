import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../design';

type Props = {
  onRetry: () => void;
  onLater: () => void;
};

export function OutOfEnergyScreen({
  onRetry,
  onLater,
}: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Text style={styles.title}>FREE RETRIES ACTIVE</Text>
      <Text style={styles.next}>NO ENERGY OR PURCHASE REQUIRED</Text>
      <View style={styles.cta}><Button label="RETRY" onPress={onRetry} /></View>
      <Pressable style={styles.later} onPress={onLater}>
        <Text style={styles.laterText}>HOME</Text>
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
  cta: { marginTop: 32, alignSelf: 'stretch' },
  later: { marginTop: 24, paddingVertical: 10 },
  laterText: { color: 'rgba(244,239,230,0.55)', fontSize: 13, fontWeight: '800', letterSpacing: 2 },
});
