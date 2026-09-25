import {t, displayLabel} from '../i18n';
import {useCallback,useRef,useState} from 'react';
import {Image,NativeScrollEvent,NativeSyntheticEvent,PanResponder,Pressable,ScrollView,StyleSheet,Text,View,useWindowDimensions} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {LinearGradient} from 'expo-linear-gradient';
import {WORLDS} from '../campaign/worlds';
import {journeyProgress,type WorldCardState} from '../campaign/journeyProgress';
import {BrandWordmark} from '../design';
import {getAssetSource} from '../graphics/assetRegistry';
import type {PersistentGameData} from '../persistence/GameSave';
import {journeyLookFor} from './journeyPresentation';
import {JourneyMotif} from './JourneyMotif';
import {HomeSignalMeter} from './HomeSignalMeter';
type Props={save:PersistentGameData;devUnlockAll?:boolean;onSelectLevel:(n:number)=>void;onBack:()=>void;initialWorldId?:string|null;focusLevel?:number|null};
const cyan='#66E6FF',muted='#8cabc0';
/** Survives world drill-in and Journey remounts so the list does not jump to top. */
let persistedWorldsScrollY: number | null = null;
/** Hide the chapter swipe hint after the first adjacent-world move. */
let chapterSwipeHintDismissed = false;
function Lock(){return <View accessible={false} style={s.lock}><View style={s.shackle}/></View>;}
function Node({state}:{state:WorldCardState}){return <View style={[s.node,state==='current'&&s.nodeCurrent,state==='completed'&&s.nodeDone]}>{state==='locked'?<Lock/>:state==='completed'?<Text style={s.check}>✓</Text>:<View style={[s.dot,state!=='current'&&s.dotHollow]}/>}</View>;}
/** Quiet native-view placeholders are intentionally replaceable, never gameplay renderers. */
function Preview({id,revealed}:{id:string;revealed:boolean}){
 const meta=journeyLookFor(id);
 const homeReveal=id==='homeward'||id==='luma';
 const source=meta.image&&(!homeReveal||revealed)?getAssetSource(meta.image):null;
 if(source)return <View pointerEvents="none" style={StyleSheet.absoluteFill}><Image accessible={false} source={source} resizeMode="cover" style={[StyleSheet.absoluteFill,{width:'100%',height:'100%'}]}/><JourneyMotif motif={meta.motif} accent={meta.accent}/></View>;
 return <View pointerEvents="none" style={[StyleSheet.absoluteFill,{overflow:'hidden'}]}>
  <LinearGradient colors={[...meta.sky]} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFill}/>
  {Array.from({length:18},(_,i)=><View key={i} style={{position:'absolute',right:`${(i*31)%88}%`,top:`${(i*17)%90}%`,width:2,height:2,borderRadius:1,backgroundColor:'#d0eafa',opacity:.2+i%3*.1}}/>)}
  {meta.motif==='cloud'?Array.from({length:6},(_,i)=><View key={i} style={{position:'absolute',right:-20+i*35,bottom:-32+(i%3)*18,width:160,height:66,borderRadius:80,backgroundColor:'#d0e6f0',opacity:.13+i%2*.09}}/>):null}
  {['earth','orbit','moon'].includes(meta.motif)?<View style={[s.planet,{backgroundColor:meta.motif==='moon'?'#7d8791':'#255e93',borderColor:meta.accent},meta.motif==='moon'&&{width:180,height:180,borderRadius:90,right:8,bottom:-75}]}><View style={s.planetShade}/></View>:null}
  {meta.motif==='orbit'?<View style={s.station}><View style={s.stationCore}/><View style={s.panelLeft}/><View style={s.panelRight}/></View>:null}
  {meta.motif==='rocks'?Array.from({length:5},(_,i)=><View key={i} style={{position:'absolute',right:20+i*41,top:8+(i*27)%85,width:25+i%3*19,height:23+i%3*17,borderRadius:9+i,backgroundColor:['#4a4b50','#6b6460','#303c49'][i%3],borderWidth:2,borderColor:'#7c747044',transform:[{rotate:`${i*37}deg`}]}}/>):null}
  {meta.motif==='signal'?<View style={s.signal}/>:null}
  <JourneyMotif motif={meta.motif} accent={meta.accent}/>
 </View>;
}
export function JourneyScreen({save,devUnlockAll=false,onSelectLevel,onBack,initialWorldId=null,focusLevel=null}:Props){
 const data=journeyProgress(save.campaign,devUnlockAll),insets=useSafeAreaInsets(),{width}=useWindowDimensions();
 const startWorld=initialWorldId&&data.worlds.some(w=>w.world.id===initialWorldId&&w.unlocked)
  ? initialWorldId
  : focusLevel!=null
    ? WORLDS.find(w=>focusLevel>=w.firstLevel&&focusLevel<=w.lastLevel&&(devUnlockAll||save.campaign.unlockedWorldIds.includes(w.id)))?.id??null
    : null;
 const [selected,setSelected]=useState<string|null>(startWorld),[notice,setNotice]=useState('');
 const [showSwipeHint,setShowSwipeHint]=useState(!chapterSwipeHintDismissed);
 const scroll=useRef<ScrollView>(null),positioned=useRef(false);
 const rowPositions=useRef<Record<string,number>>({});
 const lastWorld=WORLDS.find(w=>save.campaign.lastPlayedLevel>=w.firstLevel&&save.campaign.lastPlayedLevel<=w.lastLevel)?.id??data.worlds[data.currentIndex-1]?.world.id;
 const restoreWorldsScroll=useCallback(()=>{
  // Always re-apply a saved offset when the worlds list remounts (e.g. after leaving a chapter).
  if(persistedWorldsScrollY!=null){
   scroll.current?.scrollTo({y:persistedWorldsScrollY,animated:false});
   positioned.current=true;
   return;
  }
  if(positioned.current)return;
  const y=rowPositions.current[lastWorld??''];
  if(y===undefined)return;
  positioned.current=true;
  const next=Math.max(0,y-12);
  persistedWorldsScrollY=next;
  scroll.current?.scrollTo({y:next,animated:false});
 },[lastWorld]);
 const onWorldsScroll=(e:NativeSyntheticEvent<NativeScrollEvent>)=>{
  persistedWorldsScrollY=e.nativeEvent.contentOffset.y;
 };
 const active=data.worlds.find(w=>w.world.id===selected),small=width<370;
 const homeFound=save.campaign.campaignCompleted,allClear=data.cleared===data.total;
 const highlightLevel=focusLevel??save.campaign.lastPlayedLevel??save.campaign.highestUnlockedLevel;
 const unlockedWorlds=data.worlds.filter(w=>w.unlocked);
 const activeWorldIndex=unlockedWorlds.findIndex(w=>w.world.id===selected);
 const prevChapter=activeWorldIndex>0?unlockedWorlds[activeWorldIndex-1]:null;
 const nextChapter=activeWorldIndex>=0&&activeWorldIndex<unlockedWorlds.length-1?unlockedWorlds[activeWorldIndex+1]:null;
 const goPrevChapter=()=>{if(prevChapter){setNotice('');dismissSwipeHint();setSelected(prevChapter.world.id);}};
 const goNextChapter=()=>{if(nextChapter){setNotice('');dismissSwipeHint();setSelected(nextChapter.world.id);}};
 const dismissSwipeHint=()=>{
  if(chapterSwipeHintDismissed)return;
  chapterSwipeHintDismissed=true;
  setShowSwipeHint(false);
 };
 const chapterNav=useRef({goPrev:goPrevChapter,goNext:goNextChapter});
 chapterNav.current={goPrev:goPrevChapter,goNext:goNextChapter};
 const chapterPan=useRef(PanResponder.create({
  onMoveShouldSetPanResponder:(_e,g)=>Math.abs(g.dx)>28&&Math.abs(g.dx)>Math.abs(g.dy)*1.35,
  onPanResponderRelease:(_e,g)=>{
   if(g.dx<-50)chapterNav.current.goNext();
   else if(g.dx>50)chapterNav.current.goPrev();
  },
 })).current;
 const back=()=>{
  if(selected){
   // Keep list scroll; do not re-run first-open jump to last played.
   positioned.current=true;
   setSelected(null);
  }else onBack();
 };
 return <View style={s.root}>
 <LinearGradient colors={['#020b14','#092237','#020b14']} style={StyleSheet.absoluteFill}/>
 <View style={[s.safe,{paddingTop:Math.max(insets.top,10),paddingBottom:Math.max(insets.bottom,12),paddingLeft:Math.max(insets.left,12),paddingRight:Math.max(insets.right,12)}]}>
 <View style={s.column}>
 <View style={s.top}><Pressable accessibilityRole="button" accessibilityLabel={selected?t("journeyscreen.back_to_worlds"):t("journeyscreen.back_to_home")} onPress={back} style={s.back}><Text style={s.backText}>{t("journeyscreen.back")}</Text></Pressable><BrandWordmark size="header"/><View style={{width:64}}/></View>
 <View style={s.heading}><Text accessibilityRole="header" style={[s.title,small&&{fontSize:23}]}>{active?active.world.name:allClear?t("journeyscreen.journey_complete"):<>{t("journeyscreen.your")}<Text style={{color:cyan}}>{t("journeyscreen.journey")}</Text></>}</Text>
 <Text style={s.meta}>{active?t("journeyscreen.levels_15_complete", {value1: active.world.firstLevel, value2: active.world.lastLevel, value3: active.cleared, value4: active.levels.length}):t("journeyscreen.complete_destination", {value1: data.cleared, value2: data.total, value3: displayLabel(data.destination)})}</Text>
 <Text style={s.caption}>{active?active.world.subtitle:homeFound?t("journeyscreen.home_found_replay_and_master_the_journey"):`${WORLDS.length} worlds · follow the signal home`}</Text>
 {!active?<View accessibilityRole="progressbar" accessibilityValue={{min:0,max:data.total,now:data.cleared}} style={s.progress}><View style={[s.progressFill,{width:`${data.cleared/data.total*100}%`}]}/></View>:null}
 </View>
 {devUnlockAll?<Text style={s.dev}>{t("journeyscreen.dev_access_all_levels_available")}</Text>:null}
 {active?<View style={{flex:1,minHeight:0}} {...chapterPan.panHandlers}>
 <View style={s.worldNav}>
  <Pressable
   accessibilityRole="button"
   accessibilityLabel={prevChapter?t("journeyscreen.previous_chapter",{value1:prevChapter.world.name}):undefined}
   disabled={!prevChapter}
   onPress={goPrevChapter}
   style={({pressed})=>[s.worldNavSide,s.worldNavSideStart,!prevChapter&&s.worldNavDisabled,pressed&&prevChapter&&s.pressed]}
  >
   <Text numberOfLines={1} style={s.worldNavLabel}>{prevChapter?`‹ ${prevChapter.world.name}`:' '}</Text>
  </Pressable>
  <Text style={s.worldNavHint}>{showSwipeHint?t("journeyscreen.swipe_worlds"):'·'}</Text>
  <Pressable
   accessibilityRole="button"
   accessibilityLabel={nextChapter?t("journeyscreen.next_chapter",{value1:nextChapter.world.name}):undefined}
   disabled={!nextChapter}
   onPress={goNextChapter}
   style={({pressed})=>[s.worldNavSide,s.worldNavSideEnd,!nextChapter&&s.worldNavDisabled,pressed&&nextChapter&&s.pressed]}
  >
   <Text numberOfLines={1} style={s.worldNavLabel}>{nextChapter?`${nextChapter.world.name} ›`:' '}</Text>
  </Pressable>
 </View>
 <ScrollView key={selected} contentContainerStyle={s.levelContent}>
 <View style={s.levelHero}><Preview id={active.world.id} revealed={data.destination==='LUMA'}/><LinearGradient colors={['transparent','#04121de6']} style={StyleSheet.absoluteFill}/><View style={s.heroFooter}><HomeSignalMeter strength={active.world.homeSignalStrength} compact/><Text style={s.heroCopy}>{active.perfect} {t("journeyscreen.perfect")}{active.cleared} {t("journeyscreen.cleared")}</Text></View></View>
 <View style={s.grid}>{active.levels.map(l=><Pressable key={l.number} disabled={!l.available} accessibilityRole="button" accessibilityState={{disabled:!l.available,selected:l.number===highlightLevel}} accessibilityLabel={t("homescreen.level", {value1: l.number, value2: l.progress?.cleared?displayLabel(l.progress.bestRank):l.available?'available':'locked'})} onPress={()=>onSelectLevel(l.number)} style={({pressed})=>[s.level,!l.available&&s.disabled,pressed&&s.pressed,l.number===highlightLevel&&s.currentLevel]}><Text style={s.levelNumber}>{l.number}</Text>{l.available?<Text style={s.rank}>{l.progress?.cleared?displayLabel(l.progress.bestRank):t("homescreen.play")}</Text>:<Lock/>}</Pressable>)}</View>
 <Text style={s.levelHint}>{t("journeyscreen.replay_cleared_levels_to_improve_your_precision")}</Text></ScrollView>
 </View>:
 <ScrollView
  key="worlds"
  ref={scroll}
  style={{flex:1}}
  contentContainerStyle={s.list}
  contentOffset={persistedWorldsScrollY!=null?{x:0,y:persistedWorldsScrollY}:undefined}
  scrollEventThrottle={16}
  onScroll={onWorldsScroll}
  onContentSizeChange={()=>requestAnimationFrame(restoreWorldsScroll)}
  onLayout={()=>requestAnimationFrame(restoreWorldsScroll)}
 >
 {data.worlds.map((entry,i)=>{const {world,state}=entry,locked=!entry.unlocked,current=state==='current',bright=state==='completed'||current;
 return <View key={world.id} style={s.row} onLayout={e=>{rowPositions.current[world.id]=e.nativeEvent.layout.y;if(persistedWorldsScrollY==null&&world.id===lastWorld)requestAnimationFrame(restoreWorldsScroll);}}>
 <View style={s.rail}><View style={[s.line,{backgroundColor:bright?'#48cfe2':'#254255'},i===0&&{top:'50%'},i===data.worlds.length-1&&{bottom:'50%'}]}/><View style={[s.connector,{backgroundColor:bright?'#48cfe2':'#254255'}]}/><Node state={state}/></View>
 <Pressable accessibilityRole="button" accessibilityLabel={t("journeyscreen.of_15_complete", {value1: world.name, value2: state, value3: entry.cleared, value4: locked?t("journeyscreen.complete_to_unlock_2", {value1: WORLDS[i-1]?.name??t("journeyscreen.previous_world")}):''})} accessibilityHint={locked?t("journeyscreen.shows_unlock_requirement"):t("journeyscreen.opens_level_selection")} onPress={()=>{if(locked){setNotice(t("journeyscreen.complete_to_unlock", {value1: WORLDS[i-1]?.name??t("journeyscreen.the_previous_world"), value2: world.name}));return;}setNotice('');setSelected(world.id);}} style={({pressed})=>[s.card,current&&s.currentCard,pressed&&s.pressed]}>
 <View style={[StyleSheet.absoluteFill,locked&&{opacity:.48}]}><Preview id={world.id} revealed={data.destination==='LUMA'}/></View>
 <LinearGradient colors={['#04111bf5','#04111bd9','#04111b18']} locations={[0,.44,1]} start={{x:0,y:0}} end={{x:1,y:0}} style={StyleSheet.absoluteFill}/>
 <View style={s.copy}><Text style={s.eyebrow}>{t("statuspanel.world")}{world.index} <Text style={{color:current?cyan:muted}}>{current?t("journeyscreen.current"):state==='completed'?t("journeyscreen.complete"):''}</Text></Text><Text style={[s.name,small&&{fontSize:15}]}>{world.name}</Text><Text numberOfLines={2} style={s.subtitle}>{(world.id==='homeward'||world.id==='luma')&&data.destination==='UNKNOWN'?t("journeyscreen.the_light_ahead"):world.subtitle}</Text><HomeSignalMeter strength={world.homeSignalStrength} compact/><Text style={s.count}>{entry.cleared} / {entry.levels.length} <Text style={s.mastery}>{entry.perfect>0?t("journeyscreen.perfect_2", {value1: entry.perfect}):locked?t("journeyscreen.locked"):''}</Text></Text></View>
 <View style={s.chevron}>{locked?<Lock/>:<Text style={s.arrow}>›</Text>}</View>
 </Pressable></View>;})}
 <Text style={s.footer}>{t("journeyscreen.same_physics_a_universe_of_possibilities")}</Text>
 </ScrollView>}
 {notice?<Pressable accessibilityRole="button" accessibilityLabel={t("journeyscreen.dismiss", {value1: notice})} onPress={()=>setNotice('')} style={s.notice}><Text accessibilityLiveRegion="polite" style={s.noticeText}>{notice} ×</Text></Pressable>:null}
 </View></View></View>;
}
const s=StyleSheet.create({
 root:{...StyleSheet.absoluteFill,backgroundColor:'#020b14'},safe:{flex:1,alignItems:'center'},column:{flex:1,width:'100%',maxWidth:980,minHeight:0},top:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',minHeight:52},back:{minWidth:64,minHeight:44,justifyContent:'center'},backText:{color:cyan,fontSize:12,fontWeight:'800',letterSpacing:1},brand:{alignItems:'center'},wordmark:{color:'#e5faff',fontSize:25,letterSpacing:7,fontWeight:'300',textShadowColor:'#27b7e9',textShadowRadius:12},brandSub:{fontSize:7,color:cyan,letterSpacing:2.6,marginTop:3},heading:{paddingVertical:14,alignItems:'center',gap:6},title:{fontSize:29,fontWeight:'800',letterSpacing:1,color:'#f2f7fb',textAlign:'center'},meta:{fontSize:10,fontWeight:'700',letterSpacing:1,color:'#aed0e2',textAlign:'center'},caption:{fontSize:8,letterSpacing:1.2,color:muted,textAlign:'center'},progress:{height:2,backgroundColor:'#203a4a',width:'80%',maxWidth:420,marginTop:5},progressFill:{height:2,backgroundColor:cyan},dev:{fontSize:9,color:'#f2c57e',textAlign:'center',marginBottom:8},list:{paddingBottom:22},row:{flexDirection:'row',minHeight:156},rail:{width:38,alignItems:'center',justifyContent:'center'},line:{position:'absolute',top:0,bottom:0,width:1.5,left:15},connector:{position:'absolute',left:15,right:0,height:1,top:'50%'},node:{width:30,height:30,marginRight:7,borderRadius:15,borderWidth:1.5,borderColor:'#53758d',backgroundColor:'#061726',alignItems:'center',justifyContent:'center'},nodeCurrent:{borderColor:cyan,shadowColor:cyan,shadowRadius:10,shadowOpacity:.8,shadowOffset:{width:0,height:0}},nodeDone:{borderColor:'#43cde3'},check:{fontSize:21,fontWeight:'800',color:cyan},dot:{width:12,height:12,borderRadius:6,backgroundColor:'#e0fcff'},dotHollow:{backgroundColor:'transparent',borderWidth:1,borderColor:muted},card:{flex:1,marginVertical:5,minHeight:146,borderRadius:18,borderWidth:1,borderColor:'#284759',overflow:'hidden',backgroundColor:'#071827',justifyContent:'center'},currentCard:{borderColor:cyan,borderWidth:2,shadowColor:cyan,shadowOpacity:.35,shadowRadius:9,shadowOffset:{width:0,height:0}},copy:{padding:14,paddingRight:48,gap:4,maxWidth:400},eyebrow:{color:'#9fccde',fontSize:9,fontWeight:'700',letterSpacing:1.3},name:{color:'#f4f8fc',fontSize:18,fontWeight:'800'},subtitle:{color:'#aac2d1',fontSize:11,maxWidth:230,lineHeight:15},count:{color:'#d1effb',fontSize:12,fontWeight:'700',marginTop:3},mastery:{fontSize:9,color:'#d5c38c'},chevron:{position:'absolute',right:11,width:30,height:36,borderRadius:18,backgroundColor:'#031320b8',alignItems:'center',justifyContent:'center'},arrow:{color:'#b3ecff',fontSize:33,lineHeight:34},lock:{width:11,height:10,borderRadius:2,backgroundColor:'#95b5ca',marginTop:5},shackle:{position:'absolute',width:8,height:8,left:1.5,top:-6,borderRadius:5,borderWidth:1.5,borderColor:'#95b5ca'},pressed:{opacity:.85,transform:[{scale:.99}]},footer:{color:'#678b9f',fontSize:9,letterSpacing:1.7,textAlign:'center',marginTop:18},notice:{padding:12,backgroundColor:'#132c3e',borderRadius:12},noticeText:{color:'#c8e7f5',fontSize:12,textAlign:'center'},levelContent:{paddingBottom:20},levelHero:{height:140,overflow:'hidden',borderRadius:18,justifyContent:'flex-end',padding:16},heroFooter:{gap:8},heroCopy:{color:'#d5eff6',fontSize:11,fontWeight:'700',letterSpacing:1},grid:{flexDirection:'row',flexWrap:'wrap',gap:8,paddingVertical:16},level:{width:'30%',flexGrow:1,minHeight:80,borderWidth:1,borderColor:'#335166',borderRadius:14,backgroundColor:'#091f30',alignItems:'center',justifyContent:'center',gap:8},levelNumber:{color:'#e8faff',fontSize:23,fontWeight:'700'},rank:{color:cyan,fontSize:9,letterSpacing:1},currentLevel:{borderColor:cyan},disabled:{opacity:.4},levelHint:{color:muted,fontSize:12,textAlign:'center'},worldNav:{flexDirection:'row',alignItems:'center',gap:8,paddingBottom:8,minHeight:36},worldNavSide:{flex:1,minWidth:0,minHeight:36,justifyContent:'center',paddingHorizontal:4},worldNavSideStart:{alignItems:'flex-start'},worldNavSideEnd:{alignItems:'flex-end'},worldNavLabel:{color:cyan,fontSize:10,fontWeight:'700',letterSpacing:0.6},worldNavHint:{color:muted,fontSize:8,fontWeight:'700',letterSpacing:1.2,paddingHorizontal:4},worldNavDisabled:{opacity:0.25},planet:{position:'absolute',width:420,height:200,borderRadius:210,right:-50,bottom:-145,borderTopWidth:3,overflow:'hidden'},planetShade:{position:'absolute',top:15,left:25,right:-10,bottom:-10,borderRadius:180,backgroundColor:'#14213677'},station:{position:'absolute',right:65,top:38,width:90,height:55,transform:[{rotate:'-24deg'}]},stationCore:{position:'absolute',left:38,top:6,width:14,height:45,backgroundColor:'#83929d',borderRadius:4},panelLeft:{position:'absolute',left:0,top:12,width:32,height:28,backgroundColor:'#355577',borderWidth:1,borderColor:'#8c9caa'},panelRight:{position:'absolute',right:0,top:12,width:32,height:28,backgroundColor:'#355577',borderWidth:1,borderColor:'#8c9caa'},signal:{position:'absolute',right:55,top:35,width:4,height:95,backgroundColor:'#9ceff2',shadowColor:'#8fffff',shadowRadius:30,shadowOpacity:1,shadowOffset:{width:0,height:0}},
});
