import {TypewriterText} from './TypewriterText';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OPENING_BEATS } from '../scene/OpeningSequence';
export function CampaignOpening({stage, onSkip, onPause,reduceMotion=false}: {reduceMotion?:boolean;stage: number; onSkip: () => void; onPause: () => void}) {
  const insets = useSafeAreaInsets();
  const beat = OPENING_BEATS[Math.max(0, Math.min(OPENING_BEATS.length - 1, stage))];
  return <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
    <Pressable accessibilityRole="button" accessibilityLabel="Pause opening" onPress={onPause} style={[styles.pause, {top: insets.top + 12}]}><Text style={styles.label}>PAUSE</Text></Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel="Skip opening" onPress={onSkip} style={[styles.skip, {top: insets.top + 12}]}><Text style={styles.label}>SKIP</Text></Pressable>
    <View style={[styles.copy, {bottom: insets.bottom + 24}]}>
      <Text style={[styles.label,{fontSize:10,opacity:.7,marginBottom:8}]}>THE BEGINNING · {stage+1} / {OPENING_BEATS.length}</Text>
      <Text style={styles.label}>{beat.title}</Text>
      <TypewriterText key={stage} text={beat.caption} style={styles.caption} reduceMotion={reduceMotion}/>
      {stage===OPENING_BEATS.length-1?<Text style={[styles.label,{marginTop:14,fontSize:10}]}>DRAG TO AIM · PULL FOR POWER · RELEASE TO THROW</Text>:null}
      <View style={styles.progress}>{OPENING_BEATS.map((_, i) => <View key={i} style={[styles.dot, {opacity: i <= stage ? 1 : .2}]} />)}</View>
    </View>
  </View>;
}
const styles = StyleSheet.create({
  pause: {position: 'absolute', left: 20, padding: 16, borderRadius: 12, backgroundColor: '#071018dd'},
  skip: {position: 'absolute', right: 20, padding: 16, borderRadius: 12, backgroundColor: '#071018dd'},
  label: {color: '#8fefff', fontWeight: '800', fontSize: 12, letterSpacing: 2},
  copy: {position: 'absolute', left: 20, right: 20, padding: 20, borderRadius: 22, borderWidth:1,borderColor:'#286178', backgroundColor: '#041523ed',maxWidth:760,alignSelf:'center'},
  caption: {color: '#ecf3f5', fontSize: 15, lineHeight: 23, marginTop: 12},
  progress: {flexDirection: 'row', gap: 8, marginTop: 16},
  dot: {flex: 1, height: 2, backgroundColor: '#8fefff'},
});
