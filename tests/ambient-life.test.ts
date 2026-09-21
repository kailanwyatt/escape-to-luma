import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {AmbientLife} from '../src/environment/AmbientLife';
import {disposeThreeObject} from '../src/utils/disposeThree';
describe('ambient life',()=>{
 it('moves with elapsed time, freezes at zero dt and keeps object counts bounded',()=>{
  const source=new THREE.Group(),a=new AmbientLife(),b=new AmbientLife();a.setWorld('orbit',source);b.setWorld('orbit',source);
  const count=a.group.children.length;
  for(let i=0;i<600;i++)a.update(1/60,false);
  for(let i=0;i<300;i++)b.update(1/30,false);
  const x=a.group.getObjectByName('background-maintenance-drone')!,y=b.group.getObjectByName('background-maintenance-drone')!;
  expect(x.position.distanceTo(y.position)).toBeLessThan(1e-8);const before=x.position.clone();a.update(0,false);expect(x.position.equals(before)).toBe(true);
  expect(a.group.children.length).toBe(count);a.setWorld('orbit',source);expect(a.group.children.length).toBe(count);
  disposeThreeObject(a.group);disposeThreeObject(b.group);
 });
 it('drifts asteroids outside their authored boundary and freezes them with Reduced Motion',()=>{
  const source=new THREE.Group(),rock=new THREE.Group();rock.position.set(-5.3,3,12);rock.userData.ambientAsteroid=true;source.add(rock);
  const a=new AmbientLife();a.setWorld('asteroid',source);const start=rock.position.clone();
  for(let i=0;i<600;i++){a.update(.1,false);expect(rock.position.x).toBeLessThanOrEqual(-5.3);expect(Math.abs(rock.position.y-3)).toBeLessThanOrEqual(.55);}
  expect(rock.position.distanceTo(start)).toBeGreaterThan(.1);
  const frozen=rock.position.clone();a.update(0,false);expect(rock.position.equals(frozen)).toBe(true);
  a.update(0,true);expect(rock.position.toArray()).toEqual([-5.3,3,12]);a.update(.1,true);expect(rock.position.toArray()).toEqual([-5.3,3,12]);disposeThreeObject(a.group);
 });
 it('removes transient comet motion and fixes twinkle brightness with Reduced Motion',()=>{
  const a=new AmbientLife();a.setWorld('orbit',new THREE.Group());for(let i=0;i<80;i++)a.update(.1,false);
  expect(a.group.getObjectByName('distant-comet')!.visible).toBe(true);a.update(0,true);expect(a.group.getObjectByName('distant-comet')!.visible).toBe(false);
  const star=a.group.getObjectByName('twinkling-stars') as THREE.Points;expect((star.material as THREE.ShaderMaterial).uniforms.motion.value).toBe(0);
  const drone=a.group.getObjectByName('background-maintenance-drone')!;const p=drone.position.clone();a.update(1,true);expect(drone.position.equals(p)).toBe(true);disposeThreeObject(a.group);
 });
 it('changes ambient actors by world and restores clouds under Reduced Motion',()=>{
  const source=new THREE.Group(),cloud=new THREE.Group();cloud.position.x=8;cloud.userData.ambientCloud=true;source.add(cloud);
  const a=new AmbientLife();a.setWorld('sky',source);a.update(.1,false);expect(cloud.position.x).not.toBe(8);a.update(0,true);expect(cloud.position.x).toBe(8);
  a.setWorld('homeward',new THREE.Group());expect(a.group.getObjectByName('background-maintenance-drone')).toBeUndefined();expect(a.group.getObjectByName('distant-living-light')).toBeDefined();expect(a.group.getObjectByName('distant-comet')).toBeUndefined();disposeThreeObject(a.group);
 });
});
