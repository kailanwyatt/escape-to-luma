import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ContainmentScene } from '../design/components/ContainmentScene';
import { color, radius, space, textStyles } from '../design';

const BEATS = [
  { eyebrow: 'SPARK', title: 'A LIGHT WAKES', body: 'Far from home. Held beneath the city.' },
  { eyebrow: 'SPECIMEN S-01', title: 'CONTAINMENT', body: 'Observed. Measured. Kept behind glass.' },
  { eyebrow: 'SIGNAL DETECTED', title: 'LUMA', body: 'A distant pulse answers from beyond Earth.' },
  { eyebrow: 'SYSTEM FAILURE', title: 'THE BREACH', body: 'Locks fail. Security closes in.' },
  { eyebrow: 'YOUR TURN', title: 'GUIDE SPARK HOME', body: 'Drag to aim. Pull for power. Release.' },
] as const;

type Props = {
  stage: number;
  onSkip: () => void;
};

export function CampaignOpening({ stage, onSkip }: Props) {
  const beat = BEATS[Math.max(0, Math.min(BEATS.length - 1, stage))];
  return (
    <View style={styles.root}>
      <View style={styles.scene}>
        <ContainmentScene />
      </View>
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>{beat.eyebrow}</Text>
        <Text style={styles.title}>{beat.title}</Text>
        <Text style={styles.body}>{beat.body}</Text>
        <View style={styles.progress}>
          {BEATS.map((_, index) => (
            <View key={index} style={[styles.dot, index <= stage && styles.dotActive]} />
          ))}
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Skip opening story"
        style={styles.skip}
        onPress={onSkip}
      >
        <Text style={textStyles.caption}>SKIP</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    backgroundColor: color.ink,
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  scene: {
    height: 300,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: color.panelBorder,
    backgroundColor: color.inkSoft,
  },
  copy: {
    marginTop: space.lg,
    alignItems: 'center',
  },
  eyebrow: {
    color: color.cyan,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 3,
  },
  title: {
    marginTop: space.sm,
    color: color.white,
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
  },
  body: {
    marginTop: space.sm,
    maxWidth: 320,
    color: color.creamMuted,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 21,
    textAlign: 'center',
  },
  progress: {
    marginTop: space.lg,
    flexDirection: 'row',
    gap: space.xs,
  },
  dot: {
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: color.panelBorder,
  },
  dotActive: {
    backgroundColor: color.cyan,
  },
  skip: {
    position: 'absolute',
    top: 54,
    right: 24,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
