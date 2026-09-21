import {Target} from '../src/target/Target';
import {predictShot} from '../src/debug/ShotDiagnostics';
import {AimSystem} from '../src/projectile/AimSystem';
import {describe,it,expect} from 'vitest';
import {campaignEncounterStart} from '../src/campaign/EncounterStart';
import {getCampaignLevel} from '../src/campaign/levels';
import {ObstacleSlot} from '../src/obstacles/ObstacleSlot';
import {isRotorConfig} from '../src/config/ObstacleConfig';

describe('campaign encounter starts',()=>{
  it('varies the initial pose before the first update without mutating authored levels',()=>{
    for(const number of [3,4,9,11,12]){
      const def=getCampaignLevel(number)!;const original=JSON.stringify(def);
      const poses=[.07,.31,.68,.94].map(seed=>{
        const start=campaignEncounterStart(def.challenge,()=>seed);
        const slot=new ObstacleSlot('test');slot.applyConfig(start.obstacles[0],def.challenge.environment);slot.update(0,start.offset);
        const prediction=slot.predictState(0,start.offset);slot.dispose();return JSON.stringify(prediction);
      });
      expect(new Set(poses).size).toBeGreaterThan(1);expect(JSON.stringify(def)).toBe(original);
    }
  });
  it('keeps the stationary opening tutorials fixed',()=>{
    for(const level of [1,2])expect(campaignEncounterStart(getCampaignLevel(level)!.challenge,()=>.9).offset).toBe(0);
  });
  it('samples live and predicted laser geometry at the same randomized clock',()=>{
    const def=getCampaignLevel(9)!;
    for(const seed of [.03,.22,.57,.81]){
      const start=campaignEncounterStart(def.challenge,()=>seed);
      const slot=new ObstacleSlot('test');slot.applyConfig(start.obstacles[0],def.challenge.environment);slot.update(0,start.offset);
      const predicted=slot.predictState(.5,start.offset);
      slot.update(.5,start.offset+.5);const live=slot.predictState(0,start.offset+.5);
      expect(predicted).toEqual(live);slot.dispose();
    }
  });
  it('predicts moving portals with their own clock rather than the randomized obstacle clock',()=>{
    const target=new Target();target.applyConfig({x:0,y:3,radius:1.12,movement:{type:'horizontal',amplitude:.5,speed:.8}});
    const start={x:0,y:.6,z:0},velocity={vx:0,vy:5,vz:9};
    const baseline=predictShot(start,velocity,[],target,2,1,{},2);
    const randomized=predictShot(start,velocity,[],target,97,.4,{},2);
    expect(randomized.target).toEqual(baseline.target);target.dispose();
  });
  it('keeps the smaller laser portals reachable across varied starting phases',()=>{
    for(const number of [9,11]) for(const seed of [.04,.28,.63,.91]){
      const def=getCampaignLevel(number)!;const encounter=campaignEncounterStart(def.challenge,()=>seed);
      const slots=encounter.obstacles.map((config,i)=>{const slot=new ObstacleSlot(String(i));slot.applyConfig(config,def.challenge.environment);return slot;});
      const target=new Target();target.applyConfig(def.challenge.target);
      let found=false;
      for(let wait=0;wait<10&&!found;wait+=.5) for(let pull=16;pull<=64&&!found;pull+=8) for(let horizontal=-32;horizontal<=32&&!found;horizontal+=8){
        const aim=new AimSystem();aim.setScreenSize(390,844);aim.begin(195,500);aim.move(195+horizontal,500+pull);
        const prediction=predictShot({x:0,y:.6,z:0},aim.end(),slots,target,encounter.offset+wait,1,{},wait);
        found=prediction.rotors.every(rotor=>rotor.verdict!=='HIT') && prediction.target.verdict!=='MISS';
      }
      expect(found,`L${number} start=${seed}`).toBe(true);slots.forEach(slot=>slot.dispose());target.dispose();
    }
  });
  it('limits the smaller portal experiment to non-rotor levels',()=>{
    for(const level of [9,11]){
      const def=getCampaignLevel(level)!;expect(def.challenge.obstacles.some(isRotorConfig)).toBe(false);
      expect(def.challenge.target.radius).toBeLessThan(1.12);
    }
    expect(getCampaignLevel(1)!.challenge.target.radius).toBe(1.18);
    expect(getCampaignLevel(4)!.challenge.target.radius).toBe(1.28);
  });
});
