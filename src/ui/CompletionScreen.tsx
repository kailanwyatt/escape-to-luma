import {Text,View} from 'react-native';
import {t} from '../i18n';
import type {HudSnapshot} from '../game/GameState';
import {worldForLevel,WORLDS} from '../campaign/worlds';
import {sparkById} from '../customization/sparks';
import {SparkPortrait} from './SparksScreen';
import {SPARK_DESCRIPTIONS} from './sparkPresentation';
import {JOURNEY_PRESENTATION} from './journeyPresentation';
import {StoryTemplate} from './StoryTemplate';

export function CompletionScreen({hud,onContinue,onHome,reduceMotion}:{hud:HudSnapshot;onContinue:()=>void;onHome:()=>void;reduceMotion:boolean}) {
 const world=worldForLevel(hud.campaignLevel)!;
 const unlock=hud.phase==='SPARK_UNLOCKED';
 const spark=sparkById(world.completionSparkId??'original');
 const next=WORLDS[world.index];
 const progress=<View style={{alignItems:'center',gap:8,marginTop:20}}>
   {!unlock&&hud.lastShardsGained>0?<Text style={{color:'#ffd777',fontSize:22,fontWeight:'800'}}>{t('completion.shards',{count:hud.lastShardsGained})}</Text>:null}
   <Text style={{color:'#83dbea',textAlign:'center'}}>{t('completion.world_progress',{world:world.name,count:hud.currentWorldClears??0})}</Text>
 </View>;
 return <StoryTemplate id={`${hud.phase}-${hud.campaignLevel}`} image={JOURNEY_PRESENTATION[world.id].image??'story.05'}
   artContent={unlock&&spark?<View style={{flex:1,alignItems:'center',justifyContent:'center'}}><SparkPortrait spark={spark} size={280}/></View>:undefined}
   eyebrow={unlock?t('game.new_spark'):world.name}
   title={unlock?hud.unlockedSparkName??t('branding.spark'):t('hud.world_complete')}
   body={unlock&&spark?SPARK_DESCRIPTIONS[spark.id]:world.storyBeat}
   instruction={unlock?t('completion.cosmetic_hint'):next?t('completion.next_world',{world:next.name}):t('completion.home_hint')}
   action={t('storymoments.continue')} onContinue={onContinue} onSecondary={onHome}
   reduceMotion={reduceMotion} progress={progress}/>
}
