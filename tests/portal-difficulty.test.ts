import {describe,it,expect} from 'vitest';
import {getCampaignLevel,getPlayableCampaignLevels} from '../src/campaign/levels';
import {applyPortalDifficulty} from '../src/campaign/PortalDifficulty';
import {WORLD2_SAMPLE_LEVELS} from '../src/campaign/levels/world2';
import {isRotorConfig} from '../src/config/ObstacleConfig';
import {GAME_TUNING} from '../src/game/gameTuning';
describe('campaign portal precision progression',()=>{
  it('visibly reduces the City introduction shown in the user screenshot',()=>{
    const original=WORLD2_SAMPLE_LEVELS[0];const tuned=getCampaignLevel(16)!;
    expect(tuned.challenge.target.radius).toBe(.86);
    expect(tuned.challenge.target.radius/original.challenge.target.radius).toBeLessThan(.72);
    expect(original.challenge.target.radius).toBe(1.22);
    expect(tuned.challenge.target.x).toBe(original.challenge.target.x);
    expect(tuned.challenge.target.z).toBe(original.challenge.target.z);
  });
  it('covers multiple worlds while preserving opening and rotor challenge sizes',()=>{
    const tuned=getPlayableCampaignLevels().filter(level=>level.challenge.target.radius<1);
    expect(new Set(tuned.map(level=>level.worldId)).size).toBeGreaterThanOrEqual(8);
    for(const level of getPlayableCampaignLevels()){
      expect(level.challenge.target.radius).toBeGreaterThanOrEqual(GAME_TUNING.target.minRadius);
      if(level.levelNumber<=7 || level.challenge.obstacles.some(isRotorConfig))expect(applyPortalDifficulty(level)).toBe(level);
    }
  });
});
