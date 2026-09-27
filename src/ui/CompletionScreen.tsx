import {Text,View} from 'react-native';
import {t} from '../i18n';
import type {HudSnapshot} from '../game/GameState';
import {worldForLevel,WORLDS} from '../campaign/worlds';
import {sparkById} from '../customization/sparks';
import {SparkPortrait} from './SparksScreen';
import {SPARK_DESCRIPTIONS} from './sparkPresentation';
import {journeyLookFor} from './journeyPresentation';
import {StoryTemplate} from './StoryTemplate';
import {BriefingFrame, UnlockStamp} from './BriefingFrame';
import {HomeSignalMeter} from './HomeSignalMeter';
import {color, fontDisplay, fontUi} from '../design';

export function CompletionScreen({hud,onContinue,onHome,reduceMotion}:{hud:HudSnapshot;onContinue:()=>void;onHome:()=>void;reduceMotion:boolean}) {
 const world=worldForLevel(hud.campaignLevel)!;
 const unlock=hud.phase==='SPARK_UNLOCKED';
 const spark=sparkById(world.completionSparkId??'original');
 const next=WORLDS[world.index];
 const progress=<View style={{alignItems:'center',gap:10,marginTop:16}}>
   <BriefingFrame
     accent={unlock?'amber':'success'}
     eyebrow={unlock?'SPARK UNLOCK':'WORLD CLEAR'}
     title={unlock?(hud.unlockedSparkName??spark.name):world.name}
     style={{width:'100%',maxWidth:340}}
     meta={<HomeSignalMeter strength={world.homeSignalStrength} />}
   >
     <UnlockStamp label={unlock?'NEW SPARK':'CLEARED'} />
     {!unlock&&hud.lastShardsGained>0?<Text style={{color:color.amberBright,fontSize:20,fontFamily:fontDisplay,textAlign:'center'}}>{t('completion.shards',{count:hud.lastShardsGained})}</Text>:null}
     <Text style={{color:color.cyanBright,textAlign:'center',fontFamily:fontUi,fontSize:13,marginTop:4}}>{t('completion.world_progress',{world:world.name,count:hud.currentWorldClears??0})}</Text>
   </BriefingFrame>
 </View>;
 return <StoryTemplate id={`${hud.phase}-${hud.campaignLevel}`} image={journeyLookFor(world.id).image??'story.05'}
   artContent={unlock&&spark?<View style={{flex:1,alignItems:'center',justifyContent:'center'}}><SparkPortrait spark={spark} size={280}/></View>:undefined}
   eyebrow={unlock?t('game.new_spark'):world.name}
   title={unlock?hud.unlockedSparkName??t('branding.spark'):t('hud.world_complete')}
   body={unlock&&spark?SPARK_DESCRIPTIONS[spark.id]:world.storyBeat}
   instruction={unlock?t('completion.cosmetic_hint'):next?t('completion.next_world',{world:next.name}):t('completion.home_hint')}
   action={t('storymoments.continue')} onContinue={onContinue} onSecondary={onHome}
   reduceMotion={reduceMotion} progress={progress}/>
}
