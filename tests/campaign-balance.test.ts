import {describe,it,expect} from 'vitest';
import {getPlayableCampaignLevels,getCampaignLevel} from '../src/campaign/levels';
import {rebalanceCampaign} from '../src/campaign/levels/CampaignBalance';
describe('campaign balance revision',()=>{
 it('alternates landing regions in the standard precision progression',()=>{
  const levels=getPlayableCampaignLevels().filter(l=>l.levelNumber>=16&&l.levelNumber<150);
  // Bank shots and dedicated mechanic lessons have authored destinations; their
  // uniqueness is checked separately in campaign-composition.test.ts.
  const pairs=levels.slice(1).map((l,i)=>[levels[i],l]).filter(pair=>pair.every(l=>!l.challenge.ricochet&&!l.challenge.tags?.includes('new-encounter')&&!l.challenge.tags?.includes('library-encounter')));
  expect(pairs.length).toBeGreaterThan(25);
  const disjoint=pairs.filter(([previous,l])=>{const a=previous.challenge.target,b=l.challenge.target;return Math.hypot(a.x-b.x,a.y-b.y)>a.radius+b.radius;});
  expect(disjoint.length/pairs.length).toBeGreaterThan(.8);
 });
 it('retains tutorial definitions and safe arrival without mutating input',()=>{
  for(const n of [1,2,3,4,5,6,7,150]){const source=getCampaignLevel(n)!;expect(rebalanceCampaign(source)).toBe(source);}
  const source=getCampaignLevel(91)!;const before=JSON.stringify(source);rebalanceCampaign(source);expect(JSON.stringify(source)).toBe(before);
  expect(getCampaignLevel(150)!.challenge.obstacles).toHaveLength(0);
 });
});
