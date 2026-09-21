/** Read-only campaign sampling, not a human playtest or proof of complete solvability. */
import {writeFileSync} from 'node:fs';
import {getPlayableCampaignLevels} from '../src/campaign/levels';
import {campaignEncounterStart} from '../src/campaign/EncounterStart';
import {AimSystem} from '../src/projectile/AimSystem';
import {ObstacleSlot} from '../src/obstacles/ObstacleSlot';
import {Target} from '../src/target/Target';
import {predictShot} from '../src/debug/ShotDiagnostics';
import {GAME_TUNING} from '../src/game/gameTuning';
const aim=new AimSystem(),target=new Target(),slots=[new ObstacleSlot('A'),new ObstacleSlot('B')];
const drags:Array<[number,number]>=[];
for(const x of [0,-.06,.06,-.12,.12])for(const y of [-.04,.04,.08,.12,.18,.24])drags.push([x,y]);
drags.push([-.22,0],[-.24,0]);
const phases=[0,.13,.27,.41,.58,.72,.86,.99];
const results:Array<{level:number;world:string;target:ReturnType<typeof getPlayableCampaignLevels>[number]['challenge']['target'];obstacles:string[];wins:number[]}>=[];
for(const level of getPlayableCampaignLevels()){
 target.applyConfig(level.challenge.target);
 const wins=drags.map(()=>0);
 for(const phase of phases){
  const start=campaignEncounterStart(level.challenge,()=>phase);
  slots.forEach((o,i)=>{if(start.obstacles[i])o.applyConfig(start.obstacles[i],level.challenge.environment);else o.hide();o.update(0,start.offset);});
  drags.forEach(([x,y],index)=>{
   aim.begin(195,600);aim.move(195+x*390,600+y*844);
   const prediction=predictShot(GAME_TUNING.projectile.startPosition,aim.end(),slots,target,start.offset,1,{windX:level.windX,gravityScale:level.gravityScale,wells:level.gravityWells},start.offset,level.challenge.ricochet);
   if(prediction.target.verdict!=='MISS'&&prediction.rotors.every(o=>o.verdict!=='HIT')&&!prediction.ricochetBlocked)wins[index]++;
  });
 }
 results.push({level:level.levelNumber,world:level.worldId,target:level.challenge.target,obstacles:level.challenge.obstacles.map(o=>o.type??'rotor'),wins});
}
slots.forEach(o=>o.dispose());
const global=drags.map((drag,i)=>({drag,any:results.filter(r=>r.wins[i]>0).length,robust:results.filter(r=>r.wins[i]>=6).length,all:results.filter(r=>r.wins[i]===8).length})).sort((a,b)=>b.robust-a.robust);
const summary=Array.from({length:10},(_,w)=>{const rows=results.slice(w*15,w*15+15);return {world:w+1,bestFixed:drags.map((drag,i)=>({drag,levels:rows.filter(r=>r.wins[i]>=6).map(r=>r.level)})).sort((a,b)=>b.levels.length-a.levels.length)[0],anyRobust:rows.filter(r=>Math.max(...r.wins)>=6).length};});
writeFileSync('/tmp/spark-shot-reuse.json',JSON.stringify({drags,phases,results,global,summary},null,2));
console.log(JSON.stringify({top:global.slice(0,5),worlds:summary},null,2));

let longestRun=0;
for(let i=0;i<drags.length;i++){let run=0;for(const row of results){run=row.level>=16&&row.wins[i]>=6?run+1:0;longestRun=Math.max(longestRun,run);}}
if(longestRun>2||summary.some(w=>w.world>1&&w.bestFixed.levels.length>6)){console.error('Repeated-shot regression', {longestRun});process.exitCode=1;}
console.log('Longest sampled repeat-shot run after tutorial:',longestRun);
