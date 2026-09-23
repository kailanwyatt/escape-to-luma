import type { RotorVisualVariant } from '../config/RotorConfig';
import {isRotorConfig} from '../config/ObstacleConfig';
import type {WorldId,CampaignLevelDefinition} from './types';

const LEGACY_LOOK: Record<string, RotorVisualVariant> = {
  containment: 'containmentSecurity',
  lockdown: 'containmentSecurity',
  city: 'cityVentilation',
  ascent: 'skyTurbine',
  storm: 'skyTurbine',
  upper_atmosphere: 'atmosphereAntenna',
  orbit: 'orbitSolarArray',
  orbital_graveyard: 'orbitSolarArray',
  moon: 'moonMiningDrill',
  far_side: 'moonMiningDrill',
  asteroid_belt: 'asteroidWreckage',
  drift: 'asteroidWreckage',
  nebula: 'nebulaEnergy',
  the_null: 'nebulaEnergy',
  false_home: 'nebulaEnergy',
  ancient_network: 'ancientMechanism',
  the_machine: 'ancientMechanism',
  the_signal: 'lumaEnergy',
  homeward: 'lumaEnergy',
  luma: 'lumaEnergy',
};

export const WORLD_ROTOR_VARIANTS: Record<WorldId, RotorVisualVariant> = {
  containment: 'containmentSecurity',
  lockdown: 'containmentSecurity',
  city: 'cityVentilation',
  ascent: 'skyTurbine',
  storm: 'skyTurbine',
  sky: 'skyTurbine',
  upper_atmosphere: 'atmosphereAntenna',
  atmosphere: 'atmosphereAntenna',
  orbit: 'orbitSolarArray',
  orbital_graveyard: 'orbitSolarArray',
  moon: 'moonMiningDrill',
  far_side: 'moonMiningDrill',
  asteroid_belt: 'asteroidWreckage',
  drift: 'asteroidWreckage',
  asteroid: 'asteroidWreckage',
  nebula: 'nebulaEnergy',
  the_null: 'nebulaEnergy',
  false_home: 'nebulaEnergy',
  ancient_network: 'ancientMechanism',
  the_machine: 'ancientMechanism',
  network: 'ancientMechanism',
  the_signal: 'lumaEnergy',
  homeward: 'lumaEnergy',
  luma: 'lumaEnergy',
};

export function applyWorldRotorVariants(level: CampaignLevelDefinition): CampaignLevelDefinition {
  const variant = WORLD_ROTOR_VARIANTS[level.worldId] ?? LEGACY_LOOK[level.worldId] ?? 'containmentSecurity';
  return {
    ...level,
    challenge: {
      ...level.challenge,
      obstacles: level.challenge.obstacles.map((o) =>
        isRotorConfig(o) ? { ...o, visualVariant: o.visualVariant ?? variant } : o,
      ),
    },
  };
}
