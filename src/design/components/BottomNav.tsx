import { Pressable, StyleSheet, Text, View } from 'react-native';

import { textStyles } from '../typography';
import { color, radius, space } from '../tokens';

export type NavItem = {
  id: string;
  label: string;
  subtitle: string;
  glyph: string;
  onPress: () => void;
};

type Props = {
  items: NavItem[];
};

/** Four-up bottom navigation tiles. */
export function BottomNav({ items }: Props) {
  return (
    <View style={styles.row}>
      {items.map((item) => (
        <Pressable
          key={item.id}
          accessibilityRole="button"
          onPress={item.onPress}
          style={({ pressed }) => [styles.tile, pressed ? styles.pressed : null]}
        >
          <Text style={styles.glyph}>{item.glyph}</Text>
          <Text style={[textStyles.labelCyan, styles.label]}>{item.label}</Text>
          <Text style={styles.subtitle}>{item.subtitle}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: space.xs,
  },
  tile: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: color.panel,
    borderColor: color.panelBorder,
    borderWidth: 1,
    borderRadius: radius.md,
    minHeight: 92,
    justifyContent: 'center',
    paddingVertical: space.sm,
    paddingHorizontal: 2,
    gap: 2,
  },
  glyph: {
    color: color.cyanBright,
    fontSize: 26,
    marginBottom: 2,
    textShadowColor: color.cyan,
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 0 },
  },
  label: { fontSize: 10, letterSpacing: 0.6, textAlign: 'center' },
  subtitle: {
    ...textStyles.micro,
    color: color.creamFaint,
    textAlign: 'center',
    letterSpacing: 0.2,
    fontSize: 8,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
});
