import {describe,it,expect} from 'vitest';
import {FIRST_ESCAPE,storyAfterWorld,storyForLevel} from '../src/campaign/StoryMoments';
import {WORLDS} from '../src/campaign/worlds';
import {ENCOUNTER_LESSONS} from '../src/campaign/levels/NewEncounters';
import {LIBRARY_LESSONS} from '../src/campaign/levels/LibraryEncounters';
import {getCampaignLevel} from '../src/campaign/levels';
import {GameState} from '../src/game/GameState';
describe('campaign story moments',()=>{
  it('recovers the unread escape story on arrival in the lab and suppresses repeats after acknowledgement',()=>{
    expect(storyForLevel(2,[])).toEqual(FIRST_ESCAPE);
    expect(storyForLevel(2,[FIRST_ESCAPE.id])).toBeNull();
    expect(storyForLevel(1,[])).toBeNull();
  });
  it('introduces each new world once without revealing Luma before The Key',()=>{
    const keyWorldIndex=WORLDS.find(w=>w.id==='the_machine')!.index;
    for(const world of WORLDS.slice(1)){
      const story=storyForLevel(world.firstLevel,[])!;
      expect(story).not.toBeNull();
      expect(story.eyebrow).toBe(`WORLD ${world.index}`);
      let seen=[story.id,...(story.acknowledgements??[])];
      // Drain optional follow-ups (library remap and/or first-mechanic cards).
      for(let i=0;i<4;i+=1){
        const next=storyForLevel(world.firstLevel,seen);
        if(!next) break;
        seen=[...seen,next.id,...(next.acknowledgements??[])];
      }
      expect(storyForLevel(world.firstLevel,seen)).toBeNull();
      if(world.index<keyWorldIndex) expect(story.body).not.toContain('Luma');
    }
  });
  it('adds instructions at key laboratory changes without interrupting every level',()=>{
    for(const level of [3,4,8,12,15]) expect(storyForLevel(level,[])?.instruction).toBeTruthy();
    // Quiet mid-containment beats (library remaps occupy 6/9/10/13/14).
    for(const level of [5,7,11]) expect(storyForLevel(level,[])).toBeNull();
    // Chapter first levels show world arrival before the library lesson.
    expect(storyForLevel(9,[])?.eyebrow).toBe('WORLD 2');
    expect(storyForLevel(9,['arrival.level-9'])?.id).toBe('encounter.9.v1');
    for(const level of [6,10,13,14]){
      expect(LIBRARY_LESSONS[level]).toBeTruthy();
      expect(storyForLevel(level,[])?.id).toBe(`encounter.${level}.v1`);
    }
  });
  it('does not accept gameplay input during a story',()=>{
    const state=new GameState();state.set('CAMPAIGN_STORY');expect(state.canAcceptInput()).toBe(false);
    state.set('READY');expect(state.canAcceptInput()).toBe(true);
  });
  it('keeps membrane and Null lesson cards aligned with what levels play',()=>{
    expect(ENCOUNTER_LESSONS[113]).toBeUndefined();
    expect(LIBRARY_LESSONS[113]?.name).toBe('The Null');
    expect(storyForLevel(113,[])?.title).toBe('The Null');
    expect(getCampaignLevel(113)!.challenge.obstacles.every(o=>o.type==='theNull')).toBe(true);
    for(const level of [129,142]){
      const story=storyForLevel(level,[])!;
      expect(story.title).toBe('Phase Membranes');
      expect(story.body.toLowerCase()).toContain('membrane');
      expect(story.body.toLowerCase()).not.toContain('sequential');
      expect(getCampaignLevel(level)!.challenge.obstacles.every(o=>o.type==='phaseGate')).toBe(true);
    }
  });
  it('hands Upper Atmosphere off into Orbit, not the graveyard or Moon',()=>{
    const exit=storyAfterWorld(60,[])!;
    expect(exit.action).toBe('ENTER ORBIT');
    expect(exit.instruction.toLowerCase()).not.toContain('graveyard');
    expect(exit.body.toLowerCase()).toContain('orbit');
    expect(exit.body.toLowerCase()).not.toContain('moon');
  });
});
