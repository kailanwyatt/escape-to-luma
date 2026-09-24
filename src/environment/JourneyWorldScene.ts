import {createMoonArt} from './SkyMoonArt';
import {createSkyWorldArt} from './SkyWorldArt';
import {createLateWorldArt} from './LateWorldArt';
import {createAsteroidBeltArt} from './AsteroidBeltArt';
import {createCityWorldArt} from './CityWorldArt';
import {createSpaceScene} from './SpaceScene';
import {createWorldBackdrop} from '../graphics/WorldBackdrop';
import * as THREE from 'three';
import {createAsteroidGeometry} from './AsteroidGeometry';
import {containmentMetal} from '../graphics/ContainmentMaterials';

export const JOURNEY_LOOKS = {
 city:{background:0x714f59,ambient:0xd8b7b3,key:0xffbd79},
 upper_atmosphere:{background:0x3a4a6a,ambient:0xc7b6cb,key:0xffcf93},
 orbit:{background:0x040b18,ambient:0x9eaec9,key:0xffe1b3},
 orbital_graveyard:{background:0x030810,ambient:0x7c8d9f,key:0xc3d3e0},
 sky:{background:0x071018,ambient:0x3d4f6e,key:0x8fa8d4},
 ascent:{background:0x071018,ambient:0x3d4f6e,key:0x8fa8d4},
 storm:{background:0x3f647c,ambient:0xd0e2ea,key:0xffd9b0},
 moon:{background:0x030711,ambient:0x94a5b8,key:0xe9ecf3},
 far_side:{background:0x02050c,ambient:0x8494a8,key:0xdfe4ec},
 asteroid:{background:0x0d1728,ambient:0xb6c9df,key:0xffdfb8},
 asteroid_belt:{background:0x0d1728,ambient:0xb6c9df,key:0xffdfb8},
 drift:{background:0x08121f,ambient:0xa8bbd2,key:0xffd7a8},
 nebula:{background:0x130c27,ambient:0x9c83c4,key:0xd9c7ff},
 the_null:{background:0x07040f,ambient:0x5a4878,key:0xa888d8},
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
export function createJourneyWorldScene(world:JourneyWorld,level=95):THREE.Group {
 if(world==='city')return createCityWorldArt(level);
 if(world==='asteroid_belt'||world==='asteroid'){const art=createAsteroidBeltArt(level);art.name=`world-${world}`;return art;}
 if(world==='upper_atmosphere'||world==='orbit'||world==='orbital_graveyard'){
  const art=createSpaceScene(world);art.name=`world-${world}`;return art;
 }
 const root=new THREE.Group();root.name=`world-${world}`;
 const look=JOURNEY_LOOKS[world];
 const skyish = world==='sky'||world==='ascent'||world==='storm';
 const moonish = world==='moon'||world==='far_side';
 const rockish = world==='drift';
 const lateArt =
  world==='nebula'||world==='the_null'||world==='false_home' ? 'nebula' as const :
  world==='network'||world==='ancient_network'||world==='the_machine' ? 'network' as const :
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
  const art=createSkyWorldArt(world==='storm',level);root.add(art);
  root.userData.updateAtmosphere=art.userData.updateAtmosphere;
 }else if(moonish){
  const matte=createWorldBackdrop('space-moon');
  (matte.material as THREE.MeshBasicMaterial).color.setHex(world==='far_side'?0x7a858f:0xc5ced6);
  root.add(matte);
  root.add(createMoonArt(world!=='far_side'));
 }else if(rockish){
  const matte=createWorldBackdrop('space-drift');
  (matte.material as THREE.MeshBasicMaterial).color.setHex(0xa8b4c4);
  root.add(matte);
  const asteroidMaterial=new THREE.MeshPhongMaterial({color:0xc2b7b3,vertexColors:true,shininess:1,specular:0x141414});
  const variants=Array.from({length:6},(_,i)=>createAsteroidGeometry(7919+i*104729));
  for(let i=0;i<(world==='drift'?6:34);i++){
   const s=i%2?-1:1;
   const o=mesh(variants[i%6],asteroidMaterial,s*(5.3+i%6*1.1),-1+(i*7%12),5+i*1.15,.55+(i%4)*.45);
   o.name='ambient-asteroid';o.rotation.set(i*.41,i*.23,i*.67);o.scale.y*=.8+(i%5)*.09;
   if(world==='drift'){o.position.x*=1.8;o.position.z+=22;o.scale.multiplyScalar(.6);}
   o.userData.ambientAsteroid=true;
  }
 }else if(world==='the_null'){
  const matte=createWorldBackdrop('nebula');(matte.material as THREE.MeshBasicMaterial).color.setHex(0x30283d);root.add(matte);
 }else{
  const art=createLateWorldArt(lateArt);root.add(art);
  const matte=art.getObjectByName(`${lateArt}-distant-matte`) as THREE.Mesh|undefined;
  if(matte){
   const tint=world==='false_home'?0x8b799e:world==='the_machine'?0x827b68:world==='the_signal'?0x92b4bc:world==='luma'?0xb6d4bc:0xb3bdc8;
   (matte.material as THREE.MeshBasicMaterial).color.setHex(tint);
  }
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
