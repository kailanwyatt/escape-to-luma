import {afterEach,describe,expect,it,vi} from 'vitest';
import {devLevelsUnlocked,setDevLevelsUnlocked} from '../src/config/devAccess';
import {canStartLevel} from '../src/campaign/CampaignPlay';
import {emptySave} from '../src/persistence/GameSave';
afterEach(()=>{setDevLevelsUnlocked(false);vi.unstubAllGlobals();});
describe('development level access',()=>{
 it('bypasses locks without changing the save and restores locks when disabled',()=>{
  vi.stubGlobal('__DEV__',true);const save=emptySave(),before=JSON.stringify(save);
  expect(canStartLevel(save.campaign,150).reason).toBe('locked');setDevLevelsUnlocked(true);
  expect(canStartLevel(save.campaign,150).ok).toBe(true);expect(JSON.stringify(save)).toBe(before);
  setDevLevelsUnlocked(false);expect(canStartLevel(save.campaign,150).reason).toBe('locked');
 });
 it('cannot enable the override in a production build',()=>{
  vi.stubGlobal('__DEV__',false);setDevLevelsUnlocked(true);expect(devLevelsUnlocked()).toBe(false);
 });
});
