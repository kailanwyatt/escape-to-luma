import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {getCampaignLevel} from '../src/campaign/levels';
import {createRooftopScene} from '../src/environment/RooftopScene';
import {disposeThreeObject} from '../src/utils/disposeThree';
import {storyForLevel} from '../src/campaign/StoryMoments';
describe('City production progression',()=>{
 it('teaches shutter variations before advanced combinations',()=>{
  const gates=(n:number)=>getCampaignLevel(n)!.challenge.obstacles.filter(o=>o.type==='slidingGate');
  for(let n=16;n<=30;n++)expect(gates(n).every(g=>g.movementMode==='rapidShutter')).toBe(true);
  expect(gates(16)[0].shutter!.openHold).toBeGreaterThan(.7);
  expect(gates(21)[0].shutter!.orientation).toBe('vertical');
  expect(gates(23)[0].shutter!.pattern).toBe('doublePulse');
  expect(gates(26)).toHaveLength(2);expect(gates(26)[0].z).toBeLessThan(gates(26)[1].z);
  expect(gates(28)[0].shutter!.pattern).toBe('fakeout');
  expect(storyForLevel(28,['mechanic.rapidShutter.v1'])?.body).toContain('partially close');
  expect(getCampaignLevel(1)!.challenge.obstacles[0]).not.toHaveProperty('movementMode','rapidShutter');
 });
 it('changes individual window colors slowly and freezes under Reduced Motion',()=>{
  const root=createRooftopScene(),windows=root.getObjectByName('city-activity-windows') as THREE.InstancedMesh;
  const snapshot=()=>Array.from(windows.instanceColor!.array);
  const before=snapshot();root.userData.updateWindows(30,false);expect(snapshot()).not.toEqual(before);
  const a=snapshot();root.userData.updateWindows(30.1,false);const b=snapshot();
  expect(Math.max(...a.map((v,i)=>Math.abs(v-b[i])))).toBeLessThan(.09);
  root.userData.updateWindows(30,true);const reduced=snapshot();root.userData.updateWindows(90,true);expect(snapshot()).toEqual(reduced);
  expect(windows.count).toBeGreaterThan(100);disposeThreeObject(root);
 });
});
