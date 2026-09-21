import {t} from '../i18n';
import {useEffect,useState} from 'react';
import {AccessibilityInfo,Pressable,StyleSheet,Text,View,type StyleProp,type TextStyle} from 'react-native';

/** Reserve the complete paragraph's layout so buttons never move while letters appear. */
export function TypewriterText({text,style,reduceMotion=false}:{text:string;style?:StyleProp<TextStyle>;reduceMotion?:boolean}){
 const [count,setCount]=useState(0),[revealed,setRevealed]=useState(false),[accessible,setAccessible]=useState(false);
 useEffect(()=>{let live=true;const apply=(v:boolean)=>{if(live)setAccessible(v);};void AccessibilityInfo.isScreenReaderEnabled().then(apply);const sub=AccessibilityInfo.addEventListener('screenReaderChanged',apply);return()=>{live=false;sub.remove();};},[]);
 useEffect(()=>{setCount(0);setRevealed(false);if(reduceMotion||accessible)return;const start=Date.now();const timer=setInterval(()=>{const n=Math.min(text.length,Math.floor((Date.now()-start)/19));setCount(n);if(n===text.length)clearInterval(timer);},38);return()=>clearInterval(timer);},[text,reduceMotion,accessible]);
 const done=revealed||reduceMotion||accessible||count>=text.length;
 return <Pressable accessibilityRole="button" accessibilityLabel={text} accessibilityHint={done?undefined:t("typewritertext.tap_to_reveal_the_complete_text")} onPress={()=>setRevealed(true)}>
  <View accessible={false} importantForAccessibility="no-hide-descendants"><Text style={[style,{opacity:0}]}>{text}</Text><Text style={[style,StyleSheet.absoluteFill]}>{done?text:text.slice(0,count)}</Text></View>
 </Pressable>;
}
