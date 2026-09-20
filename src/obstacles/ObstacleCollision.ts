import { GAME_TUNING } from '../game/gameTuning';
import { clamp } from '../utils/math';

export type RotorHitPart = 'hub' | 'frame' | 'blade';

export type ObstacleHitPart =
  | RotorHitPart
  | 'gate'
  | 'iris'
  | 'pendulum'
  | 'ring'
  | 'orbiter'
  | 'drift'
  | 'phase'
  | 'aperture'
  | 'laser';

export type ObstacleCollisionResult = {
  hit: ObstacleHitPart | null;
  nearMiss: boolean;
  clearance: number;
};

function closeCall(clearance: number): ObstacleCollisionResult {
  return {
    hit: null,
    nearMiss: clearance > 0 && clearance <= GAME_TUNING.rotor.closeCallThreshold,
    clearance,
  };
}

export function evaluateGateCollision(
  x: number,
  y: number,
  projectileRadius: number,
  openingX: number,
  openingY: number,
  openingWidth: number,
  openingHeight: number,
): ObstacleCollisionResult {
  const dx = Math.abs(x - openingX);
  const dy = Math.abs(y - openingY);
  const clearance = Math.min(
    openingWidth / 2 - dx - projectileRadius,
    openingHeight / 2 - dy - projectileRadius,
  );
  if (clearance < 0) {
    return { hit: 'gate', nearMiss: false, clearance };
  }
  return closeCall(clearance);
}

export function evaluateIrisCollision(
  x: number,
  y: number,
  projectileRadius: number,
  centerX: number,
  centerY: number,
  openingRadius: number,
): ObstacleCollisionResult {
  const dist = Math.hypot(x - centerX, y - centerY);
  const clearance = openingRadius - dist - projectileRadius;
  if (clearance < 0) {
    return { hit: 'iris', nearMiss: false, clearance };
  }
  return closeCall(clearance);
}

export function evaluateRingCollision(
  x: number,
  y: number,
  projectileRadius: number,
  centerX: number,
  centerY: number,
  openingRadius: number,
): ObstacleCollisionResult {
  const dist = Math.hypot(x - centerX, y - centerY);
  const clearance = openingRadius - dist - projectileRadius;
  if (clearance < 0) {
    return { hit: 'ring', nearMiss: false, clearance };
  }
  return closeCall(clearance);
}

export function evaluateBlockerCollision(
  x: number,
  y: number,
  projectileRadius: number,
  blockerX: number,
  blockerY: number,
  blockerRadius: number,
  hitPart: ObstacleHitPart = 'drift',
): ObstacleCollisionResult {
  const clearance = Math.hypot(x - blockerX, y - blockerY) - blockerRadius - projectileRadius;
  if (clearance < 0) {
    return { hit: hitPart, nearMiss: false, clearance };
  }
  return closeCall(clearance);
}

/** Closed phase = solid disk; open phase = pass (large clearance). */
export function evaluatePhaseCollision(
  x: number,
  y: number,
  projectileRadius: number,
  centerX: number,
  centerY: number,
  fieldRadius: number,
  open: boolean,
): ObstacleCollisionResult {
  if (open) {
    return { hit: null, nearMiss: false, clearance: 1 };
  }
  const dist = Math.hypot(x - centerX, y - centerY);
  const clearance = fieldRadius - dist - projectileRadius;
  // Inside the closed field → blocked.
  if (dist + projectileRadius <= fieldRadius) {
    return { hit: 'phase', nearMiss: false, clearance: dist - fieldRadius };
  }
  return closeCall(Math.abs(clearance));
}

export type LaserBeam = {
  orientation: 'vertical' | 'horizontal';
  /** Beam center line position (x for vertical, y for horizontal). */
  position: number;
  /** Half-length of the beam along its span axis. */
  halfSpan: number;
  /** Half-thickness perpendicular to the beam. */
  halfThickness: number;
  centerX: number;
  centerY: number;
};

export function laserBeamsFromLayout(params: {
  orientation: 'vertical' | 'horizontal' | 'both';
  openingSize: number;
  spacing: number;
  span: number;
  thickness: number;
  centerX: number;
  centerY: number;
}): LaserBeam[] {
  const beams: LaserBeam[] = [];
  const halfOpen = params.openingSize / 2;
  const halfSpan = params.span / 2;
  const halfThickness = params.thickness / 2;

  const place = (orientation: 'vertical' | 'horizontal') => {
    // Place beams outward from the safe gap until span is filled.
    for (let side of [-1, 1] as const) {
      let pos = halfOpen + params.spacing * 0.5;
      while (pos <= halfSpan + 0.01) {
        beams.push({
          orientation,
          position: (orientation === 'vertical' ? params.centerX : params.centerY) + side * pos,
          halfSpan,
          halfThickness,
          centerX: params.centerX,
          centerY: params.centerY,
        });
        pos += params.spacing;
      }
    }
  };

  if (params.orientation === 'vertical' || params.orientation === 'both') {
    place('vertical');
  }
  if (params.orientation === 'horizontal' || params.orientation === 'both') {
    place('horizontal');
  }
  return beams;
}

