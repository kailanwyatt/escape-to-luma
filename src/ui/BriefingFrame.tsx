import type { PropsWithChildren, ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { color, fontDisplay, fontUi, radius, space } from '../design';

type Props = PropsWithChildren<{
  eyebrow?: string;
  title?: string;
  meta?: ReactNode;
  style?: StyleProp<ViewStyle>;
  accent?: 'cyan' | 'amber' | 'success';
}>;

/** Pre-throw / celebration briefing frame — Jump Gate briefing chrome. */
export function BriefingFrame({
  eyebrow,
  title,
  meta,
  children,
  style,
  accent = 'cyan',
}: Props) {
  const accentColor =
    accent === 'amber' ? color.amberBright : accent === 'success' ? color.success : color.cyanBright;
  return (
    <View style={[styles.shell, style]}>
      <LinearGradient
        colors={['rgba(8,28,48,0.96)', 'rgba(5,16,30,0.92)', 'rgba(6,22,40,0.94)']}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.corner, styles.tl, { borderColor: accentColor }]} />
      <View style={[styles.corner, styles.tr, { borderColor: accentColor }]} />
      <View style={[styles.corner, styles.bl, { borderColor: accentColor }]} />
      <View style={[styles.corner, styles.br, { borderColor: accentColor }]} />
      <View style={[styles.lip, { backgroundColor: accentColor }]} />
      {eyebrow ? <Text style={[styles.eyebrow, { color: accentColor }]}>{eyebrow}</Text> : null}
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {meta ? <View style={styles.meta}>{typeof meta === 'string' ? <Text style={styles.metaText}>{meta}</Text> : meta}</View> : null}
      {children}
    </View>
  );
}

/** World-complete / Spark unlock stamp overlay. */
export function UnlockStamp({ label }: { label: string }) {
  return (
    <View style={styles.stamp}>
      <View style={styles.stampRing} />
      <Text style={styles.stampText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,200,255,0.4)',
    overflow: 'hidden',
    padding: space.md,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderWidth: 2,
  },
  tl: { top: 6, left: 6, borderRightWidth: 0, borderBottomWidth: 0 },
  tr: { top: 6, right: 6, borderLeftWidth: 0, borderBottomWidth: 0 },
  bl: { bottom: 6, left: 6, borderRightWidth: 0, borderTopWidth: 0 },
  br: { bottom: 6, right: 6, borderLeftWidth: 0, borderTopWidth: 0 },
  lip: {
    position: 'absolute',
    top: 0,
    left: '18%',
    right: '18%',
    height: 2,
    opacity: 0.85,
  },
  eyebrow: {
    fontFamily: fontUi,
    fontSize: 11,
    letterSpacing: 2.4,
    textAlign: 'center',
    marginBottom: 4,
  },
  title: {
    fontFamily: fontDisplay,
    color: color.cream,
    fontSize: 20,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 6,
  },
  meta: {
    alignItems: 'center',
    marginBottom: space.sm,
  },
  metaText: {
    fontFamily: fontUi,
    color: color.creamMuted,
    fontSize: 13,
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  stamp: {
    alignSelf: 'center',
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  stampRing: {
    ...StyleSheet.absoluteFill,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: color.amberBright,
    borderStyle: 'dashed',
    opacity: 0.85,
    transform: [{ rotate: '-12deg' }],
  },
  stampText: {
    fontFamily: fontDisplay,
    color: color.amberBright,
    fontSize: 14,
    letterSpacing: 2,
    textAlign: 'center',
    transform: [{ rotate: '-12deg' }],
  },
});
