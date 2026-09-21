import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {gateStateAtTime,shutterStateAtTime,type RapidShutterConfig} from '../src/obstacles/RapidShutterState';
import {SlidingGateObstacle} from '../src/obstacles/SlidingGateObstacle';
import type {SlidingGateConfig} from '../src/config/ObstacleConfig';
const config:SlidingGateConfig={type:'slidingGate',movementMode:'rapidShutter',shutter:{pattern:'standard'},z:5,baseX:0,baseY:3,openingWidth:2,openingHeight:3,amplitude:0,speed:0};
describe('rapid security shutter',()=>{
 it('has a repeatable closed/open/warning/slam cycle and distinct easing',()=>{
  expect([.2,.6,1,1.6,1.8].map(t=>shutterStateAtTime({},t).phase)).toEqual(['CLOSED','OPENING','OPEN','WARNING','SLAMMING_CLOSED']);
  expect(shutterStateAtTime({},.45+.175).fraction).toBeCloseTo(.875);
  expect(shutterStateAtTime({},1.7+.1).fraction).toBeCloseTo(.875);
  expect(shutterStateAtTime({},.2+1.9).fraction).toBe(shutterStateAtTime({},.2).fraction);
 });
 it('uses exact plane crossing time, not the last rendered state',()=>{
  const o=new SlidingGateObstacle('s');o.applyConfig(config,'rooftop');o.update(0,1);
  const a=new THREE.Vector3(0,3,4),b=new THREE.Vector3(0,3,6);
  expect(o.testProjectileCrossing(a,b,.22,2.1,.4)?.hit).toBe('gate');
  expect(o.evaluateAt(0,3,.22,o.predictState(.9,1)).hit).toBe('gate');
  expect(o.testProjectileCrossing(a,b,.22,1.2,.4)?.hit).toBeNull();
  expect(o.evaluateAt(.76,3,.22,o.predictState(0,1)).nearMiss).toBe(true);
 });
 it('leaves housing stationary and keeps panel edges on the calculated opening',()=>{
  const o=new SlidingGateObstacle('s');o.applyConfig(config,'rooftop');
  const fixed=o.group.getObjectByName('FixedHousing')!,positions=fixed.children.map(c=>c.position.toArray());
  for(const t of [.2,.5,1,1.6,1.85]){
   o.update(0,t);const state=gateStateAtTime(config,t);
   expect(fixed.children.map(c=>c.position.toArray())).toEqual(positions);
   expect(o.group.getObjectByName('ShutterLeft')!.position.x+.5).toBeCloseTo(-state.width/2);
   expect(o.group.getObjectByName('ShutterRight')!.position.x-.5).toBeCloseTo(state.width/2);
  }
 });
 it('supports every preset and vertical/asymmetric opening bounds',()=>{
  for(const pattern of ['standard','quickWindow','longTease','doublePulse','fakeout','asymmetric'] as const){
   const r:RapidShutterConfig={pattern,orientation:'vertical',maxOpeningWidth:2.5};
   for(let t=0;t<12;t+=.07){const s=gateStateAtTime({...config,shutter:r},t);expect(s.height).toBeGreaterThanOrEqual(0);expect(s.height).toBeLessThanOrEqual(2.5);expect(s.width).toBe(2);}
  }
 });
 it('emits phase hooks once per transition, never once per frame',()=>{
  const o=new SlidingGateObstacle('s'),events:string[]=[];o.applyConfig(config,'rooftop');o.onShutterEvent=e=>events.push(e);
  for(let i=1;i<=200;i++)o.update(.01,i*.01);
  expect(events).toEqual(['gate_open_start','gate_open_complete','gate_warning','gate_slam_start','gate_slam_impact']);
 });
 it('preserves the legacy sliding trajectory',()=>{
  const c={...config,movementMode:'oscillating' as const,amplitude:.7,speed:.5};
  expect(gateStateAtTime(c,2).x).toBeCloseTo(Math.sin(1)*.7);expect(gateStateAtTime(c,2).width).toBe(2);
 });
});
