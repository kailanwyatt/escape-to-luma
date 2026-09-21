import type {RicochetConfig,Vec3} from './ReflectorConfig';
import {stepRicochet,RICOCHET_STEP,type Bounce} from './Reflection';
import type {MotionState,PhysicsForces} from '../projectile/physics';
import {GAME_TUNING} from '../game/gameTuning';
export type TraceSegment=(a:Vec3,b:Vec3,time:number,dt:number)=>boolean;
export function traceRicochet(start:MotionState,config:RicochetConfig,endZ:number,time:number,forces:PhysicsForces={},segment?:TraceSegment){
 const state={...start},status={bounces:0,blocked:false};const path:Vec3[]=[{x:state.x,y:state.y,z:state.z}];const bounces:Bounce[]=[];
 let arrival:{x:number;y:number;z:number;time:number}|null=null;
 for(let i=0;i<GAME_TUNING.projectile.maxFlightTime/RICOCHET_STEP&&!status.blocked&&!arrival;i++){
  stepRicochet(state,RICOCHET_STEP,time+i*RICOCHET_STEP,forces,config,status,GAME_TUNING.projectile.radius,(a,b,clock,dt)=>{
   if(segment?.(a,b,clock,dt)===false)return false;
   if(a.z<endZ&&b.z>=endZ){const u=(endZ-a.z)/(b.z-a.z);arrival={x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u,z:endZ,time:clock-time+dt*u};path.push(arrival);return false;}
   return true;
  },bounce=>{bounces.push(bounce);path.push({...bounce.point});});
  if(i%4===0&&!arrival)path.push({x:state.x,y:state.y,z:state.z});
  if(state.y<GAME_TUNING.projectile.floorY||state.z< -3)break;
 }
 return {state,path,bounces,arrival:arrival as {x:number;y:number;z:number;time:number}|null,blocked:status.blocked&&!arrival};
}
