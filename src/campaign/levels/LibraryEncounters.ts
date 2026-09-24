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
    hint: 'Cyan is the open window — amber means the halves are about to slam.',
  },
  14: {
    name: 'Retrieval Scanner',
    body: 'A retrieval unit sweeps the passage to the surface.',
    hint: 'The gap looks safe — amber means one arm is about to slam shut.',
  },
  17: {
    name: 'Patrol Drones',
    body: 'Retrieval drones are searching the rooftops.',
    hint: 'Watch their patrol rhythm. Cross where the gap will be when Spark arrives.',
  },
  19: {
    name: 'Billboard Flip',
    body: 'A rooftop ad board swings across the climb.',
    hint: 'Face-on is a wall — wait until the board turns edge-on and the lane goes cyan.',
  },
  21: {
    name: 'Capture Pincers',
    body: 'Retrieval pincers scissor shut across the rooftop lane.',
    hint: 'The hinge sits above the path — throw through the open diamond before it seals.',
  },
  32: {
    name: 'Ground Cutters',
    body: 'Defense lasers rake up from the street to cut Spark off from the portal.',
    hint: 'Beams fan open, then cross — slip through while the corridor is clear.',
  },
  33: {
    name: 'Rotating Gate',
    body: 'A security aperture turns across the climb above the city.',
    hint: 'Follow the cyan sector — aim where the opening will be when Spark arrives.',
  },
  40: {
    name: 'Pulse Ring',
    body: 'A ring of charged air spreads through the storm.',
    hint: 'The safe eye drifts — lead it, or time the shockwave as it sweeps the lane.',
  },
  47: {
    name: 'Rolling Aperture',
    body: 'At the edge of the atmosphere, a drifting opening offers passage.',
    hint: 'Track both size and position — aim where the opening will be.',
  },
  48: {
    name: 'Docking Collar',
    body: 'A transfer hatch clamps shut across the climb into orbit.',
    hint: 'Cyan opens the hatch — amber means the jaws are about to slam.',
  },
  64: {
    name: 'Orbital Debris',
    body: 'Loose plating drifts across the station approach.',
    hint: 'Lead the wreck chunk — aim where the gap will be when Spark arrives.',
  },
  70: {
    name: 'Energy Field',
    body: 'A flowing energy curtain bars the route — only one opening stays clear.',
    hint: 'Lead the cyan circle — aim where the opening will be when Spark arrives, not where it is now.',
  },
  71: {
    name: 'Wreck Field',
    body: 'A damaged containment pocket still drifts through the wreckage.',
    hint: 'Arrive inside the amber safe hole, not where it was at launch.',
  },
  76: {
    name: 'Survey Boom',
    body: 'A lunar survey boom sweeps the approach from its mast.',
    hint: 'Let the counterweight pass, then throw through the open arc under the boom.',
  },
  77: {
    name: 'Relay Beacons',
    body: 'Beacons circle the lunar approach and fire survey lasers outward.',
    hint: 'Throw through a gap between beacons — amber means the lasers are about to fire.',
  },
  85: {
    name: 'Wreck Drift',
    body: 'A heavy fragment tumbles through the quiet dark.',
    hint: 'Lead the wreck — a straight center throw will hit it.',
  },
  86: {
    name: 'Transit Conduit',
    body: 'A forgotten transit conduit turns in the darkness — only one sector stays open.',
    hint: 'Follow the open sector — aim where the gap will be when Spark arrives, not the center.',
  },
  92: {
    name: 'Belt Rock',
    body: 'A heavy asteroid tumbles through the denser lane.',
    hint: 'Lead the rock on its orbit — a center throw only works when it is clear.',
  },
  93: {
    name: 'Debris Spiral',
    body: 'Rock and ice shards spiral through the belt.',
    hint: 'Throw through the quiet center while the fragments spiral past.',
  },
  94: {
    name: 'Shear Lane',
    body: 'Two debris currents shear past each other through denser rock.',
    hint: 'Stay in the quiet band between the streams — upper and lower rocks move opposite ways.',
  },
  100: {
    name: 'Repulsor',
    body: 'A push orb forces Spark away from its core.',
    hint: 'Aim wide of the metal core — the amber rings shove Spark outward.',
  },
  101: {
    name: 'Security Sweep',
    body: 'Station lasers still pulse across the empty route.',
    hint: 'Throw while the beams are dark, or slip through a gap while they are bright.',
  },
  111: {
    name: 'Null Tendril',
    body: 'Null tastes the path — dark purple tendrils coil and leave one corridor of light.',
    hint: 'Throw through the violet gap before the tendrils seal it shut.',
  },
  112: {
    name: 'Null Lash',
    body: 'A tendril coils above the escape route, then whips through it.',
    hint: 'Violet means the strike is coming — throw through the open lane while it is still coiled.',
  },
  113: {
    name: 'The Null',
    body: 'The light-eater fills the void. Only a drifting eye of light remains.',
    hint: 'Lead the bright safe hole — aim where it will be when Spark arrives, not where it is now.',
  },
  117: {
    name: 'Teleporting Portal',
    body: 'The destination portal vanishes, then reappears at another relay anchor.',
    hint: 'Watch where the portal reappears — aim there and time the throw to enter it.',
  },
  118: {
    name: 'False Entries',
    body: 'Three floating apertures — only the cyan well routes Spark to the portal beyond. Amber sends you the wrong way.',
    hint: 'Watch the cyan aperture cycle, aim for where it will be, and power the throw so Spark arrives while it is still cyan.',
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
    speed: 1,
    hubRadius: 0.2,
    motionMode: 'snapClose',
    driftSpeed: 0.2,
    snapOpenHold: 1.25,
    snapWarningHold: 0.3,
    snapSlamDuration: 0.14,
    snapClosedHold: 0.45,
    snapOpenDuration: 0.35,
    snapOpenGap: Math.PI * 0.62,
    snapClosedGap: 0.18,
  };
}

