import {createWorldBackdrop} from '../graphics/WorldBackdrop';
import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {createAsteroidGeometry} from './AsteroidGeometry';

/** Finished scenery is assembled from shared authored modules, then merged per material.
 * All foreground dressing is outboard; central landmarks are beyond the target plane. */
export function createLateWorldArt(world: 'nebula'|'network'|'homeward'): THREE.Group {
  const root=new THREE.Group();root.name=`${world}-landmarks`;root.add(createWorldBackdrop(world));
  const batches=new Map<THREE.Material,THREE.BufferGeometry[]>();
  const transform=new THREE.Object3D();
  const put=(g:THREE.BufferGeometry,m:THREE.Material,x:number,y:number,z:number,sx=1,sy=sx,sz=sx,rz=0,ry=0)=>{
    transform.position.set(x,y,z);transform.rotation.set(0,ry,rz);transform.scale.set(sx,sy,sz);transform.updateMatrix();
    const copy=(g.index?g.toNonIndexed():g.clone()).applyMatrix4(transform.matrix);copy.deleteAttribute('color');copy.deleteAttribute('uv');
    const list=batches.get(m)??[];list.push(copy);batches.set(m,list);
  };
  const stone=new THREE.MeshPhongMaterial({color:world==='homeward'?0x26494c:0x202432,shininess:15,specular:0x394954});
  const trim=new THREE.MeshPhongMaterial({color:world==='network'?0x997449:0x688ca1,shininess:80,specular:0x9fafb5});
  const shell=new THREE.MeshPhongMaterial({color:world==='homeward'?0x244b50:0x584d82,emissive:world==='homeward'?0x04171b:0x151027,shininess:80,side:THREE.DoubleSide,specular:0xb6d6e7});
  const light=new THREE.MeshBasicMaterial({color:world==='network'?0xd0b981:world==='homeward'?0x639e98:0x9585e6});
  const dim=new THREE.MeshPhongMaterial({color:0x17384a,emissive:0x083041,shininess:70});
  if(world==='homeward'){
    shell.transparent=true;shell.opacity=.82;shell.depthWrite=false;
    shell.onBeforeCompile=shader=>{
      shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 livingPosition;').replace('#include <begin_vertex>','#include <begin_vertex>\nlivingPosition=position;');
      shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 livingPosition;').replace('#include <color_fragment>',`#include <color_fragment>
        float veins=pow(.5+.5*sin(livingPosition.y*28.+sin(livingPosition.x*17.)*2.+livingPosition.z*12.),14.);
        float grain=.5+.5*sin(livingPosition.x*34.+livingPosition.z*19.)*sin(livingPosition.y*37.);
        diffuseColor.rgb*=.72+grain*.2+veins*.18;
      `);
    };
  }
  const rock=createAsteroidGeometry(98731,24,16);
  const block=bevelBlock();
  const prism=new THREE.CylinderGeometry(.06,.6,2,5,1);
  const sphere=new THREE.SphereGeometry(1,14,10);
  const tube=(points:number[][],radius:number,m:THREE.Material)=>{
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p as [number,number,number])));
    const g=new THREE.TubeGeometry(curve,20,radius,6,false);
    if(world==='homeward'){
      const p=g.attributes.position;
      for(let ring=0;ring<=20;ring++){
        const center=curve.getPointAt(ring/20),taper=1-.94*(ring/20)**2;
        for(let j=0;j<=6;j++){const k=ring*7+j;p.setXYZ(k,center.x+(p.getX(k)-center.x)*taper,center.y+(p.getY(k)-center.y)*taper,center.z+(p.getZ(k)-center.z)*taper);}
      }
      g.computeVertexNormals();
    }
    put(g,m,0,0,0);g.dispose();
  };
  if(world==='nebula') {
    // Crystals grow as multi-prism mineral clusters embedded in eroded parent rock.
    for(const side of [-1,1])for(let i=0;i<4;i++){
      const x=side*(4.8+i*.6),z=8+i*7,y=-.8+i*.4;
      put(rock,stone,x,y,z,1.5,.9,1.1,.2*i);
      for(let j=0;j<5;j++){
        const h=1.1+((j*7+i*3)%5)*.42;
        put(prism,shell,x+side*(j-2)*.36,y+h*.5,z+(j%2)*.45,.48,h,.5,side*(j-2)*.13);
        put(prism,light,x+side*(j-2)*.36,y+h*.5,z-.035+(j%2)*.45,.045,h*.87,.05,side*(j-2)*.13);
      }
    }
    // Distant relay: a broken, unfamiliar structure, not a second blue destination portal.
    const arc=new THREE.TorusGeometry(6.3,.19,8,96,Math.PI*1.45);
    put(arc,trim,0,5.8,43,1,1,1,.65);put(arc,dim,0,5.8,44,.86,.86,1,-1.3);arc.dispose();
    for(let i=0;i<9;i++){const a=i*2.4;put(rock,stone,Math.cos(a)*8,5+Math.sin(a)*6,44,.55,.9,.5,a);}
  } else if(world==='network') {
    // Tiered monoliths with beveled stone, recessed panels, metal collars and illuminated script.
    for(const side of [-1,1])for(let i=0;i<4;i++){
      const x=side*(5.2+i*.45),z=8+i*8;
      put(block,stone,x,3,z,1.25,7.6,1.25);
      put(block,trim,x,-.7,z,1.65,.42,1.6);put(block,trim,x,6.7,z,1.65,.32,1.6);
      put(block,dim,x,3,z-.67,.78,6,.07);
      for(const dx of [-.46,.46])put(block,trim,x+dx,3,z-.7,.055,6.5,.07);
      for(let row=0;row<11;row++){
        const y=.3+row*.5;
        for(let col=0;col<3;col++)if((row+col+i)%3!==0){
          put(block,light,x+(col-1)*.19,y,z-.73,.025,.15+(row%2)*.07,.015);
          put(block,light,x+(col-1)*.19+.045,y+.075,z-.73,.1,.024,.015);
        }
      }
    }
    // Monumental segmented astrolabe behind the active play space, with real depth and gaps.
    for(let band=0;band<2;band++){
      const r=6.5+band*2.1;
      for(let i=0;i<18;i++){
        const angle=i*Math.PI/9;
        const g=arcBlock(r,.45,Math.PI/9-.04,.45);
        put(g,band?stone:trim,0,5,38+band*2,1,1,1,angle);g.dispose();
        put(block,light,Math.cos(angle+.09)*r,5+Math.sin(angle+.09)*r,37.7+band*2,.055,.3,.045,angle);
      }
    }
    // Fragments and connecting conduits give the architecture a shared purpose.
    for(const side of [-1,1]){
      tube([[side*5.3,1,10],[side*6,2,20],[side*6.5,5,32],[side*4,9,39]],.09,trim);
      for(let i=0;i<5;i++)put(block,stone,side*(7+i*.7),-1+i*.8,26+i*3,.9,.7,1.8,i*.3);
    }
  } else {
    // Asymmetric living arches grow from suspended root bundles. No repeated planter bases.
    const leaf=leafGeometry();
    for(const side of [-1,1])for(let i=0;i<2;i++){
      const x=side*(9+i*1.7),z=12+i*11+(side<0?4:0),height=5.8+i*1.3;
      const bend=side*(1.2+.45*i);
      tube([[x,-3,z],[x-side*.5,-.3,z+.3],[x+bend,2.8,z],[x+side*.5,height,z+1.8]],.18+i*.025,shell);
      tube([[x,-3,z-.18],[x-side*.5,-.3,z+.1],[x+bend,2.8,z-.2],[x+side*.5,height,z+1.6]],.023,light);
      for(let j=0;j<3;j++){
        const y=.5+j*1.4+i*.25,tip=x+side*(2.1+.6*Math.sin(i+j));
        tube([[x+bend*.55,y,z],[tip,y+.7,z-.5],[tip+side*.6,y+2.5,z+.6]],.055,shell);
        put(leaf,shell,tip,y+1.1,z+.3,1.4+j*.3,1.25+i*.2,1,side*(.35+j*.15),i*.45);
        tube([[tip,y+.9,z+.25],[tip+side*.2,y+1.7,z+.15],[tip+side*.4,y+2.5,z+.5]],.015,light);
      }
      for(let j=0;j<3;j++)tube([[x,-1,z],[x+side*(j-1)*.5,-2.5,z+.6],[x+side*(j-1)*.8,-4.3,z+1.4]],.035,shell);
    }
    for(let i=0;i<18;i++){
      const side=i%2?-1:1;put(sphere,light,side*(4+i%5*.9),2+(i*7%9)*.5,25+i*.9,.07,.07,.07);
    }
    leaf.dispose();
  }
  for(const [material,geos] of batches){
    const merged=mergeGeometries(geos,false)!;const m=new THREE.Mesh(merged,material);m.name=`${world}-sculpted-kit`;root.add(m);geos.forEach(g=>g.dispose());
  }
  for(const g of [rock,block,prism,sphere])g.dispose();
  // Materials not represented in a batch have no scene owner.
  for(const m of [stone,trim,shell,light,dim])if(!batches.has(m))m.dispose();
  return root;
}
function bevelBlock():THREE.BufferGeometry {
  const s=new THREE.Shape();s.moveTo(-.45,-.45);s.lineTo(.45,-.45);s.lineTo(.45,.45);s.lineTo(-.45,.45);s.closePath();
  const g=new THREE.ExtrudeGeometry(s,{depth:.9,bevelEnabled:true,bevelSize:.05,bevelThickness:.05,bevelSegments:1,steps:1});g.translate(0,0,-.45);return g;
}
function arcBlock(r:number,width:number,angle:number,depth:number):THREE.BufferGeometry {
  const s=new THREE.Shape();s.absarc(0,0,r+width/2,0,angle,false);s.absarc(0,0,r-width/2,angle,0,true);s.closePath();
  return new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSize:.035,bevelThickness:.04,bevelSegments:1,curveSegments:5,steps:1});
}
function leafGeometry():THREE.BufferGeometry {
  const g=new THREE.PlaneGeometry(1,1,12,16),p=g.attributes.position;
  for(let i=0;i<p.count;i++){
    const u=p.getX(i)*2,v=p.getY(i)+.5;
    const w=Math.pow(Math.sin(v*Math.PI),.75);
    p.setXYZ(i,u*w*.85,v*1.8,.35*Math.sin(v*Math.PI)+.18*u*u*w);
  }
  g.computeVertexNormals();return g;
}
