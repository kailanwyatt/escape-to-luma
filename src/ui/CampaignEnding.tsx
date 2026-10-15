import { useEffect, useRef } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ENDING_BEATS } from '../scene/ending/EndingSequence';
import { fontUiRegular } from '../design/fonts';
import type { HudSnapshot } from '../game/GameState';
import { t } from '../i18n';

type Props = {
  hud: HudSnapshot; reduceMotion: boolean; paused: boolean;
  onPause: () => void; onResume: () => void; onHome: () => void;
  onSkip: () => void; onReplay: () => void; onExplore: () => void;
};

/** Native controls over the shared GL scene: no second canvas, image loading, or animation loop. */
export function CampaignEnding({ hud, reduceMotion, paused, onPause, onResume, onHome, onSkip, onReplay, onExplore }: Props) {
  const insets = useSafeAreaInsets(), { width, height } = useWindowDimensions();
  const ready = hud.endingStage >= 0, complete = hud.phase === 'CAMPAIGN_COMPLETE';
  const beat = ENDING_BEATS[Math.max(0, hud.endingStage)];
  const reveal = useRef(new Animated.Value(1)).current;
  const transfer = useRef(new Animated.Value(hud.endingCopyOpacity)).current;
  useEffect(() => {
    const animation = Animated.timing(transfer, { toValue: hud.endingCopyOpacity, duration: reduceMotion ? 0 : 90, useNativeDriver: true });
    animation.start(); return () => animation.stop();
  }, [hud.endingCopyOpacity, reduceMotion, transfer]);
  useEffect(() => {
    reveal.setValue(reduceMotion ? 1 : 0);
    const animation = Animated.timing(reveal, { toValue: 1, duration: reduceMotion ? 0 : 600, useNativeDriver: true });
    animation.start(); return () => animation.stop();
  }, [hud.endingStage, reduceMotion, reveal]);
  const compact = height < 720, portrait = width / height < .85;
  const x = Math.max(insets.left + 22, portrait ? 24 : width * .05);
  const button = (label: string, action: () => void, primary = false) => (
    <Pressable accessibilityRole="button" onPress={action} style={({ pressed }) => [styles.button, primary && styles.primary, pressed && { opacity: .7 }]}>
      <Text style={[styles.buttonLabel, primary && { color: '#07151b' }]}>{label}</Text>
    </Pressable>
  );
  return <View style={StyleSheet.absoluteFill} accessibilityViewIsModal pointerEvents="box-none">
    {ready && !paused ? <Animated.View style={[StyleSheet.absoluteFill, { opacity: transfer }]} pointerEvents="box-none">
      <LinearGradient pointerEvents="none" colors={['#030b1233', 'transparent', '#030b12ed']} locations={[0, .48, 1]} style={StyleSheet.absoluteFill}/>
      <View pointerEvents="none" style={[styles.top, { top: insets.top + 22, left: x, right: Math.max(insets.right + 22, x) }]}>
        <Text style={styles.meta}>{t('cinematicending.epilogue')}</Text>
        {!compact ? <Text style={[styles.meta, { textAlign: 'right', maxWidth: width * .55 }]}>{beat.location.toUpperCase()}</Text> : null}
      </View>
      <ScrollView style={{ position: 'absolute', left: x, right: Math.max(insets.right + 22, x), bottom: insets.bottom + (complete ? 18 : 68), maxHeight: height * .58 }} bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={{ maxWidth: 460 }}>
        <Animated.View style={{ opacity: reveal }}>
          <Text style={[styles.meta, { color: '#e3be8b' }]}>{String(hud.endingStage + 1).padStart(2, '0')} / {beat.label.toUpperCase()}</Text>
          <Text accessibilityRole="header" style={[styles.title, { fontSize: compact ? 30 : portrait ? 38 : Math.min(60, width * .047) }]}>{beat.title}</Text>
          <Text style={styles.caption}>{beat.caption}</Text>
          {complete ? <View style={{ marginTop: 20, gap: 6 }}>
            {hud.unlockedSparkName ? <Text style={styles.reward}>{t('cinematicending.unlocked', { name: hud.unlockedSparkName })}</Text> : null}
            {button(t('luma.explore_together'), onExplore, true)}
            {button(t('cinematicending.watch_again'), onReplay)}
          </View> : null}
        </Animated.View>
      </ScrollView>
    </Animated.View> : null}
    {!paused && !complete ? <View style={[styles.transport, { paddingBottom: insets.bottom, paddingHorizontal: Math.max(16, insets.left, insets.right) }]}>
      {button(t('campaignopening.pause'), onPause)}
      <Text style={styles.meta}>{ready ? `${hud.endingStage + 1} / ${ENDING_BEATS.length}` : t('cinematicending.arriving')}</Text>
      {ready ? button(t('campaignopening.skip'), onSkip) : <View style={{ width: 72 }}/>}
    </View> : null}
    {paused ? <View style={styles.paused}>
      <Text style={[styles.title, { fontSize: 32 }]}>{t('hud.paused')}</Text>
      {button(t('cinematicending.resume'), onResume, true)}
      {button(t('cinematicending.home'), onHome)}
    </View> : null}
  </View>;
}
const styles = StyleSheet.create({
  top: { position: 'absolute', flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  meta: { color: '#b8cbcc', fontFamily: fontUiRegular, fontSize: 10, letterSpacing: 2 },
  title: { fontFamily: fontUiRegular, color: '#f3ecdc', marginTop: 14, marginBottom: 12, textShadowColor: '#0008', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 14 },
  caption: { fontFamily: fontUiRegular, fontSize: 16, lineHeight: 24, color: '#c1d1d0', maxWidth: 360 },
  reward: { fontFamily: fontUiRegular, fontSize: 12, color: '#f1cf91', marginBottom: 5 },
  transport: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#040b1299' },
  button: { minHeight: 48, minWidth: 72, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 9 },
  primary: { backgroundColor: '#f3d296' },
  buttonLabel: { fontFamily: fontUiRegular, fontSize: 13, letterSpacing: 1, color: '#d5e3df', textAlign: 'center' },
  paused: { ...StyleSheet.absoluteFill, backgroundColor: '#03101bd9', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
});
