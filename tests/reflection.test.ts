import {describe,it,expect} from 'vitest';
import {reflectVelocity,reflectorHit,stepRicochet} from '../src/reflectors/Reflection';
import type {ReflectorConfig} from '../src/reflectors/ReflectorConfig';
const panel:ReflectorConfig={id:'a',position:{x:0,y:0,z:0},normal:{x:0,y:1,z:0},width:4,height:4};
describe('stationary reflection foundation',()=>{
 it('reflects exactly and preserves speed',()=>{const v=reflectVelocity({x:1,y:-1,z:0},panel.normal);expect(v).toEqual({x:1,y:1,z:0});expect(Math.hypot(v.x,v.y,v.z)).toBeCloseTo(Math.sqrt(2));});
 it('hits only the marked face, rejects misses and marks backing as solid',()=>{
 expect(reflectorHit({x:0,y:1,z:0},{x:0,y:-1,z:0},panel,0,1,.22)?.reflective).toBe(true);
 expect(reflectorHit({x:4,y:1,z:0},{x:4,y:-1,z:0},panel,0,1,.22)).toBeNull();
 expect(reflectorHit({x:0,y:-1,z:0},{x:0,y:1,z:0},panel,0,1,.22)?.reflective).toBe(false);
 });
 it('treats backing-side entry as solid without a bounce',()=>{
 const c:ReflectorConfig={...panel,normal:{x:0,y:0,z:1},width:2,height:2};
 expect(reflectorHit({x:2,y:0,z:-.1},{x:0,y:0,z:-.1},c,0,1,.22)?.reflective).toBe(false);
 });
 it('continues the outgoing segment with one bounce',()=>{const state={x:0,y:1,z:0,vx:1,vy:-2,vz:0};const status={bounces:0,blocked:false};stepRicochet(state,1,0,{gravityScale:0},{reflectors:[panel],maxBounces:1,requiredBounces:1},status,.22);expect(status.bounces).toBe(1);expect(state.vy).toBe(2);expect(state.y).toBeGreaterThan(.22);});
});
