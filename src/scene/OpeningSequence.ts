/** Canonical opening. Times are seconds; no physics or save mutations. */
export const OPENING_BEATS = [
  { duration: 5, title: 'A LIVING LIGHT', caption: 'Somewhere beyond Earth, a small light drifts alone.' },
  { duration: 7, title: 'DISCOVERY', caption: 'A deep-space probe detects Spark. Its collection chamber closes.' },
  { duration: 7, title: 'SPECIMEN S-01', caption: 'Brought to Earth. Hidden beneath a city. Treated as a power source.' },
  { duration: 6, title: 'THE SIGNAL', caption: 'Something distant answers. Something that feels like home.' },
  { duration: 6, title: 'CONTAINMENT FAILURE', caption: 'The field falters. Beyond the broken glass, a way out.' },
  { duration: 4, title: 'YOUR JOURNEY BEGINS', caption: 'Guide Spark through the opening. Find the source of the signal.' },
] as const;
export const OPENING_DURATION = OPENING_BEATS.reduce((sum, beat) => sum + beat.duration, 0);
export function sampleOpening(elapsed: number) {
  let remaining = Math.max(0, elapsed);
  for (let stage = 0; stage < OPENING_BEATS.length; stage++) {
    const beat = OPENING_BEATS[stage];
    if (remaining < beat.duration || stage === OPENING_BEATS.length - 1) {
      return { stage, progress: Math.min(1, remaining / beat.duration), complete: elapsed >= OPENING_DURATION };
    }
    remaining -= beat.duration;
  }
  throw new Error('Opening requires at least one beat');
}

function smoothstep(from: number, to: number, value: number): number {
  const t = Math.max(0, Math.min(1, (value - from) / (to - from)));
  return t * t * (3 - 2 * t);
}

/** Choreography shares the score's scan (5.2s), capture (9.6s), and lab (12s) cues. */
export function sampleOpeningChoreography(elapsed: number, reduceMotion = false) {
  return {
    approach: reduceMotion ? 1 : smoothstep(5, 9.4, elapsed),
    capture: smoothstep(9.6, 11.1, elapsed),
    // Conceal the location cut with a short fade, not a camera teleport or flash.
    transferOpacity: elapsed < 12
      ? smoothstep(11.25, 12, elapsed)
      : 1 - smoothstep(12, 12.85, elapsed),
  };
}
