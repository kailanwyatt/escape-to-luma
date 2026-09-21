import {useEffect, useRef, useState} from 'react';
import {Animated, AppState, Easing, Image, StyleSheet, View} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';

const ATLAS = require('../../assets/art/sparks/finale-sparks-atlas.png');
const HALO = require('../../assets/art/sparks/finale-soft-halo.png');
const WAVE = require('../../assets/art/sparks/finale-soft-wave.png');
// Change this to experiment with the emitted light; the Spark bodies keep their own colours.
const SPARK_GLOW_COLOUR = '#ffffff';
const COLOURS = ['#48dfff', '#ffd051', '#ff65d8', '#bb79ff', '#65f8cf', '#e8f6ff'];

export function useFinaleActive() {
  const [active, setActive] = useState(AppState.currentState == null || AppState.currentState === 'active');
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => setActive(state === 'active'));
    return () => sub.remove();
  }, []);
  return active;
}

function useGlow(seed: number, moving: boolean) {
  const value = useRef(new Animated.Value(.5)).current;
  useEffect(() => {
    if (!moving) { value.setValue(.5); return; }
    value.setValue((seed % 5) / 5);
    const duration = 1450 + (seed % 7) * 173;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(value, {toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false}),
      Animated.timing(value, {toValue: 0, duration: duration + 310, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false}),
    ]));
    loop.start();
    return () => loop.stop();
  }, [moving, seed, value]);
  return value;
}

/** The transparent atlas is clipped per sprite; characters are never baked into the scenery. */
function Sprite({variant, size, tint, opacity = 1}: {variant: number; size: number; tint?: string; opacity?: number}) {
  return <View style={{width: size, height: size, overflow: 'hidden', opacity}}>
    <Image source={ATLAS} accessible={false} resizeMode="stretch" fadeDuration={0} style={{
      position: 'absolute', width: size * 3, height: size * 2,
      left: -(variant % 3) * size, top: -Math.floor(variant / 3) * size, tintColor: tint,
    }}/>
  </View>;
}

function LivingSpark({size, variant, seed, moving, colour, travelling}: {size: number; variant: number; seed: number; moving: boolean; colour?: string; travelling: boolean}) {
  const pulse = useGlow(seed, moving);
  const emission = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    emission.setValue(0);
    if (!moving) return;
    const wave = Animated.loop(Animated.sequence([
      Animated.delay(400 + (seed % 5) * 190),
      Animated.timing(emission, {toValue:1,duration:2700+(seed%4)*230,easing:Easing.out(Easing.quad),useNativeDriver:true,isInteraction:false}),
      Animated.timing(emission, {toValue:0,duration:0,useNativeDriver:true,isInteraction:false}),
    ]));
    wave.start(); return () => wave.stop();
  }, [emission, moving, seed]);
  const tint = colour ?? COLOURS[variant];
  return <Animated.View style={{width: size, height: size, transform: [
    {translateY: pulse.interpolate({inputRange: [0, 1], outputRange: [3, -4]})},
    {scale: pulse.interpolate({inputRange: [0, 1], outputRange: [.975, 1.025]})},
  ]}}>
    {travelling ? <View style={{position:'absolute',left:size*.45,top:size*.13,width:size*2,height:size*.4,transform:[{rotate:'-29deg'}]}}>
      {[0,1,2].map(i=><LinearGradient key={i} colors={['#ffffffaa',`${tint}bb`,`${tint}00`]} locations={[0,.2,1]} start={{x:0,y:0}} end={{x:1,y:0}}
        style={{position:'absolute',left:0,top:size*(.11+i*.05),width:size*(1.8-i*.25),height:Math.max(1,size*(i===1?.06:.014)),borderRadius:size*.08}}/>)}
    </View> : null}
    <Animated.Image source={HALO} accessible={false} fadeDuration={0} style={{position:'absolute',left:-size*.4,top:-size*.4,width:size*1.8,height:size*1.8,tintColor:SPARK_GLOW_COLOUR,
      opacity:pulse.interpolate({inputRange:[0,1],outputRange:[.35,.64]}),
      transform:[{scale:pulse.interpolate({inputRange:[0,1],outputRange:[.96,1.12]})}],
    }}/>
    <Animated.Image source={WAVE} accessible={false} fadeDuration={0} style={{position:'absolute',left:0,top:0,width:size,height:size,tintColor:SPARK_GLOW_COLOUR,
      opacity:moving?emission.interpolate({inputRange:[0,.18,.50,1],outputRange:[0,.30,.15,0]}):0,
      transform:[{scale:emission.interpolate({inputRange:[0,1],outputRange:[1.02,1.95]})}],
    }}/>
    {colour ? <>
      <View style={{position: 'absolute', width: size * .70, height: size * .70, left: size * .15, top: size * .15, borderRadius: size, backgroundColor: colour}}/>
      <View style={StyleSheet.absoluteFill}><Sprite variant={5} size={size} tint={colour}/></View>
      <Sprite variant={5} size={size} opacity={.73}/>
    </> : <Sprite variant={variant} size={size}/>}
  </Animated.View>;
}

