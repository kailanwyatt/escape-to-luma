import {t} from '../i18n';
import {useEffect,useState} from 'react';
import {Modal,Pressable,StyleSheet,Text,View} from 'react-native';
import {ContinueJourneyButton,fontDisplay,fontUi} from '../design';
import {ECONOMY} from '../config/economy';
import {formatCountdown,msUntilFullEnergy,msUntilNextEnergy,regenerateEnergy} from '../economy/energy';
import {hasUnlimitedEnergy,type PersistentGameData} from '../persistence/GameSave';
import {CurrencyIcon} from './CurrencyIcon';

type Props={
 visible:boolean;
 save:PersistentGameData;
 onClose:()=>void;
 onShop:()=>void;
 onWatch:()=>Promise<void>;
};

export function ResourceModal({visible,save,onClose,onShop,onWatch}:Props){
 const [now,setNow]=useState(Date.now),[busy,setBusy]=useState(false);
 useEffect(()=>{if(!visible)return;const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[visible]);
 useEffect(()=>{if(!visible)setBusy(false);},[visible]);
 const c=save.campaign,unlimited=hasUnlimitedEnergy(c,now);
 const energy=regenerateEnergy(c.currentEnergy,c.energyUpdatedAt,now,unlimited);
 const nextMs=msUntilNextEnergy(energy.energy,energy.energyUpdatedAt,now);
 const fullMs=msUntilFullEnergy(energy.energy,energy.energyUpdatedAt,now);
 const fullMinutes=Math.max(0,Math.ceil(fullMs/60000));
 const full=unlimited||energy.energy>=ECONOMY.maxEnergy;
 const dev=typeof __DEV__!=='undefined'&&__DEV__;
 const watch=()=>{setBusy(true);void onWatch().finally(()=>setBusy(false));};
 return <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
  <Pressable accessibilityRole="button" accessibilityLabel={t('resourcemodal.close')} onPress={onClose} style={s.backdrop}>
   <Pressable onPress={(e)=>e.stopPropagation()} style={s.card}>
    <Text style={s.eyebrow}>{t('resourcemodal.supplies')}</Text>
    <View style={s.row}>
     <CurrencyIcon kind="energy" size={36}/>
     <View style={{flex:1}}>
      <Text style={s.value}>{unlimited?'∞':`${energy.energy} / ${ECONOMY.maxEnergy}`}</Text>
      <Text style={s.label}>{t('statuspanel.energy')}</Text>
     </View>
     <CurrencyIcon kind="shard" size={30}/>
     <View>
      <Text style={s.value}>{c.shards.toLocaleString()}</Text>
      <Text style={s.label}>{t('statuspanel.shards')}</Text>
     </View>
    </View>
    <View style={s.meter}>
     <Text style={s.meterTitle}>{full?t('homescreen.full'):t('outofenergyscreen.next_energy_in')}{full?'':formatCountdown(nextMs)}</Text>
     <Text style={s.meterCopy}>{unlimited?t('homescreen.unlimited'):full?t('resourcemodal.energy_is_full'):t('resourcemodal.full_in_minutes',{value1:fullMinutes})}</Text>
    </View>
    <ContinueJourneyButton
     disabled={busy||full||!dev}
     label={busy?t('outofenergyscreen.please_wait'):t('outofenergyscreen.watch_ad_5_energy',{value1:dev?t('debugoverlay.test'):''})}
     playIcon={false}
     onPress={watch}
    />
    <Pressable accessibilityRole="button" accessibilityLabel={t('resourcemodal.buy_shards')} onPress={()=>{onClose();onShop();}} style={s.shop}>
     <View style={s.shopRow}><CurrencyIcon kind="shard" size={22}/><Text style={s.shopText}>{t('resourcemodal.buy_shards')}</Text></View>
    </Pressable>
    <Text style={s.footnote}>{dev?t('outofenergyscreen.development_test_ad_no_live_advertising_or_real_payments'):t('outofenergyscreen.ads_are_not_available_yet_wait_for_energy_or_visit_the_shop')}</Text>
    <Pressable accessibilityRole="button" onPress={onClose} style={s.close}><Text style={s.closeText}>{t('hud.cancel')}</Text></Pressable>
   </Pressable>
  </Pressable>
 </Modal>;
}

const s=StyleSheet.create({
 backdrop:{flex:1,backgroundColor:'#000c',justifyContent:'center',alignItems:'center',padding:24},
 card:{width:'100%',maxWidth:420,padding:24,borderRadius:22,borderWidth:1,borderColor:'#398ba4',backgroundColor:'#061a2b',gap:16},
 eyebrow:{color:'#ffc95b',letterSpacing:2,fontFamily:fontUi,fontSize:11},
 row:{flexDirection:'row',alignItems:'center',gap:10},
 value:{color:'#F0FAFF',fontSize:22,fontFamily:fontDisplay,letterSpacing:1},
 label:{color:'#7FD6F5',fontSize:9,letterSpacing:1.6,marginTop:2},
 meter:{padding:14,borderRadius:14,borderWidth:1,borderColor:'#246786',backgroundColor:'#041824',gap:6},
 meterTitle:{color:'#67deef',fontWeight:'800',letterSpacing:1},
 meterCopy:{color:'#b8d7e4',lineHeight:20},
 shop:{padding:16,borderRadius:16,borderWidth:1,borderColor:'#4092ad'},
 shopRow:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8},
 shopText:{color:'#8de8f6',fontWeight:'800',letterSpacing:1},
 footnote:{color:'#8aa8bb',textAlign:'center',fontSize:12,lineHeight:18},
 close:{padding:10},
 closeText:{color:'#7ad8ed',textAlign:'center'},
});
