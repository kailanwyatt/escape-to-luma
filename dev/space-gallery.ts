import {setWorldBackdropLoader} from '../src/graphics/WorldBackdrop';
import * as THREE from 'three';
import {gateStateAtTime,shutterTimeline,type RapidShutterConfig} from '../src/obstacles/RapidShutterState';
import type {SlidingGateConfig} from '../src/config/ObstacleConfig';
import {EnvironmentManager} from '../src/environment/EnvironmentManager';
import {Target} from '../src/target/Target';
import {Projectile} from '../src/projectile/Projectile';
import {ObstacleSlot} from '../src/obstacles/ObstacleSlot';
import {getCampaignLevel} from '../src/campaign/levels';
import {GAME_TUNING} from '../src/game/gameTuning';
setWorldBackdropLoader(async world=>{const texture=await new THREE.TextureLoader().loadAsync(`/art/${world}.jpg`);texture.colorSpace=THREE.SRGBColorSpace;return texture;});
const scene=new THREE.Scene();const environment=new EnvironmentManager(scene);
const camera=new THREE.PerspectiveCamera(45,1,.1,80);camera.position.fromArray(GAME_TUNING.camera.position);camera.lookAt(...GAME_TUNING.camera.lookAt);
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(2,devicePixelRatio));document.body.appendChild(renderer.domElement);
const target=new Target(),spark=new Projectile(),slots=[new ObstacleSlot('A'),new ObstacleSlot('B')];scene.add(target.group,spark.mesh,...slots.map(o=>o.group));spark.position.set(0,.6,0);spark.syncMesh();
const level=document.getElementById('level') as HTMLSelectElement;
const pattern=document.getElementById('shutter-pattern') as HTMLSelectElement;
const vertical=document.getElementById('shutter-vertical') as HTMLInputElement;
let reviewShutter:SlidingGateConfig|null=null;
function apply(){const def=JSON.parse(JSON.stringify(getCampaignLevel(Number(level.value))!));
reviewShutter=null;
for(const o of def.challenge.obstacles)if(o.movementMode==='rapidShutter'){
 if(pattern.value!=='authored')o.shutter={pattern:pattern.value as RapidShutterConfig['pattern'],orientation:vertical.checked?'vertical':'horizontal',visualVariant:'citySecurity'};
 else if(vertical.checked)o.shutter.orientation='vertical';
 reviewShutter=o;
}
document.getElementById('shutter-controls')!.hidden=!reviewShutter;
environment.setEnvironment(def.challenge.environment,scene);environment.setCampaignLevel(null);environment.setSpaceWorld(def.worldId);
target.applyConfig(def.challenge.target);target.setWorld(def.worldId);slots.forEach((o,i)=>def.challenge.obstacles[i]?o.applyConfig(def.challenge.obstacles[i],def.challenge.environment):o.hide());}apply();level.addEventListener('change',apply);
function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}resize();window.addEventListener('resize',resize);
let paused=false,clock=0;document.getElementById('pause')!.onclick=()=>{paused=!paused;document.getElementById('pause')!.textContent=paused?'Resume motion':'Pause motion';};
pattern.onchange=apply;vertical.onchange=apply;
document.getElementById('step-phase')!.onclick=()=>{
 if(!reviewShutter)return;
 const state=gateStateAtTime(reviewShutter,clock).shutter!;
 const beats=shutterTimeline(reviewShutter.shutter!);
 clock+=beats[state.beat].duration-state.timeInState+.0001;paused=true;document.getElementById('pause')!.textContent='Resume motion';
};
let last=0;renderer.setAnimationLoop(ms=>{const dt=Math.min(.05,(ms-last)/1000);last=ms;if(!paused)clock+=dt;slots.forEach(o=>o.update(paused?0:dt,clock));environment.update(paused?0:dt);target.updateVisual(dt,false);if(reviewShutter){const s=gateStateAtTime(reviewShutter,clock);document.getElementById('shutter-state')!.textContent=` ${s.shutter!.phase} · ${s.shutter!.timeInState.toFixed(2)}s · slam in ${s.shutter!.timeUntilSlam.toFixed(2)}s · opening ${(reviewShutter.shutter?.orientation==='vertical'?s.height:s.width).toFixed(2)}`;}
renderer.render(scene,camera);});
