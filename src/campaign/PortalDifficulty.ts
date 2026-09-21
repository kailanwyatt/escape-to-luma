import type {CampaignLevelDefinition} from './types';
import {isRotorConfig} from '../config/ObstacleConfig';

/** Visible aperture and scoring radius stay identical. Preserve teaching levels,
 * rotor timing challenges and the final safe arrival; tune precision elsewhere. */
export function applyPortalDifficulty(level: CampaignLevelDefinition): CampaignLevelDefinition {
  if(level.levelNumber<=7 || level.challenge.obstacles.some(isRotorConfig) || level.challenge.template==='HOME_FINALE') return level;
  const stage=Math.floor((level.levelNumber-1)/15);
  let radius=stage===0?.90:stage<=2?.86:stage<=5?.82:.78;
  // Avoid stacking the smallest aperture with multiple hazards or gravity wells.
  if(level.challenge.obstacles.length>1 || (level.gravityWells?.length ?? 0)>0)radius=Math.max(radius,.92);
  radius=Math.min(radius,level.challenge.target.radius);
  return {...level,challenge:{...level.challenge,target:{...level.challenge.target,radius}}};
}
