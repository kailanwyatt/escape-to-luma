import type {CampaignLevelDefinition} from '../types';
import {isRotorConfig} from '../../config/ObstacleConfig';

/** Authored revision: alternate landing regions and approach heights, not random destinations.
 * Stable level IDs/save records and obstacle clocks are unchanged. */
export function rebalanceCampaign(source:CampaignLevelDefinition):CampaignLevelDefinition {
 const n=source.levelNumber;
 if(n<=7||n===16||n===150||source.challenge.ricochet)return source;
 const level:CampaignLevelDefinition=JSON.parse(JSON.stringify(source));
 const c=level.challenge,local=(n-1)%15,world=Math.floor((n-1)/15);
 const side=(local+world)%2===0?-1:1;
 const span=world===0?.72:Math.min(1.28,.92+world*.045);
 const magnitude=[1,.92,.78,1,.86][(local+world*2)%5];
 const heights=[2.4,3.65,2.75,3.4,2.3,3.8,3.1];
 c.target.x=side*span*magnitude;
 c.target.y=world===0?2.7+(local%3)*.35:heights[(local+world*2)%heights.length];
 c.target.movement=undefined;
 const timing=c.obstacles.length>1;
 c.target.radius=world===0?.92:timing?.88:local===0?.9:Math.max(.78,.88-world*.015-local*.003);
 // Preserve the established collision spacing while making approach depths alternate.
 if(c.obstacles.length===1&&!isRotorConfig(c.obstacles[0])&&n>30)c.obstacles[0].z=[5.7,6.4,7.1][(local+world)%3];
 for(const o of c.obstacles){
  if(isRotorConfig(o))continue;
  const x=c.target.x*o.z/(c.target.z??12),y=3+(c.target.y-3)*.6;
  switch(o.type){
   case 'slidingGate':o.baseX=x;o.baseY=y;o.openingWidth=Math.max(1.45,o.openingWidth-.15);break;
   case 'movingRing':
    o.baseX=x;o.baseY=y;o.radius=Math.max(.98,o.radius-.25);
    o.movement.amplitudeX=Math.min(o.movement.amplitudeX,1.68-Math.abs(x));break;
   case 'iris':o.centerX=x;o.centerY=y;o.maxRadius=Math.max(1.18,o.maxRadius-.18);break;
   case 'pendulum':o.pivotX=x;o.pivotY=y+o.length;o.blockerRadius=Math.min(.6,o.blockerRadius+.13);break;
   case 'orbiter':o.centerX=x;o.centerY=y;o.blockerRadius=Math.min(.58,o.blockerRadius+.08);break;
   case 'driftingBlocker':o.baseX=x;o.baseY=y;o.blockerRadius=Math.min(.78,o.blockerRadius+.1);o.amplitudeX=Math.min(o.amplitudeX,2.35-Math.abs(x));break;
   case 'phaseField':o.centerX=x;o.centerY=y;break;
   case 'shiftingAperture':o.baseX=x;o.baseY=y;break;
  }
 }
 return level;
}
