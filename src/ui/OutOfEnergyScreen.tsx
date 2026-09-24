import {t} from '../i18n';
import {useEffect,useState} from 'react';
import {Text,View,Pressable,ScrollView,StyleSheet} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ContinueJourneyButton} from '../design';
import {ECONOMY} from '../config/economy';
import {regenerateEnergy,msUntilNextEnergy,formatCountdown} from '../economy/energy';
import type {PersistentGameData} from '../persistence/GameSave';
import {CurrencyIcon} from './CurrencyIcon';

export function OutOfEnergyScreen({save,onRetry,onLater,onShop,onWatch,onOvercharge}:{save:PersistentGameData;onRetry:()=>void;onLater:()=>void;onShop:()=>void;onWatch:()=>Promise<void>;onOvercharge?:()=>void}){
 const insets=useSafeAreaInsets(),[now,setNow]=useState(Date.now()),[busy,setBusy]=useState(false);
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[]);
 const c=save.campaign,e=regenerateEnergy(c.currentEnergy,c.energyUpdatedAt,now),dev=typeof __DEV__!=='undefined'&&__DEV__;
 const ready=e.energy>0;
 return <View style={s.root}>
  <LinearGradient colors={['#03101c','#041421','#071a2a']} style={StyleSheet.absoluteFill}/>
  <ScrollView contentContainerStyle={{flexGrow:1,justifyContent:'center',alignItems:'center',padding:26,paddingTop:insets.top+26,paddingBottom:insets.bottom+26}}>
   <View style={s.card}>
    <View style={s.hero} accessible={false}>
     <View style={[s.halo,ready?s.haloReady:s.haloEmpty]}/>
     <CurrencyIcon kind="energy" size={72}/>
     {!ready?<View style={s.emptyRing}/>:null}
    </View>
    <Text style={s.title}>{ready?t("outofenergyscreen.spark_is_ready_again"):t("outofenergyscreen.spark_needs_a_recharge")}</Text>
    <Text style={s.body}>{ready?t("outofenergyscreen.energy_available_continue_your_journey", {value1: e.energy}):t("outofenergyscreen.your_progress_is_safe_energy_returns_automatically_or_you_can_cho")}</Text>
    <View style={s.meter}>
     <CurrencyIcon kind="energy" size={22}/>
     <Text style={s.meterText}>{t("outofenergyscreen.next_energy_in")}{formatCountdown(msUntilNextEnergy(e.energy,e.energyUpdatedAt,now))} · {e.energy}/{ECONOMY.maxEnergy}</Text>
    </View>
    {ready?<ContinueJourneyButton label={t("storymoments.continue_journey")} onPress={onRetry}/>:null}
    <ContinueJourneyButton disabled={busy||!dev||e.energy>=15} label={busy?t("outofenergyscreen.please_wait"):t("outofenergyscreen.watch_ad_5_energy", {value1: dev?t("debugoverlay.test"):''})} playIcon={false} onPress={()=>{setBusy(true);void onWatch().finally(()=>setBusy(false));}}/>
    {e.energy<=0&&onOvercharge?<Pressable accessibilityRole="button" onPress={onOvercharge} style={s.overcharge}><Text style={s.overchargeTitle}>{t("outofenergyscreen.overcharge_offer")}</Text><Text style={s.overchargeHint}>{t("outofenergyscreen.overcharge_offer_hint")}</Text></Pressable>:null}
    <Pressable accessibilityRole="button" onPress={onShop} style={s.shop}><View style={s.shopRow}><CurrencyIcon kind="shard" size={22}/><Text style={s.shopText}>{t("outofenergyscreen.shop_energy_shards")}</Text></View></Pressable>
    <Text style={s.footnote}>{dev?t("outofenergyscreen.development_test_ad_no_live_advertising_or_real_payments"):t("outofenergyscreen.ads_are_not_available_yet_wait_for_energy_or_visit_the_shop")}</Text>
    <Pressable accessibilityRole="button" onPress={onLater} style={s.later}><Text style={s.laterText}>{t("hud.return_home")}</Text></Pressable>
   </View>
  </ScrollView>
 </View>;
}

const s=StyleSheet.create({
 root:{position:'absolute',inset:0},
 card:{width:'100%',maxWidth:520,gap:18,alignItems:'center'},
 hero:{width:132,height:132,alignItems:'center',justifyContent:'center',marginBottom:4},
 halo:{position:'absolute',width:120,height:120,borderRadius:60},
 haloReady:{backgroundColor:'#1a6a7a55'},
 haloEmpty:{backgroundColor:'#12304088'},
 emptyRing:{position:'absolute',width:96,height:96,borderRadius:48,borderWidth:2,borderColor:'#3a6a7a66'},
 title:{color:'white',fontSize:30,fontWeight:'800',textAlign:'center'},
 body:{color:'#bed5e1',lineHeight:25,textAlign:'center'},
 meter:{flexDirection:'row',alignItems:'center',gap:8},
 meterText:{color:'#67deef',textAlign:'center'},
 overcharge:{width:'100%',padding:20,borderRadius:18,borderWidth:1,borderColor:'#ffe16b',backgroundColor:'#1a1408'},
 overchargeTitle:{color:'#ffe16b',textAlign:'center',fontWeight:'800'},
 overchargeHint:{color:'#c9b87a',textAlign:'center',marginTop:6,fontSize:12},
 shop:{width:'100%',padding:20,borderRadius:18,borderWidth:1,borderColor:'#4092ad'},
 shopRow:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8},
 shopText:{color:'#8de8f6',textAlign:'center',fontWeight:'800'},
 footnote:{color:'#8aa8bb',textAlign:'center',fontSize:12},
 later:{padding:16},
 laterText:{color:'#a4cad9',textAlign:'center'},
});
