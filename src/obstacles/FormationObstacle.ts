import {dressSecurityPanel,dressDebris,dressMaze} from './EncounterArt';
import * as THREE from 'three';
import type {FormationConfig} from '../config/ObstacleConfig';
import type {EnvironmentId} from '../config/ChallengeConfig';
import {emptyPredictedState,type ObstaclePredictedState} from './GameplayObstacle';
import {formationParts,evaluateFormation} from './FormationState';
import {createReadableBlocker} from './ReadableBlockerVisual';
import {createConveyorAsteroid} from './ConveyorAsteroidArt';
import {disposeThreeObject} from '../utils/disposeThree';

/** Bounded reusable meshes; every solid surface samples the same state as collision. */
export class FormationObstacle {
 readonly type='formation' as const;
 readonly group=new THREE.Group();
 active=false;z=0;
 private config:FormationConfig|null=null;
 private time=0;
 private pieces:THREE.Mesh[]=[];
 private indicators:THREE.Mesh[]=[];
 private plate=new THREE.Group();
 constructor(readonly id:string){}
 applyConfig(c:FormationConfig,_environment:EnvironmentId){
  disposeThreeObject(this.group);this.group.clear();this.pieces=[];this.indicators=[];
  this.config=c;this.z=c.z;this.active=true;this.group.visible=true;this.group.position.set(0,0,c.z);
  const metal=new THREE.MeshPhongMaterial({color:0x243443,shininess:65});
  const glow=new THREE.MeshBasicMaterial({color:c.variant==='rotatingMaze'?0xffc56b:0x66edff});
  if(c.variant==='rotatingMaze'){
   this.plate=new THREE.Group();this.plate.position.y=c.centerY??3;this.group.add(this.plate);
   const shape=new THREE.Shape();shape.absarc(0,0,2.6,0,Math.PI*2,false);
   const hole=new THREE.Path();hole.absarc(.85,0,c.openingRadius??1.05,0,Math.PI*2,true);shape.holes.push(hole);
   const body=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.23,bevelEnabled:false,curveSegments:48}),metal);body.position.z=-.115;this.plate.add(body);
   const rim=new THREE.Mesh(new THREE.TorusGeometry(c.openingRadius??1.05,.035,6,64),glow);rim.position.set(.85,0,-.15);this.plate.add(rim);
   const outer=new THREE.Mesh(new THREE.TorusGeometry(2.55,.055,8,80),glow);outer.position.z=-.15;this.plate.add(outer);
   dressMaze(this.plate,c.openingRadius??1.05);
   for(let i=0;i<20;i++){const a=i*Math.PI/10;const mark=new THREE.Mesh(new THREE.BoxGeometry(.13,.27,.025),metal.clone());mark.position.set(Math.cos(a)*2.32,Math.sin(a)*2.32,-.14);mark.rotation.z=a;this.plate.add(mark);}
  }else{
   for(const p of formationParts(c,0)){
    const mesh=p.radius?(c.variant==='conveyor'?createConveyorAsteroid(this.pieces.length+20):createReadableBlocker('debris')):new THREE.Mesh(new THREE.BoxGeometry(1,1,.2),metal.clone());
    if(p.radius&&c.variant!=='conveyor')dressDebris(mesh,this.pieces.length+40);
    if(c.variant==='alternatingDoors')dressSecurityPanel(mesh,this.pieces.length>=5);
    this.pieces.push(mesh);this.group.add(mesh);
    if(!p.radius){
     if(c.variant==='phaseColumns'){
      const field=new THREE.Mesh(new THREE.PlaneGeometry(.94,.96),new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{time:{value:0},strength:{value:1}},vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 v;uniform float time;uniform float strength;void main(){float bands=pow(.5+.5*sin(v.y*95.-time*3.+sin(v.x*20.+time)*2.),9.);float edge=pow(abs(v.x-.5)*2.,5.);gl_FragColor=vec4(.5,.35,1.,(bands*.28+edge*.7)*strength);}' }));field.position.z=-.13;field.name='phase-energy';mesh.add(field);
     }
     const edges=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1,1,.205)),new THREE.LineBasicMaterial({color:0x657e99}));mesh.add(edges);
     const bar=new THREE.Mesh(new THREE.BoxGeometry(.05,.8,.025),glow.clone());bar.position.z=-.125;mesh.add(bar);this.indicators.push(bar);
    }
   }
   metal.dispose();glow.dispose();
  }
  this.update(0,0);
 }
 update(_dt:number,time:number){
  if(!this.config||!this.active)return;this.time=time;const c=this.config;
  if(c.variant==='rotatingMaze'){this.plate.rotation.z=time*c.speed*(c.direction??1)+(c.phase??0);return;}
  formationParts(c,time).forEach((p,i)=>{
   const mesh=this.pieces[i];mesh.position.set(p.x,p.y,0);
   mesh.scale.set(p.radius||p.width,p.radius||p.height,p.radius||1);
   if(p.radius){mesh.rotation.z=time*.07*(i%2?1:-1)+i;return;}
   const m=mesh.material as THREE.MeshPhongMaterial;
   m.transparent=!p.active;m.opacity=p.active?1:.08;m.depthWrite=p.active;
   const field=mesh.getObjectByName('phase-energy') as THREE.Mesh|undefined;
   if(field){const material=field.material as THREE.ShaderMaterial;material.uniforms.time.value=time;material.uniforms.strength.value=p.active?1:0;}
   m.color.setHex(c.variant==='phaseColumns'?(p.active?0x6c3099:0x17293e):0x243443);
   const light=this.indicators[i]?.material as THREE.MeshBasicMaterial|undefined;
   light?.color.setHex(p.warning?0xffbd52:p.active&&c.variant==='phaseColumns'?0xe45eff:0x66edff);
   mesh.visible=p.height>.002;
  });
 }
 hide(){this.active=false;this.group.visible=false;}
 predictState(delta:number,time:number){const p=emptyPredictedState('formation',this.z);p.angle=time+delta;return p;}
 evaluateAt(x:number,y:number,r:number,p:ObstaclePredictedState){return evaluateFormation(this.config!,p.angle,x,y,r);}
 testProjectileCrossing(a:THREE.Vector3,b:THREE.Vector3,r:number,clock=this.time,step=0){
  if(!this.active||a.z>=this.z||b.z<this.z)return null;
  const u=(this.z-a.z)/(b.z-a.z);
  return evaluateFormation(this.config!,clock-step*(1-u),a.x+(b.x-a.x)*u,a.y+(b.y-a.y)*u,r);
 }
 getDebugInfo(){return {...this.predictState(0,this.time),speed:this.config?.speed??0,extra:this.config?.variant??''};}
}
