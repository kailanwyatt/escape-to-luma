import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';

export type ContainmentVariant =
  | 'default'
  | 'living'
  | 'found'
  | 'signal'
  | 'breach'
  | 'mission';

const STORY_BACKDROPS: Partial<Record<ContainmentVariant, number>> = {
  living: require('../../../assets/art/story/story-01-living-light.png'),
  found: require('../../../assets/art/story/story-02-found.png'),
  signal: require('../../../assets/art/story/story-03-signal.png'),
  breach: require('../../../assets/art/story/story-04-breach.png'),
  mission: require('../../../assets/art/story/story-05-mission.png'),
};

type Props = {
  variant?: ContainmentVariant;
  reduceMotion?: boolean;
};

/** Decorative containment chamber: RN geometry + optional story still + Animated flashes. */
export function ContainmentScene({
  variant = 'default',
  reduceMotion = false,
}: Props) {
  const lamp = useRef(new Animated.Value(0.55)).current;
  const core = useRef(new Animated.Value(1)).current;
  const vignette = useRef(new Animated.Value(0.35)).current;
  const backdrop = STORY_BACKDROPS[variant];
  const crack = variant === 'breach' || variant === 'mission';
  const signal = variant === 'signal' || variant === 'mission';
  const warn = variant === 'breach';

  useEffect(() => {
    if (reduceMotion) {
      lamp.setValue(0.85);
      core.setValue(1);
      vignette.setValue(0.4);
      return;
    }
    const lampLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(lamp, {
          toValue: 1,
          duration: warn ? 280 : 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(lamp, {
          toValue: warn ? 0.2 : 0.45,
          duration: warn ? 220 : 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    const coreLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(core, {
          toValue: 1.08,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(core, {
          toValue: 0.94,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    const vignetteLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(vignette, {
          toValue: 0.55,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(vignette, {
          toValue: 0.28,
          duration: 1800,
          useNativeDriver: true,
        }),
      ]),
    );
    lampLoop.start();
    coreLoop.start();
    vignetteLoop.start();
    return () => {
      lampLoop.stop();
      coreLoop.stop();
      vignetteLoop.stop();
    };
  }, [core, lamp, reduceMotion, vignette, warn]);

  return (
    <View
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.scene}
    >
      {backdrop ? (
        <Image source={backdrop} style={styles.backdrop} resizeMode="cover" />
      ) : (
        <View style={styles.planet} />
      )}
      <LinearGradient
        colors={['rgba(2,8,16,0.15)', 'transparent', 'rgba(2,8,16,0.55)']}
        style={StyleSheet.absoluteFill}
      />
      {[0, 1, 2, 3].map((i) => (
        <View
          key={i}
          style={[
            styles.frame,
            { left: `${i * 8}%`, right: `${i * 8}%`, top: i * 12, bottom: i * 10 },
          ]}
        />
      ))}
      {[-1, 1].map((side) => (
        <View key={side} style={[styles.column, side < 0 ? { left: 0 } : { right: 0 }]}>
          <LinearGradient
            colors={['#172e42', '#080f1b', '#1d3444']}
            style={StyleSheet.absoluteFill}
          />
          <Animated.View
            style={[
              styles.lamp,
              warn && styles.lampWarn,
              { opacity: lamp },
            ]}
          />
          <View style={styles.panel} />
          <Animated.View
            style={[
              styles.lamp,
              warn && styles.lampWarn,
              { opacity: lamp },
            ]}
          />
        </View>
      ))}
      <View style={styles.stage}>
        <View style={styles.stageInner} />
      </View>
      {signal ? (
        <LinearGradient
          colors={['transparent', '#b07cff88', 'transparent']}
          style={styles.signalBeam}
        />
      ) : null}
      <LinearGradient colors={['transparent', '#71edff88', 'transparent']} style={styles.beam} />
      {!backdrop ? (
        <>
          <View style={styles.halo} />
          <Animated.View style={[styles.glow, { transform: [{ scale: core }] }]}>
            <View style={styles.core} />
          </Animated.View>
        </>
      ) : null}
      {crack ? (
        <View style={styles.crackLayer}>
          <View style={[styles.crack, styles.crackA]} />
          <View style={[styles.crack, styles.crackB]} />
          <View style={[styles.crack, styles.crackC]} />
          <Animated.View style={[styles.breachGlow, { opacity: vignette }]} />
        </View>
      ) : null}
      <Animated.View style={[styles.scanline, { opacity: vignette }]} />
      {Array.from({ length: 18 }, (_, i) => (
        <View
          key={i}
          style={[
            styles.particle,
            {
              left: `${12 + ((i * 37) % 77)}%`,
              top: `${8 + ((i * 23) % 72)}%`,
              opacity: 0.25 + (i % 3) * 0.25,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  scene: {
    flex: 1,
    minHeight: 175,
    maxHeight: 340,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#040c17',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  planet: {
    position: 'absolute',
    width: 470,
    height: 300,
    borderRadius: 240,
    top: -220,
    right: -170,
    borderWidth: 2,
    borderColor: '#5dc9ec66',
    backgroundColor: '#143047',
    transform: [{ rotate: '-25deg' }],
  },
  frame: {
    position: 'absolute',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#31506a55',
    borderRadius: 14,
  },
  column: {
    position: 'absolute',
    top: 0,
    bottom: 12,
    width: 34,
    borderWidth: 1,
    borderColor: '#45607666',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    overflow: 'hidden',
  },
  lamp: {
    width: 4,
    height: 29,
    backgroundColor: '#ffd280',
    shadowColor: '#ff9b32',
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  lampWarn: {
    backgroundColor: '#ff5d6c',
    shadowColor: '#ff3b3b',
  },
  panel: {
    width: 24,
    height: 48,
    borderWidth: 1,
    borderColor: '#59718366',
    backgroundColor: '#081420',
  },
  stage: {
    position: 'absolute',
    bottom: 10,
    width: 200,
    height: 35,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: '#2d7197',
    backgroundColor: '#071a2d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageInner: {
    width: 144,
    height: 19,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: '#8ff9ff',
    backgroundColor: '#0a91c266',
    shadowColor: '#00cfff',
    shadowOpacity: 1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  beam: { position: 'absolute', width: 3, top: '45%', bottom: 22 },
  signalBeam: {
    position: 'absolute',
    width: 8,
    top: 0,
    bottom: '52%',
    left: '50%',
    marginLeft: -4,
  },
  halo: {
    position: 'absolute',
    width: 142,
    height: 142,
    borderRadius: 80,
    backgroundColor: '#00baff0c',
    borderWidth: 14,
    borderColor: '#009dff09',
  },
  glow: {
    width: 58,
    height: 58,
    borderRadius: 30,
    backgroundColor: '#00cfff35',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00cfff',
    shadowOpacity: 1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
  },
  core: {
    width: 38,
    height: 38,
    borderRadius: 20,
    backgroundColor: '#edffff',
    borderWidth: 4,
    borderColor: '#98f9ff',
    shadowColor: '#00d5ff',
    shadowOpacity: 1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  crackLayer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crack: {
    position: 'absolute',
    backgroundColor: '#7ef0ff',
    shadowColor: '#00d5ff',
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  crackA: { width: 2, height: 90, transform: [{ rotate: '18deg' }] },
  crackB: { width: 2, height: 70, left: '46%', transform: [{ rotate: '-28deg' }] },
  crackC: { width: 60, height: 2, top: '48%', transform: [{ rotate: '8deg' }] },
  breachGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#00cfff33',
  },
  scanline: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '42%',
    height: 1,
    backgroundColor: '#7ef0ff55',
  },
  particle: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#b5f5ff',
  },
});
