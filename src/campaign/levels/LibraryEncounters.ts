/**
 * Isolation remaps for new library obstacle families.
 * Preserves level IDs, world exits and save progress (same pattern as NewEncounters).
 * Remaps sit in early Journey chapters so every family is playable before polish.
 * Authored for Original Spark (ball r≈0.22) with a clear center path.
 */

import type { CampaignLevelDefinition } from '../types';
import type { ObstacleConfig } from '../../config/ObstacleConfig';

export const LIBRARY_LESSONS: Record<number, { name: string; body: string; hint: string }> = {
  13: {
    name: 'Piston Field',
    body: 'Containment pistons extend and retract on offset phases.',
    hint: 'Read which lane is open when Spark arrives — do not aim at a fully extended piston.',
  },
  14: {
    name: 'Split Shutter',
    body: 'Two panels part and meet on a shared cycle.',
    hint: 'Aim for the center gap at arrival — both halves move together.',
  },
  17: {
    name: 'Orbiting Moons',
    body: 'Compact moons share one circular orbit around a fixed center.',
    hint: 'Watch the loop and throw through the gap between moons.',
  },
  18: {
    name: 'Sequential Tunnel',
    body: 'One aperture opens at a time across a shared cycle.',
    hint: 'Aim only at the currently open hole — the others stay closed.',
  },
  19: {
    name: 'Elevator Blocks',
    body: 'City platforms rise and fall in timed columns.',
    hint: 'Choose a lane at the actual crossing height, not where the block is now.',
  },
  20: {
    name: 'Reactive Gate',
    body: 'Paired doors telegraph closed, amber warning, then open.',
    hint: 'Wait for the doors to part — amber means they are about to open.',
  },
  21: {
    name: 'Corkscrew Tunnel',
    body: 'A ring wall turns with one open sector — unlike thin rotor blades, this is a tunnel mouth.',
    hint: 'Aim through the open hub or the wide rotating gap in the ring, not at the solid band.',
  },
  23: {
    name: 'Moving Safe Zone',
    body: 'A dangerous field leaves one drifting safe hole.',
    hint: 'Track the green hole — arrive inside it, not where it was at launch.',
  },
  25: {
    name: 'Comet Crossing',
    body: 'A compact blocker loops across the flight line on a diagonal.',
    hint: 'Read the loop and throw through when the comet is clear of center.',
  },
  26: {
    name: 'Scissor Gate',
    body: 'Two bars pivot together and apart around one hinge pair.',
    hint: 'The center diamond always stays open — time a wider aperture if you want more room.',
  },
  27: {
    name: 'Accretion Shredder',
    body: 'Debris spirals inward; the center lane stays clearer than the rim.',
    hint: 'Throw through the quiet center while the fragments spiral past.',
  },
  28: {
    name: 'Speed Field',
    body: 'A marked volume multiplies Spark speed while inside.',
    hint: 'The preview uses the same multiplier — commit knowing the arrival will come sooner.',
  },
  29: {
    name: 'Pulsar Beam',
    body: 'A wide beam pulses on and off across a fixed plane.',
    hint: 'Throw while the beam is dark, or stay clear of its band while it is bright.',
  },
  31: {
    name: 'Solar Sail',
    body: 'A broad panel swings open like a solar array.',
    hint: 'Wait until the sail lifts edge-on, then throw through the open plane.',
  },
  32: {
    name: 'Magnetopause',
    body: 'A sheath ring turns with one open sector.',
    hint: 'Aim through the open gap in the arc, or through the quiet inner hub.',
  },
  33: {
    name: 'Lagrange Null',
    body: 'A calm dark pocket cancels nearby force effects.',
    hint: 'Fly through the null — it is not lethal; use it to quiet a pull you can see.',
  },
  34: {
    name: 'Conveyor Gate',
    body: 'Blockers stream sideways and wrap across the plane.',
    hint: 'Lead the gap — predict where clear space will be when Spark arrives.',
  },
  35: {
    name: 'Clock Hands',
    body: 'Long rotating arms sweep a fixed plane.',
    hint: 'Aim through the angular gap; both hands share one readable cycle.',
  },
  36: {
    name: 'Pulse Ring',
    body: 'An expanding ring cycles outward then resets — the hub stays safe.',
    hint: 'Throw straight through the center; the ring never closes the hub.',
  },
  37: {
    name: 'Rolling Aperture',
    body: 'A drifting iris expands and contracts while sliding.',
    hint: 'Track both size and position — aim where the opening will be.',
  },
  38: {
    name: 'Teleporting Portal',
    body: 'The opening jumps among fixed anchors after a warning flash.',
    hint: 'Aim where the portal will be at arrival — amber marks the next stop.',
  },
  39: {
    name: 'Entry / Exit Portal',
    body: 'Pass the green entry to warp toward the cyan exit marker.',
    hint: 'Hit the green entry disk; Spark relocates toward the exit before continuing.',
  },
  40: {
    name: 'The Null',
    body: 'A light-eating field shrinks the safe route — escape, do not fight.',
    hint: 'Throw through the bright safe hole before the field closes around it.',
  },
};

