import type { ChallengeTemplateId, EnvironmentId } from '../config/ChallengeConfig';
import { primaryTypeForTemplate } from './VarietyDirector';
import type { SeededRng } from '../utils/SeededRng';

export type RunThemeId = 'classic' | 'precision' | 'timing' | 'motion';

export const RUN_THEMES: { id: RunThemeId; label: string; weight: number }[] = [
  { id: 'classic', label: 'CLASSIC RUN', weight: 5 },
  { id: 'precision', label: 'PRECISION RUN', weight: 1 },
  { id: 'timing', label: 'TIMING RUN', weight: 1 },
  { id: 'motion', label: 'MOTION RUN', weight: 1 },
];

export function pickRunTheme(rng: SeededRng): RunThemeId {
  const total = RUN_THEMES.reduce((sum, theme) => sum + theme.weight, 0);
  let roll = rng.float(0, total);
  for (const theme of RUN_THEMES) {
    roll -= theme.weight;
    if (roll <= 0) {
      return theme.id;
    }
  }
  return 'classic';
}

export function themeLabel(id: RunThemeId): string {
  return RUN_THEMES.find((theme) => theme.id === id)?.label ?? 'CLASSIC RUN';
}

export function templateWeight(
  template: ChallengeTemplateId,
  theme: RunThemeId,
  environment: EnvironmentId,
): number {
  const family = primaryTypeForTemplate(template);
  let weight = 1;
  if (theme === 'timing') {
    weight *= family === 'rotor' || family === 'iris' ? 2.4 : 0.65;
  } else if (theme === 'motion') {
    weight *= family === 'slidingGate' || family === 'movingRing' ? 2.4 : 0.65;
  } else if (theme === 'precision') {
    weight *=
      template.includes('OFFSET') || template.includes('IRIS') || template === 'MOVING_TARGET'
        ? 1.8
        : 1;
  }

  if (environment === 'workshop') {
    weight *= family === 'rotor' || family === 'slidingGate' || family === 'pendulum' ? 1.55 : 0.85;
  } else if (environment === 'rooftop') {
    weight *= family === 'rotor' || family === 'movingRing' || family === 'pendulum' ? 1.55 : 0.85;
  } else {
    weight *= family === 'iris' || family === 'movingRing' || family === 'rotor' ? 1.55 : 0.85;
  }
  return weight;
}

export function pickWeightedTemplate(
  rng: SeededRng,
  templates: ChallengeTemplateId[],
  theme: RunThemeId,
  environment: EnvironmentId,
): ChallengeTemplateId {
  if (templates.length === 0) {
    return 'BASIC_ROTOR';
  }
  const weights = templates.map((template) => templateWeight(template, theme, environment));
  const total = weights.reduce((sum, value) => sum + value, 0);
  let roll = rng.float(0, total);
  for (let i = 0; i < templates.length; i += 1) {
    roll -= weights[i];
    if (roll <= 0) {
      return templates[i];
    }
  }
  return templates[templates.length - 1];
}

export function precisionTargetScale(theme: RunThemeId): number {
  return theme === 'precision' ? 0.9 : 1;
}
