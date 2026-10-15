import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { t } from '../i18n';
import { fontUiRegular } from '../design/fonts';
import { CINEMATIC_OPENING_COPY } from '../scene/CinematicOpeningCopy';

type Props = {
  reduceMotion?: boolean;
  stage: number;
  copyOpacity: number;
  onSkip: () => void;
  onPause: () => void;
};

/** The comparison film's typography, framing and gradients, with touch-sized playback controls. */
export function CampaignOpening({ stage, copyOpacity, onSkip, onPause, reduceMotion = false }: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const portrait = width / height < .85;
  const clamped = Math.max(0, Math.min(CINEMATIC_OPENING_COPY.length - 1, stage));
  const beat = CINEMATIC_OPENING_COPY[clamped];
  const reveal = useRef(new Animated.Value(1)).current;
  const transfer = useRef(new Animated.Value(copyOpacity)).current;
  useEffect(() => {
    const animation = Animated.timing(transfer, { toValue: copyOpacity, duration: reduceMotion ? 0 : 90, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [copyOpacity, reduceMotion, transfer]);
  useEffect(() => {
    if (reduceMotion) { reveal.setValue(1); return; }
    reveal.setValue(0);
    const animation = Animated.timing(reveal, {
      toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [clamped, reduceMotion, reveal]);
  const insetX = portrait ? 25 : Math.max(insets.left + 25, width * .045);
  const titleSize = portrait ? 38 : Math.min(70, Math.max(38, width * .044));

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: transfer }]}>
        <LinearGradient
          colors={['#03070d66', 'transparent', 'transparent', '#03070de8']}
          locations={[0, .2, .54, 1]} style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={['#04090e40', 'transparent', 'transparent']}
          locations={[0, .6, 1]} start={{ x: 0, y: .5 }} end={{ x: 1, y: .5 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.filmTop, { top: insets.top + (portrait ? 22 : 25), left: insetX, right: insetX }]}>
          <View style={styles.take}><View style={styles.liveMark} /><Text style={styles.takeLabel}>{t('cinematicopening.prologue')}</Text></View>
          <Text style={[styles.location, { maxWidth: width * .55 }]}>{beat.location.toUpperCase()}</Text>
        </View>
        <Animated.View style={[styles.caption, {
          left: insetX, right: insetX, bottom: insets.bottom + (portrait ? 70 : 58),
          opacity: reveal, transform: [{ translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [7, 0] }) }],
        }]}>
          <View style={styles.chapterMeta}>
            <View style={styles.chapterLine} />
            <Text style={styles.chapterLabel}>{String(clamped + 1).padStart(2, '0')} / {beat.label.toUpperCase()}</Text>
          </View>
          <Text style={[styles.title, { fontSize: titleSize, lineHeight: titleSize * 1.02, letterSpacing: titleSize * .025 }]}>{beat.title}</Text>
          <Text style={[styles.story, { fontSize: portrait ? 16 : 17, lineHeight: portrait ? 24 : 25.5, maxWidth: width < 800 ? 260 : 315 }]}>{beat.caption}</Text>
        </Animated.View>
      </Animated.View>
      <View style={[styles.transport, { paddingBottom: insets.bottom, paddingLeft: Math.max(12, insets.left), paddingRight: Math.max(12, insets.right) }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('campaignopening.pause_opening')} onPress={onPause} style={styles.control}>
          <Text style={styles.controlLabel}>{t('campaignopening.pause')}</Text>
        </Pressable>
        <View accessible accessibilityLabel={`${clamped + 1} / ${CINEMATIC_OPENING_COPY.length}`} style={styles.rail}>
          {CINEMATIC_OPENING_COPY.map((_, i) => <View key={i} style={[styles.segment, i <= clamped && styles.segmentActive]} />)}
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={t('campaignopening.skip_opening')} onPress={onSkip} style={styles.control}>
          <Text style={styles.controlLabel}>{t('campaignopening.skip')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  filmTop: { position: 'absolute', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 18 },
  take: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  liveMark: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#e3be8b' },
  takeLabel: { fontFamily: fontUiRegular, color: '#d4c4ad', fontSize: 10, letterSpacing: 2 },
  location: { fontFamily: fontUiRegular, color: '#adc0c9', fontSize: 10, letterSpacing: 2, textAlign: 'right' },
  caption: { position: 'absolute', maxWidth: 430 },
  chapterMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  chapterLine: { width: 30, height: 1, backgroundColor: '#e3be8b' },
  chapterLabel: { fontFamily: fontUiRegular, fontSize: 10, letterSpacing: 2.4, color: '#e3be8b' },
  title: { fontFamily: fontUiRegular, color: '#eee8db', marginTop: 17, marginBottom: 12, textShadowColor: '#0006', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 32 },
  story: { fontFamily: fontUiRegular, color: '#aebdc6', letterSpacing: .32 },
  transport: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 20, backgroundColor: '#04080db5', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#ffffff13' },
  control: { minHeight: 44, minWidth: 64, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  controlLabel: { fontFamily: fontUiRegular, fontSize: 11, letterSpacing: 1.8, color: '#d4c4ad' },
  rail: { flex: 1, flexDirection: 'row', gap: 6 },
  segment: { flex: 1, height: 2, backgroundColor: '#ffffff1a' },
  segmentActive: { backgroundColor: '#e3be8b' },
});
