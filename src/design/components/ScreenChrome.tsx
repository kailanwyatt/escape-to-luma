import {t} from '../../i18n';
import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { color, radius, space } from '../tokens';
import { textStyles } from '../typography';
import { fontDisplay, fontUi } from '../fonts';

export function ScreenTitle({
  title,
  eyebrow,
  meta,
}: {
  title: string;
  eyebrow?: string;
  meta?: string;
}) {
  return (
    <View style={styles.header}>
      {eyebrow ? <Text style={textStyles.kicker}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {meta ? <Text style={styles.meta}>{meta}</Text> : null}
    </View>
  );
}

export function GlassPanel({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={[styles.panel, style]}>{children}</View>;
}

export function BackButton({ onPress, label = t("screenchrome.back") }: { onPress: () => void; label?: string }) {
  return (
    <Pressable accessibilityRole="button" style={styles.back} onPress={onPress}>
      <Text style={styles.backText}>‹ {label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: space.md,
  },
  title: {
    marginTop: space.xs,
    color: color.white,
    fontSize: 26,
    fontFamily: fontDisplay,
    letterSpacing: 3,
    textAlign: 'center',
  },
  meta: {
    marginTop: space.xs,
    color: color.cyanBright,
    fontSize: 13,
    fontFamily: fontUi,
    letterSpacing: 1,
    textAlign: 'center',
  },
  panel: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.panelBorder,
    backgroundColor: color.panel,
    padding: space.md,
  },
  back: {
    alignSelf: 'center',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  backText: {
    color: color.cyanBright,
    fontSize: 13,
    fontFamily: fontUi,
    letterSpacing: 2,
  },
});
