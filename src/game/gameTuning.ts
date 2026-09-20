export const GAME_TUNING = {
  gravity: 3.5,

  projectile: {
    radius: 0.22,
    startPosition: { x: 0, y: 0.6, z: 0 },
    minForwardVelocity: 7,
    maxForwardVelocity: 11,
    maxHorizontalVelocity: 4,
    maxVerticalVelocity: 5,
    baseVerticalVelocity: 4.2,
    maxFlightTime: 4,
    floorY: 0.05,
  },

  aim: {
    maxDrag: 0.32,
    trajectoryDots: 8,
    debugTrajectoryDots: 16,
    trajectoryFraction: 0.35,
    minAimDrag: 0.025,
    cancelEnterRadius: 0.032,
    cancelExitRadius: 0.048,
    horizontalAimExponent: 1.35,
    verticalAimExponent: 1.45,
    maxHorizontalDrag: 0.3,
    maxVerticalDrag: 0.34,
  },

  rotor: {
    z: 6,
    center: { x: 0, y: 3, z: 6 },
    radius: 2,
    hubRadius: 0.2,
    bladeLength: 1.68,
    bladeWidth: 0.24,
    bladeDepth: 0.15,
    ringThickness: 0.12,
    reverseEaseDuration: 0.7,
    nearMissDistance: 0.16,
    closeCallThreshold: 0.16,
    minZSpacing: 2.2,
    planeA: { min: 5.5, max: 6.5 },
    planeB: { min: 8.0, max: 9.5 },
  },

  target: {
    z: 12,
    defaultCenter: { x: 0, y: 3 },
    defaultRadius: 1.12,
    minRadius: 0.78,
    playableX: 1.35,
    playableY: { min: 2.25, max: 3.85 },
    zRange: { min: 11.5, max: 13 },
    zones: {
      hit: 1,
      great: 0.7,
      bullseye: 0.4,
      perfect: 0.18,
    },
  },

  camera: {
    position: [0, 3.2, -8.5] as [number, number, number],
    lookAt: [0, 2.5, 6] as [number, number, number],
    fov: 45,
    near: 0.1,
    far: 80,
  },

  run: {
    lives: 3,
    shotsPerEnvironment: 8,
    mode: 'GENERATED' as const,
  },

  score: {
    HIT: 100,
    GREAT: 150,
    BULLSEYE: 250,
    PERFECT: 400,
    CLOSE_CALL: 50,
  },

  timing: {
    resultDelay: 480,
    resetDelay: 140,
    hitAdvanceDelay: 180,
    ricochetDuration: 700,
    perfectSlowdownDuration: 0.2,
    perfectTimeScale: 0.38,
    maxDeltaSeconds: 0.05,
  },

  feedback: {
    shakeRotor: 0.18,
    shakeHit: 0.08,
    shakePerfect: 0.14,
  },

  movement: {
    target: {
      minHorizontalAmplitude: 0.3,
      maxHorizontalAmplitude: 1.3,
      minVerticalAmplitude: 0.2,
      maxVerticalAmplitude: 0.8,
      minSpeed: 0.4,
      maxSpeed: 1.2,
    },
    rotor: {
      minHorizontalAmplitude: 0.25,
      maxHorizontalAmplitude: 1.1,
      minVerticalAmplitude: 0.2,
      maxVerticalAmplitude: 0.6,
      minSpeed: 0.35,
      maxSpeed: 0.9,
    },
  },

  difficulty: {
    costs: {
      blades2: 1,
      blades3: 2,
      blades4: 3,
      moderateSpeed: 1,
      highSpeed: 2,
      reverse: 2,
      pulse: 2,
      offsetTarget: 1,
      smallTarget: 1,
      movingTarget: 2,
      movingRotor: 2,
      secondRotor: 3,
      counterRotation: 1,
      slidingGate: 2,
      iris: 2,
      pendulum: 2,
      movingRing: 2,
      orbiter: 2,
      driftingBlocker: 2,
      phaseField: 2,
      shiftingAperture: 3,
      laserGrid: 2,
      fastMovement: 1,
      smallOpening: 1,
    },
    moderateSpeed: 0.52,
    highSpeed: 0.68,
    maxRotorSpeed: 0.82,
    tolerance: 2,
  },

  transition: {
    normalDuration: 0.88,
    environmentDuration: 1.05,
    travelDistance: 11,
    bannerDuration: 0.9,
  },

  generation: {
    maxAttempts: 18,
  },

  gate: {
    openingWidth: { min: 1.2, max: 2.2 },
    openingHeight: { min: 2.0, max: 3.5 },
    amplitude: { min: 0.4, max: 1.3 },
    speed: { min: 0.3, max: 0.8 },
    panelWidth: 9,
    panelHeight: 6.2,
    baseY: 3,
  },

  iris: {
    minRadius: { min: 0.25, max: 0.6 },
    maxRadius: { min: 1.4, max: 2.0 },
    speed: { min: 0.7, max: 1.4 },
    outerRadius: 2.45,
    center: { x: 0, y: 3 },
  },

  pendulum: {
    pivot: { x: 0, y: 5.2 },
    length: { min: 1.85, max: 2.45 },
    blockerRadius: { min: 0.28, max: 0.52 },
    maxAngle: { min: 0.55, max: 1.05 },
    speed: { min: 0.65, max: 1.15 },
    armRadius: 0.08,
  },

  ring: {
    radius: { min: 1.0, max: 1.7 },
    amplitudeX: { min: 0.3, max: 1.2 },
    amplitudeY: { min: 0.2, max: 0.7 },
    speed: { min: 0.3, max: 0.8 },
    outerRadius: 2.5,
    base: { x: 0, y: 3 },
  },
};
