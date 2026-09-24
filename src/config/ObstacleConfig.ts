import type {RapidShutterConfig} from '../obstacles/RapidShutterState';
import type { RotorConfig } from './RotorConfig';

export type ObstacleType =
  | 'rotor'
  | 'slidingGate'
  | 'iris'
  | 'pendulum'
  | 'movingRing'
  | 'orbiter'
  | 'driftingBlocker'
  | 'phaseField'
  | 'shiftingAperture'
  | 'laserGrid'
  | 'formation'
  | 'pistonField'
  | 'clockHands'
  | 'elevatorBlocks'
  | 'pulseRing'
  | 'scissorGate'
  | 'groundCutLasers'
  | 'speedField'
  | 'splitShutter'
  | 'reactiveGate'
  | 'conveyorGate'
  | 'rollingAperture'
  | 'corkscrewTunnel'
  | 'cometCrossing'
  | 'orbitingMoons'
  | 'sequentialTunnel'
  | 'movingSafeZone'
  | 'accretionShredder'
  | 'pulsarBeam'
  | 'solarSail'
  | 'billboardFlip'
  | 'dockingCollar'
  | 'shearLane'
  | 'rotatingGate'
  | 'energyField'
  | 'phaseGate'
  | 'repulsor'
  | 'nullTendril'
  | 'nullLash'
  | 'magnetopause'
  | 'lagrangeNull'
  | 'teleportPortal'
  | 'entryExitPortal'
  | 'theNull';

export type RingMovementType = 'horizontal' | 'vertical' | 'ellipse';

export interface SlidingGateConfig {
  movementMode?: 'oscillating' | 'rapidShutter';
  shutter?: RapidShutterConfig;
  type: 'slidingGate';
  z: number;
  appearance?: 'standard' | 'containmentGlass';
  openingWidth: number;
  openingHeight: number;
  baseX: number;
  baseY?: number;
  amplitude: number;
  speed: number;
  phase?: number;
}

export interface IrisConfig {
  sequenceIndex?:number;
  type: 'iris';
  z: number;
  minRadius: number;
  maxRadius: number;
  speed: number;
  phase?: number;
  centerX?: number;
  centerY?: number;
}

export interface PendulumConfig {
  type: 'pendulum';
  z: number;
  pivotX: number;
  pivotY: number;
  length: number;
  blockerRadius: number;
  maxAngle: number;
  speed: number;
  phase?: number;
}

export interface MovingRingConfig {
  type: 'movingRing';
  z: number;
  radius: number;
  baseX: number;
  baseY: number;
  movement: {
    type: RingMovementType;
    amplitudeX: number;
    amplitudeY: number;
    speed: number;
    phase?: number;
  };
}

export interface OrbiterConfig {
  type: 'orbiter';
  z: number;
  centerX: number;
  centerY: number;
  orbitRadius: number;
  blockerRadius: number;
  speed: number;
  phase?: number;
}

export interface DriftingBlockerConfig {
  type: 'driftingBlocker';
  z: number;
  baseX: number;
  baseY: number;
  blockerRadius: number;
  amplitudeX: number;
  amplitudeY: number;
  speed: number;
  phase?: number;
}

export interface PhaseFieldConfig {
  type: 'phaseField';
  z: number;
  centerX: number;
  centerY: number;
  fieldRadius: number;
  speed: number;
  phase?: number;
  /** Fraction of cycle that is open (0–1). */
  openRatio?: number;
}

export interface ShiftingApertureConfig {
  type: 'shiftingAperture';
  z: number;
  minRadius: number;
  maxRadius: number;
  pulseSpeed: number;
  baseX: number;
  baseY: number;
  shiftAmplitude: number;
  shiftSpeed: number;
  phase?: number;
}

export type LaserGridPattern =
  | 'HORIZONTAL_WAVE'
  | 'VERTICAL_WAVE'
  | 'OPEN_CLOSE'
  | 'ALTERNATING'
  | 'CROSSING'
  | 'SEQUENTIAL';

