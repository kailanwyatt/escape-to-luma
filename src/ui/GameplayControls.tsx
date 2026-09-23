import {t} from '../i18n';
import {Pressable, StyleSheet, Text, View, useWindowDimensions} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {HudSnapshot} from '../game/GameState';
import {WORLDS} from '../campaign/worlds';
import {CurrencyIcon} from './CurrencyIcon';
import {color} from '../design';

/** Presentation only: all actions and resource values come from the existing game. */
export function GameplayHeader({hud,onBack,onTitlePress}:{hud:HudSnapshot;onBack:()=>void;onTitlePress?:()=>void}) {
  const insets=useSafeAreaInsets();
  const {width}=useWindowDimensions();
  const compact=width-insets.left-insets.right<420;
  const world=WORLDS.find(w=>hud.campaignLevel>=w.firstLevel&&hud.campaignLevel<=w.lastLevel);
  const local=world ? hud.campaignLevel-world.firstLevel+1 : hud.campaignLevel;
  const total=world ? world.lastLevel-world.firstLevel+1 : 0;
  const energy=hud.unlimitedEnergy?'∞':`${hud.energy}/${hud.maxEnergy}`;
  const worldName=hud.campaignWorldName?.toUpperCase() ?? '';
  const title=total>0
    ? t("gameplaycontrols.l", {value1: hud.campaignLevel, value2: local, value3: total, value4: worldName})
    : t("gameplaycontrols.l", {value1: hud.campaignLevel, value2: hud.campaignLevel, value3: hud.campaignLevel, value4: worldName});
  return <View pointerEvents="box-none" style={[s.header,{paddingTop:insets.top+8,paddingLeft:insets.left+12,paddingRight:insets.right+12}]}>
    <Pressable accessibilityRole="button" accessibilityLabel={t("gameplaycontrols.pause_game")} onPress={onBack} style={({pressed})=>[s.back,pressed&&s.pressed]}>
      <View pointerEvents="none" style={s.backArrow}/>
    </Pressable>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("gameplaycontrols.level_of", {value1: hud.campaignLevel, value2: local, value3: total || hud.campaignLevel, value4: hud.campaignWorldName})}
      accessibilityHint={t("gameplaycontrols.open_journey")}
      disabled={!onTitlePress}
      onPress={onTitlePress}
      style={({pressed})=>[s.level,pressed&&onTitlePress&&s.pressed]}
    >
      <Text style={[s.levelTitle,compact&&s.smallTitle]} numberOfLines={1}>{title}</Text>
      {total>0?<View style={s.track}>
        {Array.from({length:total},(_,i)=><View key={i} style={[s.dot,i===local-1&&s.currentDot]}/>)}
      </View>:null}
      {hud.windActive?<Text style={s.wind}>{hud.windDirection==='left'?t("gameplaycontrols.wind"):t("gameplaycontrols.wind_2")}</Text>:null}
    </Pressable>
    <View pointerEvents="none" accessible accessibilityLabel={t("gameplaycontrols.energy_shards", {value1: energy, value2: hud.shards})} style={[s.resources,compact&&{gap:3,paddingHorizontal:6}]}>
      <CurrencyIcon kind="energy" size={compact?20:26}/><Text style={[s.value,compact&&s.smallValue]}>{energy}</Text>
      {hud.unlimitedEnergy&&hud.overchargeRemainingLabel?<Text style={[s.overcharge,compact&&s.smallOvercharge]}>{hud.overchargeRemainingLabel}</Text>:null}
      <CurrencyIcon kind="shard" size={compact?20:26}/><Text style={[s.value,compact&&s.smallValue]}>{hud.shards.toLocaleString()}</Text>
    </View>
  </View>;
}

