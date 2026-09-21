import type {CampaignLevelDefinition} from '../types';
import type {SlidingGateConfig} from '../../config/ObstacleConfig';
import type {RapidShutterConfig} from '../../obstacles/RapidShutterState';
/** Authored City lessons, applied after generic composition and balance. */
export function applyCityShutterProgression(source:CampaignLevelDefinition):CampaignLevelDefinition {
 if(source.worldId!=='city')return source;
 const level:CampaignLevelDefinition=JSON.parse(JSON.stringify(source)),n=level.levelNumber;
 const original=level.challenge.obstacles.find((o):o is SlidingGateConfig=>o.type==='slidingGate');
 if(!original)return level;
 const patterns:NonNullable<RapidShutterConfig['pattern']>[]=['standard','standard','standard','standard','quickWindow','standard','standard','doublePulse','doublePulse','standard','quickWindow','doublePulse','fakeout','asymmetric','doublePulse'];
 const vertical=n===21||n===22||n===24;
 const width=n===16?2.25:n<20?1.9-(n-17)*.1:n<25?1.7:1.6;
 const gate:SlidingGateConfig={...original,movementMode:'rapidShutter',amplitude:0,speed:0,openingWidth:width,openingHeight:vertical?2.05:2.65,
 shutter:{pattern:patterns[n-16],orientation:vertical?'vertical':'horizontal',visualVariant:'citySecurity',phaseOffset:(n-16)*.17,
 ...(n===16?{openingDuration:.5,openHold:1.15,slamDuration:.3}:n===18?{openHold:.6}:n===19?{openHold:.55,slamDuration:.18}:{})}};
 // Introductions remain single-obstacle lessons; later combinations have distinct depths.
 level.challenge.obstacles=[gate];
 if([25,28,30].includes(n)){
  const rotor=source.challenge.obstacles.find(o=>o.type==='rotor'||!o.type)??{type:'rotor' as const,z:5.2,bladeCount:2,rotationSpeed:.65,direction:1 as const,initialRotation:.3,visualVariant:'cityVentilation' as const};
  level.challenge.obstacles=[{...rotor,z:5.2},{...gate,z:8.5}];level.challenge.template='ROTOR_GATE';
 }else if(n===26||n===27){
  const second:SlidingGateConfig={...gate,z:8.6,baseX:level.challenge.target.x*8.6/(level.challenge.target.z??12),shutter:{...gate.shutter,phaseOffset:.48,orientation:n===27?'vertical':'horizontal'},openingHeight:2.5};
  gate.z=5.3;gate.baseX=level.challenge.target.x*5.3/(level.challenge.target.z??12);
  level.challenge.obstacles=[gate,second];
 }
 level.windX=n===16?0:n===21?-.16:n===22?.23:n===24?-.28:level.windX;
 level.tutorialHint=n===16?'CYAN: OPEN · AMBER: WARNING · RED: SLAM. Time Spark’s arrival.':n===23?'TWO OPENINGS PER CYCLE · WATCH BOTH PULSES':n===28?'A PARTIAL CLOSE IS A FAKEOUT · THE RED SLAM IS REAL':n===29?'ONE PANEL LEADS THE OTHER · WATCH THE WHOLE OPENING':n===26||n===27?'TWO SHUTTERS · TIME BOTH CROSSINGS':vertical?'TOP AND BOTTOM SHUTTERS · AIM FOR THE ARRIVAL WINDOW':'AIM THROUGH THE OPENING AT ARRIVAL · WATCH FOR AMBER';
 return level;
}
