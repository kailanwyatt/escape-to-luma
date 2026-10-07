import {describe,expect,it} from 'vitest';
import {arcadeGames} from '../src/arcade/arcadeGames';
import {emptySave} from '../src/persistence/GameSave';

describe('Arcade catalog',()=>{
  it('lists only the existing Endless Voyage mode and keeps it separate from campaign progress',()=>{
    const save=emptySave();
    expect(arcadeGames(save)).toEqual([expect.objectContaining({id:'endlessVoyage',unlocked:false})]);
    save.campaign.campaignCompleted=true;
    expect(arcadeGames(save)).toEqual([expect.objectContaining({id:'endlessVoyage',unlocked:true})]);
  });

  it('can expose the existing Voyage game in the embedded web Arcade without changing campaign progress',()=>{
    const save=emptySave();
    expect(save.campaign.campaignCompleted).toBe(false);
    expect(arcadeGames(save,{unlockWebArcade:true})).toEqual([
      expect.objectContaining({id:'endlessVoyage',unlocked:true}),
    ]);
    expect(save.campaign.campaignCompleted).toBe(false);
  });
});
