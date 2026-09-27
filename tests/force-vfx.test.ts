import { describe, expect, it } from 'vitest';
import { WindField } from '../src/feedback/WindField';
import { GravityWellField } from '../src/feedback/GravityWellField';

describe('force VFX', () => {
  it('keeps wind cues visible even when motion is reduced', () => {
    const wind = new WindField();
    wind.setWind(0.28);
    expect(wind.group.visible).toBe(true);
    wind.update(0.016, true);
    expect(wind.group.visible).toBe(true);
    expect(wind.group.children.length).toBeGreaterThan(10);
    wind.setWind(0);
    expect(wind.group.visible).toBe(false);
    wind.dispose();
    expect(wind.group.children).toHaveLength(0);
  });

  it('builds gravity wells with a radius-matched outer ring', () => {
    const field = new GravityWellField();
    const radius = 4.1;
    field.setWells([{ x: 1.1, y: 2.8, z: 6.2, strength: 12, radius }]);
    expect(field.group.visible).toBe(true);
    const well = field.group.getObjectByName('gravity-well');
    expect(well).toBeTruthy();

    let maxRing = 0;
    well!.traverse((obj) => {
      if (obj.userData?.kind === 'ring' && 'geometry' in obj) {
        const params = (obj as { geometry: { parameters?: { radius?: number } } }).geometry.parameters;
        if (params?.radius != null) maxRing = Math.max(maxRing, params.radius);
      }
      if (obj.userData?.kind === 'haze') {
        expect(obj.userData.baseScale).toBeCloseTo(radius, 5);
      }
    });
    expect(maxRing).toBeCloseTo(radius, 5);

    field.update(1.2, false);
    field.setWells([]);
    expect(field.group.visible).toBe(false);
    field.dispose();
  });

  it('tints repulsor wells warm and attractors cool', () => {
    const field = new GravityWellField();
    field.setWells([
      { x: 0, y: 3, z: 6, strength: 10, radius: 3 },
      { x: 1, y: 3, z: 7, strength: -8, radius: 2.5 },
    ]);
    expect(field.group.children).toHaveLength(2);
    field.dispose();
  });
});
