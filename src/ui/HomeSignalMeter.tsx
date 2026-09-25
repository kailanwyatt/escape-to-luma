import { StyleSheet, Text, View } from 'react-native';

import type { HomeSignalStrength } from '../campaign/types';
import { color, fontUi } from '../design';

const LEVELS: HomeSignalStrength[] = ['faint', 'detectable', 'strong', 'located', 'home'];

const LABELS: Record<HomeSignalStrength, string> = {
  faint: 'FAINT',
  detectable: 'DETECTABLE',
  strong: 'STRONG',
  located: 'LOCATED',
  home: 'HOME',
};

type Props = {
  strength: HomeSignalStrength;
  compact?: boolean;
};

/** Signal strength glyph set — faint arcs → solid home lock. */
export function HomeSignalMeter({ strength, compact = false }: Props) {
  const active = LEVELS.indexOf(strength);
  const bars = LEVELS.map((_, i) => {
    const on = i <= active;
    const height = compact ? 6 + i * 3 : 8 + i * 4;
    return (
      <View
        key={LEVELS[i]}
        style={[
          styles.bar,
          {
            height,
            opacity: on ? 1 : 0.22,
            backgroundColor: on
              ? i === LEVELS.length - 1
                ? color.amberBright
                : color.cyanBright
              : color.cyanDim,
          },
        ]}
      />
    );
  });

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={`Home signal ${LABELS[strength]}`}
      style={[styles.wrap, compact && styles.wrapCompact]}
    >
      <View style={styles.radar}>
        <View style={[styles.ring, styles.ringOuter, active >= 2 && styles.ringLit]} />
        <View style={[styles.ring, styles.ringMid, active >= 1 && styles.ringLit]} />
        <View style={[styles.core, active >= 3 && styles.coreHome]} />
      </View>
      <View style={styles.bars}>{bars}</View>
      {!compact ? <Text style={styles.label}>{LABELS[strength]}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  wrapCompact: {
    gap: 6,
  },
  radar: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(126,240,255,0.22)',
  },
  ringOuter: { width: 26, height: 26 },
  ringMid: { width: 16, height: 16 },
  ringLit: { borderColor: color.cyanBright },
  core: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: color.cyanDim,
  },
  coreHome: {
    backgroundColor: color.amberBright,
    shadowColor: color.amber,
    shadowRadius: 6,
    shadowOpacity: 0.9,
    shadowOffset: { width: 0, height: 0 },
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 28,
  },
  bar: {
    width: 4,
    borderRadius: 2,
  },
  label: {
    fontFamily: fontUi,
    color: color.cyanBright,
    fontSize: 10,
    letterSpacing: 1.8,
    marginLeft: 2,
  },
});
