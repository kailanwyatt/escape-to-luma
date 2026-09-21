import * as THREE from 'three';
import {createEarth} from './SpaceScene';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {createAsteroidGeometry} from './AsteroidGeometry';

/** Small, repeatable material sources; no browser canvas or external image dependency. */
export function mineralTexture():THREE.DataTexture {
 const size=256,data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const fine=Math.sin(x*81.7+y*39.3)*43758.5453;
  const v=143+24*Math.sin(x*.14+Math.sin(y*.07))*Math.sin(y*.19)+19*(fine-Math.floor(fine));
  const i=(y*size+x)*4;data[i]=v;data[i+1]=v;data[i+2]=v;data[i+3]=255;
 }
 const t=new THREE.DataTexture(data,size,size);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearFilter;t.needsUpdate=true;return t;
}
function cloudTexture():THREE.DataTexture {
 const size=256,data=new Uint8Array(size*size*4);
 const hash=(x:number,y:number)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
 const noise=(x:number,y:number)=>{const ix=Math.floor(x),iy=Math.floor(y),u=x-ix,v=y-iy,a=u*u*(3-2*u),b=v*v*(3-2*v);return THREE.MathUtils.lerp(THREE.MathUtils.lerp(hash(ix,iy),hash(ix+1,iy),a),THREE.MathUtils.lerp(hash(ix,iy+1),hash(ix+1,iy+1),a),b);};
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=x/size,v=y/size;let density=-10;
  // Irregular overlapping billows, with a broad mist base and feathered boundaries.
  for(let j=0;j<7;j++){
   const cx=.15+j*.115,cy=.47+.1*Math.sin(j*2.3),rx=.15+.025*Math.sin(j),ry=.2+.065*Math.cos(j*1.7);
   density=Math.max(density,1-((u-cx)/rx)**2-((v-cy)/ry)**2);
  }
  const n=noise(u*9,v*9)*.55+noise(u*23,v*23)*.3+noise(u*57,v*57)*.15;
  const edge=Math.min(u,1-u,v,1-v);
  const alpha=THREE.MathUtils.smoothstep(density+n*.55,.05,.75)*THREE.MathUtils.smoothstep(edge,.02,.14)*.86;
  const shade=THREE.MathUtils.clamp(175+65*v+35*n,0,255),i=(y*size+x)*4;
  data[i]=shade*.91;data[i+1]=shade*.96;data[i+2]=shade;data[i+3]=alpha*255;
 }
 const t=new THREE.DataTexture(data,size,size);t.colorSpace=THREE.SRGBColorSpace;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearFilter;t.needsUpdate=true;return t;
}
export function createSkyClouds():THREE.Group {
 const root=new THREE.Group();root.name='layered-cloud-banks';
 const map=cloudTexture(),mat=new THREE.MeshBasicMaterial({map,transparent:true,depthWrite:false,side:THREE.DoubleSide,fog:true,opacity:.85});
 const geo=new THREE.PlaneGeometry(1,1);
 for(let i=0;i<14;i++){
  const o=new THREE.Mesh(geo,mat);o.name='soft-cloud-bank';
  const side=i%2?-1:1,z=13+Math.floor(i/2)*6;
  o.position.set(side*(13+i%3*2),-1.8+(i%4)*1.4,z);o.scale.set(16+i%3*4,7+i%4,1);
  o.rotation.z=side*.035;o.userData.ambientCloud=true;root.add(o);
 }
 // Distant cloud sea sits below the destination, preserving the aiming corridor.
 for(let i=0;i<3;i++){const o=new THREE.Mesh(geo,mat);o.position.set((i-1)*24,-5,56);o.scale.set(34,10,1);root.add(o);}
 return root;
}
export function createMoonArt():THREE.Group {
 const root=new THREE.Group();root.name='lunar-survey-outpost';
 const earth=createEarth();earth.children.forEach(o=>{o.position.set(-6,12,52);o.scale.setScalar(.115);});root.add(earth);
 const grain=mineralTexture();grain.repeat.set(18,18);
 const soil=new THREE.MeshPhongMaterial({color:0x747c84,map:grain,bumpMap:grain,bumpScale:.035,shininess:2,specular:0x15191d});
 const geo=new THREE.PlaneGeometry(70,78,140,156);geo.rotateX(-Math.PI/2);geo.translate(0,-.65,25);
 const craters=[[-8,11,3.7],[9,21,4.8],[-13,34,6],[14,47,7],[-5,51,3]];
 const positions=geo.attributes.position,colors:number[]=[];
 for(let i=0;i<positions.count;i++){
  const x=positions.getX(i),z=positions.getZ(i);let h=.12*Math.sin(x*.41+z*.18)+.09*Math.sin(z*.8-x*.3);
  for(const [cx,cz,r] of craters){const d=Math.hypot(x-cx,z-cz)/r;h+=-r*.23*Math.exp(-d*d*3)+r*.11*Math.exp(-(((d-1)/.16)**2));}
  // Central launch region remains below Spark. These are landscape bowls, not torus props.
  positions.setY(i,-.65+h);const c=.82+.09*Math.sin(x*.52+z*.73);colors.push(c,c,c);
 }
 geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.computeVertexNormals();soil.vertexColors=true;
 const terrain=new THREE.Mesh(geo,soil);terrain.name='sculpted-crater-terrain';root.add(terrain);
 const batches=new Map<THREE.Material,THREE.BufferGeometry[]>(),t=new THREE.Object3D();
 const put=(g:THREE.BufferGeometry,m:THREE.Material,x:number,y:number,z:number,sx=1,sy=sx,sz=sx,rz=0,rx=0)=>{
  t.position.set(x,y,z);t.scale.set(sx,sy,sz);t.rotation.set(rx,0,rz);t.updateMatrix();
  const copy=(g.index?g.toNonIndexed():g.clone()).applyMatrix4(t.matrix);copy.deleteAttribute('color');
  const list=batches.get(m)??[];list.push(copy);batches.set(m,list);
 };
 const metal=new THREE.MeshPhongMaterial({color:0x8a969b,shininess:45}),dark=new THREE.MeshPhongMaterial({color:0x26323d,shininess:25});
 const foil=new THREE.MeshPhongMaterial({color:0x9b7950,shininess:80}),glass=new THREE.MeshPhongMaterial({color:0x18344b,shininess:100});
 const lamp=new THREE.MeshBasicMaterial({color:0xc5d7dd}),stone=new THREE.MeshPhongMaterial({color:0x60666b,map:mineralTexture(),shininess:2});
 const box=new THREE.BoxGeometry(1,1,1),cyl=new THREE.CylinderGeometry(1,1,1,16),rock=createAsteroidGeometry(7103,24,16);
 for(let i=0;i<30;i++){const side=i%2?-1:1;put(rock,stone,side*(4.5+i%7*1.6),-.42,5+i*1.6,.3+i%4*.28,.24+i%3*.15,.4+i%5*.16,i*.7);}
 // Pressure habitat: ribs, docking hatch, raised landing feet and insulated service pack.
 const hull=new THREE.CylinderGeometry(1.35,1.35,4.2,24);hull.rotateX(Math.PI/2);
 put(hull,metal,-7,1,24);
 const collar=new THREE.TorusGeometry(1.38,.07,8,36);
 for(const z of [22,23,24,25,26])put(collar,dark,-7,1,z);
 put(cyl,dark,-7,1,21.85,.93,.16,.93,0,Math.PI/2);
 put(cyl,glass,-7,1.25,21.74,.35,.04,.35,0,Math.PI/2);
 for(const side of [-1,1]){
  put(box,foil,-7+side*.9,.1,24,.38,1.2,3.5,side*.22);
  for(const z of [22.5,25.5])put(box,dark,-7+side*1.15,-.43,z,.8,.14,.85);
  put(box,lamp,-7+side*.7,1,21.74,.05,.7,.05);
 }
 put(box,foil,-9,1,25,1.1,1.5,2);for(let j=0;j<7;j++)put(box,dark,-9,.45+j*.17,23.97,1.05,.04,.04);
 // Three-legged communications dish with feed arm and segmented concave surface.
 const dish=new THREE.LatheGeometry(Array.from({length:15},(_,i)=>{const r=i/14*1.55;return new THREE.Vector2(r,.3*r*r);}),40);
 put(dish,metal,7,2.1,24,1,1,1,.35,Math.PI*.58);
 put(cyl,foil,7,.65,24,.12,2.5,.12);
 for(let j=0;j<3;j++){const a=j*Math.PI*2/3;put(box,dark,7+Math.cos(a)*.6,-.1,24+Math.sin(a)*.6,.1,1.5,.1,Math.cos(a)*.7);}
 put(box,foil,7,2.65,23.2,.08,1.9,.08,0,.45);put(box,dark,7,3.3,22.85,.28,.2,.3);
 // Survey rover: wheels, chassis, instruments and solar cells.
 put(box,foil,6,.35,12,1.7,.55,2.2);
 for(const side of [-1,1])for(const z of [11.3,12.7]){put(cyl,dark,6+side*.95,-.1,z,.4,.24,.4,Math.PI/2);put(cyl,metal,6+side*1.08,-.1,z,.2,.03,.2,Math.PI/2);}
 put(box,glass,6,.68,12,2.1,.05,2.3);for(let i=0;i<6;i++)put(box,metal,5.1+i*.36,.72,12,.025,.025,2.3);
 put(box,metal,6,1.3,12,.07,1.3,.07);put(box,dark,6,1.95,12,.55,.2,.3);put(box,lamp,6,1.95,11.83,.22,.07,.025);
 for(const [m,gs] of batches){root.add(new THREE.Mesh(mergeGeometries(gs,false)!,m));gs.forEach(g=>g.dispose());}
 for(const g of [box,cyl,rock,hull,collar,dish])g.dispose();
 return root;
}
