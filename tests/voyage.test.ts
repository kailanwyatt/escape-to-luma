import {describe,it,expect} from 'vitest';
import {voyageReward,nextVoyageMilestone} from '../src/progression/voyage';
import {RunManager} from '../src/game/RunManager';

describe('Endless Voyage progression',()=>{
 it('banks 24 shards per eight clears, with new goals after each milestone',()=>{
  expect(voyageReward(0)).toBe(0);
  expect(Array.from({length:8},(_,i)=>voyageReward(i+1)).reduce((a,b)=>a+b,0)).toBe(24);
  expect(voyageReward(9)).toBe(2);
  expect(voyageReward(16)).toBe(10);
  expect(nextVoyageMilestone(0)).toBe(8);
  expect(nextVoyageMilestone(7)).toBe(8);
  expect(nextVoyageMilestone(8)).toBe(16);
 });
 it('ends after three misses, preserving earned clears and XP',()=>{
  const run=new RunManager();run.reset();run.applyResult('HIT',100);
  const xp=run.runXp;
  expect(run.applyResult('MISS',0).runOver).toBe(false);
  expect(run.applyResult('ROTOR_HIT',0).runOver).toBe(false);
  expect(run.applyResult('MISS',0).runOver).toBe(true);
  expect(run.challengesCleared).toBe(1);expect(run.runXp).toBe(xp);
  run.reset();expect(run.lives).toBe(3);expect(run.challengesCleared).toBe(0);
 });
 it('restores full hearts on a rewarded continue',()=>{
  const run=new RunManager();run.reset();
  run.applyResult('MISS',0);run.applyResult('MISS',0);run.applyResult('MISS',0);
  expect(run.lives).toBe(0);
  run.grantContinue();
  expect(run.lives).toBe(3);
  expect(run.hasUsedRewardedContinue).toBe(true);
 });
});
