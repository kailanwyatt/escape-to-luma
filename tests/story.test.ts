import {describe,it,expect} from 'vitest';
import {FIRST_ESCAPE,storyForLevel} from '../src/campaign/StoryMoments';
import {WORLDS} from '../src/campaign/worlds';
import {GameState} from '../src/game/GameState';
describe('campaign story moments',()=>{
  it('recovers the unread escape story on arrival in the lab and suppresses repeats after acknowledgement',()=>{
    expect(storyForLevel(2,[])).toEqual(FIRST_ESCAPE);
    expect(storyForLevel(2,[FIRST_ESCAPE.id])).toBeNull();
    expect(storyForLevel(1,[])).toBeNull();
  });
  it('introduces each new world once without revealing Luma before The Key',()=>{
    for(const world of WORLDS.slice(1)){
      const story=storyForLevel(world.firstLevel,[])!;
      expect(story).not.toBeNull();expect(story.eyebrow).toBe(`WORLD ${world.index}`);
      expect(storyForLevel(world.firstLevel,[story.id,...(story.acknowledgements??[])])).toBeNull();
      if(world.index<10) expect(story.body).not.toContain('Luma');
    }
  });
  it('adds instructions at key laboratory changes without interrupting every level',()=>{
    for(const level of [3,4,8,12,15]) expect(storyForLevel(level,[])?.instruction).toBeTruthy();
    for(const level of [5,6,7,9,10,11]) expect(storyForLevel(level,[])).toBeNull();
  });
  it('does not accept gameplay input during a story',()=>{
    const state=new GameState();state.set('CAMPAIGN_STORY');expect(state.canAcceptInput()).toBe(false);
    state.set('READY');expect(state.canAcceptInput()).toBe(true);
  });
});
