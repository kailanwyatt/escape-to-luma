import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

/** Static decorative geometry: no textures, render loop, or extra GL context. */
export function ContainmentScene() {
  return (
    <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.scene}>
      <View style={styles.planet} />
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={[styles.frame, { left: `${i * 8}%`, right: `${i * 8}%`, top: i * 12, bottom: i * 10 }]} />
      ))}
      {[-1, 1].map((side) => (
        <View key={side} style={[styles.column, side < 0 ? { left: 0 } : { right: 0 }]}>
          <LinearGradient colors={['#172e42', '#080f1b', '#1d3444']} style={StyleSheet.absoluteFill} />
          <View style={styles.lamp} /><View style={styles.panel} /><View style={styles.lamp} />
        </View>
      ))}
      <View style={styles.stage}><View style={styles.stageInner} /></View>
      <LinearGradient colors={['transparent', '#71edff88', 'transparent']} style={styles.beam} />
      <View style={styles.halo} />
      {[0, 60, 120].map((angle) => <View key={angle} style={[styles.orbit, { transform: [{ rotate: `${angle}deg` }] }]} />)}
      <View style={styles.glow}><View style={styles.core} /></View>
      {Array.from({ length: 18 }, (_, i) => <View key={i} style={[styles.particle, { left: `${12 + (i * 37) % 77}%`, top: `${8 + (i * 23) % 72}%`, opacity: 0.25 + (i % 3) * 0.25 }]} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  scene: { flex: 1, minHeight: 175, maxHeight: 340, width: '100%', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  planet: { position: 'absolute', width: 470, height: 300, borderRadius: 240, top: -220, right: -170, borderWidth: 2, borderColor: '#5dc9ec66', backgroundColor: '#143047', transform: [{ rotate: '-25deg' }] },
  frame: { position: 'absolute', borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#31506a55', borderRadius: 14 },
  column: { position: 'absolute', top: 0, bottom: 12, width: 34, borderWidth: 1, borderColor: '#45607666', justifyContent: 'space-evenly', alignItems: 'center', overflow: 'hidden' },
  lamp: { width: 4, height: 29, backgroundColor: '#ffd280', shadowColor: '#ff9b32', shadowOpacity: 1, shadowRadius: 12, shadowOffset: { width: 0, height: 0 } },
  panel: { width: 24, height: 48, borderWidth: 1, borderColor: '#59718366', backgroundColor: '#081420' },
  stage: { position: 'absolute', bottom: 10, width: 200, height: 35, borderRadius: 100, borderWidth: 3, borderColor: '#2d7197', backgroundColor: '#071a2d', alignItems: 'center', justifyContent: 'center' },
  stageInner: { width: 144, height: 19, borderRadius: 80, borderWidth: 2, borderColor: '#8ff9ff', backgroundColor: '#0a91c266', shadowColor: '#00cfff', shadowOpacity: 1, shadowRadius: 18, shadowOffset: { width: 0, height: 0 } },
  beam: { position: 'absolute', width: 3, top: '45%', bottom: 22 },
  halo: { position: 'absolute', width: 142, height: 142, borderRadius: 80, backgroundColor: '#00baff0c', borderWidth: 14, borderColor: '#009dff09' },
  orbit: { position: 'absolute', width: 122, height: 76, borderRadius: 70, borderWidth: 1, borderColor: '#76edff', shadowColor: '#00baff', shadowOpacity: 1, shadowRadius: 9, shadowOffset: { width: 0, height: 0 } },
  glow: { width: 58, height: 58, borderRadius: 30, backgroundColor: '#00cfff35', alignItems: 'center', justifyContent: 'center', shadowColor: '#00cfff', shadowOpacity: 1, shadowRadius: 24, shadowOffset: { width: 0, height: 0 } },
  core: { width: 22, height: 22, borderRadius: 12, backgroundColor: '#edffff', borderWidth: 4, borderColor: '#98f9ff', shadowColor: '#00d5ff', shadowOpacity: 1, shadowRadius: 16, shadowOffset: { width: 0, height: 0 } },
  particle: { position: 'absolute', width: 2, height: 2, borderRadius: 1, backgroundColor: '#b5f5ff' },
});
