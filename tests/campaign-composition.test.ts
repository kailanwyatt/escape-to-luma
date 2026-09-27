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
    for (const n of [147, 148, 149]) {
      const level = getCampaignLevel(n)!;
      expect(level.worldId).toBe('luma');
      expect(level.challenge.obstacles).toHaveLength(1);
      expect(level.challenge.obstacles[0].type).toBe('iris');
      expect(level.windX ?? 0).toBe(0);
      expect(level.gravityWells ?? []).toHaveLength(0);
    }
    // L146 is homeward mastery (EncounterProgression tunnel) before Luma ceremony.
    const homewardFinale = getCampaignLevel(146)!;
    expect(homewardFinale.worldId).toBe('homeward');
    expect(homewardFinale.challenge.obstacles.length).toBeGreaterThanOrEqual(2);
  });
  it('keeps Ascent library remaps isolated before paired timing encounters', () => {
    expect(getCampaignLevel(32)!.challenge.obstacles).toHaveLength(1);
    expect(getCampaignLevel(32)!.challenge.obstacles[0].type).toBe('groundCutLasers');
    expect(getCampaignLevel(33)!.challenge.obstacles).toHaveLength(1);
    expect(getCampaignLevel(33)!.challenge.obstacles[0].type).toBe('movingRing');
    expect(getCampaignLevel(40)!.challenge.obstacles[0].type).toBe('pulseRing');
    expect(Math.abs(getCampaignLevel(45)!.windX!)).toBeGreaterThan(Math.abs(getCampaignLevel(31)!.windX!));
  });
  it('keeps Upper Atmosphere mastery on iris and climb rings, not city gates', () => {
    const mastery = [57, 59, 60].map((n) => getCampaignLevel(n)!);
    for (const level of mastery) {
      expect(level.worldId).toBe('upper_atmosphere');
      const types = level.challenge.obstacles.map((o) => o.type);
      expect(types).toContain('iris');
      expect(types).toContain('movingRing');
      expect(types).not.toContain('slidingGate');
      expect(types).not.toContain('driftingBlocker');
      expect(types).not.toContain('solarSail');
    }
    expect(getCampaignLevel(47)!.challenge.obstacles[0].type).toBe('rollingAperture');
  });
});
