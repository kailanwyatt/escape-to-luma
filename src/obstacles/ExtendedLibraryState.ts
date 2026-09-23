/**
 * Extended library families: split shutter, reactive gate, conveyor gate,
 * rolling aperture, corkscrew tunnel, comet crossing.
 */

import type {
  CometCrossingConfig,
  ConveyorGateConfig,
  CorkscrewTunnelConfig,
  ReactiveGateConfig,
  RollingApertureConfig,
  SplitShutterConfig,
} from '../config/ObstacleConfig';

export type SampleHit = { hit: boolean; clearance: number; nearMiss: boolean };

function near(clearance: number): SampleHit {
  return { hit: clearance < 0, clearance, nearMiss: clearance >= 0 && clearance <= 0.16 };
}

function aabbClearance(
  x: number,
  y: number,
  radius: number,
  cx: number,
  cy: number,
  width: number,
  height: number,
): number {
  const dx = Math.abs(x - cx) - width / 2;
  const dy = Math.abs(y - cy) - height / 2;
  return Math.hypot(Math.max(0, dx), Math.max(0, dy)) + Math.min(Math.max(dx, dy), 0) - radius;
}

/** Split Shutter — two halves part / meet on a shared phase. */
export type SplitShutterState = {
  leftX: number;
  rightX: number;
  y: number;
  halfWidth: number;
  height: number;
  gap: number;
};

export function splitShutterStateAtTime(config: SplitShutterConfig, time: number): SplitShutterState {
  const wave = 0.5 + 0.5 * Math.sin(time * config.speed + (config.phase ?? 0));
  const gap = config.minGap + (config.maxGap - config.minGap) * wave;
  const half = config.panelWidth / 2;
  const y = config.centerY ?? 3;
  return {
    leftX: config.centerX - gap / 2 - half,
    rightX: config.centerX + gap / 2 + half,
    y,
    halfWidth: half,
    height: config.panelHeight,
    gap,
  };
}

export function evaluateSplitShutterCollision(
  config: SplitShutterConfig,
  time: number,
  x: number,
  y: number,
  radius: number,
): SampleHit {
  const state = splitShutterStateAtTime(config, time);
  const left = aabbClearance(x, y, radius, state.leftX, state.y, config.panelWidth, state.height);
  const right = aabbClearance(x, y, radius, state.rightX, state.y, config.panelWidth, state.height);
  return near(Math.min(left, right));
}

/** Reactive Gate — telegraphed closed → warning → open aperture (paired doors). */
export type ReactiveGatePhase = 'closed' | 'warning' | 'open';

export type ReactiveGateState = {
  phase: ReactiveGatePhase;
  /** Clear gap width between the two door panels. */
  gap: number;
  leftX: number;
  rightX: number;
  y: number;
  panelWidth: number;
  panelHeight: number;
  warning: boolean;
};

export function reactiveGateStateAtTime(config: ReactiveGateConfig, time: number): ReactiveGateState {
  const closed = Math.max(0.2, config.closedHold ?? 0.9);
  const warning = Math.max(0.15, config.warningHold ?? 0.35);
  const open = Math.max(0.25, config.openHold ?? 0.8);
  const cycle = closed + warning + open;
  const local = ((time * config.speed + (config.phase ?? 0)) % cycle + cycle) % cycle;
  let phase: ReactiveGatePhase = 'closed';
  if (local >= closed + warning) phase = 'open';
  else if (local >= closed) phase = 'warning';
  const gap =
    phase === 'open'
      ? config.openWidth
      : phase === 'warning'
        ? Math.max(config.closedWidth, config.openWidth * 0.28)
        : config.closedWidth;
  const panelWidth = Math.max(1.1, (config.openWidth + 1.2) / 2);
  const panelHeight = config.openHeight;
  const y = config.centerY ?? 3;
  const half = panelWidth / 2;
  return {
    phase,
    gap,
    leftX: config.centerX - gap / 2 - half,
    rightX: config.centerX + gap / 2 + half,
    y,
    panelWidth,
    panelHeight,
    warning: phase === 'warning',
  };
}

export function evaluateReactiveGateCollision(
  config: ReactiveGateConfig,
  time: number,
  x: number,
  y: number,
  radius: number,
): SampleHit {
  const state = reactiveGateStateAtTime(config, time);
  const left = aabbClearance(x, y, radius, state.leftX, state.y, state.panelWidth, state.panelHeight);
  const right = aabbClearance(x, y, radius, state.rightX, state.y, state.panelWidth, state.panelHeight);
  return near(Math.min(left, right));
}

/** Conveyor Gate — blockers translate laterally and wrap. */
export type ConveyorBlock = { x: number; y: number; radius: number };