export function GameplayBoostButton({count,disabled,onPress,bottom}:{count:number;disabled:boolean;onPress:()=>void;bottom:number}) {
  const insets=useSafeAreaInsets();
  return <View pointerEvents="box-none" style={[s.floating,{right:insets.right+16,bottom}]}>
    <Pressable accessibilityRole="button" accessibilityLabel={t("gameplaycontrols.boosts", {value1: count>0?t("gameplaycontrols.in_your_kit", {value1: count}):''})}
      accessibilityHint={disabled?t("gameplaycontrols.available_before_launching_on_levels_after_level_five"):t("gameplaycontrols.choose_boosts_for_this_attempt")}
      accessibilityState={{disabled}} disabled={disabled} onPress={onPress}
      style={({pressed})=>[s.boost,disabled&&s.disabled,pressed&&s.pressed]}>
      <LinearGradient pointerEvents="none" colors={['#075276','#02121f','#063653']} style={s.boostFill}>
        <View style={s.chevron}/><View style={s.chevron}/>
      </LinearGradient>
      {count>0?<View pointerEvents="none" style={s.badge}><Text style={s.badgeText}>{count>99?'99+':count}</Text></View>:null}
    </Pressable>
    <Text pointerEvents="none" style={[s.boostLabel,disabled&&s.disabled]}>{t("gameplaycontrols.boosts_2")}</Text>
  </View>;
}
const s=StyleSheet.create({
 header:{flexDirection:'row',alignItems:'center',gap:8,paddingBottom:8},
 back:{width:44,height:44,borderRadius:22,borderWidth:1,borderColor:color.cyanBright,backgroundColor:'rgba(2,12,22,0.8)',alignItems:'center',justifyContent:'center'},
 backArrow:{width:14,height:14,borderLeftWidth:3,borderBottomWidth:3,borderColor:color.cyanBright,transform:[{rotate:'45deg'}],marginLeft:6},
 pressed:{opacity:0.7},
 level:{flex:1,minWidth:0,alignItems:'center',maxWidth:420,marginHorizontal:'auto'},
 levelTitle:{color:color.cyanBright,fontSize:12,fontWeight:'700',letterSpacing:1.4,textAlign:'center'},
 smallTitle:{fontSize:10,letterSpacing:0.5},
 track:{flexDirection:'row',gap:3,alignItems:'center',marginTop:8,maxWidth:'100%'},
 dot:{width:4,height:4,borderRadius:2,backgroundColor:'#34586b',flexShrink:1},
 currentDot:{backgroundColor:color.cyanBright,width:7,height:7,borderRadius:4},
 wind:{color:color.cyanBright,fontSize:9,letterSpacing:1,marginTop:4},
 resources:{flexDirection:'row',alignItems:'center',gap:5,borderRadius:24,borderWidth:1,borderColor:'rgba(65,215,255,0.35)',backgroundColor:'rgba(2,12,22,0.8)',paddingHorizontal:10,minHeight:42},
 value:{color:color.cream,fontSize:15,fontWeight:'800',fontVariant:['tabular-nums']},
 smallValue:{fontSize:12},
 overcharge:{color:color.cyanBright,fontSize:9,fontWeight:'700',letterSpacing:0.4,marginLeft:-2},
 smallOvercharge:{fontSize:8},
 floating:{position:'absolute',alignItems:'center',width:72},
 boost:{width:68,height:68,borderRadius:34,borderWidth:2,borderColor:color.cyanBright,padding:4,shadowColor:color.cyanBright,shadowOpacity:0.35,shadowRadius:8,shadowOffset:{width:0,height:0}},
 boostFill:{flex:1,borderRadius:30,alignItems:'center',justifyContent:'center',paddingTop:10},
 chevron:{width:21,height:21,borderTopWidth:4,borderLeftWidth:4,borderColor:color.cyanBright,transform:[{rotate:'45deg'}],marginTop:-6},
 badge:{position:'absolute',right:-5,top:-6,minWidth:24,height:24,paddingHorizontal:4,borderRadius:12,backgroundColor:color.cyanBright,borderWidth:2,borderColor:'#032133',alignItems:'center',justifyContent:'center'},
 badgeText:{color:'#032133',fontSize:11,fontWeight:'900'},
 boostLabel:{color:color.cyanBright,fontSize:9,fontWeight:'800',letterSpacing:2,marginTop:6},
 disabled:{opacity:0.4},
});
