import {describe,it,expect} from 'vitest';
import {getCampaignLevel} from '../src/campaign/levels';
import {applyPrecisionBenchmark} from '../src/campaign/levels/PrecisionBenchmarks';
import {campaignEncounterStart} from '../src/campaign/EncounterStart';
import {AimSystem} from '../src/projectile/AimSystem';
import {ObstacleSlot} from '../src/obstacles/ObstacleSlot';
import {Target} from '../src/target/Target';
import {predictShot} from '../src/debug/ShotDiagnostics';
import {GAME_TUNING} from '../src/game/gameTuning';

// Reachable normalized touch inputs at six deterministic encounter phases.
const phases=[.07,.23,.43,.61,.81,.97];
const witnesses:Record<number,number[][]>={
  44:[[0,-.12,-.1],[0,-.12,-.06],[3,-.1,-.1],[0,-.12,-.1],[0,-.08,-.08],[0,-.06,-.08]],
  68:[[0,.12,.18],[.5,.1,.18],[0,.1,.18],[0,.08,.16],[1,.12,.18],[0,.1,.18]],
  86:[[0,.06,.06],[0,.06,.06],[0,.08,.1],[0,.06,.06],[0,.08,.1],[1,.08,.12]],
};
describe('precision benchmark routes',()=>{
  for(const n of [44,68,86]) it(`level ${n} remains reachable across six starts with phone touch input`,()=>{
    const level=getCampaignLevel(n)!;
    const aim=new AimSystem(), target=new Target(), slots=[new ObstacleSlot('A'),new ObstacleSlot('B')];
    try {
      target.applyConfig(level.challenge.target);
      phases.forEach((phase,i)=>{
        const start=campaignEncounterStart(level.challenge,()=>phase);
        const [wait,x,y]=witnesses[n][i];
        slots.forEach((o,j)=>{o.applyConfig(start.obstacles[j],level.challenge.environment);o.update(0,start.offset+wait);});
        for(const [width,height] of [[390,844],[430,932]]){
          aim.setScreenSize(width,height);aim.begin(width/2,height*.7);aim.move(width/2+x*width,height*.7+y*height);
          const p=predictShot(GAME_TUNING.projectile.startPosition,aim.end(),slots,target,start.offset+wait,1,{windX:level.windX,gravityScale:level.gravityScale,wells:level.gravityWells},start.offset+wait);
          expect(p.target.verdict,`phase ${phase}, width ${width}`).not.toBe('MISS');
          expect(p.rotors.some(o=>o.verdict==='HIT'),`phase ${phase}, width ${width}`).toBe(false);
        }
      });
    } finally {slots.forEach(o=>o.dispose());target.dispose();}
  });
  it('leaves levels outside the requested scope untouched',()=>{
    for(let n=1;n<=150;n++) if(![44,68,86].includes(n)){
      const level=getCampaignLevel(n)!;expect(applyPrecisionBenchmark(level)).toBe(level);
    }
  });
});
