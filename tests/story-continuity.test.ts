import {describe,it,expect} from 'vitest';
import {storyAfterWorld,pendingWorldStory,storyForLevel} from '../src/campaign/StoryMoments';
import {WORLDS,journeyDestinationLabel} from '../src/campaign/worlds';
import {getCampaignLevel} from '../src/campaign/levels';
describe('story continuity',()=>{
 it('keeps the destination unresolved until The Key is cleared',()=>{
 expect(journeyDestinationLabel(['ancient_network'],false)).toBe('UNKNOWN');
 expect(journeyDestinationLabel(['homeward'],false)).toBe('HOME');
 expect(journeyDestinationLabel(['luma'],false)).toBe('HOME');
 for(const w of WORLDS.filter(w=>w.id!=='the_machine'&&w.id!=='the_signal'&&w.id!=='homeward'&&w.id!=='luma')){
  expect(storyAfterWorld(w.lastLevel,[])!.body).not.toContain('Luma');
 }
 expect(storyAfterWorld(120,[])!.body).toContain('relay');
 expect(storyAfterWorld(135,[])!.body).toContain('Luma');
 });
 it('provides one independently acknowledged exit for each world',()=>{
 for(const w of WORLDS){const s=storyAfterWorld(w.lastLevel,[])!;expect(s.body.length).toBeGreaterThan(60);expect(storyAfterWorld(w.lastLevel,[s.id])).toBeNull();}
 expect(storyAfterWorld(57,[])).toBeNull();
 });
 it('recovers an unread completed milestone without revealing an unearned one',()=>{
 const def=getCampaignLevel(120)!;const progress={[def.id]:{cleared:true}};
 expect(pendingWorldStory(121,[],{})).toBeNull();
 const s=pendingWorldStory(121,[],progress)!;expect(s.id).toBe('departure.false_home.v1');
 expect(pendingWorldStory(121,[s.id],progress)).toBeNull();
 expect(storyForLevel(121,[s.id])!.body).not.toContain('Luma');
 expect(pendingWorldStory(135,[],progress)).toBeNull();
 const last=getCampaignLevel(150)!;expect(pendingWorldStory(150,[],{[last.id]:{cleared:true}})!.visual).toBe('reunion');
 });
 it('explains the transfer facility and preserves free exploration after reunion',()=>{
 expect(storyForLevel(46,[])!.body).toContain('transfer facility');
 const end=storyAfterWorld(150,[])!;expect(end.visual).toBe('reunion');expect(end.instruction).toContain('freely');
 });
});
