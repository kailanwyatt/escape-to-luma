import { type ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, space } from '../tokens';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  atmosphere?: boolean;
  scroll?: boolean;
};

export function Screen({ children, style, atmosphere = true, scroll = true }: Props) {
  const insets = useSafeAreaInsets();
  const contentStyle = [
    styles.content,
    {
      paddingTop: Math.max(insets.top, 12),
      paddingBottom: Math.max(insets.bottom, 20),
      paddingLeft: Math.max(insets.left, space.screenX),
      paddingRight: Math.max(insets.right, space.screenX),
    },
  ];
  return (
    <View style={[styles.root, style]}>
      {atmosphere ? <LinearGradient pointerEvents="none" colors={['#06121f', '#102a40', '#040c17', '#020811']} locations={[0, 0.4, 0.72, 1]} style={StyleSheet.absoluteFill} /> : null}
      {scroll ? (
        <ScrollView style={styles.scroll} contentContainerStyle={contentStyle}>
          <View style={styles.column}>{children}</View>
        </ScrollView>
      ) : (
        <View style={[contentStyle, {flex:1,minHeight:0}]}>
          <View style={styles.column}>{children}</View>
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, backgroundColor: color.ink },
  scroll: { flex: 1 },
  content: { flexGrow: 1, alignItems: 'center' },
  column: { flex: 1, minHeight:0, width: '100%', maxWidth: 480 },
});
