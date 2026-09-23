/**
 * Story-heavy library families for playtesting (docs/NEW-OBSTACLES.md).
 * Functional prototypes: deterministic state + collision; Codex owns final art.
 */

import type {
  AccretionShredderConfig,
  EntryExitPortalConfig,
  LagrangeNullConfig,
  MagnetopauseConfig,
  MovingSafeZoneConfig,
  OrbitingMoonsConfig,
  PulsarBeamConfig,
  SequentialTunnelConfig,
  SolarSailConfig,
  TeleportPortalConfig,
  TheNullConfig,
} from '../config/ObstacleConfig';

export type SampleHit = { hit: boolean; clearance: number; nearMiss: boolean };

function near(clearance: number): SampleHit {
  return { hit: clearance < 0, clearance, nearMiss: clearance >= 0 && clearance <= 0.16 };
}

function wrap01(t: number): number {
  return ((t % 1) + 1) % 1;
}

/** Orbiting Moons — multiple blockers on a shared circular orbit. */
export type MoonPose = { x: number; y: number; radius: number };

export function orbitingMoonsAtTime(config: OrbitingMoonsConfig, time: number): MoonPose[] {
  const count = Math.max(1, Math.floor(config.moonCount));
  const base = time * config.speed + (config.phase ?? 0);
  return Array.from({ length: count }, (_, i) => {
    const ang = base + (i / count) * Math.PI * 2;
    return {
      x: config.centerX + Math.cos(ang) * config.orbitRadius,
      y: config.centerY + Math.sin(ang) * config.orbitRadius,
      radius: config.moonRadius,
    };
  });
}

export function evaluateOrbitingMoonsCollision(
  config: OrbitingMoonsConfig,
  time: number,
  x: number,
  y: number,
  radius: number,
): SampleHit {
  let clearance = Infinity;
  for (const moon of orbitingMoonsAtTime(config, time)) {
    clearance = Math.min(clearance, Math.hypot(x - moon.x, y - moon.y) - moon.radius - radius);
  }
  return near(clearance);
}

/** Sequential Tunnel — one of N apertures is open on a shared cycle. */
export type SequentialAperture = { x: number; y: number; radius: number; open: boolean };

export function sequentialTunnelAtTime(
  config: SequentialTunnelConfig,
  time: number,
): SequentialAperture[] {
  const count = Math.max(2, Math.floor(config.apertureCount));
  const openIndex =
    Math.floor(wrap01(time * config.speed + (config.phase ?? 0)) * count) % count;
  const span = config.spacing;
  const mid = (count - 1) / 2;
  return Array.from({ length: count }, (_, i) => ({
    x: config.centerX + (i - mid) * span,
    y: config.centerY,
    radius: config.apertureRadius,
    open: i === openIndex,
  }));
}

export function evaluateSequentialTunnelCollision(
  config: SequentialTunnelConfig,
  time: number,
  x: number,
  y: number,
  radius: number,
): SampleHit {
  const apertures = sequentialTunnelAtTime(config, time);
  for (const ap of apertures) {
    const dist = Math.hypot(x - ap.x, y - ap.y);
    if (ap.open) {
      return near(ap.radius - dist - radius);
    }
  }
  return near(-0.2);
}

/** Moving Safe Zone — dangerous field with one drifting safe hole. */
export function movingSafeZoneHoleAtTime(config: MovingSafeZoneConfig, time: number): {
  x: number;
  y: number;
  radius: number;
} {
  const drift = time * config.driftSpeed + (config.phase ?? 0);
  return {
    x: config.baseX + Math.cos(drift) * config.driftAmplitudeX,
    y: config.baseY + Math.sin(drift * 1.1) * config.driftAmplitudeY,
    radius: config.holeRadius,
  };
}

export function evaluateMovingSafeZoneCollision(
  config: MovingSafeZoneConfig,
  time: number,
  x: number,
  y: number,
  radius: number,
): SampleHit {
  const hole = movingSafeZoneHoleAtTime(config, time);
  const distField = Math.hypot(x - config.centerX, y - config.centerY);
  if (distField > config.fieldRadius + radius) {
    return near(distField - config.fieldRadius - radius);
  }
  const distHole = Math.hypot(x - hole.x, y - hole.y);
  return near(hole.radius - distHole - radius);
}