type Placement = {x: number; y: number; size: number; variant: number; lead?: boolean};
const GATHERING: Placement[] = [
  {x: .20, y: .09, size: .08, variant: 1}, {x: .64, y: .04, size: .065, variant: 2},
  {x: .40, y: .20, size: .09, variant: 4}, {x: .81, y: .16, size: .08, variant: 0},
  {x: .12, y: .37, size: .13, variant: 3}, {x: .78, y: .40, size: .13, variant: 1},
  {x: .47, y: .38, size: .17, variant: 0}, {x: .31, y: .48, size: .23, variant: 2},
  {x: .68, y: .53, size: .24, variant: 4}, {x: .13, y: .65, size: .18, variant: 1},
  {x: .91, y: .70, size: .17, variant: 2}, {x: .29, y: .74, size: .19, variant: 3},
  {x: .77, y: .80, size: .26, variant: 1},
  {x: .48, y: .82, size: .40, variant: 0, lead: true},
  {x: .17, y: .94, size: .17, variant: 4}, {x: .72, y: .97, size: .16, variant: 0},
];
const VOYAGERS: Placement[] = [
  {x: .78, y: .08, size: .045, variant: 1}, {x: .82, y: .12, size: .053, variant: 3},
  {x: .85, y: .17, size: .06, variant: 2}, {x: .85, y: .23, size: .067, variant: 0},
  {x: .81, y: .29, size: .08, variant: 4}, {x: .76, y: .35, size: .09, variant: 1},
  {x: .70, y: .41, size: .105, variant: 2}, {x: .67, y: .48, size: .13, variant: 3},
  {x: .63, y: .56, size: .16, variant: 0}, {x: .56, y: .64, size: .19, variant: 4},
  {x: .47, y: .72, size: .21, variant: 1}, {x: .35, y: .80, size: .24, variant: 2},
  {x: .18, y: .90, size: .40, variant: 0, lead: true},
];

export function FinaleSparks({page, width, height, colour, moving}: {page: number; width: number; height: number; colour: string; moving: boolean}) {
  const placements = page === 0 ? GATHERING : VOYAGERS;
  return <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{width, height}}>
    {placements.map((p, i) => {
      const size = width * p.size;
      return <View key={i} style={{position: 'absolute', left: p.x * width - size / 2, top: p.y * height - size / 2}}>
        <LivingSpark size={size} variant={p.variant} seed={i} moving={moving} colour={p.lead ? colour : undefined} travelling={page === 1}/>
      </View>;
    })}
  </View>;
}

