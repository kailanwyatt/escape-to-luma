import {describe,it,expect} from 'vitest';
import {getPlayableCampaignLevels,getCampaignLevel} from '../src/campaign/levels';
import {composeCampaignLevel} from '../src/campaign/levels/LevelComposition';
import {validateChallenge} from '../src/challenge/ChallengeValidator';
import {estimateDifficulty} from '../src/challenge/difficulty';

// Ignore IDs, prose, phases and tuning increments: uniqueness must come from layout.
function layoutSignature(level: ReturnType<typeof getPlayableCampaignLevels>[number]) {
  return JSON.stringify({ target:[level.challenge.target.x,level.challenge.target.y], ricochet:level.challenge.ricochet, obstacles:level.challenge.obstacles.map(o=>{
    const {z,...shape}=o;
    return JSON.parse(JSON.stringify(shape),(key,value)=>['speed','rotationSpeed','initialRotation','phase','phaseOffset','pulseSpeed','shiftSpeed','minRadius','maxRadius','radius','openingWidth','openingHeight'].includes(key)?undefined:value);
  }) });
}

describe('authored campaign compositions',()=>{
  it('has no repeated layouts within any world, ignoring speed and portal size',()=>{
    const levels=getPlayableCampaignLevels();
    for(let world=0;world<10;world++){
      const layouts=levels.slice(world*15,world*15+15).map(layoutSignature);
      expect(new Set(layouts).size,`world ${world+1}`).toBe(15);
    }
  });
  it('keeps every route legal and physically reachable',()=>{
    for(const level of getPlayableCampaignLevels()){
      expect(validateChallenge(level.challenge,Math.max(level.challenge.difficulty,estimateDifficulty(level.challenge)),{windX:level.windX,gravityScale:level.gravityScale,wells:level.gravityWells}),`L${level.levelNumber}`).toBeNull();
    }
  });
  it('preserves source definitions and keeps the safe final arrival',()=>{
    const source=getCampaignLevel(37)!;const before=JSON.stringify(source);
    composeCampaignLevel(source);expect(JSON.stringify(source)).toBe(before);
    expect(getCampaignLevel(150)!.challenge.obstacles).toHaveLength(0);
    for(const n of [147,149])expect(getCampaignLevel(n)!.challenge.obstacles).toHaveLength(2);
    for(const n of [146,148]){const gates=getCampaignLevel(n)!.challenge.obstacles;expect(gates).toHaveLength(3);expect(gates.every(o=>o.type==='iris')).toBe(true);}
  });
  it('introduces Sky paths alone before paired timing encounters',()=>{
    const first=[31,32,33].map(n=>getCampaignLevel(n)!.challenge.obstacles);
    expect(first.every(o=>o.length===1)).toBe(true);
    expect(first.map(o=>o[0].type==='movingRing'?o[0].movement.type:null)).toEqual(['horizontal','vertical','ellipse']);
    for(let n=38;n<=45;n++)expect(getCampaignLevel(n)!.challenge.obstacles).toHaveLength(2);
    expect(Math.abs(getCampaignLevel(45)!.windX!)).toBeGreaterThan(Math.abs(getCampaignLevel(31)!.windX!));
  });
});
