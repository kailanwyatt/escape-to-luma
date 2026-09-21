import * as THREE from 'three';

/** Seeded, continuous surface displacement avoids random per-vertex spikes.
 * Six reusable meshes provide silhouettes, impact bowls and mineral variation. */
export function createAsteroidGeometry(seed:number,widthSegments=48,heightSegments=32):THREE.BufferGeometry {
 let state=seed>>>0;
 const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 const phases=Array.from({length:12},()=>random()*Math.PI*2);
 const craters=Array.from({length:12},()=>{
  const y=random()*2-1,a=random()*Math.PI*2,r=Math.sqrt(1-y*y);
  return {x:Math.cos(a)*r,y,z:Math.sin(a)*r,width:.14+random()*.23,depth:.04+random()*.09};
 });
 const axes=[.8+random()*.4,.7+random()*.4,.8+random()*.4];
 const geometry=new THREE.SphereGeometry(1,widthSegments,heightSegments);
 const position=geometry.getAttribute('position');const colors=[];
 for(let i=0;i<position.count;i++){
  const x=position.getX(i),y=position.getY(i),z=position.getZ(i);
  const noise=(f:number,p:number)=>Math.sin(x*f+phases[p])*Math.sin(y*f*.93+phases[p+1])*Math.sin(z*f*1.13+phases[p+2]);
  const broad=noise(2.8,0),middle=noise(7,3),fine=noise(18,6),grain=noise(39,9);
  let relief=0;
  for(const c of craters){
   const d=Math.sqrt((x-c.x)**2+(y-c.y)**2+(z-c.z)**2)/c.width;
   if(d<1.5)relief+=-c.depth*Math.exp(-d*d*3)+c.depth*.25*Math.exp(-(((d-.95)/.2)**2));
  }
  const radius=1+.2*broad+.075*middle+.026*fine+.009*grain+relief;
  position.setXYZ(i,x*radius*axes[0],y*radius*axes[1],z*radius*axes[2]);
  const tone=THREE.MathUtils.clamp(.44+.12*middle+.075*fine+.035*grain+relief*.9,.2,.7);
  colors.push(tone*1.04,tone*.97,tone*.89);
 }
 geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 geometry.computeVertexNormals();geometry.computeBoundingSphere();
 return geometry;
}
