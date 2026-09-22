import {t} from '../i18n';
import {useState,type ReactNode} from 'react';
import {Image,Pressable,ScrollView,StyleSheet,Text,View,useWindowDimensions} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ContinueJourneyButton} from '../design';
import {getAssetSource,type RuntimeAssetId} from '../graphics/assetRegistry';
import {TypewriterText} from './TypewriterText';

type Props={foreground?:ReactNode;heroOverlay?:ReactNode;headingContent?:ReactNode;instructionContent?:ReactNode;typewriter?:boolean;heroHeight?:number;luma?:boolean;artContent?:ReactNode;id:string;image:RuntimeAssetId;eyebrow:string;title:string;body:string;instruction?:string;action:string;onContinue:()=>void;secondaryLabel?:string;onSecondary?:()=>void;reduceMotion?:boolean;progress?:ReactNode};
function copyEstimate(width:number,body:string,instruction:string|undefined,hasInstruction:boolean,hasProgress:boolean,secondary:boolean){
 const textWidth=Math.max(220,width-36),chars=textWidth/8.2;
 const lines=(text:string)=>Math.max(1,Math.ceil(text.length/chars));
 return 20+16+12+44+43+lines(body)*28+(hasInstruction?25+40+28+lines(instruction??'The way forward.')*24:0)+(hasProgress?72:0)+22+68+(secondary?60:0);
}
export function StoryTemplate(p:Props){const insets=useSafeAreaInsets(),{width,height}=useWindowDimensions(),wide=width>=900&&width>height;const source=getAssetSource(p.image);
 const [measured,setMeasured]=useState<{id:string;height:number}|null>(null);
 const copyHeight=measured?.id===p.id?measured.height:copyEstimate(width,p.body,p.instruction,Boolean(p.instruction||p.instructionContent),Boolean(p.progress),Boolean(p.onSecondary));
 const available=height-insets.top-18-insets.bottom-24;
 const hero=p.heroHeight??(wide?Math.max(360,Math.min(650,height-155)):Math.max(100,Math.min(width*.62,available-copyHeight-8)));
 return <View style={s.root}><LinearGradient colors={p.luma?['#062237','#031722','#13242b']:['#03111e','#092638','#020c15']} style={StyleSheet.absoluteFill}/>
 <ScrollView key={p.id} contentContainerStyle={[s.scroll,{paddingTop:insets.top+18,paddingBottom:insets.bottom+24,paddingLeft:Math.max(insets.left,18),paddingRight:Math.max(insets.right,18)}]}>
 <View style={[s.layout,wide&&s.wide]}>
 <View style={[s.art,{height:hero},wide&&{flex:1}]}>{p.artContent??(source?<Image source={source} resizeMode="cover" style={StyleSheet.absoluteFill} accessible={false}/>:null)}<LinearGradient colors={['#03111e00','#03111e00','#051522']} locations={[0,.55,1]} style={StyleSheet.absoluteFill}/>{p.heroOverlay}<View style={s.imageTag}><Text style={s.tag}>{p.eyebrow}</Text></View></View>
 <View style={[s.copy,wide&&{flex:1,paddingLeft:34}]} onLayout={e=>{const next=Math.ceil(e.nativeEvent.layout.height);setMeasured(prev=>prev?.id===p.id&&prev.height===next?prev:{id:p.id,height:next});}}>
 {p.headingContent??<><Text style={s.eyebrow}>{p.eyebrow}</Text><Text accessibilityRole="header" style={[s.title,{fontSize:width<380?29:wide?39:36}]}>{p.title}</Text></>}<View style={s.rule}/>
 <View style={p.luma?{maxWidth:640,width:'94%',alignSelf:'center'}:undefined}>{p.typewriter===false?<Text style={s.body}>{p.body}</Text>:<TypewriterText key={p.id} text={p.body} style={s.body} reduceMotion={p.reduceMotion}/>}</View>
 {p.instructionContent??(p.instruction?<View style={s.hint}><Text style={s.hintLabel}>{t("storytemplate.the_way_forward")}</Text><Text style={s.hintText}>{p.instruction}</Text></View>:null)}
 {p.progress}<ContinueJourneyButton label={p.action} playIcon={false} onPress={p.onContinue} style={{marginTop:22}}/>
 {p.onSecondary?<Pressable accessibilityRole="button" onPress={p.onSecondary} style={s.secondary}><Text style={s.secondaryText}>{p.secondaryLabel??t("hud.return_home")}</Text></Pressable>:null}
 </View></View></ScrollView>{p.foreground}</View>;
}
const s=StyleSheet.create({root:{...StyleSheet.absoluteFill,zIndex:20,backgroundColor:'#03111e'},scroll:{flexGrow:1,width:'100%',maxWidth:1400,alignSelf:'center'},layout:{width:'100%',maxWidth:760,alignSelf:'center'},wide:{flexDirection:'row',alignItems:'center',maxWidth:1320},art:{overflow:'hidden',borderRadius:22,backgroundColor:'#071e30'},imageTag:{position:'absolute',bottom:24,left:24},tag:{fontSize:10,letterSpacing:2,color:'#bce9f2',fontWeight:'700'},copy:{paddingTop:20,width:'100%'},eyebrow:{color:'#f4ca77',fontSize:11,fontWeight:'800',letterSpacing:3,textAlign:'center'},title:{color:'#f1faff',fontWeight:'800',textAlign:'center',marginTop:12},rule:{width:42,height:3,backgroundColor:'#39e4f2',alignSelf:'center',marginVertical:20},body:{color:'#c1d8e5',fontSize:17,lineHeight:28,textAlign:'center'},hint:{marginTop:25,padding:20,borderRadius:20,borderWidth:1,borderColor:'#285b70',backgroundColor:'#041622bb'},hintLabel:{fontSize:12,fontWeight:'800',letterSpacing:2,color:'#57e5f4',marginBottom:12},hintText:{color:'#deecf4',fontSize:15,lineHeight:24},secondary:{minHeight:48,alignItems:'center',justifyContent:'center',marginTop:12},secondaryText:{color:'#73c4d6',fontSize:11,fontWeight:'800',letterSpacing:2}});
