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
export type MoonPose = { x: number; y: number; radius: number; angle: number };

export function orbitingMoonsAtTime(config: OrbitingMoonsConfig, time: number): MoonPose[] {
  const count = Math.max(1, Math.floor(config.moonCount));
  const base = time * config.speed + (config.phase ?? 0);
  return Array.from({ length: count }, (_, i) => {
    const ang = base + (i / count) * Math.PI * 2;
    return {
      x: config.centerX + Math.cos(ang) * config.orbitRadius,
      y: config.centerY + Math.sin(ang) * config.orbitRadius,
      radius: config.moonRadius,
      angle: ang,
    };
  });
}

export type BeaconPulsePhase = 'off' | 'warning' | 'firing';

export type BeaconPulseState = {
  phase: BeaconPulsePhase;
  /** 0..1 expand progress while firing. */
  fraction: number;
  warning: boolean;
};

export function beaconPulseStateAtTime(
  config: OrbitingMoonsConfig,
  time: number,
): BeaconPulseState {
  const pulse = config.beaconPulse;
  if (!pulse) return { phase: 'off', fraction: 0, warning: false };
  const off = Math.max(0.2, pulse.offHold ?? 0.85);
  const warn = Math.max(0.12, pulse.warningHold ?? 0.32);
  const on = Math.max(0.18, pulse.onHold ?? 0.55);
  const cycle = off + warn + on;
  const local = ((time * pulse.speed + (pulse.phase ?? 0)) % cycle + cycle) % cycle;
  if (local < off) return { phase: 'off', fraction: 0, warning: false };
  if (local < off + warn) return { phase: 'warning', fraction: 0, warning: true };
  const p = (local - off - warn) / on;
  return { phase: 'firing', fraction: 1 - (1 - p) ** 2, warning: false };
}

