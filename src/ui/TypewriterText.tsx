import {t} from '../i18n';
import {useEffect,useState} from 'react';
import {AccessibilityInfo,Pressable,StyleSheet,Text,View,type StyleProp,type TextStyle} from 'react-native';

/** Base delay between keystrokes — paced like a mechanical typewriter, not a modern terminal. */
const CHAR_MS = 52;
/** Extra hold after sentence / clause punctuation. */
const PUNCTUATION_PAUSE_MS: Record<string, number> = {
  '.': 280,
  '!': 280,
  '?': 280,
  '…': 320,
  ',': 120,
  ';': 160,
  ':': 140,
  '—': 160,
  '-': 40,
  '\n': 220,
};

function delayAfterChar(char: string): number {
  return CHAR_MS + (PUNCTUATION_PAUSE_MS[char] ?? 0);
}

/** Reserve the complete paragraph's layout so buttons never move while letters appear. */
export function TypewriterText({text,style,reduceMotion=false}:{text:string;style?:StyleProp<TextStyle>;reduceMotion?:boolean}){
  const [count,setCount]=useState(0),[revealed,setRevealed]=useState(false),[accessible,setAccessible]=useState(false);
  useEffect(()=>{let live=true;const apply=(v:boolean)=>{if(live)setAccessible(v);};void AccessibilityInfo.isScreenReaderEnabled().then(apply);const sub=AccessibilityInfo.addEventListener('screenReaderChanged',apply);return()=>{live=false;sub.remove();};},[]);
  useEffect(()=>{
    setCount(0);
    setRevealed(false);
    if(reduceMotion||accessible||text.length===0)return;
    let index=0;
    let timer:ReturnType<typeof setTimeout>|undefined;
    const tick=()=>{
      index+=1;
      setCount(index);
      if(index>=text.length)return;
      timer=setTimeout(tick,delayAfterChar(text[index-1]!));
    };
    timer=setTimeout(tick,CHAR_MS+40);
    return()=>{if(timer)clearTimeout(timer);};
  },[text,reduceMotion,accessible]);
  const done=revealed||reduceMotion||accessible||count>=text.length;
  return <Pressable accessibilityRole="button" accessibilityLabel={text} accessibilityHint={done?undefined:t("typewritertext.tap_to_reveal_the_complete_text")} onPress={()=>setRevealed(true)}>
    <View accessible={false} importantForAccessibility="no-hide-descendants"><Text style={[style,{opacity:0}]}>{text}</Text><Text style={[style,StyleSheet.absoluteFill]}>{done?text:text.slice(0,count)}</Text></View>
  </Pressable>;
}
