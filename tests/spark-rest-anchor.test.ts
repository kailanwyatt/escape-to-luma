import * as THREE from 'three';
import { describe, expect, it } from 'vitest';

import { GAME_TUNING } from '../src/game/gameTuning';
import { SPARK_REST_SCREEN_FRACTION } from '../src/ui/sparkRestAnchor';

describe('spark rest anchor', () => {
  it('stays on the projected rest position of Spark', () => {
    const cam = GAME_TUNING.camera;
    const camera = new THREE.PerspectiveCamera(cam.fov, 9 / 16, cam.near, cam.far);
    camera.position.set(cam.position[0], cam.position[1], cam.position[2]);
    camera.lookAt(cam.lookAt[0], cam.lookAt[1], cam.lookAt[2]);
    camera.updateMatrixWorld();
    const start = GAME_TUNING.projectile.startPosition;
    const projected = new THREE.Vector3(start.x, start.y, start.z).project(camera);

    expect(SPARK_REST_SCREEN_FRACTION).toBeCloseTo((1 - projected.y) / 2, 4);
    expect(SPARK_REST_SCREEN_FRACTION).toBeGreaterThan(0.7);
    expect(SPARK_REST_SCREEN_FRACTION).toBeLessThan(0.9);
  });
});