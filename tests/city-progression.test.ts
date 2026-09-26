import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {getCampaignLevel} from '../src/campaign/levels';
import {createRooftopScene} from '../src/environment/RooftopScene';
import {disposeThreeObject} from '../src/utils/disposeThree';
import {storyForLevel} from '../src/campaign/StoryMoments';
import {gateStateAtTime,shutterTimeline} from '../src/obstacles/RapidShutterState';
describe('City production progression',()=>{
 it('teaches shutter variations before advanced combinations',()=>{
  const gates=(n:number)=>getCampaignLevel(n)!.challenge.obstacles.filter(o=>o.type==='slidingGate');
  for(let n=16;n<=30;n++){
   const g=gates(n);
   if(g.length)expect(g.every(gate=>gate.movementMode==='rapidShutter')).toBe(true);
  }
  expect(gates(16)[0].shutter!.openHold).toBeGreaterThan(.7);
  expect(gates(23)[0].shutter!.pattern).toBe('doublePulse');
  expect(gates(26)).toHaveLength(2);expect(gates(26)[0].z).toBeLessThan(gates(26)[1].z);
  // Dual shutters stay phase-synced for a mid-speed spark; hard-coded 0.48 left L26 with no dual cyan OPEN.
  const [near,far]=gates(26),flightDt=(far.z-near.z)/8.5;
  const cycle=shutterTimeline(near.shutter!).reduce((sum,beat)=>sum+beat.duration,0);
  const synced=(((near.shutter!.phaseOffset??0)-flightDt)%cycle+cycle)%cycle;
  expect(Math.abs((far.shutter!.phaseOffset??0)-synced)).toBeLessThan(.01);
  expect(near.shutter!.openHold).toBeGreaterThan(.5);
  let dualOpen=0;
  for(let t0=0;t0<cycle;t0+=.02){
   if(gateStateAtTime(near,t0).shutter?.phase==='OPEN'&&gateStateAtTime(far,t0+flightDt).shutter?.phase==='OPEN')dualOpen++;
  }
  expect(dualOpen).toBeGreaterThan(10);
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
