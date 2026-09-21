import {journeyProgress} from './journeyProgress';
import {EMPTY_CAMPAIGN,type PersistentGameData} from '../persistence/GameSave';
import type {PrecisionRank} from './types';
const count=(n:unknown)=>typeof n==='number'&&Number.isFinite(n)?Math.max(0,Math.floor(n)):0;
export const formatStat=(n:number)=>count(n).toLocaleString();
/** Read-only dashboard projection; historical arcade counters are never relabeled as campaign data. */
export function statsSummary(save:PersistentGameData){
 const c={...EMPTY_CAMPAIGN,...save.campaign,completedLevels:save.campaign?.completedLevels??{},unlockedWorldIds:save.campaign?.unlockedWorldIds??['containment']};
 const journey=journeyProgress(c),stats=c.stats,p=save.playerProgress;
 const precision:Record<PrecisionRank,number>={CLEAR:0,GREAT:0,BULLSEYE:0,PERFECT:0};
 for(const world of journey.worlds)for(const l of world.levels){if(l.progress?.cleared){const rank=l.progress.bestRank;if(rank in precision)precision[rank]++;}}
 const worldsCleared=journey.worlds.filter(w=>w.state==='completed').length;
 const shards={earned:count(stats?.shardsEarned),available:count(c.shards)};
 const runs={count:count(p?.totalRuns),longest:count(p?.longestRun),streak:count(p?.bestStreak),score:count(p?.highestScore),shots:count(p?.totalShotsCleared),closeCalls:count(p?.totalCloseCalls),bullseyes:count(p?.totalBullseyes),perfects:count(p?.totalPerfects)};
 const showRuns=c.campaignCompleted||c.endlessUnlockedDev||Object.values(runs).some(n=>n>0);
 const milestones:{label:string;value:number;icon:string;color:string}[]=[];
 if(worldsCleared)milestones.push({label:'Worlds cleared',value:worldsCleared,icon:'◈',color:'#ffd080'});
 if(shards.earned)milestones.push({label:'Shards earned',value:shards.earned,icon:'◆',color:'#c5a0ff'});
 if(runs.longest)milestones.push({label:'Longest run',value:runs.longest,icon:'↗',color:'#7ef0ff'});
 if(runs.streak)milestones.push({label:'Best streak',value:runs.streak,icon:'◎',color:'#7ef0ff'});
 if(precision.PERFECT&&milestones.length<4)milestones.push({label:'Perfect levels',value:precision.PERFECT,icon:'◉',color:'#c5a0ff'});
 if(journey.cleared&&milestones.length<4)milestones.push({label:'Levels cleared',value:journey.cleared,icon:'✓',color:'#7ef0ff'});
 return {journey,worldsCleared,percent:Math.round(journey.cleared/journey.total*100),precision,shards,runs,showRuns,milestones,activity:{attempts:count(stats?.totalAttempts),failures:count(stats?.failures),closeCalls:count(stats?.closeCalls)}};
}