// Coordinates refer to the uncropped 1024×1536 artwork, so light sources stay attached on rotation.
const ARRIVAL_LIGHTS = [[.49,.15], [.49,.28], [.32,.19], [.67,.20], [.16,.16], [.86,.23], [.17,.47], [.87,.48], [.27,.69], [.79,.70], [.50,.79], [.17,.83], [.91,.78]];
const VOYAGE_LIGHTS = [[.60,.10], [.60,.27], [.52,.29], [.76,.17], [.32,.14], [.68,.40], [.79,.36], [.34,.48], [.22,.52], [.06,.49], [.43,.65], [.77,.59]];

function LightPoint({x, y, index, scale, moving}: {x: number; y: number; index: number; scale: number; moving: boolean}) {
  const pulse = useGlow(index + 23, moving);
  const size = Math.min(90, 50 * scale);
  return <Animated.View style={{position: 'absolute', left: x - size / 2, top: y - size / 2,
    width: size, height: size, opacity: pulse.interpolate({inputRange: [0, 1], outputRange: [.18, .60]}),
    transform: [{scale: pulse.interpolate({inputRange: [0, 1], outputRange: [.7, 1.25]})}],
  }}><Image source={HALO} accessible={false} style={{width:size,height:size,tintColor:index % 3 === 0 ? '#83f3ff' : '#ffe4a0'}}/></Animated.View>;
}

export function FinaleLights({page, imageWidth, imageHeight, moving}: {page: number; imageWidth: number; imageHeight: number; moving: boolean}) {
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    {(page === 0 ? ARRIVAL_LIGHTS : VOYAGE_LIGHTS).map(([x,y],i) => <LightPoint key={i} x={x * imageWidth} y={y * imageHeight} index={i} scale={imageWidth / 700} moving={moving}/>)}
  </View>;
}

/** One grouped formation every 6–10 seconds; all four stars share the same flight clock. */
export function FinaleShootingStars({width, height, moving}: {width: number; height: number; moving: boolean}) {
  const travel = useRef(new Animated.Value(0)).current;
  const [pass, setPass] = useState(0);
  useEffect(() => {
    if (!moving) { travel.setValue(0); return; }
    let cancelled = false;
    const flight = Animated.sequence([
      Animated.delay(pass === 0 ? 1800 : [4800, 6900, 5600][pass % 3]),
      Animated.timing(travel, {toValue: 1, duration: 1400, easing: Easing.linear, useNativeDriver: true, isInteraction: false}),
    ]);
    travel.setValue(0);
    flight.start(({finished}) => {if (finished && !cancelled) setPass(n => n + 1);});
    return () => {cancelled = true; flight.stop();};
  }, [moving, pass, travel]);
  if (!moving) return null;
  const leftToRight = pass % 2 === 0;
  return <Animated.View pointerEvents="none" style={{position: 'absolute', left: -170, top: height * (.06 + (pass % 3) * .08),
    opacity: travel.interpolate({inputRange: [0,.06,.8,1], outputRange: [0,1,1,0]}),
    transform: [{translateX: travel.interpolate({inputRange: [0,1], outputRange: leftToRight ? [0,width + 340] : [width + 340,0]})},
      {translateY: travel.interpolate({inputRange: [0,1], outputRange: [0,height * .20]})}],
  }}>
    {[0,1,2,3].map(i => <View key={i} style={{position: 'absolute', left: i * -25, top: (i % 2) * 22 + i * 9, width: 100, height: 4,
      transform: [{rotate: leftToRight ? '15deg' : '165deg'}], shadowColor: '#9efaff', shadowOpacity: .9, shadowRadius: 7, shadowOffset: {width: 0,height: 0},
    }}><LinearGradient colors={['#9deaff00','#79eaff80','#ffffff']} start={{x:0,y:0}} end={{x:1,y:0}} style={{width:100,height:3,borderRadius:3}}/>
      <View style={{position:'absolute',right:0,top:-1,width:5,height:5,borderRadius:5,backgroundColor:'#fffdf1'}}/>
    </View>)}
  </Animated.View>;
}
