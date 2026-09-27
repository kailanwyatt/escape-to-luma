import type {
  LaserGridConfig,
  LaserGridPattern,
} from '../config/ObstacleConfig';
import type { LaserBeam } from './ObstacleCollision';

const DEFAULT_BEAM_COUNT = 4;
const DEFAULT_SPEED = 0.6;
const DEFAULT_AMPLITUDE = 0.22;
const DEFAULT_PHASE_OFFSET = 0.8;

export function defaultLaserPattern(
  orientation: LaserGridConfig['orientation'],
): LaserGridPattern {
  if (orientation === 'vertical') {
    return 'VERTICAL_WAVE';
  }
  if (orientation === 'both') {
    return 'CROSSING';
  }
  return 'HORIZONTAL_WAVE';
}

export function laserBeamsAtTime(
  config: LaserGridConfig,
  elapsedTime: number,
): LaserBeam[] {
  const pattern = config.pattern ?? defaultLaserPattern(config.orientation);
  const count = Math.max(2, Math.min(12, Math.round(config.beamCount ?? DEFAULT_BEAM_COUNT)));
  const speed = config.speed ?? DEFAULT_SPEED;
  const amplitude = config.amplitude ?? DEFAULT_AMPLITUDE;
  const phaseOffset = config.phaseOffset ?? DEFAULT_PHASE_OFFSET;
  const centerX = config.centerX ?? 0;
  const centerY = config.centerY ?? 3;

  if (pattern === 'ALTERNATING') {
    const horizontalCount = Math.max(2, Math.ceil(count / 2));
    const verticalCount = Math.max(2, Math.floor(count / 2));
    return [
      ...buildAxisBeams(
        config,
        'horizontal',
        horizontalCount,
        elapsedTime,
        speed,
        amplitude,
        phaseOffset,
        centerX,
        centerY,
        'alternating',
      ),
      ...buildAxisBeams(
        config,
        'vertical',
        verticalCount,
        elapsedTime,
        speed,
        amplitude,
        phaseOffset,
        centerX,
        centerY,
        'alternating',
        Math.PI,
      ),
    ];
  }

  if (pattern === 'CROSSING') {
    const horizontalCount = Math.max(2, Math.ceil(count / 2));
    const verticalCount = Math.max(2, Math.floor(count / 2));
    return [
      ...buildAxisBeams(
        config,
        'horizontal',
        horizontalCount,
        elapsedTime,
        speed,
        amplitude,
        phaseOffset,
        centerX,
        centerY,
        'wave',
      ),
      ...buildAxisBeams(
        config,
        'vertical',
        verticalCount,
        elapsedTime,
        speed,
        amplitude,
        phaseOffset,
        centerX,
        centerY,
        'wave',
        phaseOffset / 2,
      ),
    ];
  }

  if (pattern === 'CROSSING_PHASED') {
    const horizontalCount = Math.max(2, Math.ceil(count / 2));
    const verticalCount = Math.max(2, Math.floor(count / 2));
    // Slow regime cycle: H moves alone → both together → V moves alone.
    const regimePeriod = 5.2;
    const cycle = regimePeriod * 3;
    const t =
      (((elapsedTime + (config.phase ?? 0) * 1.7) % cycle) + cycle) % cycle;
    const regime = Math.floor(t / regimePeriod);
    const hMotion = regime === 0 || regime === 1 ? 'wave' : 'static';
    const vMotion = regime === 1 || regime === 2 ? 'wave' : 'static';
    // Together phase shares the same wave angle (no bias) so axes drift as one grate.
    const vBias = regime === 1 ? 0 : phaseOffset / 2;
    return [
      ...buildAxisBeams(
        config,
        'horizontal',
        horizontalCount,
        elapsedTime,
        speed,
        amplitude,
        phaseOffset,
        centerX,
        centerY,
        hMotion,
      ),
      ...buildAxisBeams(
        config,
        'vertical',
        verticalCount,
        elapsedTime,
        speed,
        amplitude,
        phaseOffset,
        centerX,
        centerY,
        vMotion,
        vBias,
      ),
    ];
  }

  const orientation =
    pattern === 'HORIZONTAL_WAVE'
      ? 'horizontal'
      : pattern === 'VERTICAL_WAVE'
        ? 'vertical'
        : config.orientation === 'both'
          ? 'horizontal'
          : config.orientation;
  const motion =
    pattern === 'OPEN_CLOSE'
      ? 'openClose'
      : pattern === 'SEQUENTIAL'
          ? 'sequential'
          : 'wave';

  return buildAxisBeams(
    config,
    orientation,
    count,
    elapsedTime,
    speed,
    amplitude,
    phaseOffset,
    centerX,
    centerY,
    motion,
  );
}

function buildAxisBeams(
  config: LaserGridConfig,
  orientation: LaserBeam['orientation'],
  count: number,
  elapsedTime: number,
  speed: number,
  amplitude: number,
  phaseOffset: number,
  centerX: number,
  centerY: number,
  motion: 'wave' | 'openClose' | 'alternating' | 'sequential' | 'static',
  phaseBias = 0,
): LaserBeam[] {
  const center = orientation === 'vertical' ? centerX : centerY;
  const angle = elapsedTime * speed + (config.phase ?? 0) + phaseBias;
  const beams: LaserBeam[] = [];

  for (let index = 0; index < count; index += 1) {
    const baseOffset = (index - (count - 1) / 2) * config.spacing;
    let offset: number;
    if (motion === 'static') {
      offset = 0;
    } else if (motion === 'openClose') {
      const direction = baseOffset < 0 ? -1 : 1;
      offset = direction * Math.sin(angle) * amplitude;
    } else if (motion === 'alternating') {
      offset = Math.sin(angle + (index % 2) * Math.PI) * amplitude;
    } else if (motion === 'sequential') {
      offset =
        Math.sin(angle - index * phaseOffset) *
        amplitude *
        (0.72 + (index / Math.max(1, count - 1)) * 0.28);
    } else {
      offset = Math.sin(angle + index * phaseOffset) * amplitude;
    }

    beams.push({
      orientation,
      position: center + baseOffset + offset,
      halfSpan: config.span / 2,
      halfThickness: config.thickness,
      centerX,
      centerY,
    });
  }

  return beams;
}
