import {WORLDS} from './worlds';
import {getCampaignLevel} from './levels';
import type {CampaignSave} from '../persistence/GameSave';
export type WorldCardState='completed'|'current'|'unlocked'|'locked';
/** Derived menu data only; campaign saves and start-level validation remain authoritative. */
export function journeyProgress(c:CampaignSave,devUnlockAll=false){
 const current=WORLDS.find(w=>c.highestUnlockedLevel>=w.firstLevel&&c.highestUnlockedLevel<=w.lastLevel)?.id;
 const worlds=WORLDS.map(world=>{
  const levels=Array.from({length:world.lastLevel-world.firstLevel+1},(_,i)=>{
   const number=world.firstLevel+i,definition=getCampaignLevel(number)!;
   const progress=c.completedLevels[definition.id];
   return {number,progress,available:devUnlockAll||number<=c.highestUnlockedLevel};
  });
  const cleared=levels.filter(l=>l.progress?.cleared).length;
  const perfect=levels.filter(l=>l.progress?.cleared&&l.progress.bestRank==='PERFECT').length;
  const unlocked=devUnlockAll||c.unlockedWorldIds.includes(world.id);
  const state:WorldCardState=cleared===levels.length?'completed':!unlocked?'locked':world.id===current?'current':'unlocked';
  return {world,levels,cleared,perfect,unlocked,state};
 });
 return {worlds,cleared:worlds.reduce((n,w)=>n+w.cleared,0),total:worlds.reduce((n,w)=>n+w.levels.length,0),currentIndex:Math.max(0,worlds.findIndex(w=>w.state==='current')),destination:c.campaignCompleted||c.unlockedWorldIds.includes('homeward')?'LUMA':'UNKNOWN'};
}
