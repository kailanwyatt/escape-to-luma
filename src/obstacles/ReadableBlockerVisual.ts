import * as THREE from 'three';
import {mineralTexture} from '../environment/SkyMoonArt';
/** All detail stays within the authoritative unit XY silhouette; physics is unchanged. */
export function createReadableBlocker(kind:'drone'|'debris'|'weight'):THREE.Mesh {
 const geometry=new THREE.SphereGeometry(1,40,28);
 const map=kind==='debris'?mineralTexture():null;
 if(kind==='debris'){
  const p=geometry.attributes.position,colors:number[]=[];
  for(let i=0;i<p.count;i++){
   const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
   // Relief changes depth only. Preserve the circular hit boundary viewed from the player.
   const relief=.12*(.5+.5*Math.sin(x*19+y*8)*Math.sin(y*23-x*7));
   p.setZ(i,z*(1-relief));const shade=.7+.18*Math.sin(x*11+y*17)*Math.sin(y*13-z*9);colors.push(shade,shade*.96,shade*.91);
  }
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();
 }
 const body=new THREE.Mesh(geometry,new THREE.MeshPhongMaterial({color:kind==='debris'?0x756861:kind==='weight'?0x677887:0x3a5265,map,bumpMap:map,bumpScale:.06,vertexColors:kind==='debris',shininess:kind==='debris'?3:65}));
 body.name=kind==='drone'?'orbital-sentry':kind==='weight'?'pendulum-counterweight':'mineral-debris';
 if(kind==='debris')return body;
 const metal=new THREE.MeshPhongMaterial({color:0x17232e,shininess:70}),trim=new THREE.MeshPhongMaterial({color:0xa0acb4,shininess:90});
 const amber=new THREE.MeshBasicMaterial({color:0xffb45a});
 const add=(g:THREE.BufferGeometry,m:THREE.Material,x:number,y:number,z:number)=>{const o=new THREE.Mesh(g,m);o.position.set(x,y,z);body.add(o);return o;};
 add(new THREE.TorusGeometry(.79,.065,8,48),metal,0,0,-.62);
 const lens=add(new THREE.SphereGeometry(kind==='drone'?.27:.13,20,12),amber,0,0,-1);lens.scale.z=.18;
 add(new THREE.TorusGeometry(kind==='drone'?.31:.18,.04,8,32),trim,0,0,-.97);
 const bolt=new THREE.SphereGeometry(.035,8,6),vent=new THREE.BoxGeometry(.18,.035,.04);
 for(let i=0;i<8;i++){
  const a=i*Math.PI/4,x=Math.cos(a)*.78,y=Math.sin(a)*.78;
  add(bolt,trim,x,y,-.67);
  const panel=add(new THREE.BoxGeometry(.18,.28,.055),metal,Math.cos(a)*.56,Math.sin(a)*.56,-.85);panel.rotation.z=a-Math.PI/2;
  if(i%2===0){const mark=add(new THREE.BoxGeometry(.1,.035,.025),amber,Math.cos(a)*.56,Math.sin(a)*.56,-.89);mark.rotation.z=a;}
 }
 for(const side of [-1,1])for(let j=0;j<4;j++)add(vent,metal,side*.46,(j-1.5)*.085,-.91);
 if(kind==='weight'){
  const stripe=new THREE.BoxGeometry(.055,.52,.035);
  for(const side of [-1,1]){const o=add(stripe,amber,side*.23,0,-.99);o.rotation.z=-.24;}
 }
 return body;
}
