import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { t } from '../i18n';
import { OPENING_BEATS } from '../scene/OpeningSequence';
import { TypewriterText } from './TypewriterText';

type Props = {
  reduceMotion?: boolean;
  stage: number;
  onSkip: () => void;
  onPause: () => void;
};

/**
 * Cinematic chrome over OpeningScene: letterbox, soft veil, title dissolves,
 * and a beat progress rail. The 3D scene stays the hero; this stays sparse.
 */
export function CampaignOpening({
  stage,
  onSkip,
  onPause,
  reduceMotion = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const clamped = Math.max(0, Math.min(OPENING_BEATS.length - 1, stage));
  const beat = OPENING_BEATS[clamped];
  const lastBeat = clamped === OPENING_BEATS.length - 1;

  const letterbox = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const veil = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const titleOpacity = useRef(new Animated.Value(1)).current;
  const titleRise = useRef(new Animated.Value(0)).current;
  const rail = useRef(new Animated.Value(0)).current;
  const hintPulse = useRef(new Animated.Value(0.55)).current;
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) {
      letterbox.setValue(1);
      veil.setValue(1);
      return;
    }
    Animated.parallel([
      Animated.timing(letterbox, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(veil, {
        toValue: 1,
        duration: 1100,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [letterbox, reduceMotion, veil]);

  useEffect(() => {
    if (reduceMotion) {
      titleOpacity.setValue(1);
      titleRise.setValue(0);
      rail.setValue(1);
      return;
    }
    titleOpacity.setValue(0);
    titleRise.setValue(14);
    rail.setValue(0);
    Animated.parallel([
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(titleRise, {
        toValue: 0,
        duration: 620,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(rail, {
        toValue: 1,
        duration: Math.max(400, beat.duration * 1000 - 180),
        easing: Easing.linear,
        useNativeDriver: false,
      }),
    ]).start();
  }, [beat.duration, clamped, rail, reduceMotion, titleOpacity, titleRise]);

  useEffect(() => {
    if (reduceMotion || !lastBeat) {
      hintPulse.setValue(lastBeat ? 1 : 0.55);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(hintPulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(hintPulse, {
          toValue: 0.45,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [hintPulse, lastBeat, reduceMotion]);

  useEffect(() => {
    if (reduceMotion) {
      sweep.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: 7800,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, sweep]);

  const topBarH = Math.max(insets.top + 28, 52);
  const bottomBarH = Math.max(insets.bottom + 36, 64);

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.letterboxTop,
          {
            height: topBarH,
            opacity: letterbox,
            transform: [
              {
                translateY: letterbox.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-topBarH, 0],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.letterboxBottom,
          {
            height: bottomBarH,
            opacity: letterbox,
            transform: [
              {
                translateY: letterbox.interpolate({
                  inputRange: [0, 1],
                  outputRange: [bottomBarH, 0],
                }),
              },
            ],
          },
        ]}
      />

      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: veil }]}>
        <LinearGradient
          colors={['rgba(0,8,18,0.55)', 'transparent', 'transparent', 'rgba(0,10,22,0.72)']}
          locations={[0, 0.22, 0.55, 1]}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={['rgba(0,12,24,0.5)', 'transparent', 'rgba(0,12,24,0.5)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View
          style={[
            styles.sweep,
            {
              opacity: sweep.interpolate({
                inputRange: [0, 0.15, 0.35, 1],
                outputRange: [0, 0.18, 0, 0],
              }),
              transform: [
                {
                  translateX: sweep.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-120, 420],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={['transparent', 'rgba(143,239,255,0.35)', 'transparent']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </Animated.View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('campaignopening.pause_opening')}
        onPress={onPause}
        style={[styles.chromeHit, styles.pause, { top: insets.top + 14 }]}
      >
        <Text style={styles.chromeLabel}>{t('campaignopening.pause')}</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('campaignopening.skip_opening')}
        onPress={onSkip}
        style={[styles.chromeHit, styles.skip, { top: insets.top + 14 }]}
      >
        <Text style={styles.chromeLabel}>{t('campaignopening.skip')}</Text>
      </Pressable>

      <View
        pointerEvents="box-none"
        style={[styles.copyWrap, { bottom: Math.max(insets.bottom + 18, 28) }]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(2,12,24,0.55)', 'rgba(2,10,20,0.88)']}
          locations={[0, 0.35, 1]}
          style={styles.copyVeil}
        >
          <Text style={styles.chapter}>
            {t('campaignopening.the_beginning')}
            {clamped + 1} / {OPENING_BEATS.length}
          </Text>
          <Animated.View
            style={{
              opacity: titleOpacity,
              transform: [{ translateY: titleRise }],
            }}
          >
            <Text style={styles.title}>{beat.title}</Text>
          </Animated.View>
          <TypewriterText
            key={clamped}
            text={beat.caption}
            style={styles.caption}
            reduceMotion={reduceMotion}
          />
          {lastBeat ? (
            <Animated.Text style={[styles.hint, { opacity: hintPulse }]}>
              {t('campaignopening.drag_to_aim_pull_for_power_release_to_throw')}
            </Animated.Text>
          ) : null}

          <View style={styles.railTrack}>
            {OPENING_BEATS.map((_, i) => {
              const filled = i < clamped;
              const active = i === clamped;
              return (
                <View key={i} style={styles.railSegment}>
                  <View style={[styles.railBase, filled && styles.railFilled]} />
                  {active ? (
                    <Animated.View
                      style={[
                        styles.railFill,
                        {
                          width: rail.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%'],
                          }),
                        },
                      ]}
                    />
                  ) : null}
                </View>
              );
            })}
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  letterboxTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#01060c',
  },
  letterboxBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#01060c',
  },
  sweep: {
    position: 'absolute',
    top: '18%',
    bottom: '28%',
    width: 90,
  },
  chromeHit: {
    position: 'absolute',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(143,239,255,0.28)',
    backgroundColor: 'rgba(4,16,28,0.45)',
  },
  pause: { left: 18 },
  skip: { right: 18 },
  chromeLabel: {
    color: 'rgba(196,244,255,0.88)',
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 2.4,
  },
  copyWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    maxWidth: 820,
    alignSelf: 'center',
  },
  copyVeil: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 18,
  },
  chapter: {
    color: 'rgba(143,239,255,0.62)',
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 2.8,
    marginBottom: 10,
  },
  title: {
    color: '#f2fcff',
    fontWeight: '300',
    fontSize: 28,
    letterSpacing: 4,
    textShadowColor: 'rgba(0,180,255,0.45)',
    textShadowRadius: 16,
    textShadowOffset: { width: 0, height: 0 },
  },
  caption: {
    color: 'rgba(232,242,248,0.94)',
    fontSize: 16,
    lineHeight: 25,
    marginTop: 14,
    letterSpacing: 0.3,
  },
  hint: {
    marginTop: 18,
    color: '#8fefff',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 2.2,
  },
  railTrack: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 22,
  },
  railSegment: {
    flex: 1,
    height: 2,
    borderRadius: 1,
    overflow: 'hidden',
    backgroundColor: 'rgba(143,239,255,0.14)',
  },
  railBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  railFilled: {
    backgroundColor: 'rgba(143,239,255,0.85)',
  },
  railFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#8fefff',
    shadowColor: '#5cefff',
    shadowRadius: 6,
    shadowOpacity: 0.9,
    shadowOffset: { width: 0, height: 0 },
  },
});
