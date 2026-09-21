import type {ChallengeConfig} from '../config/ChallengeConfig';
import {isRotorConfig} from '../config/ObstacleConfig';

/** Choose once per attempt. A shared clock offset retains authored relationships
 * between moving gates/lasers instead of independently scrambling each beam. */
export function campaignEncounterStart(config: ChallengeConfig, random: () => number = Math.random) {
  const moving=config.obstacles.some(obstacle=>{
    if(isRotorConfig(obstacle))return obstacle.rotationSpeed!==0;
    if(obstacle.type==='slidingGate')return obstacle.appearance!=='containmentGlass' && obstacle.amplitude!==0 && obstacle.speed!==0;
    return true;
  });
  const offset=moving ? 12 + Math.max(0,Math.min(1,random()))*120 : 0;
  const obstacles=config.obstacles.map(obstacle=>{
    // Rotors integrate angle using dt; place their initial angle at the offset.
    // Other families already sample their entire motion from the shared clock.
    if(isRotorConfig(obstacle))return {...obstacle,initialRotation:(obstacle.initialRotation ?? obstacle.phase ?? 0)-obstacle.rotationSpeed*obstacle.direction*offset};
    return obstacle;
  });
  return {offset,obstacles};
}
