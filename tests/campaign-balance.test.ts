import {describe,it,expect} from 'vitest';
import {getPlayableCampaignLevels,getCampaignLevel} from '../src/campaign/levels';
import {rebalanceCampaign} from '../src/campaign/levels/CampaignBalance';
describe('campaign balance revision',()=>{
 it('requires a different landing position between most successive challenges',()=>{
  const levels=getPlayableCampaignLevels().filter(l=>l.levelNumber>=16&&l.levelNumber<150);
  const disjoint=levels.slice(1).filter((l,i)=>{const a=levels[i].challenge.target,b=l.challenge.target;return Math.hypot(a.x-b.x,a.y-b.y)>a.radius+b.radius;});
  expect(disjoint.length/(levels.length-1)).toBeGreaterThan(.8);
 });
 it('retains tutorial definitions and safe arrival without mutating input',()=>{
  for(const n of [1,2,3,4,5,6,7,150]){const source=getCampaignLevel(n)!;expect(rebalanceCampaign(source)).toBe(source);}
  const source=getCampaignLevel(91)!;const before=JSON.stringify(source);rebalanceCampaign(source);expect(JSON.stringify(source)).toBe(before);
  expect(getCampaignLevel(150)!.challenge.obstacles).toHaveLength(0);
 });
});