function piston(z: number): ObstacleConfig {
  return {
    type: 'pistonField',
    z,
    laneCount: 4,
    spacing: 1.4,
    maxExtension: 1.2,
    minExtension: 0.08,
    speed: 0.8,
    centerY: 3,
    halfWidth: 0.36,
    pistonHeight: 0.42,
  };
}

function elevators(z: number): ObstacleConfig {
  return {
    type: 'elevatorBlocks',
    z,
    laneCount: 3,
    spacing: 1.7,
    baseY: 3,
    amplitude: 0.75,
    speed: 0.7,
    blockWidth: 0.85,
    blockHeight: 0.55,
  };
}

function clocks(z: number): ObstacleConfig {
  return {
    type: 'clockHands',
    z,
    hubX: 0,
    hubY: 4.05,
    length: 1.9,
    thickness: 0.09,
    handCount: 2,
    speed: 0.35,
    hubRadius: 0.2,
  };
}

function pulse(z: number): ObstacleConfig {
  return {
    type: 'pulseRing',
    z,
    centerX: 0,
    centerY: 3,
    minRadius: 0.95,
    maxRadius: 2.4,
    thickness: 0.11,
    speed: 0.32,
  };
}

function scissor(z: number): ObstacleConfig {
  return {
    type: 'scissorGate',
    z,
    centerX: 0,
    centerY: 4.2,
    barLength: 1.65,
    barThickness: 0.09,
    minAngle: 0.42,
    maxAngle: 0.85,
    speed: 0.55,
  };
}

function speed(z: number, multiplier: number): ObstacleConfig {
  return {
    type: 'speedField',
    z,
    centerX: 0,
    centerY: 3,
    width: 2.8,
    height: 2.6,
    speedMultiplier: multiplier,
    pulseSpeed: 1.0,
  };
}

function splitShutter(z: number): ObstacleConfig {
  return {
    type: 'splitShutter',
    z,
    centerX: 0,
    centerY: 3,
    panelWidth: 1.45,
    panelHeight: 2.4,
    minGap: 0.95,
    maxGap: 2.3,
    speed: 0.75,
  };
}

function reactiveGate(z: number): ObstacleConfig {
  return {
    type: 'reactiveGate',
    z,
    centerX: 0,
    centerY: 3,
    closedWidth: 0.08,
    openWidth: 2.35,
    openHeight: 2.5,
    speed: 0.85,
    closedHold: 0.7,
    warningHold: 0.4,
    openHold: 1.15,
  };
}

function conveyorGate(z: number): ObstacleConfig {
  return {
    type: 'conveyorGate',
    z,
    centerX: 0,
    centerY: 3,
    blockCount: 3,
    blockRadius: 0.3,
    wrapWidth: 5.8,
    speed: 0.7,
  };
}

function rollingAperture(z: number): ObstacleConfig {
  return {
    type: 'rollingAperture',
    z,
    baseX: 0,
    baseY: 3,
    minRadius: 1.05,
    maxRadius: 1.6,
    pulseSpeed: 0.55,
    driftSpeed: 0.28,
    driftAmplitudeX: 0.32,
    driftAmplitudeY: 0.18,
  };
}

function corkscrew(z: number): ObstacleConfig {
  return {
    type: 'corkscrewTunnel',
    z,
    centerX: 0,
    centerY: 3,
    radius: 1.75,
    gapWidth: 2.3,
    innerRadius: 0.85,
    speed: 0.38,
    helixStep: 0.55,
    segmentIndex: 0,
  };
}

function comet(z: number): ObstacleConfig {
  return {
    type: 'cometCrossing',
    z,
    startX: -2.4,
    startY: 2.15,
    endX: 2.4,
    endY: 3.95,
    blockerRadius: 0.38,
    speed: 0.32,
  };
}

function orbitingMoons(z: number): ObstacleConfig {
  return {
    type: 'orbitingMoons',
    z,
    centerX: 0,
    centerY: 3,
    orbitRadius: 1.55,
    moonRadius: 0.32,
    moonCount: 3,
    speed: 0.55,
  };
}

function sequentialTunnel(z: number): ObstacleConfig {
  return {
    type: 'sequentialTunnel',
    z,
    centerX: 0,
    centerY: 3,
    apertureCount: 3,
    apertureRadius: 0.95,
    spacing: 1.55,
    speed: 0.45,
  };
}

function movingSafeZone(z: number): ObstacleConfig {
  return {
    type: 'movingSafeZone',
    z,
    centerX: 0,
    centerY: 3,
    fieldRadius: 2.2,
    holeRadius: 0.95,
    baseX: 0,
    baseY: 3,
    driftSpeed: 0.55,
    driftAmplitudeX: 0.55,
    driftAmplitudeY: 0.35,
  };
}