/** Fixed security frame containing independently animated laser beams. */
export interface LaserGridConfig {
  type: 'laserGrid';
  z: number;
  /** Primary beam direction; CROSSING uses both directions. */
  orientation: 'vertical' | 'horizontal' | 'both';
  pattern?: LaserGridPattern;
  /** Number of independently animated beams. */
  beamCount?: number;
  /** Base distance between adjacent beams. */
  spacing: number;
  /** Beam movement amplitude in world units. */
  amplitude?: number;
  /** Beam movement speed. */
  speed?: number;
  /** Phase difference between adjacent beams. */
  phaseOffset?: number;
  /** How far beams extend inside the fixed frame. */
  span: number;
  /** Beam half-thickness for collision and visuals. */
  thickness: number;
  centerX?: number;
  centerY?: number;
  /**
   * `static` — always on (aim through gap).
   * `pulse` — lasers cycle on/off; throw while off or through gap while on.
   */
  mode?: 'static' | 'pulse';
  /** Pulse frequency, independent from beam movement speed. */
  pulseSpeed?: number;
  phase?: number;
  /** Fraction of cycle lasers are ON / dangerous (0–1). Default 0.55. */
  onRatio?: number;
}

export interface FormationConfig {
  type: 'formation';
  variant: 'alternatingDoors' | 'conveyor' | 'expandingDebris' | 'phaseColumns' | 'rotatingMaze';
  z: number;
  centerY?: number;
  speed: number;
  phase?: number;
  direction?: 1 | -1;
  /** Radius of the passable hole in a rotating plate. */
  openingRadius?: number;
}

export interface PistonFieldConfig {
  type: 'pistonField';
  z: number;
  /**
   * Bottom of each ram (world Y). Defaults to a near-floor pad so pistons read as
   * chamber pumps thrusting up into the flight corridor.
   */
  floorY?: number;
  /**
   * Top of a retracted ram must stay at or below this Y to count as an open lane.
   * Defaults below the playable flight band.
   */
  clearY?: number;
  /** @deprecated Prefer floorY + clearY. Ignored for body placement when floorY is used. */
  centerY?: number;
  laneCount: number;
  spacing: number;
  maxExtension: number;
  minExtension: number;
  speed: number;
  phase?: number;
  halfWidth?: number;
  /** Fixed housing height sitting on the floor before extension. */
  pistonHeight?: number;
}

export interface ClockHandsConfig {
  type: 'clockHands';
  z: number;
  hubX: number;
  hubY: number;
  length: number;
  thickness: number;
  handCount: 1 | 2;
  speed: number;
  phase?: number;
  secondSpeedScale?: number;
  hubRadius?: number;
  /**
   * `continuous` — both arms rotate (default).
   * `snapClose` — readable open gap, then one arm slams shut to catch late throws.
   */
  motionMode?: 'continuous' | 'snapClose';
  /** Slow shared drift of the pair while gap snaps (snapClose). */
  driftSpeed?: number;
  snapOpenHold?: number;
  snapWarningHold?: number;
  snapSlamDuration?: number;
  snapClosedHold?: number;
  snapOpenDuration?: number;
  /** Angular gap between hands when open / slammed (radians). */
  snapOpenGap?: number;
  snapClosedGap?: number;
}

export interface ElevatorBlocksConfig {
  type: 'elevatorBlocks';
  z: number;
  laneCount: number;
  spacing: number;
  baseY: number;
  amplitude: number;
  speed: number;
  phase?: number;
  blockWidth?: number;
  blockHeight?: number;
}

export interface PulseRingConfig {
  type: 'pulseRing';
  z: number;
  centerX: number;
  centerY: number;
  minRadius: number;
  maxRadius: number;
  thickness: number;
  speed: number;
  phase?: number;
  /** Horizontal drift of the safe hub (world units). */
  driftAmplitude?: number;
  /** Drift rate; defaults to `speed`. */
  driftSpeed?: number;
}

export interface ScissorGateConfig {
  type: 'scissorGate';
  z: number;
  centerX: number;
  centerY: number;
  barLength: number;
  barThickness: number;
  maxAngle: number;
  /** Floor so bars never go singular (defaults to 0.08). Use a low value to seal shut. */
  minAngle?: number;
  /** Sine rate, or overall flutter tempo when pattern is `flutter`. */
  speed: number;
  phase?: number;
  /**
   * `sine` — steady open/close.
   * `flutter` — butterfly bursts (rapid flaps) then a slow open window.
   */
  pattern?: 'sine' | 'flutter';
  /** Flutter only: flaps inside each burst (default 3.25). */
  flutterFlaps?: number;
  /** Flutter only: burst length in seconds at speed 1 (default 0.85). */
  flutterBurst?: number;
  /** Flutter only: slow rest length in seconds at speed 1 (default 1.2). */
  flutterRest?: number;
}

