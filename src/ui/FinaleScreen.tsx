import {useEffect, useRef, useState} from 'react';
import {Animated, Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {Asset} from 'expo-asset';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {t} from '../i18n';
import {sparkById} from '../customization/sparks';
import {GameHaptics} from '../feedback/Haptics';
import {TypewriterText} from './TypewriterText';
import {FinaleLights, FinaleShootingStars, FinaleSparks, useFinaleActive} from './FinaleScene';

const BACKGROUNDS = [require('../../assets/art/worlds/finale.png'), require('../../assets/art/worlds/finale-voyage.png')];
type Props = {equippedSparkId: string; onExplore: () => void; reduceMotion: boolean; onClosePreview?: () => void};

/** A dedicated, player-paced two-page ending. It never grants rewards or alters campaign progress. */
export function FinaleScreen({equippedSparkId, onExplore, reduceMotion, onClosePreview}: Props) {
  const {width, height, fontScale} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(0);
  const [copyHeight, setCopyHeight] = useState(285);
  const [imageReady, setImageReady] = useState(false);
  const launched = useRef(false);
  const lastPageChange = useRef(0);
  const opacity = useRef(new Animated.Value(1)).current;
  const active = useFinaleActive();
  const moving = active && !reduceMotion && imageReady;
  const wide = width >= 700 && width > height * 1.2;
  const compact = height < 740;
  const titleSize = wide ? Math.min(60, width * .044) : width < 380 ? 32 : Math.min(48, width * .087);
  const bodySize = wide ? compact ? 16 : 20 : width < 380 ? 15 : Math.min(20, width * .042);
  const colour = `#${sparkById(equippedSparkId).color.toString(16).padStart(6,'0')}`;
  const artWidth = wide ? width * .61 : width;
  const artLeft = wide ? width - artWidth : 0;
  const bottomSpace = Math.max(insets.bottom, 14);
  const safeTop = Math.max(insets.top, 16);
  // Text is measured at its full size before typing. The crowd stays above it on small screens.
  const artBottom = wide ? height * .82 : Math.max(height * .40, height - copyHeight - bottomSpace - 6);
  const castWidth = wide ? Math.min(artWidth * .96, height * .82) : Math.min(width * .96, 650);
  const castHeight = Math.min(artBottom * .75, castWidth * .78);
  const castLeft = artLeft + (artWidth - castWidth) / 2;
  const castTop = Math.max(safeTop + 50, artBottom - castHeight - castWidth * .05);
  // Frame the supplied platform above the copy; the full-bleed underlay continues behind the text.
  const artHeight = wide ? height : Math.min(height, (artBottom + castWidth * .06) / .83);
  const imageScale = Math.max(artWidth / 1024, artHeight / 1536);
  const imageWidth = 1024 * imageScale, imageHeight = 1536 * imageScale;
  const imageLeft = (artWidth - imageWidth) / 2, imageTop = (artHeight - imageHeight) / 2;
  const title = t(page === 0 ? 'luma.made_it' : 'luma.travel_together');
  const body = t(page === 0 ? 'luma.arrival_body' : 'luma.voyage_body');

  useEffect(() => {
    // Start loading page two while the player reads page one. Normal Image loading is the fallback.
    void Asset.loadAsync([BACKGROUNDS[1], require('../../assets/art/sparks/finale-sparks-atlas.png')]).catch(() => undefined);
  }, []);

  useEffect(() => {
    opacity.setValue(reduceMotion ? 1 : 0);
    if (reduceMotion) return;
    const reveal = Animated.timing(opacity, {toValue:1,duration:450,useNativeDriver:true,isInteraction:false});
    reveal.start(); return () => reveal.stop();
  }, [page, opacity, reduceMotion]);

  const choosePage = (next: number) => {
    if (next === page) return;
    lastPageChange.current = Date.now();
    GameHaptics.forUi(); setImageReady(false); setPage(next);
  };
  const advance = () => {
    if (Date.now() - lastPageChange.current < 400) return;
    if (page === 0) {choosePage(1); return;}
    if (launched.current) return;
    launched.current = true;
    GameHaptics.forUi(); onExplore();
  };

  return <View style={s.root} accessibilityViewIsModal>
    <Image source={BACKGROUNDS[page]} accessible={false} resizeMode="cover" blurRadius={wide ? 18 : 0} style={StyleSheet.absoluteFill}/>
    <Animated.View style={[StyleSheet.absoluteFill,{opacity}]}>
      <View pointerEvents="none" style={{position:'absolute',left:artLeft,top:0,width:artWidth,height:artHeight,overflow:'hidden'}}>
        <View style={{position:'absolute',left:imageLeft,top:imageTop,width:imageWidth,height:imageHeight}}>
          <Image key={page} source={BACKGROUNDS[page]} accessible={false} resizeMode="stretch" fadeDuration={0} onLoad={() => setImageReady(true)} style={StyleSheet.absoluteFill}/>
          <FinaleLights page={page} imageWidth={imageWidth} imageHeight={imageHeight} moving={moving}/>
        </View>
      </View>
      <FinaleShootingStars width={width} height={height} moving={moving}/>
      <View pointerEvents="none" style={{position:'absolute',left:castLeft,top:castTop}}>
        <FinaleSparks key={page} page={page} width={castWidth} height={castHeight} colour={colour} moving={moving}/>
      </View>
      <LinearGradient pointerEvents="none" colors={['#00112200','#00112244','#001222ed','#00101ff5']} locations={[0,.32,.64,1]} style={{position:'absolute',left:0,right:0,bottom:0,height:Math.min(height,copyHeight+130)}}/>
      {wide ? <LinearGradient pointerEvents="none" colors={['#001321f5','#001321dc','#00132100']} start={{x:0,y:.5}} end={{x:1,y:.5}} style={{position:'absolute',left:0,top:0,bottom:0,width:width*.61}}/> : null}
    </Animated.View>

    <View style={[s.pageCount,{top:safeTop,right:Math.max(insets.right+20,24)}]}><Text style={s.counter}>{t('luma.page',{page:page+1})}</Text></View>
    {onClosePreview ? <Pressable onPress={onClosePreview} accessibilityRole="button" accessibilityLabel={t('luma.close_preview')} style={[s.closePreview,{top:safeTop,left:Math.max(insets.left,14)}]}><Text style={s.closeIcon}>×</Text></Pressable> : null}

    <ScrollView key={`copy-${page}`} style={{position:'absolute',left:wide?Math.max(insets.left+32,width*.055):Math.max(insets.left+24,24),right:wide?width*.55:Math.max(insets.right+24,24),bottom:bottomSpace,maxHeight:wide?height-safeTop-70:height*.62}}
      contentContainerStyle={{paddingTop:12,paddingBottom:4}} showsVerticalScrollIndicator={false} bounces={false}>
      <View onLayout={event => setCopyHeight(event.nativeEvent.layout.height)}>
        <Text accessibilityRole="header" style={[s.title,{fontSize:titleSize,lineHeight:titleSize*1.06,marginBottom:compact?10:14}]}>{title}</Text>
        <View style={{flexDirection:page===1&&width>=390&&fontScale<1.3?'row':'column',alignItems:'center',gap:10}}>
          <View style={[{alignSelf:'stretch'},page===1&&width>=390&&fontScale<1.3?{flex:1}:{width:'100%'}]}><TypewriterText key={page} text={body} reduceMotion={reduceMotion} style={[s.body,{fontSize:bodySize,lineHeight:bodySize*1.43}]}/></View>
          {page === 1 && (!compact || wide) && fontScale < 1.3 ? <View accessible={false} style={s.voyageMark}>
            <Text style={s.infinity}>∞</Text><Text style={s.motto}>{t('luma.together_motto')}</Text>
          </View> : null}
        </View>
        <Pressable accessibilityRole="button" onPress={advance} style={({pressed})=>[s.cta,{marginTop:compact?18:24},pressed&&{transform:[{scale:.98}]}]}>
          <LinearGradient colors={['#ffe96b','#ffd33e','#ffbd2b']} style={[s.ctaFill,{minHeight:compact?56:66}]}>
            <Text style={[s.ctaLabel,{fontSize:width<380?17:20}]}>{t(page===0?'luma.next':'luma.explore_together')}</Text>
            {page===0?<Text accessible={false} style={s.chevron}>›</Text>:null}
          </LinearGradient>
        </Pressable>
        <View style={s.dots}>{[0,1].map(i=><Pressable key={i} accessibilityRole="button" accessibilityLabel={t('luma.page',{page:i+1})} accessibilityState={{selected:page===i}} onPress={()=>choosePage(i)} style={s.dotHit}><View style={[s.dot,page===i&&s.dotActive]}/></Pressable>)}</View>
      </View>
    </ScrollView>
  </View>;
}

const s=StyleSheet.create({
  root:{...StyleSheet.absoluteFill,zIndex:30,backgroundColor:'#001321',overflow:'hidden'},
  pageCount:{position:'absolute',paddingHorizontal:12,paddingVertical:7,borderRadius:20,backgroundColor:'#00122366'},
  counter:{fontSize:15,fontWeight:'700',letterSpacing:2,color:'#f5fcff'},
  title:{fontWeight:'800',color:'#f6fbff',letterSpacing:-1,textShadowColor:'#001629',textShadowRadius:9,textShadowOffset:{width:0,height:2}},
  body:{color:'#eef5ff',textShadowColor:'#001122',textShadowRadius:6,textShadowOffset:{width:0,height:1}},
  voyageMark:{width:96,alignItems:'center'}, infinity:{fontSize:80,lineHeight:80,fontWeight:'500',color:'#c4a6ff',textShadowColor:'#679dff',textShadowRadius:15,textShadowOffset:{width:0,height:0}},
  motto:{fontSize:7,lineHeight:12,letterSpacing:1.7,fontWeight:'700',textAlign:'center',color:'#d4eaff'},
  cta:{borderRadius:21,shadowColor:'#ffe14d',shadowRadius:17,shadowOpacity:.48,shadowOffset:{width:0,height:2},elevation:5},
  ctaFill:{borderRadius:21,borderWidth:1.5,borderColor:'#fff09b',paddingVertical:16,paddingHorizontal:18,alignItems:'center',justifyContent:'center'},
  ctaLabel:{color:'#171407',fontWeight:'900',textAlign:'center'},chevron:{position:'absolute',right:22,color:'#1a1807',fontSize:34,lineHeight:36},
  dots:{flexDirection:'row',alignSelf:'center',marginTop:8},dotHit:{minWidth:40,minHeight:40,alignItems:'center',justifyContent:'center'},
  dot:{width:12,height:12,borderRadius:8,borderWidth:1.5,borderColor:'#518598'},dotActive:{backgroundColor:'#12e7f4',borderColor:'#51f2ff'},
  closePreview:{position:'absolute',width:44,height:44,borderRadius:24,alignItems:'center',justifyContent:'center',backgroundColor:'#001a2bb0'},closeIcon:{color:'#c6f5ff',fontSize:30,lineHeight:34},
});
