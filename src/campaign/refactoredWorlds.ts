/**
 * Target 20-chapter campaign catalog (docs/REFACTORED-WORLDS.md).
 * Current playable build remains `WORLDS` in worlds.ts until a tested migration lands.
 */

import type { HomeSignalStrength } from './types';

export type RefactoredChapterId =
  | 'containment'
  | 'lockdown'
  | 'city'
  | 'ascent'
  | 'storm'
  | 'upper_atmosphere'
  | 'orbit'
  | 'orbital_graveyard'
  | 'moon'
  | 'far_side'
  | 'asteroid_belt'
  | 'drift'
  | 'nebula'
  | 'the_null'
  | 'false_home'
  | 'ancient_network'
  | 'the_machine'
  | 'the_signal'
  | 'homeward'
  | 'luma';

export type LegacyWorldId =
  | 'containment'
  | 'city'
  | 'sky'
  | 'atmosphere'
  | 'orbit'
  | 'moon'
  | 'asteroid'
  | 'nebula'
  | 'network'
  | 'homeward';

export type RefactoredChapterDefinition = {
  id: RefactoredChapterId;
  index: number;
  name: string;
  subtitle: string;
  /** Planned core level count (not yet authored). */
  plannedLevelCount: number;
  obstacleFocus: string[];
  progressionRole: string;
  homeSignalStrength: HomeSignalStrength;
  /** Legacy world IDs that may contribute authored content to this chapter. */
  legacySources: LegacyWorldId[];
};