/** Ground emitters fire diagonal cutters that fan open and periodically cross. */
export interface GroundCutLasersConfig {
  type: 'groundCutLasers';
  z: number;
  /** Emitter pad Y (beams originate on the ground). */
  floorY: number;
  /** How high beams reach. */
  ceilingY: number;
  /** Midpoint of the emitter row. */
  centerX: number;
  /** Full width across which emitters are spaced. */
  spanX: number;
  beamCount: number;
  /** Beam half-thickness for collision. */
  thickness: number;
  /** Overall phrase tempo. */
  speed: number;
  phase?: number;
  /** Outward lean (radians from vertical) when the fan is open. */
  fanAngle: number;
  /** X the beams converge toward while crossing (usually near the portal). */
  aimX: number;
  /** Fraction of each cycle spent sweeping into a cross (0–1). Default 0.34. */
  crossDuty?: number;
}

export interface SpeedFieldConfig {
  type: 'speedField';
  z: number;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  speedMultiplier: number;
  pulseSpeed?: number;
  phase?: number;
}

export interface SplitShutterConfig {
  type: 'splitShutter';
  z: number;
  centerX: number;
  centerY?: number;
  panelWidth: number;
  panelHeight: number;
  minGap: number;
  maxGap: number;
  /** Cycle time scale (1 = authored holds in seconds). */
  speed: number;
  phase?: number;
  closedHold?: number;
  openingDuration?: number;
  openHold?: number;
  warningHold?: number;
  slamDuration?: number;
}

export interface ReactiveGateConfig {
  type: 'reactiveGate';
  z: number;
  centerX: number;
  centerY?: number;
  closedWidth: number;
  openWidth: number;
  openHeight: number;
  speed: number;
  phase?: number;
  closedHold?: number;
  warningHold?: number;
  openHold?: number;
}

export interface ConveyorGateConfig {
  type: 'conveyorGate';
  z: number;
  centerX: number;
  centerY?: number;
  blockCount: number;
  blockRadius: number;
  wrapWidth: number;
  speed: number;
  phase?: number;
  direction?: 1 | -1;
}

export interface RollingApertureConfig {
  type: 'rollingAperture';
  z: number;
  baseX: number;
  baseY: number;
  minRadius: number;
  maxRadius: number;
  pulseSpeed: number;
  driftSpeed: number;
  driftAmplitudeX: number;
  driftAmplitudeY: number;
  phase?: number;
}

export interface CorkscrewTunnelConfig {
  type: 'corkscrewTunnel';
  z: number;
  centerX: number;
  centerY: number;
  /** Outer radius of the solid disk. */
  radius: number;
  /** Angular width of the open sector (radians). */
  gapWidth: number;
  speed: number;
  phase?: number;
  helixStep?: number;
  segmentIndex?: number;
  /** Decorative hub collar for art (collision is solid through center). */
  innerRadius?: number;
}

export interface CometCrossingConfig {
  type: 'cometCrossing';
  z: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  blockerRadius: number;
  speed: number;
  phase?: number;
}

export interface OrbitingMoonsConfig {
  type: 'orbitingMoons';
  z: number;
  centerX: number;
  centerY: number;
  orbitRadius: number;
  moonRadius: number;
  moonCount: number;
  speed: number;
  phase?: number;
  /** Solid relay core — closes the free center corridor. */
  hubRadius?: number;
  /**
   * Optional beacon pulse. Each moon fires a shockwave ring (or radial laser)
   * on a shared off → warning → fire clock.
   */
  beaconPulse?: {
    kind: 'shockwave' | 'laser';
    /** Shockwave max travel / laser length beyond the moon surface. */
    range: number;
    /** Cycle time scale (1 = authored holds in seconds). */
    speed: number;
    phase?: number;
    offHold?: number;
    warningHold?: number;
    onHold?: number;
    /** Shockwave ring half-thickness. */
    thickness?: number;
  };
}

export interface SequentialTunnelConfig {
  type: 'sequentialTunnel';
  z: number;
  centerX: number;
  centerY: number;
  apertureCount: number;
  apertureRadius: number;
  spacing: number;
  speed: number;
  phase?: number;
  openHold?: number;
  closedHold?: number;
}

export interface MovingSafeZoneConfig {
  type: 'movingSafeZone';
  z: number;
  centerX: number;
  centerY: number;
  fieldRadius: number;
  holeRadius: number;
  baseX: number;
  baseY: number;
  driftSpeed: number;
  driftAmplitudeX: number;
  driftAmplitudeY: number;
  phase?: number;
}

export interface AccretionShredderConfig {
  type: 'accretionShredder';
  z: number;
  centerX: number;
  centerY: number;
  outerRadius: number;
  debrisCount: number;
  debrisRadius: number;
  speed: number;
  phase?: number;
  turns?: number;
}