/** Accretion Shredder — debris spirals inward; center lane stays clearer. */
export type DebrisPose = { x: number; y: number; radius: number };

export function accretionDebrisAtTime(config: AccretionShredderConfig, time: number): DebrisPose[] {
  const count = Math.max(4, Math.floor(config.debrisCount));
  return Array.from({ length: count }, (_, i) => {
    const u = wrap01(time * config.speed + (config.phase ?? 0) + i / count);
    const r = config.outerRadius * (1 - u * 0.85);
    const ang = u * Math.PI * 2 * (config.turns ?? 1.5) + i * 0.7;
    return {
      x: config.centerX + Math.cos(ang) * r,
      y: config.centerY + Math.sin(ang) * r,
      radius: config.debrisRadius,
    };
  });
}

export function evaluateAccretionCollision(
  config: AccretionShredderConfig,
  time: number,
  x: number,
  y: number,
  radius: number,
): SampleHit {
  let clearance = Infinity;
  for (const d of accretionDebrisAtTime(config, time)) {
    clearance = Math.min(clearance, Math.hypot(x - d.x, y - d.y) - d.radius - radius);
  }
  return near(clearance);
}

/** Pulsar Beam — wide horizontal/vertical beam pulses on a duty cycle. */
export function pulsarBeamOn(config: PulsarBeamConfig, time: number): boolean {
  const cycle = Math.max(0.3, config.onHold + config.offHold);
  const local = ((time * config.speed + (config.phase ?? 0)) % cycle + cycle) % cycle;
  return local < config.onHold;
}

export function evaluatePulsarBeamCollision(
  config: PulsarBeamConfig,
  time: number,
  x: number,
  y: number,
  radius: number,
): SampleHit {
  if (!pulsarBeamOn(config, time)) {
    return near(0.5);
  }
  if (config.orientation === 'vertical') {
    const clearance = Math.abs(x - config.centerX) - config.halfWidth - radius;
    return near(clearance);
  }
  const clearance = Math.abs(y - config.centerY) - config.halfWidth - radius;
  return near(clearance);
}

/** Solar Sail — broad panel swings; collision matches the rotated visual. */
export function solarSailAngle(config: SolarSailConfig, time: number): number {
  return Math.sin(time * config.speed + (config.phase ?? 0)) * config.maxAngle;
}

/** True when the panel has swung far enough to clear the flight corridor. */
export function solarSailOpen(config: SolarSailConfig, time: number): boolean {
  return Math.abs(solarSailAngle(config, time)) >= config.openAngle;
}

export function evaluateSolarSailCollision(
  config: SolarSailConfig,
  time: number,
  x: number,
  y: number,
  radius: number,
): SampleHit {
  // Authoritative: openAngle clears the corridor; otherwise use the same OBB as the mesh.
  if (solarSailOpen(config, time)) return near(0.45);
  const ang = solarSailAngle(config, time);
  const dx = x - config.centerX;
  const dy = y - config.centerY;
  const c = Math.cos(-ang);
  const s = Math.sin(-ang);
  const lx = dx * c - dy * s;
  const ly = dx * s + dy * c;
  const ox = Math.abs(lx) - config.halfWidth;
  const oy = Math.abs(ly) - config.halfHeight;
  const outside =
    Math.hypot(Math.max(ox, 0), Math.max(oy, 0)) + Math.min(Math.max(ox, oy), 0);
  return near(outside - radius);
}

