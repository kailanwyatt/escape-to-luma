import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ContinueJourneyButton, color, radius, space, textStyles } from '../design';
import { ContainmentScene } from '../design/components/ContainmentScene';

const STORY = [
  {
    eyebrow: 'WHAT IS SPARK?',
    title: 'A LIVING LIGHT',
    body: 'Spark is a living energy entity—curious, resilient and alive. Not a machine. Not a weapon.',
  },
  {
    eyebrow: 'SPECIMEN S-01',
    title: 'FOUND FAR FROM HOME',
    body: 'Researchers discovered Spark after it fell to Earth. They captured it and sealed it beneath the city.',
  },
  {
    eyebrow: 'SIGNAL DETECTED',
    title: 'LUMA IS CALLING',
    body: 'From inside containment, Spark hears a distant signal. It feels familiar. It sounds like home.',
  },
  {
    eyebrow: 'SYSTEM FAILURE',
    title: 'THE WAY IS OPEN',
    body: 'Containment is failing, but every security system stands between Spark and the surface.',
  },
  {
    eyebrow: 'YOUR MISSION',
    title: 'GUIDE SPARK HOME',
    body: 'Aim each throw, predict every moving obstacle and help Spark follow the signal across Earth and the stars.',
  },
] as const;

type Props = {
  onComplete: () => void;
};

export function FirstRunStoryScreen({ onComplete }: Props) {
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(0);
  const story = STORY[page];
  const finalPage = page === STORY.length - 1;

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: Math.max(insets.top, space.md),
          paddingBottom: Math.max(insets.bottom, space.lg),
        },
      ]}
    >
      <View style={styles.top}>
        <Text style={styles.brand}>SPARK</Text>
        {!finalPage ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Skip opening story"
            hitSlop={12}
            onPress={onComplete}
          >
            <Text style={textStyles.caption}>SKIP</Text>
          </Pressable>
        ) : (
          <View style={styles.skipPlaceholder} />
        )}
      </View>

      <View style={styles.scene}>
        <ContainmentScene />
        <View style={styles.specimenTag}>
          <Text style={styles.specimenText}>S-01 · CONTAINMENT</Text>
        </View>
      </View>

      <View style={styles.copy}>
        <Text style={styles.eyebrow}>{story.eyebrow}</Text>
        <Text style={styles.title}>{story.title}</Text>
        <Text style={styles.body}>{story.body}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.progress} accessibilityLabel={`Story page ${page + 1} of ${STORY.length}`}>
          {STORY.map((_, index) => (
            <View key={index} style={[styles.dot, index === page && styles.dotActive]} />
          ))}
        </View>
        <ContinueJourneyButton
          label={finalPage ? 'BEGIN JOURNEY' : 'NEXT'}
          playIcon={finalPage}
          onPress={() => {
            if (finalPage) {
              onComplete();
            } else {
              setPage((current) => current + 1);
            }
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    backgroundColor: color.ink,
    paddingHorizontal: space.screenX,
  },
  top: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    color: color.white,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 5,
    textShadowColor: color.cyan,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  skipPlaceholder: {
    width: 44,
  },
  scene: {
    flex: 1,
    minHeight: 220,
    maxHeight: 390,
    marginTop: space.sm,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: color.panelBorder,
    backgroundColor: color.inkSoft,
    overflow: 'hidden',
  },
  specimenTag: {
    position: 'absolute',
    left: space.sm,
    bottom: space.sm,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: color.panelBorder,
    backgroundColor: color.overlayHeavy,
  },
  specimenText: {
    color: color.cyanBright,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  copy: {
    minHeight: 185,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.md,
    paddingVertical: space.lg,
  },
  eyebrow: {
    color: color.cyanBright,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 3,
    textAlign: 'center',
  },
  title: {
    marginTop: space.sm,
    color: color.white,
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
  },
  body: {
    marginTop: space.sm,
    maxWidth: 360,
    color: color.creamMuted,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 21,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    gap: space.lg,
  },
  progress: {
    flexDirection: 'row',
    gap: space.xs,
  },
  dot: {
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: color.panelBorder,
  },
  dotActive: {
    backgroundColor: color.cyanBright,
  },
});
