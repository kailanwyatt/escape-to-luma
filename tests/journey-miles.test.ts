import {describe,it,expect} from 'vitest';
import {formatMiles,milesAtWorldEnd,milesTraveled} from '../src/campaign/journeyMiles';
import {applyLevelSuccess} from '../src/campaign/CampaignPlay';
import {getCampaignLevel} from '../src/campaign/levels';
import {emptySave} from '../src/persistence/GameSave';

describe('journey miles',()=>{
 it('starts at zero and grows as Spark clears levels farther from the vessel',()=>{
  expect(milesTraveled(emptySave().campaign)).toBe(0);
  let save=emptySave();
  for(let n=1;n<=8;n++)save=applyLevelSuccess(save,getCampaignLevel(n)!,'CLEAR',0).save;
  expect(milesTraveled(save.campaign)).toBe(milesAtWorldEnd('containment'));
  for(let n=9;n<=15;n++)save=applyLevelSuccess(save,getCampaignLevel(n)!,'CLEAR',0).save;
  expect(milesTraveled(save.campaign)).toBe(milesAtWorldEnd('lockdown'));
  expect(milesTraveled(save.campaign)).toBeGreaterThan(50);
 });
 it('reaches the lunar mark after the Moon chapter and formats large distances',()=>{
  let save=emptySave();
  for(let n=1;n<=83;n++)save=applyLevelSuccess(save,getCampaignLevel(n)!,'CLEAR',0).save;
  expect(milesTraveled(save.campaign)).toBe(238_900);
  expect(formatMiles(238_900)).toBe('238,900');
  expect(formatMiles(540_000_000)).toBe('540,000,000');
 });
});
