import {writeFileSync} from 'node:fs';
import {getPlayableCampaignLevels} from '../src/campaign/levels';
import {campaignEncounterStart} from '../src/campaign/EncounterStart';
import {AimSystem} from '../src/projectile/AimSystem';
import {ObstacleSlot} from '../src/obstacles/ObstacleSlot';
import {Target} from '../src/target/Target';
import {predictShot} from '../src/debug/ShotDiagnostics';
import {GAME_TUNING} from '../src/game/gameTuning';
import courses from '../src/campaign/levels/ricochetCourses.json';
const aim=new AimSystem(),target=new Target(),slots=[new ObstacleSlot('A'),new ObstacleSlot('B')];
const samples:Array<[number,number]>=[];
for(let x=-.28;x<=.281;x+=.02)for(let y=-.14;y<=.241;y+=.02)if(Math.hypot(x,y)>.03)samples.push([x,y]);
const result:Array<{level:number;phase:number;wait:number;drag:number[]}|{level:number;phase:number;failed:true}>=[];
for(const level of getPlayableCampaignLevels()){
 target.applyConfig(level.challenge.target);
 const witness=(courses as Record<string,{witness:{dragX:number;dragY:number}}>)[level.levelNumber]?.witness;
 const drags=[...(witness?[[witness.dragX,witness.dragY] as [number,number]]:[]),...samples.slice().sort((a,b)=>Math.abs(a[0]+level.challenge.target.x*.09)+Math.abs(a[1]-.03)-Math.abs(b[0]+level.challenge.target.x*.09)-Math.abs(b[1]-.03))];
 for(const phase of [.07,.43,.81]){
  const encounter=campaignEncounterStart(level.challenge,()=>phase);let found=false;
  for(const wait of [0,1,2,3,4,5,6]){
   slots.forEach((o,i)=>{if(encounter.obstacles[i])o.applyConfig(encounter.obstacles[i],level.challenge.environment);else o.hide();o.update(wait,encounter.offset+wait);});
   for(const [x,y] of drags){
    aim.begin(195,600);aim.move(195+x*390,600+y*844);
    const p=predictShot(GAME_TUNING.projectile.startPosition,aim.end(),slots,target,encounter.offset+wait,1,{windX:level.windX,gravityScale:level.gravityScale,wells:level.gravityWells},encounter.offset+wait,level.challenge.ricochet);
    if(p.target.verdict!=='MISS'&&p.rotors.every(o=>o.verdict!=='HIT')&&!p.ricochetBlocked){result.push({level:level.levelNumber,phase,wait,drag:[x,y]});found=true;break;}
   }
   if(found)break;
  }
  if(!found)result.push({level:level.levelNumber,phase,failed:true});
 }
}
slots.forEach(o=>o.dispose());
const failed=result.filter(r=>'failed'in r);writeFileSync('/tmp/spark-campaign-inputs.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({checked:result.length,failed},null,2));if(failed.length)process.exitCode=1;