/** Starting plan: 8–10 per chapter, brief Luma finale. */
export const REFACTORED_CHAPTERS: RefactoredChapterDefinition[] = [
  {
    id: 'containment',
    index: 1,
    name: 'Containment',
    subtitle: 'Spark escapes the vessel; retrieval systems wake',
    plannedLevelCount: 9,
    obstacleFocus: ['rotor', 'laserGrid', 'pistonField'],
    progressionRole: 'Aim and readable timing',
    homeSignalStrength: 'faint',
    legacySources: ['containment'],
  },
  {
    id: 'lockdown',
    index: 2,
    name: 'Lockdown',
    subtitle: 'Capture checkpoints seal the route to the surface',
    plannedLevelCount: 9,
    obstacleFocus: ['reactiveGate', 'splitShutter', 'clockHands'],
    progressionRole: 'Combine two known reads',
    homeSignalStrength: 'faint',
    legacySources: ['containment'],
  },
  {
    id: 'city',
    index: 3,
    name: 'The City',
    subtitle: 'Retrieval patrols search the rooftops',
    plannedLevelCount: 9,
    obstacleFocus: ['elevatorBlocks', 'conveyorGate', 'slidingGate'],
    progressionRole: 'Lateral movement and route selection',
    homeSignalStrength: 'faint',
    legacySources: ['city'],
  },
  {
    id: 'ascent',
    index: 4,
    name: 'The Ascent',
    subtitle: 'Evade the patrols and climb toward the clouds',
    plannedLevelCount: 9,
    obstacleFocus: ['movingRing', 'scissorGate', 'wind'],
    progressionRole: 'Long-distance spatial prediction',
    homeSignalStrength: 'faint',
    legacySources: ['sky'],
  },
  {
    id: 'storm',
    index: 5,
    name: 'The Storm',
    subtitle: 'The storm swallows the search lights',
    plannedLevelCount: 9,
    obstacleFocus: ['crosswind', 'pulseRing', 'reactiveGate'],
    progressionRole: 'Introduce field timing without surprise',
    homeSignalStrength: 'faint',
    legacySources: ['sky'],
  },
  {
    id: 'upper_atmosphere',
    index: 6,
    name: 'Upper Atmosphere',
    subtitle: 'Air thins; Earth begins to fall away',
    plannedLevelCount: 9,
    obstacleFocus: ['iris', 'rollingAperture', 'solarSailShutter'],
    progressionRole: 'Precision through changing openings',
    homeSignalStrength: 'detectable',
    legacySources: ['atmosphere'],
  },
  {
    id: 'orbit',
    index: 7,
    name: 'Orbit',
    subtitle: 'Human orbital infrastructure',
    plannedLevelCount: 9,
    obstacleFocus: ['pendulum', 'debris', 'clockHands'],
    progressionRole: 'Low-gravity timing',
    homeSignalStrength: 'detectable',
    legacySources: ['orbit'],
  },
  {
    id: 'orbital_graveyard',
    index: 8,
    name: 'Orbital Graveyard',
    subtitle: 'Old containment systems glow among the wreckage',
    plannedLevelCount: 9,
    obstacleFocus: ['sequentialTunnel', 'movingSafeZone'],
    progressionRole: 'Read a multi-depth sequence',
    homeSignalStrength: 'detectable',
    legacySources: ['orbit'],
  },
  {
    id: 'moon',
    index: 9,
    name: 'The Moon',
    subtitle: 'Unfamiliar lights gather near the lunar relay',
    plannedLevelCount: 9,
    obstacleFocus: ['orbiter', 'gravityWells', 'magnetopauseSheath'],
    progressionRole: 'Curve awareness and indirect routes',
    homeSignalStrength: 'detectable',
    legacySources: ['moon'],
  },
  {
    id: 'far_side',
    index: 10,
    name: 'Far Side',
    subtitle: 'Deep space becomes unavoidable',
    plannedLevelCount: 9,
    obstacleFocus: ['lagrangeNullZone', 'corkscrewTunnel'],
    progressionRole: 'Commit to long, quiet precision',
    homeSignalStrength: 'detectable',
    legacySources: ['moon'],
  },
  {
    id: 'asteroid_belt',
    index: 11,
    name: 'Asteroid Belt',
    subtitle: 'Rock and unfamiliar life share the route',
    plannedLevelCount: 9,
    obstacleFocus: ['cometCrossing', 'accretionShredder', 'driftingBlocker'],
    progressionRole: 'Density management',
    homeSignalStrength: 'strong',
    legacySources: ['asteroid'],
  },
  {
    id: 'drift',
    index: 12,
    name: 'The Drift',
    subtitle: 'Sparse deep space',
    plannedLevelCount: 9,
    obstacleFocus: ['speedField', 'movingSafeZone'],
    progressionRole: 'Master prediction with few landmarks',
    homeSignalStrength: 'strong',
    legacySources: ['asteroid'],
  },
  {
    id: 'nebula',
    index: 13,
    name: 'The Nebula',
    subtitle: 'Familiar light hides an unfamiliar hunger',
    plannedLevelCount: 9,
    obstacleFocus: ['phaseField', 'rollingAperture', 'pulseRing'],
    progressionRole: 'Read phase and false-light cues',
    homeSignalStrength: 'strong',
    legacySources: ['nebula'],
  },
  {
    id: 'the_null',
    index: 14,
    name: 'The Null',
    subtitle: 'A light-eating presence',
    plannedLevelCount: 9,
    obstacleFocus: ['theNull'],
    progressionRole: 'Pressure without combat; escape it',
    homeSignalStrength: 'strong',
    legacySources: ['nebula'],
  },
  {
    id: 'false_home',
    index: 15,
    name: 'False Home',
    subtitle: 'A familiar beacon proves to be a relay',
    plannedLevelCount: 9,
    obstacleFocus: ['teleportingPortal', 'entryExitPortal', 'reactiveGate'],
    progressionRole: 'Verify destinations rather than chase a glow',
    homeSignalStrength: 'located',
    legacySources: ['nebula', 'network'],
  },
  {
    id: 'ancient_network',
    index: 16,
    name: 'Ancient Network',
    subtitle: 'An old transit lattice',
    plannedLevelCount: 9,
    obstacleFocus: ['shiftingAperture', 'networkTunnel'],
    progressionRole: 'Pattern literacy',
    homeSignalStrength: 'located',
    legacySources: ['network'],
  },
  {
    id: 'the_machine',
    index: 17,
    name: 'The Machine',
    subtitle: 'Traverse the mechanism, do not fight it',
    plannedLevelCount: 9,
    obstacleFocus: ['pistonField', 'clockHands', 'conveyorGate', 'splitShutter'],
    progressionRole: 'Controlled system complexity',
    homeSignalStrength: 'located',
    legacySources: ['network'],
  },
  {
    id: 'the_signal',
    index: 18,
    name: 'The Signal',
    subtitle: 'True Luma coordinates resolve',
    plannedLevelCount: 9,
    obstacleFocus: ['teleportChain', 'pulseBeam', 'sequentialTunnel'],
    progressionRole: 'Synthesis and story confirmation',
    homeSignalStrength: 'located',
    legacySources: ['homeward'],
  },
  {
    id: 'homeward',
    index: 19,
    name: 'Homeward',
    subtitle: 'The last distance',
    plannedLevelCount: 9,
    obstacleFocus: ['combined'],
    progressionRole: 'Finale mastery; no new hidden rule',
    homeSignalStrength: 'home',
    legacySources: ['homeward'],
  },
  {
    id: 'luma',
    index: 20,
    name: 'Luma',
    subtitle: 'Reunion and Endless Voyage unlock',
    plannedLevelCount: 4,
    obstacleFocus: ['ceremonial'],
    progressionRole: 'Closure and rewards',
    homeSignalStrength: 'home',
    legacySources: ['homeward'],
  },
];

export const REFACTORED_PLANNED_CORE_LEVELS = REFACTORED_CHAPTERS.reduce(
  (sum, chapter) => sum + chapter.plannedLevelCount,
  0,
);

export function refactoredChapterById(
  id: RefactoredChapterId,
): RefactoredChapterDefinition | undefined {
  return REFACTORED_CHAPTERS.find((chapter) => chapter.id === id);
}
