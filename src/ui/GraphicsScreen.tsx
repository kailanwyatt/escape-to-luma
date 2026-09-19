import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ART_DIRECTION,
  GRAPHICS_NEEDS,
  GRAPHICS_SECTIONS,
  countByPriority,
  type GraphicsNeed,
  type GraphicsPriority,
} from '../graphics/graphicsNeeds';

type Props = {
  onBack: () => void;
};

const PRIORITY_COLOR: Record<GraphicsPriority, string> = {
  P0: '#ff5d6c',
  P1: '#ffd24a',
  P2: '#7ef0ff',
};

export function GraphicsScreen({ onBack }: Props) {
  const insets = useSafeAreaInsets();
  const counts = countByPriority();

  return (
    <View style={[styles.root, { paddingTop: Math.max(insets.top, 16) + 12, paddingBottom: insets.bottom }]}>
      <Text style={styles.kicker}>PROTOTYPE → PRODUCTION</Text>
      <Text style={styles.title}>GRAPHICS</Text>
      <Text style={styles.oneLiner}>{ART_DIRECTION.oneLiner}</Text>
      <View style={styles.counts}>
        <Text style={[styles.count, { color: PRIORITY_COLOR.P0 }]}>P0 {counts.P0}</Text>
        <Text style={[styles.count, { color: PRIORITY_COLOR.P1 }]}>P1 {counts.P1}</Text>
        <Text style={[styles.count, { color: PRIORITY_COLOR.P2 }]}>P2 {counts.P2}</Text>
        <Text style={styles.countMuted}>{GRAPHICS_NEEDS.length} total</Text>
      </View>
      <Text style={styles.status}>{ART_DIRECTION.prototypeStatus}</Text>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>PALETTE</Text>
        <View style={styles.swatchRow}>
          {Object.entries(ART_DIRECTION.palette).map(([name, hex]) => (
            <View key={name} style={styles.swatchBlock}>
              <View style={[styles.swatch, { backgroundColor: hex }]} />
              <Text style={styles.swatchLabel}>{name}</Text>
              <Text style={styles.swatchHex}>{hex}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>ENVIRONMENTS</Text>
        {ART_DIRECTION.environments.map((env) => (
          <Text key={env} style={styles.envLine}>
            · {env}
          </Text>
        ))}

        {GRAPHICS_SECTIONS.map((section) => (
          <View key={section.kind} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title.toUpperCase()}</Text>
            <Text style={styles.sectionBlurb}>{section.blurb}</Text>
            {GRAPHICS_NEEDS.filter((item) => item.kind === section.kind).map((item) => (
              <NeedCard key={item.id} item={item} />
            ))}
          </View>
        ))}

        <Text style={styles.footer}>Full brief: docs/GRAPHICS-NEEDS.md</Text>
      </ScrollView>

      <Pressable style={styles.back} onPress={onBack}>
        <Text style={styles.backText}>BACK</Text>
      </Pressable>
    </View>
  );
}

function NeedCard({ item }: { item: GraphicsNeed }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.cardName}>{item.name}</Text>
        <Text style={[styles.priority, { color: PRIORITY_COLOR[item.priority] }]}>{item.priority}</Text>
      </View>
      <Text style={styles.meta}>
        <Text style={styles.metaLabel}>Now </Text>
        {item.current}
      </Text>
      <Text style={styles.meta}>
        <Text style={styles.metaLabel}>Need </Text>
        {item.need}
      </Text>
      <Text style={styles.format}>{item.format}</Text>
      {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10,8,7,0.96)',
    paddingHorizontal: 20,
  },
  kicker: {
    color: 'rgba(244,239,230,0.45)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    textAlign: 'center',
  },
  title: {
    marginTop: 4,
    color: '#ffd24a',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 4,
    textAlign: 'center',
  },
  oneLiner: {
    marginTop: 8,
    color: 'rgba(244,239,230,0.78)',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  counts: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
  },
  count: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  countMuted: {
    color: 'rgba(244,239,230,0.45)',
    fontSize: 13,
    fontWeight: '700',
  },
  status: {
    marginTop: 12,
    color: 'rgba(244,239,230,0.5)',
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
    marginTop: 16,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  section: {
    marginTop: 22,
  },
  sectionTitle: {
    marginTop: 18,
    color: '#7ef0ff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  sectionBlurb: {
    marginTop: 4,
    marginBottom: 10,
    color: 'rgba(244,239,230,0.55)',
    fontSize: 12,
    fontWeight: '600',
  },
  envLine: {
    color: 'rgba(244,239,230,0.7)',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  swatchBlock: {
    width: 72,
  },
  swatch: {
    width: 72,
    height: 36,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(244,239,230,0.2)',
  },
  swatchLabel: {
    marginTop: 4,
    color: 'rgba(244,239,230,0.7)',
    fontSize: 10,
    fontWeight: '700',
  },
  swatchHex: {
    color: 'rgba(244,239,230,0.4)',
    fontSize: 9,
    fontWeight: '600',
  },
  card: {
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(244,239,230,0.06)',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardName: {
    color: '#f4efe6',
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
    paddingRight: 8,
  },
  priority: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  meta: {
    color: 'rgba(244,239,230,0.72)',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
    marginTop: 2,
  },
  metaLabel: {
    color: 'rgba(244,239,230,0.4)',
    fontWeight: '800',
  },
  format: {
    marginTop: 6,
    color: '#d06a32',
    fontSize: 11,
    fontWeight: '700',
  },
  notes: {
    marginTop: 4,
    color: '#ffd24a',
    fontSize: 11,
    fontWeight: '600',
  },
  footer: {
    marginTop: 28,
    marginBottom: 8,
    color: 'rgba(244,239,230,0.35)',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  back: {
    alignSelf: 'center',
    paddingVertical: 14,
  },
  backText: {
    color: '#7ef0ff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
  },
});
