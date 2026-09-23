import {createSkyClouds,createMoonArt} from './SkyMoonArt';
import {createLateWorldArt} from './LateWorldArt';
import * as THREE from 'three';
import {createAsteroidGeometry} from './AsteroidGeometry';
import {containmentMetal} from '../graphics/ContainmentMaterials';

export const JOURNEY_LOOKS = {
 sky:{background:0x527e9c,ambient:0xd9e9ee,key:0xffedce},
 ascent:{background:0x527e9c,ambient:0xd9e9ee,key:0xffedce},
 storm:{background:0x3f647c,ambient:0xd0e2ea,key:0xffd9b0},
 moon:{background:0x030711,ambient:0x94a5b8,key:0xe9ecf3},
 far_side:{background:0x02050c,ambient:0x8494a8,key:0xdfe4ec},
 asteroid:{background:0x0d1728,ambient:0xb6c9df,key:0xffdfb8},
 asteroid_belt:{background:0x0d1728,ambient:0xb6c9df,key:0xffdfb8},
 drift:{background:0x08121f,ambient:0xa8bbd2,key:0xffd7a8},
 nebula:{background:0x130c27,ambient:0x9c83c4,key:0xd9c7ff},
 the_null:{background:0x0a0614,ambient:0x6e5a8e,key:0xb9a6e0},
 false_home:{background:0x160f2c,ambient:0xa08dcb,key:0xe2d2ff},
 network:{background:0x030f18,ambient:0x829cac,key:0xffdc8c},
 ancient_network:{background:0x030f18,ambient:0x829cac,key:0xffdc8c},
 the_machine:{background:0x04131c,ambient:0x7a94a4,key:0xffd484},
 the_signal:{background:0x051820,ambient:0x8aacb4,key:0xffe09a},
 homeward:{background:0x062023,ambient:0xa0cec5,key:0xd7fff0},
 luma:{background:0x07282c,ambient:0xb0ddd2,key:0xe4fff6},
} as const;
export type JourneyWorld = keyof typeof JOURNEY_LOOKS;
export function isJourneyWorld(id:string|null):id is JourneyWorld{return id!==null&&id in JOURNEY_LOOKS;}
/** World-specific scenery. Dressing stays outside the flight corridor or behind
 * the target; only the Moon has continuous ground beneath the free-flight worlds. */
export function createJourneyWorldScene(world:JourneyWorld):THREE.Group {
 const root=new THREE.Group();root.name=`world-${world}`;
 const look=JOURNEY_LOOKS[world];
 const skyish = world==='sky'||world==='ascent'||world==='storm';
 const moonish = world==='moon'||world==='far_side';
 const rockish = world==='asteroid'||world==='asteroid_belt'||world==='drift';
 const lateArt =
  world==='nebula'||world==='the_null'||world==='false_home' ? 'nebula' as const :
  world==='network'||world==='ancient_network'||world==='the_machine'||world==='the_signal' ? 'network' as const :
  'homeward' as const;
 const metal=containmentMetal('floor');metal.color.setHex(skyish?0xa5b4bc:0x52636a);metal.map!.repeat.set(1,1);
 const rock=new THREE.MeshPhongMaterial({color:moonish?0x919598:0x665e62,flatShading:true,shininess:3});
 const dark=new THREE.MeshPhongMaterial({color:0x20353f,shininess:48});
 const gold=new THREE.MeshPhongMaterial({color:0xa88a52,shininess:65});
 const light=new THREE.MeshBasicMaterial({color:lateArt==='network'?0xecc371:lateArt==='homeward'?0x91f5ca:0x82cbd9});
 const crystal=new THREE.MeshPhongMaterial({color:lateArt==='homeward'?0x74baac:0x956ee1,emissive:lateArt==='homeward'?0x174a3a:0x251452,shininess:100});
 const batches=new Map<THREE.Material,THREE.Matrix4[]>(),transform=new THREE.Object3D();
 const box=(m:THREE.Material,x:number,y:number,z:number,w:number,h:number,d:number,angle=0)=>{transform.position.set(x,y,z);transform.rotation.set(0,angle,0);transform.scale.set(w,h,d);transform.updateMatrix();const b=batches.get(m)??[];b.push(transform.matrix.clone());batches.set(m,b);};
 const mesh=(geo:THREE.BufferGeometry,m:THREE.Material,x:number,y:number,z:number,s=1)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.scale.setScalar(s);root.add(o);return o;};
 const stone=createAsteroidGeometry(40181);
 if(skyish){
  root.add(createSkyClouds());
  // Suspended meteorological stations, with pressure hulls, service decks and antennae.
  for(const side of [-1,1])for(const z of [15,34]){
   const x=side*(8+(z===34?3:0));
   const hull=mesh(new THREE.SphereGeometry(1,24,16),metal,x,-.5,z);hull.scale.set(1.3,.55,.8);
   box(dark,x,-.7,z,2.1,.2,1.2);box(metal,x,-.2,z,.9,.5,.7);
   for(const dx of [-.6,.6]){
    box(dark,x+dx,-.02,z-.35,.3,.23,.025);box(light,x+dx,-.02,z-.37,.18,.06,.03);
   }
   mesh(new THREE.CylinderGeometry(.035,.055,1.5,10),gold,x,.75,z);
   const dish=mesh(new THREE.SphereGeometry(.36,16,10,0,Math.PI*2,0,Math.PI*.5),metal,x,1.5,z);dish.rotation.x=.8;
   for(const dx of [-1,1]){
    box(dark,x+dx,-.85,z,.2,.55,.2);
    mesh(new THREE.CylinderGeometry(.2,.14,.3,12),dark,x+dx,-1.15,z);
    mesh(new THREE.CircleGeometry(.12,16),light,x+dx,-1.31,z).rotation.x=Math.PI/2;
   }
  }
 }else if(moonish){
  root.add(createMoonArt());
 }else if(rockish){
  const asteroidMaterial=new THREE.MeshPhongMaterial({color:0xc2b7b3,vertexColors:true,shininess:1,specular:0x141414});
  const variants=Array.from({length:6},(_,i)=>createAsteroidGeometry(7919+i*104729));
  for(let i=0;i<34;i++){
   const s=i%2?-1:1;
   const o=mesh(variants[i%6],asteroidMaterial,s*(5.3+i%6*1.1),-1+(i*7%12),5+i*1.15,.55+(i%4)*.45);
   o.name='ambient-asteroid';o.rotation.set(i*.41,i*.23,i*.67);o.scale.y*=.8+(i%5)*.09;
   o.userData.ambientAsteroid=true;
  }
 }else{
  const art=createLateWorldArt(lateArt);root.add(art);
  root.userData.updateAtmosphere=art.userData.updateAtmosphere;
 }

 if(!skyish){
  const vertices=[];for(let i=0;i<260;i++)vertices.push(Math.sin(i*12.37)*40,Math.cos(i*5.17)*22+10,42+i%20);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));root.add(new THREE.Points(g,new THREE.PointsMaterial({color:look.ambient,size:rockish?.055:.035,fog:false})));
 }
 for(const [material,matrices] of batches){const o=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),material,matrices.length);matrices.forEach((m,i)=>o.setMatrixAt(i,m));root.add(o);}
 for(const m of [metal,rock,dark,gold,light,crystal]){
  let used=false;root.traverse(o=>{if(o instanceof THREE.Mesh&&o.material===m)used=true;});
  if(!used)m.dispose();
 }
 stone.dispose();
 return root;
}
