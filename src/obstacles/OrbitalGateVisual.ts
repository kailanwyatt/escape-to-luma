import * as THREE from 'three';
import {containmentMetal} from '../graphics/ContainmentMaterials';
import {GAME_TUNING} from '../game/gameTuning';

/** Rear pressure door: amber rectangular opening contrasts with the cyan iris.
 * Geometry stays on the authored collision plane; no new movement or timing. */
export function createOrbitalGate():THREE.Group {
 const root=new THREE.Group();root.userData.orbitalGate=true;
 const wall=containmentMetal();wall.color.setHex(0x536475);wall.map!.repeat.set(2,2);
 const dark=new THREE.MeshPhongMaterial({color:0x111e2a,shininess:25});
 const steel=new THREE.MeshPhongMaterial({color:0x82949e,shininess:65});
 const inset=new THREE.MeshPhongMaterial({color:0x2a3c4c,shininess:35});
 const amber=new THREE.MeshBasicMaterial({color:0xf6b85a});
 const unit=new THREE.BoxGeometry(1,1,1);
 const part=(name:string,mat:THREE.Material)=>{const m=new THREE.Mesh(unit,mat);m.name=name;root.add(m);return m;};
 for(const name of ['left','right','top','bottom']){
  const panel=part(name,wall);
  // Face ribs stay as children so they stretch with the moving slab.
  if(name==='left'||name==='right'){
   for(let i=0;i<5;i++){
    const rib=new THREE.Mesh(unit,inset);
    rib.position.set(0,(i-2)*1.05,-.55);
    rib.scale.set(.7,.12,.08);
    panel.add(rib);
   }
   const seal=new THREE.Mesh(unit,steel);
   seal.position.set(name==='left'?.42:-.42,0,-.6);
   seal.scale.set(.08,.95,.1);
   panel.add(seal);
  }else{
   for(let i=0;i<7;i++){
    const rib=new THREE.Mesh(unit,inset);
    rib.position.set((i-3)*1.15,0,-.55);
    rib.scale.set(.14,.65,.08);
    panel.add(rib);
   }
   const seal=new THREE.Mesh(unit,steel);
   seal.position.set(0,name==='top'?-.42:.42,-.6);
   seal.scale.set(.95,.08,.1);
   panel.add(seal);
  }
 }
 for(const name of ['jambLeft','jambRight','lintel','sill'])part(name,dark);
 for(const name of ['edgeLeft','edgeRight','edgeTop','edgeBottom'])part(name,amber);
 for(const s of [-1,1]){
  const column=part(`column${s}`,steel);column.position.set(s*4.6,3,.05);column.scale.set(.28,6.7,.45);
  for(let i=0;i<5;i++){
   const rib=part(`rib${s}-${i}`,dark);rib.position.set(s*3.8,.6+i*1.15,-.16);rib.scale.set(.85,.065,.07);
  }
 }
 for(const y of [-.15,6.3]){
  const rail=part(`rail${y}`,steel);rail.position.set(0,y,-.03);rail.scale.set(9.5,.25,.48);
  const track=part(`track${y}`,dark);track.position.set(0,y,-.29);track.scale.set(8.7,.08,.04);
 }
 for(const name of ['motorLeft','motorRight'])part(name,steel);
 for(let i=0;i<4;i++)part(`roller${i}`,steel);
 return root;
}
export function layoutOrbitalGate(root:THREE.Group,x:number,y:number,w:number,h:number):void {
 const half=GAME_TUNING.gate.panelWidth/2;
 const base=GAME_TUNING.gate.baseY, height=GAME_TUNING.gate.panelHeight;
 const put=(name:string,px:number,py:number,pz:number,sx:number,sy:number,sz:number)=>{
  const o=root.getObjectByName(name)!;o.position.set(px,py,pz);o.scale.set(sx,sy,sz);
 };
 const left=x-w/2,right=x+w/2,bottom=y-h/2,top=y+h/2;
 // Four non-overlapping slabs prevent the coplanar flicker of the old full-height panels.
 put('left',(-half+left)/2,y,.09,left+half,h,.18);
 put('right',(right+half)/2,y,.09,half-right,h,.18);
 put('top',0,(top+base+height/2)/2,.09,half*2,Math.max(.01,base+height/2-top),.18);
 put('bottom',0,(bottom+base-height/2)/2,.09,half*2,Math.max(.01,bottom-base+height/2),.18);
 for(const [side,px] of [['Left',left],['Right',right]] as const){
  const sign=side==='Left'?-1:1;
  put(`jamb${side}`,px+sign*.13,y,-.09,.26,h+.5,.22);
  put(`edge${side}`,px+sign*.028,y,-.215,.055,h,.025);
  put(`motor${side}`,px+sign*.32,top+.35,-.12,.4,.4,.35);
 }
 put('lintel',x,top+.13,-.09,w,.26,.22);put('sill',x,bottom-.13,-.09,w,.26,.22);
 put('edgeTop',x,top+.028,-.215,w,.055,.025);put('edgeBottom',x,bottom-.028,-.215,w,.055,.025);
 for(let i=0;i<4;i++)put(`roller${i}`,x+(i%2?1:-1)*(w/2+.18),i<2?6.3:-.15,-.3,.26,.34,.18);
}
