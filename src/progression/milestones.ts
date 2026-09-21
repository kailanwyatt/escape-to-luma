import {t} from '../i18n';
export const SHOT_MILESTONES = [10, 25, 50, 75, 100] as const;

export type MilestoneId =
  | 'shot-10'
  | 'shot-25'
  | 'shot-50'
  | 'shot-75'
  | 'shot-100'
  | 'first-bullseye'
  | 'first-perfect'
  | 'perfects-5-run'
  | 'streak-10'
  | 'streak-25'
  | 'close-calls-10'
  | 'clear-workshop'
  | 'clear-rooftop'
  | 'clear-space'
  | 'first-loop'
  | 'loop-3';

export type MilestoneRecords = Record<MilestoneId, boolean>;

export const EMPTY_MILESTONES: MilestoneRecords = {
  'shot-10': false,
  'shot-25': false,
  'shot-50': false,
  'shot-75': false,
  'shot-100': false,
  'first-bullseye': false,
  'first-perfect': false,
  'perfects-5-run': false,
  'streak-10': false,
  'streak-25': false,
  'close-calls-10': false,
  'clear-workshop': false,
  'clear-rooftop': false,
  'clear-space': false,
  'first-loop': false,
  'loop-3': false,
};

export function shotMilestoneLabel(count: number): string {
  return t("milestones.shots_cleared", {value1: count});
}

export function detectNewMilestones(
  records: MilestoneRecords,
  run: {
    challengesCleared: number;
    bullseyes: number;
    perfects: number;
    closeCalls: number;
    bestStreak: number;
    currentStreak: number;
    environmentsCompleted: number;
    lastCompletedEnvironment: string | null;
    loopNumber: number;
    loopsCompleted: number;
    workshopCleared?: boolean;
    rooftopCleared?: boolean;
    spaceCleared?: boolean;
  },
): MilestoneId[] {
  const unlocked: MilestoneId[] = [];
  const mark = (id: MilestoneId, condition: boolean) => {
    if (condition && !records[id]) {
      unlocked.push(id);
    }
  };
  mark('shot-10', run.challengesCleared >= 10);
  mark('shot-25', run.challengesCleared >= 25);
  mark('shot-50', run.challengesCleared >= 50);
  mark('shot-75', run.challengesCleared >= 75);
  mark('shot-100', run.challengesCleared >= 100);
  mark('first-bullseye', run.bullseyes >= 1);
  mark('first-perfect', run.perfects >= 1);
  mark('perfects-5-run', run.perfects >= 5);
  mark('streak-10', run.bestStreak >= 10 || run.currentStreak >= 10);
  mark('streak-25', run.bestStreak >= 25 || run.currentStreak >= 25);
  mark('close-calls-10', run.closeCalls >= 10);
  mark('clear-workshop', Boolean(run.workshopCleared) || run.lastCompletedEnvironment === 'workshop');
  mark('clear-rooftop', Boolean(run.rooftopCleared) || run.lastCompletedEnvironment === 'rooftop');
  mark('clear-space', Boolean(run.spaceCleared) || run.lastCompletedEnvironment === 'space');
  mark('first-loop', run.loopsCompleted >= 1 || run.loopNumber >= 2);
  mark('loop-3', run.loopNumber >= 3);
  return unlocked;
}

export function applyMilestones(
  records: MilestoneRecords,
  unlocked: MilestoneId[],
): MilestoneRecords {
  if (unlocked.length === 0) {
    return records;
  }
  const next = { ...records };
  for (const id of unlocked) {
    next[id] = true;
  }
  return next;
}
