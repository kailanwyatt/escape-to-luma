import * as THREE from 'three';
import {GAME_TUNING} from '../game/gameTuning';

/** A pressure shutter with a continuous safe opening. Animation never owns collision. */
export function createOrbitalIris(): THREE.Group {
  const root=new THREE.Group();root.userData.orbitalIris=true;
  const outer=GAME_TUNING.iris.outerRadius;
  const steel=new THREE.MeshPhongMaterial({color:0x536b83,shininess:65,side:THREE.DoubleSide});
  const alternate=new THREE.MeshPhongMaterial({color:0x344d65,shininess:75,side:THREE.DoubleSide});
  const dark=new THREE.MeshPhongMaterial({color:0x152739,shininess:70});
  const metal=new THREE.MeshPhongMaterial({color:0x97adbf,shininess:95});
  const amber=new THREE.MeshBasicMaterial({color:0xf0b657});
  const cyan=new THREE.MeshBasicMaterial({color:0x92e8f2});
  const ring=(r:number,tube:number,m:THREE.Material,z:number)=>{const o=new THREE.Mesh(new THREE.TorusGeometry(r,tube,8,96),m);o.position.z=z;root.add(o);return o;};
  ring(outer,.15,dark,.04);ring(outer+.05,.035,metal,-.105);
  // Unit annulus scales to the exact safe radius, with its thickness outside the hole.
  const aperture=new THREE.Mesh(new THREE.RingGeometry(1,1.022,96),new THREE.MeshBasicMaterial({color:0x92e8f2,side:THREE.DoubleSide}));
  aperture.name='aperture';aperture.position.z=-.065;root.add(aperture);
  for(let i=0;i<8;i++) {
    const angle=i*Math.PI/4;
    const petal=new THREE.Mesh(new THREE.RingGeometry(.5,outer,12,1,angle,Math.PI/4+.003),i%2?steel:alternate);
    petal.name=`petal-${i}`;(petal.geometry.attributes.position as THREE.BufferAttribute).setUsage(THREE.DynamicDrawUsage);
    petal.geometry.boundingSphere=new THREE.Sphere(new THREE.Vector3(),outer+.1);root.add(petal);
    const clamp=new THREE.Mesh(new THREE.BoxGeometry(.3,.38,.28),metal);clamp.position.set(Math.cos(angle)*outer,Math.sin(angle)*outer,-.03);clamp.rotation.z=angle;root.add(clamp);
    const lamp=new THREE.Mesh(new THREE.BoxGeometry(.12,.24,.025),amber);lamp.position.set(clamp.position.x,clamp.position.y,-.19);lamp.rotation.z=angle;root.add(lamp);
    // Fasteners and small actuator indicators identify it as station machinery.
    const bolt=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,.035,8),dark);bolt.rotation.x=Math.PI/2;bolt.position.set(Math.cos(angle+.065)*outer,Math.sin(angle+.065)*outer,-.15);root.add(bolt);
  }
  ring(outer-.1,.018,cyan,-.13);
  layoutOrbitalIris(root,1.4);return root;
}
export function layoutOrbitalIris(root:THREE.Group,radius:number):void {
  root.getObjectByName('aperture')!.scale.setScalar(radius);
  for(let i=0;i<8;i++) {
    const petal=root.getObjectByName(`petal-${i}`) as THREE.Mesh;
    const positions=petal.geometry.attributes.position as THREE.BufferAttribute;
    for(let row=0;row<2;row++)for(let step=0;step<=12;step++) {
      const a=i*Math.PI/4+(Math.PI/4+.003)*step/12;
      const r=row===0?radius:GAME_TUNING.iris.outerRadius;
      positions.setXYZ(row*13+step,Math.cos(a)*r,Math.sin(a)*r,-.025);
    }
    positions.needsUpdate=true;
  }
}
