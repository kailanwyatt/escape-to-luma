import courses from '../src/campaign/levels/ricochetCourses.json';
import {TrajectoryPredictor} from '../src/projectile/TrajectoryPredictor';
import {describe,it,expect} from 'vitest';
import {AimSystem} from '../src/projectile/AimSystem';
import {getCampaignLevel} from '../src/campaign/levels';
import {traceRicochet} from '../src/reflectors/RicochetTrace';
import {stepRicochet,RICOCHET_STEP,reflectorHit,ricochetBlockResult,type Bounce} from '../src/reflectors/Reflection';
import {predictShot} from '../src/debug/ShotDiagnostics';
import {ObstacleSlot} from '../src/obstacles/ObstacleSlot';
import {Target} from '../src/target/Target';
import {storyForLevel} from '../src/campaign/StoryMoments';
import type {ReflectorConfig} from '../src/reflectors/ReflectorConfig';
const launch=(n=50)=>{const aim=new AimSystem();aim.begin(195,600);aim.move(195+390*(courses as Record<string,{witness:{dragX:number}}>)[n].witness.dragX,600);return {x:0,y:.6,z:0,...aim.end()};};
describe('ricochet integration',()=>{
 it('treats a failed required bounce as Miss, not Blocked',()=>{
  expect(ricochetBlockResult({bounces:0,blocked:true},2)).toBe('MISS');
  expect(ricochetBlockResult({bounces:1,blocked:true},2)).toBe('MISS');
  expect(ricochetBlockResult({bounces:2,blocked:true},2)).toBe('ROTOR_HIT');
  expect(ricochetBlockResult({bounces:1,blocked:true},1)).toBe('ROTOR_HIT');
 });
 it('matches live fixed steps and prediction for stationary, moving and two-bounce courses at 30/60/120 fps',()=>{
  // L48 is docking-collar isolation now; keep authored bank-shot courses only.
  for(const n of [50,52,55,87])for(const fps of [30,60,120]){
   const config=getCampaignLevel(n)!.challenge.ricochet!;
   const expected=traceRicochet(launch(n),config,12,0);
   expect(expected.arrival,`L${n}`).not.toBeNull();expect(expected.bounces).toHaveLength(config.requiredBounces);
   const state=launch(n),status={bounces:0,blocked:false},bounces:Bounce[]=[];
   let accumulator=0,time=0,arrival:{x:number;y:number;z:number}|undefined;
   for(let frame=0;frame<fps*4&&!arrival;frame++){
    accumulator+=1/fps;
    while(accumulator>=RICOCHET_STEP&&!arrival){
     stepRicochet(state,RICOCHET_STEP,time,{},config,status,.22,(a,b)=>{
      if(a.z<12&&b.z>=12){const u=(12-a.z)/(b.z-a.z);arrival={x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u,z:12};return false;}return true;
     },b=>bounces.push(b));time+=RICOCHET_STEP;accumulator-=RICOCHET_STEP;
    }
   }
   expect(arrival!.x).toBeCloseTo(expected.arrival!.x,7);expect(arrival!.y).toBeCloseTo(expected.arrival!.y,7);
   expect(bounces).toHaveLength(expected.bounces.length);
   bounces.forEach((b,i)=>{expect(b.point.x).toBeCloseTo(expected.bounces[i].point.x,7);expect(b.point.y).toBeCloseTo(expected.bounces[i].point.y,7);expect(b.time).toBeCloseTo(expected.bounces[i].time,7);});
  }
 });
 it('samples a moving panel at impact instead of its launch pose',()=>{
  const c:ReflectorConfig={id:'moving',position:{x:0,y:0,z:0},normal:{x:0,y:1,z:0},width:1,height:1,movement:{type:'horizontal',amplitude:1,speed:Math.PI,phase:0}};
  const a={x:1,y:1,z:0},b={x:1,y:-1,z:0};
  expect(reflectorHit(a,b,{...c,movement:undefined},0,1,.1)).toBeNull();
  expect(reflectorHit(a,b,c,0,1,.1)?.reflective).toBe(true);
 });
 it('stops on a third contact and never loops indefinitely',()=>{
  const panels:ReflectorConfig[]=[{id:'a',position:{x:0,y:0,z:0},normal:{x:0,y:1,z:0},width:20,height:20},{id:'b',position:{x:0,y:2,z:0},normal:{x:0,y:-1,z:0},width:20,height:20}];
  const state={x:0,y:1,z:0,vx:0,vy:-10,vz:0},status={bounces:0,blocked:false};
  for(let i=0;i<120&&!status.blocked;i++)stepRicochet(state,RICOCHET_STEP,i*RICOCHET_STEP,{gravityScale:0},{reflectors:panels,maxBounces:2,requiredBounces:2},status,.22);
  expect(status).toEqual({bounces:2,blocked:true});
 });
 it('uses the real obstacle predictor on the reflected path and retains portal scoring',()=>{
  const def=getCampaignLevel(50)!;const target=new Target();target.applyConfig(def.challenge.target);
  const empty:ObstacleSlot[]=[];const initial=launch(50);
  const success=predictShot(initial,initial,empty,target,0,1,{},0,def.challenge.ricochet);
  expect(success.target.verdict).toBe('PERFECT');expect(success.bounces).toHaveLength(1);
  const path=success.path.find(p=>p.z>10)!;
  const obstacle=new ObstacleSlot('blocked');obstacle.applyConfig({type:'driftingBlocker',z:path.z,baseX:path.x,baseY:path.y,blockerRadius:.7,amplitudeX:0,amplitudeY:0,speed:0},'space');
  const fail=predictShot(initial,initial,[obstacle],target,0,1,{},0,def.challenge.ricochet);
  expect(fail.rotors[0].verdict).toBe('HIT');expect(fail.target.verdict).toBe('MISS');
  obstacle.applyConfig({type:'driftingBlocker',z:2,baseX:initial.vx*2/initial.vz,baseY:1.4,blockerRadius:.7,amplitudeX:0,amplitudeY:0,speed:0},'space');
  const early=predictShot(initial,initial,[obstacle],target,0,1,{},0,def.challenge.ricochet);
  expect(early.bounces).toHaveLength(0);expect(early.target.verdict).toBe('MISS');obstacle.dispose();
 });
 it('shows the complete route with Guidance and shortens normal assistance after the first bounce',()=>{
  const def=getCampaignLevel(87)!;const target=new Target();target.applyConfig(def.challenge.target);const initial=launch(87);
  const prediction=predictShot(initial,initial,[],target,0,1,{},0,def.challenge.ricochet);
  const guide=new TrajectoryPredictor();guide.showRicochet(prediction,false);
  const line=guide.group.children.find(o=>o.type==='Line') as import('three').Line;
  const short=line.geometry.drawRange.count;guide.setDebugFull(true);guide.showRicochet(prediction,false);
  expect(line.geometry.drawRange.count).toBe(prediction.path.length);expect(short).toBeLessThan(prediction.path.length);
 });
 it('recovers a missing iris lesson even if the world arrival was acknowledged',()=>{
  const story=storyForLevel(46,['arrival.level-46'])!;expect(story.id).toBe('mechanic.iris.v2');expect(story.instruction).toContain('expands');
  // L47 is the Rolling Aperture isolation remap (Upper Atmosphere).
  expect(storyForLevel(47,[])?.id).toBe('encounter.47.v1');
  expect(storyForLevel(47,['encounter.47.v1','arrival.level-46','mechanic.iris.v2'])).toBeNull();
  expect(storyForLevel(48,[])?.instruction).toContain('cyan');
  expect(storyForLevel(87,[])?.instruction).toContain('both');
  // L78 is gravity-slingshot teach on Moon (magnetopause remap is elsewhere).
  expect(storyForLevel(78,[])?.instruction?.length).toBeGreaterThan(10);
 });
});
