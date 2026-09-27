import {Image,StyleSheet,Text,View,type StyleProp,type ViewStyle} from 'react-native';
import {getAssetSource} from '../../graphics/assetRegistry';
import {HOME_BRAND} from '../../config/branding';

type Props = {
  size?: 'hero' | 'header';
  showSubtitle?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Image wordmark with text fallback so menus never go blank if the asset is missing. */
export function BrandWordmark({size='header',showSubtitle=true,style}:Props){
  const source=getAssetSource('brand.wordmark');
  const hero=size==='hero';
  return (
    <View accessible accessibilityRole="header" accessibilityLabel={`${HOME_BRAND.title}. ${HOME_BRAND.subtitle}`} style={[styles.root,style]}>
      {source
        ? <Image accessible={false} source={source} resizeMode="contain" style={hero?styles.heroImage:styles.headerImage}/>
        : <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.fallback,hero&&styles.fallbackHero]}>{HOME_BRAND.title}</Text>}
      {showSubtitle?<Text style={[styles.subtitle,hero&&styles.subtitleHero]}>{HOME_BRAND.subtitle}</Text>:null}
    </View>
  );
}

const styles=StyleSheet.create({
  root:{alignItems:'center'},
  heroImage:{width:340,height:96,maxWidth:'94%'},
  headerImage:{width:176,height:50},
  fallback:{color:'#e5faff',fontSize:25,letterSpacing:7,fontWeight:'300',textShadowColor:'#27b7e9',textShadowRadius:12,textAlign:'center'},
  fallbackHero:{fontSize:62,letterSpacing:12,marginLeft:8},
  subtitle:{fontSize:7,color:'#66E6FF',letterSpacing:2.6,marginTop:2,fontWeight:'600'},
  subtitleHero:{fontSize:12,letterSpacing:5,marginTop:4,color:'#83DEFA'},
});
