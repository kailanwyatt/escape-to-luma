import { describe, it, expect } from 'vitest';
import { OPENING_BEATS, OPENING_DURATION, sampleOpening, sampleOpeningChoreography } from '../src/scene/OpeningSequence';
describe('canonical opening timeline', () => {
  it('aligns capture with the score and completely masks the location cut', () => {
    expect(sampleOpeningChoreography(9.6).capture).toBe(0);
    expect(sampleOpeningChoreography(11.1).capture).toBe(1);
    expect(sampleOpeningChoreography(12).transferOpacity).toBe(1);
    expect(sampleOpeningChoreography(12.85).transferOpacity).toBe(0);
    expect(sampleOpeningChoreography(9.4).approach).toBe(1);
    expect(sampleOpeningChoreography(6, true).approach).toBe(1);
  });
  it('runs for 35 seconds and clamps both ends', () => {
    expect(OPENING_DURATION).toBe(35);
    expect(sampleOpening(-2)).toEqual({stage: 0, progress: 0, complete: false});
    expect(sampleOpening(90)).toEqual({stage: 5, progress: 1, complete: true});
  });
  it('enters every beat at its exact boundary', () => {
    let elapsed = 0;
    OPENING_BEATS.forEach((beat, stage) => {
      expect(sampleOpening(elapsed)).toEqual({stage, progress: 0, complete: false});
      elapsed += beat.duration;
    });
    expect(sampleOpening(elapsed).complete).toBe(true);
  });
  it('sampling is independent of frame count and does not advance paused time', () => {
    const at = sampleOpening(22.5);
    for (let i = 0; i < 300; i++) expect(sampleOpening(22.5)).toEqual(at);
  });
});
