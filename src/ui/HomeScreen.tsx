import {SettingsIcon} from '../design/components/SettingsIcon';
import {t, displayLabel} from '../i18n';
import {CurrencyIcon} from './CurrencyIcon';
import {BorderGlint,HomeSpark,useBorderSpotlight} from './HomeEffects';
import {LinearGradient} from 'expo-linear-gradient';
import {useEffect, useState} from 'react';
import {Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {TOTAL_CORE_LEVELS, worldForLevel} from '../campaign/worlds';
import {getCampaignLevel} from '../campaign/levels';
import {HOME_BRAND} from '../config/branding';
import {BrandWordmark} from '../design';
import {ECONOMY} from '../config/economy';
import {devLevelsUnlocked} from '../config/devAccess';
import {NavIcon} from '../design/components/NavIcon';
import {formatCountdown, msUntilNextEnergy, regenerateEnergy} from '../economy/energy';
import {hasUnlimitedEnergy, isEndlessUnlocked, type PersistentGameData} from '../persistence/GameSave';

const CITY_ART = require('../../assets/art/home/city-gateway.jpg');
type Props = {
  reduceMotion?:boolean;
  save: PersistentGameData; currentLevel: number;
  onContinue: () => void; onSelectLevel: (level: number) => void;
  onJourney: () => void; onSparks: () => void; onShop: () => void;
  onStats: () => void; onSettings: () => void; onEndless: () => void;
};

export function HomeScreen({reduceMotion=false,save, currentLevel, onContinue, onSelectLevel, onJourney, onSparks, onShop, onStats, onSettings, onEndless}: Props) {
  const insets = useSafeAreaInsets();
  const {width, height} = useWindowDimensions();
  const tablet = width >= 700;
  const landscape = width >= 900 && width > height;
  const sceneHeight = landscape ? Math.max(600, height - 48) : tablet ? Math.min(850, height * .72) : 0;
  const compact = width < 370;
  const [now, setNow] = useState(Date.now);
  const [selected, setSelected] = useState(currentLevel);
  const motionReduced=reduceMotion||save.settings.reduceMotion;
  const borderSpotlight=useBorderSpotlight(motionReduced);
  useEffect(() => setSelected(currentLevel), [currentLevel]);
  useEffect(() => {const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer);}, []);
  const c = save.campaign;
  const level = Math.max(1, Math.min(TOTAL_CORE_LEVELS, selected));
  const world = worldForLevel(level)!;
  const unlimited = hasUnlimitedEnergy(c, now);
  const energy = regenerateEnergy(c.currentEnergy, c.energyUpdatedAt, now, unlimited);
  const energyLabel = unlimited ? t("homescreen.unlimited") : energy.energy === ECONOMY.maxEnergy ? t("homescreen.full") : formatCountdown(msUntilNextEnergy(energy.energy, energy.energyUpdatedAt, now));
  const maxLevel = devLevelsUnlocked() ? TOTAL_CORE_LEVELS : c.highestUnlockedLevel;
  const start = Math.max(1, Math.min(TOTAL_CORE_LEVELS - 4, level - 2));
  const cleared = Object.values(c.completedLevels).filter(p => p.cleared).length;
  const play = () => c.campaignCompleted && level === currentLevel ? onEndless() : level === currentLevel ? onContinue() : onSelectLevel(level);
  const nav = (name: string, label: string, action: () => void) => (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={action} style={({pressed}) => [s.nav, tablet && s.tabletNav, pressed && s.pressed]}>
      <BorderGlint active={borderSpotlight===['stats','sparks','shop','journey'].indexOf(name)}/><NavIcon name={name}/><Text style={s.navLabel}>{label}</Text>
    </Pressable>
  );
  return <View style={s.root}>
    <ScrollView contentContainerStyle={{alignItems:'center', paddingHorizontal:Math.max(insets.left,insets.right), flexGrow:1, paddingBottom:Math.max(insets.bottom, landscape ? 12 : 24)}}>
      <View style={[s.page, tablet && s.tabletPage, landscape && s.landscapePage, {paddingTop:Math.max(insets.top,12)}]}>
        <View style={[s.scene, landscape && {flex:1,minHeight:sceneHeight}, tablet && !landscape && {height:sceneHeight}]}>
        <View pointerEvents="none" style={[s.art, {height:tablet ? (landscape ? '100%' : sceneHeight + 130) : compact?570:660}]}>
          <Image source={CITY_ART} style={[StyleSheet.absoluteFill, {width:'100%',height:'100%'}]} resizeMode="cover"/>
          <LinearGradient colors={['rgba(0,15,29,.6)','transparent','transparent','#031522']} locations={[0,.25,.65,1]} style={StyleSheet.absoluteFill}/>
        </View>
        <View style={[s.resources, tablet && s.tabletResources]}>
          <Pressable accessibilityRole="button" accessibilityLabel={t("homescreen.settings")} onPress={onSettings} style={s.settings}><SettingsIcon/></Pressable>
          <View accessibilityLabel={t("homescreen.energy", {value1: unlimited?'unlimited':t("homescreen.of", {value1: energy.energy, value2: ECONOMY.maxEnergy}), value2: energyLabel})} style={s.resource}>
            <CurrencyIcon kind="energy" size={34}/><View><Text style={s.value}>{unlimited?'∞':`${energy.energy} / ${ECONOMY.maxEnergy}`}</Text><Text style={s.resourceLabel}>{energyLabel}</Text></View>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={t("homescreen.shards_open_shop", {value1: c.shards})} onPress={onShop} style={s.resource}>
            <BorderGlint active={borderSpotlight===4}/><CurrencyIcon kind="shard" size={29}/><View><Text style={s.value}>{c.shards.toLocaleString()}</Text><Text style={s.resourceLabel}>{t("statuspanel.shards")}</Text></View><Text style={s.plus}>+</Text>
          </Pressable>
        </View>
        <View style={[s.brand, tablet && {paddingTop:42}]}>
          <Text style={s.eyebrow}>{t("homescreen.predict_adapt_overcome")}</Text>
          <BrandWordmark size="hero" showSubtitle/>
        </View>
        <View style={[s.stage,tablet ? {flex:1,paddingHorizontal:32,paddingBottom:28} : {height:compact?265:310}]}>
          <View style={s.side}>{nav('stats',t("homescreen.stats"),onStats)}{nav('sparks',t("homescreen.sparks"),onSparks)}</View>
          <View pointerEvents="none" style={[s.sparkPlacement,tablet && {bottom:66,transform:[{scale:1.3}]}]}>
            <HomeSpark reduceMotion={motionReduced}/>
          </View>
          <View style={s.side}>{nav('shop',t("homescreen.shop"),onShop)}{nav('journey',t("homescreen.worlds"),onJourney)}</View>
        </View>
        </View>
        <View style={[s.controls,tablet && !landscape && s.tabletControls,landscape && s.landscapeControls]}>
        <Text style={s.tap}>{t("homescreen.your_next_leap_awaits")}</Text>
        <View style={s.playRow}>
          <Pressable accessibilityRole="button" accessibilityLabel={t("homescreen.previous_level")} disabled={level<=1} onPress={()=>setSelected(level-1)} style={[s.arrow,level<=1&&s.disabled]}><Text style={s.arrowText}>‹</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={c.campaignCompleted&&level===currentLevel?t("homescreen.endless_voyage"):t("homescreen.play_level", {value1: level})} onPress={play} style={({pressed})=>[s.play,pressed&&s.pressed]}>
            <LinearGradient colors={['#FFE05B','#FFC83D','#F5A623']} style={s.playInner}>
              <Text style={s.playLabel}>▶ {c.campaignCompleted&&level===currentLevel?t("homescreen.voyage"):t("homescreen.play")}</Text>
              <Text numberOfLines={1} adjustsFontSizeToFit style={s.playWorld}>{c.campaignCompleted&&level===currentLevel?t("voyage.title"):world.name}</Text><Text style={s.playLevel}>{c.campaignCompleted&&level===currentLevel?t("voyage.home_hint"):`${t("hud.level")}${level}`}</Text>
            </LinearGradient>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={t("homescreen.next_available_level")} disabled={level>=maxLevel} onPress={()=>setSelected(level+1)} style={[s.arrow,level>=maxLevel&&s.disabled]}><Text style={s.arrowText}>›</Text></Pressable>
        </View>
        <View style={s.levelTrack}>
          <View style={s.trackLine}/>
          {Array.from({length:5},(_,i)=>start+i).map(n=>{
            const p=c.completedLevels[getCampaignLevel(n)?.id??'']; const locked=n>maxLevel;
            return <Pressable key={n} accessibilityRole="button" accessibilityLabel={t("homescreen.level", {value1: n, value2: locked?'locked':p?.cleared?displayLabel(p.bestRank):'available'})} accessibilityState={{selected:n===level,disabled:locked}} disabled={locked} onPress={()=>setSelected(n)} style={s.nodeWrap}>
              <View style={[s.node,p?.cleared&&s.cleared,n===level&&s.current,locked&&s.locked]}><Text style={[s.nodeText,locked&&{color:'#6D8CA2'}]}>{n}</Text></View>
              <Text style={[s.rank,p?.cleared&&{color:'#F8D988'}]}>{locked?t('labels.LOCKED'):p?.cleared?displayLabel(p.bestRank):n===level?t("homescreen.current"):t("homescreen.play")}</Text>
            </Pressable>;
          })}
        </View>
        <View style={s.chapter}><Text style={s.chapterTitle}>{t("statuspanel.world")}{world.index} · {world.name}</Text><Text style={s.chapterCopy}>{world.subtitle}</Text><Text style={s.completion}>{cleared} / {TOTAL_CORE_LEVELS} {t("homescreen.levels_cleared")}</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel={t("homescreen.explore_your_journey")} onPress={onJourney} style={s.storyCard}>
          <BorderGlint active={borderSpotlight===5} radius={18}/><Image source={CITY_ART} style={s.storyImage}/><View style={s.storyCopy}><Text style={s.eyebrow}>{t("homescreen.your_journey_continues")}</Text><Text style={s.quote}>{HOME_BRAND.tagline}</Text></View><Text style={s.arrowText}>›</Text>
        </Pressable>
        {isEndlessUnlocked(c)&&!c.campaignCompleted?<Pressable accessibilityRole="button" onPress={onEndless} style={s.endless}><Text style={s.chapterTitle}>{t("homescreen.explore_endless_voyage")}</Text></Pressable>:null}
        </View>
      </View>
    </ScrollView>
  </View>;
}
const s=StyleSheet.create({
  root:{...StyleSheet.absoluteFill,backgroundColor:'#031522'},page:{width:'100%',maxWidth:600,overflow:'hidden'},
  scene:{position:'relative'},controls:{width:'100%'},
  tabletPage:{maxWidth:'100%'},landscapePage:{flexDirection:'row',alignItems:'stretch',paddingHorizontal:24,gap:28,flex:1},
  tabletResources:{width:'100%',maxWidth:560,alignSelf:'center',paddingHorizontal:24},
  tabletNav:{width:82,minHeight:80},
  tabletControls:{maxWidth:680,alignSelf:'center'},
  landscapeControls:{width:400,alignSelf:'center',paddingVertical:28},
  art:{position:'absolute',top:0,left:0,right:0},resources:{flexDirection:'row',alignItems:'center',gap:8,paddingHorizontal:14},
  settings:{width:44,height:46,alignItems:'center',justifyContent:'center',backgroundColor:'#041E30',borderColor:'#258AAE',borderWidth:1,borderRadius:12},
  resource:{flex:1,minHeight:46,flexDirection:'row',gap:7,alignItems:'center',justifyContent:'center',backgroundColor:'rgba(0,20,35,.9)',borderColor:'#246786',borderWidth:1,borderRadius:12,paddingHorizontal:7},
  bolt:{fontSize:36,color:'#35E9FF'},gem:{fontSize:22,color:'#BB8EFD'},value:{fontSize:16,color:'#F0FAFF',fontWeight:'800'},resourceLabel:{fontSize:8,color:'#7FD6F5',letterSpacing:1.8,textAlign:'center',marginTop:1},plus:{color:'#41DEFF',fontSize:22,marginLeft:2},
  brand:{alignItems:'center',paddingTop:30},eyebrow:{fontSize:9,color:'#8ADBFA',letterSpacing:2,fontWeight:'700'},title:{color:'#F3FDFF',fontWeight:'300',letterSpacing:12,marginLeft:12,textShadowColor:'#00BDFF',textShadowRadius:18,textShadowOffset:{width:0,height:0},marginTop:8},subtitle:{fontSize:12,color:'#83DEFA',letterSpacing:5,marginTop:2},
  stage:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-end',paddingHorizontal:14,paddingBottom:10},side:{gap:12},
  nav:{width:64,minHeight:67,alignItems:'center',justifyContent:'center',paddingVertical:8,borderRadius:13,borderWidth:1,borderColor:'#2385AA',backgroundColor:'rgba(0,19,34,.89)'},navLabel:{fontSize:9,color:'#E4F6FF',fontWeight:'800',letterSpacing:1},
  sparkPlacement:{position:'absolute',bottom:37,left:'50%',width:50,height:50,marginLeft:-25,alignItems:'center',justifyContent:'center'},aura:{position:'absolute',width:90,height:90,borderRadius:45,backgroundColor:'#02B9FF',shadowColor:'#00CAFF',shadowRadius:28,shadowOpacity:1,shadowOffset:{width:0,height:0}},spark:{width:45,height:45,borderRadius:24,borderWidth:1,borderColor:'#E1FFFF',shadowColor:'#26DAFF',shadowRadius:18,shadowOpacity:1,shadowOffset:{width:0,height:0}},
  tap:{fontSize:10,letterSpacing:3,color:'#A2DBF6',textAlign:'center',marginTop:4,marginBottom:17},playRow:{flexDirection:'row',alignItems:'center',paddingHorizontal:18,gap:12},arrow:{width:40,height:46,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'#2383AA',borderRadius:24,backgroundColor:'#032037'},arrowText:{fontSize:34,color:'#89E2FF',lineHeight:38},disabled:{opacity:.25},pressed:{opacity:.75},
  play:{flex:1,borderRadius:18,shadowColor:'#FFBB32',shadowRadius:22,shadowOpacity:.55,shadowOffset:{width:0,height:0}},playInner:{borderRadius:18,borderWidth:1,borderColor:'#FFE995',alignItems:'center',paddingVertical:13,paddingHorizontal:8},playLabel:{fontSize:28,fontWeight:'900',letterSpacing:4,color:'#241b06'},playWorld:{fontSize:11,letterSpacing:2,color:'#48360c',marginTop:3},playLevel:{fontSize:9,letterSpacing:2,color:'#695019',marginTop:4},
  levelTrack:{marginTop:28,flexDirection:'row',justifyContent:'space-between',paddingHorizontal:15},trackLine:{position:'absolute',height:1,backgroundColor:'#38627B',top:22,left:25,right:25},nodeWrap:{alignItems:'center',width:58},node:{width:44,height:44,borderRadius:22,backgroundColor:'#061F32',borderWidth:1,borderColor:'#52829B',alignItems:'center',justifyContent:'center'},nodeText:{color:'#D5EDF8',fontSize:17,fontWeight:'700'},cleared:{borderColor:'#66E5BE',backgroundColor:'#0D383A'},current:{borderColor:'#35E9FF',borderWidth:2,shadowColor:'#00D7FF',shadowRadius:12,shadowOpacity:.7,shadowOffset:{width:0,height:0}},locked:{borderColor:'#36556D'},rank:{fontSize:7,color:'#78B4D1',marginTop:8,letterSpacing:.7},
  chapter:{alignItems:'center',paddingHorizontal:20,paddingTop:22,gap:7},chapterTitle:{fontSize:11,letterSpacing:2,color:'#69D7FA',fontWeight:'700',textAlign:'center'},chapterCopy:{fontSize:12,color:'#B0CADD',textAlign:'center'},completion:{fontSize:9,color:'#5C8BA7',letterSpacing:1.5,marginTop:3},
  storyCard:{margin:18,marginTop:24,borderRadius:18,overflow:'hidden',borderWidth:1,borderColor:'#245977',backgroundColor:'#061D2E',flexDirection:'row',alignItems:'center',paddingRight:14,minHeight:104},storyImage:{width:'27%',height:110},storyCopy:{flex:1,padding:14,gap:10},quote:{color:'#D7E5EF',fontSize:12,lineHeight:19,letterSpacing:1},endless:{padding:14},
});
