import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {createAsteroidGeometry} from './AsteroidGeometry';
import {createWorldBackdrop} from '../graphics/WorldBackdrop';

/** Decorative, static chapter landmarks: outside the corridor or beyond all gameplay. */
export const CHAPTER_MOTIFS: Record<string,string> = {
  containment:'research-vault',lockdown:'security-bulkheads',city:'rooftop-beacons',
  ascent:'stratospheric-spires',storm:'storm-harvesters',upper_atmosphere:'solar-sails',
  orbit:'orbital-dock',orbital_graveyard:'broken-dock',moon:'crater-ridge',far_side:'dark-ridge',
  drift:'comet-wake',nebula:'crystal-canopy',the_null:'null-presence',false_home:'false-relay',
  ancient_network:'linked-obelisks',the_machine:'reactor-spindles',the_signal:'signal-array',
  homeward:'living-arches',luma:'reunion-grove',
};

export function createJourneyChapterArt(world:string):THREE.Group {
  const root=new THREE.Group();root.name='chapter-dressing';
  root.userData.motif=CHAPTER_MOTIFS[world]??'existing-art';root.userData.decorativeOnly=true;
  if(!CHAPTER_MOTIFS[world])return root;
  const warm=['containment','lockdown','city','false_home','ancient_network','the_machine'].includes(world);
  const living=world==='homeward'||world==='luma';
  const accent=world==='lockdown'?0xcc713f:living?0x81c9ac:warm?0xb99d62:0x6d9cb9;
  const metal=new THREE.MeshPhongMaterial({color:living?0x416d62:warm?0x564e43:0x3d5366,shininess:58,specular:0x607080,fog:false});
  const dark=new THREE.MeshPhongMaterial({color:living?0x183d38:0x1a2637,shininess:12,fog:false});
  const light=new THREE.MeshBasicMaterial({color:accent,fog:false});
  const batches=new Map<THREE.Material,THREE.BufferGeometry[]>();
  const transform=new THREE.Object3D();
  const cube=new THREE.BoxGeometry(1,1,1),rock=createAsteroidGeometry(1931,16,12);
  const put=(g:THREE.BufferGeometry,m:THREE.Material,x:number,y:number,z:number,sx=1,sy=sx,sz=sx,rz=0)=>{
    transform.position.set(x,y,z);transform.scale.set(sx,sy,sz);transform.rotation.set(0,0,rz);transform.updateMatrix();
    const copy=(g.index?g.toNonIndexed():g.clone()).applyMatrix4(transform.matrix);
    copy.deleteAttribute('color');copy.deleteAttribute('uv');
    const list=batches.get(m)??[];list.push(copy);batches.set(m,list);
  };
  const box=(m:THREE.Material,x:number,y:number,z:number,w:number,h:number,d:number,a=0)=>put(cube,m,x,y,z,w,h,d,a);
  const arc=(x:number,y:number,z:number,r:number,angle:number,length:number,m=metal)=>{
    const g=new THREE.TorusGeometry(r,.13,6,40,length);put(g,m,x,y,z,1,1,1,angle);g.dispose();
  };
  const mast=(x:number,y:number,z:number,h:number)=>{
    box(metal,x,y,z,.35,h,.45);box(dark,x,y,z-.25,.22,h*.85,.1);
    for(let i=0;i<5;i++)box(light,x,y-h*.35+i*h*.17,z-.32,.12,.08,.025);
    box(metal,x,y+h*.5,z,1.1,.18,.65);
  };
  if(world==='containment'||world==='lockdown'){
    for(const side of [-1,1])for(let i=0;i<3;i++){
      const x=side*6.3,z=21+i*10;
      mast(x,4,z,8);box(metal,x,8,z,2.1,.45,1);
      for(let j=0;j<4;j++)box(dark,x,2+j*1.2,z-.3,1.35,.75,.3);
      if(world==='lockdown')for(let j=0;j<4;j++)box(light,x+(j-1.5)*.3,7.5,z-.55,.15,.42,.04,-.5);
      else {box(metal,x,3,z-.6,1.8,2.8,.35);box(light,x,3,z-.81,.08,2.4,.025);}
    }
  }else if(world==='city'||world==='ascent'){
    for(const side of [-1,1])for(let i=0;i<5;i++){
      const x=side*(8+i*1.3),z=25+i*6,h=world==='city'?6+i%3*2:12+i%3*3;
      box(dark,x,-2,z,1.8,h,2);box(metal,x,-2+h/2,z,2.2,.3,2.4);
      mast(x,h/2-1,z,2);
      for(let j=0;j<6;j++)box(light,x,-3+j*.8,z-1.02,.65,.06,.025);
    }
  }else if(world==='storm'){
    for(const side of [-1,1])for(let i=0;i<3;i++){
      const x=side*(9+i),z=28+i*10;mast(x,4,z,13);
      for(let j=0;j<3;j++)arc(x,7+j*.6,z,1.4,0,Math.PI*1.8);
      // Static branched conductors, never flashing lightning or timed hazard cues.
      box(light,x+side*.8,11,z,.045,3,.04,side*.5);
    }
  }else if(world==='upper_atmosphere'){
    for(const side of [-1,1])for(let i=0;i<3;i++){
      const x=side*(10+i*2),z=32+i*9;mast(x,7,z,6);
      box(metal,x,7,z,5,.1,.2,.3*side);
      for(let j=0;j<7;j++)box(dark,x+(j-3)*.6,7,z-.12,.55,3.6,.05,.3*side);
      box(light,x,8.9,z-.2,4,.04,.03,.3*side);
    }
  }else if(world==='orbit'||world==='orbital_graveyard'){
    const broken=world==='orbital_graveyard';
    for(let i=0;i<3;i++){
      const z=36+i*8;arc(0,6,z,9+i*.8,.2+i*.5,broken?Math.PI*.9:Math.PI*1.75);
      for(let j=0;j<8;j++){
        const a=j*Math.PI/4+i*.2,x=Math.cos(a)*11,y=6+Math.sin(a)*11;
        if(broken&&j%3===0)continue;
        box(dark,x,y,z,1.3,2.5,1,broken?a+.6:a);box(light,x,y,z-.55,.08,1.3,.03,a);
      }
    }
  }else if(world==='moon'||world==='far_side'){
    for(const side of [-1,1])for(let i=0;i<7;i++){
      put(rock,world==='moon'?metal:dark,side*(7+i*1.1),-3,20+i*6,2+i*.2,1.2+i*.2,2.6,i*.4);
    }
    if(world==='far_side')for(let i=0;i<4;i++)mast(10+i*2,0,38+i*5,2+i*.7);
  }else if(world==='drift'){
    const matte=createWorldBackdrop('space-drift');(matte.material as THREE.MeshBasicMaterial).color.setHex(0x303e58);root.add(matte);
    // Sparse distant icy comet; its dust fan is well above the active target.
    put(rock,metal,-11,13,50,.8,.6,.7);
    for(let i=0;i<12;i++)box(dark,-12-i*.7,13+i*.18,51+i*.4,1.5,.04+i*.035,.03,-.2);
  }else if(world==='nebula'){
    const prism=new THREE.CylinderGeometry(.03,.6,1,5);
    for(const side of [-1,1])for(let i=0;i<9;i++){
      put(prism,metal,side*(9+i*.5),9+i%3,30+i*3,.8,3+i%4,.8,side*.6);
      put(prism,light,side*(9+i*.5),9+i%3,29.9+i*3,.04,2+i%4,.04,side*.6);
    }prism.dispose();
  }else if(world==='the_null'){
    // Distant scar rings only — living Null body is NullPresenceArt (animated).
    for(let i=0;i<4;i++)arc(10,12,56+i*.35,9+i*.55,0.4+i*.2,.55+i*.12,i%2?dark:metal);
  }else if(world==='false_home'){
    for(const side of [-1,1]){
      mast(side*8,4,37,12);box(metal,side*8,10,37,3.5,.45,2);
      box(light,side*8,9.5,36.7,2,.08,.03);
      for(let i=0;i<5;i++)box(dark,side*(8+i*.65),11+i*.4,39,1.1,.3,.5,side*.3);
    }
    arc(0,10,49,8,.1,Math.PI*.82); // Incomplete relay, not a second destination portal.
  }else if(world==='ancient_network'){
    for(const side of [-1,1])for(let i=0;i<4;i++){
      const x=side*(8+i),z=28+i*8;mast(x,6,z,10);
      box(metal,x+side*.5,10,z+3,.09,.09,8);
      box(light,x+side*.5,10.1,z+3,.03,.03,8);
    }
  }else if(world==='the_machine'){
    for(const side of [-1,1])for(let i=0;i<3;i++){
      const x=side*(9+i*1.5),z=30+i*9;
      const drum=new THREE.CylinderGeometry(1.4,1.4,9,16);put(drum,metal,x,4,z);drum.dispose();
      for(let j=0;j<7;j++)box(dark,x,1+j,z-1.4,2.6,.3,.2);
      for(const dx of [-1,1])box(light,x+dx,4,z-1.45,.04,7,.03);
    }
  }else if(world==='the_signal'){
    for(const side of [-1,1])for(let i=0;i<5;i++){
      const x=side*(8+i),z=29+i*7;mast(x,7,z,9);
      arc(x,11,z,1.8,.3,Math.PI*1.2);box(light,x,11,z-.2,.06,2,.04);
    }
  }else if(living){
    const petal=new THREE.SphereGeometry(1,12,8);
    for(const side of [-1,1])for(let i=0;i<(world==='luma'?6:3);i++){
      const x=side*(7+i*.8),z=27+i*6;
      arc(x,1,z,4,side>0?Math.PI/2:0,Math.PI*.85,dark);
      for(let j=0;j<4;j++)put(petal,metal,x+side*j*.25,4+j*.6,z,.35,1.3,.15,side*(.4+j*.2));
      put(petal,light,x,5,z-.15,.14,.18,.12);
    }
    if(world==='luma'){
      // Gentle distant reunion lights, not a new enemy or collectible system.
      for(let i=0;i<18;i++){const a=i*2.4;put(petal,light,Math.cos(a)*9,9+Math.sin(a)*4,48+i%4,.08,.08,.08);}
    }petal.dispose();
  }
  cube.dispose();rock.dispose();
  for(const m of [metal,dark,light]){
    const parts=batches.get(m);if(!parts){m.dispose();continue;}
    const merged=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());
    if(merged)root.add(new THREE.Mesh(merged,m));else m.dispose();
  }
  return root;
}