function pulse(z: number): ObstacleConfig {
  return {
    type: 'pulseRing',
    z,
    centerX: 0,
    centerY: 3.05,
    minRadius: 0.72,
    maxRadius: 2.55,
    thickness: 0.15,
    // Fast shockwave + drifting eye so a dead-center throw is no longer free.
    speed: 0.78,
    driftAmplitude: 1.05,
    driftSpeed: 0.62,
  };
}

function groundCutters(z: number): ObstacleConfig {
  return {
    type: 'groundCutLasers',
    z,
    // Origins fully below the frame, pitched up through the climb in 3D.
    floorY: -3.4,
    ceilingY: 5.6,
    centerX: -0.15,
    spanX: 2.35,
    beamCount: 3,
    thickness: 0.06,
    speed: 0.48,
    fanAngle: 0.58,
    aimX: 0.45,
    crossDuty: 0.36,
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
    // Must seal below projectile diameter (~0.44) or the center lane is always free.
    minGap: 0.1,
    maxGap: 2.35,
    speed: 1,
    closedHold: 0.55,
    openingDuration: 0.26,
    openHold: 0.4,
    warningHold: 0.22,
    slamDuration: 0.16,
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

function billboardFlip(z: number): ObstacleConfig {
  return {
    type: 'billboardFlip',
    z,
    centerX: 0,
    centerY: 3,
    halfWidth: 1.55,
    halfHeight: 1.05,
    halfDepth: 0.08,
    maxAngle: Math.PI * 0.5,
    openAngle: 1.0,
    speed: 0.58,
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

function dockingCollar(z: number): ObstacleConfig {
  return {
    type: 'dockingCollar',
    z,
    centerX: 0,
    centerY: 3,
    outerRadius: 2.15,
    openRadius: 1.15,
    closedRadius: 0.12,
    speed: 0.95,
    closedHold: 0.5,
    openingDuration: 0.35,
    openHold: 0.85,
    warningHold: 0.32,
    slamDuration: 0.18,
  };
}

function corkscrew(z: number): ObstacleConfig {
  return {
    type: 'corkscrewTunnel',
    z,
    centerX: 0,
    centerY: 3,
    radius: 1.85,
    // Narrow sector — hub is solid so center throws fail.
    gapWidth: 0.82,
    innerRadius: 0.28,
    speed: 0.72,
    helixStep: 0.55,
    segmentIndex: 0,
  };
}

function beltRock(z: number): ObstacleConfig {
  // Offset orbit so the rock sweeps across the center lane (unlike a hub-centered circle).
  return {
    type: 'orbiter',
    z,
    centerX: 0.9,
    centerY: 3.15,
    orbitRadius: 1.2,
    blockerRadius: 0.48,
    speed: 0.58,
  };
}

/** Lunar survey boom — pendulum antenna with hull mount. */
function surveyBoom(z: number): ObstacleConfig {
  return {
    type: 'pendulum',
    z,
    pivotX: 0,
    pivotY: 5.15,
    length: 2.15,
    blockerRadius: 0.36,
    maxAngle: 0.72,
    speed: 0.62,
  };
}

function orbitingMoons(z: number): ObstacleConfig {
  return {
    type: 'orbitingMoons',
    z,
    centerX: 0,
    centerY: 3,
    orbitRadius: 1.35,
    moonRadius: 0.38,
    moonCount: 3,
    speed: 0.68,
    beaconPulse: {
      kind: 'laser',
      range: 1.35,
      speed: 0.9,
      offHold: 0.7,
      warningHold: 0.35,
      onHold: 0.55,
      thickness: 0.09,
    },
  };
}

function deadAirlock(z: number): ObstacleConfig {
  return energyShell(z);
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

function shearLane(z: number): ObstacleConfig {
  return {
    type: 'shearLane',
    z,
    centerX: 0,
    centerY: 3,
    gapHeight: 0.9,
    blockCount: 4,
    blockRadius: 0.34,
    wrapWidth: 6.4,
    speed: 0.78,
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

function climbRing(z: number): ObstacleConfig {
  return {
    type: 'rotatingGate',
    z,
    centerX: 0,
    centerY: 3.05,
    outerRadius: 1.9,
    innerRadius: 0.28,
    // Narrower cyan sector so timing matters — hub is no longer a free pass.
    gapWidth: 0.78,
    speed: 0.85,
  };
}

function capturePincers(z: number): ObstacleConfig {
  return {
    type: 'scissorGate',
    z,
    centerX: 0,
    centerY: 3.55,
    barLength: 1.85,
    barThickness: 0.1,
    maxAngle: 0.72,
    minAngle: 0.1,
    speed: 0.78,
    pattern: 'sine',
  };
}

function energyShell(z: number): ObstacleConfig {
  return {
    type: 'energyField',
    z,
    centerX: 0,
    centerY: 3.05,
    // Full device / playable band — no going around the curtain.
    halfWidth: 2.55,
    halfHeight: 2.05,
    holeRadius: 0.88,
    driftAmplitudeX: 1.2,
    driftAmplitudeY: 0.08,
    driftSpeed: 0.52,
    speed: 0.52,
  };
}

function pushOrb(z: number): ObstacleConfig {
  return {
    type: 'repulsor',
    z,
    centerX: 0.15,
    centerY: 3.05,
    coreRadius: 0.48,
    fieldRadius: 2.65,
    strength: 14,
    pulseSpeed: 1.15,
  };
}

function nullTendrils(z: number): ObstacleConfig {
  return {
    type: 'nullTendril',
    z,
    centerX: 0,
    centerY: 3,
    outerRadius: 2.15,
    innerRadius: 0.45,
    tendrilCount: 5,
    gapWidth: 0.95,
    speed: 0.55,
  };
}

function nullLash(z: number): ObstacleConfig {
  return {
    type: 'nullLash',
    z,
    // Pivot above center — coils up-right, then hangs straight down through the flight band.
    pivotX: 0,
    pivotY: 4.75,
    length: 2.6,
    thickness: 0.18,
    restAngle: 0.95,
    // End at −π/2 so the spine is a vertical bar across the corridor while extended.
    lashSpan: -Math.PI / 2 - 0.95,
    speed: 1.05,
    coiledHold: 0.48,
    warningHold: 0.26,
    lashDuration: 0.2,
    extendedHold: 0.75,
    retractDuration: 0.38,
  };
}

function magnetopause(z: number): ObstacleConfig {
  return {
    type: 'magnetopause',
    z,
    centerX: 0,
    centerY: 3,
    innerRadius: 0.55,
    outerRadius: 1.85,
    gapWidth: 1.05,
    speed: 0.48,
    hubRadius: 0.55,
  };
}

function wreckDrift(z: number): ObstacleConfig {
  return {
    type: 'driftingBlocker',
    z,
    baseX: 0,
    baseY: 3.05,
    blockerRadius: 0.48,
    amplitudeX: 0.95,
    amplitudeY: 0.55,
    speed: 0.62,
  };
}

function securitySweep(z: number): ObstacleConfig {
  return {
    type: 'laserGrid',
    z,
    orientation: 'vertical',
    pattern: 'VERTICAL_WAVE',
    beamCount: 4,
    spacing: 1.2,
    span: 4.2,
    thickness: 0.06,
    amplitude: 0.22,
    speed: 0.55,
    phaseOffset: 0.7,
    mode: 'pulse',
    pulseSpeed: 0.85,
    onRatio: 0.48,
  };
}

function orbitalDebris(z: number): ObstacleConfig {
  return {
    type: 'driftingBlocker',
    z,
    baseX: 0,
    baseY: 3.05,
    blockerRadius: 0.42,
    amplitudeX: 1.05,
    amplitudeY: 0.4,
    speed: 0.58,
  };
}

/** Destination sits above the aperture band; Game randomizes left/center/right each play. */
function entryExit(z: number): ObstacleConfig {
  return {
    type: 'entryExitPortal',
    z,
    entryX: 0,
    entryY: 3.05,
    exitX: 0,
    exitY: 4.9,
    radius: 0.62,
    disks: [
      { x: -1.35, y: 3.05 },
      { x: 0, y: 3.05 },
      { x: 1.35, y: 3.05 },
    ],
    speed: 0.48,
    phase: 0.1,
    warningHold: 0.32,
    destinationDepth: 5.6,
  };
}

function theNull(z: number): ObstacleConfig {
  return {
    type: 'theNull',
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

/** Deliberate isolation courses; preserve ids/rewards/world exits. */
export function applyLibraryEncounters(source: CampaignLevelDefinition): CampaignLevelDefinition {
  const lesson = LIBRARY_LESSONS[source.levelNumber];
  if (!lesson) return source;
  const level: CampaignLevelDefinition = JSON.parse(JSON.stringify(source));
  const n = level.levelNumber;
  let obstacles: ObstacleConfig[] = [];
  const target: CampaignLevelDefinition['challenge']['target'] = {
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
  else if (n === 19) obstacles = [billboardFlip(6)];
  else if (n === 21) {
    obstacles = [capturePincers(6)];
    target.y = 3.1;
  } else if (n === 32) {
    obstacles = [groundCutters(6)];
    target.x = 0.55;
    target.y = 3.1;
    target.radius = 1.05;
  } else if (n === 33) obstacles = [climbRing(6)];
  else if (n === 40) obstacles = [pulse(6)];
  else if (n === 47) obstacles = [rollingAperture(6.1)];
  else if (n === 48) obstacles = [dockingCollar(6)];
  else if (n === 64) obstacles = [orbitalDebris(6)];
  else if (n === 70) obstacles = [deadAirlock(6)];
  else if (n === 71) obstacles = [movingSafeZone(6)];
  else if (n === 76) {
    obstacles = [surveyBoom(6)];
    target.x = 0;
    target.y = 3;
    target.radius = 1.08;
  } else if (n === 77) obstacles = [orbitingMoons(6)];
  else if (n === 85) {
    obstacles = [wreckDrift(6)];
    level.windX = 0.32;
  } else if (n === 86) obstacles = [corkscrew(6)];
  else if (n === 92) obstacles = [beltRock(6.2)];
  else if (n === 93) obstacles = [accretion(6)];
  else if (n === 94) obstacles = [shearLane(6)];
  else if (n === 100) {
    obstacles = [pushOrb(5.8)];
    target.x = -0.85;
    target.radius = 1.05;
  } else if (n === 101) obstacles = [securitySweep(6)];
  else if (n === 111) obstacles = [nullTendrils(6)];
  else if (n === 112) {
    obstacles = [nullLash(6)];
    // Aim through the open arc while coiled — left of the resting tip.
    target.x = -0.55;
    target.y = 3.05;
  } else if (n === 113) obstacles = [theNull(6)];
  else if (n === 117) {
    // No mid-course hazard — the destination portal itself vanishes and reappears.
    obstacles = [];
    target.x = 0;
    target.y = 3;
    target.movement = {
      type: 'teleport',
      anchors: [
        { x: 0, y: 3 },
        { x: -1.1, y: 3.35 },
        { x: 1.1, y: 2.7 },
      ],
      dwell: 1.1,
      vanish: 0.55,
      speed: 1,
    };
  } else if (n === 118) {
    const portal = entryExit(6);
    obstacles = [portal];
    // Destination portal — higher than the wall apertures; side randomized per play in Game.
    if (portal.type === 'entryExitPortal') {
      target.x = portal.exitX;
      target.y = portal.exitY;
      target.z = portal.z + (portal.destinationDepth ?? 5.6);
      target.radius = 1.15;
    }
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
