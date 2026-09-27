import { StyleSheet, Text, View } from 'react-native';

import type { ShotResultKind } from '../game/GameState';
import { color, fontDisplay } from '../design';

type Props = {
  text: string | null;
  kind: ShotResultKind | null;
};

export function ResultFeedback({ text, kind }: Props) {
  if (!text) {
    return null;
  }

  const accent =
    kind === 'PERFECT'
      ? color.amberBright
      : kind === 'BULLSEYE'
        ? color.cyanBright
        : kind === 'GREAT'
          ? color.success
          : color.cream;

  return (
    <View style={styles.wrap}>
      <View style={[styles.stamp, kind === 'PERFECT' && styles.stampPerfect]}>
        <View style={[styles.burst, { borderColor: accent }]} />
        <View style={[styles.burstInner, { borderColor: accent }]} />
        <Text
          style={[
            styles.text,
            { color: accent, fontFamily: fontDisplay },
            kind === 'GREAT' && styles.great,
            kind === 'PERFECT' && styles.perfect,
            kind === 'BULLSEYE' && styles.bullseye,
          ]}
        >
          {text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  stamp: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 18,
    minWidth: 180,
  },
  stampPerfect: {
    transform: [{ rotate: '-4deg' }],
  },
  burst: {
    ...StyleSheet.absoluteFill,
    borderRadius: 16,
    borderWidth: 2,
    opacity: 0.55,
  },
  burstInner: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    bottom: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    opacity: 0.4,
  },
  text: {
    color: color.cream,
    fontSize: 34,
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  bullseye: {
    fontSize: 34,
  },
  great: {
    fontSize: 32,
  },
  perfect: {
    fontSize: 40,
  },
});
