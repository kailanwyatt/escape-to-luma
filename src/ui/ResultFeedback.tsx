import { StyleSheet, Text, View } from 'react-native';

import type { ShotResultKind } from '../game/GameState';
import { color } from '../design';

type Props = {
  text: string | null;
  kind: ShotResultKind | null;
};

export function ResultFeedback({ text, kind }: Props) {
  if (!text) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <Text
        style={[
          styles.text,
          kind === 'GREAT' && styles.great,
          kind === 'PERFECT' && styles.perfect,
          kind === 'BULLSEYE' && styles.bullseye,
        ]}
      >
        {text}
      </Text>
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
  text: {
    color: color.cream,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  bullseye: {
    color: color.cyanBright,
  },
  great: {
    color: color.success,
    fontSize: 32,
  },
  perfect: {
    color: color.amberBright,
    fontSize: 40,
  },
});
