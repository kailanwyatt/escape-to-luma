import type { RotorVisualVariant } from '../config/RotorConfig';
import {isRotorConfig} from '../config/ObstacleConfig';
import type {WorldId,CampaignLevelDefinition} from './types';

export const WORLD_ROTOR_VARIANTS: Record<WorldId,RotorVisualVariant> = {
  containment:'containmentSecurity',city:'cityVentilation',sky:'skyTurbine',
  atmosphere:'atmosphereAntenna',orbit:'orbitSolarArray',moon:'moonMiningDrill',
  asteroid:'asteroidWreckage',nebula:'nebulaEnergy',network:'ancientMechanism',homeward:'lumaEnergy',
};
export function applyWorldRotorVariants(level:CampaignLevelDefinition):CampaignLevelDefinition {
  return {...level,challenge:{...level.challenge,obstacles:level.challenge.obstacles.map(o=>isRotorConfig(o)?{...o,visualVariant:o.visualVariant??WORLD_ROTOR_VARIANTS[level.worldId]}:o)}};
}
