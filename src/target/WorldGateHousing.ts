import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
/** Decorative housings remain outside the unit scoring aperture. */
export function createWorldGateHousing(world:string):THREE.Group {
 const root=new THREE.Group();root.name=`gate-housing-${world}`;
 const organic=world==='homeward',ancient=world==='network',crystal=world==='nebula';
 const color=organic?0x437f7b:ancient?0x8b7049:crystal?0x635084:world==='moon'?0x92979c:0x344654;
 const shell=new THREE.MeshPhongMaterial({color,shininess:organic?100:65,specular:0x7d9ea8});
 const trim=new THREE.MeshPhongMaterial({color:ancient?0xc09b59:world==='orbit'?0xad8850:0x172a36,shininess:80});
 const glow=new THREE.MeshBasicMaterial({color:ancient?0xffd281:organic?0xb2ffe0:crystal?0xc19afa:0x8adeee});
 const batches=new Map<THREE.Material,THREE.BufferGeometry[]>(),t=new THREE.Object3D();
 const put=(g:THREE.BufferGeometry,m:THREE.Material,x=0,y=0,z=0,sx=1,sy=sx,sz=sx,rz=0)=>{
  t.position.set(x,y,z);t.scale.set(sx,sy,sz);t.rotation.set(0,0,rz);t.updateMatrix();const copy=(g.index?g.toNonIndexed():g.clone()).applyMatrix4(t.matrix);copy.deleteAttribute('uv');
  const list=batches.get(m)??[];list.push(copy);batches.set(m,list);
 };
 const block=new THREE.BoxGeometry(1,1,1);
 const ring=new THREE.TorusGeometry(1.19,.075,8,64);put(ring,trim);
 if(organic){
  for(let i=0;i<3;i++){
   const points=Array.from({length:49},(_,j)=>{const a=j/48*Math.PI*2,r=1.28+.065*Math.sin(a*3+i*2.1);return new THREE.Vector3(Math.cos(a)*r,Math.sin(a)*r,.06*Math.sin(a*3+i));});
   const g=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points,true),64,i===2?.018:.045,6,true);put(g,i===2?glow:shell);g.dispose();
  }
 }else{
  const count=ancient?12:crystal?7:8;
  for(let i=0;i<count;i++){
   const a=i/count*Math.PI*2;
   if(crystal){const g=new THREE.CylinderGeometry(.015,.12,.55,5);put(g,shell,Math.cos(a)*1.34,Math.sin(a)*1.34,0,1,1,1,a-Math.PI/2);g.dispose();}
   else {
    const g=new THREE.TorusGeometry(1.29,ancient?.12:.095,6,10,Math.PI*2/count-.065);put(g,shell,0,0,.02,1,1,1,a);g.dispose();
    put(block,trim,Math.cos(a)*1.29,Math.sin(a)*1.29,-.08,.13,.21,.12,a);
   }
   put(block,glow,Math.cos(a)*1.28,Math.sin(a)*1.28,-.16,.085,.025,.03,a);
  }
 }
 if(['city','sky','ascent','storm','upper_atmosphere','orbit','orbital_graveyard','moon','far_side'].includes(world)){
  // Braced service modules, kept outside the circular opening.
  for(const side of [-1,1]){
   put(block,shell,side*1.5,0,.1,.22,world==='sky'||world==='ascent'||world==='storm'?1.3:1.8,.35);
   put(block,trim,side*1.5,0,-.1,.14,1.1,.07);
   for(let j=0;j<5;j++)put(block,glow,side*1.5,(j-2)*.16,-.15,.075,.025,.025);
   if(world==='orbit'||world==='orbital_graveyard'||world==='upper_atmosphere'){
    put(block,trim,side*1.67,.15,.18,.3,.09,.1);
    put(block,shell,side*1.85,.15,.18,.17,.72,.06);
   }
   if(world==='moon'||world==='far_side')put(block,trim,side*1.39,-1.2,.1,.32,.16,.35);
  }
 }
 if(world==='asteroid'||world==='asteroid_belt'||world==='drift'){
  const arc=new THREE.TorusGeometry(1.38,.07,6,36,Math.PI*.7);put(arc,shell,0,0,.08,1,1,1,.4);put(arc,shell,0,0,.08,1,1,1,3.4);arc.dispose();
 }
 for(const [m,gs] of batches){root.add(new THREE.Mesh(mergeGeometries(gs,false)!,m));gs.forEach(g=>g.dispose());}
 for(const m of [shell,trim,glow])if(!batches.has(m))m.dispose();block.dispose();ring.dispose();return root;
}
