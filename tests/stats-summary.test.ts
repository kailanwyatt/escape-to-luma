import {describe,it,expect} from 'vitest';
import {statsSummary,formatStat} from '../src/campaign/statsSummary';
import {emptySave,migrateSaveData} from '../src/persistence/GameSave';
import {applyLevelSuccess} from '../src/campaign/CampaignPlay';
import {getCampaignLevel} from '../src/campaign/levels';
describe('Stats dashboard',()=>{
 it('handles a fresh player without irrelevant arcade cards or fake milestones',()=>{
  const s=statsSummary(emptySave());expect(s.journey.cleared).toBe(0);expect(s.worldsCleared).toBe(0);expect(s.percent).toBe(0);
  expect(s.showRuns).toBe(false);expect(s.milestones).toEqual([]);expect(Object.values(s.precision)).toEqual([0,0,0,0]);
 });
 it('counts unique campaign levels and their best precision, not repeated successes',()=>{
  let save=emptySave();for(let n=1;n<=15;n++)save=applyLevelSuccess(save,getCampaignLevel(n)!,'GREAT',0).save;
  save=applyLevelSuccess(save,getCampaignLevel(1)!,'PERFECT',2).save;
  const s=statsSummary(save);expect(s.journey.cleared).toBe(15);expect(s.percent).toBe(10);expect(s.worldsCleared).toBe(1);
  expect(s.precision).toEqual({CLEAR:0,GREAT:14,BULLSEYE:0,PERFECT:1});expect(s.activity.attempts).toBe(16);expect(s.activity.closeCalls).toBe(2);expect(s.showRuns).toBe(false);
 });
 it('preserves distinct wallet, earnings and historical arcade records',()=>{
  const save=emptySave();save.campaign.shards=420;save.campaign.stats.shardsEarned=1149;
  Object.assign(save.playerProgress,{totalRuns:11,highestScore:2583,longestRun:14,bestStreak:14,totalShotsCleared:27});
  save.lifetimeStats.workshopClears=100;const before=JSON.stringify(save),s=statsSummary(save);
  expect(s.shards).toEqual({earned:1149,available:420});expect(s.runs).toMatchObject({count:11,score:2583,longest:14,streak:14,shots:27});
  expect(s.showRuns).toBe(true);expect(s.worldsCleared).toBe(0);expect(JSON.stringify(save)).toBe(before);expect(formatStat(1149)).toBe((1149).toLocaleString());
 });
 it('shows completion and replay mastery from a complete save',()=>{
  let save=emptySave();for(let n=1;n<=150;n++)save=applyLevelSuccess(save,getCampaignLevel(n)!,'CLEAR',0).save;
  const s=statsSummary(save);expect(s.percent).toBe(100);expect(s.worldsCleared).toBe(10);expect(s.precision.CLEAR).toBe(150);expect(s.showRuns).toBe(true);
 });
 it('accepts a migrated prototype save and absent optional counters',()=>{
  const migrated=migrateSaveData(1,{playerProgress:{...emptySave().playerProgress,totalRuns:7}});
  expect(statsSummary(migrated).runs.count).toBe(7);
  const save=emptySave();Object.assign(save.campaign.stats,{shardsEarned:undefined,totalAttempts:NaN});Object.assign(save.playerProgress,{highestScore:Infinity});
  const s=statsSummary(save);expect(s.shards.earned).toBe(0);expect(s.activity.attempts).toBe(0);expect(s.runs.score).toBe(0);
 });
});
