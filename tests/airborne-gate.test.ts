import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {createAirborneGate,layoutAirborneGate} from '../src/obstacles/AirborneGateVisual';
import {evaluateRingCollision} from '../src/obstacles/ObstacleCollision';
import {disposeObject3D} from '../src/obstacles/RotorGeometry';

describe('airborne gate collision readability',()=>{
  it('keeps all solid hardware outside the authored opening',()=>{
    const visual=createAirborneGate('rooftop');
    for(const radius of [0.8,1.18,1.4,1.8]){
      layoutAirborneGate(visual,radius);visual.updateMatrixWorld(true);
      const hardware=visual.getObjectByName('gate-hardware')!;
      hardware.traverse(object=>{
        if(!(object instanceof THREE.Mesh))return;
        const points=object.geometry.getAttribute('position');
        const point=new THREE.Vector3();
        for(let i=0;i<points.count;i++){
          point.fromBufferAttribute(points,i).applyMatrix4(object.matrixWorld);
          expect(Math.hypot(point.x,point.y)).toBeGreaterThanOrEqual(radius-0.00001);
        }
      });
      const field=visual.getObjectByName('security-field') as THREE.Mesh<THREE.PlaneGeometry,THREE.ShaderMaterial>;
      expect(field.material.uniforms.openingRadius.value).toBe(radius);
      expect(evaluateRingCollision(radius-0.23,0,0.22,0,0,radius).hit).toBeFalsy();
      expect(evaluateRingCollision(radius-0.21,0,0.22,0,0,radius).hit).toBe('ring');
    }
    disposeObject3D(visual);
    const kit = (visual as THREE.Group).userData?.kit;
    kit?.dispose?.();
  });
  it('resizes without allocating new geometry or materials',()=>{
    const visual=createAirborneGate('space');
    const resources:unknown[]=[];
    visual.traverse(o=>{if(o instanceof THREE.Mesh)resources.push(o.geometry,o.material);});
    for(let i=0;i<30;i++)layoutAirborneGate(visual,1+i/100);
    const after:unknown[]=[];
    visual.traverse(o=>{if(o instanceof THREE.Mesh)after.push(o.geometry,o.material);});
    expect(after).toEqual(resources);
    disposeObject3D(visual);
    visual.userData.kit?.dispose?.();
  });
});