export interface PulsarBeamConfig {
  type: 'pulsarBeam';
  z: number;
  centerX: number;
  centerY: number;
  halfWidth: number;
  orientation: 'horizontal' | 'vertical';
  speed: number;
  onHold: number;
  offHold: number;
  phase?: number;
}

export interface SolarSailConfig {
  type: 'solarSail';
  z: number;
  centerX: number;
  centerY: number;
  halfWidth: number;
  halfHeight: number;
  maxAngle: number;
  openAngle: number;
  speed: number;
  phase?: number;
}

/** Rooftop billboard — face-on wall, edge-on clear when |angle| ≥ openAngle. */
export interface BillboardFlipConfig {
  type: 'billboardFlip';
  z: number;
  centerX: number;
  centerY: number;
  halfWidth: number;
  halfHeight: number;
  /** Panel half-thickness (visual); collision uses the face AABB until open. */
  halfDepth?: number;
  /** Peak swing from face-on (radians). Default π/2. */
  maxAngle?: number;
  /** |angle| at which the corridor clears. Default maxAngle × 0.72. */
  openAngle?: number;
  speed: number;
  phase?: number;
}

/** Circular docking hatch — two jaws clamp with shutter slam timing. */
export interface DockingCollarConfig {
  type: 'dockingCollar';
  z: number;
  centerX: number;
  centerY: number;
  /** Outer rim of the solid collar plate. */
  outerRadius: number;
  /** Safe-hole radius when fully open. */
  openRadius: number;
  /** Safe-hole radius when clamped (usually near zero). */
  closedRadius: number;
  /** Cycle time scale (1 = authored holds in seconds). */
  speed: number;
  phase?: number;
  closedHold?: number;
  openingDuration?: number;
  openHold?: number;
  warningHold?: number;
  slamDuration?: number;
}

/** Opposing debris streams with a clear band between them. */
export interface ShearLaneConfig {
  type: 'shearLane';
  z: number;
  centerX: number;
  centerY: number;
  /** Clear vertical corridor height between rock edges. */
  gapHeight: number;
  /** Rocks per stream. */
  blockCount: number;
  blockRadius: number;
  wrapWidth: number;
  speed: number;
  phase?: number;
  /** Distance from centerY to each stream centerline. */
  streamOffset?: number;
}

/** Industrial rotating aperture — solid disk with one timed sector gap. */
export interface RotatingGateConfig {
  type: 'rotatingGate';
  z: number;
  centerX: number;
  centerY: number;
  outerRadius: number;
  /** Decorative hub collar for art (collision is solid through center). */
  innerRadius: number;
  /** Safe sector width in radians. */
  gapWidth: number;
  speed: number;
  phase?: number;
}

/** Full-width energy curtain — drifting circular opening is the only safe path. */
export interface EnergyFieldConfig {
  type: 'energyField';
  z: number;
  centerX: number;
  centerY: number;
  /** Half-width of the energy plane (covers the device / playable band). */
  halfWidth: number;
  /** Half-height of the energy plane. */
  halfHeight: number;
  /** Safe opening radius. */
  holeRadius: number;
  /** Horizontal sweep amplitude of the opening (L↔R). */
  driftAmplitudeX: number;
  /** Optional vertical drift. */
  driftAmplitudeY?: number;
  /** Drift rate; defaults to `speed`. */
  driftSpeed?: number;
  /** Optional hole-radius pulse amplitude. */
  pulseAmplitude?: number;
  speed: number;
  phase?: number;
}

/** Phase membrane gate — solid when lit, passable when faded. */
export interface PhaseGateConfig {
  type: 'phaseGate';
  z: number;
  centerX: number;
  centerY: number;
  fieldRadius: number;
  speed: number;
  phase?: number;
  sequenceIndex?: number;
  /** Fraction of each cycle the gate is passable (default 0.42). */
  openRatio?: number;
  /** Fraction spent amber-warning before solid (default 0.14). */
  warningRatio?: number;
}

/** Push orb — solid core plus outward force field (opposite of gravity wells). */
export interface RepulsorConfig {
  type: 'repulsor';
  z: number;
  centerX: number;
  centerY: number;
  /** Solid metal core radius. */
  coreRadius: number;
  /** Push falloff radius (maps to GravityWell.radius). */
  fieldRadius: number;
  /** Push magnitude (applied as negative well strength). */
  strength: number;
  pulseSpeed?: number;
  phase?: number;
}

