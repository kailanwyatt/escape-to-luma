/** Input/phase sampling, not a human difficulty rating. Optional baseline JSON comparison. */
import {readFileSync,writeFileSync} from 'node:fs';
import {getCampaignLevel} from '../src/campaign/levels';
import type {CampaignLevelDefinition} from '../src/campaign/types';
import {campaignEncounterStart} from '../src/campaign/EncounterStart';
import {AimSystem} from '../src/projectile/AimSystem';
import {ObstacleSlot} from '../src/obstacles/ObstacleSlot';
import {Target} from '../src/target/Target';
import {predictShot} from '../src/debug/ShotDiagnostics';
import {GAME_TUNING} from '../src/game/gameTuning';
const aim=new AimSystem(), target=new Target(), slots=[new ObstacleSlot('A'),new ObstacleSlot('B')];
const phases=[.07,.23,.43,.61,.81,.97];
const levels=[44,68,86].map(n=>getCampaignLevel(n)!);
const batches:{name:string;levels:CampaignLevelDefinition[]}[]=[];
if(process.argv[2]) batches.push({name:'before',levels:JSON.parse(readFileSync(process.argv[2],'utf8'))});
batches.push({name:'after',levels});
const results=[];
for(const batch of batches) for(const l of batch.levels){
  target.applyConfig(l.challenge.target);
  let wins=0,trials=0,targetHits=0;const witnesses=[];const obstacleHits=[0,0];
  for(const phase of phases){
    const start=campaignEncounterStart(l.challenge,()=>phase);let witness;
    for(let wait=0;wait<=6;wait+=.5){
      slots.forEach((o,i)=>{o.applyConfig(start.obstacles[i],l.challenge.environment);o.update(0,start.offset+wait);});
      for(let x=-.28;x<=.281;x+=.02) for(let y=-.14;y<=.241;y+=.02){
        if(Math.hypot(x,y)<.03)continue;
        aim.begin(195,600);aim.move(195+x*390,600+y*844);
        const p=predictShot(GAME_TUNING.projectile.startPosition,aim.end(),slots,target,start.offset+wait,1,{windX:l.windX,gravityScale:l.gravityScale,wells:l.gravityWells},start.offset+wait);
        trials++;
        if(p.target.verdict==='MISS')continue;
        targetHits++;
        p.rotors.forEach((o,i)=>{if(o.verdict==='HIT')obstacleHits[i]++;});
        if(p.rotors.some(o=>o.verdict==='HIT'))continue;
        wins++;witness??={phase,wait,drag:[Number(x.toFixed(3)),Number(y.toFixed(3))]};
      }
    }
    witnesses.push(witness??{phase,failed:true});
  }
  const row={batch:batch.name,level:l.levelNumber,wins,trials,targetHits,obstacleHits,witnesses};results.push(row);console.log(JSON.stringify(row));
}
slots.forEach(o=>o.dispose());target.dispose();
writeFileSync('/tmp/spark-precision-benchmarks.json',JSON.stringify(results,null,2));
if(results.some(r=>r.witnesses.some(w=>'failed'in w)))process.exitCode=1;
