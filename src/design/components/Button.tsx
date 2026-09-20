import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { textStyles } from '../typography';
import { color, radius, space } from '../tokens';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  /** Show ▶ before label (landing CTA). */
  playIcon?: boolean;
};

/** Concept CTA: sunny yellow → amber pill, black label, soft glow. */
const PRIMARY_GRADIENT = ['#FFE566', '#FFB800', '#FF8A00'] as const;

export function Button({
  label,
  onPress,
  variant = 'primary',
  style,
  disabled,
  playIcon,
}: Props) {
  if (variant === 'primary') {
    return (
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.primaryShadow,
          pressed && !disabled ? styles.pressed : null,
          disabled ? styles.disabled : null,
          style,
        ]}
      >
        <LinearGradient
          colors={[...PRIMARY_GRADIENT]}
          locations={[0, 0.45, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.primaryPill}
        >
          <View style={styles.primaryHighlight} />
          <View style={styles.primaryRow}>
            {playIcon ? (
              <View style={styles.playBadge}>
                <Text style={styles.playGlyph}>▶</Text>
              </View>
            ) : null}
            <Text style={styles.primaryLabel}>{label}</Text>
          </View>
        </LinearGradient>
      </Pressable>
    );
  }

  const chrome =
    variant === 'secondary' ? styles.secondary : variant === 'outline' ? styles.outline : styles.ghost;
  const labelStyle = variant === 'ghost' ? textStyles.buttonGhost : textStyles.buttonSecondary;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        chrome,
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      <Text style={labelStyle}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.md,
    paddingHorizontal: space.xl,
    borderRadius: radius.lg,
    minWidth: 200,
  },
  primaryShadow: {
    alignSelf: 'stretch',
    borderRadius: radius.pill,
    // Soft amber glow under the pill (concept floor reflection)
    shadowColor: '#FF9A1A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.65,
    shadowRadius: 18,
    elevation: 12,
  },
  primaryPill: {
    borderRadius: radius.pill,
    paddingVertical: 16,
    paddingHorizontal: space.xl,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  primaryHighlight: {
    position: 'absolute',
    top: 0,
    left: '8%',
    right: '8%',
    height: '42%',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  primaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    zIndex: 1,
  },
  playBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(10,8,7,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playGlyph: {
    color: '#0A0807',
    fontSize: 11,
    fontWeight: '900',
    marginLeft: 2,
  },
  primaryLabel: {
    color: '#0A0807',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 2.2,
  },
  secondary: {
    backgroundColor: 'transparent',
    paddingVertical: space.sm,
  },
  ghost: {
    backgroundColor: 'transparent',
    paddingVertical: space.xs,
    minWidth: 0,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.amberDim,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    minWidth: 0,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.4,
  },
});
