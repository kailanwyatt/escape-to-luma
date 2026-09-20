import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { textStyles } from '../typography';
import { color, radius, space } from '../tokens';
import { ContinueJourneyButton } from './ContinueJourneyButton';

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
      <ContinueJourneyButton
        label={label}
        onPress={onPress}
        disabled={disabled}
        playIcon={playIcon ?? false}
        style={style}
      />
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
