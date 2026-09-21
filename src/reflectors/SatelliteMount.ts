import * as THREE from 'three';

/** Rear-mounted spacecraft dressing; only the existing panel owns bounce collision. */
export function createSatelliteMount(width:number,height:number):THREE.Group {
 const group=new THREE.Group();group.name='reflector-satellite';
 const scale=Math.min(1,Math.max(.65,width*.55));
 const steel=new THREE.MeshPhongMaterial({color:0x8599a8,shininess:65});
 const foil=new THREE.MeshPhongMaterial({color:0xb39a60,shininess:45});
 const dark=new THREE.MeshPhongMaterial({color:0x1b2938,shininess:25});
 const glow=new THREE.MeshBasicMaterial({color:0x91dbe7});
 const box=new THREE.BoxGeometry(1,1,1);
 const block=(material:THREE.Material,x:number,y:number,z:number,w:number,h:number,d:number)=>{
  const m=new THREE.Mesh(box,material);m.position.set(x,y,z);m.scale.set(w,h,d);group.add(m);return m;
 };
 const bodyY=-height/2-.48*scale;
 // Back-side gimbal and short, connected yoke keep the reflective face unobstructed.
 block(steel,0,-height*.22,-.25,.14*scale,height*.56,.18*scale);
 block(steel,0,-height/2-.06*scale,-.43,.14*scale,.24*scale,.58*scale);
 const joint=new THREE.Mesh(new THREE.CylinderGeometry(.17*scale,.17*scale,.24*scale,12),dark);
 joint.rotation.z=Math.PI/2;joint.position.set(0,-height/2,-.28);group.add(joint);
 // Insulated bus, radiator, corner rails and recessed instrument face.
 block(foil,0,bodyY,-.5,.8*scale,.7*scale,.65*scale);
 block(dark,0,bodyY,-.155,.65*scale,.49*scale,.04);
 for(let i=0;i<5;i++)block(steel,0,bodyY+(i-2)*.075*scale,-.12,.5*scale,.018*scale,.025);
 for(const side of [-1,1])block(steel,side*.4*scale,bodyY,-.5,.065*scale,.77*scale,.72*scale);
 block(glow,.25*scale,bodyY+.24*scale,-.11,.07*scale,.035*scale,.025);
 // Side communication dish, with a feed horn and boom visibly attached to the bus.
 block(steel,.61*scale,bodyY,-.5,.43*scale,.08*scale,.08*scale);
 const dish=new THREE.Mesh(new THREE.SphereGeometry(.3*scale,20,10,0,Math.PI*2,0,.95),new THREE.MeshPhongMaterial({color:0xbac8cd,side:THREE.DoubleSide,shininess:70}));
 dish.rotation.x=Math.PI/2;dish.position.set(.87*scale,bodyY,-.48);group.add(dish);
 block(steel,.87*scale,bodyY,-.25,.035*scale,.035*scale,.48*scale);
 const feed=new THREE.Mesh(new THREE.SphereGeometry(.045*scale,8,6),dark);feed.position.set(.87*scale,bodyY,0);group.add(feed);
 block(steel,-.31*scale,bodyY-.63*scale,-.5,.025*scale,.6*scale,.025*scale);
 return group;
}
