import {useEffect,useRef,useState} from 'react';
import {Animated,Easing,StyleSheet,View} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';

/** One shared schedule: a four-second sweep, then 8–12 seconds of quiet. */
export function useBorderSpotlight(reduceMotion:boolean){
 const [active,setActive]=useState(-1);
 useEffect(()=>{
  setActive(-1);if(reduceMotion)return;
  let timer:ReturnType<typeof setTimeout>,previous=-1,disposed=false;
  const wait=()=>{timer=setTimeout(()=>{
   if(disposed)return;
   let next=Math.floor(Math.random()*6);if(next===previous)next=(next+1)%6;
   previous=next;setActive(next);
   timer=setTimeout(()=>{if(disposed)return;setActive(-1);wait();},4200);
  },8000+Math.random()*4000);};
  wait();return()=>{disposed=true;clearTimeout(timer);};
 },[reduceMotion]);
 return active;
}

/** Rounded perimeter segments form a fading gradient tail without covering card contents. */
export function BorderGlint({active=false,radius=12}:{active?:boolean;radius?:number}){
 const clock=useRef(new Animated.Value(0)).current;
 const [size,setSize]=useState({width:0,height:0});
 useEffect(()=>{clock.setValue(0);if(!active)return;const animation=Animated.timing(clock,{toValue:1,duration:4000,easing:Easing.linear,useNativeDriver:true});animation.start();return()=>animation.stop();},[clock,active]);
 const w=size.width-2,h=size.height-2,r=Math.min(radius,w/2,h/2);
 // Clockwise traversal, including round corners rather than cutting across them.
 const lengths=[w-2*r,Math.PI*r/2,h-2*r,Math.PI*r/2,w-2*r,Math.PI*r/2,h-2*r,Math.PI*r/2];
 const perimeter=lengths.reduce((a,b)=>a+b,0);
 const point=(u:number)=>{
  let d=u*perimeter;
  for(let i=0;i<8;i++){
   if(d<=lengths[i]||i===7){const t=lengths[i]>0?d/lengths[i]:0;
    if(i===0)return {x:r+d,y:0};if(i===2)return {x:w,y:r+d};if(i===4)return {x:w-r-d,y:h};if(i===6)return {x:0,y:h-r-d};
    const corner=(i-1)/2,angle=-Math.PI/2+corner*Math.PI/2+t*Math.PI/2;
    return {x:([w-r,w-r,r,r][corner])+Math.cos(angle)*r,y:([r,h-r,h-r,r][corner])+Math.sin(angle)*r};
   }d-=lengths[i];
  }return {x:r,y:0};
 };
 const times=Array.from({length:33},(_,i)=>i/32);
 return <View pointerEvents="none" accessible={false} style={[StyleSheet.absoluteFill,{zIndex:2,borderRadius:radius,overflow:'hidden'}]} onLayout={e=>setSize(e.nativeEvent.layout)}>
 {active&&w>0&&h>0?<Animated.View style={[StyleSheet.absoluteFill,{opacity:clock.interpolate({inputRange:[0,.08,.9,1],outputRange:[0,1,1,0]})}]}>
 {Array.from({length:112},(_,i)=>{
  const a=point(i/112),b=point((i+1)/112),length=Math.hypot(b.x-a.x,b.y-a.y)+.6;
  const values=times.map(t=>{const behind=((t-i/112)%1+1)%1;return behind<.32?Math.pow(1-behind/.32,1.4):0;});
  return <Animated.View key={i} style={{position:'absolute',left:1+(a.x+b.x)/2-length/2,top:1+(a.y+b.y)/2-1,width:length,height:2,borderRadius:1,backgroundColor:'#a2f6ff',opacity:clock.interpolate({inputRange:times,outputRange:values}),transform:[{rotate:`${Math.atan2(b.y-a.y,b.x-a.x)}rad`}]}}/>;
 })}</Animated.View>:null}
 </View>;
}
export function HomeSpark({reduceMotion=false}:{reduceMotion?:boolean}){
 const energy=useRef(new Animated.Value(0)).current;
 useEffect(()=>{if(reduceMotion){energy.setValue(.45);return;}const loop=Animated.loop(Animated.sequence([Animated.timing(energy,{toValue:.65,duration:1200,useNativeDriver:true}),Animated.timing(energy,{toValue:1,duration:180,useNativeDriver:true}),Animated.timing(energy,{toValue:.5,duration:260,useNativeDriver:true}),Animated.timing(energy,{toValue:.8,duration:420,useNativeDriver:true}),Animated.timing(energy,{toValue:0,duration:1600,useNativeDriver:true})]));loop.start();return()=>loop.stop();},[energy,reduceMotion]);
 return <View pointerEvents="none" accessible={false} style={{width:50,height:50,alignItems:'center',justifyContent:'center'}}>
 {[160,120,84].map((size,i)=><Animated.View key={size} style={{position:'absolute',width:size,height:size,borderRadius:size/2,opacity:energy.interpolate({inputRange:[0,1],outputRange:[.12+i*.06,.28+i*.1]}),transform:[{scale:energy.interpolate({inputRange:[0,1],outputRange:[.85,1.2+i*.03]})}]}}><LinearGradient colors={['#0aaeff00','#11ccff55','#63f2ff99','#0aaeff00']} style={{flex:1,borderRadius:size/2}}/></Animated.View>)}
 {[15,73,135,205,267].map((angle,i)=><Animated.View key={angle} style={{position:'absolute',width:7+i%2*3,height:110+i*7,opacity:energy.interpolate({inputRange:[0,.5,1],outputRange:[.08,.22,.5]}),transform:[{rotate:`${angle}deg`},{scaleY:energy.interpolate({inputRange:[0,1],outputRange:[.7,1.15]})}]}}><LinearGradient colors={['#36dfff00','#70efff99','#e2ffffbb','#36dfff00']} style={{flex:1,borderRadius:30}}/></Animated.View>)}
 <Animated.View style={{shadowColor:'#54eaff',shadowRadius:24,shadowOpacity:1,shadowOffset:{width:0,height:0},transform:[{scale:energy.interpolate({inputRange:[0,1],outputRange:[.96,1.06]})}]}}><LinearGradient colors={['#ffffff','#f0ffff','#8ff5ff','#29cbed']} style={{width:47,height:47,borderRadius:24,borderColor:'#dcffff',borderWidth:1}}/></Animated.View>
 </View>;
}
