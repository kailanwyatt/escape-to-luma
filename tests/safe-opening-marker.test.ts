import { describe, expect, it } from 'vitest';

import { emptyPredictedState } from '../src/obstacles/GameplayObstacle';
import { hasAuthoredSafeOpening } from '../src/feedback/SafeOpeningMarker';

describe('Aurora Guiding Light marker gate', () => {
  it('hides on default / conveyor poses with no aperture', () => {
    expect(hasAuthoredSafeOpening(emptyPredictedState('formation', 6))).toBe(false);
    expect(hasAuthoredSafeOpening(emptyPredictedState('driftingBlocker', 6))).toBe(false);
  });

  it('shows when an aperture radius or gate opening is authored', () => {
    const iris = emptyPredictedState('iris', 6);
    iris.openingRadius = 1.1;
    iris.openingX = 0.2;
    iris.openingY = 3.1;
    expect(hasAuthoredSafeOpening(iris)).toBe(true);

    const gate = emptyPredictedState('slidingGate', 6);
    gate.openingWidth = 1.5;
    gate.openingHeight = 2.2;
    expect(hasAuthoredSafeOpening(gate)).toBe(true);
  });
});
