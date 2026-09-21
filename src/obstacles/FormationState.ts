import type {FormationConfig} from '../config/ObstacleConfig';
import type {ObstacleCollisionResult} from './ObstacleCollision';

export type FormationPart = {x:number;y:number;width:number;height:number;radius:number;active:boolean;warning:boolean};
const tau=Math.PI*2;
const mod=(a:number,b:number)=>((a%b)+b)%b;
/** Shared by rendering, flight collision and trajectory prediction. No per-frame randomness. */
export function formationParts(c:FormationConfig,time:number):FormationPart[] {
 const t=time*c.speed*(c.direction??1)+(c.phase??0), cy=c.centerY??3;
 const box=(x:number,y:number,width:number,height:number,active=true,warning=false):FormationPart=>({x,y,width,height,radius:0,active,warning});
 const rock=(x:number,y:number,radius:number):FormationPart=>({x,y,width:0,height:0,radius,active:true,warning:false});
 if(c.variant==='conveyor')return Array.from({length:10},(_,i)=>{
  const row=Math.floor(i/5), x=mod((i%5)*2.15+t+row*.95+5.375,10.75)-5.375;
  return rock(x,cy+(row===0?-.78:.78),.53+(i%3)*.035);
 });
 if(c.variant==='expandingDebris')return Array.from({length:8},(_,i)=>{
  const a=i*tau/8+t*.12, distance=.48+2.1*(.5+.5*Math.sin(t));
  return rock(Math.cos(a)*distance,cy+Math.sin(a)*distance,.48);
 });
 if(c.variant==='phaseColumns')return Array.from({length:5},(_,i)=>{
  const p=mod(t-i*.22,1);return box((i-2)*1.03,cy,.72,4.5,p<.57,p>=.84);
 });
 if(c.variant==='alternatingDoors'){
  const parts=[box(-2.05,cy,.25,4.4),box(2.05,cy,.25,4.4),box(0,cy,.22,4.4),box(0,cy-2.1,4.35,.2),box(0,cy+2.1,4.35,.2)];
  for(const side of [-1,1]){
   const p=mod(t+(side===1?.5:0),1);
   // One lane opens as the other closes. Retraction is visible and authoritative.
   const open=p<.12?p/.12:p<.42?1:p<.54?1-(p-.42)/.12:0;
   const height=4*(1-open);
   parts.push(box(side*1.025,cy+2-height/2,1.8,Math.max(.001,height),height>.001,p>.34&&p<.42));
  }return parts;
 }
 return [];
}
export function evaluateFormation(c:FormationConfig,time:number,x:number,y:number,r:number):ObstacleCollisionResult {
 let clearance=Infinity;
 if(c.variant==='rotatingMaze'){
  const a=time*c.speed*(c.direction??1)+(c.phase??0),cy=c.centerY??3;
  const hx=Math.cos(a)*.85,hy=cy+Math.sin(a)*.85;
  // Entire visible plate except its eccentric aperture is solid.
  const hole=(c.openingRadius??1.05)-Math.hypot(x-hx,y-hy)-r;
  const outside=Math.hypot(x,y-cy)-2.6-r;
  clearance=Math.max(hole,outside);
 }else for(const p of formationParts(c,time)){
  if(!p.active)continue;
  let d:number;
  if(p.radius)d=Math.hypot(x-p.x,y-p.y)-p.radius-r;
  else {const dx=Math.abs(x-p.x)-p.width/2,dy=Math.abs(y-p.y)-p.height/2;d=Math.hypot(Math.max(0,dx),Math.max(0,dy))+Math.min(Math.max(dx,dy),0)-r;}
  clearance=Math.min(clearance,d);
 }
 return {hit:clearance<0?(c.variant==='conveyor'||c.variant==='expandingDebris'?'drift':c.variant==='phaseColumns'?'phase':'gate'):null,nearMiss:clearance>=0&&clearance<.16,clearance};
}
