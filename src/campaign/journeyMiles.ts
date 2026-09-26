import {WORLDS} from './worlds';
import {getCampaignLevel} from './levels';
import type {WorldId} from './types';
import type {CampaignSave} from '../persistence/GameSave';

/**
 * Flavor distance Spark has covered from the vessel toward Luma.
 * Escalates from city streets to deep space so the map feels like a long trek home.
 */
const MILES_AT_WORLD_END: Record<WorldId, number> = {
  containment: 18,
  lockdown: 64,
  city: 420,
  ascent: 4_800,
  storm: 22_000,
  upper_atmosphere: 68_000,
  orbit: 175_000,
  orbital_graveyard: 210_000,
  moon: 238_900,
  far_side: 320_000,
  asteroid_belt: 2_450_000,
  drift: 9_200_000,
  nebula: 48_000_000,
  the_null: 110_000_000,
  false_home: 165_000_000,
  ancient_network: 245_000_000,
  the_machine: 360_000_000,
  the_signal: 470_000_000,
  homeward: 530_000_000,
  luma: 540_000_000,
  // Legacy pack ids remap through applyWorldBands; keep harmless zeros if referenced.
  sky: 22_000,
  atmosphere: 68_000,
  asteroid: 2_450_000,
  network: 360_000_000,
};

/** Cumulative miles traveled based on cleared levels along the authored route. */
export function milesTraveled(c: CampaignSave): number {
  let miles = 0;
  let previous = 0;
  for (const world of WORLDS) {
    const end = MILES_AT_WORLD_END[world.id] ?? previous;
    const span = Math.max(0, end - previous);
    const count = world.lastLevel - world.firstLevel + 1;
    let cleared = 0;
    for (let n = world.firstLevel; n <= world.lastLevel; n++) {
      const id = getCampaignLevel(n)?.id;
      if (id && c.completedLevels[id]?.cleared) cleared++;
    }
    miles += Math.round((span * cleared) / count);
    previous = end;
  }
  return miles;
}

/** Miles marked when a chapter is fully cleared (for chapter flavor copy). */
export function milesAtWorldEnd(worldId: WorldId): number {
  return MILES_AT_WORLD_END[worldId] ?? 0;
}

export function formatMiles(miles: number): string {
  return miles.toLocaleString('en-US');
}
