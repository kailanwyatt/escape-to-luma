import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatScore } from '../target/TargetScoring';

type Props = {
  title?: string;
  level: number;
  xpInto: number;
  xpNext: number;
  bestScore: number;
  onPlay: () => void;
  onProjectiles: () => void;
  onStats: () => void;
  onSettings: () => void;
  onGraphics: () => void;
};

export function HomeScreen({
  title = 'APERTURE',
  level,
  xpInto,
  xpNext,
  bestScore,
  onPlay,
  onProjectiles,
  onStats,
  onSettings,
  onGraphics,
}: Props) {
  const insets = useSafeAreaInsets();
  const ratio = xpNext <= 0 ? 1 : Math.min(1, xpInto / xpNext);
  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Text style={styles.kicker}>PROTOTYPE ART</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.level}>LEVEL {level}</Text>
      <Text style={styles.xp}>
        {xpNext <= 0 ? 'MAX' : `${xpInto} / ${xpNext} XP`}
      </Text>
      <View style={styles.bar}>
        <View style={[styles.fill, { width: `${Math.round(ratio * 100)}%` }]} />
      </View>
      <Pressable style={styles.play} onPress={onPlay}>
        <Text style={styles.playText}>PLAY</Text>
      </Pressable>
      <Pressable style={styles.secondary} onPress={onProjectiles}>
        <Text style={styles.secondaryText}>PROJECTILES</Text>
      </Pressable>
      <Pressable style={styles.secondary} onPress={onStats}>
        <Text style={styles.secondaryText}>STATS</Text>
      </Pressable>
      <Pressable style={styles.secondary} onPress={onSettings}>
        <Text style={styles.secondaryText}>SETTINGS</Text>
      </Pressable>
      <Pressable style={styles.graphics} onPress={onGraphics}>
        <Text style={styles.graphicsText}>GRAPHICS NEEDS</Text>
      </Pressable>
      <Text style={styles.best}>BEST {formatScore(bestScore)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10,8,7,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    color: '#ffd24a',
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 8,
    marginBottom: 28,
  },
  kicker: {
    color: 'rgba(244,239,230,0.45)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 3,
    marginBottom: 8,
  },
  level: {
    color: '#f4efe6',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
  },
  xp: {
    marginTop: 8,
    color: 'rgba(244,239,230,0.7)',
    fontSize: 13,
    fontWeight: '700',
  },
  bar: {
    marginTop: 10,
    width: 220,
    height: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(244,239,230,0.15)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#7ef0ff',
  },
  play: {
    marginTop: 36,
    backgroundColor: '#d06a32',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 16,
  },
  playText: {
    color: '#fff8ef',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 3,
  },
  secondary: {
    marginTop: 14,
    paddingVertical: 10,
  },
  secondaryText: {
    color: '#7ef0ff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
  },
  graphics: {
    marginTop: 22,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,210,74,0.45)',
    borderRadius: 12,
  },
  graphicsText: {
    color: '#ffd24a',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
  },
  best: {
    marginTop: 28,
    color: 'rgba(244,239,230,0.65)',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
