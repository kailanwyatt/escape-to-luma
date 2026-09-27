import {t} from '../../i18n';
import type {CampaignLevelDefinition} from '../types';
import type {SlidingGateConfig} from '../../config/ObstacleConfig';
import {shutterTimeline,type RapidShutterConfig} from '../../obstacles/RapidShutterState';
/** Authored City lessons, applied after generic composition and balance. */
export function applyCityShutterProgression(source:CampaignLevelDefinition):CampaignLevelDefinition {
 if(source.levelNumber<16||source.levelNumber>30)return source;
 const level:CampaignLevelDefinition=JSON.parse(JSON.stringify(source)),n=level.levelNumber;
 const original=level.challenge.obstacles.find((o):o is SlidingGateConfig=>o.type==='slidingGate');
 if(!original)return level;
 const patterns:NonNullable<RapidShutterConfig['pattern']>[]=['standard','standard','standard','standard','quickWindow','standard','standard','doublePulse','doublePulse','standard','quickWindow','doublePulse','fakeout','asymmetric','doublePulse'];
 const vertical=n===21||n===22||n===24;
 const width=n===16?2.25:n<20?1.9-(n-17)*.1:n<25?1.7:1.6;
 const gate:SlidingGateConfig={...original,movementMode:'rapidShutter',amplitude:0,speed:0,openingWidth:width,openingHeight:vertical?2.05:2.65,
 shutter:{pattern:patterns[n-16],orientation:vertical?'vertical':'horizontal',visualVariant:'citySecurity',phaseOffset:(n-16)*.17,
 ...(n===16?{openingDuration:.5,openHold:1.15,slamDuration:.3}:n===18?{openHold:.6}:n===19?{openHold:.55,slamDuration:.18}:n===26?{openHold:.55}:{})}};
 // Introductions remain single-obstacle lessons; later combinations have distinct depths.
 level.challenge.obstacles=[gate];
 if([25,28,30].includes(n)){
  const rotor=source.challenge.obstacles.find(o=>o.type==='rotor'||!o.type)??{type:'rotor' as const,z:5.2,bladeCount:2,rotationSpeed:.65,direction:1 as const,initialRotation:.3,visualVariant:'cityVentilation' as const};
  level.challenge.obstacles=[{...rotor,z:5.2},{...gate,z:8.5}];level.challenge.template='ROTOR_GATE';
 }else if(n===26||n===27){
  // Sync second shutter so a mid-speed spark that clears the first still finds cyan OPEN on the second.
  const zNear=5.3,zFar=8.6,flightDt=(zFar-zNear)/8.5;
  const cycle=shutterTimeline(gate.shutter!).reduce((sum,beat)=>sum+beat.duration,0);
  const synced=(((gate.shutter!.phaseOffset??0)-flightDt)%cycle+cycle)%cycle;
  const second:SlidingGateConfig={...gate,z:zFar,baseX:level.challenge.target.x*zFar/(level.challenge.target.z??12),shutter:{...gate.shutter,phaseOffset:synced,orientation:n===27?'vertical':'horizontal'},openingHeight:2.5};
  gate.z=zNear;gate.baseX=level.challenge.target.x*zNear/(level.challenge.target.z??12);
  level.challenge.obstacles=[gate,second];
 }
 level.windX=n===16?0:n===21?-.16:n===22?.23:n===24?-.28:level.windX;
 level.tutorialHint=n===16?t("cityshutterprogression.cyan_open_amber_warning_red_slam_time_spark_s_arrival"):n===23?t("cityshutterprogression.two_openings_per_cycle_watch_both_pulses"):n===28?t("cityshutterprogression.a_partial_close_is_a_fakeout_the_red_slam_is_real"):n===29?t("cityshutterprogression.one_panel_leads_the_other_watch_the_whole_opening"):n===26||n===27?t("cityshutterprogression.two_shutters_time_both_crossings"):vertical?t("cityshutterprogression.top_and_bottom_shutters_aim_for_the_arrival_window"):t("cityshutterprogression.aim_through_the_opening_at_arrival_watch_for_amber");
 return level;
}
