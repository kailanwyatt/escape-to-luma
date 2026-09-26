import type {ReflectorConfig,Vec3,RicochetConfig} from './ReflectorConfig';
import {sampleMovement} from '../config/MovementConfig';
import {integrateMotion,type MotionState,type PhysicsForces} from '../projectile/physics';
export const RICOCHET_STEP=1/120;
export type Bounce={id:string;point:Vec3;normal:Vec3;incoming:Vec3;outgoing:Vec3;time:number};
export type RicochetState={bounces:number;blocked:boolean};

/** Frame/backing contact before the required bounce count is a Miss, not Blocked. */
export function ricochetBlockResult(
  status: RicochetState,
  requiredBounces: number,
): 'MISS' | 'ROTOR_HIT' {
  return status.bounces < requiredBounces ? 'MISS' : 'ROTOR_HIT';
}
export function reflectVelocity(v:Vec3,n:Vec3):Vec3 {
  const length=Math.hypot(n.x,n.y,n.z);if(length<1e-8)throw new Error('Reflector normal cannot be zero');
  const x=n.x/length,y=n.y/length,z=n.z/length,d=2*(v.x*x+v.y*y+v.z*z);
  return {x:v.x-d*x,y:v.y-d*y,z:v.z-d*z};
}
export function reflectorPose(c:ReflectorConfig,time:number){
  const p={...c.position};const m=c.movement;
  if(m?.type==='horizontal')p.x=sampleMovement(m,p.x,time);
  if(m?.type==='vertical')p.y=sampleMovement(m,p.y,time);
  const len=Math.hypot(c.normal.x,c.normal.y,c.normal.z);
  const n={x:c.normal.x/len,y:c.normal.y/len,z:c.normal.z/len};
  // Stable basis, including horizontal reflecting surfaces.
  const ref=Math.abs(n.y)>.95?{x:1,y:0,z:0}:{x:0,y:1,z:0};
  const ux=ref.y*n.z-ref.z*n.y,uy=ref.z*n.x-ref.x*n.z,uz=ref.x*n.y-ref.y*n.x;
  const ul=Math.hypot(ux,uy,uz),u={x:ux/ul,y:uy/ul,z:uz/ul};
  const v={x:n.y*u.z-n.z*u.y,y:n.z*u.x-n.x*u.z,z:n.x*u.y-n.y*u.x};
  return {p,n,u,v};
}
function dot(a:Vec3,b:Vec3){return a.x*b.x+a.y*b.y+a.z*b.z;}
function sub(a:Vec3,b:Vec3):Vec3{return {x:a.x-b.x,y:a.y-b.y,z:a.z-b.z};}

