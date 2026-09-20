import { StyleSheet, Text, View } from 'react-native';

import { textStyles } from '../typography';
import { color, radius, space } from '../tokens';

type Props = {
  energyLabel: string;
  shardsLabel: string;
  progressLabel?: string;
  worldLabel?: string;
};

/** Compact status strip under the brand — not a dashboard. */
export function MetaStrip({ energyLabel, shardsLabel, progressLabel, worldLabel }: Props) {
  return (
    <View style={styles.root}>
      {worldLabel ? <Text style={textStyles.caption}>{worldLabel}</Text> : null}
      {progressLabel ? <Text style={[textStyles.labelCyan, styles.progress]}>{progressLabel}</Text> : null}
      <View style={styles.row}>
        <View style={styles.chip}>
          <Text style={textStyles.labelAmber}>{energyLabel}</Text>
        </View>
        <View style={styles.chip}>
          <Text style={textStyles.labelCyan}>{shardsLabel}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    gap: space.xs,
  },
  progress: {
    marginTop: space.xxs,
  },
  row: {
    flexDirection: 'row',
    gap: space.sm,
    marginTop: space.sm,
  },
  chip: {
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.stroke,
    backgroundColor: color.inkElevated,
  },
});
