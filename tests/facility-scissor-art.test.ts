import {expect,it} from 'vitest';
import * as THREE from 'three';
import {FacilityScissorArt} from '../src/obstacles/FacilityScissorArt';
import {evaluateScissorGateCollision,scissorGateStateAtTime} from '../src/obstacles/ScissorGateState';
import type {ScissorGateConfig} from '../src/config/ObstacleConfig';

const c: ScissorGateConfig = {
  type: 'scissorGate',
  z: 6,
  centerX: 0,
  centerY: 4.2,
  barLength: 1.65,
  barThickness: 0.09,
  minAngle: 0.42,
  maxAngle: 0.85,
  speed: 0.55,
};

it('keeps pincer details inside the authoritative bar capsules',()=>{
 const art=new FacilityScissorArt(c),p=new THREE.Vector3();
 for(const t of [0,.5,1.2,2.5,4,7]){
  art.update(t);art.group.updateMatrixWorld(true);
  const s=scissorGateStateAtTime(c,t);
  expect(art.group.getObjectByName('hinge-eye')!.position.x).toBeCloseTo(s.centerX);
  expect(art.group.getObjectByName('hinge-eye')!.position.y).toBeCloseTo(s.centerY);
  art.group.traverse(o=>{
   if(!(o instanceof THREE.Mesh) || !o.geometry)return;
   const v=o.geometry.getAttribute('position');
   for(let j=0;j<v.count;j+=3){
    p.fromBufferAttribute(v,j).applyMatrix4(o.matrixWorld);
    expect(evaluateScissorGateCollision(c,t,p.x,p.y,0).clearance).toBeLessThanOrEqual(.004);
   }
  });
 }
 art.dispose();expect(art.group.children).toHaveLength(0);
});
