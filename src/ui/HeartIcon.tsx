import {Image, Text, View} from 'react-native';
import {getAssetSource} from '../graphics/assetRegistry';

type Props = {
  filled: boolean;
  size?: number;
};

/** Endless Voyage life pip — sprite with glyph fallback. */
export function HeartIcon({filled, size = 16}: Props) {
  const source = getAssetSource(filled ? 'ui.heart.full' : 'ui.heart.empty');
  if (!source) {
    return (
      <Text accessible={false} style={{fontSize: size, color: filled ? '#ff5d6c' : '#6aa0b4', lineHeight: size}}>
        {filled ? '♥' : '♡'}
      </Text>
    );
  }
  return (
    <View accessible={false} style={{width: size, height: size}}>
      <Image source={source} resizeMode="contain" style={{width: size, height: size}} />
    </View>
  );
}
