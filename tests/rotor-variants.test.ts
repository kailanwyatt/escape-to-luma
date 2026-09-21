import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {WORLD_ROTOR_VARIANTS,applyWorldRotorVariants} from '../src/campaign/RotorWorldVariants';
import {createRotorVisual} from '../src/obstacles/RotorVisuals';
import {RotorObstacle} from '../src/obstacles/RotorObstacle';
import {getCampaignLevel,getPlayableCampaignLevels} from '../src/campaign/levels';
import {isRotorConfig} from '../src/config/ObstacleConfig';
import {GAME_TUNING} from '../src/game/gameTuning';
import {disposeObject3D} from '../src/obstacles/RotorGeometry';
const variants=Object.values(WORLD_ROTOR_VARIANTS);

describe('world rotor variants',()=>{
 it('preserves arm bounds and spacing for all 30 variant/count combinations',()=>{
  for(const variant of variants)for(const count of [1,2,3]){
   const visual=createRotorVisual('workshop',count,variant);
   const arms=visual.children.filter(o=>o.name==='security-arm');expect(arms).toHaveLength(count);
   arms.forEach((arm,i)=>{
    expect(arm.rotation.z).toBeCloseTo(i/count*Math.PI*2);
    const body=arm.getObjectByName('collision-arm')!;expect(body.scale.y).toBe(GAME_TUNING.rotor.bladeWidth);
    // Inspect decorative vertices in arm-local space, not merely the main mesh.
    arm.updateMatrixWorld(true);
    const inv=arm.matrixWorld.clone().invert();
    arm.traverse(o=>{if(!(o instanceof THREE.Mesh))return;
     const points=o.geometry.getAttribute('position');const v=new THREE.Vector3();
     for(let j=0;j<points.count;j++){
      v.fromBufferAttribute(points,j).applyMatrix4(o.matrixWorld).applyMatrix4(inv);
      expect(Math.abs(v.y)).toBeLessThanOrEqual(GAME_TUNING.rotor.bladeWidth/2+0.001);
      expect(v.x).toBeGreaterThanOrEqual(GAME_TUNING.rotor.hubRadius-0.001);
      expect(v.x).toBeLessThanOrEqual(GAME_TUNING.rotor.hubRadius+GAME_TUNING.rotor.bladeLength+0.001);
     }
    });
   });disposeObject3D(visual);
  }
 });
 it('has identical simulation, crossing and prediction across variants, directions and depths',()=>{
  for(const count of [1,2,3])for(const direction of [1,-1] as const)for(const z of [6,9]){
   let baseline:string|undefined;
   for(const visualVariant of variants){
    const r=new RotorObstacle('test');r.applyConfig({bladeCount:count,rotationSpeed:.62,direction,z,initialRotation:1.1,visualVariant},'workshop');
    const predicted=r.predictState(.5,0);for(let i=0;i<60;i++)r.update(1/120,(i+1)/120);
    expect(r.angle).toBeCloseTo(predicted.angle);
    const result=JSON.stringify([r.angle,r.predictState(.3,.5),r.testProjectileCrossing(new THREE.Vector3(.6,3,z-.1),new THREE.Vector3(.6,3,z+.1),.22)]);
    baseline??=result;expect(result).toBe(baseline);disposeObject3D(r.group);
   }
  }
 });
 it('uses world defaults but preserves explicit overrides',()=>{
  for(const level of getPlayableCampaignLevels())for(const o of level.challenge.obstacles)if(isRotorConfig(o))expect(o.visualVariant).toBe(WORLD_ROTOR_VARIANTS[level.worldId]);
  const level=getCampaignLevel(4)!;
  const custom={...level,challenge:{...level.challenge,obstacles:[{...level.challenge.obstacles[0],visualVariant:'lumaEnergy' as const}]}};
  expect(applyWorldRotorVariants(custom).challenge.obstacles[0]).toMatchObject({visualVariant:'lumaEnergy'});
 });
 it('rebuilds a changed variant and disposes the previous resources',()=>{
  const r=new RotorObstacle('swap');const config={bladeCount:2,rotationSpeed:.4,direction:1 as const,z:6};
  r.applyConfig({...config,visualVariant:'cityVentilation'},'rooftop');const old=r.group.children[0];let disposed=0;
  old.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.addEventListener('dispose',()=>disposed++);});
  r.applyConfig({...config,visualVariant:'skyTurbine'},'rooftop');expect(r.group.children[0]).not.toBe(old);expect(disposed).toBeGreaterThan(0);disposeObject3D(r.group);
 });
});
