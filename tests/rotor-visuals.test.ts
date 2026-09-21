import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { createRotorVisual } from '../src/obstacles/RotorVisuals';
import { RotorObstacle } from '../src/obstacles/RotorObstacle';
import { GAME_TUNING } from '../src/game/gameTuning';
import { disposeObject3D } from '../src/obstacles/RotorGeometry';

describe('security rotor presentation', () => {
  it('uses the full collision arm silhouette in every environment', () => {
    for (const environment of ['workshop', 'rooftop', 'space'] as const) {
      const visual = createRotorVisual(environment, 3);
      const arms = visual.children.filter(child => child.name === 'security-arm');
      expect(arms).toHaveLength(3);
      for (const arm of arms) {
        const body = arm.getObjectByName('collision-arm') as THREE.Mesh;
        expect(body.scale.x).toBe(GAME_TUNING.rotor.bladeLength);
        expect(body.scale.y).toBe(GAME_TUNING.rotor.bladeWidth);
        expect(body.scale.z).toBe(GAME_TUNING.rotor.bladeDepth);
      }
      disposeObject3D(visual);
    }
  });
  it('keeps housing stationary through randomized load, movement and reset', () => {
    const rotor = new RotorObstacle('test');
    rotor.applyConfig({ z: 6, bladeCount: 2, rotationSpeed: 0.55, direction: 1, initialRotation: 1.73 }, 'workshop');
    const housing = rotor.group.getObjectByName('stationary-housing')!;
    const verify = () => {
      rotor.group.updateMatrixWorld(true);
      expect(housing.getWorldQuaternion(new THREE.Quaternion()).angleTo(new THREE.Quaternion())).toBeCloseTo(0);
    };
    verify();
    const predicted = rotor.predictState(0.5, 0);
    rotor.update(0.5, 0.5);
    expect(rotor.angle).toBeCloseTo(predicted.angle);
    verify();
    rotor.resetClock();
    expect(rotor.angle).toBeCloseTo(1.73);
    verify();
    disposeObject3D(rotor.group);
  });
});
