import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OPENING_BEATS } from '../scene/OpeningSequence';
export function CampaignOpening({stage, onSkip, onPause}: {stage: number; onSkip: () => void; onPause: () => void}) {
  const insets = useSafeAreaInsets();
  const beat = OPENING_BEATS[Math.max(0, Math.min(OPENING_BEATS.length - 1, stage))];
  return <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
    <Pressable accessibilityRole="button" accessibilityLabel="Pause opening" onPress={onPause} style={[styles.pause, {top: insets.top + 12}]}><Text style={styles.label}>PAUSE</Text></Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel="Skip opening" onPress={onSkip} style={[styles.skip, {top: insets.top + 12}]}><Text style={styles.label}>SKIP</Text></Pressable>
    <View pointerEvents="none" style={[styles.copy, {bottom: insets.bottom + 24}]}>
      <Text style={styles.label}>{beat.title}</Text>
      <Text style={styles.caption}>{beat.caption}</Text>
      <View style={styles.progress}>{OPENING_BEATS.map((_, i) => <View key={i} style={[styles.dot, {opacity: i <= stage ? 1 : .2}]} />)}</View>
    </View>
  </View>;
}
const styles = StyleSheet.create({
  pause: {position: 'absolute', left: 20, padding: 16, borderRadius: 12, backgroundColor: '#071018dd'},
  skip: {position: 'absolute', right: 20, padding: 16, borderRadius: 12, backgroundColor: '#071018dd'},
  label: {color: '#8fefff', fontWeight: '800', fontSize: 12, letterSpacing: 2},
  copy: {position: 'absolute', left: 20, right: 20, padding: 20, borderRadius: 16, backgroundColor: '#071018dd'},
  caption: {color: '#ecf3f5', fontSize: 15, lineHeight: 23, marginTop: 12},
  progress: {flexDirection: 'row', gap: 8, marginTop: 16},
  dot: {flex: 1, height: 2, backgroundColor: '#8fefff'},
});