/** Null tendrils — organic coils leave one rotating corridor of light. */
export interface NullTendrilConfig {
  type: 'nullTendril';
  z: number;
  centerX: number;
  centerY: number;
  outerRadius: number;
  /** Clear hub inside the tendril roots. */
  innerRadius: number;
  tendrilCount: number;
  /** Safe corridor width in radians. */
  gapWidth: number;
  speed: number;
  phase?: number;
}

/** Null lash — a tendril whips across the path; throw while it is coiled. */
export interface NullLashConfig {
  type: 'nullLash';
  z: number;
  pivotX: number;
  pivotY: number;
  length: number;
  thickness: number;
  /** Angle while coiled (radians). */
  restAngle: number;
  /** Sweep added during the lash (radians). */
  lashSpan: number;
  speed: number;
  phase?: number;
  coiledHold?: number;
  warningHold?: number;
  lashDuration?: number;
  extendedHold?: number;
  retractDuration?: number;
}

export interface MagnetopauseConfig {
  type: 'magnetopause';
  z: number;
  centerX: number;
  centerY: number;
  innerRadius: number;
  outerRadius: number;
  gapWidth: number;
  speed: number;
  phase?: number;
  /** Solid dish hub — when set, the center is no longer a free corridor. */
  hubRadius?: number;
}

export interface LagrangeNullConfig {
  type: 'lagrangeNull';
  z: number;
  centerX: number;
  centerY: number;
  radius: number;
}

export interface TeleportPortalConfig {
  type: 'teleportPortal';
  z: number;
  anchors: { x: number; y: number }[];
  radius: number;
  speed: number;
  /** Seconds the portal stays present/passable at the current anchor. */
  dwell: number;
  /** Seconds the portal is vanished while amber telegraphs the next reappear. */
  warning: number;
  phase?: number;
}

export interface EntryExitPortalConfig {
  type: 'entryExitPortal';
  z: number;
  entryX: number;
  entryY: number;
  exitX: number;
  exitY: number;
  radius: number;
  /**
   * False-home multi-aperture relay: sealed wall with entry disks.
   * Exactly one is cyan (true) at a time; amber disks and the seal fail.
   * Omit for a single always-true entry (legacy warp to exit).
   */
  disks?: { x: number; y: number }[];
  /** Cycles which disk is cyan (disk-indices per second). */
  speed?: number;
  phase?: number;
  /** Seconds of cyan flicker before the true aperture advances. */
  warningHold?: number;
  /** Local +Z offset for destination portal art (world depth behind the wall). */
  destinationDepth?: number;
}

/** The Null — dark field with one drifting safe hole (same lesson as Moving Safe Zone). */
export interface TheNullConfig {
  type: 'theNull';
  z: number;
  centerX: number;
  centerY: number;
  fieldRadius: number;
  holeRadius: number;
  baseX: number;
  baseY: number;
  driftSpeed: number;
  driftAmplitudeX: number;
  driftAmplitudeY: number;
  phase?: number;
}

export type RotorObstacleConfig = RotorConfig & { type?: 'rotor' };

export type ObstacleConfig =
  | RotorObstacleConfig
  | SlidingGateConfig
  | IrisConfig
  | PendulumConfig
  | MovingRingConfig
  | OrbiterConfig
  | DriftingBlockerConfig
  | PhaseFieldConfig
  | ShiftingApertureConfig
  | LaserGridConfig
  | FormationConfig
  | PistonFieldConfig
  | ClockHandsConfig
  | ElevatorBlocksConfig
  | PulseRingConfig
  | ScissorGateConfig
  | GroundCutLasersConfig
  | SpeedFieldConfig
  | SplitShutterConfig
  | ReactiveGateConfig
  | ConveyorGateConfig
  | RollingApertureConfig
  | CorkscrewTunnelConfig
  | CometCrossingConfig
  | OrbitingMoonsConfig
  | SequentialTunnelConfig
  | MovingSafeZoneConfig
  | AccretionShredderConfig
  | PulsarBeamConfig
  | SolarSailConfig
  | BillboardFlipConfig
  | DockingCollarConfig
  | ShearLaneConfig
  | RotatingGateConfig
  | EnergyFieldConfig
  | PhaseGateConfig
  | RepulsorConfig
  | NullTendrilConfig
  | NullLashConfig
  | MagnetopauseConfig
  | LagrangeNullConfig
  | TeleportPortalConfig
  | EntryExitPortalConfig
  | TheNullConfig;

export function obstacleTypeOf(config: ObstacleConfig): ObstacleType {
  return config.type ?? 'rotor';
}

export function isRotorConfig(config: ObstacleConfig): config is RotorObstacleConfig {
  return obstacleTypeOf(config) === 'rotor';
}
