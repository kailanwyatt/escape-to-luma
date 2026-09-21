import {writeFileSync} from 'node:fs';
import {AimSystem} from '../src/projectile/AimSystem';
import {integrateMotion} from '../src/projectile/physics';
import {reflectVelocity,stepRicochet,RICOCHET_STEP} from '../src/reflectors/Reflection';
import {traceRicochet} from '../src/reflectors/RicochetTrace';
import type {ReflectorConfig,RicochetConfig} from '../src/reflectors/ReflectorConfig';
const aim=new AimSystem();aim.begin(195,600);aim.move(195-390*.22,600);const velocity=aim.end();
const initial={x:0,y:.6,z:0,...velocity};const data:Record<number,unknown>={};
const variants=['satelliteReflector','solarArrayReflector','lunarDishReflector','crystalReflector','energyCrystalReflector','ancientReflector','lumaReflector'] as const;
for(const [number,stage,world] of [[48,1,0],[50,2,0],[52,3,0],[55,4,0],[58,5,0],[65,5,1],[78,6,2],[87,6,2],[95,3,3],[110,4,4],[125,5,5],[140,6,6]]){
 const dragX=({48:-.22,50:.22,52:-.19,55:.24,58:-.26,65:.2,78:-.22,87:.24,95:-.24,110:.19,125:-.21,140:.25} as Record<number,number>)[number];
 const direction=dragX<0?1:-1;
 const courseAim=new AimSystem();courseAim.begin(195,600);courseAim.move(195+390*dragX,600);
 const initial={x:0,y:.6,z:0,...courseAim.end()};
 const second=stage===6;const panelZ=second?5:stage===2?8.9:8.4;
 const nz=second?-.1:stage===2?-.24:-.2;
 const normal={x:-direction*Math.sqrt(1-nz*nz),y:0,z:nz};
 const state={...initial};let time=0;while(state.z<panelZ-1e-8){const dt=Math.min(RICOCHET_STEP,(panelZ-state.z)/state.vz);integrateMotion(state,dt);time+=dt;}
 const panel:ReflectorConfig={id:`l${number}-a`,position:{x:state.x-normal.x*.22,y:state.y,z:state.z-normal.z*.22},normal,width:stage===3?1.08:stage===4?1.8:2.4,height:stage===3?1.35:2.6,visualVariant:variants[world]};
 if(stage===4){panel.movement={type:'horizontal',amplitude:.18,speed:.4,phase:0};panel.position.x-=Math.sin(time*.4)*.18;}
 const config:RicochetConfig={reflectors:[panel],maxBounces:second?2:1,requiredBounces:second?2:1,fullGuide:stage===1||stage===2||number===78};
 if(second){
  const sim={...initial},status={bounces:0,blocked:false};let clock=0;
  while(sim.z<10&&clock<3){stepRicochet(sim,RICOCHET_STEP,clock,{},config,status,.22);clock+=RICOCHET_STEP;}
  const n={x:direction*Math.sqrt(.99),y:0,z:-.1};config.reflectors.push({id:`l${number}-b`,position:{x:sim.x-n.x*.22,y:sim.y,z:sim.z-n.z*.22},normal:n,width:2.5,height:2.6,visualVariant:variants[world]});
 }
 const trace=traceRicochet(initial,config,12,0);if(!trace.arrival||trace.bounces.length!==config.requiredBounces)throw new Error(`failed ${number}`);
 const at=trace.arrival;console.log(number,at,trace.bounces.length);
 if(Math.abs(at.x)>1.35||at.y<2.25||at.y>3.85)throw new Error(`target bounds ${number}`);
 const obstacles=stage===5?[{type:'driftingBlocker',z:10.2,baseX:at.x*10.2/12,baseY:3,blockerRadius:.8,amplitudeX:0,amplitudeY:0,speed:0}]:[];
 data[number]={ricochet:config,target:{x:at.x,y:at.y,z:12,radius:stage<=2?1.1:.92},obstacles,stage,witness:{dragX,dragY:0}};
}
writeFileSync('src/campaign/levels/ricochetCourses.json',JSON.stringify(data,null,2)+'\n');
