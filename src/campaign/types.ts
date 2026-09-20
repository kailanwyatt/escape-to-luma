import type { ChallengeConfig } from '../config/ChallengeConfig';
import type { BoostId } from '../config/economy';

export type WorldId =
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

export type HomeSignalStrength = 'faint' | 'detectable' | 'strong' | 'located' | 'home';

export type PrecisionRank = 'CLEAR' | 'GREAT' | 'BULLSEYE' | 'PERFECT';

export type LevelProgress = {
  bestRank: PrecisionRank;
  bestScore: number;
  attempts: number;
  cleared: boolean;
  rewardsGranted: {
    clear: boolean;
    great: boolean;
    bullseye: boolean;
    perfect: boolean;
  };
};

export type WorldDefinition = {
  id: WorldId;
  index: number;
  name: string;
  subtitle: string;
  firstLevel: number;
  lastLevel: number;
  environmentId: ChallengeConfig['environment'];
  storyBeat: string;
  primaryMechanics: string[];
  homeSignalStrength: HomeSignalStrength;
  distanceFromEarth: string;
  finaleName: string;
  completionSparkId?: string;
  stub: boolean;
};

export type GravityWellConfig = {
  x: number;
  y: number;
  z: number;
  strength: number;
  radius: number;
};

export type CampaignLevelDefinition = {
  id: string;
  worldId: WorldId;
  levelNumber: number;
  challenge: ChallengeConfig;
  tutorialHint?: string;
  storyBeat?: string;
  isWorldFinale?: boolean;
  windX?: number;
  gravityScale?: number;
  gravityWells?: GravityWellConfig[];
};

export type SelectedBoosts = Partial<Record<BoostId, boolean>>;
