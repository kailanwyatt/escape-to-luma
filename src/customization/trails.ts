import {t} from '../i18n';
export type TrailDefinition = {
  id: string;
  name: string;
  acquisition: 'default' | 'shards';
  shardCost?: number;
  color: number;
  width: number;
};

export const TRAIL_CATALOG: TrailDefinition[] = [
  { id: 'standard', name: t("trails.standard"), acquisition: 'default', color: 0x7ef0ff, width: 0.07 },
  { id: 'stardust', name: t("trails.stardust"), acquisition: 'shards', shardCost: 300, color: 0xffe08a, width: 0.08 },
  { id: 'lightning', name: t("trails.lightning"), acquisition: 'shards', shardCost: 400, color: 0x9eb4ff, width: 0.07 },
  { id: 'fire', name: t("trails.fire"), acquisition: 'shards', shardCost: 400, color: 0xff7a2a, width: 0.09 },
  { id: 'frost', name: t("sparks.frost"), acquisition: 'shards', shardCost: 400, color: 0xb8e4ff, width: 0.07 },
  { id: 'void', name: t("sparks.void"), acquisition: 'shards', shardCost: 600, color: 0xd4b8ff, width: 0.1 },
];

export const DEFAULT_TRAIL_ID = 'standard';

export function trailById(id: string | undefined): TrailDefinition {
  return TRAIL_CATALOG.find((trail) => trail.id === id) ?? TRAIL_CATALOG[0];
}
