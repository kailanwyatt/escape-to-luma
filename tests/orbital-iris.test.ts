import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {createOrbitalIris,layoutOrbitalIris} from '../src/obstacles/OrbitalIrisVisual';
import {evaluateIrisCollision} from '../src/obstacles/ObstacleCollision';
import {disposeObject3D} from '../src/obstacles/RotorGeometry';
describe('orbital iris visible boundary',()=>{
 it('places the shutter and illuminated inner edge at the collision opening throughout its travel',()=>{
  const root=createOrbitalIris();
  const petal=root.getObjectByName('petal-0') as THREE.Mesh;
  const buffer=petal.geometry.attributes.position;
  for(const radius of [.25,.6,1.4,2]){
   layoutOrbitalIris(root,radius);
   expect(petal.geometry.attributes.position).toBe(buffer);
   for(let i=0;i<8;i++){
    const pos=(root.getObjectByName(`petal-${i}`) as THREE.Mesh).geometry.attributes.position;
    for(let j=0;j<=12;j++)expect(Math.hypot(pos.getX(j),pos.getY(j))).toBeCloseTo(radius,6);
   }
   expect(root.getObjectByName('aperture')!.scale.x).toBe(radius);
   expect(evaluateIrisCollision(radius-.22-.001,0,.22,0,0,radius).hit).toBeFalsy();
   expect(evaluateIrisCollision(radius-.22+.001,0,.22,0,0,radius).hit).toBe('iris');
  }
  disposeObject3D(root);
 });
});
