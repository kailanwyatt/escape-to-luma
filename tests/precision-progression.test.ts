import {describe,it,expect} from 'vitest';
import {getCampaignLevel} from '../src/campaign/levels';
import {applyPrecisionProgression} from '../src/campaign/levels/PrecisionProgression';
describe('campaign precision rollout safeguards',()=>{
  it('preserves introductions, approved benchmarks, L28 and safe reunion',()=>{
    for(let n=1;n<=150;n++) {
      if(n<=7||(n-1)%15<3||[28,44,68,86,150].includes(n)) {
        const level=getCampaignLevel(n)!;
        expect(applyPrecisionProgression(level)).toBe(level);
      }
    }
  });
  it('does not mutate sources, save identities, rewards or bank-shot geometry',()=>{
    for(let n=1;n<=150;n++) {
      const level=getCampaignLevel(n)!,before=JSON.stringify(level),next=applyPrecisionProgression(level);
      expect(JSON.stringify(level)).toBe(before);
      expect(next.id).toBe(level.id);
      expect(next.worldId).toBe(level.worldId);
      expect(next.isWorldFinale).toBe(level.isWorldFinale);
      expect(next.challenge.target.radius).toBeGreaterThanOrEqual(.78);
      if(level.challenge.ricochet) {
        expect(next.challenge.ricochet).toEqual(level.challenge.ricochet);
        expect(next.challenge.obstacles).toEqual(level.challenge.obstacles);
        expect(next.challenge.target.x).toBe(level.challenge.target.x);
        expect(next.challenge.target.y).toBe(level.challenge.target.y);
      }
    }
  });
});
