/** Shear Lane — two debris streams cross in opposite directions; throw through the gap. */

import type { ShearLaneConfig } from '../config/ObstacleConfig';

export type { ShearLaneConfig };

export type ShearBlock = {
  x: number;
  y: number;
  radius: number;
  /** +1 upper stream, -1 lower stream. */
  stream: 1 | -1;
};

export type ShearLaneState = {
  centerX: number;
  centerY: number;
  gapHeight: number;
  blocks: ShearBlock[];
};

export function shearLaneBlocksAtTime(config: ShearLaneConfig, time: number): ShearBlock[] {
  const cy = config.centerY;
  const count = Math.max(2, Math.floor(config.blockCount));
  const span = config.wrapWidth;
  const radius = config.blockRadius;
  const offset = config.streamOffset ?? config.gapHeight / 2 + radius + 0.08;
  const t = time * config.speed + (config.phase ?? 0);
  const blocks: ShearBlock[] = [];
  for (const stream of [1, -1] as const) {
    const drift = t * stream;
    const stagger = stream < 0 ? span / (count * 2) : 0;
    for (let i = 0; i < count; i++) {
      const raw = (i / count) * span + drift + stagger;
      const x = ((raw % span) + span) % span - span / 2;
      blocks.push({
        x: config.centerX + x,
        y: cy + stream * offset,
        radius,
        stream,
      });
    }
  }
  return blocks;
}

export function shearLaneStateAtTime(config: ShearLaneConfig, time: number): ShearLaneState {
  return {
    centerX: config.centerX,
    centerY: config.centerY,
    gapHeight: config.gapHeight,
    blocks: shearLaneBlocksAtTime(config, time),
  };
}

export function evaluateShearLaneCollision(
  config: ShearLaneConfig,
  time: number,
  x: number,
  y: number,
  radius: number,
): { hit: boolean; clearance: number; nearMiss: boolean } {
  let clearance = Infinity;
  for (const block of shearLaneBlocksAtTime(config, time)) {
    clearance = Math.min(
      clearance,
      Math.hypot(x - block.x, y - block.y) - block.radius - radius,
    );
  }
  return {
    hit: clearance < 0,
    clearance,
    nearMiss: clearance >= 0 && clearance <= 0.16,
  };
}