export function evaluateOrbitingMoonsCollision(
  config: OrbitingMoonsConfig,
  time: number,
  x: number,
  y: number,
  radius: number,
): SampleHit {
  let clearance = Infinity;
  const hub = config.hubRadius ?? 0;
  if (hub > 0) {
    clearance = Math.min(
      clearance,
      Math.hypot(x - config.centerX, y - config.centerY) - hub - radius,
    );
  }
  const moons = orbitingMoonsAtTime(config, time);
  for (const moon of moons) {
    clearance = Math.min(clearance, Math.hypot(x - moon.x, y - moon.y) - moon.radius - radius);
  }

  const pulse = config.beaconPulse;
  const pulseState = beaconPulseStateAtTime(config, time);
  if (pulse && pulseState.phase === 'firing') {
    if (pulse.kind === 'shockwave') {
      const thickness = pulse.thickness ?? 0.16;
      for (const moon of moons) {
        const shockR = moon.radius + pulse.range * pulseState.fraction;
        const dist = Math.hypot(x - moon.x, y - moon.y);
        clearance = Math.min(clearance, Math.abs(dist - shockR) - thickness / 2 - radius);
      }
    } else {
      // Radial laser from each moon inward toward the orbit center (scans the corridor).
      const halfWidth = pulse.thickness ?? 0.1;
      for (const moon of moons) {
        const ux = -Math.cos(moon.angle);
        const uy = -Math.sin(moon.angle);
        const dx = x - moon.x;
        const dy = y - moon.y;
        const along = dx * ux + dy * uy;
        if (along >= 0 && along <= pulse.range) {
          const px = moon.x + ux * along;
          const py = moon.y + uy * along;
          clearance = Math.min(clearance, Math.hypot(x - px, y - py) - halfWidth - radius);
        } else {
          const endX = moon.x + ux * pulse.range;
          const endY = moon.y + uy * pulse.range;
          const tip = along < 0 ? Math.hypot(dx, dy) : Math.hypot(x - endX, y - endY);
          clearance = Math.min(clearance, tip - halfWidth - radius);
        }
      }
    }
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

/** Magnetopause — dish arc with optional solid hub; gap is the only safe lane through the rim. */
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
  const hub = config.hubRadius ?? 0;
  if (hub > 0) {
    const hubClear = dist - hub - radius;
    if (hubClear < 0) return near(hubClear);
  }
  const inner = Math.max(hub, config.innerRadius);
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

/**
 * Teleporting Portal — a portal that vanishes, then reappears at the next fixed
 * anchor. Spark never warps; players read the amber telegraph and time the throw
 * for when the portal is present again.
 */
export function teleportPortalPoseAtTime(
  config: TeleportPortalConfig,
  time: number,
): {
  x: number;
  y: number;
  radius: number;
  /** True while the portal is visible/passable at the current anchor. */
  present: boolean;
  /** True while vanished; amber telegraph shows the next reappear anchor. */
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
  return {
    x: cur.x,
    y: cur.y,
    radius: config.radius,
    present: !warning,
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
  const pose = teleportPortalPoseAtTime(config, time);
  // Vanished: sealed plane — nowhere to pass until the portal reappears.
  if (!pose.present) {
    return near(-radius);
  }
  // Present: fly through the portal; elsewhere on the plane is sealed.
  return near(pose.radius - Math.hypot(x - pose.x, y - pose.y) - radius);
}

/** Entry/Exit Portal — sealed relay; multi-disk = False Entries routing apertures. */
export type EntryExitDiskState = {
  x: number;
  y: number;
  /** Cyan true aperture. False = amber false entry. */
  trueEntry: boolean;
  /** Short telegraph before cyan advances to the next disk. */
  warning: boolean;
};

export type EntryExitState = {
  disks: EntryExitDiskState[];
  trueIndex: number;
  radius: number;
  exitX: number;
  exitY: number;
  warning: boolean;
};

export type EntryExitCrossing = 'true' | 'false' | 'wall';

export type EntryExitWarp = {
  x: number;
  y: number;
  kind: 'true' | 'false';
};

export function entryExitDisks(config: EntryExitPortalConfig): { x: number; y: number }[] {
  if (config.disks && config.disks.length > 0) return config.disks;
  return [{ x: config.entryX, y: config.entryY }];
}

export function entryExitIsMulti(config: EntryExitPortalConfig): boolean {
  return (config.disks?.length ?? 0) > 1;
}

export function entryExitStateAtTime(
  config: EntryExitPortalConfig,
  time: number,
): EntryExitState {
  const disks = entryExitDisks(config);
  const count = disks.length;
  const speed = config.speed ?? 0.55;
  const warningHold = Math.max(0.15, config.warningHold ?? 0.32);
  // Single disk is always the true entry.
  const local =
    count <= 1 ? 0 : (((time * speed + (config.phase ?? 0)) % count) + count) % count;
  const trueIndex = Math.floor(local);
  const frac = local - trueIndex;
  // Warning occupies the last warningHold seconds of each cyan dwell.
  const warning =
    count > 1 && frac >= Math.max(0.05, 1 - warningHold * speed);
  return {
    disks: disks.map((d, i) => ({
      x: d.x,
      y: d.y,
      trueEntry: i === trueIndex,
      warning: i === trueIndex && warning,
    })),
    trueIndex,
    radius: config.radius,
    exitX: config.exitX,
    exitY: config.exitY,
    warning,
  };
}

/** Classify a point on the relay plane using the same timing as collision. */
export function entryExitCrossingAt(
  config: EntryExitPortalConfig,
  time: number,
  x: number,
  y: number,
  radius: number,
): EntryExitCrossing {
  const state = entryExitStateAtTime(config, time);
  let bestI = -1;
  let bestClear = -Infinity;
  for (let i = 0; i < state.disks.length; i++) {
    const disk = state.disks[i]!;
    const clear = state.radius - Math.hypot(x - disk.x, y - disk.y) - radius;
    if (clear > bestClear) {
      bestClear = clear;
      bestI = i;
    }
  }
  if (bestI < 0 || bestClear < 0) return 'wall';
  return state.disks[bestI]!.trueEntry ? 'true' : 'false';
}

export function evaluateEntryExitCollision(
  config: EntryExitPortalConfig,
  time: number,
  x: number,
  y: number,
  radius: number,
): SampleHit {
  const kind = entryExitCrossingAt(config, time, x, y, radius);
  if (kind === 'true') {
    // Passable cyan aperture — Spark continues toward the destination beyond the wall.
    const state = entryExitStateAtTime(config, time);
    const disk = state.disks[state.trueIndex]!;
    return near(state.radius - Math.hypot(x - disk.x, y - disk.y) - radius);
  }
  // Amber false entry and sealed wall are both hits (Game picks distinct VFX).
  if (kind === 'false') {
    return { hit: true, clearance: -0.08, nearMiss: false };
  }
  // Distance to nearest aperture as wall depth.
  const state = entryExitStateAtTime(config, time);
  let best = -Infinity;
  for (const disk of state.disks) {
    best = Math.max(best, state.radius - Math.hypot(x - disk.x, y - disk.y) - radius);
  }
  return near(best);
}

/** Authored destination — aim preview / single-disk legacy warp. */
export function entryExitWarpTarget(config: EntryExitPortalConfig): { x: number; y: number } {
  return { x: config.exitX, y: config.exitY };
}

/**
 * Cyan aperture redirects Spark toward the destination portal (exitX/exitY).
 * Amber / seal never call this — they are hits.
 */
export function entryExitWarpAt(
  config: EntryExitPortalConfig,
  time: number,
  x: number,
  y: number,
): EntryExitWarp | null {
  const kind = entryExitCrossingAt(config, time, x, y, 0);
  if (kind !== 'true') return null;
  return { x: config.exitX, y: config.exitY, kind: 'true' };
}

/** The Null — dark field with one drifting safe hole (Moving Safe Zone pattern). */
export function theNullSafeAtTime(
  config: TheNullConfig,
  time: number,
): { x: number; y: number; radius: number } {
  const drift = time * config.driftSpeed + (config.phase ?? 0);
  return {
    x: config.baseX + Math.cos(drift) * config.driftAmplitudeX,
    y: config.baseY + Math.sin(drift * 1.1) * config.driftAmplitudeY,
    radius: config.holeRadius,
  };
}

export function evaluateTheNullCollision(
  config: TheNullConfig,
  time: number,
  x: number,
  y: number,
  radius: number,
): SampleHit {
  const safe = theNullSafeAtTime(config, time);
  const fieldDist = Math.hypot(x - config.centerX, y - config.centerY);
  if (fieldDist > config.fieldRadius + radius) {
    return near(fieldDist - config.fieldRadius - radius);
  }
  const distHole = Math.hypot(x - safe.x, y - safe.y);
  return near(safe.radius - distHole - radius);
}
