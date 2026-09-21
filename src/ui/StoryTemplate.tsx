import {t} from '../i18n';
import type {ReactNode} from 'react';
import {Image,Pressable,ScrollView,StyleSheet,Text,View,useWindowDimensions} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ContinueJourneyButton} from '../design';
import {HOME_BRAND} from '../config/branding';
import {getAssetSource,type RuntimeAssetId} from '../graphics/assetRegistry';
import {TypewriterText} from './TypewriterText';

type Props={id:string;image:RuntimeAssetId;eyebrow:string;title:string;body:string;instruction?:string;action:string;onContinue:()=>void;secondaryLabel?:string;onSecondary?:()=>void;reduceMotion?:boolean;progress?:ReactNode};
export function StoryTemplate(p:Props){const insets=useSafeAreaInsets(),{width,height}=useWindowDimensions(),wide=width>=900&&width>height;const source=getAssetSource(p.image);
 return <View style={s.root}><LinearGradient colors={['#03111e','#092638','#020c15']} style={StyleSheet.absoluteFill}/>
 <ScrollView key={p.id} contentContainerStyle={[s.scroll,{paddingTop:insets.top+18,paddingBottom:insets.bottom+24,paddingLeft:Math.max(insets.left,18),paddingRight:Math.max(insets.right,18)}]}>
 <View style={s.top}><View><Text style={s.brand}>{HOME_BRAND.title}</Text><Text style={s.subtitle}>{HOME_BRAND.subtitle}</Text></View><Text style={s.motto}>{t("shopscreen.same_physics")}{'\n'}{t("shopscreen.a_brighter")}{'\n'}{t("shopscreen.tomorrow")}</Text></View>
 <View style={[s.layout,wide&&s.wide]}>
 <View style={[s.art,{height:wide?Math.max(360,Math.min(650,height-155)):Math.min(400,width*.72)},wide&&{flex:1}]}>{source?<Image source={source} resizeMode="cover" style={StyleSheet.absoluteFill} accessible={false}/>:null}<LinearGradient colors={['#03111e00','#03111e00','#051522']} locations={[0,.55,1]} style={StyleSheet.absoluteFill}/><View style={s.imageTag}><Text style={s.tag}>{p.eyebrow}</Text></View></View>
 <View style={[s.copy,wide&&{flex:1,paddingLeft:34}]}>
 <Text style={s.eyebrow}>{p.eyebrow}</Text><Text accessibilityRole="header" style={[s.title,{fontSize:width<380?29:wide?39:36}]}>{p.title}</Text><View style={s.rule}/>
 <TypewriterText key={p.id} text={p.body} style={s.body} reduceMotion={p.reduceMotion}/>
 {p.instruction?<View style={s.hint}><Text style={s.hintLabel}>{t("storytemplate.the_way_forward")}</Text><Text style={s.hintText}>{p.instruction}</Text></View>:null}
 {p.progress}<ContinueJourneyButton label={p.action} playIcon={false} onPress={p.onContinue} style={{marginTop:22}}/>
 {p.onSecondary?<Pressable accessibilityRole="button" onPress={p.onSecondary} style={s.secondary}><Text style={s.secondaryText}>{p.secondaryLabel??t("hud.return_home")}</Text></Pressable>:null}
 </View></View></ScrollView></View>;
}
const s=StyleSheet.create({root:{...StyleSheet.absoluteFill,zIndex:20,backgroundColor:'#03111e'},scroll:{flexGrow:1,width:'100%',maxWidth:1400,alignSelf:'center'},top:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:20,paddingHorizontal:8},brand:{color:'#edfbff',fontSize:30,letterSpacing:9,fontWeight:'300',textShadowColor:'#31c9ff',textShadowRadius:12,textShadowOffset:{width:0,height:0}},subtitle:{color:'#55e6f7',fontSize:10,letterSpacing:3,marginTop:5},motto:{color:'#60dce9',fontSize:8,lineHeight:14,letterSpacing:1.4,borderLeftWidth:1,borderLeftColor:'#52d9ef',paddingLeft:12},layout:{width:'100%',maxWidth:760,alignSelf:'center'},wide:{flexDirection:'row',alignItems:'center',maxWidth:1320},art:{overflow:'hidden',borderRadius:22,backgroundColor:'#071e30'},imageTag:{position:'absolute',bottom:24,left:24},tag:{fontSize:10,letterSpacing:2,color:'#bce9f2',fontWeight:'700'},copy:{paddingTop:20,width:'100%'},eyebrow:{color:'#f4ca77',fontSize:11,fontWeight:'800',letterSpacing:3,textAlign:'center'},title:{color:'#f1faff',fontWeight:'800',textAlign:'center',marginTop:12},rule:{width:42,height:3,backgroundColor:'#39e4f2',alignSelf:'center',marginVertical:20},body:{color:'#c1d8e5',fontSize:17,lineHeight:28,textAlign:'center'},hint:{marginTop:25,padding:20,borderRadius:20,borderWidth:1,borderColor:'#285b70',backgroundColor:'#041622bb'},hintLabel:{fontSize:12,fontWeight:'800',letterSpacing:2,color:'#57e5f4',marginBottom:12},hintText:{color:'#deecf4',fontSize:15,lineHeight:24},secondary:{minHeight:48,alignItems:'center',justifyContent:'center',marginTop:12},secondaryText:{color:'#73c4d6',fontSize:11,fontWeight:'800',letterSpacing:2}});
