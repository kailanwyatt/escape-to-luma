import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ContinueJourneyButton} from '../design';
import type {StoryMoment} from '../campaign/StoryMoments';

export function StoryScreen({story,onContinue,onHome}:{story:StoryMoment;onContinue:()=>void;onHome:()=>void}) {
  const insets=useSafeAreaInsets();
  return <LinearGradient colors={['#06111d','#102d3e','#071019']} style={styles.screen}>
    <ScrollView contentContainerStyle={[styles.content,{paddingTop:insets.top+28,paddingBottom:insets.bottom+24}]}>
      <StoryIllustration kind={story.visual}/>
      <Text style={styles.eyebrow}>{story.eyebrow}</Text>
      <Text accessibilityRole="header" style={styles.title}>{story.title}</Text>
      <Text style={styles.body}>{story.body}</Text>
      {story.instruction ? <View style={styles.hint}><Text style={styles.hintLabel}>THE WAY FORWARD</Text><Text style={styles.hintText}>{story.instruction}</Text></View> : null}
      <ContinueJourneyButton label={story.action} playIcon={false} onPress={onContinue}/>
      <Pressable accessibilityRole="button" onPress={onHome} style={styles.home}><Text style={styles.homeText}>RETURN HOME</Text></Pressable>
    </ScrollView>
  </LinearGradient>;
}
const styles=StyleSheet.create({
  screen:{...StyleSheet.absoluteFill,zIndex:20},
  content:{flexGrow:1,justifyContent:'center',alignItems:'center',paddingHorizontal:24,width:'100%',maxWidth:540,alignSelf:'center'},
  glow:{width:112,height:112,borderRadius:56,backgroundColor:'#32caff0b',alignItems:'center',justifyContent:'center',marginBottom:24},
  innerGlow:{width:76,height:76,borderRadius:38,backgroundColor:'#51dcff18',alignItems:'center',justifyContent:'center'},
  spark:{width:42,height:42,borderRadius:21,backgroundColor:'#efffff',shadowColor:'#35cfff',shadowOpacity:1,shadowRadius:24,shadowOffset:{width:0,height:0}},
  eyebrow:{color:'#eec770',fontSize:11,fontWeight:'800',letterSpacing:2.4,textAlign:'center'},
  title:{color:'#f0fbff',fontSize:32,lineHeight:39,fontWeight:'800',textAlign:'center',marginTop:14},
  body:{color:'#c0d4dd',fontSize:17,lineHeight:27,textAlign:'center',marginTop:20},
  hint:{backgroundColor:'#07152199',borderWidth:1,borderColor:'#336077',borderRadius:16,padding:18,marginVertical:26,width:'100%'},
  hintLabel:{color:'#75ddf0',fontSize:10,fontWeight:'800',letterSpacing:1.8,marginBottom:9},
  hintText:{color:'#e0edf2',fontSize:15,lineHeight:23},
  home:{padding:18,marginTop:6},homeText:{color:'#86a5b5',fontWeight:'700',fontSize:11,letterSpacing:1.6},
});

/** Lightweight still compositions; safe with reduced motion and no asset loading. */
function StoryIllustration({kind}:{kind?:StoryMoment['visual']}) {
 if(!kind||kind==='signal')return <View accessible={false} style={styles.glow}><View style={styles.innerGlow}><View style={styles.spark}/></View></View>;
 const reunion=kind==='reunion',key=kind==='key';
 const accent=reunion?'#a7f9dd':key?'#f2c976':'#967dec';
 const nodes=reunion?[[25,68,17],[61,31,12],[205,40,15],[242,76,19],[194,109,10]]:key?[[30,95,9],[79,65,10],[133,81,11],[187,36,12],[246,55,19]]:[[136,62,24]];
 return <View accessible={false} importantForAccessibility="no-hide-descendants" style={{width:280,height:150,marginBottom:24,overflow:'hidden'}}>
   <LinearGradient colors={['#07152300',`${accent}18`,'#07152300']} style={{...StyleSheet.absoluteFill,borderRadius:75}}/>
   {key?[0,1,2,3].map(i=><View key={i} style={{position:'absolute',left:nodes[i][0]+5,top:nodes[i][1]+5,width:64,height:1,backgroundColor:accent,transform:[{rotate:i===0?'-30deg':i===1?'17deg':i===2?'-40deg':'18deg'}],transformOrigin:'left center'}}/>):null}
   {!key?<View style={{position:'absolute',left:99,top:33,width:82,height:82,borderRadius:41,borderWidth:1,borderColor:accent,opacity:.45,borderRightColor:reunion?accent:'transparent'}}/>:null}
   {nodes.map(([x,y,size],i)=><View key={i} style={{position:'absolute',left:x,top:y,width:size,height:size,borderRadius:size/2,backgroundColor:accent,shadowColor:accent,shadowRadius:14,shadowOpacity:.85,shadowOffset:{width:0,height:0}}}/>)}
   {reunion?<View style={[styles.spark,{position:'absolute',left:119,top:53,shadowColor:accent}]}/>:null}
 </View>;
}
