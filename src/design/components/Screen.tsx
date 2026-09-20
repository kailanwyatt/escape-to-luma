import { type ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, space } from '../tokens';

type Props = { children: ReactNode; style?: StyleProp<ViewStyle>; atmosphere?: boolean };

export function Screen({ children, style, atmosphere = true }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, style]}>
      {atmosphere ? <LinearGradient pointerEvents="none" colors={['#06121f', '#102a40', '#040c17', '#020811']} locations={[0, 0.4, 0.72, 1]} style={StyleSheet.absoluteFill} /> : null}
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, {
        paddingTop: Math.max(insets.top, 12), paddingBottom: Math.max(insets.bottom, 20),
        paddingLeft: Math.max(insets.left, space.screenX), paddingRight: Math.max(insets.right, space.screenX),
      }]}>
        <View style={styles.column}>{children}</View>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, backgroundColor: color.ink },
  scroll: { flex: 1 },
  content: { flexGrow: 1, alignItems: 'center' },
  column: { flex: 1, width: '100%', maxWidth: 480 },
});
