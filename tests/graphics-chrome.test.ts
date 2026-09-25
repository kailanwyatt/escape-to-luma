import { describe, expect, it } from 'vitest';

import { GRAPHICS_NEEDS } from '../src/graphics/graphicsNeeds';
import type { HomeSignalStrength } from '../src/campaign/types';

const SIGNAL_LEVELS: HomeSignalStrength[] = ['faint', 'detectable', 'strong', 'located', 'home'];

describe('graphics chrome batch', () => {
  it('marks shipped P1 chrome as currently present', () => {
    const shipped = [
      'fonts',
      'level-ready',
      'home-signal',
      'world-complete',
      'result-banners',
      'close-call',
      'continue-panel',
      'pendulum',
      'moving-ring',
      'portals',
      'trail',
      'particles-hit',
      'spark-skins-core',
    ];
    for (const id of shipped) {
      const need = GRAPHICS_NEEDS.find((item) => item.id === id);
      expect(need, id).toBeDefined();
      expect(need!.current.toLowerCase()).not.toMatch(
        /plain text|system default|tinted phong|sphere on cylinder|fading sphere|door \/ tunnel \/ ring primitives/,
      );
    }
  });

  it('covers the five Home Signal strengths', () => {
    expect(SIGNAL_LEVELS).toHaveLength(5);
    expect(SIGNAL_LEVELS[0]).toBe('faint');
    expect(SIGNAL_LEVELS[4]).toBe('home');
  });

  it('records Orbitron + Barlow Condensed as the UI typefaces', () => {
    const fonts = GRAPHICS_NEEDS.find((item) => item.id === 'fonts');
    expect(fonts?.current).toMatch(/Orbitron/);
    expect(fonts?.current).toMatch(/Barlow Condensed/);
  });
});
