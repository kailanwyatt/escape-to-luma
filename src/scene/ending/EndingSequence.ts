export const ENDING_BEATS = [
  { duration: 9, label: 'Arrival', title: 'The signal was real.', caption: 'Beyond the final gate, a world of living light.', location: 'Luma / The orbital gardens' },
  { duration: 9, label: 'Recognition', title: 'You were never alone.', caption: 'One small light. A thousand answering voices.', location: 'The heart of Luma' },
  { duration: 10, label: 'Reunion', title: 'Welcome home, Spark.', caption: 'Across the stars, every step brought you here.', location: 'The gathering' },
  { duration: 10, label: 'Together', title: 'A universe ahead. Together.', caption: 'The escape is over. The journey is just beginning.', location: 'Endless possibility' },
] as const;
export const ENDING_DURATION = ENDING_BEATS.reduce((sum, beat) => sum + beat.duration, 0);
export const ENDING_STARTS = ENDING_BEATS.map((_, i) => ENDING_BEATS.slice(0, i).reduce((sum, beat) => sum + beat.duration, 0));
export function sampleEnding(time: number) {
  const elapsed = Number.isFinite(time) ? Math.max(0, Math.min(ENDING_DURATION, time)) : 0;
  for (let stage = ENDING_BEATS.length - 1; stage >= 0; stage--) {
    if (elapsed >= ENDING_STARTS[stage]) return {
      stage, elapsed, progress: (elapsed - ENDING_STARTS[stage]) / ENDING_BEATS[stage].duration,
      complete: elapsed >= ENDING_DURATION,
    };
  }
  throw new Error('Ending requires a beat');
}