function accretion(z: number): ObstacleConfig {
  return {
    type: 'accretionShredder',
    z,
    centerX: 0,
    centerY: 3,
    outerRadius: 2.1,
    debrisCount: 7,
    debrisRadius: 0.22,
    speed: 0.4,
    turns: 1.4,
  };
}

function pulsar(z: number): ObstacleConfig {
  return {
    type: 'pulsarBeam',
    z,
    centerX: 0,
    centerY: 3,
    halfWidth: 0.55,
    orientation: 'vertical',
    speed: 1,
    onHold: 0.55,
    offHold: 0.95,
  };
}

function solarSail(z: number): ObstacleConfig {
  return {
    type: 'solarSail',
    z,
    centerX: 0,
    centerY: 3,
    halfWidth: 1.6,
    halfHeight: 0.35,
    maxAngle: 1.15,
    openAngle: 0.85,
    speed: 0.7,
  };
}

function magnetopause(z: number): ObstacleConfig {
  return {
    type: 'magnetopause',
    z,
    centerX: 0,
    centerY: 3,
    innerRadius: 0.75,
    outerRadius: 1.85,
    gapWidth: 1.9,
    speed: 0.4,
  };
}

function lagrangeNull(z: number): ObstacleConfig {
  return {
    type: 'lagrangeNull',
    z,
    centerX: 0,
    centerY: 3,
    radius: 1.15,
  };
}

function teleportPortal(z: number): ObstacleConfig {
  return {
    type: 'teleportPortal',
    z,
    anchors: [
      { x: 0, y: 3 },
      { x: -1.1, y: 3.35 },
      { x: 1.1, y: 2.7 },
    ],
    radius: 0.95,
    speed: 1,
    dwell: 1.1,
    warning: 0.35,
  };
}

function entryExit(z: number): ObstacleConfig {
  return {
    type: 'entryExitPortal',
    z,
    entryX: 0,
    entryY: 3,
    exitX: 0.85,
    exitY: 3.25,
    radius: 0.95,
  };
}

function theNull(z: number): ObstacleConfig {
  return {
    type: 'theNull',
    z,
    centerX: 0,
    centerY: 3,
    fieldRadius: 2.15,
    minSafeRadius: 0.85,
    maxSafeRadius: 1.25,
    speed: 0.65,
  };
}

/** Deliberate isolation courses; preserve ids/rewards/world exits. */
export function applyLibraryEncounters(source: CampaignLevelDefinition): CampaignLevelDefinition {
  const lesson = LIBRARY_LESSONS[source.levelNumber];
  if (!lesson) return source;
  const level: CampaignLevelDefinition = JSON.parse(JSON.stringify(source));
  const n = level.levelNumber;
  let obstacles: ObstacleConfig[] = [];
  const target = {
    x: 0,
    y: 3.05,
    z: Math.max(level.challenge.target.z ?? 12, 12),
    radius: Math.max(level.challenge.target.radius ?? 1.05, 1.05),
  };
  level.windX = 0;
  level.gravityScale = 1;
  level.gravityWells = [];

  if (n === 13) obstacles = [piston(5.8)];
  else if (n === 14) obstacles = [splitShutter(5.9)];
  else if (n === 17) obstacles = [orbitingMoons(6)];
  else if (n === 18) obstacles = [sequentialTunnel(6)];
  else if (n === 19) obstacles = [elevators(6)];
  else if (n === 20) obstacles = [reactiveGate(6)];
  else if (n === 21) obstacles = [corkscrew(6)];
  else if (n === 23) obstacles = [movingSafeZone(6)];
  else if (n === 25) obstacles = [comet(6.2)];
  else if (n === 26) obstacles = [scissor(6)];
  else if (n === 27) obstacles = [accretion(6)];
  else if (n === 28) {
    obstacles = [speed(5.6, 1.35)];
    target.radius = 1.05;
  } else if (n === 29) obstacles = [pulsar(6)];
  else if (n === 31) obstacles = [solarSail(6)];
  else if (n === 32) obstacles = [magnetopause(6)];
  else if (n === 33) obstacles = [lagrangeNull(5.8)];
  else if (n === 34) obstacles = [conveyorGate(6)];
  else if (n === 35) obstacles = [clocks(6.1)];
  else if (n === 36) obstacles = [pulse(6)];
  else if (n === 37) obstacles = [rollingAperture(6.1)];
  else if (n === 38) obstacles = [teleportPortal(6)];
  else if (n === 39) {
    obstacles = [entryExit(6)];
    target.x = 0.85;
    target.y = 3.25;
  } else if (n === 40) obstacles = [theNull(6)];

  level.tutorialHint = lesson.hint;
  level.storyBeat = lesson.body;
  level.challenge = {
    ...level.challenge,
    template: 'COMBINED_HAZARD',
    obstacles,
    target,
    ricochet: undefined,
    tags: [...(level.challenge.tags ?? []), 'library-encounter', lesson.name],
  };
  return level;
}
