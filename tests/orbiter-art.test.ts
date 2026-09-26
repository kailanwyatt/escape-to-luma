import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createOrbitalIris, layoutOrbitalIris } from '../src/obstacles/OrbitalIrisVisual';
import { OrbiterArt } from '../src/obstacles/OrbiterArt';
import { OrbiterObstacle } from '../src/obstacles/OrbiterObstacle';
import { disposeObject3D } from '../src/obstacles/RotorGeometry';
import type { OrbiterConfig } from '../src/config/ObstacleConfig';

describe('orbital iris set dressing', () => {
  it('ships status bezel, depth cuff, and seal ticks', () => {
    const root = createOrbitalIris();
    expect(root.getObjectByName('iris-status-bezel')).toBeTruthy();
    expect(root.getObjectByName('iris-depth-cuff')).toBeTruthy();
    expect(root.getObjectByName('iris-seal-tick-0')).toBeTruthy();
    layoutOrbitalIris(root, 0.2);
    const bezel = root.getObjectByName('iris-status-bezel') as THREE.Mesh;
    expect(bezel.scale.x).toBeCloseTo(0.2, 5);
    const tick = root.getObjectByName('iris-seal-tick-0') as THREE.Mesh;
    expect(tick.visible).toBe(true);
    layoutOrbitalIris(root, 1.4);
    expect(tick.visible).toBe(false);
    disposeObject3D(root);
  });
});

const orbiter = (overrides: Partial<OrbiterConfig> = {}): OrbiterConfig => ({
  type: 'orbiter',
  z: 6,
  centerX: 0,
  centerY: 3,
  orbitRadius: 1.2,
  blockerRadius: 0.35,
  speed: 0.8,
  phase: 0,
  ...overrides,
});

describe('OrbiterArt', () => {
  it('builds satellite, orbit rail, chevrons, hub, and wake', () => {
    const art = new OrbiterArt(orbiter(), 'space');
    expect(art.group.getObjectByName('orbiter-body')).toBeTruthy();
    expect(art.group.getObjectByName('orbit-path')).toBeTruthy();
    expect(art.group.getObjectByName('orbit-chevron-0')).toBeTruthy();
    expect(art.group.getObjectByName('orbit-hub')).toBeTruthy();
    expect(art.group.getObjectByName('orbit-wake')).toBeTruthy();
    art.update(1.1);
    const body = art.group.getObjectByName('orbiter-body')!;
    expect(Math.hypot(body.position.x, body.position.y)).toBeCloseTo(1.2, 2);
    art.dispose();
  });

  it('wires through OrbiterObstacle without changing hit radius', () => {
    const obstacle = new OrbiterObstacle('test-orbiter');
    const config = orbiter({ blockerRadius: 0.4 });
    obstacle.applyConfig(config, 'rooftop');
    expect(obstacle.group.getObjectByName('orbiter-art')).toBeTruthy();
    obstacle.update(0.016, 0.5);
    const predicted = obstacle.predictState(0, 0.5);
    expect(predicted.blockerRadius).toBe(0.4);
    obstacle.hide();
  });
});
