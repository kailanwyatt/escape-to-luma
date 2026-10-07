import * as THREE from 'three';
import { describe, expect, it } from 'vitest';

import { OpeningSceneV2 } from '../src/experiments/opening-rebuild';
import { OPENING_DURATION, OPENING_BEATS } from '../src/scene/OpeningSequence';

describe('OpeningSceneV2', () => {
  it('samples every campaign-opening beat and reaches the gameplay handoff', () => {
    const opening = new OpeningSceneV2();
    const camera = new THREE.PerspectiveCamera(45, 9 / 16, 0.1, 100);
    const stageStarts = OPENING_BEATS.reduce<number[]>((times, beat) => {
      times.push((times.at(-1) ?? 0) + beat.duration);
      return times;
    }, [0]);

    for (const time of stageStarts) {
      opening.sample(Math.min(time + 0.05, OPENING_DURATION - 0.01), camera, false);
    }
    opening.setBreach({ x: 0, y: 3, z: 5.75, width: 1.72, height: 2.65 });
    opening.sample(OPENING_DURATION - 0.01, camera, true);

    const launchSpark = opening.group.getObjectByName('opening-v2-spark');
    expect(opening.group.visible).toBe(true);
    expect(camera.position.length()).toBeGreaterThan(0);
    expect(camera.position.toArray().every(Number.isFinite)).toBe(true);
    expect(launchSpark?.position.toArray()).toEqual([0, 0.6, 0]);
  });
});
