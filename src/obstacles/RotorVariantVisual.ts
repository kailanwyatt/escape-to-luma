import * as THREE from 'three';
import type { RotorVisualVariant } from '../config/RotorConfig';
import { GAME_TUNING } from '../game/gameTuning';

/** Decoration is confined to the shared arm rectangle and ring collision band. */
export function createVariantRotor(variant: RotorVisualVariant, count: number): THREE.Group {
  const t=GAME_TUNING.rotor;
  const root=new THREE.Group();root.name=variant;
  const housing=new THREE.Group();housing.name='stationary-housing';root.add(housing);
  const energy=variant==='nebulaEnergy'||variant==='lumaEnergy';
  const ancient=variant==='ancientMechanism';
  const colors: Record<RotorVisualVariant,[number,number,number]>={
    containmentSecurity:[0x334859,0xffab34,0x73eaff],cityVentilation:[0x9daeb6,0xffc342,0x405768],
    skyTurbine:[0xe0e9ed,0xee4248,0x879cab],atmosphereAntenna:[0x475969,0xe5f1ef,0xef5555],
    orbitSolarArray:[0x172d67,0xdca748,0x78ceff],moonMiningDrill:[0x5e6469,0xf2b52b,0xa0aeb3],
    asteroidWreckage:[0x66636a,0xff8541,0xada59c],nebulaEnergy:[0x4935a8,0xe85fff,0x80b7ff],
    ancientMechanism:[0x4a493d,0xffcc68,0xa88642],lumaEnergy:[0x729ee0,0xe0ffff,0xb997ff],
  };
  const [base,accent,trim]=colors[variant];
  const metal=new THREE.MeshPhongMaterial({color:base,shininess:energy?100:65,transparent:energy,opacity:energy?.7:1,emissive:energy?base:0,emissiveIntensity:energy?.8:0,depthWrite:!energy});
  const dark=new THREE.MeshPhongMaterial({color:energy?base:0x17212d,shininess:90});
  const edge=new THREE.MeshPhongMaterial({color:trim,shininess:110});
  const light=new THREE.MeshBasicMaterial({color:accent});
  const box=new THREE.BoxGeometry(1,1,1);
  const add=(g:THREE.Group,m:THREE.Material,x:number,y:number,z:number,w:number,h:number,d:number)=>{
    const mesh=new THREE.Mesh(box,m);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);g.add(mesh);return mesh;
  };
  // Even wreckage/energy retain a faint full boundary: the ring still collides.
  const sparse=['asteroidWreckage','orbitSolarArray','atmosphereAntenna'].includes(variant);
  const boundaryMaterial=sparse?new THREE.MeshBasicMaterial({color:trim,transparent:true,opacity:.14,depthWrite:false}):energy?metal:dark;
  const boundary=new THREE.Mesh(new THREE.TorusGeometry(t.radius,t.ringThickness,8,64),boundaryMaterial);housing.add(boundary);
  if(!energy && variant!=='asteroidWreckage'){
    const ring=new THREE.Mesh(new THREE.TorusGeometry(t.radius,.035,6,64),edge);ring.position.z=-.13;housing.add(ring);
  }
  const pieces=variant==='asteroidWreckage'?7:12;
  const segGeo=new THREE.TorusGeometry(t.radius,.044,5,8,ancient?.22:.11);
  for(let i=0;i<pieces;i++){
    const mesh=new THREE.Mesh(segGeo,energy||ancient?light:edge);mesh.position.z=-.14;mesh.rotation.z=i/pieces*Math.PI*2;housing.add(mesh);
    if(ancient){const glyph=add(housing,light,Math.cos(i*Math.PI/6)*2,Math.sin(i*Math.PI/6)*2,-.19,.06,.07,.012);glyph.rotation.z=i*Math.PI/6;}
  }
  const hub=new THREE.Mesh(new THREE.SphereGeometry(t.hubRadius,20,14),energy||ancient?light:edge);hub.scale.z=1.4;root.add(hub);
  const cap=new THREE.Mesh(new THREE.TorusGeometry(.14,.022,6,24),energy?edge:dark);cap.position.z=-.2;root.add(cap);
  for(let i=0;i<count;i++){
    const arm=new THREE.Group();arm.name='security-arm';arm.rotation.z=i/count*Math.PI*2;root.add(arm);
    const c=t.hubRadius+t.bladeLength/2;
    const body=add(arm,metal,c,0,0,t.bladeLength,t.bladeWidth,t.bladeDepth);body.name='collision-arm';
    const line=(x:number,y:number,w:number,h:number,m:THREE.Material=light)=>add(arm,m,x,y,-.09,w,h,.015);
    if(variant==='cityVentilation'||variant==='skyTurbine'){
      // Raised blade spine and offset panel seam give depth without widening the collider.
      line(c,-.07,t.bladeLength-.06,.025,edge);line(c,.07,t.bladeLength-.06,.017,dark);
      line(variant==='cityVentilation'?1.45:1.76,0,variant==='cityVentilation'?.16:.22,.235);
      if(variant==='cityVentilation')line(.65,0,.13,.235);
    }else if(variant==='orbitSolarArray'){
      for(const y of [-.107,.107])line(c,y,t.bladeLength,.018);
      for(let j=0;j<9;j++)line(.27+j*.19,0,.016,.21);
      line(c,0,t.bladeLength,.012,edge);
    }else if(variant==='moonMiningDrill'){
      for(let j=0;j<5;j++){line(.4+j*.29,0,.07,.23,edge);}
      line(1.65,0,.4,.23);for(let j=0;j<3;j++)line(1.5+j*.13,0,.045,.22,dark);
      line(.4,0,.22,.22);
    }else if(variant==='atmosphereAntenna'){
      line(c,0,t.bladeLength-.06,.07,dark);
      for(let j=0;j<6;j++)line(.37+j*.26,0,.19,.11);
      line(1.8,0,.1,.23,new THREE.MeshBasicMaterial({color:0xff5555}));
    }else if(variant==='asteroidWreckage'){
      line(c,0,t.bladeLength-.06,.17,dark);
      for(const y of [-.1,.1])line(c,y,t.bladeLength,.025,edge);
      for(let j=0;j<5;j++){const brace=line(.4+j*.29,0,.21,.025,edge);brace.rotation.z=(j%2?1:-1)*.7;}
      line(1.7-i*.09,0,.14+i*.035,.21);line(.35+i*.15,0,.1,.22,edge);
    }else if(energy||ancient){
      line(c,0,t.bladeLength-.04,.035);
      for(let j=0;j<5;j++){
        const mark=line(.4+j*.29,0,.19,.02,ancient?light:edge);mark.rotation.z=(j%2?1:-1)*.8;
        const opposite=mark.clone();opposite.rotation.z=-mark.rotation.z;arm.add(opposite);
      }
      for(const y of [-.11,.11])line(c,y,t.bladeLength-.02,.015);
    }
  }
  return root;
}
