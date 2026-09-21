import * as THREE from 'three';
import {mineralTexture} from '../environment/SkyMoonArt';

function box(parent:THREE.Object3D,w:number,h:number,d:number,x:number,y:number,z:number,material:THREE.Material){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);parent.add(mesh);return mesh;}
/** Relief and fittings remain inside each authoritative XY silhouette. */
export function dressSecurityPanel(mesh:THREE.Mesh,moving:boolean){
 const dark=new THREE.MeshPhongMaterial({color:0x101c29,shininess:70}),steel=new THREE.MeshPhongMaterial({color:0x667887,shininess:100}),amber=new THREE.MeshBasicMaterial({color:0xffbd54});
 for(const x of [-.43,.43]){box(mesh,.045,.9,.045,x,0,-.13,steel);for(const y of [-.43,.43]){const bolt=new THREE.Mesh(new THREE.CylinderGeometry(.026,.026,.025,6),steel);bolt.rotation.x=Math.PI/2;bolt.position.set(x,y,-.16);mesh.add(bolt);}}
 if(moving){
  box(mesh,.72,.8,.035,0,0,-.125,dark);
  for(let i=0;i<7;i++)box(mesh,.55,.022,.025,0,-.27+i*.09,-.15,steel);
  for(const x of [-.3,-.1,.1,.3]){const stripe=box(mesh,.11,.035,.035,x,-.4,-.16,amber);stripe.rotation.z=.35;}
 }else box(mesh,.22,.76,.04,0,0,-.14,dark);
}
export function dressDebris(mesh:THREE.Mesh,seed:number){
 const geometry=mesh.geometry,positions=geometry.attributes.position;
 // Keep the circular XY hit boundary, but individualize rock depth and mineral structure.
 const colors:number[]=[];
 for(let i=0;i<positions.count;i++){
  const x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i);
  const ridge=Math.sin(x*(11+seed%5)+seed)*Math.cos(y*17-seed*.7);
  positions.setZ(i,z*(.72+.17*ridge));const shade=.42+.22*(ridge*.5+.5);colors.push(shade,shade*.92,shade*.86);
 }
 geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();
 const material=mesh.material as THREE.MeshPhongMaterial;material.color.setHex(seed%2?0x796e66:0x69717c);material.shininess=2;material.bumpScale=.13;
}
export function dressMaze(parent:THREE.Group,holeRadius:number){
 const stone=new THREE.MeshPhongMaterial({color:0x8c7956,shininess:24,map:mineralTexture()}),gold=new THREE.MeshBasicMaterial({color:0xdfac59});
 // Radial inscriptions and raised plates, omitting every detail near the opening.
 for(let i=0;i<36;i++){
  const a=i*Math.PI/18,x=Math.cos(a)*2.29,y=Math.sin(a)*2.29;
  if(Math.hypot(x-.85,y)<holeRadius+.3)continue;
  const slab=box(parent,.17,.32,.065,x,y,-.18,stone);slab.rotation.z=a-Math.PI/2;
  const glyph=box(slab,.025,.18,.02,0,0,-.05,gold);
  box(glyph,.09,.025,.02,0,.025,-.015,gold);
 }
 const rim=new THREE.Mesh(new THREE.TorusGeometry(holeRadius+.065,.027,8,64),stone);rim.position.set(.85,0,-.16);parent.add(rim);
}
export function sequenceHousing(index:number){
 const group=new THREE.Group(),metal=new THREE.MeshPhongMaterial({color:0x4e4a40,shininess:65}),light=new THREE.MeshBasicMaterial({color:index===2?0xb0ffe3:index===1?0x78dfff:0xf7cb73});
 for(let i=0;i<12;i++){
  const a=i*Math.PI/6,rad=2.25;
  const fitting=box(group,.22,.3,.16,Math.cos(a)*rad,Math.sin(a)*rad,-.17,metal);fitting.rotation.z=a;
  box(fitting,.065,.19,.025,0,0,-.095,light);
 }
 // One, two or three illuminated index bars identify depth, without interface text.
 for(let i=0;i<=index;i++)box(group,.07,.19,.025,(i-index/2)*.14,2.05,-.22,light);
 return group;
}
