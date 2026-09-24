import * as THREE from 'three';
import {containmentMetal} from '../graphics/ContainmentMaterials';

/** Rooftop objects built from shared, instanced parts. The central flight lane
 * stays clear; equipment occupies service strips outside x ±3.1. */
export function createRooftopScene(distantBuildings=true): THREE.Group {
  const root=new THREE.Group();root.name='rooftop';
  const steel=containmentMetal();steel.color.setHex(0xadb9bb);
  const concrete=new THREE.MeshPhongMaterial({color:0x657784,shininess:8});
  const coping=new THREE.MeshPhongMaterial({color:0xa7b2b8,shininess:45});
  const dark=new THREE.MeshLambertMaterial({color:0x15222e});
  const rubber=new THREE.MeshLambertMaterial({color:0x283843});
  const paint=new THREE.MeshLambertMaterial({color:0xd2ad62});
  const window=new THREE.MeshBasicMaterial({color:0x455e75});
  const windowMatrices:THREE.Matrix4[]=[];
  const litWindow=new THREE.MeshBasicMaterial({color:0xe2bc79});
  const batches=new Map<THREE.Material,THREE.Matrix4[]>();
  const transform=new THREE.Object3D();
  const box=(mat:THREE.Material,x:number,y:number,z:number,w:number,h:number,d:number,rotation=0)=>{
    transform.position.set(x,y,z);transform.scale.set(w,h,d);transform.rotation.set(0,rotation,0);transform.updateMatrix();
    const list=batches.get(mat) ?? [];list.push(transform.matrix.clone());batches.set(mat,list);
  };
  const mesh=(geometry:THREE.BufferGeometry,material:THREE.Material,x:number,y:number,z:number)=>{
    const item=new THREE.Mesh(geometry,material);item.position.set(x,y,z);root.add(item);return item;
  };
  const floor=containmentMetal('floor');floor.color.setHex(0x73828b);floor.shininess=12;floor.map!.repeat.set(8,12);
  const roof=mesh(new THREE.PlaneGeometry(11,29),floor,0,0,5.5);roof.rotation.x=-Math.PI/2;
  for(const side of [-1,1]) {
    box(concrete,side*5.35,.5,5.5,.34,1,29);
    box(coping,side*5.35,1.04,5.5,.46,.09,29);
    box(rubber,side*5.1,.1,5.5,.12,.2,29);
    // Service walkway edging and drain grilles.
    box(paint,side*3.1,.015,5.5,.07,.02,26);
    for(const z of [-2,3,8,13]) {
      box(dark,side*4.95,.025,z,.32,.025,.65);
      for(let i=0;i<5;i++)box(coping,side*4.95,.043,z-.24+i*.12,.28,.015,.025);
    }
  }
  const fanDisk=new THREE.CylinderGeometry(.38,.38,.055,24);
  const fanRim=new THREE.TorusGeometry(.4,.025,6,28);
  // Each AC unit has a plinth, panel seams, louvres, rooftop fans and conduit.
  for(const [x,z] of [[-4,2],[4.05,5.3],[-4.05,10.2],[4.1,12]]) {
    box(concrete,x,.14,z,1.7,.28,2.15);
    box(steel,x,.85,z,1.5,1.15,1.95);
    box(coping,x,1.46,z,1.58,.08,2.04);
    box(dark,x,.85,z-1.0,1.25,.72,.035);
    for(let i=0;i<7;i++)box(coping,x,.56+i*.09,z-1.03,1.18,.035,.055);
    box(paint,x+.5,1.27,z-1.03,.16,.09,.025);
    for(const fz of [-.49,.49]) {
      mesh(fanDisk,dark,x,1.52,z+fz);
      const rim=mesh(fanRim,coping,x,1.56,z+fz);rim.rotation.x=Math.PI/2;
      for(let i=0;i<4;i++)box(coping,x,1.56,z+fz,.68,.018,.055,i*Math.PI/4);
    }
    box(dark,x+.64,.45,z+1.25,.1,.16,.55);
    box(coping,x+.64,.65,z+1.47,.09,.45,.09);
  }
  // Raised insulated duct run, with flanged joints and a weather hood.
  for(const side of [-1,1]) {
    const x=side*4.75;
    box(coping,x,.46,7,.48,.48,5.6);
    for(const z of [4.3,5.7,7.1,8.5,9.7]) {
      box(steel,x,.46,z,.54,.54,.07);
      box(concrete,x,.12,z,.65,.24,.3);
    }
    mesh(new THREE.CylinderGeometry(.2,.2,1,16),coping,side*3.65,.5,14);
    mesh(new THREE.CylinderGeometry(.38,.38,.12,16),coping,side*3.65,1.07,14);
  }
  // Stairwell access house with recessed door, hinges, handle and canopy.
  box(concrete,-4.35,1.7,15,2.3,3.4,3.2);
  box(coping,-4.35,3.46,15,2.55,.15,3.5);
  box(dark,-4.25,1.37,13.36,1.25,2.55,.08);
  box(steel,-4.25,1.37,13.29,1.1,2.4,.08);
  box(coping,-3.88,1.32,13.19,.055,.3,.055);
  box(litWindow,-4.25,2.94,13.24,.56,.13,.08);
  box(coping,-4.25,3.05,13.03,1.5,.1,.65);
  for(const y of [.5,1.3,2.1])box(dark,-4.77,y,13.2,.07,.18,.05);
  // Communications mast and actual shallow dish, rather than a bare cylinder.
  mesh(new THREE.CylinderGeometry(.045,.07,4.2,10),coping,4.55,2.1,15.5);
  box(concrete,4.55,.15,15.5,.75,.3,.75);
  for(const y of [2.5,3.3,3.8])box(coping,4.55,y,15.5,1.15,.045,.045);
  mesh(new THREE.SphereGeometry(.07,10,8),litWindow,4.55,4.23,15.5);
  const dishProfile=[new THREE.Vector2(0,0),new THREE.Vector2(.15,.025),new THREE.Vector2(.35,.1),new THREE.Vector2(.6,.28)];
  const dishMat=new THREE.MeshPhongMaterial({color:0xc1cbd0,side:THREE.DoubleSide,shininess:50});
  const dish=mesh(new THREE.LatheGeometry(dishProfile,24),dishMat,4.45,2.35,14.95);dish.rotation.x=-Math.PI/2;
  box(coping,4.45,2.35,14.74,.045,.045,.42);
  // Distant buildings have different heights, roof crowns and window grids.
  for(let i=0;i<(distantBuildings?15:0);i++) {
    const x=-24+i*3.45,z=25+(i%3)*5,height=8+(i*7%11),width=2.4+(i%3)*.35;
    box(concrete,x,height/2-4,z,width,height,3.2);
    box(coping,x,height-3.9,z,width+.15,.2,3.35);
    if(i%3===0)box(dark,x,height-3.4,z,1.3,1,1.5);
    for(let row=0;row<height-1;row++)for(let col=0;col<3;col++) {
      transform.position.set(x-width*.3+col*width*.3,row-3,z-1.62);transform.scale.set(.35,.48,.025);transform.rotation.set(0,0,0);transform.updateMatrix();windowMatrices.push(transform.matrix.clone());
    }
  }
  const cube=new THREE.BoxGeometry(1,1,1);
  for(const [material,matrices] of batches) {
    const instances=new THREE.InstancedMesh(cube,material,matrices.length);
    matrices.forEach((matrix,i)=>instances.setMatrixAt(i,matrix));instances.instanceMatrix.needsUpdate=true;
    instances.computeBoundingSphere();root.add(instances);
  }
  window.dispose();
  const windows=new THREE.InstancedMesh(cube,new THREE.MeshBasicMaterial({color:0xffffff}),windowMatrices.length);windows.name='city-activity-windows';
  windowMatrices.forEach((m,i)=>windows.setMatrixAt(i,m));
  const off=new THREE.Color(0x455e75),on=new THREE.Color(0xe2bc79),color=new THREE.Color();
  let lastTick=-1;
  root.userData.updateWindows=(time:number,reduced:boolean)=>{
    const tick=reduced?-2:Math.floor(time*10);if(tick===lastTick)return;lastTick=tick;
    for(let i=0;i<windowMatrices.length;i++){
      const period=18+(i*17%29),offset=(i*7.319)%period;
      const clock=reduced?offset:time+offset,cycle=Math.floor(clock/period),p=clock/period-cycle;
      const hash=(k:number)=>{const v=Math.sin(i*127.1+k*311.7)*43758.5453;return v-Math.floor(v);};
      const previous=hash(cycle-1)>.73?1:0,next=hash(cycle)>.73?1:0;
      const fade=Math.min(1,p*period/2),smooth=fade*fade*(3-2*fade);
      color.copy(off).lerp(on,previous+(next-previous)*smooth);windows.setColorAt(i,color);
    }
    if(windows.instanceColor)windows.instanceColor.needsUpdate=true;
  };
  root.userData.updateWindows(0,false);windows.computeBoundingSphere();root.add(windows);
  return root;
}
