import {WORLD_REFLECTOR_VARIANTS} from '../../reflectors/ReflectorConfig';
import data from './ricochetCourses.json';
import type {CampaignLevelDefinition} from '../types';
import type {RicochetConfig} from '../../reflectors/ReflectorConfig';
import type {ObstacleConfig} from '../../config/ObstacleConfig';
const hints:Record<number,string>={1:'AIM AT THE CYAN PANEL · FOLLOW THE BOUNCE',2:'A DIFFERENT ANGLE · A DIFFERENT ROUTE',3:'HIT THE SMALLER REFLECTIVE FACE',4:'PREDICT WHERE THE PANEL WILL BE',5:'BANK AROUND THE BLOCKER',6:'PLAN TWO BOUNCES BEFORE YOU RELEASE'};
export function applyRicochetCourse(level:CampaignLevelDefinition):CampaignLevelDefinition {
 const course=(data as Record<string,unknown>)[level.levelNumber] as {ricochet:RicochetConfig;target:CampaignLevelDefinition['challenge']['target'];obstacles:ObstacleConfig[];stage:number}|undefined;
 if(!course)return level;
 return {...level,windX:0,gravityScale:1,gravityWells:undefined,tutorialHint:hints[course.stage],challenge:{...level.challenge,ricochet:{...course.ricochet,reflectors:course.ricochet.reflectors.map(r=>({...r,visualVariant:r.visualVariant??WORLD_REFLECTOR_VARIANTS[level.worldId as keyof typeof WORLD_REFLECTOR_VARIANTS]}))},target:course.target,obstacles:course.obstacles,template:'COMBINED_HAZARD'}};
}
