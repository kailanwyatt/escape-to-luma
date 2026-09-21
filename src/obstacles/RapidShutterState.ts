import type {SlidingGateConfig} from '../config/ObstacleConfig';
export type ShutterPhase='CLOSED'|'OPENING'|'OPEN'|'WARNING'|'SLAMMING_CLOSED';
export interface RapidShutterConfig {
 pattern?:'standard'|'quickWindow'|'longTease'|'doublePulse'|'fakeout'|'asymmetric';
 orientation?:'horizontal'|'vertical';
 closedHold?:number;openingDuration?:number;openHold?:number;warningDuration?:number;slamDuration?:number;
 maxOpeningWidth?:number;minOpeningWidth?:number;phaseOffset?:number;
 visualVariant?:'citySecurity'|'containmentSecurity'|'orbitBlast'|'moonBulkhead'|'ancientSeal'|'lumaEnergy';
}
type Beat={phase:ShutterPhase;duration:number;from:number;to:number};
export function shutterTimeline(c:RapidShutterConfig):Beat[]{
 const preset=c.pattern==='quickWindow'?[.5,.25,.35,.16,.18]:c.pattern==='longTease'?[.45,.65,1.1,.2,.18]:[.45,.35,.7,.2,.2];
 const [closed,opening,hold,warning,slam]=[c.closedHold,c.openingDuration,c.openHold,c.warningDuration,c.slamDuration].map((v,i)=>Math.max(.01,v??preset[i]));
 const cycle=(rest:number,openTime=hold):Beat[]=>[{phase:'CLOSED',duration:rest,from:0,to:0},{phase:'OPENING',duration:opening,from:0,to:1},{phase:'OPEN',duration:openTime,from:1,to:1},{phase:'WARNING',duration:warning,from:1,to:1},{phase:'SLAMMING_CLOSED',duration:slam,from:1,to:0}];
 if(c.pattern==='doublePulse')return [...cycle(closed),...cycle(.05,hold*.65)];
 if(c.pattern==='fakeout'){const beats=cycle(closed);beats.splice(3,0,{phase:'SLAMMING_CLOSED',duration:slam,from:1,to:.55},{phase:'OPENING',duration:opening*.6,from:.55,to:1},{phase:'OPEN',duration:hold*.55,from:1,to:1});return beats;}
 return cycle(closed);
}
export function shutterStateAtTime(c:RapidShutterConfig,t:number){
 const beats=shutterTimeline(c),duration=beats.reduce((sum,b)=>sum+b.duration,0);
 const raw=t+(c.phaseOffset??0),cycle=Math.floor(raw/duration);let local=((raw%duration)+duration)%duration;
 let index=0;while(index<beats.length-1&&local>=beats[index].duration){local-=beats[index].duration;index++;}
 const beat=beats[index],p=Math.min(1,local/beat.duration);
 const ease=beat.phase==='OPENING'?1-(1-p)**3:beat.phase==='SLAMMING_CLOSED'?p**3:p;
 const fraction=beat.from+(beat.to-beat.from)*ease;
 let until=0;
 if(beat.phase!=='SLAMMING_CLOSED'){
  until=beat.duration-local;for(let j=1;j<=beats.length;j++){const next=beats[(index+j)%beats.length];if(next.phase==='SLAMMING_CLOSED')break;until+=next.duration;}
 }
 return {phase:beat.phase,timeInState:local,fraction,timeUntilSlam:until,cycle,beat:index,duration};
}
/** Shared by rendering, crossing collision and future prediction. */
export function gateStateAtTime(c:SlidingGateConfig,t:number){
 const y=c.baseY??3;
 if(c.movementMode!=='rapidShutter')return {x:c.baseX+Math.sin(t*c.speed+(c.phase??0))*c.amplitude,y,width:c.openingWidth,height:c.openingHeight,shutter:null};
 const r=c.shutter??{},a=shutterStateAtTime(r,t),b=r.pattern==='asymmetric'?shutterStateAtTime(r,t-.08):a;
 const vertical=r.orientation==='vertical',max=r.maxOpeningWidth??(vertical?c.openingHeight:c.openingWidth),min=Math.max(0,Math.min(max,r.minOpeningWidth??0));
 const left=(min+(max-min)*a.fraction)/2,right=(min+(max-min)*b.fraction)/2;
 return {x:c.baseX+(vertical?0:(right-left)/2),y:y+(vertical?(right-left)/2:0),width:vertical?c.openingWidth:left+right,height:vertical?left+right:c.openingHeight,shutter:a};
}
export type ShutterEvent='gate_open_start'|'gate_open_complete'|'gate_warning'|'gate_slam_start'|'gate_slam_impact';
export const SHUTTER_EVENTS:Record<ShutterPhase,ShutterEvent>={CLOSED:'gate_slam_impact',OPENING:'gate_open_start',OPEN:'gate_open_complete',WARNING:'gate_warning',SLAMMING_CLOSED:'gate_slam_start'};
