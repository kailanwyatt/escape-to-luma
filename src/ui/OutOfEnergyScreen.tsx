import {t} from '../i18n';
import {useEffect,useState} from 'react';
import {Text,View,Pressable,ScrollView} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ContinueJourneyButton} from '../design';
import {ECONOMY} from '../config/economy';
import {regenerateEnergy,msUntilNextEnergy,formatCountdown} from '../economy/energy';
import type {PersistentGameData} from '../persistence/GameSave';
export function OutOfEnergyScreen({save,onRetry,onLater,onShop,onWatch}:{save:PersistentGameData;onRetry:()=>void;onLater:()=>void;onShop:()=>void;onWatch:()=>Promise<void>}){
 const insets=useSafeAreaInsets(),[now,setNow]=useState(Date.now()),[busy,setBusy]=useState(false);
 useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(t);},[]);
 const c=save.campaign,e=regenerateEnergy(c.currentEnergy,c.energyUpdatedAt,now),dev=typeof __DEV__!=='undefined'&&__DEV__;
 return <View style={{position:'absolute',inset:0,backgroundColor:'#041421'}}><ScrollView contentContainerStyle={{flexGrow:1,justifyContent:'center',alignItems:'center',padding:26,paddingTop:insets.top+26,paddingBottom:insets.bottom+26}}><View style={{width:'100%',maxWidth:520,gap:20}}>
 <Text style={{fontSize:68,color:'#5de5fa',textAlign:'center'}}>ϟ</Text><Text style={{color:'white',fontSize:30,fontWeight:'800',textAlign:'center'}}>{e.energy>0?t("outofenergyscreen.spark_is_ready_again"):t("outofenergyscreen.spark_needs_a_recharge")}</Text><Text style={{color:'#bed5e1',lineHeight:25,textAlign:'center'}}>{e.energy>0?t("outofenergyscreen.energy_available_continue_your_journey", {value1: e.energy}):t("outofenergyscreen.your_progress_is_safe_energy_returns_automatically_or_you_can_cho")}</Text>
 <Text style={{color:'#67deef',textAlign:'center'}}>{t("outofenergyscreen.next_energy_in")}{formatCountdown(msUntilNextEnergy(e.energy,e.energyUpdatedAt,now))} · {e.energy}/{ECONOMY.maxEnergy}</Text>
 {e.energy>0?<ContinueJourneyButton label={t("storymoments.continue_journey")} onPress={onRetry}/>:null}
 <ContinueJourneyButton disabled={busy||!dev||e.energy>=15} label={busy?t("outofenergyscreen.please_wait"):t("outofenergyscreen.watch_ad_5_energy", {value1: dev?t("debugoverlay.test"):''})} playIcon={false} onPress={()=>{setBusy(true);void onWatch().finally(()=>setBusy(false));}}/>
 <Pressable accessibilityRole="button" onPress={onShop} style={{padding:20,borderRadius:18,borderWidth:1,borderColor:'#4092ad'}}><Text style={{color:'#8de8f6',textAlign:'center',fontWeight:'800'}}>{t("outofenergyscreen.shop_energy_shards")}</Text></Pressable>
 <Text style={{color:'#8aa8bb',textAlign:'center',fontSize:12}}>{dev?t("outofenergyscreen.development_test_ad_no_live_advertising_or_real_payments"):t("outofenergyscreen.ads_are_not_available_yet_wait_for_energy_or_visit_the_shop")}</Text>
 <Pressable accessibilityRole="button" onPress={onLater} style={{padding:16}}><Text style={{color:'#a4cad9',textAlign:'center'}}>{t("hud.return_home")}</Text></Pressable></View></ScrollView></View>;
}
