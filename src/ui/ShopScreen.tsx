import {LinearGradient} from 'expo-linear-gradient';
import {NavIcon} from '../design/components/NavIcon';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ECONOMY } from '../config/economy';
import { RELEASE_POLICY } from '../config/release';
import { BackButton, Screen, ScreenTitle, color, space } from '../design';
import type { PersistentGameData } from '../persistence/GameSave';

type Props = {
  save: PersistentGameData;
  onBuyBoost: (id: 'guidance' | 'slowField' | 'secondChance') => void;
  onWatchEnergy: () => void;
  onBuyUnlimited: (hours: 24 | 168) => void;
  onBack: () => void;
};

export function ShopScreen({ save, onBuyBoost, onWatchEnergy, onBuyUnlimited, onBack }: Props) {
  const campaign = save.campaign;

  return (
    <Screen scroll={false}>
      <ScreenTitle eyebrow="THE WORKSHOP" title="Ready for what’s next" meta={`◆ ${campaign.shards} SHARDS · ⚡ ${campaign.currentEnergy}/${ECONOMY.maxEnergy}`} />
      <ScrollView contentContainerStyle={styles.list}>
        {RELEASE_POLICY.adsEnabled || RELEASE_POLICY.purchasesEnabled ? (
          <>
            <Text style={styles.section}>ENERGY</Text>
            <Pressable style={styles.row} onPress={onWatchEnergy}>
              <Text style={styles.label}>WATCH AD · +{ECONOMY.rewardedAdEnergyAmount} ENERGY</Text>
              <Text style={styles.meta}>OPTIONAL</Text>
            </Pressable>
            <Pressable style={styles.row} onPress={() => onBuyUnlimited(24)}>
              <Text style={styles.label}>UNLIMITED ENERGY · 24H</Text>
              <Text style={styles.meta}>{ECONOMY.mockUnlimitedEnergy24hLabel}</Text>
            </Pressable>
            <Pressable style={styles.row} onPress={() => onBuyUnlimited(168)}>
              <Text style={styles.label}>UNLIMITED ENERGY · 7D</Text>
              <Text style={styles.meta}>{ECONOMY.mockUnlimitedEnergy7dLabel}</Text>
            </Pressable>
          </>
        ) : null}

        <LinearGradient colors={['#17384A','#0B1B2B']} style={{padding:22,borderRadius:24,marginTop:8,borderWidth:1,borderColor:'#2B5364'}}>
          <Text style={{color:color.cyanBright,fontSize:11,letterSpacing:2,fontWeight:'800'}}>PREPARE FOR THE NEXT LEAP</Text>
          <Text style={{color:color.cream,fontSize:27,fontWeight:'700',marginTop:10}}>A little help.
A little further.</Text>
          <Text style={[styles.blurb,{marginTop:12}]}>Spend earned Shards on optional boosts. Choose when to use them before a level.</Text>
        </LinearGradient>
        <Text style={styles.section}>FLIGHT ESSENTIALS</Text>
        {([
          ['guidance','Guidance','See the route ahead before committing to your shot.','journey'],
          ['slowField','Slow field','Give yourself more time to read moving obstacles.','stats'],
          ['secondChance','Second chance','Carry an extra chance into a difficult level.','sparks'],
        ] as const).map(([id,name,description,icon])=>{
          const affordable=campaign.shards>=ECONOMY.boostCosts[id];
          return <View key={id} style={{backgroundColor:'#0C1B29',borderRadius:20,padding:18,marginBottom:12,borderWidth:1,borderColor:'#284152'}}>
            <View style={{flexDirection:'row',gap:14,alignItems:'center'}}><NavIcon name={icon}/><View style={{flex:1}}><Text style={{color:color.cream,fontSize:18,fontWeight:'800'}}>{name}</Text><Text style={[styles.meta,{marginTop:5}]}>IN YOUR KIT · {campaign.boostInventory[id]}</Text></View></View>
            <Text style={[styles.blurb,{marginVertical:12}]}>{description}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={`Buy ${name} for ${ECONOMY.boostCosts[id]} Shards`} accessibilityState={{disabled:!affordable}} disabled={!affordable} onPress={()=>onBuyBoost(id)} style={{padding:13,borderRadius:12,alignItems:'center',backgroundColor:affordable?'#EFC66D':'#1B2B38'}}><Text style={{fontWeight:'800',color:affordable?'#17202A':color.creamFaint}}>{affordable?'GET BOOST':'NEED MORE SHARDS'} · {ECONOMY.boostCosts[id]} ◆</Text></Pressable>
          </View>;
        })}
        <Text style={[styles.blurb,{textAlign:'center',marginTop:12}]}>Earn Shards by completing levels and improving your shots.</Text>
      </ScrollView>
      <BackButton onPress={onBack} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: space.lg },
  section: { marginTop: space.lg, marginBottom: space.xs, color: color.cyanBright, fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: space.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: color.stroke },
  label: { color: color.cream, fontSize: 13, fontWeight: '800', flex: 1, paddingRight: space.xs },
  meta: { color: color.creamFaint, fontSize: 11, fontWeight: '700' },
  blurb: { color: color.creamFaint, fontSize: 12, fontWeight: '600', lineHeight: 17, marginBottom: space.xs },
});
