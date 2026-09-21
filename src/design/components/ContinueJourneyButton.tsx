import {t} from '../../i18n';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type Props = {
  onPress: () => void;
  label?: string;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  playIcon?: boolean;
};

/**
 * Landing primary CTA — Escape to Luma concept.
 * Gradient / radius / play triangle / glow match the render;
 * type uses app system font (not AI lettering).
 */
export function ContinueJourneyButton({
  onPress,
  label = t("storymoments.continue_journey"),
  style,
  disabled = false,
  playIcon = true,
}: Props) {
  const { width } = useWindowDimensions();
  const labelSize = width < 360 ? 16 : 20;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.wrapper,
        style,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <LinearGradient
        colors={['#FFE05B', '#FFC83D', '#F5A623']}
        locations={[0, 0.5, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.button}
      >
        {playIcon ? <View style={styles.playIcon} /> : null}
        <Text style={[styles.label, { fontSize: labelSize }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
          {label}
        </Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    maxWidth: 640,
    borderRadius: 23,
    shadowColor: '#FFB72B',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.38,
    shadowRadius: 15,
    elevation: 10,
  },
  button: {
    minHeight: 68,
    paddingVertical: 20,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 232, 125, 0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    gap: 14,
    overflow: 'hidden',
  },
  playIcon: {
    width: 0,
    height: 0,
    borderTopWidth: 10,
    borderBottomWidth: 10,
    borderLeftWidth: 16,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#15120B',
    marginLeft: 2,
  },
  label: {
    color: '#15120B',
    flexShrink: 1,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  pressed: {
    transform: [{ scale: 0.975 }],
    opacity: 0.94,
  },
  disabled: {
    opacity: 0.42,
  },
});
