import { StyleSheet, Text, View } from 'react-native';

import { HOME_BRAND } from '../../config/branding';
import { textStyles } from '../typography';
import { color, space } from '../tokens';

type Props = {
  kicker?: string;
  title?: string;
  productLine?: string;
  tagline?: string;
};

export function BrandHero({
  kicker = HOME_BRAND.eyebrow,
  title = HOME_BRAND.title,
  productLine = HOME_BRAND.subtitle,
  tagline = HOME_BRAND.tagline,
}: Props) {
  return (
    <View style={styles.root}>
      {kicker ? <Text style={textStyles.kicker}>{kicker}</Text> : null}
      <Text numberOfLines={1} adjustsFontSizeToFit style={[textStyles.brand, styles.title]}>{title}</Text>
      <View style={styles.flare} />
      {productLine ? <Text style={textStyles.productLine}>{productLine}</Text> : null}
      {tagline ? <Text style={[textStyles.tagline, styles.tagline]}>{tagline}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
  },
  title: { fontSize: 64, lineHeight: 76, letterSpacing: 10, fontWeight: '300' },
  flare: {
    width: 36,
    height: 3,
    borderRadius: 2,
    backgroundColor: color.cyan,
    marginTop: -6,
    marginBottom: space.sm,
    opacity: 0.9,
    shadowColor: color.cyan,
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  tagline: {
    marginTop: space.sm,
  },
});
