/**
 * Isolation remaps for new library obstacle families.
 * Placement follows docs/CURSOR-OBSTACLE-STORY-PLACEMENT.md (recapture story).
 * Preserves level IDs, rewards, finales and save progress.
 */

import type { CampaignLevelDefinition } from '../types';
import type { ObstacleConfig } from '../../config/ObstacleConfig';

export const LIBRARY_LESSONS: Record<number, { name: string; body: string; hint: string }> = {
  6: {
    name: 'Piston Field',
    body: "The chamber's pumping machinery leaves a route out.",
    hint: 'Floor rams thrust upward — throw through a lane whose tip is still low when Spark arrives.',
  },
  9: {
    name: 'Elevator Blocks',
    body: 'The escape shaft still carries its captive cargo.',
    hint: 'Choose a lane at the actual crossing height, not where the block is now.',
  },
  10: {
    name: 'Reactive Gate',
    body: 'Security doors are channeling Spark back toward containment.',
    hint: 'Wait for the doors to part — amber means they are about to open.',
  },
  13: {
    name: 'Split Shutter',
    body: 'The final barriers seal behind the escaped specimen.',
    hint: 'Aim for the center gap at arrival — both halves move together.',
  },
  14: {
    name: 'Clock Hands',
    body: 'A retrieval unit sweeps the passage to the surface.',
    hint: 'Aim through the angular gap; both hands share one readable cycle.',
  },
  17: {
    name: 'Patrol Drones',
    body: 'Retrieval drones are searching the rooftops.',
    hint: 'Watch their patrol rhythm. Cross where the gap will be when Spark arrives.',
  },
  32: {
    name: 'Capture Pincers',
    body: 'A retrieval unit guards the climb above the city.',
    hint: 'The hinge sits above the path — throw through the open diamond below.',
  },
  33: {
    name: 'Solar Sail',
    body: 'Solar panels turn above the last rooftops.',
    hint: 'Wait until the panel is nearly edge-on; when it is open, the plane is clear.',
  },
  40: {
    name: 'Pulse Ring',
    body: 'A ring of charged air spreads through the storm.',
    hint: 'Throw straight through the center; the ring never closes the hub.',
  },
  47: {
    name: 'Rolling Aperture',
    body: 'At the edge of the atmosphere, a drifting opening offers passage.',
    hint: 'Track both size and position — aim where the opening will be.',
  },
  70: {
    name: 'Sequential Tunnel',
    body: 'An abandoned bulkhead still cycles its access ports.',
    hint: 'Aim only at the currently open hole — the others stay closed.',
  },
  71: {
    name: 'Moving Safe Zone',
    body: 'Something was once held inside this field. A clear pocket still drifts through it.',
    hint: 'Arrive inside the drifting safe hole, not where it was at launch.',
  },
  77: {
    name: 'Orbiting Lights',
    body: "Small lights circle nearby, drawn to Spark's glow.",
    hint: 'Watch the shared orbit and throw through the gap between them.',
  },
  78: {
    name: 'Magnetopause',
    body: 'A charged arc turns across the lunar passage.',
    hint: 'Aim through the open gap in the arc, or through the quiet inner hub.',
  },
  85: {
    name: 'Lagrange Null',
    body: 'Beyond the Moon, a quiet pocket interrupts the glow.',
    hint: 'Fly through the dark pocket — wind and pull cancel inside it.',
  },
  86: {
    name: 'Corkscrew Tunnel',
    body: 'A forgotten transit ring turns in the darkness.',
    hint: 'Aim through the open hub or the wide gap in the ring — not like thin rotor blades.',
  },
  92: {
    name: 'Comet Crossing',
    body: "An icy traveler crosses Spark's path.",
    hint: 'Read the loop and throw when the comet is clear of center.',
  },
  93: {
    name: 'Accretion Shredder',
    body: "Drawn to Spark's light, small creatures spiral through the debris.",
    hint: 'Throw through the quiet center while the fragments spiral past.',
  },
  100: {
    name: 'Speed Field',
    body: 'A luminous current carries Spark faster.',
    hint: 'The preview uses the same multiplier — commit knowing the arrival will come sooner.',
  },
  101: {
    name: 'Pulsar Beam',
    body: 'A distant star sends pulses across the route.',
    hint: 'Throw while the beam is dark, or stay clear of its band while it is bright.',
  },
  112: {
    name: 'The Null',
    body: 'The darkness presses against a remaining opening of light.',
    hint: 'Throw through the bright safe hole before the field closes around it.',
  },
  117: {
    name: 'Teleporting Portal',
    body: 'The familiar beacon shifts between relay anchors.',
    hint: 'Pass through the current opening; amber warns of the next anchor before it swaps.',
  },
  118: {
    name: 'Entry / Exit Portal',
    body: 'The beacon leads onward. This is not home.',
    hint: 'Hit the green entry disk; Spark relocates toward the cyan exit before continuing.',
  },
};

function piston(z: number): ObstacleConfig {
  return {
    type: 'pistonField',
    z,
    laneCount: 4,
    spacing: 1.4,
    // Floor rams: retracted tips stay under the flight band; extended tips cross ~y=3.
    floorY: 0.12,
    clearY: 2.15,
    pistonHeight: 0.48,
    minExtension: 0.12,
    maxExtension: 3.35,
    speed: 0.8,
    halfWidth: 0.36,
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

  if (n === 6) obstacles = [piston(5.8)];
  else if (n === 9) obstacles = [elevators(6)];
  else if (n === 10) obstacles = [reactiveGate(6)];
  else if (n === 13) obstacles = [splitShutter(5.9)];
  else if (n === 14) obstacles = [clocks(6.1)];
  else if (n === 17) obstacles = [conveyorGate(6)];
  else if (n === 32) obstacles = [scissor(6)];
  else if (n === 33) obstacles = [solarSail(6)];
  else if (n === 40) obstacles = [pulse(6)];
  else if (n === 47) obstacles = [rollingAperture(6.1)];
  else if (n === 70) obstacles = [sequentialTunnel(6)];
  else if (n === 71) obstacles = [movingSafeZone(6)];
  else if (n === 77) obstacles = [orbitingMoons(6)];
  else if (n === 78) obstacles = [magnetopause(6)];
  else if (n === 85) {
    obstacles = [lagrangeNull(5.8)];
    // Side pull that the null cancels — teaches force nullification, not lethality.
    level.gravityWells = [{ x: 1.15, y: 3.05, z: 5.8, strength: 1.35, radius: 3.4 }];
  } else if (n === 86) obstacles = [corkscrew(6)];
  else if (n === 92) obstacles = [comet(6.2)];
  else if (n === 93) obstacles = [accretion(6)];
  else if (n === 100) {
    obstacles = [speed(5.6, 1.35)];
    target.radius = 1.05;
  } else if (n === 101) obstacles = [pulsar(6)];
  else if (n === 112) obstacles = [theNull(6)];
  else if (n === 117) obstacles = [teleportPortal(6)];
  else if (n === 118) {
    obstacles = [entryExit(6)];
    target.x = 0.85;
    target.y = 3.25;
  }

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
