import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { DriftingBlockerArt } from '../src/obstacles/DriftingBlockerArt';
import { DriftingBlockerObstacle, driftPosition } from '../src/obstacles/DriftingBlockerObstacle';
import { createSecurityGate, layoutSecurityGate } from '../src/obstacles/SecurityGateVisual';
import { createRotorVisual, syncRotorHousing } from '../src/obstacles/RotorVisuals';
import { disposeObject3D } from '../src/obstacles/RotorGeometry';
import type { DriftingBlockerConfig } from '../src/config/ObstacleConfig';

const drift = (overrides: Partial<DriftingBlockerConfig> = {}): DriftingBlockerConfig => ({
  type: 'driftingBlocker',
  z: 6,
  baseX: 0,
  baseY: 3,
  blockerRadius: 0.45,
  amplitudeX: 0.9,
  amplitudeY: 0.55,
  speed: 0.7,
  phase: 0.2,
  ...overrides,
});

describe('DriftingBlockerArt', () => {
  it('builds sculpted rock, path, wake, and hub', () => {
    const art = new DriftingBlockerArt(drift());
    expect(art.group.getObjectByName('drift-rock')).toBeTruthy();
    expect(art.group.getObjectByName('drift-path')).toBeTruthy();
    expect(art.group.getObjectByName('drift-wake')).toBeTruthy();
    expect(art.group.getObjectByName('drift-hub')).toBeTruthy();
    art.update(1.4);
    const rock = art.group.getObjectByName('drift-rock')!;
    expect(Math.hypot(rock.position.x, rock.position.y)).toBeGreaterThan(0.1);
    art.dispose();
  });

  it('keeps authoritative drift positions through the obstacle wrapper', () => {
    const obstacle = new DriftingBlockerObstacle('test-drift');
    const config = drift({ blockerRadius: 0.5 });
    obstacle.applyConfig(config, 'space');
    expect(obstacle.group.getObjectByName('drifting-blocker-art')).toBeTruthy();
    obstacle.update(0.016, 0.8);
    const expected = driftPosition(config, 0.8);
    expect(obstacle.blockerX).toBeCloseTo(expected.x, 5);
    expect(obstacle.blockerY).toBeCloseTo(expected.y, 5);
    expect(obstacle.predictState(0, 0.8).blockerRadius).toBe(0.5);
    obstacle.hide();
  });
});

describe('sliding gate opening teach', () => {
  it('places corner chevrons on the live opening', () => {
    const gate = createSecurityGate('workshop');
    layoutSecurityGate(gate, 0.2, 3.1, 1.6, 2.2);
    const corner = gate.getObjectByName('opening-corner-0')!;
    expect(corner.visible).toBe(true);
    expect(corner.position.x).toBeCloseTo(0.2 - 1.6 / 2 + 0.08, 5);
    disposeObject3D(gate);
  });
});

describe('rotor tip wake', () => {
  it('pulses tip wakes with housing sync', () => {
    const visual = createRotorVisual('workshop', 3);
    const wake = visual.getObjectByName('tip-wake') as THREE.Mesh;
    expect(wake).toBeTruthy();
    syncRotorHousing(visual, 1.2);
    const mat = wake.material as THREE.MeshStandardMaterial;
    expect(mat.opacity).toBeGreaterThan(0.3);
    disposeObject3D(visual);
  });
});
