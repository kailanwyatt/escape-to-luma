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
}

export interface ScissorGateConfig {
  type: 'scissorGate';
  z: number;
  centerX: number;
  centerY: number;
  barLength: number;
  barThickness: number;
  maxAngle: number;
  /** Floor so the aperture never fully closes (defaults to 0.35). */
  minAngle?: number;
  speed: number;
  phase?: number;
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
  speed: number;
  phase?: number;
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
  /** Outer radius of the ring wall. */
  radius: number;
  /** Angular width of the open sector (radians). */
  gapWidth: number;
  speed: number;
  phase?: number;
  helixStep?: number;
  segmentIndex?: number;
  /** Inner open radius (hub). Defaults to ~45% of outer radius. */
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
  dwell: number;
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
}

export interface TheNullConfig {
  type: 'theNull';
  z: number;
  centerX: number;
  centerY: number;
  fieldRadius: number;
  minSafeRadius: number;
  maxSafeRadius: number;
  speed: number;
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