export function conveyorGateBlocksAtTime(config: ConveyorGateConfig, time: number): ConveyorBlock[] {
  const cy = config.centerY ?? 3;
  const count = Math.max(2, Math.floor(config.blockCount));
  const span = config.wrapWidth;
  const t = time * config.speed * (config.direction ?? 1) + (config.phase ?? 0);
  return Array.from({ length: count }, (_, i) => {
    const x = ((((i / count) * span + t) % span) + span) % span - span / 2;
    return { x: config.centerX + x, y: cy, radius: config.blockRadius };
  });
}

export function evaluateConveyorGateCollision(
  config: ConveyorGateConfig,
  time: number,
  x: number,
  y: number,
  radius: number,
): SampleHit {
  let clearance = Infinity;
  for (const block of conveyorGateBlocksAtTime(config, time)) {
    clearance = Math.min(clearance, Math.hypot(x - block.x, y - block.y) - block.radius - radius);
  }
  return near(clearance);
}

/** Rolling Aperture — iris that drifts on X/Y while radius cycles. */
export type RollingApertureState = {
  x: number;
  y: number;
  radius: number;
};

export function rollingApertureStateAtTime(
  config: RollingApertureConfig,
  time: number,
): RollingApertureState {
  const pulse = 0.5 + 0.5 * Math.sin(time * config.pulseSpeed + (config.phase ?? 0));
  const radius = config.minRadius + (config.maxRadius - config.minRadius) * pulse;
  const drift = time * config.driftSpeed + (config.phase ?? 0) * 0.7;
  return {
    x: config.baseX + Math.cos(drift) * config.driftAmplitudeX,
    y: config.baseY + Math.sin(drift * 1.15) * config.driftAmplitudeY,
    radius,
  };
}

export function evaluateRollingApertureCollision(
  config: RollingApertureConfig,
  time: number,
  x: number,
  y: number,
  radius: number,
): SampleHit {
  const state = rollingApertureStateAtTime(config, time);
  return near(state.radius - Math.hypot(x - state.x, y - state.y) - radius);
}

/** Corkscrew Tunnel — annular ring with one rotating open sector (not blade arms). */
export type CorkscrewState = {
  gapAngle: number;
  gapWidth: number;
  radius: number;
  innerRadius: number;
  centerX: number;
  centerY: number;
};

export function corkscrewStateAtTime(config: CorkscrewTunnelConfig, time: number): CorkscrewState {
  const segment = config.segmentIndex ?? 0;
  const gapAngle =
    time * config.speed + (config.phase ?? 0) + segment * (config.helixStep ?? 0.55);
  const radius = config.radius;
  const innerRadius = Math.max(
    0.35,
    Math.min(config.innerRadius ?? radius * 0.45, radius - 0.25),
  );
  return {
    gapAngle,
    gapWidth: config.gapWidth,
    radius,
    innerRadius,
    centerX: config.centerX,
    centerY: config.centerY,
  };
}

function wrapPi(delta: number): number {
  let d = delta;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/**
 * Ring wall is solid except for a rotating angular gap.
 * Unlike a 2-blade rotor (thin radial arms + large open sectors), this is a continuous
 * tunnel mouth with one portal sector — fly through the gap or the open hub.
 */
export function evaluateCorkscrewCollision(
  config: CorkscrewTunnelConfig,
  time: number,
  x: number,
  y: number,
  radius: number,
): SampleHit {
  const state = corkscrewStateAtTime(config, time);
  const dx = x - state.centerX;
  const dy = y - state.centerY;
  const dist = Math.hypot(dx, dy);

  // Missed the ring entirely.
  if (dist > state.radius + radius) {
    return near(dist - state.radius - radius);
  }

  // Open hub — always passable (angle is undefined at the center).
  if (dist + radius <= state.innerRadius) {
    return near(state.innerRadius - dist - radius);
  }

  const ang = Math.atan2(dy, dx);
  const inGap = Math.abs(wrapPi(ang - state.gapAngle)) <= state.gapWidth / 2;
  if (inGap) {
    // Through the missing arc of the ring band.
    return near(Math.max(0.08, state.gapWidth * 0.2 - radius * 0.1));
  }

  // Solid ring band (continuous wall — not thin rotor blades).
  return near(-0.2);
}

/** Comet Crossing — compact blocker on a diagonal loop. */
export type CometState = { x: number; y: number; radius: number };

export function cometCrossingStateAtTime(config: CometCrossingConfig, time: number): CometState {
  const t = time * config.speed + (config.phase ?? 0);
  const u = ((t % 1) + 1) % 1;
  return {
    x: config.startX + (config.endX - config.startX) * u,
    y: config.startY + (config.endY - config.startY) * u,
    radius: config.blockerRadius,
  };
}

export function evaluateCometCrossingCollision(
  config: CometCrossingConfig,
  time: number,
  x: number,
  y: number,
  radius: number,
): SampleHit {
  const state = cometCrossingStateAtTime(config, time);
  return near(Math.hypot(x - state.x, y - state.y) - state.radius - radius);
}
