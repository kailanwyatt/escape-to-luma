import type {CampaignLevelDefinition} from '../types';
import type {FormationConfig,ObstacleConfig} from '../../config/ObstacleConfig';

export const ENCOUNTER_LESSONS:Record<number,{name:string;body:string;hint:string}>={
 22:{name:'Alternating Doors',body:'Rooftop security switches between two lanes. One door retracts while the other seals.',hint:'Choose a lane, then time Spark’s arrival. Amber warns that the open door is about to close.'},
 24:{name:'Alternating Doors',body:'The next checkpoint switches faster, and the destination is on the other side.',hint:'Aim right. Watch the complete door cycle before releasing.'},
 78:{name:'Gravity Slingshot',body:'A dense lunar fragment bends the route toward itself. Spark can use its pull to curve around the rock.',hint:'Aim beside the rock, not into it. The cyan field attracts Spark; watch the curved aim guide.'},
 83:{name:'Gravity Slingshot',body:'The gravity pocket is stronger on this side of the relay.',hint:'Allow for the pull toward the right. Keep Spark clear of the solid rock at the field’s center.'},
 92:{name:'Asteroid Conveyor',body:'Streams of rock flow sideways across the next gate. Clear gaps travel with the current.',hint:'Predict where the gap will be when Spark arrives. The solid rocks are dangerous.'},
 95:{name:'Asteroid Conveyor',body:'The current accelerates and the gate sits away from the center.',hint:'Aim left and lead the moving gap. A straight repeated throw will not follow the destination.'},
 99:{name:'Asteroid Conveyor',body:'Two currents cross at different depths and travel in opposite directions.',hint:'Check both streams. Spark needs a clear gap at each arrival time.'},
 96:{name:'Expanding Debris',body:'Fragments spread outward, then converge again around the route.',hint:'Launch through the center while the rocks spread. Their return closes the corridor.'},
 102:{name:'Expanding Debris',body:'Two debris clusters breathe at different rates.',hint:'Read the near cluster, then the far one. Time the whole flight rather than the first opening.'},
 108:{name:'Phase Columns',body:'Columns of condensed energy emerge from the nebula, then fade back into it.',hint:'Bright filled columns are solid. Dim outlines are passable. Amber warns that a column is returning.'},
 113:{name:'Phase Columns',body:'A second row of energy columns follows a different rhythm.',hint:'Find a route through both rows. A quiet column may be solid again before Spark arrives.'},
 123:{name:'Rotating Maze',body:'An ancient plate turns an off-center opening around its axis.',hint:'Follow the amber aperture. Aim where the opening will be when Spark reaches the plate.'},
 127:{name:'Rotating Maze',body:'Two ancient plates rotate in opposite directions.',hint:'Wait for a route through both amber openings, then commit to the shot.'},
 129:{name:'Sequential Tunnel',body:'Three mechanisms form one timed passage through the network.',hint:'Pass all three apertures in one flight. Each opens in sequence; power changes your arrival timing.'},
 142:{name:'Sequential Tunnel',body:'Luma’s approach repeats the sequence at a quicker rhythm.',hint:'Watch all three gates. Aim through the entire passage and adjust power to match its rhythm.'},
};

/** Deliberate playtest courses; preserve level IDs, rewards, world exits and save progress. */
export function applyNewEncounters(source:CampaignLevelDefinition):CampaignLevelDefinition {
 const lesson=ENCOUNTER_LESSONS[source.levelNumber];if(!lesson)return source;
 const level:CampaignLevelDefinition=JSON.parse(JSON.stringify(source));
 const n=level.levelNumber;
 const formation=(variant:FormationConfig['variant'],z:number,speed:number,phase=0,direction:1|-1=1):FormationConfig=>({type:'formation',variant,z,speed,phase,direction,centerY:3});
 let obstacles:ObstacleConfig[]=[];
 let target={x:0,y:3.1,z:12,radius:.92};
 level.windX=0;level.gravityScale=1;level.gravityWells=[];
 if(n===22||n===24){
  obstacles=[formation('alternatingDoors',6.1,n===22?.3:.39)];
  target.x=n===22?-.95:1.05;
 }else if(n===78||n===83){
  const side=n===78?-1:1;
  level.gravityScale=.72;
  level.gravityWells=[{x:side*1.1,y:2.8,z:6.2,strength:n===78?12:15,radius:4.1}];
  obstacles=[{type:'driftingBlocker',z:6.2,baseX:side*1.1,baseY:2.8,blockerRadius:.57,amplitudeX:0,amplitudeY:0,speed:0}];
  target={x:side*.95,y:3.2,z:12,radius:n===78?1:.86};
 }else if(n===92||n===95||n===99){
  obstacles=[formation('conveyor',5.8,n===92?.85:1.3)];
  if(n===99)obstacles.push(formation('conveyor',8.4,1.05,1,-1));
  target.x=n===95?-1.05:n===99?.75:0;
 }else if(n===96||n===102){
  obstacles=[formation('expandingDebris',6,n===96?1.15:1.4)];
  if(n===102)obstacles.push(formation('expandingDebris',8.6,1.1,1.25));
 }else if(n===108||n===113){
  obstacles=[formation('phaseColumns',5.8,n===108?.32:.4)];
  if(n===113)obstacles.push(formation('phaseColumns',8.4,.35,.4));
  target.x=n===108?.85:-.8;
 }else if(n===123||n===127){
  obstacles=[{...formation('rotatingMaze',5.8,.65),centerY:2.7,openingRadius:1}];
  if(n===127)obstacles.push({...formation('rotatingMaze',8.4,.48,.6,-1),centerY:3.15,openingRadius:1.08});
  target.x=n===123?.6:-.4;
 }else{
  const speed=n===129?2:2.5;
  obstacles=[4.6,7,9.4].map((z,i)=>({type:'iris',z,centerX:0,centerY:[2.4,2.95,3.25][i],minRadius:.3,maxRadius:n===129?1.35:1.18,speed,phase:-z/9*speed}));
  level.gravityScale=.8;target.y=3.35;
 }
 level.tutorialHint=lesson.hint;
 level.challenge={...level.challenge,template:'COMBINED_HAZARD',obstacles,target,ricochet:undefined,tags:[...(level.challenge.tags??[]),'new-encounter',lesson.name]};
 return level;
}
