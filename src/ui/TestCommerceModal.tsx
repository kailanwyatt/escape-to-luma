import {t} from '../i18n';
import {useEffect,useState} from 'react';
import {Modal,Text,View,Pressable} from 'react-native';
import {ContinueJourneyButton} from '../design';
export type TestOffer={kind:'ad'|'pack';amount:number;finish:(completed:boolean)=>void};
export function TestCommerceModal({offer}:{offer:TestOffer|null}){
 const [seconds,setSeconds]=useState(5);
 useEffect(()=>{setSeconds(5);if(!offer||offer.kind!=='ad')return;const timer=setInterval(()=>setSeconds(s=>Math.max(0,s-1)),1000);return()=>clearInterval(timer);},[offer]);
 if(!offer)return null;
 return <Modal transparent visible animationType="fade" onRequestClose={()=>offer.finish(false)}><View style={{flex:1,backgroundColor:'#000c',justifyContent:'center',alignItems:'center',padding:24}}><View style={{width:'100%',maxWidth:480,padding:26,borderRadius:24,borderWidth:1,borderColor:'#398ba4',backgroundColor:'#061a2b',gap:20}}>
 <Text style={{color:'#ffc95b',letterSpacing:2}}>{t("testcommercemodal.development_simulation")}</Text><Text style={{color:'white',fontSize:26,fontWeight:'800'}}>{offer.kind==='ad'?t("shopscreen.recharge_spark"):t("testcommercemodal.shards", {value1: offer.amount})}</Text>
 <Text style={{color:'#b8d7e4',lineHeight:24}}>{offer.kind==='ad'?t("testcommercemodal.test_rewarded_ad_complete_the_countdown_to_receive_energy_closing", {value1: offer.amount}):t("testcommercemodal.this_is_a_test_pack_no_payment_will_be_taken_real_purchases_are_n")}</Text>
 <ContinueJourneyButton disabled={offer.kind==='ad'&&seconds>0} label={offer.kind==='ad'?(seconds>0?t("testcommercemodal.watching_s", {value1: seconds}):t("testcommercemodal.claim_energy")):t("testcommercemodal.add_test_shards")} playIcon={false} onPress={()=>offer.finish(true)}/>
 <Pressable accessibilityRole="button" onPress={()=>offer.finish(false)} style={{padding:14}}><Text style={{color:'#7ad8ed',textAlign:'center'}}>{t("hud.cancel")}</Text></Pressable>
 </View></View></Modal>;
}