/** Magnetopause — ring arc with a cyclic open sector (corkscrew-like). */
export function evaluateMagnetopauseCollision(
  config: MagnetopauseConfig,
  time: number,
  x: number,
  y: number,
  radius: number,
): SampleHit {
  const gapAngle = time * config.speed + (config.phase ?? 0);
  const dx = x - config.centerX;
  const dy = y - config.centerY;
  const dist = Math.hypot(dx, dy);
  const inner = config.innerRadius;
  const outer = config.outerRadius;
  if (dist + radius < inner || dist > outer + radius) {
    return near(dist < inner ? inner - dist - radius : dist - outer - radius);
  }
  let delta = Math.atan2(dy, dx) - gapAngle;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  if (Math.abs(delta) <= config.gapWidth / 2) return near(0.25);
  return near(-0.2);
}

/** Lagrange Null — non-lethal pocket (force cancel handled by physics). */
export function evaluateLagrangeNullCollision(
  _config: LagrangeNullConfig,
  _time: number,
  _x: number,
  _y: number,
  _radius: number,
): SampleHit {
  return near(0.8);
}

export function pointInLagrangeNull(
  config: LagrangeNullConfig,
  x: number,
  y: number,
): boolean {
  return Math.hypot(x - config.centerX, y - config.centerY) <= config.radius;
}

/** Teleporting Portal — aperture jumps among fixed anchors. */
export function teleportPortalPoseAtTime(
  config: TeleportPortalConfig,
  time: number,
): {
  x: number;
  y: number;
  radius: number;
  warning: boolean;
  nextX: number;
  nextY: number;
} {
  const dwell = Math.max(0.35, config.dwell);
  const warn = Math.max(0.15, config.warning);
  const cycle = dwell + warn;
  const anchors = config.anchors;
  const n = Math.max(1, anchors.length);
  const raw = time * config.speed + (config.phase ?? 0);
  const step = Math.floor(raw / cycle);
  const local = ((raw % cycle) + cycle) % cycle;
  const idx = ((step % n) + n) % n;
  const next = anchors[(idx + 1) % n];
  const cur = anchors[idx];
  const warning = local >= dwell;
  // Collision and prediction use the CURRENT anchor until swap.
  // Warning telegraph exposes the NEXT anchor separately for UI.
  return {
    x: cur.x,
    y: cur.y,
    radius: config.radius,
    warning,
    nextX: next.x,
    nextY: next.y,
  };
}

export function evaluateTeleportPortalCollision(
  config: TeleportPortalConfig,
  time: number,
  x: number,
  y: number,
  radius: number,
): SampleHit {
  // Must pass through the active portal hole; elsewhere is solid teaching wall.
  const pose = teleportPortalPoseAtTime(config, time);
  return near(pose.radius - Math.hypot(x - pose.x, y - pose.y) - radius);
}

/** Entry/Exit Portal — pass through entry disk (exit is presentation + warp hook). */
export function evaluateEntryExitCollision(
  config: EntryExitPortalConfig,
  _time: number,
  x: number,
  y: number,
  radius: number,
): SampleHit {
  // Solid except the entry aperture (exit is destination after warp).
  return near(config.radius - Math.hypot(x - config.entryX, y - config.entryY) - radius);
}

export function entryExitWarpTarget(config: EntryExitPortalConfig): { x: number; y: number } {
  return { x: config.exitX, y: config.exitY };
}

/** The Null — shrinking safe opening inside a dark field. */
export function theNullSafeAtTime(
  config: TheNullConfig,
  time: number,
): { x: number; y: number; radius: number } {
  const pulse = 0.5 + 0.5 * Math.sin(time * config.speed + (config.phase ?? 0));
  const radius = config.minSafeRadius + (config.maxSafeRadius - config.minSafeRadius) * pulse;
  return { x: config.centerX, y: config.centerY, radius };
}

export function evaluateTheNullCollision(
  config: TheNullConfig,
  time: number,
  x: number,
  y: number,
  radius: number,
): SampleHit {
  const safe = theNullSafeAtTime(config, time);
  const dist = Math.hypot(x - safe.x, y - safe.y);
  // Outside the dark field: clear. Inside field but outside safe hole: hit.
  const fieldDist = Math.hypot(x - config.centerX, y - config.centerY);
  if (fieldDist > config.fieldRadius + radius) {
    return near(fieldDist - config.fieldRadius - radius);
  }
  return near(safe.radius - dist - radius);
}
