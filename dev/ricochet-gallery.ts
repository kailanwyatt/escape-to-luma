import courses from '../src/campaign/levels/ricochetCourses.json';
import * as THREE from 'three';
import {AimSystem} from '../src/projectile/AimSystem';
import {Projectile} from '../src/projectile/Projectile';
import {TrajectoryPredictor} from '../src/projectile/TrajectoryPredictor';
import {Target} from '../src/target/Target';
import {ObstacleSlot} from '../src/obstacles/ObstacleSlot';
import {ReflectorField} from '../src/reflectors/ReflectorField';
import {stepRicochet,RICOCHET_STEP} from '../src/reflectors/Reflection';
import {predictShot} from '../src/debug/ShotDiagnostics';
import {getCampaignLevel} from '../src/campaign/levels';
import {GAME_TUNING} from '../src/game/gameTuning';
import {scoreTarget} from '../src/target/TargetScoring';
import type {ReflectorVisualVariant} from '../src/reflectors/ReflectorConfig';
const stage=document.getElementById('stage') as HTMLSelectElement;
const variant=document.getElementById('variant') as HTMLSelectElement;
const movement=document.getElementById('movement') as HTMLSelectElement;
const angle=document.getElementById('angle') as HTMLInputElement;
const debug=document.getElementById('debug') as HTMLInputElement;
const text=document.getElementById('status')!;
const viewport=document.getElementById('viewport')!;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x080d1c);
scene.add(new THREE.AmbientLight(0x9dcaff,1.1));const sun=new THREE.DirectionalLight(0xffe7c1,1.6);sun.position.set(-3,7,-5);scene.add(sun);
const camera=new THREE.PerspectiveCamera(GAME_TUNING.camera.fov,1,.1,80);camera.position.fromArray(GAME_TUNING.camera.position);camera.lookAt(...GAME_TUNING.camera.lookAt);
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(2,devicePixelRatio));viewport.appendChild(renderer.domElement);
const stars=new THREE.BufferGeometry();const dots=[];for(let i=0;i<120;i++)dots.push(Math.sin(i*4.31)*20,Math.cos(i*2.71)*14,24+i%10);stars.setAttribute('position',new THREE.Float32BufferAttribute(dots,3));scene.add(new THREE.Points(stars,new THREE.PointsMaterial({color:0xb8cbe5,size:.045})));
const field=new ReflectorField(),target=new Target(),ball=new Projectile(),trajectory=new TrajectoryPredictor();scene.add(field.group,target.group,ball.mesh,trajectory.group);
const obstacles=[new ObstacleSlot('A'),new ObstacleSlot('B')];scene.add(...obstacles.map(o=>o.group));
const aim=new AimSystem();let def=getCampaignLevel(48)!,config=def.challenge.ricochet!,time=0,flight=false,accumulator=0,last=performance.now();let previewDemo=false,previewAt=0;let launchedAt=0;let status={bounces:0,blocked:false},state={x:0,y:.6,z:0,vx:0,vy:0,vz:0};
function resize(){const r=viewport.getBoundingClientRect();renderer.setSize(r.width,r.height);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();aim.setScreenSize(r.width,r.height);}resize();window.addEventListener('resize',resize);
function reset(){
 previewDemo=false;def=getCampaignLevel(Number(stage.value))!;config=JSON.parse(JSON.stringify(def.challenge.ricochet));time=0;flight=false;status={bounces:0,blocked:false};accumulator=0;
 for(const c of config.reflectors){if(variant.value!=='world')c.visualVariant=variant.value as ReflectorVisualVariant;if(movement.value!=='authored')c.movement=movement.value==='none'?undefined:{type:movement.value as 'horizontal'|'vertical',amplitude:.18,speed:.4};
  const a=Number(angle.value)*Math.PI/180;if(a){const n=c.normal;c.normal={x:n.x*Math.cos(a)+n.z*Math.sin(a),y:n.y,z:-n.x*Math.sin(a)+n.z*Math.cos(a)};}}
 target.applyConfig(def.challenge.target);field.setReflectors(config.reflectors);obstacles.forEach((o,i)=>{if(def.challenge.obstacles[i])o.applyConfig(def.challenge.obstacles[i],'space');else o.hide();});
 ball.position.set(0,.6,0);ball.velocity.set(0,0,0);ball.syncMesh();trajectory.setVisible(false);text.textContent=def.tutorialHint??'Aim at the marked face';
}
function preview(){const v=aim.getLaunchVelocity();const prediction=predictShot(ball.position,v,obstacles,target,time,1,{},time,config);trajectory.showRicochet(prediction,true);trajectory.setVisible(true);text.textContent=`${prediction.bounces?.length??0} predicted bounce(s) · ${prediction.target.verdict}`;}
function launch(){const v=aim.end();state={x:0,y:.6,z:0,...v};status={bounces:0,blocked:false};launchedAt=time;flight=true;trajectory.setVisible(false);}
renderer.domElement.addEventListener('pointerdown',e=>{if(flight)return;previewDemo=false;const r=renderer.domElement.getBoundingClientRect();aim.begin(e.clientX-r.left,e.clientY-r.top);renderer.domElement.setPointerCapture(e.pointerId);});
renderer.domElement.addEventListener('pointermove',e=>{if(!aim.active||flight)return;const r=renderer.domElement.getBoundingClientRect();aim.move(e.clientX-r.left,e.clientY-r.top);preview();});
renderer.domElement.addEventListener('pointerup',()=>{if(aim.shouldLaunch())launch();else aim.cancel();});
document.getElementById('preview')!.addEventListener('click',()=>{reset();const r=viewport.getBoundingClientRect();aim.begin(r.width*.5,r.height*.75);aim.move(r.width*(.5+(courses as Record<string,{witness:{dragX:number}}>)[Number(stage.value)].witness.dragX),r.height*.75);aim.active=false;previewDemo=true;preview();});
document.getElementById('reset')!.addEventListener('click',reset);
document.getElementById('demo')!.addEventListener('click',()=>{reset();const r=viewport.getBoundingClientRect();aim.begin(r.width*.5,r.height*.75);aim.move(r.width*(.5+(courses as Record<string,{witness:{dragX:number}}>)[Number(stage.value)].witness.dragX),r.height*.75);preview();launch();});
for(const control of [stage,variant,movement,angle])control.addEventListener('change',reset);
reset();
renderer.setAnimationLoop(now=>{
 accumulator+=Math.min((now-last)/1000,.1);last=now;
 while(accumulator>=RICOCHET_STEP){
  obstacles.forEach(o=>o.update(RICOCHET_STEP,time+RICOCHET_STEP));
  if(flight){stepRicochet(state,RICOCHET_STEP,time,{},config,status,.22,(a,b)=>{
   for(const o of obstacles){if(!o.active||(a.z-o.z)*(b.z-o.z)>0||a.z===b.z)continue;const u=(o.z-a.z)/(b.z-a.z);if(u<0||u>1)continue;const hit=o.evaluateAt(a.x+(b.x-a.x)*u,a.y+(b.y-a.y)*u,.22,o.predictState(0,time+RICOCHET_STEP));if(hit.hit){text.textContent='OBSTACLE HIT';flight=false;return false;}}
   if(a.z<12&&b.z>=12){const u=(12-a.z)/(b.z-a.z);const x=a.x+(b.x-a.x)*u,y=a.y+(b.y-a.y)*u;const result=scoreTarget(Math.hypot(x-target.x,y-target.y),target.radius);text.textContent=`${status.bounces} bounce(s) · ${status.bounces>=config.requiredBounces?result.kind:'USE THE REFLECTOR'}`;ball.position.set(x,y,12);flight=false;return false;}return true;
  },b=>{text.textContent=`RICOCHET ${status.bounces}`;});
  if(status.blocked&&flight){text.textContent='FRAME / BACK HIT';flight=false;}
  if(flight)ball.position.set(state.x,state.y,state.z);
  if(time-launchedAt>4&&flight){flight=false;text.textContent='MISS';}
  }
  time+=RICOCHET_STEP;accumulator-=RICOCHET_STEP;
 }
 if(previewDemo&&!flight&&now-previewAt>33){preview();previewAt=now;}
 field.update(time,false,debug.checked);target.updateVisual(1/60,false);ball.syncMesh();renderer.render(scene,camera);
});