export function evaluateLaserCollision(
  x: number,
  y: number,
  projectileRadius: number,
  beams: LaserBeam[],
  lasersOn: boolean,
): ObstacleCollisionResult {
  if (!lasersOn || beams.length === 0) {
    return { hit: null, nearMiss: false, clearance: 1 };
  }

  let minClearance = Number.POSITIVE_INFINITY;
  for (const beam of beams) {
    let clearance: number;
    if (beam.orientation === 'vertical') {
      const along = Math.abs(y - beam.centerY);
      if (along > beam.halfSpan + projectileRadius) {
        continue;
      }
      clearance = Math.abs(x - beam.position) - beam.halfThickness - projectileRadius;
    } else {
      const along = Math.abs(x - beam.centerX);
      if (along > beam.halfSpan + projectileRadius) {
        continue;
      }
      clearance = Math.abs(y - beam.position) - beam.halfThickness - projectileRadius;
    }
    minClearance = Math.min(minClearance, clearance);
    if (clearance < 0) {
      return { hit: 'laser', nearMiss: false, clearance };
    }
  }

  if (!Number.isFinite(minClearance)) {
    return { hit: null, nearMiss: false, clearance: 1 };
  }
  return closeCall(minClearance);
}

export function lasersOnAt(elapsedTime: number, speed: number, phase: number, onRatio: number): boolean {
  const cycle = ((elapsedTime * speed + phase) % 1 + 1) % 1;
  return cycle < onRatio;
}

export function evaluatePendulumCollision(
  x: number,
  y: number,
  projectileRadius: number,
  pivotX: number,
  pivotY: number,
  blockerX: number,
  blockerY: number,
  blockerRadius: number,
  armRadius: number,
): ObstacleCollisionResult {
  const blockerClearance = Math.hypot(x - blockerX, y - blockerY) - blockerRadius - projectileRadius;
  const armClearance = distToSegment(x, y, pivotX, pivotY, blockerX, blockerY) - armRadius - projectileRadius;
  const clearance = Math.min(blockerClearance, armClearance);
  if (clearance < 0) {
    return { hit: 'pendulum', nearMiss: false, clearance };
  }
  return closeCall(clearance);
}

function distToSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSq = dx * dx + dy * dy;
  const t = lengthSq === 0 ? 0 : clamp(((px - ax) * dx + (py - ay) * dy) / lengthSq, 0, 1);
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
}

export function testRotorCollision(
  x: number,
  y: number,
  projectileRadius: number,
  rotorAngle: number,
  bladeCount: number,
  centerX = GAME_TUNING.rotor.center.x,
  centerY = GAME_TUNING.rotor.center.y,
): RotorHitPart | null {
  return evaluateRotorCollision(
    x,
    y,
    projectileRadius,
    rotorAngle,
    bladeCount,
    centerX,
    centerY,
  ).hit as RotorHitPart | null;
}

export function evaluateRotorCollision(
  x: number,
  y: number,
  projectileRadius: number,
  rotorAngle: number,
  bladeCount: number,
  centerX: number,
  centerY: number,
): ObstacleCollisionResult {
  const t = GAME_TUNING.rotor;
  const dx = x - centerX;
  const dy = y - centerY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist <= t.hubRadius + projectileRadius) {
    return { hit: 'hub', nearMiss: false, clearance: dist - t.hubRadius - projectileRadius };
  }

  const innerRing = t.radius - t.ringThickness;
  const outerRing = t.radius + t.ringThickness;
  if (dist >= innerRing - projectileRadius && dist <= outerRing + projectileRadius) {
    return {
      hit: 'frame',
      nearMiss: false,
      clearance: innerRing - projectileRadius - dist,
    };
  }

  let minBladeClearance = Number.POSITIVE_INFINITY;
  for (let i = 0; i < bladeCount; i += 1) {
    const bladeAngle = rotorAngle + (i / bladeCount) * Math.PI * 2;
    const clearance = bladeClearance(dx, dy, bladeAngle, projectileRadius);
    minBladeClearance = Math.min(minBladeClearance, clearance);
    if (clearance <= 0) {
      return { hit: 'blade', nearMiss: false, clearance };
    }
  }

  const hubClearance = dist - t.hubRadius - projectileRadius;
  const frameClearance = innerRing - projectileRadius - dist;
  const minClearance = Math.min(hubClearance, frameClearance, minBladeClearance);
  return {
    hit: null,
    nearMiss: minClearance > 0 && minClearance <= GAME_TUNING.rotor.closeCallThreshold,
    clearance: minClearance,
  };
}

function bladeClearance(
  localX: number,
  localY: number,
  bladeAngle: number,
  projectileRadius: number,
): number {
  const t = GAME_TUNING.rotor;
  const c = Math.cos(-bladeAngle);
  const s = Math.sin(-bladeAngle);
  const rx = localX * c - localY * s;
  const ry = localX * s + localY * c;
  const minX = t.hubRadius;
  const maxX = t.hubRadius + t.bladeLength;
  const halfW = t.bladeWidth / 2;
  const closestX = clamp(rx, minX, maxX);
  const closestY = clamp(ry, -halfW, halfW);
  const ddx = rx - closestX;
  const ddy = ry - closestY;
  return Math.sqrt(ddx * ddx + ddy * ddy) - projectileRadius;
}