/** Swept sphere against a finite moving panel. Front reflects; backing/frame fail. */
export function reflectorHit(a:Vec3,b:Vec3,c:ReflectorConfig,time:number,dt:number,radius:number){
  if(c.active===false)return null;
  const start=reflectorPose(c,time),end=reflectorPose(c,time+dt);
  const da=dot(sub(a,start.p),start.n),db=dot(sub(b,end.p),start.n);
  const front=da>=radius-1e-6 && db<radius;
  const backDepth=.35;
  const back=da<=-radius-backDepth+1e-6 && db>-radius-backDepth;
  if(!front&&!back){
    // Swept slab catches the side of the solid backing even when the face plane
    // is never crossed. Only the designated front-face branch may reflect.
    const ra=sub(a,start.p),rb=sub(b,end.p);
    const aa=[dot(ra,start.u),dot(ra,start.v),da],bb=[dot(rb,start.u),dot(rb,start.v),db];
    const low=[-c.width/2-radius,-c.height/2-radius,-backDepth-radius];
    const high=[c.width/2+radius,c.height/2+radius,radius];
    let enter=0,leave=1;
    for(let axis=0;axis<3;axis++){
      const delta=bb[axis]-aa[axis];
      if(Math.abs(delta)<1e-9){if(aa[axis]<low[axis]||aa[axis]>high[axis])return null;continue;}
      const t1=(low[axis]-aa[axis])/delta,t2=(high[axis]-aa[axis])/delta;
      enter=Math.max(enter,Math.min(t1,t2));leave=Math.min(leave,Math.max(t1,t2));
      if(enter>leave)return null;
    }
    if(enter<=0||enter>1)return null;
    const center={x:a.x+(b.x-a.x)*enter,y:a.y+(b.y-a.y)*enter,z:a.z+(b.z-a.z)*enter};
    return {fraction:enter,center,normal:start.n,reflective:false,point:center};
  }
  const sign=front?1:-1;
  // Refine moving-panel contact against its actual position at impact time.
  let lo=0,hi=1;
  for(let i=0;i<14;i++){
    const t=(lo+hi)/2;const pose=reflectorPose(c,time+t*dt);
    const point={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t};
    if(sign*dot(sub(point,pose.p),pose.n)>(front?radius:radius+backDepth))lo=t;else hi=t;
  }
  const fraction=(lo+hi)/2,pose=reflectorPose(c,time+fraction*dt);
  const center={x:a.x+(b.x-a.x)*fraction,y:a.y+(b.y-a.y)*fraction,z:a.z+(b.z-a.z)*fraction};
  const rel=sub(center,pose.p),u=Math.abs(dot(rel,pose.u)),v=Math.abs(dot(rel,pose.v));
  if(u>c.width/2+radius||v>c.height/2+radius)return null;
  const reflective=front&&u<=c.width/2-radius&&v<=c.height/2-radius;
  return {fraction,center,normal:pose.n,reflective,point:{x:center.x-pose.n.x*radius*sign,y:center.y-pose.n.y*radius*sign,z:center.z-pose.n.z*radius*sign}};
}

/** Shared live/preview step. The segment callback lets ordinary hazards stop flight
 * before a reflector. Every outgoing segment remains subject to normal collision. */
export function stepRicochet(state:MotionState,dt:number,time:number,forces:PhysicsForces,config:RicochetConfig,status:RicochetState,radius:number,
  segment?:(a:Vec3,b:Vec3,time:number,dt:number)=>boolean,onBounce?:(bounce:Bounce)=>void):void {
  let remaining=dt,clock=time;
  for(let contacts=0;contacts<4&&remaining>1e-8&&!status.blocked;contacts++){
    const a={x:state.x,y:state.y,z:state.z};const next={...state};integrateMotion(next,remaining,forces);
    let nearest:ReturnType<typeof reflectorHit>=null;let panel:ReflectorConfig|undefined;
    for(const c of config.reflectors){const hit=reflectorHit(a,next,c,clock,remaining,radius);if(hit&&(!nearest||hit.fraction<nearest.fraction)){nearest=hit;panel=c;}}
    const fraction=nearest?.fraction??1,used=remaining*fraction;
    const end=nearest?.center??next;
    if(segment?.(a,end,clock,used)===false){status.blocked=true;return;}
    if(!nearest){Object.assign(state,next);return;}
    // Use the same semi-implicit force update at the contact substep in both paths.
    const contact={...state};integrateMotion(contact,used,forces);
    Object.assign(state,{...contact,x:end.x,y:end.y,z:end.z});
    if(!nearest.reflective||status.bounces>=Math.min(2,config.maxBounces)){status.blocked=true;return;}
    const incoming={x:state.vx,y:state.vy,z:state.vz};const outgoing=reflectVelocity(incoming,nearest.normal);
    state.vx=outgoing.x;state.vy=outgoing.y;state.vz=outgoing.z;
    state.x+=nearest.normal.x*0.0001;state.y+=nearest.normal.y*0.0001;state.z+=nearest.normal.z*0.0001;
    status.bounces++;onBounce?.({id:panel!.id,point:nearest.point,normal:nearest.normal,incoming,outgoing,time:clock+used});
    clock+=used;remaining-=used;
  }
}
