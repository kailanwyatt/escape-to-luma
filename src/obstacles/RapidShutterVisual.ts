import * as THREE from 'three';
import type {SlidingGateConfig} from '../config/ObstacleConfig';
import {containmentMetal} from '../graphics/ContainmentMaterials';
import {gateStateAtTime} from './RapidShutterState';

export function createRapidShutter(c:SlidingGateConfig):THREE.Group {
 const root=new THREE.Group();root.name='rapid-security-shutter';
 const vertical=c.shutter?.orientation==='vertical';
 const span=c.shutter?.maxOpeningWidth??(vertical?c.openingHeight:c.openingWidth),height=vertical?c.openingWidth:c.openingHeight;
 root.position.set(c.baseX,c.baseY??3,0);root.rotation.z=vertical?Math.PI/2:0;
 const metal=containmentMetal();metal.color.setHex(0x647687);
 const dark=new THREE.MeshPhongMaterial({color:0x172535,shininess:55});
 const trim=new THREE.MeshPhongMaterial({color:0x637d91,shininess:75});
 const light=new THREE.MeshBasicMaterial({color:0x68e7ff,toneMapped:false});
 const box=new THREE.BoxGeometry(1,1,1);
 const block=(parent:THREE.Object3D,m:THREE.Material,x:number,y:number,z:number,w:number,h:number,d:number,name='')=>{const o=new THREE.Mesh(box,m);o.name=name;o.position.set(x,y,z);o.scale.set(w,h,d);parent.add(o);return o;};
 const housing=new THREE.Group();housing.name='FixedHousing';root.add(housing);
 for(const sign of [-1,1]){
  block(housing,metal,sign*(span*.75+.12),0,-.03,span*.5+.24,height+.45,.58);
  block(housing,trim,sign*(span/2+.1),0,-.36,.09,height+.55,.12);
  block(housing,light,sign*(span/2+.18),0,-.38,.045,height*.62,.025);
  block(housing,dark,sign*(span/2+.32),height/2+.12,-.2,.34,.22,.4);
 }
 for(const sign of [-1,1]){
  block(housing,dark,0,sign*(height/2+.18),0,span*2+.45,.32,.55);
  block(housing,trim,0,sign*(height/2+.06),-.29,span*2+.35,.055,.035);
 }
 for(const [i,sign] of [-1,1].entries()){
  const panel=new THREE.Group();panel.name=i===0?'ShutterLeft':'ShutterRight';root.add(panel);
  block(panel,metal,0,0,.11,span/2,height,.12);
  for(const y of [-.3,0,.3])block(panel,dark,0,y*height,-.005,span*.32,.055,.015);
  block(panel,light,-sign*(span/4-.035),0,-.018,.035,height*.92,.018);
  const arrow=new THREE.Group();arrow.name='DirectionArrow';panel.add(arrow);
  for(const n of [0,1])for(const slope of [-1,1]){const bar=block(arrow,light,n*.11-.055,slope*.07,-.055,.035,.2,.018);bar.rotation.z=slope*.55;}
 }
 root.userData.light=light;root.userData.span=span;
 return root;
}
export function layoutRapidShutter(root:THREE.Group,c:SlidingGateConfig,t:number):void {
 const state=gateStateAtTime(c,t),vertical=c.shutter?.orientation==='vertical';
 const span=root.userData.span as number,opening=vertical?state.height:state.width;
 // Rotating the horizontal assembly maps local x to world y for vertical shutters.
 const shift=vertical?state.y-(c.baseY??3):state.x-c.baseX;
 for(const [i,sign] of [-1,1].entries()){
  const panel=root.getObjectByName(i===0?'ShutterLeft':'ShutterRight')!;
  panel.position.x=shift+sign*(opening/2+span/4);
  const inward=state.shutter?.phase==='WARNING'||state.shutter?.phase==='SLAMMING_CLOSED'||state.shutter?.phase==='CLOSED';
  panel.getObjectByName('DirectionArrow')!.scale.x=(inward?-sign:sign);
 }
 const phase=state.shutter!.phase;
 const light=root.userData.light as THREE.MeshBasicMaterial;
 // A brief bright red afterglow marks impact without camera shake or strobing.
 light.color.setHex(phase==='WARNING'?0xffb640:phase==='SLAMMING_CLOSED'||phase==='CLOSED'?0xff4435:0x68e7ff);
 if(phase==='CLOSED')light.color.multiplyScalar(.55+.45*Math.max(0,1-state.shutter!.timeInState/.12));
}
