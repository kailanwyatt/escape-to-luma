import {t} from '../../i18n';
import { StyleSheet, Text, View } from 'react-native';

import { textStyles } from '../typography';
import { color, radius, space } from '../tokens';

type Props = {
  worldIndex: number;
  worldName: string;
  level: number;
  totalLevels?: number;
  energyLabel: string;
  shardsLabel: string;
};

/** Glass status panel — world / level / resources. */
export function StatusPanel({
  worldIndex,
  worldName,
  level,
  totalLevels = 150,
  energyLabel,
  shardsLabel,
}: Props) {
  return (
    <View style={styles.panel}>
      <View style={styles.col}>
        <Text style={styles.icon}>◉</Text>
        <Text style={textStyles.labelCyan}>{t("statuspanel.world")}{worldIndex}</Text>
        <Text style={styles.sub}>{worldName}</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.col}>
        <Text style={styles.muted}>{t("statuspanel.level")}</Text>
        <Text style={styles.levelValue}>
          {level} / {totalLevels}
        </Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.colWide}>
        <Text style={textStyles.labelAmber}>⚡ {energyLabel}</Text>
        <Text style={styles.sub}>{t("statuspanel.energy")}</Text>
        <Text style={[textStyles.labelCyan, styles.shards]}>◆ {shardsLabel}</Text>
        <Text style={styles.sub}>{t("statuspanel.shards")}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.panel,
    borderColor: color.panelBorder,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: space.md,
    paddingHorizontal: space.sm,
  },
  col: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  colWide: {
    flex: 1.15,
    alignItems: 'center',
    gap: 2,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: color.strokeStrong,
    marginHorizontal: space.xxs,
  },
  icon: {
    color: color.cyan,
    fontSize: 14,
    marginBottom: 2,
  },
  muted: {
    ...textStyles.caption,
    color: color.creamFaint,
  },
  levelValue: {
    color: color.white,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  sub: {
    ...textStyles.micro,
    letterSpacing: 0.7,
    fontSize: 8,
    paddingHorizontal: 2,
    color: color.creamFaint,
    textAlign: 'center',
  },
  shards: {
    marginTop: space.xs,
  },
});
