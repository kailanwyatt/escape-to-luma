import * as THREE from 'three';

/** A single reusable spacecraft kit. Its collection door is animated by OpeningScene. */
export function createOpeningProbe(): THREE.Group {
 const group=new THREE.Group();group.name='deep-space-collection-probe';
 const titanium=new THREE.MeshPhongMaterial({color:0x8797a5,shininess:95,specular:0xc6e7ff});
 const dark=new THREE.MeshPhongMaterial({color:0x182331,shininess:65});
 const foil=new THREE.MeshPhongMaterial({color:0x9d793f,shininess:80,specular:0xffd395});
 const cell=new THREE.MeshPhongMaterial({color:0x122d58,shininess:115,specular:0x6aafff,emissive:0x030c1a});
 const trace=new THREE.MeshBasicMaterial({color:0x55749a});
 const light=new THREE.MeshBasicMaterial({color:0x85ecff});
 const amber=new THREE.MeshBasicMaterial({color:0xffbd68});
 function add(g:THREE.BufferGeometry,m:THREE.Material,x:number,y:number,z:number,parent=group){const mesh=new THREE.Mesh(g,m);mesh.position.set(x,y,z);parent.add(mesh);return mesh;}
 function box(w:number,h:number,d:number,x:number,y:number,z:number,m:THREE.Material,parent=group){return add(new THREE.BoxGeometry(w,h,d),m,x,y,z,parent);}
 function ring(radius:number,tube:number,z:number,m:THREE.Material){return add(new THREE.TorusGeometry(radius,tube,8,48),m,0,0,z);}
 // Rounded pressure hull with insulation, radiator fins and bolted end bands.
 const hull=add(new THREE.CylinderGeometry(.46,.46,1.18,32),foil,0,0,.16);hull.rotation.x=Math.PI/2;
 for(const z of [-.43,.25,.72])ring(.465,.035,z,titanium);
 for(let i=0;i<12;i++){const a=i*Math.PI/6;const panel=box(.15,.035,.72,Math.sin(a)*.47,Math.cos(a)*.47,.22,dark);panel.rotation.z=-a;}
 for(const side of [-1,1]){
  box(1.15,.065,.1,side*.88,0,.2,titanium);
  const wing=new THREE.Group();wing.position.set(side*1.45,0,.2);wing.rotation.x=1.05;group.add(wing);
  box(1.34,.055,1.85,0,0,0,titanium,wing);
  box(1.26,.012,1.77,0,-.035,0,cell,wing);box(1.26,.012,1.77,0,.035,0,cell,wing);
  // Fine etched cell seams, visible on both sides of each array.
  for(let col=0;col<5;col++)box(.004,.083,1.77,-.63+col*.315,0,0,trace,wing);
  for(let row=0;row<9;row++)box(1.26,.083,.006,0,0,-.88+row*.22,trace,wing);
  box(.06,.07,1.85,side*.67,0,0,foil,wing);
 }
 // Dish: curved reflector, central feed, support arm and receiver.
 add(new THREE.CylinderGeometry(.035,.05,.75,12),titanium,0,.68,.45);
 const dishPoints=Array.from({length:19},(_,i)=>{const r=i/18*.39;return new THREE.Vector2(r,.9*r*r);});
 const dish=add(new THREE.LatheGeometry(dishPoints,40),new THREE.MeshPhongMaterial({color:0xc4d4dd,shininess:100,side:THREE.DoubleSide}),0,1.04,.42);dish.rotation.x=-Math.PI/2;
 const feed=add(new THREE.CylinderGeometry(.018,.018,.34,8),dark,0,1.04,.23);feed.rotation.x=Math.PI/2;
 add(new THREE.SphereGeometry(.045,12,8),foil,0,1.04,.06);
 // Recessed collection throat with structural ribs, circular lens and guide lamps.
 const throat=add(new THREE.CylinderGeometry(.48,.43,.58,40,1,true),dark,0,0,-.74);throat.rotation.x=Math.PI/2;
 for(const z of [-.5,-.79,-1.08])ring(.49,.028,z,titanium);
 ring(.425,.016,-1.095,light);
 for(let i=0;i<8;i++){const a=i*Math.PI/4;box(.025,.025,.55,Math.cos(a)*.49,Math.sin(a)*.49,-.79,foil);add(new THREE.SphereGeometry(.025,8,6),i%2?amber:light,Math.cos(a)*.51,Math.sin(a)*.51,-1.1);}
 for(const side of [-1,1]){
  const nozzle=add(new THREE.CylinderGeometry(.1,.15,.25,16,1,true),dark,side*.32,-.3,.85);nozzle.rotation.x=Math.PI/2;
  const lens=add(new THREE.SphereGeometry(.07,16,12),light,side*.37,.26,-.43);lens.scale.z=.35;
 }
 return group;
}
