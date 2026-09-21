import {t} from '../../i18n';
import {WORLD_REFLECTOR_VARIANTS} from '../../reflectors/ReflectorConfig';
import data from './ricochetCourses.json';
import type {CampaignLevelDefinition} from '../types';
import type {RicochetConfig} from '../../reflectors/ReflectorConfig';
import type {ObstacleConfig} from '../../config/ObstacleConfig';
const hints:Record<number,string>={1:t("ricochetcourses.aim_at_the_cyan_panel_follow_the_bounce"),2:t("ricochetcourses.a_different_angle_a_different_route"),3:t("ricochetcourses.hit_the_smaller_reflective_face"),4:t("ricochetcourses.predict_where_the_panel_will_be"),5:t("ricochetcourses.bank_around_the_blocker"),6:t("ricochetcourses.plan_two_bounces_before_you_release")};
export function applyRicochetCourse(level:CampaignLevelDefinition):CampaignLevelDefinition {
 const course=(data as Record<string,unknown>)[level.levelNumber] as {ricochet:RicochetConfig;target:CampaignLevelDefinition['challenge']['target'];obstacles:ObstacleConfig[];stage:number}|undefined;
 if(!course)return level;
 return {...level,windX:0,gravityScale:1,gravityWells:undefined,tutorialHint:hints[course.stage],challenge:{...level.challenge,ricochet:{...course.ricochet,reflectors:course.ricochet.reflectors.map(r=>({...r,visualVariant:r.visualVariant??WORLD_REFLECTOR_VARIANTS[level.worldId as keyof typeof WORLD_REFLECTOR_VARIANTS]}))},target:course.target,obstacles:course.obstacles,template:'COMBINED_HAZARD'}};
}
