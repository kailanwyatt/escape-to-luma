import {describe,it,expect} from 'vitest';
import {journeyProgress} from '../src/campaign/journeyProgress';
import {applyLevelSuccess} from '../src/campaign/CampaignPlay';
import {getCampaignLevel} from '../src/campaign/levels';
import {emptySave} from '../src/persistence/GameSave';
describe('Journey menu selectors',()=>{
 it('shows ten worlds with accurate locks and one current world',()=>{
  const data=journeyProgress(emptySave().campaign);
  expect(data.worlds).toHaveLength(10);expect(data.total).toBe(150);expect(data.cleared).toBe(0);
  expect(data.worlds[0].state).toBe('current');expect(data.worlds.slice(1).every(w=>w.state==='locked')).toBe(true);
  expect(data.destination).toBe('UNKNOWN');
 });
 it('derives mastery, completion and the next world from actual level records',()=>{
  let save=emptySave();for(let n=1;n<=15;n++)save=applyLevelSuccess(save,getCampaignLevel(n)!,'PERFECT',0).save;
  const data=journeyProgress(save.campaign);
  expect(data.cleared).toBe(15);expect(data.worlds[0]).toMatchObject({state:'completed',cleared:15,perfect:15});
  expect(data.worlds[1].state).toBe('current');expect(data.currentIndex).toBe(1);
  expect(data.worlds[1].levels.filter(l=>l.available)).toHaveLength(1);
 });
 it('does not fake completion when developer access is enabled or the finale is skipped to',()=>{
  const save=emptySave(),before=JSON.stringify(save);const data=journeyProgress(save.campaign,true);
  expect(data.worlds.every(w=>w.unlocked&&w.levels.every(l=>l.available))).toBe(true);
  expect(data.cleared).toBe(0);expect(JSON.stringify(save)).toBe(before);
  const final=applyLevelSuccess(save,getCampaignLevel(150)!,'CLEAR',0).save;
  expect(journeyProgress(final.campaign).cleared).toBe(1);
  expect(journeyProgress(final.campaign).destination).toBe('LUMA');
 });
 it('keeps all completed worlds replayable without inventing a current world',()=>{
  let save=emptySave();for(let n=1;n<=150;n++)save=applyLevelSuccess(save,getCampaignLevel(n)!,'CLEAR',0).save;
  const data=journeyProgress(save.campaign);
  expect(data.cleared).toBe(150);expect(data.worlds.every(w=>w.state==='completed'&&w.unlocked)).toBe(true);
  expect(data.destination).toBe('LUMA');
 });
});
